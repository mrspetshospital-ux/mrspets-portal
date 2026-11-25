#!/usr/bin/env python3
"""
Pruebas del RUN DIFERIDO de Teamily (sondeo por el portal).

Motivo: el run real de Teamily tarda ~163 s y Cloudflare corta la petición
HTTP a los 100 s. Esperar dentro de la request deja al navegador con un 524
sin cuerpo, y por eso la burbuja del chat quedaba vacía.

Contrato que se verifica aquí:
1. El cliente NO se queda esperando cuando defer_poll=True: devuelve el 202
   con run_id + poll_url de inmediato.
2. El backend registra el run y responde 'running' + run_token (no un acuse
   disfrazado de respuesta).
3. El hilo de fondo sondea el poll_url y, al cerrar, guarda el texto.
4. GET /api/v1/teamily/run/{token} devuelve 'running' mientras vive y el
   texto real cuando cierra.
5. Un run que falla devuelve error honesto, nunca texto inventado.
6. Un token desconocido devuelve 404.
"""

import asyncio
import json
import os
import sys
import time
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from teamilyClient import (
    TeamilyGeoAClient,
    TeamilyDirectMessageRequest,
    extract_teamily_text,
    extract_teamily_msg_id,
)


class TestExtractores(unittest.TestCase):
    """El texto del agente debe salir de cualquiera de las formas que usa Teamily."""

    def test_01_texto_en_output_text(self):
        self.assertEqual(extract_teamily_text({"output": {"text": "Hola Mike"}}), "Hola Mike")

    def test_02_texto_en_reply(self):
        self.assertEqual(extract_teamily_text({"reply": "Respuesta directa"}), "Respuesta directa")

    def test_03_texto_en_data_output(self):
        self.assertEqual(
            extract_teamily_text({"data": {"output": {"text": "Anidado"}}}), "Anidado"
        )

    def test_04_texto_en_messages(self):
        data = {"messages": [
            {"role": "user", "content": "pregunta"},
            {"role": "assistant", "content": "respuesta del agente"},
        ]}
        self.assertEqual(extract_teamily_text(data), "respuesta del agente")

    def test_05_sin_texto_devuelve_vacio(self):
        self.assertEqual(extract_teamily_text({"status": "running"}), "")
        self.assertEqual(extract_teamily_text(None), "")

    def test_06_acuse_serverMsgID(self):
        self.assertEqual(extract_teamily_msg_id({"serverMsgID": "abc123"}), "abc123")
        self.assertEqual(extract_teamily_msg_id({"data": {"msg_id": "xyz"}}), "xyz")


class TestDeferPoll(unittest.TestCase):
    """defer_poll=True no debe dormir esperando el run."""

    def test_07_defer_poll_devuelve_202_sin_esperar(self):
        client = TeamilyGeoAClient(server_key="test-key")
        llamadas = []

        def mock_urlopen(req, *args, **kwargs):
            llamadas.append(req.full_url)
            resp = MagicMock()
            resp.status = 202
            resp.read.return_value = json.dumps({
                "status": "running",
                "run_id": "run-abc",
                "poll_url": "https://teamily.ai/v1/runs/run-abc",
            }).encode("utf-8")
            resp.__enter__.return_value = resp
            resp.__exit__.return_value = None
            return resp

        with patch("urllib.request.urlopen", side_effect=mock_urlopen):
            t0 = time.time()
            res = client.send_direct_message(
                TeamilyDirectMessageRequest(
                    recipient_user_id="9000215760376233",
                    message="prueba",
                ),
                defer_poll=True,
            )
            transcurrido = time.time() - t0

        self.assertTrue(res.success)
        self.assertEqual(res.status_code, 202)
        self.assertEqual(res.data.get("run_id"), "run-abc")
        self.assertEqual(res.data.get("poll_url"), "https://teamily.ai/v1/runs/run-abc")
        # Sin defer_poll habría sondeado; con defer_poll solo hay 1 llamada.
        self.assertEqual(len(llamadas), 1, f"Debe haber 1 sola llamada, hubo {llamadas}")
        self.assertLess(transcurrido, 5.0, "defer_poll no debe dormir esperando el run")


