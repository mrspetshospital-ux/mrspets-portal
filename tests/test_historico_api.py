#!/usr/bin/env python3
"""
Pruebas de Integración y Mocks para HistoricoConsultasService
Mrs. Pets Maracaibo • Big & Little Dogs, C.A.
"""

import sys
import os
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from historicoSheetsService import (
    HistoricoConsultasService,
    historico_service,
    TARGET_SPREADSHEET_ID,
    TARGET_TAB_NAME,
    FORBIDDEN_VOLTURI_SPREADSHEET_ID
)

class TestHistoricoServiceIntegration(unittest.TestCase):
    def setUp(self):
        self.service = HistoricoConsultasService()

    def test_fetch_via_sheet_export_mock_success(self):
        """Simula una respuesta CSV exitosa de Google Sheets con las 7 columnas."""
        mock_csv = (
            "fecha,solicitante,agente,consulta,respuesta,estado,fecha_respuesta\n"
            "2026-11-24 13:21,Dalybell,Mike,Consulta de turno,Turno asignado,respondido,2026-11-24 13:25\n"
            "2026-11-24 13:30,Presidencia,Super Agent,Estatus financiero,NO DISPONIBLE,respondido,2026-11-24 13:35\n"
            "2026-11-24 14:00,Cliente VIP,Margarette,Solicitud de grooming,,pendiente,\n"
        ).encode("utf-8")

        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = mock_csv
        mock_resp.__enter__.return_value = mock_resp

        with patch("urllib.request.urlopen", return_value=mock_resp):
            data = self.service.fetch_from_google_sheets()
            self.assertTrue(data["success"])
            self.assertEqual(data["stats"]["total"], 3)
            self.assertEqual(data["stats"]["respondidos"], 2)
            self.assertEqual(data["stats"]["pendientes"], 1)
            self.assertEqual(data["stats"]["no_disponible_count"], 1)
            self.assertEqual(data["consultas"][0]["fecha"], "2026-11-24 14:00")
            self.assertEqual(data["consultas"][0]["estado"], "pendiente")

    def test_fetch_when_sheet_is_private_403(self):
        """Verifica que cuando el Google Sheet responde 403 Forbidden, se retorne un error claro y sin romper."""
        import urllib.error
        he = urllib.error.HTTPError(
            url="https://docs.google.com/spreadsheets/d/1xk2qKLeXxodPZqid2xilGXv9zAJdyM1SfQ8mY6lB4LE/gviz/tq",
            code=403,
            msg="Forbidden",
            hdrs={},
            fp=None
        )

        with patch("urllib.request.urlopen", side_effect=he):
            data = self.service.fetch_from_google_sheets()
            self.assertFalse(data["success"])
            self.assertEqual(data["error"], "ACCESO_DENEGADO_GOOGLE_SHEETS")
            self.assertEqual(data["http_code"], 403)
            self.assertIn("mrspetshospital@gmail.com", data["owner"])
            self.assertIn("instructions", data)
            self.assertEqual(len(data["consultas"]), 0)

    def test_static_html_file_exists(self):
        """Verifica que el archivo historico.html exista en static/."""
        static_html = os.path.join(
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
            "static",
            "historico.html"
        )
        self.assertTrue(os.path.exists(static_html))
        with open(static_html, "r", encoding="utf-8") as f:
            content = f.read()
            self.assertIn("1xk2qKLeXxodPZqid2xilGXv9zAJdyM1SfQ8mY6lB4LE", content)
            self.assertIn("Histórico", content)
            self.assertIn("NO DISPONIBLE", content)

    def test_startup_critical_env_validator(self):
        """Verifica que la función de validación de variables críticas se ejecute sin excepciones."""
        from server import validate_startup_critical_env
        validate_startup_critical_env()

if __name__ == "__main__":
    unittest.main()
