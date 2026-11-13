/* ==========================================================================
   PET STATUS TRACKER ENGINE (Mrs. Pets Maracaibo - Real Photos Integrated)
   ========================================================================== */

class PetStatusEngine {
  constructor() {
    this.workflows = {
      grooming: [
        'Reserva',
        'Recibido',
        'Revisión Dérmica',
        'Baño Spa',
        'Secado',
        'Corte Grooming',
        'Listo ✨',
        'Entregado'
      ],
      clinica: [
        'Reserva',
        'Recibido / Admisión',
        'Triaje Médico',
        'Consulta & Diagnóstico',
        'Diagnóstico Especializado & Exámenes',
        'Hospitalización & Tratamiento UVI',
        'Culminación de Examen / Alta Médica',
        'Dado de Alta / Entregado a Tutor'
      ],
      hotel: [
        'Reserva',
        'Check-in / Admisión Hotel',
        'Asignación Suite Bioclimática',
        'Alimentación & Recreación',
        'Paseo VIP',
        'Check-out / Entregado'
      ],
      tienda: [
        'Atención Boutique / Selección',
        'Asesoramiento Nutricional VIP',
        'Facturación & Empaque',
        'Entregado / Despachado'
      ]
    };

    this.pets = this.getDefaultPets();

    this.currentFilter = 'all'; // Area filter: 'all', 'grooming', 'clinica', 'hotel'
    this.currentStatusFilter = 'in_progress'; // Process filter: 'in_progress', 'processed', 'all'
    this.currentDateFilter = 'today'; // Date filter: 'today', 'week', 'fortnight', 'all_dates'

    // Sincronización Multiplataforma en Tiempo Real (Móvil Staff <-> Computadora Cliente)
    this.currentServerRevision = 0;
    this._isPolling = false;
    this.syncTimer = null;
    this._syncDebounceTimer = null;
  }

  getDefaultPets() {
    return [
      {
        id: 'PET-101',
        petName: 'Princesa',
        species: 'Yorkshire Terrier VIP',
        ownerName: 'Dalybell Ramírez Montilla',
        ownerPhone: '+58 (414) 389-1102',
        rif: 'V-18.452.910',
        area: 'grooming',
        sector: 'El Milagro',
        stepIndex: 1, // '1. Recibido'
        turnNumber: 1,
        turno: 1,
        turnTicket: 'G-001',
        notes: 'Corte de exhibición con lazo rojo Mrs. Pets Spa.',
        image: 'assets/media__1787695246337.jpg',
        photo: 'assets/media__1787695246337.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        updatedAt: 'Hace 5 min'
      },
      {
        id: 'PET-102',
        petName: 'Fifi',
        species: 'Teckel / Dachshund VIP',
        ownerName: 'Carlos Mendoza',
        ownerPhone: '+58 (412) 555-1234',
        rif: 'V-14.882.109',
        pin: '1234',
        area: 'grooming',
        sector: 'Bella Vista',
        stepIndex: 1, // '1. Recibido'
        turnNumber: 2,
        turno: 2,
        turnTicket: 'G-002',
        hasReservation: true,
        reservationDate: new Date().toISOString().split('T')[0],
        reservationTime: '08:30 AM',
        service: 'Circuito Grooming Spa (7 Estaciones)',
        price: 25.00,
        notes: 'Circuito Grooming Spa (7 Estaciones) para Fifi (Carlos Mendoza).',
        image: 'assets/media__1787695254613.jpg',
        updatedAt: 'Hace 10 min'
      },
      {
        id: 'PET-103',
        petName: 'Buddy',
        species: 'Golden Retriever',
        ownerName: 'Andrés Morales',
        ownerPhone: '+58 (414) 332-2110',
        rif: 'V-16.294.103',
        pin: '1234',
        area: 'grooming',
        sector: 'Tierra Negra',
        stepIndex: 1, // '1. Recibido'
        turnNumber: 3,
        turno: 3,
        turnTicket: 'G-003',
        notes: 'Piel sensible. Usar champú hipoalergénico Mrs. Pets.',
        image: 'assets/mrs_pets_golden_welcome_1787694735845.jpg',
        updatedAt: 'Hace 15 min'
      },
      {
        id: 'PET-106',
        petName: 'Bella',
        species: 'Poodle Toy Royal',
        ownerName: 'Bellita Ramírez',
        ownerPhone: '+58 (412) 334-4556',
        rif: 'V-19.823.411',
        area: 'grooming',
        stepIndex: 5,
        turnNumber: 4,
        turno: 4,
        turnTicket: 'G-004',
        hasReservation: true,
        notes: 'Corte de exhibición con moño dorado Mrs. Pets.',
        image: 'assets/media__1787695246337.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        updatedAt: 'Hace 5 min'
      },
      {
        id: 'PET-109',
        petName: 'Buga',
        species: 'Poodle Toy / Caniche',
        ownerName: 'Mariana Colina',
        ownerPhone: '+58 (414) 679-9510',
        rif: 'V-24.891.204',
        area: 'grooming',
        stepIndex: 3, // 'Baño Spa'
        turnNumber: 5,
        turno: 5,
        turnTicket: 'G-005',
        hasReservation: true,
        notes: 'Circuito Grooming Spa con hidratación de pulpejos obligatoria.',
        image: 'assets/media__1787695246337.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        updatedAt: 'Hace 3 min'
      },
      {
        id: 'PET-111',
        petName: 'Lata',
        species: 'Canino (Mestizo VIP)',
        ownerName: 'Titter',
        ownerPhone: '+58 (414) 889-2233',
        rif: 'V-21.984.102',
        area: 'grooming',
        stepIndex: 1, // 'Recibido'
        turnNumber: 6,
        turno: 6,
        turnTicket: 'G-006',
        hasReservation: true,
        notes: 'Ingresado en recepción para circuito de Grooming Spa.',
        image: 'assets/hero_border_collie.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        updatedAt: 'Hace 5 min'
      },
      {
        id: 'PET-112',
        petName: 'Rudy',
        species: 'Schnauzer VIP / Canino',
        ownerName: 'Ricardo Salazar',
        ownerPhone: '+58 (414) 776-6554',
        rif: 'V-19.340.551',
        pin: '1234',
        area: 'grooming',
        stepIndex: 1,
        turnNumber: 7,
        turno: 7,
        turnTicket: 'G-007',
        hasReservation: true,
        notes: 'Cita de Grooming & Baño Spa confirmada para Rudy.',
        image: 'assets/hero_border_collie.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        updatedAt: 'Hace 1 min'
      },
      {
        id: 'PET-105',
        petName: 'Ivi',
        species: 'Gato Persa VIP',
        ownerName: 'Ivonne Montilla',
        ownerPhone: '+58 (414) 778-8990',
        rif: 'V-14.238.991',
        area: 'grooming',
        stepIndex: 1, // '1. Recibido'
        turnNumber: 8,
        turno: 8,
        turnTicket: 'G-008',
        hasReservation: true,
        notes: 'Recibido en módulo spa. Baño deslanado para Gato Persa VIP.',
        image: 'assets/media__1787694901704.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        updatedAt: 'Hace 2 min'
      },
      {
        id: 'PET-110',
        petName: 'Cuga',
        species: 'Poodle Royal / Caniche VIP',
        ownerName: 'Mariana Colina',
        ownerPhone: '+58 (414) 679-9510',
        rif: 'V-24.891.204',
        area: 'grooming',
        stepIndex: 6, // '6. Listo ✨'
        turnNumber: 9,
        turno: 9,
        turnTicket: 'G-009',
        hasReservation: true,
        notes: 'Circuito Grooming Spa completado. En control de calidad final listo para entrega.',
        image: 'assets/media__1787695246337.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        updatedAt: 'Hace 20 min'
      },
      {
        id: 'PET-107',
        petName: 'Max',
        species: 'Schnauzer Miniatura',
        ownerName: 'Dra. Patricia Silva',
        ownerPhone: '+58 (414) 112-2334',
        rif: 'V-16.543.210',
        area: 'grooming',
        stepIndex: 5, // '5. Corte Grooming'
        turnNumber: 10,
        turno: 10,
        turnTicket: 'G-010',
        hasReservation: true,
        notes: 'Corte de raza Schnauzer en estación de corte y acabado fino.',
        image: 'assets/media__1787695246337.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        updatedAt: 'Hace 1 hora'
      },
      {
        id: 'PET-108',
        petName: 'Thor',
        species: 'Bulldog Francés',
        ownerName: 'Gabriel Silva',
        ownerPhone: '+58 (412) 556-6778',
        rif: 'V-22.345.678',
        area: 'clinica',
        stepIndex: 6, // 'Entregado a Tutor'
        turnNumber: 1,
        turno: 1,
        turnTicket: 'C-001',
        hasReservation: true,
        notes: 'Alta médica tras profilaxis y revisión dermatológica.',
        image: 'assets/media__1787695254613.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        updatedAt: 'Hace 2 horas',
        deliveredAt: '03:30 PM',
        deliveredBy: 'Dr. Alejandro Morales'
      },
      {
        id: 'PET-104',
        petName: 'Luna',
        species: 'Gato (Persa)',
        ownerName: 'Sofía Rodríguez',
        ownerPhone: '+58 (424) 998-1243',
        rif: 'V-20.119.443',
        area: 'hotel',
        stepIndex: 0, // 'Reserva'
        turnNumber: 1,
        turno: 1,
        turnTicket: 'H-001',
        notes: 'Habitación Hotel VIP #4. Dieta especial barf a las 2:00 PM.',
        image: 'assets/media__1787694901704.jpg',
        updatedAt: 'Hace 30 min'
      }
    ];
  }

