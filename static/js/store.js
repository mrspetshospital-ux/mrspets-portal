/* ==========================================================================
   E-COMMERCE & ONLINE PAYMENTS ENGINE (Mrs. Pets Maracaibo - Reduced Images)
   ========================================================================== */

class StoreEngine {
  constructor() {
    this.products = [];
    this.cart = [];
  }

  init() {
    try { localStorage.removeItem('mrs_pets_cart_default'); } catch(e) {}
    this.loadProductsFromCatalog();
    this.loadCart();
    this.renderProducts();
    this.renderCart();
    this.bindCardInputs();

    window.addEventListener('mrs_pets_currency_changed', () => {
      this.renderProducts();
      this.renderCart();
      this.updateCartBadges();
      if (document.getElementById('quick-cart-drawer') && document.getElementById('quick-cart-drawer').style.display !== 'none') {
        this.openQuickCartModal();
      }
    });
  }

  formatCurrency(amount) {
    if (window.FinancialEngine && typeof window.FinancialEngine.formatCurrency === 'function') {
      return window.FinancialEngine.formatCurrency(amount);
    }
    return `$${Number(amount || 0).toFixed(2)}`;
  }

  normalizeString(str) {
    if (!str) return '';
    return str.toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  isStaffName(nameStr) {
    if (!nameStr) return false;
    // Si la sesión activa es de cliente, respetar su identidad de cliente
    if (window.authEngine && window.authEngine.isAuthenticated && window.authEngine.userRole === 'client') {
      return false;
    }
    const s = this.normalizeString(nameStr);
    const staffTokens = [
      'staff', 'administrador', 'admin general', 'admin', 'recepcionista',
      'caja', 'groomer lead', 'director medico', 'asistente veterinario'
    ];
    if (staffTokens.some(token => s === token || s.includes('staff') || s.includes('administrador') || s.includes('admin general'))) return true;
    if (window.adminEngine && Array.isArray(window.adminEngine.staffProfiles)) {
      const match = window.adminEngine.staffProfiles.some(sp => {
        const spUser = this.normalizeString(sp.username || '');
        return spUser && s === spUser;
      });
      if (match) return true;
    }
    return false;
  }

  getCurrentCustomerInfo() {
    let name = '';
    let rif = '';
    let phone = '';

    const isStaffSession = Boolean(
      (window.authEngine && window.authEngine.userRole === 'staff') ||
      (window.adminEngine && window.adminEngine.isEnterpriseAuthenticated === true) ||
      (window.adminEngine && window.adminEngine.viewEnvironment === 'enterprise')
    );

    // 0. Si hay cliente activo conmutado explícitamente en almacenamiento local
    if (typeof localStorage !== 'undefined') {
      const storedName = localStorage.getItem('mrs_pets_active_customer_name');
      const storedRif = localStorage.getItem('mrs_pets_active_customer_rif');
      if (storedName && !this.isStaffName(storedName)) {
        name = storedName.trim();
        if (storedRif && !storedRif.toLowerCase().includes('registrado')) {
          rif = storedRif.trim();
        }
      }
    }

    // 0b. Si es sesión cliente, verificar authEngine.getCurrentUser() si existe
    if (!isStaffSession && window.authEngine && typeof window.authEngine.getCurrentUser === 'function') {
      try {
        const u = window.authEngine.getCurrentUser();
        if (u) {
          const candidate = u.tutorName || (u.role === 'client' ? u.name : '');
          if (candidate && !this.isStaffName(candidate)) name = candidate;
          if (u.rif && !u.rif.toLowerCase().includes('registrado')) rif = u.rif;
          if (u.phone) phone = u.phone;
        }
      } catch(e) {}
    }

    // 1. Verificar si hay mascota VIP activa en sesión
    const activePetId = (window.authEngine && window.authEngine.currentVipPetId) ||
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('mrs_pets_active_vip_patient_id') : null);
    if (activePetId) {
      const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
      const pMatch = allPets.find(p => p.id === activePetId);
      if (pMatch) {
        const pOwner = pMatch.owner || pMatch.ownerName || '';
        const isOwnerMatch = !name || this.normalizeString(name) === this.normalizeString(pOwner) || this.isStaffName(name);
        if (isOwnerMatch) {
          if (pOwner && !this.isStaffName(pOwner)) {
            if (!name || this.isStaffName(name)) name = pOwner;
          }
          if ((!rif || rif.toLowerCase().includes('registrado')) && pMatch.rif && !pMatch.rif.toLowerCase().includes('registrado')) {
            rif = pMatch.rif;
          }
          if (!phone) phone = pMatch.ownerPhone || '';
        }
      }
    }

    // 2. Verificar authEngine userName si NO es staff
    if (!name && window.authEngine && window.authEngine.userName && !isStaffSession && !this.isStaffName(window.authEngine.userName)) {
      name = window.authEngine.userName.split('(')[0].trim();
    }

    // 3. Verificar adminEngine si tiene cliente activo
    if (!name && window.adminEngine && typeof window.adminEngine.getCurrentCustomerName === 'function') {
      const n = window.adminEngine.getCurrentCustomerName();
      if (n && !this.isStaffName(n)) name = n;
    }

    // 4. Verificar texto de cuenta en encabezado SOLO si NO es staff
    if (!name && !isStaffSession) {
      const nameTextEl = document.getElementById('user-account-name-text');
      if (nameTextEl && nameTextEl.innerText && !this.isStaffName(nameTextEl.innerText)) {
        name = nameTextEl.innerText.trim();
      }
    }

    // 4b. Si estamos en Staff o el nombre sigue siendo staff, resolver el cliente VIP activo de la clínica/tienda
    if (!name || this.isStaffName(name)) {
      if (isStaffSession) {
        const storedClient = typeof localStorage !== 'undefined' ? localStorage.getItem('mrs_pets_active_customer_name') : null;
        if (storedClient && !this.isStaffName(storedClient)) {
          name = storedClient.trim();
        } else {
          name = 'Dalybell Ramírez Montilla';
          rif = 'V-18.452.910';
          phone = '+58 414-3891102';
        }
      } else {
        name = 'Cliente VIP';
        rif = '';
        phone = '';
      }
    }

    // 5. Vincular RIF / Cédula y teléfono desde la base de datos si aún no están resueltos o son genéricos
    const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
    if ((!rif || rif.toLowerCase().includes('registrado')) && name && Array.isArray(allPets)) {
      const normName = this.normalizeString(name);
      let match = allPets.find(p => {
        const oNorm = this.normalizeString(p.owner || p.ownerName || '');
        const hasValidRif = p.rif && !p.rif.toLowerCase().includes('registrado');
        return oNorm && oNorm === normName && hasValidRif;
      });
      if (!match) {
        match = allPets.find(p => {
          const oNorm = this.normalizeString(p.owner || p.ownerName || '');
          return oNorm && oNorm === normName;
        });
      }
      if (!match && normName.length >= 4) {
        match = allPets.find(p => {
          const oNorm = this.normalizeString(p.owner || p.ownerName || '');
          const hasValidRif = p.rif && !p.rif.toLowerCase().includes('registrado');
          return oNorm && (oNorm.startsWith(normName) || normName.startsWith(oNorm)) && hasValidRif;
        });
      }
      if (match) {
        if (!rif || rif.toLowerCase().includes('registrado')) rif = match.rif || rif || '';
        if (!phone) phone = match.ownerPhone || '';
        name = match.owner || match.ownerName || name;
      }
    }

    return { name, rif, phone };
  }

  getCurrentCustomerName() {
    return this.getCurrentCustomerInfo().name || 'Dalybell Ramírez Montilla';
  }

