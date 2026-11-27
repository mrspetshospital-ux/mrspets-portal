#!/usr/bin/env python3
"""
Pruebas de la Fase 2: Privacidad Estricta Anti-Homónimos en Citas y Validación Telefónica
Mrs. Pets • Big & Little Dogs, C.A.
"""

import sys
import os
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from receptionBridge import (
    lookup_client_in_mrs_pets_db,
    format_margaret_system_directive,
    get_client_active_appointments,
    process_and_persist_booking,
    norm_phone
)


class TestFase2PrivacidadCitas(unittest.TestCase):
    def setUp(self):
        self.mock_bcv = {
            "effective_rate": 925.50,
            "manual_rate": 925.50,
            "last_updated": "2026-11-26T16:00:00Z",
            "source": "Banco Central de Venezuela (BCV Oficial)"
        }

    def test_01_homonym_name_lookup_rejected_without_phone(self):
        """Verifica que si alguien solo proporciona un nombre (ej. 'Dalybell'), NO se busque en BD ni se extraigan datos de terceros."""
        # Intento de lookup solo con nombre de tutor, sin número de teléfono
        res = lookup_client_in_mrs_pets_db(
            text="Hola, soy Dalybell y quiero saber mis citas",
            user_name="Dalybell",
            phone="",
            pet_name=""
        )
        self.assertFalse(res["found"])
        self.assertFalse(res["verified_by_phone"])
        self.assertIsNone(res["tutor"])
        self.assertEqual(res["mascotas"], [])
        self.assertEqual(res["active_appointments"], [])
        self.assertEqual(res["unverified_name"], "Dalybell")

    def test_02_strict_phone_lookup_success(self):
        """Verifica que el lookup sea exitoso únicamente al proveer un teléfono válido de 10 dígitos."""
        # Usamos el teléfono existente en la base de datos de pruebas (4146799510)
        res = lookup_client_in_mrs_pets_db(
            text="Buenas tardes, mi teléfono es 0414-6799510",
            user_name="Carlos",
            phone="04146799510"
        )
        self.assertTrue(res["found"])
        self.assertTrue(res["verified_by_phone"])
        self.assertIsNotNone(res["tutor"])
        self.assertEqual(res["phone_searched"], "4146799510")

    def test_03_unverified_client_asking_appointment_triggers_privacy_guard(self):
        """Verifica que un cliente sin verificar que pregunte por citas reciba la directiva estricta de privacidad (no revelar turno)."""
        unverified_client = {
            "found": False,
            "verified_by_phone": False,
            "tutor": None,
            "mascotas": [],
            "unverified_name": "Dalybell"
        }
        directive = format_margaret_system_directive(
            unverified_client,
            msg_text="¿A qué hora es mi cita de grooming?",
            bcv_cfg=self.mock_bcv
        )
        self.assertIn("ALERTA DE PRIVACIDAD — CONSULTA DE CITAS SIN IDENTIDAD VERIFICADA", directive)
        self.assertIn("PROHIBICIÓN ESTRICTA", directive)
        self.assertIn("Para consultar tu turno y expediente de forma segura", directive)
        self.assertIn("confírmame tu número de teléfono registrado", directive)
        self.assertNotIn("ESTATUS DE CITAS DEL CLIENTE — IDENTIDAD VERIFICADA POR TELÉFONO", directive)

    def test_04_verified_client_asking_appointment_shows_turn_and_time(self):
        """Verifica que un cliente autenticado por teléfono que pregunte por citas reciba la información de sus turnos activos."""
        verified_client = {
            "found": True,
            "verified_by_phone": True,
            "tutor": {"id": 1, "nombre": "Carlos", "telefono": "4146799510", "sector": "El Milagro"},
            "mascotas": [{"id": 1, "nombre": "Toby", "especie": "Perro", "raza": "Poodle"}],
            "active_appointments": [
                {
                    "codigo": "G-001",
                    "area": "grooming",
                    "mascota_nombre": "Toby",
                    "fecha_hora": "2026-11-27 10:00:00-04:00",
                    "estado": "confirmada"
                }
            ]
        }
        directive = format_margaret_system_directive(
            verified_client,
            msg_text="¿Cuál es mi turno de cita para mañana?",
            bcv_cfg=self.mock_bcv
        )
        self.assertIn("ESTATUS DE CITAS DEL CLIENTE — IDENTIDAD VERIFICADA POR TELÉFONO", directive)
        self.assertIn("Turno: G-001", directive)
        self.assertIn("Consentido(a): Toby", directive)
        self.assertIn("confirmada", directive)
        self.assertNotIn("ALERTA DE PRIVACIDAD — CONSULTA DE CITAS SIN IDENTIDAD VERIFICADA", directive)

    def test_05_verified_client_no_appointments_informs_cleanly(self):
        """Verifica que un cliente verificado sin citas activas reciba mensaje ofreciéndole agendar."""
        verified_client_no_appts = {
            "found": True,
            "verified_by_phone": True,
            "tutor": {"id": 1, "nombre": "Carlos", "telefono": "4146799510", "sector": "El Milagro"},
            "mascotas": [{"id": 1, "nombre": "Toby", "especie": "Perro"}],
            "active_appointments": []
        }
        directive = format_margaret_system_directive(
            verified_client_no_appts,
            msg_text="¿Tengo alguna cita agendada para hoy?",
            bcv_cfg=self.mock_bcv
        )
        self.assertIn("ESTATUS DE CITAS DEL CLIENTE — IDENTIDAD VERIFICADA POR TELÉFONO", directive)
        self.assertIn("NO registra citas activas actualmente", directive)
        self.assertIn("desea agendar", directive.lower())

    def test_06_idempotent_booking_avoids_duplicate_citas(self):
        """Verifica que solicitudes idénticas de reserva no dupliquen turnos en la base de datos."""
        client = {
            "found": True,
            "verified_by_phone": True,
            "tutor": {"id": 1, "nombre": "Carlos", "telefono": "4146799510"},
            "mascotas": [{"id": 1, "nombre": "Toby"}],
            "phone_searched": "4146799510"
        }
        msg = "Deseo agendar grooming para Toby mañana a las 10 am, mi telefono es 04146799510 y soy Carlos"
        body = {"userName": "Carlos", "petName": "Toby", "phone": "04146799510"}

        # Primera reserva
        booking1 = process_and_persist_booking(msg=msg, client_info=client, body=body, approval_mode="manual")
        self.assertIsNotNone(booking1)
        code1 = booking1["codigo"]

        # Segunda reserva idéntica (reintento del usuario)
        booking2 = process_and_persist_booking(msg=msg, client_info=client, body=body, approval_mode="manual")
        self.assertIsNotNone(booking2)
        code2 = booking2["codigo"]

        # Deben compartir el mismo código de turno e ID (idempotencia)
        self.assertEqual(code1, code2)
        self.assertEqual(booking1["cita_id"], booking2["cita_id"])

    def test_07_no_ghost_booking_without_required_fields(self):
        """Verifica que no se creen citas fantasma si no se suministra teléfono o datos obligatorios."""
        unverified = {
            "found": False,
            "verified_by_phone": False,
            "tutor": None,
            "mascotas": []
        }
        # Mensaje sin teléfono ni mascota específica
        booking = process_and_persist_booking(
            msg="Quiero reservar para mañana",
            client_info=unverified,
            body={},
            approval_mode="manual"
        )
        self.assertIsNone(booking)


if __name__ == "__main__":
    unittest.main()
