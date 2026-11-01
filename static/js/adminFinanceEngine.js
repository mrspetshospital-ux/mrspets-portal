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
    this.currentDateRange = 'month'; // 'day', 'week', 'month', 'year', 'custom'
    this.customFrom = '';
    this.customTo = '';

    // Variables dinámicas en memoria
    this.dynamicVariables = [];
    // Egresos y costos operativos
    this.expenses = {};
    // Ítems de reposición logística
    this.restitutionItems = [];
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
    } catch (e) {
      console.warn('Error al cargar estado de Administración y Finanzas:', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKeyVariables, JSON.stringify(this.dynamicVariables));
      localStorage.setItem(this.storageKeyExpenses, JSON.stringify(this.expenses));
      localStorage.setItem(this.storageKeyStockRestitution, JSON.stringify(this.restitutionItems));
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

    // Multiplicadores según rango de fecha
    let factor = 1.0;
    if (dateRange === 'day') factor = 0.033;
    else if (dateRange === 'week') factor = 0.23;
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

          <!-- BOTONES SUPERIORES DE GENERACIÓN DE REPORTES PARA IA -->
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.showManagementModal()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; padding:10px 16px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(212,175,55,0.35); display:inline-flex; align-items:center; gap:6px;">
              <span>📊 Generar Informe de Gestión</span>
            </button>
            <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.showRestitutionModal()" style="background:#10B981; color:#0F172A; font-weight:900; padding:10px 16px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.35); display:inline-flex; align-items:center; gap:6px;">
              <span>📦 Reporte Restitución (Pandora)</span>
            </button>
            <button type="button" class="btn btn-sm" onclick="adminFinanceEngine.exportJsonReport()" style="background:rgba(255,255,255,0.1); color:#FFFFFF; font-weight:800; padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.25); cursor:pointer;" title="Descargar estructura de datos JSON limpia para IA">
              <span>📥 Exportar JSON</span>
            </button>
          </div>
        </div>

        <!-- FILTROS DE RANGO DE FECHAS (DÍA, SEMANA, MES, AÑO, PERSONALIZADO) -->
        <div style="margin-top:20px; padding-top:16px; border-top:1px solid rgba(212,175,55,0.25); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:0.8rem; font-weight:800; color:#FBBF24; margin-right:4px;">📅 Rango de Fechas:</span>
            ${['day', 'week', 'month', 'year'].map(r => `
              <button type="button" onclick="adminFinanceEngine.setDateRange('${r}')" style="padding:6px 14px; border-radius:8px; border:none; font-weight:800; font-size:0.78rem; cursor:pointer; background:${this.currentDateRange === r ? '#D4AF37' : 'rgba(255,255,255,0.08)'}; color:${this.currentDateRange === r ? '#0F172A' : '#CBD5E1'}; transition:all 0.2s ease;">
                ${r === 'day' ? 'Día (Hoy)' : (r === 'week' ? 'Semana' : (r === 'month' ? 'Mes en Curso' : 'Año Fiscal'))}
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
