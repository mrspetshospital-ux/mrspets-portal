#!/usr/bin/env python3
"""
Test Suite: Teamily Integration, Subagents & Operations Engine
Verifica:
1. TeamilyGeoAClient.get_status() y enmascaramiento de claves
2. TeamilyGeoARequest y normalización de endpoints
3. Generación y telemetría de Mike (Gerencia de Operaciones & IoT: Tanques Don Bosco, Cummins 65kVA)
4. Persistencia e integridad del modelo de datos de tanques y CDT
"""

import sys
import os
import unittest
import json

# Agregar rutas locales
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from teamilyClient import TeamilyGeoAClient, TeamilyGeoARequest, teamily_geo_a_client, normalize_teamily_endpoint
from misipetEngine import misipet_engine

class TestTeamilyAndSubagents(unittest.TestCase):

    def test_01_geo_a_client_status_and_keys(self):
        """Verifica que get_status() retorne los campos requeridos y que la clave esté enmascarada."""
        client = TeamilyGeoAClient(
            board_id="test-board-123",
            endpoint="https://teamily.ai/v1/chat",
            server_key="ty_sec_prod_live_998877"
        )
        status = client.get_status()
        self.assertEqual(status["status"], "ready")
        self.assertEqual(status["agent"], "geo-a")
        self.assertEqual(status["board_id"], "test-board-123")
        self.assertEqual(status["endpoint"], "https://teamily.ai/v1/chat")
        self.assertTrue(status["server_key_configured"])
        
        # Enmascaramiento estricto
        masked = status["masked_key"]
        self.assertTrue(masked.startswith("ty_s"))
        self.assertTrue(masked.endswith("8877"))
        self.assertIn("••••••••", masked)
        self.assertNotIn("prod_live", masked)

    def test_02_teamily_request_serialization(self):
        """Verifica serialización del TeamilyGeoARequest"""
        req = TeamilyGeoARequest(
            input="Revisión de turnos de estilistas",
            board_id="board-test-456"
        )
        payload = req.to_payload()
        self.assertEqual(payload["input"], "Revisión de turnos de estilistas")
        self.assertEqual(payload["board_id"], "board-test-456")
        self.assertTrue(payload["wait"])

    def test_03_mike_operations_tanks_telemetry(self):
        """Verifica que el motor de tanques de Mike provea datos operativos reales (Don Bosco 18.400L+)."""
        tdata = misipet_engine.get_tanks()
        self.assertEqual(tdata["status"], "success")
        self.assertIn("data", tdata)
        
        tanks = tdata["data"].get("tanks", [])
        self.assertGreaterEqual(len(tanks), 4, "Debe haber al menos 4 tanques registrados")
        
        gm = tdata["data"].get("global_metrics", {})
        self.assertIn("total_liters", gm)
        self.assertGreaterEqual(gm["total_liters"], 15000.0)
        self.assertIn("autonomy_days", gm)
        self.assertGreater(gm["autonomy_days"], 10.0)
        self.assertEqual(gm["semaphore_global"], "green")

    def test_04_default_singleton_client(self):
        """Verifica que la instancia singleton teamily_geo_a_client esté inicializada."""
        self.assertIsNotNone(teamily_geo_a_client)
        st = teamily_geo_a_client.get_status()
        self.assertEqual(st["agent"], "geo-a")
        self.assertIn("board_id", st)

    def test_05_margaret_teamily_request(self):
        """Verifica que las solicitudes para Margarette se construyan correctamente sin respuestas prefabricadas."""
        req = TeamilyGeoARequest(
            input="buenas noches",
            board_id="5803df5a-7127-4d28-b97c-5c840d47cdc7"
        )
        p = req.to_payload()
        self.assertEqual(p["input"], "buenas noches")
        self.assertEqual(p["board_id"], "5803df5a-7127-4d28-b97c-5c840d47cdc7")

    def test_06_endpoint_normalization_v1_chat(self):
        """Verifica que el endpoint conceptual https://teamily.ai/v1/chat se canalice al endpoint operativo del agente de Charly."""
        self.assertEqual(
            normalize_teamily_endpoint("https://teamily.ai/v1/chat"),
            "https://teamily.ai/v1/agents/geo-a/responses"
        )
        self.assertEqual(
            normalize_teamily_endpoint("https://teamily.ai/v1/chat/"),
            "https://teamily.ai/v1/agents/geo-a/responses"
        )
        self.assertEqual(
            normalize_teamily_endpoint(None),
            "https://teamily.ai/v1/agents/geo-a/responses"
        )
        self.assertEqual(
            normalize_teamily_endpoint("https://teamily.ai/v1/agents/geo-a/responses"),
            "https://teamily.ai/v1/agents/geo-a/responses"
        )

if __name__ == "__main__":
    unittest.main()
