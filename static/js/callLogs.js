/* ==========================================================================
   CALL LOGS & INBOX ENGINE — MRS. PETS MARACAIBO OMNICHANNEL
   Auditoría de Llamadas de Voz, WhatsApp Cloud API & Control Humano (Takeover)
   ========================================================================== */

class CallLogs {
  constructor() {
    this.logs = [
      {
        id: 1,
        type: 'whatsapp',
        contact: 'Dalybell Ramírez Montilla',
        phone: '+58 414-6799510',
        petName: 'Rocky (Príncipe - Husky Siberiano)',
        duration: '12 msgs',
        sentiment: 'Positivo',
        status: 'Completada',
        date: 'Hoy, 11:25 AM',
        audioDuration: null,
        transcript: [
          { sender: 'user', time: '11:20 AM', text: '¡Hola Leia! Quisiera confirmar si Rocky ya pasó a la etapa de hidratación de pulpejos.' },
          { sender: 'agent', time: '11:21 AM', text: '¡Hola Sra. Dalybell! Qué gusto saludarte. Sí, en este momento Rocky está en su sesión de baño spa y nuestro estilista ya aplicó la hidratación de pulpejos obligatoria con bálsamo natural Mrs. Pets ✨.' },
          { sender: 'user', time: '11:23 AM', text: '¡Excelente servicio! ¿A qué hora puedo pasar a retirarlo?' },
          { sender: 'agent', time: '11:24 AM', text: 'Estimamos que estará listo y radiante a las 12:15 PM en recepción. Te enviaremos un WhatsApp de confirmación con su foto de salida 📸.' }
        ]
      },
      {
        id: 2,
        type: 'telephony',
        contact: 'Carlos Mendoza',
        phone: '+58 412-555-1234',
        petName: 'Buddy (Golden) & Fifi (Dachshund)',
        duration: '03:42',
        sentiment: 'Positivo',
        status: 'Completada',
        date: 'Hoy, 10:48 AM',
        audioDuration: '03:42',
        transcript: [
          { sender: 'agent', time: '00:05', text: 'Mrs. Pets Maracaibo, le atiende Leia Concierge. ¿En qué podemos consentir hoy a su consentido?' },
          { sender: 'user', time: '00:15', text: 'Buenos días Leia, llamo para coordinar la consulta de cardiología de Fifi y agendar baño para Buddy.' },
          { sender: 'agent', time: '00:45', text: 'Con el mayor gusto, Sr. Carlos. Para Fifi tenemos disponibilidad con la Dra. Patricia Silva a las 2:00 PM y Buddy puede ingresar a su circuito de grooming a la 1:30 PM.' },
          { sender: 'user', time: '01:30', text: 'Perfecto, anótame ambas citas por favor. ¿Requiere ayuno para la consulta de Fifi?' },
          { sender: 'agent', time: '02:00', text: 'Únicamente 4 horas de ayuno preventivo para ecografía de control. Hemos agendado su turno y enviado el comprobante a su móvil.' }
        ]
      },
      {
        id: 3,
        type: 'whatsapp',
        contact: 'Mariana Colina',
        phone: '+58 412-887-3410',
        petName: 'Lata (Poodle Toy)',
        duration: '6 msgs',
        sentiment: 'Positivo',
        status: 'Completada',
        date: 'Hoy, 10:15 AM',
        audioDuration: null,
        transcript: [
          { sender: 'user', time: '10:10 AM', text: 'Hola Leia, ¿cómo va mi princesa Lata?' },
          { sender: 'agent', time: '10:12 AM', text: '¡Hola Mariana! Lata acaba de finalizar su revisión dérmica preventiva y corte higiénico. Todo se encuentra en perfecto estado de salud.' },
          { sender: 'user', time: '10:14 AM', text: '¡Qué alivio! Muchas gracias por el seguimiento.' }
        ]
      },
      {
        id: 4,
        type: 'telephony',
        contact: 'Dr. Roberto Valbuena',
        phone: '+58 424-912-8374',
        petName: 'Interconsulta Médica Q-Vet',
        duration: '02:18',
        sentiment: 'Positivo',
        status: 'Completada',
        date: 'Hoy, 09:30 AM',
        audioDuration: '02:18',
        transcript: [
          { sender: 'agent', time: '00:04', text: 'Línea de soporte veterinario Mrs. Pets, concierge en línea.' },
          { sender: 'user', time: '00:12', text: 'Hola, habla el Dr. Roberto. Quería verificar si los estudios DICOM de la paciente Fifi ya sincronizaron con el PACS de Q-Vet.' },
          { sender: 'agent', time: '00:35', text: 'Doctor, confirmamos que las 4 placas radiológicas están cargadas en el servidor DICOM PACS local con estado verificado.' }
        ]
      },
      {
        id: 5,
        type: 'whatsapp',
        contact: 'Sofía Villalobos',
        phone: '+58 414-998-1243',
        petName: 'Simba (Gato Persa)',
        duration: '9 msgs',
        sentiment: 'Neutro',
        status: 'En Curso',
        date: 'Hoy, 09:12 AM',
        audioDuration: null,
        transcript: [
          { sender: 'user', time: '09:05 AM', text: 'Buenos días, necesito hospedaje para Simba durante el fin de semana.' },
          { sender: 'agent', time: '09:08 AM', text: '¡Buenos días Sofía! En nuestro Hotel Felino VIP contamos con suites climatizadas con enriquecimiento ambiental. ¿De qué fecha a qué fecha sería la estadía?' },
          { sender: 'user', time: '09:10 AM', text: 'Del viernes 24 al domingo 26 de octubre.' }
        ]
      },
      {
        id: 6,
        type: 'telephony',
        contact: 'Andrés Morales',
        phone: '+1 (305) 998-1243',
        petName: 'Thor (Bulldog Francés)',
        duration: '05:12',
        sentiment: 'Neutro',
        status: 'Completada',
        date: 'Ayer, 04:30 PM',
        audioDuration: '05:12',
        transcript: [
          { sender: 'user', time: '00:10', text: 'Hola, llamo desde Miami porque mi mamá llevará a Thor a la sede de Maracaibo. ¿Puedo pagar online con Stripe o PayPal?' },
          { sender: 'agent', time: '00:30', text: '¡Absolutamente! Contamos con pasarela oficial Stripe y PayPal en nuestra plataforma web para pagos internacionales en USD.' }
        ]
      },
      {
        id: 7,
        type: 'whatsapp',
        contact: 'Elena Gutiérrez',
        phone: '+34 612-887-341',
        petName: 'Max (Beagle)',
        duration: '14 msgs',
        sentiment: 'Frustrado',
        status: 'Transferido',
        date: 'Ayer, 02:15 PM',
        audioDuration: null,
        transcript: [
          { sender: 'user', time: '02:00 PM', text: 'Llevo 20 minutos esperando que me confirmen si puedo cambiar el horario de mañana para las 7:00 PM.' },
          { sender: 'agent', time: '02:02 PM', text: 'Estimada Elena, comprendemos su situación. Nuestras citas de grooming concluyen estrictamente a las 6:00 PM por bienestar animal. Le transferiré de inmediato con nuestra supervisora humana para evaluar una alternativa.' },
          { sender: 'user', time: '02:05 PM', text: 'Por favor, comuníqueme con alguien del staff humano.' }
        ]
      },
      {
        id: 8,
        type: 'whatsapp',
        contact: 'María Eugenia Pirela',
        phone: '+58 416-234-5678',
        petName: 'Kira (Pomerania VIP)',
        duration: '8 msgs',
        sentiment: 'Positivo',
        status: 'Completada',
        date: 'Ayer, 11:40 AM',
        audioDuration: null,
        transcript: [
          { sender: 'user', time: '11:35 AM', text: 'Hola Leia, quiero comprar el acondicionador dérmico de seda que le aplicaron a Kira.' },
          { sender: 'agent', time: '11:37 AM', text: '¡Excelente elección! Es el Serum Silk Spa Mrs. Pets con aceite de jojoba y keratina. He preparado su orden en la Boutique Online.' }
        ]
      },
      {
        id: 9,
        type: 'telephony',
        contact: 'Dr. Arnaldo Silva',
        phone: '+58 414-776-6554',
        petName: 'Paciente Derivado',
        duration: '01:45',
        sentiment: 'Positivo',
        status: 'Completada',
        date: '15 Oct, 03:15 PM',
        audioDuration: '01:45',
        transcript: [
          { sender: 'agent', time: '00:03', text: 'Recepción clínica Mrs. Pets, buenas tardes.' },
          { sender: 'user', time: '00:10', text: 'Buenas tardes, remito un paciente canino para ecografía de abdomen con la Dra. Silva.' }
        ]
      },
      {
        id: 10,
        type: 'telephony',
        contact: 'Patricia Villasmil',
        phone: '+58 414-555-9090',
        petName: 'Chloe (Shih Tzu)',
        duration: '04:10',
        sentiment: 'Positivo',
        status: 'Humano Activo',
        date: '14 Oct, 11:20 AM',
        audioDuration: '04:10',
        transcript: [
          { sender: 'agent', time: '00:05', text: 'Atención personalizada Mrs. Pets, asistida por Dra. Patricia Silva.' },
          { sender: 'user', time: '00:20', text: 'Doctora Patricia, qué bueno hablar directamente con usted sobre el tratamiento de piel de Chloe.' }
        ]
      }
    ];

    this.activeTakeoverId = null;
    this.activeChannelFilter = 'all';
    this.activeSentimentFilter = 'all';
    this.searchQuery = '';
    this.audioInterval = null;
    this.isPlayingAudio = false;
  }

