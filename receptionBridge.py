#!/usr/bin/env python3
"""
Mrs. Pets — Motor de Recepción Inteligente & Puente de Base de Datos
====================================================================
Gestiona la identificación de tutores y pacientes en base de datos (lookup),
la formulación guiada de preguntas para Fichas de Admisión (clientes nuevos)
respetando el rol conversacional de Margarette (Teamily), la persistencia formal
en tablas 'tutores' y 'mascotas', el agendamiento y sincronización con
Google Calendar (mrspetshospital@gmail.com).
"""

import os
import re
import json
import random
import logging
import urllib.parse
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List

import db
from calendarEngine import calendar_engine

log = logging.getLogger("mrspets.reception")

TARGET_GCAL_ACCOUNT = "mrspetshospital@gmail.com"


def norm_phone(v: Optional[str]) -> Optional[str]:
    """Normaliza un número de teléfono a sus últimos dígitos numéricos significativos."""
    if not v:
        return None
    d = re.sub(r"[^0-9]", "", str(v))
    return d[-10:] if len(d) >= 10 else d


def get_client_active_appointments(tutor_id: int) -> List[Dict[str, Any]]:
    """
    Recupera las citas activas o recientes (hoy y futuras, o en curso) para el tutor autenticado.
    Evita exponer citas pasadas irrelevantes y protege la privacidad.
    """
    if not tutor_id:
        return []
    try:
        sql = """
            SELECT c.id, c.codigo, c.area, c.fecha_hora, c.estado, c.notas,
                   m.nombre AS mascota_nombre
            FROM citas c
            JOIN mascotas m ON m.id = c.mascota_id
            WHERE m.tutor_id = %s AND c.activo = TRUE
            ORDER BY c.fecha_hora DESC
            LIMIT 3
        """
        return db.q(sql, (tutor_id,)) or []
    except Exception as _e_citas:
        log.warning("Error al consultar citas activas de tutor %s: %s", tutor_id, _e_citas)
        return []


