/**
 * ============================================================================
 * LIMUSINA VIP & PET CHAUFFEUR PLATFORM ENGINE
 * Mrs. Pets — Big & Little Dogs, C.A. • RIF J-40120233-0 • Maracaibo, Venezuela
 * 
 * Plataforma ejecutiva de contacto directo por WhatsApp con choferes certificados
 * y empresas de servicio autorizadas y aprobadas por la gerencia.
 * ============================================================================
 */

(function (window) {
  'use strict';

  class LimusinaVipEngine {
    constructor() {
      this.activeFilterType = 'all';
      this.activeFilterSector = 'all';

      this.defaultDrivers = [
        {
          id: 'carlos-mendoza',
          name: 'Carlos Mendoza',
          role: 'Chofer VIP Senior & Asistente Técnico Veterinario',
          vehicle: 'Mercedes-Benz Sprinter VIP Bioclimática',
          plates: 'A89CB4V',
          sector: 'El Milagro',
          phone: '+584146799510',
          cleanPhone: '584146799510',
          rating: '5.0',
          trips: 148,
          status: 'DISPONIBLE AHORA',
          statusClass: 'status-online',
          statusColor: '#10B981',
          type: 'private',
          avatar: '👨‍✈️',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
          approval: 'Aprobado por Gerencia General (C.I. V-18.492.110)',
          features: [
            'Cabina bioclimática con oxigenoterapia portátil',
            'Rampa hidráulica suave para movilidad reducida',
            'Ambientación musical calmante (Frecuencia 432 Hz)',
            'Certificación en RCP y primeros auxilios caninos/felinos'
          ]
        },
        {
          id: 'javier-villalobos',
          name: 'Javier Villalobos',
          role: 'Pet Chauffeur Especialista en Razas Grandes / Gigantes',
          vehicle: 'Chevrolet Suburban Royal Dark Luxury',
          plates: 'AB302MK',
          sector: 'Las Delicias',
          phone: '+584246109922',
          cleanPhone: '584246109922',
          rating: '4.9',
          trips: 96,
          status: 'DISPONIBLE AHORA',
          statusClass: 'status-online',
          statusColor: '#10B981',
          type: 'private',
          avatar: '👨‍✈️',
          photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
          approval: 'Aprobado por Gerencia (C.I. V-15.820.334 • RIF Verificado)',
          features: [
            'Doble aire acondicionado industrial de alta potencia',
            'Separadores de impacto acolchados ISOFIX',
            'Especialista en Gran Danés, Rottweiler, Golden Retriever',
            'Desinfección biológica UV tras cada traslado'
          ]
        },
        {
          id: 'mariangel-rincon',
          name: 'Mariangel Rincón',
          role: 'Pet Chauffeur & Cuidados Geriátricos / Felinos',
          vehicle: 'Toyota Fortuner Diamond White',
          plates: 'AF881DV',
          sector: 'La Lago',
          phone: '+584120783344',
          cleanPhone: '584120783344',
          rating: '5.0',
          trips: 112,
          status: 'DISPONIBLE AHORA',
          statusClass: 'status-online',
          statusColor: '#10B981',
          type: 'private',
          avatar: '👩‍✈️',
          photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
          approval: 'Aprobada por Gerencia (C.I. V-22.140.785 • Fear-Free Certified)',
          features: [
            'Transportines térmicos acolchados con vista panorámica',
            'Difusor ambiental de feromonas Feliway / Adaptil',
            'Suspensión hidroneumática extra suave para mascotas con artritis',
            'Protocolo anti-estrés felino estricto'
          ]
        },
        {
          id: 'roberto-morales',
          name: 'Roberto Morales',
          role: 'Chofer VIP Nocturno & Guardias de Fin de Semana',
          vehicle: 'Ford Explorer Titanium Executive',
          plates: 'AG401KL',
          sector: 'Bella Vista',
          phone: '+584146332211',
          cleanPhone: '584146332211',
          rating: '4.9',
          trips: 84,
          status: 'DE GUARDIA 24/7',
          statusClass: 'status-guard',
          statusColor: '#F59E0B',
          type: 'private',
          avatar: '👨‍✈️',
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
          approval: 'Aprobado por Gerencia (C.I. V-17.904.551)',
          features: [
            'Disponibilidad ininterrumpida nocturna y domingos',
            'Trazabilidad satelital GPS en tiempo real para el tutor',
            'Botiquín de estabilización móvil de emergencias',
            'Conexión directa con la clínica central Mrs. Pets'
          ]
        }
      ];

      this.defaultCompanies = [
        {
          id: 'transpet-express',
          name: 'TransPet Maracaibo Express C.A.',
          rif: 'J-41289012-3',
          role: 'Empresa Certificada de Logística y Traslado Animal',
          fleet: '4 Vans Ejecutivas Climatizadas con Telemetría GPS',
          sector: 'Gran Maracaibo',
          phone: '+584146799510',
          cleanPhone: '584146799510',
          status: 'EMPRESA APROBADA POR GERENCIA',
          statusColor: '#D4AF37',
          type: 'company',
          avatar: '🏢',
          photo: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=300&auto=format&fit=crop&q=80',
          approval: 'Convenio Corporativo Vigente • Gerencia General Mrs. Pets',
          features: [
            'Capacidad para traslados múltiples y familias de mascotas',
            'Rutas regulares de recogida matutina y entrega vespertina',
            'Cobertura: Maracaibo, San Francisco y Aeropuerto La Chinita',
            'Seguro de responsabilidad civil y póliza de traslado veterinario'
          ]
        },
        {
          id: 'vip-pet-ride',
          name: 'VIP Pet Ride Venezuela (División Zulia)',
          rif: 'J-50143890-1',
          role: 'Servicio Concierge de Movilidad para Mascotas',
          fleet: 'Flota de SUVs Híbridas con Blindaje Térmico',
          sector: 'Maracaibo Norte / Lago',
          phone: '+584246001122',
          cleanPhone: '584246001122',
          status: 'EMPRESA APROBADA POR GERENCIA',
          statusColor: '#D4AF37',
          type: 'company',
          avatar: '🚘',
          photo: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80',
          approval: 'Homologación Gerencial ISO-Pet Transport Zulia',
          features: [
            'Filtros de aire HEPA de grado hospitalario en cabina',
            'Agua mineral ozonizada e hidratación durante trayectos largos',
            'Traslados ejecutivos puerta a puerta con chofer de traje corporativo',
            'Cobertura extendida: Isla Dorada, El Milagro, Club Náutico, Costa Oriental'
          ]
        },
        {
          id: 'ambupet-urgencias',
          name: 'AmbuPet 24/7 Urgencias Móviles',
          rif: 'J-31089455-0',
          role: 'Unidad de Ambulancia y Soporte Vital Veterinario Móvil',
          fleet: '2 Ambulancias Tipo III con Chofer Paramédico Veterinario',
          sector: 'Gran Maracaibo',
          phone: '+584149998877',
          cleanPhone: '584149998877',
          status: 'RED DE EMERGENCIAS APROBADA',
          statusColor: '#EF4444',
          type: 'company',
          avatar: '🚨',
          photo: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=300&auto=format&fit=crop&q=80',
          approval: 'Convenio de Código Rojo Clínico Mrs. Pets',
          features: [
            'Soporte de oxígeno continuo y monitor multiparámetro en ruta',
            'Camilla articulada de rescate para perros de hasta 90 kg',
            'Traslado prioritario de urgencias hacia la Clínica Central El Milagro',
            'Tripulación de chofer profesional + enfermero veterinario de guardia'
          ]
        }
      ];
      this.storageKeyCompanies = 'mrs_pets_transport_companies';
      this.storageKeyCustomDrivers = 'mrs_pets_custom_chauffeurs';
      this.companies = [];
      this.telemetryDrivers = [];
      this.currentActiveDriverId = 'carlos-mendoza';
      this.watchPositionId = null;
    }

    init() {
      this.loadCustomDrivers();
      this.loadCompanies();
      this.syncDriversFromBackend();
      this.renderPlatform();
      console.log('[LimusinaVipEngine] Inicializada plataforma de Choferes VIP & Empresas por WhatsApp con Telemetría GPS.');
    }

    loadCustomDrivers() {
      try {
        const savedDrivers = localStorage.getItem(this.storageKeyCustomDrivers);
        if (savedDrivers) {
          const parsed = JSON.parse(savedDrivers);
          if (Array.isArray(parsed)) {
            this.customDrivers = parsed;
          }
        }
      } catch (e) {
        console.warn('Error loading custom chauffeurs:', e);
      }
    }

    loadCompanies() {
      try {
        const saved = localStorage.getItem(this.storageKeyCompanies);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.companies = parsed;
          }
        }
      } catch (e) {
        console.warn('Error loading transport companies from localStorage:', e);
      }

      // Si no existe nada en localStorage, inicializar con la semilla por defecto
      if (!this.companies || this.companies.length === 0) {
        this.companies = JSON.parse(JSON.stringify(this.defaultCompanies));
        this.saveCompanies();
      }

      // Sincronización asíncrona en segundo plano con el servidor
      this.syncCompaniesFromBackend();
    }

    async syncCompaniesFromBackend() {
      if (typeof fetch === 'undefined') return;
      try {
        const res = await fetch('/api/v1/limusina/companies');
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'success' && Array.isArray(data.companies) && data.companies.length > 0) {
            this.companies = data.companies;
            this.saveCompanies();
            const container = document.getElementById('limusina-vip-content-container');
            if (container && container.innerHTML.trim() !== '') {
              this.renderPlatform();
            }
          }
        }
      } catch (err) {
        // Modo offline / sandboxed
      }
    }

    async syncDriversFromBackend() {
      if (typeof fetch === 'undefined') return;
      try {
        const res = await fetch('/api/v1/misipet/drivers');
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'success' && Array.isArray(data.drivers) && data.drivers.length > 0) {
            this.telemetryDrivers = data.drivers;
            const container = document.getElementById('limusina-vip-content-container');
            if (container && container.innerHTML.trim() !== '') {
              this.renderPlatform();
            }
          }
        }
      } catch (err) {
        console.warn('Error syncing drivers telemetry from server:', err);
      }
    }

    saveCompanies() {
      try {
        localStorage.setItem(this.storageKeyCompanies, JSON.stringify(this.companies));
      } catch (e) {
        console.error('Error saving transport companies:', e);
      }
    }

    canRestoreDefaults() {
      if (!this.companies || this.companies.length === 0) return true;
      const currentIds = this.companies.map(c => c.id);
      return this.defaultCompanies.some(def => !currentIds.includes(def.id));
    }

    restoreDefaultCompanies() {
      this.companies = JSON.parse(JSON.stringify(this.defaultCompanies));
      this.saveCompanies();

      if (typeof fetch !== 'undefined') {
        for (const comp of this.companies) {
          fetch('/api/v1/limusina/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comp)
          }).catch(() => {});
        }
      }

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔄 Convenios autorizados de fábrica restaurados con éxito.', 'success');
      }
      this.renderPlatform();
    }

    getAllDrivers() {
      const baseDrivers = (this.telemetryDrivers && this.telemetryDrivers.length > 0) ? this.telemetryDrivers : this.defaultDrivers;
      const custom = this.customDrivers || [];
      const baseIds = new Set(baseDrivers.map(d => d.id));
      const filteredCustom = custom.filter(c => !baseIds.has(c.id));
      return [...baseDrivers, ...filteredCustom];
    }

    getAllCompanies() {
      if (!this.companies || this.companies.length === 0) {
        this.loadCompanies();
      }
      return (this.companies && this.companies.length > 0) ? this.companies : this.defaultCompanies;
    }

    openLimusinaPlatform() {
      if (window.app && typeof window.app.switchTab === 'function') {
        window.app.switchTab('limusina-vip');
      }
      this.renderPlatform();
      setTimeout(() => {
        const platformEl = document.getElementById('tab-limusina-vip');
        if (platformEl) {
          platformEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
    }

    contactDriverWhatsApp(driverId, customNotes = '') {
      const all = [...this.getAllDrivers(), ...this.getAllCompanies()];
      const target = all.find(item => item.id === driverId);

      const phone = target ? target.cleanPhone : '584146799510';
      const name = target ? target.name : 'Chofer VIP Mrs. Pets';
      const vehicle = target ? (target.vehicle || target.fleet || 'Limusina VIP') : 'Limusina VIP';

      // Pre-cargar datos del tutor si existen en authEngine
      let tutorName = 'Cliente VIP';
      let petName = 'mi mascota';
      if (window.authEngine && window.authEngine.currentUser) {
        tutorName = window.authEngine.currentUser.name || 'Cliente VIP';
        if (window.authEngine.currentUser.pets && window.authEngine.currentUser.pets.length > 0) {
          petName = window.authEngine.currentUser.pets[0].name || 'mi mascota';
        }
      }

      const messageText = `👑 *SOLICITUD DE TRASLADO LIMUSINA VIP & PET CHAUFFEUR*\n` +
        `-----------------------------------------\n` +
        `Estimado(a) *${name}*,\n\n` +
        `Le contacto a través de la plataforma oficial de *Mrs. Pets Maracaibo* (Avenida 2 El Milagro) para coordinar un traslado exclusivo con Chofer Aprobado por Gerencia.\n\n` +
        `📋 *Detalles del Servicio:*\n` +
        `• *Tutor Solicitante:* ${tutorName}\n` +
        `• *Mascota:* ${petName}\n` +
        `• *Unidad Asignada:* ${vehicle}\n` +
        `• *Notas Especiales:* ${customNotes || 'Coordinar horario de recogida y sector en Maracaibo.'}\n\n` +
        `Agradezco me confirme su disponibilidad inmediata para activar el protocolo de Limusina VIP. ¡Muchas gracias! ✨🐾`;

      const encoded = encodeURIComponent(messageText);
      const waUrl = `https://wa.me/${phone}?text=${encoded}`;

      // 1. Abrir en WhatsApp Real
      window.open(waUrl, '_blank');

      // 2. Sincronizar en el Simulador de WhatsApp de la plataforma para experiencia omnicanal completa
      if (window.whatsappSim && typeof window.whatsappSim.sendMessage === 'function') {
        window.whatsappSim.sendMessage(`[SOLICITUD LIMUSINA VIP]: Hola ${name}, solicito coordinar recogida en Limusina VIP para ${petName}.`);
      }

      // 3. Notificación Toast
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🚘 Conectando por WhatsApp con ${name} (${target?.sector || 'Maracaibo'})...`, 'success');
      }
    }

    testInWhatsAppSimulator(driverId) {
      const all = [...this.getAllDrivers(), ...this.getAllCompanies()];
      const target = all.find(item => item.id === driverId);
      const name = target ? target.name : 'Chofer VIP';

      if (window.whatsappSim && typeof window.whatsappSim.sendMessage === 'function') {
        window.whatsappSim.sendMessage(`Hola Leia, deseo coordinar con ${name} el traslado en Limusina VIP.`);
        if (window.app && typeof window.app.switchTab === 'function') {
          window.app.switchTab('playground');
        }
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`💬 Mensaje enviado al Simulador de WhatsApp para ${name}`, 'success');
        }
      } else {
        this.contactDriverWhatsApp(driverId);
      }
    }

    dispatchQuickBooking(event) {
      if (event && event.preventDefault) event.preventDefault();

      const tutorName = document.getElementById('lim-tutor-name')?.value?.trim() || 'Tutor VIP';
      const petName = document.getElementById('lim-pet-name')?.value?.trim() || 'Mascota';
      const driverSelect = document.getElementById('lim-driver-select')?.value || 'carlos-mendoza';
      const sector = document.getElementById('lim-sector-select')?.value || 'El Milagro';
      const destination = document.getElementById('lim-destination')?.value?.trim() || 'Sede Principal Mrs. Pets (Av. 2 El Milagro)';
      const notes = document.getElementById('lim-notes')?.value?.trim() || '';

      const compositeNotes = `Sector de Recogida: ${sector} | Destino: ${destination}${notes ? ' | Observaciones: ' + notes : ''}`;

      this.contactDriverWhatsApp(driverSelect, compositeNotes);
    }

    filterDrivers(type, btnElement) {
      this.activeFilterType = type;
      if (btnElement && btnElement.parentNode) {
        btnElement.parentNode.querySelectorAll('button').forEach(b => {
          b.style.background = '#f8fafc';
          b.style.color = '#64748b';
        });
        btnElement.style.background = '#D4AF37';
        btnElement.style.color = '#121214';
      }
      this.renderPlatform();
    }

    renderPlatform() {
      const container = document.getElementById('limusina-vip-content-container');
      if (!container) return;

      const drivers = this.getAllDrivers();
      const companies = this.getAllCompanies();

      const filteredDrivers = this.activeFilterType === 'companies' ? [] : drivers;
      const filteredCompanies = this.activeFilterType === 'drivers' ? [] : companies;

      const driverOptionsHtml = drivers.map(d => 
        `<option value="${d.id}">${d.name} — ${d.vehicle || 'Vehículo VIP'} (${d.sector})</option>`
      ).join('');

      const companyOptionsHtml = companies.map(c => 
        `<option value="${c.id}">🏢 ${c.name} (${c.fleet} - ${c.sector})</option>`
      ).join('');

      let html = `
        <!-- HEADER METRICS & BANNER -->
        <div style="background:linear-gradient(135deg, #111827 0%, #070a11 100%); border:1.5px solid #D4AF37; border-radius:24px; padding:28px; box-shadow:0 12px 36px rgba(0,0,0,0.25); margin-bottom:28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:56px; height:56px; border-radius:18px; background:linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05)); border:1.5px solid #D4AF37; display:flex; align-items:center; justify-content:center; font-size:2rem;">
                🚘
              </div>
              <div>
                <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.12em;">
                  RED OFICIAL DE TRASLADO EJECUTIVO BIOCLIMÁTICO • MARACAIBO
                </div>
                <h2 style="font-size:1.6rem; font-weight:900; color:#ffffff; margin:4px 0 0 0;">
                  Limusina VIP & Plataforma de Pet Chauffeurs Aprobados
                </h2>
                <p style="font-size:0.85rem; color:#94A3B8; margin:6px 0 0 0; max-width:760px; line-height:1.45;">
                  Contacte directamente por <b>WhatsApp</b> con nuestra flota de choferes privados certificados y empresas de servicio aliadas aprobadas por la gerencia para traslados con monitoreo GPS, cabinas esterilizadas y protocolo sanitario.
                </p>
              </div>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <a href="https://wa.me/584146799510?text=Hola%20Central%20Mrs.%20Pets%2C%20deseo%20asistencia%20inmediata%20para%20despacho%20de%20Limusina%20VIP." target="_blank" rel="noopener noreferrer" class="btn" style="background:#25D366; color:white; font-weight:800; border-radius:14px; padding:12px 18px; display:inline-flex; align-items:center; gap:8px; text-decoration:none; box-shadow:0 4px 14px rgba(37,211,102,0.3);">
                💬 Central WhatsApp (+58 414-6799510)
              </a>
              <button type="button" class="btn" id="btn-driver-self-reg" onclick="limusinaVipEngine.openDriverSelfRegisterModal()" style="background:linear-gradient(135deg, #10B981, #059669); border:1.5px solid #34D399; color:#ffffff; font-weight:800; border-radius:14px; padding:12px 18px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(16,185,129,0.35);">
                📱 Auto-Registro Chofer & GPS
              </button>
              <button type="button" class="btn" id="btn-driver-cockpit" onclick="limusinaVipEngine.openDriverCockpitModal()" style="background:linear-gradient(135deg, #1E293B, #0F172A); border:1.5px solid #38BDF8; color:#38BDF8; font-weight:800; border-radius:14px; padding:12px 18px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(56,189,248,0.25);">
                🛰️ Cockpit Chofer & GPS
              </button>
              <button type="button" class="btn" id="btn-create-company-top" onclick="limusinaVipEngine.openNewCompanyModal()" style="background:linear-gradient(135deg, #4A6B5D, #2D433A); border:1.5px solid #6ee7b7; color:#ffffff; font-weight:800; border-radius:14px; padding:12px 18px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(74,107,93,0.35);">
                🏢 Crear Convenio Aliado
              </button>
              <button type="button" class="btn" onclick="limusinaVipEngine.openNewDriverModal()" style="background:rgba(212,175,55,0.15); border:1.5px solid #D4AF37; color:#D4AF37; font-weight:800; border-radius:14px; padding:12px 18px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                ➕ Registrar Chofer VIP
              </button>
            </div>
          </div>

          <!-- STATUS PILLS BAR -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-top:24px; padding-top:20px; border-top:1px solid rgba(212,175,55,0.2);">
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px 16px;">
              <div style="font-size:0.7rem; color:#94A3B8; font-weight:700;">FLOTA ACTIVA EN MARACAIBO</div>
              <div style="font-size:1.15rem; font-weight:900; color:#10B981; margin-top:2px;">● 8 Unidades Certificadas</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px 16px;">
              <div style="font-size:0.7rem; color:#94A3B8; font-weight:700;">TIEMPO DE RESPUESTA WHATSAPP</div>
              <div style="font-size:1.15rem; font-weight:900; color:#D4AF37; margin-top:2px;">⚡ Menos de 3 Minutos</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px 16px;">
              <div style="font-size:0.7rem; color:#94A3B8; font-weight:700;">ESTADO DE APROBACIÓN GERENCIAL</div>
              <div style="font-size:1.15rem; font-weight:900; color:#ffffff; margin-top:2px;">🛡️ 100% Homologado</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px 16px;">
              <div style="font-size:0.7rem; color:#94A3B8; font-weight:700;">CALIFICACIÓN PROMEDIO TUTORES</div>
              <div style="font-size:1.15rem; font-weight:900; color:#EBA937; margin-top:2px;">⭐ 5.0 / 5.0 (Excelente)</div>
            </div>
          </div>
        </div>

        <!-- FORMULARIO RÁPIDO DE DESPACHO INMEDIATO -->
        <div style="background:#ffffff; border:1.5px solid #D4AF37; border-radius:24px; padding:26px; box-shadow:0 6px 24px rgba(0,0,0,0.04); margin-bottom:32px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px;">
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.08em;">
                DESPACHO DIRECTO CON 1 CLIC
              </div>
              <h3 style="font-size:1.3rem; font-weight:900; color:#1e293b; margin:2px 0 0 0;">
                ⚡ Solicitar Pet Chauffeur por WhatsApp
              </h3>
            </div>
            <span class="badge" style="background:rgba(37,211,102,0.15); color:#16a34a; font-weight:800; border:1px solid #16a34a; padding:6px 14px; border-radius:20px; font-size:0.78rem;">
              ● WhatsApp Link Builder Activo
            </span>
          </div>

          <form onsubmit="limusinaVipEngine.dispatchQuickBooking(event)">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:6px;">1. Nombre del Tutor *</label>
                <input type="text" id="lim-tutor-name" class="form-input" placeholder="Ej. Valentina Morales" style="width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid #cbd5e1;" required>
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:6px;">2. Nombre de la Mascota *</label>
                <input type="text" id="lim-pet-name" class="form-input" placeholder="Ej. Bruno (Golden Retriever)" style="width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid #cbd5e1;" required>
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:6px;">3. Chofer o Empresa Preferida *</label>
                <select id="lim-driver-select" class="form-input" onchange="limusinaVipEngine.updateSelectedDriverCard(this.value)" style="width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid #cbd5e1;">
                  <optgroup label="👨‍✈️ Choferes VIP Aprobados">
                    ${driverOptionsHtml}
                  </optgroup>
                  <optgroup label="🏢 Empresas de Servicios Aliadas (Convenios)">
                    ${companyOptionsHtml}
                  </optgroup>
                </select>
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:6px;">4. Sector de Recogida en Maracaibo *</label>
                <select id="lim-sector-select" class="form-input" style="width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid #cbd5e1;">
                  <optgroup label="📍 Núcleo Central (Core)">
                    <option value="El Milagro" selected>El Milagro (Sede Mrs. Pets • Core Central - 1500m)</option>
                    <option value="La Lago">La Lago (Residencial Alta - 1100m)</option>
                    <option value="Tierra Negra">Tierra Negra (Residencial / Comercial - 1000m)</option>
                  </optgroup>
                  <optgroup label="🏬 Eje Comercial y Tradicional">
                    <option value="Bella Vista">Bella Vista (Corredor Principal - 1500m)</option>
                    <option value="5 de Julio">5 de Julio (Comercial - 1200m)</option>
                    <option value="Santa Lucía">Santa Lucía (Histórico / Residencial - 1400m)</option>
                  </optgroup>
                  <optgroup label="🧭 Norte y Expansión">
                    <option value="Juana de Ávila">Juana de Ávila (Residencial Norte - 1800m)</option>
                    <option value="La Rita Norte">La Rita Norte (Expansión Periférica - 2000m)</option>
                  </optgroup>
                  <optgroup label="🌐 Sectores Complementarios & Metrópolis">
                    <option value="Las Delicias">Sector Las Delicias (Corredor Médico)</option>
                    <option value="Indio Mara">Sector Indio Mara</option>
                    <option value="San Francisco">Municipio San Francisco</option>
                    <option value="Aeropuerto La Chinita">Aeropuerto Internacional La Chinita</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <!-- TARJETA DINÁMICA DE IDENTIFICACIÓN VISUAL DEL CHOFER SELECCIONADO PARA EL CLIENTE -->
            <div id="lim-selected-driver-identity-box" style="margin-top:16px; background:linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02)); border:1.5px solid #D4AF37; border-radius:14px; padding:14px 18px; display:flex; align-items:center; gap:16px; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
              <!-- Inyectado dinámicamente por updateSelectedDriverCard -->
            </div>

            <div style="display:grid; grid-template-columns:2fr 1fr; gap:16px; margin-top:16px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:6px;">5. Destino del Traslado</label>
                <input type="text" id="lim-destination" class="form-input" value="Sede Principal Mrs. Pets (Av. 2 El Milagro)" style="width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid #cbd5e1;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:6px;">6. Notas / Requerimientos</label>
                <input type="text" id="lim-notes" class="form-input" placeholder="Ej. A/C frío, perro nervioso" style="width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid #cbd5e1;">
              </div>
            </div>

            <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:12px;">
              <button type="submit" class="btn" style="background:#25D366; color:white; font-weight:900; font-size:0.95rem; border-radius:12px; padding:12px 24px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 14px rgba(37,211,102,0.35);">
                💬 Despachar Limusina por WhatsApp Ahora ➔
              </button>
            </div>
          </form>
        </div>

        <!-- FILTROS DE CATEGORÍA -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn btn-sm" onclick="limusinaVipEngine.filterDrivers('all', this)" style="background:#D4AF37; color:#121214; font-weight:800; border-radius:10px; padding:8px 16px; border:none; cursor:pointer;">
              🚘 Todos los Servicios (${drivers.length + companies.length})
            </button>
            <button type="button" class="btn btn-sm" onclick="limusinaVipEngine.filterDrivers('drivers', this)" style="background:#f8fafc; color:#64748b; font-weight:800; border-radius:10px; padding:8px 16px; border:1px solid #cbd5e1; cursor:pointer;">
              👨‍✈️ Choferes VIP Aprobados (${drivers.length})
            </button>
            <button type="button" class="btn btn-sm" onclick="limusinaVipEngine.filterDrivers('companies', this)" style="background:#f8fafc; color:#64748b; font-weight:800; border-radius:10px; padding:8px 16px; border:1px solid #cbd5e1; cursor:pointer;">
              🏢 Empresas de Servicio Aliadas (${companies.length})
            </button>
          </div>
          <div style="font-size:0.8rem; color:#64748b;">
            💡 Todos los traslados incluyen <b>Supervisión Satelital & Protocolo Sanitario BioTracker</b>
          </div>
        </div>

        <!-- SECCIÓN 1: CHOFERES VIP INDIVIDUALES -->
        ${filteredDrivers.length > 0 ? `
          <div style="margin-bottom:32px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
              <span style="font-size:1.3rem;">👨‍✈️</span>
              <h3 style="font-size:1.25rem; font-weight:900; color:#1e293b; margin:0;">
                Choferes VIP Particulares Aprobados por Gerencia
              </h3>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
              ${filteredDrivers.map(d => `
                <div class="card" style="background:#ffffff; border:1.5px solid rgba(212,175,55,0.4); border-radius:20px; padding:22px; box-shadow:0 4px 16px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                      <div style="display:flex; align-items:center; gap:12px;">
                        <div style="position:relative; width:52px; height:52px; flex-shrink:0; cursor:pointer;" onclick="limusinaVipEngine.openDriverCredentialModal('${d.id}')" title="Clic para ver foto ampliada y credencial de identificación">
                          <img src="${d.photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(d.name) + '&background=111827&color=D4AF37')}" alt="${d.name}" style="width:52px; height:52px; border-radius:16px; object-fit:cover; border:2px solid #D4AF37; box-shadow:0 3px 10px rgba(0,0,0,0.12);" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=111827&color=D4AF37';">
                          <span style="position:absolute; bottom:-2px; right:-2px; background:#10B981; border:2px solid #ffffff; width:13px; height:13px; border-radius:50%;" title="Identidad Verificada"></span>
                        </div>
                        <div>
                          <h4 style="font-size:1.05rem; font-weight:900; color:#0f172a; margin:0; display:flex; align-items:center; gap:6px;">
                            ${d.name}
                            <span style="font-size:0.68rem; font-weight:800; background:rgba(212,175,55,0.12); color:#B8860B; border:1px solid #D4AF37; border-radius:6px; padding:2px 6px; cursor:pointer;" onclick="limusinaVipEngine.openDriverCredentialModal('${d.id}')" title="Identificación del Chofer para el Cliente">📸 Foto ID</span>
                          </h4>
                          <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">${d.role}</div>
                        </div>
                      </div>
                      <span class="badge" style="background:rgba(16,185,129,0.12); color:#059669; font-weight:800; border:1px solid #10b981; font-size:0.7rem; padding:4px 8px; border-radius:8px;">
                        ● ${d.status}
                      </span>
                    </div>

                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:14px;">
                      <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
                        <span style="color:#64748b;">🚘 <b>Unidad:</b> ${d.vehicle}</span>
                        <span style="color:#0f172a; font-weight:800;">${d.plates}</span>
                      </div>
                      <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
                        <span style="color:#64748b;">📍 <b>Sector Base:</b> ${d.sector}</span>
                        <span style="color:#eab308; font-weight:800;">⭐ ${d.rating} (${d.trips} viajes)</span>
                      </div>
                      <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:4px; padding-top:4px; border-top:1px dashed #e2e8f0;">
                        <span style="color:#0284c7; font-weight:800;">🛰️ <b>ETA Sede Central:</b></span>
                        <span style="color:#0284c7; font-weight:900;">${d.eta_to_hq ? d.eta_to_hq.formatted_eta : (d.active_trip ? d.active_trip.formatted_eta : '~4 min (1.2 km)')}</span>
                      </div>
                    </div>

                    <div style="font-size:0.72rem; color:#047857; background:rgba(4,120,87,0.06); padding:6px 10px; border-radius:8px; border:1px dashed #047857; margin-bottom:14px; font-weight:700;">
                      ✓ ${d.approval}
                    </div>

                    <ul style="margin:0 0 16px 0; padding-left:18px; font-size:0.74rem; color:#475569; line-height:1.45;">
                      ${d.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                  </div>

                  <div style="display:flex; gap:6px; margin-top:12px; pt-2; border-top:1px solid #f1f5f9; flex-wrap:wrap;">
                    <button type="button" class="btn" onclick="limusinaVipEngine.contactDriverWhatsApp('${d.id}')" style="flex:2; min-width:120px; background:#25D366; color:white; font-weight:800; font-size:0.8rem; border-radius:10px; padding:10px 10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 2px 8px rgba(37,211,102,0.25);">
                      💬 WhatsApp
                    </button>
                    <button type="button" class="btn" onclick="limusinaVipEngine.openDriverLiveTrackingModal('${d.id}')" title="Rastrear GPS y Ver Tiempo Estimado de Llegada" style="flex:1; min-width:85px; background:rgba(56,189,248,0.1); color:#0284c7; font-weight:800; font-size:0.76rem; border-radius:10px; padding:10px 6px; border:1.5px solid #38bdf8; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:3px;">
                      🛰️ GPS & ETA
                    </button>
                    <button type="button" class="btn" onclick="limusinaVipEngine.openDriverCredentialModal('${d.id}')" title="Ver Carnet con Foto para Identificar Chofer" style="flex:1; min-width:80px; background:#ffffff; color:#D4AF37; font-weight:800; font-size:0.76rem; border-radius:10px; padding:10px 6px; border:1.5px solid #D4AF37; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:3px;">
                      🪪 Carnet
                    </button>
                    <button type="button" class="btn" onclick="limusinaVipEngine.testInWhatsAppSimulator('${d.id}')" title="Probar en Simulador de WhatsApp" style="flex:1; min-width:70px; background:#f1f5f9; color:#334155; font-weight:700; font-size:0.76rem; border-radius:10px; padding:10px 6px; border:1px solid #cbd5e1; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:3px;">
                      📱 Chat
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- SECCIÓN 2: EMPRESAS DE TRANSPORTE Y ALIADOS (CONVENIOS AUTORIZADOS POR GERENCIA) -->
        <div style="margin-bottom:32px;" id="sec-transport-companies">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.4rem;">🏢</span>
              <div>
                <h3 style="font-size:1.25rem; font-weight:900; color:#1e293b; margin:0; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span>Empresas de Transporte Aliadas (Convenios Autorizados por Gerencia)</span>
                  <span class="badge" style="background:rgba(74,107,93,0.12); color:#4A6B5D; border:1px solid #4A6B5D; font-size:0.75rem; padding:3px 9px; border-radius:12px; font-weight:800;">
                    ${filteredCompanies.length} Convenios Activos
                  </span>
                </h3>
                <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">
                  Gestión integral de convenios empresariales autorizados por gerencia general Mrs. Pets.
                </div>
              </div>
            </div>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button type="button" class="btn btn-create-transport-company" id="btn-create-company-section" onclick="limusinaVipEngine.openNewCompanyModal()" style="background:linear-gradient(135deg, #4A6B5D, #2D433A); color:#ffffff; font-weight:800; font-size:0.8rem; border-radius:12px; padding:10px 16px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(74,107,93,0.3);">
                ➕ Crear Nuevo Convenio
              </button>
              ${this.canRestoreDefaults() ? `
                <button type="button" class="btn" onclick="limusinaVipEngine.restoreDefaultCompanies()" style="background:#f8fafc; color:#64748b; font-weight:700; font-size:0.76rem; border-radius:12px; padding:10px 14px; border:1px solid #cbd5e1; cursor:pointer; display:inline-flex; align-items:center; gap:5px;" title="Restaurar convenios iniciales recomendados">
                  🔄 Restaurar Convenios Sugeridos
                </button>
              ` : ''}
            </div>
          </div>

          ${filteredCompanies.length === 0 ? `
            <div style="background:#ffffff; border:2px dashed #CBD5E1; border-radius:20px; padding:36px 24px; text-align:center;">
              <div style="font-size:2.4rem; margin-bottom:8px;">🏢</div>
              <h4 style="font-size:1.1rem; font-weight:800; color:#1E293B; margin:0 0 6px 0;">No hay convenios de transporte activos</h4>
              <p style="font-size:0.82rem; color:#64748B; max-width:540px; margin:0 auto 16px auto;">
                Actualmente no existen empresas de transporte aliadas en la lista activa. Puede registrar un nuevo convenio corporativo avalado por gerencia o restaurar los convenios predeterminados.
              </p>
              <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
                <button type="button" class="btn" onclick="limusinaVipEngine.openNewCompanyModal()" style="background:#4A6B5D; color:#ffffff; font-weight:800; font-size:0.8rem; border-radius:12px; padding:10px 20px; border:none; cursor:pointer;">
                  ➕ Crear Primer Convenio
                </button>
                <button type="button" class="btn" onclick="limusinaVipEngine.restoreDefaultCompanies()" style="background:#F1F5F9; color:#334155; font-weight:800; font-size:0.8rem; border-radius:12px; padding:10px 18px; border:1px solid #CBD5E1; cursor:pointer;">
                  🔄 Restaurar Convenios Sugeridos
                </button>
              </div>
            </div>
          ` : `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
              ${filteredCompanies.map(c => `
                <div class="card company-agreement-card" data-company-id="${c.id}" style="background:#ffffff; border:1.5px solid #4A6B5D; border-radius:20px; padding:22px; box-shadow:0 4px 16px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between; position:relative;">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; gap:8px;">
                      <div style="display:flex; align-items:center; gap:12px;">
                        <div style="position:relative; width:52px; height:52px; flex-shrink:0; cursor:pointer;" onclick="limusinaVipEngine.openDriverCredentialModal('${c.id}')" title="Ver credencial de la empresa">
                          <img src="${c.photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name) + '&background=4A6B5D&color=FFFFFF')}" alt="${c.name}" style="width:52px; height:52px; border-radius:16px; object-fit:cover; border:2px solid #4A6B5D; box-shadow:0 3px 10px rgba(0,0,0,0.12);" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=4A6B5D&color=FFFFFF';">
                          <span style="position:absolute; bottom:-2px; right:-2px; background:#D4AF37; border:2px solid #ffffff; width:13px; height:13px; border-radius:50%;" title="Empresa Verificada"></span>
                        </div>
                        <div>
                          <h4 style="font-size:1.05rem; font-weight:900; color:#0f172a; margin:0; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            ${c.name}
                            <span style="font-size:0.68rem; font-weight:800; background:rgba(74,107,93,0.12); color:#4A6B5D; border:1px solid #4A6B5D; border-radius:6px; padding:2px 6px; cursor:pointer;" onclick="limusinaVipEngine.openDriverCredentialModal('${c.id}')" title="Credencial Institucional">🏢 Convenio</span>
                          </h4>
                          <div style="font-size:0.75rem; color:#4A6B5D; font-weight:700; margin-top:2px;">${c.rif} • ${c.role}</div>
                        </div>
                      </div>

                      <div style="display:flex; gap:4px; flex-shrink:0;">
                        <button type="button" class="btn btn-sm btn-edit-company" onclick="limusinaVipEngine.openEditCompanyModal('${c.id}')" title="Editar Convenio" style="background:#F1F5F9; color:#475569; border:1px solid #CBD5E1; border-radius:8px; padding:4px 8px; font-size:0.75rem; cursor:pointer; font-weight:700;">
                          ✏️
                        </button>
                        <button type="button" class="btn btn-sm btn-delete-company" onclick="limusinaVipEngine.confirmDeleteCompany('${c.id}', '${c.name.replace(/'/g, "\\'")}')" title="Eliminar / Revocar Convenio" style="background:#FEF2F2; color:#DC2626; border:1px solid #FCA5A5; border-radius:8px; padding:4px 8px; font-size:0.75rem; cursor:pointer; font-weight:800;">
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:14px;">
                      <div style="font-size:0.75rem; color:#0f172a; font-weight:700; margin-bottom:4px;">
                        🚐 <b>Flota Disponible:</b> ${c.fleet}
                      </div>
                      <div style="font-size:0.75rem; color:#64748b;">
                        📍 <b>Cobertura:</b> ${c.sector}
                      </div>
                    </div>

                    <div style="font-size:0.72rem; color:#B45309; background:rgba(217,119,6,0.08); padding:6px 10px; border-radius:8px; border:1px solid rgba(217,119,6,0.2); margin-bottom:14px; font-weight:700;">
                      🛡️ ${c.approval}
                    </div>

                    <ul style="margin:0 0 16px 0; padding-left:18px; font-size:0.74rem; color:#475569; line-height:1.45;">
                      ${(c.features || []).map(f => `<li>${f}</li>`).join('')}
                    </ul>
                  </div>

                  <div style="display:flex; gap:6px; margin-top:12px; padding-top:12px; border-top:1px solid #f1f5f9; flex-wrap:wrap;">
                    <button type="button" class="btn" onclick="limusinaVipEngine.contactDriverWhatsApp('${c.id}')" style="flex:2; min-width:120px; background:#25D366; color:white; font-weight:800; font-size:0.8rem; border-radius:10px; padding:10px 10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 2px 8px rgba(37,211,102,0.25);">
                      💬 WhatsApp
                    </button>
                    <button type="button" class="btn" onclick="limusinaVipEngine.openDriverCredentialModal('${c.id}')" title="Ver Credencial Institucional" style="flex:1; min-width:80px; background:#ffffff; color:#4A6B5D; font-weight:800; font-size:0.76rem; border-radius:10px; padding:10px 6px; border:1.5px solid #4A6B5D; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:3px;">
                      🪪 Carnet
                    </button>
                    <button type="button" class="btn" onclick="limusinaVipEngine.testInWhatsAppSimulator('${c.id}')" title="Probar en Simulador" style="flex:1; min-width:70px; background:#f1f5f9; color:#334155; font-weight:700; font-size:0.76rem; border-radius:10px; padding:10px 6px; border:1px solid #cbd5e1; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:3px;">
                      📱 Chat
                    </button>
                    <button type="button" class="btn btn-delete-company-card" onclick="limusinaVipEngine.confirmDeleteCompany('${c.id}', '${c.name.replace(/'/g, "\\'")}')" title="Eliminar Convenio Autorizado" style="background:#FFF1F2; color:#E11D48; border:1px solid #FECDD3; border-radius:10px; padding:10px 10px; font-size:0.76rem; cursor:pointer; font-weight:800; display:flex; align-items:center; justify-content:center;">
                      🗑️
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- PIE DE PÁGINA: RESERVACIÓN TRADICIONAL COMPATIBLE -->
        <div style="background:#FBFBFD; border:1px dashed #D4AF37; border-radius:16px; padding:18px 24px; text-align:center; margin-top:20px;">
          <div style="font-size:0.8rem; color:#64748b; margin-bottom:6px;">
            ¿Desea programar un traslado coordinado junto a una estancia de Hotel 5★ o Spa?
          </div>
          <button type="button" class="btn btn-sm" onclick="clinicaEngine.openHotelBookingModal('Servicio de Limusina VIP & Pet Chauffeur')" style="background:#4A6B5D; color:white; font-weight:800; font-size:0.78rem; border-radius:10px; padding:8px 18px; border:none; cursor:pointer;">
            📅 Abrir Calendario de Reservación Tradicional
          </button>
        </div>
      `;

      container.innerHTML = html;

      setTimeout(() => {
        this.updateSelectedDriverCard(document.getElementById('lim-driver-select')?.value || 'carlos-mendoza');
      }, 50);
    }

    handlePhotoFileChange(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('Por favor seleccione un archivo de imagen válido (JPG, PNG o WEBP)', 'warning');
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result;
        const previewEl = document.getElementById('modal-d-photo-preview');
        const hiddenDataEl = document.getElementById('modal-d-photo-data');
        const badge = document.getElementById('modal-d-photo-status-badge');

        if (previewEl) {
          previewEl.innerHTML = `<img src="${base64Data}" style="width:100%; height:100%; object-fit:cover;" alt="Foto Chofer">`;
          previewEl.style.border = '2.5px solid #10B981';
        }
        if (hiddenDataEl) {
          hiddenDataEl.value = base64Data;
        }
        if (badge) {
          badge.style.display = 'inline-flex';
          badge.textContent = '✓ Foto Lista para Identificación';
        }
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('📸 Foto del chofer cargada con éxito para identificación del cliente.', 'success');
        }
      };
      reader.readAsDataURL(file);
    }

    handlePhotoUrlChange(event) {
      const url = event.target.value.trim();
      const previewEl = document.getElementById('modal-d-photo-preview');
      const hiddenDataEl = document.getElementById('modal-d-photo-data');
      const badge = document.getElementById('modal-d-photo-status-badge');

      if (!url) {
        this.resetPhotoPreview();
        return;
      }

      if (previewEl) {
        previewEl.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;" alt="Foto Chofer" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Chofer&background=111827&color=D4AF37';">`;
        previewEl.style.border = '2.5px solid #10B981';
      }
      if (hiddenDataEl) {
        hiddenDataEl.value = url;
      }
      if (badge) {
        badge.style.display = 'inline-flex';
        badge.textContent = '✓ URL Vinculada';
      }
    }

    resetPhotoPreview() {
      const previewEl = document.getElementById('modal-d-photo-preview');
      const hiddenDataEl = document.getElementById('modal-d-photo-data');
      const urlEl = document.getElementById('modal-d-photo-url');
      const fileEl = document.getElementById('modal-d-photo-file');
      const badge = document.getElementById('modal-d-photo-status-badge');

      if (previewEl) {
        previewEl.innerHTML = '👨‍✈️';
        previewEl.style.border = '2.5px solid #D4AF37';
      }
      if (hiddenDataEl) hiddenDataEl.value = '';
      if (urlEl) urlEl.value = '';
      if (fileEl) fileEl.value = '';
      if (badge) badge.style.display = 'none';
    }

    updateSelectedDriverCard(driverId) {
      const container = document.getElementById('lim-selected-driver-identity-box');
      if (!container) return;

      const all = [...this.getAllDrivers(), ...this.getAllCompanies()];
      const driver = all.find(d => d.id === driverId) || all[0];
      if (!driver) {
        container.style.display = 'none';
        return;
      }

      const isGpsActive = driver.gps_enabled || driver.statusClass === 'status-online' || (driver.status && driver.status.includes('GPS'));
      const etaText = driver.eta_to_hq ? driver.eta_to_hq.formatted_eta : (driver.active_trip && driver.active_trip.formatted_eta ? driver.active_trip.formatted_eta : '~5 min (1.8 km)');

      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.gap = '14px';
      container.innerHTML = `
        <div style="display:flex; align-items:center; gap:14px; flex:1; min-width:280px;">
          <div style="position:relative; width:58px; height:58px; flex-shrink:0; cursor:pointer;" onclick="limusinaVipEngine.openDriverCredentialModal('${driver.id}')" title="Clic para ver foto ampliada y credencial de identificación">
            <img src="${driver.photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(driver.name) + '&background=111827&color=D4AF37')}" alt="${driver.name}" style="width:58px; height:58px; border-radius:16px; object-fit:cover; border:2.5px solid #D4AF37; box-shadow:0 3px 10px rgba(0,0,0,0.15);" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=111827&color=D4AF37';">
            <span style="position:absolute; bottom:-2px; right:-2px; background:${isGpsActive ? '#10B981' : '#94A3B8'}; border:2px solid #ffffff; width:14px; height:14px; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,0.2);" title="${isGpsActive ? 'GPS Satelital Activo' : 'GPS en Espera'}"></span>
          </div>

          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
              <div style="font-size:0.92rem; font-weight:900; color:#0f172a; display:flex; align-items:center; gap:6px;">
                📸 Chofer Asignado: <b>${driver.name}</b>
              </div>
              <span style="font-size:0.7rem; font-weight:800; color:${isGpsActive ? '#059669' : '#475569'}; background:${isGpsActive ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.15)'}; border:1px solid ${isGpsActive ? '#10b981' : '#cbd5e1'}; padding:2px 8px; border-radius:8px;">
                ${isGpsActive ? '🟢 GPS Satelital Conectado' : '⚪ GPS Standby'}
              </span>
            </div>
            <div style="font-size:0.75rem; color:#475569; margin-top:3px;">
              Unidad: <b>${driver.vehicle || driver.fleet}</b> &nbsp;|&nbsp; Placas: <b style="color:#D4AF37; font-family:monospace; font-size:0.85rem;">${driver.plates || driver.rif}</b> &nbsp;|&nbsp; Sector: <b>${driver.sector}</b>
            </div>
            <div style="display:flex; align-items:center; gap:8px; margin-top:4px; flex-wrap:wrap;">
              <span style="font-size:0.75rem; font-weight:900; color:#0284c7; background:rgba(56,189,248,0.15); border:1px solid #38bdf8; padding:2px 8px; border-radius:6px;">
                ⏱️ Tiempo Estimado de Llegada (ETA): <b>${etaText}</b>
              </span>
              <span style="font-size:0.71rem; color:#64748b;">
                (Fórmula Haversine con factor vial Maracaibo 1.35x)
              </span>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" class="btn btn-sm" onclick="limusinaVipEngine.openDriverLiveTrackingModal('${driver.id}')" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#ffffff; font-weight:800; border-radius:10px; padding:8px 14px; font-size:0.76rem; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:5px; border:none; box-shadow:0 2px 8px rgba(2,132,199,0.3);">
            🗺️ Rastrear GPS en Vivo
          </button>
          <button type="button" class="btn btn-sm" onclick="limusinaVipEngine.openDriverCredentialModal('${driver.id}')" style="background:#ffffff; color:#D4AF37; border:1.5px solid #D4AF37; font-weight:800; border-radius:10px; padding:8px 12px; font-size:0.75rem; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(212,175,55,0.15);">
            🪪 Ver Carnet Oficial
          </button>
        </div>
      `;
    }

    openDriverCredentialModal(driverId) {
      const all = [...this.getAllDrivers(), ...this.getAllCompanies()];
      const driver = all.find(d => d.id === driverId) || all[0];
      if (!driver) return;

      let modal = document.getElementById('modal-driver-credential');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-driver-credential';
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:999999; backdrop-filter:blur(6px);';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="background:#ffffff; border:2px solid #D4AF37; border-radius:26px; width:92%; max-width:480px; padding:28px; box-shadow:0 24px 60px rgba(0,0,0,0.35); position:relative; overflow:hidden;">
          <!-- GOLD LUXURY HEADER BAR -->
          <div style="position:absolute; top:0; left:0; width:100%; height:8px; background:linear-gradient(90deg, #D4AF37, #F5D061, #AA771C);"></div>
          
          <button type="button" onclick="document.getElementById('modal-driver-credential').style.display='none'" style="position:absolute; top:16px; right:18px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b; font-weight:700;">✕</button>

          <div style="text-align:center; margin-bottom:20px; margin-top:8px;">
            <div style="font-size:0.72rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.12em;">
              CREDENCIAL DE IDENTIFICACIÓN OFICIAL
            </div>
            <h3 style="font-size:1.35rem; font-weight:900; color:#0f172a; margin:4px 0 2px 0;">
              Mrs. Pets • Limusina VIP & Pet Chauffeur
            </h3>
            <div style="font-size:0.78rem; color:#64748b;">
              Verificación de Seguridad para el Tutor VIP al momento del Traslado
            </div>
          </div>

          <!-- PHOTO & IDENTITY BADGE -->
          <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:20px;">
            <div style="position:relative; width:120px; height:120px; border-radius:30px; border:3.5px solid #D4AF37; box-shadow:0 8px 24px rgba(212,175,55,0.35); overflow:hidden; background:#111827;">
              <img src="${driver.photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(driver.name) + '&background=111827&color=D4AF37&bold=true')}" alt="${driver.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=111827&color=D4AF37';">
              <span style="position:absolute; bottom:6px; right:6px; background:#10B981; border:2px solid #ffffff; width:18px; height:18px; border-radius:50%;" title="Identidad Verificada"></span>
            </div>
            <h4 style="font-size:1.25rem; font-weight:900; color:#0f172a; margin:12px 0 2px 0;">${driver.name}</h4>
            <div style="font-size:0.8rem; font-weight:700; color:#4A6B5D;">${driver.role}</div>
            <span class="badge" style="margin-top:6px; background:rgba(16,185,129,0.15); color:#059669; font-weight:800; border:1px solid #10b981; font-size:0.72rem; padding:4px 10px; border-radius:12px;">
              ✓ ROSTRO E IDENTIDAD APROBADA POR GERENCIA
            </span>
          </div>

          <!-- VEHICLE & CREDENTIAL DETAILS -->
          <div style="background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:16px; padding:16px; margin-bottom:18px; font-size:0.82rem;">
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;">🚘 <b>Vehículo Asignado:</b></span>
              <strong style="color:#0f172a;">${driver.vehicle || driver.fleet || 'Mercedes Sprinter VIP'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;">🔢 <b>Placas / Matrícula:</b></span>
              <strong style="color:#D4AF37; font-family:monospace; font-size:0.95rem;">${driver.plates || driver.rif || 'OFICIAL'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;">📍 <b>Sector Base:</b></span>
              <span style="color:#0f172a; font-weight:700;">${driver.sector}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0;">
              <span style="color:#64748b;">🛡️ <b>Aval de Seguridad:</b></span>
              <span style="color:#059669; font-weight:700; font-size:0.75rem;">${driver.approval}</span>
            </div>
          </div>

          <!-- SECURITY RECOMMENDATION FOR TUTOR -->
          <div style="background:rgba(212,175,55,0.08); border-left:4px solid #D4AF37; padding:10px 14px; border-radius:0 12px 12px 0; margin-bottom:20px; font-size:0.74rem; color:#475569; line-height:1.45;">
            <b>💡 Protocolo de Seguridad para el Tutor:</b> Al llegar la unidad a su domicilio o sector, verifique visualmente que el chofer coincida con esta fotografía y confirme las placas <b>${driver.plates || driver.rif}</b> antes de permitir el ingreso de su mascota.
          </div>

          <div style="display:flex; gap:10px;">
            <button type="button" onclick="document.getElementById('modal-driver-credential').style.display='none'" class="btn" style="flex:1; background:#f1f5f9; color:#475569; padding:10px; border-radius:12px; font-weight:700; border:1px solid #cbd5e1; cursor:pointer;">
              Cerrar
            </button>
            <button type="button" onclick="document.getElementById('modal-driver-credential').style.display='none'; limusinaVipEngine.contactDriverWhatsApp('${driver.id}')" class="btn" style="flex:2; background:#25D366; color:white; font-weight:900; padding:10px; border-radius:12px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(37,211,102,0.3);">
              💬 Contactar a ${driver.name} por WhatsApp
            </button>
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    }

    openNewDriverModal() {
      let modal = document.getElementById('modal-new-chauffeur');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-new-chauffeur';
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(4px);';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="background:#ffffff; border:1.5px solid #D4AF37; border-radius:24px; width:90%; max-width:560px; padding:28px; box-shadow:0 20px 50px rgba(0,0,0,0.3); max-height:90vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
            <div>
              <div style="font-size:0.7rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.08em;">GESTIÓN GERENCIAL</div>
              <h3 style="font-size:1.25rem; font-weight:900; color:#0f172a; margin:2px 0 0 0;">➕ Inscribir Chofer / Empresa Aliada</h3>
            </div>
            <button type="button" onclick="document.getElementById('modal-new-chauffeur').style.display='none'" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:#94a3b8;">✕</button>
          </div>

          <form onsubmit="limusinaVipEngine.saveNewDriver(event)">
            <!-- 📸 FOTOGRAFÍA OFICIAL DEL CHOFER (SUBIR FOTO / IDENTIFICACIÓN DEL CLIENTE) -->
            <div style="background:rgba(212,175,55,0.06); border:1.5px dashed #D4AF37; border-radius:18px; padding:16px 18px; margin-bottom:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="font-size:0.78rem; font-weight:900; color:#1e293b; display:flex; align-items:center; gap:6px;">
                  📸 Fotografía Oficial del Chofer (Para Identificación del Cliente) *
                </label>
                <span id="modal-d-photo-status-badge" style="display:none; font-size:0.7rem; font-weight:800; background:rgba(16,185,129,0.15); color:#059669; padding:2px 8px; border-radius:8px;">
                  ✓ Foto Lista para Reconocimiento
                </span>
              </div>
              <div style="font-size:0.72rem; color:#64748b; margin-bottom:12px; line-height:1.45;">
                Suba una fotografía frontal y nítida del chofer. Esta foto aparecerá en la credencial digital que el tutor/cliente consultará al momento de la llegada de la unidad para identificarlo con seguridad.
              </div>

              <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
                <!-- Live Preview Box -->
                <div id="modal-d-photo-preview" style="width:76px; height:76px; border-radius:20px; border:2.5px solid #D4AF37; background:#111827; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; box-shadow:0 4px 12px rgba(212,175,55,0.25); color:#D4AF37; font-size:2rem;">
                  👨‍✈️
                </div>

                <!-- Upload Controls -->
                <div style="flex:1; min-width:220px;">
                  <div style="display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
                    <label class="btn" style="background:#111827; color:#D4AF37; border:1.5px solid #D4AF37; font-weight:800; font-size:0.76rem; border-radius:10px; padding:8px 14px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                      📁 Subir Foto del Chofer (Cámara / Galería)
                      <input type="file" id="modal-d-photo-file" accept="image/*" onchange="limusinaVipEngine.handlePhotoFileChange(event)" style="display:none;">
                    </label>
                    <button type="button" onclick="limusinaVipEngine.resetPhotoPreview()" class="btn" style="background:#f1f5f9; color:#64748b; font-size:0.74rem; border-radius:10px; padding:8px 12px; border:1px solid #cbd5e1; cursor:pointer;">
                      ✕ Quitar
                    </button>
                  </div>
                  <div>
                    <input type="url" id="modal-d-photo-url" class="form-input" placeholder="O pega una URL de foto (https://...)" oninput="limusinaVipEngine.handlePhotoUrlChange(event)" style="width:100%; padding:8px 12px; border-radius:10px; border:1px solid #cbd5e1; font-size:0.75rem;">
                  </div>
                  <input type="hidden" id="modal-d-photo-data" value="">
                </div>
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Tipo de Registro</label>
              <select id="modal-d-type" class="form-input" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;">
                <option value="private">👨‍✈️ Chofer VIP Particular</option>
                <option value="company">🏢 Empresa de Transporte Aliada</option>
              </select>
            </div>

            <div style="margin-bottom:14px;">
              <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Nombre Completo o Razón Social *</label>
              <input type="text" id="modal-d-name" class="form-input" placeholder="Ej. Andrés Colmenares" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;" required>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">C.I. / RIF *</label>
                <input type="text" id="modal-d-doc" class="form-input" placeholder="V-19.123.456" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;" required>
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Placas / Unidad *</label>
                <input type="text" id="modal-d-plates" class="form-input" placeholder="AC442KK" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;" required>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Vehículo / Modelo *</label>
                <input type="text" id="modal-d-vehicle" class="form-input" placeholder="Toyota Hilux VIP" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;" required>
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Sector Base en Maracaibo *</label>
                <input type="text" id="modal-d-sector" class="form-input" placeholder="Tierra Negra" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;" required>
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Teléfono WhatsApp (+58...) *</label>
              <input type="text" id="modal-d-phone" class="form-input" placeholder="+584141234567" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;" required>
            </div>

            <div style="margin-bottom:18px;">
              <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Certificaciones / Aval Gerencial</label>
              <input type="text" id="modal-d-cert" class="form-input" value="Aprobado por Gerencia General • Antecedentes Verificados" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;">
            </div>

            <div style="background:rgba(16,185,129,0.08); border:1.5px solid #10b981; border-radius:12px; padding:12px 14px; margin-bottom:18px; display:flex; align-items:center; gap:10px;">
              <input type="checkbox" id="modal-d-gps-enabled" checked style="width:18px; height:18px; accent-color:#10b981; cursor:pointer;">
              <label for="modal-d-gps-enabled" style="font-size:0.78rem; font-weight:800; color:#065f46; cursor:pointer; line-height:1.35;">
                🟢 Activar Telemetría GPS Satelital y Estimación de Tiempo de Llegada (ETA) al registrar
              </label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
              <button type="button" onclick="document.getElementById('modal-new-chauffeur').style.display='none'" class="btn" style="background:#f1f5f9; color:#475569; padding:10px 18px; border-radius:10px; font-weight:700; border:1px solid #cbd5e1; cursor:pointer;">Cancelar</button>
              <button type="submit" class="btn" style="background:#D4AF37; color:#121214; padding:10px 20px; border-radius:10px; font-weight:900; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(212,175,55,0.3);">
                💾 Guardar Chofer con Foto
              </button>
            </div>
          </form>
        </div>
      `;
      modal.style.display = 'flex';
    }

    saveNewDriver(event) {
      if (event && event.preventDefault) event.preventDefault();

      const type = document.getElementById('modal-d-type')?.value || 'private';
      const name = document.getElementById('modal-d-name')?.value?.trim();
      const doc = document.getElementById('modal-d-doc')?.value?.trim();
      const plates = document.getElementById('modal-d-plates')?.value?.trim();
      const vehicle = document.getElementById('modal-d-vehicle')?.value?.trim();
      const sector = document.getElementById('modal-d-sector')?.value?.trim();
      let phone = document.getElementById('modal-d-phone')?.value?.trim() || '';
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const cert = document.getElementById('modal-d-cert')?.value?.trim() || 'Aprobado por Gerencia';
      const photoData = document.getElementById('modal-d-photo-data')?.value?.trim() || 
                        document.getElementById('modal-d-photo-url')?.value?.trim() || 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Chofer')}&background=111827&color=D4AF37&bold=true`;

      if (!name || !plates) return;

      if (type === 'company') {
        const companyObj = {
          id: 'comp-' + Date.now(),
          name: name,
          rif: doc || 'J-00000000-0',
          role: 'Empresa de Transporte Aliada',
          fleet: vehicle || 'Flota Especializada',
          sector: sector || 'Gran Maracaibo',
          phone: phone,
          cleanPhone: cleanPhone,
          status: 'EMPRESA APROBADA POR GERENCIA',
          statusColor: '#D4AF37',
          type: 'company',
          avatar: '🏢',
          photo: photoData,
          approval: `${cert} (Doc: ${doc})`,
          features: [
            'Vehículo climatizado e inspeccionado por staff técnico',
            'Conexión directa por WhatsApp oficial',
            'Fotografía y credencial verificadas para reconocimiento del cliente',
            'Monitoreo y trazabilidad garantizada por GPS'
          ]
        };

        if (!this.companies || this.companies.length === 0) {
          this.loadCompanies();
        }
        this.companies.push(companyObj);
        this.saveCompanies();

        if (typeof fetch !== 'undefined') {
          fetch('/api/v1/limusina/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyObj)
          }).catch(() => {});
        }

        const chauffeurModal = document.getElementById('modal-new-chauffeur');
        if (chauffeurModal) chauffeurModal.style.display = 'none';

        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`✓ Nuevo convenio de transporte '${name}' registrado con éxito.`, 'success');
        }

        this.renderPlatform();
        return;
      }

      const gpsEnabled = document.getElementById('modal-d-gps-enabled')?.checked !== false;

      const newDriver = {
        id: 'custom-' + Date.now(),
        name: name,
        role: 'Pet Chauffeur Certificado',
        vehicle: vehicle,
        plates: plates,
        sector: sector,
        phone: phone,
        cleanPhone: cleanPhone,
        rating: '5.0',
        trips: 0,
        gps_enabled: gpsEnabled,
        status: gpsEnabled ? 'EN SERVICIO (GPS ACTIVO)' : 'DISPONIBLE',
        statusClass: 'status-online',
        statusColor: '#10B981',
        type: 'private',
        avatar: '👨‍✈️',
        photo: photoData,
        approval: `${cert} (Doc: ${doc})`,
        features: [
          'Vehículo climatizado e inspeccionado por staff técnico',
          'Conexión directa por WhatsApp oficial',
          'Fotografía y credencial verificadas para reconocimiento del cliente',
          'Monitoreo y trazabilidad satelital GPS activa'
        ]
      };

      this.customDrivers = this.customDrivers || [];
      this.customDrivers.push(newDriver);

      try {
        localStorage.setItem(this.storageKeyCustomDrivers, JSON.stringify(this.customDrivers));
      } catch (e) {
        console.warn('Error saving custom chauffeur:', e);
      }

      if (typeof fetch !== 'undefined') {
        fetch('/api/v1/misipet/drivers/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newDriver,
            registered_by: 'admin'
          })
        }).then(() => this.syncDriversFromBackend()).catch(() => {});
      }

      const modalEl = document.getElementById('modal-new-chauffeur');
      if (modalEl) modalEl.style.display = 'none';

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✓ Nuevo chofer '${name}' registrado con foto y GPS satelital.`, 'success');
      }

      this.renderPlatform();
    }

    // =========================================================================
    // AUTO-REGISTRO DE CHOFERES & ACTIVACIÓN DE GPS SATELITAL
    // =========================================================================

    openDriverSelfRegisterModal() {
      let modal = document.getElementById('modal-driver-self-registration');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-driver-self-registration';
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.75); display:flex; align-items:center; justify-content:center; z-index:999999; backdrop-filter:blur(6px);';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="background:#ffffff; border:2px solid #10B981; border-radius:24px; width:92%; max-width:580px; padding:28px; box-shadow:0 25px 60px rgba(0,0,0,0.35); max-height:90vh; overflow-y:auto; position:relative;">
          <div style="position:absolute; top:0; left:0; width:100%; height:8px; background:linear-gradient(90deg, #10B981, #34D399, #059669);"></div>
          
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; margin-top:6px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
            <div>
              <div style="font-size:0.72rem; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:0.1em;">
                PORTAL MÓVIL DEL PET CHAUFFEUR
              </div>
              <h3 style="font-size:1.35rem; font-weight:900; color:#0f172a; margin:4px 0 2px 0;">
                📱 Auto-Registro de Chofer & Activación de GPS
              </h3>
              <div style="font-size:0.78rem; color:#64748b;">
                Inscríbase como conductor oficial de Mrs. Pets y active su sistema GPS para estimar su tiempo de llegada (ETA) a los tutores.
              </div>
            </div>
            <button type="button" onclick="document.getElementById('modal-driver-self-registration').style.display='none'" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#94a3b8; font-weight:700;">✕</button>
          </div>

          <form onsubmit="limusinaVipEngine.saveDriverSelfRegistration(event)">
            <!-- FOTOGRAFÍA FRONTAL O SELFIE -->
            <div style="background:rgba(16,185,129,0.06); border:1.5px dashed #10B981; border-radius:16px; padding:16px; margin-bottom:16px;">
              <div style="font-size:0.78rem; font-weight:900; color:#065f46; margin-bottom:4px;">
                📸 Fotografía Frontal / Selfie para Identificación del Cliente *
              </div>
              <div style="font-size:0.72rem; color:#475569; margin-bottom:10px;">
                Esta foto se mostrará al tutor para verificar su rostro al momento de la llegada de la unidad.
              </div>
              <div style="display:flex; gap:14px; align-items:center;">
                <div id="self-driver-photo-preview" style="width:60px; height:60px; border-radius:18px; border:2px solid #10B981; display:flex; align-items:center; justify-content:center; font-size:1.8rem; background:#f0fdf4; overflow:hidden;">
                  👨‍✈️
                </div>
                <div style="flex:1;">
                  <label class="btn btn-sm" style="background:#10B981; color:white; font-weight:800; border-radius:10px; padding:8px 14px; cursor:pointer; font-size:0.75rem; display:inline-block;">
                    Subir Foto / Tomar Selfie
                    <input type="file" id="self-driver-photo-file" accept="image/*" onchange="limusinaVipEngine.handleSelfPhotoChange(event)" style="display:none;">
                  </label>
                  <input type="hidden" id="self-driver-photo-data" value="">
                </div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Nombre y Apellido *</label>
                <input type="text" id="self-driver-name" class="form-input" placeholder="Ej. Carlos Mendoza" required style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Cédula de Identidad (C.I.) *</label>
                <input type="text" id="self-driver-doc" class="form-input" placeholder="V-18.492.110" required style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Teléfono WhatsApp (+58...) *</label>
                <input type="text" id="self-driver-phone" class="form-input" placeholder="+584146799510" required style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Sector Base de Maracaibo *</label>
                <select id="self-driver-sector" class="form-input" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;">
                  <option value="El Milagro">El Milagro (Sede Central)</option>
                  <option value="Bella Vista">Bella Vista</option>
                  <option value="La Lago">La Lago</option>
                  <option value="Las Delicias">Las Delicias</option>
                  <option value="5 de Julio">5 de Julio</option>
                  <option value="Tierra Negra">Tierra Negra</option>
                  <option value="Santa Lucía">Santa Lucía</option>
                  <option value="San Francisco">San Francisco</option>
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Vehículo (Marca, Modelo, Color) *</label>
                <input type="text" id="self-driver-vehicle" class="form-input" placeholder="Ej. Toyota Corolla Blanco A/C" required style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:4px;">Número de Placas *</label>
                <input type="text" id="self-driver-plates" class="form-input" placeholder="Ej. AB892MK" required style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1; font-family:monospace; text-transform:uppercase;">
              </div>
            </div>

            <!-- INTERRUPTOR DE GPS SATELITAL OBLIGATORIO/DESTACADO -->
            <div style="background:linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.05)); border:2px solid #10B981; border-radius:16px; padding:16px; margin-bottom:20px;">
              <div style="display:flex; align-items:flex-start; gap:12px;">
                <input type="checkbox" id="self-driver-enable-gps" checked style="width:22px; height:22px; margin-top:2px; accent-color:#10B981; cursor:pointer;">
                <div>
                  <label for="self-driver-enable-gps" style="font-size:0.86rem; font-weight:900; color:#065f46; cursor:pointer; display:block;">
                    🟢 Activar Transmisión GPS Satelital y Tiempo Estimado de Llegada (ETA)
                  </label>
                  <div style="font-size:0.74rem; color:#475569; margin-top:3px; line-height:1.4;">
                    Al registrarse con GPS activo, su unidad aparecerá en tiempo real en la plataforma con el cálculo exacto de minutos y distancia de arribo hacia los clientes y la Sede Central.
                  </div>
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
              <button type="button" onclick="document.getElementById('modal-driver-self-registration').style.display='none'" class="btn" style="background:#f1f5f9; color:#475569; padding:10px 18px; border-radius:10px; font-weight:700; border:1px solid #cbd5e1; cursor:pointer;">
                Cancelar
              </button>
              <button type="submit" class="btn" style="background:#10B981; color:white; padding:10px 22px; border-radius:10px; font-weight:900; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.4); display:flex; align-items:center; gap:8px;">
                🚀 Registrarme & Iniciar Cockpit GPS ➔
              </button>
            </div>
          </form>
        </div>
      `;
      modal.style.display = 'flex';
    }

    handleSelfPhotoChange(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewEl = document.getElementById('self-driver-photo-preview');
        const hiddenDataEl = document.getElementById('self-driver-photo-data');
        if (previewEl) {
          previewEl.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;" alt="Selfie Chofer">`;
        }
        if (hiddenDataEl) hiddenDataEl.value = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    async saveDriverSelfRegistration(event) {
      if (event && event.preventDefault) event.preventDefault();

      const name = document.getElementById('self-driver-name')?.value?.trim();
      const doc = document.getElementById('self-driver-doc')?.value?.trim();
      const phone = document.getElementById('self-driver-phone')?.value?.trim();
      const sector = document.getElementById('self-driver-sector')?.value || 'El Milagro';
      const vehicle = document.getElementById('self-driver-vehicle')?.value?.trim();
      const plates = document.getElementById('self-driver-plates')?.value?.trim()?.toUpperCase();
      const gpsEnabled = document.getElementById('self-driver-enable-gps')?.checked !== false;
      const photoData = document.getElementById('self-driver-photo-data')?.value || 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Chofer')}&background=111827&color=D4AF37&bold=true`;

      if (!name || !phone || !plates) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('Por favor complete los campos obligatorios.', 'warning');
        }
        return;
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const driverId = 'driver-' + Date.now();

      const driverPayload = {
        id: driverId,
        name: name,
        doc: doc,
        phone: phone,
        cleanPhone: cleanPhone,
        sector: sector,
        vehicle: vehicle,
        plates: plates,
        photo: photoData,
        gps_enabled: gpsEnabled,
        registered_by: 'self',
        role: 'Chofer VIP Certificado (Auto-Registrado)',
        approval: `Auto-registrado con GPS • Doc: ${doc}`
      };

      this.customDrivers = this.customDrivers || [];
      this.customDrivers.push(driverPayload);
      try {
        localStorage.setItem(this.storageKeyCustomDrivers, JSON.stringify(this.customDrivers));
      } catch (e) {}

      try {
        await fetch('/api/v1/misipet/drivers/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(driverPayload)
        });
      } catch (e) {
        console.warn('Backend register fallback:', e);
      }

      const modal = document.getElementById('modal-driver-self-registration');
      if (modal) modal.style.display = 'none';

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🎉 ¡Bienvenido ${name}! Tu cuenta y sistema GPS han sido activados con éxito.`, 'success');
      }

      await this.syncDriversFromBackend();
      this.currentActiveDriverId = driverId;
      this.renderPlatform();

      setTimeout(() => {
        this.openDriverCockpitModal(driverId);
      }, 350);
    }

    // =========================================================================
    // COCKPIT DEL CHOFER (CONTROL MÓVIL DE GPS & VIAJES)
    // =========================================================================

    openDriverCockpitModal(driverId = null) {
      const allDrivers = this.getAllDrivers();
      const currentDriver = allDrivers.find(d => d.id === driverId) || 
                            allDrivers.find(d => d.id === this.currentActiveDriverId) || 
                            allDrivers[0];
      if (!currentDriver) return;
      this.currentActiveDriverId = currentDriver.id;

      let modal = document.getElementById('modal-driver-cockpit');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-driver-cockpit';
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.8); display:flex; align-items:center; justify-content:center; z-index:999999; backdrop-filter:blur(8px);';
        document.body.appendChild(modal);
      }

      const loc = currentDriver.current_location || { lat: 10.6698, lng: -71.6052, speed_kmh: 28.0 };
      const isGpsActive = currentDriver.gps_enabled !== false;
      const etaToHq = currentDriver.eta_to_hq ? currentDriver.eta_to_hq.formatted_eta : '~4 min (1.2 km)';

      modal.innerHTML = `
        <div style="background:#0F172A; border:2px solid #38BDF8; border-radius:24px; width:92%; max-width:620px; padding:26px; box-shadow:0 25px 60px rgba(0,0,0,0.5); color:#ffffff; max-height:90vh; overflow-y:auto; position:relative;">
          <div style="position:absolute; top:0; left:0; width:100%; height:6px; background:linear-gradient(90deg, #38BDF8, #818CF8, #34D399);"></div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:48px; height:48px; border-radius:14px; background:rgba(56,189,248,0.15); border:1.5px solid #38BDF8; display:flex; align-items:center; justify-content:center; font-size:1.6rem;">
                🛰️
              </div>
              <div>
                <div style="font-size:0.7rem; font-weight:800; color:#38BDF8; text-transform:uppercase; letter-spacing:0.1em;">
                  CABINA DE TRANSMISIÓN SATELITAL (COCKPIT)
                </div>
                <h3 style="font-size:1.25rem; font-weight:900; margin:2px 0 0 0; color:#ffffff;">
                  Telemetría GPS & Control de Llegada (ETA)
                </h3>
              </div>
            </div>
            <button type="button" onclick="document.getElementById('modal-driver-cockpit').style.display='none'" style="background:none; border:none; font-size:1.4rem; color:#94a3b8; cursor:pointer;">✕</button>
          </div>

          <!-- SELECTOR DE CHOFER ACTIVO -->
          <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:12px 16px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div style="font-size:0.8rem; font-weight:800; color:#94A3B8;">Conductor en Cabina:</div>
            <select onchange="limusinaVipEngine.openDriverCockpitModal(this.value)" style="background:#1E293B; color:#ffffff; border:1px solid #38BDF8; border-radius:8px; padding:6px 12px; font-weight:800; font-size:0.82rem; cursor:pointer;">
              ${allDrivers.map(d => `<option value="${d.id}" ${d.id === currentDriver.id ? 'selected' : ''}>${d.name} (${d.plates || 'S/P'})</option>`).join('')}
            </select>
          </div>

          <!-- INTERRUPTOR MAESTRO GPS -->
          <div style="background:linear-gradient(135deg, rgba(56,189,248,0.1), rgba(16,185,129,0.05)); border:2px solid ${isGpsActive ? '#10B981' : '#64748B'}; border-radius:18px; padding:18px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px;">
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:${isGpsActive ? '#34D399' : '#94A3B8'}; text-transform:uppercase;">
                ESTADO DEL SISTEMA GPS
              </div>
              <div style="font-size:1.2rem; font-weight:900; color:#ffffff; margin-top:2px;">
                ${isGpsActive ? '🟢 TRANSMITIENDO GPS EN VIVO' : '⚪ TRANSMISIÓN GPS EN PAUSA'}
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; margin-top:4px;">
                ${isGpsActive ? 'La ubicación se reporta al servidor para calcular el tiempo estimado de llegada de los clientes.' : 'La transmisión está pausada. Los clientes verán la última ubicación registrada.'}
              </div>
            </div>

            <button type="button" class="btn" onclick="limusinaVipEngine.toggleDriverGpsTransmission('${currentDriver.id}')" style="background:${isGpsActive ? '#EF4444' : '#10B981'}; color:#ffffff; font-weight:900; border-radius:12px; padding:12px 20px; border:none; cursor:pointer; box-shadow:0 4px 14px ${isGpsActive ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'};">
              ${isGpsActive ? '⏸️ Pausar GPS' : '▶️ Activar GPS'}
            </button>
          </div>

          <!-- REJILLA DE TELEMETRÍA Y ETA -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px;">
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px;">
              <div style="font-size:0.7rem; color:#94A3B8; font-weight:800;">COORDENADAS GPS ACTUALES</div>
              <div style="font-size:0.95rem; font-weight:800; color:#38BDF8; margin-top:4px; font-family:monospace;">
                ${Number(loc.lat).toFixed(4)}, ${Number(loc.lng).toFixed(4)}
              </div>
              <div style="font-size:0.72rem; color:#64748B; margin-top:2px;">
                Sector: ${currentDriver.sector} • Maracaibo
              </div>
            </div>

            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px;">
              <div style="font-size:0.7rem; color:#94A3B8; font-weight:800;">TIEMPO ESTIMADO A SEDE (ETA)</div>
              <div style="font-size:1.15rem; font-weight:900; color:#34D399; margin-top:2px;">
                ⏱️ ${etaToHq}
              </div>
              <div style="font-size:0.72rem; color:#64748B; margin-top:2px;">
                Vel. crucero: ${loc.speed_kmh || 28} km/h (Vial 1.35x)
              </div>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN RÁPIDA DE TRANSMISIÓN -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; margin-bottom:20px;">
            <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; margin-bottom:10px;">
              📡 MODALIDAD DE TRANSMISIÓN Y MOVIMIENTO
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn" onclick="limusinaVipEngine.useNativePhoneGps('${currentDriver.id}')" style="flex:1; background:#1E293B; border:1.5px solid #38BDF8; color:#38BDF8; font-weight:800; border-radius:10px; padding:10px; font-size:0.78rem; cursor:pointer;">
                📱 Usar GPS Nativo de mi Teléfono
              </button>
              <button type="button" class="btn" onclick="limusinaVipEngine.simulateDriverAdvance('${currentDriver.id}')" style="flex:1; background:#1E293B; border:1.5px solid #D4AF37; color:#D4AF37; font-weight:800; border-radius:10px; padding:10px; font-size:0.78rem; cursor:pointer;">
                🚗 Simular Avance en Maracaibo (+0.5 km)
              </button>
            </div>
          </div>

          <!-- GESTIÓN DEL VIAJE ACTIVO -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <div style="font-size:0.75rem; font-weight:800; color:#38BDF8;">
                🚕 TRASLADO ASIGNADO
              </div>
              <span style="font-size:0.7rem; font-weight:800; background:rgba(56,189,248,0.2); color:#38BDF8; padding:2px 8px; border-radius:6px;">
                ${currentDriver.active_trip ? 'EN CURSO: ' + currentDriver.active_trip.customer_name : 'SIN VIAJE ASIGNADO'}
              </span>
            </div>

            ${currentDriver.active_trip ? `
              <div style="font-size:0.82rem; margin-bottom:12px;">
                <div>Tutor: <b>${currentDriver.active_trip.customer_name}</b> • Mascota: <b>${currentDriver.active_trip.pet_name}</b></div>
                <div style="color:#94A3B8; font-size:0.75rem; margin-top:2px;">Origen: ${currentDriver.active_trip.origin_address} ➔ Destino: ${currentDriver.active_trip.destination_address}</div>
                <div style="color:#34D399; font-weight:800; margin-top:4px;">⏱️ Arribo al punto: ${currentDriver.active_trip.formatted_eta || '~4 min'}</div>
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm" onclick="limusinaVipEngine.updateTripStatus('${currentDriver.id}', 'en_camino')" style="background:#0284c7; color:white; border-radius:8px; padding:6px 12px; font-weight:800; font-size:0.74rem; border:none; cursor:pointer;">🟢 En Camino</button>
                <button type="button" class="btn btn-sm" onclick="limusinaVipEngine.updateTripStatus('${currentDriver.id}', 'arribado')" style="background:#D4AF37; color:#121214; border-radius:8px; padding:6px 12px; font-weight:800; font-size:0.74rem; border:none; cursor:pointer;">📍 Arribé al Domicilio</button>
                <button type="button" class="btn btn-sm" onclick="limusinaVipEngine.updateTripStatus('${currentDriver.id}', 'en_traslado')" style="background:#8b5cf6; color:white; border-radius:8px; padding:6px 12px; font-weight:800; font-size:0.74rem; border:none; cursor:pointer;">🐾 Mascota Abordada</button>
                <button type="button" class="btn btn-sm" onclick="limusinaVipEngine.updateTripStatus('${currentDriver.id}', 'completado')" style="background:#10B981; color:white; border-radius:8px; padding:6px 12px; font-weight:800; font-size:0.74rem; border:none; cursor:pointer;">🏁 Finalizar Viaje</button>
              </div>
            ` : `
              <div style="font-size:0.78rem; color:#94A3B8; margin-bottom:10px;">
                No hay traslados activos en este momento. Puede activar un viaje de prueba para verificar el cálculo de llegada.
              </div>
              <button type="button" class="btn" onclick="limusinaVipEngine.startSampleTrip('${currentDriver.id}')" style="background:#1E293B; border:1px solid #10B981; color:#10B981; font-weight:800; border-radius:8px; padding:8px 14px; font-size:0.76rem; cursor:pointer;">
                🚀 Asignar Traslado de Prueba (Don Bosco ➔ Clínica)
              </button>
            `}
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    }

    async toggleDriverGpsTransmission(driverId) {
      const all = this.getAllDrivers();
      const driver = all.find(d => d.id === driverId);
      if (!driver) return;

      const newState = !driver.gps_enabled;
      driver.gps_enabled = newState;
      driver.status = newState ? 'EN SERVICIO (GPS ACTIVO)' : 'DISPONIBLE (GPS EN PAUSA)';
      driver.statusColor = newState ? '#10B981' : '#64748B';

      const loc = driver.current_location || { lat: 10.6698, lng: -71.6052, speed_kmh: 28.0 };

      try {
        await fetch('/api/v1/misipet/drivers/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driver_id: driverId,
            lat: loc.lat,
            lng: loc.lng,
            speed_kmh: newState ? 28.0 : 0.0,
            accuracy_m: 8.0,
            heading: 0.0
          })
        });
      } catch (e) {}

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(newState ? `🟢 Transmisión GPS activada para ${driver.name}` : `⏸️ Transmisión GPS pausada para ${driver.name}`, 'info');
      }

      await this.syncDriversFromBackend();
      this.openDriverCockpitModal(driverId);
      this.renderPlatform();
    }

    useNativePhoneGps(driverId) {
      if (!navigator.geolocation) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('Geolocalización no soportada en este navegador. Usando simulación de ruta.', 'warning');
        }
        return;
      }

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🛰️ Conectando con chip GPS del dispositivo...', 'info');
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speed = pos.coords.speed ? (pos.coords.speed * 3.6) : 28.0;
          this.sendDriverLocation(driverId, lat, lng, speed, pos.coords.accuracy, pos.coords.heading || 0);
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(`✓ Coordenadas GPS del celular transmitidas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'success');
          }
          this.openDriverCockpitModal(driverId);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('Permiso de GPS no disponible en este entorno. Activando modo simulación en Maracaibo.', 'warning');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    simulateDriverAdvance(driverId) {
      const allDrivers = this.getAllDrivers();
      const driver = allDrivers.find(d => d.id === driverId);
      if (!driver) return;

      const loc = driver.current_location || { lat: 10.6655, lng: -71.6045 };
      const hqLat = 10.6698;
      const hqLng = -71.6052;

      // Avanzar hacia la Sede Central
      const newLat = loc.lat + (hqLat - loc.lat) * 0.35;
      const newLng = loc.lng + (hqLng - loc.lng) * 0.35;

      this.sendDriverLocation(driverId, newLat, newLng, 32.0, 5.0, 15.0);
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🚗 Unidad en movimiento reportada. Nuevo cálculo de llegada (ETA) actualizado.`, 'success');
      }
      this.openDriverCockpitModal(driverId);
    }

    async sendDriverLocation(driverId, lat, lng, speed = 28.0, accuracy = 8.0, heading = 0.0) {
      try {
        const res = await fetch('/api/v1/misipet/drivers/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driver_id: driverId,
            lat: lat,
            lng: lng,
            speed_kmh: speed,
            accuracy_m: accuracy,
            heading: heading
          })
        });
        if (res.ok) {
          await this.syncDriversFromBackend();
        }
      } catch (e) {
        console.warn('Error sending location:', e);
      }
    }

    async startSampleTrip(driverId) {
      try {
        const res = await fetch('/api/v1/misipet/drivers/trip/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driver_id: driverId,
            customer_name: 'Dalybell Ramírez Montilla',
            pet_name: 'Princesa',
            origin_address: 'Sector Don Bosco (Avenida 3E con Calle 67)',
            destination_address: 'Sede Central Mrs. Pets (Av. 2 El Milagro)',
            dest_lat: 10.6698,
            dest_lng: -71.6052
          })
        });
        if (res.ok) {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('🚀 Traslado asignado con éxito. Cálculo de ETA activo.', 'success');
          }
          await this.syncDriversFromBackend();
          this.openDriverCockpitModal(driverId);
        }
      } catch (e) {
        console.warn('Error starting trip:', e);
      }
    }

    async updateTripStatus(driverId, status) {
      try {
        const res = await fetch('/api/v1/misipet/drivers/trip/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driver_id: driverId, status: status })
        });
        if (res.ok) {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(`✓ Estado del viaje actualizado a: ${status.toUpperCase()}`, 'success');
          }
          await this.syncDriversFromBackend();
          this.openDriverCockpitModal(driverId);
        }
      } catch (e) {
        console.warn('Error updating trip status:', e);
      }
    }

    // =========================================================================
    // VISOR DE SEGUIMIENTO EN VIVO & ETA PARA EL CLIENTE
    // =========================================================================

    openDriverLiveTrackingModal(driverId) {
      const allDrivers = this.getAllDrivers();
      const driver = allDrivers.find(d => d.id === driverId) || allDrivers[0];
      if (!driver) return;

      let modal = document.getElementById('modal-driver-live-tracking');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-driver-live-tracking';
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.8); display:flex; align-items:center; justify-content:center; z-index:999999; backdrop-filter:blur(8px);';
        document.body.appendChild(modal);
      }

      const loc = driver.current_location || { lat: 10.6698, lng: -71.6052, speed_kmh: 28.0 };
      const etaText = driver.eta_to_hq ? driver.eta_to_hq.formatted_eta : (driver.active_trip ? driver.active_trip.formatted_eta : '~4 min (1.2 km)');

      modal.innerHTML = `
        <div style="background:#ffffff; border:2px solid #38BDF8; border-radius:26px; width:92%; max-width:560px; padding:28px; box-shadow:0 25px 60px rgba(0,0,0,0.35); position:relative; overflow:hidden;">
          <div style="position:absolute; top:0; left:0; width:100%; height:8px; background:linear-gradient(90deg, #38BDF8, #818CF8, #34D399);"></div>
          
          <button type="button" onclick="document.getElementById('modal-driver-live-tracking').style.display='none'" style="position:absolute; top:16px; right:18px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b; font-weight:700;">✕</button>

          <div style="text-align:center; margin-bottom:18px; margin-top:6px;">
            <div style="font-size:0.72rem; font-weight:800; color:#0284c7; text-transform:uppercase; letter-spacing:0.12em;">
              SEGUIMIENTO SATELITAL EN TIEMPO REAL
            </div>
            <h3 style="font-size:1.35rem; font-weight:900; color:#0f172a; margin:4px 0 2px 0;">
              🛰️ Radar GPS de Chofer VIP
            </h3>
            <div style="font-size:0.78rem; color:#64748b;">
              Estimación de arribo geodésico Haversine ajustado al tránsito de Maracaibo (1.35x)
            </div>
          </div>

          <!-- BANNER DE RADAR Y TIEMPO ESTIMADO -->
          <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius:20px; padding:22px; color:#ffffff; margin-bottom:18px; text-align:center; position:relative; overflow:hidden; border:1.5px solid #38BDF8;">
            <div style="position:absolute; top:12px; right:14px; display:flex; align-items:center; gap:6px;">
              <span style="width:10px; height:10px; border-radius:50%; background:#10B981; display:inline-block; box-shadow:0 0 10px #10B981;"></span>
              <span style="font-size:0.7rem; font-weight:800; color:#34D399;">SEÑAL GPS EN VIVO</span>
            </div>

            <div style="font-size:0.8rem; font-weight:800; color:#94A3B8; text-transform:uppercase;">
              TIEMPO ESTIMADO DE LLEGADA (ETA)
            </div>
            <div style="font-size:2.3rem; font-weight:900; color:#38BDF8; margin:6px 0;">
              ${etaText}
            </div>
            <div style="font-size:0.82rem; color:#E2E8F0;">
              Destino: <b>Sede Mrs. Pets (Avenida 2 El Milagro)</b>
            </div>

            <!-- SIMULACIÓN DE RUTA VISUAL -->
            <div style="margin-top:16px; background:rgba(255,255,255,0.06); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
              <div style="text-align:left;">
                <div style="color:#94A3B8;">Origen / Sector</div>
                <div style="font-weight:800; color:#ffffff;">📍 ${driver.sector}</div>
              </div>
              <div style="color:#38BDF8; font-weight:900; font-size:1rem;">➔ 🚗 ➔</div>
              <div style="text-align:right;">
                <div style="color:#94A3B8;">Punto de Encuentro</div>
                <div style="font-weight:800; color:#34D399;">🏥 Sede Central</div>
              </div>
            </div>
          </div>

          <!-- DETALLES DE IDENTIFICACIÓN Y SEGURIDAD -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:16px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="${driver.photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(driver.name) + '&background=111827&color=D4AF37')}" alt="${driver.name}" style="width:52px; height:52px; border-radius:16px; object-fit:cover; border:2px solid #D4AF37;" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=111827&color=D4AF37';">
              <div style="flex:1;">
                <div style="font-size:0.95rem; font-weight:900; color:#0f172a;">${driver.name}</div>
                <div style="font-size:0.75rem; color:#475569;">Unidad: <b>${driver.vehicle || driver.fleet}</b> &nbsp;|&nbsp; Placas: <b style="color:#D4AF37; font-family:monospace;">${driver.plates || driver.rif}</b></div>
                <div style="font-size:0.72rem; color:#059669; font-weight:800; margin-top:2px;">✓ Identidad Aprobada por Gerencia General</div>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:10px;">
            <button type="button" onclick="document.getElementById('modal-driver-live-tracking').style.display='none'" class="btn" style="flex:1; background:#f1f5f9; color:#475569; padding:10px; border-radius:12px; font-weight:700; border:1px solid #cbd5e1; cursor:pointer;">
              Cerrar
            </button>
            <button type="button" onclick="document.getElementById('modal-driver-live-tracking').style.display='none'; limusinaVipEngine.contactDriverWhatsApp('${driver.id}')" class="btn" style="flex:2; background:#25D366; color:white; font-weight:900; padding:10px; border-radius:12px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(37,211,102,0.3);">
              💬 Escribir al Chofer por WhatsApp
            </button>
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    }

    // =========================================================================
    // GESTIÓN DE CONVENIOS DE TRANSPORTE ALIADOS (CREAR, EDITAR, ELIMINAR)
    // =========================================================================

    openNewCompanyModal() {
      this.renderCompanyModal(null);
    }

    openEditCompanyModal(companyId) {
      const comp = this.getAllCompanies().find(c => c.id === companyId);
      if (!comp) return;
      this.renderCompanyModal(comp);
    }

    renderCompanyModal(company = null) {
      const isEdit = !!company;
      let modal = document.getElementById('modal-transport-company');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-transport-company';
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.7); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(6px);';
        document.body.appendChild(modal);
      }

      const defaultFeaturesText = company && company.features ? company.features.join('\n') : 
        'Capacidad para traslados múltiples y familias de mascotas\nMonitoreo y trazabilidad garantizada por GPS\nProtocolo sanitario y desinfección biológica en cada traslado\nSeguro de responsabilidad civil y póliza de traslado veterinario';

      const photoSrc = company ? (company.photo || '') : '';

      modal.innerHTML = `
        <div style="background:#ffffff; border:2px solid #4A6B5D; border-radius:24px; width:92%; max-width:620px; padding:28px; box-shadow:0 24px 60px rgba(0,0,0,0.3); max-height:92vh; overflow-y:auto; position:relative;">
          <div style="position:absolute; top:0; left:0; width:100%; height:6px; background:linear-gradient(90deg, #4A6B5D, #D4AF37, #2D433A);"></div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
            <div>
              <div style="font-size:0.72rem; font-weight:800; color:#4A6B5D; text-transform:uppercase; letter-spacing:0.08em;">
                CONVENIOS AUTORIZADOS POR GERENCIA
              </div>
              <h3 style="font-size:1.3rem; font-weight:900; color:#0f172a; margin:2px 0 0 0; display:flex; align-items:center; gap:8px;">
                <span>${isEdit ? '✏️ Editar Convenio de Transporte' : '🏢 Crear Nuevo Convenio de Transporte Aliado'}</span>
              </h3>
            </div>
            <button type="button" onclick="document.getElementById('modal-transport-company').style.display='none'" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:#94a3b8; font-weight:700;">✕</button>
          </div>

          <form onsubmit="limusinaVipEngine.saveCompanyForm(event)">
            <input type="hidden" id="comp-form-id" value="${company ? company.id : ''}">

            <!-- LOGO / FOTOGRAFÍA DE LA EMPRESA O UNIDAD -->
            <div style="background:rgba(74,107,93,0.06); border:1.5px dashed #4A6B5D; border-radius:18px; padding:14px 16px; margin-bottom:16px;">
              <label style="font-size:0.78rem; font-weight:900; color:#1e293b; display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                📸 Logo Institucional o Fotografía de la Flota
              </label>
              <div style="font-size:0.72rem; color:#64748b; margin-bottom:10px;">
                Aparecerá en la credencial y ficha del convenio consultada por el tutor.
              </div>

              <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
                <div id="comp-form-photo-preview" style="width:68px; height:68px; border-radius:16px; border:2px solid #4A6B5D; background:#111827; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; color:#D4AF37; font-size:1.8rem;">
                  ${photoSrc ? `<img src="${photoSrc}" style="width:100%; height:100%; object-fit:cover;" alt="Logo Empresa">` : '🏢'}
                </div>

                <div style="flex:1; min-width:220px;">
                  <div style="display:flex; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                    <label class="btn" style="background:#111827; color:#D4AF37; border:1px solid #D4AF37; font-weight:800; font-size:0.74rem; border-radius:8px; padding:6px 12px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                      📁 Subir Imagen
                      <input type="file" id="comp-form-photo-file" accept="image/*" onchange="limusinaVipEngine.handleCompanyLogoFile(event)" style="display:none;">
                    </label>
                    <button type="button" onclick="limusinaVipEngine.resetCompanyLogoPreview()" class="btn" style="background:#f1f5f9; color:#64748b; font-size:0.72rem; border-radius:8px; padding:6px 10px; border:1px solid #cbd5e1; cursor:pointer;">
                      ✕ Quitar
                    </button>
                  </div>
                  <input type="url" id="comp-form-photo-url" class="form-input" placeholder="O introduce una URL de imagen (https://...)" value="${photoSrc}" oninput="limusinaVipEngine.handleCompanyLogoUrl(event)" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #cbd5e1; font-size:0.75rem;">
                  <input type="hidden" id="comp-form-photo-data" value="${photoSrc}">
                </div>
              </div>
            </div>

            <!-- DATOS BÁSICOS -->
            <div style="display:grid; grid-template-columns:2fr 1fr; gap:12px; margin-bottom:12px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:4px;">Nombre Comercial / Razón Social *</label>
                <input type="text" id="comp-form-name" class="form-input" placeholder="Ej. TransPet Maracaibo Express C.A." value="${company ? company.name : ''}" required style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.83rem;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:4px;">RIF Jurídico *</label>
                <input type="text" id="comp-form-rif" class="form-input" placeholder="J-41289012-3" value="${company ? company.rif : ''}" required style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.83rem;">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:4px;">Tipo de Convenio / Rol *</label>
                <input type="text" id="comp-form-role" class="form-input" placeholder="Ej. Empresa Certificada de Logística y Traslado Animal" value="${company ? company.role : 'Empresa Certificada de Logística y Traslado Animal'}" required style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.83rem;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:4px;">Teléfono WhatsApp (+58...) *</label>
                <input type="text" id="comp-form-phone" class="form-input" placeholder="+584146799510" value="${company ? company.phone : '+584146799510'}" required style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.83rem;">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:4px;">Flota Disponible *</label>
                <input type="text" id="comp-form-fleet" class="form-input" placeholder="Ej. 4 Vans Ejecutivas Climatizadas con Telemetría GPS" value="${company ? company.fleet : ''}" required style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.83rem;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:4px;">Sector / Cobertura en Maracaibo *</label>
                <input type="text" id="comp-form-sector" class="form-input" placeholder="Gran Maracaibo, Maracaibo Norte, San Francisco" value="${company ? company.sector : 'Gran Maracaibo'}" required style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.83rem;">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:4px;">Aval Gerencial / Aprobación</label>
                <input type="text" id="comp-form-approval" class="form-input" placeholder="Convenio Corporativo Vigente • Gerencia General Mrs. Pets" value="${company ? company.approval : 'Convenio Corporativo Vigente • Gerencia General Mrs. Pets'}" style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.83rem;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:4px;">Estatus del Convenio</label>
                <select id="comp-form-status" class="form-input" style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.83rem;">
                  <option value="EMPRESA APROBADA POR GERENCIA" ${company && company.status === 'EMPRESA APROBADA POR GERENCIA' ? 'selected' : ''}>🛡️ EMPRESA APROBADA POR GERENCIA (Dorado)</option>
                  <option value="RED DE EMERGENCIAS APROBADA" ${company && company.status === 'RED DE EMERGENCIAS APROBADA' ? 'selected' : ''}>🚨 RED DE EMERGENCIAS APROBADA (Rojo)</option>
                  <option value="CONVENIO ACTIVO" ${company && company.status === 'CONVENIO ACTIVO' ? 'selected' : ''}>✅ CONVENIO ACTIVO (Verde)</option>
                  <option value="EN REVISIÓN GERENCIAL" ${company && company.status === 'EN REVISIÓN GERENCIAL' ? 'selected' : ''}>⏳ EN REVISIÓN GERENCIAL (Amarillo)</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom:16px;">
              <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:4px;">
                Características / Cláusulas del Convenio (Una por línea)
              </label>
              <textarea id="comp-form-features" rows="4" class="form-input" placeholder="Escriba cada característica o condición en una línea..." style="width:100%; padding:10px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.8rem; font-family:inherit;">${defaultFeaturesText}</textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e2e8f0; padding-top:14px;">
              <button type="button" onclick="document.getElementById('modal-transport-company').style.display='none'" class="btn" style="background:#F1F5F9; color:#475569; font-weight:700; padding:10px 18px; border-radius:10px; border:1px solid #CBD5E1; cursor:pointer;">
                Cancelar
              </button>
              <button type="submit" class="btn" style="background:linear-gradient(135deg, #4A6B5D, #2D433A); color:#ffffff; font-weight:900; padding:10px 22px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(74,107,93,0.3); display:inline-flex; align-items:center; gap:6px;">
                💾 ${isEdit ? 'Actualizar Convenio' : 'Guardar Convenio Autorizado'}
              </button>
            </div>
          </form>
        </div>
      `;
      modal.style.display = 'flex';
    }

    saveCompanyForm(event) {
      if (event && event.preventDefault) event.preventDefault();

      const existingId = document.getElementById('comp-form-id')?.value?.trim();
      const name = document.getElementById('comp-form-name')?.value?.trim();
      const rif = document.getElementById('comp-form-rif')?.value?.trim();
      const role = document.getElementById('comp-form-role')?.value?.trim();
      const phone = document.getElementById('comp-form-phone')?.value?.trim() || '';
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const fleet = document.getElementById('comp-form-fleet')?.value?.trim();
      const sector = document.getElementById('comp-form-sector')?.value?.trim();
      const approval = document.getElementById('comp-form-approval')?.value?.trim() || 'Convenio Autorizado por Gerencia Mrs. Pets';
      const status = document.getElementById('comp-form-status')?.value || 'EMPRESA APROBADA POR GERENCIA';
      const rawFeatures = document.getElementById('comp-form-features')?.value || '';
      const features = rawFeatures.split('\n').map(f => f.trim()).filter(f => f.length > 0);

      const photoData = document.getElementById('comp-form-photo-data')?.value?.trim() || 
                        document.getElementById('comp-form-photo-url')?.value?.trim() || 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Empresa')}&background=4A6B5D&color=FFFFFF&bold=true`;

      if (!name || !rif) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('Por favor ingrese el Nombre y RIF de la empresa.', 'warning');
        }
        return;
      }

      let statusColor = '#D4AF37';
      if (status === 'RED DE EMERGENCIAS APROBADA') statusColor = '#EF4444';
      else if (status === 'CONVENIO ACTIVO') statusColor = '#10B981';
      else if (status === 'EN REVISIÓN GERENCIAL') statusColor = '#F59E0B';

      const companyId = existingId || ('comp-' + Date.now());

      const companyObj = {
        id: companyId,
        name: name,
        rif: rif,
        role: role,
        fleet: fleet,
        sector: sector,
        phone: phone,
        cleanPhone: cleanPhone,
        status: status,
        statusColor: statusColor,
        type: 'company',
        avatar: '🏢',
        photo: photoData,
        approval: approval,
        features: features.length > 0 ? features : [
          'Capacidad para traslados múltiples y familias de mascotas',
          'Monitoreo y trazabilidad garantizada por GPS',
          'Protocolo sanitario y desinfección biológica en cada traslado'
        ]
      };

      if (!this.companies || this.companies.length === 0) {
        this.loadCompanies();
      }

      const existingIndex = this.companies.findIndex(c => c.id === companyId);
      if (existingIndex !== -1) {
        this.companies[existingIndex] = companyObj;
      } else {
        this.companies.push(companyObj);
      }

      this.saveCompanies();

      // Enviar al backend
      if (typeof fetch !== 'undefined') {
        fetch('/api/v1/limusina/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyObj)
        }).catch(err => console.warn('Error syncing company with backend:', err));
      }

      const modal = document.getElementById('modal-transport-company');
      if (modal) modal.style.display = 'none';

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✅ Convenio con '${name}' guardado y autorizado exitosamente.`, 'success');
      }

      this.renderPlatform();
    }

    confirmDeleteCompany(companyId, companyName) {
      const all = this.getAllCompanies();
      const comp = all.find(c => c.id === companyId);
      const name = comp ? comp.name : (companyName || 'Empresa de Transporte');
      const rif = comp ? comp.rif : '';

      let modal = document.getElementById('modal-confirm-delete-company');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-confirm-delete-company';
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.75); display:flex; align-items:center; justify-content:center; z-index:999999; backdrop-filter:blur(6px);';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="background:#ffffff; border:2px solid #EF4444; border-radius:24px; width:92%; max-width:480px; padding:28px; box-shadow:0 24px 60px rgba(0,0,0,0.35); position:relative; overflow:hidden;">
          <div style="position:absolute; top:0; left:0; width:100%; height:6px; background:linear-gradient(90deg, #EF4444, #DC2626, #B91C1C);"></div>
          
          <button type="button" onclick="document.getElementById('modal-confirm-delete-company').style.display='none'" style="position:absolute; top:16px; right:18px; background:none; border:none; font-size:1.4rem; cursor:pointer; color:#64748b; font-weight:700;">✕</button>

          <div style="text-align:center; margin-bottom:18px; margin-top:6px;">
            <div style="width:60px; height:60px; border-radius:18px; background:#FEE2E2; border:2px solid #FCA5A5; color:#DC2626; display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 12px auto;">
              🗑️
            </div>
            <div style="font-size:0.75rem; font-weight:800; color:#DC2626; text-transform:uppercase; letter-spacing:0.1em;">
              REVOCACIÓN DE CONVENIO CORPORATIVO
            </div>
            <h3 style="font-size:1.3rem; font-weight:900; color:#0f172a; margin:4px 0;">
              ¿Eliminar Convenio de Transporte?
            </h3>
          </div>

          <div style="background:#FFF5F5; border:1px solid #FED7D7; border-radius:14px; padding:14px 16px; margin-bottom:18px; font-size:0.82rem; color:#742A2A; line-height:1.45;">
            Está a punto de eliminar y revocar formalmente el convenio con:
            <div style="font-size:0.95rem; font-weight:900; color:#9B2C2C; margin:6px 0 2px 0;">
              🏢 ${name}
            </div>
            ${rif ? `<div style="font-size:0.76rem; font-weight:700; color:#C53030; margin-bottom:6px;">RIF: ${rif}</div>` : ''}
            Esta empresa dejará de figurar entre los aliados autorizados por la gerencia para traslados y emergencias en la plataforma de Limusina VIP.
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button type="button" onclick="document.getElementById('modal-confirm-delete-company').style.display='none'" class="btn" style="background:#F1F5F9; color:#475569; font-weight:700; padding:10px 18px; border-radius:12px; border:1px solid #CBD5E1; cursor:pointer;">
              Cancelar
            </button>
            <button type="button" onclick="limusinaVipEngine.deleteCompany('${companyId}')" class="btn" style="background:linear-gradient(135deg, #EF4444, #DC2626); color:#ffffff; font-weight:900; padding:10px 22px; border-radius:12px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(220,38,38,0.35); display:inline-flex; align-items:center; gap:6px;">
              🗑️ Sí, Eliminar Convenio
            </button>
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    }

    deleteCompany(companyId) {
      if (!this.companies || this.companies.length === 0) {
        this.loadCompanies();
      }

      const compIndex = this.companies.findIndex(c => c.id === companyId);
      const compName = compIndex !== -1 ? this.companies[compIndex].name : 'Convenio de Transporte';

      if (compIndex !== -1) {
        this.companies.splice(compIndex, 1);
        this.saveCompanies();
      }

      // Backend deletion
      if (typeof fetch !== 'undefined') {
        fetch(`/api/v1/limusina/companies/${companyId}`, {
          method: 'DELETE'
        }).catch(() => {
          fetch('/api/v1/limusina/companies/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: companyId })
          }).catch(() => {});
        });
      }

      const modal = document.getElementById('modal-confirm-delete-company');
      if (modal) modal.style.display = 'none';

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🗑️ Convenio con '${compName}' revocado y eliminado con éxito.`, 'info');
      }

      this.renderPlatform();
    }

    handleCompanyLogoFile(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('Seleccione un archivo de imagen válido (PNG, JPG o WEBP)', 'warning');
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result;
        const previewEl = document.getElementById('comp-form-photo-preview');
        const hiddenDataEl = document.getElementById('comp-form-photo-data');
        if (previewEl) {
          previewEl.innerHTML = `<img src="${base64Data}" style="width:100%; height:100%; object-fit:cover;" alt="Logo Empresa">`;
          previewEl.style.border = '2px solid #10B981';
        }
        if (hiddenDataEl) hiddenDataEl.value = base64Data;
      };
      reader.readAsDataURL(file);
    }

    handleCompanyLogoUrl(event) {
      const url = event.target.value.trim();
      const previewEl = document.getElementById('comp-form-photo-preview');
      const hiddenDataEl = document.getElementById('comp-form-photo-data');
      if (!url) {
        this.resetCompanyLogoPreview();
        return;
      }
      if (previewEl) {
        previewEl.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;" alt="Logo Empresa" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Empresa&background=4A6B5D&color=FFFFFF';">`;
        previewEl.style.border = '2px solid #10B981';
      }
      if (hiddenDataEl) hiddenDataEl.value = url;
    }

    resetCompanyLogoPreview() {
      const previewEl = document.getElementById('comp-form-photo-preview');
      const hiddenDataEl = document.getElementById('comp-form-photo-data');
      const urlEl = document.getElementById('comp-form-photo-url');
      const fileEl = document.getElementById('comp-form-photo-file');
      if (previewEl) {
        previewEl.innerHTML = '🏢';
        previewEl.style.border = '2px solid #4A6B5D';
      }
      if (hiddenDataEl) hiddenDataEl.value = '';
      if (urlEl) urlEl.value = '';
      if (fileEl) fileEl.value = '';
    }
  }

  // Instanciación y exportación global
  window.limusinaVipEngine = new LimusinaVipEngine();

  document.addEventListener('DOMContentLoaded', () => {
    window.limusinaVipEngine.init();
  });

})(window);
