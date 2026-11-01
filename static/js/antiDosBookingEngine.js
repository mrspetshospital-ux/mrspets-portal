/* ==========================================================================
   ANTI-DOS BOOKING VERIFICATION & 2FA OTP ENGINE (Mrs. Pets Maracaibo)
   Silent Luxury Architecture • Inventory Hoarding Protection & Rate Limiting
   ========================================================================== */

class AntiDosBookingEngine {
  constructor() {
    this.pendingBookings = new Map(); // id -> bookingObj
    this.rateLimitTracker = new Map(); // ip/clientKey -> Array of timestamps
    this.phoneQuotaTracker = new Map(); // phone -> count of pending bookings
    this.correlativeCounter = 1279;
    this.activeOtpSession = null;
    this.otpTimerInterval = null;
    this.resendTimerInterval = null;
  }

  init() {
    this.loadStateFromStorage();
    this.startTtlCleanupLoop();
  }

  loadStateFromStorage() {
    try {
      const savedCounter = localStorage.getItem('mrs_pets_correlative_counter');
      if (savedCounter) {
        this.correlativeCounter = parseInt(savedCounter, 10) || 1279;
      }
    } catch (e) {
      console.warn("Could not load correlative counter:", e);
    }
  }

  saveStateToStorage() {
    try {
      localStorage.setItem('mrs_pets_correlative_counter', this.correlativeCounter.toString());
    } catch (e) {
      console.warn("Could not save correlative counter:", e);
    }
  }

  getNextCorrelativeId() {
    this.correlativeCounter++;
    this.saveStateToStorage();
    return `#${this.correlativeCounter}`;
  }

  // --- RATE LIMITING & SECURITY CHECKS (ZERO TRUST BACKEND SIMULATION) ---
  checkRateLimit(clientKey = 'local_client') {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 3;

    let timestamps = this.rateLimitTracker.get(clientKey) || [];
    timestamps = timestamps.filter(ts => (now - ts) < windowMs);

    if (timestamps.length >= maxAttempts) {
      const oldest = timestamps[0];
      const waitMin = Math.ceil((windowMs - (now - oldest)) / 60000);
      return {
        allowed: false,
        reason: `⚠️ Exceso de intentos de reserva. Ha superado el límite de 3 solicitudes en 15 minutos. Por favor intente en ${waitMin} min.`
      };
    }

    timestamps.push(now);
    this.rateLimitTracker.set(clientKey, timestamps);
    return { allowed: true };
  }

  checkPhoneQuota(phone) {
    const cleanPhone = this.normalizePhone(phone);
    let pendingCount = 0;
    for (const booking of this.pendingBookings.values()) {
      if (booking.cleanPhone === cleanPhone && booking.status === 'PENDIENTE_VERIFICACION') {
        pendingCount++;
      }
    }
    if (pendingCount >= 2) {
      return {
        allowed: false,
        reason: `⚠️ El número ${cleanPhone} ya posee 2 reservas provisionales en proceso de verificación. Complete las confirmaciones anteriores.`
      };
    }
    return { allowed: true };
  }

