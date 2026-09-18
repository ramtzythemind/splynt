/* ==========================================================================
   L'UNICO FILE DA TOCCARE PER AGGIUNGERE UN TOOL.
   Aggiungi un oggetto all'array TOOLS: la home si aggiorna da sola.

   Campi:
     name    (string)  nome del tool
     icon    (string)  emoji
     desc    (string)  una riga di descrizione, in italiano
     descEn  (string)  la stessa riga in inglese (per lo switch di lingua)
     href    (string)  cartella del tool, es. "/nomeTool/"
     status  (string)  "live" (cliccabile) | "soon" (placeholder non cliccabile)
     tag     (string)  opzionale, etichetta accanto al nome ("gratis", "beta"…)
     tagEn   (string)  opzionale, la stessa etichetta in inglese
   ========================================================================== */

const TOOLS = [
  {
    name: "SunHonest",
    icon: "☀️",
    desc: "Indice UV in tempo reale, quanto puoi stare al sole senza scottarti e il piano di rotazione fronte/retro.",
    descEn: "Live UV index, how long you can stay in the sun without burning, and a front/back rotation plan.",
    href: "/sunhonest/",
    status: "live",
    tag: "gratis",
    tagEn: "free",
  },
  {
    name: "RiseFree",
    icon: "🌙",
    desc: "A che ora andare a letto o puntare la sveglia per svegliarti a fine ciclo, e il piano di sonno ideale costruito sulle tue abitudini.",
    descEn: "When to go to bed, or when to set your alarm, so you wake up between sleep cycles, plus an ideal sleep schedule built on your habits.",
    href: "/risefree/",
    status: "live",
    tag: "gratis",
    tagEn: "free",
  },
  {
    name: "FastHonest",
    icon: "🍽️",
    desc: "Il timer del digiuno intermittente: quanto manca, a che ora puoi mangiare e cosa succede davvero ora per ora.",
    descEn: "The intermittent fasting timer: how long is left, when you can eat, and what actually happens hour by hour.",
    href: "/fasthonest/",
    status: "live",
    tag: "gratis",
    tagEn: "free",
  },
  {
    name: "ClaimFree",
    icon: "✈️",
    desc: "Volo in ritardo o cancellato: quanto ti devono per il Regolamento UE 261, e la lettera di reclamo già scritta.",
    descEn: "Delayed or cancelled flight: what EU Regulation 261 owes you, plus the claim letter already written.",
    href: "/claimfree/",
    status: "live",
    tag: "fino a 600 €",
    tagEn: "up to €600",
  },

  // Esempio di tool annunciato ma non ancora online:
  // {
  //   name: "NomeTool",
  //   icon: "🧭",
  //   desc: "Una riga che spiega il problema che risolve.",
  //   descEn: "One line explaining the problem it solves.",
  //   href: "/nometool/",
  //   status: "soon",
  // },
];

/* --------------------------------------------------------------------------
   Da qui in giù non serve toccare niente: è solo il render delle card.
   -------------------------------------------------------------------------- */

(function renderTools() {
  const grid = document.querySelector("[data-tool-grid]");
  if (!grid) return;

  /* Se i18n.js non è caricato, resta tutto in italiano. */
  const T = (window.SplyntLang && window.SplyntLang.t)
    ? window.SplyntLang.t
    : (key, fallback) => fallback;
  const isEn = !!(window.SplyntLang && window.SplyntLang.lang === "en");

  const counter = document.querySelector("[data-tool-count]");
  const live = TOOLS.filter((t) => t.status !== "soon");

  if (counter) {
    counter.textContent = isEn
      ? (live.length === 1 ? "1 tool live" : `${live.length} tools live`)
      : (live.length === 1 ? "1 tool online" : `${live.length} tool online`);
  }

  if (!TOOLS.length) {
    const empty = T("tools.empty", "Il primo tool sta arrivando. Torna tra poco.");
    grid.innerHTML = `<li><p class="tool-empty">${empty}</p></li>`;
    return;
  }

  grid.innerHTML = "";

  for (const tool of TOOLS) {
    const soon = tool.status === "soon";
    const item = document.createElement("li");
    const card = document.createElement(soon ? "div" : "a");

    card.className = "tool-card";
    card.dataset.status = soon ? "soon" : "live";
    if (!soon) card.href = tool.href;

    const icon = document.createElement("span");
    icon.className = "tool-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = tool.icon || "🧰";

    const title = document.createElement("h3");
    title.className = "tool-title";
    title.append(document.createTextNode(tool.name));

    const soonLabel = T("tools.soon", "presto");
    const label = soon ? soonLabel : (isEn && tool.tagEn ? tool.tagEn : tool.tag);
    if (label) {
      const badge = document.createElement("span");
      badge.className = "badge" + (soon ? " badge--soon" : "");
      badge.textContent = label;
      title.append(badge);
    }

    const desc = document.createElement("p");
    desc.className = "tool-desc";
    desc.textContent = (isEn && tool.descEn) ? tool.descEn : tool.desc;

    const cta = document.createElement("span");
    cta.className = "tool-cta";
    cta.dataset.status = card.dataset.status;
    cta.textContent = soon
      ? T("tools.wip", "In lavorazione")
      : T("tools.open", "Apri il tool →");

    card.append(icon, title, desc, cta);
    item.append(card);
    grid.append(item);
  }
})();
