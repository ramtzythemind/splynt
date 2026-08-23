/* ==========================================================================
   L'UNICO FILE DA TOCCARE PER AGGIUNGERE UN TOOL.
   Aggiungi un oggetto all'array TOOLS: la home si aggiorna da sola.

   Campi:
     name    (string)  nome del tool
     icon    (string)  emoji
     desc    (string)  una riga di descrizione
     href    (string)  cartella del tool, es. "/nomeTool/"
     status  (string)  "live" (cliccabile) | "soon" (placeholder non cliccabile)
     tag     (string)  opzionale, etichetta accanto al nome ("gratis", "beta"…)
   ========================================================================== */

const TOOLS = [
  {
    name: "SunHonest",
    icon: "☀️",
    desc: "Indice UV in tempo reale, quanto puoi stare al sole senza scottarti e il piano di rotazione fronte/retro.",
    href: "/sunhonest/",
    status: "live",
    tag: "gratis",
  },
  {
    name: "RiseFree",
    icon: "🌙",
    desc: "A che ora andare a letto o puntare la sveglia per svegliarti a fine ciclo, non nel mezzo.",
    href: "/risefree/",
    status: "live",
    tag: "gratis",
  },

  // Esempio di tool annunciato ma non ancora online:
  // {
  //   name: "NomeTool",
  //   icon: "🧭",
  //   desc: "Una riga che spiega il problema che risolve.",
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

  const counter = document.querySelector("[data-tool-count]");
  const live = TOOLS.filter((t) => t.status !== "soon");

  if (counter) {
    counter.textContent =
      live.length === 1 ? "1 tool online" : `${live.length} tool online`;
  }

  if (!TOOLS.length) {
    grid.innerHTML =
      '<li><p class="tool-empty">Il primo tool sta arrivando. Torna tra poco.</p></li>';
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

    const label = soon ? "presto" : tool.tag;
    if (label) {
      const badge = document.createElement("span");
      badge.className = "badge" + (soon ? " badge--soon" : "");
      badge.textContent = label;
      title.append(badge);
    }

    const desc = document.createElement("p");
    desc.className = "tool-desc";
    desc.textContent = tool.desc;

    const cta = document.createElement("span");
    cta.className = "tool-cta";
    cta.dataset.status = card.dataset.status;
    cta.textContent = soon ? "In lavorazione" : "Apri il tool →";

    card.append(icon, title, desc, cta);
    item.append(card);
    grid.append(item);
  }
})();
