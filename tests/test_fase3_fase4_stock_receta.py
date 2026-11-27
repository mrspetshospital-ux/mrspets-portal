#!/usr/bin/env python3
"""
Pruebas de la Fase 3 (Stock con Reserva y Confirmación en Piso)
y Fase 4 (Venta Cruzada Ética y Farmacia con Récipe Médico Obligatorio)
Mrs. Pets • Big & Little Dogs, C.A.
"""

import sys
import os
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from receptionBridge import (
    get_contextual_products_directive,
    format_margaret_system_directive
)


class TestFase3Fase4StockReceta(unittest.TestCase):
    def setUp(self):
        self.mock_bcv = {
            "effective_rate": 925.50,
            "manual_rate": 925.50,
            "last_updated": "2026-11-26T16:00:00Z",
            "source": "Banco Central de Venezuela (BCV Oficial)"
        }

    def test_01_no_product_inquiry_injects_zero_tokens(self):
        """Verifica que mensajes sin intención de compra/productos no inyecten directiva de inventario (0 tokens overhead)."""
        directive = get_contextual_products_directive("Hola, quisiera agendar una cita", bcv_cfg=self.mock_bcv)
        self.assertEqual(directive, "")

    def test_02_product_inquiry_checks_stock_and_adds_floor_confirmation_clause(self):
        """FASE 3: Verifica que al consultar productos con stock > 0 se agregue la cláusula obligatoria de confirmación en piso."""
        directive = get_contextual_products_directive("¿Tienen alimento Royal Canin disponible y cuál es el precio?", bcv_cfg=self.mock_bcv)
        self.assertIn("INVENTARIO OFICIAL Y POLÍTICA DE FARMACIA", directive)
        self.assertIn("Royal Canin Mini Adult", directive)
        self.assertIn("En inventario: 15 unid.", directive)
        self.assertIn("FASE 3 (REGLA ESTRICTA DE STOCK)", directive)
        self.assertIn("Disponible al momento de la consulta, sujeto a confirmación de stock en piso", directive)

    def test_03_out_of_stock_product_flagged_as_exhausted(self):
        """FASE 3: Verifica que productos con stock <= 0 sean señalados como AGOTADOS para evitar promesas falsas."""
        mock_db_prods = [
            {"id": 10, "codigo": "PROD-200", "nombre": "Snacks Dentales Premium", "categoria": "Boutique", "precio_usd": 8.0, "stock": 0}
        ]
        with patch("db.q", return_value=mock_db_prods):
            directive = get_contextual_products_directive("¿Tienen snacks dentales?", bcv_cfg=self.mock_bcv)
            self.assertIn("AGOTADO (Stock: 0)", directive)
            self.assertIn("No prometer disponibilidad inmediata", directive)

    def test_04_pharmacy_products_require_prescription(self):
        """FASE 4: Verifica que productos de Farmacia (Bravecto, pipetas, etc.) exijan récipe médico veterinario."""
        directive = get_contextual_products_directive("¿Tienen pastillas Bravecto para pulgas y garrapatas?", bcv_cfg=self.mock_bcv)
        self.assertIn("Bravecto Perros", directive)
        self.assertIn("[REQUIERE RÉCIPE MÉDICO]", directive)
        self.assertIn("FASE 4 (REGLA DE FARMACIA Y RÉCIPE)", directive)
        self.assertIn("NO se ofrecen en venta cruzada libre ni se despachan sin indicación veterinaria", directive)
        self.assertIn("evaluación clínica previa o récipe vigente", directive)

    def test_05_ethical_cross_selling_rule_in_system_directive(self):
        """FASE 4: Verifica que la directiva del sistema prohíba la venta cruzada casual de medicamentos."""
        directive = format_margaret_system_directive({"found": True, "verified_by_phone": True, "tutor": {"nombre": "Ana"}}, msg_text="Quiero un baño")
        self.assertIn("REGLA ÉTICA DE VENTA CRUZADA (CROSS-SELLING)", directive)
        self.assertIn("PROHIBIDO sugerir medicamentos, antiparasitarios, pipetas, Bravecto ni champú medicado como venta cruzada casual", directive)
        self.assertIn("la medicación requiere siempre indicación médica veterinaria", directive)

    def test_06_database_failure_resilience_products(self):
        """Verifica la resiliencia en caso de fallo en la base de datos de productos (sin alucinar existencias)."""
        with patch("db.q", side_effect=Exception("Database timeout")):
            directive = get_contextual_products_directive("¿Venden champú?", bcv_cfg=self.mock_bcv)
            self.assertIn("INVENTARIO DE PRODUCTOS TEMPORALMENTE NO DISPONIBLE", directive)
            self.assertIn("No inventes existencias ni precios", directive)


if __name__ == "__main__":
    unittest.main()
