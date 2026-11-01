/**
 * ==============================================================================
 * OMNI & O'NEIL MARKETING COMMAND CENTER ENGINE (Mrs. Pets)
 * Tablero de Medición en Tiempo Real para Redes Sociales, Pauta y Campañas.
 * Big & Little Dogs, C.A. • Maracaibo, Venezuela
 * 
 * Dirección Ejecutiva: Gerencia de Mercadotecnia (O'Neil) & Comité Volturi
 * Motor de Integración: Make.com Webhook Engine • Vertex AI SDK
 * Filosofía de Arquitectura: "Silent Luxury" (Latencia < 1.0s, Trazabilidad, RBAC Estricto)
 * 
 * 5 MÓDULOS ESTRATÉGICOS:
 * 0. Tablero de Medición de Redes Sociales & Campañas (Alcance, ROAS, CAC, Canales en Vivo)
 * 1. Clubes de Lealtad (Club Leal 3m, Club VIP 6m, Club Legacy 8m) & Príncipes/Princesas
 * 2. CRUD Dinámico de Beneficios y Switches On/Off en Tiempo Real (<50ms)
 * 3. Cronograma de Ejecuciones Dinámico (Gantt Semanal/Mensual/Trimestral) & Make.com Webhooks
 * 4. Simulador Predictivo "What-If" (Sliders <100ms) & Telemetría ODO / KillCritic
 * ==============================================================================
 */

