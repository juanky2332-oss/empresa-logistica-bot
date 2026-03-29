// =====================================================================
// LOGISTICS AI CHATBOT — Demo inteligente sin API key necesaria
// Simula respuestas reales de Power BI con contexto, tiempo y lógica
// =====================================================================

// ─── ESTADO DE CONVERSACIÓN ──────────────────────────────────────────
const ctx = {
  lastTopic: null,
  lastNaviera: null,
  lastDestino: null,
  lastCliente: null,
  msgCount: 0,
};

// ─── FECHA Y CONTEXTO TEMPORAL ───────────────────────────────────────
const NOW = new Date();
const MES_ACTUAL = NOW.toLocaleString('es-ES', { month: 'long' });
const MES_NUM = NOW.getMonth(); // 0-11
const TRIMESTRE = MES_NUM < 3 ? 'Q1' : MES_NUM < 6 ? 'Q2' : MES_NUM < 9 ? 'Q3' : 'Q4';
const SEMANA = Math.ceil(NOW.getDate() / 7);
const DIA_SEMANA = NOW.toLocaleString('es-ES', { weekday: 'long' });

// Temporadas y alertas activas según mes
const ALERTAS_TEMPORALES = {
  0:  { alerta: '❄️ Temporada de temporal atlántico', rutas: ['Transatlántico Norte'], impacto: 'retrasos de 1-3 días en rutas hacia EE.UU.' },
  1:  { alerta: '❄️ Temporal atlántico persistente', rutas: ['Transatlántico Norte'], impacto: 'retrasos de 1-2 días en rutas hacia EE.UU.' },
  2:  { alerta: '🌊 Fin de temporada de temporales', rutas: ['Atlántico Norte'], impacto: 'normalización progresiva de rutas' },
  3:  { alerta: '🌧️ Temporada de lluvias en Asia Pacífico', rutas: ['Transpacífico'], impacto: 'posibles demoras menores en puertos asiáticos' },
  4:  { alerta: '🌀 Inicio temporada ciclones Bay of Bengal', rutas: ['Océano Índico'], impacto: 'monitoreo activo en rutas India/Bangladesh' },
  5:  { alerta: '☀️ Temporada estable — condiciones óptimas', rutas: ['Global'], impacto: 'sin alertas climáticas relevantes actualmente' },
  6:  { alerta: '🌀 Temporada de huracanes Atlántico', rutas: ['Caribe', 'Golfo de México'], impacto: 'posibles desvíos en rutas hacia Centroamérica' },
  7:  { alerta: '🌀 Pico temporada huracanes', rutas: ['Caribe', 'Costa Este EE.UU.'], impacto: 'monitoreo crítico, posibles cierres de puertos caribeños' },
  8:  { alerta: '🌀 Temporada activa huracanes + tifones Pacífico', rutas: ['Pacífico Norte', 'Caribe'], impacto: 'seguimiento intensivo rutas Asia-Pacífico y Caribe' },
  9:  { alerta: '🍂 Fin temporada huracanes', rutas: ['Atlántico Norte'], impacto: 'inicio de temporada de temporales en Atlántico Norte' },
  10: { alerta: '🌊 Temporales Atlántico Norte en incremento', rutas: ['Europa-América del Norte'], impacto: 'retrasos preventivos 1-2 días rutas transatlánticas' },
  11: { alerta: '❄️ Temporales invernales activos', rutas: ['Atlántico Norte', 'Mar del Norte'], impacto: 'retrasos 2-4 días rutas norte de Europa y EE.UU.' },
};
const CLIMA_HOY = ALERTAS_TEMPORALES[MES_NUM];

