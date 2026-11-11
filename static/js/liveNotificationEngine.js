/**
 * 🔔 LiveNotificationEngine - Mrs. Pets VIP Real-Time Notification System
 * Sincronización bidireccional instantánea entre Staff y Clientes:
 * 1. Cliente reserva -> Staff recibe banner interactivo con chime: "🔔 Se acaba de hacer una reserva, por favor confirme."
 * 2. Staff confirma -> Cliente recibe banner de felicitaciones: "🎉 ¡Felicitaciones! Su reserva ha sido confirmada."
 * 3. Actualizaciones y cancelaciones notificadas en tiempo real.
 * Soporta BroadcastChannel, localStorage events y sincronización con Render backend.
 */

(function(window) {
  'use strict';

  class LiveNotificationEngine {
    constructor() {
      this.channelName = 'mrspets_live_reservation_channel';
      this.storageKey = 'mrspets_live_reservation_event';
      this.processedEvents = new Set();
      this.channel = null;
      this.pollInterval = null;
      this.lastPollTimestamp = Date.now() / 1000 - 30; // Últimos 30 segundos al iniciar
      this.activeBanners = new Map();
      this.audioContext = null;
    }

    init() {
      console.log('🔔 [LiveNotificationEngine] Inicializando motor de alertas en vivo Mrs. Pets...');

      // 1. Iniciar BroadcastChannel si está soportado por el navegador
      if (typeof window.BroadcastChannel === 'function') {
        try {
          this.channel = new BroadcastChannel(this.channelName);
          this.channel.onmessage = (event) => {
            if (event && event.data) {
              this.handleIncomingEvent(event.data);
            }
          };
        } catch (e) {
          console.warn('[LiveNotificationEngine] BroadcastChannel no disponible:', e);
        }
      }

      // 2. Respaldo por StorageEvent (comunicación instantánea entre pestañas de cualquier navegador)
      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.handleIncomingEvent(parsed);
          } catch (err) {}
        }
      });

      // 3. Polling periódico al backend Render para capturar reservas creadas desde otros dispositivos (ej. móvil -> PC)
      this.startBackendPolling();

      // Exponer referencia global abreviada
      window.liveNotify = this;
    }

    startBackendPolling() {
      if (this.pollInterval) clearInterval(this.pollInterval);
      this.pollInterval = setInterval(() => {
        this.fetchBackendNotifications();
      }, 5000);
    }

    async fetchBackendNotifications() {
      try {
        const res = await fetch(`/api/v1/notificaciones/recientes?since=${this.lastPollTimestamp}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.events)) {
            data.events.forEach(evt => this.handleIncomingEvent(evt));
            if (data.current_time) {
              this.lastPollTimestamp = data.current_time;
            }
          }
        }
      } catch (err) {
        // En caso de modo offline local, BroadcastChannel y storage se encargan sin problemas
      }
    }

    /**
     * Emite un evento hacia todos los canales (Local, BroadcastChannel, Storage y Backend)
     */
    broadcastEvent(type, payload) {
      const eventId = `EVT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const eventObj = {
        id: eventId,
        type: type,
        payload: payload,
        timestamp: Date.now() / 1000,
        source: 'client_ui'
      };

      // Marcar como procesado localmente para que el emisor gestione su propia vista
      this.processedEvents.add(eventId);

      // A) Emitir por BroadcastChannel (0ms latencia cross-tab)
      if (this.channel) {
        try { this.channel.postMessage(eventObj); } catch(e) {}
      }

      // B) Emitir por localStorage (backup cross-tab)
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(eventObj));
      } catch (e) {}

      // C) Despachar al backend en Render para otros dispositivos
      try {
        fetch('/api/v1/notificaciones/reservacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventObj)
        }).catch(() => {});
      } catch (e) {}

      // D) Evaluar también en la misma ventana según el rol activo
      this.evaluateForLocalView(eventObj);

      return eventObj;
    }

    notifyReservationCreated(apptData) {
      return this.broadcastEvent('RESERVATION_CREATED', apptData);
    }

    notifyReservationApproved(apptData) {
      return this.broadcastEvent('RESERVATION_APPROVED', apptData);
    }

    notifyReservationRejected(apptData) {
      return this.broadcastEvent('RESERVATION_REJECTED', apptData);
    }

    handleIncomingEvent(eventObj) {
      if (!eventObj || !eventObj.id || this.processedEvents.has(eventObj.id)) {
        return;
      }
      this.processedEvents.add(eventObj.id);

      // Limitar tamaño del Set de eventos procesados
      if (this.processedEvents.size > 200) {
        const arr = Array.from(this.processedEvents).slice(-100);
        this.processedEvents = new Set(arr);
      }

      this.evaluateForLocalView(eventObj);
    }

    evaluateForLocalView(eventObj) {
      const isStaff = this.isCurrentUserStaff();
      const type = eventObj.type;
      const data = eventObj.payload || {};

      if (type === 'RESERVATION_CREATED') {
        // Notificación para el STAFF: "Se acaba de hacer una reserva, por favor confirme"
        if (isStaff) {
          this.showStaffNewReservationBanner(data, eventObj.id);
          this.playChime('staff');
        }
      } else if (type === 'RESERVATION_APPROVED') {
        // Notificación para el CLIENTE: "¡Felicitaciones! Su reserva ha sido confirmada"
        // Se muestra si está en modo cliente o si el tutor/mascota coincide
        if (!isStaff || this.isTargetCustomer(data)) {
          this.showClientConfirmedBanner(data, eventObj.id);
          this.playChime('celebration');
        }
      } else if (type === 'RESERVATION_REJECTED') {
        if (!isStaff || this.isTargetCustomer(data)) {
          this.showClientRejectedBanner(data, eventObj.id);
          this.playChime('warning');
        }
      }
    }

    isCurrentUserStaff() {
      if (window.adminEngine && window.adminEngine.viewEnvironment === 'enterprise') return true;
      if (window.authEngine && window.authEngine.userRole === 'staff') return true;
      if (document.body && document.body.classList.contains('enterprise-view-mode')) return true;
      return false;
    }

    isTargetCustomer(data) {
      const currentUserName = (window.authEngine && window.authEngine.userName) || '';
      const currentPetId = (window.authEngine && window.authEngine.currentVipPetId) || '';
      if (!data) return true;
      if (data.tutor && currentUserName && currentUserName.toLowerCase().includes(data.tutor.toLowerCase())) return true;
      if (data.petId && currentPetId && data.petId === currentPetId) return true;
      return true; // En vista de cliente, mostrar confirmación
    }

    /**
     * 🔔 BANNER INTERACTIVO PARA EL STAFF:
     * "Se acaba de hacer una reserva, por favor confirme."
     */
    showStaffNewReservationBanner(data, eventId) {
      const bannerId = `banner-staff-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const pet = data.pet || data.petName || 'Consentido VIP';
      const tutor = data.tutor || data.owner || 'Tutor Registrado';
      const area = (data.area || 'Grooming').toUpperCase();
      const service = data.service || 'Servicio Integral';
      const date = data.date || 'Hoy';
      const time = data.time || '10:00 AM';
      const apptId = data.id || '';

      const banner = document.createElement('div');
      banner.id = bannerId;
      banner.className = 'mrs-pets-live-toast staff-toast';
      banner.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999999;
        width: 420px;
        max-width: calc(100vw - 32px);
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
        border: 2px solid #d4af37;
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 25px rgba(212,175,55,0.35);
        padding: 18px 20px;
        font-family: inherit;
        animation: mrsSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      `;

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg, #d4af37, #b45309); display:flex; align-items:center; justify-content:center; font-size:1.3rem; box-shadow:0 0 12px rgba(212,175,55,0.5);">
              🔔
            </div>
            <div>
              <div style="font-weight:900; font-size:0.98rem; color:#fef08a; display:flex; align-items:center; gap:6px;">
                ¡Se acaba de hacer una reserva!
              </div>
              <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">
                Por favor confirme la disponibilidad en agenda
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer; padding:2px 6px;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.06); border-radius:12px; padding:12px; margin-bottom:14px; border:1px solid rgba(255,255,255,0.1); font-size:0.85rem; line-height:1.45;">
          <div style="margin-bottom:4px;">🐾 <strong style="color:#ffffff;">Mascota:</strong> <span style="color:#fde047; font-weight:800;">${pet}</span></div>
          <div style="margin-bottom:4px;">👤 <strong style="color:#ffffff;">Tutor:</strong> ${tutor}</div>
          <div style="margin-bottom:4px;">📍 <strong style="color:#ffffff;">Área & Servicio:</strong> <span class="badge" style="background:rgba(212,175,55,0.25); color:#fef08a; padding:2px 6px; border-radius:6px; font-weight:800;">${area}</span> ${service}</div>
          <div>📅 <strong style="color:#ffffff;">Horario Solicitado:</strong> <span style="color:#34d399; font-weight:800;">${date} a las ${time}</span></div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="liveNotify.handleStaffApproveClick('${apptId}', '${bannerId}')" style="flex:1.4; background:linear-gradient(135deg, #10b981, #059669); color:#05120c !important; font-weight:900; border:none; border-radius:10px; padding:9px 12px; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.35);">
            ✅ Confirmar Reserva
          </button>
          <button type="button" onclick="liveNotify.handleStaffViewInboxClick('${bannerId}')" style="flex:1; background:rgba(255,255,255,0.1); color:#ffffff; font-weight:800; border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:9px 12px; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px;">
            📋 Ver Agenda
          </button>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);

      // Auto-descartar tras 40 segundos si no hay acción
      setTimeout(() => this.dismiss(bannerId), 40000);
    }

    /**
     * 🎉 BANNER DE CELEBRACIÓN PARA EL CLIENTE:
     * "¡Felicitaciones! Su reserva ha sido confirmada."
     */
    showClientConfirmedBanner(data, eventId) {
      const bannerId = `banner-client-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const pet = data.pet || data.petName || 'tu consentido(a)';
      const tutor = data.tutor || data.owner || 'Estimado(a) Tutor VIP';
      const area = (data.area || 'Grooming & Spa').toUpperCase();
      const date = data.date || 'Próxima fecha';
      const time = data.time || 'Horario confirmado';
      const turnNumber = data.turnNumber || data.turno || '01';

      const banner = document.createElement('div');
      banner.id = bannerId;
      banner.className = 'mrs-pets-live-toast client-toast';
      banner.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999999;
        width: 440px;
        max-width: calc(100vw - 32px);
        background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%);
        color: #ffffff;
        border: 2px solid #10b981;
        border-radius: 22px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.65), 0 0 30px rgba(16,185,129,0.45);
        padding: 20px 22px;
        font-family: inherit;
        animation: mrsSlideDown 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      `;

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #10b981, #34d399); display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 0 16px rgba(16,185,129,0.6);">
              🎉
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#a7f3d0; display:flex; align-items:center; gap:6px;">
                ¡Felicitaciones! Su reserva ha sido confirmada
              </div>
              <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">
                Aprobada con éxito por el Staff de Mrs. Pets ✨
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer; padding:2px 6px;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:14px; border:1px solid rgba(16,185,129,0.3); font-size:0.88rem; line-height:1.5;">
          <p style="margin:0 0 8px 0; color:#f8fafc;">
            ¡Qué alegría, <strong>${tutor}</strong>! Hemos confirmado el turno para consentir a tu amado príncipe/princesa <strong>🐾 ${pet}</strong> bajo el estándar <em>Silent Luxury</em>.
          </p>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
            <div>
              <span style="font-size:0.75rem; color:#94a3b8; display:block;">CITA AGENDADA:</span>
              <strong style="color:#ffffff;">📅 ${date} • ⏰ ${time}</strong>
            </div>
            <div style="background:rgba(16,185,129,0.25); border:1px solid #10b981; padding:3px 10px; border-radius:8px; font-weight:900; color:#34d399; font-size:0.8rem;">
              🎫 Turno Asignado: #${turnNumber}
            </div>
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="liveNotify.handleClientViewStatusClick('${bannerId}')" style="flex:1.4; background:linear-gradient(135deg, #10b981, #059669); color:#05120c !important; font-weight:900; border:none; border-radius:10px; padding:10px 14px; font-size:0.85rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 3px 12px rgba(16,185,129,0.4);">
            🐾 Ver Estatus de Mi Consentido
          </button>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="flex:1; background:rgba(255,255,255,0.12); color:#ffffff; font-weight:800; border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:10px 12px; font-size:0.85rem; cursor:pointer;">
            Entendido ✕
          </button>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);

      // Auto-descartar tras 30 segundos si el usuario no interactúa
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * ⚠️ BANNER PARA ACTUALIZACIÓN O REPROGRAMACIÓN DE RESERVA
     */
    showClientRejectedBanner(data, eventId) {
      const bannerId = `banner-update-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const pet = data.pet || data.petName || 'tu mascota';
      const banner = document.createElement('div');
      banner.id = bannerId;
      banner.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999999;
        width: 400px;
        max-width: calc(100vw - 32px);
        background: linear-gradient(135deg, #450a0a 0%, #1e293b 100%);
        color: #ffffff;
        border: 2px solid #ef4444;
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.65);
        padding: 16px 18px;
        animation: mrsSlideDown 0.4s ease forwards;
      `;

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.4rem;">⚠️</span>
            <strong style="color:#fca5a5; font-size:0.95rem;">Actualización de Solicitud de Cita</strong>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>
        <p style="font-size:0.82rem; color:#f8fafc; margin:0 0 10px 0; line-height:1.4;">
          La cita para <strong>${pet}</strong> requiere ajuste de horario o disponibilidad. Por favor selecciona otro turno o comunícate con nosotros por WhatsApp.
        </p>
        <div style="display:flex; gap:8px;">
          <button type="button" onclick="clinicaEngine.openGroomingBookingModal(); liveNotify.dismiss('${bannerId}');" style="flex:1; background:#ef4444; color:white; font-weight:800; border:none; padding:7px 10px; border-radius:8px; cursor:pointer; font-size:0.78rem;">
            📅 Ver Horarios Libres
          </button>
          <a href="https://wa.me/584146799510" target="_blank" style="flex:1; background:#25d366; color:white; font-weight:800; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; padding:7px 10px; border-radius:8px; font-size:0.78rem;">
            💬 WhatsApp Staff
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 25000);
    }

    handleStaffApproveClick(apptId, bannerId) {
      this.dismiss(bannerId);
      if (window.adminEngine && typeof window.adminEngine.approvePendingAppointment === 'function') {
        window.adminEngine.approvePendingAppointment(apptId, false);
      } else {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('✅ Reservación confirmada por Staff.', 'success');
        }
      }
    }

    handleStaffViewInboxClick(bannerId) {
      this.dismiss(bannerId);
      if (window.adminEngine && typeof window.adminEngine.openLargeCalendarModal === 'function') {
        window.adminEngine.openLargeCalendarModal();
      } else if (window.adminEngine && typeof window.adminEngine.openPendingAppointmentsInbox === 'function') {
        window.adminEngine.openPendingAppointmentsInbox();
      }
    }

    handleClientViewStatusClick(bannerId) {
      this.dismiss(bannerId);
      if (window.app && typeof window.app.switchTab === 'function') {
        window.app.switchTab('pet-status');
      }
    }

    dismiss(bannerId) {
      const banner = document.getElementById(bannerId);
      if (banner) {
        banner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(-20px) scale(0.95)';
        setTimeout(() => {
          if (banner.parentNode) banner.parentNode.removeChild(banner);
          this.activeBanners.delete(bannerId);
        }, 300);
      }
    }

    /**
     * 🎵 Sintetizador Web Audio API: Sonidos nativos sin latencia y sin dependencias de audio externo
     */
    playChime(type = 'staff') {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        const ctx = this.audioContext;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;

        if (type === 'staff') {
          // Campana de recepción / hotel 5★ suave (C5 -> E5 -> G5)
          const notes = [523.25, 659.25, 783.99];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.11);
            gain.gain.setValueAtTime(0.18, now + idx * 0.11);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.55);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.11);
            osc.stop(now + idx * 0.11 + 0.55);
          });
        } else if (type === 'celebration') {
          // Chime festivo y dulce de confirmación (F5 -> A5 -> C6)
          const notes = [698.46, 880.00, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.15, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.7);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.7);
          });
        } else {
          // Alerta suave preventiva
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
        }
      } catch (err) {
        console.warn('[LiveNotificationEngine] No se pudo reproducir chime de audio:', err);
      }
    }
  }

  // Insertar animación CSS clave para la aparición fluida del banner
  const style = document.createElement('style');
  style.textContent = `
    @keyframes mrsSlideDown {
      0% { opacity: 0; transform: translateY(-30px) scale(0.96); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(style);

  window.LiveNotificationEngine = LiveNotificationEngine;
  window.liveNotificationEngine = new LiveNotificationEngine();

  document.addEventListener('DOMContentLoaded', () => {
    window.liveNotificationEngine.init();
  });

})(window);