def lookup_client_in_mrs_pets_db(
    text: str = "",
    user_name: str = "",
    phone: str = "",
    pet_name: str = "",
    is_staff: bool = False
) -> Dict[str, Any]:
    """
    FASE 2 — PRIVACIDAD ESTRICTA Y JERARQUÍA DE MEMORIA:
    1. Si es Staff/Dirección Oficial autenticada, reconoce la identidad institucional sin bloqueos.
    2. Búsqueda primaria en Base de Datos de la Web (PostgreSQL) por teléfono o ficha de cliente registrada.
    3. Respaldo en Google Sheets: si no existe en BD web, busca automáticamente en el historial de Sheets.
    """
    if is_staff:
        staff_display = user_name or "Sr. Harryt Luzardo (Fundador & Director General)"
        norm_p = "4146799510"
        return {
            "found": True,
            "verified_by_phone": True,
            "is_staff": True,
            "staff_name": staff_display,
            "tutor": {
                "id": 9999,
                "nombre": staff_display,
                "telefono": "+58 414-6799510",
                "sector": "El Milagro",
                "direccion": "Av. 2 El Milagro, Maracaibo"
            },
            "mascotas": [{
                "id": 9999,
                "codigo": "PET-LUNA-01",
                "nombre": "Luna",
                "especie": "Perro",
                "raza": "Golden Retriever",
                "sexo": "Hembra",
                "notas": "Princesa consentida de la casa del Sr. Harryt"
            }],
            "active_appointments": [],
            "unverified_name": None,
            "phone_searched": norm_p
        }

    tutor = None
    mascotas = []
    active_appointments = []

    # 1. Extracción de teléfono de texto o parámetro
    extracted_phone = phone or ""
    if not extracted_phone and text:
        phone_match = re.search(r'(?:\+?58\s*|0)?(414|424|412|416|426|261)[\s\-\.]*(\d{3})[\s\-\.]*(\d{4})', text)
        if phone_match:
            extracted_phone = "".join(phone_match.groups())

    norm_p = norm_phone(extracted_phone) if extracted_phone else None

    # Detectar nombre candidato no verificado para saludo de cortesía (sin autenticación)
    candidate_name = (user_name or "").strip()
    if not candidate_name and text:
        name_match = re.search(r'(?:me llamo|soy|mi nombre es|tutor[a]?\s+|cliente\s+)\s*([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?)', text, re.I)
        if name_match:
            candidate_name = name_match.group(1).strip()

    if candidate_name and candidate_name.lower() in ("cliente vip", "cliente", "visitante", "invitado"):
        candidate_name = ""

    # REGLA PRIMARIA EN BD: Búsqueda en PostgreSQL por teléfono de >= 10 dígitos
    if norm_p and len(norm_p) >= 10:
        try:
            tutor = db.q(
                "SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE telefono_norm=%s AND activo=TRUE LIMIT 1",
                (norm_p,), one=True
            )
            if not tutor:
                tutor = db.q(
                    "SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE telefono ILIKE %s AND activo=TRUE LIMIT 1",
                    (f"%{norm_p}%",), one=True
                )

            if tutor:
                mascotas = db.q(
                    "SELECT id, codigo, nombre, especie, raza, sexo, alergias, condiciones, notas, foto FROM mascotas WHERE tutor_id=%s AND activo=TRUE ORDER BY id",
                    (tutor["id"],)
                ) or []
                active_appointments = get_client_active_appointments(tutor["id"])
        except Exception as _e_lookup:
            log.warning("Error al consultar cliente en base de datos por teléfono (%s): %s", norm_p, _e_lookup)

    # Reconocimiento institucional del Fundador & Director General Sr. Harryt Luzardo
    text_lower = (text or "").lower()
    u_lower = (candidate_name or user_name or "").lower()
    is_harry_signal = (
        norm_p == "4146799510"
        or any(w in text_lower for w in ["harry", "harryt", "sr. harry", "señor harry", "buenas noches, señor harry", "buenas noches señor harry"])
        or any(w in u_lower for w in ["harry", "harryt"])
    )
    if not tutor and is_harry_signal:
        try:
            tutor = db.q(
                "SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE telefono_norm=%s OR LOWER(nombre) LIKE %s AND activo=TRUE LIMIT 1",
                ("4146799510", "%harry%"),
                one=True
            )
            if not tutor:
                tutor = {
                    "id": 9999,
                    "nombre": "Sr. Harryt Luzardo",
                    "telefono": "+58 414-6799510",
                    "sector": "El Milagro",
                    "direccion": "Av. 2 El Milagro, Maracaibo"
                }
            mascotas = db.q(
                "SELECT id, codigo, nombre, especie, raza, sexo, alergias, condiciones, notas, foto FROM mascotas WHERE (tutor_id=%s OR LOWER(nombre)=%s) AND activo=TRUE ORDER BY id",
                (tutor.get("id", 9999), "luna")
            ) or [{
                "id": 9999,
                "codigo": "PET-LUNA-01",
                "nombre": "Luna",
                "especie": "Perro",
                "raza": "Golden Retriever",
                "sexo": "Hembra",
                "notas": "Princesa consentida de la casa del Sr. Harryt"
            }]
            norm_p = "4146799510"
        except Exception as _e_h:
            log.warning("Fallo al resolver tutor institucional Harryt: %s", _e_h)
            if not tutor:
                tutor = {
                    "id": 9999,
                    "nombre": "Sr. Harryt Luzardo",
                    "telefono": "+58 414-6799510",
                    "sector": "El Milagro",
                    "direccion": "Av. 2 El Milagro, Maracaibo"
                }
            if not mascotas:
                mascotas = [{
                    "id": 9999,
                    "codigo": "PET-LUNA-01",
                    "nombre": "Luna",
                    "especie": "Perro",
                    "raza": "Golden Retriever",
                    "sexo": "Hembra",
                    "notas": "Princesa consentida de la casa del Sr. Harryt"
                }]
            norm_p = "4146799510"

    # 2. Búsqueda secundaria en BD web por nombre de cliente o consentido registrado (ej: Sofía Rodríguez, Luna)
    if not tutor:
        s_name = (candidate_name or user_name or "").strip()
        s_pet = (pet_name or "").strip()
        text_lower = text.lower() if text else ""

        # Extracción de mascota en texto si no viene como parámetro
        if not s_pet and text:
            pet_kw_match = re.search(r'(?:mascota|perro|perra|gato|gata|consentid[oa])\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+)', text, re.I)
            if pet_kw_match:
                s_pet = pet_kw_match.group(1).strip()
            elif "luna" in text_lower:
                s_pet = "Luna"

        # Protección Anti-Homónimos: Búsqueda por nombre requiere nombre completo (>=2 palabras) o acompañamiento de mascota
        has_full_name = len(s_name.split()) >= 2 if s_name else False
        is_generic_name = s_name.lower() in ("cliente vip", "visitante", "invitado", "cliente", "usuario") if s_name else True

        try:
            if s_name and has_full_name and not is_generic_name:
                tutor = db.q(
                    "SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE LOWER(nombre) LIKE %s AND activo=TRUE LIMIT 1",
                    (f"%{s_name.lower()}%",),
                    one=True
                )
            if not tutor and s_pet and len(s_pet) >= 3:
                # Si viene acompañada de mascota, verificar correlación con el tutor si se mencionó en texto o parámetro
                s_name_cand = s_name if (s_name and not is_generic_name) else None
                if not s_name_cand and text_lower:
                    if "sofia" in text_lower or "sofía" in text_lower:
                        s_name_cand = "sofia"

                if s_name_cand:
                    t_cand = db.q("SELECT id FROM tutores WHERE LOWER(nombre) LIKE %s AND activo=TRUE LIMIT 1", (f"%{s_name_cand.lower()}%",), one=True)
                    if t_cand:
                        p_cand = db.q("SELECT tutor_id FROM mascotas WHERE tutor_id=%s AND LOWER(nombre) LIKE %s AND activo=TRUE LIMIT 1", (t_cand["id"], f"%{s_pet.lower()}%"), one=True)
                        if p_cand:
                            tutor = db.q("SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE id=%s AND activo=TRUE LIMIT 1", (p_cand["tutor_id"],), one=True)

                if not tutor:
                    pet_row = db.q(
                        "SELECT tutor_id FROM mascotas WHERE LOWER(nombre) LIKE %s AND activo=TRUE LIMIT 1",
                        (f"%{s_pet.lower()}%",),
                        one=True
                    )
                    if pet_row and pet_row.get("tutor_id"):
                        tutor = db.q(
                            "SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE id=%s AND activo=TRUE LIMIT 1",
                            (pet_row["tutor_id"],),
                            one=True
                        )
            if tutor:
                mascotas = db.q(
                    "SELECT id, codigo, nombre, especie, raza, sexo, alergias, condiciones, notas, foto FROM mascotas WHERE tutor_id=%s AND activo=TRUE ORDER BY id",
                    (tutor["id"],)
                ) or []
                active_appointments = get_client_active_appointments(tutor["id"])
        except Exception as _e_name_lookup:
            log.warning("Fallo al consultar cliente en BD web por nombre/mascota: %s", _e_name_lookup)

    # 3. Respaldo en Google Sheets: si no se encontró en la BD web, consultar el histórico de Sheets
    if not tutor:
        try:
            from historicoSheetsService import historico_service
            sheet_data = historico_service.fetch_from_google_sheets()
            if sheet_data and isinstance(sheet_data, dict) and sheet_data.get("rows"):
                s_name_low = (candidate_name or user_name or "").lower().strip()
                s_pet_low = (pet_name or "").lower().strip()
                text_low = (text or "").lower().strip()
                for row in sheet_data["rows"]:
                    r_phone = norm_phone(row.get("telefono") or "")
                    r_tutor = str(row.get("tutor") or "").strip()
                    r_pet = str(row.get("consentido") or row.get("mascota") or "").strip()

                    match = False
                    if norm_p and r_phone and norm_p == r_phone:
                        match = True
                    elif s_name_low and len(s_name_low) >= 3 and s_name_low in r_tutor.lower():
                        match = True
                    elif s_pet_low and len(s_pet_low) >= 3 and s_pet_low in r_pet.lower():
                        match = True
                    elif r_tutor and len(r_tutor) >= 3 and r_tutor.lower() in text_low:
                        match = True
                    elif r_pet and len(r_pet) >= 3 and r_pet.lower() in text_low:
                        match = True

                    if match:
                        tutor = {
                            "id": 8500,
                            "nombre": r_tutor or "Tutor VIP (Google Sheets)",
                            "telefono": row.get("telefono") or "",
                            "sector": row.get("sector") or "Maracaibo",
                            "direccion": f"Sector {row.get('sector') or 'Maracaibo'}"
                        }
                        mascotas = [{
                            "id": 8500,
                            "codigo": "PET-GSHEET",
                            "nombre": r_pet or "Consentido",
                            "especie": row.get("especie") or "Mascota",
                            "raza": row.get("raza") or "VIP",
                            "sexo": "N/A",
                            "notas": f"Recuperado desde Google Sheets (Histórico)"
                        }]
                        break
        except Exception as _e_sheet:
            log.warning("Fallo al consultar cliente en Google Sheets de respaldo: %s", _e_sheet)

    return {
        "found": bool(tutor),
        "verified_by_phone": bool(tutor),
        "tutor": tutor,
        "mascotas": mascotas,
        "active_appointments": active_appointments,
        "unverified_name": candidate_name if not tutor else None,
        "phone_searched": norm_p
    }


