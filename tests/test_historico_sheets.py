#!/usr/bin/env python3
"""
Pruebas Unitarias para HistoricoConsultasService (Portal del Histórico de Consultas)
Mrs. Pets Maracaibo • Big & Little Dogs, C.A.
"""

import unittest
from historicoSheetsService import (
    HistoricoConsultasService,
    TARGET_SPREADSHEET_ID,
    TARGET_TAB_NAME,
    FORBIDDEN_VOLTURI_SPREADSHEET_ID
)

class TestHistoricoConsultasService(unittest.TestCase):
    def setUp(self):
        self.service = HistoricoConsultasService()

    def test_security_isolation_forbidden_volturi_sheet(self):
        """Verifica que el libro del Comité Volturi sea estrictamente rechazado."""
        with self.assertRaises(PermissionError):
            HistoricoConsultasService(spreadsheet_id=FORBIDDEN_VOLTURI_SPREADSHEET_ID)

        with self.assertRaises(PermissionError):
            self.service.validate_spreadsheet_target(FORBIDDEN_VOLTURI_SPREADSHEET_ID, TARGET_TAB_NAME)

    def test_security_isolation_unknown_spreadsheet(self):
        """Verifica que solo se permita el Spreadsheet ID autorizado."""
        with self.assertRaises(ValueError):
            HistoricoConsultasService(spreadsheet_id="otra_hoja_no_autorizada_12345")

    def test_strict_tab_name_accent_required(self):
        """Verifica que la pestaña 'Historico' sin tilde sea rechazada con error explícito."""
        with self.assertRaises(ValueError):
            HistoricoConsultasService(tab_name="Historico")

        with self.assertRaises(ValueError):
            self.service.validate_spreadsheet_target(TARGET_SPREADSHEET_ID, "Historico")

        with self.assertRaises(ValueError):
            self.service.validate_spreadsheet_target(TARGET_SPREADSHEET_ID, "Consultas")

    def test_parse_rows_with_valid_matrix(self):
        """Verifica el parseo de una matriz de 7 columnas según especificaciones."""
        raw_matrix = [
            ["fecha", "solicitante", "agente", "consulta", "respuesta", "estado", "fecha_respuesta"],
            ["2026-11-24 10:15", "María Pérez", "Mike", "Horarios de baño", "De 8:00 a 18:00", "respondido", "2026-11-24 10:20"],
            ["2026-11-24 11:30", "Carlos Ruiz", "Valeria", "Cita para ecografía", "NO DISPONIBLE", "respondido", "2026-11-24 11:35"],
            ["2026-11-24 12:00", "Presidencia", "Super Agent", "Estado de ventas", "", "pendiente", ""]
        ]

        result = self.parse_rows_data = self.service.parse_rows(raw_matrix)
        self.assertTrue(result["success"])
        self.assertEqual(result["stats"]["total"], 3)
        self.assertEqual(result["stats"]["respondidos"], 2)
        self.assertEqual(result["stats"]["pendientes"], 1)
        self.assertEqual(result["stats"]["no_disponible_count"], 1)

        consultas = result["consultas"]
        # Debe estar ordenado por fecha descendente (12:00, 11:30, 10:15)
        self.assertEqual(consultas[0]["fecha"], "2026-11-24 12:00")
        self.assertEqual(consultas[0]["agente"], "Super Agent")
        self.assertEqual(consultas[0]["estado"], "pendiente")
        self.assertEqual(consultas[0]["fecha_respuesta"], "—")

        self.assertEqual(consultas[1]["fecha"], "2026-11-24 11:30")
        self.assertEqual(consultas[1]["agente"], "Valeria")
        self.assertTrue(consultas[1]["is_no_disponible"])

        self.assertEqual(consultas[2]["fecha"], "2026-11-24 10:15")
        self.assertEqual(consultas[2]["agente"], "Mike")
        self.assertFalse(consultas[2]["is_no_disponible"])

    def test_date_formatting_and_empty_values(self):
        """Verifica que fechas vacías o malformadas se representen como '—' sin romper."""
        self.assertEqual(self.service._normalize_date_string(""), "—")
        self.assertEqual(self.service._normalize_date_string(None), "—")
        self.assertEqual(self.service._normalize_date_string("2026-11-24 13:21"), "2026-11-24 13:21")

    def test_unknown_status_handling(self):
        """Verifica que estados no estándar no rompan y se marquen como desconocidos."""
        norm, unknown = self.service._normalize_status("en_revision")
        self.assertEqual(norm, "en_revision")
        self.assertTrue(unknown)

        norm_ok, unknown_ok = self.service._normalize_status("respondido")
        self.assertEqual(norm_ok, "respondido")
        self.assertFalse(unknown_ok)

    def test_empty_sheet_handling(self):
        """Verifica el estado vacío explícito si el libro no tiene filas de datos."""
        res = self.service.parse_rows([])
        self.assertTrue(res["empty_state"])
        self.assertEqual(res["empty_message"], "Aún no hay consultas registradas")
        self.assertEqual(res["stats"]["total"], 0)

if __name__ == "__main__":
    unittest.main()
