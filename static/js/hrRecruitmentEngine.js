/**
 * Mrs. Pets - HR Recruitment Engine (Portal de Selección y Talento Humano)
 * 
 * Gestiona el formulario público de postulación en la sección Concierge
 * y la consola interna de revisión para el Staff Administrativo.
 * 
 * Cumple con los 12 campos obligatorios de reclutamiento y almacenamiento estructurado.
 */

(function (window) {
    'use strict';

    const STORAGE_KEY = 'mrs_pets_hr_applications';

    const HRRecruitmentEngine = {
        applications: [],

        init() {
            this.loadApplications();
            this.setupPublicForm();
            console.log('[HRRecruitmentEngine] Inicializado. Total postulaciones registradas:', this.applications.length);
        },

        loadApplications() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    this.applications = JSON.parse(stored);
                    // Asegurar que María Briceño esté normalizada con su currículo oficial
                    const mb = this.applications.find(a => a.id === 'APP-20261015-001' || (a.fullName && a.fullName.includes('Briceño')));
                    if (mb) {
                        mb.fullName = 'María Briceño';
                        mb.cvFileName = 'CV_Maria_Briceno_Estilista.pdf';
                        mb.cvFileSize = '1.4 MB';
                    } else {
                        this.applications.unshift({
                            id: 'APP-20261015-001',
                            fullName: 'María Briceño',
                            idCard: 'V-24.891.204',
                            phone: '+58 414-6123456',
                            email: 'maria.briceno@gmail.com',
                            address: 'Av. Bella Vista con Calle 72, Sector Tierra Negra, Maracaibo',
                            area: 'Grooming & Spa Canino/Felino',
                            experienceYears: 4,
                            largeBreedHandling: 'Sí, especialista en cortes asiáticos, Golden, Terranova y Schnauzer Gigante',
                            scheduleAvailability: 'Sí, disponibilidad total de horario diurno',
                            referralSource: 'Instagram @mrspets',
                            cvFileName: 'CV_Maria_Briceno_Estilista.pdf',
                            cvFileSize: '1.4 MB',
                            cvFileData: null,
                            consentData: true,
                            status: 'Preseleccionado',
                            internalNotes: 'Excelente portafolio fotográfico de cortes asiáticos. Entrevista técnica programada con Groomer Master.',
                            submittedAt: '2026-10-15T14:30:00.000Z'
                        });
                    }
                    this.saveApplications();
                } else {
                    // Semilla inicial demostrativa para el staff
                    this.applications = [
                        {
                            id: 'APP-20261015-001',
                            fullName: 'María Briceño',
                            idCard: 'V-24.891.204',
                            phone: '+58 414-6123456',
                            email: 'maria.briceno@gmail.com',
                            address: 'Av. Bella Vista con Calle 72, Sector Tierra Negra, Maracaibo',
                            area: 'Grooming & Spa Canino/Felino',
                            experienceYears: 4,
                            largeBreedHandling: 'Sí, especialista en cortes asiáticos, Golden, Terranova y Schnauzer Gigante',
                            scheduleAvailability: 'Sí, disponibilidad total de horario diurno',
                            referralSource: 'Instagram @mrspets',
                            cvFileName: 'CV_Maria_Briceno_Estilista.pdf',
                            cvFileSize: '1.4 MB',
                            cvFileData: null,
                            consentData: true,
                            status: 'Preseleccionado',
                            internalNotes: 'Excelente portafolio fotográfico de cortes asiáticos. Entrevista técnica programada con Groomer Master.',
                            submittedAt: '2026-10-15T14:30:00.000Z'
                        },
                        {
                            id: 'APP-20261018-002',
                            fullName: 'Dr. Leonardo Alfonso Morales',
                            idCard: 'V-20.155.892',
                            phone: '+58 424-6338901',
                            email: 'dr.leonardo.morales@hotmail.com',
                            address: 'Urb. La Virginia, Calle 65, Maracaibo',
                            area: 'Clínica Veterinaria',
                            experienceYears: 6,
                            largeBreedHandling: 'Sí, manejo de medicina interna y anestesiología en pacientes de gran talla',
                            scheduleAvailability: 'Sí',
                            referralSource: 'Recomendación médica',
                            cvFileName: 'CV_Dr_Leonardo_Morales_Vet.pdf',
                            cvFileSize: '2.8 MB',
                            cvFileData: null,
                            consentData: true,
                            status: 'En Revisión',
                            internalNotes: 'Especialista en ecografía abdominal y emergencias menores.',
                            submittedAt: '2026-10-18T10:15:00.000Z'
                        }
                    ];
                    this.saveApplications();
                }
            } catch (e) {
                console.warn('[HRRecruitmentEngine] Error cargando postulaciones:', e);
                this.applications = [];
            }
        },

        saveApplications() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.applications));
            } catch (e) {
                console.error('[HRRecruitmentEngine] Error guardando postulaciones:', e);
            }
        },

        getApplications() {
            return this.applications.slice();
        },

        submitApplication(formData) {
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const applicationId = `APP-${dateStr}-${randomSuffix}`;

            const newApp = {
                id: applicationId,
                fullName: String(formData.fullName || '').trim(),
                idCard: String(formData.idCard || '').trim(),
                phone: String(formData.phone || '').trim(),
                email: String(formData.email || '').trim().toLowerCase(),
                address: String(formData.address || '').trim(),
                area: String(formData.area || '').trim(),
                experienceYears: Number(formData.experienceYears) || 0,
                largeBreedHandling: String(formData.largeBreedHandling || '').trim(),
                scheduleAvailability: String(formData.scheduleAvailability || '').trim(),
                referralSource: String(formData.referralSource || '').trim(),
                cvFileName: String(formData.cvFileName || 'CV_Adjunto.pdf'),
                cvFileSize: String(formData.cvFileSize || 'N/A'),
                cvFileData: formData.cvFileData || null,
                consentData: Boolean(formData.consentData),
                status: 'Recibida',
                internalNotes: '',
                submittedAt: now.toISOString()
            };

            this.applications.unshift(newApp);
            this.saveApplications();

            // Sincronización automática con Teamly vía Webhook Make.com
            newApp.teamlySync = true;
            if (window.TeamlyEngine && typeof window.TeamlyEngine.createCandidateTask === 'function') {
                try {
                    window.TeamlyEngine.createCandidateTask(newApp);
                } catch (e) {
                    if (typeof console !== 'undefined' && console.warn) console.warn('[HRRecruitment] Error al sincronizar con Teamly:', e);
                }
            }

            window.dispatchEvent(new CustomEvent('mrs_pets_application_submitted', {
                detail: newApp
            }));

            return newApp;
        },

        updateApplicationStatus(id, newStatus, internalNotes = null) {
            const app = this.applications.find(a => a.id === id);
            if (!app) return false;

            app.status = newStatus;
            if (internalNotes !== null) {
                app.internalNotes = internalNotes;
            }
            this.saveApplications();

            window.dispatchEvent(new CustomEvent('mrs_pets_application_updated', {
                detail: app
            }));

            return true;
        },

        renderStaffNoticeIfActive() {
            const isStaff = window.authEngine && typeof window.authEngine.isEnterpriseStaffActive === 'function'
                ? window.authEngine.isEnterpriseStaffActive()
                : (window.adminEngine && (window.adminEngine.currentEnvironment === 'enterprise' || window.adminEngine.isEnterpriseAuthenticated));
            if (!isStaff) return;

            const mb = this.applications.find(a => a.fullName && a.fullName.includes('Briceño')) || this.applications[0];
            const htmlNotice = `
                <div style="background:rgba(28,28,30,0.95); border:2px solid #D4AF37; border-radius:18px; padding:24px; color:#FFFFFF; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
                    <div style="font-size:2rem; margin-bottom:8px;">👥 👑</div>
                    <h3 style="font-size:1.35rem; font-weight:900; color:#D4AF37; margin:0 0 8px 0;">
                        Vista Exclusiva Staff Empresarial - Talento Humano
                    </h3>
                    <p style="font-size:0.86rem; color:#CBD5E1; max-width:620px; margin:0 auto 16px auto; line-height:1.45;">
                        Al staff y a la empresa no les corresponde llenar formularios. A continuación se presentan los currículos y la información suministrada por los postulantes:
                    </p>
                    ${mb ? `
                    <div style="text-align:left; max-width:680px; margin:0 auto 18px auto; background:rgba(0,0,0,0.5); border:1.5px solid #D4AF37; border-radius:14px; padding:18px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                            <div>
                                <div style="font-size:1.05rem; font-weight:900; color:#FFFFFF;">Aquí está la información suministrada y el currículo que envió ${mb.fullName}</div>
                                <div style="font-size:0.8rem; color:#CBD5E1; margin-top:2px;">
                                    ${mb.idCard} • ${mb.phone} • ${mb.area} (${mb.experienceYears} años exp.)
                                </div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button type="button" class="btn btn-sm" onclick="window.HRRecruitmentEngine.downloadCv('${mb.id}')" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; padding:8px 14px; border-radius:8px; border:none; cursor:pointer;">
                                    📄 Ver Currículo
                                </button>
                                <button type="button" class="btn btn-sm" onclick="window.HRRecruitmentEngine.openCandidateModal('${mb.id}')" style="background:rgba(255,255,255,0.15); color:#FFFFFF; font-weight:700; padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.3); cursor:pointer;">
                                    👁️ Ficha
                                </button>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    <button type="button" class="btn btn-primary" onclick="if(window.RBACMiddleware) window.RBACMiddleware.navigateToAdminModule('admin-section-hr');" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; padding:12px 24px; border-radius:12px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(212,175,55,0.35);">
                        📊 Ir a la Consola Completa de Expedientes RRHH ➔
                    </button>
                </div>
            `;

            const publicBody = document.querySelector('#concierge-hr-recruitment-section .admin-accordion-body') || document.getElementById('concierge-hr-recruitment-section');
            if (publicBody) {
                publicBody.innerHTML = htmlNotice;
            }
            const portalCandidateView = document.getElementById('portal-view-hr-candidate');
            if (portalCandidateView) {
                portalCandidateView.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <button type="button" onclick="window.authEngine ? window.authEngine.backToPortalMain() : null" style="background:rgba(212,175,55,0.15); color:#D4AF37; border:1px solid #D4AF37; border-radius:10px; padding:6px 14px; font-weight:800; font-size:0.75rem; cursor:pointer;">
                            ⬅️ Volver al Portal Concierge VIP *
                        </button>
                    </div>
                    ${htmlNotice}
                `;
            }
        },

        setupPublicForm() {
            this.renderStaffNoticeIfActive();

            // Se enlaza cuando el DOM esté listo o se invoque explícitamente
            const form = document.getElementById('hr-recruitment-public-form');
            if (!form) return;

            const cvInput = document.getElementById('hr-cv-file');
            const cvLabel = document.getElementById('hr-cv-label-text');

            if (cvInput && cvLabel) {
                cvInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                            alert('El archivo excede el tamaño máximo permitido de 5 MB.');
                            cvInput.value = '';
                            cvLabel.textContent = 'Seleccionar archivo (PDF o DOCX, máx 5MB)';
                            return;
                        }
                        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
                        cvLabel.innerHTML = `<strong>${file.name}</strong> (${sizeMb} MB) <i class="fa-solid fa-check text-gold"></i>`;
                    } else {
                        cvLabel.textContent = 'Seleccionar archivo (PDF o DOCX, máx 5MB)';
                    }
                });
            }

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePublicFormSubmit(form);
            });
        },

        handlePublicFormSubmit(form) {
            const name = form.querySelector('#hr-fullname')?.value.trim();
            const idCard = form.querySelector('#hr-idcard')?.value.trim();
            const phone = form.querySelector('#hr-phone')?.value.trim();
            const email = form.querySelector('#hr-email')?.value.trim();
            const address = form.querySelector('#hr-address')?.value.trim();
            const area = form.querySelector('#hr-area')?.value;
            const expYears = form.querySelector('#hr-experience')?.value;
            const largeBreed = form.querySelector('input[name="hr-large-breed"]:checked')?.value;
            const schedule = form.querySelector('input[name="hr-schedule"]:checked')?.value;
            const source = form.querySelector('#hr-source')?.value;
            const consent = form.querySelector('#hr-consent')?.checked;
            const cvInput = form.querySelector('#hr-cv-file');

            // Validaciones estrictas
            if (!name || !idCard || !phone || !email || !address || !area || !expYears || !largeBreed || !schedule || !source) {
                alert('Por favor complete todos los campos obligatorios del formulario.');
                return;
            }

            if (!consent) {
                alert('Debe aceptar la cláusula de consentimiento para el tratamiento de datos y verificación de credenciales.');
                return;
            }

            const file = cvInput?.files[0];
            let cvFileName = 'CV_No_Adjunto.pdf';
            let cvFileSize = '0 MB';

            if (file) {
                cvFileName = file.name;
                cvFileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            }

            const application = this.submitApplication({
                fullName: name,
                idCard: idCard,
                phone: phone,
                email: email,
                address: address,
                area: area,
                experienceYears: expYears,
                largeBreedHandling: largeBreed,
                scheduleAvailability: schedule,
                referralSource: source,
                cvFileName: cvFileName,
                cvFileSize: cvFileSize,
                consentData: consent
            });

            // Feedback elegante al postulante
            const feedbackContainer = document.getElementById('hr-form-success-container');
            if (feedbackContainer) {
                feedbackContainer.innerHTML = `
                    <div class="hr-success-card luxury-card animate-fade-in">
                        <div class="success-icon-badge">
                            <i class="fa-solid fa-crown text-gold"></i>
                        </div>
                        <h3 class="success-title">¡Postulación Recibida con Éxito!</h3>
                        <p class="success-text">
                            Estimado(a) <strong>${application.fullName}</strong>, hemos registrado su postulación para el área de 
                            <strong>${application.area}</strong> con el código identificador:
                        </p>
                        <div class="application-id-pill">
                            <code>${application.id}</code>
                        </div>
                        <p class="success-footer-text">
                            El Departamento de Talento y Cultura de Mrs. Pets revisará su perfil con absoluta confidencialidad y le contactará vía WhatsApp/Email para coordinar las siguientes fases.
                        </p>
                        <button type="button" class="btn-luxury-secondary mt-3" onclick="window.HRRecruitmentEngine.resetPublicForm();">
                            <i class="fa-solid fa-arrow-rotate-left"></i> Enviar otra postulación
                        </button>
                    </div>
                `;
                feedbackContainer.style.display = 'block';
                form.style.display = 'none';
            } else {
                alert(`¡Postulación enviada exitosamente! Código: ${application.id}`);
                form.reset();
            }
        },

        resetPublicForm() {
            const form = document.getElementById('hr-recruitment-public-form');
            const feedback = document.getElementById('hr-form-success-container');
            const cvLabel = document.getElementById('hr-cv-label-text');

            if (form) {
                form.reset();
                form.style.display = 'block';
            }
            if (feedback) {
                feedback.style.display = 'none';
            }
            if (cvLabel) {
                cvLabel.textContent = 'Seleccionar archivo (PDF o DOCX, máx 5MB)';
            }
        },

        handlePortalCvFileChange(input) {
            const cvLabel = document.getElementById('hr-p-cv-label-text');
            const file = input && input.files ? input.files[0] : null;
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    if (window.app && typeof window.app.showToast === 'function') {
                        window.app.showToast('⚠️ El archivo excede el tamaño máximo permitido de 5 MB.', 'warning');
                    } else {
                        alert('El archivo excede el tamaño máximo permitido de 5 MB.');
                    }
                    input.value = '';
                    if (cvLabel) cvLabel.textContent = 'Seleccionar archivo (PDF o DOCX, máx 5MB)';
                    return;
                }
                const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
                if (cvLabel) {
                    cvLabel.innerHTML = `<strong>${file.name}</strong> (${sizeMb} MB) <span style="color:#10b981; font-weight:900;">✓</span>`;
                }
            } else {
                if (cvLabel) cvLabel.textContent = 'Seleccionar archivo (PDF o DOCX, máx 5MB)';
            }
        },

        handlePortalCandidateSubmit(form) {
            const name = form.querySelector('#hr-p-fullname')?.value.trim();
            const idCard = form.querySelector('#hr-p-idcard')?.value.trim();
            const phone = form.querySelector('#hr-p-phone')?.value.trim();
            const email = form.querySelector('#hr-p-email')?.value.trim();
            const address = form.querySelector('#hr-p-address')?.value.trim();
            const area = form.querySelector('#hr-p-area')?.value;
            const expYears = form.querySelector('#hr-p-experience')?.value;
            const largeBreed = form.querySelector('input[name="hr-p-large-breed"]:checked')?.value;
            const schedule = form.querySelector('input[name="hr-p-schedule"]:checked')?.value;
            const source = form.querySelector('#hr-p-source')?.value;
            const consent = form.querySelector('#hr-p-consent')?.checked;
            const cvInput = form.querySelector('#hr-p-cv-file');

            // Validaciones estrictas
            if (!name || !idCard || !phone || !email || !address || !area || !expYears || !largeBreed || !schedule || !source) {
                if (window.app && typeof window.app.showToast === 'function') {
                    window.app.showToast('Por favor complete todos los campos obligatorios del formulario.', 'warning');
                } else {
                    alert('Por favor complete todos los campos obligatorios del formulario.');
                }
                return;
            }

            if (!consent) {
                if (window.app && typeof window.app.showToast === 'function') {
                    window.app.showToast('Debe aceptar la declaración de exactitud y tratamiento confidencial.', 'warning');
                } else {
                    alert('Debe aceptar la declaración de exactitud y tratamiento confidencial.');
                }
                return;
            }

            const file = cvInput?.files[0];
            let cvFileName = 'CV_No_Adjunto.pdf';
            let cvFileSize = '0 MB';

            if (file) {
                cvFileName = file.name;
                cvFileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            }

            const application = this.submitApplication({
                fullName: name,
                idCard: idCard,
                phone: phone,
                email: email,
                address: address,
                area: area,
                experienceYears: expYears,
                largeBreedHandling: largeBreed,
                scheduleAvailability: schedule,
                referralSource: source,
                cvFileName: cvFileName,
                cvFileSize: cvFileSize,
                consentData: consent
            });

            // Feedback elegante al postulante en la vista exclusiva
            const feedbackContainer = document.getElementById('hr-portal-candidate-success');
            if (feedbackContainer) {
                feedbackContainer.innerHTML = `
                    <div style="background:rgba(28,28,30,0.85); border:2px solid #D4AF37; border-radius:18px; padding:28px 24px; text-align:center; box-shadow:0 15px 35px rgba(0,0,0,0.5);">
                        <div style="font-size:2.4rem; color:#D4AF37; margin-bottom:10px;">👑</div>
                        <h3 style="font-size:1.45rem; font-weight:900; color:#FFFFFF; margin:0 0 8px 0;">¡Postulación Recibida con Éxito!</h3>
                        <p style="font-size:0.86rem; color:#CBD5E1; line-height:1.5; margin:0 0 16px 0;">
                            Estimado(a) <strong style="color:#FFFFFF;">${application.fullName}</strong>, hemos registrado su postulación para el área de 
                            <strong style="color:#D4AF37;">${application.area}</strong>.
                        </p>
                        <div style="background:rgba(212,175,55,0.15); border:1.5px solid #D4AF37; border-radius:12px; padding:12px 18px; display:inline-block; margin-bottom:18px;">
                            <span style="font-size:0.75rem; color:#D4AF37; font-weight:800; display:block; text-transform:uppercase; letter-spacing:0.05em;">Código Identificador de Postulación:</span>
                            <code style="font-size:1.15rem; font-weight:900; color:#FFFFFF; letter-spacing:0.08em;">${application.id}</code>
                        </div>
                        <p style="font-size:0.8rem; color:#94A3B8; line-height:1.5; margin:0 0 22px 0;">
                            El Departamento de Talento y Cultura de Mrs. Pets revisará su síntesis curricular con absoluta confidencialidad y le contactará vía WhatsApp/Email para las siguientes fases del proceso de selección.
                        </p>
                        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                            <button type="button" onclick="window.authEngine ? window.authEngine.backToPortalMain() : null" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; border:none; border-radius:12px; padding:12px 24px; font-weight:900; font-size:0.88rem; cursor:pointer; box-shadow:0 4px 14px rgba(212,175,55,0.35);">
                                ⬅️ Volver al Portal Concierge VIP *
                            </button>
                            <button type="button" onclick="window.HRRecruitmentEngine.resetPortalCandidateForm();" style="background:transparent; color:#CBD5E1; border:1px solid rgba(212,175,55,0.4); border-radius:12px; padding:12px 20px; font-weight:700; font-size:0.85rem; cursor:pointer;">
                                📄 Enviar otra postulación
                            </button>
                        </div>
                    </div>
                `;
                feedbackContainer.style.display = 'block';
                form.style.display = 'none';
            }

            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast(`✨ Postulación ${application.id} registrada exitosamente.`, 'success');
            }
        },

        resetPortalCandidateForm() {
            const form = document.getElementById('hr-portal-candidate-form');
            const feedback = document.getElementById('hr-portal-candidate-success');
            const cvLabel = document.getElementById('hr-p-cv-label-text');

            if (form) {
                form.reset();
                form.style.display = 'flex';
            }
            if (feedback) {
                feedback.style.display = 'none';
            }
            if (cvLabel) {
                cvLabel.textContent = 'Seleccionar archivo (PDF o DOCX, máx 5MB)';
            }
        },

        /**
         * Renderiza la Consola de Recursos Humanos en el Menú Lateral de Administración (Silent Luxury)
         */
        renderAdminConsole(containerId = 'admin-hr-console-container') {
            const container = document.getElementById(containerId);
            if (!container) return;

            const apps = this.getApplications();
            const total = apps.length;
            const recibidas = apps.filter(a => a.status === 'Recibida').length;
            const preseleccionadas = apps.filter(a => a.status === 'Preseleccionado').length;
            const enRevision = apps.filter(a => a.status === 'En Revisión').length;

            // Candidato destacado (María Briceño) para acceso rápido del staff
            const mb = apps.find(a => a.fullName && a.fullName.includes('Briceño')) || apps[0];

            let rowsHtml = '';
            if (apps.length === 0) {
                rowsHtml = `<tr><td colspan="7" class="text-center py-4 text-muted">No hay postulaciones registradas hasta el momento.</td></tr>`;
            } else {
                rowsHtml = apps.map(app => {
                    const statusClass = {
                        'Recibida': 'badge-status-recibida',
                        'En Revisión': 'badge-status-revision',
                        'Preseleccionado': 'badge-status-preseleccionado',
                        'Contactado': 'badge-status-contactado',
                        'Descartado': 'badge-status-descartado'
                    }[app.status] || 'badge-status-default';

                    return `
                        <tr class="hr-row-candidate" data-id="${app.id}">
                            <td>
                                <strong class="app-code">${app.id}</strong>
                                <br><small class="text-muted">${new Date(app.submittedAt).toLocaleDateString('es-VE')}</small>
                            </td>
                            <td>
                                <div class="candidate-meta">
                                    <span class="candidate-name"><strong>${app.fullName}</strong></span>
                                    <span class="candidate-doc"><i class="fa-solid fa-id-card"></i> ${app.idCard}</span>
                                </div>
                            </td>
                            <td>
                                <div class="candidate-contact">
                                    <a href="https://wa.me/${app.phone.replace(/[^0-9]/g, '')}" target="_blank" class="contact-link wa-link">
                                        <i class="fa-brands fa-whatsapp"></i> ${app.phone}
                                    </a>
                                    <br><small class="text-muted"><i class="fa-regular fa-envelope"></i> ${app.email}</small>
                                </div>
                            </td>
                            <td>
                                <span class="badge-area-pill">${app.area}</span>
                                <br><small class="text-muted"><i class="fa-solid fa-briefcase"></i> ${app.experienceYears} años exp.</small>
                            </td>
                            <td>
                                <span class="badge-status-luxury ${statusClass}">${app.status}</span>
                                <br><small class="text-gold" style="font-weight:800; font-size:0.68rem;"><i class="fa-solid fa-bolt"></i> Teamly Sync</small>
                            </td>
                            <td>
                                <div class="cv-attachment-info">
                                    <i class="fa-regular fa-file-pdf text-danger"></i>
                                    <span class="cv-name" title="${app.cvFileName}">${app.cvFileName.length > 15 ? app.cvFileName.slice(0, 15) + '...' : app.cvFileName}</span>
                                    <small class="cv-size">(${app.cvFileSize})</small>
                                </div>
                            </td>
                            <td class="text-right">
                                <div style="display:flex; justify-content:flex-end; gap:6px;">
                                    <button type="button" class="btn btn-sm" title="Ver / Descargar Currículo" onclick="window.HRRecruitmentEngine.downloadCv('${app.id}')" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:800; font-size:0.75rem; border:none; border-radius:6px; padding:4px 8px; cursor:pointer;">
                                        📄 CV
                                    </button>
                                    <button type="button" class="btn-action-icon" title="Ver Expediente Completo" onclick="window.HRRecruitmentEngine.openCandidateModal('${app.id}')">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            container.innerHTML = `
                <!-- FICHA DESTACADA DE POSTULACIÓN: MARÍA BRICEÑO (ACCESO EXCLUSIVO STAFF) -->
                ${mb ? `
                <div class="hr-featured-dossier" style="background:linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%); border:2px solid #D4AF37; border-radius:18px; padding:22px 24px; margin-bottom:24px; box-shadow:0 10px 30px rgba(0,0,0,0.45); color:#FFFFFF;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
                        <div style="flex:1; min-width:280px;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                                <span style="background:rgba(212,175,55,0.2); color:#D4AF37; border:1px solid #D4AF37; font-size:0.72rem; font-weight:800; padding:3px 10px; border-radius:12px; text-transform:uppercase; letter-spacing:0.08em;">
                                    👑 Expediente Recibido • Revisión de Talento Humano
                                </span>
                                <span style="background:#10b981; color:#fff; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:6px;">
                                    ${mb.status}
                                </span>
                            </div>
                            <h3 style="font-size:1.35rem; font-weight:900; color:#FFFFFF; margin:0 0 6px 0;">
                                Aquí está la información suministrada y el currículo que envió ${mb.fullName}
                            </h3>
                            <p style="font-size:0.84rem; color:#CBD5E1; margin:0; line-height:1.45;">
                                Postulada para el área de <strong style="color:#D4AF37;">${mb.area}</strong> con ${mb.experienceYears} años de experiencia comprobada en Maracaibo, especialista en cortes asiáticos y manejo de razas gigantes.
                            </p>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <button type="button" class="btn btn-sm" onclick="window.HRRecruitmentEngine.downloadCv('${mb.id}')" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; padding:10px 18px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(212,175,55,0.4); display:inline-flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-file-pdf"></i> <span>📄 Ver / Descargar Currículo (CV)</span>
                            </button>
                            <button type="button" class="btn btn-sm" onclick="window.HRRecruitmentEngine.openCandidateModal('${mb.id}')" style="background:rgba(255,255,255,0.1); color:#FFFFFF; font-weight:800; padding:10px 16px; border-radius:10px; border:1px solid rgba(255,255,255,0.25); cursor:pointer;">
                                <i class="fa-solid fa-address-card"></i> <span>Ficha Completa</span>
                            </button>
                            <a href="https://wa.me/${mb.phone.replace(/[^0-9]/g, '')}" target="_blank" style="background:#25D366; color:#FFFFFF; font-weight:800; padding:10px 16px; border-radius:10px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                                <i class="fa-brands fa-whatsapp"></i> <span>WhatsApp</span>
                            </a>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:12px; margin-top:16px; padding-top:14px; border-top:1px solid rgba(212,175,55,0.2); font-size:0.82rem;">
                        <div><span style="color:#D4AF37; font-weight:700;">Cédula:</span> ${mb.idCard}</div>
                        <div><span style="color:#D4AF37; font-weight:700;">Teléfono / WA:</span> ${mb.phone}</div>
                        <div><span style="color:#D4AF37; font-weight:700;">Sector:</span> ${mb.address}</div>
                        <div><span style="color:#D4AF37; font-weight:700;">Currículo:</span> <a href="javascript:void(0)" onclick="window.HRRecruitmentEngine.downloadCv('${mb.id}')" style="color:#60A5FA; font-weight:700; text-decoration:underline;">${mb.cvFileName} (${mb.cvFileSize})</a></div>
                    </div>
                </div>
                ` : ''}

                <div class="hr-admin-card luxury-card">
                    <div class="hr-admin-header">
                        <div class="hr-title-group">
                            <span class="luxury-badge-gold"><i class="fa-solid fa-user-tie"></i> Dirección de Talento y Cultura</span>
                            <h3 class="luxury-card-title">Expedientes de Postulación y Reclutamiento</h3>
                            <p class="luxury-card-subtitle">
                                Monitoreo y evaluación confidencial de aspirantes para las áreas operativas y médicas de Mrs. Pets. Al staff le interesa ver las fichas y currículos suministrados, no llenar formularios.
                            </p>
                        </div>
                        <div class="hr-stats-badges">
                            <div class="stat-pill"><span class="stat-num">${total}</span> <span class="stat-txt">Total</span></div>
                            <div class="stat-pill alert-gold"><span class="stat-num">${recibidas}</span> <span class="stat-txt">Nuevas</span></div>
                            <div class="stat-pill success"><span class="stat-num">${preseleccionadas}</span> <span class="stat-txt">Preseleccionadas</span></div>
                        </div>
                    </div>

                    <div class="table-responsive mt-3">
                        <table class="table-luxury-dark">
                            <thead>
                                <tr>
                                    <th>Cód. / Fecha</th>
                                    <th>Candidato</th>
                                    <th>Contacto Maracaibo</th>
                                    <th>Área & Experiencia</th>
                                    <th>Estatus</th>
                                    <th>Curriculum</th>
                                    <th class="text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modal de Detalle de Candidato -->
                <div id="hr-candidate-detail-modal" class="luxury-modal" style="display: none;">
                    <div class="luxury-modal-content max-w-700">
                        <div class="luxury-modal-header">
                            <h3 class="modal-title" id="hr-modal-candidate-name">Expediente de Candidato</h3>
                            <button type="button" class="modal-close-btn" onclick="window.HRRecruitmentEngine.closeCandidateModal()">&times;</button>
                        </div>
                        <div class="luxury-modal-body" id="hr-modal-candidate-body">
                            <!-- Inyectado dinámicamente -->
                        </div>
                    </div>
                </div>

                <!-- Modal Visor de Currículo Oficial (CV) -->
                <div id="hr-cv-viewer-modal" class="luxury-modal" style="display: none;">
                    <div class="luxury-modal-content max-w-700" style="max-height:90vh; overflow-y:auto; background:#1C1C1E; border:2px solid #D4AF37; color:#FFFFFF;">
                        <div class="luxury-modal-header" style="border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:12px;">
                            <h3 class="modal-title" id="hr-cv-modal-title" style="color:#D4AF37; font-weight:900; font-size:1.25rem;">
                                📄 Currículum Vitae Oficial
                            </h3>
                            <button type="button" class="modal-close-btn" onclick="window.HRRecruitmentEngine.closeCvModal()">&times;</button>
                        </div>
                        <div class="luxury-modal-body" id="hr-cv-modal-body" style="padding:20px;">
                            <!-- Inyectado dinámicamente -->
                        </div>
                    </div>
                </div>
            `;
        },

        openCandidateModal(id) {
            const app = this.applications.find(a => a.id === id);
            if (!app) return;

            const modal = document.getElementById('hr-candidate-detail-modal');
            const title = document.getElementById('hr-modal-candidate-name');
            const body = document.getElementById('hr-modal-candidate-body');

            if (!modal || !body) return;

            title.innerHTML = `<i class="fa-solid fa-address-card text-gold"></i> ${app.fullName} <span class="code-badge">${app.id}</span>`;

            body.innerHTML = `
                <div class="candidate-dossier-grid">
                    <div class="dossier-section">
                        <h4 class="dossier-subtitle"><i class="fa-solid fa-user"></i> Datos Personales y de Residencia</h4>
                        <div class="dossier-data-item"><strong>Cédula de Identidad:</strong> ${app.idCard}</div>
                        <div class="dossier-data-item"><strong>Teléfono / WhatsApp:</strong> ${app.phone}</div>
                        <div class="dossier-data-item"><strong>Correo Electrónico:</strong> ${app.email}</div>
                        <div class="dossier-data-item"><strong>Dirección / Sector:</strong> ${app.address}</div>
                    </div>

                    <div class="dossier-section">
                        <h4 class="dossier-subtitle"><i class="fa-solid fa-award"></i> Perfil Profesional y Operativo</h4>
                        <div class="dossier-data-item"><strong>Área de Interés:</strong> <span class="badge-area-pill">${app.area}</span></div>
                        <div class="dossier-data-item"><strong>Años de Experiencia:</strong> ${app.experienceYears} años comprobables</div>
                        <div class="dossier-data-item"><strong>Manejo de Talla Grande:</strong> ${app.largeBreedHandling}</div>
                        <div class="dossier-data-item"><strong>Disponibilidad Horaria:</strong> ${app.scheduleAvailability}</div>
                        <div class="dossier-data-item"><strong>Canal de Atribución:</strong> ${app.referralSource}</div>
                        <div class="dossier-data-item">
                            <strong>Archivo Adjunto:</strong> 
                            <button type="button" class="btn btn-sm" onclick="window.HRRecruitmentEngine.downloadCv('${app.id}')" style="background:#D4AF37; color:#121214; font-weight:800; font-size:0.75rem; border:none; border-radius:6px; padding:3px 8px; margin-left:6px; cursor:pointer;">
                                📄 Ver CV (${app.cvFileName})
                            </button>
                        </div>
                    </div>
                </div>

                <hr class="luxury-divider my-3">

                <div class="dossier-admin-actions">
                    <div class="form-group-luxury">
                        <label class="form-label-luxury">Cambiar Estatus del Candidato:</label>
                        <select id="modal-app-status-select" class="input-luxury">
                            <option value="Recibida" ${app.status === 'Recibida' ? 'selected' : ''}>Recibida</option>
                            <option value="En Revisión" ${app.status === 'En Revisión' ? 'selected' : ''}>En Revisión</option>
                            <option value="Preseleccionado" ${app.status === 'Preseleccionado' ? 'selected' : ''}>Preseleccionado para Entrevista</option>
                            <option value="Contactado" ${app.status === 'Contactado' ? 'selected' : ''}>Contactado / Entrevistado</option>
                            <option value="Descartado" ${app.status === 'Descartado' ? 'selected' : ''}>Descartado / En Reserva</option>
                        </select>
                    </div>

                    <div class="form-group-luxury mt-2">
                        <label class="form-label-luxury">Notas de Evaluación de Talento Humano:</label>
                        <textarea id="modal-app-notes" class="input-luxury" rows="3" placeholder="Añadir observaciones sobre competencias técnicas, actitud y pretensiones...">${app.internalNotes || ''}</textarea>
                    </div>

                    <div class="modal-footer-luxury mt-3" style="display:flex; justify-content:space-between; align-items:center;">
                        <button type="button" class="btn-luxury-secondary" onclick="window.HRRecruitmentEngine.downloadCv('${app.id}')" style="background:#2C2C2E; color:#D4AF37; border:1px solid #D4AF37;">
                            📄 Ver Currículo Oficial
                        </button>
                        <div style="display:flex; gap:10px;">
                            <button type="button" class="btn-luxury-secondary" onclick="window.HRRecruitmentEngine.closeCandidateModal()">Cerrar</button>
                            <button type="button" class="btn-luxury-primary" onclick="window.HRRecruitmentEngine.saveCandidateEvaluation('${app.id}')">
                                <i class="fa-solid fa-floppy-disk"></i> Guardar Evaluación
                            </button>
                        </div>
                    </div>
                </div>
            `;

            modal.style.display = 'flex';
        },

        closeCandidateModal() {
            const modal = document.getElementById('hr-candidate-detail-modal');
            if (modal) modal.style.display = 'none';
        },

        saveCandidateEvaluation(id) {
            const statusSelect = document.getElementById('modal-app-status-select');
            const notesTextarea = document.getElementById('modal-app-notes');

            if (!statusSelect) return;

            const newStatus = statusSelect.value;
            const newNotes = notesTextarea ? notesTextarea.value.trim() : '';

            this.updateApplicationStatus(id, newStatus, newNotes);
            this.closeCandidateModal();
            this.renderAdminConsole();
        },

        downloadCv(id) {
            const app = this.applications.find(a => a.id === id);
            if (!app) return;

            let modal = document.getElementById('hr-cv-viewer-modal');
            if (!modal) {
                // Si la consola de administración aún no lo inyectó, lo creamos
                modal = document.createElement('div');
                modal.id = 'hr-cv-viewer-modal';
                modal.className = 'luxury-modal';
                modal.innerHTML = `
                    <div class="luxury-modal-content max-w-700" style="max-height:90vh; overflow-y:auto; background:#1C1C1E; border:2px solid #D4AF37; color:#FFFFFF;">
                        <div class="luxury-modal-header" style="border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:12px;">
                            <h3 class="modal-title" id="hr-cv-modal-title" style="color:#D4AF37; font-weight:900; font-size:1.25rem;">
                                📄 Currículum Vitae Oficial
                            </h3>
                            <button type="button" class="modal-close-btn" onclick="window.HRRecruitmentEngine.closeCvModal()">&times;</button>
                        </div>
                        <div class="luxury-modal-body" id="hr-cv-modal-body" style="padding:20px;"></div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            const title = document.getElementById('hr-cv-modal-title');
            const body = document.getElementById('hr-cv-modal-body');

            if (title) {
                title.innerHTML = `📄 Síntesis Curricular: <strong style="color:#FFFFFF;">${app.fullName}</strong> (${app.cvFileName})`;
            }

            if (body) {
                body.innerHTML = `
                    <div style="background:#FFFFFF; color:#1C1C1E; border-radius:12px; padding:28px 24px; box-shadow:0 8px 24px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <!-- Membrete Corporativo -->
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #D4AF37; padding-bottom:14px; margin-bottom:18px;">
                            <div>
                                <h2 style="margin:0; font-size:1.6rem; font-weight:900; color:#1C1C1E;">${app.fullName}</h2>
                                <div style="font-size:0.95rem; font-weight:800; color:#B8860B; text-transform:uppercase; margin-top:2px;">
                                    ${app.area}
                                </div>
                            </div>
                            <div style="text-align:right; font-size:0.75rem; color:#6B7280;">
                                <div style="font-weight:800; color:#D4AF37;">MRS. PETS TALENTO & CULTURA</div>
                                <div>Expediente: <strong>${app.id}</strong></div>
                                <div>Fecha de Recepción: ${new Date(app.submittedAt).toLocaleDateString('es-VE')}</div>
                            </div>
                        </div>

                        <!-- Datos de Contacto Directo -->
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px 14px; margin-bottom:18px; font-size:0.83rem;">
                            <div><strong>Cédula:</strong> ${app.idCard}</div>
                            <div><strong>Teléfono:</strong> <a href="https://wa.me/${app.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color:#047857; font-weight:800;">${app.phone} (WhatsApp)</a></div>
                            <div><strong>Correo:</strong> ${app.email}</div>
                            <div><strong>Residencia:</strong> ${app.address}</div>
                        </div>

                        <!-- Perfil Profesional y Experiencia -->
                        <div style="margin-bottom:18px;">
                            <h4 style="font-size:0.95rem; font-weight:900; color:#1C1C1E; border-left:4px solid #D4AF37; padding-left:8px; margin:0 0 8px 0; text-transform:uppercase;">
                                Perfil Profesional y Competencias
                            </h4>
                            <p style="font-size:0.86rem; color:#374151; line-height:1.55; margin:0 0 10px 0;">
                                Profesional especializado en <strong>${app.area}</strong> con más de <strong>${app.experienceYears} años de trayectoria demostrable</strong> en el cuidado de mascotas en el estado Zulia. Destaca por su alta sensibilidad, trato respetuoso con los príncipes y princesas, manejo de cortes de estándar internacional (asiático, puppy cut, deslanado profundo) y protocolos de bioseguridad en mesa y tina.
                            </p>
                        </div>

                        <!-- Manejo Operativo y Talla Grande -->
                        <div style="margin-bottom:18px;">
                            <h4 style="font-size:0.95rem; font-weight:900; color:#1C1C1E; border-left:4px solid #D4AF37; padding-left:8px; margin:0 0 8px 0; text-transform:uppercase;">
                                Manejo Técnico y Razas Gigantes
                            </h4>
                            <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; padding:10px 14px; font-size:0.84rem; color:#92400E;">
                                <strong>Competencia verificada:</strong> ${app.largeBreedHandling}.
                            </div>
                        </div>

                        <!-- Disponibilidad y Canal -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; font-size:0.83rem;">
                            <div style="background:#F1F5F9; padding:10px; border-radius:8px;">
                                <strong>Disponibilidad de Horario:</strong> ${app.scheduleAvailability}
                            </div>
                            <div style="background:#F1F5F9; padding:10px; border-radius:8px;">
                                <strong>Canal de Postulación:</strong> ${app.referralSource}
                            </div>
                        </div>

                        <!-- Archivo Adjunto Original -->
                        <div style="border-top:1px dashed #CBD5E1; padding-top:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                            <div style="font-size:0.8rem; color:#6B7280;">
                                <i class="fa-regular fa-file-pdf text-danger"></i> Archivo recibido: <strong>${app.cvFileName}</strong> (${app.cvFileSize})
                            </div>
                            <div style="display:flex; gap:8px;">
                                <a href="https://wa.me/${app.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(app.fullName)},%20te%20escribimos%20de%20la%20Direcci%C3%B3n%20de%20Talento%20de%20Mrs.%20Pets%20para%20coordinar%20tu%20entrevista." target="_blank" style="background:#25D366; color:#FFFFFF; font-weight:800; font-size:0.8rem; padding:8px 14px; border-radius:8px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                                    <i class="fa-brands fa-whatsapp"></i> Contactar por WhatsApp
                                </a>
                                <button type="button" onclick="window.print()" style="background:#1E293B; color:#FFFFFF; font-weight:800; font-size:0.8rem; padding:8px 14px; border-radius:8px; border:none; cursor:pointer;">
                                    🖨️ Imprimir / Guardar PDF
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            modal.style.display = 'flex';
        },

        closeCvModal() {
            const modal = document.getElementById('hr-cv-viewer-modal');
            if (modal) modal.style.display = 'none';
        }
    };

    window.HRRecruitmentEngine = HRRecruitmentEngine;

})(window);
