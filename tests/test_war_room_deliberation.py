#!/usr/bin/env python3
"""
Pruebas de Aceptación para la Deliberación Canónica IA ↔ IA (Fase 1)
Especificación de Dirección General & Charly (Versión 2.0 - 21/11/2026).
"""

import os
import sys
import json
import unittest

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(DIRECTORY)
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

import db
from warRoomEngine import WarRoomEngine
from warRoomDeliberation import (
    deliberation_manager,
    parse_antigravity_counterproposal,
    format_final_recommendation,
    STATE_EN_CURSO,
    STATE_SIN_OBJECION,
    STATE_OBJECION_ABIERTA,
    STATE_SIN_RESPUESTA,
    STATE_CERRADO,
    STATE_COMPLETADO,
    DELIBERATION_SPREADSHEET_ID
)


class TestWarRoomDeliberationFase1(unittest.TestCase):
    def setUp(self):
        db.init_schema()
        self.engine = WarRoomEngine()

    def test_01_parse_counterproposal_sin_objecion(self):
        """Verifica que un dictamen conforme o sin objeción se clasifique como SIN_OBJECIÓN."""
        text = "ESTADO: SIN_OBJECIÓN\nHe revisado la propuesta de Charly y no presenta riesgos."
        res = parse_antigravity_counterproposal(text)
        self.assertEqual(res["estado"], STATE_SIN_OBJECION)
        self.assertEqual(res["que_objeto"], "")

    def test_02_parse_counterproposal_con_objecion(self):
        """Verifica que una discrepancia técnica sustantiva se clasifique como OBJECIÓN_ABIERTA."""
        text = (
            "QUÉ ACEPTO: La migración del endpoint\n"
            "QUÉ OBJETO: El timeout de 5s es insuficiente para redes móviles en Maracaibo\n"
            "QUÉ FALTA: Confirmar latencia con proveedor Digitel\n"
            "RIESGO ASUMIDO: Reintentos en cola de webhook\n"
            "CÓMO REVERTIR: Restaurar timeout a 12s\n"
            "ESTADO: OBJECIÓN_ABIERTA"
        )
        res = parse_antigravity_counterproposal(text)
        self.assertEqual(res["estado"], STATE_OBJECION_ABIERTA)
        self.assertIn("timeout de 5s", res["que_objeto"])
        self.assertIn("La migración del endpoint", res["que_acepto"])

    def test_03_deliberation_cycle_1_round_acceptance(self):
        """Criterio de Aceptación: Ciclo completo de 1 ronda (T0 GEO -> T1 Charly -> T2 AntiGravity -> Cierre)."""
        res = self.engine.process_chat(
            sender="Mrs. PETS CORP",
            role="Dirección General",
            message="Validemos la sincronización de reservas de peluquería para fin de año.",
            channel_id="deliberacion",
            sender_id="mrspets",
            rounds=1
        )
        self.assertEqual(res["status"], "success")
        responses = res.get("responses", [])
        self.assertGreaterEqual(len(responses), 2)

        # Verificar que el ciclo se haya registrado en base de datos
        status = deliberation_manager.get_cycle_status()
        self.assertTrue(status["active"])
        self.assertEqual(status["sealed_rounds"], 1)
        self.assertIn(status["estado"], [STATE_SIN_OBJECION, STATE_OBJECION_ABIERTA, STATE_COMPLETADO])
        self.assertEqual(status["max_turnos"], 2)

        # Consultar la BD directamente
        cycle_db = db.q("SELECT * FROM war_room_cycles WHERE run_id = %s" if db.IS_POSTGRES else "SELECT * FROM war_room_cycles WHERE run_id = ?", (status["run_id"],), one=True)
        self.assertIsNotNone(cycle_db)
        self.assertEqual(cycle_db["rounds"], 1)

        # Consultar los turnos en BD (idempotencia y unicidad)
        turns_db = db.q("SELECT * FROM war_room_turns WHERE run_id = %s ORDER BY turno ASC" if db.IS_POSTGRES else "SELECT * FROM war_room_turns WHERE run_id = ? ORDER BY turno ASC", (status["run_id"],))
        self.assertGreaterEqual(len(turns_db), 2)
        turn_indices = [t["turno"] for t in turns_db]
        self.assertIn(0, turn_indices) # GEO T0
        self.assertIn(1, turn_indices) # Charly T1

    def test_04_deliberation_cycle_2_rounds_acceptance(self):
        """Criterio de Aceptación: Ciclo completo de 2 rondas con selector sellado."""
        res = self.engine.process_chat(
            sender="Mrs. PETS CORP",
            role="Dirección General",
            message="Revisemos arquitectura crítica de redundancia en caso de caída de fibra óptica.",
            channel_id="deliberacion",
            sender_id="mrspets",
            rounds=2
        )
        self.assertEqual(res["status"], "success")
        status = deliberation_manager.get_cycle_status()
        self.assertEqual(status["sealed_rounds"], 2)
        self.assertEqual(status["max_turnos"], 4)

    def test_05_idempotent_sheet_recording(self):
        """Verifica que grabar dos veces el mismo turno sobreescriba en vez de duplicar."""
        run_id = "CYC-TEST-IDEMPOTENT"
        deliberation_manager.get_or_create_cycle(run_id, "Test Idempotencia", rounds=1)
        deliberation_manager.record_turn(run_id, 1, "Charly", "Propuesta 1", estado=STATE_EN_CURSO)
        deliberation_manager.record_turn(run_id, 1, "Charly", "Propuesta 1 Corregida", estado=STATE_EN_CURSO)

        turns = db.q("SELECT * FROM war_room_turns WHERE run_id = %s AND turno = 1" if db.IS_POSTGRES else "SELECT * FROM war_room_turns WHERE run_id = ? AND turno = 1", (run_id,))
        self.assertEqual(len(turns), 1, "No debe haber filas duplicadas para el mismo (run_id, turno)")
        self.assertEqual(turns[0]["contenido"], "Propuesta 1 Corregida")
        deliberation_manager.close_cycle(run_id, recomendacion="Test cerrado", estado_final=STATE_COMPLETADO)

    def test_06_independent_channels_unaffected(self):
        """Verifica que los canales independientes no sean interferidos por la deliberación de la sala común."""
        # Charly directo en su canal
        res_charly = self.engine.process_chat(
            sender="Mrs. PETS CORP",
            role="Dirección General",
            message="Charly directo: verifica el inventario",
            channel_id="channel_mrspets",
            target_node_id="super_agent",
            sender_id="mrspets"
        )
        self.assertEqual(res_charly["status"], "success")
        senders = [r.get("sender_id") for r in res_charly.get("responses", [])]
        self.assertIn("super_agent", senders)
        self.assertNotIn("deliberacion", res_charly.get("node_id", ""))

        # AntiGravity directo en su canal
        res_ag = self.engine.process_chat(
            sender="Mrs. PETS CORP",
            role="Dirección General",
            message="AntiGravity directo: verifica estado de FastAPI",
            channel_id="channel_mrspets",
            target_node_id="antigravity",
            sender_id="mrspets"
        )
        self.assertEqual(res_ag["status"], "success")
        senders_ag = [r.get("sender_id") for r in res_ag.get("responses", [])]
        self.assertIn("antigravity", senders_ag)

    def test_07_deliberation_default_1_round_and_unsealed_post_cycle(self):
        """Verifica que sin parámetro rounds el default sea estrictamente 1 ronda y quede desbloqueado al cerrar."""
        res = self.engine.process_chat(
            sender="Mrs. PETS CORP",
            role="Dirección General",
            message="Planificación de guardias veterinarias fin de semana.",
            channel_id="deliberacion",
            sender_id="mrspets"
        )
        self.assertEqual(res["status"], "success")
        self.assertIn("deliberation", res)
        delib = res["deliberation"]
        self.assertIsNotNone(delib)
        self.assertEqual(delib["sealed_rounds"], 1)
        self.assertEqual(delib["max_turnos"], 2)
        self.assertFalse(delib["in_progress"], "Al concluir el ciclo, in_progress debe ser False para desellar botones")
        self.assertIn(delib["estado"], [STATE_SIN_OBJECION, STATE_OBJECION_ABIERTA, STATE_COMPLETADO])
        
        # Verificar que no se generaron turnos 3 ni 4
        turns = [r.get("deliberation_turn") for r in res.get("responses", []) if r.get("deliberation_turn")]
        self.assertNotIn(3, turns, "No debe generarse Turno 3 cuando rounds es 1")
        self.assertNotIn(4, turns, "No debe generarse Turno 4 cuando rounds es 1")


if __name__ == "__main__":
    unittest.main()