class TestRegistroDeRuns(unittest.TestCase):
    """El registro en memoria y el endpoint de estado."""

    def setUp(self):
        import server
        self.server = server
        server._TEAMILY_RUNS.clear()

    def test_08_crear_y_leer_run(self):
        token = self.server._teamily_run_create(
            agent_slug="mike",
            agent_name="Mike Gerente de Operaciones",
            hilo="HILO-TEST-001",
            poll_url="https://teamily.ai/v1/runs/x",
            run_id="run-x",
            server_key="k",
            endpoint="https://teamily.ai/v1/chat",
        )
        self.assertTrue(token.startswith("run_"))
        run = self.server._teamily_run_get(token)
        self.assertEqual(run["status"], "running")
        self.assertEqual(run["agent"], "mike")
        self.assertEqual(run["hilo"], "HILO-TEST-001")

    def test_09_endpoint_running(self):
        token = self.server._teamily_run_create(
            agent_slug="mike", agent_name="Mike", hilo="H1",
            poll_url="https://x", run_id="r1", server_key="k", endpoint="e",
        )
        resp = asyncio.run(self.server.teamily_run_status(token))
        self.assertEqual(resp.status_code, 200)
        body = json.loads(resp.body)
        self.assertEqual(body["status"], "running")
        self.assertEqual(body["run_token"], token)

    def test_10_endpoint_completed_devuelve_texto(self):
        token = self.server._teamily_run_create(
            agent_slug="mike", agent_name="Mike", hilo="H1",
            poll_url="https://x", run_id="r1", server_key="k", endpoint="e",
        )
        self.server._teamily_run_set(
            token, status="completed", text="Respuesta real de Mike",
            closed_at=time.time(),
        )
        resp = asyncio.run(self.server.teamily_run_status(token))
        body = json.loads(resp.body)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(body["status"], "success")
        self.assertEqual(body["reply"], "Respuesta real de Mike")
        self.assertEqual(body["response_text"], "Respuesta real de Mike")
        self.assertEqual(body["output"]["text"], "Respuesta real de Mike")

    def test_11_endpoint_failed_es_honesto(self):
        token = self.server._teamily_run_create(
            agent_slug="mike", agent_name="Mike", hilo="H1",
            poll_url="https://x", run_id="r1", server_key="k", endpoint="e",
        )
        self.server._teamily_run_set(
            token, status="failed", error="El run terminó en estado 'failed'",
            closed_at=time.time(),
        )
        resp = asyncio.run(self.server.teamily_run_status(token))
        body = json.loads(resp.body)
        self.assertEqual(resp.status_code, 504)
        self.assertEqual(body["status"], "error")
        self.assertIn("failed", body["error"])
        self.assertEqual(body["reply"], "", "No debe inventar texto")

    def test_12_token_desconocido_404(self):
        resp = asyncio.run(self.server.teamily_run_status("run_inexistente"))
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(json.loads(resp.body)["status"], "not_found")

    def test_13_no_expone_poll_url_ni_clave(self):
        token = self.server._teamily_run_create(
            agent_slug="mike", agent_name="Mike", hilo="H1",
            poll_url="https://teamily.ai/v1/runs/secreto", run_id="r1",
            server_key="tmly_sk_SECRETA", endpoint="e",
        )
        self.server._teamily_run_set(token, status="completed", text="ok", closed_at=time.time())
        resp = asyncio.run(self.server.teamily_run_status(token))
        cuerpo = resp.body.decode("utf-8")
        self.assertNotIn("tmly_sk_SECRETA", cuerpo)
        self.assertNotIn("poll_url", cuerpo)


class TestSondeoEnSegundoPlano(unittest.TestCase):
    """El hilo de fondo debe cerrar el run con el texto del agente."""

    def setUp(self):
        import server
        self.server = server
        server._TEAMILY_RUNS.clear()
        server._TEAMILY_RUN_INTERVAL_SEC = 0.01

    def tearDown(self):
        self.server._TEAMILY_RUN_INTERVAL_SEC = 3.0

    def test_14_sondeo_cierra_con_texto(self):
        token = self.server._teamily_run_create(
            agent_slug="mike", agent_name="Mike", hilo="H1",
            poll_url="https://teamily.ai/v1/runs/r1", run_id="r1",
            server_key="k", endpoint="e",
        )

        respuestas = [
            (200, {"status": "running"}),
            (200, {"status": "running"}),
            (200, {"status": "completed", "output": {"text": "Mike dice: todo operativo"}}),
        ]
        with patch.object(
            self.server.teamily_geo_a_client, "poll_run",
            side_effect=lambda *a, **k: respuestas.pop(0),
        ):
            self.server._teamily_run_poll_loop(token)

        run = self.server._teamily_run_get(token)
        self.assertEqual(run["status"], "completed")
        self.assertEqual(run["text"], "Mike dice: todo operativo")
        self.assertEqual(run["polls"], 3)

    def test_15_sondeo_fallido_no_inventa_texto(self):
        token = self.server._teamily_run_create(
            agent_slug="mike", agent_name="Mike", hilo="H1",
            poll_url="https://teamily.ai/v1/runs/r1", run_id="r1",
            server_key="k", endpoint="e",
        )
        with patch.object(
            self.server.teamily_geo_a_client, "poll_run",
            return_value=(200, {"status": "failed", "error": "agente caído"}),
        ):
            self.server._teamily_run_poll_loop(token)

        run = self.server._teamily_run_get(token)
        self.assertEqual(run["status"], "failed")
        self.assertEqual(run["text"], "")
        self.assertIn("agente caído", run["error"])

    def test_16_cierre_sin_texto_es_empty(self):
        token = self.server._teamily_run_create(
            agent_slug="mike", agent_name="Mike", hilo="H1",
            poll_url="https://teamily.ai/v1/runs/r1", run_id="r1",
            server_key="k", endpoint="e",
        )
        with patch.object(
            self.server.teamily_geo_a_client, "poll_run",
            return_value=(200, {"status": "completed"}),
        ):
            self.server._teamily_run_poll_loop(token)

        run = self.server._teamily_run_get(token)
        self.assertEqual(run["status"], "empty")
        self.assertEqual(run["text"], "")


if __name__ == "__main__":
    unittest.main(verbosity=2)
