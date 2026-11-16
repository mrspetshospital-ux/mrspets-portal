/**
 * ==============================================================================
 * BINANCE PAY ENGINE (MRS. PETS OMNICHANNEL PLATFORM)
 * Integración Oficial con la API de Binance Pay (v2 OpenAPI)
 * Cuenta Comercial: mrspets | Email: mrspetsvzla@gmail.com
 * ==============================================================================
 */

class BinancePayEngine {
  constructor() {
    this.config = {
      environment: 'sandbox',
      isProduction: false,
      merchantId: 'mrspets',
      merchantEmail: 'mrspetsvzla@gmail.com',
      defaultCurrency: 'USDT',
      status: 'ready'
    };
    this.currentOrder = null;
    this.pollInterval = null;
    this.isPolling = false;
    this.pollAttempts = 0;
    this.maxPollAttempts = 120; // 5 minutos a 2.5s por sondeo
  }

  async init() {
    console.log('[BinancePayEngine] Inicializando motor de Binance Pay...');
    try {
      const res = await fetch('/api/v1/payments/binance/config');
      if (res.ok) {
        this.config = await res.json();
        console.log(`[BinancePayEngine] Conectado en modo ${this.config.environment.toUpperCase()} • Comercio: ${this.config.merchantId}`);
      }
    } catch (e) {
      console.warn('[BinancePayEngine] Modo fallback local activo:', e);
    }
  }

  // ============================================================================
  // PREPARACIÓN Y CREACIÓN DE ORDEN DINÁMICA
  // ============================================================================

