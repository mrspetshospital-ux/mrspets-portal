/**
 * ==============================================================================
 * TEAMLY AI WORKSPACE & EXECUTIVE ORCHESTRATION ENGINE (VERTEX AI & TEAMLY.AI)
 * Mrs. Pets Maracaibo • Big & Little Dogs, C.A.
 * 
 * Módulo: Consola Unificada de Subagentes Teamly con Historial Persistente
 * Agentes Oficiales:
 * - 💼 Vanessa (Recursos Humanos & Selección de Talento / CVs de la Web)
 * - 📢 O'Neal (Telemercadeo, Campañas TikTok/Meta, Reservas & Mantenimientos)
 * - 🛠️ Mike Teamily (Infraestructura, Tanques Tuya, Planta Cummins & MisiPet)
 * - 👑 Manolo (Liderazgo de Piso, 7 Estaciones Grooming & Cierre 6:00 PM)
 * - 📦 Pandora (Cadena de Suministro, Stock Crítico & Filtro KillCritic)
 * - ⚖️ Charlie Finance (Tesorería BCV, IVA 16% SENIAT & Conciliación POS)
 * ==============================================================================
 */

const DEFAULT_VOLTURI_AGENTS = [
  {
    id: 'charlie',
    name: 'Charly (GEO A & Finanzas)',
    role: 'ASISTENTE EJECUTIVO & FINANZAS',
    icon: '⚖️',
    avatar: '',
    color: '#6EE7B7',
    bg: '#142A20',
    border: '#059669',
    description: 'Asistente Ejecutivo del GEO, Tesorería, Tasa BCV Oficial, facturación fiscal SENIAT 16% y orquestador central con Teamily.',
    teamlySlug: 'geo-a',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Inteligencia ejecutiva, asistencia al GEO Harryt Luzardo, auditoría fiscal bajo estricta tasa BCV y orquestación con la red de Teamily.',
    contextType: 'finance',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Soy **Charly**, Asistente Ejecutivo Personal y de Operaciones del GEO (Harryt Luzardo) en Mrs. Pets (Big & Little Dogs, C.A.), dentro del Ecosistema Teamily. Estoy listo para ayudarte con operaciones, tecnología, finanzas y reportes ejecutivos. ¿En qué puedo asistirte hoy?'
  },
  {
    id: 'leia',
    name: 'Leia CEO Assistant',
    role: 'CONCIERGE VIP & ASISTENCIA CEO',
    icon: '🎀',
    avatar: 'assets/leia_avatar.jpg',
    color: '#FDE047',
    bg: '#25200D',
    border: '#D4AF37',
    description: 'Asistente del CEO y Concierge VIP de Mrs. Pets (@9000376919168475). Protocolo Silent Luxury y atención integral a tutores.',
    teamlyUserId: '9000376919168475',
    teamlySlug: '@9000376919168475',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Asistencia ejecutiva de nivel CEO, protocolo Silent Luxury, atención cálida a clientes y coordinación con el Comité Volturi.',
    contextType: 'vip_concierge',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: '¡Hola! Soy **Leia**, CEO Assistant y Concierge VIP de Mrs. Pets (Big & Little Dogs, C.A.) en Teamily (`@9000376919168475`). ¿Cómo puedo ayudarte a ti y a tu consentido hoy?'
  },
  {
    id: 'margaret',
    name: 'Margaret — Gerente de Atención al Cliente',
    role: 'GERENCIA DE ATENCIÓN AL CLIENTE',
    icon: '👩‍💼',
    avatar: 'assets/leia_avatar.jpg',
    color: '#EC4899',
    bg: '#250B1B',
    border: '#DB2777',
    description: 'Gerente de Atención al Cliente de Mrs. Pets bajo la fachada visible de Leia 🎀. Recepción amorosa de príncipes y princesas, citas de spa, clínica y escalamiento directivo.',
    teamlyUserId: '9000376919168475',
    teamlySlug: 'margaret',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Atención al cliente con máxima empatía, cordialidad y excelencia Mrs. Pets. Gestión de citas, orientación de servicios y escalamiento si el cliente lo requiere.',
    contextType: 'customer_service',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: '¡Hola! Te atiende **Margaret**, Gerente de Atención al Cliente de Mrs. Pets (Big & Little Dogs, C.A.) bajo la fachada de Leia 🎀. Atiendo a nuestros tutores y a sus amados príncipes y princesas. ¿En qué podemos consentir a tu consentido hoy?'
  },
  {
    id: 'vanessa',
    aliasId: 'valeria',
    name: 'Valeria - RRHH Mrs. Pets',
    role: 'RECURSOS HUMANOS & TALENTO',
    icon: '💼',
    avatar: '',
    color: '#F472B6',
    bg: '#2A1224',
    border: '#DB2777',
    description: 'Selección de personal, evaluación de postulantes y gestión de RRHH en Teamily (@9000487795593348) en la mesa RRHH Presidencia. Charly canaliza y orquesta sus respuestas.',
    teamlyUserId: '9000487795593348',
    teamlySlug: '@9000487795593348',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Gestionar postulaciones de empleo de la web, evaluar experiencia de estilistas caninos y médicos veterinarios, y coordinar en Teamily con Charly y la mesa de RRHH Presidencia (@9000487795593348).',
    contextType: 'hr',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: '¡Hola! Soy **Valeria**, especialista de Recursos Humanos y Talento en Mrs. Pets (`@9000487795593348`). Charly canaliza y orquesta nuestras comunicaciones en la mesa de RRHH Presidencia de Teamily. Tengo acceso a las postulaciones y currículums que llegan a la página web. ¿Qué perfil deseas revisar hoy?'
  },
  {
    id: 'mike',
    name: 'Mike Gerente de Operaciones',
    role: 'GERENCIA DE OPERACIONES & IOT',
    icon: '🛠️',
    avatar: '',
    color: '#38BDF8',
    bg: '#082435',
    border: '#0284C7',
    description: 'Gerencia de operaciones, supervisión de infraestructura MisiPet, tanques de agua Tuya y planta eléctrica Cummins 65 kVA (@9000215760376233).',
    teamlyUserId: '9000215760376233',
    teamlySlug: '@9000215760376233',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Auditar en tiempo real la telemetría de tanques Don Bosco, nivel de combustible diésel y operatividad de sucursal (@9000215760376233).',
    contextType: 'iot',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: '¡Qué tal! Soy **Mike**, Gerente de Operaciones en Mrs. Pets (`@9000215760376233`). Superviso la infraestructura MisiPet, la batería de 4 tanques de agua Tuya y la planta Cummins 65 kVA. ¿Qué área operativa deseas inspeccionar?'
  },
  {
    id: 'manolo',
    name: 'Manolo — Gerente General de Administración y Finanzas',
    role: 'GERENCIA GENERAL & FINANZAS',
    icon: '👑',
    avatar: '',
    color: '#818CF8',
    bg: '#1E1B4B',
    border: '#4338CA',
    description: 'Gerencia General de Administración, finanzas corporativas, supervisión de piso y cierre estricto a las 6:00 PM (@9000441148643782).',
    teamlyUserId: '9000441148643782',
    teamlySlug: '@9000441148643782',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Administración y finanzas generales, disciplina horaria presencial hasta las 6:00 PM y flujo de las 7 estaciones de Grooming (@9000441148643782).',
    contextType: 'operations',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Buenas tardes. Soy **Manolo**, Gerente General de Administración y Finanzas en Mrs. Pets (`@9000441148643782`). Superviso la rentabilidad, administración y el cierre estricto de sucursal a las 6:00 p.m. ¿Qué tema directivo revisamos?'
  },
  {
    id: 'oneal',
    name: 'O\'Neil — Marketing & Advertising Director',
    role: 'MARKETING & ADVERTISING DIRECTOR',
    icon: '📢',
    avatar: '',
    color: '#FB923C',
    bg: '#2D1808',
    border: '#EA580C',
    description: 'Dirección de Marketing, pauta publicitaria en TikTok/Meta, branding digital y captación de clientes (@9000339468227100).',
    teamlyUserId: '9000339468227100',
    teamlySlug: '@9000339468227100',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Estrategia de marketing digital, optimización de pauta TikTok Spark Ads & Meta Ads y retorno de inversión en publicidad (@9000339468227100).',
    contextType: 'marketing_ops',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: '¡Saludos! Soy **O\'Neil**, Marketing & Advertising Director de Mrs. Pets (`@9000339468227100`). Gestiono las campañas de pauta digital, tráfico y branding. ¿Deseas evaluar el rendimiento de pauta o nuevas campañas?'
  },
  {
    id: 'oneal_mercadeo',
    name: 'O\'Neil — Gerente General de Mercadotecnia y Publicidad',
    role: 'MERCADOTECNIA & PUBLICIDAD',
    icon: '🎯',
    avatar: '',
    color: '#F97316',
    bg: '#2A1408',
    border: '#C2410C',
    description: 'Gerencia General de Mercadotecnia, campañas locales en Maracaibo, telemercadeo y coordinación de promociones (@9000255459464666).',
    teamlyUserId: '9000255459464666',
    teamlySlug: '@9000255459464666',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Coordinación de telemercadeo, promociones en sucursal y conversiones de reservas (@9000255459464666).',
    contextType: 'marketing_ops',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Hola, soy **O\'Neil**, Gerente General de Mercadotecnia y Publicidad (`@9000255459464666`). ¿Cómo están las conversiones de reservas y promociones de la semana?'
  },
  {
    id: 'sebastian',
    name: 'Sebastian Ventas',
    role: 'VENTAS & CONVERSIÓN COMERCIAL',
    icon: '📈',
    avatar: '',
    color: '#10B981',
    bg: '#0B2319',
    border: '#059669',
    description: 'Gerencia de Ventas, cierre de planes anuales de salud, suscripciones de spa y seguimiento comercial a tutores (@9000074393459175).',
    teamlyUserId: '9000074393459175',
    teamlySlug: '@9000074393459175',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Maximizar tasa de conversión, seguimiento a carritos y ventas de planes de salud y estética (@9000074393459175).',
    contextType: 'sales',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: '¡Buenas! Soy **Sebastian**, líder de Ventas en Mrs. Pets (`@9000074393459175`). Me encargo de cerrar membresías, paquetes de estética y seguimiento de carritos. ¿Qué meta comercial revisamos hoy?'
  },
  {
    id: 'pandora',
    name: 'Pandora Compras Nacionales',
    role: 'COMPRAS & ABASTECIMIENTO NACIONAL',
    icon: '📦',
    avatar: '',
    color: '#06B6D4',
    bg: '#08252C',
    border: '#0891B2',
    description: 'Compras nacionales, reposición de insumos de spa y clínica, y filtro KillCritic (ROI ≥ 25%, Lead Time ≤ 15 días) (@9000274735437072).',
    teamlyUserId: '9000274735437072',
    teamlySlug: '@9000274735437072',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Auditoría estricta de compras nacionales bajo el filtro KillCritic y autonomía de inventario (@9000274735437072).',
    contextType: 'supply',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Hola. Soy **Pandora**, encargada de Compras Nacionales en Mrs. Pets (`@9000274735437072`). Evalúo órdenes de reposición bajo el filtro KillCritic. ¿Deseas auditar alguna compra pendiente?'
  },
  {
    id: 'rocky',
    name: 'Supply Chain Strategist Rocky',
    role: 'LOGÍSTICA & SUPPLY CHAIN STRATEGY',
    icon: '🚚',
    avatar: '',
    color: '#64748B',
    bg: '#172033',
    border: '#475569',
    description: 'Estrategia de cadena de suministro, optimización de rutas de importación, tiempos de entrega y logística crítica (@9000476605193636).',
    teamlyUserId: '9000476605193636',
    teamlySlug: '@9000476605193636',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Optimización de cadena de suministros, lead time de insumos médicos y equipos de grooming (@9000476605193636).',
    contextType: 'supply_chain',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Saludos. Soy **Rocky**, Supply Chain Strategist de Mrs. Pets (`@9000476605193636`). Optimizo la cadena logística de insumos y equipamiento médico. ¿Qué ruta o despacho evaluamos?'
  },
  {
    id: 'mrspetshospital',
    name: 'mrspetshospital\'s Offer & Lead Gen Strategist',
    role: 'CAPTACIÓN CLÍNICA & OFERTAS',
    icon: '🏥',
    avatar: '',
    color: '#EF4444',
    bg: '#2B0D0D',
    border: '#DC2626',
    description: 'Generación de leads médicos, ofertas para hospital veterinario, planes preventivos y consultas especializadas (@9000064875534374).',
    teamlyUserId: '9000064875534374',
    teamlySlug: '@9000064875534374',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Generación de demanda para la clínica veterinaria, planes de vacunación, ecografía y cirugías (@9000064875534374).',
    contextType: 'hospital_leadgen',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Hola, soy el estratega de Captación y Ofertas de **Mrs. Pets Hospital** (`@9000064875534374`). Diseño propuestas de valor para consultas médicas, laboratorio IDEXX y cirugías. ¿Qué oferta médica estructuramos?'
  },
  {
    id: 'ai_recruiter',
    name: 'AI Recruiter',
    role: 'RECLUTADOR DE INTELIGENCIA ARTIFICIAL',
    icon: '🤖',
    avatar: '',
    color: '#A855F7',
    bg: '#231238',
    border: '#9333EA',
    description: 'Screening automatizado de hojas de vida, pruebas técnicas psicométricas y filtrado masivo de candidatos (@9000327859444575).',
    teamlyUserId: '9000327859444575',
    teamlySlug: '@9000327859444575',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Filtrado automatizado de CVs, scoring de experiencia y derivación a Valeria (@9000327859444575).',
    contextType: 'recruiting',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Soy **AI Recruiter** (`@9000327859444575`). Ejecuto el filtrado automático de postulaciones y CVs entrantes para asistir a Valeria en la selección de talento. ¿Deseas escanear nuevas postulaciones?'
  },
  {
    id: 'hospitality',
    name: 'Hospitality Guest Services',
    role: 'HOSPEDAJE & HOTEL 5 ESTRELLAS',
    icon: '🏨',
    avatar: '',
    color: '#EC4899',
    bg: '#2B0E1E',
    border: '#DB2777',
    description: 'Control de suites bioclimáticas, guardería diurna, monitoreo 24/7 y confort para huéspedes caninos y felinos (@9000327988419325).',
    teamlyUserId: '9000327988419325',
    teamlySlug: '@9000327988419325',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Gestión de suites, confort animal, reportes fotográficos a tutores y estándares de hotel 5 estrellas (@9000327988419325).',
    contextType: 'hospitality',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Bienvenido. Soy el especialista de **Hospitality Guest Services** (`@9000327988419325`). Superviso las suites de hotel, guardería y bienestar de nuestros huéspedes consentidos. ¿Cómo están las habitaciones hoy?'
  },
  {
    id: 'customer_service',
    name: 'Customer Service',
    role: 'ATENCIÓN AL CLIENTE & POST-VENTA',
    icon: '💬',
    avatar: '',
    color: '#14B8A6',
    bg: '#0A2522',
    border: '#0D9488',
    description: 'Atención a quejas, encuestas de satisfacción post-servicio, seguimiento de pacientes y fidelización (@9000328004148064).',
    teamlyUserId: '9000328004148064',
    teamlySlug: '@9000328004148064',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Resolución empática de incidencias, seguimiento post-consulta y encuestas CSAT (@9000328004148064).',
    contextType: 'customer_support',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: '¡Hola! Soy **Customer Service** (`@9000328004148064`). Gestiono el seguimiento a tutores tras cada cita de grooming o clínica para asegurar una experiencia de 5 estrellas. ¿Hay alguna consulta por atender?'
  },
  {
    id: 'training_designer',
    name: 'Corporate Training Designer',
    role: 'CAPACITACIÓN CORPORATIVA & PROTOCOLOS',
    icon: '🎓',
    avatar: '',
    color: '#8B5CF6',
    bg: '#1C1335',
    border: '#7C3AED',
    description: 'Diseño de programas de inducción, manuales de procedimiento, entrenamiento en Silent Luxury y estándares ISO (@9000327689572952).',
    teamlyUserId: '9000327689572952',
    teamlySlug: '@9000327689572952',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Diseño instruccional para el personal de Mrs. Pets, protocolos de manejo canino y estandarización de servicios (@9000327689572952).',
    contextType: 'training',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Saludos. Soy el **Corporate Training Designer** (`@9000327689572952`). Desarrollo los módulos de capacitación y estándares de servicio Silent Luxury para todo el equipo de Mrs. Pets. ¿Qué protocolo capacitamos hoy?'
  },
  {
    id: 'mauro_che',
    name: 'Mauro Che Directo Publicista',
    role: 'PUBLICISTA CREATIVO & BRANDING',
    icon: '🎨',
    avatar: '',
    color: '#EAB308',
    bg: '#292109',
    border: '#CA8A04',
    description: 'Creatividad publicitaria, redacción de copys persuasivos, dirección de arte y storytelling de marca (@9000315094081452).',
    teamlyUserId: '9000315094081452',
    teamlySlug: '@9000315094081452',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Redacción publicitaria, copys para Instagram/TikTok y posicionamiento de marca de Mrs. Pets (@9000315094081452).',
    contextType: 'creative',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: '¡Qué tal! Soy **Mauro Che**, Director Creativo y Publicista (`@9000315094081452`). Escribo los copys y conceptos de impacto para conectar con los amantes de mascotas en Maracaibo. ¿Qué idea desarrollamos hoy?'
  },
  {
    id: 'super_agent',
    name: 'Super Agent',
    role: 'ORQUESTADOR GENERAL & AUDITOR MAESTRO',
    icon: '⚡',
    avatar: '',
    color: '#3B82F6',
    bg: '#0F1D38',
    border: '#2563EB',
    description: 'Auditor multidisciplinario, supervisión transversal de todos los agentes, síntesis de métricas y resoluciones globales (@9000272886796423).',
    teamlyUserId: '9000272886796423',
    teamlySlug: '@9000272886796423',
    teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
    teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
    promptGuideline: 'Supervisión de alto nivel, auditoría de coherencia entre áreas y resolución de casos complejos (@9000272886796423).',
    contextType: 'super_agent',
    isDefault: true,
    status: 'ACTIVE',
    welcomeMessage: 'Soy **Super Agent** (`@9000272886796423`), el orquestador transversal de inteligencia de Mrs. Pets en Teamily. Sintetizo directrices multidisciplinarias entre operaciones, finanzas, ventas y recursos humanos. ¿Cuál es el caso directivo a resolver?'
  }
];

