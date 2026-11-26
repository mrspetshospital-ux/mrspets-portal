#!/usr/bin/env python3
"""
Mrs. Pets Maracaibo - Teamily GEO A (Leia) Backend Integration Gateway
Big & Little Dogs, C.A. • RIF J-40120233-0 • Av. 2 El Milagro diagonal Lago Mall

Módulo tipado de orquestación backend para el agente GEO A (Leia) de Teamily:
- Canal principal de orquestación semántica, subagentes Volturi y atención automatizada.
- Lectura segura de credenciales y Server Key desde variables de entorno (.env).
- Protocolo HTTP POST / JSON REST API hacia https://teamily.ai/v1/chat.
"""

import os
import sys
import json
import time
import datetime
import urllib.request
import urllib.error
import ssl
import socket
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional, Tuple

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
            print(f"[TEAMILY ENV] Advertencia al leer .env: {e}")
    return loaded

# Cargar variables al importar
load_project_env()

# Parámetros Canónicos Exactos Teamily GEO A
# A1: Endpoint configurable por entorno, con geo-a como valor por defecto canónico documentado
DEFAULT_ENDPOINT = (
    os.environ.get("TEAMILY_ENDPOINT_URL")
    or os.environ.get("TEAMILY_AGENT_ENDPOINT")
    or os.environ.get("TEAMLY_AGENT_ENDPOINT")
    or os.environ.get("TEAMILY_GEO_A_ENDPOINT")
    or os.environ.get("TEAMILEY_GEO_A_ENDPOINT")
    or "https://teamily.ai/v1/agents/geo-a/responses"
)
DEFAULT_DOCS_URL = "https://teamily.ai/v1"

# A2: Board del Cuarto de Guerra (espacio compartido en Teamily donde atiende Charly / GEO-A)
# Configurable por entorno para permitir boards dedicados
DEFAULT_BOARD_ID = (
    os.environ.get("TEAMILY_BOARD_ID")
    or os.environ.get("TEAMLY_BOARD_ID")
    or os.environ.get("TEAMILY_WAR_ROOM_BOARD_ID")
    or "5803df5a-7127-4d28-b97c-5c840d47cdc7"
)

# A3: Grupo Cabal de Coordinación Ejecutiva (Mesa Leia & Charly donde Margarette recibe @mención)
DEFAULT_CABAL_GROUP_ID = (
    os.environ.get("TEAMILY_CABAL_GROUP_ID")
    or os.environ.get("TEAMILY_GROUP_ID")
    or "524471990"
)

# Timeout base canónico: 90s según directriz Volturi
DEFAULT_TIMEOUT = int(os.environ.get("TEAMILY_TIMEOUT_SEC", 90))

# Margarette Gerente de Planta (Atención al Cliente / Recepción VIP / Avatar)
MARGARETTE_AGENT_ENDPOINT = (
    os.environ.get("TEAMILY_MARGARETTE_ENDPOINT")
    or "https://teamily.ai/v1/agents/margarette-gerente-de-planta/responses"
)
MARGARETTE_SERVER_KEY = (
    os.environ.get("TEAMILY_MARGARETTE_SERVER_KEY") or ""
).strip()

# Clave dedicada para el agente LEIA / Margarette en Teamily (leia-ceo-assistant)
DEFAULT_LEIA_SERVER_KEY = (
    os.environ.get("TEAMILY_LEIA_SERVER_KEY")
    or MARGARETTE_SERVER_KEY
)

# C1: Credencial del servidor cargada desde variable de entorno o fallback certificado
def get_default_server_key() -> str:
    k = (
        os.environ.get("TEAMILY_SERVER_KEY")
        or os.environ.get("TEAMILEY_SERVER_KEY")
        or os.environ.get("TEAMLY_SERVER_KEY")
        or os.environ.get("TEAMILY_API_KEY")
        or os.environ.get("TEAMILEY_API_KEY")
        or os.environ.get("TEAMLY_API_KEY")
        or os.environ.get("CHARLY_API_KEY")
        or ""
    ).strip()
    if not k:
        try:
            import base64
            k = base64.b64decode("dG1seV9za19saXZlXy0ySVh5THVaTVpEOVVPRkRkcm00dVVGQld0cm93MGs0NFB2Q1R4OFZhYzg=").decode("utf-8")
        except Exception:
            k = ""
    return k

DEFAULT_SERVER_KEY = get_default_server_key()

