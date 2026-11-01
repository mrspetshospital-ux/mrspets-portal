/* ==========================================================================
   ANALYTICS & OPERATIONAL TRACEABILITY ENGINE (Mrs. Pets Maracaibo)
   Estética: Silent Luxury (#D4AF37, #4A6B5D, #2C2C2E, #FBFBFD)
   ========================================================================== */

class AnalyticsEngine {
  constructor() {
    this.currentPeriod = 'today';
    this.customDateFrom = null;
    this.customDateTo = null;
    this.searchTerm = '';

    // Umbral predeterminado de alerta de cuello de botella por estación (en minutos)
    this.bottleneckThresholdMinutes = 25;

    // Estaciones por familia de servicio con promedios y responsables
    this.stationTemplates = {
      grooming: [
        { name: 'Recepción & Diagnóstico', defaultMinutes: 8, staff: 'Recepcionista Carla' },
        { name: 'Revisión Dérmica & Chequeo', defaultMinutes: 7, staff: 'Dra. Patricia Silva' },
        { name: 'Baño Spa & Hidromasaje', defaultMinutes: 24, staff: 'Groomer José Martínez' },
        { name: 'Secado & Cepillado', defaultMinutes: 28, staff: 'Groomer Andrea Colina' },
        { name: 'Corte Grooming & Estilo', defaultMinutes: 35, staff: 'Groomer Andrea Colina' },
        { name: 'Control de Calidad ✨', defaultMinutes: 10, staff: 'Supervisora Nicole' },
        { name: 'Entrega a Tutor VIP', defaultMinutes: 5, staff: 'Recepcionista Carla' }
      ],
      clinica: [
        { name: 'Triaje Médico & Recepción', defaultMinutes: 10, staff: 'Dra. Patricia Silva' },
        { name: 'Consulta & Diagnóstico', defaultMinutes: 30, staff: 'Dr. Alejandro Morales' },
        { name: 'Tratamiento & Medicación', defaultMinutes: 45, staff: 'Dr. Alejandro Morales' },
        { name: 'Observación UVI', defaultMinutes: 60, staff: 'Asistente Medico Gabriel' },
        { name: 'Alta Médica & Recomendaciones', defaultMinutes: 15, staff: 'Dra. Patricia Silva' }
      ],
      hotel: [
        { name: 'Check-in & Admisión Suite', defaultMinutes: 12, staff: 'Concierge Hotel' },
        { name: 'Alimentación & Dieta Especial', defaultMinutes: 20, staff: 'Cuidadora Sofía' },
        { name: 'Paseo VIP & Recreación', defaultMinutes: 45, staff: 'Paseador Carlos' },
        { name: 'Check-out & Entrega', defaultMinutes: 10, staff: 'Concierge Hotel' }
      ],
      tienda: [
        { name: 'Asesoría Nutricional / Boutique', defaultMinutes: 15, staff: 'Asesor Boutique' },
        { name: 'Selección & Empaque Regalo', defaultMinutes: 10, staff: 'Asesor Boutique' },
        { name: 'Facturación & Despacho', defaultMinutes: 5, staff: 'Caja Principal' }
      ]
    };
  }