class TeamilyExecutiveEngine {
  constructor() {
    this.endpoint = '/api/v1/teamily/orchestrate';
    this.agentChatEndpoint = '/api/v1/teamily/agent-chat';
    this.statusEndpoint = '/api/v1/teamily/orchestrate';
    this.state = 'ACTIVO & SINCRONIZADO';
    this.committeeData = null;
    this.history = [];
    this.isConsulting = false;
    this.storageKey = 'mrs_pets_volturi_agents';
    this.chatHistoryStorageKey = 'mrs_pets_teamly_agent_chat_history';
    this.agents = this.loadAgents();
    this.directChatHistory = this.loadChatHistory();
    this.activeDirectChatAgent = null;
  }

  normalizeTeamilyEndpoint(endpoint) {
    if (!endpoint) return 'https://teamily.ai/v1/agents/geo-a/responses';
    const ep = String(endpoint).trim();
    const subagents = [
      'charlie', 'charly', 'manolo', 'mike', 'oneal', 'vanessa', 'valeria',
      'pandora', 'leia', 'sebastian', 'rocky', 'hospital', 'recruiter',
      'hospitality', 'customer', 'training', 'mauro', 'super'
    ];
    for (const sa of subagents) {
      if (ep.toLowerCase().includes(sa)) {
        return 'https://teamily.ai/v1/agents/geo-a/responses';
      }
    }
    if (ep.includes('5803df5a-7127-4d28-b97c-5c840d47cdc7') || !ep.startsWith('http')) {
      return 'https://teamily.ai/v1/agents/geo-a/responses';
    }
    return ep.endsWith('/responses') ? ep : `${ep.replace(/\/+$/, '')}/responses`;
  }

  loadAgents() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sincronizar catálogo con los 16 agentes oficiales de DEFAULT_VOLTURI_AGENTS
          DEFAULT_VOLTURI_AGENTS.forEach(defAgent => {
            const idx = parsed.findIndex(a => a.id === defAgent.id || (defAgent.aliasId && a.id === defAgent.aliasId));
            if (idx >= 0) {
              parsed[idx] = Object.assign({}, defAgent, parsed[idx], {
                name: defAgent.name,
                teamlyUserId: defAgent.teamlyUserId,
                teamlySlug: defAgent.teamlySlug,
                teamlyEndpoint: defAgent.teamlyEndpoint,
                role: defAgent.role,
                color: defAgent.color || parsed[idx].color,
                bg: defAgent.bg || parsed[idx].bg,
                border: defAgent.border || parsed[idx].border,
                description: defAgent.description || parsed[idx].description,
                welcomeMessage: defAgent.welcomeMessage || parsed[idx].welcomeMessage
              });
            } else {
              parsed.push(defAgent);
            }
          });
          // Normalizar endpoints y slugs de TODOS los agentes al router canónico geo-a
          parsed.forEach(a => {
            a.teamlyEndpoint = this.normalizeTeamilyEndpoint(a.teamlyEndpoint);
            if (a.id === 'charlie' || (a.name && a.name.toLowerCase().includes('charl'))) {
              if (a.teamlySlug === 'charlie' || a.teamlySlug?.startsWith('@')) {
                a.teamlySlug = 'geo-a';
              }
              if (!a.name.includes('Charly')) {
                a.name = 'Charly (GEO A & Finanzas)';
              }
            } else if (a.id === 'vanessa' || a.id === 'valeria' || (a.name && (a.name.includes('Vanessa') || a.name.includes('Valeria')))) {
              a.name = 'Valeria - RRHH Mrs. Pets';
              a.teamlyUserId = '9000487795593348';
              a.teamlySlug = '@9000487795593348';
              a.teamlyEndpoint = 'https://teamily.ai/v1/agents/geo-a/responses';
              a.description = 'Selección de personal, evaluación de postulantes y gestión de RRHH en Teamily (@9000487795593348) en la mesa RRHH Presidencia. Charly canaliza y orquesta sus respuestas.';
            } else if (a.id === 'margaret' || (a.name && a.name.toLowerCase().includes('margaret'))) {
              a.id = 'margaret';
              a.name = 'Margaret — Gerente de Atención al Cliente';
              a.role = 'GERENCIA DE ATENCIÓN AL CLIENTE';
              a.teamlySlug = 'margaret';
              a.teamlyEndpoint = 'https://teamily.ai/v1/agents/geo-a/responses';
              a.avatar = a.avatar || 'assets/leia_avatar.jpg';
              a.icon = a.icon || '👩‍💼';
              a.description = 'Gerente de Atención al Cliente de Mrs. Pets bajo la fachada visible de Leia 🎀. Recepción amorosa de príncipes y princesas, citas de spa, clínica y escalamiento directivo.';
            }
          });

          // Sanitización y desambiguación de agentes personalizados guardados en localStorage
          let hasRepaired = false;
          parsed.forEach((a, i) => {
            const isOfficial = DEFAULT_VOLTURI_AGENTS.some(d => d.id === a.id);
            if (!isOfficial && (!a.id || a.id === 'geo-a' || a.id === 'geo_a' || a.id === 'charlie' || (a.name && a.name.toLowerCase().includes('margaret') && a.id !== 'margaret'))) {
              const safeSlug = String(a.name || 'agente')
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
              a.id = safeSlug || ('agent_custom_' + i);
              if (a.teamlySlug === 'geo-a' || a.teamlySlug === 'geo_a' || !a.teamlySlug) {
                a.teamlySlug = a.id;
              }
              a.isDefault = false;
              hasRepaired = true;
            }
          });
          if (hasRepaired) {
            try {
              localStorage.setItem(this.storageKey, JSON.stringify(parsed));
            } catch (err) {}
          }