  async prepareCheckout(customParams = {}) {
    const container = document.getElementById('payment-section-binance');
    if (!container) return;

    // Detener cualquier sondeo previo
    this.stopPolling();

    // Obtener total del carrito o parámetro personalizado
    let total = 45.00;
    let petName = 'Príncipe / Princesa Real';
    let petId = 'PET-001';
    let tutorName = 'Dalybell Ramirez Montilla';
    let serviceName = 'Grooming & Estética Canina Spa VIP';

    if (window.storeEngine) {
      if (typeof window.storeEngine.getCartTotal === 'function') {
        const cartTotal = window.storeEngine.getCartTotal();
        if (cartTotal > 0) total = cartTotal;
      }
      if (typeof window.storeEngine.getCurrentCustomerInfo === 'function') {
        const cust = window.storeEngine.getCurrentCustomerInfo();
        if (cust && cust.name) tutorName = cust.name;
      }
      if (Array.isArray(window.storeEngine.cart) && window.storeEngine.cart.length > 0) {
        const petItem = window.storeEngine.cart.find(i => i.pet);
        if (petItem) {
          petName = petItem.pet;
          petId = petItem.petId || petItem.id || 'PET-001';
        }
        const srvItem = window.storeEngine.cart.find(i => i.isGroomingService || i.isClinicalService);
        if (srvItem) {
          serviceName = srvItem.name || serviceName;
        } else if (window.storeEngine.cart[0]) {
          serviceName = window.storeEngine.cart[0].name || serviceName;
        }
      }
    }

    if (customParams.amount) total = parseFloat(customParams.amount);
    if (customParams.petName) petName = customParams.petName;
    if (customParams.petId) petId = customParams.petId;
    if (customParams.tutorName) tutorName = customParams.tutorName;
    if (customParams.serviceName) serviceName = customParams.serviceName;

    // Renderizar estado de carga
    container.innerHTML = `
      <div style="background:#0b0e11; border:2px solid #F0B90B; border-radius:18px; padding:24px; text-align:center; color:#EAECEF; box-shadow:0 10px 30px rgba(240,185,11,0.2);">
        <div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-bottom:14px;">
          <div style="background:#F0B90B; color:#0b0e11; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.2rem;">🟡</div>
          <span style="font-weight:900; font-size:1.25rem; color:#F0B90B; letter-spacing:0.04em;">BINANCE PAY</span>
        </div>
        <div style="font-size:0.9rem; color:#94a3b8; margin-bottom:16px;">Generando orden segura y código QR en la red Binance...</div>
        <div style="display:inline-block; width:36px; height:36px; border:3px solid rgba(240,185,11,0.3); border-top-color:#F0B90B; border-radius:50%; animation:binanceSpin 1s linear infinite;"></div>
        <style>@keyframes binanceSpin { to { transform: rotate(360deg); } }</style>
      </div>
    `;

    try {
      const response = await fetch('/api/v1/payments/binance/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: this.config.defaultCurrency || 'USDT',
          petId: petId,
          petName: petName,
          tutorName: tutorName,
          serviceName: serviceName
        })
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor al generar la orden (HTTP ${response.status})`);
      }

      const orderData = await response.json();
      this.currentOrder = orderData;
      this.renderOrderUi(container, orderData);
      this.startPolling(orderData.merchantTradeNo);

    } catch (err) {
      console.error('[BinancePayEngine] Error creando orden:', err);
      container.innerHTML = `
        <div style="background:#1e1e24; border:1.5px solid #ef4444; border-radius:14px; padding:18px; text-align:center; color:#fca5a5;">
          <div style="font-size:1.8rem; margin-bottom:8px;">⚠️</div>
          <div style="font-weight:800; font-size:0.95rem; margin-bottom:6px;">No se pudo conectar con Binance Pay</div>
          <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:12px;">${err.message || 'Error de conexión'}</div>
          <button type="button" class="btn btn-sm btn-primary" onclick="binancePayEngine.prepareCheckout()" style="background:#F0B90B; color:#000000; font-weight:800; border:none; padding:8px 16px; border-radius:8px; cursor:pointer;">
            🔄 Reintentar
          </button>
        </div>
      `;
    }
  }

  // ============================================================================
  // RENDERIZADO VISUAL DEL CÓDIGO QR Y CONTROLES INTERACTIVOS
  // ============================================================================

  renderOrderUi(container, order) {
    const isSbx = order.environment === 'sandbox';
    const qrSrc = order.qrcodeLink || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(order.qrContent || order.checkoutUrl)}`;

    container.innerHTML = `
      <div style="background:#0b0e11; border:2px solid #F0B90B; border-radius:20px; padding:22px; color:#EAECEF; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow:0 12px 35px rgba(0,0,0,0.5);">
        
        <!-- ENCABEZADO OFICIAL BINANCE PAY -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #23272e; padding-bottom:12px; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="background:#F0B90B; color:#0b0e11; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.1rem;">🟡</div>
            <div>
              <div style="font-weight:900; font-size:1.1rem; color:#FFFFFF; letter-spacing:0.02em;">BINANCE PAY</div>
              <div style="font-size:0.68rem; color:#848E9C;">Comercio Oficial Mrs. Pets • ID: <strong style="color:#F0B90B;">${this.config.merchantId}</strong></div>
            </div>
          </div>
          <span style="font-size:0.7rem; font-weight:800; background:${isSbx ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)'}; color:${isSbx ? '#FACC15' : '#4ADE80'}; border:1px solid ${isSbx ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.4)'}; padding:3px 8px; border-radius:6px; text-transform:uppercase;">
            ${isSbx ? '🧪 Modo Sandbox' : '🟢 Producción Oficial'}
          </span>
        </div>

        <!-- DETALLE DEL MONTO Y SERVICIO -->
        <div style="background:#181a20; border-radius:12px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:0.75rem; color:#848E9C; text-transform:uppercase; font-weight:700;">Total a pagar en Cripto</div>
            <div style="font-size:0.8rem; color:#F0B90B; font-weight:600; margin-top:2px;">${order.serviceName} (${order.petName})</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.35rem; font-weight:900; color:#F0B90B;">${order.amount.toFixed(2)} <span style="font-size:0.9rem; color:#FFFFFF;">${order.currency}</span></div>
            <div style="font-size:0.68rem; color:#848E9C;">Equivalente 1:1 USD Tasa Oficial</div>
          </div>
        </div>

        <!-- TARJETA DEL CÓDIGO QR -->
        <div style="background:#FFFFFF; border-radius:16px; padding:16px; max-width:240px; margin:0 auto 16px auto; text-align:center; box-shadow:0 6px 20px rgba(0,0,0,0.3);">
          <img id="binance-qr-img" src="${qrSrc}" alt="Código QR Binance Pay" style="width:100%; height:auto; display:block; border-radius:8px;">
          <div style="font-size:0.68rem; color:#475569; font-weight:800; margin-top:8px; text-transform:uppercase; letter-spacing:0.04em;">
            Escanea con tu Binance App
          </div>
        </div>

        <!-- BOTONES DE ACCIÓN DIRECTA -->
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
          <a href="${order.deeplink || order.checkoutUrl}" target="_blank" rel="noopener" class="btn" style="background:#F0B90B; color:#000000 !important; font-weight:900; font-size:0.88rem; padding:12px; border-radius:10px; text-align:center; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 15px rgba(240,185,11,0.35);">
            <span>📲 Pagar con la App de Binance</span>
          </a>

          <a href="${order.checkoutUrl}" target="_blank" rel="noopener" class="btn" style="background:rgba(255,255,255,0.08); color:#EAECEF !important; font-weight:700; font-size:0.8rem; padding:10px; border-radius:10px; text-align:center; text-decoration:none; border:1px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; gap:6px;">
            <span>🌐 Abrir en Binance Web Checkout</span>
          </a>
        </div>

        <!-- MONITOR DE ESTADO EN TIEMPO REAL (SONDEO / POLLING) -->
        <div id="binance-status-banner" style="background:#181a20; border:1px solid #2b313a; border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; font-size:0.75rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="binance-pulse-dot" style="display:inline-block; width:8px; height:8px; background:#F0B90B; border-radius:50%; box-shadow:0 0 8px #F0B90B;"></span>
            <span id="binance-status-text" style="color:#EAECEF; font-weight:700;">Esperando confirmación en la red...</span>
          </div>
          <span style="font-size:0.68rem; color:#848E9C; font-family:monospace;">${order.merchantTradeNo.slice(-8)}</span>
        </div>

        <!-- SIMULADOR SANDBOX INTERACTIVO (SOLO EN MODO PRUEBAS) -->
        ${isSbx ? `
          <div style="margin-top:14px; padding-top:12px; border-top:1px dashed #2b313a; text-align:center;">
            <div style="font-size:0.7rem; color:#FACC15; font-weight:700; margin-bottom:6px;">
              🧪 Modo Sandbox Activo: Puedes probar el flujo de confirmación sin transferir fondos reales.
            </div>
            <button type="button" class="btn btn-sm" onclick="binancePayEngine.simulateSandboxPayment('${order.merchantTradeNo}')" style="background:rgba(234,179,8,0.2); color:#FDE047 !important; border:1px solid rgba(234,179,8,0.4); font-weight:800; font-size:0.78rem; padding:8px 14px; border-radius:8px; cursor:pointer;">
              ⚡ Simular Pago Aprobado (Test One-Click)
            </button>
          </div>
        ` : ''}

      </div>
    `;
  }

