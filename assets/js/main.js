(function () {
  'use strict';

  var config = window.PLAIT_CONFIG || {};

  // 1. Atribución y parámetros URL
  var params = new URLSearchParams(window.location.search);
  var rawN = params.get('n');
  var rawLead = params.get('lead');
  var utms = ['source', 'medium', 'campaign', 'term', 'content'];

  var attrKey = 'plait_attribution';
  var stored = {};
  try {
    var s = sessionStorage.getItem(attrKey);
    if (s) stored = JSON.parse(s);
  } catch (e) {}

  var attr = {
    n: rawN || stored.n || '',
    lead: rawLead || stored.lead || ''
  };

  utms.forEach(function (u) {
    attr['utm_' + u] = params.get('utm_' + u) || stored['utm_' + u] || '';
  });

  try {
    sessionStorage.setItem(attrKey, JSON.stringify(attr));
  } catch (e) {}

  // 2. Chip de personalización condicional (?n=)
  var name = (rawN || '').trim();
  if (name.length > 0 && name.length <= 40 && /^[a-zA-Z0-9\s.\-áéíóúÁÉÍÓÚñÑüÜ]+$/.test(name)) {
    var heroHeader = document.getElementById('hero-header-container');
    if (heroHeader) {
      var chip = document.createElement('div');
      chip.className = 'hero-chip';
      chip.id = 'hero-chip';
      chip.textContent = 'Preparado para ' + name;
      heroHeader.insertBefore(chip, heroHeader.firstChild);
    }
  }

  // 3. Datos que se le pasan a Cal.com (atribución del email en frío)
  var calLink = config.CAL_LINK || '';
  var calConfig = { layout: 'month_view' };

  utms.forEach(function (u) {
    var key = 'utm_' + u;
    if (attr[key]) calConfig[key] = attr[key];
  });
  if (attr.lead) calConfig.lead = attr.lead;

  // 4. Enlaces externos desde config.js
  document.querySelectorAll('.whatsapp-link').forEach(function (el) {
    el.href = config.WHATSAPP_URL || '#';
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  });

  document.querySelectorAll('.instagram-link').forEach(function (el) {
    el.href = config.INSTAGRAM_URL || '#';
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  });

  // 5. Fachada de video click-to-play
  var facade = document.getElementById('video-facade');
  var wrapper = document.getElementById('video-wrapper');

  // En celulares se usa la version vertical (4:5) si existe; si no, la horizontal.
  function startVideo() {
    var esCelular = window.matchMedia('(max-width: 767px)').matches;
    var usaVertical = esCelular && !!config.VIDEO_VERTICAL;
    var src = usaVertical ? config.VIDEO_VERTICAL : config.VIDEO_HORIZONTAL;
    if (!wrapper || !src) return;
    var video = document.createElement('video');
    video.className = 'video-player';
    // La misma portada que la fachada, para que no haya un cuadro negro mientras carga.
    video.poster = usaVertical
      ? 'assets/images/video-poster-vertical.webp'
      : 'assets/images/video-poster-horizontal.webp';
    video.preload = 'auto';
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    wrapper.innerHTML = '';
    wrapper.appendChild(video);
    var intento = video.play();
    if (intento && intento.catch) intento.catch(function () {});
  }

  if (facade) {
    facade.addEventListener('click', startVideo);
    facade.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startVideo();
      }
    });
  }

  // 6. Carga diferida de Cal.com
  var CAL_NS = 'demo';
  var calBooted = false;

  // Cola oficial de Cal.com. Permite invocar Cal(...) antes de que embed.js
  // termine de cargar: las llamadas se encolan y se ejecutan al cargar, así
  // que no hacen falta callbacks de onload.
  function bootCal() {
    if (calBooted || !calLink) return;
    calBooted = true;

    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal;
        var ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement('script')).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          var ns = ar[1];
          api.q = api.q || [];
          if (typeof ns === 'string') {
            cal.ns[ns] = cal.ns[ns] || api;
            p(cal.ns[ns], ar);
            p(cal, ['initNamespace', ns]);
          } else {
            p(cal, ar);
          }
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');

    window.Cal('init', CAL_NS, { origin: 'https://app.cal.com' });
    // theme fijo en 'dark': la sección de cierre es oscura y, sin esto, el
    // embed copia el tema del navegador del visitante y aparece en blanco.
    window.Cal.ns[CAL_NS]('ui', {
      hideEventTypeDetails: false,
      layout: 'month_view',
      theme: 'dark'
    });
  }

  function showInlineCal() {
    if (!calLink) return;
    bootCal();
    var c = document.getElementById('cal-inline');
    if (!c || c.getAttribute('data-cal-ready') === '1') return;
    c.setAttribute('data-cal-ready', '1');
    // Cuando el calendario termina de cargar, la caja suelta la altura
    // reservada y se ajusta a lo que mide el calendario de verdad.
    window.Cal.ns[CAL_NS]('on', {
      action: 'linkReady',
      callback: function () {
        var box = document.getElementById('cal-embed-container');
        if (box) box.classList.add('is-loaded');
      }
    });
    window.Cal.ns[CAL_NS]('inline', {
      elementOrSelector: '#cal-inline',
      calLink: calLink,
      config: calConfig
    });
  }

  function openCalPopup() {
    if (!calLink) return;
    bootCal();
    window.Cal.ns[CAL_NS]('modal', {
      calLink: calLink,
      config: calConfig
    });
  }

  var cierreSection = document.getElementById('agendar');
  if (cierreSection && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        showInlineCal();
        obs.disconnect();
      }
    }, { rootMargin: '200px' });
    obs.observe(cierreSection);
  } else {
    window.addEventListener('scroll', function onScroll() {
      showInlineCal();
      window.removeEventListener('scroll', onScroll);
    }, { passive: true });
  }

  document.querySelectorAll('.cta-cal').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href && href.indexOf('#agendar') !== -1) {
        var el = document.getElementById('agendar');
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth' });
          showInlineCal();
        }
      } else {
        e.preventDefault();
        openCalPopup();
      }
    });
  });

  // 7. Acordeón FAQ
  document.querySelectorAll('.faq-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isExp = this.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(this.getAttribute('aria-controls'));
      if (!panel) return;
      this.setAttribute('aria-expanded', isExp ? 'false' : 'true');
      panel.hidden = isExp;
    });
  });

  // 8. Barra sticky móvil
  var stickyBar = document.getElementById('mobile-sticky-bar');
  var heroCta = document.querySelector('.hero-cta-group');
  var calContainer = document.getElementById('cal-embed-container');

  if (stickyBar && heroCta && 'IntersectionObserver' in window) {
    var heroPassed = false;
    var calVisible = false;

    function checkSticky() {
      if (heroPassed && !calVisible) {
        stickyBar.classList.add('is-visible');
      } else {
        stickyBar.classList.remove('is-visible');
      }
    }

    var hObs = new IntersectionObserver(function (entries) {
      var r = entries[0].boundingClientRect;
      heroPassed = r.bottom < 0 || !entries[0].isIntersecting;
      checkSticky();
    }, { threshold: 0 });
    hObs.observe(heroCta);

    if (calContainer) {
      var cObs = new IntersectionObserver(function (entries) {
        calVisible = entries[0].isIntersecting;
        checkSticky();
      }, { threshold: 0.1 });
      cObs.observe(calContainer);
    }
  }
})();
