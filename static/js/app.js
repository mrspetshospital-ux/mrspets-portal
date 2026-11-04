/* ==========================================================================
   MAIN APPLICATION CONTROLLER (Mrs Pets Maracaibo)
   ========================================================================== */

class App {
  constructor() {
    this.currentTab = 'welcome';
    this.activityStream = [
      { type: 'whatsapp', text: 'Nueva compra procesada en Mrs Pets (Orden #ORD-983 por $53.50)', time: 'Hace 1 min' },
      { type: 'telephony', text: 'Llamada entrante atendida por Sofía. Consulta estatus de Buddy (Secado)', time: 'Hace 3 min' },
      { type: 'whatsapp', text: 'Notificación WA enviada a CarlosM: "Buddy está en estado: Grooming in Progress"', time: 'Hace 6 min' }
    ];
  }

  init() {
    try {
      localStorage.setItem('mrs_pets_turns_purge_v20261009_1800', 'true');
    } catch (e) {
      console.warn('Could not set purge version:', e);
    }

    if (typeof adminEngine !== 'undefined') {
      adminEngine.loadPatientsFromStorage();
    }
    if (typeof petStatusEngine !== 'undefined') {
      petStatusEngine.loadPetsFromStorage();
    }
    if (typeof adminEngine !== 'undefined') {
      adminEngine.renderClientDatabaseManager();
    }
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true') {
      if (document.body) {
        document.body.classList.add('enterprise-view-mode');
        document.body.classList.remove('customer-view-mode');
      }
      if (typeof adminEngine !== 'undefined') {
        adminEngine.viewEnvironment = 'enterprise';
        adminEngine.isEnterpriseAuthenticated = true;
      }
      const rawHash = (window.location.hash || '').replace('#', '').replace('tab-', '').trim();
      const targetTab = (rawHash && rawHash !== 'welcome') ? rawHash : 'admin';
      this.switchTab(targetTab, true);
    }
    this.bindNavigation();
    this.bindQuickActions();
    this.renderActivityStream();
    this.initResizeHandler();
  }

  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const tabName = item.getAttribute('data-tab');
        const areaFilter = item.getAttribute('data-area-filter');
        this.switchTab(tabName, false, item, areaFilter);
      });
    });

    // Hash routing listener (direct URL / enrutador)
    const isUserStaffOrAdmin = () => {
      try {
        if (window.RBACMiddleware && typeof window.RBACMiddleware.isStaffOrAdmin === 'function') {
          return window.RBACMiddleware.isStaffOrAdmin();
        }
        if (window.authEngine && (window.authEngine.userRole === 'staff' || window.authEngine.isAuthenticated)) {
          return true;
        }
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true') {
          return true;
        }
      } catch (e) {}
      return false;
    };

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '').replace('tab-', '').trim();
      if (hash) {
        const protectedTabs = ['admin', 'analytics', 'integrations', 'health-dashboard', 'agent-studio', 'marketing-command'];
        if (!protectedTabs.includes(hash) || isUserStaffOrAdmin()) {
          if (window.authEngine && typeof window.authEngine.hidePortalAndShowApp === 'function') {
            window.authEngine.hidePortalAndShowApp();
          }
        }
        if (hash === 'marketing-command' && isUserStaffOrAdmin()) {
          document.body.classList.add('enterprise-view-mode');
          document.body.classList.remove('customer-view-mode');
        }
        this.switchTab(hash);
      }
    });

    const initialHash = window.location.hash.replace('#', '').replace('tab-', '').trim();
    if (initialHash && initialHash !== 'welcome') {
      setTimeout(() => {
        const isAuth = isUserStaffOrAdmin() || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_client_authenticated') === 'true');
        if (!isAuth) {
          // Si el usuario llega por enlace con cualquier hash sin autenticación previa,
          // preservamos el reproductor de video de bienvenida y limpiamos el hash sin saltar al panel
          try {
            history.replaceState(null, '', window.location.pathname);
          } catch (e) {}
          return;
        }

        if (window.authEngine && typeof window.authEngine.hidePortalAndShowApp === 'function') {
          window.authEngine.hidePortalAndShowApp();
        }
        if (initialHash === 'marketing-command') {
          document.body.classList.add('enterprise-view-mode');
          document.body.classList.remove('customer-view-mode');
          if (typeof adminEngine !== 'undefined') {
            adminEngine.viewEnvironment = 'enterprise';
            adminEngine.isEnterpriseAuthenticated = true;
          }
        }
        this.switchTab(initialHash, true);
      }, 60);
    }

    // Control Global FIFO de Acordeones / Desplegables (Máximo 2 simultáneos)
    this.initGlobalAccordionFifoControl();

    // 🛡️ REGLA EXCLUSIVA SIDEBAR: No más de una pestaña del menú lateral abierta a la vez (Staff y Visitante)
    this.initSidebarAccordionControl();
  }

  initGlobalAccordionFifoControl() {
    // 1. Carga Inicial: Asegurar que los desplegables de contenido inicien limpios
    // Protegemos explícitamente los menús de navegación lateral (.nav-family)
    const allDetails = document.querySelectorAll('details:not(.nav-family)');
    allDetails.forEach(d => {
      if (!d.closest('.sidebar') && d.id !== 'admin-section-finance-master') {
        d.removeAttribute('open');
      }
    });

    let openStack = [];

    // Delegación global por captura (Zero Overhead, sin colapso de viewport ni pantalla en blanco)
    document.addEventListener('toggle', (e) => {
      const details = e.target;
      if (!details || details.tagName !== 'DETAILS') return;
      if (details.classList.contains('nav-family') || details.closest('.sidebar')) return;

      if (details.open) {
        if (!openStack.includes(details)) {
          openStack.push(details);
        }
        // Límite holgado para permitir lectura continua hacia abajo sin saltos de scroll
        while (openStack.length > 8) {
          const oldest = openStack.shift();
          if (oldest && oldest !== details && oldest.isConnected) {
            oldest.removeAttribute('open');
          }
        }
      } else {
        openStack = openStack.filter(item => item !== details);
      }
    }, true);
  }

  // 🛡️ REGLA EXCLUSIVA SIDEBAR: Máximo UNA pestaña del menú de la izquierda abierta a la vez
  // Si se abre Grooming y luego se abre Clínica Veterinaria, Grooming se cierra automáticamente.
  // Aplica idéntico tanto para modo Staff como para modo Visitante/Cliente.
  initSidebarAccordionControl() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const sidebarFamilies = sidebar.querySelectorAll('details.nav-family');
    if (!sidebarFamilies.length) return;

    // 1. Interceptar el click en la cabecera (<summary>) para cerrar las demás antes de la pintura
    sidebarFamilies.forEach(family => {
      const summary = family.querySelector('summary') || family.querySelector('.nav-family-title');
      if (summary) {
        summary.addEventListener('click', () => {
          // Si esta familia está cerrada y el usuario la va a abrir:
          if (!family.open) {
            sidebarFamilies.forEach(other => {
              if (other !== family && other.open) {
                other.removeAttribute('open');
                other.open = false;
              }
            });
          }
        });
      }

      // 2. Escucha reactiva en evento 'toggle' nativo (red de seguridad universal para teclado y APIs)
      family.addEventListener('toggle', () => {
        if (family.open) {
          sidebarFamilies.forEach(other => {
            if (other !== family && other.open) {
              other.removeAttribute('open');
              other.open = false;
            }
          });
        }
      });
    });

    // 3. Al hacer clic en cualquier .nav-item dentro del menú de la izquierda
    const allSidebarNavItems = sidebar.querySelectorAll('.nav-item');
    allSidebarNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const parentFamily = item.closest('details.nav-family');
        if (parentFamily) {
          if (!parentFamily.open) {
            parentFamily.open = true;
          }
          sidebarFamilies.forEach(other => {
            if (other !== parentFamily && other.open) {
              other.removeAttribute('open');
              other.open = false;
            }
          });
        }
      });
    });
  }

  initResizeHandler() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.geoGuardMap && typeof window.geoGuardMap.invalidateSize === 'function') {
          window.geoGuardMap.invalidateSize();
        }
      }, 150);
    }, { passive: true });
  }

  switchTab(tabName, bypassAuthCheck = false, targetElement = null, areaFilter = null) {
    // 🛡️ REGLA CRÍTICA DE AISLAMIENTO: MODO CANDIDATO / POSTULANTE RRHH
    // Si el usuario está en el portal de empleo/postulación, su acceso queda estrictamente
    // limitado al formato de CV. Queda prohibida la navegación a pestañas internas.
    if (window.authEngine && window.authEngine.userRole === 'candidate') {
      if (typeof this.showToast === 'function') {
        this.showToast('🔒 Acceso Restringido: En modo postulación solo tiene acceso al formato de CV.', 'warning');
      }
      return false;
    }

    // 0. CONTROL DE ACCESO BASADO EN ROLES (RBAC) SILENT LUXURY
    if (!bypassAuthCheck && window.RBACMiddleware && typeof window.RBACMiddleware.enforceRouteGuard === 'function') {
      const isAllowed = window.RBACMiddleware.enforceRouteGuard(tabName);
      if (!isAllowed) return false;
    }

    // 1. RESTRICCIÓN DE SEGURIDAD: DIRECTORIO ZERO TRUST (EXCLUSIVO STAFF ADMINISTRATIVO)
    if (tabName === 'soy-chico-pet') {
      const isStaffUser = (
        typeof adminEngine !== 'undefined' &&
        adminEngine.viewEnvironment === 'enterprise' &&
        adminEngine.isEnterpriseAuthenticated === true
      );
      if (!isStaffUser && !bypassAuthCheck) {
        if (typeof this.showToast === 'function') {
          this.showToast('🔒 Acceso Denegado: El Directorio Zero Trust es exclusivo para el Staff Administrativo.', 'warning');
        }
        // Redirigir al home de cliente
        this.switchTab('welcome', true);
        return false;
      }
    }

    const isStaffTab = (tabName === 'admin' || tabName === 'agent-studio' || tabName === 'integrations' || tabName === 'health-dashboard' || tabName === 'analytics');

    if (isStaffTab && !bypassAuthCheck) {
      const isEntAuth = (typeof adminEngine !== 'undefined' && adminEngine.isEnterpriseAuthenticated);
      if (!isEntAuth) {
        if (typeof this.showToast === 'function') {
          this.showToast('🔒 Acceso Restringido: Ingrese su usuario y clave de Staff para acceder a la Vista Empresa.', 'warning');
        }
        if (typeof this.openModal === 'function') {
          this.openModal('enterprise-login-modal');
        } else {
          const modal = document.getElementById('enterprise-login-modal');
          if (modal) modal.classList.add('active');
        }
        return false;
      }
    }

    if (tabName === 'marketing-command') {
      const isMktAuth = (
        (window.marketingCommandCenterEngine && typeof window.marketingCommandCenterEngine.isAuthorized === 'function' && window.marketingCommandCenterEngine.isAuthorized()) ||
        (window.RBACMiddleware && typeof window.RBACMiddleware.isStaffOrAdmin === 'function' && window.RBACMiddleware.isStaffOrAdmin()) ||
        (typeof adminEngine !== 'undefined' && adminEngine.isEnterpriseAuthenticated) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true')
      );
      if (isMktAuth) {
        if (typeof adminEngine !== 'undefined') {
          adminEngine.viewEnvironment = 'enterprise';
          adminEngine.isEnterpriseAuthenticated = true;
        }
        document.body.classList.add('enterprise-view-mode');
        document.body.classList.remove('customer-view-mode');
      }
    }

    this.currentTab = tabName;

    if (typeof adminEngine !== 'undefined') {
      if (tabName === 'admin' || tabName === 'agent-studio' || tabName === 'integrations' || tabName === 'analytics' || tabName === 'marketing-command') {
        adminEngine.viewEnvironment = 'enterprise';
        document.body.classList.add('enterprise-view-mode');
        document.body.classList.remove('customer-view-mode');
      } else if (tabName === 'pet-status') {
        if (adminEngine.isEnterpriseAuthenticated || sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true') {
          adminEngine.viewEnvironment = 'enterprise';
          document.body.classList.add('enterprise-view-mode');
          document.body.classList.remove('customer-view-mode');
        }
      }
      if (typeof adminEngine.renderEnvironmentToggle === 'function') {
        adminEngine.renderEnvironmentToggle();
      }
      if (window.mrsPetsArch && typeof window.mrsPetsArch.updateHotelCamControls === 'function') {
        window.mrsPetsArch.updateHotelCamControls();
      }
    }

    // Update Nav UI: Highlight exact clicked element cleanly!
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    let activeNav = targetElement;
    if (!activeNav && tabName) {
      if (areaFilter) {
        activeNav = document.querySelector(`.nav-item[data-tab="${tabName}"][data-area-filter="${areaFilter}"]`);
      }
      if (!activeNav) {
        activeNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
      }
    }

    const allSidebarFamilies = document.querySelectorAll('.sidebar details.nav-family');
    if (activeNav) {
      activeNav.classList.add('active');
      const parentFamily = activeNav.closest('details.nav-family');
      if (parentFamily) {
        if (!parentFamily.open) {
          parentFamily.open = true;
        }
        allSidebarFamilies.forEach(other => {
          if (other !== parentFamily && other.open) {
            other.removeAttribute('open');
            other.open = false;
          }
        });
      } else {
        // Pestaña fuera de familias (Bienvenido Portal VIP, C.Centro MPF, Misipet 2.0):
        // cerrar todas las familias para dejar el menú lateral limpio
        allSidebarFamilies.forEach(other => {
          if (other.open) {
            other.removeAttribute('open');
            other.open = false;
          }
        });
      }
    }

    // Update Content Views (Protección total contra pantallas en blanco)
    const previousView = document.querySelector('.tab-view.active');
    let activeView = document.getElementById(`tab-${tabName}`);
    if (!activeView) {
      const lower = (tabName || '').toLowerCase();
      if (['reserva', 'reservas', 'reservaciones', 'reservacion', 'citas', 'booking', 'agendar'].includes(lower)) {
        tabName = 'welcome';
        activeView = document.getElementById('tab-welcome');
        setTimeout(() => {
          if (window.clinicaEngine && typeof window.clinicaEngine.openGroomingBookingModal === 'function') {
            window.clinicaEngine.openGroomingBookingModal('Circuito Grooming Spa 7 Estaciones');
          }
        }, 120);
      } else {
        tabName = 'welcome';
        activeView = document.getElementById('tab-welcome');
      }
    }

    if (previousView === activeView) {
      // Pestaña ya activa: evitar parpadeo y reflujo innecesario
      return;
    }

    // Conmutación atómica de vista (cero pantalla en blanco y cero congelamiento)
    if (activeView) activeView.classList.add('active');
    if (previousView && previousView !== activeView) {
      previousView.classList.remove('active');
      if (previousView.id === 'tab-misipet' && window.misipetEngine && typeof window.misipetEngine.stopAutoRefresh === 'function') {
        window.misipetEngine.stopAutoRefresh();
      }
    }

    if (tabName === 'health-dashboard' && window.healthDashboard && typeof window.healthDashboard.loadStatus === 'function') {
      window.healthDashboard.loadStatus();
    }

    // Update Heading Title
    const titles = {
      'welcome': 'Mrs Pets Maracaibo - Bienvenida VIP',
      'admin': 'Panel Administrativo Staff & Doctores (Back-Office)',
      'dashboard': 'Pet Status Tracking & Bienvenida - Mrs Pets',
      'pet-status': 'My Pets - Control de Estatus Mrs Pets',
      'store': 'Tienda Online Mrs Pets & Pagos en Línea',
      'playground': 'Soporte y Simuladores (Voz & WhatsApp)',
      'agent-studio': 'Estudio y Configuración del Agente IA',
      'integrations': 'Integraciones API Meta & Twilio',
      'health-dashboard': 'Salud de Conexiones Omnicanal - Mrs Pets',
      'call-logs': 'Historial de Llamadas e Inbox',
      'analytics': 'Métricas y Analíticas'
    };
    const heading = document.getElementById('page-heading');
    if (heading) heading.innerText = titles[tabName] || 'Mrs Pets Maracaibo';

    const deferRender = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : (cb) => cb();
    deferRender(() => {
      // Trigger Admin Renders if switching to admin
      if (tabName === 'admin') {
        if (typeof adminEngine !== 'undefined') {
          adminEngine.renderStatusManager();
          adminEngine.renderClientDatabaseManager();
          adminEngine.renderAgendaManager();
          adminEngine.renderStaffProfilesManager();
          adminEngine.renderCatalogManager();
        }
        if (typeof parametricMatrixEngine !== 'undefined') {
          parametricMatrixEngine.renderMatrixUI('parametric-matrix-container');
        }
        if (typeof sixSigmaTelemetryEngine !== 'undefined') {
          sixSigmaTelemetryEngine.renderTelemetryLogUI('telemetry-live-container');
        }
      }

      if (tabName === 'store' && typeof storeEngine !== 'undefined') {
        storeEngine.loadProductsFromCatalog();
        storeEngine.loadCart();
        storeEngine.renderProducts();
        storeEngine.renderCart();
      }

      if (tabName === 'soy-chico-pet' && typeof piiMaskingEngine !== 'undefined') {
        piiMaskingEngine.renderSoyChicoPetDirectory();
      }

      if (tabName === 'limusina-vip' && typeof limusinaVipEngine !== 'undefined') {
        limusinaVipEngine.renderPlatform();
      }

      if (tabName === 'marketing-command' && typeof marketingCommandCenterEngine !== 'undefined') {
        marketingCommandCenterEngine.render();
      }

      if (tabName === 'clinica' && typeof clinicaEngine !== 'undefined') {
        if (typeof clinicaEngine.syncStaffWithAdminProfiles === 'function') {
          clinicaEngine.syncStaffWithAdminProfiles();
        }
        if (typeof clinicaEngine.renderStaff === 'function') {
          clinicaEngine.renderStaff();
        }
      }

      if (tabName === 'misipet' && window.misipetEngine) {
        if (typeof window.misipetEngine.syncStaffFromAdminProfiles === 'function') {
          window.misipetEngine.syncStaffFromAdminProfiles();
        }
        window.misipetEngine.init();
      }

      if ((tabName === 'pet-status' || tabName === 'dashboard') && typeof petStatusEngine !== 'undefined') {
        if (areaFilter) {
          petStatusEngine.currentFilter = areaFilter;
          const filterBtns = document.querySelectorAll('.pet-filter-btn');
          filterBtns.forEach(btn => {
            if (btn.getAttribute('data-area') === areaFilter) {
              btn.classList.add('active');
              btn.style.background = 'var(--gold-dark, #D4AF37)';
              btn.style.color = '#fff';
            } else {
              btn.classList.remove('active');
              btn.style.background = 'transparent';
              btn.style.color = '#64748b';
            }
          });
        }
        petStatusEngine.render();
      }

      if (tabName === 'call-logs' && typeof callLogs !== 'undefined') {
        callLogs.render();
      }

      if (tabName === 'analytics' && typeof analytics !== 'undefined') {
        analytics.renderAll();
      }

      // Refuerzo de contraste universal Silent Luxury enfocado en la vista activa
      if (window.mrsPetsArch && typeof window.mrsPetsArch.enforceUniversalContrastRule === 'function') {
        window.mrsPetsArch.enforceUniversalContrastRule(activeView);
      }
    });
  }

  bindQuickActions() {
    const btnCall = document.getElementById('btn-quick-call');
    const btnWa = document.getElementById('btn-quick-wa');

    if (btnCall) {
      btnCall.addEventListener('click', () => {
        this.switchTab('playground');
        voiceSim.toggleCall();
      });
    }

    if (btnWa) {
      btnWa.addEventListener('click', () => {
        this.switchTab('playground');
        whatsappSim.sendPreset('¿Cómo va mi perrito Buddy en grooming?');
      });
    }

    const btnToggleCall = document.getElementById('btn-toggle-call');
    if (btnToggleCall) btnToggleCall.addEventListener('click', () => voiceSim.toggleCall());

    const btnMute = document.getElementById('btn-mute');
    if (btnMute) btnMute.addEventListener('click', () => voiceSim.toggleMute());

    const btnTransfer = document.getElementById('btn-transfer');
    if (btnTransfer) btnTransfer.addEventListener('click', () => {
      if (voiceSim.isCallActive) {
        callLogs.openTakeoverModal(1);
      } else {
        this.showToast('Debes iniciar una llamada para solicitar transferencia.', 'warning');
      }
    });
  }

  renderActivityStream() {
    const container = document.getElementById('live-activity-stream');
    if (!container) return;

    container.innerHTML = '';
    this.activityStream.forEach(act => {
      const isWa = act.type === 'whatsapp';
      const icon = isWa ? 'message-square' : 'phone-incoming';
      const iconColor = isWa ? 'var(--whatsapp)' : 'var(--telephony)';

      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '12px';
      div.style.padding = '10px 14px';
      div.style.background = '#f8fafc';
      div.style.borderRadius = 'var(--radius-md)';
      div.style.border = '1px solid rgba(217, 119, 6, 0.15)';

      div.innerHTML = `
        <div style="width:32px; height:32px; border-radius:50%; background:rgba(245, 158, 11, 0.1); display:flex; align-items:center; justify-content:center;">
          <i data-lucide="${icon}" style="width:16px; color:${iconColor};"></i>
        </div>
        <div style="flex:1; font-size:0.85rem; color:var(--obsidian-black);">${act.text}</div>
        <div style="font-size:0.72rem; color:var(--text-muted);">${act.time}</div>
      `;
      container.appendChild(div);
    });

    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'error') iconName = 'x-circle';

    toast.innerHTML = `
      <i data-lucide="${iconName}" style="width:20px;"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      try { lucide.createIcons(); } catch(e) {}
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (typeof toast.remove === 'function') {
          toast.remove();
        } else if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      modal.style.removeProperty('display');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
    }

    // Refuerzo de contraste universal Silent Luxury ("Fondo oscuro -> Letras claras")
    if (window.mrsPetsArch && typeof window.mrsPetsArch.enforceUniversalContrastRule === 'function') {
      setTimeout(() => window.mrsPetsArch.enforceUniversalContrastRule(), 30);
    }

    // Instrument Funnel Telemetry Timer for Web Reservation (FUN-04)
    if (modalId === 'hotel-booking-modal' || modalId === 'clinic-booking-modal' || modalId === 'grooming-booking-modal') {
      if (window.sixSigmaTelemetryEngine) {
        window._activeFunnelTimer = window.sixSigmaTelemetryEngine.startTimer('FUN-04', { modalId, action: 'start_booking_flow' });
      }
    }

    if (modalId === 'parametric-matrix-modal' && window.parametricMatrixEngine) {
      window.parametricMatrixEngine.renderMatrixUI('parametric-matrix-modal-body');
    }

    if (modalId === 'telemetry-live-modal' && window.sixSigmaTelemetryEngine) {
      window.sixSigmaTelemetryEngine.renderTelemetryLogUI('telemetry-live-modal-body');
    }

    if (modalId === 'create-staff-modal' || modalId === 'edit-staff-modal' || modalId === 'manage-roles-modal' || modalId === 'manage-stage-times-modal') {
      if (window.adminEngine) {
        if (typeof window.adminEngine.populateAllRoleSelectors === 'function') {
          window.adminEngine.populateAllRoleSelectors();
        }
        if (modalId === 'manage-roles-modal' && typeof window.adminEngine.renderRolesList === 'function') {
          window.adminEngine.renderRolesList();
        }
        if (modalId === 'manage-stage-times-modal' && typeof window.adminEngine.renderStageTimesConfig === 'function') {
          window.adminEngine.renderStageTimesConfig();
        }
      }
    }

    if (modalId === 'add-product-modal') {
      if (window.adminEngine) {
        window.adminEngine.permissionMode = 'edit';
        window.adminEngine.isEnterpriseAuthenticated = true;
        const barcodeInput = document.getElementById('admin-prod-barcode');
        if (barcodeInput && !barcodeInput.value) {
          window.adminEngine.generateAutoBarcode();
        }
      }
      if (window.authEngine && window.authEngine.userRole !== 'staff') {
        window.authEngine.userRole = 'staff';
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('opacity', '0', 'important');
      modal.style.setProperty('visibility', 'hidden', 'important');
      modal.style.setProperty('pointer-events', 'none', 'important');
    }

    // Stop Funnel Telemetry Timer if closed before booking
    if ((modalId === 'hotel-booking-modal' || modalId === 'clinic-booking-modal' || modalId === 'grooming-booking-modal') && window._activeFunnelTimer) {
      if (window.sixSigmaTelemetryEngine) {
        window.sixSigmaTelemetryEngine.stopTimer(window._activeFunnelTimer, { completed: false, closedReason: 'user_cancelled' });
      }
      window._activeFunnelTimer = null;
    }

    // ZERO-TRUST GATE: Si el visitante NO está autenticado y se cierra un modal de registro o acceso,
    // NUNCA exponer el app-container ni la cuenta activa por defecto. Retornar obligatoriamente al Portal Concierge.
    if (!window.authEngine || !window.authEngine.isAuthenticated) {
      const portalModals = [
        'enterprise-login-modal',
        'registration-modal',
        'vip-client-lookup-modal',
        'client-profile-pin-modal',
        'booking-modal-clinica',
        'booking-modal-grooming',
        'booking-modal-hotel',
        'clinic-booking-modal',
        'grooming-booking-modal',
        'hotel-booking-modal'
      ];
      if (portalModals.includes(modalId)) {
        // PERO: Si el usuario está cambiando de área de reserva, verificando PIN o está activo en rol de cliente/visitante, NO bloquear la app
        if (window._isSwitchingBookingArea || window._isVerifyingProfilePin) return;
        if (window.authEngine && (window.authEngine.userRole === 'visitor' || window.authEngine.userRole === 'guest' || window.authEngine.userRole === 'client' || window.authEngine.currentVipPetId)) {
          return;
        }
        localStorage.removeItem('mrs_pets_skip_splash');
        if (window.authEngine && typeof window.authEngine.showConciergePortal === 'function') {
          window.authEngine.showConciergePortal();
        }
      }
    }
  }

  showModalDirectHtml(htmlContent, modalId = 'general-modal') {
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      modal.style.setProperty('z-index', '2147483647', 'important');
      modal.innerHTML = `
        <div class="modal-card" style="max-width:820px; width:94%; padding:0; background:transparent !important; border:none !important; box-shadow:none !important; max-height:92vh; overflow-y:auto;">
          <div id="${modalId}-body"></div>
        </div>
      `;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modalId);
        }
      });
      document.body.appendChild(modal);
    }
    const body = document.getElementById(`${modalId}-body`) || modal;
    body.innerHTML = htmlContent;
    this.openModal(modalId);
  }

  playSuccessChime() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // Arpegio de confirmación y éxito Silent Luxury (Fa5, La5, Do6)
      const notes = [
        { time: 0.00, freq: 698.46, dur: 0.14 }, // F5
        { time: 0.09, freq: 880.00, dur: 0.16 }, // A5
        { time: 0.18, freq: 1046.50, dur: 0.35 } // C6
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(0.18, now + n.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur + 0.05);
      });
    } catch(e) {
      // Audio optional / graceful fallback
    }
  }

  /**
   * ============================================================================
   * SISTEMA CENTRAL DE SCREEN POPS TRANSACCIONALES (FEEDBACK VISUAL ANTI-DOBLE CLIC)
   * Modal en primer plano con z-index dominante (2147483647), contraste alto y audio
   * ============================================================================
   */
  showScreenPop(options = {}) {
    let pop = document.getElementById('mrs-pets-transaction-screen-pop');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'mrs-pets-transaction-screen-pop';
      document.body.appendChild(pop);
    }

    // Audio chime sensorial de éxito
    this.playSuccessChime();

    const title = options.title || '¡Acción Confirmada!';
    const headline = options.headline || 'Transacción Registrada en Base de Datos';
    const badgeText = options.badgeText || 'CONFIRMACIÓN OFICIAL • MRS. PETS VIP';
    const icon = options.icon || '✓';
    const accentColor = options.accentColor || '#10B981';
    const summaryHtml = options.summaryHtml || '';
    const buttons = Array.isArray(options.buttons) ? options.buttons : [];

    pop.className = 'modal-overlay active';
    pop.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(11, 15, 25, 0.88) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    `;

    // Renderizado de botones con tipografía de alto contraste
    const buttonsHtml = buttons.map((b, idx) => {
      const isPrimary = b.primary !== false;
      const bg = isPrimary
        ? `background:linear-gradient(135deg, ${accentColor}, #047857) !important; color:#FFFFFF !important; border:2px solid #000000 !important; box-shadow:0 6px 18px rgba(16,185,129,0.35);`
        : `background:#F1F5F9 !important; color:#000000 !important; border:2px solid #000000 !important;`;
      return `
        <button type="button" id="screen-pop-btn-${idx}" class="btn ${isPrimary ? 'btn-primary' : 'btn-secondary'}" style="padding:14px 20px; font-weight:900; font-size:0.95rem; border-radius:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; flex:1; min-width:180px; ${bg}">
          ${b.text}
        </button>
      `;
    }).join('');

    pop.innerHTML = `
      <div class="modal-card" style="max-width:680px; width:92%; max-height:90vh; overflow-y:auto; padding:32px 28px; border-radius:26px; text-align:center; background:#FFFFFF !important; color:#000000 !important; border:3px solid #000000 !important; box-shadow:0 30px 80px rgba(0,0,0,0.6); position:relative; z-index:2147483647; animation: modalPopAnim 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        
        <button type="button" class="btn btn-secondary btn-sm" onclick="app.closeScreenPop()" style="position:absolute; top:18px; right:18px; border-radius:50%; width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.1rem; cursor:pointer; background:#F1F5F9 !important; border:2px solid #000000 !important; color:#000000 !important;">✕</button>

        <div style="width:76px; height:76px; border-radius:50%; background:linear-gradient(135deg, ${accentColor}, #059669); color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-size:2.6rem; margin:0 auto 14px auto; box-shadow:0 8px 24px rgba(16,185,129,0.4); border:2.5px solid #000000;">
          ${icon}
        </div>

        <div style="display:inline-flex; align-items:center; gap:6px; background:#ECFDF5 !important; border:2px solid #000000 !important; color:#000000 !important; font-size:0.75rem; font-weight:900; padding:4px 14px; border-radius:999px; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:8px;">
          ${badgeText}
        </div>

        <h2 style="font-size:1.6rem; font-weight:900; color:#000000 !important; margin:0 0 6px 0; letter-spacing:-0.02em; line-height:1.25;">
          ${headline}
        </h2>

        <div style="font-size:0.92rem; color:#000000 !important; font-weight:700; margin:0 0 18px 0; line-height:1.45;">
          ${title}
        </div>

        <div style="text-align:left; margin-bottom:20px; color:#000000 !important;">
          ${summaryHtml}
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:16px;">
          ${buttonsHtml}
        </div>
      </div>
    `;

    // Vincular handlers a botones
    buttons.forEach((b, idx) => {
      const btnEl = document.getElementById(`screen-pop-btn-${idx}`);
      if (btnEl && typeof b.onClick === 'function') {
        btnEl.onclick = (e) => {
          this.closeScreenPop();
          b.onClick(e);
        };
      }
    });

    // Reforzar contraste universal
    if (window.mrsPetsArch && typeof window.mrsPetsArch.enforceUniversalContrastRule === 'function') {
      setTimeout(() => window.mrsPetsArch.enforceUniversalContrastRule(), 30);
    }
  }

  closeScreenPop() {
    const pop = document.getElementById('mrs-pets-transaction-screen-pop');
    if (pop) {
      pop.classList.remove('active');
      pop.style.setProperty('display', 'none', 'important');
      pop.style.setProperty('opacity', '0', 'important');
      pop.style.setProperty('visibility', 'hidden', 'important');
      pop.style.setProperty('pointer-events', 'none', 'important');
    }
  }

  /**
   * Control Anti-Doble Clic (Anti-Jitter) para botones transaccionales
   */
  setButtonBusy(btn, loadingText = '⏳ Procesando...') {
    if (!btn) return false;
    if (btn.dataset.busy === 'true' || btn.disabled) return false;
    btn.dataset.busy = 'true';
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = loadingText;
    btn.classList.add('btn-processing-anti-jitter');
    btn.style.opacity = '0.75';
    btn.style.cursor = 'not-allowed';
    return true;
  }

  resetButton(btn) {
    if (!btn) return;
    btn.disabled = false;
    btn.dataset.busy = 'false';
    btn.classList.remove('btn-processing-anti-jitter');
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
    }
  }

  openPendingAppointmentsInbox() {
    if (window.adminEngine && typeof window.adminEngine.openPendingAppointmentsInbox === 'function') {
      return window.adminEngine.openPendingAppointmentsInbox();
    }
    if (window.clinicaEngine && typeof window.clinicaEngine.openPendingAppointmentsInbox === 'function') {
      return window.clinicaEngine.openPendingAppointmentsInbox();
    }
    this.switchTab('admin', true);
    const acc = document.getElementById('acc-pending');
    if (acc) {
      acc.open = true;
      acc.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

const app = new App();
window.app = app;
window.showTab = (tab) => app.switchTab(tab);
window.showTransactionScreenPop = (options) => app.showScreenPop(options);
window.openPendingAppointmentsInbox = () => app.openPendingAppointmentsInbox();
document.addEventListener('DOMContentLoaded', () => app.init());
