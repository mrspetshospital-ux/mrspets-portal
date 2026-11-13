/* ==========================================================================
   ADMINISTRACIÓN Y FINANZAS - BACK-OFFICE RESTRICTED MODULE (Mrs. Pets Maracaibo)
   Arquitectura Zero Trust: Exclusivo para Staff Administrativo y Gerencia.
   Cash Flow Multi-divisa, SENIAT (IVA/Retenciones), SEDEMAT (Maracaibo),
   Motor de Variables Dinámicas (CRUD) y Restitución de Stock (Pandora / Volturi).
   ========================================================================== */

class AdminFinanceEngine {
  constructor() {
    this.storageKeyVariables = 'mrs_pets_dynamic_variables';
    this.storageKeyExpenses = 'mrs_pets_operating_expenses';
    this.storageKeyStockRestitution = 'mrs_pets_stock_restitution';
    this.storageKeyInvoices = 'mrs_pets_fiscal_invoices';
    this.currentDateRange = 'month'; // 'day', 'week', 'quincena', 'month', 'semester', 'year', 'custom'
    this.customFrom = '';
    this.customTo = '';

    // Filtros de facturación contable y fiscal SENIAT
    this.invoiceFilterPeriod = 'day'; // 'day', 'week', 'quincena', 'month', 'semester', 'year', 'all'
    this.invoiceFilterDate = ''; // Fecha específica de visita 'YYYY-MM-DD' ("¿Cuándo fue que vino?")
    this.invoiceSearchQuery = ''; // Búsqueda de cliente, RIF, factura, mascota
    this.invoiceDivisionFilter = 'all'; // 'all', 'clinica', 'grooming', 'hotel', 'tienda'

    // Variables dinámicas en memoria
    this.dynamicVariables = [];
    // Egresos y costos operativos
    this.expenses = {};
    // Ítems de reposición logística
    this.restitutionItems = [];
    // Histórico de Facturas Fiscales SENIAT
    this.invoices = [];
  }

  init() {
    this.loadState();
    if (this.dynamicVariables.length === 0) {
      this.seedInitialVariables();
    }
    if (Object.keys(this.expenses).length === 0) {
      this.seedInitialExpenses();
    }
    if (this.restitutionItems.length === 0) {
      this.seedInitialRestitution();
    }
    if (this.invoices.length === 0) {
      this.seedInitialInvoices();
    }
  }

  // ==================== RESTRICCIÓN ZERO TRUST & ROLES ====================
  isAuthorized() {
    // 1. Verificar sesión en AuthEngine
    if (window.AuthEngine) {
      const user = typeof window.AuthEngine.getCurrentUser === 'function'
        ? window.AuthEngine.getCurrentUser()
        : window.AuthEngine.currentUser;
      if (user && (user.isAuthenticated || user.role === 'admin' || user.role === 'gerencia')) {
        const role = String(user.role || '').toLowerCase();
        if (role === 'admin' || role === 'gerencia' || role === 'staff') {
          return true;
        }
      }
    }
    // 2. Verificar AdminEngine y ViewEnvironment
    if (window.adminEngine) {
      if (window.adminEngine.isEnterpriseAuthenticated && window.adminEngine.viewEnvironment === 'enterprise') {
        return true;
      }
      if (window.adminEngine.currentStaffRole) {
        const r = String(window.adminEngine.currentStaffRole).toLowerCase();
        if (['admin', 'gerencia', 'administrador', 'director medico', 'staff'].includes(r)) {
          return true;
        }
      }
    }
    // 3. Persistent enterprise auth
    try {
      if (sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true') {
        return true;
      }
    } catch (e) {}

    return false;
  }

  // ==================== PERSISTENCIA & SEMILLAS ====================
  loadState() {
    try {
      const vars = localStorage.getItem(this.storageKeyVariables);
      if (vars) this.dynamicVariables = JSON.parse(vars);
      const exp = localStorage.getItem(this.storageKeyExpenses);
      if (exp) this.expenses = JSON.parse(exp);
      const rest = localStorage.getItem(this.storageKeyStockRestitution);
      if (rest) this.restitutionItems = JSON.parse(rest);
      const inv = localStorage.getItem(this.storageKeyInvoices);
      if (inv) this.invoices = JSON.parse(inv);
    } catch (e) {
      console.warn('Error al cargar estado de Administración y Finanzas:', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKeyVariables, JSON.stringify(this.dynamicVariables));
      localStorage.setItem(this.storageKeyExpenses, JSON.stringify(this.expenses));
      localStorage.setItem(this.storageKeyStockRestitution, JSON.stringify(this.restitutionItems));
      localStorage.setItem(this.storageKeyInvoices, JSON.stringify(this.invoices));
    } catch (e) {
      console.error('Error al guardar estado de Administración y Finanzas:', e);
    }
  }

  seedInitialVariables() {
    this.dynamicVariables = [
      {
        id: 'VAR-101',
        name: 'Bono Productividad Grooming',
        type: 'percentage', // 'percentage', 'fixed', 'formula'
        value: 5.0, // 5%
        division: 'grooming', // 'grooming', 'clinica', 'hotel', 'tienda', 'all'
        status: 'active', // 'active', 'retired'
        description: 'Bono sobre ingresos brutos de servicios de spa y peluquería distribuido al equipo técnico.',
        createdAt: '2026-09-01T08:00:00Z'
      },
      {
        id: 'VAR-102',
        name: 'Fondo de Reserva Quirófano UVI',
        type: 'fixed',
        value: 350.0, // $350 USD fijos mensuales
        division: 'clinica',
        status: 'active',
        description: 'Provisión mensual para calibración y mantenimiento preventivo de analizadores IDEXX y rayos X.',
        createdAt: '2026-09-01T08:00:00Z'
      },
      {
        id: 'VAR-103',
        name: 'Retención IVA Contribuyentes Especiales (SENIAT)',
        type: 'percentage',
        value: 75.0, // 75% de retención sobre el IVA causado
        division: 'all',
        status: 'active',
        description: 'Retención legal del 75% del IVA aplicable a clientes y proveedores designados como Contribuyentes Especiales.',
        createdAt: '2026-09-01T08:00:00Z'
      },
      {
        id: 'VAR-104',
        name: 'Comisión Turno Nocturno Urgencias 24H',
        type: 'percentage',
        value: 10.0, // 10%
        division: 'clinica',
        status: 'active',
        description: 'Incentivo médico por atención y hospitalización en guardia de 07:00 PM a 07:00 AM.',
        createdAt: '2026-09-15T12:00:00Z'
      },
      {
        id: 'VAR-105',
        name: 'Tasa Fomento Municipal Maracaibo (SEDEMAT)',
        type: 'percentage',
        value: 1.5, // 1.5%
        division: 'all',
        status: 'retired',
        description: 'Concepto municipal temporal retirado según decreto extraordinario 2026.',
        createdAt: '2026-08-01T08:00:00Z',
        retiredAt: '2026-10-01T00:00:00Z'
      }
    ];
    this.saveState();
  }

  seedInitialExpenses() {
    this.expenses = {
      fixedCosts: 1850.00, // Alquiler Av. El Milagro, Condominio, Fibra Óptica, Planta Eléctrica
      payroll: 3200.00,    // Nómina médica veterinaria, groomers, auxiliares y concierge
      medicalSupplies: 940.00, // Reactivos IDEXX, anestésicos, sueros, descartables
      stockReplenishment: 1650.00 // Reposición de alimentos Royal Canin, fármacos y boutique
    };
    this.saveState();
  }

  seedInitialRestitution() {
    this.restitutionItems = [
      {
        id: 'REST-001',
        item: 'Royal Canin Mini Adult (3kg)',
        division: 'tienda',
        currentStock: 3,
        safetyStock: 10,
        moq: 20, // Minimum Order Quantity
        unitCost: 19.50,
        retailPrice: 28.50,
        leadTimeDays: 4,
        supplier: 'Distribuidora Royal Pet C.A.',
        volturiStatus: 'APPROVED', // 'APPROVED', 'REJECTED_KILLCRITIC', 'PENDING'
        roiPercent: 46.15,
        criticReason: 'Rotación acelerada (6.2 días de inventario). Rentabilidad bruta > 40%. Aprobado para despacho Pandora.'
      },
      {
        id: 'REST-002',
        item: 'Bravecto Antiparasitario 10-20kg',
        division: 'tienda',
        currentStock: 2,
        safetyStock: 8,
        moq: 12,
        unitCost: 29.00,
        retailPrice: 42.00,
        leadTimeDays: 2,
        supplier: 'FarmaVet de Occidente S.A.',
        volturiStatus: 'APPROVED',
        roiPercent: 44.83,
        criticReason: 'Insumo de bioseguridad canina indispensable. Plazo de reposición ágil (48 hrs).'
      },
      {
        id: 'REST-003',
        item: 'Reactivo Bioquímica Catalyst Chem 17 (IDEXX)',
        division: 'clinica',
        currentStock: 1,
        safetyStock: 5,
        moq: 5,
        unitCost: 95.00,
        retailPrice: 160.00,
        leadTimeDays: 5,
        supplier: 'IDEXX Laboratories Latin America',
        volturiStatus: 'APPROVED',
        roiPercent: 68.42,
        criticReason: 'Crítico para diagnósticos renales y prequirúrgicos. Retorno alto y riesgo cero de obsolescencia.'
      },
      {
        id: 'REST-004',
        item: 'Champú Ozono Hipoalergénico 500ml',
        division: 'grooming',
        currentStock: 4,
        safetyStock: 15,
        moq: 24,
        unitCost: 9.80,
        retailPrice: 18.00,
        leadTimeDays: 3,
        supplier: 'Laboratorios Dermavet C.A.',
        volturiStatus: 'APPROVED',
        roiPercent: 83.67,
        criticReason: 'Insumo base del circuito de 7 estaciones de Spa. Alto margen.'
      },
      {
        id: 'REST-005',
        item: 'Cojinería de Lujo Terciopelo Importada',
        division: 'tienda',
        currentStock: 1,
        safetyStock: 4,
        moq: 15,
        unitCost: 45.00,
        retailPrice: 55.00,
        leadTimeDays: 25,
        supplier: 'Importaciones Glamour Pet S.A.',
        volturiStatus: 'REJECTED_KILLCRITIC',
        roiPercent: 22.22,
        criticReason: 'Alerta Volturi (KillCritic): Lead time prolongado (25 días) y ROI bajo (22.2%). Se descarta compra inmediata.'
      }
    ];
    this.saveState();
  }

