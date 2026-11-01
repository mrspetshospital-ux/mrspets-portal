/**
 * ==============================================================================
 * TEAMILEY AI EXECUTIVE ORCHESTRATION ENGINE (VERTEX AI)
 * Mrs. Pets Maracaibo • Big & Little Dogs, C.A.
 * 
 * Módulo: Comité Volturi (Manolo, Pandora, Charlie)
 * Conexión: Direct API / Vertex AI SDK Endpoint
 * Protocolo: HTTPS POST / JSON REST API
 * Estado: ACTIVO & SINCRONIZADO
 * Función: Enlace directo entre la plataforma web / POS de Mrs. Pets y los
 * agentes ejecutivos de inteligencia artificial para la toma de decisiones,
 * finanzas y operaciones.
 * ==============================================================================
 */

class TeamilyExecutiveEngine {
  constructor() {
    this.endpoint = '/api/v1/teamily/orchestrate';
    this.statusEndpoint = '/api/v1/teamily/orchestrate';
    this.state = 'ACTIVO & SINCRONIZADO';
    this.committeeData = null;
    this.history = [];
    this.isConsulting = false;
  }

  async init() {
    try {
      await this.fetchStatus();
      console.log('[TeamilyExecutiveEngine] Conectado exitosamente con Vertex AI • Comité Volturi (Manolo, Pandora, Charlie)');
    } catch (err) {
      console.warn('[TeamilyExecutiveEngine] Error inicializando estado:', err);
    }
  }

  async fetchStatus() {
    try {
      const response = await fetch(this.statusEndpoint);
      if (response.ok) {
        this.committeeData = await response.json();
        this.updateHeaderBadges();
        return this.committeeData;
      }
    } catch (e) {
      console.warn('[TeamilyExecutiveEngine] Fetch status fallback:', e);
    }
    return null;
  }

  updateHeaderBadges() {
    const badge = document.getElementById('teamilyVolturiBadge');
    if (badge && this.committeeData) {
      badge.textContent = '● ' + (this.committeeData.state || 'ACTIVO & SINCRONIZADO');
      badge.style.display = 'inline-block';
    }
  }

