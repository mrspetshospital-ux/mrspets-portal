#!/usr/bin/env python3
"""
Mrs. Pets — Suite de Pruebas de Endurecimiento del Canal de Atención (Margarette / Avatar)
==========================================================================================
Cubre los criterios de aceptación del pliego técnico (21/11/2026):
1. Debilidad 1: Separar identidad de motor (fallback no menciona a Leia ni Concierge VIP).
2. Debilidad 2: Timeout base de 45 segundos y reintentos automáticos para errores transitorios.
3. Debilidad 3: Mensaje de respaldo honesto con WhatsApp +58 414-6799510 sin prometer reintentos.
4. Debilidad 4: Monitor de salud / Health check (/api/health/agent) con alertas tras 2 y 4 fallos.
5. Debilidad 5: Traspaso a humano con transferencia de contexto tras 2 intentos sin resolución.
6. Debilidad 6: Fixtures de verificación del agente Margarette (@9000408632300095).
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from avatarHardening import (
    MARGARETTE_TEAMILY_USER_ID,
    WHATSAPP_CONCIERGE_PHONE,
    WHATSAPP_CONCIERGE_PHONE_RAW,
    BRANCH_ADDRESS_PHYSICAL,
    DEFAULT_AGENT_TIMEOUT_SEC,
    build_honest_fallback_message,
    build_human_handoff_payload,
    AgentHealthTracker
)


class TestCanalMargaretteHardening(unittest.TestCase):

    def setUp(self):
        self.tracker = AgentHealthTracker()

    def test_01_debilidad_1_fallback_no_menciona_leia_ni_concierge_vip(self):
        """Debilidad 1: El mensaje de error debe hablar como SISTEMA y jamás mencionar 'Leia' ni 'Concierge VIP'."""
        fallback = build_honest_fallback_message(user_name="Harryt", pet_name="Princesa")
        self.assertNotIn("Leia", fallback, "CRITERIO DE ACEPTACIÓN: El fallback no debe mencionar a Leia")
        self.assertNotIn("Concierge VIP", fallback, "CRITERIO DE ACEPTACIÓN: El fallback no debe mencionar Concierge VIP")
        self.assertIn("Canal de Atención Mrs. Pets", fallback, "Debe identificarse como Canal de Atención / Sistema")

    def test_02_debilidad_1_agente_real_es_margarette_9000408632300095(self):
        """Debilidad 1: El ID de Teamily configurado para el agente que atiende debe ser 9000408632300095."""
        self.assertEqual(MARGARETTE_TEAMILY_USER_ID, "9000408632300095")

    def test_03_debilidad_2_timeout_base_45_segundos(self):
        """Debilidad 2: El timeout base para llamadas al agente debe ser 45 segundos por defecto."""
        self.assertGreaterEqual(
            DEFAULT_AGENT_TIMEOUT_SEC, 45.0,
            f"El timeout debe ser >= 45s, valor actual: {DEFAULT_AGENT_TIMEOUT_SEC}"
        )

    def test_04_debilidad_3_mensaje_respaldo_honesto_whatsapp_sin_reintenta(self):
        """Debilidad 3: Enlace funcional a WhatsApp, dirección en Av. El Milagro y sin promesas de reintento."""
        fallback = build_honest_fallback_message(user_name="Dalybell", pet_name="Zeus")
        self.assertIn(f"wa.me/{WHATSAPP_CONCIERGE_PHONE_RAW}", fallback)
        self.assertIn(WHATSAPP_CONCIERGE_PHONE, fallback)
        self.assertIn("Avenida 2 El Milagro", fallback)
        self.assertNotIn("reintenta", fallback.lower(), "CRITERIO DE ACEPTACIÓN: Prohibida la palabra 'reintenta'")
        self.assertNotIn("intermitencia", fallback.lower(), "Prohibido alegar 'intermitencia' ficticia")
        self.assertIn("princesa o príncipe", fallback.lower())

    def test_05_debilidad_4_health_tracker_registro_y_alertas_al_geo(self):
        """Debilidad 4: /api/health/agent calcula uptime y activa alertas al GEO tras 2 fallos consecutivos."""
        # 1. Chequeo saludable
        summary1 = self.tracker.record_check_result(ok=True, latency_ms=150.0)
        self.assertEqual(summary1["status"], "ok")
        self.assertEqual(summary1["consecutive_failures"], 0)
        self.assertFalse(summary1["alert_geo_active"])

        # 2. Primer fallo transitorio -> degraded, alerta inactiva
        summary2 = self.tracker.record_check_result(ok=False, latency_ms=45000.0, error_detail="Timeout 45s")
        self.assertEqual(summary2["status"], "degraded")
        self.assertEqual(summary2["consecutive_failures"], 1)
        self.assertFalse(summary2["alert_geo_active"])

        # 3. Segundo fallo consecutivo -> down, alerta al GEO activa
        summary3 = self.tracker.record_check_result(ok=False, latency_ms=45000.0, error_detail="Timeout 45s")
        self.assertEqual(summary3["status"], "down")
        self.assertEqual(summary3["consecutive_failures"], 2)
        self.assertTrue(summary3["alert_geo_active"], "CRITERIO DE ACEPTACIÓN: 2 fallos consecutivos activan alerta al GEO")

        # 4. Cuarto fallo consecutivo -> alerta a soporte
        self.tracker.record_check_result(ok=False, latency_ms=45000.0)
        summary5 = self.tracker.record_check_result(ok=False, latency_ms=45000.0)
        self.assertEqual(summary5["consecutive_failures"], 4)
        self.assertTrue(summary5["alert_support_active"], "4 fallos consecutivos activan alerta a soporte")

        # 5. Recuperación inmediata
        summary_rec = self.tracker.record_check_result(ok=True, latency_ms=180.0)
        self.assertEqual(summary_rec["status"], "ok")
        self.assertEqual(summary_rec["consecutive_failures"], 0)
        self.assertFalse(summary_rec["alert_geo_active"])

    def test_06_debilidad_5_traspaso_a_humano_con_contexto(self):
        """Debilidad 5: Tras 2 intentos fallidos en la sesión se genera el enlace de traspaso con contexto."""
        sess_id = "test_session_user_42"
        # 1er fallo
        count1 = self.tracker.record_session_failure(sess_id)
        self.assertEqual(count1, 1)

        # 2do fallo -> activa traspaso
        count2 = self.tracker.record_session_failure(sess_id)
        self.assertEqual(count2, 2)

        handoff = build_human_handoff_payload(
            user_name="Alejandro",
            pet_name="Bruno",
            phone="+58 414-6123456",
            service="Grooming Spa Canino",
            issue_summary="Consulta sobre hidratación de pulpejos y baño medicado",
            session_id=sess_id
        )
        self.assertTrue(handoff["available"])
        self.assertIn("wa.me/584146799510", handoff["whatsapp_url"])
        self.assertIn("Alejandro", handoff["whatsapp_url"])
        self.assertIn("Bruno", handoff["whatsapp_url"])

        # Mensaje final con traspaso incluido
        msg_with_handoff = build_honest_fallback_message(
            user_name="Alejandro",
            pet_name="Bruno",
            include_handoff=True,
            handoff_url=handoff["whatsapp_url"]
        )
        self.assertIn("Traspaso a Atención Humana Inmediata", msg_with_handoff)
        self.assertNotIn("Leia", msg_with_handoff)

    def test_07_inspeccion_estatica_rutas_registradas_en_server(self):
        """Verifica estáticamente que server.py contiene las rutas de health check y hardening requeridas."""
        server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")
        with open(server_path, "r", encoding="utf-8") as f:
            src = f.read()
        self.assertIn('@app.get("/api/health/agent")', src)
        self.assertIn('@app.post("/api/health/agent")', src)
        self.assertIn('@app.post("/api/v1/avatar/chat")', src)
        self.assertIn("build_honest_fallback_message", src)
        self.assertIn("build_human_handoff_payload", src)
        self.assertIn("9000408632300095", src)


if __name__ == "__main__":
    unittest.main()
