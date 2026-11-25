#!/usr/bin/env python3
"""
Prueba de integración REAL del flujo diferido, con uvicorn levantado.

Simula Teamily (202 + poll_url) y comprueba, contra el servidor HTTP real:
  1. POST /api/v1/teamily/agent-chat responde rápido (< 10 s) con
     status='running' y run_token (NO espera los 163 s del run).
  2. GET /api/v1/teamily/run/{token} devuelve 'running' mientras vive.
  3. Al cerrar el run, el mismo endpoint devuelve el TEXTO del agente.
  4. El texto llega íntegro (no un acuse de recibo).

Uso: python tests/e2e_run_diferido.py
"""
import json
import os
import sys
import threading
import time
import urllib.request
import urllib.error

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

BASE = os.environ.get("E2E_BASE", "http://127.0.0.1:8099")
TEXTO_AGENTE = (
    "Mike: Reporte de operaciones — tanques Don Bosco al 78%, planta Cummins "
    "sin novedad, batería de 4 tanques Tuya estable. Sin incidencias en sucursal."
)


def _get(path, timeout=15):
    req = urllib.request.Request(BASE + path, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as he:
        return he.code, json.loads(he.read().decode("utf-8"))


def _post(path, payload, timeout=30):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE + path, data=data, method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as he:
        return he.code, json.loads(he.read().decode("utf-8"))


def main():
    print("=" * 70)
    print("E2E — RUN DIFERIDO (Teamily simulado, servidor real)")
    print("=" * 70)

    # 1. Enviar mensaje como lo haría la usuaria desde el panel de Mike
    t0 = time.time()
    status, body = _post("/api/v1/teamily/agent-chat", {
        "message": "Mike, ¿cómo están los tanques y la planta hoy?",
        "sender_user_id": "1283666967744922",
        "recipient_user_id": "9000215760376233",
        "channel_type": "direct_1a1",
        "agent_id": "mike",
        "agent_slug": "mike",
        "agent_name": "Mike Gerente de Operaciones",
        "endpoint_override": "https://teamily.ai/v1/chat",
    })
    elapsed = time.time() - t0

    print(f"\n[1] POST /api/v1/teamily/agent-chat")
    print(f"    HTTP {status} en {elapsed:.2f}s")
    print(f"    status={body.get('status')!r}  run_token={body.get('run_token')!r}")
    print(f"    hilo={body.get('hilo')!r}")

    ok1 = status == 200 and body.get("status") == "running" and body.get("run_token")
    print(f"    {'✅' if ok1 else '❌'} responde rápido con run_token (no espera el run)")
    ok_fast = elapsed < 10.0
    print(f"    {'✅' if ok_fast else '❌'} latencia {elapsed:.2f}s < 10s (no bloquea)")

    token = body.get("run_token")
    if not token:
        print("\n❌ Sin run_token: no se puede continuar.")
        return 1

    # 2. Sondear mientras el run vive
    print(f"\n[2] GET /api/v1/teamily/run/{token[:16]}… (mientras vive)")
    st2, b2 = _get(f"/api/v1/teamily/run/{token}")
    print(f"    HTTP {st2}  status={b2.get('status')!r}  polls={b2.get('polls')}")
    ok2 = st2 == 200 and b2.get("status") == "running"
    print(f"    {'✅' if ok2 else '❌'} devuelve 'running'")

    # 3. Esperar a que el run cierre (el simulador tarda ~6 s)
    print(f"\n[3] Sondear hasta que cierre…")
    final = None
    for i in range(30):
        time.sleep(2)
        st3, b3 = _get(f"/api/v1/teamily/run/{token}")
        print(f"    t+{(i+1)*2:>2}s  HTTP {st3}  status={b3.get('status')!r}")
        if b3.get("status") != "running":
            final = (st3, b3)
            break

    if not final:
        print("\n❌ El run no cerró en 60 s.")
        return 1

    st3, b3 = final
    texto = b3.get("reply") or b3.get("response_text") or ""
    print(f"\n[4] Resultado final")
    print(f"    HTTP {st3}  status={b3.get('status')!r}")
    print(f"    texto ({len(texto)} car.): {texto[:120]}…")

    ok3 = st3 == 200 and b3.get("status") == "success"
    ok4 = TEXTO_AGENTE[:60] in texto
    print(f"    {'✅' if ok3 else '❌'} status 'success'")
    print(f"    {'✅' if ok4 else '❌'} el texto es el del AGENTE, no un acuse")

    print("\n" + "=" * 70)
    todo = all([ok1, ok_fast, ok2, ok3, ok4])
    print("RESULTADO:", "✅ TODO OK" if todo else "❌ HAY FALLOS")
    print("=" * 70)
    return 0 if todo else 1


if __name__ == "__main__":
    sys.exit(main())
