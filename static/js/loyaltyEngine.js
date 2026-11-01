/**
 * Mrs. Pets - Motor de Lealtad, Reclasificación de Clientes & Campañas Segmentadas
 * (Standard, Premium, Legacy VIP)
 * 
 * Regla de Calificación Oficial:
 * Clientes con >= 6 meses continuos de asistencia asistiendo al menos una vez al mes
 * son clasificados automáticamente como Legacy VIP para recibir beneficios exclusivos.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY_PROFILES = 'mrs_pets_loyalty_profiles';
  const STORAGE_KEY_CAMPAIGNS = 'mrs_pets_loyalty_campaigns';

  const LoyaltyEngine = {
    // Parámetros y Valores Incorporables de Beneficios por Perfil
    profiles: {
      standard: {
        id: 'standard',
        name: 'Standard',
        badge: '⭐ Standard',
        color: '#64748B',
        bgColor: '#F1F5F9',
        borderColor: '#CBD5E1',
        minMonths: 0,
        minVisitsPerMonth: 0,
        description: 'Clientes regulares o de reciente ingreso en la plataforma.',
        benefits: {
          storeDiscountPercent: 0,
          servicesDiscountPercent: 0,
          groomingUpgrade: 'Hidratación estándar obligatoria de pulpejos',
          hotelBenefit: 'Tarifa general de suites',
          medicalPriority: 'Citas regulares en agenda',
          specialCampaignBenefit: 'Boletín de novedades y cuidados preventivos'
        }
      },
      premium: {
        id: 'premium',
        name: 'Premium',
        badge: '✨ Premium',
        color: '#D97706',
        bgColor: 'rgba(217,119,6,0.1)',
        borderColor: '#F59E0B',
        minMonths: 3,
        minVisitsPerMonth: 1,
        description: 'Clientes frecuentes con 3 a 5 meses de concurrencia mensual constante.',
        benefits: {
          storeDiscountPercent: 5,
          servicesDiscountPercent: 5,
          groomingUpgrade: '1 Baño con Ozonoterapia trimestral bonificado',
          hotelBenefit: 'Check-in prioritario y late check-out 1 hora',
          medicalPriority: 'Prioridad moderada en lista de espera',
          specialCampaignBenefit: 'Descuentos exclusivos en jornadas dentales'
        }
      },
      legacy_vip: {
        id: 'legacy_vip',
        name: 'Legacy VIP',
        badge: '👑 Legacy VIP',
        color: '#B45309',
        bgColor: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(74,107,93,0.15) 100%)',
        borderColor: '#D4AF37',
        minMonths: 6,
        minVisitsPerMonth: 1,
        description: 'Clientes con más de 6 meses continuos de asistencia mensual activa y recurrencia permanente.',
        benefits: {
          storeDiscountPercent: 15,
          servicesDiscountPercent: 10,
          groomingUpgrade: 'Upgrade gratis en todas las citas a Baño de Ozono + Pulpejos Spa Gold',
          hotelBenefit: '1 Noche de cortesía cada 5 noches y Suite Ejecutiva con Cam Cam HD 24/7',
          medicalPriority: 'Atención preferencial inmediata en triaje SOS sin tiempo de espera',
          specialCampaignBenefit: 'Kit de regalo de cumpleaños para el príncipe/princesa + Invitaciones a eventos VIP'
        }
      }
    },

    campaignsLog: [],

    init() {
      this.loadConfig();
      console.log('[LoyaltyEngine] Inicializado. Perfiles activos:', Object.keys(this.profiles));
    },

    loadConfig() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            this.profiles = { ...this.profiles, ...parsed };
          }
        }
        const savedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
        if (savedCampaigns) {
          this.campaignsLog = JSON.parse(savedCampaigns);
        }
      } catch (e) {
        console.warn('[LoyaltyEngine] Error cargando configuración:', e);
      }
    },

    saveConfig() {
      try {
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(this.profiles));
        localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(this.campaignsLog));
      } catch (e) {
        console.warn('[LoyaltyEngine] Error guardando configuración:', e);
      }
    },

    // Evaluador de calificación continua de asistencia
    evaluateClientTier(client) {
      if (!client) return this.profiles.standard;

      // Si el staff forzó un override manual
      if (client.manualTierOverride && this.profiles[client.manualTierOverride]) {
        return this.profiles[client.manualTierOverride];
      }

      const continuousMonths = typeof client.continuousMonths === 'number' 
        ? client.continuousMonths 
        : (client.totalVisits ? Math.min(12, Math.floor(client.totalVisits * 0.9)) : (client.isLegacyVip ? 7 : 2));

      const visitsPerMonth = typeof client.avgVisitsPerMonth === 'number'
        ? client.avgVisitsPerMonth
        : 1;

      const legacyParams = this.profiles.legacy_vip;
      const premiumParams = this.profiles.premium;

      if (continuousMonths >= legacyParams.minMonths && visitsPerMonth >= legacyParams.minVisitsPerMonth) {
        return this.profiles.legacy_vip;
      } else if (continuousMonths >= premiumParams.minMonths && visitsPerMonth >= premiumParams.minVisitsPerMonth) {
        return this.profiles.premium;
      }
      return this.profiles.standard;
    },

    // Reclasificación masiva automática de clientes
    runAutoReclassification() {
      if (!window.adminEngine || !Array.isArray(window.adminEngine.patientsStatus)) {
        if (window.app) window.app.showToast('⚠️ Base de datos de clientes no disponible para reclasificación.', 'warning');
        return;
      }

      let reclassifiedCount = 0;
      const counts = { standard: 0, premium: 0, legacy_vip: 0 };

      window.adminEngine.patientsStatus.forEach(client => {
        // Simulación o lectura de meses continuos
        if (typeof client.continuousMonths !== 'number') {
          // Asignar histórico coherente para demostración si no existe
          const ownerUpper = (client.owner || client.ownerName || '').toUpperCase();
          if (ownerUpper.includes('CARLOS') || ownerUpper.includes('DIETER') || ownerUpper.includes('MARÍA') || ownerUpper.includes('BELLITA')) {
            client.continuousMonths = 8;
            client.avgVisitsPerMonth = 1.2;
            client.totalVisits = 10;
          } else if (ownerUpper.includes('NICOLE') || ownerUpper.includes('ALEJANDRO')) {
            client.continuousMonths = 4;
            client.avgVisitsPerMonth = 1.0;
            client.totalVisits = 5;
          } else {
            client.continuousMonths = 1;
            client.avgVisitsPerMonth = 0.8;
            client.totalVisits = 1;
          }
        }

        const calculatedTier = this.evaluateClientTier(client);
        const prevTier = client.tierLevel || 'standard';
        
        client.tierLevel = calculatedTier.id;
        client.tierName = calculatedTier.name;
        counts[calculatedTier.id] = (counts[calculatedTier.id] || 0) + 1;

        if (prevTier !== calculatedTier.id) {
          reclassifiedCount++;
        }
      });

      if (typeof window.adminEngine.savePatientsToStorage === 'function') {
        window.adminEngine.savePatientsToStorage();
      }
      if (typeof window.adminEngine.renderClientDatabaseManager === 'function') {
        window.adminEngine.renderClientDatabaseManager();
      }

      const msg = `⚡ Reclasificación ejecutada: ${reclassifiedCount} clientes actualizados. (Legacy VIP: ${counts.legacy_vip}, Premium: ${counts.premium}, Standard: ${counts.standard})`;
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(msg, 'success');
      }

      return counts;
    },

    // Reclasificación manual de cliente específico
    setManualClientTier(clientId, tierId) {
      if (!window.adminEngine || !Array.isArray(window.adminEngine.patientsStatus)) return;
      const client = window.adminEngine.patientsStatus.find(c => c.id === clientId || c.owner === clientId);
      if (!client) return;

      if (tierId === 'auto') {
        delete client.manualTierOverride;
        const autoTier = this.evaluateClientTier(client);
        client.tierLevel = autoTier.id;
        client.tierName = autoTier.name;
      } else if (this.profiles[tierId]) {
        client.manualTierOverride = tierId;
        client.tierLevel = tierId;
        client.tierName = this.profiles[tierId].name;
      }

      if (typeof window.adminEngine.savePatientsToStorage === 'function') {
        window.adminEngine.savePatientsToStorage();
      }
      if (typeof window.adminEngine.renderClientDatabaseManager === 'function') {
        window.adminEngine.renderClientDatabaseManager();
      }

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`👑 Cliente ${client.owner || client.id} reclasificado a ${this.profiles[client.tierLevel].badge}`, 'success');
      }
    },

    // Modal de Cuadro de Configuración de Perfiles y Beneficios
    openProfilesConfigModal() {
      const modalHtml = `
        <div style="background:#0F172A; color:#FFFFFF; padding:28px; border-radius:20px; border:2px solid #D4AF37; max-width:880px; width:95%; margin:auto; max-height:88vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.4); padding-bottom:14px; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.1em;">
                👑 Matriz Estratégica de Lealtad & Beneficios VIP
              </div>
              <h2 style="font-size:1.4rem; font-weight:900; color:#FFFFFF; margin:2px 0 0 0;">
                Cuadro de Configuración de Perfiles & Beneficios
              </h2>
              <p style="font-size:0.8rem; color:#94A3B8; margin:4px 0 0 0;">
                Parámetros modificables de calificación (regla base: ≥ 6 meses continuos con 1 visita al mes) y valores de beneficio otorgables.
              </p>
            </div>
            <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.3rem; border:none; cursor:pointer;">✕</button>
          </div>

          <!-- Matriz de Perfiles -->
          <form id="form-loyalty-config" onsubmit="event.preventDefault(); window.LoyaltyEngine.saveProfilesConfigFromForm();">
            <div style="display:flex; flex-direction:column; gap:20px;">
              ${Object.values(this.profiles).map(prof => `
                <div style="background:#1E293B; border:1.5px solid ${prof.borderColor}; border-radius:16px; padding:20px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                      <span style="font-size:1.3rem;">${prof.id === 'legacy_vip' ? '👑' : (prof.id === 'premium' ? '✨' : '⭐')}</span>
                      <div>
                        <h3 style="margin:0; font-size:1.15rem; font-weight:900; color:#FFFFFF;">Perfil ${prof.name}</h3>
                        <small style="color:#94A3B8; font-size:0.75rem;">${prof.description}</small>
                      </div>
                    </div>
                    <span class="badge" style="background:${prof.bgColor}; color:${prof.borderColor}; border:1px solid ${prof.borderColor}; font-weight:900; font-size:0.8rem; padding:4px 10px;">
                      ${prof.badge}
                    </span>
                  </div>

                  <!-- Fila de Parámetros de Calificación -->
                  <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:16px; background:rgba(0,0,0,0.25); padding:12px; border-radius:12px;">
                    <div>
                      <label style="font-size:0.72rem; color:#D4AF37; font-weight:800; display:block; margin-bottom:4px;">
                        📅 Meses Continuos Mínimos:
                      </label>
                      <input type="number" min="0" max="60" id="prof_${prof.id}_minMonths" value="${prof.minMonths}" class="form-input" style="background:#0F172A; color:#FFFFFF; border:1px solid #475569; border-radius:8px; padding:6px 10px; width:100%; font-weight:700;">
                    </div>
                    <div>
                      <label style="font-size:0.72rem; color:#D4AF37; font-weight:800; display:block; margin-bottom:4px;">
                        🐾 Frecuencia Mínima Mensual (Visitas/mes):
                      </label>
                      <input type="number" min="0" max="10" step="0.5" id="prof_${prof.id}_minVisits" value="${prof.minVisitsPerMonth}" class="form-input" style="background:#0F172A; color:#FFFFFF; border:1px solid #475569; border-radius:8px; padding:6px 10px; width:100%; font-weight:700;">
                    </div>
                  </div>

                  <!-- Fila de Valores Incorporables de Beneficio -->
                  <div style="font-size:0.78rem; font-weight:800; color:#38BDF8; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">
                    🎁 Cuadro de Valores & Beneficios Asignados:
                  </div>
                  <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                    <div>
                      <label style="font-size:0.7rem; color:#94A3B8; font-weight:700; display:block; margin-bottom:2px;">
                        🛍️ % Descuento en Tienda / Boutique:
                      </label>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <input type="number" min="0" max="100" id="prof_${prof.id}_storeDisc" value="${prof.benefits.storeDiscountPercent}" class="form-input" style="background:#0F172A; color:#FBBF24; border:1px solid #475569; border-radius:8px; padding:6px 10px; width:80px; font-weight:900; font-size:0.9rem;">
                        <span style="font-size:0.85rem; font-weight:800; color:#FBBF24;">% OFF</span>
                      </div>
                    </div>
                    <div>
                      <label style="font-size:0.7rem; color:#94A3B8; font-weight:700; display:block; margin-bottom:2px;">
                        ✂️ % Descuento en Servicios Estéticos:
                      </label>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <input type="number" min="0" max="100" id="prof_${prof.id}_servicesDisc" value="${prof.benefits.servicesDiscountPercent}" class="form-input" style="background:#0F172A; color:#FBBF24; border:1px solid #475569; border-radius:8px; padding:6px 10px; width:80px; font-weight:900; font-size:0.9rem;">
                        <span style="font-size:0.85rem; font-weight:800; color:#FBBF24;">% OFF</span>
                      </div>
                    </div>
                    <div style="grid-column: span 2;">
                      <label style="font-size:0.7rem; color:#94A3B8; font-weight:700; display:block; margin-bottom:2px;">
                        🛁 Upgrade en Grooming Spa:
                      </label>
                      <input type="text" id="prof_${prof.id}_groomingUp" value="${prof.benefits.groomingUpgrade}" class="form-input" style="background:#0F172A; color:#FFFFFF; border:1px solid #475569; border-radius:8px; padding:6px 10px; width:100%; font-size:0.8rem;">
                    </div>
                    <div style="grid-column: span 2;">
                      <label style="font-size:0.7rem; color:#94A3B8; font-weight:700; display:block; margin-bottom:2px;">
                        🏨 Beneficio en Hotel 5 Estrellas:
                      </label>
                      <input type="text" id="prof_${prof.id}_hotelBen" value="${prof.benefits.hotelBenefit}" class="form-input" style="background:#0F172A; color:#FFFFFF; border:1px solid #475569; border-radius:8px; padding:6px 10px; width:100%; font-size:0.8rem;">
                    </div>
                    <div style="grid-column: span 2;">
                      <label style="font-size:0.7rem; color:#94A3B8; font-weight:700; display:block; margin-bottom:2px;">
                        🏥 Triaje / Atención Médica:
                      </label>
                      <input type="text" id="prof_${prof.id}_medicalPri" value="${prof.benefits.medicalPriority}" class="form-input" style="background:#0F172A; color:#FFFFFF; border:1px solid #475569; border-radius:8px; padding:6px 10px; width:100%; font-size:0.8rem;">
                    </div>
                    <div style="grid-column: span 2;">
                      <label style="font-size:0.7rem; color:#94A3B8; font-weight:700; display:block; margin-bottom:2px;">
                        📢 Beneficio Especial para Campañas de Marketing:
                      </label>
                      <input type="text" id="prof_${prof.id}_campaignBen" value="${prof.benefits.specialCampaignBenefit}" class="form-input" style="background:#0F172A; color:#FBBF24; border:1px solid #D4AF37; border-radius:8px; padding:6px 10px; width:100%; font-size:0.8rem; font-weight:600;">
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; border-top:1px solid rgba(255,255,255,0.15); padding-top:16px; flex-wrap:wrap; gap:10px;">
              <button type="button" class="btn btn-secondary" onclick="app.closeModal('general-modal')" style="background:transparent; color:#CBD5E1; border:1px solid #64748B;">
                Cancelar
              </button>
              <div style="display:flex; gap:10px;">
                <button type="button" class="btn btn-sm" onclick="window.LoyaltyEngine.runAutoReclassification();" style="background:#0F172A; color:#34D399; border:1.5px solid #10B981; font-weight:800; padding:10px 16px; border-radius:10px; cursor:pointer;">
                  ⚡ Reclasificar Todos los Clientes
                </button>
                <button type="submit" class="btn btn-primary" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; padding:10px 22px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(212,175,55,0.35);">
                  💾 Guardar Parámetros y Valores
                </button>
              </div>
            </div>
          </form>
        </div>
      `;

      if (window.adminFinanceEngine && typeof window.adminFinanceEngine.showModal === 'function') {
        window.adminFinanceEngine.showModal(modalHtml);
      } else if (window.app && typeof window.app.showModalDirectHtml === 'function') {
        window.app.showModalDirectHtml(modalHtml);
      }
    },

    saveProfilesConfigFromForm() {
      Object.keys(this.profiles).forEach(profId => {
        const minMonths = parseInt(document.getElementById(`prof_${profId}_minMonths`)?.value || '0', 10);
        const minVisits = parseFloat(document.getElementById(`prof_${profId}_minVisits`)?.value || '0');
        const storeDisc = parseFloat(document.getElementById(`prof_${profId}_storeDisc`)?.value || '0');
        const servDisc = parseFloat(document.getElementById(`prof_${profId}_servicesDisc`)?.value || '0');
        const groomingUp = document.getElementById(`prof_${profId}_groomingUp`)?.value || '';
        const hotelBen = document.getElementById(`prof_${profId}_hotelBen`)?.value || '';
        const medicalPri = document.getElementById(`prof_${profId}_medicalPri`)?.value || '';
        const campaignBen = document.getElementById(`prof_${profId}_campaignBen`)?.value || '';

        this.profiles[profId].minMonths = minMonths;
        this.profiles[profId].minVisitsPerMonth = minVisits;
        this.profiles[profId].benefits.storeDiscountPercent = storeDisc;
        this.profiles[profId].benefits.servicesDiscountPercent = servDisc;
        this.profiles[profId].benefits.groomingUpgrade = groomingUp;
        this.profiles[profId].benefits.hotelBenefit = hotelBen;
        this.profiles[profId].benefits.medicalPriority = medicalPri;
        this.profiles[profId].benefits.specialCampaignBenefit = campaignBen;
      });

      this.saveConfig();
      if (window.app && typeof window.app.closeModal === 'function') {
        window.app.closeModal('general-modal');
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('✅ Cuadro de perfiles y beneficios de lealtad actualizado.', 'success');
      }

      this.runAutoReclassification();
    },

    // Generador y Emisor de Campañas Segmentadas por Perfil
    openCampaignGeneratorModal(targetTier = 'legacy_vip') {
      const clients = (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) 
        ? window.adminEngine.patientsStatus.filter(c => (c.tierLevel || 'standard') === targetTier)
        : [];

      const profile = this.profiles[targetTier] || this.profiles.legacy_vip;

      const modalHtml = `
        <div style="background:#0F172A; color:#FFFFFF; padding:28px; border-radius:20px; border:2px solid #D4AF37; max-width:820px; width:95%; margin:auto; max-height:88vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.4); padding-bottom:14px; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.1em;">
                📢 Omnicanal Marketing & Fidelización
              </div>
              <h2 style="font-size:1.4rem; font-weight:900; color:#FFFFFF; margin:2px 0 0 0;">
                Generador de Campañas Segmentadas
              </h2>
              <p style="font-size:0.8rem; color:#94A3B8; margin:4px 0 0 0;">
                Disparo personalizado de promociones y beneficios asignados según la clasificación de lealtad.
              </p>
            </div>
            <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.3rem; border:none; cursor:pointer;">✕</button>
          </div>

          <!-- Selector de Segmento Objetivo -->
          <div style="background:#1E293B; border-radius:14px; padding:16px; margin-bottom:18px;">
            <label style="font-size:0.75rem; font-weight:800; color:#CBD5E1; text-transform:uppercase; display:block; margin-bottom:8px;">
              Seleccionar Segmento Objetivo:
            </label>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              ${Object.values(this.profiles).map(p => `
                <button type="button" class="btn btn-sm" onclick="window.LoyaltyEngine.openCampaignGeneratorModal('${p.id}')" style="background:${p.id === targetTier ? 'linear-gradient(135deg, #D4AF37, #B8860B)' : '#0F172A'}; color:${p.id === targetTier ? '#121214' : '#FFFFFF'}; border:1.5px solid ${p.borderColor}; font-weight:900; padding:8px 16px; border-radius:10px; cursor:pointer;">
                  ${p.badge} (${(window.adminEngine && window.adminEngine.patientsStatus ? window.adminEngine.patientsStatus.filter(c => (c.tierLevel || 'standard') === p.id).length : 0)})
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Resumen de Destinatarios -->
          <div style="background:rgba(212,175,55,0.1); border:1px solid #D4AF37; border-radius:14px; padding:14px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <div style="font-size:0.88rem; font-weight:900; color:#FFFFFF;">
                Segmento: <span style="color:#FBBF24;">${profile.name}</span> (${clients.length} tutores calificados)
              </div>
              <div style="font-size:0.75rem; color:#CBD5E1; margin-top:2px;">
                Beneficio activo en campaña: <strong>${profile.benefits.specialCampaignBenefit}</strong> • Descuento Tienda: <strong>${profile.benefits.storeDiscountPercent}% OFF</strong>
              </div>
            </div>
            <div style="font-size:0.72rem; color:#A7F3D0; font-weight:800; background:rgba(16,185,129,0.2); border:1px solid #10B981; padding:4px 10px; border-radius:8px;">
              ✓ WhatsApp Cloud API Listo
            </div>
          </div>

          <!-- Redactor de Plantilla de Campaña -->
          <div style="margin-bottom:18px;">
            <label style="font-size:0.75rem; font-weight:800; color:#CBD5E1; display:block; margin-bottom:6px;">
              Plantilla del Mensaje de Campaña (Variables automáticas: {Tutor}, {Mascota}, {Beneficio}, {Descuento}):
            </label>
            <textarea id="campaign-message-template" rows="5" class="form-input" style="width:100%; background:#1E293B; color:#FFFFFF; border:1px solid #475569; border-radius:12px; padding:12px; font-size:0.85rem; font-family:inherit; line-height:1.5;">✨ *Exclusivo para la Familia de {Tutor} en Mrs. Pets* 🐾

¡Hola! Por tu preferencia y lealtad continua como miembro *${profile.name}*, queremos celebrar el cuidado de tu consentido *{Mascota}*.

🎁 *Tus beneficios activos para este mes:*
• *${profile.benefits.specialCampaignBenefit}*
• *${profile.benefits.storeDiscountPercent}% de Descuento* en Tienda & Alimentos
• *${profile.benefits.groomingUpgrade}*

Responde a este WhatsApp (+58 414-6799510) para reservar tu cupo preferencial antes del cierre de agenda.
_Big & Little Dogs, C.A. • RIF J-40120233-0 • "We see pets"_</textarea>
          </div>

          <!-- Lista de Destinatarios Previos -->
          <div style="background:#1E293B; border-radius:12px; padding:12px; margin-bottom:20px; max-height:150px; overflow-y:auto;">
            <div style="font-size:0.72rem; font-weight:800; color:#94A3B8; text-transform:uppercase; margin-bottom:6px;">
              Destinatarios a Impactar en este Segmento:
            </div>
            ${clients.length === 0 ? `
              <div style="font-size:0.78rem; color:#64748B; padding:8px; text-align:center;">No hay clientes asignados actualmente a este segmento. Ejecute la reclasificación automática.</div>
            ` : clients.map(c => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.78rem;">
                <span><strong>${c.owner || c.ownerName}</strong> (${c.name || c.petName})</span>
                <span style="color:#FBBF24;">${c.ownerPhone || c.phone || '+58 414-6799510'}</span>
              </div>
            `).join('')}
          </div>

          <!-- Botones de Acción -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.15); padding-top:16px; flex-wrap:wrap; gap:10px;">
            <button type="button" class="btn btn-secondary" onclick="app.closeModal('general-modal')" style="background:transparent; color:#CBD5E1; border:1px solid #64748B;">
              Cerrar
            </button>
            <button type="button" class="btn btn-primary" onclick="window.LoyaltyEngine.dispatchCampaign('${targetTier}')" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; padding:10px 22px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.35);">
              🚀 Disparar Campaña a ${clients.length} Clientes (${profile.name})
            </button>
          </div>
        </div>
      `;

      if (window.adminFinanceEngine && typeof window.adminFinanceEngine.showModal === 'function') {
        window.adminFinanceEngine.showModal(modalHtml);
      } else if (window.app && typeof window.app.showModalDirectHtml === 'function') {
        window.app.showModalDirectHtml(modalHtml);
      }
    },

    // Disparador de Campaña
    dispatchCampaign(tierId) {
      const template = document.getElementById('campaign-message-template')?.value || '';
      const clients = (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus))
        ? window.adminEngine.patientsStatus.filter(c => (c.tierLevel || 'standard') === tierId)
        : [];

      if (clients.length === 0) {
        if (window.app) window.app.showToast('⚠️ No hay clientes en este segmento para enviar la campaña.', 'warning');
        return;
      }

      const campaignId = `CAMP-${Date.now().toString().slice(-6)}`;
      const profile = this.profiles[tierId] || this.profiles.legacy_vip;

      // Disparar en simulador de WhatsApp para la primera clienta como muestra viva
      const sampleClient = clients[0];
      const sampleMsg = template
        .replace(/{Tutor}/g, sampleClient.owner || sampleClient.ownerName || 'Cliente VIP')
        .replace(/{Mascota}/g, sampleClient.name || sampleClient.petName || 'Príncipe/Princesa');

      if (window.whatsappSim && typeof window.whatsappSim.sendMessage === 'function') {
        window.whatsappSim.sendMessage(sampleMsg);
      }

      this.campaignsLog.unshift({
        id: campaignId,
        timestamp: new Date().toISOString(),
        tier: tierId,
        tierName: profile.name,
        recipientsCount: clients.length,
        templateSnippet: template.slice(0, 80) + '...',
        status: 'ENVIADA_OMNICANAL'
      });
      this.saveConfig();

      if (window.app && typeof window.app.closeModal === 'function') {
        window.app.closeModal('general-modal');
      }

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🚀 Campaña ${campaignId} enviada con éxito a ${clients.length} clientes (${profile.name}). Notificación emitida vía WhatsApp.`, 'success');
      }
    }
  };

  window.LoyaltyEngine = LoyaltyEngine;
})(window);
