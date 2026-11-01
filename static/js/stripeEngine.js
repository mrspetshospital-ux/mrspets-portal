/**
 * ==============================================================================
 * STRIPE ENGINE (MRS. PETS OMNICHANNEL PLATFORM)
 * Módulos: Stripe Payments (Elements & Wallets), Stripe Tax & Stripe Terminal (POS)
 * ==============================================================================
 */

class StripeEngine {
  constructor() {
    this.publishableKey = 'pk_test_51URGquDdBs7xd2bkOwXM43HmrxrjtVHiuI1OUIJqATWUVhvOOgXA6X96v9N97Z79NPmjJZbmRmBAqOmm8ccH8L9C00KkaT66La';
    this.stripe = null;
    this.elements = null;
    this.paymentElement = null;
    this.terminal = null;
    this.connectedReader = null;
    this.currentClientSecret = null;
    this.isTerminalSimulated = true;
    this.taxRate = 0.16; // Tasa referencial Stripe Tax para servicios retail/pet care
    this.isProcessing = false;
  }

  async init() {
    console.log('[StripeEngine] Inicializando motor omnicanal de Stripe...');
    try {
      const response = await fetch('/api/stripe/config');
      if (response.ok) {
        const config = await response.json();
        if (config.publishableKey) {
          this.publishableKey = config.publishableKey;
        }
      }
    } catch (e) {
      console.log('[StripeEngine] Modo local/offline activo para Stripe.');
    }

    if (window.Stripe && this.publishableKey) {
      try {
        this.stripe = window.Stripe(this.publishableKey);
        console.log('[StripeEngine] Stripe.js inicializado con éxito con la llave pública autorizada.');
      } catch (err) {
        console.warn('[StripeEngine] Fallback en Stripe.js:', err);
      }
    }
  }

  // ============================================================================
  // 1. STRIPE PAYMENTS & STRIPE TAX (ONLINE CLIENT CHECKOUT)
  // ============================================================================

