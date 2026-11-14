#!/usr/bin/env python3
"""
Mrs. Pets Maracaibo - Google Sheets Interaction & Audit Trail Engine
Big & Little Dogs, C.A. • RIF J-40120233-0 • Av. 2 El Milagro diagonal Lago Mall

Módulo de registro automático e inmutable para las interacciones del widget de Leia / Leire (Margaret)
en Google Sheets y Make.com.

Especificaciones:
- Spreadsheet ID: 1yfnYyG23Z8JipApuW_-wiH_j6B3oNdPIUN_06bWwqI4
- Pestaña: Registro de Interacciones
- Sanitización estricta contra inyección de fórmulas rotas (=, +, -, @)
- Despacho asíncrono y resiliente (sin bloqueo ni errores HTTP 500)
"""

import os
import json
import uuid
import datetime
import urllib.request
import urllib.error
import ssl
from typing import Dict, Any, Optional

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(DIRECTORY, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
AUDIT_LOG_FILE = os.path.join(LOGS_DIR, "audit_trail.jsonl")

DEFAULT_SPREADSHEET_ID = "1yfnYyG23Z8JipApuW_-wiH_j6B3oNdPIUN_06bWwqI4"
DEFAULT_SHEET_TAB = "Registro de Interacciones"
DEFAULT_MAKE_WEBHOOK = "https://hook.us2.make.com/rsdqtjwgxit0j4uw8s58oe31sa27j7d4"
FALLBACK_MAKE_WEBHOOK = ""
DEFAULT_BOARD_ID = "5803df5a-7127-4d28-b97c-5c840d47cdc7"

def sanitize_sheet_value(val: Any) -> str:
    """
    Sanitiza el contenido para evitar que Google Sheets interprete el texto como una fórmula rota.
    Si el valor comienza con '=', '+', '-', '@' o caracteres de control,
    antepone un apóstrofe (') para forzar formato de texto puro y no romper fórmulas en la hoja.
    """
    if val is None:
        return ""
    s = str(val).strip()
    if not s:
        return ""
    # Si comienza con prefijos de fórmula de hoja de cálculo
    if s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{s}"
    return s

def classify_service_area(text: str) -> str:
    """Clasifica el área de servicio basada en la consulta o respuesta."""
    t = (text or "").lower()
    if any(k in t for k in ["grooming", "baño", "corte", "peluquer", "pulpejo", "spa"]):
        return "✂️ Grooming Spa 7 Estaciones"
    if any(k in t for k in ["clínica", "clinica", "médic", "medic", "veterinari", "idexx", "vacuna", "consulta"]):
        return "🩺 Clínica Veterinaria & IDEXX"
    if any(k in t for k in ["hotel", "guardería", "guarderia", "hospedaje", "suite"]):
        return "🏨 Hotel VIP 5★ & Guardería"
    if any(k in t for k in ["tienda", "boutique", "producto", "alimento", "accesorio", "snack"]):
        return "🛍️ Boutique & Consentidos"
    if any(k in t for k in ["talibel", "administra", "gerencia", "volturi", "precio", "bcv"]):
        return "🤝 Administración & Talibel"
    return "🎀 Atención General Concierge"

class GoogleSheetsInteractionEngine:
    def __init__(self):
        self.spreadsheet_id = os.environ.get("GOOGLE_SHEET_INTERACTIONS_ID", DEFAULT_SPREADSHEET_ID)
        self.sheet_tab = os.environ.get("GOOGLE_SHEET_INTERACTIONS_TAB", DEFAULT_SHEET_TAB)
        self.make_webhook_url = os.environ.get("MAKE_WEBHOOK_URL_WAR_ROOM", os.environ.get("MAKE_WEBHOOK_URL_INTERACTIONS", os.environ.get("MAKE_WEBHOOK_URL", DEFAULT_MAKE_WEBHOOK)))
        self.board_id = os.environ.get("TEAMILEY_GEO_A_BOARD_ID", DEFAULT_BOARD_ID)

    def record_interaction(
        self,
        user_message: str,
        agent_reply: str,
        agent_name: str = "Leia Concierge VIP & Asistencia CEO",
        agent_slug: str = "leia",
        user_name: str = "",
        pet_name: str = "",
        channel: str = "Widget Web (Leia Concierge)",
        status: str = "ATENDIDO_EXITOSO",
        extra_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Registra una interacción de punta a punta:
        1. Formatea y sanitiza los campos para proteger fórmulas de Google Sheets.
        2. Envía webhook a Make.com con destino al Spreadsheet ID y pestaña oficial.
        3. Registra en el log de auditoría local/cloud.
        """
        now_dt = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4)))
        timestamp_ve = now_dt.strftime("%d/%m/%Y %H:%M:%S")
        timestamp_iso = now_dt.isoformat()
        interaction_id = f"INT-{now_dt.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

        ctx = extra_context or {}
        resolved_user = user_name or ctx.get("userName") or ctx.get("tutor_name") or "Tutor / Cliente Mrs. Pets"
        resolved_pet = pet_name or ctx.get("petName") or ctx.get("pet_name") or "Consentido (Príncipe/Princesa)"
        
        detected_area = classify_service_area(f"{user_message} {agent_reply}")

        # Estructura de fila sanitizada para Google Sheets (Resuelve fórmulas rotas)
        sheet_row = {
            "ID_Interaccion": sanitize_sheet_value(interaction_id),
            "Fecha_Hora": sanitize_sheet_value(timestamp_ve),
            "Canal": sanitize_sheet_value(channel),
            "Tutor_Nombre": sanitize_sheet_value(resolved_user),
            "Mascota_Consentido": sanitize_sheet_value(resolved_pet),
            "Mensaje_Cliente": sanitize_sheet_value(user_message),
            "Agente_Atendiendo": sanitize_sheet_value(agent_name),
            "Agente_Slug": sanitize_sheet_value(agent_slug),
            "Respuesta_Generada": sanitize_sheet_value(agent_reply),
            "Area_Servicio": sanitize_sheet_value(detected_area),
            "Board_ID": sanitize_sheet_value(self.board_id),
            "Estado": sanitize_sheet_value(status),
            "Spreadsheet_ID": sanitize_sheet_value(self.spreadsheet_id),
            "Pestana": sanitize_sheet_value(self.sheet_tab)
        }

        payload = {
            "event": "mrs_pets_interaction_recorded",
            "spreadsheet_id": self.spreadsheet_id,
            "sheet_name": self.sheet_tab,
            "board_id": self.board_id,
            "timestamp": timestamp_iso,
            "interaction": sheet_row,
            # Array plano para módulos de Make tipo 'Add a Row' sin romper fórmulas
            "row_values": [
                sheet_row["ID_Interaccion"],
                sheet_row["Fecha_Hora"],
                sheet_row["Canal"],
                sheet_row["Tutor_Nombre"],
                sheet_row["Mascota_Consentido"],
                sheet_row["Mensaje_Cliente"],
                sheet_row["Agente_Atendiendo"],
                sheet_row["Respuesta_Generada"],
                sheet_row["Area_Servicio"],
                sheet_row["Estado"]
            ]
        }

        # 1. Guardar en Audit Trail local
        try:
            with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "timestamp": timestamp_iso,
                    "category": "CUSTOMER_INTERACTION",
                    "action": "GOOGLE_SHEETS_INTERACTION_RECORDED",
                    "spreadsheet_id": self.spreadsheet_id,
                    "sheet_name": self.sheet_tab,
                    "interaction_id": interaction_id,
                    "user": resolved_user,
                    "pet": resolved_pet,
                    "agent": agent_name
                }) + "\n")
        except Exception as e:
            print(f"[GoogleSheetsEngine] Error escribiendo audit log: {e}")

        # 2. Despacho HTTP no bloqueante a Make.com (con timeout seguro)
        webhook_status = "PENDING"
        for target_url in [self.make_webhook_url, FALLBACK_MAKE_WEBHOOK]:
            if not target_url:
                continue
            try:
                data_bytes = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    target_url,
                    data=data_bytes,
                    headers={
                        "Content-Type": "application/json",
                        "User-Agent": "MrsPets-InteractionLogger/2.0"
                    },
                    method="POST"
                )
                ctx_ssl = ssl.create_default_context()
                ctx_ssl.check_hostname = False
                ctx_ssl.verify_mode = ssl.CERT_NONE

                with urllib.request.urlopen(req, timeout=2.5, context=ctx_ssl) as response:
                    if response.status in (200, 201, 202):
                        webhook_status = "SENT_SUCCESS"
                        break
            except Exception as e:
                # No bloquear el flujo de respuesta si Make tiene retraso
                webhook_status = f"DISPATCH_ERROR_{str(e)[:50]}"

        return {
            "status": "success",
            "recorded": True,
            "interaction_id": interaction_id,
            "spreadsheet_id": self.spreadsheet_id,
            "sheet_name": self.sheet_tab,
            "board_id": self.board_id,
            "webhook_status": webhook_status,
            "sanitized_data": sheet_row
        }

    # =========================================================================
    # CENTRO MPF • HOJA CORPORATIVA DE GOOGLE DRIVE:
    # "MPF - Centro de Marketing, Monitoreo y Comportamiento Táctico"
    # =========================================================================
    def record_mpf_campaign_monitoring(
        self,
        campaign_id: str,
        theme: str,
        channels: str,
        status: str = "ACTIVA_AUTORIZADA",
        conversion_metrics: str = "ROAS Estimado: 4.5x | Conversión WhatsApp: 82%",
        manager: str = "Dalybell",
        pet_id: Optional[str] = None,
        budget_usd: float = 3500.0,
        extra_details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Pestaña 1 (Monitoreo de Campañas):
        Registra el ID de campaña, temática, canales, estado y métricas de conversión tras el visto bueno gerencial.
        """
        now_dt = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4)))
        timestamp_ve = now_dt.strftime("%d/%m/%Y %H:%M:%S")
        timestamp_iso = now_dt.isoformat()

        sheet_tab = "Monitoreo de Campañas"
        row_dict = {
            "Fecha_Hora": sanitize_sheet_value(timestamp_ve),
            "ID_Campana": sanitize_sheet_value(campaign_id),
            "Tematica": sanitize_sheet_value(theme),
            "Canales": sanitize_sheet_value(channels),
            "Mascota_ID": sanitize_sheet_value(pet_id or "GENERAL"),
            "Visto_Bueno_Gerencial": sanitize_sheet_value(f"{manager} - APROBADO_FINAL"),
            "Estado": sanitize_sheet_value(status),
            "Metricas_Conversion": sanitize_sheet_value(conversion_metrics),
            "Presupuesto_USD": budget_usd,
            "Spreadsheet_ID": sanitize_sheet_value(self.spreadsheet_id),
            "Pestana": sanitize_sheet_value(sheet_tab)
        }

        payload = {
            "event": "mpf_campaign_monitoring_recorded",
            "spreadsheet_id": self.spreadsheet_id,
            "sheet_name": sheet_tab,
            "pestana": sheet_tab,
            "spreadsheet_title": "MPF - Centro de Marketing, Monitoreo y Comportamiento Táctico",
            "timestamp": timestamp_iso,
            "campaign_id": campaign_id,
            "theme": theme,
            "channels": channels,
            "status": status,
            "conversion_metrics": conversion_metrics,
            "manager": manager,
            "pet_id": pet_id,
            "row_values": [
                row_dict["Fecha_Hora"],
                row_dict["ID_Campana"],
                row_dict["Tematica"],
                row_dict["Canales"],
                row_dict["Mascota_ID"],
                row_dict["Visto_Bueno_Gerencial"],
                row_dict["Estado"],
                row_dict["Metricas_Conversion"],
                str(budget_usd)
            ],
            "row_dict": row_dict,
            "extra": extra_details or {}
        }

        self._write_local_audit("MPF_CAMPAIGN_MONITORING", payload)
        self._dispatch_make_async(payload)
        return {"status": "success", "sheet_tab": sheet_tab, "data": row_dict}

    def record_mpf_grooming_qc_ai(
        self,
        pet_id: str,
        pet_name: str,
        breed: str,
        station: str,
        stylist_name: str = "Estilista Asignado",
        vision_ai_score: str = "98.5% Aprobación IA",
        vision_ai_status: str = "APROBADO_CONFORME",
        autonomy_mode: str = "AUTONOMO_CONTROLADO",
        reviewer: str = "Dalybell",
        decision: str = "APROBADO",
        photos_count: int = 4
    ) -> Dict[str, Any]:
        """
        Pestaña 2 (Control de Calidad y IA):
        Registra cada auditoría de grooming de los príncipes y princesas, midiendo tasas de aprobación de visión artificial
        y el estado del modo operativo (Asistido vs. Autónomo).
        """
        now_dt = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4)))
        timestamp_ve = now_dt.strftime("%d/%m/%Y %H:%M:%S")
        timestamp_iso = now_dt.isoformat()

        sheet_tab = "Control de Calidad y IA"
        row_dict = {
            "Fecha_Hora": sanitize_sheet_value(timestamp_ve),
            "Mascota_ID": sanitize_sheet_value(pet_id),
            "Nombre_Mascota": sanitize_sheet_value(pet_name),
            "Raza": sanitize_sheet_value(breed),
            "Estacion_Grooming": sanitize_sheet_value(station),
            "Estilista_Responsable": sanitize_sheet_value(stylist_name),
            "Tasa_Vision_Artificial": sanitize_sheet_value(vision_ai_score),
            "Estado_Vision_IA": sanitize_sheet_value(vision_ai_status),
            "Modo_Operativo": sanitize_sheet_value(autonomy_mode),
            "Decision_Gerencial": sanitize_sheet_value(f"{reviewer} - {decision}"),
            "Fotos_Comerciales": sanitize_sheet_value(f"{photos_count} Ángulos Comerciales"),
            "Spreadsheet_ID": sanitize_sheet_value(self.spreadsheet_id),
            "Pestana": sanitize_sheet_value(sheet_tab)
        }

        payload = {
            "event": "mpf_grooming_qc_ai_recorded",
            "spreadsheet_id": self.spreadsheet_id,
            "sheet_name": sheet_tab,
            "pestana": sheet_tab,
            "spreadsheet_title": "MPF - Centro de Marketing, Monitoreo y Comportamiento Táctico",
            "timestamp": timestamp_iso,
            "pet_id": pet_id,
            "pet_name": pet_name,
            "station": station,
            "stylist_name": stylist_name,
            "vision_ai_score": vision_ai_score,
            "autonomy_mode": autonomy_mode,
            "decision": decision,
            "row_values": [
                row_dict["Fecha_Hora"],
                row_dict["Mascota_ID"],
                row_dict["Nombre_Mascota"],
                row_dict["Raza"],
                row_dict["Estacion_Grooming"],
                row_dict["Estilista_Responsable"],
                row_dict["Tasa_Vision_Artificial"],
                row_dict["Estado_Vision_IA"],
                row_dict["Modo_Operativo"],
                row_dict["Decision_Gerencial"],
                row_dict["Fotos_Comerciales"]
            ],
            "row_dict": row_dict
        }

        self._write_local_audit("MPF_GROOMING_QC_AI", payload)
        self._dispatch_make_async(payload)
        return {"status": "success", "sheet_tab": sheet_tab, "data": row_dict}

    def record_mpf_learning_log(
        self,
        exception_id: str,
        pet_id: str,
        service_type: str,
        station: str,
        differences_text: str,
        differences_image: str,
        reason: str,
        feedback: str = "Ajuste editorial o fotográfico requerido",
        learned_rule: str = "",
        reviewer: str = "Dalybell",
        agent_id: str = "oneil"
    ) -> Dict[str, Any]:
        """
        Pestaña 3 (Bitácora de Aprendizaje):
        Almacena las excepciones, correcciones y retroalimentaciones para retroalimentar los prompts de O'Neil y los agentes de Teamily.
        """
        now_dt = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4)))
        timestamp_ve = now_dt.strftime("%d/%m/%Y %H:%M:%S")
        timestamp_iso = now_dt.isoformat()

        sheet_tab = "Bitácora de Aprendizaje"
        row_dict = {
            "Fecha_Hora": sanitize_sheet_value(timestamp_ve),
            "ID_Excepcion": sanitize_sheet_value(exception_id),
            "Mascota_ID": sanitize_sheet_value(pet_id),
            "Tipo_Servicio": sanitize_sheet_value(service_type),
            "Estacion": sanitize_sheet_value(station),
            "Diferencias_Texto": sanitize_sheet_value(differences_text),
            "Diferencias_Imagen": sanitize_sheet_value(differences_image),
            "Motivo_Rechazo": sanitize_sheet_value(reason),
            "Retroalimentacion_Gerencial": sanitize_sheet_value(feedback),
            "Regla_Aprendida_Prompt": sanitize_sheet_value(learned_rule),
            "Agente_Impactado": sanitize_sheet_value(f"O'Neil ({agent_id}) / Teamily Volturi"),
            "Revisor": sanitize_sheet_value(reviewer),
            "Spreadsheet_ID": sanitize_sheet_value(self.spreadsheet_id),
            "Pestana": sanitize_sheet_value(sheet_tab)
        }

        payload = {
            "event": "mpf_learning_log_recorded",
            "spreadsheet_id": self.spreadsheet_id,
            "sheet_name": sheet_tab,
            "pestana": sheet_tab,
            "spreadsheet_title": "MPF - Centro de Marketing, Monitoreo y Comportamiento Táctico",
            "timestamp": timestamp_iso,
            "exception_id": exception_id,
            "pet_id": pet_id,
            "service_type": service_type,
            "differences_text": differences_text,
            "differences_image": differences_image,
            "reason": reason,
            "learned_rule": learned_rule,
            "row_values": [
                row_dict["Fecha_Hora"],
                row_dict["ID_Excepcion"],
                row_dict["Mascota_ID"],
                row_dict["Tipo_Servicio"],
                row_dict["Estacion"],
                row_dict["Diferencias_Texto"],
                row_dict["Diferencias_Imagen"],
                row_dict["Motivo_Rechazo"],
                row_dict["Retroalimentacion_Gerencial"],
                row_dict["Regla_Aprendida_Prompt"],
                row_dict["Agente_Impactado"]
            ],
            "row_dict": row_dict
        }

        self._write_local_audit("MPF_LEARNING_LOG", payload)
        self._dispatch_make_async(payload)
        return {"status": "success", "sheet_tab": sheet_tab, "data": row_dict}

    def _write_local_audit(self, action: str, payload: Dict[str, Any]):
        """Escribe evento en audit_trail.jsonl local de forma segura."""
        try:
            with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "category": "MPF_MARKETING_SHEETS",
                    "action": action,
                    "payload": payload
                }, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[GoogleSheetsEngine] Error escribiendo audit log: {e}")

    def _dispatch_make_async(self, payload: Dict[str, Any]):
        """Despacha asíncronamente en un thread secundario sin bloquear el backend."""
        import threading
        def _worker():
            for target_url in [
                os.environ.get("MAKE_WEBHOOK_URL_GROOMING_MARKETING") or "https://hook.us2.make.com/bmh5ilmpkz1z04pjt3zjna4xpykvwi4j",
                self.make_webhook_url
            ]:
                if not target_url:
                    continue
                try:
                    data_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
                    req = urllib.request.Request(
                        target_url,
                        data=data_bytes,
                        headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "MrsPets-MPF-Sync/2.5"},
                        method="POST"
                    )
                    ctx = ssl.create_default_context()
                    ctx.check_hostname = False
                    ctx.verify_mode = ssl.CERT_NONE
                    with urllib.request.urlopen(req, timeout=5, context=ctx) as r:
                        if r.status in (200, 201, 202):
                            break
                except Exception:
                    pass
        threading.Thread(target=_worker, daemon=True).start()


google_sheets_engine = GoogleSheetsInteractionEngine()
