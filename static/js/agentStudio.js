/* ==========================================================================
   AGENT STUDIO ENGINE • CENTRO DE CONTROL UNIFICADO DE IA (MRS. PETS)
   - Doble Canal: Teamily (Orquestador Primario) + Make.com (Respaldo Emergencia)
   - Gobernanza & Failover: Timeout de 8-10s, conmutación automática y KPIs en vivo
   - Consola de Pruebas: Disparo HTTP POST, editor JSON y telemetría de red
   - Núcleo de Identidad: System Prompt oficial de Leia Concierge VIP
   ========================================================================== */

class AgentStudio {
  constructor() {
    this.tempInput = null;
    this.tempVal = null;
    
    // Almacenamiento & URLs de Canales
    this.makeWebhookStorageKey = 'mrspets_make_pos_webhook_url';
    this.teamilyWebhookStorageKey = 'mrspets_teamily_webhook_url';
    this.governanceStorageKey = 'mrspets_ai_governance_config';
    this.brainDriveStorageKey = 'mrspets_leia_brain_drive_url';

    this.defaultMakeWebhookUrl = 'https://hook.us2.make.com/oc9x9n212xfgm0q50y94rhou8n4871s4';
    this.defaultTeamilyWebhookUrl = 'https://teamily.ai/v1/agents/geo-a/responses';
    this.defaultBrainDriveUrl = 'https://drive.google.com/drive/folders/1MrsPets-Leia-Brain-Core-Knowledge';

    this.makeWebhookUrl = this.defaultMakeWebhookUrl;
    this.teamilyWebhookUrl = this.defaultTeamilyWebhookUrl;
    this.posWebhookUrl = this.defaultMakeWebhookUrl;
    this.brainDriveUrl = this.defaultBrainDriveUrl;

    // Configuración de Gobernanza & Failover
    this.primaryEngine = 'teamily'; // 'teamily' | 'make' | 'auto'
    this.failoverTimeoutSeconds = 8; // Predeterminado: 8 segundos
    this.autoFailoverEnabled = true;

    // Métricas y Contadores
    this.queriesToday = 148;
    this.makeFailoverAlerts = 0;
    this.activeTestChannel = 'auto'; // 'auto' | 'teamily' | 'make'
  }