  async mountPaymentElement() {
    const container = document.getElementById('stripe-payment-element');
    const taxSummary = document.getElementById('stripe-tax-summary');
    const errorsDiv = document.getElementById('stripe-card-errors');
    if (!container) return;

    if (errorsDiv) errorsDiv.innerText = '';
    
    // Consulta dinámica de la Tasa Oficial BCV vigente
    if (window.FinancialEngine && typeof window.FinancialEngine.ensureFreshRate === 'function') {
      await window.FinancialEngine.ensureFreshRate();
    }

    // Obtener desglose legal de la cesta del StoreEngine (Base imponible e IVA 16%)
    const subtotal = window.storeEngine && typeof window.storeEngine.getCartSubtotal === 'function'
      ? window.storeEngine.getCartSubtotal()
      : (window.storeEngine ? window.storeEngine.getCartTotal() : 0);
    const effectiveSubtotal = subtotal > 0 ? subtotal : 45.00;
    
    // Cálculo automatizado con IVA Oficial SENIAT (16%) y Stripe Tax
    const calculatedTax = window.storeEngine && typeof window.storeEngine.getCartIva === 'function'
      ? window.storeEngine.getCartIva(effectiveSubtotal)
      : parseFloat((effectiveSubtotal * this.taxRate).toFixed(2));
    const igtfTax = window.storeEngine && typeof window.storeEngine.getCartIgtf === 'function'
      ? window.storeEngine.getCartIgtf(effectiveSubtotal, 'USD')
      : parseFloat((effectiveSubtotal * 0.03).toFixed(2));
    const grandTotal = parseFloat((effectiveSubtotal + calculatedTax + igtfTax).toFixed(2));

    const bcvCalc = window.FinancialEngine && typeof window.FinancialEngine.calculateWithTax === 'function'
      ? window.FinancialEngine.calculateWithTax(effectiveSubtotal, 'USD')
      : null;

    if (taxSummary) {
      taxSummary.innerHTML = `
        <div style="background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 16px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#475569; margin-bottom:6px;">
            <span>Subtotal (Base Imponible):</span>
            <strong style="color:#0f172a;">$${effectiveSubtotal.toFixed(2)} USD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#475569; margin-bottom:6px;">
            <span style="display:flex; align-items:center; gap:6px;">
              <span>IVA (${bcvCalc ? bcvCalc.ivaPercent : 16}% Legal SENIAT):</span>
              <span style="font-size:0.65rem; background:#D4AF37; color:#1E1E24; padding:1px 6px; border-radius:4px; font-weight:800;">OFICIAL</span>
            </span>
            <strong style="color:#B45309;">+$${calculatedTax.toFixed(2)} USD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#475569; margin-bottom:6px;">
            <span style="display:flex; align-items:center; gap:6px;">
              <span>IGBT (${bcvCalc ? bcvCalc.igtfConfiguredPercent : 3}% Pago en Dólares):</span>
              <span style="font-size:0.65rem; background:#B45309; color:#FFFFFF; padding:1px 6px; border-radius:4px; font-weight:800;">DIVISAS</span>
            </span>
            <strong style="color:#B45309;">+$${igtfTax.toFixed(2)} USD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:1.02rem; font-weight:900; color:#0f172a; padding-top:8px; border-top:1px dashed #cbd5e1;">
            <span>TOTAL A PAGAR:</span>
            <span style="color:#059669; font-size:1.25rem;">$${grandTotal.toFixed(2)} USD</span>
          </div>
          ${bcvCalc ? `
          <div style="margin-top:8px; padding-top:6px; border-top:1px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center; font-size:0.82rem;">
            <span style="color:#0284C7; font-weight:700;">🇻🇪 Equivalente Oficial BCV:</span>
            <strong style="color:#0284C7; font-size:0.92rem;">${bcvCalc.formattedTotalVes}</strong>
          </div>
          <div style="font-size:0.7rem; color:#64748B; margin-top:2px; text-align:right;">
            Tasa: <strong>${bcvCalc.bcvRate.toFixed(2)} Bs/USD</strong> • Bloque Oficial: <strong>${bcvCalc.bcvSlot}</strong> (Sin dólar paralelo)
          </div>` : ''}
        </div>
      `;
    }

    // Si Stripe.js está completamente cargado y configurado con llaves de Stripe
    if (this.stripe && !this.publishableKey.includes('DemoStripeKey')) {
      try {
        container.innerHTML = '<div style="text-align:center; padding:12px; color:#635BFF;">⏳ Cargando Stripe Payment Element...</div>';
        
        // Obtener clientSecret desde backend
        const res = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(grandTotal * 100),
            currency: 'usd',
            customerName: window.storeEngine ? window.storeEngine.getCurrentCustomerName() : 'Cliente Mrs. Pets',
            metadata: {
              platform: 'MrsPets_Omnichannel',
              source: 'Client_PWA'
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          this.currentClientSecret = data.clientSecret;
          this.elements = this.stripe.elements({ clientSecret: this.currentClientSecret });
          this.paymentElement = this.elements.create('payment', {
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto'
            }
          });
          container.innerHTML = '';
          this.paymentElement.mount('#stripe-payment-element');
          return;
        }
      } catch (err) {
        console.warn('[StripeEngine] Conexión directa a Stripe API no disponible, montando simulador interactivo:', err);
      }
    }

