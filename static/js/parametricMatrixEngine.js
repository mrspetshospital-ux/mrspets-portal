/* ==========================================================================
   MATRIZ MAESTRA DE CONTROL PARAMÉTRICO (CUADRO DINÁMICO DE VARIABLES)
   Mrs. Pets Omnichannel & Care Platform • Six Sigma Operations Engine
   ========================================================================== */

class ParametricMatrixEngine {
  constructor() {
    this.storageKey = 'mrs_pets_parametric_matrix';
    this.webhookStorageKey = 'mrs_pets_webhook_url';
    
    // Default Webhook Target URL (Make.com / WhatsApp Gateway / Google Sheets)
    this.webhookUrl = localStorage.getItem(this.webhookStorageKey) || 'https://hook.eu1.make.com/mrspets_sixsigma_killcritic_alert_demo';

    // Standard Default Parametric Variables Matrix
    this.defaultVariables = [
      {
        code: 'GROOM-01',
        name: 'Tiempo de Recepción Dérmica Inicial',
        category: 'Grooming & Estética',
        unit: 'min',
        lsl: 1.0,
        target: 5.0,
        warning: 10.0,
        usl: 15.0, // Umbral Crítico KillCritic
        description: 'Duración total de la inspección dérmica inicial con lámpara Wood y dermatoscopio antes del baño.',
        active: true
      },
      {
        code: 'FUN-04',
        name: 'Tiempo de Culminación de Reserva Web',
        category: 'Experiencia Digital',
        unit: 'min',
        lsl: 0.5,
        target: 2.0,
        warning: 4.0,
        usl: 6.0, // Umbral Crítico KillCritic
        description: 'Tiempo transcurrido desde que el tutor inicia el flujo de agendamiento web hasta la confirmación.',
        active: true
      },
      {
        code: 'PAY-02',
        name: 'Tiempo de Validación Comprobante Caja',
        category: 'Operaciones & Financiero',
        unit: 'min',
        lsl: 0.5,
        target: 3.0,
        warning: 6.0,
        usl: 10.0, // Umbral Crítico KillCritic
        description: 'Tiempo de verificación de pago, comprobantes de transferencia y emisión de factura.',
        active: true
      },
      {
        code: 'SOS-01',
        name: 'Respuesta Tele-Triaje Emergencia',
        category: 'Clínica Veterinaria',
        unit: 'sec',
        lsl: 5.0,
        target: 30.0,
        warning: 60.0,
        usl: 120.0, // Umbral Crítico KillCritic
        description: 'Tiempo máximo de respuesta y asignación de espacio médico en urgencias de triaje.',
        active: true
      },
      {
        code: 'TEL-01',
        name: 'Latencia Visor Radiológico / DICOM',
        category: 'Sistemas & Radiología',
        unit: 'sec',
        lsl: 0.2,
        target: 2.0,
        warning: 5.0,
        usl: 10.0, // Umbral Crítico KillCritic
        description: 'Tiempo de renderizado y despliegue del visor radiológico DICOM en la historia médica del paciente.',
        active: true
      }
    ];

    this.variables = [];
    this.init();
  }

