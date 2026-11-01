/* ==========================================================================
   ZERO TRUST PII MASKING & "SOY CHICO PET" DIRECTORY ENGINE (Mrs. Pets)
   Silent Luxury Architecture • Field-Level Obfuscation & Role-Based Access
   ========================================================================== */

class PiiMaskingEngine {
  constructor() {
    this.directoryPets = [];
    this.currentSearchQuery = '';
    this.currentFilter = 'all';
  }

  init() {
    this.loadDirectoryData();
  }

  loadDirectoryData() {
    // Collect patients from adminEngine or default sample dataset
    if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
      this.directoryPets = window.adminEngine.patientsStatus;
    } else {
      this.directoryPets = [
        {
          id: 'PET-101',
          name: 'Princesa Motica',
          petName: 'Princesa Motica',
          honorific: 'Princesa',
          species: 'Canino (Maltipoo)',
          breed: 'Maltipoo',
          sex: 'Hembra',
          owner: 'Dalybell Ramírez Montilla',
          ownerName: 'Dalybell Ramírez Montilla',
          rif: 'V-18.452.910',
          ownerPhone: '+58 414-389-1102',
          photo: 'assets/media__1787695246337.jpg',
          ownerPhoto: 'assets/leia_avatar.jpg',
          isVipRegistered: true
        },
        {
          id: 'PET-102',
          name: 'Fifi',
          petName: 'Fifi',
          honorific: 'Princesa',
          species: 'Canino (Teckel / Dachshund VIP)',
          breed: 'Teckel / Dachshund VIP',
          sex: 'Hembra',
          owner: 'Carlos Mendoza',
          ownerName: 'Carlos Mendoza',
          rif: 'V-14.882.109',
          ownerPhone: '+58 412-5551234',
          photo: 'assets/media__1787695254613.jpg',
          ownerPhoto: 'assets/leia_avatar.jpg',
          isVipRegistered: true
        },
        {
          id: 'PET-105',
          name: 'Princesa Ivi',
          petName: 'Princesa Ivi',
          honorific: 'Princesa',
          species: 'Felino (Gato Persa VIP)',
          breed: 'Gato Persa VIP',
          sex: 'Hembra',
          owner: 'Dalybell Ramírez Montilla',
          ownerName: 'Dalybell Ramírez Montilla',
          rif: 'V-18.452.910',
          ownerPhone: '+58 414-389-1102',
          photo: 'assets/media__1787694901704.jpg',
          ownerPhoto: 'assets/leia_avatar.jpg',
          isVipRegistered: true
        }
      ];
    }
  }

  // --- ZERO TRUST BACKEND SERIALIZER SIMULATOR ---
  // Sanitizes dataset at data level before sending/rendering to frontend UI
  sanitizePatientForRole(patient, viewerRole, viewerUserName = '') {
    if (!patient) return null;

    const copy = { ...patient };
    const ownerName = (copy.owner || copy.ownerName || '').toLowerCase().trim();
    const currentName = (viewerUserName || '').toLowerCase().trim();

    const isStaff = viewerRole === 'staff' || (window.adminEngine && window.adminEngine.isStaffMode && window.adminEngine.isStaffMode());
    const isOwner = currentName && ownerName && (currentName.includes(ownerName) || ownerName.includes(currentName));

    if (isStaff) {
      copy.accessMode = 'staff';
      copy.maskedRif = copy.rif || 'V-19.482.109';
      copy.maskedPhone = copy.ownerPhone || copy.phone || '+58 414-9876543';
    } else if (isOwner) {
      copy.accessMode = 'owner';
      copy.maskedRif = copy.rif || 'V-19.482.109';
      copy.maskedPhone = copy.ownerPhone || copy.phone || '+58 414-9876543';
    } else {
      // VISITOR OR THIRD PARTY CLIENT ACCESS: ZERO TRUST DATA SANITIZATION
      copy.accessMode = 'visitor';
      copy.rif = '[Restringido]';
      copy.ownerPhone = '[Restringido]';
      copy.phone = '[Restringido]';
      copy.email = '[Restringido]';
      copy.maskedRif = '***-***-***';
      copy.maskedPhone = '+58 4**-*******';
    }

    return copy;
  }

  // --- SOY CHICO PET DIRECTORY UI RENDERER ---
  renderSoyChicoPetDirectory(containerId = 'soy-chico-pet-grid') {
    const isStaff = (
      window.adminEngine &&
      window.adminEngine.viewEnvironment === 'enterprise' &&
      window.adminEngine.isEnterpriseAuthenticated === true
    );

    const container = document.getElementById(containerId);
    if (!container) return;

    if (!isStaff) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; background: #ffffff; border: 1.5px solid #d97706; border-radius: 16px; padding: 36px 20px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <div style="font-size: 2.2rem; margin-bottom: 12px;">🔒</div>
          <h3 style="font-size: 1.25rem; font-weight: 900; color: #0f172a; margin: 0 0 8px 0;">Acceso Restringido a Personal Administrativo</h3>
          <p style="font-size: 0.85rem; color: #64748b; margin: 0 auto; max-width: 500px;">El Directorio Zero Trust con protección de datos PII es de uso exclusivo interno para el Staff de Mrs. Pets.</p>
        </div>
      `;
      return;
    }

    this.loadDirectoryData();

    // Determine current user role & active name
    let viewerRole = 'visitor';
    let viewerUserName = '';

    if (window.adminEngine && window.adminEngine.viewEnvironment === 'enterprise') {
      viewerRole = 'staff';
    } else if (window.authEngine) {
      viewerRole = window.authEngine.userRole || 'visitor';
      viewerUserName = window.authEngine.userName || '';
    }

    // Filter pets by search & category filter
    const query = this.currentSearchQuery.toLowerCase().trim();
    const filtered = this.directoryPets.filter(p => {
      const pName = (p.name || p.petName || '').toLowerCase();
      const pOwner = (p.owner || p.ownerName || '').toLowerCase();
      const pBreed = (p.breed || p.species || '').toLowerCase();

      const matchesSearch = !query || pName.includes(query) || pOwner.includes(query) || pBreed.includes(query);

      if (!matchesSearch) return false;

      if (this.currentFilter === 'canino') return p.species && p.species.toLowerCase().includes('canino');
      if (this.currentFilter === 'felino') return p.species && (p.species.toLowerCase().includes('felino') || p.species.toLowerCase().includes('gato'));
      if (this.currentFilter === 'vip') return p.isVipRegistered === true;
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:40px; background:#fff; border-radius:16px; border:1px solid rgba(217,119,6,0.2);">
          <div style="font-size:2.4rem; margin-bottom:8px;">🔎 🐾</div>
          <h4 style="font-size:1.1rem; font-weight:800; color:var(--obsidian-black);">No se encontraron miembros en Soy Chico Pet</h4>
          <p style="font-size:0.85rem; color:var(--text-muted);">Intente con otros términos de búsqueda o filtre por categoría.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    filtered.forEach(rawPet => {
      const sanitized = this.sanitizePatientForRole(rawPet, viewerRole, viewerUserName);
      const cardHtml = this.createSoyChicoPetCard(sanitized);
      container.appendChild(cardHtml);
    });

    // Re-initialize Lucide icons
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  createSoyChicoPetCard(pet) {
    const card = document.createElement('div');
    card.className = 'soy-chico-pet-card';
    card.style.cssText = `
      background: #ffffff;
      border: 1px solid rgba(217, 119, 6, 0.25);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      position: relative;
    `;

    const honorific = pet.honorific || (pet.sex === 'Hembra' ? 'Princesa' : 'Príncipe');
    const fullTitle = `${honorific} ${pet.petName || pet.name || 'Mascota'} `;
    const breedText = pet.breed || pet.species || 'Mestizo VIP';
    const sexText = pet.sex || 'VIP';

    let headerRibbon = '';
    let piiContent = '';
    let actionButtons = '';

    if (pet.accessMode === 'staff') {
      // 1. MODO STAFF / EQUIPO MRS. PETS
      headerRibbon = `
        <div style="background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 6px 14px; display: flex; align-items: center; justify-content: space-between;">
          <span>🛡️ ACCESO STAFF / RECEPCIÓN</span>
          <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">Q-VET PRO ONLINE</span>
        </div>
      `;

      piiContent = `
        <div style="margin-top: 10px; background: #fffbe6; padding: 10px; border-radius: 10px; border: 1px solid rgba(217,119,6,0.3); font-size: 0.8rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#64748b; font-weight:600;">🆔 Cédula / RIF:</span>
            <span style="font-weight:800; color:#0f172a;">${pet.maskedRif}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#64748b; font-weight:600;">📱 Teléfono / WA:</span>
            <span style="font-weight:800; color:#047857;">${pet.maskedPhone}</span>
          </div>
        </div>
      `;

      actionButtons = `
        <div style="display: flex; gap: 8px; margin-top: 14px;">
          <button class="btn btn-secondary btn-sm" style="flex:1; font-size:0.75rem; font-weight:700;" onclick="app.showToast('📋 Abriendo expediente de ${pet.name} en Q-Vet Pro...', 'info')">
            📋 Abrir en Q-Vet Pro
          </button>
          <button class="btn btn-primary btn-sm" style="flex:1; font-size:0.75rem; font-weight:700; background:#25D366; border:none;" onclick="whatsappSim.sendMessage('[CONTACTO STAFF CHARLIE] Notificación enviada al tutor ${pet.owner}')">
            💬 Contactar WhatsApp
          </button>
        </div>
      `;

    } else if (pet.accessMode === 'owner') {
      // 2. MODO DUEÑO / MI PERFIL
      headerRibbon = `
        <div style="background: linear-gradient(135deg, #10b981, #047857); color: #ffffff; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 6px 14px; display: flex; align-items: center; justify-content: space-between;">
          <span>✨ MI PERFIL VIP ACTIVO</span>
          <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">PROPIETARIO</span>
        </div>
      `;

      piiContent = `
        <div style="margin-top: 10px; background: #f0fdf4; padding: 10px; border-radius: 10px; border: 1px solid #bbf7d0; font-size: 0.8rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#166534; font-weight:600;">🆔 Mi Cédula / RIF:</span>
            <span style="font-weight:800; color:#0f172a;">${pet.maskedRif}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#166534; font-weight:600;">📱 Mi WhatsApp:</span>
            <span style="font-weight:800; color:#047857;">${pet.maskedPhone}</span>
          </div>
        </div>
      `;

      actionButtons = `
        <div style="margin-top: 14px;">
          <button class="btn btn-secondary btn-sm" style="width:100%; font-size:0.78rem; font-weight:700;" onclick="registrationEngine.openRegistrationModal({ name: '${pet.owner}', pet: '${pet.name}' })">
            ✏️ Editar / Actualizar Mi Perfil VIP
          </button>
        </div>
      `;

    } else {
      // 3. MODO VISITANTE / TERCERO (ENMASCARAMIENTO ESTRICTO ZERO TRUST)
      headerRibbon = `
        <div style="background: #f1f5f9; color: #475569; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 6px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom:1px solid #e2e8f0;">
          <span>🐾 MIEMBRO SOY CHICO PET</span>
          <span style="background: #e2e8f0; color:#334155; padding: 2px 6px; border-radius: 4px;">PÚBLICO</span>
        </div>
      `;

      piiContent = `
        <div style="margin-top: 10px; background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 0.8rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="color:#64748b; font-weight:600;">🆔 Cédula de Identidad:</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="badge-lock" style="background:#fee2e2; color:#dc2626; font-size:0.68rem; font-weight:800; padding:2px 6px; border-radius:4px;">🔒 Restringido</span>
              <span class="masked-data" style="font-family:monospace; font-weight:700; color:#94a3b8;">${pet.maskedRif}</span>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#64748b; font-weight:600;">📱 Teléfono de Contacto:</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="badge-lock" style="background:#fee2e2; color:#dc2626; font-size:0.68rem; font-weight:800; padding:2px 6px; border-radius:4px;">🔒 Restringido</span>
              <span class="masked-data" style="font-family:monospace; font-weight:700; color:#94a3b8;">${pet.maskedPhone}</span>
            </div>
          </div>
        </div>
      `;

      actionButtons = `
        <div style="margin-top: 14px; text-align:center; padding:8px; background:#f8fafc; border-radius:8px; font-size:0.72rem; color:#64748b; font-weight:600;">
          🔒 Datos de contacto protegidos por la Política Zero Trust de Mrs. Pets
        </div>
      `;
    }

    card.innerHTML = `
      ${headerRibbon}
      <div style="padding: 18px; flex:1; display:flex; flex-direction:column;">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:12px;">
          <img src="${pet.photo || 'assets/hero_border_collie.jpg'}" alt="${pet.name}" style="width:64px; height:64px; border-radius:14px; object-fit:cover; border:2px solid var(--gold-dark); box-shadow:0 3px 8px rgba(0,0,0,0.1);">
          <div>
            <h4 style="font-size:1.05rem; font-weight:900; color:var(--obsidian-black); margin-bottom:2px;">
              ${fullTitle}
            </h4>
            <div style="font-size:0.78rem; font-weight:700; color:var(--gold-dark);">
              ${breedText} • ${sexText}
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
              👤 Tutor: <strong>${pet.owner || pet.ownerName || 'Tutor VIP'}</strong>
            </div>
          </div>
        </div>

        ${piiContent}

        <div style="margin-top:auto;">
          ${actionButtons}
        </div>
      </div>
    `;

    return card;
  }

  setFilter(filterName, btnEl) {
    this.currentFilter = filterName;
    if (btnEl) {
      document.querySelectorAll('.soy-chico-filter-btn').forEach(b => {
        b.style.background = '#f8fafc';
        b.style.color = '#64748b';
      });
      btnEl.style.background = 'var(--gold-dark, #D4AF37)';
      btnEl.style.color = '#ffffff';
    }
    this.renderSoyChicoPetDirectory();
  }

  onSearchInput(query) {
    this.currentSearchQuery = query;
    this.renderSoyChicoPetDirectory();
  }
}

const piiMaskingEngine = new PiiMaskingEngine();
window.piiMaskingEngine = piiMaskingEngine;
document.addEventListener('DOMContentLoaded', () => piiMaskingEngine.init());
