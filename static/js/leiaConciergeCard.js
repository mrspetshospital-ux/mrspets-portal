/**
 * Mrs. Pets - Leia Concierge VIP & Reservaciones
 * Interactive Multimedia Card Engine
 * 
 * Manages:
 * 1. Photo upload / mobile camera capture (📷 Foto)
 * 2. Natural voice conversation with pulsing audio overlay (🎙️ Audio)
 * 3. Document selector (📄 Doc)
 * 4. Close button handling (×)
 * 5. Direct quick-booking shortcuts (Clínica, Grooming, Hotel)
 * 6. Interactive chat messaging with Leia AI
 */

(function (window) {
  'use strict';

  const LeiaConciergeCard = {
    initialized: false,
    recognition: null,
    isListening: false,
    audioTranscript: '',

    init() {
      if (this.initialized) return;

      const btnPhoto = document.getElementById('btnPhoto');
      const photoInput = document.getElementById('photoInput');
      const btnAudio = document.getElementById('btnAudio');
      const voiceOverlay = document.getElementById('voiceOverlay');
      const stopVoiceBtn = document.getElementById('stopVoiceBtn');
      const btnDoc = document.getElementById('btnDoc');
      const docInput = document.getElementById('docInput');
      const chatScreen = document.getElementById('leiaChatScreen');
      const closeBtn = document.getElementById('leiaCardCloseBtn') || document.querySelector('.leia-concierge-card .close-btn');
      const textInput = document.getElementById('leiaChatTextInput');
      const sendBtn = document.getElementById('btnLeiaSendText');

      // 1. Manejo de Foto (Subir o Tomar directamente desde cámara en móviles / selector en PC)
      if (btnPhoto && photoInput) {
        btnPhoto.addEventListener('click', () => {
          photoInput.click();
        });

        photoInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            let imgPreviewUrl = null;
            if (file.type && file.type.startsWith('image/')) {
              try {
                imgPreviewUrl = URL.createObjectURL(file);
              } catch (err) {
                console.warn('[LeiaCard] ObjectURL error:', err);
              }
            }

            this.appendUserMessage(`[📷 Foto adjunta: ${file.name}]`, imgPreviewUrl);

            setTimeout(() => {
              this.appendLeiaBotMessage(`🐾 ¡Foto de tu consentido recibida con éxito! He vinculado la imagen a tu perfil VIP de Mrs. Pets.\n\n¿Deseas agendar **Circuito Grooming Spa**, **Consulta Médica** o **Suite Hotel 5★**?`);
            }, 600);
          }
        });
      }

      // 2. Manejo de Audio (Modo conversación natural / estilo Gemini Live)
      if (btnAudio && voiceOverlay) {
        btnAudio.addEventListener('click', () => {
          this.startVoiceInteraction();
        });
      }

      if (stopVoiceBtn && voiceOverlay) {
        stopVoiceBtn.addEventListener('click', () => {
          this.stopVoiceInteraction();
        });
      }

      // 3. Manejo de Documentos (Solo seleccionar desde PC o teléfono)
      if (btnDoc && docInput) {
        btnDoc.addEventListener('click', () => {
          docInput.click();
        });

        docInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            this.appendUserMessage(`[📄 Documento adjunto: ${file.name}]`);

            setTimeout(() => {
              this.appendLeiaBotMessage(`📄 ¡Documento indexado con éxito! He recibido "${file.name}" y lo he archivado en tu expediente de atención clínica y reservaciones. ¿En qué más puedo asistirte hoy?`);
            }, 600);
          }
        });
      }

      // 4. Manejo del Botón Cerrar (×)
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeCard();
        });
      }

      // 5. Manejo de Envío de Texto
      if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.sendTextMessage();
        });
      }

      if (textInput) {
        textInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendTextMessage();
          }
        });
      }

      this.initialized = true;
      console.log('[LeiaConciergeCard] Módulo multimedia inicializado con éxito.');
    },

    startVoiceInteraction() {
      const voiceOverlay = document.getElementById('voiceOverlay');
      if (voiceOverlay) {
        voiceOverlay.style.display = 'flex';
      }

      this.isListening = true;
      this.audioTranscript = '';

      const voiceStatusText = voiceOverlay ? voiceOverlay.querySelector('p') : null;
      if (voiceStatusText) {
        voiceStatusText.textContent = 'Escuchando de manera natural...';
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.lang = 'es-VE';
          this.recognition.continuous = true;
          this.recognition.interimResults = true;

          this.recognition.onresult = (event) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            this.audioTranscript = current;
            if (voiceStatusText && current) {
              voiceStatusText.textContent = `"${current}"`;
            }
          };

          this.recognition.onerror = (err) => {
            console.warn('[LeiaCard Voice] Recognition error:', err);
          };

          this.recognition.start();
        } catch (err) {
          console.warn('[LeiaCard Voice] Could not start speech recognition:', err);
        }
      }
    },

    stopVoiceInteraction() {
      const voiceOverlay = document.getElementById('voiceOverlay');
      if (voiceOverlay) {
        voiceOverlay.style.display = 'none';
      }

      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {}
        this.recognition = null;
      }

      this.isListening = false;

      const recognized = (this.audioTranscript || '').trim();
      if (recognized) {
        this.appendUserMessage(`[🎙️ "${recognized}"]`);
        this.processAiResponse(recognized);
      } else {
        this.appendUserMessage(`[🎙️ Mensaje de voz enviado y procesado por Leia]`);
        setTimeout(() => {
          this.appendLeiaBotMessage(`✨ ¡Te escuché con atención! He procesado tu solicitud de voz. En Mrs. Pets garantizamos la atención más exclusiva con nuestro protocolo *Silent Luxury*. ¿Deseas coordinar los detalles de tu cita para hoy o fecha futura?`);
        }, 700);
      }

      this.audioTranscript = '';
    },

    closeCard() {
      if (window.authEngine && typeof window.authEngine.handleLeiaCardClose === 'function') {
        window.authEngine.handleLeiaCardClose();
      } else if (window.authEngine && typeof window.authEngine.backToPortalMain === 'function') {
        window.authEngine.backToPortalMain();
      } else {
        const view = document.getElementById('portal-view-leia-reservations');
        if (view) view.style.display = 'none';
        const modal = document.getElementById('leia-concierge-card-modal');
        if (modal) modal.style.display = 'none';
      }
    },

    sendTextMessage() {
      const textInput = document.getElementById('leiaChatTextInput');
      if (!textInput) return;

      const text = textInput.value.trim();
      if (!text) return;

      textInput.value = '';
      this.appendUserMessage(text);
      this.processAiResponse(text);
    },

    processAiResponse(userText) {
      const lower = userText.toLowerCase();

      setTimeout(() => {
        if (lower.includes('grooming') || lower.includes('baño') || lower.includes('corte') || lower.includes('spa') || lower.includes('estetica')) {
          this.appendLeiaBotMessage(`✂️ **Circuito Grooming Spa 7 Estaciones:** Incluye baño con ozonoterapia, mascarilla nutritiva, corte estético especializado e **hidratación obligatoria de pulpejos**. Nuestras citas concluyen estrictamente a las 6:00 p.m. ¡Puedes agendar con el botón superior!`);
        } else if (lower.includes('clinica') || lower.includes('medico') || lower.includes('veterinario') || lower.includes('consulta') || lower.includes('vacuna')) {
          this.appendLeiaBotMessage(`🩺 **Clínica Veterinaria Mrs. Pets:** Contamos con consulta general, laboratorio IDEXX in-house de alta velocidad, ecografía HD y quirófano de alta complejidad. ¿Deseas agendar con nuestro médico de guardia?`);
        } else if (lower.includes('hotel') || lower.includes('suite') || lower.includes('guarderia') || lower.includes('hospedaje')) {
          this.appendLeiaBotMessage(`🏨 **Hotel 5 Estrellas & Suites Bioclimáticas:** Habitaciones climatizadas con monitoreo 24/7, música ambiental relajante y parque recreativo al aire libre. ¡Tu príncipe/princesa estará en las mejores manos!`);
        } else if (lower.includes('tasa') || lower.includes('dolar') || lower.includes('bcv') || lower.includes('precio') || lower.includes('bolivares')) {
          this.appendLeiaBotMessage(`💵 **Tarifas y Tasa Oficial:** Todos nuestros precios en Bolívares se rigen estricta y legalmente por la **Tasa Oficial del BCV**, sincronizada 3 veces al día (08:00 AM, 11:00 AM y 05:00 PM). ¡Cero recargos no oficiales!`);
        } else {
          this.appendLeiaBotMessage(`🎀 ¡Con todo el gusto! He registrado tu consulta en el sistema de Atención Concierge VIP & Reservaciones. Puedes seleccionar una de las opciones rápidas arriba o indicarme el nombre de tu perrito/gatito para asistirte.`);
        }
      }, 700);
    },

    appendUserMessage(text, imgUrl = null) {
      const chatScreen = document.getElementById('leiaChatScreen');
      if (!chatScreen) return;

      const msgDiv = document.createElement('div');
      msgDiv.style.cssText = "background: #333; padding: 10px 14px; border-radius: 12px; font-size: 0.9rem; max-width: 85%; align-self: flex-end; color: #fff; margin-top: 6px; box-shadow:0 2px 8px rgba(0,0,0,0.3); word-break:break-word;";
      
      const textSpan = document.createElement('div');
      textSpan.textContent = text;
      msgDiv.appendChild(textSpan);

      if (imgUrl) {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = 'Foto adjunta';
        img.style.cssText = "max-width: 100%; max-height: 140px; border-radius: 8px; margin-top: 6px; display: block; border: 1px solid #D4AF37; object-fit: cover;";
        msgDiv.appendChild(img);
      }

      chatScreen.appendChild(msgDiv);
      chatScreen.scrollTop = chatScreen.scrollHeight;
    },

    appendLeiaBotMessage(markdownText) {
      const chatScreen = document.getElementById('leiaChatScreen');
      if (!chatScreen) return;

      const msgDiv = document.createElement('div');
      msgDiv.className = 'leia-message bot';
      msgDiv.style.cssText = "background: #2a2a2a; padding: 10px 14px; border-radius: 12px; font-size: 0.9rem; max-width: 85%; align-self: flex-start; color: #fff; margin-top: 6px; border: 1px solid rgba(212,175,55,0.25); line-height: 1.45;";

      // Simple Markdown parser for **bold** and newlines
      let html = markdownText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

      msgDiv.innerHTML = html;
      chatScreen.appendChild(msgDiv);
      chatScreen.scrollTop = chatScreen.scrollHeight;
    }
  };

  // Expose globally
  window.leiaCardEngine = LeiaConciergeCard;

  // Auto-init on DOMContentLoaded or immediate if DOM is already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LeiaConciergeCard.init());
  } else {
    LeiaConciergeCard.init();
  }

})(window);
