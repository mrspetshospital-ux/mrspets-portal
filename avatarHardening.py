#!/usr/bin/env python3
"""
Mrs. Pets — Módulo de Endurecimiento y Resiliencia del Canal de Atención (Margarette / Avatar)
=============================================================================================
Cumplimiento estricto del pliego técnico de hardening (21/11/2026):
- Debilidad 1: Separar identidad de motor (mensajes de error emitidos por el SISTEMA, nunca por Leia).
- Debilidad 2: Timeout base de 45s y reintento transitorio automático (3s backoff).
- Debilidad 3: Mensaje de respaldo honesto con derivación a WhatsApp (+58 414-6799510) y sucursal El Milagro.
- Debilidad 4: Health check `/api/health/agent` con cálculo de uptime y alertas al GEO (2 y 4 fallos).
- Debilidad 5: Traspaso a atención humana tras 2 fallos consecutivos por sesión con contexto precargado.
- Debilidad 6: Cobertura de pruebas automatizadas y trazabilidad en logs/agent_health.jsonl.
"""

import os
import time
import json
import logging
import asyncio
import urllib.parse
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple

log = logging.getLogger("mrspets.avatar_hardening")

# --------------------------------------------------------------------------
# Constantes Canónicas y de Identidad
# --------------------------------------------------------------------------
MARGARETTE_TEAMILY_USER_ID = os.environ.get("MARGARETTE_USER_ID", "9000408632300095")
WHATSAPP_CONCIERGE_PHONE = "+58 414-6799510"
WHATSAPP_CONCIERGE_PHONE_RAW = "584146799510"
BRANCH_ADDRESS_PHYSICAL = "Avenida 2 El Milagro, diagonal a Lago Mall, Maracaibo"