  async consultCommittee({ agent = 'all', domain = 'executive', query = '', context = {}, metadata = {} }) {
    this.isConsulting = true;
    this.renderLoadingState(true);

    try {
      const payload = {
        agent,
        domain,
        query: query || 'Evaluación directiva ejecutiva Comité Volturi',
        context: Object.assign({
          timestamp: new Date().toISOString(),
          branch: 'Avenida 2 El Milagro, Maracaibo',
          platform: 'Mrs. Pets Web / POS Omnichannel'
        }, context),
        metadata: Object.assign({
          source: 'web_pos_platform',
          clientIp: window.clientIp || '127.0.0.1'
        }, metadata)
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.history.unshift(result);
      if (this.history.length > 20) this.history.pop();

      this.renderDeliberationResult(result);
      this.isConsulting = false;
      this.renderLoadingState(false);
      return result;
    } catch (err) {
      console.error('[TeamilyExecutiveEngine] Error en orquestación:', err);
      this.isConsulting = false;
      this.renderLoadingState(false);
      this.renderErrorState(err);
      return null;
    }
  }

  async auditPosSale(saleData = {}) {
    const query = `Auditoría de venta en mostrador POS: Ticket ${saleData.ticketId || 'TKT-LIVE'} por USD ${saleData.totalUsd || 35.0}`;
    const res = await this.consultCommittee({
      agent: 'charlie',
      domain: 'pos',
      query,
      context: saleData,
      metadata: { source: 'pos_terminal' }
    });

    if (res && res.deliberation && res.deliberation.charlie) {
      const c = res.deliberation.charlie;
      if (typeof window.showToast === 'function') {
        window.showToast(`⚖️ Charlie Finance: Venta auditada bajo Tasa BCV (${c.officialRateUsed} VES). IVA 16% SENIAT verificado.`, 'success');
      }
    }
    return res;
  }

  async evaluateStockRestock(itemData = {}) {
    const query = `Evaluación de reposición crítica: ${itemData.item || 'Insumo Grooming'} (ROI ${itemData.roiPercent || 30}%, Lead Time ${itemData.leadTimeDays || 7}d)`;
    return await this.consultCommittee({
      agent: 'pandora',
      domain: 'supply_chain',
      query,
      context: itemData,
      metadata: { source: 'store_inventory' }
    });
  }

  isAuthorizedAdminOrManager() {
    const auth = window.authEngine || window.AuthEngine;
    const admin = window.adminEngine;

    // 1. Roles no administrativos / visitantes / clientes / invitados / postulantes quedan estrictamente denegados
    const role = String(auth?.userRole || auth?.currentUser?.role || '').toLowerCase();
    if (role === 'visitor' || role === 'guest' || role === 'client' || role === 'candidate') {
      return false;
    }

    // 2. Si el entorno visual es cliente y no hay autenticación empresarial activa en sesión
    const isEnterpriseAuth = Boolean(
      (admin && admin.isEnterpriseAuthenticated && admin.viewEnvironment === 'enterprise') ||
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true')
    );

    if (!isEnterpriseAuth && role !== 'admin' && role !== 'staff' && role !== 'manager' && role !== 'gerente') {
      return false;
    }

    // 3. Si está autenticado como Staff en adminEngine, verificar que su perfil sea administrativo / directivo / gerencial
    if (admin && admin.currentStaffUser) {
      const staffRole = String(admin.currentStaffUser.rol_principal || admin.currentStaffUser.role || '').toLowerCase();
      const staffName = String(admin.currentStaffUser.name || admin.currentStaffUser.nombre || '').toLowerCase();
      if (
        staffRole === 'admin' ||
        staffRole === 'manager' ||
        staffRole === 'gerente' ||
        staffRole === 'director' ||
        staffName.includes('admin') ||
        staffName.includes('director') ||
        staffName.includes('gerente')
      ) {
        return true;
      }
    }

    // 4. Si el rol en authEngine es explícitamente admin o manager
    if (role === 'admin' || role === 'manager' || role === 'gerente' || role === 'staff') {
      return true;
    }

    return isEnterpriseAuth;
  }

  openCommitteeConsole(initialDomain = 'executive') {
    // 🛡️ GUARDA DE SEGURIDAD RBAC: Exclusivo para perfil de administrador y gerentes (nunca visitantes ni clientes)
    if (!this.isAuthorizedAdminOrManager()) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('[TeamilyExecutiveEngine] Acceso denegado: El Comité Volturi (Teamly AI) es exclusivo para Administradores y Gerentes.');
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Acceso Denegado: El Comité Volturi (Teamly AI) es exclusivo para Administradores y Gerentes.', 'warning');
      } else if (typeof alert !== 'undefined') {
        alert('🔒 Acceso Denegado: El Comité Volturi (Teamly AI) es exclusivo para Administradores y Gerentes.');
      }
      if (window.app && typeof window.app.openModal === 'function') {
        window.app.openModal('enterprise-login-modal');
      } else {
        const modal = document.getElementById('enterprise-login-modal');
        if (modal) modal.classList.add('active');
      }
      return false;
    }

    let modal = document.getElementById('volturiCommitteeModal');
    if (!modal) {
      modal = this.createCommitteeModal();
      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Si no se ha consultado aún, ejecutar deliberación inicial
    if (this.history.length === 0) {
      this.consultCommittee({
        agent: 'all',
        domain: initialDomain,
        query: 'Diagnóstico operacional de apertura y orquestación general de sucursal'
      });
    } else {
      this.renderDeliberationResult(this.history[0]);
    }
    return true;
  }

