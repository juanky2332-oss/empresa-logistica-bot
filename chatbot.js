// =====================================================
// LOGISTICS AI CHATBOT - Power BI Demo Simulation
// En producción real, esto llama a n8n → Power BI API
// =====================================================

const MOCK_DATA = {
  contenedores: {
    total: 12480,
    en_transito: 7842,
    en_puerto: 3106,
    descargando: 891,
    pendiente_despacho: 641,
    por_naviera: {
      "Maersk": { total: 3847, en_transito: 2410, en_puerto: 1200, reefer: 312 },
      "MSC": { total: 2904, en_transito: 1890, en_puerto: 820, reefer: 198 },
      "CMA CGM": { total: 2103, en_transito: 1340, en_puerto: 620, reefer: 143 },
      "Hapag-Lloyd": { total: 1842, en_transito: 1100, en_puerto: 590, reefer: 152 },
      "Evergreen": { total: 987, en_transito: 620, en_puerto: 290, reefer: 77 },
      "COSCO": { total: 797, en_transito: 482, en_puerto: 195, reefer: 120 },
    },
    por_destino: {
      "Estados Unidos": { total: 2847, navieras: ["Maersk", "MSC", "Hapag-Lloyd"], media_dias: 16 },
      "China": { total: 2104, navieras: ["COSCO", "Evergreen", "CMA CGM"], media_dias: 31 },
      "Latinoamérica": { total: 1632, navieras: ["Hamburg Sud", "Hapag-Lloyd"], media_dias: 17 },
      "África": { total: 1298, navieras: ["CMA CGM", "Grimaldi"], media_dias: 12 },
      "India": { total: 1042, navieras: ["ONE", "Yang Ming"], media_dias: 25 },
      "Europa Norte": { total: 987, navieras: ["Maersk", "Hapag-Lloyd"], media_dias: 5 },
    },
    por_tipo: {
      "Dry Van 40'": 5820,
      "Dry Van 20'": 3204,
      "High Cube 40'": 1840,
      "Reefer 40'": 1002,
      "Reefer 20'": 312,
      "Open Top": 178,
      "Flat Rack": 92,
      "Tanque ISO": 32,
    }
  },
  clientes: [
    { nombre: "TechExport SL", pais: "España", contenedores: 847, tipo_carga: "Electrónica", facturacion_mes: 284000, naviera_habitual: "Maersk" },
    { nombre: "AgroMediterráneo SA", pais: "España", contenedores: 632, tipo_carga: "Alimentación Fresca", facturacion_mes: 198000, naviera_habitual: "MSC" },
    { nombre: "IndusMaq Corp", pais: "España", contenedores: 521, tipo_carga: "Maquinaria Industrial", facturacion_mes: 340000, naviera_habitual: "CMA CGM" },
    { nombre: "ChemTrade Global", pais: "España", contenedores: 487, tipo_carga: "Productos Químicos", facturacion_mes: 225000, naviera_habitual: "Hapag-Lloyd" },
    { nombre: "FashionLog EU", pais: "Francia", contenedores: 412, tipo_carga: "Textil y Moda", facturacion_mes: 178000, naviera_habitual: "MSC" },
    { nombre: "EnergyParts SA", pais: "España", contenedores: 398, tipo_carga: "Componentes Energéticos", facturacion_mes: 312000, naviera_habitual: "Evergreen" },
    { nombre: "FoodGlobal SL", pais: "España", contenedores: 381, tipo_carga: "Conservas y Bebidas", facturacion_mes: 156000, naviera_habitual: "Maersk" },
    { nombre: "AutoParts Iberia", pais: "España", contenedores: 354, tipo_carga: "Automoción", facturacion_mes: 289000, naviera_habitual: "COSCO" },
  ],
  kpis_mes: {
    facturacion: 4280000,
    facturacion_vs_mes_anterior: "+12.4%",
    contenedores_gestionados: 3847,
    clientes_activos: 214,
    rutas_activas: 47,
    incidencias: 23,
    tasa_puntualidad: "94.7%",
    nps_clientes: 78,
    retraso_medio_dias: 1.8,
  },
  reefer: {
    total_activos: 1314,
    en_transito: 892,
    alertas_temperatura: 3,
    temperatura_media: -18.4,
    por_destino: {
      "Estados Unidos": 312,
      "Europa Norte": 287,
      "Latinoamérica": 198,
      "China": 143,
      "África": 97,
      "Oriente Medio": 277,
    }
  },
  retrasos: {
    maersk: { media_dias: 1.2, casos_mes: 42 },
    msc: { media_dias: 1.8, casos_mes: 67 },
    cma_cgm: { media_dias: 2.1, casos_mes: 89 },
    hapag_lloyd: { media_dias: 1.4, casos_mes: 51 },
    evergreen: { media_dias: 2.8, casos_mes: 34 },
    cosco: { media_dias: 1.6, casos_mes: 28 },
  }
};

