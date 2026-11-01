/**
 * ============================================================================
 * MRS. PETS - SMART CONTRAST ENGINE (MOTOR DE CONTRASTE INTELIGENTE)
 * WCAG 2.1 Level AA / AAA Compliant & Silent Luxury Visual Architecture
 * 
 * REGLA INMUTABLE: LOS FONDOS OSCUROS NUNCA LLEVAN LETRAS OSCURAS.
 * CERO TEXTO OSCURO EN FONDOS OSCUROS.
 * Proporciona utilidades matemáticas W3C y Laboratorio de Pruebas.
 * ============================================================================
 */

class SmartContrastEngine {
  constructor() {
    this.name = 'SmartContrastEngine';
    this.version = '2.0.0';
    this.enabled = true;

    // Tokens institucionales Silent Luxury
    this.tokens = {
      lightBg: {
        textPrimary: '#000000',
        textSecondary: '#334155',
        textMuted: '#64748B',
        accent: '#92400E',
        borderColor: 'rgba(0, 0, 0, 0.25)',
        badgeBg: 'rgba(0, 0, 0, 0.08)'
      },
      darkBg: {
        textPrimary: '#FFFFFF',
        textSecondary: '#E2E8F0',
        textMuted: '#CBD5E1',
        accent: '#FBBF24',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        badgeBg: 'rgba(255, 255, 255, 0.12)'
      },
      baseDefaultBg: { r: 7, g: 10, b: 17, a: 1 } // #070a11
    };

    this.namedColors = {
      transparent: [0, 0, 0, 0],
      white: [255, 255, 255, 1],
      black: [0, 0, 0, 1],
      gold: [255, 215, 0, 1],
      amber: [245, 158, 11, 1],
      yellow: [255, 255, 0, 1],
      red: [239, 68, 68, 1],
      green: [16, 185, 129, 1],
      blue: [59, 130, 246, 1],
      gray: [107, 114, 128, 1],
      lightgray: [229, 231, 235, 1],
      darkgray: [31, 41, 55, 1],
      silver: [192, 192, 192, 1],
      navy: [0, 0, 128, 1],
      ivory: [255, 255, 240, 1],
      cream: [255, 253, 208, 1]
    };

    this.colorCache = new Map();
    this.init();
  }

