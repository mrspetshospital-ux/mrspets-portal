#!/usr/bin/env python3
"""
Mrs. Pets Maracaibo - Portal del Histórico de Consultas de Clientes
Big & Little Dogs, C.A. • RIF J-40120233-0 • Av. 2 El Milagro diagonal Lago Mall

Módulo de SOLO LECTURA para consultar el histórico de consultas de clientes
directamente desde Google Sheets.

ESPECIFICACIONES ESTRICTAS:
- Spreadsheet ID único y exclusivo: 1xk2qKLeXxodPZqid2xilGXv9zAJdyM1SfQ8mY6lB4LE
- Pestaña literal obligatoria (con tilde): "Histórico" (Historico sin tilde NO es válido; cero fallbacks a otras pestañas).
- Libro del Comité Volturi (1u9e2V5KSlgi7QhaCTgkmb30phz4vaoW67E3S_RPhDmA) queda estrictamente FUERA DE ALCANCE.
- Mapeo dinámico por nombre de encabezado (fila 1), incluyendo soporte nativo para la columna 'hilo'.
- Cero operaciones de escritura, edición o borrado.
- Cero datos simulados o mocks inventados.
"""

import os
import re
import csv
import io
import json
import ssl
import logging
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any, List, Optional, Tuple

log = logging.getLogger("mrspets.historico_sheets")

TARGET_SPREADSHEET_ID = "1xk2qKLeXxodPZqid2xilGXv9zAJdyM1SfQ8mY6lB4LE"
TARGET_TAB_NAME = "Histórico"
FORBIDDEN_VOLTURI_SPREADSHEET_ID = "1u9e2V5KSlgi7QhaCTgkmb30phz4vaoW67E3S_RPhDmA"

EXPECTED_COLUMNS = [
    "fecha",
    "solicitante",
    "agente",
    "consulta",
    "respuesta",
    "estado",
    "fecha_respuesta",
    "hilo"
]

