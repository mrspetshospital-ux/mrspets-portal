#!/usr/bin/env python3
"""
Prueba de Resiliencia del Canal Avatar Margarette / LEIA (Especificación Volturi Fase 0)
Verifica que ante ausencia total de canales de nube (Teamily / Gemini),
el sistema NO enmascare el fallo con plantillas locales simuladas pretendiendo ser Margarette,
sino que devuelva un respaldo honesto del sistema con active_channel='fallback'
y enlace de traspaso humano a WhatsApp.
"""

import os
import sys
import unittest
from starlette.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server import app

class TestAvatarFallbackResilience(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_margarette_honest_system_fallback_when_cloud_unavailable(self):
        """
        Verifica que ante caída de Teamily y Gemini, el endpoint no enmascare con un motor
        de reglas local, sino que declare honestamente active_channel='fallback' y agent='system'.
        """
        resp = self.client.post("/api/v1/avatar/chat", json={
            "agent_id": "margaret",
            "message": "Hola, ¿quién eres?"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "success")
        self.assertEqual(data.get("agent"), "system")
        self.assertEqual(data.get("active_channel"), "fallback")
        self.assertTrue(data.get("failover_triggered"))
        reply = data.get("reply", "")
        self.assertIn("Canal de Atención", reply)
        self.assertIn("WhatsApp", reply)

    def test_margarette_human_handoff_triggered_on_repeated_failures(self):
        """
        Verifica que ante fallos continuos se active la estructura de traspaso humano (human_handoff).
        """
        resp = self.client.post("/api/v1/avatar/chat", json={
            "agent_id": "margaret",
            "message": "Fiebre de 40 grados, no come desde ayer"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("active_channel"), "fallback")
        reply = data.get("reply", "")
        self.assertTrue("WhatsApp" in reply or "wa.me" in reply)

if __name__ == "__main__":
    unittest.main()