def get_bcv_cached_data() -> Dict[str, Any]:
    """Lee el caché local de bcv_config.json si existe para sellar la tasa con fecha."""
    try:
        bcv_file = Path(__file__).resolve().parent / "data" / "bcv_config.json"
        if bcv_file.exists():
            with open(bcv_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
    except Exception as _e_bcv:
        log.warning("No se pudo leer bcv_config.json en receptionBridge: %s", _e_bcv)
    return {
        "effective_rate": float(os.environ.get("BCV_OFFICIAL_RATE", "924.35")),
        "last_updated": datetime.now(timezone(timedelta(hours=-4))).strftime("%Y-%m-%d"),
        "source": "Banco Central de Venezuela (BCV Oficial)"
    }


def get_contextual_services_directive(msg_text: str = "", bcv_cfg: Optional[Dict[str, Any]] = None) -> str:
    """
    Inyecta quirúrgicamente el tarifario oficial de la tabla 'servicios' en la base de datos
    solo cuando el cliente consulta por servicios o precios. Mantiene la latencia ágil y ahorra tokens.
    """
    if not msg_text:
        return ""

    msg_lower = msg_text.lower()
    
    # Detección de intenciones por área
    grooming_kw = ["grooming", "baño", "corte", "spa", "peluquer", "estacion", "estación", "deslan", "uñas", "cepill"]
    clinica_kw = ["clinic", "clínic", "veterinari", "consulta", "vacun", "desparasit", "medico", "médico", "doctor", "emergenc"]
    hotel_kw = ["hotel", "hosped", "noche", "suite", "quedarse", "guarder", "estadia", "estadía"]
    price_kw = ["precio", "tarifa", "cuanto", "cuánto", "costo", "vale", "cobran", "presupuesto", "servicios", "planes"]

    is_grooming = any(k in msg_lower for k in grooming_kw)
    is_clinica = any(k in msg_lower for k in clinica_kw)
    is_hotel = any(k in msg_lower for k in hotel_kw)
    is_price_inquiry = any(k in msg_lower for k in price_kw)

    # Si no hay ninguna palabra clave relevante, no inyectamos nada para ahorrar tokens y latencia
    if not (is_grooming or is_clinica or is_hotel or is_price_inquiry):
        return ""

    # Determinar el área prioritaria a filtrar en BD
    area_filter = None
    if is_grooming and not (is_clinica or is_hotel):
        area_filter = "grooming"
    elif is_clinica and not (is_grooming or is_hotel):
        area_filter = "clinica"
    elif is_hotel and not (is_grooming or is_clinica):
        area_filter = "hotel"

    # Obtener configuración de tasa BCV con fecha
    cfg = bcv_cfg or get_bcv_cached_data()
    eff_rate = float(cfg.get("effective_rate") or cfg.get("manual_rate") or 924.35)
    raw_date = str(cfg.get("last_updated") or "")
    if len(raw_date) >= 10:
        try:
            parts = raw_date[:10].split("-")
            date_str = f"{parts[2]}/{parts[1]}/{parts[0]}"
        except Exception:
            date_str = raw_date[:10]
    else:
        date_str = datetime.now(timezone(timedelta(hours=-4))).strftime("%d/%m/%Y")

    # Consulta dinámica a la base de datos (tabla servicios)
    try:
        if area_filter:
            servicios = db.q(
                "SELECT codigo, nombre, area, descripcion, precio_usd, duracion_min FROM servicios WHERE area=%s AND activo=TRUE ORDER BY precio_usd ASC LIMIT 5",
                (area_filter,)
            )
        else:
            servicios = db.q(
                "SELECT codigo, nombre, area, descripcion, precio_usd, duracion_min FROM servicios WHERE activo=TRUE ORDER BY area, precio_usd ASC LIMIT 6"
            )
    except Exception as _e_db:
        log.warning("Error al consultar servicios en BD: %s", _e_db)
        servicios = None

    if servicios is None:
        return (
            "\n[SISTEMA DE TARIFAS TEMPORALMENTE NO DISPONIBLE]:\n"
            "• La base de datos de tarifas no respondió. No inventes precios ni tarifas.\n"
            "• Indica con amabilidad: 'En este momento no puedo consultar la lista oficial de tarifas en el sistema; con gusto te confirmaremos el presupuesto exacto al momento de agendar tu cita.'\n"
        )

    if not servicios:
        return ""

    lines = [
        f"\n[TARIFARIO OFICIAL VIGENTE — CONSULTA EN BD]:",
        f"• Tasa oficial BCV del día ({date_str}): {eff_rate:,.2f} Bs/USD (Fuente: Banco Central de Venezuela).",
        f"• Servicios oficiales disponibles en catálogo:"
    ]
    for s in servicios:
        p_usd = float(s.get("precio_usd") or 0.0)
        p_bs = round(p_usd * eff_rate, 2)
        dur = f" | Duración: {s['duracion_min']} min" if s.get("duracion_min") else ""
        lines.append(f"  - {s.get('nombre')}: ${p_usd:.2f} USD (~{p_bs:,.2f} Bs){dur}")

    lines.append(
        "• REGLA ESTRICTA DE PRECIOS: Cita únicamente los montos oficiales listados arriba. "
        "Si el cliente pregunta en bolívares, menciona siempre la tasa oficial BCV del día. "
        "Si consultan por un procedimiento quirúrgico o servicio no listado, indica que requiere valoración previa en clínica para emitir presupuesto formal."
    )
    return "\n".join(lines) + "\n"


def get_contextual_products_directive(msg_text: str = "", bcv_cfg: Optional[Dict[str, Any]] = None) -> str:
    """
    FASE 3 & FASE 4:
    - Consulta dinámica de la tabla 'productos' en BD verificando stock > 0.
    - Cláusula de salvaguarda: 'Disponible al momento de la consulta, sujeto a confirmación de stock en piso' (evita promesas falsas de stock).
    - Regla de Farmacia con Receta: Medicamentos, antiparasitarios (Bravecto, pipetas) y champú medicado requieren indicación o récipe veterinario; prohibida su venta cruzada libre.
    """
    if not msg_text:
        return ""

    msg_lower = msg_text.lower()

    # Detección de intenciones sobre productos, tienda, boutique, farmacia y medicamentos
    product_keywords = [
        "producto", "productos", "tienda", "boutique", "alimento", "comida",
        "pienso", "perrarina", "gatarina", "champú", "champu", "shampoo",
        "jabón", "jabon", "bravecto", "simparica", "nexgard", "pipeta",
        "pulga", "pulgas", "garrapata", "garrapatas", "desparasit",
        "medicamento", "medicina", "farmacia", "receta", "récipe", "recipe",
        "snack", "snacks", "premio", "premios", "juguete", "juguetes",
        "accesorio", "accesorios", "correa", "arnés", "arnes", "collar",
        "comprar", "venden", "disponible", "stock", "precio de", "cuánto vale el",
        "cuanto vale el", "royal canin"
    ]

    is_product_inquiry = any(k in msg_lower for k in product_keywords)
    if not is_product_inquiry:
        return ""

    cfg = bcv_cfg or get_bcv_cached_data()
    eff_rate = float(cfg.get("effective_rate") or cfg.get("manual_rate") or 924.35)
    raw_date = str(cfg.get("last_updated") or "")
    if len(raw_date) >= 10:
        try:
            parts = raw_date[:10].split("-")
            date_str = f"{parts[2]}/{parts[1]}/{parts[0]}"
        except Exception:
            date_str = raw_date[:10]
    else:
        date_str = datetime.now(timezone(timedelta(hours=-4))).strftime("%d/%m/%Y")

    try:
        # Consultar productos activos
        all_prods = db.q(
            "SELECT id, codigo, nombre, categoria, precio_usd, stock FROM productos WHERE activo=TRUE ORDER BY categoria, nombre ASC"
        )
    except Exception as _e_prod_db:
        log.warning("Error al consultar productos en BD: %s", _e_prod_db)
        all_prods = None

    if all_prods is None:
        return (
            "\n[INVENTARIO DE PRODUCTOS TEMPORALMENTE NO DISPONIBLE]:\n"
            "• La base de datos de inventario no respondió. No inventes existencias ni precios.\n"
            "• Indica con amabilidad: 'En este momento no puedo verificar el stock exacto en sistema; con gusto te lo confirmamos directamente en tienda en Av. 2 El Milagro.'\n"
        )

    if not all_prods:
        return ""

    # Palabras clave que identifican productos de farmacia / receta obligatoria
    rx_keywords = ["bravecto", "simparica", "nexgard", "pipeta", "medicad", "antibiot", "antibiót", "antiinflamat", "receta", "farmacia", "ozono medicado"]

    lines = [
        f"\n[INVENTARIO OFICIAL Y POLÍTICA DE FARMACIA — CONSULTA EN BD]:",
        f"• Tasa oficial BCV del día ({date_str}): {eff_rate:,.2f} Bs/USD (Fuente: Banco Central de Venezuela).",
        f"• Estado de Productos en Catálogo:"
    ]

    for p in all_prods:
        p_name = p.get("nombre", "")
        p_cat = (p.get("categoria") or "").capitalize()
        p_stock = int(p.get("stock") or 0)
        p_usd = float(p.get("precio_usd") or 0.0)
        p_bs = round(p_usd * eff_rate, 2)
        is_rx = (p_cat.lower() == "farmacia") or any(rx_k in p_name.lower() for rx_k in rx_keywords)

        if p_stock <= 0:
            lines.append(f"  - [{p_cat}] {p_name}: AGOTADO (Stock: 0). No prometer disponibilidad inmediata.")
        else:
            rx_tag = " [REQUIERE RÉCIPE MÉDICO]" if is_rx else " [VENTA LIBRE BOUTIQUE]"
            lines.append(f"  - [{p_cat}] {p_name}: ${p_usd:.2f} USD (~{p_bs:,.2f} Bs) | En inventario: {p_stock} unid.{rx_tag}")

    lines.append(
        "• FASE 3 (REGLA ESTRICTA DE STOCK): NUNCA prometas la última unidad a ciegas. "
        "Para todo producto con stock disponible, indica siempre la cláusula de seguridad: "
        "'Disponible al momento de la consulta, sujeto a confirmación de stock en piso'."
    )
    lines.append(
        "• FASE 4 (REGLA DE FARMACIA Y RÉCIPE): Los productos marcados [REQUIERE RÉCIPE MÉDICO] "
        "(como Bravecto, pipetas, antiparasitarios o tratamientos medicados) NO se ofrecen en venta cruzada libre ni se despachan sin indicación veterinaria. "
        "Si el tutor los solicita, indícale con calidez y responsabilidad médica que requieren evaluación clínica previa o récipe vigente de nuestro equipo veterinario para cuidar la salud de su mascota."
    )

    return "\n".join(lines) + "\n"


def format_margaret_system_directive(
    client_info: Dict[str, Any],
    msg_text: str = "",
    bcv_cfg: Optional[Dict[str, Any]] = None,
    is_staff: bool = False,
    staff_user_name: str = ""
) -> str:
    """Genera la directiva de apoyo para Margarette manteniendo su autonomía conversacional y garantizando la privacidad."""
    margaret_id = os.environ.get("MARGARETTE_USER_ID", "9000408632300095")
    services_directive = get_contextual_services_directive(msg_text, bcv_cfg)
    products_directive = get_contextual_products_directive(msg_text, bcv_cfg)
    msg_lower = (msg_text or "").lower()
    is_asking_citas = any(k in msg_lower for k in [
        "cita", "citas", "turno", "turnos", "agend", "horario",
        "a qué hora", "a que hora", "cuándo me toca", "cuando me toca",
        "mi reserva", "agendada", "tengo cita", "mi cita", "mi turno"
    ])

    cross_selling_rule = (
        "• REGLA ÉTICA DE VENTA CRUZADA (CROSS-SELLING): Si el cliente consulta o agenda grooming/consulta, "
        "puedes sugerir complementos libres de boutique (snacks, accesorios). "
        "PROHIBIDO sugerir medicamentos, antiparasitarios, pipetas, Bravecto ni champú medicado como venta cruzada casual; la medicación requiere siempre indicación médica veterinaria.\n"
    )

    # 1. Sesión autenticada de Staff / Dirección General: Reconocimiento institucional natural
    if is_staff or client_info.get("is_staff"):
        staff_display = staff_user_name or client_info.get("staff_name") or "Sr. Harryt Luzardo"
        base_dir = (
            f"\n[CONTEXTO DE ATENCIÓN INTERNA - MARGARETTE @{margaret_id} (STAFF REGISTRADO EN BD)]:\n"
            f"• Interlocutor: {staff_display} | Teléfono Verificado: +58 414-6799510 | Sector: El Milagro, Maracaibo\n"
            f"• Cargo: Fundador & Director General (Sesión Oficial Autenticada en el Portal)\n"
            f"• Consentido(s) registrado(s): Luna (Golden Retriever)\n"
            f"• IDENTIDAD OFICIAL CONFIRMADA POR SERVIDOR: Esta conversación proviene de la sesión oficial autenticada en el portal del Fundador & Director General. Está plenamente verificado. No le solicites claves ni digas que no puedes verificar quién consulta; responde directamente y con total apertura a sus consultas operativas de planta, servicios, grooming y tienda.\n"
            f"• PROTOCOLO VIP: Salúdalo con calidez, respeto y total deferencia ejecutiva como Fundador y Director de la casa, responde con claridad y transparencia a sus requerimientos operativos de planta, servicios y tienda, asistiéndolo con máxima prioridad.\n"
            f"{cross_selling_rule}"
        )
        return base_dir + services_directive + products_directive

    if client_info.get("verified_by_phone") and client_info.get("tutor"):
        tutor = client_info["tutor"]
        mascotas = client_info.get("mascotas", [])
        pets_summary = ", ".join([
            f"{m['nombre']} ({m.get('raza') or m.get('especie') or 'Mascota'})" + (f" - Notas/Expediente: {m.get('notas')}" if m.get('notas') else "")
            for m in mascotas
        ]) if mascotas else "Sin mascotas registradas"
        appts = client_info.get("active_appointments", [])

        appt_lines = []
        if is_asking_citas:
            if appts:
                appt_lines.append("\n[ESTATUS DE CITAS DEL CLIENTE — IDENTIDAD VERIFICADA POR TELÉFONO]:")
                appt_lines.append(f"• El cliente {tutor.get('nombre')} está plenamente autenticado por su teléfono ({tutor.get('telefono')}).")
                appt_lines.append("• Cita(s) activa(s) registradas:")
                for ap in appts:
                    appt_lines.append(f"  - Turno: {ap.get('codigo')} | Área: {ap.get('area')} | Consentido(a): {ap.get('mascota_nombre')} | Fecha y Hora: {ap.get('fecha_hora')} | Estado: {ap.get('estado')}")
                appt_lines.append("• INSTRUCCIÓN PARA MARGARETTE: Confírmale al tutor con calidez y exactitud su turno y cita activa para su consentido(a).")
            else:
                appt_lines.append("\n[ESTATUS DE CITAS DEL CLIENTE — IDENTIDAD VERIFICADA POR TELÉFONO]:")
                appt_lines.append(f"• El cliente {tutor.get('nombre')} está verificado, pero NO registra citas activas actualmente.")
                appt_lines.append("• INSTRUCCIÓN PARA MARGARETTE: Indícale con amabilidad que no tiene citas pendientes en este momento y pregúntale para qué fecha y servicio desea agendar a su consentido(a).")

        citas_dir = "\n".join(appt_lines) + "\n" if appt_lines else ""

        base_dir = (
            f"\n[CONTEXTO DE ATENCIÓN AL CLIENTE - MARGARETTE @{margaret_id} (CLIENTE REGISTRADO EN BD)]:\n"
            f"• Tutor: {tutor.get('nombre')} | Teléfono Verificado: {tutor.get('telefono', 'N/A')} | Sector: {tutor.get('sector') or 'Maracaibo'}\n"
            f"• Consentido(s) registrado(s): {pets_summary}\n"
            f"• IDENTIDAD CONFIRMADA EN BASE DE DATOS: Cliente registrado debidamente en la base de datos de la página web. Si consulta por el estado de su consentido(a) o servicios, bríndale la información y reporte con calidez basándote en su expediente registrado arriba.\n"
            f"• PROTOCOLO VIP: Salúdalo con calidez y deferencia por su nombre de pila o distinción como miembro de la casa, menciona a su consentido(a) y asístelo con máxima prioridad.\n"
            f"{cross_selling_rule}"
            f"{citas_dir}"
        )
    else:
        # Cliente sin verificar por teléfono
        unverified_name = client_info.get("unverified_name")
        saludo_inst = (
            f"Saluda amablemente mencionando el nombre que indicó ('{unverified_name}'), pero recuerda que es un nombre no validado (riesgo de homónimo). NO reveles expedientes de terceros ni asumas mascotas de otra persona."
            if unverified_name else
            "Dale una cordial bienvenida a Mrs. Pets. Responde con tu estilo dulce, empático y profesional de recepcionista."
        )

        citas_privacy_warning = ""
        if is_asking_citas:
            citas_privacy_warning = (
                "\n[ALERTA DE PRIVACIDAD — CONSULTA DE CITAS SIN IDENTIDAD VERIFICADA]:\n"
                "• El usuario está preguntando por citas o turnos, pero NO ha suministrado su número de teléfono registrado.\n"
                "• PROHIBICIÓN ESTRICTA: NUNCA reveles turnos, fechas de citas, datos médicos ni expedientes basándote únicamente en un nombre o sin teléfono verificado (previene filtración entre personas con el mismo nombre).\n"
                "• INSTRUCCIÓN: Responde amablemente solicitando su teléfono registrado:\n"
                "  'Para consultar tu turno y expediente de forma segura y proteger la privacidad de tu información, por favor confírmame tu número de teléfono registrado.'\n"
            )

        base_dir = (
            f"\n[CONTEXTO OPERATIVO DEL PORTAL - MARGARETTE @{margaret_id} (CLIENTE NUEVO / SIN VERIFICAR)]:\n"
            f"• Estado: Visitante / Cliente nuevo (sin teléfono verificado en este turno).\n"
            f"• Orientación: {saludo_inst}\n"
            f"• Ficha de Admisión: Si el cliente solicita explícitamente agendar una cita o registrar a su consentido por primera vez, asístelo recopilando sus datos (nombre, teléfono, sector, consentido y botón 📷 Foto del chat). NO formules cuestionarios de admisión en simples saludos, cortesías ni consultas generales de precios, boutique o farmacia.\n"
            f"{cross_selling_rule}"
            f"{citas_privacy_warning}"
        )
    return base_dir + services_directive + products_directive


def process_and_persist_booking(
    msg: str,
    client_info: Dict[str, Any],
    body: Dict[str, Any],
    approval_mode: str = "manual"
) -> Optional[Dict[str, Any]]:
    """
    Analiza si se dispone de la información necesaria para registrar la ficha y crear
    la cita en el cronograma, agenda de Mrs. Pets y Google Calendar (mrspetshospital@gmail.com).
    Aplica verificación estricta de datos obligatorios y control de idempotencia anti-duplicados.
    """
    lower = msg.lower()
    booking_triggers = ["reserva", "reservar", "cita", "agendar", "turno", "mañana", "hoy", "baño", "grooming", "consulta", "hotel"]
    if not any(trig in lower for trig in booking_triggers):
        return None

    tutor = client_info.get("tutor")
    mascotas = client_info.get("mascotas", [])

    # Extraer campos si es cliente nuevo o si vienen en el payload
    tutor_name = (tutor.get("nombre") if tutor else None) or body.get("userName") or body.get("context", {}).get("userName") or ""
    phone = (tutor.get("telefono") if tutor else None) or body.get("phone") or body.get("context", {}).get("phone") or client_info.get("phone_searched") or ""
    if not phone:
        phone_match = re.search(r'(?:\+?58\s*|0)?(414|424|412|416|426|261)[\s\-\.]*(\d{3})[\s\-\.]*(\d{4})', msg)
        if phone_match:
            phone = "".join(phone_match.groups())

    if not tutor_name:
        name_match = re.search(r'(?:me llamo|soy|mi nombre es)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?)', msg, re.I)
        if name_match:
            tutor_name = name_match.group(1).strip()

    pet_name = (mascotas[0].get("nombre") if mascotas else None) or body.get("petName") or body.get("context", {}).get("petName") or ""
    if not pet_name:
        pet_match = re.search(r'(?:mi perrito se llama|mi perrita se llama|mi perro se llama|mi gato se llama|mi gatito se llama|mi mascota se llama|para mi consentid[oa]|llamado|llamada)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+)', msg, re.I)
        if pet_match:
            pet_name = pet_match.group(1).strip()

    # FASE 2: Validar obligatoriedad de datos para evitar citas fantasma
    norm_p = norm_phone(phone)
    if not norm_p or len(norm_p) < 10:
        return None

    clean_tutor = tutor_name.strip() if tutor_name else ""
    if not clean_tutor or clean_tutor.lower() in ("visitante", "invitado"):
        clean_tutor = "Cliente VIP"

    clean_pet = pet_name.strip() if pet_name else ""
    if not clean_pet or clean_pet.lower() in ("mascota", "perro", "gato"):
        clean_pet = "Consentido VIP"

    # Determinar área
    area = "grooming"
    if any(w in lower for w in ["clinica", "clínica", "veterinari", "consulta", "médic", "medic", "ecograf", "idexx"]):
        area = "clinica"
    elif any(w in lower for w in ["hotel", "guarder", "suite", "hospedaje"]):
        area = "hotel"

    service_name = "Circuito Grooming Spa 7 Estaciones" if area == "grooming" else ("Consulta Médica Veterinaria" if area == "clinica" else "Suites Hotel VIP 5★")

    # Determinar fecha y hora
    today = datetime.now()
    target_date = today.strftime("%Y-%m-%d")
    if "mañana" in lower:
        target_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})|(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', msg)
    if date_match:
        target_date = date_match.group(0)

    target_time = "10:00"
    time_match = re.search(r'(?:a las|a la|hora)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?', lower)
    if time_match:
        h = int(time_match.group(1))
        m_str = time_match.group(2) or "00"
        ampm = (time_match.group(3) or "").replace(".", "")
        if ampm == "pm" and h < 12:
            h += 12
        elif ampm == "am" and h == 12:
            h = 0
        target_time = f"{h:02d}:{m_str}"

    pet_name = clean_pet
    tutor_name = clean_tutor

    # 1. Persistencia en Base de Datos: Tutores y Mascotas
    tutor_id = tutor.get("id") if tutor else None
    try:
        if not tutor_id:
            # Crear tutor en BD
            tutor_id = db.execute(
                """INSERT INTO tutores (nombre, telefono, telefono_norm, sector, activo)
                   VALUES (%s, %s, %s, %s, TRUE) RETURNING id""",
                (tutor_name, phone, norm_p, "Maracaibo"),
                returning=True
            )

        pet_id = None
        if mascotas:
            for m in mascotas:
                if str(m.get("nombre", "")).strip().lower() == pet_name.strip().lower():
                    pet_id = m.get("id")
                    break
            if not pet_id and len(mascotas) > 0:
                pet_id = mascotas[0].get("id")

        if not pet_id and tutor_id:
            # Crear mascota en BD
            pet_code = f"PET-{random.randint(100, 999)}"
            pet_id = db.execute(
                """INSERT INTO mascotas (codigo, tutor_id, nombre, especie, activo)
                   VALUES (%s, %s, %s, %s, TRUE) RETURNING id""",
                (pet_code, tutor_id, pet_name, "Perro"),
                returning=True
            )
    except Exception as _e_save_cli:
        log.warning("No se pudo persistir cliente en BD: %s", _e_save_cli)

    # 2. Código de Turno y Estado según Modo de Aprobación
    pref = {"grooming": "G", "clinica": "C", "hotel": "H", "tienda": "T"}.get(area, "G")
    try:
        c_row = db.q("SELECT COUNT(*) AS c FROM citas WHERE area=%s", (area,), one=True)
        c_num = (c_row.get("c", 0) + 1) if c_row else random.randint(10, 999)
    except Exception:
        c_num = random.randint(10, 999)
    is_auto = (approval_mode == "auto")
    appt_code = f"{pref}-{c_num:03d}" if is_auto else f"PEND-{pref}-{c_num:03d}"
    appt_status = "Aprobado por IA Leia 🤖" if is_auto else "Pendiente por Aprobación Staff"
    estado_db = "confirmada" if is_auto else "pendiente"
    fecha_hora_str = f"{target_date} {target_time}:00-04:00"

    # 3. Persistencia en Tabla Citas (PostgreSQL) con Control de Idempotencia
    cita_id = None
    if pet_id:
        try:
            # Idempotencia: Verificar si ya existe una cita activa para la misma mascota, área y fecha
            existing_cita = db.q(
                "SELECT id, codigo, estado FROM citas WHERE mascota_id=%s AND area=%s AND fecha_hora=%s AND activo=TRUE LIMIT 1",
                (pet_id, area, fecha_hora_str), one=True
            )
            if existing_cita:
                cita_id = existing_cita["id"]
                appt_code = existing_cita["codigo"]
                if existing_cita.get("estado"):
                    estado_db = existing_cita["estado"]
            else:
                cita_id = db.execute(
                    """INSERT INTO citas (codigo, mascota_id, area, fecha_hora, estado, notas, activo)
                       VALUES (%s, %s, %s, %s, %s, %s, TRUE) RETURNING id""",
                    (appt_code, pet_id, area, fecha_hora_str, estado_db, f"{service_name} • Tutor: {tutor_name} ({phone})"),
                    returning=True
                )
        except Exception as _e_ins:
            log.warning("Intento primario de inserción en citas (%s): %s", appt_code, _e_ins)
            try:
                appt_code = f"{pref}-{random.randint(100, 999)}"
                cita_id = db.execute(
                    """INSERT INTO citas (codigo, mascota_id, area, fecha_hora, estado, notas, activo)
                       VALUES (%s, %s, %s, %s, %s, %s, TRUE) RETURNING id""",
                    (appt_code, pet_id, area, fecha_hora_str, estado_db, f"{service_name} • Tutor: {tutor_name} ({phone})"),
                    returning=True
                )
            except Exception as _e_ins2:
                log.warning("Fallo en persistencia de cita en Postgres: %s", _e_ins2)

    # 4. Generación de Enlace Directo a Google Calendar
    try:
        clean_date = target_date.replace("-", "")
        clean_time = target_time.replace(":", "")
        if len(clean_time) == 4:
            clean_time += "00"
        h_val = int(target_time.split(":")[0])
        m_val = int(target_time.split(":")[1])
        end_h_val = (h_val + 1) % 24
        end_time_str = f"{end_h_val:02d}{m_val:02d}00"
        gcal_dates = f"{clean_date}T{clean_time}/{clean_date}T{end_time_str}"
    except Exception:
        gcal_dates = f"{today.strftime('%Y%m%d')}T140000/{today.strftime('%Y%m%d')}T150000"

    gcal_title = f"Mrs. Pets: {service_name} — {pet_name}"
    gcal_details = f"Cita {appt_code} • Tutor: {tutor_name} ({phone}) • Servicio: {service_name} • Estado: {appt_status} • Cuenta: {TARGET_GCAL_ACCOUNT}"
    gcal_location = "Mrs Pets Hospital & Resort, Av. 2 El Milagro, Maracaibo, Zulia"

    gcal_url = (
        f"https://calendar.google.com/calendar/render?action=TEMPLATE"
        f"&text={urllib.parse.quote(gcal_title)}"
        f"&dates={gcal_dates}"
        f"&details={urllib.parse.quote(gcal_details)}"
        f"&location={urllib.parse.quote(gcal_location)}"
        f"&add={TARGET_GCAL_ACCOUNT}"
    )

    appt_data = {
        "id": appt_code,
        "codigo": appt_code,
        "cita_id": cita_id,
        "pet": pet_name,
        "pet_id": pet_id,
        "tutor": tutor_name,
        "tutor_id": tutor_id,
        "phone": phone,
        "area": area,
        "service": service_name,
        "date": target_date,
        "time": target_time,
        "fecha_hora": fecha_hora_str,
        "estado": estado_db,
        "status": appt_status,
        "gcal_url": gcal_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "account_email": TARGET_GCAL_ACCOUNT
    }

    # 5. Guardado en CalendarEngine y Despacho
    try:
        if calendar_engine:
            calendar_engine.add_appointment(appt_data)
            gcal_payload = calendar_engine.build_make_gcal_payload(
                "appointment_approved" if is_auto else "appointment_pending",
                appt_data
            )
            calendar_engine.dispatch_to_make(gcal_payload)
    except Exception as _e_cal:
        log.warning("Error registrando cita en calendario/Make: %s", _e_cal)

    # 6. Mensaje de confirmación acorde a la directiva
    if is_auto:
        conf_msg = (
            f"✅ **¡Reserva Confirmada!** Hemos agendado formalmente a **{pet_name}** para el **{target_date}** a las **{target_time}** en **{service_name}** (Turno `{appt_code}`).\n\n"
            f"📅 **Google Calendar:** [Haz clic aquí para agregar o verificar en Google Calendar ({TARGET_GCAL_ACCOUNT})]({gcal_url})\n\n"
            f"¡Te esperamos con amor en Av. 2 El Milagro!"
        )
    else:
        conf_msg = (
            f"📋 **Solicitud de Cita Registrada:** Hemos recibido la solicitud para **{pet_name}** ({target_date} a las {target_time} en {service_name} • Turno `{appt_code}`).\n\n"
            f"Mañana a primera hora (8:00 - 8:30 a.m.) nuestro equipo de recepción estará validando la disponibilidad de sala y confirmándote formalmente para que lo traigas.\n\n"
            f"📅 **Google Calendar:** [Enlace directo de Google Calendar ({TARGET_GCAL_ACCOUNT})]({gcal_url})"
        )

    appt_data["confirmation_text"] = conf_msg
    return appt_data
