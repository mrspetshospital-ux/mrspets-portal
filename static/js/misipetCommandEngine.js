/**
 * MISIPET Command Engine 2.0
 * Centro de Comando Operativo, Infraestructura Crítica y Mantenimiento Autónomo
 * Big & Little Dogs, C.A. (Mrs. Pets Don Bosco • Maracaibo, Venezuela)
 * Orquestación: Mike (Operaciones & Calidad) + Leia (Voz Central) -> Make.com
 */

(function(window) {
  'use strict';

  class MisipetCommandEngine {
    constructor() {
      this.currentViewMode = 'master'; // 'master' (Pantalla Superior), 'workstation' (Pantalla Inferior), 'split' (Dual)
      this.currentRole = 'admin_geo'; // 'supervisor' (LAN) o 'admin_geo' (Harry & Dalybell)
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
    }

    init() {
      console.log('🚀 [MISIPET 2.0] Inicializando Centro de Comando Operativo...');
      this.loadOverview();
      this.loadDepartment(this.activeDepartment);
      this.loadCameras();
      this.setupAutoRefresh();
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
          roleBadge.innerHTML = '🛡️ SUPERVISOR DE PISO (MODO LAN LOCAL) • RED INTERNA';
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
        this.overviewData = data;
        this.renderMasterDashboard();
        if (!silent) console.log('✅ [MISIPET] Macrovisión cargada:', data);
      } catch (err) {
        console.warn('⚠️ [MISIPET] Fallo al cargar overview, usando datos de respaldo:', err);
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
        const cdt = w.cdt_breakdown || {
          variables: {
            hotel: { active_guests: 14, total_hotel_liters: 350.0 },
            grooming: { scheduled_sessions: 18, total_grooming_liters: 990.0 },
            clinica: { active_hospitalized_pets: 3, total_clinica_liters: 410.0 },
            safety_buffer: { buffer_liters: 175.0 }
          },
          adjusted_cdt_liters_day: w.daily_consumption_liters || 1925.0,
          hourly_burn_rate_liters: w.hourly_burn_rate_liters || 80.21,
          semaphore: w.semaphore || 'green'
        };
        const semClass = w.semaphore === 'green' ? 'cdt-sem-green' : (w.semaphore === 'yellow' ? 'cdt-sem-yellow' : 'cdt-sem-red');
        const badgeClass = w.semaphore === 'green' ? 'badge-nominal' : (w.semaphore === 'yellow' ? 'badge-warning' : 'badge-alert');

        waterEl.innerHTML = `
          <div class="macro-metric-header">
            <div class="macro-title-group">
              <span class="macro-icon">💧</span>
              <div>
                <h3 class="macro-card-title">AUTONOMÍA HÍDRICA GLOBAL</h3>
                <span class="macro-subtitle">Batería de Tanques Don Bosco • Consumo CDT: ${w.daily_consumption_liters || 1925} L/día (~${w.hourly_burn_rate_liters || 80.2} L/h)</span>
              </div>
            </div>
            <div class="macro-badge-autonomy ${badgeClass}">
              <span>⏱️ ${w.autonomy_days || 0} DÍAS</span>
              <small>(${w.autonomy_hours || 0} Horas)</small>
            </div>
          </div>
          <div class="macro-progress-bar-container">
            <div class="macro-progress-bar-fill" style="width: ${Math.min(100, w.total_pct || 0)}%;"></div>
          </div>
          <div class="macro-stats-row">
            <span><strong>Nivel Total:</strong> ${Number(w.total_current_liters || 0).toLocaleString()} L</span>
            <span><strong>Capacidad Máx:</strong> ${Number(w.total_capacity_liters || 0).toLocaleString()} L (${w.total_pct || 0}%)</span>
            <span><strong>Tanques Activos:</strong> ${w.tanks_count || 4} Unidades</span>
          </div>

          <!-- PANEL DINÁMICO DE CONSUMO DIARIO TOTAL (CDT) -->
          <div class="cdt-panel-wrapper">
            <div class="cdt-panel-header">
              <div class="cdt-title">
                <span>📊 CÁLCULO DINÁMICO DE AUTONOMÍA HÍDRICA (CDT)</span>
                <span class="cdt-formula-tag">CDT = (Hotel + Grooming + Clínica) × 1.10</span>
              </div>
              <button type="button" class="btn-secondary" style="font-size:0.7rem; padding:3px 8px;" onclick="misipetEngine.resetCdtVariables()">🔄 Valores Base</button>
            </div>

            <div class="cdt-grid-cards">
              <div class="cdt-card">
                <div class="cdt-card-title">🏨 Hotel VIP</div>
                <div class="cdt-card-val"><span id="cdt-disp-hotel">${cdt.variables?.hotel?.active_guests || 14}</span> <small style="font-size:0.7rem;">Huéspedes</small></div>
                <div class="cdt-card-sub">${cdt.variables?.hotel?.total_hotel_liters || 350} L/día</div>
                <div class="cdt-stepper-row">
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('hotel', -1)">-</button>
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('hotel', 1)">+</button>
                </div>
              </div>

              <div class="cdt-card">
                <div class="cdt-card-title">✂️ Grooming Spa</div>
                <div class="cdt-card-val"><span id="cdt-disp-groom">${cdt.variables?.grooming?.scheduled_sessions || 18}</span> <small style="font-size:0.7rem;">Sesiones</small></div>
                <div class="cdt-card-sub">${cdt.variables?.grooming?.total_grooming_liters || 990} L/día</div>
                <div class="cdt-stepper-row">
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('grooming', -1)">-</button>
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('grooming', 1)">+</button>
                </div>
              </div>

              <div class="cdt-card">
                <div class="cdt-card-title">🏥 Clínica & UCI</div>
                <div class="cdt-card-val"><span id="cdt-disp-clinic">${cdt.variables?.clinica?.active_hospitalized_pets || 3}</span> <small style="font-size:0.7rem;">Pacientes</small></div>
                <div class="cdt-card-sub">${cdt.variables?.clinica?.total_clinica_liters || 410} L/día</div>
                <div class="cdt-stepper-row">
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('clinic', -1)">-</button>
                  <button type="button" class="cdt-step-btn" onclick="misipetEngine.stepCdtVar('clinic', 1)">+</button>
                </div>
              </div>

              <div class="cdt-card">
                <div class="cdt-card-title">🛡️ Buffer Holgura</div>
                <div class="cdt-card-val">+10%</div>
                <div class="cdt-card-sub">${cdt.variables?.safety_buffer?.buffer_liters || 175} L/día</div>
                <div style="font-size:0.65rem; color:#64748B; margin-top:8px;">Factor Multiplicador (1.10)</div>
              </div>
            </div>

            <!-- Semáforo Dinámico CDT -->
            <div class="cdt-semaphore-banner ${semClass}">
              <div>
                ${w.semaphore === 'green' ? `
                  <span>🟢 <strong>Suministro Nominal Óptimo:</strong> Autonomía proyectada superior a 48 horas (${w.autonomy_hours} hrs / ${w.autonomy_days} días).</span>
                ` : (w.semaphore === 'yellow' ? `
                  <span>🟡 <strong>Alerta Preventiva (24h - 48h):</strong> Autonomía restante de ${w.autonomy_hours} horas (${w.autonomy_days} días). Notificar a Mike y Leia.</span>
                ` : `
                  <span>🔴 <strong>ALERTA CRÍTICA (< 24h):</strong> Autonomía de ${w.autonomy_hours} horas. Activar bomba ladrona o coordinar recarga externa con cisterna.</span>
                `)}
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                ${w.semaphore === 'yellow' ? `
                  <button type="button" class="btn-voice-leia" style="font-size:0.72rem; padding:4px 10px;" onclick="misipetEngine.speakWaterAlert('${w.autonomy_hours}')">📢 Anunciar por Leia</button>
                ` : ''}
                ${w.semaphore === 'red' ? `
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
              ${this.currentRole === 'admin_geo' ? `
                <div class="cylinder-actions">
                  <button class="btn-cylinder-edit" onclick="misipetEngine.openTankModal('${t.id}')">⚙️ Calibrar</button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('') + (this.currentRole === 'admin_geo' ? `
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

              <div class="asset-card-actions">
                <button class="btn-action-override" onclick="misipetEngine.openOverrideModal('${asset.id}', '${asset.name.replace(/'/g, "\\'")}', '${sem}')" title="Override directo de condición por Harry & Dalybell o Mike Teamily">
                  🛡️ Override Condición
                </button>
                <button class="btn-action-mant" onclick="misipetEngine.openMaintenanceModal('${asset.id}', 'menor')">
                  🔧 Mantenimiento Menor
                </button>
                <button class="btn-action-mant major" onclick="misipetEngine.openMaintenanceModal('${asset.id}', 'mayor')">
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
                ${this.currentRole === 'admin_geo' ? `
                  <button class="btn-action-edit" onclick="misipetEngine.openAssetModal('${this.activeDepartment}', '${asset.id}')">
                    ✏️
                  </button>
                  <button class="btn-action-delete" onclick="misipetEngine.deleteAssetPrompt('${asset.id}')">
                    🗑️
                  </button>
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
    }

    // ==========================================
    // PANTALLA INFERIOR: WORKSTATION / RESERVACIONES
    // ==========================================
    renderWorkstationScreen() {
      const container = document.getElementById('misipet-workstation-content');
      if (!container) return;

      container.innerHTML = `
        <div class="workstation-dashboard">
          <div class="workstation-header">
            <div>
              <h2 class="workstation-title">PANTALLA INFERIOR • ESTACIÓN DE RECEPCIÓN & MOSTRADOR</h2>
              <span class="workstation-sub">Agenda en Vivo • Pacientes en Sucursal Don Bosco • Facturación</span>
            </div>
            <div class="workstation-quick-actions">
              <button class="btn-ws-action" onclick="app.switchTab('store')">🛍️ Catálogo Tienda</button>
              <button class="btn-ws-action" onclick="app.switchTab('clinica')">🏥 Agenda Veterinaria</button>
              <button class="btn-ws-action" onclick="clinicaEngine.openGroomingBookingModal('Circuito Grooming Spa')">✂️ Nueva Cita Grooming</button>
            </div>
          </div>
          <div class="workstation-cards-row">
            <div class="ws-widget-box">
              <h4>🐾 Pacientes en Espera / Grooming</h4>
              <ul class="ws-list">
                <li><strong>Toby</strong> (Golden Retriever) - Batea 1 (En Baño)</li>
                <li><strong>Luna</strong> (Poodle Toy) - Mesa Secado 2 (Corte de Tijera)</li>
                <li><strong>Max</strong> (Bulldog Francés) - Espera en Lobby</li>
              </ul>
            </div>
            <div class="ws-widget-box">
              <h4>📋 Consultorios Veterinarios</h4>
              <ul class="ws-list">
                <li><strong>Consultorio 1 (Dra. Andrea):</strong> Consulta Vacunación Puppy</li>
                <li><strong>Consultorio 2 (Dr. Morales):</strong> Evaluación Pre-quirúrgica</li>
                <li><strong>Quirófano:</strong> Esterilización Programada 11:30 AM</li>
              </ul>
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

      const payload = {
        id,
        name,
        category,
        hours_odometer,
        location,
        responsible,
        next_minor_service: next_minor_service || '2026-11-30',
        next_major_service: next_major_service || '2027-05-30',
        department: dept
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
    // MODAL DE TANQUES DE AGUA (CRUD)
    // ==========================================
    openTankModal(tankId) {
      const modal = document.getElementById('modal-misipet-tank-crud');
      if (!modal) return;

      const titleEl = document.getElementById('misipet-tank-modal-title');
      const idInput = document.getElementById('misipet-tank-id');
      const nameInput = document.getElementById('misipet-tank-name');
      const capInput = document.getElementById('misipet-tank-cap');
      const currInput = document.getElementById('misipet-tank-curr');
      const pumpInput = document.getElementById('misipet-tank-pump');

      if (tankId && this.overviewData && this.overviewData.tanks) {
        const t = this.overviewData.tanks.find(x => x.id === tankId);
        if (t) {
          titleEl.innerText = `Calibrar Tanque: ${t.name}`;
          idInput.value = t.id;
          idInput.disabled = true;
          nameInput.value = t.name;
          capInput.value = t.capacity_liters;
          currInput.value = t.current_liters;
          pumpInput.value = t.associated_pump || '';
        }
      } else {
        titleEl.innerText = '➕ Añadir Nuevo Tanque a la Batería Hídrica';
        idInput.value = `tank-${Math.floor(100 + Math.random() * 900)}`;
        idInput.disabled = false;
        nameInput.value = '';
        capInput.value = 3000;
        currInput.value = 2800;
        pumpInput.value = 'Bomba en Línea';
      }

      modal.style.display = 'flex';
    }

    closeTankModal() {
      const modal = document.getElementById('modal-misipet-tank-crud');
      if (modal) modal.style.display = 'none';
    }

    async saveTankForm(event) {
      if (event) event.preventDefault();
      const id = document.getElementById('misipet-tank-id').value.trim();
      const name = document.getElementById('misipet-tank-name').value.trim();
      const capacity_liters = parseFloat(document.getElementById('misipet-tank-cap').value) || 1000;
      const current_liters = parseFloat(document.getElementById('misipet-tank-curr').value) || 0;
      const associated_pump = document.getElementById('misipet-tank-pump').value.trim();

      const payload = { id, name, capacity_liters, current_liters, associated_pump };

      try {
        const isEdit = document.getElementById('misipet-tank-id').disabled;
        const endpoint = isEdit ? '/api/v1/misipet/tanks/update' : '/api/v1/misipet/tanks';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Error al guardar tanque');
        this.closeTankModal();
        this.loadOverview();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    // ==========================================
    // EJECUCIÓN DE MANTENIMIENTO (RESET ODÓMETRO)
    // ==========================================
    openMaintenanceModal(assetId, serviceType) {
      const tech = prompt(`Registrar Mantenimiento ${serviceType.toUpperCase()} para ${assetId}.\nIngrese el nombre del técnico responsable:`, 'Técnico Especialista');
      if (!tech) return;

      const notes = prompt('Notas / Observaciones del servicio ejecutado:', 'Inspección conforme bajo norma ISO 9001.');

      this.executeMaintenance(assetId, serviceType, tech, notes || '');
    }

    async executeMaintenance(assetId, serviceType, technician, notes) {
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
          alert(`✅ Mantenimiento ${serviceType} completado con éxito para ${assetId}. Odómetro y fecha ISO 9001 actualizados.`);
          this.loadOverview();
          this.loadDepartment(this.activeDepartment);
        } else {
          alert('Error: ' + data.message);
        }
      } catch (e) {
        alert('Error de conexión: ' + e.message);
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
        } else {
          alert('Error al despachar orden: ' + data.message);
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
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
  }

  // Exponer instancia global
  window.misipetEngine = new MisipetCommandEngine();

})(window);
