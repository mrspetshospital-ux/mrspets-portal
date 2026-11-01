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
    }

    init() {
      this.loadCustomDrivers();
      this.renderPlatform();
      console.log('[LimusinaVipEngine] Inicializada plataforma de Choferes VIP & Empresas por WhatsApp.');
    }

    loadCustomDrivers() {
      try {
        const savedDrivers = localStorage.getItem('mrs_pets_custom_chauffeurs');
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

    getAllDrivers() {
      return [...this.defaultDrivers, ...(this.customDrivers || [])];
    }

    getAllCompanies() {
      return this.defaultCompanies;
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
              <a href="https://wa.me/584146799510?text=Hola%20Central%20Mrs.%20Pets%2C%20deseo%20asistencia%20inmediata%20para%20despacho%20de%20Limusina%20VIP." target="_blank" rel="noopener noreferrer" class="btn" style="background:#25D366; color:white; font-weight:800; border-radius:14px; padding:12px 20px; display:inline-flex; align-items:center; gap:8px; text-decoration:none; box-shadow:0 4px 14px rgba(37,211,102,0.3);">
                💬 Central WhatsApp (+58 414-6799510)
              </a>
              <button type="button" class="btn" onclick="limusinaVipEngine.openNewDriverModal()" style="background:rgba(212,175,55,0.15); border:1.5px solid #D4AF37; color:#D4AF37; font-weight:800; border-radius:14px; padding:12px 18px; cursor:pointer;">
                ➕ Registrar Chofer / Empresa
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
                  <optgroup label="Choferes VIP Aprobados">
                    <option value="carlos-mendoza" selected>Carlos Mendoza — Mercedes Sprinter VIP (El Milagro)</option>
                    <option value="javier-villalobos">Javier Villalobos — Chevrolet Suburban (Las Delicias)</option>
                    <option value="mariangel-rincon">Mariangel Rincón — Toyota Fortuner (La Lago)</option>
                    <option value="roberto-morales">Roberto Morales — Ford Explorer (Guardia 24/7)</option>
                  </optgroup>
                  <optgroup label="Empresas de Servicios Aliadas">
                    <option value="transpet-express">TransPet Maracaibo Express C.A. (Flota 4 Vans)</option>
                    <option value="vip-pet-ride">VIP Pet Ride Venezuela (SUVs Híbridas)</option>
                    <option value="ambupet-urgencias">AmbuPet 24/7 Urgencias Móviles (Ambulancia)</option>
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
                    </div>

                    <div style="font-size:0.72rem; color:#047857; background:rgba(4,120,87,0.06); padding:6px 10px; border-radius:8px; border:1px dashed #047857; margin-bottom:14px; font-weight:700;">
                      ✓ ${d.approval}
                    </div>

                    <ul style="margin:0 0 16px 0; padding-left:18px; font-size:0.74rem; color:#475569; line-height:1.45;">
                      ${d.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                  </div>

                  <div style="display:flex; gap:6px; margin-top:12px; pt-2; border-top:1px solid #f1f5f9; flex-wrap:wrap;">
                    <button type="button" class="btn" onclick="limusinaVipEngine.contactDriverWhatsApp('${d.id}')" style="flex:2; min-width:130px; background:#25D366; color:white; font-weight:800; font-size:0.8rem; border-radius:10px; padding:10px 10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 2px 8px rgba(37,211,102,0.25);">
                      💬 WhatsApp
                    </button>
                    <button type="button" class="btn" onclick="limusinaVipEngine.openDriverCredentialModal('${d.id}')" title="Ver Carnet con Foto para Identificar Chofer" style="flex:1; min-width:85px; background:#ffffff; color:#D4AF37; font-weight:800; font-size:0.76rem; border-radius:10px; padding:10px 6px; border:1.5px solid #D4AF37; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:3px;">
                      🪪 Carnet
                    </button>
                    <button type="button" class="btn" onclick="limusinaVipEngine.testInWhatsAppSimulator('${d.id}')" title="Probar en Simulador de WhatsApp" style="flex:1; min-width:75px; background:#f1f5f9; color:#334155; font-weight:700; font-size:0.76rem; border-radius:10px; padding:10px 6px; border:1px solid #cbd5e1; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:3px;">
                      📱 Chat
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- SECCIÓN 2: EMPRESAS DE SERVICIO ALIADAS -->
        ${filteredCompanies.length > 0 ? `
          <div style="margin-bottom:32px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
              <span style="font-size:1.3rem;">🏢</span>
              <h3 style="font-size:1.25rem; font-weight:900; color:#1e293b; margin:0;">
                Empresas de Transporte Aliadas (Convenios Autorizados por Gerencia)
              </h3>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
              ${filteredCompanies.map(c => `
                <div class="card" style="background:#ffffff; border:1.5px solid #4A6B5D; border-radius:20px; padding:22px; box-shadow:0 4px 16px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                      <div style="display:flex; align-items:center; gap:12px;">
                        <div style="position:relative; width:52px; height:52px; flex-shrink:0; cursor:pointer;" onclick="limusinaVipEngine.openDriverCredentialModal('${c.id}')" title="Ver credencial de la empresa">
                          <img src="${c.photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name) + '&background=4A6B5D&color=FFFFFF')}" alt="${c.name}" style="width:52px; height:52px; border-radius:16px; object-fit:cover; border:2px solid #4A6B5D; box-shadow:0 3px 10px rgba(0,0,0,0.12);" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=4A6B5D&color=FFFFFF';">
                          <span style="position:absolute; bottom:-2px; right:-2px; background:#D4AF37; border:2px solid #ffffff; width:13px; height:13px; border-radius:50%;" title="Empresa Verificada"></span>
                        </div>
                        <div>
                          <h4 style="font-size:1.05rem; font-weight:900; color:#0f172a; margin:0; display:flex; align-items:center; gap:6px;">
                            ${c.name}
                            <span style="font-size:0.68rem; font-weight:800; background:rgba(74,107,93,0.12); color:#4A6B5D; border:1px solid #4A6B5D; border-radius:6px; padding:2px 6px; cursor:pointer;" onclick="limusinaVipEngine.openDriverCredentialModal('${c.id}')" title="Credencial Institucional">🏢 Empresa</span>
                          </h4>
                          <div style="font-size:0.75rem; color:#4A6B5D; font-weight:700; margin-top:2px;">${c.rif} • ${c.role}</div>
                        </div>
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
                      ${c.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                  </div>

                  <div style="display:flex; gap:6px; margin-top:12px; pt-2; border-top:1px solid #f1f5f9; flex-wrap:wrap;">
                    <button type="button" class="btn" onclick="limusinaVipEngine.contactDriverWhatsApp('${c.id}')" style="flex:2; min-width:130px; background:#25D366; color:white; font-weight:800; font-size:0.8rem; border-radius:10px; padding:10px 10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 2px 8px rgba(37,211,102,0.25);">
                      💬 WhatsApp
                    </button>
                    <button type="button" class="btn" onclick="limusinaVipEngine.openDriverCredentialModal('${c.id}')" title="Ver Credencial Institucional" style="flex:1; min-width:85px; background:#ffffff; color:#4A6B5D; font-weight:800; font-size:0.76rem; border-radius:10px; padding:10px 6px; border:1.5px solid #4A6B5D; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:3px;">
                      🪪 Carnet
                    </button>
                    <button type="button" class="btn" onclick="limusinaVipEngine.testInWhatsAppSimulator('${c.id}')" title="Probar en Simulador" style="flex:1; min-width:75px; background:#f1f5f9; color:#334155; font-weight:700; font-size:0.76rem; border-radius:10px; padding:10px 6px; border:1px solid #cbd5e1; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:3px;">
                      📱 Chat
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

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

      container.style.display = 'flex';
      container.innerHTML = `
        <div style="position:relative; width:56px; height:56px; flex-shrink:0; cursor:pointer;" onclick="limusinaVipEngine.openDriverCredentialModal('${driver.id}')" title="Clic para ver foto ampliada y credencial de identificación">
          <img src="${driver.photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(driver.name) + '&background=111827&color=D4AF37')}" alt="${driver.name}" style="width:56px; height:56px; border-radius:16px; object-fit:cover; border:2.5px solid #D4AF37; box-shadow:0 3px 10px rgba(0,0,0,0.15);" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=111827&color=D4AF37';">
          <span style="position:absolute; bottom:-2px; right:-2px; background:#10B981; border:2px solid #ffffff; width:14px; height:14px; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,0.2);" title="Identidad Verificada"></span>
        </div>

        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
            <div style="font-size:0.9rem; font-weight:900; color:#0f172a; display:flex; align-items:center; gap:6px;">
              📸 Chofer Asignado: <b>${driver.name}</b>
            </div>
            <span style="font-size:0.7rem; font-weight:800; color:#059669; background:rgba(16,185,129,0.12); border:1px solid #10b981; padding:2px 8px; border-radius:8px;">
              ✓ Rostro Verificado para el Cliente
            </span>
          </div>
          <div style="font-size:0.75rem; color:#475569; margin-top:3px;">
            Unidad: <b>${driver.vehicle || driver.fleet}</b> &nbsp;|&nbsp; Placas: <b style="color:#D4AF37; font-family:monospace; font-size:0.85rem;">${driver.plates || driver.rif}</b> &nbsp;|&nbsp; Sector Base: <b>${driver.sector}</b>
          </div>
          <div style="font-size:0.71rem; color:#64748b; margin-top:2px;">
            💡 <em>Al arribar el vehículo a su domicilio, confirme que el rostro del chofer y las placas coincidan con esta ficha.</em>
          </div>
        </div>

        <div>
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

      const newDriver = {
        id: 'custom-' + Date.now(),
        name: name,
        role: type === 'company' ? 'Empresa de Transporte Aliada' : 'Pet Chauffeur Certificado',
        vehicle: vehicle,
        plates: plates,
        sector: sector,
        phone: phone,
        cleanPhone: cleanPhone,
        rating: '5.0',
        trips: 0,
        status: 'DISPONIBLE AHORA',
        statusClass: 'status-online',
        statusColor: '#10B981',
        type: type,
        avatar: type === 'company' ? '🏢' : '👨‍✈️',
        photo: photoData,
        approval: `${cert} (Doc: ${doc})`,
        features: [
          'Vehículo climatizado e inspeccionado por staff técnico',
          'Conexión directa por WhatsApp oficial',
          'Fotografía y credencial verificadas para reconocimiento del cliente',
          'Monitoreo y trazabilidad garantizada'
        ]
      };

      this.customDrivers = this.customDrivers || [];
      this.customDrivers.push(newDriver);

      try {
        localStorage.setItem('mrs_pets_custom_chauffeurs', JSON.stringify(this.customDrivers));
      } catch (e) {
        console.warn('Error saving custom chauffeur:', e);
      }

      document.getElementById('modal-new-chauffeur').style.display = 'none';

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✓ Nuevo ${type === 'company' ? 'convenio empresarial' : 'chofer'} '${name}' registrado con foto para identificación del cliente.`, 'success');
      }

      this.renderPlatform();
    }
  }

  // Instanciación y exportación global
  window.limusinaVipEngine = new LimusinaVipEngine();

  document.addEventListener('DOMContentLoaded', () => {
    window.limusinaVipEngine.init();
  });

})(window);
