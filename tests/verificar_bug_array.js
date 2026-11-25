#!/usr/bin/env node
/**
 * Verifica el bug del array huérfano en teamilyExecutiveEngine.js.
 *
 * Reproduce la secuencia real de sendDirectChatMessage():
 *   1. history = getAgentChatHistory(agent)      -> ref A
 *   2. history.push({sender:'user'})             -> push en A
 *   3. renderDirectChatContent()                 -> vuelve a llamar getAgentChatHistory()
 *   4. history.push({sender:'agent', text})      -> push en A
 *   5. finally: render desde this.directChatHistory
 *
 * Con el bug (filter reasignando), el paso 3 deja A huérfano y la respuesta
 * del agente se pierde. Con splice in-place, A sigue siendo el array vivo.
 *
 * Uso: node tests/verificar_bug_array.js
 */
const fs = require('fs');
const path = require('path');

const JS = path.join(__dirname, '..', 'static', 'js', 'teamilyExecutiveEngine.js');
const src = fs.readFileSync(JS, 'utf8');

// Extraer el cuerpo real de getAgentChatHistory del archivo
const inicio = src.indexOf('getAgentChatHistory(agent) {');
if (inicio < 0) { console.error('❌ No se encontró getAgentChatHistory'); process.exit(1); }
const fin = src.indexOf('\n  renderDirectChatContent(', inicio);
const cuerpo = src.slice(inicio, fin);

console.log('='.repeat(70));
console.log('VERIFICACIÓN DEL BUG DEL ARRAY HUÉRFANO');
console.log('='.repeat(70));

// 1. ¿Sigue existiendo la reasignación con filter() en CÓDIGO EJECUTABLE?
//    Se descartan las líneas de comentario: el bloque documenta el bug
//    histórico con la línea original, y eso no es código que se ejecute.
const cuerpoSinComentarios = cuerpo
  .split('\n')
  .filter(l => {
    const t = l.trim();
    return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
  })
  .join('\n');
const reasigna = /this\.directChatHistory\[targetKey\]\s*=\s*history\.filter/.test(cuerpoSinComentarios);
console.log(`\n[1] ¿getAgentChatHistory reasigna con filter()?  ${reasigna ? '❌ SÍ (bug)' : '✅ NO (corregido)'}`);

// 2. ¿Usa splice in-place?
const usaSplice = /history\.splice\(/.test(cuerpo);
console.log(`[2] ¿Purga en sitio con splice()?                ${usaSplice ? '✅ SÍ' : '❌ NO'}`);

// 3. Simulación funcional de la secuencia real
function simular(conBug) {
  const engine = { directChatHistory: {} };
  const agent = { id: 'mike', teamlyUserId: '9000215760376233' };
  const key = agent.teamlyUserId;

  engine.directChatHistory[key] = [
    { sender: 'agent', text: 'Hola, soy Mike' },
  ];

  // getAgentChatHistory (versión bajo prueba)
  function getHistory() {
    const history = engine.directChatHistory[key];
    if (conBug) {
      // BUG: filter crea un array NUEVO y lo asigna
      engine.directChatHistory[key] = history.filter(m => m && m.text);
    } else {
      // CORREGIDO: purga en sitio
      for (let i = history.length - 1; i >= 0; i--) {
        if (!history[i] || !history[i].text) history.splice(i, 1);
      }
    }
    return engine.directChatHistory[key];
  }

  // Paso 1: el llamador toma la referencia
  const history = getHistory();
  // Paso 2: push del mensaje del usuario
  history.push({ sender: 'user', text: 'Hola Mike' });
  // Paso 3: render vuelve a llamar getAgentChatHistory (reasigna si hay bug)
  getHistory();
  // Paso 4: push de la respuesta del agente en la referencia vieja
  history.push({ sender: 'agent', text: 'RESPUESTA DE MIKE' });
  // Paso 5: el finally pinta desde directChatHistory
  const pintado = engine.directChatHistory[key];
  return {
    guardados: pintado.length,
    apareceRespuesta: pintado.some(m => m.text === 'RESPUESTA DE MIKE'),
    mensajes: pintado.map(m => `${m.sender}: ${m.text}`),
  };
}

const conBug = simular(true);
const corregido = simular(false);

console.log('\n[3] Simulación CON el bug (filter reasignando):');
console.log(`    mensajes guardados: ${conBug.guardados}`);
conBug.mensajes.forEach(m => console.log(`      - ${m}`));
console.log(`    ¿Aparece la respuesta del agente? ${conBug.apareceRespuesta ? 'SÍ' : 'NO — SE PERDIÓ'}`);

console.log('\n[4] Simulación CON la corrección (splice in-place):');
console.log(`    mensajes guardados: ${corregido.guardados}`);
corregido.mensajes.forEach(m => console.log(`      - ${m}`));
console.log(`    ¿Aparece la respuesta del agente? ${corregido.apareceRespuesta ? 'SÍ ✅' : 'NO ❌'}`);

const ok = !reasigna && usaSplice && corregido.apareceRespuesta && !conBug.apareceRespuesta;
console.log('\n' + '='.repeat(70));
console.log(ok
  ? 'RESULTADO: ✅ El bug está corregido y la respuesta se conserva.'
  : 'RESULTADO: ❌ Revisar — el comportamiento no es el esperado.');
console.log('='.repeat(70));
process.exit(ok ? 0 : 1);