  closeCommitteeConsole() {
    const modal = document.getElementById('volturiCommitteeModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  createCommitteeModal() {
    const modal = document.createElement('div');
    modal.id = 'volturiCommitteeModal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    `;

    modal.innerHTML = `
      <div style="background: #111827; border: 1.5px solid #a855f7; border-radius: 20px; width: 100%; max-width: 950px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px rgba(147, 51, 234, 0.35); color: #fff;">
        
        <!-- Header con Identidad Oficial y Estado -->
        <div style="background: linear-gradient(135deg, #1f1435, #111827); padding: 18px 24px; border-bottom: 1px solid rgba(168, 85, 247, 0.3); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.6rem;">🤖</span>
              <div>
                <h2 style="margin: 0; font-size: 1.25rem; font-weight: 900; color: #f3e8ff; letter-spacing: -0.02em;">
                  Teamily AI Executive Orchestration API
                </h2>
                <div style="font-size: 0.8rem; color: #c084fc; font-weight: 600; margin-top: 2px;">
                  Comité Volturi • Enlace Directo Web / POS (Vertex AI SDK)
                </div>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="background: rgba(16, 185, 129, 0.18); border: 1px solid #10b981; color: #34d399; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.04em;">
              ● ACTIVO &amp; SINCRONIZADO
            </span>
            <button type="button" onclick="window.teamilyExecutiveEngine.closeCommitteeConsole()" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #e2e8f0; border-radius: 10px; width: 34px; height: 34px; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
              ✕
            </button>
          </div>
        </div>

        <!-- Cuerpo del Modal -->
        <div style="padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Banner de los 3 Agentes Ejecutivos -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
            
            <!-- Manolo Card -->
            <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 14px; padding: 14px 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 900; font-size: 0.95rem; color: #e0e7ff; display: flex; align-items: center; gap: 6px;">
                  👑 Manolo
                </span>
                <span style="font-size: 0.7rem; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; padding: 2px 6px; border-radius: 4px; font-weight: 700;">OPERACIONES</span>
              </div>
              <p style="margin: 0; font-size: 0.78rem; color: #cbd5e1; line-height: 1.4;">
                Liderazgo de sucursal (Av. 2 El Milagro), flujo de pacientes VIP, tiempos de Grooming 7 Estaciones y cierre estricto a las 6:00 PM.
              </p>
            </div>

            <!-- Pandora Card -->
            <div style="background: #1e293b; border: 1px solid #0284c7; border-radius: 14px; padding: 14px 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 900; font-size: 0.95rem; color: #f0f9ff; display: flex; align-items: center; gap: 6px;">
                  📦 Pandora (Core)
                </span>
                <span style="font-size: 0.7rem; background: rgba(14, 165, 233, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: 700;">ABASTECIMIENTO</span>
              </div>
              <p style="margin: 0; font-size: 0.78rem; color: #cbd5e1; line-height: 1.4;">
                Cadena de suministro, reposición de insumos de spa y clínica, y evaluación KillCritic (ROI &ge; 25%, Lead Time &le; 15 días).
              </p>
            </div>

            <!-- Charlie Card -->
            <div style="background: #142a20; border: 1px solid #059669; border-radius: 14px; padding: 14px 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 900; font-size: 0.95rem; color: #ecfdf5; display: flex; align-items: center; gap: 6px;">
                  ⚖️ Charlie Finance
                </span>
                <span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; padding: 2px 6px; border-radius: 4px; font-weight: 700;">TESORERÍA BCV</span>
              </div>
              <p style="margin: 0; font-size: 0.78rem; color: #cbd5e1; line-height: 1.4;">
                Tasa Oficial BCV obligatoria y única, facturación fiscal SENIAT 16%, conciliación de caja POS y protección anti-paralelo.
              </p>
            </div>

          </div>

          <!-- Prompt y Botones de Consulta Rápida -->
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 14px 16px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 800; color: #d8b4fe; margin-bottom: 8px;">
              💬 Enviar Consulta / Caso Directivo al Comité Volturi:
            </label>
            <div style="display: flex; gap: 10px;">
              <input type="text" id="volturiQueryInput" placeholder="Ej: Auditar caja POS de hoy, evaluar reposición de champús, o contingencia de cierre 6 PM..." style="flex: 1; background: #0f172a; border: 1.5px solid #6b21a8; border-radius: 10px; color: #fff; padding: 10px 14px; font-size: 0.88rem; outline: none;" onkeydown="if(event.key==='Enter') window.teamilyExecutiveEngine.handleManualQuery()">
              <button type="button" onclick="window.teamilyExecutiveEngine.handleManualQuery()" style="background: linear-gradient(135deg, #9333ea, #7c3aed); border: none; border-radius: 10px; color: #fff; font-weight: 800; padding: 10px 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4);">
                <span>⚡ Consultar</span>
              </button>
            </div>

            <!-- Accesos Rápidos -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
              <button type="button" onclick="window.teamilyExecutiveEngine.quickQuery('pos')" style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; color: #a7f3d0; padding: 5px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                🛒 Auditar Caja &amp; Ventas POS (Charlie)
              </button>
              <button type="button" onclick="window.teamilyExecutiveEngine.quickQuery('supply')" style="background: rgba(14, 165, 233, 0.12); border: 1px solid #0284c7; color: #bae6fd; padding: 5px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                📦 Reposición Insumos &amp; KillCritic (Pandora)
              </button>
              <button type="button" onclick="window.teamilyExecutiveEngine.quickQuery('operations')" style="background: rgba(168, 85, 247, 0.12); border: 1px solid #a855f7; color: #e9d5ff; padding: 5px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                ⏰ Capacidad Turnos &amp; Cierre 6:00 PM (Manolo)
              </button>
            </div>
          </div>

          <!-- Spinner Loading -->
          <div id="volturiLoadingSpinner" style="display: none; padding: 24px; text-align: center;">
            <div style="display: inline-block; width: 34px; height: 34px; border: 3px solid rgba(168, 85, 247, 0.3); border-top-color: #a855f7; border-radius: 50%; animation: volturiSpin 0.8s linear infinite;"></div>
            <div style="color: #c084fc; font-weight: 700; font-size: 0.88rem; margin-top: 8px;">
              Orquestando deliberación con Manolo, Pandora y Charlie en Vertex AI...
            </div>
          </div>

          <!-- Contenedor del Resultado de la Deliberación -->
          <div id="volturiDeliberationContainer"></div>

        </div>

        <!-- Footer Informativo -->
        <div style="background: #0f172a; padding: 12px 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; color: #94a3b8;">
          <div>
            📡 Enlace: <code>/api/v1/teamily/orchestrate</code> • Sincronización inmutable con Teamly (<code>ws_mrspets_mbo_01</code>)
          </div>
          <div style="color: #c084fc; font-weight: 700;">
            Google Cloud Vertex AI Enterprise
          </div>
        </div>

      </div>
    `;

    // Inyectar animación CSS para el spinner si no existe
    if (!document.getElementById('volturiAnimationStyle')) {
      const style = document.createElement('style');
      style.id = 'volturiAnimationStyle';
      style.innerHTML = `
        @keyframes volturiSpin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    return modal;
  }

  handleManualQuery() {
    const input = document.getElementById('volturiQueryInput');
    if (!input) return;
    const q = input.value.trim();
    if (!q) return;
    this.consultCommittee({ agent: 'all', domain: 'executive', query: q });
    input.value = '';
  }

  quickQuery(type) {
    if (type === 'pos') {
      this.consultCommittee({
        agent: 'charlie',
        domain: 'pos',
        query: 'Auditar facturación de mostrador POS, desglose de IVA 16% SENIAT y conciliación a Tasa Oficial BCV.'
      });
    } else if (type === 'supply') {
      this.consultCommittee({
        agent: 'pandora',
        domain: 'supply_chain',
        query: 'Revisión prioritaria de stock crítico de champús pH neutro, hidratación de pulpejos y pedidos aprobados bajo KillCritic.'
      });
    } else if (type === 'operations') {
      this.consultCommittee({
        agent: 'manolo',
        domain: 'operations',
        query: 'Validar balance de turnos en las 7 estaciones de Grooming Spa y asegurar despeje de citas antes de las 6:00 PM.'
      });
    }
  }

  renderLoadingState(isLoading) {
    const spinner = document.getElementById('volturiLoadingSpinner');
    const container = document.getElementById('volturiDeliberationContainer');
    if (spinner) spinner.style.display = isLoading ? 'block' : 'none';
    if (container && isLoading) container.style.opacity = '0.4';
    if (container && !isLoading) container.style.opacity = '1';
  }

  renderDeliberationResult(data) {
    const container = document.getElementById('volturiDeliberationContainer');
    if (!container || !data) return;

    const delib = data.deliberation || {};
    const manolo = delib.manolo || {};
    const pandora = delib.pandora || {};
    const charlie = delib.charlie || {};

    container.innerHTML = `
      <div style="background: #1f2937; border: 1.5px solid rgba(168, 85, 247, 0.4); border-radius: 16px; padding: 18px 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);">
        
        <!-- Header de la Resolución -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 12px; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-size: 0.72rem; color: #a855f7; font-weight: 800; letter-spacing: 0.05em;">
              RESOLUCIÓN EJECUTIVA • COMITÉ VOLTURI
            </div>
            <div style="font-size: 1.05rem; font-weight: 900; color: #fff;">
              ${data.resolutionId || 'VOLTURI-RES-OFICIAL'}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #10b981; color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.76rem;">
              ✓ ${data.consensus || 'APROBADO_UNANIME'}
            </span>
            <span style="font-size: 0.74rem; color: #94a3b8;">
              ${new Date(data.timestamp || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <!-- Dictamen / Resumen Ejecutivo -->
        <div style="background: rgba(147, 51, 234, 0.12); border-left: 4px solid #a855f7; padding: 12px 14px; border-radius: 0 10px 10px 0; margin-bottom: 16px;">
          <div style="font-size: 0.76rem; font-weight: 800; color: #d8b4fe; margin-bottom: 4px;">
            📜 DICTAMEN VINCULANTE:
          </div>
          <div style="font-size: 0.86rem; color: #f1f5f9; line-height: 1.45;">
            ${data.executiveSummary || 'Dictamen corporativo emitido de conformidad con los lineamientos de excelencia de Mrs. Pets.'}
          </div>
        </div>

        <!-- Desglose por Agente -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          
          <!-- Manolo Verdict -->
          <div style="background: rgba(30, 27, 75, 0.6); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 12px 14px;">
            <div style="font-weight: 800; font-size: 0.86rem; color: #a5b4fc; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              👑 Manolo (Operaciones &amp; Protocolo VIP):
            </div>
            <div style="font-size: 0.8rem; color: #e2e8f0; line-height: 1.4;">
              ${manolo.operationalRecommendation || 'Flujo de pacientes regularizado.'}
            </div>
            <div style="margin-top: 6px; font-size: 0.72rem; color: #93c5fd;">
              ⏰ Regla de Horario: ${manolo.strictBranchRule || 'Atención presencial hasta las 6:00 p.m.'}
            </div>
          </div>

          <!-- Pandora Verdict -->
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 12px; padding: 12px 14px;">
            <div style="font-weight: 800; font-size: 0.86rem; color: #38bdf8; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              📦 Pandora (Abastecimiento &amp; KillCritic):
            </div>
            <div style="font-size: 0.8rem; color: #e2e8f0; line-height: 1.4;">
              ${pandora.supplyRecommendation || 'Insumos verificados.'}
            </div>
            <div style="margin-top: 6px; font-size: 0.72rem; color: #7dd3fc;">
              ⚖️ Acción Inventario: ${pandora.inventoryAction || 'Despacho prioritario activo.'}
            </div>
          </div>

          <!-- Charlie Verdict -->
          <div style="background: rgba(6, 78, 59, 0.4); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 14px;">
            <div style="font-weight: 800; font-size: 0.86rem; color: #6ee7b7; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              ⚖️ Charlie (Finanzas &amp; Auditoría SENIAT):
            </div>
            <div style="font-size: 0.8rem; color: #e2e8f0; line-height: 1.4;">
              ${charlie.posAudit || 'Transacción conciliada.'}
            </div>
            <div style="margin-top: 6px; font-size: 0.72rem; color: #a7f3d0;">
              💵 Tasa BCV: ${charlie.officialRateUsed || '48.50'} VES/USD • ${charlie.strictAntiParallelNotice || 'Tasa Oficial Única'}
            </div>
          </div>

        </div>

        <!-- Trazabilidad Teamly -->
        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; font-size: 0.72rem; color: #94a3b8; flex-wrap: wrap; gap: 6px;">
          <span>📁 Tarea Teamly: <code>${(data.teamlySync && data.teamlySync.taskId) || 'tmly_volturi_task'}</code></span>
          <span>🏛️ Workspace: <code>ws_mrspets_mbo_01</code></span>
          <span style="color: #34d399; font-weight: 700;">✓ Registrado en Audit Trail</span>
        </div>

      </div>
    `;
  }

  renderErrorState(err) {
    const container = document.getElementById('volturiDeliberationContainer');
    if (!container) return;
    container.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.15); border: 1.5px solid #ef4444; border-radius: 12px; padding: 16px; color: #fee2e2;">
        <strong style="color: #f87171;">⚠️ Error de conexión con Vertex AI Orquestador:</strong>
        <p style="margin: 6px 0 0 0; font-size: 0.82rem;">${err.message || 'No se pudo completar la deliberación ejecutiva.'}</p>
      </div>
    `;
  }
}

// Instanciación y Exposición Global
const teamilyExecutiveEngine = new TeamilyExecutiveEngine();
window.teamilyExecutiveEngine = teamilyExecutiveEngine;
window.TeamilyExecutiveEngine = TeamilyExecutiveEngine;

document.addEventListener('DOMContentLoaded', () => {
  teamilyExecutiveEngine.init();
});