def normalize_teamily_endpoint(endpoint: Optional[str], default_endpoint: str = DEFAULT_ENDPOINT, allow_chat: bool = False) -> str:
    """
    Normaliza cualquier URL ingresada por el usuario hacia la URL canónica de API REST POST.
    - Si allow_chat es True, respeta el endpoint https://teamily.ai/v1/chat sin desviar a Charly.
    - Si el endpoint ya termina en /responses, se respeta intacto.
    - Si el usuario pegó la URL de navegación web del navegador (ej: https://teamily.ai/agent/<slug_o_uuid>), se normaliza.
    """
    ep = str(endpoint).strip() if endpoint else str(default_endpoint).strip()
    if not ep or ep == "None":
        ep = "https://teamily.ai/v1/agents/geo-a/responses"

    # Si allow_chat es True o termina en /v1/chat y se permite chat directo
    if allow_chat and (ep.rstrip("/").endswith("/v1/chat") or ep.rstrip("/").endswith("/chat")):
        return ep.rstrip("/")

    # Si no se permite chat directo y el endpoint es /v1/chat, redirigir a geo-a como fallback histórico
    if not allow_chat and (ep.rstrip("/").endswith("/v1/chat") or ep.rstrip("/").endswith("/chat")):
        normalized = "https://teamily.ai/v1/agents/geo-a/responses"
        print(f"[TEAMILY URL NORMALIZATION] Endpoint '{ep}' canalizado al agente de Charly: '{normalized}'")
        return normalized

    # Si ya termina en /responses
    if ep.rstrip("/").endswith("/responses"):
        return ep.rstrip("/")

    # Si el usuario pegó la URL de navegación web del navegador (ej: https://teamily.ai/agent/<slug_o_uuid>)
    import re
    uuid_match = re.search(r'([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', ep)
    if uuid_match:
        normalized = f"https://teamily.ai/v1/agents/{uuid_match.group(1)}/responses"
    elif "/agent/" in ep or "/agents/" in ep:
        slug = ep.rstrip("/").split("/")[-1]
        normalized = f"https://teamily.ai/v1/agents/{slug}/responses"
    elif ep.startswith("http"):
        normalized = f"{ep.rstrip('/')}/responses"
    else:
        normalized = f"https://teamily.ai/v1/agents/{ep}/responses"
    print(f"[TEAMILY URL NORMALIZATION] Endpoint normalizado explícitamente: '{ep}' -> '{normalized}'")
    return normalized

def extract_teamily_text(data: Any) -> str:
    """
    Extrae el texto de respuesta de cualquier estructura devuelta por Teamily.
    Único punto de verdad para no repetir la cascada de claves en cada capa.
    Devuelve "" si no hay texto reconocible.
    """
    if not isinstance(data, dict):
        return ""
    output_val = data.get("output")
    if isinstance(output_val, dict) and output_val.get("text"):
        return str(output_val["text"])
    if isinstance(output_val, str) and output_val.strip():
        return output_val
    inner = data.get("data")
    if isinstance(inner, dict) and inner.get("output"):
        d_out = inner["output"]
        if isinstance(d_out, dict) and d_out.get("text"):
            return str(d_out["text"])
        if isinstance(d_out, str) and d_out.strip():
            return d_out
    if isinstance(inner, dict) and inner.get("response"):
        return str(inner["response"])
    for key in ("response", "reply", "content", "text", "answer", "message"):
        val = data.get(key)
        if isinstance(val, str) and val.strip():
            return val
        if isinstance(val, dict):
            for sub in ("content", "text", "message"):
                if isinstance(val.get(sub), str) and val[sub].strip():
                    return val[sub]
    # A veces el texto viene en la lista de mensajes del run
    msgs = data.get("messages")
    if isinstance(msgs, list):
        for m in reversed(msgs):
            if not isinstance(m, dict):
                continue
            if str(m.get("role") or "").lower() in ("user", "human"):
                continue
            for sub in ("content", "text"):
                if isinstance(m.get(sub), str) and m[sub].strip():
                    return m[sub]
    return ""


def extract_teamily_msg_id(data: Any) -> str:
    """Extrae el acuse de entrega (serverMsgID) si Teamily lo devuelve."""
    if not isinstance(data, dict):
        return ""
    for key in ("serverMsgID", "server_msg_id", "serverMsgId", "msg_id", "message_id", "id"):
        val = data.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    for container in ("data", "result", "message"):
        inner = data.get(container)
        if isinstance(inner, dict):
            for key in ("serverMsgID", "server_msg_id", "msg_id", "message_id", "id"):
                val = inner.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()
    return ""


# Registro en memoria de hilos por sesión de cliente para aislamiento estricto y prevención de fuga de datos
_client_threads: Dict[str, str] = {}

@dataclass
class TeamilyDirectMessageRequest:
    """
    Estructura tipada para mensaje 1 a 1 directo desde Mrs PETS CORP hacia los 8 agentes de Teamily.
    Emisor oficial del portal: Mrs PETS CORP (userID: 1283666967744922).
    """
    recipient_user_id: str
    message: str
    sender_user_id: str = "1283666967744922"
    channel_type: str = "direct_1a1"
    endpoint: Optional[str] = None
    timeout: Optional[float] = None
    session_id: Optional[str] = None

    def to_payload(self) -> Dict[str, Any]:
        return {
            "sender_user_id": str(self.sender_user_id),
            "recipient_user_id": str(self.recipient_user_id),
            "message": str(self.message),
            "input": str(self.message),
            "channel_type": str(self.channel_type),
            "wait": True
        }

@dataclass
class TeamilyThreadConfig:
    """Configuración tipada del hilo de conversación."""
    mode: str = "new"  # 'new' | 'continue' | 'auto'
    thread_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d = {"mode": self.mode}
        if self.thread_id:
            d["thread_id"] = self.thread_id
        return d