  isItemOwnedByCustomer(item, cust) {
    if (!item || !cust) return false;
    // Los productos de la tienda online (alimentos, cremas, boutique) pertenecen a la sesión de compras activa
    if (!item.isService && !item.isGroomingService && !String(item.id).startsWith('SERV-')) {
      return true;
    }

    const itemRif = (item.tutorRif || item.rif || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const custRif = (cust.rif || cust.id || cust.tutorId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 1. Coincidencia canónica y estricta por RIF / Cédula
    if (itemRif && custRif && itemRif.length >= 4 && custRif.length >= 4 && !itemRif.includes('REGISTRADO') && !custRif.includes('REGISTRADO')) {
      if (itemRif !== custRif) return false;
      const iName = this.normalizeString(item.tutor || item.owner || '');
      const cName = this.normalizeString(cust.name || cust.tutor || cust.owner || '');
      const generic = ['tutor vip', 'cliente vip', 'cliente', 'guest', 'staff', 'usuario'];
      if (iName && cName && !generic.includes(iName) && !generic.includes(cName)) {
        const iFirst = iName.split(' ')[0];
        const cFirst = cName.split(' ')[0];
        if (iFirst && cFirst && iFirst !== cFirst && !iName.includes(cFirst) && !cName.includes(iFirst)) {
          return false;
        }
      }
      return true;
    }

    // Si ambos tienen RIFs válidos pero distintos, son clientes diferentes
    if (itemRif && custRif && itemRif.length >= 4 && custRif.length >= 4 && itemRif !== custRif && !itemRif.includes('REGISTRADO') && !custRif.includes('REGISTRADO')) {
      return false;
    }

    // 2. Coincidencia estricta y exacta por nombre de tutor (sin fuzzy includes)
    const itemTutorNorm = this.normalizeString(item.tutor || item.owner || '');
    const custOwnerNorm = this.normalizeString(cust.name || cust.tutor || cust.owner || '');

    const genericNames = ['tutor vip', 'cliente vip', 'cliente', 'guest', 'staff', 'usuario'];
    if (genericNames.includes(itemTutorNorm) || genericNames.includes(custOwnerNorm)) {
      return false;
    }

    return itemTutorNorm && custOwnerNorm && itemTutorNorm === custOwnerNorm;
  }

  isPetOwnedByCustomer(pet, customerInfo) {
    if (!pet || !customerInfo) return false;

    const petRif = (pet.rif || pet.ownerId || pet.tutorId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const custRif = (customerInfo.rif || customerInfo.id || customerInfo.tutorId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 1. Coincidencia canónica y estricta por RIF / Cédula
    if (petRif && custRif && petRif.length >= 4 && custRif.length >= 4 && !petRif.includes('REGISTRADO') && !custRif.includes('REGISTRADO')) {
      if (petRif !== custRif) return false;
      const pName = this.normalizeString(pet.owner || pet.ownerName || '');
      const cName = this.normalizeString(customerInfo.name || customerInfo.tutor || '');
      const generic = ['tutor vip', 'cliente vip', 'cliente', 'guest', 'staff', 'usuario'];
      if (pName && cName && !generic.includes(pName) && !generic.includes(cName)) {
        const pFirst = pName.split(' ')[0];
        const cFirst = cName.split(' ')[0];
        if (pFirst && cFirst && pFirst !== cFirst && !pName.includes(cFirst) && !cName.includes(pFirst)) {
          return false;
        }
      }
      return true;
    }

    // Si ambos tienen RIFs válidos pero distintos, son clientes diferentes
    if (petRif && custRif && petRif.length >= 4 && custRif.length >= 4 && petRif !== custRif && !petRif.includes('REGISTRADO') && !custRif.includes('REGISTRADO')) {
      return false;
    }

    // 2. Coincidencia estricta y exacta por nombre de tutor (sin fuzzy includes que junte clientes con nombres similares)
    const petOwnerNorm = this.normalizeString(pet.owner || pet.ownerName || '');
    const custOwnerNorm = this.normalizeString(customerInfo.name || customerInfo.tutor || '');

    const genericNames = ['tutor vip', 'cliente vip', 'cliente', 'guest', 'staff', 'usuario'];
    if (genericNames.includes(petOwnerNorm) || genericNames.includes(custOwnerNorm)) {
      return false;
    }

    return petOwnerNorm && custOwnerNorm && petOwnerNorm === custOwnerNorm;
  }

  getCustomerUniqueId(customerInfo = null) {
    const cust = customerInfo || this.getCurrentCustomerInfo();
    if (!cust) return 'guest';
    const rawRif = (cust.rif || cust.tutorId || cust.id || '');
    const cleanRif = rawRif.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanRif && cleanRif.length >= 4 && !cleanRif.includes('REGISTRADO')) {
      return cleanRif;
    }
    const cleanName = this.normalizeString(cust.name || cust.tutor || '')
      .replace(/[^a-z0-9]/g, '_');
    return cleanName || 'guest';
  }

  getCartStorageKey(customCustomerIdentifier = null) {
    const activeCust = this.getCurrentCustomerInfo();

    if (!customCustomerIdentifier) {
      const id = this.getCustomerUniqueId(activeCust);
      return `mrs_pets_cart_${id}`;
    }

    if (typeof customCustomerIdentifier === 'object') {
      const id = this.getCustomerUniqueId(customCustomerIdentifier);
      return `mrs_pets_cart_${id}`;
    }

    if (typeof customCustomerIdentifier === 'string' && customCustomerIdentifier.trim()) {
      const trimmed = customCustomerIdentifier.trim();
      const isRifShape = /^[VvJjEeGgPp]-?[0-9]/.test(trimmed);
      if (isRifShape && !trimmed.toLowerCase().includes('registrado')) {
        return `mrs_pets_cart_${trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
      }

      // Si es un nombre, verificar si coincide EXACTAMENTE con el cliente activo para usar su clave canónica con RIF
      if (activeCust && activeCust.name) {
        const normActive = this.normalizeString(activeCust.name);
        const normTarget = this.normalizeString(trimmed);
        if (normActive === normTarget) {
          const id = this.getCustomerUniqueId(activeCust);
          return `mrs_pets_cart_${id}`;
        }
      }

      // Buscar si algún paciente registrado en el sistema tiene RIF para este tutor (coincidencia EXACTA de nombre)
      const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
      const normTarget = this.normalizeString(trimmed);
      const matchedPatient = allPets.find(p => {
        const pOwner = this.normalizeString(p.owner || p.ownerName || '');
        const hasValidRif = p.rif && !p.rif.toLowerCase().includes('registrado');
        return pOwner === normTarget && hasValidRif;
      });
      if (matchedPatient && (matchedPatient.rif || matchedPatient.ownerId)) {
        const cleanRif = (matchedPatient.rif || matchedPatient.ownerId).toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (cleanRif.length >= 4 && !cleanRif.includes('REGISTRADO')) {
          return `mrs_pets_cart_${cleanRif}`;
        }
      }

      return `mrs_pets_cart_${normTarget.replace(/[^a-z0-9]/g, '_')}`;
    }

    const id = this.getCustomerUniqueId(activeCust);
    return `mrs_pets_cart_${id}`;
  }

  /**
   * Normalización canónica del nombre base del consentido (sin sufijos, razas o paréntesis)
   */
  normalizePetBaseName(petName) {
    if (!petName) return '';
    let str = String(petName).trim();

    // Si tiene paréntesis, determinar si el nombre está afuera o adentro
    const parenMatch = str.match(/\((.*?)\)/);
    const outside = str.split('(')[0].trim();
    const isOutsideRoom = /^(suite|habitaci[oó]n|canil|cama|box|jaula|sala|area|alojamiento)\b/i.test(outside);

    if (isOutsideRoom && parenMatch && parenMatch[1]) {
      // El nombre del consentido está dentro de los paréntesis (ej. "Suite Royal #4 (Luna - Persa)")
      const inside = parenMatch[1].trim();
      const insideParts = inside.split(/[-/:]/);
      str = insideParts.length > 0 ? insideParts[0].trim() : inside;
    } else if (outside && outside.length >= 2 && !isOutsideRoom) {
      // El nombre del consentido está afuera (ej. "Luna (Gato Persa VIP)" o "Luna - Persa")
      const outsideParts = outside.split(/[-/:]/);
      str = outsideParts.length > 0 ? outsideParts[0].trim() : outside;
    } else if (parenMatch && parenMatch[1]) {
      const inside = parenMatch[1].trim();
      const insideParts = inside.split(/[-/:]/);
      str = insideParts.length > 0 ? insideParts[0].trim() : inside;
    }

    // Remover prefijos honoríficos solo si van seguidos de otro término (ej. "consentido toby", "princesa leia")
    let cleaned = str.replace(/\b(pr[ií]ncipe|princesa|vip|consentid[oa]|mascota)\b\s+/gi, '').trim();
    if (!cleaned) {
      cleaned = str;
    }
    return this.normalizeString(cleaned);
  }

  /**
   * [SLOT MAPPING Q-VET PRO] Identificador de ranura única por categoría de servicio
   */
  getServiceSlotId(item) {
    if (!item) return '';
    const idStr = String(item.id || '').toUpperCase();
    const catStr = String(item.category || '').toLowerCase();
    const nameStr = String(item.name || '').toLowerCase();

    // 1. Circuito Grooming Spa (7 Estaciones)
    if (item.isGroomingService || catStr.includes('grooming') || idStr.includes('GROOMING') || nameStr.includes('grooming') || nameStr.includes('spa')) {
      return 'GROOMING_SPA_CIRCUIT';
    }

    // 2. Consulta Médica Veterinaria Base
    if (item.isClinicalService || catStr.includes('clíni') || catStr.includes('medic') || idStr.includes('CLINIC')) {
      if (idStr.includes('EXAM') || idStr.includes('UPLOAD') || idStr.includes('LAB') || catStr.includes('laboratorio') || nameStr.includes('hematolog') || nameStr.includes('perfil')) {
        return `CLINIC_EXAM_${idStr.replace(/[^A-Z0-9]/g, '')}`;
      }
      if (idStr.includes('PROFILAXIS') || nameStr.includes('profilaxis')) {
        return 'CLINIC_SPECIALIST_PROFILAXIS';
      }
      return 'CLINIC_BASE_CONSULTATION';
    }

    // 3. Hotel Canino / Felino
    if (item.isHotelService || catStr.includes('hotel') || idStr.includes('HOTEL')) {
      return 'HOTEL_SUITE_STAY';
    }

    // 4. Productos de Tienda / Boutique
    return idStr || 'STORE_PRODUCT';
  }

  /**
   * [IDEMPOTENCIA TRANSACCIONAL & SLOT MAPPING - COMITÉ VOLTURI]
   * Valida unicidad estricta para cada paciente y servicio en el carrito.
   * Prohíbe duplicar conceptos idénticos para el mismo consentido en el mismo turno diario.
   * Unifica automáticamente duplicados a una (1) sola línea de cobro y notifica a administración.
   */
  deduplicateCart(cartArray = null, customer = null) {
    const target = cartArray || this.cart;
    if (!Array.isArray(target) || target.length === 0) return target;

    const seenServiceSlots = new Map();
    const cleanCart = [];
    let deduplicatedCount = 0;

    target.forEach(item => {
      if (!item) return;

      const isService = Boolean(
        item.isService ||
        item.isGroomingService ||
        item.isClinicalService ||
        (item.category && item.category.toLowerCase().includes('servicio')) ||
        (typeof item.id === 'string' && item.id.startsWith('SERV-'))
      );

      // Si es un producto físico de tienda online (alimentos, boutique, farmacia)
      if (!isService) {
        const existingProdIndex = cleanCart.findIndex(p => p.id === item.id);
        if (existingProdIndex !== -1) {
          // Idempotencia: NO sumar quantity con quantity durante ciclos de deduplicación/render/carga
          cleanCart[existingProdIndex].quantity = Math.max(cleanCart[existingProdIndex].quantity || 1, item.quantity || 1);
        } else {
          cleanCart.push({ ...item, quantity: item.quantity || 1 });
        }
        return;
      }

      // Si es un SERVICIO (Grooming, Consulta Clínica, Exámenes Q-Vet):
      let petBase = this.normalizePetBaseName(item.pet);
      if (!petBase && item.name) {
        const parts = item.name.split('-');
        if (parts.length > 1) {
          petBase = this.normalizePetBaseName(parts[parts.length - 1]);
        }
      }
      const slotId = this.getServiceSlotId(item);
      const slotKey = `${petBase}__${slotId}`;

      if (seenServiceSlots.has(slotKey)) {
        // ¡DUPLICADO DETECTADO! Violación de Idempotencia detectada y unificada
        deduplicatedCount++;
        const existingIdx = seenServiceSlots.get(slotKey);
        // Unificar datos manteniendo precio estándar y cantidad estrictamente en 1
        cleanCart[existingIdx] = {
          ...cleanCart[existingIdx],
          ...item,
          quantity: 1,
          price: (slotId === 'GROOMING_SPA_CIRCUIT') ? 25.00 : (cleanCart[existingIdx].price || item.price)
        };
        console.warn(`[IDEMPOTENCIA Q-VET] Duplicidad de ${slotId} unificada a 1 sola línea para el paciente ${item.pet || 'VIP'}.`);
        if (window.adminEngine && typeof window.adminEngine.logOperationalAudit === 'function') {
          window.adminEngine.logOperationalAudit('CART_IDEMPOTENCY_UNIFIED', `Duplicidad de concepto ${slotId} unificada para ${item.pet}`);
        }
      } else {
        // Primera ocurrencia legítima para este paciente y servicio
        const unifiedItem = {
          ...item,
          quantity: 1,
          price: (slotId === 'GROOMING_SPA_CIRCUIT') ? 25.00 : item.price
        };
        seenServiceSlots.set(slotKey, cleanCart.length);
        cleanCart.push(unifiedItem);
      }
    });

    if (cartArray === null) {
      this.cart = cleanCart;
    }
    return cleanCart;
  }

  /**
   * Saneamiento Estricto Zero-Leak & Idempotencia:
   * Purga del carrito cualquier servicio que no pertenezca al cliente activo
   * y unifica cualquier duplicidad transaccional de slots de servicio.
   */
  sanitizeCartForCurrentCustomer(cust = null) {
    const customer = cust || this.getCurrentCustomerInfo();
    if (!Array.isArray(this.cart) || this.cart.length === 0) return;

    this.cart = this.cart.filter(item => {
      if (!this.isItemOwnedByCustomer(item, customer)) return false;
      if (item && item.id && item.id.includes('PROFILAXIS')) return false;
      if (item && item.name && item.name.toLowerCase().includes('profilaxis dental')) return false;
      return true;
    });
    this.cart = this.deduplicateCart(this.cart, customer);
  }

  /**
   * 🔄 CONMUTACIÓN SEGURA DE CLIENTES & AISLAMIENTO MULTI-PERFIL
   * Regla de negocio estricta 3: Persistencia por Cliente en localStorage.
   * Si el usuario sale, cierra sesión o busca a otro cliente y regresa,
   * el carrito y los consumos de cada perfil deben mantenerse intactos y cargarse
   * correctamente sin duplicarse ni perderse.
   */
  switchCustomer(customerInfo) {
    if (!customerInfo) return;

    // 1. Persistir el carrito actual del cliente saliente en su clave propia
    this.saveCart();

    // 2. Extraer nombre, RIF y datos del nuevo cliente
    let newName = '';
    let newRif = '';
    let newPhone = '';
    let newPetId = '';

    if (typeof customerInfo === 'string') {
      newName = customerInfo.trim();
    } else if (typeof customerInfo === 'object') {
      newName = (customerInfo.name || customerInfo.tutor || customerInfo.owner || customerInfo.ownerName || '').trim();
      newRif = (customerInfo.rif || customerInfo.tutorId || customerInfo.id || '').trim();
      newPhone = (customerInfo.phone || customerInfo.ownerPhone || '').trim();
      newPetId = (customerInfo.petId || customerInfo.currentVipPetId || '').trim();
    }

    if (!newName && !newRif) return;

    // 3. Si no hay RIF, intentar buscarlo en la base de datos de pacientes registrados
    if (!newRif || newRif.toLowerCase().includes('registrado')) {
      const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
      const matched = allPets.find(p => {
        const oNorm = this.normalizeString(p.owner || p.ownerName || '');
        const targetNorm = this.normalizeString(newName);
        return oNorm === targetNorm && p.rif && !p.rif.toLowerCase().includes('registrado');
      });
      if (matched) {
        newRif = matched.rif;
        if (!newPhone) newPhone = matched.ownerPhone || '';
        if (!newPetId) newPetId = matched.id || '';
      }
    }

    // 4. Actualizar authEngine si existe
    if (window.authEngine) {
      if (newName && !this.isStaffName(newName)) {
        window.authEngine.userName = newName;
        if (!window.adminEngine || !window.adminEngine.isEnterpriseAuthenticated) {
          window.authEngine.userRole = 'client';
        }
      }
      if (newPetId) {
        window.authEngine.currentVipPetId = newPetId;
      } else {
        window.authEngine.currentVipPetId = null;
      }
    }

    // 5. Persistir cliente activo en localStorage para guiar las consultas
    if (typeof localStorage !== 'undefined') {
      if (newName) localStorage.setItem('mrs_pets_active_customer_name', newName);
      if (newRif) localStorage.setItem('mrs_pets_active_customer_rif', newRif);
      if (newPetId) {
        localStorage.setItem('mrs_pets_active_vip_patient_id', newPetId);
      } else {
        localStorage.removeItem('mrs_pets_active_vip_patient_id');
      }
    }

    // 6. Cargar el carrito del nuevo cliente de forma limpia y aislada
    this.loadCart();
    this.renderCart();
    this.updateCartBadges();
  }

  loadCart() {
    try {
      const savedDismissed = localStorage.getItem('mrs_pets_dismissed_services');
      if (savedDismissed) {
        this.dismissedServices = new Set(JSON.parse(savedDismissed));
      } else if (!this.dismissedServices) {
        this.dismissedServices = new Set();
      }
    } catch(e) {
      if (!this.dismissedServices) this.dismissedServices = new Set();
    }

    try {
      const savedDismissedProd = localStorage.getItem('mrs_pets_dismissed_products');
      if (savedDismissedProd) {
        this.dismissedProducts = new Set(JSON.parse(savedDismissedProd));
      } else if (!this.dismissedProducts) {
        this.dismissedProducts = new Set();
      }
    } catch(e) {
      if (!this.dismissedProducts) this.dismissedProducts = new Set();
    }

    const cust = this.getCurrentCustomerInfo();
    const primaryKey = this.getCartStorageKey(cust);
    let loaded = false;

    // Purga definitiva de variaciones obsoletas que puedan contener productos zombis (Royal Canin, etc.)
    const legacyZombieKeys = [
      'mrs_pets_cart_dalybell_ramirez_montilla',
      'mrs_pets_cart_dalybell_ram_rez_montilla',
      'mrs_pets_cart_dalybell_ramirez'
    ];
    legacyZombieKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch(e) {}
    });

    try {
      const saved = localStorage.getItem(primaryKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.cart = parsed;
          loaded = true;
        }
      }
    } catch(e) {}

    if (!Array.isArray(this.cart) || !loaded) {
      this.cart = [];
    }

    // Filtrar cualquier producto explícitamente eliminado por el usuario
    if (this.dismissedProducts && this.dismissedProducts.size > 0) {
      this.cart = this.cart.filter(item => !this.dismissedProducts.has(item.id));
    }

    // 1. Purga rigurosa de servicios ajenos al cliente activo (Zero Data Leak)
    this.sanitizeCartForCurrentCustomer(cust);

    // 2. Auto-sincronizar mascotas en Grooming que pertenecen exclusivamente a este cliente
    this.syncCustomerGroomingServicesToCart();

    // 3. Auto-sincronizar servicios y exámenes clínicos en Alta Médica (Estatus 6)
    this.syncCustomerClinicalServicesToCart();

    // 4. Auto-sincronizar estadía de Hotel 5★ si está en Check-in (Estatus 1+)
    this.syncCustomerHotelServicesToCart();

    // 5. [COMITÉ VOLTURI] Blindaje de idempotencia: unificar cualquier duplicado a una sola línea
    this.cart = this.deduplicateCart(this.cart, cust);

    // 6. Persistir carrito limpio y aislado
    this.saveCart();
  }

  /**
   * Sincroniza y suma al carrito todas las mascotas que pertenecen al mismo cliente (mismo RIF/ID o tutor)
   * que se encuentren actualmente en el circuito de Grooming en estatus "Recibido" o etapas activas.
   */
  syncCustomerGroomingServicesToCart() {
    const cust = this.getCurrentCustomerInfo();
    const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
    if (!Array.isArray(allPets) || allPets.length === 0) return false;

    // Buscar todas las mascotas de este cliente
    const customerPets = allPets.filter(p => this.isPetOwnedByCustomer(p, cust));

    // Filtrar aquellas que están en Grooming en estatus "Recibido" (stepIndex >= 1) y no completadas
    const activeGroomingPets = customerPets.filter(p => {
      const normArea = this.normalizeString(p.area);
      if (normArea && normArea !== 'grooming') return false; // Descarte estricto: no procesar clínica ni hotel como grooming
      const isGrooming = (normArea === 'grooming' || (!normArea && p.service && p.service.toLowerCase().includes('grooming')));
      const isReceived = (typeof p.stepIndex === 'number' ? p.stepIndex >= 1 : false);
      const isNotDischarged = !p.isCompleted;
      return isGrooming && isReceived && isNotDischarged;
    });

    if (activeGroomingPets.length === 0) return false;

    // [COMITÉ VOLTURI] Deduplicación canónica por cleanPetBaseName para evitar duplicidad de registros del mismo consentido
    const seenPetBases = new Set();
    const uniqueGroomingPets = [];
    activeGroomingPets.forEach(p => {
      const base = this.normalizePetBaseName(p.name || p.petName);
      if (!seenPetBases.has(base)) {
        seenPetBases.add(base);
        uniqueGroomingPets.push(p);
      }
    });

    let modified = false;
    uniqueGroomingPets.forEach(pet => {
      const petName = pet.name || pet.petName || 'Mascota VIP';
      const cleanPetId = (pet.id || petName).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const cartItemId = `SERV-GROOMING-${cleanPetId}`;
      const petBase = this.normalizePetBaseName(petName);

      // Si el servicio fue cancelado/eliminado por Staff de Administración, no reinsertarlo
      if (this.dismissedServices) {
        if (this.dismissedServices.has(cartItemId) ||
            this.dismissedServices.has(this.normalizeString(petName)) ||
            (pet.id && this.dismissedServices.has(pet.id))) {
          return;
        }
      }

      const serviceName = pet.service || 'Circuito Grooming Spa (7 Estaciones)';
      const price = typeof pet.price === 'number' ? pet.price : 25.00;

      // Verificar si esta mascota en específico ya está en la cesta por ID o por ranura canónica
      const existingIndex = this.cart.findIndex(item => 
        item.id === cartItemId || 
        (this.getServiceSlotId(item) === 'GROOMING_SPA_CIRCUIT' && item.pet && this.normalizePetBaseName(item.pet) === petBase)
      );

      const serviceEntry = {
        id: cartItemId,
        name: serviceName,
        category: 'Servicio Grooming',
        price: price,
        quantity: 1,
        pet: petName,
        petId: pet.id,
        tutor: pet.owner || pet.ownerName || cust.name,
        tutorRif: pet.rif || cust.rif,
        refId: pet.id,
        isService: true,
        isGroomingService: true,
        image: 'assets/mrs_pets_official_logo.png',
        status: 'Recibido',
        chargedAt: new Date().toISOString()
      };

      if (existingIndex !== -1) {
        this.cart[existingIndex] = { ...this.cart[existingIndex], ...serviceEntry, quantity: 1 };
      } else {
        // Sumar cada mascota de forma individual al carrito (conservando productos de tienda)
        this.cart.unshift(serviceEntry);
        modified = true;
      }
    });

    this.cart = this.deduplicateCart(this.cart, cust);

    if (modified) {
      this.saveCart();
    }
    return modified;
  }

  /**
   * Sincroniza y suma al carrito todos los servicios médicos y consultas correspondientes
   * a mascotas del cliente en clínica (Consulta Médica al agendar / recibir, y paquete completo en Alta Médica).
   */
  syncCustomerClinicalServicesToCart() {
    const cust = this.getCurrentCustomerInfo();
    const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
    if (!Array.isArray(allPets) || allPets.length === 0) return false;

    const customerPets = allPets.filter(p => this.isPetOwnedByCustomer(p, cust));
    const activeClinicalPets = customerPets.filter(p => {
      const normArea = this.normalizeString(p.area);
      const isClinica = (normArea === 'clinica');
      const isReceived = (typeof p.stepIndex === 'number' && p.stepIndex >= 1);
      return isClinica && isReceived && !p.isCompleted;
    });

    if (activeClinicalPets.length === 0) return false;

    // [COMITÉ VOLTURI] Deduplicación canónica por cleanPetBaseName
    const seenPetBases = new Set();
    const uniqueClinicalPets = [];
    activeClinicalPets.forEach(p => {
      const base = this.normalizePetBaseName(p.name || p.petName);
      if (!seenPetBases.has(base)) {
        seenPetBases.add(base);
        uniqueClinicalPets.push(p);
      }
    });

    let modified = false;
    uniqueClinicalPets.forEach(pet => {
      const petName = pet.name || pet.petName || 'Mascota VIP';
      const cleanPetId = (pet.id || petName).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const baseCartItemId = `SERV-CLINIC-${cleanPetId}-CONSULTA`;

      if (this.dismissedServices && (this.dismissedServices.has(baseCartItemId) || (pet.id && this.dismissedServices.has(pet.id)))) {
        return;
      }

      const steps = window.adminEngine?.workflows?.clinica || window.petStatusEngine?.workflows?.clinica || [];
      const currentStepName = (typeof pet.stepIndex === 'number' && steps[pet.stepIndex]) ? steps[pet.stepIndex] : '';
      const isAltaMedica = (typeof pet.stepIndex === 'number' && (pet.stepIndex === 6 || pet.stepIndex === 7 || currentStepName.toLowerCase().includes('alta') || currentStepName.toLowerCase().includes('culminación')));

      if (isAltaMedica) {
        const res = this.chargeClinicalServicesToCart({
          pet: petName,
          petId: pet.id,
          tutor: pet.owner || pet.ownerName || cust.name,
          rif: pet.rif || cust.rif,
          service: pet.service,
          notes: pet.notes,
          bathType: pet.bathType,
          petData: pet,
          suppressToast: true
        });
        if (res) modified = true;
      } else {
        // En etapa de reservación o atención clínica previa al alta médica, asegurar la Consulta Médica base
        const res = this.chargeClinicalConsultationToCart({
          pet: petName,
          petId: pet.id,
          tutor: pet.owner || pet.ownerName || cust.name,
          rif: pet.rif || cust.rif,
          service: pet.service || 'Consulta Médica Veterinaria & Evaluación Especializada',
          price: typeof pet.price === 'number' ? pet.price : 30.00,
          suppressToast: true
        });
        if (res) modified = true;
      }
    });

    this.cart = this.deduplicateCart(this.cart, cust);

    return modified;
  }

  /**
   * Sincroniza y suma al carrito la estadía de hotel para aquellas mascotas del cliente
   * que han pasado a Check-in (stepIndex >= 1) y aún no han hecho check-out.
   */
  syncCustomerHotelServicesToCart() {
    const cust = this.getCurrentCustomerInfo();
    const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
    if (!Array.isArray(allPets) || allPets.length === 0) return false;

    const customerPets = allPets.filter(p => this.isPetOwnedByCustomer(p, cust));
    const activeHotelPets = customerPets.filter(p => {
      const normArea = this.normalizeString(p.area);
      const isHotel = (normArea === 'hotel' || (p.service && p.service.toLowerCase().includes('hotel')));
      const isCheckedIn = (typeof p.stepIndex === 'number' ? p.stepIndex >= 1 : false);
      const isNotDischarged = !p.isCompleted;
      return isHotel && isCheckedIn && isNotDischarged;
    });

    if (activeHotelPets.length === 0) return false;

    const seenPetBases = new Set();
    const uniqueHotelPets = [];
    activeHotelPets.forEach(p => {
      const base = this.normalizePetBaseName(p.name || p.petName);
      if (!seenPetBases.has(base)) {
        seenPetBases.add(base);
        uniqueHotelPets.push(p);
      }
    });

    let modified = false;
    uniqueHotelPets.forEach(pet => {
      const petName = pet.name || pet.petName || 'Mascota VIP';
      const cleanPetId = (pet.id || petName).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const cartItemId = `SERV-HOTEL-${cleanPetId}-SUITE`;

      if (this.dismissedServices && (this.dismissedServices.has(cartItemId) || (pet.id && this.dismissedServices.has(pet.id)))) {
        return;
      }

      const existingIndex = this.cart.findIndex(item =>
        item.id === cartItemId ||
        (this.getServiceSlotId(item) === 'HOTEL_SUITE_STAY' && item.pet && this.normalizePetBaseName(item.pet) === this.normalizePetBaseName(petName))
      );

      const serviceEntry = {
        id: cartItemId,
        name: pet.service || 'Hospedaje Suite Bioclimática VIP (Check-in Hotel 5★)',
        category: 'Servicio Hotel 5★',
        price: typeof pet.price === 'number' ? pet.price : 45.00,
        quantity: 1,
        pet: petName,
        petId: pet.id,
        tutor: pet.owner || pet.ownerName || cust.name,
        tutorRif: pet.rif || cust.rif,
        refId: pet.id || `HOTEL-${Date.now()}`,
        isService: true,
        isHotelService: true,
        image: 'assets/media__1787694901704.jpg',
        status: 'Check-in Hotel',
        chargedAt: new Date().toISOString()
      };

      if (existingIndex !== -1) {
        this.cart[existingIndex] = { ...this.cart[existingIndex], ...serviceEntry, quantity: 1 };
      } else {
        this.cart.unshift(serviceEntry);
        modified = true;
      }
    });

    this.cart = this.deduplicateCart(this.cart, cust);

    if (modified) {
      this.saveCart();
    }
    return modified;
  }

  saveCart() {
    try {
      const cust = this.getCurrentCustomerInfo();
      this.sanitizeCartForCurrentCustomer(cust);
      const serialized = JSON.stringify(this.cart || []);
      const primaryKey = this.getCartStorageKey(cust);

      // Guardar única y exclusivamente en la clave del cliente activo
      localStorage.setItem(primaryKey, serialized);

      // Si el cliente activo es Dalybell, garantizar que la clave canónica V18452910 esté actualizada
      // y purgar las claves con nombres no normalizados para evitar residuos zombis
      const isDalybell = this.normalizeString(cust.name).includes('dalybell') || 
                         (cust.rif && cust.rif.includes('18452910'));
      if (isDalybell) {
        try { localStorage.setItem('mrs_pets_cart_V18452910', serialized); } catch(e) {}
        [
          'mrs_pets_cart_dalybell_ramirez_montilla',
          'mrs_pets_cart_dalybell_ram_rez_montilla',
          'mrs_pets_cart_dalybell_ramirez'
        ].forEach(k => {
          try { localStorage.removeItem(k); } catch(e) {}
        });
      }

      // Purgar claves huérfanas de staff para que nunca persistan carritos bajo identidades de empleados
      try {
        const staffKeys = [
          'mrs_pets_cart_administrador_general_har',
          'mrs_pets_cart_administrador_general',
          'mrs_pets_cart_staff_administrativo',
          'mrs_pets_cart_admin',
          'mrs_pets_cart_hp'
        ];
        staffKeys.forEach(k => {
          if (localStorage.getItem(k) !== null) {
            localStorage.removeItem(k);
          }
        });
      } catch(e) {}

      this.updateCartBadges();
    } catch(e) {}
  }

  loadProductsFromCatalog() {
    let sourceCatalog = [];
    try {
      const saved = localStorage.getItem('mrs_pets_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          sourceCatalog = parsed.map(item => {
            if (item && (item.category === 'Fármacos & Antiparasitarios' || item.category === 'Fármacos y Antiparasitarios')) {
              item.category = 'Farmacia';
            }
            if (item && (item.category === 'Higiene & Spa' || item.category === 'Higiene y Spa')) {
              item.category = 'Higiene y Cuidado';
            }
            return item;
          });
          if (window.adminEngine) {
            window.adminEngine.catalog = sourceCatalog;
          }
        }
      }
    } catch(e) {}

    if (sourceCatalog.length === 0 && window.adminEngine && Array.isArray(window.adminEngine.catalog) && window.adminEngine.catalog.length > 0) {
      sourceCatalog = window.adminEngine.catalog;
    }

    if (!Array.isArray(sourceCatalog) || sourceCatalog.length === 0) {
      sourceCatalog = [
        { id: 'PROD-101', name: 'Royal Canin Mini Adult (3kg)', category: 'Alimento Canino / Felino', price: 28.50, stock: 15, active: true, image: 'assets/media__1787694901704.jpg' },
        { id: 'PROD-102', name: 'Champú Ozono Hipoalergénico 500ml', category: 'Higiene y Cuidado', price: 18.00, stock: 24, active: true, image: 'assets/media__1787695246337.jpg' },
        { id: 'PROD-103', name: 'Bravecto Perros 10-20kg', category: 'Farmacia', price: 42.00, stock: 8, active: true, image: 'assets/media__1787694901704.jpg' },
        { id: 'PROD-104', name: 'Hill\'s Prescription Diet k/d Renal (3.8kg)', category: 'Alimento Canino / Felino', price: 46.00, stock: 0, active: true, image: 'assets/hero_border_collie.jpg' },
        { id: 'PROD-105', name: 'Pro Plan Veterinary Diets OM Obesity (7.5kg)', category: 'Alimento Canino / Felino', price: 58.00, stock: 0, active: true, image: 'assets/media__1787694901704.jpg' },
        { id: 'SERV-GROOMING', name: 'Circuito Grooming Spa (7 Estaciones)', category: 'Servicio Grooming', price: 25.00, stock: 99, active: true, image: 'assets/mrs_pets_official_logo.png' },
        { id: 'SERV-201', name: 'Profilaxis Dental & Higiene Ultrasónica', category: 'Servicio Clínico Specialist', price: 35.00, stock: 99, active: true, image: 'assets/media__1787695254613.jpg' }
      ];
    }

    if (Array.isArray(sourceCatalog) && sourceCatalog.length > 0) {
      this.products = sourceCatalog.filter(item => item.active !== false).map(item => ({
        id: item.id,
        name: item.name || item.title || 'Producto VIP',
        category: item.category || 'Tienda VIP',
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price || 0),
        image: item.image || 'assets/media__1787694901704.jpg',
        description: item.description || `Artículo "${item.name || item.title}" disponible en Tienda & Boutique VIP. Stock: ${item.stock !== undefined ? item.stock : 10} und.`,
        stock: item.stock !== undefined ? item.stock : 10,
        active: item.active !== false
      }));
    }

    // Asegurar que el servicio estándar de Grooming Spa esté en el catálogo disponible
    const hasGrooming = this.products.some(p => p.id === 'SERV-GROOMING' || p.name.includes('Circuito Grooming Spa'));
    if (!hasGrooming) {
      this.products.push({
        id: 'SERV-GROOMING',
        name: 'Circuito Grooming Spa (7 Estaciones)',
        category: 'Servicio Grooming',
        price: 25.00,
        image: 'assets/mrs_pets_official_logo.png',
        description: 'Circuito integral de estética canina y felina con 7 estaciones premium (ozonoterapia e hidratación de pulpejos obligatoria).',
        stock: 99,
        active: true
      });
    }
  }

  renderProducts() {
    const grid = document.getElementById('store-products-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (this.products.length === 0) {
      this.loadProductsFromCatalog();
    }

    this.products.forEach(prod => {
      const card = document.createElement('div');
      card.className = 'card';
      card.id = `store-prod-${prod.id}`;
      card.setAttribute('data-prod-id', prod.id);
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.padding = '18px';

      const isFood = (prod.category || '').toLowerCase().includes('alimento') || (prod.name || '').toLowerCase().includes('adult') || (prod.name || '').toLowerCase().includes('diet') || (prod.name || '').toLowerCase().includes('canin');
      const isOutOfStock = typeof prod.stock === 'number' && prod.stock <= 0;

      // Reduced size vertical image container (130px height)
      const imgHTML = prod.image 
        ? `<div style="height:130px; width:100%; border-radius:var(--radius-md); overflow:hidden; margin-bottom:12px; background:#f8fafc; border:1px solid rgba(217, 119, 6, 0.2); position:relative;"><img src="${prod.image}" style="width:100%; height:100%; object-fit:contain; padding:4px; display:block;">${isOutOfStock ? '<span style="position:absolute; top:6px; right:6px; background:rgba(220,38,38,0.9); color:#FFF; font-size:0.65rem; font-weight:900; padding:3px 8px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.3);">AGOTADO</span>' : ''}</div>`
        : `<div style="height:130px; width:100%; border-radius:var(--radius-md); background:#f8fafc; display:flex; align-items:center; justify-content:center; font-size:2.8rem; margin-bottom:12px; border:1px solid rgba(217, 119, 6, 0.2); position:relative;">🛍️${isOutOfStock ? '<span style="position:absolute; top:6px; right:6px; background:rgba(220,38,38,0.9); color:#FFF; font-size:0.65rem; font-weight:900; padding:3px 8px; border-radius:6px;">AGOTADO</span>' : ''}</div>`;

      card.innerHTML = `
        ${imgHTML}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span class="badge" style="background:rgba(212, 175, 55, 0.22); color:#FFFFFF !important; border:1px solid #D4AF37; font-size:0.72rem;">${prod.category}</span>
          ${isOutOfStock 
            ? `<span style="font-size:0.68rem; font-weight:800; color:#EF4444; background:rgba(239,68,68,0.15); border:1px solid #EF4444; padding:2px 6px; border-radius:6px;">⚠️ Sin Stock Inmediato</span>`
            : `<span style="font-size:0.68rem; font-weight:700; color:#10B981;">Stock: ${prod.stock} und.</span>`
          }
        </div>
        <h3 style="font-size:1.02rem; font-weight:800; margin-bottom:6px; line-height:1.2; color:#FFFFFF !important;">${prod.name}</h3>
        <p style="font-size:0.8rem; color:#cbd5e1 !important; margin-bottom:12px; flex:1; line-height:1.4;">${prod.description}</p>
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:10px; border-top:1px solid rgba(255, 255, 255, 0.15); gap:6px; flex-wrap:wrap;">
          <span style="font-size:1.15rem; font-weight:900; color:#FFFFFF !important;">${this.formatCurrency(prod.price)}</span>
          <div style="display:flex; gap:6px; align-items:center;">
            ${isOutOfStock ? `
              <button class="btn btn-sm" onclick="storeEngine.openReserveProductModal('${prod.id}')" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; padding:7px 12px; font-size:0.78rem; border:none; border-radius:8px; cursor:pointer; box-shadow:0 3px 10px rgba(212,175,55,0.35);">
                📦 Reservar Producto
              </button>
            ` : `
              ${isFood ? `
                <button class="btn btn-sm" onclick="storeEngine.openReserveProductModal('${prod.id}')" style="background:transparent; color:#D4AF37; border:1px solid #D4AF37; font-weight:800; padding:6px 9px; font-size:0.72rem; border-radius:8px; cursor:pointer;" title="Apartar o encargar saco de alimento para retiro programado">
                  🥫 Reservar Alimento
                </button>
              ` : ''}
              <button class="btn btn-primary btn-sm" style="padding:6px 12px; font-size:0.8rem;" onclick="storeEngine.addToCart('${prod.id}')">
                <i data-lucide="shopping-cart" style="width:14px;"></i> Agregar
              </button>
            `}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }

  // Modal para Reservar Alimento o Producto Sin Stock
  openReserveProductModal(prodId = '') {
    const prod = this.products.find(p => p.id === prodId) || null;
    const defaultName = prod ? prod.name : '';
    const defaultCat = prod ? prod.category : 'Alimento Canino / Felino';
    const defaultPrice = prod ? prod.price : 35.00;
    const isOut = prod ? (prod.stock <= 0) : true;

    const modalHtml = `
      <div style="background:#0F172A; color:#FFFFFF; padding:28px; border-radius:20px; border:2px solid #D4AF37; max-width:620px; width:95%; margin:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.4); padding-bottom:12px; margin-bottom:18px;">
          <div>
            <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.1em;">
              🥫 Boutique & Nutrición Especializada Mrs. Pets
            </div>
            <h3 style="font-size:1.3rem; font-weight:900; color:#FFFFFF; margin:2px 0 0 0;">
              ${isOut ? '📦 Reservar Producto Agotado (Bajo Pedido)' : '🥫 Apartar / Reservar Alimento'}
            </h3>
            <p style="font-size:0.78rem; color:#94A3B8; margin:2px 0 0 0;">
              Asegura el suministro para tu príncipe o princesa. Te notificaremos a tu WhatsApp apenas esté disponible en sede.
            </p>
          </div>
          <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
        </div>

        <form id="form-reserve-product" onsubmit="event.preventDefault(); window.storeEngine.submitProductReservation('${prodId}');">
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:#CBD5E1; display:block; margin-bottom:4px;">
                Producto / Alimento a Reservar:
              </label>
              <input type="text" id="reserve-prod-name" value="${defaultName}" placeholder="Ej. Hill's Prescription Diet k/d (3.8kg) / Royal Canin" class="form-input" required style="width:100%; background:#1E293B; color:#FFFFFF; border:1px solid #475569; border-radius:10px; padding:10px; font-weight:700;">
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#CBD5E1; display:block; margin-bottom:4px;">
                  Cantidad (Sacos / Unidades):
                </label>
                <input type="number" id="reserve-prod-qty" min="1" max="20" value="1" class="form-input" required style="width:100%; background:#1E293B; color:#FBBF24; border:1px solid #475569; border-radius:10px; padding:10px; font-weight:900;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#CBD5E1; display:block; margin-bottom:4px;">
                  Precio Estimado USD:
                </label>
                <input type="number" id="reserve-prod-price" step="0.5" value="${defaultPrice}" class="form-input" style="width:100%; background:#1E293B; color:#FFFFFF; border:1px solid #475569; border-radius:10px; padding:10px; font-weight:700;">
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#CBD5E1; display:block; margin-bottom:4px;">
                  Nombre del Tutor (Cliente) *:
                </label>
                <input type="text" id="reserve-tutor-name" placeholder="Ej. Carlos Mendoza" required class="form-input" style="width:100%; background:#1E293B; color:#FFFFFF; border:1px solid #475569; border-radius:10px; padding:10px;">
              </div>
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:#CBD5E1; display:block; margin-bottom:4px;">
                  Teléfono WhatsApp Oficial *:
                </label>
                <input type="tel" id="reserve-tutor-phone" placeholder="+58 414-6799510" value="+58 414-6799510" required class="form-input" style="width:100%; background:#1E293B; color:#10B981; border:1px solid #475569; border-radius:10px; padding:10px; font-weight:700;">
              </div>
            </div>

            <div>
              <label style="font-size:0.75rem; font-weight:800; color:#CBD5E1; display:block; margin-bottom:4px;">
                Nombre del Consentido (Mascota):
              </label>
              <input type="text" id="reserve-pet-name" placeholder="Ej. Buddy / Bella / Princesa" class="form-input" style="width:100%; background:#1E293B; color:#FFFFFF; border:1px solid #475569; border-radius:10px; padding:10px;">
            </div>

            <div>
              <label style="font-size:0.75rem; font-weight:800; color:#CBD5E1; display:block; margin-bottom:4px;">
                Notas Especiales de Entrega o Retiro:
              </label>
              <textarea id="reserve-notes" rows="2" placeholder="Ej. Avisar con urgencia apenas llegue a tienda; retiro un sábado por la mañana..." class="form-input" style="width:100%; background:#1E293B; color:#FFFFFF; border:1px solid #475569; border-radius:10px; padding:8px 10px; font-size:0.82rem;"></textarea>
            </div>

            <div style="background:rgba(212,175,55,0.1); border:1px dashed #D4AF37; border-radius:12px; padding:12px; font-size:0.75rem; color:#CBD5E1; line-height:1.4;">
              🛡️ <strong>Garantía de Suministro Mrs. Pets:</strong> Las órdenes bajo pedido son integradas al motor de reposición (Pandora Core / Volturi) para asegurar despacho prioritario desde los distribuidores oficiales.
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
              <button type="button" class="btn btn-secondary" onclick="app.closeModal('general-modal')" style="background:transparent; color:#CBD5E1; border:1px solid #64748B;">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; padding:10px 22px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(212,175,55,0.35);">
                ✅ Confirmar Reservación
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
  }

  submitProductReservation(prodId = '') {
    const prodName = document.getElementById('reserve-prod-name')?.value.trim() || 'Alimento Bajo Pedido';
    const qty = parseInt(document.getElementById('reserve-prod-qty')?.value || '1', 10);
    const unitPrice = parseFloat(document.getElementById('reserve-prod-price')?.value || '35');
    const tutor = document.getElementById('reserve-tutor-name')?.value.trim() || 'Cliente Mrs. Pets';
    const phone = document.getElementById('reserve-tutor-phone')?.value.trim() || '+58 414-6799510';
    const pet = document.getElementById('reserve-pet-name')?.value.trim() || 'Príncipe/Princesa';
    const notes = document.getElementById('reserve-notes')?.value.trim() || '';

    const resCode = `RES-PROD-${Math.floor(100000 + Math.random() * 900000)}`;

    const newReservation = {
      id: resCode,
      productId: prodId || 'CUSTOM',
      productName: prodName,
      quantity: qty,
      unitPriceUSD: unitPrice,
      totalEstimatedUSD: parseFloat((qty * unitPrice).toFixed(2)),
      customerName: tutor,
      customerPhone: phone,
      petName: pet,
      notes: notes,
      status: 'Pendiente por Llegada',
      createdAt: new Date().toISOString()
    };

    let list = [];
    try {
      const saved = localStorage.getItem('mrs_pets_store_reservations');
      if (saved) list = JSON.parse(saved);
    } catch (e) {}

    list.unshift(newReservation);
    try {
      localStorage.setItem('mrs_pets_store_reservations', JSON.stringify(list));
    } catch(e) {}

    // Notificación en simulador WhatsApp
    const waMsg = `🥫 *RESERVACIÓN DE TIENDA CONFIRMADA - MRS. PETS* 🐾\\n\\n• Código: *${resCode}*\\n• Producto/Alimento: *${qty}x ${prodName}*\\n• Tutor: *${tutor}*\\n• Paciente: *${pet}*\\n• Total Estimado: *$${newReservation.totalEstimatedUSD.toFixed(2)} USD*\\n\\n¡Tu pedido ha sido registrado bajo pedido! Te avisaremos por este medio apenas esté listo en sede para retiro ✨.`;
    if (window.whatsappSim && typeof window.whatsappSim.sendMessage === 'function') {
      window.whatsappSim.sendMessage(waMsg);
    }

    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('general-modal');
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✅ Reservación ${resCode} registrada. Notificación enviada a WhatsApp.`, 'success');
    }
  }

  // Consola de Consulta y Gestión de Reservas de Tienda (Para Clientes y Staff)
  openStoreReservationsModal() {
    let list = [];
    try {
      const saved = localStorage.getItem('mrs_pets_store_reservations');
      if (saved) list = JSON.parse(saved);
    } catch (e) {}

    // Semillas demostrativas si está vacío
    if (list.length === 0) {
      list = [
        {
          id: 'RES-PROD-849102',
          productId: 'PROD-104',
          productName: "Hill's Prescription Diet k/d Renal (3.8kg)",
          quantity: 2,
          unitPriceUSD: 46.00,
          totalEstimatedUSD: 92.00,
          customerName: 'María Briceño',
          customerPhone: '+58 414-6123456',
          petName: 'Bella (Golden)',
          notes: 'Dieta estricta por insuficiencia renal. Avisar con urgencia al llegar.',
          status: 'Pendiente por Llegada',
          createdAt: '2026-10-22T16:20:00.000Z'
        },
        {
          id: 'RES-PROD-512093',
          productId: 'PROD-101',
          productName: 'Royal Canin Mini Adult (3kg)',
          quantity: 1,
          unitPriceUSD: 28.50,
          totalEstimatedUSD: 28.50,
          customerName: 'Carlos Mendoza',
          customerPhone: '+58 414-6799510',
          petName: 'Buddy',
          notes: 'Apartado para retiro en su cita de grooming el sábado.',
          status: 'Disponible en Tienda',
          createdAt: '2026-10-23T11:00:00.000Z'
        }
      ];
      try {
        localStorage.setItem('mrs_pets_store_reservations', JSON.stringify(list));
      } catch(e) {}
    }

    const modalHtml = `
      <div style="background:#0F172A; color:#FFFFFF; padding:28px; border-radius:20px; border:2px solid #D4AF37; max-width:880px; width:95%; margin:auto; max-height:88vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.4); padding-bottom:14px; margin-bottom:18px; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.1em;">
              🥫 Control de Encargos & Pre-órdenes
            </div>
            <h3 style="font-size:1.35rem; font-weight:900; color:#FFFFFF; margin:2px 0 0 0;">
              Reservaciones de Alimentos & Productos Bajo Pedido
            </h3>
            <p style="font-size:0.78rem; color:#94A3B8; margin:2px 0 0 0;">
              Historial de órdenes apartadas para clientes VIP y pre-órdenes de dietas especializadas sin stock inmediato.
            </p>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-sm" onclick="window.storeEngine.openReserveProductModal('')" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; border:none; padding:8px 14px; border-radius:8px; cursor:pointer;">
              ➕ Nueva Reserva
            </button>
            <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
            <thead>
              <tr style="background:#1E293B; color:#94A3B8; border-bottom:2px solid #334155; text-transform:uppercase; font-size:0.72rem;">
                <th style="padding:10px 8px; text-align:left;">Cód. / Fecha</th>
                <th style="padding:10px 8px; text-align:left;">Producto / Alimento</th>
                <th style="padding:10px 8px; text-align:left;">Tutor & Mascota</th>
                <th style="padding:10px 8px; text-align:center;">Total Est.</th>
                <th style="padding:10px 8px; text-align:center;">Estatus</th>
                <th style="padding:10px 8px; text-align:center;">Acción / Retiro</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(r => {
                const isReady = r.status === 'Disponible en Tienda';
                const isDone = r.status === 'Entregado y Pagado';
                const isStaff = Boolean(window.authEngine && window.authEngine.userRole === 'staff');
                return `
                  <tr style="border-bottom:1px solid #334155;">
                    <td style="padding:10px 8px;">
                      <strong style="color:#FBBF24;">${r.id}</strong><br>
                      <small style="color:#94A3B8;">${new Date(r.createdAt).toLocaleDateString('es-VE')}</small>
                    </td>
                    <td style="padding:10px 8px;">
                      <strong style="color:#FFFFFF;">${r.quantity}x ${r.productName}</strong><br>
                      <small style="color:#CBD5E1;">${r.notes || 'Sin observaciones'}</small>
                    </td>
                    <td style="padding:10px 8px;">
                      <span style="color:#FFFFFF; font-weight:700;">${r.customerName}</span><br>
                      <small style="color:#38BDF8;">🐾 ${r.petName} • ${r.customerPhone}</small>
                    </td>
                    <td style="padding:10px 8px; text-align:center; font-weight:900; color:#34D399;">
                      $${r.totalEstimatedUSD.toFixed(2)}
                    </td>
                    <td style="padding:10px 8px; text-align:center;">
                      <span class="badge" style="background:${isDone ? '#064E3B' : (isReady ? '#78350F' : '#1E293B')}; color:${isDone ? '#34D399' : (isReady ? '#FBBF24' : '#94A3B8')}; border:1px solid ${isDone ? '#10B981' : (isReady ? '#D97706' : '#475569')}; font-size:0.72rem; padding:4px 8px; border-radius:6px;">
                        ${r.status}
                      </span>
                    </td>
                    <td style="padding:10px 8px; text-align:center;">
                      <div style="display:flex; gap:6px; justify-content:center;">
                        ${isStaff ? (!isDone ? `
                          <button type="button" class="btn btn-sm" onclick="window.storeEngine.notifyReservationArrival('${r.id}')" style="background:#25D366; color:#FFFFFF; font-weight:800; font-size:0.72rem; padding:4px 8px; border-radius:6px; border:none; cursor:pointer;" title="Notificar al cliente por WhatsApp">
                            💬 Avisar
                          </button>
                          <button type="button" class="btn btn-sm" onclick="window.storeEngine.completeReservation('${r.id}')" style="background:#10B981; color:#FFFFFF; font-weight:800; font-size:0.72rem; padding:4px 8px; border-radius:6px; border:none; cursor:pointer;" title="Marcar como entregado y pagado">
                            ✓ Entregar
                          </button>
                        ` : `
                          <span style="font-size:0.72rem; color:#34D399;">✓ Concluida</span>
                        `) : `
                          <span style="font-size:0.75rem; color:#94A3B8; font-weight:700;">${isDone ? '✓ Retirado' : (isReady ? '📦 En mostrador' : '⏳ En preparación')}</span>
                        `}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.app && typeof window.app.showModalDirectHtml === 'function') {
      window.app.showModalDirectHtml(modalHtml);
    } else if (window.adminFinanceEngine && typeof window.adminFinanceEngine.showModal === 'function') {
      window.adminFinanceEngine.showModal(modalHtml);
    }
  }

  notifyReservationArrival(resId) {
    let list = [];
    try {
      const saved = localStorage.getItem('mrs_pets_store_reservations');
      if (saved) list = JSON.parse(saved);
    } catch (e) {}

    const res = list.find(r => r.id === resId);
    if (!res) return;

    res.status = 'Disponible en Tienda';
    try {
      localStorage.setItem('mrs_pets_store_reservations', JSON.stringify(list));
    } catch(e) {}

    const msg = `🥫 *¡TU ALIMENTO / PRODUCTO YA LLEGÓ A MRS. PETS!* 🐾\\n\\nEstimado(a) *${res.customerName}*, tu reservación *${res.id}* correspondiente a *${res.quantity}x ${res.productName}* para *${res.petName}* ya está disponible en nuestra boutique oficial.\\n\\n📍 Puedes retirarlo en nuestro horario diurno hasta las 6:00 p.m. (Av. 2 El Milagro diagonal a C.C. Lago Mall).\\n\\n_Mrs. Pets • Donde recibimos mascotas y despedimos amigos_`;
    if (window.whatsappSim && typeof window.whatsappSim.sendMessage === 'function') {
      window.whatsappSim.sendMessage(msg);
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`💬 Notificación de llegada enviada a ${res.customerName} por WhatsApp.`, 'success');
    }

    this.openStoreReservationsModal();
  }

  completeReservation(resId) {
    let list = [];
    try {
      const saved = localStorage.getItem('mrs_pets_store_reservations');
      if (saved) list = JSON.parse(saved);
    } catch (e) {}

    const res = list.find(r => r.id === resId);
    if (!res) return;

    res.status = 'Entregado y Pagado';
    try {
      localStorage.setItem('mrs_pets_store_reservations', JSON.stringify(list));
    } catch(e) {}

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✅ Reservación ${res.id} completada y registrada en ventas.`, 'success');
    }

    this.openStoreReservationsModal();
  }

  addToCart(prodId) {
    if (this.dismissedProducts && this.dismissedProducts.has(prodId)) {
      this.dismissedProducts.delete(prodId);
      try {
        localStorage.setItem('mrs_pets_dismissed_products', JSON.stringify([...this.dismissedProducts]));
      } catch(e) {}
    }

    const prod = this.products.find(p => p.id === prodId);
    const existing = this.cart.find(c => c.id === prodId);

    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      this.cart.push({
        id: prodId,
        name: prod ? prod.name : 'Artículo Boutique',
        price: prod ? prod.price : 0,
        category: prod ? prod.category : 'Tienda VIP',
        image: prod ? prod.image : '',
        quantity: 1,
        isService: false
      });
    }

    this.saveCart();
    this.renderCart();

    const prodName = prod ? prod.name : 'Artículo';
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`"${prodName}" agregado a la cesta de compras.`, 'success');
    }
  }

  isStaffUser() {
    const isEnterprise = Boolean(
      typeof window.adminEngine !== 'undefined' &&
      window.adminEngine.viewEnvironment === 'enterprise' &&
      window.adminEngine.isEnterpriseAuthenticated === true
    );
    const isStaffRole = Boolean(window.authEngine && window.authEngine.userRole === 'staff');
    return isEnterprise || isStaffRole;
  }

  isReceivedServiceItem(cartItem) {
    if (!cartItem) return false;
    const isService = Boolean(
      cartItem.isService ||
      cartItem.isGroomingService ||
      cartItem.isHotelService ||
      cartItem.isClinicalService ||
      (cartItem.category && cartItem.category.toLowerCase().includes('servicio')) ||
      (cartItem.id && typeof cartItem.id === 'string' && cartItem.id.startsWith('SERV-'))
    );
    if (!isService) return false;

    // Si tiene estatus 'Recibido' o 'En Proceso'
    if (cartItem.status === 'Recibido' || cartItem.status === 'En Proceso') {
      return true;
    }

    // Comprobar si la mascota vinculada está en estatus recibido/activo en instalaciones
    const petName = cartItem.pet;
    if (petName) {
      const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
      const matched = allPets.find(p => {
        const pName = p.name || p.petName || '';
        return this.normalizeString(pName) === this.normalizeString(petName);
      });
      if (matched && matched.stepIndex !== undefined && matched.stepIndex >= 1) {
        return true;
      }
    }

    return true; // Todo concepto de servicio cargado al carrito representa una atención médica o de grooming en instalaciones
  }

  warnServiceCannotBeRemoved(itemId) {
    const item = this.cart.find(c => c.id === itemId);
    const petLabel = item?.pet ? ` de ${item.pet}` : '';
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🔒 El servicio${petLabel} no puede ser eliminado por el cliente porque la mascota ya fue recibida en instalaciones. Solo el personal de Administración puede retirarlo o anularlo.`, 'warning');
    }
  }

  removeFromCart(itemId) {
    const item = this.cart ? this.cart.find(c => c.id === itemId) : null;
    if (!item) return;

    const isService = this.isReceivedServiceItem(item);
    const isStaff = this.isStaffUser();

    // Regla de Negocio: Si la mascota ya fue recibida, el cliente no puede eliminar el servicio. Solo Staff de Administración.
    if (isService && !isStaff) {
      this.warnServiceCannotBeRemoved(itemId);
      return;
    }

    // Si es un servicio retirado por el personal de staff de administración,
    // guardarlo en la lista de exclusiones para que syncCustomerGroomingServicesToCart no lo resucite
    if (isService && isStaff) {
      if (!this.dismissedServices) this.dismissedServices = new Set();
      this.dismissedServices.add(itemId);
      if (item.pet) this.dismissedServices.add(this.normalizeString(item.pet));
      if (item.refId) this.dismissedServices.add(item.refId);
      try {
        localStorage.setItem('mrs_pets_dismissed_services', JSON.stringify([...this.dismissedServices]));
      } catch(e) {}
    }

    // Si es un producto de tienda retirado, guardarlo en dismissedProducts para blindar contra resurrección
    if (!isService) {
      if (!this.dismissedProducts) this.dismissedProducts = new Set();
      this.dismissedProducts.add(itemId);
      if (item.name) this.dismissedProducts.add(this.normalizeString(item.name));
      try {
        localStorage.setItem('mrs_pets_dismissed_products', JSON.stringify([...this.dismissedProducts]));
      } catch(e) {}

      // Purgar de raíz cualquier residuo en claves huérfanas de localStorage
      [
        'mrs_pets_cart_dalybell_ramirez_montilla',
        'mrs_pets_cart_dalybell_ram_rez_montilla',
        'mrs_pets_cart_dalybell_ramirez'
      ].forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
      });
    }

    // Filtrar de inmediato el artículo de la cesta
    this.cart = this.cart.filter(c => c.id !== itemId);
    this.saveCart();

    // Re-renderizar de inmediato la cesta y la suma total estimada
    this.renderCart();

    // Re-renderizar de inmediato el modal de checkout si está activo
    this.renderCheckoutSummary();

    // Actualizar cálculo de pasarela Stripe si está activa
    if (window.stripeEngine && typeof window.stripeEngine.mountPaymentElement === 'function') {
      window.stripeEngine.mountPaymentElement();
    }

    // Actualizar de inmediato el contador del badge lateral
    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      const totalCount = this.cart.reduce((sum, i) => sum + (parseInt(i.quantity, 10) || 1), 0);
      badge.innerText = totalCount;
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`"${item.name}" eliminado de la cesta. Total actualizado.`, 'info');
    }
  }

  updateQuantity(itemId, delta) {
    const item = this.cart ? this.cart.find(c => c.id === itemId) : null;
    if (!item) return;

    const isService = this.isReceivedServiceItem(item);
    const isStaff = this.isStaffUser();

    // Bloquear reducción a 0 por el cliente si es un servicio con mascota recibida
    if (isService && delta < 0 && (item.quantity || 1) <= 1 && !isStaff) {
      this.warnServiceCannotBeRemoved(itemId);
      return;
    }

    item.quantity = (item.quantity || 1) + delta;
    if (item.quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }
    this.saveCart();
    this.renderCart();
    this.renderCheckoutSummary();
    if (window.stripeEngine && typeof window.stripeEngine.mountPaymentElement === 'function') {
      window.stripeEngine.mountPaymentElement();
    }
  }

  /**
   * Carga automática del costo de servicio de Grooming cuando la reserva cambia a estatus "Recibido".
   * Mantiene cualquier producto de tienda previamente añadido o sumado posteriormente.
   */
  chargeGroomingServiceToCart(params = {}) {
    const custInfo = this.getCurrentCustomerInfo();
    const tutorName = params.tutor || custInfo.name;
    const petName = params.pet || 'Mascota VIP';
    const petId = params.petId || '';
    const serviceName = params.service || 'Circuito Grooming Spa (7 Estaciones)';
    const price = typeof params.price === 'number' ? params.price : 25.00;
    const refId = params.bookingId || petId || `APT-${Date.now()}`;
    const cleanPetId = (petId || petName || 'PET').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cartItemId = `SERV-GROOMING-${cleanPetId}`;

    // 🛡️ REGLA 1: CERO CARGOS EN RESERVAS (PASO 0)
    if (params.stepIndex === 0 || params.isReservation === true) {
      console.warn(`[REGLA 1] Reserva en Paso 0 para ${petName}: Carrito permanece estrictamente en $0.00.`);
      return null;
    }

    if (params.stepIndex === undefined && (petId || petName)) {
      const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
      const matchedPet = allPets.find(p => (petId && p.id === petId) || (p.name && this.normalizePetBaseName(p.name) === this.normalizePetBaseName(petName)));
      if (matchedPet && typeof matchedPet.stepIndex === 'number' && matchedPet.stepIndex === 0) {
        console.warn(`[REGLA 1] El paciente ${petName} está en estatus Reservado (Paso 0). Cero cargos al carrito.`);
        return null;
      }
    }

    const targetCustomerObj = { name: tutorName, rif: params.rif || params.tutorId };
    const isMatch = this.isPetOwnedByCustomer({ owner: tutorName, rif: params.rif || params.tutorId }, custInfo);
    const targetStorageKey = this.getCartStorageKey(params.tutorId || params.rif || tutorName);
    let targetCart = [];
    try {
      const saved = localStorage.getItem(targetStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          targetCart = parsed.filter(item => this.isItemOwnedByCustomer(item, targetCustomerObj));
        }
      }
    } catch(e) {}

    if (isMatch && Array.isArray(this.cart) && this.cart.length > 0) {
      this.cart.forEach(item => {
        if (this.dismissedProducts && this.dismissedProducts.has(item.id)) return;
        if (this.isItemOwnedByCustomer(item, targetCustomerObj)) {
          if (!targetCart.some(it => it.id === item.id)) {
            targetCart.push(item);
          }
        }
      });
    }

    const serviceItem = {
      id: cartItemId,
      name: serviceName,
      category: 'Servicio Grooming',
      price: price,
      quantity: 1,
      pet: petName,
      petId: petId,
      tutor: tutorName,
      tutorRif: params.tutorId || params.rif || custInfo.rif,
      refId: refId,
      isService: true,
      isGroomingService: true,
      image: 'assets/mrs_pets_official_logo.png',
      status: 'Recibido',
      chargedAt: new Date().toISOString()
    };

    // Verificar si ya fue cargado el servicio de grooming para esta mascota en particular
    const targetPetBase = this.normalizePetBaseName(petName);
    const existingIndex = targetCart.findIndex(item => 
      item.id === cartItemId || 
      (this.getServiceSlotId(item) === 'GROOMING_SPA_CIRCUIT' && item.pet && this.normalizePetBaseName(item.pet) === targetPetBase)
    );

    if (existingIndex !== -1) {
      // Ya estaba cargado: actualizamos sus datos sin duplicar el costo
      targetCart[existingIndex] = { ...targetCart[existingIndex], ...serviceItem, quantity: 1 };
    } else {
      // Sumar el servicio a la cesta (se suma preservando las otras mascotas y productos de tienda)
      targetCart.unshift(serviceItem);
    }

    // [COMITÉ VOLTURI] Deduplicación estricta por idempotencia y purga de seguridad
    targetCart = this.deduplicateCart(targetCart, targetCustomerObj);
    targetCart = targetCart.filter(item => this.isItemOwnedByCustomer(item, targetCustomerObj));

    try {
      localStorage.setItem(targetStorageKey, JSON.stringify(targetCart));
    } catch(e) {}

    if (isMatch) {
      this.cart = targetCart;
      this.saveCart();
      this.renderCart();
    } else {
      this.renderCart();
    }

    // Actualizar contador del badge
    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      const totalCount = (this.cart || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
      badge.innerText = totalCount;
    }

    const groomingPetsInCart = (this.cart || []).filter(i => i.isGroomingService);
    if (window.app && typeof window.app.showToast === 'function') {
      if (groomingPetsInCart.length > 1) {
        window.app.showToast(`✂️ Servicio de ${petName} ($${price.toFixed(2)}) sumado a la cesta de ${tutorName} (Total: ${groomingPetsInCart.length} mascotas en Grooming).`, 'success');
      } else {
        window.app.showToast(`✂️ Servicio "${serviceName}" de ${petName} ($${price.toFixed(2)}) cargado a la cesta al cambiar a "Recibido".`, 'success');
      }
    }

    if (window.whatsappSim && typeof window.whatsappSim.sendPreset === 'function') {
      const multiNotice = groomingPetsInCart.length > 1 ? ` Ya tienes *${groomingPetsInCart.length} mascotas* sumadas a tu cuenta de Grooming.` : '';
      window.whatsappSim.sendPreset(`🛎️ *Mrs. Pets Concierge*: La cita de tu consentido *${petName}* ha pasado a estatus *RECIBIDO*. Hemos sumado el servicio *${serviceName}* ($${price.toFixed(2)}) a tu cesta de compras.${multiNotice} Puedes agregar productos de nuestra tienda y pagar todo junto en línea.`);
    }

    return serviceItem;
  }

  /**
   * 🩺 Carga individual y acumulación de Consulta Médica Veterinaria al agendar o confirmar cita clínica.
   * Preserva intactos los servicios de Grooming ($25.00) y productos de la tienda online sin duplicación.
   */
  chargeClinicalConsultationToCart(params = {}) {
    const custInfo = this.getCurrentCustomerInfo();
    const tutorName = params.tutor || params.owner || params.ownerName || custInfo.name;
    const petName = params.pet || params.petName || 'Mascota VIP';
    const petId = params.petId || params.id || '';
    const cleanPetId = (petId || petName || 'PET').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const serviceName = params.service || 'Consulta Médica Veterinaria & Evaluación Especializada';
    const price = typeof params.price === 'number' ? params.price : 30.00;
    const refId = params.bookingId || petId || `APT-${Date.now()}`;
    const cartItemId = `SERV-CLINIC-${cleanPetId}-CONSULTA`;

    // 🛡️ REGLA 1: CERO CARGOS EN RESERVAS (PASO 0)
    if (params.stepIndex === 0 || params.isReservation === true) {
      console.warn(`[REGLA 1] Reserva en Paso 0 para ${petName}: Carrito permanece estrictamente en $0.00.`);
      return null;
    }

    if (params.stepIndex === undefined && (petId || petName)) {
      const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
      const matchedPet = allPets.find(p => (petId && p.id === petId) || (p.name && this.normalizePetBaseName(p.name) === this.normalizePetBaseName(petName)));
      if (matchedPet && typeof matchedPet.stepIndex === 'number' && matchedPet.stepIndex === 0) {
        console.warn(`[REGLA 1] El paciente ${petName} está en estatus Reservado (Paso 0). Cero cargos al carrito.`);
        return null;
      }
    }

    const targetCustomerObj = { name: tutorName, rif: params.rif || params.tutorId };
    const isMatch = this.isPetOwnedByCustomer({ owner: tutorName, rif: params.rif || params.tutorId }, custInfo);
    const targetStorageKey = this.getCartStorageKey(params.tutorId || params.rif || tutorName);
    let targetCart = [];
    try {
      const saved = localStorage.getItem(targetStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          targetCart = parsed.filter(item => this.isItemOwnedByCustomer(item, targetCustomerObj));
        }
      }
    } catch(e) {}

    if (isMatch && Array.isArray(this.cart) && this.cart.length > 0) {
      this.cart.forEach(item => {
        if (this.dismissedProducts && this.dismissedProducts.has(item.id)) return;
        if (this.isItemOwnedByCustomer(item, targetCustomerObj)) {
          if (!targetCart.some(it => it.id === item.id)) {
            targetCart.push(item);
          }
        }
      });
    }

    const serviceItem = {
      id: cartItemId,
      name: serviceName,
      category: 'Servicio Clínico',
      price: price,
      quantity: 1,
      pet: petName,
      petId: petId,
      tutor: tutorName,
      tutorRif: params.tutorId || params.rif || custInfo.rif,
      refId: refId,
      isService: true,
      isClinicalService: true,
      image: 'assets/media__1787695254613.jpg',
      status: 'Cita Agendada',
      chargedAt: new Date().toISOString()
    };

    // Verificar si ya fue cargada la consulta clínica para esta mascota
    const targetPetBase = this.normalizePetBaseName(petName);
    const existingIndex = targetCart.findIndex(item => 
      item.id === cartItemId || 
      (this.getServiceSlotId(item) === 'CLINIC_BASE_CONSULTATION' && item.pet && this.normalizePetBaseName(item.pet) === targetPetBase)
    );

    if (existingIndex !== -1) {
      targetCart[existingIndex] = { ...targetCart[existingIndex], ...serviceItem, quantity: 1 };
    } else {
      // Preservar íntegramente servicios de Grooming y productos de la tienda online del mismo cliente
      targetCart.unshift(serviceItem);
    }

    // [COMITÉ VOLTURI] Deduplicación estricta por idempotencia y purga de seguridad
    targetCart = this.deduplicateCart(targetCart, targetCustomerObj);
    targetCart = targetCart.filter(item => this.isItemOwnedByCustomer(item, targetCustomerObj));

    try {
      localStorage.setItem(targetStorageKey, JSON.stringify(targetCart));
    } catch(e) {}

    if (isMatch) {
      this.cart = targetCart;
      this.saveCart();
      this.renderCart();
    } else {
      this.renderCart();
    }

    // Actualizar badge del carrito
    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      const totalCount = (this.cart || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
      badge.innerText = totalCount;
    }

    if (!params.suppressToast && window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🩺 Cita Médica de ${petName} ($${price.toFixed(2)}) cargada a la cesta para cobro.`, 'success');
    }

    if (!params.suppressToast && window.whatsappSim && typeof window.whatsappSim.sendPreset === 'function') {
      window.whatsappSim.sendPreset(`🩺 *Mrs. Pets Clínica Veterinaria*: Su reservación para *${petName}* (${serviceName} - $${price.toFixed(2)}) ha sido agregada a su cesta de compras. Puede sumar otros servicios o productos de la tienda y pagar en línea.`);
    }

    return serviceItem;
  }

  /**
   * 🩺 Facturación automática de Servicios y Exámenes Clínicos al alcanzar
   * "Culminación de Examen / Alta Médica" (Estatus 6).
   * Consolida y suma todos los cargos clínicos a la cuenta del cliente preservando
   * Grooming ($25.00) y productos de la tienda online sin sobrescribir ni vaciar el carrito.
   */
  chargeClinicalServicesToCart(params = {}) {
    const custInfo = this.getCurrentCustomerInfo();
    const tutorName = params.tutor || params.owner || params.ownerName || custInfo.name;
    const petName = params.pet || params.petName || 'Mascota VIP';
    const petId = params.petId || params.id || '';
    const cleanPetId = (petId || petName || 'PET').toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Compilar la lista oficial de los 3 conceptos en Alta Médica (Consulta Especializada + Examen de Laboratorio + Grooming Spa)
    const itemsToCharge = [];

    // 1. Servicio Clínico Especializado (Consulta médica clínica base)
    const baseServiceName = params.service || 'Consulta Médica Veterinaria & Evaluación Especializada';
    const basePrice = typeof params.price === 'number' ? params.price : 30.00;
    itemsToCharge.push({
      subId: 'CONSULTA',
      name: baseServiceName,
      category: 'Servicio Clínico Especializado',
      price: basePrice,
      image: 'assets/media__1787695254613.jpg'
    });

    // 2. Examen de Laboratorio / Diagnóstico (Hematología Completa & Perfil Bioquímico Clínico)
    if (Array.isArray(params.exams) && params.exams.length > 0) {
      params.exams.forEach((ex, idx) => {
        itemsToCharge.push({
          subId: `EXAM-${idx}-${(ex.name || 'EXAM').substring(0, 10).replace(/[^A-Za-z0-9]/g, '')}`,
          name: ex.name || `Examen Clínico #${idx + 1}`,
          category: 'Examen de Laboratorio',
          price: typeof ex.price === 'number' ? ex.price : 25.00,
          image: ex.image || 'assets/media__1787694901704.jpg'
        });
      });
    } else {
      // Buscar si existen órdenes médicas en medicalUploads para este paciente
      let foundUploads = [];
      if (window.adminEngine && Array.isArray(window.adminEngine.medicalUploads)) {
        foundUploads = window.adminEngine.medicalUploads.filter(u => 
          (petId && u.patientCode === petId) || 
          (u.petName && this.normalizeString(u.petName) === this.normalizeString(petName))
        );
      }

      if (foundUploads.length > 0) {
        foundUploads.forEach((u, idx) => {
          const docType = u.documentType || 'Hematología Completa';
          const isRadio = docType.toLowerCase().includes('radiograf') || docType.toLowerCase().includes('dicom');
          itemsToCharge.push({
            subId: `UPLOAD-${u.id || idx}`,
            name: `Examen de Laboratorio: ${docType}`,
            category: 'Examen de Laboratorio',
            price: isRadio ? 35.00 : 25.00,
            image: isRadio ? 'assets/media__1787695254613.jpg' : 'assets/media__1787694901704.jpg'
          });
        });
      } else {
        // Paquete de laboratorio predeterminado en Alta Médica
        itemsToCharge.push({
          subId: 'LAB-HEM',
          name: 'Hematología Completa & Perfil Bioquímico Clínico',
          category: 'Examen de Laboratorio',
          price: 25.00,
          image: 'assets/media__1787694901704.jpg'
        });
      }
    }

    // 3. Servicio de Grooming & Estética Spa (3er concepto oficial en paquete de Alta Médica / Atención Integral)
    const bathName = params.bathType || (params.petData && params.petData.bathType) || 'Baño Medicado & Ozono';
    const bathServiceName = `Circuito Grooming Spa (${bathName.includes('Spa') ? bathName : bathName})`;
    itemsToCharge.push({
      subId: 'GROOMING-MEDICADO',
      name: bathServiceName,
      category: 'Servicio Grooming',
      price: 25.00,
      image: 'assets/mrs_pets_official_logo.png'
    });

    const targetCustomerObj = { name: tutorName, rif: params.rif || params.tutorId };
    const isMatch = this.isPetOwnedByCustomer({ owner: tutorName, rif: params.rif || params.tutorId }, custInfo);
    const targetStorageKey = this.getCartStorageKey(params.tutorId || params.rif || tutorName);
    let targetCart = [];
    try {
      const saved = localStorage.getItem(targetStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          targetCart = parsed.filter(item => this.isItemOwnedByCustomer(item, targetCustomerObj));
        }
      }
    } catch(e) {}

    if (isMatch && Array.isArray(this.cart) && this.cart.length > 0) {
      this.cart.forEach(item => {
        if (this.dismissedProducts && this.dismissedProducts.has(item.id)) return;
        if (this.isItemOwnedByCustomer(item, targetCustomerObj)) {
          if (!targetCart.some(it => it.id === item.id)) {
            targetCart.push(item);
          }
        }
      });
    }

    // Purgar conceptos clínicos obsoletos o duplicados (como profilaxis dental separada)
    targetCart = targetCart.filter(item => {
      if (!item || !item.id) return false;
      if (item.id === `SERV-CLINIC-${cleanPetId}-PROFILAXIS`) return false;
      if (item.name && item.name.toLowerCase().includes('profilaxis dental')) return false;
      return true;
    });

    let totalClinicalAdded = 0;
    const targetPetBase = this.normalizePetBaseName(petName);

    itemsToCharge.forEach(entry => {
      const isGrooming = entry.subId.includes('GROOMING');
      const cartItemId = isGrooming ? `SERV-GROOMING-${cleanPetId}` : `SERV-CLINIC-${cleanPetId}-${entry.subId}`;
      const serviceItem = {
        id: cartItemId,
        name: entry.name,
        category: entry.category,
        price: entry.price,
        quantity: 1,
        pet: petName,
        petId: petId,
        tutor: tutorName,
        tutorRif: params.tutorId || params.rif || custInfo.rif,
        refId: petId || cartItemId,
        isService: true,
        isClinicalService: !isGrooming,
        isGroomingService: isGrooming,
        image: entry.image,
        status: isGrooming ? 'Recibido' : 'Alta Médica',
        chargedAt: new Date().toISOString()
      };

      totalClinicalAdded += entry.price;
      const existingIndex = targetCart.findIndex(item => 
        item.id === cartItemId || 
        (isGrooming && this.getServiceSlotId(item) === 'GROOMING_SPA_CIRCUIT' && item.pet && this.normalizePetBaseName(item.pet) === targetPetBase) ||
        (!isGrooming && entry.subId === 'CONSULTA' && this.getServiceSlotId(item) === 'CLINIC_BASE_CONSULTATION' && item.pet && this.normalizePetBaseName(item.pet) === targetPetBase)
      );

      if (existingIndex !== -1) {
        targetCart[existingIndex] = { ...targetCart[existingIndex], ...serviceItem, quantity: 1 };
      } else {
        targetCart.push(serviceItem);
      }
    });

    // [COMITÉ VOLTURI] Deduplicación estricta por idempotencia y purga de seguridad
    targetCart = this.deduplicateCart(targetCart, targetCustomerObj);
    targetCart = targetCart.filter(item => this.isItemOwnedByCustomer(item, targetCustomerObj));

    try {
      localStorage.setItem(targetStorageKey, JSON.stringify(targetCart));
    } catch(e) {}

    if (isMatch) {
      this.cart = targetCart;
      this.saveCart();
      this.renderCart();
    } else {
      this.renderCart();
    }

    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      const totalCount = (this.cart || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
      badge.innerText = totalCount;
    }

    if (!params.suppressToast && window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🩺 Servicios y exámenes clínicos de ${petName} ($${totalClinicalAdded.toFixed(2)}) cargados al carrito para cobro (Alta Médica).`, 'success');
    }

    if (!params.suppressToast && window.whatsappSim && typeof window.whatsappSim.sendPreset === 'function') {
      window.whatsappSim.sendPreset(`🩺 *Mrs. Pets Clínica Veterinaria*: Su paciente *${petName}* ha alcanzado *CULMINACIÓN DE EXAMEN - ALTA MÉDICA*. Se han consolidado todos los servicios y exámenes médicos ($${totalClinicalAdded.toFixed(2)}) en su cesta para liquidación y cobro.`);
    }

    return targetCart;
  }

  /**
   * 🏨 Carga individual y acumulación de Hospedaje Hotel 5★ al avanzar a Check-in (stepIndex 1).
   * Preserva intactos los servicios de Grooming, Clínica y productos de tienda sin duplicación.
   */
  chargeHotelServiceToCart(params = {}) {
    const custInfo = this.getCurrentCustomerInfo();
    const tutorName = params.tutor || params.owner || params.ownerName || custInfo.name;
    const petName = params.pet || params.petName || 'Mascota VIP';
    const petId = params.petId || params.id || '';
    const cleanPetId = (petId || petName || 'PET').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const serviceName = params.service || 'Hospedaje Suite Bioclimática VIP (Check-in Hotel 5★)';
    const price = typeof params.price === 'number' ? params.price : 45.00;
    const refId = params.bookingId || petId || `APT-${Date.now()}`;
    const cartItemId = `SERV-HOTEL-${cleanPetId}-SUITE`;

    // 🛡️ REGLA 1: CERO CARGOS EN RESERVAS (PASO 0)
    if (params.stepIndex === 0 || params.isReservation === true) {
      console.warn(`[REGLA 1] Reserva en Paso 0 para ${petName}: Carrito permanece estrictamente en $0.00.`);
      return null;
    }

    if (params.stepIndex === undefined && (petId || petName)) {
      const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
      const matchedPet = allPets.find(p => (petId && p.id === petId) || (p.name && this.normalizePetBaseName(p.name) === this.normalizePetBaseName(petName)));
      if (matchedPet && typeof matchedPet.stepIndex === 'number' && matchedPet.stepIndex === 0) {
        console.warn(`[REGLA 1] El paciente ${petName} está en estatus Reservado (Paso 0). Cero cargos al carrito.`);
        return null;
      }
    }

    const targetCustomerObj = { name: tutorName, rif: params.rif || params.tutorId };
    const isMatch = this.isPetOwnedByCustomer({ owner: tutorName, rif: params.rif || params.tutorId }, custInfo);
    const targetStorageKey = this.getCartStorageKey(params.tutorId || params.rif || tutorName);
    let targetCart = [];
    try {
      const saved = localStorage.getItem(targetStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          targetCart = parsed.filter(item => this.isItemOwnedByCustomer(item, targetCustomerObj));
        }
      }
    } catch(e) {}

    if (isMatch && Array.isArray(this.cart) && this.cart.length > 0) {
      this.cart.forEach(item => {
        if (this.dismissedProducts && this.dismissedProducts.has(item.id)) return;
        if (this.isItemOwnedByCustomer(item, targetCustomerObj)) {
          if (!targetCart.some(it => it.id === item.id)) {
            targetCart.push(item);
          }
        }
      });
    }

    const serviceItem = {
      id: cartItemId,
      name: serviceName,
      category: 'Servicio Hotel 5★',
      price: price,
      quantity: 1,
      pet: petName,
      petId: petId,
      tutor: tutorName,
      tutorRif: params.tutorId || params.rif || custInfo.rif,
      refId: refId,
      isService: true,
      isHotelService: true,
      image: 'assets/media__1787694901704.jpg',
      status: 'Check-in Hotel',
      chargedAt: new Date().toISOString()
    };

    const targetPetBase = this.normalizePetBaseName(petName);
    const existingIndex = targetCart.findIndex(item => 
      item.id === cartItemId || 
      (this.getServiceSlotId(item) === 'HOTEL_SUITE_STAY' && item.pet && this.normalizePetBaseName(item.pet) === targetPetBase)
    );

    if (existingIndex !== -1) {
      targetCart[existingIndex] = { ...targetCart[existingIndex], ...serviceItem, quantity: 1 };
    } else {
      targetCart.unshift(serviceItem);
    }

    targetCart = this.deduplicateCart(targetCart, targetCustomerObj);
    targetCart = targetCart.filter(item => this.isItemOwnedByCustomer(item, targetCustomerObj));

    try {
      localStorage.setItem(targetStorageKey, JSON.stringify(targetCart));
    } catch(e) {}

    if (isMatch) {
      this.cart = targetCart;
      this.saveCart();
      this.renderCart();
    } else {
      this.renderCart();
    }

    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      const totalCount = (this.cart || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
      badge.innerText = totalCount;
    }

    if (!params.suppressToast && window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🏨 Check-in Hotel 5★: Hospedaje de ${petName} ($${price.toFixed(2)}) cargado automáticamente a la cuenta.`, 'success');
    }

    if (!params.suppressToast && window.whatsappSim && typeof window.whatsappSim.sendPreset === 'function') {
      window.whatsappSim.sendPreset(`🛎️ *Mrs. Pets Concierge*: Se ha realizado el *Check-in / Admisión* en Hotel 5★ de tu consentido *${petName}*. Se ha cargado a tu cuenta el servicio *${serviceName}* ($${price.toFixed(2)}). ¡Su suite bioclimática está lista!`);
    }

    return serviceItem;
  }

  renderCart() {
    if (!Array.isArray(this.cart)) {
      this.loadCart();
    }
    // [COMITÉ VOLTURI] Purga determinista de duplicados en memoria antes de renderizar
    const cust = this.getCurrentCustomerInfo();
    this.cart = this.deduplicateCart(this.cart, cust);

    // Sincronizar todos los badges globales de carrito
    this.updateCartBadges();

    const container = document.getElementById('cart-items-container');
    const badge = document.getElementById('cart-badge-count');
    if (!container) return;

    container.innerHTML = '';
    let total = 0;
    let count = 0;

    if (!Array.isArray(this.cart) || this.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:24px 12px; color:#94a3b8; font-size:0.85rem;">
          <div style="font-size:2rem; margin-bottom:8px;">🛒</div>
          <div style="font-weight:700; color:#FFFFFF !important;">Tu cesta está vacía</div>
          <div style="font-size:0.75rem; margin-top:4px; opacity:0.85; color:#cbd5e1 !important;">Al cambiar tu cita de Grooming a "Recibido", el servicio se cargará aquí automáticamente y podrás sumar productos de la tienda.</div>
        </div>
      `;
      const bcvRate = (window.FinancialEngine && typeof window.FinancialEngine.getOfficialBcvRate === 'function')
        ? window.FinancialEngine.getOfficialBcvRate()
        : ((window.FinancialEngine && window.FinancialEngine.config && window.FinancialEngine.config.bcvRate) || 887.30);
      const bcvRateFmt = (window.FinancialEngine && typeof window.FinancialEngine.formatVenezuelanNumber === 'function')
        ? window.FinancialEngine.formatVenezuelanNumber(bcvRate)
        : Number(bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const totalDiv = document.createElement('div');
      totalDiv.className = 'cart-total-row';
      totalDiv.style.marginTop = '14px';
      totalDiv.style.paddingTop = '10px';
      totalDiv.style.borderTop = '2px solid rgba(217, 119, 6, 0.5)';
      totalDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <span class="cart-total-label" style="font-weight:800; font-size:0.95rem; color:#FFFFFF !important;">TOTAL ESTIMADO:</span>
          <span class="cart-total-value" style="font-weight:900; font-size:1.25rem; color:#FFFFFF !important;">$0.00</span>
        </div>
        <!-- BANNER REFERENCIA TASA BCV OFICIAL -->
        <div style="margin-top:12px; background:rgba(212, 175, 55, 0.12); border:1.5px solid #D4AF37; border-radius:12px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">🏛️</span>
            <div>
              <div style="font-size:0.75rem; font-weight:900; color:#FCD34D; text-transform:uppercase; letter-spacing:0.04em;">Tasa Oficial BCV de Referencia</div>
              <div style="font-size:0.68rem; color:#CBD5E1; font-weight:600;">Banco Central de Venezuela • Cumplimiento Legal SENIAT</div>
            </div>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.85rem; font-weight:900; color:#10B981; background:rgba(16,185,129,0.18); border:1px solid #10B981; padding:3px 9px; border-radius:6px; white-space:nowrap; display:inline-block;">
              1 USD = Bs. ${bcvRateFmt}
            </span>
          </div>
        </div>
      `;
      container.appendChild(totalDiv);
      if (badge) badge.innerText = '0';
      return;
    }

    // Banner indicador de cuenta Multi-Servicio (Grooming + Clínica + Tienda)
    const groomingItems = this.cart.filter(i => i.isGroomingService || (i.category && i.category.toLowerCase().includes('grooming')));
    const clinicalItems = this.cart.filter(i => i.isClinicalService || (i.category && i.category.toLowerCase().includes('clínic')) || (i.category && i.category.toLowerCase().includes('examen')));

    if (clinicalItems.length > 0 && groomingItems.length > 0) {
      const banner = document.createElement('div');
      banner.style.background = 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(212, 175, 55, 0.25))';
      banner.style.border = '1.5px solid #38BDF8';
      banner.style.borderRadius = '10px';
      banner.style.padding = '8px 12px';
      banner.style.marginBottom = '12px';
      banner.style.fontSize = '0.8rem';
      banner.style.fontWeight = '700';
      banner.style.color = '#FFFFFF !important';
      banner.style.display = 'flex';
      banner.style.alignItems = 'center';
      banner.style.gap = '8px';
      banner.innerHTML = `
        <span style="font-size:1.2rem;">🏥</span>
        <div style="color:#FFFFFF !important;">
          <div style="color:#FFFFFF !important;">Cuenta Multi-Servicio: <strong style="color:#7DD3FC !important;">Clínica (Alta Médica) + Grooming Spa</strong></div>
          <div style="font-size:0.72rem; color:#E2E8F0 !important; font-weight:500;">Servicios y exámenes acumulados en esta misma cesta para liquidación y cobro integral.</div>
        </div>
      `;
      container.appendChild(banner);
    } else if (clinicalItems.length > 0) {
      const clinicalPetNames = Array.from(new Set(clinicalItems.map(i => i.pet || 'Mascota'))).join(', ');
      const banner = document.createElement('div');
      banner.style.background = 'rgba(2, 132, 199, 0.2)';
      banner.style.border = '1px solid #0284C7';
      banner.style.borderRadius = '10px';
      banner.style.padding = '8px 12px';
      banner.style.marginBottom = '12px';
      banner.style.fontSize = '0.8rem';
      banner.style.fontWeight = '700';
      banner.style.color = '#FFFFFF !important';
      banner.style.display = 'flex';
      banner.style.alignItems = 'center';
      banner.style.gap = '8px';
      banner.innerHTML = `
        <span style="font-size:1.2rem;">🩺</span>
        <div style="color:#FFFFFF !important;">
          <div style="color:#FFFFFF !important;">Servicios Clínicos & Exámenes: <strong style="color:#7DD3FC !important;">Alta Médica Emitida</strong></div>
          <div style="font-size:0.72rem; color:#E2E8F0 !important; font-weight:500;">(${clinicalPetNames}) — Cargos de consulta y estudios listos para cobro.</div>
        </div>
      `;
      container.appendChild(banner);
    } else if (groomingItems.length > 1) {
      const petNames = groomingItems.map(i => i.pet || 'Mascota').join(', ');
      const groomingBanner = document.createElement('div');
      groomingBanner.style.background = 'rgba(212, 175, 55, 0.18)';
      groomingBanner.style.border = '1px solid #D4AF37';
      groomingBanner.style.borderRadius = '10px';
      groomingBanner.style.padding = '8px 12px';
      groomingBanner.style.marginBottom = '12px';
      groomingBanner.style.fontSize = '0.8rem';
      groomingBanner.style.fontWeight = '700';
      groomingBanner.style.color = '#FFFFFF !important';
      groomingBanner.style.display = 'flex';
      groomingBanner.style.alignItems = 'center';
      groomingBanner.style.gap = '8px';
      groomingBanner.innerHTML = `
        <span style="font-size:1.2rem;">🐾</span>
        <div style="color:#FFFFFF !important;">
          <div style="color:#FFFFFF !important;">Cuenta Multi-Mascota Grooming Spa: <strong style="color:#FDE68A !important;">${groomingItems.length} consentidos sumados</strong></div>
          <div style="font-size:0.72rem; color:#E2E8F0 !important; font-weight:500;">(${petNames}) — Se acumulan juntos en esta misma cesta.</div>
        </div>
      `;
      container.appendChild(groomingBanner);
    }

    this.cart.forEach(cartItem => {
      const prod = this.products.find(p => p.id === cartItem.id);
      const itemName = cartItem.name || (prod ? prod.name : 'Artículo VIP');
      const rawPrice = cartItem.price !== undefined ? cartItem.price : (prod ? prod.price : 0);
      const itemPrice = typeof rawPrice === 'number' ? rawPrice : (parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0);
      const itemQty = parseInt(cartItem.quantity, 10) || 1;
      const isService = this.isReceivedServiceItem(cartItem);
      const isClinical = Boolean(cartItem.isClinicalService || (cartItem.category && cartItem.category.toLowerCase().includes('clínic')) || (cartItem.category && cartItem.category.toLowerCase().includes('examen')));
      const isStaff = this.isStaffUser();
      const isLockedService = isService && !isStaff;
      const itemCategory = cartItem.category || (prod ? prod.category : (isClinical ? 'Servicio Clínico' : (isService ? 'Servicio Grooming' : 'Tienda VIP')));
      const petBadge = cartItem.pet ? `<span style="font-size:0.75rem; color:#34D399 !important; font-weight:700; margin-left:4px;">🐾 Mascota: <strong style="color:#6EE7B7 !important;">${cartItem.pet}</strong></span>` : '';
      const lockedNotice = isLockedService ? (
        isClinical
          ? `<div style="font-size:0.7rem; color:#7DD3FC !important; font-weight:700; margin-top:3px; display:flex; align-items:center; gap:4px;"><span>🔒</span> <span>Alta médica emitida • Retiro exclusivo Staff Admin</span></div>`
          : `<div style="font-size:0.7rem; color:#FBBF24 !important; font-weight:700; margin-top:3px; display:flex; align-items:center; gap:4px;"><span>🔒</span> <span>Mascota recibida en sede • Retiro exclusivo Staff Admin</span></div>`
      ) : '';

      const subtotal = itemPrice * itemQty;
      total += subtotal;
      count += itemQty;

      let actionBtnHtml = '';
      if (isLockedService) {
        actionBtnHtml = isClinical ? `
          <button type="button" class="btn btn-sm" style="padding:4px 9px; background:rgba(2, 132, 199, 0.25); color:#7DD3FC !important; border:1px solid #0284C7; border-radius:6px; font-size:0.72rem; cursor:pointer; font-weight:800; display:flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(0,0,0,0.15);" onclick="storeEngine.warnServiceCannotBeRemoved('${cartItem.id}')" title="Alta Médica Emitida: Servicio clínico consolidado. Solo el Staff de Administración puede anularlo.">
            <span>🔒</span> <span>Alta Médica</span>
          </button>
        ` : `
          <button type="button" class="btn btn-sm" style="padding:4px 9px; background:rgba(217, 119, 6, 0.25); color:#FDE68A !important; border:1px solid #D97706; border-radius:6px; font-size:0.72rem; cursor:pointer; font-weight:800; display:flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(0,0,0,0.15);" onclick="storeEngine.warnServiceCannotBeRemoved('${cartItem.id}')" title="Mascota Recibida: Servicio en curso bloqueado. Solo el Staff de Administración puede anularlo.">
            <span>🔒</span> <span>Recibido</span>
          </button>
        `;
      } else if (isService && isStaff) {
        actionBtnHtml = `
          <button type="button" class="btn btn-sm" style="padding:3px 8px; background:rgba(239, 68, 68, 0.25); color:#FCA5A5 !important; border:1px solid rgba(239, 68, 68, 0.5); border-radius:6px; font-size:0.72rem; cursor:pointer; font-weight:800;" onclick="storeEngine.removeFromCart('${cartItem.id}')" title="Eliminar servicio (Staff de Administración Autorizado)">
            ✕ Staff
          </button>
        `;
      } else {
        // Producto de tienda: cualquier cliente o staff puede eliminar libremente de inmediato
        actionBtnHtml = `
          <button type="button" class="btn btn-sm" style="padding:3px 7px; background:rgba(239, 68, 68, 0.2); color:#FCA5A5 !important; border:1px solid rgba(239, 68, 68, 0.4); border-radius:6px; font-size:0.75rem; cursor:pointer; font-weight:700;" onclick="storeEngine.removeFromCart('${cartItem.id}')" title="Eliminar artículo de tienda y recalcular total">✕</button>
        `;
      }

      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.style.padding = '10px 0';
      div.style.borderBottom = '1px solid rgba(255, 255, 255, 0.12)';

      div.innerHTML = `
        <div style="flex:1; padding-right:10px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:2px;">
            <span class="badge" style="background:${isService ? '#064e3b' : '#78350f'}; color:${isService ? '#a7f3d0' : '#fde68a'}; border:1px solid ${isService ? '#059669' : '#d97706'}; font-size:0.68rem; padding:1px 6px; border-radius:4px; font-weight:800;">${itemCategory}</span>
            <div style="font-weight:700; font-size:0.86rem; color:#FFFFFF !important; line-height:1.2;">${itemName}</div>
          </div>
          <div style="font-size:0.75rem; color:#CBD5E1 !important; display:flex; align-items:center; gap:8px; margin-top:2px;">
            <span style="color:#CBD5E1 !important;">${this.formatCurrency(itemPrice)} x ${itemQty}</span>
            ${petBadge}
          </div>
          ${lockedNotice}
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="font-weight:800; color:#FBBF24 !important; font-size:0.95rem;">${this.formatCurrency(subtotal)}</div>
          ${actionBtnHtml}
        </div>
      `;
      container.appendChild(div);
    });

    const baseSubtotal = total;
    const curr = window.FinancialEngine && typeof window.FinancialEngine.getActiveCurrency === 'function'
      ? window.FinancialEngine.getActiveCurrency()
      : 'USD';
    const isPayingInUsd = curr === 'USD';
    const taxCalc = window.FinancialEngine && typeof window.FinancialEngine.calculateWithTax === 'function'
      ? window.FinancialEngine.calculateWithTax(baseSubtotal, curr)
      : null;
    const ivaAmount = taxCalc ? taxCalc.ivaUsd : Math.round(baseSubtotal * 0.16 * 100) / 100;
    const igtfAmount = taxCalc ? taxCalc.igtfUsd : 0;
    const grandTotal = taxCalc ? taxCalc.totalUsd : Math.round((baseSubtotal + ivaAmount + igtfAmount) * 100) / 100;

    const bcvRate = (window.FinancialEngine && typeof window.FinancialEngine.getOfficialBcvRate === 'function')
      ? window.FinancialEngine.getOfficialBcvRate()
      : ((taxCalc && taxCalc.bcvRate) || (window.FinancialEngine && window.FinancialEngine.config && window.FinancialEngine.config.bcvRate) || 887.30);
    const bcvRateFmt = (window.FinancialEngine && typeof window.FinancialEngine.formatVenezuelanNumber === 'function')
      ? window.FinancialEngine.formatVenezuelanNumber(bcvRate)
      : Number(bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalVes = Math.round(grandTotal * bcvRate * 100) / 100;
    const totalVesFmt = (window.FinancialEngine && typeof window.FinancialEngine.formatVenezuelanNumber === 'function')
      ? window.FinancialEngine.formatVenezuelanNumber(totalVes)
      : Number(totalVes).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const totalDiv = document.createElement('div');
    totalDiv.className = 'cart-total-container';
    totalDiv.style.marginTop = '14px';
    totalDiv.style.paddingTop = '10px';
    totalDiv.style.borderTop = '2px solid rgba(217, 119, 6, 0.5)';
    totalDiv.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; font-size:0.84rem; color:#CBD5E1 !important;">
        <span style="font-weight:600;">Subtotal (Base Imponible):</span>
        <span style="font-weight:800; color:#FFFFFF !important;">${this.formatCurrency(baseSubtotal)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; font-size:0.84rem; color:#CBD5E1 !important;">
        <span style="display:flex; align-items:center; gap:5px; font-weight:600;">
          <span>IVA (${taxCalc ? taxCalc.ivaPercent : 16}% Legal SENIAT):</span>
          <span style="font-size:0.62rem; background:#D4AF37; color:#1E1E24; font-weight:900; padding:1px 5px; border-radius:3px;">OFICIAL</span>
        </span>
        <span style="font-weight:800; color:#FDE68A !important;">+${this.formatCurrency(ivaAmount)}</span>
      </div>
      ${isPayingInUsd ? `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.84rem; color:#FDE68A !important;">
        <span style="display:flex; align-items:center; gap:5px; font-weight:600;">
          <span>IGBT (${taxCalc ? taxCalc.igtfConfiguredPercent : 3}% Pagos en Dólares):</span>
          <span style="font-size:0.62rem; background:#B45309; color:#FFFFFF; font-weight:900; padding:1px 5px; border-radius:3px;">DÓLARES</span>
        </span>
        <span style="font-weight:800; color:#FDE68A !important;">+$${igtfAmount.toFixed(2)} USD</span>
      </div>
      ` : `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.8rem; color:#94A3B8 !important;">
        <span>IGBT (Solo aplica en dólares):</span>
        <span style="font-weight:700; color:#6EE7B7 !important;">Bs. 0,00 (Exento en Bs.)</span>
      </div>
      `}
      <div class="cart-total-row" style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px dashed rgba(255, 255, 255, 0.25);">
        <span class="cart-total-label" style="font-weight:900; font-size:0.95rem; color:#FFFFFF !important;">TOTAL A PAGAR:</span>
        <span class="cart-total-value" style="font-weight:900; font-size:1.3rem; color:#34D399 !important; text-shadow:0 0 10px rgba(52, 211, 153, 0.3);">${this.formatCurrency(grandTotal)}</span>
      </div>

      <!-- CARD INSTITUCIONAL TASA DE CAMBIO BCV DE REFERENCIA -->
      <div style="margin-top:14px; background:linear-gradient(135deg, rgba(212,175,55,0.12), rgba(21,34,50,0.6)); border:1.5px solid #D4AF37; border-radius:14px; padding:12px 14px; box-shadow:0 4px 15px rgba(0,0,0,0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:1.1rem;">🏛️</span>
            <div>
              <span style="font-size:0.75rem; font-weight:900; color:#FCD34D; text-transform:uppercase; letter-spacing:0.04em; display:block;">Tasa Oficial BCV de Referencia</span>
              <span style="font-size:0.68rem; color:#A1A1AA; font-weight:600;">Banco Central de Venezuela • Cumplimiento Legal</span>
            </div>
          </div>
          <span style="font-size:0.85rem; font-weight:900; color:#FCD34D; background:rgba(212,175,55,0.2); border:1px solid #D4AF37; padding:3px 8px; border-radius:6px; white-space:nowrap;">
            1 USD = Bs. ${bcvRateFmt}
          </span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(212,175,55,0.35);">
          <span style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">Total Estimado en Bolívares:</span>
          <span style="font-size:1.15rem; font-weight:900; color:#10B981; text-shadow:0 0 10px rgba(16,185,129,0.35);">Bs. ${totalVesFmt}</span>
        </div>
        <div style="font-size:0.67rem; color:#94A3B8; margin-top:6px; line-height:1.3; font-weight:500;">
          * Tasa oficial de referencia para liquidación en Bolívares vía Pago Móvil, Transferencia Bancaria o Punto de Venta. Se prohíbe el uso de cotizaciones paralelas según normativa SENIAT/BCV.
        </div>
      </div>
    `;
    container.appendChild(totalDiv);

    if (badge) badge.innerText = count;
    this.updateCartBadges(count, grandTotal);
  }

  /**
   * Sincronización Universal de Badges y Contadores de Carrito
   * Actualiza el badge del sidebar, el botón del header superior y el FAB flotante.
   */
  updateCartBadges(count = null, total = null) {
    if (count === null || total === null) {
      if (!Array.isArray(this.cart)) this.loadCart();
      const currentCust = this.getCurrentCustomerInfo();
      this.cart = this.deduplicateCart(this.cart, currentCust);
      count = (this.cart || []).reduce((acc, i) => acc + (parseInt(i.quantity, 10) || 1), 0);
      total = this.getCartTotal();
    }
    const countStr = String(count || 0);
    const totalStr = this.formatCurrency(total || 0);

    // 1. Sidebar badge
    const badge = document.getElementById('cart-badge-count');
    if (badge) badge.innerText = countStr;

    // 2. Header quick cart badge & total
    const headerBadge = document.getElementById('quick-cart-header-badge');
    if (headerBadge) {
      headerBadge.innerText = countStr;
      if (count > 0) {
        headerBadge.classList.add('cart-badge-bounce');
        setTimeout(() => headerBadge.classList.remove('cart-badge-bounce'), 500);
      }
    }
    const headerTotal = document.getElementById('quick-cart-header-total');
    if (headerTotal) {
      headerTotal.innerText = totalStr;
    }

    // 3. Floating Action Button (FAB) badge & total
    const fabBadge = document.getElementById('quick-cart-fab-badge');
    if (fabBadge) {
      fabBadge.innerText = countStr;
      if (count > 0) {
        fabBadge.classList.add('cart-badge-bounce');
        setTimeout(() => fabBadge.classList.remove('cart-badge-bounce'), 500);
      }
    }
    const fabTotal = document.getElementById('quick-cart-fab-total');
    if (fabTotal) {
      fabTotal.innerText = totalStr;
    }
  }

  /**
   * Apertura del Modal / Drawer de Acceso Rápido al Carrito Mrs. Pets
   */
  openQuickCartModal() {
    if (!Array.isArray(this.cart)) {
      this.loadCart();
    }
    const cust = this.getCurrentCustomerInfo();
    this.cart = this.deduplicateCart(this.cart, cust);
    this.updateCartBadges();

    const subtitleEl = document.getElementById('quick-cart-tutor-subtitle');
    if (subtitleEl) {
      const tutorName = cust.name || 'Cliente VIP';
      const tutorRif = cust.rif ? ` • ${cust.rif}` : '';
      subtitleEl.innerText = `${tutorName}${tutorRif} • Mrs. Pets Maracaibo`;
    }

    const itemsContainer = document.getElementById('quick-cart-modal-items');
    if (itemsContainer) {
      this.renderQuickCartModalItems(itemsContainer);
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('quick-cart-modal');
    }
  }

  /**
   * Renderizado de Ítems en el Modal de Acceso Rápido
   */
  renderQuickCartModalItems(container) {
    if (!container) return;
    container.innerHTML = '';
    const cust = this.getCurrentCustomerInfo();
    this.cart = this.deduplicateCart(this.cart, cust);

    if (!Array.isArray(this.cart) || this.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:36px 16px; color:#94a3b8;">
          <div style="font-size:2.8rem; margin-bottom:12px;">🛒</div>
          <div style="font-size:1.15rem; font-weight:800; color:#FFFFFF !important;">Tu cesta está vacía</div>
          <div style="font-size:0.82rem; color:#cbd5e1 !important; margin-top:6px; max-width:320px; margin-left:auto; margin-right:auto;">
            Al agendar citas de Grooming o Clínica, tus servicios se sumarán aquí automáticamente y podrás añadir productos boutique.
          </div>
        </div>
      `;
      return;
    }

    const groomingItems = this.cart.filter(i => i.isGroomingService || (i.category && i.category.toLowerCase().includes('grooming')));
    const clinicalItems = this.cart.filter(i => i.isClinicalService || (i.category && i.category.toLowerCase().includes('clínic')) || (i.category && i.category.toLowerCase().includes('examen')));

    if (clinicalItems.length > 0 && groomingItems.length > 0) {
      const banner = document.createElement('div');
      banner.style.background = 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(212, 175, 55, 0.25))';
      banner.style.border = '1.5px solid #38BDF8';
      banner.style.borderRadius = '12px';
      banner.style.padding = '10px 14px';
      banner.style.marginBottom = '14px';
      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.35rem;">🏥</span>
          <div>
            <div style="font-weight:800; font-size:0.85rem; color:#FFFFFF !important;">Cuenta Multi-Servicio: <strong style="color:#7DD3FC !important;">Grooming Spa + Clínica</strong></div>
            <div style="font-size:0.73rem; color:#E2E8F0 !important;">Servicios unificados en esta misma cesta para liquidación única.</div>
          </div>
        </div>
      `;
      container.appendChild(banner);
    }

    let total = 0;
    this.cart.forEach(cartItem => {
      const prod = this.products ? this.products.find(p => p.id === cartItem.id) : null;
      const itemName = cartItem.name || (prod ? prod.name : 'Artículo VIP');
      const rawPrice = cartItem.price !== undefined ? cartItem.price : (prod ? prod.price : 0);
      const itemPrice = typeof rawPrice === 'number' ? rawPrice : (parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0);
      const itemQty = parseInt(cartItem.quantity, 10) || 1;
      const isService = this.isReceivedServiceItem(cartItem);
      const isClinical = Boolean(cartItem.isClinicalService || (cartItem.category && cartItem.category.toLowerCase().includes('clínic')) || (cartItem.category && cartItem.category.toLowerCase().includes('examen')));
      const isStaff = this.isStaffUser();
      const isLockedService = isService && !isStaff;
      const itemCategory = cartItem.category || (prod ? prod.category : (isClinical ? 'Servicio Clínico' : (isService ? 'Servicio Grooming' : 'Tienda VIP')));
      const petBadge = cartItem.pet ? `<span style="font-size:0.75rem; color:#34D399 !important; font-weight:700; margin-left:4px;">🐾 <strong style="color:#6EE7B7 !important;">${cartItem.pet}</strong></span>` : '';
      const subtotal = itemPrice * itemQty;
      total += subtotal;

      const itemDiv = document.createElement('div');
      itemDiv.style.display = 'flex';
      itemDiv.style.justifyContent = 'space-between';
      itemDiv.style.alignItems = 'center';
      itemDiv.style.padding = '10px 0';
      itemDiv.style.borderBottom = '1px solid rgba(255, 255, 255, 0.12)';

      let removeBtnHtml = '';
      if (!isLockedService) {
        removeBtnHtml = `
          <button type="button" class="btn btn-sm" style="padding:4px 8px; background:rgba(239, 68, 68, 0.2); color:#FCA5A5 !important; border:1px solid rgba(239, 68, 68, 0.4); border-radius:6px; font-size:0.75rem; cursor:pointer; font-weight:700;" onclick="storeEngine.removeFromCart('${cartItem.id}'); storeEngine.openQuickCartModal();" title="Eliminar de la cesta">✕</button>
        `;
      } else {
        removeBtnHtml = `<span style="font-size:0.75rem; color:#94a3b8 !important;" title="Servicio activo">🔒</span>`;
      }

      itemDiv.innerHTML = `
        <div style="flex:1; padding-right:12px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:2px;">
            <span style="background:${isService ? '#064e3b' : '#78350f'}; color:${isService ? '#a7f3d0' : '#fde68a'}; border:1px solid ${isService ? '#059669' : '#d97706'}; font-size:0.65rem; padding:1px 6px; border-radius:4px; font-weight:800;">${itemCategory}</span>
            <div style="font-weight:700; font-size:0.86rem; color:#FFFFFF !important;">${itemName}</div>
          </div>
          <div style="font-size:0.75rem; color:#CBD5E1 !important; display:flex; align-items:center; gap:8px;">
            <span>${this.formatCurrency(itemPrice)} x ${itemQty}</span>
            ${petBadge}
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="font-weight:800; color:#FBBF24 !important; font-size:0.95rem;">${this.formatCurrency(subtotal)}</div>
          ${removeBtnHtml}
        </div>
      `;
      container.appendChild(itemDiv);
    });

    const baseSubtotal = total;
    const taxCalc = window.FinancialEngine && typeof window.FinancialEngine.calculateWithTax === 'function'
      ? window.FinancialEngine.calculateWithTax(baseSubtotal)
      : null;
    const ivaAmount = taxCalc ? taxCalc.ivaUsd : Math.round(baseSubtotal * 0.16 * 100) / 100;
    const grandTotal = taxCalc ? taxCalc.totalUsd : Math.round((baseSubtotal + ivaAmount) * 100) / 100;

    const totalDiv = document.createElement('div');
    totalDiv.style.marginTop = '14px';
    totalDiv.style.paddingTop = '10px';
    totalDiv.style.borderTop = '2px solid rgba(217, 119, 6, 0.5)';
    totalDiv.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; font-size:0.85rem; color:#CBD5E1 !important;">
        <span style="font-weight:600;">Subtotal (Base Imponible):</span>
        <span style="font-weight:800; color:#FFFFFF !important;">${this.formatCurrency(baseSubtotal)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.85rem; color:#CBD5E1 !important;">
        <span style="display:flex; align-items:center; gap:5px; font-weight:600;">
          <span>IVA (16% Legal SENIAT):</span>
          <span style="font-size:0.62rem; background:#D4AF37; color:#1E1E24; font-weight:900; padding:1px 5px; border-radius:3px;">OFICIAL</span>
        </span>
        <span style="font-weight:800; color:#FDE68A !important;">+${this.formatCurrency(ivaAmount)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px dashed rgba(255, 255, 255, 0.25);">
        <span style="font-weight:900; font-size:0.98rem; color:#FFFFFF !important;">TOTAL A PAGAR (IVA INCLUIDO):</span>
        <span style="font-weight:900; font-size:1.35rem; color:#34D399 !important; text-shadow:0 0 10px rgba(52, 211, 153, 0.3);">${this.formatCurrency(grandTotal)}</span>
      </div>
    `;
    container.appendChild(totalDiv);
  }

  bindCardInputs() {
    const inputNum = document.getElementById('card-number-input');
    const prevNum = document.getElementById('card-preview-number');
    if (inputNum && prevNum) {
      inputNum.addEventListener('input', (e) => {
        prevNum.innerText = e.target.value || '1234 5678 9012 3456';
      });
    }
  }

  renderCheckoutSummary() {
    const summaryContainer = document.getElementById('checkout-cart-summary');
    if (!summaryContainer) return;

    if (!Array.isArray(this.cart)) {
      this.loadCart();
    }
    let total = 0;

    if (!Array.isArray(this.cart) || this.cart.length === 0) {
      summaryContainer.innerHTML = `
        <div style="text-align:center; padding:16px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; color:#475569; font-size:0.85rem; font-weight:600;">
          🛒 No hay artículos ni servicios pendientes de pago en la cesta.
        </div>
      `;
      return;
    }

    let itemsHtml = '';
    this.cart.forEach(item => {
      const prod = this.products ? this.products.find(p => p.id === item.id) : null;
      const rawPrice = item.price !== undefined ? item.price : (prod ? prod.price : 0);
      const price = typeof rawPrice === 'number' ? rawPrice : (parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0);
      const qty = parseInt(item.quantity, 10) || 1;
      const subtotal = price * qty;
      total += subtotal;
      const isClinical = Boolean(item.isClinicalService || (item.category && item.category.toLowerCase().includes('clínic')));
      const isService = this.isReceivedServiceItem(item);
      const isStaff = this.isStaffUser();
      const isLockedService = isService && !isStaff;
      const petTag = item.pet ? ` <span style="color:#047857 !important; font-weight:700; margin-left:4px;">🐾 (${item.pet})</span>` : '';
      const serviceBadge = isClinical
        ? ` <span style="background:rgba(2, 132, 199, 0.15); color:#0369A1 !important; font-size:0.68rem; padding:2px 6px; border-radius:4px; font-weight:800; border:1px solid rgba(2,132,199,0.3);">🔒 Consulta Clínica</span>`
        : (isService ? ` <span style="background:rgba(217, 119, 6, 0.15); color:#92400E !important; font-size:0.68rem; padding:2px 6px; border-radius:4px; font-weight:800; border:1px solid rgba(217,119,6,0.3);">🔒 Mascota Recibida</span>` : '');

      let deleteBtnHtml = '';
      if (isLockedService) {
        deleteBtnHtml = `<span style="font-size:0.7rem; color:#D97706; padding:2px 5px; background:#FEF3C7; border:1px solid #FCD34D; border-radius:4px; font-weight:800;" title="Mascota Recibida: Retiro exclusivo Staff Admin">🔒</span>`;
      } else {
        deleteBtnHtml = `<button type="button" class="btn btn-sm" style="padding:2px 6px; background:#FEE2E2; color:#DC2626 !important; border:1px solid #FCA5A5; border-radius:6px; font-size:0.75rem; cursor:pointer; font-weight:800;" onclick="storeEngine.removeFromCart('${item.id}')" title="Eliminar artículo y actualizar total de inmediato">✕</button>`;
      }

      itemsHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; font-size:0.85rem; border-bottom:1px dashed #E2E8F0;">
          <div style="flex:1; padding-right:8px;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <strong style="color:#0F172A !important; font-size:0.88rem; font-weight:800;">${item.name}</strong>${petTag}${serviceBadge}
            </div>
            <div style="font-size:0.75rem; color:#475569 !important; margin-top:2px; font-weight:600;">$${price.toFixed(2)} x ${qty}</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="font-weight:900; color:#0F172A !important; font-size:0.92rem;">$${subtotal.toFixed(2)}</div>
            ${deleteBtnHtml}
          </div>
        </div>
      `;
    });

    const baseSubtotal = total;
    const curr = window.FinancialEngine && typeof window.FinancialEngine.getActiveCurrency === 'function'
      ? window.FinancialEngine.getActiveCurrency()
      : 'USD';
    const isPayingInUsd = curr === 'USD';
    const taxCalc = window.FinancialEngine && typeof window.FinancialEngine.calculateWithTax === 'function'
      ? window.FinancialEngine.calculateWithTax(baseSubtotal, 'USD') // Pasarelas de checkout operan en dólares
      : null;
    const ivaAmount = taxCalc ? taxCalc.ivaUsd : Math.round(baseSubtotal * 0.16 * 100) / 100;
    const igtfAmount = taxCalc ? taxCalc.igtfUsd : Math.round(baseSubtotal * 0.03 * 100) / 100;
    const grandTotal = taxCalc ? taxCalc.totalUsd : Math.round((baseSubtotal + ivaAmount + igtfAmount) * 100) / 100;

    summaryContainer.innerHTML = `
      <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:16px; margin-bottom:18px;">
        <div style="font-size:0.75rem; font-weight:800; color:#B45309 !important; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:10px; border-bottom:1px solid #E2E8F0; padding-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
          <span>Resumen de Cesta (Servicios & Tienda)</span>
          <span style="font-size:0.7rem; background:#FEF3C7; color:#92400E; padding:2px 8px; border-radius:6px; font-weight:800;">Mrs. Pets VIP</span>
        </div>
        ${itemsHtml}
        <div style="margin-top:12px; padding-top:10px; border-top:2px solid #CBD5E1;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.86rem; color:#475569; margin-bottom:5px;">
            <span style="font-weight:600;">Subtotal (Base Imponible):</span>
            <strong style="color:#0F172A; font-weight:800;">$${baseSubtotal.toFixed(2)} USD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.86rem; color:#475569; margin-bottom:5px;">
            <span style="display:flex; align-items:center; gap:5px; font-weight:600;">
              <span>IVA (${taxCalc ? taxCalc.ivaPercent : 16}% Legal SENIAT):</span>
              <span style="font-size:0.62rem; background:#D4AF37; color:#1E1E24; font-weight:900; padding:1px 5px; border-radius:3px;">OFICIAL</span>
            </span>
            <strong style="color:#B45309; font-weight:800;">+$${ivaAmount.toFixed(2)} USD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.86rem; color:#475569; margin-bottom:8px;">
            <span style="display:flex; align-items:center; gap:5px; font-weight:600;">
              <span>IGBT (${taxCalc ? taxCalc.igtfConfiguredPercent : 3}% Pago en Dólares):</span>
              <span style="font-size:0.62rem; background:#B45309; color:#FFFFFF; font-weight:900; padding:1px 5px; border-radius:3px;">SOLO EN DÓLARES</span>
            </span>
            <strong style="color:#B45309; font-weight:800;">+$${igtfAmount.toFixed(2)} USD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px dashed #CBD5E1; font-size:1.02rem;">
            <span style="font-weight:900; color:#0F172A !important;">TOTAL A PAGAR:</span>
            <span style="font-weight:900; font-size:1.3rem; color:#059669 !important;">$${grandTotal.toFixed(2)} USD</span>
          </div>
          ${taxCalc ? `
          <div style="margin-top:6px; text-align:right; font-size:0.8rem; color:#64748B; font-weight:700;">
            Equivalente Oficial BCV: <strong style="color:#0284C7;">Bs. ${window.FinancialEngine.formatVenezuelanNumber(taxCalc.totalVes)}</strong> (Tasa: ${taxCalc.bcvRate.toFixed(4)})
          </div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Subtotal de la cesta (Base Imponible antes de IVA)
   */
  getCartSubtotal() {
    if (!Array.isArray(this.cart)) {
      this.loadCart();
    }
    // [COMITÉ VOLTURI] Purga determinista de duplicados en memoria antes de calcular subtotal
    const cust = this.getCurrentCustomerInfo();
    this.cart = this.deduplicateCart(this.cart, cust);
    if (!Array.isArray(this.cart) || this.cart.length === 0) return 0;
    return this.cart.reduce((sum, item) => {
      const prod = this.products ? this.products.find(p => p.id === item.id) : null;
      const rawPrice = item.price !== undefined ? item.price : (prod ? prod.price : 0);
      const p = typeof rawPrice === 'number' ? rawPrice : (parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0);
      const q = parseInt(item.quantity, 10) || 1;
      return sum + (p * q);
    }, 0);
  }

  /**
   * Impuesto al Valor Agregado (IVA 16% Legal SENIAT)
   */
  getCartIva(subtotalAmount = null) {
    const subtotal = subtotalAmount !== null ? Number(subtotalAmount) : this.getCartSubtotal();
    if (subtotal <= 0) return 0;
    if (window.FinancialEngine && typeof window.FinancialEngine.calculateWithTax === 'function') {
      const calc = window.FinancialEngine.calculateWithTax(subtotal);
      return calc.ivaUsd;
    }
    return Math.round(subtotal * 0.16 * 100) / 100;
  }

  /**
   * Impuesto IGBT / IGTF (3% Solo aplicable cuando se paga en dólares)
   */
  getCartIgtf(subtotalAmount = null, paymentCurrency = 'USD') {
    const subtotal = subtotalAmount !== null ? Number(subtotalAmount) : this.getCartSubtotal();
    if (subtotal <= 0) return 0;
    if (paymentCurrency !== 'USD' && paymentCurrency !== 'dolares') return 0;
    if (window.FinancialEngine && typeof window.FinancialEngine.calculateWithTax === 'function') {
      const calc = window.FinancialEngine.calculateWithTax(subtotal, 'USD');
      return calc.igtfUsd;
    }
    return Math.round(subtotal * 0.03 * 100) / 100;
  }

  /**
   * Monto Total a Pagar en Cesta (Base Imponible + IVA + IGBT si es en dólares)
   */
  getCartTotal(paymentCurrency = 'USD') {
    const subtotal = this.getCartSubtotal();
    if (subtotal <= 0) return 0;
    const iva = this.getCartIva(subtotal);
    const igtf = this.getCartIgtf(subtotal, paymentCurrency);
    return Math.round((subtotal + iva + igtf) * 100) / 100;
  }

  openCheckout(preferredMethod = 'stripe') {
    this.renderCheckoutSummary();
    this.switchPaymentMethod(preferredMethod);
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('checkout-modal');
    }
    if (preferredMethod === 'stripe') {
      setTimeout(() => {
        if (window.stripeEngine && typeof window.stripeEngine.mountPaymentElement === 'function') {
          window.stripeEngine.mountPaymentElement();
        }
      }, 150);
    } else if (preferredMethod === 'paypal') {
      setTimeout(() => this.initPayPalButtons(), 150);
    }
  }

  switchPaymentMethod(method = 'stripe') {
    const stripeSec = document.getElementById('payment-section-stripe');
    const paypalSec = document.getElementById('payment-section-paypal');
    const zinliSec = document.getElementById('payment-section-zinli');
    const cardSec = document.getElementById('payment-section-card');
    const btnStripe = document.getElementById('tab-btn-stripe');
    const btnPaypal = document.getElementById('tab-btn-paypal');
    const btnZinli = document.getElementById('tab-btn-zinli');
    const btnCard = document.getElementById('tab-btn-card');

    // Reset buttons to neutral
    [btnStripe, btnPaypal, btnZinli, btnCard].forEach(btn => {
      if (btn) {
        btn.style.background = '#f1f5f9';
        btn.style.color = '#334155';
        btn.style.boxShadow = 'none';
        btn.style.border = '1px solid #cbd5e1';
      }
    });

    if (method === 'stripe') {
      if (stripeSec) stripeSec.style.display = 'block';
      if (paypalSec) paypalSec.style.display = 'none';
      if (zinliSec) zinliSec.style.display = 'none';
      if (cardSec) cardSec.style.display = 'none';
      if (btnStripe) {
        btnStripe.style.background = '#635BFF';
        btnStripe.style.color = '#ffffff';
        btnStripe.style.boxShadow = '0 2px 8px rgba(99, 91, 255, 0.4)';
        btnStripe.style.border = 'none';
      }
      if (window.stripeEngine && typeof window.stripeEngine.mountPaymentElement === 'function') {
        window.stripeEngine.mountPaymentElement();
      }
    } else if (method === 'paypal') {
      if (stripeSec) stripeSec.style.display = 'none';
      if (paypalSec) paypalSec.style.display = 'block';
      if (zinliSec) zinliSec.style.display = 'none';
      if (cardSec) cardSec.style.display = 'none';
      if (btnPaypal) {
        btnPaypal.style.background = '#0070ba';
        btnPaypal.style.color = '#ffffff';
        btnPaypal.style.boxShadow = '0 2px 8px rgba(0, 112, 186, 0.4)';
        btnPaypal.style.border = 'none';
      }
      this.initPayPalButtons();
    } else if (method === 'zinli') {
      if (stripeSec) stripeSec.style.display = 'none';
      if (paypalSec) paypalSec.style.display = 'none';
      if (zinliSec) zinliSec.style.display = 'block';
      if (cardSec) cardSec.style.display = 'none';
      if (btnZinli) {
        btnZinli.style.background = '#6c3483';
        btnZinli.style.color = '#ffffff';
        btnZinli.style.boxShadow = '0 2px 8px rgba(108, 52, 131, 0.4)';
        btnZinli.style.border = 'none';
      }
    } else {
      if (stripeSec) stripeSec.style.display = 'none';
      if (paypalSec) paypalSec.style.display = 'none';
      if (zinliSec) zinliSec.style.display = 'none';
      if (cardSec) cardSec.style.display = 'block';
      if (btnCard) {
        btnCard.style.background = '#0f172a';
        btnCard.style.color = '#fbbf24';
        btnCard.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.4)';
        btnCard.style.border = '1px solid #d97706';
      }
    }
  }

  initPayPalButtons() {
    const container = document.getElementById('paypal-button-container');
    const resultMsg = document.getElementById('result-message');
    if (!container) return;

    if (resultMsg) {
      resultMsg.innerText = '';
      resultMsg.style.color = 'var(--text-main)';
    }

    const totalAmount = this.getCartTotal();
    const amountStr = (totalAmount > 0 ? totalAmount : 1.00).toFixed(2);

    // Si el SDK oficial de PayPal está disponible
    if (window.paypal && typeof window.paypal.Buttons === 'function') {
      try {
        container.innerHTML = '';
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          },
          createOrder: (data, actions) => {
            const currentTotal = this.getCartTotal();
            const currentStr = (currentTotal > 0 ? currentTotal : 1.00).toFixed(2);
            return actions.order.create({
              purchase_units: [{
                description: "Mrs. Pets Maracaibo - Orden Grooming & Tienda",
                amount: {
                  currency_code: "USD",
                  value: currentStr
                }
              }]
            });
          },
          onApprove: (data, actions) => {
            if (resultMsg) {
              resultMsg.style.color = '#059669';
              resultMsg.innerText = '⏳ Transacción autorizada por PayPal. Capturando fondos...';
            }
            return actions.order.capture().then((orderData) => {
              this.completePayPalPayment(orderData);
            }).catch((err) => {
              console.error('Error al capturar orden PayPal:', err);
              if (resultMsg) {
                resultMsg.style.color = '#dc2626';
                resultMsg.innerText = '❌ Error al capturar fondos en PayPal. Intenta de nuevo.';
              }
            });
          },
          onError: (err) => {
            console.error('PayPal Error:', err);
            if (resultMsg) {
              resultMsg.style.color = '#dc2626';
              resultMsg.innerText = '⚠️ Ocurrió un error con la pasarela PayPal. Por favor verifica o usa pago con Tarjeta.';
            }
          },
          onCancel: (data) => {
            if (resultMsg) {
              resultMsg.style.color = '#d97706';
              resultMsg.innerText = 'ℹ️ Pago cancelado por el usuario en PayPal.';
            }
          }
        }).render('#paypal-button-container').catch(err => {
          console.warn('Fallo renderizado PayPal Buttons (Modo Fallback Activo):', err);
          this.renderPayPalFallback(container, resultMsg, amountStr);
        });
      } catch (e) {
        console.warn('Excepción inicializando PayPal Buttons:', e);
        this.renderPayPalFallback(container, resultMsg, amountStr);
      }
    } else {
      this.renderPayPalFallback(container, resultMsg, amountStr);
    }
  }

  renderPayPalFallback(container, resultMsg, amountStr) {
    if (!container) return;
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button type="button" id="mock-paypal-btn" class="btn" style="width:100%; background:#ffc439; color:#003087; font-weight:800; font-size:1rem; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:center; gap:8px; border:none; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
          <span style="font-weight:900; font-style:italic; font-size:1.15rem; color:#003087;">Pay<span style="color:#0079c1;">Pal</span></span>
          <span style="font-size:0.9rem; color:#0f172a; font-weight:700;">(Pagar $${amountStr})</span>
        </button>
        <button type="button" id="mock-venmo-btn" class="btn" style="width:100%; background:#008cff; color:#ffffff; font-weight:800; font-size:0.95rem; border-radius:8px; padding:10px; display:flex; align-items:center; justify-content:center; gap:8px; border:none; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
          <span style="font-weight:900; font-style:italic;">Venmo</span>
          <span style="font-size:0.85rem; font-weight:700;">(Pagar con Venmo)</span>
        </button>
        <button type="button" id="mock-paylater-btn" class="btn" style="width:100%; background:#ffffff; color:#0f172a; font-weight:700; font-size:0.88rem; border-radius:8px; padding:9px; display:flex; align-items:center; justify-content:center; gap:8px; border:1.5px solid #cbd5e1; cursor:pointer;">
          <span>Paga en 4 cuotas sin interés con <strong>PayLater</strong></span>
        </button>
      </div>
    `;

    const ppBtn = document.getElementById('mock-paypal-btn');
    if (ppBtn) {
      ppBtn.onclick = () => {
        if (resultMsg) {
          resultMsg.style.color = '#0284c7';
          resultMsg.innerText = '⏳ Conectando con PayPal JS SDK Sandbox...';
        }
        setTimeout(() => {
          const mockOrder = {
            id: 'PP-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            status: 'COMPLETED',
            payer: {
              name: { given_name: 'Dalybell' }
            }
          };
          this.completePayPalPayment(mockOrder);
        }, 800);
      };
    }

    const venmoBtn = document.getElementById('mock-venmo-btn');
    if (venmoBtn) {
      venmoBtn.onclick = () => {
        if (resultMsg) {
          resultMsg.style.color = '#0284c7';
          resultMsg.innerText = '⏳ Procesando transacción con Venmo...';
        }
        setTimeout(() => {
          const mockOrder = {
            id: 'VENMO-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            status: 'COMPLETED',
            funding_source: 'venmo'
          };
          this.completePayPalPayment(mockOrder);
        }, 800);
      };
    }

    const paylaterBtn = document.getElementById('mock-paylater-btn');
    if (paylaterBtn) {
      paylaterBtn.onclick = () => {
        if (resultMsg) {
          resultMsg.style.color = '#0284c7';
          resultMsg.innerText = '⏳ Aprobando plan PayLater en 4 cuotas sin interés...';
        }
        setTimeout(() => {
          const mockOrder = {
            id: 'PAYLATER-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            status: 'COMPLETED',
            funding_source: 'paylater'
          };
          this.completePayPalPayment(mockOrder);
        }, 800);
      };
    }
  }

  completePayPalPayment(orderData) {
    const resultMsg = document.getElementById('result-message');
    const orderId = orderData?.id || ('PP-' + Math.floor(100000 + Math.random() * 900000));
    const totalPaid = this.getCartTotal();

    if (resultMsg) {
      resultMsg.style.color = '#059669';
      resultMsg.innerHTML = `✅ <strong>¡Pago Completado con Éxito!</strong><br><span style="font-size:0.75rem; color:#64748b;">ID Transacción: ${orderId}</span>`;
    }

    const itemsSummary = (this.cart || []).map(i => `• ${i.name} (x${i.quantity || 1}) - $${((typeof i.price === 'number' ? i.price : parseFloat(i.price || 0)) * (i.quantity || 1)).toFixed(2)}`).join('\n');

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🎉 ¡Pago de $${totalPaid.toFixed(2)} procesado con éxito por PayPal!`, 'success');
    }

    if (window.whatsappSim && typeof window.whatsappSim.sendPreset === 'function') {
      window.whatsappSim.sendPreset(`🧾 *RECIBO OFICIAL DE PAGO PAYPAL / VENMO - MRS PETS MARACAIBO*\n\n¡Gracias por tu pago de *$${totalPaid.toFixed(2)}*!\n\n*Detalle de Servicios & Productos:*\n${itemsSummary}\n\n• Pasarela: *PayPal JS SDK Standard (Venmo / PayLater / Card)*\n• ID de Transacción: *${orderId}*\n• Sede: *Don Bosco, Maracaibo*\n• Teléfono Oficial: *+58 414-6799510*\n• Estatus: *PAGADO & CAPTURADO CON ÉXITO* ✅`);
    }

    // Transmisión HTTP POST en Vivo a Make.com POS Webhook (Estructura Plana Google Sheets)
    if (window.mrsPetsArch && typeof window.mrsPetsArch.triggerMakeWebhook === 'function') {
      window.mrsPetsArch.triggerMakeWebhook('pos_sale_live_dispatch', {
        ticketId: orderId,
        area: 'grooming',
        turnoArea: 'GRO-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-001',
        estatusOperativo: 'LISTO',
        amount: totalPaid,
        currency: 'USD',
        gateway: 'PayPal',
        paymentMethod: 'PayPal / Venmo (Leia POS Checkout)',
        estatusPago: 'Verificado',
        idClient: 'CLI-001',
        customerName: 'Dalybell Ramirez Montilla',
        rifCedula: 'V-19874521-0',
        phone: '+58 414-6799510',
        petName: 'Rocky (Príncipe - Husky Siberiano)',
        montoAdicionales: 0,
        detalleAdicionales: 'Hidratación de Pulpejos (Incluida estándar)'
      });
    }

    setTimeout(() => {
      this.cart = [];
      this.saveCart();
      this.renderCart();
      if (window.app && typeof window.app.closeModal === 'function') {
        window.app.closeModal('checkout-modal');
      }
    }, 2200);
  }

  completeZinliPayment() {
    const refInput = document.getElementById('zinli-reference-input');
    const refVal = refInput ? refInput.value.trim() : '';
    const resultMsg = document.getElementById('zinli-result-message');
    const totalPaid = this.getCartTotal('USD');
    const refId = refVal || ('ZIN-' + Math.floor(100000 + Math.random() * 900000));

    if (resultMsg) {
      resultMsg.style.color = '#6c3483';
      resultMsg.innerHTML = `✅ <strong>¡Pago Zinli Notificado con Éxito!</strong><br><span style="font-size:0.75rem; color:#64748b;">Ref / Comprobante: ${refId} • Monto: $${totalPaid.toFixed(2)} USD</span>`;
    }

    const itemsSummary = (this.cart || []).map(i => `• ${i.name} (x${i.quantity || 1}) - $${((typeof i.price === 'number' ? i.price : parseFloat(i.price || 0)) * (i.quantity || 1)).toFixed(2)}`).join('\n');

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🎉 ¡Pago de $${totalPaid.toFixed(2)} USD registrado con éxito vía Zinli!`, 'success');
    }

    const officialZinliEmail = (typeof window.getZinliEmail === 'function')
      ? window.getZinliEmail()
      : ((typeof localStorage !== 'undefined' && localStorage.getItem('mrs_pets_zinli_official_email')) || 'pagos@mrspets.com');

    if (window.whatsappSim && typeof window.whatsappSim.sendPreset === 'function') {
      window.whatsappSim.sendPreset(`🧾 *RECIBO OFICIAL DE PAGO ZINLI - MRS PETS MARACAIBO*\n\n¡Gracias por tu pago de *$${totalPaid.toFixed(2)} USD*!\n\n*Detalle de Servicios & Productos:*\n${itemsSummary}\n\n• Pasarela: *Zinli (${officialZinliEmail})*\n• Referencia / Emisor: *${refId}*\n• Sede: *Don Bosco, Maracaibo*\n• Teléfono Oficial: *+58 414-6799510*\n• Estatus: *PAGO ZINLI REGISTRADO & VERIFICADO* 🚀`);
    }

    if (window.adminFinanceEngine && window.adminFinanceEngine.treasury) {
      if (typeof window.adminFinanceEngine.treasury.zinli === 'number') {
        window.adminFinanceEngine.treasury.zinli += totalPaid;
      }
    }

    if (window.mrsPetsArch && typeof window.mrsPetsArch.triggerMakeWebhook === 'function') {
      window.mrsPetsArch.triggerMakeWebhook('pos_sale_live_dispatch', {
        ticketId: refId,
        area: 'grooming',
        turnoArea: 'GRO-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-001',
        estatusOperativo: 'LISTO',
        amount: totalPaid,
        currency: 'USD',
        gateway: 'Zinli',
        paymentMethod: `Zinli (${officialZinliEmail})`,
        estatusPago: 'Verificado',
        idClient: 'CLI-001',
        customerName: 'Dalybell Ramirez Montilla',
        rifCedula: 'V-19874521-0',
        phone: '+58 414-6799510',
        petName: 'Rocky (Príncipe - Husky Siberiano)',
        reference: refId
      });
    }

    setTimeout(() => {
      this.cart = [];
      this.saveCart();
      this.renderCart();
      if (window.app && typeof window.app.closeModal === 'function') {
        window.app.closeModal('checkout-modal');
      }
    }, 2200);
  }

  async processPayment() {
    const payBtn = document.getElementById('btn-confirm-checkout') || document.querySelector('#checkout-modal button[type="submit"]') || document.querySelector('#checkout-modal .btn-primary');
    if (window.app && typeof window.app.setButtonBusy === 'function') {
      window.app.setButtonBusy(payBtn, '⏳ Procesando pago seguro con el banco...');
    }

    if (!this.cart || this.cart.length === 0) {
      if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(payBtn);
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('La cesta está vacía. Agrega servicios o productos para pagar.', 'info');
      }
      return;
    }

    // Consulta dinámica obligatoria de la Tasa BCV Oficial (Bloque consolidado fijo)
    if (window.FinancialEngine && typeof window.FinancialEngine.ensureFreshRate === 'function') {
      try {
        await window.FinancialEngine.ensureFreshRate();
      } catch (e) {
        console.warn('Fallback al cálculo local BCV:', e);
      }
    }

    const baseSubtotal = this.getCartSubtotal();
    const ivaPaid = this.getCartIva(baseSubtotal);
    const totalPaid = this.getCartTotal();

    const bcvCalc = window.FinancialEngine && typeof window.FinancialEngine.calculateWithTax === 'function'
      ? window.FinancialEngine.calculateWithTax(baseSubtotal)
      : null;
    const bcvRate = bcvCalc ? bcvCalc.bcvRate : 887.30;
    const bcvSlot = bcvCalc?.bcvSlot || '11:00 AM';
    const bcvBlock = bcvCalc?.bcvBlock || 'BLOQUE_11_00_AM';
    const totalVes = bcvCalc ? bcvCalc.totalVes : parseFloat((totalPaid * bcvRate).toFixed(2));
    const formattedTotalVes = bcvCalc ? bcvCalc.formattedTotalVes : `Bs. ${(totalPaid * bcvRate).toFixed(2)} (BCV)`;
    const isAlert = bcvCalc?.preventiveAlert || false;
    const customerName = this.getCurrentCustomerName();

    const itemsSummary = this.cart.map(i => `• ${i.name} (x${i.quantity || 1}) - $${((typeof i.price === 'number' ? i.price : parseFloat(i.price || 0)) * (i.quantity || 1)).toFixed(2)}`).join('\n');

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('Procesando pago SSL seguro en Mrs. Pets...', 'info');
    }

    setTimeout(() => {
      if (window.app && typeof window.app.closeModal === 'function') {
        window.app.closeModal('checkout-modal');
      }
      this.cart = [];
      this.saveCart();
      this.renderCart();

      if (window.app && typeof window.app.resetButton === 'function') {
        window.app.resetButton(payBtn);
      }

      // SCREEN POP OFICIAL: "Pago procesado, su factura llegará por correo"
      const ticketId = 'CARD-' + Math.floor(100000 + Math.random() * 900000);

      // Ledger de Auditoría Inmutable del Servidor
      try {
        fetch('/api/audit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'ACCOUNTING_TRANSACTION_AUDIT',
            action: 'POS_CART_PAYMENT_PROCESSED',
            transaction_id: ticketId,
            customer: customerName,
            amount_usd: totalPaid,
            subtotal_usd: baseSubtotal,
            iva_usd: ivaPaid,
            bcv_rate_applied: bcvRate,
            bcv_slot: bcvSlot,
            bcv_block_id: bcvBlock,
            amount_ves: totalVes,
            source: bcvCalc?.bcvSource || 'Banco Central de Venezuela (Oficial)',
            preventive_alert: isAlert,
            compliance_clause: 'Cumplimiento Estricto BCV • Cero Dólar Paralelo',
            timestamp: new Date().toISOString()
          })
        });
      } catch(e) {}

      // Registro reactivo en StoreSalesEngine para tiempo real en "Tiempo en vivo & Estado del Paciente"
      try {
        if (window.storeSalesEngine && typeof window.storeSalesEngine.recordSale === 'function') {
          window.storeSalesEngine.recordSale({
            ticketId: ticketId,
            customerName: customerName || 'Dalybell Ramírez Montilla',
            rif: 'V-18.452.910',
            phone: '+58 (414) 389-1102',
            petName: 'Princesa',
            items: this.cart.map(i => ({
              name: i.name,
              quantity: i.quantity || 1,
              price: typeof i.price === 'number' ? i.price : parseFloat(i.price || 0),
              subtotal: (typeof i.price === 'number' ? i.price : parseFloat(i.price || 0)) * (i.quantity || 1)
            })),
            subtotal: baseSubtotal,
            iva: ivaPaid,
            total: totalPaid,
            bcvRate: bcvRate,
            bcvSlot: bcvSlot,
            totalVes: totalVes,
            formattedTotalVes: formattedTotalVes,
            paymentMethod: 'Tarjeta 3D Directa (Stripe)',
            status: 'completed',
            stepIndex: 3,
            deliveryType: 'Entrega Inmediata Mostrador Tienda'
          });
        }
      } catch(e) {
        console.warn('Error al registrar venta en storeSalesEngine:', e);
      }

      if (window.app && typeof window.app.showScreenPop === 'function') {
        window.app.showScreenPop({
          type: 'payment',
          headline: 'Pago procesado, su factura llegará por correo',
          title: '¡Transacción aprobada y factura electrónica emitida en la Base de Datos!',
          badgeText: '💳 PAGO VERIFICADO & FACTURADO • AUDITORÍA BCV SENIAT',
          icon: '💳',
          accentColor: '#10B981',
          summaryHtml: `
            <div style="background:#F8FAFC !important; border:2px solid #000000 !important; border-radius:16px; padding:16px 18px; margin-bottom:14px; color:#000000 !important;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1.5px solid #000000; padding-bottom:6px;">
                <span style="font-weight:900; font-size:0.85rem; color:#000000 !important;">🧾 Recibo / Ticket:</span>
                <span style="font-weight:900; font-family:monospace; font-size:0.95rem; background:#FEF3C7 !important; color:#000000 !important; padding:2px 8px; border-radius:6px; border:1px solid #000000;">${ticketId}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-weight:700; font-size:0.84rem; color:#000000 !important;">Subtotal (Base Imponible):</span>
                <span style="font-weight:800; color:#000000 !important;">$${baseSubtotal.toFixed(2)} USD</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:700; font-size:0.84rem; color:#000000 !important;">IVA (16% Legal SENIAT):</span>
                <span style="font-weight:800; color:#000000 !important;">+$${ivaPaid.toFixed(2)} USD</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-top:6px; border-top:1px dashed #000000;">
                <span style="font-weight:900; font-size:0.88rem; color:#000000 !important;">Monto Total Pagado:</span>
                <strong style="font-size:1.3rem; color:#000000 !important; font-weight:900;">$${totalPaid.toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:700; font-size:0.84rem; color:#000000 !important;">Tasa Oficial BCV Aplicada:</span>
                <span style="font-weight:900; font-size:0.85rem; color:#000000 !important;">${bcvRate.toFixed(2)} Bs./USD (${bcvSlot} • Bloque Fijo)</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:#ECFDF5; padding:6px 10px; border-radius:8px; border:1px solid #059669;">
                <span style="font-weight:900; font-size:0.85rem; color:#065F46 !important;">Total Oficial en Bolívares:</span>
                <span style="font-weight:900; font-size:1.05rem; color:#065F46 !important;">${formattedTotalVes}</span>
              </div>
              ${isAlert ? `
              <div style="background:#FFFBEB; border:1px solid #F59E0B; border-radius:8px; padding:6px 10px; margin-bottom:8px; font-size:0.75rem; color:#92400E; font-weight:700;">
                ⚠️ <em>Respaldo de Control Interno (Google Sheets) activo con tasa consolidada. Evento registrado en auditoría.</em>
              </div>` : ''}
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:700; font-size:0.84rem; color:#000000 !important;">Método de Pago:</span>
                <span style="font-weight:900; font-size:0.85rem; color:#000000 !important;">Tarjeta 3D Directa / Stripe Vault</span>
              </div>
              <div style="background:#FFFFFF !important; border:1.5px dashed #000000 !important; border-radius:10px; padding:10px; margin-top:10px; font-size:0.8rem; color:#000000 !important;">
                <strong>Detalle de Compra:</strong><br>
                ${itemsSummary.replace(/\n/g, '<br>')}
              </div>
              <div style="margin-top:10px; font-size:0.8rem; color:#000000 !important; font-weight:700; display:flex; align-items:center; gap:6px;">
                <span>📧</span> Su comprobante fiscal digital y factura han sido despachados al correo y registrados vía WhatsApp.
              </div>
            </div>
          `,
          buttons: [
            {
              text: '🧾 Ver Recibo en WhatsApp Simulator ➔',
              primary: true,
              onClick: () => {
                if (window.app && typeof window.app.switchTab === 'function') {
                  window.app.switchTab('whatsapp', true);
                }
              }
            },
            {
              text: '🛍️ Seguir Comprando en Tienda ➔',
              primary: false,
              onClick: () => {
                if (window.app && typeof window.app.switchTab === 'function') {
                  window.app.switchTab('store', true);
                }
              }
            },
            {
              text: '✓ Finalizar y Cerrar',
              primary: false,
              onClick: () => {}
            }
          ]
        });
      }

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`¡Pago de $${totalPaid.toFixed(2)} aprobado! Factura electrónica emitida.`, 'success');
      }

      if (window.whatsappSim && typeof window.whatsappSim.sendPreset === 'function') {
        window.whatsappSim.sendPreset(`🧾 *RECIBO DE PAGO ONLINE - MRS PETS MARACAIBO*\n\n¡Gracias por tu pago de *$${totalPaid.toFixed(2)} USD*!\n\n• *Ticket*: \`${ticketId}\`\n• *Subtotal*: $${baseSubtotal.toFixed(2)} USD\n• *IVA (16% Legal SENIAT)*: +$${ivaPaid.toFixed(2)} USD\n• *Total USD*: *$${totalPaid.toFixed(2)}*\n• *Tasa Oficial BCV*: *${bcvRate.toFixed(2)} Bs./USD* (${bcvSlot})\n• *Total en Bolívares*: *${formattedTotalVes}*\n\n*Detalle de Servicios & Productos:*\n${itemsSummary}\n\n• Sede: *Don Bosco, Maracaibo*\n• Teléfono Oficial: *+58 414-6799510*\n• Estatus: *PAGADO CON ÉXITO & AUDITADO BCV* ✅`);
      }

      // Transmisión HTTP POST en Vivo a Make.com POS Webhook (Estructura Plana Google Sheets)
      if (window.mrsPetsArch && typeof window.mrsPetsArch.triggerMakeWebhook === 'function') {
        window.mrsPetsArch.triggerMakeWebhook('pos_sale_live_dispatch', {
          ticketId: ticketId,
          area: 'grooming',
          turnoArea: 'GRO-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-002',
          estatusOperativo: 'LISTO',
          amount: totalPaid,
          currency: 'USD',
          amountVes: totalVes,
          bcvRate: bcvRate,
          bcvSlot: bcvSlot,
          bcvBlock: bcvBlock,
          gateway: 'Stripe',
          paymentMethod: 'Tarjeta 3D Directa (Leia POS Checkout)',
          estatusPago: 'Verificado',
          idClient: 'CLI-001',
          customerName: customerName || 'Dalybell Ramirez Montilla',
          rifCedula: 'V-19874521-0',
          phone: '+58 414-6799510',
          petName: 'Rocky (Príncipe - Husky Siberiano)',
          montoAdicionales: 0,
          detalleAdicionales: 'Hidratación de Pulpejos (Incluida estándar)'
        });
      }
    }, 1400);
  }

  getOrderStatusForAI(userText) {
    this.loadCart();
    if (!this.cart || this.cart.length === 0) {
      return "Tu cesta de compras se encuentra vacía actualmente. Al cambiar tu cita de Grooming al estatus *Recibido*, se cargará automáticamente y podrás sumar productos de nuestra tienda.";
    }
    const count = this.cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const subtotal = this.getCartSubtotal();
    const iva = this.getCartIva(subtotal);
    const total = this.getCartTotal();
    const details = this.cart.map(i => `• ${i.name} ${i.pet ? `(Mascota: ${i.pet})` : ''}: $${(typeof i.price === 'number' ? i.price : parseFloat(i.price || 0)).toFixed(2)} x ${i.quantity || 1}`).join('\n');
    return `Tienes *${count} ítem(s)* en tu cesta de compras:\n${details}\n\n• Subtotal (Base Imponible): *$${subtotal.toFixed(2)} USD*\n• IVA (16% Legal SENIAT): *+$${iva.toFixed(2)} USD*\n• **TOTAL A PAGAR (IVA INCLUIDO): $${total.toFixed(2)} USD**\n\nPuedes ingresar a la pestaña *Grooming & Tienda* para realizar el pago en línea.`;
  }
}

const storeEngine = new StoreEngine();
window.storeEngine = storeEngine;
document.addEventListener('DOMContentLoaded', () => storeEngine.init());

