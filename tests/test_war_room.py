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
        expected_nodes = ["harryt", "volturi", "antigravity", "make", "teamly"]
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
                "endpoint": "https://hook.us2.make.com/fp4s0npi280ymzqi5cl6mfkf4cy3x2lg",
                "http_status": 502,
                "attempt_count": 3
            },
            affected_nodes=["make", "volturi"]
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

if __name__ == "__main__":
    unittest.main()
