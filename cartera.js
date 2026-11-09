/* cartera.js — conexión de cartera robusta para attenciona (EIP-1193 / MetaMask).
   NO toca direcciones ni lógica de cobro: solo elige proveedor, pide cuentas,
   asegura la red Base, da mensajes claros de error y avisa de cambios.
   Expone window.Cartera. Sin dependencias. */
(function () {
  "use strict";

  var BASE = {
    chainIdHex: "0x2105",
    params: {
      chainId: "0x2105", chainName: "Base",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://mainnet.base.org"],
      blockExplorerUrls: ["https://basescan.org"]
    }
  };

  // EIP-6963: recoger los proveedores que se anuncien (varias carteras instaladas).
  var anunciados = [];
  function pideAnuncios() {
    try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch (e) {}
  }
  try {
    window.addEventListener("eip6963:announceProvider", function (ev) {
      if (ev && ev.detail && ev.detail.provider && anunciados.indexOf(ev.detail) === -1) {
        anunciados.push(ev.detail);
      }
    });
    pideAnuncios();
  } catch (e) {}

  function esMovil() {
    return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || "");
  }

  // Elige un proveedor inyectado. Si hay varias carteras, prefiere MetaMask.
  function proveedor() {
    if (!anunciados.length) pideAnuncios();
    if (anunciados.length) {
      var mm = anunciados.filter(function (d) {
        var i = d.info || {};
        return /metamask/i.test(String(i.rdns || "") + " " + String(i.name || ""));
      })[0];
      return (mm || anunciados[0]).provider;
    }
    var eth = window.ethereum;
    if (!eth) return null;
    if (eth.providers && eth.providers.length) {
      return eth.providers.filter(function (p) { return p && p.isMetaMask; })[0] || eth.providers[0];
    }
    return eth;
  }

  function hayCartera() { return !!proveedor(); }

  // Enlace para abrir esta dApp dentro de la app de MetaMask (móvil).
  function deeplink(ruta) {
    var r = String(ruta || location.pathname + location.search || "/");
    r = r.replace(/^https?:\/\/[^/]+/i, "");
    if (r.charAt(0) === "/") r = r.slice(1);
    return "https://metamask.app.link/dapp/www.attenciona.com/" + r;
  }

  // Traduce el error de la cartera a algo que una persona entienda.
  function mensajeError(e) {
    if (e && e.sinCartera) return "No veo ninguna cartera en este navegador.";
    var code = e && (e.code != null ? e.code : (e.error && e.error.code));
    if (code === 4001) return "Cancelaste la conexión en tu cartera. Cuando quieras, vuelve a pulsar.";
    if (code === -32002) return "Ya hay una petición abierta en tu cartera: ábrela y acéptala (o recházala) antes de reintentar.";
    if (code === 4902) return "Tu cartera aún no tiene la red Base; acéptala cuando te lo pida.";
    return (e && (e.shortMessage || e.reason || e.message)) || "No se pudo conectar la cartera.";
  }

  // Asegura que el proveedor está en Base. Devuelve true si quedó en Base.
  async function aseguraBase(p) {
    try {
      var cid = await p.request({ method: "eth_chainId" });
      if (cid && String(cid).toLowerCase() === BASE.chainIdHex) return true;
    } catch (e) { /* seguimos e intentamos cambiar */ }
    try {
      await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE.chainIdHex }] });
      return true;
    } catch (e) {
      var sub = e && e.data && e.data.originalError && e.data.originalError.code;
      if ((e && e.code === 4902) || sub === 4902) {
        await p.request({ method: "wallet_addEthereumChain", params: [BASE.params] });
        return true;
      }
      throw e;
    }
  }

  // Conecta: pide cuentas y (salvo opts.red === false) asegura Base.
  // Devuelve { provider, cuenta }. Lanza error con .sinCartera si no hay cartera.
  async function conectar(opts) {
    opts = opts || {};
    var p = proveedor();
    if (!p) { var err = new Error("sin-cartera"); err.sinCartera = true; throw err; }
    var cuentas = await p.request({ method: "eth_requestAccounts" });
    if (opts.red !== false) await aseguraBase(p);
    return { provider: p, cuenta: cuentas && cuentas[0] };
  }

  // Avisa de cambios de cuenta o de red. Por defecto, recarga la página.
  function alCambiar(fn) {
    var p = proveedor();
    if (!p || !p.on) return;
    var cb = fn || function () { location.reload(); };
    try { p.on("accountsChanged", cb); } catch (e) {}
    try { p.on("chainChanged", cb); } catch (e) {}
  }

  window.Cartera = {
    BASE: BASE,
    esMovil: esMovil,
    proveedor: proveedor,
    hayCartera: hayCartera,
    deeplink: deeplink,
    mensajeError: mensajeError,
    aseguraBase: aseguraBase,
    conectar: conectar,
    alCambiar: alCambiar
  };
})();