  // ============================================================================
  // SONDEO EN TIEMPO REAL (REAL-TIME POLLING ENGINE)
  // ============================================================================

  startPolling(merchantTradeNo) {
    this.stopPolling();
    this.isPolling = true;
    this.pollAttempts = 0;

    console.log(`[BinancePayEngine] Iniciando sondeo en tiempo real para ${merchantTradeNo}...`);

    this.pollInterval = setInterval(async () => {
      this.pollAttempts++;
      if (this.pollAttempts > this.maxPollAttempts) {
        this.stopPolling();
        this.handleOrderExpired();
        return;
      }

      try {
        const res = await fetch(`/api/v1/payments/binance/order-status/${merchantTradeNo}`);
        if (res.ok) {
          const statusData = await res.json();
          if (statusData && statusData.status === 'PAID') {
            this.stopPolling();
            this.handlePaymentSuccess(statusData);
          } else if (statusData && (statusData.status === 'EXPIRED' || statusData.status === 'CANCELED')) {
            this.stopPolling();
            this.handleOrderExpired();
          }
        }
      } catch (e) {
        console.warn('[BinancePayEngine] Error temporal en sondeo:', e);
      }
    }, 2500);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  handlePaymentSuccess(orderData) {
    console.log('[BinancePayEngine] 🎉 ¡Pago confirmado exitosamente!', orderData);
    const banner = document.getElementById('binance-status-banner');
    const container = document.getElementById('payment-section-binance');

    if (banner) {
      banner.style.background = 'rgba(34, 197, 94, 0.2)';
      banner.style.borderColor = '#22c55e';
      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; color:#4ade80; font-weight:900;">
          <span>✅</span>
          <span>¡PAGO CONFIRMADO & APROBADO EN BINANCE PAY!</span>
        </div>
      `;
    }

    if (container) {
      container.innerHTML = `
        <div style="background:#0b0e11; border:2px solid #22c55e; border-radius:20px; padding:28px 20px; text-align:center; color:#EAECEF; box-shadow:0 15px 45px rgba(34,197,94,0.3);">
          <div style="font-size:3rem; margin-bottom:10px;">🎉 🟡 ✅</div>
          <h3 style="color:#4ade80; font-weight:900; margin:0 0 6px 0; font-size:1.35rem;">¡PAGO RECIBIDO CON ÉXITO!</h3>
          <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 16px 0;">La transacción ha sido validada y confirmada en la blockchain de Binance.</p>
          
          <div style="background:#181a20; border-radius:12px; padding:14px; text-align:left; font-size:0.82rem; margin-bottom:18px; line-height:1.6;">
            <div>• <strong>Comercio:</strong> Mrs. Pets (mrspets)</div>
            <div>• <strong>Monto Confirmado:</strong> <span style="color:#F0B90B; font-weight:800;">${orderData.amount || '45.00'} ${orderData.currency || 'USDT'}</span></div>
            <div>• <strong>Referencia Comercial:</strong> <code style="color:#38bdf8;">${orderData.merchantTradeNo}</code></div>
            <div>• <strong>Príncipe / Princesa:</strong> ${orderData.petName || 'Mascota Real'}</div>
            <div>• <strong>Estatus del Paciente:</strong> <span style="color:#4ade80; font-weight:800;">Actualizado en Tiempo Real</span></div>
          </div>

          <button type="button" class="btn btn-primary" onclick="app.closeModal('checkout-modal')" style="background:#22c55e; border:none; padding:12px 24px; font-weight:900; font-size:0.92rem; border-radius:10px; cursor:pointer; color:#ffffff;">
            🐾 Volver al Panel de Control
          </button>
        </div>
      `;
    }

    // Feedback audiovisual
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🎉 ¡Pago con Binance Pay de ${orderData.amount || '45.00'} USDT validado con éxito!`, 'success');
    }

    // Actualizar cache de mascotas si está activo
    if (window.petStatus && typeof window.petStatus.fetchLivePets === 'function') {
      window.petStatus.fetchLivePets();
    }
  }