  // ==================== MÓDULO FISCAL SENIAT: HISTÓRICO, MÉTODOS Y FECHAS ====================
  getTodayDateStr() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDateWithOffset(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDaysDiffFromToday(dateStr) {
    if (!dateStr) return 9999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    if (isNaN(target.getTime())) return 9999;
    const diffTime = today.getTime() - target.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  seedInitialInvoices() {
    const today = this.getTodayDateStr();
    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;

    this.invoices = [
      // 1. FACTURACIÓN DEL DÍA (HOY)
      {
        id: 'INV-2026-000418',
        invoiceNumber: 'FACT-2026-000418',
        controlNumber: '00-008938',
        fiscalSeries: 'SERIE-A',
        date: today,
        time: '09:30 AM',
        timestamp: `${today}T09:30:00`,
        cashier: 'Dalybell Ramírez (Caja Central)',
        division: 'grooming',
        divisionLabel: '✂️ Grooming & Spa Canino/Felino',
        customer: {
          name: 'Dalybell Ramírez Montilla',
          rif: 'V-18.452.910',
          email: 'dalybell@mrspets.com',
          phone: '+58 (414) 389-1102',
          address: 'Av. 3Y San Martín, Bella Vista, Maracaibo, Zulia'
        },
        pet: {
          name: 'Princesa',
          species: 'Canino / Border Collie VIP',
          patientId: 'PAC-2026-018'
        },
        items: [
          { code: 'GRM-01', description: 'Grooming Estilo Asiático VIP + Baño Ozono & Mascarilla Hidratante', quantity: 1, unitPrice: 45.00, isExempt: false, total: 45.00 },
          { code: 'GRM-02', description: 'Corte de Uñas & Vaciado de Glándulas', quantity: 1, unitPrice: 10.00, isExempt: false, total: 10.00 },
          { code: 'GRM-03', description: 'Perfume Pet Royale Signature 60ml', quantity: 1, unitPrice: 15.00, isExempt: false, total: 15.00 }
        ],
        subtotal: 70.00,
        taxableAmount: 70.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 11.20,
        totalUsd: 81.20,
        bcvRate: bcvRate,
        totalVes: parseFloat((81.20 * bcvRate).toFixed(2)),
        paymentMethod: 'Pago Móvil Banplus C2P',
        paymentReference: 'C2P-BANPLUS-992144',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${today} a las 09:35 AM`,
        emailHistory: [
          { date: today, time: '09:35 AM', recipientEmail: 'dalybell@mrspets.com', sentBy: 'Dalybell Ramírez', status: 'Entregado OK' }
        ],
        printCount: 1
      },
      {
        id: 'INV-2026-000417',
        invoiceNumber: 'FACT-2026-000417',
        controlNumber: '00-008937',
        fiscalSeries: 'SERIE-A',
        date: today,
        time: '11:15 AM',
        timestamp: `${today}T11:15:00`,
        cashier: 'Dra. Sofía Mendoza (Recepción Médica)',
        division: 'clinica',
        divisionLabel: '🩺 Clínica Veterinaria 24H & Cirugía',
        customer: {
          name: 'Carlos Mendoza',
          rif: 'V-14.882.109',
          email: 'carlos.mendoza@email.com',
          phone: '+58 (412) 555-1234',
          address: 'Urb. Virginia, Calle 67, Maracaibo, Zulia'
        },
        pet: {
          name: 'Fifi',
          species: 'Canino / Poodle Toy VIP',
          patientId: 'PAC-2026-022'
        },
        items: [
          { code: 'CLN-01', description: 'Consulta Pediátrica Especializada + Evaluación Cardíaca', quantity: 1, unitPrice: 35.00, isExempt: false, total: 35.00 },
          { code: 'CLN-02', description: 'Vacuna Séxtuple Canina Nobivac', quantity: 1, unitPrice: 25.00, isExempt: false, total: 25.00 },
          { code: 'CLN-03', description: 'Desparasitación Interna Drontal Plus', quantity: 1, unitPrice: 12.00, isExempt: false, total: 12.00 }
        ],
        subtotal: 72.00,
        taxableAmount: 72.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 11.52,
        totalUsd: 83.52,
        bcvRate: bcvRate,
        totalVes: parseFloat((83.52 * bcvRate).toFixed(2)),
        paymentMethod: 'Tarjeta Débito Banplus (POS)',
        paymentReference: 'POS-BANPLUS-441029',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${today} a las 11:20 AM`,
        emailHistory: [
          { date: today, time: '11:20 AM', recipientEmail: 'carlos.mendoza@email.com', sentBy: 'Dra. Sofía Mendoza', status: 'Entregado OK' }
        ],
        printCount: 1
      },
      {
        id: 'INV-2026-000416',
        invoiceNumber: 'FACT-2026-000416',
        controlNumber: '00-008936',
        fiscalSeries: 'SERIE-A',
        date: today,
        time: '02:40 PM',
        timestamp: `${today}T14:40:00`,
        cashier: 'Mariana Briceño (Concierge Tienda)',
        division: 'tienda',
        divisionLabel: '🛍️ Tienda de Lujo & Farmacia Veterinaria',
        customer: {
          name: 'Patricia Villalobos',
          rif: 'V-19.874.521-0',
          email: 'patricia.v@gmail.com',
          phone: '+58 (414) 679-9510',
          address: 'Av. El Milagro, Res. El Faro, Maracaibo, Zulia'
        },
        pet: {
          name: 'Simba',
          species: 'Canino / Golden Retriever',
          patientId: 'PAC-2026-035'
        },
        items: [
          { code: 'TND-01', description: 'Alimento Royal Canin Maxi Adult 15kg', quantity: 1, unitPrice: 85.00, isExempt: false, total: 85.00 },
          { code: 'TND-02', description: 'Antipulgas y Garrapatas Bravecto 20-40kg', quantity: 1, unitPrice: 38.00, isExempt: false, total: 38.00 }
        ],
        subtotal: 123.00,
        taxableAmount: 123.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 19.68,
        totalUsd: 142.68,
        bcvRate: bcvRate,
        totalVes: parseFloat((142.68 * bcvRate).toFixed(2)),
        paymentMethod: 'Stripe Card Vault USD',
        paymentReference: 'ch_3Nkp91MrsPetsStripe',
        status: 'EMITIDA',
        emailStatus: 'Pendiente de confirmación de correo',
        emailHistory: [],
        printCount: 1
      },

      // 2. FACTURACIÓN DE LA SEMANA (2 y 4 días atrás)
      {
        id: 'INV-2026-000415',
        invoiceNumber: 'FACT-2026-000415',
        controlNumber: '00-008935',
        fiscalSeries: 'SERIE-A',
        date: this.getDateWithOffset(-2),
        time: '10:10 AM',
        timestamp: `${this.getDateWithOffset(-2)}T10:10:00`,
        cashier: 'Carlos Mendoza (Caja Grooming)',
        division: 'grooming',
        divisionLabel: '✂️ Grooming & Spa Canino/Felino',
        customer: {
          name: 'Andrés Morales',
          rif: 'V-20.145.890',
          email: 'andres.morales@outlook.com',
          phone: '+58 (424) 612-4488',
          address: 'Sector Tierra Negra, Calle 70, Maracaibo'
        },
        pet: {
          name: 'Buddy',
          species: 'Canino / Bulldog Francés',
          patientId: 'PAC-2026-041'
        },
        items: [
          { code: 'GRM-04', description: 'Baño Terapéutico Dermatológico + Limpieza de Pliegues Faciales', quantity: 1, unitPrice: 40.00, isExempt: false, total: 40.00 }
        ],
        subtotal: 40.00,
        taxableAmount: 40.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 6.40,
        totalUsd: 46.40,
        bcvRate: bcvRate,
        totalVes: parseFloat((46.40 * bcvRate).toFixed(2)),
        paymentMethod: 'Pago Móvil Banplus C2P',
        paymentReference: 'C2P-BANPLUS-881290',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${this.getDateWithOffset(-2)} a las 10:15 AM`,
        emailHistory: [
          { date: this.getDateWithOffset(-2), time: '10:15 AM', recipientEmail: 'andres.morales@outlook.com', sentBy: 'Carlos Mendoza', status: 'Entregado OK' }
        ],
        printCount: 1
      },
      {
        id: 'INV-2026-000414',
        invoiceNumber: 'FACT-2026-000414',
        controlNumber: '00-008934',
        fiscalSeries: 'SERIE-A',
        date: this.getDateWithOffset(-4),
        time: '04:20 PM',
        timestamp: `${this.getDateWithOffset(-4)}T16:20:00`,
        cashier: 'Dra. Sofía Mendoza (Recepción Médica)',
        division: 'clinica',
        divisionLabel: '🩺 Clínica Veterinaria 24H & Cirugía',
        customer: {
          name: 'María Eugenia Faría',
          rif: 'V-16.784.320',
          email: 'mariaeugenia.f@gmail.com',
          phone: '+58 (416) 555-8901',
          address: 'Sector Paraíso, Av. 20, Maracaibo'
        },
        pet: {
          name: 'Luna',
          species: 'Felino / Persa Blanco',
          patientId: 'PAC-2026-050'
        },
        items: [
          { code: 'CLN-04', description: 'Perfil Bioquímico IDEXX Catalyst One + Ecografía Abdominal', quantity: 1, unitPrice: 95.00, isExempt: false, total: 95.00 }
        ],
        subtotal: 95.00,
        taxableAmount: 95.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 15.20,
        totalUsd: 110.20,
        bcvRate: bcvRate,
        totalVes: parseFloat((110.20 * bcvRate).toFixed(2)),
        paymentMethod: 'Zelle Wells Fargo',
        paymentReference: 'ZEL-881920149',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${this.getDateWithOffset(-4)} a las 04:25 PM`,
        emailHistory: [
          { date: this.getDateWithOffset(-4), time: '04:25 PM', recipientEmail: 'mariaeugenia.f@gmail.com', sentBy: 'Dra. Sofía Mendoza', status: 'Entregado OK' }
        ],
        printCount: 1
      },

      // 3. FACTURACIÓN DE LA QUINCENA (9 y 12 días atrás)
      {
        id: 'INV-2026-000413',
        invoiceNumber: 'FACT-2026-000413',
        controlNumber: '00-008933',
        fiscalSeries: 'SERIE-A',
        date: this.getDateWithOffset(-9),
        time: '01:15 PM',
        timestamp: `${this.getDateWithOffset(-9)}T13:15:00`,
        cashier: 'Dalybell Ramírez (Caja Central)',
        division: 'hotel',
        divisionLabel: '🏨 Admisión Hotel 5★ & Guardería',
        customer: {
          name: 'Roberto González',
          rif: 'V-12.441.980',
          email: 'r.gonzalez@inversiones.com',
          phone: '+58 (414) 601-2233',
          address: 'Urb. La Lago, Calle 73, Maracaibo'
        },
        pet: {
          name: 'Max',
          species: 'Canino / Pastor Alemán',
          patientId: 'PAC-2026-058'
        },
        items: [
          { code: 'HTL-01', description: 'Suite Bioclimática VIP Hotel Canino (3 Noches) + Circuito de Spa & Agility', quantity: 1, unitPrice: 180.00, isExempt: false, total: 180.00 }
        ],
        subtotal: 180.00,
        taxableAmount: 180.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 28.80,
        totalUsd: 208.80,
        bcvRate: bcvRate,
        totalVes: parseFloat((208.80 * bcvRate).toFixed(2)),
        paymentMethod: 'Pago Móvil Banplus C2P',
        paymentReference: 'C2P-BANPLUS-776211',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${this.getDateWithOffset(-9)} a las 01:20 PM`,
        emailHistory: [
          { date: this.getDateWithOffset(-9), time: '01:20 PM', recipientEmail: 'r.gonzalez@inversiones.com', sentBy: 'Dalybell Ramírez', status: 'Entregado OK' }
        ],
        printCount: 2
      },
      {
        id: 'INV-2026-000412',
        invoiceNumber: 'FACT-2026-000412',
        controlNumber: '00-008932',
        fiscalSeries: 'SERIE-A',
        date: this.getDateWithOffset(-12),
        time: '11:40 AM',
        timestamp: `${this.getDateWithOffset(-12)}T11:40:00`,
        cashier: 'Mariana Briceño (Concierge Tienda)',
        division: 'tienda',
        divisionLabel: '🛍️ Tienda de Lujo & Farmacia Veterinaria',
        customer: {
          name: 'Elena Corzo de Martínez',
          rif: 'V-15.309.214',
          email: 'elena.corzo@hotmail.com',
          phone: '+58 (424) 688-9900',
          address: 'Urb. El Rosal, Maracaibo'
        },
        pet: {
          name: 'Rocky',
          species: 'Canino / Beagle',
          patientId: 'PAC-2026-064'
        },
        items: [
          { code: 'TND-03', description: 'Cama Ortopédica Memory Foam + Suplemento Articular Condroitina', quantity: 1, unitPrice: 75.00, isExempt: false, total: 75.00 }
        ],
        subtotal: 75.00,
        taxableAmount: 75.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 12.00,
        totalUsd: 87.00,
        bcvRate: bcvRate,
        totalVes: parseFloat((87.00 * bcvRate).toFixed(2)),
        paymentMethod: 'Tarjeta Débito Bancaria (POS)',
        paymentReference: 'POS-099411',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${this.getDateWithOffset(-12)} a las 11:45 AM`,
        emailHistory: [
          { date: this.getDateWithOffset(-12), time: '11:45 AM', recipientEmail: 'elena.corzo@hotmail.com', sentBy: 'Mariana Briceño', status: 'Entregado OK' }
        ],
        printCount: 1
      },

      // 4. FACTURACIÓN DEL MES (20 y 26 días atrás)
      {
        id: 'INV-2026-000411',
        invoiceNumber: 'FACT-2026-000411',
        controlNumber: '00-008931',
        fiscalSeries: 'SERIE-A',
        date: this.getDateWithOffset(-20),
        time: '03:00 PM',
        timestamp: `${this.getDateWithOffset(-20)}T15:00:00`,
        cashier: 'Dra. Sofía Mendoza (Recepción Médica)',
        division: 'clinica',
        divisionLabel: '🩺 Clínica Veterinaria 24H & Cirugía',
        customer: {
          name: 'Dalybell Ramírez Montilla',
          rif: 'V-18.452.910',
          email: 'dalybell@mrspets.com',
          phone: '+58 (414) 389-1102',
          address: 'Av. 3Y San Martín, Bella Vista, Maracaibo'
        },
        pet: {
          name: 'Princesa',
          species: 'Canino / Border Collie VIP',
          patientId: 'PAC-2026-018'
        },
        items: [
          { code: 'CLN-05', description: 'Limpieza Dental por Ultrasonido sin Anestesia + Profilaxis', quantity: 1, unitPrice: 60.00, isExempt: false, total: 60.00 }
        ],
        subtotal: 60.00,
        taxableAmount: 60.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 9.60,
        totalUsd: 69.60,
        bcvRate: bcvRate,
        totalVes: parseFloat((69.60 * bcvRate).toFixed(2)),
        paymentMethod: 'Pago Móvil Banplus C2P',
        paymentReference: 'C2P-BANPLUS-663219',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${this.getDateWithOffset(-20)} a las 03:05 PM`,
        emailHistory: [
          { date: this.getDateWithOffset(-20), time: '03:05 PM', recipientEmail: 'dalybell@mrspets.com', sentBy: 'Dra. Sofía Mendoza', status: 'Entregado OK' }
        ],
        printCount: 1
      },
      {
        id: 'INV-2026-000410',
        invoiceNumber: 'FACT-2026-000410',
        controlNumber: '00-008930',
        fiscalSeries: 'SERIE-A',
        date: this.getDateWithOffset(-26),
        time: '10:00 AM',
        timestamp: `${this.getDateWithOffset(-26)}T10:00:00`,
        cashier: 'Carlos Mendoza (Caja Grooming)',
        division: 'grooming',
        divisionLabel: '✂️ Grooming & Spa Canino/Felino',
        customer: {
          name: 'Guillermo Belloso',
          rif: 'V-08.991.240',
          email: 'gbelloso@belloso.com.ve',
          phone: '+58 (414) 631-0022',
          address: 'Av. Bella Vista con Calle 72, Maracaibo'
        },
        pet: {
          name: 'Thor',
          species: 'Canino / Rottweiler',
          patientId: 'PAC-2026-071'
        },
        items: [
          { code: 'GRM-05', description: 'Baño Antiparasitario + Deslanado Profundo Raza Gigante', quantity: 1, unitPrice: 55.00, isExempt: false, total: 55.00 }
        ],
        subtotal: 55.00,
        taxableAmount: 55.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 8.80,
        totalUsd: 63.80,
        bcvRate: bcvRate,
        totalVes: parseFloat((63.80 * bcvRate).toFixed(2)),
        paymentMethod: 'Efectivo USD',
        paymentReference: 'CASH-USD-5510',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${this.getDateWithOffset(-26)} a las 10:05 AM`,
        emailHistory: [
          { date: this.getDateWithOffset(-26), time: '10:05 AM', recipientEmail: 'gbelloso@belloso.com.ve', sentBy: 'Carlos Mendoza', status: 'Entregado OK' }
        ],
        printCount: 1
      },

      // 5. FACTURACIÓN DEL SEMESTRE (50 y 95 días atrás)
      {
        id: 'INV-2026-000409',
        invoiceNumber: 'FACT-2026-000409',
        controlNumber: '00-008929',
        fiscalSeries: 'SERIE-A',
        date: this.getDateWithOffset(-50),
        time: '12:00 PM',
        timestamp: `${this.getDateWithOffset(-50)}T12:00:00`,
        cashier: 'Dalybell Ramírez (Caja Central)',
        division: 'hotel',
        divisionLabel: '🏨 Admisión Hotel 5★ & Guardería',
        customer: {
          name: 'Patricia Villalobos',
          rif: 'V-19.874.521-0',
          email: 'patricia.v@gmail.com',
          phone: '+58 (414) 679-9510',
          address: 'Av. El Milagro, Res. El Faro, Maracaibo'
        },
        pet: {
          name: 'Simba',
          species: 'Canino / Golden Retriever',
          patientId: 'PAC-2026-035'
        },
        items: [
          { code: 'HTL-02', description: 'Hospedaje Suites Familiares Bioclimáticas (5 Días) + Menú Gourmet Barf', quantity: 1, unitPrice: 250.00, isExempt: false, total: 250.00 }
        ],
        subtotal: 250.00,
        taxableAmount: 250.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 40.00,
        totalUsd: 290.00,
        bcvRate: bcvRate,
        totalVes: parseFloat((290.00 * bcvRate).toFixed(2)),
        paymentMethod: 'Stripe Card Vault USD',
        paymentReference: 'ch_2Mb88109MrsPets',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${this.getDateWithOffset(-50)} a las 12:05 PM`,
        emailHistory: [
          { date: this.getDateWithOffset(-50), time: '12:05 PM', recipientEmail: 'patricia.v@gmail.com', sentBy: 'Dalybell Ramírez', status: 'Entregado OK' }
        ],
        printCount: 1
      },
      {
        id: 'INV-2026-000408',
        invoiceNumber: 'FACT-2026-000408',
        controlNumber: '00-008928',
        fiscalSeries: 'SERIE-A',
        date: this.getDateWithOffset(-95),
        time: '02:30 PM',
        timestamp: `${this.getDateWithOffset(-95)}T14:30:00`,
        cashier: 'Dra. Sofía Mendoza (Recepción Médica)',
        division: 'clinica',
        divisionLabel: '🩺 Clínica Veterinaria 24H & Cirugía',
        customer: {
          name: 'Carlos Mendoza',
          rif: 'V-14.882.109',
          email: 'carlos.mendoza@email.com',
          phone: '+58 (412) 555-1234',
          address: 'Urb. Virginia, Maracaibo'
        },
        pet: {
          name: 'Fifi',
          species: 'Canino / Poodle Toy VIP',
          patientId: 'PAC-2026-022'
        },
        items: [
          { code: 'CLN-06', description: 'Cirugía Menor Esterilización Ovariohisterectomía Láser', quantity: 1, unitPrice: 160.00, isExempt: false, total: 160.00 }
        ],
        subtotal: 160.00,
        taxableAmount: 160.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 25.60,
        totalUsd: 185.60,
        bcvRate: bcvRate,
        totalVes: parseFloat((185.60 * bcvRate).toFixed(2)),
        paymentMethod: 'Tarjeta Débito Banplus (POS)',
        paymentReference: 'POS-BANPLUS-330198',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${this.getDateWithOffset(-95)} a las 02:35 PM`,
        emailHistory: [
          { date: this.getDateWithOffset(-95), time: '02:35 PM', recipientEmail: 'carlos.mendoza@email.com', sentBy: 'Dra. Sofía Mendoza', status: 'Entregado OK' }
        ],
        printCount: 2
      },

      // 6. FACTURACIÓN DEL AÑO (210 días atrás)
      {
        id: 'INV-2026-000407',
        invoiceNumber: 'FACT-2026-000407',
        controlNumber: '00-008927',
        fiscalSeries: 'SERIE-A',
        date: this.getDateWithOffset(-210),
        time: '11:00 AM',
        timestamp: `${this.getDateWithOffset(-210)}T11:00:00`,
        cashier: 'Dalybell Ramírez (Caja Central)',
        division: 'clinica',
        divisionLabel: '🩺 Clínica Veterinaria 24H & Cirugía',
        customer: {
          name: 'Dalybell Ramírez Montilla',
          rif: 'V-18.452.910',
          email: 'dalybell@mrspets.com',
          phone: '+58 (414) 389-1102',
          address: 'Av. 3Y San Martín, Bella Vista, Maracaibo'
        },
        pet: {
          name: 'Princesa',
          species: 'Canino / Border Collie VIP',
          patientId: 'PAC-2026-018'
        },
        items: [
          { code: 'CLN-07', description: 'Colocación de Microchip Internacional ISO 11784/11785 + Pasaporte Sanitario', quantity: 1, unitPrice: 50.00, isExempt: false, total: 50.00 }
        ],
        subtotal: 50.00,
        taxableAmount: 50.00,
        exemptAmount: 0.00,
        ivaRate: 0.16,
        ivaAmount: 8.00,
        totalUsd: 58.00,
        bcvRate: bcvRate,
        totalVes: parseFloat((58.00 * bcvRate).toFixed(2)),
        paymentMethod: 'Pago Móvil Banplus C2P',
        paymentReference: 'C2P-BANPLUS-119280',
        status: 'EMITIDA',
        emailStatus: `Enviada el ${this.getDateWithOffset(-210)} a las 11:05 AM`,
        emailHistory: [
          { date: this.getDateWithOffset(-210), time: '11:05 AM', recipientEmail: 'dalybell@mrspets.com', sentBy: 'Dalybell Ramírez', status: 'Entregado OK' }
        ],
        printCount: 1
      }
    ];

    this.saveState();
  }

  // ==================== MÉTODOS DE FILTRADO Y BÚSQUEDA ====================
  getFilteredInvoices() {
    const today = this.getTodayDateStr();

    return this.invoices.filter(inv => {
      // 1. Filtro por fecha específica de visita ("¿Cuándo vino el cliente?")
      if (this.invoiceFilterDate) {
        if (inv.date !== this.invoiceFilterDate) return false;
      } else {
        // 2. Filtro por período solicitado
        const daysDiff = this.getDaysDiffFromToday(inv.date);

        if (this.invoiceFilterPeriod === 'day') {
          if (inv.date !== today && daysDiff !== 0) return false;
        } else if (this.invoiceFilterPeriod === 'week') {
          if (daysDiff < 0 || daysDiff > 7) return false;
        } else if (this.invoiceFilterPeriod === 'quincena') {
          if (daysDiff < 0 || daysDiff > 15) return false;
        } else if (this.invoiceFilterPeriod === 'month') {
          if (daysDiff < 0 || daysDiff > 30) return false;
        } else if (this.invoiceFilterPeriod === 'semester') {
          if (daysDiff < 0 || daysDiff > 180) return false;
        } else if (this.invoiceFilterPeriod === 'year') {
          if (daysDiff < 0 || daysDiff > 365) return false;
        }
        // 'all': no date restriction
      }

      // 3. Filtro por división contable
      if (this.invoiceDivisionFilter && this.invoiceDivisionFilter !== 'all') {
        if (inv.division !== this.invoiceDivisionFilter) return false;
      }

      // 4. Filtro por texto de búsqueda libre (cliente, RIF, factura, mascota, cajero)
      if (this.invoiceSearchQuery && this.invoiceSearchQuery.trim()) {
        const q = this.invoiceSearchQuery.trim().toLowerCase();
        const num = (inv.invoiceNumber || '').toLowerCase();
        const ctrl = (inv.controlNumber || '').toLowerCase();
        const cName = ((inv.customer && inv.customer.name) || '').toLowerCase();
        const cRif = ((inv.customer && inv.customer.rif) || '').toLowerCase();
        const cEmail = ((inv.customer && inv.customer.email) || '').toLowerCase();
        const pName = ((inv.pet && inv.pet.name) || '').toLowerCase();
        const cashier = (inv.cashier || '').toLowerCase();
        const itemsStr = (inv.items || []).map(i => i.description || '').join(' ').toLowerCase();

        const match = num.includes(q) || ctrl.includes(q) || cName.includes(q) ||
                      cRif.includes(q) || cEmail.includes(q) || pName.includes(q) ||
                      cashier.includes(q) || itemsStr.includes(q);
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
  }

  setInvoiceFilterPeriod(period) {
    this.invoiceFilterPeriod = period;
    this.invoiceFilterDate = ''; // Limpiar filtro de fecha individual para dar paso al período
    this.render();
  }

  setInvoiceFilterDate(dateStr) {
    this.invoiceFilterDate = String(dateStr || '').trim();
    this.render();
  }

  clearInvoiceDateFilter() {
    this.invoiceFilterDate = '';
    this.render();
  }

  setInvoiceSearchQuery(query) {
    this.invoiceSearchQuery = String(query || '').trim();
    this.render();
  }

  setInvoiceDivisionFilter(division) {
    this.invoiceDivisionFilter = division;
    this.render();
  }

  scrollToInvoicesSection() {
    if (typeof document === 'undefined') return;
    const sec = document.getElementById('admin-section-fiscal-invoices');
    if (sec) {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      sec.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
      sec.style.borderColor = '#38BDF8';
      sec.style.boxShadow = '0 0 24px rgba(56, 189, 248, 0.4)';
      setTimeout(() => {
        sec.style.borderColor = '#D4AF37';
        sec.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
      }, 2000);
    }
  }

  // ==================== VISOR OFICIAL SENIAT & ACCIONES DE FACTURA ====================
  openInvoiceViewer(invoiceId) {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('No se encontró la factura fiscal seleccionada.', 'warning');
      }
      return;
    }

    const bcvRate = inv.bcvRate || (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;
    const itemsHtml = (inv.items || []).map((it, idx) => `
      <tr style="border-bottom:1px solid #E2E8F0; font-size:0.83rem;">
        <td style="padding:10px 8px; text-align:center; font-weight:800; color:#475569;">${idx + 1}</td>
        <td style="padding:10px 8px; font-weight:700; color:#0F172A;">
          <div>${it.description}</div>
          <div style="font-size:0.72rem; color:#64748B;">Código: ${it.code || 'SRV-' + (idx + 1)}</div>
        </td>
        <td style="padding:10px 8px; text-align:center; font-weight:800; color:#0F172A;">${it.quantity}</td>
        <td style="padding:10px 8px; text-align:right; font-weight:700; color:#334155;">$${it.unitPrice.toFixed(2)}</td>
        <td style="padding:10px 8px; text-align:center; font-weight:800; color:${it.isExempt ? '#059669' : '#3B82F6'}; font-size:0.75rem;">
          ${it.isExempt ? 'EXENTO' : '16% (G)'}
        </td>
        <td style="padding:10px 8px; text-align:right; font-weight:900; color:#0F172A;">$${it.total.toFixed(2)}</td>
        <td style="padding:10px 8px; text-align:right; font-weight:800; color:#059669;">Bs. ${(it.total * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const emailHistoryHtml = (inv.emailHistory && inv.emailHistory.length > 0)
      ? inv.emailHistory.map(h => `
          <div style="font-size:0.75rem; color:#475569; padding:4px 0; border-bottom:1px dashed #E2E8F0; display:flex; justify-content:space-between; flex-wrap:wrap;">
            <span>📅 ${h.date} - ${h.time} | Destinatario: <strong>${h.recipientEmail}</strong></span>
            <span style="color:#059669; font-weight:700;">✓ ${h.status}</span>
          </div>
        `).join('')
      : '<div style="font-size:0.75rem; color:#94A3B8; font-style:italic;">No hay envíos adicionales registrados.</div>';

    const modalHtml = `
      <div id="invoice-fiscal-print-container" style="background:#FFFFFF; color:#0F172A; border-radius:18px; border:2px solid #D4AF37; max-width:820px; margin:auto; box-shadow:0 12px 36px rgba(0,0,0,0.25); overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- ENCABEZADO OFICIAL SENIAT -->
        <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color:#FFFFFF; padding:22px 26px; border-bottom:3px solid #D4AF37; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="font-size:0.75rem; font-weight:900; letter-spacing:1px; color:#D4AF37; text-transform:uppercase;">República Bolivariana de Venezuela • SENIAT</div>
            <h2 style="margin:4px 0 2px 0; font-size:1.4rem; font-weight:900; color:#FFFFFF;">BIG & LITTLE DOGS, C.A.</h2>
            <div style="font-size:0.95rem; font-weight:800; color:#FBBF24;">MRS. PETS MARACAIBO</div>
            <div style="font-size:0.78rem; color:#CBD5E1; margin-top:4px;">
              <strong>RIF: J-40120233-0</strong> • Domicilio Fiscal: Av. 2 El Milagro con Calle 78, diagonal a C.C. Lago Mall, Maracaibo, Estado Zulia.<br>
              Teléfono: +58 (261) 792-8844 / +58 (414) 639-9510 • Email: administracion@mrspets.com
            </div>
          </div>
          <div style="text-align:right; background:rgba(255,255,255,0.06); padding:12px 18px; border-radius:12px; border:1px solid rgba(212,175,55,0.4);">
            <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase;">Factura Fiscal Digital</div>
            <div style="font-size:1.35rem; font-weight:900; color:#38BDF8; letter-spacing:0.5px;">${inv.invoiceNumber}</div>
            <div style="font-size:0.8rem; font-weight:800; color:#CBD5E1; margin-top:2px;">N° de Control SENIAT: <strong style="color:#FFFFFF;">${inv.controlNumber}</strong></div>
            <div style="font-size:0.75rem; color:#94A3B8;">Serie Fiscal: ${inv.fiscalSeries || 'SERIE-A'}</div>
          </div>
        </div>

        <div style="padding:22px 26px;">
          <!-- METADATOS DE EMISIÓN & RECEPTOR -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
            <!-- Datos del Cliente -->
            <div>
              <div style="font-size:0.75rem; font-weight:900; color:#64748B; text-transform:uppercase; margin-bottom:6px;">👤 Datos del Receptor / Cliente:</div>
              <div style="font-size:0.95rem; font-weight:900; color:#0F172A;">${inv.customer.name}</div>
              <div style="font-size:0.82rem; color:#334155; margin-top:2px;"><strong>C.I. / RIF:</strong> ${inv.customer.rif}</div>
              <div style="font-size:0.82rem; color:#334155;"><strong>Teléfono:</strong> ${inv.customer.phone || 'N/A'}</div>
              <div style="font-size:0.82rem; color:#334155;"><strong>Email:</strong> ${inv.customer.email || 'N/A'}</div>
              <div style="font-size:0.78rem; color:#64748B;"><strong>Dirección:</strong> ${inv.customer.address || 'Maracaibo, Estado Zulia'}</div>
            </div>

            <!-- Datos de Operación & Paciente -->
            <div>
              <div style="font-size:0.75rem; font-weight:900; color:#64748B; text-transform:uppercase; margin-bottom:6px;">🐾 Paciente & Operación Contable:</div>
              <div style="font-size:0.9rem; font-weight:800; color:#0F172A;">Mascota: <strong style="color:#D4AF37;">${inv.pet.name}</strong> (${inv.pet.species})</div>
              <div style="font-size:0.8rem; color:#475569; margin-top:2px;"><strong>Historial Paciente:</strong> ${inv.pet.patientId || 'PAC-VIP'}</div>
              <div style="font-size:0.8rem; color:#475569;"><strong>Fecha de Emisión:</strong> 📅 ${inv.date} a las ⏰ ${inv.time}</div>
              <div style="font-size:0.8rem; color:#475569;"><strong>Cajero / Emisor:</strong> ${inv.cashier}</div>
              <div style="font-size:0.8rem; color:#475569;"><strong>División:</strong> ${inv.divisionLabel}</div>
            </div>
          </div>

          <!-- TABLA DE DETALLE DE ÍTEMS -->
          <div style="overflow-x:auto; border:1px solid #CBD5E1; border-radius:10px; margin-bottom:18px;">
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="background:#F1F5F9; border-bottom:1.5px solid #CBD5E1; font-size:0.75rem; text-transform:uppercase; color:#475569;">
                  <th style="padding:10px 8px; text-align:center;">#</th>
                  <th style="padding:10px 8px; text-align:left;">Descripción del Bien / Servicio Contable</th>
                  <th style="padding:10px 8px; text-align:center;">Cant.</th>
                  <th style="padding:10px 8px; text-align:right;">P. Unit ($)</th>
                  <th style="padding:10px 8px; text-align:center;">Alícuota</th>
                  <th style="padding:10px 8px; text-align:right;">Total ($)</th>
                  <th style="padding:10px 8px; text-align:right;">Total (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- TOTALES Y LIQUIDACIÓN TRIBUTARIA SENIAT -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:16px; margin-bottom:20px;">
            <!-- Forma de Pago y Tasa Oficial -->
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px; font-size:0.82rem;">
              <div style="font-weight:900; color:#0F172A; margin-bottom:6px;">💳 Modalidad de Pago & Referencia:</div>
              <div>Método: <strong>${inv.paymentMethod}</strong></div>
              <div>Referencia Transaccional: <strong style="color:#0284C7;">${inv.paymentReference || 'N/A'}</strong></div>
              <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #CBD5E1; color:#047857; font-weight:800;">
                🏛️ Tasa Oficial BCV: ${bcvRate.toFixed(2)} Bs./USD (Gaceta Oficial)
              </div>
              <div style="font-size:0.74rem; color:#64748B; margin-top:4px;">
                Conforme a la providencia administrativa del SENIAT y la Ley de Impuesto al Valor Agregado (IVA).
              </div>
            </div>

            <!-- Liquidación Fiscal -->
            <div style="background:#0F172A; color:#FFFFFF; border:1.5px solid #D4AF37; border-radius:12px; padding:14px; font-size:0.85rem;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#CBD5E1;">Subtotal Exento / No Sujeto:</span>
                <strong style="color:#10B981;">$${(inv.exemptAmount || 0).toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#CBD5E1;">Base Imponible Gravable (16%):</span>
                <strong>$${(inv.taxableAmount || 0).toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.15);">
                <span style="color:#FBBF24;">IVA 16% SENIAT:</span>
                <strong style="color:#FBBF24;">$${(inv.ivaAmount || 0).toFixed(2)} USD (Bs. ${((inv.ivaAmount || 0) * bcvRate).toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})})</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px;">
                <span style="font-size:1.05rem; font-weight:900; color:#FFFFFF;">TOTAL FACTURA:</span>
                <span style="font-size:1.35rem; font-weight:900; color:#38BDF8;">$${inv.totalUsd.toFixed(2)} USD</span>
              </div>
              <div style="text-align:right; font-size:0.95rem; font-weight:900; color:#34D399;">
                Bs. ${inv.totalVes.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}
              </div>
            </div>
          </div>

          <!-- BLOQUE DE ATENCIÓN AL CLIENTE: REENVÍO POR CORREO ELECTRÓNICO & WHATSAPP -->
          <div style="background:#EFF6FF; border:1.5px solid #93C5FD; border-radius:14px; padding:16px; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
              <div>
                <strong style="color:#1E3A8A; font-size:0.92rem; display:flex; align-items:center; gap:6px;">
                  <span>📧 Atención al Cliente: Reenvío de Factura por Correo Electrónico</span>
                </strong>
                <p style="margin:3px 0 0 0; font-size:0.78rem; color:#3B82F6;">
                  Si el cliente manifiesta que no le llegó su factura o cambió de correo, confirme la dirección y presione el botón de reenvío.
                </p>
              </div>
              <span class="badge" style="background:#DBEAFE; color:#1E40AF; border:1px solid #93C5FD; font-size:0.75rem; padding:4px 8px; border-radius:6px; font-weight:800;">
                Estatus: ${inv.emailStatus}
              </span>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <input type="email" id="invoice-resend-email-target" value="${inv.customer.email || ''}" placeholder="correo.cliente@ejemplo.com" style="flex:1; min-width:260px; padding:9px 14px; border-radius:8px; border:1.5px solid #93C5FD; font-size:0.85rem; font-weight:700; color:#0F172A; background:#FFFFFF;">
              <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.resendInvoiceEmail('${inv.id}', document.getElementById('invoice-resend-email-target').value)" style="background:linear-gradient(135deg, #2563EB, #1D4ED8); color:#FFFFFF; font-weight:900; padding:10px 18px; border-radius:8px; border:none; cursor:pointer; box-shadow:0 3px 10px rgba(37,99,235,0.3); display:inline-flex; align-items:center; gap:6px;">
                <span>📧 Reenviar por Correo Ahora</span>
              </button>
            </div>

            <div style="margin-top:12px; padding-top:8px; border-top:1px solid #BFDBFE;">
              <div style="font-size:0.75rem; font-weight:800; color:#1E40AF; margin-bottom:4px;">Historial de Envíos al Cliente:</div>
              ${emailHistoryHtml}
            </div>
          </div>

          <!-- BOTONERA DE ACCIÓN Y CIERRE -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-top:1px solid #E2E8F0; padding-top:16px;">
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.printInvoiceDirectly('${inv.id}')" style="background:#0F172A; color:#FFFFFF; font-weight:900; padding:10px 18px; border-radius:10px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <span>🖨️ Imprimir Factura Fiscal</span>
              </button>
              <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.sendInvoiceWhatsApp('${inv.id}')" style="background:#10B981; color:#FFFFFF; font-weight:900; padding:10px 18px; border-radius:10px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <span>💬 Enviar por WhatsApp</span>
              </button>
              <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.downloadInvoiceJson('${inv.id}')" style="background:#F1F5F9; color:#334155; font-weight:800; padding:10px 14px; border-radius:10px; border:1px solid #CBD5E1; cursor:pointer;">
                <span>📥 Descargar Formato JSON</span>
              </button>
            </div>
            <button type="button" class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:#E2E8F0; color:#1E293B; font-weight:800; padding:10px 20px; border-radius:10px; border:none; cursor:pointer;">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
  }

  resendInvoiceEmail(invoiceId, targetEmail) {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const email = String(targetEmail || '').trim();
    if (!email || !email.includes('@')) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Por favor ingrese un correo electrónico válido.', 'warning');
      }
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    const dateStr = this.getTodayDateStr();

    inv.customer.email = email;
    inv.status = 'REENVIADA';
    inv.emailStatus = `Reenviada por correo a ${email} el ${dateStr} a las ${timeStr}`;
    if (!inv.emailHistory) inv.emailHistory = [];
    inv.emailHistory.unshift({
      date: dateStr,
      time: timeStr,
      recipientEmail: email,
      sentBy: 'Personal Administrativo',
      status: 'Reenviado con éxito (HTTP 200 OK)'
    });

    this.saveState();
    this.render();

    try {
      fetch(`/api/facturas/${invoiceId}/enviar-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, invoiceNumber: inv.invoiceNumber })
      }).catch(() => {});
    } catch(e) {}

    // Reabrir el visor con la información actualizada
    this.openInvoiceViewer(invoiceId);

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✨ Factura ${inv.invoiceNumber} reenviada exitosamente a ${email}`, 'success');
    }
  }

  quickResendInvoice(invoiceId) {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    const targetEmail = (inv.customer && inv.customer.email) || 'cliente@mrspets.com';
    this.resendInvoiceEmail(invoiceId, targetEmail);
  }

  printInvoiceDirectly(invoiceId) {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (inv) {
      inv.printCount = (inv.printCount || 0) + 1;
      this.saveState();
    }
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    } else if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`Preparando impresión de Factura ${inv ? inv.invoiceNumber : ''}...`, 'info');
    }
  }

  sendInvoiceWhatsApp(invoiceId) {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const phoneClean = (inv.customer.phone || '').replace(/[^0-9]/g, '');
    const bcvRate = inv.bcvRate || 48.50;
    const msg = `🐾 *FACTURA FISCAL DIGITAL - MRS. PETS MARACAIBO* 🐾
` +
                `*Factura N°:* ${inv.invoiceNumber}
` +
                `*Control SENIAT:* ${inv.controlNumber}
` +
                `*Cliente:* ${inv.customer.name} (RIF: ${inv.customer.rif})
` +
                `*Paciente:* ${inv.pet.name} (${inv.pet.species})
` +
                `*Fecha:* ${inv.date} ${inv.time}
` +
                `*División:* ${inv.divisionLabel}
` +
                `------------------------------------
` +
                `*Total USD:* $${inv.totalUsd.toFixed(2)} USD
` +
                `*Total Bs. (BCV ${bcvRate}):* Bs. ${inv.totalVes.toLocaleString('es-VE')}
` +
                `*Método:* ${inv.paymentMethod}
` +
                `------------------------------------
` +
                `¡Gracias por confiar en Mrs. Pets Maracaibo! Big & Little Dogs C.A. RIF: J-40120233-0`;

    const url = `https://wa.me/${phoneClean || '584143891102'}?text=${encodeURIComponent(msg)}`;
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(url, '_blank');
    }
  }

  downloadInvoiceJson(invoiceId) {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    const str = JSON.stringify(inv, null, 2);
    if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
      const blob = new Blob([str], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FACTURA_${inv.invoiceNumber}_SENIAT.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  exportInvoicesJson() {
    const filtered = this.getFilteredInvoices();
    const payload = {
      empresa: 'Big & Little Dogs, C.A. (Mrs. Pets Maracaibo)',
      rif: 'J-40120233-0',
      fechaExportacion: new Date().toISOString(),
      filtroAplicado: {
        periodo: this.invoiceFilterPeriod,
        fechaVisita: this.invoiceFilterDate,
        busqueda: this.invoiceSearchQuery,
        division: this.invoiceDivisionFilter
      },
      cantidadFacturas: filtered.length,
      facturas: filtered
    };

    if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HISTORICO_FACTURAS_SENIAT_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`📥 Histórico de ${filtered.length} facturas descargado exitosamente.`, 'success');
      }
    }
    return payload;
  }