  normalizePhone(phone) {
    if (!phone) return '+58 414-0000000';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('58')) cleaned = '+' + cleaned;
      else if (cleaned.startsWith('0')) cleaned = '+58' + cleaned.substring(1);
      else cleaned = '+58' + cleaned;
    }
    return cleaned;
  }

  maskPhone(phone) {
    const norm = this.normalizePhone(phone);
    if (norm.length >= 12) {
      return `${norm.substring(0, 6)}**-*******`;
    }
    return '+58 4**-*******';
  }

  // --- PROVISIONAL BOOKING & OTP GENERATION ---
  initiateBookingVerification(formData) {
    // 1. Rate limiting check
    const rateCheck = this.checkRateLimit();
    if (!rateCheck.allowed) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(rateCheck.reason, 'error');
      } else {
        alert(rateCheck.reason);
      }
      return null;
    }

    // 2. Phone quota check
    const phoneCheck = this.checkPhoneQuota(formData.phone);
    if (!phoneCheck.allowed) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(phoneCheck.reason, 'error');
      } else {
        alert(phoneCheck.reason);
      }
      return null;
    }

    // 3. Generate Correlative ID & OTP code (6 digits)
    const bookingId = this.getNextCorrelativeId();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const ttlMs = 10 * 60 * 1000; // 10 minutes TTL
    const expiresAt = now + ttlMs;

    const honorific = formData.honorific || 'Príncipe';
    const petName = formData.petName || 'Mascota VIP';
    const tutorName = formData.tutorName || 'Tutor VIP';
    const cleanPhone = this.normalizePhone(formData.phone);

    const booking = {
      id: bookingId,
      otpCode: otpCode,
      tutorName: tutorName,
      petName: petName,
      honorific: honorific,
      fullPetName: `${honorific} ${petName}`,
      phone: formData.phone,
      cleanPhone: cleanPhone,
      maskedPhone: this.maskPhone(cleanPhone),
      service: formData.service || 'Circuito Grooming Spa 7 Estaciones',
      location: formData.location || 'Sede Don Bosco',
      date: formData.date || new Date().toISOString().split('T')[0],
      time: formData.time || '10:00 AM',
      species: formData.species || 'Canino',
      breed: formData.breed || 'Mestizo',
      weight: formData.weight || '5.0',
      status: 'PENDIENTE_VERIFICACION',
      createdAt: now,
      expiresAt: expiresAt
    };

    this.pendingBookings.set(bookingId, booking);
    this.activeOtpSession = booking;

    // 4. Dispatch WhatsApp OTP message via Charlie AI Agent
    this.dispatchOtpWhatsApp(booking);

    // 5. Display OTP Modal & Start 10-min countdown timer
    this.openOtpModal(booking);

    return booking;
  }

  dispatchOtpWhatsApp(booking) {
    const confirmationUrl = `${window.location.origin}${window.location.pathname}?confirm_id=${encodeURIComponent(booking.id)}&otp=${booking.otpCode}`;
    const copy = `¡Hola *${booking.tutorName}*! Para confirmar la cita *${booking.id}* de tu ${booking.honorific.toLowerCase()} *${booking.petName}* en Mrs. Pets, ingresa el código *${booking.otpCode}* o confirma en el siguiente enlace: ${confirmationUrl}`;

    if (window.whatsappSim && typeof window.whatsappSim.sendMessage === 'function') {
      window.whatsappSim.sendMessage(`[ANTIFRAUDE 2FA - CITA ${booking.id}] ${copy}`);
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🔐 Código OTP enviado vía WhatsApp a ${booking.maskedPhone} (Cita ${booking.id})`, 'info');
    }
  }

  // --- OTP VERIFICATION MODAL CONTROLLER ---
  openOtpModal(booking) {
    const modal = document.getElementById('otp-verification-modal');
    if (!modal) return;

    // Update modal labels
    const titleEl = document.getElementById('otp-modal-title');
    const descEl = document.getElementById('otp-modal-desc');
    if (titleEl) titleEl.innerText = `Confirmación de Seguridad de Cita ${booking.id}`;
    if (descEl) {
      descEl.innerHTML = `Hemos enviado un código de seguridad a su WhatsApp al número <strong>${booking.maskedPhone}</strong> para la cita de <strong>${booking.fullPetName}</strong>. Ingréselo para asegurar su lugar en nuestra agenda clínica.`;
    }

    // Reset OTP input boxes
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`otp-digit-${i}`);
      if (input) {
        input.value = '';
        input.classList.remove('error');
      }
    }

    // Focus on first input box
    setTimeout(() => {
      const firstInput = document.getElementById('otp-digit-1');
      if (firstInput) firstInput.focus();
    }, 150);

    // Start 10-min descending countdown timer
    this.start10MinTimer(booking);

    // Start 60s resend button countdown timer
    this.start60SecResendTimer();

    // Show modal using app.openModal or active class
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('otp-verification-modal');
    } else {
      modal.classList.add('active');
    }
  }

  start10MinTimer(booking) {
    if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);
    const timerDisplay = document.getElementById('otp-timer-display');

    const updateTimer = () => {
      const remainingMs = booking.expiresAt - Date.now();
      if (remainingMs <= 0) {
        clearInterval(this.otpTimerInterval);
        booking.status = 'CANCELADO_EXPIRADO';
        if (timerDisplay) {
          timerDisplay.innerText = '00:00 (EXPIRADO)';
          timerDisplay.style.color = '#dc2626';
        }
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`⌛ La reserva provisional ${booking.id} ha expirado (10 min). El horario fue liberado.`, 'error');
        }
        this.closeOtpModal();
        return;
      }

      const totalSec = Math.floor(remainingMs / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      const formatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

      if (timerDisplay) {
        timerDisplay.innerText = formatted;
        timerDisplay.style.color = min < 2 ? '#dc2626' : '#d97706';
      }
    };

    updateTimer();
    this.otpTimerInterval = setInterval(updateTimer, 1000);
  }

  start60SecResendTimer() {
    if (this.resendTimerInterval) clearInterval(this.resendTimerInterval);
    const resendBtn = document.getElementById('otp-resend-btn');
    if (!resendBtn) return;

    let resendCountdown = 60;
    resendBtn.disabled = true;
    resendBtn.style.opacity = '0.6';
    resendBtn.style.cursor = 'not-allowed';

    const updateResend = () => {
      resendCountdown--;
      if (resendCountdown <= 0) {
        clearInterval(this.resendTimerInterval);
        resendBtn.disabled = false;
        resendBtn.style.opacity = '1';
        resendBtn.style.cursor = 'pointer';
        resendBtn.innerText = '📲 Reenviar código vía WhatsApp';
      } else {
        resendBtn.innerText = `📲 Reenviar código vía WhatsApp (${resendCountdown}s)`;
      }
    };

    updateResend();
    this.resendTimerInterval = setInterval(updateResend, 1000);
  }

  resendOtpCode() {
    if (!this.activeOtpSession || this.activeOtpSession.status !== 'PENDIENTE_VERIFICACION') return;
    this.dispatchOtpWhatsApp(this.activeOtpSession);
    this.start60SecResendTimer();
  }

  handleOtpInputChange(index, value) {
    if (value.length > 1) {
      // Handle paste of full 6-digit code
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      digits.forEach((digit, idx) => {
        const input = document.getElementById(`otp-digit-${idx + 1}`);
        if (input) input.value = digit;
      });
      const lastInput = document.getElementById(`otp-digit-${Math.min(digits.length, 6)}`);
      if (lastInput) lastInput.focus();
      this.checkAndVerifyOtp();
      return;
    }

    if (value && index < 6) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    this.checkAndVerifyOtp();
  }

  handleOtpKeyDown(index, event) {
    if (event.key === 'Backspace' && index > 1) {
      const currentInput = document.getElementById(`otp-digit-${index}`);
      if (currentInput && !currentInput.value) {
        const prevInput = document.getElementById(`otp-digit-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          prevInput.value = '';
        }
      }
    }
  }

  getEnteredOtp() {
    let entered = '';
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`otp-digit-${i}`);
      if (input) entered += input.value.trim();
    }
    return entered;
  }

  checkAndVerifyOtp() {
    const entered = this.getEnteredOtp();
    if (entered.length === 6) {
      this.verifyOtpCode(entered);
    }
  }

  verifyOtpCode(enteredCode = null) {
    const code = enteredCode || this.getEnteredOtp();
    if (!this.activeOtpSession) return;

    if (code !== this.activeOtpSession.otpCode) {
      for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`otp-digit-${i}`);
        if (input) input.classList.add('error');
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('❌ Código OTP incorrecto. Por favor verifique el mensaje enviado a su WhatsApp.', 'error');
      }
      return;
    }

    // SUCCESS VERIFICATION
    clearInterval(this.otpTimerInterval);
    clearInterval(this.resendTimerInterval);

    const booking = this.activeOtpSession;
    booking.status = 'CONFIRMADO';
    booking.verifiedAt = Date.now();

    // Register confirmed appointment in adminEngine / storage
    if (window.adminEngine && typeof window.adminEngine.addPendingAppointment === 'function') {
      window.adminEngine.addPendingAppointment({
        id: booking.id,
        area: 'grooming',
        date: booking.date,
        time: booking.time,
        pet: booking.petName,
        tutor: booking.tutorName,
        service: `${booking.service} (${booking.location})`
      });
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✨ ¡Cita ${booking.id} Verificada Exitosamente! Lugar asegurado en la agenda.`, 'success');
    }

    this.closeOtpModal();
    this.openPetPassportModal(booking);
  }

  closeOtpModal() {
    if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);
    if (this.resendTimerInterval) clearInterval(this.resendTimerInterval);
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('otp-verification-modal');
    } else {
      const modal = document.getElementById('otp-verification-modal');
      if (modal) modal.classList.remove('active');
    }
  }

  // --- PET PASSPORT & .ICS CALENDAR EXPORT ---
  openPetPassportModal(booking) {
    const modal = document.getElementById('pet-passport-modal');
    if (!modal) return;

    const codeEl = document.getElementById('passport-booking-code');
    const petEl = document.getElementById('passport-pet-name');
    const tutorEl = document.getElementById('passport-tutor-name');
    const serviceEl = document.getElementById('passport-service-name');
    const dateEl = document.getElementById('passport-date-time');
    const locEl = document.getElementById('passport-location');

    if (codeEl) codeEl.innerText = booking.id;
    if (petEl) petEl.innerText = `${booking.honorific} ${booking.petName}`;
    if (tutorEl) tutorEl.innerText = booking.tutorName;
    if (serviceEl) serviceEl.innerText = booking.service;
    if (dateEl) dateEl.innerText = `${booking.date} a las ${booking.time}`;
    if (locEl) locEl.innerText = booking.location;

    // Attach click handler for calendar export
    const calBtn = document.getElementById('passport-calendar-btn');
    if (calBtn) {
      calBtn.onclick = () => this.downloadIcsCalendarFile(booking);
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('pet-passport-modal');
    } else {
      modal.classList.add('active');
    }
  }

  downloadIcsCalendarFile(booking) {
    const startDateStr = booking.date.replace(/-/g, '');
    const startTimeStr = booking.time.replace(/[^0-9]/g, '').padStart(4, '0') + '00';
    const startIso = `${startDateStr}T${startTimeStr}`;

    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mrs Pets Maracaibo//Pet Passport Booking//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:booking-${booking.id}@mrspets.com
SUMMARY:🐾 Cita Mrs. Pets: ${booking.honorific} ${booking.petName} (${booking.service})
DESCRIPTION:Cita confirmada #${booking.id} para ${booking.honorific} ${booking.petName}. Sede: ${booking.location}. Servicio: ${booking.service}.
LOCATION:${booking.location}, Maracaibo
DTSTART:${startIso}
DTEND:${startIso}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cita_MrsPets_${booking.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('📅 Archivo de calendario (.ics) generado y descargado.', 'success');
    }
  }

  startTtlCleanupLoop() {
    setInterval(() => {
      const now = Date.now();
      for (const [id, booking] of this.pendingBookings.entries()) {
        if (booking.status === 'PENDIENTE_VERIFICACION' && now >= booking.expiresAt) {
          booking.status = 'CANCELADO_EXPIRADO';
          console.log(`TTL Expired: Booking ${id} released automatically.`);
        }
      }
    }, 15000);
  }
}

const antiDosBookingEngine = new AntiDosBookingEngine();
window.antiDosBookingEngine = antiDosBookingEngine;
document.addEventListener('DOMContentLoaded', () => antiDosBookingEngine.init());
