// pro.js — versión para la vitrina pública (attenciona.com en GitHub Pages).
// La web estática se ve SEGURA para todo el mundo (GitHub, IP no bloqueada).
// La COMPRA en cripto (NOWPayments / ATTA) la ejecuta el servidor del holding en
// www.attenciona.com (el móvil). Por eso, al pulsar "comprar/Pro", enviamos al
// comprador a la MISMA página en www, donde el pago cripto funciona igual que siempre.
// Este archivo NO contiene claves: solo redirige.
(function () {
  var WWW = "https://www.attenciona.com";
  function irATienda() {
    // misma ruta y parámetros, pero en el servidor que cobra (móvil)
    try {
      location.href = WWW + location.pathname + location.search + location.hash;
    } catch (e) {
      location.href = WWW + "/";
    }
  }
  // Contrato que usan los 122 productos: ProWidget.checkout(product, amount)
  window.ProWidget = {
    checkout: function (product, amount) {
      irATienda();
      return Promise.resolve(undefined);
    },
  };
})();
