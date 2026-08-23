/* ==========================================================================
   splynt.xyz — switch di lingua IT/EN.

   Come funziona: l'italiano è scritto direttamente nell'HTML (quindi la pagina
   funziona anche senza JS), l'inglese arriva da un dizionario che ogni pagina
   passa a SplyntLang.apply({...}).

   Nel markup:
     <h1 data-i18n="hero.title">Testo italiano</h1>
     <input data-i18n-attr="placeholder:form.city">
     <div data-lang-switch></div>          ← dove compare il selettore IT/EN

   Nel JS di un tool, per le stringhe generate a runtime:
     SplyntLang.t("plan.front", "🔆 Fronte (pancia e viso)")

   La lingua si sceglie così: ?lang=it|en nell'URL → scelta salvata →
   lingua del browser (italiano solo se il browser è italiano) → inglese.
   ========================================================================== */

(function () {
  "use strict";

  var STORE = "splynt.lang";
  var root = document.documentElement;

  function pick() {
    var q = (location.search.match(/[?&]lang=(it|en)(&|$)/) || [])[1];
    if (q) {
      try { localStorage.setItem(STORE, q); } catch (e) { /* modalità privata */ }
      return q;
    }
    var saved = null;
    try { saved = localStorage.getItem(STORE); } catch (e) { /* idem */ }
    if (saved === "it" || saved === "en") return saved;
    var nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
    return nav.indexOf("it") === 0 ? "it" : "en";
  }

  var lang = pick();
  var dict = {};

  root.setAttribute("data-lang", lang);
  root.setAttribute("lang", lang);

  /* In inglese il contenuto resta nascosto finché non è tradotto: evita il
     lampo di italiano. La rete non risponde? Dopo 1,2s si mostra comunque. */
  if (lang === "en") {
    root.className += " i18n-pending";
    setTimeout(reveal, 1200);
  }

  function reveal() {
    root.className = root.className.replace(/\s*i18n-pending\b/, "");
  }

  function translate() {
    if (lang !== "en") return;

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var val = dict[nodes[i].getAttribute("data-i18n")];
      if (val != null) nodes[i].innerHTML = val;
    }

    /* data-i18n-attr="placeholder:form.city, aria-label:form.cityAria" */
    var withAttrs = document.querySelectorAll("[data-i18n-attr]");
    for (var j = 0; j < withAttrs.length; j++) {
      var specs = withAttrs[j].getAttribute("data-i18n-attr").split(",");
      for (var k = 0; k < specs.length; k++) {
        var parts = specs[k].split(":");
        if (parts.length < 2) continue;
        var v = dict[parts[1].trim()];
        if (v != null) withAttrs[j].setAttribute(parts[0].trim(), v);
      }
    }

    if (dict["meta.title"]) document.title = dict["meta.title"];
    var desc = document.querySelector('meta[name="description"]');
    if (desc && dict["meta.desc"]) desc.setAttribute("content", dict["meta.desc"]);
  }

  function mountSwitch() {
    var host = document.querySelector("[data-lang-switch]");
    if (!host) return;
    host.innerHTML = "";
    host.className = (host.className ? host.className + " " : "") + "lang-switch";
    host.setAttribute("role", "group");
    host.setAttribute("aria-label", lang === "en" ? "Language" : "Lingua");

    ["it", "en"].forEach(function (code) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "lang-btn";
      b.lang = code;
      b.textContent = code.toUpperCase();
      b.setAttribute("aria-pressed", String(code === lang));
      b.addEventListener("click", function () { if (code !== lang) go(code); });
      host.appendChild(b);
    });
  }

  function go(code) {
    try { localStorage.setItem(STORE, code); } catch (e) { /* idem */ }
    /* Ricarico con ?lang=: così anche i contenuti generati da JS ripartono
       nella lingua giusta, senza doverli ri-tradurre a mano. */
    location.href = location.pathname + "?lang=" + code + location.hash;
  }

  function run() {
    translate();
    mountSwitch();
    reveal();
  }

  window.SplyntLang = {
    lang: lang,
    t: function (key, fallback) {
      return (lang === "en" && dict[key] != null) ? dict[key] : fallback;
    },
    /* Va chiamata alla FINE del body, prima dello script del tool: traduce
       subito il markup già presente, così il codice che scrive contenuti
       dinamici (e usa t()) gira dopo e non si vede sovrascrivere il risultato. */
    apply: function (d) {
      dict = d || {};
      if (document.body) run();
      else document.addEventListener("DOMContentLoaded", run);
    }
  };
})();
