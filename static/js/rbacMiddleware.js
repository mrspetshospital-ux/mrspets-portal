/**
 * Mrs. Pets - RBAC Middleware & Staff Navigation Controller
 * 
 * Control de acceso basado en roles (RBAC) y conmutación del Menú Lateral
 * de Administración con estética "Silent Luxury" (#2C2C2E, #FBFBFD, #D4AF37).
 */

(function (window) {
    'use strict';

    const RBACMiddleware = {
        init() {
            this.setupAuthStateListener();
            this.updateSidebarVisibility();
            this.syncServerAuth();
            console.log('[RBACMiddleware] Inicializado control de acceso y navegación staff.');
        },

        async syncServerAuth() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.username) {
                        sessionStorage.setItem('mrs_pets_enterprise_authenticated', 'true');
                        sessionStorage.setItem('mrs_pets_staff_role', data.role || 'staff');
                        if (window.adminEngine) {
                            window.adminEngine.isEnterpriseAuthenticated = true;
                            window.adminEngine.activeRole = data.role;
                        }
                        this.updateSidebarVisibility();
                    }
                }
            } catch(e) {}
        },

        /**
         * Verifica si el usuario actual posee permisos de Staff/Administración
         */
        isStaffOrAdmin() {
            const admin = window.adminEngine;
            if (admin && (admin.viewEnvironment === 'enterprise' || admin.isEnterpriseAuthenticated === true)) {
                return true;
            }
            const auth = window.authEngine || window.AuthEngine;
            if (auth) {
                const role = String(auth.userRole || auth.currentUser?.role || '').toLowerCase();
                if (role === 'admin' || role === 'staff' || role === 'veterinario' || role === 'groomer') {
                    return true;
                }
            }
            if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true') {
                return true;
            }
            return false;
        },

        /**
         * Guarda de rutas para app.switchTab
         * Retorna true si tiene permiso, false si fue denegado y redirigido
         */
        enforceRouteGuard(targetTab) {
            const protectedTabs = ['admin', 'analytics', 'integrations', 'health-dashboard', 'agent-studio', 'marketing-command', 'misipet'];
            if (protectedTabs.includes(targetTab)) {
                if (targetTab === 'misipet') {
                    // Acceso concedido al Centro de Comando MISIPET (Supervisor LAN y Admin GEO)
                    return true;
                }
                if (targetTab === 'marketing-command' && window.marketingCommandCenterEngine && typeof window.marketingCommandCenterEngine.isAuthorized === 'function') {
                    if (!window.marketingCommandCenterEngine.isAuthorized()) {
                        console.warn(`[RBACMiddleware] Acceso denegado a '${targetTab}' (Exclusivo Gerencia de Marketing & Volturi).`);
                        if (window.app && typeof window.app.showToast === 'function') {
                            window.app.showToast("🔒 Acceso Restringido: El Centro de Mercadotecnia es exclusivo para O'Neil y Comité Volturi.", 'warning');
                        } else if (window.app && typeof window.app.showNotification === 'function') {
                            window.app.showNotification("🔒 Acceso Restringido: Exclusivo para O'Neil y Comité Volturi.", 'warning');
                        }

                        // Ofrecer inicio de sesión rápido de Staff / O'Neil si está disponible
                        if (window.authEngine && typeof window.authEngine.quickStaffLogin === 'function' && typeof document !== 'undefined') {
                            window.authEngine.quickStaffLogin();
                            if (window.marketingCommandCenterEngine.isAuthorized()) {
                                if (window.app && typeof window.app.switchTab === 'function') {
                                    window.app.switchTab(targetTab);
                                }
                                return true;
                            }
                        }

                        if (window.app && typeof window.app.switchTab === 'function') {
                            window.app.switchTab('welcome');
                        }
                        return false;
                    }
                } else if (!this.isStaffOrAdmin()) {
                    console.warn(`[RBACMiddleware] Acceso denegado a pestaña protegida '${targetTab}' para usuario no staff.`);
                    if (window.app && typeof window.app.showToast === 'function') {
                        window.app.showToast('🔒 Acceso Restringido: Esta sección requiere credenciales autorizadas de Staff.', 'warning');
                    } else if (window.app && typeof window.app.showNotification === 'function') {
                        window.app.showNotification('Acceso Restringido: Requiere credenciales de Staff o Administración.', 'warning');
                    }

                    // Ofrecer inicio de sesión rápido de Staff si está en navegador
                    if (window.authEngine && typeof window.authEngine.quickStaffLogin === 'function' && typeof document !== 'undefined') {
                        window.authEngine.quickStaffLogin();
                        if (this.isStaffOrAdmin()) {
                            if (window.app && typeof window.app.switchTab === 'function') {
                                window.app.switchTab(targetTab);
                            }
                            return true;
                        }
                    }

                    if (window.app && typeof window.app.switchTab === 'function') {
                        window.app.switchTab('welcome');
                    }
                    return false;
                }
            }
            return true;
        },

        /**
         * Actualiza la visibilidad y coherencia de los elementos del menú lateral
         */
        updateSidebarVisibility() {
            // La barra lateral única siempre permanece visible y consistente
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                navMenu.style.display = '';
            }
        },

        /**
         * Navega a un submódulo específico dentro del panel de administración central
         */
        navigateToAdminModule(moduleSectionId) {
            if (!this.enforceRouteGuard('admin')) return;

            if (window.app && typeof window.app.switchTab === 'function') {
                window.app.switchTab('admin');
            }

            // Scroll y despliegue del acordeón o sección correspondiente en la consola central
            setTimeout(() => {
                const targetElement = document.getElementById(moduleSectionId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Si es un acordeón cerrado, abrirlo
                    if (targetElement.tagName === 'DETAILS') {
                        targetElement.open = true;
                    }
                    if (targetElement.classList.contains('accordion-card')) {
                        const content = targetElement.querySelector('.accordion-content');
                        if (content && (content.style.display === 'none' || !content.classList.contains('show'))) {
                            content.style.display = 'block';
                            content.classList.add('show');
                        }
                    }
                }

                // Renderizadores específicos al navegar
                if (moduleSectionId === 'admin-section-finance-master' && window.adminFinanceEngine) {
                    window.adminFinanceEngine.render();
                }
                if (moduleSectionId === 'admin-section-finance' && window.FinancialEngine) {
                    window.FinancialEngine.renderAdminFinancialPanel();
                }
                if (moduleSectionId === 'admin-section-hr' && window.HRRecruitmentEngine) {
                    window.HRRecruitmentEngine.renderAdminConsole();
                }
                if ((moduleSectionId === 'acc-pending' || moduleSectionId === 'admin-pending-appointments-container') && window.adminEngine) {
                    window.adminEngine.renderPendingAppointmentsManager();
                }
            }, 100);
        },

        setupAuthStateListener() {
            // Escuchar eventos de cambio de autenticación
            window.addEventListener('auth_state_changed', () => {
                this.updateSidebarVisibility();
            });

            // Polling suave de seguridad o interceptación en AuthEngine
            if (window.AuthEngine) {
                const originalLogin = window.AuthEngine.login;
                if (typeof originalLogin === 'function') {
                    window.AuthEngine.login = (...args) => {
                        const result = originalLogin.apply(window.AuthEngine, args);
                        setTimeout(() => this.updateSidebarVisibility(), 50);
                        return result;
                    };
                }

                const originalLogout = window.AuthEngine.logout;
                if (typeof originalLogout === 'function') {
                    window.AuthEngine.logout = (...args) => {
                        const result = originalLogout.apply(window.AuthEngine, args);
                        setTimeout(() => this.updateSidebarVisibility(), 50);
                        return result;
                    };
                }
            }
        }
    };

    window.RBACMiddleware = RBACMiddleware;

})(window);