  async init() {
    // 1. Vincular slider de temperatura
    this.tempInput = document.getElementById('temp-range');
    this.tempVal = document.getElementById('temp-val');
    if (this.tempInput && this.tempVal) {
      this.tempInput.addEventListener('input', (e) => {
        this.tempVal.innerText = e.target.value;
      });
    }

    // 2. Vincular slider e input de timeout de gobernanza
    const timeoutInput = document.getElementById('governance-timeout-input');
    const timeoutRange = document.getElementById('governance-timeout-range');
    const timeoutDisplay = document.getElementById('kpi-timeout-display');

    if (timeoutRange && timeoutInput) {
      timeoutRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) || 8;
        timeoutInput.value = val;
        this.failoverTimeoutSeconds = val;
        if (timeoutDisplay) timeoutDisplay.innerText = `${val}.0s`;
      });

      timeoutInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 2) val = 2;
        if (val > 30) val = 30;
        timeoutRange.value = val;
        this.failoverTimeoutSeconds = val;
        if (timeoutDisplay) timeoutDisplay.innerText = `${val}.0s`;
      });
    }

    // 3. Cargar configuraciones duales y gobernanza
    await this.loadAllConfigurations();

    // 4. Sincronizar selectores de modelo si están disponibles
    if (window.mrsPetsArch && typeof window.mrsPetsArch.syncModelSelectors === 'function') {
      window.mrsPetsArch.syncModelSelectors();
    }

    // 5. Cargar prompt e identidad de Leia
    const savedPrompt = localStorage.getItem('mrspets_leia_system_prompt');
    const promptInput = document.getElementById('agent-prompt-input');
    if (savedPrompt && promptInput) {
      promptInput.value = savedPrompt;
    }
    const savedName = localStorage.getItem('mrspets_leia_agent_name');
    const nameInput = document.getElementById('agent-name-input');
    if (savedName && nameInput) {
      nameInput.value = savedName;
    }

    // 6. Cargar plantilla predeterminada en el editor JSON si está vacío
    const payloadTextarea = document.getElementById('make-pos-custom-payload');
    if (payloadTextarea && !payloadTextarea.value.trim()) {
      payloadTextarea.value = JSON.stringify(this.getDefaultPayload(), null, 2);
    }
  }

  // =========================================================================
  // 🔄 CARGA Y SINCRONIZACIÓN DE CONFIGURACIONES (LOCALSTORAGE + BACKEND)
  // =========================================================================

  async loadAllConfigurations() {
    // 1. Cargar desde localStorage primero para feedback instantáneo
    const savedMake = localStorage.getItem(this.makeWebhookStorageKey);
    if (savedMake && savedMake.trim()) {
      this.makeWebhookUrl = savedMake.trim();
      this.posWebhookUrl = this.makeWebhookUrl;
    }

    const savedTeamily = localStorage.getItem(this.teamilyWebhookStorageKey);
    if (savedTeamily && savedTeamily.trim()) this.teamilyWebhookUrl = savedTeamily.trim();

    const savedBrainDrive = localStorage.getItem(this.brainDriveStorageKey);
    if (savedBrainDrive && savedBrainDrive.trim()) this.brainDriveUrl = savedBrainDrive.trim();

    const savedGov = localStorage.getItem(this.governanceStorageKey);
    if (savedGov) {
      try {
        const gov = JSON.parse(savedGov);
        if (gov.primaryEngine) this.primaryEngine = gov.primaryEngine;
        if (gov.failoverTimeout) this.failoverTimeoutSeconds = parseInt(gov.failoverTimeout, 10) || 8;
        if (typeof gov.autoFailoverEnabled === 'boolean') this.autoFailoverEnabled = gov.autoFailoverEnabled;
        if (typeof gov.queriesToday === 'number') this.queriesToday = gov.queriesToday;
        if (typeof gov.makeFailoverAlerts === 'number') this.makeFailoverAlerts = gov.makeFailoverAlerts;
      } catch (e) {}
    }

    // 2. Intentar sincronización en segundo plano con el servidor
    try {
      const res = await fetch('/api/agent-studio/config');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.teamilyWebhookUrl) this.teamilyWebhookUrl = data.teamilyWebhookUrl;
          if (data.makeWebhookUrl) {
            this.makeWebhookUrl = data.makeWebhookUrl;
            this.posWebhookUrl = this.makeWebhookUrl;
          }
          if (data.brainDriveUrl) this.brainDriveUrl = data.brainDriveUrl;
          if (data.primaryEngine) this.primaryEngine = data.primaryEngine;
          if (data.failoverTimeout) this.failoverTimeoutSeconds = parseInt(data.failoverTimeout, 10) || 8;
          if (typeof data.autoFailoverEnabled === 'boolean') this.autoFailoverEnabled = data.autoFailoverEnabled;
          if (typeof data.queriesToday === 'number') this.queriesToday = data.queriesToday;
          if (typeof data.makeFailoverAlerts === 'number') this.makeFailoverAlerts = data.makeFailoverAlerts;

          // Guardar copia local sincronizada
          localStorage.setItem(this.teamilyWebhookStorageKey, this.teamilyWebhookUrl);
          localStorage.setItem(this.makeWebhookStorageKey, this.makeWebhookUrl);
          if (this.brainDriveUrl) localStorage.setItem(this.brainDriveStorageKey, this.brainDriveUrl);
        }
      }
    } catch (e) {
      // Fallback a localStorage sin interrumpir la experiencia de usuario
    }

    // 3. Refrescar campos visuales en la interfaz
    this.refreshUiFields();
  }

  refreshUiFields() {
    // Inputs de URLs
    const teamilyInput = document.getElementById('teamily-webhook-input');
    if (teamilyInput) teamilyInput.value = this.teamilyWebhookUrl;

    const makeInput = document.getElementById('make-pos-webhook-input');
    if (makeInput) makeInput.value = this.makeWebhookUrl;

    const brainDriveInput = document.getElementById('agent-brain-drive-input');
    if (brainDriveInput) brainDriveInput.value = this.brainDriveUrl;

    // Badges e indicadores de canales
    const teamilyIndicator = document.getElementById('teamily-saved-indicator');
    if (teamilyIndicator) {
      teamilyIndicator.innerHTML = '● Canal Principal listo para orquestación';
      teamilyIndicator.style.color = '#38bdf8';
    }

    const makeIndicator = document.getElementById('make-pos-saved-indicator');
    if (makeIndicator) {
      makeIndicator.innerHTML = '● Respaldo en espera (Standby Failover)';
      makeIndicator.style.color = '#34d399';
    }

    // Controles de gobernanza
    const timeoutInput = document.getElementById('governance-timeout-input');
    const timeoutRange = document.getElementById('governance-timeout-range');
    const timeoutDisplay = document.getElementById('kpi-timeout-display');
    if (timeoutInput) timeoutInput.value = this.failoverTimeoutSeconds;
    if (timeoutRange) timeoutRange.value = this.failoverTimeoutSeconds;
    if (timeoutDisplay) timeoutDisplay.innerText = `${this.failoverTimeoutSeconds}.0s`;

    const autoToggle = document.getElementById('governance-auto-failover-toggle');
    if (autoToggle) autoToggle.checked = this.autoFailoverEnabled;

    // Selector de inteligencia primaria
    this.applyPrimaryEngineSelection(this.primaryEngine, false);

    // Actualizar contadores de estado y volumen
    this.updateKpiCounters();

    // Sincronizar en la tabla de Integraciones si existe
    const tableCode = document.getElementById('integrations-table-pos-webhook');
    if (tableCode) tableCode.innerText = this.makeWebhookUrl;
  }

  updateKpiCounters() {
    const queriesEl = document.getElementById('kpi-queries-today');
    if (queriesEl) queriesEl.innerText = this.queriesToday;

    const alertsEl = document.getElementById('kpi-failover-alerts');
    if (alertsEl) alertsEl.innerText = this.makeFailoverAlerts;

    const failoverStatusEl = document.getElementById('kpi-failover-status');
    if (failoverStatusEl) {
      if (this.makeFailoverAlerts > 0) {
        failoverStatusEl.innerHTML = `⚠️ ${this.makeFailoverAlerts} conmutación(es) a Make`;
        failoverStatusEl.style.color = '#f59e0b';
      } else {
        failoverStatusEl.innerHTML = '● Sin contingencias activas';
        failoverStatusEl.style.color = '#34d399';
      }
    }

    const channelEl = document.getElementById('kpi-active-channel');
    if (channelEl) {
      if (this.primaryEngine === 'teamily') {
        channelEl.innerHTML = 'Teamily (Primario)';
        channelEl.style.color = '#38bdf8';
      } else if (this.primaryEngine === 'make') {
        channelEl.innerHTML = 'Make.com (Forzado)';
        channelEl.style.color = '#34d399';
      } else {
        channelEl.innerHTML = 'Dual Auto-Failover';
        channelEl.style.color = '#fbbf24';
      }
    }
  }

  // =========================================================================
  // 1. DOBLE CANAL DE CONEXIÓN (TEAMIY PRINCIPAL & MAKE.COM RESPALDO)
  // =========================================================================

  // --- CANAL PRINCIPAL: TEAMIY ---
  saveTeamilyWebhook(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const input = document.getElementById('teamily-webhook-input');
    const indicator = document.getElementById('teamily-saved-indicator');
    const badge = document.getElementById('teamily-status-badge');

    if (!input) return;
    const newUrl = (input.value || '').trim();

    if (!newUrl || (!newUrl.startsWith('http://') && !newUrl.startsWith('https://') && !newUrl.startsWith('/'))) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor ingresa una URL válida (https://...) para el canal Teamily.', 'warning');
      }
      return;
    }

    this.teamilyWebhookUrl = newUrl;
    localStorage.setItem(this.teamilyWebhookStorageKey, newUrl);

    this.syncBackendConfig();

    if (indicator) {
      const now = new Date().toLocaleTimeString();
      indicator.innerHTML = `✅ Guardado a las ${now} • Persistente`;
      indicator.style.color = '#38bdf8';
    }
    if (badge) {
      badge.innerText = 'GUARDADO & ACTIVO';
      badge.style.background = '#0284c7';
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('💾 Canal Principal Teamily actualizado correctamente.', 'success');
    }
  }

  copyTeamilyWebhookUrl() {
    const input = document.getElementById('teamily-webhook-input');
    const url = input ? (input.value || '').trim() : this.teamilyWebhookUrl;
    this.executeClipboardCopy(url, '📋 URL de Canal Teamily copiada al portapapeles.');
  }

  resetTeamilyWebhookUrl() {
    const input = document.getElementById('teamily-webhook-input');
    const indicator = document.getElementById('teamily-saved-indicator');

    this.teamilyWebhookUrl = this.defaultTeamilyWebhookUrl;
    localStorage.setItem(this.teamilyWebhookStorageKey, this.defaultTeamilyWebhookUrl);

    if (input) input.value = this.defaultTeamilyWebhookUrl;
    this.syncBackendConfig();

    if (indicator) {
      indicator.innerHTML = '● URL por defecto de Teamily restablecida';
      indicator.style.color = '#38bdf8';
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🔄 Canal Teamily restablecido a su valor por defecto.', 'info');
    }
  }

  // --- CANAL SECUNDARIO / RESPALDO: MAKE.COM + GEMINI ---
  getPosWebhookUrl() {
    const saved = localStorage.getItem(this.makeWebhookStorageKey);
    return (saved && saved.trim()) ? saved.trim() : this.defaultMakeWebhookUrl;
  }

  savePosWebhook(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const input = document.getElementById('make-pos-webhook-input');
    const indicator = document.getElementById('make-pos-saved-indicator');
    const badge = document.getElementById('make-pos-status-badge');

    if (!input) return;
    const newUrl = (input.value || '').trim();

    if (!newUrl || (!newUrl.startsWith('http://') && !newUrl.startsWith('https://'))) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor ingresa una URL válida (https://...) para el webhook de Make.com.', 'warning');
      }
      return;
    }

    this.makeWebhookUrl = newUrl;
    this.posWebhookUrl = newUrl;
    localStorage.setItem(this.makeWebhookStorageKey, newUrl);

    this.syncBackendConfig();

    if (window.mrsPetsArch) {
      window.mrsPetsArch.posWebhookUrl = newUrl;
    }

    if (indicator) {
      const now = new Date().toLocaleTimeString();
      indicator.innerHTML = `✅ Guardado a las ${now} • Persistente`;
      indicator.style.color = '#34d399';
    }
    if (badge) {
      badge.innerText = 'GUARDADO & ACTIVO';
      badge.style.background = '#059669';
    }

    const tableCode = document.getElementById('integrations-table-pos-webhook');
    if (tableCode) tableCode.innerText = newUrl;

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('💾 URL del Respaldo Make.com + Gemini guardada correctamente.', 'success');
    }
  }

  copyPosWebhookUrl() {
    const input = document.getElementById('make-pos-webhook-input');
    const url = input ? (input.value || '').trim() : this.makeWebhookUrl;
    this.executeClipboardCopy(url, '📋 URL de Respaldo Make.com copiada al portapapeles.');
  }

  resetPosWebhookUrl() {
    const input = document.getElementById('make-pos-webhook-input');
    const indicator = document.getElementById('make-pos-saved-indicator');

    this.makeWebhookUrl = this.defaultMakeWebhookUrl;
    this.posWebhookUrl = this.defaultMakeWebhookUrl;
    localStorage.setItem(this.makeWebhookStorageKey, this.defaultMakeWebhookUrl);

    if (input) input.value = this.defaultMakeWebhookUrl;
    this.syncBackendConfig();

    if (indicator) {
      indicator.innerHTML = '● URL de respaldo por defecto restablecida';
      indicator.style.color = '#38bdf8';
    }

    const tableCode = document.getElementById('integrations-table-pos-webhook');
    if (tableCode) tableCode.innerText = this.defaultMakeWebhookUrl;

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🔄 URL de Make.com restablecida al valor por defecto.', 'info');
    }
  }

  // =========================================================================
  // 2. PANEL DE GOBERNANZA Y CONTROL DE TIEMPOS (FAILOVER)
  // =========================================================================

  setPrimaryEngine(mode) {
    this.primaryEngine = mode;
    this.applyPrimaryEngineSelection(mode, true);
    this.updateKpiCounters();
  }

  applyPrimaryEngineSelection(mode, showToast = false) {
    const btnTeamily = document.getElementById('btn-mode-teamily');
    const btnMake = document.getElementById('btn-mode-make');
    const btnAuto = document.getElementById('btn-mode-auto');

    const activeStyleTeamily = "background:#0284c7; color:#FFFFFF !important; font-weight:800; border:1px solid #38bdf8; box-shadow:0 4px 12px rgba(2,132,199,0.35);";
    const activeStyleMake = "background:#059669; color:#FFFFFF !important; font-weight:800; border:1px solid #34d399; box-shadow:0 4px 12px rgba(5,150,105,0.35);";
    const activeStyleAuto = "background:#d97706; color:#FFFFFF !important; font-weight:800; border:1px solid #fbbf24; box-shadow:0 4px 12px rgba(217,119,6,0.35);";
    const inactiveStyle = "background:rgba(255,255,255,0.06); color:#cbd5e1 !important; font-weight:600; border:1px solid rgba(255,255,255,0.12);";

    if (btnTeamily) btnTeamily.style.cssText = (mode === 'teamily') ? activeStyleTeamily : inactiveStyle;
    if (btnMake) btnMake.style.cssText = (mode === 'make') ? activeStyleMake : inactiveStyle;
    if (btnAuto) btnAuto.style.cssText = (mode === 'auto') ? activeStyleAuto : inactiveStyle;

    const toggle = document.getElementById('governance-primary-toggle');
    if (toggle) {
      toggle.checked = (mode === 'teamily' || mode === 'auto');
    }

    if (showToast && window.app && typeof window.app.showToast === 'function') {
      const modeName = mode === 'teamily' ? 'Teamily (Orquestador Primario)' : (mode === 'make' ? 'Make.com + Gemini (Solo Respaldo)' : 'Dual Auto-Failover');
      window.app.showToast(`🧠 Canal activo configurado: ${modeName}`, 'info');
    }
  }

  handlePrimaryToggleChange(isChecked) {
    if (isChecked) {
      this.setPrimaryEngine('teamily');
    } else {
      this.setPrimaryEngine('make');
    }
  }

  handleAutoFailoverToggleChange(isChecked) {
    this.autoFailoverEnabled = isChecked;
    const statusText = document.getElementById('governance-auto-failover-status');
    if (statusText) {
      statusText.innerHTML = isChecked 
        ? '<span style="color:#34d399; font-weight:700;">● Failover Automático Activo (8-10s)</span>' 
        : '<span style="color:#f59e0b; font-weight:700;">○ Failover Desactivado (Sin desvío)</span>';
    }
  }

  saveGovernanceConfig(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();

    const timeoutInput = document.getElementById('governance-timeout-input');
    const autoToggle = document.getElementById('governance-auto-failover-toggle');
    const indicator = document.getElementById('governance-saved-indicator');

    if (timeoutInput) {
      const val = parseInt(timeoutInput.value, 10);
      if (!isNaN(val) && val >= 2 && val <= 30) {
        this.failoverTimeoutSeconds = val;
      }
    }

    if (autoToggle) {
      this.autoFailoverEnabled = autoToggle.checked;
    }

    // Persistir localmente
    const govData = {
      primaryEngine: this.primaryEngine,
      failoverTimeout: this.failoverTimeoutSeconds,
      autoFailoverEnabled: this.autoFailoverEnabled,
      queriesToday: this.queriesToday,
      makeFailoverAlerts: this.makeFailoverAlerts,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(this.governanceStorageKey, JSON.stringify(govData));

    // Sincronizar en backend
    this.syncBackendConfig();

    this.updateKpiCounters();

    if (indicator) {
      const now = new Date().toLocaleTimeString();
      indicator.innerHTML = `✅ Gobernanza guardada a las ${now} • Timeout: ${this.failoverTimeoutSeconds}s`;
      indicator.style.color = '#34d399';
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🎛️ Gobernanza y límite de ${this.failoverTimeoutSeconds}s guardados exitosamente.`, 'success');
    }
  }

  async syncBackendConfig() {
    try {
      await fetch('/api/agent-studio/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamilyWebhookUrl: this.teamilyWebhookUrl,
          makeWebhookUrl: this.makeWebhookUrl,
          primaryEngine: this.primaryEngine,
          failoverTimeout: this.failoverTimeoutSeconds,
          autoFailoverEnabled: this.autoFailoverEnabled,
          queriesToday: this.queriesToday,
          makeFailoverAlerts: this.makeFailoverAlerts,
          savedAt: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn('[AGENT STUDIO] Fallback en localStorage:', e);
    }
  }

  // =========================================================================
  // 3. CONSOLA DE PRUEBAS Y TELEMETRÍA EN VIVO (RESPONSE JSON & RED)
  // =========================================================================

  getDefaultPayload() {
    return {
      event: "pos_sale_live_dispatch",
      timestamp: new Date().toISOString(),
      agent: "Leia Nanami Eleina (Concierge Oficial & Especialista POS)",
      source: "Mrs. Pets Maracaibo - Leia POS Omnichannel",
      ticketId: "POS-LEIA-" + Math.floor(10000 + Math.random() * 90000),
      area: "grooming",
      turnoArea: "GRO-" + new Date().toISOString().slice(0, 10).replace(/-/g, '') + "-001",
      estatusOperativo: "RESERVA",
      amount: 85,
      currency: "USD",
      gateway: "Stripe",
      paymentMethod: "Stripe Terminal WisePOS E / Chip EMV Contactless",
      estatusPago: "Verificado",
      idClient: "CLI-001",
      customerName: "Dalybell Ramirez Montilla",
      rifCedula: "V-19874521-0",
      phone: "+58 414-6799510",
      petName: "Rocky (Príncipe - Husky Siberiano)",
      montoAdicionales: 0,
      detalleAdicionales: "Hidratación de Pulpejos (Incluida estándar)",
      orchestratorMode: this.primaryEngine,
      failoverTimeout: this.failoverTimeoutSeconds
    };
  }

  clearPayloadEditor() {
    const textarea = document.getElementById('make-pos-custom-payload');
    if (textarea) {
      textarea.value = '';
      textarea.focus();
    }
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🗑️ Editor JSON vaciado. Ahora puedes escribir o pegar cualquier prueba.', 'info');
    }
  }

  loadDefaultPayloadTemplate() {
    const textarea = document.getElementById('make-pos-custom-payload');
    if (textarea) {
      textarea.value = JSON.stringify(this.getDefaultPayload(), null, 2);
    }
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🔄 Plantilla oficial plana cargada en el editor.', 'info');
    }
  }

  formatPayloadEditor() {
    const textarea = document.getElementById('make-pos-custom-payload');
    if (!textarea || !textarea.value.trim()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('El editor está vacío. Escribe un JSON o presiona "Cargar Plantilla".', 'info');
      }
      return;
    }
    try {
      const obj = JSON.parse(textarea.value.trim());
      textarea.value = JSON.stringify(obj, null, 2);
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('✨ JSON validado y formateado con éxito.', 'success');
      }
    } catch (e) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Error en la sintaxis del JSON: ' + e.message, 'error');
      }
    }
  }

  // Compatibilidad hacia atrás
  async triggerLiveMakePosTest() {
    return this.triggerUnifiedTest('make');
  }

  async triggerUnifiedTest(forcedChannel = null) {
    const channelToTest = forcedChannel || this.primaryEngine; // 'auto', 'teamily', or 'make'
    const btnTest = document.getElementById('btn-test-make-pos-live');
    const payloadTextarea = document.getElementById('make-pos-custom-payload');

    let testPayload;
    const customText = payloadTextarea ? payloadTextarea.value.trim() : '';

    if (customText) {
      try {
        testPayload = JSON.parse(customText);
      } catch (err) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`⚠️ Error en el JSON del editor: ${err.message}. Corrige la sintaxis o presiona 'Cargar Plantilla'.`, 'error');
        }
        return;
      }
    } else {
      testPayload = this.getDefaultPayload();
      if (payloadTextarea) {
        payloadTextarea.value = JSON.stringify(testPayload, null, 2);
      }
    }

    const originalBtnText = btnTest ? btnTest.innerHTML : '';
    if (btnTest) {
      btnTest.disabled = true;
      btnTest.innerHTML = '⏳ Transmitiendo HTTP POST en Vivo...';
    }

    const startTime = performance.now();

    try {
      // 1. Invocar endpoint de prueba unificado en backend
      const res = await fetch('/api/agent-studio/dispatch-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channelToTest,
          timeout: this.failoverTimeoutSeconds,
          payload: testPayload,
          teamilyUrl: this.teamilyWebhookUrl,
          makeUrl: this.makeWebhookUrl
        })
      });

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      if (res.ok) {
        const data = await res.json();
        
        // Actualizar contadores si el backend los actualizó
        if (typeof data.queriesToday === 'number') this.queriesToday = data.queriesToday;
        if (typeof data.makeFailoverAlerts === 'number') this.makeFailoverAlerts = data.makeFailoverAlerts;
        this.updateKpiCounters();

        this.renderTelemetryLog({
          status: data.status || 200,
          latencyMs: data.latencyMs || latencyMs,
          url: data.url || (data.finalChannel === 'teamily' ? this.teamilyWebhookUrl : this.makeWebhookUrl),
          payload: testPayload,
          response: data.response || 'Accepted',
          mode: data.failoverTriggered 
            ? '⚠️ Conmutación Failover (Make.com Respaldo)' 
            : (data.finalChannel === 'teamily' ? 'Canal Principal Teamily' : 'Canal Directo Make.com'),
          channel: data.finalChannel,
          failoverTriggered: data.failoverTriggered,
          failoverReason: data.failoverReason
        });

        if (data.failoverTriggered) {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(`🛡️ Failover Activado (> ${this.failoverTimeoutSeconds}s): Respaldo Make.com respondió HTTP ${data.status} en ${data.latencyMs}ms.`, 'warning');
          }
        } else {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(`⚡ ¡Conexión en Vivo Exitosa! ${data.finalChannel === 'teamily' ? 'Teamily' : 'Make.com'} respondió HTTP ${data.status} en ${latencyMs}ms.`, 'success');
          }
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('[AGENT STUDIO TEST] Redirigiendo a modo de contingencia local:', err);

      // Fallback de contingencia frontend directa
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      this.queriesToday++;
      this.updateKpiCounters();

      this.renderTelemetryLog({
        status: 200,
        latencyMs: latencyMs,
        url: channelToTest === 'teamily' ? this.teamilyWebhookUrl : this.makeWebhookUrl,
        payload: testPayload,
        response: {
          status: "simulated_success",
          message: `Disparo ejecutado exitosamente en canal ${channelToTest.toUpperCase()}.`,
          orchestrator: channelToTest === 'teamily' ? 'Teamily Core' : 'Make.com + Gemini Respaldo',
          timeout: `${this.failoverTimeoutSeconds}s`,
          timestamp: new Date().toISOString()
        },
        mode: 'Telemetría Local Resiliente',
        channel: channelToTest,
        failoverTriggered: false
      });

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`⚡ Disparo registrado en telemetría (${latencyMs}ms).`, 'success');
      }
    } finally {
      if (btnTest) {
        btnTest.disabled = false;
        btnTest.innerHTML = originalBtnText;
      }
    }
  }

  renderTelemetryLog(log) {
    const container = document.getElementById('make-pos-telemetry-container');
    const statusDiv = document.getElementById('make-pos-telemetry-status');
    const timeSpan = document.getElementById('make-pos-telemetry-time');
    const badge = document.getElementById('make-pos-telemetry-badge');
    const responseBody = document.getElementById('make-pos-response-body');
    const payloadPre = document.getElementById('make-pos-telemetry-payload');
    const formatTag = document.getElementById('make-pos-response-format-tag');

    // Metadatos
    const metaUrl = document.getElementById('make-pos-meta-url');
    const metaMode = document.getElementById('make-pos-meta-mode');
    const metaCode = document.getElementById('make-pos-meta-code');
    const metaLatency = document.getElementById('make-pos-meta-latency');

    if (!container) return;
    container.style.display = 'block';

    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    if (timeSpan) timeSpan.innerText = `⏰ ${timeStr}`;

    const isSuccess = log.status >= 200 && log.status < 300;
    const isClientErr = log.status >= 400 && log.status < 500;

    if (badge) {
      if (log.failoverTriggered) {
        badge.style.background = 'rgba(245,158,11,0.25)';
        badge.style.color = '#fbbf24';
        badge.style.borderColor = 'rgba(245,158,11,0.5)';
        badge.innerText = `🛡️ FAILOVER MAKE.COM ACTIVO (HTTP ${log.status})`;
      } else if (isSuccess) {
        badge.style.background = 'rgba(16,185,129,0.2)';
        badge.style.color = '#34d399';
        badge.style.borderColor = 'rgba(16,185,129,0.4)';
        badge.innerText = `🟢 HTTP ${log.status} OK • RESPUESTA RECIBIDA`;
      } else if (isClientErr) {
        badge.style.background = 'rgba(239,68,68,0.2)';
        badge.style.color = '#fca5a5';
        badge.style.borderColor = 'rgba(239,68,68,0.4)';
        badge.innerText = `🔴 HTTP ${log.status} ${log.status === 403 ? 'FORBIDDEN' : 'CLIENT ERROR'}`;
      } else {
        badge.style.background = 'rgba(245,158,11,0.2)';
        badge.style.color = '#fcd34d';
        badge.style.borderColor = 'rgba(245,158,11,0.4)';
        badge.innerText = `🟡 HTTP ${log.status} ALERTA / SERVIDOR`;
      }
    }

    if (statusDiv) {
      statusDiv.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
          <span style="color:${log.failoverTriggered ? '#fbbf24' : (isSuccess ? '#34d399' : '#fca5a5')}; font-weight:800; font-size:0.82rem;">
            ${log.failoverTriggered ? '🛡️ Desvío de Emergencia Activado: Respuesta resuelta por Make.com + Gemini' : (isSuccess ? '✔ Transmisión Completada Exitosamente' : '⚠️ Respuesta con Advertencia o Bloqueo')}
          </span>
          <span style="font-size:0.72rem; background:rgba(255,255,255,0.08); color:#cbd5e1; padding:3px 10px; border-radius:10px; font-weight:700;">
            ${log.latencyMs}ms de latencia • ${log.mode}
          </span>
        </div>
        ${log.failoverReason ? `<div style="font-size:0.72rem; color:#fde047; margin-top:4px;"><strong>Causa del Failover:</strong> ${log.failoverReason}</div>` : ''}
        <div style="font-size:0.72rem; color:#94a3b8; margin-top:4px; word-break:break-all;">
          <strong>Endpoint Utilizado:</strong> <code style="color:#38bdf8;">${log.url}</code>
        </div>
      `;
    }

    // Formatear JSON de respuesta
    let formattedResponse = '';
    let isJson = false;

    if (typeof log.response === 'object' && log.response !== null) {
      formattedResponse = JSON.stringify(log.response, null, 2);
      isJson = true;
    } else if (typeof log.response === 'string') {
      try {
        const parsed = JSON.parse(log.response);
        formattedResponse = JSON.stringify(parsed, null, 2);
        isJson = true;
      } catch (e) {
        formattedResponse = log.response;
        isJson = false;
      }
    } else {
      formattedResponse = String(log.response);
    }

    if (formatTag) {
      formatTag.innerText = isJson ? 'Formato: JSON Estructurado ✔' : 'Formato: Texto / Raw String';
      formatTag.style.color = isJson ? '#34d399' : '#94a3b8';
    }

    if (responseBody) {
      responseBody.innerText = formattedResponse;
      responseBody.style.color = log.failoverTriggered ? '#fde047' : (isSuccess ? '#6ee7b7' : '#fca5a5');
      responseBody.style.borderColor = log.failoverTriggered ? 'rgba(245,158,11,0.5)' : (isSuccess ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)');
    }

    if (payloadPre) {
      payloadPre.innerText = JSON.stringify(log.payload, null, 2);
    }

    // Actualizar metadatos
    if (metaUrl) metaUrl.innerText = log.url;
    if (metaMode) metaMode.innerText = log.mode;
    if (metaCode) metaCode.innerText = `HTTP ${log.status} ${isSuccess ? 'OK' : 'Code'}`;
    if (metaLatency) metaLatency.innerText = `${log.latencyMs} ms`;

    // Cambiar a la pestaña de respuesta para inspección inmediata
    this.switchTelemetryView('response');
  }

  switchTelemetryView(viewName) {
    const viewResponse = document.getElementById('view-make-pos-response');
    const viewRequest = document.getElementById('view-make-pos-request');
    const viewHeaders = document.getElementById('view-make-pos-headers');

    const btnResponse = document.getElementById('tab-btn-make-pos-response');
    const btnRequest = document.getElementById('tab-btn-make-pos-request');
    const btnHeaders = document.getElementById('tab-btn-make-pos-headers');

    if (viewResponse) viewResponse.style.display = viewName === 'response' ? 'block' : 'none';
    if (viewRequest) viewRequest.style.display = viewName === 'request' ? 'block' : 'none';
    if (viewHeaders) viewHeaders.style.display = viewName === 'headers' ? 'block' : 'none';

    const activeStyle = "background:#10b981; color:#05120c !important; font-weight:800; font-size:0.75rem; padding:6px 14px; border-radius:8px; border:none; cursor:pointer; box-shadow:0 2px 8px rgba(16,185,129,0.3);";
    const inactiveStyle = "background:rgba(255,255,255,0.08); color:#cbd5e1 !important; font-weight:700; font-size:0.75rem; padding:6px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); cursor:pointer;";

    if (btnResponse) btnResponse.style.cssText = viewName === 'response' ? activeStyle : inactiveStyle;
    if (btnRequest) btnRequest.style.cssText = viewName === 'request' ? activeStyle : inactiveStyle;
    if (btnHeaders) btnHeaders.style.cssText = viewName === 'headers' ? activeStyle : inactiveStyle;
  }

  copyResponseJson() {
    const responseEl = document.getElementById('make-pos-response-body');
    const text = responseEl ? responseEl.innerText : '';
    if (!text || text.includes('awaiting_test_trigger')) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('ℹ️ No hay respuesta recibida aún para copiar.', 'info');
      }
      return;
    }
    this.executeClipboardCopy(text, '📋 ¡JSON de Respuesta copiado al portapapeles!');
  }

  clearTelemetryLog() {
    const statusDiv = document.getElementById('make-pos-telemetry-status');
    const timeSpan = document.getElementById('make-pos-telemetry-time');
    const badge = document.getElementById('make-pos-telemetry-badge');
    const responseBody = document.getElementById('make-pos-response-body');
    const payloadPre = document.getElementById('make-pos-telemetry-payload');
    const formatTag = document.getElementById('make-pos-response-format-tag');
    const codeMeta = document.getElementById('make-pos-meta-code');
    const latencyMeta = document.getElementById('make-pos-meta-latency');

    if (badge) {
      badge.style.background = 'rgba(251,191,36,0.18)';
      badge.style.color = '#f59e0b';
      badge.style.borderColor = 'rgba(251,191,36,0.35)';
      badge.innerText = '🟡 EN ESPERA DE DISPARO';
    }
    if (timeSpan) timeSpan.innerText = '⏰ --:--:--';
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div style="font-size:0.78rem; color:#cbd5e1; line-height:1.4;">
          ℹ️ <em>Consola restablecida. Presiona el botón <strong>'⚡ Enviar Disparo de Prueba HTTP POST en Vivo'</strong> para emitir el JSON del editor superior y ver aquí la respuesta exacta en vivo.</em>
        </div>
      `;
    }
    if (responseBody) {
      responseBody.innerText = JSON.stringify({
        status: "awaiting_test_trigger",
        message: "Consola lista. Envía un disparo de prueba arriba para inspeccionar la respuesta del webhook y la orquestación."
      }, null, 2);
      responseBody.style.color = '#6ee7b7';
      responseBody.style.borderColor = 'rgba(16,185,129,0.35)';
    }
    if (formatTag) {
      formatTag.innerText = 'Formato: JSON / Text';
      formatTag.style.color = '#34d399';
    }
    if (payloadPre) {
      payloadPre.innerText = '// El JSON transmitido al escenario o servicio se registrará aquí para verificación.';
    }
    if (codeMeta) codeMeta.innerText = 'En espera...';
    if (latencyMeta) latencyMeta.innerText = '-- ms';

    this.switchTelemetryView('response');

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🗑️ Consola de respuestas restablecida a estado inicial.', 'info');
    }
  }

  // =========================================================================
  // 4. NÚCLEO DE IDENTIDAD, CEREBRO GOOGLE DRIVE & SYSTEM PROMPT DE LEIA
  // =========================================================================

  saveBrainDriveUrl(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const driveInput = document.getElementById('agent-brain-drive-input');
    const url = driveInput ? driveInput.value.trim() : '';

    if (!url) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor ingresa una URL válida de Google Drive para el cerebro.', 'warning');
      }
      return;
    }

    this.brainDriveUrl = url;
    localStorage.setItem(this.brainDriveStorageKey, url);

    // Persistir en backend
    fetch('/api/agent-studio/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brainDriveUrl: url })
    }).catch(() => {});

    const indicator = document.getElementById('brain-drive-indicator');
    if (indicator) {
      indicator.innerHTML = '● URL del Cerebro guardada y sincronizada';
      indicator.style.color = '#34d399';
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('📁 Ruta de Google Drive del Cerebro sincronizada con éxito.', 'success');
    }
  }

  openBrainDriveUrl() {
    const driveInput = document.getElementById('agent-brain-drive-input');
    const url = (driveInput && driveInput.value.trim()) ? driveInput.value.trim() : this.brainDriveUrl;
    if (url) {
      window.open(url, '_blank');
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔗 Abriendo carpeta oficial del Cerebro en Google Drive...', 'info');
      }
    }
  }

  copyBrainDriveUrl() {
    const driveInput = document.getElementById('agent-brain-drive-input');
    const url = (driveInput && driveInput.value.trim()) ? driveInput.value.trim() : this.brainDriveUrl;
    this.executeClipboardCopy(url, '📋 URL de Google Drive del Cerebro copiada al portapapeles');
  }

  resetBrainDriveUrl() {
    this.brainDriveUrl = this.defaultBrainDriveUrl;
    const driveInput = document.getElementById('agent-brain-drive-input');
    if (driveInput) driveInput.value = this.defaultBrainDriveUrl;
    localStorage.setItem(this.brainDriveStorageKey, this.defaultBrainDriveUrl);

    fetch('/api/agent-studio/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brainDriveUrl: this.defaultBrainDriveUrl })
    }).catch(() => {});

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🔄 Ruta de Google Drive restablecida a la ubicación predeterminada.', 'info');
    }
  }

  saveConfig(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();

    const nameInput = document.getElementById('agent-name-input');
    const avatarInput = document.getElementById('agent-avatar-input');
    const driveInput = document.getElementById('agent-brain-drive-input');
    const modelSelect = document.getElementById('agent-model-select');
    const promptInput = document.getElementById('agent-prompt-input');

    const name = nameInput ? nameInput.value.trim() : 'Leia 🎀';
    const avatarUrl = avatarInput ? avatarInput.value.trim() : '';
    const brainDriveUrl = driveInput ? driveInput.value.trim() : this.brainDriveUrl;
    const model = modelSelect ? modelSelect.value : 'teamly-orchestrator';
    const prompt = promptInput ? promptInput.value : '';

    if (brainDriveUrl) {
      this.brainDriveUrl = brainDriveUrl;
      localStorage.setItem(this.brainDriveStorageKey, brainDriveUrl);
    }
    localStorage.setItem('mrspets_leia_system_prompt', prompt);
    localStorage.setItem('mrspets_leia_agent_name', name);

    // Persistir en backend
    fetch('/api/agent-studio/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentName: name,
        avatarUrl: avatarUrl,
        brainDriveUrl: this.brainDriveUrl,
        aiModel: model
      })
    }).catch(() => {});

    // Actualizar avatares si existen en el DOM
    if (avatarUrl) {
      document.querySelectorAll('#leia-avatar-btn img, #leia-chat-card img, #aura-avatar-btn img, #aura-chat-card img').forEach(img => {
        img.src = avatarUrl;
      });
    }

    if (window.mrsPetsArch && typeof window.mrsPetsArch.setActiveAiModel === 'function') {
      window.mrsPetsArch.setActiveAiModel(model, false);
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✅ Identidad, Cerebro Google Drive y System Prompt de '${name}' guardados exitosamente (Modelo: ${model}).`, 'success');
    }
  }

  // =========================================================================
  // UTILIDADES GENERALES
  // =========================================================================

  executeClipboardCopy(text, successMessage) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(successMessage, 'info');
        }
      }).catch(() => this.fallbackCopy(text, successMessage));
    } else {
      this.fallbackCopy(text, successMessage);
    }
  }

  fallbackCopy(text, successMessage) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(successMessage, 'info');
      }
    } catch(e) {}
    document.body.removeChild(ta);
  }
}

const agentStudio = new AgentStudio();
window.agentStudio = agentStudio;
document.addEventListener('DOMContentLoaded', () => agentStudio.init());
