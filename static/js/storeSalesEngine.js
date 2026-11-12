/* ==========================================================================
   STORE SALES & OPERATIONS ENGINE (Mrs. Pets Maracaibo)
   Gestor centralizado de ventas, operaciones de mostrador y pedidos de tienda
   con integración a Tasa Oficial BCV, IVA 16% SENIAT y filtros por período.
   ========================================================================== */

class StoreSalesEngine {
  constructor() {
    this.storageKey = 'mrs_pets_store_sales';
    this.sales = [];
  }

  init() {
    this.loadSales();
    if (this.sales.length === 0) {
      this.seedInitialSales();
    }
  }

  loadSales() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.sales = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error al cargar ventas de tienda:', e);
      this.sales = [];
    }
  }

  saveSales() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.sales));
    } catch (e) {
      console.error('Error al guardar ventas de tienda:', e);
    }
  }

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

  seedInitialSales() {
    const today = this.getTodayDateStr();
    const yesterday = this.getDateWithOffset(-1);
    const daysAgo3 = this.getDateWithOffset(-3);
    const daysAgo5 = this.getDateWithOffset(-5);
    const daysAgo8 = this.getDateWithOffset(-8);
    const daysAgo12 = this.getDateWithOffset(-12);
    const daysAgo20 = this.getDateWithOffset(-20);
    const tomorrow = this.getDateWithOffset(1);
    const in3Days = this.getDateWithOffset(3);

    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;
    const bcvSlot = (window.FinancialEngine && window.FinancialEngine.bcvSlot) || '11:00 AM';

    this.sales = [
      // ==================== VENTAS DE HOY (TODAY) ====================
      {
        id: 'TKT-20261023-1001',
        ticketId: 'TKT-20261023-1001',
        area: 'tienda',
        date: today,
        time: '09:15 AM',
        timestamp: `${today}T09:15:00`,
        customerName: 'Carlos Mendoza',
        customerRif: 'V-14.882.109',
        customerPhone: '+58 (412) 555-1234',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Fifi',
        petSpecies: 'Teckel / Dachshund VIP',
        petImage: 'assets/media__1787695254613.jpg',
        items: [
          { name: 'Royal Canin Mini Adult (3kg)', quantity: 1, price: 28.50, subtotal: 28.50 },
          { name: 'Champú Ozono Hipoalergénico 500ml', quantity: 1, price: 18.00, subtotal: 18.00 }
        ],
        subtotal: 46.50,
        iva: 7.44,
        total: 53.94,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((53.94 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(53.94 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Tarjeta 3D Directa (Stripe Vault)',
        gateway: 'Stripe',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Entrega Inmediata Mostrador',
        staffName: 'Carlos Mendoza (Caja Tienda)',
        notes: 'Cliente frecuente. Factura digital emitida y entregada.'
      },
      {
        id: 'TKT-20261023-1002',
        ticketId: 'TKT-20261023-1002',
        area: 'tienda',
        date: today,
        time: '10:30 AM',
        timestamp: `${today}T10:30:00`,
        customerName: 'Dalybell Ramírez Montilla',
        customerRif: 'V-18.452.910',
        customerPhone: '+58 (414) 389-1102',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Princesa',
        petSpecies: 'Yorkshire Terrier VIP',
        petImage: 'assets/media__1787695246337.jpg',
        items: [
          { name: 'Collar de Cuero Italiano Oro Champagne', quantity: 1, price: 28.00, subtotal: 28.00 },
          { name: 'Snacks Dentales Greenies VIP', quantity: 2, price: 7.00, subtotal: 14.00 }
        ],
        subtotal: 42.00,
        iva: 6.72,
        total: 48.72,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((48.72 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(48.72 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Stripe Card POS / Mostrador',
        gateway: 'Stripe',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Mostrador Tienda (Retiro con Princesa tras Spa)',
        staffName: 'Mariana Briceño (Concierge & Tienda)',
        notes: 'Cliente VIP Platino. Retiro junto con salida de Grooming Spa.'
      },
      {
        id: 'TKT-20261023-1003',
        ticketId: 'TKT-20261023-1003',
        area: 'tienda',
        date: today,
        time: '11:45 AM',
        timestamp: `${today}T11:45:00`,
        customerName: 'Patricia Villalobos',
        customerRif: 'V-19.874.521-0',
        customerPhone: '+58 (414) 679-9510',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Simba',
        petSpecies: 'Gato Persa Blanco',
        petImage: 'assets/media__1787694901704.jpg',
        items: [
          { name: 'Bravecto Perros 10-20kg', quantity: 1, price: 42.00, subtotal: 42.00 },
          { name: 'Snacks Dentales Greenies VIP', quantity: 1, price: 7.00, subtotal: 7.00 }
        ],
        subtotal: 49.00,
        iva: 7.84,
        total: 56.84,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((56.84 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(56.84 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Pago Móvil Banesco (En Línea)',
        gateway: 'Banesco',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Entrega Inmediata Mostrador',
        staffName: 'Carlos Mendoza (Caja Tienda)',
        notes: 'Pago Móvil verificado en tiempo real con referencia #994821.'
      },
      {
        id: 'TKT-20261023-1004',
        ticketId: 'TKT-20261023-1004',
        area: 'tienda',
        date: today,
        time: '02:20 PM',
        timestamp: `${today}T14:20:00`,
        customerName: 'Andrés Morales',
        customerRif: 'V-16.294.103',
        customerPhone: '+58 (414) 332-2110',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Buddy',
        petSpecies: 'Golden Retriever',
        petImage: 'assets/mrs_pets_golden_welcome_1787694735845.jpg',
        items: [
          { name: 'Royal Canin Maxi Puppy (3kg)', quantity: 2, price: 32.00, subtotal: 64.00 },
          { name: 'Juguete Kong Extreme Grande', quantity: 1, price: 16.00, subtotal: 16.00 }
        ],
        subtotal: 80.00,
        iva: 12.80,
        total: 92.80,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((92.80 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(92.80 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Punto de Venta POS Biopago',
        gateway: 'POS',
        status: 'pending',
        stepIndex: 2,
        deliveryType: 'Retiro en Mostrador (Al culminar Grooming de Buddy)',
        staffName: 'Mariana Briceño (Concierge & Tienda)',
        notes: 'Pendiente de entrega: Empacado en mostrador para entregar cuando Buddy culmine baño.'
      },
      {
        id: 'TKT-20261023-1005',
        ticketId: 'TKT-20261023-1005',
        area: 'tienda',
        date: today,
        time: '03:45 PM',
        timestamp: `${today}T15:45:00`,
        customerName: 'Roberto Finol',
        customerRif: 'V-17.512.440',
        customerPhone: '+58 (414) 620-4491',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Max',
        petSpecies: 'Pastor Alemán',
        petImage: 'assets/hero_border_collie.jpg',
        items: [
          { name: 'Suplemento Articular Glycoflex 60 tab', quantity: 1, price: 38.00, subtotal: 38.00 },
          { name: 'Champú Ozono Hipoalergénico 500ml', quantity: 1, price: 18.00, subtotal: 18.00 }
        ],
        subtotal: 56.00,
        iva: 8.96,
        total: 64.96,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((64.96 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(64.96 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Efectivo Divisas ($ USD)',
        gateway: 'Caja',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Entrega Inmediata Mostrador',
        staffName: 'Carlos Mendoza (Caja Tienda)',
        notes: 'Pago recibido en efectivo USD en caja boutique.'
      },
      {
        id: 'TKT-20261023-1006',
        ticketId: 'TKT-20261023-1006',
        area: 'tienda',
        date: today,
        time: '05:10 PM',
        timestamp: `${today}T17:10:00`,
        customerName: 'Ana Sofía Padrón',
        customerRif: 'V-20.198.332',
        customerPhone: '+58 (412) 884-1920',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Mimi',
        petSpecies: 'Siamés Tradicional',
        petImage: 'assets/media__1787694901704.jpg',
        items: [
          { name: 'Royal Canin Kitten Feline (2kg)', quantity: 1, price: 26.00, subtotal: 26.00 },
          { name: 'Snacks Dentales Greenies VIP', quantity: 2, price: 7.00, subtotal: 14.00 }
        ],
        subtotal: 40.00,
        iva: 6.40,
        total: 46.40,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((46.40 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(46.40 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Tarjeta 3D Directa (Stripe)',
        gateway: 'Stripe',
        status: 'pending',
        stepIndex: 2,
        deliveryType: 'Delivery VIP Express Av. El Milagro',
        staffName: 'Mariana Briceño (Concierge & Tienda)',
        notes: 'Empacado en mostrador. Asignado a despacho 06:00 PM.'
      },

      // ==================== PEDIDOS PROGRAMADOS (FUTURE) ====================
      {
        id: 'TKT-20261024-2001',
        ticketId: 'TKT-20261024-2001',
        area: 'tienda',
        date: tomorrow,
        time: '10:00 AM',
        timestamp: `${tomorrow}T10:00:00`,
        customerName: 'María Gabriela Chacín',
        customerRif: 'V-15.671.203',
        customerPhone: '+58 (414) 700-1192',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Toby',
        petSpecies: 'Beagle Tricolor',
        petImage: 'assets/media__1787695246337.jpg',
        items: [
          { name: 'Cama Ortopédica Viscoelástica VIP', quantity: 1, price: 65.00, subtotal: 65.00 },
          { name: 'Champú Ozono Hipoalergénico 500ml', quantity: 2, price: 18.00, subtotal: 36.00 }
        ],
        subtotal: 101.00,
        iva: 16.16,
        total: 117.16,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((117.16 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(117.16 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Tarjeta 3D Directa (Stripe)',
        gateway: 'Stripe',
        status: 'pending',
        stepIndex: 2,
        deliveryType: 'Retiro Programado Mañana 10:00 AM',
        staffName: 'Carlos Mendoza (Caja Tienda)',
        notes: 'Pedido anticipado pagado vía web. Preparar empaque de regalo.'
      },
      {
        id: 'TKT-20261026-2002',
        ticketId: 'TKT-20261026-2002',
        area: 'tienda',
        date: in3Days,
        time: '02:00 PM',
        timestamp: `${in3Days}T14:00:00`,
        customerName: 'José Gregorio Rincón',
        customerRif: 'V-13.901.884',
        customerPhone: '+58 (414) 633-8821',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Luna',
        petSpecies: 'Labrador Retriever',
        petImage: 'assets/mrs_pets_golden_welcome_1787694735845.jpg',
        items: [
          { name: 'Bravecto Perros 10-20kg', quantity: 2, price: 42.00, subtotal: 84.00 },
          { name: 'Royal Canin Maxi Adult (3kg)', quantity: 1, price: 30.00, subtotal: 30.00 }
        ],
        subtotal: 114.00,
        iva: 18.24,
        total: 132.24,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((132.24 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(132.24 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Pago Móvil Banesco',
        gateway: 'Banesco',
        status: 'pending',
        stepIndex: 2,
        deliveryType: 'Entrega en Suite Hotel 5★ al Ingreso',
        staffName: 'Mariana Briceño (Concierge & Tienda)',
        notes: 'Suministros para la estadía de Luna en Hotel 5★ la próxima semana.'
      },

      // ==================== VENTAS DE LA SEMANA (PAST 7 DAYS) ====================
      {
        id: 'TKT-20261022-0901',
        ticketId: 'TKT-20261022-0901',
        area: 'tienda',
        date: yesterday,
        time: '11:15 AM',
        timestamp: `${yesterday}T11:15:00`,
        customerName: 'Valeria Morán',
        customerRif: 'V-21.409.112',
        customerPhone: '+58 (412) 777-3344',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Coco',
        petSpecies: 'Poodle Toy Blanco',
        petImage: 'assets/media__1787695246337.jpg',
        items: [
          { name: 'Champú Ozono Hipoalergénico 500ml', quantity: 1, price: 18.00, subtotal: 18.00 },
          { name: 'Perfume Luxury Mrs. Pets Canino', quantity: 1, price: 15.00, subtotal: 15.00 }
        ],
        subtotal: 33.00,
        iva: 5.28,
        total: 38.28,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((38.28 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(38.28 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Tarjeta 3D Directa (Stripe)',
        gateway: 'Stripe',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Entrega Inmediata Mostrador',
        staffName: 'Carlos Mendoza (Caja Tienda)',
        notes: 'Comprobante emitido.'
      },
      {
        id: 'TKT-20261020-0801',
        ticketId: 'TKT-20261020-0801',
        area: 'tienda',
        date: daysAgo3,
        time: '04:10 PM',
        timestamp: `${daysAgo3}T16:10:00`,
        customerName: 'Dalybell Ramírez Montilla',
        customerRif: 'V-18.452.910',
        customerPhone: '+58 (414) 389-1102',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Princesa',
        petSpecies: 'Yorkshire Terrier VIP',
        petImage: 'assets/media__1787695246337.jpg',
        items: [
          { name: 'Royal Canin Mini Adult (3kg)', quantity: 2, price: 28.50, subtotal: 57.00 },
          { name: 'Snacks Dentales Greenies VIP', quantity: 1, price: 7.00, subtotal: 7.00 }
        ],
        subtotal: 64.00,
        iva: 10.24,
        total: 74.24,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((74.24 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(74.24 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Stripe Card POS / Mostrador',
        gateway: 'Stripe',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Entrega Inmediata Mostrador',
        staffName: 'Mariana Briceño (Concierge & Tienda)',
        notes: 'Compra recurrente quincenal de alimento.'
      },
      {
        id: 'TKT-20261018-0701',
        ticketId: 'TKT-20261018-0701',
        area: 'tienda',
        date: daysAgo5,
        time: '01:45 PM',
        timestamp: `${daysAgo5}T13:45:00`,
        customerName: 'Santiago Urdaneta',
        customerRif: 'V-18.990.142',
        customerPhone: '+58 (414) 612-8800',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Zeus',
        petSpecies: 'Rottweiler VIP',
        petImage: 'assets/hero_border_collie.jpg',
        items: [
          { name: 'Bravecto Perros 20-40kg', quantity: 1, price: 46.00, subtotal: 46.00 },
          { name: 'Correa Táctica Reforzada Mrs. Pets', quantity: 1, price: 24.00, subtotal: 24.00 }
        ],
        subtotal: 70.00,
        iva: 11.20,
        total: 81.20,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((81.20 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(81.20 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Punto de Venta POS Biopago',
        gateway: 'POS',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Entrega Inmediata Mostrador',
        staffName: 'Carlos Mendoza (Caja Tienda)',
        notes: 'Factura aprobada.'
      },

      // ==================== VENTAS DE LA QUINCENA (PAST 15 DAYS) ====================
      {
        id: 'TKT-20261015-0601',
        ticketId: 'TKT-20261015-0601',
        area: 'tienda',
        date: daysAgo8,
        time: '10:00 AM',
        timestamp: `${daysAgo8}T10:00:00`,
        customerName: 'Elena Baralt',
        customerRif: 'V-16.782.901',
        customerPhone: '+58 (414) 650-2211',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Kira',
        petSpecies: 'Bulldog Francés',
        petImage: 'assets/media__1787695246337.jpg',
        items: [
          { name: 'Arnés Ergonómico Transpirable Mrs. Pets', quantity: 1, price: 32.00, subtotal: 32.00 },
          { name: 'Snacks Dentales Greenies VIP', quantity: 2, price: 7.00, subtotal: 14.00 }
        ],
        subtotal: 46.00,
        iva: 7.36,
        total: 53.36,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((53.36 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(53.36 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Pago Móvil Banesco',
        gateway: 'Banesco',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Entrega Inmediata Mostrador',
        staffName: 'Carlos Mendoza (Caja Tienda)',
        notes: 'Comprobante fiscal verificado.'
      },
      {
        id: 'TKT-20261011-0501',
        ticketId: 'TKT-20261011-0501',
        area: 'tienda',
        date: daysAgo12,
        time: '03:30 PM',
        timestamp: `${daysAgo12}T15:30:00`,
        customerName: 'Andrés Morales',
        customerRif: 'V-16.294.103',
        customerPhone: '+58 (414) 332-2110',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Buddy',
        petSpecies: 'Golden Retriever',
        petImage: 'assets/mrs_pets_golden_welcome_1787694735845.jpg',
        items: [
          { name: 'Champú Ozono Hipoalergénico 500ml', quantity: 2, price: 18.00, subtotal: 36.00 },
          { name: 'Cepillo Deslanador Carda Metálica', quantity: 1, price: 14.00, subtotal: 14.00 }
        ],
        subtotal: 50.00,
        iva: 8.00,
        total: 58.00,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((58.00 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(58.00 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Tarjeta 3D Directa (Stripe)',
        gateway: 'Stripe',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Entrega Inmediata Mostrador',
        staffName: 'Mariana Briceño (Concierge & Tienda)',
        notes: 'Comprobante despachado.'
      },

      // ==================== VENTAS DEL MES (PAST 30 DAYS) ====================
      {
        id: 'TKT-20261003-0401',
        ticketId: 'TKT-20261003-0401',
        area: 'tienda',
        date: daysAgo20,
        time: '12:00 PM',
        timestamp: `${daysAgo20}T12:00:00`,
        customerName: 'Guillermo Albarrán',
        customerRif: 'V-12.871.490',
        customerPhone: '+58 (414) 639-0092',
        customerPhoto: 'assets/leia_avatar.jpg',
        petName: 'Thor',
        petSpecies: 'Siberian Husky',
        petImage: 'assets/hero_border_collie.jpg',
        items: [
          { name: 'Royal Canin Maxi Adult (3kg)', quantity: 3, price: 30.00, subtotal: 90.00 },
          { name: 'Bravecto Perros 20-40kg', quantity: 1, price: 46.00, subtotal: 46.00 }
        ],
        subtotal: 136.00,
        iva: 21.76,
        total: 157.76,
        bcvRate: bcvRate,
        bcvSlot: bcvSlot,
        totalVes: parseFloat((157.76 * bcvRate).toFixed(2)),
        formattedTotalVes: `Bs. ${(157.76 * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMethod: 'Efectivo Divisas ($ USD)',
        gateway: 'Caja',
        status: 'completed',
        stepIndex: 3,
        deliveryType: 'Entrega Inmediata Mostrador',
        staffName: 'Carlos Mendoza (Caja Tienda)',
        notes: 'Factura mensual despachada.'
      }
    ];

    this.saveSales();
  }

  recordSale(saleData) {
    if (!saleData) return null;

    const today = this.getTodayDateStr();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const bcvRate = saleData.bcvRate || (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;
    const bcvSlot = saleData.bcvSlot || (window.FinancialEngine && window.FinancialEngine.bcvSlot) || '11:00 AM';

    const subtotal = typeof saleData.subtotal === 'number' ? saleData.subtotal : parseFloat(saleData.subtotal || 0);
    const iva = typeof saleData.iva === 'number' ? saleData.iva : parseFloat(saleData.iva || 0);
    const total = typeof saleData.total === 'number' ? saleData.total : (subtotal + iva);
    const totalVes = typeof saleData.totalVes === 'number' ? saleData.totalVes : parseFloat((total * bcvRate).toFixed(2));
    const formattedTotalVes = saleData.formattedTotalVes || `Bs. ${totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const newSale = {
      id: saleData.ticketId || `TKT-${today.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      ticketId: saleData.ticketId || `TKT-${today.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      area: 'tienda',
      date: saleData.date || today,
      time: saleData.time || timeStr,
      timestamp: saleData.timestamp || now.toISOString(),
      customerName: saleData.customerName || 'Cliente Mostrador VIP',
      customerRif: saleData.customerRif || saleData.rif || 'V-19.874.521-0',
      customerPhone: saleData.customerPhone || saleData.phone || '+58 (414) 679-9510',
      customerPhoto: saleData.customerPhoto || 'assets/leia_avatar.jpg',
      petName: saleData.petName || 'Mascota VIP',
      petSpecies: saleData.petSpecies || 'Canino / Felino VIP',
      petImage: saleData.petImage || 'assets/media__1787694901704.jpg',
      items: Array.isArray(saleData.items) ? saleData.items : [{ name: 'Compra en Tienda VIP', quantity: 1, price: subtotal, subtotal: subtotal }],
      subtotal: subtotal,
      iva: iva,
      total: total,
      bcvRate: bcvRate,
      bcvSlot: bcvSlot,
      totalVes: totalVes,
      formattedTotalVes: formattedTotalVes,
      paymentMethod: saleData.paymentMethod || 'Tarjeta 3D Directa (Stripe)',
      gateway: saleData.gateway || 'Stripe',
      status: saleData.status || 'completed',
      stepIndex: saleData.stepIndex !== undefined ? saleData.stepIndex : (saleData.status === 'pending' ? 2 : 3),
      deliveryType: saleData.deliveryType || 'Entrega Inmediata Mostrador',
      staffName: saleData.staffName || 'Staff Operativo Tienda',
      notes: saleData.notes || 'Operación registrada en el sistema de ventas de tienda.'
    };

    this.sales.unshift(newSale);
    this.saveSales();

    if (window.petStatusEngine && typeof window.petStatusEngine.render === 'function') {
      window.petStatusEngine.render();
    }

    return newSale;
  }

  updateSaleStatus(ticketId, newStatus, stepIndex) {
    const sale = this.sales.find(s => s.id === ticketId || s.ticketId === ticketId);
    if (!sale) return false;

    sale.status = newStatus;
    if (stepIndex !== undefined) {
      sale.stepIndex = stepIndex;
    } else {
      sale.stepIndex = newStatus === 'completed' ? 3 : 2;
    }
    sale.updatedAt = new Date().toISOString();

    this.saveSales();

    if (window.liveNotificationEngine && (newStatus === 'ready' || newStatus === 'completed' || sale.stepIndex >= 2)) {
      try {
        window.liveNotificationEngine.notifyStoreOrderReady(sale);
      } catch (errStoreNotify) {
        console.warn('[LiveNotification] Error en notifyStoreOrderReady:', errStoreNotify);
      }
    }

    if (window.petStatusEngine && typeof window.petStatusEngine.render === 'function') {
      window.petStatusEngine.render();
    }

    return true;
  }

  getAllSales() {
    return [...this.sales];
  }

  getSalesForCustomer(customerName, customerPhone) {
    if (!customerName && !customerPhone) return [];
    const norm = (s) => (s || '').toString().toLowerCase().trim();
    const cName = norm(customerName);
    const cPhone = norm(customerPhone).replace(/[^0-9]/g, '');

    return this.sales.filter(s => {
      const sName = norm(s.customerName);
      const sPhone = norm(s.customerPhone).replace(/[^0-9]/g, '');
      const matchName = cName && sName && (sName.includes(cName) || cName.includes(sName));
      const matchPhone = cPhone && sPhone && (sPhone.includes(cPhone) || cPhone.includes(sPhone));
      return matchName || matchPhone;
    });
  }

  isSaleWithinDate(sale, dateFilter, customFrom, customTo) {
    if (!dateFilter || dateFilter === 'all_dates') return true;

    const todayStr = this.getTodayDateStr();
    const saleDateStr = sale.date || (sale.timestamp ? sale.timestamp.split('T')[0] : todayStr);

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const parts = saleDateStr.split('-');
    const saleDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

    const diffDays = Math.floor((todayStart.getTime() - saleDateObj.getTime()) / (1000 * 3600 * 24));

    if (dateFilter === 'today') {
      return diffDays === 0 || saleDateStr === todayStr;
    } else if (dateFilter === 'future' || dateFilter === 'upcoming') {
      return diffDays < 0 || saleDateStr > todayStr;
    } else if (dateFilter === 'week') {
      return diffDays >= -7 && diffDays <= 7;
    } else if (dateFilter === 'fortnight') {
      return diffDays >= -15 && diffDays <= 15;
    } else if (dateFilter === 'month') {
      return diffDays >= -30 && diffDays <= 30;
    } else if (dateFilter === 'custom') {
      if (!customFrom && !customTo) return true;
      let valid = true;
      if (customFrom) {
        const fromParts = customFrom.split('-');
        const fromDate = new Date(parseInt(fromParts[0], 10), parseInt(fromParts[1], 10) - 1, parseInt(fromParts[2], 10));
        valid = valid && (saleDateObj >= fromDate);
      }
      if (customTo) {
        const toParts = customTo.split('-');
        const toDate = new Date(parseInt(toParts[0], 10), parseInt(toParts[1], 10) - 1, parseInt(toParts[2], 10));
        valid = valid && (saleDateObj <= toDate);
      }
      return valid;
    }

    return true;
  }

  filterSales({ dateFilter = 'today', statusFilter = 'all', isStaff = true, customerName = '', customerPhone = '', customFrom = '', customTo = '', searchQuery = '' } = {}) {
    const baseList = isStaff ? this.getAllSales() : this.getSalesForCustomer(customerName, customerPhone);

    const q = (searchQuery || '').toLowerCase().trim();

    return baseList.filter(s => {
      // 1. Fecha
      const matchDate = this.isSaleWithinDate(s, dateFilter, customFrom, customTo);
      if (!matchDate) return false;

      // 2. Estado de Proceso
      let matchStatus = true;
      if (statusFilter === 'in_progress') {
        matchStatus = s.stepIndex < 3 || s.status === 'pending';
      } else if (statusFilter === 'processed') {
        matchStatus = s.stepIndex >= 3 || s.status === 'completed';
      }
      if (!matchStatus) return false;

      // 3. Búsqueda por texto
      if (q) {
        const matchQ = (s.ticketId && s.ticketId.toLowerCase().includes(q)) ||
                       (s.customerName && s.customerName.toLowerCase().includes(q)) ||
                       (s.petName && s.petName.toLowerCase().includes(q)) ||
                       (s.items && s.items.some(i => i.name && i.name.toLowerCase().includes(q))) ||
                       (s.paymentMethod && s.paymentMethod.toLowerCase().includes(q));
        if (!matchQ) return false;
      }

      return true;
    });
  }

  calculateTotals(salesList = []) {
    let totalUsd = 0;
    let subtotalUsd = 0;
    let ivaUsd = 0;
    let totalVes = 0;
    const byPaymentMethod = {};

    salesList.forEach(s => {
      totalUsd += (typeof s.total === 'number' ? s.total : parseFloat(s.total || 0));
      subtotalUsd += (typeof s.subtotal === 'number' ? s.subtotal : parseFloat(s.subtotal || 0));
      ivaUsd += (typeof s.iva === 'number' ? s.iva : parseFloat(s.iva || 0));
      totalVes += (typeof s.totalVes === 'number' ? s.totalVes : parseFloat(s.totalVes || 0));

      const methodKey = s.gateway || s.paymentMethod || 'Otros';
      byPaymentMethod[methodKey] = (byPaymentMethod[methodKey] || 0) + (s.total || 0);
    });

    const count = salesList.length;
    const ticketPromedio = count > 0 ? (totalUsd / count) : 0;
    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) || 48.50;

    return {
      count,
      totalUsd: parseFloat(totalUsd.toFixed(2)),
      subtotalUsd: parseFloat(subtotalUsd.toFixed(2)),
      ivaUsd: parseFloat(ivaUsd.toFixed(2)),
      totalVes: parseFloat(totalVes.toFixed(2)),
      formattedTotalVes: `Bs. ${totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ticketPromedioUsd: parseFloat(ticketPromedio.toFixed(2)),
      bcvRate,
      byPaymentMethod
    };
  }
}

// Instanciación global
const storeSalesEngine = new StoreSalesEngine();
window.storeSalesEngine = storeSalesEngine;
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => storeSalesEngine.init());
}
