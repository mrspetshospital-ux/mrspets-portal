#!/usr/bin/env python3
"""
Test Suite: Margaret / Margarette Avatar Web Connection & Receptionist Flow
Verifica los 10 criterios de la revisión técnica:
1. Identidad de Margaret/Margarette correcta sin hardcoding cruzado a Leia.
2. Conservación del flujo de botones (agenda, grooming, clínica, hotel, tienda, admin y texto libre).
3. Rol de recepcionista con orientación de los 4 servicios, horarios (8am-6pm) y Tasa BCV.
4. Aislamiento estricto de identidades Margaret (👩‍💼) vs Leia (🎀).
5. Despacho hacia Teamily y método ask_margaret con board_id oficial.
6. Manejo transparente sin respuestas simuladas ni confirmaciones falsas.
"""

import sys
import os
import unittest
import json

# Agregar rutas locales
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, "/Users/dalybellramirezmontilla/.gemini/antigravity/scratch/mrspets-portal-repo")

from centralitaRouter import centralita_router, AGENT_REGISTRY
from teamilyClient import teamily_geo_a_client, TeamilyGeoARequest

class TestAvatarMargaret(unittest.TestCase):

    def test_01_margaret_resolution_variants(self):
        """Verifica que 'margaret', 'margarette', 'atencion' y '@margaret' se resuelvan hacia Margaret."""
        variants = ["margaret", "margarette", "atencion", "atención", "recepcion", "recepción"]
        for v in variants:
            slug, name = centralita_router.resolve_target_agent("hola", requested_slug=v)
            self.assertEqual(slug, "margaret", f"Variante '{v}' debe resolver hacia slug 'margaret'")
            self.assertIn("Margaret", name)

        # Mención explícita en texto
        slug_txt1, _ = centralita_router.resolve_target_agent("Por favor @margaret ayúdame")
        self.assertEqual(slug_txt1, "margaret")

        slug_txt2, _ = centralita_router.resolve_target_agent("Hola margarette deseo información")
        self.assertEqual(slug_txt2, "margaret")

    def test_02_margaret_receptionist_service_orientation(self):
        """Verifica que Margaret oriente como recepcionista en los 4 servicios y horarios oficiales."""
        # Consulta de Reservas / Turnos
        resp_reserva = centralita_router.synthesize_agent_response("margaret", "Margaret", "Deseo hacer una reserva para mañana")
        self.assertIn("Margaret", resp_reserva)
        self.assertIn("Grooming Spa", resp_reserva)
        self.assertIn("Clínica", resp_reserva)
        self.assertIn("Hotel", resp_reserva)
        self.assertIn("6:00 p.m.", resp_reserva)
        self.assertIn("Domingos", resp_reserva)

        # Consulta de Grooming Spa y Pulpejos
        resp_grooming = centralita_router.synthesize_agent_response("margaret", "Margaret", "Quiero saber del circuito de grooming y corte")
        self.assertIn("7 Estaciones", resp_grooming)
        self.assertIn("pulpejo", resp_grooming.lower())
        self.assertIn("4 turnos", resp_grooming.lower())

        # Consulta de Tasa BCV y Precios
        resp_tasa = centralita_router.synthesize_agent_response("margaret", "Margaret", "¿Cuál es el precio o tasa bcv de hoy?")
        self.assertIn("Banco Central de Venezuela", resp_tasa)
        self.assertIn("BCV", resp_tasa)

    def test_03_margaret_acting_as_leia_for_clients(self):
        """Verifica que Margarette de Teamily asuma la identidad pública de Leia (🎀) de cara a los clientes."""
        resp = centralita_router.synthesize_agent_response("margaret", "Margaret", "Hola, buenas tardes", context={"persona": "leia"})
        self.assertIn("🎀", resp)
        self.assertIn("Leia", resp)
        self.assertIn("Concierge VIP", resp)
        self.assertIn("Mrs. Pets", resp)

    def test_04_teamily_client_ask_margaret_request(self):
        """Verifica que teamily_geo_a_client disponga de ask_margaret y construya la petición con el board oficial."""
        self.assertIsNotNone(teamily_geo_a_client)
        self.assertTrue(hasattr(teamily_geo_a_client, "ask_margaret"))

        req = TeamilyGeoARequest(
            input="Consulta de recepción para Princesa Motica",
            board_id=teamily_geo_a_client.board_id
        )
        payload = req.to_payload()
        self.assertEqual(payload["board_id"], "5803df5a-7127-4d28-b97c-5c840d47cdc7")
        self.assertIn("Princesa Motica", payload["input"])

    def test_05_reception_escalation_to_administration(self):
        """Verifica que cuando el cliente pide hablar con administración o Talibel, Margaret escale de inmediato."""
        resp_admin = centralita_router.synthesize_agent_response("margaret", "Margaret", "Deseo hablar con Talibel o la Administración")
        self.assertIn("Talibel", resp_admin)
        self.assertIn("Administración", resp_admin)
        self.assertIn("prioridad", resp_admin.lower())

    def test_06_no_fake_confirmation_on_complaints(self):
        """Verifica que ante quejas se abra auditoría formal y no se generen confirmaciones ficticias."""
        resp_queja = centralita_router.synthesize_agent_response("margaret", "Margaret", "Tengo un reclamo por un problema en el servicio")
        self.assertIn("auditoría", resp_queja.lower())
        self.assertIn("expediente", resp_queja.lower())
        self.assertNotIn("serverMsgID", resp_queja)

    def test_07_buenas_noches_reception_greeting(self):
        """Verifica que un saludo simple como 'buenas noches' sea respondido con la identidad pública de Leia pero motor de Margarette."""
        resp = centralita_router.synthesize_agent_response("margaret", "Margaret", "buenas noches", context={"persona": "leia"})
        self.assertIn("Leia", resp)
        self.assertIn("Avenida 2 El Milagro", resp)
        self.assertIn("🎀", resp)

    def test_08_api_endpoints_buenas_noches(self):
        """Verifica que los endpoints HTTP de Teamily y Gemini respondan con Leia de cara al cliente ante 'buenas noches'."""
        try:
            from starlette.testclient import TestClient
            from server import app
            client = TestClient(app)

            # 1. Endpoint Teamily agent-chat
            res_team = client.post("/api/v1/teamily/agent-chat", json={"agent_id": "margaret", "message": "buenas noches"})
            self.assertEqual(res_team.status_code, 200)
            data_team = res_team.json()
            self.assertIn(data_team.get("agent"), ["margaret", "system"])
            reply_team = data_team.get("reply", "")
            self.assertTrue(any(n in reply_team for n in ["Leia", "Margaret", "Margarette", "Mrs. Pets"]), f"Nombre esperado no encontrado en: {reply_team}")

            # 2. Endpoint Leia/Margaret fallback chat
            res_gem = client.post("/api/v1/leia/chat", json={"agent_id": "margaret", "requested_slug": "margaret", "message": "buenas noches"})
            self.assertEqual(res_gem.status_code, 200)
            data_gem = res_gem.json()
            self.assertIn(data_gem.get("agent"), ["margaret", "system"])
            reply_gem = data_gem.get("reply", "")
            self.assertTrue(any(n in reply_gem for n in ["Leia", "Margaret", "Margarette", "Mrs. Pets"]), f"Nombre esperado no encontrado en: {reply_gem}")
        except ImportError:
            pass

    def test_09_db_lookup_and_booking_pipeline(self):
        """Verifica la búsqueda en BD (cliente existente vs nuevo) y la persistencia de reservas."""
        import db
        from receptionBridge import lookup_client_in_mrs_pets_db, format_margaret_system_directive, process_and_persist_booking

        def _cleanup_test_phone():
            try:
                for t in db.q("SELECT id FROM tutores WHERE telefono_norm=%s", ("4149999999",)) or []:
                    for m in db.q("SELECT id FROM mascotas WHERE tutor_id=%s", (t["id"],)) or []:
                        db.execute("DELETE FROM citas WHERE mascota_id=%s", (m["id"],))
                    db.execute("DELETE FROM mascotas WHERE tutor_id=%s", (t["id"],))
                    db.execute("DELETE FROM tutores WHERE id=%s", (t["id"],))
            except Exception:
                pass

        _cleanup_test_phone()
        self.addCleanup(_cleanup_test_phone)

        # 1. Búsqueda de cliente no existente (cliente nuevo)
        new_client = lookup_client_in_mrs_pets_db(text="Hola buenas noches, no tengo ficha previa", phone="04149999999")
        self.assertFalse(new_client["found"])
        dir_new = format_margaret_system_directive(new_client)
        self.assertIn("CLIENTE NUEVO", dir_new)
        self.assertIn("Ficha de Admisión", dir_new)
        self.assertIn("📷 Foto", dir_new)

        # 2. Procesamiento de reserva en modo manual (aprobación staff)
        booking_manual = process_and_persist_booking(
            msg="Deseo agendar cita de grooming para mi perrito Toby mañana a las 10 am, mi telefono es 04146799510 y me llamo Carlos",
            client_info=new_client,
            body={"userName": "Carlos", "petName": "Toby"},
            approval_mode="manual"
        )
        self.assertIsNotNone(booking_manual)
        self.assertIn("PEND-", booking_manual["id"])
        self.assertEqual(booking_manual["status"], "Pendiente por Aprobación Staff")
        self.assertEqual(booking_manual["account_email"], "mrspetshospital@gmail.com")
        self.assertIn("Solicitud de Cita Registrada", booking_manual["confirmation_text"])
        self.assertIn("8:00 - 8:30 a.m.", booking_manual["confirmation_text"])
        self.assertIn("calendar.google.com/calendar/render", booking_manual.get("gcal_url", ""))
        self.assertIn("mrspetshospital@gmail.com", booking_manual.get("gcal_url", ""))
        self.assertIn("Google Calendar", booking_manual["confirmation_text"])

        # 3. Procesamiento de reserva en modo automático
        booking_auto = process_and_persist_booking(
            msg="Quiero una cita de consulta veterinaria para Toby hoy a las 3 pm",
            client_info=new_client,
            body={"userName": "Carlos", "petName": "Toby"},
            approval_mode="auto"
        )
        self.assertIsNotNone(booking_auto)
        self.assertIn("Aprobado por IA Leia 🤖", booking_auto["status"])
        self.assertIn("Reserva Confirmada", booking_auto["confirmation_text"])
        self.assertIn("calendar.google.com/calendar/render", booking_auto.get("gcal_url", ""))
        self.assertIn("mrspetshospital@gmail.com", booking_auto.get("gcal_url", ""))

    def test_10_google_calendar_account_target(self):
        """Verifica que el motor de calendario apunte a mrspetshospital@gmail.com."""
        from calendarEngine import calendar_engine
        self.assertIsNotNone(calendar_engine)
        self.assertEqual(calendar_engine.config.get("google_calendar_id"), "mrspetshospital@gmail.com")
        payload = calendar_engine.build_make_gcal_payload("appointment_created", {
            "id": "APT-TEST-01",
            "pet": "Toby",
            "tutor": "Carlos",
            "service": "Grooming Spa",
            "area": "grooming",
            "date": "2026-11-18",
            "time": "10:00"
        })
        self.assertEqual(payload.get("calendar_id"), "mrspetshospital@gmail.com")
        self.assertEqual(payload.get("account_email"), "mrspetshospital@gmail.com")

    def test_11_dual_avatar_architecture(self):
        """Verifica la arquitectura unificada de avatares: exactamente 1 avatar circular para clientes, y circular + alert search para staff."""
        arch_js_path = os.path.join(os.path.dirname(__file__), "..", "static", "js", "mrsPetsArchitecture.js")
        with open(arch_js_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Avatar Circular Único para Clientes
        self.assertIn("leia-avatar-circular-btn", content)
        self.assertIn("avatar-circular-img", content)

        # 2. Rectangular obsoleto ocultado permanentemente
        self.assertIn("leia-avatar-rectangular-btn", content)
        self.assertIn("display:none !important", content)

        # 3. Conmutador de Roles en updateLeiaRoleControls: circular activo, Alert Search en Staff
        self.assertIn("updateLeiaRoleControls()", content)
        self.assertIn("rectBtn.style.display", content)
        self.assertIn("circBtn.style.display", content)
        self.assertIn("fabSearchBtn", content)
        self.assertIn("isStaffMode()", content)

    def test_15_staff_session_recognition_and_customer_memory(self):
        """Verifica el reconocimiento oficial de Staff sin bloqueos y la memoria de clientes (DB + Sheets)."""
        from server import _startup
        _startup()
        from receptionBridge import lookup_client_in_mrs_pets_db, format_margaret_system_directive

        # 1. Reconocimiento de Staff Oficial
        staff_res = lookup_client_in_mrs_pets_db(is_staff=True, user_name="Sr. Harryt Luzardo (Fundador & Director General)")
        self.assertTrue(staff_res.get("found"))
        self.assertTrue(staff_res.get("is_staff"))
        self.assertIn("Harryt", staff_res.get("staff_name", ""))

        directive_staff = format_margaret_system_directive(staff_res, is_staff=True, staff_user_name="Sr. Harryt Luzardo")
        self.assertIn("DIRECTIVA DE APOYO — MARGARETTE", directive_staff)
        self.assertIn("Sr. Harryt Luzardo", directive_staff)

        # 2. Memoria de Clientes (Sofía Rodríguez)
        sofia_res = lookup_client_in_mrs_pets_db(text="Hola soy Sofía Rodríguez y vengo a consultar por Luna")
        self.assertTrue(sofia_res.get("found"))
        self.assertIn("Sofía", sofia_res["tutor"]["nombre"])
        self.assertTrue(any(m["nombre"] == "Luna" for m in sofia_res.get("mascotas", [])))

    def test_12_avatar_chat_endpoint_and_session_isolation(self):
        """Verifica que POST /api/v1/avatar/chat esté registrado en la app y no devuelva latencia fija de 350ms."""
        # 1. Verificación estática del código fuente
        server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")
        with open(server_path, "r", encoding="utf-8") as f:
            server_src = f.read()
        self.assertIn('@app.post("/api/v1/avatar/chat")', server_src)
        self.assertIn('@app.post("/api/v1/teamily/agent-chat")', server_src)
        self.assertNotIn('"model_used": "teamly-orchestrator"', server_src, "No debe existir el mock literal teamly-orchestrator con 350ms")

        # 2. Verificación dinámica si fastapi/starlette están disponibles
        try:
            from starlette.testclient import TestClient
            from server import app
            route_paths = [getattr(r, "path", None) for r in app.routes]
            self.assertIn("/api/v1/avatar/chat", route_paths)

            client = TestClient(app)
            sess_id = "test_sess_isolated_99"
            res = client.post("/api/v1/avatar/chat", json={
                "agent_id": "margaret",
                "message": "¿Cuáles son los horarios de atención y el servicio de spa?",
                "sessionId": sess_id,
                "timeoutSeconds": 5.0
            })
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data.get("status"), "success")
            self.assertTrue(bool(data.get("reply")))
            self.assertNotEqual(data.get("latency_ms"), 350)
            self.assertEqual(data.get("session_id"), sess_id)
            self.assertIn(data.get("agent"), ["margaret", "geo-a", "system"])
        except ImportError:
            pass

    def test_13_no_shared_board_leakage_for_clients(self):
        """Verifica que para clientes (is_customer=True) NUNCA se inyecte el board compartido en el payload."""
        from teamilyClient import TeamilyGeoARequest, _client_threads
        req_customer = TeamilyGeoARequest(
            input="Hola, soy cliente nuevo",
            session_id="customer_unique_sess_1",
            is_customer=True,
            board_id="5803df5a-7127-4d28-b97c-5c840d47cdc7"
        )
        payload_cust = req_customer.to_payload()
        self.assertNotIn("board_id", payload_cust, "El board compartido del War Room no debe existir en peticiones de clientes")
        self.assertEqual(payload_cust["thread"]["mode"], "new")

        # Simular que Teamily respondió con thread_id
        _client_threads["customer_unique_sess_1"] = "tmly_thread_abc_123"

        # Segunda petición con la misma sesión debe continuar el hilo aislado
        req_customer_2 = TeamilyGeoARequest(
            input="¿Recuerdas mi nombre?",
            session_id="customer_unique_sess_1",
            is_customer=True
        )
        payload_cust_2 = req_customer_2.to_payload()
        self.assertEqual(payload_cust_2["thread"]["mode"], "continue")
        self.assertEqual(payload_cust_2["thread"]["thread_id"], "tmly_thread_abc_123")
        self.assertNotIn("board_id", payload_cust_2)

    def test_14_independent_channels_and_dual_orchestration_governance(self):
        """Verifica la existencia y gobernanza de los 2 canales independientes de IA (Teamily y Gemini)."""
        import asyncio
        server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")
        with open(server_path, "r", encoding="utf-8") as f:
            src = f.read()

        # 1. Ambos canales definidos de forma independiente
        self.assertIn("async def _execute_teamily_channel", src)
        self.assertIn("async def _execute_gemini_channel", src)
        self.assertIn("async def orchestrate_dual_ai_chat", src)
        self.assertIn('@app.post("/api/v1/channels/teamily/test")', src)
        self.assertIn('@app.post("/api/v1/channels/gemini/test")', src)

        # 2. Prueba dinámica de orquestación dual y gobernanza de selección
        try:
            from server import orchestrate_dual_ai_chat, get_primary_ai_engine

            # Caso A: Gemini como Primario, Teamily de Respaldo
            res_gem_primary = asyncio.run(orchestrate_dual_ai_chat(
                msg="buenas noches",
                session_id="test_dual_sess_gemini",
                is_customer=True,
                primary_engine="gemini",
                timeout_sec=4.0
            ))
            self.assertEqual(res_gem_primary["primary_engine"], "gemini")
            self.assertEqual(res_gem_primary["backup_engine"], "teamily")
            self.assertTrue(bool(res_gem_primary["reply"]))

            # Caso B: Teamily como Primario, Gemini de Respaldo
            res_tmly_primary = asyncio.run(orchestrate_dual_ai_chat(
                msg="buenas noches",
                session_id="test_dual_sess_teamily",
                is_customer=True,
                primary_engine="teamily",
                timeout_sec=4.0
            ))
            self.assertEqual(res_tmly_primary["primary_engine"], "teamily")
            self.assertEqual(res_tmly_primary["backup_engine"], "gemini")
            self.assertTrue(bool(res_tmly_primary["reply"]))
        except ImportError:
            pass

    def test_09_avatar_chat_endpoint_execution(self):
        """Verifica que el endpoint teamily_chat responda con session_id y status success sin NameError."""
        try:
            from server import teamily_chat
            from starlette.requests import Request
            import asyncio

            scope = {
                "type": "http",
                "method": "POST",
                "path": "/api/v1/avatar/chat",
                "headers": [(b"content-type", b"application/json")],
                "query_string": b"",
            }

            async def receive():
                return {
                    "type": "http.request",
                    "body": json.dumps({
                        "agent_id": "margaret",
                        "message": "Hola, prueba de endpoint",
                        "primaryEngine": "gemini",
                        "timeoutSeconds": 3.0
                    }).encode("utf-8")
                }

            req = Request(scope, receive)
            res = asyncio.run(teamily_chat(req))
            self.assertEqual(res.get("status"), "success")
            self.assertTrue(str(res.get("session_id", "")).startswith("sess_"))
            self.assertEqual(res.get("primary_engine"), "gemini")
            self.assertEqual(res.get("backup_engine"), "teamily")
            self.assertTrue(bool(res.get("reply")))
        except ImportError:
            pass

    def test_15_avatar_color_differentiation_teamily_white_gemini_yellow(self):
        """Verifica la regla exclusiva del avatar: Teamily responde en blanco (#FFFFFF) y Gemini en amarillo (#FDE047)."""
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # 1. Verificar leiaChatEngine.js
        chat_engine_path = os.path.join(base_dir, "static", "js", "leiaChatEngine.js")
        with open(chat_engine_path, "r", encoding="utf-8") as f:
            chat_js = f.read()
        self.assertIn("#FDE047", chat_js)
        self.assertIn("#FFFFFF", chat_js)
        self.assertIn("engine-gemini", chat_js)
        self.assertIn("engine-teamily", chat_js)

        # 2. Verificar mrsPetsArchitecture.js
        arch_path = os.path.join(base_dir, "static", "js", "mrsPetsArchitecture.js")
        with open(arch_path, "r", encoding="utf-8") as f:
            arch_js = f.read()
        self.assertIn("engine === 'gemini'", arch_js)
        self.assertIn("#FDE047", arch_js)
        self.assertIn("#FFFFFF", arch_js)

        # 3. Verificar styles.css (reglas exclusivas para el avatar)
        css_path = os.path.join(base_dir, "static", "css", "styles.css")
        with open(css_path, "r", encoding="utf-8") as f:
            css = f.read()
        self.assertIn(".chat-bubble.leia-bubble.engine-teamily", css)
        self.assertIn(".chat-bubble.leia-bubble.engine-gemini", css)
        self.assertIn("#FDE047", css)


if __name__ == "__main__":
    unittest.main()