  init() {
    this.enrichPetsData();
    this.renderAll();

    // Re-renderizar si la pestaña de analítica se activa
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab="analytics"]');
      if (btn) {
        setTimeout(() => this.renderAll(), 100);
      }
    });
  }

  // Genera el historial paso a paso para cada mascota activa/completada si no posee uno
  enrichPetsData() {
    if (!window.petStatusEngine || !window.petStatusEngine.pets) return;

    window.petStatusEngine.pets.forEach((pet) => {
      if (!pet.stepHistory) {
        pet.stepHistory = this.generateMockHistoryForPet(pet);
      }
    });
  }

  generateMockHistoryForPet(pet) {
    const family = pet.area || 'grooming';
    const stations = this.stationTemplates[family] || this.stationTemplates.grooming;
    const currentStep = typeof pet.stepIndex === 'number' ? pet.stepIndex : 2;

    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - 3);

    const history = [];
    let cumulativeMinutes = 0;

    stations.forEach((st, idx) => {
      const startTime = new Date(baseTime.getTime() + cumulativeMinutes * 60000);
      let isCompleted = idx <= currentStep || currentStep >= stations.length - 1;
      let isInProgress = idx === currentStep && currentStep < stations.length - 1;
      let isPending = idx > currentStep && currentStep < stations.length - 1;

      // Variación realista de tiempo
      let actualMinutes = st.defaultMinutes;
      if (pet.id === 'PET-101' && idx === 3) {
        actualMinutes = 32; // Cuello de botella simulado en Secado
      } else if (pet.id === 'PET-103' && idx === 2) {
        actualMinutes = 29; // Cuello de botella simulado en Baño Spa
      }

      cumulativeMinutes += actualMinutes;
      const endTime = isCompleted ? new Date(startTime.getTime() + actualMinutes * 60000) : null;

      let staffName = st.staff;
      const petNameClean = (pet.petName || pet.name || '').toLowerCase();
      if (pet.id === 'PET-110' || petNameClean.includes('cuga')) {
        if (idx === 0) staffName = 'Asistente de Recepción';
        if (idx === 1) staffName = 'Dra. Patricia Silva';
        if (idx === 2) staffName = 'Groomer Andrea Colina';
        if (idx === 3) staffName = 'Groomer Lead Mariana Colina';
        if (idx === 4) staffName = 'Groomer Lead Mariana Colina';
        if (idx === 5) staffName = 'Concierge Leia VIP';
        if (idx === 6) staffName = `Groomer Lead Mariana Colina (Entregado ${pet.deliveredAt || '04:30 PM'})`;
      }

      history.push({
        stepIndex: idx,
        name: st.name,
        staff: staffName,
        startTime: this.formatTimestamp(startTime),
        endTime: endTime ? this.formatTimestamp(endTime) : (isInProgress ? 'En progreso...' : 'Pendiente'),
        durationMinutes: isCompleted ? actualMinutes : (isInProgress ? Math.floor(actualMinutes * 0.6) : 0),
        status: isCompleted ? 'completed' : (isInProgress ? 'in_progress' : 'pending'),
        isBottleneck: actualMinutes > this.bottleneckThresholdMinutes
      });
    });

    return history;
  }

  formatTimestamp(dateObj) {
    return dateObj.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  getPeriodConfig() {
    const p = this.currentPeriod || 'today';
    let days = 1;
    let label = 'Hoy';
    let multiplier = 1;

    if (p === 'week') {
      days = 7;
      label = 'Esta Semana (Acumulado 7 Días)';
      multiplier = 5.8;
    } else if (p === 'fortnight') {
      days = 15;
      label = 'Esta Quincena (Acumulado 15 Días)';
      multiplier = 12.2;
    } else if (p === 'month') {
      days = 30;
      label = 'Este Mes (Acumulado 30 Días)';
      multiplier = 24.5;
    } else if (p === 'custom') {
      if (this.customDateFrom && this.customDateTo) {
        const diffTime = Math.abs(this.customDateTo - this.customDateFrom);
        days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      } else {
        days = 5;
      }
      label = `Personalizado (${days} Días Acumulados)`;
      multiplier = days * 0.85;
    }

    return { period: p, days, label, multiplier };
  }

  setPeriod(period, btnEl) {
    this.currentPeriod = period;

    // Actualizar estilo activo de botones
    const btns = document.querySelectorAll('.analytics-time-btn');
    btns.forEach(b => {
      b.style.background = 'rgba(255,255,255,0.1)';
      b.style.color = '#FBFBFD';
      b.style.border = '1px solid rgba(255,255,255,0.2)';
    });

    if (btnEl) {
      btnEl.style.background = '#D4AF37';
      btnEl.style.color = '#121214';
      btnEl.style.border = 'none';
    }

    const customContainer = document.getElementById('analytics-custom-date-container');
    if (customContainer) {
      customContainer.style.display = period === 'custom' ? 'flex' : 'none';
    }

    this.renderAll();

    const config = this.getPeriodConfig();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`📊 Período de Analítica actualizado: ${config.label.toUpperCase()}`, 'info');
    }
  }

  onCustomDateChange() {
    const fromVal = document.getElementById('analytics-date-from')?.value;
    const toVal = document.getElementById('analytics-date-to')?.value;
    this.customDateFrom = fromVal ? new Date(fromVal) : null;
    this.customDateTo = toVal ? new Date(toVal) : null;
    this.renderAll();
  }

  renderAll() {
    this.enrichPetsData();
    this.renderKPIs();
    this.renderStationDurationsChart();
    this.renderFamilyVolumeChart();
    this.renderTraceabilityTable();

    if (window.parametricMatrixEngine) {
      window.parametricMatrixEngine.renderMatrixUI('analytics-parametric-matrix-container');
    }
    if (window.sixSigmaTelemetryEngine) {
      window.sixSigmaTelemetryEngine.renderTelemetryLogUI('analytics-telemetry-live-container');
    }
  }

  renderKPIs() {
    const kpiAvgTime = document.getElementById('kpi-avg-time');
    const kpiTotalServices = document.getElementById('kpi-total-services');
    const kpiBottlenecks = document.getElementById('kpi-bottlenecks');
    const kpiStaffEff = document.getElementById('kpi-staff-efficiency');

    if (!window.petStatusEngine) return;
    const pets = window.petStatusEngine.pets || [];
    const config = this.getPeriodConfig();

    let totalDurationMinutes = 0;
    let completedStepsCount = 0;
    let bottleneckCount = 0;

    pets.forEach(p => {
      if (p.stepHistory) {
        p.stepHistory.forEach(h => {
          if (h.status === 'completed') {
            totalDurationMinutes += h.durationMinutes;
            completedStepsCount++;
          }
          if (h.isBottleneck) {
            bottleneckCount++;
          }
        });
      }
    });

    const baseServices = (pets.length || 8) * 3;
    const totalServicesCount = Math.round(baseServices * config.multiplier);
    const totalBottlenecksCount = Math.round((bottleneckCount || 2) * (config.multiplier * 0.7));

    let avgMinutes = completedStepsCount > 0 ? (totalDurationMinutes / completedStepsCount) : 22.4;
    if (config.period === 'week') avgMinutes -= 0.6;
    if (config.period === 'fortnight') avgMinutes += 0.7;
    if (config.period === 'month') avgMinutes -= 1.1;

    if (kpiAvgTime) kpiAvgTime.textContent = `${avgMinutes.toFixed(1)} min`;
    if (kpiTotalServices) kpiTotalServices.textContent = `${totalServicesCount} Atenciones`;
    if (kpiBottlenecks) kpiBottlenecks.textContent = `${totalBottlenecksCount} Alertas`;
    if (kpiStaffEff) kpiStaffEff.textContent = `${(97.2 - (totalBottlenecksCount * 0.2)).toFixed(1)}%`;
  }

  renderStationDurationsChart() {
    const container = document.getElementById('chart-station-durations');
    if (!container) return;

    const data = [
      { name: 'Recepción', minutes: 8, color: '#4A6B5D' },
      { name: 'Triaje / Rev.', minutes: 12, color: '#4A6B5D' },
      { name: 'Baño Spa', minutes: 26, color: '#D4AF37', isBottleneck: true },
      { name: 'Secado', minutes: 29, color: '#DC2626', isBottleneck: true },
      { name: 'Corte Grooming', minutes: 34, color: '#4A6B5D' },
      { name: 'Control Calidad', minutes: 10, color: '#4A6B5D' },
      { name: 'Entrega VIP', minutes: 6, color: '#4A6B5D' }
    ];

    const maxVal = 40;
    container.innerHTML = '';

    data.forEach(item => {
      const heightPct = Math.min(100, (item.minutes / maxVal) * 100);

      const col = document.createElement('div');
      col.style.flex = '1';
      col.style.display = 'flex';
      col.style.flexDirection = 'column';
      col.style.alignItems = 'center';
      col.style.justifyContent = 'flex-end';
      col.style.height = '100%';
      col.style.position = 'relative';

      col.innerHTML = `
        <div style="font-size:0.75rem; font-weight:900; color:${item.isBottleneck ? '#DC2626' : '#2C2C2E'}; margin-bottom:6px;">
          ${item.minutes}m ${item.isBottleneck ? '⚠️' : ''}
        </div>
        <div title="${item.name}: ${item.minutes} minutos promedio" style="width:70%; max-width:28px; height:${heightPct}%; background:${item.color}; border-radius:6px 6px 0 0; transition:height 0.6s ease; box-shadow:0 4px 12px rgba(0,0,0,0.08);"></div>
        <div style="font-size:0.68rem; font-weight:700; color:#64748B; margin-top:8px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">
          ${item.name}
        </div>
      `;

      container.appendChild(col);
    });
  }

  renderFamilyVolumeChart() {
    const container = document.getElementById('chart-family-volume');
    if (!container) return;

    const config = this.getPeriodConfig();
    const mult = config.multiplier;

    const baseData = [
      { name: 'Grooming (Estética)', baseCount: 26, color: '#D4AF37', icon: '✂️' },
      { name: 'Clínica Veterinaria', baseCount: 14, color: '#4A6B5D', icon: '🏥' },
      { name: 'Hotel VIP', baseCount: 8, color: '#2C2C2E', icon: '🏨' },
      { name: 'Tienda VIP', baseCount: 18, color: '#0284C7', icon: '🛍️' }
    ];

    const data = baseData.map(item => ({
      ...item,
      count: Math.round(item.baseCount * mult)
    }));

    const maxVal = Math.max(...data.map(d => d.count)) * 1.15;
    container.innerHTML = '';

    data.forEach(item => {
      const heightPct = Math.min(100, (item.count / maxVal) * 100);

      const col = document.createElement('div');
      col.style.flex = '1';
      col.style.display = 'flex';
      col.style.flexDirection = 'column';
      col.style.alignItems = 'center';
      col.style.justifyContent = 'flex-end';
      col.style.height = '100%';

      col.innerHTML = `
        <div style="font-size:0.78rem; font-weight:900; color:#2C2C2E; margin-bottom:6px;">
          ${item.icon} ${item.count}
        </div>
        <div title="${item.name}: ${item.count} atenciones (${config.label})" style="width:75%; max-width:36px; height:${heightPct}%; background:${item.color}; border-radius:8px 8px 0 0; transition:height 0.6s ease; box-shadow:0 4px 14px rgba(0,0,0,0.1);"></div>
        <div style="font-size:0.7rem; font-weight:800; color:#475569; margin-top:8px; text-align:center; line-height:1.2;">
          ${item.name.split(' ')[0]}
        </div>
      `;

      container.appendChild(col);
    });
  }

  renderTraceabilityTable() {
    const tbody = document.getElementById('analytics-traceability-tbody');
    if (!tbody || !window.petStatusEngine) return;

    const pets = window.petStatusEngine.pets || [];
    tbody.innerHTML = '';

    const filterText = (this.searchTerm || '').toLowerCase();
    const isStaff = window.petStatusEngine && typeof window.petStatusEngine.isStaffMode === 'function' 
      ? window.petStatusEngine.isStaffMode() 
      : true;

    let targetPets = pets;
    if (!isStaff) {
      const { activePetId, activeCustomerName } = window.petStatusEngine.getActiveCustomerInfo();
      const filteredByClient = pets.filter(pet => {
        if (activePetId && pet.id === activePetId) return true;
        if (activeCustomerName) {
          const ownerClean = (pet.ownerName || pet.owner || '').toLowerCase().trim();
          const targetClean = activeCustomerName.toLowerCase().trim();
          if (ownerClean && targetClean && (ownerClean.includes(targetClean) || targetClean.includes(ownerClean))) {
            return true;
          }
        }
        return false;
      });
      // Si no hay mascotas que coincidan con el cliente actual, mostrar el circuito general activo para evitar caja en blanco
      targetPets = filteredByClient.length > 0 ? filteredByClient : pets;
    }

    let renderedCount = 0;
    targetPets.forEach(pet => {
      if (filterText) {
        const matches = (pet.petName || '').toLowerCase().includes(filterText) ||
                        (pet.ownerName || '').toLowerCase().includes(filterText) ||
                        (pet.species || '').toLowerCase().includes(filterText);
        if (!matches) return;
      }

      const familyName = (pet.area || 'grooming').toUpperCase();
      const currentStepObj = pet.stepHistory ? pet.stepHistory[pet.stepIndex || 0] : null;
      const currentStationName = currentStepObj ? currentStepObj.name : 'En atención';
      const staffAssigned = currentStepObj ? currentStepObj.staff : 'Staff Asignado';
      const elapsedMins = currentStepObj ? currentStepObj.durationMinutes : 15;
      const isDelivered = pet.stepIndex >= 7 || pet.stepIndex >= 6;

      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #F1F5F9';
      row.style.transition = 'background 0.2s';
      row.onmouseenter = () => row.style.background = '#F8FAFC';
      row.onmouseleave = () => row.style.background = 'transparent';

      row.innerHTML = `
        <td style="padding:14px 16px; font-weight:800; color:#0F172A;">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${pet.image || 'assets/media__1787694901704.jpg'}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid #D4AF37;">
            <div>
              <div style="color:#0F172A; font-weight:800;">${pet.petName}</div>
              <div style="font-size:0.72rem; color:#64748B; font-weight:600;">${pet.species}</div>
            </div>
          </div>
        </td>
        <td style="padding:14px 16px; font-weight:700; color:#1E293B;">${pet.ownerName || 'Mariana Colina'}</td>
        <td style="padding:14px 16px;">
          <span class="badge" style="background:${familyName === 'GROOMING' ? '#FFFBE6' : '#ECFDF5'}; color:${familyName === 'GROOMING' ? '#B45309' : '#047857'}; font-weight:800; border:1px solid ${familyName === 'GROOMING' ? '#FDE68A' : '#A7F3D0'}; font-size:0.72rem;">
            ${familyName}
          </span>
        </td>
        <td style="padding:14px 16px; font-weight:800; color:#0F172A;">
          ${currentStationName}
        </td>
        <td style="padding:14px 16px; font-weight:700; color:#1E293B;">
          👤 ${staffAssigned}
        </td>
        <td style="padding:14px 16px; font-weight:900; color:${elapsedMins > 25 ? '#DC2626' : '#047857'};">
          ⏱️ ${elapsedMins} min ${elapsedMins > 25 ? '⚠️' : ''}
        </td>
        <td style="padding:14px 16px;">
          <span class="badge" style="background:${isDelivered ? '#E2E8F0' : '#FEF3C7'}; color:${isDelivered ? '#475569' : '#D97706'}; font-weight:800;">
            ${isDelivered ? '✅ Entregado' : '⚡ En Proceso'}
          </span>
        </td>
        <td style="padding:14px 16px; text-align:right;">
          <button class="btn btn-sm" onclick="analytics.openTraceabilityModal('${pet.id}')" style="background:#4A6B5D; color:white; font-weight:800; border:none; border-radius:8px; padding:6px 12px; cursor:pointer;">
            🔎 Ver Timeline
          </button>
        </td>
      `;

      tbody.appendChild(row);
      renderedCount++;
    });

    if (renderedCount === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="padding:36px 16px; text-align:center; color:#475569;">
            <div style="font-size:2rem; margin-bottom:6px;">🐾</div>
            <div style="font-size:1rem; font-weight:800; color:#0F172A; margin-bottom:4px;">No hay pacientes en proceso con el filtro actual</div>
            <div style="font-size:0.82rem; color:#64748B;">Todos los pacientes activos se encuentran al día o no coinciden con la búsqueda ingresada.</div>
          </td>
        </tr>
      `;
    }
  }

  filterTraceabilityTable(searchTerm) {
    this.searchTerm = searchTerm;
    this.renderTraceabilityTable();
  }

  getRoleLabelForStep(stepName) {
    const name = (stepName || '').toLowerCase();
    if (name.includes('recep')) return '📥 Quién lo recibió';
    if (name.includes('revis') || name.includes('triaje') || name.includes('consult')) return '🩺 Quién lo atendió';
    if (name.includes('baño') || name.includes('bano')) return '🛁 Quién lo bañó';
    if (name.includes('secad')) return '💨 Quién lo secó';
    if (name.includes('corte') || name.includes('estilo')) return '✂️ Quién lo cortó';
    if (name.includes('control') || name.includes('calidad')) return '✨ Quién inspeccionó calidad';
    if (name.includes('entreg') || name.includes('alta')) return '🚗 Quién lo entregó';
    return '👤 Colaborador responsable';
  }

  openTraceabilityModal(petId) {
    let pet = null;
    if (!petId) return;
    const cleanId = String(petId).trim().toLowerCase();

    if (window.petStatusEngine && Array.isArray(window.petStatusEngine.pets)) {
      pet = window.petStatusEngine.pets.find(p => 
        (p.id && String(p.id).toLowerCase() === cleanId) || 
        (p.petName && String(p.petName).toLowerCase().includes(cleanId)) || 
        (p.name && String(p.name).toLowerCase().includes(cleanId))
      );
    }
    if (!pet && window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
      pet = window.adminEngine.patientsStatus.find(p => 
        (p.id && String(p.id).toLowerCase() === cleanId) || 
        (p.name && String(p.name).toLowerCase().includes(cleanId)) || 
        (p.petName && String(p.petName).toLowerCase().includes(cleanId))
      );
    }
    if (!pet) return;

    const modal = document.getElementById('traceability-detail-modal');
    if (!modal) return;

    const petName = pet.petName || pet.name || 'Príncipe / Princesa';
    const petSpecies = pet.species || 'Mascota VIP';
    const ownerName = pet.ownerName || pet.owner || 'Tutor VIP';

    // Cargar información de la mascota
    document.getElementById('trace-pet-photo').src = pet.image || pet.photo || 'assets/media__1787694901704.jpg';
    document.getElementById('trace-pet-name').textContent = `${petName} (${petSpecies})`;
    document.getElementById('trace-pet-owner').textContent = ownerName;
    document.getElementById('trace-pet-area').textContent = (pet.area || 'grooming').toUpperCase();

    // Detectar si el usuario está en modo Staff o modo Cliente
    const isStaff = (window.petStatusEngine && typeof window.petStatusEngine.isStaffMode === 'function')
      ? window.petStatusEngine.isStaffMode()
      : (window.adminEngine ? window.adminEngine.viewEnvironment !== 'customer' : true);

    const history = pet.stepHistory || this.generateMockHistoryForPet(pet);

    // Ajustar encabezados del modal según el rol
    const headerBadge = document.getElementById('trace-modal-header-badge');
    if (headerBadge) {
      headerBadge.textContent = isStaff 
        ? '👑 HISTORIAL & TRAZABILIDAD OPERATIVA POR ESTACIÓN' 
        : '✨ PROCESO DEL SERVICIO & ESTADO DEL PACIENTE';
    }

    const timeLabel = document.getElementById('trace-pet-time-label');
    const totalTimeEl = document.getElementById('trace-pet-total-time');
    const timelineTitle = document.getElementById('trace-timeline-title');

    if (isStaff) {
      if (timeLabel) timeLabel.textContent = 'Tiempo Total:';
      let totalMins = 0;
      history.forEach(h => totalMins += (h.durationMinutes || 0));
      if (totalTimeEl) {
        totalTimeEl.textContent = `${totalMins} min acum.`;
        totalTimeEl.style.color = '#D4AF37';
      }
      if (timelineTitle) {
        timelineTitle.innerHTML = '📋 Circuito Operativo Estación por Estación:';
      }
    } else {
      if (timeLabel) timeLabel.textContent = 'Estatus Actual:';
      const stepsCount = history.length;
      const currentIdx = typeof pet.stepIndex === 'number' ? pet.stepIndex : 0;
      const isCompleted = currentIdx >= stepsCount - 1;
      const currentStepObj = history[currentIdx] || history[0];
      const currentStepName = currentStepObj ? currentStepObj.name : 'En Proceso';

      if (totalTimeEl) {
        if (isCompleted) {
          totalTimeEl.innerHTML = `<span style="background:#ECFDF5; color:#047857; font-size:0.75rem; font-weight:800; padding:3px 8px; border-radius:8px; border:1px solid #A7F3D0;">✅ Concluido</span>`;
        } else {
          totalTimeEl.innerHTML = `<span style="background:#FFFBE6; color:#B45309; font-size:0.75rem; font-weight:800; padding:3px 8px; border-radius:8px; border:1px solid #FDE68A;">✨ En Proceso</span>`;
        }
      }
      if (timelineTitle) {
        timelineTitle.innerHTML = '📋 Etapas del Circuito de Grooming Spa:';
      }
    }

    const timelineContainer = document.getElementById('trace-timeline-container');
    timelineContainer.innerHTML = '';

    history.forEach((step, idx) => {
      const isDone = step.status === 'completed';
      const isCurrent = step.status === 'in_progress';

      const dotColor = isDone ? '#4A6B5D' : (isCurrent ? '#D4AF37' : '#CBD5E1');

      const item = document.createElement('div');
      item.style.position = 'relative';

      if (isStaff) {
        // VISTA OPERATIVA STAFF (CONSERVADA 100% INTACTA CON MÉTRICAS, METAS Y AUDITORÍA)
        const roleLabel = this.getRoleLabelForStep(step.name);
        const targetMin = (window.adminEngine && typeof window.adminEngine.getStageTargetMinutes === 'function') 
          ? window.adminEngine.getStageTargetMinutes(pet.area, idx) 
          : 15;
        const isOverTarget = step.durationMinutes > targetMin;

        item.innerHTML = `
          <!-- Punto indicador del timeline -->
          <div style="position:absolute; left:-31px; top:2px; width:16px; height:16px; border-radius:50%; background:${dotColor}; border:3px solid #FFFFFF; box-shadow:0 0 0 2px ${dotColor};"></div>

          <div style="background:${isCurrent ? '#FFFBE6' : '#F8FAFC'}; border:1px solid ${isCurrent ? '#FDE68A' : '#E2E8F0'}; border-radius:14px; padding:14px 16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
              <div>
                <div style="font-weight:900; font-size:0.92rem; color:#2C2C2E;">
                  ${idx + 1}. ${step.name} 
                  ${isOverTarget ? `<span style="color:#DC2626; font-weight:800; font-size:0.75rem; background:#FEE2E2; padding:2px 8px; border-radius:10px; margin-left:6px;">⚠️ Excedió Meta (${step.durationMinutes}m > ${targetMin}m)</span>` : `<span style="color:#047857; font-weight:800; font-size:0.75rem; background:#ECFDF5; padding:2px 8px; border-radius:10px; margin-left:6px;">⏱️ Meta: ${targetMin}m</span>`}
                </div>
                <div style="font-size:0.82rem; color:#2C2C2E; font-weight:700; margin-top:4px; display:flex; align-items:center; gap:6px;">
                  <span style="color:#D4AF37; font-weight:800;">${roleLabel}:</span>
                  <strong style="background:#E2E8F0; padding:2px 8px; border-radius:6px; color:#1E293B;">${step.staff}</strong>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:0.82rem; font-weight:900; color:${isOverTarget ? '#DC2626' : '#4A6B5D'};">
                  ⏱️ Real: ${step.durationMinutes} min
                </div>
                <div style="font-size:0.72rem; color:#94A3B8; font-weight:700; margin-top:2px;">
                  ${step.startTime} ➔ ${step.endTime}
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // VISTA CLIENTE EXCLUSIVA (PURAMENTE CUALITATIVA, SILENT LUXURY, SIN TIEMPOS OPERATIVOS DE STAFF)
        let statusBadge = '';
        let stepCardBg = '#F8FAFC';
        let stepBorder = '#E2E8F0';
        let stepDescription = '';

        if (isDone) {
          statusBadge = `<span style="background:#ECFDF5; color:#047857; font-weight:800; font-size:0.78rem; padding:4px 12px; border-radius:20px; border:1px solid #A7F3D0; display:inline-flex; align-items:center; gap:4px;">✅ Etapa Concluida</span>`;
          stepCardBg = '#F8FAFC';
          stepBorder = '#E2E8F0';
          stepDescription = 'Atención y protocolo finalizado con éxito para esta estación.';
        } else if (isCurrent) {
          statusBadge = `<span style="background:#FFFBE6; color:#B45309; font-weight:900; font-size:0.78rem; padding:4px 12px; border-radius:20px; border:1.5px solid #FDE68A; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(217,119,6,0.15);">✨ En Curso Actualmente</span>`;
          stepCardBg = '#FFFDF5';
          stepBorder = '#FDE68A';
          stepDescription = 'Nuestros especialistas están brindando la mejor experiencia y confort a tu consentido.';
        } else {
          statusBadge = `<span style="background:#F1F5F9; color:#64748B; font-weight:700; font-size:0.75rem; padding:4px 12px; border-radius:20px; border:1px solid #E2E8F0; display:inline-flex; align-items:center; gap:4px;">⏳ Próxima Etapa</span>`;
          stepCardBg = '#F8FAFC';
          stepBorder = '#E2E8F0';
          stepDescription = 'Etapa programada dentro del circuito de atención.';
        }

        item.innerHTML = `
          <!-- Punto indicador del timeline -->
          <div style="position:absolute; left:-31px; top:16px; width:16px; height:16px; border-radius:50%; background:${dotColor}; border:3px solid #FFFFFF; box-shadow:0 0 0 2px ${dotColor};"></div>

          <div style="background:${stepCardBg}; border:1px solid ${stepBorder}; border-radius:16px; padding:16px 18px; transition:all 0.2s ease;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div>
                <div style="font-weight:900; font-size:0.96rem; color:#2C2C2E;">
                  ${idx + 1}. ${step.name}
                </div>
                <div style="font-size:0.78rem; color:#64748B; margin-top:4px; font-style:italic;">
                  ${stepDescription}
                </div>
              </div>
              <div>
                ${statusBadge}
              </div>
            </div>
          </div>
        `;
      }

      timelineContainer.appendChild(item);
    });

    if (window.app) {
      window.app.openModal('traceability-detail-modal');
    } else {
      modal.classList.add('active');
    }
  }
}

const analytics = new AnalyticsEngine();
window.analytics = analytics;

document.addEventListener('DOMContentLoaded', () => {
  analytics.init();
});
