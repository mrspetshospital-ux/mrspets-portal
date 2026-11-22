#!/usr/bin/env python3
"""
Pruebas de Aceptación: Selector de Agente y Enrutamiento 1 a 1 en Comité Volturi
- Emisor Oficial: Mrs PETS CORP (userID: 1283666967744922)
- Destinatarios Oficiales: 8 Agentes con UserIDs canónicos
- Criterios de Aceptación 1 al 6:
  1. Seleccionar Mike -> 9000215760376233
  2. Seleccionar Valeria -> 9000487795593348 (aislado de Mike y Charly)
  3. Mapeo exacto de los 8 agentes en backend
  4A. Destinatario inválido (400)
  4B. Sesión expirada / credencial no configurada (401)
  4C. Servidor no disponible / error remoto (503 / 500)
  5. Cero IDs fijos ocultos ni reenvíos forzados a Charly
  6. Frontend - Selector visible de agente con nombre y rol, historial aislado
  7. Endpoint /v1/chat preservado sin mutación para 1 a 1
"""

import os
import sys
import unittest
import json
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from teamilyClient import (
    teamily_geo_a_client,
    TeamilyDirectMessageRequest,
    TeamilyGeoAClient,
    TeamilyGeoAResponse,
    normalize_teamily_endpoint
)


