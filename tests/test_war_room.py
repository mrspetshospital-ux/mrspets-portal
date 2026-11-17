#!/usr/bin/env python3
"""
Test Suite: Mrs. Pets Cuarto de Guerra (War Room) & Mesa Integrada de 5 Nodos
Verifica:
1. Estado normal y de alerta de los 5 nodos (Harryt, Charlie/Volturi, AntiGravity, Make.com, Teamly)
2. Diagnóstico activo en JSON estructurado y ejecución del parche único
3. Puerta de enlace con token efímero de 1 a 2 horas y aislamiento estricto de PII
4. Caja negra inmutable y despacho a Google Sheets (Hoja 'Registro de Interacciones')
5. Restricción de seguridad exclusiva para roles autorizados (Harryt y Dalybell)
"""

import sys
import os
import unittest
import json
import urllib.request
import urllib.error

# Agregar rutas locales
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from warRoomEngine import war_room_engine, is_authorized_war_room_admin

class TestWarRoomEngine(unittest.TestCase):
    def setUp(self):
        # Asegurar estado base limpio
        war_room_engine.status = "ESTABLE"
        war_room_engine.active_incidents = []

    def test_01_five_nodes_initialized(self):
        status = war_room_engine.get_status()
        self.assertEqual(status["status"], "ESTABLE")
        self.assertFalse(status["has_active_incidents"])
        
        nodes = status["nodes"]
        expected_nodes = ["harryt", "antigravity", "gemini", "make", "teamly"]
        for nid in expected_nodes:
            self.assertIn(nid, nodes, f"Nodo {nid} debe estar presente en la mesa de 5 nodos")
            self.assertEqual(nodes[nid]["status"], "ESTABLE")
            self.assertIn("role", nodes[nid])
            self.assertIn("ping_ms", nodes[nid])
            self.assertIn("icon", nodes[nid])

    def test_02_alert_trigger_and_structured_json(self):
        inc = war_room_engine.trigger_incident(
            service="Make.com Webhook Omnichannel",
            title="Fallo de Comunicación en Webhook Make.com (HTTP 502)",
            error_code="WEBHOOK_UNREACHABLE_502",
            details={
                "endpoint": "https://hook.us2.make.com/rsdqtjwgxit0j4uw8s58oe31sa27j7d4",
                "http_status": 502,
                "attempt_count": 3
            },
            affected_nodes=["make", "antigravity"]
        )
        self.assertEqual(inc["severity"], "CRITICA")
        self.assertIn("structured_diagnostic", inc)
        self.assertEqual(inc["structured_diagnostic"]["http_status"], 502)
        self.assertIn("proposed_solution", inc)
        self.assertTrue(inc["proposed_solution"]["safety_verified"])

        status = war_room_engine.get_status()
        self.assertEqual(status["status"], "ALERTA")
        self.assertTrue(status["has_active_incidents"])
        self.assertEqual(status["nodes"]["make"]["status"], "ALERTA")

    def test_03_execute_hotfix_and_sheets_audit(self):
        # Disparar alerta primero
        inc = war_room_engine.trigger_incident()
        inc_id = inc["incident_id"]

        # Ejecutar parche con AntiGravity
        res = war_room_engine.execute_patch(
            incident_id=inc_id,
            authorized_by="Harryt & Dalybell",
            notes="Parche autorizado para failover y purga de cola"
        )
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["system_status"], "ESTABLE")
        
        # Verificar que todos los nodos regresaron a ESTABLE
        status = war_room_engine.get_status()
        self.assertEqual(status["status"], "ESTABLE")
        for nid, node in status["nodes"].items():
            self.assertEqual(node["status"], "ESTABLE", f"Nodo {nid} debe ser ESTABLE tras el parche")

        # Verificar auditoría y despacho a Google Sheets
        self.assertIn("sheets_dispatch", res)
        self.assertIn(res["sheets_dispatch"]["status"], ["success", "skipped"])

    def test_04_ephemeral_token_and_sandbox_pii_isolation(self):
        # 1. Generar token de 1 hora
        inv = war_room_engine.create_ephemeral_token(
            creator="Dalybell Ramírez",
            duration_hours=1,
            service_scope="Q-Vet DICOM PACS",
            notes="Revisión de latencia DICOM"
        )
        token = inv["token"]
        self.assertTrue(token.startswith("war_guest_"))
        self.assertIn("expires_at", inv)
        self.assertEqual(inv["duration_hours"], 1)

        # 2. Consultar vista aislada de diagnóstico
        sandbox = war_room_engine.get_guest_sandbox_data(token)
        self.assertTrue(sandbox["valid"])
        self.assertEqual(sandbox["service_scope"], "Q-Vet DICOM PACS")
        self.assertGreater(sandbox["remaining_minutes"], 50)
        self.assertIn("isolated_logs", sandbox)
        self.assertIn("chat_messages", sandbox)

        # 3. Comprobación de ZERO PII (No debe haber cédulas, teléfonos, tutores ni mascotas)
        sandbox_str = json.dumps(sandbox)
        for forbidden in ["V-18.452.910", "+58 414-389-1102", "Dalybell Ramírez Montilla", "Princesa Motica"]:
            self.assertNotIn(forbidden, sandbox_str, f"PII prohibida '{forbidden}' no debe aparecer en el sandbox externo")

    def test_05_admin_authorization_restrictions(self):
        # Usuarios válidos autorizados
        self.assertTrue(is_authorized_war_room_admin({"tipo": "staff", "rol": "admin", "nombre": "Harryt Padrón", "username": "harryt"}))
        self.assertTrue(is_authorized_war_room_admin({"tipo": "staff", "rol": "admin", "nombre": "Dalybell Ramírez", "username": "talibel"}))
        self.assertTrue(is_authorized_war_room_admin({"tipo": "staff", "rol": "admin", "nombre": "Administrador General", "username": "admin"}))

        # Usuarios no autorizados (clientes, staff general, recepcionistas, groomers)
        self.assertFalse(is_authorized_war_room_admin({"tipo": "cliente", "rol": "cliente", "nombre": "Carlos Mendoza"}))
        self.assertFalse(is_authorized_war_room_admin({"tipo": "staff", "rol": "recepcion", "nombre": "María Asistente"}))
        self.assertFalse(is_authorized_war_room_admin({"tipo": "staff", "rol": "groomer", "nombre": "Pedro Peluquero"}))
        self.assertFalse(is_authorized_war_room_admin(None))
        self.assertFalse(is_authorized_war_room_admin({}))

    def test_06_war_room_chat_deliberation(self):
        # 1. Dirección envía reporte de problema en channel_mrspets
        res = war_room_engine.process_chat(
            sender="Harryt Padrón / Mrs. PETS CORP",
            role="Dirección General",
            message="Tengo un problema en estos momentos en que Leia no está conversando, no está respondiendo",
            channel_id="channel_mrspets",
            sender_id="mrspets"
        )
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["channel_id"], "channel_mrspets")
        self.assertEqual(res["sender_id"], "mrspets")

        # 2. Verificar que cada IA deliberó y respondió en su canal independiente con su identidad
        status = war_room_engine.get_status()
        recent_messages = status["chat_messages"][-10:]

        # Verificar AntiGravity en channel_antigravity
        ag_msgs = [m for m in recent_messages if m.get("sender_id") == "antigravity"]
        self.assertTrue(len(ag_msgs) > 0, "AntiGravity debe haber respondido en su canal")
        self.assertEqual(ag_msgs[-1]["channel_id"], "channel_antigravity")
        self.assertTrue(ag_msgs[-1]["verified"])
        self.assertEqual(ag_msgs[-1]["sender"], "Google AntiGravity")

        # Verificar Super Agent en channel_super_agent
        sa_msgs = [m for m in recent_messages if m.get("sender_id") == "super_agent"]
        self.assertTrue(len(sa_msgs) > 0, "Super Agent debe haber respondido en su canal")
        self.assertEqual(sa_msgs[-1]["channel_id"], "channel_super_agent")
        self.assertTrue(sa_msgs[-1]["verified"])
        self.assertEqual(sa_msgs[-1]["sender"], "Super Agent (Teamly)")

        # Verificar Gemini en channel_gemini
        gem_msgs = [m for m in recent_messages if m.get("sender_id") == "gemini"]
        self.assertTrue(len(gem_msgs) > 0, "Gemini debe haber emitido mensaje en su canal")
        self.assertEqual(gem_msgs[-1]["channel_id"], "channel_gemini")
        self.assertEqual(gem_msgs[-1]["sender"], "Gemini AI")
        self.assertIn("verified", gem_msgs[-1])
        # Si Gemini falló por falta de API key o red, debe avisar con su texto real o 'Gemini AI no respondió' sin relleno
        if not gem_msgs[-1]["verified"]:
            self.assertIn("Gemini AI no respondió", gem_msgs[-1]["message"])

        # 3. Verificar regla estricta: nadie publica por otro en canal ajeno
        for m in recent_messages:
            if m.get("channel_id") == "channel_antigravity":
                self.assertEqual(m.get("sender_id"), "antigravity")
            elif m.get("channel_id") == "channel_super_agent":
                self.assertEqual(m.get("sender_id"), "super_agent")
            elif m.get("channel_id") == "channel_gemini":
                self.assertEqual(m.get("sender_id"), "gemini")
            elif m.get("channel_id") == "channel_mrspets":
                self.assertEqual(m.get("sender_id"), "mrspets")

        # 4. Probar rechazo ante discordancia de canal (ej. Gemini intentando firmar en canal de AntiGravity)
        rej_mismatch = war_room_engine.process_chat(
            sender="Gemini AI",
            role="AI",
            message="Intento publicar en canal de AntiGravity",
            channel_id="channel_antigravity",
            sender_id="gemini"
        )
        self.assertEqual(rej_mismatch["status"], "rejected")
        self.assertEqual(rej_mismatch["error"], "REJECTED_CHANNEL_MISMATCH")

        # 5. Probar rechazo ante Comité Volturi (canal bilateral externo no admitido en Cuarto de Guerra)
        rej_volturi = war_room_engine.process_chat(
            sender="Charlie / Comité Volturi",
            role="Gobernanza",
            message="Intento publicar en Cuarto de Guerra",
            channel_id="channel_mrspets",
            sender_id="volturi"
        )
        self.assertEqual(rej_volturi["status"], "rejected")
        self.assertEqual(rej_volturi["error"], "VOLTURI_EXCLUDED_FROM_WAR_ROOM")

        # 6. Verificar que se abrió la incidencia en el Cuadro de Fallas
        self.assertTrue(status["has_active_incidents"])
        self.assertIn("Leia", status["active_incident"]["service"])

    def test_07_war_room_node_configs_and_urls(self):
        # Configurar URLs reales de Make, Gemini, Sheets, etc.
        new_urls = {
            "make_webhook_url": "https://hook.us2.make.com/custom_test_endpoint_12345",
            "gemini_model": "gemini-2.5-flash",
            "google_sheets_id": "1yfnYyG23Z8JipApuW_-wiH_TEST_SHEET"
        }
        res = war_room_engine.update_node_configs(new_urls)
        self.assertEqual(res["status"], "success")
        self.assertEqual(war_room_engine.node_configs["make_webhook_url"], "https://hook.us2.make.com/custom_test_endpoint_12345")
        self.assertEqual(war_room_engine.node_configs["gemini_model"], "gemini-2.5-flash")
        self.assertEqual(war_room_engine.node_configs["google_sheets_id"], "1yfnYyG23Z8JipApuW_-wiH_TEST_SHEET")
        self.assertEqual(war_room_engine.node_configs["teamly_status"], "ASINCRONO_SIN_API_PUBLICA")

    def test_08_dispatch_custom_webhook(self):
        # Probar despacho con un payload arbitrario y extracción de variables
        custom_payload = {
            "event": "VET_APPOINTMENT_TEST",
            "patient_name": "Kaiser",
            "species": "Canino",
            "owner": "Harryt Luzardo",
            "service": "Grooming Spa & Ozonoterapia",
            "bcv_rate": 887.30
        }
        res = war_room_engine.dispatch_custom_webhook(
            target_url="https://hook.us2.make.com/rsdqtjwgxit0j4uw8s58oe31sa27j7d4",
            payload=custom_payload
        )
        self.assertIn("dispatch_id", res)
        self.assertIn("keys_detected", res)
        self.assertIn("patient_name", res["keys_detected"])
        self.assertIn("species", res["keys_detected"])
        self.assertIn("bcv_rate", res["keys_detected"])
        self.assertGreater(res["payload_bytes"], 0)
        self.assertIn("http_status", res)
        self.assertIn("latency_ms", res)

    def test_09_masked_secrets_in_status_and_config(self):
        status = war_room_engine.get_status()
        configs = status["node_configs"]
        
        # Verificar que el webhook está enmascarado
        webhook_val = configs.get("make_webhook_url", "")
        if webhook_val:
            self.assertIn("/****", webhook_val, "Webhook debe estar enmascarado en status")

        # Verificar que la API key está enmascarada
        gemini_key = configs.get("gemini_api_key", "")
        if gemini_key:
            self.assertTrue(gemini_key.startswith("****"), "gemini_api_key debe estar enmascarada")
            self.assertLessEqual(len(gemini_key), 8)

        # Verificar que get_masked_node_configs() no expone secretos
        masked_cfg = war_room_engine.get_masked_node_configs()
        if masked_cfg.get("gemini_api_key"):
            self.assertTrue(masked_cfg["gemini_api_key"].startswith("****"))

if __name__ == "__main__":
    unittest.main()