// =====================================================
// RESPUESTAS INTELIGENTES DEL BOT
// =====================================================

function generateBotResponse(userMsg) {
  const msg = userMsg.toLowerCase();

  // KPIs globales / resumen
  if (match(msg, ["resumen", "kpi", "situación", "estado general", "cómo estamos", "global"])) {
    return kpiResponse();
  }

  // Contenedores total
  if (match(msg, ["cuántos contenedores", "total contenedores", "contenedores hay", "contenedores tenemos"]) && !matchDest(msg)) {
    return contenedoresTotalResponse();
  }

  // Contenedores por destino: USA
  if (match(msg, ["estados unidos", "usa", "eeuu", "america"])) {
    return contenedoresDestinoResponse("Estados Unidos");
  }

  // Contenedores por destino: China
  if (match(msg, ["china", "extremo oriente", "asia"])) {
    return contenedoresDestinoResponse("China");
  }

  // Contenedores por destino: Latam
  if (match(msg, ["latinoamérica", "latinoamerica", "latam", "sudamérica", "brazil", "brasil", "mexico", "méjico"])) {
    return contenedoresDestinoResponse("Latinoamérica");
  }

  // Contenedores por naviera: Maersk
  if (match(msg, ["maersk"])) {
    return navieroResponse("Maersk");
  }

  // Contenedores por naviera: MSC
  if (match(msg, ["msc"])) {
    return navieroResponse("MSC");
  }

  // Contenedores por naviera: CMA
  if (match(msg, ["cma cgm", "cma"])) {
    return navieroResponse("CMA CGM");
  }

  // Reefer / frigorífico
  if (match(msg, ["reefer", "frigorífico", "temperatura", "refrigerado", "congelado"])) {
    return reeferResponse();
  }

  // Clientes / top clientes
  if (match(msg, ["cliente", "clientes", "top", "mejores", "facturación", "facturacion"])) {
    return clientesResponse();
  }

  // Retrasos
  if (match(msg, ["retraso", "retrasos", "puntualidad", "demora"])) {
    return retrasoResponse();
  }

  // Pendientes de despacho
  if (match(msg, ["pendiente", "despacho", "aduana", "pendientes"])) {
    return despachoResponse();
  }

  // Tipos de contenedor
  if (match(msg, ["tipo", "tipos", "dry", "flat", "open top", "tanque"])) {
    return tiposResponse();
  }

  // Navieras general
  if (match(msg, ["naviera", "navieras", "compañía naviera", "armador"])) {
    return navierasGeneralResponse();
  }

  // Incidencias
  if (match(msg, ["incidencia", "incidencias", "problema", "problemas", "alerta"])) {
    return incidenciasResponse();
  }

  // Saludo
  if (match(msg, ["hola", "buenos", "buenas", "hey", "hello"])) {
    return saludoResponse();
  }

  // Ayuda
  if (match(msg, ["ayuda", "help", "qué puedes", "que puedes", "qué sabes", "opciones"])) {
    return ayudaResponse();
  }

  // Default
  return defaultResponse(userMsg);
}

function match(msg, keywords) {
  return keywords.some(k => msg.includes(k));
}
function matchDest(msg) {
  return ["estados unidos", "china", "europa", "latinoamérica", "india", "africa"].some(k => msg.includes(k));
}

// =====================================================
// RESPUESTAS FORMATEADAS
// =====================================================

function saludoResponse() {
  return `👋 ¡Buenas! Soy tu asistente de logística conectado a Power BI en tiempo real.<br/><br/>
  Puedo consultarte <strong>cualquier dato</strong> de tu operación: contenedores, navieras, clientes, rutas, retrasos, KPIs...<br/><br/>
  Prueba con algo como: <em>"¿Cuántos contenedores hay en Estados Unidos?"</em> o <em>"Dame el top 5 de clientes"</em>`;
}