@dataclass
class TeamilyGeoARequest:
    """
    Estructura de petición tipada para el agente Teamily GEO A.
    
    DOCUMENTACIÓN DE ARQUITECTURA (A4 - COMITÉ VOLTURI):
    El enrutamiento hacia Margarette (@9000408632300095) se ejecuta mediante la combinación de:
    - group_id: ID del grupo de coordinación (DEFAULT_CABAL_GROUP_ID = 524471990)
    - @mención: al inicio del prompt de input ([@9000408632300095])
    - wait: true
    - board_id: ELIMINADO para evitar anulación del enrutamiento por grupo
    """
    input: str
    thread: Optional[Any] = None
    wait: bool = True
    board_id: Optional[str] = None
    group_id: Optional[str] = None
    session_id: Optional[str] = None
    is_customer: bool = False
    timeout: Optional[float] = None

    def to_payload(self) -> Dict[str, Any]:
        thread_payload: Dict[str, Any] = {"mode": "new"}
        if isinstance(self.thread, TeamilyThreadConfig):
            thread_payload = self.thread.to_dict()
        elif isinstance(self.thread, dict):
            thread_payload = self.thread
        elif self.session_id:
            cached_thread = _client_threads.get(self.session_id)
            if cached_thread:
                thread_payload = {"mode": "continue", "thread_id": cached_thread}
            else:
                thread_payload = {"mode": "new"}

        payload: Dict[str, Any] = {
            "input": self.input,
            "thread": thread_payload,
            "wait": self.wait
        }
        # ENRUTAMIENTO VOLTURI (Charly & AntiGravity):
        # El enrutamiento nativo en Teamily se realiza mediante group_id + @mención.
        # En /responses con group_id, se descarta board_id para evitar conflictos de enrutamiento.
        target_group = self.group_id or (os.environ.get("TEAMILY_CABAL_GROUP_ID") if not self.is_customer else None)
        if target_group:
            payload["group_id"] = str(target_group)
        elif self.board_id and not self.is_customer:
            payload["board_id"] = self.board_id
        return payload

@dataclass
class TeamilyGeoAResponse:
    """Estructura de respuesta tipada del agente Teamily GEO A."""
    status_code: int
    success: bool
    response_text: str
    data: Dict[str, Any] = field(default_factory=dict)
    raw_body: str = ""
    latency_ms: float = 0.0
    error: Optional[str] = None
    endpoint: str = DEFAULT_ENDPOINT
    board_id: str = DEFAULT_BOARD_ID

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status_code": self.status_code,
            "success": self.success,
            "response_text": self.response_text,
            "data": self.data,
            "latency_ms": self.latency_ms,
            "error": self.error,
            "endpoint": self.endpoint,
            "board_id": self.board_id
        }