  init() {
    this.loadFromStorage();
    console.log("ParametricMatrixEngine initialized with", this.variables.length, "parametric variables.");
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.variables = JSON.parse(stored);
      } else {
        this.variables = JSON.parse(JSON.stringify(this.defaultVariables));
        this.saveToStorage();
      }
    } catch (e) {
      console.error("Error loading parametric matrix from storage:", e);
      this.variables = JSON.parse(JSON.stringify(this.defaultVariables));
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.variables));
      this.dispatchUpdateEvent();
    } catch (e) {
      console.error("Error saving parametric matrix to storage:", e);
    }
  }

  setWebhookUrl(url) {
    this.webhookUrl = url;
    localStorage.setItem(this.webhookStorageKey, url);
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🔗 URL de Webhook Make/WhatsApp actualizada exitosamente', 'success');
    }
  }

  getWebhookUrl() {
    return this.webhookUrl || localStorage.getItem(this.webhookStorageKey) || '';
  }

  getAllVariables() {
    return this.variables;
  }

  getVariable(code) {
    return this.variables.find(v => v.code === code);
  }

  updateVariableThresholds(code, updates) {
    const variable = this.getVariable(code);
    if (!variable) return false;

    if (updates.target !== undefined) variable.target = parseFloat(updates.target);
    if (updates.warning !== undefined) variable.warning = parseFloat(updates.warning);
    if (updates.usl !== undefined) variable.usl = parseFloat(updates.usl);
    if (updates.lsl !== undefined) variable.lsl = parseFloat(updates.lsl);
    if (updates.name !== undefined) variable.name = updates.name;
    if (updates.unit !== undefined) variable.unit = updates.unit;
    if (updates.category !== undefined) variable.category = updates.category;
    if (updates.description !== undefined) variable.description = updates.description;

    variable.lastUpdated = new Date().toISOString();
    this.saveToStorage();

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✅ Parámetros de ${code} actualizados correctamente`, 'success');
    }

    this.renderMatrixUI();
    return true;
  }

  addNewVariable(variableData) {
    if (!variableData.code) return false;
    const existing = this.getVariable(variableData.code);
    if (existing) {
      alert(`La variable con código ${variableData.code} ya existe.`);
      return false;
    }

    const newVar = {
      code: variableData.code.toUpperCase().trim(),
      name: variableData.name || 'Nueva Variable Paramétrica',
      category: variableData.category || 'General',
      unit: variableData.unit || 'min',
      lsl: parseFloat(variableData.lsl) || 0.0,
      target: parseFloat(variableData.target) || 5.0,
      warning: parseFloat(variableData.warning) || 10.0,
      usl: parseFloat(variableData.usl) || 15.0,
      description: variableData.description || 'Variable operativa personalizada.',
      active: true,
      createdAt: new Date().toISOString()
    };

    this.variables.push(newVar);
    this.saveToStorage();

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`➕ Nueva variable ${newVar.code} agregada a la Matriz`, 'success');
    }

    this.renderMatrixUI();
    return true;
  }

  resetToDefaults() {
    if (confirm("¿Está seguro de restablecer todos los parámetros de la Matriz Maestra a sus valores de fábrica?")) {
      this.variables = JSON.parse(JSON.stringify(this.defaultVariables));
      this.saveToStorage();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔄 Matriz Maestra restablecida a valores por defecto', 'info');
      }
      this.renderMatrixUI();
    }
  }

  dispatchUpdateEvent() {
    const event = new CustomEvent('mrs_pets_thresholds_updated', {
      detail: {
        variables: this.variables,
        webhookUrl: this.webhookUrl,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  }

  // UI Renderer - CENTERED, HIGH CONTRAST SILENT LUXURY CARD
  renderMatrixUI(containerId = 'parametric-matrix-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
      <div style="width:100%; max-width:100%; margin:0 0 24px 0; box-sizing:border-box;">
        <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius:24px; padding:28px; border:2px solid #D4AF37; box-shadow:0 15px 40px rgba(0,0,0,0.25); color:#FFFFFF; font-family:'Outfit', sans-serif; width:100%; box-sizing:border-box;">
          
          <!-- HEADER DE LA MATRIZ PARAMÉTRICA -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:24px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:18px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:52px; height:52px; border-radius:14px; background:rgba(212,175,55,0.15); border:1px solid #D4AF37; display:flex; align-items:center; justify-content:center; color:#D4AF37;">
                <i data-lucide="sliders" style="width:28px; height:28px;"></i>
              </div>
              <div>
                <h3 style="font-size:1.4rem; font-weight:900; color:#FFFFFF; margin:0; display:flex; align-items:center; gap:10px;">
                  Matriz Maestra de Control Paramétrico (Cuadro Dinámico)
                </h3>
                <p style="font-size:0.88rem; color:#CBD5E1; margin:4px 0 0 0;">
                  Ajuste dinámico de metas operativas Six Sigma sin código duro (LSL, Target, Advertencia Amarilla y Umbral Crítico KillCritic/USL).
                </p>
              </div>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn btn-secondary" onclick="parametricMatrixEngine.resetToDefaults()" style="font-size:0.82rem; padding:10px 16px; background:rgba(255,255,255,0.1); color:#FFFFFF; border:1px solid rgba(255,255,255,0.25); border-radius:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <i data-lucide="rotate-ccw" style="width:16px;"></i> Restablecer Fábrica
              </button>
              <button type="button" class="btn btn-primary" onclick="parametricMatrixEngine.openAddVariableModal()" style="font-size:0.82rem; padding:10px 16px; background:linear-gradient(135deg, #4A6B5D, #2D4A3E); border:1px solid #D4AF37; color:#FFFFFF; border-radius:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <i data-lucide="plus-circle" style="width:16px;"></i> Crear Variable
              </button>
            </div>
          </div>

          <!-- CONFIGURACIÓN DE ENDPOINT DE WEBHOOK MAKE / WHATSAPP -->
          <div style="background:rgba(212,175,55,0.1); border:1.5px dashed #D4AF37; padding:20px; border-radius:16px; margin-bottom:28px;">
            <label style="font-size:0.9rem; font-weight:800; color:#FBFBFD; display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <i data-lucide="link" style="width:18px; color:#D4AF37;"></i> Endpoint Webhook de Salida (Make.com / WhatsApp / Q-Vet / Google Sheets)
            </label>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <input type="url" id="parametric-webhook-input" class="form-input" value="${this.escapeHtml(this.getWebhookUrl())}" placeholder="https://hook.eu1.make.com/your_killcritic_webhook" style="flex:1; min-width:280px; background:#FFFFFF; color:#0F172A; font-weight:800; font-size:0.9rem; border-radius:10px; padding:12px 16px; border:2px solid #D4AF37;">
              <button type="button" class="btn btn-secondary" onclick="parametricMatrixEngine.saveWebhookFromInput()" style="white-space:nowrap; font-weight:800; font-size:0.85rem; padding:12px 20px; background:#D4AF37; color:#0F172A; border:none; border-radius:10px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <i data-lucide="save" style="width:16px;"></i> Guardar Webhook
              </button>
            </div>
            <p style="font-size:0.8rem; color:#CBD5E1; margin:8px 0 0 0;">
              Al detectar un breach de umbral <strong style="color:#F87171;">KillCritic (USL)</strong>, el motor de telemetría disparará automáticamente un payload JSON a esta URL.
            </p>
          </div>

          <!-- TABLA INTERACTIVA DE VARIABLES PARAMÉTRICAS -->
          <div style="overflow-x:auto; width:100%; border-radius:16px; border:1px solid rgba(255,255,255,0.15);">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem; background:#1E293B; margin:0;">
              <thead>
                <tr style="background:#0F172A; border-bottom:2px solid #D4AF37; color:#D4AF37; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.06em;">
                  <th style="padding:16px 18px; font-weight:900;">Código & Variable</th>
                  <th style="padding:16px 12px; font-weight:900;">Categoría</th>
                  <th style="padding:16px 12px; text-align:center; font-weight:900;">Unidad</th>
                  <th style="padding:16px 12px; text-align:center; color:#60A5FA; font-weight:900;">LSL (Min)</th>
                  <th style="padding:16px 12px; text-align:center; color:#4ADE80; font-weight:900;">Target (Meta)</th>
                  <th style="padding:16px 12px; text-align:center; color:#FBBF24; font-weight:900;">Límite Amarilla</th>
                  <th style="padding:16px 12px; text-align:center; color:#F87171; font-weight:900;">KillCritic (USL)</th>
                  <th style="padding:16px 18px; text-align:right; font-weight:900;">Acción</th>
                </tr>
              </thead>
              <tbody>
    `;

    this.variables.forEach((v, index) => {
      const isEven = index % 2 === 0;
      const rowBg = isEven ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)';

      html += `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08); background:${rowBg}; transition:background 0.2s;" onmouseover="this.style.background='rgba(212,175,55,0.1)'" onmouseout="this.style.background='${rowBg}'">
          <td style="padding:16px 18px; font-weight:700;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:#0F172A; color:#D4AF37; font-size:0.8rem; padding:4px 10px; border-radius:8px; font-weight:900; font-family:monospace; border:1px solid #D4AF37;">${v.code}</span>
              <div>
                <div style="font-size:0.95rem; font-weight:900; color:#FFFFFF;">${this.escapeHtml(v.name)}</div>
                <div style="font-size:0.78rem; color:#94A3B8; font-weight:400; margin-top:2px;">${this.escapeHtml(v.description || '')}</div>
              </div>
            </div>
          </td>
          <td style="padding:16px 12px;">
            <span style="background:rgba(74,107,93,0.3); color:#A7F3D0; border:1px solid #4A6B5D; padding:4px 12px; border-radius:20px; font-size:0.78rem; font-weight:800;">${v.category}</span>
          </td>
          <td style="padding:16px 12px; text-align:center; font-weight:800; color:#F1F5F9;">
            ${v.unit === 'min' ? '⏱️ Minutos' : '⚡ Segundos'}
          </td>
          <td style="padding:12px; text-align:center;">
            <input type="number" step="0.1" id="input-lsl-${v.code}" value="${v.lsl}" style="width:75px; text-align:center; padding:8px; border:2px solid #3B82F6; border-radius:8px; font-weight:900; color:#1E3A8A; background:#EFF6FF;">
          </td>
          <td style="padding:12px; text-align:center;">
            <input type="number" step="0.1" id="input-target-${v.code}" value="${v.target}" style="width:80px; text-align:center; padding:8px; border:2px solid #22C55E; border-radius:8px; font-weight:900; color:#14532D; background:#F0FDF4;">
          </td>
          <td style="padding:12px; text-align:center;">
            <input type="number" step="0.1" id="input-warning-${v.code}" value="${v.warning}" style="width:80px; text-align:center; padding:8px; border:2px solid #F59E0B; border-radius:8px; font-weight:900; color:#78350F; background:#FFFBEB;">
          </td>
          <td style="padding:12px; text-align:center;">
            <input type="number" step="0.1" id="input-usl-${v.code}" value="${v.usl}" style="width:80px; text-align:center; padding:8px; border:2px solid #EF4444; border-radius:8px; font-weight:900; color:#7F1D1D; background:#FEF2F2;">
          </td>
          <td style="padding:16px 18px; text-align:right;">
            <button type="button" class="btn btn-secondary" onclick="parametricMatrixEngine.saveRowFromUI('${v.code}')" style="font-size:0.8rem; padding:8px 14px; font-weight:800; background:#D4AF37; color:#0F172A; border:none; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
              <i data-lucide="check" style="width:14px;"></i> Guardar
            </button>
          </td>
        </tr>
      `;
    });

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

  saveWebhookFromInput() {
    const input = document.getElementById('parametric-webhook-input');
    if (input) {
      this.setWebhookUrl(input.value.trim());
    }
  }

  saveRowFromUI(code) {
    const lsl = parseFloat(document.getElementById(`input-lsl-${code}`)?.value || 0);
    const target = parseFloat(document.getElementById(`input-target-${code}`)?.value || 0);
    const warning = parseFloat(document.getElementById(`input-warning-${code}`)?.value || 0);
    const usl = parseFloat(document.getElementById(`input-usl-${code}`)?.value || 0);

    if (warning < target) {
      alert("El Límite de Advertencia Amarilla debe ser mayor o igual a la Meta (Target).");
      return;
    }
    if (usl < warning) {
      alert("El Umbral Crítico KillCritic (USL) debe ser mayor o igual al Límite Amarilla.");
      return;
    }

    this.updateVariableThresholds(code, { lsl, target, warning, usl });
  }

  openAddVariableModal() {
    const code = prompt("Ingrese el Código de la Variable (Ej: HOSP-02):");
    if (!code) return;
    const name = prompt("Ingrese el Nombre de la Variable (Ej: Tiempo de Alta Hospitalaria):");
    if (!name) return;
    const category = prompt("Ingrese la Categoría (Grooming / Clínica Veterinaria / Hotel / Tienda / Sistemas):", "Clínica Veterinaria");
    const unit = confirm("¿La unidad de medida es en Minutos? (Cancelar para Segundos)") ? 'min' : 'sec';
    const target = parseFloat(prompt("Meta Target (Silent Luxury Standard):", "5.0") || 5.0);
    const warning = parseFloat(prompt("Límite de Advertencia Amarilla:", "10.0") || 10.0);
    const usl = parseFloat(prompt("Umbral Crítico KillCritic (USL):", "15.0") || 15.0);

    this.addNewVariable({
      code,
      name,
      category,
      unit,
      target,
      warning,
      usl,
      lsl: 0.5,
      description: 'Variable personalizada agregada por el administrador.'
    });
  }

  openMatrixModal() {
    const accAdmin = document.getElementById('acc-parametric-matrix');
    if (accAdmin) {
      accAdmin.open = true;
      accAdmin.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const accAnalytics = document.getElementById('acc-analytics-parametric-matrix');
    if (accAnalytics) {
      accAnalytics.open = true;
    }
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('parametric-matrix-modal');
      this.renderMatrixUI('parametric-matrix-modal-body');
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
window.parametricMatrixEngine = new ParametricMatrixEngine();
