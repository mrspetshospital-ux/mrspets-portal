/**
 * Mrs. Pets - Leia Multimodal Conversational Chat Engine (Orquestador Central)
 * 
 * Widget flotante conversacional multimodal con adaptación por roles (Cliente vs Staff),
 * validación estricta client-side de archivos (Imágenes 8MB, Audios 25MB, Docs 10MB),
 * doble validación de seguridad (Clave de Staff 'nicole'),
 * despacho asíncrono no bloqueante hacia Make.com y Teamly API,
 * y enrutamiento hacia Archivo Muerto Digital (1 Año Fiscal) y NAS Local.
 */

(function (window) {
    'use strict';

    const FILE_LIMITS = {
        image: {
            maxBytes: 8 * 1024 * 1024, // 8 MB
            extensions: ['png', 'jpg', 'jpeg', 'webp'],
            label: 'Imágenes (PNG, JPEG, WEBP - Máx 8 MB)'
        },
        audio: {
            maxBytes: 25 * 1024 * 1024, // 25 MB
            extensions: ['mp3', 'm4a', 'wav'],
            label: 'Audios / Notas de Voz (MP3, M4A, WAV - Máx 25 MB)'
        },
        document: {
            maxBytes: 10 * 1024 * 1024, // 10 MB
            extensions: ['pdf', 'doc', 'docx'],
            label: 'Documentos / Facturas (PDF, DOCX - Máx 10 MB)'
        }
    };

    const LeiaChatEngine = {
        isOpen: false,
        isTyping: false,
        messages: [],
        pendingFile: null,

        init() {
            this.injectWidgetDOM();
            this.setupEventListeners();
            this.loadInitialGreeting();
            if (typeof console !== 'undefined' && console.log) {
                console.log('[LeiaChatEngine] Widget conversacional multimodal inicializado con éxito.');
            }
        },

        isStaffActive() {
            if (window.RBACMiddleware && typeof window.RBACMiddleware.isStaffOrAdmin === 'function') {
                return window.RBACMiddleware.isStaffOrAdmin();
            }
            if (window.AuthEngine && window.AuthEngine.currentUser) {
                const role = String(window.AuthEngine.currentUser.role || '').toLowerCase();
                return role === 'admin' || role === 'staff' || role === 'veterinario' || role === 'groomer';
            }
            return false;
        },

        getCurrentClientContext() {
            const isClient = (window.authEngine && window.authEngine.userRole === 'client') ||
                             localStorage.getItem('mrs_pets_auth_role') === 'client' ||
                             sessionStorage.getItem('mrs_pets_client_authenticated') === 'true';

            if (!isClient) return null;

            const petId = (window.authEngine && window.authEngine.currentVipPetId) ||
                          localStorage.getItem('mrs_pets_active_vip_patient_id') ||
                          'PET-100';

            let patient = null;
            if (window.authEngine && typeof window.authEngine.getPatientById === 'function') {
                patient = window.authEngine.getPatientById(petId);
            }
            if (!patient && window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
                patient = window.adminEngine.patientsStatus.find(p => p.id === petId);
            }
            if (!patient && window.petStatusEngine && Array.isArray(window.petStatusEngine.pets)) {
                patient = window.petStatusEngine.pets.find(p => p.id === petId);
            }

            let rawOwner = (patient && (patient.owner || patient.ownerName)) ||
                           (window.authEngine && window.authEngine.userName) ||
                           localStorage.getItem('mrs_pets_active_customer_name') ||
                           'Dalybell Ramírez Montilla';

            let cleanOwner = rawOwner.split('(')[0].replace(/Tutor de .*/i, '').trim();

            let tutorHonorific = 'Sra. Dalibel';
            const normOwner = cleanOwner.toLowerCase();
            if (normOwner.includes('dalybel') || normOwner.includes('dalibel') || normOwner.includes('talibel')) {
                tutorHonorific = 'Sra. Dalibel';
            } else if (normOwner.includes('dra.') || normOwner.includes('dr.')) {
                tutorHonorific = cleanOwner;
            } else if (cleanOwner) {
                tutorHonorific = `Sra. ${cleanOwner.split(' ')[0]}`;
            }

            let petName = (patient && (patient.name || patient.petName)) || 'Sofía';
            let petHonorific = 'princesa';
            const normPet = petName.toLowerCase();
            if (normPet.includes('thor') || normPet.includes('buddy') || normPet.includes('max') || normPet.includes('rudy') || normPet.includes('carlos')) {
                petHonorific = 'príncipe';
            }

            return {
                isClient: true,
                petId: petId,
                petName: petName,
                petHonorific: petHonorific,
                tutorHonorific: tutorHonorific,
                ownerName: cleanOwner,
                patient: patient
            };
        },

        getCurrentUser() {
            const client = this.getCurrentClientContext();
            if (client) {
                return { name: client.tutorHonorific, role: 'client', petName: client.petName };
            }
            if (window.AuthEngine && window.AuthEngine.currentUser) {
                return window.AuthEngine.currentUser;
            }
            return { name: 'Visitante VIP', role: 'guest' };
        },

        injectWidgetDOM() {
            if (document.getElementById('leia-multimodal-chat-container')) return;

            const container = document.createElement('div');
            container.id = 'leia-multimodal-chat-container';
            container.innerHTML = `
                <!-- BOTÓN FLOTANTE DISCRETO (FAB: LEIA SEARCH) -->
                <button type="button" id="leia-chat-fab" class="leia-chat-fab" onclick="window.LeiaChatEngine.toggleChat();" title="Leia Search 🔍 • Asistencia & Consultas del Equipo">
                    <img src="assets/leia_avatar.jpg" alt="Leia Avatar" class="leia-fab-avatar">
                    <span class="leia-fab-online-dot"></span>
                    <span class="leia-fab-badge-text">Leia Search 🔍</span>
                </button>

                <!-- VENTANA CONVERSACIONAL SILENT LUXURY -->
                <div id="leia-chat-drawer" class="leia-chat-drawer" style="display:none;">
                    <!-- Cabecera del Chat -->
                    <div class="leia-chat-header">
                        <div class="leia-header-info">
                            <div class="leia-header-avatar-wrap">
                                <img src="assets/leia_avatar.jpg" alt="Leia" class="leia-header-avatar">
                                <span class="leia-header-status-dot"></span>
                            </div>
                            <div>
                                <h4 class="leia-header-title" style="color:#ffffff !important;">Leia 🎀</h4>
                                <span class="leia-header-role" id="leia-header-role-badge">Asistencia & Consultas del Equipo</span>
                            </div>
                        </div>
                        <div class="leia-header-actions">
                            <button type="button" class="btn-leia-icon" onclick="window.LeiaChatEngine.toggleChat();" title="Minimizar">─</button>
                            <button type="button" class="btn-leia-icon" onclick="window.LeiaChatEngine.toggleChat();" title="Cerrar">&times;</button>
                        </div>
                    </div>

                    <!-- Overlay de Interacción por Voz Natural (Estilo Gemini Live) -->
                    <div class="voice-interaction-overlay" id="drawer-voice-overlay" style="display:none;">
                        <div class="pulse-ring"></div>
                        <p id="drawer-voice-status" style="color:#fff; font-size:0.95rem; margin-bottom:14px; font-weight:600;">Escuchando de manera natural...</p>
                        <button type="button" class="stop-voice-btn" onclick="window.LeiaChatEngine.stopVoiceInteraction();">Finalizar audio</button>
                    </div>

                    <!-- Feed de Mensajes de Búsqueda Profunda -->
                    <div id="leia-search-chat-messages" class="leia-chat-messages" style="color:#ffffff !important;">
                        <!-- Mensajes inyectados dinámicamente -->
                    </div>

                    <!-- Indicador de Escribiendo... -->
                    <div id="leia-typing-indicator" class="leia-typing-indicator" style="display:none;">
                        <span class="typing-text">Leia está respondiendo...</span>
                        <div class="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>

                    <!-- Área de Previsualización de Adjunto -->
                    <div id="leia-attachment-preview-box" class="leia-attachment-preview-box" style="display:none;">
                        <div class="preview-file-info">
                            <span id="leia-preview-icon" class="preview-icon">📎</span>
                            <div class="preview-meta">
                                <strong id="leia-preview-name" class="preview-name" style="color:#ffffff !important;">archivo.pdf</strong>
                                <small id="leia-preview-size" class="preview-size" style="color:#cbd5e1 !important;">0 KB</small>
                            </div>
                        </div>
                        <button type="button" class="btn-remove-attachment" onclick="window.LeiaChatEngine.clearAttachment();" title="Quitar archivo">&times;</button>
                    </div>

                    <!-- Formulario de Entrada y Adjuntos -->
                    <form id="leia-chat-input-form" class="leia-chat-input-form" onsubmit="event.preventDefault(); window.LeiaChatEngine.handleSendMessage();">
                        <div class="leia-input-toolbar">
                            <button type="button" class="btn-toolbar-attach" onclick="document.getElementById('leia-input-image').click();" title="Subir o Tomar Foto (Cámara / Galería)">
                                📷 <span class="btn-label-desktop">Foto</span>
                            </button>
                            <button type="button" class="btn-toolbar-attach" onclick="window.LeiaChatEngine.startVoiceInteraction();" title="Hablar de manera natural / Conversación por Voz">
                                🎙️ <span class="btn-label-desktop">Audio</span>
                            </button>
                            <button type="button" class="btn-toolbar-attach" onclick="document.getElementById('leia-input-doc').click();" title="Subir Factura o Documento (máx 10MB)">
                                📄 <span class="btn-label-desktop">Doc</span>
                            </button>
                        </div>

                        <div class="leia-input-row">
                            <input type="text" id="leia-chat-text-input" class="leia-chat-text-input" placeholder="Buscar productos, precios BCV, procedimientos o directivas..." autocomplete="off">
                            <button type="submit" id="btn-leia-send" class="btn-leia-send" title="Buscar">
                                🔍
                            </button>
                        </div>

                        <!-- Inputs de archivo ocultos con validación de tipo y captura directa -->
                        <input type="file" id="leia-input-image" accept=".png,.jpg,.jpeg,.webp,image/*" capture="environment" style="display:none;" onchange="window.LeiaChatEngine.handleFileSelected(event, 'image')">
                        <input type="file" id="leia-input-audio" accept=".mp3,.m4a,.wav,audio/*" style="display:none;" onchange="window.LeiaChatEngine.handleFileSelected(event, 'audio')">
                        <input type="file" id="leia-input-doc" accept=".pdf,.doc,.docx,.txt" style="display:none;" onchange="window.LeiaChatEngine.handleFileSelected(event, 'document')">
                    </form>
                </div>

                <!-- MODAL DE DOBLE VALIDACIÓN: CLAVE DE STAFF (SECURITY CHALLENGE) -->
                <div id="staff-control-key-modal" class="luxury-modal" style="display:none;">
                    <div class="luxury-modal-content max-w-450">
                        <div class="luxury-modal-header">
                            <h3 class="modal-title"><span class="text-gold">🔒</span> Validación de Seguridad Staff</h3>
                            <button type="button" class="modal-close-btn" onclick="window.LeiaChatEngine.closeStaffKeyModal();">&times;</button>
                        </div>
                        <div class="luxury-modal-body">
                            <p style="font-size:0.85rem; color:#2C2C2E; line-height:1.5; margin-bottom:14px;">
                                Estás a punto de procesar una carga de archivo administrativo / nota de voz gerencial hacia <strong>Teamly</strong> y <strong>Archivo Muerto Digital</strong>.
                            </p>
                            <div class="form-group-luxury">
                                <label for="staff-control-key-input" class="form-label-luxury">
                                    Introduce tu Clave de Control Personal (ej. "nicole"):
                                </label>
                                <input type="password" id="staff-control-key-input" class="input-luxury" style="background:#FBFBFD; border:1.5px solid #D4AF37; border-radius:10px; padding:10px 14px;" placeholder="Clave de control staff..." autocomplete="off">
                                <span id="staff-key-error-msg" style="display:none; color:#DC2626; font-size:0.75rem; font-weight:800; margin-top:4px;"></span>
                            </div>
                            <div class="modal-footer-luxury mt-3" style="display:flex; justify-content:flex-end; gap:10px;">
                                <button type="button" class="btn-luxury-secondary" onclick="window.LeiaChatEngine.closeStaffKeyModal();">Cancelar</button>
                                <button type="button" class="btn-luxury-primary" onclick="window.LeiaChatEngine.verifyStaffKeyAndProceed();">
                                    ✓ Autorizar y Sincronizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(container);
        },

        setupEventListeners() {
            // Sincronizar rol y recargar saludo cuando cambia el estado de auth o perfil VIP
            window.addEventListener('auth_state_changed', () => {
                this.updateRoleView();
                if (this.messages.length <= 1) {
                    this.loadInitialGreeting(true);
                }
            });
            window.addEventListener('vip_profile_selected', () => {
                this.updateRoleView();
                this.loadInitialGreeting(true);
            });
        },

        toggleChat() {
            this.isOpen = !this.isOpen;
            const drawer = document.getElementById('leia-chat-drawer');
            const fab = document.getElementById('leia-chat-fab');

            if (drawer) {
                drawer.style.display = this.isOpen ? 'flex' : 'none';
                if (this.isOpen) {
                    // Si el chat solo tiene el saludo inicial y se identificó un cliente, refrescar
                    if (this.messages.length <= 1) {
                        const client = this.getCurrentClientContext();
                        const firstMsg = this.messages[0] ? this.messages[0].text : '';
                        if (client && !firstMsg.includes(client.tutorHonorific)) {
                            this.loadInitialGreeting(true);
                        }
                    }
                    this.updateRoleView();
                    this.scrollToBottom();
                    const input = document.getElementById('leia-chat-text-input');
                    if (input) setTimeout(() => input.focus(), 150);
                }
            }
            if (fab) {
                fab.classList.toggle('active', this.isOpen);
            }
        },

        updateRoleView() {
            const roleBadge = document.getElementById('leia-header-role-badge');
            const isStaff = this.isStaffActive();
            const client = this.getCurrentClientContext();
            const user = this.getCurrentUser();

            if (roleBadge) {
                if (client) {
                    roleBadge.innerHTML = `<span class="badge-role-client" style="color:#fef08a !important; font-weight:800;">👑 Tutor VIP: ${client.tutorHonorific} (${client.petName})</span>`;
                } else if (isStaff) {
                    roleBadge.innerHTML = `<span class="badge-role-staff">👑 Staff Operativo (${user.name}) • Leia VIP</span>`;
                } else {
                    roleBadge.innerHTML = `<span>Atención a Clientes & Search Concierge • Av. 2 El Milagro</span>`;
                }
            }
        },

        loadInitialGreeting(force = false) {
            if (this.messages.length > 0 && !force) return;

            const isStaff = this.isStaffActive();
            const client = this.getCurrentClientContext();
            const user = this.getCurrentUser();

            if (force) {
                this.messages = [];
            }

            if (client) {
                this.lastActivePetName = client.petName;
                this.tutorName = client.tutorHonorific;

                // Formular saludo personalizado exacto para el tutor y mascota identificada
                const petAddress = client.petName.toLowerCase() === client.petHonorific 
                    ? client.petHonorific 
                    : `${client.petHonorific} ${client.petName}`;

                this.addMessage({
                    sender: 'leia',
                    text: `¡Hola! Soy **Leia 🎀**, ¿cómo estás, ${petAddress}? 🐾✨\n\nEl día de hoy, ¿cómo está, **${client.tutorHonorific}**? Qué gran alegría tenerlas en casa.\n\n¿En qué puedo ayudarle hoy? ¿Desea hacer una reserva?`,
                    buttons: [
                        '📅 Deseo hacer una reserva',
                        '✂️ Grooming & Spa VIP',
                        '🩺 Consulta Médica',
                        '🏨 Hotel VIP 5★',
                        '🛍️ Tienda Boutique',
                        '🤝 Hablar con Administración'
                    ],
                    timestamp: new Date()
                });
            } else if (isStaff) {
                this.addMessage({
                    sender: 'leia',
                    text: `¡Hola **${user.name}**! Te saluda **Leia 🎀** (Atención Ejecutiva & Staff).\n\nPuedo apoyarte con consultas administrativas, coordinación de citas o enlace con el Comité Volturi (Talibel, Manolo, Valeria, Mike, Charly). ¿En qué podemos avanzar hoy?`,
                    buttons: ['📅 Reservas & Citas', '🤝 Contactar Administración', '✂️ Grooming & Spa', '🏛️ Comité Volturi'],
                    timestamp: new Date()
                });
            } else {
                this.addMessage({
                    sender: 'leia',
                    text: `¡Hola! Soy **Leia 🎀** ✨🐾.\n\nQué gusto tenerte aquí. Estoy a tu completa disposición para orientarte sobre nuestro equipo, administración, servicios o resolver cualquier duda de **Mrs. Pets**.\n\n¿Con quién tengo el gusto de hablar y en qué puedo ayudarte hoy?`,
                    buttons: ['🐾 Soy Cliente', '📅 Deseo una Reserva', '✂️ Grooming Spa', '🩺 Clínica Médica', '🏨 Hotel VIP 5★', '🤝 Hablar con Administración'],
                    timestamp: new Date()
                });
            }
        },

        addMessage(msg) {
            this.messages.push(msg);
            this.renderMessages();
            this.scrollToBottom();
        },

        renderMessages() {
            const container = document.getElementById('leia-search-chat-messages') || document.getElementById('leia-chat-messages');
            if (!container) return;

            container.innerHTML = this.messages.map(m => {
                const isLeia = m.sender === 'leia';
                const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Formateo simple de markdown
                let formattedText = m.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fef08a !important;">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em style="color:#e2e8f0 !important;">$1</em>')
                    .replace(/\n/g, '<br>');

                let attachmentHtml = '';
                if (m.attachment) {
                    attachmentHtml = `
                        <div class="chat-attachment-pill">
                            <span class="attach-icon">${m.attachment.icon}</span>
                            <div class="attach-meta">
                                <strong style="color:#ffffff !important;">${m.attachment.name}</strong>
                                <small style="color:#cbd5e1 !important;">${m.attachment.size}</small>
                            </div>
                        </div>
                    `;
                }

                let buttonsHtml = '';
                if (Array.isArray(m.buttons) && m.buttons.length > 0) {
                    buttonsHtml = `
                        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                            ${m.buttons.map(b => `<button type="button" class="btn btn-sm" style="background:#070a11; border:1px solid #D4AF37; color:#fef08a !important; font-size:0.75rem; border-radius:12px; padding:4px 10px; cursor:pointer; font-weight:700;" onclick="window.LeiaChatEngine.sendUserQuickText('${b.replace(/'/g, "\\'")}')">${b}</button>`).join('')}
                        </div>
                    `;
                }

                return `
                    <div class="chat-bubble-row ${isLeia ? 'leia-row' : 'user-row'}">
                        ${isLeia ? '<img src="assets/leia_avatar.jpg" alt="Leia" class="bubble-avatar">' : ''}
                        <div class="chat-bubble ${isLeia ? 'leia-bubble' : 'user-bubble'}" style="color:#ffffff !important;">
                            <div class="bubble-content" style="color:#ffffff !important;">${formattedText}</div>
                            ${attachmentHtml}
                            ${buttonsHtml}
                            ${isLeia ? `<div style="margin-top:6px;"><button type="button" class="btn-voice-leia" onclick="window.LeiaChatEngine.playVoice(this)" data-text="${encodeURIComponent(m.text)}" style="background: rgba(212,175,55,0.18); border: 1px solid rgba(212,175,55,0.4); color: #fef08a !important; border-radius: 6px; padding: 2px 7px; font-size: 0.68rem; cursor: pointer; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">🔊 Escuchar (ElevenLabs)</button></div>` : ''}
                            <span class="bubble-time" style="color:#cbd5e1 !important;">${timeStr}</span>
                        </div>
                    </div>
                `;
            }).join('');
        },

        async playVoice(btnEl) {
            const rawText = decodeURIComponent(btnEl.getAttribute('data-text') || '');
            const clean = rawText.replace(/[*_#`]/g, '').trim();
            if (!clean) return;

            const prevHtml = btnEl.innerHTML;
            btnEl.innerHTML = '⏳ Generando audio ElevenLabs...';
            btnEl.disabled = true;

            try {
                const res = await fetch('/api/v1/voice/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: clean,
                        agent_id: 'leia'
                    })
                });

                const contentType = res.headers.get('content-type') || '';
                if (res.ok && contentType.includes('audio')) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);

                    btnEl.innerHTML = '🔊 Reproduciendo ElevenLabs...';

                    audio.onended = () => {
                        btnEl.innerHTML = prevHtml;
                        btnEl.disabled = false;
                        URL.revokeObjectURL(url);
                    };
                    audio.onerror = () => {
                        btnEl.innerHTML = prevHtml;
                        btnEl.disabled = false;
                    };

                    await audio.play();
                    return;
                }
            } catch (e) {
                console.warn('[LeiaChatEngine] Error reproduciendo voz ElevenLabs:', e);
            }

            btnEl.innerHTML = prevHtml;
            btnEl.disabled = false;
        },

        sendUserQuickText(text) {
            const input = document.getElementById('leia-chat-text-input');
            if (input) input.value = text;
            this.dispatchMessage(text);
        },

        scrollToBottom() {
            const container = document.getElementById('leia-chat-messages');
            if (container) {
                setTimeout(() => {
                    container.scrollTop = container.scrollHeight;
                }, 50);
            }
        },

        showTypingIndicator(show) {
            this.isTyping = show;
            const el = document.getElementById('leia-typing-indicator');
            if (el) {
                el.style.display = show ? 'flex' : 'none';
            }
            if (show) this.scrollToBottom();
        },

        /**
         * Validación estricta Client-Side de archivos multimodales
         */
        handleFileSelected(event, fileCategory) {
            const file = event.target.files[0];
            if (!file) return;

            const limits = FILE_LIMITS[fileCategory];
            if (!limits) return;

            // 1. Validar extensión
            const ext = file.name.split('.').pop().toLowerCase();
            if (!limits.extensions.includes(ext)) {
                alert(`Formato de archivo no permitido (.${ext}).\n\nFormatos admitidos: ${limits.extensions.join(', ').toUpperCase()}`);
                event.target.value = '';
                return;
            }

            // 2. Validar tamaño estricto
            if (file.size > limits.maxBytes) {
                const maxMb = Math.round(limits.maxBytes / (1024 * 1024));
                const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
                alert(`⚠️ Archivo excede el límite permitido.\n\nTamaño del archivo: ${sizeMb} MB\nLímite máximo para ${fileCategory.toUpperCase()}: ${maxMb} MB.`);
                event.target.value = '';
                return;
            }

            // Guardar adjunto temporalmente para visualización
            const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            const iconMap = { image: '🖼️', audio: '🎙️', document: '📄' };

            this.pendingFile = {
                fileObj: file,
                category: fileCategory,
                name: file.name,
                size: sizeStr,
                icon: iconMap[fileCategory] || '📎'
            };

            this.showAttachmentPreview();
        },

        showAttachmentPreview() {
            const box = document.getElementById('leia-attachment-preview-box');
            const icon = document.getElementById('leia-preview-icon');
            const name = document.getElementById('leia-preview-name');
            const size = document.getElementById('leia-preview-size');

            if (box && this.pendingFile) {
                icon.textContent = this.pendingFile.icon;
                name.textContent = this.pendingFile.name;
                size.textContent = this.pendingFile.size;
                box.style.display = 'flex';
            }
        },

        clearAttachment() {
            this.pendingFile = null;
            const box = document.getElementById('leia-attachment-preview-box');
            if (box) box.style.display = 'none';

            // Limpiar inputs
            ['leia-input-image', 'leia-input-audio', 'leia-input-doc'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        },

        startVoiceInteraction() {
            const overlay = document.getElementById('drawer-voice-overlay');
            const statusEl = document.getElementById('drawer-voice-status');

            if (overlay) overlay.style.display = 'flex';
            if (statusEl) statusEl.textContent = 'Escuchando de manera natural...';

            this._isListening = true;
            this._voiceTranscript = '';

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                try {
                    this._recognition = new SpeechRecognition();
                    this._recognition.lang = 'es-VE';
                    this._recognition.continuous = true;
                    this._recognition.interimResults = true;

                    this._recognition.onresult = (event) => {
                        let transcript = '';
                        for (let i = 0; i < event.results.length; i++) {
                            transcript += event.results[i][0].transcript;
                        }
                        this._voiceTranscript = transcript;
                        if (statusEl && transcript) {
                            statusEl.textContent = `"${transcript}"`;
                        }
                    };

                    this._recognition.onerror = (e) => {
                        console.warn('[Leia Voice]', e.error);
                    };

                    this._recognition.start();
                } catch (e) {
                    console.warn('[Leia Voice] Init error:', e);
                }
            }
        },

        stopVoiceInteraction() {
            const overlay = document.getElementById('drawer-voice-overlay');
            if (overlay) overlay.style.display = 'none';

            if (this._recognition) {
                try { this._recognition.stop(); } catch (e) {}
                this._recognition = null;
            }
            this._isListening = false;

            const spoken = (this._voiceTranscript || '').trim();
            const messageText = spoken ? `[🎙️ "${spoken}"]` : `[🎙️ Mensaje de voz enviado y procesado por Leia]`;

            this.addMessage({
                sender: 'user',
                text: messageText,
                attachment: null,
                timestamp: new Date()
            });

            this._voiceTranscript = '';

            this.showTypingIndicator(true);
            setTimeout(() => {
                this.showTypingIndicator(false);
                if (spoken) {
                    this.simulateAiResponse(spoken);
                } else {
                    this.addMessage({
                        sender: 'leia',
                        text: `✨ ¡Te escuché atentamente! He registrado tu solicitud de voz. En Mrs. Pets garantizamos el más alto estándar de Lujo Silencioso. ¿Deseas coordinar un turno de **Grooming Spa**, **Clínica Veterinaria** o consulta especial para tu consentido?`,
                        timestamp: new Date()
                    });
                }
            }, 800);
        },

        /**
         * Manejo del envío de mensaje
         */
        handleSendMessage() {
            const input = document.getElementById('leia-chat-text-input');
            const text = input ? input.value.trim() : '';

            if (!text && !this.pendingFile) return;

            const isStaff = this.isStaffActive();

            // Si es Staff y está subiendo un archivo administrativo o audio de reunión, requerir Clave de Control
            if (isStaff && this.pendingFile && (this.pendingFile.category === 'audio' || this.pendingFile.category === 'document')) {
                this.openStaffKeyModal();
                return;
            }

            // Procesamiento normal
            this.dispatchMessage(text, null);
        },

        openStaffKeyModal() {
            const modal = document.getElementById('staff-control-key-modal');
            const input = document.getElementById('staff-control-key-input');
            const err = document.getElementById('staff-key-error-msg');

            if (modal) {
                if (input) input.value = '';
                if (err) err.style.display = 'none';
                modal.style.display = 'flex';
                if (input) setTimeout(() => input.focus(), 150);
            }
        },

        closeStaffKeyModal() {
            const modal = document.getElementById('staff-control-key-modal');
            if (modal) modal.style.display = 'none';
        },

        async verifyStaffKeyAndProceed() {
            const input = document.getElementById('staff-control-key-input');
            const err = document.getElementById('staff-key-error-msg');
            const key = input ? input.value.trim().toLowerCase() : '';

            if (!key) {
                if (err) {
                    err.textContent = 'Por favor ingrese la clave de control gerencial.';
                    err.style.display = 'block';
                }
                return;
            }

            try {
                const resp = await fetch('/api/auth/verify-control-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: key })
                });
                const res = await resp.json();
                if (!resp.ok || !res.valid) {
                    if (err) {
                        err.textContent = 'Clave de control incorrecta. Acceso gerencial denegado.';
                        err.style.display = 'block';
                    }
                    return;
                }
            } catch (e) {
                if (err) {
                    err.textContent = 'Error al validar credencial con el servidor.';
                    err.style.display = 'block';
                }
                return;
            }

            this.closeStaffKeyModal();

            const textInput = document.getElementById('leia-chat-text-input');
            const text = textInput ? textInput.value.trim() : '';
            this.dispatchMessage(text, key);
        },

        dispatchMessage(text, staffControlKey) {
            const currentAttachment = this.pendingFile;
            const input = document.getElementById('leia-chat-text-input');
            if (input) input.value = '';
            this.clearAttachment();

            // Agregar mensaje del usuario al chat
            this.addMessage({
                sender: 'user',
                text: text || (currentAttachment ? `[Archivo Adjunto: ${currentAttachment.name}]` : ''),
                attachment: currentAttachment ? { name: currentAttachment.name, size: currentAttachment.size, icon: currentAttachment.icon } : null,
                timestamp: new Date()
            });

            this.showTypingIndicator(true);

            const isStaff = this.isStaffActive();
            const user = this.getCurrentUser();

            // Respuesta no bloqueante inmediata
            setTimeout(() => {
                this.showTypingIndicator(false);

                if (currentAttachment && isStaff) {
                    // Flujo Staff Multimodal
                    if (currentAttachment.category === 'audio') {
                        this.addMessage({
                            sender: 'leia',
                            text: `⚡ **Procesando en segundo plano...**\n\n• Audio de reunión recibido (*${currentAttachment.name}*).\n• Clave de control validada: \`${staffControlKey}\`.\n• Extrayendo actas y generando tareas en **Teamly**.\n• Destino de archivo: **Archivo Muerto Digital (1 Año Fiscal)** con enrutamiento al Servidor NAS Local (\`192.168.1.100\`).`,
                            timestamp: new Date()
                        });

                        // Disparar integración con Teamly
                        if (window.TeamlyEngine) {
                            window.TeamlyEngine.createManagementTask({
                                title: text || 'Acta de Reunión Operativa',
                                actionItems: text || 'Revisión y distribución de turnos de grooming y clínica.',
                                audioName: currentAttachment.name,
                                staffUser: user.name,
                                staffControlKey: staffControlKey,
                                fileSize: currentAttachment.size,
                                nasRouting: true
                            });
                        }
                    } else if (currentAttachment.category === 'document') {
                        this.addMessage({
                            sender: 'leia',
                            text: `⚡ **Documento Fiscal Sincronizado en Segundo Plano**\n\n• Archivo: *${currentAttachment.name}* (${currentAttachment.size}).\n• Clasificación: **Rama Administrativa Permanente** (Google Drive Fiscal / SENIAT).\n• Trazabilidad inmutable generada con clave autorizada.`,
                            timestamp: new Date()
                        });

                        if (window.TeamlyEngine) {
                            window.TeamlyEngine.recordAuditLog({
                                staffUser: user.name,
                                fileType: 'Factura / Documento Fiscal',
                                fileName: currentAttachment.name,
                                purpose: 'Auditoría Fiscal SENIAT/SEDEMAT',
                                lifecycle: 'PERMANENT_FISCAL',
                                storageDestination: 'GOOGLE_DRIVE_FISCAL',
                                teamlySync: true,
                                status: 'CUSTODIA_PERMANENTE'
                            });
                        }
                    } else {
                        this.addMessage({
                            sender: 'leia',
                            text: `🖼️ **Imagen Recibida:** He indexado la imagen *${currentAttachment.name}* para control visual de producto/paciente.`,
                            timestamp: new Date()
                        });
                    }
                } else {
                    // Flujo Conversacional Estándar / Visitante
                    this.generateAssistantReply(text);
                }
            }, 800);
        },

        async generateAssistantReply(userText) {
            const t = (userText || '').toLowerCase();

            // 0. Prioridad de Escalamiento: Si el cliente o usuario pide hablar con Talibel, Administración o el Comité Volturi
            const isRequestingTalibel = t.includes('talibel') || t.includes('dalybell') || t.includes('talibell');
            const isRequestingAdmin = t.includes('administracion') || t.includes('administración') || t.includes('gerencia') || t.includes('volturi') || t.includes('directiva');

            if (isRequestingTalibel) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia (Concierge VIP):** ¡Con el mayor gusto! Te comunico de inmediato con **Talibel** del área de administración ejecutiva.\n\nHe registrado tu solicitud de contacto prioritario para que Talibel tome el caso directamente contigo. ¿Deseas que abra la consola administrativa?`,
                    buttons: ['🏛️ Abrir Consola Volturi', '💬 Continuar con Leia'],
                    timestamp: new Date()
                });
                return;
            }

            if (isRequestingAdmin) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia (Concierge VIP):** ¡Entendido! Te enlazo de inmediato con el **Área de Administración y el Comité Volturi** (Talibel, Manolo en Finanzas, Valeria en RRHH, Mike en Operaciones y Charly).\n\n¿Con qué director o área deseas conversar?`,
                    buttons: ['📊 Manolo (Finanzas)', '👥 Valeria (RRHH)', '⚙️ Mike (Operaciones)', '🏛️ Ver Comité Volturi'],
                    timestamp: new Date()
                });
                return;
            }

            // Si solicita explícitamente a un miembro del Comité Volturi
            if (window.teamilyExecutiveEngine && typeof window.teamilyExecutiveEngine.getAgents === 'function') {
                const agents = window.teamilyExecutiveEngine.getAgents();
                const matchedAgent = agents.find(a => {
                    const cleanName = (a.name || '').toLowerCase();
                    const cleanSlug = (a.teamlySlug || '').toLowerCase();
                    const cleanId = (a.id || '').toLowerCase();
                    return (cleanName && t.includes(cleanName.split(' ')[0])) || (cleanSlug && t.includes(cleanSlug)) || (cleanId && t.includes(cleanId));
                });

                if (matchedAgent && (t.includes('comunic') || t.includes('hablar') || t.includes('pasa') || t.includes('pregunta') || t.includes('conversa') || t.includes('chatea') || t.startsWith(matchedAgent.name.toLowerCase()))) {
                    this.addMessage({
                        sender: 'leia',
                        text: `🎀 **Leia:** ¡Por supuesto! Te transfiero de inmediato con **${matchedAgent.name}** (*${matchedAgent.role}*).\n\nAbriendo canal 1 a 1 para que converses directamente...`,
                        timestamp: new Date()
                    });
                    setTimeout(() => {
                        window.teamilyExecutiveEngine.openDirectChatModal(matchedAgent.id);
                    }, 800);
                    return;
                }
            }

            // 1. En todos los demás casos: LEIA RESPONDE CON PROTOCOLO CONCIERGE VIP & ASISTENCIA CEO
            // Petición POST real al backend con Centralita Router y registro inmutable en Google Sheets
            try {
                this.showTypingIndicator(true);
                const teamilyCtrl = new AbortController();
                const teamilyTimeout = setTimeout(() => teamilyCtrl.abort(), 12000);
                const messageId = 'MSG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
                const res = await fetch('/api/v1/teamily/agent-chat', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-message-id': messageId
                    },
                    body: JSON.stringify({
                        message_id: messageId,
                        agente_origen: 'user',
                        input: userText,
                        agent_slug: 'leia',
                        agent_name: 'Leia Concierge VIP & Asistencia CEO',
                        board_id: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
                        context: {
                            userName: this.tutorName || (user ? user.name : 'Cliente VIP'),
                            petName: this.lastActivePetName || '',
                            userType: isStaff ? 'staff_admin' : 'client',
                            channel: 'Widget Search (Leia Search)'
                        }
                    }),
                    signal: teamilyCtrl.signal
                });
                clearTimeout(teamilyTimeout);
                const data = await res.json();
                this.showTypingIndicator(false);

                if (res.ok && data) {
                    const rawReply = typeof data.response_text === 'object' && data.response_text.text 
                        ? data.response_text.text 
                        : (data.response_text || (data.output && data.output.text));

                    const isReceipt = String(rawReply).includes('serverMsgID');
                    if (!isReceipt && rawReply && String(rawReply).trim().length > 0) {
                        this.addMessage({
                            sender: 'leia',
                            text: rawReply,
                            timestamp: new Date()
                        });
                        return;
                    }
                }
            } catch (err) {
                // Contingencia de red o timeout: activación instantánea de base de conocimiento local
                this.showTypingIndicator(false);
            }

            // 2. Si el usuario se presenta o saluda con su nombre ("Soy Harry", "Harry Luzardo", "Carlos", etc.)
            const nameIntro = userText.match(/(?:soy|me llamo|mi nombre es|te habla|habla)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ\s]+)/i);
            const isDirectName = (!t.includes('reserva') && !t.includes('cita') && !t.includes('baño') && !t.includes('grooming') && !t.includes('clinica') && !t.includes('hotel') && t.split(' ').length <= 4 && (t.includes('harry') || t.includes('luzardo') || t.includes('carlos') || t.includes('maria') || t.includes('maría') || t.includes('pedro') || t.includes('ana') || t.includes('jose') || t.includes('josé')));

            if (nameIntro || isDirectName) {
                let rawName = nameIntro ? nameIntro[1].trim() : userText.trim();
                rawName = rawName.replace(/[.,!¡?¿]/g, '').trim();
                if (rawName.length > 1 && rawName.length < 40) {
                    const titleCaseName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    this.tutorName = titleCaseName;
                    this._expectingPetName = true;
                    const honorific = (t.includes('harry') || t.includes('luzardo')) ? `Don ${titleCaseName}` : titleCaseName;
                    this.addMessage({
                        sender: 'leia',
                        text: `🎀 **Leia:** ¡Qué inmenso gusto saludarte, **${honorific}**! ✨🐾\n\nVeo que eres cliente de nuestra casa. Nos encanta recibirte en **Mrs. Pets** (*\"donde recibimos mascotas y despedimos amigos\"*).\n\n¿Cómo está tu consentido hoy? **¿Me recuerdas el nombre de tu amado perrito o gatito?**`,
                        timestamp: new Date()
                    });
                    return;
                }
            }

            // 2.1 Reconocimiento de Nombre de Mascota / Consentido tras "¿Ya eres Chico Mrs. Pet?"
            const isPetNamePhrase = t.includes('se llama') || t.includes('su nombre es') || t.includes('mi perrito') || t.includes('mi mascota') || t.includes('mi consentido') || t.includes('mi principe') || t.includes('mi príncipe') || t.includes('mi princesa') || t.includes('mi gatico') || t.includes('mi gato');
            if (this._expectingPetName || isPetNamePhrase) {
                let petName = userText.replace(/^(se llama|su nombre es|mi perrito es|mi mascota es|mi consentido es|mi perrito se llama|mi gato se llama|mi príncipe es|mi princesa es|mi príncipe se llama|mi princesa se llama|se trata de|es|el nombre es)\s+/i, '').trim();
                petName = petName.replace(/[.,!¡?¿]/g, '').trim();
                if (petName.length > 0 && petName.length < 35 && !t.includes('chico mrs pet') && !t.includes('cliente nuevo') && !t.includes('reserva')) {
                    petName = petName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    this._expectingPetName = false;
                    this.lastActivePetName = petName;
                    try { sessionStorage.setItem('mrs_pets_active_pet_name', petName); } catch(e){}
                    this.addMessage({
                        sender: 'leia',
                        text: `🎀 **Leia:** 🐾 **¡Qué belleza de consentido! Nos encanta recibir a ${petName}.**\n\nHemos cargado su expediente para consentirlo con el protocolo *Silent Luxury*. ¿En cuál de nuestras 4 áreas de servicio deseas que lo atendamos hoy?\n\n• ✂️ **Circuito Grooming Spa 7 Estaciones:** Baño relajante con ozonoterapia, corte de alta gama y su **hidratación de pulpejos obligatoria** (siempre incluida sin costo adicional 🐾).\n• 🩺 **Clínica Médica & Diagnóstico:** Consulta especializada y laboratorio IDEXX in-house.\n• 🏨 **Suites Bioclimáticas Hotel 5★:** Con monitoreo 24/7 y parque recreativo libre de estrés.\n• 🛍️ **Boutique & Consentidos:** Alimentos premium, suplementos y accesorios exclusivos.\n\n¿Deseas que coordinemos una reserva para **${petName}** hoy?`,
                        buttons: ['✂️ Cita Grooming Spa', '🩺 Consulta Veterinaria', '🏨 Suite Hotel VIP', '🛍️ Boutique & Tienda', '🤝 Hablar con Administración'],
                        timestamp: new Date()
                    });
                    return;
                }
            }

            const client = this.getCurrentClientContext();

            // 2.1.1 Acciones Directas de Apertura de Reservas para Clientes Identificados
            if (t.includes('abrir reserva grooming') || t === '✂️ grooming & spa vip') {
                if (window.clinicaEngine && typeof window.clinicaEngine.openGroomingBookingModal === 'function') {
                    window.clinicaEngine.openGroomingBookingModal();
                } else if (window.app && typeof window.app.openModal === 'function') {
                    window.app.openModal('booking-modal-grooming');
                }
                const pet = client ? client.petName : 'su consentida';
                const tutor = client ? client.tutorHonorific : 'Estimado tutor';
                this.addMessage({
                    sender: 'leia',
                    text: `✂️ **¡Excelente, ${tutor}!** He abierto en pantalla el formulario de **Grooming & Spa** para **${pet}**.\n\nSus datos ya están precargados. Le recordamos con orgullo que la **hidratación de pulpejos** está siempre incluida y nuestra atención en sucursal (Av. 2 El Milagro) es hasta las 6:00 p.m. ✨`,
                    buttons: ['📅 Revisar Horarios', '🤝 Hablar con Administración'],
                    timestamp: new Date()
                });
                return;
            }

            if (t.includes('abrir reserva clinica') || t.includes('abrir reserva veterinaria') || t === '🩺 consulta médica') {
                if (window.clinicaEngine && typeof window.clinicaEngine.openClinicaBookingModal === 'function') {
                    window.clinicaEngine.openClinicaBookingModal();
                } else if (window.app && typeof window.app.openModal === 'function') {
                    window.app.openModal('booking-modal-clinica');
                }
                const pet = client ? client.petName : 'su consentida';
                const tutor = client ? client.tutorHonorific : 'Estimado tutor';
                this.addMessage({
                    sender: 'leia',
                    text: `🩺 **¡Por supuesto, ${tutor}!** He desplegado el módulo de **Consulta Médica Veterinaria** para **${pet}** con nuestro equipo clínico de guardia (Dr. Alejandro Morales).`,
                    buttons: ['📅 Agendar Cita Médica', '🤝 Hablar con Administración'],
                    timestamp: new Date()
                });
                return;
            }

            if (t.includes('abrir reserva hotel') || t === '🏨 hotel vip 5★') {
                if (window.clinicaEngine && typeof window.clinicaEngine.openHotelBookingModal === 'function') {
                    window.clinicaEngine.openHotelBookingModal();
                } else if (window.app && typeof window.app.openModal === 'function') {
                    window.app.openModal('booking-modal-hotel');
                }
                const pet = client ? client.petName : 'su consentida';
                const tutor = client ? client.tutorHonorific : 'Estimado tutor';
                this.addMessage({
                    sender: 'leia',
                    text: `🏨 **¡Con todo gusto, ${tutor}!** He desplegado la reserva de **Suite Bioclimática (Hotel 5★)** para **${pet}** con monitoreo 24/7 y parque recreativo libre de estrés.`,
                    buttons: ['📅 Confirmar Estadía', '🤝 Hablar con Administración'],
                    timestamp: new Date()
                });
                return;
            }

            // 2.2 Deseo hacer una reserva / Cita (incluso en Search)
            if (t.includes('reserva') || t.includes('reservar') || t.includes('cita') || t.includes('agendar') || t.includes('turno')) {
                if (client) {
                    this.addMessage({
                        sender: 'leia',
                        text: `🎀 **Leia:** 📅 **¡Con el mayor de los gustos, ${client.tutorHonorific}!**\n\nPara consentir a **${client.petName}** como la princesa que es ✨🐾, ¿cuál de nuestros servicios exclusivos desea agendar?\n\n1️⃣ ✂️ **Circuito Grooming Spa 7 Estaciones** (con baño relajante, ozonoterapia e hidratación de pulpejos obligatoria).\n2️⃣ 🩺 **Consulta Médica Veterinaria** (laboratorio IDEXX in-house y triaje de guardia).\n3️⃣ 🏨 **Hospedaje en Suites Bioclimáticas (Hotel VIP 5★)**.\n\n*Puede pulsar una de las opciones para abrir directamente su formulario prioritario con sus datos precargados:*`,
                        buttons: ['✂️ Abrir Reserva Grooming', '🩺 Abrir Reserva Veterinaria', '🏨 Abrir Reserva Hotel 5★'],
                        timestamp: new Date()
                    });
                    return;
                }

                const pet = this.lastActivePetName || 'tu príncipe o princesa';
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** 📅 **¡Con el mayor gusto coordinamos la reserva para ${pet}!**\n\n¿Para cuál de nuestros servicios te gustaría el turno?\n1️⃣ ✂️ **Grooming Spa** (con hidratación de pulpejos incluida)\n2️⃣ 🩺 **Consulta Médica Veterinaria**\n3️⃣ 🏨 **Hospedaje en Hotel VIP 5★**\n\nPor favor indícame la fecha y hora de tu preferencia. *Recuerda que nuestra atención en sucursal (Av. 2 El Milagro) es de Lunes a Sábado hasta las **6:00 p.m.** estrictamente*.`,
                    buttons: ['✂️ Cita Grooming Spa', '🩺 Consulta Médica', '🏨 Hotel VIP 5★'],
                    timestamp: new Date()
                });
                return;
            }

            // 2.3 Solicitud de hablar con Talibel o Administración / Equipo
            if (t.includes('talibel') || t.includes('dalybell') || t.includes('administracion') || t.includes('administración') || t.includes('equipo') || t.includes('hablar con alguien') || t.includes('gerencia') || t.includes('comite') || t.includes('comité') || t.includes('volturi')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** ¡Con todo gusto! Te comunico de inmediato con **Talibel** o con el área de **Administración y Gerencia** de Mrs. Pets ✨.\n\nHe registrado tu requerimiento prioritario. Puedes escribirme aquí mismo el detalle exacto de tu consulta para transferirlo con tu expediente, o si prefieres indícame si deseas coordinar una llamada directa con nosotros.`,
                    buttons: ['👑 Contactar a Talibel', '👑 Comité Volturi'],
                    timestamp: new Date()
                });
                return;
            }

            // 2.4 Protocolo de Ingreso: Chico Mrs. Pet
            if (t.includes('chico mrs pet') || t.includes('chico mrs. pet') || t.includes('ya soy chico') || t.includes('soy chico')) {
                this._expectingPetName = true;
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** ¡Qué alegría tenerte de regreso en casa! 🐾 En **Mrs. Pets** recibimos mascotas y despedimos amigos.\n\nPor favor facilítame el nombre de tu amado **príncipe o princesa** (o tu número telefónico de WhatsApp) para cargar de inmediato su expediente clínico y de estética. ¿En qué podemos consentirlo hoy?`,
                    timestamp: new Date()
                });
                return;
            }

            // 3. Protocolo de Ingreso: Cliente Nuevo -> Modelo de Registro Ágil y BioTracker GeoGuard (Sin Fricción)
            if (t.includes('cliente nuevo') || t.includes('nuevo cliente') || t.includes('soy nuevo') || t.includes('registro rapido') || t.includes('registrar') || t.includes('registro') || t.includes('biotracker')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** ¡Es un inmenso honor darte la bienvenida a **Mrs. Pets** (Avenida 2 El Milagro)! 👑✨\n\nPara cuidar tu privacidad, **no te pediremos direcciones exactas**. Con nuestro modelo ágil **BioTracker GeoGuard**, indícanos únicamente estas 3 variables esenciales:\n\n1️⃣ **Tu Nombre y WhatsApp** de contacto.\n2️⃣ **Nombre de tu Príncipe o Princesa** y su especie (perrito o gatito).\n3️⃣ **Sector de Maracaibo** donde resides para ingresarlo a nuestra red preventiva de salud.\n\n*(Puedes pulsar tu sector aquí abajo o escribirlo directamente)*:`,
                    buttons: ['Las Delicias', 'El Milagro', 'Bella Vista', 'Tierra Negra', 'Indio Mara', 'La Lago'],
                    timestamp: new Date()
                });
                return;
            }

            // 4. Confirmación de Sector Maracaibo (BioTracker GeoGuard)
            const sectores = ['las delicias', 'el milagro', 'bella vista', 'tierra negra', 'indio mara', 'la lago', 'delicias', 'milagro'];
            if (sectores.some(s => t.includes(s))) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** ¡Registro Ágil completado con éxito en **BioTracker GeoGuard**! 🎉👑\n\nHemos vinculado a tu consentido a nuestra red de bienestar en el sector Maracaibo bajo el estándar de excelencia de Mrs. Pets.\n\nSus datos están protegidos y ya puedes disfrutar de nuestros servicios exclusivos. Te recuerdo con orgullo que todos nuestros paquetes de estética estándar incluyen la **hidratación de pulpejos** (*hidratación de pulpejos*) incorporada como parte del paquete completo, y que nuestra atención presencial en la Avenida 2 El Milagro finaliza de manera estricta a las **6:00 p.m.**\n\n¿Deseas que coordinemos una cita de grooming spa, consulta veterinaria o suite de hotel?`,
                    buttons: ['✂️ Cita Grooming Spa', '🩺 Consulta Veterinaria', '🏨 Suite Hotel VIP'],
                    timestamp: new Date()
                });
                return;
            }

            // 5. Regla Estricta de Tratamiento: Jamás 'perros y gatos'
            if (t.includes('perro') || t.includes('perros') || t.includes('gato') || t.includes('gatos')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** 👑 **Regla de Honor en Mrs. Pets:** En nuestra casa jamás utilizamos términos genéricos como "perros y gatos"; para nosotros todos nuestros consentidos son **príncipes** y **princesas** ✨.\n\n¿En qué podemos consentir hoy a tu amado príncipe o princesa?`,
                    timestamp: new Date()
                });
                return;
            }

            // 6. Horario de Sucursal & Ubicación
            if (t.includes('horario') || t.includes('sucursal') || t.includes('direccion') || t.includes('ubicacion') || t.includes('donde estan') || t.includes('sede')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** 📍 **Sucursal & Horarios Oficiales (Mrs. Pets - Big & Little Dogs, C.A.):**\n\n• **Ubicación:** Avenida 2 El Milagro, diagonal a Lago Mall, Maracaibo, Venezuela.\n• **Horario:** Lunes a Sábado de 8:00 a.m. a 6:00 p.m. (La atención presencial en sucursal finaliza de manera estricta a las **6:00 p.m.** sin excepción).\n• **Filosofía:** *"We see pets — donde recibimos mascotas y despedimos amigos"*.`,
                    timestamp: new Date()
                });
                return;
            }

            // 7. Especificaciones de Grooming & Hidratación de Pulpejos
            if (t.includes('grooming') || t.includes('baño') || t.includes('corte') || t.includes('peluqueria') || t.includes('pulpejo') || t.includes('spa')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** ✂️ **Grooming & Spa Canino/Felino (7 Estaciones):**\n\nAclaramos con orgullo que la **hidratación de pulpejos** (*hidratación de pulpejos*) viene incorporada y forma parte del paquete completo de grooming para tu príncipe o princesa ✨.\n\nRecuerda siempre que la atención presencial en sucursal finaliza de manera estricta a las **6:00 p.m.** (de 8:00 a.m. a 6:00 p.m.).\n\n¿Deseas que reservemos la cita para tu príncipe o princesa hoy?`,
                    buttons: ['📅 Reservar Turno de Grooming', '🐾 Chico Mrs. Pet'],
                    timestamp: new Date()
                });
                return;
            }

            // 8. Multimedia & Servicios VIP
            if (t.includes('foto') || t.includes('audio') || t.includes('documento') || t.includes('camara') || t.includes('pago') || t.includes('comprobante')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** 📸🎙️📄 **Multimedia & Servicios VIP:**\n\nEstoy capacitada para recibir fotos, audios (interacción de voz natural) y documentos de los tutores para gestionar citas o validar pagos de manera automatizada bajo el estándar de excelencia de Mrs. Pets.`,
                    timestamp: new Date()
                });
                return;
            }

            // 8.1. Consulta de Boutique & Farmacia
            const isStoreSearch = t.includes('buscar') || t.includes('catalogo') || t.includes('catálogo') || t.includes('producto') || t.includes('tienda') || t.includes('boutique') || t.includes('alimento') || t.includes('comida') || t.includes('shampoo') || t.includes('collar') || t.includes('bravecto') || t.includes('nexgard') || t.includes('snack') || t.includes('juguete');
            if (isStoreSearch && window.storeEngine && Array.isArray(window.storeEngine.products) && window.storeEngine.products.length > 0) {
                const searchKeywords = t.replace(/(buscar|catalogo|catálogo|producto|tienda|boutique|en|de|la|el|los|las|un|una)\s+/gi, '').trim().split(' ').filter(w => w.length > 2);
                let matches = window.storeEngine.products;
                if (searchKeywords.length > 0) {
                    matches = window.storeEngine.products.filter(p => {
                        const pName = (p.name || '').toLowerCase();
                        const pDesc = (p.description || '').toLowerCase();
                        const pCat = (p.category || '').toLowerCase();
                        return searchKeywords.some(k => pName.includes(k) || pDesc.includes(k) || pCat.includes(k));
                    });
                }
                const results = matches.slice(0, 4);
                if (results.length > 0) {
                    const bcvRate = window.FinancialEngine ? window.FinancialEngine.getConfig().bcvRate : 48.50;
                    const itemsText = results.map(p => {
                        const priceBs = (Number(p.price || 0) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        return `• 🛍️ **${p.name}**\n  💵 **$${Number(p.price || 0).toFixed(2)} USD** (${priceBs} Bs. BCV)`;
                    }).join('\n\n');

                    this.addMessage({
                        sender: 'leia',
                        text: `🎀 **Leia:** ¡Con gusto! Aquí tienes las opciones disponibles en nuestra boutique:\n\n${itemsText}\n\n¿Deseas que te reservemos alguno para tu visita?`,
                        buttons: ['🛒 Ver Boutique Completa', '📅 Hacer una Reserva'],
                        timestamp: new Date()
                    });
                    return;
                }
            }

            if (t.includes('rrhh') || t.includes('trabaj') || t.includes('empleo') || t.includes('postul') || t.includes('vacante')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** 💼 ¡Nos encantaría que formes parte del equipo de **Mrs. Pets**!\n\nNuestra Directora de Talento Humano **Valeria** supervisa las postulaciones. Puedes registrar tu hoja de vida directamente en nuestro formulario de RRHH:\n👉 [Formulario de Postulación RRHH](#concierge-hr-recruitment-section)`,
                    buttons: ['👥 Hablar con Valeria (RRHH)'],
                    timestamp: new Date()
                });
                const el = document.getElementById('concierge-hr-recruitment-section');
                if (el && window.app) {
                    if (el.tagName === 'DETAILS') el.open = true;
                    window.app.switchTab('welcome');
                    setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 200);
                }
                return;
            }

            if (t.includes('precio') || t.includes('tasa') || t.includes('bcv') || t.includes('dolar') || t.includes('bolivar') || t.includes('costo') || t.includes('cuanto') || t.includes('cuánto')) {
                const bcvRate = window.FinancialEngine ? window.FinancialEngine.getConfig().bcvRate : 48.50;
                const formattedRate = window.FinancialEngine ? window.FinancialEngine.formatVenezuelanNumber(bcvRate) : '48,50';
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** 💵 **Precios Transparentes & Tasa Oficial BCV:**\n\nEn Mrs. Pets todas nuestras tarifas en Bolívares se calculan con exactitud matemática bajo la **Tasa Oficial del Banco Central de Venezuela (BCV)**:\n• **1 USD = ${formattedRate} Bs. (BCV)** con IVA 16.0% SENIAT debidamente respaldado.\n• Métodos Aceptados: Stripe Terminal WisePOS E, Zelle corporativo, Pago Móvil y Efectivo USD en bóveda.\n\nPuedes alternar los precios en el botón superior **[USD / Bs. BCV]**.`,
                    timestamp: new Date()
                });
                return;
            }

            if (t.includes('clinica') || t.includes('medico') || t.includes('veterinario') || t.includes('vacuna') || t.includes('procedimiento') || t.includes('idexx') || t.includes('dicom')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** 🩺 **Clínica Veterinaria Mrs. Pets (Avenida 2 El Milagro):**\n\n• **Laboratorio Clínico IDEXX in-house:** Perfil hemático y bioquímica en 15 minutos.\n• **Diagnóstico por Imagen PACS/LIS:** Visor DICOM HD en vivo y ecografía Doppler.\n• **Quirófano Especializado:** Cirugía de tejidos blandos y anestesia inhalatoria.\n• **Horario Médico:** Lunes a Sábado de 8:00 a.m. a 6:00 p.m. estrictamente.\n\n¿Deseas coordinar un turno con el veterinario de guardia?`,
                    buttons: ['🩺 Consulta Médica', '📅 Hacer una Reserva'],
                    timestamp: new Date()
                });
                return;
            }

            if (t.includes('hotel') || t.includes('guarderia') || t.includes('hospedaje')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🎀 **Leia:** 🏨 **Hotel VIP 5★ & Guardería Bioclimática:**\n\nSuites climatizadas con monitoreo 24/7 y parque recreativo libre de estrés. ¿Para qué fecha deseas hospedar a tu consentido?`,
                    buttons: ['📅 Reservar Hospedaje'],
                    timestamp: new Date()
                });
                return;
            }

            // Respuesta por defecto cálida de Leia Concierge VIP (Personalizada si el cliente está identificado)
            if (client) {
                this.addMessage({
                    sender: 'leia',
                    text: `¡Con el mayor cariño, **${client.tutorHonorific}**! Estoy a su completa disposición para consentir a **${client.petName}** como la princesa que es ✨🐾.\n\n¿En qué puedo orientarle hoy? ¿Desea hacer una reserva, consultar horarios o enlazarse con Administración?`,
                    buttons: ['📅 Deseo hacer una reserva', '✂️ Grooming & Spa VIP', '🩺 Consulta Médica', '🏨 Hotel VIP 5★', '🛍️ Tienda Boutique', '🤝 Hablar con Administración'],
                    timestamp: new Date()
                });
                return;
            }

            this.addMessage({
                sender: 'leia',
                text: `¡Hola! Soy **Leia 🎀**, ¿cómo estás hoy? ✨🐾\n\nQué alegría tenerte en **Mrs. Pets** (*\"donde recibimos mascotas y despedimos amigos\"*).\n\n¿Con quién tengo el gusto de hablar hoy y cómo podemos consentir a tu amado príncipe o princesa?\n\n*(Puedes consultarme sobre cualquiera de nuestras 4 áreas de servicio: Grooming Spa, Clínica, Hotel, Tienda, o pedirme comunicarte con Talibel y el área de Administración)*.`,
                buttons: ['🐾 Soy Cliente', '📅 Deseo una Reserva', '✂️ Grooming Spa', '🩺 Clínica Médica', '🏨 Hotel VIP 5★', '🤝 Hablar con Administración'],
                timestamp: new Date()
            });
        }
    };

    window.LeiaChatEngine = LeiaChatEngine;

})(window);