function ayudaResponse() {
  return `🤖 <strong>Puedo consultarte:</strong><br/><br/>
  📦 <strong>Contenedores:</strong> total, por destino, naviera, tipo<br/>
  🚢 <strong>Navieras:</strong> estado, retrasos, volumen por naviera<br/>
  🌡️ <strong>Reefer:</strong> activos, alertas de temperatura<br/>
  👥 <strong>Clientes:</strong> top clientes, facturación, volumen<br/>
  📊 <strong>KPIs:</strong> resumen mensual, puntualidad, incidencias<br/>
  🛃 <strong>Aduanas:</strong> pendientes de despacho<br/><br/>
  Pregunta en lenguaje natural, como si le preguntaras a una persona.`;
}

function kpiResponse() {
  const k = MOCK_DATA.kpis_mes;
  return `📊 <strong>Resumen de operaciones — Marzo 2025</strong><br/><br/>
  <div class="kpi-grid">
    <div class="kpi-item"><span class="kpi-val">${formatNum(k.facturacion)}€</span><span class="kpi-label">Facturación mensual <span style="color:#4ade80">${k.facturacion_vs_mes_anterior}</span></span></div>
    <div class="kpi-item"><span class="kpi-val">${formatNum(k.contenedores_gestionados)}</span><span class="kpi-label">Contenedores gestionados</span></div>
    <div class="kpi-item"><span class="kpi-val">${k.tasa_puntualidad}</span><span class="kpi-label">Tasa de puntualidad</span></div>
    <div class="kpi-item"><span class="kpi-val">${k.clientes_activos}</span><span class="kpi-label">Clientes activos</span></div>
  </div><br/>
  🚨 <strong>${k.incidencias} incidencias</strong> abiertas este mes · Retraso medio: <strong>${k.retraso_medio_dias} días</strong> · NPS: <strong>${k.nps_clientes}/100</strong>`;
}

function contenedoresTotalResponse() {
  const c = MOCK_DATA.contenedores;
  return `📦 <strong>Estado global de contenedores — Ahora mismo</strong><br/><br/>
  <table class="data-table">
    <tr><th>Estado</th><th>Unidades</th><th>%</th></tr>
    <tr><td>🟢 En tránsito</td><td><strong>${formatNum(c.en_transito)}</strong></td><td>${((c.en_transito/c.total)*100).toFixed(1)}%</td></tr>
    <tr><td>🟡 En puerto</td><td><strong>${formatNum(c.en_puerto)}</strong></td><td>${((c.en_puerto/c.total)*100).toFixed(1)}%</td></tr>
    <tr><td>🔵 Descargando</td><td><strong>${formatNum(c.descargando)}</strong></td><td>${((c.descargando/c.total)*100).toFixed(1)}%</td></tr>
    <tr><td>🔴 Pendiente despacho</td><td><strong>${formatNum(c.pendiente_despacho)}</strong></td><td>${((c.pendiente_despacho/c.total)*100).toFixed(1)}%</td></tr>
    <tr><td><strong>TOTAL</strong></td><td><strong>${formatNum(c.total)}</strong></td><td>100%</td></tr>
  </table>`;
}

function contenedoresDestinoResponse(destino) {
  const d = MOCK_DATA.contenedores.por_destino[destino];
  if (!d) return `No tengo datos para ese destino.`;
  return `🌍 <strong>Contenedores → ${destino}</strong><br/><br/>
  <div class="kpi-grid">
    <div class="kpi-item"><span class="kpi-val">${formatNum(d.total)}</span><span class="kpi-label">Total activos</span></div>
    <div class="kpi-item"><span class="kpi-val">${d.media_dias} días</span><span class="kpi-label">Tránsito medio</span></div>
  </div><br/>
  🚢 <strong>Navieras operando:</strong> ${d.navieras.join(", ")}<br/><br/>
  💡 El ${((d.total/MOCK_DATA.contenedores.total)*100).toFixed(1)}% de toda tu flota va hacia ${destino}.`;
}

