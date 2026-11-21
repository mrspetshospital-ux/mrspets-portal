#!/usr/bin/env python3
"""
Mrs. Pets Maracaibo - War Room Deliberation Engine & Canonical Auditor
Big & Little Dogs, C.A. • RIF J-40120233-0 • Av. 2 El Milagro diagonal Lago Mall

Módulo de Deliberación IA ↔ IA con Gobernanza Humana Estricta (Fase 1).
Implementa la especificación canónica:
- Selector sellado de rondas (1 o 2, por defecto 1).
- Máquina de estados: EN_CURSO, SIN_OBJECIÓN, OBJECIÓN_ABIERTA, SIN_RESPUESTA, CERRADO, COMPLETADO.
- Cota dura: Máximo 4 turnos automáticos por ciclo.
- Salida estructurada como RECOMENDACIÓN (nunca orden).
- Persistencia canónica idempotente en Base de Datos (PostgreSQL/SQLite) y Google Sheets.
- Spreadsheet ID oficial: 1u9e2V5KSlgi7QhaCTgkmb30phz4vaoW67E3S_RPhDmA
"""

import os
import re
import json
import uuid
import time
import secrets
import logging
import datetime
from typing import Dict, Any, List, Optional, Tuple

import db

log = logging.getLogger("mrspets.war_room_deliberation")

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(DIRECTORY, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
DELIBERATION_AUDIT_FILE = os.path.join(LOGS_DIR, "war_room_deliberation.jsonl")

# Google Sheets Oficial
DELIBERATION_SPREADSHEET_ID = "1u9e2V5KSlgi7QhaCTgkmb30phz4vaoW67E3S_RPhDmA"
SHEET_TAB_CICLOS = "Ciclos"
SHEET_TAB_TURNOS = "Turnos"
SHEET_TAB_REGLAS = "Reglas"

# Versión fija de modelo activo (Gemini 3.8 Flash)
FIXED_GEMINI_MODEL = "gemini-3.8-flash"

# Estados Oficiales
STATE_EN_CURSO = "EN_CURSO"
STATE_SIN_OBJECION = "SIN_OBJECIÓN"
STATE_OBJECION_ABIERTA = "OBJECIÓN_ABIERTA"
STATE_SIN_RESPUESTA = "SIN_RESPUESTA"
STATE_CERRADO = "CERRADO"
STATE_COMPLETADO = "COMPLETADO"


def sanitize_sheet_value(val: Any) -> str:
    """Evita inyecciones de fórmulas rotas en Google Sheets."""
    if val is None:
        return ""
    s = str(val).strip()
    if not s:
        return ""
    if s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{s}"
    return s


def parse_antigravity_counterproposal(text: str) -> Dict[str, Any]:
    """
    Parsea la contrapropuesta estructurada de AntiGravity y clasifica el estado:
    - QUÉ ACEPTO
    - QUÉ OBJETO
    - QUÉ FALTA
    - RIESGO ASUMIDO
    - CÓMO REVERTIR
    - ESTADO
    """
    t = (text or "").strip()
    
    # 1. Detección rápida de no-objeción
    t_lower = t.lower()
    if "estado: sin_objeción" in t_lower or "estado: sin_objecion" in t_lower:
        return {
            "estado": STATE_SIN_OBJECION,
            "que_acepto": "Suscripción plena de la propuesta técnica",
            "que_objeto": "",
            "que_falta": "",
            "riesgo": "Mínimo / Controlado",
            "como_revertir": "N/A",
            "raw": t
        }

    # 2. Extracción por expresiones regulares
    def extract_field(field_name: str, end_markers: List[str]) -> str:
        pattern = rf"(?:QUÉ\s+{field_name}|{field_name})\s*:\s*(.*?)(?=(?:" + "|".join(end_markers) + r")|$)"
        m = re.search(pattern, t, flags=re.IGNORECASE | re.DOTALL)
        return m.group(1).strip() if m else ""

    acepto = extract_field("ACEPTO", ["QUÉ OBJETO", "OBJETO", "QUÉ FALTA", "RIESGO", "CÓMO REVERTIR", "ESTADO"])
    objeto = extract_field("OBJETO", ["QUÉ FALTA", "FALTA", "RIESGO", "CÓMO REVERTIR", "ESTADO"])
    falta = extract_field("FALTA", ["RIESGO", "RIESGO ASUMIDO", "CÓMO REVERTIR", "ESTADO"])
    riesgo = extract_field("RIESGO ASUMIDO", ["CÓMO REVERTIR", "ESTADO"]) or extract_field("RIESGO", ["CÓMO REVERTIR", "ESTADO"])
    revertir = extract_field("CÓMO REVERTIR", ["ESTADO"])

    # Extraer estado explícito si viene en el texto
    estado_m = re.search(r"ESTADO\s*:\s*([A-ZÁÉÍÓÚ_]+)", t, flags=re.IGNORECASE)
    estado_raw = estado_m.group(1).upper() if estado_m else ""

    # Determinar si hay objeción real
    obj_clean = objeto.lower().strip()
    no_obj_keywords = ["ninguno", "ninguna", "n/a", "sin objeción", "sin objecion", "sin observaciones", "conforme", "de acuerdo", "nada"]
    is_empty_or_none = not obj_clean or any(k == obj_clean or obj_clean.startswith(k) for k in no_obj_keywords)

    if estado_raw in ("SIN_OBJECION", "SIN_OBJECIÓN") or is_empty_or_none:
        estado_final = STATE_SIN_OBJECION
    elif estado_raw == "CERRADO":
        estado_final = STATE_CERRADO
    elif estado_raw == "OBJECION_ABIERTA" or estado_raw == "OBJECIÓN_ABIERTA":
        estado_final = STATE_OBJECION_ABIERTA
    else:
        estado_final = STATE_OBJECION_ABIERTA if objeto else STATE_SIN_OBJECION

    return {
        "estado": estado_final,
        "que_acepto": acepto,
        "que_objeto": objeto if not is_empty_or_none else "",
        "que_falta": falta,
        "riesgo": riesgo,
        "como_revertir": revertir,
        "raw": t
    }


def format_final_recommendation(
    accion: str,
    por_que: str,
    confianza: str = "alta",
    riesgo: str = "Bajo / Controlado",
    reversibilidad: str = "Inmediata"
) -> str:
    """Genera el formato de salida obligatorio de la sala (siempre recomendación)."""
    return (
        f"QUÉ RECOMIENDO: {accion}\n"
        f"POR QUÉ: {por_que}\n"
        f"CONFIANZA: {confianza}\n"
        f"RIESGO: {riesgo}\n"
        f"REVERSIBILIDAD: {reversibilidad}"
    )


class DeliberationCycleManager:
    """
    Gestiona el ciclo de vida, turnos y persistencia de las deliberaciones.
    """
    def __init__(self):
        self.active_cycle: Optional[Dict[str, Any]] = None
        self.cycles_cache: Dict[str, Dict[str, Any]] = {}

    def get_or_create_cycle(self, run_id: str, tema: str, rounds: int = 1) -> Dict[str, Any]:
        """Obtiene o inicializa un ciclo con rounds sellado."""
        if run_id in self.cycles_cache:
            return self.cycles_cache[run_id]

        sealed_rounds = 2 if int(rounds or 1) == 2 else 1
        now_dt = datetime.datetime.now(datetime.timezone.utc)
        fecha_str = now_dt.strftime("%d/%m/%Y %H:%M:%S")

        cycle = {
            "run_id": run_id,
            "fecha": fecha_str,
            "tema": tema,
            "rounds": sealed_rounds,
            "sealed_rounds": sealed_rounds,
            "estado": STATE_EN_CURSO,
            "turnos_usados": 0,
            "max_turnos": sealed_rounds * 2,
            "recomendacion": "",
            "decision_final": "",
            "divergencia": "NO",
            "motivo": "",
            "ejecutado_en": "",
            "commit": "",
            "fecha_cierre": "",
            "turns": []
        }

        # Persistir ciclo en Base de Datos local/cloud
        try:
            sql = """
            INSERT INTO war_room_cycles (run_id, fecha, tema, rounds, estado, turnos_usados, recomendacion, divergencia)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """ if db.IS_POSTGRES else """
            INSERT OR REPLACE INTO war_room_cycles (run_id, fecha, tema, rounds, estado, turnos_usados, recomendacion, divergencia)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            db.execute(sql, (
                run_id, fecha_str, tema, sealed_rounds, STATE_EN_CURSO, 0, "", "NO"
            ))
        except Exception as e:
            log.warning("[DeliberationManager] Error guardando ciclo en DB: %s", e)

        self.cycles_cache[run_id] = cycle
        self.active_cycle = cycle
        self._write_local_audit("CYCLE_INITIALIZED", cycle)
        return cycle

    def record_turn(
        self,
        run_id: str,
        turno: int,
        actor: str,
        contenido: str,
        estado: str = STATE_EN_CURSO,
        que_acepto: str = "",
        que_objeto: str = ""
    ) -> Dict[str, Any]:
        """Registra un turno con clave compuesta idempotente (run_id, turno)."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        turn_data = {
            "run_id": run_id,
            "turno": turno,
            "actor": actor,
            "timestamp": now_iso,
            "estado": estado,
            "contenido": contenido,
            "que_acepto": que_acepto,
            "que_objeto": que_objeto
        }

        cycle = self.cycles_cache.get(run_id)
        if cycle:
            # Reemplazar si ya existe el turno o agregar
            cycle["turns"] = [t for t in cycle["turns"] if t.get("turno") != turno]
            cycle["turns"].append(turn_data)
            cycle["turns"].sort(key=lambda x: x.get("turno", 0))
            cycle["turnos_usados"] = max(cycle.get("turnos_usados", 0), turno)
            if estado in (STATE_SIN_OBJECION, STATE_OBJECION_ABIERTA, STATE_SIN_RESPUESTA, STATE_CERRADO, STATE_COMPLETADO):
                cycle["estado"] = estado

        # Persistencia en Base de Datos
        try:
            sql = """
            INSERT INTO war_room_turns (run_id, turno, actor, timestamp, estado, contenido, que_acepto, que_objeto)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (run_id, turno) DO UPDATE SET
                actor = EXCLUDED.actor,
                timestamp = EXCLUDED.timestamp,
                estado = EXCLUDED.estado,
                contenido = EXCLUDED.contenido,
                que_acepto = EXCLUDED.que_acepto,
                que_objeto = EXCLUDED.que_objeto
            """ if db.IS_POSTGRES else """
            INSERT OR REPLACE INTO war_room_turns (run_id, turno, actor, timestamp, estado, contenido, que_acepto, que_objeto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            db.execute(sql, (
                run_id, turno, actor, now_iso, estado, contenido, que_acepto, que_objeto
            ))

            # Actualizar estado del ciclo en BD
            sql_upd = """
            UPDATE war_room_cycles SET estado = %s, turnos_usados = %s WHERE run_id = %s
            """ if db.IS_POSTGRES else """
            UPDATE war_room_cycles SET estado = ?, turnos_usados = ? WHERE run_id = ?
            """
            db.execute(sql_upd, (estado, cycle["turnos_usados"] if cycle else turno, run_id))
        except Exception as e:
            log.warning("[DeliberationManager] Error persistiendo turno en DB: %s", e)

        self._write_local_audit("TURN_RECORDED", turn_data)
        self._sync_to_sheets_log(turn_data, cycle)
        return turn_data

    def close_cycle(
        self,
        run_id: str,
        recomendacion: str,
        estado_final: str = STATE_COMPLETADO,
        decision_final: str = "",
        divergencia: str = "NO",
        motivo: str = ""
    ) -> Dict[str, Any]:
        """Cierra el ciclo de deliberación."""
        now_dt = datetime.datetime.now(datetime.timezone.utc)
        fecha_cierre = now_dt.strftime("%d/%m/%Y %H:%M:%S")

        cycle = self.cycles_cache.get(run_id)
        if cycle:
            cycle["estado"] = estado_final
            cycle["recomendacion"] = recomendacion
            cycle["decision_final"] = decision_final
            cycle["divergencia"] = divergencia
            cycle["motivo"] = motivo
            cycle["fecha_cierre"] = fecha_cierre

        try:
            sql = """
            UPDATE war_room_cycles 
            SET estado = %s, recomendacion = %s, decision_final = %s, divergencia = %s, motivo = %s, fecha_cierre = %s
            WHERE run_id = %s
            """ if db.IS_POSTGRES else """
            UPDATE war_room_cycles 
            SET estado = ?, recomendacion = ?, decision_final = ?, divergencia = ?, motivo = ?, fecha_cierre = ?
            WHERE run_id = ?
            """
            db.execute(sql, (estado_final, recomendacion, decision_final, divergencia, motivo, fecha_cierre, run_id))
        except Exception as e:
            log.warning("[DeliberationManager] Error cerrando ciclo en DB: %s", e)

        if cycle:
            self._write_local_audit("CYCLE_CLOSED", cycle)
        return cycle or {}

    def get_cycle_status(self, run_id: Optional[str] = None) -> Dict[str, Any]:
        """Devuelve el estado del ciclo activo o el especificado."""
        cycle = self.cycles_cache.get(run_id) if run_id else self.active_cycle
        if not cycle:
            return {
                "active": False,
                "rounds": 1,
                "sealed_rounds": 1,
                "current_turn": 0,
                "max_turnos": 2,
                "estado": "LISTO",
                "badge_text": "LISTO PARA DELIBERAR",
                "progress_text": "Turno 0 de 2",
                "persistence_badge": "Bitácora: Google Sheets — respaldo activo (Local/DB)"
            }

        rounds = cycle.get("sealed_rounds", 1)
        used = cycle.get("turnos_usados", 0)
        max_t = cycle.get("max_turnos", rounds * 2)
        estado = cycle.get("estado", STATE_EN_CURSO)

        badge_map = {
            STATE_EN_CURSO: "🔵 EN CURSO",
            STATE_SIN_OBJECION: "🟢 SIN OBJECIÓN",
            STATE_OBJECION_ABIERTA: "🟡 OBJECIÓN ABIERTA",
            STATE_SIN_RESPUESTA: "🚨 ALERTA: SIN RESPUESTA",
            STATE_CERRADO: "⚪ CERRADO",
            STATE_COMPLETADO: "✅ DELIBERACIÓN CONCLUIDA"
        }

        return {
            "active": True,
            "run_id": cycle.get("run_id"),
            "tema": cycle.get("tema"),
            "rounds": rounds,
            "sealed_rounds": rounds,
            "current_turn": used,
            "max_turnos": max_t,
            "estado": estado,
            "badge_text": badge_map.get(estado, estado),
            "progress_text": f"Turno {used} de {max_t}",
            "persistence_badge": "Bitácora: Google Sheets — respaldo activo (Local/DB)",
            "recomendacion": cycle.get("recomendacion", "")
        }

    def _write_local_audit(self, action: str, payload: Dict[str, Any]):
        """Escribe en la bitácora inmutable local."""
        try:
            entry = {
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "action": action,
                "payload": payload
            }
            with open(DELIBERATION_AUDIT_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            log.warning("Error escribiendo bitácora local de deliberación: %s", e)

    def _sync_to_sheets_log(self, turn_data: Dict[str, Any], cycle: Optional[Dict[str, Any]]):
        """Prepara el registro idempotente para Google Sheets."""
        sync_file = os.path.join(LOGS_DIR, "war_room_sheets_sync.jsonl")
        try:
            row_turn = [
                sanitize_sheet_value(turn_data.get("run_id")),
                turn_data.get("turno"),
                sanitize_sheet_value(turn_data.get("actor")),
                sanitize_sheet_value(turn_data.get("timestamp")),
                sanitize_sheet_value(turn_data.get("estado")),
                sanitize_sheet_value(turn_data.get("contenido")),
                sanitize_sheet_value(turn_data.get("que_acepto")),
                sanitize_sheet_value(turn_data.get("que_objeto"))
            ]
            
            entry = {
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "spreadsheet_id": DELIBERATION_SPREADSHEET_ID,
                "tab": SHEET_TAB_TURNOS,
                "idempotency_key": f"{turn_data.get('run_id')}_{turn_data.get('turno')}",
                "row_values": row_turn
            }
            with open(sync_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            log.warning("Error en sync buffer de Google Sheets: %s", e)


deliberation_manager = DeliberationCycleManager()