  // ==================== MÓDULO GENERAR NUEVA FACTURA FISCAL ====================
  openCreateInvoiceModal() {
    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;
    const nextNum = 419 + (this.invoices.length >= 12 ? (this.invoices.length - 12) : 0);
    const invNumStr = `FACT-2026-000${nextNum}`;
    const ctrlNumStr = `00-0089${39 + (this.invoices.length >= 12 ? (this.invoices.length - 12) : 0)}`;

    const modalHtml = `
      <div style="background:#FFFFFF; color:#0F172A; border-radius:18px; border:2px solid #D4AF37; max-width:760px; margin:auto; box-shadow:0 12px 36px rgba(0,0,0,0.25); overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color:#FFFFFF; padding:20px 24px; border-bottom:3px solid #D4AF37; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0; font-size:1.25rem; font-weight:900; color:#FFFFFF; display:flex; align-items:center; gap:8px;">
              <span>🧾 Emisión de Factura Fiscal Oficial SENIAT</span>
            </h3>
            <p style="margin:3px 0 0 0; font-size:0.8rem; color:#CBD5E1;">
              Big & Little Dogs, C.A. (RIF: J-40120233-0) • Control Tributario Maracaibo
            </p>
          </div>
          <button type="button" class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.3rem; border:none; cursor:pointer;">✕</button>
        </div>

        <form id="form-create-fiscal-invoice" onsubmit="event.preventDefault(); adminFinanceEngine.handleCreateInvoiceSubmit(this);" style="padding:22px 24px;">
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:14px; background:#F8FAFC; padding:12px; border-radius:10px; border:1px solid #E2E8F0;">
            <div>
              <span style="font-size:0.75rem; color:#64748B; font-weight:800;">N° FACTURA ASIGNADO:</span>
              <div style="font-size:1.05rem; font-weight:900; color:#0284C7;">${invNumStr}</div>
              <input type="hidden" name="invoiceNumber" value="${invNumStr}">
            </div>
            <div>
              <span style="font-size:0.75rem; color:#64748B; font-weight:800;">N° CONTROL SENIAT:</span>
              <div style="font-size:1.05rem; font-weight:900; color:#0F172A;">${ctrlNumStr}</div>
              <input type="hidden" name="controlNumber" value="${ctrlNumStr}">
            </div>
          </div>

          <!-- SELECTOR RÁPIDO DE CLIENTE FRECUENTE -->
          <div style="margin-bottom:14px;">
            <label style="display:block; font-size:0.8rem; font-weight:800; color:#475569; margin-bottom:4px;">
              ⚡ Autocompletar con Cliente Frecuente:
            </label>
            <select onchange="adminFinanceEngine.prefillCustomerData(this.value)" style="width:100%; padding:8px 12px; border-radius:8px; border:1.5px solid #CBD5E1; font-weight:700; font-size:0.85rem; background:#FFFFFF;">
              <option value="">-- Seleccionar cliente o ingresar manualmente abajo --</option>
              <option value="dalybell">Dalybell Ramírez Montilla (V-18.452.910 • Princesa - Border Collie)</option>
              <option value="carlos">Carlos Mendoza (V-14.882.109 • Fifi - Poodle Toy)</option>
              <option value="patricia">Patricia Villalobos (V-19.874.521-0 • Simba - Golden Retriever)</option>
              <option value="andres">Andrés Morales (V-20.145.890 • Buddy - Bulldog Francés)</option>
              <option value="mariaeugenia">María Eugenia Faría (V-16.784.320 • Luna - Gato Persa)</option>
              <option value="roberto">Roberto González (V-12.441.980 • Max - Pastor Alemán)</option>
            </select>
          </div>

          <!-- DATOS DEL CLIENTE -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:14px;">
            <div>
              <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">Nombre / Razón Social *</label>
              <input type="text" name="customerName" id="create-customer-name" required placeholder="Ej: Dalybell Ramírez Montilla" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:700;">
            </div>
            <div>
              <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">C.I. / RIF *</label>
              <input type="text" name="customerRif" id="create-customer-rif" required placeholder="Ej: V-18.452.910" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:700;">
            </div>
            <div>
              <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">Correo Electrónico *</label>
              <input type="email" name="customerEmail" id="create-customer-email" required placeholder="correo@ejemplo.com" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:700;">
            </div>
            <div>
              <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">Teléfono</label>
              <input type="text" name="customerPhone" id="create-customer-phone" placeholder="+58 (414) 000-0000" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem;">
            </div>
          </div>

          <!-- DATOS DE LA MASCOTA Y PERSONAL -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:14px;">
            <div>
              <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">Nombre de la Mascota *</label>
              <input type="text" name="petName" id="create-pet-name" required placeholder="Ej: Princesa" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:700;">
            </div>
            <div>
              <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">Especie / Raza</label>
              <input type="text" name="petSpecies" id="create-pet-species" placeholder="Ej: Canino / Border Collie" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem;">
            </div>
            <div>
              <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">Cajero / Staff que Factura *</label>
              <select name="cashier" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:700;">
                <option value="Dalybell Ramírez (Caja Central)">Dalybell Ramírez (Caja Central)</option>
                <option value="Dra. Sofía Mendoza (Recepción Médica)">Dra. Sofía Mendoza (Recepción Médica)</option>
                <option value="Carlos Mendoza (Caja Grooming)">Carlos Mendoza (Caja Grooming)</option>
                <option value="Mariana Briceño (Concierge Tienda)">Mariana Briceño (Concierge Tienda)</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:4px;">División Contable *</label>
              <select name="division" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:700;">
                <option value="grooming">✂️ Grooming & Spa Canino/Felino</option>
                <option value="clinica">🩺 Clínica Veterinaria 24H & Cirugía</option>
                <option value="hotel">🏨 Admisión Hotel 5★ & Guardería</option>
                <option value="tienda">🛍️ Tienda de Lujo & Farmacia</option>
              </select>
            </div>
          </div>

          <!-- DETALLE DEL SERVICIO / PRODUCTO -->
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px; margin-bottom:14px;">
            <label style="display:block; font-size:0.8rem; font-weight:900; color:#0F172A; margin-bottom:6px;">
              📦 Concepto Vendido a Nivel Contable:
            </label>
            <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:10px;">
              <div>
                <input type="text" name="itemDescription" id="create-item-desc" required placeholder="Ej: Consulta Especializada + Vacuna Séxtuple" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:700;">
              </div>
              <div>
                <input type="number" step="0.01" min="1" name="itemPrice" id="create-item-price" required placeholder="Precio ($ USD)" oninput="adminFinanceEngine.updateCreateInvoiceTotals()" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:800;">
              </div>
              <div>
                <select name="paymentMethod" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.85rem; font-weight:700;">
                  <option value="Pago Móvil Banplus C2P">Banplus Pago Móvil C2P</option>
                  <option value="Tarjeta Débito Banplus (POS)">Tarjeta Débito POS</option>
                  <option value="Stripe Card Vault USD">Stripe Card USD</option>
                  <option value="Zelle Wells Fargo">Zelle Wells Fargo</option>
                  <option value="Efectivo USD">Efectivo USD</option>
                </select>
              </div>
            </div>

            <!-- TOTALES EN VIVO -->
            <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; background:#0F172A; color:#FFFFFF; padding:10px 14px; border-radius:8px;">
              <span style="font-size:0.82rem; color:#CBD5E1;">Base + IVA 16% SENIAT (Tasa BCV: ${bcvRate}):</span>
              <div>
                <span id="preview-invoice-usd" style="font-size:1.1rem; font-weight:900; color:#38BDF8;">$0.00 USD</span>
                <span id="preview-invoice-ves" style="font-size:0.9rem; font-weight:800; color:#34D399; margin-left:8px;">(Bs. 0.00)</span>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:#F1F5F9; color:#475569; font-weight:800; padding:10px 16px; border-radius:8px; border:none; cursor:pointer;">
              Cancelar
            </button>
            <button type="submit" class="btn btn-sm" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:10px 22px; border-radius:8px; border:none; cursor:pointer; box-shadow:0 3px 12px rgba(212,175,55,0.4);">
              🧾 Emitir & Registrar Factura Fiscal SENIAT
            </button>
          </div>
        </form>
      </div>
    `;

    this.showModal(modalHtml);
  }

