#!/usr/bin/env python3
"""
Pruebas de la Bitácora Auditada de Turnos del Avatar (Bloque D de la Lista de Verificación)
Verifica que cada turno del avatar quede registrado con correlation_id, timestamps,
latencia, endpoints y estados, sin exposición de secretos.
"""

import os
import sys
import unittest
from starlette.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server import app
import sessionSecurity

class TestAvatarTurnAudit(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        sessionSecurity.init_security_schema()

    def test_record_turn_lifecycle_and_bitacora(self):
        corr_id = "MSP-TEST-CORR-12345"
        session_id = "sess_test_turn_audit"
        sender = "Tester"
        user_input = "Prueba de ciclo de vida de turno"
        endpoint = "https://teamily.ai/v1/agents/margarette-gerente-de-planta/responses"

        # 1. Pre-call
        ok_pre = sessionSecurity.record_turn_pre_call(
            correlation_id=corr_id,
            session_id=session_id,
            sender=sender,
            user_input=user_input,
            endpoint_engine=endpoint
        )
        self.assertTrue(ok_pre)

        # 2. Check intermediate status in bitacora
        bitacora = sessionSecurity.get_audit_bitacora(limit=10)
        found = [r for r in bitacora if r["correlation_id"] == corr_id]
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["delivery_status"], "en_curso")
        self.assertEqual(found[0]["user_input"], user_input)
        self.assertIn("T", found[0]["timestamp_utc"])
        self.assertIn("T", found[0]["expires_at"])

        # 3. Post-call
        ok_post = sessionSecurity.record_turn_post_call(
            correlation_id=corr_id,
            agent_reply="Respuesta de prueba del agente",
            delivery_status="completado",
            error_code=None,
            latency_ms=123.45
        )
        self.assertTrue(ok_post)

        # 4. Check updated status in bitacora
        bitacora_after = sessionSecurity.get_audit_bitacora(limit=10)
        found_after = [r for r in bitacora_after if r["correlation_id"] == corr_id][0]
        self.assertEqual(found_after["delivery_status"], "completado")
        self.assertEqual(found_after["agent_reply"], "Respuesta de prueba del agente")
        self.assertAlmostEqual(found_after["latency_ms"], 123.45, places=2)

    def test_api_bitacora_endpoint_and_security(self):
        resp = self.client.get("/api/v1/avatar/bitacora?limit=5")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("status"), "success")
        self.assertIn("bitacora", data)
        self.assertIsInstance(data["bitacora"], list)

        # Verificar que ningún item contiene tokens o credenciales
        raw_text = resp.text
        self.assertNotIn("tmly_sk_", raw_text)
        self.assertNotIn("authorization", raw_text.lower())
        self.assertNotIn("bearer", raw_text.lower())

if __name__ == "__main__":
    unittest.main()
