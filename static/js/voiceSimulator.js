/* ==========================================================================
   VOICE SIMULATOR ENGINE (Mrs Pets Maracaibo - Web Speech API + Waveform)
   ========================================================================== */

class VoiceSimulator {
  constructor() {
    this.isCallActive = false;
    this.isMuted = false;
    this.callDuration = 0;
    this.timerInterval = null;
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.animFrameId = null;
    
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'es-ES';

      this.recognition.onresult = (event) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.trim();
        if (transcript) {
          this.handleUserInput(transcript);
        }
      };

      this.recognition.onerror = (err) => {
        console.warn('Speech recognition event:', err.error);
      };

      this.recognition.onend = () => {
        if (this.isCallActive && !this.isMuted) {
          try { this.recognition.start(); } catch (e) {}
        }
      };
    }
  }

  toggleCall() {
    if (!this.isCallActive) {
      this.startCall();
    } else {
      this.endCall();
    }
  }

  startCall() {
    this.isCallActive = true;
    this.callDuration = 0;
    
    // Safe UI Update
    const toggleBtn = document.getElementById('btn-toggle-call');
    if (toggleBtn) {
      toggleBtn.classList.remove('btn-call-start');
      toggleBtn.classList.add('btn-call-end');
    }
    const statusLabel = document.getElementById('call-status-label');
    if (statusLabel) {
      statusLabel.innerHTML = `<i data-lucide="phone-call" style="width:14px;"></i> Llamada Conectada (Mrs Pets Maracaibo)`;
    }
    const avatar = document.getElementById('phone-avatar');
    if (avatar) avatar.classList.add('speaking');
    if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();

    // Start Timer
    this.timerInterval = setInterval(() => {
      this.callDuration++;
      const mins = String(Math.floor(this.callDuration / 60)).padStart(2, '0');
      const secs = String(this.callDuration % 60).padStart(2, '0');
      const timerEl = document.getElementById('call-timer');
      if (timerEl) timerEl.innerText = `${mins}:${secs}`;
    }, 1000);

    // Canvas Waveform Animation
    this.startWaveform();

    // Start Speech Recognition if supported
    if (this.recognition) {
      try { this.recognition.start(); } catch (e) {}
    }

    // Initial Agent Greeting for Mrs Pets (Leia)
    const greeting = '¡Hola! Gracias por llamar a Mrs. Pets en la Avenida 2 El Milagro, Maracaibo. Soy Leia 🎀, tu Asistente Ejecutiva y Concierge VIP. Nuestra filosofía es: "We see pets — donde recibimos mascotas y despedimos amigos". ¿Ya eres un chico Mrs. Pet o eres un cliente nuevo? Te recuerdo con orgullo que todos nuestros paquetes de estética incluyen la hidratación de pulpejos para tu príncipe o princesa, y nuestra atención presencial en sucursal finaliza de manera estricta a las 6:00 p.m. ¿En qué te puedo servir hoy?';
    this.addTranscript('agent', greeting);
    this.speak(greeting);

    if (window.app && typeof app.showToast === 'function') {
      app.showToast('Llamada conectada con Leia (Asistente Ejecutiva & Concierge VIP). Puedes hablar por el micrófono.', 'success');
    }
  }

  endCall() {
    this.isCallActive = false;
    clearInterval(this.timerInterval);
    
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
    if (this.synth) {
      this.synth.cancel();
    }

    cancelAnimationFrame(this.animFrameId);
    this.clearWaveform();

    // Safe UI Reset
    const toggleBtn = document.getElementById('btn-toggle-call');
    if (toggleBtn) {
      toggleBtn.classList.remove('btn-call-end');
      toggleBtn.classList.add('btn-call-start');
    }
    const statusLabel = document.getElementById('call-status-label');
    if (statusLabel) {
      statusLabel.innerHTML = `<i data-lucide="phone-off" style="width:14px;"></i> Llamada Desconectada`;
    }
    const avatar = document.getElementById('phone-avatar');
    if (avatar) avatar.classList.remove('speaking');
    if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();

    this.addTranscript('agent', 'Llamada finalizada.');
    if (window.app && typeof app.showToast === 'function') {
      app.showToast('Llamada finalizada. Registro guardado en Mrs Pets.', 'info');
    }

    const timerEl = document.getElementById('call-timer');
    const finalDuration = timerEl ? timerEl.innerText : '00:00';

    // Push to Call Logs
    if (window.callLogs && typeof callLogs.addLog === 'function') {
      callLogs.addLog({
        type: 'telephony',
        contact: 'Cliente Mrs Pets Maracaibo',
        duration: finalDuration,
        sentiment: 'Positivo',
        status: 'Completada'
      });
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const muteBtn = document.getElementById('btn-mute');
    if (this.isMuted) {
      muteBtn.classList.add('active');
      if (this.recognition) this.recognition.stop();
      app.showToast('Micrófono silenciado', 'warning');
    } else {
      muteBtn.classList.remove('active');
      if (this.recognition && this.isCallActive) this.recognition.start();
      app.showToast('Micrófono activo', 'info');
    }
  }

  handleUserInput(text) {
    if (!this.isCallActive) return;

    this.addTranscript('user', text);

    // Process AI Agent logic with Mrs Pets Store & Pet Status Query
    setTimeout(() => {
      let reply = "";
      
      const petStatusInfo = typeof petStatusEngine !== 'undefined' ? petStatusEngine.getPetStatusForAI(text) : null;
      const orderStatusInfo = typeof storeEngine !== 'undefined' ? storeEngine.getOrderStatusForAI(text) : null;

      if (orderStatusInfo) {
        reply = orderStatusInfo;
      } else if (petStatusInfo) {
        reply = petStatusInfo;
      } else {
        const lower = text.toLowerCase();
        if (lower.includes('horario') || lower.includes('hora')) {
          reply = "En Mrs Pets Maracaibo atendemos de Lunes a Sábado de 8:00 AM a 7:00 PM.";
        } else if (lower.includes('comprar') || lower.includes('champú') || lower.includes('alimento') || lower.includes('producto')) {
          reply = "En la tienda online de Mrs Pets tenemos champús especiales, alimentos super premium y paquetes de grooming. Puedes comprar y pagar en línea fácilmente.";
        } else if (lower.includes('pago') || lower.includes('tarjeta') || lower.includes('zelle')) {
          reply = "En Mrs Pets aceptamos Tarjetas de Crédito/Débito, Zelle, PayPal y pagos electrónicos inmediatos.";
        } else if (lower.includes('cita') || lower.includes('reserva') || lower.includes('grooming')) {
          reply = "¡Con gusto! En Mrs Pets Maracaibo agendamos tu turno de grooming o estadía de hotel. ¿Qué día te gustaría agendar?";
        } else {
          reply = "Entendido. En Mrs Pets estamos para servirte. ¿Deseas consultar sobre tu mascota, agendar una cita o adquirir un producto?";
        }
      }

      this.addTranscript('agent', reply);
      this.speak(reply);
    }, 600);
  }

  addTranscript(speaker, text) {
    const box = document.getElementById('phone-transcript');
    const entry = document.createElement('div');
    entry.className = 'transcript-entry';
    
    const speakerLabel = speaker === 'user' ? 'Tú (Voz)' : 'Leia 🎀 (Concierge IA)';
    entry.innerHTML = `
      <span class="transcript-speaker ${speaker}">${speakerLabel}:</span>
      <span class="transcript-text">${text}</span>
    `;
    box.appendChild(entry);
    box.scrollTop = box.scrollHeight;
  }

  speak(text) {
    if (!this.synth) return;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = this.synth.getVoices();
    const spanishVoice = voices.find(v => v.lang.includes('es'));
    if (spanishVoice) utterance.voice = spanishVoice;

    this.synth.speak(utterance);
  }

  startWaveform() {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    let step = 0;

    const draw = () => {
      if (!this.isCallActive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#8b5cf6';

      const height = canvas.height;
      const width = canvas.width;

      step += 0.08;

      for (let x = 0; x < width; x++) {
        const y = Math.sin(x * 0.03 + step) * 15 * Math.sin(step * 0.5) + height / 2;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      this.animFrameId = requestAnimationFrame(draw);
    };

    draw();
  }

  clearWaveform() {
    const canvas = document.getElementById('waveform-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

const voiceSim = new VoiceSimulator();