function navieroResponse(naviera) {
  const n = MOCK_DATA.contenedores.por_naviera[naviera];
  if (!n) return `No tengo datos de esa naviera.`;
  return `🚢 <strong>${naviera} — Contenedores activos</strong><br/><br/>
  <table class="data-table">
    <tr><th>Detalle</th><th>Unidades</th></tr>
    <tr><td>En tránsito</td><td><strong>${formatNum(n.en_transito)}</strong></td></tr>
    <tr><td>En puerto</td><td><strong>${formatNum(n.en_puerto)}</strong></td></tr>
    <tr><td>Reefer activos</td><td><strong>${formatNum(n.reefer)}</strong></td></tr>
    <tr><td><strong>Total ${naviera}</strong></td><td><strong>${formatNum(n.total)}</strong></td></tr>
  </table><br/>
  📊 ${naviera} gestiona el <strong>${((n.total/MOCK_DATA.contenedores.total)*100).toFixed(1)}%</strong> de tu flota total.`;
}

function reeferResponse() {
  const r = MOCK_DATA.reefer;
  let alert = r.alertas_temperatura > 0
    ? `<br/>🚨 <strong>⚠️ ${r.alertas_temperatura} alertas de temperatura activas</strong> — requieren revisión inmediata.`
    : '<br/>✅ Sin alertas de temperatura activas.';
  return `🌡️ <strong>Contenedores Reefer — Estado actual</strong><br/><br/>
  <div class="kpi-grid">
    <div class="kpi-item"><span class="kpi-val">${formatNum(r.total_activos)}</span><span class="kpi-label">Total reefer activos</span></div>
    <div class="kpi-item"><span class="kpi-val">${r.temperatura_media}°C</span><span class="kpi-label">Temperatura media</span></div>
  </div><br/>
  <strong>Distribución por destino:</strong><br/>
  <table class="data-table">
    ${Object.entries(r.por_destino).map(([d,v]) => `<tr><td>${d}</td><td><strong>${v}</strong></td></tr>`).join('')}
  </table>${alert}`;
}

function clientesResponse() {
  const clientes = MOCK_DATA.clientes.slice(0, 5);
  return `👥 <strong>Top 5 Clientes — Marzo 2025</strong><br/><br/>
  <table class="data-table">
    <tr><th>#</th><th>Cliente</th><th>Contenedores</th><th>Facturación</th></tr>
    ${clientes.map((c, i) => `<tr><td>${i+1}</td><td><strong>${c.nombre}</strong><br/><small style="color:#94a3b8">${c.tipo_carga}</small></td><td>${c.contenedores}</td><td>${formatNum(c.facturacion_mes)}€</td></tr>`).join('')}
  </table><br/>
  📊 Total clientes activos este mes: <strong>${MOCK_DATA.kpis_mes.clientes_activos}</strong>`;
}

function retrasoResponse() {
  const r = MOCK_DATA.retrasos;
  const sorted = Object.entries(r).sort((a,b) => a[1].media_dias - b[1].media_dias);
  return `⏱️ <strong>Análisis de retrasos por naviera — Q1 2025</strong><br/><br/>
  <table class="data-table">
    <tr><th>Naviera</th><th>Retraso medio</th><th>Casos/mes</th></tr>
    ${sorted.map(([nav, d]) => `<tr><td><strong>${nav.toUpperCase()}</strong></td><td>${d.media_dias} días</td><td>${d.casos_mes}</td></tr>`).join('')}
  </table><br/>
  ✅ <strong>Maersk</strong> es la naviera más puntual. ⚠️ <strong>Evergreen</strong> acumula mayor retraso medio.`;
}

function despachoResponse() {
  return `🛃 <strong>Contenedores pendientes de despacho aduanero</strong><br/><br/>
  <div class="kpi-grid">
    <div class="kpi-item"><span class="kpi-val">${MOCK_DATA.contenedores.pendiente_despacho}</span><span class="kpi-label">Pendientes total</span></div>
    <div class="kpi-item"><span class="kpi-val">48h</span><span class="kpi-label">Tiempo medio resolución</span></div>
  </div><br/>
  📋 <strong>Distribución:</strong><br/>
  • Importación España: <strong>312</strong> contenedores<br/>
  • Importación Portugal: <strong>187</strong> contenedores<br/>
  • Regímenes especiales: <strong>89</strong> contenedores<br/>
  • Zona franca: <strong>53</strong> contenedores<br/><br/>
  🚨 <strong>23 expedientes</strong> llevan más de 72h — se recomienda revisión urgente.`;
}

