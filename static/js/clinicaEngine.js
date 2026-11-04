/* ==========================================================================
   MÓDULO CLÍNICO Y DE SALUD VETERINARIA (Big & Little Dogs, C.A. • Mrs. Pets)
   - Tarjetas Verticales de Alta Definición para Consultas y Servicios.
   - Portal del Paciente Protegido por Código Privado de Cliente (PET-101 / PET-102).
   - Sistema de Reservaciones Independiente para 3 Áreas: Clínica, Grooming y Hotel.
   ========================================================================== */

class ClinicaEngine {
  constructor() {
    this.authenticatedPatientId = null;
    this.selectedFamilyId = null;
    this.selectedSubOption = null;

    // ÁREAS DE SERVICIO CLÍNICO (SILENT LUXURY • ZERO PRECIOS VISIBLES • CON IMÁGENES DE REFERENCIA)
    this.clinicalFamilies = [
      {
        id: 'fam-general',
        number: '1',
        title: 'Consulta General y Preventiva',
        icon: '🩺',
        image: 'assets/media__1787694448536.jpg',
        tagline: 'Evaluación integral, medicina preventiva y protocolos de inmunización individualizados.',
        accent: '#4A6B5D',
        subOptions: [
          {
            id: 'sub-gen-1',
            title: 'Chequeo general y control periódico',
            desc: 'Evaluación física exhaustiva, revisión de constantes vitales, auscultación cardiopulmonar y pesaje preciso.'
          },
          {
            id: 'sub-gen-2',
            title: 'Plan de vacunación integral por etapa de vida',
            desc: 'Esquemas biológicos de inmunización adaptados: cachorros, adultos y seniors con vacunas de máxima seguridad y trazabilidad.'
          },
          {
            id: 'sub-gen-3',
            title: 'Desparasitación interna y externa de amplio espectro',
            desc: 'Protocolos preventivos y curativos antiparasitarios calculados según peso, especie y estilo de vida con fármacos certificados.'
          },
          {
            id: 'sub-gen-4',
            title: 'Emisión de certificados nacionales e internacionales de salud y viaje',
            desc: 'Revisión y emisión oficial de certificados zoosanitarios, microchips y verificación para traslados nacionales e internacionales.'
          }
        ]
      },
      {
        id: 'fam-especializada',
        number: '2',
        title: 'Consultas Especializadas',
        icon: '🧬',
        image: 'assets/media__1787694901704.jpg',
        tagline: 'Abordaje médico focalizado por especialistas de segundo y tercer nivel asistencial.',
        accent: '#D4AF37',
        subOptions: [
          {
            id: 'sub-esp-1',
            title: 'Nutrición clínica y formulación de dietas terapéuticas',
            desc: 'Planes nutricionales balanceados y dietas clínicas a la medida para soporte renal, hepático, digestivo y control de peso.'
          },
          {
            id: 'sub-esp-2',
            title: 'Dermatología avanzada y manejo de atopias',
            desc: 'Diagnóstico microscópico, citología dérmica, control de alergias crónicas, dermatitis atópica y ozonoterapia terapéutica.'
          },
          {
            id: 'sub-esp-3',
            title: 'Endocrinología y control metabólico',
            desc: 'Diagnóstico y seguimiento riguroso de diabetes mellitus, hiper/hipotiroidismo, afecciones adrenales y síndrome de Cushing.'
          },
          {
            id: 'sub-esp-4',
            title: 'Medicina felina y geriatría preventiva',
            desc: 'Manejo Cat-Friendly de bajo estrés, detección precoz de osteoartritis y medicina preventiva especializada para pacientes mayores.'
          }
        ]
      },
      {
        id: 'fam-odontologia',
        number: '3',
        title: 'Odontología y Estomatología',
        icon: '🦷',
        image: 'assets/media__1787695254613.jpg',
        tagline: 'Salud bucal de vanguardia, preservación periodontal y cirugía oral indolora.',
        accent: '#4A6B5D',
        subOptions: [
          {
            id: 'sub-odo-1',
            title: 'Profilaxis ultrasónica preventiva (limpieza bucal profunda)',
            desc: 'Remoción ultrasónica completa de placa y sarro subgingival sin dolor, pulido de esmalte y tratamiento antiséptico bucal.'
          },
          {
            id: 'sub-odo-2',
            title: 'Cirugía y tratamiento periodontal',
            desc: 'Abordaje especializado de gingivitis severa, reducción de bolsas periodontales y terapia de regeneración de encías.'
          },
          {
            id: 'sub-odo-3',
            title: 'Extracción de piezas comprometidas y reconstrucción',
            desc: 'Exodoncia quirúrgica atraumática con anestesia local guiada, hemostasia avanzada y preservación de la arquitectura ósea.'
          }
        ]
      },
      {
        id: 'fam-laboratorio',
        number: '4',
        title: 'Laboratorio e Imagenología',
        icon: '🔬',
        image: 'assets/media_1789775990230.jpg',
        tagline: 'Diagnóstico de certeza con laboratorio in-house y tecnología de imagen digital avanzada.',
        accent: '#0284C7',
        subOptions: [
          {
            id: 'sub-lab-1',
            title: 'Hematología completa, perfiles bioquímicos y serología',
            desc: 'Analíticas sanguíneas inmediatas con contador hematológico automatizado, perfiles renales, hepáticos y serologías infecciosas.'
          },
          {
            id: 'sub-lab-2',
            title: 'Coprología y uroanálisis computarizado',
            desc: 'Estudios microscópicos y químicos para detección de parásitos entéricos, densidad urinaria y microcristales urinarios.'
          },
          {
            id: 'sub-lab-3',
            title: 'Radiología digital de alta resolución (Rayos X)',
            desc: 'Captura digital instantánea de alta definición para valoración torácica, abdominal y osteoarticular con mínima radiación.'
          },
          {
            id: 'sub-lab-4',
            title: 'Ecografía abdominal y ecocardiografía Doppler (Eco)',
            desc: 'Exploración ecográfica de órganos internos y flujos hemodinámicos en tiempo real con transductor multifrecuencia.'
          },
          {
            id: 'sub-lab-5',
            title: 'Acceso al Visor DICOM para interpretación de placas y estudios',
            desc: 'Acceso directo a la plataforma de visualización DICOM médica para visualización interactiva de placas y estudios de imagen.',
            actionType: 'dicom'
          }
        ]
      },
      {
        id: 'fam-cirugia',
        number: '5',
        title: 'Cirugía General y Tejidos Blandos',
        icon: '✂️',
        image: 'assets/media_1789775225842.jpg',
        tagline: 'Quirófano estéril de grado hospitalario con monitoreo multiparamétrico continuo.',
        accent: '#D4AF37',
        subOptions: [
          {
            id: 'sub-cir-1',
            title: 'Procedimientos quirúrgicos electivos y programados',
            desc: 'Esterilizaciones laparoscópicas o convencionales, resecciones profilácticas y cirugías preventivas en ambiente aséptico.'
          },
          {
            id: 'sub-cir-2',
            title: 'Cirugía de tejidos blandos y oncología quirúrgica',
            desc: 'Intervenciones abdominales complejas, excéresis de masas oncológicas con márgenes limpios y cirugía reconstructiva.'
          },
          {
            id: 'sub-cir-3',
            title: 'Monitoreo anestésico multimodal y recuperación asistida',
            desc: 'Anestesia inhalatoria isoflurano/sevoflurano con capnografía continua, ECG, oximetría y manta térmica durante la recuperación.'
          }
        ]
      },
      {
        id: 'fam-urgencias',
        number: '6',
        title: 'Urgencias y Tele-Triage 24/7',
        icon: '🚨',
        image: 'assets/mrs_pets_golden_welcome_1787694735845.jpg',
        tagline: 'Respuesta médica crítica inmediata y triaje continuo para situaciones de riesgo vital.',
        accent: '#DC2626',
        subOptions: [
          {
            id: 'sub-urg-1',
            title: 'Botón de Emergencia SOS con enlace de prioridad médica',
            desc: 'Alerta prioritaria directa con el equipo médico de guardia y preparación inmediata del box de reanimación o quirófano.',
            isUrgent: true,
            actionType: 'sos'
          },
          {
            id: 'sub-urg-2',
            title: 'Tele-triaje guiado para evaluación de riesgo vital',
            desc: 'Orientación médica inmediata remota para clasificar la gravedad de los síntomas y guiar los primeros auxilios pre-llegada.',
            actionType: 'tele_triage'
          },
          {
            id: 'sub-urg-3',
            title: 'Protocolo de estabilización y atención de pacientes críticos',
            desc: 'Oxigenoterapia intensiva, soporte circulatorio con fluidoterapia intravenosa continua y control analgésico de emergencia.'
          }
        ]
      },
      {
        id: 'fam-hospitalizacion',
        number: '7',
        title: 'Hospitalización, UCI y Red de Especialistas',
        icon: '🏥',
        image: 'assets/media_1789777167509.jpg',
        tagline: 'Unidades de cuidado continuo, streaming privado para el tutor y juntas médicas.',
        accent: '#4A6B5D',
        subOptions: [
          {
            id: 'sub-hosp-1',
            title: 'Unidad de Cuidados Intensivos (UCI) con soporte vital continuo',
            desc: 'Módulos hospitalarios climatizados, oxigenación asistida, bombas de infusión continua y vigilancia veterinaria presencial 24/7.'
          },
          {
            id: 'sub-hosp-2',
            title: 'Streaming privado de monitoreo en jaula (Cam Cams para tutores)',
            desc: 'Transmisión de video encriptada de alta definición para que el tutor supervise el descanso de su mascota en tiempo real.',
            actionType: 'cam_cams'
          },
          {
            id: 'sub-hosp-3',
            title: 'Interconsultas y juntas médicas virtuales con especialistas externos',
            desc: 'Ateneo clínico interdisciplinario con especialistas nacionales e internacionales para consenso diagnóstico y terapéutico.'
          }
        ]
      }
    ];

    // Cargar conceptos personalizados desde almacenamiento local
    this.tempConceptImageDataUrl = null;
    this.loadCustomConcepts();

    // Servicios clínicos legacy preservados para retrocompatibilidad
    this.clinicalServices = [];

    // Staff Médico Principal
    this.staff = [
      {
        id: 'DOC-1',
        name: 'Dr. Alejandro Morales',
        title: 'Director Médico & Cirujano Principal',
        credentials: 'MV. M.Sc. Cirugía de Tejidos Blandos (LUZ • España)',
        philosophy: 'Medicina veterinaria basada en evidencia y trato compasivo con tecnología de vanguardia.',
        specialties: ['Cirugía General', 'Traumatología', 'Medicina Interna'],
        avatar: '👨‍⚕️',
        photo: 'assets/leia_avatar.jpg',
        availability: 'Disponible Hoy'
      },
      {
        id: 'DOC-2',
        name: 'Dra. Valentina Vargas',
        title: 'Especialista en Medicina Interna y Diagnóstico',
        credentials: 'MV. Especialista en Imagenología y Ecografía (UCV)',
        philosophy: 'Diagnóstico preciso y oportuno para prolongar la calidad de vida de nuestros pacientes.',
        specialties: ['Ecografía Fascial', 'Cardiología', 'Diagnóstico por Imagen'],
        avatar: '👩‍⚕️',
        availability: 'Citas Mañana'
      },
      {
        id: 'DOC-3',
        name: 'Dr. Roberto Mendoza',
        title: 'Especialista en Etología y Comportamiento Animal',
        credentials: 'MV. Diplomado en Medicina del Comportamiento (IAABC)',
        philosophy: 'Bienestar emocional y modificación conductual positiva para una convivencia armónica.',
        specialties: ['Etología Canina/Felina', 'Ansiedad por Separación', 'Rehabilitación'],
        avatar: '🧑‍⚕️',
        availability: 'Disponible Jueves'
      }
    ];

    this.loadStaffFromStorage();

    // Base de datos de expedientes médicos privados
    this.patientsDatabase = {
      'PET-101': {
        patientCode: 'PET-101',
        petName: 'Princesa',
        species: 'Yorkshire Terrier VIP',
        owner: 'Dalybell Ramírez Montilla',
        phone: '+58 (414) 389-1102',
        photo: 'assets/media__1787695246337.jpg',
        records: [
          { date: '15/08/2026', service: 'Vacunación', detail: 'Sextuple Canina + Rabia. Certificado #VAC-902.', vet: 'Dr. Alejandro Morales', status: 'Completado' },
          { date: '02/07/2026', service: 'Consulta General', detail: 'Evaluación profiláctica y corte de uñas spa.', vet: 'Dra. Valentina Vargas', status: 'Normal' }
        ],
        labResults: [
          { id: 'LAB-901', type: 'Hematología Completa + Química Sanguínea', date: '15/08/2026', file: 'Hematologia_Princesa_PET101.pdf', size: '1.2 MB' }
        ]
      },
      'PET-102': {
        patientCode: 'PET-102',
        petName: 'Fifi',
        species: 'Teckel / Dachshund',
        owner: 'Carlos Mendoza',
        phone: '+58 (424) 998-1243',
        photo: 'assets/media__1787695254613.jpg',
        records: [
          { date: '20/08/2026', service: 'Profilaxis Dental Especializada', detail: 'Limpieza ultrasónica bucal e higiene periodontal sin inflamación.', vet: 'Dra. Valentina Vargas', status: 'Exitoso' }
        ],
        labResults: [
          { id: 'LAB-902', type: 'Perfil Renal e Higiene Periodontal', date: '20/08/2026', file: 'Perfil_Dental_Fifi_PET102.pdf', size: '2.4 MB' }
        ]
      }
    };
  }

  init() {
    this.renderClinicalAccordion();
    this.renderStaff();
    this.renderPrivatePatientPortal();
  }

  // Alias retrocompatible
  renderClinicalServices() {
    this.renderClinicalAccordion();
  }

  // 1. RENDERIZADO DEL ACORDEÓN DE ÁREAS DE SERVICIO CLÍNICO (SILENT LUXURY • ZERO PRECIOS • CON IMÁGENES DE REFERENCIA)
  renderClinicalAccordion() {
    const container = document.getElementById('clinica-families-accordion');
    if (!container) return;

    container.innerHTML = '';

    this.clinicalFamilies.forEach(fam => {
      const isOpen = this.selectedFamilyId === fam.id;
      const card = document.createElement('div');
      card.className = `clinica-family-card ${isOpen ? 'is-open' : ''}`;
      card.id = `clinica-card-${fam.id}`;

      // Sub-opciones HTML
      const subOptionsHTML = fam.subOptions.map(sub => {
        const isSelected = this.selectedSubOption && this.selectedSubOption.subOptionId === sub.id;
        let actionBadge = `<span class="clinica-sub-badge">🩺 Especialidad</span>`;
        if (sub.actionType === 'sos' || sub.isUrgent) {
          actionBadge = `<span class="clinica-sub-badge clinica-badge-urgent">🚨 Prioridad Inmediata</span>`;
        } else if (sub.actionType === 'dicom') {
          actionBadge = `<span class="clinica-sub-badge clinica-badge-info">🔬 Visor DICOM</span>`;
        } else if (sub.actionType === 'cam_cams') {
          actionBadge = `<span class="clinica-sub-badge clinica-badge-streaming">📹 Cam Cams HD</span>`;
        }

        const subImgHTML = sub.image
          ? `<div style="height:95px; width:100%; border-radius:8px; overflow:hidden; margin-bottom:10px; border:1px solid rgba(212,175,55,0.3); box-shadow:0 2px 6px rgba(0,0,0,0.06);"><img src="${sub.image}" alt="${sub.title}" style="width:100%; height:100%; object-fit:cover; display:block;"></div>`
          : '';

        return `
          <div class="clinica-suboption-card ${isSelected ? 'is-selected' : ''}" 
               id="subcard-${sub.id}"
               onclick="clinicaEngine.selectSubOption('${fam.id}', '${sub.id}')"
               role="button"
               tabindex="0"
               aria-label="${sub.title}">
            ${subImgHTML}
            <div class="clinica-suboption-header">
              <h5 class="clinica-suboption-title">${sub.title}</h5>
              <div class="clinica-check-indicator">${isSelected ? '✓' : '+'}</div>
            </div>
            <p class="clinica-suboption-desc">${sub.desc}</p>
            <div class="clinica-suboption-meta">
              ${actionBadge}
              <span class="clinica-tap-hint">${isSelected ? '✓ Seleccionado' : 'Toque para cotizar'}</span>
            </div>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <div class="clinica-family-header" onclick="clinicaEngine.toggleFamily('${fam.id}')" role="button" tabindex="0">
          <div class="clinica-family-identity">
            <span class="clinica-family-number" style="display:none !important;" data-number="${fam.number}"></span>
            <div class="clinica-area-thumb-box" style="position:relative; width:52px; height:52px; border-radius:12px; overflow:hidden; border:1.5px solid #D4AF37; flex-shrink:0; box-shadow:0 3px 8px rgba(0,0,0,0.08);">
              <img src="${fam.image}" alt="${fam.title}" style="width:100%; height:100%; object-fit:cover; display:block;">
              <span style="position:absolute; bottom:1px; right:1px; font-size:0.75rem; background:#FFFFFF; border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.2);">${fam.icon}</span>
            </div>
            <div class="clinica-family-titles">
              <h4 class="clinica-family-title">${fam.title}</h4>
              <p class="clinica-family-tagline">${fam.tagline}</p>
            </div>
          </div>
          <div class="clinica-family-controls">
            <span class="clinica-family-count">${fam.subOptions.length} Procedimientos</span>
            <span class="clinica-family-chevron" id="chevron-${fam.id}">▾</span>
          </div>
        </div>
        <div class="clinica-family-body" id="body-${fam.id}">
          <!-- Banner Fotográfico de Referencia Clínica -->
          <div class="clinica-area-reference-banner" style="position:relative; width:100%; height:130px; border-radius:14px; overflow:hidden; margin-bottom:16px; border:1px solid rgba(212, 175, 55, 0.35); box-shadow:0 4px 14px rgba(0,0,0,0.05);">
            <img src="${fam.image}" alt="${fam.title}" style="width:100%; height:100%; object-fit:cover; display:block; filter:brightness(0.92);">
            <div style="position:absolute; bottom:0; left:0; right:0; padding:10px 16px; background:linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0) 100%); color:#FFFFFF; display:flex; justify-content:space-between; align-items:flex-end;">
              <div>
                <span style="font-size:0.68rem; font-weight:800; letter-spacing:0.6px; text-transform:uppercase; color:#D4AF37;">📸 Imagen de Referencia Clínica</span>
                <div style="font-size:0.88rem; font-weight:700; color:#FFFFFF;">${fam.title}</div>
              </div>
              <button type="button" onclick="event.stopPropagation(); clinicaEngine.openCreateConceptModal('${fam.id}')" style="background:rgba(212,175,55,0.25); color:#FFFFFF; border:1px solid #D4AF37; padding:4px 10px; border-radius:8px; font-size:0.72rem; font-weight:700; cursor:pointer;">
                ➕ Crear Nuevo Concepto
              </button>
            </div>
          </div>

          <div class="clinica-suboptions-grid">
            ${subOptionsHTML}
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // Actualizar barra flotante según estado actual
    this.updateFloatingBar();
  }

  // TOQUE 1: DESPLIEGUE FLUIDO DEL ÁREA SELECCIONADA
  toggleFamily(familyId) {
    if (this.selectedFamilyId === familyId) {
      this.selectedFamilyId = null;
    } else {
      this.selectedFamilyId = familyId;
    }

    this.clinicalFamilies.forEach(fam => {
      const card = document.getElementById(`clinica-card-${fam.id}`);
      const chevron = document.getElementById(`chevron-${fam.id}`);

      if (fam.id === this.selectedFamilyId) {
        if (card) card.classList.add('is-open');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      } else {
        if (card) card.classList.remove('is-open');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      }
    });
  }

  // TOQUE 2: SELECCIÓN DE SUB-OPCIÓN Y ACTIVACIÓN DE BOTÓN DE ACCIÓN
  selectSubOption(familyId, subOptionId) {
    const family = this.clinicalFamilies.find(f => f.id === familyId);
    if (!family) return;
    const subOption = family.subOptions.find(s => s.id === subOptionId);
    if (!subOption) return;

    this.selectedFamilyId = familyId;
    this.selectedSubOption = {
      familyId: family.id,
      familyTitle: family.title,
      familyIcon: family.icon,
      subOptionId: subOption.id,
      subOptionTitle: subOption.title,
      subOptionDesc: subOption.desc,
      actionType: subOption.actionType || null,
      isUrgent: subOption.isUrgent || false
    };

    // Asegurar que el área esté expandida visualmente
    const card = document.getElementById(`clinica-card-${family.id}`);
    if (card && !card.classList.contains('is-open')) {
      card.classList.add('is-open');
      const chevron = document.getElementById(`chevron-${family.id}`);
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    }

    // Actualizar clases de selección en la interfaz
    document.querySelectorAll('.clinica-suboption-card').forEach(el => {
      el.classList.remove('is-selected');
      const ind = el.querySelector('.clinica-check-indicator');
      if (ind) ind.textContent = '+';
      const hint = el.querySelector('.clinica-tap-hint');
      if (hint) hint.textContent = 'Toque para cotizar';
    });

    const activeCard = document.getElementById(`subcard-${subOption.id}`);
    if (activeCard) {
      activeCard.classList.add('is-selected');
      const ind = activeCard.querySelector('.clinica-check-indicator');
      if (ind) ind.textContent = '✓';
      const hint = activeCard.querySelector('.clinica-tap-hint');
      if (hint) hint.textContent = '✓ Seleccionado';
    }

    // Habilitar y actualizar barra flotante de acción
    this.updateFloatingBar();

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✨ ${subOption.title} seleccionado. Toque "Solicitar Cita / Cotización" para continuar.`, 'info');
    }
  }

  // ACTUALIZACIÓN DE BARRA FLOTANTE DE ACCIÓN (SILENT LUXURY)
  updateFloatingBar() {
    const bar = document.getElementById('clinica-floating-action-bar');
    if (!bar) return;

    if (!this.selectedSubOption) {
      bar.style.display = 'none';
      return;
    }

    const { familyTitle, familyIcon, subOptionTitle, actionType, isUrgent } = this.selectedSubOption;

    const badgeEl = document.getElementById('clinica-selected-family-badge');
    if (badgeEl) {
      badgeEl.innerHTML = `${familyIcon} ${familyTitle}`;
    }

    const titleEl = document.getElementById('clinica-selected-title');
    if (titleEl) {
      titleEl.textContent = subOptionTitle;
    }

    const btn = document.getElementById('clinica-request-quote-btn');
    if (btn) {
      if (isUrgent || actionType === 'sos') {
        btn.innerHTML = '🚨 Solicitar Enlace de Urgencia SOS ➔';
        btn.style.background = '#DC2626';
        btn.style.borderColor = '#EF4444';
      } else if (actionType === 'dicom') {
        btn.innerHTML = '🔬 Agendar Cita / Abrir Visor DICOM ➔';
        btn.style.background = '#0284C7';
        btn.style.borderColor = '#38BDF8';
      } else if (actionType === 'cam_cams') {
        btn.innerHTML = '📹 Solicitar Ingreso / Ver Cam Cams ➔';
        btn.style.background = '#4A6B5D';
        btn.style.borderColor = '#D4AF37';
      } else {
        btn.innerHTML = '🌿 Solicitar Cita / Cotización con el Especialista ➔';
        btn.style.background = '#4A6B5D';
        btn.style.borderColor = '#D4AF37';
      }
    }

    bar.style.display = 'block';
  }

  // DESELECCIONAR
  clearSelection() {
    this.selectedSubOption = null;
    document.querySelectorAll('.clinica-suboption-card').forEach(el => {
      el.classList.remove('is-selected');
      const ind = el.querySelector('.clinica-check-indicator');
      if (ind) ind.textContent = '+';
      const hint = el.querySelector('.clinica-tap-hint');
      if (hint) hint.textContent = 'Toque para cotizar';
    });

    const bar = document.getElementById('clinica-floating-action-bar');
    if (bar) bar.style.display = 'none';

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('Selección médica cancelada.', 'info');
    }
  }

  // CONEXIÓN CON FLUJO AUTOMATIZADO INTERNO (SOLICITUD DE CITA / COTIZACIÓN)
  requestAppointmentQuote() {
    if (!this.selectedSubOption) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor seleccione primero una opción médica.', 'warning');
      }
      return;
    }

