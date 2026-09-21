/**
 * ==========================================================================
 * PLaiT - DEMO EN VIVO
 * ==========================================================================
 * El chat de la sección #probar. Le habla al workflow "Demo chat - Landing
 * PLaiT" del n8n del VPS (config.js -> DEMO_CHAT_URL), que contesta con
 * Claude haciendo de recepcionista de un consultorio de ejemplo.
 *
 * NO TOCA main.js NI track.js
 * Los hitos de la demo se avisan con un evento del navegador, "plait:demo",
 * y track.js es quien decide si los anota en la planilla.
 *
 * QUIÉN ES CADA CHARLA
 * El sessionId empieza con el código ?lead= del email (si vino de ahí). Así,
 * en las ejecuciones de n8n se ve qué prospecto probó la demo y qué preguntó,
 * sin que viaje nunca su dirección de correo.
 * ==========================================================================
 */

(function () {
  'use strict';

  var config = window.PLAIT_CONFIG || {};
  var URL_CHAT = config.DEMO_CHAT_URL || '';

  var form = document.getElementById('vivo-form');
  var input = document.getElementById('vivo-input');
  var enviar = document.getElementById('vivo-enviar');
  var mensajes = document.getElementById('vivo-mensajes');
  var estado = document.getElementById('vivo-estado');
  var seccion = document.getElementById('probar');
  if (!form || !input || !mensajes || !URL_CHAT) { return; }

  // ---- Sesión -------------------------------------------------------------
  var lead = '';
  try {
    var attr = JSON.parse(sessionStorage.getItem('plait_attribution') || '{}');
    lead = (attr && attr.lead) || '';
  } catch (e) {}
  lead = String(lead).replace(/[^a-z0-9]/gi, '').slice(0, 12);

  var sessionId = '';
  try { sessionId = sessionStorage.getItem('plait_demo_sid') || ''; } catch (e) {}
  if (!sessionId) {
    sessionId = (lead || 'web') + '-' + Math.random().toString(36).slice(2, 10);
    try { sessionStorage.setItem('plait_demo_sid', sessionId); } catch (e) {}
  }

  // ---- Hitos para el registro de eventos ----------------------------------
  function avisar(evento) {
    try {
      window.dispatchEvent(new CustomEvent('plait:demo', { detail: { evento: evento } }));
    } catch (e) {}
  }

  // ---- Pintar mensajes ----------------------------------------------------
  // Siempre con textContent: la respuesta viene de un modelo y nunca se
  // interpreta como HTML.
  function agregar(texto, quien) {
    var burbuja = document.createElement('div');
    burbuja.className = 'vivo-msg ' + (quien === 'yo' ? 'vivo-yo' : 'vivo-bot');
    String(texto).split(/\n{2,}/).forEach(function (parrafo) {
      var p = document.createElement('p');
      p.textContent = parrafo.trim();
      if (p.textContent) { burbuja.appendChild(p); }
    });
    mensajes.appendChild(burbuja);
    mensajes.scrollTop = mensajes.scrollHeight;
    return burbuja;
  }

  function escribiendo(activo) {
    var previo = document.getElementById('vivo-escribiendo');
    if (previo) { previo.parentNode.removeChild(previo); }
    if (estado) { estado.textContent = activo ? 'escribiendo…' : 'en línea'; }
    if (activo) {
      var b = document.createElement('div');
      b.className = 'vivo-msg vivo-bot vivo-puntos';
      b.id = 'vivo-escribiendo';
      b.setAttribute('aria-label', 'El asistente está escribiendo');
      b.innerHTML = '<span></span><span></span><span></span>';
      mensajes.appendChild(b);
      mensajes.scrollTop = mensajes.scrollHeight;
    }
  }

  // ---- Enviar -------------------------------------------------------------
  var enviados = 0;
  var ocupado = false;

  function mandar(texto) {
    texto = String(texto || '').trim().slice(0, 500);
    if (!texto || ocupado) { return; }
    ocupado = true;
    input.value = '';
    input.disabled = true;
    if (enviar) { enviar.disabled = true; }

    agregar(texto, 'yo');
    enviados += 1;
    if (enviados === 1) { avisar('demo_chat'); }
    if (enviados === 5) { avisar('demo_5'); }
    escribiendo(true);

    var control = ('AbortController' in window) ? new AbortController() : null;
    var corte = setTimeout(function () { if (control) { control.abort(); } }, 45000);

    fetch(URL_CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sendMessage', sessionId: sessionId, chatInput: texto }),
      signal: control ? control.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (datos) {
        var respuesta = (datos && (datos.output || datos.text)) || '';
        if (!respuesta) { throw new Error('vacio'); }
        escribiendo(false);
        agregar(respuesta, 'bot');
        if (/esto es una demo/i.test(respuesta)) { avisar('demo_turno'); }
      })
      .catch(function () {
        escribiendo(false);
        agregar('Se cortó la conexión. Probá mandar el mensaje de nuevo.', 'bot');
      })
      .then(function () {
        clearTimeout(corte);
        ocupado = false;
        input.disabled = false;
        if (enviar) { enviar.disabled = false; }
        // En celular no se enfoca: abriría el teclado y taparía la respuesta.
        if (!window.matchMedia('(max-width: 767px)').matches) { input.focus(); }
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    mandar(input.value);
  });

  // ---- "Quiero probarlo" --------------------------------------------------
  // El ancla #probar deja el título arriba y el campo de texto afuera de la
  // pantalla. Se lleva la vista al chat entero y a la recomendación de qué
  // preguntarle, que va justo debajo.
  var caja = document.querySelector('.vivo-recomendacion') || document.querySelector('.vivo-chat');
  document.querySelectorAll('.cta-probar').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (!caja) { return; }
      e.preventDefault();
      caja.scrollIntoView({ behavior: 'smooth', block: 'end' });
      if (!window.matchMedia('(max-width: 767px)').matches) {
        setTimeout(function () { input.focus({ preventScroll: true }); }, 600);
      }
    });
  });

  // ---- Barra fija del celular ---------------------------------------------
  // Mientras el chat está en pantalla, la barra "Agendar" de abajo taparía el
  // campo de texto. Se esconde con una clase en <body>, sin tocar main.js.
  if (seccion && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      document.body.classList.toggle('chat-en-vista', entradas[0].isIntersecting);
    }, { threshold: 0 }).observe(seccion);
  }
})();