// ─── BASE DE DATOS MOCK (Power BI simulado) ───────────────────────────
const DB = {
  fecha_actualizacion: `Hoy, ${DIA_SEMANA} ${NOW.getDate()} de ${MES_ACTUAL} de ${NOW.getFullYear()} — ${NOW.getHours()}:${String(NOW.getMinutes()).padStart(2,'0')}h`,

  contenedores: {
    total: 12480, en_transito: 7842, en_puerto: 3106, descargando: 891, pendiente_despacho: 641,
    por_naviera: {
      'Maersk':      { total: 3847, en_transito: 2410, en_puerto: 1200, reefer: 312, retraso_medio: 1.2, puntualidad: '96.1%' },
      'MSC':         { total: 2904, en_transito: 1890, en_puerto: 820,  reefer: 198, retraso_medio: 1.8, puntualidad: '93.4%' },
      'CMA CGM':     { total: 2103, en_transito: 1340, en_puerto: 620,  reefer: 143, retraso_medio: 2.1, puntualidad: '91.8%' },
      'Hapag-Lloyd': { total: 1842, en_transito: 1100, en_puerto: 590,  reefer: 152, retraso_medio: 1.4, puntualidad: '95.2%' },
      'Evergreen':   { total: 987,  en_transito: 620,  en_puerto: 290,  reefer: 77,  retraso_medio: 2.8, puntualidad: '88.9%' },
      'COSCO':       { total: 797,  en_transito: 482,  en_puerto: 195,  reefer: 120, retraso_medio: 1.6, puntualidad: '94.1%' },
    },
    por_destino: {
      'Estados Unidos': { total: 2847, navieras: ['Maersk','MSC','Hapag-Lloyd'], dias_transito: 16, coste_teu: 2840, puertos: ['New York', 'Houston', 'Los Angeles'], tendencia: '+8% vs mes anterior' },
      'China':          { total: 2104, navieras: ['COSCO','Evergreen','CMA CGM'], dias_transito: 31, coste_teu: 3200, puertos: ['Shanghai', 'Ningbo', 'Shenzhen'], tendencia: '-3% vs mes anterior' },
      'Latinoamérica':  { total: 1632, navieras: ['Hamburg Sud','Hapag-Lloyd'], dias_transito: 17, coste_teu: 1950, puertos: ['Santos', 'Cartagena', 'Veracruz'], tendencia: '+12% vs mes anterior' },
      'África':         { total: 1298, navieras: ['CMA CGM','Grimaldi'], dias_transito: 12, coste_teu: 1600, puertos: ['Lagos', 'Durban', 'Mombasa'], tendencia: '+5% vs mes anterior' },
      'India':          { total: 1042, navieras: ['ONE','Yang Ming'], dias_transito: 25, coste_teu: 2100, puertos: ['Nhava Sheva', 'Mundra', 'Chennai'], tendencia: '+15% vs mes anterior' },
      'Europa Norte':   { total: 987,  navieras: ['Maersk','Hapag-Lloyd'], dias_transito: 5,  coste_teu: 980,  puertos: ['Rotterdam', 'Hamburgo', 'Amberes'], tendencia: 'estable' },
      'Oriente Medio':  { total: 570,  navieras: ['MSC','COSCO'], dias_transito: 18, coste_teu: 1750, puertos: ['Jebel Ali', 'Dammam', 'Salalah'], tendencia: '+6% vs mes anterior' },
    },
    por_tipo: {
      "Dry Van 40'":  5820, "Dry Van 20'": 3204, "High Cube 40'": 1840,
      "Reefer 40'":  1002,  "Reefer 20'":  312,  "Open Top":      178,
      "Flat Rack":    92,   "Tanque ISO":   32,
    },
  },

  clientes: [
    { nombre: 'TechExport SL',       pais: 'España', contenedores: 847, tipo_carga: 'Electrónica',            facturacion: 284000, naviera: 'Maersk',      destino: 'Estados Unidos', satisfaccion: 9.2 },
    { nombre: 'AgroMediterráneo SA',  pais: 'España', contenedores: 632, tipo_carga: 'Alimentación Fresca',    facturacion: 198000, naviera: 'MSC',          destino: 'Europa Norte',   satisfaccion: 8.8 },
    { nombre: 'IndusMaq Corp',        pais: 'España', contenedores: 521, tipo_carga: 'Maquinaria Industrial',  facturacion: 340000, naviera: 'CMA CGM',      destino: 'Latinoamérica', satisfaccion: 9.0 },
    { nombre: 'ChemTrade Global',     pais: 'España', contenedores: 487, tipo_carga: 'Productos Químicos',     facturacion: 225000, naviera: 'Hapag-Lloyd',  destino: 'India',          satisfaccion: 8.5 },
    { nombre: 'FashionLog EU',        pais: 'Francia',contenedores: 412, tipo_carga: 'Textil y Moda',          facturacion: 178000, naviera: 'MSC',          destino: 'China',          satisfaccion: 8.7 },
    { nombre: 'EnergyParts SA',       pais: 'España', contenedores: 398, tipo_carga: 'Componentes Energéticos',facturacion: 312000, naviera: 'Evergreen',    destino: 'Oriente Medio',  satisfaccion: 8.3 },
    { nombre: 'FoodGlobal SL',        pais: 'España', contenedores: 381, tipo_carga: 'Conservas y Bebidas',   facturacion: 156000, naviera: 'Maersk',       destino: 'Latinoamérica', satisfaccion: 9.1 },
    { nombre: 'AutoParts Iberia',     pais: 'España', contenedores: 354, tipo_carga: 'Automoción',            facturacion: 289000, naviera: 'COSCO',         destino: 'China',          satisfaccion: 8.6 },
    { nombre: 'PharmaLog Iberia',     pais: 'España', contenedores: 187, tipo_carga: 'Farmacéutico',          facturacion: 420000, naviera: 'Hapag-Lloyd',  destino: 'Estados Unidos', satisfaccion: 9.4 },
    { nombre: 'WinExport Rioja',      pais: 'España', contenedores: 163, tipo_carga: 'Vinos y Licores',       facturacion: 98000,  naviera: 'MSC',          destino: 'Estados Unidos', satisfaccion: 9.3 },
  ],

  kpis: {
    mes_actual:  { facturacion: 4280000, contenedores: 3847, clientes_activos: 214, incidencias: 23, puntualidad: 94.7, nps: 78, retraso_medio: 1.8, rutas_activas: 47 },
    mes_anterior:{ facturacion: 3810000, contenedores: 3421, clientes_activos: 198, incidencias: 31, puntualidad: 92.1, nps: 74, retraso_medio: 2.3 },
    mismo_mes_año_anterior: { facturacion: 3140000, contenedores: 2980, puntualidad: 89.4 },
  },

  reefer: {
    total: 1314, en_transito: 892, alertas: 3, temp_media: -18.4, consumo_energia: '4.2 kWh/h media',
    alertas_detalle: [
      { contenedor: 'MSKU4821093', temp_actual: -12.1, temp_requerida: -18, ruta: 'Valencia → Rotterdam', cliente: 'AgroMediterráneo SA', accion: 'Técnico notificado' },
      { contenedor: 'CMAU7734821', temp_actual: 6.8,   temp_requerida: 4,   ruta: 'Barcelona → New York', cliente: 'FoodGlobal SL',       accion: 'Ajuste en curso' },
      { contenedor: 'HLXU9921043', temp_actual: -29.2, temp_requerida: -25, ruta: 'Algeciras → Dubai',    cliente: 'PharmaLog Iberia',    accion: 'Revisión programada' },
    ],
    por_destino: { 'Europa Norte': 287, 'Estados Unidos': 312, 'Latinoamérica': 198, 'Oriente Medio': 277, 'China': 143, 'India': 97 },
  },

  puertos: {
    'Valencia':   { congestión: 'Media', espera_media: '18h', buques_fondeados: 12, operativos: true },
    'Algeciras':  { congestión: 'Alta',  espera_media: '31h', buques_fondeados: 28, operativos: true, nota: 'Congestión por desvíos ruta Suez' },
    'Barcelona':  { congestión: 'Baja',  espera_media: '8h',  buques_fondeados: 7,  operativos: true },
    'Rotterdam':  { congestión: 'Media', espera_media: '22h', buques_fondeados: 41, operativos: true },
    'Shanghai':   { congestión: 'Alta',  espera_media: '38h', buques_fondeados: 87, operativos: true, nota: 'Alta demanda exportación Q1' },
    'New York':   { congestión: 'Media', espera_media: '24h', buques_fondeados: 19, operativos: true },
    'Jebel Ali':  { congestión: 'Media', espera_media: '20h', buques_fondeados: 31, operativos: true },
  },

  fletes: {
    'España→EE.UU.':      { precio_20: 2200, precio_40: 3800, tendencia: '↑ +12%', causa: 'Alta demanda temporada primavera' },
    'España→China':       { precio_20: 2800, precio_40: 4200, tendencia: '↓ -5%',  causa: 'Normalización post Año Nuevo chino' },
    'España→Latam':       { precio_20: 1600, precio_40: 2800, tendencia: '↑ +8%',  causa: 'Incremento exportación agroalimentaria' },
    'España→India':       { precio_20: 1900, precio_40: 3100, tendencia: '↑ +15%', causa: 'Boom importaciones sector energético indio' },
    'España→África':      { precio_20: 1200, precio_40: 2100, tendencia: '→ estable', causa: 'Mercado equilibrado' },
    'España→Europa Norte':{ precio_20: 750,  precio_40: 1200, tendencia: '↑ +3%',  causa: 'Combustible' },
  },

  incidencias: [
    { tipo: 'Retraso puerto >48h',          casos: 8,  estado: '🔴 Activo',   afectados: ['Algeciras: 5 buques', 'Rotterdam: 3 buques'] },
    { tipo: 'Alerta temperatura reefer',    casos: 3,  estado: '🔴 Urgente',  afectados: ['MSKU4821093', 'CMAU7734821', 'HLXU9921043'] },
    { tipo: 'Documentación incompleta',     casos: 6,  estado: '🟡 Gestión',  afectados: ['DUA pendiente: 4 expedientes', 'Certificado origen: 2'] },
    { tipo: 'Daño en mercancía',            casos: 2,  estado: '🔴 Reclamación', afectados: ['IndusMaq Corp — Flat Rack', 'ChemTrade Global — Tanque'] },
    { tipo: 'Avería equipo reefer',         casos: 1,  estado: '🟡 Reparación', afectados: ['HLXU9921043 — en reparación en Dubai'] },
    { tipo: 'Cambio ruta forzado (Suez)',   casos: 3,  estado: '🟢 Resuelto', afectados: ['Desvío por Cabo Buena Esperanza — +9 días'] },
  ],

  predicciones: {
    retrasos_semana_proxima: MES_NUM >= 10 || MES_NUM <= 2 ? 'Alta probabilidad (>65%) por temporales atlánticos' : 'Probabilidad baja-media (20-35%), condiciones estables',
    demanda_proximo_mes: MES_NUM >= 2 && MES_NUM <= 5 ? 'Pico de demanda primavera esperado — reservar espacio con antelación' : MES_NUM >= 8 && MES_NUM <= 10 ? 'Pico pre-navidades en preparación — alta ocupación prevista' : 'Demanda estable',
    tendencia_fletes: 'Incremento moderado esperado +5-8% en rutas transatlánticas para las próximas 6 semanas',
  },
};

