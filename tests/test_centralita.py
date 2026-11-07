#!/usr/bin/env python3
"""
Test Suite: Centralita Router, Identidades Aisladas Leia/Margaret y Filtro Anti-Bucle
Mrs. Pets — Big & Little Dogs, C.A. • War Room Integration
"""

import sys
import os
import unittest
import json
import urllib.request
import urllib.error

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from centralitaRouter import centralita_router, AGENT_REGISTRY


class TestCentralitaRouter(unittest.TestCase):
    def test_01_identity_isolation_leia_and_margaret(self):
        """Verifica que Leia y Margaret tienen identidades 100% aisladas sin suplantación."""
        leia_meta = AGENT_REGISTRY["leia"]
        margaret_meta = AGENT_REGISTRY["margaret"]

        # 1. Avatares estrictamente diferentes
        self.assertEqual(leia_meta["avatar"], "assets/leia_avatar.jpg")
        self.assertEqual(margaret_meta["avatar"], "assets/margaret_avatar.svg")
        self.assertNotEqual(leia_meta["avatar"], margaret_meta["avatar"])

        # 2. Iconos y roles diferentes
        self.assertEqual(leia_meta["icon"], "🎀")
        self.assertEqual(margaret_meta["icon"], "👩‍💼")
        self.assertEqual(leia_meta["role"], "CONCIERGE VIP & ASISTENCIA CEO")
        self.assertEqual(margaret_meta["role"], "GERENCIA DE ATENCIÓN AL CLIENTE")

        # 3. Síntesis de voz inmutable
        leia_resp = centralita_router.synthesize_agent_response("leia", leia_meta["name"], "Hola Leia", {})
        margaret_resp = centralita_router.synthesize_agent_response("margaret", margaret_meta["name"], "Hola Margaret", {})

        self.assertIn("Leia", leia_resp)
        self.assertNotIn("Margaret", leia_resp)
        self.assertNotIn("fachada", leia_resp.lower())

        self.assertIn("Margaret", margaret_resp)
        self.assertNotIn("Leia", margaret_resp)
        self.assertNotIn("fachada", margaret_resp.lower())

    def test_02_routing_pure_by_semantic_intent(self):
        """Verifica que la Centralita enruta correctamente según la intención o slug."""
        # Intención de queja/reclamo -> Margaret
        slug, name = centralita_router.resolve_target_agent("Tengo un reclamo urgente por cobro indebido")
        self.assertEqual(slug, "margaret")

        # Intención de cita/reserva de spa -> Leia
        slug, name = centralita_router.resolve_target_agent("Deseo agendar una cita de spa para mi princesa")
        self.assertEqual(slug, "leia")

        # Finanzas y BCV -> Charly
        slug, name = centralita_router.resolve_target_agent("¿A qué tasa bcv se cobra el servicio hoy?")
        self.assertEqual(slug, "charlie")

        # Horario de piso y estaciones -> Manolo
        slug, name = centralita_router.resolve_target_agent("¿A qué hora es el cierre 6 de las estaciones de baño?")
        self.assertEqual(slug, "manolo")

        # Selección y RRHH -> Valeria
        slug, name = centralita_router.resolve_target_agent("Revisar currículum de María Briceño para la vacante")
        self.assertEqual(slug, "valeria")

    def test_03_deduplication_anti_loop(self):
        """Verifica que re-enviar el mismo message_id dentro de 90s es deduplicado sin bucles."""
        msg_id = "MSG-TEST-ANTILOOP-999"
        
        # Primer envío
        res1 = centralita_router.route_message(
            message_id=msg_id,
            user_input="Solicito información de cita",
            requested_slug="leia",
            agente_origen="user"
        )
        self.assertEqual(res1["status_code"], 200)
        self.assertEqual(res1["message_id"], msg_id)
        self.assertFalse(res1.get("duplicate_filtered", False))

        # Re-envío idéntico (simulando bucle de webhook o reintento de red)
        res2 = centralita_router.route_message(
            message_id=msg_id,
            user_input="Solicito información de cita",
            requested_slug="leia",
            agente_origen="user"
        )
        self.assertEqual(res2["status_code"], 200)
        self.assertEqual(res2["message_id"], msg_id)
        self.assertTrue(res2.get("duplicate_filtered", False))

    def test_04_traces_logging(self):
        """Verifica que cada mensaje enrutado registra trazas estructuradas para el War Room."""
        msg_id = "MSG-TRACE-TEST-123"
        centralita_router.route_message(
            message_id=msg_id,
            user_input="Hola Margaret tengo una duda con la atención",
            requested_slug="margaret",
            agente_origen="test_harness"
        )

        traces = centralita_router.get_recent_traces(10)
        matching = [t for t in traces if t.get("message_id") == msg_id]
        self.assertTrue(len(matching) > 0)
        t = matching[0]
        self.assertEqual(t["agente_origen"], "test_harness")
        self.assertEqual(t["agente_destino"], "margaret")
        self.assertEqual(t["estado"], "ENRUTADO_EXITOSO")
        self.assertIn("respuesta_preview", t)

    def test_05_http_live_endpoints_if_running(self):
        """Verifica contra el servidor local si está activo en 8080."""
        try:
            req = urllib.request.Request(
                "http://127.0.0.1:8080/api/v1/war-room/centralita-traces",
                headers={"User-Agent": "CentralitaTest/1.0"}
            )
            with urllib.request.urlopen(req, timeout=2) as resp:
                data = json.loads(resp.read().decode())
                self.assertIn("traces", data)
                self.assertIsInstance(data["traces"], list)
        except (urllib.error.URLError, ConnectionRefusedError):
            pass  # Servidor no levantado en este puerto aún, omitir


if __name__ == "__main__":
    unittest.main()
