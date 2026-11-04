/* ==========================================================================
   WHATSAPP SIMULATOR ENGINE (Mrs Pets - Big & Little Dogs, C.A. • +58 414-6799510)
   ========================================================================== */

class WhatsAppSimulator {
  constructor() {
    this.messageHistory = [];
    this.isTyping = false;
    this.phoneNumber = '+58 414-6799510';
  }

  init() {
    const form = document.getElementById('wa-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('wa-input-text');
        const text = input.value.trim();
        if (text) {
          this.sendMessage(text);
          input.value = '';
        }
      });
    }
  }

  sendMessage(text) {
    const feed = document.getElementById('wa-chat-feed');
    if (!feed) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Render User Message
    const userBubble = document.createElement('div');
    userBubble.className = 'wa-bubble outgoing';
    userBubble.innerHTML = `
      ${text}
      <div class="wa-meta">${timeStr} <span class="wa-checks">✓✓</span></div>
    `;
    feed.appendChild(userBubble);
    feed.scrollTop = feed.scrollHeight;

    // Simulate Agent Typing
    this.showTyping(true);

    // AI Response Logic
    setTimeout(() => {
      this.showTyping(false);
      this.generateAgentResponse(text);
    }, 1200);
  }

  sendPreset(text) {
    this.sendMessage(text);
  }

  showTyping(show) {
    const statusText = document.getElementById('wa-status-text');
    const feed = document.getElementById('wa-chat-feed');

    if (show) {
      if (statusText) {
        statusText.innerText = 'escribiendo...';
        statusText.style.color = '#00a884';
      }

      if (feed) {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'wa-typing-indicator';
        typingDiv.id = 'wa-typing-dots';
        typingDiv.innerHTML = `
          <div class="wa-dot"></div>
          <div class="wa-dot"></div>
          <div class="wa-dot"></div>
        `;
        feed.appendChild(typingDiv);
        feed.scrollTop = feed.scrollHeight;
      }
    } else {
      if (statusText) {
        statusText.innerText = `${this.phoneNumber} • en línea`;
        statusText.style.color = 'var(--text-muted)';
      }
      const typingDiv = document.getElementById('wa-typing-dots');
      if (typingDiv && typingDiv.parentNode) {
        typingDiv.parentNode.removeChild(typingDiv);
      }
    }
  }

  generateAgentResponse(userText) {
    const feed = document.getElementById('wa-chat-feed');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let reply = "";

    const petStatusInfo = typeof petStatusEngine !== 'undefined' ? petStatusEngine.getPetStatusForAI(userText) : null;
    const orderStatusInfo = typeof storeEngine !== 'undefined' ? storeEngine.getOrderStatusForAI(userText) : null;

    if (orderStatusInfo) {
      reply = `🎀 *REPORTE DE PEDIDO POR LEIA CONCIERGE - MRS PETS*\n\n${orderStatusInfo}\n\n¡Cuidamos a tu amado príncipe o princesa con Lujo Silencioso!\nBig & Little Dogs, C.A. • RIF J-40120233-0`;
    } else if (petStatusInfo) {
      reply = `🎀 *ESTATUS DE TU PRÍNCIPE / PRINCESA - LEIA CONCIERGE*\n\n${petStatusInfo}\n\nTe notificaremos a este WhatsApp (+58 414-6799510) ante cualquier novedad. Recuerda que todos nuestros paquetes de estética estándar incluyen *hidratación de pulpejos* obligatoria ✨.`;
    } else {
      const lower = userText.toLowerCase();

      if (lower.includes('oneal') || lower.includes("o'neal")) {
        const patients = (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus)) ? window.adminEngine.patientsStatus : [];
        const misipetData = (window.misipetEngine && window.misipetEngine.overviewData) ? window.misipetEngine.overviewData : null;
        const sem = misipetData ? (misipetData.semaphore_counts || {}) : { yellow: 0, red: 0, green: 14 };
        reply = `📢 *O'NEAL (TEAMLY AI - TELEMERCADEO & OPERACIONES)*\n\n¡Hola! Conectado desde la sucursal Av. 2 El Milagro para tu reporte en calle:\n\n• 📅 *Reservaciones Activas Hoy:* ${patients.length} consentidos en circuito.\n• 🛠️ *Mantenimientos Pendientes:* ${sem.yellow || 0} preventivos, ${sem.red || 0} de atención inmediata.\n• 📢 *Campaña Activa:* Grooming VIP & Hidratación de Pulpejos (TikTok/Meta ROAS 4.2x).\n\n¿Deseas que revise una cita o actualice el centro MPF?`;
      } else if (lower.includes('vanessa')) {
        const apps = JSON.parse(localStorage.getItem('mrs_pets_hr_applications') || '[]');
        reply = `💼 *VANESSA (TEAMLY AI - RECURSOS HUMANOS)*\n\n¡Hola! Base de datos de talento humano sincronizada con la web:\n\n• 📄 *Total CVs Recibidos:* ${apps.length} postulaciones registradas.\n• 👥 *Candidatos en base:* ${apps.slice(0, 3).map(a => a.fullName).join(', ') || 'María Briceño (Estilista Canino)'}.\n\nListos para revisión de expedientes y programación de entrevistas.`;
      } else if (lower.includes('rif') || lower.includes('juridico') || lower.includes('razon') || lower.includes('empresa')) {
        reply = "📜 *INFORMACIÓN FISCAL & CORPORATIVA (MRS PETS MARACAIBO)*\n\n• Nombre Comercial: *Mrs. Pets*\n• Razón Social: *Big & Little Dogs, C.A.*\n• RIF Fiscal: *J-40120233-0*\n• Ubicación: *Avenida 2 El Milagro, Maracaibo, Venezuela*\n• Asistente Ejecutiva & Concierge VIP: *Leia 🎀*\n• Filosofía: *\"We see pets — donde recibimos mascotas y despedimos amigos\"*\n• WhatsApp Oficial: *+58 414-6799510*";
      } else if (lower.includes('chico') || lower.includes('nuevo') || lower.includes('registro') || lower.includes('biotracker')) {
        reply = "👑 *MODELO ÁGIL BioTracker GeoGuard (MRS PETS)*\n\nPara cuidar tu tiempo y privacidad, ¡no te pedimos direcciones exactas!\n\n1️⃣ Nombre y WhatsApp de contacto\n2️⃣ Nombre de tu príncipe o princesa (perrito o gatito)\n3️⃣ Sector de Maracaibo (ej. Las Delicias, El Milagro, Bella Vista, Tierra Negra, Indio Mara, La Lago)\n\n¡Ingreso inmediato a nuestra red preventiva de salud!";
      } else if (lower.includes('paso') || lower.includes('proceso') || lower.includes('grooming') || lower.includes('pulpejo')) {
        reply = "🎀 *Circuito Estético Spa para tu Príncipe o Princesa en Mrs. Pets:*\n\n1️⃣ Reservación\n2️⃣ Recibido por Leia (Asistente Ejecutiva & VIP)\n3️⃣ Revisión Dérmica (Vision AI)\n4️⃣ Baño Spa + *Hidratación de Pulpejos (Incorporada con orgullo)*\n5️⃣ Secado Táctil\n6️⃣ Grooming / Corte de Raza\n7️⃣ Listo ✨\n8️⃣ Entregado a Tutor 🚗\n\n⚠️ *Nota:* La atención presencial en sucursal finaliza estrictamente a las 6:00 p.m.";
      } else if (lower.includes('horario') || lower.includes('cita') || lower.includes('reserva') || lower.includes('donde')) {
        reply = "📍 *HORARIOS & ATENCIÓN - MRS. PETS (AV. 2 EL MILAGRO)*\n\n• Ubicación: Avenida 2 El Milagro, Maracaibo, Venezuela\n• WhatsApp: +58 414-6799510\n• Horario en Sucursal: Lunes a Sábado 8:00 AM - 6:00 PM (*Cierre Estricto 6:00 PM*)\n• Filosofía: *\"We see pets — donde recibimos mascotas y despedimos amigos\"*\n• Cuidado Exclusivo: Todos nuestros consentidos (*príncipes y princesas*) reciben hidratación de pulpejos obligatoria en sus servicios de grooming ✨.";
      } else {
        reply = "¡Hola! Soy *Leia 🎀*, Asistente Ejecutiva y Concierge VIP de *Mrs. Pets* (Big & Little Dogs, C.A., Avenida 2 El Milagro, Maracaibo).\n\nNuestra filosofía: *\"We see pets — donde recibimos mascotas y despedimos amigos\"*.\n\nPara brindarte la mejor atención a ti y a tu consentido: *¿Ya eres un chico Mrs. Pet o eres un cliente nuevo?*\n\nTe recuerdo que la atención presencial finaliza estrictamente a las 6:00 p.m. y que la *hidratación de pulpejos* viene incorporada en todo paquete de grooming ✨.";
      }
    }

    const agentBubble = document.createElement('div');
    agentBubble.className = 'wa-bubble incoming';
    agentBubble.innerHTML = `
      ${reply.replace(/\n/g, '<br>')}
      <div class="wa-meta">${timeStr}</div>
    `;
    feed.appendChild(agentBubble);
    feed.scrollTop = feed.scrollHeight;

    app.showToast('Nuevo mensaje de WhatsApp recibido (+58 414-6799510)', 'info');

    const statWa = document.getElementById('stat-wa');
    if (statWa) {
      const current = parseInt(statWa.innerText) || 389;
      statWa.innerText = current + 1;
    }

    // Registrar en Call Logs & Inbox Omnicanal
    if (window.callLogs && typeof window.callLogs.addLog === 'function') {
      window.callLogs.addLog({
        type: 'whatsapp',
        contact: 'Cliente WhatsApp (+58 414-6799510)',
        phone: '+58 414-6799510',
        petName: 'Consulta Live',
        duration: '2 msgs',
        sentiment: 'Positivo',
        status: 'En Curso',
        transcript: [
          { sender: 'user', time: timeStr, text: userText },
          { sender: 'agent', time: timeStr, text: reply }
        ]
      });
    }
  }
}

const whatsappSim = new WhatsAppSimulator();
document.addEventListener('DOMContentLoaded', () => whatsappSim.init());
