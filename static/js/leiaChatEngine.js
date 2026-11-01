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

        getCurrentUser() {
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
                <!-- BOTÓN FLOTANTE DISCRETO (FAB: LEIA CON SEARCH) -->
                <button type="button" id="leia-chat-fab" class="leia-chat-fab" onclick="window.LeiaChatEngine.toggleChat();" title="Consultar con Leia Concierge & IA">
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
                                <h4 class="leia-header-title">Leia Concierge VIP *</h4>
                                <span class="leia-header-role" id="leia-header-role-badge">Atención a Clientes & Orquestador IA</span>
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

                    <!-- Feed de Mensajes -->
                    <div id="leia-chat-messages" class="leia-chat-messages">
                        <!-- Mensajes inyectados dinámicamente -->
                    </div>

                    <!-- Indicador de Escribiendo... -->
                    <div id="leia-typing-indicator" class="leia-typing-indicator" style="display:none;">
                        <span class="typing-text">Leia está procesando...</span>
                        <div class="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>

                    <!-- Área de Previsualización de Adjunto -->
                    <div id="leia-attachment-preview-box" class="leia-attachment-preview-box" style="display:none;">
                        <div class="preview-file-info">
                            <span id="leia-preview-icon" class="preview-icon">📎</span>
                            <div class="preview-meta">
                                <strong id="leia-preview-name" class="preview-name">archivo.pdf</strong>
                                <small id="leia-preview-size" class="preview-size">0 KB</small>
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
                            <input type="text" id="leia-chat-text-input" class="leia-chat-text-input" placeholder="Escribe a Leia Concierge..." autocomplete="off">
                            <button type="submit" id="btn-leia-send" class="btn-leia-send" title="Enviar">
                                ➔
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
            // Sincronizar rol cuando cambia el estado de auth
            window.addEventListener('auth_state_changed', () => {
                this.updateRoleView();
            });
        },

        toggleChat() {
            this.isOpen = !this.isOpen;
            const drawer = document.getElementById('leia-chat-drawer');
            const fab = document.getElementById('leia-chat-fab');

            if (drawer) {
                drawer.style.display = this.isOpen ? 'flex' : 'none';
                if (this.isOpen) {
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
            const user = this.getCurrentUser();

            if (roleBadge) {
                if (isStaff) {
                    roleBadge.innerHTML = `<span class="badge-role-staff">👑 Staff Operativo (${user.name})</span>`;
                } else {
                    roleBadge.innerHTML = `<span>Asistente Ejecutiva & Concierge VIP • Av. 2 El Milagro</span>`;
                }
            }
        },

        loadInitialGreeting() {
            if (this.messages.length > 0) return;

            const isStaff = this.isStaffActive();
            const user = this.getCurrentUser();

            if (isStaff) {
                this.addMessage({
                    sender: 'leia',
                    text: `¡Hola **${user.name}**! Modo Staff Administrativo Activo 👑.\n\nPuedes consultar datos de la plataforma o adjuntar:\n• **Audios de reuniones** (extraigo actas, directrices y creo tareas en **Teamly** con enrutamiento al Archivo Muerto Digital).\n• **Facturas / Comprobantes** (custodia permanente fiscal SENIAT).\n• **Catálogo** y precios oficiales.`,
                    timestamp: new Date()
                });
            } else {
                this.addMessage({
                    sender: 'leia',
                    text: `¡Hola! Soy **Leia**, asistente ejecutiva y Concierge VIP de **Mrs. Pets** (Big & Little Dogs, C.A.), ubicado en la Avenida 2 El Milagro, Maracaibo ✨🐾.\n\nNuestra filosofía: *"We see pets — donde recibimos mascotas y despedimos amigos"*.\n\nPara brindarte la mejor atención a ti y a tu príncipe o princesa:\n**¿Ya eres un "chico Mrs. Pet" o eres un cliente nuevo?**`,
                    buttons: ['🐾 Ya soy un Chico Mrs. Pet', '✨ Soy Cliente Nuevo (Registro Rápido)'],
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
            const container = document.getElementById('leia-chat-messages');
            if (!container) return;

            container.innerHTML = this.messages.map(m => {
                const isLeia = m.sender === 'leia';
                const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Formateo simple de markdown
                let formattedText = m.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br>');

                let attachmentHtml = '';
                if (m.attachment) {
                    attachmentHtml = `
                        <div class="chat-attachment-pill">
                            <span class="attach-icon">${m.attachment.icon}</span>
                            <div class="attach-meta">
                                <strong>${m.attachment.name}</strong>
                                <small>${m.attachment.size}</small>
                            </div>
                        </div>
                    `;
                }

                let buttonsHtml = '';
                if (Array.isArray(m.buttons) && m.buttons.length > 0) {
                    buttonsHtml = `
                        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                            ${m.buttons.map(b => `<button type="button" class="btn btn-sm" style="background:#070a11; border:1px solid #D4AF37; color:#fef08a; font-size:0.75rem; border-radius:12px; padding:4px 10px; cursor:pointer; font-weight:700;" onclick="window.LeiaChatEngine.sendUserQuickText('${b.replace(/'/g, "\\'")}')">${b}</button>`).join('')}
                        </div>
                    `;
                }

                return `
                    <div class="chat-bubble-row ${isLeia ? 'leia-row' : 'user-row'}">
                        ${isLeia ? '<img src="assets/leia_avatar.jpg" alt="Leia" class="bubble-avatar">' : ''}
                        <div class="chat-bubble ${isLeia ? 'leia-bubble' : 'user-bubble'}">
                            <div class="bubble-content">${formattedText}</div>
                            ${attachmentHtml}
                            ${buttonsHtml}
                            <span class="bubble-time">${timeStr}</span>
                        </div>
                    </div>
                `;
            }).join('');
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

        generateAssistantReply(userText) {
            const t = (userText || '').toLowerCase();

            // 1. Protocolo de Ingreso: Chico Mrs. Pet
            if (t.includes('chico mrs pet') || t.includes('chico mrs. pet') || t.includes('ya soy chico') || t.includes('soy chico')) {
                this.addMessage({
                    sender: 'leia',
                    text: `¡Qué alegría tenerte de regreso en casa! 🐾 En **Mrs. Pets** recibimos mascotas y despedimos amigos.\n\nPor favor facilítame el nombre de tu amado **príncipe o princesa** (o tu número telefónico) para cargar de inmediato su expediente clínico y de estética. ¿En qué podemos consentirlo hoy?`,
                    timestamp: new Date()
                });
                return;
            }

            // 2. Protocolo de Ingreso: Cliente Nuevo -> Modelo de Registro Ágil y BioTracker GeoGuard (Sin Fricción)
            if (t.includes('cliente nuevo') || t.includes('nuevo cliente') || t.includes('soy nuevo') || t.includes('registro rapido') || t.includes('registrar') || t.includes('registro')) {
                this.addMessage({
                    sender: 'leia',
                    text: `¡Es un inmenso honor darte la bienvenida a **Mrs. Pets** (Avenida 2 El Milagro)! 👑✨\n\nPara evitar que te aburras o sientas invasión a tu privacidad, **no te pediremos direcciones exactas**. Con nuestro modelo ágil **BioTracker GeoGuard**, indícanos únicamente estas 3 variables esenciales:\n\n1️⃣ **Tu Nombre y WhatsApp** de contacto.\n2️⃣ **Nombre de tu Príncipe o Princesa** y su especie (perrito o gatito).\n3️⃣ **Sector de Maracaibo** donde resides para ingresarlo a nuestra red preventiva de salud y alertas epidemiológicas.\n\n*(Puedes pulsar tu sector aquí abajo o escribirlo directamente)*:`,
                    buttons: ['Las Delicias', 'El Milagro', 'Bella Vista', 'Tierra Negra', 'Indio Mara', 'La Lago'],
                    timestamp: new Date()
                });
                return;
            }

            // 3. Confirmación de Sector Maracaibo (BioTracker GeoGuard)
            const sectores = ['las delicias', 'el milagro', 'bella vista', 'tierra negra', 'indio mara', 'la lago', 'delicias', 'milagro'];
            if (sectores.some(s => t.includes(s))) {
                this.addMessage({
                    sender: 'leia',
                    text: `¡Registro Ágil completado con éxito en **BioTracker GeoGuard**! 🎉👑\n\nHemos vinculado a tu príncipe/princesa a nuestra red preventiva de salud en el sector Maracaibo bajo el estándar de excelencia del Comité Volturi.\n\nSus datos están protegidos y ya puedes disfrutar de nuestros servicios exclusivos. Te recordamos con orgullo que todos nuestros paquetes de estética estándar incluyen con orgullo la **hidratación de pulpejos** (*hidratación de pulpejos*) incorporada como parte del paquete completo, y que nuestra atención presencial en la Avenida 2 El Milagro finaliza de manera estricta a las **6:00 p.m.**\n\n¿Deseas que coordinemos una cita de grooming, clínica o suite de hotel para consentirlo?`,
                    timestamp: new Date()
                });
                return;
            }

            // 4. Regla Estricta de Tratamiento: Jamás 'perros y gatos'
            if (t.includes('perro') || t.includes('perros') || t.includes('gato') || t.includes('gatos')) {
                this.addMessage({
                    sender: 'leia',
                    text: `👑 **Regla de Honor en Mrs. Pets:** En nuestra casa jamás utilizamos términos genéricos como "perros y gatos"; para nosotros todos nuestros consentidos son **príncipes** y **princesas** ✨.\n\n¿En qué podemos consentir hoy a tu amado príncipe o princesa?`,
                    timestamp: new Date()
                });
                return;
            }

            // 5. Horario de Sucursal & Ubicación
            if (t.includes('horario') || t.includes('sucursal') || t.includes('direccion') || t.includes('ubicacion') || t.includes('donde estan') || t.includes('sede')) {
                this.addMessage({
                    sender: 'leia',
                    text: `📍 **Sucursal & Horarios Oficiales (Mrs. Pets - Big & Little Dogs, C.A.):**\n\n• **Ubicación:** Avenida 2 El Milagro, Maracaibo, Venezuela.\n• **Horario:** Lunes a Sábado de 8:00 a.m. a 6:00 p.m. (La atención presencial en sucursal finaliza de manera estricta a las **6:00 p.m.** sin excepción).\n• **Filosofía Institucional:** *"We see pets — donde recibimos mascotas y despedimos amigos"*.`,
                    timestamp: new Date()
                });
                return;
            }

            // 6. Especificaciones de Grooming & Hidratación de Pulpejos
            if (t.includes('grooming') || t.includes('baño') || t.includes('corte') || t.includes('peluqueria') || t.includes('pulpejo') || t.includes('spa')) {
                this.addMessage({
                    sender: 'leia',
                    text: `✂️ **Grooming & Spa Canino/Felino (7 Estaciones):**\n\nAclaramos con orgullo que la **hidratación de pulpejos** (*hidratación de pulpejos*) viene incorporada y forma parte del paquete completo de grooming para tu príncipe o princesa ✨.\n\nRecuerda siempre que la atención presencial en sucursal finaliza de manera estricta a las **6:00 p.m.** (de 8:00 a.m. a 6:00 p.m.).\n\n¿Deseas que reservemos la cita para tu príncipe o princesa?`,
                    timestamp: new Date()
                });
                return;
            }

            // 7. Multimedia & Servicios VIP
            if (t.includes('foto') || t.includes('audio') || t.includes('documento') || t.includes('camara') || t.includes('pago') || t.includes('comprobante')) {
                this.addMessage({
                    sender: 'leia',
                    text: `📸🎙️📄 **Multimedia & Servicios VIP:**\n\nEstoy capacitada para recibir fotos, audios (interacción de voz natural) y documentos de los clientes para gestionar reservaciones, citas o validar pagos de manera automatizada.\n\nMantenemos siempre el estándar de lujo y eficiencia que caracteriza al **Comité Volturi de Mrs. Pets**.`,
                    timestamp: new Date()
                });
                return;
            }

            if (t.includes('rrhh') || t.includes('trabaj') || t.includes('empleo') || t.includes('postul') || t.includes('vacante')) {
                this.addMessage({
                    sender: 'leia',
                    text: `💼 ¡Nos encantaría que formes parte del equipo de **Mrs. Pets**!\n\nPuedes enviar tu postulación directamente en nuestro portal de talento humano. Haz clic aquí para ir al formulario:\n👉 [Formulario de Postulación RRHH](#concierge-hr-recruitment-section)`,
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

            if (t.includes('precio') || t.includes('tasa') || t.includes('bcv') || t.includes('dolar') || t.includes('bolivar')) {
                const bcvRate = window.FinancialEngine ? window.FinancialEngine.getConfig().bcvRate : 48.50;
                const formattedRate = window.FinancialEngine ? window.FinancialEngine.formatVenezuelanNumber(bcvRate) : '48,50';
                this.addMessage({
                    sender: 'leia',
                    text: `⚖️ **Información Financiera Oficial:**\n\nNuestras operaciones se rigen estrictamente por la **Tasa Oficial del Banco Central de Venezuela (BCV)**:\n• **1 USD = ${formattedRate} Bs. (BCV)**\n• Alícuota de IVA: **16.0%** (SENIAT).\n\nPuedes alternar los precios de la tienda en el botón superior **[USD / Bs. BCV]**.`,
                    timestamp: new Date()
                });
                return;
            }

            if (t.includes('clinica') || t.includes('medico') || t.includes('veterinario') || t.includes('vacuna')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🩺 **Clínica Veterinaria Mrs. Pets (Avenida 2 El Milagro):**\n\nContamos con dirección médica del Dr. Alejandro Morales y la Dra. Patricia Silva, quirófano bioclimático y laboratorio clínico IDEXX in-house. Atendemos de Lunes a Sábado hasta las 6:00 p.m. estrictamente.`,
                    timestamp: new Date()
                });
                return;
            }

            if (t.includes('hotel') || t.includes('guarderia') || t.includes('hospedaje')) {
                this.addMessage({
                    sender: 'leia',
                    text: `🏨 **Hotel & Guardería VIP 5 Estrellas:**\n\nSuites bioclimáticas con cámaras web en vivo, supervisión 24/7 y nutrición premium. Puedes hacer tu reserva con antelación en el portal.`,
                    timestamp: new Date()
                });
                return;
            }

            // Respuesta por defecto exclusiva
            this.addMessage({
                sender: 'leia',
                text: `¡Hola! Soy **Leia**, asistente ejecutiva y Concierge VIP de **Mrs. Pets** (Big & Little Dogs, C.A.), ubicado en la Avenida 2 El Milagro, Maracaibo ✨🐾.\n\nNuestra filosofía: *"We see pets — donde recibimos mascotas y despedimos amigos"*.\n\nPara atenderte con la mayor exclusividad:\n**¿Ya eres un "chico Mrs. Pet" o eres un cliente nuevo?**`,
                buttons: ['🐾 Ya soy un Chico Mrs. Pet', '✨ Soy Cliente Nuevo (Registro Rápido)'],
                timestamp: new Date()
            });
        }
    };

    window.LeiaChatEngine = LeiaChatEngine;

})(window);