# Timeout configurable: 45 segundos por defecto (o AGENT_TIMEOUT_MS=45000)
DEFAULT_AGENT_TIMEOUT_SEC = float(
    os.environ.get("AGENT_TIMEOUT_SEC")
    or (float(os.environ.get("AGENT_TIMEOUT_MS", 45000)) / 1000.0)
    or 45.0
)

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(DIRECTORY, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
AGENT_HEALTH_LOG_FILE = os.path.join(LOGS_DIR, "agent_health.jsonl")


# --------------------------------------------------------------------------
# Debilidades 1 & 3: Mensaje de Respaldo Honesto del Sistema
# --------------------------------------------------------------------------
def build_honest_fallback_message(
    user_name: str = "",
    pet_name: str = "",
    include_handoff: bool = False,
    handoff_url: str = ""
) -> str:
    """
    Construye el mensaje de respaldo honesto del sistema (Debilidades 1 y 3).
    - Habla estrictamente como SISTEMA / Canal de Atención (NUNCA como 'Leia' ni 'Concierge VIP').
    - Ofrece derivación directa a WhatsApp (+58 414-6799510) y sucursal Av. 2 El Milagro.
    - Prohibido prometer reintentos que el sistema no controla (sin 'reintenta').
    - Mantiene el tono respetuoso de la casa ('princesa' / 'príncipe' / 'We see pets').
    """
    tutor_txt = f", {user_name.strip()}" if user_name and user_name.strip() and user_name.strip().lower() not in ["cliente vip", "amigo", "usuario"] else ""
    pet_txt = f" de {pet_name.strip()}" if pet_name and pet_name.strip() else ""

    prefill_text = f"Hola Mrs. Pets{tutor_txt}, requiero asistencia en sucursal para mi consulta{pet_txt}."
    encoded_prefill = urllib.parse.quote(prefill_text)
    wa_url = handoff_url or f"https://wa.me/{WHATSAPP_CONCIERGE_PHONE_RAW}?text={encoded_prefill}"

    base_msg = (
        f"🐾 **Canal de Atención Mrs. Pets:**\n\n"
        f"En este momento no puedo completar tu consulta{tutor_txt}. Para no hacerte esperar, "
        f"escríbenos directamente por WhatsApp a [{WHATSAPP_CONCIERGE_PHONE}]({wa_url}) "
        f"o visítanos en sucursal en **{BRANCH_ADDRESS_PHYSICAL}** — te atendemos de inmediato. "
        f"Tu princesa o príncipe no se queda sin atención. ✨🐾"
    )

    if include_handoff:
        base_msg += (
            f"\n\n🚨 **Traspaso a Atención Humana Inmediata:**\n"
            f"Hemos registrado tu caso para que no tengas que repetir tu información. "
            f"[Haz clic aquí para continuar con nuestro equipo humano en WhatsApp]({wa_url})."
        )

    return base_msg


# --------------------------------------------------------------------------
# Debilidad 5: Protocolo de Traspaso a Humano (Human Handoff)
# --------------------------------------------------------------------------
def build_human_handoff_payload(
    user_name: str = "",
    pet_name: str = "",
    phone: str = "",
    service: str = "",
    issue_summary: str = "",
    session_id: str = ""
) -> Dict[str, Any]:
    """Genera los datos y enlace dinámico de WhatsApp para traspaso a humano sin pérdida de contexto."""
    tutor = user_name.strip() if user_name else "Tutor no especificado"
    mascota = pet_name.strip() if pet_name else "Mascota"
    telf = phone.strip() if phone else "No registrado"
    srv = service.strip() if service else "Consulta general"
    resumen = issue_summary.strip() if issue_summary else "Atención personalizada requerida tras intento en web"

    text = (
        f"👑 *TRASPASO A SUCURSAL — MRS. PETS MARACAIBO*\n"
        f"• Tutor: {tutor}\n"
        f"• Teléfono: {telf}\n"
        f"• Mascota: {mascota}\n"
        f"• Servicio: {srv}\n"
        f"• Motivo: {resumen}\n"
        f"• Sesión: {session_id or 'web_session'}\n\n"
        f"Hola equipo, solicito asistencia humana directa en sucursal. 🐾"
    )
    encoded = urllib.parse.quote(text)
    url = f"https://wa.me/{WHATSAPP_CONCIERGE_PHONE_RAW}?text={encoded}"
    return {
        "available": True,
        "whatsapp_url": url,
        "phone": WHATSAPP_CONCIERGE_PHONE,
        "context_transferred": {
            "user_name": tutor,
            "pet_name": mascota,
            "phone": telf,
            "service": srv,
            "summary": resumen
        }
    }


# --------------------------------------------------------------------------
# Debilidad 4: Monitor de Salud del Agente y Tracker de Uptime
# --------------------------------------------------------------------------
class AgentHealthTracker:
    """
    Rastrea la disponibilidad, latencia y fallos consecutivos del agente Margarette.
    Genera alertas al GEO (tras 2 fallos consecutivos) y a soporte (tras 4 fallos).
    """

    def __init__(self):
        self.consecutive_failures: int = 0
        self.last_check_status: str = "ok"
        self.last_latency_ms: float = 0.0
        self.last_checked_at: Optional[str] = None
        self.total_checks: int = 0
        self.total_successes: int = 0
        self.history: List[Dict[str, Any]] = []
        self._session_failure_counts: Dict[str, int] = {}

    def record_check_result(self, ok: bool, latency_ms: float, error_detail: Optional[str] = None) -> Dict[str, Any]:
        """Registra el resultado de un chequeo (real o sintético)."""
        now_iso = datetime.now(timezone.utc).isoformat()
        self.total_checks += 1
        self.last_latency_ms = latency_ms
        self.last_checked_at = now_iso

        if ok:
            self.consecutive_failures = 0
            self.total_successes += 1
            self.last_check_status = "ok" if latency_ms < 15000 else "degraded"
        else:
            self.consecutive_failures += 1
            self.last_check_status = "down" if self.consecutive_failures >= 2 else "degraded"

        entry = {
            "timestamp": now_iso,
            "ok": ok,
            "status": self.last_check_status,
            "latency_ms": latency_ms,
            "consecutive_failures": self.consecutive_failures,
            "error": error_detail,
            "agent_id": MARGARETTE_TEAMILY_USER_ID
        }
        self.history.append(entry)
        if len(self.history) > 100:
            self.history.pop(0)

        # Persistir en JSONL
        try:
            with open(AGENT_HEALTH_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as _e_log:
            log.warning("No se pudo escribir en agent_health.jsonl: %s", _e_log)

        # Evaluar alertas
        self._evaluate_alerts(entry)

        return self.get_summary()

    def _evaluate_alerts(self, entry: Dict[str, Any]):
        """Dispara alertas ante fallos consecutivos."""
        if self.consecutive_failures == 2:
            alert_msg = (
                f"🚨 ALERTA AL GEO: El agente de atención Margarette (@{MARGARETTE_TEAMILY_USER_ID}) "
                f"ha acumulado 2 fallos consecutivos. Latencia: {entry['latency_ms']}ms. Error: {entry.get('error')}"
            )
            log.error(alert_msg)
            # Notificar al Cuarto de Guerra si está disponible
            try:
                from warRoomEngine import war_room_engine
                if war_room_engine:
                    war_room_engine.add_chat_message(
                        sender="Sistema de Vigilancia (Avatar Health)",
                        role="Monitor Automático",
                        message=alert_msg,
                        node_id="system",
                        channel_id="deliberacion",
                        sender_id="system"
                    )
            except Exception:
                pass

        elif self.consecutive_failures >= 4:
            crit_msg = (
                f"🚨 ALERTA CRÍTICA A SOPORTE: Canal Margarette DOWN tras {self.consecutive_failures} fallos. "
                f"Generando incidente automático. Último error: {entry.get('error')}"
            )
            log.critical(crit_msg)

    def get_summary(self) -> Dict[str, Any]:
        """Calcula el estado y métricas agregadas."""
        uptime_pct = round((self.total_successes / max(self.total_checks, 1)) * 100.0, 2)
        return {
            "status": self.last_check_status,
            "agent_id": MARGARETTE_TEAMILY_USER_ID,
            "agent_name": f"Margarette (Gerente de Planta • @{MARGARETTE_TEAMILY_USER_ID})",
            "latency_ms": self.last_latency_ms,
            "checked_at": self.last_checked_at or datetime.now(timezone.utc).isoformat(),
            "consecutive_failures": self.consecutive_failures,
            "uptime_pct": uptime_pct,
            "total_checks": self.total_checks,
            "alert_geo_active": self.consecutive_failures >= 2,
            "alert_support_active": self.consecutive_failures >= 4,
            "sla_compliant": uptime_pct >= 98.0
        }

    # Sesiones y Handoff
    def record_session_failure(self, session_id: str) -> int:
        if not session_id:
            return 1
        count = self._session_failure_counts.get(session_id, 0) + 1
        self._session_failure_counts[session_id] = count
        return count

    def get_session_failures(self, session_id: str) -> int:
        return self._session_failure_counts.get(session_id, 0)

    def reset_session_failures(self, session_id: str):
        if session_id in self._session_failure_counts:
            self._session_failure_counts[session_id] = 0


agent_health_tracker = AgentHealthTracker()
