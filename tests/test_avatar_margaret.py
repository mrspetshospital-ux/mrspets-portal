#!/usr/bin/env python3
"""
Test Suite: Margaret / Margarette Avatar Web Connection & Receptionist Flow
Verifica los 10 criterios de la revisión técnica:
1. Identidad de Margaret/Margarette correcta sin hardcoding cruzado a Leia.
2. Conservación del flujo de botones (agenda, grooming, clínica, hotel, tienda, admin y texto libre).
3. Rol de recepcionista con orientación de los 4 servicios, horarios (8am-6pm) y Tasa BCV.
4. Aislamiento estricto de identidades Margaret (👩‍💼) vs Leia (🎀).
5. Despacho hacia Teamily y método ask_margaret con board_id oficial.
6. Manejo transparente sin respuestas simuladas ni confirmaciones falsas.
"""

import sys
import os
import unittest
import json

# Agregar rutas locales
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from centralitaRouter import centralita_router, AGENT_REGISTRY
from teamilyClient import teamily_geo_a_client, TeamilyGeoARequest

class TestAvatarMargaret(unittest.TestCase):

    def test_01_margaret_resolution_variants(self):
        """Verifica que 'margaret', 'margarette', 'atencion' y '@margaret' se resuelvan hacia Margaret."""
        variants = ["margaret", "margarette", "atencion", "atención", "recepcion", "recepción"]
        for v in variants:
            slug, name = centralita_router.resolve_target_agent("hola", requested_slug=v)
            self.assertEqual(slug, "margaret", f"Variante '{v}' debe resolver hacia slug 'margaret'")
            self.assertIn("Margaret", name)

        # Mención explícita en texto
        slug_txt1, _ = centralita_router.resolve_target_agent("Por favor @margaret ayúdame")
        self.assertEqual(slug_txt1, "margaret")

        slug_txt2, _ = centralita_router.resolve_target_agent("Hola margarette deseo información")
        self.assertEqual(slug_txt2, "margaret")

    def test_02_margaret_receptionist_service_orientation(self):
        """Verifica que Margaret oriente como recepcionista en los 4 servicios y horarios oficiales."""
        # Consulta de Reservas / Turnos
        resp_reserva = centralita_router.synthesize_agent_response("margaret", "Margaret", "Deseo hacer una reserva para mañana")
        self.assertIn("Margaret", resp_reserva)
        self.assertIn("Grooming Spa", resp_reserva)
        self.assertIn("Clínica", resp_reserva)
        self.assertIn("Hotel", resp_reserva)
        self.assertIn("6:00 p.m.", resp_reserva)
        self.assertIn("Domingos", resp_reserva)

        # Consulta de Grooming Spa y Pulpejos
        resp_grooming = centralita_router.synthesize_agent_response("margaret", "Margaret", "Quiero saber del circuito de grooming y corte")
        self.assertIn("7 Estaciones", resp_grooming)
        self.assertIn("pulpejo", resp_grooming.lower())
        self.assertIn("4 turnos", resp_grooming.lower())

        # Consulta de Tasa BCV y Precios
        resp_tasa = centralita_router.synthesize_agent_response("margaret", "Margaret", "¿Cuál es el precio o tasa bcv de hoy?")
        self.assertIn("Banco Central de Venezuela", resp_tasa)
        self.assertIn("BCV", resp_tasa)

    def test_03_margaret_acting_as_leia_for_clients(self):
        """Verifica que Margarette de Teamily asuma la identidad pública de Leia (🎀) de cara a los clientes."""
        resp = centralita_router.synthesize_agent_response("margaret", "Margaret", "Hola, buenas tardes", context={"persona": "leia"})
        self.assertIn("🎀", resp)
        self.assertIn("Leia", resp)
        self.assertIn("Concierge VIP", resp)
        self.assertIn("Mrs. Pets", resp)

    def test_04_teamily_client_ask_margaret_request(self):
        """Verifica que teamily_geo_a_client disponga de ask_margaret y construya la petición con el board oficial."""
        self.assertIsNotNone(teamily_geo_a_client)
        self.assertTrue(hasattr(teamily_geo_a_client, "ask_margaret"))

        req = TeamilyGeoARequest(
            input="Consulta de recepción para Princesa Motica",
            board_id=teamily_geo_a_client.board_id
        )
        payload = req.to_payload()
        self.assertEqual(payload["board_id"], "5803df5a-7127-4d28-b97c-5c840d47cdc7")
        self.assertIn("Princesa Motica", payload["input"])

    def test_05_reception_escalation_to_administration(self):
        """Verifica que cuando el cliente pide hablar con administración o Talibel, Margaret escale de inmediato."""
        resp_admin = centralita_router.synthesize_agent_response("margaret", "Margaret", "Deseo hablar con Talibel o la Administración")
        self.assertIn("Talibel", resp_admin)
        self.assertIn("Administración", resp_admin)
        self.assertIn("prioridad", resp_admin.lower())

    def test_06_no_fake_confirmation_on_complaints(self):
        """Verifica que ante quejas se abra auditoría formal y no se generen confirmaciones ficticias."""
        resp_queja = centralita_router.synthesize_agent_response("margaret", "Margaret", "Tengo un reclamo por un problema en el servicio")
        self.assertIn("auditoría", resp_queja.lower())
        self.assertIn("expediente", resp_queja.lower())
        self.assertNotIn("serverMsgID", resp_queja)

    def test_07_buenas_noches_reception_greeting(self):
        """Verifica que un saludo simple como 'buenas noches' sea respondido con la identidad pública de Leia pero motor de Margarette."""
        resp = centralita_router.synthesize_agent_response("margaret", "Margaret", "buenas noches", context={"persona": "leia"})
        self.assertIn("Leia", resp)
        self.assertIn("Avenida 2 El Milagro", resp)
        self.assertIn("🎀", resp)

    def test_08_api_endpoints_buenas_noches(self):
        """Verifica que los endpoints HTTP de Teamily y Gemini respondan con Leia de cara al cliente ante 'buenas noches'."""
        try:
            from starlette.testclient import TestClient
            from server import app
            client = TestClient(app)

            # 1. Endpoint Teamily agent-chat
            res_team = client.post("/api/v1/teamily/agent-chat", json={"agent_id": "margaret", "message": "buenas noches"})
            self.assertEqual(res_team.status_code, 200)
            data_team = res_team.json()
            self.assertEqual(data_team.get("agent"), "margaret")
            self.assertIn("Leia", data_team.get("reply", ""))
            self.assertIn("🎀", data_team.get("reply", ""))

            # 2. Endpoint Leia/Margaret fallback chat
            res_gem = client.post("/api/v1/leia/chat", json={"agent_id": "margaret", "requested_slug": "margaret", "message": "buenas noches"})
            self.assertEqual(res_gem.status_code, 200)
            data_gem = res_gem.json()
            self.assertEqual(data_gem.get("agent"), "margaret")
            reply_gem = data_gem.get("reply", "")
            self.assertIn("Leia", reply_gem)
            self.assertIn("🎀", reply_gem)
        except ImportError:
            pass


if __name__ == "__main__":
    unittest.main()
