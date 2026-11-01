/**
 * Mrs. Pets - Clinical Integrations & Automated BCV Engine
 * Big & Little Dogs, C.A. • RIF J-40120233-0 • Av. 2 El Milagro diagonal Lago Mall
 * 
 * Conecta el frontend con:
 * 1. Automatización de Tasa Oficial BCV (3 veces al día: 8:00 AM, 11:00 AM, 5:00 PM).
 * 2. Pasarela IDEXX In-House (Química, Hematología, SDMA, Snap Tests).
 * 3. Sincronización Bidireccional QVET (Citas, Historiales, Inventario Clínico).
 */

(function (window) {
    'use strict';

    const ClinicalIntegrations = {
        bcvData: null,
        idexxResults: [],
        qvetStatus: {
            connected: true,
            lastSync: null
        },

        init() {
            this.fetchBcvStatus();
            this.fetchIdexxResults();
            this.setupListeners();
            this.renderIntegrationCards();
            console.log('[ClinicalIntegrations] Módulos de Sincronización BCV e Integraciones IDEXX/QVET inicializados.');
        },

        setupListeners() {
            window.addEventListener('mrs_pets_currency_changed', () => {
                this.updateBcvWidgets();
            });

            // Escuchar si hay nuevo resultado IDEXX vía broadcast
            window.addEventListener('mrs_pets_idexx_received', (e) => {
                if (e.detail) {
                    this.onIdexxResultReceived(e.detail);
                }
            });
        },

        // =====================================================================
        // MÓDULO A: AUTOMATIZACIÓN DE TASA BCV OFICIAL
        // =====================================================================
        async fetchBcvStatus() {
            try {
                const resp = await fetch('/api/v1/bcv/rate');
                if (resp.ok) {
                    const data = await resp.json();
                    this.bcvData = data;
                    if (window.FinancialEngine && data.currentRate) {
                        window.FinancialEngine.updateConfig({
                            bcvRate: data.currentRate,
                            updatedBy: data.source || 'BCV Instagram @bcv.org.ve'
                        });
                    }
                    this.updateBcvWidgets();
                }
            } catch (e) {
                console.warn('[ClinicalIntegrations] Error consultando /api/v1/bcv/rate:', e);
            }
        },

        async triggerManualBcvSync(customRate = null, slot = null) {
            try {
                const body = {};
                if (customRate) body.rate = parseFloat(customRate);
                if (slot) body.slot = slot;

                const resp = await fetch('/api/v1/bcv/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (resp.ok) {
                    const res = await resp.json();
                    if (window.app && typeof window.app.showToast === 'function') {
                        window.app.showToast(`✨ Tasa BCV sincronizada: Bs. ${res.data.rate.toFixed(2)} (${res.data.slot})`, 'success');
                    }
                    this.fetchBcvStatus();
                    return res;
                }
            } catch (e) {
                console.error('[ClinicalIntegrations] Error en sincronización BCV:', e);
            }
        },

        updateBcvWidgets() {
            // Actualizar widget en el menú lateral o en la sección financiera
            const badge = document.getElementById('bcv-schedule-badge');
            if (badge && this.bcvData) {
                badge.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:2px; font-size:0.75rem;">
                        <span style="color:#D4AF37; font-weight:800;">⏰ Próxima Tasa BCV: ${this.bcvData.nextScheduledSync || '05:00 PM'}</span>
                        <span style="color:#94A3B8; font-size:0.7rem;">Horarios fijos: 8:00 AM • 11:00 AM • 5:00 PM</span>
                        <span style="color:#6EE7B7; font-size:0.68rem;">Fuente: ${this.bcvData.source}</span>
                    </div>
                `;
            }
        },

        // =====================================================================
        // MÓDULO B1: PASARELA IDEXX (QUÍMICA, HEMATOLOGÍA & SDMA)
        // =====================================================================
        async fetchIdexxResults() {
            try {
                const resp = await fetch('/api/v1/integrations/idexx/results');
                if (resp.ok) {
                    const data = await resp.json();
                    this.idexxResults = data.results || [];
                    this.attachResultsToPatientDatabase();
                }
            } catch (e) {
                console.warn('[ClinicalIntegrations] Error consultando /api/v1/integrations/idexx/results:', e);
            }
        },

        attachResultsToPatientDatabase() {
            if (!window.ClinicaEngine || !window.ClinicaEngine.patientsDatabase) return;

            this.idexxResults.forEach(res => {
                const code = res.patientCode || 'PET-101';
                const p = window.ClinicaEngine.patientsDatabase[code];
                if (p) {
                    if (!p.idexxStudies) p.idexxStudies = [];
                    const exists = p.idexxStudies.some(s => s.accessionId === res.accessionId);
                    if (!exists) {
                        p.idexxStudies.unshift(res);
                    }
                }
            });

            // Si el portal del paciente está abierto, re-renderizar
            if (typeof window.ClinicaEngine.renderPatientPortalData === 'function' && window.ClinicaEngine.authenticatedPatientId) {
                window.ClinicaEngine.renderPatientPortalData();
            }
        },

        onIdexxResultReceived(record) {
            this.idexxResults.unshift(record);
            this.attachResultsToPatientDatabase();

            if (record.sdmaAlert) {
                if (window.app && typeof window.app.showToast === 'function') {
                    window.app.showToast(`🚨 ALERTA IDEXX: SDMA elevado (${record.sdmaValue} ug/dL) en ${record.patientName}!`, 'error');
                }
            } else {
                if (window.app && typeof window.app.showToast === 'function') {
                    window.app.showToast(`🔬 Nuevo análisis IDEXX recibido para ${record.patientName}`, 'info');
                }
            }
        },

        // =====================================================================
        // MÓDULO B2: PASARELA DE SINCRONIZACIÓN QVET
        // =====================================================================
        async triggerQvetSync(syncType = 'all') {
            try {
                const resp = await fetch(`/api/v1/integrations/qvet/sync?entity=${syncType}`);
                if (resp.ok) {
                    const data = await resp.json();
                    this.qvetStatus.lastSync = new Date().toISOString();
                    if (window.app && typeof window.app.showToast === 'function') {
                        window.app.showToast(`🔄 QVET sincronizado con éxito (${syncType}). Cero duplicidad.`, 'success');
                    }
                    return data;
                }
            } catch (e) {
                console.error('[ClinicalIntegrations] Error en sincronización QVET:', e);
            }
        },

        // =====================================================================
        // RENDERIZADO VISUAL EN LA TABLA DE INTEGRACIONES
        // =====================================================================
        renderIntegrationCards() {
            const container = document.getElementById('clinical-integrations-status-deck');
            if (!container) return;

            container.innerHTML = `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:16px;">
                    <!-- TARJETA BCV AUTOMATIZADO -->
                    <div style="background:#1C1C1E; border:1px solid #D4AF37; border-radius:14px; padding:18px; color:#FBFBFD;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <strong style="color:#D4AF37; font-size:0.95rem;">🇻🇪 Tasa BCV Oficial (Instagram)</strong>
                            <span class="badge" style="background:rgba(16,185,129,0.2); color:#10B981; border:1px solid #10B981; font-size:0.7rem; font-weight:800;">3 Veces / Día</span>
                        </div>
                        <p style="font-size:0.8rem; color:#94A3B8; margin:0 0 10px 0;">Sincronización automatizada fija a las <strong>8:00 AM</strong>, <strong>11:00 AM</strong> y <strong>5:00 PM</strong>.</p>
                        <div style="background:#2C2C2E; padding:10px; border-radius:8px; font-size:0.82rem; margin-bottom:12px;">
                            <div>Tasa actual: <strong style="color:#D4AF37;">Bs. ${window.FinancialEngine ? window.FinancialEngine.config.bcvRate.toFixed(2) : '48.50'} / USD</strong></div>
                            <div style="font-size:0.72rem; color:#A7F3D0; margin-top:4px;">⚖️ Prohibido dólar paralelo. Cumplimiento legal estricto.</div>
                        </div>
                        <button type="button" class="btn btn-sm btn-luxury-primary" onclick="window.ClinicalIntegrations.triggerManualBcvSync()" style="font-size:0.75rem; padding:6px 14px; width:100%; justify-content:center;">
                            ⚡ Forzar Sincronización Inmediata
                        </button>
                    </div>

                    <!-- TARJETA IDEXX IN-HOUSE -->
                    <div style="background:#1C1C1E; border:1px solid #D4AF37; border-radius:14px; padding:18px; color:#FBFBFD;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <strong style="color:#D4AF37; font-size:0.95rem;">🔬 IDEXX In-House Lab</strong>
                            <span class="badge" style="background:rgba(59,130,246,0.2); color:#60A5FA; border:1px solid #60A5FA; font-size:0.7rem; font-weight:800;">Webhook Seguro</span>
                        </div>
                        <p style="font-size:0.8rem; color:#94A3B8; margin:0 0 10px 0;">Receptor automatizado de Química, Hematología y SDMA (JSON/XML).</p>
                        <div style="background:#2C2C2E; padding:10px; border-radius:8px; font-size:0.82rem; margin-bottom:12px;">
                            <div>Ruta: <code style="color:#93C5FD; font-size:0.74rem;">/api/v1/integrations/idexx/webhook</code></div>
                            <div style="font-size:0.72rem; color:#CBD5E1; margin-top:4px;">Estudios recibidos: <strong>${this.idexxResults.length}</strong></div>
                        </div>
                        <button type="button" class="btn btn-sm btn-luxury-secondary" onclick="window.ClinicalIntegrations.simulateIdexxSample()" style="font-size:0.75rem; padding:6px 14px; width:100%; justify-content:center;">
                            🧪 Simular Prueba IDEXX (Catalyst/SDMA)
                        </button>
                    </div>

                    <!-- TARJETA QVET GESTIÓN CLÍNICA -->
                    <div style="background:#1C1C1E; border:1px solid #D4AF37; border-radius:14px; padding:18px; color:#FBFBFD;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <strong style="color:#D4AF37; font-size:0.95rem;">🏥 QVET Gestión Clínica</strong>
                            <span class="badge" style="background:rgba(212,175,55,0.2); color:#D4AF37; border:1px solid #D4AF37; font-size:0.7rem; font-weight:800;">Bidireccional</span>
                        </div>
                        <p style="font-size:0.8rem; color:#94A3B8; margin:0 0 10px 0;">Sincronización de citas, historiales médicos e inventario sin duplicidad.</p>
                        <div style="background:#2C2C2E; padding:10px; border-radius:8px; font-size:0.82rem; margin-bottom:12px;">
                            <div>Ruta: <code style="color:#FDE68A; font-size:0.74rem;">/api/v1/integrations/qvet/sync</code></div>
                            <div style="font-size:0.72rem; color:#CBD5E1; margin-top:4px;">Estado: <strong style="color:#34D399;">Activo & Deduplicado</strong></div>
                        </div>
                        <button type="button" class="btn btn-sm btn-luxury-primary" onclick="window.ClinicalIntegrations.triggerQvetSync('all')" style="font-size:0.75rem; padding:6px 14px; width:100%; justify-content:center;">
                            🔄 Sincronizar Citas & Pacientes QVET
                        </button>
                    </div>

                    <!-- TARJETA TEAMLY AI & VERTEX AI (COMITÉ VOLTURI) -->
                    <div style="background:#1C1C1E; border:1.5px solid #818CF8; border-radius:14px; padding:18px; color:#FBFBFD; box-shadow:0 10px 25px rgba(99,102,241,0.15);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <strong style="color:#A5B4FC; font-size:0.95rem;">🤖 Teamly AI & Vertex AI</strong>
                            <span class="badge" style="background:rgba(99,102,241,0.25); color:#C7D2FE; border:1px solid #818CF8; font-size:0.7rem; font-weight:800;">Comité Volturi</span>
                        </div>
                        <p style="font-size:0.8rem; color:#94A3B8; margin:0 0 10px 0;">Orquestación ejecutiva con Manolo (6:00 PM), Pandora (KillCritic) y Charlie (BCV/SENIAT).</p>
                        <div style="background:#2C2C2E; padding:10px; border-radius:8px; font-size:0.82rem; margin-bottom:12px;">
                            <div>Ruta: <code style="color:#A5B4FC; font-size:0.74rem;">/api/v1/teamily/orchestrate</code></div>
                            <div style="font-size:0.72rem; color:#CBD5E1; margin-top:4px;">Workspace: <strong>ws_mrspets_mbo_01</strong> • Project: <strong>prj_management_tasks</strong></div>
                            <div style="font-size:0.72rem; color:#34D399; margin-top:4px;">⚡ Estado: <strong>Activo & Sincronizado</strong></div>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button type="button" class="btn btn-sm btn-luxury-primary" onclick="window.teamilyExecutiveEngine && window.teamilyExecutiveEngine.openCommitteeConsole()" style="font-size:0.75rem; padding:6px 14px; flex:1; justify-content:center; background:linear-gradient(135deg, #6366F1, #4F46E5); border:none; box-shadow:0 3px 10px rgba(99,102,241,0.3);">
                                ⚡ Deliberar / Probar
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="integrations.loadPresetToDirectBuilder ? integrations.loadPresetToDirectBuilder('teamly') : integrations.openCreateApiModal('teamly')" style="font-size:0.75rem; padding:6px 12px; background:rgba(255,255,255,0.08); color:#FFFFFF; border:1px solid rgba(255,255,255,0.2);" title="Ver / Cargar en Creador de APIs">
                                ⚙️ Estructura
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },

        async simulateIdexxSample() {
            try {
                const samplePayload = {
                    accessionId: `IDX-SIM-${Date.now().toString().slice(-4)}`,
                    instrumentModel: "Catalyst_One",
                    patient: {
                        patientCode: "PET-101",
                        patientName: "Princesa",
                        species: "Canino - Yorkshire Terrier VIP",
                        tutor: "Dalybell Ramírez Montilla"
                    },
                    testPanel: "Panel Renal & Hepático IDEXX",
                    results: [
                        { biomarker: "SDMA", value: 11.5, unit: "ug/dL", refRange: "0.0 - 14.0", status: "NORMAL" },
                        { biomarker: "Creatinina", value: 1.1, unit: "mg/dL", refRange: "0.5 - 1.5", status: "NORMAL" },
                        { biomarker: "BUN", value: 19.2, unit: "mg/dL", refRange: "7.0 - 27.0", status: "NORMAL" },
                        { biomarker: "ALT", value: 38.0, unit: "U/L", refRange: "10 - 100", status: "NORMAL" }
                    ],
                    vetNotes: "Chequeo automatizado de laboratorio in-house Mrs. Pets."
                };

                const resp = await fetch('/api/v1/integrations/idexx/webhook', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-IDEXX-Token': 'idx_sec_live_994827163820194857201'
                    },
                    body: JSON.stringify(samplePayload)
                });

                if (resp.ok) {
                    const data = await resp.json();
                    this.onIdexxResultReceived(data);
                }
            } catch (e) {
                console.error('[ClinicalIntegrations] Error simulando prueba IDEXX:', e);
            }
        }
    };

    window.ClinicalIntegrations = ClinicalIntegrations;

})(window);