    const { familyTitle, subOptionTitle, actionType, isUrgent } = this.selectedSubOption;
    const fullService = `${familyTitle}: ${subOptionTitle}`;

    // Disparadores especiales
    if (actionType === 'sos' || isUrgent) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🚨 Protocolo SOS: Notificando al equipo de guardia y preparando box de atención prioritaria.', 'warning');
      }
    } else if (actionType === 'dicom') {
      if (window.mrsPetsArch && typeof window.mrsPetsArch.openDicomViewer === 'function') {
        window.mrsPetsArch.openDicomViewer();
      }
    } else if (actionType === 'cam_cams') {
      if (window.mrsPetsArch && typeof window.mrsPetsArch.openHotelCam === 'function') {
        window.mrsPetsArch.openHotelCam('Suite UCI Bioclimática');
      }
    }

    // Apertura del modal clínico con el servicio preconfigurado
    this.openClinicaBookingModal(fullService);

    // Precargar nota confidencial de cotización en el motivo de consulta
    const reasonEl = document.getElementById('booking-clinica-reason');
    if (reasonEl) {
      reasonEl.value = `Solicitud de evaluación para "${subOptionTitle}" (${familyTitle}). Requiere cotización confidencial personalizada con el especialista.`;
    }
  }

  // ACCESO RÁPIDO DE EMERGENCIA
  triggerSOS() {
    this.toggleFamily('fam-urgencias');
    this.selectSubOption('fam-urgencias', 'sub-urg-1');
    const targetCard = document.getElementById('clinica-card-fam-urgencias');
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // CARGA DE CONCEPTOS CLÍNICOS PERSONALIZADOS PERSISTIDOS
  loadCustomConcepts() {
    try {
      const saved = localStorage.getItem('mrspets_custom_clinical_concepts');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          list.forEach(concept => {
            const area = this.clinicalFamilies.find(f => f.id === concept.areaId);
            if (area && !area.subOptions.some(s => s.id === concept.id)) {
              area.subOptions.push(concept);
            }
          });
        }
      }
    } catch (e) {
      console.warn('[CLINICA] Error loading custom concepts:', e);
    }
  }

  // CONFIGURACIÓN: ABRIR MODAL PARA CREAR NUEVO CONCEPTO CON SUBIDA DE IMAGEN
  openCreateConceptModal(presetAreaId = null) {
    const select = document.getElementById('new-concept-area-select');
    if (select) {
      select.innerHTML = this.clinicalFamilies.map(fam => `
        <option value="${fam.id}" ${presetAreaId === fam.id ? 'selected' : ''}>
          ${fam.icon} ${fam.title}
        </option>
      `).join('');
    }

    // Limpiar campos
    const nameInput = document.getElementById('new-concept-name');
    if (nameInput) nameInput.value = '';
    const descInput = document.getElementById('new-concept-desc');
    if (descInput) descInput.value = '';
    const urlInput = document.getElementById('new-concept-image-url');
    if (urlInput) urlInput.value = '';
    const actionSelect = document.getElementById('new-concept-action-type');
    if (actionSelect) actionSelect.value = '';

    // Resetear imagen cargada
    this.tempConceptImageDataUrl = null;
    const previewContainer = document.getElementById('new-concept-preview-container');
    if (previewContainer) previewContainer.style.display = 'none';
    const previewImg = document.getElementById('new-concept-preview-img');
    if (previewImg) previewImg.src = '';
    const dropzone = document.getElementById('new-concept-dropzone');
    if (dropzone) dropzone.style.borderColor = '#D4AF37';

    // Abrir modal
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('create-concept-modal');
    }
  }

  // GESTIÓN DE SUBIDA DE IMAGEN DE REFERENCIA (FILE READER / DRAG & DROP)
  handleConceptImageUpload(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor seleccione un archivo de imagen válido (JPG, PNG, WebP).', 'warning');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.tempConceptImageDataUrl = e.target.result;

      const previewContainer = document.getElementById('new-concept-preview-container');
      const previewImg = document.getElementById('new-concept-preview-img');
      const filenameLabel = document.getElementById('new-concept-preview-filename');

      if (previewImg) previewImg.src = e.target.result;
      if (filenameLabel) filenameLabel.textContent = `Archivo: ${file.name} (${Math.round(file.size / 1024)} KB)`;
      if (previewContainer) previewContainer.style.display = 'block';

      const dropzone = document.getElementById('new-concept-dropzone');
      if (dropzone) dropzone.style.borderColor = '#4A6B5D';

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('📸 Imagen de referencia cargada correctamente.', 'success');
      }
    };
    reader.readAsDataURL(file);
  }

  clearConceptImage(event) {
    if (event) event.stopPropagation();
    this.tempConceptImageDataUrl = null;

    const fileInput = document.getElementById('new-concept-image-file');
    if (fileInput) fileInput.value = '';

    const previewContainer = document.getElementById('new-concept-preview-container');
    if (previewContainer) previewContainer.style.display = 'none';

    const previewImg = document.getElementById('new-concept-preview-img');
    if (previewImg) previewImg.src = '';

    const dropzone = document.getElementById('new-concept-dropzone');
    if (dropzone) dropzone.style.borderColor = '#D4AF37';
  }

  handleConceptImageUrl(url) {
    const cleanUrl = url ? url.trim() : '';
    if (cleanUrl && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('assets/'))) {
      this.tempConceptImageDataUrl = cleanUrl;
      const previewContainer = document.getElementById('new-concept-preview-container');
      const previewImg = document.getElementById('new-concept-preview-img');
      const filenameLabel = document.getElementById('new-concept-preview-filename');

      if (previewImg) previewImg.src = cleanUrl;
      if (filenameLabel) filenameLabel.textContent = `URL: ${cleanUrl.slice(0, 32)}...`;
      if (previewContainer) previewContainer.style.display = 'block';
    }
  }

  // GUARDAR Y PUBLICAR EL NUEVO CONCEPTO CLÍNICO CON SU IMAGEN DE REFERENCIA
  saveNewConcept(event) {
    if (event) event.preventDefault();

    const areaSelect = document.getElementById('new-concept-area-select');
    const nameInput = document.getElementById('new-concept-name');
    const descInput = document.getElementById('new-concept-desc');
    const actionSelect = document.getElementById('new-concept-action-type');

    const areaId = areaSelect ? areaSelect.value : null;
    const name = nameInput ? nameInput.value.trim() : '';
    const desc = descInput ? descInput.value.trim() : '';
    const actionType = actionSelect ? actionSelect.value : null;

    if (!name || !desc) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor complete el nombre y la descripción médica del concepto.', 'warning');
      }
      return;
    }

    const area = this.clinicalFamilies.find(f => f.id === areaId);
    if (!area) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Área de servicio clínico de destino no encontrada.', 'error');
      }
      return;
    }

    // Imagen asignada: imagen subida por el usuario o imagen de referencia del área
    const imageToUse = this.tempConceptImageDataUrl || area.image || 'assets/media__1787694448536.jpg';

    const newConcept = {
      id: `sub-custom-${Date.now()}`,
      areaId: area.id,
      title: name,
      desc: desc,
      image: imageToUse,
      actionType: actionType || null,
      isCustom: true
    };

    area.subOptions.push(newConcept);

    // Persistir en localStorage
    try {
      const saved = localStorage.getItem('mrspets_custom_clinical_concepts');
      let list = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];
      list.push(newConcept);
      localStorage.setItem('mrspets_custom_clinical_concepts', JSON.stringify(list));
    } catch (e) {
      console.warn('[CLINICA] Error persisting custom concept:', e);
    }

    // Re-renderizar acordeón clínico en tiempo real
    this.renderClinicalAccordion();

    // Desplegar el área y seleccionar el nuevo concepto
    this.selectedFamilyId = area.id;
    this.selectSubOption(area.id, newConcept.id);

    // Cerrar modal
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('create-concept-modal');
    }

    // Mostrar modal enriquecido de confirmación de guardado
    this.showConceptSavedConfirmation(newConcept, area);

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✨ Concepto "${name}" creado exitosamente con su imagen de referencia en ${area.title}.`, 'success');
    }

    // Scroll hacia la tarjeta del área
    const targetCard = document.getElementById(`clinica-card-${area.id}`);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  showConceptSavedConfirmation(concept, area) {
    if (!concept || !area) return;
    this._lastSavedConcept = { concept, area };

    const imgEl = document.getElementById('saved-concept-img-preview');
    if (imgEl) imgEl.src = concept.image || 'assets/media__1787694448536.jpg';

    const nameEl = document.getElementById('saved-concept-name-display');
    if (nameEl) nameEl.textContent = concept.title || 'Concepto Clínico';

    const areaEl = document.getElementById('saved-concept-area-badge');
    if (areaEl) areaEl.textContent = area.title || 'Área Clínica';

    const descEl = document.getElementById('saved-concept-desc-display');
    if (descEl) descEl.textContent = concept.desc || '';

    const actionEl = document.getElementById('saved-concept-action-display');
    if (actionEl) {
      let actionLabel = 'Consulta Médica / Cotización';
      if (concept.actionType === 'dicom') actionLabel = '🔬 Visor DICOM Radiológico';
      else if (concept.actionType === 'sos') actionLabel = '🚨 Urgencias SOS Prioritarias';
      else if (concept.actionType === 'cam_cams') actionLabel = '📹 Streaming Cam Cams HD';
      actionEl.innerHTML = `<strong>Acción Operativa:</strong> ${actionLabel}`;
    }

    if (window.app && typeof window.app.playSuccessChime === 'function') {
      window.app.playSuccessChime();
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('concept-saved-success-modal');
    }
  }

  goToAreaOfSavedConcept() {
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('concept-saved-success-modal');
    }
    if (window.app && typeof window.app.switchTab === 'function') {
      window.app.switchTab('clinica');
    }
    if (this._lastSavedConcept && this._lastSavedConcept.area) {
      const areaId = this._lastSavedConcept.area.id;
      const conceptId = this._lastSavedConcept.concept.id;
      setTimeout(() => {
        this.selectedFamilyId = areaId;
        this.selectSubOption(areaId, conceptId);
        const targetCard = document.getElementById(`clinica-card-${areaId}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }

  openCreateConceptAgain() {
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('concept-saved-success-modal');
    }
    setTimeout(() => {
      this.openCreateConceptModal();
    }, 150);
  }

  loadStaffFromStorage() {
    try {
      const saved = localStorage.getItem('mrs_pets_clinica_staff');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.staff = parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load clinica staff from localStorage:", e);
    }
    this.syncStaffWithAdminProfiles();
  }

  // SINCRONIZACIÓN REACTIVA BIDIRECCIONAL CON ADMIN STAFF PROFILES
  syncStaffWithAdminProfiles() {
    let adminProfiles = [];
    try {
      if (window.adminEngine && Array.isArray(window.adminEngine.staffProfiles) && window.adminEngine.staffProfiles.length > 0) {
        adminProfiles = window.adminEngine.staffProfiles;
      } else {
        const raw = localStorage.getItem('mrs_pets_staff_profiles');
        if (raw) adminProfiles = JSON.parse(raw);
      }
    } catch (e) {}

    if (!Array.isArray(adminProfiles) || adminProfiles.length === 0) return;

    // Dr. Alejandro Morales (Director Médico & Cirujano Principal)
    const drMorales = adminProfiles.find(u => 
      u.id === 'USR-01' || 
      ((u.username || '').toLowerCase() === 'dr.morales') ||
      ((u.name || '').toLowerCase().includes('alejandro morales'))
    );

    if (drMorales) {
      let doc1 = this.staff.find(d => d.id === 'DOC-1' || (d.name && d.name.toLowerCase().includes('morales')));
      if (!doc1) {
        doc1 = {
          id: 'DOC-1',
          name: 'Dr. Alejandro Morales',
          title: 'Director Médico & Cirujano Principal',
          credentials: 'MV. M.Sc. Cirugía de Tejidos Blandos (LUZ • España)',
          philosophy: 'Medicina veterinaria basada en evidencia y trato compasivo con tecnología de vanguardia.',
          specialties: ['Cirugía General', 'Traumatología', 'Medicina Interna'],
          avatar: '👨‍⚕️',
          photo: 'assets/leia_avatar.jpg',
          availability: 'Disponible Hoy'
        };
        this.staff.unshift(doc1);
      }
      doc1.name = 'Dr. Alejandro Morales';
      if (drMorales.photo) {
        doc1.photo = drMorales.photo;
      }
      const isActive = (drMorales.active !== false && drMorales.estado !== 'inactivo');
      doc1.availability = isActive ? 'Disponible Hoy' : 'No Disponible';
      doc1.active = isActive;
    }

    // Dra. Patricia Silva (USR-08 / dra.silva)
    const draSilva = adminProfiles.find(u => 
      u.id === 'USR-08' || 
      ((u.username || '').toLowerCase() === 'dra.silva') ||
      ((u.name || '').toLowerCase().includes('patricia silva'))
    );

    if (draSilva) {
      let docSilva = this.staff.find(d => d.id === 'DOC-SILVA' || (d.name && d.name.toLowerCase().includes('patricia silva')));
      if (!docSilva) {
        docSilva = {
          id: 'DOC-SILVA',
          name: 'Dra. Patricia Silva',
          title: 'Médico Veterinario Especialista',
          credentials: 'MV. Especialista en Cuidados Intensivos y Neonatología (LUZ)',
          philosophy: 'Atención personalizada y compasiva con los más altos estándares hospitalarios.',
          specialties: ['Medicina Felina', 'Cuidados Intensivos', 'Dermatología'],
          avatar: '👩‍⚕️',
          photo: 'assets/leia_avatar.jpg',
          availability: 'Disponible Hoy'
        };
        this.staff.splice(1, 0, docSilva);
      }
      docSilva.name = 'Dra. Patricia Silva';
      if (draSilva.photo) {
        docSilva.photo = draSilva.photo;
      }
      const isSilvaActive = (draSilva.active !== false && draSilva.estado !== 'inactivo');
      docSilva.availability = isSilvaActive ? 'Disponible Hoy' : 'No Disponible';
      docSilva.active = isSilvaActive;
    }

    try {
      localStorage.setItem('mrs_pets_clinica_staff', JSON.stringify(this.staff));
    } catch (e) {}
  }

  // STAFF MÉDICO CON ESTÉTICA SILENT LUXURY Y FOTOS REALES
  renderStaff() {
    const container = document.getElementById('clinica-staff-grid');
    if (!container) return;

    this.syncStaffWithAdminProfiles();

    container.innerHTML = '';
    this.staff.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'clinica-staff-card';
      const hasPhoto = !!(doc.photo && doc.photo.trim().length > 0);
      const photoHtml = hasPhoto
        ? `<img src="${doc.photo}" alt="${doc.name}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; display:block;" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">`
        : '';
      const fallbackDisplay = hasPhoto ? 'none' : 'flex';

      const isAvailable = !doc.availability || (!doc.availability.toLowerCase().includes('no') && !doc.availability.toLowerCase().includes('inactiv'));
      const availBg = isAvailable ? 'rgba(74, 107, 93, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      const availColor = isAvailable ? '#4A6B5D' : '#DC2626';
      const availBorder = isAvailable ? 'rgba(74, 107, 93, 0.25)' : 'rgba(239, 68, 68, 0.25)';

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
          <div style="width:64px; height:64px; border-radius:50%; background:rgba(212, 175, 55, 0.12); border:2.5px solid #D4AF37; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; position:relative; box-shadow:0 4px 14px rgba(212,175,55,0.22);">
            ${photoHtml}
            <div style="display:${fallbackDisplay}; width:100%; height:100%; align-items:center; justify-content:center; font-size:1.9rem;">
              ${doc.avatar || '👨‍⚕️'}
            </div>
          </div>
          <div>
            <h4 style="font-size:1.15rem; font-weight:700; color:#2C2C2E; margin:0 0 3px 0; letter-spacing:-0.2px;">${doc.name}</h4>
            <div style="font-size:0.75rem; color:#B48A1E; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">${doc.title}</div>
          </div>
        </div>

        <div style="font-size:0.8rem; color:#4A6B5D; margin-bottom:12px; font-weight:600; line-height:1.4;">${doc.credentials}</div>
        <p style="font-size:0.83rem; color:#52525B; line-height:1.5; margin-bottom:18px; font-style:italic;">"${doc.philosophy}"</p>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(0, 0, 0, 0.06); padding-top:14px; margin-top:auto;">
          <span style="font-size:0.75rem; font-weight:700; color:${availColor}; background:${availBg}; padding:4px 10px; border-radius:20px; border:1px solid ${availBorder};">
            ● ${doc.availability}
          </span>
          <button type="button" class="btn btn-secondary btn-sm" onclick="clinicaEngine.openClinicaBookingModal('Consulta Especializada con ${doc.name}')" style="background:#FBFBFD; color:#2C2C2E; border:1px solid rgba(0,0,0,0.12); font-weight:600; padding:7px 14px; border-radius:8px; cursor:pointer;">
            Agendar Consulta ➔
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderPrivatePatientPortal() {
    const container = document.getElementById('private-patient-portal-container');
    if (!container) return;

    if (!this.authenticatedPatientId) {
      container.innerHTML = `
        <div class="card" style="background: linear-gradient(135deg, #0b0f19 0%, #1e293b 100%); color:white; padding:32px; border-radius:24px; border:1px solid rgba(251,191,36,0.3); text-align:center;">
          <div style="width:64px; height:64px; border-radius:50%; background:rgba(251,191,36,0.15); border:2px solid #fbbf24; display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 16px auto;">🔐</div>
          <h3 style="font-size:1.4rem; font-weight:900; color:#ffffff; margin-bottom:8px;">Portal Privado de Expedientes Médicos</h3>
          <p style="font-size:0.9rem; color:#cbd5e1; max-width:540px; margin:0 auto 20px auto;">
            Los historiales médicos y exámenes de laboratorio no son públicos. Ingrese su <strong>Código Privado de Cliente</strong> (ej: <code>PET-101</code> o <code>PET-102</code>) para acceder a su expediente digital.
          </p>
          <div style="display:flex; justify-content:center; gap:12px; max-width:400px; margin:0 auto;">
            <input type="text" id="patient-code-input" class="form-input" placeholder="Ej: PET-101" style="background:#ffffff; color:#0b0f19; font-weight:800; border-radius:12px; text-transform:uppercase;">
            <button class="btn btn-primary" onclick="clinicaEngine.authenticatePatient()" style="padding:12px 24px;">Ingresar ➔</button>
          </div>
          <div style="margin-top:16px; font-size:0.78rem; color:#94a3b8;">
            Códigos de prueba disponibles: 
            <span style="color:#fbbf24; cursor:pointer; font-weight:800;" onclick="clinicaEngine.quickLogin('PET-101')">PET-101 (Princesa)</span> | 
            <span style="color:#fbbf24; cursor:pointer; font-weight:800;" onclick="clinicaEngine.quickLogin('PET-102')">PET-102 (Fifi)</span>
          </div>
        </div>
      `;
    } else {
      const patient = this.patientsDatabase[this.authenticatedPatientId];
      if (!patient) return;

      container.innerHTML = `
        <div class="card" ondblclick="analytics.openTraceabilityModal('${this.authenticatedPatientId}')" style="border:2px solid #fbbf24; padding:28px; border-radius:24px; background:#ffffff; cursor:pointer;" title="💡 Haz doble clic para ver el histórico de staff que atendió a ${patient.petName}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid rgba(217,119,6,0.2);">
            <div style="display:flex; align-items:center; gap:16px;">
              <img src="${patient.photo}" style="width:64px; height:64px; border-radius:50%; object-fit:cover; border:3px solid #fbbf24; box-shadow:0 0 15px rgba(251,191,36,0.4);">
              <div>
                <span class="badge" style="background:#fffbe6; color:#d97706; font-weight:900;">EXPEDIENTE VERIFICADO: ${patient.patientCode}</span>
                <h3 style="font-size:1.5rem; font-weight:900; color:var(--obsidian-black); margin-top:2px;">${patient.petName} <span style="font-size:0.9rem; font-weight:600; color:var(--text-muted);">(${patient.species})</span></h3>
                <div style="font-size:0.82rem; color:var(--text-muted);">Tutor Responsable: <strong>${patient.owner}</strong> • ${patient.phone}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); analytics.openTraceabilityModal('${this.authenticatedPatientId}')" style="background:#4A6B5D; color:white; font-weight:800; border-radius:10px; border:none; padding:8px 14px; cursor:pointer;">
                📋 Etapas & Estatus de Atención
              </button>
              <button class="btn btn-secondary btn-sm" onclick="clinicaEngine.logoutPatient()">🔒 Cerrar Sesión Privada</button>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:24px;">
            <div>
              <h4 style="font-size:1.1rem; font-weight:800; margin-bottom:14px; color:var(--obsidian-black);">Historial de Atenciones Clínicas</h4>
              <div class="data-table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Servicio</th>
                      <th>Detalle Médico</th>
                      <th>Veterinario</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${patient.records.map(r => `
                      <tr>
                        <td style="font-weight:700;">${r.date}</td>
                        <td><span class="badge" style="background:#f1f5f9; color:#475569;">${r.service}</span></td>
                        <td style="font-size:0.82rem;">${r.detail}</td>
                        <td style="font-size:0.8rem; font-weight:700; color:#d97706;">${r.vet}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 style="font-size:1.1rem; font-weight:800; margin-bottom:14px; color:var(--obsidian-black);">Resultados de Laboratorio PDF & DICOM</h4>
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${patient.labResults.map(lab => `
                  <div style="background:#f8fafc; padding:14px; border-radius:12px; border:1px solid rgba(217,119,6,0.2); display:flex; align-items:center; justify-content:space-between;">
                    <div>
                      <div style="font-weight:800; font-size:0.88rem; color:var(--obsidian-black);">${lab.type}</div>
                      <div style="font-size:0.75rem; color:var(--text-muted);">Emitido: ${lab.date} • ${lab.size}</div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="clinicaEngine.downloadPDF('${lab.file}')">
                      📄 Descargar PDF
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  quickLogin(code) {
    this.authenticatedPatientId = code;
    this.renderPrivatePatientPortal();
    app.showToast(`Acceso privado concedido para expediente ${code}.`, 'success');
  }

  authenticatePatient() {
    const input = document.getElementById('patient-code-input');
    const code = input ? input.value.trim().toUpperCase() : '';
    if (this.patientsDatabase[code]) {
      this.authenticatedPatientId = code;
      this.renderPrivatePatientPortal();
      app.showToast(`Expediente médico de ${code} desbloqueado exitosamente.`, 'success');
    } else {
      app.showToast('Código de paciente no encontrado. Pruebe con PET-101 o PET-102.', 'error');
    }
  }

  logoutPatient() {
    this.authenticatedPatientId = null;
    this.renderPrivatePatientPortal();
    app.showToast('Sesión privada de paciente cerrada.', 'info');
  }

  // =========================================================================
  // 3 RESERVACIONES SEPARADAS: CLÍNICA, GROOMING Y HOTEL
  // =========================================================================

  ensureStaffValidation(modalId) {
    return true;
  }

  ensureVipRegistration(name, pet, modalId) {
    if (!this.ensureStaffValidation(modalId)) {
      return false;
    }

    const cleanTutor = name ? name.trim() : '';
    const cleanPet = pet ? pet.split('(')[0].trim() : '';

    if (!cleanTutor || !cleanPet) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor ingrese el Nombre del Tutor y de la Mascota para agendar la cita.', 'error');
      }
      return false;
    }

    const existingPatient = this.findExistingPatient(cleanPet, cleanTutor);
    if (existingPatient) {
      if (window.authEngine) window.authEngine.currentVipPetId = existingPatient.id;
      return true;
    } else {
      if (modalId && modalId.includes('clinica')) {
        // En área clínica se permite agendar directamente al nuevo paciente/cliente
        return true;
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`⚠️ El tutor "${cleanTutor}" / mascota "${cleanPet}" no está registrado en la base de datos. Se requiere crear la Ficha VIP primero.`, 'warning');
      }
      let modalType = 'grooming';
      if (modalId && modalId.includes('clinica')) modalType = 'clinica';
      if (modalId && modalId.includes('hotel')) modalType = 'hotel';
      if (modalId && modalId.includes('tienda')) modalType = 'tienda';

      this.redirectToVipRegistration(null, modalType);
      return false;
    }
  }

  toggleBookingPinVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.innerText = '🔒';
    } else {
      input.type = 'password';
      if (btn) btn.innerText = '👁️';
    }
  }

  isBookingForThirdParty(bookingTutorName) {
    if (!window.authEngine || !window.authEngine.isAuthenticated) return false;
    if (window.authEngine.userRole === 'staff') return false; // El staff puede agendar en nombre de cualquier cliente
    if (window.authEngine.userRole === 'visitor' || window.authEngine.userRole === 'guest') return false; // Rol visitante: libre agendamiento

    const loggedUser = (window.authEngine.userName || '').toLowerCase().trim();
    if (!loggedUser) return false;

    const bookingTutor = (bookingTutorName || '').toLowerCase().trim();
    if (!bookingTutor) return false;

    // Remover sufijo "(Tutor de ...)" si existe en userName
    const cleanLogged = loggedUser.split('(')[0].trim();

    return !this.isNameMatch(cleanLogged, bookingTutor) && !this.isFullTutorMatch(cleanLogged, bookingTutor);
  }

  ensureProfileSecurityUnlocked(existingPatient, onUnlockedCallback, enteredPin = null, modalType = 'clinica', bookingTutorName = null) {
    if (!existingPatient || !existingPatient.id) {
      if (modalType === 'clinica') {
        // Paciente nuevo en clínica: se autoriza el alta directa con el PIN asignado
        return true;
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Se requiere registrar la Ficha VIP con clave personal antes de agendar.', 'error');
      }
      return false;
    }

    const isThirdParty = this.isBookingForThirdParty(bookingTutorName || existingPatient.owner || existingPatient.ownerName);
    const expectedPin = (existingPatient && existingPatient.pin) ? String(existingPatient.pin).trim() : '1234';

    // 0. Reconocimiento de Sesión VIP Activa (el usuario ya ingresó con PIN en "Soy un Chico VIP")
    const isSessionAuthed = Boolean(
      window.authEngine && (
        (typeof window.authEngine.isProfilePinAuthenticated === 'function' && window.authEngine.isProfilePinAuthenticated(existingPatient.id)) ||
        (window.authEngine.isAuthenticated && !isThirdParty && (window.authEngine.userRole === 'client' || window.authEngine.userRole === 'staff'))
      )
    );

    // Si ya está autenticado en sesión activa y no es reserva para un tercero, autorizar directamente
    if (isSessionAuthed && !isThirdParty) {
      if (window.authEngine && typeof window.authEngine.setProfilePinAuthenticated === 'function') {
        window.authEngine.setProfilePinAuthenticated(existingPatient.id, true);
      }
      return true;
    }

    // 1. Si el usuario ingresó la clave en el campo del formulario de reservación
    if (enteredPin !== null && enteredPin !== undefined && String(enteredPin).trim() !== '') {
      const cleanPin = String(enteredPin).trim();
      if (cleanPin === expectedPin) {
        if (window.authEngine && typeof window.authEngine.setProfilePinAuthenticated === 'function') {
          window.authEngine.setProfilePinAuthenticated(existingPatient.id, true);
        }
        return true;
      } else {
        const pinInput = document.getElementById(`booking-${modalType}-pin`);
        if (pinInput) {
          pinInput.style.borderColor = '#EF4444';
          pinInput.classList.add('shake-anim');
          setTimeout(() => pinInput.classList.remove('shake-anim'), 400);
          pinInput.focus();
          pinInput.select();
        }
        const errMsg = isThirdParty
          ? '❌ Clave de autorización del titular incorrecta. Para evitar instrucciones cruzadas, se exige la clave personal del titular destino.'
          : `❌ Clave personal incorrecta para ${existingPatient.owner || 'este titular'}. Ingrese la clave correcta para autorizar la reservación.`;
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(errMsg, 'error');
        }
        return false;
      }
    }

    // 2. Si no se ingresó en el campo ni está autenticado en sesión, desplegar el modal de clave personal / autorización
    if (window.authEngine && typeof window.authEngine.requestProfilePin === 'function') {
      const titularName = existingPatient.owner || existingPatient.ownerName || bookingTutorName || 'Titular VIP';
      const petName = existingPatient.name || existingPatient.petName || 'Mascota VIP';
      const promptTitle = isThirdParty
        ? '🔒 Clave de Autorización Requerida (Reserva a Tercero)'
        : '🔒 Clave Personal Requerida para Agendar';
      const promptDesc = isThirdParty
        ? `Estás realizando una reserva para el titular ${titularName} (Mascota: ${petName}). Para evitar instrucciones cruzadas, se exige obligatoriamente la clave de autorización del titular.`
        : 'Por seguridad, confirme su clave personal para autorizar esta reservación.';

      window.authEngine.requestProfilePin(existingPatient.id, (verifiedPin) => {
        const pinInput = document.getElementById(`booking-${modalType}-pin`);
        if (pinInput && verifiedPin) pinInput.value = verifiedPin;
        if (typeof onUnlockedCallback === 'function') {
          onUnlockedCallback();
        }
      }, {
        forcePrompt: true, // NADIE puede saltarse la clave al agendar
        title: promptTitle,
        desc: promptDesc
      });
      return false;
    }

    return false;
  }

  isNameMatch(haystack, needle) {
    if (!haystack || !needle) return false;
    const h = haystack.toLowerCase().trim();
    const n = needle.toLowerCase().trim();

    if (h === n) return true;
    if (h.startsWith(n) || n.startsWith(h)) return true;

    const hWords = h.split(/\s+/);
    const nWords = n.split(/\s+/);

    return hWords.some(hw => {
      return nWords.some(nw => {
        if (hw === nw) return true;
        if (hw.startsWith(nw) || nw.startsWith(hw)) return true;
        if (nw.length >= 4 && hw.includes(nw)) return true;
        return false;
      });
    });
  }

  isFullTutorMatch(dbTutorName, inputStr) {
    if (!dbTutorName || !inputStr) return false;

    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const h = norm(dbTutorName);
    const n = norm(inputStr);

    if (!h || !n) return false;
    if (h === n) return true;

    const hWords = h.split(/\s+/);
    const nWords = n.split(/\s+/);

    if (nWords.length < hWords.length) return false;

    return nWords.every((nw, i) => {
      const hw = hWords[i] || '';
      if (!hw) return false;
      if (hw === nw) return true;
      if (nw.length >= 4 && hw.length >= 4 && Math.abs(hw.length - nw.length) <= 1) {
        if (hw.startsWith(nw) || nw.startsWith(hw)) return true;
      }
      return false;
    });
  }

  formatTimeWithAmPm(timeStr) {
    if (!timeStr) return '08:00 AM';
    const clean = String(timeStr).trim();
    if (clean.includes('AM') || clean.includes('PM')) return clean;

    const parts = clean.split(':');
    let hours = parseInt(parts[0], 10);
    if (isNaN(hours)) hours = 8;
    const minutes = parseInt(parts[1], 10) || 0;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    let formattedHours = hours % 12;
    if (formattedHours === 0) formattedHours = 12;

    const hStr = String(formattedHours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    return `${hStr}:${mStr} ${ampm}`;
  }

  updateTimeAmPmBadge(modalType = 'grooming') {
    const timeInput = document.getElementById(`booking-${modalType}-time`);
    const badgeEl = document.getElementById(`${modalType}-ampm-badge`);
    if (!timeInput || !badgeEl) return;

    const val = timeInput.value || '08:00';
    const parts = val.split(':');
    const hours = parseInt(parts[0], 10) || 8;
    const formatted = this.formatTimeWithAmPm(val);

    if (hours < 12) {
      badgeEl.style.background = '#ecfdf5';
      badgeEl.style.color = '#047857';
      badgeEl.style.border = '1px solid #a7f3d0';
      badgeEl.innerHTML = `🌅 ${formatted} (Mañana AM)`;
    } else {
      badgeEl.style.background = '#fffbe6';
      badgeEl.style.color = '#b45309';
      badgeEl.style.border = '1px solid #fde68a';
      badgeEl.innerHTML = `☀️ ${formatted} (Tarde PM)`;
    }
  }

  getSmartBookingTime(dateStr) {
    // 🌅 Siempre iniciar por defecto a las 08:00 AM para arrancar la jornada, sin importar si es de día o de noche
    return '08:00';
  }

  checkSlotAvailability(area, date, time) {
    if (window.adminEngine && typeof window.adminEngine.checkSlotAvailability === 'function') {
      return window.adminEngine.checkSlotAvailability(area, date, time);
    }
    // Fallback de contingencia directa con localStorage si adminEngine no está disponible
    try {
      const saved = localStorage.getItem('mrs_pets_blocked_slots');
      if (saved) {
        const list = JSON.parse(saved);
        const normTime = String(time || '').trim().substring(0, 5);
        const normDate = String(date || '').trim().split('T')[0];
        const normArea = String(area || '').toLowerCase().trim();
        const blocked = list.find(b => {
          if (!b) return false;
          const bDate = String(b.date || '').trim().split('T')[0];
          if (bDate !== normDate) return false;
          const bArea = String(b.area || '').toLowerCase().trim();
          if (bArea !== 'all' && bArea !== 'todas' && bArea !== normArea) return false;
          const bTime = String(b.time || '').trim().substring(0, 5);
          if (b.time === 'all_day' || b.time === 'all' || !b.time) return true;
          return bTime === normTime;
        });
        if (blocked) {
          const reasonText = blocked.reason ? ` (${blocked.reason})` : '';
          return { available: false, reason: `Horario restringido/bloqueado por el personal${reasonText}`, blockedEntry: blocked };
        }
      }
    } catch(e) {}
    return { available: true };
  }

  validateSlotAvailability(modalType = 'grooming') {
    const dateInput = document.getElementById(`booking-${modalType}-date`) || document.getElementById(`booking-${modalType}-checkin`);
    const timeInput = document.getElementById(`booking-${modalType}-time`);
    if (!dateInput || !timeInput) return;

    const dateVal = dateInput.value;
    const timeVal = timeInput.value;
    const warningEl = document.getElementById(`${modalType}-blocked-slot-warning`);

    // Si es modal de Grooming y timeInput es select, refrescar opciones de horarios bloqueados
    if (modalType === 'grooming' && timeInput.tagName === 'SELECT') {
      Array.from(timeInput.options).forEach(opt => {
        const optTime = opt.value;
        const optCheck = this.checkSlotAvailability('grooming', dateVal, optTime);
        if (!opt.dataset.originalText) {
          opt.dataset.originalText = opt.innerText;
        }
        if (!optCheck.available) {
          opt.disabled = true;
          opt.innerText = `⛔ ${opt.dataset.originalText} (Bloqueado: ${optCheck.blockedEntry?.reason || 'No disponible'})`;
        } else {
          opt.disabled = false;
          opt.innerText = opt.dataset.originalText;
        }
      });
    }

    const check = this.checkSlotAvailability(modalType, dateVal, timeVal);
    if (!check.available) {
      if (warningEl) {
        warningEl.style.display = 'block';
        warningEl.innerHTML = `⚠️ <strong>Horario No Disponible:</strong> ${check.reason}.<br><span style="font-size:0.78rem; color:#7f1d1d;">Por favor seleccione otra hora o fecha para su cita.</span>`;
      }
      timeInput.style.borderColor = '#EF4444';
      timeInput.style.backgroundColor = '#FEF2F2';
    } else {
      if (warningEl) {
        warningEl.style.display = 'none';
        warningEl.innerHTML = '';
      }
      timeInput.style.borderColor = '';
      timeInput.style.backgroundColor = '';
    }
  }

  onTimeChange(modalType = 'grooming') {
    if (modalType === 'grooming') {
      this.updateTimeAmPmBadge('grooming');
    } else if (modalType === 'clinica') {
      this.updateBudgetPreviewTime();
    }
    this.validateSlotAvailability(modalType);
  }

  displayBlockedSlotAlert(modalType, date, time, reason) {
    const warningEl = document.getElementById(`${modalType}-blocked-slot-warning`);
    if (warningEl) {
      warningEl.style.display = 'block';
      warningEl.innerHTML = `⛔ <strong>Horario Bloqueado en Agenda:</strong> ${reason}.<br><span style="font-size:0.8rem; font-weight:800;">Fecha: ${date} • Hora: ${time}</span><br><span style="font-size:0.78rem;">Por favor seleccione otro horario disponible para su cita.</span>`;
      warningEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  onDateChange(modalType = 'grooming') {
    const dateInput = document.getElementById(`booking-${modalType}-date`) || document.getElementById(`booking-${modalType}-checkin`);
    const timeInput = document.getElementById(`booking-${modalType}-time`);
    if (dateInput && timeInput) {
      timeInput.value = this.getSmartBookingTime(dateInput.value);
      this.updateTimeAmPmBadge(modalType);
    }
    this.validateSlotAvailability(modalType);
  }

  getAllPatients() {
    let allPatients = [];
    if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
      allPatients = allPatients.concat(window.adminEngine.patientsStatus);
    }
    if (window.petStatusEngine && Array.isArray(window.petStatusEngine.pets)) {
      allPatients = allPatients.concat(window.petStatusEngine.pets);
    }
    const map = new Map();
    allPatients.forEach(p => {
      if (p.id) map.set(p.id, p);
      else map.set(JSON.stringify(p), p);
    });
    return Array.from(map.values());
  }

  getAllTutors() {
    const patients = this.getAllPatients();
    const tutors = patients.map(p => p.owner || p.ownerName).filter(Boolean);
    return Array.from(new Set(tutors));
  }

  getPetsForTutor(tutorName) {
    if (!tutorName) return [];
    const cleanTutor = tutorName.trim();
    if (!cleanTutor) return [];
    const patients = this.getAllPatients();
    return patients.filter(p => {
      const pOwner = p.owner || p.ownerName || '';
      return this.isFullTutorMatch(pOwner, cleanTutor) || this.isNameMatch(pOwner, cleanTutor);
    });
  }

  findExistingPatient(petName, tutorName) {
    const cleanPet = petName ? petName.split('(')[0].trim() : '';
    const cleanTutor = tutorName ? tutorName.trim() : '';

    if (!cleanPet && !cleanTutor) return null;

    const allPatients = this.getAllPatients();

    const matched = allPatients.find(p => {
      const pPet = p.name || p.petName || '';
      const pOwner = p.owner || p.ownerName || '';

      const petMatch = cleanPet ? (cleanPet.length >= 2 && this.isNameMatch(pPet, cleanPet)) : false;
      const tutorMatch = cleanTutor ? (this.isFullTutorMatch(pOwner, cleanTutor) || this.isNameMatch(pOwner, cleanTutor)) : false;

      if (cleanPet && cleanTutor) {
        return petMatch && tutorMatch;
      } else if (cleanTutor) {
        return this.isFullTutorMatch(pOwner, cleanTutor) || this.isNameMatch(pOwner, cleanTutor);
      } else if (cleanPet) {
        return petMatch;
      }
      return false;
    });

    return matched || null;
  }

  setupBookingPinField(modalType, activeUser, finalPet, finalTutor) {
    const pinInput = document.getElementById(`booking-${modalType}-pin`);
    const pinBadge = document.getElementById(`booking-${modalType}-pin-badge`);

    // 🔒 REGLA DE SEGURIDAD ESTRICTA (Mrs. Pets Anti-Suplantación):
    // El campo de PIN NUNCA se rellena automáticamente por código con la clave de la base de datos.
    // Permanece en blanco para que el usuario ingrese su clave personal
    // o para que el administrador de contraseñas de su propio dispositivo la complete si la guardó allí.
    if (pinInput) {
      pinInput.value = '';
      pinInput.style.borderColor = '#CBD5E1';
    }
    if (pinBadge) {
      pinBadge.innerHTML = '🔒 Clave Personal Requerida para Confirmar';
      pinBadge.style.background = '#FEF3C7';
      pinBadge.style.color = '#D97706';
      pinBadge.style.border = '1px solid #FCD34D';
    }
  }

  // 1. CLÍNICA VETERINARIA BOOKING
  openClinicaBookingModal(serviceTitle = 'Consulta Médica General', prefillPetName = '', prefillTutorName = '', options = {}) {
    const titleEl = document.getElementById('booking-clinica-service');
    if (titleEl) titleEl.innerText = serviceTitle;

    const isClientAuth = Boolean(window.authEngine && window.authEngine.isAuthenticated && window.authEngine.userRole === 'client');
    const activeUser = (isClientAuth && typeof window.authEngine.getCurrentUser === 'function')
      ? window.authEngine.getCurrentUser()
      : null;

    const isReset = Boolean(options && options.resetBlank);
    const finalTutor = (isReset || !isClientAuth) ? (prefillTutorName || '') : (prefillTutorName || (activeUser && activeUser.tutorName ? activeUser.tutorName : ''));
    let finalPet = (isReset || !isClientAuth) ? (prefillPetName || '') : (prefillPetName || (activeUser && activeUser.petName ? activeUser.petName : ''));
    if (!finalPet && finalTutor && isClientAuth) {
      const tutorPets = this.getPetsForTutor(finalTutor);
      if (tutorPets && tutorPets.length > 0) {
        const p = tutorPets[0];
        finalPet = `${p.name || p.petName}${p.species ? ` (${p.species})` : ''}`;
      }
    }

    const tutorInput = document.getElementById('booking-clinica-name');
    if (tutorInput) tutorInput.value = finalTutor;

    const petInput = document.getElementById('booking-clinica-pet');
    if (petInput) petInput.value = finalPet;

    // Contact fields: in blank if reset or new, or activeUser's if authenticated client
    const emailInput = document.getElementById('booking-clinica-email');
    if (emailInput) {
      emailInput.value = (isClientAuth && activeUser && activeUser.email && !isReset) ? activeUser.email : '';
    }

    const phoneInput = document.getElementById('booking-clinica-phone');
    if (phoneInput) {
      phoneInput.value = (isClientAuth && activeUser && activeUser.phone && !isReset) ? activeUser.phone : '';
    }

    const reasonInput = document.getElementById('booking-clinica-reason');
    if (reasonInput) {
      reasonInput.value = '';
    }

    this.setupBookingPinField('clinica', activeUser, finalPet, finalTutor);

    const dateInput = document.getElementById('booking-clinica-date');
    if (dateInput) {
      const today = new Date();
      dateInput.value = today.toISOString().split('T')[0];
    }

    const timeInput = document.getElementById('booking-clinica-time');
    if (timeInput) {
      timeInput.value = this.getSmartBookingTime(dateInput ? dateInput.value : null);
    }

    const studySelect = document.getElementById('booking-clinica-study');
    if (studySelect && serviceTitle && serviceTitle !== 'Consulta Médica General') {
      const matchOpt = Array.from(studySelect.options).find(o => o.value.toLowerCase().includes(serviceTitle.toLowerCase()) || serviceTitle.toLowerCase().includes(o.value.toLowerCase()));
      if (matchOpt) {
        studySelect.value = matchOpt.value;
      }
    }

    this.updateBudgetVesDisplay();

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('booking-modal-clinica');
    } else {
      const modal = document.getElementById('booking-modal-clinica');
      if (modal) modal.classList.add('active');
    }

    this.lookupClient('clinica');
    setTimeout(() => this.validateSlotAvailability('clinica'), 50);
  }

  updateBudgetVesDisplay() {
    const amountInput = document.getElementById('booking-clinica-amount');
    const displayEl = document.getElementById('booking-clinica-bcv-display');
    const amount = (amountInput && parseFloat(amountInput.value)) ? parseFloat(amountInput.value) : 45.00;
    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) ? window.FinancialEngine.bcvRate : 48.50;
    const bcvSlot = (window.FinancialEngine && window.FinancialEngine.bcvSlot) ? window.FinancialEngine.bcvSlot : '11:00 AM';
    const totalVes = amount * bcvRate;
    const formattedVes = totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (displayEl) {
      displayEl.innerHTML = `💵 <strong>$${amount.toFixed(2)} USD</strong> • <strong>Bs. ${formattedVes}</strong> (Tasa Oficial BCV: ${bcvRate.toFixed(2)} Bs./USD [${bcvSlot}])`;
    }
  }

  onStudyChange(studyTitle) {
    const amountInput = document.getElementById('booking-clinica-amount');
    if (!amountInput) return;

    if (studyTitle.includes('Consulta Médica Veterinaria + Rayos X')) {
      amountInput.value = '65.00';
    } else if (studyTitle.includes('Abdomen Simple')) {
      amountInput.value = '50.00';
    } else if (studyTitle.includes('Ecografía Abdominal')) {
      amountInput.value = '55.00';
    } else if (studyTitle.includes('Consulta Médica General Especializada')) {
      amountInput.value = '30.00';
    } else {
      amountInput.value = '45.00'; // Default Rayos X de alta resolución
    }
    this.updateBudgetVesDisplay();
  }

  updateBudgetPreviewDoctor() {
    const docSelect = document.getElementById('booking-clinica-doctor');
    const docName = docSelect ? docSelect.value : 'Dr. Carlos Mendoza (Especialista en Imagenología & Rayos X)';
    const targetEl = document.getElementById('mbp-doctor-name');
    if (targetEl) targetEl.innerText = docName;
  }

  updateBudgetPreviewTime() {
    const dateInput = document.getElementById('booking-clinica-date');
    const timeInput = document.getElementById('booking-clinica-time');
    const targetEl = document.getElementById('mbp-scheduled-datetime');
    if (targetEl && dateInput && timeInput) {
      targetEl.innerText = `${dateInput.value || 'Hoy'} @ ${timeInput.value || '09:00 AM'}`;
    }
  }

  previewClinicalBudget() {
    const nameInput = document.getElementById('booking-clinica-name');
    const petInput = document.getElementById('booking-clinica-pet');
    let rawTutor = nameInput ? nameInput.value.trim() : '';
    let rawPet = petInput ? petInput.value.trim() : '';

    if (!rawTutor || !rawPet) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor ingrese el Nombre del Tutor y de la Mascota para generar el presupuesto.', 'warning');
      }
      if (!rawTutor && nameInput) nameInput.focus();
      else if (!rawPet && petInput) petInput.focus();
      return;
    }

    const cleanTutor = rawTutor;
    const cleanPet = rawPet.split('(')[0].trim();
    const existing = this.findExistingPatient(cleanPet, cleanTutor);

    const docSelect = document.getElementById('booking-clinica-doctor');
    const doctorVal = docSelect ? docSelect.value : 'Dr. Carlos Mendoza (Especialista en Imagenología & Rayos X)';

    const studySelect = document.getElementById('booking-clinica-study');
    const studyVal = studySelect ? studySelect.value : 'Radiología digital de alta resolución (Rayos X)';

    const dateVal = document.getElementById('booking-clinica-date')?.value || new Date().toISOString().split('T')[0];
    const timeVal = document.getElementById('booking-clinica-time')?.value || '09:00';
    const reasonVal = document.getElementById('booking-clinica-reason')?.value.trim() || 'Estudio de Rayos X de alta resolución / valoración preventiva.';

    const amountInput = document.getElementById('booking-clinica-amount');
    const amountVal = (amountInput && parseFloat(amountInput.value)) ? parseFloat(amountInput.value) : 45.00;

    const emailVal = document.getElementById('booking-clinica-email')?.value.trim() || existing?.email || 'cliente@mrspets.com';
    const phoneVal = document.getElementById('booking-clinica-phone')?.value.trim() || existing?.ownerPhone || '+58 414-6799510';
    const targetRif = existing?.rif || 'V-18.452.910';
    const speciesVal = existing?.species || (rawPet.includes('(') ? rawPet.split('(')[1].replace(')', '') : 'Canino/Felino VIP');

    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) ? window.FinancialEngine.bcvRate : 48.50;
    const bcvSlot = (window.FinancialEngine && window.FinancialEngine.bcvSlot) ? window.FinancialEngine.bcvSlot : '11:00 AM';
    const totalVes = amountVal * bcvRate;
    const formattedVes = totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Rellenar campos del modal #medical-budget-preview-modal
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };

    const correlative = `#PRE-${Date.now().toString().slice(-6)}`;
    setText('mbp-correlative-code', correlative);
    setText('mbp-issue-date', new Date().toLocaleDateString('es-VE'));

    setText('mbp-doctor-name', doctorVal);
    setText('mbp-study-name', studyVal);
    setText('mbp-scheduled-datetime', `${dateVal} @ ${timeVal}`);

    setText('mbp-patient-name', cleanPet);
    setText('mbp-patient-species', speciesVal);
    setText('mbp-tutor-name', cleanTutor);
    setText('mbp-tutor-rif', targetRif);
    setText('mbp-tutor-email', emailVal);
    setText('mbp-tutor-phone', phoneVal);
    setText('mbp-reason-text', reasonVal);

    setText('mbp-table-study-title', studyVal);
    setText('mbp-table-unit-price', `$${amountVal.toFixed(2)}`);
    setText('mbp-table-total-usd', `$${amountVal.toFixed(2)}`);
    setText('mbp-subtotal-val', `$${amountVal.toFixed(2)}`);
    setText('mbp-bcv-slot-badge', bcvSlot);
    setText('mbp-bcv-rate-val', `${bcvRate.toFixed(2)} Bs./USD`);
    setText('mbp-final-usd', `$${amountVal.toFixed(2)} USD`);
    setText('mbp-final-ves', `Bs. ${formattedVes}`);

    const modal = document.getElementById('medical-budget-preview-modal');
    if (modal) {
      modal.classList.add('active');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('z-index', '9999999', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`👁️ Vista del Presupuesto generada para ${cleanPet} (${doctorVal})`, 'info');
    }
  }

  printBudget() {
    window.print();
  }

  sendBudgetByEmailManual() {
    const tutor = document.getElementById('mbp-tutor-name')?.innerText || 'Cliente VIP';
    const pet = document.getElementById('mbp-patient-name')?.innerText || 'Mascota VIP';
    const email = document.getElementById('mbp-tutor-email')?.innerText || 'cliente@mrspets.com';
    const doctor = document.getElementById('mbp-doctor-name')?.innerText || 'Dr. Carlos Mendoza';
    const study = document.getElementById('mbp-study-name')?.innerText || 'Rayos X';
    const amount = document.getElementById('mbp-final-usd')?.innerText || '$45.00 USD';
    const amountVes = document.getElementById('mbp-final-ves')?.innerText || 'Bs. 2,182.50';

    try {
      fetch('/api/reservations/dispatch-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'email',
          email,
          tutor,
          pet,
          doctor,
          study,
          amount,
          amountVes
        })
      }).catch(() => {});
    } catch(e) {}

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✉️ Ficha del paciente y presupuesto oficial despachados con éxito a: ${email}`, 'success');
    }
  }

  sendBudgetByWhatsAppManual() {
    const tutor = document.getElementById('mbp-tutor-name')?.innerText || 'Cliente VIP';
    const pet = document.getElementById('mbp-patient-name')?.innerText || 'Mascota VIP';
    const phone = document.getElementById('mbp-tutor-phone')?.innerText || '+58 414-6799510';
    const doctor = document.getElementById('mbp-doctor-name')?.innerText || 'Dr. Carlos Mendoza';
    const study = document.getElementById('mbp-study-name')?.innerText || 'Rayos X Digital';
    const datetime = document.getElementById('mbp-scheduled-datetime')?.innerText || '09:00 AM';
    const amount = document.getElementById('mbp-final-usd')?.innerText || '$45.00 USD';
    const amountVes = document.getElementById('mbp-final-ves')?.innerText || 'Bs. 2,182.50';

    const msg = `🏥 *PRESUPUESTO MÉDICO & FICHA DEL PACIENTE - MRS. PETS MARACAIBO*\\n\\n` +
      `Estimado(a) *${tutor}*, adjuntamos la ficha médica y presupuesto para su consentido(a) *${pet}*:\\n\\n` +
      `• *Doctor / Especialista*: ${doctor}\\n` +
      `• *Estudio Pautado*: *${study}*\\n` +
      `• *Fecha & Hora Pautada*: *${datetime}*\\n` +
      `• *Total Presupuesto USD*: *${amount}*\\n` +
      `• *Total en Bolívares (Tasa Oficial BCV)*: *${amountVes}*\\n` +
      `• *Sede*: Don Bosco / Av. 2 El Milagro, Maracaibo\\n` +
      `• *Condición*: Sin cobro adelantado (se cancela al momento de admisión).\\n\\n` +
      `¡Esperamos a ${pet} con todo el amor y estándar de lujo de Mrs. Pets! 🐾✨`;

    if (window.whatsappSim && typeof window.whatsappSim.sendMessage === 'function') {
      window.whatsappSim.sendMessage(msg);
    }
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`💬 Presupuesto oficial enviado por WhatsApp al número ${phone}`, 'success');
    }
  }

  confirmClinicaBooking(event) {
    if (event) event.preventDefault();
    if (this._isConfirmingClinica) return;
    this._isConfirmingClinica = true;

    const submitBtn = document.getElementById('btn-confirm-booking-clinica') || document.querySelector('#booking-modal-clinica button[type="submit"]') || document.querySelector('#booking-modal-clinica .btn-primary');
    if (submitBtn && ((submitBtn.dataset && submitBtn.dataset.busy === 'true') || submitBtn.disabled)) {
      this._isConfirmingClinica = false;
      return;
    }
    if (window.app && typeof window.app.setButtonBusy === 'function') {
      window.app.setButtonBusy(submitBtn, '⏳ Guardando reservación en base de datos...');
    }

    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const name = document.getElementById('booking-clinica-name')?.value?.trim() || '';
      const pet = document.getElementById('booking-clinica-pet')?.value?.trim() || '';
      const date = document.getElementById('booking-clinica-date')?.value || todayStr;
      const time = document.getElementById('booking-clinica-time')?.value || '09:00';
      const reason = document.getElementById('booking-clinica-reason')?.value || '';
      const pinInput = document.getElementById('booking-clinica-pin');
      const enteredPin = pinInput ? pinInput.value.trim() : '';

      const doctorSelect = document.getElementById('booking-clinica-doctor');
      const doctorVal = doctorSelect ? doctorSelect.value : 'Dr. Carlos Mendoza (Especialista en Imagenología & Rayos X)';

      const studySelect = document.getElementById('booking-clinica-study');
      const studyVal = studySelect ? studySelect.value : 'Radiología digital de alta resolución (Rayos X)';

      const amountInput = document.getElementById('booking-clinica-amount');
      const amountVal = (amountInput && parseFloat(amountInput.value)) ? parseFloat(amountInput.value) : 45.00;

      const emailInput = document.getElementById('booking-clinica-email');
      const emailVal = (emailInput && emailInput.value.trim()) ? emailInput.value.trim() : 'cliente@mrspets.com';

      const phoneInput = document.getElementById('booking-clinica-phone');
      const phoneVal = (phoneInput && phoneInput.value.trim()) ? phoneInput.value.trim() : '+58 414-6799510';

      // 0. VERIFICACIÓN ESTRICTA DE HORARIO Y DISPONIBILIDAD EN AGENDA LIVE
      const slotCheck = this.checkSlotAvailability('clinica', date, time);
      if (!slotCheck.available) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`⛔ No es posible realizar la reserva: ${slotCheck.reason}`, 'error');
        }
        this.displayBlockedSlotAlert('clinica', date, time, slotCheck.reason);
        if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
        this._isConfirmingClinica = false;
        return;
      }

      if (!name || !pet) {
        if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('⚠️ Complete el Nombre del Tutor y Mascota para agendar.', 'error');
        }
        return;
      }

      if (!this.ensureVipRegistration(name, pet, 'booking-modal-clinica')) {
        if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
        return;
      }

      const cleanTutor = name.trim();
      const cleanPet = pet.split('(')[0].trim();
      const existing = this.findExistingPatient(cleanPet, cleanTutor);

      if (existing) {
        if (!enteredPin) {
          if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
          if (pinInput) {
            pinInput.style.borderColor = '#EF4444';
            pinInput.classList.add('shake-anim');
            setTimeout(() => pinInput.classList.remove('shake-anim'), 400);
            pinInput.focus();
          }
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(`🔒 Ingrese la clave personal de ${existing.owner || cleanTutor} para confirmar la reservación.`, 'error');
          }
          this._isConfirmingClinica = false;
          return;
        }

        if (!this.ensureProfileSecurityUnlocked(existing, () => this.confirmClinicaBooking(null), enteredPin, 'clinica', cleanTutor)) {
          if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
          this._isConfirmingClinica = false;
          return;
        }
      }

      const bookingId = (window.antiDosBookingEngine && typeof window.antiDosBookingEngine.getNextCorrelativeId === 'function')
        ? window.antiDosBookingEngine.getNextCorrelativeId()
        : `#APT-${Math.floor(1000 + Math.random() * 9000)}`;

      const isExistingInActiveServiceToday = existing &&
        typeof existing.stepIndex === 'number' &&
        existing.stepIndex >= 1 &&
        (!existing.reservationDate || existing.reservationDate === todayStr);

      const targetPetId = (existing && isExistingInActiveServiceToday && date > todayStr)
        ? `${existing.id}-RES-${Date.now()}`
        : (existing?.id || `PET-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`);
    const petPhoto = existing?.photo || existing?.image || 'assets/media__1787695254613.jpg';
    const ownerPhoto = existing?.ownerPhoto || 'assets/leia_avatar.jpg';

    // Resolver RIF real canónico del cliente para evitar colisiones con V-Registrado
    let targetRif = existing?.rif || '';
    if (!targetRif || targetRif.toLowerCase().includes('registrado')) {
      if (window.authEngine && typeof window.authEngine.getCurrentUser === 'function') {
        try {
          const u = window.authEngine.getCurrentUser();
          if (u && u.rif && !u.rif.toLowerCase().includes('registrado')) {
            targetRif = u.rif;
          }
        } catch(e) {}
      }
    }
    if (!targetRif || targetRif.toLowerCase().includes('registrado')) {
      const allPets = (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);
      const tutorMatch = allPets.find(p => {
        const oName = (p.owner || p.ownerName || '').toLowerCase().trim();
        return oName === cleanTutor.toLowerCase() && p.rif && !p.rif.toLowerCase().includes('registrado');
      });
      if (tutorMatch) {
        targetRif = tutorMatch.rif;
      }
    }

    const clinicaTurn = existing?.turnNumber || (window.adminEngine && window.adminEngine.getNextTurnNumber ? window.adminEngine.getNextTurnNumber('clinica', date) : (window.petStatusEngine && window.petStatusEngine.getNextTurnNumber ? window.petStatusEngine.getNextTurnNumber('clinica', date) : 1));
    const clinicaTicket = (window.adminEngine?.formatTurnTicket ? window.adminEngine.formatTurnTicket('clinica', clinicaTurn) : (window.petStatusEngine?.formatTurnTicket ? window.petStatusEngine.formatTurnTicket('clinica', clinicaTurn) : `C-${String(clinicaTurn).padStart(3, '0')}`));

    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) ? window.FinancialEngine.bcvRate : 48.50;
    const bcvSlot = (window.FinancialEngine && window.FinancialEngine.bcvSlot) ? window.FinancialEngine.bcvSlot : '11:00 AM';
    const bcvBlock = (window.FinancialEngine && window.FinancialEngine.bcvBlock) ? window.FinancialEngine.bcvBlock : 'BLOQUE_11_00_AM';
    const priceVes = parseFloat((amountVal * bcvRate).toFixed(2));

    // Persistencia asíncrona en Backend API Database
    try {
      fetch('/api/reservations/clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bookingId,
          petId: targetPetId,
          pet: cleanPet,
          tutor: cleanTutor,
          rif: targetRif,
          email: emailVal,
          phone: phoneVal,
          doctor: doctorVal,
          study: studyVal,
          service: studyVal,
          date,
          time,
          amount: amountVal,
          price: amountVal,
          priceVes: priceVes,
          bcvRate: bcvRate,
          notes: reason || `Estudio: ${studyVal} con ${doctorVal}`
        })
      }).catch(err => console.warn('[Backend Reservation Sync Warning]', err));
    } catch(e) {}

    if (window.adminEngine) {
      window.adminEngine.addPendingAppointment({
        id: bookingId,
        petId: targetPetId,
        area: 'clinica',
        date,
        time,
        pet: cleanPet,
        tutor: cleanTutor,
        service: studyVal,
        study: studyVal,
        doctor: doctorVal,
        doctorName: doctorVal,
        price: amountVal,
        amount: amountVal,
        priceVes: priceVes,
        bcvRateApplied: bcvRate,
        bcvRateSlot: bcvSlot,
        bcvBlock: bcvBlock,
        email: emailVal,
        phone: phoneVal,
        notes: reason || `Estudio: ${studyVal} (${doctorVal})`
      });

      if (typeof window.adminEngine.registerNewPatient === 'function') {
        window.adminEngine.registerNewPatient({
          id: targetPetId,
          name: cleanPet,
          petName: cleanPet,
          species: existing?.species || 'Canino/Felino VIP',
          owner: cleanTutor,
          ownerName: cleanTutor,
          ownerPhone: phoneVal || existing?.ownerPhone || '+58 412-5551234',
          email: emailVal || existing?.email || 'cliente@mrspets.com',
          phone: phoneVal,
          rif: targetRif || existing?.rif || '',
          area: 'clinica',
          service: studyVal,
          study: studyVal,
          doctor: doctorVal,
          doctorName: doctorVal,
          price: amountVal,
          priceVes: priceVes,
          bcvRateApplied: bcvRate,
          bcvRateSlot: bcvSlot,
          bcvBlock: bcvBlock,
          hasReservation: true,
          reservationDate: date,
          reservationTime: time,
          date,
          time,
          stepIndex: 0,
          reservationStatus: 'pending_approval',
          turnNumber: clinicaTurn,
          turno: clinicaTurn,
          turnTicket: clinicaTicket,
          notes: reason ? `${studyVal} (${doctorVal}) - ${reason}` : `Cita para ${studyVal} con ${doctorVal} pautada para ${date} a las ${time}.`,
          photo: petPhoto,
          image: petPhoto,
          ownerPhoto: ownerPhoto,
          termsAccepted: true,
          isVipRegistered: true
        });
      }
    }

    if (window.petStatusEngine && typeof window.petStatusEngine.registerNewPet === 'function') {
      window.petStatusEngine.registerNewPet({
        id: targetPetId,
        name: cleanPet,
        petName: cleanPet,
        species: existing?.species || 'Canino/Felino VIP',
        owner: cleanTutor,
        ownerName: cleanTutor,
        ownerPhone: phoneVal || existing?.ownerPhone || '+58 412-5551234',
        email: emailVal || existing?.email || 'cliente@mrspets.com',
        phone: phoneVal,
        rif: targetRif || existing?.rif || '',
        area: 'clinica',
        service: studyVal,
        study: studyVal,
        doctor: doctorVal,
        doctorName: doctorVal,
        price: amountVal,
        priceVes: priceVes,
        bcvRateApplied: bcvRate,
        bcvRateSlot: bcvSlot,
        bcvBlock: bcvBlock,
        hasReservation: true,
        reservationDate: date,
        reservationTime: time,
        date,
        time,
        stepIndex: 0,
        reservationStatus: 'pending_approval',
        turnNumber: clinicaTurn,
        turno: clinicaTurn,
        turnTicket: clinicaTicket,
        notes: `Cita Clínica: ${studyVal} - Especialista: ${doctorVal} - Fecha: ${date} ${time}`,
        image: petPhoto,
        photo: petPhoto,
        ownerPhoto: ownerPhoto,
        isVipRegistered: true
      });
    }

    // 🛡️ REGLA OPERATIVA: En Paso 0 (Reserva creada), el carrito permanece estrictamente en $0.00.
    // El cobro del servicio se ejecuta únicamente cuando el paciente llega y se marca como «Recibido / Admisión» (Paso 1).

    if (window.adminEngine && typeof window.adminEngine.refreshAllOperationalViews === 'function') {
      window.adminEngine.refreshAllOperationalViews();
    } else {
      if (window.adminEngine && typeof window.adminEngine.renderStatusManager === 'function') {
        window.adminEngine.renderStatusManager();
      }
    }
    if (window.petStatusEngine && typeof window.petStatusEngine.render === 'function') {
      window.petStatusEngine.render();
    }

    if (window.authEngine) {
      window.authEngine.isAuthenticated = true;
      if (!window.adminEngine || !window.adminEngine.isEnterpriseAuthenticated) {
        window.authEngine.userRole = 'client';
      }
      window.authEngine.userName = cleanTutor;
      window.authEngine.currentVipPetId = targetPetId;
      localStorage.setItem('mrs_pets_skip_splash', 'true');
    }

    try {
      localStorage.setItem('mrs_pets_active_customer_name', cleanTutor);
      localStorage.setItem('mrs_pets_active_vip_patient_id', targetPetId);
    } catch(e) {}

    if (window.storeEngine && typeof window.storeEngine.switchCustomer === 'function') {
      window.storeEngine.switchCustomer({ name: cleanTutor, rif: targetRif, petId: targetPetId });
    } else if (window.storeEngine && typeof window.storeEngine.loadCart === 'function') {
      window.storeEngine.loadCart();
    }

    if (window.adminEngine && typeof window.adminEngine.updateHeaderAccountDisplay === 'function') {
      window.adminEngine.updateHeaderAccountDisplay();
    }

    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('booking-modal-clinica');
    } else {
      const modal = document.getElementById('booking-modal-clinica');
      if (modal) modal.classList.remove('active');
    }

    if (window.app && typeof window.app.resetButton === 'function') {
      window.app.resetButton(submitBtn);
    }

    this.showBookingScreenPopConfirmation({
      id: bookingId,
      tutorName: cleanTutor,
      petName: cleanPet,
      service: `${studyVal} (${doctorVal}) - Presupuesto: $${amountVal.toFixed(2)} USD (~Bs. ${priceVes.toFixed(2)})`,
      date,
      time,
      location: 'Sede Principal Don Bosco - Módulo de Imagenología & Radiología'
    });
    } catch (err) {
      console.error('[Clinica Booking Error]', err);
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Error al procesar reserva: ' + (err.message || err), 'error');
      }
    } finally {
      this._isConfirmingClinica = false;
      if (submitBtn && window.app && typeof window.app.resetButton === 'function') {
        window.app.resetButton(submitBtn);
      }
    }
  }

  populateBookingDatalists(modalType = 'grooming') {
    const tutorList = document.getElementById(`${modalType}-tutor-list`);
    const petList = document.getElementById(`${modalType}-pet-list`);
    const patients = this.getAllPatients();

    if (tutorList) {
      const tutors = Array.from(new Set(patients.map(p => p.owner || p.ownerName).filter(Boolean)));
      tutorList.innerHTML = tutors.map(t => `<option value="${t}"></option>`).join('');
    }

    const currentTutor = document.getElementById(`booking-${modalType}-name`)?.value.trim() || '';
    if (petList) {
      let filtered = patients;
      if (currentTutor) {
        filtered = patients.filter(p => {
          const owner = p.owner || p.ownerName || '';
          return this.isFullTutorMatch(owner, currentTutor) || this.isNameMatch(owner, currentTutor);
        });
      }
      const pets = filtered.map(p => {
        const name = p.name || p.petName;
        const species = p.species ? ` (${p.species})` : '';
        return name ? `${name}${species}` : null;
      }).filter(Boolean);
      petList.innerHTML = Array.from(new Set(pets)).map(p => `<option value="${p}"></option>`).join('');
    }
  }

  populateGroomingDatalists() {
    this.populateBookingDatalists('grooming');
  }

  lookupClient(modalType = 'grooming', sourceField = null) {
    const tutorInput = document.getElementById(`booking-${modalType}-name`);
    const petInput = document.getElementById(`booking-${modalType}-pet`);
    const statusEl = document.getElementById(`booking-${modalType}-client-status`);

    if (!tutorInput || !petInput) return;

    let tutorVal = tutorInput.value.trim();
    let petVal = petInput.value.trim();

    // 1. Refresh datalists with current filtering
    this.populateBookingDatalists(modalType);

    // 2. Both empty => Render prompt with active Crear Ficha VIP button
    if (!tutorVal && !petVal) {
      if (statusEl) {
        statusEl.innerHTML = `
          <div style="background:#FEF3C7; border:1.5px solid #F59E0B; border-radius:12px; padding:10px 14px; color:#000000 !important; font-size:0.8rem; font-weight:700; display:flex; align-items:center; justify-content:space-between; box-shadow:0 4px 12px rgba(245, 158, 11, 0.15);">
            <div>
              <span style="color:#92400E; font-weight:900;">ℹ️ ¿NUEVO CLIENTE O TUTOR NO REGISTRADO?</span>
              <div style="font-size:0.78rem; color:#000000 !important; font-weight:700; margin-top:2px;">
                Cree su Ficha VIP (con foto) o ingrese sus datos para verificar su expediente.
              </div>
            </div>
            <button type="button" onclick="clinicaEngine.redirectToVipRegistration('${modalType}')" class="btn-pulse-amber" style="background:linear-gradient(135deg, #d97706, #b45309); color:#ffffff; font-size:0.78rem; padding:8px 14px; border-radius:10px; font-weight:900; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(217,119,6,0.35);">
              ✨ Crear Ficha VIP ➔
            </button>
          </div>
        `;
      }
      return;
    }

    // 3. Handle Tutor input edits
    if (sourceField === 'tutor' || (!sourceField && tutorVal)) {
      if (!tutorVal) {
        petInput.value = '';
        petVal = '';
        if (statusEl) {
          statusEl.innerHTML = `
            <div style="background:#FEF3C7; border:1.5px solid #F59E0B; border-radius:12px; padding:10px 14px; color:#000000 !important; font-size:0.8rem; font-weight:700; display:flex; align-items:center; justify-content:space-between;">
              <div>
                <span style="color:#92400E; font-weight:900;">ℹ️ ¿NUEVO CLIENTE O TUTOR NO REGISTRADO?</span>
                <div style="font-size:0.78rem; color:#000000 !important; font-weight:700; margin-top:2px;">
                  Cree su Ficha VIP (con foto) o ingrese sus datos para verificar su expediente.
                </div>
              </div>
              <button type="button" onclick="clinicaEngine.redirectToVipRegistration('${modalType}')" class="btn-pulse-amber" style="background:linear-gradient(135deg, #d97706, #b45309); color:#ffffff; font-size:0.78rem; padding:8px 14px; border-radius:10px; font-weight:900; border:none; cursor:pointer;">
                ✨ Crear Ficha VIP ➔
              </button>
            </div>
          `;
        }
        return;
      }

      const allTutors = this.getAllTutors();
      const matchedTutor = allTutors.find(t => this.isFullTutorMatch(t, tutorVal) || this.isNameMatch(t, tutorVal));

      if (matchedTutor) {
        const tutorPets = this.getPetsForTutor(matchedTutor);
        if (tutorPets.length > 0) {
          if (!petVal || sourceField === 'tutor' || sourceField === 'pet_click') {
            const primaryPet = tutorPets.find(p => {
              const pName = (p.name || p.petName || '').toLowerCase();
              return pName.includes('buddy') || p.area === modalType || p.isVipRegistered;
            }) || tutorPets[0];

            if (primaryPet) {
              const pName = primaryPet.name || primaryPet.petName;
              const pSpecies = primaryPet.species ? ` (${primaryPet.species})` : '';
              petInput.value = `${pName}${pSpecies}`;
              petVal = petInput.value.trim();
            }
          }
        }

        // Correlacionar datos de contacto de la base de datos (sin tocar la clave de seguridad)
        const cleanPetSearch = (petVal || '').split('(')[0].trim();
        const matchedPatient = this.findExistingPatient(cleanPetSearch, matchedTutor);
        if (matchedPatient) {
          const emailInput = document.getElementById(`booking-${modalType}-email`);
          const phoneInput = document.getElementById(`booking-${modalType}-phone`);
          if (emailInput && (!emailInput.value || sourceField === 'tutor')) {
            emailInput.value = matchedPatient.email || '';
          }
          if (phoneInput && (!phoneInput.value || sourceField === 'tutor')) {
            phoneInput.value = matchedPatient.ownerPhone || matchedPatient.phone || '';
          }
        }
      } else {
        // Partial or unregistered tutor name. Clear pet input if it holds an old registered pet from a different tutor.
        if (sourceField === 'tutor' && petVal) {
          const matchedPetForValue = this.findExistingPatient(petVal, '');
          if (matchedPetForValue) {
            const pOwner = matchedPetForValue.owner || matchedPetForValue.ownerName || '';
            if (!this.isFullTutorMatch(pOwner, tutorVal) && !this.isNameMatch(pOwner, tutorVal)) {
              petInput.value = '';
              petVal = '';
            }
          }
        }
      }
    }

    // 4. Handle Pet input edits
    if (sourceField === 'pet' && petVal && !tutorVal) {
      const matchedPet = this.findExistingPatient(petVal, '');
      if (matchedPet) {
        const owner = matchedPet.owner || matchedPet.ownerName;
        if (owner) {
          tutorInput.value = owner;
          tutorVal = owner;
        }
      }
    }

    // 5. Update Status Badge based on matched patient
    const matched = this.findExistingPatient(petInput.value.trim(), tutorVal);

    if (matched) {
      const petName = matched.name || matched.petName;
      const ownerName = matched.owner || matched.ownerName;
      const species = matched.species || 'Canino/Felino VIP';

      const isComplete = Boolean(
        matched.isVipRegistered !== false && (
          matched.isVipRegistered || matched.termsAccepted || matched.parasites !== undefined || matched.bathType || (matched.stepIndex !== undefined && matched.stepIndex >= 0) || matched.id
        )
      );

      if (statusEl) {
        if (isComplete) {
          statusEl.innerHTML = `
            <div style="background:#f0fdf4; border:1.5px solid #16a34a; border-radius:12px; padding:12px 14px; color:#15803d; font-size:0.84rem; font-weight:700; display:flex; align-items:center; justify-content:space-between; box-shadow:0 4px 12px rgba(22,163,74,0.15);">
              <div>
                <span style="font-weight:900; font-size:0.88rem;">🟢 CLIENTE REGISTRADO EN BASE DE DATOS</span>
                <div style="font-weight:700; font-size:0.78rem; color:#166534; margin-top:3px;">
                  👤 Tutor: <strong>${ownerName}</strong> | 🐾 Mascota Jalada BD: <strong>${petName}</strong> (${species})
                </div>
              </div>
              <span style="background:#16a34a; color:#fff; font-size:0.70rem; padding:4px 10px; border-radius:8px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">VIP VERIFICADO</span>
            </div>
          `;
        } else {
          statusEl.innerHTML = `
            <div style="background:#FEF3C7; border:1.5px solid #F59E0B; border-radius:12px; padding:12px 14px; color:#000000 !important; font-size:0.82rem; font-weight:700; display:flex; align-items:center; justify-content:space-between; box-shadow:0 4px 12px rgba(245, 158, 11, 0.15);">
              <div>
                <span style="color:#92400E; font-weight:900;">🟡 CLIENTE ENCONTRADO (REGISTRO EN PROCESO)</span>
                <div style="font-weight:700; font-size:0.78rem; color:#000000 !important; margin-top:2px;">
                  Falta completar la Declaración de Salud para activar cita directa.
                </div>
              </div>
            </div>
          `;
        }
      }
    } else {
      if (statusEl) {
        statusEl.innerHTML = `
          <div style="background:#FEF3C7; border:1.5px solid #F59E0B; border-radius:12px; padding:12px 14px; color:#000000 !important; font-size:0.84rem; font-weight:700; display:flex; align-items:center; justify-content:space-between; box-shadow:0 4px 12px rgba(245, 158, 11, 0.2);">
            <div>
              <span style="color:#92400E; font-weight:900;">⚠️ CLIENTE NO REGISTRADO EN BASE DE DATOS</span>
              <div style="font-weight:700; font-size:0.82rem; color:#000000 !important; margin-top:3px;">
                🐾 <span style="color:#000000 !important; font-weight:900;">Se requiere crear la Ficha VIP (con foto) antes de agendar.</span>
              </div>
            </div>
            <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.clinicaEngine.redirectToVipRegistration(event, '${modalType}')" class="btn-pulse-amber" style="background:linear-gradient(135deg, #d97706, #b45309); color:#ffffff; font-size:0.78rem; padding:8px 14px; border-radius:10px; font-weight:900; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(217,119,6,0.4);">
              ✨ Crear Ficha VIP ➔
            </button>
          </div>
        `;
      }
    }
  }

  handleTutorBlur(modalType = 'grooming') {
    const tutorInput = document.getElementById(`booking-${modalType}-name`);
    if (!tutorInput) return;
    const rawVal = tutorInput.value.trim();
    if (!rawVal || rawVal.length < 3) return;

    // Verificar si el tutor existe en la base de datos
    const allTutors = this.getAllTutors();
    const matched = allTutors.find(t => this.isFullTutorMatch(t, rawVal) || this.isNameMatch(t, rawVal));
    if (matched) {
      if (window.storeEngine && typeof window.storeEngine.switchCustomer === 'function') {
        const pets = this.getPetsForTutor(matched);
        const pRif = (pets && pets[0] && pets[0].rif) ? pets[0].rif : '';
        const pId = (pets && pets[0] && pets[0].id) ? pets[0].id : '';
        window.storeEngine.switchCustomer({ name: matched, rif: pRif, petId: pId });
      }
    } else {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('ℹ️ Cliente no registrado en la base de datos VIP. Abriendo Formulario de Registro...', 'info');
      }
      this.redirectToVipRegistration(null, modalType);
    }
  }

  redirectToVipRegistration(arg1, arg2) {
    let event = null;
    let modalType = 'grooming';

    if (arg1 && typeof arg1 === 'object' && typeof arg1.preventDefault === 'function') {
      event = arg1;
      if (typeof arg2 === 'string') modalType = arg2;
    } else if (typeof arg1 === 'string') {
      modalType = arg1;
      if (arg2 && typeof arg2 === 'object' && typeof arg2.preventDefault === 'function') {
        event = arg2;
      }
    } else if (typeof arg2 === 'string') {
      modalType = arg2;
    }

    if (event) {
      try { event.preventDefault(); if (typeof event.stopPropagation === 'function') event.stopPropagation(); } catch(e) {}
    }

    const tutorInput = document.getElementById(`booking-${modalType}-name`);
    const petInput = document.getElementById(`booking-${modalType}-pet`);
    const dateInput = document.getElementById(`booking-${modalType}-date`) || document.getElementById(`booking-${modalType}-checkin`);
    const timeInput = document.getElementById(`booking-${modalType}-time`);
    const shampooInput = document.getElementById('booking-grooming-shampoo');

    const rawTutor = tutorInput ? tutorInput.value.trim() : '';
    const rawPet = petInput ? petInput.value.trim() : '';
    const date = dateInput ? dateInput.value : '';
    const time = timeInput ? timeInput.value : '';
    const shampoo = shampooInput ? shampooInput.value : '';

    let cleanTutor = rawTutor;
    let extractedPhone = '';
    let extractedRif = '';

    // If tutor input contains digits (phone or RIF), extract them intelligently
    if (/\d{6,}/.test(rawTutor)) {
      const numMatch = rawTutor.match(/(\+?\d[\d\s-]{6,})/);
      if (numMatch) {
        extractedPhone = numMatch[0];
        cleanTutor = rawTutor.replace(numMatch[0], '').trim();
      }
    }

    let cleanPet = rawPet;
    let extractedBreed = '';
    if (rawPet.includes('(')) {
      const parts = rawPet.split('(');
      cleanPet = parts[0].trim();
      extractedBreed = parts[1].replace(')', '').trim();
    }

    const cleanArea = modalType.includes('clini') ? 'clinica' : (modalType.includes('hotel') ? 'hotel' : 'grooming');
    this.pendingBookingDraft = {
      area: cleanArea,
      tutor: cleanTutor || rawTutor,
      pet: cleanPet || rawPet,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '10:00',
      shampoo: shampoo || 'Champú pH neutro',
      service: cleanArea === 'clinica' ? 'Consulta Médica Veterinaria' : (cleanArea === 'hotel' ? 'Hospedaje Suite Canina VIP' : 'Circuito Grooming Spa 7 Estaciones'),
      price: cleanArea === 'clinica' ? 30.00 : (cleanArea === 'hotel' ? 45.00 : 25.00)
    };

    // 1. Close current booking modals in DOM (toggle active class off)
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('booking-modal-grooming');
      window.app.closeModal('booking-modal-clinica');
      window.app.closeModal('booking-modal-hotel');
    }

    // 2. Open VIP Registration 6-Section modal in DOM (toggle active class on) prefilled with captured data
    if (window.registrationEngine && typeof window.registrationEngine.openRegistrationModal === 'function') {
      window.registrationEngine.openRegistrationModal({
        name: cleanTutor || rawTutor,
        pet: cleanPet || rawPet,
        phone: extractedPhone,
        rif: extractedRif,
        breed: extractedBreed,
        returnBookingArea: modalType,
        modalType: modalType,
        requiredNotice: `✨ FORMULARIO DE REGISTRO VIP (6 SECCIONES): Registrando expediente para "<strong>${cleanTutor || rawTutor || 'Nuevo Tutor'}</strong>" y a su mascota "<strong>${cleanPet || rawPet || 'Mascota'}</strong>". Complete esta ficha para confirmar su cita automáticamente.`
      });
    }
  }

  onPetInputClick(modalType = 'grooming') {
    const tutorInput = document.getElementById(`booking-${modalType}-name`);
    const petInput = document.getElementById(`booking-${modalType}-pet`);
    if (!petInput) return;

    let tutorVal = tutorInput ? tutorInput.value.trim() : '';

    if (!tutorVal) {
      if (window.authEngine && window.authEngine.userName && !window.authEngine.userName.toLowerCase().includes('staff')) {
        tutorVal = window.authEngine.userName;
        if (tutorInput) tutorInput.value = tutorVal;
      } else if (window.adminEngine && typeof window.adminEngine.getCurrentCustomerName === 'function') {
        tutorVal = window.adminEngine.getCurrentCustomerName();
        if (tutorInput) tutorInput.value = tutorVal;
      } else {
        tutorVal = 'Dalybell Ramírez Montilla';
        if (tutorInput) tutorInput.value = tutorVal;
      }
    }

    const matchedTutor = this.getAllTutors().find(t => this.isFullTutorMatch(t, tutorVal) || this.isNameMatch(t, tutorVal));
    if (matchedTutor) {
      const tutorPets = this.getPetsForTutor(matchedTutor);
      if (tutorPets.length > 0) {
        const currentPet = petInput.value.trim();
        const petBelongs = tutorPets.some(p => {
          const pName = p.name || p.petName || '';
          return currentPet.toLowerCase().includes(pName.toLowerCase());
        });

        if (!currentPet || !petBelongs) {
          const selectedPet = tutorPets[0];
          const pName = selectedPet.name || selectedPet.petName;
          const pSpecies = selectedPet.species ? ` (${selectedPet.species})` : '';
          petInput.value = `${pName}${pSpecies}`;
        }
      }
    }

    this.lookupClient(modalType, 'pet_click');
  }

  lookupGroomingClient() {
    this.lookupClient('grooming');
    setTimeout(() => this.validateSlotAvailability('grooming'), 50);
  }

  // ===================================================
  // SELECTOR INTEGRADO DE RESERVACIONES (CLÍNICA, GROOMING, HOTEL, TIENDA)
  // ===================================================
  switchBookingArea(targetArea) {
    let currentTutor = '';
    let currentPet = '';
    let currentPin = '';

    // Extraer datos ingresados en el modal actualmente visible para preservarlos
    const gTutor = document.getElementById('booking-grooming-name')?.value;
    const gPet = document.getElementById('booking-grooming-pet')?.value;
    const gPin = document.getElementById('booking-grooming-pin')?.value;

    const cTutor = document.getElementById('booking-clinica-name')?.value;
    const cPet = document.getElementById('booking-clinica-pet')?.value;
    const cPin = document.getElementById('booking-clinica-pin')?.value;

    const hTutor = document.getElementById('booking-hotel-name')?.value;
    const hPet = document.getElementById('booking-hotel-pet')?.value;
    const hPin = document.getElementById('booking-hotel-pin')?.value;

    currentTutor = (gTutor || cTutor || hTutor || '').trim();
    currentPet = (gPet || cPet || hPet || '').trim();
    currentPin = (gPin || cPin || hPin || '').trim();

    window._isSwitchingBookingArea = true;
    // Cerrar los modales de reservación de forma segura
    ['booking-modal-grooming', 'booking-modal-clinica', 'booking-modal-hotel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('opacity', '0', 'important');
      }
    });
    setTimeout(() => { window._isSwitchingBookingArea = false; }, 350);

    if (targetArea === 'tienda') {
      if (window.authEngine && typeof window.authEngine.hidePortalAndShowApp === 'function') {
        window.authEngine.hidePortalAndShowApp();
      }
      if (window.app && typeof window.app.switchTab === 'function') {
        window.app.switchTab('store');
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🛍️ Redirigiendo a Tienda Online VIP & Boutique...', 'info');
      }
      return;
    }

    if (targetArea === 'grooming') {
      this.openGroomingBookingModal('Circuito Grooming Spa 7 Estaciones', currentPet, currentTutor);
      if (currentPin) {
        const pinEl = document.getElementById('booking-grooming-pin');
        if (pinEl) pinEl.value = currentPin;
      }
    } else if (targetArea === 'clinica') {
      this.openClinicaBookingModal('Consulta Médica General', currentPet, currentTutor);
      if (currentPin) {
        const pinEl = document.getElementById('booking-clinica-pin');
        if (pinEl) pinEl.value = currentPin;
      }
    } else if (targetArea === 'hotel') {
      this.openHotelBookingModal('Suite Royal Bioclimática #4', currentPet, currentTutor);
      if (currentPin) {
        const pinEl = document.getElementById('booking-hotel-pin');
        if (pinEl) pinEl.value = currentPin;
      }
    }
  }

  // ===================================================
  // 2. GROOMING SPA BOOKING
  // ===================================================

  openGroomingBookingModal(packageTitle = 'Circuito Grooming Spa 7 Estaciones', prefillPetName = '', prefillTutorName = '', options = {}) {
    const modal = document.getElementById('booking-modal-grooming');
    if (modal) {
      modal.style.removeProperty('display');
      modal.style.display = '';
    }

    const titleEl = document.getElementById('booking-grooming-package');
    if (titleEl) titleEl.innerText = packageTitle;

    const isClientAuth = Boolean(window.authEngine && window.authEngine.isAuthenticated && window.authEngine.userRole === 'client');
    const activeUser = (isClientAuth && typeof window.authEngine.getCurrentUser === 'function')
      ? window.authEngine.getCurrentUser()
      : null;

    const isReset = Boolean(options && options.resetBlank);
    const finalTutor = (isReset || !isClientAuth) ? (prefillTutorName || '') : (prefillTutorName || (activeUser && activeUser.tutorName ? activeUser.tutorName : ''));
    let finalPet = (isReset || !isClientAuth) ? (prefillPetName || '') : (prefillPetName || (activeUser && activeUser.petName ? activeUser.petName : ''));
    if (!finalPet && finalTutor && isClientAuth) {
      const tutorPets = this.getPetsForTutor(finalTutor);
      if (tutorPets && tutorPets.length > 0) {
        const p = tutorPets[0];
        finalPet = `${p.name || p.petName}${p.species ? ` (${p.species})` : ''}`;
      }
    }

    const tutorInput = document.getElementById('booking-grooming-name');
    if (tutorInput) tutorInput.value = finalTutor;

    const petInput = document.getElementById('booking-grooming-pet');
    if (petInput) petInput.value = finalPet;

    this.setupBookingPinField('grooming', activeUser, finalPet, finalTutor);

    const dateInput = document.getElementById('booking-grooming-date');
    if (dateInput && !dateInput.value) {
      const today = new Date();
      dateInput.value = today.toISOString().split('T')[0];
    }

    const timeInput = document.getElementById('booking-grooming-time');
    if (timeInput) {
      timeInput.value = this.getSmartBookingTime(dateInput ? dateInput.value : null);
    }
    this.updateTimeAmPmBadge('grooming');

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('booking-modal-grooming');
    } else {
      if (modal) modal.classList.add('active');
    }
    this.lookupClient('grooming');
    setTimeout(() => this.validateSlotAvailability('grooming'), 50);
  }

  confirmGroomingBooking(event) {
    if (event) {
      try { event.preventDefault(); event.stopPropagation(); } catch(e) {}
    }
    if (this._isConfirmingGrooming) return;
    this._isConfirmingGrooming = true;

    const submitBtn = document.getElementById('btn-confirm-booking-grooming') || document.querySelector('#booking-modal-grooming button[type="submit"]') || document.querySelector('#booking-modal-grooming .btn-primary');
    if (submitBtn && ((submitBtn.dataset && submitBtn.dataset.busy === 'true') || submitBtn.disabled)) {
      this._isConfirmingGrooming = false;
      return;
    }
    if (window.app && typeof window.app.setButtonBusy === 'function') {
      window.app.setButtonBusy(submitBtn, '⏳ Guardando reservación en base de datos...');
    }

    try {

    const nameInput = document.getElementById('booking-grooming-name');
    const petInput = document.getElementById('booking-grooming-pet');
    const dateInput = document.getElementById('booking-grooming-date');
    const timeInput = document.getElementById('booking-grooming-time');
    const shampooInput = document.getElementById('booking-grooming-shampoo');
    const pinInput = document.getElementById('booking-grooming-pin');
    const enteredPin = pinInput ? pinInput.value.trim() : '';

    let name = (nameInput && nameInput.value) ? nameInput.value.trim() : '';
    let pet = (petInput && petInput.value) ? petInput.value.trim() : '';

    if (!name || !pet) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('⚠️ Por favor ingrese el Nombre del Tutor y de la Mascota para agendar la cita.', 'warning');
      }
      if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
      return;
    }

    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const date = (dateInput && dateInput.value) ? dateInput.value : todayStr;
    const time24 = (timeInput && timeInput.value) ? timeInput.value : '08:00';
    const formattedTime = (typeof this.formatTimeWithAmPm === 'function') ? this.formatTimeWithAmPm(time24) : '08:00 AM';
    const shampoo = (shampooInput && shampooInput.value) ? shampooInput.value : 'Champú pH neutro';

    // 0. VERIFICACIÓN ESTRICTA DE HORARIO Y DISPONIBILIDAD EN AGENDA LIVE
    const slotCheck = this.checkSlotAvailability('grooming', date, time24);
    if (!slotCheck.available) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`⛔ No es posible realizar la reserva: ${slotCheck.reason}`, 'error');
      }
      this.displayBlockedSlotAlert('grooming', date, time24, slotCheck.reason);
      if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
      this._isConfirmingGrooming = false;
      return;
    }

    const cleanTutor = name.trim();
    const cleanPet = pet.split('(')[0].trim();

    // 1. Si el cliente no existe en base de datos, saltar automáticamente al Registro VIP arrastrando la cita
    if (!this.ensureVipRegistration(name, pet, 'booking-modal-grooming')) {
      if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
      return;
    }

    const existing = this.findExistingPatient(cleanPet, cleanTutor);
    if (existing) {
      if (!enteredPin) {
        if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
        if (pinInput) {
          pinInput.style.borderColor = '#EF4444';
          pinInput.classList.add('shake-anim');
          setTimeout(() => pinInput.classList.remove('shake-anim'), 400);
          pinInput.focus();
        }
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`🔒 Ingrese la clave personal de ${existing.owner || cleanTutor} para confirmar la reservación.`, 'error');
        }
        this._isConfirmingGrooming = false;
        return;
      }
      if (!this.ensureProfileSecurityUnlocked(existing, () => this.confirmGroomingBooking(null), enteredPin, 'grooming', cleanTutor)) {
        if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
        this._isConfirmingGrooming = false;
        return;
      }
    }

    const bookingId = (window.antiDosBookingEngine && typeof window.antiDosBookingEngine.getNextCorrelativeId === 'function')
      ? window.antiDosBookingEngine.getNextCorrelativeId()
      : `#APT-${Math.floor(1000 + Math.random() * 9000)}`;

    const isExistingInActiveServiceToday = existing &&
      typeof existing.stepIndex === 'number' &&
      existing.stepIndex >= 1 &&
      (!existing.reservationDate || existing.reservationDate === todayStr);

    const targetPetId = (existing && isExistingInActiveServiceToday && date > todayStr)
      ? `${existing.id}-RES-${Date.now()}`
      : (existing ? existing.id : `PET-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`);

    const bcvRate = (window.FinancialEngine && window.FinancialEngine.bcvRate) ? window.FinancialEngine.bcvRate : 48.50;
    const bcvSlot = (window.FinancialEngine && window.FinancialEngine.bcvSlot) ? window.FinancialEngine.bcvSlot : '11:00 AM';
    const bcvBlock = (window.FinancialEngine && window.FinancialEngine.bcvBlock) ? window.FinancialEngine.bcvBlock : 'BLOQUE_11_00_AM';
    const spaPrice = 45.00;
    const spaPriceVes = parseFloat((spaPrice * bcvRate).toFixed(2));

    // 1. REGISTRAR EN ADMIN ENGINE (PENDIENTES DE APROBACIÓN)
    if (window.adminEngine && typeof window.adminEngine.addPendingAppointment === 'function') {
      try {
        window.adminEngine.addPendingAppointment({
          id: bookingId,
          petId: targetPetId,
          area: 'grooming',
          date,
          time: formattedTime,
          pet: cleanPet,
          tutor: cleanTutor,
          service: `Circuito Grooming Spa 7 Estaciones (${shampoo})`,
          price: spaPrice,
          priceVes: spaPriceVes,
          bcvRateApplied: bcvRate,
          bcvRateSlot: bcvSlot,
          bcvBlock: bcvBlock
        });
      } catch(e) {}
    }

    // 2. ACTUALIZAR PACIENTE EXISTENTE O REGISTRAR NUEVO SI NO EXISTÍA
    if (existing && (!isExistingInActiveServiceToday || date === todayStr)) {
      existing.hasReservation = true;
      existing.reservationDate = date;
      existing.reservationTime = formattedTime;
      existing.date = date;
      existing.time = formattedTime;
      existing.stepIndex = 0; // '0. Reservación / Recibido' (Pendiente de confirmación)
      existing.reservationStatus = 'pending_approval';
      existing.area = 'grooming';
      existing.name = existing.name || existing.petName || cleanPet;
      existing.petName = existing.petName || existing.name || cleanPet;
      existing.owner = existing.owner || existing.ownerName || cleanTutor;
      existing.ownerName = existing.ownerName || existing.owner || cleanTutor;
      existing.species = existing.species || 'Canino VIP';
      existing.notes = `Reserva realizada para ${date} a las ${formattedTime}. Servicio: Grooming Spa (${shampoo}). Pendiente por aprobación de staff.`;
      existing.price = spaPrice;
      existing.priceVes = spaPriceVes;
      existing.bcvRateApplied = bcvRate;
      existing.bcvRateSlot = bcvSlot;
      existing.bcvBlock = bcvBlock;

      if (window.petStatusEngine && Array.isArray(window.petStatusEngine.pets)) {
        const pIdx = window.petStatusEngine.pets.findIndex(p => p.id === existing.id);
        if (pIdx !== -1) {
          window.petStatusEngine.pets[pIdx] = { ...window.petStatusEngine.pets[pIdx], ...existing };
        } else {
          window.petStatusEngine.pets.unshift(existing);
        }
        window.petStatusEngine.savePetsToStorage();
        window.petStatusEngine.render();
      }
      if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
        const aIdx = window.adminEngine.patientsStatus.findIndex(p => p.id === existing.id);
        if (aIdx !== -1) {
          window.adminEngine.patientsStatus[aIdx] = { ...window.adminEngine.patientsStatus[aIdx], ...existing };
        } else {
          window.adminEngine.patientsStatus.unshift(existing);
        }
        window.adminEngine.savePatientsToStorage();
      }
    } else {
      const newPatientPayload = {
        id: targetPetId,
        name: cleanPet,
        petName: cleanPet,
        species: cleanPet.toLowerCase().includes('buddy') ? 'Golden Retriever' : 'Príncipe / Princesa VIP',
        owner: cleanTutor,
        ownerName: cleanTutor,
        ownerPhone: '+58 412-5551234',
        area: 'grooming',
        hasReservation: true,
        reservationDate: date,
        reservationTime: formattedTime,
        date: date,
        time: formattedTime,
        stepIndex: 0,
        reservationStatus: 'pending_approval',
        notes: `Reserva realizada para ${date} a las ${formattedTime}. Servicio: Grooming Spa (${shampoo}).`,
        price: spaPrice,
        priceVes: spaPriceVes,
        bcvRateApplied: bcvRate,
        bcvRateSlot: bcvSlot,
        bcvBlock: bcvBlock,
        image: cleanPet.toLowerCase().includes('buddy') ? 'assets/mrs_pets_golden_welcome_1787694735845.jpg' : 'assets/media__1787694901704.jpg',
        photo: cleanPet.toLowerCase().includes('buddy') ? 'assets/mrs_pets_golden_welcome_1787694735845.jpg' : 'assets/media__1787694901704.jpg',
        ownerPhoto: 'assets/leia_avatar.jpg',
        termsAccepted: true,
        isVipRegistered: true
      };

      if (window.adminEngine && typeof window.adminEngine.registerNewPatient === 'function') {
        try {
          window.adminEngine.registerNewPatient(newPatientPayload);
        } catch(e) {}
      }
      if (window.petStatusEngine && typeof window.petStatusEngine.registerNewPet === 'function') {
        try {
          window.petStatusEngine.registerNewPet(newPatientPayload);
        } catch(e) {}
      }
    }

    if (window.adminEngine && typeof window.adminEngine.refreshAllOperationalViews === 'function') {
      window.adminEngine.refreshAllOperationalViews();
    } else {
      if (window.adminEngine && typeof window.adminEngine.renderStatusManager === 'function') {
        window.adminEngine.renderStatusManager();
      }
    }
    if (window.petStatusEngine && typeof window.petStatusEngine.render === 'function') {
      window.petStatusEngine.render();
    }

    if (window.authEngine) {
      window.authEngine.isAuthenticated = true;
      if (!window.adminEngine || !window.adminEngine.isEnterpriseAuthenticated) {
        window.authEngine.userRole = 'client';
      }
      window.authEngine.userName = cleanTutor;
      window.authEngine.currentVipPetId = targetPetId;
      localStorage.setItem('mrs_pets_skip_splash', 'true');
    }

    try {
      localStorage.setItem('mrs_pets_active_customer_name', cleanTutor);
      localStorage.setItem('mrs_pets_active_vip_patient_id', targetPetId);
    } catch(e) {}

    if (window.storeEngine && typeof window.storeEngine.switchCustomer === 'function') {
      window.storeEngine.switchCustomer({ name: cleanTutor, rif: existing?.rif || '', petId: targetPetId });
    } else if (window.storeEngine && typeof window.storeEngine.loadCart === 'function') {
      window.storeEngine.loadCart();
    }

    // 3. CERRAR FORMULARIO
    const formModal = document.getElementById('booking-modal-grooming');
    if (formModal) {
      formModal.classList.remove('active');
      formModal.style.display = 'none';
    }

    if (window.app && typeof window.app.resetButton === 'function') {
      window.app.resetButton(submitBtn);
    }

    // 4. DESPLEGAR INMEDIATAMENTE SCREEN POP DE CONFIRMACIÓN AL CLIENTE
    this.showBookingScreenPopConfirmation({
      id: bookingId,
      tutorName: cleanTutor,
      petName: cleanPet,
      service: `Circuito Grooming Spa 7 Estaciones (${shampoo})`,
      date,
      time: formattedTime,
      location: 'Sede Principal Don Bosco'
    });
    } finally {
      this._isConfirmingGrooming = false;
    }
  }

  // 3. TIENDA & BOUTIQUE VIP BOOKING
  openTiendaBookingModal(itemTitle = 'Asesoramiento Nutricional VIP & Boutique', prefillPetName = '', prefillTutorName = '') {
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`🛍️ Tienda & Boutique VIP: Atendiendo a ${prefillPetName || 'Mascota'} (Tutor: ${prefillTutorName || 'Cliente'})`, 'info');
    }
  }

  // 4. ADMISIÓN & RECEPCIÓN
  openAdmisionBookingModal(serviceTitle = 'Admisión & Recepción VIP', prefillPetName = '', prefillTutorName = '') {
    if (window.registrationEngine && typeof window.registrationEngine.openForm === 'function') {
      window.registrationEngine.openForm();
    } else if (window.app) {
      window.app.openModal('registration-modal');
    }
  }

  // 3. HOTEL BOUTIQUE BOOKING
  openHotelBookingModal(suiteTitle = 'Suite Royal Bioclimática #4', prefillPetName = '', prefillTutorName = '', options = {}) {
    const titleEl = document.getElementById('booking-hotel-suite');
    if (titleEl) titleEl.innerText = suiteTitle;

    const isClientAuth = Boolean(window.authEngine && window.authEngine.isAuthenticated && window.authEngine.userRole === 'client');
    const activeUser = (isClientAuth && typeof window.authEngine.getCurrentUser === 'function')
      ? window.authEngine.getCurrentUser()
      : null;

    const isReset = Boolean(options && options.resetBlank);
    const finalTutor = (isReset || !isClientAuth) ? (prefillTutorName || '') : (prefillTutorName || (activeUser && activeUser.tutorName ? activeUser.tutorName : ''));
    let finalPet = (isReset || !isClientAuth) ? (prefillPetName || '') : (prefillPetName || (activeUser && activeUser.petName ? activeUser.petName : ''));
    if (!finalPet && finalTutor && isClientAuth) {
      const tutorPets = this.getPetsForTutor(finalTutor);
      if (tutorPets && tutorPets.length > 0) {
        const p = tutorPets[0];
        finalPet = `${p.name || p.petName}${p.species ? ` (${p.species})` : ''}`;
      }
    }

    const tutorInput = document.getElementById('booking-hotel-name');
    if (tutorInput) tutorInput.value = finalTutor;

    const petInput = document.getElementById('booking-hotel-pet');
    if (petInput) petInput.value = finalPet;

    this.setupBookingPinField('hotel', activeUser, finalPet, finalTutor);

    const dateInput = document.getElementById('booking-hotel-checkin');
    if (dateInput && !dateInput.value) {
      const today = new Date();
      dateInput.value = today.toISOString().split('T')[0];
    }

    const timeInput = document.getElementById('booking-hotel-time');
    if (timeInput) {
      timeInput.value = this.getSmartBookingTime(dateInput ? dateInput.value : null);
    }

    const isStaff = (window.petStatusEngine && typeof window.petStatusEngine.isStaffMode === 'function')
      ? window.petStatusEngine.isStaffMode()
      : (!document.body.classList.contains('customer-view-mode') && window.authEngine?.userRole !== 'client');
    const packSalidaBox = document.getElementById('booking-hotel-packsalida');
    const packSalidaContainer = document.getElementById('booking-hotel-packsalida-container');
    if (packSalidaBox) {
      if (!isStaff) {
        packSalidaBox.disabled = true;
        packSalidaBox.checked = false;
        if (packSalidaContainer) {
          packSalidaContainer.style.opacity = '0.5';
          packSalidaContainer.style.cursor = 'not-allowed';
          packSalidaContainer.title = 'Inhabilitado para Vista Clientes • Solo Staff Administrativo';
        }
      } else {
        packSalidaBox.disabled = false;
        packSalidaBox.checked = true;
        if (packSalidaContainer) {
          packSalidaContainer.style.opacity = '1';
          packSalidaContainer.style.cursor = 'pointer';
          packSalidaContainer.title = '';
        }
      }
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('booking-modal-hotel');
    } else {
      const modal = document.getElementById('booking-modal-hotel');
      if (modal) modal.classList.add('active');
    }
    this.lookupClient('hotel');
    setTimeout(() => this.validateSlotAvailability('hotel'), 50);
  }

  confirmHotelBooking(event) {
    if (event) event.preventDefault();
    if (this._isConfirmingHotel) return;
    this._isConfirmingHotel = true;

    const submitBtn = document.getElementById('btn-confirm-booking-hotel') || document.querySelector('#booking-modal-hotel button[type="submit"]') || document.querySelector('#booking-modal-hotel .btn-primary');
    if (submitBtn && ((submitBtn.dataset && submitBtn.dataset.busy === 'true') || submitBtn.disabled)) {
      this._isConfirmingHotel = false;
      return;
    }
    if (window.app && typeof window.app.setButtonBusy === 'function') {
      window.app.setButtonBusy(submitBtn, '⏳ Guardando reservación en base de datos...');
    }
    try {
      const name = document.getElementById('booking-hotel-name')?.value || '';
      const pet = document.getElementById('booking-hotel-pet')?.value || '';
      const checkin = document.getElementById('booking-hotel-checkin')?.value || new Date().toISOString().split('T')[0];
      const time = document.getElementById('booking-hotel-time')?.value || '10:00';
      const checkout = document.getElementById('booking-hotel-checkout')?.value || checkin;
      const pinInput = document.getElementById('booking-hotel-pin');
      const enteredPin = pinInput ? pinInput.value.trim() : '';

      const isStaffMode = (window.petStatusEngine && typeof window.petStatusEngine.isStaffMode === 'function')
        ? window.petStatusEngine.isStaffMode()
        : (!document.body.classList.contains('customer-view-mode') && window.authEngine?.userRole !== 'client');
      const packSalida = isStaffMode ? (document.getElementById('booking-hotel-packsalida')?.checked || false) : false;

      // 0. VERIFICACIÓN ESTRICTA DE HORARIO Y DISPONIBILIDAD EN AGENDA LIVE
      const slotCheck = this.checkSlotAvailability('hotel', checkin, time);
      if (!slotCheck.available) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`⛔ No es posible realizar la reserva: ${slotCheck.reason}`, 'error');
        }
        this.displayBlockedSlotAlert('hotel', checkin, time, slotCheck.reason);
        if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
        this._isConfirmingHotel = false;
        return;
      }

      if (!name || !pet) {
        if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('⚠️ Complete el Nombre del Tutor y Mascota para agendar.', 'error');
        }
        return;
      }

      if (!this.ensureVipRegistration(name, pet, 'booking-modal-hotel')) {
        if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
        return;
      }

      const cleanTutor = name.trim();
      const cleanPet = pet.split('(')[0].trim();
      const existing = (typeof this.findExistingPatient === 'function') ? this.findExistingPatient(cleanPet, cleanTutor) : null;

      if (existing) {
        if (!enteredPin) {
          if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
          if (pinInput) {
            pinInput.style.borderColor = '#EF4444';
            pinInput.classList.add('shake-anim');
            setTimeout(() => pinInput.classList.remove('shake-anim'), 400);
            pinInput.focus();
          }
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(`🔒 Ingrese la clave personal de ${existing.owner || cleanTutor} para confirmar la reservación.`, 'error');
          }
          this._isConfirmingHotel = false;
          return;
        }

        if (!this.ensureProfileSecurityUnlocked(existing, () => this.confirmHotelBooking(null), enteredPin, 'hotel', cleanTutor)) {
          if (window.app && typeof window.app.resetButton === 'function') window.app.resetButton(submitBtn);
          this._isConfirmingHotel = false;
          return;
        }
      }

      const bookingId = (window.antiDosBookingEngine && typeof window.antiDosBookingEngine.getNextCorrelativeId === 'function')
        ? window.antiDosBookingEngine.getNextCorrelativeId()
        : `#APT-${Math.floor(1000 + Math.random() * 9000)}`;

      const isExistingInActiveServiceToday = existing &&
        typeof existing.stepIndex === 'number' &&
        existing.stepIndex >= 1 &&
        (!existing.reservationDate || existing.reservationDate === todayStr);

      const targetPetId = (existing && isExistingInActiveServiceToday && checkin > todayStr)
        ? `${existing.id}-RES-${Date.now()}`
        : (existing?.id || `PET-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`);
      const petPhoto = existing?.photo || existing?.image || 'assets/media__1787694901704.jpg';
      const ownerPhoto = existing?.ownerPhoto || 'assets/leia_avatar.jpg';

      const hotelTurn = existing?.turnNumber || (window.adminEngine && window.adminEngine.getNextTurnNumber ? window.adminEngine.getNextTurnNumber('hotel', checkin) : (window.petStatusEngine && window.petStatusEngine.getNextTurnNumber ? window.petStatusEngine.getNextTurnNumber('hotel', checkin) : 1));
      const hotelTicket = (window.adminEngine?.formatTurnTicket ? window.adminEngine.formatTurnTicket('hotel', hotelTurn) : (window.petStatusEngine?.formatTurnTicket ? window.petStatusEngine.formatTurnTicket('hotel', hotelTurn) : `H-${String(hotelTurn).padStart(3, '0')}`));

      if (window.adminEngine) {
        if (typeof window.adminEngine.addPendingAppointment === 'function') {
          window.adminEngine.addPendingAppointment({
            id: bookingId,
            petId: targetPetId,
            area: 'hotel',
            date: checkin,
            time,
            pet: cleanPet,
            tutor: cleanTutor,
            service: `Suite Hotel 5★ (hasta ${checkout}${packSalida ? ' + Pack Salida' : ''})`
          });
        }

        if (typeof window.adminEngine.registerNewPatient === 'function') {
          window.adminEngine.registerNewPatient({
            id: targetPetId,
            name: cleanPet,
            petName: cleanPet,
            species: existing?.species || 'Mascota VIP',
            owner: cleanTutor,
            ownerName: cleanTutor,
            ownerPhone: existing?.ownerPhone || '+58 412-5551234',
            area: 'hotel',
            hasReservation: true,
            reservationDate: checkin,
            reservationTime: time,
            date: checkin,
            time: time,
            stepIndex: 0,
            reservationStatus: 'pending_approval',
            turnNumber: hotelTurn,
            turno: hotelTurn,
            turnTicket: hotelTicket,
            notes: `Reserva Hotel 5★ (Suite) confirmada para ${checkin} a las ${time}.`,
            photo: petPhoto,
            image: petPhoto,
            ownerPhoto: ownerPhoto,
            termsAccepted: true,
            isVipRegistered: true
          });
        }
      }

      if (window.petStatusEngine && typeof window.petStatusEngine.registerNewPet === 'function') {
        window.petStatusEngine.registerNewPet({
          id: targetPetId,
          name: cleanPet,
          petName: cleanPet,
          species: existing?.species || 'Mascota VIP',
          owner: cleanTutor,
          ownerName: cleanTutor,
          ownerPhone: existing?.ownerPhone || '+58 412-5551234',
          area: 'hotel',
          hasReservation: true,
          reservationDate: checkin,
          reservationTime: time,
          date: checkin,
          time: time,
          stepIndex: 0,
          reservationStatus: 'pending_approval',
          turnNumber: hotelTurn,
          turno: hotelTurn,
          turnTicket: hotelTicket,
          notes: `Reserva Hotel 5★ (${checkin} al ${checkout}) - Hora: ${time}`,
          image: petPhoto,
          photo: petPhoto,
          ownerPhoto: ownerPhoto,
          isVipRegistered: true
        });
      }

      if (window.adminEngine && typeof window.adminEngine.refreshAllOperationalViews === 'function') {
        window.adminEngine.refreshAllOperationalViews();
      } else {
        if (window.adminEngine && typeof window.adminEngine.renderStatusManager === 'function') {
          window.adminEngine.renderStatusManager();
        }
      }
      if (window.petStatusEngine && typeof window.petStatusEngine.render === 'function') {
        window.petStatusEngine.render();
      }

      if (window.authEngine) {
        window.authEngine.isAuthenticated = true;
        if (!window.adminEngine || !window.adminEngine.isEnterpriseAuthenticated) {
          window.authEngine.userRole = 'client';
        }
        window.authEngine.userName = cleanTutor;
        window.authEngine.currentVipPetId = targetPetId;
        localStorage.setItem('mrs_pets_skip_splash', 'true');
      }

      try {
        localStorage.setItem('mrs_pets_active_customer_name', cleanTutor);
        localStorage.setItem('mrs_pets_active_vip_patient_id', targetPetId);
      } catch(e) {}

      if (window.storeEngine && typeof window.storeEngine.switchCustomer === 'function') {
        window.storeEngine.switchCustomer({ name: cleanTutor, rif: existing?.rif || '', petId: targetPetId });
      } else if (window.storeEngine && typeof window.storeEngine.loadCart === 'function') {
        window.storeEngine.loadCart();
      }

      if (window.app && typeof window.app.closeModal === 'function') {
        window.app.closeModal('booking-modal-hotel');
      } else {
        const modal = document.getElementById('booking-modal-hotel');
        if (modal) modal.classList.remove('active');
      }

      if (window.mrsPetsArch && typeof window.mrsPetsArch.triggerMakeWebhook === 'function') {
        window.mrsPetsArch.triggerMakeWebhook('booking_hotel', { pet: cleanPet, name: cleanTutor, checkin, time, checkout, packSalida });
      }

      if (window.app && typeof window.app.resetButton === 'function') {
        window.app.resetButton(submitBtn);
      }

      this.showBookingScreenPopConfirmation({
        id: bookingId,
        tutorName: cleanTutor,
        petName: cleanPet,
        service: `Suite Hotel 5★ (hasta ${checkout}${packSalida ? ' + Pack Salida' : ''})`,
        date: checkin,
        time,
        location: 'Sede Principal Don Bosco - Hotel 5★'
      });
    } catch (err) {
      console.error("Error in confirmHotelBooking:", err);
    } finally {
      this._isConfirmingHotel = false;
    }
  }

  downloadPDF(pdfName) {
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`Descargando documento oficial: ${pdfName}`, 'info');
    }
  }

  showBookingScreenPopConfirmation(booking) {
    let modal = document.getElementById('booking-confirmation-pop');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'booking-confirmation-pop';
      document.body.appendChild(modal);
    }

    // Play pleasant success chime for immediate sensory confirmation
    if (window.app && typeof window.app.playSuccessChime === 'function') {
      try { window.app.playSuccessChime(); } catch(e) {}
    }

    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const isFuture = booking.date && booking.date > todayStr;

    modal.className = 'modal-overlay active';
    modal.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(11, 15, 25, 0.85) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    `;

    modal.innerHTML = `
      <div class="modal-card" style="max-width:820px; width:94%; text-align:center; padding:32px 36px; border-radius:26px; background:#ffffff !important; color:#000000 !important; box-shadow:0 30px 80px rgba(0,0,0,0.6); border:3px solid #000000 !important; position:relative; z-index:2147483647; animation: modalPopAnim 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.clinicaEngine.confirmBookingAndGoHome('${booking.id}')" style="position:absolute; top:18px; right:18px; border-radius:50%; width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.1rem; cursor:pointer; background:#F1F5F9 !important; border:2px solid #000000 !important; color:#000000 !important;">✕</button>
        
        <div style="display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:12px; flex-wrap:wrap;">
          <div style="width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg, #10b981, #047857); color:white; display:flex; align-items:center; justify-content:center; font-size:2.5rem; box-shadow:0 8px 24px rgba(16,185,129,0.45); border:2.5px solid #000000; flex-shrink:0;">
            ✓
          </div>
          <div style="text-align:left;">
            <div style="display:inline-flex; align-items:center; gap:6px; background:#ECFDF5 !important; border:2px solid #000000 !important; color:#000000 !important; font-size:0.75rem; font-weight:900; padding:4px 14px; border-radius:999px; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">
              🎉 PANTALLA DE CONFIRMACIÓN OFICIAL • MRS. PETS VIP
            </div>
            <h2 style="font-size:1.65rem; font-weight:900; color:#000000 !important; margin:2px 0 0 0; letter-spacing:-0.02em;">
              Usted acaba de hacer una reserva
            </h2>
            <div style="font-size:0.92rem; color:#000000 !important; font-weight:700; margin-top:2px;">
              ¡Reservación creada, asegurada y registrada en la Base de Datos operativa!
            </div>
          </div>
        </div>
        
        <div style="background:#F0FDF4 !important; border:2px solid #000000 !important; border-radius:14px; padding:12px 18px; color:#000000 !important; font-weight:700; font-size:0.88rem; margin-bottom:18px; line-height:1.45; text-align:left; display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.4rem;">📋</span>
          <div>
            <strong style="color:#000000 !important;">Su reservación ha quedado registrada y asegurada en el sistema.</strong> 
            El paciente VIP y el tutor están sincronizados con la agenda de atención y base de datos operativa.
          </div>
        </div>

        <!-- 2-COLUMN HORIZONTAL GRID -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:14px; text-align:left; margin-bottom:22px;">
          <!-- COLUMNA 1: DATOS DEL PACIENTE Y TUTOR -->
          <div style="background:#F8FAFC !important; border:2px solid #000000 !important; border-radius:16px; padding:16px 18px; color:#000000 !important;">
            <div style="font-size:0.78rem; font-weight:900; color:#000000 !important; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:10px; border-bottom:1.5px solid #000000; padding-bottom:6px; display:flex; align-items:center; gap:6px;">
              <span>👤</span> Tutor & Paciente VIP
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="color:#000000 !important; font-weight:700; font-size:0.85rem;">Código de Solicitud:</span>
              <span style="font-weight:900; color:#000000 !important; font-size:0.96rem; font-family:monospace; background:#FEF3C7 !important; padding:2px 8px; border-radius:6px; border:1.5px solid #000000;">${booking.id}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="color:#000000 !important; font-weight:700; font-size:0.85rem;">Tutor / Cliente:</span>
              <span style="font-weight:900; color:#000000 !important; font-size:0.92rem;">${booking.tutorName || booking.tutor || 'Cliente VIP'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#000000 !important; font-weight:700; font-size:0.85rem;">Mascota Paciente:</span>
              <span style="font-weight:900; color:#000000 !important; font-size:0.95rem;">🐾 ${booking.petName || booking.pet || 'Mascota VIP'}</span>
            </div>
          </div>

          <!-- COLUMNA 2: DETALLES DE CITA Y SERVICIO -->
          <div style="background:#F8FAFC !important; border:2px solid #000000 !important; border-radius:16px; padding:16px 18px; color:#000000 !important;">
            <div style="font-size:0.78rem; font-weight:900; color:#000000 !important; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:10px; border-bottom:1.5px solid #000000; padding-bottom:6px; display:flex; align-items:center; gap:6px;">
              <span>✂️</span> Servicio & Cita Confirmada
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="color:#000000 !important; font-weight:700; font-size:0.85rem;">Servicio:</span>
              <span style="font-weight:900; color:#000000 !important; font-size:0.88rem; text-align:right;">${booking.service || 'Servicio VIP'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="color:#000000 !important; font-weight:700; font-size:0.85rem;">Fecha & Hora:</span>
              <span style="font-weight:900; color:#000000 !important; font-size:0.9rem;">📅 ${booking.date} ⏰ ${booking.time}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#000000 !important; font-weight:700; font-size:0.85rem;">Estatus del Sistema:</span>
              <span class="badge" style="background:#D1FAE5 !important; color:#000000 !important; font-weight:900; font-size:0.76rem; border:1.5px solid #000000; padding:3px 10px; border-radius:999px;">✅ Cita Registrada & Activa</span>
            </div>
          </div>
        </div>

        <!-- DUAL HIGH-VISIBILITY ACTION BUTTONS -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <button type="button" class="btn btn-primary" onclick="window.clinicaEngine.confirmBookingAndGoStatus('${booking.id}')" style="padding:14px; font-weight:900; font-size:0.98rem; border-radius:14px; background:linear-gradient(135deg, #10b981, #047857); border:none; box-shadow:0 8px 22px rgba(16,185,129,0.35); cursor:pointer; color:#FFFFFF !important; display:flex; align-items:center; justify-content:center; gap:8px;">
            <span>📋 Ver Estatus / Turnos</span> <span>➔</span>
          </button>
          <button type="button" class="btn btn-secondary" onclick="window.clinicaEngine.confirmBookingAndGoHome('${booking.id}')" style="padding:14px; font-weight:800; font-size:0.98rem; border-radius:14px; background:#F8FAFC; color:#0F172A; border:1.5px solid #CBD5E1; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
            <span>🏠 Ir al Portal Principal</span>
          </button>
        </div>
      </div>
    `;

    // Automatically trigger notification badges
    this.refreshPendingApprovalsNotifications();
  }

  confirmBookingAndGoStatus(bookingId) {
    const modal = document.getElementById('booking-confirmation-pop');
    if (modal) {
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
    }

    const portal = document.getElementById('access-links-portal');
    if (portal) portal.style.setProperty('display', 'none', 'important');
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.style.setProperty('display', 'flex', 'important');

    if (window.app && typeof window.app.switchTab === 'function') {
      window.app.switchTab('pet-status', true);
    }
    if (window.petStatusEngine && typeof window.petStatusEngine.render === 'function') {
      window.petStatusEngine.render();
    }
    if (window.adminEngine && typeof window.adminEngine.refreshAllOperationalViews === 'function') {
      window.adminEngine.refreshAllOperationalViews();
    }

    this.refreshPendingApprovalsNotifications();

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✅ Reservación ${bookingId} visualizada en Estatus Operativo.`, 'success');
    }
  }

  confirmBookingAndGoHome(bookingId) {
    const modal = document.getElementById('booking-confirmation-pop');
    if (modal) {
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
    }

    const portal = document.getElementById('access-links-portal');
    if (portal) portal.style.setProperty('display', 'none', 'important');
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.style.setProperty('display', 'flex', 'important');

    if (window.app && typeof window.app.switchTab === 'function') {
      window.app.switchTab('welcome');
    }
    if (window.petStatusEngine && typeof window.petStatusEngine.render === 'function') {
      window.petStatusEngine.render();
    }
    if (window.adminEngine && typeof window.adminEngine.refreshAllOperationalViews === 'function') {
      window.adminEngine.refreshAllOperationalViews();
    }

    this.refreshPendingApprovalsNotifications();

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`✅ Reservación ${bookingId} procesada y confirmada exitosamente.`, 'success');
    }
  }

  openPendingAppointmentsInbox() {
    if (window.adminEngine && typeof window.adminEngine.openPendingAppointmentsInbox === 'function') {
      return window.adminEngine.openPendingAppointmentsInbox();
    }
    if (window.app && typeof window.app.openPendingAppointmentsInbox === 'function') {
      return window.app.openPendingAppointmentsInbox();
    }
    if (window.app && typeof window.app.switchTab === 'function') {
      return window.app.switchTab('admin', true);
    }
  }

  refreshPendingApprovalsNotifications() {
    const isEnterprise = (
      (window.adminEngine && (window.adminEngine.viewEnvironment === 'enterprise' || window.adminEngine.isEnterpriseAuthenticated === true)) ||
      (window.authEngine && window.authEngine.userRole === 'staff') ||
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true')
    );

    const mod4Container = document.getElementById('module4-pending-status');
    const welcomeAlert = document.getElementById('welcome-pending-alert-banner');

    // 🔒 STRICT REQUIREMENT: If NOT in Vista Empresa (i.e., in Vista Cliente), ALWAYS HIDE emergency alert banner & badges from clients!
    if (!isEnterprise) {
      if (welcomeAlert) {
        welcomeAlert.innerHTML = '';
        welcomeAlert.style.display = 'none';
      }
      if (mod4Container) {
        mod4Container.innerHTML = '';
        mod4Container.style.display = 'none';
      }
      return;
    }

    if (welcomeAlert) welcomeAlert.style.display = 'block';
    if (mod4Container) mod4Container.style.display = 'block';

    const pendingList = window.adminEngine?.pendingAppointments || [];
    const activePending = pendingList.filter(p => {
      if (!p) return false;
      const status = (p.status || p.reservationStatus || '').toLowerCase();
      return !status || status.includes('pendiente') || status === 'pending_approval' || p.stepIndex === 0;
    });
    const totalPending = activePending.length;

    // 1. Update Módulo 4 en Vista Empresa
    if (mod4Container) {
      if (totalPending > 0) {
        mod4Container.innerHTML = `
          <div class="badge-titilante-pulse" style="cursor:pointer;" title="Haz clic para abrir directamente la bandeja de reservaciones pendientes por aprobación" onclick="event.stopPropagation(); window.adminEngine ? window.adminEngine.openPendingAppointmentsInbox() : (window.clinicaEngine ? window.clinicaEngine.openPendingAppointmentsInbox() : app.openPendingAppointmentsInbox());">
            🔔 ${totalPending} RESERVACIÓN${totalPending > 1 ? 'ES' : ''} PENDIENTE${totalPending > 1 ? 'S' : ''} POR APROBACIÓN
          </div>
        `;
      } else {
        mod4Container.innerHTML = `
          <div style="font-size:0.75rem; color:#16a34a; font-weight:800; display:flex; align-items:center; gap:6px;">
            ✓ Circuito sin pendientes por aprobación
          </div>
        `;
      }
    }

    // 2. Update Header Alert Banner en Vista Empresa
    if (welcomeAlert) {
      if (totalPending > 0) {
        welcomeAlert.innerHTML = `
          <div class="badge-titilante-pulse" style="width:100%; justify-content:center; font-size:0.9rem; padding:12px 18px; border-radius:16px; margin-bottom:18px; box-shadow:0 8px 25px rgba(239,68,68,0.35); cursor:pointer;" onclick="window.adminEngine ? window.adminEngine.openPendingAppointmentsInbox() : (window.clinicaEngine ? window.clinicaEngine.openPendingAppointmentsInbox() : (window.app && window.app.openPendingAppointmentsInbox ? window.app.openPendingAppointmentsInbox() : app.switchTab('admin', true)));" title="Clic para abrir directamente la bandeja de reservaciones pendientes por aprobación en el rol de staff">
            📢 ATENCIÓN: ${totalPending} SOLICITUD${totalPending > 1 ? 'ES' : ''} DE RESERVA PASADA${totalPending > 1 ? 'S' : ''} AL DEPARTAMENTO DE APROBACIÓN (PENDIENTE${totalPending > 1 ? 'S' : ''} DE CONFIRMACIÓN)
          </div>
        `;
      } else {
        welcomeAlert.innerHTML = '';
        welcomeAlert.style.display = 'none';
      }
    }
  }

  /**
   * 📥 RECEPCIÓN DE PACIENTES & APERTURA DE CUENTA (PASO 0 ➔ PASO 1)
   * Reglas de negocio estrictas:
   * 1. Cero cargos en Reservas: En Paso 0 (Reserva), el carrito permanece estrictamente en $0.00.
   * 2. Apertura de Cuenta al Recibir: El cargo real y la inserción del concepto en el carrito
   *    ocurren única y exclusivamente cuando el estatus del paciente cambia a 'recibido' (Paso 1).
   * 3. Idempotencia Estricta: Si el estatus se actualiza más de una vez (ej. clics repetidos o
   *    re-confirmaciones), NO duplicar conceptos ni incrementar cantidades en la cesta.
   */
  receivePatient(petId, area = null, staffName = 'Staff') {
    if (!petId) return null;

    const allPatients = (typeof this.getAllPatients === 'function')
      ? this.getAllPatients()
      : (window.adminEngine?.patientsStatus || window.petStatusEngine?.pets || []);

    const normalizePetBase = (str) => {
      if (window.storeEngine && typeof window.storeEngine.normalizePetBaseName === 'function') {
        return window.storeEngine.normalizePetBaseName(str);
      }
      return (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split('(')[0].split('-')[0].trim();
    };

    const targetBase = normalizePetBase(petId);
    const pet = allPatients.find(p => p.id === petId || normalizePetBase(p.name || p.petName) === targetBase);
    if (!pet) return null;

    const targetArea = (area || pet.area || 'clinica').toLowerCase();
    const isAlreadyReceived = (typeof pet.stepIndex === 'number' && pet.stepIndex >= 1);

    // Actualizar estatus a 1 (Recibido / Admisión)
    pet.stepIndex = 1;
    pet.reservationStatus = 'received';
    pet.status = 'recibido';
    if (!pet.receivedAt) {
      pet.receivedAt = new Date().toISOString();
    }
    if (staffName) {
      pet.receivedBy = staffName;
    }

    // Actualizar y persistir en adminEngine
    if (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) {
      const idx = window.adminEngine.patientsStatus.findIndex(p => p.id === pet.id || normalizePetBase(p.name || p.petName) === targetBase);
      if (idx !== -1) {
        window.adminEngine.patientsStatus[idx] = { ...window.adminEngine.patientsStatus[idx], ...pet };
      }
      if (typeof window.adminEngine.savePatientsToStorage === 'function') {
        window.adminEngine.savePatientsToStorage();
      }
    }

    // Actualizar y persistir en petStatusEngine
    if (window.petStatusEngine && Array.isArray(window.petStatusEngine.pets)) {
      const pIdx = window.petStatusEngine.pets.findIndex(p => p.id === pet.id || normalizePetBase(p.name || p.petName) === targetBase);
      if (pIdx !== -1) {
        window.petStatusEngine.pets[pIdx] = { ...window.petStatusEngine.pets[pIdx], ...pet };
      }
      if (typeof window.petStatusEngine.savePetsToStorage === 'function') {
        window.petStatusEngine.savePetsToStorage();
      }
    }

    // DISPARAR APERTURA DE CUENTA E INSERCIÓN EN CARRITO CON CANDADO DE IDEMPOTENCIA
    let chargedItem = null;
    const tutor = pet.owner || pet.ownerName;
    const tutorRif = pet.rif || pet.ownerId || '';
    const petName = pet.name || pet.petName;

    if (window.storeEngine) {
      if (targetArea === 'grooming' && typeof window.storeEngine.chargeGroomingServiceToCart === 'function') {
        chargedItem = window.storeEngine.chargeGroomingServiceToCart({
          tutor,
          tutorId: tutorRif,
          rif: tutorRif,
          pet: petName,
          service: pet.service || 'Circuito Grooming Spa (7 Estaciones)',
          price: 25.00,
          petId: pet.id,
          stepIndex: 1
        });
      } else if (targetArea === 'clinica' && typeof window.storeEngine.chargeClinicalConsultationToCart === 'function') {
        chargedItem = window.storeEngine.chargeClinicalConsultationToCart({
          tutor,
          tutorId: tutorRif,
          rif: tutorRif,
          pet: petName,
          service: pet.service || 'Consulta Médica Veterinaria & Evaluación Especializada',
          price: typeof pet.price === 'number' ? pet.price : 30.00,
          petId: pet.id,
          stepIndex: 1
        });
      } else if (targetArea === 'hotel' && typeof window.storeEngine.chargeHotelServiceToCart === 'function') {
        chargedItem = window.storeEngine.chargeHotelServiceToCart({
          tutor,
          tutorId: tutorRif,
          rif: tutorRif,
          pet: petName,
          service: pet.service || 'Hospedaje Suite Bioclimática VIP (Check-in Hotel 5★)',
          price: typeof pet.price === 'number' ? pet.price : 45.00,
          petId: pet.id,
          stepIndex: 1
        });
      }
    }

    if (window.adminEngine && typeof window.adminEngine.refreshAllOperationalViews === 'function') {
      window.adminEngine.refreshAllOperationalViews();
    }
    if (window.petStatusEngine && typeof window.petStatusEngine.render === 'function') {
      window.petStatusEngine.render();
    }

    return { pet, chargedItem, isAlreadyReceived };
  }

  triggerEmergencyCall() {
    app.switchTab('playground');
    voiceSim.toggleCall();
    app.showToast('🚨 LÍNEA DIRECTA DE CLÍNICA VETERINARIA CONECTADA', 'warning');
  }
}

const clinicaEngine = new ClinicaEngine();
window.clinicaEngine = clinicaEngine;
document.addEventListener('DOMContentLoaded', () => {
  clinicaEngine.init();
  setTimeout(() => clinicaEngine.refreshPendingApprovalsNotifications(), 600);
});
