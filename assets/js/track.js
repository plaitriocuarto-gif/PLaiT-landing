/**
 * ==========================================================================
 * PLaiT - REGISTRO DE EVENTOS
 * ==========================================================================
 * Manda a una hoja de Google Sheets qué hace cada visitante: si entró, si
 * miró el video y hasta dónde, y si abrió el calendario.
 *
 * QUIÉN ES CADA VISITA
 * El email del Icebreaker agrega ?lead=<código> al link. Ese código identifica
 * a la clínica sin exponer su dirección de correo: sólo tiene sentido cruzado
 * contra la planilla. main.js ya lo lee y lo guarda en sessionStorage, así que
 * acá lo reutilizamos y sobrevive si la persona navega a otra página.
 *
 * NO TOCA main.js
 * El <video> lo crea main.js recién cuando alguien aprieta play, y los eventos
 * de media no burbujean, así que no se pueden escuchar desde document. En vez
 * de meter mano ahí, un MutationObserver espera a que aparezca el <video>
 * dentro de #video-wrapper y le engancha los listeners.
 *
 * SI TRACK_URL ESTÁ VACÍO NO HACE NADA. La página funciona igual.
 * ==========================================================================
 */

(function () {
  'use strict';

  var config = window.PLAIT_CONFIG || {};
  var URL_DESTINO = config.TRACK_URL || '';
  if (!URL_DESTINO) { return; }

  // ---- Quién es esta visita -----------------------------------------------
  var params = new URLSearchParams(window.location.search);
  var guardado = {};
  try {
    var s = sessionStorage.getItem('plait_attribution');
    if (s) { guardado = JSON.parse(s) || {}; }
  } catch (e) {}

  var ID = params.get('lead') || guardado.lead || '';
  var CAMPANIA = params.get('utm_campaign') || guardado.utm_campaign || '';
  var DISPOSITIVO = window.matchMedia('(max-width: 767px)').matches ? 'celular' : 'compu';

  // ---- Envío --------------------------------------------------------------
  // sendBeacon está pensado para sobrevivir al cierre de la pestaña: un fetch
  // normal lo mata el navegador cuando la página se descarga, y justo ahí es
  // donde mandamos el dato más valioso (cuántos segundos vio en total).
  function mandar(evento, seg) {
    var cuerpo = JSON.stringify({
      evento: evento,
      id: ID,
      seg: (typeof seg === 'number' && isFinite(seg)) ? Math.round(seg) : '',
      campania: CAMPANIA,
      disp: DISPOSITIVO
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(URL_DESTINO, new Blob([cuerpo], { type: 'text/plain' }));
        return;
      }
      fetch(URL_DESTINO, { method: 'POST', mode: 'no-cors', body: cuerpo, keepalive: true });
    } catch (e) {}
  }

  // Cada evento se manda una sola vez por visita.
  var yaMandado = {};
  function mandarUnaVez(evento, seg) {
    if (yaMandado[evento]) { return; }
    yaMandado[evento] = true;
    mandar(evento, seg);
  }

  var entroEn = Date.now();

  // ---- 1. Entró -----------------------------------------------------------
  var esGracias = /gracias/i.test(window.location.pathname);
  mandarUnaVez(esGracias ? 'conversion' : 'landing_open');

  // ---- 2. Video -----------------------------------------------------------
  var maxSegundos = 0;

  function engancharVideo(video) {
    mandarUnaVez('video_play');

    // timeupdate dispara ~4 veces por segundo: sería una locura mandar un
    // evento en cada uno. Acumulamos el máximo y sólo avisamos los cuartiles.
    video.addEventListener('timeupdate', function () {
      if (video.currentTime > maxSegundos) { maxSegundos = video.currentTime; }
      var total = video.duration;
      if (!total || !isFinite(total)) { return; }
      var pct = (maxSegundos / total) * 100;
      if (pct >= 25) { mandarUnaVez('video_25', maxSegundos); }
      if (pct >= 50) { mandarUnaVez('video_50', maxSegundos); }
      if (pct >= 75) { mandarUnaVez('video_75', maxSegundos); }
      if (pct >= 98) { mandarUnaVez('video_100', maxSegundos); }
    });

    video.addEventListener('ended', function () {
      mandarUnaVez('video_100', maxSegundos);
    });
  }

  var wrapper = document.getElementById('video-wrapper');
  if (wrapper) {
    var yaEnganchado = false;
    var observer = new MutationObserver(function () {
      if (yaEnganchado) { return; }
      var video = wrapper.querySelector('video');
      if (video) {
        yaEnganchado = true;
        observer.disconnect();
        engancharVideo(video);
      }
    });
    observer.observe(wrapper, { childList: true, subtree: true });
  }

  var facade = document.getElementById('video-facade');
  if (facade) {
    facade.addEventListener('click', function () { mandarUnaVez('video_intent'); });
  }

  // ---- 3. Botones de conversión -------------------------------------------
  document.querySelectorAll('.cta-cal').forEach(function (btn) {
    btn.addEventListener('click', function () { mandarUnaVez('cal_abierto'); });
  });

  document.querySelectorAll('.whatsapp-link').forEach(function (el) {
    el.addEventListener('click', function () { mandarUnaVez('whatsapp'); });
  });

  // ---- 4. Se va: cuánto vio en total --------------------------------------
  // pagehide es más confiable que beforeunload, sobre todo en celulares, donde
  // el navegador puede congelar la pestaña sin avisar.
  // Se mandan dos numeros distintos y no hay que confundirlos:
  //   salida     -> segundos que estuvo EN LA PAGINA (aunque no toque el video)
  //   video_exit -> segundos de VIDEO que llego a ver
  var yaSeDespidio = false;
  function despedida() {
    if (yaSeDespidio) { return; }
    yaSeDespidio = true;
    mandar('salida', (Date.now() - entroEn) / 1000);
    if (maxSegundos > 0) { mandar('video_exit', maxSegundos); }
  }
  window.addEventListener('pagehide', despedida);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { despedida(); }
  });
})();
