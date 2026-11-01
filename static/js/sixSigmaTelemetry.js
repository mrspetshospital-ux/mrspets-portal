/* ==========================================================================
   MOTOR DE TELEMETRÍA Y CAPTURA DE TIEMPOS (SIX SIGMA FRONTEND)
   Mrs. Pets Omnichannel & Care Platform • Real-time Telemetry & KillCritic Webhook
   ========================================================================== */

class SixSigmaTelemetryEngine {
  constructor() {
    this.activeTimers = new Map();
    this.storageKey = 'mrs_pets_telemetry_logs';
    this.maxLogs = 100;
    this.logs = [];

    this.init();
  }

  init() {
    this.loadLogs();
    this.setupCoreWebVitalsMonitor();
    this.setupNetworkInterceptor();
    this.setupEventListener();
    console.log("SixSigmaTelemetryEngine initialized with", this.logs.length, "audit logs.");
  }

  loadLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error loading telemetry logs:", e);
      this.logs = [];
    }
  }

  saveLogs() {
    try {
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (e) {
      console.error("Error saving telemetry logs:", e);
    }
  }

  setupEventListener() {
    window.addEventListener('mrs_pets_thresholds_updated', (e) => {
      console.log("SixSigmaTelemetryEngine: Thresholds updated dynamically", e.detail);
    });

    window.addEventListener('mrs_pets_killcritic_alert', (e) => {
      this.handleKillCriticAlert(e.detail);
    });
  }

  // --- CORE INSTRUMENTATION API ---

  startTimer(metricCode, contextData = {}) {
    const timerId = `${metricCode}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startTime = performance.now();
    
    this.activeTimers.set(timerId, {
      metricCode,
      startTime,
      startIso: new Date().toISOString(),
      contextData
    });

    return timerId;
  }

  stopTimer(timerIdOrMetricCode, contextData = {}) {
    let timerId = timerIdOrMetricCode;
    let timerObj = this.activeTimers.get(timerId);

    if (!timerObj) {
      for (const [id, t] of this.activeTimers.entries()) {
        if (t.metricCode === timerIdOrMetricCode) {
          timerId = id;
          timerObj = t;
          break;
        }
      }
    }

    if (!timerObj) {
      console.warn(`Telemetry timer non-existent or already stopped for: ${timerIdOrMetricCode}`);
      return null;
    }

    const endTime = performance.now();
    const durationMs = endTime - timerObj.startTime;
    this.activeTimers.delete(timerId);

    const mergedContext = { ...timerObj.contextData, ...contextData };
    return this.recordMeasurement(timerObj.metricCode, durationMs, mergedContext);
  }

  // --- MEASUREMENT & SIX SIGMA EVALUATION ---

  recordMeasurement(metricCode, durationMs, contextData = {}) {
    const matrix = window.parametricMatrixEngine ? window.parametricMatrixEngine.getVariable(metricCode) : null;
    
    const unit = matrix ? matrix.unit : 'sec';
    const durationValue = unit === 'min' ? parseFloat((durationMs / 60000).toFixed(2)) : parseFloat((durationMs / 1000).toFixed(2));
    
    const target = matrix ? matrix.target : 5.0;
    const warning = matrix ? matrix.warning : 10.0;
    const usl = matrix ? matrix.usl : 15.0;
    const lsl = matrix ? matrix.lsl : 0.5;

    let status = 'SUCCESS';
    if (durationValue > target && durationValue <= warning) {
      status = 'WARNING';
    } else if (durationValue > warning || durationValue > usl) {
      status = 'KILLCRITIC';
    }

    const deltaToTarget = parseFloat((durationValue - target).toFixed(2));
    const deltaToUSL = parseFloat((durationValue - usl).toFixed(2));

    const telemetryRecord = {
      id: `TEL-EVT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      metricCode,
      metricName: matrix ? matrix.name : metricCode,
      category: matrix ? matrix.category : 'General',
      unit,
      durationMs: Math.round(durationMs),
      durationValue,
      target,
      warning,
      usl,
      lsl,
      status,
      deltaToTarget,
      deltaToUSL,
      contextData,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.unshift(telemetryRecord);
    this.saveLogs();

    console.log(`[SIX SIGMA TELEMETRY] ${metricCode} = ${durationValue} ${unit} | Status: ${status}`, telemetryRecord);

    if (status === 'KILLCRITIC') {
      const alertPayload = {
        alertType: 'KILLCRITIC_THRESHOLD_BREACH',
        severity: 'CRITICAL_RED_ALERT',
        metricCode,
        metricName: telemetryRecord.metricName,
        category: telemetryRecord.category,
        measuredValue: durationValue,
        unit,
        thresholdTarget: target,
        thresholdKillCriticUSL: usl,
        exceededDelta: deltaToUSL > 0 ? deltaToUSL : deltaToTarget,
        timestamp: telemetryRecord.timestamp,
        environment: 'Mrs. Pets Maracaibo Production Web',
        staffActiveUser: window.adminEngine ? window.adminEngine.currentStaffUser?.username || 'System Admin' : 'Unknown',
        context: contextData,
        recommendedAction: `Atención inmediata requerida: La variable ${metricCode} (${telemetryRecord.metricName}) registró ${durationValue} ${unit}, superando la cota máxima permitida (${usl} ${unit}).`
      };

      const customAlertEvent = new CustomEvent('mrs_pets_killcritic_alert', { detail: alertPayload });
      window.dispatchEvent(customAlertEvent);
    }

    this.renderTelemetryLogUI();
    return telemetryRecord;
  }

  // --- KILLCRITIC RED ALERT DISPATCHER ---

  async handleKillCriticAlert(payload) {
    console.error("🚨 CRITICAL KILLCRITIC RED ALERT DISPATCHED:", payload);

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(
        `🚨 ALERTA CRÍTICA KILLCRITIC: ${payload.metricCode} superó umbral (${payload.measuredValue} ${payload.unit} vs USL ${payload.thresholdKillCriticUSL} ${payload.unit}). Payload enviado a Webhook Make/WhatsApp.`,
        'error'
      );
    }

    const webhookUrl = window.parametricMatrixEngine ? window.parametricMatrixEngine.getWebhookUrl() : '';

    if (!webhookUrl) {
      console.warn("No Webhook URL configured in Parametric Matrix for KillCritic alert.");
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MrsPets-SixSigma-Alert': 'KILLCRITIC'
        },
        body: JSON.stringify(payload)
      });
      
      console.log(`[KILLCRITIC WEBHOOK DISPATCH] Status: ${response.status} to ${webhookUrl}`);
    } catch (err) {
      console.warn(`[KILLCRITIC WEBHOOK DISPATCH SIMULATED/LOCAL] Webhook target ${webhookUrl} logged payload:`, err);
    }
  }

  setupCoreWebVitalsMonitor() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.performance && window.performance.timing) {
          const nav = window.performance.timing;
          const pageLoadTimeSec = (nav.loadEventEnd - nav.navigationStart) / 1000;
          
          if (pageLoadTimeSec > 0) {
            console.log(`[CORE WEB VITALS] Page Load Time: ${pageLoadTimeSec.toFixed(2)}s`);
            this.recordMeasurement('TEL-01', pageLoadTimeSec * 1000, { eventType: 'page_initialization_load' });
          }
        }
      }, 500);
    });
  }

  setupNetworkInterceptor() {
    window.simulateDicomDeployment = (secondsOverride) => {
      const timerId = this.startTimer('TEL-01', { component: 'Visor Radiológico DICOM 3D' });
      const latencyMs = secondsOverride ? secondsOverride * 1000 : (Math.random() * 12000 + 1000);
      
      setTimeout(() => {
        const record = this.stopTimer(timerId, { dicomStudiesLoaded: 12, modality: 'XRAY_DIGITAL' });
        return record;
      }, Math.min(latencyMs, 12000));
    };
  }

  // --- UI RENDERER - CENTERED, HIGH CONTRAST DARK/GOLD THEME WITH LUCIDE ICONS ---

  renderTelemetryLogUI(containerId = 'telemetry-live-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
      <div style="width:100%; max-width:100%; margin:0 0 24px 0; box-sizing:border-box;">
        <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius:24px; padding:28px; border:2px solid #4A6B5D; box-shadow:0 15px 40px rgba(0,0,0,0.25); color:#FFFFFF; font-family:'Outfit', sans-serif; width:100%; box-sizing:border-box;">
          
          <!-- HEADER TELEMETRÍA -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:24px; border-bottom:1px solid rgba(74,107,93,0.3); padding-bottom:18px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:52px; height:52px; border-radius:14px; background:rgba(74,107,93,0.2); border:1px solid #4A6B5D; display:flex; align-items:center; justify-content:center; color:#A7F3D0;">
                <i data-lucide="activity" style="width:28px; height:28px;"></i>
              </div>
              <div>
                <h3 style="font-size:1.4rem; font-weight:900; color:#FFFFFF; margin:0; display:flex; align-items:center; gap:10px;">
                  Motor de Telemetría Six Sigma & Audit Log en Vivo
                </h3>
                <p style="font-size:0.88rem; color:#CBD5E1; margin:4px 0 0 0;">
                  Captura en tiempo real de embudos, Core Web Vitals y comparativa dinámica contra la Matriz Maestra Paramétrica.
                </p>
              </div>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn btn-secondary" onclick="sixSigmaTelemetryEngine.triggerTestKillCriticAlert()" style="font-size:0.82rem; padding:10px 16px; background:#DC2626; color:#FFFFFF; border:none; border-radius:12px; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(220,38,38,0.35);">
                <i data-lucide="alert-triangle" style="width:16px;"></i> Probar Alerta KillCritic
              </button>
              <button type="button" class="btn btn-secondary" onclick="sixSigmaTelemetryEngine.clearLogs()" style="font-size:0.82rem; padding:10px 16px; background:rgba(255,255,255,0.1); color:#FFFFFF; border:1px solid rgba(255,255,255,0.25); border-radius:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <i data-lucide="trash-2" style="width:16px;"></i> Limpiar Logs
              </button>
            </div>
          </div>

          <!-- TABLA DE AUDIT LOG DE TELEMETRÍA -->
          <div style="overflow-x:auto; width:100%; border-radius:16px; border:1px solid rgba(255,255,255,0.15);">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem; background:#1E293B; margin:0;">
              <thead>
                <tr style="background:#0F172A; border-bottom:2px solid #4A6B5D; color:#A7F3D0; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.06em;">
                  <th style="padding:16px 18px; font-weight:900;">Hora</th>
                  <th style="padding:16px 14px; font-weight:900;">Código & Variable</th>
                  <th style="padding:16px 12px; text-align:center; font-weight:900;">Medición Real</th>
                  <th style="padding:16px 12px; text-align:center; color:#4ADE80; font-weight:900;">Meta Target</th>
                  <th style="padding:16px 12px; text-align:center; color:#F87171; font-weight:900;">KillCritic (USL)</th>
                  <th style="padding:16px 14px; text-align:center; font-weight:900;">Estado Six Sigma</th>
                  <th style="padding:16px 18px; text-align:right; font-weight:900;">Payload Webhook</th>
                </tr>
              </thead>
              <tbody>
    `;

    if (this.logs.length === 0) {
      html += `
        <tr>
          <td colspan="7" style="text-align:center; padding:40px 20px; color:#94A3B8; font-size:0.95rem;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
              <i data-lucide="activity" style="width:36px; height:36px; color:#4A6B5D; opacity:0.6;"></i>
              <div>No se han registrado eventos de telemetría aún. Realiza una acción de agendamiento o simulador radiológico.</div>
            </div>
          </td>
        </tr>
      `;
    } else {
      this.logs.forEach((log, index) => {
        let statusBadge = `<span style="background:#14532D; color:#86EFAC; border:1px solid #22C55E; padding:4px 12px; border-radius:20px; font-weight:900; font-size:0.78rem; display:inline-flex; align-items:center; gap:4px;"><i data-lucide="check-circle" style="width:14px;"></i> OPTIMO</span>`;
        if (log.status === 'WARNING') {
          statusBadge = `<span style="background:#78350F; color:#FDE68A; border:1px solid #F59E0B; padding:4px 12px; border-radius:20px; font-weight:900; font-size:0.78rem; display:inline-flex; align-items:center; gap:4px;"><i data-lucide="alert-circle" style="width:14px;"></i> ADVERTENCIA</span>`;
        } else if (log.status === 'KILLCRITIC') {
          statusBadge = `<span style="background:#7F1D1D; color:#FECACA; border:2px solid #EF4444; padding:4px 12px; border-radius:20px; font-weight:900; font-size:0.78rem; display:inline-flex; align-items:center; gap:4px; box-shadow:0 0 10px rgba(239,68,68,0.5);"><i data-lucide="alert-octagon" style="width:14px;"></i> KILLCRITIC</span>`;
        }

        const dateStr = new Date(log.timestamp).toLocaleTimeString();
        const isEven = index % 2 === 0;
        const rowBg = isEven ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)';

        html += `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.08); background:${rowBg}; transition:background 0.2s;" onmouseover="this.style.background='rgba(74,107,93,0.15)'" onmouseout="this.style.background='${rowBg}'">
            <td style="padding:16px 18px; font-weight:800; color:#CBD5E1; font-size:0.85rem;">${dateStr}</td>
            <td style="padding:16px 14px; font-weight:700;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-family:monospace; background:#0F172A; color:#D4AF37; padding:4px 8px; border-radius:6px; font-size:0.78rem; font-weight:900; border:1px solid #D4AF37;">${log.metricCode}</span>
                <span style="color:#FFFFFF; font-weight:900; font-size:0.92rem;">${this.escapeHtml(log.metricName)}</span>
              </div>
            </td>
            <td style="padding:16px 12px; text-align:center; font-weight:900; font-size:1.05rem; color:${log.status === 'KILLCRITIC' ? '#F87171' : '#FFFFFF'};">
              ${log.durationValue} ${log.unit}
            </td>
            <td style="padding:16px 12px; text-align:center; color:#4ADE80; font-weight:900;">
              ${log.target} ${log.unit}
            </td>
            <td style="padding:16px 12px; text-align:center; color:#F87171; font-weight:900;">
              ${log.usl} ${log.unit}
            </td>
            <td style="padding:16px 14px; text-align:center;">${statusBadge}</td>
            <td style="padding:16px 18px; text-align:right;">
              <button type="button" class="btn btn-secondary" onclick="sixSigmaTelemetryEngine.viewPayloadModal('${log.id}')" style="font-size:0.78rem; padding:6px 12px; background:rgba(212,175,55,0.15); color:#D4AF37; border:1px solid #D4AF37; border-radius:8px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                <i data-lucide="eye" style="width:14px;"></i> Ver JSON
              </button>
            </td>
          </tr>
        `;
      });
    }

    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    if (window.lucide) {
      setTimeout(() => window.lucide.createIcons(), 50);
    }
  }

  triggerTestKillCriticAlert() {
    this.recordMeasurement('SOS-01', 135000, { testReason: 'Simulación manual de breach de cota máxima KillCritic para pruebas de Webhook' });
  }

  viewPayloadModal(logId) {
    const log = this.logs.find(l => l.id === logId);
    if (!log) return;
    alert(`JSON Payload para Make/WhatsApp Webhook:\n\n${JSON.stringify(log, null, 2)}`);
  }

  openTelemetryModal() {
    const accAdmin = document.getElementById('acc-sixsigma-telemetry');
    if (accAdmin) {
      accAdmin.open = true;
      accAdmin.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const accAnalytics = document.getElementById('acc-analytics-sixsigma-telemetry');
    if (accAnalytics) {
      accAnalytics.open = true;
    }
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('telemetry-live-modal');
      this.renderTelemetryLogUI('telemetry-live-modal-body');
    }
  }

  clearLogs() {
    if (confirm("¿Limpiar historial de logs de telemetría local?")) {
      this.logs = [];
      this.saveLogs();
      this.renderTelemetryLogUI();
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Global Singleton Instance
window.sixSigmaTelemetryEngine = new SixSigmaTelemetryEngine();