// ─── MOTOR DE RESPUESTAS ──────────────────────────────────────────────

function generateBotResponse(input) {
  const msg = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  ctx.msgCount++;

  // ── Saludos ──
  if (m(msg, ['hola','buenos dias','buenas tardes','buenas noches','hey','hello','hi ','que tal','como estas'])) return saludoRes();
  if (m(msg, ['gracias','perfecto','genial','excelente','muy bien','ok gracias'])) return agradecimientoRes();
  if (m(msg, ['ayuda','help','que puedes','que sabes','opciones','menu','comandos'])) return ayudaRes();

  // ── KPIs / Resumen general ──
  if (m(msg, ['resumen','kpi','situacion general','estado general','como estamos','dashboard','todo','balance','panorama'])) return kpiRes();
  if (m(msg, ['facturacion','ingresos','ventas','revenue','euros','dinero este mes'])) return facturacionRes();
  if (m(msg, ['comparativa','comparar','vs mes anterior','respecto al mes','evolucion','tendencia general'])) return comparativaRes();

  // ── Contenedores generales ──
  if (m(msg, ['cuantos contenedores hay','total de contenedores','contenedores totales','cuantos tenemos en total']) && !hasDestino(msg) && !hasNaviera(msg)) return contenedoresTotalRes();
  if (m(msg, ['en transito','navegando ahora','en el mar','en ruta','viajando'])) return enTransitoRes();
  if (m(msg, ['en puerto','fondeado','atracado','esperando en puerto'])) return enPuertoRes();
  if (m(msg, ['tipo','tipos de contenedor','dry','flat rack','open top','tanque','high cube'])) return tiposRes();

  // ── Por destino ──
  if (m(msg, ['estados unidos','usa','eeuu','america del norte','new york','houston','los angeles'])) return destinoRes('Estados Unidos');
  if (m(msg, ['china','shanghai','ningbo','shenzhen','hong kong','extremo oriente','asia oriental'])) return destinoRes('China');
  if (m(msg, ['latinoamerica','latam','brasil','mexico','colombia','santos','cartagena','sudamerica','america latina'])) return destinoRes('Latinoamérica');
  if (m(msg, ['africa','lagos','durban','mombasa','nigeria','sudafrica','kenia'])) return destinoRes('África');
  if (m(msg, ['india','mumbai','nhava','mundra','chennai','subcontinente'])) return destinoRes('India');
  if (m(msg, ['europa','rotterdam','hamburgo','amberes','amsterdam','norte de europa','europa norte'])) return destinoRes('Europa Norte');
  if (m(msg, ['oriente medio','dubai','jebel ali','dammam','salalah','uae','arabia'])) return destinoRes('Oriente Medio');

  // ── Por naviera ──
  if (m(msg, ['maersk'])) return navieraRes('Maersk');
  if (m(msg, ['msc ','mediterranean shipping','de msc'])) return navieraRes('MSC');
  if (m(msg, ['cma cgm','cma '])) return navieraRes('CMA CGM');
  if (m(msg, ['hapag','hapag-lloyd','hapag lloyd'])) return navieraRes('Hapag-Lloyd');
  if (m(msg, ['evergreen'])) return navieraRes('Evergreen');
  if (m(msg, ['cosco','china ocean'])) return navieraRes('COSCO');
  if (m(msg, ['todas las navieras','navieras','ranking navieras','volumen por naviera','comparar navieras'])) return navierasGeneralRes();

  // ── Reefer / Temperatura ──
  if (m(msg, ['reefer','refrigerado','congelado','temperatura','frio','cold chain','cadena de frio','frigorific'])) return reeferRes();
  if (m(msg, ['alerta temperatura','alertas reefer','problema temperatura','fallo temperatura'])) return alertasReeferRes();

  // ── Clientes ──
  if (m(msg, ['top cliente','mejores clientes','principales clientes','ranking clientes','mayor volumen','mas facturacion'])) return topClientesRes();
  if (m(msg, ['cuantos clientes','numero de clientes','clientes activos'])) return clientesActivosRes();
  if (m(msg, ['techexport','tech export'])) return clienteDetalleRes('TechExport SL');
  if (m(msg, ['agromedi','agromediterraneo','agro'])) return clienteDetalleRes('AgroMediterráneo SA');
  if (m(msg, ['indusmaq','maquinaria corp'])) return clienteDetalleRes('IndusMaq Corp');
  if (m(msg, ['chemtrade','quimicos'])) return clienteDetalleRes('ChemTrade Global');
  if (m(msg, ['pharmalog','farmacia','farmaceutico'])) return clienteDetalleRes('PharmaLog Iberia');

  // ── Aduanas / Despacho ──
  if (m(msg, ['pendiente despacho','aduana','despacho aduanero','dua','documentacion pendiente','aduanas'])) return despachoRes();
  if (m(msg, ['documentacion','documento','certificado','bl','bill of lading','incoterm'])) return documentacionRes();

  // ── Puertos ──
  if (m(msg, ['puerto','congestion','espera en puerto','cola en puerto','fondeados'])) return puertosRes();
  if (m(msg, ['algeciras'])) return puertoDetalleRes('Algeciras');
  if (m(msg, ['valencia'])) return puertoDetalleRes('Valencia');
  if (m(msg, ['barcelona'])) return puertoDetalleRes('Barcelona');
  if (m(msg, ['rotterdam'])) return puertoDetalleRes('Rotterdam');
  if (m(msg, ['shanghai'])) return puertoDetalleRes('Shanghai');

  // ── Fletes / Precios ──
  if (m(msg, ['precio flete','coste flete','tarifa','cuesta enviar','cuanto vale','rate','precio del contenedor','precio envio'])) return fletesRes();
  if (m(msg, ['tendencia precio','subida fletes','bajada fletes','evolucion precio'])) return tendenciaFletesRes();

  // ── Incidencias / Problemas ──
  if (m(msg, ['incidencia','incidencias','problema','problemas','alerta activa','que falla','averias','daño','siniestro'])) return incidenciasRes();

  // ── Retrasos / Puntualidad ──
  if (m(msg, ['retraso','retrasos','puntualidad','demora','llega tarde','on time','a tiempo'])) return retrasoRes();
  if (m(msg, ['que naviera es mas puntual','mejor naviera','peor naviera','naviera mas rapida'])) return rankingNavierasRes();

  // ── Tiempo / Clima / Estacionalidad ──
  if (m(msg, ['tiempo','clima','temporal','tormenta','huracan','ciclon','segun la epoca','estacion','mes','afecta','meteorolog'])) return climaRes();
  if (m(msg, ['cuando es mejor enviar','mejor epoca para enviar','mejor mes','estacionalidad'])) return estacionalidadRes();

  // ── Predicciones ──
  if (m(msg, ['prediccion','prevision','pronostico','que va a pasar','siguiente semana','proximo mes','forecast'])) return prediccionRes();

  // ── Suez / Canal ──
  if (m(msg, ['suez','canal de suez','ruta suez','cabo','buena esperanza','desvio'])) return suezRes();

  // ── Follow-up contextual si hay topic anterior ──
  if (ctx.lastTopic && m(msg, ['y eso','mas detalles','cuanto','cuantos','dame mas','amplia','explica','y que mas','seguir'])) return followUpRes();

  // ── Default inteligente ──
  return defaultRes(input);
}

