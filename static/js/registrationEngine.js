/* ==========================================================================
   GRAVITY FORMS MULTI-STEP REGISTRATION ENGINE (Mrs. Pets Maracaibo)
   Comprehensive 6-Section Registration Engine for Tutor, Pet & Health Protocols
   ========================================================================== */

class RegistrationEngine {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.tutorPhotoData = 'assets/leia_avatar.jpg';
    this.petPhotoData = 'assets/hero_border_collie.jpg';
    this.vaccinePhotos = [];
  }

  init() {
    this.bindStepEvents();
    this.fetchClientIp();
    const emailInput = document.getElementById('gf-tutor-email');
    if (emailInput) {
      emailInput.addEventListener('input', () => this.updateElectronicSignaturePreview());
    }
    const termsCheck = document.getElementById('gf-terms-check');
    if (termsCheck) {
      termsCheck.addEventListener('change', () => {
        const legalBox = document.getElementById('gf-legal-acceptance-box');
        if (legalBox) {
          if (termsCheck.checked) {
            legalBox.style.borderColor = '#10B981';
            legalBox.style.boxShadow = '0 4px 18px rgba(16,185,129,0.18)';
          } else {
            legalBox.style.borderColor = '#D4AF37';
            legalBox.style.boxShadow = '0 4px 18px rgba(212,175,55,0.12)';
          }
        }
      });
    }
  }

  togglePinVisibility(inputId, btn) {
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

  validatePinInput() {
    const pin = document.getElementById('gf-tutor-pin')?.value || '';
    const confirmPin = document.getElementById('gf-tutor-pin-confirm')?.value || '';
    const feedbackEl = document.getElementById('gf-pin-feedback');
    const pinInput = document.getElementById('gf-tutor-pin');
    const confirmInput = document.getElementById('gf-tutor-pin-confirm');

    if (!feedbackEl) return true;

    if (!pin && !confirmPin) {
      feedbackEl.style.display = 'none';
      if (pinInput) pinInput.style.borderColor = '';
      if (confirmInput) confirmInput.style.borderColor = '';
      return false;
    }

    feedbackEl.style.display = 'block';

    if (pin.length < 4) {
      feedbackEl.style.background = '#fef2f2';
      feedbackEl.style.color = '#dc2626';
      feedbackEl.style.border = '1px solid #fecaca';
      feedbackEl.innerText = `⚠️ La clave debe tener al menos 4 caracteres alfanuméricos (${pin.length}/4).`;
      if (pinInput) pinInput.style.borderColor = '#ef4444';
      return false;
    }

    if (pinInput) pinInput.style.borderColor = '#10b981';

    if (confirmPin && pin !== confirmPin) {
      feedbackEl.style.background = '#fef2f2';
      feedbackEl.style.color = '#dc2626';
      feedbackEl.style.border = '1px solid #fecaca';
      feedbackEl.innerText = '⚠️ Las claves no coinciden.';
      if (confirmInput) confirmInput.style.borderColor = '#ef4444';
      return false;
    }

    if (confirmPin && pin === confirmPin) {
      feedbackEl.style.background = '#f0fdf4';
      feedbackEl.style.color = '#15803d';
      feedbackEl.style.border = '1px solid #bbf7d0';
      feedbackEl.innerText = '✓ Clave válida y confirmada correctamente.';
      if (confirmInput) confirmInput.style.borderColor = '#10b981';
      return true;
    }

    feedbackEl.style.background = '#fffbe6';
    feedbackEl.style.color = '#b45309';
    feedbackEl.style.border = '1px solid #fde68a';
    feedbackEl.innerText = '✓ Clave válida. Por favor confírmela en el siguiente campo.';
    return false;
  }

  handleTutorPhotoSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.tutorPhotoData = e.target.result;
      const preview = document.getElementById('gf-tutor-photo-preview');
      if (preview) preview.src = e.target.result;
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('📷 Foto del tutor cargada correctamente.', 'success');
      }
    };
    reader.readAsDataURL(file);
  }

  handlePetPhotoSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.petPhotoData = e.target.result;
      const preview = document.getElementById('gf-pet-photo-preview');
      if (preview) preview.src = e.target.result;
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('📸 Foto de la mascota cargada correctamente.', 'success');
      }
    };
    reader.readAsDataURL(file);
  }

  selectPresetPetPhoto(photoPath) {
    this.petPhotoData = photoPath;
    const preview = document.getElementById('gf-pet-photo-preview');
    if (preview) preview.src = photoPath;
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('📸 Foto de mascota de muestra seleccionada.', 'info');
    }
  }

  handleVaccinePhotoSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.vaccinePhotos.push({ name: file.name, data: e.target.result });
        this.renderVaccinePhotoPreviews();
      };
      reader.readAsDataURL(file);
    });
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`💉 ${files.length} foto(s) de carnet de vacunas adjuntada(s).`, 'success');
    }
  }

  renderVaccinePhotoPreviews() {
    const container = document.getElementById('gf-vaccine-photos-preview-container');
    if (!container) return;
    container.innerHTML = '';
    this.vaccinePhotos.forEach((item, index) => {
      const div = document.createElement('div');
      div.style.cssText = 'position:relative; width:75px; height:75px; border-radius:10px; overflow:hidden; border:1.5px solid #d97706; font-size:0.7rem; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.1);';
      div.innerHTML = `
        <img src="${item.data}" style="width:100%; height:100%; object-fit:cover;">
        <button type="button" onclick="registrationEngine.removeVaccinePhoto(${index})" style="position:absolute; top:2px; right:2px; background:rgba(220,38,38,0.9); color:#fff; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:11px; font-weight:bold; display:flex; align-items:center; justify-content:center;">✕</button>
      `;
      container.appendChild(div);
    });
  }

  removeVaccinePhoto(index) {
    this.vaccinePhotos.splice(index, 1);
    this.renderVaccinePhotoPreviews();
  }

  bindStepEvents() {
    const speciesSelect = document.getElementById('gf-species-select');
    const breedSelect = document.getElementById('gf-breed-select');
    const customContainer = document.getElementById('gf-breed-custom-container');

    const handleBreedChange = () => {
      const breedVal = breedSelect?.value;
      if (breedVal === 'Otra raza no listada' || breedVal === 'Otra raza felina') {
        if (customContainer) customContainer.style.display = 'block';
      } else {
        if (customContainer) customContainer.style.display = 'none';
      }
    };

    if (breedSelect) {
      breedSelect.addEventListener('change', handleBreedChange);
    }

    if (speciesSelect) {
      speciesSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'Felino') {
          if (breedSelect && (!breedSelect.value || !breedSelect.value.includes('Felino'))) {
            breedSelect.value = 'Mestizo / Criollo Felino';
          }
          if (this.petPhotoData === 'assets/hero_border_collie.jpg') {
            this.selectPresetPetPhoto('assets/media__1787696472521.jpg');
          }
        } else {
          if (breedSelect && breedSelect.value.includes('Felino')) {
            breedSelect.value = '';
          }
        }
        handleBreedChange();
      });
    }
  }

  toggleParasiteWarning(show) {
    const warningEl = document.getElementById('gf-parasite-warning');
    if (warningEl) {
      warningEl.style.display = show ? 'block' : 'none';
    }
  }

  toggleDiseaseInput(show) {
    const container = document.getElementById('gf-disease-details-container');
    const questionBox = document.getElementById('gf-disease-question-box');
    if (container) {
      container.style.display = show ? 'block' : 'none';
      if (show) {
        if (questionBox) {
          questionBox.style.borderColor = '#ef4444';
          questionBox.style.background = '#fff5f5';
        }
        const textarea = document.getElementById('gf-disease-details');
        if (textarea) {
          setTimeout(() => textarea.focus(), 120);
        }
      } else {
        if (questionBox) {
          questionBox.style.borderColor = 'rgba(15,23,42,0.1)';
          questionBox.style.background = '#f8fafc';
        }
      }
    }
  }

  toggleKnotsSection(hasKnots) {
    const yesContainer = document.getElementById('gf-knots-yes-container');
    const noWarning = document.getElementById('gf-knots-no-warning');
    const questionCard = document.getElementById('gf-knots-question-card');

    if (hasKnots === true) {
      if (yesContainer) yesContainer.style.display = 'block';
      if (noWarning) noWarning.style.display = 'none';
      if (questionCard) {
        questionCard.style.borderColor = '#ef4444';
        questionCard.style.background = '#fff5f5';
      }
      const textarea = document.getElementById('gf-coat-notes');
      if (textarea) {
        this.onKnotsTextInput(textarea);
        setTimeout(() => textarea.focus(), 120);
      }
    } else if (hasKnots === false) {
      if (yesContainer) yesContainer.style.display = 'none';
      if (noWarning) noWarning.style.display = 'block';
      if (questionCard) {
        questionCard.style.borderColor = '#d97706';
        questionCard.style.background = '#fffbe6';
      }
    } else {
      if (yesContainer) yesContainer.style.display = 'none';
      if (noWarning) noWarning.style.display = 'none';
      if (questionCard) {
        questionCard.style.borderColor = '#d97706';
        questionCard.style.background = '#fffbe6';
      }
    }
  }

  onKnotsTextInput(textarea) {
    if (!textarea) return;
    const len = textarea.value.trim().length;
    const counterEl = document.getElementById('gf-knots-char-counter');
    const warningEl = document.getElementById('gf-knots-length-warning');

    if (counterEl) {
      if (len >= 200) {
        counterEl.style.background = '#dcfce7';
        counterEl.style.color = '#15803d';
        counterEl.innerText = `✓ ${len} / 200 caracteres (VÁLIDO)`;
      } else {
        counterEl.style.background = '#fee2e2';
        counterEl.style.color = '#dc2626';
        counterEl.innerText = `${len} / 200 caracteres (Faltan ${200 - len})`;
      }
    }

    if (warningEl) {
      if (len >= 200) {
        warningEl.style.display = 'none';
      } else {
        warningEl.style.display = 'block';
        warningEl.innerText = `⚠️ Falta información: Debe escribir al menos 200 caracteres detallando el tipo de nudo y la antigüedad (${len} / 200).`;
      }
    }
  }

  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > this.totalSteps) return;

    for (let i = 1; i <= this.totalSteps; i++) {
      const panel = document.getElementById(`gf-step-${i}`);
      const indicator = document.getElementById(`gf-indicator-step-${i}`);
      if (panel) panel.style.display = i === stepNumber ? 'block' : 'none';
      if (indicator) {
        if (i === stepNumber) {
          indicator.className = 'badge badge-success';
          indicator.style.background = 'var(--gold-dark, #D4AF37)';
          indicator.style.color = '#fff';
        } else if (i < stepNumber) {
          indicator.className = 'badge badge-telephony';
          indicator.style.background = '#4A6B5D';
          indicator.style.color = '#fff';
        } else {
          indicator.className = 'badge';
          indicator.style.background = '#f1f5f9';
          indicator.style.color = '#64748b';
        }
      }
    }

    this.currentStep = stepNumber;

    if (stepNumber === 4) {
      this.updateElectronicSignaturePreview();
    }
  }

  nextStep() {
    if (this.validateStep(this.currentStep)) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep() {
    this.goToStep(this.currentStep - 1);
  }

  getSelectedBreed() {
    const breedSelectVal = document.getElementById('gf-breed-select')?.value;
    const customBreedVal = document.getElementById('gf-breed-custom-input')?.value.trim();
    
    if (breedSelectVal === 'Otra raza no listada' || breedSelectVal === 'Otra raza felina') {
      return customBreedVal || 'Otra raza no listada';
    }
    return breedSelectVal || document.getElementById('gf-breed-input')?.value.trim() || '';
  }

  validateStep(step) {
    if (step === 1) {
      const name = document.getElementById('gf-tutor-name')?.value.trim();
      const petName = document.getElementById('gf-pet-name')?.value.trim();

      if (!name || !petName) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('Por favor ingrese el nombre del Tutor y de la Mascota.', 'error');
        } else {
          alert('Por favor ingrese el nombre del Tutor y de la Mascota.');
        }
        this.goToStep(1);
        const focusEl = !name ? document.getElementById('gf-tutor-name') : document.getElementById('gf-pet-name');
        if (focusEl) focusEl.focus();
        return false;
      }

      // Validar Clave de Perfil de Seguridad obligatoria
      const pin = document.getElementById('gf-tutor-pin')?.value.trim();
      const confirmPin = document.getElementById('gf-tutor-pin-confirm')?.value.trim();

      if (!pin || pin.length < 4) {
        this.validatePinInput();
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('⚠️ La Clave de Perfil es obligatoria y debe tener al menos 4 caracteres.', 'error');
        } else {
          alert('⚠️ La Clave de Perfil es obligatoria y debe tener al menos 4 caracteres.');
        }
        this.goToStep(1);
        const pinEl = document.getElementById('gf-tutor-pin');
        if (pinEl) pinEl.focus();
        return false;
      }

      if (pin !== confirmPin) {
        this.validatePinInput();
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('⚠️ La confirmación de la clave de perfil no coincide.', 'error');
        } else {
          alert('⚠️ La confirmación de la clave de perfil no coincide.');
        }
        this.goToStep(1);
        const confirmEl = document.getElementById('gf-tutor-pin-confirm');
        if (confirmEl) confirmEl.focus();
        return false;
      }

      // Validar Campo Obligatorio: Dirección (Sector) en Maracaibo (BioTracker GeoGuard)
      const sectorSelect = document.getElementById('gf-tutor-sector');
      const sectorVal = sectorSelect?.value?.trim();
      if (!sectorVal) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('📍 Por favor seleccione su Dirección (Sector) en Maracaibo para el BioTracker GeoGuard.', 'error');
        } else {
          alert('📍 Por favor seleccione su Dirección (Sector) en Maracaibo para el BioTracker GeoGuard.');
        }
        this.goToStep(1);
        if (sectorSelect) sectorSelect.focus();
        return false;
      }

      // Auto-fill fallback values for optional auxiliary fields if blank
      const rifEl = document.getElementById('gf-tutor-rif');
      if (rifEl && !rifEl.value.trim()) rifEl.value = 'V-00000000';

      const phoneEl = document.getElementById('gf-tutor-phone');
      if (phoneEl && !phoneEl.value.trim()) phoneEl.value = '+58 414-0000000';

      const emailEl = document.getElementById('gf-tutor-email');
      if (emailEl && !emailEl.value.trim()) emailEl.value = 'cliente@mrspets.com';

      const breedSelect = document.getElementById('gf-breed-select');
      if (breedSelect && !breedSelect.value) breedSelect.value = 'Mestizo / Criollo (Mediano)';
    }

    if (step === 2) {
      const hasDisease = document.querySelector('input[name="gf_disease"]:checked')?.value;
      if (hasDisease === 'Sí') {
        const diseaseDetails = document.getElementById('gf-disease-details')?.value.trim();
        if (!diseaseDetails) {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('Por favor especifique la condición médica o lesión de la mascota.', 'error');
          } else {
            alert('Por favor especifique la condición médica o lesión de la mascota.');
          }
          this.goToStep(2);
          const textarea = document.getElementById('gf-disease-details');
          if (textarea) textarea.focus();
          return false;
        }
      }
    }

    if (step === 3) {
      let hasKnotsRadio = document.querySelector('input[name="gf_has_knots"]:checked');
      if (!hasKnotsRadio) {
        const radNo = document.querySelector('input[name="gf_has_knots"][value="No"]');
        if (radNo) {
          radNo.checked = true;
          this.toggleKnotsSection(false);
          hasKnotsRadio = radNo;
        }
      }
      if (hasKnotsRadio && hasKnotsRadio.value === 'Sí') {
        const coatNotes = document.getElementById('gf-coat-notes')?.value.trim() || '';
        if (coatNotes.length < 200) {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(`⚠️ Debe ingresar al menos 200 caracteres explicando el tipo de nudos y antigüedad. Caracteres actuales: ${coatNotes.length} / 200.`, 'error');
          } else {
            alert(`⚠️ Debe ingresar al menos 200 caracteres explicando el tipo de nudos y antigüedad. Caracteres actuales: ${coatNotes.length} / 200.`);
          }
          this.goToStep(3);
          const textarea = document.getElementById('gf-coat-notes');
          if (textarea) textarea.focus();
          return false;
        }
      }
    }

    if (step === 4) {
      const termsCheck = document.getElementById('gf-terms-check');
      if (!termsCheck || !termsCheck.checked) {
        const legalBox = document.getElementById('gf-legal-acceptance-box');
        if (legalBox) {
          legalBox.style.borderColor = '#ef4444';
          legalBox.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)';
          legalBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('⚠️ Para formalizar el registro es obligatorio aceptar los Términos y el Contrato Maestro.', 'warning');
        } else {
          alert('⚠️ Para formalizar el registro es obligatorio aceptar los Términos y el Contrato Maestro.');
        }
        if (termsCheck) termsCheck.focus();
        return false;
      }
      const legalBox = document.getElementById('gf-legal-acceptance-box');
      if (legalBox) {
        legalBox.style.borderColor = '#10B981';
        legalBox.style.boxShadow = '0 4px 18px rgba(16,185,129,0.18)';
      }
    }

    return true;
  }

  submitRegistration() {
    const submitBtn = document.getElementById('gf-btn-submit-final') || document.querySelector('#registration-modal button[type="submit"]') || document.querySelector('#registration-modal .btn-primary');
    if (window.app && typeof window.app.setButtonBusy === 'function') {
      window.app.setButtonBusy(submitBtn, '⏳ Registrando cliente en base de datos...');
    }

    // 1. Auto-check default choices to avoid silent blocking
    const hasKnotsRadio = document.querySelector('input[name="gf_has_knots"]:checked');
    if (!hasKnotsRadio) {
      const radNo = document.querySelector('input[name="gf_has_knots"][value="No"]');
      if (radNo) radNo.checked = true;
    }

    const termsCheck = document.getElementById('gf-terms-check');
    if (!termsCheck || !termsCheck.checked) {
      if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
      this.goToStep(4);
      const legalBox = document.getElementById('gf-legal-acceptance-box');
      if (legalBox) {
        legalBox.style.borderColor = '#ef4444';
        legalBox.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)';
        legalBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Para formalizar el registro es obligatorio aceptar los Términos y el Contrato Maestro.', 'warning');
      } else {
        alert('⚠️ Para formalizar el registro es obligatorio aceptar los Términos y el Contrato Maestro.');
      }
      return;
    }

    // 2. Validate step by step with auto-navigation
    if (!this.validateStep(1)) {
      if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
      this.goToStep(1);
      return;
    }
    if (!this.validateStep(2)) {
      if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
      this.goToStep(2);
      return;
    }
    if (!this.validateStep(3)) {
      if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
      this.goToStep(3);
      return;
    }
    if (!this.validateStep(4)) {
      if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
      this.goToStep(4);
      return;
    }

    // 3. Datos del tutor
    const tutorName = document.getElementById('gf-tutor-name')?.value.trim() || 'Tutor VIP';
    const tutorRif = document.getElementById('gf-tutor-rif')?.value.trim() || 'V-00000000';
    const tutorPhone = document.getElementById('gf-tutor-phone')?.value.trim() || '+58 414-0000000';
    const tutorEmail = document.getElementById('gf-tutor-email')?.value.trim() || 'cliente@mrspets.com';
    const instagram = document.getElementById('gf-tutor-instagram')?.value.trim() || '';
    const tutorSector = document.getElementById('gf-tutor-sector')?.value?.trim() || 'El Milagro';
    const tutorPin = document.getElementById('gf-tutor-pin')?.value.trim() || '1234';

    // 4. Perfil de la mascota
    const petName = document.getElementById('gf-pet-name')?.value.trim() || 'Mascota VIP';
    const species = document.getElementById('gf-species-select')?.value || 'Canino';
    const breed = this.getSelectedBreed() || 'Mestizo';
    const age = document.getElementById('gf-pet-age')?.value.trim() || 'No especificada';
    const weight = document.getElementById('gf-pet-weight')?.value.trim() || '0';

    // 5. Declaración de Salud
    const parasites = document.querySelector('input[name="gf_parasites"]:checked')?.value || 'No';
    const hasDisease = document.querySelector('input[name="gf_disease"]:checked')?.value || 'No';
    const diseaseDetails = hasDisease === 'Sí' ? (document.getElementById('gf-disease-details')?.value.trim() || '') : 'Sin condiciones';
    const groomingExperience = document.querySelector('input[name="gf_experience"]:checked')?.value || 'Primera vez';

    // 6. Preferencias Estéticas y Nudos
    const bathType = document.getElementById('gf-bath-type')?.value || 'Baño estándar (champú pH neutro)';
    const cutStyle = document.getElementById('gf-cut-style')?.value || 'Corte cachorro';
    const hasKnots = document.querySelector('input[name="gf_has_knots"]:checked')?.value || 'No';
    const rawCoatNotes = document.getElementById('gf-coat-notes')?.value.trim() || '';
    const coatNotes = hasKnots === 'Sí' 
      ? rawCoatNotes 
      : 'Declarado sin nudos (Advertencia aceptada: En caso de hallazgos se notificará y aplicará recargo por desmotado técnico / solución de saneamiento)';

    // 7. Logística y Pago
    const chauffeur = document.querySelector('input[name="gf_chauffeur"]:checked')?.value || 'No';
    const paymentMethod = document.getElementById('gf-payment-method')?.value || 'Pago Móvil Banca Amiga';

    const uniqueId = `PET-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const fullSpecies = `${species} (${breed})`;

    const draft = (window.clinicaEngine && window.clinicaEngine.pendingBookingDraft) ? window.clinicaEngine.pendingBookingDraft : null;
    const hasDraft = Boolean(draft);

    const signatureTimestamp = new Date().toISOString();
    const clientIp = window._clientIp || '127.0.0.1';
    const signatureAuditId = `SIG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient = {
      id: uniqueId,
      name: petName,
      petName: petName,
      species: fullSpecies,
      breed: breed,
      age: age,
      weight: weight,
      owner: tutorName,
      ownerName: tutorName,
      rif: tutorRif,
      email: tutorEmail,
      ownerPhone: tutorPhone,
      instagram: instagram,
      sector: tutorSector,
      addressSector: tutorSector,
      address: `Sector ${tutorSector}, Maracaibo (BioTracker GeoGuard)`,
      bioTrackerSector: tutorSector,
      geoGuardActive: true,
      pin: tutorPin,
      parasites: parasites,
      diseaseDetails: diseaseDetails,
      groomingExperience: groomingExperience,
      bathType: bathType,
      cutStyle: cutStyle,
      coatNotes: coatNotes,
      chauffeur: chauffeur,
      paymentMethod: paymentMethod,
      termsAccepted: true,
      terms_accepted: true,
      electronicSignatureTimestamp: signatureTimestamp,
      electronicSignatureIp: clientIp,
      electronicSignatureEmail: tutorEmail,
      contractVersion: 'v2026.1_CONTRATO_MAESTRO',
      signatureAuditId: signatureAuditId,
      isVipRegistered: true,
      area: draft ? (draft.area || 'grooming') : 'grooming',
      service: draft
        ? (draft.area === 'clinica'
          ? (draft.service || 'Consulta Médica Veterinaria')
          : (draft.area === 'hotel'
            ? (draft.service || 'Hospedaje Suite Canina VIP')
            : `Circuito Grooming Spa 7 Estaciones (${draft.shampoo || 'Champú pH neutro'})`))
        : `Circuito Grooming Spa 7 Estaciones (Champú pH neutro)`,
      price: draft
        ? (draft.area === 'clinica' ? 30.00 : (draft.area === 'hotel' ? 45.00 : 25.00))
        : 25.00,
      stepIndex: hasDraft ? 0 : -1, // 0 = Solicitud Recibida / Pendiente por Aprobación de Staff
      hasReservation: hasDraft,
      reservationStatus: hasDraft ? 'pending_approval' : null,
      reservationDate: hasDraft ? (draft.date || new Date().toISOString().split('T')[0]) : null,
      reservationTime: hasDraft ? (draft.time || '10:00') : null,
      notes: hasDraft
        ? (draft.area === 'clinica'
          ? `Solicitud de Cita Médica para ${draft.date || 'Hoy'} a las ${draft.time || '10:00'}. Servicio: Consulta Médica Veterinaria. Pendiente por aprobación de staff.`
          : (draft.area === 'hotel'
            ? `Solicitud de Estadía en Hotel para ${draft.date || 'Hoy'} a las ${draft.time || '10:00'}. Pendiente por aprobación de staff.`
            : `Solicitud de Cita para ${draft.date || 'Hoy'} a las ${draft.time || '10:00'}. Servicio: Grooming Spa (${draft.shampoo || 'Champú pH neutro'}). Pendiente por aprobación de staff.`))
        : `Perfil VIP creado (6 Secciones). Baño: ${bathType}. Corte: ${cutStyle}. Pago: ${paymentMethod}. Firma Electrónica: ${tutorEmail} (${signatureTimestamp}). Fotos: ${this.vaccinePhotos.length} vacunas.`,
      photo: this.petPhotoData || (species === 'Felino' ? 'assets/media__1787696472521.jpg' : 'assets/hero_border_collie.jpg'),
      ownerPhoto: this.tutorPhotoData || 'assets/leia_avatar.jpg',
      vaccinePhotos: this.vaccinePhotos
    };

    // Registrar firma electrónica y sector para BioTracker GeoGuard de forma asíncrona en backend
    try {
      fetch('/api/legal/record-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: uniqueId,
          petName: petName,
          ownerName: tutorName,
          email: tutorEmail,
          rif: tutorRif,
          sector: tutorSector,
          addressSector: tutorSector,
          clientIp: clientIp,
          timestamp: signatureTimestamp,
          contractVersion: 'v2026.1_CONTRATO_MAESTRO',
          termsAccepted: true,
          terms_accepted: true
        })
      }).catch(err => console.warn('[LEGAL AUDIT] Async signature notice:', err));

      // Sincronizar de forma nativa e inmediata con BioTracker GeoGuard
      fetch('/api/biotracker/register-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: tutorName,
          petName: petName,
          sector: tutorSector
        })
      }).catch(err => console.warn('[BIOTRACKER GEOGUARD] Async sync notice:', err));
    } catch (e) {
      console.warn('[LEGAL AUDIT] Error calling signature endpoint:', e);
    }

    let created = null;
    if (window.adminEngine && typeof window.adminEngine.registerNewPatient === 'function') {
      created = window.adminEngine.registerNewPatient(newPatient);
      if (typeof window.adminEngine.refreshAllOperationalViews === 'function') {
        window.adminEngine.refreshAllOperationalViews();
      }
    } else if (window.petStatusEngine && typeof window.petStatusEngine.registerNewPet === 'function') {
      created = window.petStatusEngine.registerNewPet(newPatient);
    }

    if (window.authEngine) {
      window.authEngine.currentVipPetId = uniqueId;
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('Registrando usuario VIP y vinculando fotografías...', 'info');
    }

    setTimeout(() => {
      // 1. Update AuthEngine state for the active client user FIRST
      if (window.authEngine) {
        window.authEngine.isAuthenticated = true;
        window.authEngine.userRole = 'client';
        window.authEngine.userName = tutorName;
        window.authEngine.currentVipPetId = uniqueId;
        if (typeof window.authEngine.setProfilePinAuthenticated === 'function') {
          window.authEngine.setProfilePinAuthenticated(uniqueId, true);
        }
        localStorage.setItem('mrs_pets_skip_splash', 'true');
        if (typeof window.authEngine.hidePortalAndShowApp === 'function') {
          window.authEngine.hidePortalAndShowApp();
        }
      }

      if (window.storeEngine && typeof window.storeEngine.loadCart === 'function') {
        window.storeEngine.loadCart();
      }

      // 2. Close modal overlays and clear backdrop
      if (window.app && typeof window.app.closeModal === 'function') {
        window.app.closeModal('registration-modal');
      }
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
        modal.style.display = '';
      });

      // 3. Hide portal / splash overlays & display main app container
      const portal = document.getElementById('access-links-portal');
      if (portal) {
        portal.style.setProperty('display', 'none', 'important');
      }
      const splash = document.getElementById('auth-splash-screen');
      if (splash) {
        splash.style.setProperty('display', 'none', 'important');
      }
      const appContainer = document.getElementById('app-container');
      if (appContainer) {
        appContainer.style.setProperty('display', 'flex', 'important');
        appContainer.style.opacity = '1';
        appContainer.style.visibility = 'visible';
      }

      // 4. Set Customer environment & update account badge with tutor name & photo
      if (window.adminEngine) {
        window.adminEngine.setEnvironment('customer');
        if (typeof window.adminEngine.updateHeaderAccountDisplay === 'function') {
          window.adminEngine.updateHeaderAccountDisplay();
        }
      }

      // 5. Navigate directly to main operational screen (pet-status)
      if (window.app && typeof window.app.switchTab === 'function') {
        window.app.switchTab('pet-status', true);
      }

      // 6. WhatsApp Simulator log
      if (window.whatsappSim) {
        whatsappSim.sendMessage(`[NUEVO REGISTRO VIP CON FOTOS] Tutor: *${tutorName}* (${tutorRif}) • Sector: *${tutorSector}* (BioTracker GeoGuard) • Mascota: *${petName}* (${fullSpecies}). Declaración salud: Parásitos: ${parasites}, Condición: ${diseaseDetails}. Vacunas: ${this.vaccinePhotos.length} fotos.`);
      }

      // 7. Process booking draft if transferred from clinicaEngine
      if (draft) {
        let createdBooking = null;
        const bookingArea = draft.area || 'grooming';
        const isClinica = bookingArea === 'clinica';
        const isHotel = bookingArea === 'hotel';
        const bookingService = isClinica
          ? (draft.service || 'Consulta Médica Veterinaria')
          : (isHotel
            ? (draft.service || 'Hospedaje Suite Canina VIP')
            : `Circuito Grooming Spa 7 Estaciones (${draft.shampoo || 'Champú pH neutro'})`);
        const bookingPrice = isClinica ? 30.00 : (isHotel ? 45.00 : 25.00);

        if (window.adminEngine && typeof window.adminEngine.addPendingAppointment === 'function') {
          createdBooking = window.adminEngine.addPendingAppointment({
            id: `#APT-${Math.floor(1000 + Math.random() * 9000)}`,
            petId: newPatient.id,
            area: bookingArea,
            date: draft.date || new Date().toISOString().split('T')[0],
            time: draft.time || '10:00',
            pet: petName,
            tutor: tutorName,
            phone: tutorPhone,
            service: bookingService,
            price: bookingPrice
          });
        }

        // 🛡️ REGLA OPERATIVA: En Paso 0 (Cita en espera de validación de Staff), el carrito permanece en $0.00.
        // El cobro del servicio se ejecuta únicamente cuando el consentido llega físicamente y pasa a Paso 1 («Recibido»).

        window.clinicaEngine.pendingBookingDraft = null;

        // Screen Pop oficial: "Usted acaba de registrar un cliente nuevo" con Cita en Espera de Staff
        if (window.app && typeof window.app.showScreenPop === 'function') {
          const areaTitle = isClinica ? 'Médica Veterinaria' : (isHotel ? 'de Hotel Canino' : 'de Grooming');
          window.app.showScreenPop({
            type: 'client_booking_pending',
            headline: 'Usted acaba de registrar un cliente nuevo',
            title: `Solicitud de Cita ${areaTitle} Recibida • Pendiente por Aprobación del Staff`,
            badgeText: '🎉 EXPEDIENTE VIP CREADO • CITA EN ESPERA DE VALIDACIÓN',
            icon: isClinica ? '🩺' : (isHotel ? '🏨' : '📋'),
            accentColor: isClinica ? '#0284C7' : (isHotel ? '#10B981' : '#D97706'),
            summaryHtml: `
              <div style="background:#F8FAFC !important; border:2px solid #000000 !important; border-radius:16px; padding:16px 18px; margin-bottom:14px; color:#000000 !important;">
                <div style="font-size:0.78rem; font-weight:900; color:#000000 !important; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:10px; border-bottom:1.5px solid #000000; padding-bottom:6px; display:flex; align-items:center; gap:6px;">
                  <span>👤</span> Tutor & Paciente VIP Registrados
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; font-size:0.88rem; color:#000000 !important; margin-bottom:12px;">
                  <div><span style="font-weight:700; color:#000000 !important;">Tutor(a):</span> <strong style="color:#000000 !important;">${tutorName}</strong></div>
                  <div><span style="font-weight:700; color:#000000 !important;">Mascota:</span> <strong style="color:#000000 !important;">🐾 ${petName}</strong> (${fullSpecies})</div>
                  <div><span style="font-weight:700; color:#000000 !important;">Cédula / RIF:</span> <span style="font-family:monospace; font-weight:700; color:#000000 !important;">${tutorRif}</span></div>
                  <div><span style="font-weight:700; color:#000000 !important;">Código Paciente:</span> <strong style="color:#000000 !important;">${newPatient.id}</strong></div>
                  <div><span style="font-weight:700; color:#000000 !important;">Dirección (Sector):</span> <strong style="color:#000000 !important;">📍 ${tutorSector} (BioTracker)</strong></div>
                </div>

                <div style="background:#FEF3C7 !important; border:2px solid #000000 !important; border-radius:12px; padding:12px; margin-top:8px;">
                  <div style="font-weight:900; color:#000000 !important; font-size:0.88rem; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <span>⏳</span> Estatus de Cita ${areaTitle}: Pendiente por Aprobación del Staff
                  </div>
                  <div style="font-size:0.82rem; color:#000000 !important; font-weight:700; line-height:1.45;">
                    Su expediente VIP ha sido creado exitosamente. Su cita ${areaTitle.toLowerCase()} para <strong>${petName}</strong> está registrada para el <strong>${draft.date || 'Hoy'}</strong> a las <strong>${draft.time || '10:00'}</strong> y en espera de validación por el equipo staff de Mrs. Pets.
                  </div>
                </div>
              </div>
            `,
            buttons: [
              {
                text: '📋 Ver Estado en Control de Grooming ➔',
                primary: true,
                onClick: () => {
                  if (window.app && typeof window.app.switchTab === 'function') {
                    window.app.switchTab('pet-status', true);
                  }
                }
              },
              {
                text: '🏢 Ir al Panel Staff Operativo ➔',
                primary: false,
                onClick: () => {
                  if (window.adminEngine && typeof window.adminEngine.setEnvironment === 'function') {
                    window.adminEngine.setEnvironment('enterprise');
                  }
                  if (window.app && typeof window.app.switchTab === 'function') {
                    window.app.switchTab('admin');
                  }
                }
              },
              {
                text: '✓ Aceptar',
                primary: false,
                onClick: () => {}
              }
            ]
          });
        }

        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`✨ Ficha VIP creada y solicitud de cita para ${petName} en espera de aprobación.`, 'success');
        }
      } else {
        // SCREEN POP OFICIAL: "Usted acaba de registrar un cliente nuevo"
        if (window.app && typeof window.app.showScreenPop === 'function') {
          window.app.showScreenPop({
            type: 'client',
            headline: 'Usted acaba de registrar un cliente nuevo',
            title: '¡Ficha médica y cuenta VIP guardadas exitosamente en la Base de Datos!',
            badgeText: '🎉 CLIENTE VIP REGISTRADO EN BASE DE DATOS • MRS. PETS',
            icon: '👤',
            accentColor: '#10B981',
            summaryHtml: `
              <div style="background:#F8FAFC !important; border:2px solid #000000 !important; border-radius:16px; padding:16px 18px; margin-bottom:14px; color:#000000 !important;">
                <div style="font-size:0.78rem; font-weight:900; color:#000000 !important; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:10px; border-bottom:1.5px solid #000000; padding-bottom:6px; display:flex; align-items:center; gap:6px;">
                  <span>👤</span> Tutor & Paciente VIP Registrados
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px; font-size:0.88rem; color:#000000 !important;">
                  <div>
                    <span style="font-weight:700; color:#000000 !important;">Tutor(a):</span>
                    <strong style="display:block; font-size:1rem; color:#000000 !important;">${tutorName}</strong>
                    <span style="font-size:0.8rem; color:#000000 !important; font-weight:700;">RIF: ${tutorRif} • Tel: ${tutorPhone} • Sector: 📍 ${tutorSector} (BioTracker)</span>
                  </div>
                  <div>
                    <span style="font-weight:700; color:#000000 !important;">Mascota Paciente:</span>
                    <strong style="display:block; font-size:1rem; color:#000000 !important;">🐾 ${petName}</strong>
                    <span style="font-size:0.8rem; color:#000000 !important; font-weight:700;">${fullSpecies} • ${age}</span>
                  </div>
                </div>
                <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #000000; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:700; font-size:0.84rem; color:#000000 !important;">Clave Personal de Autorización (PIN):</span>
                  <span style="font-weight:900; font-family:monospace; font-size:1.05rem; background:#FEF3C7 !important; color:#000000 !important; padding:3px 10px; border-radius:8px; border:1.5px solid #000000;">${tutorPin}</span>
                </div>
              </div>
            `,
            buttons: [
              {
                text: '📅 Ir a Reservación (Campos Ready-to-Book) ➔',
                primary: true,
                onClick: () => {
                  const area = this.returnBookingArea || 'grooming';
                  if (area === 'clinica' && window.clinicaEngine && typeof window.clinicaEngine.openClinicaBookingModal === 'function') {
                    window.clinicaEngine.openClinicaBookingModal('Consulta Médica General', petName, tutorName);
                  } else if (area === 'hotel' && window.clinicaEngine && typeof window.clinicaEngine.openHotelBookingModal === 'function') {
                    window.clinicaEngine.openHotelBookingModal('Suite Royal Bioclimática #4', petName, tutorName);
                  } else if (window.clinicaEngine && typeof window.clinicaEngine.openGroomingBookingModal === 'function') {
                    window.clinicaEngine.openGroomingBookingModal('Circuito Grooming Spa 7 Estaciones', petName, tutorName);
                  }
                }
              },
              {
                text: '🐾 Ver Ficha en Estatus / Turnos ➔',
                primary: false,
                onClick: () => {
                  if (window.app && typeof window.app.switchTab === 'function') {
                    window.app.switchTab('pet-status', true);
                  }
                }
              },
              {
                text: '✓ Aceptar y Cerrar',
                primary: false,
                onClick: () => {}
              }
            ]
          });
        }
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`✨ ¡Bienvenido/a ${tutorName}! Registro VIP completado y cuenta activa.`, 'success');
        }
      }

      if (window.app && typeof window.app.resetButton === 'function') {
        window.app.resetButton(submitBtn);
      }
    }, 200);
  }

  resetForm() {
    ['gf-tutor-name', 'gf-tutor-rif', 'gf-tutor-phone', 'gf-tutor-email', 'gf-tutor-instagram', 'gf-tutor-pin', 'gf-tutor-pin-confirm', 'gf-pet-name', 'gf-breed-input', 'gf-breed-custom-input', 'gf-pet-age', 'gf-pet-weight', 'gf-disease-details', 'gf-coat-notes'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = '';
        el.style.borderColor = '';
      }
    });

    const pinFeedback = document.getElementById('gf-pin-feedback');
    if (pinFeedback) {
      pinFeedback.style.display = 'none';
      pinFeedback.innerText = '';
    }

    const sectorEl = document.getElementById('gf-tutor-sector');
    if (sectorEl) {
      sectorEl.selectedIndex = 0;
      sectorEl.style.borderColor = '';
    }

    const breedSelect = document.getElementById('gf-breed-select');
    if (breedSelect) breedSelect.selectedIndex = 0;

    const breedCustomContainer = document.getElementById('gf-breed-custom-container');
    if (breedCustomContainer) breedCustomContainer.style.display = 'none';

    const speciesEl = document.getElementById('gf-species-select');
    if (speciesEl) speciesEl.value = 'Canino';
    const bathEl = document.getElementById('gf-bath-type');
    if (bathEl) bathEl.selectedIndex = 0;
    const cutEl = document.getElementById('gf-cut-style');
    if (cutEl) cutEl.selectedIndex = 0;
    const payEl = document.getElementById('gf-payment-method');
    if (payEl) payEl.selectedIndex = 0;

    const radParasitesNo = document.querySelector('input[name="gf_parasites"][value="No"]');
    if (radParasitesNo) radParasitesNo.checked = true;
    const radDiseaseNo = document.querySelector('input[name="gf_disease"][value="No"]');
    if (radDiseaseNo) radDiseaseNo.checked = true;
    const radKnotsNo = document.querySelector('input[name="gf_has_knots"][value="No"]');
    if (radKnotsNo) radKnotsNo.checked = true;
    const radKnotsYes = document.querySelector('input[name="gf_has_knots"][value="Sí"]');
    if (radKnotsYes) radKnotsYes.checked = false;
    const radExpFirst = document.querySelector('input[name="gf_experience"][value="Primera vez"]');
    if (radExpFirst) radExpFirst.checked = true;
    const radChauffeurNo = document.querySelector('input[name="gf_chauffeur"][value="No"]');
    if (radChauffeurNo) radChauffeurNo.checked = true;

    const termsCheck = document.getElementById('gf-terms-check');
    if (termsCheck) termsCheck.checked = false;

    this.tutorPhotoData = 'assets/leia_avatar.jpg';
    this.petPhotoData = 'assets/hero_border_collie.jpg';
    this.vaccinePhotos = [];

    const tutorPreview = document.getElementById('gf-tutor-photo-preview');
    if (tutorPreview) tutorPreview.src = 'assets/leia_avatar.jpg';
    const petPreview = document.getElementById('gf-pet-photo-preview');
    if (petPreview) petPreview.src = 'assets/hero_border_collie.jpg';

    this.renderVaccinePhotoPreviews();
    this.toggleParasiteWarning(false);
    this.toggleDiseaseInput(false);
    this.toggleKnotsSection(null);
  }

  openRegistrationModal(prefillData) {
    this.resetForm();
    this.returnBookingArea = prefillData?.returnBookingArea || prefillData?.modalType || prefillData?.area || (window.clinicaEngine?.pendingBookingDraft?.area) || null;
    const banner = document.getElementById('gf-required-notice-banner');
    if (banner) {
      if (prefillData && prefillData.requiredNotice) {
        banner.innerHTML = prefillData.requiredNotice;
        banner.style.display = 'block';
      } else {
        banner.style.display = 'none';
        banner.innerHTML = '';
      }
    }

    if (prefillData) {
      const tutorVal = prefillData.tutorName || prefillData.name || prefillData.tutor || prefillData.owner || '';
      if (tutorVal && document.getElementById('gf-tutor-name')) {
        document.getElementById('gf-tutor-name').value = tutorVal;
      }
      if (prefillData.rif && document.getElementById('gf-tutor-rif')) document.getElementById('gf-tutor-rif').value = prefillData.rif;
      if (prefillData.phone && document.getElementById('gf-tutor-phone')) document.getElementById('gf-tutor-phone').value = prefillData.phone;
      if (prefillData.email && document.getElementById('gf-tutor-email')) document.getElementById('gf-tutor-email').value = prefillData.email;
      if (prefillData.sector && document.getElementById('gf-tutor-sector')) document.getElementById('gf-tutor-sector').value = prefillData.sector;
      const petVal = prefillData.pet || prefillData.petName || '';
      if (petVal && document.getElementById('gf-pet-name')) document.getElementById('gf-pet-name').value = petVal;
      if (prefillData.species && document.getElementById('gf-species-select')) document.getElementById('gf-species-select').value = (prefillData.species === 'Felino' || prefillData.species === 'Gato') ? 'Felino' : 'Canino';
      if (prefillData.breed) {
        const breedSelect = document.getElementById('gf-breed-select');
        let matched = false;
        if (breedSelect) {
          for (let option of breedSelect.options) {
            if (option.value.toLowerCase() === prefillData.breed.toLowerCase()) {
              breedSelect.value = option.value;
              matched = true;
              break;
            }
          }
          if (!matched) {
            breedSelect.value = 'Otra raza no listada';
            const customContainer = document.getElementById('gf-breed-custom-container');
            const customInput = document.getElementById('gf-breed-custom-input');
            if (customContainer) customContainer.style.display = 'block';
            if (customInput) customInput.value = prefillData.breed;
          }
        }
      }
      if (prefillData.pin) {
        if (document.getElementById('gf-tutor-pin')) document.getElementById('gf-tutor-pin').value = prefillData.pin;
        if (document.getElementById('gf-tutor-pin-confirm')) document.getElementById('gf-tutor-pin-confirm').value = prefillData.pin;
      }
      if (prefillData.tutorPhoto || (window.authEngine && window.authEngine.customTutorPhoto)) {
        this.tutorPhotoData = prefillData.tutorPhoto || window.authEngine.customTutorPhoto;
        const tutorPreview = document.getElementById('gf-tutor-photo-preview');
        if (tutorPreview) tutorPreview.src = this.tutorPhotoData;
      }
      if (prefillData.petPhoto || (window.authEngine && window.authEngine.customPetPhoto)) {
        this.petPhotoData = prefillData.petPhoto || window.authEngine.customPetPhoto;
        const petPreview = document.getElementById('gf-pet-photo-preview');
        if (petPreview) petPreview.src = this.petPhotoData;
      }
    }

    // Asegurar clave de perfil por defecto (1234) si está vacía para máxima fluidez y tolerancia a fallos
    const pinEl = document.getElementById('gf-tutor-pin');
    const pinConfirmEl = document.getElementById('gf-tutor-pin-confirm');
    if (pinEl && !pinEl.value) pinEl.value = '1234';
    if (pinConfirmEl && !pinConfirmEl.value) pinConfirmEl.value = '1234';
    this.validatePinInput();

    this.goToStep(1);
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('registration-modal');
    }

    // Auto-focus inteligente: si el tutor ya está precargado, enfocar la mascota; de lo contrario, enfocar tutor
    setTimeout(() => {
      const tutorInput = document.getElementById('gf-tutor-name');
      const petInput = document.getElementById('gf-pet-name');
      if (tutorInput && !tutorInput.value) {
        tutorInput.focus();
      } else if (petInput) {
        petInput.focus();
        if (petInput.value) {
          petInput.setSelectionRange(petInput.value.length, petInput.value.length);
        }
      } else if (tutorInput) {
        tutorInput.focus();
      }
    }, 150);
  }

  closeRegistrationModal() {
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('registration-modal');
    } else {
      const modal = document.getElementById('registration-modal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
      }
    }

    // Zero-Trust: Si el usuario NO está autenticado, retornar obligatoriamente al portal y bloquear acceso
    if (!window.authEngine || !window.authEngine.isAuthenticated) {
      if (window.authEngine && typeof window.authEngine.showConciergePortal === 'function') {
        window.authEngine.showConciergePortal();
      }
      localStorage.removeItem('mrs_pets_skip_splash');
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Para ingresar debe crear su usuario VIP o identificarse en "Soy un Chico Mrs Pets".', 'warning');
      }
    }
  }

  /* ==========================================================================
     MÓDULO DEL CONTRATO MAESTRO & FIRMA ELECTRÓNICA VINCULANTE
     ========================================================================== */

  openMasterContractModal(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const modal = document.getElementById('master-contract-modal');
    if (modal) {
      modal.classList.add('active');
      modal.style.setProperty('display', 'flex', 'important');
      document.body.style.overflow = 'hidden';
      const scrollContainer = document.getElementById('master-contract-scroll-container');
      if (scrollContainer) scrollContainer.scrollTop = 0;
    }
  }

  closeMasterContractModal() {
    const modal = document.getElementById('master-contract-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
      document.body.style.overflow = '';
    }
  }

  acceptAndCloseMasterContract() {
    const termsCheck = document.getElementById('gf-terms-check');
    if (termsCheck) {
      termsCheck.checked = true;
    }
    const legalBox = document.getElementById('gf-legal-acceptance-box');
    if (legalBox) {
      legalBox.style.borderColor = '#10B981';
      legalBox.style.boxShadow = '0 4px 18px rgba(16,185,129,0.18)';
    }
    this.closeMasterContractModal();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('📜 Contrato Maestro aceptado y firma electrónica vinculada.', 'success');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  updateElectronicSignaturePreview() {
    const emailInput = document.getElementById('gf-tutor-email');
    const badge = document.getElementById('gf-signature-email-badge');
    const emailVal = emailInput?.value?.trim() || '';
    if (badge) {
      if (emailVal) {
        badge.innerHTML = `<span style="color:#15803d;">✉️ ${this.escapeHtml(emailVal)}</span> <span style="color:#059669; font-weight:800;">✓</span>`;
      } else {
        badge.innerHTML = `<span style="color:#dc2626;">⚠️ (Ingrese correo en Sección 1)</span>`;
      }
    }
    const ipBadge = document.getElementById('gf-signature-ip-badge');
    if (ipBadge && window._clientIp) {
      ipBadge.innerText = window._clientIp;
    }
  }

  fetchClientIp() {
    fetch('/api/client-ip')
      .then(res => res.json())
      .then(data => {
        if (data && data.ip) {
          window._clientIp = data.ip;
          const ipBadge = document.getElementById('gf-signature-ip-badge');
          if (ipBadge) ipBadge.innerText = data.ip;
        }
      })
      .catch(() => {
        window._clientIp = window._clientIp || '127.0.0.1';
      });
  }
}

const registrationEngine = new RegistrationEngine();
window.registrationEngine = registrationEngine;
document.addEventListener('DOMContentLoaded', () => registrationEngine.init());