  handleOrderExpired() {
    const banner = document.getElementById('binance-status-banner');
    if (banner) {
      banner.style.background = 'rgba(239, 68, 68, 0.2)';
      banner.style.borderColor = '#ef4444';
      banner.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%; color:#fca5a5; font-weight:700;">
          <span>⌛ La sesión de Binance Pay ha expirado.</span>
          <button type="button" onclick="binancePayEngine.prepareCheckout()" style="background:#ef4444; color:#ffffff; border:none; padding:4px 10px; border-radius:6px; font-size:0.7rem; font-weight:800; cursor:pointer;">
            Generar Nuevo QR
          </button>
        </div>
      `;
    }
  }

  // ============================================================================
  // SIMULACIÓN SANDBOX (ONE-CLICK APPROVAL)
  // ============================================================================

  async simulateSandboxPayment(merchantTradeNo) {
    if (!merchantTradeNo) return;
    try {
      const res = await fetch('/api/v1/payments/binance/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantTradeNo: merchantTradeNo })
      });
      if (res.ok) {
        const data = await res.json();
        this.stopPolling();
        this.handlePaymentSuccess(data.order || { merchantTradeNo, amount: 45.0, currency: 'USDT' });
      }
    } catch (e) {
      console.error('[BinancePayEngine] Error en simulación:', e);
    }
  }
}

// Instanciar motor global
window.binancePayEngine = new BinancePayEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.binancePayEngine.init();
});