// ─── RESPUESTAS ───────────────────────────────────────────────────────

function saludoRes() {
  ctx.lastTopic = 'saludo';
  const hora = NOW.getHours();
  const saludo = hora < 14 ? '¡Buenos días!' : hora < 21 ? '¡Buenas tardes!' : '¡Buenas noches!';
  return `${saludo} 👋 Soy tu asistente de logística marítima conectado a <strong>Power BI en tiempo real</strong>.<br/><br/>
📅 Datos actualizados a: <em>${DB.fecha_actualizacion}</em><br/><br/>
${CLIMA_HOY.alerta} — ${CLIMA_HOY.impacto}<br/><br/>
Puedo darte datos en segundos sobre <strong>contenedores, navieras, clientes, reefer, fletes, puertos, retrasos, predicciones</strong> y mucho más.<br/><br/>
💬 Pregunta como si hablaras con una persona. ¿Por dónde empezamos?`;
}

function agradecimientoRes() {
  return `¡De nada! 😊 Si necesitas algo más, aquí estoy.<br/><br/>Recuerda que puedo darte datos sobre cualquier aspecto de tu operación logística en tiempo real.`;
}

function ayudaRes() {
  ctx.lastTopic = 'ayuda';
  return `🤖 <strong>Esto es lo que puedo consultarte:</strong><br/><br/>
<strong>📦 Contenedores</strong> — total, por destino, naviera, tipo, estado<br/>
<strong>🚢 Navieras</strong> — Maersk, MSC, CMA CGM, Hapag-Lloyd, Evergreen, COSCO<br/>
<strong>🌍 Destinos</strong> — EE.UU., China, Latam, India, África, Oriente Medio, Europa<br/>
<strong>🌡️ Reefer</strong> — activos, alertas temperatura, destinos, incidencias<br/>
<strong>👥 Clientes</strong> — top clientes, detalle por empresa, facturación<br/>
<strong>💰 Fletes</strong> — precios actuales, tendencias, mejor ruta<br/>
<strong>⚓ Puertos</strong> — congestión, espera, operatividad<br/>
<strong>⏱️ Retrasos</strong> — ranking navieras, causas, predicciones<br/>
<strong>🌦️ Clima</strong> — alertas temporales, impacto en rutas, estacionalidad<br/>
<strong>📊 KPIs</strong> — facturación, puntualidad, incidencias, NPS<br/>
<strong>🔮 Predicciones</strong> — próxima semana, próximo mes, tendencias<br/><br/>
Habla en lenguaje natural: <em>"¿Cuánto me cuesta enviar a India ahora mismo?"</em>`;
}

function kpiRes() {
  ctx.lastTopic = 'kpi';
  const k = DB.kpis.mes_actual, kp = DB.kpis.mes_anterior;
  const varFac = (((k.facturacion - kp.facturacion) / kp.facturacion) * 100).toFixed(1);
  const varPunt = (k.puntualidad - kp.puntualidad).toFixed(1);
  return `📊 <strong>Dashboard general — ${MES_ACTUAL.charAt(0).toUpperCase()+MES_ACTUAL.slice(1)} ${NOW.getFullYear()}</strong><br/>
<em>Datos a ${DB.fecha_actualizacion}</em><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${fNum(k.facturacion)}€</span><span class="kpi-label">Facturación <span style="color:#4ade80">+${varFac}% vs mes ant.</span></span></div>
  <div class="kpi-item"><span class="kpi-val">${fNum(k.contenedores)}</span><span class="kpi-label">Contenedores gestionados</span></div>
  <div class="kpi-item"><span class="kpi-val">${k.puntualidad}%</span><span class="kpi-label">Puntualidad <span style="color:#4ade80">+${varPunt}pp vs mes ant.</span></span></div>
  <div class="kpi-item"><span class="kpi-val">${k.clientes_activos}</span><span class="kpi-label">Clientes activos</span></div>
</div><br/>
🚨 <strong>${k.incidencias} incidencias</strong> abiertas &nbsp;·&nbsp; Retraso medio: <strong>${k.retraso_medio} días</strong> &nbsp;·&nbsp; NPS: <strong>${k.nps}/100</strong><br/>
${CLIMA_HOY.alerta} — actualmente afecta a: <em>${CLIMA_HOY.rutas.join(', ')}</em>`;
}

function facturacionRes() {
  ctx.lastTopic = 'facturacion';
  const k = DB.kpis.mes_actual, kp = DB.kpis.mes_anterior, ka = DB.kpis.mismo_mes_año_anterior;
  return `💰 <strong>Facturación — análisis completo</strong><br/><br/>
<table class="data-table">
  <tr><th>Periodo</th><th>Facturación</th><th>Variación</th></tr>
  <tr><td>${MES_ACTUAL} ${NOW.getFullYear()}</td><td><strong>${fNum(k.facturacion)}€</strong></td><td><span style="color:#4ade80">↑ +${(((k.facturacion-kp.facturacion)/kp.facturacion)*100).toFixed(1)}%</span></td></tr>
  <tr><td>Mes anterior</td><td>${fNum(kp.facturacion)}€</td><td>—</td></tr>
  <tr><td>Mismo mes año ant.</td><td>${fNum(ka.facturacion)}€</td><td><span style="color:#4ade80">↑ +${(((k.facturacion-ka.facturacion)/ka.facturacion)*100).toFixed(1)}%</span></td></tr>
</table><br/>
📈 Proyección anual al ritmo actual: <strong>~${fNum(k.facturacion * 12)}€</strong>`;
}

function comparativaRes() {
  ctx.lastTopic = 'comparativa';
  const k = DB.kpis.mes_actual, kp = DB.kpis.mes_anterior;
  return `📈 <strong>Comparativa ${MES_ACTUAL} vs mes anterior</strong><br/><br/>
<table class="data-table">
  <tr><th>KPI</th><th>Este mes</th><th>Mes anterior</th><th>Cambio</th></tr>
  <tr><td>Facturación</td><td><strong>${fNum(k.facturacion)}€</strong></td><td>${fNum(kp.facturacion)}€</td><td style="color:#4ade80">+${(((k.facturacion-kp.facturacion)/kp.facturacion)*100).toFixed(1)}%</td></tr>
  <tr><td>Contenedores</td><td><strong>${fNum(k.contenedores)}</strong></td><td>${fNum(kp.contenedores)}</td><td style="color:#4ade80">+${(((k.contenedores-kp.contenedores)/kp.contenedores)*100).toFixed(1)}%</td></tr>
  <tr><td>Puntualidad</td><td><strong>${k.puntualidad}%</strong></td><td>${kp.puntualidad}%</td><td style="color:#4ade80">+${(k.puntualidad-kp.puntualidad).toFixed(1)}pp</td></tr>
  <tr><td>Incidencias</td><td><strong>${k.incidencias}</strong></td><td>${kp.incidencias}</td><td style="color:#4ade80">-${kp.incidencias-k.incidencias} (-${(((kp.incidencias-k.incidencias)/kp.incidencias)*100).toFixed(0)}%)</td></tr>
  <tr><td>Retraso medio</td><td><strong>${k.retraso_medio} días</strong></td><td>${kp.retraso_medio} días</td><td style="color:#4ade80">-${(kp.retraso_medio-k.retraso_medio).toFixed(1)} días</td></tr>
</table>`;
}