  resetToInitialDemoPets() {
    try {
      localStorage.removeItem('mrs_pets_registered_pets');
      localStorage.removeItem('mrs_pets_admin_patients');
    } catch(e) {}
    this.pets = this.getDefaultPets();
    this.currentFilter = 'all';
    this.currentStatusFilter = 'in_progress';
    this.currentDateFilter = 'today';
    if (window.adminEngine) {
      window.adminEngine.patientsStatus = JSON.parse(JSON.stringify(this.pets));
      if (typeof window.adminEngine.savePatientsToStorage === 'function') {
        window.adminEngine.savePatientsToStorage();
      }
    }
    this.savePetsToStorage();
    this.resequenceTurnsForArea('grooming');
    this.render();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('🔄 Pacientes demo restablecidos. Princesa, Fifi y Buddy están en espera en recepción (Turnos 1, 2 y 3).', 'success');
    }
  }

  admitNewGroomingPatient(name = 'Toby', owner = 'Carlos Mendoza', species = 'Canino Poodle', sector = 'Bella Vista') {
    const newId = `PET-${Date.now()}`;
    const newPet = {
      id: newId,
      petName: name,
      name: name,
      species: species,
      ownerName: owner,
      owner: owner,
      ownerPhone: '+58 (414) 123-4567',
      rif: 'V-15.678.901',
      area: 'grooming',
      sector: sector,
      stepIndex: 1, // '1. Recibido'
      hasReservation: true,
      service: 'Circuito Grooming Spa (7 Estaciones)',
      price: 25.00,
      notes: `Ingresado en recepción para circuito de Grooming Spa (${sector}).`,
      image: 'assets/hero_border_collie.jpg',
      updatedAt: 'Hace 1 min'
    };
    this.pets.push(newPet);
    this.resequenceTurnsForArea('grooming');
    this.savePetsToStorage();
    this.render();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`📥 Paciente "${name}" recibido en recepción con Turno asignado en Grooming.`, 'success');
    }
  }

  init() {
    this.loadPetsFromStorage();
    this.render();
    this.bindEvents();

    // Sincronización Multiplataforma en Tiempo Real (Móvil Staff <-> Computadora Cliente)
    this.fetchLiveStatusFromServer();
    this.startRealtimeSyncLoop();
  }

  async fetchLiveStatusFromServer() {
    try {
      const res = await fetch('/api/v1/pet-status/live');
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !Array.isArray(data.pets) || data.pets.length === 0) return;

      this.currentServerRevision = data.revision || 1;
      const changed = this.mergeServerPets(data.pets);
      if (changed) {
        this.render();
        if (window.adminEngine && typeof window.adminEngine.renderStatusManager === 'function') {
          window.adminEngine.renderStatusManager();
        }
      }
    } catch (e) {
      console.warn('[PetStatusEngine] Error fetching live status from server:', e);
    }
  }

  async pollServerUpdates() {
    if (this._isPolling) return;
    this._isPolling = true;
    try {
      const since = this.currentServerRevision || 0;
      const res = await fetch(`/api/v1/pet-status/poll?since=${since}`);
      if (!res.ok) {
        this._isPolling = false;
        return;
      }
      const data = await res.json();
      if (data && data.has_updates && Array.isArray(data.pets)) {
        this.currentServerRevision = data.revision || (this.currentServerRevision + 1);
        const changed = this.mergeServerPets(data.pets);
        if (changed) {
          this.render();
          if (window.adminEngine && typeof window.adminEngine.renderStatusManager === 'function') {
            window.adminEngine.renderStatusManager();
          }
        }
      }
    } catch (e) {
      // Supresión de errores silenciosa en background poll
    } finally {
      this._isPolling = false;
    }
  }

  mergeServerPets(serverPets) {
    if (!Array.isArray(serverPets) || serverPets.length === 0) return false;
    let anyChanges = false;

    serverPets.forEach(srvPet => {
      if (!srvPet || !srvPet.id) return;
      const local = this.pets.find(p => p.id === srvPet.id || 
        (p.petName && srvPet.petName && this.normalizePetBaseName(p.petName) === this.normalizePetBaseName(srvPet.petName) && this.normalizeService(p.area) === this.normalizeService(srvPet.area)));

      if (local) {
        const stepChanged = typeof srvPet.stepIndex === 'number' && local.stepIndex !== srvPet.stepIndex;
        const staffChanged = srvPet.assignedStaffName && local.assignedStaffName !== srvPet.assignedStaffName;
        const notesChanged = srvPet.notes && local.notes !== srvPet.notes;
        const dermalChanged = srvPet.dermalCondition && local.dermalCondition !== srvPet.dermalCondition;
        const completedChanged = srvPet.isCompleted !== undefined && local.isCompleted !== srvPet.isCompleted;

        if (stepChanged || staffChanged || notesChanged || dermalChanged || completedChanged) {
          anyChanges = true;
          local.stepIndex = srvPet.stepIndex !== undefined ? srvPet.stepIndex : local.stepIndex;
          if (srvPet.assignedStaffId) local.assignedStaffId = srvPet.assignedStaffId;
          if (srvPet.assignedStaffName) local.assignedStaffName = srvPet.assignedStaffName;
          if (srvPet.dermalCondition) local.dermalCondition = srvPet.dermalCondition;
          if (srvPet.dermalConditionLabel) local.dermalConditionLabel = srvPet.dermalConditionLabel;
          if (srvPet.isContagious !== undefined) local.isContagious = srvPet.isContagious;
          if (srvPet.sanitaryAlert !== undefined) local.sanitaryAlert = srvPet.sanitaryAlert;
          if (srvPet.notes) local.notes = srvPet.notes;
          if (srvPet.updatedAt) local.updatedAt = srvPet.updatedAt;
          if (Array.isArray(srvPet.traceLogs)) local.traceLogs = srvPet.traceLogs;
          if (srvPet.isCompleted !== undefined) local.isCompleted = srvPet.isCompleted;
          if (srvPet.deliveredAt) local.deliveredAt = srvPet.deliveredAt;
          if (srvPet.deliveredBy) local.deliveredBy = srvPet.deliveredBy;
        }
      } else {
        this.pets.push(srvPet);
        anyChanges = true;
      }
    });

    if (anyChanges) {
      this.savePetsToStorage({ skipServerSync: true });
      if (window.adminEngine) {
        window.adminEngine.patientsStatus = this.pets;
      }
      try {
        window.dispatchEvent(new CustomEvent('mrs_pets_patient_status_synced', {
          detail: { pets: this.pets }
        }));
      } catch (e) {}
    }

    return anyChanges;
  }

  async syncPetStatusToServer(pet) {
    if (!pet || !pet.id) return;
    try {
      const payload = {
        id: pet.id,
        petName: pet.petName || pet.name,
        name: pet.name || pet.petName,
        ownerName: pet.ownerName || pet.owner,
        owner: pet.owner || pet.ownerName,
        ownerPhone: pet.ownerPhone,
        rif: pet.rif,
        pin: pet.pin,
        area: pet.area,
        sector: pet.sector,
        stepIndex: typeof pet.stepIndex === 'number' ? pet.stepIndex : 0,
        turnNumber: pet.turnNumber || pet.turno,
        turno: pet.turno || pet.turnNumber,
        turnTicket: pet.turnTicket,
        hasReservation: pet.hasReservation !== false,
        reservationDate: pet.reservationDate,
        reservationTime: pet.reservationTime,
        service: pet.service,
        price: pet.price,
        notes: pet.notes,
        assignedStaffId: pet.assignedStaffId,
        assignedStaffName: pet.assignedStaffName,
        dermalCondition: pet.dermalCondition,
        dermalConditionLabel: pet.dermalConditionLabel,
        isContagious: Boolean(pet.isContagious),
        sanitaryAlert: pet.sanitaryAlert,
        isCompleted: Boolean(pet.isCompleted),
        deliveredAt: pet.deliveredAt,
        deliveredBy: pet.deliveredBy,
        updatedAt: pet.updatedAt || 'Ahora mismo',
        traceLogs: Array.isArray(pet.traceLogs) ? pet.traceLogs.slice(-10) : []
      };

      const res = await fetch('/api/v1/pet-status/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.revision) {
          this.currentServerRevision = data.revision;
        }
      }
    } catch (err) {
      console.warn('[PetStatusEngine] Error syncing pet status to server:', err);
    }
  }

  syncAllPetsToServerDebounced() {
    if (this._syncDebounceTimer) clearTimeout(this._syncDebounceTimer);
    this._syncDebounceTimer = setTimeout(() => {
      this.syncAllPetsToServer();
    }, 1200);
  }

  async syncAllPetsToServer() {
    if (!Array.isArray(this.pets) || this.pets.length === 0) return;
    try {
      const petsPayload = this.pets.map(p => ({
        id: p.id,
        petName: p.petName || p.name,
        name: p.name || p.petName,
        ownerName: p.ownerName || p.owner,
        owner: p.owner || p.ownerName,
        ownerPhone: p.ownerPhone,
        rif: p.rif,
        pin: p.pin,
        area: p.area,
        sector: p.sector,
        stepIndex: typeof p.stepIndex === 'number' ? p.stepIndex : 0,
        turnNumber: p.turnNumber || p.turno,
        turno: p.turno || p.turnNumber,
        turnTicket: p.turnTicket,
        hasReservation: p.hasReservation !== false,
        reservationDate: p.reservationDate,
        reservationTime: p.reservationTime,
        service: p.service,
        price: p.price,
        notes: p.notes,
        assignedStaffId: p.assignedStaffId,
        assignedStaffName: p.assignedStaffName,
        dermalCondition: p.dermalCondition,
        dermalConditionLabel: p.dermalConditionLabel,
        isContagious: Boolean(p.isContagious),
        sanitaryAlert: p.sanitaryAlert,
        isCompleted: Boolean(p.isCompleted),
        deliveredAt: p.deliveredAt,
        deliveredBy: p.deliveredBy,
        updatedAt: p.updatedAt || 'Ahora mismo',
        traceLogs: Array.isArray(p.traceLogs) ? p.traceLogs.slice(-10) : []
      }));

      const res = await fetch('/api/v1/pet-status/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pets: petsPayload })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.revision) {
          this.currentServerRevision = data.revision;
        }
      }
    } catch (e) {
      console.warn('[PetStatusEngine] Error syncing all pets to server:', e);
    }
  }

  startRealtimeSyncLoop() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      this.pollServerUpdates();
    }, 2500);

    window.addEventListener('focus', () => this.pollServerUpdates());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pollServerUpdates();
      }
    });
  }

  loadPetsFromStorage() {
    try {
      // Función auxiliar para purgar strings corruptos con saltos de línea y asegurar simetría
      const sanitizePet = (p) => {
        if (!p) return p;
        const petNameVal = p.petName || p.name || p.pet || 'Mascota';
        const ownerNameVal = p.ownerName || p.owner || p.tutor || 'Tutor VIP';
        p.name = petNameVal;
        p.petName = petNameVal;
        p.owner = ownerNameVal;
        p.ownerName = ownerNameVal;
        p.species = p.species || 'Príncipe / Princesa VIP';
        p.photo = p.photo || p.image || 'assets/hero_border_collie.jpg';
        p.image = p.image || p.photo || 'assets/hero_border_collie.jpg';
        p.ownerPhoto = p.ownerPhoto || 'assets/leia_avatar.jpg';
        if (p.area) {
          p.area = p.area.toString().replace(/[\r\n\t]+/g, ' ').trim().toLowerCase();
          if (['peluqueria', 'peluquería', 'estetica', 'estética', 'spa'].includes(p.area)) {
            p.area = 'grooming';
          }
        }
        return p;
      };

      const currentCacheVer = localStorage.getItem('mrs_pets_turns_version');
      if (currentCacheVer !== '20261020_VOLTURI_STREAM_TURNS_V501') {
        localStorage.removeItem('mrs_pets_admin_patients');
        localStorage.removeItem('mrs_pets_registered_pets');
        localStorage.setItem('mrs_pets_turns_version', '20261020_VOLTURI_STREAM_TURNS_V501');
      }

      const savedReg = localStorage.getItem('mrs_pets_registered_pets');
      if (savedReg) {
        const parsedReg = JSON.parse(savedReg);
        if (Array.isArray(parsedReg) && parsedReg.length > 0) {
          parsedReg.forEach(p => {
            const cleanP = sanitizePet(p);
            const pBase = this.normalizePetBaseName(cleanP.name || cleanP.petName);
            const pArea = this.normalizeService(cleanP.area);
            const idx = this.pets.findIndex(x => x.id === cleanP.id || (pBase && this.normalizePetBaseName(x.name || x.petName) === pBase && this.normalizeService(x.area) === pArea));
            if (idx === -1) {
              this.pets.push(cleanP);
            } else {
              this.pets[idx] = { ...this.pets[idx], ...cleanP };
            }
          });
        }
      }

      const savedAdmin = localStorage.getItem('mrs_pets_admin_patients');
      if (savedAdmin) {
        const parsedAdmin = JSON.parse(savedAdmin);
        if (Array.isArray(parsedAdmin) && parsedAdmin.length > 0) {
          parsedAdmin.forEach(p => {
            const cleanP = sanitizePet(p);
            const pBase = this.normalizePetBaseName(cleanP.name || cleanP.petName);
            const pArea = this.normalizeService(cleanP.area);
            const idx = this.pets.findIndex(x => x.id === cleanP.id || (pBase && this.normalizePetBaseName(x.name || x.petName) === pBase && this.normalizeService(x.area) === pArea));
            if (idx === -1) {
              this.pets.push(cleanP);
            } else {
              this.pets[idx] = { ...this.pets[idx], ...cleanP };
            }
          });
        }
      }

      // Deduplicación Estricta: Cada mascota solo puede tener una única ficha por área
      const seenKeyMap = new Map();
      const dedupedPets = [];
      this.pets.forEach(p => {
        if (!p) return;
        const petBase = this.normalizePetBaseName(p.name || p.petName);
        const area = this.normalizeService(p.area);
        const key = `${petBase}__${area}`;
        if (seenKeyMap.has(key)) {
          const existingIdx = seenKeyMap.get(key);
          const existing = dedupedPets[existingIdx];
          const existingScore = (existing.approved ? 50 : 0) + (existing.turnNumber ? 20 : 0) + (existing.stepIndex >= 0 ? existing.stepIndex + 1 : 0);
          const pScore = (p.approved ? 50 : 0) + (p.turnNumber ? 20 : 0) + (p.stepIndex >= 0 ? p.stepIndex + 1 : 0);
          if (pScore > existingScore) {
            dedupedPets[existingIdx] = { ...existing, ...p };
          } else {
            dedupedPets[existingIdx] = { ...p, ...existing };
          }
        } else {
          seenKeyMap.set(key, dedupedPets.length);
          dedupedPets.push(p);
        }
      });
      this.pets = dedupedPets;

      // Enforce correct area for PET-102 (Fifi) as Grooming Spa
      const fifiPet = this.pets.find(p => p.id === 'PET-102');
      if (fifiPet) {
        fifiPet.area = 'grooming';
        fifiPet.stepIndex = 1;
        fifiPet.turnNumber = 2;
        fifiPet.turno = 2;
        fifiPet.turnTicket = 'G-002';
        fifiPet.service = 'Circuito Grooming Spa (7 Estaciones)';
        fifiPet.price = 25.00;
        fifiPet.notes = 'Circuito Grooming Spa (7 Estaciones) para Fifi (Carlos Mendoza).';
      }
      // Ensure Ivi, Cuga and Max are synchronized so their Turno 8, 9, 10 appear continuously in active view
      const iviPet = this.pets.find(p => p.id === 'PET-105');
      if (iviPet) {
        iviPet.owner = 'Ivonne Montilla';
        iviPet.ownerName = 'Ivonne Montilla';
        iviPet.rif = 'V-14.238.991';
        iviPet.stepIndex = 1;
        iviPet.turnNumber = 8;
        iviPet.turno = 8;
        iviPet.turnTicket = 'G-008';
      }
      const bugaPet = this.pets.find(p => p.id === 'PET-109');
      if (bugaPet) {
        bugaPet.owner = 'Mariana Colina';
        bugaPet.ownerName = 'Mariana Colina';
        bugaPet.rif = 'V-24.891.204';
      }
      const cugaPet = this.pets.find(p => p.id === 'PET-110');
      if (cugaPet) {
        cugaPet.owner = 'Mariana Colina';
        cugaPet.ownerName = 'Mariana Colina';
        cugaPet.rif = 'V-24.891.204';
        if (cugaPet.stepIndex >= 7) {
          cugaPet.stepIndex = 6;
          cugaPet.turnNumber = 9;
          cugaPet.turno = 9;
          cugaPet.turnTicket = 'G-009';
          cugaPet.isCompleted = false;
        }
      }
      const maxPet = this.pets.find(p => p.id === 'PET-107');
      if (maxPet && maxPet.stepIndex >= 7) {
        maxPet.stepIndex = 5;
        maxPet.turnNumber = 10;
        maxPet.turno = 10;
        maxPet.turnTicket = 'G-010';
        maxPet.isCompleted = false;
      }
      const thorPet = this.pets.find(p => p.id === 'PET-108');
      if (thorPet) {
        thorPet.turnNumber = 1;
        thorPet.turno = 1;
        thorPet.turnTicket = 'C-001';
      }
      const lunaPet = this.pets.find(p => p.id === 'PET-104');
      if (lunaPet) {
        lunaPet.turnNumber = 1;
        lunaPet.turno = 1;
        lunaPet.turnTicket = 'H-001';
      }

      // Automatically resequence turn numbers correlatively (1, 2, 3, 4...) for each area
      this.resequenceTurnsForArea('grooming');
      this.resequenceTurnsForArea('clinica');
      this.resequenceTurnsForArea('hotel');
      this.resequenceTurnsForArea('tienda');

      this.pets.forEach(p => {
        if (!p.pin) p.pin = '1234';
      });

      this.savePetsToStorage();
    } catch (e) {
      console.warn("Could not load pets from localStorage:", e);
    }
  }

  savePetsToStorage(options = {}) {
    try {
      localStorage.setItem('mrs_pets_registered_pets', JSON.stringify(this.pets));
      localStorage.setItem('mrs_pets_admin_patients', JSON.stringify(this.pets));
    } catch (e) {
      console.warn("Could not save pets to localStorage:", e);
    }
    if (window.adminEngine) {
      window.adminEngine.patientsStatus = this.pets;
      if (typeof window.adminEngine.renderClientDatabaseManager === 'function') {
        window.adminEngine.renderClientDatabaseManager();
      }
    }
    if (!options || !options.skipServerSync) {
      this.syncAllPetsToServerDebounced();
    }
  }

  getAreaTurnPrefix(area) {
    const norm = this.normalizeService(area);
    if (norm === 'grooming' || norm === 'peluqueria' || norm === 'spa') return 'G';
    if (norm === 'clinica' || norm === 'veterinaria' || norm === 'medica') return 'C';
    if (norm === 'hotel' || norm === 'guarderia') return 'H';
    if (norm === 'tienda' || norm === 'boutique') return 'T';
    return 'G';
  }

  formatTurnTicket(area, turnNum) {
    if (!turnNum || isNaN(parseInt(turnNum, 10)) || parseInt(turnNum, 10) <= 0) return null;
    const num = parseInt(turnNum, 10);
    const prefix = this.getAreaTurnPrefix(area);
    return `${prefix}-${String(num).padStart(3, '0')}`;
  }

  getNextTurnNumber(area = 'grooming', targetDate = null) {
    let maxTurn = 0;
    const targetNorm = this.normalizeService(area);
    const todayStr = targetDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    const evaluatePet = (p) => {
      if (!p) return;
      const pArea = this.normalizeService(p.area);
      const pDate = p.reservationDate || p.date || todayStr;
      if (pArea === targetNorm && (pDate === todayStr || !targetDate)) {
        const val = parseInt(p.turnNumber !== undefined && p.turnNumber !== null ? p.turnNumber : (p.turno || 0), 10);
        if (!isNaN(val) && val > maxTurn) {
          maxTurn = val;
        }
      }
    };

    if (Array.isArray(this.pets)) {
      this.pets.forEach(evaluatePet);
    }

    if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
      window.adminEngine.patientsStatus.forEach(evaluatePet);
    }

    return maxTurn + 1;
  }

  calculatePartitionTurn(pet) {
    if (!pet) return 1;
    const cleanArea = this.normalizeService(pet.area);
    const dateStr = pet.reservationDate || pet.date || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    // Partición: ROW_NUMBER() OVER (PARTITION BY fecha, area_servicio ORDER BY hora_reserva ASC)
    const areaPets = this.pets.filter(p => {
      if (!p) return false;
      const pArea = this.normalizeService(p.area);
      const pDate = p.reservationDate || p.date || dateStr;
      return pArea === cleanArea && pDate === dateStr;
    });

    areaPets.sort((a, b) => {
      const stepA = typeof a.stepIndex === 'number' ? a.stepIndex : 0;
      const stepB = typeof b.stepIndex === 'number' ? b.stepIndex : 0;
      if (stepA >= 1 && stepB <= 0) return -1;
      if (stepA <= 0 && stepB >= 1) return 1;

      const turnA = parseInt(a.turnNumber || a.turno, 10) || 999;
      const turnB = parseInt(b.turnNumber || b.turno, 10) || 999;
      if (turnA !== turnB && turnA !== 999 && turnB !== 999) return turnA - turnB;

      const timeA = this.getPetTimeInMinutes(a);
      const timeB = this.getPetTimeInMinutes(b);
      return timeA - timeB;
    });

    const idx = areaPets.findIndex(p => p.id === pet.id);
    return idx !== -1 ? idx + 1 : 1;
  }

  registerNewPet(petData) {
    const uniqueId = petData.id || `PET-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const targetArea = this.normalizeService(petData.area || 'grooming');
    const targetStep = petData.stepIndex !== undefined ? petData.stepIndex : 0;
    const targetDate = petData.reservationDate || petData.date || new Date().toISOString().split('T')[0];
    const assignedTurn = (petData.turnNumber && typeof petData.turnNumber === 'number' && petData.turnNumber > 0)
      ? petData.turnNumber
      : (targetStep >= 1 ? this.getNextTurnNumber(targetArea, targetDate) : null);
    const assignedTicket = assignedTurn ? this.formatTurnTicket(targetArea, assignedTurn) : (petData.turnTicket || null);

    const petNameVal = petData.name || petData.petName || petData.pet || 'Mascota';
    const ownerNameVal = petData.owner || petData.ownerName || petData.tutor || 'Tutor VIP';

    // Resolver RIF canónico del tutor si no fue provisto o es genérico
    let resolvedRif = petData.rif;
    if (!resolvedRif || resolvedRif.toLowerCase().includes('registrado')) {
      const pTutorName = ownerNameVal.toLowerCase().trim();
      if (pTutorName && Array.isArray(this.pets)) {
        const existingWithRif = this.pets.find(p => {
          const oName = (p.owner || p.ownerName || '').toLowerCase().trim();
          return oName === pTutorName && p.rif && !p.rif.toLowerCase().includes('registrado');
        });
        if (existingWithRif) resolvedRif = existingWithRif.rif;
      }
    }
    if (!resolvedRif) resolvedRif = 'V-Registrado';

    const newPet = {
      ...petData,
      id: uniqueId,
      name: petNameVal,
      petName: petNameVal,
      species: petData.species || 'Príncipe / Princesa VIP',
      owner: ownerNameVal,
      ownerName: ownerNameVal,
      rif: resolvedRif,
      ownerPhone: petData.ownerPhone || petData.phone || '+58 414-6799510',
      area: targetArea,
      service: petData.service || (targetArea === 'clinica' ? 'Consulta Médica Veterinaria' : (targetArea === 'hotel' ? 'Hospedaje Suite Canina VIP' : 'Circuito Grooming Spa (7 Estaciones)')),
      price: typeof petData.price === 'number' ? petData.price : (targetArea === 'clinica' ? 30.00 : (targetArea === 'hotel' ? 45.00 : 25.00)),
      turnNumber: assignedTurn,
      turno: assignedTurn,
      turnTicket: assignedTicket,
      stepIndex: targetStep,
      hasReservation: petData.hasReservation !== undefined ? petData.hasReservation : true,
      reservationDate: targetDate,
      reservationTime: petData.reservationTime || petData.time || '08:00 AM',
      date: targetDate,
      time: petData.reservationTime || petData.time || '08:00 AM',
      notes: petData.notes || 'Perfil registrado en el sistema.',
      image: petData.photo || petData.image || 'assets/media__1787694901704.jpg',
      photo: petData.photo || petData.image || 'assets/media__1787694901704.jpg',
      ownerPhoto: petData.ownerPhoto || 'assets/leia_avatar.jpg',
      updatedAt: petData.updatedAt || 'Hace un momento'
    };

    const cleanNewPet = (newPet.name || newPet.petName || '').toLowerCase().trim();
    const cleanNewTutor = (newPet.owner || newPet.ownerName || '').toLowerCase().trim();

    let existingIdx = this.pets.findIndex(p => p.id === newPet.id);
    if (existingIdx === -1 && cleanNewPet && cleanNewTutor) {
      existingIdx = this.pets.findIndex(p => {
        const pPet = (p.name || p.petName || '').toLowerCase().trim();
        const pTutor = (p.owner || p.ownerName || '').toLowerCase().trim();
        const matchPet = (pPet === cleanNewPet || pPet.includes(cleanNewPet) || cleanNewPet.includes(pPet));
        const matchTutor = (pTutor === cleanNewTutor || pTutor.includes(cleanNewTutor) || cleanNewTutor.includes(pTutor));
        const matchArea = this.normalizeService(p.area) === targetArea;
        return matchPet && matchTutor && matchArea;
      });
    }

    if (existingIdx !== -1) {
      this.pets[existingIdx] = { ...this.pets[existingIdx], ...newPet, id: this.pets[existingIdx].id };
      newPet.id = this.pets[existingIdx].id;
    } else {
      this.pets.push(newPet);
    }

    this.savePetsToStorage();
    this.render();

    // Sincronizar bidireccionalmente en tiempo real con adminEngine.patientsStatus
    if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
      const aIdx = window.adminEngine.patientsStatus.findIndex(p => p.id === newPet.id);
      if (aIdx !== -1) {
        window.adminEngine.patientsStatus[aIdx] = { ...window.adminEngine.patientsStatus[aIdx], ...newPet };
      } else {
        window.adminEngine.patientsStatus.unshift(newPet);
      }
      if (typeof window.adminEngine.savePatientsToStorage === 'function') {
        window.adminEngine.savePatientsToStorage();
      }
      if (typeof window.adminEngine.renderStatusManager === 'function') {
        window.adminEngine.renderStatusManager();
      }
    }

    return newPet;
  }

  parseTurnNumber(pet) {
    if (!pet) return 999;
    // Pets in stepIndex === 0 (Reservación / not received yet) do NOT have active turn numbers
    if (typeof pet.stepIndex === 'number' && pet.stepIndex === 0) return 999;
    const val = pet.turnNumber !== undefined && pet.turnNumber !== null ? pet.turnNumber : (pet.turno !== undefined && pet.turno !== null ? pet.turno : 999);
    if (val === undefined || val === null || val === '') return 999;
    const num = parseInt(val, 10);
    return (!isNaN(num) && num > 0) ? num : 999;
  }

  sortPetsChronologically(petsArray) {
    return [...petsArray].sort((a, b) => {
      const stepA = typeof a.stepIndex === 'number' ? a.stepIndex : 0;
      const stepB = typeof b.stepIndex === 'number' ? b.stepIndex : 0;

      const isReceivedA = stepA >= 1;
      const isReceivedB = stepB >= 1;

      // Received pets (stepIndex >= 1) appear BEFORE unreceived pets (stepIndex === 0)
      if (isReceivedA && !isReceivedB) return -1;
      if (!isReceivedA && isReceivedB) return 1;

      // If comparing pets from different areas, group by area first
      const areaA = this.normalizeService(a.area);
      const areaB = this.normalizeService(b.area);
      if (areaA !== areaB) {
        return areaA.localeCompare(areaB);
      }

      const turnA = this.parseTurnNumber(a);
      const turnB = this.parseTurnNumber(b);
      if (turnA !== turnB) return turnA - turnB;

      const timeA = this.getPetTimeInMinutes(a);
      const timeB = this.getPetTimeInMinutes(b);
      if (timeA !== timeB) return timeA - timeB;

      return (a.id || '').localeCompare(b.id || '');
    });
  }

  deletePet(petId) {
    if (window.authEngine && window.authEngine.permissionMode === 'view') {
      if (window.app) window.app.showToast('⚠️ Permiso denegado: Estás en Modo Solo Lectura (Consulta).', 'error');
      return;
    }

    const pet = this.pets.find(p => p.id === petId);
    if (!pet) return;

    const petName = pet.petName || pet.name || 'la mascota';
    const ownerName = pet.ownerName || pet.owner || 'el tutor';

    const confirmed = window.confirm(`⚠️ ¿Está seguro que desea eliminar a la mascota "${petName}" (Tutor: ${ownerName}) de la lista de reservaciones y estatus?\n\nEsta acción eliminará el registro del sistema.`);
    if (!confirmed) return;

    // 1. Remove from petStatusEngine
    this.pets = this.pets.filter(p => p.id !== petId);
    this.savePetsToStorage();
    this.render();

    // 2. Sync with adminEngine
    if (window.adminEngine) {
      if (Array.isArray(window.adminEngine.patientsStatus)) {
        window.adminEngine.patientsStatus = window.adminEngine.patientsStatus.filter(p => p.id !== petId && !(p.petName === petName && p.ownerName === ownerName));
        window.adminEngine.savePatientsToStorage();
      }
      if (Array.isArray(window.adminEngine.bookedAppointments)) {
        window.adminEngine.bookedAppointments = window.adminEngine.bookedAppointments.filter(a => a.id !== petId && !(a.pet && a.pet.toLowerCase() === petName.toLowerCase()));
        window.adminEngine.saveReservationsToStorage();
      }
      if (Array.isArray(window.adminEngine.pendingAppointments)) {
        window.adminEngine.pendingAppointments = window.adminEngine.pendingAppointments.filter(p => p.id !== petId && !(p.pet && p.pet.toLowerCase() === petName.toLowerCase()));
        window.adminEngine.saveReservationsToStorage();
      }
      if (typeof window.adminEngine.refreshAllOperationalViews === 'function') {
        window.adminEngine.refreshAllOperationalViews();
      }
    }

    // 3. Sync with clinicaEngine
    if (window.clinicaEngine) {
      if (window.clinicaEngine.patientsDatabase && window.clinicaEngine.patientsDatabase[petId]) {
        delete window.clinicaEngine.patientsDatabase[petId];
      }
      if (typeof window.clinicaEngine.refreshPendingApprovalsNotifications === 'function') {
        window.clinicaEngine.refreshPendingApprovalsNotifications();
      }
    }

    if (window.app) {
      window.app.showToast(`🗑️ Reservación / registro de "${petName}" (${ownerName}) eliminado.`, 'info');
    }
  }

  resequenceTurnsForArea(area = 'grooming', targetDate = null) {
    const cleanArea = this.normalizeService(area);
    const areaPets = this.pets.filter(p => p && this.normalizeService(p.area) === cleanArea);

    // 1. Separate pets in stepIndex === 0 (Reservación / Pendiente por Recibir)
    const reservationPets = areaPets.filter(p => !p.stepIndex || p.stepIndex <= 0);
    reservationPets.forEach(p => {
      p.turnNumber = null;
      p.turno = null;
      p.turnTicket = null;
    });

    // 2. Filter received pets (stepIndex >= 1)
    const receivedPets = areaPets.filter(p => typeof p.stepIndex === 'number' && p.stepIndex >= 1);

    if (cleanArea === 'grooming') {
      const defaultGroomingOrder = ['PET-101', 'PET-102', 'PET-103', 'PET-106', 'PET-109', 'PET-111', 'PET-112', 'PET-105', 'PET-110', 'PET-107'];
      receivedPets.sort((a, b) => {
        const turnA = (typeof a.turnNumber === 'number' && a.turnNumber > 0) ? a.turnNumber : 999;
        const turnB = (typeof b.turnNumber === 'number' && b.turnNumber > 0) ? b.turnNumber : 999;
        if (turnA !== turnB && turnA !== 999 && turnB !== 999) return turnA - turnB;

        const idxA = defaultGroomingOrder.indexOf(a.id);
        const idxB = defaultGroomingOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;

        return (a.id || '').localeCompare(b.id || '');
      });
    } else if (cleanArea === 'clinica') {
      const defaultClinicaOrder = ['PET-108'];
      receivedPets.sort((a, b) => {
        const turnA = (typeof a.turnNumber === 'number' && a.turnNumber > 0) ? a.turnNumber : 999;
        const turnB = (typeof b.turnNumber === 'number' && b.turnNumber > 0) ? b.turnNumber : 999;
        if (turnA !== turnB && turnA !== 999 && turnB !== 999) return turnA - turnB;

        const idxA = defaultClinicaOrder.indexOf(a.id);
        const idxB = defaultClinicaOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;

        return (a.id || '').localeCompare(b.id || '');
      });
    } else if (cleanArea === 'hotel') {
      const defaultHotelOrder = ['PET-104'];
      receivedPets.sort((a, b) => {
        const turnA = (typeof a.turnNumber === 'number' && a.turnNumber > 0) ? a.turnNumber : 999;
        const turnB = (typeof b.turnNumber === 'number' && b.turnNumber > 0) ? b.turnNumber : 999;
        if (turnA !== turnB && turnA !== 999 && turnB !== 999) return turnA - turnB;

        const idxA = defaultHotelOrder.indexOf(a.id);
        const idxB = defaultHotelOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;

        return (a.id || '').localeCompare(b.id || '');
      });
    } else {
      receivedPets.sort((a, b) => {
        const turnA = (typeof a.turnNumber === 'number' && a.turnNumber > 0) ? a.turnNumber : 999;
        const turnB = (typeof b.turnNumber === 'number' && b.turnNumber > 0) ? b.turnNumber : 999;
        return turnA - turnB;
      });
    }

    // 3. Assign 1..N turn numbers strictly to received pets of this area
    receivedPets.forEach((p, idx) => {
      p.turnNumber = idx + 1;
      p.turno = idx + 1;
      p.turnTicket = this.formatTurnTicket(cleanArea, idx + 1);
    });

    this.savePetsToStorage();

    if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
      areaPets.forEach(p => {
        const match = window.adminEngine.patientsStatus.find(ap => ap.id === p.id);
        if (match) {
          match.turnNumber = p.turnNumber;
          match.turno = p.turno;
          match.turnTicket = p.turnTicket;
        }
      });
      window.adminEngine.savePatientsToStorage();
    }
  }

  forceResequenceAllTurns() {
    if (!this.isStaffMode()) {
      if (window.app) window.app.showToast('🔒 Permiso denegado: El ordenamiento correlativo de turnos es exclusivo del área administrativa / Staff.', 'error');
      return;
    }
    this.resequenceTurnsForArea('grooming');
    this.resequenceTurnsForArea('clinica');
    this.resequenceTurnsForArea('hotel');
    this.resequenceTurnsForArea('tienda');
    this.render();
    if (window.adminEngine && typeof window.adminEngine.renderStatusManager === 'function') {
      window.adminEngine.renderStatusManager();
    }
    if (window.app) {
      window.app.showToast('🔢 Turnos reordenados correlativamente e independientes por área (Grooming: 1, 2... Clínica: 1, 2... Hotel: 1, 2...).', 'success');
    }
  }

  changePetTurnNumber(petId, newTurnNum) {
    if (window.authEngine && window.authEngine.permissionMode === 'view') {
      if (window.app) window.app.showToast('⚠️ Permiso denegado: Estás en Modo Solo Lectura.', 'error');
      return;
    }

    const targetPet = this.pets.find(p => p.id === petId);
    if (!targetPet) return;

    const parsedTurn = parseInt(newTurnNum, 10);
    if (isNaN(parsedTurn) || parsedTurn <= 0) {
      if (window.app) window.app.showToast('⚠️ Ingrese un número de turno válido mayor a 0.', 'error');
      return;
    }

    const petArea = this.normalizeService(targetPet.area);
    const areaDisplayName = this.getAreaDisplayName(petArea);
    const todayStr = targetPet.reservationDate || targetPet.date || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    // Get all other pets in the same area for today
    const areaPets = this.pets.filter(p => {
      if (!p || p.id === petId) return false;
      const pArea = this.normalizeService(p.area);
      const pDate = p.reservationDate || p.date || todayStr;
      return pArea === petArea && pDate === todayStr;
    });

    areaPets.sort((a, b) => {
      const turnA = (typeof a.turnNumber === 'number' && a.turnNumber > 0) ? a.turnNumber : 999;
      const turnB = (typeof b.turnNumber === 'number' && b.turnNumber > 0) ? b.turnNumber : 999;
      return turnA - turnB;
    });

    // Assign requested turn to target pet
    targetPet.turnNumber = parsedTurn;
    targetPet.turno = parsedTurn;
    targetPet.turnTicket = this.formatTurnTicket(petArea, parsedTurn);

    // Re-index remaining pets around target pet within this specific department
    let currentCounter = 1;
    areaPets.forEach(p => {
      if (currentCounter === parsedTurn) {
        currentCounter++;
      }
      p.turnNumber = currentCounter;
      p.turno = currentCounter;
      p.turnTicket = this.formatTurnTicket(petArea, currentCounter);
      currentCounter++;
    });

    this.savePetsToStorage();

    if (window.adminEngine) {
      if (Array.isArray(window.adminEngine.patientsStatus)) {
        this.pets.forEach(p => {
          const match = window.adminEngine.patientsStatus.find(ap => ap.id === p.id);
          if (match) {
            match.turnNumber = p.turnNumber;
            match.turno = p.turno;
            match.turnTicket = p.turnTicket;
          }
        });
        window.adminEngine.savePatientsToStorage();
        if (typeof window.adminEngine.refreshAllOperationalViews === 'function') {
          window.adminEngine.refreshAllOperationalViews();
        }
      }
    }

    this.render();

    const petName = targetPet.petName || targetPet.name || 'Mascota';
    if (window.app) {
      window.app.showToast(`✅ Turno de "${petName}" en ${areaDisplayName} reordenado a #${String(parsedTurn).padStart(2, '0')} (Turno ${parsedTurn} - ${areaDisplayName}). Secuencia correlativa de ${areaDisplayName} reajustada.`, 'success');
    }
  }

  openChangeTurnModal(petId) {
    if (!this.isStaffMode()) {
      if (window.app) window.app.showToast('🔒 Permiso denegado: La edición de turnos es una función exclusiva del personal de Staff.', 'error');
      return;
    }
    const pet = this.pets.find(p => p.id === petId);
    if (!pet) return;

    const petName = pet.petName || pet.name || 'la mascota';
    const currentTurn = pet.turnNumber || 1;

    const inputVal = window.prompt(`🏷️ REORDENAR Y CORREGIR TURNO DE ATENCIÓN:\n\nMascota: ${petName} (Tutor: ${pet.ownerName || pet.owner || 'Tutor VIP'})\nTurno Actual: #${String(currentTurn).padStart(2, '0')}\n\nIngrese el nuevo número de turno deseado (ej: 1, 2, 3, 4...):`, currentTurn);

    if (inputVal !== null && inputVal.trim() !== '') {
      this.changePetTurnNumber(petId, inputVal.trim());
    }
  }

  bindEvents() {
    const filterBtns = document.querySelectorAll('.pet-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-area');
        this.render();
      });
    });
  }

  changeStepDirectly(petId, newStepIdx) {
    if (!this.isStaffMode()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Modo Vista Cliente: Solo lectura.', 'info');
      }
      return;
    }
    const pet = this.pets.find(p => p.id === petId);
    if (!pet) return;

    const targetIdx = parseInt(newStepIdx, 10);
    const steps = this.workflows[pet.area] || [];
    const currentIdx = pet.stepIndex >= 0 ? pet.stepIndex : 0;

    // Si la etapa destino o actual involucra Revisión Dérmica, o es una transición que requiere firma,
    // abrir automáticamente el modal oficial de evaluación dérmica, asignación de responsable y firma
    const isDermalTransition = (steps[targetIdx] || '').toLowerCase().includes('dérmic') || 
                               (steps[targetIdx] || '').toLowerCase().includes('dermic') ||
                               (steps[currentIdx] || '').toLowerCase().includes('dérmic') || 
                               (steps[currentIdx] || '').toLowerCase().includes('dermic') ||
                               (pet.area === 'grooming' && (targetIdx === 2 || currentIdx === 2));

    if (isDermalTransition || targetIdx !== currentIdx) {
      // Revertir temporalmente el select visual de la tarjeta al índice previo hasta que confirme en el modal
      const cardSelect = document.getElementById(`card-step-select-${pet.id}`) || document.querySelector(`select[onchange*="changeStepDirectly('${pet.id}'"]`);
      if (cardSelect) cardSelect.value = currentIdx;

      this.openAdvanceStepModal(petId, targetIdx);
      return;
    }

    pet.stepIndex = targetIdx;
    
    const currentStepName = steps[targetIdx] || 'En Proceso';
    const staffName = window.adminEngine?.currentStaffUser?.name || 'Dra. Patricia Silva (Staff Especialista)';
    pet.notes = `Etapa actualizada a "${currentStepName}" por ${staffName}.`;

    if (!pet.traceLogs) pet.traceLogs = [];
    pet.traceLogs.push({
      stepName: currentStepName,
      stationKey: this.getStationKeyForStep(pet.area, targetIdx),
      staffName: staffName,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString()
    });

    const normArea = this.normalizeService(pet.area);

    // Cargar automáticamente costo de servicio si pasa a Recibido (etapa 1)
    if (targetIdx === 1 && normArea === 'grooming' && window.storeEngine && typeof window.storeEngine.chargeGroomingServiceToCart === 'function') {
      try {
        window.storeEngine.chargeGroomingServiceToCart({
          tutor: pet.ownerName || pet.owner,
          tutorId: pet.rif || pet.ownerId || '',
          rif: pet.rif || '',
          pet: pet.petName || pet.name,
          service: pet.service || 'Circuito Grooming Spa (7 Estaciones)',
          price: 25.00,
          petId: pet.id
        });
      } catch(e) {}
    } else if (targetIdx === 1 && normArea === 'clinica' && window.storeEngine && typeof window.storeEngine.chargeClinicalConsultationToCart === 'function') {
      try {
        window.storeEngine.chargeClinicalConsultationToCart({
          tutor: pet.ownerName || pet.owner,
          tutorId: pet.rif || pet.ownerId || '',
          rif: pet.rif || '',
          pet: pet.petName || pet.name,
          service: 'Consulta Médica Veterinaria',
          price: typeof pet.price === 'number' ? pet.price : 30.00,
          petId: pet.id
        });
      } catch(e) {}
    } else if (targetIdx === 1 && normArea === 'hotel' && window.storeEngine && typeof window.storeEngine.chargeHotelServiceToCart === 'function') {
      try {
        window.storeEngine.chargeHotelServiceToCart({
          tutor: pet.ownerName || pet.owner,
          tutorId: pet.rif || pet.ownerId || '',
          rif: pet.rif || '',
          pet: pet.petName || pet.name,
          service: pet.service || 'Hospedaje Suite Bioclimática VIP (Check-in Hotel 5★)',
          price: typeof pet.price === 'number' ? pet.price : 45.00,
          petId: pet.id
        });
      } catch(e) {}
    }

    // 🩺 Facturar servicios y exámenes clínicos si pasa a "Culminación de Examen / Alta Médica" (Estatus 6, índice 5 o 6)
    const isClinica = normArea === 'clinica';
    const isAltaMedica = targetIdx === 6 || targetIdx === 7 || (currentStepName && (currentStepName.toLowerCase().includes('alta') || currentStepName.toLowerCase().includes('culminación')));
    if (isClinica && isAltaMedica && window.storeEngine && typeof window.storeEngine.chargeClinicalServicesToCart === 'function') {
      try {
        window.storeEngine.chargeClinicalServicesToCart({
          tutor: pet.ownerName || pet.owner,
          tutorId: pet.rif || pet.ownerId || '',
          rif: pet.rif || '',
          pet: pet.petName || pet.name,
          service: pet.service,
          notes: pet.notes,
          petId: pet.id
        });
      } catch(e) {}
    }

    this.resequenceTurnsForArea(normArea);
    this.savePetsToStorage();
    if (window.adminEngine && typeof window.adminEngine.syncPatientStatusFromTracker === 'function') {
      window.adminEngine.syncPatientStatusFromTracker(petId, targetIdx);
    }

    // 🔔 DISPARAR NOTIFICACIONES EN PANTALLA Y AUTOMATIZACIÓN POR WHATSAPP
    if (window.liveNotificationEngine) {
      try {
        const isHotel = (normArea === 'hotel' || pet.area === 'hotel');
        if (targetIdx === 1) {
          if (isHotel && typeof window.liveNotificationEngine.notifyHotelPetReceived === 'function') {
            window.liveNotificationEngine.notifyHotelPetReceived(pet);
          } else if (typeof window.liveNotificationEngine.notifyPetReceived === 'function') {
            window.liveNotificationEngine.notifyPetReceived(pet);
          }
        } else if (targetIdx >= steps.length - 1) {
          if (isHotel && typeof window.liveNotificationEngine.notifyHotelPetReadyHome === 'function') {
            window.liveNotificationEngine.notifyHotelPetReadyHome(pet);
          }
          if (typeof window.liveNotificationEngine.notifyPetDelivered === 'function') {
            window.liveNotificationEngine.notifyPetDelivered(pet);
          }
        }
      } catch (errDirectNotif) {
        console.warn('[PET STATUS] Error en notificación changeStepDirectly:', errDirectNotif);
      }
    }

    this.render();
    this.syncPetStatusToServer(pet);

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✨ ${pet.petName || pet.name} cambió a la etapa: ${targetIdx + 1}. ${currentStepName}`, 'success');
    }
  }

  setStatusFilter(statusFilter, btnEl) {
    this.currentStatusFilter = statusFilter;
    const buttons = document.querySelectorAll('.status-process-btn');
    buttons.forEach(b => {
      const match = b.getAttribute('data-status') === statusFilter;
      b.style.background = match ? 'var(--gold-dark, #D4AF37)' : 'transparent';
      b.style.color = match ? '#fff' : '#64748b';
      if (match) b.classList.add('active'); else b.classList.remove('active');
    });
    this.render();
  }

  setDateFilter(dateFilter = 'today', btnEl = null) {
    this.currentDateFilter = dateFilter;
    const buttons = document.querySelectorAll('.status-date-btn');
    buttons.forEach(b => {
      b.style.background = 'transparent';
      b.style.color = '#64748b';
      b.classList.remove('active');
    });
    const activeBtn = btnEl || document.querySelector(`.status-date-btn[data-date-filter="${dateFilter}"]`);
    if (activeBtn) {
      activeBtn.style.background = 'var(--gold-dark, #D4AF37)';
      activeBtn.style.color = '#fff';
      activeBtn.classList.add('active');
    }

    const customContainer = document.getElementById('status-custom-date-container');
    if (customContainer) {
      customContainer.style.display = dateFilter === 'custom' ? 'flex' : 'none';
      if (dateFilter === 'custom') {
        const fromInput = document.getElementById('status-date-from');
        const toInput = document.getElementById('status-date-to');
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (fromInput && !fromInput.value) fromInput.value = todayStr;
        if (toInput && !toInput.value) toInput.value = todayStr;
        this.customFrom = fromInput ? fromInput.value : todayStr;
        this.customTo = toInput ? toInput.value : todayStr;
      }
    }

    this.render();
  }

  onCustomDateChange() {
    const fromInput = document.getElementById('status-date-from');
    const toInput = document.getElementById('status-date-to');
    this.customFrom = fromInput ? fromInput.value : '';
    this.customTo = toInput ? toInput.value : '';
    this.render();
  }

  getPetTimeInMinutes(pet) {
    const timeStr = pet.reservationTime || pet.time;
    if (!timeStr) return (pet.turnNumber || 99) * 10;

    const clean = String(timeStr).trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const digitsOnly = clean.replace(/[^0-9:]/g, '');
    const parts = digitsOnly.split(':');

    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }



  normalizeString(str) {
    if (!str) return '';
    return str.toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  normalizePetBaseName(petName) {
    if (window.storeEngine && typeof window.storeEngine.normalizePetBaseName === 'function') {
      return window.storeEngine.normalizePetBaseName(petName);
    }
    if (!petName) return '';
    let str = String(petName).trim();
    const parenMatch = str.match(/\((.*?)\)/);
    const outside = str.split('(')[0].trim();
    const isOutsideRoom = /^(suite|habitaci[oó]n|canil|cama|box|jaula|sala|area|alojamiento)\b/i.test(outside);

    if (isOutsideRoom && parenMatch && parenMatch[1]) {
      const inside = parenMatch[1].trim();
      const insideParts = inside.split(/[-/:]/);
      str = insideParts.length > 0 ? insideParts[0].trim() : inside;
    } else if (outside && outside.length >= 2 && !isOutsideRoom) {
      const outsideParts = outside.split(/[-/:]/);
      str = outsideParts.length > 0 ? outsideParts[0].trim() : outside;
    } else if (parenMatch && parenMatch[1]) {
      const inside = parenMatch[1].trim();
      const insideParts = inside.split(/[-/:]/);
      str = insideParts.length > 0 ? insideParts[0].trim() : inside;
    }
    let cleaned = str.replace(/\b(pr[ií]ncipe|princesa|vip|consentid[oa]|mascota)\b\s+/gi, '').trim();
    if (!cleaned) cleaned = str;
    return this.normalizeString(cleaned);
  }

  normalize(str) {
    return (str || '').toString().toLowerCase().trim();
  }

  normalizeService(area) {
    if (!area) return '';
    // Limpieza profunda: elimina saltos de línea (\r, \n), tabulaciones y espacios
    const clean = area.toString().replace(/[\r\n\t]+/g, ' ').trim().toLowerCase();
    
    if (['grooming', 'peluqueria', 'peluquería', 'estetica', 'estética', 'spa'].includes(clean)) {
      return 'grooming';
    }
    if (['clinica', 'clínica', 'veterinaria', 'consulta'].includes(clean)) {
      return 'clinica';
    }
    if (['hotel', 'guarderia', 'guardería', 'daycare', 'hospedaje'].includes(clean)) {
      return 'hotel';
    }
    if (['tienda', 'shop', 'farmacia'].includes(clean)) {
      return 'tienda';
    }
    return clean || 'grooming';
  }

  getAreaDisplayName(area) {
    const clean = this.normalizeService(area);
    if (clean === 'grooming') return 'Grooming';
    if (clean === 'clinica') return 'Clínica';
    if (clean === 'hotel') return 'Hotel';
    if (clean === 'tienda') return 'Tienda';
    return 'Servicio VIP';
  }

  matchAreaFilter(petArea, currentFilter) {
    const target = this.normalizeService(currentFilter);
    if (!target || target === 'all' || target === 'todas') return true;
    const petNorm = this.normalizeService(petArea);
    return petNorm === target;
  }

  setAreaFilter(areaFilter, btnEl) {
    this.currentFilter = areaFilter;
    if (window.adminEngine) {
      window.adminEngine.statusFilterArea = areaFilter;
    }
    const buttons = document.querySelectorAll('.pet-filter-btn');
    buttons.forEach(b => {
      const match = b.getAttribute('data-area') === areaFilter;
      b.style.background = match ? 'var(--gold-dark, #D4AF37)' : 'transparent';
      b.style.color = match ? '#fff' : '#64748b';
      if (match) b.classList.add('active'); else b.classList.remove('active');
    });
    this.render();
    if (window.adminEngine && typeof window.adminEngine.renderStatusManager === 'function') {
      window.adminEngine.renderStatusManager();
    }
  }

  isWithinDateRange(pet, dateFilter) {
    if (!dateFilter || dateFilter === 'all_dates') return true;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let dateStr = pet.reservationDate || pet.date;

    if (!dateStr) {
      if (pet.createdAt) {
        dateStr = pet.createdAt.split('T')[0];
      } else if (pet.updatedAt && (pet.updatedAt.includes('Hace') || pet.updatedAt.includes('Hoy') || pet.updatedAt.includes('min') || pet.updatedAt.includes('hora'))) {
        dateStr = todayStr;
      }
    }

    if (!dateStr && pet.id && pet.id.startsWith('PET-')) {
      const parts = pet.id.split('-');
      if (parts[1] && !isNaN(parts[1]) && parts[1].length >= 10) {
        const d = new Date(parseInt(parts[1], 10));
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
      }
    }

    if (!dateStr) dateStr = todayStr;

    const petDate = new Date(dateStr + 'T00:00:00');
    if (isNaN(petDate.getTime())) return true;

    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const petDayStart = new Date(petDate.getFullYear(), petDate.getMonth(), petDate.getDate());

    // diffDays: 0 = today, positive = past days, negative = future days
    const diffDays = Math.round((todayStart.getTime() - petDayStart.getTime()) / (1000 * 3600 * 24));

    const isFuture = (dateStr > todayStr) || (diffDays < 0);
    const isToday = (dateStr === todayStr) || (diffDays === 0);

    if (dateFilter === 'today') {
      // 🔒 REGLA ESTRICTA: Las citas a futuro NUNCA deben aparecer en 'Hoy' bajo ninguna circunstancia
      if (isFuture) return false;

      // Si la fecha programada es hoy, incluir
      if (isToday) return true;

      // Pacientes admitidos físicamente en clínica/hotel en días previos que siguen hospitalizados/en proceso activo hoy
      if (typeof pet.stepIndex === 'number' && pet.stepIndex >= 1) {
        const steps = (this.workflows && this.workflows[pet.area]) || [];
        const isCompleted = steps.length > 0 ? (pet.stepIndex >= steps.length - 1) : (pet.stepIndex >= 7);
        if (!isCompleted) return true;
      }

      return false;
    } else if (dateFilter === 'future' || dateFilter === 'upcoming' || dateFilter === 'next_week' || dateFilter === 'nextWeek') {
      return isFuture;
    } else if (dateFilter === 'week') {
      // Semana cubre desde 7 días en el pasado hasta 7 días a futuro (esta semana y próximos 7 días)
      return diffDays >= -7 && diffDays <= 7;
    } else if (dateFilter === 'fortnight') {
      return diffDays >= -15 && diffDays <= 15;
    } else if (dateFilter === 'month') {
      return diffDays >= -30 && diffDays <= 30;
    } else if (dateFilter === 'custom') {
      const fromVal = this.customFrom || document.getElementById('status-date-from')?.value;
      const toVal = this.customTo || document.getElementById('status-date-to')?.value;
      if (!fromVal && !toVal) return true;
      let valid = true;
      if (fromVal) {
        const fromDate = new Date(fromVal + 'T00:00:00');
        if (!isNaN(fromDate.getTime())) valid = valid && (petDayStart >= fromDate);
      }
      if (toVal) {
        const toDate = new Date(toVal + 'T23:59:59');
        if (!isNaN(toDate.getTime())) valid = valid && (petDayStart <= toDate);
      }
      return valid;
    }

    return true;
  }

  showDeliveredReport() {
    if (!this.isStaffMode()) return;
    const reportText = this.getDeliveredToday();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('📊 Reporte de clientes entregados cargado.', 'info');
    }
    alert(reportText);
  }

  getDeliveredToday() {
    const deliveredPets = this.pets.filter(p => {
      const steps = this.workflows[p.area] || [];
      return p.stepIndex >= steps.length - 1;
    });

    if (deliveredPets.length === 0) {
      return "No hay mascotas entregadas en la lista de Procesados por los momentos hoy.";
    }

    const lines = deliveredPets.map((p, idx) => {
      const areaName = p.area === 'grooming' ? 'Grooming Spa' : (p.area === 'clinica' ? 'Clínica Veterinaria' : 'Hotel 5★');
      const timeStr = p.deliveredAt || p.updatedAt || 'Hoy';
      const staffStr = p.deliveredBy ? ` por ${p.deliveredBy}` : '';
      return `${idx + 1}. ${p.petName || p.name || 'Mascota VIP'} (${p.species || 'Canino VIP'}) - Tutor: ${p.ownerName || p.owner || 'Tutor VIP'} • Área: ${areaName} • Entregado a las ${timeStr}${staffStr}.`;
    });

    return `🐾 PACIENTES Y CLIENTES ENTREGADOS HOY EN MRS. PETS:\n\n` + lines.join('\n');
  }

  getStationKeyForStep(area, stepIndex) {
    const cleanArea = this.normalizeService(area);
    if (cleanArea === 'clinica') {
      if (stepIndex <= 1) return 'recepcion';
      if (stepIndex === 2) return 'triaje';
      if (stepIndex === 3) return 'consulta';
      if (stepIndex === 4) return 'diagnostico';
      if (stepIndex === 5) return 'hospitalizacion';
      if (stepIndex === 6) return 'alta_medica';
      return 'entrega';
    }
    if (cleanArea === 'hotel') {
      if (stepIndex <= 1) return 'recepcion';
      return 'entrega';
    }
    // Grooming
    if (stepIndex <= 1) return 'recepcion';
    if (stepIndex === 2) return 'revision_dermica';
    if (stepIndex === 3) return 'bano';
    if (stepIndex === 4) return 'deslanado';
    if (stepIndex === 5) return 'corte';
    return 'entrega';
  }

  getAuthorizedStaffForStation(stationKey, area) {
    if (window.adminEngine && typeof window.adminEngine.getAuthorizedStaffForStation === 'function') {
      const res = window.adminEngine.getAuthorizedStaffForStation(stationKey, area);
      if (res && res.length > 0) return res;
    }
    const cleanArea = this.normalizeService(area);
    if (cleanArea === 'clinica') {
      return [
        { id: 'USR-01', name: 'Dr. Alejandro Morales', rol_principal: 'doctor', role: 'doctor' },
        { id: 'USR-08', name: 'Dra. Patricia Silva', rol_principal: 'doctor', role: 'doctor' }
      ];
    }
    return [
      { id: 'USR-02', name: 'Mariana Colina (Grooming Lead)', rol_principal: 'groomer', role: 'groomer' },
      { id: 'USR-05', name: 'Andrea Colina (Grooming Specialist)', rol_principal: 'groomer', role: 'groomer' }
    ];
  }

  getTurnLabel(pet) {
    if (!pet) return 'Sin Turno';
    const areaName = this.getAreaDisplayName(pet.area);
    const turn = pet.turnNumber || pet.turno;
    const ticket = pet.turnTicket || this.formatTurnTicket(pet.area, turn);
    if (typeof pet.stepIndex === 'number' && pet.stepIndex >= 1 && turn && turn > 0) {
      return `Turno ${ticket || turn} - ${areaName}`;
    }
    if (turn && turn > 0) {
      return `Turno ${ticket || turn} - ${areaName}`;
    }
    return `Reservación - ${areaName} (Sin Turno)`;
  }

  getTurnShortBadge(pet) {
    if (!pet) return '---';
    const areaName = this.getAreaDisplayName(pet.area);
    const turn = pet.turnNumber || pet.turno;
    const ticket = pet.turnTicket || this.formatTurnTicket(pet.area, turn);
    if (ticket) {
      return `${ticket} (${areaName})`;
    }
    if (turn && turn > 0) {
      return `${areaName} #${String(turn).padStart(2, '0')}`;
    }
    return `${areaName} (Sin Turno)`;
  }

  checkIsNextInQueue(pet) {
    if (pet.area !== 'grooming') return false;
    const steps = this.workflows['grooming'] || [];
    // If pet is already in station (stepIndex >= 2) or completed (stepIndex >= 7), it is NOT waiting next in turn!
    if (pet.stepIndex >= 2 || pet.stepIndex < 0) return false;

    // Must match current date filter (a future reservation is not next for today)
    if (!this.isWithinDateRange(pet, this.currentDateFilter)) return false;

    const groomingActive = this.pets.filter(p => {
      const isGrooming = p.area === 'grooming';
      const matchDate = this.isWithinDateRange(p, this.currentDateFilter);
      return isGrooming && matchDate && p.stepIndex <= 1 && p.stepIndex >= 0;
    });

    const waitingQueue = this.sortPetsChronologically(groomingActive);
    return waitingQueue[0] && waitingQueue[0].id === pet.id;
  }

  renderGroomingQueueWidget() {
    const container = document.getElementById('grooming-queue-banner');
    if (!container) return;

    const isStaff = this.isStaffMode();
    const { activePetId, activeCustomerName, activeCustomerPhone } = this.getActiveCustomerInfo();

    if (!isStaff) {
      // ==================== VISTA CLIENTE PRIVADA (SOLO BANNER DE SU MASCOTA Y ÁREA) ====================
      const clientPets = this.pets.filter(p => this.isClientMatch(p, activeCustomerName, activeCustomerPhone, activePetId) && this.isWithinDateRange(p, this.currentDateFilter));
      let clientPet = null;
      if (activePetId) {
        clientPet = clientPets.find(p => p.id === activePetId);
      }
      if (!clientPet && clientPets.length > 0) {
        clientPet = clientPets[0];
      }

      if (!clientPet) {
        // En Vista Tutor VIP, si no hay citas registradas para el período activo (ej. Hoy), buscar si tiene una cita activa reservada
        const allClientPets = this.pets.filter(p => this.isClientMatch(p, activeCustomerName, activeCustomerPhone, activePetId) && p.hasReservation !== false && !p.isCompleted);
        if (allClientPets.length > 0) {
          clientPet = activePetId ? (allClientPets.find(p => p.id === activePetId) || allClientPets[0]) : allClientPets[0];
        }
      }

      if (!clientPet) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
      }

      container.style.display = 'block';

      const clientPetName = clientPet.petName || clientPet.name || 'Tu Mascota';
      const clientSpecies = clientPet.species || 'Canino VIP';
      const clientArea = this.normalizeService(clientPet.area || 'grooming');
      const clientAreaDisplayName = this.getAreaDisplayName(clientArea);
      const steps = (this.workflows && (this.workflows[clientArea] || this.workflows[clientPet.area])) || (this.workflows.grooming || []);
      const clientTurnNumber = clientPet.turnNumber || clientPet.turno;
      const clientStepIdx = typeof clientPet.stepIndex === 'number' ? clientPet.stepIndex : 0;
      const currentStepName = steps[clientStepIdx] || 'En Proceso';
      const progressPercent = Math.round(((clientStepIdx + 1) / steps.length) * 100);

      let turnStatusLabel = `📋 REGISTRADO EN ${clientAreaDisplayName.toUpperCase()}`;
      let turnBadgeColor = '#FBBF24';
      if (clientStepIdx === 1) {
        turnStatusLabel = `👉 ¡TU TURNO ES EL PRÓXIMO EN ${clientAreaDisplayName.toUpperCase()}!`;
        turnBadgeColor = '#10B981';
      } else if (clientStepIdx > 1 && clientStepIdx < steps.length - 1) {
        turnStatusLabel = `💈 PACIENTE EN ATENCIÓN (${clientAreaDisplayName.toUpperCase()})`;
        turnBadgeColor = '#D4AF37';
      } else if (clientStepIdx >= steps.length - 1) {
        turnStatusLabel = `🎉 ATENCIÓN FINALIZADA Y ENTREGADO`;
        turnBadgeColor = '#059669';
      }

      container.innerHTML = `
        <div style="background:linear-gradient(135deg, #0F172A, #1E293B); border:2px solid #D4AF37; border-radius:20px; padding:16px 20px; margin-bottom:20px; color:#FFFFFF; box-shadow:0 8px 24px rgba(0,0,0,0.25);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:10px;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <div style="background:#D4AF37; color:#0F172A; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:900;">👑</div>
              <div>
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                  <h3 style="margin:0; font-size:1.1rem; font-weight:900; color:#FFFFFF; display:flex; align-items:center; gap:8px;">
                    <span>📌 Tiempo en vivo: ${clientPetName} en ${clientAreaDisplayName}</span>
                  </h3>
                  <span class="badge" style="background:#D4AF37; color:#121214; font-weight:900; font-size:0.75rem;">Portal Privado Tutor VIP</span>
                </div>
                <p style="margin:4px 0 0 0; font-size:0.78rem; color:#CBD5E1;">Cliente Activo: <strong>${activeCustomerName}</strong> • Tiempo en vivo particionado por departamento.</p>
              </div>
            </div>

            <button type="button" class="btn btn-sm" onclick="authEngine.openVipLookupModal('')" style="background:rgba(212,175,55,0.2); color:#D4AF37; border:1px solid #D4AF37; font-weight:800; padding:6px 14px; border-radius:10px; font-size:0.78rem; cursor:pointer;">
              👤 Cambiar Cliente VIP
            </button>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
            <!-- CARD 1: TU TURNO CORRELATIVO ASIGNADO POR ÁREA -->
            <div style="background:rgba(16, 185, 129, 0.12); border:1.5px solid ${turnBadgeColor}; border-radius:14px; padding:12px 16px; display:flex; align-items:center; gap:14px;">
              <div style="background:${turnBadgeColor}; color:white; padding:8px 12px; border-radius:12px; font-weight:900; font-size:1.05rem; text-align:center; min-width:85px; box-shadow:0 4px 12px rgba(16,185,129,0.3); line-height:1.2;">
                <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em;">${clientAreaDisplayName}</div>
                <div style="font-size:1.35rem;">${clientPet.turnTicket || (clientTurnNumber ? '#' + String(clientTurnNumber).padStart(2, '0') : '--')}</div>
              </div>
              <div style="flex:1;">
                <div style="font-size:0.72rem; font-weight:800; color:${turnBadgeColor}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">${turnStatusLabel}</div>
                <div style="font-size:1rem; font-weight:900; color:#FFFFFF;">${clientPetName} <span style="font-size:0.78rem; font-weight:600; color:#CBD5E1;">(${clientSpecies})</span></div>
                <div style="font-size:0.75rem; color:#A7F3D0; margin-top:2px;">
                  Turno Asignado: <strong style="color:#D4AF37;">Turno ${clientPet.turnTicket || clientTurnNumber || 1} - ${clientAreaDisplayName}</strong> • Tutor: <strong>${activeCustomerName}</strong>
                </div>
              </div>
            </div>

            <!-- CARD 2: ESTACIÓN ACTUAL EN TIEMPO REAL -->
            <div style="background:rgba(212, 175, 55, 0.12); border:1.5px solid #D4AF37; border-radius:14px; padding:12px 16px; display:flex; align-items:center; gap:14px;">
              <div style="background:#D4AF37; color:#0F172A; padding:8px 12px; border-radius:12px; font-weight:900; font-size:1.15rem; text-align:center; min-width:64px; box-shadow:0 4px 12px rgba(212,175,55,0.3);">
                ${progressPercent}%
              </div>
              <div style="flex:1;">
                <div style="font-size:0.72rem; font-weight:800; color:#FBBF24; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">💈 ESTACIÓN • TIEMPO EN VIVO (${clientAreaDisplayName.toUpperCase()})</div>
                <div style="font-size:1rem; font-weight:900; color:#FFFFFF;">Etapa ${clientStepIdx + 1}: ${currentStepName}</div>
                <div style="font-size:0.75rem; color:#FDE68A; margin-top:2px;">Avance en ${clientAreaDisplayName}: <strong>${progressPercent}% completado</strong></div>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // ==================== PANORAMA OPERATIVO COMPLETO (STAFF / EMPRESA) ====================
    const targetMonitorArea = this.normalizeService(this.currentFilter === 'all' ? 'grooming' : this.currentFilter);

    // MODO ESPECIAL: RESUMEN OPERATIVO & FINANCIERO DE TIENDA
    if (targetMonitorArea === 'tienda') {
      this.renderStoreSalesBanner(container);
      return;
    }

    const targetAreaDisplayName = this.getAreaDisplayName(targetMonitorArea);
    const steps = (this.workflows && (this.workflows[targetMonitorArea] || this.workflows.grooming)) || [];

    const activeAreaPets = this.pets.filter(p => {
      const matchArea = this.normalizeService(p.area) === targetMonitorArea;
      const matchDate = this.isWithinDateRange(p, this.currentDateFilter);
      return matchArea && matchDate;
    });

    if (activeAreaPets.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    const sortedPets = this.sortPetsChronologically(activeAreaPets);
    const inStationPets = sortedPets.filter(p => p.stepIndex >= 2 && p.stepIndex < steps.length - 1);
    const waitingQueue = sortedPets.filter(p => p.stepIndex <= 1 && p.stepIndex >= 0);

    const nextPet = waitingQueue[0];
    const currentInStation = inStationPets[0];

    container.innerHTML = `
      <div style="background:linear-gradient(135deg, #0F172A, #1E293B); border:2px solid #D4AF37; border-radius:20px; padding:16px 20px; margin-bottom:20px; color:#FFFFFF; box-shadow:0 8px 24px rgba(0,0,0,0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <div style="background:#D4AF37; color:#0F172A; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:900;">✂️</div>
            <div>
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <h3 style="margin:0; font-size:1.1rem; font-weight:900; color:#FFFFFF; display:flex; align-items:center; gap:8px;">
                  <span>📌 Control de Turnos por Área (${targetAreaDisplayName}) & Orden de Atención</span>
                </h3>
                <button class="btn btn-sm staff-only-resequence-control" onclick="petStatusEngine.forceResequenceAllTurns()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; border:none; padding:7px 16px; border-radius:10px; cursor:pointer; font-size:0.82rem; box-shadow:0 4px 12px rgba(212,175,55,0.4); transition:transform 0.2s ease;">
                  🔢 Ordenar Turnos Correlativamente (1, 2, 3...)
                </button>
              </div>
              <p style="margin:4px 0 0 0; font-size:0.78rem; color:#CBD5E1;">Secuencia independiente por departamento: turnos aislados para Grooming, Clínica y Hotel.</p>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.06); padding:6px 14px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
            <div style="font-size:0.8rem; color:#CBD5E1;">
              <span style="cursor:pointer; text-decoration:underline;" onclick="petStatusEngine.setAreaFilter('${targetMonitorArea}'); petStatusEngine.setStatusFilter('in_progress');" title="Ver mascotas en espera">
                📋 ${targetAreaDisplayName} en Espera: <strong style="color:#FBBF24; font-size:0.95rem;">${waitingQueue.length}</strong>
              </span> | 
              <span style="cursor:pointer; text-decoration:underline;" onclick="petStatusEngine.setAreaFilter('${targetMonitorArea}'); petStatusEngine.setStatusFilter('in_progress');" title="Ver mascotas en atención">
                💈 En Atención: <strong style="color:#10B981; font-size:0.95rem;">${inStationPets.length}</strong>
              </span>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
          <!-- CARD 1: ¿QUIÉN SIGUE? / PRÓXIMO TURNO -->
          <div style="background:rgba(16, 185, 129, 0.12); border:1.5px solid #10B981; border-radius:14px; padding:12px 16px; display:flex; align-items:center; gap:14px;">
            <div style="background:#10B981; color:white; padding:8px 12px; border-radius:12px; font-weight:900; font-size:1.05rem; text-align:center; min-width:80px; box-shadow:0 4px 12px rgba(16,185,129,0.3); line-height:1.2;">
              <div style="font-size:0.72rem; text-transform:uppercase;">${targetAreaDisplayName}</div>
              <div style="font-size:1.35rem;">${nextPet ? (nextPet.turnTicket || '#' + String(nextPet.turnNumber || 1).padStart(2, '0')) : '--'}</div>
            </div>
            <div style="flex:1;">
              <div style="font-size:0.72rem; font-weight:800; color:#34D399; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">👉 PRÓXIMO TURNO (${targetAreaDisplayName.toUpperCase()} EN ESPERA)</div>
              ${nextPet ? `
                <div style="font-size:1rem; font-weight:900; color:#FFFFFF;">${nextPet.petName || nextPet.name || 'Mascota VIP'} <span style="font-size:0.78rem; font-weight:600; color:#CBD5E1;">(${nextPet.species || 'Canino VIP'})</span></div>
                <div style="font-size:0.75rem; color:#A7F3D0; margin-top:2px;">Turno Asignado: <strong style="color:#D4AF37;">Turno ${nextPet.turnTicket || nextPet.turnNumber || 1} - ${targetAreaDisplayName}</strong> • Tutor: ${nextPet.ownerName || nextPet.owner || 'Tutor VIP'} • Estado: <strong>${steps[nextPet.stepIndex] || '1. Recibido'}</strong></div>
              ` : `
                <div style="font-size:0.88rem; color:#94A3B8; font-style:italic;">✨ No hay pacientes recibidos en espera en ${targetAreaDisplayName}. Todos los ingresados están en proceso.</div>
                <div style="margin-top:8px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                  <button type="button" class="btn btn-sm" onclick="petStatusEngine.resetToInitialDemoPets()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:800; border:none; padding:4px 12px; border-radius:8px; cursor:pointer; font-size:0.75rem; box-shadow:0 2px 8px rgba(212,175,55,0.3); display:inline-flex; align-items:center; gap:4px;" title="Restablecer pacientes demo para verlos en espera en recepción">
                    🔄 Recargar Pacientes Demo en Espera
                  </button>
                  <button type="button" class="btn btn-sm" onclick="petStatusEngine.admitNewGroomingPatient()" style="background:rgba(16,185,129,0.2); color:#10B981; border:1px solid #10B981; font-weight:800; padding:4px 12px; border-radius:8px; cursor:pointer; font-size:0.75rem; display:inline-flex; align-items:center; gap:4px;" title="Ingresar un nuevo paciente inmediatamente a la fila de espera">
                    📥 Ingresar Paciente a Espera
                  </button>
                </div>
              `}
            </div>
          </div>

          <!-- CARD 2: EN ATENCIÓN ACTUAL EN ESTACIÓN (PROCESO) -->
          <div style="background:rgba(212, 175, 55, 0.12); border:1.5px solid #D4AF37; border-radius:14px; padding:12px 16px; display:flex; align-items:center; gap:14px;">
            <div style="background:#D4AF37; color:#0F172A; padding:8px 12px; border-radius:12px; font-weight:900; font-size:1.05rem; text-align:center; min-width:80px; box-shadow:0 4px 12px rgba(212,175,55,0.3); line-height:1.2;">
              <div style="font-size:0.72rem; text-transform:uppercase;">${targetAreaDisplayName}</div>
              <div style="font-size:1.35rem;">${currentInStation ? (currentInStation.turnTicket || '#' + String(currentInStation.turnNumber || 1).padStart(2, '0')) : '--'}</div>
            </div>
            <div style="flex:1;">
              <div style="font-size:0.72rem; font-weight:800; color:#FBBF24; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">💈 EN ESTACIÓN (${targetAreaDisplayName.toUpperCase()})</div>
              ${currentInStation ? `
                <div style="font-size:1rem; font-weight:900; color:#FFFFFF;">${currentInStation.petName || currentInStation.name || 'Mascota VIP'} <span style="font-size:0.78rem; font-weight:600; color:#CBD5E1;">(${currentInStation.species || 'Canino VIP'})</span></div>
                <div style="font-size:0.75rem; color:#FDE68A; margin-top:2px;">Turno Asignado: <strong style="color:#FFFFFF;">Turno ${currentInStation.turnTicket || currentInStation.turnNumber || 1} - ${targetAreaDisplayName}</strong> • Etapa ${currentInStation.stepIndex + 1}: <strong>${steps[currentInStation.stepIndex] || ''}</strong></div>
              ` : `
                <div style="font-size:0.88rem; color:#94A3B8; font-style:italic;">Estaciones desocupadas actualmente en ${targetAreaDisplayName}.</div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  isStaffMode() {
    // 1. Explicit enterprise authenticated environment
    if (window.adminEngine && window.adminEngine.isEnterpriseAuthenticated && window.adminEngine.viewEnvironment === 'enterprise') {
      return true;
    }
    // 2. Persistent enterprise auth in sessionStorage
    try {
      if (sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true') {
        if (!window.adminEngine || window.adminEngine.viewEnvironment !== 'customer') {
          if (window.adminEngine) {
            window.adminEngine.isEnterpriseAuthenticated = true;
            window.adminEngine.viewEnvironment = 'enterprise';
          }
          return true;
        }
      }
    } catch(e) {}
    // 3. Explicit staff or admin role
    if (window.authEngine && (window.authEngine.userRole === 'staff' || window.authEngine.userRole === 'admin')) {
      return true;
    }
    return false;
  }

  getActiveCustomerInfo() {
    let activePetId = localStorage.getItem('mrs_pets_active_vip_patient_id') || (window.authEngine ? window.authEngine.currentVipPetId : null);
    let activeCustomerName = '';
    let activeCustomerPhone = (window.authEngine ? window.authEngine.currentUserPhone : '') || '';

    // 1. Nombre en authEngine si no es Staff ni Visitante genérico
    if (window.authEngine && window.authEngine.userName && !window.authEngine.userName.toLowerCase().includes('staff') && window.authEngine.userName !== 'Visitante VIP') {
      activeCustomerName = window.authEngine.userName.split('(')[0].trim();
    }

    // 2. Nombre en localStorage si existe
    if (!activeCustomerName) {
      const stored = (typeof localStorage !== 'undefined') ? localStorage.getItem('mrs_pets_active_customer_name') : null;
      if (stored && !stored.toLowerCase().includes('staff') && stored !== 'Visitante VIP') {
        activeCustomerName = stored.split('(')[0].trim();
      }
    }

    // 3. Nombre desde adminEngine.getCurrentCustomerName()
    if (!activeCustomerName && window.adminEngine && typeof window.adminEngine.getCurrentCustomerName === 'function') {
      const aName = window.adminEngine.getCurrentCustomerName();
      if (aName && !aName.toLowerCase().includes('staff') && aName !== 'Visitante VIP') {
        activeCustomerName = aName.split('(')[0].trim();
      }
    }

    // 4. Default canónico para el portal de cliente VIP: Dalybell Ramírez Montilla
    if (!activeCustomerName || activeCustomerName === 'Visitante VIP') {
      activeCustomerName = 'Dalybell Ramírez Montilla';
    }

    // 5. Garantizar teléfono de contacto para WhatsApp
    if (!activeCustomerPhone && activeCustomerName && activeCustomerName.toLowerCase().includes('dalybell')) {
      activeCustomerPhone = '+58 (414) 389-1102';
    }

    // 6. Si no hay activePetId, resolver al ID predeterminado de Dalybell (PET-101 Princesa)
    if (!activePetId && activeCustomerName.toLowerCase().includes('dalybell')) {
      activePetId = 'PET-101';
      try { localStorage.setItem('mrs_pets_active_vip_patient_id', 'PET-101'); } catch(e) {}
    }

    return { activePetId, activeCustomerName, activeCustomerPhone };
  }

  isClientMatch(pet, activeCustomerName, activeCustomerPhone, activePetId) {
    if (!pet) return false;

    const norm = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanActiveName = norm(activeCustomerName);
    const cleanOwnerName = norm(pet.ownerName || pet.owner);

    // CRITICAL SECURITY ISOLATION: Strict Cross-Tenant Block
    // Carlos Mendoza must NEVER match Dalybell Ramírez Montilla
    if ((cleanActiveName.includes('dalybell') || cleanActiveName.includes('montilla')) && 
        (cleanOwnerName.includes('carlos') || cleanOwnerName.includes('mendoza'))) {
      return false;
    }
    if ((cleanActiveName.includes('carlos') || cleanActiveName.includes('mendoza')) && 
        (cleanOwnerName.includes('dalybell') || cleanOwnerName.includes('montilla'))) {
      return false;
    }

    // Explicit active pet ID match (unless cross-tenant name conflict)
    if (activePetId && pet.id === activePetId) {
      if (cleanActiveName.includes('dalybell') && (cleanOwnerName.includes('carlos') || cleanOwnerName.includes('mendoza'))) {
        return false;
      }
      return true;
    }

    // Name matching
    if (cleanActiveName && cleanOwnerName) {
      if (cleanActiveName.includes('dalybell') && cleanOwnerName.includes('dalybell')) {
        return true;
      }
      if (cleanActiveName === cleanOwnerName || cleanOwnerName.includes(cleanActiveName) || cleanActiveName.includes(cleanOwnerName)) {
        return true;
      }
    }

    // Phone matching (with first-name safety check to avoid false collisions)
    const cleanPPhone = (pet.ownerPhone || '').replace(/\D/g, '');
    const cleanCPhone = (activeCustomerPhone || '').replace(/\D/g, '');
    if (cleanPPhone && cleanCPhone && cleanPPhone.length >= 7 && cleanCPhone.length >= 7) {
      if (cleanPPhone === cleanCPhone || cleanPPhone.endsWith(cleanCPhone) || cleanCPhone.endsWith(cleanPPhone)) {
        if (cleanOwnerName && cleanActiveName) {
          const ownerFirst = cleanOwnerName.split(' ')[0];
          const activeFirst = cleanActiveName.split(' ')[0];
          if (ownerFirst && activeFirst && ownerFirst !== activeFirst) {
            return false;
          }
        }
        return true;
      }
    }

    return false;
  }

  filterByPetId(petId) {
    if (!petId) return;
    localStorage.setItem('mrs_pets_active_vip_patient_id', petId);
    this.render();
  }

  render() {
    const containers = [
      document.getElementById('pets-grid-container'),
      document.getElementById('homepage-pets-grid')
    ].filter(Boolean);

    if (containers.length === 0) return;

    const isStaff = this.isStaffMode();
    const { activePetId, activeCustomerName, activeCustomerPhone } = this.getActiveCustomerInfo();

    document.querySelectorAll('.staff-only-resequence-control, .staff-only-control').forEach(el => {
      el.style.display = isStaff ? '' : 'none';
    });

    // ISOLATION: In Client view (!isStaff), base list contains ONLY the active client's pets!
    const basePets = isStaff ? this.pets : this.pets.filter(p => this.isClientMatch(p, activeCustomerName, activeCustomerPhone, activePetId));

    // Calculate process status counts for badge counters in control bar
    const filteredByAreaAndDate = basePets.filter(p => {
      const matchArea = this.matchAreaFilter(p.area, this.currentFilter);
      const matchDate = this.isWithinDateRange(p, this.currentDateFilter);
      return matchArea && matchDate;
    });

    const inProgressCount = filteredByAreaAndDate.filter(p => {
      const areaKey = this.normalizeService(p.area);
      const s = this.workflows[areaKey] || this.workflows[p.area] || [];
      return p.stepIndex < s.length - 1;
    }).length;

    const processedCount = filteredByAreaAndDate.filter(p => {
      const areaKey = this.normalizeService(p.area);
      const s = this.workflows[areaKey] || this.workflows[p.area] || [];
      return p.stepIndex >= s.length - 1;
    }).length;

    const totalCount = filteredByAreaAndDate.length;

    const elInProgress = document.getElementById('count-in-progress');
    const elProcessed = document.getElementById('count-processed');
    const elAll = document.getElementById('count-all');

    // Conteo dinámico de ventas de tienda desde storeSalesEngine
    const tiendaSalesList = window.storeSalesEngine ? window.storeSalesEngine.filterSales({
      dateFilter: this.currentDateFilter,
      statusFilter: 'all',
      isStaff: isStaff,
      customerName: activeCustomerName,
      customerPhone: activeCustomerPhone,
      customFrom: this.customFrom,
      customTo: this.customTo
    }) : [];

    // Si el filtro de área activo es Tienda, los contadores de proceso reflejan las ventas de tienda
    if (this.normalizeService(this.currentFilter) === 'tienda') {
      const inProgSalesCount = tiendaSalesList.filter(s => s.stepIndex < 3 || s.status === 'pending').length;
      const procSalesCount = tiendaSalesList.filter(s => s.stepIndex >= 3 || s.status === 'completed').length;
      if (elInProgress) elInProgress.innerText = inProgSalesCount;
      if (elProcessed) elProcessed.innerText = procSalesCount;
      if (elAll) elAll.innerText = tiendaSalesList.length;
    } else {
      if (elInProgress) elInProgress.innerText = inProgressCount;
      if (elProcessed) elProcessed.innerText = processedCount;
      if (elAll) elAll.innerText = totalCount;
    }

    // Dynamic Area Filter Count Badges (sincronizados rigurosamente con el filtro de fecha activo)
    const basePetsForCurrentDate = basePets.filter(p => this.isWithinDateRange(p, this.currentDateFilter));
    const allAreaCount = basePetsForCurrentDate.length + tiendaSalesList.length;
    const groomingAreaCount = basePetsForCurrentDate.filter(p => this.normalizeService(p.area) === 'grooming').length;
    const clinicaAreaCount = basePetsForCurrentDate.filter(p => this.normalizeService(p.area) === 'clinica').length;
    const hotelAreaCount = basePetsForCurrentDate.filter(p => this.normalizeService(p.area) === 'hotel').length;
    const tiendaAreaCount = tiendaSalesList.length;

    const elAreaAll = document.getElementById('area-count-all');
    if (elAreaAll) elAreaAll.innerText = allAreaCount;
    const elAreaGrooming = document.getElementById('area-count-grooming');
    if (elAreaGrooming) elAreaGrooming.innerText = groomingAreaCount;
    const elAreaClinica = document.getElementById('area-count-clinica');
    if (elAreaClinica) elAreaClinica.innerText = clinicaAreaCount;
    const elAreaHotel = document.getElementById('area-count-hotel');
    if (elAreaHotel) elAreaHotel.innerText = hotelAreaCount;
    const elAreaTienda = document.getElementById('area-count-tienda');
    if (elAreaTienda) elAreaTienda.innerText = tiendaAreaCount;

    // View Mode Toggle Button in Control de Estatus
    const elModeToggle = document.getElementById('btn-toggle-pet-status-mode');
    if (elModeToggle) {
      if (isStaff) {
        elModeToggle.style.background = '#4A6B5D';
        elModeToggle.style.color = '#FFFFFF';
        elModeToggle.innerHTML = `🏢 Vista Staff Operativo (Mostrando Todos) ▾`;
        elModeToggle.title = 'Estás en Vista Staff Operativo. Haz clic para cambiar a Vista Tutor VIP';
      } else {
        elModeToggle.style.background = '#fbbf24';
        elModeToggle.style.color = '#0f172a';
        elModeToggle.innerHTML = `🐾 Vista Tutor VIP: ${activeCustomerName || 'Cliente'} ▾`;
        elModeToggle.title = 'Estás en Vista Tutor VIP. Haz clic para cambiar a Vista Staff Operativo y ver todas las mascotas';
      }
    }

    const clinicaActive = basePets.filter(p => {
      const isClinica = this.normalizeService(p.area) === 'clinica';
      const s = this.workflows['clinica'] || [];
      const isPending = p.stepIndex < s.length - 1;
      const matchDate = this.isWithinDateRange(p, this.currentDateFilter);
      return isClinica && isPending && matchDate;
    });

    const badgeClinica = document.getElementById('badge-pets-count');
    if (badgeClinica) {
      badgeClinica.innerText = `${clinicaActive.length} ${clinicaActive.length === 1 ? 'Activo' : 'Activos'}`;
    }

    this.renderGroomingQueueWidget();

    const filtered = basePets.filter(p => {
      const cleanArea = this.normalizeService(p.area);
      const currentF = this.normalizeService(this.currentFilter);
      
      // 2. Evaluación de Área
      const matchArea = !currentF || currentF === 'all' || currentF === 'todas' || cleanArea === currentF || this.matchAreaFilter(p.area, this.currentFilter);
      
      // 3. Evaluación de Fecha
      const matchDate = this.isWithinDateRange ? this.isWithinDateRange(p, this.currentDateFilter) : true;
      
      // 4. Evaluación de Búsqueda
      const q = (this.searchQuery || '').toLowerCase().trim();
      const matchSearch = !q || 
                          (p.petName && p.petName.toLowerCase().includes(q)) ||
                          (p.ownerName && p.ownerName.toLowerCase().includes(q)) ||
                          (p.id && p.id.toString().toLowerCase().includes(q));
      
      // 5. Evaluación de Estado
      const steps = (this.workflows && (this.workflows[cleanArea] || this.workflows[p.area])) || [];
      const totalSteps = steps.length > 0 ? steps.length : 7;
      let matchStatus = true;
      if (this.currentStatusFilter === 'in_progress') {
        matchStatus = (p.stepIndex || 0) < totalSteps - 1;
      } else if (this.currentStatusFilter === 'processed') {
        matchStatus = (p.stepIndex || 0) >= totalSteps - 1;
      }

      return matchArea && matchDate && matchSearch && matchStatus;
    });

    containers.forEach(grid => {
      grid.innerHTML = '';
      
      // Si el filtro de área es Tienda, renderizar las tarjetas de ventas y operaciones de tienda
      if (this.normalizeService(this.currentFilter) === 'tienda') {
        this.renderStoreSalesCards(grid, isStaff, activeCustomerName, activeCustomerPhone);
        return;
      }

      const sortedFiltered = this.sortPetsChronologically(filtered);

      // Deduplicación garantizada: En la vista de área, cada mascota tiene una única ficha activa
      const uniquePetsMap = new Map();
      sortedFiltered.forEach(pet => {
        const petBase = this.normalizePetBaseName(pet.petName || pet.name);
        const petDateKey = pet.reservationDate || pet.date || (pet.createdAt ? pet.createdAt.split('T')[0] : 'today');
        const key = `${petDateKey}_${petBase || pet.id}`;
        if (!uniquePetsMap.has(key)) {
          uniquePetsMap.set(key, pet);
        } else {
          const current = uniquePetsMap.get(key);
          const currentScore = (current.approved ? 50 : 0) + (current.turnNumber ? 20 : 0) + (current.stepIndex >= 0 ? current.stepIndex + 1 : 0);
          const petScore = (pet.approved ? 50 : 0) + (pet.turnNumber ? 20 : 0) + (pet.stepIndex >= 0 ? pet.stepIndex + 1 : 0);
          if (petScore > currentScore) {
            uniquePetsMap.set(key, pet);
          }
        }
      });
      const uniquePetsList = Array.from(uniquePetsMap.values());

      if (uniquePetsList.length === 0) {
        let emptyMsg = "No hay mascotas registradas en esta área actualmente.";
        if (this.currentStatusFilter === 'in_progress') {
          emptyMsg = "✨ ¡Excelente! No hay pacientes pendientes en proceso en esta área en este momento.";
        } else if (this.currentStatusFilter === 'processed') {
          emptyMsg = "📋 No hay mascotas procesadas o entregadas aún el día de hoy en esta área.";
        }

        let emptyCardHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted); font-weight:700;">${emptyMsg}</div>`;
        if (!isStaff) {
          const isVisitor = Boolean(window.authEngine && (window.authEngine.userRole === 'visitor' || window.authEngine.userRole === 'guest'));
          if (isVisitor) {
            emptyCardHTML = `
              <div style="grid-column: 1/-1; text-align:center; padding:36px 20px; background:#f8fafc; border:2px dashed #D4AF37; border-radius:18px; margin:16px 0;">
                <div style="font-size:2.4rem; margin-bottom:8px;">🐾</div>
                <div style="font-size:1.15rem; font-weight:900; color:#1e293b; margin-bottom:6px;">¡Bienvenido a Mrs. Pets (Modo Visitante VIP)!</div>
                <div style="font-size:0.84rem; color:#64748b; max-width:560px; margin:0 auto 18px auto; line-height:1.4;">
                  Como visitante, aún no posee mascotas en atención en esta área. Puede explorar las áreas disponibles o agendar su primera reservación en Grooming Spa, Consulta Veterinaria u Hotel 5★:
                </div>
                <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                  <button type="button" class="btn btn-sm btn-primary" onclick="if(window.clinicaEngine) clinicaEngine.openGroomingBookingModal('Circuito Grooming Spa 7 Estaciones')" style="background:linear-gradient(135deg, #4A6B5D, #2C4A3E); color:white; font-weight:900; border:1px solid #D4AF37; padding:10px 20px; border-radius:10px; cursor:pointer; box-shadow:0 4px 12px rgba(74,107,93,0.3); font-size:0.85rem;">
                    📅 Agendar Reservación / Cita ➔
                  </button>
                  <button type="button" class="btn btn-sm btn-secondary" onclick="if(window.registrationEngine) registrationEngine.openRegistrationModal()" style="background:#FFFFFF; color:#2C2C2E; font-weight:800; border:1.5px solid #D4AF37; padding:10px 18px; border-radius:10px; cursor:pointer; font-size:0.85rem;">
                    👑 Registrar Paciente (Ficha VIP) ➔
                  </button>
                </div>
              </div>
            `;
          } else {
            emptyCardHTML = `
              <div style="grid-column: 1/-1; text-align:center; padding:32px 20px; background:#f8fafc; border:2px dashed #cbd5e1; border-radius:18px; margin:16px 0;">
                <div style="font-size:2rem; margin-bottom:8px;">🐾</div>
                <div style="font-size:1.05rem; font-weight:900; color:#1e293b; margin-bottom:6px;">${emptyMsg}</div>
                <div style="font-size:0.82rem; color:#64748b; max-width:520px; margin:0 auto 16px auto; line-height:1.4;">
                  Estás visualizando el portal en <strong>Modo Vista Tutor VIP</strong> para <em>${activeCustomerName || 'el cliente activo'}</em>. Si eres parte del personal operativo o deseas ver a todas las mascotas en cola de Grooming, Clínica y Hotel, haz clic aquí:
                </div>
                <button type="button" class="btn btn-sm btn-primary" onclick="if(window.adminEngine) { adminEngine.setEnvironment('enterprise'); } else { petStatusEngine.render(); }" style="background:linear-gradient(135deg, #d97706, #b45309); color:white; font-weight:900; border:none; padding:10px 22px; border-radius:10px; cursor:pointer; box-shadow:0 4px 12px rgba(217,119,6,0.3); font-size:0.85rem;">
                  🏢 Cambiar a Vista Operativa Staff (Ver Todos los Pacientes) ➔
                </button>
              </div>
            `;
          }
        }
        grid.innerHTML += emptyCardHTML;
        return;
      }

      uniquePetsList.forEach(pet => {
        try {
          const cleanPetArea = this.normalizeService(pet.area);
          const steps = (this.workflows && (this.workflows[cleanPetArea] || this.workflows[pet.area])) || [];
        const hasReservation = pet.hasReservation !== false && pet.stepIndex >= 0;
        const isCompleted = pet.stepIndex >= steps.length - 1;
        const isPendingApproval = !pet.approved && (pet.reservationStatus === 'pending_approval' || (hasReservation && pet.stepIndex === 0 && (!pet.turnNumber || pet.turnNumber === 999)));
        const currentStepName = isPendingApproval
          ? 'Cita Solicitada (En Espera de Staff)'
          : (hasReservation ? ((pet.stepIndex === 0 && pet.approved) ? 'Reserva Confirmada por Staff' : (steps[pet.stepIndex] || 'En Proceso')) : 'Perfil Creado (Sin Cita)');
        const progressPercent = hasReservation ? Math.round(((pet.stepIndex + 1) / steps.length) * 100) : 0;

        const currentStationKey = this.getStationKeyForStep(pet.area, pet.stepIndex);
        const authorizedStaff = this.getAuthorizedStaffForStation(currentStationKey, pet.area);
        const activeStaffId = pet.assignedStaffId || (authorizedStaff[0] ? authorizedStaff[0].id : '');

        const avatarHTML = pet.image 
          ? `<img src="${pet.image}" style="width:52px; height:52px; border-radius:50%; object-fit:cover; border:2px solid ${isCompleted ? '#10b981' : (isPendingApproval ? '#3b82f6' : '#fbbf24')}; box-shadow:0 0 10px ${isCompleted ? 'rgba(16, 185, 129, 0.4)' : (isPendingApproval ? 'rgba(59,130,246,0.4)' : 'rgba(251, 191, 36, 0.4)')};">`
          : `<div style="width:52px; height:52px; border-radius:50%; background:#fef3c7; display:flex; align-items:center; justify-content:center; font-size:1.6rem; border:2px solid ${isCompleted ? '#10b981' : (isPendingApproval ? '#3b82f6' : '#fbbf24')};">🐾</div>`;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '14px';
        card.style.border = isCompleted ? '1.5px solid #10b981' : (isPendingApproval ? '1.5px solid #3b82f6' : '1.5px solid rgba(212,175,55,0.4)');
        card.style.borderRadius = '20px';
        card.style.background = isCompleted ? '#fafdfb' : (isPendingApproval ? '#f8faff' : '#ffffff');
        card.style.cursor = 'pointer';
        card.title = `💡 Haz doble clic para ver el historial de staff y trazabilidad de ${pet.petName || pet.name || 'la mascota'}`;
        card.ondblclick = () => {
          if (window.analytics && typeof window.analytics.openTraceabilityModal === 'function') {
            window.analytics.openTraceabilityModal(pet.id);
          }
        };

        let actionControlsHTML = '';
        if (isCompleted) {
          actionControlsHTML = `
            <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:12px; font-size:0.78rem;">
              <div style="font-weight:800; color:#065f46; font-size:0.85rem; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                <span>🎉 PROCESADO Y ENTREGADO EXITOSAMENTE</span>
              </div>
              <div style="color:#047857; margin-bottom:4px;">
                🕒 <strong>Hora de Entrega:</strong> ${pet.deliveredAt || pet.updatedAt || 'Hoy'}
              </div>
              <div style="color:#047857; margin-bottom:6px;">
                👤 <strong>Entregado a:</strong> ${pet.ownerName || pet.owner || 'Tutor VIP'} ${pet.deliveredBy ? `(Por ${pet.deliveredBy})` : ''}
              </div>
              <div style="color:var(--text-muted); font-style:italic;">
                📝 ${pet.notes}
              </div>
            </div>
            ${isStaff ? `
              <div style="display:flex; gap:6px; margin-top:auto;">
                <button class="btn btn-sm" onclick="petStatusEngine.prevStep('${pet.id}')" style="background:#f59e0b; color:white; border:none; font-weight:800; padding:6px 10px; border-radius:8px; font-size:0.75rem;">
                  ◀️ Reabrir / Retroceder
                </button>
                <button class="btn btn-whatsapp btn-sm" onclick="petStatusEngine.notifyOwner('${pet.id}')" style="padding:6px 10px; border-radius:8px; margin-left:auto; font-size:0.75rem;">
                  📱 WA
                </button>
              </div>
            ` : ''}
          `;
        } else if (isPendingApproval) {
          actionControlsHTML = `
            <div style="background:#EFF6FF; border:1.5px solid #3B82F6; border-radius:12px; padding:12px;">
              <div style="font-weight:800; color:#1E40AF; font-size:0.85rem; margin-bottom:3px; display:flex; align-items:center; gap:6px;">
                <span>⏳</span> Solicitud de Cita Registrada (${pet.reservationDate || 'Hoy'} ${pet.reservationTime || ''})
              </div>
              <div style="font-size:0.75rem; color:#1E3A8A; margin-bottom:10px; line-height:1.4;">
                Su expediente VIP está registrado. La cita está en espera de validación y asignación de turno por el equipo staff de Mrs. Pets.
              </div>
              ${isStaff ? `
                <div style="display:flex; gap:8px; margin-top:6px;">
                  <button class="btn btn-whatsapp btn-sm" onclick="event.stopPropagation(); adminEngine.approvePendingAppointmentForPet('${pet.id}', false)" style="flex:1; padding:8px; font-weight:800; background:#10B981; border:none; border-radius:8px; color:white; cursor:pointer;" title="Aprobar en Paso 0 (Reserva previa sin cobro a la cesta aún)">
                    ✅ Aprobar Reserva
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); adminEngine.approvePendingAppointmentForPet('${pet.id}', true)" style="flex:1; padding:8px; font-weight:800; background:linear-gradient(135deg, #0284c7, #0369a1); border:none; border-radius:8px; color:white; cursor:pointer; box-shadow:0 3px 10px rgba(2,132,199,0.3);" title="Aprobar y recibir presencialmente en recepción (Paso 1: Check-in / Cargar servicio a la cesta)">
                    📥 Aprobar & Recibir
                  </button>
                </div>
              ` : `
                <div style="font-size:0.74rem; color:#2563EB; font-weight:800; background:#DBEAFE; padding:6px 10px; border-radius:6px; display:inline-block;">
                  📌 En revisión por el equipo staff. En cuanto sea aprobada, verá su turno activo aquí.
                </div>
              `}
            </div>
          `;
        } else if (!hasReservation) {
          const safePet = (pet.petName || pet.name || '').replace(/'/g, "\\'");
          const safeOwner = (pet.ownerName || pet.owner || '').replace(/'/g, "\\'");
          let openBookingCode = `clinicaEngine.openGroomingBookingModal('Circuito Grooming Spa', '${safePet}', '${safeOwner}')`;
          let areaLabel = `el Grooming de ${pet.petName || pet.name || 'la mascota'}`;
          let btnLabel = `📅 Agendar Cita de Grooming & Spa Ahora ➔`;

          if (pet.area === 'clinica') {
            openBookingCode = `clinicaEngine.openClinicaBookingModal('Consulta Médica Veterinaria', '${safePet}', '${safeOwner}')`;
            areaLabel = `la Atención Médica Veterinaria de ${pet.petName || pet.name || 'la mascota'}`;
            btnLabel = `🩺 Agendar Cita Clínica Veterinaria Ahora ➔`;
          } else if (pet.area === 'hotel') {
            openBookingCode = `clinicaEngine.openHotelBookingModal('Suite Bioclimática Hotel 5★', '${safePet}', '${safeOwner}')`;
            areaLabel = `la estadía en Hotel 5★ de ${pet.petName || pet.name || 'la mascota'}`;
            btnLabel = `🏨 Agendar Reserva Hotel 5★ Ahora ➔`;
          } else if (pet.area === 'tienda') {
            openBookingCode = `clinicaEngine.openTiendaBookingModal('Tienda & Boutique VIP', '${safePet}', '${safeOwner}')`;
            areaLabel = `el servicio de Tienda & Boutique VIP para ${pet.petName || pet.name || 'la mascota'}`;
            btnLabel = `🛍️ Ver Asesoramiento Tienda & Boutique ➔`;
          }

          actionControlsHTML = `
            <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:12px;">
              <div style="font-weight:800; color:#b45309; font-size:0.85rem; margin-bottom:2px;">⚠️ Perfil Registrado - Cita Pendiente por Agendar</div>
              <div style="font-size:0.75rem; color:#92400e; margin-bottom:10px;">Aún no se ha definido fecha y hora para ${areaLabel}.</div>
              <button class="btn btn-primary btn-sm" onclick="${openBookingCode}" style="width:100%; padding:10px; font-weight:800; background:linear-gradient(135deg, #d97706, #b45309); border:none; border-radius:10px; cursor:pointer; color:white; box-shadow:0 4px 12px rgba(217,119,6,0.3);">
                ${btnLabel}
              </button>
            </div>
          `;
        } else if (isStaff) {
          actionControlsHTML = `
            <div style="display:flex; flex-direction:column; gap:8px; background:#f8fafc; padding:10px 12px; border-radius:12px; border:1px solid rgba(212,175,55,0.25);">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <span style="font-size:0.75rem; font-weight:800; color:#2C2C2E;">Etapa del Circuito:</span>
                <select id="card-step-select-${pet.id}" class="form-select" style="font-size:0.78rem; padding:4px 8px; border-radius:8px; flex:1; border:1.5px solid #d97706; font-weight:700; background:#ffffff;" onchange="petStatusEngine.changeStepDirectly('${pet.id}', this.value)">
                  ${steps.map((st, idx) => `
                    <option value="${idx}" ${idx === pet.stepIndex ? 'selected' : ''}>${idx + 1}. ${st}</option>
                  `).join('')}
                </select>
              </div>

              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <span style="font-size:0.75rem; font-weight:800; color:#4A6B5D; white-space:nowrap;">👤 Responsable:</span>
                <select id="staff-select-${pet.id}" class="form-select" style="font-size:0.78rem; padding:4px 8px; border-radius:8px; flex:1; background:#ffffff; border:1px solid #10b981; font-weight:700;" onchange="petStatusEngine.assignStaffToPet('${pet.id}', this.value)">
                  ${authorizedStaff.length > 0 ? authorizedStaff.map(s => `
                    <option value="${s.id}" ${s.id === activeStaffId ? 'selected' : ''}>${s.name} (${(s.rol_principal || s.role || 'Staff').toUpperCase()})</option>
                  `).join('') : `<option value="">⚠️ Sin personal autorizado en esta estación</option>`}
                </select>
              </div>

              <div style="font-size:0.72rem; color:#047857; font-weight:700; display:flex; align-items:center; gap:4px;">
                <span>🛡️ Estación [${currentStationKey}]: ${authorizedStaff.length} especialista(s) autorizados</span>
              </div>
            </div>

            <div style="font-size:0.78rem; color:var(--text-muted); background:#f8fafc; padding:8px 12px; border-radius:10px; border:1px solid rgba(217, 119, 6, 0.15);">
              📝 <em>${pet.notes}</em>
            </div>

            ${pet.isContagious && pet.sanitaryAlert ? `
              <div style="background:linear-gradient(135deg, rgba(254,242,242,0.95), rgba(254,226,226,0.9)); border:1.5px solid #ef4444; border-radius:10px; padding:8px 12px; color:#991b1b; font-size:0.78rem; display:flex; justify-content:space-between; align-items:center; gap:8px; box-shadow:0 2px 8px rgba(239,68,68,0.15);">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-size:1.1rem;">🔴</span>
                  <div>
                    <strong style="color:#b91c1c; font-weight:800;">ALERTA SANITARIA: ${pet.sanitaryAlert}</strong>
                    <div style="font-size:0.7rem; color:#7f1d1d;">📍 Sector Maracaibo: <strong>${pet.sector || 'El Milagro'}</strong> • Aislamiento preventivo</div>
                  </div>
                </div>
                <button type="button" class="btn btn-sm" onclick="event.stopPropagation(); if(window.app){ app.switchTab('welcome'); } if(typeof showBioTrackerMap==='function'){ showBioTrackerMap(); } setTimeout(()=>{ if(typeof centrarSectorGeoGuard==='function') centrarSectorGeoGuard('${this.getSectorKeyFromName(pet.sector)}'); }, 300);" style="background:#dc2626; color:#ffffff; font-weight:800; border:none; padding:4px 9px; border-radius:6px; font-size:0.72rem; cursor:pointer; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(220,38,38,0.3);" title="Ubicar este caso en el mapa de BioTracker GeoGuard">
                  🗺️ Ver en Radar
                </button>
              </div>
            ` : (pet.stepIndex >= 2 && pet.dermalCondition === 'sin_novedad' ? `
              <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:5px 10px; font-size:0.73rem; color:#065f46; font-weight:700; display:flex; align-items:center; gap:6px;">
                <span>🟢</span> <span>Revisión Dérmica: Sin novedad (Piel sana y sin ectoparásitos)</span>
              </div>
            ` : '')}

            ${pet.traceLogs && pet.traceLogs.length > 0 ? `
              <div style="background:#fffbe6; border:1px solid #fde68a; border-radius:10px; padding:8px 10px; font-size:0.72rem;">
                <div style="font-weight:800; color:#b45309; margin-bottom:4px;">📋 Trazabilidad por Estaciones FIRMADA:</div>
                ${pet.traceLogs.slice(-3).map(t => `
                  <div style="color:#92400e; margin-bottom:2px;">
                    📌 <strong>${t.stepName}</strong> (${t.stationKey}) • por <em>${t.staffName}</em> @ ${t.completedAt || t.timestamp}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${pet.lastQcSession ? `
              <div style="background:rgba(16,185,129,0.1); border:1px solid #10b981; border-radius:8px; padding:6px 10px; font-size:0.72rem; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#065f46; font-weight:800;">📸 Sesión 4 Fotos QC Enviada (${pet.lastQcSession.time || 'Hoy'}) • Telegram @mrspets_vip</span>
                <span style="color:#2563eb; font-weight:800; cursor:pointer;" onclick="event.stopPropagation(); window.open('${pet.lastQcSession.driveFolderUrl || 'https://drive.google.com/drive/folders/1MrsPets_Grooming_QC_SocialMedia_2026'}', '_blank')" title="Abrir carpeta Google Drive">📁 Drive</span>
              </div>
            ` : ''}

            <div style="display:flex; gap:6px; margin-top:auto; flex-wrap:wrap;">
              ${pet.stepIndex === 0 ? `
                <button class="btn btn-sm btn-primary" onclick="petStatusEngine.changeStepDirectly('${pet.id}', 1)" style="background:linear-gradient(135deg, #10B981, #059669); color:white; border:none; font-weight:900; padding:7px 12px; border-radius:8px; box-shadow:0 3px 10px rgba(16,185,129,0.35); flex:1;" title="Recibir mascota en recepción (Paso 1: Check-in) y sumar servicio al carrito">
                  📥 Recibir Mascota (Check-in & Cobro)
                </button>
                <button class="btn btn-sm btn-secondary" onclick="if(window.adminEngine) adminEngine.approvePendingAppointmentForPet('${pet.id}', false)" style="background:#3b82f6; color:white; border:none; font-weight:800; padding:7px 12px; border-radius:8px; font-size:0.75rem; cursor:pointer;" title="Confirmar cita en agenda sin cobro aún (Paso 0: Reserva confirmada)">
                  ✅ Confirmar Reserva
                </button>
              ` : `
                <button class="btn btn-sm" ${pet.stepIndex <= 0 ? 'disabled' : ''} onclick="petStatusEngine.prevStep('${pet.id}')" style="background:#f59e0b; color:white; border:none; font-weight:800; padding:6px 10px; border-radius:8px;">
                  ◀️ Retroceder
                </button>
                <button class="btn btn-sm btn-primary" ${pet.stepIndex >= steps.length - 1 ? 'disabled' : ''} onclick="petStatusEngine.openAdvanceStepModal('${pet.id}')" style="background:${pet.area === 'grooming' && pet.stepIndex === 1 ? 'linear-gradient(135deg, #059669, #047857)' : (pet.area === 'grooming' && pet.stepIndex === 2 ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#10b981')}; border:none; font-weight:800; padding:6px 12px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                  ${pet.area === 'grooming' && pet.stepIndex === 1 ? '🔬 Pasar a Revisión Dérmica ➔' : (pet.area === 'grooming' && pet.stepIndex === 2 ? '🛁 Pasar a Baño & Secado ➔' : '✍️ Avanzar & Firmar')}
                </button>
              `}
              ${(isStaff && (pet.area === 'grooming' || pet.area === 'spa' || !pet.area)) ? `
                <button class="btn btn-sm" onclick="event.stopPropagation(); if(window.mrsPetsArch) mrsPetsArch.openEmployeeCamera('${pet.id}');" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:800; border:none; padding:6px 10px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; box-shadow:0 2px 6px rgba(212,175,55,0.3); cursor:pointer;" title="Sesión de Fotos Grooming QC (4 Fotos) para Supervisora, Telegram (@mrspets_vip), Drive y Redes Sociales">
                  📸 Fotos QC (4 Fotos)
                  ${(pet.groomingSessions && pet.groomingSessions.length > 0) ? `<span style="background:#10B981; color:white; font-size:0.65rem; padding:1px 5px; border-radius:10px; margin-left:2px;">${pet.groomingSessions.length}</span>` : ''}
                </button>
              ` : ''}
              ${(isStaff && pet.area === 'hotel') ? `
                <button class="btn btn-sm" onclick="event.stopPropagation(); if(window.liveNotificationEngine) window.liveNotificationEngine.notifyHotelPetReadyHome(petStatusEngine.pets.find(p=>p.id==='${pet.id}'));" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:white; font-weight:800; border:none; padding:6px 10px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; box-shadow:0 2px 6px rgba(2,132,199,0.3); cursor:pointer;" title="Notificar al Tutor por WhatsApp y Pantalla: Perrito listo para regresar a casa (Check-out Hotel)">
                  🏡 Listo para Casa
                </button>
              ` : ''}
              <button class="btn btn-whatsapp btn-sm" onclick="petStatusEngine.notifyOwner('${pet.id}')" style="padding:6px 10px; border-radius:8px; margin-left:auto;">
                📱 WA
              </button>
              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); petStatusEngine.deletePet('${pet.id}')" title="Eliminar de Control de Estatus" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:8px; font-weight:800; cursor:pointer;">
                🗑️
              </button>
            </div>
          `;
        } else {
          actionControlsHTML = `
            <div style="font-size:0.78rem; color:var(--text-muted); background:#f8fafc; padding:10px 14px; border-radius:12px; border:1px solid rgba(212, 175, 55, 0.25);">
              <div style="font-weight:700; color:#2C2C2E; margin-bottom:2px;">📝 Indicaciones del Especialista:</div>
              <em>${pet.notes}</em>
            </div>

            ${pet.isContagious && pet.sanitaryAlert ? `
              <div style="background:rgba(254,242,242,0.95); border:1.5px solid #ef4444; border-radius:10px; padding:8px 12px; color:#991b1b; font-size:0.75rem; margin-top:4px;">
                🔴 <strong>Alerta Sanitaria:</strong> ${pet.sanitaryAlert} (Sector: ${pet.sector || 'Maracaibo'}). Tratamiento preventivo en curso en Spa.
              </div>
            ` : ''}

            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-top:4px;">
              <div style="font-size:0.72rem; color:#4A6B5D; font-weight:800; display:flex; align-items:center; gap:4px;">
                <span>🔒 Tiempo en vivo (Solo Lectura)</span>
              </div>
              <button class="btn btn-whatsapp btn-sm" onclick="petStatusEngine.notifyOwner('${pet.id}')" style="padding:6px 12px; border-radius:8px; font-size:0.75rem;">
                💬 Consultar por WA
              </button>
            </div>
          `;
        }

        const turnLabel = this.getTurnLabel(pet);
        const isNextInQueue = this.checkIsNextInQueue(pet);

        const nowTodayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        const isFutureRes = pet.reservationDate && pet.reservationDate > nowTodayStr;
        const futureBadgeHTML = isFutureRes
          ? `<span class="badge" style="background:#4F46E5; color:white; font-weight:800; font-size:0.72rem; padding:2px 8px; border-radius:8px; display:inline-block; margin-left:4px;">📅 Cita Futura: ${pet.reservationDate} ${pet.reservationTime || ''}</span>`
          : '';

        const turnClickAttr = isStaff
          ? `onclick="event.stopPropagation(); petStatusEngine.openChangeTurnModal('${pet.id}')" style="background:#0F172A; color:#D4AF37; border:1.5px solid #D4AF37; font-weight:900; font-size:0.75rem; padding:3px 10px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.3); transition:all 0.2s ease;" title="✏️ Haz clic para reordenar o cambiar manualmente el turno de ${pet.petName || pet.name || 'la mascota'}"`
          : `style="background:#0F172A; color:#D4AF37; border:1px solid #D4AF37; font-weight:900; font-size:0.75rem; padding:3px 10px; border-radius:8px; display:inline-block;"`;

        const turnBadgeHTML = `<span class="badge" ${turnClickAttr}>🏷️ ${turnLabel} ${isStaff ? '✏️' : ''}</span>`;
        const nextBadgeHTML = isNextInQueue 
          ? `<span class="badge" style="background:linear-gradient(135deg, #10b981, #059669); color:white; font-weight:900; font-size:0.72rem; padding:2px 8px; border-radius:8px; box-shadow:0 2px 8px rgba(16,185,129,0.4); display:inline-block; margin-left:4px;">👉 ¡SIGUIENTE EN ATENCIÓN!</span>` 
          : '';

        const statusBadgeHTML = isPendingApproval
          ? `<span class="badge" style="background:#3B82F6; color:white; font-weight:800; padding:6px 12px; box-shadow:0 2px 8px rgba(59,130,246,0.35);">⏳ Cita Solicitada • En Espera de Staff</span>`
          : (isCompleted
              ? `<span class="badge badge-success" style="font-weight:800; padding:6px 12px; background:#10b981; color:white;">✅ Entregado</span>`
              : (hasReservation
                  ? `<span class="badge badge-success" style="font-weight:800; padding:6px 12px;">${currentStepName}</span>`
                  : `<span class="badge" style="background:#f59e0b; color:white; font-weight:800; padding:6px 12px;">⚠️ Cita Pendiente</span>`
                )
            );

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:12px;">
              ${avatarHTML}
              <div>
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:2px;">
                  <h3 style="font-size:1.1rem; font-weight:900; color:#2C2C2E; margin:0;">${pet.petName || pet.name || 'Mascota VIP'} 🐾</h3>
                  ${turnBadgeHTML}
                  ${nextBadgeHTML}
                  ${futureBadgeHTML}
                </div>
                <div style="font-size:0.78rem; color:var(--text-muted);">${pet.species || 'Canino VIP'} • Tutor: ${pet.ownerName || pet.owner || 'Tutor VIP'}</div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
              ${statusBadgeHTML}
              <button class="btn btn-sm" onclick="event.stopPropagation(); analytics.openTraceabilityModal('${pet.id}')" style="background:#4A6B5D; color:white; font-weight:800; border:none; border-radius:8px; padding:4px 10px; font-size:0.72rem; cursor:pointer;" title="${isStaff ? 'Ver quién lo recibió, atendió, bañó y secó' : 'Ver las etapas y estado de atención'}">
                ${isStaff ? '🔎 Histórico Staff' : '📋 Etapas del Servicio'}
              </button>
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;">
              <span>Etapa Actual: <strong style="color:var(--obsidian-black);">${currentStepName}</strong></span>
              <span style="font-weight:800; color:${isCompleted ? '#10b981' : 'var(--gold-primary)'};">${hasReservation ? `${pet.stepIndex + 1} de ${steps.length} (${progressPercent}%)` : 'Pendiente'}</span>
            </div>
            <div style="height:8px; background:#fef3c7; border-radius:4px; overflow:hidden;">
              <div style="width:${progressPercent}%; height:100%; background:${isCompleted ? '#10b981' : 'linear-gradient(90deg, #fbbf24, #d97706)'}; border-radius:4px; transition:width 0.4s ease;"></div>
            </div>
          </div>

          ${actionControlsHTML}
        `;

        grid.appendChild(card);
        } catch (err) {
          console.error(`ERROR AL RENDERIZAR FICHA DE ${pet ? pet.petName : 'desconocido'}:`, err);
          grid.innerHTML += `
            <div style="background: #fee; border: 1px solid red; padding: 12px; margin: 8px; border-radius: 10px; color: #7f1d1d; font-family: monospace; font-size: 0.82rem;">
              <strong>⚠️ ERROR AL RENDERIZAR FICHA DE ${pet ? (pet.petName || 'Sin Nombre') : 'Mascota'}:</strong> ${err.message}
            </div>
          `;
        }
      });
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons();
      } catch (e) {}
    }
  }

  openAdvanceStepModal(petId, targetStepIndex = null) {
    if (!this.isStaffMode()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Modo Vista Cliente: El control de estatus se encuentra en modalidad solo lectura.', 'info');
      }
      return;
    }

    const pet = this.pets.find(p => p.id === petId);
    if (!pet) return;

    this.pendingAdvancePetId = petId;
    const steps = this.workflows[pet.area] || [];

    let currentIdx = pet.stepIndex >= 0 ? pet.stepIndex : 0;
    let targetIdx = targetStepIndex !== null ? parseInt(targetStepIndex, 10) : currentIdx + 1;
    if (targetIdx >= steps.length) targetIdx = steps.length - 1;
    if (targetIdx < 0) targetIdx = 0;

    this.pendingTargetStepIndex = targetIdx;

    // Actualizar encabezado del modal
    const photoEl = document.getElementById('adv-pet-photo');
    if (photoEl) photoEl.src = pet.image || pet.photo || 'assets/hero_border_collie.jpg';
    const titleEl = document.getElementById('adv-pet-subtitle');
    if (titleEl) titleEl.textContent = `Mascota: ${pet.petName || pet.name || 'Mascota VIP'} (${pet.species || 'Canino VIP'}) • Tutor: ${pet.ownerName || pet.owner || 'Tutor VIP'}`;
    const currStepEl = document.getElementById('adv-current-step-name');
    if (currStepEl) currStepEl.textContent = `${currentIdx + 1}. ${steps[currentIdx] || 'Inicial'}`;
    const targStepEl = document.getElementById('adv-target-step-name');
    if (targStepEl) targStepEl.textContent = `${targetIdx + 1}. ${steps[targetIdx] || ''}`;

    // Poblar Selector de Etapa Destino
    const stepSelect = document.getElementById('advance-target-step-select');
    if (stepSelect) {
      stepSelect.innerHTML = steps.map((st, idx) => `
        <option value="${idx}" ${idx === targetIdx ? 'selected' : ''}>
          ${idx + 1}. ${st} ${idx === currentIdx ? '(Etapa Actual)' : ''}
        </option>
      `).join('');
    }

    // Poblar Selector de Personal Staff
    const stationKey = this.getStationKeyForStep(pet.area, targetIdx);
    const authorizedStaff = this.getAuthorizedStaffForStation(stationKey);
    const allStaff = (window.adminEngine?.staffProfiles || [
      { id: 'USR-01', name: 'Dr. Alejandro Morales', rol_principal: 'doctor' },
      { id: 'USR-02', name: 'Mariana Colina (Grooming Lead)', rol_principal: 'groomer' },
      { id: 'USR-05', name: 'Andrea Colina (Grooming Specialist)', rol_principal: 'groomer' },
      { id: 'USR-04', name: 'Asistente de Recepción', rol_principal: 'hotel' },
      { id: 'USR-06', name: 'Dra. Patricia Silva', rol_principal: 'doctor' }
    ]);

    const staffSelect = document.getElementById('advance-staff-select');
    if (staffSelect) {
      let optionsHTML = '';

      const getStaffRoleLabel = (s) => {
        if (window.adminEngine && typeof window.adminEngine.getRoleTitle === 'function') {
          return window.adminEngine.getRoleTitle(s.rol_principal || s.role);
        }
        return s.rol_principal || s.role || 'Staff';
      };

      if (authorizedStaff.length > 0) {
        optionsHTML += `<optgroup label="⭐ Personal Especialista Autorizado en Estación">`;
        authorizedStaff.forEach(s => {
          optionsHTML += `<option value="${s.id}">${s.name} (${getStaffRoleLabel(s)})</option>`;
        });
        optionsHTML += `</optgroup>`;
      }

      optionsHTML += `<optgroup label="👥 Todo el Personal Staff Registrado">`;
      allStaff.forEach(s => {
        optionsHTML += `<option value="${s.id}">${s.name} (${getStaffRoleLabel(s)})</option>`;
      });
      optionsHTML += `</optgroup>`;

      optionsHTML += `<optgroup label="✏️ Escribir Nombre Personalizado">`;
      optionsHTML += `<option value="custom">✍️ Otro Profesional / Escribir Nombre (Ej: Dra. Patricia Silva / Dra. Tal)...</option>`;
      optionsHTML += `</optgroup>`;

      staffSelect.innerHTML = optionsHTML;

      if (pet.assignedStaffId && allStaff.some(s => s.id === pet.assignedStaffId)) {
        staffSelect.value = pet.assignedStaffId;
      } else if (authorizedStaff[0]) {
        staffSelect.value = authorizedStaff[0].id;
      } else {
        staffSelect.selectedIndex = 0;
      }
    }

    this.onAdvanceStaffSelectChange(staffSelect ? staffSelect.value : '');

    // Detección si la etapa involucra Revisión Dérmica (al entrar a ella o al avanzar desde ella a Baño Spa)
    const isDermalStation = (steps[targetIdx] || '').toLowerCase().includes('dérmic') || 
                            (steps[targetIdx] || '').toLowerCase().includes('dermic') ||
                            (steps[currentIdx] || '').toLowerCase().includes('dérmic') || 
                            (steps[currentIdx] || '').toLowerCase().includes('dermic') ||
                            (pet.area === 'grooming' && (targetIdx === 2 || currentIdx === 2));

    const dermalContainer = document.getElementById('adv-dermal-container');
    const dermalBadge = document.getElementById('adv-dermal-badge');
    const dermalSelect = document.getElementById('advance-dermal-condition-select');
    const sectorSelect = document.getElementById('advance-patient-sector-select');
    const geoguardSyncBox = document.getElementById('adv-geoguard-sync-box');

    if (isDermalStation) {
      if (dermalContainer) dermalContainer.style.display = 'block';
      if (dermalBadge) {
        dermalBadge.style.display = 'inline-block';
        dermalBadge.textContent = currentIdx === 2 ? '🔬 Certificación de Revisión Dérmica' : '🔬 Modo Revisión Dérmica';
      }
      if (dermalSelect) {
        dermalSelect.value = pet.dermalCondition || 'sin_novedad';
      }
      if (sectorSelect) {
        sectorSelect.value = pet.sector || 'El Milagro';
      }
      this.onDermalConditionChange(dermalSelect ? dermalSelect.value : 'sin_novedad');
    } else {
      if (dermalContainer) dermalContainer.style.display = 'none';
      if (dermalBadge) dermalBadge.style.display = 'none';
      if (geoguardSyncBox) geoguardSyncBox.style.display = 'none';
      const notesInput = document.getElementById('advance-step-notes');
      if (notesInput) notesInput.value = '';
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('advance-stage-modal');
    }
  }

  onAdvanceTargetStepChange(targetIdxStr) {
    const pet = this.pets.find(p => p.id === this.pendingAdvancePetId);
    if (!pet) return;

    const targetIdx = parseInt(targetIdxStr, 10);
    this.pendingTargetStepIndex = targetIdx;
    const steps = this.workflows[pet.area] || [];
    const currentIdx = pet.stepIndex >= 0 ? pet.stepIndex : 0;

    const targStepEl = document.getElementById('adv-target-step-name');
    if (targStepEl) targStepEl.textContent = `${targetIdx + 1}. ${steps[targetIdx] || ''}`;

    const stationKey = this.getStationKeyForStep(pet.area, targetIdx);
    const authorizedStaff = this.getAuthorizedStaffForStation(stationKey);
    const staffSelect = document.getElementById('advance-staff-select');
    if (staffSelect && authorizedStaff[0]) {
      staffSelect.value = authorizedStaff[0].id;
      this.onAdvanceStaffSelectChange(staffSelect.value);
    }

    // Actualizar visibilidad de diagnóstico dérmico al conmutar etapa
    const isDermalStation = (steps[targetIdx] || '').toLowerCase().includes('dérmic') || 
                            (steps[targetIdx] || '').toLowerCase().includes('dermic') ||
                            (steps[currentIdx] || '').toLowerCase().includes('dérmic') || 
                            (steps[currentIdx] || '').toLowerCase().includes('dermic') ||
                            (pet.area === 'grooming' && (targetIdx === 2 || currentIdx === 2));

    const dermalContainer = document.getElementById('adv-dermal-container');
    const dermalBadge = document.getElementById('adv-dermal-badge');
    const dermalSelect = document.getElementById('advance-dermal-condition-select');
    const sectorSelect = document.getElementById('advance-patient-sector-select');
    const geoguardSyncBox = document.getElementById('adv-geoguard-sync-box');

    if (isDermalStation) {
      if (dermalContainer) dermalContainer.style.display = 'block';
      if (dermalBadge) {
        dermalBadge.style.display = 'inline-block';
        dermalBadge.textContent = currentIdx === 2 ? '🔬 Certificación de Revisión Dérmica' : '🔬 Modo Revisión Dérmica';
      }
      if (dermalSelect) {
        dermalSelect.value = pet.dermalCondition || 'sin_novedad';
      }
      if (sectorSelect) {
        sectorSelect.value = pet.sector || 'El Milagro';
      }
      this.onDermalConditionChange(dermalSelect ? dermalSelect.value : 'sin_novedad');
    } else {
      if (dermalContainer) dermalContainer.style.display = 'none';
      if (dermalBadge) dermalBadge.style.display = 'none';
      if (geoguardSyncBox) geoguardSyncBox.style.display = 'none';
      const notesInput = document.getElementById('advance-step-notes');
    }
  }

  onDermalConditionChange(conditionVal) {
    const geoguardSyncBox = document.getElementById('adv-geoguard-sync-box');
    const notesInput = document.getElementById('advance-step-notes');
    const contagiousConditions = ['garrapatas', 'pulgas', 'gusanos_miasis', 'ectoparasitos_mixtos', 'sarna'];
    const isContagious = contagiousConditions.includes(conditionVal);

    if (geoguardSyncBox) {
      geoguardSyncBox.style.display = isContagious ? 'block' : 'none';
    }

    const conditionTextMap = {
      'sin_novedad': 'Revisión dérmica: Sin novedad. Piel sana, pelaje íntegro y sin ectoparásitos.',
      'urticaria': 'Revisión dérmica: Presenta cuadro de urticaria y eritema dérmico reactivo.',
      'lesion_dermica': 'Revisión dérmica: Presenta lesiones dérmicas focales y signos de dermatitis.',
      'garrapatas': 'Revisión dérmica: Presenta infestación por garrapatas (Rhipicephalus sanguineus). Requiere baño medicado y aislamiento preventivo.',
      'pulgas': 'Revisión dérmica: Presenta presencia activa de pulgas (Ctenocephalides) con prurito.',
      'gusanos_miasis': 'Revisión dérmica: Alerta crítica - Presenta miasis cutánea activa / gusanos. Requiere curación inmediata y antisepsia.',
      'ectoparasitos_mixtos': 'Revisión dérmica: Presenta ectoparásitos mixtos (garrapatas y pulgas). Protocolo antiparasitario intensivo.',
      'sarna': 'Revisión dérmica: Presenta signos compatibles con sarna / escabiosis con descamación y prurito.',
      'alopecia_hongos': 'Revisión dérmica: Presenta alopecia focal y sospecha de hongos (Dermatofitosis).',
      'custom': 'Revisión dérmica: '
    };

    if (notesInput && conditionTextMap[conditionVal]) {
      notesInput.value = conditionTextMap[conditionVal];
    }
  }

  onAdvanceStaffSelectChange(staffVal) {
    const container = document.getElementById('advance-staff-custom-container');
    const customInput = document.getElementById('advance-staff-custom-input');

    if (staffVal === 'custom') {
      if (container) container.style.display = 'block';
      if (customInput) customInput.focus();
    } else {
      if (container) container.style.display = 'none';
    }
  }

  closeAdvanceStepModal() {
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('advance-stage-modal');
    }
    const modal = document.getElementById('advance-stage-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('opacity', '0', 'important');
      modal.style.setProperty('visibility', 'hidden', 'important');
      modal.style.setProperty('pointer-events', 'none', 'important');
    }
    this.pendingAdvancePetId = null;
    this.pendingTargetStepIndex = null;
  }

  confirmAdvanceStep() {
    const pet = this.pets.find(p => p.id === this.pendingAdvancePetId);
    if (!pet) {
      this.closeAdvanceStepModal();
      return;
    }

    const steps = this.workflows[pet.area] || [];
    const targetSelect = document.getElementById('advance-target-step-select');
    const targetIdx = targetSelect ? parseInt(targetSelect.value, 10) : (pet.stepIndex + 1);

    const staffSelect = document.getElementById('advance-staff-select');
    const staffVal = staffSelect ? staffSelect.value : '';

    let staffName = '';
    let staffId = staffVal;

    if (staffVal === 'custom') {
      const customVal = document.getElementById('advance-staff-custom-input')?.value.trim();
      if (!customVal) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('Por favor escriba el nombre del responsable (Ej: Dra. Patricia Silva / Dra. Tal).', 'error');
        } else {
          alert('Por favor escriba el nombre del responsable (Ej: Dra. Patricia Silva / Dra. Tal).');
        }
        return;
      }
      staffName = customVal;
      staffId = `CUSTOM-${Date.now()}`;
    } else {
      const allStaff = (window.adminEngine?.staffProfiles || []);
      const foundStaff = allStaff.find(s => s.id === staffVal);
      if (foundStaff) {
        staffName = foundStaff.name;
      } else {
        const optionEl = staffSelect?.options[staffSelect.selectedIndex];
        staffName = optionEl ? optionEl.text.split('(')[0].trim() : 'Staff Responsable';
      }
    }

    const customNotes = document.getElementById('advance-step-notes')?.value.trim();

    pet.stepIndex = targetIdx;
    pet.assignedStaffId = staffId;
    pet.assignedStaffName = staffName;
    pet.updatedAt = 'Ahora mismo';

    // Diagnóstico Dérmico y Clasificación Sanitaria / Epidemiológica (al ingresar o al avanzar desde Revisión Dérmica)
    const currentIdx = pet.stepIndex >= 0 ? pet.stepIndex : 0;
    const isDermalStation = (steps[targetIdx] || '').toLowerCase().includes('dérmic') || 
                            (steps[targetIdx] || '').toLowerCase().includes('dermic') ||
                            (steps[currentIdx] || '').toLowerCase().includes('dérmic') || 
                            (steps[currentIdx] || '').toLowerCase().includes('dermic') ||
                            (pet.area === 'grooming' && (targetIdx === 2 || currentIdx === 2));

    if (isDermalStation) {
      const dermalSelect = document.getElementById('advance-dermal-condition-select');
      const conditionVal = dermalSelect ? dermalSelect.value : 'sin_novedad';
      const sectorSelect = document.getElementById('advance-patient-sector-select');
      const selectedSector = sectorSelect ? sectorSelect.value : (pet.sector || 'El Milagro');

      const contagiousConditions = ['garrapatas', 'pulgas', 'gusanos_miasis', 'ectoparasitos_mixtos', 'sarna'];
      const isContagious = contagiousConditions.includes(conditionVal);

      const conditionLabels = {
        'sin_novedad': 'Sin novedad (Piel sana)',
        'urticaria': 'Urticaria / Eritema reactivo',
        'lesion_dermica': 'Lesión dérmica / Dermatitis',
        'garrapatas': 'Garrapatas (Rhipicephalus sanguineus)',
        'pulgas': 'Pulgas (Ctenocephalides)',
        'gusanos_miasis': 'Gusanos / Miasis cutánea activa',
        'ectoparasitos_mixtos': 'Ectoparásitos mixtos (Garrapatas + Pulgas)',
        'sarna': 'Sarna / Escabiosis (Demodex/Sarcoptes)',
        'alopecia_hongos': 'Alopecia / Sospecha de hongos',
        'custom': 'Condición particular'
      };

      const conditionLabel = conditionLabels[conditionVal] || conditionVal;

      pet.dermalCondition = conditionVal;
      pet.dermalConditionLabel = conditionLabel;
      pet.isContagious = isContagious;
      pet.sector = selectedSector;
      pet.sanitaryAlert = isContagious ? conditionLabel : null;
      pet.patologia = isContagious ? conditionLabel : (pet.patologia || 'Piel sana');

      if (isContagious) {
        this.syncDermalCaseToBioTracker(pet, conditionLabel, selectedSector);
      }
    }

    // Cargar automáticamente costo de servicio a la cesta del cliente al pasar a estatus Recibido (etapa 1)
    const normAreaAt1 = this.normalizeService(pet.area);
    if (targetIdx === 1 && normAreaAt1 === 'grooming' && window.storeEngine && typeof window.storeEngine.chargeGroomingServiceToCart === 'function') {
      try {
        window.storeEngine.chargeGroomingServiceToCart({
          tutor: pet.ownerName || pet.owner,
          tutorId: pet.rif || pet.ownerId || '',
          rif: pet.rif || '',
          pet: pet.petName || pet.name,
          service: pet.service || 'Circuito Grooming Spa (7 Estaciones)',
          price: 25.00,
          petId: pet.id
        });
      } catch(e) {}
    } else if (targetIdx === 1 && normAreaAt1 === 'clinica' && window.storeEngine && typeof window.storeEngine.chargeClinicalConsultationToCart === 'function') {
      try {
        window.storeEngine.chargeClinicalConsultationToCart({
          tutor: pet.ownerName || pet.owner,
          tutorId: pet.rif || pet.ownerId || '',
          rif: pet.rif || '',
          pet: pet.petName || pet.name,
          service: 'Consulta Médica Veterinaria',
          price: typeof pet.price === 'number' ? pet.price : 30.00,
          petId: pet.id
        });
      } catch(e) {}
    } else if (targetIdx === 1 && normAreaAt1 === 'hotel' && window.storeEngine && typeof window.storeEngine.chargeHotelServiceToCart === 'function') {
      try {
        window.storeEngine.chargeHotelServiceToCart({
          tutor: pet.ownerName || pet.owner,
          tutorId: pet.rif || pet.ownerId || '',
          rif: pet.rif || '',
          pet: pet.petName || pet.name,
          service: pet.service || 'Hospedaje Suite Bioclimática VIP (Check-in Hotel 5★)',
          price: typeof pet.price === 'number' ? pet.price : 45.00,
          petId: pet.id
        });
      } catch(e) {}
    }

    // 🩺 Facturar servicios y exámenes clínicos al pasar a "Culminación de Examen / Alta Médica" (Estatus 6, índice 5 o 6)
    const normAreaAdv = this.normalizeService(pet.area);
    const targetStepName = (steps[targetIdx] || '').toLowerCase();
    const isClinicaAdv = normAreaAdv === 'clinica';
    const isAltaMedicaAdv = targetIdx === 6 || targetIdx === 7 || targetStepName.includes('alta') || targetStepName.includes('culminación');
    if (isClinicaAdv && isAltaMedicaAdv && window.storeEngine && typeof window.storeEngine.chargeClinicalServicesToCart === 'function') {
      try {
        window.storeEngine.chargeClinicalServicesToCart({
          tutor: pet.ownerName || pet.owner,
          tutorId: pet.rif || pet.ownerId || '',
          rif: pet.rif || '',
          pet: pet.petName || pet.name,
          service: pet.service,
          notes: customNotes || pet.notes,
          petId: pet.id
        });
      } catch(e) {}
    }

    if (customNotes) {
      pet.notes = customNotes;
    }

    const currentStationKey = this.getStationKeyForStep(pet.area, targetIdx);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!Array.isArray(pet.traceLogs)) pet.traceLogs = [];
    pet.traceLogs.push({
      stepIndex: targetIdx,
      stepName: steps[targetIdx],
      stationKey: currentStationKey,
      staffId: staffId,
      staffName: staffName,
      timestamp: timeNow,
      completedAt: timeNow,
      notes: customNotes || '',
      dermalCondition: pet.dermalCondition || '',
      isContagious: Boolean(pet.isContagious),
      sector: pet.sector || ''
    });

    if (targetIdx >= steps.length - 1) {
      pet.deliveredAt = timeNow;
      pet.deliveredBy = staffName;
      pet.isCompleted = true;
      pet.hasReservation = false;
      pet.status = 'Dado de Alta / Entregado';
    } else {
      pet.isCompleted = false;
      pet.hasReservation = true;
    }

    // Instrument Six Sigma Telemetry for GROOM-01 (Recepción Dérmica) and station step advances
    if (window.sixSigmaTelemetryEngine) {
      if (pet.area === 'grooming' && targetIdx === 1) { // 2. Revisión Dérmica
        const durationMinutes = Math.floor(Math.random() * 8 + 3); // 3 to 11 min real/simulated
        window.sixSigmaTelemetryEngine.recordMeasurement('GROOM-01', durationMinutes * 60000, {
          petId: pet.id,
          petName: pet.petName || pet.name || 'Mascota VIP',
          staffName,
          station: steps[targetIdx]
        });
      }
    }

    // Actualizar historial de analítica
    if (Array.isArray(pet.stepHistory) && pet.stepHistory[targetIdx]) {
      pet.stepHistory[targetIdx].staff = staffName;
      pet.stepHistory[targetIdx].status = 'completed';
      pet.stepHistory[targetIdx].endTime = timeNow;
    }

    // Sincronizar con adminEngine
    if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
      const adminPet = window.adminEngine.patientsStatus.find(p => p.id === pet.id);
      if (adminPet) {
        adminPet.stepIndex = pet.stepIndex;
        adminPet.assignedStaffId = pet.assignedStaffId;
        adminPet.assignedStaffName = staffName;
        if (pet.deliveredAt) adminPet.deliveredAt = pet.deliveredAt;
        if (pet.deliveredBy) adminPet.deliveredBy = pet.deliveredBy;
        
        if (targetIdx >= steps.length - 1) {
          adminPet.isCompleted = true;
          adminPet.hasReservation = false;
          adminPet.status = 'Dado de Alta / Entregado';

          // Clean active bookings for this pet so they disappear from active reservations control
          if (Array.isArray(window.adminEngine.bookedAppointments)) {
            window.adminEngine.bookedAppointments = window.adminEngine.bookedAppointments.filter(b => 
              !(b.pet && b.pet.toLowerCase().includes((pet.petName || pet.name || '').toLowerCase()))
            );
          }
          if (Array.isArray(window.adminEngine.pendingAppointments)) {
            window.adminEngine.pendingAppointments = window.adminEngine.pendingAppointments.filter(b => 
              !(b.pet && b.pet.toLowerCase().includes((pet.petName || pet.name || '').toLowerCase()))
            );
          }
          if (typeof window.adminEngine.saveReservationsToStorage === 'function') {
            window.adminEngine.saveReservationsToStorage();
          }
        }
        if (typeof window.adminEngine.savePatientsToStorage === 'function') {
          window.adminEngine.savePatientsToStorage();
        }
        if (typeof window.adminEngine.renderStatusManager === 'function') {
          window.adminEngine.renderStatusManager();
        }
        if (typeof window.adminEngine.renderAgendaManager === 'function') {
          window.adminEngine.renderAgendaManager();
        }
      }
    }

    // 🔔 DISPARAR NOTIFICACIONES EN PANTALLA Y AUTOMATIZACIÓN POR WHATSAPP
    if (window.liveNotificationEngine) {
      try {
        const isHotel = (normAreaAt1 === 'hotel' || pet.area === 'hotel');
        if (targetIdx === 1) {
          if (isHotel && typeof window.liveNotificationEngine.notifyHotelPetReceived === 'function') {
            window.liveNotificationEngine.notifyHotelPetReceived(pet);
          } else if (typeof window.liveNotificationEngine.notifyPetReceived === 'function') {
            window.liveNotificationEngine.notifyPetReceived(pet);
          }
        } else if (targetIdx >= steps.length - 1) {
          if (isHotel && typeof window.liveNotificationEngine.notifyHotelPetReadyHome === 'function') {
            window.liveNotificationEngine.notifyHotelPetReadyHome(pet);
          }
          if (typeof window.liveNotificationEngine.notifyPetDelivered === 'function') {
            window.liveNotificationEngine.notifyPetDelivered(pet);
          }
        }
      } catch (errNotif) {
        console.warn('[PET STATUS] Error al disparar notificación liveNotificationEngine:', errNotif);
      }
    }

    // 🔒 CIERRE OBLIGATORIO: Cerrar de forma inmediata e incondicional el modal tras ejecutar el proceso
    this.closeAdvanceStepModal();

    try {
      this.resequenceTurnsForArea(pet.area);
      this.savePetsToStorage();
      this.render();
      this.syncPetStatusToServer(pet);
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[PET STATUS] Error during render after advancing step:', e);
      }
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✨ Etapa de ${pet.petName || pet.name || 'Mascota VIP'} actualizada a '${steps[targetIdx]}' — Firmado por: ${staffName}`, 'success');
    }
  }

  assignStaffToPet(petId, staffId) {
    if (!this.isStaffMode()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Modo Vista Cliente: El control de estatus se encuentra en modalidad solo lectura.', 'info');
      }
      this.render();
      return;
    }
    const pet = this.pets.find(p => p.id === petId);
    if (pet) {
      pet.assignedStaffId = staffId;
      this.savePetsToStorage();
      this.render();
    }
  }

  syncDermalCaseToBioTracker(pet, conditionLabel, selectedSector) {
    try {
      const payload = {
        petId: pet.id,
        petName: pet.petName || pet.name || 'Mascota VIP',
        clientName: pet.ownerName || pet.owner || 'Tutor VIP',
        sector: selectedSector,
        condition: pet.dermalCondition,
        conditionLabel: conditionLabel,
        patologia: conditionLabel,
        isContagious: true,
        source: 'Grooming Revisión Dérmica',
        staffName: pet.assignedStaffName || 'Staff Especialista',
        notes: pet.notes || ''
      };

      if (typeof fetch === 'function') {
        fetch('/api/biotracker/report-dermal-case', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('[BioTracker Sync Notice]', err);
          }
        });
      }

      if (typeof window !== 'undefined' && typeof window.cachedHotspotsPayload === 'object' && window.cachedHotspotsPayload && Array.isArray(window.cachedHotspotsPayload.sectors)) {
        const sec = window.cachedHotspotsPayload.sectors.find(s => s.sector === selectedSector || s.key === selectedSector);
        if (sec) {
          sec.casos = (sec.casos || 0) + 1;
          sec.dermalReports = sec.dermalReports || [];
          sec.dermalReports.push(payload);
        }
        window.cachedHotspotsPayload.totalCasos = (window.cachedHotspotsPayload.totalCasos || 50) + 1;
      }

      if (typeof document !== 'undefined') {
        const directEl = document.getElementById('directAlertCount');
        if (directEl) directEl.textContent = parseInt(directEl.textContent || '50', 10) + 1;
        const alertEl = document.getElementById('alertCount');
        if (alertEl) alertEl.textContent = parseInt(alertEl.textContent || '50', 10) + 1;
        const gAlertEl = document.getElementById('googleAlertCount');
        if (gAlertEl) gAlertEl.textContent = parseInt(gAlertEl.textContent || '50', 10) + 1;
      }

      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🛡️ BioTracker GeoGuard: Caso de ${conditionLabel} registrado en ${selectedSector} para ${pet.petName || pet.name || 'Mascota'}. ¡Reflejado en el Radar!`, 'warning');
      }
    } catch(e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[syncDermalCaseToBioTracker Warning]', e);
      }
    }
  }

  getSectorKeyFromName(name) {
    if (!name) return 'elMilagro';
    const clean = name.toLowerCase().replace(/[\s\-_]/g, '');
    if (clean.includes('milagro')) return 'elMilagro';
    if (clean.includes('lago')) return 'laLago';
    if (clean.includes('negra')) return 'tierraNegra';
    if (clean.includes('bella') || clean.includes('vista')) return 'bellaVista';
    if (clean.includes('julio') || clean.includes('5')) return 'cincoDeJulio';
    if (clean.includes('lucia') || clean.includes('lucía')) return 'santaLucia';
    if (clean.includes('juana') || clean.includes('avila') || clean.includes('ávila')) return 'juanaDeAvila';
    if (clean.includes('rita')) return 'laRitaNorte';
    return 'elMilagro';
  }

  updateStep(petId, newIndex, staffId) {
    if (!this.isStaffMode()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Modo Vista Cliente: El control de estatus se encuentra en modalidad solo lectura.', 'info');
      }
      return;
    }
    this.openAdvanceStepModal(petId, newIndex);
  }

  prevStep(petId) {
    if (!this.isStaffMode()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Modo Vista Cliente: El control de estatus se encuentra en modalidad solo lectura.', 'info');
      }
      return;
    }
    const pet = this.pets.find(p => p.id === petId);
    if (pet && pet.stepIndex > 0) {
      this.openAdvanceStepModal(petId, pet.stepIndex - 1);
    } else if (pet) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`${pet.petName || pet.name || 'Mascota VIP'} ya se encuentra en la etapa inicial.`, 'info');
      }
    }
  }

  nextStep(petId) {
    if (!this.isStaffMode()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Modo Vista Cliente: El control de estatus se encuentra en modalidad solo lectura.', 'info');
      }
      return;
    }
    this.openAdvanceStepModal(petId);
  }

  notifyOwner(petId) {
    const pet = this.pets.find(p => p.id === petId);
    if (pet) {
      const currentStep = this.workflows[pet.area][pet.stepIndex];
      const message = `Hola ${pet.ownerName || pet.owner || 'Tutor VIP'}, te informamos de parte de *Mrs. Pets Maracaibo (Clínica Veterinaria • Av. El Milagro)* que tu mascota *${pet.petName || pet.name || 'la mascota'}* está en: *${currentStep}*. 🐾`;
      app.showToast(`Notificación enviada a ${pet.ownerName || pet.owner || 'Tutor VIP'}`, 'info');
      whatsappSim.sendMessage(`[AUTOMÁTICO MRS. PETS] ${message}`);
    }
  }

  getPetStatusForAI(userText) {
    if (!this.pets || this.pets.length === 0) return null;
    const lower = (userText || '').toLowerCase();
    
    // Look for matching pet name in text
    let matchedPet = this.pets.find(p => (p.petName || p.name) && lower.includes((p.petName || p.name).toLowerCase()));
    
    // If no exact match by name, check if user is asking about status in general
    if (!matchedPet && (lower.includes('estatus') || lower.includes('estado') || lower.includes('mi príncipe') || lower.includes('mi princesa') || lower.includes('mascota') || lower.includes('consentido') || lower.includes('turno'))) {
      matchedPet = this.pets[0];
    }

    if (!matchedPet) return null;

    const areaWorkflows = (this.workflows && this.workflows[matchedPet.area]) || (this.workflows && this.workflows.grooming) || [];
    const currentStage = areaWorkflows[matchedPet.stepIndex] || 'En Atención';
    const petName = matchedPet.petName || matchedPet.name || 'Consentido VIP';
    const species = matchedPet.species || 'Canino VIP';
    const title = species.toLowerCase().includes('princesa') || petName.toLowerCase().includes('princesa') ? 'Princesa' : 'Príncipe';

    return `🐾 <strong>Estatus de tu ${title} ${petName}:</strong><br>
• <strong>Área:</strong> ${(matchedPet.area || 'GROOMING').toUpperCase()}<br>
• <strong>Etapa actual:</strong> <span style="color:#fbbf24; font-weight:bold;">${currentStage}</span><br>
• <strong>Turno:</strong> #${matchedPet.turnNumber || 1}<br>
• <strong>Observaciones:</strong> ${matchedPet.notes || 'Atención personalizada bajo doctrina Silent Luxury.'}<br>
• <strong>Grooming Standard:</strong> Incluye Hidratación de Pulpejos obligatoria (100% de cortesía).<br>
⏰ <em>Recordatorio: Las citas concluyen estrictamente a las 6:00 p.m.</em>`;
  }

  // ==================== MÓDULO TIENDA: RESUMEN DE VENTAS & OPERACIONES EN VIVO ====================
  renderStoreSalesBanner(container) {
    if (!container) container = document.getElementById('grooming-queue-banner');
    if (!container) return;
    container.style.display = 'block';

    const isStaff = this.isStaffMode();
    const { activeCustomerName, activeCustomerPhone } = this.getActiveCustomerInfo();

    const salesList = window.storeSalesEngine ? window.storeSalesEngine.filterSales({
      dateFilter: this.currentDateFilter,
      statusFilter: this.currentStatusFilter,
      isStaff: isStaff,
      customerName: activeCustomerName,
      customerPhone: activeCustomerPhone,
      customFrom: this.customFrom,
      customTo: this.customTo
    }) : [];

    const totals = window.storeSalesEngine ? window.storeSalesEngine.calculateTotals(salesList) : {
      count: 0, totalUsd: 0, subtotalUsd: 0, ivaUsd: 0, totalVes: 0, formattedTotalVes: 'Bs. 0,00', ticketPromedioUsd: 0, bcvRate: 887.30, byPaymentMethod: {}
    };

    const dateLabels = {
      today: 'Hoy (Día en Curso)',
      future: '📅 Próximas Reservas & Pedidos Programados',
      week: 'Semana (Esta Semana & Próximos 7 Días)',
      fortnight: 'Quincena (15 Días)',
      month: 'Mes en Curso (30 Días)',
      custom: 'Rango Personalizado'
    };
    const periodLabel = dateLabels[this.currentDateFilter] || 'Período Activo';

    container.innerHTML = `
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border:2px solid #D4AF37; border-radius:20px; padding:18px 22px; margin-bottom:20px; color:#FFFFFF; box-shadow:0 8px 24px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <div style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:900;">🛍️</div>
            <div>
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <h3 style="margin:0; font-size:1.15rem; font-weight:900; color:#FFFFFF; display:flex; align-items:center; gap:8px;">
                  <span>Resumen Operativo & Ventas de Tienda</span>
                  <span class="badge" style="background:${isStaff ? '#10B981' : '#F59E0B'}; color:#FFFFFF; font-size:0.75rem; padding:2px 8px; border-radius:6px; font-weight:800;">
                    ${isStaff ? 'STAFF EMPRESA (TODAS LAS VENTAS)' : 'TUTOR VIP (COMPRAS PERSONALES)'}
                  </span>
                </h3>
                <span style="font-size:0.78rem; font-weight:800; color:#FBBF24; background:rgba(251,191,36,0.12); padding:3px 10px; border-radius:8px; border:1px solid rgba(251,191,36,0.3);">
                  📅 ${periodLabel}
                </span>
              </div>
              <p style="margin:4px 0 0 0; font-size:0.78rem; color:#CBD5E1;">
                Total de operaciones facturadas, conversión oficial BCV y control de despachos en mostrador.
              </p>
            </div>
          </div>

          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button class="btn btn-sm" onclick="petStatusEngine.openQuickPosModal()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; border:none; padding:8px 14px; border-radius:10px; cursor:pointer; font-size:0.8rem; box-shadow:0 3px 10px rgba(212,175,55,0.35);">
              ➕ Registrar Venta POS Tienda
            </button>
            <button class="btn btn-sm" onclick="if(window.adminFinanceEngine) adminFinanceEngine.showManagementModal(); else if(window.app) app.showToast('Módulo financiero cargado', 'info');" style="background:rgba(255,255,255,0.08); color:#FFFFFF; font-weight:800; border:1px solid rgba(255,255,255,0.2); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.8rem;">
              📊 Informe Financiero
            </button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:12px;">
          <!-- 1. Total Facturado USD / VES -->
          <div style="background:rgba(16, 185, 129, 0.12); border:1.5px solid #10B981; border-radius:14px; padding:12px 14px;">
            <div style="font-size:0.72rem; font-weight:800; color:#34D399; text-transform:uppercase; letter-spacing:0.5px;">💵 Total Facturado (Ventas)</div>
            <div style="font-size:1.45rem; font-weight:900; color:#FFFFFF; margin:4px 0 2px 0;">$${totals.totalUsd.toFixed(2)} <span style="font-size:0.8rem; color:#CBD5E1;">USD</span></div>
            <div style="font-size:0.78rem; font-weight:800; color:#A7F3D0;">${totals.formattedTotalVes}</div>
          </div>

          <!-- 2. Operaciones & Ticket Promedio -->
          <div style="background:rgba(212, 175, 55, 0.12); border:1.5px solid #D4AF37; border-radius:14px; padding:12px 14px;">
            <div style="font-size:0.72rem; font-weight:800; color:#FBBF24; text-transform:uppercase; letter-spacing:0.5px;">📦 Operaciones Realizadas</div>
            <div style="font-size:1.45rem; font-weight:900; color:#FFFFFF; margin:4px 0 2px 0;">${totals.count} <span style="font-size:0.8rem; color:#CBD5E1;">ventas</span></div>
            <div style="font-size:0.78rem; font-weight:700; color:#FDE68A;">Ticket Promedio: $${totals.ticketPromedioUsd.toFixed(2)} USD</div>
          </div>

          <!-- 3. Base Imponible & IVA 16% SENIAT -->
          <div style="background:rgba(99, 102, 241, 0.12); border:1.5px solid #6366F1; border-radius:14px; padding:12px 14px;">
            <div style="font-size:0.72rem; font-weight:800; color:#A5B4FC; text-transform:uppercase; letter-spacing:0.5px;">🏛️ Desglose Fiscal SENIAT</div>
            <div style="font-size:0.82rem; color:#CBD5E1; margin-top:4px;">Base Imponible: <strong style="color:#FFFFFF;">$${totals.subtotalUsd.toFixed(2)} USD</strong></div>
            <div style="font-size:0.82rem; color:#A5B4FC; margin-top:2px;">IVA (16% Legal): <strong style="color:#A5B4FC;">+$${totals.ivaUsd.toFixed(2)} USD</strong></div>
          </div>

          <!-- 4. Pasarelas & Despachos -->
          <div style="background:rgba(255, 255, 255, 0.05); border:1.5px solid rgba(255,255,255,0.15); border-radius:14px; padding:12px 14px;">
            <div style="font-size:0.72rem; font-weight:800; color:#CBD5E1; text-transform:uppercase; letter-spacing:0.5px;">💳 Estado de Despacho</div>
            <div style="font-size:0.82rem; color:#CBD5E1; margin-top:4px;">
              ⏳ Por Entregar: <strong style="color:#FBBF24;">${salesList.filter(s => s.stepIndex < 3).length}</strong>
            </div>
            <div style="font-size:0.82rem; color:#CBD5E1; margin-top:2px;">
              ✅ Entregadas: <strong style="color:#10B981;">${salesList.filter(s => s.stepIndex >= 3).length}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderStoreSalesCards(grid, isStaff, activeCustomerName, activeCustomerPhone) {
    const salesList = window.storeSalesEngine ? window.storeSalesEngine.filterSales({
      dateFilter: this.currentDateFilter,
      statusFilter: this.currentStatusFilter,
      isStaff: isStaff,
      customerName: activeCustomerName,
      customerPhone: activeCustomerPhone,
      customFrom: this.customFrom,
      customTo: this.customTo,
      searchQuery: this.searchQuery
    }) : [];

    if (salesList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:40px 20px; background:#f8fafc; border:2px dashed #cbd5e1; border-radius:18px; margin:16px 0;">
          <div style="font-size:2.2rem; margin-bottom:8px;">🛍️</div>
          <div style="font-size:1.1rem; font-weight:900; color:#1e293b; margin-bottom:6px;">No hay operaciones de tienda registradas en este período.</div>
          <p style="font-size:0.85rem; color:#64748b; max-width:480px; margin:0 auto 16px auto;">
            ${isStaff ? 'No se encontraron ventas para el filtro de fecha y estado seleccionado. Puedes registrar una nueva venta con el botón superior.' : 'No tienes compras registradas en este período. Para ver todas las ventas de la empresa, conmuta a Vista Staff Operativo.'}
          </p>
          ${isStaff ? `
            <button class="btn btn-primary" onclick="petStatusEngine.openQuickPosModal()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:10px 20px; border-radius:10px; border:none; cursor:pointer;">
              ➕ Registrar Venta POS Mostrador
            </button>
          ` : `
            <button class="btn btn-primary" onclick="if(window.adminEngine) { adminEngine.setEnvironment('enterprise'); } else { petStatusEngine.render(); }" style="background:linear-gradient(135deg, #4A6B5D, #2C4A3E); color:white; font-weight:800; padding:10px 20px; border-radius:10px; border:none; cursor:pointer;">
              🏢 Cambiar a Vista Staff Operativo (Ver Todo)
            </button>
          `}
        </div>
      `;
      return;
    }

    grid.innerHTML = salesList.map(sale => {
      const isCompleted = sale.stepIndex >= 3 || sale.status === 'completed';
      const itemsListHtml = (sale.items || []).map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding:3px 0; border-bottom:1px dashed #E2E8F0;">
          <span style="color:#334155;">• ${item.name} <strong style="color:#64748B;">(x${item.quantity || 1})</strong></span>
          <strong style="color:#0F172A;">$${(item.subtotal || (item.price * (item.quantity || 1))).toFixed(2)}</strong>
        </div>
      `).join('');

      return `
        <div class="card pet-card" style="border: 1.5px solid ${isCompleted ? '#E2E8F0' : '#D4AF37'}; background:#FFFFFF; border-radius:18px; padding:16px; box-shadow:0 4px 14px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s ease;">
          <div>
            <!-- ENCABEZADO DE TICKET Y FECHA -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #F1F5F9; padding-bottom:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="background:#FEF3C7; color:#92400E; font-weight:900; font-family:monospace; font-size:0.85rem; padding:3px 8px; border-radius:6px; border:1px solid #FDE68A;">
                  🧾 ${sale.ticketId}
                </span>
                <span style="font-size:0.75rem; color:#64748B; font-weight:700;">
                  ${sale.date} • ${sale.time}
                </span>
              </div>
              <span style="padding:3px 8px; border-radius:8px; font-weight:900; font-size:0.72rem; background:${isCompleted ? '#ECFDF5' : '#FFFBEB'}; color:${isCompleted ? '#047857' : '#B45309'}; border:1px solid ${isCompleted ? '#10B981' : '#F59E0B'};">
                ${isCompleted ? '✅ Entregado' : '⏳ Por Entregar'}
              </span>
            </div>

            <!-- DATOS DEL CLIENTE / COMPRADOR -->
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
              <img src="${sale.customerPhoto || 'assets/leia_avatar.jpg'}" alt="Cliente" style="width:40px; height:40px; border-radius:50%; border:2px solid #D4AF37; object-fit:cover;">
              <div style="flex:1;">
                <div style="font-weight:900; font-size:0.95rem; color:#0F172A;">${sale.customerName}</div>
                <div style="font-size:0.75rem; color:#64748B;">
                  ${sale.customerRif} • <a href="https://wa.me/${(sale.customerPhone || '').replace(/[^0-9]/g, '')}" target="_blank" style="color:#059669; font-weight:700; text-decoration:none;">${sale.customerPhone}</a>
                </div>
                ${sale.petName && sale.petName !== 'Mascota VIP' ? `
                  <div style="font-size:0.72rem; color:#D4AF37; font-weight:800; margin-top:1px;">
                    🐾 Mascota: ${sale.petName} ${sale.petSpecies ? `(${sale.petSpecies})` : ''}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- DETALLE DE PRODUCTOS COMPRADOS -->
            <div style="background:#F8FAFC; border-radius:10px; padding:10px; margin-bottom:12px; border:1px solid #E2E8F0;">
              <div style="font-size:0.75rem; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:6px;">Detalle de Compra:</div>
              ${itemsListHtml}
            </div>

            <!-- TOTALES FINANCIEROS & BCV -->
            <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:10px; margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#475569; margin-bottom:3px;">
                <span>Subtotal (Base):</span>
                <span>$${(sale.subtotal || 0).toFixed(2)} USD</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#475569; margin-bottom:4px;">
                <span>IVA (16% Legal):</span>
                <span>+$${(sale.iva || 0).toFixed(2)} USD</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-top:4px; border-top:1.5px solid #0F172A; margin-bottom:4px;">
                <span style="font-weight:900; font-size:0.85rem; color:#0F172A;">Total Pagado:</span>
                <strong style="font-size:1.15rem; font-weight:900; color:#0F172A;">$${(sale.total || 0).toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:800; color:#047857; background:#ECFDF5; padding:4px 8px; border-radius:6px; border:1px solid #10B981;">
                <span>Total Bs. (BCV ${sale.bcvRate || 887.30}):</span>
                <span>${sale.formattedTotalVes || `Bs. ${((sale.total || 0) * (sale.bcvRate || 887.30)).toFixed(2)}`}</span>
              </div>
            </div>

            <div style="font-size:0.75rem; color:#64748B; margin-bottom:12px;">
              💳 Método: <strong>${sale.paymentMethod || 'Tarjeta 3D Directa'}</strong><br>
              🚚 Modalidad: <em>${sale.deliveryType || 'Retiro en Mostrador'}</em>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN PARA STAFF -->
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
            ${!isCompleted ? `
              <div style="display:flex; gap:6px;">
                <button class="btn btn-sm btn-primary" onclick="petStatusEngine.markSaleDelivered('${sale.ticketId}')" style="flex:1.2; background:linear-gradient(135deg, #10B981, #059669); color:white; font-weight:900; padding:8px; border-radius:8px; border:none; cursor:pointer; font-size:0.78rem;">
                  ✅ Entregar Pedido
                </button>
                <button class="btn btn-sm" onclick="event.stopPropagation(); if(window.liveNotificationEngine) window.liveNotificationEngine.notifyStoreOrderReady(window.storeSalesEngine ? window.storeSalesEngine.getAllSales().find(s=>s.ticketId==='${sale.ticketId}') : null);" style="flex:1; background:linear-gradient(135deg, #F59E0B, #D97706); color:white; font-weight:900; padding:8px; border-radius:8px; border:none; cursor:pointer; font-size:0.78rem;" title="Notificar al Cliente por WhatsApp y Pantalla que su pedido ya está empacado y listo">
                  🛍️ Pedido Listo
                </button>
              </div>
            ` : `
              <div style="text-align:center; padding:6px; font-weight:800; font-size:0.76rem; color:#047857; background:#ECFDF5; border-radius:8px; border:1px solid #A7F3D0;">
                ✨ Operación Facturada & Entregada
              </div>
            `}
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm btn-secondary" onclick="petStatusEngine.openSaleReceipt('${sale.ticketId}')" style="flex:1; background:#FFFFFF; color:#2C2C2E; border:1px solid #CBD5E1; font-weight:800; font-size:0.75rem; padding:6px; border-radius:8px; cursor:pointer;">
                🧾 Ver Recibo
              </button>
              <button class="btn btn-sm btn-secondary" onclick="petStatusEngine.sendSaleWhatsApp('${sale.ticketId}')" style="flex:1; background:#25D366; color:#FFFFFF; border:none; font-weight:800; font-size:0.75rem; padding:6px; border-radius:8px; cursor:pointer;">
                💬 WhatsApp
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  markSaleDelivered(ticketId) {
    if (window.storeSalesEngine) {
      window.storeSalesEngine.updateSaleStatus(ticketId, 'completed', 3);
      const sale = window.storeSalesEngine.getAllSales().find(s => s.ticketId === ticketId || s.id === ticketId);
      if (sale && window.liveNotificationEngine && typeof window.liveNotificationEngine.notifyStoreOrderReady === 'function') {
        try {
          window.liveNotificationEngine.notifyStoreOrderReady(sale);
        } catch (e) {
          console.warn('[PET STATUS] Error al notificar pedido listo:', e);
        }
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✨ Venta ${ticketId} marcada como Entregada / Despachada y notificada por WhatsApp.`, 'success');
      }
      this.render();
    }
  }

  openSaleReceipt(ticketId) {
    const sale = window.storeSalesEngine ? window.storeSalesEngine.getAllSales().find(s => s.ticketId === ticketId || s.id === ticketId) : null;
    if (!sale) return;

    if (window.app && typeof window.app.showScreenPop === 'function') {
      window.app.showScreenPop({
        type: 'payment',
        headline: `Recibo Fiscal Digital • ${sale.ticketId}`,
        title: `Detalle Oficial de Venta en Tienda Mrs. Pets`,
        badgeText: '💳 FACTURADO & AUDITADO BCV SENIAT',
        icon: '🧾',
        accentColor: '#10B981',
        summaryHtml: `
          <div style="background:#F8FAFC !important; border:2px solid #000000 !important; border-radius:16px; padding:16px 18px; margin-bottom:14px; color:#000000 !important;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1.5px solid #000000; padding-bottom:6px;">
              <span style="font-weight:900;">🧾 Ticket / Factura:</span>
              <span style="font-weight:900; font-family:monospace; background:#FEF3C7; padding:2px 8px; border-radius:6px; border:1px solid #000000;">${sale.ticketId}</span>
            </div>
            <div style="font-size:0.85rem; margin-bottom:8px;">
              <strong>Cliente:</strong> ${sale.customerName} (${sale.customerRif})<br>
              <strong>Fecha:</strong> ${sale.date} a las ${sale.time}
            </div>
            <div style="background:#FFFFFF; border:1px dashed #000000; border-radius:8px; padding:8px; margin-bottom:10px; font-size:0.82rem;">
              <strong>Ítems Adquiridos:</strong><br>
              ${(sale.items || []).map(i => `• ${i.name} (x${i.quantity || 1}) - $${(i.subtotal || (i.price * (i.quantity || 1))).toFixed(2)} USD`).join('<br>')}
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
              <span>Subtotal:</span>
              <strong>$${(sale.subtotal || 0).toFixed(2)} USD</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
              <span>IVA (16% SENIAT):</span>
              <strong>+$${(sale.iva || 0).toFixed(2)} USD</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:1.15rem; font-weight:900; border-top:1.5px solid #000000; padding-top:6px; margin-bottom:6px;">
              <span>Total Pagado:</span>
              <span>$${(sale.total || 0).toFixed(2)} USD</span>
            </div>
            <div style="background:#ECFDF5; border:1px solid #059669; padding:6px 10px; border-radius:8px; display:flex; justify-content:space-between; font-weight:900; color:#065F46;">
              <span>Equivalente BCV (${sale.bcvRate} Bs./USD):</span>
              <span>${sale.formattedTotalVes}</span>
            </div>
          </div>
        `,
        buttons: [
          {
            text: '✓ Cerrar Recibo',
            primary: true,
            onClick: () => {}
          }
        ]
      });
    }
  }

  sendSaleWhatsApp(ticketId) {
    const sale = window.storeSalesEngine ? window.storeSalesEngine.getAllSales().find(s => s.ticketId === ticketId || s.id === ticketId) : null;
    if (!sale) return;

    const itemsSummary = (sale.items || []).map(i => `• ${i.name} (x${i.quantity || 1}) - $${(i.subtotal || (i.price * (i.quantity || 1))).toFixed(2)} USD`).join('\n');
    const msg = `🧾 *COMPROBANTE DE COMPRA EN TIENDA - MRS. PETS MARACAIBO*\n\nHola *${sale.customerName}*,\n\nConfirmamos tu compra:\n• *Ticket*: \`${sale.ticketId}\`\n• *Fecha*: ${sale.date} • ${sale.time}\n• *Subtotal*: $${(sale.subtotal || 0).toFixed(2)} USD\n• *IVA (16% Legal SENIAT)*: +$${(sale.iva || 0).toFixed(2)} USD\n• *TOTAL PAGADO*: *$${(sale.total || 0).toFixed(2)} USD*\n• *Tasa Oficial BCV*: *${sale.bcvRate || 887.30} Bs./USD*\n• *Total en Bolívares*: *${sale.formattedTotalVes}*\n\n*Detalle de Productos:*\n${itemsSummary}\n\n• Estado: *${sale.status === 'completed' ? 'ENTREGADO / DESPACHADO' : 'PENDIENTE POR ENTREGAR (MOSTRADOR)'}* ✅\n• Sede: *Av. 2 El Milagro, diagonal a C.C. Lago Mall*\n• WA Oficial: *+58 414-6799510*`;

    if (window.whatsappSim && typeof window.whatsappSim.sendMessage === 'function') {
      window.whatsappSim.sendMessage(msg);
    }
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`💬 Recibo de compra ${ticketId} despachado a WhatsApp Simulator.`, 'success');
    }
  }

  openQuickPosModal() {
    const products = (window.storeEngine && window.storeEngine.products) || [
      { id: 'PROD-101', name: 'Royal Canin Mini Adult (3kg)', price: 28.50 },
      { id: 'PROD-102', name: 'Champú Ozono Hipoalergénico 500ml', price: 18.00 },
      { id: 'PROD-103', name: 'Bravecto Perros 10-20kg', price: 42.00 }
    ];

    const modalHtml = `
      <div style="background:#0F172A; color:#FFFFFF; padding:24px; border-radius:18px; border:2px solid #D4AF37; max-width:540px; margin:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.4); padding-bottom:12px; margin-bottom:16px;">
          <h3 style="margin:0; font-size:1.2rem; font-weight:900; color:#FBBF24;">➕ Registrar Venta POS Tienda (Mostrador)</h3>
          <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
        </div>

        <form id="form-quick-pos-sale" onsubmit="event.preventDefault(); petStatusEngine.handleQuickPosSubmit(this);">
          <div style="margin-bottom:12px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Nombre del Cliente / Tutor:</label>
            <input type="text" name="customerName" required value="Dalybell Ramírez Montilla" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
          </div>

          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Cédula / RIF:</label>
              <input type="text" name="rif" required value="V-18.452.910" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Teléfono WhatsApp:</label>
              <input type="text" name="phone" required value="+58 (414) 389-1102" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
          </div>

          <div style="margin-bottom:12px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Producto Seleccionado:</label>
            <select name="productSelect" id="quick-pos-prod-select" onchange="const p = ${JSON.stringify(products)}.find(x => x.name === this.value); if(p) document.getElementById('quick-pos-unit-price').value = p.price;" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
              ${products.map(p => `<option value="${p.name}">${p.name} ($${p.price})</option>`).join('')}
            </select>
          </div>

          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Cantidad:</label>
              <input type="number" name="quantity" id="quick-pos-qty" min="1" value="1" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Precio ($):</label>
              <input type="number" step="0.01" name="unitPrice" id="quick-pos-unit-price" value="${products[0].price}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Estado:</label>
              <select name="status" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
                <option value="completed">Entregado</option>
                <option value="pending">Por Entregar</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Método de Pago:</label>
            <select name="paymentMethod" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
              <option value="Tarjeta 3D Directa (Stripe)">Tarjeta 3D Directa (Stripe)</option>
              <option value="Punto de Venta POS Biopago">Punto de Venta POS Biopago</option>
              <option value="Pago Móvil Banesco">Pago Móvil Banesco</option>
              <option value="Efectivo Divisas ($ USD)">Efectivo Divisas ($ USD)</option>
            </select>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="app.closeModal('general-modal')" style="background:transparent; color:#CBD5E1; border:1px solid #64748B; padding:8px 16px; border-radius:8px; cursor:pointer;">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:8px 18px; border-radius:8px; border:none; cursor:pointer;">💳 Cobrar & Registrar Venta</button>
          </div>
        </form>
      </div>
    `;

    if (window.app && typeof window.app.showModalDirectHtml === 'function') {
      window.app.showModalDirectHtml(modalHtml);
    } else if (window.adminFinanceEngine && typeof window.adminFinanceEngine.showModal === 'function') {
      window.adminFinanceEngine.showModal(modalHtml);
    }
  }

  handleQuickPosSubmit(form) {
    const custName = form.customerName.value;
    const rif = form.rif.value;
    const phone = form.phone.value;
    const prodName = form.productSelect.value;
    const qty = parseInt(form.quantity.value, 10) || 1;
    const unitPrice = parseFloat(form.unitPrice.value) || 25.00;
    const status = form.status.value;
    const payMethod = form.paymentMethod.value;

    const subtotal = unitPrice * qty;
    const iva = parseFloat((subtotal * 0.16).toFixed(2));
    const total = parseFloat((subtotal + iva).toFixed(2));

    if (window.storeSalesEngine) {
      window.storeSalesEngine.recordSale({
        customerName: custName,
        customerRif: rif,
        customerPhone: phone,
        petName: 'Princesa',
        items: [{ name: prodName, quantity: qty, price: unitPrice, subtotal: subtotal }],
        subtotal: subtotal,
        iva: iva,
        total: total,
        paymentMethod: payMethod,
        status: status,
        stepIndex: status === 'completed' ? 3 : 2,
        deliveryType: status === 'completed' ? 'Entrega Inmediata Mostrador' : 'Por Retirar en Mostrador'
      });

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✨ Venta de $${total.toFixed(2)} USD registrada con éxito en Tienda.`, 'success');
      }
      if (window.app && typeof window.app.closeModal === 'function') {
        window.app.closeModal('general-modal');
      }
      this.render();
    }
  }
}

const petStatusEngine = new PetStatusEngine();
window.petStatusEngine = petStatusEngine;
document.addEventListener('DOMContentLoaded', () => petStatusEngine.init());
