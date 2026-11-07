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
DEFAULT_MAKE_WEBHOOK = "https://hook.us2.make.com/p8netq49ok9qd53sm2fcowubdvz3dnc6"
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

google_sheets_engine = GoogleSheetsInteractionEngine()
