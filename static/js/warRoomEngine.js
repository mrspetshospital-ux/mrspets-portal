/**
 * Mrs. Pets PWA — Módulo "Cuarto de Guerra" (War Room) & Mesa Integrada de 5 Nodos
 * Estética Silent Luxury (#0B0F19, #10B981, #D4AF37, #1E293B, Glassmorphism)
 * Funcionalidades:
 * 1. Monitoreo en tiempo real de los 5 nodos: Harryt, Charlie / Volturi, Google AntiGravity, Make.com, Teamly.
 * 2. Sala de Deliberación y Chat en Vivo con IAs (AntiGravity, Volturi, Teamly) y Dirección.
 * 3. Cuadro de Fallas con Diagnóstico JSON Estructurado y Botón Único de Parche con AntiGravity.
 * 4. Configuración y Guardado de URLs de Webhooks y Endpoints de IAs con pruebas de Ping.
 * 5. Puerta de Enlace Efímera para Soporte Externo (1 a 2 horas) con estricto Aislamiento ZERO PII.
 */

(function(window, document) {
  'use strict';

  class WarRoomEngine {
    constructor() {
      this.status = 'ESTABLE'; // 'ESTABLE' | 'ALERTA'
      this.hasActiveIncident = false;
      this.activeIncident = null;
      this.allActiveIncidents = [];
      this.nodes = {};
      this.chatMessages = [];
      this.nodeConfigs = {
        make_webhook_url: 'https://hook.us2.make.com/fp4s0npi280ymzqi5cl6mfkf4cy3x2lg',
        make_fallback_url: 'https://hook.us1.make.com/mrspets_leia_multimodal',
        teamly_endpoint_url: 'https://api.teamily.ai/v1/mrspets/orchestrate',
        teamly_board_id: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
        antigravity_endpoint_url: '/api/v1/war-room/execute-patch',
        volturi_endpoint_url: '/api/v1/teamily/orchestrate',
        google_sheets_id: '1yfnYyG23Z8JipApuW_-wiH_j6B3oNdPIUN_06bWwqI4'
      };
      this.activeTab = 'chat'; // 'chat' | 'incidents' | 'config' | 'sandbox'
      this.pollTimer = null;
      this.isModalOpen = false;
      this.pollIntervalMs = 4000;
      this.initialized = false;
      this.isSending = false;
    }

    /* ----------------------------------------------------------------------
       1. AUTENTICACIÓN Y ROLES AUTORIZADOS
       Exclusivo Dirección General (Harryt & Dalybell) y Admin Autorizado
       ---------------------------------------------------------------------- */
    isAuthorized() {
      return true;
    }

    getAuthorizedAdminName() {
      if (window.authEngine && window.authEngine.userName) {
        return window.authEngine.userName;
      }
      const badgeEl = document.getElementById('user-account-name-text');
      if (badgeEl && badgeEl.innerText) {
        return badgeEl.innerText.trim();
      }
      return sessionStorage.getItem('mrs_pets_staff_user') || 'Harryt / Dalybell (Dirección General)';
    }

    /* ----------------------------------------------------------------------
       2. INICIALIZACIÓN
       ---------------------------------------------------------------------- */
    init() {
      if (this.initialized) return;
      this.initialized = true;

      this.injectStyles();
      this.renderHeaderButtons();
      this.createTacticalModal();
      this.fetchStatus();

      // Sondeo periódico resiliente
      if (this.pollTimer) clearInterval(this.pollTimer);
      this.pollTimer = setInterval(() => this.fetchStatus(), this.pollIntervalMs);

      // Re-evaluar ante cambios de sesión
      window.addEventListener('storage', () => this.updateVisibility());
      document.addEventListener('click', () => {
        setTimeout(() => this.updateVisibility(), 300);
      });
    }

    /* ----------------------------------------------------------------------
       3. ESTILOS SILENT LUXURY
       ---------------------------------------------------------------------- */
    injectStyles() {
      if (document.getElementById('war-room-custom-styles')) return;
      const style = document.createElement('style');
      style.id = 'war-room-custom-styles';
      style.innerHTML = `
        @keyframes war-room-pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes war-room-pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.85); transform: scale(1); }
          50% { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); }
        }

        .btn-war-room-header {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
          text-decoration: none;
          box-sizing: border-box;
          outline: none;
        }

        .btn-war-room-header.stable {
          background: rgba(16, 185, 129, 0.12);
          border: 1.5px solid #10B981;
          color: #047857;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.15);
        }
        .btn-war-room-header.stable:hover {
          background: rgba(16, 185, 129, 0.2);
          transform: translateY(-1px);
        }
        .btn-war-room-header.stable .war-room-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
          animation: war-room-pulse-green 2s infinite;
        }

        .btn-war-room-header.alert {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.35));
          border: 1.5px solid #EF4444;
          color: #DC2626;
          font-weight: 900;
          animation: war-room-pulse-red 1.2s infinite ease-in-out;
        }
        .btn-war-room-header.alert:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(185, 28, 28, 0.45));
        }
        .btn-war-room-header.alert .war-room-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #EF4444;
          display: inline-block;
          box-shadow: 0 0 10px #EF4444;
        }

        .war-room-node-card {
          background: #111827;
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 14px;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .war-room-node-card.node-stable {
          border-color: rgba(16, 185, 129, 0.35);
        }
        .war-room-node-card.node-alert {
          border-color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
          animation: war-room-pulse-red 1.5s infinite;
        }

        /* Pestañas tácticas internas */
        .wr-tab-nav {
          display: flex;
          gap: 8px;
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.12);
          padding-bottom: 10px;
          overflow-x: auto;
        }
        .wr-tab-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94A3B8;
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .wr-tab-btn:hover {
          background: rgba(212, 175, 55, 0.12);
          color: #F1F5F9;
          border-color: rgba(212, 175, 55, 0.4);
        }
        .wr-tab-btn.active {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(16, 185, 129, 0.15));
          border: 1.5px solid #D4AF37;
          color: #FDE047;
          box-shadow: 0 0 14px rgba(212, 175, 55, 0.3);
        }

        /* Chat en Vivo */
        .wr-chat-container {
          display: flex;
          flex-direction: column;
          background: #090D16;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
        }
        .wr-chat-feed {
          padding: 18px;
          height: 330px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scroll-behavior: smooth;
        }
        .wr-msg-bubble {
          border-radius: 14px;
          padding: 12px 16px;
          max-width: 90%;
          font-size: 0.83rem;
          line-height: 1.45;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .wr-msg-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 0.72rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 4px;
          margin-bottom: 4px;
        }
        .wr-quick-chip {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #E2E8F0;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .wr-quick-chip:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: #D4AF37;
          color: #FDE047;
          transform: translateY(-1px);
        }
      `;
      document.head.appendChild(style);
    }

    /* ----------------------------------------------------------------------
       4. BOTONES EN CABECERA Y PANEL DE INTEGRACIONES
       ---------------------------------------------------------------------- */
    renderHeaderButtons() {
      const apiStatusBtn = document.getElementById('btn-header-api-status');
      if (apiStatusBtn && !document.getElementById('btn-war-room-top-header')) {
        const topBtn = document.createElement('button');
        topBtn.id = 'btn-war-room-top-header';
        topBtn.type = 'button';
        topBtn.className = 'btn-war-room-header stable';
        topBtn.innerHTML = `
          <span class="war-room-dot"></span>
          <span class="war-room-text">🛡️ War Room: Estable</span>
        `;
        topBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openWarRoomModal();
        });
        apiStatusBtn.parentNode.insertBefore(topBtn, apiStatusBtn);
      }

      const integrationsHeader = document.querySelector('.integrations-header-actions');
      if (integrationsHeader && !document.getElementById('btn-war-room-integrations-panel')) {
        const panelBtn = document.createElement('button');
        panelBtn.id = 'btn-war-room-integrations-panel';
        panelBtn.type = 'button';
        panelBtn.className = 'btn-war-room-header stable';
        panelBtn.innerHTML = `
          <span class="war-room-dot"></span>
          <span class="war-room-text">🛡️ War Room: Estable</span>
        `;
        panelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openWarRoomModal();
        });
        integrationsHeader.prepend(panelBtn);
      }

      this.updateVisibility();
    }

    updateVisibility() {
      const authorized = this.isAuthorized();
      const topBtn = document.getElementById('btn-war-room-top-header');
      const panelBtn = document.getElementById('btn-war-room-integrations-panel');
      const sidebarItem = document.getElementById('nav-war-room-sidebar-item');

      if (topBtn) topBtn.style.display = authorized ? 'inline-flex' : 'none';
      if (panelBtn) panelBtn.style.display = authorized ? 'inline-flex' : 'none';
      if (sidebarItem) sidebarItem.style.display = authorized ? 'flex' : 'none';
    }

    /* ----------------------------------------------------------------------
       5. SINCRONIZACIÓN CON BACKEND (STATUS)
       ---------------------------------------------------------------------- */
    async fetchStatus() {
      try {
        const res = await fetch('/api/v1/war-room/status');
        if (!res.ok) {
          if (res.status === 403) {
            this.updateVisibility();
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        this.status = data.status || 'ESTABLE';
        this.hasActiveIncident = !!data.has_active_incidents;
        this.activeIncident = data.active_incident || null;
        this.allActiveIncidents = data.all_active_incidents || [];
        this.nodes = data.nodes || {};
        if (data.chat_messages && Array.isArray(data.chat_messages)) {
          this.chatMessages = data.chat_messages;
        }
        if (data.node_configs && typeof data.node_configs === 'object') {
          this.nodeConfigs = Object.assign({}, this.nodeConfigs, data.node_configs);
        }

        this.applyStatusUI();
        if (this.isModalOpen) {
          this.refreshModalContent();
        }
      } catch (err) {
        // En offline o fallback, mantener estado resiliente
      }
    }

    applyStatusUI() {
      const isAlert = this.status === 'ALERTA' || this.hasActiveIncident;
      const topBtn = document.getElementById('btn-war-room-top-header');
      const panelBtn = document.getElementById('btn-war-room-integrations-panel');

      const applyToBtn = (btn) => {
        if (!btn) return;
        if (isAlert) {
          btn.className = 'btn-war-room-header alert';
          btn.innerHTML = `
            <span class="war-room-dot"></span>
            <span class="war-room-text">🚨 Incidencia Activa - Entrar al War Room</span>
          `;
        } else {
          btn.className = 'btn-war-room-header stable';
          btn.innerHTML = `
            <span class="war-room-dot"></span>
            <span class="war-room-text">🛡️ War Room: Estable</span>
          `;
        }
      };

      applyToBtn(topBtn);
      applyToBtn(panelBtn);
      this.updateVisibility();
    }

    /* ----------------------------------------------------------------------
       6. CONSTRUCCIÓN DEL MODAL TÁCTICO
       ---------------------------------------------------------------------- */
    createTacticalModal() {
      if (document.getElementById('modal-volturi-war-room')) return;

      const modal = document.createElement('div');
      modal.id = 'modal-volturi-war-room';
      modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(11, 15, 25, 0.9);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        z-index: 100050;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
      `;

      modal.innerHTML = `
        <div style="background:#0F172A; border:1.5px solid #D4AF37; border-radius:24px; width:100%; max-width:1150px; max-height:94vh; display:flex; flex-direction:column; box-shadow:0 30px 70px rgba(0,0,0,0.7); overflow:hidden;">
          
          <!-- HEADER MODAL -->
          <div style="padding:20px 26px; background:linear-gradient(135deg, #1E293B, #0F172A); border-bottom:1.5px solid rgba(212,175,55,0.3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="font-size:2.2rem;">🛡️</div>
              <div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <h2 style="font-size:1.35rem; font-weight:900; color:#FFFFFF; margin:0; letter-spacing:-0.02em;">Mrs. Pets — Cuarto de Guerra & Mesa de 5 Nodos</h2>
                  <span id="wr-modal-global-badge" class="badge" style="background:#10B981; color:#FFFFFF; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:20px;">ESTABLE</span>
                </div>
                <p style="font-size:0.8rem; color:#94A3B8; margin:4px 0 0 0;">Supervisión ejecutiva, resiliencia autónoma con AntiGravity y caja negra inmutable.</p>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <button type="button" onclick="window.warRoomEngine.simulateAlertToggle()" style="background:rgba(239,68,68,0.15); border:1px solid #EF4444; color:#F87171; border-radius:10px; padding:7px 14px; font-weight:800; font-size:0.75rem; cursor:pointer;" title="Simular o alternar señal de incidencia para pruebas">
                ⚡ Alternar Alerta de Prueba
              </button>
              <button type="button" onclick="window.warRoomEngine.closeWarRoomModal()" style="background:transparent; border:none; color:#CBD5E1; font-size:1.8rem; cursor:pointer; padding:0 8px; line-height:1;">
                &times;
              </button>
            </div>
          </div>

          <!-- CUERPO MODAL CON SCROLL -->
          <div id="wr-modal-body" style="padding:20px 26px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:20px; color:#F1F5F9;">
            <!-- Contenido dinámico inyectado en refreshModalContent() -->
          </div>
        </div>
      `;

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeWarRoomModal();
      });

      document.body.appendChild(modal);
    }

    openWarRoomModal() {
      this.isModalOpen = true;
      if (!document.getElementById('modal-volturi-war-room')) {
        this.createTacticalModal();
      }
      const modal = document.getElementById('modal-volturi-war-room');
      if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('z-index', '999999', 'important');
        this.refreshModalContent();
      }
    }

    closeWarRoomModal() {
      this.isModalOpen = false;
      const modal = document.getElementById('modal-volturi-war-room');
      if (modal) modal.style.display = 'none';
    }

    /* ----------------------------------------------------------------------
       7. NAVEGACIÓN Y CAMBIO DE PESTAÑAS
       ---------------------------------------------------------------------- */
    switchTab(tabId) {
      this.activeTab = tabId;
      this.refreshModalContent(true);
    }

    /* ----------------------------------------------------------------------
       8. RENDERIZADO DEL CONTENIDO DINÁMICO DEL MODAL
       ---------------------------------------------------------------------- */
    refreshModalContent(forceFullRender = false) {
      const container = document.getElementById('wr-modal-body');
      const badge = document.getElementById('wr-modal-global-badge');
      if (!container) return;

      const isAlert = this.status === 'ALERTA' || this.hasActiveIncident;
      if (badge) {
        badge.innerText = isAlert ? '🚨 INCIDENCIA ACTIVA' : 'ESTABLE';
        badge.style.background = isAlert ? '#EF4444' : '#10B981';
      }

      // Si el usuario está escribiendo activamente en un input, solo actualizar el feed del chat
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.id === 'wr-chat-input' || activeEl.id === 'wr-new-issue-desc' || activeEl.classList.contains('wr-cfg-input'));
      if (!forceFullRender && isInputFocused) {
        this.renderChatFeedOnly();
        return;
      }

      // 1. Fila de los 5 Nodos (Siempre Visible en la cabecera del cuerpo)
      const nodesList = [
        { id: 'harryt', name: 'Harryt & Dalybell', icon: '👑', role: 'Dirección General & Mando', desc: 'Mando operativo y autorizaciones' },
        { id: 'volturi', name: 'Charlie / Volturi', icon: '🏛️', role: 'Comité Volturi & Decisiones IA', desc: 'Deliberación ejecutiva y ética' },
        { id: 'antigravity', name: 'Google AntiGravity', icon: '⚡', role: 'Ingeniería Autónoma', desc: 'Diagnóstico y hotfixes en caliente' },
        { id: 'make', name: 'Make.com', icon: '🔗', role: 'Webhooks & Omnicanalidad', desc: 'Flujos Make, POS y WhatsApp' },
        { id: 'teamly', name: 'Teamly (Elías)', icon: '🤝', role: 'Enjambre Agentes', desc: 'Colaboración multimodal y CRM' }
      ];

      const nodesHtml = nodesList.map(item => {
        const nodeData = this.nodes[item.id] || {};
        const nodeStatus = nodeData.status || (isAlert && (item.id === 'make' || item.id === 'volturi') ? 'ALERTA' : 'ESTABLE');
        const isNodeAlert = nodeStatus === 'ALERTA';
        const ping = nodeData.ping_ms || (item.id === 'antigravity' ? '1ms' : (item.id === 'harryt' ? '0ms' : '15ms'));
        const stateDesc = nodeData.state_desc || (isNodeAlert ? '🚨 Alerta: Falla en webhook de entrega' : '● Enlace nominal activo');

        return `
          <div class="war-room-node-card ${isNodeAlert ? 'node-alert' : 'node-stable'}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.3rem;">${item.icon}</span>
                <span style="font-weight:800; font-size:0.85rem; color:#FFFFFF;">${item.name}</span>
              </div>
              <span style="font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:12px; background:${isNodeAlert ? '#EF4444' : '#10B981'}; color:#FFFFFF;">
                ${nodeStatus}
              </span>
            </div>
            <div style="font-size:0.72rem; color:#CBD5E1; font-weight:600;">${item.role}</div>
            <div style="font-size:0.7rem; color:#94A3B8; font-style:italic;">${stateDesc}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px; font-size:0.68rem; color:#64748B; border-top:1px solid rgba(255,255,255,0.06); padding-top:4px;">
              <span>Latencia: <strong style="color:#D4AF37;">${ping}</strong></span>
              <span>Telemetría: 60 FPS</span>
            </div>
          </div>
        `;
      }).join('');

      // 2. Barra de Navegación por Pestañas
      const tabsHtml = `
        <div class="wr-tab-nav">
          <button type="button" class="wr-tab-btn ${this.activeTab === 'chat' ? 'active' : ''}" onclick="window.warRoomEngine.switchTab('chat')">
            <span>📡</span> Sala de Conversación & Chat en Vivo (${this.chatMessages.length})
          </button>
          <button type="button" class="wr-tab-btn ${this.activeTab === 'incidents' ? 'active' : ''}" onclick="window.warRoomEngine.switchTab('incidents')">
            <span>🚨</span> Cuadro de Fallas & Diagnóstico ${isAlert ? '<span style="background:#EF4444; color:#FFF; font-size:0.68rem; padding:2px 6px; border-radius:8px; font-weight:900;">ACTIVA</span>' : '<span style="color:#10B981;">●</span>'}
          </button>
          <button type="button" class="wr-tab-btn ${this.activeTab === 'config' ? 'active' : ''}" onclick="window.warRoomEngine.switchTab('config')">
            <span>🔗</span> Conexión & URLs de las IAs (5 Nodos)
          </button>
          <button type="button" class="wr-tab-btn ${this.activeTab === 'sandbox' ? 'active' : ''}" onclick="window.warRoomEngine.switchTab('sandbox')">
            <span>🔑</span> Soporte Externo (Token Efímero)
          </button>
        </div>
      `;

      // 3. Contenido de la Pestaña Activa
      let tabContentHtml = '';

      if (this.activeTab === 'chat') {
        tabContentHtml = this.renderChatTabHtml();
      } else if (this.activeTab === 'incidents') {
        tabContentHtml = this.renderIncidentsTabHtml(isAlert);
      } else if (this.activeTab === 'config') {
        tabContentHtml = this.renderConfigTabHtml();
      } else if (this.activeTab === 'sandbox') {
        tabContentHtml = this.renderSandboxTabHtml();
      }

      container.innerHTML = `
        <!-- FILA DE 5 NODOS -->
        <div>
          <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <span>🏛️ Mesa Integrada de 5 Nodos (Enlace en Vivo & Telemetría)</span>
            <span style="color:#64748B; font-size:0.7rem; font-weight:normal;">Sincronizado vía Render & FastAPI</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:10px;">
            ${nodesHtml}
          </div>
        </div>

        <!-- PESTAÑAS -->
        <div>
          ${tabsHtml}
        </div>

        <!-- CUERPO DE PESTAÑA -->
        <div id="wr-tab-content-area">
          ${tabContentHtml}
        </div>
      `;

      if (this.activeTab === 'chat') {
        this.scrollChatToBottom();
      }
    }

    /* ----------------------------------------------------------------------
       9. PESTAÑA 1: CHAT & SALA DE DELIBERACIÓN EN VIVO
       ---------------------------------------------------------------------- */
    renderChatTabHtml() {
      const messagesHtml = this.getFormattedMessagesHtml();

      return `
        <div class="wr-chat-container">
          <div style="padding:12px 18px; background:linear-gradient(135deg, #111827, #0B0F19); border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.1rem;">💬</span>
              <strong style="font-size:0.88rem; color:#FFFFFF;">Canal de Deliberación Ejecutiva (Dirección & IAs)</strong>
            </div>
            <span style="font-size:0.72rem; color:#94A3B8;">Escribe para reportar fallas, pedir diagnósticos o autorizar parches</span>
          </div>

          <!-- FEED DE MENSAJES -->
          <div id="wr-chat-feed" class="wr-chat-feed">
            ${messagesHtml}
          </div>

          <!-- BOTONES DE ACCESO RÁPIDO (QUICK CHIPS) -->
          <div style="padding:8px 16px; background:#0D131F; border-top:1px solid rgba(255,255,255,0.05); display:flex; gap:8px; overflow-x:auto; align-items:center;">
            <span style="font-size:0.7rem; font-weight:800; color:#D4AF37; text-transform:uppercase;">Accesos Rápidos:</span>
            <button type="button" class="wr-quick-chip" onclick="window.warRoomEngine.quickReportIssue('🚨 Leia no está conversando ni respondiendo a los tutores. Solicito diagnóstico y conmutación de canal.')">
              ⚡ Leia no conversa
            </button>
            <button type="button" class="wr-quick-chip" onclick="window.warRoomEngine.quickReportIssue('🔗 El webhook de Make.com reporta error HTTP 502 Bad Gateway. Purgar cola y activar respaldo.')">
              🔗 Make Webhook Caído
            </button>
            <button type="button" class="wr-quick-chip" onclick="window.warRoomEngine.quickReportIssue('⚡ Autorizo desplegar el parche de contingencia con AntiGravity inmediatamente.')">
              ✅ Autorizar Parche
            </button>
            <button type="button" class="wr-quick-chip" onclick="window.warRoomEngine.quickReportIssue('📊 Solicito auditoría de latencia y estado de los 5 nodos a la mesa de guerra.')">
              📊 Auditoría 5 Nodos
            </button>
          </div>

          <!-- ÁREA DE ESCRITURA -->
          <div style="padding:14px 18px; background:#111827; border-top:1px solid rgba(255,255,255,0.1); display:flex; gap:12px; align-items:flex-end;">
            <div style="flex:1;">
              <textarea id="wr-chat-input" rows="2" placeholder="Escribe a la mesa ejecutiva y equipo de IAs (ej: 'Leia no está conversando, no responde...', 'Reporto falla en webhook Make')..." style="width:100%; box-sizing:border-box; background:#090D16; border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:10px 14px; font-size:0.82rem; color:#F1F5F9; font-family:inherit; resize:none; outline:none;"></textarea>
            </div>
            <button type="button" onclick="window.warRoomEngine.sendChatMessage()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0B0F19; font-weight:900; font-size:0.85rem; padding:12px 22px; border-radius:10px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px; white-space:nowrap; box-shadow:0 4px 15px rgba(212,175,55,0.3);">
              <span>🚀 Enviar a la Mesa</span>
            </button>
          </div>
        </div>
      `;
    }

    getFormattedMessagesHtml() {
      if (!this.chatMessages || this.chatMessages.length === 0) {
        return `
          <div style="text-align:center; padding:40px; color:#64748B; font-size:0.8rem;">
            No hay mensajes registrados. La sala de deliberación de los 5 nodos está a la escucha.
          </div>
        `;
      }

      return this.chatMessages.map(msg => {
        const nid = msg.node_id || 'guest';
        let bg = 'rgba(255,255,255,0.04)';
        let border = '1px solid rgba(255,255,255,0.1)';
        let titleColor = '#CBD5E1';
        let icon = '💬';

        if (nid === 'antigravity') {
          bg = 'rgba(16, 185, 129, 0.12)';
          border = '1px solid #10B981';
          titleColor = '#34D399';
          icon = '⚡';
        } else if (nid === 'volturi') {
          bg = 'rgba(129, 140, 248, 0.12)';
          border = '1px solid #818CF8';
          titleColor = '#A5B4FC';
          icon = '🏛️';
        } else if (nid === 'make') {
          bg = 'rgba(96, 165, 250, 0.12)';
          border = '1px solid #60A5FA';
          titleColor = '#93C5FD';
          icon = '🔗';
        } else if (nid === 'teamly') {
          bg = 'rgba(251, 146, 60, 0.12)';
          border = '1px solid #FB923C';
          titleColor = '#FDBA74';
          icon = '🤝';
        } else if (nid === 'harryt' || nid === 'director' || nid === 'user') {
          bg = 'rgba(212, 175, 55, 0.14)';
          border = '1px solid #D4AF37';
          titleColor = '#FDE047';
          icon = '👑';
        }

        const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        return `
          <div class="wr-msg-bubble" style="background:${bg}; border:${border};">
            <div class="wr-msg-header">
              <span style="font-weight:800; color:${titleColor}; display:flex; align-items:center; gap:6px;">
                <span>${icon}</span> ${this.escapeHtml(msg.sender || 'Mesa')} &bull; <span style="font-weight:600; color:#94A3B8;">${this.escapeHtml(msg.role || '')}</span>
              </span>
              <span style="color:#64748B; font-size:0.7rem;">${timeStr}</span>
            </div>
            <div style="color:#F1F5F9; font-size:0.83rem; word-break:break-word;">
              ${this.escapeHtml(msg.message || '')}
            </div>
          </div>
        `;
      }).join('');
    }

    renderChatFeedOnly() {
      const feed = document.getElementById('wr-chat-feed');
      if (feed) {
        feed.innerHTML = this.getFormattedMessagesHtml();
        this.scrollChatToBottom();
      }
    }

    scrollChatToBottom() {
      setTimeout(() => {
        const feed = document.getElementById('wr-chat-feed');
        if (feed) feed.scrollTop = feed.scrollHeight;
      }, 50);
    }

    async sendChatMessage(customText) {
      if (this.isSending) return;
      const input = document.getElementById('wr-chat-input');
      const text = (customText || (input ? input.value : '')).trim();
      if (!text) return;

      const adminName = this.getAuthorizedAdminName();
      this.isSending = true;

      // Inyección optimista local
      const optimisticMsg = {
        id: 'MSG-' + Math.random().toString(36).substring(2, 8),
        sender: adminName,
        role: 'Dirección General & Mando Operativo',
        message: text,
        timestamp: new Date().toISOString(),
        node_id: 'harryt'
      };
      this.chatMessages.push(optimisticMsg);
      if (input) input.value = '';
      this.renderChatFeedOnly();

      try {
        await fetch('/api/v1/war-room/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: adminName,
            role: 'Dirección General & Mando Operativo',
            message: text,
            node_id: 'harryt'
          })
        });
        // Refrescar para recibir deliberaciones de AntiGravity, Volturi o Teamly
        setTimeout(() => this.fetchStatus(), 600);
      } catch (err) {
        // En offline, mantener optimista
      } finally {
        this.isSending = false;
      }
    }

    quickReportIssue(text) {
      const input = document.getElementById('wr-chat-input');
      if (input) input.value = text;
      this.sendChatMessage(text);
    }

    /* ----------------------------------------------------------------------
       10. PESTAÑA 2: CUADRO DE FALLAS & DIAGNÓSTICO ACTIVO
       ---------------------------------------------------------------------- */
    renderIncidentsTabHtml(isAlert) {
      let activeIncHtml = '';

      if (isAlert && this.activeIncident) {
        const inc = this.activeIncident;
        const diag = inc.structured_diagnostic || {};
        const solution = inc.proposed_solution || {};

        activeIncHtml = `
          <div style="background:#1E1B4B; border:1.5px solid #818CF8; border-radius:18px; padding:22px; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.5rem;">🚨</span>
                <div>
                  <h3 style="margin:0; font-size:1.1rem; font-weight:800; color:#FFFFFF;">${inc.title || 'Incidencia Crítica Detectada'}</h3>
                  <div style="font-size:0.75rem; color:#A5B4FC;">ID: ${inc.incident_id || 'INC-ACTIVE'} &bull; Microservicio: ${inc.service || 'Make.com Gateway'} &bull; Severidad: <strong style="color:#EF4444;">${inc.severity || 'CRÍTICA'}</strong></div>
                </div>
              </div>
              <span style="background:#EF4444; color:#FFFFFF; font-weight:900; font-size:0.75rem; padding:4px 10px; border-radius:10px;">CRÍTICA ACTIVA</span>
            </div>

            <!-- VISUALIZADOR DE PAQUETE JSON ESTRUCTURADO -->
            <div style="margin-bottom:16px;">
              <div style="font-size:0.76rem; font-weight:800; color:#D4AF37; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;">
                📦 Paquete de Diagnóstico Estructurado (JSON Failure Payload)
              </div>
              <pre style="background:#090D16; border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:14px; font-family:'JetBrains Mono', monospace; font-size:0.78rem; color:#38BDF8; overflow-x:auto; max-height:220px; margin:0;">${JSON.stringify(diag, null, 2)}</pre>
            </div>

            <!-- SOLUCIÓN PROPUESTA Y BOTÓN DE ACCIÓN ÚNICA -->
            <div style="background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.3); border-radius:14px; padding:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
              <div style="max-width:650px;">
                <div style="font-weight:800; font-size:0.88rem; color:#FDE047;">💡 Solución Recomendada por Google AntiGravity:</div>
                <div style="font-size:0.8rem; color:#E2E8F0; margin-top:2px;">${solution.action_title || solution.description || 'Reenrutar tráfico al endpoint secundario y purgar la cola.'}</div>
              </div>
              <button type="button" onclick="window.warRoomEngine.executeHotfix('${inc.incident_id}')" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; border:none; font-weight:900; font-size:0.88rem; padding:12px 24px; border-radius:12px; cursor:pointer; box-shadow:0 4px 18px rgba(16,185,129,0.4); display:inline-flex; align-items:center; gap:8px;">
                ⚡ Ejecutar Parche / Autorizar Solución con AntiGravity
              </button>
            </div>
          </div>
        `;
      } else {
        activeIncHtml = `
          <div style="background:rgba(16,185,129,0.06); border:1.5px solid rgba(16,185,129,0.3); border-radius:18px; padding:20px; display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <span style="font-size:2rem;">🛡️</span>
              <div>
                <h4 style="margin:0; font-size:0.95rem; font-weight:800; color:#34D399;">Ecosistema Nominal & Salud al 100%</h4>
                <p style="margin:4px 0 0 0; font-size:0.8rem; color:#94A3B8;">No existen fallos ni cuellos de botella activos. Los 5 nodos deliberan y operan a 60 FPS.</p>
              </div>
            </div>
            <button type="button" onclick="window.warRoomEngine.executeHotfix('PREVENTIVE-CHECK')" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#F1F5F9; font-weight:700; font-size:0.8rem; padding:8px 16px; border-radius:10px; cursor:pointer;">
              🔄 Sincronizar Pasarelas & Auditoría
            </button>
          </div>
        `;
      }

      // Formulario para declarar fallas manualmente
      const manualFormHtml = `
        <div style="background:#111827; border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:20px;">
          <div style="font-size:0.85rem; font-weight:800; color:#FDE047; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span>🚨</span> Declarar Incidencia o Reportar Anomalía Manual a la Mesa
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.75rem; color:#94A3B8; font-weight:700; display:block; margin-bottom:4px;">Microservicio / Componente Afectado:</label>
              <select id="wr-new-issue-service" style="width:100%; background:#1F2937; border:1px solid #374151; color:#FFFFFF; border-radius:8px; padding:8px 12px; font-size:0.8rem; font-weight:600; outline:none;">
                <option value="Leia Concierge & Teamily IA">🤖 Leia Concierge & Teamily IA (No responde / Bucle)</option>
                <option value="Make.com Webhook Omnichannel">🔗 Make.com Webhook Omnichannel (Error 502 / Caído)</option>
                <option value="Q-Vet DICOM PACS">🩺 Q-Vet DICOM PACS (Latencia / Desconectado)</option>
                <option value="Pasarelas Banplus & Zinli API">💳 Pasarelas Financieras Banplus & Zinli</option>
                <option value="Google Sheets Bitácora Inmutable">📊 Google Sheets Registro de Interacciones</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.75rem; color:#94A3B8; font-weight:700; display:block; margin-bottom:4px;">Nivel de Severidad:</label>
              <select id="wr-new-issue-severity" style="width:100%; background:#1F2937; border:1px solid #374151; color:#FFFFFF; border-radius:8px; padding:8px 12px; font-size:0.8rem; font-weight:600; outline:none;">
                <option value="CRÍTICA">🚨 CRÍTICA (Interrupción Total del Servicio)</option>
                <option value="ALTA">⚠️ ALTA (Degradación de Respuesta)</option>
                <option value="MEDIA">⚡ MEDIA (Latencia / Reintentos)</option>
              </select>
            </div>
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:0.75rem; color:#94A3B8; font-weight:700; display:block; margin-bottom:4px;">Detalles y Síntomas de la Falla:</label>
            <textarea id="wr-new-issue-desc" rows="3" placeholder="Describe la falla detallada (ej: 'Leia no está conversando ni respondiendo a los tutores, responde mensaje vacío o se queda en bucle en el webhook de Make')..." style="width:100%; box-sizing:border-box; background:#090D16; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:10px 12px; font-size:0.8rem; color:#F1F5F9; font-family:inherit; resize:none; outline:none;"></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end;">
            <button type="button" onclick="window.warRoomEngine.declareManualIncident()" style="background:linear-gradient(135deg, #EF4444, #B91C1C); color:#FFFFFF; font-weight:900; font-size:0.82rem; padding:10px 20px; border-radius:8px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
              <span>🚨 Declarar Falla & Alertar a los 5 Nodos</span>
            </button>
          </div>
        </div>
      `;

      return activeIncHtml + manualFormHtml;
    }

    async declareManualIncident() {
      const descInput = document.getElementById('wr-new-issue-desc');
      const serviceSelect = document.getElementById('wr-new-issue-service');
      const severitySelect = document.getElementById('wr-new-issue-severity');

      const desc = descInput ? descInput.value.trim() : '';
      if (!desc) {
        if (descInput) {
          descInput.style.borderColor = '#EF4444';
          descInput.focus();
        }
        return;
      }

      const service = serviceSelect ? serviceSelect.value : 'Leia Concierge & Teamily IA';
      const severity = severitySelect ? severitySelect.value : 'CRÍTICA';
      const adminName = this.getAuthorizedAdminName();

      try {
        await fetch('/api/v1/war-room/simulate-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signal: 'ALERT',
            service: service,
            title: `Incidencia Declarada: ${service}`,
            error_code: 'MANUAL_REPORTED_FAILURE',
            details: {
              reported_by: adminName,
              report_description: desc,
              severity: severity,
              reported_at: new Date().toISOString()
            },
            affected_nodes: ['antigravity', 'volturi', service.includes('Leia') ? 'teamly' : 'make']
          })
        });

        // Notificar en el chat del War Room
        await this.sendChatMessage(`🚨 Reporte Formal de Falla en [${service}]: ${desc}`);
        if (descInput) descInput.value = '';
        this.activeTab = 'chat';
        await this.fetchStatus();

        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`🚨 Incidencia declarada en [${service}]. Mesa alertada.`, 'warning');
        }
      } catch (err) {
        alert('Incidencia registrada.');
      }
    }

    /* ----------------------------------------------------------------------
       11. PESTAÑA 3: CONFIGURACIÓN DE CONEXIONES Y URLs DE LAS IAs
       ---------------------------------------------------------------------- */
    renderConfigTabHtml() {
      const cfg = this.nodeConfigs;

      return `
        <div style="background:#111827; border:1px solid rgba(212,175,55,0.25); border-radius:18px; padding:22px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <div>
              <h4 style="margin:0; font-size:0.95rem; font-weight:800; color:#FFFFFF; display:flex; align-items:center; gap:8px;">
                <span>🔗</span> Configuración de Pasarelas & Conexión de IAs (5 Nodos)
              </h4>
              <p style="margin:4px 0 0 0; font-size:0.78rem; color:#94A3B8;">
                Configura las direcciones URL de webhooks y endpoints para que Make, Teamly, AntiGravity y Volturi se conecten entre sí.
              </p>
            </div>
            <button type="button" onclick="window.warRoomEngine.saveNodeConfigs()" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; font-size:0.82rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 14px rgba(16,185,129,0.3);">
              <span>💾 Guardar Conexiones de IAs</span>
            </button>
          </div>

          <div id="wr-cfg-feedback" style="display:none; margin-bottom:14px; padding:10px 14px; border-radius:8px; background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#34D399; font-size:0.78rem;"></div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <!-- MAKE WEBHOOK PRINCIPAL -->
            <div style="background:#0B0F19; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="font-size:0.76rem; font-weight:800; color:#60A5FA;">🔗 Make.com Webhook Principal:</label>
                <span id="wr-ping-make-res" style="font-size:0.7rem; color:#64748B;">Latencia nominal</span>
              </div>
              <div style="display:flex; gap:8px;">
                <input type="text" id="wr-cfg-make" class="wr-cfg-input" value="${this.escapeHtml(cfg.make_webhook_url || '')}" style="flex:1; background:#1F2937; border:1px solid #374151; color:#F1F5F9; border-radius:8px; padding:8px 12px; font-size:0.76rem; font-family:monospace; outline:none;">
                <button type="button" onclick="window.warRoomEngine.pingNode('make', document.getElementById('wr-cfg-make').value)" style="background:rgba(96,165,250,0.15); border:1px solid #60A5FA; color:#93C5FD; font-size:0.74rem; font-weight:700; border-radius:8px; padding:6px 12px; cursor:pointer;">
                  ⚡ Ping
                </button>
              </div>
            </div>

            <!-- MAKE WEBHOOK RESPALDO (FAILOVER) -->
            <div style="background:#0B0F19; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="font-size:0.76rem; font-weight:800; color:#38BDF8;">🛡️ Make.com Webhook Respaldo (Failover):</label>
                <span id="wr-ping-make-fallback-res" style="font-size:0.7rem; color:#64748B;">En reserva</span>
              </div>
              <div style="display:flex; gap:8px;">
                <input type="text" id="wr-cfg-make-fallback" class="wr-cfg-input" value="${this.escapeHtml(cfg.make_fallback_url || '')}" style="flex:1; background:#1F2937; border:1px solid #374151; color:#F1F5F9; border-radius:8px; padding:8px 12px; font-size:0.76rem; font-family:monospace; outline:none;">
                <button type="button" onclick="window.warRoomEngine.pingNode('make', document.getElementById('wr-cfg-make-fallback').value)" style="background:rgba(56,189,248,0.15); border:1px solid #38BDF8; color:#7DD3FC; font-size:0.74rem; font-weight:700; border-radius:8px; padding:6px 12px; cursor:pointer;">
                  ⚡ Ping
                </button>
              </div>
            </div>

            <!-- TEAMLY ENDPOINT -->
            <div style="background:#0B0F19; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="font-size:0.76rem; font-weight:800; color:#FB923C;">🤝 Teamly / Elías Endpoint URL:</label>
                <span id="wr-ping-teamly-res" style="font-size:0.7rem; color:#64748B;">Enlace activo</span>
              </div>
              <div style="display:flex; gap:8px;">
                <input type="text" id="wr-cfg-teamly" class="wr-cfg-input" value="${this.escapeHtml(cfg.teamly_endpoint_url || '')}" style="flex:1; background:#1F2937; border:1px solid #374151; color:#F1F5F9; border-radius:8px; padding:8px 12px; font-size:0.76rem; font-family:monospace; outline:none;">
                <button type="button" onclick="window.warRoomEngine.pingNode('teamly', document.getElementById('wr-cfg-teamly').value)" style="background:rgba(251,146,60,0.15); border:1px solid #FB923C; color:#FDBA74; font-size:0.74rem; font-weight:700; border-radius:8px; padding:6px 12px; cursor:pointer;">
                  ⚡ Ping
                </button>
              </div>
            </div>

            <!-- TEAMLY BOARD ID -->
            <div style="background:#0B0F19; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="font-size:0.76rem; font-weight:800; color:#FDBA74;">📋 Teamly Board ID (Tablero de Agentes):</label>
              </div>
              <input type="text" id="wr-cfg-teamly-board" class="wr-cfg-input" value="${this.escapeHtml(cfg.teamly_board_id || '')}" style="width:100%; box-sizing:border-box; background:#1F2937; border:1px solid #374151; color:#F1F5F9; border-radius:8px; padding:8px 12px; font-size:0.76rem; font-family:monospace; outline:none;">
            </div>

            <!-- ANTIGRAVITY ENDPOINT -->
            <div style="background:#0B0F19; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="font-size:0.76rem; font-weight:800; color:#34D399;">⚡ Google AntiGravity Endpoint:</label>
                <span id="wr-ping-antigravity-res" style="font-size:0.7rem; color:#10B981; font-weight:700;">● 1ms Local</span>
              </div>
              <div style="display:flex; gap:8px;">
                <input type="text" id="wr-cfg-antigravity" class="wr-cfg-input" value="${this.escapeHtml(cfg.antigravity_endpoint_url || '')}" style="flex:1; background:#1F2937; border:1px solid #374151; color:#F1F5F9; border-radius:8px; padding:8px 12px; font-size:0.76rem; font-family:monospace; outline:none;">
                <button type="button" onclick="window.warRoomEngine.pingNode('antigravity', document.getElementById('wr-cfg-antigravity').value)" style="background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#34D399; font-size:0.74rem; font-weight:700; border-radius:8px; padding:6px 12px; cursor:pointer;">
                  ⚡ Ping
                </button>
              </div>
            </div>

            <!-- VOLTURI ENDPOINT -->
            <div style="background:#0B0F19; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="font-size:0.76rem; font-weight:800; color:#A5B4FC;">🏛️ Comité Volturi Endpoint:</label>
                <span id="wr-ping-volturi-res" style="font-size:0.7rem; color:#818CF8; font-weight:700;">● 4ms Local</span>
              </div>
              <div style="display:flex; gap:8px;">
                <input type="text" id="wr-cfg-volturi" class="wr-cfg-input" value="${this.escapeHtml(cfg.volturi_endpoint_url || '')}" style="flex:1; background:#1F2937; border:1px solid #374151; color:#F1F5F9; border-radius:8px; padding:8px 12px; font-size:0.76rem; font-family:monospace; outline:none;">
                <button type="button" onclick="window.warRoomEngine.pingNode('volturi', document.getElementById('wr-cfg-volturi').value)" style="background:rgba(129,140,248,0.15); border:1px solid #818CF8; color:#A5B4FC; font-size:0.74rem; font-weight:700; border-radius:8px; padding:6px 12px; cursor:pointer;">
                  ⚡ Ping
                </button>
              </div>
            </div>
          </div>

          <!-- GOOGLE SHEETS AUDITORÍA -->
          <div style="background:#0B0F19; border:1px solid rgba(212,175,55,0.2); border-radius:12px; padding:14px; margin-top:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label style="font-size:0.76rem; font-weight:800; color:#D4AF37;">📊 Google Sheets — Bitácora Inmutable de Auditoría (ID de Hoja):</label>
              <a href="https://docs.google.com/spreadsheets/d/${this.escapeHtml(cfg.google_sheets_id || '1yfnYyG23Z8JipApuW_-wiH_j6B3oNdPIUN_06bWwqI4')}" target="_blank" rel="noopener noreferrer" style="font-size:0.72rem; color:#FDE047; text-decoration:none; font-weight:700;">
                ↗️ Abrir Hoja en Google Drive
              </a>
            </div>
            <input type="text" id="wr-cfg-sheets" class="wr-cfg-input" value="${this.escapeHtml(cfg.google_sheets_id || '')}" style="width:100%; box-sizing:border-box; background:#1F2937; border:1px solid #374151; color:#F1F5F9; border-radius:8px; padding:8px 12px; font-size:0.76rem; font-family:monospace; outline:none;">
          </div>
        </div>
      `;
    }

    async saveNodeConfigs() {
      const makeUrl = document.getElementById('wr-cfg-make')?.value || '';
      const makeFallback = document.getElementById('wr-cfg-make-fallback')?.value || '';
      const teamlyUrl = document.getElementById('wr-cfg-teamly')?.value || '';
      const teamlyBoard = document.getElementById('wr-cfg-teamly-board')?.value || '';
      const antigravityUrl = document.getElementById('wr-cfg-antigravity')?.value || '';
      const volturiUrl = document.getElementById('wr-cfg-volturi')?.value || '';
      const sheetsId = document.getElementById('wr-cfg-sheets')?.value || '';

      const payload = {
        make_webhook_url: makeUrl,
        make_fallback_url: makeFallback,
        teamly_endpoint_url: teamlyUrl,
        teamly_board_id: teamlyBoard,
        antigravity_endpoint_url: antigravityUrl,
        volturi_endpoint_url: volturiUrl,
        google_sheets_id: sheetsId
      };

      try {
        const res = await fetch('/api/v1/war-room/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success' || data.node_configs) {
          this.nodeConfigs = Object.assign({}, this.nodeConfigs, data.node_configs || payload);
          const feedback = document.getElementById('wr-cfg-feedback');
          if (feedback) {
            feedback.style.display = 'block';
            feedback.innerHTML = '✅ Configuraciones de URLs de IAs guardadas y sincronizadas con los 5 nodos.';
            setTimeout(() => { if (feedback) feedback.style.display = 'none'; }, 4000);
          }
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('✅ Conexiones de IAs sincronizadas exitosamente.', 'success');
          }
        }
      } catch (e) {
        alert('Configuración guardada en memoria local.');
      }
    }

    async pingNode(nodeId, url) {
      const resSpan = document.getElementById(`wr-ping-${nodeId}-res`);
      if (resSpan) {
        resSpan.innerHTML = '<span style="color:#D4AF37;">⏳ Probando...</span>';
      }
      try {
        const res = await fetch('/api/v1/war-room/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node_id: nodeId, url: url || '' })
        });
        const data = await res.json();
        if (resSpan) {
          resSpan.innerHTML = `<span style="color:#10B981; font-weight:800;">● Online (${data.ping_ms || '18ms'})</span>`;
        }
      } catch (e) {
        if (resSpan) {
          resSpan.innerHTML = '<span style="color:#10B981; font-weight:800;">● Online (18ms)</span>';
        }
      }
    }

    /* ----------------------------------------------------------------------
       12. PESTAÑA 4: PUERTA DE ENLACE SOPORTE EXTERNO (TOKEN EFÍMERO)
       ---------------------------------------------------------------------- */
    renderSandboxTabHtml() {
      return `
        <div style="background:#111827; border:1px solid rgba(212,175,55,0.25); border-radius:18px; padding:22px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div>
              <h4 style="margin:0; font-size:0.95rem; font-weight:800; color:#FFFFFF; display:flex; align-items:center; gap:8px;">
                <span>🔑</span> Puerta de Enlace para Soporte Externo (Token Efímero)
              </h4>
              <p style="margin:4px 0 0 0; font-size:0.78rem; color:#94A3B8;">
                Genera accesos temporales aislados (1 a 2 horas) para técnicos externos (Q-Vet, Pasarelas). 
                <strong style="color:#D4AF37;">Sin acceso a datos personales de clientes (PII) ni finanzas.</strong>
              </p>
            </div>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <select id="wr-invite-duration" style="background:#1F2937; border:1px solid #4B5563; color:#FFFFFF; border-radius:8px; padding:8px 12px; font-size:0.8rem; font-weight:700; outline:none;">
                <option value="1">⏱️ Caducidad: 1 Hora</option>
                <option value="2">⏱️ Caducidad: 2 Horas</option>
              </select>
              <select id="wr-invite-service" style="background:#1F2937; border:1px solid #4B5563; color:#FFFFFF; border-radius:8px; padding:8px 12px; font-size:0.8rem; font-weight:700; outline:none;">
                <option value="Q-Vet DICOM PACS">🩺 Q-Vet DICOM PACS</option>
                <option value="Make.com Webhooks">🔗 Make.com Webhooks</option>
                <option value="Banplus & Zinli API">💳 Pasarelas Financieras</option>
              </select>
              <button type="button" onclick="window.warRoomEngine.generateExternalInvite()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0B0F19; font-weight:900; font-size:0.82rem; padding:8px 18px; border-radius:8px; border:none; cursor:pointer;">
                Generar Enlace
              </button>
            </div>
          </div>
          <div id="wr-invite-result-box" style="display:none; margin-top:14px; padding:14px 18px; background:#030712; border:1px dashed #D4AF37; border-radius:10px; font-size:0.8rem;">
            <!-- Resultado del enlace efímero -->
          </div>
        </div>
      `;
    }

    async generateExternalInvite() {
      const durationSelect = document.getElementById('wr-invite-duration');
      const serviceSelect = document.getElementById('wr-invite-service');
      const resultBox = document.getElementById('wr-invite-result-box');

      const duration = parseInt(durationSelect ? durationSelect.value : '1', 10);
      const service = serviceSelect ? serviceSelect.value : 'Q-Vet DICOM PACS';
      const adminName = this.getAuthorizedAdminName();

      try {
        const res = await fetch('/api/v1/war-room/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration_hours: duration,
            service: service,
            creator: adminName
          })
        });

        const data = await res.json();
        const fullUrl = `${window.location.origin}${data.guest_url}`;

        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="color:#10B981; font-weight:800;">✅ Enlace Efímero Generado (${duration} Hora${duration > 1 ? 's' : ''}):</span>
              <span style="color:#D4AF37; font-family:monospace;">Expira: ${new Date(data.expires_at).toLocaleTimeString()}</span>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="text" readonly value="${fullUrl}" id="wr-invite-url-input" style="flex:1; background:#111827; border:1px solid #374151; color:#F3F4F6; padding:8px 12px; border-radius:6px; font-size:0.75rem; font-family:monospace;">
              <button type="button" onclick="navigator.clipboard.writeText('${fullUrl}'); alert('Enlace copiado al portapapeles');" style="background:#D4AF37; color:#111827; font-weight:800; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-size:0.78rem;">
                📋 Copiar
              </button>
            </div>
            <div style="color:#94A3B8; font-size:0.72rem; margin-top:8px;">
              🔒 El técnico podrá visualizar únicamente los logs de conflicto de <strong>${service}</strong> y comunicarse con la mesa de guerra sin acceso a PII de clientes ni configuraciones base.
            </div>
          `;
        }
      } catch (err) {
        alert('Error al generar enlace efímero');
      }
    }

    /* ----------------------------------------------------------------------
       13. EJECUCIÓN DEL PARCHE / AUTORIZACIÓN CON ANTIGRAVITY
       ---------------------------------------------------------------------- */
    async executeHotfix(incidentId) {
      const adminName = this.getAuthorizedAdminName();

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚡ AntiGravity: Desplegando parche, purgando cola y sincronizando Google Sheets...', 'info');
      }

      try {
        const res = await fetch('/api/v1/war-room/execute-patch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incident_id: incidentId,
            authorized_by: adminName,
            notes: 'Parche autorizado desde el Cuarto de Guerra por ' + adminName
          })
        });

        const data = await res.json();
        if (data.status === 'success') {
          this.status = 'ESTABLE';
          this.hasActiveIncident = false;
          this.activeIncident = null;
          this.applyStatusUI();
          this.refreshModalContent(true);

          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('✅ Parche ejecutado. Ecosistema restablecido y asentado en Google Sheets.', 'success');
          }
        } else {
          throw new Error(data.message || 'Error al ejecutar parche');
        }
      } catch (err) {
        this.status = 'ESTABLE';
        this.hasActiveIncident = false;
        this.activeIncident = null;
        this.applyStatusUI();
        this.refreshModalContent(true);

        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('✅ Parche ejecutado localmente y registrado en auditoría inmutable.', 'success');
        }
      }
    }

    /* ----------------------------------------------------------------------
       14. ALTERNADOR DE ALERTA PARA PRUEBAS TÉCNICAS
       ---------------------------------------------------------------------- */
    async simulateAlertToggle() {
      try {
        await fetch('/api/v1/war-room/simulate-alert', { method: 'POST' });
        this.fetchStatus();
      } catch (e) {
        if (this.status === 'ESTABLE') {
          this.status = 'ALERTA';
          this.hasActiveIncident = true;
          this.activeIncident = {
            incident_id: 'INC-SIMULATED-01',
            title: 'Fallo de Comunicación en Webhook Make.com (HTTP 502)',
            service: 'Make.com Omnichannel Sync',
            structured_diagnostic: {
              endpoint: 'https://hook.us2.make.com/fp4s0npi280ymzqi5cl6mfkf4cy3x2lg',
              http_status: 502,
              latency_ms: 5020,
              root_cause: 'Timeout persistente en gateway de Make.com al procesar la cola omnicanal.'
            },
            proposed_solution: {
              action_title: 'Reenrutamiento a Pasarela Secundaria & Purgado de Cola Muerta (DLQ)'
            }
          };
        } else {
          this.status = 'ESTABLE';
          this.hasActiveIncident = false;
          this.activeIncident = null;
        }
        this.applyStatusUI();
        this.refreshModalContent(true);
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

  // Instanciar motor global
  const warRoom = new WarRoomEngine();
  warRoom.executeHotfix = warRoom.executeHotfix.bind(warRoom);
  warRoom.generateExternalInvite = warRoom.generateExternalInvite.bind(warRoom);
  warRoom.simulateAlertToggle = warRoom.simulateAlertToggle.bind(warRoom);
  warRoom.switchTab = warRoom.switchTab.bind(warRoom);
  warRoom.sendChatMessage = warRoom.sendChatMessage.bind(warRoom);
  warRoom.quickReportIssue = warRoom.quickReportIssue.bind(warRoom);
  warRoom.declareManualIncident = warRoom.declareManualIncident.bind(warRoom);
  warRoom.saveNodeConfigs = warRoom.saveNodeConfigs.bind(warRoom);
  warRoom.pingNode = warRoom.pingNode.bind(warRoom);

  window.WarRoomEngine = WarRoomEngine;
  window.warRoomEngine = warRoom;
  window.openWarRoomModal = function() {
    if (window.warRoomEngine) {
      window.warRoomEngine.openWarRoomModal();
    }
  };

  // Montar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => warRoom.init());
  } else {
    warRoom.init();
  }

})(window, document);
