#!/usr/bin/env python3
"""
Arnés de prueba: levanta el portal real con Teamily SIMULADO.

Simula el comportamiento verificado en producción:
  - POST /v1/chat  -> HTTP 202 {status: running, run_id, poll_url} en ~1 s
  - GET  poll_url  -> 'running' durante ~6 s, luego 'completed' con el texto

Así se prueba el flujo diferido completo sin depender de Teamily ni de
credenciales, y sin esperar los 163 s reales.

Uso: python tests/harness_run_diferido.py
"""
import json
import os
import sys
import threading
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

TEXTO_AGENTE = (
    "Mike: Reporte de operaciones — tanques Don Bosco al 78%, planta Cummins "
    "sin novedad, batería de 4 tanques Tuya estable. Sin incidencias en sucursal."
)

# Estado del run simulado
_RUN = {"inicio": None, "cerrado": False}


def _simular_teamily():
    """Parchea el cliente de Teamily para devolver 202 + poll_url."""
    import teamilyClient

    def fake_send_direct_message(self, request, endpoint_override=None,
                                 server_key_override=None, defer_poll=False):
        _RUN["inicio"] = time.time()
        _RUN["cerrado"] = False
        return teamilyClient.TeamilyGeoAResponse(
            status_code=202,
            success=True,
            response_text="",
            data={
                "status": "running",
                "run_id": "run-simulado-001",
                "poll_url": "https://teamily.ai/v1/runs/run-simulado-001",
            },
            raw_body="",
            latency_ms=900.0,
            error=None,
            endpoint="https://teamily.ai/v1/chat",
            board_id="",
        )

    def fake_send_message(self, request, endpoint_override=None,
                          server_key_override=None, defer_poll=False):
        return fake_send_direct_message(self, request, endpoint_override,
                                        server_key_override, defer_poll)

    def fake_poll_run(self, poll_url, server_key=None, timeout=20.0):
        inicio = _RUN.get("inicio") or time.time()
        transcurrido = time.time() - inicio
        if transcurrido < 6.0:
            return 200, {"status": "running", "run_id": "run-simulado-001"}
        _RUN["cerrado"] = True
        return 200, {
            "status": "completed",
            "run_id": "run-simulado-001",
            "output": {"text": TEXTO_AGENTE},
        }

    teamilyClient.TeamilyGeoAClient.send_direct_message = fake_send_direct_message
    teamilyClient.TeamilyGeoAClient.send_message = fake_send_message
    teamilyClient.TeamilyGeoAClient.poll_run = fake_poll_run
    # El singleton ya está instanciado: parchear la clase basta porque los
    # métodos se resuelven en la clase, no en la instancia.
    print("[HARNESS] Teamily simulado: 202 + poll_url, cierre a los 6 s")


if __name__ == "__main__":
    _simular_teamily()
    import uvicorn
    import server

    # Acelerar el sondeo para la prueba
    server._TEAMILY_RUN_INTERVAL_SEC = 1.0
    print("[HARNESS] Levantando portal en 127.0.0.1:8099")
    uvicorn.run(server.app, host="127.0.0.1", port=8099, log_level="warning")
