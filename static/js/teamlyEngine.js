/**
 * Mrs. Pets - Teamly Integration & Data Lifecycle Management Engine
 * 
 * Gestiona el consumo de la API de Teamly, sincronización bidireccional con Make.com,
 * clasificación de ciclo de vida (Rama Administrativa vs Rama Operativa),
 * Archivo Muerto Digital (Retención de 1 Año Fiscal) y enrutamiento a Servidor NAS Local.
 */

(function (window) {
    'use strict';

    const STORAGE_KEY_AUDIT = 'mrs_pets_audit_trail';
    const STORAGE_KEY_CONFIG = 'mrs_pets_teamly_config';

    const DEFAULT_CONFIG = {
        teamlyWorkspaceId: 'ws_mrspets_mbo_01',
        teamlyHrProjectId: 'prj_rrhh_recruitment',
        teamlyManagementProjectId: 'prj_management_tasks',
        storageMode: 'hybrid', // 'hybrid' | 'nas_local' | 'cloud'
        localServerEnabled: true,
        localServerIp: '192.168.1.100',
        localNasPort: 8443,
        localNasMountPath: '/Volumes/MrsPets_NAS/ArchivoMuertoDigital',
        makeWebhookLeia: 'https://hook.us1.make.com/mrspets_leia_multimodal',
        makeWebhookRrhh: 'https://hook.us1.make.com/mrspets_rrhh_teamly_sync',
        staffControlKey: 'nicole',
        retentionOperational: '1_FISCAL_YEAR',
        retentionAdministrative: 'PERMANENT_FISCAL'
    };

    const TeamlyEngine = {
        config: null,
        auditTrail: [],

        init() {
            this.loadConfig();
            this.loadAuditTrail();
            if (typeof console !== 'undefined' && console.log) {
                console.log('[TeamlyEngine] Inicializado con éxito. Modo Almacenamiento:', this.config.storageMode, '| Servidor NAS:', this.config.localServerIp);
            }
        },

        loadConfig() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
                if (stored) {
                    this.config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(stored));
                } else {
                    this.config = Object.assign({}, DEFAULT_CONFIG);
                    this.saveConfig();
                }
            } catch (e) {
                this.config = Object.assign({}, DEFAULT_CONFIG);
            }
        },

        saveConfig() {
            try {
                localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
            } catch (e) {}
        },

        getConfig() {
            if (!this.config) this.loadConfig();
            return Object.assign({}, this.config);
        },

        loadAuditTrail() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY_AUDIT);
                if (stored) {
                    this.auditTrail = JSON.parse(stored);
                } else {
                    this.auditTrail = [];
                }
            } catch (e) {
                this.auditTrail = [];
            }
        },

        saveAuditTrail() {
            try {
                localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditTrail));
            } catch (e) {}
        },

        getAuditTrail() {
            return this.auditTrail.slice();
        },

        /**
         * Registra una transacción inmutable en el historial de auditoría
         * (Simula inserción en Google Sheet de control corporativo)
         */
        recordAuditLog(entry) {
            const now = new Date();
            const record = {
                id: 'AUD-' + now.getTime() + '-' + Math.floor(Math.random() * 1000),
                timestamp: now.toISOString(),
                staffUser: entry.staffUser || 'Sistema / Concierge',
                fileType: entry.fileType || 'N/A',
                fileName: entry.fileName || 'N/A',
                purpose: entry.purpose || 'Operación General',
                lifecycle: entry.lifecycle || 'operational',
                storageDestination: entry.storageDestination || 'cloud',
                teamlySync: Boolean(entry.teamlySync),
                teamlyTaskId: entry.teamlyTaskId || null,
                status: entry.status || 'COMPLETADO',
                summaryLink: entry.summaryLink || '#'
            };

            this.auditTrail.unshift(record);
            // Mantener máximo 500 registros locales para no saturar memoria
            if (this.auditTrail.length > 500) {
                this.auditTrail.pop();
            }
            this.saveAuditTrail();

            window.dispatchEvent(new CustomEvent('mrs_pets_audit_logged', {
                detail: record
            }));

            // Despacho no bloqueante al backend si está disponible
            try {
                fetch('/api/audit/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(record)
                }).catch(() => {});
            } catch (e) {}

            return record;
        },

        /**
         * Clasifica el ciclo de vida de un archivo según su naturaleza
         */
        classifyLifecycle(fileType, purpose) {
            const p = String(purpose || '').toLowerCase();
            const ft = String(fileType || '').toLowerCase();

            // Rama Administrativa / Fiscal: Facturas, declaraciones, comprobantes SENIAT/SEDEMAT
            if (p.includes('factura') || p.includes('fiscal') || p.includes('pago') || p.includes('seniat') || p.includes('sedemat') || p.includes('invoice')) {
                return {
                    branch: 'ADMINISTRATIVE',
                    retention: 'PERMANENT_FISCAL',
                    destination: 'GOOGLE_DRIVE_FISCAL',
                    label: 'Almacenamiento Fiscal Permanente (Google Drive / SENIAT)'
                };
            }

            // Rama de Reclutamiento / RRHH: CVs y expedientes de talento
            if (p.includes('rrhh') || p.includes('candidato') || p.includes('postulacion') || p.includes('cv') || p.includes('recruitment')) {
                return {
                    branch: 'HUMAN_RESOURCES',
                    retention: '1_FISCAL_YEAR',
                    destination: 'TEAMLY_HR_VAULT',
                    label: 'Expediente RRHH Teamly (Retención 1 Año Fiscal)'
                };
            }

            // Rama Operativa / Reuniones: Audios, notas de voz, minutas
            if (ft.includes('audio') || p.includes('audio') || p.includes('reunion') || p.includes('nota_voz') || p.includes('voice')) {
                return {
                    branch: 'OPERATIONAL_AUDIO',
                    retention: '1_FISCAL_YEAR',
                    destination: this.config.localServerEnabled ? 'LOCAL_NAS_DEAD_ARCHIVE' : 'CLOUD_DEAD_ARCHIVE',
                    label: 'Archivo Muerto Digital - Retención 1 Año Fiscal (Servidor NAS Local)'
                };
            }

            // Por defecto
            return {
                branch: 'GENERAL',
                retention: '1_FISCAL_YEAR',
                destination: 'CLOUD_STORAGE',
                label: 'Almacenamiento General Estándar'
            };
        },

        /**
         * Resuelve los parámetros físicos de enrutamiento (Local NAS vs Cloud)
         */
        resolveStorageRouting(lifecycle) {
            const isLocal = this.config.localServerEnabled && (lifecycle.destination === 'LOCAL_NAS_DEAD_ARCHIVE' || this.config.storageMode === 'nas_local' || this.config.storageMode === 'hybrid');

            return {
                isLocal: isLocal,
                serverIp: this.config.localServerIp,
                serverPort: this.config.localNasPort,
                mountPath: this.config.localNasMountPath,
                protocol: isLocal ? 'smb://' + this.config.localServerIp + this.config.localNasMountPath : 'https://drive.google.com/mrspets_vault',
                retentionPolicy: lifecycle.retention
            };
        },

        /**
         * Sincroniza un candidato del Concierge como Tarea / Tarjeta en Teamly
         */
        createCandidateTask(candidateData) {
            const lifecycle = this.classifyLifecycle('document', 'rrhh');
            const routing = this.resolveStorageRouting(lifecycle);

            const payload = {
                event: 'teamly_hr_candidate_sync',
                teamly_workspace_id: this.config.teamlyWorkspaceId,
                teamly_project_id: this.config.teamlyHrProjectId,
                teamly_sync_flag: true,
                candidate: {
                    id: candidateData.id,
                    fullName: candidateData.fullName,
                    idCard: candidateData.idCard,
                    phone: candidateData.phone,
                    email: candidateData.email,
                    address: candidateData.address,
                    area: candidateData.area,
                    experienceYears: candidateData.experienceYears,
                    largeBreedHandling: candidateData.largeBreedHandling,
                    scheduleAvailability: candidateData.scheduleAvailability,
                    referralSource: candidateData.referralSource,
                    cvFileName: candidateData.cvFileName,
                    cvFileSize: candidateData.cvFileSize,
                    consentData: candidateData.consentData,
                    submittedAt: candidateData.submittedAt
                },
                task_schema: {
                    title: `[POSTULACIÓN RRHH] ${candidateData.fullName} - ${candidateData.area}`,
                    description: `📋 Expediente de Aspirante Mrs. Pets:\n\n• Documento: ${candidateData.idCard}\n• WhatsApp: ${candidateData.phone}\n• Email: ${candidateData.email}\n• Zona: ${candidateData.address}\n• Experiencia: ${candidateData.experienceYears} años\n• Manejo Talla Grande: ${candidateData.largeBreedHandling}\n• Horario Cierre 6PM: ${candidateData.scheduleAvailability}\n• Atribución: ${candidateData.referralSource}\n• CV Adjunto: ${candidateData.cvFileName} (${candidateData.cvFileSize})`,
                    status: 'NUEVO_ASPIRANTE',
                    priority: 'MEDIUM',
                    tags: ['RRHH', candidateData.area, 'Maracaibo']
                },
                lifecycle: lifecycle,
                routing: routing,
                timestamp: new Date().toISOString()
            };

            // Despacho asíncrono no bloqueante
            this.dispatchAsyncWebhook('/api/hr/submit-teamly', this.config.makeWebhookRrhh, payload);

            // Registro inmutable de auditoría
            this.recordAuditLog({
                staffUser: 'Portal Concierge RRHH',
                fileType: 'Curriculum Vitae (PDF/DOCX)',
                fileName: candidateData.cvFileName,
                purpose: 'Postulación a vacante en ' + candidateData.area,
                lifecycle: lifecycle.retention,
                storageDestination: lifecycle.destination,
                teamlySync: true,
                teamlyTaskId: candidateData.id,
                status: 'SINCRONIZADO_TEAMLY'
            });

            return payload;
        },

        /**
         * Crea una tarea gerencial en Teamly a partir de notas de voz o directrices de Leia
         */
        createManagementTask(directiveData) {
            const lifecycle = this.classifyLifecycle('audio', 'audio_meeting');
            const routing = this.resolveStorageRouting(lifecycle);

            const payload = {
                event: 'teamly_management_task_created',
                teamly_workspace_id: this.config.teamlyWorkspaceId,
                teamly_project_id: this.config.teamlyManagementProjectId,
                teamly_sync_flag: true,
                staff_user: directiveData.staffUser || 'Staff Gerencia',
                staff_control_key: directiveData.staffControlKey || 'nicole',
                task_schema: {
                    title: directiveData.title || 'Directriz Gerencial de Operaciones',
                    description: directiveData.actionItems || directiveData.transcript || 'Tarea generada desde el Asistente Leia Multimodal.',
                    priority: directiveData.priority || 'HIGH',
                    due_date: directiveData.dueDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
                    tags: ['Gerencia', 'Operaciones', 'MrsPets']
                },
                file_metadata: {
                    fileName: directiveData.fileName || 'audio_reunion.m4a',
                    fileType: directiveData.fileType || 'audio/m4a',
                    fileSize: directiveData.fileSize || 'N/A'
                },
                dead_archive: {
                    enabled: true,
                    retention: '1_FISCAL_YEAR',
                    destination: routing.protocol,
                    nas_ip: routing.serverIp
                },
                timestamp: new Date().toISOString()
            };

            // Despacho asíncrono no bloqueante
            this.dispatchAsyncWebhook('/api/leia/chat', this.config.makeWebhookLeia, payload);

            // Registro inmutable de auditoría
            this.recordAuditLog({
                staffUser: directiveData.staffUser || 'Staff Gerencia',
                fileType: directiveData.fileType || 'Audio / Nota de voz',
                fileName: directiveData.fileName || 'audio_reunion.m4a',
                purpose: 'Extracción de tareas gerenciales hacia Teamly',
                lifecycle: '1_FISCAL_YEAR',
                storageDestination: routing.isLocal ? 'LOCAL_NAS_DEAD_ARCHIVE' : 'CLOUD_DEAD_ARCHIVE',
                teamlySync: true,
                status: 'EN_PROCESO_ASINCRONO'
            });

            return payload;
        },

        /**
         * Enrutador asíncrono con respaldo local
         */
        dispatchAsyncWebhook(localEndpoint, makeUrl, payload) {
            // Se ejecuta de manera no bloqueante en el fondo
            setTimeout(() => {
                // 1. Intento primario al endpoint backend
                try {
                    fetch(localEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }).then(res => {
                        if (typeof console !== 'undefined' && console.log) {
                            console.log(`[TeamlyEngine] Sincronización enviada con código ${res.status}`);
                        }
                    }).catch(err => {
                        // 2. Respaldo directo hacia Make.com si el endpoint local no responde
                        if (makeUrl) {
                            fetch(makeUrl, {
                                method: 'POST',
                                mode: 'no-cors',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            }).catch(() => {});
                        }
                    });
                } catch (e) {
                    if (typeof console !== 'undefined' && console.warn) {
                        console.warn('[TeamlyEngine] Error en despacho asíncrono:', e);
                    }
                }
            }, 50);
        }
    };

    window.TeamlyEngine = TeamlyEngine;

})(window);
