#!/usr/bin/env python3
"""
Pruebas de la Fase 1: Catálogo de Servicios Dinámico (BD) + Tasa BCV con Sello de Fecha
Mrs. Pets • Big & Little Dogs, C.A.
"""

import sys
import os
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from receptionBridge import (
    get_contextual_services_directive,
    format_margaret_system_directive,
    get_bcv_cached_data
)

class TestFase1ServiciosBCV(unittest.TestCase):
    def setUp(self):
        self.mock_bcv = {
            "effective_rate": 925.50,
            "manual_rate": 925.50,
            "last_updated": "2026-11-26T16:00:00Z",
            "source": "Banco Central de Venezuela (BCV Oficial)"
        }

    def test_01_no_service_inquiry_injects_zero_tokens(self):
        """Verifica que si el cliente solo saluda, no se inyectan tarifas (0 overhead de tokens)."""
        directive = get_contextual_services_directive("Hola, buenas tardes", bcv_cfg=self.mock_bcv)
        self.assertEqual(directive, "")

        dir_system = format_margaret_system_directive({"found": False}, msg_text="Hola buenas tardes", bcv_cfg=self.mock_bcv)
        self.assertNotIn("TARIFARIO OFICIAL VIGENTE", dir_system)

    def test_02_grooming_inquiry_injects_grooming_prices_from_db(self):
        """Verifica que una consulta de grooming traiga servicios de peluquería/spa con cálculo USD y Bs."""
        directive = get_contextual_services_directive("¿Cuánto cuesta el baño y corte de pelo para mi perrita?", bcv_cfg=self.mock_bcv)
        self.assertIn("TARIFARIO OFICIAL VIGENTE", directive)
        self.assertIn("Tasa oficial BCV del día (26/11/2026): 925.50 Bs/USD", directive)
        self.assertIn("Circuito Grooming Spa", directive)
        self.assertIn("REGLA ESTRICTA DE PRECIOS", directive)

    def test_03_clinica_inquiry_injects_clinica_services(self):
        """Verifica que una consulta veterinaria traiga consulta y vacunación con fecha BCV."""
        directive = get_contextual_services_directive("Deseo saber el costo de una consulta médica veterinaria y vacunas", bcv_cfg=self.mock_bcv)
        self.assertIn("TARIFARIO OFICIAL VIGENTE", directive)
        self.assertIn("Consulta Veterinaria", directive)
        self.assertIn("26/11/2026", directive)

    def test_04_hotel_inquiry_injects_hotel_services(self):
        """Verifica que una consulta de hotel traiga suites y tarifas por noche."""
        directive = get_contextual_services_directive("¿Cuánto cobran por noche en las suites de hotel para consentidos?", bcv_cfg=self.mock_bcv)
        self.assertIn("TARIFARIO OFICIAL VIGENTE", directive)
        self.assertIn("Hotel Suite", directive)

    def test_05_database_failure_resilience_fallback(self):
        """Verifica que si la BD de tarifas falla, se inyecte directiva estricta de no inventar precios."""
        with patch("db.q", side_effect=Exception("Database connection timeout")):
            directive = get_contextual_services_directive("¿Cuánto cuesta el servicio?", bcv_cfg=self.mock_bcv)
            self.assertIn("SISTEMA DE TARIFAS TEMPORALMENTE NO DISPONIBLE", directive)
            self.assertIn("No inventes precios ni tarifas", directive)
            self.assertIn("con gusto te confirmaremos el presupuesto exacto", directive)

    def test_06_bcv_cached_data_fallback(self):
        """Verifica que get_bcv_cached_data devuelva siempre tasa y fecha válidas."""
        data = get_bcv_cached_data()
        self.assertTrue(isinstance(data.get("effective_rate"), (int, float)))
        self.assertGreater(data.get("effective_rate"), 100.0)
        self.assertTrue(bool(data.get("last_updated")))

if __name__ == "__main__":
    unittest.main()