function tiposResponse() {
  const tipos = MOCK_DATA.contenedores.por_tipo;
  return `📦 <strong>Distribución por tipo de contenedor</strong><br/><br/>
  <table class="data-table">
    <tr><th>Tipo</th><th>Unidades</th><th>%</th></tr>
    ${Object.entries(tipos).map(([t,v]) => `<tr><td>${t}</td><td><strong>${formatNum(v)}</strong></td><td>${((v/MOCK_DATA.contenedores.total)*100).toFixed(1)}%</td></tr>`).join('')}
  </table>`;
}

function navierasGeneralResponse() {
  const nav = MOCK_DATA.contenedores.por_naviera;
  return `🚢 <strong>Volumen por naviera — Flota activa</strong><br/><br/>
  <table class="data-table">
    <tr><th>Naviera</th><th>Total</th><th>En tránsito</th><th>Reefer</th></tr>
    ${Object.entries(nav).map(([n,d]) => `<tr><td><strong>${n}</strong></td><td>${formatNum(d.total)}</td><td>${formatNum(d.en_transito)}</td><td>${d.reefer}</td></tr>`).join('')}
  </table><br/>
  📊 Operando con <strong>${Object.keys(nav).length} navieras principales</strong> + 42 navieras secundarias en rutas específicas.`;
}

function incidenciasResponse() {
  return `🚨 <strong>Incidencias activas — Marzo 2025</strong><br/><br/>
  <table class="data-table">
    <tr><th>Tipo</th><th>Casos</th><th>Estado</th></tr>
    <tr><td>Retraso puerto >48h</td><td><strong>8</strong></td><td>🔴 Activo</td></tr>
    <tr><td>Alerta temperatura reefer</td><td><strong>3</strong></td><td>🔴 Urgente</td></tr>
    <tr><td>Documentación incompleta</td><td><strong>6</strong></td><td>🟡 En gestión</td></tr>
    <tr><td>Daño en mercancía</td><td><strong>2</strong></td><td>🔴 Reclamación</td></tr>
    <tr><td>Avería equipo reefer</td><td><strong>1</strong></td><td>🟡 Reparación</td></tr>
    <tr><td>Cambio de ruta forzado</td><td><strong>3</strong></td><td>🟢 Resuelto</td></tr>
    <tr><td><strong>TOTAL</strong></td><td><strong>23</strong></td><td></td></tr>
  </table><br/>
  📞 Las incidencias urgentes han sido notificadas automáticamente al equipo operativo.`;
}

function defaultResponse(msg) {
  const responses = [
    `No tengo esa consulta exacta, pero puedo darte datos sobre <strong>contenedores, navieras, clientes, reefer, retrasos o KPIs</strong>. ¿Cuál de estos te interesa?`,
    `Entiendo lo que buscas. Para darte los datos exactos necesitaría conectarme a <strong>tu dataset de Power BI</strong>. ¿Me puedes concretar más? Por ejemplo: ¿ruta, naviera o tipo de carga?`,
    `Esa consulta la podría procesar con acceso al <strong>dataset real de Power BI</strong>. En este demo tengo datos de ejemplo. Prueba con: "contenedores en Estados Unidos" o "top clientes".`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function formatNum(n) {
  return n.toLocaleString('es-ES');
}

// =====================================================
// INTERFAZ DEL CHAT
// =====================================================

function sendMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  appendMessage(msg, 'user');
  showTyping();
  const delay = 800 + Math.random() * 1000;
  setTimeout(() => {
    hideTyping();
    const response = generateBotResponse(msg);
    appendMessage(response, 'bot');
  }, delay);
}

function sendExampleQuery(chip) {
  const query = chip.textContent;
  document.getElementById('chatInput').value = query;
  // scroll to bot demo
  document.getElementById('bot-demo').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    sendMessage();
  }, 400);
}

function handleEnter(event) {
  if (event.key === 'Enter') sendMessage();
}

function appendMessage(text, type) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = text;
  div.appendChild(avatar);
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  document.getElementById('typingIndicator').style.display = 'flex';
  const container = document.getElementById('chatMessages');
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  document.getElementById('typingIndicator').style.display = 'none';
}
