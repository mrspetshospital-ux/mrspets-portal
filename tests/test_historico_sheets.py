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

    def test_strict_tab_name_accent_required_zero_fallbacks(self):
        """Verifica que la pestaña 'Historico' sin tilde sea rechazada con error explícito y cero fallbacks."""
        with self.assertRaises(ValueError):
            HistoricoConsultasService(tab_name="Historico")

        with self.assertRaises(ValueError):
            self.service.validate_spreadsheet_target(TARGET_SPREADSHEET_ID, "Historico")

        with self.assertRaises(ValueError):
            self.service.validate_spreadsheet_target(TARGET_SPREADSHEET_ID, "Historico_2")

        with self.assertRaises(ValueError):
            self.service.validate_spreadsheet_target(TARGET_SPREADSHEET_ID, "Reglas")

        with self.assertRaises(ValueError):
            self.service.validate_spreadsheet_target(TARGET_SPREADSHEET_ID, "Ciclos")

    def test_dynamic_header_mapping_with_hilo_column(self):
        """
        Verifica que el mapeo dinámico por encabezado funcione correctamente
        incluso si las columnas vienen en diferente orden y se incluye la columna 'hilo'.
        """
        raw_matrix_custom_order = [
            # Encabezados desordenados: hilo al inicio, respuesta antes de consulta
            ["hilo", "fecha", "solicitante", "agente", "respuesta", "consulta", "estado", "fecha_respuesta"],
            ["#HILO-901", "2026-11-24 10:15", "María Pérez", "Mike", "De 8:00 a 18:00", "Horarios de baño", "respondido", "2026-11-24 10:20"],
            ["#HILO-902", "2026-11-24 11:30", "Carlos Ruiz", "Valeria", "NO DISPONIBLE", "Cita para ecografía", "respondido", "2026-11-24 11:35"],
            ["#HILO-903", "2026-11-24 12:00", "Presidencia", "Super Agent", "", "Estado de ventas", "pendiente", ""]
        ]

        result = self.service.parse_rows(raw_matrix_custom_order)
        self.assertTrue(result["success"])
        self.assertEqual(result["stats"]["total"], 3)
        self.assertEqual(result["stats"]["respondidos"], 2)
        self.assertEqual(result["stats"]["pendientes"], 1)
        self.assertEqual(result["stats"]["no_disponible_count"], 1)

        consultas = result["consultas"]
        # Fila 1 (más reciente: 12:00)
        self.assertEqual(consultas[0]["fecha"], "2026-11-24 12:00")
        self.assertEqual(consultas[0]["hilo"], "#HILO-903")
        self.assertEqual(consultas[0]["agente"], "Super Agent")
        self.assertEqual(consultas[0]["consulta"], "Estado de ventas")
        self.assertEqual(consultas[0]["estado"], "pendiente")

        # Fila 2 (11:30)
        self.assertEqual(consultas[1]["fecha"], "2026-11-24 11:30")
        self.assertEqual(consultas[1]["hilo"], "#HILO-902")
        self.assertEqual(consultas[1]["agente"], "Valeria")
        self.assertEqual(consultas[1]["consulta"], "Cita para ecografía")
        self.assertEqual(consultas[1]["respuesta"], "NO DISPONIBLE")
        self.assertTrue(consultas[1]["is_no_disponible"])

        # Fila 3 (10:15)
        self.assertEqual(consultas[2]["fecha"], "2026-11-24 10:15")
        self.assertEqual(consultas[2]["hilo"], "#HILO-901")
        self.assertEqual(consultas[2]["agente"], "Mike")
        self.assertEqual(consultas[2]["consulta"], "Horarios de baño")
        self.assertEqual(consultas[2]["respuesta"], "De 8:00 a 18:00")

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
