/* ==========================================================================
   MRS. PETS AUTHENTICATION ENGINE (Orion Splash & Access Control)
   Center: Big & Little Dogs, C.A. (RIF J-40120233-0) • Maracaibo, Venezuela
   ========================================================================== */

class AuthEngine {
  constructor() {
    this.isAuthenticated = false;
    this.userRole = null;
    this.userName = '';
    this.isVideoFinished = false;
  }

  getCurrentUser() {
    if (this.userRole === 'candidate' || this.userRole === 'visitor' || this.userRole === 'guest' || !this.isAuthenticated || this.userRole !== 'client') {
      return {
        isAuthenticated: this.isAuthenticated && this.userRole === 'staff',
        role: this.userRole || 'visitor',
        userName: this.userName || 'Visitante VIP',
        tutorName: '',
        petName: '',
        phone: '',
        email: '',
        petId: null,
        petObj: null
      };
    }
    let pet = null;
    const activePetId = this.currentVipPetId || localStorage.getItem('mrs_pets_active_vip_patient_id');
    if (activePetId) {
      if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
        pet = window.adminEngine.patientsStatus.find(p => p.id === activePetId);
      }
      if (!pet && window.petStatusEngine && Array.isArray(window.petStatusEngine.pets)) {
        pet = window.petStatusEngine.pets.find(p => p.id === activePetId);
      }
    }

