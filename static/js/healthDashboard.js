/**
 * MRS. PETS - HEALTH DASHBOARD ENGINE (PASO 4 & 5)
 * Monitor interactivo de Salud de Conexiones Omnicanal
 * Cumple con protección estricta de tokens (cero exposición de claves).
 */
class HealthDashboard {
  constructor() {
    this.statusData = null;
    this.isLoading = false;
    this.activeHistoryEndpointId = null;
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const navItem = document.querySelector('[data-tab="health-dashboard"]');
    if (navItem) {
      navItem.addEventListener('click', () => this.loadStatus());
    }
  }

  async loadStatus(showToastMessage = false) {
    const tableBody = document.getElementById('health-table-body');
    if (tableBody && !this.statusData) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#64748B;">
        <div class="spinner" style="margin:0 auto 12px auto;"></div>
        Cargando estado de salud de conexiones...
      </td></tr>`;
    }

    try {
      this.isLoading = true;
      const resp = await fetch('/api/health/status', {
        headers: { 'Accept': 'application/json' }
      });

      if (resp.status === 401 || resp.status === 403) {
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#EF4444;">
            🔒 <strong>Acceso Restringido:</strong> Esta consola de salud requiere sesión activa con rol Administrador.
          </td></tr>`;
        }
        return;
      }

      const data = await resp.json();
      if (data && data.status === 'success') {
        this.statusData = data;
        this.renderTable(data.connections || []);
        this.renderSummary(data.summary || {});
        if (showToastMessage && window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('✅ Estado de conexiones actualizado', 'success');
        }
      }
    } catch (e) {
      console.error('[HealthDashboard] Error loading status:', e);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#EF4444;">
          ⚠️ Error al comunicarse con el servidor de monitoreo.
        </td></tr>`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  renderSummary(summary) {
    const totalEl = document.getElementById('health-kpi-total');
    const healthyEl = document.getElementById('health-kpi-healthy');
    const slowEl = document.getElementById('health-kpi-slow');
    const errorEl = document.getElementById('health-kpi-error');
    const scanEl = document.getElementById('health-last-scan');

    if (totalEl) totalEl.textContent = summary.total || 0;
    if (healthyEl) healthyEl.textContent = summary.healthy || 0;
    if (slowEl) slowEl.textContent = summary.slow || 0;
    if (errorEl) errorEl.textContent = summary.error || 0;
    if (scanEl) {
      if (summary.last_scan) {
        const d = new Date(summary.last_scan);
        scanEl.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } else {
        scanEl.textContent = 'En espera...';
      }
    }
  }

  renderTable(connections) {
    const tbody = document.getElementById('health-table-body');
    if (!tbody) return;

    if (!connections || connections.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#64748B;">
        No hay conexiones registradas en el sistema.
      </td></tr>`;
      return;
    }

    tbody.innerHTML = connections.map(conn => {
      // Reglas de visualización:
      // 🟢 ok, respuesta < 2s
      // 🟡 ok pero > 2s
      // 🔴 error o timeout
      // NUNCA mostrar el valor del token. Solo "token configurado ✓" o "sin token ✗".
      let badgeHtml = '';
      if (conn.status_level === 'healthy') {
        badgeHtml = `<span style="background:rgba(16,185,129,0.15); color:#059669; border:1px solid #10B981; padding:4px 10px; border-radius:20px; font-weight:800; font-size:0.75rem; display:inline-flex; align-items:center; gap:5px;">🟢 Operativo (&lt;2s)</span>`;
      } else if (conn.status_level === 'slow') {
        badgeHtml = `<span style="background:rgba(245,158,11,0.15); color:#D97706; border:1px solid #F59E0B; padding:4px 10px; border-radius:20px; font-weight:800; font-size:0.75rem; display:inline-flex; align-items:center; gap:5px;">🟡 Lento (&gt;2s)</span>`;
      } else if (conn.status_level === 'error') {
        badgeHtml = `<span style="background:rgba(239,68,68,0.15); color:#DC2626; border:1px solid #EF4444; padding:4px 10px; border-radius:20px; font-weight:800; font-size:0.75rem; display:inline-flex; align-items:center; gap:5px;">🔴 Fallo / Error</span>`;
      } else {
        badgeHtml = `<span style="background:rgba(100,116,139,0.15); color:#475569; border:1px solid #94A3B8; padding:4px 10px; border-radius:20px; font-weight:800; font-size:0.75rem; display:inline-flex; align-items:center; gap:5px;">⚪ Pendiente</span>`;
      }

      const tokenLabelHtml = conn.has_token ?
        `<span style="color:#059669; font-weight:700; font-size:0.75rem; background:rgba(16,185,129,0.1); padding:2px 8px; border-radius:6px; border:1px solid rgba(16,185,129,0.3);">token configurado ✓</span>` :
        `<span style="color:#94A3B8; font-weight:600; font-size:0.75rem; background:rgba(148,163,184,0.1); padding:2px 8px; border-radius:6px; border:1px solid rgba(148,163,184,0.3);">sin token ✗</span>`;

      let lastCheckFormatted = 'Nunca probado';
      if (conn.last_check) {
        const d = new Date(conn.last_check);
        lastCheckFormatted = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const latencyFormatted = (conn.latency_ms !== null && conn.latency_ms !== undefined) ?
        `<strong style="color:${conn.latency_ms > 2000 ? '#D97706' : '#0F172A'};">${conn.latency_ms} ms</strong>` :
        '<span style="color:#94A3B8;">--</span>';

      const failsFormatted = conn.today_failures > 0 ?
        `<span style="color:#DC2626; font-weight:800; background:rgba(239,68,68,0.1); padding:2px 8px; border-radius:12px;">${conn.today_failures} fallos</span>` :
        `<span style="color:#059669; font-weight:700;">0</span>`;

      return `
        <tr id="health-row-${conn.id}" style="border-bottom:1px solid #E2E8F0; transition:background 0.2s;">
          <td style="padding:14px 16px;">
            <div style="font-weight:800; color:#0F172A; font-size:0.88rem;">${this.escapeHtml(conn.name)}</div>
            <div style="font-size:0.75rem; color:#64748B; font-family:monospace; margin-top:2px;">
              <span style="background:#F1F5F9; padding:2px 6px; border-radius:4px; font-weight:700; color:#475569;">${conn.method}</span>
              ${this.escapeHtml(conn.url)}
            </div>
          </td>
          <td style="padding:14px 16px; text-align:center;">
            ${badgeHtml}
          </td>
          <td style="padding:14px 16px; text-align:center;">
            ${tokenLabelHtml}
          </td>
          <td style="padding:14px 16px; font-size:0.8rem; color:#475569; text-align:center;">
            ${lastCheckFormatted}
          </td>
          <td style="padding:14px 16px; font-size:0.85rem; text-align:center;">
            ${latencyFormatted}
          </td>
          <td style="padding:14px 16px; font-size:0.85rem; text-align:center;">
            ${failsFormatted}
          </td>
          <td style="padding:14px 16px; text-align:center; white-space:nowrap;">
            <button type="button" class="btn btn-sm" onclick="healthDashboard.checkOne('${conn.id}')" id="btn-check-${conn.id}" style="background:#0F172A; color:#FFFFFF; border:none; padding:6px 12px; border-radius:8px; font-weight:700; font-size:0.75rem; cursor:pointer; margin-right:6px;" title="Probar conexión ahora">
              ⚡ Probar
            </button>
            <button type="button" class="btn btn-sm" onclick="healthDashboard.showHistory('${conn.id}')" style="background:#F1F5F9; color:#334155; border:1px solid #CBD5E1; padding:6px 12px; border-radius:8px; font-weight:700; font-size:0.75rem; cursor:pointer;" title="Ver historial de últimas 20 pruebas">
              📋 Ver detalle
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async checkOne(endpointId) {
    const btn = document.getElementById(`btn-check-${endpointId}`);
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Probando...';
    }

    try {
      const resp = await fetch(`/api/health/check?id=${encodeURIComponent(endpointId)}`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      const data = await resp.json();
      if (data && data.status === 'success') {
        if (window.app && typeof window.app.showToast === 'function') {
          const res = data.result || {};
          const msg = res.ok ?
            `🟢 Conexión "${res.name}" OK (${res.ms} ms)` :
            `🔴 Error en "${res.name}": ${res.error || 'Fallo de respuesta'}`;
          window.app.showToast(msg, res.ok ? 'success' : 'danger');
        }
        await this.loadStatus();
      } else {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(data.message || 'Error al ejecutar prueba', 'danger');
        }
      }
    } catch (e) {
      console.error('[HealthDashboard] Error in checkOne:', e);
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Error de conexión con el servidor', 'danger');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '⚡ Probar';
      }
    }
  }

  async checkAll() {
    const btn = document.getElementById('btn-health-check-all');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Probando todas las conexiones...';
    }

    try {
      const resp = await fetch('/api/health/check-all', {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      const data = await resp.json();
      if (data && data.status === 'success') {
        this.statusData = data;
        this.renderTable(data.connections || []);
        this.renderSummary(data.summary || {});
        if (window.app && typeof window.app.showToast === 'function') {
          const s = data.summary || {};
          window.app.showToast(`⚡ Prueba completa finalizada: ${s.healthy} saludables, ${s.slow} lentas, ${s.error} con error`, 'info');
        }
      }
    } catch (e) {
      console.error('[HealthDashboard] Error in checkAll:', e);
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Error al ejecutar prueba global', 'danger');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '⚡ Probar todo';
      }
    }
  }

  async showHistory(endpointId) {
    this.activeHistoryEndpointId = endpointId;
    const modal = document.getElementById('modal-health-history');
    const titleEl = document.getElementById('modal-health-history-title');
    const tbody = document.getElementById('health-history-table-body');

    if (modal) modal.style.display = 'flex';
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#64748B;">
        Cargando historial de pruebas...
      </td></tr>`;
    }

    const conn = (this.statusData && this.statusData.connections) ?
      this.statusData.connections.find(c => c.id === endpointId) : null;
    if (titleEl) {
      titleEl.textContent = conn ? `Historial de Pruebas: ${conn.name}` : `Historial de Pruebas: ${endpointId}`;
    }

    try {
      const resp = await fetch(`/api/health/history?id=${encodeURIComponent(endpointId)}`);
      const data = await resp.json();
      if (data && data.status === 'success') {
        this.renderHistoryTable(data.history || []);
      }
    } catch (e) {
      console.error('[HealthDashboard] Error loading history:', e);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#EF4444;">
          Error al cargar historial.
        </td></tr>`;
      }
    }
  }

  renderHistoryTable(history) {
    const tbody = document.getElementById('health-history-table-body');
    if (!tbody) return;

    if (!history || history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#64748B;">
        No hay registros históricos para esta conexión aún.
      </td></tr>`;
      return;
    }

    tbody.innerHTML = history.map((item, idx) => {
      const d = new Date(item.timestamp);
      const timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const statusIcon = item.ok ?
        (item.ms > 2000 ? '🟡 Lenta' : '🟢 OK') :
        '🔴 Error';

      return `
        <tr style="border-bottom:1px solid #E2E8F0;">
          <td style="padding:10px 12px; font-size:0.8rem; color:#64748B; font-weight:700;">#${history.length - idx}</td>
          <td style="padding:10px 12px; font-size:0.8rem; color:#1E293B;">${timeStr}</td>
          <td style="padding:10px 12px; font-size:0.8rem; font-weight:800;">${statusIcon}</td>
          <td style="padding:10px 12px; font-size:0.8rem; font-weight:700; color:${item.ms > 2000 ? '#D97706' : '#0F172A'};">${item.ms} ms</td>
          <td style="padding:10px 12px; font-size:0.78rem; color:${item.ok ? '#059669' : '#DC2626'};">
            ${item.status_code ? `HTTP ${item.status_code}` : ''} ${this.escapeHtml(item.error || 'Operación exitosa')}
          </td>
        </tr>
      `;
    }).join('');
  }

  closeHistoryModal() {
    const modal = document.getElementById('modal-health-history');
    if (modal) modal.style.display = 'none';
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

window.healthDashboard = new HealthDashboard();
document.addEventListener('DOMContentLoaded', () => {
  window.healthDashboard.init();
});