  init() {
    // Limpiar cualquier estilo forzado previo para garantizar 100% legibilidad inmediata
    this.cleanOverriddenStyles();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.cleanOverriddenStyles());
    }
  }

  cleanOverriddenStyles() {
    try {
      const overridden = document.querySelectorAll('[data-smart-contrast-overridden]');
      overridden.forEach(node => {
        node.removeAttribute('data-smart-contrast-overridden');
        node.style.removeProperty('color');
      });
      const tagged = document.querySelectorAll('[data-smart-contrast]');
      tagged.forEach(el => {
        el.removeAttribute('data-smart-contrast');
      });
    } catch(e) {}
  }

  // --------------------------------------------------------------------------
  // PARSER DE COLOR (HEX, RGB, RGBA, HSL, GRADIENTES)
  // --------------------------------------------------------------------------

  parseColor(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') return null;
    const str = colorStr.trim().toLowerCase();

    if (this.colorCache.has(str)) {
      return this.colorCache.get(str);
    }

    let parsed = null;

    if (this.namedColors[str]) {
      const c = this.namedColors[str];
      parsed = { r: c[0], g: c[1], b: c[2], a: c[3] };
    } else if (str.startsWith('#')) {
      const hex = str.slice(1);
      if (hex.length === 3 || hex.length === 4) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
        parsed = { r, g, b, a };
      } else if (hex.length === 6 || hex.length === 8) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
        parsed = { r, g, b, a };
      }
    } else if (str.startsWith('rgb')) {
      const match = str.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/);
      if (match) {
        parsed = {
          r: Math.min(255, Math.max(0, parseFloat(match[1]))),
          g: Math.min(255, Math.max(0, parseFloat(match[2]))),
          b: Math.min(255, Math.max(0, parseFloat(match[3]))),
          a: match[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(match[4]))) : 1
        };
      }
    } else if (str.startsWith('hsl')) {
      const match = str.match(/hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/);
      if (match) {
        const h = parseFloat(match[1]) / 360;
        const s = parseFloat(match[2]) / 100;
        const l = parseFloat(match[3]) / 100;
        const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
        const rgb = this.hslToRgb(h, s, l);
        parsed = { r: rgb.r, g: rgb.g, b: rgb.b, a };
      }
    } else if (str.includes('gradient')) {
      const gradientRegex = new RegExp('(#[0-9a-f]{3,8}|rgba?\\([^)]+\\)|hsla?\\([^)]+\\))', 'i');
      const colorMatch = str.match(gradientRegex);
      if (colorMatch) {
        parsed = this.parseColor(colorMatch[1]);
      }
    }

    if (parsed) {
      if (this.colorCache.size > 2000) this.colorCache.clear();
      this.colorCache.set(str, parsed);
    }

    return parsed;
  }

  hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // --------------------------------------------------------------------------
  // ALGORITMO OFICIAL W3C WCAG 2.1: LUMINANCIA & CONTRASTE
  // --------------------------------------------------------------------------

  sRgbToLinear(c) {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  getLuminance(colorInput) {
    const color = typeof colorInput === 'string' ? this.parseColor(colorInput) : colorInput;
    if (!color) return 0;
    const rLin = this.sRgbToLinear(color.r);
    const gLin = this.sRgbToLinear(color.g);
    const bLin = this.sRgbToLinear(color.b);
    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  }

  getContrastRatio(color1, color2) {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  isLightBackground(colorInput) {
    const color = typeof colorInput === 'string' ? this.parseColor(colorInput) : colorInput;
    if (!color) return false;
    const lum = this.getLuminance(color);
    return lum > 0.40;
  }

  getSafeTypography(bgColorInput) {
    const color = typeof bgColorInput === 'string' ? this.parseColor(bgColorInput) : bgColorInput;
    const isLight = this.isLightBackground(color);
    const palette = isLight ? this.tokens.lightBg : this.tokens.darkBg;
    const contrast = color ? this.getContrastRatio(color, palette.textPrimary) : 15;

    return {
      isLight,
      contrastMode: isLight ? 'light-bg' : 'dark-bg',
      contrastRatio: parseFloat(contrast.toFixed(2)),
      wcagAAA: contrast >= 7.0,
      wcagAA: contrast >= 4.5,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      textMuted: palette.textMuted,
      accent: palette.accent,
      borderColor: palette.borderColor,
      badgeBg: palette.badgeBg
    };
  }

  // --------------------------------------------------------------------------
  // HERRAMIENTA INTERACTIVA: SMART CONTRAST STUDIO (LABORATORIO DE PRUEBAS)
  // --------------------------------------------------------------------------

  renderStudioModal() {
    let modal = document.getElementById('smart-contrast-studio-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'smart-contrast-studio-modal';
      modal.className = 'modal-backdrop';
      modal.style.display = 'none';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(0, 0, 0, 0.85)';
      modal.style.backdropFilter = 'blur(10px)';
      modal.style.zIndex = '99999';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '20px';

      modal.innerHTML = `
        <div style="background:#0F172A; border:1px solid #334155; border-radius:18px; max-width:750px; width:100%; box-shadow:0 25px 60px rgba(0,0,0,0.7); overflow:hidden; display:flex; flex-direction:column; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <!-- Header -->
          <div style="padding:18px 24px; background:linear-gradient(90deg, #1E293B, #0F172A); border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.4rem;">🎨</span>
              <div>
                <h3 style="margin:0; font-size:1.1rem; color:#F8FAFC; font-weight:800; letter-spacing:0.5px;">Smart Contrast Studio • Mrs. Pets</h3>
                <p style="margin:2px 0 0; font-size:0.75rem; color:#94A3B8;">Regla: Fondos oscuros SIEMPRE con letras blancas/claras (WCAG 2.1 AAA)</p>
              </div>
            </div>
            <button onclick="smartContrastEngine.closeStudioModal()" style="background:transparent; border:none; color:#94A3B8; font-size:1.3rem; cursor:pointer; line-height:1;">✕</button>
          </div>

          <!-- Body -->
          <div style="padding:24px; overflow-y:auto; max-height:75vh; display:flex; flex-direction:column; gap:20px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#CBD5E1; margin-bottom:6px;">Color de Fondo a Evaluar:</label>
                <div style="display:flex; gap:10px; align-items:center;">
                  <input type="color" id="studio-color-picker" value="#0F172A" style="width:50px; height:40px; border:none; border-radius:8px; cursor:pointer; background:transparent;" oninput="smartContrastEngine.updateStudioPreview(this.value)">
                  <input type="text" id="studio-color-text" value="#0F172A" style="flex:1; padding:8px 12px; background:#1E293B; border:1px solid #475569; border-radius:8px; color:#FFFFFF; font-weight:700; font-family:monospace;" oninput="smartContrastEngine.updateStudioPreview(this.value)">
                </div>
              </div>
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#CBD5E1; margin-bottom:6px;">Presets de Prueba:</label>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                  <button type="button" class="btn btn-sm" style="padding:4px 8px; font-size:0.75rem; background:#070A11; color:#FFFFFF; border-radius:6px; font-weight:700;" onclick="smartContrastEngine.updateStudioPreview('#070A11')">Obsidiana (#070A11)</button>
                  <button type="button" class="btn btn-sm" style="padding:4px 8px; font-size:0.75rem; background:#0B0F19; color:#FFFFFF; border-radius:6px; font-weight:700;" onclick="smartContrastEngine.updateStudioPreview('#0B0F19')">Sidebar (#0B0F19)</button>
                  <button type="button" class="btn btn-sm" style="padding:4px 8px; font-size:0.75rem; background:#152232; color:#FFFFFF; border-radius:6px; font-weight:700;" onclick="smartContrastEngine.updateStudioPreview('#152232')">Carrito (#152232)</button>
                  <button type="button" class="btn btn-sm" style="padding:4px 8px; font-size:0.75rem; background:#FEF3C7; color:#000000; border-radius:6px; font-weight:700;" onclick="smartContrastEngine.updateStudioPreview('#FEF3C7')">Ámbar (#FEF3C7)</button>
                  <button type="button" class="btn btn-sm" style="padding:4px 8px; font-size:0.75rem; background:#FFFFFF; color:#000000; border-radius:6px; font-weight:700;" onclick="smartContrastEngine.updateStudioPreview('#FFFFFF')">Blanco (#FFFFFF)</button>
                </div>
              </div>
            </div>

            <div id="studio-metrics-card" style="background:#1E293B; border:1px solid #334155; border-radius:12px; padding:16px; display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; text-align:center;">
            </div>

            <div>
              <label style="display:block; font-size:0.8rem; font-weight:700; color:#CBD5E1; margin-bottom:8px;">Vista Previa con Tipografía Asignada:</label>
              <div id="studio-live-preview" style="padding:22px; border-radius:14px; transition:all 0.25s ease; box-shadow:0 8px 24px rgba(0,0,0,0.25); border:1px solid transparent;">
              </div>
            </div>
          </div>

          <div style="padding:14px 24px; background:#1E293B; border-top:1px solid #334155; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.75rem; color:#94A3B8;">WCAG 2.1 AA/AAA • Fondos oscuros tienen 100% letras blancas</span>
            <button onclick="smartContrastEngine.closeStudioModal()" class="btn btn-sm" style="padding:6px 16px; background:#475569; color:#FFFFFF; border-radius:8px; font-weight:700; cursor:pointer;">Cerrar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    this.updateStudioPreview('#0F172A');
  }

  closeStudioModal() {
    const modal = document.getElementById('smart-contrast-studio-modal');
    if (modal) modal.style.display = 'none';
  }

  updateStudioPreview(colorValue) {
    const color = this.parseColor(colorValue);
    if (!color) return;

    const hexInput = document.getElementById('studio-color-text');
    const pickerInput = document.getElementById('studio-color-picker');
    if (hexInput && hexInput.value !== colorValue) hexInput.value = colorValue;
    if (pickerInput && pickerInput.value !== colorValue && colorValue.startsWith('#') && colorValue.length === 7) pickerInput.value = colorValue;

    const typo = this.getSafeTypography(color);
    const lum = this.getLuminance(color);

    const metricsCard = document.getElementById('studio-metrics-card');
    if (metricsCard) {
      metricsCard.innerHTML = `
        <div>
          <div style="font-size:0.7rem; color:#94A3B8; text-transform:uppercase; font-weight:700;">Luminancia W3C</div>
          <div style="font-size:1.3rem; font-weight:900; color:#38BDF8; font-family:monospace;">${lum.toFixed(3)}</div>
        </div>
        <div>
          <div style="font-size:0.7rem; color:#94A3B8; text-transform:uppercase; font-weight:700;">Tipo de Fondo</div>
          <div style="font-size:1.0rem; font-weight:800; color:${typo.isLight ? '#F59E0B' : '#38BDF8'}; margin-top:4px;">${typo.isLight ? '☀️ CLARO' : '🌙 OSCURO'}</div>
        </div>
        <div>
          <div style="font-size:0.7rem; color:#94A3B8; text-transform:uppercase; font-weight:700;">Color de Letras</div>
          <div style="font-size:1.0rem; font-weight:900; color:${typo.isLight ? '#F59E0B' : '#4ADE80'}; margin-top:4px;">${typo.isLight ? 'NEGRAS (#000)' : 'BLANCAS (#FFF)'}</div>
        </div>
        <div>
          <div style="font-size:0.7rem; color:#94A3B8; text-transform:uppercase; font-weight:700;">Ratio Contraste</div>
          <div style="font-size:1.3rem; font-weight:900; color:#4ADE80; font-family:monospace;">${typo.contrastRatio}:1</div>
        </div>
      `;
    }

    const preview = document.getElementById('studio-live-preview');
    if (preview) {
      preview.style.backgroundColor = colorValue;
      preview.style.borderColor = typo.borderColor;

      preview.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:0.72rem; padding:3px 8px; border-radius:6px; font-weight:800; background:${typo.badgeBg}; color:${typo.accent}; border:1px solid ${typo.borderColor};">
            🐾 Ficha Médica VIP • Mrs. Pets
          </span>
          <span style="font-size:0.8rem; font-weight:700; color:${typo.textSecondary};">
            Estatus: En Atención
          </span>
        </div>
        <h4 style="margin:0 0 6px 0; font-size:1.25rem; font-weight:900; color:${typo.textPrimary}; letter-spacing:-0.2px;">
          Rocky (Príncipe - Husky Siberiano)
        </h4>
        <p style="margin:0 0 14px 0; font-size:0.88rem; line-height:1.5; color:${typo.textSecondary}; font-weight:600;">
          Los fondos oscuros tienen garantizado el 100% de letras blancas/claras. Nunca letras oscuras en fondos oscuros.
        </p>
        <div style="display:flex; gap:10px; align-items:center;">
          <button type="button" style="padding:7px 14px; border-radius:8px; font-size:0.82rem; font-weight:800; background:${typo.accent}; color:${typo.isLight ? '#FFFFFF' : '#000000'}; border:none; cursor:pointer;">
            Acción Primaria
          </button>
          <span style="font-size:0.75rem; color:${typo.textMuted}; font-weight:700;">
            Texto de Contraste Óptimo
          </span>
        </div>
      `;
    }
  }
}

// Instanciación Global
window.smartContrastEngine = new SmartContrastEngine();