    // Fallback: Si no se halló por ID pero hay sesión de cliente activa con userName
    if (!pet && this.userName && this.userRole === 'client') {
      const cleanOwner = this.userName.split(' (Tutor')[0].replace(/\(.*?\)/g, '').trim().toLowerCase();
      if (cleanOwner) {
        if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
          pet = window.adminEngine.patientsStatus.find(p => (p.owner || p.ownerName || '').toLowerCase().includes(cleanOwner));
        }
        if (!pet && window.petStatusEngine && Array.isArray(window.petStatusEngine.pets)) {
          pet = window.petStatusEngine.pets.find(p => (p.owner || p.ownerName || '').toLowerCase().includes(cleanOwner));
        }
      }
    }

    if (pet) {
      return {
        isAuthenticated: true,
        role: this.userRole || 'client',
        userName: this.userName || pet.owner || pet.ownerName,
        tutorName: pet.owner || pet.ownerName || '',
        petName: pet.name || pet.petName || '',
        species: pet.species || '',
        phone: pet.ownerPhone || pet.phone || '',
        email: pet.email || '',
        petId: pet.id,
        petObj: pet
      };
    }

    if (this.isAuthenticated && this.userName) {
      const cleanName = this.userName.split(' (Tutor')[0].replace(/\(.*?\)/g, '').trim();
      return {
        isAuthenticated: true,
        role: this.userRole || 'client',
        userName: this.userName,
        tutorName: (this.userRole === 'client' ? cleanName : ''),
        petName: '',
        phone: '',
        email: '',
        petId: null,
        petObj: null
      };
    }

    return null;
  }

  init() {
    console.log("Mrs. Pets AuthEngine Initialized.");
    this.setupVideoEventListener();
    this.setupAudioClickUnmute();

    // Reset lingering pin authentications to guarantee zero trust
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('mrs_pets_pin_auth_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch(e) {}

    const rawHash = (window.location.hash || '').replace('#', '').replace('tab-', '').trim();
    const hasHash = rawHash.length > 0 && rawHash !== 'welcome';

    // 🛡️ Visita a la raíz o bienvenida: Limpiar banderas residuales para garantizar que siempre pase por video y portal de credenciales
    if (!hasHash || rawHash === 'welcome') {
      sessionStorage.removeItem('mrs_pets_visitor_session');
      localStorage.removeItem('mrs_pets_skip_splash');
      sessionStorage.removeItem('mrs_pets_skip_splash');
      sessionStorage.removeItem('mrs_pets_enterprise_authenticated');
      sessionStorage.removeItem('mrs_pets_staff_role');
      sessionStorage.removeItem('mrs_pets_client_authenticated');
      if (localStorage.getItem('mrs_pets_auth_role') === 'visitor') {
        localStorage.removeItem('mrs_pets_auth_role');
        localStorage.removeItem('mrs_pets_auth_name');
      }
    }

    // 🛡️ RESTAURACIÓN DE SESIÓN PERSISTENTE (Solo si hay sesión activa confirmada con credenciales en la pestaña)
    const isEntSession = sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true';
    const isClientSession = sessionStorage.getItem('mrs_pets_client_authenticated') === 'true';
    const isVisitorSession = sessionStorage.getItem('mrs_pets_visitor_session') === 'true';
    const storedRole = localStorage.getItem('mrs_pets_auth_role');
    const storedName = localStorage.getItem('mrs_pets_auth_name');
    const storedPetId = localStorage.getItem('mrs_pets_active_vip_patient_id');
    const hasSkipped = localStorage.getItem('mrs_pets_skip_splash') === 'true';

    // 1. Sesión Staff Empresarial activa en esta pestaña
    if (isEntSession && hasSkipped) {
      this.isAuthenticated = true;
      this.userRole = 'staff';
      this.userName = storedName || 'Staff Administrativo';
      localStorage.setItem('mrs_pets_skip_splash', 'true');
      if (document.body) {
        document.body.classList.add('enterprise-view-mode');
        document.body.classList.remove('customer-view-mode');
      }
      if (window.adminEngine) {
        window.adminEngine.isEnterpriseAuthenticated = true;
        window.adminEngine.activeRole = sessionStorage.getItem('mrs_pets_staff_role') || 'admin';
        window.adminEngine.viewEnvironment = 'enterprise';
      }
      console.log("[AuthEngine] Sesión de Staff restaurada correctamente.");
      this.hidePortalAndShowApp();
      return;
    }

    // 2. Sesión Cliente VIP activa en esta pestaña ("Soy un Chico Mrs Pets")
    if (isClientSession && hasSkipped) {
      this.isAuthenticated = true;
      this.userRole = 'client';
      this.userName = storedName || localStorage.getItem('mrs_pets_active_customer_name') || 'Tutor VIP';
      this.currentVipPetId = storedPetId;
      localStorage.setItem('mrs_pets_skip_splash', 'true');
      if (window.adminEngine) {
        window.adminEngine.viewEnvironment = 'customer';
        window.adminEngine.isEnterpriseAuthenticated = false;
      }
      console.log("[AuthEngine] Sesión de Cliente VIP restaurada correctamente.");
      this.hidePortalAndShowApp();
      return;
    }

    // 3. Enlace profundo directo con sesión confirmada
    if (hasHash && hasSkipped && (isEntSession || isClientSession)) {
      this.hidePortalAndShowApp();
      return;
    }

    // 4. Visita a la raíz o bienvenida sin sesión confirmada: Limpiar banderas residuales para garantizar video y concierge
    localStorage.removeItem('mrs_pets_skip_splash');
    sessionStorage.removeItem('mrs_pets_skip_splash');
    sessionStorage.removeItem('mrs_pets_visitor_session');
    if (storedRole === 'visitor') {
      localStorage.removeItem('mrs_pets_auth_role');
      localStorage.removeItem('mrs_pets_auth_name');
    }

    // Mostrar video splash cinematográfico y programar transición a Concierge VIP (confirmación de usuario y clave)
    this.showSplashVideo();
  }

  setupAudioClickUnmute() {
    const splash = document.getElementById('auth-splash-screen');
    if (splash) {
      splash.addEventListener('click', (e) => {
        const video = document.getElementById('brand-splash-video');
        if (video && video.muted && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
          this.toggleAudio();
        }
      });
    }
  }

  toggleAudio() {
    const video = document.getElementById('brand-splash-video');
    const audioBtn = document.getElementById('toggle-audio-btn');
    if (video) {
      video.muted = !video.muted;
      if (audioBtn) {
        audioBtn.innerHTML = video.muted ? '🔊 Activar Audio' : '🔇 Silenciar Audio';
        audioBtn.style.background = video.muted ? 'rgba(212,175,55,0.9)' : 'rgba(74,107,93,0.9)';
        audioBtn.style.color = video.muted ? '#121214' : '#FFFFFF';
      }
      if (!video.muted) {
        video.play().catch(e => console.warn("Audio play gesture catch:", e));
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(video.muted ? '🔇 Video silenciado' : '🔊 Audio activado', 'info');
      }
    }
  }

  async saveVideoFileToDB(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const dbReq = indexedDB.open('MrsPetsVideoDB', 1);
      dbReq.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos');
        }
      };
      dbReq.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('videos', 'readwrite');
        const payload = {
          buffer: arrayBuffer,
          type: file.type || 'video/mp4',
          name: file.name
        };
        const putReq = tx.objectStore('videos').put(payload, 'splash_mp4');
        putReq.onsuccess = () => {
          localStorage.setItem('mrs_pets_video_mode', 'file');
          console.log("MP4 video file permanently saved in IndexedDB browser storage.");
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast("💾 Video guardado permanentemente en memoria del navegador.", "success");
          }
        };
        putReq.onerror = (err) => {
          console.error("IndexedDB put error:", err);
        };
      };
    } catch (err) {
      console.warn("Could not store video in IndexedDB:", err);
    }
  }

  saveVideoUrlToStorage(url) {
    localStorage.setItem('mrs_pets_video_mode', 'url');
    localStorage.setItem('mrs_pets_saved_url', url);
  }

  checkAndLoadSavedVideo() {
    const mode = localStorage.getItem('mrs_pets_video_mode');
    if (mode === 'url') {
      const url = localStorage.getItem('mrs_pets_saved_url');
      if (url) {
        console.log("Auto-loading saved video URL from localStorage:", url);
        this.loadVideoFromUrl(url, false);
        return;
      }
    }

    const videoEl = document.getElementById('brand-splash-video');
    const iframeEl = document.getElementById('brand-splash-iframe');

    if (iframeEl) {
      iframeEl.style.display = 'none';
      iframeEl.src = '';
    }

    if (videoEl) {
      videoEl.style.display = 'block';
      if (typeof videoEl.load === 'function') {
        try { videoEl.load(); } catch(e) {}
      }
      videoEl.muted = true;
      if (typeof videoEl.play === 'function') {
        try {
          const playPromise = videoEl.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.warn("Multi-source video play attempt:", e);
            });
          }
        } catch(e) {}
      }
    }
  }

  applyVideoBlob(blob) {
    const splash = document.getElementById('auth-splash-screen');
    const portal = document.getElementById('access-links-portal');
    
    if (splash) {
      splash.style.display = 'block';
      splash.style.visibility = 'visible';
      splash.style.opacity = '1';
    }
    if (portal) {
      portal.style.display = 'none';
      portal.style.opacity = '0';
    }

    this.isVideoFinished = false;

    const videoEl = document.getElementById('brand-splash-video');
    const iframeEl = document.getElementById('brand-splash-iframe');

    if (iframeEl) {
      iframeEl.style.display = 'none';
      iframeEl.src = '';
    }

    if (videoEl) {
      try {
        videoEl.style.display = 'block';
        videoEl.pause();
        while (videoEl.firstChild) {
          videoEl.removeChild(videoEl.firstChild);
        }
        const videoURL = URL.createObjectURL(blob);
        videoEl.src = videoURL;
        videoEl.load();
        videoEl.muted = true;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Autoplay error, enforcing muted playback:", err);
            videoEl.muted = true;
            videoEl.play().catch(e => console.error("Final play attempt failed:", e));
          });
        }
      } catch (err) {
        console.error("Error applying video blob:", err);
      }
    }
  }

  clearSavedVideo() {
    localStorage.removeItem('mrs_pets_video_mode');
    localStorage.removeItem('mrs_pets_saved_url');
    try {
      const dbReq = indexedDB.open('MrsPetsVideoDB', 1);
      dbReq.onsuccess = (e) => {
        const db = e.target.result;
        if (db.objectStoreNames.contains('videos')) {
          const tx = db.transaction('videos', 'readwrite');
          tx.objectStore('videos').delete('splash_mp4');
        }
      };
    } catch (e) {}
    alert("Video guardado eliminado. Se restablecerá el reproductor por defecto.");
    location.reload();
  }

  setupVideoEventListener() {
    const video = document.getElementById('brand-splash-video');
    if (video) {
      video.addEventListener('ended', () => {
        const splash = document.getElementById('auth-splash-screen');
        if (splash && splash.style.display !== 'none' && splash.style.visibility !== 'hidden' && !this.isVideoFinished) {
          console.log("Video ended at 10s. Transitioning to Paso 2: Portal Concierge VIP.");
          this.isVideoFinished = true;
          if (this.splashTimer) {
            clearTimeout(this.splashTimer);
            this.splashTimer = null;
          }
          this.showConciergePortal();
        }
      });

      video.addEventListener('timeupdate', () => {
        if (video.duration && video.currentTime >= video.duration - 0.25 && !this.isVideoFinished) {
          const splash = document.getElementById('auth-splash-screen');
          if (splash && splash.style.display !== 'none' && splash.style.visibility !== 'hidden') {
            console.log("Video reached end (timeupdate). Transitioning to Paso 2: Portal Concierge VIP.");
            this.isVideoFinished = true;
            if (this.splashTimer) {
              clearTimeout(this.splashTimer);
              this.splashTimer = null;
            }
            this.showConciergePortal();
          }
        }
      });

      let errorRetryCount = 0;
      video.addEventListener('error', (e) => {
        console.warn("Video resource loading notice:", e);
        if (errorRetryCount < 2) {
          errorRetryCount++;
          setTimeout(() => {
            try {
              if (!video.src || video.src.endsWith('video.mp4')) {
                video.src = 'assets/mrs_pets_flow_video.mp4';
              } else {
                video.src = 'video.mp4';
              }
              video.load();
              video.play().catch(() => {});
            } catch (err) {}
          }, 350);
          return;
        }
        const splash = document.getElementById('auth-splash-screen');
        if (splash && splash.style.display !== 'none' && splash.style.visibility !== 'hidden' && !this.isVideoFinished) {
          this.showConciergePortal();
        }
      });
    }

    // Keyboard shortcut listener: Space, Enter, Esc, ArrowRight transition to Concierge Portal
    document.addEventListener('keydown', (e) => {
      const splash = document.getElementById('auth-splash-screen');
      if (splash && splash.style.display !== 'none' && splash.style.visibility !== 'hidden') {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape' || e.key === 'ArrowRight') {
          e.preventDefault();
          this.showConciergePortal();
        }
      }
    });
  }

  isEnterpriseStaffActive() {
    const portal = typeof document !== 'undefined' ? document.getElementById('access-links-portal') : null;
    if (portal && (portal.classList.contains('active') || (portal.style.display !== 'none' && portal.style.visibility !== 'hidden'))) {
      return false;
    }
    if (this.userRole === 'staff' && this.isAuthenticated) return true;
    if (window.adminEngine && window.adminEngine.isEnterpriseAuthenticated) return true;
    try {
      if (sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true' && this.isAuthenticated) return true;
    } catch (e) {}
    return false;
  }

  async uploadVideoToServer(file) {
    if (!this.isEnterpriseStaffActive()) {
      console.warn("Upload rejected: Solo el perfil Staff Empresarial puede cargar videos.");
      return;
    }
    try {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast("⏳ Guardando video en el servidor local de Mrs. Pets...", "info");
      }
      const response = await fetch('/upload-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Staff-Control-Key': 'nicole'
        },
        body: file
      });
      const resData = await response.json();
      if (resData && resData.status === 'success') {
        console.log("Video saved to server assets/mrs_pets_flow_video.mp4");
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast("✅ ¡Video guardado permanentemente en el servidor local!", "success");
        }
      } else if (resData && resData.error) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`🔒 ${resData.error}`, "danger");
        }
      }
    } catch (err) {
      console.warn("Upload to server endpoint warning (fallback to browser DB):", err);
    }
  }

  handleLocalVideoSelect(event) {
    if (!this.isEnterpriseStaffActive()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 La carga de videos y fotos es exclusiva para el perfil Staff Empresarial.', 'warning');
      } else {
        alert('🔒 La carga de videos y fotos es exclusiva para el perfil Staff Empresarial.');
      }
      return;
    }
    const file = (event && event.target && event.target.files) ? event.target.files[0] : null;
    if (!file) return;
    this.applyVideoFile(file, true);
  }

  openStaffVideoModal() {
    if (!this.isEnterpriseStaffActive()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Función exclusiva para el perfil Staff Empresarial.', 'danger');
      }
      return;
    }

    let modal = document.getElementById('staff-video-management-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'staff-video-management-modal';
      modal.className = 'luxury-modal';
      modal.innerHTML = `
        <div class="luxury-modal-content max-w-700" style="background:#1C1C1E; border:2px solid #D4AF37; border-radius:18px; color:#FFFFFF; padding:24px;">
          <div class="luxury-modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(212,175,55,0.3); padding-bottom:12px; margin-bottom:18px;">
            <h3 style="margin:0; font-size:1.25rem; font-weight:900; color:#D4AF37; display:flex; align-items:center; gap:8px;">
              <span>🎬 Carga de Video Oficial (Staff Empresarial)</span>
            </h3>
            <button type="button" class="modal-close-btn" onclick="document.getElementById('staff-video-management-modal').style.display='none'" style="background:none; border:none; color:#CBD5E1; font-size:1.5rem; cursor:pointer;">&times;</button>
          </div>
          <div class="luxury-modal-body">
            <p style="font-size:0.86rem; color:#CBD5E1; line-height:1.45; margin:0 0 16px 0;">
              Seleccione el archivo de video (.mp4, .mov, .webm) para actualizar el fondo corporativo en pantalla completa de Mrs. Pets Maracaibo.
            </p>
            <div style="border:2px dashed #D4AF37; border-radius:14px; padding:24px; text-align:center; background:rgba(212,175,55,0.05); cursor:pointer; margin-bottom:18px;" onclick="document.getElementById('staff-dedicated-video-input').click()">
              <div style="font-size:2.4rem; color:#D4AF37; margin-bottom:8px;">📁 🎥</div>
              <div style="font-weight:800; font-size:0.95rem; color:#FFFFFF;" id="staff-video-selected-name">Haga clic para seleccionar archivo de video (.mp4)</div>
              <div style="font-size:0.75rem; color:#94A3B8; margin-top:4px;">Se actualizará localmente y en el almacenamiento del servidor</div>
              <input type="file" id="staff-dedicated-video-input" accept="video/*,.mp4,.mov,.webm" style="display:none;" onchange="window.authEngine.handleStaffVideoUpload(event)">
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <button type="button" onclick="window.authEngine.resetDefaultVideo()" style="background:#2C2C2E; color:#CBD5E1; border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:10px 16px; font-weight:700; font-size:0.82rem; cursor:pointer;">
                🔄 Restablecer Predeterminado
              </button>
              <button type="button" onclick="document.getElementById('staff-video-management-modal').style.display='none'" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; border:none; border-radius:10px; padding:10px 20px; font-weight:900; font-size:0.85rem; cursor:pointer;">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
  }

  handleStaffVideoUpload(event) {
    const file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    const nameLabel = document.getElementById('staff-video-selected-name');
    if (nameLabel) {
      nameLabel.innerHTML = `<strong>${file.name}</strong> (${(file.size / (1024 * 1024)).toFixed(2)} MB) <span style="color:#10b981;">✓ Listo para aplicar</span>`;
    }
    this.applyVideoFile(file, true);
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🎬 Video ${file.name} cargado exitosamente por Staff Empresarial.`, 'success');
    }
  }

  resetDefaultVideo() {
    if (!this.isEnterpriseStaffActive()) return;
    try {
      localStorage.removeItem('mrs_pets_custom_video_name');
      const req = indexedDB.deleteDatabase(this.dbName);
      req.onsuccess = () => {
        console.log("Custom video DB deleted, restoring default video.");
        const videoEl = document.getElementById('brand-splash-video');
        if (videoEl) {
          videoEl.src = 'assets/mrs_pets_flow_video.mp4';
          videoEl.load();
          videoEl.play().catch(e => console.warn(e));
        }
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('🔄 Video corporativo predeterminado restaurado.', 'info');
        }
        const modal = document.getElementById('staff-video-management-modal');
        if (modal) modal.style.display = 'none';
      };
    } catch (e) {
      console.warn("Error resetting video:", e);
    }
  }

  applyVideoFile(file, saveToDb = true) {
    console.log("Applying video file:", file.name, file.type, file.size);

    if (saveToDb) {
      this.saveVideoFileToDB(file);
      this.uploadVideoToServer(file);
    }

    const splash = document.getElementById('auth-splash-screen');
    const portal = document.getElementById('access-links-portal');
    
    if (splash) {
      splash.style.display = 'block';
      splash.style.visibility = 'visible';
      splash.style.opacity = '1';
    }
    if (portal) {
      portal.style.display = 'none';
      portal.style.opacity = '0';
    }

    this.isVideoFinished = false;

    const videoEl = document.getElementById('brand-splash-video');
    const iframeEl = document.getElementById('brand-splash-iframe');

    if (iframeEl) {
      iframeEl.style.display = 'none';
      iframeEl.src = '';
    }

    if (videoEl) {
      try {
        videoEl.style.display = 'block';
        videoEl.pause();
        
        while (videoEl.firstChild) {
          videoEl.removeChild(videoEl.firstChild);
        }

        const videoURL = URL.createObjectURL(file);
        videoEl.src = videoURL;
        videoEl.load();
        videoEl.muted = true;
        
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log("Local video playing successfully.");
          }).catch(err => {
            console.warn("Autoplay error, enforcing muted playback:", err);
            videoEl.muted = true;
            videoEl.play().catch(e => console.error("Final play attempt failed:", e));
          });
        }
        
        if (saveToDb && window.app && typeof window.app.showToast === 'function') {
          window.app.showToast("💾 Video guardado permanentemente en el navegador.", "success");
        }
      } catch (err) {
        console.error("Error applying video file:", err);
        alert("⚠️ Error al procesar el archivo. Asegúrate de seleccionar un archivo de video .mp4 válido.");
      }
    }
  }

  handleUrlVideoSubmit(inputId = 'splash-video-url-input') {
    const input = document.getElementById(inputId) || document.getElementById('splash-video-url-input') || document.getElementById('portal-video-url-input');
    const url = input ? input.value.trim() : '';
    if (!url) {
      alert("Por favor pega la URL o enlace del video.");
      return;
    }
    this.loadVideoFromUrl(url, true);
  }

  loadVideoFromUrl(url, saveToStorage = true) {
    if (!url) return;

    if (saveToStorage) {
      this.saveVideoUrlToStorage(url);
    }

    const splash = document.getElementById('auth-splash-screen');
    const portal = document.getElementById('access-links-portal');
    const videoEl = document.getElementById('brand-splash-video');
    const iframeEl = document.getElementById('brand-splash-iframe');

    if (splash) {
      splash.style.display = 'block';
      splash.style.visibility = 'visible';
      splash.style.opacity = '1';
    }
    if (portal) {
      portal.style.display = 'none';
      portal.style.opacity = '0';
    }

    this.isVideoFinished = false;

    if (url.includes('flow.google.com') || url.includes('embed') || (url.startsWith('http') && !url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i))) {
      if (videoEl) {
        videoEl.pause();
        videoEl.style.display = 'none';
      }
      if (iframeEl) {
        iframeEl.style.display = 'block';
        iframeEl.src = url;
      }
    } else {
      if (iframeEl) {
        iframeEl.style.display = 'none';
        iframeEl.src = '';
      }
      if (videoEl) {
        videoEl.style.display = 'block';
        videoEl.pause();
        while (videoEl.firstChild) videoEl.removeChild(videoEl.firstChild);
        videoEl.src = url;
        videoEl.load();
        videoEl.muted = true;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn("Video URL play error:", e));
        }
      }
    }

    if (saveToStorage && window.app && typeof window.app.showToast === 'function') {
      window.app.showToast("💾 Enlace de video guardado en la memoria.", "info");
    }
  }

  showConciergePortal() {
    if (this.splashTimer) {
      clearTimeout(this.splashTimer);
      this.splashTimer = null;
    }
    this.isVideoFinished = true;
    if (typeof document !== 'undefined' && document.documentElement && document.documentElement.classList) {
      document.documentElement.classList.remove('splash-bypassed');
    }
    if (document.body) {
      document.body.style.backgroundColor = '#121214';
      document.body.classList.remove('enterprise-view-mode');
      document.body.classList.add('customer-view-mode');
    }
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }

    // 🛡️ ZERO-TRUST STAFF RESET:
    // Al cargar o regresar al Portal Concierge VIP tras el video, cualquier sesión residual
    // previa de staff en sessionStorage o en memoria debe quedar estrictamente reseteada.
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('mrs_pets_enterprise_authenticated');
      sessionStorage.removeItem('mrs_pets_staff_role');
      sessionStorage.removeItem('mrs_pets_client_authenticated');
      sessionStorage.removeItem('mrs_pets_visitor_session');
    }
    if (window.adminEngine) {
      window.adminEngine.isEnterpriseAuthenticated = false;
      window.adminEngine.activeRole = null;
      if (typeof window.adminEngine.setEnvironment === 'function') {
        window.adminEngine.viewEnvironment = 'customer';
      }
    }
    this.isAuthenticated = false;
    this.userRole = null;

    const splash = document.getElementById('auth-splash-screen');
    const portal = document.getElementById('access-links-portal');
    const appContainer = document.getElementById('app-container');

    const videoEl = document.getElementById('brand-splash-video');
    if (videoEl) {
      try {
        videoEl.pause();
        videoEl.currentTime = 0;
      } catch(e) {}
    }

    // Revelar Portal Concierge VIP sin dejar ver el fondo blanco del body
    if (portal) {
      portal.scrollTop = 0;
      portal.classList.add('active');
      portal.style.transition = 'none';
      portal.style.display = 'block';
      portal.style.setProperty('display', 'block', 'important');
      portal.style.setProperty('align-items', 'center', 'important');
      portal.style.setProperty('justify-content', 'flex-start', 'important');
      portal.style.setProperty('visibility', 'visible', 'important');
      portal.style.setProperty('opacity', '1', 'important');
      portal.style.setProperty('pointer-events', 'auto', 'important');
      portal.style.setProperty('z-index', '100000', 'important');

      const loginView = document.getElementById('portal-view-login');
      if (loginView) loginView.style.display = 'block';
      const registerView = document.getElementById('portal-view-register');
      if (registerView) registerView.style.display = 'none';
      const cardContainer = document.getElementById('portal-card-container');
      if (cardContainer) {
        cardContainer.style.maxWidth = '580px';
        cardContainer.style.margin = 'auto';
      }

      // Mantener la visualización arriba para presentar las opciones VIP prioritarias
      if (portal) {
        portal.scrollTop = 0;
      }
    }

    if (splash) {
      splash.style.transition = 'opacity 0.3s ease';
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      setTimeout(() => {
        if (splash && this.isVideoFinished) {
          splash.style.setProperty('display', 'none', 'important');
          splash.style.setProperty('pointer-events', 'none', 'important');
        }
      }, 300);
    }

    if (appContainer) {
      appContainer.style.setProperty('display', 'none', 'important');
      appContainer.style.opacity = '0';
      appContainer.style.visibility = 'hidden';
    }
  }

  closeConciergePortal() {
    if (this.splashTimer) {
      clearTimeout(this.splashTimer);
      this.splashTimer = null;
    }
    const portal = document.getElementById('access-links-portal');
    if (portal) {
      portal.classList.remove('active');
      portal.style.transition = 'opacity 0.25s ease';
      portal.style.display = 'none';
      portal.style.setProperty('display', 'none', 'important');
      portal.style.opacity = '0';
      portal.style.visibility = 'hidden';
      portal.style.setProperty('pointer-events', 'none', 'important');
    }

    const isStaffSession = (
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true') ||
      (window.adminEngine && window.adminEngine.isEnterpriseAuthenticated) ||
      (this.userRole === 'staff' && this.isAuthenticated)
    );

    if (isStaffSession) {
      this.isAuthenticated = true;
      this.userRole = 'staff';
      this.userName = sessionStorage.getItem('mrs_pets_auth_name') || localStorage.getItem('mrs_pets_auth_name') || 'Staff Administrativo';
      if (document.body) {
        document.body.classList.add('enterprise-view-mode');
        document.body.classList.remove('customer-view-mode');
      }
      if (window.adminEngine) {
        window.adminEngine.isEnterpriseAuthenticated = true;
        window.adminEngine.viewEnvironment = 'enterprise';
      }
    } else if (!this.isAuthenticated) {
      this.isAuthenticated = true;
      this.userRole = 'visitor';
      this.userName = 'Visitante VIP';
      sessionStorage.setItem('mrs_pets_visitor_session', 'true');
      localStorage.setItem('mrs_pets_auth_role', 'visitor');
      localStorage.setItem('mrs_pets_auth_name', 'Visitante VIP');
      if (typeof this.updateNavbarRole === 'function') {
        this.updateNavbarRole();
      }
    }
    this.hidePortalAndShowApp();
  }

  showPortal() {
    this.showConciergePortal();
  }

  skipIntro() {
    this.showConciergePortal();
  }

  // 3. Lógica de Transición de Fin de Video (Fade-out 0.8s) y cambio de estado
  finishVideoSplash() {
    this.showConciergePortal();
  }

  switchPortalTab(tabName) {
    const loginView = document.getElementById('portal-view-login');
    const registerView = document.getElementById('portal-view-register');
    const hrCandidateView = document.getElementById('portal-view-hr-candidate');
    const loginBtn = document.getElementById('tab-btn-login');
    const registerBtn = document.getElementById('tab-btn-register');
    const cardContainer = document.getElementById('portal-card-container');
    const portalFooterControls = document.getElementById('portal-footer-video-controls');

    if (hrCandidateView) hrCandidateView.style.display = 'none';
    if (portalFooterControls) portalFooterControls.style.display = 'block';
    if (cardContainer) cardContainer.style.maxWidth = '580px';

    if (tabName === 'register') {
      if (loginView) loginView.style.display = 'none';
      if (registerView) registerView.style.display = 'block';
      if (loginBtn) {
        loginBtn.style.background = 'transparent';
        loginBtn.style.color = '#FBFBFD';
      }
      if (registerBtn) {
        registerBtn.style.background = '#D4AF37';
        registerBtn.style.color = '#121214';
      }
    } else {
      if (loginView) loginView.style.display = 'block';
      if (registerView) registerView.style.display = 'none';
      if (loginBtn) {
        loginBtn.style.background = '#D4AF37';
        loginBtn.style.color = '#121214';
      }
      if (registerBtn) {
        registerBtn.style.background = 'transparent';
        registerBtn.style.color = '#FBFBFD';
      }
    }
  }

  hidePortalAndShowApp() {
    this.isVideoFinished = true;
    if (this.splashTimer) {
      clearTimeout(this.splashTimer);
      this.splashTimer = null;
    }
    localStorage.setItem('mrs_pets_skip_splash', 'true');
    if (typeof document !== 'undefined' && document.documentElement && document.documentElement.classList) {
      document.documentElement.classList.add('splash-bypassed');
    }
    if (document.body) {
      document.body.style.backgroundColor = '';
    }

    // Pause video so background ended events do not trigger portal transition
    const videoEl = document.getElementById('brand-splash-video');
    if (videoEl) {
      try {
        videoEl.pause();
        videoEl.currentTime = 0;
      } catch(e) {}
    }

    const splash = document.getElementById('auth-splash-screen');
    const portal = document.getElementById('access-links-portal');
    const appContainer = document.getElementById('app-container');

    if (portal) {
      portal.classList.remove('active');
      portal.style.transition = 'none';
      portal.style.setProperty('display', 'none', 'important');
      portal.style.opacity = '0';
      portal.style.visibility = 'hidden';
      portal.style.setProperty('pointer-events', 'none', 'important');
    }

    if (splash) {
      splash.style.transition = 'none';
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      splash.style.setProperty('display', 'none', 'important');
      splash.style.setProperty('pointer-events', 'none', 'important');
    }

    if (appContainer) {
      appContainer.style.setProperty('display', 'flex', 'important');
      appContainer.style.opacity = '1';
      appContainer.style.visibility = 'visible';
      appContainer.style.setProperty('pointer-events', 'auto', 'important');
    }

    const isStaff = (this.userRole === 'staff' || (window.adminEngine && window.adminEngine.isEnterpriseAuthenticated) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true'));

    if (isStaff) {
      this.userRole = 'staff';
      if (document.body) {
        document.body.classList.add('enterprise-view-mode');
        document.body.classList.remove('customer-view-mode');
      }
    }

    if (window.adminEngine) {
      if (isStaff) {
        window.adminEngine.setEnvironment('enterprise');
      } else {
        window.adminEngine.setEnvironment('customer');
      }
    }

    if (window.app && typeof window.app.switchTab === 'function') {
      const curTab = (isStaff && (!window.app.currentTab || window.app.currentTab === 'welcome'))
        ? 'admin'
        : (window.app.currentTab || (isStaff ? 'admin' : (this.userRole === 'client' ? 'pet-status' : 'welcome')));
      window.app.switchTab(curTab, true);
    }
  }

  showSplashVideo() {
    const rawHash = (window.location.hash || '').replace('#', '').replace('tab-', '').trim();
    if (rawHash.length > 0 && rawHash !== 'welcome') {
      const isAuth = (
        this.isAuthenticated ||
        sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true' ||
        sessionStorage.getItem('mrs_pets_client_authenticated') === 'true'
      );
      if (isAuth) {
        this.hidePortalAndShowApp();
        return;
      } else {
        try { history.replaceState(null, '', window.location.pathname); } catch(e) {}
      }
    }
    this.isVideoFinished = false;
    if (typeof document !== 'undefined' && document.documentElement && document.documentElement.classList) {
      document.documentElement.classList.remove('splash-bypassed');
    }
    const splash = document.getElementById('auth-splash-screen');
    const portal = document.getElementById('access-links-portal');
    const appContainer = document.getElementById('app-container');

    if (appContainer) {
      appContainer.style.setProperty('display', 'none', 'important');
      appContainer.style.opacity = '0';
      appContainer.style.visibility = 'hidden';
    }
    if (portal) {
      portal.style.setProperty('display', 'none', 'important');
      portal.style.opacity = '0';
      portal.style.visibility = 'hidden';
      portal.classList.remove('active');
    }
    if (splash) {
      splash.style.transition = 'none';
      splash.style.setProperty('display', 'block', 'important');
      splash.style.setProperty('visibility', 'visible', 'important');
      splash.style.setProperty('opacity', '1', 'important');
      splash.style.setProperty('pointer-events', 'auto', 'important');
    }

    this.checkAndLoadSavedVideo();

    // Temporizador de respaldo de navegación: Transición al Paso 2 (Portal Concierge VIP) pasados 10.5s (duración de video 10.01s)
    if (this.splashTimer) clearTimeout(this.splashTimer);
    this.splashTimer = setTimeout(() => {
      if (splash && splash.style.display !== 'none' && splash.style.visibility !== 'hidden' && !this.isVideoFinished) {
        console.log("Onboarding transition timer -> Paso 2: Portal Concierge VIP");
        this.showConciergePortal();
      }
    }, 10500);
  }

  skipSplashDirectlyToStaff() {
    this.quickStaffLogin(false);
  }

  openVipLookupModal(initialQuery = '') {
    this.closeConciergePortal();
    this.hidePortalAndShowApp();
    const isStaff = (typeof this.isEnterpriseStaffActive === 'function' && this.isEnterpriseStaffActive()) ||
                    (window.RBACMiddleware && typeof window.RBACMiddleware.isStaffOrAdmin === 'function' && window.RBACMiddleware.isStaffOrAdmin());

    const searchInput = document.getElementById('vip-lookup-search-input');
    const searchLabel = document.getElementById('vip-lookup-search-label');

    if (isStaff) {
      if (searchLabel) searchLabel.innerText = '🔎 Búsqueda de Clientes VIP (Nombre, Mascota, RIF, Teléfono):';
      if (searchInput) searchInput.placeholder = 'Buscar por nombre, teléfono o RIF...';
    } else {
      if (searchLabel) searchLabel.innerText = '🔎 Escribe aquí su nombre:';
      if (searchInput) searchInput.placeholder = 'Escribe aquí su nombre...';
    }

    if (searchInput) {
      searchInput.value = initialQuery;
    }
    this.searchVipClients(initialQuery);
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('vip-client-lookup-modal');
    }
  }

  redirectToRegistrationFromLookup(forcedQuery) {
    let query = '';
    if (typeof forcedQuery === 'string' && forcedQuery.trim()) {
      query = forcedQuery.trim();
    } else {
      const searchInput = document.getElementById('vip-lookup-search-input');
      if (searchInput && searchInput.value.trim()) {
        query = searchInput.value.trim();
      }
    }

    // 1. Cerrar modal de búsqueda rápida si está abierto
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('vip-client-lookup-modal');
    }
    const lookupModal = document.getElementById('vip-client-lookup-modal');
    if (lookupModal) {
      lookupModal.classList.remove('active');
      lookupModal.style.setProperty('display', 'none', 'important');
    }

    // 2. Revelar app y ocultar portal splash para mostrar formulario de registro
    this.closeConciergePortal();
    this.hidePortalAndShowApp();

    // 3. Prellenar formulario de registro de splash si existe
    const regTutor = document.getElementById('reg-tutor-name');
    if (regTutor && query) {
      regTutor.value = query;
    }

    // 4. Abrir modal oficial de registro VIP (6 secciones)
    if (window.registrationEngine && typeof window.registrationEngine.openRegistrationModal === 'function') {
      window.registrationEngine.openRegistrationModal({
        name: query,
        tutorName: query,
        tutor: query
      });
    } else {
      const regModal = document.getElementById('registration-modal');
      if (regModal) {
        regModal.classList.add('active');
        regModal.style.setProperty('display', 'flex', 'important');
      }
      const gfTutor = document.getElementById('gf-tutor-name');
      if (gfTutor && query) gfTutor.value = query;
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(query ? `✨ Ficha VIP lista para registrar a "${query}".` : '✨ Formulario de Registro VIP abierto.', 'info');
    }
  }

  searchVipClients(query, immediate = false) {
    if (this._vipSearchDebounceTimer) {
      clearTimeout(this._vipSearchDebounceTimer);
    }
    if (immediate) {
      this._executeSearchVipClients(query);
      return;
    }
    this._vipSearchDebounceTimer = setTimeout(() => {
      this._executeSearchVipClients(query);
    }, 100);
  }

  normalizeSearchStr(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos/tildes
      .replace(/ll/g, 'l')             // Tolerancia fonética (dalybel <-> dalybell, montilla <-> montila)
      .replace(/[^a-z0-9]/g, '')       // Quitar espacios, guiones y signos
      .trim();
  }

  getPatientsList() {
    let patients = [];
    if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus) && window.adminEngine.patientsStatus.length > 0) {
      patients = [...window.adminEngine.patientsStatus];
    } else if (window.petStatusEngine && Array.isArray(window.petStatusEngine.pets) && window.petStatusEngine.pets.length > 0) {
      patients = [...window.petStatusEngine.pets];
    }
    const hasDalybell = patients.some(p => this.normalizeSearchStr(p.owner || p.ownerName).includes('dalybel'));
    if (!hasDalybell) {
      patients.unshift({
        id: 'PET-101',
        name: 'Princesa',
        petName: 'Princesa',
        species: 'Yorkshire Terrier VIP',
        owner: 'Dalybell Ramírez Montilla',
        ownerName: 'Dalybell Ramírez Montilla',
        rif: 'V-18.452.910',
        email: 'dalybell.montilla@example.com',
        ownerPhone: '+58 414-3891102',
        pin: '1234',
        area: 'grooming',
        stepIndex: 1,
        turno: 1,
        photo: 'assets/media__1787695246337.jpg',
        image: 'assets/media__1787695246337.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg'
      });
    }
    return patients;
  }

  getPatientById(petId) {
    if (!petId) return null;
    const patients = this.getPatientsList();
    return patients.find(p => p.id === petId) || null;
  }

  _executeSearchVipClients(query) {
    const container = document.getElementById('vip-lookup-results-container');
    const headerTitle = document.getElementById('vip-lookup-header-title');
    if (!container) return;

    const q = (query || '').trim();
    const normQ = this.normalizeSearchStr(q);

    // Source patients from unified list
    const patients = this.getPatientsList();

    const isStaff = (typeof this.isEnterpriseStaffActive === 'function' && this.isEnterpriseStaffActive()) ||
                    (window.RBACMiddleware && typeof window.RBACMiddleware.isStaffOrAdmin === 'function' && window.RBACMiddleware.isStaffOrAdmin());

    // ROL VISITANTES / CLIENTES: Si no ha escrito nada, no volcar la base de datos de clientes
    if (!isStaff && !normQ) {
      if (headerTitle) {
        headerTitle.style.display = 'none';
      }
      container.innerHTML = `
        <div style="text-align:center; padding:38px 20px; color:#475569; background:#F8FAFC !important; border-radius:18px; border:2px dashed #CBD5E1 !important; box-shadow:0 4px 14px rgba(0,0,0,0.04);">
          <div style="font-size:2.8rem; margin-bottom:8px;">🐾</div>
          <div style="font-weight:900; color:#0F172A !important; font-size:1.15rem; margin-bottom:6px;">Consulta de Paciente & Tutor VIP</div>
          <div style="font-size:0.9rem; color:#64748B !important; font-weight:700; max-width:500px; margin:0 auto; line-height:1.5;">
            Escribe tu nombre o el de tu mascota en la casilla superior para consultar en la base de datos de Mrs. Pets.
          </div>
        </div>
      `;
      return;
    }

    // Filtrar pacientes con coincidencia tolerante normalizada
    const matches = patients.filter(p => {
      if (!normQ) return isStaff; // Staff puede ver todos si q está vacío
      const owner = this.normalizeSearchStr(p.owner || p.ownerName || '');
      const pet = this.normalizeSearchStr(p.name || p.petName || '');
      if (!isStaff) {
        // En rol de visitantes: buscar por nombre de dueño o de la mascota (ej: "Dalybel" -> "Dalybell Ramírez Montilla")
        return owner.includes(normQ) || normQ.includes(owner) || pet.includes(normQ) || normQ.includes(pet);
      }
      // En rol staff: buscar por todos los campos operativos
      const rif = this.normalizeSearchStr(p.rif || '');
      const email = this.normalizeSearchStr(p.email || '');
      const phone = this.normalizeSearchStr(p.ownerPhone || p.phone || '');
      const species = this.normalizeSearchStr(p.species || '');
      return owner.includes(normQ) || normQ.includes(owner) ||
             pet.includes(normQ) || normQ.includes(pet) ||
             rif.includes(normQ) || email.includes(normQ) ||
             phone.includes(normQ) || species.includes(normQ);
    });

    const safeQuery = (query || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const displayQuery = (query || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();

    if (headerTitle) {
      headerTitle.style.display = 'block';
      if (q) {
        headerTitle.innerHTML = `🔍 Cruce en Base de Datos para "${displayQuery}" — <strong style="color:#000000 !important; font-weight:900;">¿Cuál de estas personas es usted?</strong>`;
      } else {
        headerTitle.innerHTML = `👑 Base de Datos Clientes Registrados ("Soy un Chico Mrs Pets") — <strong style="color:#000000 !important; font-weight:900;">Directorio Staff</strong>`;
      }
      headerTitle.style.color = '#000000';
    }

    if (matches.length === 0) {
      if (headerTitle) {
        headerTitle.style.display = 'none';
      }
      const showAllBtn = isStaff ? `
        <button type="button" class="btn btn-secondary" onclick="authEngine.searchVipClients('')" style="background:#F1F5F9 !important; color:#000000 !important; font-weight:900; border:2px solid #000000 !important; border-radius:12px; padding:11px 18px; font-size:0.88rem; cursor:pointer;">
          🔄 Ver Todos los Registrados
        </button>
      ` : '';

      container.innerHTML = `
        <div style="text-align:center; padding:32px 18px; color:#000000 !important; background:#FFFFFF !important; border-radius:18px; border:2.5px dashed #000000 !important; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          <div style="font-size:2.5rem; margin-bottom:8px; color:#000000 !important;">🔍</div>
          <div style="font-weight:900; color:#000000 !important; font-size:1.15rem; margin-bottom:6px;">No encontramos coincidencias para "${displayQuery || 'su búsqueda'}"</div>
          <div style="font-size:0.9rem; color:#475569 !important; font-weight:700; margin-bottom:18px; max-width:560px; margin-left:auto; margin-right:auto; line-height:1.45;">
            Si es tu primera vez en Mrs. Pets o tu perfil no está creado todavía, ¡puedes darte de alta inmediatamente como nuevo Tutor VIP! Tu nombre quedará precargado automáticamente.
          </div>
          <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
            ${showAllBtn}
            <button type="button" class="btn btn-primary" onclick="authEngine.redirectToRegistrationFromLookup('${safeQuery}')" style="background:linear-gradient(135deg, #D4AF37, #B8860B) !important; color:#000000 !important; font-weight:900; border:2px solid #000000 !important; border-radius:12px; padding:11px 22px; font-size:0.92rem; cursor:pointer; box-shadow:0 4px 14px rgba(212,175,55,0.4);">
              ✨ Registrarme como Nuevo Tutor VIP ${displayQuery ? `("${displayQuery}")` : ''} ➔
            </button>
          </div>
        </div>
      `;
      return;
    }

    const renderedMatches = matches.map(p => {
      const ownerName = p.owner || p.ownerName || 'Tutor VIP';
      const petName = p.name || p.petName || 'Mascota';
      const speciesStr = p.species || 'Príncipe / Princesa';
      const phoneStr = p.ownerPhone || p.phone || '+58 412-5551234';
      const rifStr = p.rif || 'V-Registrado';
      const petPhoto = p.photo || p.image || 'assets/media__1787694901704.jpg';
      const tutorPhoto = p.ownerPhoto || 'assets/leia_avatar.jpg';

      // Información confidencial y controles operativos: SOLO VISIBLES PARA STAFF
      const confidentialInfoHtml = isStaff ? `
        <div style="font-size:0.78rem; color:#000000 !important; font-weight:800; margin-top:3px; display:flex; gap:12px; flex-wrap:wrap;">
          <span style="color:#000000 !important; font-weight:800;">📱 ${phoneStr}</span>
          <span style="color:#000000 !important; font-weight:800;">🪪 RIF: ${rifStr}</span>
        </div>
      ` : '';

      const staffTraceabilityBtn = isStaff ? `
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); analytics.openTraceabilityModal('${p.id}')" style="background:#F1F5F9 !important; color:#000000 !important; border:2px solid #000000 !important; border-radius:12px; font-weight:900; font-size:0.8rem; padding:8px 12px; cursor:pointer;" title="Ver etapas del servicio">
          📋 Etapas
        </button>
      ` : '';

      const dblClickAttr = isStaff ? `ondblclick="analytics.openTraceabilityModal('${p.id}')"` : '';

      return `
        <div ${dblClickAttr} class="vip-client-match-card">
          <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
            <div style="position:relative; flex-shrink:0;">
              <img src="${tutorPhoto}" alt="${ownerName}" style="width:48px; height:48px; border-radius:50%; border:2px solid #000000 !important; object-fit:cover;">
              <img src="${petPhoto}" alt="${petName}" style="width:26px; height:26px; border-radius:50%; border:1.5px solid #000000 !important; object-fit:cover; position:absolute; bottom:-2px; right:-2px;">
            </div>
            <div style="min-width:0; flex:1;">
              <div style="font-weight:900; color:#000000 !important; font-size:1.05rem; display:flex; align-items:center; gap:6px;">
                👤 <span style="color:#000000 !important; font-weight:900;">${ownerName}</span>
                <span class="badge" style="background:#FEF3C7 !important; color:#000000 !important; font-size:0.68rem; font-weight:900; border:1.5px solid #000000 !important;">CLIENTE VIP</span>
              </div>
              <div style="font-size:0.88rem; font-weight:800; color:#000000 !important; margin-top:3px;">
                Dueño(a) de 🐾 <strong style="color:#000000 !important; font-weight:900;">${petName}</strong> <span style="font-size:0.78rem; color:#000000 !important; font-weight:700;">(${speciesStr})</span>
              </div>
              ${confidentialInfoHtml}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            ${staffTraceabilityBtn}
            <button class="btn btn-primary" onclick="authEngine.selectVipProfile('${p.id}')" style="background:linear-gradient(135deg, #D4AF37, #F59E0B) !important; color:#000000 !important; border:2px solid #000000 !important; border-radius:12px; font-weight:900; font-size:0.88rem; padding:10px 16px; cursor:pointer; box-shadow:0 4px 12px rgba(212,175,55,0.35); transition:all 0.2s ease;">
              ✨ ¡Soy Yo! Ingresar ➔
            </button>
          </div>
        </div>
      `;
    }).join('');

    const newTutorFooterCard = `
      <div style="background:#F8FAFC !important; border:2.5px dashed #D4AF37 !important; border-radius:16px; padding:16px 20px; text-align:center; color:#000000 !important; margin-top:10px; box-shadow:0 3px 12px rgba(212,175,55,0.18);">
        <div style="font-weight:900; font-size:1.02rem; color:#000000 !important; margin-bottom:4px;">
          ✨ ¿No ves tu nombre en estos registros?
        </div>
        <div style="font-size:0.86rem; font-weight:700; color:#334155 !important; margin-bottom:12px;">
          Si eres un nuevo tutor o vienes por primera vez, puedes crear tu perfil VIP en un minuto y agendar todos los servicios de Mrs. Pets.
        </div>
        <button type="button" class="btn btn-primary" onclick="authEngine.redirectToRegistrationFromLookup('${safeQuery}')" style="background:linear-gradient(135deg, #D4AF37, #B8860B) !important; color:#000000 !important; font-weight:900; border:2px solid #000000 !important; border-radius:12px; padding:11px 22px; font-size:0.9rem; cursor:pointer; box-shadow:0 4px 12px rgba(212,175,55,0.35);">
          🐾 Crear mi Perfil / Registrarme como Nuevo Tutor VIP ${displayQuery ? `("${displayQuery}")` : ''} ➔
        </button>
      </div>
    `;

    container.innerHTML = renderedMatches + newTutorFooterCard;
  }

  isProfilePinAuthenticated(petId) {
    if (!petId) return false;
    return sessionStorage.getItem('mrs_pets_pin_auth_' + petId) === 'true';
  }

  setProfilePinAuthenticated(petId, status = true) {
    if (!petId) return;
    sessionStorage.setItem('mrs_pets_pin_auth_' + petId, status ? 'true' : 'false');
  }

  togglePinInputVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerText = '🔒';
    } else {
      input.type = 'password';
      btn.innerText = '👁️';
    }
  }

  requestProfilePin(petId, onAuthenticatedCallback, options = {}) {
    const patient = this.getPatientById(petId);

    if (!patient) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ No se encontró la ficha del perfil seleccionado.', 'error');
      }
      return;
    }

    // Si ya fue autenticado en esta sesión y no se fuerza solicitud, proceder directamente
    if (this.isProfilePinAuthenticated(petId) && !options.forcePrompt) {
      if (typeof onAuthenticatedCallback === 'function') {
        onAuthenticatedCallback();
      }
      return;
    }

    this.pendingPinPetId = petId;
    this.pendingPinCallback = onAuthenticatedCallback;
    this.pendingPinOptions = options;

    const modalTitle = document.getElementById('client-pin-modal-title');
    if (modalTitle) modalTitle.innerText = options.title || 'Introduce tu clave de perfil para continuar';

    const modalDesc = document.getElementById('client-pin-modal-desc');
    if (modalDesc) modalDesc.innerText = options.desc || 'Por privacidad y protección de los datos de tu mascota, ingresa tu clave personal.';

    const tutorNameEl = document.getElementById('client-pin-tutor-name');
    if (tutorNameEl) tutorNameEl.innerText = patient.owner || patient.ownerName || 'Tutor VIP';

    const petNameEl = document.getElementById('client-pin-pet-name');
    if (petNameEl) {
      const pName = patient.name || patient.petName || 'Mascota VIP';
      const pSpec = patient.species || 'Canino VIP';
      petNameEl.innerText = `🐾 ${pName} (${pSpec})`;
    }

    const avatarImg = document.getElementById('client-pin-avatar-img');
    if (avatarImg) {
      avatarImg.src = patient.ownerPhoto || 'assets/leia_avatar.jpg';
    }

    const pinInput = document.getElementById('client-profile-pin-input');
    if (pinInput) {
      pinInput.value = '';
      pinInput.type = 'password';
      pinInput.style.borderColor = '#4A6B5D';
    }

    const errEl = document.getElementById('client-profile-pin-error');
    if (errEl) errEl.style.display = 'none';

    // Desplegar modal de PIN al frente con máxima prioridad z-index
    const modal = document.getElementById('client-profile-pin-modal');
    if (modal) {
      modal.style.setProperty('z-index', '2147483647', 'important');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
      modal.classList.add('active');
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('client-profile-pin-modal');
    }

    setTimeout(() => {
      const inputEl = document.getElementById('client-profile-pin-input');
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 150);
  }

  submitProfilePin() {
    const inputEl = document.getElementById('client-profile-pin-input');
    const inputVal = inputEl ? inputEl.value.trim() : '';

    if (!this.pendingPinPetId) return;

    const patient = this.getPatientById(this.pendingPinPetId);
    const expectedPin = (patient && patient.pin) ? String(patient.pin).trim() : '1234';

    if (!inputVal || (inputVal !== expectedPin)) {
      const errEl = document.getElementById('client-profile-pin-error');
      if (errEl) {
        errEl.style.display = 'block';
        errEl.innerText = '⚠️ Clave incorrecta. Acceso denegado a este perfil.';
      }
      if (inputEl) {
        inputEl.style.borderColor = '#ef4444';
        inputEl.classList.add('shake-anim');
        setTimeout(() => inputEl.classList.remove('shake-anim'), 400);
        inputEl.select();
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Clave incorrecta. Acceso denegado al perfil.', 'error');
      }
      return;
    }

    // Clave correcta: autenticar perfil en la sesión
    const verifiedPetId = this.pendingPinPetId;
    this.setProfilePinAuthenticated(verifiedPetId, true);
    this.wasInVipLookupModal = false;

    window._isVerifyingProfilePin = true;
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('client-profile-pin-modal');
    } else {
      const modal = document.getElementById('client-profile-pin-modal');
      if (modal) modal.classList.remove('active');
    }

    const cb = this.pendingPinCallback;
    this.pendingPinCallback = null;
    this.pendingPinPetId = null;

    if (typeof cb === 'function') {
      cb(inputVal);
    } else {
      this.selectVipProfileVerified(verifiedPetId);
    }
    window._isVerifyingProfilePin = false;
  }

  closeProfilePinModal() {
    this.pendingPinPetId = null;
    this.pendingPinCallback = null;
    const modal = document.getElementById('client-profile-pin-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
    }
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('client-profile-pin-modal');
    }

    // Si el usuario estaba en la búsqueda de perfiles de Chico Mrs. Pets, restaurar el modal
    if (this.wasInVipLookupModal) {
      this.wasInVipLookupModal = false;
      this.openVipLookupModal('');
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('Operación cancelada. El perfil activo permanece sin cambios.', 'info');
    }
  }

  selectVipProfile(petId) {
    // Cerrar temporalmente el modal de búsqueda para que el modal de PIN quede limpio en primer plano
    const lookupModal = document.getElementById('vip-client-lookup-modal');
    if (lookupModal && (lookupModal.classList.contains('active') || lookupModal.style.display !== 'none')) {
      this.wasInVipLookupModal = true;
      if (window.app && typeof window.app.closeModal === 'function') {
        window.app.closeModal('vip-client-lookup-modal');
      } else {
        lookupModal.classList.remove('active');
        lookupModal.style.setProperty('display', 'none', 'important');
      }
    }

    this.requestProfilePin(petId, () => {
      this.selectVipProfileVerified(petId);
    }, {
      forcePrompt: true, // NADIE puede ingresar como Chico Mrs. Pets sin su clave personal
      title: '🔒 Clave Personal Requerida para Ingresar',
      desc: 'Por tu seguridad y la de tu mascota, ingresa tu clave personal de Chico Mrs. Pets para acceder a tu perfil.'
    });
  }

  selectVipProfileVerified(petId) {
    const patient = this.getPatientById(petId);
    const ownerName = patient ? (patient.owner || patient.ownerName) : 'Dalybell Ramírez Montilla';
    const petName = patient ? (patient.name || patient.petName) : 'Princesa';

    this.currentVipPetId = petId;
    localStorage.setItem('mrs_pets_active_vip_patient_id', petId);
    localStorage.setItem('mrs_pets_active_customer_name', ownerName);
    localStorage.setItem('mrs_pets_auth_role', 'client');
    localStorage.setItem('mrs_pets_auth_name', `${ownerName} (Tutor de ${petName})`);
    sessionStorage.setItem('mrs_pets_client_authenticated', 'true');
    localStorage.setItem('mrs_pets_skip_splash', 'true');

    // Limpieza de modales de reservación y deduplicación estricta de citas pendientes
    ['booking-modal-grooming', 'booking-modal-clinica', 'booking-modal-hotel', 'booking-confirmation-pop'].forEach(mId => {
      const modalEl = document.getElementById(mId);
      if (modalEl) {
        modalEl.classList.remove('active');
        modalEl.style.setProperty('display', 'none', 'important');
      }
    });
    if (window.clinicaEngine) {
      window.clinicaEngine.pendingBookingDraft = null;
    }
    if (window.adminEngine && typeof window.adminEngine.deduplicatePendingAppointments === 'function') {
      window.adminEngine.deduplicatePendingAppointments();
    }

    window._isVerifyingProfilePin = true;
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('vip-client-lookup-modal');
    }
    window._isVerifyingProfilePin = false;

    this.loginSuccess('client', `${ownerName} (Tutor de ${petName})`);

    if (window.adminEngine && typeof window.adminEngine.updateHeaderAccountDisplay === 'function') {
      window.adminEngine.updateHeaderAccountDisplay();
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✨ ¡Clave validada con éxito! Accediendo al expediente VIP de ${petName}...`, 'success');
    }

    if (window.petStatusEngine) {
      if (typeof window.petStatusEngine.filterByPetId === 'function') {
        window.petStatusEngine.filterByPetId(petId);
      } else if (typeof window.petStatusEngine.render === 'function') {
        window.petStatusEngine.render();
      }
    }

    if (window.storeEngine) {
      if (typeof window.storeEngine.loadCart === 'function') window.storeEngine.loadCart();
      if (typeof window.storeEngine.renderCart === 'function') window.storeEngine.renderCart();
    }
  }

  quickClientLogin() {
    this.openVipLookupModal('');
  }

  quickReservationLogin(event, targetArea = 'clinica') {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    // 1. Activar sesión en Rol de Visitante para reservaciones públicas
    this.isAuthenticated = true;
    this.userRole = 'visitor';
    this.userName = 'Visitante VIP';
    this.currentVipPetId = null;

    try {
      localStorage.removeItem('mrs_pets_active_vip_patient_id');
      localStorage.removeItem('mrs_pets_active_customer_name');
      localStorage.setItem('mrs_pets_skip_splash', 'true');
      localStorage.setItem('mrs_pets_auth_role', 'visitor');
      localStorage.setItem('mrs_pets_auth_name', 'Visitante VIP');
      sessionStorage.removeItem('mrs_pets_client_authenticated');

      // Limpiar autorizaciones de PIN residuales en la pestaña para evitar suplantaciones
      if (typeof sessionStorage !== 'undefined') {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('mrs_pets_pin_auth_')) {
            sessionStorage.removeItem(key);
          }
        }
      }
    } catch (e) {}

    // 2. Revelar la plataforma principal y ocultar portal splash
    this.hidePortalAndShowApp();

    if (window.adminEngine && typeof window.adminEngine.setEnvironment === 'function') {
      window.adminEngine.setEnvironment('customer');
    }

    if (window.app && typeof window.app.switchTab === 'function') {
      window.app.switchTab('welcome', true);
    }

    // 3. Abrir el modal de reservación seleccionado en BLANCO absoluto para nuevo registro
    if (targetArea === 'clinica') {
      if (window.clinicaEngine && typeof window.clinicaEngine.openClinicaBookingModal === 'function') {
        window.clinicaEngine.openClinicaBookingModal('Consulta Médica General', '', '', { resetBlank: true });
      } else {
        const clinicaModal = document.getElementById('booking-modal-clinica');
        if (clinicaModal) clinicaModal.classList.add('active');
      }
    } else if (targetArea === 'grooming') {
      if (window.clinicaEngine && typeof window.clinicaEngine.openGroomingBookingModal === 'function') {
        window.clinicaEngine.openGroomingBookingModal('Circuito Grooming Spa 7 Estaciones', '', '', { resetBlank: true });
      } else {
        const groomingModal = document.getElementById('booking-modal-grooming');
        if (groomingModal) groomingModal.classList.add('active');
      }
    } else if (targetArea === 'hotel') {
      if (window.clinicaEngine && typeof window.clinicaEngine.openHotelBookingModal === 'function') {
        window.clinicaEngine.openHotelBookingModal('Suite Royal Bioclimática #4', '', '', { resetBlank: true });
      } else {
        const hotelModal = document.getElementById('booking-modal-hotel');
        if (hotelModal) hotelModal.classList.add('active');
      }
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('📅 Reservación: Formulario en blanco listo para ingresar sus datos', 'info');
    }
  }

  openStatusAndUserControl() {
    this.hidePortalAndShowApp();
    if (window.app && typeof window.app.switchTab === 'function') {
      window.app.switchTab('welcome', true);
    }
    if (window.petStatusEngine && typeof window.petStatusEngine.render === 'function') {
      window.petStatusEngine.render();
    }
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('✂️ Monitor de Pacientes & Control de Estatus Activo', 'success');
    }
  }

  goToHrPortal() {
    // 🛡️ REGLA EXCLUSIVA PARA EL STAFF:
    // Al staff y a la empresa no les interesa ver ni llenar formularios.
    // Acceden directamente a las fichas de los candidatos y sus currículos (ej: María Briceño).
    if (this.isEnterpriseStaffActive()) {
      this.hidePortalAndShowApp();
      if (window.RBACMiddleware) {
        window.RBACMiddleware.navigateToAdminModule('admin-section-hr');
      } else if (window.HRRecruitmentEngine) {
        window.HRRecruitmentEngine.renderAdminConsole();
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('💼 Acceso Staff: Expedientes y currículos recibidos.', 'info');
      }
      return;
    }

    // 🛡️ REGLA CRÍTICA DE SEGURIDAD & PRIVACIDAD PARA ASPIRANTES PÚBLICOS:
    // Al seleccionar "Trabaja con Nosotros" desde Concierge VIP, el acceso queda estrictamente
    // LIMITADO al formato para ingresar la información del CV y NADA MÁS.
    // Queda terminantemente prohibido abrir o cargar la cuenta de un cliente (Dalybell, etc.)
    // o exponer la aplicación interna (clínica, tienda, hotel, reservaciones, base de datos).
    this.userRole = 'candidate';
    this.userName = 'Postulante RRHH';
    this.isAuthenticated = false;

    // 1. Garantizar que el contenedor principal de la aplicación permanezca completamente oculto
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.style.setProperty('display', 'none', 'important');
      appContainer.style.opacity = '0';
      appContainer.style.visibility = 'hidden';
    }

    // 2. Mantener activo el portal Concierge VIP en pantalla completa
    const portal = document.getElementById('access-links-portal');
    if (portal) {
      portal.style.setProperty('display', 'block', 'important');
      portal.style.visibility = 'visible';
      portal.style.opacity = '1';
      portal.style.setProperty('pointer-events', 'auto', 'important');
      portal.style.setProperty('z-index', '100000', 'important');
    }

    // 3. Adaptar ancho del contenedor para visualizar cómodamente el formato de CV
    const cardContainer = document.getElementById('portal-card-container');
    if (cardContainer) {
      cardContainer.style.maxWidth = '780px';
    }

    // 4. Ocultar vistas de login/registro y controles de video
    const loginView = document.getElementById('portal-view-login');
    const registerView = document.getElementById('portal-view-register');
    const hrCandidateView = document.getElementById('portal-view-hr-candidate');
    const hrForm = document.getElementById('hr-portal-candidate-form');
    const hrSuccess = document.getElementById('hr-portal-candidate-success');
    const portalFooterControls = document.getElementById('portal-footer-video-controls');

    if (loginView) loginView.style.display = 'none';
    if (registerView) registerView.style.display = 'none';
    if (portalFooterControls) portalFooterControls.style.display = 'none';
    if (hrSuccess) hrSuccess.style.display = 'none';

    // 5. Reiniciar y activar el formato exclusivo de postulación
    if (hrForm) {
      hrForm.reset();
      hrForm.style.display = 'flex';
      const label = document.getElementById('hr-p-cv-label-text');
      if (label) label.textContent = 'Seleccionar archivo (PDF o DOCX, máx 5MB)';
    }

    if (hrCandidateView) {
      hrCandidateView.style.display = 'block';
      if (portal) portal.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('💼 Portal de Empleo: Completa tus datos y adjunta tu CV.', 'info');
    }
  }

  backToPortalMain() {
    this.userRole = null;
    this.userName = '';
    this.isAuthenticated = false;

    const cardContainer = document.getElementById('portal-card-container');
    if (cardContainer) {
      cardContainer.style.maxWidth = '580px';
    }

    const loginView = document.getElementById('portal-view-login');
    const registerView = document.getElementById('portal-view-register');
    const hrCandidateView = document.getElementById('portal-view-hr-candidate');
    const portalFooterControls = document.getElementById('portal-footer-video-controls');

    if (hrCandidateView) hrCandidateView.style.display = 'none';
    if (registerView) registerView.style.display = 'none';
    if (portalFooterControls) portalFooterControls.style.display = 'block';
    if (loginView) loginView.style.display = 'block';

    const portal = document.getElementById('access-links-portal');
    if (portal) portal.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openGroomingPhotoUpload() {
    const isStaff = (this.currentUser && ['admin', 'staff', 'gerencia'].includes(String(this.currentUser.role).toLowerCase())) ||
                    (window.adminEngine && window.adminEngine.viewEnvironment === 'enterprise') ||
                    (window.RBACMiddleware && window.RBACMiddleware.isStaffOrAdmin());
    if (!isStaff) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⛔ Acceso Restringido: La carga de fotos de Grooming (QC) es exclusiva para el personal Staff.', 'error');
      }
      return;
    }
    this.hidePortalAndShowApp();
    if (window.mrsPetsArch && typeof window.mrsPetsArch.openEmployeeCamera === 'function') {
      window.mrsPetsArch.openEmployeeCamera();
    } else if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('employee-camera-modal');
    }
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('📸 Captura de Fotos de Grooming & Control de Calidad', 'info');
    }
  }

  goToApiIntegrations() {
    this.hidePortalAndShowApp();
    if (window.app && typeof window.app.switchTab === 'function') {
      window.app.switchTab('integrations', true);
    }
    if (window.integrations && typeof window.integrations.testAllApiConnections === 'function') {
      window.integrations.testAllApiConnections();
    }
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('⚡ Conexión de APIs & Webhooks: Panel de Estado en Vivo', 'success');
    }
  }

  quickStaffLogin(bypassPrompt = false, targetStaffUser = null) {
    const portal = typeof document !== 'undefined' ? document.getElementById('access-links-portal') : null;
    const isPortalActive = portal && (
      portal.classList.contains('active') ||
      (portal.style.display !== 'none' && portal.style.visibility !== 'hidden')
    );

    // 🛡️ ZERO-TRUST: Si el portal VIP Concierge está activo, NUNCA considerar sesión previa de staff.
    // Obligar a que ingrese la clave para evitar accesos indebidos o no autorizados.
    if (isPortalActive) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('mrs_pets_enterprise_authenticated');
        sessionStorage.removeItem('mrs_pets_staff_role');
      }
      if (window.adminEngine) {
        window.adminEngine.isEnterpriseAuthenticated = false;
        window.adminEngine.activeRole = null;
      }
      this.isAuthenticated = false;
      this.userRole = null;
    }

    // 1. Solo si NO estamos en el portal y el usuario ya está explícitamente autenticado como staff en esta sesión
    const isAlreadyStaff = !isPortalActive && (
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true') &&
      (window.adminEngine && window.adminEngine.isEnterpriseAuthenticated) &&
      (this.userRole === 'staff' && this.isAuthenticated)
    );

    if (isAlreadyStaff) {
      this.closeConciergePortal();
      this.hidePortalAndShowApp();
      if (window.adminEngine) {
        window.adminEngine.setEnvironment('enterprise');
      }
      if (window.app && typeof window.app.switchTab === 'function') {
        window.app.switchTab('admin', true);
      }
      return;
    }

    // 2. Si se encuentra en el portal o no está autenticado, solicitar la clave obligatoriamente
    // NUNCA ocultar el portal ni mostrar el appContainer antes de autenticar en el servidor
    const passInput = document.getElementById('login-staff-pass');
    if (passInput) {
      passInput.value = '';
      passInput.style.borderColor = '#475569';
    }

    if (targetStaffUser) {
      const selectEl = document.getElementById('login-staff-select');
      const userEl = document.getElementById('login-staff-user');
      if (userEl) userEl.value = targetStaffUser;
      if (selectEl) selectEl.value = targetStaffUser;
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('enterprise-login-modal');
    } else {
      const modal = document.getElementById('enterprise-login-modal');
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
      }
    }

    // Enfocar el campo de clave o de selección de usuario
    setTimeout(() => {
      const pass = document.getElementById('login-staff-pass');
      const select = document.getElementById('login-staff-select');
      const user = document.getElementById('login-staff-user');
      if (user && user.value && pass) {
        pass.value = '';
        try { pass.focus(); } catch(e) {}
      } else if (select) {
        try { select.focus(); } catch(e) {}
      }
    }, 120);
  }

  loginSuccess(role, userName) {
    this.isAuthenticated = true;
    this.userRole = role || 'client';
    this.userName = userName;
    localStorage.setItem('mrs_pets_skip_splash', 'true');
    localStorage.setItem('mrs_pets_auth_role', this.userRole);
    localStorage.setItem('mrs_pets_auth_name', this.userName);

    if (role === 'staff') {
      sessionStorage.setItem('mrs_pets_enterprise_authenticated', 'true');
      if (window.adminEngine) {
        window.adminEngine.isEnterpriseAuthenticated = true;
        window.adminEngine.activeRole = sessionStorage.getItem('mrs_pets_staff_role') || 'admin';
      }
    } else {
      sessionStorage.setItem('mrs_pets_client_authenticated', 'true');
      if (window.adminEngine) {
        window.adminEngine.isEnterpriseAuthenticated = false;
      }
    }

    if (window.adminEngine) {
      window.adminEngine.setEnvironment(role === 'staff' ? 'enterprise' : 'customer');
    }

    this.closeConciergePortal();
    this.hidePortalAndShowApp();

    if (role === 'client') {
      const cleanName = (userName || '').split(' (Tutor')[0].replace(/\(.*?\)/g, '').trim();
      if (window.storeEngine && typeof window.storeEngine.switchCustomer === 'function') {
        window.storeEngine.switchCustomer({ name: cleanName });
      } else if (window.storeEngine && typeof window.storeEngine.loadCart === 'function') {
        window.storeEngine.loadCart();
      }
    } else {
      if (window.storeEngine && typeof window.storeEngine.loadCart === 'function') {
        window.storeEngine.loadCart();
      }
    }

    if (window.app) {
      window.app.showToast(`✨ Bienvenid@ ${userName} al Portal Mrs. Pets`, 'success');
      if (typeof window.app.switchTab === 'function') {
        window.app.switchTab(role === 'staff' ? 'admin' : 'pet-status', true);
      } else if (typeof showTab === 'function') {
        showTab(role === 'staff' ? 'admin' : 'pet-status');
      }
    }
  }

  logout() {
    this.isAuthenticated = false;
    this.userRole = null;
    this.userName = '';
    this.currentVipPetId = null;
    this.isVideoFinished = false;

    // Limpieza de modales de reservación y deduplicación estricta de citas pendientes
    ['booking-modal-grooming', 'booking-modal-clinica', 'booking-modal-hotel', 'booking-confirmation-pop'].forEach(mId => {
      const modalEl = document.getElementById(mId);
      if (modalEl) {
        modalEl.classList.remove('active');
        modalEl.style.setProperty('display', 'none', 'important');
      }
    });
    if (window.clinicaEngine) {
      window.clinicaEngine.pendingBookingDraft = null;
    }
    if (window.adminEngine && typeof window.adminEngine.deduplicatePendingAppointments === 'function') {
      window.adminEngine.deduplicatePendingAppointments();
    }

    if (window.storeEngine) {
      if (typeof window.storeEngine.saveCart === 'function') {
        window.storeEngine.saveCart();
      }
      window.storeEngine.cart = [];
      if (typeof window.storeEngine.renderCart === 'function') {
        window.storeEngine.renderCart();
      }
    }

    localStorage.removeItem('mrs_pets_active_customer_name');
    localStorage.removeItem('mrs_pets_active_customer_rif');
    localStorage.removeItem('mrs_pets_skip_splash');
    localStorage.removeItem('mrs_pets_active_vip_patient_id');
    localStorage.removeItem('mrs_pets_auth_role');
    localStorage.removeItem('mrs_pets_auth_name');

    sessionStorage.removeItem('mrs_pets_client_authenticated');
    sessionStorage.removeItem('mrs_pets_enterprise_authenticated');
    sessionStorage.removeItem('mrs_pets_staff_role');
    sessionStorage.removeItem('mrs_pets_visitor_session');
    sessionStorage.removeItem('mrs_pets_skip_splash');

    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('mrs_pets_pin_auth_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch(e) {}

    document.documentElement.classList.remove('splash-bypassed');

    // Notificar al backend de la revocación de la cookie de sesión si existe
    try {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    } catch(e) {}

    const appContainer = document.getElementById('app-container');
    const portal = document.getElementById('access-links-portal');
    const splash = document.getElementById('auth-splash-screen');

    if (appContainer) {
      appContainer.style.setProperty('display', 'none', 'important');
      appContainer.style.opacity = '0';
      appContainer.style.visibility = 'hidden';
    }

    if (portal) {
      portal.style.setProperty('display', 'none', 'important');
      portal.style.opacity = '0';
      portal.style.visibility = 'hidden';
    }

    if (splash) {
      splash.style.setProperty('display', 'block', 'important');
      splash.style.visibility = 'visible';
      splash.style.opacity = '1';
      const video = document.getElementById('brand-splash-video');
      if (video) {
        try {
          video.currentTime = 0;
          video.play().catch(e => console.warn("Logout video play warning:", e));
        } catch (err) {}
      }
    }

    if (window.app) {
      window.app.showToast('🔒 Sesión cerrada exitosamente. Complete el ingreso en el portal.', 'info');
    }
  }

  previewGravatarFromEmail(email) {
    if (!email || !email.includes('@')) return;
    const cleanEmail = email.trim().toLowerCase();
    const previewEl = document.getElementById('reg-tutor-photo-preview');
    if (previewEl) {
      // Automatic email avatar generator / Gravatar linking
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`;
      previewEl.src = avatarUrl;
      this.customTutorPhoto = avatarUrl;
    }
  }

  handleImagePreview(event, previewId, type) {
    const file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target.result;
        const previewEl = document.getElementById(previewId);
        if (previewEl) {
          previewEl.src = resultUrl;
        }
        if (type === 'tutor') this.customTutorPhoto = resultUrl;
        if (type === 'pet') this.customPetPhoto = resultUrl;
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('📷 Fotografía cargada correctamente.', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  handleNewUserRegistration(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('reg-tutor-name')?.value.trim() || '';
    const petName = document.getElementById('reg-pet-name')?.value.trim() || '';
    const phone = document.getElementById('reg-tutor-phone')?.value.trim() || '';
    const species = document.getElementById('reg-pet-species')?.value || 'Canino';
    const email = document.getElementById('reg-tutor-email')?.value.trim() || '';
    const rif = document.getElementById('reg-tutor-id')?.value.trim() || '';
    const sector = document.getElementById('reg-tutor-sector')?.value || '';

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`📋 Datos iniciales capturados (BioTracker GeoGuard: ${sector || 'Maracaibo'}). Complete la ficha de salud.`, 'info');
    }

    if (window.registrationEngine && typeof window.registrationEngine.openRegistrationModal === 'function') {
      window.registrationEngine.openRegistrationModal({
        name,
        pet: petName,
        phone,
        email,
        rif,
        species,
        sector,
        tutorPhoto: this.customTutorPhoto,
        petPhoto: this.customPetPhoto
      });
    }
  }

  handleSplashLogin(event) {
    if (event) event.preventDefault();
    const userInput = document.getElementById('splash-user-input');
    const passInput = document.getElementById('splash-pass-input');

    const user = userInput ? userInput.value.trim() : '';
    const pass = passInput ? passInput.value.trim() : '';

    if (!user) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor ingrese su usuario o nombre.', 'warning');
      }
      if (userInput) userInput.focus();
      return;
    }

    if (!pass) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Clave requerida: Nadie puede ingresar a Mrs. Pets sin su clave personal.', 'warning');
      }
      if (passInput) {
        passInput.style.borderColor = '#EF4444';
        passInput.classList.add('shake-anim');
        setTimeout(() => passInput.classList.remove('shake-anim'), 400);
        passInput.focus();
      }
      return;
    }

    // Normalizar usuario ingresado (sin arroba, minúsculas y caracteres limpios)
    const rawUser = user.trim();
    const cleanUser = rawUser.toLowerCase().replace(/^@/, '');
    const cleanId = cleanUser.replace(/[^a-z0-9]/g, '');

    // 1. Sincronizar perfiles de Staff (memoria + localStorage)
    if (window.adminEngine && typeof window.adminEngine.loadStaffFromStorage === 'function') {
      window.adminEngine.loadStaffFromStorage();
    }
    let staffProfiles = [];
    if (window.adminEngine && Array.isArray(window.adminEngine.staffProfiles)) {
      staffProfiles = [...window.adminEngine.staffProfiles];
    }
    try {
      const savedStaff = localStorage.getItem('mrs_pets_staff_profiles');
      if (savedStaff) {
        const parsedStaff = JSON.parse(savedStaff);
        if (Array.isArray(parsedStaff)) {
          parsedStaff.forEach(p => {
            const idx = staffProfiles.findIndex(s => s.id === p.id || ((s.username || '').toLowerCase() === (p.username || '').toLowerCase()));
            if (idx >= 0) {
              staffProfiles[idx] = { ...staffProfiles[idx], ...p };
            } else {
              staffProfiles.push(p);
            }
          });
        }
      }
    } catch(e) {}

    // 2. Comprobar si coincide con un perfil Staff (por username, id, nombre o roles clave)
    const staffMatch = staffProfiles.find(s => {
      const u = (s.username || '').toLowerCase().trim().replace(/^@/, '');
      const id = (s.id || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const name = (s.name || '').toLowerCase().trim();
      const nombre = (s.nombre || '').toLowerCase().trim();
      const apellido = (s.apellido || '').toLowerCase().trim();

      return u === cleanUser ||
             id === cleanId ||
             (cleanUser === 'hp' && (u === 'hp' || id.includes('07') || name.includes('hp') || nombre.includes('hp'))) ||
             name === cleanUser ||
             nombre === cleanUser ||
             apellido === cleanUser ||
             (u && (u === cleanUser || (cleanUser.length > 3 && u.includes(cleanUser))));
    });

    if (staffMatch || cleanUser === 'admin' || cleanUser === 'staff' || cleanUser === 'empleado' || cleanUser === 'dr.morales' || cleanUser === 'hp') {
      const staffUsername = staffMatch ? (staffMatch.username || cleanUser) : cleanUser;
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: staffUsername, password: pass })
      }).then(r => r.json()).then(data => {
        if (data.status === 'success') {
          const authRole = data.role || (data.user && data.user.role) || 'admin';
          if (window.adminEngine) {
            window.adminEngine.isEnterpriseAuthenticated = true;
            window.adminEngine.activeRole = authRole;
            window.adminEngine.viewEnvironment = 'enterprise';
            try { 
              sessionStorage.setItem('mrs_pets_enterprise_authenticated', 'true');
              sessionStorage.setItem('mrs_pets_staff_role', authRole);
            } catch(e){}
          }
          this.isAuthenticated = true;
          this.userRole = 'staff';
          this.userName = (staffMatch && staffMatch.name) ? staffMatch.name : (data.username || staffUsername);
          localStorage.setItem('mrs_pets_skip_splash', 'true');
          this.loginSuccess('staff', this.userName);
        } else {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(data.message || `❌ Credenciales inválidas para "${user}".`, 'danger');
          }
          if (passInput) {
            passInput.style.borderColor = '#EF4444';
            passInput.classList.add('shake-anim');
            setTimeout(() => passInput.classList.remove('shake-anim'), 400);
            passInput.select();
          }
        }
      }).catch(() => {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('⚠️ No se pudo comunicar con el servidor de autenticación.', 'warning');
        }
      });
      return;
    }

    // 3. Base de datos de Clientes Registrados ("Soy un Chico Mrs. Pets")
    const patients = this.getPatientsList();
    const normUser = this.normalizeSearchStr(cleanUser);

    const matched = patients.find(p => {
      const owner = this.normalizeSearchStr(p.owner || p.ownerName || '');
      const pet = this.normalizeSearchStr(p.name || p.petName || '');
      const rif = this.normalizeSearchStr(p.rif || '');
      const phone = this.normalizeSearchStr(p.ownerPhone || p.phone || '');
      const email = this.normalizeSearchStr(p.email || '');

      return (
        owner.includes(normUser) ||
        normUser.includes(owner) ||
        pet.includes(normUser) ||
        normUser.includes(pet) ||
        rif.includes(normUser) ||
        phone.includes(normUser) ||
        email.includes(normUser)
      );
    });

    if (matched) {
      const expectedPin = (matched.pin ? String(matched.pin).trim() : '1234');
      if (pass === expectedPin) {
        this.setProfilePinAuthenticated(matched.id, true);
        this.selectVipProfileVerified(matched.id);
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`✨ ¡Bienvenido ${matched.owner || user}! Clave personal validada con éxito.`, 'success');
        }
      } else {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`❌ Clave personal incorrecta para ${matched.owner || user}. Acceso denegado.`, 'danger');
        }
        if (passInput) {
          passInput.style.borderColor = '#EF4444';
          passInput.classList.add('shake-anim');
          setTimeout(() => passInput.classList.remove('shake-anim'), 400);
          passInput.select();
        }
      }
      return;
    }

    // 4. Si el usuario no fue encontrado
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`⚠️ Usuario "${user}" no registrado. Por favor elija "Soy un Chico Mrs Pets" o "Deseo ser un Chico Mrs. Pets".`, 'warning');
    }
  }

  openRegistrationPortalModal(prefillData) {
    this.closeConciergePortal();
    this.hidePortalAndShowApp();
    if (window.registrationEngine && typeof window.registrationEngine.openRegistrationModal === 'function') {
      window.registrationEngine.openRegistrationModal(prefillData);
    } else {
      const regModal = document.getElementById('registration-modal');
      if (regModal) regModal.classList.add('active');
    }
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('✨ Formulario de Registro VIP Abierto', 'info');
    }
  }
}

const authEngine = new AuthEngine();
window.authEngine = authEngine;
document.addEventListener('DOMContentLoaded', () => authEngine.init());
