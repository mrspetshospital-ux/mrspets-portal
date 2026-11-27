#!/usr/bin/env python3
"""
Prueba de Resiliencia del Canal Avatar Margarette / LEIA
Verifica que ante ausencia total de credenciales de nube (Teamily / Gemini),
el avatar responda con la identidad oficial de Margarette mediante el motor in-house
de Centralita en lugar de caer en el mensaje genérico de error de sistema.
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

    def test_margarette_responds_when_cloud_credentials_missing(self):
        """Verifica que el endpoint /api/v1/avatar/chat retorne a Margarette y no el error de sistema cuando faltan API keys."""
        resp = self.client.post("/api/v1/avatar/chat", json={
            "agent_id": "margaret",
            "message": "Hola, ¿quién eres?"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "success")
        self.assertEqual(data.get("agent"), "margaret")
        self.assertIn("Margarette", data.get("agent_name", ""))
        self.assertIn("LEIA", data.get("reply", ""))
        self.assertNotIn("Leire", data.get("reply", ""))
        self.assertNotIn("Leira", data.get("reply", ""))
        self.assertNotIn("En este momento no puedo completar tu consulta", data.get("reply", ""))

    def test_margarette_provides_pricing_when_asked(self):
        """Verifica que Margarette entregue tarifas oficiales y tasa BCV en el fallback cognitivo."""
        resp = self.client.post("/api/v1/avatar/chat", json={
            "agent_id": "margaret",
            "message": "Cuáles son los precios de los servicios y la tasa bcv?"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        reply = data.get("reply", "")
        self.assertIn("BCV", reply)
        self.assertIn("Grooming", reply)

if __name__ == "__main__":
    unittest.main()