  init() {
    this.render();
  }

  filterByChannel(channel, btnEl) {
    this.activeChannelFilter = channel;
    
    // Actualizar estilo visual de los botones de filtro
    const buttons = document.querySelectorAll('.call-logs-filter-btn[data-filter-type="channel"]');
    buttons.forEach(btn => {
      if (btn === btnEl) {
        btn.classList.add('active');
        btn.style.background = '#0F172A';
        btn.style.color = '#FFFFFF';
        btn.style.borderColor = 'transparent';
      } else {
        btn.classList.remove('active');
        btn.style.background = '#F1F5F9';
        btn.style.color = '#1E293B';
        btn.style.borderColor = '#CBD5E1';
      }
    });

    this.render();
  }

  filterBySentiment(sentiment) {
    this.activeSentimentFilter = sentiment;
    this.render();
  }

  searchLogs(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.render();
  }

  getFilteredLogs() {
    return this.logs.filter(log => {
      // Filtro por canal
      if (this.activeChannelFilter !== 'all' && log.type !== this.activeChannelFilter) {
        return false;
      }

      // Filtro por sentimiento
      if (this.activeSentimentFilter !== 'all' && log.sentiment !== this.activeSentimentFilter) {
        return false;
      }

      // Filtro por búsqueda de texto
      if (this.searchQuery) {
        const contactMatch = (log.contact || '').toLowerCase().includes(this.searchQuery);
        const phoneMatch = (log.phone || '').toLowerCase().includes(this.searchQuery);
        const petMatch = (log.petName || '').toLowerCase().includes(this.searchQuery);
        const statusMatch = (log.status || '').toLowerCase().includes(this.searchQuery);
        const sentimentMatch = (log.sentiment || '').toLowerCase().includes(this.searchQuery);
        if (!contactMatch && !phoneMatch && !petMatch && !statusMatch && !sentimentMatch) {
          return false;
        }
      }

      return true;
    });
  }