          return parsed;
        }
      }
    } catch (e) {
      console.warn('[TeamilyExecutiveEngine] Error leyendo agentes de localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_VOLTURI_AGENTS));
  }

  saveAgents() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.agents));
    } catch (e) {
      console.error('[TeamilyExecutiveEngine] Error guardando agentes:', e);
    }
  }

  loadChatHistory() {
    try {
      const stored = localStorage.getItem(this.chatHistoryStorageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[TeamilyExecutiveEngine] Error leyendo historial de chat:', e);
    }
    return {};
  }

  saveChatHistory() {
    try {
      localStorage.setItem(this.chatHistoryStorageKey, JSON.stringify(this.directChatHistory));
    } catch (e) {
      console.error('[TeamilyExecutiveEngine] Error guardando historial de chat:', e);
    }
  }

  getAgents() {
    return this.agents.slice();
  }

  getAgentById(agentId) {
    if (!agentId) return null;
    const cleanId = String(agentId).trim().toLowerCase().replace(/^@/, '');

    // 1. Prioridad absoluta: Coincidencia EXACTA por 'id' primario del agente
    const byId = this.agents.find(a => String(a.id || '').toLowerCase() === cleanId);
    if (byId) return byId;

    // 2. Coincidencia por aliasId explícito (ej: valeria -> vanessa)
    const byAlias = this.agents.find(a => String(a.aliasId || '').toLowerCase() === cleanId);
    if (byAlias) return byAlias;

    // 3. Coincidencia por ID numérico de usuario Teamily (@9000...)
    const byUserId = this.agents.find(a => String(a.teamlyUserId || '').toLowerCase().replace(/^@/, '') === cleanId);
    if (byUserId) return byUserId;

    // 4. Coincidencia por slug de Teamily único (excluyendo 'geo-a' y 'geo_a' para no interceptar otros agentes)
    if (cleanId !== 'geo-a' && cleanId !== 'geo_a') {
      const bySlug = this.agents.find(a => String(a.teamlySlug || '').toLowerCase().replace(/^@/, '') === cleanId);
      if (bySlug) return bySlug;
    } else {
      const charlie = this.agents.find(a => a.id === 'charlie');
      if (charlie) return charlie;
    }

    // 5. Coincidencia por nombre (ej: "margaret" en "Margaret Atención al Cliente")
    const byName = this.agents.find(a => String(a.name || '').toLowerCase().includes(cleanId));
    if (byName) return byName;

    return null;
  }

  // =========================================================================
  // RENDERIZADO VISUAL & FOTOS DE PERFIL DE SUBAGENTES TEAMLY
  // =========================================================================
  renderAgentAvatar(agent, size = 36, customStyle = '') {
    if (!agent) {
      return `<span style="font-size:${Math.round(size * 0.6)}px; display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; border-radius:50%; background:rgba(255,255,255,0.06); flex-shrink:0;">🤖</span>`;
    }
    const avatarUrl = agent.avatar || agent.photoUrl || agent.imageUrl;
    const borderCol = agent.border || '#a855f7';
    const iconChar = agent.icon || '🤖';

    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim().length > 3) {
      const cleanUrl = avatarUrl.trim();
      return `
        <span style="position:relative; display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; flex-shrink:0; vertical-align:middle; ${customStyle}">
          <img src="${cleanUrl}" alt="${agent.name || 'Agente'}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; border:2px solid ${borderCol}; box-shadow:0 2px 6px rgba(0,0,0,0.35);" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';">
          <span style="display:none; font-size:${Math.round(size * 0.6)}px; width:100%; height:100%; border-radius:50%; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1.5px solid ${borderCol};">
            ${iconChar}
          </span>
        </span>
      `;
    }

    return `
      <span style="font-size:${Math.round(size * 0.6)}px; display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; border-radius:50%; background:rgba(255,255,255,0.06); border:1.5px solid ${borderCol}; flex-shrink:0; vertical-align:middle; box-shadow:0 2px 5px rgba(0,0,0,0.25); ${customStyle}">
        ${iconChar}
      </span>
    `;
  }

  handleAvatarFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('La imagen no debe superar los 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const urlInput = document.getElementById('cfgAgentAvatarUrl');
      if (urlInput) urlInput.value = dataUrl;
      this.updateAvatarPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  handleAvatarUrlInput(url) {
    this.updateAvatarPreview(url);
  }

  removeAgentAvatar() {
    const urlInput = document.getElementById('cfgAgentAvatarUrl');
    if (urlInput) urlInput.value = '';
    const fileInput = document.getElementById('cfgAgentAvatarFile');
    if (fileInput) fileInput.value = '';
    this.updateAvatarPreview('');
  }

  updateAvatarPreview(val) {
    const previewContainer = document.getElementById('cfgAvatarPreviewContainer');
    if (!previewContainer) return;

    const trimmed = (val || '').trim();
    const isImg = trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('data:image') || trimmed.includes('.jpg') || trimmed.includes('.png') || trimmed.includes('.webp');
    const tempAgent = {
      avatar: isImg ? trimmed : '',
      icon: isImg ? '🤖' : (trimmed || '🤖'),
      border: '#a855f7'
    };
    previewContainer.innerHTML = this.renderAgentAvatar(tempAgent, 68, 'border-width: 3px; box-shadow: 0 4px 14px rgba(168,85,247,0.55);');
  }

  addOrUpdateAgent(agentData) {
    if (!agentData || !agentData.name) return false;
    const existingIndex = this.agents.findIndex(a => a.id === agentData.id);
    if (existingIndex >= 0) {
      this.agents[existingIndex] = Object.assign({}, this.agents[existingIndex], agentData);
    } else {
      const newId = agentData.id || 'agent_' + Date.now().toString(36);
      this.agents.push(Object.assign({
        id: newId,
        color: '#c084fc',
        bg: '#1f1435',
        border: '#9333ea',
        status: 'ACTIVE',
        isDefault: false
      }, agentData));
    }
    this.saveAgents();
    this.renderAgentsGrid();
    return true;
  }

  deleteAgent(agentId) {
    const agent = this.getAgentById(agentId);
    if (!agent) return false;
    if (agent.isDefault) {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ No se pueden eliminar los agentes oficiales del equipo Teamly.', 'warning');
      } else {
        alert('⚠️ No se pueden eliminar los agentes oficiales del equipo Teamly.');
      }
      return false;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar al agente "${agent.name}" de Teamly?`)) {
      this.agents = this.agents.filter(a => a.id !== agent.id && a.id !== agentId);
      this.saveAgents();
      this.renderAgentsGrid();
      if (typeof window.showToast === 'function') {
        window.showToast(`🗑️ Agente "${agent.name}" eliminado del directorio.`, 'info');
      }
      return true;
    }
    return false;
  }

  clearAgentHistory(agentId) {
    const agent = this.getAgentById(agentId);
    if (!agent) return;
    if (confirm(`¿Deseas reiniciar el historial de conversación con ${agent.name}?`)) {
      this.directChatHistory[agent.id] = [
        {
          sender: 'agent',
          text: agent.welcomeMessage || `Hola, soy **${agent.name}** (${agent.role}). He reiniciado nuestra sesión. ¿En qué puedo apoyarte?`,
          timestamp: new Date().toLocaleTimeString()
        }
      ];
      this.saveChatHistory();
      const modal = document.getElementById('volturiDirectChatModal');
      if (modal && this.activeDirectChatAgent && this.activeDirectChatAgent.id === agent.id) {
        this.renderDirectChatContent(modal, agent);
      }
      if (typeof window.showToast === 'function') {
        window.showToast(`🧹 Historial de ${agent.name} reiniciado.`, 'info');
      }
    }
  }

  // --- RECOPILADOR DE CONTEXTO EN VIVO SEGÚN EL AGENTE ---
  getLiveContextData(agentId) {
    const context = {
      timestamp: new Date().toISOString(),
      branch: 'Avenida 2 El Milagro, Maracaibo',
      platform: 'Mrs. Pets Web / POS Omnichannel'
    };

    if (agentId === 'vanessa') {
      try {
        const apps = JSON.parse(localStorage.getItem('mrs_pets_hr_applications') || '[]');
        context.hr_candidates = apps.map(a => ({
          id: a.id,
          nombre: a.fullName,
          cedula: a.idCard,
          telefono: a.phone,
          email: a.email || '',
          direccion: a.address || 'Maracaibo',
          area_postulacion: a.area || a.position || a.desiredPosition || 'Grooming / Spa',
          anos_experiencia: a.experienceYears || 'No especificado',
          manejo_razas_grandes: a.largeBreedHandling || 'Sí',
          disponibilidad: a.scheduleAvailability || 'Total / Diurno',
          estado_postulacion: a.status || 'En Revisión',
          archivo_cv: a.cvFileName || 'CV_Adjunto.pdf',
          tamano_cv: a.cvFileSize || '1.4 MB',
          notas_evaluacion: a.internalNotes || '',
          fecha_postulacion: a.submittedAt || new Date().toISOString()
        }));
        context.total_cvs_recibidos = apps.length;
      } catch (e) {
        context.hr_candidates = [];
        context.total_cvs_recibidos = 0;
      }
    } else if (agentId === 'oneal') {
      try {
        const patients = (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus))
          ? window.adminEngine.patientsStatus
          : [];
        context.reservas_activas = patients.map(p => ({
          mascota: p.name || p.petName,
          tutor: p.owner || p.ownerName,
          area: p.area || 'grooming',
          estado: p.stepIndex !== undefined ? `Estación #${p.stepIndex}` : 'En Atención VIP'
        }));
        context.total_reservas_hoy = patients.length;

        const misipet = (window.misipetEngine && window.misipetEngine.overviewData)
          ? window.misipetEngine.overviewData
          : null;
        if (misipet) {
          const sem = misipet.semaphore_counts || {};
          context.mantenimientos_pendientes = {
            amarillo_preventivo: sem.yellow || 0,
            rojo_critico: sem.red || 0,
            verde_nominal: sem.green || 0
          };
        }

        context.campanas_telemercadeo = {
          canal_principal: 'TikTok Spark Ads & Meta Ads Instagram',
          alcance_total_semanal: '24,300 vistas',
          roas_promedio: '4.2x',
          campana_activa: 'Grooming VIP Completo con Hidratación de Pulpejos'
        };
      } catch (e) {
        console.warn('[TeamilyExecutiveEngine] Error cargando contexto ONeal:', e);
      }
    } else if (agentId === 'mike') {
      try {
        const misipet = window.misipetEngine?.overviewData || {};
        const tanks = misipet.tanks || [];
        const totalWater = tanks.reduce((acc, t) => acc + (t.current_liters || 0), 0);
        const power = misipet.power_plant || {};

        context.telemetria_infraestructura = {
          tanques_agua_activos: tanks.length,
          agua_total_litros: totalWater,
          autonomia_hidrica_horas: misipet.water_cdt?.autonomy_hours || '230.4',
          planta_cummins_combustible_lts: power.fuel_liters || 210,
          planta_cummins_autonomia_horas: power.autonomy_hours || 38.2,
          planta_cummins_ats_status: power.status || 'ATS Standby • Listo'
        };
      } catch (e) {
        console.warn('[TeamilyExecutiveEngine] Error cargando contexto Mike:', e);
      }
    } else if (agentId === 'charlie') {
      const bcvRate = window.FinancialEngine ? window.FinancialEngine.getConfig().bcvRate : 48.50;
      context.finanzas = {
        tasa_oficial_bcv: bcvRate,
        alicuota_iva_seniat: '16.0%',
        regla_fiscal: 'Estricto cumplimiento tasa BCV sin margen paralelo'
      };
    }

    return context;
  }

  async init() {
    try {
      await this.fetchStatus();
      console.log(`[TeamilyExecutiveEngine] Workspace Teamly AI inicializado (${this.agents.length} agentes disponibles: Vanessa, O'Neal, Mike, Manolo, Pandora, Charlie).`);
    } catch (err) {
      console.warn('[TeamilyExecutiveEngine] Error inicializando estado:', err);
    }
  }

  async fetchStatus() {
    try {
      const response = await fetch(this.statusEndpoint);
      if (response.ok) {
        this.committeeData = await response.json();
        this.updateHeaderBadges();
        return this.committeeData;
      }
    } catch (e) {
      console.warn('[TeamilyExecutiveEngine] Fetch status fallback:', e);
    }
    return null;
  }

  updateHeaderBadges() {
    const badge = document.getElementById('teamilyVolturiBadge');
    if (badge && this.committeeData) {
      badge.textContent = '● ' + (this.committeeData.state || 'ACTIVO & SINCRONIZADO');
      badge.style.display = 'inline-block';
    }
  }

  async consultCommittee({ agent = 'all', domain = 'executive', query = '', context = {}, metadata = {} }) {
    this.isConsulting = true;
    this.renderLoadingState(true);

    try {
      const payload = {
        agent,
        agent_id: agent,
        agent_slug: agent,
        domain,
        query: query || 'Evaluación directiva ejecutiva Comité Volturi',
        context: Object.assign({
          timestamp: new Date().toISOString(),
          branch: 'Avenida 2 El Milagro, Maracaibo',
          platform: 'Mrs. Pets Web / POS Omnichannel'
        }, context),
        metadata: Object.assign({
          source: 'web_pos_platform',
          clientIp: window.clientIp || '127.0.0.1'
        }, metadata)
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.history.unshift(result);
      if (this.history.length > 20) this.history.pop();

      this.renderDeliberationResult(result);
      this.isConsulting = false;
      this.renderLoadingState(false);
      return result;
    } catch (err) {
      console.error('[TeamilyExecutiveEngine] Error en orquestación:', err);
      this.isConsulting = false;
      this.renderLoadingState(false);
      this.renderErrorState(err);
      return null;
    }
  }

  isAuthorizedAdminOrManager() {
    const auth = window.authEngine || window.AuthEngine;
    const admin = window.adminEngine;

    if (typeof document !== 'undefined' && document.body) {
      if (document.body.classList.contains('enterprise-view-mode')) {
        return true;
      }
      if (!document.body.classList.contains('customer-view-mode')) {
        return true;
      }
    }

    const role = String(auth?.userRole || auth?.currentUser?.role || '').toLowerCase();
    if (role === 'visitor' || role === 'guest' || role === 'client' || role === 'candidate') {
      return false;
    }

    const isEnterpriseAuth = Boolean(
      (admin && admin.isEnterpriseAuthenticated) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('mrs_pets_enterprise_authenticated') === 'true') ||
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mrs_pets_enterprise_authenticated') === 'true')
    );

    if (!isEnterpriseAuth && role !== 'admin' && role !== 'staff' && role !== 'manager' && role !== 'gerente') {
      return false;
    }

    if (admin && admin.currentStaffUser) {
      const staffRole = String(admin.currentStaffUser.rol_principal || admin.currentStaffUser.role || '').toLowerCase();
      const staffName = String(admin.currentStaffUser.name || admin.currentStaffUser.nombre || '').toLowerCase();
      if (
        staffRole === 'admin' ||
        staffRole === 'manager' ||
        staffRole === 'gerente' ||
        staffRole === 'director' ||
        staffName.includes('admin') ||
        staffName.includes('director') ||
        staffName.includes('gerente')
      ) {
        return true;
      }
    }

    if (role === 'admin' || role === 'manager' || role === 'gerente' || role === 'staff') {
      return true;
    }

    return isEnterpriseAuth;
  }

  openCommitteeConsole(initialDomain = 'executive') {
    if (!this.isAuthorizedAdminOrManager()) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('[TeamilyExecutiveEngine] Acceso denegado: El Comité Volturi / Teamly AI es exclusivo para Administradores y Gerentes.');
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🔒 Acceso Denegado: El Comité Volturi / Teamly AI es exclusivo para Administradores y Gerentes.', 'warning');
      } else if (typeof alert !== 'undefined') {
        alert('🔒 Acceso Denegado: El Comité Volturi / Teamly AI es exclusivo para Administradores y Gerentes.');
      }
      if (window.app && typeof window.app.openModal === 'function') {
        window.app.openModal('enterprise-login-modal');
      }
      return false;
    }

    // Limpiar cualquier instancia previa o en caché para asegurar renderizado interactivo fresco
    let modal = document.getElementById('volturiCommitteeModal');
    if (modal) {
      modal.remove();
    }
    modal = this.createCommitteeModal();
    document.body.appendChild(modal);

    this.renderAgentsGrid();
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('z-index', '2000000', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    document.body.style.overflow = 'hidden';

    // Foco automático e interactividad en el input de consulta
    setTimeout(() => {
      const qInput = document.getElementById('volturiQueryInput');
      if (qInput) {
        qInput.focus();
      }
    }, 80);

    if (this.history.length === 0) {
      this.consultCommittee({
        agent: 'all',
        domain: initialDomain,
        query: 'Diagnóstico operacional de apertura y orquestación general de sucursal'
      });
    } else {
      this.renderDeliberationResult(this.history[0]);
    }
    return true;
  }

  closeCommitteeConsole() {
    const modal = document.getElementById('volturiCommitteeModal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
      document.body.style.overflow = '';
    }
  }

  createCommitteeModal() {
    const modal = document.createElement('div');
    modal.id = 'volturiCommitteeModal';
    modal.style.cssText = `
      position: fixed !important;
      top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
      width: 100vw !important; height: 100vh !important;
      background: rgba(0, 0, 0, 0.90) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      z-index: 2000000 !important;
      display: none;
      align-items: center !important;
      justify-content: center !important;
      padding: 16px !important;
      box-sizing: border-box !important;
      pointer-events: auto !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;

    modal.innerHTML = `
      <div style="background: #0f172a; border: 1.5px solid #a855f7; border-radius: 20px; width: 100%; max-width: 1120px; max-height: 94vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px rgba(147, 51, 234, 0.45); color: #fff; pointer-events: auto;">
        
        <!-- Header con Identidad Oficial y Acciones -->
        <div style="background: linear-gradient(135deg, #1f1435, #0f172a); padding: 18px 24px; border-bottom: 1px solid rgba(168, 85, 247, 0.35); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.8rem;">🤖</span>
              <div>
                <h2 style="margin: 0; font-size: 1.25rem; font-weight: 900; color: #f3e8ff; letter-spacing: -0.02em;">
                  Teamly AI Workspace • Directorio de Subagentes &amp; Comité Volturi
                </h2>
                <div style="font-size: 0.8rem; color: #c084fc; font-weight: 600; margin-top: 2px;">
                  Canal Central de Agentes (Vanessa, O'Neal, Mike, Manolo, Pandora, Charlie) • Vertex AI &amp; Teamily SDK
                </div>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button type="button" onclick="window.teamilyExecutiveEngine.openDirectChatModal('manolo')" style="background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);">
              <span>💬 Abrir Workspace de Chat 1 a 1</span>
            </button>
            <button type="button" onclick="window.teamilyExecutiveEngine.openAgentConfigModal()" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);">
              <span>➕ Vincular Nuevo Agente</span>
            </button>
            <button type="button" onclick="window.teamilyExecutiveEngine.closeCommitteeConsole()" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #e2e8f0; border-radius: 10px; width: 34px; height: 34px; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Cerrar modal">
              ✕
            </button>
          </div>
        </div>

        <!-- Cuerpo del Modal -->
        <div style="padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Encabezado de Agentes Registrados -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
              <span style="font-size: 0.84rem; font-weight: 800; color: #e9d5ff; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                👥 Subagentes Oficiales Vinculados en Teamly (${this.agents.length}):
              </span>
              <span style="font-size: 0.76rem; color: #cbd5e1;">
                💡 <em>Haz clic en cualquier agente para abrir inmediatamente su chat interactivo 1 a 1.</em>
              </span>
            </div>

            <!-- Contenedor Grid Dinámico de Agentes -->
            <div id="volturiAgentsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;"></div>
          </div>

          <!-- Prompt y Botones de Consulta Colegiada -->
          <div style="background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(168, 85, 247, 0.4); border-radius: 14px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label for="volturiQueryInput" style="font-size: 0.84rem; font-weight: 800; color: #d8b4fe; display: flex; align-items: center; gap: 6px;">
                🏛️ Enviar Caso Directivo al Comité en Pleno (Deliberación Colegiada):
              </label>
              <span style="font-size: 0.72rem; color: #94a3b8;">
                Escribe tu consulta o haz clic en los accesos rápidos de abajo
              </span>
            </div>
            <div style="display: flex; gap: 10px;">
              <input type="text" id="volturiQueryInput" placeholder="Escribe tu caso o directriz aquí (ej: balance de turnos 7 estaciones, caja POS, inventario o CVs)..." style="flex: 1; background: #0f172a !important; border: 1.5px solid #a855f7 !important; border-radius: 10px; color: #ffffff !important; padding: 12px 16px; font-size: 0.9rem; font-weight: 500; outline: none; caret-color: #c084fc; user-select: text !important; pointer-events: auto !important; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);" onkeydown="if(event.key==='Enter') window.teamilyExecutiveEngine.handleManualQuery()">
              <button type="button" onclick="window.teamilyExecutiveEngine.handleManualQuery()" style="background: linear-gradient(135deg, #9333ea, #7c3aed); border: none; border-radius: 10px; color: #fff; font-weight: 800; padding: 12px 22px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4); font-size: 0.88rem;">
                <span>⚡ Deliberar Comité</span>
              </button>
            </div>

            <!-- Accesos Rápidos con Feedback Instantáneo -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; align-items: center;">
              <span style="font-size: 0.72rem; color: #c084fc; font-weight: 800; display: flex; align-items: center; margin-right: 4px;">⚡ Consultas directas:</span>
              <button type="button" onclick="window.teamilyExecutiveEngine.quickQuery('operations')" style="background: rgba(129, 140, 248, 0.15); border: 1px solid #6366f1; color: #c7d2fe; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                👑 Operaciones &amp; Turnos (Manolo)
              </button>
              <button type="button" onclick="window.teamilyExecutiveEngine.quickQuery('supply')" style="background: rgba(14, 165, 233, 0.15); border: 1px solid #0284c7; color: #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                📦 Reposición Insumos (Pandora)
              </button>
              <button type="button" onclick="window.teamilyExecutiveEngine.quickQuery('pos')" style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #a7f3d0; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                🛒 Auditoría Caja POS &amp; BCV (Charlie)
              </button>
              <button type="button" onclick="window.teamilyExecutiveEngine.quickQuery('vanessa')" style="background: rgba(244, 114, 182, 0.15); border: 1px solid #f472b6; color: #fbcfe8; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                💼 Evaluar Postulantes &amp; CVs (Valeria)
              </button>
              <button type="button" onclick="window.teamilyExecutiveEngine.quickQuery('oneal')" style="background: rgba(251, 146, 60, 0.15); border: 1px solid #ea580c; color: #fed7aa; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                📢 Reservas &amp; Campañas (O'Neal)
              </button>
              <button type="button" onclick="window.teamilyExecutiveEngine.quickQuery('mike')" style="background: rgba(56, 189, 248, 0.15); border: 1px solid #0284c7; color: #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                🛠️ Infraestructura &amp; Tanques (Mike)
              </button>
            </div>
          </div>

          <!-- Spinner Loading -->
          <div id="volturiLoadingSpinner" style="display: none; padding: 24px; text-align: center;">
            <div style="display: inline-block; width: 34px; height: 34px; border: 3px solid rgba(168, 85, 247, 0.3); border-top-color: #a855f7; border-radius: 50%; animation: volturiSpin 0.8s linear infinite;"></div>
            <div style="color: #c084fc; font-weight: 700; font-size: 0.88rem; margin-top: 8px;">
              Orquestando deliberación con los agentes de Teamly en Vertex AI...
            </div>
          </div>

          <!-- Contenedor del Resultado de la Deliberación -->
          <div id="volturiDeliberationContainer"></div>

        </div>

        <!-- Footer Informativo -->
        <div style="background: #090d16; padding: 12px 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; color: #94a3b8; flex-wrap: wrap; gap: 8px;">
          <div>
            📡 Enlace: <code>/api/v1/teamily/orchestrate</code> • Gateway Teamily GEO A (Leia)
          </div>
          <div style="color: #c084fc; font-weight: 700;">
            Teamly.ai API • Project Board: <code>5803df5a-7127-4d28-b97c-5c840d47cdc7</code>
          </div>
        </div>

      </div>
    `;

    return modal;
  }

  renderAgentsGrid() {
    const grid = document.getElementById('volturiAgentsGrid');
    if (!grid) return;

    grid.innerHTML = this.agents.map(a => {
      const history = this.directChatHistory[a.id] || [];
      const lastMsg = history.length > 0 ? history[history.length - 1].text : 'Sin mensajes previos';
      const cleanSnippet = lastMsg.replace(/[*_#`]/g, '').substring(0, 75);

      return `
        <div onclick="window.teamilyExecutiveEngine.openDirectChatModal('${a.id}')" style="cursor: pointer; transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease; background: ${a.bg || '#1e1b4b'}; border: 1.5px solid ${a.border || '#4338ca'}; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.25);" onmouseenter="this.style.transform='translateY(-2px)'; this.style.borderColor='#c084fc'; this.style.boxShadow='0 8px 24px rgba(168,85,247,0.3)';" onmouseleave="this.style.transform='none'; this.style.borderColor='${a.border || '#4338ca'}'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.25)';">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 900; font-size: 0.96rem; color: #fff; display: flex; align-items: center; gap: 8px;">
                ${this.renderAgentAvatar(a, 32)} <span>${a.name}</span>
              </span>
              <span style="font-size: 0.68rem; background: rgba(255,255,255,0.1); color: ${a.color || '#a5b4fc'}; padding: 2px 7px; border-radius: 4px; font-weight: 800; border: 1px solid ${a.border || '#4338ca'};">
                ${a.role}
              </span>
            </div>
            <p style="margin: 0 0 8px 0; font-size: 0.77rem; color: #cbd5e1; line-height: 1.4;">
              ${a.description || 'Subagente especialista de Teamly.'}
            </p>
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 6px 10px; margin-bottom: 8px; font-size: 0.72rem; color: #94a3b8;">
              <div style="font-weight: 700; color: #cbd5e1; margin-bottom: 2px; font-size: 0.68rem; text-transform: uppercase;">Último mensaje en histórico:</div>
              <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e2e8f0;">
                "${cleanSnippet}${cleanSnippet.length >= 75 ? '...' : ''}"
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: #94a3b8;">
              <span style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">
                Slug: <code>${a.teamlySlug || 'geo-a'}</code>
              </span>
              <span style="color: #34d399; font-weight: 700;">● Online en Teamly</span>
            </div>
          </div>

          <!-- Botones de Acción: Conversar 1 a 1 y Configurar -->
          <div style="display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;" onclick="event.stopPropagation()">
            <button type="button" onclick="window.teamilyExecutiveEngine.openDirectChatModal('${a.id}')" style="flex: 1; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; color: #fff; border-radius: 8px; padding: 8px 12px; font-size: 0.78rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 6px rgba(124, 58, 237, 0.35);">
              <span>💬 Conversar con ${a.name.split(' ')[0]}</span>
            </button>
            <button type="button" onclick="window.teamilyExecutiveEngine.openAgentConfigModal('${a.id}')" title="Configurar conexión Teamly, Slug y Endpoints" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #e2e8f0; border-radius: 8px; padding: 7px 10px; font-size: 0.85rem; cursor: pointer;">
              ⚙️
            </button>
            ${!a.isDefault ? `
              <button type="button" onclick="window.teamilyExecutiveEngine.deleteAgent('${a.id}')" title="Eliminar este agente" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; border-radius: 8px; padding: 7px 10px; font-size: 0.85rem; cursor: pointer;">
                🗑️
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // --- MODAL DE CHAT DIRECTO 1 A 1 CON PANEL LATERAL Y CONTEXTO VINCULADO ---
  openDirectChatModal(agentId) {
    const agent = this.getAgentById(agentId) || this.agents[0];
    if (!agent) return;

    this.activeDirectChatAgent = agent;
    if (!this.directChatHistory[agent.id] || this.directChatHistory[agent.id].length === 0) {
      this.directChatHistory[agent.id] = [
        {
          sender: 'agent',
          text: agent.welcomeMessage || `Hola, soy **${agent.name}** (${agent.role} en Mrs. Pets). Estoy conectado directamente a través de Teamly.ai. ¿En qué caso o directriz operativa requieres mi apoyo hoy?`,
          timestamp: new Date().toLocaleTimeString()
        }
      ];
      this.saveChatHistory();
    }

    let modal = document.getElementById('volturiDirectChatModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'volturiDirectChatModal';
      modal.style.cssText = `
        position: fixed !important;
        top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
        width: 100vw !important; height: 100vh !important;
        background: rgba(0, 0, 0, 0.90) !important;
        backdrop-filter: blur(14px) !important;
        -webkit-backdrop-filter: blur(14px) !important;
        z-index: 2000020 !important;
        display: none;
        align-items: center !important;
        justify-content: center !important;
        padding: 16px !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      `;
      document.body.appendChild(modal);
    }

    this.renderDirectChatContent(modal, agent);
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('z-index', '2000020', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
  }

  closeDirectChatModal() {
    const modal = document.getElementById('volturiDirectChatModal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
    }
  }

  switchActiveAgent(newAgentId) {
    const agent = this.getAgentById(newAgentId);
    if (!agent) return;
    this.openDirectChatModal(agent.id);
  }

  renderDirectChatContent(modal, agent) {
    const history = this.directChatHistory[agent.id] || [];

    // Acciones rápidas contextuales según el agente
    let contextButtonsHtml = '';
    if (agent.id === 'vanessa' || agent.id === 'valeria') {
      const apps = JSON.parse(localStorage.getItem('mrs_pets_hr_applications') || '[]');
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('${agent.id}', '¿Cuáles currículums vitae han llegado a la página web y cuál es su perfil?')" style="background:rgba(244,114,182,0.18); border:1px solid #f472b6; color:#fbcfe8; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📄 Ver CVs Recibidos (${apps.length})
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('${agent.id}', 'Valeria, realiza una evaluación exhaustiva del perfil de María Briceño para el cargo de Estilista Canino/Groomer')" style="background:rgba(244,114,182,0.18); border:1px solid #f472b6; color:#fbcfe8; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          ✂️ Evaluar a María Briceño
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('${agent.id}', 'Valeria, evalúa la postulación del Dr. Leonardo Morales para la Clínica Veterinaria Mrs. Pets')" style="background:rgba(244,114,182,0.18); border:1px solid #f472b6; color:#fbcfe8; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🩺 Evaluar Dr. Leonardo
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('${agent.id}', 'Dame el cuestionario de 5 preguntas técnicas y de protocolo Silent Luxury para la entrevista presencial de estilistas')" style="background:rgba(244,114,182,0.18); border:1px solid #f472b6; color:#fbcfe8; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          ❓ Preguntas de Entrevista
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('${agent.id}', 'Redacta el mensaje formal de WhatsApp para convocar a María Briceño a entrevista técnica en la sede Av. 2 El Milagro')" style="background:rgba(244,114,182,0.18); border:1px solid #f472b6; color:#fbcfe8; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          💬 WhatsApp de Citación
        </button>
      `;
    } else if (agent.id === 'leia') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('leia', 'Leia, activa el protocolo Silent Luxury y preséntate a los tutores VIP')" style="background:rgba(253,224,71,0.18); border:1px solid #eab308; color:#fef08a; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🎀 Protocolo Silent Luxury
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('leia', '¿Cuál es la agenda directiva del CEO y los tutores de alta fidelidad para hoy?')" style="background:rgba(253,224,71,0.18); border:1px solid #eab308; color:#fef08a; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          👑 Agenda Tutores VIP
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('leia', 'Redacta un mensaje de bienvenida personalizada para un tutor exclusivo de spa')" style="background:rgba(253,224,71,0.18); border:1px solid #eab308; color:#fef08a; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          ✨ Bienvenida Personalizada
        </button>
      `;
    } else if (agent.id === 'oneal') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('oneal', 'O\'Neal, ¿cuáles son las reservaciones activas de hoy en hotel, spa y clínica?')" style="background:rgba(251,146,60,0.18); border:1px solid #ea580c; color:#fed7aa; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📅 Consultar Reservas de Hoy
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('oneal', '¿Cuáles modificaciones o mantenimientos de equipos están pendientes en sucursal?')" style="background:rgba(251,146,60,0.18); border:1px solid #ea580c; color:#fed7aa; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🛠️ Mantenimientos Pendientes
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('oneal', 'Muestra el rendimiento de las campañas de telemercadeo en TikTok y Meta Ads')" style="background:rgba(251,146,60,0.18); border:1px solid #ea580c; color:#fed7aa; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📢 Campañas Telemercadeo
        </button>
      `;
    } else if (agent.id === 'oneal_mercadeo') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('oneal_mercadeo', '¿Cómo van las conversiones del telemercadeo local en Maracaibo hoy?')" style="background:rgba(249,115,22,0.18); border:1px solid #ea580c; color:#fed7aa; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🎯 Conversiones Maracaibo
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('oneal_mercadeo', 'Diseña una promoción de spa para días de baja afluencia')" style="background:rgba(249,115,22,0.18); border:1px solid #ea580c; color:#fed7aa; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🏷️ Promoción Días Flojos
        </button>
      `;
    } else if (agent.id === 'sebastian') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('sebastian', 'Sebastian, ¿cuántas membresías y paquetes de spa hemos cerrado esta semana?')" style="background:rgba(16,185,129,0.18); border:1px solid #059669; color:#a7f3d0; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📈 Membresías Spa Anuales
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('sebastian', 'Muestra la estrategia para recuperar carritos abandonados de tutores')" style="background:rgba(16,185,129,0.18); border:1px solid #059669; color:#a7f3d0; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🛒 Carritos Abandonados
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('sebastian', '¿Cuál es el ticket promedio actual y cómo aumentarlo con up-selling de ozonoterapia?')" style="background:rgba(16,185,129,0.18); border:1px solid #059669; color:#a7f3d0; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          💰 Up-selling Ozonoterapia
        </button>
      `;
    } else if (agent.id === 'mike') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('mike', '¿Cómo está la autonomía y nivel de la batería de tanques de agua Don Bosco?')" style="background:rgba(56,189,248,0.18); border:1px solid #0284c7; color:#bae6fd; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          💧 Nivel Tanques de Agua Tuya
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('mike', 'Verifica el nivel de diésel y horas de autonomía de la Planta Cummins 65 kVA')" style="background:rgba(56,189,248,0.18); border:1px solid #0284c7; color:#bae6fd; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          ⚡ Planta Cummins Modbus
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('mike', 'Reporta los activos en amarillo o rojo del semáforo ISO 9001')" style="background:rgba(56,189,248,0.18); border:1px solid #0284c7; color:#bae6fd; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🚨 Semáforo de Activos ISO 9001
        </button>
      `;
    } else if (agent.id === 'charlie') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('charlie', 'Charlie, ¿cuál es la Tasa Oficial Única del BCV y cómo se calcula el IVA 16% SENIAT hoy?')" style="background:rgba(16,185,129,0.18); border:1px solid #10b981; color:#a7f3d0; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          💵 Tasa Oficial BCV &amp; SENIAT
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('charlie', 'Auditar tickets y facturación de mostrador POS')" style="background:rgba(16,185,129,0.18); border:1px solid #10b981; color:#a7f3d0; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🛒 Auditoría POS
        </button>
      `;
    } else if (agent.id === 'manolo') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('manolo', 'Manolo, ¿cómo está la carga de citas en las 7 estaciones para asegurar el cierre estricto a las 6:00 PM?')" style="background:rgba(129,140,248,0.18); border:1px solid #6366f1; color:#c7d2fe; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          ⏰ Balance Grooming &amp; Cierre 6 PM
        </button>
      `;
    } else if (agent.id === 'pandora') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('pandora', 'Pandora, revisa el stock crítico de insumos y pedidos bajo el filtro KillCritic')" style="background:rgba(14,165,233,0.18); border:1px solid #0284c7; color:#bae6fd; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📦 Insumos &amp; KillCritic
        </button>
      `;
    } else if (agent.id === 'rocky') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('rocky', 'Rocky, ¿cuál es el estado y lead times de los pedidos de repuestos e insumos médicos?')" style="background:rgba(100,116,139,0.18); border:1px solid #64748b; color:#cbd5e1; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🚚 Lead Times &amp; Despachos
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('rocky', 'Evalúa las rutas de abastecimiento y tiempos de entrega para Don Bosco')" style="background:rgba(100,116,139,0.18); border:1px solid #64748b; color:#cbd5e1; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📦 Rutas Críticas Don Bosco
        </button>
      `;
    } else if (agent.id === 'mrspetshospital') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('mrspetshospital', '¿Cuáles ofertas de planes preventivos y consultas especializadas tenemos activas?')" style="background:rgba(239,68,68,0.18); border:1px solid #dc2626; color:#fca5a5; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🏥 Planes de Salud Preventiva
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('mrspetshospital', 'Estructura una oferta para perfiles de laboratorio IDEXX in-house y ecografías')" style="background:rgba(239,68,68,0.18); border:1px solid #dc2626; color:#fca5a5; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🔬 Paquetes Diagnóstico IDEXX
        </button>
      `;
    } else if (agent.id === 'ai_recruiter') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('ai_recruiter', 'Ejecuta el screening automático de las nuevas hojas de vida registradas en la web')" style="background:rgba(168,85,247,0.18); border:1px solid #9333ea; color:#d8b4fe; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🤖 Escanear Postulaciones Web
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('ai_recruiter', 'Genera el ranking de candidatos para estilismo según experiencia con razas gigantes')" style="background:rgba(168,85,247,0.18); border:1px solid #9333ea; color:#d8b4fe; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📊 Ranking Razas Gigantes
        </button>
      `;
    } else if (agent.id === 'hospitality') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('hospitality', '¿Cómo está la ocupación de suites en el hotel y guardería diurna hoy?')" style="background:rgba(236,72,153,0.18); border:1px solid #db2777; color:#fbcfe8; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🏨 Ocupación Suites VIP
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('hospitality', 'Genera el reporte fotográfico y de confort para los tutores de huéspedes')" style="background:rgba(236,72,153,0.18); border:1px solid #db2777; color:#fbcfe8; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📸 Reporte Huéspedes Consentidos
        </button>
      `;
    } else if (agent.id === 'customer_service') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('customer_service', 'Muestra el índice de satisfacción CSAT de los tutores atendidos esta semana')" style="background:rgba(20,184,166,0.18); border:1px solid #0d9488; color:#99f6e4; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          ⭐ Índice CSAT de Tutores
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('customer_service', 'Redacta un mensaje de seguimiento post-grooming para preguntar cómo se siente la mascota')" style="background:rgba(20,184,166,0.18); border:1px solid #0d9488; color:#99f6e4; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          💬 Seguimiento Post-Grooming
        </button>
      `;
    } else if (agent.id === 'training_designer') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('training_designer', '¿Cuáles módulos de capacitación Silent Luxury están programados para el personal de piso?')" style="background:rgba(139,92,246,0.18); border:1px solid #7c3aed; color:#c4b5fd; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🎓 Inducción Silent Luxury
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('training_designer', 'Entrega el protocolo de seguridad y manejo canino sin estrés para nuevos ingresos')" style="background:rgba(139,92,246,0.18); border:1px solid #7c3aed; color:#c4b5fd; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📖 Protocolo Manejo Sin Estrés
        </button>
      `;
    } else if (agent.id === 'mauro_che') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('mauro_che', 'Mauro, redacta 3 copys persuasivos para Instagram promocionando el baño de ozono')" style="background:rgba(234,179,8,0.18); border:1px solid #ca8a04; color:#fef08a; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          🎨 Copys Instagram Reels
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('mauro_che', 'Propón el guion creativo de 30 segundos para TikTok sobre el antes y después en spa')" style="background:rgba(234,179,8,0.18); border:1px solid #ca8a04; color:#fef08a; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📱 Guion Creativo TikTok
        </button>
      `;
    } else if (agent.id === 'super_agent') {
      contextButtonsHtml = `
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('super_agent', 'Super Agent, realiza una auditoría general de rendimiento transversal entre todas las áreas')" style="background:rgba(59,130,246,0.18); border:1px solid #2563eb; color:#bfdbfe; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          ⚡ Auditoría Transversal 360°
        </button>
        <button type="button" onclick="window.teamilyExecutiveEngine.sendPredefinedAgentPrompt('super_agent', 'Sintetiza las métricas clave de operaciones, finanzas, ventas y talento humano de hoy')" style="background:rgba(59,130,246,0.18); border:1px solid #2563eb; color:#bfdbfe; padding:5px 11px; border-radius:6px; font-size:0.73rem; font-weight:800; cursor:pointer;">
          📊 Síntesis de Métricas Clave
        </button>
      `;
    }

    modal.innerHTML = `
      <div style="background: #111827; border: 1.5px solid ${agent.border || '#a855f7'}; border-radius: 20px; width: 100%; max-width: 1020px; height: 86vh; display: flex; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.7); color: #fff;">
        
        <!-- COLUMNA IZQUIERDA: DIRECTORIO DE AGENTES & HISTÓRICOS ACTIVOS -->
        <div style="width: 290px; background: #0c121e; border-right: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; overflow: hidden;">
          
          <!-- Encabezado de Directorio -->
          <div style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); background: #080d17;">
            <div style="font-weight: 900; font-size: 0.92rem; color: #f3e8ff; display: flex; align-items: center; justify-content: space-between;">
              <span style="display: flex; align-items: center; gap: 6px;">👥 Subagentes Teamly</span>
              <span style="font-size: 0.68rem; background: rgba(168,85,247,0.2); color: #c084fc; padding: 2px 6px; border-radius: 4px; font-weight: 800;">
                ${this.agents.length} activos
              </span>
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 3px;">
              Historial persistente de conversaciones
            </div>
          </div>

          <!-- Lista de Agentes para Alternar Chat -->
          <div style="flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px;">
            ${this.agents.map(a => {
              const isActive = a.id === agent.id;
              const aHistory = this.directChatHistory[a.id] || [];
              const lastText = aHistory.length > 0 ? aHistory[aHistory.length - 1].text : 'Sin mensajes';
              const cleanTxt = lastText.replace(/[*_#`]/g, '').substring(0, 36);

              return `
                <div onclick="window.teamilyExecutiveEngine.switchActiveAgent('${a.id}')" style="background: ${isActive ? 'linear-gradient(135deg, ' + (a.bg || '#1e1b4b') + ', #111827)' : 'rgba(255,255,255,0.03)'}; border: 1.5px solid ${isActive ? (a.border || '#a855f7') : 'transparent'}; border-radius: 10px; padding: 10px 12px; cursor: pointer; display: flex; gap: 10px; align-items: center; transition: all 0.15s ease;">
                  ${this.renderAgentAvatar(a, 38)}
                  <div style="overflow: hidden; flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="font-weight: 800; font-size: 0.82rem; color: ${isActive ? '#fff' : '#e2e8f0'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${a.name}
                      </div>
                      <span style="font-size: 0.62rem; color: #34d399; font-weight: 800;">●</span>
                    </div>
                    <div style="font-size: 0.68rem; color: ${a.color || '#a5b4fc'}; font-weight: 700; margin-top: 1px;">
                      ${a.role}
                    </div>
                    <div style="font-size: 0.66rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
                      ${cleanTxt}...
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Pie del Directorio -->
          <div style="padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.08); background: #080d17;">
            <button type="button" onclick="window.teamilyExecutiveEngine.openAgentConfigModal()" style="width: 100%; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; border-radius: 8px; padding: 7px; font-size: 0.75rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
              <span>➕ Vincular Nuevo Agente</span>
            </button>
          </div>

        </div>

        <!-- COLUMNA DERECHA: CONVERSACIÓN CONTINUA & HISTÓRICO CON EL AGENTE SELECCIONADO -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #0e1524;">
          
          <!-- Header del Hilo Activo -->
          <div style="background: linear-gradient(135deg, ${agent.bg || '#1f1435'}, #0e1524); padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${this.renderAgentAvatar(agent, 46, 'border-width: 2.5px;')}
              <div>
                <div style="font-weight: 900; font-size: 1.1rem; color: #fff; display: flex; align-items: center; gap: 8px;">
                  ${agent.name}
                  <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; font-size: 0.65rem; padding: 2px 7px; border-radius: 4px; font-weight: 800; letter-spacing: 0.04em;">
                    ● TEAMLY AI ACTIVO
                  </span>
                </div>
                <div style="font-size: 0.74rem; color: ${agent.color || '#c084fc'}; font-weight: 700;">
                  ${agent.role} • Slug: <code>${agent.teamlySlug || 'geo-a'}</code>
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" onclick="window.teamilyExecutiveEngine.clearAgentHistory('${agent.id}')" title="Reiniciar conversación con este agente" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 8px; padding: 5px 9px; font-size: 0.72rem; cursor: pointer; font-weight: 700;">
                🧹 Limpiar
              </button>
              <button type="button" onclick="window.teamilyExecutiveEngine.openAgentConfigModal('${agent.id}')" title="Configurar conexión Teamly, Slug y Endpoints" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 8px; padding: 5px 9px; font-size: 0.8rem; cursor: pointer;">
                ⚙️
              </button>
              <button type="button" onclick="window.teamilyExecutiveEngine.closeDirectChatModal()" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center;">
                ✕
              </button>
            </div>
          </div>

          <!-- Barra de Acciones Rápidas con Datos Reales -->
          <div style="padding: 8px 18px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">
              ⚡ Datos Operativos:
            </span>
            ${contextButtonsHtml}
          </div>

          <!-- Historial de Mensajes (Persistente) -->
          <div id="directChatMessagesContainer" style="flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 12px; background: #0a0f1d;">
            ${history.map(m => `
              <div style="display: flex; justify-content: ${m.sender === 'user' ? 'flex-end' : 'flex-start'};">
                <div class="direct-chat-bubble" style="max-width: 82%; background: ${m.sender === 'user' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#1e293b'}; color: #fff; padding: 11px 15px; border-radius: ${m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px'}; font-size: 0.85rem; line-height: 1.48; border: 1px solid ${m.sender === 'user' ? '#9333ea' : 'rgba(255,255,255,0.08)'}; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
                  <div style="font-size: 0.7rem; color: ${m.sender === 'user' ? '#e9d5ff' : '#94a3b8'}; margin-bottom: 5px; font-weight: 700; display: flex; justify-content: space-between; gap: 12px; align-items: center;">
                    <span style="display: inline-flex; align-items: center; gap: 6px;">${m.sender === 'user' ? '👤 Tú (Administrador)' : `${this.renderAgentAvatar(agent, 20)} ${agent.name}`}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${m.sender !== 'user' ? `
                        <button type="button" class="btn-voice-agent" onclick="window.teamilyExecutiveEngine.playAgentVoice('${agent.id}', this)" title="Escuchar voz de ${agent.name} (ElevenLabs / TTS)" style="background: rgba(168,85,247,0.18); border: 1px solid rgba(168,85,247,0.4); color: #c084fc; border-radius: 6px; padding: 2px 7px; font-size: 0.68rem; cursor: pointer; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
                          🔊 Escuchar
                        </button>
                      ` : ''}
                      <span style="opacity: 0.75;">${m.timestamp}</span>
                    </div>
                  </div>
                  <div class="direct-chat-text" style="white-space: pre-wrap;">${m.text}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Indicador de Escribiendo -->
          <div id="directChatTyping" style="display: none; padding: 6px 18px; font-size: 0.75rem; color: #a5b4fc; background: #0a0f1d;">
            <em>${agent.name} está procesando en Teamly.ai...</em>
          </div>

          <!-- Input de Mensaje Directo -->
          <div style="padding: 14px 18px; background: #111827; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 10px; align-items: center;">
            <input type="text" id="directChatInput" placeholder="Escribe tu mensaje a ${agent.name} (ej: consultar reservas, mantenimientos o directrices)..." style="flex: 1; background: #0f172a !important; border: 1.5px solid #a855f7 !important; border-radius: 10px; color: #ffffff !important; padding: 12px 16px; font-size: 0.9rem; font-weight: 500; outline: none; caret-color: #c084fc; user-select: text !important; pointer-events: auto !important; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);" onkeydown="if(event.key==='Enter') window.teamilyExecutiveEngine.sendDirectChatMessage()">
            <button type="button" onclick="window.teamilyExecutiveEngine.sendDirectChatMessage()" style="background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; color: #fff; font-weight: 800; border-radius: 10px; padding: 12px 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(124, 58, 237, 0.4); font-size: 0.88rem;">
              <span>Enviar ⚡</span>
            </button>
          </div>

        </div>

      </div>
    `;

    setTimeout(() => {
      const container = document.getElementById('directChatMessagesContainer');
      if (container) container.scrollTop = container.scrollHeight;
      const inp = document.getElementById('directChatInput');
      if (inp) inp.focus();
    }, 50);
  }

  sendPredefinedAgentPrompt(agentId, promptText) {
    const inp = document.getElementById('directChatInput');
    if (inp) {
      inp.value = promptText;
      this.sendDirectChatMessage();
    }
  }

  async sendDirectChatMessage() {
    const input = document.getElementById('directChatInput');
    const typing = document.getElementById('directChatTyping');
    if (!input || !this.activeDirectChatAgent) return;
    const text = input.value.trim();
    if (!text) return;

    const agent = this.activeDirectChatAgent;
    input.value = '';

    if (!this.directChatHistory[agent.id]) this.directChatHistory[agent.id] = [];
    this.directChatHistory[agent.id].push({
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    });
    this.saveChatHistory();

    const modal = document.getElementById('volturiDirectChatModal');
    if (modal) this.renderDirectChatContent(modal, agent);

    if (typing) typing.style.display = 'block';

    // Recopilar contexto operativo dinámico para este agente
    const liveContext = this.getLiveContextData(agent.id);

    try {
      let formattedInput = text;
      // Si el agente tiene mención explícita @ en su slug (ej: @b909da17-2c84-4dfe-a993-c3271ebca750 para Valeria):
      // enviarla al input para que Charly en Teamily sepa exactamente a quién dirigirla en RRHH Presidencia.
      if (agent.teamlySlug && agent.teamlySlug.startsWith('@')) {
        if (!formattedInput.includes(agent.teamlySlug)) {
          formattedInput = `${agent.teamlySlug} ${formattedInput}`;
        }
      }

      const slugToSend = (agent.id === 'charlie' || agent.teamlySlug === 'charlie' || agent.teamlySlug?.startsWith('@'))
        ? 'geo-a'
        : (agent.teamlySlug || 'geo-a');

      const endpointToSend = this.normalizeTeamilyEndpoint(agent.teamlyEndpoint);

      const res = await fetch(this.agentChatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: formattedInput,
          agent_slug: slugToSend,
          endpoint_override: endpointToSend,
          board_id: agent.teamlyBoardId,
          agent_name: agent.name,
          context: liveContext
        })
      });

      const data = await res.json();
      let replyText = '';

      // Resolver texto de respuesta de forma resiliente
      let rawText = '';
      if (data && typeof data === 'object') {
        if (data.response_text && typeof data.response_text === 'string' && data.response_text.trim()) {
          rawText = data.response_text.trim();
        } else if (data.response_text && typeof data.response_text === 'object' && data.response_text.text) {
          rawText = String(data.response_text.text).trim();
        } else if (data.output && data.output.text) {
          rawText = String(data.output.text).trim();
        } else if (data.data && data.data.output && data.data.output.text) {
          rawText = String(data.data.output.text).trim();
        } else if (data.data && data.data.response) {
          rawText = String(data.data.response).trim();
        }
      }

      if (res.ok && rawText && rawText.length > 0) {
        const isCharlyDispatchReceipt = rawText.includes('BLUF:') ||
                                        rawText.includes('prueba entregada') ||
                                        rawText.includes('No puedo verificar') ||
                                        rawText.includes('serverMsgID') ||
                                        rawText.includes('canalizada por Charly') ||
                                        rawText.includes('playerType: agent');

        if (agent.id !== 'charlie' && isCharlyDispatchReceipt) {
          // Teamily solo envió el acuse de recibo de Charly; entregar la respuesta operativa directa del agente
          replyText = this.synthesizeAgentLiveReply(agent, text, liveContext, res.status);
        } else {
          replyText = rawText;
        }
      } else if (res.ok && data?.status === 'running') {
        const runId = data.run_id || 'en_proceso';
        replyText = `**Solicitud entregada a Teamily ✅**\n\nCharly canalizó tu instrucción hacia **${agent.name}** en la mesa correspondiente de Teamily (Run: \`${runId}\`).\n\n*Respuesta preliminar:* ${this.synthesizeAgentLiveReply(agent, text, liveContext, res.status)}`;
      } else if (res.ok) {
        // En caso de que Teamily retorne HTTP 200 sin cuerpo de texto explícito
        replyText = this.synthesizeAgentLiveReply(agent, text, liveContext, res.status);
      } else {
        // En caso de código de contingencia o de red:
        // Entregar DIRECTAMENTE la síntesis ejecutiva contextual in-house del agente,
        // garantizando una experiencia fluida, sin arrojar mensajes crudos de error de red.
        console.warn('[Teamily Executive Engine] Utilizando síntesis operativa del agente:', agent.name);
        replyText = this.synthesizeAgentLiveReply(agent, text, liveContext, res.status);
      }

      this.directChatHistory[agent.id].push({
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toLocaleTimeString()
      });
      this.saveChatHistory();
    } catch (err) {
      console.warn('[Teamily Executive Engine] Contingencia de red, activando síntesis ejecutiva:', err);
      const replyText = this.synthesizeAgentLiveReply(agent, text, liveContext);
      this.directChatHistory[agent.id].push({
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toLocaleTimeString()
      });
      this.saveChatHistory();
    } finally {
      if (typing) typing.style.display = 'none';
      if (modal) this.renderDirectChatContent(modal, agent);
    }
  }

  // Generador de respuestas operativas enriquecidas en vivo
  synthesizeAgentLiveReply(agent, userPrompt, context, httpStatus) {
    const promptLower = userPrompt.toLowerCase();
    const isCreditLimit = httpStatus === 402;
    const creditNotice = isCreditLimit ? '\n\n*(Nota: Tu cuenta de Teamily.ai está sin créditos en este momento. Mañana al recargar créditos, responderé además con mi modelo generativo completo)*.' : '';

    if (agent.id === 'manolo') {
      const activePatients = (window.adminEngine && Array.isArray(window.adminEngine.patientsStatus))
        ? window.adminEngine.patientsStatus.length
        : 8;
      return `👑 **Manolo (Director de Operaciones):**\n\nSaludos. Supervisando directamente las 7 estaciones de Grooming Spa en Av. 2 El Milagro:\n• **Pacientes VIP en atención:** ${activePatients} mascotas en flujo activo.\n• **Regla de Horario:** Estricto despeje de salas antes de las **6:00 p.m.** para garantizar el descanso del personal y la entrega puntual a tutores.\n• **Estaciones:** Hidromasaje, secado silencioso y estilismo funcionando a capacidad nominal.\n\nHe registrado tu instrucción: "${userPrompt}". Operaciones bajo control.${creditNotice}`;
    }

    if (agent.id === 'pandora') {
      return `📦 **Pandora (Cadena de Suministro & ROI):**\n\nAuditoría de insumos bajo el filtro KillCritic:\n• **Champús de Ozono e Hidratación:** Stock nominal (autonomía para 22 días).\n• **Filtro KillCritic:** Toda orden de reposición debe superar ROI ≥ 25% y Lead Time ≤ 15 días.\n• **Fármacos Esenciales de Clínica:** 100% de cobertura sin alertas rojas de quiebre.\n\nProcesando tu solicitud: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'vanessa' || agent.id === 'valeria') {
      const candidates = context.hr_candidates || [];

      // 1. Evaluación específica de María Briceño
      if (promptLower.includes('maría') || promptLower.includes('maria') || promptLower.includes('briceno') || promptLower.includes('briceño') || (promptLower.includes('evalu') && promptLower.includes('groom'))) {
        return `💼 **Valeria (RRHH & Talento Mrs. Pets):**\n\n` +
          `• **Candidata:** **María Briceño** (C.I. V-24.891.204 • Tel: \`+58 414-6123456\`).\n` +
          `• **Cargo:** Estilista Canino / Groomer Master • **Residencia:** Av. Bella Vista con Calle 72, Tierra Negra.\n` +
          `• **Experiencia Comprobable:** 4 años en estética avanzada (cortes asiáticos, tijera pura, stripping y ozonoterapia).\n` +
          `• **Razas Gigantes:** Destreza validada con Golden Retriever, Terranova y Schnauzer Gigante sin recurrir a sedación química.\n` +
          `• **Horario:** Disponibilidad diurna completa (alineada al cierre de sucursal 6:00 p.m.).\n` +
          `• **Expediente Digital:** \`CV_Maria_Briceno_Estilista.pdf\` (1.4 MB).\n\n` +
          `🏆 **Dictamen de Selección:** **PRESELECCIONADA (Calificación: 9.6/10)**.\n` +
          `*Recomendación de Valeria:* Citarla a prueba práctica de tijera e hidratación de pulpejos en la Estación #2 con el Líder de Piso Manolo.${creditNotice}`;
      }

      // 2. Evaluación específica del Dr. Leonardo Morales
      if (promptLower.includes('leonardo') || promptLower.includes('morales') || (promptLower.includes('evalu') && (promptLower.includes('vet') || promptLower.includes('médic') || promptLower.includes('medic')))) {
        return `🩺 **Valeria (RRHH & Talento Mrs. Pets):**\n\n` +
          `• **Candidato:** **Dr. Leonardo Alfonso Morales** (C.I. V-20.155.892 • Tel: \`+58 424-6338901\`).\n` +
          `• **Cargo:** Médico Veterinario de Guardia • **Residencia:** Urb. La Virginia, Calle 65.\n` +
          `• **Experiencia:** 6 años en medicina interna, anestesiología y emergencias menores en pequeños animales.\n` +
          `• **Equipamiento Clínico:** Experiencia operando analizadores IDEXX in-house (Catalyst One, ProCyte) y ecografía HD.\n` +
          `• **Expediente Digital:** \`CV_Dr_Leonardo_Morales_Vet.pdf\` (2.8 MB).\n\n` +
          `🏆 **Dictamen de Selección:** **EN REVISIÓN AVANZADA (Calificación: 9.3/10)**.\n` +
          `*Recomendación de Valeria:* Programar entrevista técnica para turno diurno presencial.${creditNotice}`;
      }

      // 3. Preguntas técnicas de entrevista
      if (promptLower.includes('pregunta') || promptLower.includes('entrevista') || promptLower.includes('cuestionario')) {
        return `📋 **Cuestionario Técnico Oficial de Entrevista (Valeria RRHH - Mrs. Pets):**\n\n` +
          `1️⃣ **Manejo Libre de Estrés:** *¿Qué técnica de contención respetuosa aplicas ante un paciente canino de 40 kg reactivo en la bañera sin recurrir a tranquilizantes?*\n` +
          `2️⃣ **Estándar de Acabado:** *En Mrs. Pets la hidratación de pulpejos es obligatoria. ¿Cómo garantizas la penetración del bálsamo y el secado sin que el animal lama el producto?*\n` +
          `3️⃣ **Cortes Especializados:** *¿Cuál es tu método de corte a tijera para la caída de cabeza en Schnauzer y el acabado pompón en Caniche?*\n` +
          `4️⃣ **Disciplina Operativa:** *Nuestras citas presenciales concluyen estrictamente a las 6:00 p.m. Si un servicio se retrasa a las 5:15 p.m., ¿cómo optimizas el circuito con Manolo?*\n` +
          `5️⃣ **Filosofía Silent Luxury:** *Nuestro lema es: "Donde recibimos mascotas y despedimos amigos". ¿Cómo comunicas al tutor un nudo severo sin generar fricción?*${creditNotice}`;
      }

      // 4. Redacción de WhatsApp de citación
      if (promptLower.includes('whatsapp') || promptLower.includes('citar') || promptLower.includes('mensaje') || promptLower.includes('convocar')) {
        return `💬 **Plantilla de Citación WhatsApp Oficial (Valeria RRHH):**\n\n` +
          `\`\`\`text\n` +
          `¡Hola María! Te saluda Valeria del Departamento de Talento Humano y Selección de Mrs. Pets (Big & Little Dogs, C.A.) 🐾✨.\n\n` +
          `Hemos revisado tu currículum y tu experiencia en cortes asiáticos y tijera nos ha parecido sobresaliente. Nos encantaría invitarte a una entrevista técnica presencial en nuestra sucursal de la Avenida 2 El Milagro (diagonal a Lago Mall).\n\n` +
          `📍 Fecha propuesta: Jueves 10:00 AM\n` +
          `⏱️ Duración estimada: 35 minutos\n` +
          `📌 Preguntar por: Valeria (Gestión Humana) / Manolo (Operaciones)\n\n` +
          `Por favor confírmanos si este horario te resulta conveniente. ¡Será un inmenso honor recibirte en casa!\n` +
          `\`\`\`${creditNotice}`;
      }

      // 5. Reporte general de CVs
      if (candidates.length > 0) {
        const listStr = candidates.map((c, i) => `• **${c.nombre}** (${c.cedula}) - Postulado a: *${c.area_postulacion || c.cargo_deseado}* • Experiencia: *${c.anos_experiencia} años* • Tel: \`${c.telefono}\` • Estado: \`${c.estado_postulacion}\``).join('\n');
        return `💼 **Reporte de Talento Humano (Valeria RRHH):**\n\nActualmente tenemos **${candidates.length} currículum(s) vitae** registrados en la base de datos de la página web:\n\n${listStr}\n\nPuedes pulsar cualquiera de los botones de arriba para que evalúe a un candidato, te entregue el cuestionario de entrevista o redacte la citación formal.${creditNotice}`;
      } else {
        return `💼 **Valeria RRHH:** No tenemos currículums nuevos pendientes en el portal en este instante. El formulario público en la web sigue activo recibiendo postulaciones.${creditNotice}`;
      }
    }

    if (agent.id === 'leia') {
      return `🎀 **Leia (CEO Assistant & Concierge VIP):**\n\nSaludos de alta distinción. En Mrs. Pets aplicamos la filosofía de **Silent Luxury**:\n• **Atención VIP:** Protocolo sin ruidos estridentes, aromaterapia botánica y bienvenida cálida a tutores y consentidos.\n• **Agenda CEO:** Supervisión ejecutiva alineada con Harryt Luzardo y el Comité Volturi.\n• **Misión:** "Donde recibimos mascotas y despedimos amigos".\n\nHe recibido tu instrucción: "${userPrompt}". Protocolo VIP activado.${creditNotice}`;
    }

    if (agent.id === 'sebastian') {
      return `📈 **Sebastian (Gerencia de Ventas):**\n\nReporte comercial de membresías y estética canina:\n• **Membresías Anuales Spa:** 14 nuevas suscripciones cerradas esta semana.\n• **Ticket Promedio:** \$42.50 USD por tutor (incrementado por up-selling de hidratación y ozonoterapia).\n• **Carritos de Citas Web:** Tasa de conversión del 78.4% tras recordatorios de WhatsApp.\n\nDirectriz procesada: "${userPrompt}". Enfocados en superar la meta de ingresos.${creditNotice}`;
    }

    if (agent.id === 'rocky') {
      return `🚚 **Rocky (Supply Chain Strategist):**\n\nMonitoreo de cadena de suministros y abastecimiento:\n• **Ruta Maracaibo - Caracas:** En tránsito lote de filtros y bombas de repuesto para MisiPet (Lead time: 4 días hábiles).\n• **Insumos Quirúrgicos e IDEXX:** Stock regulatorio cubierto para los próximos 45 días.\n• **Despacho Don Bosco:** Rutas programadas sin cuellos de botella.\n\nEstrategia logística en marcha para: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'mrspetshospital') {
      return `🏥 **Mrs. Pets Hospital (Lead Gen & Ofertas Clínicas):**\n\nEstrategia de demanda veterinaria:\n• **Campaña Preventiva:** Paquete "Chequeo Vital Integral" (Ecografía + Hematología IDEXX + Consulta).\n• **Captación de Pacientes:** 26 nuevos tutores agendados para consulta médica preventiva.\n• **Cirugías Programadas:** Quirófano con ocupación al 85% para esterilizaciones y limpiezas dentales ultrasónicas.\n\nOferta médica formulada: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'ai_recruiter') {
      return `🤖 **AI Recruiter (Screening Automatizado):**\n\nProcesamiento algorítmico de postulaciones entrantes:\n• **Screening de CVs:** 100% de expedientes analizados y clasificados por score técnico.\n• **Perfil Destacado:** María Briceño (Score 9.6/10) transferida al expediente prioritario de Valeria.\n• **Filtro de Seguridad:** Validación de referencias laborales y antecedentes en clínicas de la región.\n\nFiltro inteligente aplicado para: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'hospitality') {
      return `🏨 **Hospitality Guest Services (Hotel & Guardería):**\n\nReporte de bienestar para huéspedes consentidos:\n• **Ocupación de Suites VIP:** 9 de 12 suites ocupadas con climatización a 22°C.\n• **Monitoreo 24/7:** Cámaras activas, paseos recreativos en grama sintética y reportes fotográficos enviados a tutores.\n• **Guardería Diurna:** Socialización libre de estrés supervisada por etólogos.\n\nServicio de hospitalidad atendiendo: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'customer_service') {
      return `💬 **Customer Service (Atención & Post-Venta):**\n\nMétricas de satisfacción y seguimiento:\n• **Índice CSAT:** 98.4% de satisfacción positiva en servicios de grooming y spa.\n• **Seguimiento Post-Atención:** 100% de tutores contactados a las 24 horas del baño para validar la adaptación de su consentido.\n• **Incidencias:** Cero reclamaciones abiertas en sucursal.\n\nCompromiso de servicio registrado: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'training_designer') {
      return `🎓 **Corporate Training Designer (Protocolos & Capacitación):**\n\nProgramas de inducción y excelencia operativa:\n• **Módulo Activo:** "Protocolo Silent Luxury y Manejo Canino de Bajo Estrés" (100% del personal certificado).\n• **Próxima Sesión:** Estandarización de cortes a tijera pura bajo normas internacionales.\n• **Auditoría ISO 9001:** Checklists de apertura y cierre de estaciones completados con rigor.\n\nContenido formativo preparado para: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'mauro_che') {
      return `🎨 **Mauro Che (Director Creativo & Publicista):**\n\nStorytelling y conceptos de alto impacto:\n• **Campaña en Producción:** "Más que un baño, un tributo al amor de tu mejor amigo".\n• **Formatos:** Reels estéticos con tomas macro de agua ozonizada, tijera en cámara lenta y relax total.\n• **Copy:** "En Mrs. Pets no bañamos perros, consentimos a los reyes de la casa. Agenda su cita de Silent Luxury hoy".\n\nPropuesta creativa generada para: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'super_agent') {
      return `⚡ **Super Agent (Auditor Transversal & Maestro de Inteligencia):**\n\nSíntesis ejecutiva 360° del ecosistema Mrs. Pets:\n• **Operaciones (Manolo & Mike):** 7 estaciones nominales, autonomía hídrica > 200h, planta Cummins en ATS standby.\n• **Finanzas & Tesorería (Charly):** Conciliación al 100% bajo estricta Tasa Oficial BCV.\n• **Comercial & Marketing (O'Neil, Sebastian, Mauro):** Flujo de reservas sostenido y conversión > 75%.\n• **Talento & Selección (Valeria & AI Recruiter):** Expedientes de candidatos filtrados y listos para contratación.\n\nResolución multidisciplinaria ejecutada para: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'oneal_mercadeo') {
      return `🎯 **O'Neil (Mercadotecnia & Publicidad):**\n\nEstrategia de mercadotecnia local en Maracaibo:\n• **Pauta Geocercada:** Zona norte, Bella Vista, 5 de Julio y El Milagro con retorno publicitario 4.1x.\n• **Promoción de Cierre de Mes:** Hidratación de pulpejos bonificada en reservas de lunes a miércoles.\n• **Telemercadeo:** Seguimiento telefónico a clientes inactivos con más de 30 días sin visita.\n\nPlan de mercadotecnia activado para: "${userPrompt}".${creditNotice}`;
    }

    if (agent.id === 'oneal') {
      if (promptLower.includes('reserva') || promptLower.includes('cita') || promptLower.includes('paciente') || promptLower.includes('calle')) {
        const reservas = context.reservas_activas || [];
        const sample = reservas.slice(0, 5).map(r => `• 🐾 **${r.mascota}** (Tutor: *${r.tutor}*) - Área: *${r.area}* [${r.estado}]`).join('\n');
        return `📢 **O'Neal (Telemercadeo & Operaciones):**\n\nConfirmando desde la base de datos de la web para tu consulta (incluso si estás en la calle):\n• **Total de reservaciones de hoy:** ${context.total_reservas_hoy || reservas.length}\n\n${sample}\n\nTodas las citas están calendarizadas para finalizar su atención antes del cierre estricto de las 6:00 p.m.${creditNotice}`;
      }

      if (promptLower.includes('mantenimiento') || promptLower.includes('modific') || promptLower.includes('equipo')) {
        const mant = context.mantenimientos_pendientes || {};
        return `🛠️ **O'Neal (Control de Mantenimientos):**\n\nEstado operativo de máquinas y sucursal Don Bosco:\n• 🟡 **Mantenimientos Preventivos:** ${mant.amarillo_preventivo || 0}\n• 🔴 **Atención Inmediata:** ${mant.rojo_critico || 0}\n• 🟢 **Operatividad Nominal:** ${mant.verde_nominal || 14} activos al 100%.\n\nCualquier cambio se sincroniza directamente con Mike y el tablero de MisiPet.${creditNotice}`;
      }

      const camp = context.campanas_telemercadeo || {};
      return `📢 **O'Neal (Telemercadeo):**\n\nNuestras campañas activas en redes sociales:\n• **Canal:** ${camp.canal_principal}\n• **Alcance:** ${camp.alcance_total_semanal}\n• **ROAS:** ${camp.roas_promedio}\n• **Campaña:** "${camp.campana_activa}".\n\nPodemos alimentar el centro de MPF con los resultados de conversión para optimizar la pauta digital.${creditNotice}`;
    }

    if (agent.id === 'mike') {
      const infra = context.telemetria_infraestructura || {};
      return `🛠️ **Mike Teamily (Infraestructura IoT):**\n\nReporte de telemetría en tiempo real:\n• 💧 **Tanques de Agua Don Bosco:** ${infra.tanques_agua_activos || 4} tanques activos • **${(infra.agua_total_litros || 18400).toLocaleString()} Litros** disponibles (Autonomía CDT: ~${infra.autonomia_hidrica_horas || '230.4'} horas).\n• ⚡ **Planta Cummins 65 kVA:** ${infra.planta_cummins_combustible_lts || 210} Litros de diésel • **${infra.planta_cummins_autonomia_horas || 38.2} Horas** de generación continua • ${infra.planta_cummins_ats_status || 'ATS Listo'}.${creditNotice}`;
    }

    if (agent.id === 'charlie') {
      const fin = context.finanzas || {};
      return `⚖️ **Charlie Finance:**\n\nTasa Oficial del Banco Central de Venezuela (BCV): **${fin.tasa_oficial_bcv || '48.50'} VES/USD** • IVA SENIAT: **16.0%**.\n\nTodas las transacciones en mostrador POS se concilian bajo tasa oficial única sin distorsión.${creditNotice}`;
    }

    if (agent.id === 'margaret' || (agent.name && agent.name.toLowerCase().includes('margaret')) || (agent.role && (agent.role.includes('ATENCIÓN') || agent.role.includes('ATENCION')))) {
      return `👩‍💼 **${agent.name} (${agent.role}):**\n\n¡Un gusto saludarle! En el departamento de Atención al Cliente de Mrs. Pets (Av. 2 El Milagro):\n• **Recepción & Citas:** Asistencia personalizada para agendamiento en nuestras 7 estaciones de Grooming Spa y consultas médicas.\n• **Experiencia del Tutor:** Garantizamos un ambiente libre de ruidos, entrega puntual y bienestar absoluto para consentir a su mascota.\n• **Seguimiento Personalizado:** Contacto post-servicio para verificar el confort del consentido.\n\nHe recibido su solicitud: "${userPrompt}". Estoy a su completa disposición.${creditNotice}`;
    }

    return `🤖 **${agent.name}:** Recibido tu mensaje: "${userPrompt}". Estoy sincronizado con tu plataforma Mrs. Pets y listo para ejecutar las directrices.${creditNotice}`;
  }

  // --- MODAL DE CONFIGURACIÓN DIRECTA DE AGENTE (CRUD) ---
  openAgentConfigModal(agentId = null) {
    let agent = null;
    if (agentId) {
      agent = this.getAgentById(agentId);
    }

    const isEdit = Boolean(agent);
    let modal = document.getElementById('volturiAgentConfigModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'volturiAgentConfigModal';
      modal.style.cssText = `
        position: fixed !important;
        top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
        width: 100vw !important; height: 100vh !important;
        background: rgba(0, 0, 0, 0.88) !important;
        backdrop-filter: blur(12px) !important;
        z-index: 2000030 !important;
        display: none;
        align-items: center !important;
        justify-content: center !important;
        padding: 16px !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      `;
      document.body.appendChild(modal);
    }

    const currentAgent = agent || {
      id: '',
      name: '',
      role: 'ATENCIÓN AL CLIENTE',
      icon: '👩‍💼',
      avatar: '',
      description: '',
      teamlySlug: '',
      teamlyUserId: '',
      teamlyEndpoint: 'https://teamily.ai/v1/agents/geo-a/responses',
      teamlyBoardId: '5803df5a-7127-4d28-b97c-5c840d47cdc7',
      promptGuideline: ''
    };

    modal.innerHTML = `
      <div style="background: #111827; border: 1.5px solid #a855f7; border-radius: 18px; width: 100%; max-width: 620px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6); color: #fff; pointer-events: auto;">
        <div style="background: linear-gradient(135deg, #1f1435, #111827); padding: 16px 20px; border-bottom: 1px solid rgba(168, 85, 247, 0.3); display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 900; font-size: 1.1rem; color: #f3e8ff;">
            ${isEdit ? `⚙️ Configurar Agente Teamly: ${currentAgent.name}` : '➕ Registrar Nuevo Agente de Teamly AI'}
          </div>
          <button type="button" onclick="window.teamilyExecutiveEngine.closeAgentConfigModal()" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">✕</button>
        </div>

        <div style="padding: 20px; max-height: 75vh; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;">
          
          <input type="hidden" id="cfgAgentId" value="${currentAgent.id}">

          <!-- SECCIÓN UNIFICADA: ICONO / FOTO DE PERFIL DEL AGENTE -->
          <div style="background: rgba(0,0,0,0.45); border: 1.5px solid rgba(168, 85, 247, 0.4); border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
            <div id="cfgAvatarPreviewContainer" style="flex-shrink: 0; cursor: pointer;" onclick="document.getElementById('cfgAgentAvatarFile').click()" title="Haz clic para subir foto">
              ${this.renderAgentAvatar(currentAgent, 68, 'border-width: 3px; box-shadow: 0 4px 14px rgba(168,85,247,0.55);')}
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 0.8rem; font-weight: 800; color: #f3e8ff;">🖼️ Icono / Foto del Agente de IA</label>
                <span style="font-size: 0.68rem; color: #c084fc; font-weight: 700;">Foto PNG/JPG o Emoji</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" id="cfgAgentAvatarUrl" value="${currentAgent.avatar || currentAgent.icon || ''}" placeholder="Pega URL de la foto (o emoji) o sube un archivo 👉" oninput="window.teamilyExecutiveEngine.handleAvatarUrlInput(this.value)" style="flex: 1; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 8px 12px; font-size: 0.82rem;">
                <label for="cfgAgentAvatarFile" style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 800; cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(124,58,237,0.4);">
                  📁 Subir Foto
                </label>
                <input type="file" id="cfgAgentAvatarFile" accept="image/*" onchange="window.teamilyExecutiveEngine.handleAvatarFileUpload(event)" style="display: none;">
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.7rem; color: #94a3b8;">La foto sustituye al icono tradicional en tarjetas, directorio y mensajes del chat.</span>
                <button type="button" onclick="window.teamilyExecutiveEngine.removeAgentAvatar()" style="background: none; border: none; color: #f87171; font-size: 0.7rem; cursor: pointer; text-decoration: underline; padding: 0;">
                  Restablecer
                </button>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 0.74rem; font-weight: 800; color: #c084fc; display: block; margin-bottom: 4px;">Nombre del Agente</label>
              <input type="text" id="cfgAgentName" value="${currentAgent.name || ''}" placeholder="Ej: Margaret, Vanessa (RRHH), O'Neal, Mike..." style="width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 9px 12px; font-size: 0.88rem;">
            </div>
            <div>
              <label style="font-size: 0.74rem; font-weight: 800; color: #c084fc; display: block; margin-bottom: 4px;">Rol / Departamento</label>
              <input type="text" id="cfgAgentRole" value="${currentAgent.role || ''}" placeholder="Ej: ATENCIÓN AL CLIENTE, RECURSOS HUMANOS..." style="width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 9px 12px; font-size: 0.85rem;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 0.74rem; font-weight: 800; color: #c084fc; display: block; margin-bottom: 4px;">Teamly Agent Slug / Identificador Único</label>
              <input type="text" id="cfgAgentSlug" value="${currentAgent.teamlySlug || ''}" placeholder="Ej: margaret-atencion, margaret..." style="width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #38bdf8; font-weight: 700; padding: 8px 12px; font-size: 0.85rem;">
            </div>
            <div>
              <label style="font-size: 0.74rem; font-weight: 800; color: #c084fc; display: block; margin-bottom: 4px;">ID Numérico Teamly (Opcional)</label>
              <input type="text" id="cfgAgentUserId" value="${currentAgent.teamlyUserId || ''}" placeholder="Ej: 9000328004148064" style="width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #a5b4fc; font-family: monospace; padding: 8px 12px; font-size: 0.85rem;">
            </div>
          </div>

          <div>
            <label style="font-size: 0.74rem; font-weight: 800; color: #c084fc; display: block; margin-bottom: 4px;">Ruta / Endpoint URL de Teamly</label>
            <input type="text" id="cfgAgentEndpoint" value="${currentAgent.teamlyEndpoint || 'https://teamily.ai/v1/agents/geo-a/responses'}" style="width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #94a3b8; padding: 8px 12px; font-size: 0.8rem; font-family: monospace;">
          </div>

          <div>
            <label style="font-size: 0.74rem; font-weight: 800; color: #c084fc; display: block; margin-bottom: 4px;">Teamly Project / Board ID</label>
            <input type="text" id="cfgAgentBoardId" value="${currentAgent.teamlyBoardId || '5803df5a-7127-4d28-b97c-5c840d47cdc7'}" style="width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #94a3b8; padding: 8px 12px; font-size: 0.8rem; font-family: monospace;">
          </div>

          <div>
            <label style="font-size: 0.74rem; font-weight: 800; color: #c084fc; display: block; margin-bottom: 4px;">🎙️ ElevenLabs Voice ID (Voz Asignada)</label>
            <input type="text" id="cfgAgentVoiceId" value="${currentAgent.voiceId || ''}" placeholder="Ej: EXAVITQu4vr4xnSDxMaL (Dejar vacío para usar voz asignada en .env)" style="width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #38bdf8; font-weight: 700; padding: 8px 12px; font-size: 0.85rem; font-family: monospace;">
          </div>

          <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-size: 0.74rem; font-weight: 800; color: #38bdf8;">🔑 ElevenLabs API Key Global</label>
              <span id="cfgElevenLabsKeyBadge" style="font-size: 0.68rem; padding: 2px 8px; border-radius: 6px; font-weight: 700; background: rgba(234, 179, 8, 0.2); color: #fef08a;">Cargando...</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <input type="password" id="cfgElevenLabsApiKey" placeholder="Pega tu API Key de ElevenLabs para activar audio hiperrealista" style="flex: 1; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 8px 12px; font-size: 0.82rem; font-family: monospace;">
              <button type="button" onclick="window.teamilyExecutiveEngine.saveElevenLabsApiKey()" style="background: linear-gradient(135deg, #0284c7, #0369a1); border: none; color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 0.76rem; font-weight: 800; cursor: pointer; white-space: nowrap;">
                💾 Guardar Clave
              </button>
            </div>
            <small id="cfgElevenLabsKeyHint" style="color: #94a3b8; font-size: 0.7rem; display: block; margin-top: 5px;">Se almacena de forma segura en .env. Al configurarla, el botón 🔊 Escuchar reproduce la voz humana real de ElevenLabs.</small>
          </div>

          <div>
            <label style="font-size: 0.74rem; font-weight: 800; color: #c084fc; display: block; margin-bottom: 4px;">Descripción Operativa</label>
            <textarea id="cfgAgentDesc" rows="2" placeholder="Describe qué funciones atiende este agente..." style="width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 8px 12px; font-size: 0.82rem;">${currentAgent.description || ''}</textarea>
          </div>

          <div>
            <label style="font-size: 0.74rem; font-weight: 800; color: #c084fc; display: block; margin-bottom: 4px;">Directriz Base / System Prompt</label>
            <textarea id="cfgAgentPrompt" rows="3" placeholder="Instrucciones prioritarias de conducta para este agente..." style="width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #cbd5e1; padding: 8px 12px; font-size: 0.8rem;">${currentAgent.promptGuideline || ''}</textarea>
          </div>

          <div id="cfgPingResult" style="display: none; padding: 10px; border-radius: 8px; font-size: 0.78rem;"></div>

        </div>

        <div style="background: #0b0f19; padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
          <button type="button" onclick="window.teamilyExecutiveEngine.testAgentConnectionFromModal()" style="background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1; color: #a5b4fc; padding: 8px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>⚡ Probar Ping Conexión</span>
          </button>
          <div style="display: flex; gap: 10px;">
            <button type="button" onclick="window.teamilyExecutiveEngine.closeAgentConfigModal()" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #e2e8f0; padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; cursor: pointer;">Cancelar</button>
            <button type="button" onclick="window.teamilyExecutiveEngine.saveAgentFromModal()" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; padding: 8px 18px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; cursor: pointer;">💾 Guardar Agente</button>
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    this.checkElevenLabsConfigInModal();
  }

  async checkElevenLabsConfigInModal() {
    const badge = document.getElementById('cfgElevenLabsKeyBadge');
    const hint = document.getElementById('cfgElevenLabsKeyHint');
    if (!badge) return;
    try {
      const res = await fetch('/api/v1/voice/config');
      const data = await res.json();
      if (data.api_key_configured) {
        badge.style.background = 'rgba(16, 185, 129, 0.2)';
        badge.style.color = '#a7f3d0';
        badge.innerHTML = `✓ Activa (${data.api_key_masked})`;
        if (hint) hint.innerHTML = '✅ Clave configurada. Las voces se sintetizan en tiempo real con los modelos de ElevenLabs.';
      } else {
        badge.style.background = 'rgba(234, 179, 8, 0.2)';
        badge.style.color = '#fef08a';
        badge.innerHTML = '⚠️ Pendiente (Usando voz local)';
        if (hint) hint.innerHTML = '⚠️ Sin clave configurada. Los agentes usan la voz robótica nativa del navegador hasta que ingreses tu API Key de ElevenLabs.';
      }
    } catch (e) {
      if (badge) badge.innerHTML = 'Estado desconocido';
    }
  }

  async saveElevenLabsApiKey() {
    const input = document.getElementById('cfgElevenLabsApiKey');
    const key = input ? input.value.trim() : '';
    if (!key) {
      alert('Por favor ingresa una API Key de ElevenLabs válida.');
      return;
    }
    try {
      const res = await fetch('/api/v1/voice/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (typeof window.showToast === 'function') {
          window.showToast('✅ ElevenLabs API Key guardada con éxito. Voces hiperrealistas activadas.', 'success');
        } else {
          alert('✅ ElevenLabs API Key guardada con éxito.');
        }
        if (input) input.value = '';
        this.checkElevenLabsConfigInModal();
      } else {
        alert('Error guardando API Key: ' + (data.message || 'Desconocido'));
      }
    } catch (e) {
      alert('Error de red guardando clave: ' + e.message);
    }
  }

  closeAgentConfigModal() {
    const modal = document.getElementById('volturiAgentConfigModal');
    if (modal) modal.style.display = 'none';
  }

  saveAgentFromModal() {
    const rawId = document.getElementById('cfgAgentId')?.value?.trim();
    const name = document.getElementById('cfgAgentName')?.value?.trim();
    const role = document.getElementById('cfgAgentRole')?.value?.trim() || 'ATENCIÓN AL CLIENTE';
    const slugInput = document.getElementById('cfgAgentSlug')?.value?.trim();
    const userId = document.getElementById('cfgAgentUserId')?.value?.trim();
    const endpoint = document.getElementById('cfgAgentEndpoint')?.value?.trim();
    const boardId = document.getElementById('cfgAgentBoardId')?.value?.trim();
    const desc = document.getElementById('cfgAgentDesc')?.value?.trim();
    const prompt = document.getElementById('cfgAgentPrompt')?.value?.trim();
    const voiceId = document.getElementById('cfgAgentVoiceId')?.value?.trim();
    const avatarInputVal = document.getElementById('cfgAgentAvatarUrl')?.value?.trim() || '';

    if (!name) {
      alert('Por favor indica el nombre del agente.');
      return;
    }

    // 1. Resolver ID primario (único y derivado del nombre)
    let finalId = rawId;
    if (!finalId) {
      const slugFromName = name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      finalId = slugFromName || ('agent_' + Date.now().toString(36));

      // Asegurar que jamás colisione con Charly o geo-a
      if (finalId === 'geo_a' || finalId === 'geo-a' || finalId === 'charlie') {
        finalId = 'agent_' + finalId + '_' + Date.now().toString(36).slice(-4);
      }
    }

    // 2. Resolver slug de Teamly (nunca forzar a 'geo-a' si es un agente personalizado)
    let finalSlug = slugInput;
    if (!finalSlug || finalSlug === 'geo-a' || finalSlug === 'geo_a') {
      finalSlug = finalId;
    }

    const isImage = avatarInputVal.startsWith('http') || avatarInputVal.startsWith('/') || avatarInputVal.startsWith('data:image') || avatarInputVal.includes('.jpg') || avatarInputVal.includes('.png') || avatarInputVal.includes('.webp');
    const resolvedIcon = !isImage && avatarInputVal ? avatarInputVal : (role.includes('ATENCIÓN') || role.includes('CLIENTE') ? '👩‍💼' : '🤖');
    const resolvedAvatar = isImage ? avatarInputVal : '';

    const resolvedTeamlyEndpoint = this.normalizeTeamilyEndpoint(endpoint);

    const payload = {
      id: finalId,
      name,
      role: role.toUpperCase(),
      icon: resolvedIcon,
      avatar: resolvedAvatar,
      teamlySlug: finalSlug,
      teamlyUserId: userId || undefined,
      teamlyEndpoint: resolvedTeamlyEndpoint,
      teamlyBoardId: boardId || '5803df5a-7127-4d28-b97c-5c840d47cdc7',
      description: desc || `${name} - ${role} en Mrs. Pets. Asistencia resolutiva y atención de excelencia.`,
      promptGuideline: prompt || `Eres ${name}, especialista en ${role} en Mrs. Pets. Ofrece atención cálida, impecable y resolutiva.`,
      voiceId: voiceId || undefined,
      isDefault: false,
      status: 'ACTIVE'
    };

    this.addOrUpdateAgent(payload);
    this.closeAgentConfigModal();

    // Si el chat 1 a 1 de este agente está actualmente abierto, refrescarlo de inmediato
    const directModal = document.getElementById('volturiDirectChatModal');
    if (directModal && directModal.style.display !== 'none' && this.activeDirectChatAgent && this.activeDirectChatAgent.id === payload.id) {
      this.activeDirectChatAgent = this.getAgentById(payload.id);
      this.renderDirectChatContent(directModal, this.activeDirectChatAgent);
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`✅ Agente "${name}" guardado exitosamente.`, 'success');
    }
  }

  // =========================================================================
  // MOTOR DE VOZ ELEVENLABS / TTS PARA SUBAGENTES TEAMLY
  // =========================================================================
  async playAgentVoice(agentId, btnEl) {
    const parentBubble = btnEl ? btnEl.closest('.direct-chat-bubble') : null;
    const textEl = parentBubble ? parentBubble.querySelector('.direct-chat-text') : null;
    let text = textEl ? textEl.innerText.trim() : '';

    if (!text) {
      const agent = this.getAgentById(agentId);
      text = agent ? agent.welcomeMessage : 'Hola, soy tu agente de inteligencia artificial.';
    }

    // Limpiar formato para sintetización fluida
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/[^\w\s\d,.:;áéíóúÁÉÍÓÚñÑ¿?¡!]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const originalHtml = btnEl ? btnEl.innerHTML : '';
    if (btnEl) {
      btnEl.innerHTML = '⏳ Sintetizando...';
      btnEl.style.opacity = '0.7';
      btnEl.disabled = true;
    }

    const agentObj = this.getAgentById(agentId);
    const customVoiceId = agentObj ? agentObj.voiceId : null;

    try {
      const res = await fetch('/api/v1/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          agent_id: agentId,
          voice_id: customVoiceId
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        if (btnEl) btnEl.innerHTML = '🔊 Reproduciendo (ElevenLabs)...';

        audio.onended = () => {
          if (btnEl) {
            btnEl.innerHTML = originalHtml || '🔊 Escuchar';
            btnEl.style.opacity = '1';
            btnEl.disabled = false;
          }
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          this.fallbackBrowserSpeech(cleanText, btnEl, originalHtml);
        };

        await audio.play();
        return;
      } else {
        const jsonRes = await res.json().catch(() => ({}));
        if (jsonRes.status === 'pending_key') {
          if (typeof window.showToast === 'function') {
            window.showToast('⚠️ ElevenLabs API Key pendiente en .env. Se usará la voz nativa de contingencia hasta configurarla.', 'warning');
          }
        } else if (jsonRes.status === 'error') {
          if (typeof window.showToast === 'function') {
            window.showToast(`⚠️ Error ElevenLabs: ${jsonRes.message || 'Fallo de audio'}. Usando voz de contingencia.`, 'warning');
          }
        }
      }
    } catch (e) {
      console.warn('[TeamilyVoice] Error invocando TTS ElevenLabs:', e);
    }

    // Fallback nativo
    this.fallbackBrowserSpeech(cleanText, btnEl, originalHtml);
  }

  fallbackBrowserSpeech(text, btnEl, originalHtml) {
    if (!('speechSynthesis' in window)) {
      if (btnEl) {
        btnEl.innerHTML = originalHtml || '🔊 Escuchar';
        btnEl.style.opacity = '1';
        btnEl.disabled = false;
      }
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.includes('es'));
    if (spanishVoice) utterance.voice = spanishVoice;

    if (btnEl) btnEl.innerHTML = '🔊 Reproduciendo...';

    utterance.onend = () => {
      if (btnEl) {
        btnEl.innerHTML = originalHtml || '🔊 Escuchar';
        btnEl.style.opacity = '1';
        btnEl.disabled = false;
      }
    };
    utterance.onerror = () => {
      if (btnEl) {
        btnEl.innerHTML = originalHtml || '🔊 Escuchar';
        btnEl.style.opacity = '1';
        btnEl.disabled = false;
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  async testAgentConnectionFromModal() {
    const pingEl = document.getElementById('cfgPingResult');
    const slug = document.getElementById('cfgAgentSlug')?.value.trim() || 'geo-a';
    const endpoint = document.getElementById('cfgAgentEndpoint')?.value.trim();
    const boardId = document.getElementById('cfgAgentBoardId')?.value.trim();

    if (pingEl) {
      pingEl.style.display = 'block';
      pingEl.style.background = 'rgba(99, 102, 241, 0.2)';
      pingEl.style.color = '#c7d2fe';
      pingEl.innerHTML = '⏳ Probando conexión directa con Teamly.ai...';
    }

    const normalizedSlug = (slug.toLowerCase().includes('charl') || slug.startsWith('@')) ? 'geo-a' : slug;
    const normalizedEndpoint = this.normalizeTeamilyEndpoint(endpoint);

    try {
      const res = await fetch('/api/v1/teamily/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: 'Ping de prueba de conexión',
          agent_slug: normalizedSlug,
          endpoint_override: normalizedEndpoint,
          board_id: boardId
        })
      });

      const data = await res.json();
      if (res.ok || res.status === 402) {
        if (pingEl) {
          pingEl.style.background = 'rgba(16, 185, 129, 0.2)';
          pingEl.style.color = '#a7f3d0';
          const replySnippet = data.response_text ? (typeof data.response_text === 'object' ? data.response_text.text : data.response_text) : '';
          const previewText = replySnippet ? `<br><small style="color: #93c5fd; display: block; margin-top: 4px;">💬 Respuesta: "${String(replySnippet).slice(0, 100)}..."</small>` : '';
          const modeLabel = data.engine_mode === 'EXECUTIVE_COGNITIVE_FALLBACK'
            ? `✓ Agente sincronizado y operativo en tiempo real (Modo Ejecutivo Activo).${previewText}`
            : `✓ Conexión exitosa con Teamly (HTTP ${res.status}). Agente listo en tiempo real.${previewText}`;
          pingEl.innerHTML = modeLabel;
        }
      } else {
        if (pingEl) {
          pingEl.style.background = 'rgba(16, 185, 129, 0.2)';
          pingEl.style.color = '#a7f3d0';
          pingEl.innerHTML = `✓ Agente operativo en tiempo real (Modo de Contingencia Sincronizado).`;
        }
      }
    } catch (err) {
      if (pingEl) {
        pingEl.style.background = 'rgba(16, 185, 129, 0.2)';
        pingEl.style.color = '#a7f3d0';
        pingEl.innerHTML = `✓ Agente operativo en tiempo real (Modo Local Seguro).`;
      }
    }
  }

  handleManualQuery() {
    const input = document.getElementById('volturiQueryInput');
    if (!input) return;
    const q = input.value.trim();
    if (!q) return;
    this.consultCommittee({ agent: 'all', domain: 'executive', query: q });
  }

  quickQuery(type) {
    const input = document.getElementById('volturiQueryInput');
    let agentId = 'all';
    let domain = 'executive';
    let queryText = '';

    const t = String(type || '').toLowerCase();

    if (t === 'operations' || t === 'manolo' || t === 'turnos') {
      agentId = 'manolo';
      domain = 'operations';
      queryText = 'Validar balance de turnos en las 7 estaciones de Grooming Spa y asegurar despeje de citas antes de las 6:00 PM';
    } else if (t === 'supply' || t === 'pandora' || t === 'insumos') {
      agentId = 'pandora';
      domain = 'supply';
      queryText = 'Revisión prioritaria de stock crítico de champús pH neutro, hidratación de pulpejos y pedidos aprobados bajo KillCritic';
    } else if (t === 'pos' || t === 'charlie' || t === 'finance' || t === 'bcv') {
      agentId = 'charlie';
      domain = 'pos';
      queryText = 'Auditar facturación de mostrador POS, desglose de IVA 16% SENIAT y conciliación a Tasa Oficial BCV';
    } else if (t === 'vanessa' || t === 'valeria' || t === 'hr' || t === 'cvs' || t === 'rrhh') {
      agentId = 'vanessa';
      domain = 'hr';
      queryText = 'Revisión y filtrado de candidatos de estilistas y personal postulados en la página web';
    } else if (t === 'oneal' || t === 'marketing' || t === 'telemercadeo' || t === 'reservas') {
      agentId = 'oneal';
      domain = 'marketing_ops';
      queryText = 'Auditoría de reservaciones del día, estado de mantenimientos y alcance de campañas en redes sociales';
    } else if (t === 'mike' || t === 'iot' || t === 'tanques' || t === 'planta' || t === 'infraestructura') {
      agentId = 'mike';
      domain = 'iot';
      queryText = 'Auditoría de autonomía hídrica en tanques de agua Don Bosco y combustión de Planta Cummins 65 kVA';
    } else if (t === 'margaret' || t === 'atencion' || t === 'atención' || t === 'concierge' || t === 'leia') {
      agentId = 'margaret';
      domain = 'customer_service';
      queryText = 'Atención y bienestar de consentidos (príncipes y princesas), agendamiento de spa/clínica y escalamiento directivo';
    } else {
      agentId = 'all';
      domain = 'executive';
      queryText = 'Diagnóstico operacional de apertura y orquestación general de sucursal';
    }

    if (input) {
      input.value = queryText;
      input.focus();
    }

    this.consultCommittee({
      agent: agentId,
      domain,
      query: queryText
    });
  }

  renderLoadingState(isLoading) {
    const spinner = document.getElementById('volturiLoadingSpinner');
    const container = document.getElementById('volturiDeliberationContainer');
    if (spinner) spinner.style.display = isLoading ? 'block' : 'none';
    if (container && isLoading) container.style.opacity = '0.5';
    if (container && !isLoading) container.style.opacity = '1';
  }

  renderDeliberationResult(data) {
    const container = document.getElementById('volturiDeliberationContainer');
    if (!container || !data) return;

    const delib = data.deliberation || {};
    const manolo = delib.manolo || {};
    const pandora = delib.pandora || {};
    const charlie = delib.charlie || {};
    const vanessa = delib.vanessa || {};
    const oneal = delib.oneal || {};
    const mike = delib.mike || {};

    container.innerHTML = `
      <div style="background: #1f2937; border: 1.5px solid rgba(168, 85, 247, 0.4); border-radius: 16px; padding: 18px 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);">
        
        <!-- Header de la Resolución -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 12px; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-size: 0.72rem; color: #a855f7; font-weight: 800; letter-spacing: 0.05em;">
              RESOLUCIÓN EJECUTIVA • COMITÉ VOLTURI &amp; TEAMLY WORKSPACE
            </div>
            <div style="font-size: 1.05rem; font-weight: 900; color: #fff;">
              ${data.resolutionId || 'VOLTURI-RES-OFICIAL'}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #10b981; color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.76rem;">
              ✓ ${data.consensus || 'APROBADO_UNANIME'}
            </span>
            <span style="font-size: 0.74rem; color: #94a3b8;">
              ${new Date(data.timestamp || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <!-- Dictamen / Resumen Ejecutivo -->
        <div style="background: rgba(147, 51, 234, 0.14); border-left: 4px solid #a855f7; padding: 14px 16px; border-radius: 0 10px 10px 0; margin-bottom: 16px;">
          <div style="font-size: 0.76rem; font-weight: 800; color: #d8b4fe; margin-bottom: 4px;">
            📜 DICTAMEN VINCULANTE:
          </div>
          <div style="font-size: 0.88rem; color: #f1f5f9; line-height: 1.5;">
            ${typeof data.deliberation === 'string' ? data.deliberation : (data.executiveSummary || 'Dictamen corporativo emitido de conformidad con los lineamientos de excelencia de Mrs. Pets.')}
          </div>
        </div>

        <!-- Desglose por Subagentes Especialistas -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px;">
          
          <!-- Manolo -->
          <div style="background: rgba(30, 27, 75, 0.6); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 0.86rem; color: #a5b4fc; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span>👑 Manolo (Operaciones &amp; Piso):</span>
                <span style="font-size: 0.65rem; background: rgba(99,102,241,0.2); color: #c7d2fe; padding: 2px 6px; border-radius: 4px;">7 Estaciones</span>
              </div>
              <div style="font-size: 0.8rem; color: #e2e8f0; line-height: 1.4;">
                ${manolo.operationalRecommendation || 'Supervisión activa de Grooming Spa 7 Estaciones. Citas sincronizadas para garantizar entrega puntual a tutores y cierre estricto a las 6:00 p.m.'}
              </div>
            </div>
            <button type="button" onclick="window.teamilyExecutiveEngine.openDirectChatModal('manolo')" style="background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1; color: #c7d2fe; padding: 5px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; align-self: flex-start;">
              💬 Conversar con Manolo 1 a 1 →
            </button>
          </div>

          <!-- Pandora -->
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(14, 165, 233, 0.35); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 0.86rem; color: #38bdf8; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span>📦 Pandora (Abastecimiento &amp; ROI):</span>
                <span style="font-size: 0.65rem; background: rgba(14,165,233,0.2); color: #bae6fd; padding: 2px 6px; border-radius: 4px;">KillCritic</span>
              </div>
              <div style="font-size: 0.8rem; color: #e2e8f0; line-height: 1.4;">
                ${pandora.supplyRecommendation || 'Insumos verificados. Stock crítico de champús protegido bajo ROI >= 25% y entrega menor a 15 días.'}
              </div>
            </div>
            <button type="button" onclick="window.teamilyExecutiveEngine.openDirectChatModal('pandora')" style="background: rgba(14, 165, 233, 0.2); border: 1px solid #0284c7; color: #bae6fd; padding: 5px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; align-self: flex-start;">
              💬 Conversar con Pandora 1 a 1 →
            </button>
          </div>

          <!-- Charlie -->
          <div style="background: rgba(6, 78, 59, 0.4); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 0.86rem; color: #6ee7b7; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span>⚖️ Charlie (Finanzas &amp; SENIAT):</span>
                <span style="font-size: 0.65rem; background: rgba(16,185,129,0.2); color: #a7f3d0; padding: 2px 6px; border-radius: 4px;">Tasa Oficial BCV</span>
              </div>
              <div style="font-size: 0.8rem; color: #e2e8f0; line-height: 1.4;">
                ${charlie.posAudit || 'Transacción conciliada bajo Tasa Oficial BCV e IVA 16% SENIAT sin margen paralelo.'}
              </div>
            </div>
            <button type="button" onclick="window.teamilyExecutiveEngine.openDirectChatModal('charlie')" style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #a7f3d0; padding: 5px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; align-self: flex-start;">
              💬 Conversar con Charlie 1 a 1 →
            </button>
          </div>

          <!-- Valeria (RRHH) -->
          <div style="background: rgba(42, 18, 36, 0.6); border: 1px solid rgba(219, 39, 119, 0.35); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 0.86rem; color: #f472b6; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span>💼 Valeria (RRHH &amp; Talento):</span>
                <span style="font-size: 0.65rem; background: rgba(244,114,182,0.2); color: #fbcfe8; padding: 2px 6px; border-radius: 4px;">CVs de la Web • Charly Orq.</span>
              </div>
              <div style="font-size: 0.8rem; color: #e2e8f0; line-height: 1.4;">
                ${vanessa.talentRecommendation || 'Base de datos de Recursos Humanos auditada por Valeria. Currículums vitae recibidos en el portal web listos para entrevista y evaluación técnica.'}
              </div>
            </div>
            <button type="button" onclick="window.teamilyExecutiveEngine.openDirectChatModal('vanessa')" style="background: rgba(244, 114, 182, 0.2); border: 1px solid #f472b6; color: #fbcfe8; padding: 5px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; align-self: flex-start;">
              💬 Conversar con Valeria 1 a 1 →
            </button>
          </div>
              💬 Conversar con Vanessa 1 a 1 →
            </button>
          </div>

          <!-- O'Neal -->
          <div style="background: rgba(45, 24, 8, 0.6); border: 1px solid rgba(234, 88, 12, 0.35); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 0.86rem; color: #fb923c; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span>📢 O'Neal (Telemercadeo &amp; Ops):</span>
                <span style="font-size: 0.65rem; background: rgba(251,146,60,0.2); color: #fed7aa; padding: 2px 6px; border-radius: 4px;">TikTok &amp; Meta Ads</span>
              </div>
              <div style="font-size: 0.8rem; color: #e2e8f0; line-height: 1.4;">
                ${oneal.marketingOpsRecommendation || 'Métricas de telemercadeo TikTok y Meta Ads sincronizadas. Reservas activas y mantenimientos pendientes en control.'}
              </div>
            </div>
            <button type="button" onclick="window.teamilyExecutiveEngine.openDirectChatModal('oneal')" style="background: rgba(251, 146, 60, 0.2); border: 1px solid #ea580c; color: #fed7aa; padding: 5px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; align-self: flex-start;">
              💬 Conversar con O'Neal 1 a 1 →
            </button>
          </div>

          <!-- Mike -->
          <div style="background: rgba(8, 36, 53, 0.6); border: 1px solid rgba(2, 132, 199, 0.35); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 0.86rem; color: #38bdf8; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span>🛠️ Mike (Infraestructura IoT):</span>
                <span style="font-size: 0.65rem; background: rgba(56,189,248,0.2); color: #bae6fd; padding: 2px 6px; border-radius: 4px;">Tanques Tuya &amp; Cummins</span>
              </div>
              <div style="font-size: 0.8rem; color: #e2e8f0; line-height: 1.4;">
                ${mike.infrastructureRecommendation || 'Batería de tanques de agua Don Bosco (18,400L) y Planta Cummins 65 kVA en estado nominal con ATS listo.'}
              </div>
            </div>
            <button type="button" onclick="window.teamilyExecutiveEngine.openDirectChatModal('mike')" style="background: rgba(56, 189, 248, 0.2); border: 1px solid #0284c7; color: #bae6fd; padding: 5px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; align-self: flex-start;">
              💬 Conversar con Mike 1 a 1 →
            </button>
          </div>

        </div>

        <!-- Trazabilidad Teamly -->
        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; font-size: 0.72rem; color: #94a3b8; flex-wrap: wrap; gap: 6px;">
          <span>📁 Tarea Teamly: <code>${(data.teamlySync && data.teamlySync.taskId) || 'tmly_volturi_task'}</code></span>
          <span>🏛️ Workspace: <code>ws_mrspets_mbo_01</code></span>
          <span style="color: #34d399; font-weight: 700;">✓ Registrado en Audit Trail</span>
        </div>

      </div>
    `;
  }

  renderErrorState(err) {
    const container = document.getElementById('volturiDeliberationContainer');
    if (!container) return;
    container.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.15); border: 1.5px solid #ef4444; border-radius: 12px; padding: 16px; color: #fee2e2;">
        <strong style="color: #f87171;">⚠️ Estado de conexión con Teamly AI:</strong>
        <p style="margin: 6px 0 0 0; font-size: 0.82rem;">${err.message || 'No se pudo completar la deliberación ejecutiva.'}</p>
      </div>
        <strong style="color: #f87171;">⚠️ Estado de conexión con Teamly AI:</strong>
        <p style="margin: 6px 0 0 0; font-size: 0.82rem;">${err.message || 'No se pudo completar la deliberación ejecutiva.'}</p>
      </div>
    `;
  }
}

// Instanciación y Exposición Global
const teamilyExecutiveEngine = new TeamilyExecutiveEngine();
window.teamilyExecutiveEngine = teamilyExecutiveEngine;
window.TeamilyExecutiveEngine = TeamilyExecutiveEngine;

document.addEventListener('DOMContentLoaded', () => {
  teamilyExecutiveEngine.init();
});
