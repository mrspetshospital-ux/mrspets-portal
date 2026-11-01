/**
 * Mrs Pets — Adaptador de datos (staging)
 * =======================================
 * Conecta el portal existente con la API del servidor SIN tocar la interfaz.
 *
 * Estrategia de convivencia:
 *   1. Al cargar, hidrata localStorage desde el servidor (si hay sesión).
 *   2. Cada escritura a localStorage se refleja al servidor en segundo plano.
 *   3. Si el servidor no responde, el portal sigue funcionando con localStorage.
 *
 * Esto permite migrar sin romper nada: el portal nunca se queda sin datos.
 */
(function () {
  'use strict';

  const API = window.MRSPETS_API_BASE || '';
  const MIRROR_KEYS = [
    'mrs_pets_admin_patients',
    'mrs_pets_registered_pets',
    'mrs_pets_booked_appointments',
    'mrs_pets_pending_appointments',
    'mrs_pets_store_reservations',
    'mrs_pets_catalog',
    'mrs_pets_staff_profiles',
    'mrs_pets_correlative_counter'
  ];

  const state = { online: false, lastError: null, pending: 0 };

  // ------------------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------------------
  async function api(path, opts = {}) {
    const res = await fetch(API + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts
    });
    let body = null;
    try { body = await res.json(); } catch (e) { /* respuesta no JSON */ }
    if (!res.ok) {
      const msg = (body && (body.detail || body.message)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return body;
  }

  function log(...a) { console.log('%c[MrsPets API]', 'color:#7C3AED;font-weight:bold', ...a); }

  // ------------------------------------------------------------------
  // 1. Espejo de localStorage -> servidor
  // ------------------------------------------------------------------
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this !== window.localStorage) return;
    if (MIRROR_KEYS.indexOf(key) === -1) return;
    if (!state.online) return;
    mirrorToServer(key, value);
  };

  let mirrorTimer = null;
  const mirrorQueue = {};

  function mirrorToServer(key, value) {
    mirrorQueue[key] = value;
    state.pending++;
    clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(flushMirror, 800);   // agrupa escrituras seguidas
  }

  async function flushMirror() {
    const batch = { ...mirrorQueue };
    Object.keys(mirrorQueue).forEach(k => delete mirrorQueue[k]);
    if (!Object.keys(batch).length) return;
    try {
      await api('/api/migracion/importar', {
        method: 'POST',
        body: JSON.stringify({ mrs_pets_admin_patients: batch['mrs_pets_admin_patients'] || [] })
      });
      state.pending = Math.max(0, state.pending - 1);
      log('Sincronizado con el servidor');
    } catch (e) {
      state.lastError = e.message;
      log('No se pudo sincronizar (se conserva localStorage):', e.message);
    }
  }

  // ------------------------------------------------------------------
  // 2. Hidratación inicial desde el servidor
  // ------------------------------------------------------------------
  async function hydrate() {
    try {
      const me = await api('/api/auth/me');
      state.online = true;
      log('Sesión activa:', me.user && me.user.nombre);
      if (me.user && me.user.tipo === 'staff') {
        const r = await api('/api/tutores');
        if (r.tutores && r.tutores.length) {
          const mapped = r.tutores.map(t => ({
            id: t.id, owner: t.nombre, ownerName: t.nombre, rif: t.rif,
            ownerPhone: t.telefono, email: t.email, address: t.direccion,
            ownerPhoto: t.foto, pin: null, _fromServer: true
          }));
          originalSetItem.call(window.localStorage, 'mrs_pets_admin_patients',
                               JSON.stringify(mapped));
          log(`Hidratados ${mapped.length} tutores desde el servidor`);
        }
      }
    } catch (e) {
      state.online = false;
      log('Sin sesión de servidor: el portal trabaja con localStorage.');
    }
  }

  // ------------------------------------------------------------------
  // 3. Botón "Reportar problema"
  // ------------------------------------------------------------------
  function injectReportButton() {
    if (document.getElementById('mrspets-report-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'mrspets-report-btn';
    btn.type = 'button';
    btn.title = 'Reportar un problema';
    btn.innerHTML = '🐞';
    btn.style.cssText = [
      'position:fixed', 'bottom:18px', 'right:18px', 'z-index:99999',
      'width:46px', 'height:46px', 'border-radius:50%', 'border:none',
      'background:#7C3AED', 'color:#fff', 'font-size:20px', 'cursor:pointer',
      'box-shadow:0 4px 14px rgba(124,58,237,.45)', 'opacity:.85'
    ].join(';');
    btn.onmouseenter = () => (btn.style.opacity = '1');
    btn.onmouseleave = () => (btn.style.opacity = '.85');
    btn.onclick = openReportDialog;
    document.body.appendChild(btn);
  }

  function openReportDialog() {
    const pantalla = (document.querySelector('.screen.active, .view.active, [data-screen].active') || {})
      .id || document.title || 'desconocida';
    const accion = prompt('¿Qué estaba haciendo cuando ocurrió el problema?');
    if (accion === null) return;
    const error = prompt('Describa el problema (o pegue el mensaje de error):');
    if (error === null) return;

    api('/api/reportes', {
      method: 'POST',
      body: JSON.stringify({
        pantalla: pantalla,
        accion: accion,
        error_mensaje: error,
        error_stack: (window.__lastError && window.__lastError.stack) || null,
        url: location.href
      })
    }).then(r => {
      alert('✅ Reporte enviado (# ' + r.id + '). Gracias, lo revisaremos.');
    }).catch(e => {
      alert('⚠️ No se pudo enviar el reporte: ' + e.message +
            '\nSe guardó localmente para reintentar.');
      try {
        const pend = JSON.parse(localStorage.getItem('mrspets_reportes_pendientes') || '[]');
        pend.push({ pantalla, accion, error, url: location.href, ts: Date.now() });
        localStorage.setItem('mrspets_reportes_pendientes', JSON.stringify(pend));
      } catch (_) {}
    });
  }

  // Captura de errores JS para adjuntarlos al reporte
  window.addEventListener('error', function (ev) {
    window.__lastError = { message: ev.message, stack: ev.error && ev.error.stack };
  });
  window.addEventListener('unhandledrejection', function (ev) {
    window.__lastError = { message: String(ev.reason), stack: ev.reason && ev.reason.stack };
  });

  // ------------------------------------------------------------------
  // 4. Arranque
  // ------------------------------------------------------------------
  function boot() {
    injectReportButton();
    hydrate();
    log('Adaptador cargado. API =', API || '(mismo origen)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // API pública mínima para depurar desde la consola
  window.MrsPetsAPI = {
    api, state,
    loginStaff: (u, p) => api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
    loginCliente: (i, p) => api('/api/auth/cliente/login', { method: 'POST', body: JSON.stringify({ identificador: i, password: p }) }),
    facturas: () => api('/api/facturas'),
    health: () => api('/api/health')
  };
})();
