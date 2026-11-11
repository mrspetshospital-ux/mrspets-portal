"""
CALENDAR & OPERATIONAL AGENDA ENGINE (Mrs. Pets Corp - Maracaibo)
Gestor unificado de horarios, restricciones (Dalybell & Dra. Margaret),
evaluación de disponibilidad en tiempo real para Leia Concierge VIP,
y sincronización bidireccional con Google Calendar vía Make.com.
"""

import os
import json
import logging
import urllib.request
import ssl
import time
import uuid
from datetime import datetime, date, time as dtime, timedelta, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any

log = logging.getLogger("mrspets.calendar")

CALENDAR_CONFIG_PATH = Path(__file__).resolve().parent / "calendar_config.json"


class CalendarEngine:
    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or CALENDAR_CONFIG_PATH
        self.config = self._load_config()
        self._memory_appointments = []  # Fallback si no hay conexión a DB

    def _load_config(self) -> dict:
        if self.config_path.exists():
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                log.error("Error al cargar calendar_config.json: %s", e)
        return self._default_config()

    def _default_config(self) -> dict:
        return {
            "regular_hours": {
                "monday_to_saturday": {
                    "open": "08:00",
                    "close": "18:00",
                    "slot_interval_min": 60
                },
                "sunday": {
                    "status": "closed",
                    "reason": "Instalaciones cerradas por descanso médico del personal y mantenimiento preventivo. Atención regular de Lunes a Sábado de 8:00 a.m. a 6:00 p.m."
                }
            },
            "blocked_dates": [
                {
                    "id": "BLK-DOMINGOS",
                    "recurrence": "weekly_sunday",
                    "area": "all",
                    "reason": "Domingo cerrado para atención al público (Descanso Dra. Margaret y Staff)",
                    "created_by": "Dalybell Ramírez & Dra. Margaret"
                }
            ],
            "rooms": {
                "grooming": {
                    "id": "grooming",
                    "name": "Circuito Grooming Spa 7 Estaciones",
                    "max_capacity_per_hour": 3,
                    "responsable": "Dalybell Ramírez / Staff Spa",
                    "color": "#D4AF37",
                    "description": "Ozonoterapia, Baño Relajante e Hidratación de Pulpejos"
                },
                "clinica": {
                    "id": "clinica",
                    "name": "Consultorio & Quirófano Dra. Margaret",
                    "max_capacity_per_hour": 2,
                    "responsable": "Dra. Margaret",
                    "color": "#10B981",
                    "description": "Medicina Preventiva, Diagnóstico IDEXX y Cirugía"
                },
                "hotel": {
                    "id": "hotel",
                    "name": "Suites Bioclimáticas VIP Hotel 5★",
                    "max_capacity_per_hour": 8,
                    "responsable": "Equipo Hotel Mrs. Pets",
                    "color": "#3B82F6",
                    "description": "Hospedaje VIP, Monitoreo 24/7 y Parque Libre de Estrés"
                },
                "tienda": {
                    "id": "tienda",
                    "name": "Boutique & Asesoría Nutricional VIP",
                    "max_capacity_per_hour": 5,
                    "responsable": "Staff Boutique",
                    "color": "#F59E0B",
                    "description": "Alimentos Super Premium, Farmacia y Accesorios Exclusivos"
                }
            },
            "make_calendar_webhook_url": os.environ.get("MAKE_WEBHOOK_URL_LEIA", "https://hook.us2.make.com/fp4s0npi280ymzqi5cl6mfkf4cy3x2lg"),
            "google_calendar_id": "primary",
            "timezone": "America/Caracas",
            "last_synced_at": None
        }

    def save_config(self, new_config: Optional[dict] = None) -> dict:
        if new_config:
            self.config.update(new_config)
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            log.error("Error al guardar calendar_config.json: %s", e)
        return self.config

    # =========================================================================
    # REGLAS Y EVALUACIÓN DE DISPONIBILIDAD
    # =========================================================================

    def parse_date(self, d_str: str) -> Optional[date]:
        try:
            return datetime.strptime(str(d_str).split("T")[0].strip(), "%Y-%m-%d").date()
        except Exception:
            return None

    def is_sunday(self, target_date: date) -> bool:
        # En Python, Monday=0 ... Sunday=6
        return target_date.weekday() == 6

    def is_within_operating_hours(self, time_str: str) -> bool:
        try:
            t = str(time_str).strip()[:5]
            return "08:00" <= t <= "18:00"
        except Exception:
            return False

    def get_next_working_day(self, from_date: date) -> date:
        cand = from_date + timedelta(days=1)
        while self.is_sunday(cand):
            cand += timedelta(days=1)
        return cand

    def get_room_info(self, area: str) -> dict:
        norm = str(area or "").lower().strip()
        rooms = self.config.get("rooms", {})
        if norm in rooms:
            return rooms[norm]
        for k, v in rooms.items():
            if norm in k or k in norm:
                return v
        return {
            "id": norm or "general",
            "name": f"Área {norm.capitalize()}",
            "max_capacity_per_hour": 3,
            "responsable": "Staff Mrs. Pets",
            "color": "#D4AF37",
            "description": "Atención especializada"
        }

    def get_blocked_slots(self, target_date: Optional[date] = None, area: Optional[str] = None) -> List[dict]:
        blocks = self.config.get("blocked_dates", [])
        norm_area = str(area or "").lower().strip()
        result = []
        for b in blocks:
            # Recurrencia semanal de domingos
            if b.get("recurrence") == "weekly_sunday":
                if target_date and self.is_sunday(target_date):
                    result.append({
                        "id": b.get("id"),
                        "date": target_date.isoformat(),
                        "time": "all_day",
                        "area": "all",
                        "reason": b.get("reason", "Domingo cerrado para atención al público"),
                        "created_by": b.get("created_by", "Dalybell Ramírez & Dra. Margaret")
                    })
                elif not target_date:
                    result.append(b)
                continue

            b_date_str = str(b.get("date", "")).split("T")[0]
            if target_date and b_date_str != target_date.isoformat():
                continue

            b_area = str(b.get("area", "all")).lower().strip()
            if norm_area and b_area not in ("all", "todas", norm_area):
                continue

            result.append(b)
        return result

    def add_blocked_slot(self, date_str: str, time_str: str = "all_day", area: str = "all", reason: str = "", created_by: str = "Staff") -> dict:
        d = self.parse_date(date_str)
        if not d:
            raise ValueError(f"Fecha inválida: {date_str}. Formato requerido: YYYY-MM-DD")

        slot_id = f"BLK-{uuid.uuid4().hex[:6].upper()}"
        new_block = {
            "id": slot_id,
            "date": d.isoformat(),
            "time": time_str or "all_day",
            "area": area or "all",
            "reason": reason or "Restricción operativa establecida por administración",
            "created_by": created_by,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self.config.setdefault("blocked_dates", []).append(new_block)
        self.save_config()

        # Notificar sincronización con Google Calendar vía Make
        try:
            payload = self.build_make_gcal_payload("block_created", new_block)
            self.dispatch_to_make(payload)
        except Exception as e:
            log.warning("No se pudo notificar a Make el bloqueo de fecha: %s", e)

        return new_block

    def remove_blocked_slot(self, slot_id: str) -> bool:
        blocks = self.config.get("blocked_dates", [])
        initial_len = len(blocks)
        blocks = [b for b in blocks if b.get("id") != slot_id]
        if len(blocks) != initial_len:
            self.config["blocked_dates"] = blocks
            self.save_config()
            return True
        return False

    def get_appointments_for_date(self, target_date: date, area: Optional[str] = None) -> List[dict]:
        """Obtiene citas de la base de datos si está disponible o de memoria/fallback."""
        d_str = target_date.isoformat()
        try:
            # Intento de consulta en base de datos real
            import db
            sql = "SELECT * FROM citas WHERE activo=TRUE AND fecha_dia = %s"
            params = [d_str]
            if area:
                sql += " AND area = %s"
                params.append(area)
            rows = db.q(sql, tuple(params))
            if rows:
                return rows
        except Exception:
            pass

        # Fallback a citas en memoria
        res = []
        for a in self._memory_appointments:
            a_date = str(a.get("fecha_dia") or a.get("date") or "").split("T")[0]
            if a_date == d_str:
                if not area or a.get("area") == area:
                    res.append(a)
        return res

    def check_availability(self, date_str: str, time_str: Optional[str] = None, area: str = "grooming") -> dict:
        """
        Evalúa disponibilidad integral:
        1. ¿Es fecha válida?
        2. ¿Es domingo? -> CERRADO con explicación y propuesta de próximo día hábil.
        3. ¿Está dentro del horario de 08:00 a 18:00?
        4. ¿Hay restricciones / bloqueos de la Dra. Margaret o Dalybell?
        5. ¿Hay cupo en la sala según aforo máximo?
        6. Devuelve lista de slots libres recomendados.
        """
        d = self.parse_date(date_str)
        if not d:
            today = date.today()
            d = today

        norm_area = str(area or "grooming").lower().strip()
        room = self.get_room_info(norm_area)
        max_cap = room.get("max_capacity_per_hour", 3)

        # 1. Regla inmutable: DOMINGOS CERRADOS
        if self.is_sunday(d):
            next_day = self.get_next_working_day(d)
            return {
                "available": False,
                "is_sunday": True,
                "date": d.isoformat(),
                "area": norm_area,
                "room_name": room.get("name"),
                "reason": "Nuestras instalaciones permanecen cerradas los días domingos para descanso de nuestro equipo médico y spa. Atendemos de Lunes a Sábado de 8:00 a.m. a 6:00 p.m. estrictamente.",
                "suggested_date": next_day.isoformat(),
                "suggested_message": f"Los domingos descansamos, pero con todo gusto podemos recibir a su consentido el próximo {self._format_day_name(next_day)} {next_day.strftime('%d/%m')} a partir de las 8:00 a.m.",
                "slots_available": []
            }

        # 2. Verificar bloqueos de fecha completa
        blocks = self.get_blocked_slots(d, norm_area)
        all_day_block = next((b for b in blocks if str(b.get("time", "")).lower() in ("all_day", "all", "")), None)
        if all_day_block:
            next_day = self.get_next_working_day(d)
            return {
                "available": False,
                "is_blocked": True,
                "date": d.isoformat(),
                "area": norm_area,
                "room_name": room.get("name"),
                "reason": f"Fecha no disponible por restricción médica/operativa: {all_day_block.get('reason')}",
                "suggested_date": next_day.isoformat(),
                "slots_available": []
            }

        # 3. Generar franjas estándar entre 08:00 y 17:00 (cierre estricto a las 18:00)
        standard_slots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
        existing_appts = self.get_appointments_for_date(d, norm_area)

        # Conteo de citas por hora
        slot_counts = {}
        for a in existing_appts:
            raw_time = str(a.get("fecha_hora") or a.get("time") or "08:00")
            if "T" in raw_time:
                raw_time = raw_time.split("T")[1][:5]
            elif " " in raw_time:
                raw_time = raw_time.split(" ")[1][:5]
            else:
                raw_time = raw_time[:5]
            slot_counts[raw_time] = slot_counts.get(raw_time, 0) + 1

        # Franjas bloqueadas parcialmente por horas
        blocked_hours = set()
        for b in blocks:
            b_time = str(b.get("time", "")).strip()[:5]
            if b_time and b_time != "all_d":
                blocked_hours.add(b_time)

        available_slots = []
        for s in standard_slots:
            if s in blocked_hours:
                continue
            if slot_counts.get(s, 0) >= max_cap:
                continue
            available_slots.append(s)

        # 4. Si se solicitó una hora específica
        if time_str:
            target_time = str(time_str).strip()[:5]
            if not self.is_within_operating_hours(target_time) or target_time > "17:30":
                return {
                    "available": False,
                    "date": d.isoformat(),
                    "time": target_time,
                    "area": norm_area,
                    "reason": "La hora solicitada está fuera de nuestro horario de atención (Lunes a Sábado de 8:00 a.m. a 6:00 p.m. estrictamente).",
                    "slots_available": available_slots
                }
            if target_time in blocked_hours:
                return {
                    "available": False,
                    "date": d.isoformat(),
                    "time": target_time,
                    "area": norm_area,
                    "reason": f"La hora {target_time} se encuentra bloqueada por personal médico/administrativo.",
                    "slots_available": available_slots
                }
            if slot_counts.get(target_time, 0) >= max_cap:
                return {
                    "available": False,
                    "date": d.isoformat(),
                    "time": target_time,
                    "area": norm_area,
                    "reason": f"Capacidad completa para la sala {room.get('name')} en el turno de las {target_time}.",
                    "slots_available": available_slots
                }
            return {
                "available": True,
                "date": d.isoformat(),
                "time": target_time,
                "area": norm_area,
                "room_name": room.get("name"),
                "responsable": room.get("responsable"),
                "slots_available": available_slots
            }

        return {
            "available": len(available_slots) > 0,
            "date": d.isoformat(),
            "area": norm_area,
            "room_name": room.get("name"),
            "responsable": room.get("responsable"),
            "slots_available": available_slots,
            "reason": "Turnos disponibles encontrados." if available_slots else "No quedan cupos disponibles para este día."
        }

    def _format_day_name(self, d: date) -> str:
        dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
        return dias[d.weekday()]

    # =========================================================================
    # MAKE.COM & GOOGLE CALENDAR SYNCHRONIZATION
    # =========================================================================

    def build_make_gcal_payload(self, event_type: str, item_data: dict) -> dict:
        """
        Construye el payload estructurado de Google Calendar para Make.com.
        Acepta citas o bloqueos de agenda y mapea el formato estándar de Google Calendar API.
        """
        area = item_data.get("area", "grooming")
        room = self.get_room_info(area)
        d_str = str(item_data.get("date") or item_data.get("fecha_dia") or date.today().isoformat()).split("T")[0]
        t_str = str(item_data.get("time") or item_data.get("fecha_hora") or "09:00")
        if "T" in t_str:
            t_str = t_str.split("T")[1][:5]
        elif " " in t_str:
            t_str = t_str.split(" ")[1][:5]
        else:
            t_str = t_str[:5]

        duration_min = int(item_data.get("duracion_min", 60))
        start_iso = f"{d_str}T{t_str}:00-04:00"

        # Calcular fin
        try:
            start_dt = datetime.strptime(f"{d_str} {t_str}", "%Y-%m-%d %H:%M")
            end_dt = start_dt + timedelta(minutes=duration_min)
            end_iso = f"{end_dt.strftime('%Y-%m-%d')}T{end_dt.strftime('%H:%M')}:00-04:00"
        except Exception:
            end_iso = f"{d_str}T10:00:00-04:00"

        pet_name = item_data.get("pet") or item_data.get("mascota_nombre") or "Consentido VIP"
        tutor_name = item_data.get("tutor") or item_data.get("tutor_nombre") or "Tutor VIP"
        service = item_data.get("service") or item_data.get("servicio_nombre") or room.get("name")
        code = item_data.get("codigo") or item_data.get("id") or f"APT-{uuid.uuid4().hex[:4].upper()}"

        summary = f"🐾 [{room.get('name')}] {pet_name} — Tutor: {tutor_name} ({code})"
        description = (
            f"📅 Cita Agendada vía Mrs. Pets Omnichannel & Leia Concierge VIP\n"
            f"• Sala / Servicio: {room.get('name')} ({service})\n"
            f"• Mascota: {pet_name}\n"
            f"• Tutor: {tutor_name}\n"
            f"• Responsable Asignado: {room.get('responsable')}\n"
            f"• Notas / Indicaciones: {item_data.get('notas', 'Atención protocolo Silent Luxury')}\n"
            f"• Código de Control: {code}"
        )

        return {
            "event": event_type,
            "source": "mrs_pets_calendar_engine",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "calendar_id": self.config.get("google_calendar_id", "primary"),
            "timezone": self.config.get("timezone", "America/Caracas"),
            "sala": {
                "id": room.get("id"),
                "name": room.get("name"),
                "responsable": room.get("responsable")
            },
            "appointment": {
                "id": code,
                "pet": pet_name,
                "tutor": tutor_name,
                "service": service,
                "area": area,
                "date": d_str,
                "time": t_str,
                "duration_min": duration_min
            },
            "google_calendar_event": {
                "summary": summary,
                "description": description,
                "location": "Mrs. Pets Corp — Avenida 2 El Milagro, Maracaibo, Zulia",
                "start": {
                    "dateTime": start_iso,
                    "timeZone": "America/Caracas"
                },
                "end": {
                    "dateTime": end_iso,
                    "timeZone": "America/Caracas"
                },
                "colorId": "10" if area == "grooming" else ("2" if area == "clinica" else "9"),
                "extendedProperties": {
                    "private": {
                        "mrs_pets_code": str(code),
                        "mrs_pets_area": str(area)
                    }
                }
            }
        }

    def dispatch_to_make(self, payload: dict, custom_url: Optional[str] = None) -> dict:
        url = custom_url or self.config.get("make_calendar_webhook_url") or os.environ.get("MAKE_WEBHOOK_URL_LEIA")
        if not url:
            return {"success": False, "reason": "No webhook URL configured"}

        ctx_ssl = ssl.create_default_context()
        ctx_ssl.check_hostname = False
        ctx_ssl.verify_mode = ssl.CERT_NONE

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json; charset=utf-8"},
            method="POST"
        )
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, context=ctx_ssl, timeout=6) as resp:
                resp_body = resp.read().decode("utf-8")
                dt = int((time.time() - t0) * 1000)
                self.config["last_synced_at"] = datetime.now(timezone.utc).isoformat()
                self.save_config()
                return {
                    "success": True,
                    "http_status": resp.status,
                    "latency_ms": dt,
                    "response": resp_body[:200]
                }
        except Exception as e:
            dt = int((time.time() - t0) * 1000)
            log.warning("Fallo despacho a Make Webhook (%s): %s", url, e)
            return {
                "success": False,
                "latency_ms": dt,
                "reason": str(e)
            }

    # =========================================================================
    # ICALENDAR (.ICS) FEED GENERATOR
    # =========================================================================

    def generate_ical_feed(self, days_ahead: int = 30) -> str:
        """
        Genera feed iCal estándar (RFC 5545) para suscripción directa desde
        Google Calendar, Apple Calendar u Outlook.
        """
        now = datetime.now(timezone.utc)
        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Mrs Pets Corp//Silent Luxury Calendar Engine v1.0//ES",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:Mrs. Pets — Agenda Operativa & Turnos",
            "X-WR-TIMEZONE:America/Caracas",
            "X-WR-CALDESC:Sincronización de citas y restricciones médicas de Mrs. Pets Corp"
        ]

        # Agregar citas
        today = date.today()
        for i in range(-7, days_ahead):
            curr_date = today + timedelta(days=i)
            appts = self.get_appointments_for_date(curr_date)
            for a in appts:
                code = a.get("codigo") or a.get("id") or "APT"
                d_str = curr_date.strftime("%Y%m%d")
                t_str = str(a.get("fecha_hora") or a.get("time") or "09:00")
                if "T" in t_str:
                    t_str = t_str.split("T")[1][:5].replace(":", "")
                elif " " in t_str:
                    t_str = t_str.split(" ")[1][:5].replace(":", "")
                else:
                    t_str = t_str[:5].replace(":", "")

                pet = a.get("mascota_nombre") or a.get("pet") or "Consentido"
                tutor = a.get("tutor_nombre") or a.get("tutor") or "Tutor VIP"
                area = a.get("area", "grooming")
                room = self.get_room_info(area)

                lines.extend([
                    "BEGIN:VEVENT",
                    f"UID:mrspets-{code}-{curr_date.isoformat()}@mrspets.com",
                    f"DTSTAMP:{now.strftime('%Y%m%dT%H%M%SZ')}",
                    f"DTSTART:{d_str}T{t_str}00",
                    f"DTEND:{d_str}T{int(t_str[:2])+1:02d}{t_str[2:]}00",
                    f"SUMMARY:🐾 [{room.get('name')}] {pet} ({tutor})",
                    f"DESCRIPTION:Turno {code} - Mascota: {pet} - Tutor: {tutor} - Responsable: {room.get('responsable')}",
                    "LOCATION:Mrs. Pets Corp - Avenida 2 El Milagro, Maracaibo",
                    "STATUS:CONFIRMED",
                    "END:VEVENT"
                ])

        # Agregar bloqueos
        blocks = self.config.get("blocked_dates", [])
        for b in blocks:
            if b.get("recurrence") == "weekly_sunday":
                continue
            b_date_str = str(b.get("date", "")).replace("-", "")
            if not b_date_str:
                continue
            lines.extend([
                "BEGIN:VEVENT",
                f"UID:block-{b.get('id', 'blk')}@mrspets.com",
                f"DTSTAMP:{now.strftime('%Y%m%dT%H%M%SZ')}",
                f"DTSTART;VALUE=DATE:{b_date_str}",
                f"SUMMARY:⛔ [RESTRICCIÓN] {b.get('reason', 'Bloqueado por Staff')}",
                f"DESCRIPTION:Restricción configurada por {b.get('created_by', 'Dra. Margaret / Dalybell')}",
                "LOCATION:Mrs. Pets Corp",
                "STATUS:CONFIRMED",
                "END:VEVENT"
            ])

        lines.append("END:VCALENDAR")
        return "\r\n".join(lines)

    # =========================================================================
    # CONTEXTO EN TIEMPO REAL PARA INFERENCIA DE LEIA CONCIERGE (GEMINI)
    # =========================================================================

    def get_leia_context_summary(self, target_date: Optional[date] = None, target_area: Optional[str] = "grooming") -> str:
        """
        Genera bloque de conocimiento en tiempo real para inyectar en el system prompt
        de Gemini cuando el usuario pregunte por reservas, disponibilidad o citas.
        """
        today = date.today()
        eval_date = target_date or today
        area = target_area or "grooming"
        room = self.get_room_info(area)

        avail = self.check_availability(eval_date.isoformat(), area=area)
        tomorrow = today + timedelta(days=1)
        avail_tomorrow = self.check_availability(tomorrow.isoformat(), area=area)

        slots_today_str = ", ".join(avail.get("slots_available", [])) if avail.get("slots_available") else "Sin turnos libres"
        slots_tomorrow_str = ", ".join(avail_tomorrow.get("slots_available", [])) if avail_tomorrow.get("slots_available") else "Sin turnos libres"

        return (
            f"\n[AGENDA Y DISPONIBILIDAD EN TIEMPO REAL - MRS. PETS CORP]\n"
            f"• Fecha Actual del Sistema: {today.strftime('%Y-%m-%d')} ({self._format_day_name(today)}).\n"
            f"• Horario de Operaciones: Lunes a Sábado de 08:00 AM a 06:00 PM (18:00) estrictamente.\n"
            f"• REGLA INMUTABLE DE DOMINGOS: Domingos CERRADO para atención regular (descanso médico y de instalaciones de la Dra. Margaret y Dalybell). Si un cliente solicita cita un domingo, explícale con extrema amabilidad y elegancia que los domingos descansamos y ofrécele inmediatamente el sábado o lunes.\n"
            f"• Sala consultada: {room.get('name')} (Responsable: {room.get('responsable')}).\n"
            f"• Disponibilidad Hoy ({today.strftime('%d/%m')}): {slots_today_str}.\n"
            f"• Disponibilidad Mañana ({tomorrow.strftime('%d/%m')}): {slots_tomorrow_str}.\n"
            f"• Sincronización Google Calendar: Activa vía Make.com. Toda reserva confirmada se agenda de inmediato en el calendario de la clínica.\n"
            f"• INSTRUCCIÓN: Si el cliente desea agendar, pregúntale el nombre de su consentido y el servicio deseado, indícale las horas disponibles arriba y confirma su turno con la calidez del Lujo Silencioso.\n"
        )


# Singleton
calendar_engine = CalendarEngine()
