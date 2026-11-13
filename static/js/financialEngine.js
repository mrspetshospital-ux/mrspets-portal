/**
 * Mrs. Pets - Financial Engine (Cumplimiento Legal BCV & IVA)
 * 
 * Gestiona estrictamente la tasa oficial del Banco Central de Venezuela (BCV)
 * y el Impuesto al Valor Agregado (IVA 16%).
 * 
 * REGLA ESTRICTA DE CUMPLIMIENTO:
 * Queda terminantemente prohibida cualquier referencia a cotizaciones no oficiales,
 * promedios o mercados paralelos. Toda conversión se rige por la Tasa Oficial BCV.
 */

(function (window) {
    'use strict';

    const STORAGE_KEY = 'mrs_pets_financial_config';

    const DEFAULT_CONFIG = {
        bcvRate: 887.30, // Tasa Oficial BCV en Bs./USD
        ivaPercent: 16.0, // IVA Legal 16%
        igtfPercent: 3.0, // Alícuota IGBT / IGTF 3% (Solo aplicable en transacciones en dólares)
        igbtPercent: 3.0,
        activeCurrency: 'USD', // 'USD' o 'VES'
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Administración Central'
    };

    const FinancialEngine = {
        config: null,

        async init() {
            this.loadConfig();
            this.injectCurrencySelector();
            this.setupListeners();
            await this.fetchOfficialBcvRate();
            console.log('[FinancialEngine] Inicializado con éxito. Tasa BCV:', this.config.bcvRate, 'Bs/USD | Moneda activa:', this.config.activeCurrency, '| IGBT:', this.config.igtfPercent, '%');
        },

        async fetchOfficialBcvRate(forceRefresh = false) {
            try {
                const res = await fetch('/api/v1/bcv/rate');
                if (res.ok) {
                    const data = await res.json();
                    const rateVal = parseFloat(data.currentRate || data.rate || data.effective_rate);
                    if (data && rateVal > 0) {
                        this.config.bcvRate = Math.round(rateVal * 100) / 100;
                        this.config.bcvSlot = data.slot || '11:00 AM';
                        this.config.bcvBlock = data.activeBlock || 'BLOQUE_11_00_AM';
                        this.config.bcvSource = data.source || 'Banco Central de Venezuela (Oficial)';
                        this.config.preventiveAlert = data.preventiveAlert || false;
                        this.config.alertMessage = data.alertMessage || null;
                        this.config.lastBcvSync = data.lastSync ? data.lastSync.timestamp : new Date().toISOString();
                        this.config.lastFetchTime = Date.now();
                        this.saveConfig();

                        if (data.preventiveAlert && window.app && typeof window.app.showToast === 'function') {
                            window.app.showToast('⚠️ Alerta Preventiva BCV: Usando base de datos interna de respaldo (Google Sheets)', 'warning');
                        }

                        window.dispatchEvent(new CustomEvent('mrs_pets_financial_config_updated', {
                            detail: this.getConfig()
                        }));
                        this.updateCurrencySelectorUI();
                    }
                }
            } catch (err) {
                console.warn('[FinancialEngine] Fallback a tasa consolidada local:', err);
            }
            return this.getConfig();
        },

        async ensureFreshRate() {
            const now = Date.now();
            const last = this.config?.lastFetchTime || 0;
            if (now - last > 180000) { // 3 minutos
                await this.fetchOfficialBcvRate();
            }
            return this.getConfig();
        },

        loadConfig() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.igtfPercent === undefined && parsed.igbtPercent === undefined) {
                        parsed.igtfPercent = DEFAULT_CONFIG.igtfPercent;
                        parsed.igbtPercent = DEFAULT_CONFIG.igbtPercent;
                    }
                    this.config = Object.assign({}, DEFAULT_CONFIG, parsed);
                } else {
                    this.config = Object.assign({}, DEFAULT_CONFIG);
                    this.saveConfig();
                }
            } catch (e) {
                console.warn('[FinancialEngine] Error cargando configuración, usando valores por defecto:', e);
                this.config = Object.assign({}, DEFAULT_CONFIG);
            }
        },

        saveConfig() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
            } catch (e) {
                console.error('[FinancialEngine] Error guardando configuración:', e);
            }
        },

        getConfig() {
            if (!this.config) this.loadConfig();
            return Object.assign({}, this.config);
        },

        updateConfig(newParams) {
            if (!this.config) this.loadConfig();

            if (newParams.bcvRate !== undefined) {
                const rate = parseFloat(newParams.bcvRate);
                if (!isNaN(rate) && rate > 0) {
                    this.config.bcvRate = Math.round(rate * 100) / 100;
                }
            }

            if (newParams.ivaPercent !== undefined) {
                const iva = parseFloat(newParams.ivaPercent);
                if (!isNaN(iva) && iva >= 0) {
                    this.config.ivaPercent = Math.round(iva * 10) / 10;
                }
            }

            if (newParams.igtfPercent !== undefined || newParams.igbtPercent !== undefined) {
                const igbt = parseFloat(newParams.igtfPercent !== undefined ? newParams.igtfPercent : newParams.igbtPercent);
                if (!isNaN(igbt) && igbt >= 0) {
                    this.config.igtfPercent = Math.round(igbt * 10) / 10;
                    this.config.igbtPercent = this.config.igtfPercent;
                }
            }

            this.config.lastUpdated = new Date().toISOString();
            if (newParams.updatedBy) {
                this.config.updatedBy = String(newParams.updatedBy).trim();
            }

            this.saveConfig();

            // Disparar evento de actualización global
            window.dispatchEvent(new CustomEvent('mrs_pets_financial_config_updated', {
                detail: this.getConfig()
            }));

            // Actualizar selectores en la interfaz
            this.updateCurrencySelectorUI();

            return this.getConfig();
        },

        getActiveCurrency() {
            if (!this.config) this.loadConfig();
            return this.config.activeCurrency || 'USD';
        },

        setActiveCurrency(currency) {
            if (!this.config) this.loadConfig();
            if (currency === 'USD' || currency === 'VES') {
                this.config.activeCurrency = currency;
                this.saveConfig();

                window.dispatchEvent(new CustomEvent('mrs_pets_currency_changed', {
                    detail: {
                        currency: this.config.activeCurrency,
                        bcvRate: this.config.bcvRate,
                        ivaPercent: this.config.ivaPercent
                    }
                }));

                this.updateCurrencySelectorUI();
            }
        },

        /**
         * Formatea número al estilo venezolano (punto para miles, coma para decimales)
         */
        formatVenezuelanNumber(amount) {
            const num = Number(amount) || 0;
            const parts = num.toFixed(2).split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            return parts.join(',');
        },

        /**
         * Formatea un importe en USD a la moneda activa (o forzada)
         * Si es VES: 'Bs. X.XXX,XX (BCV)'
         * Si es USD: '$XX.XX USD'
         */
        formatCurrency(usdAmount, forcedCurrency = null) {
            const curr = forcedCurrency || this.getActiveCurrency();
            const valUsd = Number(usdAmount) || 0;

            if (curr === 'VES') {
                const vesAmount = valUsd * (this.config.bcvRate || DEFAULT_CONFIG.bcvRate);
                return `Bs. ${this.formatVenezuelanNumber(vesAmount)} (BCV)`;
            } else {
                return `$${valUsd.toFixed(2)} USD`;
            }
        },

        /**
         * Devuelve desglose legal con base imponible, IVA e IGBT (3% exclusivo en pagos en dólares)
         * @param {number} usdBaseAmount - Monto base en USD
         * @param {string|null} paymentCurrency - 'USD' o 'VES'. Si se omite, usa getActiveCurrency()
         */
        calculateWithTax(usdBaseAmount, paymentCurrency = null) {
            const baseUsd = Number(usdBaseAmount) || 0;
            const rate = this.config ? this.config.bcvRate : DEFAULT_CONFIG.bcvRate;
            const slot = this.config?.bcvSlot || '11:00 AM';
            const block = this.config?.bcvBlock || 'BLOQUE_11_00_AM';
            const source = this.config?.bcvSource || 'Banco Central de Venezuela (Oficial)';
            const ivaRate = (this.config ? this.config.ivaPercent : DEFAULT_CONFIG.ivaPercent) / 100;

            // Determinar si el pago se efectúa en dólares / divisas
            const targetCurrency = paymentCurrency || this.getActiveCurrency();
            const isPayingInUsd = targetCurrency === 'USD' || targetCurrency === 'dolares';

            // Alícuota IGBT / IGTF: 3% modificable, aplicable exclusivamente cuando se paga en dólares
            const igtfConfigured = (this.config && this.config.igtfPercent !== undefined)
                ? this.config.igtfPercent
                : DEFAULT_CONFIG.igtfPercent;
            const igtfEffectivePercent = isPayingInUsd ? igtfConfigured : 0;
            const igtfRate = igtfEffectivePercent / 100;

            const ivaUsd = Math.round(baseUsd * ivaRate * 100) / 100;
            const igtfUsd = Math.round(baseUsd * igtfRate * 100) / 100;
            const totalUsd = Math.round((baseUsd + ivaUsd + igtfUsd) * 100) / 100;

            const baseVes = Math.round(baseUsd * rate * 100) / 100;
            const ivaVes = Math.round(ivaUsd * rate * 100) / 100;
            const igtfVes = Math.round(igtfUsd * rate * 100) / 100;
            const totalVes = Math.round((baseVes + ivaVes + igtfVes) * 100) / 100;

            return {
                baseUsd,
                ivaUsd,
                igtfUsd,
                totalUsd,
                baseVes,
                ivaVes,
                igtfVes,
                totalVes,
                bcvRate: rate,
                bcvSlot: slot,
                bcvBlock: block,
                bcvSource: source,
                preventiveAlert: this.config?.preventiveAlert || false,
                ivaPercent: this.config ? this.config.ivaPercent : DEFAULT_CONFIG.ivaPercent,
                igtfPercent: igtfEffectivePercent,
                igtfConfiguredPercent: igtfConfigured,
                isPayingInUsd,
                formattedBase: this.formatCurrency(baseUsd),
                formattedIva: this.formatCurrency(ivaUsd),
                formattedIgtf: isPayingInUsd ? `$${igtfUsd.toFixed(2)} USD` : 'Bs. 0,00 (Exento en Bs.)',
                formattedTotal: this.formatCurrency(totalUsd),
                formattedTotalVes: `Bs. ${this.formatVenezuelanNumber(totalVes)} (BCV)`
            };
        },

        /**
         * Obtiene la Tasa Oficial BCV activa y consolidada
         * @returns {number} Tasa Oficial BCV en Bs./USD
         */
        getOfficialBcvRate() {
            return (this.config && this.config.bcvRate > 0) ? this.config.bcvRate : DEFAULT_CONFIG.bcvRate;
        },

        get bcvRate() {
            return this.getOfficialBcvRate();
        },

        get bcvSlot() {
            return (this.config && this.config.bcvSlot) || '11:00 AM';
        },

        get bcvBlock() {
            return (this.config && this.config.bcvBlock) || 'BLOQUE_11_00_AM';
        },

        /**
         * Convierte y formatea un monto en USD a su equivalente exacto en Bolívares oficiales BCV
         * @param {number} usdAmount
         * @returns {string} e.g. "Bs. 31.055,50"
         */
        formatVesEquivalent(usdAmount) {
            const usd = Number(usdAmount) || 0;
            const rate = this.getOfficialBcvRate();
            const totalVes = Math.round(usd * rate * 100) / 100;
            return `Bs. ${this.formatVenezuelanNumber(totalVes)}`;
        },

        /**
         * Inyecta o enlaza el selector de moneda en el header
         */
        injectCurrencySelector() {
            const container = document.getElementById('header-currency-selector-container');
            if (container) {
                container.innerHTML = `
                    <div class="currency-toggle-wrapper" title="Seleccionar moneda de visualización (Tasa Oficial BCV)">
                        <button type="button" class="btn-currency-pill ${this.getActiveCurrency() === 'USD' ? 'active' : ''}" data-currency="USD" id="btn-currency-usd">
                            <span class="currency-code">USD</span> <span class="currency-symbol">($)</span>
                        </button>
                        <button type="button" class="btn-currency-pill ${this.getActiveCurrency() === 'VES' ? 'active' : ''}" data-currency="VES" id="btn-currency-ves">
                            <span class="currency-code">Bs.</span> <span class="currency-badge-legal">BCV</span>
                        </button>
                    </div>
                `;

                const btnUsd = container.querySelector('#btn-currency-usd');
                const btnVes = container.querySelector('#btn-currency-ves');

                if (btnUsd) {
                    btnUsd.addEventListener('click', () => this.setActiveCurrency('USD'));
                }
                if (btnVes) {
                    btnVes.addEventListener('click', () => this.setActiveCurrency('VES'));
                }
            }
        },

        updateCurrencySelectorUI() {
            const active = this.getActiveCurrency();
            const btnUsd = document.getElementById('btn-currency-usd');
            const btnVes = document.getElementById('btn-currency-ves');

            if (btnUsd && btnVes) {
                if (active === 'USD') {
                    btnUsd.classList.add('active');
                    btnVes.classList.remove('active');
                } else {
                    btnVes.classList.add('active');
                    btnUsd.classList.remove('active');
                }
            }
        },

        /**
         * Renderiza el Panel de Configuración Financiera Administrativo
         */
        renderAdminFinancialPanel(containerId = 'admin-financial-panel-container') {
            const container = document.getElementById(containerId);
            if (!container) return;

            const cfg = this.getConfig();
            const lastUpdatedStr = cfg.lastUpdated ? new Date(cfg.lastUpdated).toLocaleString('es-VE') : 'N/A';
            const igtfVal = cfg.igtfPercent !== undefined ? cfg.igtfPercent : 3.0;

            container.innerHTML = `
                <div class="financial-admin-card luxury-card">
                    <div class="financial-card-header">
                        <div class="financial-title-group">
                            <span class="luxury-badge-gold"><i class="fa-solid fa-scale-balanced"></i> Cumplimiento Legal BCV, IVA & IGBT</span>
                            <h3 class="luxury-card-title">Configuración Financiera y Fiscal Oficial</h3>
                            <p class="luxury-card-subtitle">
                                Parámetros de facturación legal según resoluciones del Banco Central de Venezuela, SENIAT (IVA 16%) y normativa de IGBT (3% en pagos en dólares).
                            </p>
                        </div>
                        <div class="financial-live-rate-badge">
                            <span class="badge-label">Tasa Legal Vigente</span>
                            <span class="badge-rate-value">1 USD = ${this.formatVenezuelanNumber(cfg.bcvRate)} Bs.</span>
                            <small class="badge-source">Fuente Oficial BCV</small>
                        </div>
                    </div>

                    <form id="admin-financial-form" class="financial-admin-form" onsubmit="event.preventDefault(); window.FinancialEngine.handleSaveAdminForm();">
                        <div class="form-grid-2col" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px;">
                            <div class="form-group-luxury">
                                <label for="fin-input-bcv-rate" class="form-label-luxury">
                                    <i class="fa-solid fa-building-columns"></i> Tasa Oficial Banco Central de Venezuela (Bs./USD)
                                </label>
                                <div class="input-with-affix">
                                    <span class="input-prefix">Bs.</span>
                                    <input type="number" step="0.01" min="0.01" id="fin-input-bcv-rate" class="input-luxury" value="${cfg.bcvRate.toFixed(2)}" required>
                                    <span class="input-suffix">/ 1.00 USD</span>
                                </div>
                                <span class="form-hint">Actualice conforme a la publicación diaria en www.bcv.org.ve.</span>
                            </div>

                            <div class="form-group-luxury">
                                <label for="fin-input-iva-percent" class="form-label-luxury">
                                    <i class="fa-solid fa-receipt"></i> Alícuota General de IVA (%)
                                </label>
                                <div class="input-with-affix">
                                    <input type="number" step="0.1" min="0" max="100" id="fin-input-iva-percent" class="input-luxury" value="${cfg.ivaPercent.toFixed(1)}" required>
                                    <span class="input-suffix">%</span>
                                </div>
                                <span class="form-hint">Alícuota general establecida por el SENIAT (Valor estándar 16.0%).</span>
                            </div>

                            <div class="form-group-luxury">
                                <label for="fin-input-igtf-percent" class="form-label-luxury" style="color:#B45309;">
                                    <i class="fa-solid fa-coins"></i> Alícuota IGBT / IGTF Divisas (%)
                                </label>
                                <div class="input-with-affix" style="border-color:#D4AF37;">
                                    <input type="number" step="0.1" min="0" max="100" id="fin-input-igtf-percent" class="input-luxury" value="${igtfVal.toFixed(1)}" required style="font-weight:800; color:#B45309;">
                                    <span class="input-suffix" style="background:#FEF3C7; color:#B45309; font-weight:800;">% USD</span>
                                </div>
                                <span class="form-hint">Valor legal del 3.0% aplicable <strong>exclusivamente cuando se paga en dólares</strong>. Exento en bolívares.</span>
                            </div>
                        </div>

                        <div class="financial-audit-info">
                            <i class="fa-solid fa-clock-rotate-left"></i> Última actualización: <strong>${lastUpdatedStr}</strong> | Autorizado por: <strong>${cfg.updatedBy || 'Staff'}</strong>
                        </div>

                        <div class="financial-form-actions">
                            <button type="submit" class="btn-luxury-primary" id="btn-save-financial-config">
                                <i class="fa-solid fa-floppy-disk"></i> Guardar y Aplicar en Tiempo Real
                            </button>
                            <span id="financial-feedback-msg" class="financial-feedback-msg"></span>
                        </div>
                    </form>

                    <!-- Simulador de conversión en vivo con desglose Dólares vs Bolívares -->
                    <div class="financial-simulator-box">
                        <h4 class="simulator-title"><i class="fa-solid fa-calculator"></i> Verificador de Conversión & Desglose Fiscal en Tiempo Real</h4>
                        <div class="simulator-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
                            <div class="sim-item">
                                <span class="sim-label">Servicio Base ($50.00 USD):</span>
                                <span class="sim-value" id="sim-sample-base">Bs. ${this.formatVenezuelanNumber(50 * cfg.bcvRate)} (BCV)</span>
                            </div>
                            <div class="sim-item">
                                <span class="sim-label">IVA General (${cfg.ivaPercent}%):</span>
                                <span class="sim-value" id="sim-sample-iva">+$${(50 * (cfg.ivaPercent / 100)).toFixed(2)} USD (Bs. ${this.formatVenezuelanNumber(50 * (cfg.ivaPercent / 100) * cfg.bcvRate)})</span>
                            </div>
                            <div class="sim-item" style="border-left:2px solid #D4AF37; padding-left:10px;">
                                <span class="sim-label" style="color:#B45309; font-weight:800;">IGBT Divisas (${igtfVal}%):</span>
                                <span class="sim-value" id="sim-sample-igtf" style="color:#B45309; font-weight:800;">+$${(50 * (igtfVal / 100)).toFixed(2)} USD <small style="color:#059669; display:block;">(Bs. 0,00 si paga en Bs.)</small></span>
                            </div>
                            <div class="sim-item total" style="background:rgba(212,175,55,0.1); border-radius:10px; padding:10px;">
                                <span class="sim-label">Total Pago en Dólares (+IGBT):</span>
                                <span class="sim-value-total" id="sim-sample-total-usd" style="color:#059669; font-size:1.15rem;">$${(50 * (1 + (cfg.ivaPercent / 100) + (igtfVal / 100))).toFixed(2)} USD</span>
                                <span class="sim-label" style="margin-top:4px; font-size:0.75rem;">Total Pago en Bolívares (Exento IGBT):</span>
                                <span class="sim-value" id="sim-sample-total-ves" style="font-weight:800; color:#1E293B;">Bs. ${this.formatVenezuelanNumber(50 * (1 + (cfg.ivaPercent / 100)) * cfg.bcvRate)} (BCV)</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        handleSaveAdminForm() {
            const rateInput = document.getElementById('fin-input-bcv-rate');
            const ivaInput = document.getElementById('fin-input-iva-percent');
            const igtfInput = document.getElementById('fin-input-igtf-percent');
            const feedback = document.getElementById('financial-feedback-msg');

            if (!rateInput || !ivaInput) return;

            const rate = parseFloat(rateInput.value);
            const iva = parseFloat(ivaInput.value);
            const igtf = igtfInput ? parseFloat(igtfInput.value) : 3.0;

            if (isNaN(rate) || rate <= 0) {
                if (feedback) {
                    feedback.textContent = 'Error: Ingrese una Tasa Oficial BCV válida mayor a 0.';
                    feedback.className = 'financial-feedback-msg error';
                }
                return;
            }

            if (isNaN(iva) || iva < 0) {
                if (feedback) {
                    feedback.textContent = 'Error: Ingrese un porcentaje de IVA válido.';
                    feedback.className = 'financial-feedback-msg error';
                }
                return;
            }

            if (isNaN(igtf) || igtf < 0) {
                if (feedback) {
                    feedback.textContent = 'Error: Ingrese un porcentaje de IGBT válido (ej. 3.0%).';
                    feedback.className = 'financial-feedback-msg error';
                }
                return;
            }

            const currentUser = (window.AuthEngine && window.AuthEngine.currentUser) ? window.AuthEngine.currentUser.name : 'Administrador Staff';

            this.updateConfig({
                bcvRate: rate,
                ivaPercent: iva,
                igtfPercent: igtf,
                updatedBy: currentUser
            });

            if (feedback) {
                feedback.textContent = '✓ Configuración legal actualizada y aplicada en todo el sistema.';
                feedback.className = 'financial-feedback-msg success';
                setTimeout(() => {
                    feedback.textContent = '';
                }, 4000);
            }

            // Refrescar simulador
            this.renderAdminFinancialPanel();
        },

        setupListeners() {
            // Escuchar cambios de configuración para actualizar simuladores o vistas
            window.addEventListener('mrs_pets_financial_config_updated', () => {
                this.updateCurrencySelectorUI();
            });
        }
    };

    window.FinancialEngine = FinancialEngine;

})(window);
