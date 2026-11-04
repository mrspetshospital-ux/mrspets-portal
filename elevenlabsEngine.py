#!/usr/bin/env python3
"""
Mrs. Pets Maracaibo - ElevenLabs AI Voice Orchestration Gateway
Big & Little Dogs, C.A. • RIF J-40120233-0 • Av. 2 El Milagro diagonal Lago Mall

Módulo oficial de Text-to-Speech (TTS) hiperrealista con ElevenLabs para:
- 🎀 Leia Concierge VIP (Canal de Voz, llamadas y atención al cliente)
- 💼 Vanessa (Recursos Humanos & Selección de Talento)
- 📢 O'Neal (Telemercadeo, Campañas & Reservaciones)
- 🛠️ Mike Teamily (Infraestructura, Mantenimiento & Calidad IoT)
- 👑 Manolo (Liderazgo de Sucursal, 7 Estaciones & Cierre 6:00 PM)
- 📦 Pandora (Cadena de Suministro & Filtro KillCritic)
- ⚖️ Charlie Finance (Tesorería BCV, IVA 16% SENIAT & POS)

Características:
- Resolución automática de Voice ID por nombre/slug de agente (Vanessa -> Voice ID de Vanessa).
- Lectura segura de API Key desde .env sin exposición en el frontend.
- Generación y streaming de audio binario MP3 (audio/mpeg).
- Mecanismo de Fallback inteligente hacia Web Speech API si la API key está pendiente o sin saldo.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
import ssl
from typing import Dict, Any, Optional

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(DIRECTORY, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
AUDIT_LOG_FILE = os.path.join(LOGS_DIR, "audit_trail.jsonl")

def load_project_env() -> Dict[str, str]:
    """Carga variables desde el archivo .env sin sobreescribir las ya definidas en el entorno."""
    env_path = os.path.join(DIRECTORY, ".env")
    loaded = {}
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key not in os.environ:
                        os.environ[key] = val
                    loaded[key] = os.environ[key]
        except Exception as e:
            print(f"[ElevenLabsEngine] Advertencia leyendo .env: {e}")
    return loaded

class ElevenLabsEngine:
    def __init__(self):
        load_project_env()
        self.default_model_id = os.environ.get("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")
        self.api_base_url = "https://api.elevenlabs.io/v1"
        
        # Mapeo oficial de agentes con sus personalidades y Voice IDs predeterminados de ElevenLabs
        self.agent_voice_map = {
            "leia": {
                "name": "Leia Concierge VIP",
                "role": "Asistente Ejecutiva & Concierge VIP",
                "persona": "Femenino cálido, sofisticado, cordial, Silent Luxury",
                "env_var": "ELEVENLABS_VOICE_LEIA",
                "default_voice_id": "b2htR0pMe28pYwCY9gnP",  # Sofía - Natural and Conversational
                "default_stability": 0.50,
                "default_similarity_boost": 0.85
            },
            "vanessa": {
                "name": "Valeria (RRHH & Talento)",
                "role": "Recursos Humanos & Selección de Talento",
                "persona": "Femenino ejecutivo, empático, formal, profesional",
                "env_var": "ELEVENLABS_VOICE_VANESSA",
                "default_voice_id": "EXAVITQu4vr4xnSDxMaL",  # Bella / Sarah
                "default_stability": 0.55,
                "default_similarity_boost": 0.80
            },
            "oneal": {
                "name": "O'Neal (Telemercadeo & Ops)",
                "role": "Telemercadeo, Campañas & Reservaciones",
                "persona": "Masculino enérgico, comercial, dinámico, persuasivo",
                "env_var": "ELEVENLABS_VOICE_ONEAL",
                "default_voice_id": "ErXwobaYiN019PkySvjV",  # Antoni
                "default_stability": 0.45,
                "default_similarity_boost": 0.80
            },
            "mike": {
                "name": "Mike Teamily (Infraestructura)",
                "role": "Calidad & Mantenimiento IoT",
                "persona": "Masculino técnico, sobrio, calmado, resolutivo",
                "env_var": "ELEVENLABS_VOICE_MIKE",
                "default_voice_id": "TX3LPaxmHKxFdv7VOQHJ",  # Liam
                "default_stability": 0.60,
                "default_similarity_boost": 0.75
            },
            "manolo": {
                "name": "Manolo (Líder de Piso)",
                "role": "Operaciones & Grooming 7 Estaciones",
                "persona": "Masculino experimentado, dinámico, líder de sucursal",
                "env_var": "ELEVENLABS_VOICE_MANOLO",
                "default_voice_id": "VR6AewLTigWG4xSOukaG",  # Arnold
                "default_stability": 0.50,
                "default_similarity_boost": 0.80
            },
            "pandora": {
                "name": "Pandora (Core)",
                "role": "Abastecimiento & Filtro KillCritic",
                "persona": "Femenino analítico, estructurado, calculador de stock",
                "env_var": "ELEVENLABS_VOICE_PANDORA",
                "default_voice_id": "ThT5KcBeYPX3keUQqHPh",  # Dorothy
                "default_stability": 0.55,
                "default_similarity_boost": 0.80
            },
            "charlie": {
                "name": "Charlie Finance",
                "role": "Tesorería BCV & Auditoría SENIAT",
                "persona": "Masculino formal, riguroso, numérico e institucional",
                "env_var": "ELEVENLABS_VOICE_CHARLIE",
                "default_voice_id": "b2htR0pMe28pYwCY9gnP",  # Sofía / Custom ElevenLabs Voice
                "default_stability": 0.65,
                "default_similarity_boost": 0.80
            },
            "sebastian": {
                "name": "Sebastian Ventas",
                "role": "Ventas & Conversión Comercial",
                "persona": "Masculino dinámico, empático y consultivo",
                "env_var": "ELEVENLABS_VOICE_SEBASTIAN",
                "default_voice_id": "ErXwobaYiN019PkySvjV",  # Antoni
                "default_stability": 0.50,
                "default_similarity_boost": 0.80
            },
            "rocky": {
                "name": "Supply Chain Strategist Rocky",
                "role": "Logística & Cadena de Suministro",
                "persona": "Masculino analítico, estratégico y resolutivo",
                "env_var": "ELEVENLABS_VOICE_ROCKY",
                "default_voice_id": "TX3LPaxmHKxFdv7VOQHJ",  # Liam
                "default_stability": 0.60,
                "default_similarity_boost": 0.75
            },
            "mrspetshospital": {
                "name": "mrspetshospital Offer & Lead Gen",
                "role": "Captación Clínica & Planes de Salud",
                "persona": "Femenino cálido, profesional médico y preventivo",
                "env_var": "ELEVENLABS_VOICE_HOSPITAL",
                "default_voice_id": "EXAVITQu4vr4xnSDxMaL",  # Sarah
                "default_stability": 0.55,
                "default_similarity_boost": 0.80
            },
            "ai_recruiter": {
                "name": "AI Recruiter",
                "role": "Screening Automatizado de Talento",
                "persona": "Femenino neutro, ágil y estructurado",
                "env_var": "ELEVENLABS_VOICE_AI_RECRUITER",
                "default_voice_id": "b2htR0pMe28pYwCY9gnP",  # Sofía
                "default_stability": 0.50,
                "default_similarity_boost": 0.85
            },
            "hospitality": {
                "name": "Hospitality Guest Services",
                "role": "Hotel 5 Estrellas & Guardería Diurna",
                "persona": "Femenino afectivo, detallista y reconfortante",
                "env_var": "ELEVENLABS_VOICE_HOSPITALITY",
                "default_voice_id": "EXAVITQu4vr4xnSDxMaL",  # Sarah
                "default_stability": 0.55,
                "default_similarity_boost": 0.80
            },
            "customer_service": {
                "name": "Customer Service",
                "role": "Atención al Tutor & CSAT Post-Venta",
                "persona": "Femenino empático, paciente y resolutivo",
                "env_var": "ELEVENLABS_VOICE_CUSTOMER_SERVICE",
                "default_voice_id": "b2htR0pMe28pYwCY9gnP",  # Sofía
                "default_stability": 0.50,
                "default_similarity_boost": 0.85
            },
            "training_designer": {
                "name": "Corporate Training Designer",
                "role": "Capacitación & Silent Luxury",
                "persona": "Femenino pedagógico, claro e inspirador",
                "env_var": "ELEVENLABS_VOICE_TRAINING",
                "default_voice_id": "ThT5KcBeYPX3keUQqHPh",  # Dorothy
                "default_stability": 0.55,
                "default_similarity_boost": 0.80
            },
            "mauro_che": {
                "name": "Mauro Che Directo Publicista",
                "role": "Creatividad Publicitaria & Storytelling",
                "persona": "Masculino apasionado, persuasivo y disruptivo",
                "env_var": "ELEVENLABS_VOICE_MAURO_CHE",
                "default_voice_id": "ErXwobaYiN019PkySvjV",  # Antoni
                "default_stability": 0.45,
                "default_similarity_boost": 0.80
            },
            "super_agent": {
                "name": "Super Agent",
                "role": "Orquestador General & Auditor Maestro",
                "persona": "Masculino directivo, sintético y con autoridad",
                "env_var": "ELEVENLABS_VOICE_SUPER_AGENT",
                "default_voice_id": "VR6AewLTigWG4xSOukaG",  # Arnold
                "default_stability": 0.60,
                "default_similarity_boost": 0.85
            }
        }

    def get_api_key(self) -> str:
        load_project_env()
        key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
        if key in ["", "your_elevenlabs_api_key_here", "TU_API_KEY", "your_xi_api_key_here"]:
            return ""
        return key

    def save_api_key(self, api_key: str) -> bool:
        """Guarda la API Key en el archivo .env y en os.environ."""
        key = api_key.strip()
        os.environ["ELEVENLABS_API_KEY"] = key
        env_path = os.path.join(DIRECTORY, ".env")
        if os.path.exists(env_path):
            try:
                lines = []
                found = False
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.startswith("ELEVENLABS_API_KEY="):
                            lines.append(f"ELEVENLABS_API_KEY={key}\n")
                            found = True
                        else:
                            lines.append(line)
                if not found:
                    lines.append(f"\nELEVENLABS_API_KEY={key}\n")
                with open(env_path, "w", encoding="utf-8") as f:
                    f.writelines(lines)
                return True
            except Exception as e:
                print(f"[ElevenLabsEngine] Error guardando API Key en .env: {e}")
        return False

    def resolve_voice_id(self, agent_id: str, custom_voice_id: Optional[str] = None) -> str:
        """
        Resuelve automáticamente el Voice ID correspondiente al agente.
        Si se pasa Vanessa, selecciona el ID de Vanessa automáticamente.
        Permite override con custom_voice_id si se especifica.
        """
        if custom_voice_id and custom_voice_id.strip():
            return custom_voice_id.strip()

        # Normalizar ID de agente
        clean_id = (agent_id or "leia").lower().strip().replace("'", "").replace(" ", "_")
        if "vanessa" in clean_id or "valeria" in clean_id:
            target = "vanessa"
        elif "oneal" in clean_id:
            target = "oneal"
        elif "mike" in clean_id:
            target = "mike"
        elif "manolo" in clean_id:
            target = "manolo"
        elif "pandora" in clean_id:
            target = "pandora"
        elif "charlie" in clean_id or "charly" in clean_id:
            target = "charlie"
        elif "sebastian" in clean_id:
            target = "sebastian"
        elif "rocky" in clean_id:
            target = "rocky"
        elif "hospital" in clean_id:
            target = "mrspetshospital"
        elif "recruiter" in clean_id:
            target = "ai_recruiter"
        elif "hospitality" in clean_id:
            target = "hospitality"
        elif "customer" in clean_id:
            target = "customer_service"
        elif "training" in clean_id:
            target = "training_designer"
        elif "mauro" in clean_id:
            target = "mauro_che"
        elif "super" in clean_id:
            target = "super_agent"
        else:
            target = "leia"

        spec = self.agent_voice_map.get(target, self.agent_voice_map["leia"])
        env_val = os.environ.get(spec["env_var"], "").strip()
        if env_val and env_val not in ["ID_VOZ", "your_voice_id_here", "ID_VOZ_LEIA", "ID_VOZ_VANESSA"]:
            return env_val
        return spec["default_voice_id"]

    def get_agent_specs(self, agent_id: str) -> Dict[str, Any]:
        clean_id = (agent_id or "leia").lower().strip().replace("'", "").replace(" ", "_")
        for key, spec in self.agent_voice_map.items():
            if key in clean_id:
                return spec
        return self.agent_voice_map["leia"]

    def get_config(self) -> Dict[str, Any]:
        """Retorna la configuración activa de ElevenLabs y estado de credenciales."""
        api_key = self.get_api_key()
        has_key = bool(api_key and len(api_key) > 10)

        catalog = {}
        for agent_key, meta in self.agent_voice_map.items():
            catalog[agent_key] = {
                "name": meta["name"],
                "role": meta["role"],
                "persona": meta["persona"],
                "env_var": meta["env_var"],
                "active_voice_id": self.resolve_voice_id(agent_key),
                "configured_in_env": bool(os.environ.get(meta["env_var"]))
            }

        return {
            "status": "ready" if has_key else "pending_key",
            "api_key_configured": has_key,
            "api_key_masked": f"{api_key[:6]}...{api_key[-4:]}" if has_key else "NO_CONFIGURADA",
            "model_id": os.environ.get("ELEVENLABS_MODEL_ID", self.default_model_id),
            "agents": catalog,
            "fallback_engine": "Web Speech API (Browser Synthesis)",
            "endpoint": "/api/v1/voice/tts"
        }

    def generate_speech(
        self,
        text: str,
        agent_id: str = "leia",
        voice_id: Optional[str] = None,
        model_id: Optional[str] = None,
        voice_settings: Optional[Dict[str, Any]] = None,
        allow_fallback: bool = True
    ) -> Dict[str, Any]:
        """
        Ejecuta la llamada a ElevenLabs para sintetizar audio.
        Si la API key no está lista, retorna status='pending_key' con flag fallback=True.
        """
        if not text or not text.strip():
            return {
                "status": "error",
                "message": "El texto a sintetizar no puede estar vacío.",
                "fallback": False
            }

        resolved_voice_id = self.resolve_voice_id(agent_id, voice_id)
        spec = self.get_agent_specs(agent_id)
        api_key = self.get_api_key()

        # Si no hay API Key configurada aún, devolvemos respuesta lista para fallback
        if not api_key:
            return {
                "status": "pending_key",
                "message": "ElevenLabs API Key pendiente en .env. Se usará el sintetizador nativo de respaldo.",
                "agent_id": agent_id,
                "agent_name": spec["name"],
                "resolved_voice_id": resolved_voice_id,
                "fallback": True
            }

        # Configuración de voz optimizada
        settings = voice_settings or {
            "stability": spec.get("default_stability", 0.50),
            "similarity_boost": spec.get("default_similarity_boost", 0.80),
            "style": 0.15,
            "use_speaker_boost": True
        }

        url = f"{self.api_base_url}/text-to-speech/{resolved_voice_id}"
        payload = {
            "text": text,
            "model_id": model_id or os.environ.get("ELEVENLABS_MODEL_ID", self.default_model_id),
            "voice_settings": settings
        }

        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }

        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")

        def _get_ssl_context():
            try:
                return ssl.create_default_context()
            except Exception:
                return ssl._create_unverified_context()

        context = _get_ssl_context()
        try:
            try:
                resp = urllib.request.urlopen(req, timeout=12, context=context)
            except ssl.SSLError:
                context = ssl._create_unverified_context()
                resp = urllib.request.urlopen(req, timeout=12, context=context)

            with resp:
                audio_bytes = resp.read()
                self._log_audit("ELEVENLABS_TTS_SUCCESS", {
                    "agent_id": agent_id,
                    "voice_id": resolved_voice_id,
                    "bytes_len": len(audio_bytes),
                    "text_chars": len(text)
                })
                return {
                    "status": "success",
                    "audio_bytes": audio_bytes,
                    "content_type": "audio/mpeg",
                    "agent_id": agent_id,
                    "agent_name": spec["name"],
                    "voice_id": resolved_voice_id
                }
        except urllib.error.HTTPError as http_err:
            raw_err = http_err.read().decode("utf-8", errors="ignore")
            error_msg = f"HTTP {http_err.code}: {raw_err}"

            # Recuperación inteligente para cuentas Free Tier (si allow_fallback=True):
            # ElevenLabs restringe voces de la Voice Library (error 402 paid_plan_required).
            # En lugar de degradar a voz robótica del navegador, conmutamos a una voz oficial Premade de ElevenLabs
            # para que el usuario reciba audio hiperrealista real de ElevenLabs.
            if allow_fallback and http_err.code == 402 and "paid_plan_required" in raw_err:
                is_female = any(f in agent_id.lower() for f in ["leia", "vanessa", "pandora", "dani"])
                fallback_premade = "EXAVITQu4vr4xnSDxMaL" if is_female else "IKne3meq5aSn9XLyUdCD"
                if resolved_voice_id != fallback_premade:
                    try:
                        retry_url = f"{self.api_base_url}/text-to-speech/{fallback_premade}"
                        retry_req = urllib.request.Request(retry_url, data=req_data, headers=headers, method="POST")
                        fallback_ctx = ssl._create_unverified_context()
                        with urllib.request.urlopen(retry_req, timeout=12, context=fallback_ctx) as retry_resp:
                            retry_bytes = retry_resp.read()
                            self._log_audit("ELEVENLABS_TTS_PREMADE_RECOVERY", {
                                "agent_id": agent_id,
                                "requested_voice": resolved_voice_id,
                                "recovered_voice": fallback_premade,
                                "bytes_len": len(retry_bytes)
                            })
                            return {
                                "status": "success",
                                "audio_bytes": retry_bytes,
                                "content_type": "audio/mpeg",
                                "agent_id": agent_id,
                                "agent_name": spec["name"],
                                "voice_id": fallback_premade,
                                "note": "Recuperado automáticamente con voz premade oficial de ElevenLabs por restricción de plan Free en voces de biblioteca."
                            }
                    except Exception as retry_err:
                        error_msg += f" (Intento de fallback premade: {retry_err})"

            self._log_audit("ELEVENLABS_TTS_ERROR", {
                "agent_id": agent_id,
                "voice_id": resolved_voice_id,
                "error": error_msg
            })
            return {
                "status": "error",
                "http_code": http_err.code,
                "message": error_msg,
                "fallback": True,
                "agent_id": agent_id,
                "voice_id": resolved_voice_id
            }
        except Exception as e:
            self._log_audit("ELEVENLABS_TTS_EXCEPTION", {
                "agent_id": agent_id,
                "voice_id": resolved_voice_id,
                "error": str(e)
            })
            return {
                "status": "error",
                "message": str(e),
                "fallback": True,
                "agent_id": agent_id,
                "voice_id": resolved_voice_id
            }

    def _log_audit(self, event_type: str, details: Dict[str, Any]):
        log_entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "event_type": event_type,
            "details": details
        }
        try:
            with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        except Exception:
            pass

elevenlabs_engine = ElevenLabsEngine()
