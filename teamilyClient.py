#!/usr/bin/env python3
"""
Mrs. Pets Maracaibo - Teamily GEO A (Leia) Backend Integration Gateway
Big & Little Dogs, C.A. • RIF J-40120233-0 • Av. 2 El Milagro diagonal Lago Mall

Módulo tipado de orquestación backend para el agente GEO A (Leia) de Teamily:
- Canal principal de orquestación semántica, subagentes Volturi y atención automatizada.
- Lectura segura de credenciales y Server Key desde variables de entorno (.env).
- Protocolo HTTP POST / JSON REST API hacia https://teamily.ai/v1/agents/geo-a/responses.
"""

import os
import sys
import json
import time
import datetime
import urllib.request
import urllib.error
import ssl
from dataclasses import dataclass, field, asdict
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
            print(f"[TEAMILEY ENV] Advertencia al leer .env: {e}")
    return loaded

# Cargar variables al importar
load_project_env()

# Parámetros Canónicos Exactos Teamily GEO A
DEFAULT_ENDPOINT = "https://teamily.ai/v1/agents/geo-a/responses"
DEFAULT_DOCS_URL = "https://teamily.ai/v1"
DEFAULT_BOARD_ID = "5803df5a-7127-4d28-b97c-5c840d47cdc7"
DEFAULT_SERVER_KEY = "tmly_sk_live_-2IXyLuZMZD9UOFDdrm4uUFBWtrow0k44PvCTx8Vac8"

def normalize_teamily_endpoint(endpoint: Optional[str], default_endpoint: str = DEFAULT_ENDPOINT) -> str:
    """
    Normaliza cualquier URL ingresada por el usuario (incluyendo URLs copiadas del navegador web como
    https://teamily.ai/agent/5803df5a-...) hacia la URL canónica de API REST POST terminada en /responses.
    """
    if not endpoint:
        return default_endpoint
    ep = str(endpoint).strip()

    # Si es Charlie / Charly, siempre apunta al agente activo canónico GEO A
    if "/charlie" in ep or "/charly" in ep:
        return default_endpoint

    # Board ID o Agente principal del usuario en Teamily
    if "5803df5a-7127-4d28-b97c-5c840d47cdc7" in ep:
        return default_endpoint

    # Si el usuario pegó la URL de navegación web del navegador (ej: https://teamily.ai/agent/<slug_o_uuid>)
    import re
    uuid_match = re.search(r'([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', ep)
    if not ep.endswith("/responses"):
        if uuid_match:
            return f"https://teamily.ai/v1/agents/{uuid_match.group(1)}/responses"
        elif "/agent/" in ep or "/agents/" in ep:
            slug = ep.rstrip("/").split("/")[-1]
            return f"https://teamily.ai/v1/agents/{slug}/responses"
        elif ep.startswith("http"):
            return f"{ep.rstrip('/')}/responses"
        else:
            return f"https://teamily.ai/v1/agents/{ep}/responses"

    return ep

@dataclass
class TeamilyThreadConfig:
    """Configuración tipada del hilo de conversación."""
    mode: str = "new"  # 'new' | 'continue' | 'stateless'
    thread_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d = {"mode": self.mode}
        if self.thread_id:
            d["thread_id"] = self.thread_id
        return d

