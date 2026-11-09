/* Imagen única attenciona: lo inyecta server.js en todas las páginas menos la portada.
   1) Pone el mismo fondo que la portada (cerebro 3D + viñeta + grano).
   2) Recorre la página y convierte lo que quede del diseño antiguo (fondos claros, textos oscuros,
      botones naranjas/azules, bloques opacos) en el lenguaje de la portada: cristal oscuro, texto claro, oro. */
(function () {
  var GLASS = 'rgba(12,22,40,.55)', FG = '#eef2f6', MUTED = '#8d99a6', GOLD = '#c9973e', NAVY = '#060b14';

  function rgba(s) {
    var m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function lum(c) { return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255; }
  function sat(c) { var mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b); return mx ? (mx - mn) / mx : 0; }
  function esBoton(el) {
    var t = el.tagName;
    return t === 'BUTTON' || (t === 'A' && /btn|cta|button|boton|pill/i.test(el.className + '')) ||
      (t === 'INPUT' && /submit|button/.test(el.type));
  }

  function arreglar(el) {
    if (el.__an || el.closest('.an-top,.an-fx,svg,canvas,video,img,picture,iframe')) return;
    el.__an = 1;
    var cs = getComputedStyle(el);
    var bg = rgba(cs.backgroundColor), fg = rgba(cs.color), bi = cs.backgroundImage;

    // Degradados de fondo: si son claros, fuera; si son oscuros y ocupan mucho, también (manda el 3D).
    if (bi && bi.indexOf('gradient') !== -1) {
      var cols = bi.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [], claro = 0;
      var vivo = 0;
      cols.forEach(function (c) { var x = rgba(c) || hex(c); if (x && lum(x) > 0.6) claro++; if (x && sat(x) > 0.35 && !dorado(x)) vivo++; });
      if (vivo && esBoton(el)) {
        el.style.setProperty('background', GOLD, 'important'); el.style.setProperty('color', NAVY, 'important'); bg = null; fg = null;
      } else if (claro || vivo || el.offsetWidth * el.offsetHeight > 120000) {
        el.style.setProperty('background-image', 'none', 'important');
        el.style.setProperty('background-color', GLASS, 'important');
        bg = null;
      }
    }

    if (bg && bg.a > 0.05) {
      if ((esBoton(el) || el.offsetWidth * el.offsetHeight < 60000 && /^(A|BUTTON)$/.test(el.tagName)) && sat(bg) > 0.25) {
        // Botones de color → píldora oro de la portada
        el.style.setProperty('background', GOLD, 'important');
        el.style.setProperty('color', NAVY, 'important');
        el.style.setProperty('border-color', GOLD, 'important');
        fg = null;
      } else if (lum(bg) > 0.55 || (sat(bg) > 0.35 && !dorado(bg) && bg.a > 0.5 && el.offsetWidth * el.offsetHeight > 15000) || (bg.a > 0.85 && el.offsetWidth * el.offsetHeight > 40000 && el !== document.body)) {
        // Botón principal blanco → píldora oro; fondos claros o bloques opacos → cristal oscuro
        if (lum(bg) > 0.8 && /^(A|BUTTON)$/.test(el.tagName) && el.offsetWidth * el.offsetHeight < 60000) {
          el.style.setProperty('background', GOLD, 'important'); el.style.setProperty('color', NAVY, 'important');
          el.style.setProperty('border-color', GOLD, 'important'); return;
        }
        el.style.setProperty('background-color', esBoton(el) ? 'rgba(255,255,255,.04)' : GLASS, 'important');
        el.style.setProperty('backdrop-filter', 'blur(16px) saturate(1.2)');
        el.style.setProperty('-webkit-backdrop-filter', 'blur(16px) saturate(1.2)');
        if (parseFloat(cs.borderTopWidth) > 0) el.style.setProperty('border-color', 'rgba(255,255,255,.09)', 'important');
      }
    }
    // Texto oscuro sobre lo que ahora es oscuro → claro (los acentos de color pasan a oro)
    if (fg && lum(fg) < 0.45) {
      el.style.setProperty('color', sat(fg) > 0.45 ? GOLD : (/^(P|LI|SMALL|SPAN|TD|DD)$/.test(el.tagName) && lum(fg) > 0.25 ? MUTED : FG), 'important');
    }
    if (fg && sat(fg) > 0.5 && fg.r > fg.b && lum(fg) >= 0.45 && !esBoton(el)) {
      el.style.setProperty('color', GOLD, 'important'); // naranjas de Fase 2 → oro
    }
    var bc = rgba(cs.borderTopColor);
    if (bc && parseFloat(cs.borderTopWidth) > 0 && lum(bc) > 0.75) el.style.setProperty('border-color', 'rgba(255,255,255,.09)', 'important');
    if (cs.boxShadow && cs.boxShadow !== 'none') el.style.setProperty('box-shadow', '0 10px 30px rgba(0,0,0,.35)', 'important');
  }
  function dorado(c) { return c.r > c.b + 40 && c.g > c.b && c.r - c.g < 90; } // oros/ámbar: se respetan
  function hex(h) {
    h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16), a: 1 };
  }
  function pasar(raiz) {
    var els = (raiz || document.body).querySelectorAll('*');
    for (var i = 0; i < els.length; i++) arreglar(els[i]);
  }

  function fondo() {
    if (document.getElementById('an-gl')) return;
    var fx = document.createElement('div'); fx.className = 'an-fx'; fx.setAttribute('aria-hidden', 'true'); fx.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none';
    fx.innerHTML = '<canvas id="an-gl" style="position:absolute;inset:0;width:100vw;height:100vh;display:block"></canvas><div class="an-vig"></div><div class="an-grain"></div>';
    document.body.insertBefore(fx, document.body.firstChild);
    var s = document.createElement('script'); s.src = '/vendor/three.min.js';
    s.onload = function () { var f = document.createElement('script'); f.src = '/fondo-3d.js?v=1793466402'; document.body.appendChild(f); };
    document.body.appendChild(s);
  }

  function iniciar() {
    fondo(); pasar();
    var cola = [], t = 0;
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) cola.push(n); }); });
      clearTimeout(t); t = setTimeout(function () {
        cola.splice(0).forEach(function (n) { arreglar(n); if (n.querySelectorAll) pasar(n); });
      }, 120);
    }).observe(document.body, { childList: true, subtree: true });
    document.documentElement.classList.add('an-listo');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
