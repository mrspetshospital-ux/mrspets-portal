#!/usr/bin/env python3
"""
Pruebas de verificación de canal exclusivo Teamily para el Comité Volturi:
- Desactivación de respuestas automáticas y canned templates en la página.
- El Comité Volturi NO recibe respuestas generadas por Gemini.
- Toda comunicación con el Comité Volturi (Charly / GEO A, Manolo, etc.) se enruta exclusivamente a Teamily.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")


class TestVolturiCanalExclusivoTeamily(unittest.TestCase):

    def test_01_server_py_volturi_routes_exclusively_to_teamily_no_gemini(self):
        """Verifica en server.py que el bloque del Comité Volturi en teamily_chat use Teamily y jamás Gemini ni Centralita."""
        server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")
        with open(server_path, "r", encoding="utf-8") as f:
            src = f.read()

        # Localizar el bloque del Comité Volturi en teamily_chat
        volturi_marker = "MIEMBROS DEL COMITÉ VOLTURI Y AGENTES DEL ECOSISTEMA"
        self.assertIn(volturi_marker, src)

        block = src.split(volturi_marker, 1)[1].split("def sheets_interaction", 1)[0]

        # No debe llamar a Gemini
        self.assertNotIn("_call_gemini_for_leia_engine", block, "El Comité Volturi NUNCA debe invocar Gemini.")
        # No debe llamar a synthesize_agent_response
        self.assertNotIn("synthesize_agent_response", block, "El Comité Volturi NUNCA debe usar respuestas sintéticas de centralita.")
        # Debe despachar a Teamily
        self.assertIn("teamily_geo_a_client.send_message", block, "El Comité Volturi debe despacharse directamente a Teamily.")
        self.assertIn('"model_used": model_used', block)
        self.assertIn('model_used = "teamily-geo-a"', block)

        # Jamás debe pasar por Make.com
        self.assertNotIn("make.com", block.lower(), "La comunicación con el Comité Volturi NUNCA debe pasar por Make.")
        self.assertNotIn("make_webhook", block.lower(), "No debe existir webhook de Make en la comunicación con el Comité Volturi.")

    def test_02_server_py_orchestrate_no_gemini_for_volturi(self):
        """Verifica que teamily_orchestrate no invoque a Gemini para generar dictámenes ejecutivos del Volturi."""
        server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")
        with open(server_path, "r", encoding="utf-8") as f:
            src = f.read()

        orchestrate_block = src.split("async def teamily_orchestrate", 1)[1].split("def agent_health_check", 1)[0]
        self.assertNotIn("_call_gemini_for_leia_engine", orchestrate_block, "La orquestación del Comité Volturi no debe usar Gemini.")

    def test_03_frontend_js_canned_replies_deactivated(self):
        """Verifica que en teamilyExecutiveEngine.js las respuestas automáticas/canned templates estén desactivadas."""
        js_path = os.path.join(os.path.dirname(__file__), "..", "static", "js", "teamilyExecutiveEngine.js")
        with open(js_path, "r", encoding="utf-8") as f:
            src = f.read()

        # No debe contener el canned template de Charlie Finance
        self.assertNotIn("Charlie Finance:\n\nTasa Oficial del Banco Central de Venezuela", src)
        # La función debe declarar estar desactivada
        self.assertIn("Respuestas automáticas y sintéticas de la página DESACTIVADAS por directriz del Comité Volturi", src)
        # sendDirectChatMessage no debe llamar a synthesizeAgentLiveReply
        send_chat_block = src.split("async sendDirectChatMessage()", 1)[1].split("openAgentConfigModal", 1)[0]
        self.assertNotIn("this.synthesizeAgentLiveReply", send_chat_block, "sendDirectChatMessage no debe invocar synthesizeAgentLiveReply.")

    def test_04_functional_execution_if_fastapi_available(self):
        """Ejecuta la llamada funcional si FastAPI está instalado en el entorno."""
        try:
            import asyncio
            from unittest.mock import patch
            import server
            from server import teamily_chat
            from teamilyClient import TeamilyGeoAResponse

            class FakeRequest:
                def __init__(self, data=None):
                    self._data = data or {}
                    self.query_params = {}

                async def json(self):
                    return self._data

            with patch("server._call_gemini_for_leia_engine") as mock_gemini, \
                 patch.object(server.teamily_geo_a_client, "send_message") as mock_send:
                mock_send.return_value = TeamilyGeoAResponse(
                    status_code=200,
                    success=True,
                    response_text="[Charly en vivo]: Respuesta real del canal Teamily.",
                    data={"status": "completed"},
                    raw_body="",
                    latency_ms=100.0,
                    error="",
                    endpoint="https://teamily.ai/v1/agents/geo-a/responses",
                    board_id="5803df5a-7127-4d28-b97c-5c840d47cdc7"
                )
                req = FakeRequest({"agent_id": "charlie", "message": "Hola Charly"})
                data = asyncio.run(teamily_chat(req))
                self.assertEqual(data.get("status"), "success")
                self.assertEqual(data.get("model_used"), "teamily-geo-a")
                mock_gemini.assert_not_called()
                mock_send.assert_called_once()
        except ImportError:
            pass


    def test_05_volturi_communication_never_uses_make(self):
        """Verifica que el gateway de comunicación con el Comité Volturi apunte exclusivamente a Teamily.ai y no a Make."""
        from teamilyClient import teamily_geo_a_client, DEFAULT_ENDPOINT
        self.assertIn("teamily.ai", teamily_geo_a_client.endpoint)
        self.assertNotIn("make.com", teamily_geo_a_client.endpoint)

        # En teamilyExecutiveEngine.js, el endpoint directo de agentes es /api/v1/teamily/agent-chat
        js_path = os.path.join(os.path.dirname(__file__), "..", "static", "js", "teamilyExecutiveEngine.js")
        with open(js_path, "r", encoding="utf-8") as f:
            js_src = f.read()

        send_chat_block = js_src.split("async sendDirectChatMessage()", 1)[1].split("openAgentConfigModal", 1)[0]
        self.assertNotIn("make.com", send_chat_block.lower())
        self.assertNotIn("hook.us", send_chat_block.lower())

    def test_06_centralita_router_volturi_no_canned_templates(self):
        """Verifica que centralitaRouter no contenga respuestas sintéticas para los miembros del Comité Volturi."""
        from centralitaRouter import centralita_router
        for slug in ["charlie", "charly", "manolo", "valeria", "pandora", "mike", "oneil", "sebastian"]:
            resp = centralita_router.synthesize_agent_response(slug, slug, "Auditoría", {})
            self.assertIn("⚠️ Sin respuesta de Teamily", resp, f"El agente {slug} no debe recibir respuesta sintética prefabricada.")
            self.assertNotIn("Tasa Oficial BCV Única", resp)
            self.assertNotIn("Todas las transacciones en mostrador POS", resp)

    def test_07_teamily_orchestrate_no_synthesized_canned_responses(self):
        """Verifica que en server.py teamily_orchestrate no genere respuestas sintéticas."""
        server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")
        with open(server_path, "r", encoding="utf-8") as f:
            src = f.read()

        orchestrate_block = src.split("async def teamily_orchestrate", 1)[1].split("def agent_health_check", 1)[0]
        self.assertNotIn("centralita_router.synthesize_agent_response", orchestrate_block)


if __name__ == "__main__":
    unittest.main()