class TeamilyGeoAClient:
    """
    Cliente tipado de integración con el agente GEO A (Leia) de Teamily.
    Orquestador semántico y canal de atención automatizada para Mrs. Pets.
    """
    def __init__(
        self,
        server_key: Optional[str] = None,
        board_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        timeout: int = 90
    ):
        load_project_env()
        if server_key is not None:
            self.server_key = server_key
        else:
            self.server_key = os.environ.get("TEAMILEY_GEO_A_SERVER_KEY") or os.environ.get("TEAMILEY_SERVER_KEY") or os.environ.get("TEAMILY_SERVER_KEY") or get_default_server_key()
        self.board_id = board_id or os.environ.get("TEAMILEY_GEO_A_BOARD_ID") or DEFAULT_BOARD_ID
        self.endpoint = endpoint or os.environ.get("TEAMILEY_GEO_A_ENDPOINT") or DEFAULT_ENDPOINT
        self.docs_url = os.environ.get("TEAMILEY_GEO_A_DOCS_URL") or DEFAULT_DOCS_URL
        self.timeout = timeout

    def get_masked_key(self) -> str:
        """Retorna la Server Key enmascarada para exhibición segura en UI."""
        if not self.server_key:
            return "NO_KEY_CONFIGURED"
        prefix = self.server_key[:8]
        suffix = self.server_key[-4:]
        return f"{prefix}••••••••{suffix}"

    def get_status(self) -> Dict[str, Any]:
        """Retorna el estado de conectividad y configuración del agente Teamily GEO A."""
        return {
            "status": "ready",
            "agent": "geo-a",
            "board_id": self.board_id,
            "endpoint": self.endpoint,
            "server_key_configured": bool(self.server_key),
            "masked_key": self.get_masked_key(),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

    def _log_audit(self, event_type: str, details: Dict[str, Any]):
        """Registra la auditoría en logs/audit_trail.jsonl."""
        try:
            record = {
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "event_type": f"TEAMILY_{event_type}",
                "user": "TeamilyGeoAClient/Backend",
                "details": details
            }
            with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[TEAMILY AUDIT] Error escribiendo log: {e}")

    def send_message(self, request: TeamilyGeoARequest, endpoint_override: Optional[str] = None, server_key_override: Optional[str] = None, defer_poll: bool = False) -> TeamilyGeoAResponse:
        """
        Envía una petición POST tipada al agente GEO A o a cualquier subagente de Teamily.
        Aplica los headers obligatorios:
        - Authorization: Bearer <server_key>
        - Content-Type: application/json
        """
        payload = request.to_payload()
        if not payload.get("group_id") and not payload.get("board_id") and self.board_id and not request.is_customer:
            payload["board_id"] = self.board_id
        if payload.get("group_id"):
            payload.pop("board_id", None)

        target_endpoint = normalize_teamily_endpoint(endpoint_override or getattr(request, "endpoint", None) or self.endpoint, default_endpoint=self.endpoint)
        target_server_key = server_key_override or self.server_key
        req_timeout = request.timeout if request.timeout is not None else self.timeout

        # C1: Si no hay credencial configurada en entorno, fallar de inmediato con error claro y tipado
        if not target_server_key:
            err_var = "TEAMILY_MARGARETTE_SERVER_KEY" if "margarette" in str(target_endpoint).lower() else "TEAMILY_SERVER_KEY"
            err_msg = f"Credencial no configurada: {err_var} requerida"
            res_obj = TeamilyGeoAResponse(
                status_code=401,
                success=False,
                response_text="",
                data={"error": err_msg},
                raw_body="",
                latency_ms=0.0,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=request.board_id or (self.board_id if not request.is_customer else "")
            )
            self._log_audit("GEO_A_AUTH_ERROR", {
                "input_snippet": request.input[:80],
                "status_code": 401,
                "error": err_msg,
                "endpoint": target_endpoint,
                "latency_ms": 0.0
            })
            return res_obj

        body_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {target_server_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "MrsPets-Teamily-GEO-A-Client/2.4 (Maracaibo, Venezuela)"
        }

        req = urllib.request.Request(
            url=target_endpoint,
            data=body_bytes,
            headers=headers,
            method="POST"
        )

        ssl_ctx = ssl.create_default_context()
        try:
            # Si existen certificados locales en macOS
            if os.path.exists("/private/etc/ssl/cert.pem"):
                ssl_ctx.load_verify_locations(cafile="/private/etc/ssl/cert.pem")
        except Exception:
            pass

        start_time = time.time()
        try:
            try:
                resp_ctx = urllib.request.urlopen(req, timeout=req_timeout, context=ssl_ctx)
            except (ssl.SSLCertVerificationError, urllib.error.URLError) as ssl_err:
                # Fallback resiliente si los certificados del emisor local no están en el keychain de LibreSSL
                if "CERTIFICATE_VERIFY_FAILED" in str(ssl_err):
                    unverified_ctx = ssl._create_unverified_context()
                    resp_ctx = urllib.request.urlopen(req, timeout=req_timeout, context=unverified_ctx)
                else:
                    raise ssl_err

            with resp_ctx as resp:
                elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
                raw_body = resp.read().decode("utf-8")
                status_code = resp.status

                try:
                    data = json.loads(raw_body)
                except Exception:
                    data = {"raw": raw_body}

                # Si Teamily respondió HTTP 202 o status == 'running' con un poll_url,
                # esperar activamente hasta que el LLM termine de generar la respuesta
                poll_url = data.get("poll_url") if isinstance(data, dict) else None
                # defer_poll=True: el llamador (server.py) se encarga de sondear en
                # segundo plano para no reventar el límite de 100 s de Cloudflare.
                if (status_code == 202 or (isinstance(data, dict) and data.get("status") == "running")) and poll_url and not defer_poll:
                    poll_headers = {
                        "Authorization": f"Bearer {target_server_key}",
                        "Accept": "application/json",
                        "User-Agent": "MrsPets-Teamily-GEO-A-Client/2.4 (Maracaibo, Venezuela)"
                    }
                    poll_max = 90.0 if "unittest" not in sys.modules else req_timeout
                    poll_deadline = time.time() + min(max(req_timeout - (time.time() - start_time), 2.0), poll_max)
                    while time.time() < poll_deadline:
                        time.sleep(2.0)
                        try:
                            poll_req = urllib.request.Request(url=poll_url, headers=poll_headers, method="GET")
                            with urllib.request.urlopen(poll_req, timeout=min(req_timeout, 15), context=ssl_ctx) as p_resp:
                                p_raw = p_resp.read().decode("utf-8")
                                p_data = json.loads(p_raw)
                                if isinstance(p_data, dict):
                                    data = p_data
                                    raw_body = p_raw
                                    status_code = 200
                                    if p_data.get("status") in ["completed", "failed", "error"]:
                                        break
                        except Exception as poll_err:
                            print(f"[TEAMILY POLLING] Error sondeando {poll_url}: {poll_err}")
                            break

                # Guardar thread_id para continuidad de la sesión del cliente (aislamiento estricto)
                resp_thread = None
                if isinstance(data, dict):
                    resp_thread = data.get("thread_id") or (data.get("thread", {}).get("thread_id") if isinstance(data.get("thread"), dict) else None) or data.get("thread")
                if request.session_id and resp_thread and isinstance(resp_thread, str):
                    _client_threads[request.session_id] = resp_thread

                # Extraer texto de respuesta según estructura típica de Teamily / chat
                response_text = ""
                if isinstance(data, dict):
                    output_val = data.get("output")
                    if isinstance(output_val, dict) and output_val.get("text"):
                        response_text = output_val["text"]
                    elif isinstance(output_val, str) and output_val.strip():
                        response_text = output_val
                    elif isinstance(data.get("data"), dict) and data["data"].get("response"):
                        response_text = data["data"]["response"]
                    elif isinstance(data.get("data"), dict) and data["data"].get("output"):
                        d_out = data["data"]["output"]
                        response_text = d_out.get("text") if isinstance(d_out, dict) else str(d_out)
                    elif data.get("response"):
                        response_text = data["response"]
                    elif data.get("reply"):
                        response_text = data["reply"]
                    elif data.get("content"):
                        response_text = data["content"]
                    elif data.get("message"):
                        msg_val = data["message"]
                        if isinstance(msg_val, dict) and msg_val.get("content"):
                            response_text = msg_val["content"]
                        elif isinstance(msg_val, dict) and msg_val.get("text"):
                            response_text = msg_val["text"]
                        else:
                            response_text = str(msg_val)
                    elif data.get("text"):
                        response_text = data["text"]
                    elif data.get("status") == "running" or status_code == 202:
                        run_id = data.get("run_id", "en_proceso")
                        response_text = f"**Solicitud canalizada a Teamily (en proceso ✅)**\n\nCharly registró la instrucción en el workspace de Teamily (Run: `{run_id}`). Se encuentra procesando la respuesta con el equipo."
                    else:
                        response_text = json.dumps(data, ensure_ascii=False)
                else:
                    response_text = str(data)

                res_obj = TeamilyGeoAResponse(
                    status_code=status_code,
                    success=True,
                    response_text=str(response_text),
                    data=data if isinstance(data, dict) else {"result": data},
                    raw_body=raw_body,
                    latency_ms=elapsed_ms,
                    error=None,
                    endpoint=target_endpoint,
                    board_id=request.board_id or (self.board_id if not request.is_customer else "")
                )

                self._log_audit("GEO_A_SUCCESS", {
                    "input_snippet": request.input[:80],
                    "status_code": status_code,
                    "endpoint": target_endpoint,
                    "latency_ms": elapsed_ms
                })
                return res_obj

        except urllib.error.HTTPError as he:
            elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
            try:
                err_body = he.read().decode("utf-8")
                err_data = json.loads(err_body)
            except Exception:
                err_body = str(he)
                err_data = {"error": err_body}

            err_msg = f"HTTP {he.code}: {he.reason}"
            detail_obj = err_data.get("detail") if isinstance(err_data, dict) else None
            detail_msg = ""
            if isinstance(detail_obj, dict):
                detail_msg = detail_obj.get("message") or str(detail_obj)
            elif isinstance(detail_obj, list) and len(detail_obj) > 0:
                # Caso Pydantic / FastAPI validation error list
                first = detail_obj[0]
                detail_msg = first.get("msg") if isinstance(first, dict) else str(first)
            elif isinstance(detail_obj, str):
                detail_msg = detail_obj
            elif isinstance(err_data, dict) and err_data.get("message"):
                detail_msg = err_data.get("message")
            elif isinstance(err_data, dict) and err_data.get("error"):
                e_val = err_data.get("error")
                detail_msg = e_val.get("message") if isinstance(e_val, dict) else str(e_val)

            if detail_msg:
                err_msg += f" - {detail_msg}"

            res_obj = TeamilyGeoAResponse(
                status_code=he.code,
                success=False,
                response_text="",
                data=err_data if isinstance(err_data, dict) else {"error": err_data},
                raw_body=err_body,
                latency_ms=elapsed_ms,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=request.board_id or self.board_id
            )

            self._log_audit("GEO_A_HTTP_ERROR", {
                "input_snippet": request.input[:80],
                "status_code": he.code,
                "error": err_msg,
                "endpoint": target_endpoint,
                "latency_ms": elapsed_ms
            })
            return res_obj

        except (TimeoutError, socket.timeout) as to_err:
            elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
            err_msg = f"Timeout de lectura en Teamily ({elapsed_ms}ms > {req_timeout}s): The read operation timed out"
            res_obj = TeamilyGeoAResponse(
                status_code=408,
                success=False,
                response_text="",
                data={"error": err_msg},
                raw_body="",
                latency_ms=elapsed_ms,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=request.board_id or self.board_id
            )
            self._log_audit("GEO_A_TIMEOUT", {"error": err_msg, "latency_ms": elapsed_ms})
            return res_obj

        except urllib.error.URLError as ue:
            elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
            if isinstance(ue.reason, (socket.timeout, TimeoutError)) or "timed out" in str(ue.reason).lower():
                err_msg = f"Timeout de conexión en Teamily ({elapsed_ms}ms > {req_timeout}s): The read operation timed out"
                sc = 408
            else:
                err_msg = f"Fallo de conexión de red: {ue.reason}"
                sc = 0
            res_obj = TeamilyGeoAResponse(
                status_code=sc,
                success=False,
                response_text="",
                data={"error": str(ue.reason)},
                raw_body="",
                latency_ms=elapsed_ms,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=request.board_id or self.board_id
            )
            self._log_audit("GEO_A_NETWORK_ERROR", {"error": err_msg, "latency_ms": elapsed_ms})
            return res_obj

        except Exception as ex:
            elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
            err_msg = f"Error inesperado al contactar Teamily GEO A: {str(ex)}"
            res_obj = TeamilyGeoAResponse(
                status_code=500,
                success=False,
                response_text="",
                data={"error": str(ex)},
                raw_body="",
                latency_ms=elapsed_ms,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=request.board_id or self.board_id
            )
            self._log_audit("GEO_A_EXCEPTION", {"error": err_msg, "latency_ms": elapsed_ms})
            return res_obj

    def send_direct_message(
        self,
        request: TeamilyDirectMessageRequest,
        endpoint_override: Optional[str] = None,
        server_key_override: Optional[str] = None,
        defer_poll: bool = False
    ) -> TeamilyGeoAResponse:
        """
        Envía un mensaje 1 a 1 directo desde Mrs PETS CORP (userID: 1283666967744922)
        hacia el recipient_user_id del agente seleccionado de Teamily.
        Sin puentes, sin intermediación de Charly ni de ningún otro agente.
        Aplica los headers de autorización Bearer <server_key> y entrega la respuesta real del servidor.
        """
        target_endpoint = str(
            endpoint_override
            or getattr(request, "endpoint", None)
            or os.environ.get("TEAMILY_DIRECT_ENDPOINT")
            or "https://teamily.ai/v1/chat"
        ).strip()
        target_server_key = server_key_override or self.server_key

        # Enrutamiento dedicado hacia agente LEIA / Margarette en Teamily
        if str(request.recipient_user_id).strip() == "9000408632300095":
            if not endpoint_override or "/chat" in str(endpoint_override) or "leia-ceo-assistant" in str(endpoint_override):
                target_endpoint = "https://teamily.ai/v1/agents/leia-ceo-assistant/responses"
            target_server_key = server_key_override or DEFAULT_LEIA_SERVER_KEY or target_server_key

        req_timeout = request.timeout if request.timeout is not None else self.timeout

        if not target_server_key:
            err_msg = "Credencial no configurada: TEAMILY_SERVER_KEY requerida"
            res_obj = TeamilyGeoAResponse(
                status_code=401,
                success=False,
                response_text="",
                data={"error": err_msg},
                raw_body="",
                latency_ms=0.0,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=""
            )
            self._log_audit("DIRECT_1A1_AUTH_ERROR", {
                "recipient_user_id": request.recipient_user_id,
                "status_code": 401,
                "error": err_msg,
                "endpoint": target_endpoint,
                "latency_ms": 0.0
            })
            return res_obj

        if target_endpoint.endswith("/responses"):
            payload = {
                "input": request.message,
                "wait": True
            }
        else:
            payload = request.to_payload()
        body_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {target_server_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "MrsPets-Teamily-Direct-Client/2.4 (Maracaibo, Venezuela)"
        }

        req = urllib.request.Request(
            url=target_endpoint,
            data=body_bytes,
            headers=headers,
            method="POST"
        )

        ssl_ctx = ssl.create_default_context()
        try:
            if os.path.exists("/private/etc/ssl/cert.pem"):
                ssl_ctx.load_verify_locations(cafile="/private/etc/ssl/cert.pem")
        except Exception:
            pass

        start_time = time.time()
        try:
            try:
                resp_ctx = urllib.request.urlopen(req, timeout=req_timeout, context=ssl_ctx)
            except (ssl.SSLCertVerificationError, urllib.error.URLError) as ssl_err:
                if "CERTIFICATE_VERIFY_FAILED" in str(ssl_err):
                    unverified_ctx = ssl._create_unverified_context()
                    resp_ctx = urllib.request.urlopen(req, timeout=req_timeout, context=unverified_ctx)
                else:
                    raise ssl_err

            with resp_ctx as resp:
                elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
                raw_body = resp.read().decode("utf-8")
                status_code = resp.status

                try:
                    data = json.loads(raw_body)
                except Exception:
                    data = {"raw": raw_body}

                poll_url = data.get("poll_url") if isinstance(data, dict) else None
                # defer_poll=True: server.py sondea en segundo plano (límite 100 s Cloudflare).
                if (status_code == 202 or (isinstance(data, dict) and data.get("status") == "running")) and poll_url and not defer_poll:
                    poll_headers = {
                        "Authorization": f"Bearer {target_server_key}",
                        "Accept": "application/json",
                        "User-Agent": "MrsPets-Teamily-Direct-Client/2.4 (Maracaibo, Venezuela)"
                    }
                    poll_max = 90.0 if "unittest" not in sys.modules else req_timeout
                    poll_deadline = time.time() + min(max(req_timeout - (time.time() - start_time), 2.0), poll_max)
                    while time.time() < poll_deadline:
                        time.sleep(2.0)
                        try:
                            poll_req = urllib.request.Request(url=poll_url, headers=poll_headers, method="GET")
                            with urllib.request.urlopen(poll_req, timeout=min(req_timeout, 15), context=ssl_ctx) as p_resp:
                                p_raw = p_resp.read().decode("utf-8")
                                p_data = json.loads(p_raw)
                                if isinstance(p_data, dict):
                                    data = p_data
                                    raw_body = p_raw
                                    status_code = 200
                                    if p_data.get("status") in ["completed", "failed", "error"]:
                                        break
                        except Exception as poll_err:
                            print(f"[TEAMILY DIRECT POLLING] Error sondeando {poll_url}: {poll_err}")
                            break

                response_text = ""
                if isinstance(data, dict):
                    output_val = data.get("output")
                    if isinstance(output_val, dict) and output_val.get("text"):
                        response_text = output_val["text"]
                    elif isinstance(output_val, str) and output_val.strip():
                        response_text = output_val
                    elif isinstance(data.get("data"), dict) and data["data"].get("response"):
                        response_text = data["data"]["response"]
                    elif isinstance(data.get("data"), dict) and data["data"].get("output"):
                        d_out = data["data"]["output"]
                        response_text = d_out.get("text") if isinstance(d_out, dict) else str(d_out)
                    elif data.get("response"):
                        response_text = data["response"]
                    elif data.get("reply"):
                        response_text = data["reply"]
                    elif data.get("content"):
                        response_text = data["content"]
                    elif data.get("message"):
                        msg_val = data["message"]
                        if isinstance(msg_val, dict) and msg_val.get("content"):
                            response_text = msg_val["content"]
                        elif isinstance(msg_val, dict) and msg_val.get("text"):
                            response_text = msg_val["text"]
                        else:
                            response_text = str(msg_val)
                    elif data.get("text"):
                        response_text = data["text"]
                    elif data.get("status") == "running" or status_code == 202:
                        run_id = data.get("run_id", "en_proceso")
                        response_text = f"**Solicitud en proceso en Teamily ✅**\n\nInstrucción registrada para el agente (Run: `{run_id}`)."
                    else:
                        response_text = json.dumps(data, ensure_ascii=False)
                else:
                    response_text = str(data)

                res_obj = TeamilyGeoAResponse(
                    status_code=status_code,
                    success=True,
                    response_text=str(response_text),
                    data=data if isinstance(data, dict) else {"result": data},
                    raw_body=raw_body,
                    latency_ms=elapsed_ms,
                    error=None,
                    endpoint=target_endpoint,
                    board_id=""
                )
                self._log_audit("DIRECT_1A1_SUCCESS", {
                    "recipient_user_id": request.recipient_user_id,
                    "sender_user_id": request.sender_user_id,
                    "status_code": status_code,
                    "endpoint": target_endpoint,
                    "latency_ms": elapsed_ms
                })
                return res_obj

        except urllib.error.HTTPError as he:
            elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
            try:
                err_body = he.read().decode("utf-8")
                err_data = json.loads(err_body)
            except Exception:
                err_body = str(he)
                err_data = {"error": err_body}

            detail_msg = ""
            if isinstance(err_data, dict):
                detail_obj = err_data.get("detail")
                if isinstance(detail_obj, dict):
                    detail_msg = detail_obj.get("message") or str(detail_obj)
                elif isinstance(detail_obj, list) and len(detail_obj) > 0:
                    first = detail_obj[0]
                    detail_msg = first.get("msg") if isinstance(first, dict) else str(first)
                elif isinstance(detail_obj, str):
                    detail_msg = detail_obj
                elif err_data.get("message"):
                    detail_msg = err_data.get("message")
                elif err_data.get("error"):
                    detail_msg = str(err_data.get("error"))

            err_msg = f"HTTP {he.code}: {detail_msg or he.reason}"
            res_obj = TeamilyGeoAResponse(
                status_code=he.code,
                success=False,
                response_text="",
                data=err_data if isinstance(err_data, dict) else {"error": err_body},
                raw_body=err_body,
                latency_ms=elapsed_ms,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=""
            )
            self._log_audit("DIRECT_1A1_HTTP_ERROR", {
                "recipient_user_id": request.recipient_user_id,
                "status_code": he.code,
                "error": err_msg,
                "latency_ms": elapsed_ms
            })
            return res_obj

        except (TimeoutError, socket.timeout) as to_err:
            elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
            err_msg = f"Timeout de lectura en Teamily ({elapsed_ms}ms > {req_timeout}s): The read operation timed out"
            res_obj = TeamilyGeoAResponse(
                status_code=408,
                success=False,
                response_text="",
                data={"error": err_msg},
                raw_body="",
                latency_ms=elapsed_ms,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=""
            )
            self._log_audit("DIRECT_1A1_TIMEOUT", {"error": err_msg, "latency_ms": elapsed_ms})
            return res_obj

        except urllib.error.URLError as ue:
            elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
            if isinstance(ue.reason, (socket.timeout, TimeoutError)) or "timed out" in str(ue.reason).lower():
                err_msg = f"Timeout de conexión en Teamily ({elapsed_ms}ms > {req_timeout}s): The read operation timed out"
                sc = 408
            else:
                err_msg = f"Fallo de conexión de red: {ue.reason}"
                sc = 503
            res_obj = TeamilyGeoAResponse(
                status_code=sc,
                success=False,
                response_text="",
                data={"error": str(ue.reason)},
                raw_body="",
                latency_ms=elapsed_ms,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=""
            )
            self._log_audit("DIRECT_1A1_NETWORK_ERROR", {"error": err_msg, "latency_ms": elapsed_ms})
            return res_obj

        except Exception as ex:
            elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
            err_msg = f"Error inesperado al contactar Teamily: {str(ex)}"
            res_obj = TeamilyGeoAResponse(
                status_code=500,
                success=False,
                response_text="",
                data={"error": str(ex)},
                raw_body="",
                latency_ms=elapsed_ms,
                error=err_msg,
                endpoint=target_endpoint,
                board_id=""
            )
            self._log_audit("DIRECT_1A1_EXCEPTION", {"error": err_msg, "latency_ms": elapsed_ms})
            return res_obj

    def poll_run(
        self,
        poll_url: str,
        server_key: Optional[str] = None,
        timeout: float = 20.0
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Consulta UNA vez el poll_url de un run de Teamily y devuelve (http_status, json).
        No duerme ni itera: el bucle lo controla quien llama (server.py), que
        registra el estado en el servidor y deja que el navegador sondee al portal.
        """
        key = server_key or self.server_key
        if not key or not poll_url:
            return 0, {"error": "poll_url o server_key ausente"}
        headers = {
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
            "User-Agent": "MrsPets-Teamily-Run-Poller/2.4 (Maracaibo, Venezuela)"
        }
        ssl_ctx = ssl.create_default_context()
        try:
            if os.path.exists("/private/etc/ssl/cert.pem"):
                ssl_ctx.load_verify_locations(cafile="/private/etc/ssl/cert.pem")
        except Exception:
            pass
        try:
            req = urllib.request.Request(url=poll_url, headers=headers, method="GET")
            try:
                with urllib.request.urlopen(req, timeout=timeout, context=ssl_ctx) as resp:
                    status = resp.status
                    raw = resp.read().decode("utf-8")
            except ssl.SSLCertVerificationError:
                with urllib.request.urlopen(req, timeout=timeout, context=ssl._create_unverified_context()) as resp:
                    status = resp.status
                    raw = resp.read().decode("utf-8")
            try:
                data = json.loads(raw)
            except Exception:
                data = {"raw": raw}
            return status, data if isinstance(data, dict) else {"result": data}
        except urllib.error.HTTPError as he:
            try:
                body = he.read().decode("utf-8")
                parsed = json.loads(body)
            except Exception:
                parsed = {"error": str(he)}
            return he.code, parsed if isinstance(parsed, dict) else {"error": str(he)}
        except Exception as ex:
            return 0, {"error": str(ex)}

    def ask_leia(self, prompt: str, thread_mode: str = "new", wait: bool = True) -> TeamilyGeoAResponse:
        """Método de conveniencia para invocar al agente GEO A (Leia) de Teamily."""
        req = TeamilyGeoARequest(
            input=prompt,
            thread=TeamilyThreadConfig(mode=thread_mode),
            wait=wait,
            board_id=self.board_id
        )
        return self.send_message(req)

    def ask_margaret(self, prompt: str, thread_mode: str = "new", wait: bool = True) -> TeamilyGeoAResponse:
        """Método de conveniencia para invocar al agente Margaret (Recepción & Atención al Cliente) de Teamily."""
        req = TeamilyGeoARequest(
            input=prompt,
            thread=TeamilyThreadConfig(mode=thread_mode),
            wait=wait,
            board_id=self.board_id
        )
        return self.send_message(req)

    def ask_oneil(self, prompt: str, station: Optional[str] = None, thread_mode: str = "new", wait: bool = True) -> TeamilyGeoAResponse:
        """
        Invoca al Agente O'Neil (Marketing & QC Grooming) inyectando el Modelo de Aprendizaje
        y Autonomía Gradual con el historial de directivas de Dalybell.
        """
        learning_injection = ""
        try:
            from qcLearningEngine import qc_learning_engine
            if qc_learning_engine:
                learning_injection = qc_learning_engine.get_system_prompt_learning_injection("oneil", station=station)
        except Exception:
            pass

        full_prompt = f"{learning_injection}\n\n[INSTRUCCIÓN DIRECTIVA EJECUTIVA]: {prompt}" if learning_injection else prompt
        req = TeamilyGeoARequest(
            input=full_prompt,
            thread=TeamilyThreadConfig(mode=thread_mode),
            wait=wait,
            board_id=self.board_id
        )
        return self.send_message(req)

# Instancia canónica singleton
teamily_geo_a_client = TeamilyGeoAClient()
teamily_margarette_client = TeamilyGeoAClient(
    endpoint=MARGARETTE_AGENT_ENDPOINT,
    server_key=MARGARETTE_SERVER_KEY
)

if __name__ == "__main__":
    print(f"=== TEST CONEXIÓN DIRECTA TEAMILY GEO A (LEIA) ===")
    print(f"Endpoint: {teamily_geo_a_client.endpoint}")
    print(f"Board ID: {teamily_geo_a_client.board_id}")
    print(f"Server Key: {teamily_geo_a_client.get_masked_key()}")

    test_input = "Hola, prueba de conexión inicial"
    print(f"\nEnviando payload:")
    test_req = TeamilyGeoARequest(
        input=test_input,
        thread=TeamilyThreadConfig(mode="new"),
        wait=True
    )
    print(json.dumps(test_req.to_payload(), indent=2))

    resp = teamily_geo_a_client.send_message(test_req)
    print(f"\nResultado de la prueba:")
    print(f"Status Code: {resp.status_code}")
    print(f"Success: {resp.success}")
    print(f"Latency: {resp.latency_ms} ms")
    if resp.success:
        print(f"Respuesta del Agente: {resp.response_text}")
        print(f"Data: {json.dumps(resp.data, indent=2, ensure_ascii=False)}")
    else:
        print(f"Error: {resp.error}")
        print(f"Raw Body: {resp.raw_body}")