class HistoricoConsultasService:
    def __init__(
        self,
        spreadsheet_id: str = TARGET_SPREADSHEET_ID,
        tab_name: str = TARGET_TAB_NAME
    ):
        # Aislamiento y validación de seguridad
        if spreadsheet_id == FORBIDDEN_VOLTURI_SPREADSHEET_ID:
            raise PermissionError(
                "ACCESO DENEGADO: El libro del Comité Volturi está estrictamente fuera del alcance de este módulo."
            )
        if spreadsheet_id != TARGET_SPREADSHEET_ID:
            raise ValueError(f"Spreadsheet ID no autorizado. Debe ser estrictamente {TARGET_SPREADSHEET_ID}")

        # Pestaña fija en "Histórico". Sin fallbacks a otras pestañas.
        if tab_name != TARGET_TAB_NAME:
            raise ValueError(
                f"Nombre de pestaña inválido: '{tab_name}'. La pestaña debe ser estrictamente 'Histórico' (con tilde). "
                f"No se procesará ninguna otra pestaña para garantizar aislamiento de datos."
            )

        self.spreadsheet_id = spreadsheet_id
        self.tab_name = tab_name

    def validate_spreadsheet_target(self, spreadsheet_id: str, tab_name: str):
        """Valida que los identificadores cumplan estrictamente con las directivas."""
        if spreadsheet_id == FORBIDDEN_VOLTURI_SPREADSHEET_ID:
            raise PermissionError(
                "ACCESO DENEGADO: El libro del Comité Volturi está estrictamente fuera del alcance de este módulo."
            )
        if spreadsheet_id != TARGET_SPREADSHEET_ID:
            raise ValueError(f"Libro no autorizado: {spreadsheet_id}. Debe ser estrictamente {TARGET_SPREADSHEET_ID}")
        if tab_name != TARGET_TAB_NAME:
            raise ValueError(
                f"Pestaña no autorizada: '{tab_name}'. La pestaña debe ser estrictamente 'Histórico' (con tilde). "
                f"No se procesará ninguna otra pestaña para garantizar aislamiento de datos."
            )

    def _normalize_date_string(self, d_str: Any) -> str:
        """
        Normaliza fecha a string 'YYYY-MM-DD HH:MM'.
        No reinterpreta ni modifica la zona horaria. Si está vacía o malformada, devuelve '—'.
        """
        if not d_str:
            return "—"
        s = str(d_str).strip()
        if not s or s.lower() in ("none", "null", "-", "n/a", "undefined"):
            return "—"
        m = re.match(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}", s)
        if m:
            return m.group(0)
        m_iso = re.match(r"^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})", s)
        if m_iso:
            return f"{m_iso.group(1)} {m_iso.group(2)}"
        return s

    def _normalize_status(self, raw_status: Any) -> Tuple[str, bool]:
        """
        Normaliza el estado.
        Valores válidos: 'pendiente', 'respondido'.
        Retorna (estado_normalizado, es_desconocido).
        """
        if not raw_status:
            return ("desconocido", True)
        st = str(raw_status).strip().lower()
        if st in ("pendiente", "respondido"):
            return (st, False)
        return (str(raw_status).strip(), True)

    def parse_rows(self, raw_matrix: List[List[Any]]) -> Dict[str, Any]:
        """
        Parsea la matriz de datos con MAPEO DINÁMICO por encabezado.
        Permite que las columnas vengan en cualquier orden y maneja la columna 'hilo'.
        """
        if not raw_matrix:
            return {
                "success": True,
                "consultas": [],
                "stats": {
                    "total": 0,
                    "pendientes": 0,
                    "respondidos": 0,
                    "otros_estados": 0,
                    "no_disponible_count": 0
                },
                "empty_state": True,
                "empty_message": "Aún no hay consultas registradas"
            }

        raw_headers = raw_matrix[0]
        headers_normalized = [str(c or "").strip().lower() for c in raw_headers]

        # Localizador dinámico por alias de columna
        def find_col_idx(aliases: List[str]) -> Optional[int]:
            for alias in aliases:
                a_clean = alias.strip().lower()
                if a_clean in headers_normalized:
                    return headers_normalized.index(a_clean)
            return None

        idx_fecha = find_col_idx(["fecha", "date", "timestamp"])
        idx_solicitante = find_col_idx(["solicitante", "cliente", "tutor", "usuario", "solicitado_por"])
        idx_agente = find_col_idx(["agente", "agent", "responsable"])
        idx_consulta = find_col_idx(["consulta", "pregunta", "mensaje", "query", "requerimiento"])
        idx_respuesta = find_col_idx(["respuesta", "reply", "resolucion", "atencion"])
        idx_estado = find_col_idx(["estado", "status", "estatus"])
        idx_fecha_resp = find_col_idx(["fecha_respuesta", "fecha respuesta", "fecha_resp", "fecha_resolucion"])
        idx_hilo = find_col_idx(["hilo", "thread", "hilo_id", "thread_id", "id_hilo", "sesion"])

        # Fallback posicional si los encabezados de fila 1 no tienen nombres conocidos
        if idx_fecha is None and len(headers_normalized) > 0: idx_fecha = 0
        if idx_solicitante is None and len(headers_normalized) > 1: idx_solicitante = 1
        if idx_agente is None and len(headers_normalized) > 2: idx_agente = 2
        if idx_consulta is None and len(headers_normalized) > 3: idx_consulta = 3
        if idx_respuesta is None and len(headers_normalized) > 4: idx_respuesta = 4
        if idx_estado is None and len(headers_normalized) > 5: idx_estado = 5
        if idx_fecha_resp is None and len(headers_normalized) > 6: idx_fecha_resp = 6
        if idx_hilo is None and len(headers_normalized) > 7: idx_hilo = 7

        def get_val(row_arr: List[Any], col_idx: Optional[int]) -> str:
            if col_idx is not None and 0 <= col_idx < len(row_arr):
                v = row_arr[col_idx]
                return str(v or "").strip()
            return ""

        data_rows = raw_matrix[1:]
        consultas = []
        pendientes_count = 0
        respondidos_count = 0
        otros_count = 0
        no_disponible_count = 0

        for idx, row in enumerate(data_rows, start=2):
            fecha_raw = get_val(row, idx_fecha)
            solicitante = get_val(row, idx_solicitante)
            agente = get_val(row, idx_agente)
            consulta = get_val(row, idx_consulta)
            respuesta = get_val(row, idx_respuesta)
            estado_raw = get_val(row, idx_estado)
            fecha_resp_raw = get_val(row, idx_fecha_resp)
            hilo_raw = get_val(row, idx_hilo)

            # Omitir filas completamente vacías
            if not any([fecha_raw, solicitante, agente, consulta, respuesta, estado_raw, fecha_resp_raw, hilo_raw]):
                continue

            fecha_norm = self._normalize_date_string(fecha_raw)
            fecha_resp_norm = self._normalize_date_string(fecha_resp_raw)
            estado_norm, es_desconocido = self._normalize_status(estado_raw)

            # Si está pendiente, fecha_respuesta es '—'
            if estado_norm == "pendiente" and fecha_resp_norm == "—":
                fecha_resp_norm = "—"

            if estado_norm == "pendiente":
                pendientes_count += 1
            elif estado_norm == "respondido":
                respondidos_count += 1
            else:
                otros_count += 1

            is_no_disponible = "NO DISPONIBLE" in respuesta.upper()
            if is_no_disponible:
                no_disponible_count += 1

            item = {
                "fila_sheet": idx,
                "hilo": hilo_raw or "—",
                "fecha": fecha_norm,
                "solicitante": solicitante or "—",
                "agente": agente or "—",
                "consulta": consulta or "—",
                "respuesta": respuesta or "—",
                "estado": estado_norm,
                "estado_desconocido": es_desconocido,
                "fecha_respuesta": fecha_resp_norm,
                "is_no_disponible": is_no_disponible
            }
            consultas.append(item)

        # Ordenar por fecha descendente por defecto (más recientes primero)
        def sort_key(item):
            f = item.get("fecha", "")
            return ("" if f == "—" else f)

        consultas.sort(key=sort_key, reverse=True)

        return {
            "success": True,
            "consultas": consultas,
            "columns_mapped": {
                "fecha_idx": idx_fecha,
                "solicitante_idx": idx_solicitante,
                "agente_idx": idx_agente,
                "consulta_idx": idx_consulta,
                "respuesta_idx": idx_respuesta,
                "estado_idx": idx_estado,
                "fecha_respuesta_idx": idx_fecha_resp,
                "hilo_idx": idx_hilo
            },
            "stats": {
                "total": len(consultas),
                "pendientes": pendientes_count,
                "respondidos": respondidos_count,
                "otros_estados": otros_count,
                "no_disponible_count": no_disponible_count
            },
            "empty_state": len(consultas) == 0,
            "empty_message": "Aún no hay consultas registradas" if len(consultas) == 0 else ""
        }

    def fetch_from_google_sheets(self) -> Dict[str, Any]:
        """
        Lee de forma directa y de SOLO LECTURA la pestaña 'Histórico'.
        Si la pestaña no existe o el libro es privado, reporta error explícito sin recurrir a fallbacks
        ni leer jamás otras hojas (como Ciclos o Reglas).
        """
        self.validate_spreadsheet_target(self.spreadsheet_id, self.tab_name)

        # 1. Credenciales de Service Account en entorno o archivo
        sa_creds_json = os.environ.get("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON")
        sa_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or os.environ.get("GOOGLE_SHEETS_SERVICE_ACCOUNT_FILE")
        if not sa_creds_json and sa_file and os.path.exists(sa_file):
            try:
                with open(sa_file, "r", encoding="utf-8") as f:
                    sa_creds_json = f.read()
            except Exception as e:
                log.warning("No se pudo leer archivo de credenciales %s: %s", sa_file, e)

        if sa_creds_json:
            result_sa = self._fetch_with_service_account(sa_creds_json)
            if result_sa.get("success"):
                return result_sa
            if result_sa.get("error") == "PESTAÑA_NO_ENCONTRADA":
                return result_sa

        # 2. Intentar lectura mediante endpoint directo (gviz o export CSV)
        result_csv = self._fetch_via_sheet_export()
        if result_csv.get("success"):
            return result_csv
        if result_csv.get("error") == "PESTAÑA_NO_ENCONTRADA":
            return result_csv

        # 3. Si falló por falta de autorización (HTTP 401/403)
        err_msg = result_csv.get("error_detail", "Acceso denegado o libro privado.")
        http_code = result_csv.get("http_code", 403)

        return {
            "success": False,
            "error": "ACCESO_DENEGADO_GOOGLE_SHEETS",
            "http_code": http_code,
            "spreadsheet_id": self.spreadsheet_id,
            "tab_name": self.tab_name,
            "owner": "mrspetshospital@gmail.com",
            "message": "El Google Sheet es privado y requiere autorización de lectura.",
            "error_detail": err_msg,
            "instructions": {
                "opcion_a_recomendada": (
                    "Compartir el libro en Google Sheets: Clic en 'Compartir' -> 'Acceso general' -> "
                    "Cambiar de 'Restringido' a 'Cualquiera con el enlace' con rol de 'Lector'."
                ),
                "opcion_b_service_account": (
                    "O suministrar las credenciales de Service Account de Google Cloud en "
                    "GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON y compartir el libro con el correo de la cuenta de servicio."
                )
            },
            "consultas": [],
            "stats": {
                "total": 0,
                "pendientes": 0,
                "respondidos": 0,
                "otros_estados": 0,
                "no_disponible_count": 0
            }
        }

    def _fetch_via_sheet_export(self) -> Dict[str, Any]:
        """Lectura vía endpoints web de Google Sheets (gviz o export CSV) apuntando estrictamente a 'Histórico'."""
        encoded_tab = urllib.parse.quote(self.tab_name)
        urls = [
            f"https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}/gviz/tq?tqx=out:csv&sheet={encoded_tab}",
            f"https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}/export?format=csv&sheet={encoded_tab}"
        ]

        last_error = ""
        last_code = 403

        for url in urls:
            try:
                req = urllib.request.Request(
                    url,
                    headers={
                        "User-Agent": "MrsPets-Portal-Historico/1.0 (Av. El Milagro, Maracaibo)",
                        "Accept": "text/csv, application/json, text/plain, */*"
                    }
                )
                with urllib.request.urlopen(req, context=ssl._create_unverified_context(), timeout=10) as resp:
                    if resp.status == 200:
                        content_bytes = resp.read()
                        text_content = content_bytes.decode("utf-8", errors="replace")

                        # Si Google devuelve página HTML de login
                        if "<html" in text_content.lower() and "google" in text_content.lower():
                            return {
                                "success": False,
                                "http_code": 401,
                                "error_detail": "El libro requiere inicio de sesión en Google (Privado)."
                            }

                        # Si la respuesta de gviz indica que la hoja no fue encontrada
                        if "invalid_sheet_name" in text_content.lower() or "sheet not found" in text_content.lower():
                            return {
                                "success": False,
                                "error": "PESTAÑA_NO_ENCONTRADA",
                                "http_code": 404,
                                "tab_name": self.tab_name,
                                "error_detail": f"La pestaña '{self.tab_name}' no existe en el libro. No se procesó ninguna otra pestaña para garantizar aislamiento de datos."
                            }

                        csv_reader = csv.reader(io.StringIO(text_content))
                        raw_matrix = [row for row in csv_reader]

                        parsed = self.parse_rows(raw_matrix)
                        parsed["source"] = "google_sheets_gviz_export"
                        parsed["spreadsheet_id"] = self.spreadsheet_id
                        parsed["tab_name"] = self.tab_name
                        return parsed
            except urllib.error.HTTPError as he:
                last_code = he.code
                last_error = f"HTTP {he.code}: {he.reason}"
                if he.code == 404:
                    return {
                        "success": False,
                        "error": "PESTAÑA_NO_ENCONTRADA",
                        "http_code": 404,
                        "tab_name": self.tab_name,
                        "error_detail": f"Pestaña '{self.tab_name}' no localizada en el libro."
                    }
            except Exception as e:
                last_error = str(e)

        return {
            "success": False,
            "http_code": last_code,
            "error_detail": last_error
        }

    def _fetch_with_service_account(self, creds_json_str: str) -> Dict[str, Any]:
        """Lectura con Google Sheets API v4 usando Service Account Bearer Token."""
        try:
            creds = json.loads(creds_json_str)
            client_email = creds.get("client_email")
            private_key = creds.get("private_key")
            token_uri = creds.get("token_uri", "https://oauth2.googleapis.com/token")

            if not client_email or not private_key:
                return {"success": False, "error_detail": "Credenciales de Service Account incompletas."}

            import time
            try:
                import jwt
                now = int(time.time())
                payload = {
                    "iss": client_email,
                    "sub": client_email,
                    "aud": token_uri,
                    "iat": now,
                    "exp": now + 3600,
                    "scope": "https://www.googleapis.com/auth/spreadsheets.readonly"
                }
                signed_jwt = jwt.encode(payload, private_key, algorithm="RS256")

                token_data = urllib.parse.urlencode({
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": signed_jwt
                }).encode("utf-8")

                req = urllib.request.Request(token_uri, data=token_data, method="POST")
                with urllib.request.urlopen(req, context=ssl._create_unverified_context(), timeout=10) as t_resp:
                    t_json = json.loads(t_resp.read().decode("utf-8"))
                    access_token = t_json.get("access_token")

                if access_token:
                    # Rango estricto en pestaña Histórico
                    encoded_range = urllib.parse.quote(f"{self.tab_name}!A1:Z")
                    api_url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.spreadsheet_id}/values/{encoded_range}"
                    api_req = urllib.request.Request(
                        api_url,
                        headers={"Authorization": f"Bearer {access_token}"}
                    )
                    try:
                        with urllib.request.urlopen(api_req, context=ssl._create_unverified_context(), timeout=10) as s_resp:
                            sheet_data = json.loads(s_resp.read().decode("utf-8"))
                            values = sheet_data.get("values", [])
                            parsed = self.parse_rows(values)
                            parsed["source"] = "google_sheets_api_v4_service_account"
                            parsed["service_account_email"] = client_email
                            parsed["spreadsheet_id"] = self.spreadsheet_id
                            parsed["tab_name"] = self.tab_name
                            return parsed
                    except urllib.error.HTTPError as she:
                        if she.code == 404 or "not found" in str(she.reason).lower():
                            return {
                                "success": False,
                                "error": "PESTAÑA_NO_ENCONTRADA",
                                "http_code": 404,
                                "tab_name": self.tab_name,
                                "error_detail": f"La pestaña '{self.tab_name}' no existe en el libro según Google Sheets API."
                            }
                        raise she
            except ImportError:
                log.warning("Librería jwt no disponible para Service Account OAuth.")
            except Exception as e:
                log.warning("Fallo al autenticar Service Account: %s", e)
                return {"success": False, "error_detail": f"Service Account Auth Error: {e}"}

        except Exception as e:
            return {"success": False, "error_detail": f"Error parseando credenciales: {e}"}

        return {"success": False, "error_detail": "No se pudo autenticar Service Account."}


# Instancia singleton para uso general
historico_service = HistoricoConsultasService()
