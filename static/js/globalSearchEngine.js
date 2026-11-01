/* ==========================================================================
   GLOBAL SEARCH ENGINE — MRS. PETS MARACAIBO OMNICHANNEL PLATFORM
   Buscador Unificado Inteligente: Mascotas, Clientes, Servicios, Tienda & Logs
   Silent Luxury Architecture • High Contrast & Full Keyboard Accessibility
   ========================================================================== */

class GlobalSearchEngine {
  constructor() {
    this.inputEl = null;
    this.dropdownEl = null;
    this.clearBtnEl = null;
    this.wrapperEl = null;
    this.selectedIndex = -1;
    this.currentResults = [];
    this.isOpen = false;
    this.debounceTimer = null;

    // Catálogo maestro de servicios y áreas de Mrs. Pets
    this.servicesCatalog = [
      {
        id: 'serv-grooming',
        type: 'service',
        category: 'Spa & Estética',
        title: 'Spa & Grooming VIP (7 Estaciones)',
        description: 'Circuito completo: Ozonoterapia, corte estilizado, baño relajante e hidratación de pulpejos.',
        badge: 'Servicio Spa',
        badgeBg: '#FEF3C7',
        badgeColor: '#B45309',
        icon: '🛁',
        action: () => {
          if (window.clinicaEngine && typeof window.clinicaEngine.openGroomingBookingModal === 'function') {
            window.clinicaEngine.openGroomingBookingModal('Circuito Grooming Spa 7 Estaciones');
          } else if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('pet-status', false, null, 'grooming');
          }
        }
      },
      {
        id: 'serv-clinica',
        type: 'service',
        category: 'Salud & Medicina',
        title: 'Clínica Veterinaria & Quirófano Especializado',
        description: 'Consultas especializadas, medicina interna, ecografía doppler, rayos X digital y laboratorio.',
        badge: 'Salud 24/7',
        badgeBg: '#DCFCE7',
        badgeColor: '#15803D',
        icon: '🩺',
        action: () => {
          if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('clinica');
          }
        }
      },
      {
        id: 'serv-hotel',
        type: 'service',
        category: 'Hospedaje de Lujo',
        title: 'Hotel Canino & Felino (Suites Bioclimáticas)',
        description: 'Alojamiento 5 estrellas con climatización purificada, monitoreo en vivo y recreación asistida.',
        badge: 'Hotel 5★',
        badgeBg: '#F3E8FF',
        badgeColor: '#7E22CE',
        icon: '🏨',
        action: () => {
          if (window.clinicaEngine && typeof window.clinicaEngine.openHotelBookingModal === 'function') {
            window.clinicaEngine.openHotelBookingModal('Suite Royal Bioclimática #4');
          } else if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('pet-status');
          }
        }
      },
      {
        id: 'serv-limusina',
        type: 'service',
        category: 'Transporte VIP',
        title: 'Limusina Mrs. Pets (Pet Taxi Ejecutivo)',
        description: 'Traslado exclusivo puerta a puerta con cabina presurizada, cinturón de seguridad canino y clima.',
        badge: 'VIP Mobility',
        badgeBg: '#FEF9C3',
        badgeColor: '#A16207',
        icon: '🚗',
        action: () => {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('🚗 Servicio Limusina Mrs. Pets: Coordinando chofer VIP asignado...', 'success');
          }
          if (window.whatsappSim && typeof window.whatsappSim.sendMessage === 'function') {
            window.whatsappSim.sendMessage('Hola Leia, deseo coordinar el servicio de Limusina Mrs. Pets para recogida en domicilio.');
          }
          if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('playground');
          }
        }
      },
      {
        id: 'serv-store',
        type: 'service',
        category: 'Pet Shop & Boutique',
        title: 'Boutique & Farmacia Veterinaria',
        description: 'Alimentos premium importados, fármacos certificados, accesorios de lujo y snacks naturales.',
        badge: 'E-Commerce',
        badgeBg: '#FFE4E6',
        badgeColor: '#BE123C',
        icon: '🛍️',
        action: () => {
          if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('store');
          }
        }
      },
      {
        id: 'serv-call-logs',
        type: 'service',
        category: 'Auditoría & CRM',
        title: 'Historial Omnicanal & Inbox Audit',
        description: 'Registro en tiempo real de llamadas VoIP, chats de WhatsApp, transcripciones y takeover humano.',
        badge: 'Omnicanal',
        badgeBg: '#E0E7FF',
        badgeColor: '#3730A3',
        icon: '📞',
        action: () => {
          if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('call-logs');
          }
        }
      },
      {
        id: 'serv-analytics',
        type: 'service',
        category: 'Control Gerencial',
        title: 'Telemetría Six Sigma & Auditoría de Staff',
        description: 'Tiempos de ciclo por estación, índice DPU de calidad clínica y trazabilidad de colaboradores.',
        badge: 'Six Sigma',
        badgeBg: '#F1F5F9',
        badgeColor: '#0F172A',
        icon: '📊',
        action: () => {
          if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('analytics');
          }
        }
      },
      {
        id: 'serv-integrations',
        type: 'service',
        category: 'Infraestructura API',
        title: 'Endpoints & Conexiones Make.com',
        description: 'Webhooks omnicanal de WhatsApp Cloud API, Retell Voice AI, Stripe, PayPal y Google Sheets.',
        badge: 'Integraciones',
        badgeBg: '#ECFDF5',
        badgeColor: '#065F46',
        icon: '🔗',
        action: () => {
          if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('integrations');
          }
        }
      },
      {
        id: 'serv-admin-crm',
        type: 'service',
        category: 'Base de Datos CRM',
        title: 'Gestor de Clientes & Pacientes (Back-Office)',
        description: 'Base de datos auditable con RIF, WhatsApp, correos, turnos en vivo y gestión de permisos staff.',
        badge: 'Staff Only',
        badgeBg: '#FEF3C7',
        badgeColor: '#92400E',
        icon: '👥',
        action: () => {
          if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('admin');
          }
        }
      }
    ];
  }

  init() {
    this.inputEl = document.getElementById('global-search-input');
    this.dropdownEl = document.getElementById('global-search-dropdown');
    this.clearBtnEl = document.getElementById('global-search-clear-btn');
    this.wrapperEl = document.getElementById('global-search-wrapper');

    if (!this.inputEl || !this.dropdownEl) {
      console.warn('[GlobalSearchEngine] Elementos de búsqueda no encontrados en el DOM.');
      return;
    }

    // Eventos del input
    this.inputEl.addEventListener('input', (e) => this.handleInput(e.target.value));
    this.inputEl.addEventListener('focus', () => this.handleFocus());
    this.inputEl.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (this.wrapperEl && !this.wrapperEl.contains(e.target)) {
        this.close();
      }
    });

    // Atajo de teclado global: "/" o "Cmd+K / Ctrl+K"
    document.addEventListener('keydown', (e) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
          document.activeElement !== this.inputEl &&
          !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        this.inputEl.focus();
        this.inputEl.select();
        this.handleFocus();
      }
    });

    console.log('🔍 [GlobalSearchEngine] Motor de búsqueda global Mrs. Pets inicializado.');
  }

  handleFocus() {
    const val = (this.inputEl.value || '').trim();
    if (!val) {
      this.renderQuickShortcuts();
    } else {
      this.performSearch(val);
    }
  }

  handleInput(val) {
    const query = (val || '').trim();
    if (this.clearBtnEl) {
      this.clearBtnEl.style.display = query.length > 0 ? 'block' : 'none';
    }

    clearTimeout(this.debounceTimer);
    if (!query) {
      this.renderQuickShortcuts();
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 120);
  }

  clear() {
    if (this.inputEl) {
      this.inputEl.value = '';
      this.inputEl.focus();
    }
    if (this.clearBtnEl) {
      this.clearBtnEl.style.display = 'none';
    }
    this.renderQuickShortcuts();
  }

  close() {
    if (this.dropdownEl) {
      this.dropdownEl.style.display = 'none';
    }
    this.isOpen = false;
    this.selectedIndex = -1;
  }

  open() {
    if (this.dropdownEl) {
      this.dropdownEl.style.display = 'block';
    }
    this.isOpen = true;
  }

  // --- MOTOR DE RECOPILACIÓN Y FILTRADO ---
  normalize(str) {
    if (!str) return '';
    return str.toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  performSearch(rawQuery) {
    const q = this.normalize(rawQuery);
    if (!q) {
      this.renderQuickShortcuts();
      return;
    }

    const results = [];

    // 1. MASCOTAS VIP / PACIENTES
    const petsSource = this.getPetsDataSource();
    petsSource.forEach(p => {
      const name = p.name || p.petName || 'Mascota VIP';
      const owner = p.owner || p.ownerName || 'Tutor VIP';
      const breed = p.breed || p.species || 'Canino';
      const area = (p.area || 'grooming').toLowerCase();
      const notes = p.notes || '';
      const id = p.id || '';

      const matchScore = this.calculateMatch(q, [name, owner, breed, area, notes, id]);
      if (matchScore > 0) {
        const areaLabel = area === 'grooming' ? 'Spa & Grooming' : (area === 'clinica' ? 'Clínica' : 'Hotel VIP');
        const stepName = this.resolvePetStepName(p);
        results.push({
          score: matchScore + 15, // Alta prioridad a las mascotas
          type: 'pet',
          category: 'Mascotas VIP (Pacientes)',
          id: p.id,
          title: `🐾 ${name}`,
          subtitle: `Tutor: <strong>${owner}</strong> • ${breed}`,
          meta: `Área: <span style="color:#d97706; font-weight:700;">${areaLabel}</span> | Estado: <strong>${stepName}</strong>`,
          image: p.photo || p.image || 'assets/hero_border_collie.jpg',
          badge: areaLabel,
          badgeBg: '#FEF3C7',
          badgeColor: '#B45309',
          action: () => {
            this.close();
            if (window.analytics && typeof window.analytics.openTraceabilityModal === 'function') {
              window.analytics.openTraceabilityModal(p.id);
            } else if (window.app && typeof window.app.switchTab === 'function') {
              window.app.switchTab('pet-status', false, null, area);
            }
          }
        });
      }
    });

    // 2. CLIENTES / TUTORES REGISTRADOS
    const tutorsMap = new Map();
    petsSource.forEach(p => {
      const owner = p.owner || p.ownerName;
      if (!owner || tutorsMap.has(owner.toLowerCase())) return;
      tutorsMap.set(owner.toLowerCase(), p);

      const rif = p.rif || '';
      const phone = p.ownerPhone || p.phone || '';
      const email = p.email || '';
      const petName = p.name || p.petName || 'Mascota';

      const matchScore = this.calculateMatch(q, [owner, rif, phone, email]);
      if (matchScore > 0) {
        results.push({
          score: matchScore + 10,
          type: 'client',
          category: 'Clientes & Tutores VIP (CRM)',
          id: `client-${p.id}`,
          title: `👤 ${owner}`,
          subtitle: `Cédula/RIF: <strong>${rif || 'V-Registrado'}</strong> • Tel: ${phone || 'Sin número'}`,
          meta: `Mascota Vinculada: 🐾 <strong>${petName}</strong> | Email: ${email || 'tutor@mrspets.com'}`,
          image: p.ownerPhoto || 'assets/leia_avatar.jpg',
          badge: 'Tutor VIP',
          badgeBg: '#DCFCE7',
          badgeColor: '#166534',
          action: () => {
            this.close();
            if (window.app && typeof window.app.switchTab === 'function') {
              window.app.switchTab('admin');
              setTimeout(() => {
                if (window.adminEngine && typeof window.adminEngine.filterClientDatabase === 'function') {
                  window.adminEngine.filterClientDatabase(owner);
                  const searchInp = document.querySelector('#admin-clients-database-container input');
                  if (searchInp) searchInp.value = owner;
                }
              }, 250);
            }
          }
        });
      }
    });

    // 3. SERVICIOS & SECCIONES DEL SISTEMA
    this.servicesCatalog.forEach(serv => {
      const matchScore = this.calculateMatch(q, [serv.title, serv.description, serv.category, serv.badge]);
      if (matchScore > 0) {
        results.push({
          score: matchScore + 8,
          type: serv.type,
          category: 'Servicios & Departamentos Mrs. Pets',
          id: serv.id,
          title: `${serv.icon} ${serv.title}`,
          subtitle: serv.description,
          meta: `Departamento: <strong>${serv.category}</strong>`,
          badge: serv.badge,
          badgeBg: serv.badgeBg,
          badgeColor: serv.badgeColor,
          action: () => {
            this.close();
            serv.action();
          }
        });
      }
    });

    // 4. PRODUCTOS DE LA TIENDA PET SHOP
    const productsSource = this.getProductsDataSource();
    productsSource.forEach(prod => {
      const name = prod.name || prod.title || 'Producto';
      const cat = prod.category || 'Boutique';
      const desc = prod.description || '';
      const price = typeof prod.price === 'number' ? `$${prod.price.toFixed(2)}` : `$${prod.price}`;

      const matchScore = this.calculateMatch(q, [name, cat, desc, prod.id]);
      if (matchScore > 0) {
        results.push({
          score: matchScore + 5,
          type: 'product',
          category: 'Tienda & Boutique VIP (Pet Shop)',
          id: prod.id,
          title: `🛍️ ${name}`,
          subtitle: `${cat} • Precio: <strong style="color:#059669; font-size:0.95rem;">${price}</strong>`,
          meta: desc.length > 85 ? desc.substring(0, 85) + '...' : desc,
          image: prod.image || 'assets/media__1787694901704.jpg',
          badge: price,
          badgeBg: '#ECFDF5',
          badgeColor: '#047857',
          action: () => {
            this.close();
            if (window.app && typeof window.app.switchTab === 'function') {
              window.app.switchTab('store');
            }
          }
        });
      }
    });

    // 5. REGISTROS DE LLAMADAS & MENSAJES (CALL LOGS)
    const logsSource = (window.callLogs && Array.isArray(window.callLogs.logs)) ? window.callLogs.logs : [];
    logsSource.forEach(log => {
      const contact = log.contact || '';
      const phone = log.phone || '';
      const pet = log.petName || '';
      const lastMsg = (log.transcript && log.transcript.length > 0) ? log.transcript[log.transcript.length - 1].text : '';

      const matchScore = this.calculateMatch(q, [contact, phone, pet, lastMsg, log.sentiment]);
      if (matchScore > 0) {
        results.push({
          score: matchScore + 3,
          type: 'log',
          category: 'Historial Omnicanal (Llamadas & WhatsApp)',
          id: `log-${log.id}`,
          title: `${log.type === 'whatsapp' ? '💬 WhatsApp' : '📞 Llamada'}: ${contact}`,
          subtitle: `Mascota: 🐾 <strong>${pet}</strong> • Tel: ${phone} (${log.date || 'Hoy'})`,
          meta: `Último mensaje: "${lastMsg.length > 70 ? lastMsg.substring(0, 70) + '...' : lastMsg}"`,
          badge: log.sentiment || 'Completada',
          badgeBg: '#EEF2FF',
          badgeColor: '#4F46E5',
          action: () => {
            this.close();
            if (window.app && typeof window.app.switchTab === 'function') {
              window.app.switchTab('call-logs');
              setTimeout(() => {
                if (window.callLogs && typeof window.callLogs.openLogDetail === 'function') {
                  window.callLogs.openLogDetail(log.id);
                }
              }, 250);
            }
          }
        });
      }
    });

    // Ordenar resultados por relevancia
    results.sort((a, b) => b.score - a.score);
    this.currentResults = results;
    this.selectedIndex = -1;
    this.renderResults(results, rawQuery);
  }

  calculateMatch(query, fields) {
    let score = 0;
    fields.forEach(f => {
      if (!f) return;
      const normalizedField = this.normalize(f);
      if (normalizedField === query) {
        score += 50; // Coincidencia exacta
      } else if (normalizedField.startsWith(query)) {
        score += 30; // Prefijo
      } else if (normalizedField.includes(query)) {
        score += 15; // Subcadena
      } else {
        // Coincidencia por palabras individuales
        const words = query.split(/\s+/);
        let allWordsMatch = true;
        words.forEach(w => {
          if (!normalizedField.includes(w)) allWordsMatch = false;
        });
        if (allWordsMatch && words.length > 1) {
          score += 20;
        }
      }
    });
    return score;
  }

  resolvePetStepName(pet) {
    const area = (pet.area || 'grooming').toLowerCase();
    const workflows = (window.petStatusEngine && window.petStatusEngine.workflows)
      ? window.petStatusEngine.workflows
      : {
          grooming: ['Reservación', 'Recibido', 'Revisión Dérmica', 'Baño Spa', 'Secado', 'Corte Grooming', 'Listo ✨', 'Entregado'],
          clinica: ['Admisión / Triaje', 'Triaje Médico', 'Consulta & Diagnóstico', 'Diagnóstico Especializado', 'Hospitalización', 'Alta Médica', 'Dado de Alta'],
          hotel: ['Check-in', 'Suite Bioclimática', 'Alimentación', 'Paseo VIP', 'Check-out']
        };
    const steps = workflows[area] || workflows['grooming'] || [];
    const idx = typeof pet.stepIndex === 'number' ? pet.stepIndex : 1;
    return steps[idx] || 'En Atención VIP';
  }

  getPetsDataSource() {
    if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus) && window.adminEngine.patientsStatus.length > 0) {
      return window.adminEngine.patientsStatus;
    }
    if (window.petStatusEngine && Array.isArray(window.petStatusEngine.pets) && window.petStatusEngine.pets.length > 0) {
      return window.petStatusEngine.pets;
    }
    // Datos de contingencia ricos y completos de Mrs. Pets Maracaibo
    return [
      { id: 'PET-101', name: 'Princesa', petName: 'Princesa', species: 'Yorkshire Terrier VIP', owner: 'Dalybell Ramírez Montilla', ownerName: 'Dalybell Ramírez Montilla', rif: 'V-18.452.910', ownerPhone: '+58 414-389-1102', email: 'dalybell@mrspets.com', area: 'grooming', stepIndex: 3, image: 'assets/media__1787695246337.jpg', photo: 'assets/media__1787695246337.jpg' },
      { id: 'PET-102', name: 'Fifi', petName: 'Fifi', species: 'Teckel / Dachshund VIP', owner: 'Carlos Mendoza', ownerName: 'Carlos Mendoza', rif: 'V-14.882.109', ownerPhone: '+58 412-555-1234', email: 'carlos.mendoza@example.com', area: 'grooming', stepIndex: 1, image: 'assets/media__1787695254613.jpg', photo: 'assets/media__1787695254613.jpg' },
      { id: 'PET-103', name: 'Buddy', petName: 'Buddy', species: 'Golden Retriever', owner: 'Andrés Morales', ownerName: 'Andrés Morales', rif: 'V-16.294.103', ownerPhone: '+58 414-332-2110', email: 'andres.morales@example.com', area: 'grooming', stepIndex: 1, image: 'assets/mrs_pets_golden_welcome_1787694735845.jpg', photo: 'assets/mrs_pets_golden_welcome_1787694735845.jpg' },
      { id: 'PET-112', name: 'Rudy', petName: 'Rudy', species: 'Schnauzer VIP / Canino', owner: 'Ricardo Salazar', ownerName: 'Ricardo Salazar', rif: 'V-19.340.551', ownerPhone: '+58 414-776-6554', email: 'ricardo.salazar@example.com', area: 'grooming', stepIndex: 1, image: 'assets/hero_border_collie.jpg', photo: 'assets/hero_border_collie.jpg' },
      { id: 'PET-105', name: 'Ivi', petName: 'Ivi', species: 'Gato Persa VIP', owner: 'Ivonne Montilla', ownerName: 'Ivonne Montilla', rif: 'V-14.238.991', ownerPhone: '+58 414-778-8990', email: 'ivonne@example.com', area: 'grooming', stepIndex: 1, image: 'assets/media__1787694901704.jpg', photo: 'assets/media__1787694901704.jpg' },
      { id: 'PET-106', name: 'Bella', petName: 'Bella', species: 'Poodle Toy Royal', owner: 'Bellita Ramírez', ownerName: 'Bellita Ramírez', rif: 'V-18.754.209', ownerPhone: '+58 412-334-4556', email: 'bellita@example.com', area: 'grooming', stepIndex: 5, image: 'assets/media__1787695246337.jpg', photo: 'assets/media__1787695246337.jpg' }
    ];
  }

  getProductsDataSource() {
    if (window.storeEngine && Array.isArray(window.storeEngine.products) && window.storeEngine.products.length > 0) {
      return window.storeEngine.products;
    }
    return [
      { id: 'PROD-101', name: 'Royal Canin Mini Adult (3kg)', category: 'Alimento Canino / Felino', price: 28.50, description: 'Nutrición balanceada de alta gama para perros adultos de raza pequeña.' },
      { id: 'PROD-102', name: 'Champú Ozono Hipoalergénico 500ml', category: 'Higiene & Spa', price: 18.00, description: 'Fórmula enriquecida con oxígeno activo para regeneración del manto dérmico.' },
      { id: 'PROD-103', name: 'Bravecto Perros 10-20kg', category: 'Farmacia', price: 42.00, description: 'Comprimido masticable con 12 semanas de protección continua contra garrapatas y pulgas.' },
      { id: 'SERV-GROOMING', name: 'Circuito Grooming Spa (7 Estaciones)', category: 'Servicio Grooming', price: 25.00, description: 'Circuito integral de estética canina y felina con hidratación de pulpejos obligatoria.' },
      { id: 'SERV-201', name: 'Profilaxis Dental & Higiene Ultrasónica', category: 'Servicio Clínico Specialist', price: 35.00, description: 'Limpieza bucal especializada para eliminación de sarro sin dolor.' }
    ];
  }

  // --- RENDERIZADO DE RESULTADOS ---
  renderQuickShortcuts() {
    this.currentResults = [];
    this.selectedIndex = -1;

    let html = `
      <div style="padding:4px 0 10px 0; border-bottom:1px solid #E2E8F0; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.05em;">
          ✨ Accesos Rápidos & Departamentos VIP
        </span>
        <span style="font-size:0.72rem; color:#64748B; font-weight:600;">Presiona <kbd style="background:#F1F5F9; border:1px solid #CBD5E1; border-radius:4px; padding:1px 5px; font-size:0.7rem;">ESC</kbd> para cerrar</span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:8px; margin-bottom:14px;">
    `;

    const shortcuts = this.servicesCatalog.slice(0, 6);
    shortcuts.forEach((serv, idx) => {
      html += `
        <div class="search-item-shortcut" onclick="globalSearch.executeService('${serv.id}')" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:10px 12px; cursor:pointer; display:flex; align-items:center; gap:10px; transition:all 0.15s ease;">
          <span style="font-size:1.4rem; flex-shrink:0;">${serv.icon}</span>
          <div style="overflow:hidden;">
            <div style="font-weight:800; color:#0F172A; font-size:0.83rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${serv.title.split('(')[0].trim()}</div>
            <div style="font-size:0.72rem; color:#64748B;">${serv.category}</div>
          </div>
        </div>
      `;
    });

    html += `
      </div>

      <div style="padding:8px 0 6px 0; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.75rem; font-weight:800; color:#0F172A;">🐾 Príncipes en Circuito Activo:</span>
        <button type="button" onclick="app.switchTab('pet-status'); globalSearch.close();" style="background:none; border:none; color:#D4AF37; font-weight:800; font-size:0.75rem; cursor:pointer;">Ver Todos ➔</button>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
        <span class="badge" onclick="globalSearch.quickSearch('Rocky')" style="background:#FEF3C7; color:#92400E; font-weight:800; padding:6px 12px; border-radius:20px; cursor:pointer; border:1px solid rgba(212,175,55,0.4); font-size:0.78rem;">🐾 Rocky</span>
        <span class="badge" onclick="globalSearch.quickSearch('Buddy')" style="background:#FEF3C7; color:#92400E; font-weight:800; padding:6px 12px; border-radius:20px; cursor:pointer; border:1px solid rgba(212,175,55,0.4); font-size:0.78rem;">🐾 Buddy</span>
        <span class="badge" onclick="globalSearch.quickSearch('Fifi')" style="background:#FEF3C7; color:#92400E; font-weight:800; padding:6px 12px; border-radius:20px; cursor:pointer; border:1px solid rgba(212,175,55,0.4); font-size:0.78rem;">🐾 Fifi</span>
        <span class="badge" onclick="globalSearch.quickSearch('Lata')" style="background:#FEF3C7; color:#92400E; font-weight:800; padding:6px 12px; border-radius:20px; cursor:pointer; border:1px solid rgba(212,175,55,0.4); font-size:0.78rem;">🐾 Lata</span>
        <span class="badge" onclick="globalSearch.quickSearch('Ivi')" style="background:#FEF3C7; color:#92400E; font-weight:800; padding:6px 12px; border-radius:20px; cursor:pointer; border:1px solid rgba(212,175,55,0.4); font-size:0.78rem;">🐾 Ivi</span>
        <span class="badge" onclick="globalSearch.quickSearch('Dalybell')" style="background:#DCFCE7; color:#166534; font-weight:800; padding:6px 12px; border-radius:20px; cursor:pointer; border:1px solid rgba(22,101,52,0.3); font-size:0.78rem;">👤 Dalybell (Tutor)</span>
      </div>
    `;

    this.dropdownEl.innerHTML = html;
    this.open();
  }

  quickSearch(term) {
    if (this.inputEl) {
      this.inputEl.value = term;
      this.handleInput(term);
    }
  }

  executeService(serviceId) {
    const serv = this.servicesCatalog.find(s => s.id === serviceId);
    if (serv) {
      this.close();
      serv.action();
    }
  }

  renderResults(results, rawQuery) {
    if (results.length === 0) {
      this.dropdownEl.innerHTML = `
        <div style="text-align:center; padding:36px 16px; background:#FFFFFF;">
          <div style="font-size:2.4rem; margin-bottom:8px;">🔍 🐾</div>
          <h4 style="font-size:1.05rem; font-weight:900; color:#0F172A; margin:0 0 6px 0;">No se encontraron resultados</h4>
          <p style="font-size:0.83rem; color:#64748B; margin:0 auto; max-width:380px;">
            No hay mascotas, tutores, servicios ni productos que coincidan con <strong>"${this.escapeHtml(rawQuery)}"</strong>.
          </p>
          <div style="margin-top:14px;">
            <button type="button" onclick="globalSearch.clear()" class="btn btn-sm" style="background:#D4AF37; color:#0F172A; font-weight:800; border:none; padding:6px 14px; border-radius:8px; cursor:pointer;">
              Limpiar Búsqueda
            </button>
          </div>
        </div>
      `;
      this.open();
      return;
    }

    // Agrupar por categoría
    const grouped = {};
    results.forEach((item, index) => {
      item.globalIndex = index;
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    let html = `
      <div style="padding:4px 0 10px 0; border-bottom:1px solid #E2E8F0; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.05em;">
          Coincidencias encontradas (${results.length})
        </span>
        <span style="font-size:0.72rem; color:#64748B; font-weight:600;">Usa <kbd style="background:#F1F5F9; border:1px solid #CBD5E1; border-radius:4px; padding:1px 4px;">↓</kbd> <kbd style="background:#F1F5F9; border:1px solid #CBD5E1; border-radius:4px; padding:1px 4px;">↑</kbd> para navegar</span>
      </div>
      <div class="search-results-list" style="display:flex; flex-direction:column; gap:6px;">
    `;

    Object.keys(grouped).forEach(cat => {
      html += `
        <div style="font-size:0.72rem; font-weight:900; color:#0F172A; text-transform:uppercase; letter-spacing:0.04em; padding:6px 8px 2px 8px; border-top:1px dashed #E2E8F0; margin-top:6px;">
          ${cat} (${grouped[cat].length})
        </div>
      `;

      grouped[cat].forEach(item => {
        const isSelected = item.globalIndex === this.selectedIndex;
        const itemBg = isSelected ? '#F1F5F9' : '#FFFFFF';
        const borderStyle = isSelected ? 'border:1.5px solid #D4AF37; background:#F8FAFC;' : 'border:1px solid #E2E8F0; background:#FFFFFF;';

        html += `
          <div class="search-result-row" data-index="${item.globalIndex}" onclick="globalSearch.executeAction(${item.globalIndex})" style="padding:10px 12px; border-radius:12px; ${borderStyle} cursor:pointer; display:flex; align-items:center; gap:12px; transition:all 0.15s ease;" onmouseenter="globalSearch.setHoverIndex(${item.globalIndex})">
            ${item.image ? `
              <img src="${item.image}" alt="" style="width:42px; height:42px; border-radius:10px; object-fit:cover; border:1.5px solid #D4AF37; flex-shrink:0;">
            ` : ''}
            <div style="flex:1; min-width:0;">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <div style="font-weight:900; font-size:0.90rem; color:#0F172A; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  ${item.title}
                </div>
                ${item.badge ? `
                  <span style="background:${item.badgeBg || '#F1F5F9'}; color:${item.badgeColor || '#0F172A'}; font-weight:800; font-size:0.70rem; padding:2px 8px; border-radius:6px; flex-shrink:0;">
                    ${item.badge}
                  </span>
                ` : ''}
              </div>
              <div style="font-size:0.78rem; color:#334155; margin-top:2px;">
                ${item.subtitle}
              </div>
              ${item.meta ? `
                <div style="font-size:0.72rem; color:#64748B; margin-top:2px;">
                  ${item.meta}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });
    });

    html += `</div>`;
    this.dropdownEl.innerHTML = html;
    this.open();
  }

  setHoverIndex(idx) {
    this.selectedIndex = idx;
    this.highlightSelectedItem();
  }

  highlightSelectedItem() {
    const rows = this.dropdownEl.querySelectorAll('.search-result-row');
    rows.forEach((r, idx) => {
      const rowIndex = parseInt(r.getAttribute('data-index'), 10);
      if (rowIndex === this.selectedIndex) {
        r.style.background = '#F8FAFC';
        r.style.border = '1.5px solid #D4AF37';
        r.style.transform = 'translateX(3px)';
      } else {
        r.style.background = '#FFFFFF';
        r.style.border = '1px solid #E2E8F0';
        r.style.transform = 'none';
      }
    });
  }

  handleKeyDown(e) {
    if (!this.isOpen && e.key === 'ArrowDown') {
      this.handleFocus();
      return;
    }

    if (e.key === 'Escape') {
      this.close();
      return;
    }

    if (this.currentResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.currentResults.length;
      this.highlightSelectedItem();
      this.scrollToSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.currentResults.length) % this.currentResults.length;
      this.highlightSelectedItem();
      this.scrollToSelected();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetIdx = this.selectedIndex >= 0 ? this.selectedIndex : 0;
      this.executeAction(targetIdx);
    }
  }

  scrollToSelected() {
    const selectedEl = this.dropdownEl.querySelector(`.search-result-row[data-index="${this.selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  executeAction(index) {
    if (this.currentResults && this.currentResults[index]) {
      const item = this.currentResults[index];
      if (typeof item.action === 'function') {
        item.action();
      }
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .split('&').join('&amp;')
      .split('<').join('&lt;')
      .split('>').join('&gt;')
      .split('"').join('&quot;')
      .split("'").join('&#039;');
  }
}

// Instancia global en window
window.globalSearch = new GlobalSearchEngine();

document.addEventListener('DOMContentLoaded', () => {
  if (window.globalSearch) {
    window.globalSearch.init();
  }
});