class TestVolturiSelector1a1(unittest.TestCase):

    def setUp(self):
        self.official_agents = {
            "margarette": "9000408632300095",
            "mike": "9000215760376233",
            "valeria": "9000487795593348",
            "nanami": "9000376919168475",
            "manolo": "9000441148643782",
            "pandora": "9000274735437072",
            "oneil": "9000339468227100",
            "sebastian": "9000074393459175"
        }
        self.portal_sender_id = "1283666967744922"

    def test_criterio_1_seleccionar_mike_envio_directo(self):
        """
        Criterio 1: Seleccionar Mike y enviar 'Prueba directa desde el portal'.
        El destinatario real debe ser 9000215760376233 y el emisor 1283666967744922.
        Sin intermediación de Charly ni respuestas simuladas.
        """
        client = TeamilyGeoAClient(server_key="test-bearer-key")

        captured_requests = []

        def mock_urlopen(req, *args, **kwargs):
            captured_requests.append(req)
            mock_resp = MagicMock()
            mock_resp.status = 200
            mock_resp.read.return_value = json.dumps({
                "status": "completed",
                "message": "Hola desde Mike: Sistemas operativos en orden.",
                "recipient_id": "9000215760376233"
            }).encode("utf-8")
            mock_resp.__enter__.return_value = mock_resp
            mock_resp.__exit__.return_value = None
            return mock_resp

        with patch("urllib.request.urlopen", side_effect=mock_urlopen):
            d_req = TeamilyDirectMessageRequest(
                sender_user_id=self.portal_sender_id,
                recipient_user_id="9000215760376233",
                message="Prueba directa desde el portal"
            )
            res = client.send_direct_message(d_req)

            self.assertTrue(res.success, f"Error devuelto: {res.error}")
            self.assertEqual(res.status_code, 200)
            self.assertIn("Sistemas operativos en orden", res.response_text)
            self.assertEqual(len(captured_requests), 1)

            http_req = captured_requests[0]
            self.assertEqual(http_req.full_url, "https://teamily.ai/v1/chat")
            self.assertEqual(http_req.headers.get("Authorization"), "Bearer test-bearer-key")

            body = json.loads(http_req.data.decode("utf-8"))
            self.assertEqual(body.get("sender_user_id"), self.portal_sender_id)
            self.assertEqual(body.get("recipient_user_id"), "9000215760376233")
            self.assertEqual(body.get("message"), "Prueba directa desde el portal")
            self.assertEqual(body.get("channel_type"), "direct_1a1")
            self.assertNotIn("Charly, canaliza", body.get("message"))

    def test_criterio_2_seleccionar_valeria_aislamiento_mike_y_charly(self):
        """
        Criterio 2: Seleccionar Valeria y comprobar que el mensaje no llega a Mike ni a Charly.
        El destinatario real debe ser 9000487795593348.
        """
        client = TeamilyGeoAClient(server_key="test-bearer-key")

        captured_requests = []

        def mock_urlopen(req, *args, **kwargs):
            captured_requests.append(req)
            mock_resp = MagicMock()
            mock_resp.status = 200
            mock_resp.read.return_value = json.dumps({
                "status": "completed",
                "reply": "Hola desde Valeria: Postulaciones revisadas."
            }).encode("utf-8")
            mock_resp.__enter__.return_value = mock_resp
            mock_resp.__exit__.return_value = None
            return mock_resp

        with patch("urllib.request.urlopen", side_effect=mock_urlopen):
            d_req = TeamilyDirectMessageRequest(
                sender_user_id=self.portal_sender_id,
                recipient_user_id="9000487795593348",
                message="Valeria, estado de selección de estilistas"
            )
            res = client.send_direct_message(d_req)

            self.assertTrue(res.success, f"Error devuelto: {res.error}")
            self.assertEqual(res.status_code, 200)

            sent_body = json.loads(captured_requests[0].data.decode("utf-8"))
            self.assertEqual(sent_body.get("recipient_user_id"), "9000487795593348")
            self.assertNotEqual(sent_body.get("recipient_user_id"), "9000215760376233")  # No es Mike
            self.assertEqual(sent_body.get("sender_user_id"), self.portal_sender_id)
            self.assertNotIn("geo-a", sent_body.get("recipient_user_id"))  # No es Charly

    def test_criterio_3_mapeo_exacto_8_agentes_oficiales_en_backend(self):
        """
        Verifica en server.py que los 8 agentes oficiales estén definidos con sus UserIDs canónicos.
        """
        server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")
        with open(server_path, "r", encoding="utf-8") as f:
            src = f.read()

        for slug, expected_uid in self.official_agents.items():
            self.assertIn(f'"{expected_uid}"', src, f"UserID {expected_uid} debe estar en server.py")
            self.assertIn(f'"{slug}": "{expected_uid}"', src, f"Slug {slug} debe mapear a {expected_uid}")

    def test_criterio_4a_destinatario_invalido_en_backend(self):
        """
        Criterio 4A: server.py valida recipient_user_id contra el catálogo oficial y rechaza con HTTP 400.
        """
        server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")
        with open(server_path, "r", encoding="utf-8") as f:
            src = f.read()

        # Debe verificar que si recipient_user_id no está en VOLTURI_OFFICIAL_AGENTS_MAP, retorne 400
        self.assertIn("recipient_user_id not in VOLTURI_OFFICIAL_AGENTS_MAP", src)
        self.assertIn("status_code=400", src)
        self.assertIn("Destinatario inválido", src)
        self.assertIn("No es un agente registrado del Comité Volturi", src)

    def test_criterio_4b_credencial_no_configurada_retorna_http_401(self):
        """
        Criterio 4B: Sin credencial configurada retorna HTTP 401 real con código y detalle.
        """
        client = TeamilyGeoAClient(server_key="")  # Credencial vacía
        d_req = TeamilyDirectMessageRequest(
            sender_user_id=self.portal_sender_id,
            recipient_user_id="9000215760376233",
            message="Prueba auth"
        )
        res = client.send_direct_message(d_req)
        self.assertFalse(res.success)
        self.assertEqual(res.status_code, 401)
        self.assertIn("Credencial no configurada", res.error)

    def test_criterio_4c_servidor_remoto_error_retorna_codigo_y_mensaje_real(self):
        """
        Criterio 4C: Si Teamily devuelve HTTP 503 o 500, el cliente captura el status real sin inventar respuestas.
        """
        import urllib.error
        client = TeamilyGeoAClient(server_key="valid-key")

        err = urllib.error.HTTPError(
            url="https://teamily.ai/v1/chat",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=None
        )

        with patch("urllib.request.urlopen", side_effect=err):
            d_req = TeamilyDirectMessageRequest(
                sender_user_id=self.portal_sender_id,
                recipient_user_id="9000215760376233",
                message="Prueba 503"
            )
            res = client.send_direct_message(d_req)
            self.assertFalse(res.success)
            self.assertEqual(res.status_code, 503)
            self.assertIn("503", res.error)

    def test_criterio_5_auditoria_cero_ids_fijos_ocultos(self):
        """
        Criterio 5: Verificar que no queden IDs fijos ocultos ni reenvíos forzados a Charly en el backend ni frontend.
        """
        server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")
        with open(server_path, "r", encoding="utf-8") as f:
            src = f.read()

        # El bloque de teamily_chat no debe reescribir con "Charly, canaliza y entrega este requerimiento a"
        self.assertNotIn("Charly, canaliza y entrega este requerimiento a", src)

        # En teamilyExecutiveEngine.js, el envío debe usar recipient_user_id dinámico
        js_path = os.path.join(os.path.dirname(__file__), "..", "static", "js", "teamilyExecutiveEngine.js")
        with open(js_path, "r", encoding="utf-8") as f:
            js_src = f.read()

        send_chat_block = js_src.split("async sendDirectChatMessage()", 1)[1].split("synthesizeAgentLiveReply", 1)[0]
        self.assertIn("recipient_user_id: recipientUserId", send_chat_block)
        self.assertIn("sender_user_id: '1283666967744922'", send_chat_block)
        self.assertIn("channel_type: 'direct_1a1'", send_chat_block)

    def test_criterio_6_frontend_selector_visible_e_historial_aislado(self):
        """
        Criterio 6: Frontend - Selector desplegable visible con nombre y rol,
        historial guardado y recuperado por agente en localStorage.
        """
        js_path = os.path.join(os.path.dirname(__file__), "..", "static", "js", "teamilyExecutiveEngine.js")
        with open(js_path, "r", encoding="utf-8") as f:
            js_src = f.read()

        # Selector visible en renderDirectChatContent
        self.assertIn('id="volturiChatAgentSelectorDropdown"', js_src)
        self.assertIn('onchange="window.teamilyExecutiveEngine.switchActiveAgent(this.value)"', js_src)

        # Indicador visual del emisor oficial y destinatario
        self.assertIn("Mrs PETS CORP (1283666967744922)", js_src)
        self.assertIn("CANAL 1 A 1 DIRECTO ACTIVO", js_src)

        # Aislamiento de historial por agente en localStorage
        self.assertIn("getAgentChatHistory(agent)", js_src)
        self.assertIn("const keyUserId = agent.teamlyUserId", js_src)
        self.assertIn("chatHistoryStorageKey", js_src)

    def test_criterio_7_normalizacion_de_endpoint_permite_chat_1a1(self):
        """
        Criterio 7: normalize_teamily_endpoint no debe desviar https://teamily.ai/v1/chat
        hacia /agents/geo-a/responses cuando allow_chat=True.
        """
        url_chat = "https://teamily.ai/v1/chat"
        normalized = normalize_teamily_endpoint(url_chat, allow_chat=True)
        self.assertEqual(normalized, "https://teamily.ai/v1/chat")

        # Sin allow_chat sigue protegiendo a Charly en otros contextos
        normalized_charly = normalize_teamily_endpoint(url_chat, allow_chat=False)
        self.assertEqual(normalized_charly, "https://teamily.ai/v1/agents/geo-a/responses")


if __name__ == "__main__":
    unittest.main()
