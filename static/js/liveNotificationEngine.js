/**
 * 🔔 LiveNotificationEngine - Mrs. Pets VIP Real-Time Notification System
 * Sincronización bidireccional instantánea entre Staff y Clientes:
 * - Notificaciones en pantalla (Toasts/Banners animados con chimes Web Audio API)
 * - Notificaciones automatizadas por WhatsApp para Clientes (Make.com + Simulador + Enlaces directos wa.me)
 * Casos contemplados:
 * 1. Reserva Aprobada o Cancelada
 * 2. Confirmación de Pago
 * 3. Mascota Recibida (Check-in)
 * 4. Mascota Entregada (Check-out)
 * 5. Pedido de Tienda Listo
 * 6. Hotel Boutique: Recepción / Check-in, Listo para Regresar a Casa, Pago Confirmado
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
      this.lastPollTimestamp = Date.now() / 1000 - 30; // Últimos 30 segundos
      this.activeBanners = new Map();
      this.audioContext = null;
      this.defaultPhone = '+584146799510';
    }

    init() {
      console.log('🔔 [LiveNotificationEngine] Inicializando motor de alertas en vivo y WhatsApp Mrs. Pets...');

      // 1. Iniciar BroadcastChannel si está disponible
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

      // 2. Respaldo por StorageEvent (cross-tab)
      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.handleIncomingEvent(parsed);
          } catch (err) {}
        }
      });

      // 3. Polling al backend Render para capturar notificaciones desde otros dispositivos
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
      } catch (err) {}
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

      this.processedEvents.add(eventId);

      // A) BroadcastChannel
      if (this.channel) {
        try { this.channel.postMessage(eventObj); } catch(e) {}
      }

      // B) localStorage
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(eventObj));
      } catch (e) {}

      // C) Backend Render
      try {
        fetch('/api/v1/notificaciones/reservacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventObj)
        }).catch(() => {});
      } catch (e) {}

      // D) Evaluar en la ventana actual
      this.evaluateForLocalView(eventObj);

      return eventObj;
    }

    /**
     * Envía y registra la notificación de WhatsApp para el cliente:
     * - Dispara al simulador de WhatsApp en pantalla
     * - Dispara al webhook de Make.com mediante el backend
     * - Genera el link directo wa.me para interacción inmediata
     */
    sendWhatsAppNotification({ phone, tutor, pet, message, eventType }) {
      const cleanPhone = (phone || this.defaultPhone).replace(/[^0-9+]/g, '');
      const waUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;

      // 1. Mostrar en Simulador de WhatsApp
      if (window.whatsappSim && (typeof window.whatsappSim.sendMessage === 'function' || typeof window.whatsappSim.sendPreset === 'function')) {
        try {
          const simText = `[NOTIFICACIÓN WHATSAPP MRS. PETS • ${cleanPhone}]\n${message}`;
          if (typeof window.whatsappSim.sendMessage === 'function') {
            window.whatsappSim.sendMessage(simText);
          } else {
            window.whatsappSim.sendPreset(simText);
          }
        } catch(e) {}
      }

      // 2. Despachar al backend para envío automatizado por Make.com
      try {
        fetch('/api/v1/notificaciones/reservacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: eventType || 'WHATSAPP_NOTIFICATION',
            channel: 'whatsapp',
            payload: {
              phone: cleanPhone,
              tutor: tutor || 'Cliente VIP',
              pet: pet || 'Consentido VIP',
              message: message,
              timestamp: new Date().toISOString()
            }
          })
        }).catch(() => {});
      } catch(e) {}

      return { cleanPhone, message, waUrl };
    }

    // ==========================================
    // DISPARADORES DE EVENTOS
    // ==========================================

    notifyReservationCreated(apptData) {
      return this.broadcastEvent('RESERVATION_CREATED', apptData);
    }

    notifyReservationApproved(apptData) {
      const pet = apptData.pet || apptData.petName || 'tu consentido(a)';
      const tutor = apptData.tutor || apptData.owner || 'Tutor VIP';
      const area = (apptData.area || 'Grooming').toUpperCase();
      const date = apptData.date || 'Hoy';
      const time = apptData.time || 'Horario pautado';
      const turn = apptData.turnNumber || '01';

      const msg = `🎉 ¡Hola ${tutor}! Te confirmamos con alegría que tu reservación para consentir a *${pet}* en Mrs. Pets (*${area}*) ha sido *APROBADA* para el *${date} a las ${time}*. Turno asignado: *#${turn}*. ¡Los esperamos con todo el amor y el estándar Silent Luxury! ✨🐾`;

      const waRes = this.sendWhatsAppNotification({
        phone: apptData.phone || apptData.ownerPhone,
        tutor: tutor,
        pet: pet,
        message: msg,
        eventType: 'RESERVATION_APPROVED'
      });

      apptData.waUrl = waRes.waUrl;
      apptData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('RESERVATION_APPROVED', apptData);
    }

    notifyReservationCancelled(apptData) {
      const pet = apptData.pet || apptData.petName || 'tu consentido(a)';
      const tutor = apptData.tutor || apptData.owner || 'Tutor VIP';
      const date = apptData.date || '';
      const time = apptData.time || '';

      const msg = `⚠️ Hola *${tutor}*, te informamos de parte de Mrs. Pets que la cita para *${pet}* (${date} ${time}) ha sido *cancelada* o requiere reprogramación de horario. Por favor comunícate con nosotros al +58 414-6799510 o agenda un nuevo turno libre en el portal. ¡Estamos a tu completa orden! 🐾`;

      const waRes = this.sendWhatsAppNotification({
        phone: apptData.phone || apptData.ownerPhone,
        tutor: tutor,
        pet: pet,
        message: msg,
        eventType: 'RESERVATION_CANCELLED'
      });

      apptData.waUrl = waRes.waUrl;
      apptData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('RESERVATION_CANCELLED', apptData);
    }

    notifyReservationRejected(apptData) {
      return this.notifyReservationCancelled(apptData);
    }

    notifyPaymentConfirmed(payData) {
      const tutor = payData.tutor || payData.customerName || 'Cliente VIP';
      const pet = payData.pet || payData.petName || 'Consentido VIP';
      const amountUsd = payData.total ? Number(payData.total).toFixed(2) : (payData.amount || '0.00');
      const amountVes = payData.formattedTotalVes || (payData.totalVes ? `Bs. ${Number(payData.totalVes).toLocaleString('es-VE', {minimumFractionDigits:2})}` : 'Bs. BCV');
      const receiptId = payData.ticketId || payData.receiptId || 'REC-POS';

      const msg = `💳 *¡Pago Confirmado con Éxito - Mrs. Pets!*\n\nEstimado(a) *${tutor}*, hemos recibido su pago por *$${amountUsd} USD* (*${amountVes}*, Tasa Oficial BCV) correspondiente al comprobante *#${receiptId}*.\n\nConsentido atendido: *${pet}*.\n📧 *Factura Digital*: Su factura fiscal electrónica oficial (PDF/XML SENIAT) ha sido despachada automáticamente a su correo electrónico.\n\n¡Gracias por preferir la experiencia Silent Luxury de Mrs. Pets! ✨🐾`;

      const waRes = this.sendWhatsAppNotification({
        phone: payData.phone || payData.customerPhone,
        tutor: tutor,
        pet: pet,
        message: msg,
        eventType: 'PAYMENT_CONFIRMED'
      });

      payData.waUrl = waRes.waUrl;
      payData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('PAYMENT_CONFIRMED', payData);
    }

    notifyPetReceived(petData) {
      const tutor = petData.ownerName || petData.owner || petData.tutor || 'Tutor VIP';
      const pet = petData.petName || petData.name || petData.pet || 'Consentido VIP';
      const area = (petData.area || 'Grooming').toUpperCase();
      const turn = petData.turnNumber || '01';

      const msg = `🐾 *¡Consentido(a) Recibido(a) en Mrs. Pets!*\n\nHola *${tutor}*, te confirmamos que *${pet}* ya ha ingresado a nuestras instalaciones en el área de *${area}* (Turno *#${turn}*).\n\nSe encuentra en las mejores manos con nuestros especialistas bajo música relajante y aromaterapia. ¡Puedes seguir su estatus en tiempo real en nuestro portal! ✨💙`;

      const waRes = this.sendWhatsAppNotification({
        phone: petData.ownerPhone || petData.phone,
        tutor: tutor,
        pet: pet,
        message: msg,
        eventType: 'PET_RECEIVED'
      });

      petData.waUrl = waRes.waUrl;
      petData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('PET_RECEIVED', petData);
    }

    notifyPetReady(petData) {
      const tutor = petData.ownerName || petData.owner || petData.tutor || 'Tutor VIP';
      const pet = petData.petName || petData.name || petData.pet || 'Consentido VIP';
      const area = (petData.area || 'Grooming').toUpperCase();
      const turn = petData.turnNumber || petData.turno || '01';
      const petId = petData.id || petData.petId || 'PET-100';

      const isPaid = Boolean(petData.paymentStatus === 'paid' || petData.hasPaid === true || petData.isPaid === true);
      const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') 
        ? window.location.origin 
        : 'https://mrspets-portal.onrender.com';
      const directPayUrl = `${origin}/?action=checkout&petId=${encodeURIComponent(petId)}&tutor=${encodeURIComponent(tutor)}`;
      petData.directPayUrl = directPayUrl;
      petData.isPaid = isPaid;

      let msg = '';
      if (!isPaid) {
        msg = `🎉 *¡${pet} está lista para que sea buscada! (Mrs. Pets ${area})*\n\nHola *${tutor}*, te confirmamos con gran alegría que *${pet}* ya completó su circuito en *${area}* (Nivel 7: Listo ✨) y ha quedado hermosa, perfumada y radiante.\n\nPor favor confirme que se ha realizado el pago de su servicio para agilizar la entrega en recepción o solicite traslado con nuestra Limusina VIP. ¡Te esperamos! 🐾💙\n\n💳 *¿Aún no has pagado tu servicio? Pague aquí directamente en el carrito:*\n👉 ${directPayUrl}\n*(Haz clic en este enlace para abrir tu cesta y pagar con Pago Móvil, Zelle o Tarjeta a Tasa Oficial BCV)*`;
      } else {
        msg = `🎉 *¡${pet} está lista para que sea buscada! (Mrs. Pets ${area})*\n\nHola *${tutor}*, te confirmamos con gran alegría que *${pet}* ya completó su circuito en *${area}* (Nivel 7: Listo ✨) y ha quedado hermosa, perfumada y radiante.\n\n✅ *Estatus de Pago:* Pagado con Factura Fiscal Digital SENIAT.\n\nPuedes pasar a retirar a tu consentido(a) en recepción o solicitar traslado con nuestra Limusina VIP. ¡Te esperamos! 🐾💙`;
      }

      const waRes = this.sendWhatsAppNotification({
        phone: petData.ownerPhone || petData.phone,
        tutor: tutor,
        pet: pet,
        message: msg,
        eventType: 'PET_READY'
      });

      petData.waUrl = waRes.waUrl;
      petData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('PET_READY', petData);
    }

    notifyPetDelivered(petData) {
      const tutor = petData.ownerName || petData.owner || petData.tutor || 'Tutor VIP';
      const pet = petData.petName || petData.name || petData.pet || 'Consentido VIP';

      const msg = `✨ *¡Consentido(a) Entregado(a) con Éxito!*\n\nEstimado(a) *${tutor}*, *${pet}* ha culminado su servicio con los más altos estándares de calidad y ya ha sido entregado(a). ¡Ha quedado radiante, feliz y perfumado(a)!\n\nGracias por confiar en nuestra familia Mrs. Pets. ¡Esperamos verles pronto de nuevo! 🐾💙`;

      const waRes = this.sendWhatsAppNotification({
        phone: petData.ownerPhone || petData.phone,
        tutor: tutor,
        pet: pet,
        message: msg,
        eventType: 'PET_DELIVERED'
      });

      petData.waUrl = waRes.waUrl;
      petData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('PET_DELIVERED', petData);
    }

    notifyStoreOrderReady(orderData) {
      const customer = orderData.customerName || orderData.tutor || 'Cliente VIP';
      const orderId = orderData.ticketId || orderData.id || 'TIENDA-01';
      const delivery = orderData.deliveryType || 'Retiro en Mostrador Boutique';

      const msg = `🛍️ *¡Tu Pedido de Tienda está Listo!*\n\nEstimado(a) *${customer}*, los consentidos productos de tu orden *#${orderId}* ya han sido cuidadosamente empacados y están listos para: *${delivery}*.\n\n¡Gracias por tu compra en la Tienda Boutique de Mrs. Pets! ✨🐾`;

      const waRes = this.sendWhatsAppNotification({
        phone: orderData.phone || orderData.customerPhone,
        tutor: customer,
        pet: orderData.petName || 'Mascota VIP',
        message: msg,
        eventType: 'STORE_ORDER_READY'
      });

      orderData.waUrl = waRes.waUrl;
      orderData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('STORE_ORDER_READY', orderData);
    }

    notifyHotelPetReceived(petData) {
      const tutor = petData.ownerName || petData.owner || petData.tutor || 'Tutor VIP';
      const pet = petData.petName || petData.name || petData.pet || 'Consentido VIP';
      const suite = petData.suiteName || 'Suite Bioclimática VIP';

      const msg = `🏨 *¡Check-in Exitoso en Hotel Boutique Mrs. Pets!*\n\nEstimado(a) *${tutor}*, le informamos que *${pet}* ya se encuentra felizmente instalado(a) en su *${suite}*.\n\nDisfruta de climatización constante, monitoreo 24/7, música ambiental y atención personalizada. ¡Le deseamos unas mágicas mini-vacaciones! 🐾🛎️✨`;

      const waRes = this.sendWhatsAppNotification({
        phone: petData.ownerPhone || petData.phone,
        tutor: tutor,
        pet: pet,
        message: msg,
        eventType: 'HOTEL_PET_RECEIVED'
      });

      petData.waUrl = waRes.waUrl;
      petData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('HOTEL_PET_RECEIVED', petData);
    }

    notifyHotelPetReadyHome(petData) {
      const tutor = petData.ownerName || petData.owner || petData.tutor || 'Tutor VIP';
      const pet = petData.petName || petData.name || petData.pet || 'Consentido VIP';

      const msg = `🏡 *¡Perrito Listo para Regresar a Casa! (Hotel Check-out)*\n\n¡Qué alegría, *${tutor}*! Te avisamos que *${pet}* ya culminó su estadía en nuestro Hotel Boutique. Se encuentra bañado(a), perfumado(a) y con todo su equipaje listo para el feliz reencuentro en casa.\n\nPuedes pasar por recepción o confirmar su traslado VIP con Limusina Mrs. Pets. ¡Los esperamos! 🐾🚗✨`;

      const waRes = this.sendWhatsAppNotification({
        phone: petData.ownerPhone || petData.phone,
        tutor: tutor,
        pet: pet,
        message: msg,
        eventType: 'HOTEL_PET_READY_HOME'
      });

      petData.waUrl = waRes.waUrl;
      petData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('HOTEL_PET_READY_HOME', petData);
    }

    notifyHotelPaymentConfirmed(payData) {
      const tutor = payData.tutor || payData.customerName || 'Tutor VIP';
      const pet = payData.pet || payData.petName || 'Consentido VIP';
      const amountUsd = payData.total ? Number(payData.total).toFixed(2) : (payData.amount || '45.00');
      const amountVes = payData.formattedTotalVes || (payData.totalVes ? `Bs. ${Number(payData.totalVes).toLocaleString('es-VE', {minimumFractionDigits:2})}` : 'Bs. BCV');
      const receiptId = payData.ticketId || payData.receiptId || 'HOTEL-PAY';

      const msg = `🏨💳 *¡Pago de Estadía Hotel Confirmado!*\n\nEstimado(a) *${tutor}*, confirmamos el pago total de la estadía en Hotel Boutique para *${pet}* por un monto de *$${amountUsd} USD* (*${amountVes}*, Tasa Oficial BCV) bajo el recibo *#${receiptId}*.\n\n📧 *Factura Digital*: Su comprobante fiscal electrónico SENIAT ha sido despachado a su correo registrado.\nLa suite se encuentra 100% saldada. ¡Muchas gracias por elegirnos! 🌟🛎️`;

      const waRes = this.sendWhatsAppNotification({
        phone: payData.phone || payData.customerPhone,
        tutor: tutor,
        pet: pet,
        message: msg,
        eventType: 'HOTEL_PAYMENT_CONFIRMED'
      });

      payData.waUrl = waRes.waUrl;
      payData.waPhone = waRes.cleanPhone;
      return this.broadcastEvent('HOTEL_PAYMENT_CONFIRMED', payData);
    }

    // ==========================================
    // EVALUACIÓN Y DESPLIEGUE VISUAL EN PANTALLA
    // ==========================================

    handleIncomingEvent(eventObj) {
      if (!eventObj || !eventObj.id || this.processedEvents.has(eventObj.id)) {
        return;
      }
      this.processedEvents.add(eventObj.id);

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

      // AISLAMIENTO MULTI-TENANT: En vista cliente, filtrar estrictamente eventos ajenos
      if (!isStaff) {
        let clientTutor = '';
        let clientPetId = '';
        if (window.petStatusEngine && typeof window.petStatusEngine.getActiveCustomerInfo === 'function') {
          const info = window.petStatusEngine.getActiveCustomerInfo();
          clientTutor = info.activeCustomerName;
          clientPetId = info.activePetId;
        } else if (window.authEngine) {
          clientTutor = window.authEngine.userName ? window.authEngine.userName.split('(')[0].trim() : '';
          clientPetId = window.authEngine.currentVipPetId;
        }

        const eventPetId = data.id || data.petId;
        const eventTutor = data.ownerName || data.owner || data.tutor || data.customerName || '';

        // Solo permitir si coincide el ID de mascota o hay coincidencia con el cliente activo
        let isMatch = false;
        if (clientPetId && eventPetId && String(clientPetId).trim() === String(eventPetId).trim()) {
          isMatch = true;
        } else if (window.petStatusEngine && typeof window.petStatusEngine.isClientMatch === 'function' && clientTutor) {
          isMatch = window.petStatusEngine.isClientMatch(data, clientTutor, '', clientPetId);
        } else if (clientTutor && eventTutor) {
          const normA = clientTutor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          const normB = eventTutor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          isMatch = normA.includes(normB) || normB.includes(normA);
        }

        // Si el evento pertenece a otro cliente y esta pantalla es de un cliente específico, suprimir
        if (!isMatch && (clientPetId || clientTutor)) {
          return;
        }
      }

      switch(type) {
        case 'RESERVATION_CREATED':
          if (isStaff) {
            this.showStaffNewReservationBanner(data, eventObj.id);
            this.playChime('staff');
          }
          break;
        case 'RESERVATION_APPROVED':
          this.showClientConfirmedBanner(data, eventObj.id);
          this.playChime('celebration');
          break;
        case 'RESERVATION_CANCELLED':
        case 'RESERVATION_REJECTED':
          this.showClientCancelledBanner(data, eventObj.id);
          this.playChime('warning');
          break;
        case 'PAYMENT_CONFIRMED':
          this.showPaymentConfirmedBanner(data, eventObj.id);
          this.playChime('payment');
          break;
        case 'PET_RECEIVED':
          this.showPetReceivedBanner(data, eventObj.id);
          this.playChime('staff');
          break;
        case 'PET_READY':
          this.showPetReadyBanner(data, eventObj.id);
          this.playChime('celebration');
          break;
        case 'PET_DELIVERED':
          this.showPetDeliveredBanner(data, eventObj.id);
          this.playChime('celebration');
          break;
        case 'STORE_ORDER_READY':
          this.showStoreOrderReadyBanner(data, eventObj.id);
          this.playChime('celebration');
          break;
        case 'HOTEL_PET_RECEIVED':
          this.showHotelPetReceivedBanner(data, eventObj.id);
          this.playChime('hotel');
          break;
        case 'HOTEL_PET_READY_HOME':
          this.showHotelPetReadyHomeBanner(data, eventObj.id);
          this.playChime('celebration');
          break;
        case 'HOTEL_PAYMENT_CONFIRMED':
          this.showHotelPaymentConfirmedBanner(data, eventObj.id);
          this.playChime('payment');
          break;
        default:
          break;
      }
    }

    isCurrentUserStaff() {
      if (window.adminEngine && window.adminEngine.viewEnvironment === 'enterprise') return true;
      if (window.authEngine && window.authEngine.userRole === 'staff') return true;
      if (document.body && document.body.classList.contains('enterprise-view-mode')) return true;
      return false;
    }

    // ==========================================
    // BANNERS EN PANTALLA (HTML & ESTILOS)
    // ==========================================

    createBaseBanner(bannerId, borderGradient, bgGradient, glowColor) {
      const banner = document.createElement('div');
      banner.id = bannerId;
      banner.className = 'mrs-pets-live-toast';
      banner.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999999;
        width: 440px;
        max-width: calc(100vw - 32px);
        background: ${bgGradient};
        color: #FFFFFF;
        border: 2px solid ${borderGradient};
        border-radius: 20px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.7), 0 0 30px ${glowColor};
        padding: 18px 20px;
        font-family: inherit;
        animation: mrsSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        box-sizing: border-box;
      `;
      return banner;
    }

    /**
     * 1. BANNER: Staff Nueva Reserva
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

      const banner = this.createBaseBanner(bannerId, '#D4AF37', 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 'rgba(212,175,55,0.35)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg, #D4AF37, #B45309); display:flex; align-items:center; justify-content:center; font-size:1.3rem; box-shadow:0 0 12px rgba(212,175,55,0.5);">
              🔔
            </div>
            <div>
              <div style="font-weight:900; font-size:0.98rem; color:#FEF08A;">
                ¡Se acaba de hacer una reserva!
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; font-weight:700;">
                Por favor confirme la disponibilidad en agenda
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer; padding:2px 6px;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.06); border-radius:12px; padding:12px; margin-bottom:14px; border:1px solid rgba(255,255,255,0.1); font-size:0.85rem; line-height:1.45;">
          <div style="margin-bottom:4px;">🐾 <strong style="color:#FFFFFF;">Mascota:</strong> <span style="color:#FDE047; font-weight:800;">${pet}</span></div>
          <div style="margin-bottom:4px;">👤 <strong style="color:#FFFFFF;">Tutor:</strong> ${tutor}</div>
          <div style="margin-bottom:4px;">📍 <strong style="color:#FFFFFF;">Área:</strong> <span style="background:rgba(212,175,55,0.25); color:#FEF08A; padding:2px 6px; border-radius:6px; font-weight:800;">${area}</span> ${service}</div>
          <div>📅 <strong style="color:#FFFFFF;">Horario Solicitado:</strong> <span style="color:#34D399; font-weight:800;">${date} a las ${time}</span></div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="liveNotify.handleStaffApproveClick('${apptId}', '${bannerId}')" style="flex:1.4; background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; border:none; border-radius:10px; padding:9px 12px; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.35);">
            ✅ Confirmar Reserva
          </button>
          <button type="button" onclick="liveNotify.handleStaffViewInboxClick('${bannerId}')" style="flex:1; background:rgba(255,255,255,0.1); color:#FFFFFF; font-weight:800; border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:9px 12px; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px;">
            📋 Ver Agenda
          </button>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 40000);
    }

    /**
     * 2. BANNER: Reserva Aprobada (Cliente)
     */
    showClientConfirmedBanner(data, eventId) {
      const bannerId = `banner-approved-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const pet = data.pet || data.petName || 'tu consentido(a)';
      const tutor = data.tutor || data.owner || 'Tutor VIP';
      const date = data.date || 'Próxima fecha';
      const time = data.time || 'Horario confirmado';
      const turnNumber = data.turnNumber || data.turno || '01';
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 414-6799510';

      const banner = this.createBaseBanner(bannerId, '#10B981', 'linear-gradient(135deg, #064E3B 0%, #0F172A 100%)', 'rgba(16,185,129,0.45)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #10B981, #34D399); display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 0 16px rgba(16,185,129,0.6);">
              🎉
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#A7F3D0;">
                ¡Felicitaciones! Su reserva ha sido confirmada
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; font-weight:700;">
                Aprobada con éxito por el Staff de Mrs. Pets ✨
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:12px; border:1px solid rgba(16,185,129,0.3); font-size:0.88rem; line-height:1.5;">
          <p style="margin:0 0 8px 0; color:#F8FAFC;">
            ¡Qué alegría, <strong>${tutor}</strong>! Hemos confirmado el turno para consentir a <strong>🐾 ${pet}</strong> bajo doctrina <em>Silent Luxury</em>.
          </p>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
            <div>
              <span style="font-size:0.72rem; color:#94A3B8; display:block;">CITA AGENDADA:</span>
              <strong style="color:#FFFFFF;">📅 ${date} • ⏰ ${time}</strong>
            </div>
            <div style="background:rgba(16,185,129,0.25); border:1px solid #10B981; padding:3px 10px; border-radius:8px; font-weight:900; color:#34D399; font-size:0.8rem;">
              🎫 Turno: #${turnNumber}
            </div>
          </div>
          <div style="margin-top:10px; background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0; display:flex; align-items:center; gap:6px;">
            <span>📲 Notificación enviada por WhatsApp al tutor (${waPhone})</span>
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="liveNotify.handleClientViewStatusClick('${bannerId}')" style="flex:1.3; background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; border:none; border-radius:10px; padding:10px 14px; font-size:0.82rem; cursor:pointer;">
            🐾 Ver Estatus en Vivo
          </button>
          <a href="${waUrl}" target="_blank" style="flex:1; background:#25D366; color:#FFFFFF; font-weight:900; border-radius:10px; padding:10px 12px; font-size:0.82rem; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 3px 10px rgba(37,211,102,0.35);">
            💬 WhatsApp
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * 3. BANNER: Reserva Cancelada / Reprogramación
     */
    showClientCancelledBanner(data, eventId) {
      const bannerId = `banner-cancelled-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const pet = data.pet || data.petName || 'tu mascota';
      const tutor = data.tutor || data.owner || 'Tutor VIP';
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 414-6799510';

      const banner = this.createBaseBanner(bannerId, '#EF4444', 'linear-gradient(135deg, #450A0A 0%, #1E293B 100%)', 'rgba(239,68,68,0.45)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #EF4444, #991B1B); display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
              ⚠️
            </div>
            <div>
              <div style="font-weight:900; font-size:1rem; color:#FCA5A5;">
                Reserva Cancelada / Ajuste de Agenda
              </div>
              <div style="font-size:0.75rem; color:#CBD5E1;">
                Notificación para ${tutor}
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:12px; padding:12px; margin-bottom:12px; font-size:0.85rem; line-height:1.45;">
          <p style="margin:0 0 6px 0; color:#F8FAFC;">
            La solicitud para <strong>${pet}</strong> ha sido cancelada o requiere ajuste de horario. Por favor selecciona otro turno libre en la agenda o comunícate directamente con nuestro staff.
          </p>
          <div style="background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0;">
            📲 Notificación enviada por WhatsApp al tutor (${waPhone})
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="if(window.clinicaEngine) window.clinicaEngine.openGroomingBookingModal(); liveNotify.dismiss('${bannerId}');" style="flex:1.2; background:#EF4444; color:white; font-weight:800; border:none; padding:9px 12px; border-radius:10px; cursor:pointer; font-size:0.8rem;">
            📅 Ver Horarios Libres
          </button>
          <a href="${waUrl}" target="_blank" style="flex:1; background:#25D366; color:white; font-weight:800; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; padding:9px 12px; border-radius:10px; font-size:0.8rem;">
            💬 WhatsApp Staff
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * 4. BANNER: Confirmación de Pago
     */
    showPaymentConfirmedBanner(data, eventId) {
      const bannerId = `banner-payment-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const tutor = data.tutor || data.customerName || 'Cliente VIP';
      const pet = data.pet || data.petName || 'Consentido VIP';
      const amountUsd = data.total ? Number(data.total).toFixed(2) : (data.amount || '0.00');
      const amountVes = data.formattedTotalVes || (data.totalVes ? `Bs. ${Number(data.totalVes).toLocaleString('es-VE', {minimumFractionDigits:2})}` : 'Bs. BCV');
      const ticketId = data.ticketId || data.receiptId || 'REC-POS';
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 414-6799510';

      const banner = this.createBaseBanner(bannerId, '#D4AF37', 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 'rgba(212,175,55,0.45)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #D4AF37, #F59E0B); display:flex; align-items:center; justify-content:center; font-size:1.5rem; box-shadow:0 0 16px rgba(212,175,55,0.6);">
              💳
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#FEF08A;">
                ¡Pago Confirmado Exitosamente!
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; font-weight:700;">
                Comprobante Fiscal Registrado #${ticketId}
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:12px; border:1px solid rgba(212,175,55,0.3); font-size:0.86rem; line-height:1.5;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="color:#CBD5E1;">Cliente / Tutor:</span>
            <strong style="color:#FFFFFF;">${tutor}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="color:#CBD5E1;">Consentido:</span>
            <strong style="color:#FDE047;">🐾 ${pet}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px; margin-top:6px;">
            <span style="color:#A7F3D0; font-weight:800;">Total Pagado:</span>
            <span style="font-size:1.1rem; font-weight:900; color:#34D399;">$${amountUsd} USD <small style="font-size:0.75rem; color:#CBD5E1;">(${amountVes})</small></span>
          </div>
          <div style="margin-top:10px; background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0;">
            📲 Recibo digital enviado por WhatsApp al tutor (${waPhone})
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="if(window.petStatusEngine) window.petStatusEngine.openSaleReceipt('${ticketId}'); liveNotify.dismiss('${bannerId}');" style="flex:1.2; background:linear-gradient(135deg, #D4AF37, #B45309); color:#FFFFFF; font-weight:900; border:none; padding:10px 12px; border-radius:10px; font-size:0.82rem; cursor:pointer;">
            🧾 Ver Recibo Fiscal
          </button>
          <a href="${waUrl}" target="_blank" style="flex:1; background:#25D366; color:#FFFFFF; font-weight:900; border-radius:10px; padding:10px 12px; font-size:0.82rem; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 3px 10px rgba(37,211,102,0.35);">
            💬 WhatsApp
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * 5. BANNER: Mascota Recibida (Check-in Grooming / Clínica)
     */
    showPetReceivedBanner(data, eventId) {
      const bannerId = `banner-received-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const tutor = data.ownerName || data.owner || data.tutor || 'Tutor VIP';
      const pet = data.petName || data.name || data.pet || 'Consentido VIP';
      const area = (data.area || 'Grooming').toUpperCase();
      const turn = data.turnNumber || '01';
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 414-6799510';

      const banner = this.createBaseBanner(bannerId, '#0284C7', 'linear-gradient(135deg, #075985 0%, #0F172A 100%)', 'rgba(2,132,199,0.45)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #0284C7, #38BDF8); display:flex; align-items:center; justify-content:center; font-size:1.5rem; box-shadow:0 0 16px rgba(2,132,199,0.6);">
              🐾
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#BAE6FD;">
                ¡Mascota Recibida en Mrs. Pets!
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; font-weight:700;">
                Ingreso confirmado a circuito ${area}
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:12px; border:1px solid rgba(56,189,248,0.3); font-size:0.86rem; line-height:1.5;">
          <p style="margin:0 0 8px 0; color:#F8FAFC;">
            <strong>${pet}</strong> ya ingresó a su circuito con nuestro personal especializado. Tutor: <strong>${tutor}</strong>.
          </p>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px;">
            <span style="color:#CBD5E1;">Turno en Circuito:</span>
            <span style="background:rgba(56,189,248,0.25); border:1px solid #38BDF8; color:#BAE6FD; padding:2px 8px; border-radius:6px; font-weight:800;">#${turn}</span>
          </div>
          <div style="margin-top:10px; background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0;">
            📲 Notificación enviada por WhatsApp al tutor (${waPhone})
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="liveNotify.handleClientViewStatusClick('${bannerId}')" style="flex:1.2; background:linear-gradient(135deg, #0284C7, #0369A1); color:#FFFFFF; font-weight:900; border:none; padding:10px 12px; border-radius:10px; font-size:0.82rem; cursor:pointer;">
            🐾 Ver Estatus en Vivo
          </button>
          <a href="${waUrl}" target="_blank" style="flex:1; background:#25D366; color:#FFFFFF; font-weight:900; border-radius:10px; padding:10px 12px; font-size:0.82rem; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 3px 10px rgba(37,211,102,0.35);">
            💬 WhatsApp
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * 5.5 BANNER: Mascota Lista para Entrega (Nivel 7 Grooming)
     */
    showPetReadyBanner(data, eventId) {
      const bannerId = `banner-ready-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const tutor = data.ownerName || data.owner || data.tutor || 'Tutor VIP';
      const pet = data.petName || data.name || data.pet || 'Consentido VIP';
      const petId = data.id || data.petId || 'PET-100';
      const area = (data.area || 'Grooming').toUpperCase();
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 412-5551234';

      const isPaid = Boolean(data.paymentStatus === 'paid' || data.hasPaid === true || data.isPaid === true);
      const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') 
        ? window.location.origin 
        : 'https://mrspets-portal.onrender.com';
      const directPayUrl = data.directPayUrl || `${origin}/?action=checkout&petId=${encodeURIComponent(petId)}&tutor=${encodeURIComponent(tutor)}`;

      const banner = this.createBaseBanner(bannerId, '#10B981', 'linear-gradient(135deg, #065F46 0%, #0F172A 100%)', 'rgba(16,185,129,0.5)');

      const paymentBlockHtml = !isPaid ? `
        <div style="margin-top:8px; background:rgba(212,175,55,0.2); border:1px solid #D4AF37; border-radius:8px; padding:8px 10px; font-size:0.78rem; color:#FEF3C7;">
          <div style="font-weight:900; color:#FDE68A; margin-bottom:3px; display:flex; align-items:center; gap:6px;">
            <span>💳</span> <span>¿Aún no has pagado tu servicio?</span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px; margin-top:4px;">
            <button type="button" onclick="window.openDirectCheckout('${petId}', '${tutor}'); liveNotify.dismiss('${bannerId}');" style="color:#0F172A !important; background:#D4AF37; padding:5px 12px; border-radius:6px; font-weight:900; display:inline-block; font-size:0.75rem; border:none; cursor:pointer;">
              👉 Pague aquí directamente en el carrito
            </button>
          </div>
        </div>
      ` : `
        <div style="margin-top:8px; background:rgba(16,185,129,0.2); border:1px solid #10B981; border-radius:8px; padding:6px 10px; font-size:0.78rem; color:#A7F3D0; font-weight:800;">
          ✅ Estatus: Pagado con Factura Fiscal Digital SENIAT
        </div>
      `;

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #10B981, #34D399); display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 0 16px rgba(16,185,129,0.6);">
              🎉
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#A7F3D0;">
                ¡${pet} está lista para que sea buscada!
              </div>
              <div style="font-size:0.75rem; color:#D1FAE5; font-weight:700;">
                Circuito ${area} • Nivel 7: Listo ✨
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:12px; border:1px solid rgba(16,185,129,0.3); font-size:0.86rem; line-height:1.5;">
          <p style="margin:0 0 8px 0; color:#F8FAFC;">
            Estimado(a) <strong>${tutor}</strong>, <strong>${pet}</strong> ya culminó su circuito de Spa. Por favor confirme que se ha realizado el pago de su servicio para agilizar la entrega en recepción.
          </p>
          ${paymentBlockHtml}
          <div style="margin-top:8px; background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0;">
            📲 Notificación con enlace de retiro enviada por WhatsApp al tutor (${waPhone})
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="window.openDirectCheckout('${petId}', '${tutor}'); liveNotify.dismiss('${bannerId}');" style="flex:1.3; background:linear-gradient(135deg, #D4AF37, #B8860B); color:#0F172A; font-weight:900; border-radius:10px; padding:10px 12px; border:none; font-size:0.82rem; cursor:pointer; box-shadow:0 3px 10px rgba(212,175,55,0.4);">
            💳 Pagar con Tarjeta o BCV ➔
          </button>
          <button type="button" onclick="if(window.petStatusEngine) window.petStatusEngine.triggerPetReadyScreenPop(window.petStatusEngine.pets.find(p=>p.id==='${petId}')||'${petId}'); liveNotify.dismiss('${bannerId}');" style="flex:1; background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; border:none; padding:10px 12px; border-radius:10px; font-size:0.82rem; cursor:pointer; box-shadow:0 3px 10px rgba(16,185,129,0.35);">
            🔔 Ver Screen Pop
          </button>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * 6. BANNER: Mascota Entregada
     */
    showPetDeliveredBanner(data, eventId) {
      const bannerId = `banner-delivered-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const tutor = data.ownerName || data.owner || data.tutor || 'Tutor VIP';
      const pet = data.petName || data.name || data.pet || 'Consentido VIP';
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 414-6799510';

      const banner = this.createBaseBanner(bannerId, '#10B981', 'linear-gradient(135deg, #065F46 0%, #0F172A 100%)', 'rgba(16,185,129,0.45)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #10B981, #34D399); display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 0 16px rgba(16,185,129,0.6);">
              ✨
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#A7F3D0;">
                ¡Consentido(a) Entregado(a)!
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; font-weight:700;">
                Servicio culminado con éxito y amor
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:12px; border:1px solid rgba(16,185,129,0.3); font-size:0.86rem; line-height:1.5;">
          <p style="margin:0 0 8px 0; color:#F8FAFC;">
            <strong>${pet}</strong> ha sido entregado(a) radiante y perfumado(a) a su tutor <strong>${tutor}</strong>. ¡Gracias por confiar en Mrs. Pets!
          </p>
          <div style="margin-top:10px; background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0;">
            📲 Notificación de entrega enviada por WhatsApp al tutor (${waPhone})
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="flex:1.2; background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; border:none; padding:10px 12px; border-radius:10px; font-size:0.82rem; cursor:pointer;">
            💙 Finalizar
          </button>
          <a href="${waUrl}" target="_blank" style="flex:1; background:#25D366; color:#FFFFFF; font-weight:900; border-radius:10px; padding:10px 12px; font-size:0.82rem; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 3px 10px rgba(37,211,102,0.35);">
            💬 WhatsApp
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * 7. BANNER: Pedido de Tienda Listo
     */
    showStoreOrderReadyBanner(data, eventId) {
      const bannerId = `banner-store-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const customer = data.customerName || data.tutor || 'Cliente VIP';
      const orderId = data.ticketId || data.id || 'TIENDA-01';
      const delivery = data.deliveryType || 'Retiro en Mostrador Boutique';
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 414-6799510';

      const banner = this.createBaseBanner(bannerId, '#F59E0B', 'linear-gradient(135deg, #78350F 0%, #0F172A 100%)', 'rgba(245,158,11,0.45)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #F59E0B, #FBBF24); display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 0 16px rgba(245,158,11,0.6);">
              🛍️
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#FDE68A;">
                ¡Tu Pedido de Tienda está Listo!
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; font-weight:700;">
                Orden Boutique #${orderId}
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:12px; border:1px solid rgba(245,158,11,0.3); font-size:0.86rem; line-height:1.5;">
          <p style="margin:0 0 6px 0; color:#F8FAFC;">
            Estimado(a) <strong>${customer}</strong>, tus consentidos productos han sido empacados y están listos para: <strong>${delivery}</strong>.
          </p>
          <div style="margin-top:10px; background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0;">
            📲 Notificación enviada por WhatsApp al cliente (${waPhone})
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="if(window.app) window.app.switchTab('store'); liveNotify.dismiss('${bannerId}');" style="flex:1.2; background:linear-gradient(135deg, #F59E0B, #D97706); color:#FFFFFF; font-weight:900; border:none; padding:10px 12px; border-radius:10px; font-size:0.82rem; cursor:pointer;">
            🛍️ Ver Tienda Boutique
          </button>
          <a href="${waUrl}" target="_blank" style="flex:1; background:#25D366; color:#FFFFFF; font-weight:900; border-radius:10px; padding:10px 12px; font-size:0.82rem; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 3px 10px rgba(37,211,102,0.35);">
            💬 WhatsApp
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * 8. BANNER: Hotel Mascota Recibida (Check-in)
     */
    showHotelPetReceivedBanner(data, eventId) {
      const bannerId = `banner-hotel-in-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const tutor = data.ownerName || data.owner || data.tutor || 'Tutor VIP';
      const pet = data.petName || data.name || data.pet || 'Consentido VIP';
      const suite = data.suiteName || 'Suite Bioclimática VIP';
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 414-6799510';

      const banner = this.createBaseBanner(bannerId, '#8B5CF6', 'linear-gradient(135deg, #4C1D95 0%, #0F172A 100%)', 'rgba(139,92,246,0.45)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #8B5CF6, #A78BFA); display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 0 16px rgba(139,92,246,0.6);">
              🏨
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#DDD6FE;">
                Check-in Hotel Boutique: Mascota Recibida
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; font-weight:700;">
                Instalación en Suite 5★
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:12px; border:1px solid rgba(139,92,246,0.3); font-size:0.86rem; line-height:1.5;">
          <p style="margin:0 0 6px 0; color:#F8FAFC;">
            <strong>${pet}</strong> ya hizo su ingreso al Hotel Boutique y se encuentra en su <strong>${suite}</strong> con climatización y cuidados continuos. Tutor: <strong>${tutor}</strong>.
          </p>
          <div style="margin-top:10px; background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0;">
            📲 Check-in notificado por WhatsApp al tutor (${waPhone})
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="liveNotify.handleClientViewStatusClick('${bannerId}')" style="flex:1.2; background:linear-gradient(135deg, #8B5CF6, #6D28D9); color:#FFFFFF; font-weight:900; border:none; padding:10px 12px; border-radius:10px; font-size:0.82rem; cursor:pointer;">
            🐾 Ver Estatus en Vivo
          </button>
          <a href="${waUrl}" target="_blank" style="flex:1; background:#25D366; color:#FFFFFF; font-weight:900; border-radius:10px; padding:10px 12px; font-size:0.82rem; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 3px 10px rgba(37,211,102,0.35);">
            💬 WhatsApp
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * 9. BANNER: Hotel Perrito Listo para Regresar a Casa
     */
    showHotelPetReadyHomeBanner(data, eventId) {
      const bannerId = `banner-hotel-home-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const tutor = data.ownerName || data.owner || data.tutor || 'Tutor VIP';
      const pet = data.petName || data.name || data.pet || 'Consentido VIP';
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 414-6799510';

      const banner = this.createBaseBanner(bannerId, '#06B6D4', 'linear-gradient(135deg, #0E7490 0%, #0F172A 100%)', 'rgba(6,182,212,0.45)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #06B6D4, #22D3EE); display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 0 16px rgba(6,182,212,0.6);">
              🏡
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#CFFAFE;">
                ¡Perrito Listo para Regresar a Casa!
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; font-weight:700;">
                Hotel Boutique: Check-out completado
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:12px; border:1px solid rgba(6,182,212,0.3); font-size:0.86rem; line-height:1.5;">
          <p style="margin:0 0 6px 0; color:#F8FAFC;">
            ¡Qué alegría, <strong>${tutor}</strong>! <strong>${pet}</strong> ya culminó su estadía en el Hotel Boutique, se encuentra bañado(a), perfumado(a) y con todo su equipaje listo para el regreso a casa.
          </p>
          <div style="margin-top:10px; background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0;">
            📲 Notificación enviada por WhatsApp al tutor (${waPhone})
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="liveNotify.handleClientViewStatusClick('${bannerId}')" style="flex:1.2; background:linear-gradient(135deg, #06B6D4, #0891B2); color:#FFFFFF; font-weight:900; border:none; padding:10px 12px; border-radius:10px; font-size:0.82rem; cursor:pointer;">
            🐾 Ver Estatus
          </button>
          <a href="${waUrl}" target="_blank" style="flex:1; background:#25D366; color:#FFFFFF; font-weight:900; border-radius:10px; padding:10px 12px; font-size:0.82rem; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 3px 10px rgba(37,211,102,0.35);">
            💬 WhatsApp
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    /**
     * 10. BANNER: Hotel Pago Confirmado
     */
    showHotelPaymentConfirmedBanner(data, eventId) {
      const bannerId = `banner-hotel-pay-${eventId || Date.now()}`;
      if (document.getElementById(bannerId)) return;

      const tutor = data.tutor || data.customerName || 'Tutor VIP';
      const pet = data.pet || data.petName || 'Consentido VIP';
      const amountUsd = data.total ? Number(data.total).toFixed(2) : (data.amount || '45.00');
      const amountVes = data.formattedTotalVes || (data.totalVes ? `Bs. ${Number(data.totalVes).toLocaleString('es-VE', {minimumFractionDigits:2})}` : 'Bs. BCV');
      const receiptId = data.ticketId || data.receiptId || 'HOTEL-PAY';
      const waUrl = data.waUrl || `https://wa.me/584146799510`;
      const waPhone = data.waPhone || '+58 414-6799510';

      const banner = this.createBaseBanner(bannerId, '#D4AF37', 'linear-gradient(135deg, #312E81 0%, #0F172A 100%)', 'rgba(212,175,55,0.45)');

      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #D4AF37, #818CF8); display:flex; align-items:center; justify-content:center; font-size:1.5rem; box-shadow:0 0 16px rgba(212,175,55,0.6);">
              🏨💳
            </div>
            <div>
              <div style="font-weight:900; font-size:1.05rem; color:#FEF08A;">
                Pago de Hotel Boutique Confirmado
              </div>
              <div style="font-size:0.75rem; color:#94A3B8; font-weight:700;">
                Suite 100% Saldada #${receiptId}
              </div>
            </div>
          </div>
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="background:none; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:12px; border:1px solid rgba(212,175,55,0.3); font-size:0.86rem; line-height:1.5;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="color:#CBD5E1;">Huésped Consentido:</span>
            <strong style="color:#FDE047;">🐾 ${pet}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="color:#CBD5E1;">Tutor:</span>
            <strong style="color:#FFFFFF;">${tutor}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px; margin-top:6px;">
            <span style="color:#A7F3D0; font-weight:800;">Total Estadía:</span>
            <span style="font-size:1.1rem; font-weight:900; color:#34D399;">$${amountUsd} USD <small style="font-size:0.75rem; color:#CBD5E1;">(${amountVes})</small></span>
          </div>
          <div style="margin-top:10px; background:rgba(37,211,102,0.15); border:1px solid #25D366; border-radius:8px; padding:5px 8px; font-size:0.74rem; color:#A7F3D0;">
            📲 Recibo digital enviado por WhatsApp al tutor (${waPhone})
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" onclick="liveNotify.dismiss('${bannerId}')" style="flex:1.2; background:linear-gradient(135deg, #D4AF37, #B45309); color:#FFFFFF; font-weight:900; border:none; padding:10px 12px; border-radius:10px; font-size:0.82rem; cursor:pointer;">
            🧾 Aceptar
          </button>
          <a href="${waUrl}" target="_blank" style="flex:1; background:#25D366; color:#FFFFFF; font-weight:900; border-radius:10px; padding:10px 12px; font-size:0.82rem; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 3px 10px rgba(37,211,102,0.35);">
            💬 WhatsApp
          </a>
        </div>
      `;

      document.body.appendChild(banner);
      this.activeBanners.set(bannerId, banner);
      setTimeout(() => this.dismiss(bannerId), 30000);
    }

    // ==========================================
    // INTERACCIONES Y AUDIO
    // ==========================================

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
          const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
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
          const notes = [698.46, 880.00, 1046.50]; // F5 -> A5 -> C6
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
        } else if (type === 'payment') {
          const notes = [659.25, 783.99, 987.77, 1318.51]; // E5 -> G5 -> B5 -> E6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.16, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.6);
          });
        } else if (type === 'hotel') {
          const notes = [587.33, 739.99, 880.00]; // D5 -> F#5 -> A5
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.13);
            gain.gain.setValueAtTime(0.14, now + idx * 0.13);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.13 + 0.75);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.13);
            osc.stop(now + idx * 0.13 + 0.75);
          });
        } else {
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
        console.warn('[LiveNotificationEngine] No se pudo reproducir audio chime:', err);
      }
    }
  }

  // Insertar animación CSS clave
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
  window.liveNotify = window.liveNotificationEngine;

  document.addEventListener('DOMContentLoaded', () => {
    window.liveNotificationEngine.init();
  });

})(window);