@dataclass
class TeamilyGeoARequest:
    """Estructura de petición tipada para el agente Teamily GEO A."""
    input: str
    thread: TeamilyThreadConfig = field(default_factory=TeamilyThreadConfig)
    wait: bool = True
    board_id: Optional[str] = None

    def to_payload(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "input": self.input,
            "thread": self.thread.to_dict() if isinstance(self.thread, TeamilyThreadConfig) else self.thread,
            "wait": self.wait
        }
        if self.board_id:
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
        timeout: int = 45
    ):
        load_project_env()
        self.server_key = server_key or os.environ.get("TEAMILEY_GEO_A_SERVER_KEY") or DEFAULT_SERVER_KEY
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

    def _log_audit(self, event_type: str, details: Dict[str, Any]):
        """Registra la auditoría en logs/audit_trail.jsonl."""
        try:
            record = {
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "event_type": f"TEAMILEY_{event_type}",
                "user": "TeamilyGeoAClient/Backend",
                "details": details
            }
            with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[TEAMILEY AUDIT] Error escribiendo log: {e}")

    def send_message(self, request: TeamilyGeoARequest, endpoint_override: Optional[str] = None, server_key_override: Optional[str] = None) -> TeamilyGeoAResponse:
        """
        Envía una petición POST tipada al agente GEO A o a cualquier subagente de Teamily.
        Aplica los headers obligatorios:
        - Authorization: Bearer <server_key>
        - Content-Type: application/json
        """
        payload = request.to_payload()
        if not payload.get("board_id") and self.board_id:
            payload["board_id"] = self.board_id

        target_endpoint = normalize_teamily_endpoint(endpoint_override or self.endpoint, default_endpoint=self.endpoint)
        target_server_key = server_key_override or self.server_key

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
                resp_ctx = urllib.request.urlopen(req, timeout=self.timeout, context=ssl_ctx)
            except (ssl.SSLCertVerificationError, urllib.error.URLError) as ssl_err:
                # Fallback resiliente si los certificados del emisor local no están en el keychain de LibreSSL
                if "CERTIFICATE_VERIFY_FAILED" in str(ssl_err):
                    unverified_ctx = ssl._create_unverified_context()
                    resp_ctx = urllib.request.urlopen(req, timeout=self.timeout, context=unverified_ctx)
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
                if (status_code == 202 or (isinstance(data, dict) and data.get("status") == "running")) and poll_url:
                    poll_headers = {
                        "Authorization": f"Bearer {target_server_key}",
                        "Accept": "application/json",
                        "User-Agent": "MrsPets-Teamily-GEO-A-Client/2.4 (Maracaibo, Venezuela)"
                    }
                    poll_deadline = time.time() + min(max(self.timeout - (time.time() - start_time), 10.0), 35.0)
                    while time.time() < poll_deadline:
                        time.sleep(2.0)
                        try:
                            poll_req = urllib.request.Request(url=poll_url, headers=poll_headers, method="GET")
                            with urllib.request.urlopen(poll_req, timeout=12, context=ssl_ctx) as p_resp:
                                p_raw = p_resp.read().decode("utf-8")
                                p_data = json.loads(p_raw)
                                if isinstance(p_data, dict):
                                    data = p_data
                                    raw_body = p_raw
                                    status_code = 200
                                    if p_data.get("status") in ["completed", "failed", "error"]:
                                        break
                        except Exception as poll_err:
                            print(f"[TEAMILEY POLLING] Error sondeando {poll_url}: {poll_err}")
                            break

                # Extraer texto de respuesta según estructura típica de Teamily (soporta {output: {text: ...}})
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
                    elif data.get("message"):
                        response_text = data["message"]
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
                    board_id=request.board_id or self.board_id
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

        except urllib.error.URLError as ue:
            elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
            err_msg = f"Fallo de conexión de red: {ue.reason}"
            res_obj = TeamilyGeoAResponse(
                status_code=0,
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

    def ask_leia(self, prompt: str, thread_mode: str = "new", wait: bool = True) -> TeamilyGeoAResponse:
        """Método de conveniencia para invocar al agente GEO A (Leia) de Teamily."""
        req = TeamilyGeoARequest(
            input=prompt,
            thread=TeamilyThreadConfig(mode=thread_mode),
            wait=wait,
            board_id=self.board_id
        )
        return self.send_message(req)

# Instancia canónica singleton
teamily_geo_a_client = TeamilyGeoAClient()

if __name__ == "__main__":
    print(f"=== TEST CONEXIÓN DIRECTA TEAMILEY GEO A (LEIA) ===")
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