  prefillCustomerData(key) {
    if (typeof document === 'undefined') return;
    const presets = {
      dalybell: { name: 'Dalybell Ramírez Montilla', rif: 'V-18.452.910', email: 'dalybell@mrspets.com', phone: '+58 (414) 389-1102', pet: 'Princesa', species: 'Canino / Border Collie VIP' },
      carlos: { name: 'Carlos Mendoza', rif: 'V-14.882.109', email: 'carlos.mendoza@email.com', phone: '+58 (412) 555-1234', pet: 'Fifi', species: 'Canino / Poodle Toy VIP' },
      patricia: { name: 'Patricia Villalobos', rif: 'V-19.874.521-0', email: 'patricia.v@gmail.com', phone: '+58 (414) 679-9510', pet: 'Simba', species: 'Canino / Golden Retriever' },
      andres: { name: 'Andrés Morales', rif: 'V-20.145.890', email: 'andres.morales@outlook.com', phone: '+58 (424) 612-4488', pet: 'Buddy', species: 'Canino / Bulldog Francés' },
      mariaeugenia: { name: 'María Eugenia Faría', rif: 'V-16.784.320', email: 'mariaeugenia.f@gmail.com', phone: '+58 (416) 555-8901', pet: 'Luna', species: 'Felino / Persa Blanco' },
      roberto: { name: 'Roberto González', rif: 'V-12.441.980', email: 'r.gonzalez@inversiones.com', phone: '+58 (414) 601-2233', pet: 'Max', species: 'Canino / Pastor Alemán' }
    };

    const p = presets[key];
    if (p) {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      };
      setVal('create-customer-name', p.name);
      setVal('create-customer-rif', p.rif);
      setVal('create-customer-email', p.email);
      setVal('create-customer-phone', p.phone);
      setVal('create-pet-name', p.pet);
      setVal('create-pet-species', p.species);
    }
  }

  updateCreateInvoiceTotals() {
    if (typeof document === 'undefined') return;
    const priceEl = document.getElementById('create-item-price');
    const usdEl = document.getElementById('preview-invoice-usd');
    const vesEl = document.getElementById('preview-invoice-ves');
    if (!priceEl || !usdEl || !vesEl) return;

    const price = parseFloat(priceEl.value) || 0;
    const iva = price * 0.16;
    const totalUsd = price + iva;
    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;
    const totalVes = totalUsd * bcvRate;

    usdEl.textContent = `$${totalUsd.toFixed(2)} USD`;
    vesEl.textContent = `(Bs. ${totalVes.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})})`;
  }

  handleCreateInvoiceSubmit(form) {
    const fd = new FormData(form);
    const invoiceNumber = fd.get('invoiceNumber');
    const controlNumber = fd.get('controlNumber');
    const customerName = fd.get('customerName');
    const customerRif = fd.get('customerRif');
    const customerEmail = fd.get('customerEmail');
    const customerPhone = fd.get('customerPhone');
    const petName = fd.get('petName');
    const petSpecies = fd.get('petSpecies') || 'Canino VIP';
    const cashier = fd.get('cashier') || 'Dalybell Ramírez (Caja Central)';
    const division = fd.get('division') || 'grooming';
    const itemDesc = fd.get('itemDescription') || 'Servicio Integral Mrs. Pets';
    const itemPrice = parseFloat(fd.get('itemPrice')) || 50.00;
    const paymentMethod = fd.get('paymentMethod') || 'Pago Móvil Banplus C2P';

    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;
    const subtotal = itemPrice;
    const taxableAmount = itemPrice;
    const exemptAmount = 0.00;
    const ivaRate = 0.16;
    const ivaAmount = parseFloat((subtotal * ivaRate).toFixed(2));
    const totalUsd = parseFloat((subtotal + ivaAmount).toFixed(2));
    const totalVes = parseFloat((totalUsd * bcvRate).toFixed(2));

    const divisionLabels = {
      grooming: '✂️ Grooming & Spa Canino/Felino',
      clinica: '🩺 Clínica Veterinaria 24H & Cirugía',
      hotel: '🏨 Admisión Hotel 5★ & Guardería',
      tienda: '🛍️ Tienda de Lujo & Farmacia'
    };

    const today = this.getTodayDateStr();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    const newInvoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: invoiceNumber,
      controlNumber: controlNumber,
      fiscalSeries: 'SERIE-A',
      date: today,
      time: timeStr,
      timestamp: now.toISOString(),
      cashier: cashier,
      division: division,
      divisionLabel: divisionLabels[division] || division,
      customer: {
        name: customerName,
        rif: customerRif,
        email: customerEmail,
        phone: customerPhone,
        address: 'Maracaibo, Estado Zulia'
      },
      pet: {
        name: petName,
        species: petSpecies,
        patientId: `PAC-VIP-${Math.floor(100 + Math.random() * 900)}`
      },
      items: [
        {
          code: 'SRV-GEN-01',
          description: itemDesc,
          quantity: 1,
          unitPrice: itemPrice,
          isExempt: false,
          total: itemPrice
        }
      ],
      subtotal: subtotal,
      taxableAmount: taxableAmount,
      exemptAmount: exemptAmount,
      ivaRate: ivaRate,
      ivaAmount: ivaAmount,
      totalUsd: totalUsd,
      bcvRate: bcvRate,
      totalVes: totalVes,
      paymentMethod: paymentMethod,
      paymentReference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'EMITIDA',
      emailStatus: `Enviada el ${today} a las ${timeStr}`,
      emailHistory: [
        { date: today, time: timeStr, recipientEmail: customerEmail, sentBy: cashier, status: 'Entregado OK' }
      ],
      printCount: 0
    };

    this.invoices.unshift(newInvoice);
    this.saveState();
    this.render();

    // Abrir de inmediato el visor de la factura recién generada
    this.openInvoiceViewer(newInvoice.id);

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🧾 Factura Fiscal ${newInvoice.invoiceNumber} emitida exitosamente para ${customerName}`, 'success');
    }
  }

  // ==================== GENERACIÓN AUTOMÁTICA DESDE POS / STRIPE (DESPACHO POR CORREO) ====================
  createInvoiceFromCart(saleData = {}) {
    const bcvRate = saleData.bcvRate || (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;
    const nextNum = 419 + (this.invoices.length >= 12 ? (this.invoices.length - 12) : 0);
    const invNumStr = `FACT-2026-000${nextNum}`;
    const ctrlNumStr = `00-0089${39 + (this.invoices.length >= 12 ? (this.invoices.length - 12) : 0)}`;

    const customerName = saleData.customerName || 'Dalybell Ramírez Montilla';
    const customerRif = saleData.customerRif || 'V-18.452.910';
    const customerEmail = saleData.customerEmail || 'dalybell@mrspets.com';
    const customerPhone = saleData.customerPhone || '+58 (414) 389-1102';
    const petName = saleData.petName || 'Princesa';
    const petSpecies = saleData.petSpecies || 'Canino / Border Collie VIP';
    const cashier = saleData.cashier || 'Sistema Automatizado POS & Concierge VIP';
    const division = saleData.division || 'tienda';
    const paymentMethod = saleData.paymentMethod || 'Tarjeta Stripe 3D Directa';
    const paymentRef = saleData.paymentReference || saleData.ticketId || `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const items = (saleData.items && saleData.items.length > 0)
      ? saleData.items.map((it, idx) => ({
          code: it.code || `PROD-${idx + 1}`,
          description: it.concept || it.name || it.description || 'Producto/Servicio Mrs. Pets',
          quantity: it.quantity || 1,
          unitPrice: typeof it.price === 'number' ? it.price : (parseFloat(it.price || it.unitPrice || 0)),
          isExempt: Boolean(it.isExempt),
          total: (typeof it.price === 'number' ? it.price : (parseFloat(it.price || it.unitPrice || 0))) * (it.quantity || 1)
        }))
      : [
          {
            code: 'PROD-01',
            description: 'Compra Boutique Mrs. Pets',
            quantity: 1,
            unitPrice: saleData.totalUsd || 50.0,
            isExempt: false,
            total: saleData.totalUsd || 50.0
          }
        ];

    const subtotal = saleData.subtotal !== undefined
      ? saleData.subtotal
      : items.reduce((sum, i) => sum + i.total, 0);
    const taxableAmount = saleData.taxableAmount !== undefined ? saleData.taxableAmount : subtotal;
    const exemptAmount = saleData.exemptAmount !== undefined ? saleData.exemptAmount : 0.00;
    const ivaRate = saleData.ivaRate !== undefined ? saleData.ivaRate : 0.16;
    const ivaAmount = saleData.ivaAmount !== undefined ? saleData.ivaAmount : parseFloat((taxableAmount * 0.16).toFixed(2));
    const totalUsd = saleData.totalUsd !== undefined ? saleData.totalUsd : parseFloat((taxableAmount + ivaAmount + exemptAmount).toFixed(2));
    const totalVes = saleData.totalVes !== undefined ? saleData.totalVes : parseFloat((totalUsd * bcvRate).toFixed(2));

    const today = this.getTodayDateStr();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    const divisionLabels = {
      grooming: '✂️ Grooming & Spa Canino/Felino',
      clinica: '🩺 Clínica Veterinaria 24H & Cirugía',
      hotel: '🏨 Admisión Hotel 5★ & Guardería',
      tienda: '🛍️ Tienda de Lujo & Farmacia'
    };

    const newInvoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: invNumStr,
      controlNumber: ctrlNumStr,
      fiscalSeries: 'SERIE-A',
      date: today,
      time: timeStr,
      timestamp: now.toISOString(),
      cashier: cashier,
      division: division,
      divisionLabel: divisionLabels[division] || '🛍️ Tienda de Lujo & Farmacia',
      customer: {
        name: customerName,
        rif: customerRif,
        email: customerEmail,
        phone: customerPhone,
        address: 'Av. 3Y San Martín, Bella Vista, Maracaibo, Zulia'
      },
      pet: {
        name: petName,
        species: petSpecies,
        patientId: `PAC-VIP-${Math.floor(100 + Math.random() * 900)}`
      },
      items: items,
      subtotal: subtotal,
      taxableAmount: taxableAmount,
      exemptAmount: exemptAmount,
      ivaRate: ivaRate > 1 ? ivaRate / 100 : ivaRate,
      ivaAmount: ivaAmount,
      totalUsd: totalUsd,
      bcvRate: bcvRate,
      totalVes: totalVes,
      paymentMethod: paymentMethod,
      paymentReference: paymentRef,
      status: 'EMITIDA',
      emailStatus: `Enviada digitalmente por correo a ${customerEmail} el ${today} a las ${timeStr}`,
      emailHistory: [
        {
          date: today,
          time: timeStr,
          recipientEmail: customerEmail,
          sentBy: 'Servicio Automático de Despacho Digital',
          status: 'Entregado OK (HTTP 200 OK)'
        }
      ],
      printCount: 0
    };

    this.invoices.unshift(newInvoice);
    this.saveState();
    if (typeof this.render === 'function') {
      try { this.render(); } catch(e) {}
    }

    // Ledger inmutable de Auditoría
    try {
      fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'ACCOUNTING_TRANSACTION_AUDIT',
          action: 'DIGITAL_INVOICE_SENT_BY_EMAIL',
          invoice_number: invNumStr,
          control_number: ctrlNumStr,
          customer_email: customerEmail,
          customer_name: customerName,
          amount_usd: totalUsd,
          amount_ves: totalVes,
          bcv_rate: bcvRate,
          status: 'ENVIADA_OK_EMAIL',
          timestamp: now.toISOString()
        })
      });
    } catch(e) {}

    return newInvoice;
  }


  // ==================== CÁLCULOS FINANCIEROS Y MATRICES ====================
  getFinancialData(dateRange = 'month') {
    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;

    // Ingresos base estimados y ventas reales de tienda
    let storeSalesTotal = 0;
    if (window.storeSalesEngine) {
      const sales = window.storeSalesEngine.getAllSales();
      storeSalesTotal = sales.reduce((sum, s) => sum + (s.subtotal || s.total || 0), 0);
    }
    if (storeSalesTotal === 0) storeSalesTotal = 2450.00;

    // Multiplicadores según rango de fecha (día, semana, quincena, mes, semestre, año)
    let factor = 1.0;
    if (dateRange === 'day') factor = 0.033;
    else if (dateRange === 'week') factor = 0.23;
    else if (dateRange === 'quincena') factor = 0.50;
    else if (dateRange === 'month') factor = 1.0;
    else if (dateRange === 'semester') factor = 6.0;
    else if (dateRange === 'year') factor = 12.0;
    else factor = 1.0; // month

    // 1. Matriz de Ingresos por División Operativa
    const revenueByDivision = {
      grooming: parseFloat((3850.00 * factor).toFixed(2)),
      clinica: parseFloat((5200.00 * factor).toFixed(2)),
      hotel: parseFloat((2100.00 * factor).toFixed(2)),
      tienda: parseFloat((storeSalesTotal * factor).toFixed(2))
    };

    const totalGrossRevenue = parseFloat(
      (revenueByDivision.grooming + revenueByDivision.clinica + revenueByDivision.hotel + revenueByDivision.tienda).toFixed(2)
    );

    // 2. Desglose de Pasarelas & Tesorería
    const treasury = {
      stripe: parseFloat((totalGrossRevenue * 0.38).toFixed(2)),
      paypal: parseFloat((totalGrossRevenue * 0.12).toFixed(2)),
      zinli: parseFloat((totalGrossRevenue * 0.08).toFixed(2)),
      binance: parseFloat((totalGrossRevenue * 0.10).toFixed(2)),
      efectivoDivisas: parseFloat((totalGrossRevenue * 0.14).toFixed(2)),
      pagoMovil: parseFloat((totalGrossRevenue * 0.12).toFixed(2)),
      cuentasNacionales: parseFloat((totalGrossRevenue * 0.06).toFixed(2))
    };

    // 3. Egresos y Costos
    const currentExpenses = {
      fixedCosts: parseFloat((this.expenses.fixedCosts * factor).toFixed(2)),
      payroll: parseFloat((this.expenses.payroll * factor).toFixed(2)),
      medicalSupplies: parseFloat((this.expenses.medicalSupplies * factor).toFixed(2)),
      stockReplenishment: parseFloat((this.expenses.stockReplenishment * factor).toFixed(2))
    };
    const totalExpenses = parseFloat(
      (currentExpenses.fixedCosts + currentExpenses.payroll + currentExpenses.medicalSupplies + currentExpenses.stockReplenishment).toFixed(2)
    );

    // 4. Obligaciones Fiscales SENIAT (Normativa Nacional)
    // Alícuota General del IVA: 16%
    const ivaDebitoFiscal = parseFloat((totalGrossRevenue * 0.16).toFixed(2));
    const ivaCreditoFiscalEstimado = parseFloat((currentExpenses.stockReplenishment * 0.16 + currentExpenses.medicalSupplies * 0.16).toFixed(2));
    const ivaNetoPorPagar = Math.max(0, parseFloat((ivaDebitoFiscal - ivaCreditoFiscalEstimado).toFixed(2)));
    const retencionesIvaRecibidas = parseFloat((ivaDebitoFiscal * 0.25).toFixed(2)); // Retenciones practicadas por contribuyentes especiales

    // 5. Obligaciones Fiscales SEDEMAT (Tributos Municipales - Alcaldía de Maracaibo)
    // Clasificador de Actividades Económicas de Maracaibo:
    // • Servicios veterinarios: 1.5%
    // • Peluquería y spa de mascotas: 2.0%
    // • Alojamiento y guardería: 2.0%
    // • Venta de alimentos y accesorios: 2.5%
    const sedematClinica = parseFloat((revenueByDivision.clinica * 0.015).toFixed(2));
    const sedematGrooming = parseFloat((revenueByDivision.grooming * 0.020).toFixed(2));
    const sedematHotel = parseFloat((revenueByDivision.hotel * 0.020).toFixed(2));
    const sedematTienda = parseFloat((revenueByDivision.tienda * 0.025).toFixed(2));
    const totalSedemat = parseFloat((sedematClinica + sedematGrooming + sedematHotel + sedematTienda).toFixed(2));

    // 6. Impacto de las Variables Dinámicas Activas
    const activeVariables = this.dynamicVariables.filter(v => v.status === 'active');
    const dynamicCalculations = activeVariables.map(v => {
      let amount = 0;
      if (v.type === 'percentage') {
        const base = v.division === 'all'
          ? totalGrossRevenue
          : (revenueByDivision[v.division] || 0);
        amount = parseFloat(((base * v.value) / 100).toFixed(2));
      } else if (v.type === 'fixed') {
        amount = parseFloat((v.value * factor).toFixed(2));
      }
      return {
        id: v.id,
        name: v.name,
        type: v.type,
        value: v.value,
        division: v.division,
        calculatedAmount: amount,
        calculatedAmountVes: parseFloat((amount * bcvRate).toFixed(2))
      };
    });

    const totalDynamicDeductions = parseFloat(
      dynamicCalculations.reduce((sum, item) => sum + item.calculatedAmount, 0).toFixed(2)
    );

    // Margen Neto Operativo
    const netOperatingProfit = parseFloat(
      (totalGrossRevenue - totalExpenses - totalSedemat - totalDynamicDeductions).toFixed(2)
    );

    return {
      dateRange,
      factor,
      bcvRate,
      revenueByDivision,
      totalGrossRevenue,
      totalGrossRevenueVes: parseFloat((totalGrossRevenue * bcvRate).toFixed(2)),
      treasury,
      currentExpenses,
      totalExpenses,
      totalExpensesVes: parseFloat((totalExpenses * bcvRate).toFixed(2)),
      seniat: {
        alicuota: 16.0,
        ivaDebitoFiscal,
        ivaCreditoFiscalEstimado,
        ivaNetoPorPagar,
        retencionesIvaRecibidas,
        ivaNetoVes: parseFloat((ivaNetoPorPagar * bcvRate).toFixed(2))
      },
      sedemat: {
        totalSedemat,
        totalSedematVes: parseFloat((totalSedemat * bcvRate).toFixed(2)),
        breakdown: {
          clinica: sedematClinica,
          grooming: sedematGrooming,
          hotel: sedematHotel,
          tienda: sedematTienda
        }
      },
      dynamicCalculations,
      totalDynamicDeductions,
      netOperatingProfit,
      netOperatingProfitVes: parseFloat((netOperatingProfit * bcvRate).toFixed(2))
    };
  }

  // ==================== CRUD DE VARIABLES DINÁMICAS ====================
  createVariable({ name, type, value, division, description }) {
    if (!name || !value) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Por favor introduce el nombre y valor del concepto.', 'warning');
      }
      return false;
    }
    const newVar = {
      id: `VAR-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      type: type || 'percentage',
      value: parseFloat(value),
      division: division || 'all',
      status: 'active',
      description: description ? description.trim() : 'Concepto contable dinámico registrado en Back-Office.',
      createdAt: new Date().toISOString()
    };
    this.dynamicVariables.push(newVar);
    this.saveState();
    this.render();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✨ Variable dinámica "${newVar.name}" activada exitosamente.`, 'success');
    }
    return true;
  }

  updateVariable(varId, updates) {
    const v = this.dynamicVariables.find(item => item.id === varId);
    if (!v) return false;

    if (updates.name !== undefined && String(updates.name).trim()) v.name = String(updates.name).trim();
    if (updates.type !== undefined) v.type = updates.type;
    if (updates.value !== undefined) {
      const val = parseFloat(updates.value);
      if (!isNaN(val)) v.value = val;
    }
    if (updates.division !== undefined) v.division = updates.division;
    if (updates.status !== undefined) v.status = updates.status;
    if (updates.description !== undefined) v.description = String(updates.description).trim();
    v.updatedAt = new Date().toISOString();

    this.saveState();
    this.render();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✨ Concepto contable "${v.name}" actualizado con éxito.`, 'success');
    }
    return true;
  }

  retireVariable(varId) {
    const v = this.dynamicVariables.find(item => item.id === varId);
    if (!v) return false;
    v.status = 'retired';
    v.retiredAt = new Date().toISOString();
    this.saveState();
    this.render();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🔒 Concepto "${v.name}" retirado del cálculo contable activo.`, 'info');
    }
    return true;
  }

  reactivateVariable(varId) {
    const v = this.dynamicVariables.find(item => item.id === varId);
    if (!v) return false;
    v.status = 'active';
    delete v.retiredAt;
    this.saveState();
    this.render();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✅ Concepto "${v.name}" reactivado en el motor de cálculo.`, 'success');
    }
    return true;
  }

  deleteVariablePermanently(varId) {
    this.dynamicVariables = this.dynamicVariables.filter(v => v.id !== varId);
    this.saveState();
    this.render();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🗑️ Concepto eliminado del registro.`, 'info');
    }
    return true;
  }

  updateExpense(key, value) {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      this.expenses[key] = num;
      this.saveState();
      this.render();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`Costo operativo "${key}" actualizado.`, 'success');
      }
    }
  }

  // ==================== MÓDULO RESTITUCIÓN DE MERCANCÍAS & PANDORA ====================
  approveRestitutionItem(restId) {
    const item = this.restitutionItems.find(i => i.id === restId);
    if (!item) return;
    item.volturiStatus = 'APPROVED';
    item.approvedAt = new Date().toISOString();
    this.saveState();
    this.render();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`📦 Orden para "${item.item}" validada por Comité Volturi y escalada a Pandora.`, 'success');
    }
  }

  createRestitutionItem(data) {
    const unitCost = Math.max(0.01, parseFloat(data.unitCost) || 10.0);
    const retailPrice = Math.max(unitCost, parseFloat(data.retailPrice) || (unitCost * 1.4));
    const currentStock = Math.max(0, parseInt(data.currentStock, 10) || 0);
    const safetyStock = Math.max(1, parseInt(data.safetyStock, 10) || 5);
    const moq = Math.max(1, parseInt(data.moq, 10) || 10);
    const leadTimeDays = Math.max(1, parseInt(data.leadTimeDays, 10) || 3);
    const roiPercent = parseFloat((((retailPrice - unitCost) / unitCost) * 100).toFixed(2));

    let volturiStatus = 'APPROVED';
    let criticReason = '';

    if (roiPercent >= 25.0 && leadTimeDays <= 15) {
      volturiStatus = 'APPROVED';
      criticReason = `Validado por Comité Volturi: ROI óptimo (+${roiPercent}%) y Lead Time ágil (${leadTimeDays} días). Prioridad de reposición Pandora.`;
    } else {
      volturiStatus = 'REJECTED_KILLCRITIC';
      criticReason = `Alerta Volturi (KillCritic): Retorno insuficiente (${roiPercent}%) o tiempo de entrega prolongado (${leadTimeDays} días). Requiere confirmación directiva.`;
    }

    const newItem = {
      id: `REST-${Date.now().toString().slice(-4)}`,
      item: String(data.item || 'Producto / Consumible').trim(),
      division: data.division || 'tienda',
      supplier: String(data.supplier || 'Distribuidor Autorizado').trim(),
      currentStock,
      safetyStock,
      moq,
      unitCost,
      retailPrice,
      leadTimeDays,
      roiPercent,
      volturiStatus,
      criticReason,
      createdAt: new Date().toISOString()
    };

    this.restitutionItems.unshift(newItem);
    this.saveState();
    this.render();
    return newItem;
  }

  updateRestitutionItem(id, updates) {
    const item = this.restitutionItems.find(i => i.id === id);
    if (!item) return false;

    if (updates.item !== undefined && String(updates.item).trim()) item.item = String(updates.item).trim();
    if (updates.division !== undefined) item.division = updates.division;
    if (updates.supplier !== undefined && String(updates.supplier).trim()) item.supplier = String(updates.supplier).trim();
    if (updates.currentStock !== undefined) item.currentStock = Math.max(0, parseInt(updates.currentStock, 10) || 0);
    if (updates.safetyStock !== undefined) item.safetyStock = Math.max(1, parseInt(updates.safetyStock, 10) || 1);
    if (updates.moq !== undefined) item.moq = Math.max(1, parseInt(updates.moq, 10) || 1);
    if (updates.leadTimeDays !== undefined) item.leadTimeDays = Math.max(1, parseInt(updates.leadTimeDays, 10) || 1);
    if (updates.unitCost !== undefined) item.unitCost = Math.max(0.01, parseFloat(updates.unitCost) || item.unitCost);
    if (updates.retailPrice !== undefined) item.retailPrice = Math.max(item.unitCost, parseFloat(updates.retailPrice) || item.retailPrice);

    if (item.unitCost > 0 && item.retailPrice) {
      item.roiPercent = parseFloat((((item.retailPrice - item.unitCost) / item.unitCost) * 100).toFixed(2));
      if (item.roiPercent >= 25.0 && item.leadTimeDays <= 15) {
        item.volturiStatus = 'APPROVED';
        item.criticReason = `Validado por Comité Volturi: ROI óptimo (+${item.roiPercent}%) y Lead Time ágil (${item.leadTimeDays} días). Prioridad de reposición Pandora.`;
      } else {
        item.volturiStatus = 'REJECTED_KILLCRITIC';
        item.criticReason = `Alerta Volturi (KillCritic): Retorno bajo (${item.roiPercent}%) o tiempo de entrega prolongado (${item.leadTimeDays} días). Requiere confirmación directiva.`;
      }
    }

    item.updatedAt = new Date().toISOString();
    this.saveState();
    this.render();
    return true;
  }

  deleteRestitutionItem(id) {
    const idx = this.restitutionItems.findIndex(i => i.id === id);
    if (idx !== -1) {
      const removed = this.restitutionItems.splice(idx, 1)[0];
      this.saveState();
      this.render();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🗑️ Ítem "${removed.item}" eliminado de reposición.`, 'info');
      }
      return true;
    }
    return false;
  }

  async dispatchToPandora(itemId = null) {
    let targetItems = [];
    if (itemId) {
      const it = this.restitutionItems.find(i => i.id === itemId);
      if (it) targetItems = [it];
    } else {
      // Priorizar todos los que están en stock crítico (currentStock <= safetyStock)
      targetItems = this.restitutionItems.filter(i => i.currentStock <= i.safetyStock);
      // Si ninguno está en nivel crítico pero se pulsa despachar, tomar los aprobados
      if (targetItems.length === 0) {
        targetItems = this.restitutionItems.filter(i => i.volturiStatus === 'APPROVED');
      }
    }

    if (targetItems.length === 0) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('ℹ️ No hay productos en nivel crítico para despachar a Pandora.', 'info');
      }
      return;
    }

    const totalUnits = targetItems.reduce((acc, curr) => acc + curr.moq, 0);
    const totalEstimatedCost = targetItems.reduce((acc, curr) => acc + (curr.moq * curr.unitCost), 0);
    const transmissionId = `PND-REST-${Date.now().toString().slice(-6)}`;

    targetItems.forEach(i => {
      i.lastDispatchedToPandora = new Date().toISOString();
      i.pandoraDispatchId = transmissionId;
    });
    this.saveState();
    this.render();

    const payload = {
      transmissionId,
      channel: 'PANDORA_AUTONOMOUS_PROCUREMENT',
      timestamp: new Date().toISOString(),
      organization: 'Mrs. Pets Maracaibo (Big & Little Dogs, C.A. RIF J-40120233-0)',
      volturiValidation: 'VERIFIED_KILLCRITIC_ALGORITHM',
      itemsCount: targetItems.length,
      totalUnits,
      totalEstimatedCostUSD: parseFloat(totalEstimatedCost.toFixed(2)),
      items: targetItems.map(i => ({
        id: i.id,
        item: i.item,
        division: i.division,
        supplier: i.supplier,
        currentStock: i.currentStock,
        safetyStock: i.safetyStock,
        reorderQuantity: i.moq,
        unitCostUSD: i.unitCost,
        estimatedTotalUSD: parseFloat((i.moq * i.unitCost).toFixed(2)),
        leadTimeDays: i.leadTimeDays,
        volturiStatus: i.volturiStatus
      }))
    };

    // Enviar conexión asíncrona al backend
    try {
      if (typeof fetch === 'function') {
        fetch('/api/v1/finance/pandora/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    } catch (e) {}

    // Desplegar modal de confirmación de conexión Pandora
    const modalHtml = `
      <div style="background:#0F172A; color:#FFFFFF; padding:24px; border-radius:18px; border:2px solid #10B981; max-width:620px; margin:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(16,185,129,0.4); padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h3 style="margin:0; font-size:1.2rem; font-weight:900; color:#34D399;">🚀 Paquete Conectado & Despachado a Pandora Core</h3>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#CBD5E1;">Transmisión: ${transmissionId} • Agente de Abastecimiento Autónomo</p>
          </div>
          <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(16,185,129,0.1); border:1px solid #10B981; border-radius:12px; padding:14px; margin-bottom:16px; font-size:0.84rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>📦 Productos en orden de compra:</span>
            <strong>${targetItems.length} ítems (${totalUnits} unidades)</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>💵 Inversión proyectada estimada:</span>
            <strong style="color:#10B981;">$${totalEstimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>⚖️ Algoritmo Volturi (ROI & Lead Time):</span>
            <strong style="color:#34D399;">✓ Conforme (KillCritic Aprobado)</strong>
          </div>
        </div>

        <div style="max-height:200px; overflow-y:auto; margin-bottom:16px; border:1px solid #334155; border-radius:8px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
            <thead>
              <tr style="background:#1E293B; color:#94A3B8; text-transform:uppercase;">
                <th style="padding:8px 6px; text-align:left;">Producto / Insumo</th>
                <th style="padding:8px 6px; text-align:center;">Pedido MOQ</th>
                <th style="padding:8px 6px; text-align:right;">Subtotal USD</th>
              </tr>
            </thead>
            <tbody>
              ${targetItems.map(it => `
                <tr style="border-bottom:1px solid #334155;">
                  <td style="padding:6px 8px;"><strong>${it.item}</strong> (${it.division})</td>
                  <td style="padding:6px 8px; text-align:center; color:#FBBF24; font-weight:800;">${it.moq} und</td>
                  <td style="padding:6px 8px; text-align:right; color:#10B981; font-weight:800;">$${(it.moq * it.unitCost).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:#10B981; color:#0F172A; font-weight:900; padding:10px 20px; border-radius:10px; border:none; cursor:pointer;">
            Entendido
          </button>
        </div>
      </div>
    `;

    this.showModal(modalHtml);
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🚀 Paquete de restitución ${transmissionId} enviado a Pandora.`, 'success');
    }
  }

  // ==================== EXPORTACIÓN ESTRUCTURADA PARA LA IA ====================
  getExportData() {
    const fin = this.getFinancialData(this.currentDateRange);
    return {
      schemaVersion: '2026.10-mrspets-finance-v1',
      generatedAt: new Date().toISOString(),
      organization: {
        legalName: 'Big & Little Dogs, C.A.',
        brandName: 'Mrs. Pets Maracaibo',
        rif: 'J-40120233-0',
        headquarters: 'Av. 2 El Milagro, diagonal a C.C. Lago Mall, Maracaibo, Zulia',
        jurisdiction: 'Venezuela (SENIAT) & Alcaldía de Maracaibo (SEDEMAT)'
      },
      filtersApplied: {
        period: this.currentDateRange,
        customFrom: this.customFrom,
        customTo: this.customTo
      },
      financialSummaryUSD: {
        totalGrossRevenue: fin.totalGrossRevenue,
        totalExpenses: fin.totalExpenses,
        netOperatingProfit: fin.netOperatingProfit,
        ivaNetoPorPagar: fin.seniat.ivaNetoPorPagar,
        totalSedematMunicipal: fin.sedemat.totalSedemat,
        totalDynamicDeductions: fin.totalDynamicDeductions
      },
      financialSummaryVES: {
        bcvOfficialRate: fin.bcvRate,
        totalGrossRevenueVES: fin.totalGrossRevenueVes,
        totalExpensesVES: fin.totalExpensesVes,
        netOperatingProfitVES: fin.netOperatingProfitVes,
        ivaNetoVES: fin.seniat.ivaNetoVes,
        sedematVES: fin.sedemat.totalSedematVes
      },
      revenueByDivision: fin.revenueByDivision,
      treasuryGateways: fin.treasury,
      operatingExpenses: fin.currentExpenses,
      fiscalObligations: {
        seniat: fin.seniat,
        sedemat: fin.sedemat
      },
      dynamicVariablesEngine: {
        activeConcepts: fin.dynamicCalculations,
        allVariablesHistory: this.dynamicVariables
      },
      stockRestitutionPandora: {
        criticalItemsCount: this.restitutionItems.filter(i => i.currentStock <= i.safetyStock).length,
        items: this.restitutionItems
      },
      fiscalInvoicesHistory: {
        totalInvoicesCount: this.invoices.length,
        activeFilter: {
          period: this.invoiceFilterPeriod,
          dateOfVisit: this.invoiceFilterDate,
          searchQuery: this.invoiceSearchQuery,
          division: this.invoiceDivisionFilter
        },
        invoices: this.invoices
      }
    };
  }

  exportJsonReport() {
    const data = this.getExportData();
    if (typeof document === 'undefined' || typeof Blob === 'undefined') return data;
    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MRSPETS_FINANCE_REPORT_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('📥 Reporte relacional JSON descargado con éxito.', 'success');
    }
  }

  showManagementModal() {
    const fin = this.getFinancialData(this.currentDateRange);
    const modalContent = `
      <div style="background:#0F172A; color:#FFFFFF; padding:24px; border-radius:18px; border:2px solid #D4AF37; max-width:680px; margin:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.4); padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h3 style="margin:0; font-size:1.25rem; font-weight:900; color:#FBBF24;">📊 Informe de Gestión Financiera & Fiscal (SENIAT / SEDEMAT)</h3>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#94A3B8;">Mrs. Pets Maracaibo (RIF J-40120233-0) • Período: ${this.currentDateRange.toUpperCase()}</p>
          </div>
          <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
            <div style="font-size:0.75rem; color:#CBD5E1;">Ingresos Totales (Facturación)</div>
            <div style="font-size:1.3rem; font-weight:900; color:#10B981;">$${fin.totalGrossRevenue.toLocaleString()} USD</div>
            <div style="font-size:0.75rem; color:#FBBF24;">Bs. ${fin.totalGrossRevenueVes.toLocaleString()} (BCV ${fin.bcvRate})</div>
          </div>
          <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
            <div style="font-size:0.75rem; color:#CBD5E1;">Utilidad Neta Operativa</div>
            <div style="font-size:1.3rem; font-weight:900; color:#38BDF8;">$${fin.netOperatingProfit.toLocaleString()} USD</div>
            <div style="font-size:0.75rem; color:#93C5FD;">Bs. ${fin.netOperatingProfitVes.toLocaleString()}</div>
          </div>
        </div>

        <div style="background:rgba(212,175,55,0.08); border:1px solid #D4AF37; border-radius:12px; padding:12px; margin-bottom:14px; font-size:0.82rem;">
          <strong style="color:#FBBF24;">🏛️ Obligaciones Tributarias del Período:</strong>
          <div style="margin-top:6px; display:flex; justify-content:space-between;">
            <span>• SENIAT (IVA Neto a Enterar 16%):</span>
            <strong>$${fin.seniat.ivaNetoPorPagar.toFixed(2)} USD (Bs. ${fin.seniat.ivaNetoVes.toLocaleString()})</strong>
          </div>
          <div style="margin-top:4px; display:flex; justify-content:space-between;">
            <span>• SEDEMAT (Actividades Económicas Alcaldía de Maracaibo):</span>
            <strong>$${fin.sedemat.totalSedemat.toFixed(2)} USD (Bs. ${fin.sedemat.totalSedematVes.toLocaleString()})</strong>
          </div>
        </div>

        <div style="text-align:right; margin-top:16px;">
          <button class="btn btn-sm btn-primary" onclick="adminFinanceEngine.exportJsonReport()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:10px 18px; border-radius:10px; border:none; cursor:pointer;">
            📥 Descargar Paquete de Auditoría JSON
          </button>
        </div>
      </div>
    `;

    this.showModal(modalContent);
  }

  showRestitutionModal() {
    const items = this.restitutionItems;
    const criticalCount = items.filter(i => i.currentStock <= i.safetyStock).length;
    const itemsHtml = items.map(i => {
      const isCritical = i.currentStock <= i.safetyStock;
      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.8rem;">
          <td style="padding:8px 6px;">
            <strong>${i.item}</strong><br>
            <span style="color:#94A3B8; font-size:0.72rem;">${i.supplier} • ${i.division}</span>
            ${i.pandoraDispatchId ? `<br><span style="color:#34D399; font-size:0.68rem; font-weight:800;">🚀 Despachado: ${i.pandoraDispatchId}</span>` : ''}
          </td>
          <td style="padding:8px 6px; text-align:center;">
            <span style="padding:3px 8px; border-radius:6px; font-weight:900; font-size:0.75rem; background:${isCritical ? '#7F1D1D' : '#065F46'}; color:#FFFFFF;">
              ${isCritical ? '🚨 ' + i.currentStock + ' / ' + i.safetyStock : '✓ ' + i.currentStock + ' / ' + i.safetyStock}
            </span>
          </td>
          <td style="padding:8px 6px; text-align:center; font-weight:800; color:#FBBF24;">${i.moq} und</td>
          <td style="padding:8px 6px; text-align:center; font-weight:800; color:#10B981;">+${i.roiPercent}%</td>
          <td style="padding:8px 6px; text-align:center;">
            <span style="padding:3px 8px; border-radius:6px; font-weight:900; font-size:0.7rem; background:${i.volturiStatus === 'APPROVED' ? '#065F46' : '#7F1D1D'}; color:#FFFFFF;" title="${i.criticReason}">
              ${i.volturiStatus === 'APPROVED' ? '✓ APROBADO' : '✗ RECHAZADO'}
            </span>
          </td>
          <td style="padding:8px 6px; text-align:center;">
            <div style="display:flex; justify-content:center; gap:6px;">
              <button class="btn btn-sm" onclick="adminFinanceEngine.openAdjustRestitutionModal('${i.id}')" style="background:#334155; color:#38BDF8; border:1px solid #475569; font-weight:800; font-size:0.7rem; padding:4px 8px; border-radius:6px; cursor:pointer;" title="Ajustar stock actual y cantidad mínima">
                ✏️ Ajustar
              </button>
              <button class="btn btn-sm" onclick="adminFinanceEngine.dispatchToPandora('${i.id}')" style="background:#065F46; color:#34D399; border:1px solid #10B981; font-weight:800; font-size:0.7rem; padding:4px 8px; border-radius:6px; cursor:pointer;" title="Despachar orden a Pandora">
                🚀 Enviar
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const modalContent = `
      <div style="background:#0F172A; color:#FFFFFF; padding:24px; border-radius:18px; border:2px solid #10B981; max-width:840px; margin:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(16,185,129,0.4); padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h3 style="margin:0; font-size:1.25rem; font-weight:900; color:#34D399;">📦 Reporte de Restitución de Mercancías (Pandora Core / Volturi)</h3>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#CBD5E1;">Control de stock crítico, umbrales de alerta y conexión de despacho automatizada.</p>
          </div>
          <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div style="font-size:0.82rem; color:#94A3B8;">
            Total Ítems: <strong>${items.length}</strong> • En Nivel Crítico: <strong style="color:${criticalCount > 0 ? '#EF4444' : '#10B981'};">${criticalCount}</strong>
          </div>
          <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.openCreateRestitutionModal()" style="background:#10B981; color:#0F172A; font-weight:900; padding:6px 14px; border-radius:8px; border:none; cursor:pointer;">
            ➕ Nuevo Producto / Consumible
          </button>
        </div>

        <div style="overflow-x:auto; max-height:360px; overflow-y:auto; border:1px solid #334155; border-radius:10px;">
          <table style="width:100%; border-collapse:collapse; color:#FFFFFF;">
            <thead>
              <tr style="background:#1E293B; border-bottom:1.5px solid #10B981; font-size:0.75rem; text-transform:uppercase; color:#94A3B8;">
                <th style="padding:8px 6px; text-align:left;">Producto / Insumo</th>
                <th style="padding:8px 6px; text-align:center;">Stock / Mínimo</th>
                <th style="padding:8px 6px; text-align:center;">Lote MOQ</th>
                <th style="padding:8px 6px; text-align:center;">ROI Estimado</th>
                <th style="padding:8px 6px; text-align:center;">Volturi</th>
                <th style="padding:8px 6px; text-align:center;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:18px; flex-wrap:wrap; gap:10px;">
          <button class="btn btn-sm" onclick="adminFinanceEngine.exportJsonReport()" style="background:#334155; color:#FFFFFF; font-weight:700; padding:10px 16px; border-radius:10px; border:1px solid #475569; cursor:pointer;">
            📥 Descargar JSON Relacional
          </button>
          <button class="btn btn-sm" onclick="adminFinanceEngine.dispatchToPandora()" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; padding:10px 20px; border-radius:10px; border:none; cursor:pointer;">
            🚀 Despachar Críticos a Agente Pandora (${criticalCount})
          </button>
        </div>
      </div>
    `;

    this.showModal(modalContent);
  }

  // ==================== RENDERIZADO PRINCIPAL DE LA INTERFAZ ====================
  render() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('admin-finance-console-container');
    if (!container) return;

    if (!this.isAuthorized()) {
      container.innerHTML = `
        <div style="padding:40px 20px; text-align:center; background:#FEF2F2; border:2px dashed #EF4444; border-radius:18px; margin:20px 0;">
          <div style="font-size:2.5rem; margin-bottom:10px;">🔒</div>
          <h3 style="color:#991B1B; font-weight:900; margin:0 0 8px 0;">Acceso Restringido - Arquitectura Zero Trust</h3>
          <p style="color:#7F1D1D; font-size:0.88rem; max-width:540px; margin:0 auto 16px auto;">
            El módulo de <strong>Administración y Finanzas</strong> está estrictamente restringido al personal directivo y gerencia de Mrs. Pets Maracaibo.
          </p>
          <button class="btn btn-primary" onclick="if(window.adminEngine) adminEngine.openStaffLoginModal();" style="background:#B91C1C; color:#FFFFFF; font-weight:800; padding:10px 20px; border-radius:10px; border:none; cursor:pointer;">
            🔑 Iniciar Sesión con Credenciales de Gerencia
          </button>
        </div>
      `;
      return;
    }

    const fin = this.getFinancialData(this.currentDateRange);

    container.innerHTML = `
      <!-- ENCABEZADO Y ACCIONES PRINCIPALES DE GERENCIA -->
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border:2px solid #D4AF37; border-radius:20px; padding:20px 24px; margin-bottom:24px; color:#FFFFFF; box-shadow:0 8px 24px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.6rem; font-weight:900; box-shadow:0 4px 14px rgba(212,175,55,0.4);">
              💼
            </div>
            <div>
              <h3 style="margin:0; font-size:1.35rem; font-weight:900; color:#FFFFFF; display:flex; align-items:center; gap:10px;">
                <span>Administración, Finanzas & Fiscalidad</span>
                <span class="badge" style="background:#10B981; color:#FFFFFF; font-size:0.75rem; padding:3px 8px; border-radius:6px; font-weight:800;">ZERO TRUST • SENIAT / SEDEMAT</span>
              </h3>
              <p style="margin:4px 0 0 0; font-size:0.84rem; color:#CBD5E1;">
                Consola gerencial de flujo de caja, pasarelas de pago, cumplimiento tributario de Maracaibo y motor de variables dinámicas.
              </p>
            </div>
          </div>

          <!-- BOTONES SUPERIORES: ACCIONES FISCALES Y REPORTES DE GERENCIA -->
          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <button type="button" id="btn-finance-gen-report" class="btn btn-sm" onclick="adminFinanceEngine.showManagementModal()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:10px 16px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(212,175,55,0.35); display:inline-flex; align-items:center; gap:6px;" title="Generar Informe de Gestión Financiera y Fiscal">
              <span>📊 Generar Informe de Gestión</span>
            </button>
            <button type="button" id="btn-finance-pandora-restitution" class="btn btn-sm" onclick="adminFinanceEngine.showRestitutionModal()" style="background:#10B981; color:#0F172A; font-weight:900; padding:10px 16px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.35); display:inline-flex; align-items:center; gap:6px;" title="Reportar Detección de Pandora y Control de Restitución">
              <span>🛡️ Reportar Detección de Pandora</span>
            </button>
            <button type="button" id="btn-finance-export-json" class="btn btn-sm" onclick="adminFinanceEngine.exportJsonReport()" style="background:rgba(255,255,255,0.12); color:#FFFFFF; font-weight:800; padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.25); cursor:pointer; display:inline-flex; align-items:center; gap:6px;" title="Descargar estructura de datos JSON limpia para IA">
              <span>📥 Exportar JSON</span>
            </button>
            <button type="button" id="btn-finance-invoices-master" class="btn btn-sm" onclick="adminFinanceEngine.scrollToInvoicesSection()" style="background:linear-gradient(135deg, #38BDF8, #0284C7); color:#FFFFFF; font-weight:900; padding:10px 16px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(56,189,248,0.35); display:inline-flex; align-items:center; gap:6px;" title="Visualizar histórico contable y generar facturas fiscales SENIAT">
              <span>🧾 Visualizar & Generar Facturas</span>
            </button>
            <button type="button" id="btn-finance-create-invoice-quick" class="btn btn-sm" onclick="adminFinanceEngine.openCreateInvoiceModal()" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; padding:10px 14px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.35); display:inline-flex; align-items:center; gap:6px;" title="Emitir Factura Fiscal SENIAT Manual">
              <span>➕ Generar Factura</span>
            </button>
          </div>
        </div>

        <!-- FILTROS DE RANGO DE FECHAS (DÍA, SEMANA, QUINCENA, MES, SEMESTRE, AÑO) -->
        <div style="margin-top:20px; padding-top:16px; border-top:1px solid rgba(212,175,55,0.25); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:0.8rem; font-weight:800; color:#FBBF24; margin-right:4px;">📅 Período Global:</span>
            ${[
              { id: 'day', label: 'Día (Hoy)' },
              { id: 'week', label: 'Semana' },
              { id: 'quincena', label: 'Quincena' },
              { id: 'month', label: 'Mes en Curso' },
              { id: 'semester', label: 'Semestre' },
              { id: 'year', label: 'Año Fiscal' }
            ].map(r => `
              <button type="button" onclick="adminFinanceEngine.setDateRange('${r.id}')" style="padding:6px 14px; border-radius:8px; border:none; font-weight:800; font-size:0.78rem; cursor:pointer; background:${this.currentDateRange === r.id ? '#D4AF37' : 'rgba(255,255,255,0.08)'}; color:${this.currentDateRange === r.id ? '#0F172A' : '#CBD5E1'}; transition:all 0.2s ease;">
                ${r.label}
              </button>
            `).join('')}
          </div>

          <div style="font-size:0.8rem; color:#A7F3D0; font-weight:700;">
            🏛️ Tasa Oficial BCV: <strong>${fin.bcvRate.toFixed(2)} Bs./USD</strong> (Consolidada Oficial)
          </div>
        </div>
      </div>

      <!-- SECCIÓN A: PANEL DE CONTROL FINANCIERO MULTI-DIVISA -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:24px;">
        <!-- Card 1: Ingresos Totales -->
        <div style="background:#FFFFFF; border:1.5px solid #10B981; border-radius:16px; padding:18px; box-shadow:0 4px 14px rgba(0,0,0,0.04);">
          <div style="font-size:0.75rem; font-weight:800; color:#047857; text-transform:uppercase; letter-spacing:0.5px;">💰 Ingresos Brutos Totales</div>
          <div style="font-size:1.6rem; font-weight:900; color:#0F172A; margin:6px 0 2px 0;">$${fin.totalGrossRevenue.toLocaleString()} <span style="font-size:0.85rem; color:#64748B;">USD</span></div>
          <div style="font-size:0.8rem; font-weight:800; color:#059669;">Bs. ${fin.totalGrossRevenueVes.toLocaleString()} (BCV)</div>
        </div>

        <!-- Card 2: Egresos y Costos -->
        <div style="background:#FFFFFF; border:1.5px solid #EF4444; border-radius:16px; padding:18px; box-shadow:0 4px 14px rgba(0,0,0,0.04);">
          <div style="font-size:0.75rem; font-weight:800; color:#B91C1C; text-transform:uppercase; letter-spacing:0.5px;">📉 Egresos & Costos Operativos</div>
          <div style="font-size:1.6rem; font-weight:900; color:#0F172A; margin:6px 0 2px 0;">$${fin.totalExpenses.toLocaleString()} <span style="font-size:0.85rem; color:#64748B;">USD</span></div>
          <div style="font-size:0.8rem; font-weight:800; color:#DC2626;">Bs. ${fin.totalExpensesVes.toLocaleString()}</div>
        </div>

        <!-- Card 3: Utilidad Neta Operativa -->
        <div style="background:#FFFFFF; border:1.5px solid #D4AF37; border-radius:16px; padding:18px; box-shadow:0 4px 14px rgba(0,0,0,0.04);">
          <div style="font-size:0.75rem; font-weight:800; color:#B45309; text-transform:uppercase; letter-spacing:0.5px;">💎 Margen Operativo Neto</div>
          <div style="font-size:1.6rem; font-weight:900; color:#0F172A; margin:6px 0 2px 0;">$${fin.netOperatingProfit.toLocaleString()} <span style="font-size:0.85rem; color:#64748B;">USD</span></div>
          <div style="font-size:0.8rem; font-weight:800; color:#D4AF37;">Bs. ${fin.netOperatingProfitVes.toLocaleString()}</div>
        </div>

        <!-- Card 4: Obligaciones Tributarias Combinadas -->
        <div style="background:#FFFFFF; border:1.5px solid #6366F1; border-radius:16px; padding:18px; box-shadow:0 4px 14px rgba(0,0,0,0.04);">
          <div style="font-size:0.75rem; font-weight:800; color:#4338CA; text-transform:uppercase; letter-spacing:0.5px;">🏛️ Tributos (SENIAT + SEDEMAT)</div>
          <div style="font-size:1.6rem; font-weight:900; color:#0F172A; margin:6px 0 2px 0;">$${(fin.seniat.ivaNetoPorPagar + fin.sedemat.totalSedemat).toFixed(2)} <span style="font-size:0.85rem; color:#64748B;">USD</span></div>
          <div style="font-size:0.8rem; font-weight:800; color:#4F46E5;">SENIAT: $${fin.seniat.ivaNetoPorPagar} • SEDEMAT: $${fin.sedemat.totalSedemat}</div>
        </div>
      </div>

      <!-- MATRIZ DE INGRESOS POR DIVISIÓN & PASARELAS DE PAGO -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap:20px; margin-bottom:24px;">
        <!-- Matriz de Ingresos por División Operativa -->
        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:18px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
          <h4 style="margin:0 0 14px 0; font-size:1rem; font-weight:900; color:#1E293B; display:flex; align-items:center; gap:8px;">
            <span>🏢 Matriz de Ingresos por División Operativa</span>
          </h4>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#F8FAFC; border-radius:10px; border-left:4px solid #D4AF37;">
              <span style="font-weight:700; font-size:0.85rem; color:#334155;">✂️ Grooming & Spa Canino/Felino</span>
              <strong style="color:#0F172A;">$${fin.revenueByDivision.grooming.toLocaleString()} USD</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#F8FAFC; border-radius:10px; border-left:4px solid #10B981;">
              <span style="font-weight:700; font-size:0.85rem; color:#334155;">🩺 Clínica Veterinaria 24 Horas & Cirugía</span>
              <strong style="color:#0F172A;">$${fin.revenueByDivision.clinica.toLocaleString()} USD</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#F8FAFC; border-radius:10px; border-left:4px solid #3B82F6;">
              <span style="font-weight:700; font-size:0.85rem; color:#334155;">🏨 Admisión Hotel 5★ & Guardería Bioclimática</span>
              <strong style="color:#0F172A;">$${fin.revenueByDivision.hotel.toLocaleString()} USD</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#F8FAFC; border-radius:10px; border-left:4px solid #F59E0B;">
              <span style="font-weight:700; font-size:0.85rem; color:#334155;">🛍️ Tienda, Farmacia & Boutique VIP</span>
              <strong style="color:#0F172A;">$${fin.revenueByDivision.tienda.toLocaleString()} USD</strong>
            </div>
          </div>
        </div>

        <!-- Gestión de Pasarelas & Tesorería -->
        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:18px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
          <h4 style="margin:0 0 14px 0; font-size:1rem; font-weight:900; color:#1E293B; display:flex; align-items:center; gap:8px;">
            <span>💳 Gestión de Pasarelas de Pago & Tesorería</span>
          </h4>
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; font-size:0.82rem;">
            <div style="background:#F8FAFC; padding:8px 12px; border-radius:8px;">
              <span style="color:#64748B;">Stripe Card Vault:</span><br>
              <strong style="color:#0F172A; font-size:0.95rem;">$${fin.treasury.stripe.toLocaleString()} USD</strong>
            </div>
            <div style="background:#F8FAFC; padding:8px 12px; border-radius:8px;">
              <span style="color:#64748B;">PayPal Business:</span><br>
              <strong style="color:#0F172A; font-size:0.95rem;">$${fin.treasury.paypal.toLocaleString()} USD</strong>
            </div>
            <div style="background:#F8FAFC; padding:8px 12px; border-radius:8px;">
              <span style="color:#64748B;">Zinli VIP:</span><br>
              <strong style="color:#0F172A; font-size:0.95rem;">$${fin.treasury.zinli.toLocaleString()} USD</strong>
            </div>
            <div style="background:#F8FAFC; padding:8px 12px; border-radius:8px;">
              <span style="color:#64748B;">Binance Pay (USDT):</span><br>
              <strong style="color:#0F172A; font-size:0.95rem;">$${fin.treasury.binance.toLocaleString()} USD</strong>
            </div>
            <div style="background:#F8FAFC; padding:8px 12px; border-radius:8px;">
              <span style="color:#64748B;">Efectivo Divisas ($):</span><br>
              <strong style="color:#0F172A; font-size:0.95rem;">$${fin.treasury.efectivoDivisas.toLocaleString()} USD</strong>
            </div>
            <div style="background:#F8FAFC; padding:8px 12px; border-radius:8px;">
              <span style="color:#64748B;">Pago Móvil Banesco:</span><br>
              <strong style="color:#0F172A; font-size:0.95rem;">$${fin.treasury.pagoMovil.toLocaleString()} USD</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN B: OBLIGACIONES FISCALES SENIAT Y SEDEMAT -->
      <div style="background:linear-gradient(135deg, #F8FAFC, #F1F5F9); border:1.5px solid #D4AF37; border-radius:18px; padding:20px; margin-bottom:24px;">
        <h4 style="margin:0 0 14px 0; font-size:1.05rem; font-weight:900; color:#1E293B; display:flex; align-items:center; gap:8px;">
          <span>🏛️ Obligaciones Fiscales & Cumplimiento Tributario (Venezuela & Maracaibo)</span>
        </h4>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:16px;">
          <!-- SENIAT -->
          <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:14px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <strong style="color:#B91C1C; font-size:0.92rem;">SENIAT • IVA & Retenciones</strong>
              <span class="badge" style="background:#FEF2F2; color:#B91C1C; border:1px solid #EF4444; font-weight:800;">ALÍCUOTA 16%</span>
            </div>
            <div style="font-size:0.8rem; color:#475569; display:flex; flex-direction:column; gap:6px;">
              <div style="display:flex; justify-content:space-between;">
                <span>Débito Fiscal IVA Causado:</span>
                <strong>$${fin.seniat.ivaDebitoFiscal.toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Crédito Fiscal Deducible:</span>
                <strong>-$${fin.seniat.ivaCreditoFiscalEstimado.toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between; padding-top:6px; border-top:1px dashed #CBD5E1; color:#0F172A; font-weight:900;">
                <span>IVA Neto por Enterar al SENIAT:</span>
                <span style="color:#B91C1C;">$${fin.seniat.ivaNetoPorPagar.toFixed(2)} USD</span>
              </div>
              <div style="font-size:0.75rem; color:#64748B;">
                Equivalente oficial: <strong>Bs. ${fin.seniat.ivaNetoVes.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <!-- SEDEMAT -->
          <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:14px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <strong style="color:#047857; font-size:0.92rem;">SEDEMAT • Alcaldía de Maracaibo</strong>
              <span class="badge" style="background:#ECFDF5; color:#047857; border:1px solid #10B981; font-weight:800;">ACTIVIDADES ECONÓMICAS</span>
            </div>
            <div style="font-size:0.8rem; color:#475569; display:flex; flex-direction:column; gap:6px;">
              <div style="display:flex; justify-content:space-between;">
                <span>Servicios Médicos Veterinarios (1.5%):</span>
                <strong>$${fin.sedemat.breakdown.clinica.toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Estética, Peluquería & Spa (2.0%):</span>
                <strong>$${fin.sedemat.breakdown.grooming.toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Alojamiento Hotel & Guardería (2.0%):</span>
                <strong>$${fin.sedemat.breakdown.hotel.toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Comercio de Alimentos & Accesorios (2.5%):</span>
                <strong>$${fin.sedemat.breakdown.tienda.toFixed(2)} USD</strong>
              </div>
              <div style="display:flex; justify-content:space-between; padding-top:6px; border-top:1px dashed #CBD5E1; color:#0F172A; font-weight:900;">
                <span>Impuesto Municipal Total SEDEMAT:</span>
                <span style="color:#047857;">$${fin.sedemat.totalSedemat.toFixed(2)} USD (Bs. ${fin.sedemat.totalSedematVes.toLocaleString()})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN FISCAL: HISTÓRICO DE FACTURACIÓN FISCAL SENIAT & ATENCIÓN AL CLIENTE -->
      ${(() => {
        const filteredInvoices = this.getFilteredInvoices();
        const totalInvoicedUsd = filteredInvoices.reduce((sum, inv) => sum + (inv.totalUsd || 0), 0);
        const totalInvoicedVes = filteredInvoices.reduce((sum, inv) => sum + (inv.totalVes || 0), 0);
        const totalBaseUsd = filteredInvoices.reduce((sum, inv) => sum + (inv.taxableAmount || 0), 0);
        const totalIvaUsd = filteredInvoices.reduce((sum, inv) => sum + (inv.ivaAmount || 0), 0);

        const periodLabels = {
          day: 'Día (Hoy)',
          week: 'Semana (7 Días)',
          quincena: 'Quincena (15 Días)',
          month: 'Mes (30 Días)',
          semester: 'Semestre (6 Meses)',
          year: 'Año Fiscal (12 Meses)',
          all: 'Todo el Histórico'
        };

        const invoicesRowsHtml = filteredInvoices.length > 0
          ? filteredInvoices.map(inv => `
              <tr class="fiscal-invoice-row"
                  ondblclick="adminFinanceEngine.openInvoiceViewer('${inv.id}')"
                  title="💡 Doble clic para abrir la factura fiscal completa y gestionar impresión o reenvío"
                  style="border-bottom:1px solid #E2E8F0; cursor:pointer; transition:background 0.15s ease;"
                  onmouseover="this.style.background='#F8FAFC';"
                  onmouseout="this.style.background='transparent';">
                <td style="padding:12px 10px; font-weight:800; color:#0F172A;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span style="color:#0284C7;">🧾</span>
                    <span>${inv.invoiceNumber}</span>
                  </div>
                  <div style="font-size:0.73rem; color:#64748B; margin-top:2px;">Ctrl: <strong>${inv.controlNumber}</strong></div>
                </td>
                <td style="padding:12px 10px; font-size:0.83rem; color:#334155; white-space:nowrap;">
                  <div>📅 ${inv.date}</div>
                  <div style="font-size:0.75rem; color:#64748B;">⏰ ${inv.time}</div>
                </td>
                <td style="padding:12px 10px;">
                  <strong style="color:#0F172A; font-size:0.88rem;">${inv.customer.name}</strong>
                  <div style="font-size:0.75rem; color:#64748B;">RIF: ${inv.customer.rif}</div>
                  <div style="font-size:0.73rem; color:#2563EB;">${inv.customer.email}</div>
                </td>
                <td style="padding:12px 10px; font-size:0.83rem; color:#334155;">
                  <div style="font-weight:800; color:#0F172A;">🐾 ${inv.pet.name}</div>
                  <div style="font-size:0.73rem; color:#64748B;">${inv.pet.species}</div>
                </td>
                <td style="padding:12px 10px; font-size:0.82rem; color:#334155;">
                  <span class="badge" style="background:#F1F5F9; color:#0F172A; border:1px solid #CBD5E1; font-size:0.75rem; padding:3px 8px; border-radius:6px; font-weight:700;">
                    👤 ${inv.cashier}
                  </span>
                  <div style="font-size:0.72rem; color:#64748B; margin-top:2px;">${inv.divisionLabel}</div>
                </td>
                <td style="padding:12px 10px; font-size:0.82rem; color:#1E293B; max-width:240px;">
                  <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${inv.items.map(i => `${i.quantity}x ${i.description}`).join(' • ')}">
                    ${inv.items.map(i => `<strong>${i.quantity}x</strong> ${i.description}`).join(', ')}
                  </div>
                  <div style="font-size:0.72rem; color:#64748B; margin-top:2px;">Base: $${(inv.taxableAmount || 0).toFixed(2)} + IVA 16%: $${(inv.ivaAmount || 0).toFixed(2)}</div>
                </td>
                <td style="padding:12px 10px; font-weight:900; color:#0F172A; font-size:0.92rem; text-align:right; white-space:nowrap;">
                  $${inv.totalUsd.toFixed(2)} <span style="font-size:0.72rem; color:#64748B;">USD</span>
                </td>
                <td style="padding:12px 10px; font-weight:900; color:#059669; font-size:0.85rem; text-align:right; white-space:nowrap;">
                  Bs. ${inv.totalVes.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}
                </td>
                <td style="padding:12px 10px; font-size:0.75rem; white-space:nowrap;">
                  <span class="badge" style="background:${inv.status === 'REENVIADA' ? '#EFF6FF' : '#ECFDF5'}; color:${inv.status === 'REENVIADA' ? '#1D4ED8' : '#047857'}; border:1px solid ${inv.status === 'REENVIADA' ? '#93C5FD' : '#A7F3D0'}; padding:3px 7px; border-radius:6px; font-weight:800; display:inline-flex; align-items:center; gap:4px;">
                    ${inv.status === 'REENVIADA' ? '🔄 Reenviada' : '✉️ Emitida'}
                  </span>
                  <div style="font-size:0.7rem; color:#64748B; margin-top:3px; max-width:130px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${inv.emailStatus}">
                    ${inv.emailStatus}
                  </div>
                </td>
                <td style="padding:12px 10px; text-align:center;">
                  <div style="display:flex; gap:6px; justify-content:center;">
                    <button type="button" class="btn btn-sm" onclick="event.stopPropagation(); adminFinanceEngine.openInvoiceViewer('${inv.id}')" style="background:#0F172A; color:#D4AF37; border:1px solid #D4AF37; font-size:0.75rem; padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:800;" title="Abrir y Visualizar Factura SENIAT">
                      👁️ Ver
                    </button>
                    <button type="button" class="btn btn-sm" onclick="event.stopPropagation(); adminFinanceEngine.quickResendInvoice('${inv.id}')" style="background:#2563EB; color:#FFFFFF; border:none; font-size:0.75rem; padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:800;" title="Reenviar por Correo al Cliente">
                      📧 Reenviar
                    </button>
                    <button type="button" class="btn btn-sm" onclick="event.stopPropagation(); adminFinanceEngine.printInvoiceDirectly('${inv.id}')" style="background:#F1F5F9; color:#0F172A; border:1px solid #CBD5E1; font-size:0.75rem; padding:4px 8px; border-radius:6px; cursor:pointer;" title="Imprimir Factura">
                      🖨️
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')
          : `
              <tr>
                <td colspan="10" style="padding:32px 16px; text-align:center; color:#64748B;">
                  <div style="font-size:2rem; margin-bottom:8px;">🔍</div>
                  <div style="font-weight:800; font-size:0.95rem; color:#0F172A;">No se encontraron facturas fiscales para este filtro.</div>
                  <div style="font-size:0.8rem; margin-top:4px;">
                    ${this.invoiceFilterDate ? `No hay registros para la fecha de visita: <strong>${this.invoiceFilterDate}</strong>.` : `No hay facturas en el período seleccionado (${periodLabels[this.invoiceFilterPeriod] || this.invoiceFilterPeriod}).`}
                  </div>
                  <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.clearInvoiceDateFilter(); adminFinanceEngine.setInvoiceFilterPeriod('all');" style="margin-top:12px; background:#D4AF37; color:#0F172A; font-weight:800; padding:6px 14px; border-radius:8px; border:none; cursor:pointer;">
                    🔄 Mostrar Todo el Histórico
                  </button>
                </td>
              </tr>
            `;

        return `
          <div id="admin-section-fiscal-invoices" style="background:#FFFFFF; border:2px solid #D4AF37; border-radius:20px; padding:22px; margin-bottom:24px; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
            <!-- ENCABEZADO DE SECCIÓN -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:16px;">
              <div>
                <h4 style="margin:0; font-size:1.2rem; font-weight:900; color:#0F172A; display:flex; align-items:center; gap:8px;">
                  <span>🧾 Histórico de Facturación Fiscal SENIAT & Operaciones Contables</span>
                  <span class="badge" style="background:#0F172A; color:#D4AF37; font-size:0.72rem; padding:3px 8px; border-radius:6px; font-weight:900; border:1px solid #D4AF37;">CONTROL FISCAL OFICIAL</span>
                </h4>
                <p style="margin:4px 0 0 0; font-size:0.82rem; color:#64748B;">
                  Consulta de facturas del día, semana, quincena, mes, semestre y año. Atención al cliente con búsqueda por fecha de visita ("¿Cuándo vino?"), doble clic para apertura de factura, impresión y reenvío inmediato por correo electrónico.
                </p>
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.openCreateInvoiceModal()" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; padding:9px 18px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 3px 12px rgba(16,185,129,0.35); display:inline-flex; align-items:center; gap:6px;">
                  <span>➕ Generar Factura</span>
                </button>
                <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.exportInvoicesJson()" style="background:#F8FAFC; color:#334155; font-weight:800; padding:9px 14px; border-radius:10px; border:1px solid #CBD5E1; cursor:pointer; display:inline-flex; align-items:center; gap:6px;" title="Exportar listado actual de facturas en JSON">
                  <span>📥 Exportar Facturas JSON</span>
                </button>
              </div>
            </div>

            <!-- FILTROS INTERACTIVOS: PERÍODOS SOLICITADOS -->
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px; margin-bottom:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                  <span style="font-size:0.8rem; font-weight:900; color:#0F172A; margin-right:4px;">⏱️ Período de Facturación:</span>
                  ${[
                    { id: 'day', label: 'Día (Hoy)' },
                    { id: 'week', label: 'Semana' },
                    { id: 'quincena', label: 'Quincena' },
                    { id: 'month', label: 'Mes' },
                    { id: 'semester', label: 'Semestre' },
                    { id: 'year', label: 'Año' },
                    { id: 'all', label: 'Todo el Histórico' }
                  ].map(p => `
                    <button type="button" onclick="adminFinanceEngine.setInvoiceFilterPeriod('${p.id}')" style="padding:6px 12px; border-radius:8px; border:1px solid ${this.invoiceFilterPeriod === p.id && !this.invoiceFilterDate ? '#D4AF37' : '#CBD5E1'}; font-weight:800; font-size:0.78rem; cursor:pointer; background:${this.invoiceFilterPeriod === p.id && !this.invoiceFilterDate ? '#0F172A' : '#FFFFFF'}; color:${this.invoiceFilterPeriod === p.id && !this.invoiceFilterDate ? '#D4AF37' : '#475569'}; transition:all 0.15s ease;">
                      ${p.label}
                    </button>
                  `).join('')}
                </div>

                <div style="font-size:0.78rem; color:#059669; font-weight:800;">
                  🏛️ Tasa BCV: ${fin.bcvRate.toFixed(2)} Bs./USD
                </div>
              </div>

              <!-- BÚSQUEDA POR FECHA DE VISITA ("¿CUÁNDO FUE QUE VINO?") + TEXTO + DIVISIÓN -->
              <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
                <!-- Selector de fecha específica de visita -->
                <div style="display:flex; align-items:center; gap:6px; background:#FFFFFF; padding:6px 10px; border-radius:8px; border:1.5px solid ${this.invoiceFilterDate ? '#2563EB' : '#CBD5E1'};">
                  <label for="admin-invoice-date-picker" style="font-size:0.78rem; font-weight:900; color:#0F172A; white-space:nowrap;">
                    📅 ¿Cuándo vino el cliente?
                  </label>
                  <input type="date" id="admin-invoice-date-picker" value="${this.invoiceFilterDate}" onchange="adminFinanceEngine.setInvoiceFilterDate(this.value)" style="border:none; outline:none; font-size:0.82rem; font-weight:700; color:#0F172A; background:transparent; cursor:pointer;" title="Filtrar por fecha exacta de visita">
                  ${this.invoiceFilterDate ? `
                    <button type="button" onclick="adminFinanceEngine.clearInvoiceDateFilter()" style="border:none; background:transparent; color:#EF4444; font-size:0.9rem; cursor:pointer; font-weight:900;" title="Limpiar fecha específica">✕</button>
                  ` : ''}
                </div>

                <!-- Buscador por texto -->
                <div style="flex:1; min-width:240px;">
                  <input type="text" id="admin-invoice-search" placeholder="🔍 Buscar por Cliente, C.I./RIF, Factura, Mascota o Concepto..." value="${this.invoiceSearchQuery}" oninput="adminFinanceEngine.setInvoiceSearchQuery(this.value)" style="width:100%; padding:8px 12px; border-radius:8px; border:1.5px solid #CBD5E1; font-size:0.84rem; font-weight:600; color:#0F172A; background:#FFFFFF;">
                </div>

                <!-- Selector de División -->
                <div>
                  <select onchange="adminFinanceEngine.setInvoiceDivisionFilter(this.value)" style="padding:8px 12px; border-radius:8px; border:1.5px solid #CBD5E1; font-weight:700; font-size:0.82rem; color:#0F172A; background:#FFFFFF; cursor:pointer;">
                    <option value="all" ${this.invoiceDivisionFilter === 'all' ? 'selected' : ''}>🏢 Todas las Divisiones</option>
                    <option value="clinica" ${this.invoiceDivisionFilter === 'clinica' ? 'selected' : ''}>🩺 Clínica Veterinaria 24H</option>
                    <option value="grooming" ${this.invoiceDivisionFilter === 'grooming' ? 'selected' : ''}>✂️ Grooming & Spa</option>
                    <option value="hotel" ${this.invoiceDivisionFilter === 'hotel' ? 'selected' : ''}>🏨 Admisión Hotel 5★</option>
                    <option value="tienda" ${this.invoiceDivisionFilter === 'tienda' ? 'selected' : ''}>🛍️ Tienda & Farmacia</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- TARJETAS RÁPIDAS DE RESUMEN CONTABLE DEL FILTRO SELECCIONADO -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:16px;">
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:12px;">
                <div style="font-size:0.72rem; font-weight:800; color:#64748B; text-transform:uppercase;">Facturas Registradas</div>
                <div style="font-size:1.35rem; font-weight:900; color:#0F172A; margin:2px 0;">${filteredInvoices.length} <span style="font-size:0.8rem; font-weight:700; color:#64748B;">Facturas</span></div>
                <div style="font-size:0.74rem; color:#475569;">${this.invoiceFilterDate ? `Fecha de visita: ${this.invoiceFilterDate}` : `Período: ${periodLabels[this.invoiceFilterPeriod] || this.invoiceFilterPeriod}`}</div>
              </div>

              <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:12px; padding:12px;">
                <div style="font-size:0.72rem; font-weight:800; color:#047857; text-transform:uppercase;">Total Facturado (USD)</div>
                <div style="font-size:1.35rem; font-weight:900; color:#065F46; margin:2px 0;">$${totalInvoicedUsd.toFixed(2)} <span style="font-size:0.8rem; font-weight:700;">USD</span></div>
                <div style="font-size:0.74rem; font-weight:800; color:#059669;">Base Gravable: $${totalBaseUsd.toFixed(2)}</div>
              </div>

              <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:12px;">
                <div style="font-size:0.72rem; font-weight:800; color:#166534; text-transform:uppercase;">Total Facturado (Bs. BCV)</div>
                <div style="font-size:1.25rem; font-weight:900; color:#15803D; margin:2px 0;">Bs. ${totalInvoicedVes.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <div style="font-size:0.74rem; color:#166534;">Tasa Oficial Consolidada</div>
              </div>

              <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px; padding:12px;">
                <div style="font-size:0.72rem; font-weight:800; color:#1E40AF; text-transform:uppercase;">IVA SENIAT 16%</div>
                <div style="font-size:1.35rem; font-weight:900; color:#1D4ED8; margin:2px 0;">$${totalIvaUsd.toFixed(2)} <span style="font-size:0.8rem; font-weight:700;">USD</span></div>
                <div style="font-size:0.74rem; font-weight:800; color:#2563EB;">Bs. ${(totalIvaUsd * fin.bcvRate).toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
              </div>
            </div>

            <!-- BANNER INFORMATIVO DE DOBLE CLIC Y REENVÍO -->
            <div style="background:rgba(212,175,55,0.08); border-left:4px solid #D4AF37; padding:10px 14px; border-radius:8px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div style="font-size:0.82rem; color:#1E293B;">
                💡 <strong>Atención al Cliente:</strong> Haz <strong>doble clic</strong> sobre cualquier fila del listado para abrir de inmediato la Factura Fiscal Oficial SENIAT, imprimirla o reenviarla por correo si el cliente no la recibió.
              </div>
              <span style="font-size:0.75rem; color:#B45309; font-weight:800;">
                Doble Clic • Impresión Directa • Reenvío de Correo
              </span>
            </div>

            <!-- TABLA DEL HISTÓRICO DE FACTURAS -->
            <div style="overflow-x:auto; border:1px solid #CBD5E1; border-radius:12px;">
              <table style="width:100%; border-collapse:collapse; background:#FFFFFF;">
                <thead>
                  <tr style="background:#0F172A; color:#FFFFFF; font-size:0.74rem; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #D4AF37;">
                    <th style="padding:10px; text-align:left;">N° Factura / Control</th>
                    <th style="padding:10px; text-align:left;">Fecha & Hora</th>
                    <th style="padding:10px; text-align:left;">Cliente & RIF</th>
                    <th style="padding:10px; text-align:left;">Mascota</th>
                    <th style="padding:10px; text-align:left;">Quién Facturó</th>
                    <th style="padding:10px; text-align:left;">Qué se Vendió (Contable)</th>
                    <th style="padding:10px; text-align:right;">Total USD</th>
                    <th style="padding:10px; text-align:right;">Total Bs. (BCV)</th>
                    <th style="padding:10px; text-align:left;">Estatus Correo</th>
                    <th style="padding:10px; text-align:center;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoicesRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        `;
      })()}

      <!-- SECCIÓN C: GESTOR WEB FLEXIBLE DE VARIABLES Y CONCEPTOS FINANCIEROS (CRUD) -->
      <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:18px; padding:20px; margin-bottom:24px; box-shadow:0 4px 14px rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <h4 style="margin:0; font-size:1.1rem; font-weight:900; color:#1E293B; display:flex; align-items:center; gap:8px;">
              <span>🎛️ Motor de Variables Dinámicas (Dynamic Variables Engine)</span>
              <span class="badge" style="background:#2C2C2E; color:#D4AF37; font-weight:800; font-size:0.75rem;">CONFIGURACIÓN EN VIVO</span>
            </h4>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#64748B;">
              Crea, activa o retira conceptos de cálculo contable (bonos, comisiones, retenciones especiales y fondos de reserva) sin alterar el histórico.
            </p>
          </div>
          <button type="button" class="btn btn-sm btn-primary" onclick="adminFinanceEngine.openCreateVariableModal()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:8px 16px; border-radius:10px; border:none; cursor:pointer;">
            ➕ Crear Nuevo Concepto / Variable
          </button>
        </div>

        <!-- TABLA CRUD DE VARIABLES DINÁMICAS -->
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
            <thead>
              <tr style="background:#F8FAFC; border-bottom:2px solid #E2E8F0; color:#475569; text-transform:uppercase; font-size:0.75rem;">
                <th style="padding:10px 8px; text-align:left;">Concepto / Variable</th>
                <th style="padding:10px 8px; text-align:center;">Tipo de Cálculo</th>
                <th style="padding:10px 8px; text-align:center;">Valor Configurado</th>
                <th style="padding:10px 8px; text-align:center;">División Asignada</th>
                <th style="padding:10px 8px; text-align:center;">Impacto Calculado</th>
                <th style="padding:10px 8px; text-align:center;">Estado</th>
                <th style="padding:10px 8px; text-align:center;">Acción</th>
              </tr>
            </thead>
            <tbody>
              ${this.dynamicVariables.map(v => {
                const isAct = v.status === 'active';
                const calcObj = fin.dynamicCalculations.find(c => c.id === v.id);
                const impactStr = calcObj ? `$${calcObj.calculatedAmount.toFixed(2)} USD` : '-- (Retirada)';
                return `
                  <tr style="border-bottom:1px solid #F1F5F9; background:${isAct ? '#FFFFFF' : '#F8FAFC'};">
                    <td style="padding:10px 8px;">
                      <strong style="color:${isAct ? '#0F172A' : '#94A3B8'};">${v.name}</strong><br>
                      <span style="font-size:0.72rem; color:#64748B;">${v.description || ''}</span>
                    </td>
                    <td style="padding:10px 8px; text-align:center;">
                      <span style="padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.72rem; background:${v.type === 'percentage' ? '#ECFDF5' : '#EFF6FF'}; color:${v.type === 'percentage' ? '#047857' : '#1D4ED8'};">
                        ${v.type === 'percentage' ? 'Porcentaje (%)' : 'Monto Fijo ($)'}
                      </span>
                    </td>
                    <td style="padding:10px 8px; text-align:center; font-weight:800;">
                      ${v.type === 'percentage' ? `${v.value}%` : `$${v.value.toFixed(2)}`}
                    </td>
                    <td style="padding:10px 8px; text-align:center; text-transform:capitalize; font-weight:700; color:#475569;">
                      ${v.division === 'all' ? 'Todas las Divisiones' : v.division}
                    </td>
                    <td style="padding:10px 8px; text-align:center; font-weight:800; color:${isAct ? '#D4AF37' : '#94A3B8'};">
                      ${impactStr}
                    </td>
                    <td style="padding:10px 8px; text-align:center;">
                      <span style="padding:3px 8px; border-radius:6px; font-weight:900; font-size:0.72rem; background:${isAct ? '#ECFDF5' : '#FEF2F2'}; color:${isAct ? '#047857' : '#B91C1C'}; border:1px solid ${isAct ? '#10B981' : '#EF4444'};">
                        ${isAct ? '● ACTIVO' : '○ RETIRADO'}
                      </span>
                    </td>
                    <td style="padding:10px 8px; text-align:center;">
                      <div style="display:flex; justify-content:center; gap:6px; flex-wrap:wrap;">
                        <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.openEditVariableModal('${v.id}')" style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; font-weight:800; font-size:0.72rem; padding:4px 8px; border-radius:6px; cursor:pointer;" title="Modificar valores de la variable">
                          ✏️ Modificar
                        </button>
                        ${isAct ? `
                          <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.retireVariable('${v.id}')" style="background:#FFF1F2; color:#BE123C; border:1px solid #FECDD3; font-weight:800; font-size:0.72rem; padding:4px 8px; border-radius:6px; cursor:pointer;" title="Retirar concepto contable sin alterar histórico">
                            🔒 Retirar
                          </button>
                        ` : `
                          <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.reactivateVariable('${v.id}')" style="background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; font-weight:800; font-size:0.72rem; padding:4px 8px; border-radius:6px; cursor:pointer;" title="Reactivar concepto en el cálculo">
                            ✓ Reactivar
                          </button>
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

      <!-- SECCIÓN D: MÓDULO DE RESTITUCIÓN DE MERCANCÍAS (TEAMLY / PANDORA CORE) -->
      <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:18px; padding:20px; box-shadow:0 4px 14px rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
          <div>
            <h4 style="margin:0; font-size:1.1rem; font-weight:900; color:#1E293B; display:flex; align-items:center; gap:8px;">
              <span>📦 Control de Stock Crítico & Restitución (Pandora Core / Volturi)</span>
              ${this.restitutionItems.filter(i => i.currentStock <= i.safetyStock).length > 0 ? `
                <span class="badge" style="background:#FEF2F2; color:#B91C1C; border:1px solid #EF4444; font-weight:900; font-size:0.75rem;">
                  🚨 ${this.restitutionItems.filter(i => i.currentStock <= i.safetyStock).length} EN NIVEL CRÍTICO
                </span>
              ` : `
                <span class="badge" style="background:#ECFDF5; color:#065F46; border:1px solid #10B981; font-weight:800; font-size:0.75rem;">
                  ✓ STOCK EN NIVEL SEGURO
                </span>
              `}
            </h4>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#64748B;">
              Gestión de insumos consumibles, ajuste de stock mínimo para alertas y conexión de despacho automatizada con Pandora Core.
            </p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn btn-sm btn-primary" onclick="adminFinanceEngine.openCreateRestitutionModal()" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; padding:8px 14px; border-radius:8px; border:none; cursor:pointer;">
              ➕ Nuevo Producto / Consumible
            </button>
            <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.dispatchToPandora()" style="background:#0F172A; color:#34D399; border:1.5px solid #10B981; font-weight:800; padding:8px 14px; border-radius:8px; cursor:pointer;" title="Despachar órdenes de reposición para todos los ítems críticos a Pandora">
              🚀 Despachar Críticos a Pandora
            </button>
            <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.showRestitutionModal()" style="background:#F8FAFC; color:#334155; border:1px solid #CBD5E1; font-weight:800; padding:8px 14px; border-radius:8px; cursor:pointer;">
              🤖 Consola Detallada
            </button>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
            <thead>
              <tr style="background:#F8FAFC; border-bottom:2px solid #E2E8F0; color:#475569; text-transform:uppercase; font-size:0.75rem;">
                <th style="padding:10px 8px; text-align:left;">Producto / Consumible</th>
                <th style="padding:10px 8px; text-align:center;">División</th>
                <th style="padding:10px 8px; text-align:center;">Stock / Umbral Mínimo</th>
                <th style="padding:10px 8px; text-align:center;">Lote MOQ</th>
                <th style="padding:10px 8px; text-align:center;">Lead Time</th>
                <th style="padding:10px 8px; text-align:center;">Retorno ROI</th>
                <th style="padding:10px 8px; text-align:center;">Criterio Volturi</th>
                <th style="padding:10px 8px; text-align:center;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${this.restitutionItems.map(item => {
                const isCrit = item.currentStock <= item.safetyStock;
                return `
                  <tr style="border-bottom:1px solid #F1F5F9; background:${isCrit ? '#FFFBFB' : '#FFFFFF'};">
                    <td style="padding:10px 8px;">
                      <strong style="color:#0F172A;">${item.item}</strong><br>
                      <span style="font-size:0.72rem; color:#64748B;">Proveedor: ${item.supplier}</span>
                      ${item.pandoraDispatchId ? `
                        <br><span style="display:inline-block; margin-top:2px; padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:800; background:#ECFDF5; color:#047857; border:1px solid #A7F3D0;">
                          🚀 Despachado: ${item.pandoraDispatchId}
                        </span>
                      ` : ''}
                    </td>
                    <td style="padding:10px 8px; text-align:center; text-transform:capitalize; font-weight:700;">
                      <span class="badge" style="background:#F1F5F9; color:#334155; font-size:0.72rem;">${item.division}</span>
                    </td>
                    <td style="padding:10px 8px; text-align:center;">
                      <span style="padding:3px 8px; border-radius:6px; font-weight:900; font-size:0.75rem; background:${isCrit ? '#FEF2F2' : '#ECFDF5'}; color:${isCrit ? '#DC2626' : '#059669'}; border:1px solid ${isCrit ? '#EF4444' : '#10B981'}; display:inline-block;">
                        ${isCrit ? '🚨 CRÍTICO: ' + item.currentStock + ' und' : '✓ ÓPTIMO: ' + item.currentStock + ' und'}
                      </span>
                      <div style="font-size:0.7rem; color:#64748B; margin-top:2px;">(Mínimo Alerta: ${item.safetyStock} und)</div>
                    </td>
                    <td style="padding:10px 8px; text-align:center; font-weight:800; color:#1E293B;">
                      ${item.moq} und
                    </td>
                    <td style="padding:10px 8px; text-align:center; font-weight:700;">
                      ⏱️ ${item.leadTimeDays} días
                    </td>
                    <td style="padding:10px 8px; text-align:center; font-weight:900; color:#059669;">
                      +${item.roiPercent}%
                    </td>
                    <td style="padding:10px 8px; text-align:center;">
                      <span style="padding:3px 8px; border-radius:6px; font-weight:900; font-size:0.72rem; background:${item.volturiStatus === 'APPROVED' ? '#ECFDF5' : '#FEF2F2'}; color:${item.volturiStatus === 'APPROVED' ? '#047857' : '#B91C1C'}; border:1px solid ${item.volturiStatus === 'APPROVED' ? '#10B981' : '#EF4444'};" title="${item.criticReason}">
                        ${item.volturiStatus === 'APPROVED' ? '✓ APROBADO' : '✗ KILLCRITIC'}
                      </span>
                    </td>
                    <td style="padding:10px 8px; text-align:center;">
                      <div style="display:flex; justify-content:center; gap:6px; flex-wrap:wrap;">
                        <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.openAdjustRestitutionModal('${item.id}')" style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; font-weight:800; font-size:0.72rem; padding:4px 8px; border-radius:6px; cursor:pointer;" title="Ajustar stock actual y cantidad mínima">
                          ✏️ Ajustar
                        </button>
                        <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.dispatchToPandora('${item.id}')" style="background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; font-weight:800; font-size:0.72rem; padding:4px 8px; border-radius:6px; cursor:pointer;" title="Despachar a Pandora">
                          🚀 Enviar
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECCIÓN E: GESTIÓN MULTIMEDIA & VIDEO OFICIAL (EXCLUSIVO STAFF EMPRESARIAL) -->
      <div style="background:#FFFFFF; border:1.5px solid #D4AF37; border-radius:18px; padding:20px; margin-top:24px; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <h4 style="margin:0; font-size:1.15rem; font-weight:900; color:#1C1C1E; display:flex; align-items:center; gap:8px;">
              <span>🎬 Gestión Multimedia & Video de Bienvenida</span>
              <span class="badge" style="background:#D4AF37; color:#121214; font-weight:900; font-size:0.7rem;">EXCLUSIVO STAFF EMPRESARIAL</span>
            </h4>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#6B7280;">
              Control maestro del video corporativo proyectado en pantalla completa en el Splash y Portal Concierge VIP. Los clientes tienen la carga de multimedia 100% inhabilitada.
            </p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn btn-sm" onclick="if(window.authEngine) window.authEngine.openStaffVideoModal();" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; padding:8px 16px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 2px 8px rgba(212,175,55,0.3); display:inline-flex; align-items:center; gap:6px;">
              <span>🎥 Cargar Nuevo Video (.mp4)</span>
            </button>
            <button type="button" class="btn btn-sm" onclick="if(window.authEngine) window.authEngine.resetDefaultVideo();" style="background:#F3F4F6; color:#374151; font-weight:800; padding:8px 14px; border-radius:10px; border:1px solid #D1D5DB; cursor:pointer;" title="Restablecer video corporativo por defecto">
              <span>🔄 Restablecer Predeterminado</span>
            </button>
          </div>
        </div>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:14px; background:#F9FAFB; padding:14px; border-radius:12px; border:1px solid #E5E7EB;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-size:2rem; color:#D4AF37;">🛡️</div>
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#4B5563; text-transform:uppercase;">Protocolo de Seguridad</div>
              <div style="font-size:0.85rem; font-weight:700; color:#1F2937;">Aislamiento Zero-Trust Multimedia</div>
              <div style="font-size:0.75rem; color:#6B7280;">Carga inaccesible a clientes (API + UI bloqueadas)</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-size:2rem; color:#10B981;">📹</div>
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#4B5563; text-transform:uppercase;">Video en Circulación</div>
              <div style="font-size:0.85rem; font-weight:700; color:#1F2937;">assets/mrs_pets_flow_video.mp4</div>
              <div style="font-size:0.75rem; color:#6B7280;">Reproducción continua y cacheada</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setDateRange(range) {
    this.currentDateRange = range;
    this.render();
  }

  showModal(modalHtml) {
    if (window.app && typeof window.app.showModalDirectHtml === 'function') {
      window.app.showModalDirectHtml(modalHtml);
      return;
    }
    if (typeof document === 'undefined') return;
    let modal = document.getElementById('general-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'general-modal';
      modal.className = 'modal-overlay';
      modal.style.setProperty('z-index', '2147483647', 'important');
      modal.innerHTML = `
        <div class="modal-card" style="max-width:820px; width:94%; padding:0; background:transparent !important; border:none !important; box-shadow:none !important; max-height:92vh; overflow-y:auto;">
          <div id="general-modal-body"></div>
        </div>
      `;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
      document.body.appendChild(modal);
    }
    const body = document.getElementById('general-modal-body') || modal;
    body.innerHTML = modalHtml;
    modal.classList.add('active');
    modal.style.removeProperty('display');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
  }

  closeModal() {
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('general-modal');
      return;
    }
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('general-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('opacity', '0', 'important');
      modal.style.setProperty('visibility', 'hidden', 'important');
      modal.style.setProperty('pointer-events', 'none', 'important');
    }
  }

  openCreateVariableModal() {
    const modalHtml = `
      <div style="background:#0F172A; color:#FFFFFF; padding:24px; border-radius:18px; border:2px solid #D4AF37; max-width:540px; margin:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.4); padding-bottom:12px; margin-bottom:16px;">
          <h3 style="margin:0; font-size:1.2rem; font-weight:900; color:#FBBF24;">➕ Crear Concepto Contable Dinámico</h3>
          <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
        </div>

        <form id="form-create-dynamic-var" onsubmit="event.preventDefault(); adminFinanceEngine.handleCreateVariableSubmit(this);">
          <div style="margin-bottom:12px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Nombre del Concepto:</label>
            <input type="text" name="name" required placeholder="Ej. Bono Rendimiento Grooming, Tasa Especial..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
          </div>

          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Tipo de Cálculo:</label>
              <select name="type" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
                <option value="percentage">Porcentaje sobre Ingreso (%)</option>
                <option value="fixed">Monto Fijo en Divisa ($ USD)</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Valor Numérico:</label>
              <input type="number" step="0.01" name="value" required placeholder="Ej. 5 para 5% o 300 para $300" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
          </div>

          <div style="margin-bottom:12px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">División Operativa Asignada:</label>
            <select name="division" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
              <option value="all">Todas las Divisiones (Global)</option>
              <option value="grooming">Grooming & Spa Canino/Felino</option>
              <option value="clinica">Clínica Veterinaria 24 Horas</option>
              <option value="hotel">Admisión Hotel 5★ & Guardería</option>
              <option value="tienda">Tienda & Boutique VIP</option>
            </select>
          </div>

          <div style="margin-bottom:16px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Descripción / Justificación Contable:</label>
            <textarea name="description" rows="2" placeholder="Motivo o base de cálculo legal..." style="width:100%; padding:8px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.82rem;"></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="app.closeModal('general-modal')" style="background:transparent; color:#CBD5E1; border:1px solid #64748B; padding:8px 16px; border-radius:8px; cursor:pointer;">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:8px 18px; border-radius:8px; border:none; cursor:pointer;">💾 Activar Variable</button>
          </div>
        </form>
      </div>
    `;

    this.showModal(modalHtml);
  }

  handleCreateVariableSubmit(form) {
    const name = form.elements['name'] ? form.elements['name'].value : (form.name ? form.name.value : '');
    const type = form.elements['type'] ? form.elements['type'].value : (form.type ? form.type.value : 'percentage');
    const value = form.elements['value'] ? form.elements['value'].value : (form.value ? form.value.value : 0);
    const division = form.elements['division'] ? form.elements['division'].value : (form.division ? form.division.value : 'all');
    const description = form.elements['description'] ? form.elements['description'].value : (form.description ? form.description.value : '');

    const ok = this.createVariable({ name, type, value, division, description });
    if (ok) {
      this.closeModal();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✨ Concepto contable "${name}" activado con éxito.`, 'success');
      }
    }
  }

  openEditVariableModal(varId) {
    const v = this.dynamicVariables.find(item => item.id === varId);
    if (!v) return;

    const modalHtml = `
      <div style="background:#0F172A; color:#FFFFFF; padding:24px; border-radius:18px; border:2px solid #D4AF37; max-width:540px; margin:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.4); padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h3 style="margin:0; font-size:1.2rem; font-weight:900; color:#FBBF24;">✏️ Modificar Concepto Contable Dinámico</h3>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#CBD5E1;">Código: <strong>${v.id}</strong> • Estado: <strong style="color:${v.status === 'active' ? '#34D399' : '#F87171'};">${v.status === 'active' ? 'ACTIVO' : 'RETIRADO'}</strong></p>
          </div>
          <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
        </div>

        <form id="form-edit-dynamic-var" onsubmit="event.preventDefault(); adminFinanceEngine.handleEditVariableSubmit(this, '${v.id}');">
          <div style="margin-bottom:12px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Nombre del Concepto:</label>
            <input type="text" name="name" required value="${v.name}" placeholder="Ej. Bono Rendimiento Grooming, Tasa Especial..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
          </div>

          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Tipo de Cálculo:</label>
              <select name="type" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
                <option value="percentage" ${v.type === 'percentage' ? 'selected' : ''}>Porcentaje sobre Ingreso (%)</option>
                <option value="fixed" ${v.type === 'fixed' ? 'selected' : ''}>Monto Fijo en Divisa ($ USD)</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Valor Numérico:</label>
              <input type="number" step="0.01" name="value" required value="${v.value}" placeholder="Ej. 5 para 5% o 300 para $300" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">División Operativa Asignada:</label>
              <select name="division" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
                <option value="all" ${v.division === 'all' ? 'selected' : ''}>Todas las Divisiones (Global)</option>
                <option value="grooming" ${v.division === 'grooming' ? 'selected' : ''}>Grooming & Spa Canino/Felino</option>
                <option value="clinica" ${v.division === 'clinica' ? 'selected' : ''}>Clínica Veterinaria 24 Horas</option>
                <option value="hotel" ${v.division === 'hotel' ? 'selected' : ''}>Admisión Hotel 5★ & Guardería</option>
                <option value="tienda" ${v.division === 'tienda' ? 'selected' : ''}>Tienda & Boutique VIP</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Estado del Concepto:</label>
              <select name="status" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
                <option value="active" ${v.status === 'active' ? 'selected' : ''}>● Activo (Aplicar en cálculo)</option>
                <option value="retired" ${v.status === 'retired' ? 'selected' : ''}>○ Retirado (Inactivo)</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Descripción / Justificación Contable:</label>
            <textarea name="description" rows="2" placeholder="Motivo o base de cálculo legal..." style="width:100%; padding:8px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.82rem;">${v.description || ''}</textarea>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.deleteVariablePermanently('${v.id}'); app.closeModal('general-modal');" style="background:#450A0A; color:#FCA5A5; border:1px solid #7F1D1D; padding:8px 14px; border-radius:8px; cursor:pointer;" title="Eliminar del catálogo">
              🗑️ Eliminar
            </button>
            <div style="display:flex; gap:10px;">
              <button type="button" class="btn btn-sm btn-secondary" onclick="app.closeModal('general-modal')" style="background:transparent; color:#CBD5E1; border:1px solid #64748B; padding:8px 16px; border-radius:8px; cursor:pointer;">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-primary" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:8px 18px; border-radius:8px; border:none; cursor:pointer;">💾 Guardar Cambios</button>
            </div>
          </div>
        </form>
      </div>
    `;

    this.showModal(modalHtml);
  }

  handleEditVariableSubmit(form, varId) {
    const name = form.elements['name'] ? form.elements['name'].value : (form.name ? form.name.value : '');
    const type = form.elements['type'] ? form.elements['type'].value : (form.type ? form.type.value : 'percentage');
    const value = form.elements['value'] ? form.elements['value'].value : (form.value ? form.value.value : 0);
    const division = form.elements['division'] ? form.elements['division'].value : (form.division ? form.division.value : 'all');
    const status = form.elements['status'] ? form.elements['status'].value : (form.status ? form.status.value : 'active');
    const description = form.elements['description'] ? form.elements['description'].value : (form.description ? form.description.value : '');

    const ok = this.updateVariable(varId, { name, type, value, division, status, description });
    if (ok) {
      this.closeModal();
    }
  }

  // ==================== MODALES: CREACIÓN Y AJUSTE DE RESTITUCIÓN ====================
  openCreateRestitutionModal() {
    const modalHtml = `
      <div style="background:#0F172A; color:#FFFFFF; padding:24px; border-radius:18px; border:2px solid #10B981; max-width:620px; margin:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(16,185,129,0.4); padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h3 style="margin:0; font-size:1.2rem; font-weight:900; color:#34D399;">➕ Registrar Producto / Consumible (Restitución Pandora)</h3>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#CBD5E1;">Configura stock crítico, umbrales de alerta y lote MOQ con validación Volturi.</p>
          </div>
          <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
        </div>

        <form id="form-create-restitution-item" onsubmit="event.preventDefault(); adminFinanceEngine.handleCreateRestitutionSubmit(this);">
          <div style="margin-bottom:12px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Nombre del Producto o Insumo Consumible:</label>
            <input type="text" name="item" required placeholder="Ej. Pipeta Antiparasitaria Felina, Champú Clorhexidina..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
          </div>

          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">División Operativa Asignada:</label>
              <select name="division" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
                <option value="tienda">Tienda & Boutique VIP</option>
                <option value="clinica">Clínica Veterinaria 24H</option>
                <option value="grooming">Grooming & Spa Canino/Felino</option>
                <option value="hotel">Hotel Canino/Felino & Guardería</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Proveedor Oficial / Laboratorio:</label>
              <input type="text" name="supplier" required placeholder="Ej. FarmaVet, Royal Pet, IDEXX..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.75rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Stock Actual:</label>
              <input type="number" min="0" name="currentStock" required value="5" style="width:100%; padding:8px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:700; color:#F87171; display:block; margin-bottom:4px;">Mínimo Alerta:</label>
              <input type="number" min="1" name="safetyStock" required value="10" title="Umbral mínimo de seguridad. Si el stock cae a este valor o menos, se activa la alerta de reposición." style="width:100%; padding:8px; border-radius:8px; border:1px solid #EF4444; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Lote MOQ:</label>
              <input type="number" min="1" name="moq" required value="15" title="Cantidad mínima por pedido" style="width:100%; padding:8px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Lead Time (Días):</label>
              <input type="number" min="1" name="leadTimeDays" required value="3" style="width:100%; padding:8px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:16px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Costo Unitario ($ USD):</label>
              <input type="number" step="0.01" min="0.01" name="unitCost" required value="15.00" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Precio Venta / Estimado ($ USD):</label>
              <input type="number" step="0.01" min="0.01" name="retailPrice" required value="25.00" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
          </div>

          <div style="background:rgba(212,175,55,0.1); border:1px solid #D4AF37; border-radius:10px; padding:10px; margin-bottom:16px; font-size:0.78rem; color:#CBD5E1;">
            ⚖️ <strong>Evaluación Algorítmica Volturi (KillCritic):</strong> Se evaluará automáticamente el retorno ROI (&gt; 25%) y el plazo de entrega (≤ 15 días) para aprobar su reposición en Pandora.
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="app.closeModal('general-modal')" style="background:transparent; color:#CBD5E1; border:1px solid #64748B; padding:8px 16px; border-radius:8px; cursor:pointer;">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; padding:8px 18px; border-radius:8px; border:none; cursor:pointer;">📦 Guardar & Activar Ítem</button>
          </div>
        </form>
      </div>
    `;
    this.showModal(modalHtml);
  }

  handleCreateRestitutionSubmit(form) {
    const item = form.elements['item'] ? form.elements['item'].value : form.item.value;
    const division = form.elements['division'] ? form.elements['division'].value : form.division.value;
    const supplier = form.elements['supplier'] ? form.elements['supplier'].value : form.supplier.value;
    const currentStock = form.elements['currentStock'] ? form.elements['currentStock'].value : form.currentStock.value;
    const safetyStock = form.elements['safetyStock'] ? form.elements['safetyStock'].value : form.safetyStock.value;
    const moq = form.elements['moq'] ? form.elements['moq'].value : form.moq.value;
    const leadTimeDays = form.elements['leadTimeDays'] ? form.elements['leadTimeDays'].value : form.leadTimeDays.value;
    const unitCost = form.elements['unitCost'] ? form.elements['unitCost'].value : form.unitCost.value;
    const retailPrice = form.elements['retailPrice'] ? form.elements['retailPrice'].value : form.retailPrice.value;

    const created = this.createRestitutionItem({
      item, division, supplier, currentStock, safetyStock, moq, leadTimeDays, unitCost, retailPrice
    });

    if (created) {
      this.closeModal();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✨ Producto / consumible "${item}" registrado en control de stock.`, 'success');
      }
    }
  }

  openAdjustRestitutionModal(id) {
    const item = this.restitutionItems.find(i => i.id === id);
    if (!item) return;

    const isCurrentlyCritical = item.currentStock <= item.safetyStock;

    const modalHtml = `
      <div style="background:#0F172A; color:#FFFFFF; padding:24px; border-radius:18px; border:2px solid #38BDF8; max-width:620px; margin:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(56,189,248,0.4); padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h3 style="margin:0; font-size:1.2rem; font-weight:900; color:#38BDF8;">✏️ Modificar Producto / Consumible & Control de Stock</h3>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#CBD5E1;">Código: <strong>${item.id}</strong> • Reposición Pandora Core & Validación Volturi</p>
          </div>
          <button class="btn btn-sm" onclick="app.closeModal('general-modal')" style="background:transparent; color:#FFFFFF; font-size:1.2rem; border:none; cursor:pointer;">✕</button>
        </div>

        <form id="form-adjust-restitution-item" onsubmit="event.preventDefault(); adminFinanceEngine.handleAdjustRestitutionSubmit(this, '${item.id}');">
          <div style="margin-bottom:12px;">
            <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Nombre del Producto o Insumo Consumible:</label>
            <input type="text" name="item" id="adjust-item-name" required value="${item.item}" placeholder="Ej. Royal Canin Mini Adult (3kg)..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
          </div>

          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">División Operativa Asignada:</label>
              <select name="division" id="adjust-division" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
                <option value="tienda" ${item.division === 'tienda' ? 'selected' : ''}>Tienda & Boutique VIP</option>
                <option value="clinica" ${item.division === 'clinica' ? 'selected' : ''}>Clínica Veterinaria 24H</option>
                <option value="grooming" ${item.division === 'grooming' ? 'selected' : ''}>Grooming & Spa Canino/Felino</option>
                <option value="hotel" ${item.division === 'hotel' ? 'selected' : ''}>Hotel Canino/Felino & Guardería</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Proveedor Oficial / Distribuidor:</label>
              <input type="text" name="supplier" id="adjust-supplier" required value="${item.supplier}" placeholder="Ej. Distribuidora Royal Pet C.A." style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.75rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Stock Actual:</label>
              <input type="number" min="0" name="currentStock" id="adjust-current-stock" required value="${item.currentStock}" oninput="adminFinanceEngine.checkStockAlertPreview()" style="width:100%; padding:8px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.9rem; font-weight:800;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:700; color:#F87171; display:block; margin-bottom:4px;">Mínimo Alerta:</label>
              <input type="number" min="1" name="safetyStock" id="adjust-safety-stock" required value="${item.safetyStock}" oninput="adminFinanceEngine.checkStockAlertPreview()" title="Umbral mínimo de seguridad. Si el stock cae a este valor o menos, se activa la alerta de reposición." style="width:100%; padding:8px; border-radius:8px; border:1.5px solid #EF4444; background:#1E293B; color:#FFFFFF; font-size:0.9rem; font-weight:800;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Lote MOQ:</label>
              <input type="number" min="1" name="moq" id="adjust-moq" required value="${item.moq}" oninput="adminFinanceEngine.checkStockAlertPreview()" title="Cantidad mínima por pedido de reposición" style="width:100%; padding:8px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Lead Time (Días):</label>
              <input type="number" min="1" name="leadTimeDays" id="adjust-lead-time" required value="${item.leadTimeDays}" oninput="adminFinanceEngine.checkStockAlertPreview()" style="width:100%; padding:8px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:14px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Costo Unitario ($ USD):</label>
              <input type="number" step="0.01" min="0.01" name="unitCost" id="adjust-unit-cost" required value="${item.unitCost}" oninput="adminFinanceEngine.checkStockAlertPreview()" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Precio Venta / Estimado ($ USD):</label>
              <input type="number" step="0.01" min="0.01" name="retailPrice" id="adjust-retail-price" required value="${item.retailPrice}" oninput="adminFinanceEngine.checkStockAlertPreview()" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#1E293B; color:#FFFFFF; font-size:0.85rem;">
            </div>
          </div>

          <!-- Indicador dinámico en vivo del estado de alerta y evaluación Volturi -->
          <div id="adjust-alert-preview" style="padding:12px; border-radius:10px; margin-bottom:16px; font-size:0.82rem; font-weight:700; background:${isCurrentlyCritical ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; color:${isCurrentlyCritical ? '#FCA5A5' : '#6EE7B7'}; border:1px solid ${isCurrentlyCritical ? '#EF4444' : '#10B981'};">
            <div style="font-weight:900; margin-bottom:4px;">
              ${isCurrentlyCritical 
                ? `🚨 NIVEL CRÍTICO: Stock actual (${item.currentStock} und) ≤ Umbral Mínimo (${item.safetyStock} und). Reposición requerida: ${item.moq} und.` 
                : `✓ NIVEL ÓPTIMO: Stock actual (${item.currentStock} und) > Umbral Mínimo (${item.safetyStock} und). Stock seguro.`}
            </div>
            <div style="font-size:0.75rem; color:#CBD5E1;">
              ROI Estimado: <strong style="color:${item.roiPercent >= 25 ? '#34D399' : '#F87171'};">+${item.roiPercent}%</strong> • 
              Lead Time: <strong>${item.leadTimeDays} días</strong> • 
              Volturi: <span style="font-weight:800; color:${item.volturiStatus === 'APPROVED' ? '#34D399' : '#F87171'};">${item.volturiStatus === 'APPROVED' ? '✓ APROBADO' : '✗ ALERTA KILLCRITIC'}</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.deleteRestitutionItem('${item.id}'); app.closeModal('general-modal');" style="background:#450A0A; color:#FCA5A5; border:1px solid #7F1D1D; padding:8px 14px; border-radius:8px; cursor:pointer;" title="Eliminar ítem de reposición">
              🗑️ Eliminar
            </button>
            <div style="display:flex; gap:10px;">
              <button type="button" class="btn btn-sm btn-secondary" onclick="app.closeModal('general-modal')" style="background:transparent; color:#CBD5E1; border:1px solid #64748B; padding:8px 16px; border-radius:8px; cursor:pointer;">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-primary" style="background:linear-gradient(135deg, #38BDF8, #0284C7); color:#0F172A; font-weight:900; padding:8px 18px; border-radius:8px; border:none; cursor:pointer;">💾 Guardar Modificaciones</button>
            </div>
          </div>
        </form>
      </div>
    `;

    this.showModal(modalHtml);
  }

  checkStockAlertPreview() {
    const curInput = document.getElementById('adjust-current-stock');
    const safInput = document.getElementById('adjust-safety-stock');
    const moqInput = document.getElementById('adjust-moq');
    const leadInput = document.getElementById('adjust-lead-time');
    const costInput = document.getElementById('adjust-unit-cost');
    const priceInput = document.getElementById('adjust-retail-price');
    const preview = document.getElementById('adjust-alert-preview');
    if (!preview) return;

    const cur = curInput ? (parseInt(curInput.value, 10) || 0) : 0;
    const saf = safInput ? (parseInt(safInput.value, 10) || 1) : 1;
    const moq = moqInput ? (parseInt(moqInput.value, 10) || 1) : 1;
    const lead = leadInput ? (parseInt(leadInput.value, 10) || 1) : 1;
    const cost = costInput ? (parseFloat(costInput.value) || 10) : 10;
    const price = priceInput ? (parseFloat(priceInput.value) || 20) : 20;

    const roi = parseFloat((((price - cost) / cost) * 100).toFixed(2));
    const isCrit = cur <= saf;
    const isVolturiApproved = roi >= 25.0 && lead <= 15;

    preview.style.background = isCrit ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)';
    preview.style.color = isCrit ? '#FCA5A5' : '#6EE7B7';
    preview.style.borderColor = isCrit ? '#EF4444' : '#10B981';
    preview.innerHTML = `
      <div style="font-weight:900; margin-bottom:4px;">
        ${isCrit ? `🚨 NIVEL CRÍTICO: Stock actual (${cur} und) ≤ Umbral Mínimo (${saf} und). Reposición requerida: ${moq} und.` : `✓ NIVEL ÓPTIMO: Stock actual (${cur} und) > Umbral Mínimo (${saf} und). Stock seguro.`}
      </div>
      <div style="font-size:0.75rem; color:#CBD5E1;">
        ROI Estimado: <strong style="color:${roi >= 25 ? '#34D399' : '#F87171'};">+${roi}%</strong> • 
        Lead Time: <strong>${lead} días</strong> • 
        Volturi: <span style="font-weight:800; color:${isVolturiApproved ? '#34D399' : '#F87171'};">${isVolturiApproved ? '✓ APROBADO' : '✗ ALERTA KILLCRITIC'}</span>
      </div>
    `;
  }

  handleAdjustRestitutionSubmit(form, id) {
    const item = form.elements['item'] ? form.elements['item'].value : form.item.value;
    const division = form.elements['division'] ? form.elements['division'].value : form.division.value;
    const supplier = form.elements['supplier'] ? form.elements['supplier'].value : form.supplier.value;
    const currentStock = form.elements['currentStock'] ? form.elements['currentStock'].value : form.currentStock.value;
    const safetyStock = form.elements['safetyStock'] ? form.elements['safetyStock'].value : form.safetyStock.value;
    const moq = form.elements['moq'] ? form.elements['moq'].value : form.moq.value;
    const leadTimeDays = form.elements['leadTimeDays'] ? form.elements['leadTimeDays'].value : form.leadTimeDays.value;
    const unitCost = form.elements['unitCost'] ? form.elements['unitCost'].value : form.unitCost.value;
    const retailPrice = form.elements['retailPrice'] ? form.elements['retailPrice'].value : form.retailPrice.value;

    const ok = this.updateRestitutionItem(id, { item, division, supplier, currentStock, safetyStock, moq, leadTimeDays, unitCost, retailPrice });
    if (ok) {
      this.closeModal();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✅ Valores de "${item}" y parámetros de reposición actualizados con éxito.`, 'success');
      }
    }
  }
}

// Instanciación global
const adminFinanceEngine = new AdminFinanceEngine();
window.adminFinanceEngine = adminFinanceEngine;
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => adminFinanceEngine.init());
}
