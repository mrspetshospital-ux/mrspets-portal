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
import random
import logging
import urllib.parse
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


def lookup_client_in_mrs_pets_db(
    text: str = "",
    user_name: str = "",
    phone: str = "",
    pet_name: str = ""
) -> Dict[str, Any]:
    """
    Busca al cliente en las tablas 'tutores' y 'mascotas' usando teléfono normalizado,
    cédula/RIF o coincidencia de nombre de tutor/mascota.
    """
    tutor = None
    mascotas = []

    # 1. Extracción de teléfono de texto o parámetro
    extracted_phone = phone or ""
    if not extracted_phone and text:
        phone_match = re.search(r'(?:\+?58\s*|0)?(414|424|412|416|426|261)[\s\-\.]*(\d{3})[\s\-\.]*(\d{4})', text)
        if phone_match:
            extracted_phone = "".join(phone_match.groups())

    norm_p = norm_phone(extracted_phone) if extracted_phone else None

    try:
        # Búsqueda prioritaria por teléfono
        if norm_p and len(norm_p) >= 7:
            tutor = db.q(
                "SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE telefono_norm=%s AND activo=TRUE LIMIT 1",
                (norm_p,), one=True
            )
            if not tutor:
                tutor = db.q(
                    "SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE telefono ILIKE %s AND activo=TRUE LIMIT 1",
                    (f"%{norm_p}%",), one=True
                )

        # Búsqueda por nombre de tutor si no se halló por teléfono
        candidate_name = (user_name or "").strip()
        if not candidate_name and text:
            name_match = re.search(r'(?:me llamo|soy|mi nombre es)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?)', text, re.I)
            if name_match:
                candidate_name = name_match.group(1).strip()

        if not tutor and candidate_name and len(candidate_name) > 2 and candidate_name.lower() not in ("cliente vip", "cliente", "visitante", "invitado"):
            tutor = db.q(
                "SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE nombre ILIKE %s AND activo=TRUE LIMIT 1",
                (f"%{candidate_name}%",), one=True
            )

        # Si se encontró el tutor, buscar sus mascotas asociadas
        if tutor:
            mascotas = db.q(
                "SELECT id, codigo, nombre, especie, raza, sexo, alergias, condiciones, notas, foto FROM mascotas WHERE tutor_id=%s AND activo=TRUE ORDER BY id",
                (tutor["id"],)
            ) or []

        # Si no se encontró por tutor pero viene el nombre de la mascota
        candidate_pet = (pet_name or "").strip()
        if not candidate_pet and text:
            pet_match = re.search(r'(?:mi perrito se llama|mi perrita se llama|mi perro se llama|mi gato se llama|mi gatito se llama|mi mascota se llama|para mi consentid[oa]|llamado|llamada)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+)', text, re.I)
            if pet_match:
                candidate_pet = pet_match.group(1).strip()

        if not tutor and candidate_pet and len(candidate_pet) > 1:
            found_pet = db.q(
                "SELECT id, codigo, tutor_id, nombre, especie, raza, sexo, alergias, condiciones, notas, foto FROM mascotas WHERE nombre ILIKE %s AND activo=TRUE LIMIT 1",
                (f"%{candidate_pet}%",), one=True
            )
            if found_pet:
                mascotas = [found_pet]
                tutor = db.q(
                    "SELECT id, nombre, rif, telefono, direccion, sector, foto FROM tutores WHERE id=%s AND activo=TRUE",
                    (found_pet["tutor_id"],), one=True
                )
    except Exception as _e_lookup:
        log.warning("Error al consultar cliente en base de datos: %s", _e_lookup)

    return {
        "found": bool(tutor),
        "tutor": tutor,
        "mascotas": mascotas
    }


def format_margaret_system_directive(client_info: Dict[str, Any]) -> str:
    """Genera la directiva de apoyo para Margaret manteniendo su autonomía conversacional."""
    if client_info.get("found") and client_info.get("tutor"):
        tutor = client_info["tutor"]
        mascotas = client_info.get("mascotas", [])
        pets_summary = ", ".join([f"{m['nombre']} ({m.get('raza') or m.get('especie') or 'Mascota'})" for m in mascotas]) if mascotas else "Sin mascotas registradas"
        return (
            f"\n[DIRECTIVA DE RECEPCIÓN MRS. PETS - CLIENTE REGISTRADO EN BD]:\n"
            f"• Tutor: {tutor.get('nombre')} | Teléfono: {tutor.get('telefono', 'N/A')} | Sector: {tutor.get('sector') or 'Maracaibo'}\n"
            f"• Mascota(s) en expediente: {pets_summary}\n"
            f"• INSTRUCCIÓN PARA MARGARET: Salúdalo con cariño por su nombre de pila como cliente de la casa, menciona a su consentido(a) y pregúntale directamente qué servicio desea agendar (✂️ Grooming Spa 7 Estaciones, 🩺 Consulta Médica Veterinaria o 🏨 Suites Hotel VIP 5★) y para qué fecha y hora.\n"
        )
    else:
        return (
            f"\n[DIRECTIVA DE RECEPCIÓN MRS. PETS - CLIENTE NUEVO]:\n"
            f"• Estado: Cliente nuevo (no registrado en la base de datos).\n"
            f"• INSTRUCCIÓN PARA MARGARET: Dale una cordial bienvenida a Mrs. Pets. Con tu estilo dulce, empático y profesional de recepcionista, formula progresivamente las preguntas para completar su Ficha de Admisión:\n"
            f"  1. Nombre completo del tutor y teléfono de contacto.\n"
            f"  2. Sector o dirección en Maracaibo.\n"
            f"  3. Nombre del consentido(a), especie, raza y sexo.\n"
            f"  4. Alergias o condiciones especiales.\n"
            f"  5. Invítalo a subir la foto de su consentido usando el botón 📷 Foto del chat para su expediente.\n"
        )


def process_and_persist_booking(
    msg: str,
    client_info: Dict[str, Any],
    body: Dict[str, Any],
    approval_mode: str = "manual"
) -> Optional[Dict[str, Any]]:
    """
    Analiza si se dispone de la información necesaria para registrar la ficha y crear
    la cita en el cronograma, agenda de Mrs. Pets y Google Calendar (mrspetshospital@gmail.com).
    """
    lower = msg.lower()
    booking_triggers = ["reserva", "reservar", "cita", "agendar", "turno", "mañana", "hoy", "baño", "grooming", "consulta", "hotel"]
    if not any(trig in lower for trig in booking_triggers):
        return None

    tutor = client_info.get("tutor")
    mascotas = client_info.get("mascotas", [])

    # Extraer campos si es cliente nuevo o si vienen en el payload
    tutor_name = (tutor.get("nombre") if tutor else None) or body.get("userName") or body.get("context", {}).get("userName") or ""
    phone = (tutor.get("telefono") if tutor else None) or body.get("phone") or body.get("context", {}).get("phone") or ""
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

    # Requerir al menos nombre de mascota o de tutor para poder formalizar la reserva
    if not pet_name and not tutor_name:
        return None

    pet_name = pet_name or "Consentido VIP"
    tutor_name = tutor_name or "Cliente VIP"
    phone = phone or "+58 414-6799510"

    # 1. Persistencia en Base de Datos: Tutores y Mascotas
    tutor_id = tutor.get("id") if tutor else None
    try:
        if not tutor_id:
            # Crear tutor en BD
            norm_p = norm_phone(phone)
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

    # 3. Persistencia en Tabla Citas (PostgreSQL)
    cita_id = None
    if pet_id:
        try:
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