function contenedoresTotalRes() {
  ctx.lastTopic = 'contenedores_total';
  const c = DB.contenedores;
  return `📦 <strong>Estado global de contenedores</strong><br/><em>${DB.fecha_actualizacion}</em><br/><br/>
<table class="data-table">
  <tr><th>Estado</th><th>Unidades</th><th>%</th></tr>
  <tr><td>🟢 En tránsito (navegando)</td><td><strong>${fNum(c.en_transito)}</strong></td><td>${((c.en_transito/c.total)*100).toFixed(1)}%</td></tr>
  <tr><td>🟡 En puerto</td><td><strong>${fNum(c.en_puerto)}</strong></td><td>${((c.en_puerto/c.total)*100).toFixed(1)}%</td></tr>
  <tr><td>🔵 En descarga</td><td><strong>${fNum(c.descargando)}</strong></td><td>${((c.descargando/c.total)*100).toFixed(1)}%</td></tr>
  <tr><td>🔴 Pendiente despacho</td><td><strong>${fNum(c.pendiente_despacho)}</strong></td><td>${((c.pendiente_despacho/c.total)*100).toFixed(1)}%</td></tr>
  <tr><td><strong>TOTAL FLOTA</strong></td><td><strong>${fNum(c.total)}</strong></td><td>100%</td></tr>
</table>`;
}

function enTransitoRes() {
  ctx.lastTopic = 'en_transito';
  const c = DB.contenedores;
  return `🌊 <strong>Contenedores actualmente en navegación</strong><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${fNum(c.en_transito)}</span><span class="kpi-label">Total en el mar ahora</span></div>
  <div class="kpi-item"><span class="kpi-val">${((c.en_transito/c.total)*100).toFixed(1)}%</span><span class="kpi-label">De la flota total</span></div>
</div><br/>
⚠️ <strong>Alerta climática activa:</strong> ${CLIMA_HOY.alerta}<br/>
Impacto estimado: ${CLIMA_HOY.impacto}<br/><br/>
<strong>Rutas más concurridas ahora mismo:</strong><br/>
• España → China: <strong>${fNum(DB.contenedores.por_destino['China'].en_transito || Math.floor(DB.contenedores.por_destino['China'].total*0.65))}</strong> en navegación (~31 días)<br/>
• España → EE.UU.: <strong>${fNum(Math.floor(DB.contenedores.por_destino['Estados Unidos'].total*0.62))}</strong> en navegación (~16 días)<br/>
• España → Latam: <strong>${fNum(Math.floor(DB.contenedores.por_destino['Latinoamérica'].total*0.58))}</strong> en navegación (~17 días)`;
}

function enPuertoRes() {
  ctx.lastTopic = 'en_puerto';
  return `⚓ <strong>Contenedores en puertos ahora mismo</strong><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${fNum(DB.contenedores.en_puerto)}</span><span class="kpi-label">Total en puerto</span></div>
  <div class="kpi-item"><span class="kpi-val">${fNum(DB.contenedores.descargando)}</span><span class="kpi-label">En descarga activa</span></div>
</div><br/>
<strong>Situación por puertos propios:</strong><br/>
<table class="data-table">
  <tr><th>Puerto</th><th>Congestión</th><th>Espera media</th></tr>
  ${Object.entries(DB.puertos).filter(([_,v])=>v).slice(0,5).map(([p,v])=>`<tr><td>${p}</td><td>${v.congestion==='Alta'?'🔴':'🟡'} ${v.congestión}</td><td>${v.espera_media}</td></tr>`).join('')}
</table>`;
}

function tiposRes() {
  ctx.lastTopic = 'tipos_contenedor';
  const tipos = DB.contenedores.por_tipo;
  return `📦 <strong>Distribución por tipo de contenedor</strong><br/><br/>
<table class="data-table">
  <tr><th>Tipo</th><th>Unidades</th><th>% flota</th></tr>
  ${Object.entries(tipos).map(([t,v])=>`<tr><td>${t}</td><td><strong>${fNum(v)}</strong></td><td>${((v/DB.contenedores.total)*100).toFixed(1)}%</td></tr>`).join('')}
</table><br/>
💡 El Dry Van 40' es el más demandado (${((tipos["Dry Van 40'"]/DB.contenedores.total)*100).toFixed(1)}% de la flota). Los reefer representan un ${(((tipos["Reefer 40'"]+tipos["Reefer 20'"])/DB.contenedores.total)*100).toFixed(1)}% con alta rentabilidad por servicio especial.`;
}

