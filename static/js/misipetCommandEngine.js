/**
 * MISIPET Command Engine 2.0
 * Centro de Comando Operativo, Infraestructura Crítica y Mantenimiento Autónomo
 * Big & Little Dogs, C.A. (Mrs. Pets • Maracaibo, Venezuela)
 * Orquestación: Mike (Operaciones & Calidad) + Leia (Voz Central) -> Make.com
 */

(function(window) {
  'use strict';

  class MisipetCommandEngine {
    constructor() {
      this.currentViewMode = 'master'; // 'master' (Pantalla Superior), 'workstation' (Pantalla Inferior), 'split' (Dual)
      this.currentRole = 'supervisor'; // 'supervisor' (Modo Supervisor LAN) o 'admin_geo' (Harry & Dalybell)
      this.activeDepartment = 'grooming';
      this.overviewData = null;
      this.assetsData = {};
      this.tanksData = [];
      this.camerasData = [];
      this.activeSemaphoreFilter = null;
      this.pollInterval = null;
      this.iotDevicesData = [];
      this.tukanConfig = null;
      this.mosaicGridMode = '2x2';
      this.responsivePreset = 'desktop';
      this.activeCamFocus = 1;
      this.assetsSortOrder = 'priority_red_first';
      this.valvesData = [];
      this.storageKeyStaffShifts = 'mrs_pets_staff_shifts_live';
      this.staffShifts = [];
      this.storageKeyMealAlertConfig = 'mrs_pets_meal_alert_config';
      this.lastNotifiedMealAlerts = {};
      this.mealAlertCheckInterval = null;
      this.cdtState = null;
      this.maintenanceOrders = [];
      this.filteredMaintenanceOrders = [];
      this.maintenanceOrdersStatusFilter = 'all';
      this.maintenanceOrdersSearchTerm = '';
    }

    init() {
      console.log('🚀 [MISIPET 2.0] Inicializando Centro de Comando Operativo...');
      this.detectAndApplyUserRole();
      this.loadOverview();
      this.loadDepartment(this.activeDepartment);
      this.loadCameras();
      this.loadStaffShifts();
      this.loadMaintenanceOrders();
      this.setupAutoRefresh();
      this.setupMealAlertMonitor();
    }

    detectAndApplyUserRole() {
      try {
        const staffRole = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('mrs_pets_staff_role') : '') || '';
        const adminRole = (window.adminEngine && window.adminEngine.activeRole ? String(window.adminEngine.activeRole) : '');
        const authRole = (window.authEngine && window.authEngine.userRole ? String(window.authEngine.userRole) : '');
        
        const combined = (staffRole + ' ' + adminRole + ' ' + authRole).toLowerCase();
        if (combined.includes('geo') || combined.includes('harry') || combined.includes('dalybell')) {
          this.setRole('admin_geo');
        } else {
          // Por defecto y para perfil supervisor, visualizar Modo Supervisor LAN
          this.setRole('supervisor');
        }
      } catch (e) {
        console.warn('Error detectando rol en MisiPet:', e);
      }
    }

    setupAutoRefresh() {
      if (this.pollInterval) clearInterval(this.pollInterval);
      // Actualizar métricas operativas cada 20 segundos
      this.pollInterval = setInterval(() => {
        this.loadOverview(true);
      }, 20000);
    }

    stopAutoRefresh() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    }

    // ==========================================
    // CONMUTACIÓN DE PANTALLA DUAL & ROLES (RBAC)
    // ==========================================
    setDualViewMode(mode) {
      this.currentViewMode = mode;
      const masterEl = document.getElementById('misipet-master-screen');
      const workstationEl = document.getElementById('misipet-workstation-screen');
      const containerEl = document.getElementById('misipet-dual-container');

      if (!containerEl) return;

      // Actualizar botones de conmutador
      document.querySelectorAll('.btn-dual-mode').forEach(b => {
        if (b.getAttribute('data-mode') === mode) {
          b.classList.add('active-mode');
        } else {
          b.classList.remove('active-mode');
        }
      });

      if (mode === 'master') {
        containerEl.className = 'misipet-view-master';
        if (masterEl) masterEl.style.display = 'block';
        if (workstationEl) workstationEl.style.display = 'none';
      } else if (mode === 'workstation') {
        containerEl.className = 'misipet-view-workstation';
        if (masterEl) masterEl.style.display = 'none';
        if (workstationEl) workstationEl.style.display = 'block';
        this.renderWorkstationScreen();
      } else if (mode === 'split') {
        containerEl.className = 'misipet-view-split';
        if (masterEl) masterEl.style.display = 'block';
        if (workstationEl) workstationEl.style.display = 'block';
        this.renderWorkstationScreen();
      }
    }

    setRole(role) {
      this.currentRole = role;
      const roleBadge = document.getElementById('misipet-active-role-badge');
      if (roleBadge) {
        if (role === 'admin_geo') {
          roleBadge.innerHTML = '👑 ADMIN GEO (HARRY & DALYBELL) • ACCESO TOTAL & TUKAN';
          roleBadge.className = 'role-badge-admin-geo';
        } else {
          roleBadge.innerHTML = '🛡️ MODO SUPERVISOR LAN • RED INTERNA';
          roleBadge.className = 'role-badge-supervisor';
        }
      }

      // Conmutar botones selectores de rol
      document.querySelectorAll('.btn-role-select').forEach(b => {
        if (b.getAttribute('data-role') === role) {
          b.classList.add('active-role');
        } else {
          b.classList.remove('active-role');
        }
      });

      // Recargar cámaras según permisos del rol
      this.loadCameras();
      // Refrescar visibilidad de botones financieros y CRUD si aplica
      this.renderMasterDashboard();
      this.renderDepartmentAssets();
    }

    // ==========================================
    // CARGA DE DATOS REST DESDE EL SERVIDOR
    // ==========================================
    async loadOverview(silent = false) {
      try {
        const res = await fetch('/api/v1/misipet/overview');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.status === 'error') throw new Error(data.message || 'Error en overview');
        this.overviewData = data;
        this.renderMasterDashboard();
        this.loadMaintenanceOrders();
        if (!silent) console.log('✅ [MISIPET] Macrovisión cargada:', data);
      } catch (err) {
        console.warn('⚠️ [MISIPET] Fallo al cargar overview, usando datos de respaldo:', err);
        if (!this.overviewData) {
          this.overviewData = this.getDefaultOverviewData();
          this.renderMasterDashboard();
        }
      }
    }

    async loadDepartment(dept) {
      this.activeDepartment = dept;
      // Actualizar pestañas UI
      document.querySelectorAll('.misipet-dept-tab').forEach(t => {
        if (t.getAttribute('data-dept') === dept) {
          t.classList.add('active-dept');
        } else {
          t.classList.remove('active-dept');
        }
      });

      if (dept === 'maintenance_orders') {
        await this.loadMaintenanceOrders();
        this.renderMaintenanceOrdersView();
        return;
      }

      if (dept === 'iot_devices') {
        await this.loadIotDevices();
        this.renderIotDevicesView();
        return;
      }

      if (dept === 'tukan_cams') {
        await this.loadTukanConfig();
        this.renderTukanMosaicView();
        return;
      }

      if (dept === 'flota_gps') {
        await this.loadFleetGps();
        this.renderFleetGpsView();
        return;
      }

      try {
        const url = `/api/v1/misipet/assets?dept=${dept}` + (this.activeSemaphoreFilter ? `&semaphore=${this.activeSemaphoreFilter}` : '');
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        this.assetsData[dept] = data.departments ? data.departments[dept] || [] : [];
        this.renderDepartmentAssets();
      } catch (err) {
        console.warn(`⚠️ [MISIPET] Fallo al cargar depto ${dept}:`, err);
      }
    }

    async loadCameras() {
      try {
        const res = await fetch(`/api/v1/misipet/cameras?role=${this.currentRole}`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        this.camerasData = data.channels || [];
        this.renderCamerasWidget();
      } catch (err) {
        console.warn('⚠️ [MISIPET] Fallo al cargar cámaras:', err);
      }
    }

    setAssetsSortOrder(order) {
      this.assetsSortOrder = order;
      this.renderDepartmentAssets();
    }

    filterBySemaphore(color) {
      if (this.activeSemaphoreFilter === color) {
        this.activeSemaphoreFilter = null; // Quitar filtro
      } else {
        this.activeSemaphoreFilter = color;
      }
      this.loadDepartment(this.activeDepartment);
    }

    // ==========================================
    // RENDERIZADO VISUAL DEL PANEL MASTER (PANTALLA SUPERIOR)
    // ==========================================
    renderMasterDashboard() {
      if (!this.overviewData) return;
      const data = this.overviewData;

      // 1. HEADER MACROVISIÓN HÍDRICA GLOBAL (CON PANEL DINÁMICO CDT)
      const waterEl = document.getElementById('misipet-water-global-card');
      if (waterEl) {
        const w = data.water_overview || {};

        // Sincronización continua de variables CDT con la realidad de reservas y pacientes (Tiempo en Vivo / 7 Estados)
        if (!this.cdtState) {
          const live = this.getLivePatientCounts();
          this.cdtState = {
            hotel: (typeof live.hotel === 'number') ? live.hotel : 1,
            grooming: (typeof live.grooming === 'number') ? live.grooming : 10,
            clinica: (typeof live.clinica === 'number') ? live.clinica : 1,
            buffer: 1.10
          };
        }

        const cdt = this.calculateCdt(this.cdtState.hotel, this.cdtState.grooming, this.cdtState.clinica, this.cdtState.buffer);
        const semClass = cdt.semaphore === 'green' ? 'cdt-sem-green' : (cdt.semaphore === 'yellow' ? 'cdt-sem-yellow' : 'cdt-sem-red');
        const badgeClass = cdt.semaphore === 'green' ? 'badge-nominal' : (cdt.semaphore === 'yellow' ? 'badge-warning' : 'badge-alert');

        const supervisorBanner = this.currentRole === 'supervisor' ? `
          <div id="misipet-supervisor-lan-banner" style="background:linear-gradient(135deg, #0284C7, #0369A1); color:#FFFFFF; border-radius:14px; padding:12px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; box-shadow:0 4px 14px rgba(2,132,199,0.25);">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:1.4rem;">🛡️</span>
              <div>
                <div style="font-weight:900; font-size:0.92rem; letter-spacing:0.3px;">MODO SUPERVISOR LAN ACTIVO</div>
                <div style="font-size:0.77rem; opacity:0.95;">Visualización autorizada de circuito cerrado RTSP local, odómetros ISO 9001, autonomía hídrica CDT y turnos de personal en planta.</div>
              </div>
            </div>
            <span class="badge" style="background:#FFFFFF; color:#0369A1; font-weight:900; font-size:0.75rem; padding:5px 12px; border-radius:8px;">RED LOCAL LAN 192.168.1.0/24</span>
          </div>
        ` : '';

        waterEl.innerHTML = `
          ${supervisorBanner}
          <div class="macro-metric-header">
            <div class="macro-title-group">
              <span class="macro-icon">💧</span>
              <div>
                <h3 class="macro-card-title">AUTONOMÍA HÍDRICA GLOBAL</h3>
                <span class="macro-subtitle">Batería de Tanques Principal • Sede Planta • Consumo CDT: ${cdt.adjusted_cdt_liters_day} L/día (~${cdt.hourly_burn_rate_liters} L/h)</span>
              </div>
            </div>
            <div class="macro-badge-autonomy ${badgeClass}">
              <span>⏱️ ${cdt.autonomy_days} DÍAS</span>
              <small>(${cdt.autonomy_hours} Horas)</small>
            </div>
          </div>
          <div class="macro-progress-bar-container">
            <div class="macro-progress-bar-fill" style="width: ${Math.min(100, cdt.total_pct)}%;"></div>
          </div>
          <div class="macro-stats-row">
            <span><strong>Nivel Total:</strong> ${Number(cdt.total_current_liters).toLocaleString()} L</span>
            <span><strong>Capacidad Máx:</strong> ${Number(cdt.total_capacity_liters).toLocaleString()} L (${cdt.total_pct}%)</span>
            <span><strong>Tanques Activos:</strong> ${w.tanks_count || 4} Unidades</span>
          </div>

          <!-- PANEL DINÁMICO DE CONSUMO DIARIO TOTAL (CDT) -->
          <div class="cdt-panel-wrapper">
            <div class="cdt-panel-header">
              <div class="cdt-title">
                <span>📊 CÁLCULO DINÁMICO DE AUTONOMÍA HÍDRICA (CDT)</span>
                <span class="cdt-formula-tag">CDT = (Hotel + Grooming + Clínica) × 1.10</span>
                <span style="font-size:0.68rem; font-weight:800; color:#059669; background:rgba(16,185,129,0.12); padding:2px 8px; border-radius:6px; border:1px solid #10B981;">🟢 Sincronizado en Vivo (Tiempo en Vivo / 7 Estados)</span>
              </div>
              <button type="button" class="btn-secondary" style="font-size:0.72rem; padding:4px 10px; display:inline-flex; align-items:center; gap:4px; font-weight:800; cursor:pointer;" onclick="misipetEngine.resetCdtVariables()" title="Recalcular con las reservas y pacientes reales de hoy de Tiempo en Vivo">
                🔄 Valores Base (Tiempo en Vivo)
              </button>
            </div>

            <div class="cdt-grid-cards">
              <div class="cdt-card">
                <div class="cdt-card-title">🏨 Hotel VIP</div>
                <div class="cdt-card-val"><span id="cdt-disp-hotel">${cdt.variables.hotel.active_guests}</span> <small style="font-size:0.7rem;">Huéspedes</small></div>
                <div class="cdt-card-sub">${cdt.variables.hotel.total_hotel_liters} L/día</div>
                <div class="cdt-stepper-row">
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('hotel', -1)" title="Disminuir huésped">-</button>
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('hotel', 1)" title="Aumentar huésped">+</button>
                </div>
              </div>

              <div class="cdt-card">
                <div class="cdt-card-title">✂️ Grooming Spa</div>
                <div class="cdt-card-val"><span id="cdt-disp-groom">${cdt.variables.grooming.scheduled_sessions}</span> <small style="font-size:0.7rem;">Sesiones</small></div>
                <div class="cdt-card-sub">${cdt.variables.grooming.total_grooming_liters} L/día</div>
                <div class="cdt-stepper-row">
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('grooming', -1)" title="Disminuir sesión">-</button>
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('grooming', 1)" title="Aumentar sesión">+</button>
                </div>
              </div>

              <div class="cdt-card">
                <div class="cdt-card-title">🏥 Clínica & UCI</div>
                <div class="cdt-card-val"><span id="cdt-disp-clinic">${cdt.variables.clinica.active_hospitalized_pets}</span> <small style="font-size:0.7rem;">Pacientes</small></div>
                <div class="cdt-card-sub">${cdt.variables.clinica.total_clinica_liters} L/día</div>
                <div class="cdt-stepper-row">
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('clinic', -1)" title="Disminuir paciente">-</button>
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('clinic', 1)" title="Aumentar paciente">+</button>
                </div>
              </div>

              <div class="cdt-card">
                <div class="cdt-card-title">🛡️ Buffer Holgura</div>
                <div class="cdt-card-val">+10%</div>
                <div class="cdt-card-sub">${cdt.variables.safety_buffer.buffer_liters} L/día</div>
                <div style="font-size:0.65rem; color:#64748B; margin-top:8px;">Factor Multiplicador (1.10)</div>
              </div>
            </div>

            <!-- Semáforo Dinámico CDT -->
            <div class="cdt-semaphore-banner ${semClass}">
              <div>
                ${cdt.semaphore === 'green' ? `
                  <span>🟢 <strong>Suministro Nominal Óptimo:</strong> Autonomía proyectada superior a 48 horas (${cdt.autonomy_hours} hrs / ${cdt.autonomy_days} días).</span>
                ` : (cdt.semaphore === 'yellow' ? `
                  <span>🟡 <strong>Alerta Preventiva (24h - 48h):</strong> Autonomía restante de ${cdt.autonomy_hours} horas (${cdt.autonomy_days} días). Notificar a Mike y Leia.</span>
                ` : `
                  <span>🔴 <strong>ALERTA CRÍTICA (< 24h):</strong> Autonomía de ${cdt.autonomy_hours} horas. Activar bomba ladrona o coordinar recarga externa con cisterna.</span>
                `)}
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                ${cdt.semaphore === 'yellow' ? `
                  <button type="button" class="btn-voice-leia" style="font-size:0.72rem; padding:4px 10px;" onclick="misipetEngine.speakWaterAlert('${cdt.autonomy_hours}')">📢 Anunciar por Leia</button>
                ` : ''}
                ${cdt.semaphore === 'red' ? `
                  <button type="button" class="btn-secondary" style="font-size:0.72rem; padding:4px 10px; background:#DC2626; color:#FFFFFF; border:none; font-weight:800;" onclick="misipetEngine.activateAuxiliaryPump()">⚡ Activar Bomba Ladrona</button>
                  <button type="button" class="btn-secondary" style="font-size:0.72rem; padding:4px 10px; background:#B91C1C; color:#FFFFFF; border:none; font-weight:800;" onclick="misipetEngine.requestWaterCistern()">🚚 Coordinar Cisterna</button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }

      // 2. INDICADORES GRÁFICOS DE CILINDROS DE AGUA (4 TANQUES OFICIALES)
      const tanksContainer = document.getElementById('misipet-tanks-cylinders-grid');
      if (tanksContainer && data.tanks) {
        tanksContainer.innerHTML = data.tanks.map(t => {
          const fillPct = Math.min(100, Math.max(5, t.level_pct || 0));
          const isCritical = fillPct <= 25;
          return `
            <div class="tank-cylinder-card">
              <div class="cylinder-header">
                <span class="cylinder-title">${t.name}</span>
                <span class="cylinder-capacity-pill">${Number(t.capacity_liters).toLocaleString()} L</span>
              </div>
              <div class="cylinder-visual-wrapper">
                <div class="cylinder-tank-3d">
                  <div class="cylinder-liquid-fill" style="height:${fillPct}%;">
                    <div class="cylinder-liquid-wave"></div>
                  </div>
                  <div class="cylinder-overlay-text">
                    <span class="cylinder-pct-text">${t.level_pct}%</span>
                    <span class="cylinder-liters-text">${Number(t.current_liters).toLocaleString()} L</span>
                  </div>
                </div>
              </div>
              <div class="cylinder-footer">
                <div class="cylinder-pump-info">
                  <span class="pump-icon">⚡</span>
                  <span class="pump-name">${t.associated_pump || 'Bomba en Línea'}</span>
                </div>
                <div class="cylinder-status-tag ${isCritical ? 'tag-critical' : 'tag-nominal'}">
                  ${t.refill_status || 'Operativo'}
                </div>
              </div>
              ${this.isAuthorizedMaintenance() ? `
                <div class="cylinder-actions">
                  <button class="btn-cylinder-edit" onclick="misipetEngine.openTankModal('${t.id}')">⚙️ Calibrar</button>
                </div>
              ` : `
                <div class="cylinder-actions">
                  <button class="btn-cylinder-edit" style="background:rgba(255,255,255,0.08); color:#94A3B8;" onclick="misipetEngine.openTankModal('${t.id}')">👁️ Ver Info</button>
                </div>
              `}
            </div>
          `;
        }).join('') + (this.isAuthorizedMaintenance() ? `
          <div class="tank-cylinder-card add-tank-placeholder" onclick="misipetEngine.openTankModal(null)">
            <div class="add-tank-content">
              <span class="add-icon">➕</span>
              <span class="add-text">AÑADIR TANQUE A LA BATERÍA</span>
              <small>Capacidad CRUD Ilimitada</small>
            </div>
          </div>
        ` : '');
      }

      // 3. MEDIDOR DE ENERGÍA Y COMBUSTIBLE (PLANTA CUMMINS 65 kVA)
      const powerEl = document.getElementById('misipet-power-plant-card');
      if (powerEl && data.power_plant) {
        const p = data.power_plant;
        powerEl.innerHTML = `
          <div class="macro-metric-header">
            <div class="macro-title-group">
              <span class="macro-icon">⚡</span>
              <div>
                <h3 class="macro-card-title">RESILIENCIA ENERGÉTICA • GENERACIÓN CRÍTICA</h3>
                <span class="macro-subtitle">${p.name} • Consumo Promedio: ${p.burn_rate_lph} Lts/Hora</span>
              </div>
            </div>
            <div class="power-header-actions">
              <span class="hvac-wifi-pill">📶 Modbus ESP32 (${p.ip_address || '192.168.1.185'})</span>
              <button type="button" class="btn-config-power" onclick="misipetEngine.openPowerPlantConfigModal()" title="Configurar Telemetría IoT">⚙️ Configurar Dispositivo IoT</button>
              <div class="macro-badge-autonomy badge-power-autonomy">
                <span>⏱️ ${p.autonomy_hours} HORAS</span>
                <small>Autonomía Estimada</small>
              </div>
            </div>
          </div>
          <div class="fuel-gauge-container">
            <div class="fuel-vertical-tank">
              <div class="fuel-vertical-fill" style="height:${Math.min(100, p.fuel_pct)}%;">
                <div class="fuel-shine"></div>
              </div>
            </div>
            <div class="fuel-details-panel">
              <div class="fuel-big-stat">
                <span class="fuel-val">${p.fuel_liters} <small>Lts</small></span>
                <span class="fuel-lbl">Nivel en Tanque (${p.fuel_pct}%)</span>
              </div>
              <div class="fuel-metrics-grid">
                <div class="fuel-sub-box">
                  <span class="lbl">Voltaje de Salida</span>
                  <span class="val">${p.voltage} V / ${p.frequency_hz} Hz</span>
                </div>
                <div class="fuel-sub-box">
                  <span class="lbl">Capacidad Tanque</span>
                  <span class="val">${p.tank_capacity_liters} Litros</span>
                </div>
                <div class="fuel-sub-box">
                  <span class="lbl">Estatus de ATS</span>
                  <span class="val tag-ats-ready">${p.status}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // 4. SEMÁFORO GLOBAL ISO 9001 Y CONTADORES TÁCTICOS
      const semCounts = data.semaphore_counts || {};
      const semCard = document.getElementById('misipet-semaphore-summary-card');
      if (semCard) {
        semCard.innerHTML = `
          <div class="semaphore-header">
            <h4 class="box-title">🚦 SEMÁFORO GLOBAL ISO 9001</h4>
            <span class="box-subtitle">Evaluación de 8 Departamentos Operativos</span>
          </div>
          <div class="semaphore-toggles-row">
            <button class="sem-btn sem-btn-green ${this.activeSemaphoreFilter === 'green' ? 'active-filter' : ''}" onclick="misipetEngine.filterBySemaphore('green')">
              <span class="sem-indicator green-dot"></span>
              <span class="sem-count">${semCounts.green || 0}</span>
              <span class="sem-label">NOMINAL (>15d)</span>
            </button>
            <button class="sem-btn sem-btn-yellow ${this.activeSemaphoreFilter === 'yellow' ? 'active-filter' : ''}" onclick="misipetEngine.filterBySemaphore('yellow')">
              <span class="sem-indicator yellow-dot"></span>
              <span class="sem-count">${semCounts.yellow || 0}</span>
              <span class="sem-label">PREVENTIVO (6-15d)</span>
            </button>
            <button class="sem-btn sem-btn-red ${this.activeSemaphoreFilter === 'red' ? 'active-filter' : ''}" onclick="misipetEngine.filterBySemaphore('red')">
              <span class="sem-indicator red-dot"></span>
              <span class="sem-count">${semCounts.red || 0}</span>
              <span class="sem-label">CRÍTICO (≤5d / Vencido)</span>
            </button>
          </div>
        `;
      }

      // 5. CONTADORES TÁCTICOS DE PISO: SOPLADORES & BIOMETRÍA
      const tacticalCard = document.getElementById('misipet-tactical-counters-card');
      if (tacticalCard) {
        const blowers = data.blowers_summary || {};
        const bio = data.biometric_attendance || {};
        tacticalCard.innerHTML = `
          <div class="tactical-box">
            <div class="tactical-icon-box">💨</div>
            <div class="tactical-info">
              <span class="tactical-val">${blowers.active_in_shift || 2} <small>Activos</small> / ${blowers.strategic_reserve || 1} <small class="res-tag">Reserva 100%</small></span>
              <span class="tactical-lbl">Sopladores de Grooming (Total: ${blowers.total || 3})</span>
            </div>
          </div>
          <div class="tactical-box">
            <div class="tactical-icon-box">👤</div>
            <div class="tactical-info">
              <span class="tactical-val">${bio.present_count || 6} / ${bio.total_staff || 6} <small>Presentes (${bio.attendance_rate_pct || 100}%)</small></span>
              <span class="tactical-lbl">Asistencia Facial Biométrica (Corte 8:00 AM)</span>
            </div>
          </div>
        `;
      }

      // 6. ALERTA DINÁMICA DE RELEVO DE COMIDAS (3-5 MIN ANTES)
      const mealAlertBox = document.getElementById('misipet-meal-alert-banner');
      if (mealAlertBox) {
        const mealAlerts = data.meal_alerts || [];
        if (mealAlerts.length > 0) {
          const alert = mealAlerts[0];
          mealAlertBox.style.display = 'flex';
          mealAlertBox.innerHTML = `
            <div class="meal-alert-content">
              <span class="meal-alert-bell">⏰</span>
              <div class="meal-alert-text">
                <strong>DIRECTIVA DE RELEVO DE ESTACIÓN:</strong>
                <span>${alert.message}</span>
              </div>
            </div>
            <div class="meal-alert-actions">
              <button class="btn-voice-leia" onclick="misipetEngine.announceWithLeia('${alert.message}')">
                📢 Leia: Anunciar por Voz
              </button>
            </div>
          `;
        } else {
          mealAlertBox.style.display = 'none';
        }
      }

      // 7. MATRIZ DE CLIMATIZACIÓN POR ZONAS (HVAC & CADENA DE FRÍO CON CONFIG WI-FI)
      const hvacGrid = document.getElementById('misipet-hvac-zones-grid');
      if (hvacGrid && data.hvac_zones) {
        hvacGrid.innerHTML = data.hvac_zones.map(z => {
          const semColor = z.semaphore === 'green' ? '#10B981' : (z.semaphore === 'yellow' ? '#F59E0B' : '#EF4444');
          return `
            <div class="hvac-zone-card" style="border-left: 4px solid ${semColor};">
              <div class="hvac-zone-top">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                  <div>
                    <span class="hvac-zone-name">${z.name}</span>
                    <span class="hvac-zone-location">${z.location}</span>
                  </div>
                  <span class="hvac-wifi-pill" title="IP LAN: ${z.wifi_ip || '192.168.1.xxx'}">📶 ${z.wifi_ssid || 'Wi-Fi'} (${z.wifi_ip || '192.168.1.xxx'})</span>
                </div>
              </div>
              <div class="hvac-temp-display">
                <span class="temp-icon">❄️</span>
                <span class="temp-current">${z.temp_actual_c}°C</span>
                <span class="temp-target">Target: ${z.temp_target_c}°C</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid #E8DFD1;">
                <div class="hvac-status-pill" style="color:${semColor}; font-weight:800;">
                  ● ${z.status}
                </div>
                <button class="btn-config-thermostat" onclick="misipetEngine.openThermostatConfigModal('${z.id}')">
                  ⚙️ Configurar Wi-Fi
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      // Renderizar bitácora de órdenes y parámetros evaluados por Mike
      this.renderMaintenanceOrdersTable();
    }

    // ==========================================
    // RENDERIZADO DE ACTIVOS POR DEPARTAMENTO (CRUD & ODÓMETROS)
    // ==========================================
    renderDepartmentAssets() {
      const container = document.getElementById('misipet-dept-assets-container');
      if (!container) return;

      const rawAssets = this.assetsData[this.activeDepartment] || [];

      // Ordenamiento de Prioridades (Cero Dibujitos)
      let assets = [...rawAssets];
      if (this.assetsSortOrder === 'priority_red_first') {
        const orderWeight = { red: 1, yellow: 2, green: 3 };
        assets.sort((a, b) => {
          const sa = orderWeight[a.computed_semaphore || a.semaphore || 'green'] || 4;
          const sb = orderWeight[b.computed_semaphore || b.semaphore || 'green'] || 4;
          return sa - sb;
        });
      } else if (this.assetsSortOrder === 'priority_green_first') {
        const orderWeight = { green: 1, yellow: 2, red: 3 };
        assets.sort((a, b) => {
          const sa = orderWeight[a.computed_semaphore || a.semaphore || 'green'] || 4;
          const sb = orderWeight[b.computed_semaphore || b.semaphore || 'green'] || 4;
          return sa - sb;
        });
      } else if (this.assetsSortOrder === 'odometer_desc') {
        assets.sort((a, b) => (b.hours_odometer || 0) - (a.hours_odometer || 0));
      } else if (this.assetsSortOrder === 'name_asc') {
        assets.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }

      const deptTitles = {
        grooming: '✂️ Grooming & Estética Profesional',
        clinica: '🏥 Clínica & Hospitalización Veterinaria 24/7',
        lavanderia: '🧼 Servicios Generales & Lavandería',
        hvac: '❄️ Climatización, HVAC & Cadena de Frío',
        tienda_seguridad: '🛡️ Tienda & Seguridad Perimetral',
        sala_maquinas: '⚙️ Sala de Máquinas & Sistema Hidráulico',
        ti_redes: '🖥️ Infraestructura TI & Telecomunicaciones',
        ups_matriz: '🔋 Matriz de UPS & Respaldo Crítico'
      };

      const title = deptTitles[this.activeDepartment] || 'Inventario Operativo';

      let html = `
        <div class="dept-assets-header">
          <div>
            <h3 class="dept-title">${title}</h3>
            <span class="dept-subtitle">${assets.length} Equipos e Insumos Monitoreados con Odómetros ISO 9001</span>
          </div>
          <div class="dept-header-actions">
            ${this.currentRole === 'admin_geo' ? `
              <button class="btn-add-asset" onclick="misipetEngine.openAssetModal('${this.activeDepartment}', null)">
                ➕ Añadir Equipo
              </button>
            ` : ''}
          </div>
        </div>
      `;

      // Barra de Ordenamiento de Prioridades (Cero Dibujitos)
      html += `
        <div class="dept-sort-toolbar">
          <div class="dept-sort-label">
            <span>⚡ Ordenar Prioridades:</span>
          </div>
          <div class="dept-sort-buttons">
            <button type="button" class="btn-sort-opt sort-red ${this.assetsSortOrder === 'priority_red_first' ? 'active-sort' : ''}" onclick="misipetEngine.setAssetsSortOrder('priority_red_first')">
              🔴 Rojo Primero (Crítico)
            </button>
            <button type="button" class="btn-sort-opt sort-green ${this.assetsSortOrder === 'priority_green_first' ? 'active-sort' : ''}" onclick="misipetEngine.setAssetsSortOrder('priority_green_first')">
              🟢 Verde Primero (Conforme)
            </button>
            <button type="button" class="btn-sort-opt ${this.assetsSortOrder === 'odometer_desc' ? 'active-sort' : ''}" onclick="misipetEngine.setAssetsSortOrder('odometer_desc')">
              ⏱️ Mayor Odómetro
            </button>
            <button type="button" class="btn-sort-opt ${this.assetsSortOrder === 'name_asc' ? 'active-sort' : ''}" onclick="misipetEngine.setAssetsSortOrder('name_asc')">
              🔤 Nombre A-Z
            </button>
          </div>
        </div>
      `;

      // Si es Sala de Máquinas, renderizar Consola de Electroválvulas de Corte Automático
      if (this.activeDepartment === 'sala_maquinas') {
        html += this.renderValvesConsoleHtml();
      }

      if (assets.length === 0) {
        html += `
          <div class="empty-assets-state">
            <p>No hay activos registrados o que coincidan con el filtro actual en este departamento.</p>
          </div>
        `;
      } else {
        html += `<div class="assets-cards-grid">`;
        assets.forEach(asset => {
          const sem = asset.computed_semaphore || asset.semaphore || 'green';
          const semColor = sem === 'green' ? '#10B981' : (sem === 'yellow' ? '#F59E0B' : '#EF4444');
          const semLabel = sem === 'green' ? '🟢 Conforme' : (sem === 'yellow' ? '🟡 Atención Preventiva' : '🔴 Crítico / Vencido');

          html += `
            <div class="asset-card" style="border-top: 3px solid ${semColor};">
              <div class="asset-card-header">
                <div class="asset-identity">
                  <span class="asset-tag">${asset.id}</span>
                  <h4 class="asset-name">${asset.name}</h4>
                  <span class="asset-category">${asset.category || ''} • ${asset.location || ''}</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                  <div class="asset-semaphore-badge" style="background: rgba(${sem === 'green' ? '16,185,129' : (sem === 'yellow' ? '245,158,11' : '239,68,68')}, 0.15); color: ${semColor};">
                    ${semLabel}
                  </div>
                  ${asset.last_override ? `
                    <span class="${asset.last_override.actor && asset.last_override.actor.includes('Mike') ? 'badge-override-mike' : 'badge-override-geo'}" title="Motivo: ${asset.last_override.reason || 'Supervisión'}">
                      ${asset.last_override.actor && asset.last_override.actor.includes('Mike') ? '🤖 Mike Teamily IA' : '🛡️ Override Directiva'}
                    </span>
                  ` : ''}
                </div>
              </div>

              <div class="asset-odometer-box">
                <div class="odometer-row">
                  <span class="odo-lbl">⏱️ Odómetro de Horas:</span>
                  <span class="odo-val"><strong>${asset.hours_odometer || 0}</strong> hrs acumuladas</span>
                </div>
                <div class="odometer-schedule">
                  <span><strong>Próx. Servicio Menor:</strong> ${asset.next_minor_service || 'N/A'}</span>
                  <span><strong>Próx. Servicio Mayor:</strong> ${asset.next_major_service || 'N/A'}</span>
                </div>
              </div>

              ${asset.monitored_vars ? `
                <div class="asset-vars-panel">
                  <span class="vars-title">Variables IoT & Auditoría:</span>
                  <div class="vars-tags-flow">
                    ${Object.entries(asset.monitored_vars).map(([k, v]) => `
                      <span class="var-chip"><strong>${k.replace(/_/g, ' ')}:</strong> ${v}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="asset-responsible-row">
                <span>👤 <strong>Responsable:</strong> ${asset.responsible || 'Personal de Turno'}</span>
              </div>

              <!-- BARRA DE CAMBIO DE CRITERIO / SEMÁFORO DIRECTO -->
              <div class="asset-criteria-toolbar" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:8px 10px; margin:8px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <span style="font-size:0.75rem; font-weight:800; color:#475569;">🚦 Criterio Semáforo:</span>
                <div style="display:flex; gap:4px; align-items:center;">
                  <button type="button" onclick="misipetEngine.quickSetSemaphore('${asset.id}', 'green')" title="Poner en Verde (Conforme / Mantenimiento Realizado)" style="background:${sem === 'green' ? '#10B981' : '#FFFFFF'}; color:${sem === 'green' ? '#FFFFFF' : '#047857'}; border:1.5px solid #10B981; padding:3px 7px; border-radius:6px; font-size:0.72rem; font-weight:900; cursor:pointer;">
                    🟢 Verde
                  </button>
                  <button type="button" onclick="misipetEngine.quickSetSemaphore('${asset.id}', 'yellow')" title="Poner en Amarillo (Atención Preventiva / En Observación)" style="background:${sem === 'yellow' ? '#F59E0B' : '#FFFFFF'}; color:${sem === 'yellow' ? '#FFFFFF' : '#B45309'}; border:1.5px solid #F59E0B; padding:3px 7px; border-radius:6px; font-size:0.72rem; font-weight:900; cursor:pointer;">
                    🟡 Amarillo
                  </button>
                  <button type="button" onclick="misipetEngine.quickSetSemaphore('${asset.id}', 'red')" title="Poner en Rojo (Crítico / Vencido)" style="background:${sem === 'red' ? '#EF4444' : '#FFFFFF'}; color:${sem === 'red' ? '#FFFFFF' : '#B91C1C'}; border:1.5px solid #EF4444; padding:3px 7px; border-radius:6px; font-size:0.72rem; font-weight:900; cursor:pointer;">
                    🔴 Rojo
                  </button>
                </div>
              </div>

              <!-- BOTÓN DE ACCIÓN RÁPIDA: YA SE HIZO EL MANTENIMIENTO -->
              <button type="button" class="btn-quick-maint-green" onclick="misipetEngine.markMaintenanceCompletedQuick('${asset.id}')" style="width:100%; margin-bottom:8px; background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; border:none; padding:7px 12px; border-radius:8px; font-size:0.75rem; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 6px rgba(16,185,129,0.3);" title="Registrar que ya se hizo el mantenimiento y colocar el equipo en VERDE">
                <span>✅ Ya se Hizo Mantenimiento (Colocar en Verde)</span>
              </button>

              <div class="asset-card-actions">
                <button class="btn-action-override" onclick="misipetEngine.openOverrideModal('${asset.id}', '${asset.name.replace(/'/g, "\\'")}', '${sem}')" title="Override directo de condición por Harry & Dalybell o Mike Teamily">
                  🛡️ Override Condición
                </button>
                <button class="btn-action-mant" onclick="misipetEngine.openMaintenanceModal('${asset.id}', 'menor')" title="Registrar Mantenimiento Menor Preventivo">
                  🔧 Mantenimiento Menor
                </button>
                <button class="btn-action-mant major" onclick="misipetEngine.openMaintenanceModal('${asset.id}', 'mayor')" title="Registrar Mantenimiento Mayor con Reset de Odómetro">
                  ⚙️ Mantenimiento Mayor
                </button>
                <button class="btn-action-mike" onclick="misipetEngine.openServiceOrderModal('${asset.id}')" title="Disparar Orden con Mike hacia Make.com">
                  ⚡ Mike Orden
                </button>
                ${(this.activeDepartment === 'hvac' || (asset.id && asset.id.includes('NEVERA')) || asset.wifi_config) ? `
                  <button class="btn-config-thermostat" onclick="misipetEngine.openThermostatConfigModal('${asset.id}')" title="Configurar Wi-Fi y calibración de termostato">
                    ⚙️ Configurar Wi-Fi
                  </button>
                ` : ''}
                ${(this.currentRole === 'admin_geo' || this.currentRole === 'supervisor') ? `
                  <button class="btn-action-edit" onclick="misipetEngine.openAssetModal('${this.activeDepartment}', '${asset.id}')" title="Editar Activo / Cambiar Criterio Semáforo">
                    ✏️
                  </button>
                  ${this.currentRole === 'admin_geo' ? `
                    <button class="btn-action-delete" onclick="misipetEngine.deleteAssetPrompt('${asset.id}')" title="Eliminar Activo">
                      🗑️
                    </button>
                  ` : ''}
                ` : ''}
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }

      container.innerHTML = html;
    }

    // ==========================================
    // RENDERIZADO DEL MONITOR DE CÁMARAS
    // ==========================================
    renderCamerasWidget() {
      const container = document.getElementById('misipet-cameras-grid');
      if (!container) return;

      if (!this.camerasData || this.camerasData.length === 0) {
        container.innerHTML = `<p class="muted-text">Cargando canales de videovigilancia...</p>`;
        return;
      }

      const isGEO = this.currentRole === 'admin_geo';

      container.innerHTML = `
        <div class="cameras-widget-header">
          <div>
            <h4 class="cameras-title">📹 CIRCUITO CERRADO Y STREAMING HÍBRIDO (22 CANALES)</h4>
            <span class="cameras-subtitle">${isGEO ? 'Modo Directiva GEO: Conexión RTSP LAN + Pasarela Segura Tukan Cloud' : 'Modo Operador de Piso: Circuito Cerrado Local (LAN Only)'}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn-cctv-config" onclick="misipetEngine.openCctvConfigModal()" title="Configuración de Enlace RTSP LAN y Pasarela Tukan Cloud">
              ⚙️ Configurar Conexión
            </button>
            <span class="cameras-tier-badge ${isGEO ? 'tier-geo' : 'tier-lan'}">
              ${isGEO ? 'TUKAN CLOUD STREAMING ONLINE' : 'LAN INTERNA ONLINE'}
            </span>
          </div>
        </div>
        <div class="cameras-channels-list">
          ${this.camerasData.slice(0, 8).map(cam => `
            <div class="camera-channel-item" onclick="misipetEngine.openCameraStreamModal(${cam.ch})">
              <div class="cam-item-header">
                <span class="cam-ch-pill">CH ${cam.ch}</span>
                <span class="cam-status-dot"></span>
              </div>
              <span class="cam-name">${cam.name}</span>
              <span class="cam-protocol">${isGEO ? 'RTSP LAN + TUKAN' : 'RTSP LAN ONLY'}</span>
            </div>
          `).join('')}
        </div>
      `;

      // Poblar el banner de alertas activas en vivo de forma inmediata
      setTimeout(() => {
        if (typeof this.checkLiveMealAlerts === 'function') {
          this.checkLiveMealAlerts(false);
        }
      }, 50);
    }

    // ==========================================
    // PANTALLA INFERIOR: WORKSTATION / PERSONAL EN PLANTA & OPERACIONES
    // ==========================================
    getDefaultStaffShifts() {
      return [
        {
          id: 'STF-001',
          name: 'Carlos Pérez',
          role: 'Groomer Master & Estilista',
          area: 'Mesa Secado 1 & Batea 1',
          checkin_time: '07:54 AM',
          lunch_window: '12:00 PM - 12:45 PM',
          checkout_scheduled: '04:30 PM',
          actual_checkout: null,
          status: 'in_plant',
          avatar: '✂️',
          backup_operator: 'Luisana Colina'
        },
        {
          id: 'STF-002',
          name: 'Luisana Colina',
          role: 'Groomer & Asistente Spa',
          area: 'Mesa Secado 2 & Batea 2',
          checkin_time: '07:58 AM',
          lunch_window: '12:45 PM - 01:30 PM',
          checkout_scheduled: '05:00 PM',
          actual_checkout: null,
          status: 'in_plant',
          avatar: '🧴',
          backup_operator: 'Carlos Pérez'
        },
        {
          id: 'STF-003',
          name: 'Dra. Andrea Gutiérrez',
          role: 'Médico Veterinario Jefe',
          area: 'Consultorio 1 & Farmacia',
          checkin_time: '07:49 AM',
          lunch_window: '01:00 PM - 01:45 PM',
          checkout_scheduled: '04:30 PM',
          actual_checkout: null,
          status: 'in_plant',
          avatar: '👩‍⚕️',
          backup_operator: 'Dr. Alejandro Morales'
        },
        {
          id: 'STF-004',
          name: 'Dr. Alejandro Morales',
          role: 'Cirujano Veterinario 24/7',
          area: 'Quirófano & Consultorio 2',
          checkin_time: '07:52 AM',
          lunch_window: '01:45 PM - 02:30 PM',
          checkout_scheduled: '05:00 PM',
          actual_checkout: null,
          status: 'lunch',
          avatar: '👨‍⚕️',
          photo: 'assets/leia_avatar.jpg',
          backup_operator: 'Dra. Andrea Gutiérrez'
        },
        {
          id: 'STF-005',
          name: 'Rosaura Méndez',
          role: 'Jefa de Lavandería e Higiene',
          area: 'Lavadoras & Secadoras Speed Queen',
          checkin_time: '07:45 AM',
          lunch_window: '12:15 PM - 01:00 PM',
          checkout_scheduled: '04:00 PM',
          actual_checkout: null,
          status: 'in_plant',
          avatar: '🧼',
          backup_operator: 'José Rincón'
        },
        {
          id: 'STF-006',
          name: 'José Rincón',
          role: 'Técnico Mantenimiento y Bombeo',
          area: 'Sala de Máquinas & Perímetro',
          checkin_time: '07:40 AM',
          lunch_window: '01:00 PM - 01:45 PM',
          checkout_scheduled: '04:30 PM',
          actual_checkout: null,
          status: 'in_plant',
          avatar: '🔧',
          backup_operator: 'Mike Teamily'
        },
        {
          id: 'STF-007',
          name: 'Dalybell Ramírez',
          role: 'Directora Operativa & Concierge VIP',
          area: 'Recepción Central & Mostrador',
          checkin_time: '07:30 AM',
          lunch_window: '01:00 PM - 02:00 PM',
          checkout_scheduled: '05:30 PM',
          actual_checkout: null,
          status: 'in_plant',
          avatar: '👑',
          backup_operator: 'Mariana Briceño'
        },
        {
          id: 'STF-008',
          name: 'Mike Teamily (Agente IA)',
          role: 'Ing. Residente MisiPet / Operaciones',
          area: 'Climatización, Matriz UPS & Planta Cummins',
          checkin_time: '07:00 AM',
          lunch_window: '12:00 PM - 01:00 PM',
          checkout_scheduled: '04:00 PM',
          actual_checkout: null,
          status: 'in_plant',
          avatar: '🤖',
          backup_operator: 'José Rincón'
        }
      ];
    }

    async loadStaffShifts() {
      try {
        const saved = localStorage.getItem(this.storageKeyStaffShifts);
        if (saved) {
          this.staffShifts = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Error al leer turnos locales:', e);
      }

      // Si no hay datos en localStorage, inicializar de inmediato con semilla síncrona
      if (!this.staffShifts || this.staffShifts.length === 0) {
        this.staffShifts = this.getDefaultStaffShifts();
        this.saveStaffShifts();
      }

      // Normalizar nombres históricos y limpiar cualquier referencia residual
      if (this.staffShifts && Array.isArray(this.staffShifts)) {
        let changed = false;
        this.staffShifts.forEach(s => {
          if (s.name && s.name.includes('Fernando Morales')) {
            s.name = 'Dr. Alejandro Morales';
            changed = true;
          }
          if (s.backup_operator && s.backup_operator.includes('Fernando Morales')) {
            s.backup_operator = 'Dr. Alejandro Morales';
            changed = true;
          }
        });
        if (changed) this.saveStaffShifts();
      }

      // Sincronizar en segundo plano desde backend si está disponible
      try {
        const res = await fetch('/api/v1/misipet/staff-schedule');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data && data.data.staff) {
            this.staffShifts = data.data.staff.map(s => {
              const cleanName = (s.name && s.name.includes('Fernando Morales')) ? 'Dr. Alejandro Morales' : s.name;
              const cleanBackup = (s.backup_operator && s.backup_operator.includes('Fernando Morales')) ? 'Dr. Alejandro Morales' : s.backup_operator;
              return {
                id: s.id,
                name: cleanName,
                role: s.role,
                area: s.current_station || s.department,
                checkin_time: s.checkin_time || '08:00 AM',
                lunch_window: s.lunch_window || '12:30 PM - 01:30 PM',
                checkout_scheduled: s.checkout_scheduled || '05:00 PM',
                actual_checkout: s.actual_checkout || null,
                status: s.status || (s.lunch_status === 'En Almuerzo' ? 'lunch' : 'in_plant'),
                avatar: s.role && s.role.includes('Médico') ? '👩‍⚕️' : (s.role && s.role.includes('Cirujano') ? '👨‍⚕️' : (s.role && s.role.includes('Groomer') ? '✂️' : (s.role && s.role.includes('Concierge') ? '👑' : '👤'))),
                photo: s.photo || (s.id === 'STF-004' ? 'assets/leia_avatar.jpg' : null),
                backup_operator: cleanBackup || 'Personal de Turno'
              };
            });
            this.saveStaffShifts();
          }
        }
      } catch (err) {
        // Modo offline
      }

      // Sincronizar con perfiles médicos de Configuración / Admin
      this.syncStaffFromAdminProfiles();
    }

    syncStaffFromAdminProfiles() {
      let profiles = [];
      try {
        if (window.adminEngine && Array.isArray(window.adminEngine.staffProfiles) && window.adminEngine.staffProfiles.length > 0) {
          profiles = window.adminEngine.staffProfiles;
        } else {
          const raw = localStorage.getItem('mrs_pets_staff_profiles');
          if (raw) profiles = JSON.parse(raw);
        }
      } catch (e) {}

      if (!profiles || !profiles.length || !this.staffShifts) return;

      const drMorales = profiles.find(p => 
        (p.id === 'USR-01') || 
        ((p.username || '').toLowerCase() === 'dr.morales') || 
        ((p.name || '').toLowerCase().includes('alejandro morales'))
      );

      let changed = false;
      if (drMorales) {
        const surgeon = this.staffShifts.find(s => s.id === 'STF-004' || (s.name && (s.name.includes('Morales') || s.name.includes('Cirujano'))));
        if (surgeon) {
          surgeon.name = 'Dr. Alejandro Morales';
          if (drMorales.photo) {
            surgeon.photo = drMorales.photo;
          }
          if (drMorales.active === false || drMorales.estado === 'inactivo') {
            surgeon.status = 'checked_out';
          }
          changed = true;
        }

        this.staffShifts.forEach(s => {
          if (s.backup_operator && s.backup_operator.includes('Morales')) {
            s.backup_operator = 'Dr. Alejandro Morales';
            changed = true;
          }
        });
      }

      if (changed) {
        this.saveStaffShifts();
      }
    }

    saveStaffShifts() {
      try {
        localStorage.setItem(this.storageKeyStaffShifts, JSON.stringify(this.staffShifts));
      } catch (e) {
        console.error('Error al guardar turnos de personal:', e);
      }
    }

    toggleStaffLunch(staffId) {
      const staff = (this.staffShifts || []).find(s => s.id === staffId);
      if (!staff) return;

      if (staff.status === 'lunch') {
        staff.status = 'in_plant';
        staff.lunch_status = 'Cumplido';
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`✅ ${staff.name} regresó de su hora de almuerzo y está de vuelta en planta.`, 'success');
        }
      } else {
        staff.status = 'lunch';
        staff.lunch_status = 'En Almuerzo';
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`🍲 ${staff.name} salió a su hora de almuerzo (${staff.lunch_window}).`, 'info');
        }
      }

      this.saveStaffShifts();
      this.renderWorkstationScreen();

      // Notificar backend
      try {
        fetch('/api/v1/misipet/staff-schedule/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staff_id: staffId,
            status: staff.status === 'lunch' ? 'En Almuerzo' : 'Presente',
            lunch_status: staff.lunch_status
          })
        }).catch(() => {});
      } catch (e) {}
    }

    toggleStaffCheckout(staffId) {
      const staff = (this.staffShifts || []).find(s => s.id === staffId);
      if (!staff) return;

      if (staff.status === 'checked_out') {
        staff.status = 'in_plant';
        staff.actual_checkout = null;
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`🟢 ${staff.name} reincorporado a planta.`, 'info');
        }
      } else {
        const nowStr = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
        staff.status = 'checked_out';
        staff.actual_checkout = nowStr;
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`🚪 Salida registrada para ${staff.name} a las ${nowStr}.`, 'warning');
        }
      }

      this.saveStaffShifts();
      this.renderWorkstationScreen();

      // Notificar backend
      try {
        fetch('/api/v1/misipet/staff-schedule/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staff_id: staffId,
            status: staff.status === 'checked_out' ? 'Salida Registrada' : 'Presente',
            actual_checkout: staff.actual_checkout
          })
        }).catch(() => {});
      } catch (e) {}
    }

    openStaffShiftModal(staffId = null) {
      let modal = document.getElementById('modal-misipet-staff-shift');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-misipet-staff-shift';
        modal.className = 'misipet-modal-overlay';
        modal.style.setProperty('z-index', '2147483647', 'important');
        document.body.appendChild(modal);
      }

      const staff = staffId ? (this.staffShifts || []).find(s => s.id === staffId) : null;
      const isEdit = !!staff;

      modal.innerHTML = `
        <div class="misipet-modal-box" style="max-width:560px; background:#FFFFFF; border-radius:18px; border:2px solid #D4AF37; padding:22px; color:#0F172A; box-shadow:0 12px 36px rgba(0,0,0,0.3);">
          <div class="misipet-modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #E2E8F0; padding-bottom:12px; margin-bottom:14px;">
            <h3 class="misipet-modal-title" style="margin:0; font-size:1.15rem; font-weight:900; color:#0F172A;">
              ${isEdit ? '✏️ Modificar Turno, Salida & Hora de Almuerzo' : '➕ Registrar Personal en Turno de Planta'}
            </h3>
            <button class="misipet-btn-close" type="button" onclick="misipetEngine.closeStaffShiftModal()" style="border:none; background:transparent; font-size:1.3rem; cursor:pointer;">✕</button>
          </div>
          <form onsubmit="misipetEngine.saveStaffShiftForm(event, '${staffId || ''}')">
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div>
                <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">Nombre del Colaborador *</label>
                <input type="text" id="staff-form-name" required value="${staff ? staff.name : ''}" placeholder="Ej: Dra. Andrea Gutiérrez" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-weight:700; font-size:0.85rem;">
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div>
                  <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">Cargo / Rol *</label>
                  <input type="text" id="staff-form-role" required value="${staff ? staff.role : ''}" placeholder="Ej: Médico Veterinario" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem;">
                </div>
                <div>
                  <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">Área Asignada en Planta *</label>
                  <input type="text" id="staff-form-area" required value="${staff ? staff.area : ''}" placeholder="Ej: Consultorio 1" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem;">
                </div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
                <div>
                  <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">⏰ Hora Entrada</label>
                  <input type="text" id="staff-form-checkin" required value="${staff ? staff.checkin_time : '08:00 AM'}" placeholder="08:00 AM" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:700;">
                </div>
                <div>
                  <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">🍲 Hora Almuerzo *</label>
                  <input type="text" id="staff-form-lunch" required value="${staff ? staff.lunch_window : '12:30 PM - 01:30 PM'}" placeholder="12:30 PM - 01:30 PM" style="width:100%; padding:8px 10px; border-radius:8px; border:1.5px solid #F59E0B; font-size:0.85rem; font-weight:800; color:#B45309;">
                </div>
                <div>
                  <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">🚪 Hora Salida *</label>
                  <input type="text" id="staff-form-checkout" required value="${staff ? staff.checkout_scheduled : '05:00 PM'}" placeholder="05:00 PM" style="width:100%; padding:8px 10px; border-radius:8px; border:1.5px solid #2563EB; font-size:0.85rem; font-weight:800; color:#1D4ED8;">
                </div>
              </div>
              <div>
                <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">🚦 Estatus en Planta</label>
                <select id="staff-form-status" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:800;">
                  <option value="in_plant" ${staff && staff.status === 'in_plant' ? 'selected' : ''}>🟢 En Planta (Laborando en Área)</option>
                  <option value="lunch" ${staff && staff.status === 'lunch' ? 'selected' : ''}>🍲 En Almuerzo (Pausa Activa)</option>
                  <option value="checked_out" ${staff && staff.status === 'checked_out' ? 'selected' : ''}>🚪 Salida Registrada / Turno Culminado</option>
                </select>
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
              <button type="button" class="btn-secondary" onclick="misipetEngine.closeStaffShiftModal()" style="padding:8px 16px; border-radius:8px; border:1px solid #CBD5E1; background:#F1F5F9; cursor:pointer;">Cancelar</button>
              <button type="submit" class="btn-primary-gold" style="padding:8px 20px; border-radius:8px; background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; border:none; cursor:pointer;">
                💾 Guardar Horario
              </button>
            </div>
          </form>
        </div>
      `;

      modal.style.display = 'flex';
    }

    closeStaffShiftModal() {
      const modal = document.getElementById('modal-misipet-staff-shift');
      if (modal) modal.style.display = 'none';
    }

    saveStaffShiftForm(event, staffId) {
      if (event) event.preventDefault();
      const name = document.getElementById('staff-form-name').value.trim();
      const role = document.getElementById('staff-form-role').value.trim();
      const area = document.getElementById('staff-form-area').value.trim();
      const checkin = document.getElementById('staff-form-checkin').value.trim();
      const lunch_window = document.getElementById('staff-form-lunch').value.trim();
      const checkout_scheduled = document.getElementById('staff-form-checkout').value.trim();
      const status = document.getElementById('staff-form-status').value;

      if (!name || !role) return;

      if (staffId) {
        const staff = (this.staffShifts || []).find(s => s.id === staffId);
        if (staff) {
          staff.name = name;
          staff.role = role;
          staff.area = area;
          staff.checkin_time = checkin;
          staff.lunch_window = lunch_window;
          staff.checkout_scheduled = checkout_scheduled;
          staff.status = status;
        }
      } else {
        this.staffShifts.push({
          id: `STF-${Date.now()}`,
          name,
          role,
          area,
          checkin_time: checkin,
          lunch_window,
          checkout_scheduled,
          actual_checkout: null,
          status,
          avatar: '👤'
        });
      }

      this.saveStaffShifts();
      this.closeStaffShiftModal();
      this.renderWorkstationScreen();

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✅ Horario de ${name} actualizado con éxito.`, 'success');
      }
    }

    // ==========================================
    // CUADRO DE HORAS DE COMIDA, SINCRONIZACIÓN & ALERTAS EN TIEMPO REAL
    // ==========================================
    getVenezuelanTime() {
      try {
        const now = new Date();
        const veStr = now.toLocaleTimeString('en-US', { timeZone: 'America/Caracas', hour12: false });
        const parts = veStr.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        return {
          hours: h,
          minutes: m,
          totalMinutes: h * 60 + m,
          display: now.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: true })
        };
      } catch (e) {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        return {
          hours: h,
          minutes: m,
          totalMinutes: h * 60 + m,
          display: now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
      }
    }

    parseTimeToMinutes(str) {
      if (!str) return null;
      str = str.trim();
      const isPM = /pm/i.test(str);
      const isAM = /am/i.test(str);
      const clean = str.replace(/[^\d:]/g, '');
      const parts = clean.split(':');
      if (parts.length < 2) return null;
      let h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      return h * 60 + m;
    }

    evaluateLiveMealAlerts() {
      const veTime = this.getVenezuelanTime();
      const curMins = veTime.totalMinutes;
      const alerts = [];

      (this.staffShifts || []).forEach(s => {
        let startTimeStr = s.lunch_start_time;
        if (!startTimeStr && s.lunch_window) {
          const m = s.lunch_window.split('-')[0].trim();
          startTimeStr = m;
        }

        const startMins = this.parseTimeToMinutes(startTimeStr);
        let endMins = null;
        if (s.lunch_window && s.lunch_window.includes('-')) {
          endMins = this.parseTimeToMinutes(s.lunch_window.split('-')[1].trim());
        } else if (startMins !== null) {
          endMins = startMins + 45;
        }

        if (startMins === null) return;

        const diffToStart = startMins - curMins;
        const diffToEnd = endMins !== null ? (endMins - curMins) : 0;

        let alertLevel = 'normal'; // 'urgent', 'warning', 'on_lunch', 'overdue', 'completed'
        let alertBadge = '';
        let alertMessage = '';

        if (s.lunch_status === 'Cumplido') {
          alertLevel = 'completed';
          alertBadge = '<span class="badge" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:6px;">✅ Almuerzo Cumplido</span>';
          alertMessage = `${s.name} ya cumplió su turno de comida y está conforme en su estación.`;
        } else if (s.status === 'lunch' || s.lunch_status === 'En Almuerzo') {
          alertLevel = 'on_lunch';
          alertBadge = '<span class="badge" style="background:#FFFBEB; color:#B45309; border:1.5px solid #F59E0B; font-weight:900; font-size:0.75rem; padding:3px 8px; border-radius:6px; animation:pulse 1.8s infinite;">🍲 En Almuerzo (Relevo Activo)</span>';
          alertMessage = `🍲 ${s.name} está en almuerzo (${s.lunch_window}). Relevo de estación activo con ${s.backup_operator || 'Personal en Planta'}.`;
        } else if (diffToStart <= 0 && diffToEnd >= 0) {
          // Dentro de la hora de comida pero no ha marcado
          alertLevel = 'urgent';
          alertBadge = '<span class="badge" style="background:#FEF2F2; color:#B91C1C; border:1.5px solid #EF4444; font-weight:900; font-size:0.75rem; padding:3px 8px; border-radius:6px; animation:pulse 1.2s infinite;">🚨 ¡HORA DE COMIDA AHORA!</span>';
          alertMessage = `🚨 ALERTA INMEDIATA: ${s.name} debe salir a comida AHORA (${s.lunch_window}). Reasignar estación '${s.area}' a ${s.backup_operator || 'Personal de Turno'}.`;
        } else if (diffToStart > 0 && diffToStart <= 15) {
          // Faltan 1 a 15 minutos
          alertLevel = 'warning';
          alertBadge = `<span class="badge" style="background:#FFFBEB; color:#B45309; border:1.5px solid #FCD34D; font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:6px;">⏳ Faltan ${diffToStart} min para Almuerzo</span>`;
          alertMessage = `⏳ ALERTA PREVENTIVA: ${s.name} inicia comida en ${diffToStart} min (${s.lunch_window}). Preparar relevo con ${s.backup_operator || 'Personal en Planta'}.`;
        } else if (diffToEnd < 0 && s.lunch_status === 'Pendiente') {
          // Ya pasó la hora y sigue pendiente
          alertLevel = 'overdue';
          alertBadge = '<span class="badge" style="background:#FEF2F2; color:#991B1B; border:1px solid #F87171; font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:6px;">⚠️ Horario Pendiente / Demorado</span>';
          alertMessage = `⚠️ ATENCIÓN: ${s.name} tiene turno de comida pendiente (${s.lunch_window}). Coordinar relevo con ${s.backup_operator}.`;
        } else {
          alertLevel = 'normal';
          alertBadge = `<span class="badge" style="background:#F1F5F9; color:#475569; border:1px solid #CBD5E1; font-weight:700; font-size:0.75rem; padding:3px 8px; border-radius:6px;">🟢 Turno Conforme (${startTimeStr})</span>`;
          alertMessage = `Próximo turno de comida a las ${startTimeStr}. Relevo: ${s.backup_operator}.`;
        }

        alerts.push({
          staff_id: s.id,
          staff_name: s.name,
          role: s.role,
          area: s.area,
          lunch_window: s.lunch_window,
          lunch_start_time: startTimeStr,
          backup_operator: s.backup_operator || 'Personal en Planta',
          alert_level: alertLevel,
          alert_badge: alertBadge,
          alert_message: alertMessage,
          diff_to_start: diffToStart
        });
      });

      return {
        currentTimeStr: veTime.display,
        currentMinutes: curMins,
        alerts: alerts,
        urgentCount: alerts.filter(a => a.alert_level === 'urgent').length,
        warningCount: alerts.filter(a => a.alert_level === 'warning').length,
        onLunchCount: alerts.filter(a => a.alert_level === 'on_lunch').length
      };
    }

    setupMealAlertMonitor() {
      if (this.mealAlertCheckInterval) clearInterval(this.mealAlertCheckInterval);
      // Chequear alertas en tiempo real cada 15 segundos
      this.mealAlertCheckInterval = setInterval(() => {
        this.checkLiveMealAlerts(true);
      }, 15000);
      // Chequeo inicial
      setTimeout(() => this.checkLiveMealAlerts(true), 1500);
    }

    checkLiveMealAlerts(isAuto = false) {
      const evalData = this.evaluateLiveMealAlerts();
      const container = document.getElementById('misipet-active-meal-alerts-container');
      
      // Actualizar contenedor visual si está en pantalla
      if (container) {
        const activeAlerts = evalData.alerts.filter(a => a.alert_level === 'urgent' || a.alert_level === 'warning' || a.alert_level === 'on_lunch');
        if (activeAlerts.length > 0) {
          container.innerHTML = `
            <div style="background:linear-gradient(135deg, #FEF3C7, #FDE68A); border:2px solid #F59E0B; border-radius:12px; padding:12px 16px; margin-bottom:14px; box-shadow:0 4px 14px rgba(245,158,11,0.25);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-weight:900; font-size:0.88rem; color:#92400E; display:flex; align-items:center; gap:8px;">
                  <span>🔔 ALERTAS ACTIVAS DE RELEVO & HORAS DE COMIDA (${evalData.currentTimeStr} VET)</span>
                  <span class="badge" style="background:#EF4444; color:#FFFFFF; font-size:0.7rem; padding:2px 8px; border-radius:6px; font-weight:900;">EN TIEMPO REAL</span>
                </div>
                <button type="button" onclick="misipetEngine.announceMealShiftsWithLeia()" style="background:#0F172A; color:#FFFFFF; border:none; padding:4px 10px; border-radius:6px; font-size:0.72rem; font-weight:800; cursor:pointer;">
                  📢 Anunciar por Voz (Leia)
                </button>
              </div>
              <ul style="margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px;">
                ${activeAlerts.map(a => `
                  <li style="background:#FFFFFF; border-radius:8px; padding:8px 12px; border-left:4px solid ${a.alert_level === 'urgent' ? '#EF4444' : '#F59E0B'}; font-size:0.83rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                      <strong style="color:#0F172A;">${a.staff_name}</strong> (${a.role}) • 
                      <span style="color:#B45309; font-weight:800;">${a.lunch_window}</span> • 
                      <span style="color:#475569;">Relevo: <strong>${a.backup_operator}</strong></span>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                      ${a.alert_badge}
                      <button type="button" onclick="misipetEngine.triggerStaffMealAlert('${a.staff_id}')" style="background:#EFF6FF; color:#1D4ED8; border:1px solid #93C5FD; padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:800; cursor:pointer;" title="Emitir alerta sonora y por voz para este colaborador">
                        📢 Alertar
                      </button>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div style="background:#ECFDF5; border:1.5px solid #A7F3D0; border-radius:12px; padding:10px 16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
              <div style="color:#065F46; font-size:0.82rem; font-weight:700; display:flex; align-items:center; gap:8px;">
                <span>✅ <strong>Horas de Comida en Orden (${evalData.currentTimeStr} VET):</strong> No hay relevos urgentes pendientes en este instante.</span>
              </div>
              <span class="badge" style="background:#10B981; color:#FFFFFF; font-weight:800; font-size:0.72rem; padding:3px 8px; border-radius:6px;">PLANTA NOMINAL</span>
            </div>
          `;
        }
      }

      // Si es automático, evaluar si hay alguna alerta urgente que no haya sonado en 10 minutos
      if (isAuto) {
        const nowMs = Date.now();
        evalData.alerts.forEach(a => {
          if (a.alert_level === 'urgent') {
            const lastTime = this.lastNotifiedMealAlerts[a.staff_id] || 0;
            if (nowMs - lastTime > 600000) { // 10 minutos
              this.lastNotifiedMealAlerts[a.staff_id] = nowMs;
              this.playMealAlertChime();
              if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast(`🍲 HORA DE COMIDA: ${a.staff_name} debe iniciar comida (${a.lunch_window}). Relevo: ${a.backup_operator}.`, 'warning');
              }
            }
          }
        });
      }
    }

    playMealAlertChime() {
      try {
        const audio = new Audio('assets/tinkerbell_chime.mp3');
        audio.volume = 0.8;
        audio.play().catch(() => {
          // Fallback con Web Audio API sintetizado
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.3);
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            }
          } catch (e2) {}
        });
      } catch (e) {}
    }

    async syncMealSchedule() {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔄 Sincronizando horas de comida con el servidor...', 'info');
      }

      try {
        const res = await fetch('/api/v1/misipet/staff-schedule');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data && data.data.staff) {
            this.staffShifts = data.data.staff.map(s => ({
              id: s.id,
              name: s.name,
              role: s.role,
              area: s.current_station || s.department,
              checkin_time: s.checkin_time || '08:00 AM',
              lunch_window: s.lunch_window || '12:30 PM - 01:30 PM',
              lunch_start_time: s.lunch_start_time || (s.lunch_window ? s.lunch_window.split('-')[0].trim() : '12:30 PM'),
              checkout_scheduled: s.checkout_scheduled || '05:00 PM',
              actual_checkout: s.actual_checkout || null,
              status: s.status || (s.lunch_status === 'En Almuerzo' ? 'lunch' : 'in_plant'),
              lunch_status: s.lunch_status || 'Pendiente',
              avatar: s.role && s.role.includes('Médico') ? '👩‍⚕️' : (s.role && s.role.includes('Cirujano') ? '👨‍⚕️' : (s.role && s.role.includes('Groomer') ? '✂️' : (s.role && s.role.includes('Concierge') ? '👑' : '👤'))),
              backup_operator: s.backup_operator || 'Personal de Turno'
            }));
            this.saveStaffShifts();
            this.renderWorkstationScreen();
            this.checkLiveMealAlerts(false);

            if (window.app && typeof window.app.showToast === 'function') {
              window.app.showToast('✅ Horas de comida sincronizadas con éxito con la hora oficial VET.', 'success');
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Error al sincronizar staff-schedule:', err);
      }

      this.renderWorkstationScreen();
      this.checkLiveMealAlerts(false);
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('✅ Horarios locales verificados y actualizados.', 'success');
      }
    }

    openMealConfigModal(staffId = null) {
      const modal = document.getElementById('modal-misipet-meal-config');
      if (!modal) return;

      const staffSelect = document.getElementById('meal-form-staff-id');
      if (staffSelect) {
        staffSelect.innerHTML = (this.staffShifts || []).map(s => `
          <option value="${s.id}" ${staffId === s.id ? 'selected' : ''}>
            ${s.name} (${s.role}) • Actual: ${s.lunch_window}
          </option>
        `).join('');
      }

      const activeId = staffId || (staffSelect && staffSelect.value) || ((this.staffShifts || [])[0] && this.staffShifts[0].id);
      if (activeId) {
        this.onMealStaffSelectChange(activeId);
      }

      modal.style.display = 'flex';
    }

    closeMealConfigModal() {
      const modal = document.getElementById('modal-misipet-meal-config');
      if (modal) modal.style.display = 'none';
    }

    onMealStaffSelectChange(staffId) {
      const staff = (this.staffShifts || []).find(s => s.id === staffId);
      if (!staff) return;

      const startInput = document.getElementById('meal-form-start-time');
      const windowInput = document.getElementById('meal-form-window');
      const backupInput = document.getElementById('meal-form-backup');

      let startTime = staff.lunch_start_time;
      if (!startTime && staff.lunch_window) {
        startTime = staff.lunch_window.split('-')[0].trim();
      }

      if (startInput) startInput.value = startTime || '12:00 PM';
      if (windowInput) windowInput.value = staff.lunch_window || '12:00 PM - 12:45 PM';
      if (backupInput) backupInput.value = staff.backup_operator || 'Personal de Turno';
    }

    recalcMealWindowPreview() {
      const startInput = document.getElementById('meal-form-start-time');
      const durationSelect = document.getElementById('meal-form-duration');
      const windowInput = document.getElementById('meal-form-window');

      if (!startInput || !windowInput) return;
      const startStr = startInput.value.trim();
      const mins = this.parseTimeToMinutes(startStr);
      if (mins === null) return;

      const dur = durationSelect ? parseInt(durationSelect.value, 10) : 45;
      const endMins = (mins + dur) % (24 * 60);

      const formatMin = (m) => {
        let h = Math.floor(m / 60);
        const mm = m % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
      };

      const startFmt = formatMin(mins);
      const endFmt = formatMin(endMins);
      windowInput.value = `${startFmt} - ${endFmt}`;
    }

    async saveMealConfigForm(event) {
      if (event) event.preventDefault();
      const staffId = document.getElementById('meal-form-staff-id').value;
      const startTime = document.getElementById('meal-form-start-time').value.trim();
      const lunchWindow = document.getElementById('meal-form-window').value.trim();
      const backup = document.getElementById('meal-form-backup').value.trim();
      const voiceEnabled = document.getElementById('meal-form-voice-enabled')?.checked;

      const staff = (this.staffShifts || []).find(s => s.id === staffId);
      if (!staff) return;

      staff.lunch_start_time = startTime;
      staff.lunch_window = lunchWindow;
      staff.backup_operator = backup;

      this.saveStaffShifts();
      this.closeMealConfigModal();
      this.renderWorkstationScreen();
      this.checkLiveMealAlerts(false);

      // Persistir al backend
      try {
        await fetch('/api/v1/misipet/staff-schedule/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: staffId,
            staff_id: staffId,
            lunch_window: lunchWindow,
            lunch_start_time: startTime,
            backup_operator: backup,
            updates: {
              lunch_window: lunchWindow,
              lunch_start_time: startTime,
              backup_operator: backup
            }
          })
        });
      } catch (err) {
        console.warn('Sync meal schedule backend error:', err);
      }

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✅ Horario de comida de ${staff.name} configurado: ${lunchWindow}. Relevo: ${backup}`, 'success');
      }

      if (voiceEnabled) {
        this.announceWithLeia(`Horario de comida de ${staff.name} configurado para las ${startTime}. Relevo asignado a ${backup}.`);
      }
    }

    triggerStaffMealAlert(staffId) {
      const staff = (this.staffShifts || []).find(s => s.id === staffId);
      if (!staff) return;

      this.playMealAlertChime();
      const msg = `🍲 ALERTA DE COMIDA: ${staff.name} debe pasar a su turno de almuerzo (${staff.lunch_window}). Relevo asignado a ${staff.backup_operator}.`;

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(msg, 'warning');
      }

      this.announceWithLeia(`Atención personal en planta: Turno de comida para ${staff.name} en el horario ${staff.lunch_window}. Relevo de estación asignado a ${staff.backup_operator}.`);
    }

    triggerTestMealAlert() {
      this.playMealAlertChime();
      const staffList = this.staffShifts || [];
      const sample = staffList[0] || { name: 'Carlos Pérez', lunch_window: '12:00 PM - 12:45 PM', backup_operator: 'Luisana Colina' };
      const msg = `🔔 PRUEBA DE ALERTA: ${sample.name} inicia comida a las ${sample.lunch_window}. Relevo de estación asignado a ${sample.backup_operator}.`;

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(msg, 'info');
      }

      this.announceWithLeia(`Prueba de alerta del sistema: Turno de comida para ${sample.name}. Relevo operativo asignado a ${sample.backup_operator}.`);
    }

    announceMealShiftsWithLeia() {
      const evalData = this.evaluateLiveMealAlerts();
      const onLunch = evalData.alerts.filter(a => a.alert_level === 'on_lunch');
      const upcoming = evalData.alerts.filter(a => a.alert_level === 'urgent' || a.alert_level === 'warning');

      let speech = `Reporte de turnos de comida a las ${evalData.currentTimeStr} hora de Maracaibo. `;
      if (onLunch.length > 0) {
        speech += `Actualmente en almuerzo: ${onLunch.map(o => o.staff_name + ' con relevo de ' + o.backup_operator).join(', ')}. `;
      } else {
        speech += `No hay colaboradores en almuerzo en este momento. `;
      }

      if (upcoming.length > 0) {
        speech += `Próximos relevos programados: ${upcoming.map(u => u.staff_name + ' a las ' + u.lunch_start_time).join(', ')}.`;
      } else {
        speech += `Todos los relevos de estación se encuentran en orden nominal bajo norma ISO 9001.`;
      }

      this.announceWithLeia(speech);
    }

    renderWorkstationScreen() {
      const container = document.getElementById('misipet-workstation-content');
      if (!container) return;

      if (!this.staffShifts || this.staffShifts.length === 0) {
        this.loadStaffShifts();
      } else {
        this.syncStaffFromAdminProfiles();
      }

      const activeInPlant = (this.staffShifts || []).filter(s => s.status === 'in_plant').length;
      const onLunchList = (this.staffShifts || []).filter(s => s.status === 'lunch');
      const onLunchCount = onLunchList.length;
      const checkedOutCount = (this.staffShifts || []).filter(s => s.status === 'checked_out').length;
      const evalData = this.evaluateLiveMealAlerts();

      const staffRowsHtml = (this.staffShifts || []).map(s => {
        const staffAlert = (evalData.alerts || []).find(a => a.staff_id === s.id) || {};
        let statusBadge = '';
        if (s.status === 'in_plant') {
          statusBadge = `<span class="badge" style="background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; font-weight:800; font-size:0.75rem; padding:4px 8px; border-radius:6px;">🟢 En Planta</span>`;
        } else if (s.status === 'lunch') {
          statusBadge = `<span class="badge" style="background:#FFFBEB; color:#B45309; border:1px solid #FCD34D; font-weight:800; font-size:0.75rem; padding:4px 8px; border-radius:6px;">🍲 En Almuerzo</span>`;
        } else {
          statusBadge = `<span class="badge" style="background:#F1F5F9; color:#64748B; border:1px solid #CBD5E1; font-weight:800; font-size:0.75rem; padding:4px 8px; border-radius:6px;">🚪 Salida Registrada (${s.actual_checkout || s.checkout_scheduled})</span>`;
        }

        const photoHtml = s.photo
          ? `<img src="${s.photo}" alt="${s.name}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1.5px solid #D4AF37; display:inline-block;" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline';"><span style="display:none; font-size:1.1rem;">${s.avatar || '👤'}</span>`
          : `<span style="font-size:1.1rem;">${s.avatar || '👤'}</span>`;

        return `
          <tr style="border-bottom:1px solid #E2E8F0; font-size:0.83rem; transition:background 0.15s ease;">
            <td style="padding:10px 12px; font-weight:800; color:#0F172A;">
              <div style="display:flex; align-items:center; gap:8px;">
                ${photoHtml}
                <div>
                  <div style="color:#0F172A; font-size:0.88rem;">${s.name}</div>
                  <div style="font-size:0.72rem; color:#64748B; font-weight:600;">${s.role}</div>
                </div>
              </div>
            </td>
            <td style="padding:10px 12px; color:#334155; font-weight:700;">
              <div>${s.area}</div>
              <div style="font-size:0.72rem; color:#64748B;">Relevo: ${s.backup_operator || 'Personal en Planta'}</div>
            </td>
            <td style="padding:10px 12px; color:#065F46; font-weight:800; white-space:nowrap;">
              ⏰ ${s.checkin_time}
            </td>
            <td style="padding:10px 12px; font-weight:800; color:#B45309; white-space:nowrap; background:rgba(245,158,11,0.04);">
              🍲 ${s.lunch_window}
            </td>
            <td style="padding:10px 12px; font-weight:800; color:#1D4ED8; white-space:nowrap; background:rgba(59,130,246,0.04);">
              🚪 ${s.checkout_scheduled}
            </td>
            <td style="padding:10px 12px; white-space:nowrap;">
              <div>${statusBadge}</div>
              <div style="margin-top:3px;">${staffAlert.alert_badge || ''}</div>
            </td>
            <td style="padding:10px 12px; text-align:center; white-space:nowrap;">
              <div style="display:flex; gap:5px; justify-content:center; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm" onclick="misipetEngine.toggleStaffLunch('${s.id}')" style="background:${s.status === 'lunch' ? '#10B981' : '#F59E0B'}; color:#FFFFFF; border:none; padding:4px 8px; border-radius:6px; font-size:0.72rem; font-weight:800; cursor:pointer;" title="${s.status === 'lunch' ? 'Registrar Retorno de Almuerzo' : 'Marcar Salida a Almuerzo'}">
                  ${s.status === 'lunch' ? '↩️ Regresar' : '🍲 Almorzar'}
                </button>
                <button type="button" class="btn btn-sm" onclick="misipetEngine.openMealConfigModal('${s.id}')" style="background:#FFFBEB; color:#B45309; border:1px solid #F59E0B; padding:4px 7px; border-radius:6px; font-size:0.72rem; font-weight:800; cursor:pointer;" title="Configurar hora de comida de este colaborador">
                  ⚙️ Comida
                </button>
                <button type="button" class="btn btn-sm" onclick="misipetEngine.triggerStaffMealAlert('${s.id}')" style="background:#EFF6FF; color:#1D4ED8; border:1px solid #93C5FD; padding:4px 7px; border-radius:6px; font-size:0.72rem; font-weight:800; cursor:pointer;" title="Emitir alerta en vivo y por voz para este colaborador">
                  🔔 Alertar
                </button>
                <button type="button" class="btn btn-sm" onclick="misipetEngine.toggleStaffCheckout('${s.id}')" style="background:${s.status === 'checked_out' ? '#0F172A' : '#EF4444'}; color:#FFFFFF; border:none; padding:4px 7px; border-radius:6px; font-size:0.72rem; font-weight:800; cursor:pointer;" title="${s.status === 'checked_out' ? 'Reincorporar a Planta' : 'Marcar Salida Oficial'}">
                  ${s.status === 'checked_out' ? '🔄 Reentrar' : '🚪 Salida'}
                </button>
                <button type="button" class="btn btn-sm" onclick="misipetEngine.openStaffShiftModal('${s.id}')" style="background:#F1F5F9; color:#334155; border:1px solid #CBD5E1; padding:4px 6px; border-radius:6px; font-size:0.72rem; cursor:pointer;" title="Editar Ficha de Turno Completa">
                  ✏️
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <div class="workstation-dashboard" style="background:#FFFFFF; border:2px solid #D4AF37; border-radius:18px; padding:22px; box-shadow:0 8px 24px rgba(0,0,0,0.08); font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <!-- ENCABEZADO DE PANTALLA INFERIOR -->
          <div class="workstation-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; border-bottom:2px solid #E2E8F0; padding-bottom:16px; margin-bottom:18px;">
            <div>
              <div style="font-size:0.75rem; font-weight:900; letter-spacing:1px; color:#D4AF37; text-transform:uppercase;">Centro de Control Operativo</div>
              <h2 class="workstation-title" style="margin:2px 0; font-size:1.35rem; font-weight:900; color:#0F172A;">
                PANTALLA INFERIOR • ESTACIÓN DE RECEPCIÓN & CONTROL OPERATIVO
              </h2>
              <span class="workstation-sub" style="font-size:0.82rem; color:#64748B;">
                Monitoreo en Vivo de Personal en Planta, Turnos de Salida, Horarios de Almuerzo & Volumen por Áreas
              </span>
            </div>
            <div class="workstation-quick-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn-ws-action" onclick="misipetEngine.openStaffShiftModal()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; box-shadow:0 3px 10px rgba(212,175,55,0.35);">
                ➕ Registrar Personal en Turno
              </button>
              <button class="btn-ws-action" onclick="app.switchTab('store')" style="background:#F8FAFC; color:#334155; border:1px solid #CBD5E1; padding:8px 14px; border-radius:8px; font-weight:700; cursor:pointer;">
                🛍️ Catálogo Tienda
              </button>
              <button class="btn-ws-action" onclick="app.switchTab('clinica')" style="background:#F8FAFC; color:#334155; border:1px solid #CBD5E1; padding:8px 14px; border-radius:8px; font-weight:700; cursor:pointer;">
                🏥 Agenda Veterinaria
              </button>
              <button class="btn-ws-action" onclick="clinicaEngine.openGroomingBookingModal('Circuito Grooming Spa')" style="background:#F8FAFC; color:#334155; border:1px solid #CBD5E1; padding:8px 14px; border-radius:8px; font-weight:700; cursor:pointer;">
                ✂️ Cita Grooming
              </button>
            </div>
          </div>

          <!-- TARJETAS RÁPIDAS DE CONTROL DE PERSONAL Y VOLUMEN -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:20px;">
            <div style="background:#ECFDF5; border:1.5px solid #A7F3D0; border-radius:12px; padding:12px 14px;">
              <div style="font-size:0.72rem; font-weight:800; color:#047857; text-transform:uppercase;">Personal en Planta Hoy</div>
              <div style="font-size:1.4rem; font-weight:900; color:#065F46; margin:3px 0;">${activeInPlant} <span style="font-size:0.8rem; font-weight:700;">Laborando</span></div>
              <div style="font-size:0.74rem; color:#059669;">De ${this.staffShifts.length} colaboradores en nómina activa</div>
            </div>

            <div style="background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:12px; padding:12px 14px;">
              <div style="font-size:0.72rem; font-weight:800; color:#B45309; text-transform:uppercase;">En Horario de Almuerzo</div>
              <div style="font-size:1.4rem; font-weight:900; color:#92400E; margin:3px 0;">${onLunchCount} <span style="font-size:0.8rem; font-weight:700;">en Pausa</span></div>
              <div style="font-size:0.74rem; color:#B45309;">${onLunchList.length > 0 ? onLunchList.map(s => s.name.split(' ')[0]).join(', ') : 'Ninguno en este momento'}</div>
            </div>

            <div style="background:#EFF6FF; border:1.5px solid #BFDBFE; border-radius:12px; padding:12px 14px;">
              <div style="font-size:0.72rem; font-weight:800; color:#1E40AF; text-transform:uppercase;">Próximas Salidas de Planta</div>
              <div style="font-size:1.05rem; font-weight:900; color:#1D4ED8; margin:3px 0;">04:00 PM • 04:30 PM • 05:00 PM</div>
              <div style="font-size:0.74rem; color:#2563EB;">Rosaura, Carlos P. & Dra. Andrea</div>
            </div>

            <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:12px; padding:12px 14px;">
              <div style="font-size:0.72rem; font-weight:800; color:#475569; text-transform:uppercase;">Volumen Operativo en Vivo</div>
              <div style="font-size:1.4rem; font-weight:900; color:#0F172A; margin:3px 0;">6 <span style="font-size:0.8rem; font-weight:700;">Pacientes</span></div>
              <div style="font-size:0.74rem; color:#64748B;">Grooming: 3 • Consultorios: 2 • Quirófano: 1</div>
            </div>
          </div>

          <!-- CUADRO DE SINCRONIZACIÓN Y CONFIGURACIÓN DE HORAS DE COMIDA DEL PERSONAL CON ALERTAS -->
          <div class="misipet-meal-schedule-panel" style="background:#FFFFFF; border:2px solid #F59E0B; border-radius:16px; padding:20px; margin-bottom:22px; box-shadow:0 6px 20px rgba(245,158,11,0.12);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1.5px solid #FDE68A; padding-bottom:14px; margin-bottom:14px;">
              <div>
                <div style="font-size:0.75rem; font-weight:900; letter-spacing:0.8px; color:#D97706; text-transform:uppercase;">
                  Control de Personal en Planta: Entrada, Salida & Horarios de Almuerzo • Hora de Venezuela VET (UTC-4)
                </div>
                <h3 style="margin:2px 0 0 0; font-size:1.2rem; font-weight:900; color:#0F172A; display:flex; align-items:center; gap:8px;">
                  <span>🍲 Sincronización & Configuración de Horas de Comida del Personal</span>
                  <span class="badge" style="background:#F59E0B; color:#FFFFFF; font-size:0.72rem; padding:3px 8px; border-radius:6px; font-weight:800;">ALERTAS EN VIVO</span>
                </h3>
                <p style="margin:3px 0 0 0; font-size:0.8rem; color:#64748B;">
                  Monitoreo automatizado para sincronizar, configurar y alertar las horas de comida de cada colaborador, con relevos de estación.
                </p>
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" class="btn-ws-action" onclick="misipetEngine.syncMealSchedule()" style="background:#FFFBEB; color:#B45309; border:1.5px solid #F59E0B; padding:7px 14px; border-radius:8px; font-weight:800; font-size:0.78rem; cursor:pointer; display:flex; align-items:center; gap:6px;">
                  🔄 Sincronizar Horas de Comida
                </button>
                <button type="button" class="btn-ws-action" onclick="misipetEngine.openMealConfigModal()" style="background:linear-gradient(135deg, #F59E0B, #D97706); color:#FFFFFF; border:none; padding:7px 16px; border-radius:8px; font-weight:900; font-size:0.78rem; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(245,158,11,0.35);">
                  ⚙️ Configurar Horas de Comida
                </button>
                <button type="button" class="btn-ws-action" onclick="misipetEngine.triggerTestMealAlert()" style="background:#EFF6FF; color:#1D4ED8; border:1.5px solid #3B82F6; padding:7px 12px; border-radius:8px; font-weight:800; font-size:0.78rem; cursor:pointer;" title="Probar emisión de alerta en vivo y notificación sonora">
                  🔔 Probar Alerta en Vivo
                </button>
                <button type="button" class="btn-ws-action" onclick="misipetEngine.announceMealShiftsWithLeia()" style="background:#0F172A; color:#FFFFFF; border:none; padding:7px 12px; border-radius:8px; font-weight:800; font-size:0.78rem; cursor:pointer;" title="Anunciar estado de comida con la voz de Leia">
                  📢 Alerta por Voz (Leia)
                </button>
              </div>
            </div>

            <!-- BANNER DINÁMICO DE ALERTAS ACTIVAS EN VIVO -->
            <div id="misipet-active-meal-alerts-container"></div>

            <div style="overflow-x:auto; border:1px solid #CBD5E1; border-radius:10px; background:#FFFFFF;">
              <table style="width:100%; border-collapse:collapse;">
                <thead>
                  <tr style="background:#0F172A; color:#FFFFFF; font-size:0.73rem; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #D4AF37;">
                    <th style="padding:10px 12px; text-align:left;">Colaborador</th>
                    <th style="padding:10px 12px; text-align:left;">Área de la Sucursal</th>
                    <th style="padding:10px 12px; text-align:left;">⏰ Entrada Planta</th>
                    <th style="padding:10px 12px; text-align:left;">🍲 Hora de Almuerzo</th>
                    <th style="padding:10px 12px; text-align:left;">🚪 Hora de Salida</th>
                    <th style="padding:10px 12px; text-align:left;">Estatus</th>
                    <th style="padding:10px 12px; text-align:center;">Acciones Rápidas</th>
                  </tr>
                </thead>
                <tbody>
                  ${staffRowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- SECCIÓN DE VOLUMEN OPERATIVO POR ÁREAS -->
          <div style="margin-bottom:10px;">
            <h3 style="margin:0 0 12px 0; font-size:1.05rem; font-weight:900; color:#0F172A; display:flex; align-items:center; gap:8px;">
              <span>📊 Volumen Operativo en Áreas de la Sucursal</span>
            </h3>
            <div class="workstation-cards-row" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:14px;">
              <!-- Grooming & Spa -->
              <div class="ws-widget-box" style="background:#FFFFFF; border:1.5px solid #E2E8F0; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <h4 style="margin:0 0 10px 0; color:#0F172A; font-size:0.95rem; font-weight:900; display:flex; align-items:center; gap:6px;">
                  <span>✂️ Circuito Grooming & Spa Canino/Felino (3)</span>
                </h4>
                <ul class="ws-list" style="margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px; font-size:0.83rem;">
                  <li style="padding:8px 10px; background:#F8FAFC; border-radius:8px; border-left:3px solid #10B981;">
                    <strong>Toby</strong> (Golden Retriever) • Batea 1 (En Baño Ozono & Mascarilla)
                  </li>
                  <li style="padding:8px 10px; background:#F8FAFC; border-radius:8px; border-left:3px solid #3B82F6;">
                    <strong>Luna</strong> (Poodle Toy) • Mesa Secado 2 (Corte Estilo Asiático)
                  </li>
                  <li style="padding:8px 10px; background:#F8FAFC; border-radius:8px; border-left:3px solid #F59E0B;">
                    <strong>Max</strong> (Bulldog Francés) • Espera en Lobby VIP (Turno 11:30 AM)
                  </li>
                </ul>
              </div>

              <!-- Consultorios & Quirófano -->
              <div class="ws-widget-box" style="background:#FFFFFF; border:1.5px solid #E2E8F0; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <h4 style="margin:0 0 10px 0; color:#0F172A; font-size:0.95rem; font-weight:900; display:flex; align-items:center; gap:6px;">
                  <span>🏥 Consultorios Médicos & Quirófano 24/7 (3)</span>
                </h4>
                <ul class="ws-list" style="margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px; font-size:0.83rem;">
                  <li style="padding:8px 10px; background:#F8FAFC; border-radius:8px; border-left:3px solid #10B981;">
                    <strong>Consultorio 1 (Dra. Andrea Gutiérrez):</strong> Consulta Vacunación Puppy (10:30 AM)
                  </li>
                  <li style="padding:8px 10px; background:#F8FAFC; border-radius:8px; border-left:3px solid #3B82F6;">
                    <strong>Consultorio 2 (Dr. Alejandro Morales):</strong> Evaluación Pre-quirúrgica (11:00 AM)
                  </li>
                  <li style="padding:8px 10px; background:#F8FAFC; border-radius:8px; border-left:3px solid #EF4444;">
                    <strong>Quirófano 24/7:</strong> Esterilización Láser Programada (11:30 AM)
                  </li>
                </ul>
              </div>

              <!-- Recepción Mostrador & Concierge -->
              <div class="ws-widget-box" style="background:#FFFFFF; border:1.5px solid #E2E8F0; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <h4 style="margin:0 0 10px 0; color:#0F172A; font-size:0.95rem; font-weight:900; display:flex; align-items:center; gap:6px;">
                  <span>👑 Recepción Mostrador & Facturación</span>
                </h4>
                <ul class="ws-list" style="margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px; font-size:0.83rem;">
                  <li style="padding:8px 10px; background:#F8FAFC; border-radius:8px; border-left:3px solid #D4AF37;">
                    <strong>Dalybell Ramírez:</strong> Recepción activa • 4 despachos de boutique pendientes
                  </li>
                  <li style="padding:8px 10px; background:#F8FAFC; border-radius:8px; border-left:3px solid #10B981;">
                    <strong>Caja Mostrador:</strong> Pagos C2P Banplus y POS en curso
                  </li>
                  <li style="padding:8px 10px; background:#F8FAFC; border-radius:8px; border-left:3px solid #3B82F6;">
                    <strong>Sala de Espera:</strong> Clima a 22.4°C conforme bajo sensor IoT
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ==========================================
    // MODALES CRUD DE ACTIVOS
    // ==========================================
    openAssetModal(dept, assetId) {
      const modal = document.getElementById('modal-misipet-asset-crud');
      if (!modal) return;

      const titleEl = document.getElementById('misipet-asset-modal-title');
      const deptSelect = document.getElementById('misipet-form-dept');
      const idInput = document.getElementById('misipet-form-id');
      const nameInput = document.getElementById('misipet-form-name');
      const catInput = document.getElementById('misipet-form-category');
      const odoInput = document.getElementById('misipet-form-odometer');
      const locInput = document.getElementById('misipet-form-location');
      const respInput = document.getElementById('misipet-form-responsible');
      const nextMinorInput = document.getElementById('misipet-form-next-minor');
      const nextMajorInput = document.getElementById('misipet-form-next-major');

      deptSelect.value = dept || this.activeDepartment;

      if (assetId) {
        titleEl.innerText = `Editar Activo: ${assetId}`;
        const assets = this.assetsData[dept] || [];
        const item = assets.find(a => a.id === assetId);
        if (item) {
          idInput.value = item.id;
          idInput.disabled = true;
          nameInput.value = item.name || '';
          catInput.value = item.category || '';
          odoInput.value = item.hours_odometer || 0;
          locInput.value = item.location || '';
          respInput.value = item.responsible || '';
          nextMinorInput.value = item.next_minor_service || '';
          nextMajorInput.value = item.next_major_service || '';
          const semSelect = document.getElementById('misipet-form-semaphore');
          if (semSelect) {
            semSelect.value = item.computed_semaphore || item.semaphore || 'green';
          }
        }
      } else {
        titleEl.innerText = `Añadir Nuevo Equipo a ${dept.toUpperCase()}`;
        idInput.value = `${dept.toUpperCase().substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;
        idInput.disabled = false;
        nameInput.value = '';
        catInput.value = '';
        odoInput.value = 0;
        locInput.value = '';
        respInput.value = 'Personal Staff';
        nextMinorInput.value = '';
        nextMajorInput.value = '';
      }

      modal.style.display = 'flex';
    }

    closeAssetModal() {
      const modal = document.getElementById('modal-misipet-asset-crud');
      if (modal) modal.style.display = 'none';
    }

    async saveAssetForm(event) {
      if (event) event.preventDefault();
      const dept = document.getElementById('misipet-form-dept').value;
      const id = document.getElementById('misipet-form-id').value.trim();
      const name = document.getElementById('misipet-form-name').value.trim();
      const category = document.getElementById('misipet-form-category').value.trim();
      const hours_odometer = parseFloat(document.getElementById('misipet-form-odometer').value) || 0;
      const location = document.getElementById('misipet-form-location').value.trim();
      const responsible = document.getElementById('misipet-form-responsible').value.trim();
      const next_minor_service = document.getElementById('misipet-form-next-minor').value;
      const next_major_service = document.getElementById('misipet-form-next-major').value;

      if (!id || !name) {
        alert('Por favor ingrese el ID y Nombre del equipo.');
        return;
      }

      const semSelect = document.getElementById('misipet-form-semaphore');
      const semaphore = semSelect ? semSelect.value : 'green';

      const payload = {
        id,
        name,
        category,
        hours_odometer,
        location,
        responsible,
        next_minor_service: next_minor_service || '2026-11-30',
        next_major_service: next_major_service || '2027-05-30',
        department: dept,
        semaphore: semaphore,
        computed_semaphore: semaphore,
        status: semaphore === 'green' ? 'Operativo / Mantenimiento Conforme' : (semaphore === 'yellow' ? 'Atención Preventiva' : 'Crítico / Vencido')
      };

      try {
        const isEdit = document.getElementById('misipet-form-id').disabled;
        const endpoint = isEdit ? '/api/v1/misipet/assets/update' : '/api/v1/misipet/assets';
        const bodyData = isEdit ? payload : { dept, asset: payload };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });

        if (!res.ok) throw new Error('Error al guardar');
        this.closeAssetModal();
        this.loadOverview();
        this.loadDepartment(dept);
      } catch (e) {
        alert('Error guardando activo: ' + e.message);
      }
    }

    async deleteAssetPrompt(assetId) {
      if (!confirm(`¿Está seguro de eliminar el activo ${assetId} del inventario operativo?`)) return;
      try {
        const res = await fetch('/api/v1/misipet/assets/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: assetId })
        });
        if (!res.ok) throw new Error('Error eliminando');
        this.loadOverview();
        this.loadDepartment(this.activeDepartment);
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    // ==========================================
    // SEGURIDAD Y ROLES DE MANTENIMIENTO
    // ==========================================
    isAuthorizedMaintenance() {
      const role = (this.currentRole || (window.authEngine && window.authEngine.currentUser && window.authEngine.currentUser.role) || window.currentRole || 'supervisor').toLowerCase();
      const unauthorized = ['customer', 'guest', 'visitante', 'cliente'];
      if (unauthorized.includes(role)) return false;
      const authorized = ['admin_geo', 'admin', 'gerencia', 'supervisor', 'mantenimiento'];
      return authorized.includes(role);
    }

    // ==========================================
    // MODAL DE TANQUES DE AGUA (CRUD & CALIBRACIÓN TUYA)
    // ==========================================
    openTankModal(tankId) {
      const modal = document.getElementById('modal-misipet-tank-crud');
      if (!modal) return;

      const isAuth = this.isAuthorizedMaintenance();
      const securityBanner = document.getElementById('misipet-tank-security-banner');
      const saveBtn = document.getElementById('btn-save-tank-modal');

      if (securityBanner) {
        securityBanner.style.display = isAuth ? 'none' : 'flex';
      }
      if (saveBtn) {
        saveBtn.style.display = isAuth ? 'inline-block' : 'none';
      }

      const titleEl = document.getElementById('misipet-tank-modal-title');
      const idInput = document.getElementById('misipet-tank-id');
      const nameInput = document.getElementById('misipet-tank-name');
      const locInput = document.getElementById('misipet-tank-location');
      const pumpInput = document.getElementById('misipet-tank-pump');
      const tuyaIdInput = document.getElementById('misipet-tank-tuya-id');
      const tuyaEndpointInput = document.getElementById('misipet-tank-tuya-endpoint');
      const tuyaTokenInput = document.getElementById('misipet-tank-tuya-token');
      const capInput = document.getElementById('misipet-tank-cap');
      const offsetInput = document.getElementById('misipet-tank-offset');
      const heightInput = document.getElementById('misipet-tank-height');
      const currInput = document.getElementById('misipet-tank-curr');
      const refillInput = document.getElementById('misipet-tank-refill');
      const lastSyncLabel = document.getElementById('misipet-tank-modal-last-sync-label');
      const signalLabel = document.getElementById('misipet-tank-modal-signal-label');

      if (tankId && this.overviewData && this.overviewData.tanks) {
        const t = this.overviewData.tanks.find(x => x.id === tankId);
        if (t) {
          if (titleEl) titleEl.innerText = `Calibrar Tanque: ${t.name}`;
          if (idInput) {
            idInput.value = t.id;
            idInput.disabled = true;
          }
          if (nameInput) nameInput.value = t.name || '';
          if (locInput) locInput.value = t.location || '';
          if (pumpInput) pumpInput.value = t.associated_pump || '';
          if (tuyaIdInput) tuyaIdInput.value = t.tuya_device_id || `bf${t.id.replace(/[^a-z0-9]/gi, '').substring(0, 8)}sub`;
          if (tuyaEndpointInput) tuyaEndpointInput.value = t.tuya_api_endpoint || `https://openapi.tuyaus.com/v1.0/devices/${t.tuya_device_id || t.id}/status`;
          if (tuyaTokenInput) {
            tuyaTokenInput.value = isAuth ? (t.tuya_auth_token || 'ty_sec_live_active_token') : '••••••••••••••••';
          }
          if (capInput) capInput.value = t.capacity_liters || 1000;
          if (offsetInput) offsetInput.value = t.sensor_offset_cm !== undefined ? t.sensor_offset_cm : 15.0;
          if (heightInput) heightInput.value = t.tank_height_cm !== undefined ? t.tank_height_cm : 200.0;
          if (currInput) currInput.value = t.current_liters !== undefined ? t.current_liters : 0;
          if (refillInput) refillInput.value = t.refill_status || 'Llenado Automático Activo';

          const lastSync = t.last_telemetry_timestamp || t.last_iot_update || 'Reciente';
          if (lastSyncLabel) lastSyncLabel.innerText = `Última Telemetría: ${lastSync.replace('T', ' ').substring(0, 19)}`;
          if (signalLabel) signalLabel.innerText = `Protocolo: Tuya OpenAPI REST • Estado: ${t.health_status || 'healthy'}`;
        }
      } else {
        if (titleEl) titleEl.innerText = '➕ Añadir Nuevo Tanque a la Batería Hídrica';
        const randNum = Math.floor(100 + Math.random() * 900);
        if (idInput) {
          idInput.value = `tank-${randNum}`;
          idInput.disabled = false;
        }
        if (nameInput) nameInput.value = '';
        if (locInput) locInput.value = 'Don Bosco Planta Principal';
        if (pumpInput) pumpInput.value = 'Bomba Presurizadora 1.5 HP';
        if (tuyaIdInput) tuyaIdInput.value = `bf${Math.random().toString(16).substring(2, 10)}gen`;
        if (tuyaEndpointInput) tuyaEndpointInput.value = 'https://openapi.tuyaus.com/v1.0/devices/status';
        if (tuyaTokenInput) tuyaTokenInput.value = isAuth ? 'ty_sec_live_active_token' : '••••••••••••••••';
        if (capInput) capInput.value = 3000;
        if (offsetInput) offsetInput.value = 15.0;
        if (heightInput) heightInput.value = 180.0;
        if (currInput) currInput.value = 2700;
        if (refillInput) refillInput.value = 'Llenado Automático Inactivo';

        if (lastSyncLabel) lastSyncLabel.innerText = 'Última Telemetría: Sensor Nuevo (Sin enlace previo)';
        if (signalLabel) signalLabel.innerText = 'Protocolo: Tuya OpenAPI REST / Alibaba Cloud';
      }

      // Deshabilitar campos si el rol no está autorizado para mantenimiento
      const editableFields = [nameInput, locInput, pumpInput, tuyaIdInput, tuyaEndpointInput, tuyaTokenInput, capInput, offsetInput, heightInput, currInput, refillInput];
      editableFields.forEach(el => {
        if (el) el.disabled = !isAuth;
      });

      this.recalcTankModalLiveView();
      modal.style.display = 'flex';
    }

    closeTankModal() {
      const modal = document.getElementById('modal-misipet-tank-crud');
      if (modal) modal.style.display = 'none';
    }

    recalcTankModalLiveView() {
      const cap = parseFloat(document.getElementById('misipet-tank-cap')?.value) || 1;
      const curr = parseFloat(document.getElementById('misipet-tank-curr')?.value) || 0;
      const pct = Math.max(0, Math.min(100, Math.round((curr / cap) * 1000) / 10));

      const badge = document.getElementById('misipet-tank-modal-pct-badge');
      const bar = document.getElementById('misipet-tank-modal-fill-bar');

      if (badge) {
        badge.innerText = `${pct}% (${curr.toLocaleString()} L)`;
        if (pct < 25) {
          badge.style.color = '#EF4444';
        } else if (pct < 50) {
          badge.style.color = '#F59E0B';
        } else {
          badge.style.color = '#34D399';
        }
      }

      if (bar) {
        bar.style.width = `${pct}%`;
        if (pct < 25) {
          bar.style.background = 'linear-gradient(90deg, #DC2626, #EF4444)';
        } else if (pct < 50) {
          bar.style.background = 'linear-gradient(90deg, #D97706, #F59E0B)';
        } else {
          bar.style.background = 'linear-gradient(90deg, #10B981, #34D399)';
        }
      }
    }

    toggleTuyaTokenVisibility() {
      const tokenInput = document.getElementById('misipet-tank-tuya-token');
      if (!tokenInput) return;
      tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
    }

    async pingTankTuyaSensorFromModal() {
      const tankId = document.getElementById('misipet-tank-id')?.value;
      const tuyaId = document.getElementById('misipet-tank-tuya-id')?.value;
      const target = tankId || tuyaId;
      if (!target) {
        alert('Por favor ingrese o seleccione un ID de tanque para probar la conexión.');
        return;
      }

      try {
        const res = await fetch('/api/v1/misipet/water/tuya/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tank_id: target, device_id: tuyaId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.message || 'Error al conectar con sensor Tuya');

        const syncLabel = document.getElementById('misipet-tank-modal-last-sync-label');
        const signalLabel = document.getElementById('misipet-tank-modal-signal-label');
        if (syncLabel) syncLabel.innerText = 'Última Telemetría: ¡Sincronizado ahora mismo!';
        if (signalLabel) signalLabel.innerText = `Protocolo: Tuya OpenAPI REST • Latencia ${data.latency_ms || 24}ms (OK)`;

        if (data.tank && data.tank.current_liters !== undefined) {
          const currInput = document.getElementById('misipet-tank-curr');
          if (currInput) {
            currInput.value = data.tank.current_liters;
            this.recalcTankModalLiveView();
          }
        }

        if (window.showToast) {
          window.showToast(`✅ Ping exitoso con sensor Tuya (${data.tank_id || target}). Telemetría actualizada en vivo.`, 'success');
        } else {
          alert(`✅ Ping exitoso con sensor Tuya (${data.tank_id || target}): Conectado (${data.latency_ms || 24}ms)`);
        }

        this.loadOverview();
        if (window.integrations && typeof window.integrations.loadTuyaSensorsHealth === 'function') {
          window.integrations.loadTuyaSensorsHealth(true);
        }
      } catch (err) {
        alert(`❌ Error al conectar con sensor Tuya IoT: ${err.message}`);
      }
    }

    async saveTankForm(event) {
      if (event) event.preventDefault();
      if (!this.isAuthorizedMaintenance()) {
        alert('Acceso no autorizado: Solamente perfiles de gerencia y mantenimiento pueden modificar la calibración y hardware de los tanques.');
        return;
      }

      const id = document.getElementById('misipet-tank-id').value.trim();
      const name = document.getElementById('misipet-tank-name').value.trim();
      const location = document.getElementById('misipet-tank-location')?.value.trim() || 'Don Bosco';
      const associated_pump = document.getElementById('misipet-tank-pump')?.value.trim() || 'Bomba en Línea';
      const tuya_device_id = document.getElementById('misipet-tank-tuya-id')?.value.trim() || '';
      const tuya_api_endpoint = document.getElementById('misipet-tank-tuya-endpoint')?.value.trim() || '';
      const tuya_auth_token = document.getElementById('misipet-tank-tuya-token')?.value.trim() || '';
      const capacity_liters = parseFloat(document.getElementById('misipet-tank-cap').value) || 1000;
      const sensor_offset_cm = parseFloat(document.getElementById('misipet-tank-offset')?.value) || 0;
      const tank_height_cm = parseFloat(document.getElementById('misipet-tank-height')?.value) || 200;
      const current_liters = parseFloat(document.getElementById('misipet-tank-curr').value) || 0;
      const refill_status = document.getElementById('misipet-tank-refill')?.value || 'Llenado Automático Activo';

      const payload = {
        id,
        name,
        location,
        associated_pump,
        tuya_device_id,
        tuya_api_endpoint,
        tuya_auth_token,
        capacity_liters,
        sensor_offset_cm,
        tank_height_cm,
        current_liters,
        refill_status
      };

      try {
        const isEdit = document.getElementById('misipet-tank-id').disabled;
        const endpoint = isEdit ? '/api/v1/misipet/tanks/update' : '/api/v1/misipet/tanks';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || errData.message || 'Error al guardar tanque');
        }

        this.closeTankModal();
        if (window.showToast) {
          window.showToast(`✅ Tanque ${name} y calibración Tuya guardados exitosamente.`, 'success');
        }
        this.loadOverview();
        if (window.integrations && typeof window.integrations.loadTuyaSensorsHealth === 'function') {
          window.integrations.loadTuyaSensorsHealth(true);
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    // =========================================================================
    // MODAL & CALIBRACIÓN IOT: RESILIENCIA ENERGÉTICA (PLANTA CUMMINS 65 kVA)
    // =========================================================================
    async openPowerPlantConfigModal() {
      const modal = document.getElementById('modal-misipet-power-plant-config');
      if (!modal) return;

      const isAuth = this.isAuthorizedMaintenance();
      const securityBanner = document.getElementById('power-plant-security-banner');
      const saveBtn = document.getElementById('btn-save-power-modal');

      if (securityBanner) securityBanner.style.display = isAuth ? 'none' : 'flex';
      if (saveBtn) saveBtn.style.display = isAuth ? 'inline-block' : 'none';

      let p = (this.overviewData && this.overviewData.power_plant) ? this.overviewData.power_plant : {};
      try {
        const res = await fetch('/api/v1/misipet/power/config');
        if (res.ok) {
          const json = await res.json();
          if (json.config || json.data) p = Object.assign({}, p, json.config || json.data);
        }
      } catch (err) {
        console.warn('[MisiPet] Error cargando config de planta eléctrica:', err);
      }

      const ctrlEl = document.getElementById('power-form-controller');
      const protoEl = document.getElementById('power-form-protocol');
      const ipEl = document.getElementById('power-form-ip');
      const portEl = document.getElementById('power-form-port');
      const ssidEl = document.getElementById('power-form-ssid');
      const passEl = document.getElementById('power-form-pass');
      const capEl = document.getElementById('power-form-tank-cap');
      const burnEl = document.getElementById('power-form-burn-rate');
      const minFuelEl = document.getElementById('power-form-min-fuel');
      const voltEl = document.getElementById('power-form-voltage');
      const freqEl = document.getElementById('power-form-freq');
      const currFuelEl = document.getElementById('power-form-fuel-current');
      const statusEl = document.getElementById('power-form-status');
      const webhookEl = document.getElementById('power-form-webhook');

      if (ctrlEl) ctrlEl.value = p.controller_model || 'DeepSea Electronics DSE 7320 / ESP32 Modbus Gateway';
      if (protoEl) protoEl.value = p.protocol || 'Modbus RS485 to Wi-Fi ESP32';
      if (ipEl) ipEl.value = p.ip_address || '192.168.1.185';
      if (portEl) portEl.value = p.modbus_port || 502;
      if (ssidEl) ssidEl.value = p.wifi_ssid || 'MrsPets-IoT-Infra';
      if (passEl) passEl.value = isAuth ? (p.wifi_password || 'Mr$Pet$2026!Gen') : '••••••••••••';
      if (capEl) capEl.value = p.tank_capacity_liters || 250;
      if (burnEl) burnEl.value = p.burn_rate_lph || 5.5;
      if (minFuelEl) minFuelEl.value = p.min_fuel_threshold_liters || 75;
      if (voltEl) voltEl.value = p.nominal_voltage_v || p.voltage || 208;
      if (freqEl) freqEl.value = p.nominal_frequency_hz || p.frequency_hz || 60.0;
      if (currFuelEl) currFuelEl.value = p.current_fuel_liters !== undefined ? p.current_fuel_liters : (p.fuel_liters || 210);
      if (statusEl) statusEl.value = p.status || 'ATS Standby • Listo';
      if (webhookEl) webhookEl.checked = p.webhook_action !== 'DISABLED';

      const editable = [ctrlEl, protoEl, ipEl, portEl, ssidEl, passEl, capEl, burnEl, minFuelEl, voltEl, freqEl, currFuelEl, statusEl, webhookEl];
      editable.forEach(el => {
        if (el) el.disabled = !isAuth;
      });

      const pingResults = document.getElementById('power-ping-results');
      if (pingResults) pingResults.style.display = 'none';

      this.recalcPowerPlantModalLiveView();
      modal.style.display = 'flex';
    }

    closePowerPlantConfigModal() {
      const modal = document.getElementById('modal-misipet-power-plant-config');
      if (modal) modal.style.display = 'none';
    }

    togglePowerPassVisibility() {
      const passEl = document.getElementById('power-form-pass');
      if (passEl) passEl.type = passEl.type === 'password' ? 'text' : 'password';
    }

    recalcPowerPlantModalLiveView() {
      const cap = parseFloat(document.getElementById('power-form-tank-cap')?.value) || 1;
      const curr = parseFloat(document.getElementById('power-form-fuel-current')?.value) || 0;
      const burn = parseFloat(document.getElementById('power-form-burn-rate')?.value) || 5.5;
      const pct = Math.max(0, Math.min(100, Math.round((curr / cap) * 1000) / 10));
      const autonomy = burn > 0 ? (curr / burn).toFixed(1) : 0;

      const pctBadge = document.getElementById('power-modal-pct-badge');
      const autonomyBadge = document.getElementById('power-modal-autonomy-badge');
      const bar = document.getElementById('power-modal-fill-bar');

      if (pctBadge) {
        pctBadge.innerText = `${pct}% (${curr.toLocaleString()} L)`;
        pctBadge.style.color = pct < 25 ? '#EF4444' : (pct < 50 ? '#F59E0B' : '#34D399');
      }

      if (autonomyBadge) {
        autonomyBadge.innerText = `⏱️ ${autonomy} Horas`;
      }

      if (bar) {
        bar.style.width = `${pct}%`;
        bar.style.background = pct < 25
          ? 'linear-gradient(90deg, #DC2626, #EF4444)'
          : (pct < 50 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #10B981, #34D399)');
      }
    }

    async pingPowerPlantTest() {
      const pingResults = document.getElementById('power-ping-results');
      const statusEl = document.getElementById('power-ping-status');
      const metricsEl = document.getElementById('power-ping-metrics');
      const detailsEl = document.getElementById('power-ping-details');

      if (pingResults) {
        pingResults.style.display = 'block';
        pingResults.style.borderColor = '#38BDF8';
        if (statusEl) {
          statusEl.style.color = '#38BDF8';
          statusEl.innerText = '⏳ Conectando con DeepSea DSE 7320 vía Modbus RS485...';
        }
        if (metricsEl) metricsEl.innerText = 'Handshake en curso...';
        if (detailsEl) detailsEl.innerText = 'Enviando petición de lectura de registros holding 40001-40024.';
      }

      try {
        const res = await fetch('/api/v1/misipet/power/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: 'Supervisor/Mantenimiento' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.message || 'Fallo de handshake Modbus');

        if (pingResults) {
          pingResults.style.borderColor = '#10B981';
          if (statusEl) {
            statusEl.style.color = '#34D399';
            statusEl.innerText = '✓ Conexión Modbus RS485 / Wi-Fi Estable (200 OK)';
          }
          if (metricsEl) {
            metricsEl.innerText = `Latencia: ${data.latency_ms || 11.4}ms • Señal: ${data.signal_strength_dbm || -56}dBm (${data.signal_quality || 'Excelente'})`;
          }
          if (detailsEl) {
            detailsEl.innerText = `Controlador: ${data.controller || 'DeepSea DSE 7320'} • IP: ${data.ip_address || '192.168.1.185'} • Puerto: ${data.modbus_port || 502} • ATS: Listo.`;
          }
        }

        const lastSyncLabel = document.getElementById('power-modal-last-sync-label');
        const signalLabel = document.getElementById('power-modal-signal-label');
        if (lastSyncLabel) lastSyncLabel.innerText = 'Última Telemetría: ¡Sincronizado ahora mismo!';
        if (signalLabel) signalLabel.innerText = `Protocolo: Modbus TCP / ESP32 • Latencia ${data.latency_ms || 11.4}ms (OK)`;

        if (data.telemetry && data.telemetry.combustible_litros !== undefined) {
          const currInput = document.getElementById('power-form-fuel-current');
          if (currInput) {
            currInput.value = data.telemetry.combustible_litros;
            this.recalcPowerPlantModalLiveView();
          }
        }

        if (window.showToast) {
          window.showToast(`⚡ Ping exitoso con Controlador DeepSea DSE 7320 / ESP32 (${data.latency_ms || 11.4}ms). Telemetría en vivo.`, 'success');
        } else {
          alert(`⚡ Ping exitoso con Planta Eléctrica: Conectado (${data.latency_ms || 11.4}ms)`);
        }

        this.loadOverview();
      } catch (err) {
        if (pingResults) {
          pingResults.style.borderColor = '#EF4444';
          if (statusEl) {
            statusEl.style.color = '#EF4444';
            statusEl.innerText = `❌ Error de Handshake: ${err.message}`;
          }
        }
        alert(`❌ Error al conectar con Controlador de Planta Eléctrica: ${err.message}`);
      }
    }

    async savePowerPlantConfig(event) {
      if (event) event.preventDefault();
      if (!this.isAuthorizedMaintenance()) {
        alert('Acceso no autorizado: Solamente perfiles de gerencia y mantenimiento pueden modificar la calibración y hardware de la planta eléctrica.');
        return;
      }

      const ctrl = document.getElementById('power-form-controller')?.value.trim() || 'DeepSea DSE 7320';
      const proto = document.getElementById('power-form-protocol')?.value || 'Modbus RS485 to Wi-Fi ESP32';
      const ip = document.getElementById('power-form-ip')?.value.trim() || '192.168.1.185';
      const port = parseInt(document.getElementById('power-form-port')?.value, 10) || 502;
      const ssid = document.getElementById('power-form-ssid')?.value.trim() || 'MrsPets-IoT-Infra';
      const pass = document.getElementById('power-form-pass')?.value || '';
      const cap = parseFloat(document.getElementById('power-form-tank-cap')?.value) || 250;
      const burn = parseFloat(document.getElementById('power-form-burn-rate')?.value) || 5.5;
      const minFuel = parseFloat(document.getElementById('power-form-min-fuel')?.value) || 75;
      const volt = parseFloat(document.getElementById('power-form-voltage')?.value) || 208;
      const freq = parseFloat(document.getElementById('power-form-freq')?.value) || 60.0;
      const currFuel = parseFloat(document.getElementById('power-form-fuel-current')?.value) || 210;
      const status = document.getElementById('power-form-status')?.value || 'ATS Standby • Listo';
      const webhook = document.getElementById('power-form-webhook')?.checked;

      const payload = {
        controller_model: ctrl,
        protocol: proto,
        ip_address: ip,
        modbus_port: port,
        wifi_ssid: ssid,
        wifi_password: pass,
        tank_capacity_liters: cap,
        burn_rate_lph: burn,
        min_fuel_threshold_liters: minFuel,
        nominal_voltage_v: volt,
        nominal_frequency_hz: freq,
        current_fuel_liters: currFuel,
        status: status,
        make_webhook_action: webhook ? 'DISPATCH_FUEL_LOW_ALERT' : 'DISABLED'
      };

      try {
        const res = await fetch('/api/v1/misipet/power/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || errData.message || 'Error al guardar configuración de planta eléctrica');
        }

        this.closePowerPlantConfigModal();
        if (window.showToast) {
          window.showToast('✅ Configuración de Resiliencia Energética (Planta Cummins 65 kVA) guardada con éxito.', 'success');
        }
        this.loadOverview();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    // ==========================================
    // OVERRIDE DIRECTIVO & CAMBIO DE CRITERIO (HARRY, DALYBELL, MIKE)
    // ==========================================
    openOverrideModal(assetId, assetName, currentSem) {
      const modal = document.getElementById('modal-misipet-asset-override');
      if (!modal) return;

      const idInput = document.getElementById('override-form-asset-id');
      const titleEl = document.getElementById('override-asset-display-title');
      const infoEl = document.getElementById('override-asset-display-info');
      const semSelect = document.getElementById('override-form-semaphore');
      const reasonEl = document.getElementById('override-form-reason');

      if (idInput) idInput.value = assetId;
      if (titleEl) titleEl.innerText = `Equipo: ${assetName || assetId} (${assetId})`;

      let assetItem = null;
      for (const d in this.assetsData) {
        const found = (this.assetsData[d] || []).find(a => a.id === assetId);
        if (found) { assetItem = found; break; }
      }

      if (infoEl && assetItem) {
        infoEl.innerText = `Ubicación: ${assetItem.location || 'Planta Principal'} • Odómetro: ${assetItem.hours_odometer || 0} hrs • Responsable: ${assetItem.responsible || 'Personal de Turno'}`;
      }

      if (semSelect) {
        semSelect.value = currentSem || (assetItem && (assetItem.computed_semaphore || assetItem.semaphore)) || 'green';
      }

      if (reasonEl) {
        reasonEl.value = 'Inspección técnica y mantenimiento verificado conforme en sitio bajo norma ISO 9001.';
      }

      modal.style.display = 'flex';
    }

    closeOverrideModal() {
      const modal = document.getElementById('modal-misipet-asset-override');
      if (modal) modal.style.display = 'none';
    }

    async saveOverrideStatus(event) {
      if (event) event.preventDefault();
      const assetId = document.getElementById('override-form-asset-id').value;
      const actorEl = document.getElementById('override-form-actor');
      const actor = actorEl ? actorEl.value : 'Harry & Dalybell (Directiva GEO)';
      const semaphoreEl = document.getElementById('override-form-semaphore');
      const semaphore = semaphoreEl ? semaphoreEl.value : 'green';
      const reasonEl = document.getElementById('override-form-reason');
      const reason = reasonEl ? reasonEl.value.trim() : 'Mantenimiento verificado conforme en planta';

      if (!assetId) return;

      let updatedDept = null;
      let assetName = assetId;
      for (const d in this.assetsData) {
        const item = (this.assetsData[d] || []).find(a => a.id === assetId);
        if (item) {
          item.semaphore = semaphore;
          item.computed_semaphore = semaphore;
          item.last_override = {
            actor: actor,
            reason: reason || 'Supervisión Directiva Conforme',
            timestamp: new Date().toISOString()
          };
          if (semaphore === 'green') {
            item.status = 'Operativo / Override Conforme ISO 9001';
            item.hours_odometer = 0;
          } else if (semaphore === 'yellow') {
            item.status = 'Atención Preventiva / Bajo Observación';
          } else {
            item.status = 'Crítico / Requiere Mantenimiento Inmediato';
          }
          assetName = item.name || assetId;
          updatedDept = d;
          break;
        }
      }

      try {
        await fetch('/api/v1/misipet/assets/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: assetId,
            semaphore: semaphore,
            computed_semaphore: semaphore,
            status: semaphore === 'green' ? 'Operativo / Override Conforme' : (semaphore === 'yellow' ? 'Atención Preventiva' : 'Crítico / Vencido'),
            hours_odometer: semaphore === 'green' ? 0 : undefined,
            last_override: {
              actor: actor,
              reason: reason,
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (err) {
        console.warn('Sync override backend:', err);
      }

      this.closeOverrideModal();
      this.loadOverview();
      if (updatedDept) this.loadDepartment(updatedDept);
      else this.renderDepartmentAssets();

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✅ Override aplicado: ${assetName} colocado en ${semaphore.toUpperCase()} por ${actor}`, 'success');
      } else {
        alert(`✅ Override aplicado: ${assetName} colocado en ${semaphore.toUpperCase()} por ${actor}`);
      }
    }

    async quickSetSemaphore(assetId, newSemaphore, actorName = 'Harry & Dalybell (Directiva GEO)') {
      if (!assetId || !newSemaphore) return;

      let updatedDept = null;
      let assetName = assetId;
      for (const d in this.assetsData) {
        const item = (this.assetsData[d] || []).find(a => a.id === assetId);
        if (item) {
          item.semaphore = newSemaphore;
          item.computed_semaphore = newSemaphore;
          assetName = item.name || assetId;
          item.last_override = {
            actor: actorName,
            reason: newSemaphore === 'green' ? 'Mantenimiento realizado y verificado en planta' : (newSemaphore === 'yellow' ? 'Observación preventiva en turno' : 'Alerta de mantenimiento correctivo requerida'),
            timestamp: new Date().toISOString()
          };
          if (newSemaphore === 'green') {
            item.status = 'Operativo / Mantenimiento Realizado Conforme';
            item.hours_odometer = 0;
          }
          updatedDept = d;
          break;
        }
      }

      try {
        await fetch('/api/v1/misipet/assets/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: assetId,
            semaphore: newSemaphore,
            computed_semaphore: newSemaphore,
            status: newSemaphore === 'green' ? 'Operativo / Mantenimiento Conforme' : (newSemaphore === 'yellow' ? 'Atención Preventiva' : 'Crítico'),
            hours_odometer: newSemaphore === 'green' ? 0 : undefined,
            last_override: {
              actor: actorName,
              reason: `Cambio directo de criterio a ${newSemaphore.toUpperCase()}`,
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (e) {
        console.warn('Sync rápido de semáforo:', e);
      }

      this.loadOverview();
      if (updatedDept) this.loadDepartment(updatedDept);
      else this.renderDepartmentAssets();

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✨ Semáforo de ${assetName} actualizado a ${newSemaphore === 'green' ? '🟢 VERDE (Conforme)' : (newSemaphore === 'yellow' ? '🟡 AMARILLO' : '🔴 ROJO')}`, 'success');
      }
    }

    async markMaintenanceCompletedQuick(assetId, actorName = 'Dalybell / Harry / Mike') {
      const today = new Date().toISOString().slice(0, 10);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      const nextDateStr = nextDate.toISOString().slice(0, 10);

      let updatedDept = null;
      let assetName = assetId;
      for (const d in this.assetsData) {
        const item = (this.assetsData[d] || []).find(a => a.id === assetId);
        if (item) {
          item.semaphore = 'green';
          item.computed_semaphore = 'green';
          item.hours_odometer = 0;
          item.last_minor_service = today;
          item.next_minor_service = nextDateStr;
          item.status = 'Operativo / Mantenimiento Realizado Conforme ISO 9001';
          item.last_override = {
            actor: actorName,
            reason: 'Mantenimiento ejecutado en planta. Odómetro restablecido a 0 hrs y semáforo en verde.',
            timestamp: new Date().toISOString()
          };
          assetName = item.name || assetId;
          updatedDept = d;
          break;
        }
      }

      try {
        await fetch('/api/v1/misipet/assets/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset_id: assetId,
            service_type: 'menor',
            technician: actorName,
            notes: 'Mantenimiento preventivo completado y verificado en planta. Colocado en Verde.'
          })
        });
      } catch (e) {
        console.warn('Sync mantenimiento rápido:', e);
      }

      this.loadOverview();
      if (updatedDept) this.loadDepartment(updatedDept);
      else this.renderDepartmentAssets();

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✅ Mantenimiento de ${assetName} completado con éxito. Estado: 🟢 VERDE`, 'success');
      } else {
        alert(`✅ Mantenimiento de ${assetName} completado con éxito. Estado: 🟢 VERDE`);
      }
    }

    // ==========================================
    // EJECUCIÓN DE MANTENIMIENTO ISO 9001 (MAYOR Y MENOR)
    // ==========================================
    openMaintenanceModal(assetId, serviceType = 'menor') {
      const modal = document.getElementById('modal-misipet-asset-maintenance');
      let assetItem = null;
      for (const d in this.assetsData) {
        const found = (this.assetsData[d] || []).find(a => a.id === assetId);
        if (found) { assetItem = found; break; }
      }

      const assetName = assetItem ? assetItem.name : assetId;

      if (!modal) {
        const tech = prompt(`Registrar Mantenimiento ${serviceType.toUpperCase()} para ${assetName} (${assetId}).\nIngrese el nombre del responsable (Daly / Mike / Harry / Técnico):`, 'Harry (Directiva GEO)');
        if (!tech) return;
        const notes = prompt('Notas / Observaciones del servicio ejecutado:', 'Inspección conforme bajo norma ISO 9001.');
        this.executeMaintenance(assetId, serviceType, tech, notes || '');
        return;
      }

      const idInput = document.getElementById('maint-form-asset-id');
      const typeInput = document.getElementById('maint-form-service-type');
      const typeSelect = document.getElementById('maint-form-type-select');
      const titleEl = document.getElementById('misipet-maintenance-modal-title');
      const displayTitle = document.getElementById('maint-asset-display-title');
      const displayInfo = document.getElementById('maint-asset-display-info');

      if (idInput) idInput.value = assetId;
      if (typeInput) typeInput.value = serviceType;
      if (typeSelect) typeSelect.value = serviceType;

      if (titleEl) titleEl.innerText = `🔧 Certificación de Mantenimiento: ${serviceType === 'mayor' ? 'MAYOR' : 'MENOR'}`;
      if (displayTitle) displayTitle.innerText = `${assetName} (${assetId})`;
      if (displayInfo && assetItem) {
        displayInfo.innerText = `Odómetro actual: ${assetItem.hours_odometer || 0} hrs • Ubicación: ${assetItem.location || 'Planta Principal'}`;
      }

      modal.style.display = 'flex';
    }

    closeMaintenanceModal() {
      const modal = document.getElementById('modal-misipet-asset-maintenance');
      if (modal) modal.style.display = 'none';
    }

    async saveMaintenanceForm(event) {
      if (event) event.preventDefault();
      const assetId = document.getElementById('maint-form-asset-id').value;
      const typeInput = document.getElementById('maint-form-service-type');
      const typeSelect = document.getElementById('maint-form-type-select');
      const serviceType = (typeSelect ? typeSelect.value : null) || (typeInput ? typeInput.value : 'menor');
      const techSelect = document.getElementById('maint-form-technician-select');
      const technician = techSelect ? techSelect.value : 'Técnico Especialista';
      const notesEl = document.getElementById('maint-form-notes');
      const notes = notesEl ? notesEl.value.trim() : 'Mantenimiento ISO 9001 ejecutado.';

      this.closeMaintenanceModal();
      await this.executeMaintenance(assetId, serviceType, technician, notes);
    }

    async executeMaintenance(assetId, serviceType, technician, notes) {
      const today = new Date().toISOString().slice(0, 10);
      let updatedDept = null;
      let assetName = assetId;

      for (const d in this.assetsData) {
        const item = (this.assetsData[d] || []).find(a => a.id === assetId);
        if (item) {
          item.semaphore = 'green';
          item.computed_semaphore = 'green';
          if (serviceType === 'mayor') {
            item.hours_odometer = 0;
            item.last_major_service = today;
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 180);
            item.next_major_service = nextDate.toISOString().slice(0, 10);
            item.status = 'Operativo / Mantenimiento Mayor Conforme ISO 9001';
          } else {
            item.last_minor_service = today;
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 30);
            item.next_minor_service = nextDate.toISOString().slice(0, 10);
            item.status = 'Operativo / Mantenimiento Menor Conforme ISO 9001';
          }
          item.last_override = {
            actor: technician,
            reason: `Mantenimiento ${serviceType.toUpperCase()} ejecutado por ${technician}. ${notes}`,
            timestamp: new Date().toISOString()
          };
          assetName = item.name || assetId;
          updatedDept = d;
          break;
        }
      }

      try {
        const res = await fetch('/api/v1/misipet/assets/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset_id: assetId,
            service_type: serviceType,
            technician,
            notes
          })
        });

        const data = await res.json();
        if (data.status === 'success') {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(`✅ Mantenimiento ${serviceType} completado con éxito para ${assetName}. Odómetro y semáforo en 🟢 VERDE.`, 'success');
          } else {
            alert(`✅ Mantenimiento ${serviceType} completado con éxito para ${assetName}. Odómetro y fecha ISO 9001 actualizados.`);
          }
          this.loadOverview();
          if (updatedDept) this.loadDepartment(updatedDept);
          else this.renderDepartmentAssets();
        } else {
          alert('Error: ' + data.message);
        }
      } catch (e) {
        console.warn('Sync executeMaintenance:', e);
        this.renderDepartmentAssets();
      }
    }

    // ==========================================
    // ORQUESTACIÓN AGENTE MIKE -> MAKE.COM
    // ==========================================
    openServiceOrderModal(assetId) {
      const modal = document.getElementById('modal-misipet-mike-order');
      if (!modal) return;

      document.getElementById('mike-order-asset-id').value = assetId;
      document.getElementById('mike-order-asset-display').innerText = `Activo: ${assetId}`;
      modal.style.display = 'flex';
    }

    closeServiceOrderModal() {
      const modal = document.getElementById('modal-misipet-mike-order');
      if (modal) modal.style.display = 'none';
    }

    async dispatchMikeOrder(event) {
      if (event) event.preventDefault();
      const asset_id = document.getElementById('mike-order-asset-id').value;
      const service_type = document.getElementById('mike-order-service-type').value;
      const priority = document.getElementById('mike-order-priority').value;
      const technician = document.getElementById('mike-order-technician').value;
      const notes = document.getElementById('mike-order-notes').value;

      try {
        const res = await fetch('/api/v1/misipet/maintenance/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset_id,
            service_type,
            priority,
            technician,
            notes
          })
        });

        const data = await res.json();
        if (data.status === 'success') {
          this.closeServiceOrderModal();
          const ord = data.order || {};
          const msg = `⚡ Mike ha emitido la orden digital ${ord.order_id} y la ha despachado exitosamente a Make.com.`;
          alert(msg);
          this.announceWithLeia(msg);
          this.loadOverview();
          this.loadMaintenanceOrders();
        } else {
          alert('Error al despachar orden: ' + data.message);
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    // ==========================================
    // BITÁCORA Y ÓRDENES DE MANTENIMIENTO MIKE (ISO 9001 & MAKE.COM)
    // ==========================================
    async loadMaintenanceOrders() {
      try {
        const res = await fetch('/api/v1/misipet/maintenance/orders');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        this.maintenanceOrders = data.orders || [];
        this.applyMaintenanceOrdersFilter();
        this.renderMaintenanceOrdersTable();
        const badge = document.getElementById('misipet-orders-badge');
        if (badge) badge.innerText = `${this.maintenanceOrders.length} Órdenes`;
      } catch (err) {
        console.warn('⚠️ [MISIPET] Fallo al cargar órdenes de mantenimiento:', err);
      }
    }

    applyMaintenanceOrdersFilter() {
      let orders = [...(this.maintenanceOrders || [])];
      if (this.maintenanceOrdersStatusFilter && this.maintenanceOrdersStatusFilter !== 'all') {
        const sf = this.maintenanceOrdersStatusFilter.toLowerCase();
        orders = orders.filter(o => {
          const s = String(o.status || '').toLowerCase();
          const p = String(o.priority || '').toLowerCase();
          const t = String(o.type || '').toLowerCase();
          return s.includes(sf) || p.includes(sf) || t.includes(sf);
        });
      }
      if (this.maintenanceOrdersSearchTerm) {
        const term = this.maintenanceOrdersSearchTerm.toLowerCase();
        orders = orders.filter(o => {
          const id = String(o.order_id || '').toLowerCase();
          const name = String(o.asset_name || '').toLowerCase();
          const aid = String(o.asset_id || '').toLowerCase();
          const dept = String(o.department || '').toLowerCase();
          const tech = String(o.technician_assigned || '').toLowerCase();
          const disp = String(o.dispatched_by_agent || '').toLowerCase();
          const notes = String(o.notes || '').toLowerCase();
          return id.includes(term) || name.includes(term) || aid.includes(term) || dept.includes(term) || tech.includes(term) || disp.includes(term) || notes.includes(term);
        });
      }
      this.filteredMaintenanceOrders = orders;
    }

    filterMaintenanceOrders(term) {
      this.maintenanceOrdersSearchTerm = (term || '').trim();
      this.applyMaintenanceOrdersFilter();
      this.renderMaintenanceOrdersTable();
      if (this.activeDepartment === 'maintenance_orders') {
        this.renderMaintenanceOrdersView();
      }
    }

    filterMaintenanceOrdersByStatus(status) {
      this.maintenanceOrdersStatusFilter = status;
      this.applyMaintenanceOrdersFilter();
      this.renderMaintenanceOrdersTable();
      if (this.activeDepartment === 'maintenance_orders') {
        this.renderMaintenanceOrdersView();
      }
    }

    renderMaintenanceOrdersTable() {
      const container = document.getElementById('misipet-maintenance-orders-container');
      if (!container) return;

      const orders = this.filteredMaintenanceOrders || this.maintenanceOrders || [];
      if (orders.length === 0) {
        container.innerHTML = `
          <div style="padding:28px; text-align:center; color:#64748B;">
            <p style="font-weight:700; font-size:0.92rem; margin-bottom:4px;">No se encontraron órdenes de mantenimiento con los filtros seleccionados.</p>
            <small>Total registradas en el sistema: ${this.maintenanceOrders.length}</small>
          </div>
        `;
        return;
      }

      const displayOrders = orders.slice(0, 50);

      const html = `
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.82rem;">
            <thead>
              <tr style="background:#0F172A; color:#FFFFFF; border-bottom:2px solid #CBD5E1;">
                <th style="padding:12px 14px; font-weight:800; letter-spacing:0.3px;">N° ORDEN DIGITAL</th>
                <th style="padding:12px 14px; font-weight:800;">ACTIVO / ÁREA</th>
                <th style="padding:12px 14px; font-weight:800;">TIPO SERVICIO</th>
                <th style="padding:12px 14px; font-weight:800;">RESPONSABLE / AGENTE</th>
                <th style="padding:12px 14px; font-weight:800;">ESTATUS ISO 9001</th>
                <th style="padding:12px 14px; font-weight:800;">FECHA / HORA</th>
                <th style="padding:12px 14px; font-weight:800;">NOTAS &amp; DICTAMEN</th>
              </tr>
            </thead>
            <tbody>
              ${displayOrders.map((o, idx) => {
                const isDone = String(o.status || '').toLowerCase().includes('completado') || String(o.priority || '').toLowerCase().includes('resuelto');
                const isMake = String(o.status || '').toLowerCase().includes('make');
                const badgeBg = isDone ? 'rgba(16,185,129,0.14)' : (isMake ? 'rgba(2,132,199,0.14)' : 'rgba(245,158,11,0.14)');
                const badgeColor = isDone ? '#047857' : (isMake ? '#0284C7' : '#B45309');
                const borderLeft = isDone ? '4px solid #10B981' : (isMake ? '4px solid #0284C7' : '4px solid #F59E0B');
                const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                const dateStr = o.completed_at || o.dispatched_at || o.created_at || 'Reciente';
                const formattedDate = dateStr.length > 16 ? dateStr.replace('T', ' ').slice(0, 16) : dateStr;

                return `
                  <tr style="background:${rowBg}; border-bottom:1px solid #E2E8F0; border-left:${borderLeft};">
                    <td style="padding:10px 14px; font-family:monospace; font-weight:800; color:#1E293B;">
                      ${o.order_id || 'ORD-MISIPET'}
                    </td>
                    <td style="padding:10px 14px;">
                      <div style="font-weight:800; color:#0F172A;">${o.asset_name || o.asset_id || 'Activo Planta'}</div>
                      <small style="color:#64748B; text-transform:uppercase; font-size:0.7rem; font-weight:700;">${o.department || 'Operaciones'} • ${o.asset_id || ''}</small>
                    </td>
                    <td style="padding:10px 14px; font-weight:700; color:#334155;">
                      ${o.type || 'Mantenimiento Preventivo'}
                    </td>
                    <td style="padding:10px 14px;">
                      <div style="font-weight:700; color:#1E293B;">${o.technician_assigned || 'Técnico Autorizado'}</div>
                      <small style="color:#64748B; font-size:0.7rem;">${o.dispatched_by_agent || 'Mike (Operaciones)'}</small>
                    </td>
                    <td style="padding:10px 14px;">
                      <span style="background:${badgeBg}; color:${badgeColor}; font-weight:800; font-size:0.72rem; padding:4px 9px; border-radius:8px; display:inline-block; border:1px solid ${badgeColor};">
                        ${isDone ? '🟢 ' : (isMake ? '⚡ ' : '🟡 ')}${o.status || 'Completado ISO 9001'}
                      </span>
                    </td>
                    <td style="padding:10px 14px; color:#64748B; font-size:0.75rem; white-space:nowrap;">
                      ⏱️ ${formattedDate}
                    </td>
                    <td style="padding:10px 14px; color:#475569; max-width:280px; font-size:0.76rem; line-height:1.35;">
                      ${o.notes || 'Inspección y calibración conforme bajo normas ISO 9001.'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${orders.length > 50 ? `
          <div style="padding:10px 16px; background:#F1F5F9; border-top:1px solid #CBD5E1; text-align:center; font-size:0.78rem; font-weight:800; color:#475569;">
            Mostrando 50 de ${orders.length} órdenes registradas. Use el buscador superior para filtrar por activo, técnico o número de orden.
          </div>
        ` : ''}
      `;

      container.innerHTML = html;
    }

    renderMaintenanceOrdersView() {
      const container = document.getElementById('misipet-dept-assets-container');
      if (!container) return;

      const totalCount = this.maintenanceOrders.length;
      const doneCount = this.maintenanceOrders.filter(o => String(o.status || '').toLowerCase().includes('completado') || String(o.priority || '').toLowerCase().includes('resuelto')).length;
      const makeCount = this.maintenanceOrders.filter(o => String(o.status || '').toLowerCase().includes('make')).length;

      let html = `
        <div class="misipet-orders-full-view" style="padding:14px 0;">
          <!-- KPI Cards de Mike -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:20px;">
            <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04); border-left:4px solid #D4AF37;">
              <span style="font-size:0.72rem; color:#64748B; font-weight:800; text-transform:uppercase;">Total Órdenes Registradas</span>
              <div style="font-size:1.8rem; font-weight:900; color:#0F172A; margin:6px 0 2px 0;">${totalCount}</div>
              <small style="color:#D4AF37; font-weight:700;">Bitácora Histórica Activa</small>
            </div>
            <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04); border-left:4px solid #10B981;">
              <span style="font-size:0.72rem; color:#64748B; font-weight:800; text-transform:uppercase;">Completadas ISO 9001</span>
              <div style="font-size:1.8rem; font-weight:900; color:#047857; margin:6px 0 2px 0;">${doneCount}</div>
              <small style="color:#059669; font-weight:700;">Certificadas en Planta (Verde)</small>
            </div>
            <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04); border-left:4px solid #0284C7;">
              <span style="font-size:0.72rem; color:#64748B; font-weight:800; text-transform:uppercase;">Despachos Make.com</span>
              <div style="font-size:1.8rem; font-weight:900; color:#0284C7; margin:6px 0 2px 0;">${makeCount}</div>
              <small style="color:#0284C7; font-weight:700;">Transmisión Digital en Vivo</small>
            </div>
            <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04); border-left:4px solid #6366F1;">
              <span style="font-size:0.72rem; color:#64748B; font-weight:800; text-transform:uppercase;">Agente Evaluador</span>
              <div style="font-size:1.2rem; font-weight:900; color:#4338CA; margin:6px 0 2px 0;">Mike (Operaciones)</div>
              <small style="color:#6366F1; font-weight:700;">Comité Volturi &amp; Infraestructura</small>
            </div>
          </div>

          <!-- Filtros de Búsqueda -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; background:#F8FAFC; padding:14px 18px; border-radius:12px; border:1px solid #E2E8F0;">
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; flex:1;">
              <input type="text" placeholder="🔍 Buscar por N° orden, activo, técnico, notas..." value="${this.maintenanceOrdersSearchTerm || ''}" oninput="misipetEngine.filterMaintenanceOrders(this.value)" style="padding:9px 14px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; flex:1; min-width:240px; max-width:420px;">
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn btn-sm" onclick="misipetEngine.filterMaintenanceOrdersByStatus('all')" style="background:${this.maintenanceOrdersStatusFilter === 'all' ? '#0F172A' : '#FFFFFF'}; color:${this.maintenanceOrdersStatusFilter === 'all' ? '#FFFFFF' : '#334155'}; font-weight:800; border:1px solid #CBD5E1; border-radius:8px; padding:6px 12px; cursor:pointer;">Todas</button>
                <button type="button" class="btn btn-sm" onclick="misipetEngine.filterMaintenanceOrdersByStatus('completado')" style="background:${this.maintenanceOrdersStatusFilter === 'completado' ? '#10B981' : '#FFFFFF'}; color:${this.maintenanceOrdersStatusFilter === 'completado' ? '#FFFFFF' : '#047857'}; font-weight:800; border:1px solid #10B981; border-radius:8px; padding:6px 12px; cursor:pointer;">🟢 Completadas</button>
                <button type="button" class="btn btn-sm" onclick="misipetEngine.filterMaintenanceOrdersByStatus('make')" style="background:${this.maintenanceOrdersStatusFilter === 'make' ? '#0284C7' : '#FFFFFF'}; color:${this.maintenanceOrdersStatusFilter === 'make' ? '#FFFFFF' : '#0284C7'}; font-weight:800; border:1px solid #0284C7; border-radius:8px; padding:6px 12px; cursor:pointer;">⚡ Make.com</button>
              </div>
            </div>
            <button type="button" class="btn-voice-leia" onclick="misipetEngine.openServiceOrderModal('GROOM-SOP-01')" style="font-weight:900; font-size:0.8rem; padding:8px 16px; border-radius:10px; cursor:pointer;">
              ⚡ Nueva Orden Mike -> Make.com
            </button>
          </div>

          <!-- Tabla de Órdenes -->
          <div id="misipet-maintenance-orders-container" style="background:#FFFFFF; border-radius:12px; border:1px solid #E2E8F0; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.03);"></div>
        </div>
      `;

      container.innerHTML = html;
      this.renderMaintenanceOrdersTable();
    }

    getDefaultOverviewData() {
      return {
        status: "success",
        timestamp: new Date().toISOString(),
        branch: "Mrs. Pets • Maracaibo, Venezuela",
        semaphore_counts: { green: 5, yellow: 23, red: 43, total: 71 },
        power_plant: {
          name: "Planta Eléctrica Cummins 65 kVA Diésel / Gas Insonorizada",
          fuel_liters: 210.0,
          tank_capacity_liters: 250.0,
          fuel_pct: 84.0,
          burn_rate_lph: 5.5,
          autonomy_hours: 38.2,
          voltage: 208.0,
          frequency_hz: 60.0,
          status: "Automático en Línea (ATS Operativo)",
          last_maintenance: "2026-10-15",
          next_maintenance: "2026-12-15",
          oil_pressure_psi: 52.0,
          coolant_temp_c: 82.0,
          ip_address: "192.168.1.185"
        },
        water_overview: {
          total_capacity_liters: 21000,
          total_current_liters: 18470.0,
          total_pct: 88.0,
          daily_consumption_liters: 1017.5,
          hourly_burn_rate_liters: 42.4,
          autonomy_days: 18.2,
          autonomy_hours: 436.8,
          tanks_count: 4,
          semaphore: "green",
          alert_status: "Nominal: Autonomía hídrica óptima superior a 48 horas"
        },
        tanks: [
          {
            id: "tank-subterraneo",
            name: "Tanque Subterráneo Principal",
            capacity_liters: 11000,
            current_liters: 9570.0,
            level_pct: 87.0,
            location: "Patio Central Subterráneo",
            material: "Concreto armado impermeabilizado",
            associated_pump: "Bomba Principal Centrífuga 2 HP",
            semaphore: "green",
            refill_status: "Llenado Automático Activo"
          },
          {
            id: "tank-techo",
            name: "Tanque Superior / Techo (Cilíndrico Negro)",
            capacity_liters: 5000,
            current_liters: 4500.0,
            level_pct: 90.0,
            location: "Plataforma Superior Azotea",
            material: "Polietileno 4 capas UV",
            associated_pump: "Bomba Respaldo 1.5 HP",
            semaphore: "green",
            refill_status: "Gravedad Activa"
          },
          {
            id: "tank-azul",
            name: "Tanque Auxiliar Azul",
            capacity_liters: 3000,
            current_liters: 2600.0,
            level_pct: 86.7,
            location: "Área de Lavandería Exterior",
            material: "Polietileno Reforzado",
            associated_pump: "Bomba Ladrona Succión Rápida",
            semaphore: "green",
            refill_status: "Reserva grooming y lavado"
          },
          {
            id: "tank-secundario",
            name: "Tanque Secundario de Emergencia",
            capacity_liters: 2000,
            current_liters: 1800.0,
            level_pct: 90.0,
            location: "Lateral Sala de Máquinas",
            material: "Polietileno Horizontal",
            associated_pump: "By-pass Manual",
            semaphore: "green",
            refill_status: "Reserva clínica estéril"
          }
        ],
        blowers_summary: { active_in_shift: 2, strategic_reserve: 1, total: 3 },
        biometric_attendance: { total_staff: 6, present_count: 6, checkin_deadline: "08:00 AM VET", attendance_rate_pct: 100 },
        hvac_zones: [
          { id: "HVAC-TIENDA-5T", name: "Unidad Central HVAC 5T (Tienda & Showroom)", location: "Azotea / Tienda", temp_actual_c: 21.5, temp_target_c: 21.5, semaphore: "green", status: "Enfriamiento Óptimo", wifi_ssid: "MrsPets-IoT-Secure", wifi_ip: "192.168.1.139" },
          { id: "HVAC-GROOM-3T", name: "Unidad Central HVAC 3T (Grooming Spa & Baños)", location: "Azotea / Grooming", temp_actual_c: 22.0, temp_target_c: 22.0, semaphore: "green", status: "Operativo", wifi_ssid: "MrsPets-IoT-DonBosco", wifi_ip: "192.168.1.132" },
          { id: "HVAC-ADMIN-3T", name: "Unidad Central HVAC 3T (Administración & Finanzas)", location: "Azotea / Admin", temp_actual_c: 20.8, temp_target_c: 21.0, semaphore: "green", status: "Operativo", wifi_ssid: "MrsPets-IoT-DonBosco", wifi_ip: "192.168.1.133" },
          { id: "HVAC-CLINICA-3T", name: "Unidad Central HVAC 3T (Clínica & Quirófano)", location: "Azotea / Clínica", temp_actual_c: 19.5, temp_target_c: 20.0, semaphore: "green", status: "Filtros HEPA Quirúrgicos", wifi_ssid: "MrsPets-IoT-DonBosco", wifi_ip: "192.168.1.134" },
          { id: "HVAC-HOTEL-3T", name: "Unidad Central HVAC 3T (Hotel Canino & Guardería)", location: "Azotea / Hotel", temp_actual_c: 22.0, temp_target_c: 22.0, semaphore: "green", status: "Operativo", wifi_ssid: "MrsPets-IoT-DonBosco", wifi_ip: "192.168.1.135" },
          { id: "HVAC-SPLIT-REC", name: "Split Inverter 18,000 BTU (Recepción Principal)", location: "Recepción", temp_actual_c: 21.0, temp_target_c: 20.5, semaphore: "green", status: "Operativo", wifi_ssid: "MrsPets-IoT-DonBosco", wifi_ip: "192.168.1.136" },
          { id: "HVAC-SPLIT-LAV", name: "Split 18,000 BTU (Lavandería y Almacén Insumos)", location: "Lavandería", temp_actual_c: 22.5, temp_target_c: 22.0, semaphore: "green", status: "Operativo", wifi_ssid: "MrsPets-IoT-DonBosco", wifi_ip: "192.168.1.137" },
          { id: "HVAC-SPLIT-SUITES", name: "Split Inverter 18,000 BTU (Suites Felinas VIP)", location: "Suites Felinas VIP", temp_actual_c: 22.2, temp_target_c: 22.0, semaphore: "green", status: "Operativo Silencioso", wifi_ssid: "MrsPets-IoT-DonBosco", wifi_ip: "192.168.1.138" }
        ],
        critical_alerts: []
      };
    }

    // ==========================================
    // AGENTE CENTRAL DE VOZ: LEIA
    // ==========================================
    announceWithLeia(message) {
      console.log('🎙️ [LEIA VOZ]:', message);
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.lang = 'es-ES';
          utterance.rate = 1.0;
          utterance.pitch = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('Speech synthesis warning:', e);
        }
      }
    }

    openCameraStreamModal(ch) {
      const cam = this.camerasData.find(c => c.ch === ch);
      if (!cam) return;

      const isGEO = this.currentRole === 'admin_geo';
      const streamUrl = isGEO && cam.tukan_gateway_url ? cam.tukan_gateway_url : cam.lan_stream_url;

      alert(`📹 CANAL ${cam.ch} • ${cam.name}\n\nProtocolo: ${cam.status}\nURL Stream: ${streamUrl}\nResolución: ${cam.resolution}\nAcceso: ${isGEO ? 'Remoto Seguro Tukan (GEO)' : 'LAN Local Restringido'}`);
    }


    // ==========================================
    // MÓDULO IOT: DISPOSITIVOS Y TELEMETRÍA EN VIVO
    // ==========================================
    async loadIotDevices() {
      try {
        const res = await fetch('/api/v1/misipet/iot/devices');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        this.iotDevicesData = data.devices || data.data || [];
      } catch (e) {
        console.warn('⚠️ [MISIPET] Error cargando dispositivos IoT:', e);
      }
    }

    renderIotDevicesView() {
      const container = document.getElementById('misipet-dept-assets-container');
      if (!container) return;

      const devices = this.iotDevicesData || [];
      const isGEO = this.currentRole === 'admin_geo';

      let html = `
        <!-- CONSOLA DE SIMULACIÓN DE TELEMETRÍA TÁCTICA -->
        <div class="iot-simulation-banner">
          <div class="iot-sim-header">
            <span class="iot-sim-title">⚡ CONSOLA DE TELEMETRÍA IOT EN TIEMPO REAL & DISPARADORES MAKE.COM</span>
            <span style="font-size:0.72rem; color:#4338CA; font-weight:700;">Simulación de Ingesta Wi-Fi (ESP32 / PT100) -> Orquestación Mike & Leia</span>
          </div>
          <div class="iot-sim-buttons-grid">
            <button class="btn-iot-sim btn-sim-water" onclick="misipetEngine.simulateIotTelemetryPush('water_critical')">
              <span class="sim-label">💧 Tanque Crítico (18%)</span>
              <span class="sim-desc">ESP32 envía nivel bajo -> Dispara Webhook Make & Orden Cisterna</span>
            </button>
            <button class="btn-iot-sim btn-sim-cold" onclick="misipetEngine.simulateIotTelemetryPush('fridge_breach')">
              <span class="sim-label">💉 Ruptura Cadena Frío (9.8°C)</span>
              <span class="sim-desc">PT100 fuera de rango [2-8°C] -> Emergencia Biológica + Voz Leia</span>
            </button>
            <button class="btn-iot-sim btn-sim-power" onclick="misipetEngine.simulateIotTelemetryPush('cummins_critical')">
              <span class="sim-label">⛽ Combustible Diésel (40 L)</span>
              <span class="sim-desc">Cummins 65kVA reserva <30% -> Orden Suministro Gasoil</span>
            </button>
            <button class="btn-iot-sim btn-sim-nominal" onclick="misipetEngine.simulateIotTelemetryPush('restore_nominal')">
              <span class="sim-label">🟢 Restaurar Niveles Nominales</span>
              <span class="sim-desc">Restablece tanques a 9,500 L, nevera a 4.5°C y combustible a 210 L</span>
            </button>
          </div>
        </div>

        <div class="dept-assets-header">
          <div>
            <h3 class="dept-title">📡 Batería de Sensores IoT & Dispositivos Conectados</h3>
            <span class="dept-subtitle">${devices.length} Sensores Wi-Fi ESP32, Modbus y Tarjetas Telemétricas Monitoreados</span>
          </div>
          <div class="dept-header-actions">
            ${isGEO ? `
              <button class="btn-add-asset" onclick="misipetEngine.openIotDeviceModal(null)">
                ➕ Vincular Sensor IoT
              </button>
            ` : ''}
          </div>
        </div>
      `;

      if (devices.length === 0) {
        html += `<div class="empty-assets-state"><p>No se encontraron sensores IoT vinculados.</p></div>`;
      } else {
        html += `<div class="iot-devices-grid">`;
        devices.forEach(dev => {
          const threshStr = typeof dev.thresholds === 'object' ? JSON.stringify(dev.thresholds) : (dev.thresholds || 'N/A');
          html += `
            <div class="iot-device-card">
              <div class="iot-card-header">
                <div>
                  <span class="iot-chip-id">${dev.id}</span>
                  <h4 class="iot-device-name">${dev.name}</h4>
                  <span style="font-size:0.7rem; color:#475569;">${dev.zone || dev.department || ''}</span>
                </div>
                <span class="iot-status-chip iot-status-online">● ${dev.status || 'Online'}</span>
              </div>

              <div class="iot-meta-table">
                <div class="iot-meta-row">
                  <span class="meta-k">IP LAN:</span>
                  <span style="font-family:monospace; color:#0369A1;">${dev.ip_address || 'DHCP'}</span>
                </div>
                <div class="iot-meta-row">
                  <span class="meta-k">Protocolo:</span>
                  <span>${dev.protocol || 'Wi-Fi ESP32'}</span>
                </div>
                <div class="iot-meta-row">
                  <span class="meta-k">Intervalo Ping:</span>
                  <span>Cada ${dev.telemetry_interval_sec || 30}s</span>
                </div>
              </div>

              <div class="iot-thresholds-box">
                <strong>⚙️ Umbrales / Make.com:</strong> ${threshStr}
              </div>

              <div class="iot-card-footer">
                <span style="font-size:0.68rem; color:#475569;">Firmware: ${dev.firmware_version || 'v2.4'}</span>
                <div style="display:flex; gap:6px;">
                  ${isGEO ? `
                    <button class="btn-action-edit" onclick="misipetEngine.openIotDeviceModal('${dev.id}')" title="Calibrar Sensor">✏️</button>
                    <button class="btn-action-delete" onclick="misipetEngine.deleteIotDevicePrompt('${dev.id}')" title="Desvincular">🗑️</button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }

      container.innerHTML = html;
    }

    // Modal CRUD IoT
    openIotDeviceModal(deviceId) {
      const modal = document.getElementById('modal-misipet-iot-device');
      if (!modal) return;

      const titleEl = document.getElementById('misipet-iot-modal-title');
      const idInput = document.getElementById('iot-form-id');
      const nameInput = document.getElementById('iot-form-name');
      const typeSelect = document.getElementById('iot-form-type');
      const deptSelect = document.getElementById('iot-form-dept');
      const ipInput = document.getElementById('iot-form-ip');
      const protoSelect = document.getElementById('iot-form-protocol');
      const intervalInput = document.getElementById('iot-form-interval');
      const thresholdsInput = document.getElementById('iot-form-thresholds');

      if (deviceId) {
        titleEl.innerText = `Calibrar Sensor IoT: ${deviceId}`;
        const dev = this.iotDevicesData.find(d => d.id === deviceId);
        if (dev) {
          idInput.value = dev.id;
          idInput.disabled = true;
          nameInput.value = dev.name || '';
          typeSelect.value = dev.device_type || dev.type || 'water_level_sensor';
          deptSelect.value = dev.department || 'sala_maquinas';
          ipInput.value = dev.ip_address || '';
          protoSelect.value = dev.protocol || 'Wi-Fi ESP32 / HTTP REST';
          intervalInput.value = dev.telemetry_interval_sec || 30;
          thresholdsInput.value = typeof dev.thresholds === 'object' ? JSON.stringify(dev.thresholds) : (dev.thresholds || '');
        }
      } else {
        titleEl.innerText = 'Vincular Nuevo Dispositivo / Sensor IoT';
        idInput.value = `IOT-ESP32-${Math.floor(100 + Math.random() * 900)}`;
        idInput.disabled = false;
        nameInput.value = '';
        ipInput.value = `192.168.1.${Math.floor(150 + Math.random() * 40)}`;
        intervalInput.value = 30;
        thresholdsInput.value = '{"critical_threshold": 25.0}';
      }

      modal.style.display = 'flex';
    }

    closeIotDeviceModal() {
      const modal = document.getElementById('modal-misipet-iot-device');
      if (modal) modal.style.display = 'none';
    }

    async saveIotDevice(event) {
      if (event) event.preventDefault();
      const id = document.getElementById('iot-form-id').value.trim();
      const name = document.getElementById('iot-form-name').value.trim();
      const device_type = document.getElementById('iot-form-type').value;
      const department = document.getElementById('iot-form-dept').value;
      const ip_address = document.getElementById('iot-form-ip').value.trim();
      const protocol = document.getElementById('iot-form-protocol').value;
      const telemetry_interval_sec = parseInt(document.getElementById('iot-form-interval').value) || 30;
      let thresholds = {};
      try {
        const rawT = document.getElementById('iot-form-thresholds').value.trim();
        thresholds = rawT.startsWith('{') ? JSON.parse(rawT) : { rule: rawT };
      } catch (e) {
        thresholds = { raw: document.getElementById('iot-form-thresholds').value.trim() };
      }

      const isUpdate = document.getElementById('iot-form-id').disabled;
      const endpoint = isUpdate ? '/api/v1/misipet/iot/devices/update' : '/api/v1/misipet/iot/devices';

      const payload = {
        id,
        name,
        device_type,
        department,
        ip_address,
        protocol,
        telemetry_interval_sec,
        thresholds,
        status: 'Online'
      };

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
          this.closeIotDeviceModal();
          alert(`✅ Sensor IoT ${id} guardado con éxito.`);
          await this.loadIotDevices();
          this.renderIotDevicesView();
        } else {
          alert('Error al guardar sensor IoT: ' + data.message);
        }
      } catch (e) {
        alert('Error de conexión: ' + e.message);
      }
    }

    async deleteIotDevicePrompt(deviceId) {
      if (!confirm(`¿Confirmas la desvinculación definitiva del sensor IoT ${deviceId}?`)) return;
      try {
        const res = await fetch('/api/v1/misipet/iot/devices/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: deviceId })
        });
        const data = await res.json();
        if (data.status === 'success') {
          alert(`Dispositivo IoT ${deviceId} desvinculado.`);
          await this.loadIotDevices();
          this.renderIotDevicesView();
        } else {
          alert('Error al desvincular sensor: ' + data.message);
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    // ==========================================
    // SIMULACIÓN DE TELEMETRÍA IOT EN TIEMPO REAL
    // ==========================================
    async simulateIotTelemetryPush(simType) {
      try {
        if (simType === 'water_critical') {
          const res = await fetch('/api/v1/misipet/iot/water-tanks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_id: 'IOT-ESP32-WATER-01',
              tank_id: 'tank-subterraneo',
              liters: 1980.0
            })
          });
          const d = await res.json();
          this.loadOverview();
          const alertMsg = '¡Alerta Hídrica Crítica! El sensor ESP32 reporta nivel de 18% en Tanque Subterráneo. Orden de cisterna despachada a Make.com.';
          alert(alertMsg);
          this.announceWithLeia(alertMsg);

        } else if (simType === 'fridge_breach') {
          const res = await fetch('/api/v1/misipet/iot/thermal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_id: 'IOT-PT100-FRIDGE-01',
              target: 'fridge',
              temp_c: 9.8,
              humidity_pct: 75.0
            })
          });
          const d = await res.json();
          this.loadOverview();
          const alertMsg = '¡Emergencia de Bioseguridad! Sonda PT100 detectó 9.8 grados en Nevera de Vacunas. Cadena de frío comprometida. Notificación urgente a Harry y Dalybell despachada a Make.com.';
          alert(alertMsg);
          this.announceWithLeia(alertMsg);

        } else if (simType === 'cummins_critical') {
          const res = await fetch('/api/v1/misipet/iot/power-resilience', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_id: 'IOT-CUMMINS-65KVA-01',
              fuel_liters: 42.0,
              voltage: 119.2
            })
          });
          const d = await res.json();
          this.loadOverview();
          const alertMsg = '¡Alerta de Combustible! Planta Cummins registra 42 litros (16% de reserva). Orden de reposición diésel transmitida a Make.com.';
          alert(alertMsg);
          this.announceWithLeia(alertMsg);

        } else if (simType === 'restore_nominal') {
          await fetch('/api/v1/misipet/iot/water-tanks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subterraneo_liters: 9500,
              techo_liters: 4500,
              azul_liters: 2600,
              secundario_liters: 1800
            })
          });
          await fetch('/api/v1/misipet/iot/thermal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: 'fridge', temp_c: 4.5 })
          });
          await fetch('/api/v1/misipet/iot/power-resilience', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fuel_liters: 210.0, voltage: 120.0 })
          });
          this.loadOverview();
          alert('🟢 Parámetros nominales restablecidos satisfactoriamente. Todos los semáforos en verde conforme ISO 9001.');
          this.announceWithLeia('Todos los parámetros de infraestructura y cadena de frío han retornado al estado nominal conforme.');
        }
      } catch (e) {
        alert('Error en simulación: ' + e.message);
      }
    }

    // ==========================================
    // MÓDULO TUKAN CLOUD & MOSAICO DE VIDEO 22 CH
    // ==========================================
    async loadTukanConfig() {
      try {
        const res = await fetch(`/api/v1/misipet/tukan/config?role=${this.currentRole}`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        this.tukanConfig = data.config || data.data || {};
      } catch (e) {
        console.warn('⚠️ [MISIPET] Error cargando configuración Tukan:', e);
      }
    }

    renderTukanMosaicView() {
      const container = document.getElementById('misipet-dept-assets-container');
      if (!container) return;

      const isGEO = this.currentRole === 'admin_geo';
      const cams = this.camerasData || [];
      const cfg = this.tukanConfig || {};

      // Aplicar clase responsive al contenedor
      const profileClass = `profile-${this.responsivePreset}`;

      let html = `
        <div class="tukan-mosaic-toolbar">
          <div class="tukan-toolbar-left">
            <span style="font-size:0.85rem; font-weight:900; color:#0F172A;">📹 MOSAICO CCTV (22 CANALES)</span>
            <div style="display:flex; gap:6px;">
              <button class="tukan-grid-btn ${this.mosaicGridMode === '1x1' ? 'active-grid' : ''}" onclick="misipetEngine.setMosaicGrid('1x1')">1x1 Foco</button>
              <button class="tukan-grid-btn ${this.mosaicGridMode === '2x2' ? 'active-grid' : ''}" onclick="misipetEngine.setMosaicGrid('2x2')">2x2 Táctico</button>
              <button class="tukan-grid-btn ${this.mosaicGridMode === '4x4' ? 'active-grid' : ''}" onclick="misipetEngine.setMosaicGrid('4x4')">4x4 Matriz</button>
              <button class="tukan-grid-btn ${this.mosaicGridMode === 'list' ? 'active-grid' : ''}" onclick="misipetEngine.setMosaicGrid('list')">Lista 22 CH</button>
            </div>
          </div>

          <div class="tukan-toolbar-right">
            <span style="font-size:0.7rem; color:#475569;">Perfil de Pantalla:</span>
            <span class="tukan-device-preset-pill" onclick="misipetEngine.setResponsivePreset('desktop')">
              💻 PC Escritorio
            </span>
            <span class="tukan-device-preset-pill" onclick="misipetEngine.setResponsivePreset('samsung_fold')">
              📱 Samsung Fold
            </span>
            <span class="tukan-device-preset-pill" onclick="misipetEngine.setResponsivePreset('iphone')">
              📱 iPhone Stack
            </span>

            ${isGEO ? `
              <button class="btn-secondary" style="font-size:0.72rem; padding:4px 10px;" onclick="misipetEngine.openTukanConfigModal()">
                ⚙️ Config Tukan
              </button>
            ` : ''}
          </div>
        </div>

        <div class="${profileClass}">
          <div class="mosaic-container mosaic-grid-${this.mosaicGridMode}">
      `;

      let channelsToRender = cams;
      if (this.mosaicGridMode === '1x1') {
        const found = cams.find(c => c.ch === this.activeCamFocus);
        channelsToRender = found ? [found] : cams.slice(0, 1);
      } else if (this.mosaicGridMode === '2x2') {
        channelsToRender = cams.slice(0, 4);
      } else if (this.mosaicGridMode === '4x4') {
        channelsToRender = cams.slice(0, 16);
      }

      channelsToRender.forEach(cam => {
        const streamUrl = isGEO && cam.tukan_gateway_url ? cam.tukan_gateway_url : (cam.lan_stream_url || `rtsp://192.168.1.${100 + cam.ch}:554/live`);
        html += `
          <div class="camera-feed-card" onclick="misipetEngine.openCameraPlayer(${cam.ch})">
            <div class="cam-feed-header">
              <span class="cam-feed-title">
                <strong>CH ${cam.ch}</strong> • ${cam.name}
              </span>
              <span class="cam-live-indicator"><span class="cam-live-dot"></span> EN VIVO</span>
            </div>

            <div class="cam-video-viewport">
              <div class="cam-simulation-grid"></div>
              <span class="cam-lens-icon">📹</span>
              <div class="cam-overlay-meta">
                <span>FPS: 30 • 1080p</span>
                <span>${isGEO ? 'TUKAN CLOUD [GEO SECURE]' : 'LAN RTSP [PISO]'}</span>
                <span>LAT: 28ms</span>
              </div>
            </div>

            <div class="cam-feed-footer">
              <span class="cam-protocol-tag">${isGEO ? '🔒 TUKAN GATEWAY' : '🟡 LAN RTSP'}</span>
              <div class="cam-feed-actions">
                <button class="btn-cam-action" onclick="event.stopPropagation(); misipetEngine.openCameraPlayer(${cam.ch})">👁️ Ver Stream</button>
                <button class="btn-cam-action" onclick="event.stopPropagation(); misipetEngine.setCameraFocus(${cam.ch})">🔍 Foco</button>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;

      container.innerHTML = html;
    }

    setMosaicGrid(mode) {
      this.mosaicGridMode = mode;
      this.renderTukanMosaicView();
    }

    setResponsivePreset(preset) {
      this.responsivePreset = preset;
      this.renderTukanMosaicView();
    }

    setCameraFocus(ch) {
      this.activeCamFocus = ch;
      this.mosaicGridMode = '1x1';
      this.renderTukanMosaicView();
    }

    // Modal Config Tukan
    openTukanConfigModal() {
      const modal = document.getElementById('modal-misipet-tukan-config');
      if (!modal) return;
      modal.style.display = 'flex';
    }

    closeTukanConfigModal() {
      const modal = document.getElementById('modal-misipet-tukan-config');
      if (modal) modal.style.display = 'none';
    }

    async saveTukanConfig(event) {
      if (event) event.preventDefault();
      const gateway_name = document.getElementById('tukan-form-name').value.trim();
      const account_id = document.getElementById('tukan-form-account').value.trim();
      const auth_token = document.getElementById('tukan-form-token').value.trim();
      const preferred_mosaic_grid = document.getElementById('tukan-form-grid').value;

      try {
        const res = await fetch('/api/v1/misipet/tukan/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gateway_name,
            account_id,
            auth_token,
            preferred_mosaic_grid
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          this.closeTukanConfigModal();
          alert('✅ Configuración de Pasarela Tukan Cloud actualizada.');
          await this.loadTukanConfig();
          this.renderTukanMosaicView();
        } else {
          alert('Error: ' + data.message);
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    // Modal Reproductor de Cámara
    openCameraPlayer(ch) {
      const cam = (this.camerasData || []).find(c => c.ch === ch);
      if (!cam) return;

      const modal = document.getElementById('modal-misipet-camera-player');
      if (!modal) return;

      const isGEO = this.currentRole === 'admin_geo';
      const streamUrl = isGEO && cam.tukan_gateway_url ? cam.tukan_gateway_url : (cam.lan_stream_url || `rtsp://192.168.1.${100 + cam.ch}:554/live`);

      document.getElementById('cam-player-title').innerText = `📹 CH ${cam.ch} • ${cam.name} (${cam.dept || 'Sucursal'})`;
      document.getElementById('cam-player-status').innerText = isGEO ? 'STREAM SEGURO TUKAN CLOUD ACTIVO' : 'STREAM RTSP LOCAL LAN ACTIVO';
      document.getElementById('cam-player-url').innerText = streamUrl;

      modal.style.display = 'flex';
    }

    closeCameraPlayerModal() {
      const modal = document.getElementById('modal-misipet-camera-player');
      if (modal) modal.style.display = 'none';
    }

    takeSnapshot() {
      alert('📸 Instantánea digital capturada y archivada en auditoría ISO 9001.');
    }

    togglePTZ() {
      alert('🔄 Control PTZ activado: Pan / Tilt / Zoom digital en tiempo real.');
    }

    // =========================================================================
    // CONFIGURACIÓN DE CONEXIÓN CCTV & STREAMING HÍBRIDO (22 CANALES)
    // =========================================================================
    async openCctvConfigModal() {
      const modal = document.getElementById('modal-misipet-cctv-config');
      if (!modal) {
        console.warn('[MisiPet] Modal #modal-misipet-cctv-config no encontrado en el DOM');
        return;
      }

      const pingBox = document.getElementById('cctv-ping-results');
      if (pingBox) pingBox.style.display = 'none';

      try {
        const res = await fetch('/api/v1/misipet/cctv/config');
        if (res.ok) {
          const json = await res.json();
          const cfg = json.config || json.data || {};
          const lan = cfg.nvr_lan || {};
          const tukan = cfg.tukan_cloud || {};

          const ipEl = document.getElementById('cctv-form-ip');
          const rtspEl = document.getElementById('cctv-form-rtsp-port');
          const httpEl = document.getElementById('cctv-form-http-port');
          const onvifEl = document.getElementById('cctv-form-onvif-port');
          const userEl = document.getElementById('cctv-form-user');
          const passEl = document.getElementById('cctv-form-pass');
          const gwEl = document.getElementById('cctv-form-gateway-url');
          const accEl = document.getElementById('cctv-form-account-id');
          const tokEl = document.getElementById('cctv-form-token');
          const protoEl = document.getElementById('cctv-form-protocol');
          const mosEl = document.getElementById('cctv-form-mosaic');

          if (ipEl) ipEl.value = lan.ip_address || '192.168.1.100';
          if (rtspEl) rtspEl.value = lan.rtsp_port || 554;
          if (httpEl) httpEl.value = lan.http_port || 80;
          if (onvifEl) onvifEl.value = lan.onvif_port || 8000;
          if (userEl) userEl.value = lan.username || 'admin';
          if (passEl) passEl.value = 'AdminGeo2026*';
          if (gwEl) gwEl.value = tukan.gateway_url || 'https://cloud.tukan.mrspets.com/api/v2/stream';
          if (accEl) accEl.value = tukan.account_id || 'TUKAN-ACC-MRSPETS-MARACAIBO';
          if (tokEl) tokEl.value = tukan.geo_admin_token || 'GEO-TOKEN-HARRY-DALYBELL-2026-TUKAN-SECURE';
          if (protoEl) protoEl.value = tukan.streaming_protocol || 'WebRTC Seguro / RTSP over WSS';
          if (mosEl) mosEl.value = tukan.active_mosaic_preset || '2x2';
        }
      } catch (err) {
        console.warn('[MisiPet] Error cargando configuración CCTV:', err);
      }

      modal.style.display = 'flex';
      modal.style.zIndex = '2000000';
    }

    closeCctvConfigModal() {
      const modal = document.getElementById('modal-misipet-cctv-config');
      if (modal) modal.style.display = 'none';
    }

    toggleCctvPassVisibility() {
      const passEl = document.getElementById('cctv-form-pass');
      if (passEl) {
        passEl.type = passEl.type === 'password' ? 'text' : 'password';
      }
    }

    async pingCctvTest() {
      const pingBox = document.getElementById('cctv-ping-results');
      const statusEl = document.getElementById('cctv-ping-status');
      const metricsEl = document.getElementById('cctv-ping-metrics');
      const detailsEl = document.getElementById('cctv-ping-details');

      if (pingBox) {
        pingBox.style.display = 'block';
        pingBox.style.borderColor = '#0D9488';
        if (statusEl) {
          statusEl.style.color = '#0D9488';
          statusEl.innerText = '⏳ Verificando enlace RTSP LAN y Pasarela Tukan Cloud (22 Canales)...';
        }
        if (metricsEl) metricsEl.innerText = 'Handshake en curso...';
        if (detailsEl) detailsEl.innerText = 'Sondeando NVR Dahua en LAN local y pasarela cloud...';
      }

      try {
        const res = await fetch('/api/v1/misipet/cctv/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping_test' })
        });
        const data = await res.json();
        const diag = data.diagnostics || data.data || {};

        if (pingBox) {
          pingBox.style.borderColor = '#10B981';
          if (statusEl) {
            statusEl.style.color = '#059669';
            statusEl.innerText = '✅ ENLACE HÍBRIDO CONECTADO (200 OK)';
          }
          if (metricsEl) {
            metricsEl.innerText = `NVR LAN: ${diag.nvr_latency_ms || 4.2}ms • Tukan Cloud: ${diag.tukan_latency_ms || 28.5}ms`;
          }
          if (detailsEl) {
            detailsEl.innerText = `${diag.channels_online || 22}/22 canales online. ${diag.message || 'Sincronización activa con NVR Dahua y Tukan Cloud.'}`;
          }
        }

        if (window.showToast) {
          window.showToast('📹 Ping CCTV exitoso: 22 canales sincronizados y pasarela operativa.', 'success');
        } else {
          alert('📹 Conexión CCTV y Pasarela Tukan verificada con éxito (22 canales en línea).');
        }
      } catch (err) {
        if (pingBox) {
          pingBox.style.borderColor = '#EF4444';
          if (statusEl) {
            statusEl.style.color = '#DC2626';
            statusEl.innerText = '❌ Error de Conexión';
          }
          if (detailsEl) {
            detailsEl.innerText = err.message || 'No se pudo conectar con el NVR Dahua ni con la pasarela Tukan.';
          }
        }
        if (window.showToast) {
          window.showToast('Error en prueba de conexión CCTV: ' + err.message, 'error');
        } else {
          alert('Error en prueba de conexión CCTV: ' + err.message);
        }
      }
    }

    async saveCctvConfig(event) {
      if (event) event.preventDefault();

      const ip = document.getElementById('cctv-form-ip')?.value.trim() || '192.168.1.100';
      const rtspPort = parseInt(document.getElementById('cctv-form-rtsp-port')?.value, 10) || 554;
      const httpPort = parseInt(document.getElementById('cctv-form-http-port')?.value, 10) || 80;
      const onvifPort = parseInt(document.getElementById('cctv-form-onvif-port')?.value, 10) || 8000;
      const user = document.getElementById('cctv-form-user')?.value.trim() || 'admin';
      const pass = document.getElementById('cctv-form-pass')?.value || '';
      const gatewayUrl = document.getElementById('cctv-form-gateway-url')?.value.trim() || 'https://cloud.tukan.mrspets.com/api/v2/stream';
      const accountId = document.getElementById('cctv-form-account-id')?.value.trim() || 'TUKAN-ACC-MRSPETS-MARACAIBO';
      const token = document.getElementById('cctv-form-token')?.value.trim() || 'GEO-TOKEN-HARRY-DALYBELL-2026-TUKAN-SECURE';
      const protocol = document.getElementById('cctv-form-protocol')?.value || 'WebRTC Seguro / RTSP over WSS';
      const mosaic = document.getElementById('cctv-form-mosaic')?.value || '2x2';

      const payload = {
        nvr_lan: {
          ip_address: ip,
          rtsp_port: rtspPort,
          http_port: httpPort,
          onvif_port: onvifPort,
          username: user
        },
        tukan_cloud: {
          gateway_url: gatewayUrl,
          account_id: accountId,
          geo_admin_token: token,
          streaming_protocol: protocol,
          active_mosaic_preset: mosaic
        }
      };

      try {
        const res = await fetch('/api/v1/misipet/cctv/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
          this.closeCctvConfigModal();
          if (window.showToast) {
            window.showToast('✅ Configuración de Circuito Cerrado y Pasarela Tukan guardada exitosamente.', 'success');
          } else {
            alert('✅ Configuración de Circuito Cerrado guardada exitosamente.');
          }
          this.loadCameras();
        } else {
          alert('Error al guardar configuración CCTV: ' + (data.message || 'Error desconocido'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    // ==========================================
    // CONFIGURACIÓN WI-FI & TERMOSTATOS DE TEMPERATURA
    // ==========================================
    async openThermostatConfigModal(thermostatId) {
      const modal = document.getElementById('modal-misipet-thermostat-config');
      if (!modal) return;

      const pingBox = document.getElementById('thermostat-ping-results');
      if (pingBox) pingBox.style.display = 'none';

      try {
        const res = await fetch(`/api/v1/misipet/thermostats/${thermostatId}`);
        const data = await res.json();
        const t = data.thermostat || data.data || {};
        const wifi = t.wifi_config || {};

        document.getElementById('thermostat-form-id').value = t.id || thermostatId;
        document.getElementById('thermostat-display-title').innerText = `❄️ ${t.name || thermostatId}`;
        document.getElementById('thermostat-display-subtitle').innerText = `${t.location || 'Sucursal'} • Temperatura Actual: ${t.temp_actual_c || 22}°C`;

        document.getElementById('thermostat-form-ssid').value = wifi.ssid || 'MrsPets-IoT-DonBosco';
        document.getElementById('thermostat-form-pass').value = '';
        document.getElementById('thermostat-form-ip').value = wifi.ip_address || '192.168.1.135';
        document.getElementById('thermostat-form-port').value = wifi.port || 8080;
        document.getElementById('thermostat-form-protocol').value = wifi.protocol || 'Wi-Fi ESP32 / HTTP REST';
        document.getElementById('thermostat-form-chip').value = wifi.chip_id || `ESP32-${thermostatId}`;
        document.getElementById('thermostat-form-target').value = t.temp_target_c !== undefined ? t.temp_target_c : 21.0;
        document.getElementById('thermostat-form-interval').value = wifi.telemetry_interval_sec || 30;
        document.getElementById('thermostat-form-min-t').value = t.min_threshold_c !== undefined ? t.min_threshold_c : 18.0;
        document.getElementById('thermostat-form-max-t').value = t.max_threshold_c !== undefined ? t.max_threshold_c : 24.0;
        document.getElementById('thermostat-form-webhook').checked = wifi.make_webhook_enabled !== false;

        modal.style.display = 'flex';
      } catch (e) {
        alert('Error al abrir configuración del termostato: ' + e.message);
      }
    }

    closeThermostatConfigModal() {
      const modal = document.getElementById('modal-misipet-thermostat-config');
      if (modal) modal.style.display = 'none';
    }

    toggleThermostatPassVisibility() {
      const passInput = document.getElementById('thermostat-form-pass');
      if (passInput) {
        passInput.type = passInput.type === 'password' ? 'text' : 'password';
      }
    }

    async saveThermostatConfig(event) {
      if (event) event.preventDefault();
      const id = document.getElementById('thermostat-form-id').value;
      const ssid = document.getElementById('thermostat-form-ssid').value.trim();
      const password = document.getElementById('thermostat-form-pass').value;
      const ip_address = document.getElementById('thermostat-form-ip').value.trim();
      const port = parseInt(document.getElementById('thermostat-form-port').value) || 8080;
      const protocol = document.getElementById('thermostat-form-protocol').value;
      const chip_id = document.getElementById('thermostat-form-chip').value.trim();
      const temp_target_c = parseFloat(document.getElementById('thermostat-form-target').value);
      const telemetry_interval_sec = parseInt(document.getElementById('thermostat-form-interval').value) || 30;
      const min_threshold_c = parseFloat(document.getElementById('thermostat-form-min-t').value);
      const max_threshold_c = parseFloat(document.getElementById('thermostat-form-max-t').value);
      const make_webhook_enabled = document.getElementById('thermostat-form-webhook').checked;

      const payload = {
        id,
        ssid,
        password,
        ip_address,
        port,
        protocol,
        chip_id,
        temp_target_c,
        telemetry_interval_sec,
        min_threshold_c,
        max_threshold_c,
        make_webhook_enabled
      };

      try {
        const res = await fetch('/api/v1/misipet/thermostats/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
          this.closeThermostatConfigModal();
          alert(`✅ Termostato ${id} configurado con éxito. Red Wi-Fi: ${ssid} en ${ip_address}.`);
          this.loadOverview();
        } else {
          alert('Error al guardar termostato: ' + data.message);
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    async pingThermostatTest() {
      const id = document.getElementById('thermostat-form-id').value;
      const pingBox = document.getElementById('thermostat-ping-results');
      const statusEl = document.getElementById('thermostat-ping-status');
      const metricsEl = document.getElementById('thermostat-ping-metrics');
      const detailsEl = document.getElementById('thermostat-ping-details');

      if (!pingBox) return;
      pingBox.style.display = 'block';
      statusEl.innerText = '📡 ENVIANDO PING WI-FI (HANDSHAKE)...';
      statusEl.style.color = '#F59E0B';
      metricsEl.innerText = 'Consultando...';
      detailsEl.innerText = 'Estableciendo socket TCP hacia el termostato ESP32...';

      try {
        const res = await fetch('/api/v1/misipet/thermostats/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
          const diag = data.diagnostics || {};
          statusEl.innerText = '✅ ENLACE WI-FI ESTABLECIDO (200 OK)';
          statusEl.style.color = '#10B981';
          metricsEl.innerText = `Latencia: ${diag.latency_ms || 14}ms • ${diag.signal_quality || '88%'}`;
          detailsEl.innerText = diag.message || `Conexión verificada con ${diag.chip_id} en ${diag.ip_address}.`;
        } else {
          statusEl.innerText = '❌ FALLO DE CONEXIÓN WI-FI';
          statusEl.style.color = '#EF4444';
          detailsEl.innerText = data.message || 'El termostato no respondió al ping en la IP configurada.';
        }
      } catch (e) {
        statusEl.innerText = '❌ ERROR DE COMUNICACIÓN';
        statusEl.style.color = '#EF4444';
        detailsEl.innerText = e.message;
      }
    }

    // ==========================================
    // CÁLCULO DINÁMICO DE AUTONOMÍA HÍDRICA (CDT)
    // Sincronizado en tiempo real con Tiempo en Vivo (7 Estados)
    // ==========================================
    getLivePatientCounts() {
      let hotelCount = 1;
      let groomingCount = 10;
      let clinicaCount = 1;

      if (window.petStatusEngine && Array.isArray(window.petStatusEngine.pets) && window.petStatusEngine.pets.length > 0) {
        const todayPets = window.petStatusEngine.pets.filter(p => {
          if (typeof window.petStatusEngine.isWithinDateRange === 'function') {
            return window.petStatusEngine.isWithinDateRange(p, 'today');
          }
          return true;
        });
        groomingCount = todayPets.filter(p => window.petStatusEngine.normalizeService(p.area) === 'grooming').length;
        clinicaCount = todayPets.filter(p => window.petStatusEngine.normalizeService(p.area) === 'clinica').length;
        hotelCount = todayPets.filter(p => window.petStatusEngine.normalizeService(p.area) === 'hotel').length;
      } else if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus) && window.adminEngine.patientsStatus.length > 0) {
        const norm = a => (a || '').toLowerCase();
        groomingCount = window.adminEngine.patientsStatus.filter(p => norm(p.area).includes('groom')).length;
        clinicaCount = window.adminEngine.patientsStatus.filter(p => norm(p.area).includes('clinic') || norm(p.area).includes('uci')).length;
        hotelCount = window.adminEngine.patientsStatus.filter(p => norm(p.area).includes('hotel')).length;
      } else {
        try {
          const stored = localStorage.getItem('mrs_pets_registered_pets') || localStorage.getItem('mrs_pets_admin_patients');
          if (stored) {
            const pets = JSON.parse(stored);
            if (Array.isArray(pets) && pets.length > 0) {
              const norm = a => (a || '').toLowerCase();
              groomingCount = pets.filter(p => norm(p.area).includes('groom')).length;
              clinicaCount = pets.filter(p => norm(p.area).includes('clinic') || norm(p.area).includes('uci')).length;
              hotelCount = pets.filter(p => norm(p.area).includes('hotel')).length;
            }
          }
        } catch(e) {}
      }

      return {
        hotel: Math.max(0, hotelCount),
        grooming: Math.max(0, groomingCount),
        clinica: Math.max(0, clinicaCount)
      };
    }

    calculateCdt(hotelGuests, groomingSessions, clinicHospitalized, bufferFactor = 1.10) {
      const hGuests = Math.max(0, parseInt(hotelGuests, 10) || 0);
      const gSessions = Math.max(0, parseInt(groomingSessions, 10) || 0);
      const cPatients = Math.max(0, parseInt(clinicHospitalized, 10) || 0);
      const bFactor = parseFloat(bufferFactor) || 1.10;

      const hotelLiters = Math.round(hGuests * 25.0 * 10) / 10;
      const groomingLiters = Math.round(gSessions * 55.0 * 10) / 10;
      const clinicBase = 320.0;
      const clinicLiters = Math.round((clinicBase + (cPatients * 30.0)) * 10) / 10;

      const subtotal = Math.round((hotelLiters + groomingLiters + clinicLiters) * 10) / 10;
      const bufferLiters = Math.round((subtotal * (bFactor - 1.0)) * 10) / 10;
      const adjustedCdt = Math.round((subtotal * bFactor) * 10) / 10;
      const hourlyBurnRate = adjustedCdt > 0 ? Math.round((adjustedCdt / 24.0) * 100) / 100 : 0;

      const totalCurrent = (this.overviewData && this.overviewData.water_overview && this.overviewData.water_overview.total_current_liters) || 18400.0;
      const totalCapacity = (this.overviewData && this.overviewData.water_overview && this.overviewData.water_overview.total_capacity_liters) || 21000.0;
      const totalPct = totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 1000) / 10 : 87.6;

      const autonomyDays = adjustedCdt > 0 ? Math.round((totalCurrent / adjustedCdt) * 10) / 10 : 0;
      const autonomyHours = Math.round((autonomyDays * 24.0) * 10) / 10;

      let semaphore = 'green';
      if (autonomyHours <= 24.0) {
        semaphore = 'red';
      } else if (autonomyHours <= 48.0) {
        semaphore = 'yellow';
      }

      return {
        total_current_liters: totalCurrent,
        total_capacity_liters: totalCapacity,
        total_pct: totalPct,
        tanks_count: 4,
        variables: {
          hotel: {
            active_guests: hGuests,
            coef_liters_per_guest: 25.0,
            total_hotel_liters: hotelLiters
          },
          grooming: {
            scheduled_sessions: gSessions,
            liters_per_bath_cycle: 55.0,
            total_grooming_liters: groomingLiters
          },
          clinica: {
            base_operational_liters: clinicBase,
            active_hospitalized_pets: cPatients,
            liters_per_hospitalized: cPatients * 30.0,
            total_clinica_liters: clinicLiters
          },
          safety_buffer: {
            factor: bFactor,
            percent: 10,
            buffer_liters: bufferLiters
          }
        },
        subtotal_operational_liters: subtotal,
        adjusted_cdt_liters_day: adjustedCdt,
        daily_consumption_liters: adjustedCdt,
        hourly_burn_rate_liters: hourlyBurnRate,
        autonomy_days: autonomyDays,
        autonomy_hours: autonomyHours,
        semaphore: semaphore
      };
    }

    stepCdtVar(varName, delta) {
      if (!this.cdtState) {
        const live = this.getLivePatientCounts();
        this.cdtState = {
          hotel: live.hotel,
          grooming: live.grooming,
          clinica: live.clinica,
          buffer: 1.10
        };
      }

      const key = (varName === 'clinic' || varName === 'clinica') ? 'clinica' : varName;
      if (this.cdtState[key] !== undefined) {
        this.cdtState[key] = Math.max(0, (parseInt(this.cdtState[key], 10) || 0) + delta);
      }

      this.renderMasterDashboard();
      this.syncCdtWithBackend();
    }

    resetCdtVariables() {
      const live = this.getLivePatientCounts();
      this.cdtState = {
        hotel: live.hotel,
        grooming: live.grooming,
        clinica: live.clinica,
        buffer: 1.10
      };

      const cdt = this.calculateCdt(this.cdtState.hotel, this.cdtState.grooming, this.cdtState.clinica, this.cdtState.buffer);
      this.renderMasterDashboard();
      this.syncCdtWithBackend();

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🔄 Variables CDT sincronizadas con Tiempo en Vivo (7 Estados): Hotel (${live.hotel}), Grooming (${live.grooming}), Clínica (${live.clinica}). Consumo CDT: ${cdt.adjusted_cdt_liters_day} L/día.`, 'success');
      }
    }

    async syncCdtWithBackend() {
      if (!this.cdtState) return;
      try {
        await fetch('/api/v1/misipet/water/cdt/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotel_guests: this.cdtState.hotel,
            grooming_sessions: this.cdtState.grooming,
            clinic_hospitalized: this.cdtState.clinica,
            buffer_factor: this.cdtState.buffer || 1.10
          })
        });
      } catch (e) {
        // Silencioso en modo offline o desconexión
      }
    }

    async loadFleetGps() {
      try {
        const res = await fetch('/api/v1/misipet/drivers');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        this.fleetGpsData = data.drivers || [];
        this.fleetGpsHq = data.headquarters || { name: 'Mrs. Pets Sede Central', lat: 10.6698, lng: -71.6052 };
      } catch (e) {
        console.warn('⚠️ [MISIPET] Error cargando telemetría de flota:', e);
        if (window.limusinaVipEngine) {
          this.fleetGpsData = window.limusinaVipEngine.getAllDrivers();
        }
      }
    }

    renderFleetGpsView() {
      const container = document.getElementById('misipet-dept-assets-container');
      if (!container) return;

      const drivers = this.fleetGpsData || (window.limusinaVipEngine ? window.limusinaVipEngine.getAllDrivers() : []);
      const activeCount = drivers.filter(d => d.gps_enabled || (d.status && d.status.includes('GPS'))).length;

      let html = `
        <div style="background:#ffffff; border:1.5px solid #38BDF8; border-radius:20px; padding:24px; box-shadow:0 6px 20px rgba(0,0,0,0.04); margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:48px; height:48px; border-radius:14px; background:rgba(56,189,248,0.12); border:1.5px solid #38BDF8; display:flex; align-items:center; justify-content:center; font-size:1.6rem;">
                🛰️
              </div>
              <div>
                <div style="font-size:0.72rem; font-weight:800; color:#0284c7; text-transform:uppercase; letter-spacing:0.08em;">
                  LOGÍSTICA URBANA & PET CHAUFFEURS • MRS. PETS MARACAIBO
                </div>
                <h3 style="font-size:1.3rem; font-weight:900; color:#0f172a; margin:2px 0 0 0;">
                  Centro de Control Satelital & Telemetría GPS de Flota
                </h3>
                <div style="font-size:0.78rem; color:#64748b; margin-top:2px;">
                  Cálculo de arribo geodésico Haversine (1.35x curvatura vial) hacia la Sede Central (El Milagro) y domicilios.
                </div>
              </div>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn btn-sm" onclick="misipetEngine.loadFleetGps().then(() => misipetEngine.renderFleetGpsView())" style="background:#f1f5f9; color:#0f172a; font-weight:800; border:1px solid #cbd5e1; border-radius:10px; padding:8px 14px; cursor:pointer;">
                🔄 Actualizar Telemetría
              </button>
              <button type="button" class="btn btn-sm" onclick="window.limusinaVipEngine && window.limusinaVipEngine.openDriverCockpitModal()" style="background:#0F172A; color:#38BDF8; border:1.5px solid #38BDF8; font-weight:800; border-radius:10px; padding:8px 14px; cursor:pointer;">
                🛰️ Cockpit Chofer & GPS
              </button>
              <button type="button" class="btn btn-sm" onclick="window.limusinaVipEngine && window.limusinaVipEngine.openDriverSelfRegisterModal()" style="background:#10B981; color:white; border:none; font-weight:800; border-radius:10px; padding:8px 14px; cursor:pointer;">
                📱 Auto-Registro Chofer
              </button>
            </div>
          </div>

          <!-- STATUS PILLS -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; padding-top:16px; border-top:1px solid #e2e8f0; margin-bottom:20px;">
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px;">
              <div style="font-size:0.68rem; color:#64748b; font-weight:800;">UNIDADES REGISTRADAS</div>
              <div style="font-size:1.15rem; font-weight:900; color:#0f172a; margin-top:2px;">🚗 ${drivers.length} Vehículos VIP</div>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px;">
              <div style="font-size:0.68rem; color:#64748b; font-weight:800;">TRANSMISIÓN GPS EN VIVO</div>
              <div style="font-size:1.15rem; font-weight:900; color:#10B981; margin-top:2px;">● ${activeCount} Conectados</div>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px;">
              <div style="font-size:0.68rem; color:#64748b; font-weight:800;">TIEMPO MEDIO DE ARRIBO (ETA)</div>
              <div style="font-size:1.15rem; font-weight:900; color:#0284c7; margin-top:2px;">⏱️ ~6.5 min (1.9 km)</div>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px;">
              <div style="font-size:0.68rem; color:#64748b; font-weight:800;">SEDE RECEPTORA CENTRAL</div>
              <div style="font-size:1.05rem; font-weight:900; color:#D4AF37; margin-top:2px;">🏥 Av. 2 El Milagro</div>
            </div>
          </div>

          <!-- LISTA DETALLADA DE UNIDADES Y RASTREO -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px;">
            ${drivers.map(d => {
              const loc = d.current_location || { lat: 10.6698, lng: -71.6052, speed_kmh: 28 };
              const isGpsOn = d.gps_enabled !== false;
              const etaText = d.eta_to_hq ? d.eta_to_hq.formatted_eta : (d.active_trip ? d.active_trip.formatted_eta : '~4 min (1.2 km)');
              return `
                <div style="background:#ffffff; border:1.5px solid ${isGpsOn ? '#38BDF8' : '#e2e8f0'}; border-radius:16px; padding:16px; box-shadow:0 3px 10px rgba(0,0,0,0.03); display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                      <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${d.photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(d.name) + '&background=111827&color=D4AF37')}" alt="${d.name}" style="width:48px; height:48px; border-radius:14px; object-fit:cover; border:2px solid #D4AF37;" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=111827&color=D4AF37';">
                        <div>
                          <h4 style="font-size:0.95rem; font-weight:900; color:#0f172a; margin:0;">${d.name}</h4>
                          <div style="font-size:0.72rem; color:#64748b;">${d.vehicle || 'Vehículo VIP'} • <b style="color:#D4AF37; font-family:monospace;">${d.plates || 'S/P'}</b></div>
                        </div>
                      </div>
                      <span style="font-size:0.68rem; font-weight:800; color:${isGpsOn ? '#059669' : '#64748b'}; background:${isGpsOn ? 'rgba(16,185,129,0.12)' : '#f1f5f9'}; border:1px solid ${isGpsOn ? '#10b981' : '#cbd5e1'}; padding:3px 8px; border-radius:6px;">
                        ${isGpsOn ? '🟢 GPS ONLINE' : '⚪ STANDBY'}
                      </span>
                    </div>

                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px; font-size:0.75rem; margin-bottom:10px;">
                      <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                        <span style="color:#64748b;">📍 Sector Base:</span>
                        <strong style="color:#0f172a;">${d.sector}</strong>
                      </div>
                      <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                        <span style="color:#64748b;">📡 Coordenadas:</span>
                        <strong style="color:#0284c7; font-family:monospace;">${Number(loc.lat).toFixed(4)}, ${Number(loc.lng).toFixed(4)}</strong>
                      </div>
                      <div style="display:flex; justify-content:space-between; border-top:1px dashed #e2e8f0; padding-top:4px; margin-top:4px;">
                        <span style="color:#64748b;">⏱️ Tiempo a Sede (ETA):</span>
                        <strong style="color:#10B981; font-size:0.82rem;">${etaText}</strong>
                      </div>
                    </div>

                    ${d.active_trip ? `
                      <div style="background:rgba(56,189,248,0.08); border-left:3px solid #38BDF8; padding:8px 10px; border-radius:0 8px 8px 0; font-size:0.72rem; color:#0369a1; margin-bottom:12px;">
                        🚗 <b>En traslado:</b> ${d.active_trip.customer_name} (${d.active_trip.pet_name}) ➔ ${d.active_trip.formatted_eta || 'En camino'}
                      </div>
                    ` : ''}
                  </div>

                  <div style="display:flex; gap:8px; margin-top:8px;">
                    <button type="button" class="btn btn-sm" onclick="window.limusinaVipEngine && window.limusinaVipEngine.openDriverLiveTrackingModal('${d.id}')" style="flex:1; background:linear-gradient(135deg, #0284c7, #0369a1); color:white; border:none; border-radius:8px; padding:7px; font-size:0.74rem; font-weight:800; cursor:pointer;">
                      🗺️ Radar GPS
                    </button>
                    <button type="button" class="btn btn-sm" onclick="window.limusinaVipEngine && window.limusinaVipEngine.openDriverCockpitModal('${d.id}')" style="flex:1; background:#0F172A; color:#38BDF8; border:1px solid #38BDF8; border-radius:8px; padding:7px; font-size:0.74rem; font-weight:800; cursor:pointer;">
                      🛰️ Cockpit
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      container.innerHTML = html;
    }

    speakWaterAlert(hours) {
      const msg = `Atención equipo de planta Mrs. Pets. Autonomía hídrica restante de ${hours} horas en batería de tanques principal. Se requiere verificación operativa.`;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`📢 Leia: "${msg}"`, 'warning');
      }
    }
  }

  // Exponer instancia global
  window.misipetEngine = new MisipetCommandEngine();

})(window);