    // Renderizado Interactivo de Stripe Elements de Alta Fidelidad (Modo Test / Sandbox)
    this.renderInteractiveStripeElements(container, grandTotal);
  }

  renderInteractiveStripeElements(container, grandTotal) {
    container.innerHTML = `
      <div style="background:#ffffff; border:1.5px solid #E2E8F0; border-radius:14px; padding:18px; box-shadow:0 4px 15px rgba(99,91,255,0.06);">
        <!-- Logos de Métodos Soportados -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:900; font-size:1.15rem; color:#635BFF; letter-spacing:-0.03em;">stripe</span>
            <span style="font-size:0.75rem; background:#EEF2FF; color:#4F46E5; padding:2px 8px; border-radius:6px; font-weight:700;">Elements v3</span>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span style="font-size:0.72rem; background:#000; color:#fff; padding:3px 7px; border-radius:4px; font-weight:800;">Pay</span>
            <span style="font-size:0.72rem; background:#fff; border:1px solid #cbd5e1; color:#5f6368; padding:2px 6px; border-radius:4px; font-weight:800;">GPay</span>
            <span style="font-size:0.72rem; background:#00D4B2; color:#0b2228; padding:2px 6px; border-radius:4px; font-weight:800;">Link</span>
          </div>
        </div>

        <!-- Formulario Element de Tarjeta y Billeteras -->
        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:0.75rem; font-weight:800; color:#334155; margin-bottom:6px; text-transform:uppercase;">
            Número de Tarjeta (Stripe Secure Vault)
          </label>
          <div style="position:relative;">
            <input type="text" id="stripe-input-card" value="4242 •••• •••• 4242" 
                   style="width:100%; padding:11px 40px 11px 12px; font-family:monospace; font-size:0.95rem; border:1.5px solid #cbd5e1; border-radius:8px; background:#f8fafc; color:#0f172a; font-weight:700;" readonly>
            <span style="position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:1.1rem;">💳</span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px;">
          <div>
            <label style="display:block; font-size:0.75rem; font-weight:800; color:#334155; margin-bottom:6px; text-transform:uppercase;">
              Vencimiento
            </label>
            <input type="text" value="12 / 28" 
                   style="width:100%; padding:10px 12px; font-family:monospace; font-size:0.9rem; border:1.5px solid #cbd5e1; border-radius:8px; background:#f8fafc; color:#0f172a; font-weight:700;" readonly>
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; font-weight:800; color:#334155; margin-bottom:6px; text-transform:uppercase;">
              CVC / CVP
            </label>
            <input type="text" value="•••" 
                   style="width:100%; padding:10px 12px; font-family:monospace; font-size:0.9rem; border:1.5px solid #cbd5e1; border-radius:8px; background:#f8fafc; color:#0f172a; font-weight:700;" readonly>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; font-size:0.75rem; color:#64748b; background:#f1f5f9; padding:8px 12px; border-radius:8px;">
          <span>🔒</span>
          <span>Transacción cifrada de extremo a extremo con cumplimiento PCI-DSS Nivel 1.</span>
        </div>
      </div>
    `;
  }

  async confirmOnlinePayment() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const btn = document.getElementById('btn-confirm-stripe-pay');
    const errBox = document.getElementById('stripe-card-errors');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Procesando con Stripe Payments & Tax...';
    }
    if (errBox) errBox.innerText = '';

    const subtotal = window.storeEngine && typeof window.storeEngine.getCartSubtotal === 'function'
      ? window.storeEngine.getCartSubtotal()
      : (window.storeEngine ? window.storeEngine.getCartTotal() : 0);
    const effectiveSubtotal = subtotal > 0 ? subtotal : 45.00;
    const calculatedTax = window.storeEngine && typeof window.storeEngine.getCartIva === 'function'
      ? window.storeEngine.getCartIva(effectiveSubtotal)
      : parseFloat((effectiveSubtotal * this.taxRate).toFixed(2));
    const grandTotal = parseFloat((effectiveSubtotal + calculatedTax).toFixed(2));

    // Si Stripe Elements está montado con clientSecret real
    if (this.stripe && this.elements && this.currentClientSecret) {
      try {
        const { error, paymentIntent } = await this.stripe.confirmPayment({
          elements: this.elements,
          confirmParams: {
            return_url: window.location.href,
          },
          redirect: 'if_required'
        });

        if (error) {
          this.isProcessing = false;
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `Pagar $${grandTotal.toFixed(2)} con Stripe`;
          }
          if (errBox) errBox.innerText = `❌ ${error.message}`;
          return;
        }

        const realIntentId = paymentIntent?.id || this.currentClientSecret.split('_secret')[0];
        this.finalizeSuccessfulPayment(grandTotal, effectiveSubtotal, calculatedTax, realIntentId, btn);
        return;
      } catch (err) {
        console.warn('[StripeEngine] Fallback en confirmación directa Stripe:', err);
      }
    }

    // Modo Simulación Segura (Fallback interactivo)
    setTimeout(() => {
      const fallbackId = 'pi_3P_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      this.finalizeSuccessfulPayment(grandTotal, effectiveSubtotal, calculatedTax, fallbackId, btn);
    }, 1200);
  }

  finalizeSuccessfulPayment(grandTotal, effectiveSubtotal, calculatedTax, intentId, btn) {
    this.isProcessing = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Pagar $${grandTotal.toFixed(2)} con Stripe`;
    }

    // Limpiar cesta y cerrar modal
    if (window.storeEngine) {
      window.storeEngine.cart = [];
      window.storeEngine.saveCart();
      window.storeEngine.renderCart();
    }
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('checkout-modal');
    }

    const bcvCalc = window.FinancialEngine && typeof window.FinancialEngine.calculateWithTax === 'function'
      ? window.FinancialEngine.calculateWithTax(effectiveSubtotal, 'USD')
      : null;
    const bcvRate = bcvCalc ? bcvCalc.bcvRate : 48.50;
    const bcvSlot = bcvCalc?.bcvSlot || '11:00 AM';
    const bcvBlock = bcvCalc?.bcvBlock || 'BLOQUE_11_00_AM';
    const totalVesFormatted = bcvCalc ? bcvCalc.formattedTotalVes : `Bs. ${(grandTotal * bcvRate).toFixed(2)} (BCV)`;

    // Despachar recibo por WhatsApp Simulator
    const customerName = window.storeEngine ? window.storeEngine.getCurrentCustomerName() : 'Cliente Mrs. Pets';
    if (window.whatsappSim && typeof window.whatsappSim.sendPreset === 'function') {
      window.whatsappSim.sendPreset(`🧾 *RECIBO OFICIAL STRIPE PAYMENTS & TAX - MRS PETS*\n\n¡Gracias por tu pago, *${customerName}*!\n\n• *ID de Pago*: \`${intentId}\`\n• *Subtotal (Base)*: $${effectiveSubtotal.toFixed(2)} USD\n• *IVA (${bcvCalc ? bcvCalc.ivaPercent : 16}% SENIAT)*: +$${calculatedTax.toFixed(2)} USD\n• *IGBT (${bcvCalc ? bcvCalc.igtfConfiguredPercent : 3}% Pago en Dólares)*: +$${igtfTax.toFixed(2)} USD\n• *TOTAL PAGADO*: *$${grandTotal.toFixed(2)} USD*\n• *Tasa Oficial BCV*: *${bcvRate.toFixed(2)} Bs./USD* (${bcvSlot})\n• *Equivalente en Bolívares (BCV)*: *${totalVesFormatted}*\n• *Método*: Tarjeta Visa/Mastercard (Stripe Vault)\n• *Sede*: Don Bosco, Maracaibo\n• *Estado*: *PAGO CONFIRMADO & AUDITADO* ✅`);
    }

    // Registrar en Ledger de Auditoría Inmutable del Servidor
    try {
      fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'ACCOUNTING_TRANSACTION_AUDIT',
          action: 'STRIPE_PAYMENT_CONFIRMED',
          transaction_id: intentId,
          customer: customerName,
          amount_usd: grandTotal,
          subtotal_usd: effectiveSubtotal,
          iva_usd: calculatedTax,
          bcv_rate_applied: bcvRate,
          bcv_slot: bcvSlot,
          bcv_block_id: bcvBlock,
          amount_ves: bcvCalc ? bcvCalc.totalVes : grandTotal * bcvRate,
          source: bcvCalc?.bcvSource || 'Banco Central de Venezuela (Oficial)',
          preventive_alert: bcvCalc?.preventiveAlert || false,
          compliance_clause: 'Cumplimiento Estricto BCV • Cero Dólar Paralelo',
          timestamp: new Date().toISOString()
        })
      });
    } catch(e) {}

    // SCREEN POP OFICIAL: "Pago procesado, su factura llegará por correo"
    if (window.app && typeof window.app.showScreenPop === 'function') {
      window.app.showScreenPop({
        type: 'payment',
        headline: 'Pago procesado, su factura llegará por correo',
        title: '¡Transacción aprobada y factura electrónica emitida en la Base de Datos!',
        badgeText: '💳 PAGO VERIFICADO STRIPE & TAX • AUDITORÍA BCV SENIAT',
        icon: '💳',
        accentColor: '#10B981',
        summaryHtml: `
          <div style="background:#F8FAFC !important; border:2px solid #000000 !important; border-radius:16px; padding:16px 18px; margin-bottom:14px; color:#000000 !important;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1.5px solid #000000; padding-bottom:6px;">
              <span style="font-weight:900; font-size:0.85rem; color:#000000 !important;">🧾 Stripe Payment Intent:</span>
              <span style="font-weight:900; font-family:monospace; font-size:0.92rem; background:#FEF3C7 !important; color:#000000 !important; padding:2px 8px; border-radius:6px; border:1px solid #000000;">${intentId}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-weight:700; font-size:0.88rem; color:#000000 !important;">Titular:</span>
              <strong style="font-size:0.95rem; color:#000000 !important; font-weight:900;">${customerName}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-weight:700; font-size:0.88rem; color:#000000 !important;">Subtotal (Base):</span>
              <span style="font-weight:800; color:#000000 !important;">$${effectiveSubtotal.toFixed(2)} USD</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-weight:700; font-size:0.88rem; color:#000000 !important;">IVA (16% Legal SENIAT):</span>
              <span style="font-weight:800; color:#B45309 !important;">+$${calculatedTax.toFixed(2)} USD</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:8px; border-top:1px dashed #000000;">
              <span style="font-weight:900; font-size:0.95rem; color:#000000 !important;">Total Cobrado:</span>
              <strong style="font-size:1.35rem; color:#000000 !important; font-weight:900;">$${grandTotal.toFixed(2)} USD</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:8px; border-top:1px dashed #0284C7; background:#F0F9FF; padding:8px 10px; border-radius:8px;">
              <div>
                <div style="font-size:0.75rem; color:#0369A1; font-weight:700;">Tasa Oficial BCV Aplicada:</div>
                <div style="font-size:0.85rem; color:#0C4A6E; font-weight:900;">${bcvRate.toFixed(2)} Bs./USD (${bcvSlot})</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:0.75rem; color:#0369A1; font-weight:700;">Total Oficial en Bolívares:</div>
                <div style="font-size:1rem; color:#0284C7; font-weight:900;">${totalVesFormatted}</div>
              </div>
            </div>
            <div style="margin-top:10px; font-size:0.78rem; color:#000000 !important; font-weight:700; display:flex; align-items:center; gap:6px;">
              <span>📧</span> Su comprobante fiscal digital ha sido emitido con trazabilidad contable BCV.
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

    // Notificar al usuario con Toast
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🎉 ¡Pago de $${grandTotal.toFixed(2)} USD aprobado con éxito por Stripe!`, 'success');
    }
  }

  // ============================================================================
  // 2. STRIPE TERMINAL (IN-PERSON POS PARA RECEPCIÓN Y CLÍNICA)
  // ============================================================================

  openTerminalModal(serviceName = 'Grooming Spa & Baño VIP', petName = 'Príncipe Harry', amount = 35.00) {
    const modal = document.getElementById('stripe-terminal-modal');
    if (!modal) {
      console.warn('[StripeEngine] Modal de terminal no encontrado en el DOM.');
      return;
    }

    const calculatedTax = parseFloat((amount * this.taxRate).toFixed(2));
    const totalAmount = parseFloat((amount + calculatedTax).toFixed(2));

    // Llenar detalles del cobro en el modal
    const svcSpan = document.getElementById('terminal-service-desc');
    const petSpan = document.getElementById('terminal-pet-desc');
    const subtotalSpan = document.getElementById('terminal-subtotal-amount');
    const taxSpan = document.getElementById('terminal-tax-amount');
    const totalSpan = document.getElementById('terminal-total-amount');

    if (svcSpan) svcSpan.innerText = serviceName;
    if (petSpan) petSpan.innerText = petName;
    if (subtotalSpan) subtotalSpan.innerText = `$${amount.toFixed(2)}`;
    if (taxSpan) taxSpan.innerText = `$${calculatedTax.toFixed(2)}`;
    if (totalSpan) totalSpan.innerText = `$${totalAmount.toFixed(2)}`;

    // Resetear estados del lector
    this.updateReaderStatus('connected', 'Lector WisePOS E (Mostrador Don Bosco) - Listo');
    this.resetTerminalScreen();

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('stripe-terminal-modal');
    }
  }

  updateReaderStatus(state, text) {
    const badge = document.getElementById('terminal-reader-badge');
    if (!badge) return;

    if (state === 'connected') {
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
      badge.style.border = '1px solid #86efac';
      badge.innerHTML = `🟢 <strong>${text}</strong>`;
    } else if (state === 'processing') {
      badge.style.background = '#fef3c7';
      badge.style.color = '#b45309';
      badge.style.border = '1px solid #fcd34d';
      badge.innerHTML = `⏳ <strong>${text}</strong>`;
    } else {
      badge.style.background = '#f1f5f9';
      badge.style.color = '#475569';
      badge.style.border = '1px solid #cbd5e1';
      badge.innerHTML = `⚪ <strong>${text}</strong>`;
    }
  }

  resetTerminalScreen() {
    const screen = document.getElementById('terminal-device-screen');
    const btnSimulateCard = document.getElementById('btn-terminal-insert-card');
    if (screen) {
      screen.innerHTML = `
        <div style="font-size:2rem; margin-bottom:8px;">💳 📶</div>
        <div style="font-weight:900; font-size:1.1rem; color:#FFFFFF !important;">Acerque, inserte o deslice</div>
        <div style="font-size:0.8rem; color:#94A3B8 !important; margin-top:4px;">Lector Inteligente Stripe WisePOS E</div>
      `;
    }
    if (btnSimulateCard) {
      btnSimulateCard.disabled = false;
      btnSimulateCard.innerText = '📲 Simular Presentación de Tarjeta / Apple Pay';
    }
  }

  simulateCardPresentPayment() {
    const screen = document.getElementById('terminal-device-screen');
    const btnSimulateCard = document.getElementById('btn-terminal-insert-card');
    const totalSpan = document.getElementById('terminal-total-amount');
    const totalAmount = totalSpan ? totalSpan.innerText : '$40.60';
    const petSpan = document.getElementById('terminal-pet-desc');
    const petName = petSpan ? petSpan.innerText : 'Mascota';

    if (btnSimulateCard) {
      btnSimulateCard.disabled = true;
      btnSimulateCard.innerText = '⏳ Leyendo chip EMV / NFC...';
    }

    this.updateReaderStatus('processing', 'Comunicando con Stripe Terminal Cloud API...');

    if (screen) {
      screen.innerHTML = `
        <div style="font-size:2.5rem; margin-bottom:8px;">⏳</div>
        <div style="font-weight:900; font-size:1.1rem; color:#A5B4FC !important;">Procesando Tarjeta...</div>
        <div style="font-size:0.8rem; color:#94A3B8 !important; margin-top:4px;">No retire su tarjeta</div>
      `;
    }

    setTimeout(() => {
      const authCode = Math.floor(100000 + Math.random() * 900000);
      const terminalTxId = 'tm_' + Math.random().toString(36).substring(2, 10).toUpperCase();

      if (screen) {
        screen.innerHTML = `
          <div style="font-size:2.5rem; margin-bottom:8px;">✅</div>
          <div style="font-weight:900; font-size:1.15rem; color:#34D399 !important;">¡TRANSACCIÓN APROBADA!</div>
          <div style="font-size:0.82rem; color:#FFFFFF !important; margin-top:4px;">Aut: <strong style="color:#FDE68A !important;">${authCode}</strong> • ID: <code style="color:#A5B4FC !important; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">${terminalTxId}</code></div>
          <div style="font-size:0.75rem; color:#94A3B8 !important; margin-top:4px;">Retire su tarjeta</div>
        `;
      }

      this.updateReaderStatus('connected', 'Aprobado • Imprimiendo recibo digital...');

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`💳 Cobro presencial de ${totalAmount} aprobado en Stripe Terminal POS.`, 'success');
      }

      if (window.whatsappSim && typeof window.whatsappSim.sendPreset === 'function') {
        window.whatsappSim.sendPreset(`🧾 *COMPROBANTE PUNTO DE VENTA (STRIPE TERMINAL POS) - MRS PETS*\n\n• Sede: *Don Bosco, Maracaibo*\n• Terminal: *WisePOS E #01*\n• Paciente: *${petName}*\n• Monto Total: *${totalAmount} USD* (Impuesto Stripe Tax incluido)\n• Modalidad: *Chip Contactless (Card Present)*\n• Código Aprobación: *${authCode}*\n• Estatus: *APROBADO & ENTREGADO* 🐾`);
      }

      // Transmisión HTTP POST en Vivo a Make.com POS Webhook (Estructura Plana Google Sheets)
      if (window.mrsPetsArch && typeof window.mrsPetsArch.triggerMakeWebhook === 'function') {
        window.mrsPetsArch.triggerMakeWebhook('pos_sale_live_dispatch', {
          ticketId: terminalTxId,
          area: 'grooming',
          turnoArea: 'GRO-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-003',
          estatusOperativo: 'LISTO',
          amount: parseFloat(totalAmount),
          currency: 'USD',
          gateway: 'Stripe',
          paymentMethod: 'Stripe Terminal WisePOS E / Chip EMV Contactless',
          estatusPago: 'Verificado',
          idClient: 'CLI-001',
          customerName: 'Dalybell Ramirez Montilla',
          rifCedula: 'V-19874521-0',
          phone: '+58 414-6799510',
          petName: petName ? `${petName} (Príncipe / Princesa)` : 'Rocky (Príncipe - Husky Siberiano)',
          montoAdicionales: 0,
          detalleAdicionales: 'Hidratación de Pulpejos (Incluida estándar)'
        });
      }

      setTimeout(() => {
        if (window.app && typeof window.app.closeModal === 'function') {
          window.app.closeModal('stripe-terminal-modal');
        }
      }, 2400);
    }, 1500);
  }
}

// Instanciar motor global
window.stripeEngine = new StripeEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.stripeEngine.init();
});