function destinoRes(destino) {
  ctx.lastTopic = 'destino';
  ctx.lastDestino = destino;
  const d = DB.contenedores.por_destino[destino];
  const f = DB.fletes[`España→${destino}`] || DB.fletes[`España→${destino.split(' ')[0]}`];
  const flag = {'Estados Unidos':'🇺🇸','China':'🇨🇳','Latinoamérica':'🌎','África':'🌍','India':'🇮🇳','Europa Norte':'🇪🇺','Oriente Medio':'🌙'}[destino]||'🌍';
  let climaNote = '';
  if ((destino==='Estados Unidos'||destino==='Europa Norte') && (MES_NUM>=10||MES_NUM<=2)) climaNote = `<br/>⚠️ <strong>Alerta temporal:</strong> ${CLIMA_HOY.alerta} — impacto en esta ruta: ${CLIMA_HOY.impacto}`;
  if (destino==='China' && MES_NUM>=8 && MES_NUM<=9) climaNote = `<br/>🌀 <strong>Temporada tifones:</strong> posibles desvíos en puertos del sur de China`;
  return `${flag} <strong>Contenedores → ${destino}</strong><br/><em>${DB.fecha_actualizacion}</em><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${fNum(d.total)}</span><span class="kpi-label">Contenedores activos</span></div>
  <div class="kpi-item"><span class="kpi-val">${d.dias_transito} días</span><span class="kpi-label">Tránsito medio</span></div>
  ${f ? `<div class="kpi-item"><span class="kpi-val">${fNum(f.precio_40)}€</span><span class="kpi-label">Flete 40' ahora ${f.tendencia}</span></div>` : ''}
  <div class="kpi-item"><span class="kpi-val">${d.tendencia}</span><span class="kpi-label">Tendencia volumen</span></div>
</div><br/>
🚢 <strong>Navieras principales:</strong> ${d.navieras.join(', ')}<br/>
⚓ <strong>Puertos destino:</strong> ${d.puertos.join(', ')}${climaNote}
${f ? `<br/>💬 <em>Causa tendencia precio:</em> ${f.causa}` : ''}`;
}

function navieraRes(naviera) {
  ctx.lastTopic = 'naviera';
  ctx.lastNaviera = naviera;
  const n = DB.contenedores.por_naviera[naviera];
  return `🚢 <strong>${naviera} — detalle completo</strong><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${fNum(n.total)}</span><span class="kpi-label">Total contenedores</span></div>
  <div class="kpi-item"><span class="kpi-val">${n.puntualidad}</span><span class="kpi-label">Puntualidad</span></div>
  <div class="kpi-item"><span class="kpi-val">${n.retraso_medio} días</span><span class="kpi-label">Retraso medio</span></div>
  <div class="kpi-item"><span class="kpi-val">${fNum(n.reefer)}</span><span class="kpi-label">Reefer activos</span></div>
</div><br/>
<table class="data-table">
  <tr><th>Estado</th><th>Unidades</th></tr>
  <tr><td>🟢 En tránsito</td><td><strong>${fNum(n.en_transito)}</strong></td></tr>
  <tr><td>🟡 En puerto</td><td><strong>${fNum(n.en_puerto)}</strong></td></tr>
</table><br/>
📊 ${naviera} representa el <strong>${((n.total/DB.contenedores.total)*100).toFixed(1)}%</strong> de tu flota total.`;
}

function navierasGeneralRes() {
  ctx.lastTopic = 'navieras_general';
  const nav = DB.contenedores.por_naviera;
  const sorted = Object.entries(nav).sort((a,b)=>b[1].total-a[1].total);
  return `🚢 <strong>Ranking navieras — volumen y puntualidad</strong><br/><br/>
<table class="data-table">
  <tr><th>Naviera</th><th>Contenedores</th><th>Puntualidad</th><th>Retraso medio</th></tr>
  ${sorted.map(([n,d])=>`<tr><td><strong>${n}</strong></td><td>${fNum(d.total)}</td><td>${d.puntualidad}</td><td>${d.retraso_medio}d</td></tr>`).join('')}
</table><br/>
🏆 <strong>Más puntual:</strong> Maersk (96.1%) &nbsp;·&nbsp; ⚠️ <strong>Más retrasos:</strong> Evergreen (2.8d media)`;
}

function reeferRes() {
  ctx.lastTopic = 'reefer';
  const r = DB.reefer;
  return `🌡️ <strong>Cadena de frío — Estado global</strong><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${fNum(r.total)}</span><span class="kpi-label">Total reefer activos</span></div>
  <div class="kpi-item"><span class="kpi-val">${r.temp_media}°C</span><span class="kpi-label">Temperatura media flota</span></div>
  <div class="kpi-item"><span class="kpi-val">${fNum(r.en_transito)}</span><span class="kpi-label">En navegación</span></div>
  <div class="kpi-item"><span class="kpi-val">${r.alertas}</span><span class="kpi-label" style="color:${r.alertas>0?'#f87171':'#4ade80'}">⚠️ Alertas activas</span></div>
</div><br/>
<strong>Por destino:</strong><br/>
<table class="data-table">
  <tr><th>Destino</th><th>Reefer</th></tr>
  ${Object.entries(r.por_destino).map(([d,v])=>`<tr><td>${d}</td><td><strong>${v}</strong></td></tr>`).join('')}
</table>${r.alertas>0?`<br/>🚨 <strong>¡${r.alertas} alertas de temperatura activas!</strong> Escribe "alertas reefer" para ver detalles.`:''}`;
}

function alertasReeferRes() {
  ctx.lastTopic = 'alertas_reefer';
  const alertas = DB.reefer.alertas_detalle;
  return `🚨 <strong>Alertas de temperatura — Urgente</strong><br/><br/>
<table class="data-table">
  <tr><th>Contenedor</th><th>Temp. actual</th><th>Requerida</th><th>Cliente</th><th>Acción</th></tr>
  ${alertas.map(a=>`<tr><td><strong>${a.contenedor}</strong></td><td style="color:#f87171"><strong>${a.temp_actual}°C</strong></td><td>${a.temp_requerida}°C</td><td>${a.cliente}</td><td>${a.accion}</td></tr>`).join('')}
</table><br/>
📞 El equipo técnico ha sido notificado automáticamente. Ruta afectada: <em>${alertas.map(a=>a.ruta).join(', ')}</em>`;
}

function topClientesRes() {
  ctx.lastTopic = 'clientes';
  return `👥 <strong>Top 10 Clientes — ${MES_ACTUAL} ${NOW.getFullYear()}</strong><br/><br/>
<table class="data-table">
  <tr><th>#</th><th>Cliente</th><th>Carga</th><th>Cont.</th><th>Facturación</th><th>⭐</th></tr>
  ${DB.clientes.map((c,i)=>`<tr><td>${i+1}</td><td><strong>${c.nombre}</strong></td><td style="font-size:0.75rem;color:#94a3b8">${c.tipo_carga}</td><td>${c.contenedores}</td><td>${fNum(c.facturacion)}€</td><td>${c.satisfaccion}</td></tr>`).join('')}
</table>`;
}

function clientesActivosRes() {
  ctx.lastTopic = 'clientes_activos';
  const k = DB.kpis.mes_actual, kp = DB.kpis.mes_anterior;
  return `👥 <strong>Clientes activos este mes: ${k.clientes_activos}</strong><br/><br/>
Mes anterior: ${kp.clientes_activos} clientes &nbsp;→&nbsp; <span style="color:#4ade80">+${k.clientes_activos-kp.clientes_activos} nuevos clientes</span><br/><br/>
Top 3 por facturación: <strong>PharmaLog Iberia, IndusMaq Corp, TechExport SL</strong><br/>
NPS medio de satisfacción: <strong>${k.nps}/100</strong>`;
}

function clienteDetalleRes(nombre) {
  ctx.lastTopic = 'cliente_detalle';
  ctx.lastCliente = nombre;
  const c = DB.clientes.find(x=>x.nombre===nombre);
  if(!c) return `No encontré datos exactos para ese cliente. Prueba con el nombre completo.`;
  return `👤 <strong>${c.nombre}</strong><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${c.contenedores}</span><span class="kpi-label">Contenedores activos</span></div>
  <div class="kpi-item"><span class="kpi-val">${fNum(c.facturacion)}€</span><span class="kpi-label">Facturación este mes</span></div>
  <div class="kpi-item"><span class="kpi-val">${c.satisfaccion}/10</span><span class="kpi-label">Satisfacción</span></div>
  <div class="kpi-item"><span class="kpi-val">${c.naviera}</span><span class="kpi-label">Naviera habitual</span></div>
</div><br/>
📦 Tipo de carga: <strong>${c.tipo_carga}</strong><br/>
🌍 Destino principal: <strong>${c.destino}</strong><br/>
🇪🇸 País origen: ${c.pais}`;
}

function despachoRes() {
  ctx.lastTopic = 'despacho';
  const c = DB.contenedores.pendiente_despacho;
  return `🛃 <strong>Pendientes de despacho aduanero</strong><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${c}</span><span class="kpi-label">Total pendientes</span></div>
  <div class="kpi-item"><span class="kpi-val">48h</span><span class="kpi-label">Tiempo medio resolución</span></div>
</div><br/>
<table class="data-table">
  <tr><th>Tipo</th><th>Unidades</th></tr>
  <tr><td>📥 Importación España</td><td><strong>312</strong></td></tr>
  <tr><td>📥 Importación Portugal</td><td><strong>187</strong></td></tr>
  <tr><td>📋 Regímenes especiales</td><td><strong>89</strong></td></tr>
  <tr><td>🏭 Zona franca</td><td><strong>53</strong></td></tr>
</table><br/>
🚨 <strong>23 expedientes</strong> llevan más de 72h — recomendado revisión urgente. Los documentos pendientes son principalmente: DUA de importación (4) y Certificados de Origen (2).`;
}

function documentacionRes() {
  ctx.lastTopic = 'documentacion';
  return `📋 <strong>Estado de documentación</strong><br/><br/>
<table class="data-table">
  <tr><th>Documento</th><th>Pendientes</th><th>Estado</th></tr>
  <tr><td>Bill of Lading (B/L)</td><td>0</td><td>✅ Al día</td></tr>
  <tr><td>DUA / DAU Importación</td><td>4</td><td>🟡 En gestión</td></tr>
  <tr><td>Certificado de Origen</td><td>2</td><td>🟡 En tramitación</td></tr>
  <tr><td>Packing List</td><td>1</td><td>🟡 Pendiente cliente</td></tr>
  <tr><td>Certificado Fitosanitario</td><td>0</td><td>✅ Al día</td></tr>
  <tr><td>DGD (Mercancía Peligrosa)</td><td>0</td><td>✅ Al día</td></tr>
</table><br/>
💡 Los Incoterms más usados en tu operación: <strong>CIF (42%), FOB (31%), DDP (18%), EXW (9%)</strong>`;
}

function puertosRes() {
  ctx.lastTopic = 'puertos';
  return `⚓ <strong>Estado de puertos clave — Ahora mismo</strong><br/><br/>
<table class="data-table">
  <tr><th>Puerto</th><th>Congestión</th><th>Espera media</th><th>Buques fondead.</th></tr>
  ${Object.entries(DB.puertos).map(([p,v])=>`<tr><td><strong>${p}</strong></td><td>${v.congestión==='Alta'?'🔴':v.congestión==='Media'?'🟡':'🟢'} ${v.congestión}</td><td>${v.espera_media}</td><td>${v.buques_fondeados}</td></tr>`).join('')}
</table><br/>
⚠️ <strong>Algeciras con congestión alta</strong> por desviaciones de ruta del Mar Rojo/Suez. Recomendable notificar a clientes con cargas en tránsito.`;
}

function puertoDetalleRes(puerto) {
  ctx.lastTopic = 'puerto_detalle';
  const p = DB.puertos[puerto];
  if(!p) return `No tengo datos en tiempo real de ese puerto. Los puertos disponibles son: ${Object.keys(DB.puertos).join(', ')}.`;
  return `⚓ <strong>Puerto de ${puerto} — Estado actual</strong><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${p.congestión}</span><span class="kpi-label" style="color:${p.congestión==='Alta'?'#f87171':p.congestión==='Media'?'#fbbf24':'#4ade80'}">Nivel de congestión</span></div>
  <div class="kpi-item"><span class="kpi-val">${p.espera_media}</span><span class="kpi-label">Espera media para atraque</span></div>
  <div class="kpi-item"><span class="kpi-val">${p.buques_fondeados}</span><span class="kpi-label">Buques fondeados ahora</span></div>
  <div class="kpi-item"><span class="kpi-val">${p.operativos?'✅ Sí':'❌ No'}</span><span class="kpi-label">Operativo</span></div>
</div>${p.nota ? `<br/>ℹ️ <strong>Nota:</strong> ${p.nota}` : ''}`;
}

function fletesRes() {
  ctx.lastTopic = 'fletes';
  return `💰 <strong>Tarifas de flete actuales — ${MES_ACTUAL} ${NOW.getFullYear()}</strong><br/><br/>
<table class="data-table">
  <tr><th>Ruta</th><th>20'</th><th>40'</th><th>Tendencia</th></tr>
  ${Object.entries(DB.fletes).map(([r,v])=>`<tr><td>${r}</td><td>${fNum(v.precio_20)}€</td><td><strong>${fNum(v.precio_40)}€</strong></td><td>${v.tendencia}</td></tr>`).join('')}
</table><br/>
${CLIMA_HOY.alerta} — puede impactar en precios de rutas ${CLIMA_HOY.rutas.join('/')}.`;
}

function tendenciaFletesRes() {
  ctx.lastTopic = 'fletes_tendencia';
  return `📈 <strong>Tendencias de fletes — análisis ${TRIMESTRE} ${NOW.getFullYear()}</strong><br/><br/>
${Object.entries(DB.fletes).map(([r,v])=>`• <strong>${r}:</strong> ${v.tendencia} — <em>${v.causa}</em>`).join('<br/>')}<br/><br/>
🔮 <strong>Previsión próximas 6 semanas:</strong> ${DB.predicciones.tendencia_fletes}<br/>
💡 <strong>Consejo:</strong> Si tienes carga prevista hacia India o EE.UU., conviene reservar espacio esta semana antes del previsible incremento.`;
}

function incidenciasRes() {
  ctx.lastTopic = 'incidencias';
  const total = DB.incidencias.reduce((s,i)=>s+i.casos,0);
  return `🚨 <strong>Incidencias activas — ${MES_ACTUAL} ${NOW.getFullYear()}</strong><br/><br/>
<table class="data-table">
  <tr><th>Tipo</th><th>Casos</th><th>Estado</th></tr>
  ${DB.incidencias.map(i=>`<tr><td>${i.tipo}</td><td><strong>${i.casos}</strong></td><td>${i.estado}</td></tr>`).join('')}
  <tr><td><strong>TOTAL</strong></td><td><strong>${total}</strong></td><td></td></tr>
</table><br/>
📞 Las incidencias marcadas 🔴 han sido escaladas al equipo operativo. ¿Quieres detalle de alguna en concreto?`;
}

function retrasoRes() {
  ctx.lastTopic = 'retrasos';
  const k = DB.kpis.mes_actual, kp = DB.kpis.mes_anterior;
  return `⏱️ <strong>Análisis de puntualidad — ${MES_ACTUAL}</strong><br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">${k.puntualidad}%</span><span class="kpi-label">Puntualidad global <span style="color:#4ade80">↑ vs ${kp.puntualidad}%</span></span></div>
  <div class="kpi-item"><span class="kpi-val">${k.retraso_medio} días</span><span class="kpi-label">Retraso medio <span style="color:#4ade80">↓ desde ${kp.retraso_medio}d</span></span></div>
</div><br/>
<strong>Por naviera:</strong><br/>
<table class="data-table">
  <tr><th>Naviera</th><th>Retraso medio</th><th>Puntualidad</th></tr>
  ${Object.entries(DB.contenedores.por_naviera).sort((a,b)=>a[1].retraso_medio-b[1].retraso_medio).map(([n,d])=>`<tr><td>${n}</td><td>${d.retraso_medio}d</td><td><strong>${d.puntualidad}</strong></td></tr>`).join('')}
</table><br/>
⚠️ <strong>Causa principal de retrasos:</strong> Congestión Algeciras (ruta Suez) + ${CLIMA_HOY.alerta.split('—')[0]}`;
}

function rankingNavierasRes() {
  ctx.lastTopic = 'ranking_navieras';
  const sorted = Object.entries(DB.contenedores.por_naviera).sort((a,b)=>b[1].puntualidad.replace('%','')-a[1].puntualidad.replace('%',''));
  return `🏆 <strong>Ranking navieras por puntualidad</strong><br/><br/>
<table class="data-table">
  <tr><th>Pos.</th><th>Naviera</th><th>Puntualidad</th><th>Retraso medio</th></tr>
  ${sorted.map(([n,d],i)=>`<tr><td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td><td><strong>${n}</strong></td><td>${d.puntualidad}</td><td>${d.retraso_medio} días</td></tr>`).join('')}
</table><br/>
💡 Para cargas urgentes, prioriza <strong>Maersk o Hapag-Lloyd</strong>. Para volumen con menos sensibilidad al tiempo, <strong>Evergreen o CMA CGM</strong> tienen mejores tarifas.`;
}

function climaRes() {
  ctx.lastTopic = 'clima';
  return `🌦️ <strong>Condiciones meteorológicas y su impacto — ${MES_ACTUAL}</strong><br/><br/>
${CLIMA_HOY.alerta}<br/>
📍 <strong>Rutas afectadas:</strong> ${CLIMA_HOY.rutas.join(', ')}<br/>
⚠️ <strong>Impacto actual:</strong> ${CLIMA_HOY.impacto}<br/><br/>
<strong>Calendario de riesgos anuales:</strong><br/>
<table class="data-table">
  <tr><th>Periodo</th><th>Riesgo</th><th>Ruta afectada</th></tr>
  <tr><td>Nov–Feb</td><td>❄️ Temporales atlánticos</td><td>España–EE.UU., Europa Norte</td></tr>
  <tr><td>Abr–May</td><td>🌧️ Lluvias Asia-Pacífico</td><td>China, Japón, Corea</td></tr>
  <tr><td>Jun–Oct</td><td>🌀 Huracanes / Tifones</td><td>Caribe, Pacífico Norte, Asia</td></tr>
  <tr><td>Todo el año</td><td>⚓ Congestión puertos</td><td>Variable según demanda global</td></tr>
</table><br/>
🔮 <strong>Predicción próxima semana:</strong> ${DB.predicciones.retrasos_semana_proxima}`;
}

function estacionalidadRes() {
  ctx.lastTopic = 'estacionalidad';
  return `📅 <strong>Estacionalidad logística — ¿Cuándo enviar?</strong><br/><br/>
<table class="data-table">
  <tr><th>Periodo</th><th>Nivel demanda</th><th>Recomendación</th></tr>
  <tr><td>Ene–Feb</td><td>🟡 Media-Baja</td><td>Buenos precios, riesgo temporales atlánticos</td></tr>
  <tr><td>Mar–May</td><td>🔴 Alta (pico)</td><td>Reservar con 3-4 semanas antelación</td></tr>
  <tr><td>Jun–Jul</td><td>🟡 Media</td><td>Estable, vigilar Caribe si aplica</td></tr>
  <tr><td>Ago–Sep</td><td>🔴 Alta (pico pre-navidad)</td><td>Reservar con 4-6 semanas antelación</td></tr>
  <tr><td>Oct</td><td>🔴 Muy alta</td><td>Capacidad muy limitada, precios máximos</td></tr>
  <tr><td>Nov–Dic</td><td>🟡 Media</td><td>Post-pico, buenos precios de vuelta</td></tr>
</table><br/>
📌 <strong>Ahora mismo:</strong> Estamos en <strong>${MES_ACTUAL}</strong> — ${DB.predicciones.demanda_proximo_mes}`;
}

function prediccionRes() {
  ctx.lastTopic = 'prediccion';
  return `🔮 <strong>Predicciones y previsiones</strong><br/><br/>
<strong>Próxima semana:</strong><br/>
• Retrasos: ${DB.predicciones.retrasos_semana_proxima}<br/>
• Puerto Algeciras: congestión seguirá alta por desvíos ruta Suez<br/><br/>
<strong>Próximo mes:</strong><br/>
• ${DB.predicciones.demanda_proximo_mes}<br/>
• ${DB.predicciones.tendencia_fletes}<br/><br/>
<strong>Basado en:</strong> histórico de los últimos 24 meses, condiciones meteorológicas actuales, nivel de ocupación de buques confirmados y tendencias de mercado BIMCO/Alphaliner.`;
}

function suezRes() {
  ctx.lastTopic = 'suez';
  return `🗺️ <strong>Situación Canal de Suez / Mar Rojo</strong><br/><br/>
⚠️ <strong>Estado actual:</strong> Desvíos activos por el Cabo de Buena Esperanza para rutas Asia-Europa<br/><br/>
<div class="kpi-grid">
  <div class="kpi-item"><span class="kpi-val">+9 días</span><span class="kpi-label">Impacto en tránsito</span></div>
  <div class="kpi-item"><span class="kpi-val">+18%</span><span class="kpi-label">Sobrecosto combustible</span></div>
</div><br/>
<strong>Impacto en tu operación:</strong><br/>
• <strong>3 expedientes</strong> ya redirigidos por Cabo Buena Esperanza (resueltos)<br/>
• Puerto Algeciras con congestión alta (28 buques fondeados) por acumulación de tráfico<br/>
• Rutas Europa-Asia afectadas: ETA revisadas +7-12 días<br/><br/>
💡 <strong>Recomendación:</strong> Para cargas urgentes Asia-Europa, valorar transporte aéreo o buffer de inventario mínimo 2 semanas adicional.`;
}

function followUpRes() {
  if (ctx.lastTopic === 'naviera' && ctx.lastNaviera) return navieraRes(ctx.lastNaviera);
  if (ctx.lastTopic === 'destino' && ctx.lastDestino) return destinoRes(ctx.lastDestino);
  if (ctx.lastTopic === 'cliente_detalle' && ctx.lastCliente) return clienteDetalleRes(ctx.lastCliente);
  if (ctx.lastTopic === 'kpi') return comparativaRes();
  if (ctx.lastTopic === 'reefer') return alertasReeferRes();
  return defaultRes('');
}

function defaultRes(input) {
  const sugs = ['¿Cuántos contenedores hay en EE.UU.?', 'Dame el resumen de KPIs', 'Alertas de temperatura reefer', '¿Qué naviera es más puntual?', `¿Cómo afecta el clima en ${MES_ACTUAL}?`, 'Precio flete a China ahora mismo'];
  return `Entiendo lo que buscas${input ? ` (<em>"${input.length>40?input.substring(0,40)+'...':input}"</em>)` : ''}.<br/><br/>
Con tu Power BI real conectado respondería exactamente eso. En esta demo, prueba preguntas como:<br/><br/>
${sugs.map(s=>`<span class="query-chip-inline" onclick="setInput('${s}')">${s}</span>`).join(' ')}<br/><br/>
O escribe cualquier cosa sobre tu operación: contenedores, navieras, clientes, precios, clima, retrasos...`;
}

// ─── HELPERS ─────────────────────────────────────────────────────────
function m(msg, keys) { return keys.some(k => msg.includes(k)); }
function hasDestino(msg) { return ['estados unidos','china','latam','india','africa','europa','oriente'].some(k=>msg.includes(k)); }
function hasNaviera(msg) { return ['maersk','msc','cma','hapag','evergreen','cosco'].some(k=>msg.includes(k)); }
function fNum(n) { return Number(n).toLocaleString('es-ES'); }
function setInput(txt) { document.getElementById('chatInput').value = txt; document.getElementById('chatInput').focus(); }

// ─── INTERFAZ ────────────────────────────────────────────────────────
function sendMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  appendMessage(msg, 'user');
  showTyping();
  setTimeout(() => {
    hideTyping();
    appendMessage(generateBotResponse(msg), 'bot');
  }, 600 + Math.random() * 800);
}

function sendExampleQuery(chip) {
  const q = chip.textContent;
  document.getElementById('chatInput').value = q;
  document.getElementById('bot-demo').scrollIntoView({ behavior: 'smooth' });
  setTimeout(sendMessage, 300);
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

function appendMessage(text, type) {
  const c = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  div.innerHTML = `<div class="msg-avatar"><i class="fas fa-${type==='bot'?'robot':'user'}"></i></div><div class="msg-bubble">${text}</div>`;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

function showTyping() {
  document.getElementById('typingIndicator').style.display = 'flex';
  document.getElementById('chatMessages').scrollTop = 9999;
}
function hideTyping() { document.getElementById('typingIndicator').style.display = 'none'; }