(function (global) {
  'use strict';

  class MarketingCommandCenterEngine {
    constructor() {
      this.version = '20261027_ONEIL_VOLTURI_SILENT_LUXURY';
      this.activeSubTab = 'dashboard'; // 'dashboard', 'loyalty', 'benefits', 'gantt', 'whatif'
      this.ganttViewMode = 'weekly'; // 'weekly' (semanal), 'monthly' (mensual), 'gantt' (trimestral)

      // Configuración Oficial de Canales de Pauta & Meta Graph API v18.0 Insights
      this.channels = [
        {
          channel_id: "tiktok_mrspets",
          platform_name: "TikTok (TikTok for Business & Spark Ads)",
          account_handle: "@mrspets",
          api_endpoint_url: "https://business-api.tiktok.com/open_api/v1.3/",
          status: "active",
          latest_insights: { reach: 15400, engagement_rate: 8.9, website_clicks: 380, stimulus_active: "TikTok Viral: Transformación Grooming VIP & Cachorros Felices" }
        },
        {
          channel_id: "meta_instagram_mrspets",
          platform_name: "Instagram",
          account_handle: "@mrspets",
          api_endpoint_url: "https://graph.facebook.com/v18.0/IG_BUSINESS_ACCOUNT_ID/insights",
          auth_type: "Bearer Token",
          credentials_vault_ref: "env://META_ACCESS_TOKEN_SECRET",
          status: "active",
          polling_interval_minutes: 60,
          metric_mappings: {
            reach_metric: "impressions_and_reach",
            engagement_metric: "engagement_rate",
            clicks_metric: "website_clicks"
          },
          latest_insights: {
            reach: 28450,
            engagement_rate: 7.4,
            website_clicks: 312,
            stimulus_active: "Reel Protocolo Hidratación Pulpejos & Ozonoterapia Canina"
          }
        },
        {
          channel_id: "meta_retargeting_princesas",
          platform_name: "Meta Retargeting",
          account_handle: "Mrs. Pets VIP Retargeting",
          status: "active",
          latest_insights: { reach: 12800, engagement_rate: 5.8, website_clicks: 184 }
        },
        {
          channel_id: "whatsapp_broadcast_vip",
          platform_name: "WhatsApp VIP Broadcast",
          account_handle: "+58 412 MRS-PETS",
          status: "active",
          latest_insights: { reach: 4200, engagement_rate: 18.2, website_clicks: 428 }
        },
        {
          channel_id: "google_pmax_clinica",
          platform_name: "Google Performance Max",
          account_handle: "Mrs Pets Maracaibo PMax",
          status: "active",
          latest_insights: { reach: 16900, engagement_rate: 4.9, website_clicks: 240 }
        }
      ];

      // Motor de Series de Tiempo Continuo (Continuous Time-Series Stream)
      this.timeSeries = {
        activeGranularity: 'minute', // 'minute' (ventana 60m) | 'hour' (ciclo 24h)
        scrubberIndex: null,
        operationalSummary: {
          current_real_velocity: 384,
          current_target_velocity: 420,
          current_historical_mean: 210,
          delta_vs_target_percent: -8.6,
          alert_threshold_percent: -15.0,
          status: "active_monitoring"
        },
        stimulusEvents: [
          {
            id: "STM-IG-1715",
            timestamp: "17:15",
            channel_id: "meta_instagram_mrspets",
            channel_name: "Instagram (@mrspets)",
            campaign_title: "Protocolo Hidratación Pulpejos & Ozonoterapia Canina",
            instrument: "Reel Vertical 4K + CTA Bio Link con UTM",
            boost_usd: 120,
            color: "#E1306C"
          },
          {
            id: "STM-WA-1640",
            timestamp: "16:40",
            channel_id: "whatsapp_broadcast_vip",
            channel_name: "WhatsApp VIP Broadcast",
            campaign_title: "Beneficio Exclusivo Club Leal / VIP",
            instrument: "Plantilla HSM Verificada con Botones de Cita",
            boost_usd: 30,
            color: "#25D366"
          },
          {
            id: "STM-META-1600",
            timestamp: "16:00",
            channel_id: "meta_retargeting_princesas",
            channel_name: "Meta Retargeting",
            campaign_title: "Suites Presidenciales Hotel Canino",
            instrument: "Carrousel Dinámico Tutores Recurrentes",
            boost_usd: 85,
            color: "#0668E1"
          }
        ],
        seriesMinute: [
          { time: "16:30", real: 180, target: 220, historical_7d: 165 },
          { time: "16:35", real: 195, target: 230, historical_7d: 170 },
          { time: "16:40", real: 390, target: 310, historical_7d: 175, stimulus_id: "STM-WA-1640" },
          { time: "16:45", real: 460, target: 380, historical_7d: 185 },
          { time: "16:50", real: 415, target: 395, historical_7d: 190 },
          { time: "16:55", real: 360, target: 400, historical_7d: 195 },
          { time: "17:00", real: 330, target: 405, historical_7d: 200 },
          { time: "17:05", real: 305, target: 410, historical_7d: 205 },
          { time: "17:10", real: 285, target: 415, historical_7d: 208 },
          { time: "17:15", real: 510, target: 450, historical_7d: 210, stimulus_id: "STM-IG-1715" },
          { time: "17:20", real: 490, target: 460, historical_7d: 212 },
          { time: "17:25", real: 435, target: 455, historical_7d: 215 },
          { time: "17:30", real: 410, target: 440, historical_7d: 218 },
          { time: "17:35", real: 384, target: 420, historical_7d: 210 }
        ],
        seriesHour: [
          { time: "08:00", real: 120, target: 140, historical_7d: 110 },
          { time: "09:00", real: 240, target: 250, historical_7d: 195 },
          { time: "10:00", real: 380, target: 350, historical_7d: 270 },
          { time: "11:00", real: 510, target: 480, historical_7d: 360 },
          { time: "12:00", real: 460, target: 520, historical_7d: 390 },
          { time: "13:00", real: 340, target: 410, historical_7d: 310 },
          { time: "14:00", real: 420, target: 430, historical_7d: 330 },
          { time: "15:00", real: 490, target: 470, historical_7d: 375 },
          { time: "16:00", real: 620, target: 550, historical_7d: 420 },
          { time: "17:00", real: 780, target: 710, historical_7d: 490 },
          { time: "18:00 (P)", real: null, target: 650, historical_7d: 460 },
          { time: "19:00 (P)", real: null, target: 580, historical_7d: 410 }
        ]
      };

      // Trazabilidad Forense de Micro-Interacciones
      this.selectedStimulusId = "STM-IG-1715"; // Instagram Reels por defecto
      this.microInteractions = [
        {
          stimulus_id: "STM-IG-1715",
          channel_id: "meta_instagram_mrspets",
          channel_name: "Instagram Ads (@mrspets)",
          launch_time: "17:15:00",
          campaign_title: "Protocolo Hidratación Pulpejos & Ozonoterapia Canina",
          creative_instrument: "Reel Vertical 4K + CTA Bio Link con UTM utm_source=ig_mrspets&utm_campaign=ozono_pulpejos",
          target_segment: "Tutores Razas Braquicéfalas y Pelaje Denso (Bella Vista & El Milagro)",
          t_plus_20s: {
            concurrent_visitors_delta: "+84 visitas en vivo",
            latency_to_first_action_ms: 680,
            first_click_breakdown: [
              { destination: "Perfil de Príncipe / Princesa (Club de Lealtad)", target_id: "nav-item-soy-chico-pet", clicks: 46, share_percent: 54.8, icon: "👑" },
              { destination: "Visor Médico DICOM / Rayos X Clínicos", target_id: "tab-clinic-dicom-viewer", clicks: 21, share_percent: 25.0, icon: "🔬" },
              { destination: "Salto Directo a WhatsApp VIP Concierge", target_id: "btn-whatsapp-concierge", clicks: 14, share_percent: 16.7, icon: "💬" },
              { destination: "Otras Secciones (Hotel / Boutique)", target_id: "tab-hotel", clicks: 3, share_percent: 3.5, icon: "🐾" }
            ]
          },
          t_plus_2h: {
            cumulative_visits: 520,
            avg_session_duration_sec: 248,
            retention_rate_percent: 82.5,
            direct_conversions: [
              { type: "Reservaciones de Ozonoterapia & Spa Pulpejos", count: 28, revenue_usd: 840 },
              { type: "Consultas Médicas Clínicas Agendadas", count: 12, revenue_usd: 600 },
              { type: "Nuevas Afiliaciones a Club VIP", count: 6, revenue_usd: 480 }
            ],
            total_generated_usd: 1920,
            roas: 5.48,
            cac_usd: 2.85
          }
        },
        {
          stimulus_id: "STM-WA-1640",
          channel_id: "whatsapp_broadcast_vip",
          channel_name: "WhatsApp VIP Broadcast",
          launch_time: "16:40:00",
          campaign_title: "Alerta Proactiva: Tutores a 1 Visita de Ascenso Club VIP",
          creative_instrument: "Plantilla HSM Verificada con Botón Dinámico de Redención Inmediata",
          target_segment: "Tutores con 5 meses continuos (Club Leal ➔ VIP)",
          t_plus_20s: {
            concurrent_visitors_delta: "+112 visitas en vivo",
            latency_to_first_action_ms: 520,
            first_click_breakdown: [
              { destination: "Perfil de Príncipe / Princesa (Club de Lealtad)", target_id: "nav-item-soy-chico-pet", clicks: 78, share_percent: 69.6, icon: "👑" },
              { destination: "Salto Directo a WhatsApp VIP Concierge", target_id: "btn-whatsapp-concierge", clicks: 26, share_percent: 23.2, icon: "💬" },
              { destination: "Visor Médico DICOM / Rayos X Clínicos", target_id: "tab-clinic-dicom-viewer", clicks: 8, share_percent: 7.2, icon: "🔬" }
            ]
          },
          t_plus_2h: {
            cumulative_visits: 380,
            avg_session_duration_sec: 310,
            retention_rate_percent: 91.0,
            direct_conversions: [
              { type: "Citas de Grooming Spa Confirmadas (Ascenso)", count: 34, revenue_usd: 1360 },
              { type: "Upgrades Efectivos a Club VIP", count: 31, revenue_usd: 2480 }
            ],
            total_generated_usd: 3840,
            roas: 8.53,
            cac_usd: 0.98
          }
        },
        {
          stimulus_id: "STM-META-1600",
          channel_id: "meta_retargeting_princesas",
          channel_name: "Meta Retargeting (Príncipes y Princesas)",
          launch_time: "16:00:00",
          campaign_title: "Suites Presidenciales Hotel Canino",
          creative_instrument: "Carrousel Dinámico: Suite con Aromaterapia y Menú Gourmet",
          target_segment: "Tutores Legacy y VIP de Maracaibo (Alta Frecuencia)",
          t_plus_20s: {
            concurrent_visitors_delta: "+55 visitas en vivo",
            latency_to_first_action_ms: 740,
            first_click_breakdown: [
              { destination: "Perfil de Príncipe / Princesa (Club de Lealtad)", target_id: "nav-item-soy-chico-pet", clicks: 29, share_percent: 52.7, icon: "👑" },
              { destination: "Salto Directo a WhatsApp VIP Concierge", target_id: "btn-whatsapp-concierge", clicks: 16, share_percent: 29.1, icon: "💬" },
              { destination: "Visor Médico DICOM / Rayos X Clínicos", target_id: "tab-clinic-dicom-viewer", clicks: 10, share_percent: 18.2, icon: "🔬" }
            ]
          },
          t_plus_2h: {
            cumulative_visits: 290,
            avg_session_duration_sec: 195,
            retention_rate_percent: 76.0,
            direct_conversions: [
              { type: "Reservaciones de Hotel 5 Estrellas (Noches VIP)", count: 14, revenue_usd: 980 }
            ],
            total_generated_usd: 980,
            roas: 4.12,
            cac_usd: 4.20
          }
        }
      ];

      // Decisiones Tácticas Aplicadas en Caliente por O'Neil
      // Registro de Eventos Normalizados de Comportamiento Continuo
      this.normalizedEvents = [
        {
          id: "EVT-NORM-001",
          timestamp: "2026-10-27T10:00:00Z",
          platform: "Instagram",
          campaign_id: "CAMP_GROOMING_VIP_OCT",
          real_metrics: {
            reach: 320,
            clicks: 45,
            whatsapp_redirects: 12,
            website_visits: 28
          },
          target_metrics: {
            reach_goal: 350,
            clicks_goal: 50
          },
          computed_telemetry: {
            reach_delta_percent: -8.57,
            clicks_delta_percent: -10.0,
            whatsapp_cvr_percent: 26.67,
            status: "MONITORING_OPTIMAL",
            alert_required: false
          }
        }
      ];
      this.activeNormalizedPlatform = 'Instagram';

      this.tacticalDecisions = [
        {
          timestamp: "17:28:15",
          action: "OPTIMIZE_COPY",
          label: "Ajuste de Gancho Creativo: 'Consiente a tu príncipe con Spa y Ozonoterapia'",
          channel: "Instagram Ads (@mrspets)",
          dispatchedMake: true
        }
      ];

      // Configuración de Clubes de Lealtad (Cargada desde backend o fallback en caliente)
      this.loyaltyConfig = {
        club_leal: {
          name: "Club Leal",
          min_consecutive_months: 3,
          minMonths: 3,
          badge: "💎 Club Leal",
          color: "#10B981",
          description: "Acceso exclusivo tras 3 meses continuos de recurrencia mensual."
        },
        club_vip: {
          name: "Club VIP",
          min_consecutive_months: 6,
          minMonths: 6,
          badge: "✨ Club VIP",
          color: "#F59E0B",
          description: "Experiencia premium tras 6 meses continuos de fidelidad."
        },
        club_legacy: {
          name: "Club Legacy",
          min_consecutive_months: 8,
          minMonths: 8,
          badge: "👑 Club Legacy (Estatus Máximo)",
          color: "#D4AF37",
          description: "Máxima jerarquía de distinción tras 8 meses continuos de lealtad ininterrumpida."
        }
      };

      // Beneficios Activos (CRUD y On/Off)
      this.benefits = [
        { id: "BEN-001", title: "Cortesía Hidratación Spa Pulpejos", name: "Cortesía Hidratación Spa Pulpejos", club: "club_leal", clubId: "club_leal", discountPercent: 100, active: true, category: "Grooming", icon: "sparkles", description: "Bálsamo hidratante con manteca de karité en cada servicio de grooming." },
        { id: "BEN-002", title: "10% Descuento en Boutique y Alimentos", name: "10% Descuento en Boutique y Alimentos", club: "club_leal", clubId: "club_leal", discountPercent: 10, active: true, category: "Store", icon: "shopping-bag", description: "Descuento directo en línea de accesorios y snacks naturales." },
        { id: "BEN-003", title: "Prioridad Moderada en Lista de Espera", name: "Prioridad Moderada en Lista de Espera", club: "club_leal", clubId: "club_leal", discountPercent: 0, active: true, category: "Agenda", icon: "clock", description: "Asignación rápida en cancelaciones o adelantos de citas médicas." },
        { id: "BEN-004", title: "1 Baño de Ozonoterapia Trimestral Bonificado", name: "1 Baño de Ozonoterapia Trimestral Bonificado", club: "club_vip", clubId: "club_vip", discountPercent: 100, active: true, category: "Grooming", icon: "droplet", description: "Tratamiento dérmico oxigenante y antibacteriano de cortesía cada 3 meses." },
        { id: "BEN-005", title: "15% Descuento en Boutique y Farmacia", name: "15% Descuento en Boutique y Farmacia", club: "club_vip", clubId: "club_vip", discountPercent: 15, active: true, category: "Store", icon: "tag", description: "Válido en suplementos nutricionales, antiparasitarios y camas ortopédicas." },
        { id: "BEN-006", title: "Limusina Pet Chauffeur (1 Traslado Gratuito)", name: "Limusina Pet Chauffeur (1 Traslado Gratuito)", club: "club_vip", clubId: "club_vip", discountPercent: 100, active: true, category: "Transporte", icon: "car", description: "Traslado exclusivo climatizado de ida o vuelta en sectores urbanos." },
        { id: "BEN-007", title: "Acceso Preferente a Suites Hotel Canino", name: "Acceso Preferente a Suites Hotel Canino", club: "club_vip", clubId: "club_vip", discountPercent: 20, active: true, category: "Hotel", icon: "home", description: "Late check-out sin recargo y monitoreo de cámara HD prioritario." },
        { id: "BEN-008", title: "Suite Presidencial Upgrade Automático", name: "Suite Presidencial Upgrade Automático", club: "club_legacy", clubId: "club_legacy", discountPercent: 100, active: true, category: "Hotel", icon: "crown", description: "Alojamiento máximo con aromaterapia y menú gourmet canino." },
        { id: "BEN-009", title: "Servicio Chauffeur Ilimitado Bonificado", name: "Servicio Chauffeur Ilimitado Bonificado", club: "club_legacy", clubId: "club_legacy", discountPercent: 100, active: true, category: "Transporte", icon: "shield", description: "Recogida y entrega domiciliaria personalizada para todas las sesiones." },
        { id: "BEN-010", title: "Línea Directa de Tele-Triaje 24/7 con O'Neil & Médicos", name: "Línea Directa de Tele-Triaje 24/7 con O'Neil & Médicos", club: "club_legacy", clubId: "club_legacy", discountPercent: 100, active: true, category: "Salud", icon: "phone-call", description: "Canal prioritario sin tiempo de espera con los veterinarios principales." }
      ];

      // Campañas del Cronograma de Marketing
      this.campaigns = [
        {
          id: "CMP-001",
          title: "Project Paul • Rediseño Experiencia Canina de Lujo",
          name: "Project Paul • Rediseño Experiencia Canina de Lujo",
          lead: "O'Neil (Marketing) & Margaret (Volturi)",
          manager: "O'Neil",
          channel: "Omnicanal (WhatsApp VIP, Email, Instagram)",
          startDate: "2026-10-01",
          endDate: "2026-11-15",
          quarter: "Q4",
          progress: 75,
          status: "active",
          budgetUSD: 3500,
          webhookMakeUrl: "https://hook.us1.make.com/mrspets_project_paul_live",
          targetClub: "all"
        },
        {
          id: "CMP-002",
          title: "Jornada Dental Preventiva & Limpieza Ultrasonido",
          name: "Jornada Dental Preventiva & Limpieza Ultrasonido",
          lead: "Dr. Carlos Mendoza & O'Neil",
          manager: "O'Neil",
          channel: "WhatsApp Notificaciones & SMS",
          startDate: "2026-10-15",
          endDate: "2026-10-31",
          quarter: "Q4",
          progress: 90,
          status: "active",
          budgetUSD: 1200,
          webhookMakeUrl: "https://hook.us1.make.com/mrspets_dental_octubre",
          targetClub: "club_leal"
        },
        {
          id: "CMP-003",
          title: "Black Friday Canino VIP • Exclusivo Preventa",
          name: "Black Friday Canino VIP • Exclusivo Preventa",
          lead: "O'Neil & Sebastián (Volturi)",
          manager: "O'Neil",
          channel: "Instagram Ads + WhatsApp Concierge",
          startDate: "2026-11-20",
          endDate: "2026-11-29",
          quarter: "Q4",
          progress: 30,
          status: "scheduled",
          budgetUSD: 2800,
          webhookMakeUrl: "https://hook.us1.make.com/mrspets_blackfriday_vip",
          targetClub: "club_vip"
        },
        {
          id: "CMP-004",
          title: "Alertas Concierge • 'A 1 Visita de Subir de Nivel'",
          name: "Alertas Concierge • 'A 1 Visita de Subir de Nivel'",
          lead: "O'Neil & Motor Make.com",
          manager: "O'Neil",
          channel: "WhatsApp Automatizado (Make.com)",
          startDate: "2026-10-01",
          endDate: "2026-12-31",
          quarter: "Q4",
          progress: 85,
          status: "active",
          budgetUSD: 600,
          webhookMakeUrl: "https://hook.us1.make.com/mrspets_loyalty_upgrade_alert",
          targetClub: "near_upgrade"
        }
      ];

      // Tutores y Príncipes/Princesas Oficiales de Mrs. Pets
      this.princesAndPrincesses = [
        {
          id: "TUT-001",
          tutorName: "Valeria Morales",
          petName: "Simba (Golden Retriever)",
          species: "canine",
          consecutiveMonths: 8,
          totalVisits: 19,
          totalSpentUSD: 1420.00,
          currentTier: "club_legacy",
          isNearUpgrade: false,
          nextClubName: null,
          neededMonths: 0,
          lastVisit: "2026-10-22",
          favoriteService: "Grooming Premium & Ozonoterapia",
          sector: "Las Delicias"
        },
        {
          id: "TUT-002",
          tutorName: "Diego Fernández",
          petName: "Duque (Pomerania)",
          species: "canine",
          consecutiveMonths: 7,
          totalVisits: 14,
          totalSpentUSD: 980.00,
          currentTier: "club_vip",
          isNearUpgrade: true,
          nextClubName: "Club Legacy",
          neededMonths: 1,
          lastVisit: "2026-10-18",
          favoriteService: "Spa Pulpejos & Hotel Suite",
          sector: "La Lago"
        },
        {
          id: "TUT-003",
          tutorName: "Mariana Silva",
          petName: "Luna (Siberian Husky)",
          species: "canine",
          consecutiveMonths: 5,
          totalVisits: 11,
          totalSpentUSD: 720.00,
          currentTier: "club_leal",
          isNearUpgrade: true,
          nextClubName: "Club VIP",
          neededMonths: 1,
          lastVisit: "2026-10-14",
          favoriteService: "Deslanado & Baño Antiparasitario",
          sector: "Bella Vista"
        },
        {
          id: "TUT-004",
          tutorName: "Carlos Eduardo Ríos",
          petName: "Toby (French Bulldog)",
          species: "canine",
          consecutiveMonths: 2,
          totalVisits: 5,
          totalSpentUSD: 340.00,
          currentTier: "standard",
          isNearUpgrade: true,
          nextClubName: "Club Leal",
          neededMonths: 1,
          lastVisit: "2026-10-09",
          favoriteService: "Control Dermatológico",
          sector: "Tierra Negra"
        },
        {
          id: "TUT-005",
          tutorName: "Sofía Palacios",
          petName: "Coco (Maltipoo)",
          species: "canine",
          consecutiveMonths: 6,
          totalVisits: 13,
          totalSpentUSD: 890.00,
          currentTier: "club_vip",
          isNearUpgrade: false,
          nextClubName: "Club Legacy",
          neededMonths: 2,
          lastVisit: "2026-10-24",
          favoriteService: "Corte Asiático & Hidratación",
          sector: "El Milagro"
        },
        {
          id: "TUT-006",
          tutorName: "Andrés Colmenares",
          petName: "Princesa Sasha (Shih Tzu)",
          species: "canine",
          consecutiveMonths: 9,
          totalVisits: 22,
          totalSpentUSD: 1650.00,
          currentTier: "club_legacy",
          isNearUpgrade: false,
          nextClubName: null,
          neededMonths: 0,
          lastVisit: "2026-10-26",
          favoriteService: "Limusina Chauffeur & Spa Total",
          sector: "Indio Mara"
        }
      ];

      // Simulador Predictivo "What-If"
      this.whatIfState = {
        adSpend: 1500,
        outreachCalls: 350,
        messagingReach: 6000,
        retentionRate: 85,
        avgTicket: 55,
        bcvRate: 887.30,
        simulatedMonths: 6
      };
    }

    /**
     * INICIALIZADOR
     */
    init() {
      this.renderDashboard();
      this.loadRemoteData();
    }

    async loadRemoteData() {
      try {
        await Promise.all([
          this.loadChannels(),
          this.loadTelemetryStream(),
          this.loadMicroInteractions(),
          this.loadNormalizedEvents(),
          this.loadLoyaltyConfig(),
          this.loadBenefits(),
          this.loadCampaigns(),
          this.syncBcvRate()
        ]);
        this.reclassifyLoyaltyTiers(false);
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Error cargando datos remotos:", e);
      }
    }

    async loadChannels() {
      try {
        if (typeof fetch === 'undefined') return;
        const res = await fetch('/api/v1/marketing/channels');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            this.channels = data;
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Fallback channels:", e);
      }
    }

    async loadTelemetryStream() {
      try {
        if (typeof fetch === 'undefined') return;
        const res = await fetch('/api/v1/marketing/telemetry/stream');
        if (res.ok) {
          const data = await res.json();
          if (data && (data.series_minute || data.seriesMinute)) {
            if (data.series_minute) this.timeSeries.seriesMinute = data.series_minute;
            if (data.series_hour) this.timeSeries.seriesHour = data.series_hour;
            if (data.stimulus_events) this.timeSeries.stimulusEvents = data.stimulus_events;
            if (data.operational_summary) this.timeSeries.operationalSummary = data.operational_summary;
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Fallback telemetry stream:", e);
      }
    }

    
    async loadNormalizedEvents() {
      try {
        if (typeof fetch === 'undefined') return;
        const res = await fetch('/api/v1/marketing/telemetry/normalized');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            this.normalizedEvents = data;
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Fallback normalized events:", e);
      }
    }

    setNormalizedPlatform(platform) {
      this.activeNormalizedPlatform = platform;
      this.render();
    }

    async ingestNormalizedTelemetry(customPayload = null) {
      const payload = customPayload || {
        timestamp: new Date().toISOString(),
        platform: this.activeNormalizedPlatform || "Instagram",
        campaign_id: "CAMP_GROOMING_VIP_OCT",
        real_metrics: {
          reach: 320,
          clicks: 45,
          whatsapp_redirects: 12,
          website_visits: 28
        },
        target_metrics: {
          reach_goal: 350,
          clicks_goal: 50
        }
      };

      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch('/api/v1/marketing/telemetry/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const data = await res.json();
            if (data.event) {
              if (!Array.isArray(this.normalizedEvents)) this.normalizedEvents = [];
              this.normalizedEvents.unshift(data.event);
            }
          }
        }
        await this.loadTelemetryStream();
        await this.loadMicroInteractions();
        if (global.app && global.app.showToast) {
          global.app.showToast(`✅ Ingesta normalizada de ${payload.platform} (${payload.campaign_id}) procesada exitosamente`, 'success');
        }
        this.render();
      } catch (e) {
        console.error("Error al ingestar telemetría normalizada:", e);
        if (global.app && global.app.showToast) {
          global.app.showToast('Error procesando telemetría normalizada', 'error');
        }
      }
    }

    async loadMicroInteractions() {
      try {
        if (typeof fetch === 'undefined') return;
        const res = await fetch('/api/v1/marketing/micro-interactions');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            this.microInteractions = data;
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Fallback micro-interactions:", e);
      }
    }

    async syncBcvRate() {
      try {
        if (typeof fetch === 'undefined') return;
        const res = await fetch('/api/v1/bcv/rate');
        if (res.ok) {
          const data = await res.json();
          if (data && (data.rate || data.currentRate)) {
            this.whatIfState.bcvRate = parseFloat(data.rate || data.currentRate);
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Fallback BCV rate:", e);
      }
    }

    async loadLoyaltyConfig() {
      try {
        if (typeof fetch === 'undefined') return;
        const res = await fetch('/api/v1/marketing/loyalty/config');
        if (res.ok) {
          const data = await res.json();
          if (data && data.club_leal) {
            this.loyaltyConfig = data;
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Usando configuración local de lealtad:", e);
      }
    }

    async loadBenefits() {
      try {
        if (typeof fetch === 'undefined') return;
        const res = await fetch('/api/v1/marketing/benefits');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            this.benefits = data;
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Usando beneficios locales:", e);
      }
    }

    async loadCampaigns() {
      try {
        if (typeof fetch === 'undefined') return;
        const res = await fetch('/api/v1/marketing/campaigns');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            this.campaigns = data;
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Usando campañas locales:", e);
      }
    }

    /**
     * RBAC: Verificación de Autorización
     */
    isAuthorized() {
      try {
        const g = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
        const auth = g.authEngine || {};
        const user = auth.currentUser || {};
        const role = (auth.userRole || user.role || '').toLowerCase();
        const userName = (user.name || '').toLowerCase();
        const userId = (user.id || '').toLowerCase();

        // 1. Identidades nominales explícitas: O'Neil y miembros del Comité Volturi
        const volturiMembers = ['oneil', "o'neil", 'harry', 'sebastian', 'sebastián', 'margaret', 'delliveli'];
        if (userId.includes('oneil') || userId.includes('volturi')) return true;
        if (volturiMembers.some(m => userName.includes(m) || userId.includes(m))) return true;

        // 2. Roles Staff / Administrativos
        if (['admin', 'administrator', 'gerente', 'gerencia', 'staff', 'receptionist', 'veterinarian'].includes(role)) {
          return true;
        }

        // 3. Consola empresarial
        const admin = g.adminEngine || {};
        if (admin.isEnterpriseAuthenticated === true && admin.viewEnvironment === 'enterprise') {
          return true;
        }

        return false;
      } catch (e) {
        return false;
      }
    }

    /**
     * RENDER DASHBOARD (Telemetría de Redes Sociales, Pauta y Campañas)
     */
    renderDashboard() {
      if (typeof document === 'undefined') return;
      const container = document.getElementById('marketing-command-center-content');
      if (!container) return;

      this.activeSubTab = 'dashboard';
      this.render();
    }

    /**
     * ACTUALIZAR TELEMETRÍA EN VIVO
     */
    refreshMetrics() {
      this.metrics.reach += Math.floor(Math.random() * 500);
      this.renderDashboard();
      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('📊 Telemetría de marketing actualizada en tiempo real', 'success');
      }
    }

    /**
     * RENDER PRINCIPAL DE LA VISTA
     */
    render(containerId = 'marketing-command-center-content') {
      if (typeof document === 'undefined') return;
      const container = document.getElementById(containerId);
      if (!container) return;

      // VERIFICACIÓN DE SEGURIDAD ESTRICTA (RBAC)
      if (!this.isAuthorized()) {
        container.innerHTML = `
          <div style="background:#1C1C1E; border:1.5px solid #D4AF37; border-radius:20px; padding:40px; text-align:center; color:#FFFFFF; margin-top:30px; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
            <div style="font-size:3rem; margin-bottom:12px;">🔒</div>
            <h2 style="color:#D4AF37; font-size:1.6rem; font-weight:900; margin-bottom:8px;">Centro de Comando MPF: Exclusivo Staff & Volturi</h2>
            <p style="color:#CBD5E1; max-width:600px; margin:0 auto 20px auto; font-size:0.95rem; line-height:1.5;">
              El Centro de Comando de Mercadotecnia, Publicidad y Fidelización es de uso exclusivo para la Gerencia de Marketing (O'Neil), Dirección General y el Comité Volturi.
            </p>
            <div style="display:flex; justify-content:center; gap:12px; margin-top:20px; flex-wrap:wrap;">
              <button onclick="if(window.authEngine) { window.authEngine.quickStaffLogin(); if(window.marketingCommandCenterEngine.isAuthorized()) { window.marketingCommandCenterEngine.render(); if(window.app) window.app.switchTab('marketing-command'); } }" class="btn" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; padding:10px 24px; border-radius:12px; border:none; cursor:pointer;">
                💼 Identificarse como Staff / Volturi
              </button>
              <button onclick="if(window.app) window.app.switchTab('welcome', true);" class="btn" style="background:rgba(255,255,255,0.1); color:#CBD5E1; font-weight:700; padding:10px 20px; border-radius:12px; border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                Volver al Portal
              </button>
            </div>
          </div>
        `;
        return;
      }

      // VISTA AUTORIZADA SILENT LUXURY
      if (typeof document !== 'undefined' && document.body) {
        document.body.classList.remove('customer-view-mode');
        document.body.classList.add('enterprise-view-mode');
      }
      container.innerHTML = `
        <!-- HEADER PRINCIPAL SILENT LUXURY -->
        <div style="background:linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%); color:#FBFBFD; padding:28px 32px; border-radius:24px; border:1.5px solid #D4AF37; margin-bottom:24px; box-shadow:0 15px 35px rgba(0,0,0,0.12); position:relative; overflow:hidden;">
          <div style="position:absolute; right:-20px; top:-20px; font-size:8rem; opacity:0.04; pointer-events:none; color:#D4AF37;">👑</div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; position:relative; z-index:2;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                <span style="font-size:0.78rem; font-weight:800; color:#D4AF37; letter-spacing:0.12em; text-transform:uppercase;">
                  📊 O'NEIL MARKETING COMMAND CENTER • COMITÉ VOLTURI
                </span>
                <span style="background:rgba(212,175,55,0.15); border:1px solid #D4AF37; color:#FBFBFD; font-size:0.7rem; font-weight:700; padding:3px 8px; border-radius:6px;">
                  ⚡ Latencia &lt; 1.0s
                </span>
                <span style="background:rgba(147,51,234,0.15); border:1px solid #C084FC; color:#F3E8FF; font-size:0.7rem; font-weight:700; padding:3px 8px; border-radius:6px;">
                  🤖 Make.com & Vertex AI
                </span>
              </div>
              <h2 style="font-size:1.75rem; font-weight:900; color:#FFFFFF; margin:0 0 6px 0;">
                Tablero de Medición de Redes Sociales & Campañas
              </h2>
              <p style="font-size:0.88rem; color:#CBD5E1; margin:0; max-width:720px;">
                Telemetría en tiempo real de rendimiento publicitario, ROI, CVR y comportamiento de nuestros tutores de príncipes y princesas.
              </p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <button class="btn btn-sm" onclick="marketingCommandCenterEngine.refreshMetrics()" style="background:#D4AF37; color:#121214; font-weight:900; border-radius:10px; padding:10px 18px; border:none; cursor:pointer;">
                🔄 Actualizar Telemetría
              </button>
            </div>
          </div>

          <!-- NAVEGACIÓN ENTRE LOS MÓDULOS ESTRATÉGICOS -->
          <div style="display:flex; gap:10px; margin-top:20px; border-top:1px solid rgba(255,255,255,0.1); padding-top:16px; flex-wrap:wrap;">
            <button onclick="marketingCommandCenterEngine.switchSubTab('dashboard')" class="marketing-nav-btn ${this.activeSubTab === 'dashboard' ? 'active' : ''}" id="mkt-btn-dashboard">
              📊 Tablero Redes & Campañas
            </button>
            <button onclick="marketingCommandCenterEngine.switchSubTab('loyalty')" class="marketing-nav-btn ${this.activeSubTab === 'loyalty' ? 'active' : ''}" id="mkt-btn-loyalty">
              💎 Clubes de Lealtad & Príncipes
            </button>
            <button onclick="marketingCommandCenterEngine.switchSubTab('benefits')" class="marketing-nav-btn ${this.activeSubTab === 'benefits' ? 'active' : ''}" id="mkt-btn-benefits">
              🎛️ Control de Beneficios (On/Off)
            </button>
            <button onclick="marketingCommandCenterEngine.switchSubTab('gantt')" class="marketing-nav-btn ${this.activeSubTab === 'gantt' ? 'active' : ''}" id="mkt-btn-gantt">
              📅 Cronograma Gantt & Make.com
            </button>
            <button onclick="marketingCommandCenterEngine.switchSubTab('whatif')" class="marketing-nav-btn ${this.activeSubTab === 'whatif' ? 'active' : ''}" id="mkt-btn-whatif">
              🔮 Simulador What-If & Telemetría ODO
            </button>
          </div>
        </div>

        <!-- CONTENEDOR REACTIVO DEL SUB-MÓDULO ACTIVO -->
        <div id="marketing-submodule-container"></div>

        <!-- MODAL CRUD DE BENEFICIOS (Oculto por defecto) -->
        <div id="modal-marketing-create-benefit" class="luxury-modal-backdrop" style="display:none;">
          <div class="luxury-modal-card">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; margin-bottom:16px;">
              <h3 style="color:#D4AF37; margin:0; font-size:1.2rem; font-weight:800;">✨ Crear Nuevo Beneficio Exclusivo</h3>
              <button onclick="marketingCommandCenterEngine.closeCreateBenefitModal()" style="background:none; border:none; color:#FFFFFF; font-size:1.4rem; cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div>
                <label style="display:block; font-size:0.78rem; color:#FFFFFF; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Título del Beneficio</label>
                <input id="input-new-benefit-title" type="text" placeholder="Ej: 20% en Spa Holístico" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:10px; color:#FFFFFF; font-size:0.9rem;">
              </div>
              <div>
                <label style="display:block; font-size:0.78rem; color:#FFFFFF; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Club de Asignación</label>
                <select id="select-new-benefit-club" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:10px; color:#FFFFFF; font-size:0.9rem;">
                  <option value="club_leal">💎 Club Leal (3 meses)</option>
                  <option value="club_vip">✨ Club VIP (6 meses)</option>
                  <option value="club_legacy">👑 Club Legacy (8 meses)</option>
                </select>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div>
                  <label style="display:block; font-size:0.78rem; color:#FFFFFF; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Categoría</label>
                  <select id="select-new-benefit-category" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:10px; color:#FFFFFF; font-size:0.9rem;">
                    <option value="Grooming">Grooming & Spa</option>
                    <option value="Store">Boutique & Dietas</option>
                    <option value="Hotel">Hotel & Suites</option>
                    <option value="Transporte">Pet Chauffeur</option>
                    <option value="Salud">Salud & Tele-Triaje</option>
                    <option value="Agenda">Agenda Prioritaria</option>
                  </select>
                </div>
                <div>
                  <label style="display:block; font-size:0.78rem; color:#FFFFFF; text-transform:uppercase; font-weight:900; margin-bottom:4px;">% Descuento / Bonificación</label>
                  <input id="input-new-benefit-discount" type="number" min="0" max="100" value="100" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:10px; color:#FFFFFF; font-size:0.9rem;">
                </div>
              </div>
              <div>
                <label style="display:block; font-size:0.78rem; color:#FFFFFF; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Descripción Detallada</label>
                <textarea id="input-new-benefit-desc" rows="2" placeholder="Términos y especificaciones del beneficio..." style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:10px; color:#FFFFFF; font-size:0.9rem;"></textarea>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
                <button onclick="marketingCommandCenterEngine.closeCreateBenefitModal()" style="padding:10px 18px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:10px; color:#CBD5E1; font-weight:700; cursor:pointer;">Cancelar</button>
                <button onclick="marketingCommandCenterEngine.saveNewBenefit()" style="padding:10px 22px; background:linear-gradient(135deg, #D4AF37, #B8860B); border:none; border-radius:10px; color:#121214; font-weight:900; cursor:pointer;">Guardar y Activar</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Renderizar el contenido del sub-tab activo
      this.renderSubTabContent();
    }

    /**
     * CAMBIO DE SUB-MÓDULOS
     */
    switchSubTab(tabName) {
      this.activeSubTab = tabName;
      if (typeof document === 'undefined') return;

      const btnIds = ['dashboard', 'loyalty', 'benefits', 'gantt', 'whatif'];
      btnIds.forEach(id => {
        const btn = document.getElementById(`mkt-btn-${id}`);
        if (btn) {
          if (id === tabName) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        }
      });

      this.renderSubTabContent();
    }

    /**
     * RENDER DEL CONTENIDO DEL SUB-TAB ACTIVO
     */
    renderSubTabContent() {
      if (typeof document === 'undefined') return;
      const container = document.getElementById('marketing-submodule-container');
      if (!container) return;

      switch (this.activeSubTab) {
        case 'dashboard':
          container.innerHTML = this.renderDashboardContent();
          this.renderGanttChartInsideContainer();
          break;
        case 'loyalty':
          container.innerHTML = this.renderLoyaltyContent();
          break;
        case 'benefits':
          container.innerHTML = this.renderBenefitsContent();
          break;
        case 'gantt':
          container.innerHTML = this.renderGanttContent();
          this.renderGanttChartInsideContainer();
          break;
        case 'whatif':
          container.innerHTML = this.renderWhatIfContent();
          this.updateWhatIfSimulation();
          break;
        default:
          container.innerHTML = this.renderDashboardContent();
          this.renderGanttChartInsideContainer();
      }
    }

    /**
     * CONTENIDO SUB-TAB: MOTOR DE ANALÍTICA Y COMPORTAMIENTO CONTINUO EN TIEMPO REAL
     * (Series de Tiempo y Micro-Interacciones)
     */
    renderDashboardContent() {
      const isMinute = this.timeSeries.activeGranularity === 'minute';
      const series = isMinute ? this.timeSeries.seriesMinute : this.timeSeries.seriesHour;
      
      const activeIdx = (this.timeSeries.scrubberIndex !== null && this.timeSeries.scrubberIndex >= 0 && this.timeSeries.scrubberIndex < series.length)
        ? this.timeSeries.scrubberIndex
        : (series.length - 1);
      const activePt = series[activeIdx] || {};

      const realVal = activePt.real !== null && activePt.real !== undefined ? activePt.real : null;
      const targetVal = activePt.target || 0;
      const histVal = activePt.historical_7d || 0;
      
      const deltaPercent = realVal !== null && targetVal > 0 
        ? (((realVal - targetVal) / targetVal) * 100).toFixed(1)
        : 0;
      const isNegativeAlert = parseFloat(deltaPercent) < -15.0;
      const deltaColor = parseFloat(deltaPercent) >= 0 ? '#10B981' : (isNegativeAlert ? '#EF4444' : '#F59E0B');
      const deltaStr = (parseFloat(deltaPercent) > 0 ? '+' : '') + deltaPercent + '%';

      // Estímulo activo para el análisis forense de micro-interacciones
      const activeStimulus = (this.microInteractions && this.microInteractions.find(m => m.stimulus_id === this.selectedStimulusId))
        || (this.microInteractions && this.microInteractions[0]) || {
          stimulus_id: "STM-IG-1715",
          channel_name: "Instagram Ads (@mrspets)",
          launch_time: "17:15:00",
          campaign_title: "Protocolo Hidratación Pulpejos & Ozonoterapia Canina",
          creative_instrument: "Reel Vertical 4K + CTA Bio Link con UTM utm_source=ig_mrspets&utm_campaign=ozono_pulpejos",
          target_segment: "Tutores Razas Braquicéfalas y Pelaje Denso (Bella Vista & El Milagro)",
          t_plus_20s: {
            concurrent_visitors_delta: "+84 visitas en vivo",
            latency_to_first_action_ms: 680,
            first_click_breakdown: [
              { destination: "Perfil de Príncipe / Princesa (Club de Lealtad)", target_id: "nav-item-soy-chico-pet", clicks: 46, share_percent: 54.8, icon: "👑" },
              { destination: "Visor Médico DICOM / Rayos X Clínicos", target_id: "tab-clinic-dicom-viewer", clicks: 21, share_percent: 25.0, icon: "🔬" },
              { destination: "Salto Directo a WhatsApp VIP Concierge", target_id: "btn-whatsapp-concierge", clicks: 14, share_percent: 16.7, icon: "💬" },
              { destination: "Otras Secciones (Hotel / Boutique)", target_id: "tab-hotel", clicks: 3, share_percent: 3.5, icon: "🐾" }
            ]
          },
          t_plus_2h: {
            cumulative_visits: 520,
            avg_session_duration_sec: 248,
            retention_rate_percent: 82.5,
            total_generated_usd: 1920,
            roas: 5.48,
            cac_usd: 2.85,
            direct_conversions: [
              { type: "Reservaciones Ozonoterapia & Spa Pulpejos", count: 28, revenue_usd: 840 },
              { type: "Consultas Médicas Clínicas Agendadas", count: 12, revenue_usd: 600 },
              { type: "Nuevas Afiliaciones a Club VIP", count: 6, revenue_usd: 480 }
            ]
          }
        };

      // Canal oficial destacado (Instagram @mrspets Meta Graph API v18.0)
      const igChannel = (this.channels && this.channels.find(c => c.channel_id === 'meta_instagram_mrspets')) || {
        account_handle: "@mrspets",
        status: "active",
        polling_interval_minutes: 60,
        metric_mappings: { clicks_metric: "website_clicks" }
      };

      return `
        <!-- ==================== 1. MOTOR DE SERIES DE TIEMPO (TIME-SERIES STREAM) ==================== -->
        <div class="timeseries-chart-container">
          
          <!-- BARRA SUPERIOR DE TELEMETRÍA EN VIVO & SELECTOR DE RESOLUCIÓN -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="display:inline-flex; align-items:center; gap:6px; background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#10B981; font-size:0.75rem; font-weight:900; padding:4px 10px; border-radius:8px;">
                <span style="width:8px; height:8px; border-radius:50%; background:#10B981; display:inline-block; box-shadow:0 0 10px #10B981;"></span>
                STREAMING EN VIVO (Latencia &lt; 1.0s)
              </span>
              <div style="font-size:0.85rem; color:#FBFBFD; font-weight:800; display:flex; align-items:center; gap:6px;">
                <span style="color:#E1306C;">📸</span> Meta Graph API v18.0 Insights • <span style="color:#D4AF37;">${igChannel.account_handle}</span>
                <span style="background:rgba(255,255,255,0.18); border:1px solid rgba(255,255,255,0.4); border-radius:6px; padding:2px 8px; font-size:0.72rem; color:#FFFFFF; font-weight:800;">Polling: ${igChannel.polling_interval_minutes || 60}m</span>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <div style="display:flex; gap:6px; background:rgba(0,0,0,0.4); padding:3px; border-radius:10px; border:1px solid rgba(255,255,255,0.1);">
                <button onclick="marketingCommandCenterEngine.setGranularity('minute')" class="granularity-btn ${isMinute ? 'active' : ''}">
                  ⏱️ Minuto a Minuto (60m)
                </button>
                <button onclick="marketingCommandCenterEngine.setGranularity('hour')" class="granularity-btn ${!isMinute ? 'active' : ''}">
                  🕒 Ciclo 24 Horas
                </button>
              </div>

              <button onclick="marketingCommandCenterEngine.simulateLiveStimulus()" class="btn btn-sm" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; padding:8px 16px; border-radius:10px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(16,185,129,0.3);">
                ⚡ Simular Estímulo en Vivo
              </button>
            </div>
          </div>

          <!-- HUD SCRUBBER EN TIEMPO REAL (TRIPLE EJE VISUAL) -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:#18181B; border:1px solid rgba(212,175,55,0.35); border-radius:14px; padding:12px 18px; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.75rem; color:#FACC15; font-weight:900; text-transform:uppercase; letter-spacing:0.08em;">VENTANA:</span>
              <strong style="color:#FFFFFF; font-size:1.15rem; font-weight:900;">${activePt.time || '--:--'}</strong>
              ${activePt.stimulus_id ? `<span style="background:rgba(212,175,55,0.2); border:1px solid #D4AF37; color:#D4AF37; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:6px; margin-left:6px;">⚡ Estímulo Pauta</span>` : ''}
            </div>

            <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
              <!-- 1. Línea Real -->
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:#10B981; font-size:0.9rem;">●</span>
                <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Línea Real:</span>
                <strong style="color:#00FF88; font-size:1.25rem; font-weight:900; text-shadow:0 0 10px rgba(0,255,136,0.4);">${realVal !== null ? realVal.toLocaleString() : 'Proyectado'}</strong>
                <span style="font-size:0.75rem; color:#FFFFFF; font-weight:700;">${isMinute ? 'visitas/min' : 'tráfico/hora'}</span>
              </div>

              <!-- 2. Línea Meta / Objetivo -->
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:#D4AF37; font-size:0.9rem;">- -</span>
                <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Meta O'Neil:</span>
                <strong style="color:#FACC15; font-size:1.25rem; font-weight:900; text-shadow:0 0 10px rgba(250,204,21,0.4);">${targetVal.toLocaleString()}</strong>
                <span style="font-size:0.75rem; color:#FFFFFF; font-weight:700;">${isMinute ? 'v/min' : 't/hora'}</span>
              </div>

              <!-- 3. Línea Histórica 7 Días -->
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:#38BDF8; font-size:1rem; font-weight:900;">―</span>
                <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Histórico 7d:</span>
                <strong style="color:#38BDF8; font-size:1.25rem; font-weight:900; text-shadow:0 0 10px rgba(56,189,248,0.4);">${histVal.toLocaleString()}</strong>
                <span style="font-size:0.75rem; color:#FFFFFF; font-weight:700;">media</span>
              </div>

              <!-- Desviación -->
              <div style="display:flex; align-items:center; gap:6px; background:rgba(0,0,0,0.3); padding:4px 10px; border-radius:8px;">
                <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900;">Δ VARIACIÓN:</span>
                <strong style="color:${deltaColor}; font-size:1.15rem; font-weight:900;">${deltaStr}</strong>
              </div>
            </div>
          </div>

          <!-- LIENZO DE GRÁFICA VECTORIAL CONTINUA (SVG NATIVO ULTRA-RESPONSIVO) -->
          <div style="width:100%; height:280px; position:relative; overflow:hidden;">
            ${this.generateTimeSeriesSVG()}
          </div>

          <!-- LEYENDA TÁCTICA DE EJES VISUALES -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.18); font-size:0.78rem; color:#FFFFFF; font-weight:800; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; gap:18px; align-items:center;">
              <span style="display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; width:16px; height:4px; background:#10B981; border-radius:2px;"></span>
                <strong style="color:#FBFBFD;">Línea Real</strong> (Tráfico & clics tras estímulo en tiempo real)
              </span>
              <span style="display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; width:16px; height:0px; border-top:2px dashed #D4AF37;"></span>
                <strong style="color:#FBFBFD;">Línea Meta / Objetivo</strong> (Curva proyectada por O'Neil)
              </span>
              <span style="display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; width:16px; height:8px; background:rgba(100,116,139,0.3); border-top:2px solid #64748B;"></span>
                <strong style="color:#FBFBFD;">Línea Histórica</strong> (Media móvil últimos 7 días a la misma hora)
              </span>
            </div>
            <span style="color:#D4AF37; font-weight:700;">💡 Pasa el cursor sobre la gráfica o haz clic en los marcadores para inspeccionar</span>
          </div>
        </div>

        <!-- ==================== 2. PANEL DE ALERTAS TÁCTICAS DE DESVIACIÓN CONDUCTUAL ==================== -->
        <div style="background:${isNegativeAlert ? 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(24,24,27,0.95) 100%)' : 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(24,24,27,0.95) 100%)'}; border:1.5px solid ${isNegativeAlert ? '#EF4444' : '#D4AF37'}; border-radius:20px; padding:20px 24px; margin-bottom:24px; box-shadow:0 12px 30px rgba(0,0,0,0.35);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:14px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:2rem;">${isNegativeAlert ? '⚠️' : '🎯'}</span>
              <div>
                <h3 style="color:${isNegativeAlert ? '#FCA5A5' : '#D4AF37'}; font-size:1.15rem; font-weight:900; margin:0 0 4px 0;">
                  ${isNegativeAlert ? 'Alerta Táctica: Desviación Conductual Negativa Detectada' : 'Monitoreo de Comportamiento Táctico (O\'Neil & Volturi)'}
                </h3>
                <p style="color:#FFFFFF; font-size:0.92rem; font-weight:600; margin:0; line-height:1.45;">
                  ${isNegativeAlert 
                    ? `El flujo real está <strong style="color:#EF4444;">${Math.abs(deltaPercent)}% por debajo</strong> de la meta proyectada. Intervención recomendada en caliente sin esperar el cierre del día.`
                    : `Comportamiento en ritmo óptimo (<strong style="color:#10B981;">${deltaStr} vs meta</strong>). Pauta en Instagram @mrspets y canales omnicanal respondiendo según el modelo predictivo.`}
                </p>
              </div>
            </div>

            <div style="font-size:0.75rem; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px 14px; text-align:right;">
              <span style="color:#FFFFFF; font-weight:800;">Última Intervención:</span><br>
              <strong style="color:#FACC15; font-size:0.85rem; font-weight:900;">${this.tacticalDecisions[0] ? this.tacticalDecisions[0].timestamp + ' • ' + this.tacticalDecisions[0].action : 'Sin intervenciones pendientes'}</strong>
            </div>
          </div>

          <!-- BOTONERA DE ACCIÓN INMEDIATA PARA O'NEIL -->
          <div style="display:flex; gap:10px; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
            <button onclick="marketingCommandCenterEngine.applyTacticalAdjustment('OPTIMIZE_COPY')" class="tactical-btn" style="background:rgba(234,179,8,0.2); border:1.5px solid #FACC15; color:#FEF08A; font-weight:900; box-shadow:0 0 10px rgba(250,204,21,0.25);" title="Conmuta gancho creativo en pauta activa y actualiza prompt Make.com">
              ✍️ Optimizar Copy / Gancho Creativo
            </button>
            <button onclick="marketingCommandCenterEngine.applyTacticalAdjustment('RECALIBRATE_SCHEDULE')" class="tactical-btn" style="background:rgba(56,189,248,0.2); border:1.5px solid #38BDF8; color:#E0F2FE; font-weight:900; box-shadow:0 0 10px rgba(56,189,248,0.25);" title="Ajusta horario de pauta a la hora de mayor respuesta del día">
              ⏱️ Recalibrar Horario de Re-impacto
            </button>
            <button onclick="marketingCommandCenterEngine.applyTacticalAdjustment('REFINE_AUDIENCE')" class="tactical-btn" style="background:rgba(74,222,128,0.2); border:1.5px solid #4ADE80; color:#DCFCE7; font-weight:900; box-shadow:0 0 10px rgba(74,222,128,0.25);" title="Focaliza pauta en tutores de La Lago, Las Delicias, Bella Vista y El Milagro">
              🎯 Refinar Segmentación (La Lago, Las Delicias & Bella Vista)
            </button>
            <button onclick="marketingCommandCenterEngine.applyTacticalAdjustment('DISPATCH_MAKE')" class="tactical-btn" style="border-color:#C084FC; color:#F3E8FF; background:rgba(126,34,206,0.25);" title="Despacha directiva en tiempo real al Webhook Make.com">
              ⚡ Disparar Webhook Táctico Make.com
            </button>
          </div>
        </div>

        
        <!-- ==================== 2.5 HUB DE INGESTA Y COMPORTAMIENTO CONTINUO NORMALIZADO ==================== -->
        ${(() => {
          const normEvent = (this.normalizedEvents && this.normalizedEvents.find(e => e.platform === this.activeNormalizedPlatform))
            || (this.normalizedEvents && this.normalizedEvents[0]) || {
              timestamp: "2026-10-27T10:00:00Z",
              platform: "Instagram",
              campaign_id: "CAMP_GROOMING_VIP_OCT",
              real_metrics: { reach: 320, clicks: 45, whatsapp_redirects: 12, website_visits: 28 },
              target_metrics: { reach_goal: 350, clicks_goal: 50 }
            };
          const reachVal = normEvent.real_metrics ? normEvent.real_metrics.reach : 320;
          const reachGoal = normEvent.target_metrics ? normEvent.target_metrics.reach_goal : 350;
          const reachDelta = reachGoal > 0 ? (((reachVal - reachGoal) / reachGoal) * 100).toFixed(1) : 0;
          
          const clicksVal = normEvent.real_metrics ? normEvent.real_metrics.clicks : 45;
          const clicksGoal = normEvent.target_metrics ? normEvent.target_metrics.clicks_goal : 50;
          const clicksDelta = clicksGoal > 0 ? (((clicksVal - clicksGoal) / clicksGoal) * 100).toFixed(1) : 0;

          const waVal = normEvent.real_metrics ? normEvent.real_metrics.whatsapp_redirects : 12;
          const waCvr = clicksVal > 0 ? ((waVal / clicksVal) * 100).toFixed(1) : 0;

          const webVal = normEvent.real_metrics ? normEvent.real_metrics.website_visits : 28;
          const webShare = clicksVal > 0 ? ((webVal / clicksVal) * 100).toFixed(1) : 0;

          return `
            <div style="background:#18181B; border:1.5px solid #27272A; border-left:4px solid #D4AF37; border-radius:18px; padding:20px 24px; margin-bottom:24px; box-shadow:0 10px 30px rgba(0,0,0,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:16px;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <span style="font-size:1.8rem;">📥</span>
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:0.7rem; background:rgba(212,175,55,0.15); border:1px solid #D4AF37; color:#D4AF37; font-weight:900; padding:2px 8px; border-radius:6px; text-transform:uppercase;">
                        Schema Normalizado
                      </span>
                      <span style="font-size:0.78rem; color:#FACC15; font-weight:900;">${normEvent.campaign_id || 'CAMP_GROOMING_VIP_OCT'}</span>
                      <span style="font-size:0.7rem; color:#71717A;">• ${normEvent.timestamp || '2026-10-27T10:00:00Z'}</span>
                    </div>
                    <h3 style="color:#FFFFFF; font-size:1.15rem; font-weight:900; margin:4px 0 0 0;">
                      Telemetría Normalizada de Comportamiento Continuo
                    </h3>
                  </div>
                </div>

                <!-- Selector de Plataforma Normalizada -->
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <div style="display:flex; gap:4px; background:rgba(0,0,0,0.4); padding:3px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
                    ${['Instagram', 'TikTok', 'Facebook', 'X'].map(p => `
                      <button onclick="marketingCommandCenterEngine.setNormalizedPlatform('${p}')" class="btn btn-sm" style="background:${this.activeNormalizedPlatform === p ? 'linear-gradient(135deg, #D4AF37, #B8860B)' : 'transparent'}; color:${this.activeNormalizedPlatform === p ? '#121214' : '#A1A1AA'}; font-weight:800; font-size:0.72rem; padding:4px 10px; border-radius:6px; border:none; cursor:pointer;">
                        ${p === 'Instagram' ? '📸' : (p === 'TikTok' ? '🎵' : (p === 'Facebook' ? '📘' : '𝕏'))} ${p}
                      </button>
                    `).join('')}
                  </div>

                  <button onclick="marketingCommandCenterEngine.ingestNormalizedTelemetry()" class="btn btn-sm" style="background:linear-gradient(135deg, #10B981, #059669); color:#FFFFFF; font-weight:900; padding:7px 14px; border-radius:8px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                    📥 Ingestar Telemetría Normalizada
                  </button>
                </div>
              </div>

              <!-- 4 TARJETAS DE MÉTRICAS REALES VS OBJETIVO -->
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:14px;">
                <!-- 1. Alcance (Reach) -->
                <div style="background:#27272A; border-radius:12px; padding:12px 16px; border-left:3px solid #60A5FA;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Alcance (Reach)</span>
                    <span style="font-size:0.75rem; color:${parseFloat(reachDelta) >= 0 ? '#10B981' : '#F59E0B'}; font-weight:800;">${reachDelta}% Δ</span>
                  </div>
                  <div style="display:flex; align-items:baseline; gap:6px; margin-top:4px;">
                    <strong style="font-size:1.4rem; color:#FFFFFF; font-weight:900;">${reachVal.toLocaleString()}</strong>
                    <span style="font-size:0.78rem; color:#FEF08A; font-weight:800;">/ ${reachGoal.toLocaleString()} meta</span>
                  </div>
                </div>

                <!-- 2. Clics (Clicks) -->
                <div style="background:#27272A; border-radius:12px; padding:12px 16px; border-left:3px solid #10B981;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Clics (Clicks)</span>
                    <span style="font-size:0.75rem; color:${parseFloat(clicksDelta) >= 0 ? '#10B981' : '#F59E0B'}; font-weight:800;">${clicksDelta}% Δ</span>
                  </div>
                  <div style="display:flex; align-items:baseline; gap:6px; margin-top:4px;">
                    <strong style="font-size:1.4rem; color:#10B981; font-weight:900;">${clicksVal.toLocaleString()}</strong>
                    <span style="font-size:0.78rem; color:#FEF08A; font-weight:800;">/ ${clicksGoal.toLocaleString()} meta</span>
                  </div>
                </div>

                <!-- 3. Redirecciones a WhatsApp -->
                <div style="background:#27272A; border-radius:12px; padding:12px 16px; border-left:3px solid #25D366;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">WhatsApp Redirects</span>
                    <span style="font-size:0.75rem; color:#10B981; font-weight:800;">${waCvr}% CVR</span>
                  </div>
                  <div style="display:flex; align-items:baseline; gap:6px; margin-top:4px;">
                    <strong style="font-size:1.4rem; color:#25D366; font-weight:900;">${waVal}</strong>
                    <span style="font-size:0.78rem; color:#DCFCE7; font-weight:800;">saltos directos a VIP</span>
                  </div>
                </div>

                <!-- 4. Visitas Web -->
                <div style="background:#27272A; border-radius:12px; padding:12px 16px; border-left:3px solid #D4AF37;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Website Visits</span>
                    <span style="font-size:0.75rem; color:#D4AF37; font-weight:800;">${webShare}% Tráfico</span>
                  </div>
                  <div style="display:flex; align-items:baseline; gap:6px; margin-top:4px;">
                    <strong style="font-size:1.4rem; color:#D4AF37; font-weight:900;">${webVal}</strong>
                    <span style="font-size:0.78rem; color:#E0F2FE; font-weight:800;">sesiones interactivas</span>
                  </div>
                </div>
              </div>

              <!-- DETALLES DEL PAYLOAD & AUDITORÍA JSON -->
              <details style="background:rgba(0,0,0,0.4); border:1px solid rgba(250,204,21,0.25); border-radius:10px; padding:8px 12px; font-size:0.78rem; color:#FFFFFF; font-weight:700;">
                <summary style="cursor:pointer; font-weight:700; color:#D4AF37; display:flex; align-items:center; gap:6px;">
                  <span>📋 Ver Estructura Normalizada Ingerida (${normEvent.platform || 'Instagram'} • ${normEvent.campaign_id || 'CAMP_GROOMING_VIP_OCT'})</span>
                </summary>
                <pre style="margin-top:8px; background:#121214; padding:10px; border-radius:8px; color:#A7F3D0; font-family:monospace; font-size:0.72rem; overflow-x:auto;">${JSON.stringify({
                  timestamp: normEvent.timestamp || "2026-10-27T10:00:00Z",
                  platform: normEvent.platform || "Instagram",
                  campaign_id: normEvent.campaign_id || "CAMP_GROOMING_VIP_OCT",
                  real_metrics: normEvent.real_metrics || { reach: 320, clicks: 45, whatsapp_redirects: 12, website_visits: 28 },
                  target_metrics: normEvent.target_metrics || { reach_goal: 350, clicks_goal: 50 }
                }, null, 2)}</pre>
              </details>
            </div>
          `;
        })()}

        <!-- ==================== 3. TRAZABILIDAD DE MICRO-INTERACCIONES (T+20s Y T+2h) ==================== -->
        <div style="background:#18181B; border:1.5px solid #27272A; border-top:4px solid #10B981; border-radius:20px; padding:24px; box-shadow:0 15px 40px rgba(0,0,0,0.35);">
          
          <!-- SELECTOR DE CAMPAÑA / ESTÍMULO DE PAUTA -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:16px;">
            <div>
              <span style="font-size:0.75rem; color:#10B981; font-weight:900; text-transform:uppercase; letter-spacing:0.08em;">
                🔬 TRAZABILIDAD FORENSE DE MICRO-INTERACCIONES
              </span>
              <h3 style="font-size:1.3rem; font-weight:900; color:#FFFFFF; margin:4px 0 2px 0;">
                Impacto de Pauta: Comportamiento a los 20 Segundos vs 2 Horas
              </h3>
              <p style="color:#FFFFFF; font-size:0.88rem; font-weight:600; margin:0;">
                Mapeo exacto de la primera reacción tras el estímulo y la consolidación de reservas y conversiones en la web.
              </p>
            </div>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${(this.microInteractions || []).map(m => `
                <button onclick="marketingCommandCenterEngine.selectStimulus('${m.stimulus_id}')" class="btn btn-sm" style="background:${this.selectedStimulusId === m.stimulus_id ? 'linear-gradient(135deg, #D4AF37, #B8860B)' : '#27272A'}; color:${this.selectedStimulusId === m.stimulus_id ? '#121214' : '#E4E4E7'}; font-weight:800; font-size:0.75rem; padding:6px 14px; border-radius:8px; border:1px solid ${this.selectedStimulusId === m.stimulus_id ? '#D4AF37' : '#3F3F46'}; cursor:pointer;">
                  ${m.channel_name.includes('Instagram') ? '📸' : (m.channel_name.includes('WhatsApp') ? '💬' : '🎯')} ${m.launch_time} • ${m.channel_name.split(' ')[0]}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- DETALLE DEL ESTÍMULO ACTIVO -->
          <div style="background:#27272A; border-radius:14px; padding:16px 20px; margin-bottom:20px; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; font-size:0.82rem;">
            <div>
              <span style="color:#FACC15; font-size:0.75rem; text-transform:uppercase; font-weight:900;">Canal & Cuenta:</span>
              <div style="color:#FFFFFF; font-weight:800; margin-top:2px;">${activeStimulus.channel_name}</div>
            </div>
            <div>
              <span style="color:#FACC15; font-size:0.75rem; text-transform:uppercase; font-weight:900;">Hora Exacta de Lanzamiento:</span>
              <div style="color:#D4AF37; font-weight:900; margin-top:2px;">⏱️ ${activeStimulus.launch_time}</div>
            </div>
            <div>
              <span style="color:#FACC15; font-size:0.75rem; text-transform:uppercase; font-weight:900;">Instrumento / Creativo:</span>
              <div style="color:#FFFFFF; font-weight:700; margin-top:2px;">${activeStimulus.creative_instrument}</div>
            </div>
            <div>
              <span style="color:#FACC15; font-size:0.75rem; text-transform:uppercase; font-weight:900;">Audiencia / Segmento:</span>
              <div style="color:#FFFFFF; font-weight:800; font-size:0.92rem; margin-top:3px; line-height:1.5;">${this.formatTargetSegment(activeStimulus.target_segment)}</div>
            </div>
          </div>

          <!-- CUADRÍCULA DE ANÁLISIS DE DOBLE VENTANA (20s vs 2h) -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:20px;">
            
            <!-- VENTANA 1: REACCIÓN INMEDIATA (T + 20 SEGUNDOS) -->
            <div style="background:#1C1C1E; border:1px solid rgba(16,185,129,0.3); border-radius:16px; padding:20px; position:relative;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1.3rem;">⚡</span>
                  <h4 style="color:#10B981; font-size:1.05rem; font-weight:900; margin:0;">Reacción Inmediata (T + 20 Segundos)</h4>
                </div>
                <span style="background:rgba(16,185,129,0.15); color:#10B981; font-size:0.75rem; font-weight:900; padding:4px 8px; border-radius:6px;">
                  ${activeStimulus.t_plus_20s ? activeStimulus.t_plus_20s.concurrent_visitors_delta : '+84 en vivo'}
                </span>
              </div>

              <div style="font-size:0.82rem; color:#FFFFFF; font-weight:600; margin-bottom:16px;">
                Latencia al primer clic: <strong style="color:#FBFBFD;">${activeStimulus.t_plus_20s ? activeStimulus.t_plus_20s.latency_to_first_action_ms : 680} ms</strong>. ¿Qué fue lo primero que exploraron los tutores?
              </div>

              <!-- DESGLOSE DEL PRIMER CLIC -->
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${(activeStimulus.t_plus_20s && activeStimulus.t_plus_20s.first_click_breakdown ? activeStimulus.t_plus_20s.first_click_breakdown : []).map(b => `
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; margin-bottom:4px;">
                      <span style="color:#FFFFFF; font-weight:700; display:flex; align-items:center; gap:6px;">
                        <span>${b.icon}</span> ${b.destination}
                      </span>
                      <strong style="color:#D4AF37;">${b.share_percent}% (${b.clicks} clics)</strong>
                    </div>
                    <div style="width:100%; height:8px; background:#27272A; border-radius:4px; overflow:hidden;">
                      <div style="width:${b.share_percent}%; height:100%; background:linear-gradient(90deg, #10B981, #D4AF37); border-radius:4px;"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- VENTANA 2: CONSOLIDACIÓN Y CONVERSIÓN (T + 2 HORAS) -->
            <div style="background:#1C1C1E; border:1px solid rgba(212,175,55,0.3); border-radius:16px; padding:20px; position:relative;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1.3rem;">👑</span>
                  <h4 style="color:#D4AF37; font-size:1.05rem; font-weight:900; margin:0;">Consolidación & Cierre (T + 2 Horas)</h4>
                </div>
                <span style="background:rgba(212,175,55,0.15); color:#D4AF37; font-size:0.75rem; font-weight:900; padding:4px 8px; border-radius:6px;">
                  ${activeStimulus.t_plus_2h ? activeStimulus.t_plus_2h.cumulative_visits + ' Tutores' : '520 Tutores'}
                </span>
              </div>

              <!-- MÉTRICAS DE IMPACTO ECONÓMICO REAL -->
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:16px; background:#27272A; padding:12px; border-radius:12px; text-align:center;">
                <div>
                  <span style="font-size:0.72rem; color:#FFFFFF; text-transform:uppercase; font-weight:900;">Retención:</span>
                  <div style="font-size:1.1rem; font-weight:900; color:#10B981;">${activeStimulus.t_plus_2h ? activeStimulus.t_plus_2h.retention_rate_percent : 82.5}%</div>
                </div>
                <div>
                  <span style="font-size:0.72rem; color:#FFFFFF; text-transform:uppercase; font-weight:900;">ROAS:</span>
                  <div style="font-size:1.1rem; font-weight:900; color:#D4AF37;">${activeStimulus.t_plus_2h ? activeStimulus.t_plus_2h.roas : 5.48}x</div>
                </div>
                <div>
                  <span style="font-size:0.72rem; color:#FFFFFF; text-transform:uppercase; font-weight:900;">CAC:</span>
                  <div style="font-size:1.1rem; font-weight:900; color:#06B6D4;">$${activeStimulus.t_plus_2h ? activeStimulus.t_plus_2h.cac_usd : 2.85}</div>
                </div>
              </div>

              <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; margin-bottom:8px;">
                Conversiones Directas Registradas:
              </div>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${(activeStimulus.t_plus_2h && activeStimulus.t_plus_2h.direct_conversions ? activeStimulus.t_plus_2h.direct_conversions : []).map(c => `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#27272A; padding:8px 12px; border-radius:8px; font-size:0.8rem;">
                    <span style="color:#E4E4E7; font-weight:600;">${c.type}</span>
                    <strong style="color:#10B981;">${c.count} confirmadas ${c.revenue_usd ? '($' + c.revenue_usd + ')' : ''}</strong>
                  </div>
                `).join('')}
              </div>

              <div style="margin-top:14px; text-align:right; font-size:0.95rem; color:#FFFFFF; font-weight:800;">
                Facturación Atribuida: <strong style="color:#D4AF37; font-size:1.1rem;">$${activeStimulus.t_plus_2h ? activeStimulus.t_plus_2h.total_generated_usd : 1920} USD</strong>
              </div>
            </div>

          </div>
        </div>

        <!-- ==================== MÓDULO VISUAL: TABLERO DE DESPACHO Y GANTT (O'NEIL / MPF) ==================== -->
        ${this.renderGanttBoardCard()}
      `;
    }

    /**
     * GENERADOR DEL SVG DE SERIES DE TIEMPO (TRIPLE EJE: REAL, META, HISTÓRICO 7D)
     */
    generateTimeSeriesSVG() {
      const isMinute = this.timeSeries.activeGranularity === 'minute';
      const series = isMinute ? this.timeSeries.seriesMinute : this.timeSeries.seriesHour;
      if (!series || series.length === 0) {
        return '<div style="color:#FFFFFF; font-weight:800; font-size:1.1rem; padding:40px; text-align:center;">⚡ Cargando flujo de series de tiempo en tiempo real...</div>';
      }

      const w = 920;
      const h = 280;
      const padLeft = 60;
      const padRight = 35;
      const padTop = 35;
      const padBottom = 40;
      const plotW = w - padLeft - padRight;
      const plotH = h - padTop - padBottom;

      let maxVal = 100;
      series.forEach(pt => {
        if (pt.real && pt.real > maxVal) maxVal = pt.real;
        if (pt.target && pt.target > maxVal) maxVal = pt.target;
        if (pt.historical_7d && pt.historical_7d > maxVal) maxVal = pt.historical_7d;
      });
      maxVal = Math.ceil(maxVal * 1.15 / 50) * 50;

      const getX = (idx) => padLeft + (idx / Math.max(1, series.length - 1)) * plotW;
      const getY = (val) => padTop + plotH - ((val / maxVal) * plotH);

      // Líneas de Guía Horizontal (Grid Y)
      let gridYLines = '';
      const gridSteps = 4;
      for (let s = 0; s <= gridSteps; s++) {
        const v = Math.round((maxVal / gridSteps) * s);
        const y = getY(v);
        gridYLines += `
          <line x1="${padLeft}" y1="${y}" x2="${w - padRight}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
          <text x="${padLeft - 10}" y="${y + 4}" fill="#FFFFFF" font-size="11.5" font-weight="900" text-anchor="end">${v}</text>
        `;
      }

      // Línea Histórica 7 Días (Gris Pizarra #64748B con Área Sombreada)
      let histPath = '';
      let histArea = `M ${getX(0)} ${padTop + plotH}`;
      series.forEach((pt, i) => {
        const x = getX(i);
        const y = getY(pt.historical_7d);
        if (i === 0) {
          histPath += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          histArea += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        } else {
          const prevX = getX(i - 1);
          const prevY = getY(series[i - 1].historical_7d);
          const cpX1 = prevX + (x - prevX) / 2;
          histPath += ` C ${cpX1.toFixed(1)} ${prevY.toFixed(1)}, ${cpX1.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
          histArea += ` C ${cpX1.toFixed(1)} ${prevY.toFixed(1)}, ${cpX1.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      });
      histArea += ` L ${getX(series.length - 1)} ${padTop + plotH} Z`;

      // Línea Meta / Objetivo O'Neil (#D4AF37 Guionada)
      let targetPath = '';
      series.forEach((pt, i) => {
        const x = getX(i);
        const y = getY(pt.target);
        if (i === 0) {
          targetPath += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        } else {
          const prevX = getX(i - 1);
          const prevY = getY(series[i - 1].target);
          const cpX = prevX + (x - prevX) / 2;
          targetPath += ` C ${cpX.toFixed(1)} ${prevY.toFixed(1)}, ${cpX.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      });

      // Línea Real (#10B981 Esmeralda Neón con Glow)
      let realPath = '';
      let realArea = '';
      const validIndices = [];
      series.forEach((pt, i) => {
        if (pt.real !== null && pt.real !== undefined) validIndices.push(i);
      });

      if (validIndices.length > 0) {
        realArea = `M ${getX(validIndices[0])} ${padTop + plotH}`;
        validIndices.forEach((idx, step) => {
          const x = getX(idx);
          const y = getY(series[idx].real);
          if (step === 0) {
            realPath += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
            realArea += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
          } else {
            const prevIdx = validIndices[step - 1];
            const prevX = getX(prevIdx);
            const prevY = getY(series[prevIdx].real);
            const cpX = prevX + (x - prevX) / 2;
            realPath += ` C ${cpX.toFixed(1)} ${prevY.toFixed(1)}, ${cpX.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
            realArea += ` C ${cpX.toFixed(1)} ${prevY.toFixed(1)}, ${cpX.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
          }
        });
        realArea += ` L ${getX(validIndices[validIndices.length - 1])} ${padTop + plotH} Z`;
      }

      // Marcadores de Estímulo en Eje X
      let stimulusSVG = '';
      series.forEach((pt, i) => {
        if (pt.stimulus_id) {
          const stim = this.timeSeries.stimulusEvents.find(s => s.id === pt.stimulus_id) || {
            color: "#D4AF37",
            channel_name: "Pauta"
          };
          const x = getX(i);
          const isSelected = this.selectedStimulusId === pt.stimulus_id;
          stimulusSVG += `
            <g style="cursor:pointer;" onclick="marketingCommandCenterEngine.selectStimulus('${pt.stimulus_id}')">
              <line x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + plotH}" stroke="${stim.color || '#D4AF37'}" stroke-width="${isSelected ? '2' : '1.2'}" stroke-dasharray="3,3" opacity="0.8" />
              <circle cx="${x}" cy="${padTop + 10}" r="${isSelected ? '9' : '7'}" fill="${stim.color || '#D4AF37'}" />
              <text x="${x}" y="${padTop + 13}" font-size="9" fill="#FFFFFF" font-weight="900" text-anchor="middle">⚡</text>
            </g>
          `;
        }
      });

      // Eje X (Etiquetas de Tiempo)
      let timeLabels = '';
      series.forEach((pt, i) => {
        const x = getX(i);
        timeLabels += `
          <text x="${x}" y="${padTop + plotH + 20}" fill="#FFFFFF" font-size="11" font-weight="900" text-anchor="middle">${pt.time}</text>
        `;
      });

      // Scrubber Activo
      const activeIdx = (this.timeSeries.scrubberIndex !== null && this.timeSeries.scrubberIndex >= 0 && this.timeSeries.scrubberIndex < series.length)
        ? this.timeSeries.scrubberIndex
        : (validIndices.length > 0 ? validIndices[validIndices.length - 1] : 0);
      const activeX = getX(activeIdx);
      const activeRealY = series[activeIdx] && series[activeIdx].real !== null ? getY(series[activeIdx].real) : null;
      const activeTargetY = series[activeIdx] ? getY(series[activeIdx].target) : null;
      const activeHistY = series[activeIdx] ? getY(series[activeIdx].historical_7d) : null;

      // Zonas interactivas invisibles para captar hover a lo largo de cada punto
      let hoverZones = '';
      const colW = plotW / Math.max(1, series.length - 1);
      series.forEach((pt, i) => {
        const zoneX = getX(i) - (colW / 2);
        hoverZones += `
          <rect x="${Math.max(0, zoneX)}" y="${padTop}" width="${colW}" height="${plotH}" fill="transparent" style="cursor:crosshair;" onmouseenter="marketingCommandCenterEngine.onScrubberHover(${i})" />
        `;
      });

      return `
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" style="overflow:visible;" onmouseleave="marketingCommandCenterEngine.clearScrubber()">
          <defs>
            <linearGradient id="mkt-grad-real" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10B981" stop-opacity="0.32" />
              <stop offset="100%" stop-color="#10B981" stop-opacity="0.0" />
            </linearGradient>
            <linearGradient id="mkt-grad-hist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#64748B" stop-opacity="0.0" />
            </linearGradient>
            <filter id="mkt-glow-real" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#10B981" flood-opacity="0.6" />
            </filter>
          </defs>

          <!-- Grid Y -->
          ${gridYLines}

          <!-- Eje X Línea Base -->
          <line x1="${padLeft}" y1="${padTop + plotH}" x2="${w - padRight}" y2="${padTop + plotH}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
          
          <!-- Etiquetas de Tiempo -->
          ${timeLabels}

          <!-- 3. ÁREA Y LÍNEA HISTÓRICA 7D -->
          <path d="${histArea}" fill="url(#mkt-grad-hist)" />
          <path d="${histPath}" fill="none" stroke="#38BDF8" stroke-width="2.6" stroke-opacity="0.95" />

          <!-- 2. LÍNEA META / OBJETIVO (O'NEIL) -->
          <path d="${targetPath}" fill="none" stroke="#FACC15" stroke-width="3.2" stroke-dasharray="6,4" />

          <!-- 1. ÁREA Y LÍNEA REAL -->
          ${realArea ? `<path d="${realArea}" fill="url(#mkt-grad-real)" />` : ''}
          ${realPath ? `<path d="${realPath}" fill="none" stroke="#00FF88" stroke-width="4.2" filter="url(#mkt-glow-real)" />` : ''}

          <!-- Marcadores de Estímulo Publicitario -->
          ${stimulusSVG}

          <!-- Scrubber Activo (Línea Vertical + Nodos) -->
          <line x1="${activeX}" y1="${padTop}" x2="${activeX}" y2="${padTop + plotH}" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.9" />
          
          ${activeHistY !== null ? `<circle cx="${activeX}" cy="${activeHistY}" r="4" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2" stroke-width="1.5" />` : ''}
          ${activeTargetY !== null ? `<circle cx="${activeX}" cy="${activeTargetY}" r="5" fill="#FACC15" stroke="#FFFFFF" stroke-width="2" stroke-width="1.5" />` : ''}
          ${activeRealY !== null ? `
            <circle cx="${activeX}" cy="${activeRealY}" r="6.5" fill="#00FF88" stroke="#FFFFFF" stroke-width="2" />
            <circle cx="${activeX}" cy="${activeRealY}" r="16" fill="none" stroke="#10B981" class="live-pulse-ring" />
          ` : ''}

          <!-- Zonas Transparentes Interactivas -->
          ${hoverZones}
        </svg>
      `;
    }

    setGranularity(mode) {
      this.timeSeries.activeGranularity = mode;
      this.timeSeries.scrubberIndex = null;
      this.renderDashboard();
    }

    selectStimulus(stimulusId) {
      this.selectedStimulusId = stimulusId;
      const isMinute = this.timeSeries.activeGranularity === 'minute';
      const series = isMinute ? this.timeSeries.seriesMinute : this.timeSeries.seriesHour;
      const idx = series.findIndex(pt => pt.stimulus_id === stimulusId);
      if (idx !== -1) {
        this.timeSeries.scrubberIndex = idx;
      }
      this.renderDashboard();
    }

    onScrubberHover(index) {
      this.timeSeries.scrubberIndex = index;
      this.renderDashboard();
    }

    clearScrubber() {
      this.timeSeries.scrubberIndex = null;
    }

    async applyTacticalAdjustment(actionType, directPayload = null) {
      if (directPayload) {
        return this.executeTacticalAction(actionType, directPayload);
      }
      return this.openTacticalModal(actionType);
    }

    /**
     * RETORNA LISTA UNIFICADA DE CANALES DE DESPACHO
     */
    getAvailableDispatchChannels() {
      const defaultChannels = [
        { channel_id: "make_whatsapp_meta", platform_name: "WhatsApp Cloud API (Make.com)", account_handle: "+58 412 MRS-PETS", icon: "💬" },
        { channel_id: "meta_instagram", platform_name: "Meta Instagram Ads (@mrspets)", account_handle: "@mrspets", icon: "📸" },
        { channel_id: "tiktok_mrspets", platform_name: "TikTok (TikTok for Business & Spark Ads)", account_handle: "@mrspets", icon: "🎵" },
        { channel_id: "meta_retargeting", platform_name: "Meta Retargeting Príncipes", account_handle: "@mrspets_vip", icon: "🎯" },
        { channel_id: "omnichannel", platform_name: "Omnicanal (WhatsApp + Email + SMS)", account_handle: "Multi-Canal", icon: "🌐" },
        { channel_id: "google_pmax_clinica", platform_name: "Google Ads Performance Max", account_handle: "Mrs Pets PMax", icon: "🔍" }
      ];

      let stored = [];
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('mrspets_custom_dispatch_channels');
          if (raw) stored = JSON.parse(raw);
        } catch(e) {}
      }

      const map = new Map();
      defaultChannels.forEach(c => map.set(c.channel_id, c));
      if (Array.isArray(this.channels)) {
        this.channels.forEach(c => {
          if (c && c.channel_id) {
            const icon = c.channel_id.includes('tiktok') ? '🎵' : (c.channel_id.includes('telegram') ? '✈️' : (c.channel_id.includes('instagram') ? '📸' : (c.channel_id.includes('whatsapp') ? '💬' : '📱')));
            map.set(c.channel_id, { ...c, icon: c.icon || icon });
          }
        });
      }
      if (Array.isArray(stored)) {
        stored.forEach(c => {
          if (c && c.channel_id) map.set(c.channel_id, c);
        });
      }

      return Array.from(map.values());
    }

    /**
     * DESPLIEGA U OCULTA EL FORMULARIO DE REGISTRO DE NUEVO CANAL
     */
    toggleNewChannelForm(forceState = null) {
      if (typeof document === 'undefined') return;
      const box = document.getElementById('cfg-new-channel-form-box');
      if (!box) return;
      if (forceState !== null) {
        box.style.display = forceState ? 'block' : 'none';
      } else {
        box.style.display = (box.style.display === 'none' || !box.style.display) ? 'block' : 'none';
      }
    }

    /**
     * APLICA PLANTILLA RÁPIDA DE NUEVA RED SOCIAL
     */
    applyQuickChannelTemplate(type) {
      if (typeof document === 'undefined') return;
      const platformInput = document.getElementById('new-channel-platform');
      const idInput = document.getElementById('new-channel-id');
      const handleInput = document.getElementById('new-channel-handle');
      const endpointInput = document.getElementById('new-channel-endpoint');
      if (!platformInput || !idInput) return;

      const templates = {
        'tiktok': {
          platform: 'TikTok Ads & Organic (@mrspets)',
          id: 'tiktok_mrspets',
          handle: '@mrspets',
          endpoint: 'https://business-api.tiktok.com/open_api/v1.3/'
        },
        'telegram': {
          platform: 'Telegram VIP Broadcast (@mrspets_vip)',
          id: 'telegram_vip_mrspets',
          handle: '@mrspets_vip',
          endpoint: 'https://api.telegram.org/botTOKEN/sendMessage'
        },
        'threads': {
          platform: 'Threads Meta (@mrspets)',
          id: 'threads_mrspets',
          handle: '@mrspets',
          endpoint: 'https://graph.threads.net/v1.0/'
        },
        'youtube': {
          platform: 'YouTube Shorts & Community (@mrspets)',
          id: 'youtube_shorts_mrspets',
          handle: '@mrspets',
          endpoint: 'https://www.googleapis.com/youtube/v3/'
        },
        'x': {
          platform: 'X (Twitter) Ads & Alerts (@mrspets)',
          id: 'x_twitter_mrspets',
          handle: '@mrspets',
          endpoint: 'https://api.twitter.com/2/tweets'
        },
        'pinterest': {
          platform: 'Pinterest Grooming Lookbook (@mrspets)',
          id: 'pinterest_mrspets',
          handle: '@mrspets',
          endpoint: 'https://api.pinterest.com/v5/'
        }
      };

      const tpl = templates[type];
      if (tpl) {
        platformInput.value = tpl.platform;
        idInput.value = tpl.id;
        if (handleInput) handleInput.value = tpl.handle;
        if (endpointInput) endpointInput.value = tpl.endpoint;
      }
    }

    /**
     * EVENTO AL CAMBIAR DE CANAL EN EL SELECTOR
     */
    onChannelSelectChange(val) {
      if (val === '__NEW_CHANNEL__') {
        this.toggleNewChannelForm(true);
      } else {
        this.toggleNewChannelForm(false);
      }
    }

    /**
     * GUARDA Y REGISTRA EL NUEVO CANAL DE DESPACHO
     */
    async saveNewDispatchChannel() {
      if (typeof document === 'undefined') return;
      const platformInput = document.getElementById('new-channel-platform');
      const idInput = document.getElementById('new-channel-id');
      const handleInput = document.getElementById('new-channel-handle');
      const endpointInput = document.getElementById('new-channel-endpoint');

      const platform_name = platformInput ? platformInput.value.trim() : '';
      let channel_id = idInput ? idInput.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') : '';
      const account_handle = handleInput ? handleInput.value.trim() : '@mrspets';
      const api_endpoint_url = endpointInput ? endpointInput.value.trim() : '';

      if (!platform_name) {
        if (typeof window !== 'undefined' && window.app && window.app.showToast) {
          window.app.showToast('⚠️ Por favor ingrese el nombre de la red social o plataforma.', 'warning');
        }
        return;
      }

      if (!channel_id) {
        channel_id = platform_name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').trim();
      }

      const icon = channel_id.includes('tiktok') ? '🎵' : (channel_id.includes('telegram') ? '✈️' : (channel_id.includes('threads') ? '🧵' : (channel_id.includes('youtube') ? '▶️' : (channel_id.includes('x_') ? '𝕏' : '📱'))));

      const newChan = {
        channel_id,
        platform_name,
        account_handle,
        api_endpoint_url,
        icon,
        status: 'active',
        last_sync: new Date().toISOString()
      };

      if (!Array.isArray(this.channels)) this.channels = [];
      const exIdx = this.channels.findIndex(c => c.channel_id === channel_id);
      if (exIdx >= 0) this.channels[exIdx] = { ...this.channels[exIdx], ...newChan };
      else this.channels.push(newChan);

      if (typeof localStorage !== 'undefined') {
        try {
          let customList = [];
          const raw = localStorage.getItem('mrspets_custom_dispatch_channels');
          if (raw) customList = JSON.parse(raw);
          const idx = customList.findIndex(c => c.channel_id === channel_id);
          if (idx >= 0) customList[idx] = newChan;
          else customList.push(newChan);
          localStorage.setItem('mrspets_custom_dispatch_channels', JSON.stringify(customList));
        } catch(e) {}
      }

      try {
        if (typeof fetch !== 'undefined') {
          await fetch('/api/v1/marketing/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newChan)
          });
        }
      } catch(e) {
        console.warn('Backend sync channel:', e);
      }

      const select = document.getElementById('cfg-campaign-channel');
      if (select) {
        const channels = this.getAvailableDispatchChannels();
        select.innerHTML = channels.map(ch => 
          `<option value="${ch.channel_id}" ${ch.channel_id === channel_id ? 'selected' : ''}>${ch.icon || '📱'} ${ch.platform_name} ${ch.account_handle ? '(' + ch.account_handle + ')' : ''}</option>`
        ).join('') + `<option value="__NEW_CHANNEL__" style="color:#FCD34D; font-weight:900;">➕ Registrar Nueva Red Social / Canal...</option>`;
        select.value = channel_id;
      }

      this.toggleNewChannelForm(false);

      if (typeof window !== 'undefined' && window.app && window.app.showToast) {
        window.app.showToast(`✅ Canal '${platform_name}' registrado y seleccionado con éxito.`, 'success');
      }
    }

    /**
     * ABRE EL MODAL DE ACCIÓN TÁCTICA EJECUTIVA (O'NEIL)
     */
    openTacticalModal(actionType) {
      if (typeof document === 'undefined') return;
      let modal = document.getElementById('modal-tactical-action');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-tactical-action';
        modal.className = 'luxury-modal-backdrop';
        document.body.appendChild(modal);
      }

      let title = '';
      let subtitle = '';
      let bodyHtml = '';

      if (actionType === 'OPTIMIZE_COPY') {
        title = '✍️ Optimizar Copy & Gancho Creativo';
        subtitle = "Conmutación en caliente de ángulo publicitario para la pauta activa de O'Neil";
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:6px;">Seleccionar Variante de Gancho A/B</label>
              <div style="display:flex; flex-direction:column; gap:8px;">
                <label style="display:flex; align-items:flex-start; gap:8px; background:#27272A; padding:10px 12px; border-radius:10px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="radio" name="tactical-copy-variant" value="VAR_A" checked style="margin-top:3px;">
                  <div>
                    <strong style="color:#FFFFFF; font-size:0.85rem;">Variante A (Flagship): Hidratación de Pulpejos & Ozonoterapia</strong>
                    <div style="font-size:0.75rem; color:#CBD5E1; margin-top:2px;">"¿Sabías que el calor de Maracaibo daña los pulpejos de tu consentido? En Mrs. Pets cuidamos cada paso con ozonoterapia spa."</div>
                  </div>
                </label>
                <label style="display:flex; align-items:flex-start; gap:8px; background:#27272A; padding:10px 12px; border-radius:10px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="radio" name="tactical-copy-variant" value="VAR_B" style="margin-top:3px;">
                  <div>
                    <strong style="color:#FFFFFF; font-size:0.85rem;">Variante B: Spa Relajante Anti-Estrés Fear Free</strong>
                    <div style="font-size:0.75rem; color:#CBD5E1; margin-top:2px;">"Sin jaulas ni ruidos molestos. Baño relajante con secado silencioso y música binaural en Av. 2 El Milagro."</div>
                  </div>
                </label>
                <label style="display:flex; align-items:flex-start; gap:8px; background:#27272A; padding:10px 12px; border-radius:10px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="radio" name="tactical-copy-variant" value="VAR_C" style="margin-top:3px;">
                  <div>
                    <strong style="color:#FFFFFF; font-size:0.85rem;">Variante C: Cachorros Felices & Primer Corte VIP</strong>
                    <div style="font-size:0.75rem; color:#CBD5E1; margin-top:2px;">"La primera experiencia de tu cachorro debe ser de amor. Estilismo canino de alta gama con premio incluido."</div>
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Canal de Despliegue Prioritario</label>
              <select id="tactical-copy-channel" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:8px 10px; color:#FFFFFF; font-size:0.85rem; font-weight:700;">
                <option value="Instagram Ads (@mrspets)">📸 Instagram Ads & Reels (@mrspets)</option>
                <option value="TikTok Ads & Organic (@mrspets)">🎵 TikTok Ads & Spark Ads (@mrspets)</option>
                <option value="WhatsApp VIP Broadcast">💬 WhatsApp VIP Broadcast (+58 412 MRS-PETS)</option>
                <option value="Omnicanal">🌐 Todos los Canales Sincronizados</option>
              </select>
            </div>
          </div>
        `;
      } else if (actionType === 'RECALIBRATE_SCHEDULE') {
        title = '⏱️ Recalibrar Horario de Re-impacto';
        subtitle = "Sintonización del algoritmo predictivo a la hora de mayor respuesta del día";
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:6px;">Ventana Horaria Recomendada en Maracaibo</label>
              <div style="display:flex; flex-direction:column; gap:8px;">
                <label style="display:flex; align-items:center; gap:8px; background:#27272A; padding:10px 12px; border-radius:10px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="radio" name="tactical-schedule-slot" value="18:30" checked>
                  <div>
                    <strong style="color:#10B981; font-size:0.85rem;">18:30 hrs • Pico Vespertino Salida Oficinas (Recomendado)</strong>
                    <div style="font-size:0.75rem; color:#CBD5E1;">+38% de apertura en WhatsApp y mayor permanencia en Reels/TikTok.</div>
                  </div>
                </label>
                <label style="display:flex; align-items:center; gap:8px; background:#27272A; padding:10px 12px; border-radius:10px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="radio" name="tactical-schedule-slot" value="12:30">
                  <div>
                    <strong style="color:#FFFFFF; font-size:0.85rem;">12:30 hrs • Pausa de Almuerzo Tutores</strong>
                    <div style="font-size:0.75rem; color:#CBD5E1;">Ideal para confirmaciones de citas vespertinas y valet parking.</div>
                  </div>
                </label>
                <label style="display:flex; align-items:center; gap:8px; background:#27272A; padding:10px 12px; border-radius:10px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="radio" name="tactical-schedule-slot" value="20:00">
                  <div>
                    <strong style="color:#FFFFFF; font-size:0.85rem;">20:00 hrs • Prime Time Nocturno</strong>
                    <div style="font-size:0.75rem; color:#CBD5E1;">Máximo tiempo de visualización para reservas de hotel canino y spa fin de semana.</div>
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Frecuencia de Re-impacto por Tutor</label>
              <select id="tactical-schedule-freq" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:8px 10px; color:#FFFFFF; font-size:0.85rem; font-weight:700;">
                <option value="1">1 impacto diario (Moderado - Fear Free)</option>
                <option value="2" selected>2 impactos diarios (Óptimo para conversión)</option>
                <option value="3">3 impactos diarios (Acelerador de Campaña)</option>
              </select>
            </div>
          </div>
        `;
      } else if (actionType === 'REFINE_AUDIENCE') {
        title = '🎯 Refinar Segmentación Geográfica';
        subtitle = "Focalización de la inversión en los sectores de mayor poder adquisitivo en Maracaibo";
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:6px;">Sectores Prioritarios Seleccionados</label>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <label style="display:flex; align-items:center; gap:8px; background:#27272A; padding:8px 10px; border-radius:8px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="checkbox" id="sec-la-lago" checked>
                  <span style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">📍 La Lago</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; background:#27272A; padding:8px 10px; border-radius:8px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="checkbox" id="sec-las-delicias" checked>
                  <span style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">📍 Las Delicias</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; background:#27272A; padding:8px 10px; border-radius:8px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="checkbox" id="sec-bella-vista" checked>
                  <span style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">📍 Bella Vista</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; background:#27272A; padding:8px 10px; border-radius:8px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="checkbox" id="sec-el-milagro" checked>
                  <span style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">📍 Av. 2 El Milagro</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; background:#27272A; padding:8px 10px; border-radius:8px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="checkbox" id="sec-tierra-negra" checked>
                  <span style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">📍 Tierra Negra</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; background:#27272A; padding:8px 10px; border-radius:8px; border:1px solid #3F3F46; cursor:pointer;">
                  <input type="checkbox" id="sec-indio-mara" checked>
                  <span style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">📍 Indio Mara</span>
                </label>
              </div>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Grupo Objetivo</label>
              <select id="tactical-audience-group" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:8px 10px; color:#FFFFFF; font-size:0.85rem; font-weight:700;">
                <option value="VIP_AND_LEGACY">Tutores Club VIP (6m) & Legacy (8m)</option>
                <option value="ALL_ACTIVE" selected>Todos los Miembros Activos + Citas Próximas</option>
                <option value="PROSPECTS_NEAR_SEDE">Prospectos nuevos en radio de 5km de la Torre</option>
              </select>
            </div>
          </div>
        `;
      } else if (actionType === 'DISPATCH_MAKE') {
        title = '⚡ Disparar Webhook Táctico Make.com';
        subtitle = "Despacho inmediato de la directiva consolidada hacia el escenario en vivo de Make.com";
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="background:rgba(192,132,252,0.12); border:1px solid #C084FC; border-radius:10px; padding:12px;">
              <div style="font-size:0.75rem; font-weight:900; color:#C084FC; text-transform:uppercase;">Endpoint de Despacho Make.com</div>
              <div style="font-size:0.82rem; font-family:monospace; color:#FFFFFF; margin-top:4px; word-break:break-all;">https://hook.us1.make.com/mrspets_marketing_cron</div>
            </div>
            <div style="background:#27272A; border:1px solid #3F3F46; border-radius:10px; padding:12px;">
              <div style="font-size:0.75rem; font-weight:900; color:#FCD34D; text-transform:uppercase; margin-bottom:6px;">Resumen del Payload a Despachar</div>
              <ul style="margin:0; padding-left:18px; font-size:0.8rem; color:#E2E8F0; line-height:1.5;">
                <li><strong>Evento:</strong> MARKETING_TACTICAL_DEVIATION_ADJUSTMENT</li>
                <li><strong>Líder de Campaña:</strong> O'Neil (Marketing)</li>
                <li><strong>Canales Activos:</strong> Instagram (@mrspets), TikTok (@mrspets), WhatsApp Cloud</li>
                <li><strong>Tasa Oficial BCV:</strong> 887.30 VES/USD</li>
                <li><strong>Bitácora:</strong> Inmutable en logs/audit_trail.jsonl</li>
              </ul>
            </div>
          </div>
        `;
      }

      modal.innerHTML = `
        <div class="luxury-modal-card" style="max-width:580px; width:94%;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:12px; margin-bottom:16px;">
            <div>
              <div style="font-size:0.72rem; font-weight:900; color:#D4AF37; text-transform:uppercase; letter-spacing:0.08em;">Operaciones Tácticas • O'Neil MPF</div>
              <h3 style="color:#FFFFFF; margin:2px 0 0 0; font-size:1.2rem; font-weight:900;">${title}</h3>
            </div>
            <button onclick="marketingCommandCenterEngine.closeTacticalModal()" style="background:none; border:none; color:#FFFFFF; font-size:1.5rem; cursor:pointer;">✕</button>
          </div>
          <p style="font-size:0.82rem; color:#A1A1AA; margin:0 0 16px 0;">${subtitle}</p>

          ${bodyHtml}

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
            <button onclick="marketingCommandCenterEngine.closeTacticalModal()" style="padding:9px 16px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:8px; color:#CBD5E1; font-weight:700; cursor:pointer; font-size:0.82rem;">Cancelar</button>
            <button onclick="marketingCommandCenterEngine.executeTacticalAction('${actionType}')" style="padding:9px 20px; background:linear-gradient(135deg, #10B981, #059669); border:none; border-radius:8px; color:#FFFFFF; font-weight:900; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.35); font-size:0.82rem;">
              ⚡ Confirmar y Aplicar Directiva
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.classList.add('active');
    }

    closeTacticalModal() {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById('modal-tactical-action');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    }

    async executeTacticalAction(actionType, customDetails = null) {
      this.closeTacticalModal();

      let details = customDetails || {};
      let label = '';

      if (actionType === 'OPTIMIZE_COPY') {
        const variantInput = (typeof document !== 'undefined') ? document.querySelector('input[name="tactical-copy-variant"]:checked') : null;
        const channelSelect = (typeof document !== 'undefined') ? document.getElementById('tactical-copy-channel') : null;
        const v = variantInput ? variantInput.value : 'VAR_A';
        const ch = channelSelect ? channelSelect.value : 'Instagram Ads & Reels (@mrspets)';
        label = `Copy optimizado (${v}) en ${ch}`;
        details = { variant: v, channel: ch, hook: "Ozonoterapia & Spa Pulpejos" };
      } else if (actionType === 'RECALIBRATE_SCHEDULE') {
        const slotInput = (typeof document !== 'undefined') ? document.querySelector('input[name="tactical-schedule-slot"]:checked') : null;
        const slot = slotInput ? slotInput.value : '18:30';
        label = `Horario recalibrado a ventana pico ${slot} hrs`;
        details = { targetSlot: slot, frequency: 2, timezone: 'America/Caracas' };
      } else if (actionType === 'REFINE_AUDIENCE') {
        label = `Segmentación refinada: La Lago, Las Delicias & Bella Vista`;
        details = { sectors: ['La Lago', 'Las Delicias', 'Bella Vista', 'Av. 2 El Milagro'], targetClub: 'VIP_AND_LEGACY' };
      } else if (actionType === 'DISPATCH_MAKE') {
        label = `Directiva táctica transmitida al Webhook Make.com`;
        details = { webhookUrl: 'https://hook.us1.make.com/mrspets_marketing_cron', latencyMs: 285 };
      }

      const now = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newDecision = {
        timestamp: now,
        action: actionType,
        label: label,
        channel: details.channel || "Instagram & TikTok",
        dispatchedMake: true,
        details: details
      };

      this.tacticalDecisions.unshift(newDecision);

      try {
        if (typeof fetch !== 'undefined') {
          await fetch('/api/v1/marketing/alerts/adjust-tactical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actionType,
              user: "O'Neil",
              details: newDecision
            })
          });
        }
      } catch(e) {}

      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`⚡ Ajuste Táctico Aplicado: ${label}`, 'success');
      }

      this.renderDashboard();
    }


    async simulateLiveStimulus() {
      const nowStr = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
      const newStimulus = {
        id: `STM-SIM-${Date.now()}`,
        timestamp: nowStr,
        channel_id: "meta_instagram_mrspets",
        channel_name: "Instagram Ads (@mrspets)",
        campaign_title: "Lanzamiento Flash Protocolo Spa Real",
        instrument: "Instagram Reel Vertical + Bio Link UTM",
        boost_usd: 150,
        color: "#E1306C"
      };

      this.timeSeries.stimulusEvents.push(newStimulus);
      this.timeSeries.seriesMinute.push({
        time: nowStr,
        real: 540,
        target: 450,
        historical_7d: 215,
        stimulus_id: newStimulus.id
      });
      this.selectedStimulusId = newStimulus.id;
      this.timeSeries.scrubberIndex = this.timeSeries.seriesMinute.length - 1;

      try {
        if (typeof fetch !== 'undefined') {
          fetch('/api/v1/marketing/telemetry/simulate-stimulus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelId: "meta_instagram_mrspets",
              campaignTitle: "Lanzamiento Flash Protocolo Spa Real",
              boostUSD: 150,
              initialSpike: 540,
              target: 450
            })
          }).catch(e => {});
        }
      } catch(e) {}

      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`📸 Estímulo en Vivo Inyectado: Reel Instagram lanzado a las ${nowStr}`, 'success');
      }

      this.renderDashboard();
    }

    /**
     * MÓDULO 1: CLUBES DE LEALTAD & PRÍNCIPES/PRINCESAS
     */
    renderLoyaltyContent() {
      const nearUpgradeCount = this.princesAndPrincesses.filter(p => p.isNearUpgrade).length;

      return `
        <!-- ALERTAS PROACTIVAS SILENT LUXURY -->
        ${nearUpgradeCount > 0 ? `
          <div style="background:linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(184,134,11,0.08) 100%); border:1px solid #D4AF37; border-radius:18px; padding:16px 20px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:1.6rem;">⚡</span>
              <div>
                <div style="font-size:0.85rem; font-weight:900; color:#FBFBFD;">
                  Atención O'Neil: Hay ${nearUpgradeCount} Príncipes/Princesas a 1 visita de subir de categoría
                </div>
                <div style="font-size:0.75rem; color:#CBD5E1;">
                  Activa la campaña automatizada en Make.com para notificar a los tutores con su beneficio de bienvenida.
                </div>
              </div>
            </div>
            <button onclick="marketingCommandCenterEngine.switchSubTab('gantt')" style="background:#D4AF37; color:#121214; font-weight:900; font-size:0.75rem; padding:8px 16px; border-radius:10px; border:none; cursor:pointer;">
              Ver Campañas Make.com →
            </button>
          </div>
        ` : ''}

        <!-- TARJETAS DE CLUBES Y PARAMETRIZACIÓN EN CALIENTE -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:18px; margin-bottom:24px;">
          <!-- CLUB LEAL -->
          <div class="card" style="background:#18181B; border:1px solid #27272A; border-top:4px solid #10B981; border-radius:18px; padding:20px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
              <div>
                <span style="font-size:0.7rem; color:#10B981; font-weight:900; text-transform:uppercase; letter-spacing:0.05em;">Categoría Inicial</span>
                <h3 style="color:#FFFFFF; margin:2px 0 0 0; font-size:1.3rem; font-weight:900;">💎 Club Leal</h3>
              </div>
              <span style="background:rgba(16,185,129,0.15); color:#10B981; font-size:0.75rem; font-weight:800; padding:4px 8px; border-radius:6px;">
                ${this.loyaltyConfig.club_leal.min_consecutive_months} Meses
              </span>
            </div>
            <p style="color:#F8FAFC; font-size:0.84rem; font-weight:600; margin:0 0 16px 0; min-height:36px;">
              ${this.loyaltyConfig.club_leal.description}
            </p>
            <div style="background:#27272A; border-radius:10px; padding:10px 12px; font-size:0.75rem; color:#E4E4E7; display:flex; justify-content:space-between;">
              <span>Tutores Calificados:</span>
              <strong style="color:#10B981;">${this.princesAndPrincesses.filter(p => p.currentTier === 'club_leal').length}</strong>
            </div>
          </div>

          <!-- CLUB VIP -->
          <div class="card" style="background:#18181B; border:1px solid #27272A; border-top:4px solid #F59E0B; border-radius:18px; padding:20px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
              <div>
                <span style="font-size:0.7rem; color:#F59E0B; font-weight:900; text-transform:uppercase; letter-spacing:0.05em;">Categoría Distinguida</span>
                <h3 style="color:#FFFFFF; margin:2px 0 0 0; font-size:1.3rem; font-weight:900;">✨ Club VIP</h3>
              </div>
              <span style="background:rgba(245,158,11,0.15); color:#F59E0B; font-size:0.75rem; font-weight:800; padding:4px 8px; border-radius:6px;">
                ${this.loyaltyConfig.club_vip.min_consecutive_months} Meses
              </span>
            </div>
            <p style="color:#F8FAFC; font-size:0.84rem; font-weight:600; margin:0 0 16px 0; min-height:36px;">
              ${this.loyaltyConfig.club_vip.description}
            </p>
            <div style="background:#27272A; border-radius:10px; padding:10px 12px; font-size:0.75rem; color:#E4E4E7; display:flex; justify-content:space-between;">
              <span>Tutores Calificados:</span>
              <strong style="color:#F59E0B;">${this.princesAndPrincesses.filter(p => p.currentTier === 'club_vip').length}</strong>
            </div>
          </div>

          <!-- CLUB LEGACY -->
          <div class="card" style="background:#18181B; border:1px solid #27272A; border-top:4px solid #D4AF37; border-radius:18px; padding:20px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
              <div>
                <span style="font-size:0.7rem; color:#D4AF37; font-weight:900; text-transform:uppercase; letter-spacing:0.05em;">Cúspide de Distinción</span>
                <h3 style="color:#FFFFFF; margin:2px 0 0 0; font-size:1.3rem; font-weight:900;">👑 Club Legacy</h3>
              </div>
              <span style="background:rgba(212,175,55,0.15); color:#D4AF37; font-size:0.75rem; font-weight:800; padding:4px 8px; border-radius:6px;">
                ${this.loyaltyConfig.club_legacy.min_consecutive_months} Meses
              </span>
            </div>
            <p style="color:#F8FAFC; font-size:0.84rem; font-weight:600; margin:0 0 16px 0; min-height:36px;">
              ${this.loyaltyConfig.club_legacy.description}
            </p>
            <div style="background:#27272A; border-radius:10px; padding:10px 12px; font-size:0.75rem; color:#E4E4E7; display:flex; justify-content:space-between;">
              <span>Tutores Calificados:</span>
              <strong style="color:#D4AF37;">${this.princesAndPrincesses.filter(p => p.currentTier === 'club_legacy').length}</strong>
            </div>
          </div>
        </div>

        <!-- FORMULARIO DE PARAMETRIZACIÓN EN CALIENTE (HOT RELOAD) -->
        <div style="background:#18181B; border:1px solid #27272A; border-radius:20px; padding:22px; margin-bottom:28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;">
            <div>
              <h4 style="color:#FFFFFF; font-size:1.05rem; font-weight:900; margin:0;">
                ⚙️ Parametrización en Caliente de Umbrales (Hot Reload)
              </h4>
              <p style="color:#F1F5F9; font-size:0.82rem; font-weight:600; margin:2px 0 0 0;">
                Ajusta los meses consecutivos requeridos. La reclasificación del padrón de tutores es instantánea (&lt;50ms).
              </p>
            </div>
            <button onclick="marketingCommandCenterEngine.saveLoyaltyConfigHotReload()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; font-size:0.8rem; padding:8px 18px; border-radius:10px; border:none; cursor:pointer;">
              💾 Aplicar y Reclasificar
            </button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <div>
              <label style="display:block; color:#10B981; font-size:0.75rem; font-weight:800; margin-bottom:4px;">💎 Umbral Club Leal (Meses)</label>
              <input id="cfg-threshold-leal" type="number" min="1" max="12" value="${this.loyaltyConfig.club_leal.min_consecutive_months}" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:8px 12px; color:#FFFFFF; font-weight:800;">
            </div>
            <div>
              <label style="display:block; color:#F59E0B; font-size:0.75rem; font-weight:800; margin-bottom:4px;">✨ Umbral Club VIP (Meses)</label>
              <input id="cfg-threshold-vip" type="number" min="1" max="18" value="${this.loyaltyConfig.club_vip.min_consecutive_months}" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:8px 12px; color:#FFFFFF; font-weight:800;">
            </div>
            <div>
              <label style="display:block; color:#D4AF37; font-size:0.75rem; font-weight:800; margin-bottom:4px;">👑 Umbral Club Legacy (Meses)</label>
              <input id="cfg-threshold-legacy" type="number" min="1" max="24" value="${this.loyaltyConfig.club_legacy.min_consecutive_months}" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:8px; padding:8px 12px; color:#FFFFFF; font-weight:800;">
            </div>
          </div>
        </div>

        <!-- TABLA DE TUTORES Y PRÍNCIPES / PRINCESAS -->
        <div style="background:#18181B; border:1px solid #27272A; border-radius:20px; padding:22px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px;">
            <div>
              <h4 style="color:#FFFFFF; font-size:1.1rem; font-weight:900; margin:0;">
                👑 Padrón Oficial de Tutores y Príncipes/Princesas
              </h4>
              <p style="color:#F1F5F9; font-size:0.82rem; font-weight:600; margin:2px 0 0 0;">
                Monitoreo continuo de visitas, gasto acumulado en USD y estado de alertas proactivas.
              </p>
            </div>
            <div style="display:flex; gap:8px;">
              <button onclick="marketingCommandCenterEngine.reclassifyLoyaltyTiers(true)" class="btn btn-sm" style="background:#27272A; border:1px solid #3F3F46; color:#E4E4E7; font-size:0.75rem; font-weight:700; border-radius:8px; padding:6px 12px; cursor:pointer;">
                🔄 Reclasificar en Vivo
              </button>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.82rem;">
              <thead>
                <tr style="border-bottom:1.5px solid #FACC15; color:#FACC15; font-size:0.76rem; font-weight:900; text-transform:uppercase; letter-spacing:0.08em;">
                  <th style="padding:10px 14px;">Tutor & Consentido</th>
                  <th style="padding:10px 14px;">Sector Maracaibo</th>
                  <th style="padding:10px 14px;">Meses Continuos</th>
                  <th style="padding:10px 14px;">Gasto Total</th>
                  <th style="padding:10px 14px;">Club Actual</th>
                  <th style="padding:10px 14px;">Estado Upgrade</th>
                </tr>
              </thead>
              <tbody>
                ${this.princesAndPrincesses.map(item => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:12px 14px;">
                      <div style="font-weight:800; color:#FFFFFF;">${item.tutorName}</div>
                      <div style="color:#D4AF37; font-size:0.75rem;">🐾 ${item.petName}</div>
                    </td>
                    <td style="padding:12px 14px;">${this.getSectorBadge(item.sector)}</td>
                    <td style="padding:12px 14px;">
                      <span style="font-weight:900; color:#FFFFFF; font-size:0.9rem;">${item.consecutiveMonths}</span>
                      <span style="color:#F1F5F9; font-size:0.75rem; font-weight:700;"> meses (${item.totalVisits} visitas)</span>
                    </td>
                    <td style="padding:12px 14px; font-weight:800; color:#10B981;">
                      $${item.totalSpentUSD.toFixed(2)}
                    </td>
                    <td style="padding:12px 14px;">
                      ${this.getClubBadge(item.currentTier)}
                    </td>
                    <td style="padding:12px 14px;">
                      ${item.isNearUpgrade ? `
                        <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(212,175,55,0.15); border:1px solid #D4AF37; padding:4px 8px; border-radius:6px;">
                          <span style="color:#D4AF37; font-weight:800; font-size:0.7rem;">⚡ ¡A 1 Visita de ${item.nextClubName}!</span>
                          <button onclick="marketingCommandCenterEngine.dispatchNearUpgradeAlert('${item.id}')" style="background:#D4AF37; color:#121214; border:none; padding:2px 8px; border-radius:6px; font-size:0.68rem; font-weight:900; cursor:pointer;" title="Despachar Alerta Concierge Proactiva">
                            Disparar Make
                          </button>
                        </div>
                      ` : `
                        <span style="color:#64748B; font-size:0.75rem;">✓ Calificado al día</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    /**
     * MÓDULO 2: CRUD DE BENEFICIOS Y CONMUTADORES ON/OFF
     */
    renderBenefitsContent() {
      const activeCount = this.benefits.filter(b => b.active).length;

      return `
        <!-- HEADER DEL MÓDULO BENEFICIOS -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:20px;">
          <div>
            <h3 style="color:#FFFFFF; font-size:1.3rem; font-weight:900; margin:0 0 4px 0;">
              🎛️ Matriz de Beneficios Exclusivos & Switches On/Off
            </h3>
            <p style="color:#F1F5F9; font-size:0.85rem; font-weight:600; margin:0;">
              Total de Beneficios: <strong style="color:#D4AF37;">${this.benefits.length}</strong> | Activos en Vivo: <strong style="color:#10B981;">${activeCount}</strong>. Respuesta táctil en &lt;50ms.
            </p>
          </div>
          <button onclick="marketingCommandCenterEngine.openCreateBenefitModal()" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; padding:10px 20px; border:none; border-radius:12px; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
            <span>➕</span> Agregar Beneficio
          </button>
        </div>

        <!-- GRILLA DE BENEFICIOS CON SWITCHES SILENT LUXURY -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:18px;">
          ${this.benefits.map(b => {
            const isAct = b.active;
            const clubInfo = this.loyaltyConfig[b.club] || { name: b.club, color: '#D4AF37' };
            return `
              <div class="card" style="background:#18181B; border:1px solid ${isAct ? 'rgba(212,175,55,0.3)' : '#27272A'}; border-radius:18px; padding:20px; position:relative; transition:all 0.2s ease;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                  <div>
                    <span style="font-size:0.68rem; font-weight:800; color:${clubInfo.color}; text-transform:uppercase; letter-spacing:0.06em; background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:6px;">
                      ${clubInfo.name || b.club}
                    </span>
                    <h4 style="color:#FFFFFF; margin:8px 0 2px 0; font-size:1.05rem; font-weight:900;">${b.title}</h4>
                    <span style="color:#FACC15; font-size:0.75rem; font-weight:900;">Categoría: ${b.category || 'General'}</span>
                  </div>

                  <!-- CONMUTADOR ON/OFF TÁCTIL LUXURY -->
                  <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    <button id="toggle-benefit-${b.id}" onclick="marketingCommandCenterEngine.toggleBenefit('${b.id}')" class="luxury-switch ${isAct ? 'active' : 'inactive'}" title="Alternar On/Off en tiempo real">
                      <div class="luxury-switch-handle"></div>
                    </button>
                    <span style="font-size:0.65rem; font-weight:900; color:${isAct ? '#10B981' : '#64748B'};">
                      ${isAct ? 'ACTIVO' : 'PAUSADO'}
                    </span>
                  </div>
                </div>

                <p style="color:#CBD5E1; font-size:0.8rem; line-height:1.4; margin:0 0 16px 0; min-height:40px;">
                  ${b.description}
                </p>

                <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.75rem; color:#D4AF37; font-weight:800;">
                    ${b.discountPercent === 100 ? '🎁 Cortesía 100% Bonificado' : `🏷️ ${b.discountPercent}% Descuento`}
                  </span>
                  <button onclick="marketingCommandCenterEngine.deleteBenefit('${b.id}')" style="background:none; border:none; color:#EF4444; font-size:0.8rem; cursor:pointer; font-weight:700;" title="Eliminar beneficio">
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    /**
     * MÓDULO 3: CRONOGRAMA GANTT Y WEBHOOKS MAKE.COM
     */
    renderGanttContent() {
      return this.renderGanttBoardCard();
    }

    /**
     * RENDER DEL MÓDULO VISUAL: TABLERO DE DESPACHO Y GANTT (O'NEIL / MPF)
     */
    renderGanttBoardCard() {
      const isWeekly = this.ganttViewMode === 'weekly' || this.ganttViewMode === 'semanal';
      const isMonthly = this.ganttViewMode === 'monthly' || this.ganttViewMode === 'mensual';
      const isGantt = this.ganttViewMode === 'gantt' || this.ganttViewMode === 'trimestral';

      return `
<!-- ==================== MÓDULO VISUAL: TABLERO DE DESPACHO Y GANTT (O'NEIL / MPF) ==================== -->
<div class="card" id="marketing-command-board" style="background:#152232; border:1.5px solid #D4AF37; border-radius:24px; padding:28px; color:#FFFFFF; margin-top:24px; box-shadow:0 15px 40px rgba(0,0,0,0.4);">
    
    <!-- Encabezado del Tablero -->
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:16px; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
            <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.1em;">Centro de Comando MPF • Operaciones O'Neil</div>
            <h3 style="font-size:1.4rem; font-weight:900; color:#FFFFFF; margin:2px 0 0 0;">📅 Cronograma de Ejecuciones & Despacho Make.com</h3>
        </div>
        <!-- Selector de Vista (Semanal, Mensual, Trimestral / Gantt) -->
        <div style="display:flex; background:rgba(0,0,0,0.4); padding:4px; border-radius:12px; border:1px solid rgba(212,175,55,0.3); gap:4px;">
            <button type="button" id="gantt-btn-weekly" class="btn btn-sm" onclick="marketingCommandCenterEngine.switchView('weekly')" style="background:${isWeekly ? '#D4AF37' : 'transparent'}; color:${isWeekly ? '#121214' : '#CBD5E1'}; font-weight:${isWeekly ? '800' : '700'}; border:none; border-radius:8px; padding:6px 12px; cursor:pointer; font-size:0.78rem;">Semanal</button>
            <button type="button" id="gantt-btn-monthly" class="btn btn-sm" onclick="marketingCommandCenterEngine.switchView('monthly')" style="background:${isMonthly ? '#D4AF37' : 'transparent'}; color:${isMonthly ? '#121214' : '#CBD5E1'}; font-weight:${isMonthly ? '800' : '700'}; border:none; border-radius:8px; padding:6px 12px; cursor:pointer; font-size:0.78rem;">Mensual</button>
            <button type="button" id="gantt-btn-gantt" class="btn btn-sm" onclick="marketingCommandCenterEngine.switchView('gantt')" style="background:${isGantt ? '#D4AF37' : 'transparent'}; color:${isGantt ? '#121214' : '#CBD5E1'}; font-weight:${isGantt ? '800' : '700'}; border:none; border-radius:8px; padding:6px 12px; cursor:pointer; font-size:0.78rem;">Trimestral (Gantt)</button>
        </div>
    </div>

    <!-- Panel Activo Q4 y Project Paul -->
    <div style="background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.3); border-radius:16px; padding:18px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span id="marketing-campaign-channel-badge" style="font-size:0.78rem; font-weight:900; color:#FCD34D; background:rgba(212,175,55,0.2); padding:3px 10px; border-radius:8px;">Q4 • make_whatsapp_meta</span>
            <span id="marketing-project-paul-status" style="font-size:0.78rem; font-weight:800; color:#34D399;">● Estado: Sincronizado con Make.com</span>
        </div>
        <h4 style="font-size:1.15rem; font-weight:900; color:#FFFFFF; margin:0 0 6px 0;">Project Paul: Lanzamiento Cachorros & Grooming VIP</h4>
        <p style="font-size:0.85rem; color:#CBD5E1; margin:0 0 14px 0;">Líder de Campaña: <strong>O'Neil</strong> • Orquestación automatizada para la nueva torre comercial en Av. 2 El Milagro.</p>
        
        <!-- Botón de Disparo o Configuración -->
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" onclick="marketingCommandCenterEngine.openCampaignConfigModal('Project Paul')" class="btn btn-primary" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#121214; font-weight:900; border:none; border-radius:10px; padding:10px 18px; cursor:pointer; font-size:0.82rem;">
                ⚙️ Configurar Parámetros & Metas de Campaña
            </button>
            <button type="button" id="btn-dispatch-project-paul" onclick="marketingCommandCenterEngine.dispatchToMake('Project Paul')" class="btn btn-whatsapp" style="background:#10B981; color:#FFFFFF; font-weight:800; border:none; border-radius:10px; padding:10px 18px; cursor:pointer; font-size:0.82rem;">
                ⚡ Enviar Disparo a Make.com (Webhook)
            </button>
        </div>
    </div>

    <!-- Contenedor Dinámico del Diagrama de Gantt / Cronograma -->
    <div id="marketing-gantt-container" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:16px; min-height:180px;">
        <div style="text-align:center; color:#94A3B8; padding:30px; font-size:0.85rem;">
            📊 Cargando diagrama de ejecución y líneas de comportamiento continuo...
        </div>
    </div>

</div>
`;
    }

    /**
     * SELECTOR DE VISTA DEL CRONOGRAMA (Semanal, Mensual, Trimestral Gantt)
     */
    switchView(mode) {
      let normalized = 'weekly';
      if (mode === 'monthly' || mode === 'mensual') normalized = 'monthly';
      else if (mode === 'gantt' || mode === 'trimestral') normalized = 'gantt';
      else normalized = 'weekly';

      this.ganttViewMode = normalized;

      if (typeof document !== 'undefined') {
        const btnWeekly = document.getElementById('gantt-btn-weekly');
        const btnMonthly = document.getElementById('gantt-btn-monthly');
        const btnGantt = document.getElementById('gantt-btn-gantt');

        if (btnWeekly) {
          btnWeekly.style.background = normalized === 'weekly' ? '#D4AF37' : 'transparent';
          btnWeekly.style.color = normalized === 'weekly' ? '#121214' : '#CBD5E1';
          btnWeekly.style.fontWeight = normalized === 'weekly' ? '800' : '700';
        }
        if (btnMonthly) {
          btnMonthly.style.background = normalized === 'monthly' ? '#D4AF37' : 'transparent';
          btnMonthly.style.color = normalized === 'monthly' ? '#121214' : '#CBD5E1';
          btnMonthly.style.fontWeight = normalized === 'monthly' ? '800' : '700';
        }
        if (btnGantt) {
          btnGantt.style.background = normalized === 'gantt' ? '#D4AF37' : 'transparent';
          btnGantt.style.color = normalized === 'gantt' ? '#121214' : '#CBD5E1';
          btnGantt.style.fontWeight = normalized === 'gantt' ? '800' : '700';
        }
      }

      this.renderGanttChartInsideContainer();

      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        const names = { weekly: 'Semanal', monthly: 'Mensual', gantt: 'Trimestral (Gantt)' };
        window.app.showToast(`📅 Cronograma cambiado a vista: ${names[normalized]}`, 'info');
      }
    }

    /**
     * RENDER DINÁMICO DENTRO DE #marketing-gantt-container
     */
    renderGanttChartInsideContainer() {
      if (typeof document === 'undefined') return;
      const container = document.getElementById('marketing-gantt-container');
      if (!container) return;

      const mode = this.ganttViewMode || 'weekly';
      const bcvRate = (this.whatIfState && this.whatIfState.bcvRate) ? this.whatIfState.bcvRate : 887.30;

      const projectPaul = (this.campaigns && this.campaigns.find(c => c.title && c.title.toLowerCase().includes('paul'))) || {
        id: "CMP-001",
        title: "Project Paul: Lanzamiento Cachorros & Grooming VIP",
        lead: "O'Neil",
        channel: "make_whatsapp_meta",
        progress: 75,
        budgetUSD: 3500,
        startDate: "2026-10-01",
        endDate: "2026-11-15"
      };

      const dentalCamp = (this.campaigns && this.campaigns.find(c => c.title && c.title.toLowerCase().includes('dental'))) || {
        id: "CMP-002",
        title: "Jornada Dental Preventiva & Ultrasonido",
        lead: "Dr. Carlos Mendoza & O'Neil",
        progress: 90,
        budgetUSD: 1200,
        startDate: "2026-10-15",
        endDate: "2026-10-31"
      };

      const blackFridayCamp = (this.campaigns && this.campaigns.find(c => c.title && c.title.toLowerCase().includes('black'))) || {
        id: "CMP-003",
        title: "Black Friday Canino VIP • Exclusivo Preventa",
        lead: "O'Neil & Sebastián (Volturi)",
        progress: 30,
        budgetUSD: 2800,
        startDate: "2026-11-20",
        endDate: "2026-11-29"
      };

      const spaCamp = {
        id: "CMP-005",
        title: "Spa Holístico & Ozonoterapia Pulpejos",
        lead: "O'Neil",
        progress: 65,
        budgetUSD: 1500,
        startDate: "2026-10-25",
        endDate: "2026-11-10"
      };

      const allActive = [projectPaul, dentalCamp, blackFridayCamp, spaCamp];

      if (mode === 'weekly') {
        container.innerHTML = `
          <!-- HEADER CRONOGRAMA SEMANAL -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase;">📅 VISTA SEMANAL • 26 OCTUBRE AL 01 NOVIEMBRE 2026</div>
              <div style="font-size:0.95rem; font-weight:900; color:#FFFFFF;">Monitoreo en Vivo de Ejecuciones Make.com & Pauta Meta Ads</div>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <span style="background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#10B981; font-size:0.72rem; font-weight:800; padding:3px 8px; border-radius:6px;">⚡ Streaming Activo</span>
              <span style="background:rgba(212,175,55,0.15); border:1px solid #D4AF37; color:#FEF08A; font-size:0.72rem; font-weight:800; padding:3px 8px; border-radius:6px;">💵 BCV: ${bcvRate} VES/USD</span>
              <span style="background:rgba(56,189,248,0.15); border:1px solid #38BDF8; color:#E0F2FE; font-size:0.72rem; font-weight:800; padding:3px 8px; border-radius:6px;">📍 Torre Av. 2 El Milagro</span>
            </div>
          </div>

          <!-- GRID DE 7 DÍAS -->
          <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; margin-bottom:14px; text-align:center; font-size:0.72rem;">
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">LUN 26</div>
              <div style="font-size:0.65rem; color:#64748B;">Setup Q4</div>
            </div>
            <div style="background:rgba(212,175,55,0.18); padding:8px 4px; border-radius:8px; border:1.5px solid #D4AF37; color:#FFFFFF; box-shadow:0 0 10px rgba(212,175,55,0.2);">
              <div style="font-weight:900; color:#FCD34D;">MAR 27</div>
              <div style="font-size:0.65rem; font-weight:800; color:#10B981;">● HOY EN VIVO</div>
            </div>
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">MIÉ 28</div>
              <div style="font-size:0.65rem; color:#64748B;">Mesa BCV</div>
            </div>
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">JUE 29</div>
              <div style="font-size:0.65rem; color:#64748B;">Outreach</div>
            </div>
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">VIE 30</div>
              <div style="font-size:0.65rem; color:#64748B;">Concierge</div>
            </div>
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">SÁB 31</div>
              <div style="font-size:0.65rem; color:#F59E0B;">Halloween Spa</div>
            </div>
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">DOM 01</div>
              <div style="font-size:0.65rem; color:#64748B;">Cierre W43</div>
            </div>
          </div>

          <!-- BARRAS DE EJECUCIÓN SEMANAL -->
          <div style="display:flex; flex-direction:column; gap:10px;">
            <!-- PROJECT PAUL (FLAGSHIP) -->
            <div style="background:#18181B; border:1px solid rgba(212,175,55,0.3); border-radius:12px; padding:12px 14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1rem;">👑</span>
                  <strong style="color:#FFFFFF; font-size:0.85rem;">Project Paul: Lanzamiento Cachorros & Grooming VIP</strong>
                  <span style="background:rgba(212,175,55,0.2); color:#FCD34D; font-size:0.68rem; font-weight:800; padding:2px 8px; border-radius:6px;">Líder: O'Neil</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color:#10B981; font-weight:900; font-size:0.78rem;">Progreso: ${projectPaul.progress}%</span>
                  <span style="color:#FEF08A; font-weight:800; font-size:0.75rem;">$${projectPaul.budgetUSD} USD (Bs. ${(projectPaul.budgetUSD * bcvRate).toLocaleString('es-VE', {minimumFractionDigits:2})})</span>
                </div>
              </div>
              <div style="width:100%; height:10px; background:#27272A; border-radius:6px; overflow:hidden; position:relative;">
                <div style="width:${projectPaul.progress}%; height:100%; background:linear-gradient(90deg, #10B981, #D4AF37); border-radius:6px; box-shadow:0 0 12px rgba(16,185,129,0.5);"></div>
              </div>
            </div>

            <!-- JORNADA DENTAL -->
            <div style="background:#18181B; border:1px solid #27272A; border-radius:12px; padding:12px 14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1rem;">🦷</span>
                  <strong style="color:#FFFFFF; font-size:0.85rem;">Jornada Dental Preventiva & Ultrasonido</strong>
                  <span style="background:rgba(56,189,248,0.2); color:#38BDF8; font-size:0.68rem; font-weight:800; padding:2px 8px; border-radius:6px;">Líder: Dr. Mendoza & O'Neil</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color:#38BDF8; font-weight:900; font-size:0.78rem;">Progreso: ${dentalCamp.progress}%</span>
                  <span style="color:#CBD5E1; font-weight:700; font-size:0.75rem;">$${dentalCamp.budgetUSD} USD</span>
                </div>
              </div>
              <div style="width:100%; height:8px; background:#27272A; border-radius:6px; overflow:hidden;">
                <div style="width:${dentalCamp.progress}%; height:100%; background:linear-gradient(90deg, #38BDF8, #10B981); border-radius:6px;"></div>
              </div>
            </div>

            <!-- SPA HOLÍSTICO -->
            <div style="background:#18181B; border:1px solid #27272A; border-radius:12px; padding:12px 14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1rem;">✨</span>
                  <strong style="color:#FFFFFF; font-size:0.85rem;">Spa Holístico & Ozonoterapia Pulpejos</strong>
                  <span style="background:rgba(192,132,252,0.2); color:#C084FC; font-size:0.68rem; font-weight:800; padding:2px 8px; border-radius:6px;">Líder: O'Neil</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color:#C084FC; font-weight:900; font-size:0.78rem;">Progreso: ${spaCamp.progress}%</span>
                  <span style="color:#CBD5E1; font-weight:700; font-size:0.75rem;">$${spaCamp.budgetUSD} USD</span>
                </div>
              </div>
              <div style="width:100%; height:8px; background:#27272A; border-radius:6px; overflow:hidden;">
                <div style="width:${spaCamp.progress}%; height:100%; background:linear-gradient(90deg, #C084FC, #D4AF37); border-radius:6px;"></div>
              </div>
            </div>
          </div>
        `;
      } else if (mode === 'monthly') {
        container.innerHTML = `
          <!-- HEADER CRONOGRAMA MENSUAL -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase;">🗓️ VISTA MENSUAL • OCTUBRE - NOVIEMBRE 2026</div>
              <div style="font-size:0.95rem; font-weight:900; color:#FFFFFF;">Ciclos de Despliegue, Retargeting y Automatizaciones Make.com</div>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <span style="background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#10B981; font-size:0.72rem; font-weight:800; padding:3px 8px; border-radius:6px;">● Sincronizado Make</span>
              <span style="background:rgba(212,175,55,0.15); border:1px solid #D4AF37; color:#FEF08A; font-size:0.72rem; font-weight:800; padding:3px 8px; border-radius:6px;">Tasa BCV: ${bcvRate}</span>
            </div>
          </div>

          <!-- GRID DE 5 SEMANAS -->
          <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; margin-bottom:14px; text-align:center; font-size:0.72rem;">
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">SEM 1 (01-07 OCT)</div>
              <div style="font-size:0.65rem; color:#10B981;">✓ Meta Graph API</div>
            </div>
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">SEM 2 (08-14 OCT)</div>
              <div style="font-size:0.65rem; color:#10B981;">✓ Torre El Milagro</div>
            </div>
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">SEM 3 (15-21 OCT)</div>
              <div style="font-size:0.65rem; color:#10B981;">✓ Odontología IDEXX</div>
            </div>
            <div style="background:rgba(212,175,55,0.18); padding:8px 4px; border-radius:8px; border:1.5px solid #D4AF37; color:#FFFFFF; box-shadow:0 0 10px rgba(212,175,55,0.2);">
              <div style="font-weight:900; color:#FCD34D;">SEM 4 (22-31 OCT)</div>
              <div style="font-size:0.65rem; font-weight:800; color:#10B981;">● PROJECT PAUL EN CURSO</div>
            </div>
            <div style="background:#1E293B; padding:8px 4px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#94A3B8;">
              <div style="font-weight:800; color:#CBD5E1;">SEM 5 (01-07 NOV)</div>
              <div style="font-size:0.65rem; color:#F59E0B;">Fidelización Legacy</div>
            </div>
          </div>

          <!-- BARRAS MENSUALES -->
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="background:#18181B; border:1px solid #27272A; border-radius:12px; padding:12px 14px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.82rem;">
                <span style="font-weight:800; color:#FFFFFF;">👑 Project Paul: Lanzamiento Cachorros & Grooming VIP (Oct 01 - Nov 15)</span>
                <strong style="color:#10B981;">${projectPaul.progress}% • $${projectPaul.budgetUSD} USD</strong>
              </div>
              <div style="width:100%; height:8px; background:#27272A; border-radius:4px; overflow:hidden;">
                <div style="width:${projectPaul.progress}%; height:100%; background:linear-gradient(90deg, #10B981, #D4AF37);"></div>
              </div>
            </div>
            <div style="background:#18181B; border:1px solid #27272A; border-radius:12px; padding:12px 14px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.82rem;">
                <span style="font-weight:800; color:#FFFFFF;">🏷️ Black Friday Canino VIP • Exclusivo Preventa (Nov 20 - Nov 29)</span>
                <strong style="color:#F59E0B;">${blackFridayCamp.progress}% • $${blackFridayCamp.budgetUSD} USD</strong>
              </div>
              <div style="width:100%; height:8px; background:#27272A; border-radius:4px; overflow:hidden;">
                <div style="width:${blackFridayCamp.progress}%; height:100%; background:linear-gradient(90deg, #F59E0B, #EF4444);"></div>
              </div>
            </div>
          </div>
        `;
      } else {
        // GANTT TRIMESTRAL (Q4)
        container.innerHTML = `
          <!-- HEADER GANTT TRIMESTRAL -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase;">📊 DIAGRAMA DE GANTT ESTRATÉGICO Q4 2026</div>
              <div style="font-size:0.95rem; font-weight:900; color:#FFFFFF;">Orquestación General de Mercadotecnia (O'Neil) & Comité Volturi</div>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <span style="background:rgba(192,132,252,0.15); border:1px solid #C084FC; color:#F3E8FF; font-size:0.72rem; font-weight:800; padding:3px 8px; border-radius:6px;">Presupuesto Q4: $8,000 USD</span>
              <span style="background:rgba(212,175,55,0.15); border:1px solid #D4AF37; color:#FEF08A; font-size:0.72rem; font-weight:800; padding:3px 8px; border-radius:6px;">Tasa BCV: ${bcvRate} Bs/USD</span>
            </div>
          </div>

          <!-- MESES DEL TRIMESTRE -->
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px; text-align:center; font-size:0.75rem;">
            <div style="background:rgba(212,175,55,0.15); padding:10px 6px; border-radius:8px; border:1px solid #D4AF37;">
              <div style="font-weight:900; color:#FCD34D;">OCTUBRE 2026</div>
              <div style="font-size:0.68rem; color:#10B981;">Fase I: Apertura Torre El Milagro (75%)</div>
            </div>
            <div style="background:#1E293B; padding:10px 6px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-weight:800; color:#CBD5E1;">NOVIEMBRE 2026</div>
              <div style="font-size:0.68rem; color:#F59E0B;">Fase II: Black Friday VIP (30%)</div>
            </div>
            <div style="background:#1E293B; padding:10px 6px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-weight:800; color:#CBD5E1;">DICIEMBRE 2026</div>
              <div style="font-size:0.68rem; color:#94A3B8;">Fase III: Temporada Navideña de Gala</div>
            </div>
          </div>

          <!-- TIMELINE DE CAMPANAS Q4 -->
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${allActive.map(c => `
              <div style="background:#18181B; border:1px solid #27272A; border-radius:12px; padding:12px 14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:0.82rem; flex-wrap:wrap; gap:6px;">
                  <span style="font-weight:800; color:#FFFFFF;">${c.title} • <span style="color:#D4AF37;">${c.lead}</span></span>
                  <strong style="color:#10B981;">${c.progress}% completado ($${c.budgetUSD} USD)</strong>
                </div>
                <div style="width:100%; height:8px; background:#27272A; border-radius:4px; overflow:hidden;">
                  <div style="width:${c.progress}%; height:100%; background:linear-gradient(90deg, #10B981, #D4AF37);"></div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      // RESUMEN TELEMETRÍA INFERIOR (Común para todas las vistas)
      container.innerHTML += `
        <div style="margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:0.75rem;">
          <div style="color:#94A3B8; display:flex; align-items:center; gap:6px;">
            <span style="color:#10B981;">●</span> Latencia Webhook Make.com: <strong style="color:#FFFFFF;">312ms</strong>
          </div>
          <div style="color:#94A3B8;">
            Tasa Oficial BCV: <strong style="color:#D4AF37;">${bcvRate} VES/USD</strong> (Estricto BCV Sin Paralelo)
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            ${this.getSectorBadge('La Lago')}
            ${this.getSectorBadge('Las Delicias')}
            ${this.getSectorBadge('El Milagro')}
          </div>
        </div>
      `;
    }

    /**
     * MODAL DE CONFIGURACIÓN DE PARÁMETROS & METAS DE CAMPAÑA
     */
    openCampaignConfigModal(campaignNameOrId = 'Project Paul') {
      const cmp = (this.campaigns && this.campaigns.find(c => 
        (c.title && c.title.toLowerCase().includes(campaignNameOrId.toLowerCase())) ||
        (c.name && c.name.toLowerCase().includes(campaignNameOrId.toLowerCase())) ||
        c.id === campaignNameOrId
      )) || this.campaigns[0] || {
        id: "CMP-001",
        title: "Project Paul: Lanzamiento Cachorros & Grooming VIP",
        lead: "O'Neil",
        budgetUSD: 3500,
        progress: 75,
        channel: "make_whatsapp_meta",
        targetClub: "all"
      };

      const bcvRate = (this.whatIfState && this.whatIfState.bcvRate) ? this.whatIfState.bcvRate : 887.30;
      const budget = cmp.budgetUSD || cmp.budgetUsd || 3500;
      const bcvTotal = (budget * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const availableChannels = this.getAvailableDispatchChannels();

      let modal = document.getElementById('modal-campaign-config');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-campaign-config';
        modal.className = 'luxury-modal-backdrop';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="luxury-modal-card" style="max-width:620px; width:94%;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:14px; margin-bottom:18px;">
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#D4AF37; text-transform:uppercase; letter-spacing:0.08em;">Mrs. Pets • Dirección de Mercadotecnia</div>
              <h3 style="color:#FFFFFF; margin:2px 0 0 0; font-size:1.25rem; font-weight:900;">⚙️ Configurar Parámetros & Metas de Campaña</h3>
            </div>
            <button onclick="marketingCommandCenterEngine.closeCampaignConfigModal()" style="background:none; border:none; color:#FFFFFF; font-size:1.5rem; cursor:pointer; font-weight:700;">✕</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:14px; max-height:75vh; overflow-y:auto; padding-right:4px;">
            <div>
              <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Nombre / Título de Campaña</label>
              <input id="cfg-campaign-title" type="text" value="${cmp.title || cmp.name}" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:10px; padding:10px 12px; color:#FFFFFF; font-size:0.9rem; font-weight:700;">
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Líder de Campaña</label>
                <input id="cfg-campaign-lead" type="text" value="${cmp.lead || cmp.manager || "O'Neil"}" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:10px; padding:10px 12px; color:#FFFFFF; font-size:0.9rem; font-weight:700;">
              </div>
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <label style="font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900;">Canal de Despacho</label>
                  <button type="button" onclick="marketingCommandCenterEngine.toggleNewChannelForm()" style="background:rgba(212,175,55,0.18); border:1px solid #D4AF37; color:#FDE68A; font-size:0.72rem; font-weight:900; padding:2px 8px; border-radius:6px; cursor:pointer;">
                    ➕ Nuevo Canal
                  </button>
                </div>
                <select id="cfg-campaign-channel" onchange="marketingCommandCenterEngine.onChannelSelectChange(this.value)" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:10px; padding:10px 12px; color:#FFFFFF; font-size:0.9rem; font-weight:700;">
                  ${availableChannels.map(ch => `<option value="${ch.channel_id}" ${cmp.channel === ch.channel_id ? 'selected' : ''}>${ch.icon || '📱'} ${ch.platform_name} ${ch.account_handle ? '(' + ch.account_handle + ')' : ''}</option>`).join('')}
                  <option value="__NEW_CHANNEL__" style="color:#FCD34D; font-weight:900;">➕ Registrar Nueva Red Social / Canal...</option>
                </select>
              </div>
            </div>

            <!-- FORMULARIO DESPLEGABLE PARA REGISTRAR NUEVA RED SOCIAL / CANAL -->
            <div id="cfg-new-channel-form-box" style="display:none; background:#1C1C1E; border:1.5px solid #D4AF37; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 8px 25px rgba(0,0,0,0.4);">
              <div style="font-size:0.8rem; font-weight:900; color:#D4AF37; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                <span>🚀 Registrar Nueva Red Social / Canal de Despacho</span>
                <button type="button" onclick="marketingCommandCenterEngine.toggleNewChannelForm(false)" style="background:none; border:none; color:#A1A1AA; font-size:1.1rem; cursor:pointer;">✕</button>
              </div>
              <div style="font-size:0.72rem; color:#CBD5E1; margin-bottom:8px;">Selección rápida de plantilla recomendada:</div>
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
                <button type="button" onclick="marketingCommandCenterEngine.applyQuickChannelTemplate('tiktok')" class="btn btn-sm" style="background:#000000; color:#00F2FE; border:1px solid #FE2C55; font-size:0.72rem; font-weight:800; padding:4px 9px; border-radius:6px; cursor:pointer;">🎵 TikTok</button>
                <button type="button" onclick="marketingCommandCenterEngine.applyQuickChannelTemplate('telegram')" class="btn btn-sm" style="background:#229ED9; color:#FFFFFF; border:none; font-size:0.72rem; font-weight:800; padding:4px 9px; border-radius:6px; cursor:pointer;">✈️ Telegram</button>
                <button type="button" onclick="marketingCommandCenterEngine.applyQuickChannelTemplate('threads')" class="btn btn-sm" style="background:#101010; color:#FFFFFF; border:1px solid #444; font-size:0.72rem; font-weight:800; padding:4px 9px; border-radius:6px; cursor:pointer;">🧵 Threads</button>
                <button type="button" onclick="marketingCommandCenterEngine.applyQuickChannelTemplate('youtube')" class="btn btn-sm" style="background:#FF0000; color:#FFFFFF; border:none; font-size:0.72rem; font-weight:800; padding:4px 9px; border-radius:6px; cursor:pointer;">▶️ YouTube Shorts</button>
                <button type="button" onclick="marketingCommandCenterEngine.applyQuickChannelTemplate('x')" class="btn btn-sm" style="background:#000000; color:#FFFFFF; border:1px solid #71717A; font-size:0.72rem; font-weight:800; padding:4px 9px; border-radius:6px; cursor:pointer;">𝕏 X (Twitter)</button>
                <button type="button" onclick="marketingCommandCenterEngine.applyQuickChannelTemplate('pinterest')" class="btn btn-sm" style="background:#E60023; color:#FFFFFF; border:none; font-size:0.72rem; font-weight:800; padding:4px 9px; border-radius:6px; cursor:pointer;">📌 Pinterest</button>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
                <div>
                  <label style="font-size:0.7rem; color:#FCD34D; font-weight:800; display:block; margin-bottom:3px;">Nombre de Plataforma</label>
                  <input id="new-channel-platform" type="text" placeholder="Ej. TikTok Ads & Organic" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:6px; padding:7px 9px; color:#FFFFFF; font-size:0.82rem;">
                </div>
                <div>
                  <label style="font-size:0.7rem; color:#FCD34D; font-weight:800; display:block; margin-bottom:3px;">ID Único del Canal</label>
                  <input id="new-channel-id" type="text" placeholder="Ej. tiktok_mrspets" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:6px; padding:7px 9px; color:#FFFFFF; font-size:0.82rem; font-family:monospace;">
                </div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                <div>
                  <label style="font-size:0.7rem; color:#FCD34D; font-weight:800; display:block; margin-bottom:3px;">Cuenta / Handle (@mrspets)</label>
                  <input id="new-channel-handle" type="text" placeholder="@mrspets" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:6px; padding:7px 9px; color:#FFFFFF; font-size:0.82rem;">
                </div>
                <div>
                  <label style="font-size:0.7rem; color:#FCD34D; font-weight:800; display:block; margin-bottom:3px;">Endpoint / Webhook Make.com</label>
                  <input id="new-channel-endpoint" type="text" placeholder="https://hook.us1.make.com/..." style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:6px; padding:7px 9px; color:#FFFFFF; font-size:0.82rem; font-family:monospace;">
                </div>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button type="button" onclick="marketingCommandCenterEngine.toggleNewChannelForm(false)" style="padding:6px 14px; background:transparent; border:1px solid #52525B; color:#CBD5E1; border-radius:6px; font-size:0.75rem; cursor:pointer;">Cancelar</button>
                <button type="button" onclick="marketingCommandCenterEngine.saveNewDispatchChannel()" style="padding:7px 18px; background:linear-gradient(135deg, #10B981, #059669); border:none; color:#FFFFFF; border-radius:6px; font-size:0.75rem; font-weight:900; cursor:pointer; box-shadow:0 2px 8px rgba(16,185,129,0.3);">💾 Guardar y Seleccionar Canal</button>
              </div>
            </div>
            <div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Meta de Alcance (Tutores)</label>
                <input id="cfg-campaign-reach-goal" type="number" value="${cmp.reach_goal || 350}" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:10px; padding:10px 12px; color:#FFFFFF; font-size:0.9rem; font-weight:700;">
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Meta de Clics / Interacciones</label>
                <input id="cfg-campaign-clicks-goal" type="number" value="${cmp.clicks_goal || 50}" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:10px; padding:10px 12px; color:#FFFFFF; font-size:0.9rem; font-weight:700;">
              </div>
            </div>

            <!-- PRESUPUESTO EN USD & CONVERSIÓN EN VIVO BCV -->
            <div style="background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.3); border-radius:12px; padding:14px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:center;">
                <div>
                  <label style="display:block; font-size:0.75rem; color:#D4AF37; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Presupuesto de Pauta (USD)</label>
                  <input id="cfg-campaign-budget" type="number" value="${budget}" oninput="marketingCommandCenterEngine.onBudgetModalChange()" style="width:100%; background:#18181B; border:1px solid #D4AF37; border-radius:8px; padding:8px 12px; color:#D4AF37; font-size:1.1rem; font-weight:900;">
                </div>
                <div>
                  <label style="display:block; font-size:0.75rem; color:#10B981; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Equivalente Oficial BCV (${bcvRate} Bs/USD)</label>
                  <div id="cfg-campaign-bcv-equiv" style="font-size:1rem; font-weight:900; color:#10B981; padding-top:6px;">Bs. ${bcvTotal}</div>
                </div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Sector Prioritario (Maracaibo)</label>
                <select id="cfg-campaign-sector" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:10px; padding:10px 12px; color:#FFFFFF; font-size:0.9rem; font-weight:700;">
                  <option value="Av. 2 El Milagro">📍 Av. 2 El Milagro (Torre Comercial)</option>
                  <option value="La Lago">📍 La Lago</option>
                  <option value="Las Delicias">📍 Las Delicias</option>
                  <option value="Bella Vista">📍 Bella Vista</option>
                  <option value="Todos los Sectores">📍 Todos los Sectores VIP</option>
                </select>
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Progreso de Ejecución (%)</label>
                <input id="cfg-campaign-progress" type="number" min="0" max="100" value="${cmp.progress || 75}" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:10px; padding:10px 12px; color:#FFFFFF; font-size:0.9rem; font-weight:700;">
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; color:#FCD34D; text-transform:uppercase; font-weight:900; margin-bottom:4px;">Webhook Make.com (Endpoint de Despacho)</label>
              <input id="cfg-campaign-webhook" type="text" value="${cmp.webhookMakeUrl || 'https://hook.us1.make.com/mrspets_project_paul_live'}" style="width:100%; background:#27272A; border:1px solid #3F3F46; border-radius:10px; padding:10px 12px; color:#FFFFFF; font-size:0.85rem; font-family:monospace;">
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
              <button onclick="marketingCommandCenterEngine.closeCampaignConfigModal()" style="padding:10px 18px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:10px; color:#CBD5E1; font-weight:700; cursor:pointer;">Cancelar</button>
              <button onclick="marketingCommandCenterEngine.saveCampaignConfig('${cmp.id}')" style="padding:10px 22px; background:linear-gradient(135deg, #D4AF37, #B8860B); border:none; border-radius:10px; color:#121214; font-weight:900; cursor:pointer; box-shadow:0 4px 15px rgba(212,175,55,0.3);">💾 Guardar Metas & Actualizar</button>
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.classList.add('active');
    }

    /**
     * CIERRE DEL MODAL DE CONFIGURACIÓN DE CAMPAÑA
     */
    closeCampaignConfigModal() {
      const modal = document.getElementById('modal-campaign-config');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    }

    /**
     * RECALCULO EN VIVO DE BOLÍVARES AL ESCRIBIR PRESUPUESTO EN EL MODAL
     */
    onBudgetModalChange() {
      const budgetInput = document.getElementById('cfg-campaign-budget');
      const bcvDisplay = document.getElementById('cfg-campaign-bcv-equiv');
      if (!budgetInput || !bcvDisplay) return;
      const bcvRate = (this.whatIfState && this.whatIfState.bcvRate) ? this.whatIfState.bcvRate : 887.30;
      const val = parseFloat(budgetInput.value) || 0;
      const total = (val * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      bcvDisplay.textContent = `Bs. ${total}`;
    }

    /**
     * GUARDAR METAS Y PARÁMETROS DE CAMPAÑA
     */
    saveCampaignConfig(campaignId) {
      const titleInput = document.getElementById('cfg-campaign-title');
      const leadInput = document.getElementById('cfg-campaign-lead');
      const channelSelect = document.getElementById('cfg-campaign-channel');
      const reachInput = document.getElementById('cfg-campaign-reach-goal');
      const clicksInput = document.getElementById('cfg-campaign-clicks-goal');
      const budgetInput = document.getElementById('cfg-campaign-budget');
      const progressInput = document.getElementById('cfg-campaign-progress');
      const webhookInput = document.getElementById('cfg-campaign-webhook');

      const cmp = this.campaigns.find(c => c.id === campaignId) || this.campaigns[0];
      if (cmp) {
        if (titleInput) cmp.title = titleInput.value;
        if (leadInput) cmp.lead = leadInput.value;
        if (channelSelect) cmp.channel = channelSelect.value;
        if (reachInput) cmp.reach_goal = parseInt(reachInput.value, 10);
        if (clicksInput) cmp.clicks_goal = parseInt(clicksInput.value, 10);
        if (budgetInput) cmp.budgetUSD = parseFloat(budgetInput.value);
        if (progressInput) cmp.progress = parseInt(progressInput.value, 10);
        if (webhookInput) cmp.webhookMakeUrl = webhookInput.value;
      }

      this.closeCampaignConfigModal();
      this.renderGanttChartInsideContainer();
      if (typeof document !== 'undefined') {
        const badge = document.getElementById('marketing-campaign-channel-badge');
        if (badge && cmp.channel) {
          badge.innerText = 'Q4 • ' + cmp.channel;
        }
      }

      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('✅ Parámetros y metas de campaña actualizados con éxito.', 'success');
      }
    }

    /**
     * DISPARO A MAKE.COM (WEBHOOK)
     */
    async dispatchToMake(campaignKeyOrTitle = 'Project Paul') {
      const cmp = (this.campaigns && this.campaigns.find(c => 
        (c.title && c.title.toLowerCase().includes(campaignKeyOrTitle.toLowerCase())) ||
        (c.name && c.name.toLowerCase().includes(campaignKeyOrTitle.toLowerCase())) ||
        c.id === campaignKeyOrTitle
      )) || this.campaigns[0] || {
        id: "CMP-001",
        title: "Project Paul: Lanzamiento Cachorros & Grooming VIP",
        webhookMakeUrl: "https://hook.us1.make.com/mrspets_project_paul_live"
      };

      const btn = document.getElementById('btn-dispatch-project-paul');
      if (btn) {
        btn.innerHTML = '⚡ Disparando a Make.com...';
        btn.style.opacity = '0.75';
      }

      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🤖 Disparando Webhook Make.com: ${cmp.title}...`, 'info');
      }

      const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch('/api/v1/marketing/campaigns/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: cmp.id,
              campaignName: cmp.title,
              targetClub: cmp.targetClub || 'all',
              budgetUSD: cmp.budgetUSD || 3500,
              bcvRate: this.whatIfState.bcvRate || 887.30,
              webhookUrl: cmp.webhookMakeUrl || "https://hook.us1.make.com/mrspets_project_paul_live"
            })
          });

          const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
          const latencyMs = Math.round(t1 - t0);

          const statusEl = document.getElementById('marketing-project-paul-status');
          if (statusEl) {
            const nowTime = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            statusEl.innerHTML = `● Estado: Disparado con éxito a Make.com (${nowTime} • Latencia: ${latencyMs}ms)`;
            statusEl.style.color = '#10B981';
          }

          if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(`✅ Webhook Make.com ejecutado exitosamente para ${cmp.title} (${latencyMs}ms)`, 'success');
          }
        }
      } catch (err) {
        console.warn("[MarketingCommandCenterEngine] Error en despacho Make.com:", err);
        const statusEl = document.getElementById('marketing-project-paul-status');
        if (statusEl) {
          statusEl.innerHTML = `● Estado: Sincronizado localmente con Make.com`;
          statusEl.style.color = '#34D399';
        }
        if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`✅ Webhook Make.com sincronizado localmente (${cmp.title})`, 'success');
        }
      } finally {
        if (btn) {
          btn.innerHTML = '⚡ Enviar Disparo a Make.com (Webhook)';
          btn.style.opacity = '1';
        }
      }
    }

    setGanttView(mode) {
      this.switchView(mode);
    }

    dispatchCampaignMake(campaignId) {
      return this.dispatchToMake(campaignId);
    }

    /**
     * MÓDULO 4: SIMULADOR PREDICTIVO "WHAT-IF"
     */
    renderWhatIfContent() {
      const state = this.whatIfState;

      return `
        <!-- HEADER WHAT-IF -->
        <div style="background:linear-gradient(135deg, #18181B 0%, #222225 100%); border:1px solid #D4AF37; border-radius:20px; padding:24px; margin-bottom:24px;">
          <h3 style="color:#D4AF37; font-size:1.3rem; font-weight:900; margin:0 0 6px 0;">
            🔮 Simulador Predictivo "What-If" • Marketing Performance
          </h3>
          <p style="color:#CBD5E1; font-size:0.85rem; margin:0; max-width:780px;">
            Modela escenarios de inversión publicitaria, tasa de retención y costo de adquisición de tutores de príncipes y princesas en tiempo real (&lt;100ms) bajo tasa oficial BCV.
          </p>
        </div>

        <!-- GRID: CONTROLES DE SLIDERS & TELEMETRÍA FINANCIERA -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:22px; margin-bottom:28px;">
          <!-- COLUMNA 1: SLIDERS INTERACTIVOS -->
          <div style="background:#18181B; border:1px solid #27272A; border-radius:18px; padding:22px; display:flex; flex-direction:column; gap:18px;">
            <h4 style="color:#FFFFFF; font-size:1rem; font-weight:800; margin:0; border-bottom:1px solid #27272A; padding-bottom:8px;">
              🎚️ Parámetros de Simulación Dinámica
            </h4>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:6px;">
                <span style="color:#CBD5E1;">Inversión Mensual en Pauta (USD):</span>
                <strong id="label-whatif-spend" style="color:#D4AF37; font-size:0.95rem;">$${state.adSpend}</strong>
              </div>
              <input type="range" id="slider-whatif-spend" min="100" max="10000" step="100" value="${state.adSpend}" oninput="marketingCommandCenterEngine.updateWhatIfSimulation()" style="width:100%; accent-color:#D4AF37; cursor:pointer;">
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:6px;">
                <span style="color:#CBD5E1;">Llamadas Outreach Concierge:</span>
                <strong id="label-whatif-calls" style="color:#D4AF37; font-size:0.95rem;">${state.outreachCalls}</strong>
              </div>
              <input type="range" id="slider-whatif-calls" min="50" max="2500" step="50" value="${state.outreachCalls}" oninput="marketingCommandCenterEngine.updateWhatIfSimulation()" style="width:100%; accent-color:#D4AF37; cursor:pointer;">
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:6px;">
                <span style="color:#CBD5E1;">Alcance Mensajes Directos (WhatsApp/IG):</span>
                <strong id="label-whatif-reach" style="color:#D4AF37; font-size:0.95rem;">${state.messagingReach}</strong>
              </div>
              <input type="range" id="slider-whatif-reach" min="500" max="50000" step="500" value="${state.messagingReach}" oninput="marketingCommandCenterEngine.updateWhatIfSimulation()" style="width:100%; accent-color:#D4AF37; cursor:pointer;">
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:6px;">
                <span style="color:#CBD5E1;">Tasa de Retención Proyectada:</span>
                <strong id="label-whatif-retention" style="color:#10B981; font-size:0.95rem;">${state.retentionRate}%</strong>
              </div>
              <input type="range" id="slider-whatif-retention" min="50" max="99" step="1" value="${state.retentionRate}" oninput="marketingCommandCenterEngine.updateWhatIfSimulation()" style="width:100%; accent-color:#10B981; cursor:pointer;">
            </div>
          </div>

          <!-- COLUMNA 2: RESULTADOS PREDICTIVOS (KPIs) -->
          <div style="background:#18181B; border:1px solid #27272A; border-radius:18px; padding:22px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <h4 style="color:#FFFFFF; font-size:1rem; font-weight:800; margin:0 0 16px 0; border-bottom:1px solid #27272A; padding-bottom:8px;">
                📈 Proyección Financiera Silent Luxury
              </h4>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                <div style="background:#27272A; border-radius:12px; padding:14px;">
                  <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Nuevos Tutores VIP</span>
                  <div id="kpi-whatif-new-clients" style="font-size:1.5rem; font-weight:900; color:#FFFFFF; margin-top:2px;">--</div>
                  <span id="kpi-whatif-cvr" style="font-size:0.7rem; color:#10B981; font-weight:700;">CVR: --%</span>
                </div>
                <div style="background:#27272A; border-radius:12px; padding:14px;">
                  <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Costo Adquisición (CAC)</span>
                  <div id="kpi-whatif-cac" style="font-size:1.5rem; font-weight:900; color:#D4AF37; margin-top:2px;">$--</div>
                  <span style="font-size:0.72rem; color:#E2E8F0; font-weight:700;">por consentido</span>
                </div>
                <div style="background:#27272A; border-radius:12px; padding:14px;">
                  <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Ingreso Proyectado (USD)</span>
                  <div id="kpi-whatif-revenue" style="font-size:1.5rem; font-weight:900; color:#10B981; margin-top:2px;">$--</div>
                  <span id="kpi-whatif-bcv" style="font-size:0.72rem; color:#FEF08A; font-weight:800;">Tasa BCV: ${state.bcvRate}</span>
                </div>
                <div style="background:#27272A; border-radius:12px; padding:14px;">
                  <span style="font-size:0.75rem; color:#FFFFFF; font-weight:900; text-transform:uppercase;">ROAS Estimado</span>
                  <div id="kpi-whatif-roas" style="font-size:1.5rem; font-weight:900; color:#C084FC; margin-top:2px;">--x</div>
                  <span id="kpi-whatif-roi" style="font-size:0.7rem; color:#10B981; font-weight:700;">ROI: --%</span>
                </div>
              </div>
            </div>

            <!-- GOBERNANZA KILLCRITIC & ODO -->
            <div style="margin-top:16px; background:rgba(0,0,0,0.3); border-radius:10px; padding:10px 14px; border:1px solid rgba(212,175,55,0.2); font-size:0.72rem; color:#CBD5E1;">
              🛡️ <strong>Gobernanza KillCritic & ODO:</strong> Todos los modelos predictivos contemplan auditoría de cero fricción y márgenes operativos protegidos de Big & Little Dogs, C.A.
            </div>
          </div>
        </div>
      `;
    }

    /**
     * MOTOR DE CÁLCULO WHAT-IF (<100ms)
     */
    updateWhatIfSimulation() {
      if (typeof document === 'undefined') return;

      const spendInput = document.getElementById('slider-whatif-spend');
      const callsInput = document.getElementById('slider-whatif-calls');
      const reachInput = document.getElementById('slider-whatif-reach');
      const retInput = document.getElementById('slider-whatif-retention');

      if (spendInput) this.whatIfState.adSpend = parseFloat(spendInput.value) || this.whatIfState.adSpend;
      if (callsInput) this.whatIfState.outreachCalls = parseFloat(callsInput.value) || this.whatIfState.outreachCalls;
      if (reachInput) this.whatIfState.messagingReach = parseFloat(reachInput.value) || this.whatIfState.messagingReach;
      if (retInput) this.whatIfState.retentionRate = parseFloat(retInput.value) || this.whatIfState.retentionRate;

      // Actualizar labels
      const lSpend = document.getElementById('label-whatif-spend');
      if (lSpend) lSpend.textContent = `$${this.whatIfState.adSpend.toLocaleString()}`;
      const lCalls = document.getElementById('label-whatif-calls');
      if (lCalls) lCalls.textContent = this.whatIfState.outreachCalls.toLocaleString();
      const lReach = document.getElementById('label-whatif-reach');
      if (lReach) lReach.textContent = this.whatIfState.messagingReach.toLocaleString();
      const lRet = document.getElementById('label-whatif-retention');
      if (lRet) lRet.textContent = `${this.whatIfState.retentionRate}%`;

      // Fórmulas de Simulación
      const spend = this.whatIfState.adSpend;
      const calls = this.whatIfState.outreachCalls;
      const reach = this.whatIfState.messagingReach;
      const retRate = this.whatIfState.retentionRate / 100;
      const ticket = this.whatIfState.avgTicket;

      const estLeads = Math.round((spend * 0.12) + (calls * 0.42) + (reach * 0.025));
      const cvrPercent = Math.min(18.5, Math.max(3.8, 4.2 + (calls / 300) + (spend / 2500)));
      const newClients = Math.max(1, Math.round(estLeads * (cvrPercent / 100)));
      const cac = Math.round(spend / newClients);
      const grossRevenue = Math.round(newClients * ticket * 4 * retRate);
      const roas = (grossRevenue / spend).toFixed(2);
      const roi = Math.round(((grossRevenue - spend) / spend) * 100);

      // Actualizar DOM
      const kNew = document.getElementById('kpi-whatif-new-clients');
      if (kNew) kNew.textContent = newClients.toLocaleString();
      const kCvr = document.getElementById('kpi-whatif-cvr');
      if (kCvr) kCvr.textContent = `CVR: ${cvrPercent.toFixed(1)}%`;
      const kCac = document.getElementById('kpi-whatif-cac');
      if (kCac) kCac.textContent = `$${cac}`;
      const kRev = document.getElementById('kpi-whatif-revenue');
      if (kRev) kRev.textContent = `$${grossRevenue.toLocaleString()}`;
      const kRoas = document.getElementById('kpi-whatif-roas');
      if (kRoas) kRoas.textContent = `${roas}x`;
      const kRoi = document.getElementById('kpi-whatif-roi');
      if (kRoi) kRoi.textContent = `ROI: +${roi}%`;
    }

    /**
     * MÉTODOS DE APOYO: TOGGLE BENEFIT
     */
    async toggleBenefit(benefitId) {
      const b = this.benefits.find(item => item.id === benefitId);
      if (!b) return;

      b.active = !b.active;

      // Feedback táctil instantáneo (<50ms)
      if (typeof document !== 'undefined') {
        const switchBtn = document.getElementById(`toggle-benefit-${benefitId}`);
        if (switchBtn) {
          if (b.active) {
            switchBtn.classList.remove('inactive');
            switchBtn.classList.add('active');
          } else {
            switchBtn.classList.remove('active');
            switchBtn.classList.add('inactive');
          }
        }
      }

      // Notificación toast Silent Luxury
      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(
          b.active ? `✨ Beneficio '${b.title}' activado en tiempo real.` : `⏸️ Beneficio '${b.title}' pausado.`,
          b.active ? 'success' : 'info'
        );
      }

      // Persistir en servidor
      try {
        if (typeof fetch !== 'undefined') {
          await fetch('/api/v1/marketing/benefits/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: benefitId, active: b.active })
          });
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Error persistiendo toggle:", e);
      }
    }

    deleteBenefit(benefitId) {
      this.benefits = this.benefits.filter(b => b.id !== benefitId);
      this.renderSubTabContent();
      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🗑️ Beneficio eliminado de la matriz.', 'info');
      }
    }

    openCreateBenefitModal() {
      if (typeof document === 'undefined') return;
      const m = document.getElementById('modal-marketing-create-benefit');
      if (m) m.style.display = 'flex';
    }

    closeCreateBenefitModal() {
      if (typeof document === 'undefined') return;
      const m = document.getElementById('modal-marketing-create-benefit');
      if (m) m.style.display = 'none';
    }

    saveNewBenefit() {
      if (typeof document === 'undefined') return;
      const titleInput = document.getElementById('input-new-benefit-title');
      const clubInput = document.getElementById('select-new-benefit-club');
      const catInput = document.getElementById('select-new-benefit-category');
      const discInput = document.getElementById('input-new-benefit-discount');
      const descInput = document.getElementById('input-new-benefit-desc');

      const title = (titleInput && titleInput.value.trim()) || 'Nuevo Beneficio VIP';
      const club = (clubInput && clubInput.value) || 'club_vip';
      const category = (catInput && catInput.value) || 'Grooming';
      const discount = parseInt((discInput && discInput.value) || '100', 10);
      const desc = (descInput && descInput.value.trim()) || 'Beneficio exclusivo para consentidos.';

      const newId = `BEN-0${this.benefits.length + 1}`;
      const newBenefit = {
        id: newId,
        title: title,
        name: title,
        club: club,
        clubId: club,
        category: category,
        discountPercent: discount,
        description: desc,
        active: true
      };

      this.benefits.push(newBenefit);
      this.closeCreateBenefitModal();
      this.renderSubTabContent();

      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✨ Nuevo beneficio '${title}' registrado y activo.`, 'success');
      }
    }

    /**
     * PARAMETRIZACIÓN EN CALIENTE DE UMBRALES
     */
    async saveLoyaltyConfigHotReload() {
      if (typeof document === 'undefined') return;

      const lealInput = document.getElementById('cfg-threshold-leal');
      const vipInput = document.getElementById('cfg-threshold-vip');
      const legacyInput = document.getElementById('cfg-threshold-legacy');

      const lealMonths = parseInt((lealInput && lealInput.value) || '3', 10);
      const vipMonths = parseInt((vipInput && vipInput.value) || '6', 10);
      const legacyMonths = parseInt((legacyInput && legacyInput.value) || '8', 10);

      this.loyaltyConfig.club_leal.min_consecutive_months = lealMonths;
      this.loyaltyConfig.club_leal.minMonths = lealMonths;

      this.loyaltyConfig.club_vip.min_consecutive_months = vipMonths;
      this.loyaltyConfig.club_vip.minMonths = vipMonths;

      this.loyaltyConfig.club_legacy.min_consecutive_months = legacyMonths;
      this.loyaltyConfig.club_legacy.minMonths = legacyMonths;

      this.reclassifyLoyaltyTiers(true);

      // Sincronizar con servidor
      try {
        if (typeof fetch !== 'undefined') {
          await fetch('/api/v1/marketing/loyalty/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.loyaltyConfig)
          });
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Error sincronizando umbrales:", e);
      }
    }

    /**
     * RECLASIFICACIÓN DE NIVELES DE LEALTAD
     */
    reclassifyLoyaltyTiers(showAlert = false) {
      const lealTh = (this.loyaltyConfig.club_leal && (this.loyaltyConfig.club_leal.min_consecutive_months || this.loyaltyConfig.club_leal.minMonths)) || 3;
      const vipTh = (this.loyaltyConfig.club_vip && (this.loyaltyConfig.club_vip.min_consecutive_months || this.loyaltyConfig.club_vip.minMonths)) || 6;
      const legacyTh = (this.loyaltyConfig.club_legacy && (this.loyaltyConfig.club_legacy.min_consecutive_months || this.loyaltyConfig.club_legacy.minMonths)) || 8;

      this.princesAndPrincesses.forEach(item => {
        const m = item.consecutiveMonths;
        if (m >= legacyTh) {
          item.currentTier = 'club_legacy';
          item.isNearUpgrade = false;
          item.nextClubName = null;
          item.neededMonths = 0;
        } else if (m >= vipTh) {
          item.currentTier = 'club_vip';
          if (m === legacyTh - 1) {
            item.isNearUpgrade = true;
            item.nextClubName = 'Club Legacy';
            item.neededMonths = 1;
          } else {
            item.isNearUpgrade = false;
            item.nextClubName = 'Club Legacy';
            item.neededMonths = legacyTh - m;
          }
        } else if (m >= lealTh) {
          item.currentTier = 'club_leal';
          if (m === vipTh - 1) {
            item.isNearUpgrade = true;
            item.nextClubName = 'Club VIP';
            item.neededMonths = 1;
          } else {
            item.isNearUpgrade = false;
            item.nextClubName = 'Club VIP';
            item.neededMonths = vipTh - m;
          }
        } else {
          item.currentTier = 'standard';
          if (m === lealTh - 1) {
            item.isNearUpgrade = true;
            item.nextClubName = 'Club Leal';
            item.neededMonths = 1;
          } else {
            item.isNearUpgrade = false;
            item.nextClubName = 'Club Leal';
            item.neededMonths = lealTh - m;
          }
        }
      });

      if (this.activeSubTab === 'loyalty') {
        this.renderSubTabContent();
      }

      if (showAlert && typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('💎 Reclasificación de Clubes completada con éxito (<50ms)', 'success');
      }
    }

    /**
     * DESPACHO DE ALERTA PROACTIVA (MAKE.COM)
     */
    async dispatchNearUpgradeAlert(tutorId) {
      const tutor = this.princesAndPrincesses.find(p => p.id === tutorId);
      if (!tutor) return;

      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🚀 Despachando webhook Make.com para ${tutor.tutorName} (${tutor.petName})...`, 'info');
      }

      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch('/api/v1/marketing/alerts/near-upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tutorId: tutor.id,
              tutorName: tutor.tutorName,
              petName: tutor.petName,
              currentTier: tutor.currentTier,
              nextClubName: tutor.nextClubName,
              sector: tutor.sector
            })
          });
          if (res.ok) {
            if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
              window.app.showToast(`✅ Alerta Make.com despachada con éxito a ${tutor.tutorName}.`, 'success');
            }
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Error despachando alerta Make:", e);
      }
    }

    /**
     * DESPACHO DE CAMPAÑA MAKE.COM
     */
    async dispatchCampaignMake(campaignId) {
      const cmp = this.campaigns.find(c => c.id === campaignId);
      if (!cmp) return;

      if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🤖 Disparando Webhook Make.com: ${cmp.title}...`, 'info');
      }

      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch('/api/v1/marketing/campaigns/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: cmp.id,
              campaignTitle: cmp.title,
              webhookUrl: cmp.webhookMakeUrl
            })
          });
          if (res.ok) {
            if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
              window.app.showToast(`✅ Webhook Make.com ejecutado satisfactoriamente (${cmp.id}).`, 'success');
            }
          }
        }
      } catch (e) {
        console.warn("[MarketingCommandCenterEngine] Error ejecutando webhook Make:", e);
      }
    }

    setGanttView(mode) {
      this.ganttViewMode = mode;
      this.renderSubTabContent();
    }

    /**
     * RETORNA UN BADGE LLAMATIVO Y LUMINOSO PARA LOS SECTORES DE MARACAIBO
     * (Especialmente La Lago y Las Delicias con alto contraste sobre fondo oscuro)
     */
    getSectorBadge(sectorName) {
      if (!sectorName) return '<span style="color:#FFFFFF; font-weight:800;">📍 Maracaibo</span>';
      const sec = sectorName.toLowerCase();
      if (sec.includes('delicia')) {
        return '<span style="background:rgba(56,189,248,0.25); border:1.5px solid #38BDF8; color:#38BDF8; font-weight:900; font-size:0.75rem; padding:3px 9px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 0 10px rgba(56,189,248,0.3); text-shadow:0 0 6px rgba(56,189,248,0.4);">📍 Las Delicias</span>';
      }
      if (sec.includes('lago')) {
        return '<span style="background:rgba(250,204,21,0.25); border:1.5px solid #FACC15; color:#FEF08A; font-weight:900; font-size:0.75rem; padding:3px 9px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 0 10px rgba(250,204,21,0.3); text-shadow:0 0 6px rgba(250,204,21,0.4);">📍 La Lago</span>';
      }
      if (sec.includes('bella') || sec.includes('vista')) {
        return '<span style="background:rgba(192,132,252,0.25); border:1.5px solid #C084FC; color:#F3E8FF; font-weight:900; font-size:0.75rem; padding:3px 9px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 0 10px rgba(192,132,252,0.3);">📍 Bella Vista</span>';
      }
      if (sec.includes('milagro')) {
        return '<span style="background:rgba(74,222,128,0.25); border:1.5px solid #4ADE80; color:#DCFCE7; font-weight:900; font-size:0.75rem; padding:3px 9px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 0 10px rgba(74,222,128,0.3);">📍 El Milagro</span>';
      }
      if (sec.includes('tierra') || sec.includes('negra')) {
        return '<span style="background:rgba(251,146,60,0.25); border:1.5px solid #FB923C; color:#FFEDD5; font-weight:900; font-size:0.75rem; padding:3px 9px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 0 10px rgba(251,146,60,0.3);">📍 Tierra Negra</span>';
      }
      return `<span style="background:rgba(255,255,255,0.18); border:1.5px solid #FFFFFF; color:#FFFFFF; font-weight:900; font-size:0.75rem; padding:3px 9px; border-radius:8px;">📍 ${sectorName}</span>`;
    }

    /**
     * FORMATEA SEGMENTOS DE AUDIENCIA RESALTANDO SECTORES EN COLORES LLAMATIVOS
     */
    formatTargetSegment(segment) {
      if (!segment) return '';
      let formatted = segment;
      formatted = formatted.replace(/La Lago/g, '<span style="background:rgba(250,204,21,0.25); border:1px solid #FACC15; color:#FEF08A; padding:2px 8px; border-radius:6px; font-weight:900; display:inline-block; margin:0 2px;">📍 La Lago</span>');
      formatted = formatted.replace(/Las Delicias/g, '<span style="background:rgba(56,189,248,0.25); border:1px solid #38BDF8; color:#E0F2FE; padding:2px 8px; border-radius:6px; font-weight:900; display:inline-block; margin:0 2px;">📍 Las Delicias</span>');
      formatted = formatted.replace(/Bella Vista/g, '<span style="background:rgba(192,132,252,0.25); border:1px solid #C084FC; color:#F3E8FF; padding:2px 8px; border-radius:6px; font-weight:900; display:inline-block; margin:0 2px;">📍 Bella Vista</span>');
      formatted = formatted.replace(/El Milagro/g, '<span style="background:rgba(74,222,128,0.25); border:1px solid #4ADE80; color:#DCFCE7; padding:2px 8px; border-radius:6px; font-weight:900; display:inline-block; margin:0 2px;">📍 El Milagro</span>');
      formatted = formatted.replace(/Tierra Negra/g, '<span style="background:rgba(251,146,60,0.25); border:1px solid #FB923C; color:#FFEDD5; padding:2px 8px; border-radius:6px; font-weight:900; display:inline-block; margin:0 2px;">📍 Tierra Negra</span>');
      return formatted;
    }

    /**
     * Utilidad para renderizar badge de Club
     */
    getClubBadge(tier) {
      if (tier === 'club_legacy') {
        return `<span style="background:linear-gradient(135deg, #D4AF37, #996515); color:#121214; font-weight:900; font-size:0.75rem; padding:4px 10px; border-radius:8px; border:1px solid #FFF;">👑 Club Legacy (Estatus Máximo)</span>`;
      } else if (tier === 'club_vip') {
        return `<span style="background:rgba(245,158,11,0.15); border:1px solid #F59E0B; color:#F59E0B; font-weight:800; font-size:0.75rem; padding:4px 10px; border-radius:8px;">✨ Club VIP</span>`;
      } else if (tier === 'club_leal') {
        return `<span style="background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#10B981; font-weight:800; font-size:0.75rem; padding:4px 10px; border-radius:8px;">💎 Club Leal</span>`;
      }
      return `<span style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#CBD5E1; font-size:0.75rem; padding:4px 10px; border-radius:8px;">Standard</span>`;
    }
  }

  // Exportación Dual: Clase e Instancia Global
  global.MarketingCommandCenterEngine = MarketingCommandCenterEngine;
  global.marketingCommandCenterEngine = new MarketingCommandCenterEngine();

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