  render() {
    const tbody = document.getElementById('logs-table-body');
    if (!tbody) return;

    const filteredLogs = this.getFilteredLogs();
    tbody.innerHTML = '';

    // Actualizar métricas KPI
    this.updateMetrics();

    if (filteredLogs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding:40px 20px; text-align:center; color:#475569;">
            <div style="font-size:2.2rem; margin-bottom:8px;">🔍</div>
            <div style="font-size:1.05rem; font-weight:800; color:#0F172A; margin-bottom:4px;">No se encontraron interacciones</div>
            <div style="font-size:0.85rem; color:#64748B;">No hay registros que coincidan con los filtros aplicados. Intente restablecer la búsqueda.</div>
          </td>
        </tr>
      `;
      this.updateCountLabel(0);
      return;
    }

    filteredLogs.forEach(log => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #F1F5F9';
      tr.style.transition = 'background 0.2s ease';
      tr.onmouseenter = () => tr.style.background = '#F8FAFC';
      tr.onmouseleave = () => tr.style.background = 'transparent';

      const isWa = log.type === 'whatsapp';
      const channelBadge = isWa 
        ? `<span class="badge" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-weight:800; font-size:0.75rem;"><i data-lucide="message-square" style="width:13px; height:13px; margin-right:4px;"></i> WhatsApp</span>`
        : `<span class="badge" style="background:#EFF6FF; color:#1E40AF; border:1px solid #BFDBFE; font-weight:800; font-size:0.75rem;"><i data-lucide="phone" style="width:13px; height:13px; margin-right:4px;"></i> Telefonía</span>`;

      let sentimentBadge = `<span class="badge" style="background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; font-weight:800;">🟢 ${log.sentiment}</span>`;
      if (log.sentiment === 'Neutro') {
        sentimentBadge = `<span class="badge" style="background:#FFFBEB; color:#B45309; border:1px solid #FDE68A; font-weight:800;">🟡 ${log.sentiment}</span>`;
      }
      if (log.sentiment === 'Frustrado') {
        sentimentBadge = `<span class="badge" style="background:#FEF2F2; color:#B91C1C; border:1px solid #FECACA; font-weight:800;">🔴 ${log.sentiment}</span>`;
      }

      let statusBadge = `<span class="badge" style="background:#F1F5F9; color:#334155; font-weight:700;">${log.status}</span>`;
      if (log.status === 'Completada') {
        statusBadge = `<span class="badge" style="background:#F0FDF4; color:#15803D; font-weight:800;">✅ Completada</span>`;
      } else if (log.status === 'En Curso') {
        statusBadge = `<span class="badge" style="background:#FEF3C7; color:#B45309; font-weight:800;">⚡ En Curso</span>`;
      } else if (log.status === 'Transferido') {
        statusBadge = `<span class="badge" style="background:#FEE2E2; color:#DC2626; font-weight:800;">🚨 Transferido</span>`;
      } else if (log.status === 'Humano Activo') {
        statusBadge = `<span class="badge" style="background:#E0E7FF; color:#4338CA; font-weight:800;">👤 Humano Activo</span>`;
      }

      tr.innerHTML = `
        <td style="padding:14px 18px; vertical-align:middle;">
          ${channelBadge}
        </td>
        <td style="padding:14px 18px; vertical-align:middle;">
          <div style="font-weight:800; color:#0F172A; font-size:0.92rem;">${log.contact}</div>
          <div style="font-size:0.75rem; color:#64748B; font-weight:600; display:flex; align-items:center; gap:6px; margin-top:2px;">
            <span>${log.phone || log.contact}</span>
            <span style="opacity:0.4;">•</span>
            <span style="color:#D4AF37; font-weight:700;">🐾 ${log.petName || 'Paciente VIP'}</span>
          </div>
          <div style="font-size:0.72rem; color:#94A3B8; margin-top:2px;">🕒 ${log.date}</div>
        </td>
        <td style="padding:14px 18px; vertical-align:middle; font-weight:800; color:#1E293B; font-size:0.88rem;">
          ${log.duration}
        </td>
        <td style="padding:14px 18px; vertical-align:middle;">
          ${sentimentBadge}
        </td>
        <td style="padding:14px 18px; vertical-align:middle;">
          ${statusBadge}
        </td>
        <td style="padding:14px 18px; vertical-align:middle; text-align:right;">
          <div style="display:flex; gap:6px; justify-content:flex-end; flex-wrap:wrap;">
            ${!isWa ? `
              <button class="btn btn-secondary btn-sm" onclick="callLogs.playAudio(${log.id})" style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; font-weight:800; border-radius:8px; padding:6px 10px; cursor:pointer;" title="Escuchar Grabación">
                <i data-lucide="play" style="width:13px; height:13px; margin-right:4px;"></i> Audio
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-sm" onclick="callLogs.viewTranscript(${log.id})" style="background:#F8FAFC; color:#334155; border:1px solid #CBD5E1; font-weight:800; border-radius:8px; padding:6px 10px; cursor:pointer;" title="Ver Diálogo">
              <i data-lucide="file-text" style="width:13px; height:13px; margin-right:4px;"></i> Diálogo
            </button>
            <button class="btn btn-secondary btn-sm" onclick="callLogs.openTakeoverModal(${log.id})" style="background:${log.status === 'Humano Activo' ? '#E0E7FF' : '#FFFBEB'}; color:${log.status === 'Humano Activo' ? '#4338CA' : '#B45309'}; border:1px solid ${log.status === 'Humano Activo' ? '#C7D2FE' : '#FDE68A'}; font-weight:800; border-radius:8px; padding:6px 10px; cursor:pointer;" title="Tomar Control">
              <i data-lucide="user-check" style="width:13px; height:13px; margin-right:4px;"></i> Intervenir
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    this.updateCountLabel(filteredLogs.length);

    // Refuerzo Silent Luxury de contraste
    if (window.mrsPetsArch && typeof window.mrsPetsArch.enforceUniversalContrastRule === 'function') {
      window.mrsPetsArch.enforceUniversalContrastRule();
    }
  }

  updateMetrics() {
    const totalLogs = this.logs.length;
    const telephonyLogs = this.logs.filter(l => l.type === 'telephony').length;
    const waLogs = this.logs.filter(l => l.type === 'whatsapp').length;
    const positiveLogs = this.logs.filter(l => l.sentiment === 'Positivo').length;
    const sentimentPct = totalLogs > 0 ? Math.round((positiveLogs / totalLogs) * 100) : 100;

    const elTotal = document.getElementById('call-logs-stat-total');
    if (elTotal) elTotal.innerText = totalLogs;

    const elTel = document.getElementById('call-logs-stat-telephony');
    if (elTel) elTel.innerText = telephonyLogs;

    const elWa = document.getElementById('call-logs-stat-wa');
    if (elWa) elWa.innerText = waLogs;

    const elSent = document.getElementById('call-logs-stat-sentiment');
    if (elSent) elSent.innerText = `${sentimentPct}%`;

    const badgeTotal = document.getElementById('badge-total-logs');
    if (badgeTotal) badgeTotal.innerText = totalLogs;
  }

  updateCountLabel(count) {
    const label = document.getElementById('call-logs-count-label');
    if (label) {
      label.innerText = `Mostrando ${count} de ${this.logs.length} interacciones auditadas`;
    }
  }

  addLog(newLog) {
    const createdLog = {
      id: Date.now(),
      date: 'Ahora mismo',
      type: newLog.type || 'telephony',
      contact: newLog.contact || 'Cliente Mrs. Pets Maracaibo',
      phone: newLog.phone || '+58 414-6799510',
      petName: newLog.petName || 'Paciente VIP',
      duration: newLog.duration || '01:00',
      sentiment: newLog.sentiment || 'Positivo',
      status: newLog.status || 'Completada',
      audioDuration: newLog.type === 'telephony' ? '01:00' : null,
      transcript: newLog.transcript || [
        { sender: 'user', time: 'Ahora', text: 'Interacción registrada en vivo.' },
        { sender: 'agent', time: 'Ahora', text: 'Atendido cordialmente por Leia Concierge de Mrs. Pets.' }
      ],
      ...newLog
    };

    this.logs.unshift(createdLog);
    this.render();
  }

  playAudio(logId) {
    const log = this.logs.find(l => l.id === logId);
    if (!log) return;

    // Sintetizar sonido suave con Web Audio API
    this.synthesizeSoftChime();

    // Abrir modal con reproductor de audio
    this.viewTranscript(logId, true);
    app.showToast(`Reproduciendo audio HD de la llamada #${logId} (${log.contact})...`, 'info');
  }

  synthesizeSoftChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio context silently handled
    }
  }

  viewTranscript(logId, autoPlay = false) {
    const log = this.logs.find(l => l.id === logId);
    if (!log) return;

    const modalTitle = document.getElementById('detail-modal-title');
    const modalSubtitle = document.getElementById('detail-modal-subtitle');
    const modalIcon = document.getElementById('detail-modal-icon');
    const audioPlayer = document.getElementById('detail-audio-player');
    const transcriptBody = document.getElementById('detail-transcript-body');
    const sentimentBadge = document.getElementById('detail-sentiment-badge');

    const isWa = log.type === 'whatsapp';

    if (modalTitle) modalTitle.textContent = `${log.contact} • ${isWa ? 'WhatsApp Chat' : 'Llamada Telefónica'}`;
    if (modalSubtitle) modalSubtitle.textContent = `Teléfono: ${log.phone || log.contact} | Mascota: ${log.petName || 'VIP'} | ${log.date}`;
    if (modalIcon) modalIcon.innerHTML = isWa ? '💬' : '🎙️';

    // Reproductor de audio
    if (audioPlayer) {
      if (!isWa) {
        audioPlayer.style.display = 'block';
        const timer = document.getElementById('detail-audio-timer');
        if (timer) timer.textContent = `00:00 / ${log.duration || '02:45'}`;
        const progress = document.getElementById('detail-audio-progress');
        if (progress) progress.style.width = '0%';
        if (autoPlay) {
          this.startAudioProgress(log.duration || '02:45');
        }
      } else {
        audioPlayer.style.display = 'none';
        this.stopAudioProgress();
      }
    }

    // Transcripción del diálogo
    if (transcriptBody) {
      transcriptBody.innerHTML = '';
      const transcriptList = log.transcript || [
        { sender: 'user', time: '00:01', text: 'Consulta recibida en Mrs. Pets.' },
        { sender: 'agent', time: '00:05', text: 'Respuesta brindada por Leia Concierge.' }
      ];

      transcriptList.forEach(item => {
        const isAgent = item.sender === 'agent';
        const bubble = document.createElement('div');
        bubble.style.display = 'flex';
        bubble.style.flexDirection = 'column';
        bubble.style.alignItems = isAgent ? 'flex-start' : 'flex-end';
        bubble.style.marginBottom = '6px';

        bubble.innerHTML = `
          <div style="font-size:0.72rem; color:#64748B; font-weight:700; margin-bottom:3px; display:flex; align-items:center; gap:6px;">
            <span>${isAgent ? '🎀 Leia Concierge (IA)' : '👤 ' + log.contact}</span>
            <span style="opacity:0.5;">•</span>
            <span>${item.time}</span>
          </div>
          <div style="background:${isAgent ? '#FFFFFF' : '#E0E7FF'}; color:#0F172A; border:1px solid ${isAgent ? '#E2E8F0' : '#C7D2FE'}; padding:10px 14px; border-radius:${isAgent ? '14px 14px 14px 2px' : '14px 14px 2px 14px'}; max-width:85%; font-size:0.85rem; font-weight:600; line-height:1.4; box-shadow:0 2px 6px rgba(0,0,0,0.03);">
            ${item.text}
          </div>
        `;
        transcriptBody.appendChild(bubble);
      });
    }

    if (sentimentBadge) {
      sentimentBadge.innerHTML = `
        <span style="font-size:0.8rem; font-weight:800; color:#475569;">
          Sentimiento Detectado: 
          <strong style="color:${log.sentiment === 'Positivo' ? '#047857' : (log.sentiment === 'Neutro' ? '#B45309' : '#DC2626')};">
            ${log.sentiment}
          </strong>
        </span>
      `;
    }

    app.openModal('call-log-detail-modal');
  }

  toggleAudioPlayback() {
    if (this.isPlayingAudio) {
      this.stopAudioProgress();
    } else {
      this.startAudioProgress('02:45');
    }
  }

  startAudioProgress(totalDuration) {
    this.stopAudioProgress();
    this.isPlayingAudio = true;
    const playBtn = document.getElementById('detail-audio-play-btn');
    if (playBtn) playBtn.textContent = '⏸';

    const progressBar = document.getElementById('detail-audio-progress');
    const timer = document.getElementById('detail-audio-timer');

    let currentSec = 0;
    const totalSec = 165; // ~2:45

    this.audioInterval = setInterval(() => {
      currentSec += 2;
      const pct = Math.min(100, Math.round((currentSec / totalSec) * 100));
      if (progressBar) progressBar.style.width = `${pct}%`;

      const m = Math.floor(currentSec / 60).toString().padStart(2, '0');
      const s = (currentSec % 60).toString().padStart(2, '0');
      if (timer) timer.textContent = `${m}:${s} / ${totalDuration}`;

      if (currentSec >= totalSec) {
        this.stopAudioProgress();
      }
    }, 400);
  }

  stopAudioProgress() {
    this.isPlayingAudio = false;
    if (this.audioInterval) {
      clearInterval(this.audioInterval);
      this.audioInterval = null;
    }
    const playBtn = document.getElementById('detail-audio-play-btn');
    if (playBtn) playBtn.textContent = '▶';
  }

  openTakeoverModal(logId) {
    this.activeTakeoverId = logId;
    const log = this.logs.find(l => l.id === logId);

    const metaBox = document.getElementById('takeover-target-meta');
    if (metaBox && log) {
      metaBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span>Cliente: <strong>${log.contact}</strong></span>
          <span>Canal: <strong>${log.type === 'whatsapp' ? '💬 WhatsApp' : '📞 Telefonía'}</strong></span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Mascota: <strong>${log.petName || 'Paciente VIP'}</strong></span>
          <span>Sentimiento: <strong>${log.sentiment}</strong></span>
        </div>
      `;
    }

    app.openModal('takeover-modal');
  }

  confirmTakeover() {
    const staffSelect = document.getElementById('takeover-staff-select');
    const staffName = staffSelect ? staffSelect.value : 'Staff Operativo';
    const reasonInput = document.getElementById('takeover-reason-input');
    const reasonText = reasonInput ? reasonInput.value.trim() : '';

    app.closeModal('takeover-modal');
    app.showToast(`Control manual tomado por ${staffName} para la interacción #${this.activeTakeoverId}. Leia Concierge pausada en este hilo.`, 'warning');

    // Actualizar estado del log
    const log = this.logs.find(l => l.id === this.activeTakeoverId);
    if (log) {
      log.status = 'Humano Activo';
      log.transcript.push({
        sender: 'agent',
        time: 'Ahora',
        text: `[CONTROL HUMANO TOMADO POR ${staffName.toUpperCase()}] ${reasonText ? 'Nota: ' + reasonText : ''}`
      });
      this.render();
    }
  }
}

const callLogs = new CallLogs();
document.addEventListener('DOMContentLoaded', () => callLogs.init());
