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
                            <button type="button" class="btn-toolbar-attach" onclick="if(window.adminEngine && window.adminEngine.isEnterpriseAuthenticated && typeof window.adminEngine.openLargeCalendarModal === 'function'){window.adminEngine.openLargeCalendarModal();}else{window.LeiaChatEngine.sendUserQuickText('📅 Deseo hacer una reserva');}" style="background:rgba(16,185,129,0.15); border:1.5px solid #10B981; color:#34D399 !important; font-weight:800;" title="Deseo hacer una reserva">
                                📅 <span class="btn-label-desktop">Deseo una reserva</span>
                            </button>
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
                    engine: 'teamily',
                    text: `¡Hola! Soy **Leia 🎀**, ¿cómo estás, ${petAddress}? 🐾✨\n\nEl día de hoy, ¿cómo está, **${client.tutorHonorific}**? Qué gran alegría tenerlas en casa.\n\n¿En qué puedo orientarle hoy?`,
                    buttons: [
                        '📅 Ver Disponibilidad',
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
                    engine: 'teamily',
                    text: `¡Hola **${user.name}**! Te saluda **Leia 🎀** (Atención Ejecutiva & Staff).\n\nPuedo apoyarte con consultas administrativas, coordinación de citas o enlace con el Comité Volturi (Talibel, Manolo, Valeria, Mike, Charly). ¿En qué podemos avanzar hoy?`,
                    buttons: [
                        '📅 Calendario Grande (Staff)',
                        '📅 Ver Disponibilidad',
                        '📅 Reservas & Citas',
                        '🤝 Contactar Administración',
                        '✂️ Grooming & Spa',
                        '🏛️ Comité Volturi'
                    ],
                    timestamp: new Date()
                });
            } else {
                this.addMessage({
                    sender: 'leia',
                    engine: 'teamily',
                    text: `¡Hola! Soy **Leia 🎀** ✨🐾.\n\nQué gusto tenerte aquí. Estoy a tu completa disposición para orientarte sobre nuestro equipo, administración, servicios o resolver cualquier duda de **Mrs. Pets**.\n\n¿Con quién tengo el gusto de hablar y en qué puedo ayudarte hoy?`,
                    buttons: [
                        '📅 Ver Disponibilidad',
                        '📅 Deseo hacer una reserva',
                        '🐾 Soy Cliente',
                        '✂️ Grooming Spa',
                        '🩺 Clínica Médica',
                        '🏨 Hotel VIP 5★',
                        '🤝 Hablar con Administración'
                    ],
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

                // Regla estricta exclusiva del Avatar:
                // Teamily responde en blanco (#FFFFFF), Gemini responde en amarillo (#FDE047)
                const isGemini = isLeia && (
                    m.engine === 'gemini' || 
                    (m.model_used && String(m.model_used).toLowerCase().includes('gemini')) ||
                    m.engineColor === 'yellow'
                );
                const textColor = isLeia ? (isGemini ? '#FDE047' : '#FFFFFF') : '#FFFFFF';
                const strongColor = isLeia ? (isGemini ? '#FEF08A' : '#FFFFFF') : '#FEF08A';
                const emColor = isLeia ? (isGemini ? '#FEF08A' : '#E2E8F0') : '#E2E8F0';
                const engineClass = isLeia ? (isGemini ? 'engine-gemini' : 'engine-teamily') : '';
                const bubbleBorder = isLeia 
                    ? (isGemini ? '1.5px solid rgba(250, 204, 21, 0.65)' : '1.5px solid rgba(212, 175, 55, 0.45)') 
                    : '1.5px solid rgba(16, 185, 129, 0.5)';

                // Formateo de markdown respetando el color del motor correspondiente
                let formattedText = m.text
                    .replace(/\*\*(.*?)\*\*/g, `<strong style="color:${strongColor} !important;">$1</strong>`)
                    .replace(/\*(.*?)\*/g, `<em style="color:${emColor} !important;">$1</em>`)
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
                        <div class="chat-bubble ${isLeia ? ('leia-bubble ' + engineClass) : 'user-bubble'}" style="color:${textColor} !important; border:${bubbleBorder} !important;">
                            <div class="bubble-content" style="color:${textColor} !important;">${formattedText}</div>
                            ${attachmentHtml}
                            ${buttonsHtml}
                            ${isLeia ? `<div style="margin-top:6px;"><button type="button" class="btn-voice-leia" onclick="window.LeiaChatEngine.playVoice(this)" data-text="${encodeURIComponent(m.text)}" style="background: rgba(212,175,55,0.18); border: 1px solid rgba(212,175,55,0.4); color: #fef08a !important; border-radius: 6px; padding: 2px 7px; font-size: 0.68rem; cursor: pointer; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">🔊 Escuchar (ElevenLabs)</button></div>` : ''}
                            <div style="display:flex; justify-content:${isLeia ? 'space-between' : 'flex-end'}; align-items:center; margin-top:6px;">
                                ${isLeia ? `<span class="leia-engine-indicator" style="font-size:0.65rem; font-weight:700; color:${isGemini ? '#FDE047' : '#FFFFFF'}; opacity:0.85;">${isGemini ? '⚡ Gemini' : '🛡️ Teamily'}</span>` : ''}
                                <span class="bubble-time" style="color:#cbd5e1 !important; margin-top:0;">${timeStr}</span>
                            </div>
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
            const isStaff = this.isStaffActive();
            const user = this.getCurrentUser();
            const savedGov = localStorage.getItem('mrspets_governance_config');
            let storedGov = {};
            try { storedGov = savedGov ? JSON.parse(savedGov) : {}; } catch(e){}
            const primaryEngine = (window.agentStudio && window.agentStudio.primaryEngine) || storedGov.primaryEngine || 'teamily';
            const rawTimeout = (window.agentStudio && window.agentStudio.failoverTimeoutSeconds) || storedGov.failoverTimeout || 45;
            const timeoutSec = Math.max(Number(rawTimeout) || 45, 45);
            const messageId = 'MSG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
            const activeApprovalMode = (window.adminEngine && window.adminEngine.aiApprovalMode) || localStorage.getItem('mrs_pets_ai_approval_mode') || 'manual';

            this.showTypingIndicator(true);

            let replyObtained = null;

            // 1. CANAL PRINCIPAL: AVATAR / TEAMILEY LIVE API (Aislamiento por sesión)
            try {
                const abortCtrl = new AbortController();
                const timeoutId = setTimeout(() => abortCtrl.abort(), (timeoutSec + 15) * 1000);
                const chatSessionId = this.currentSessionId || ('sess_' + Math.random().toString(36).substring(2, 9));
                const payload = {
                    message_id: messageId,
                    agente_origen: isStaff ? 'staff' : 'user',
                    input: userText,
                    message: userText,
                    prompt: userText,
                    agent_id: 'margaret',
                    agent_slug: 'margaret',
                    sessionId: chatSessionId,
                    primaryEngine: primaryEngine,
                    timeoutSeconds: timeoutSec,
                    userName: this.tutorName || (user ? user.name : 'Cliente VIP'),
                    petName: this.lastActivePetName || '',
                    userType: isStaff ? 'staff_admin' : 'client',
                    approval_mode: activeApprovalMode,
                    context: {
                        userName: this.tutorName || (user ? user.name : 'Cliente VIP'),
                        petName: this.lastActivePetName || '',
                        userType: isStaff ? 'staff_admin' : 'client',
                        channel: 'Widget Search (Leia Concierge VIP)',
                        as_leia: true,
                        approval_mode: activeApprovalMode
                    }
                };
                payload.board_id = '5803df5a-7127-4d28-b97c-5c840d47cdc7';

                const res = await fetch('/api/v1/avatar/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-message-id': messageId
                    },
                    body: JSON.stringify(payload),
                    signal: abortCtrl.signal
                });
                clearTimeout(timeoutId);

                let engineUsed = 'teamily';
                let modelUsed = null;

                if (res.ok) {
                    const data = await res.json();
                    const rawReply = (typeof data.response_text === 'object' && data.response_text.text)
                        ? data.response_text.text
                        : (data.response_text || data.reply || (data.output && data.output.text));

                    if (rawReply && !String(rawReply).includes('serverMsgID') && String(rawReply).trim().length > 0) {
                        replyObtained = rawReply;
                        const isGem = Boolean(
                            data.failover_triggered || 
                            data.active_channel === 'gemini' || 
                            (data.model_used && String(data.model_used).toLowerCase().includes('gemini'))
                        );
                        engineUsed = isGem ? 'gemini' : 'teamily';
                        modelUsed = data.model_used || (isGem ? 'gemini-3.8-flash' : 'teamily-margaret');
                    }

                    if (data && data.booking && data.booking.id) {
                        if (window.adminEngine && typeof window.adminEngine.addPendingAppointment === 'function') {
                            window.adminEngine.addPendingAppointment(data.booking);
                        }
                    }
                }
            } catch (teamilyErr) {
                console.warn('[AvatarChatEngine] Teamily superó timeout de ' + timeoutSec + 's o falló. Activando Failover a Gemini...', teamilyErr);
            }

            // 2. FAILOVER AUTOMÁTICO: GOOGLE GEMINI BACKEND (Solo si Teamily no respondió o superó timeout)
            if (!replyObtained) {
                try {
                    const gemAbort = new AbortController();
                    const gemTimeout = setTimeout(() => gemAbort.abort(), 15000);
                    const gemMsgId = 'MSG-GEMINI-' + Date.now();
                    const gemRes = await fetch('/api/v1/leia/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-message-id': gemMsgId
                        },
                        body: JSON.stringify({
                            message_id: gemMsgId,
                            agente_origen: 'user',
                            input: userText,
                            message: userText,
                            model: 'gemini-3.8-flash',
                            agent_id: 'margaret',
                            agent_slug: 'margaret',
                            requested_slug: 'margaret',
                            agent_name: 'Margaret (actuando como Leia Concierge VIP)',
                            userName: this.tutorName || (user ? user.name : 'Cliente VIP'),
                            petName: this.lastActivePetName || '',
                            userType: isStaff ? 'staff_admin' : 'client',
                            context: {
                                userName: this.tutorName || (user ? user.name : 'Cliente VIP'),
                                petName: this.lastActivePetName || '',
                                userType: isStaff ? 'staff_admin' : 'client',
                                channel: 'Widget Search (Failover Gemini • Leia)'
                            }
                        }),
                        signal: gemAbort.signal
                    });
                    clearTimeout(gemTimeout);
                    if (gemRes.ok) {
                        const gemData = await gemRes.json();
                        const rawReply = (typeof gemData.response_text === 'object' && gemData.response_text.text)
                            ? gemData.response_text.text
                            : (gemData.response_text || gemData.reply || (gemData.output && gemData.output.text));
                        if (rawReply && !String(rawReply).includes('serverMsgID') && String(rawReply).trim().length > 0) {
                            replyObtained = rawReply;
                            engineUsed = 'gemini';
                            modelUsed = 'gemini-3.8-flash';
                        }
                    }
                } catch (gemErr) {
                    console.warn('[AvatarChatEngine] Error en Gemini fallback:', gemErr);
                }
            }

            this.showTypingIndicator(false);

            if (replyObtained) {
                const lowerUser = (userText || '').toLowerCase();
                const isBookingContext = lowerUser.includes('reserva') || lowerUser.includes('cita') || 
                                        lowerUser.includes('turno') || lowerUser.includes('agendar') || 
                                        lowerUser.includes('horario') || lowerUser.includes('baño') || 
                                        lowerUser.includes('grooming') || lowerUser.includes('clinica') ||
                                        lowerUser.includes('hotel');
                let dynamicButtons = null;
                if (isBookingContext) {
                    dynamicButtons = [
                        '✂️ Cita Grooming Spa',
                        '🩺 Consulta Veterinaria',
                        '🏨 Suite Hotel VIP 5★',
                        '📅 Ver Disponibilidad'
                    ];
                }

                this.addMessage({
                    sender: 'leia',
                    text: replyObtained,
                    buttons: dynamicButtons,
                    engine: engineUsed,
                    model_used: modelUsed,
                    timestamp: new Date()
                });
            } else {
                this.addMessage({
                    sender: 'system',
                    text: '🐾 **Canal de Atención Mrs. Pets:**\n\nEn este momento no puedo completar tu consulta. Para no hacerte esperar, escríbenos directamente por WhatsApp al [+58 414-6799510](https://wa.me/584146799510) o visítanos en sucursal en **Avenida 2 El Milagro** — te atendemos de inmediato. Tu princesa o príncipe no se queda sin atención. ✨🐾',
                    buttons: ['💬 Contactar por WhatsApp', '📍 Ver Sucursal El Milagro', '✂️ Catálogo de Servicios'],
                    timestamp: new Date()
                });
            }
        }
    };

    window.LeiaChatEngine = LeiaChatEngine;

})(window);
