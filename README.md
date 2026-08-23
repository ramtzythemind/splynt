# splynt.xyz

Homepage di una collezione di micro-tool gratuiti. Tutto statico: HTML, CSS e JS
puro, nessun framework, nessun build step, nessun backend.

## Struttura

```
/
├── index.html            home: manifesto + griglia dei tool
├── 404.html
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── vercel.json           cleanUrls + header di sicurezza
├── assets/
│   ├── style.css         palette crema/arancione, dark/light automatico
│   ├── i18n.js           switch di lingua IT/EN
│   └── tools.js          ⬅️ l'elenco dei tool (l'unico file da modificare)
├── sunhonest/
│   └── index.html        tool: UV index + rotazione fronte/retro
├── risefree/
│   └── index.html        tool: orari di sonno allineati ai cicli da 90 min
└── supporta/
    └── index.html        pagina donazioni (link Ko-fi da sostituire)
```

## Aggiungere un tool

1. Crea la cartella `/nometool/` con dentro `index.html` (una pagina autonoma,
   con il suo CSS: così resta indipendente dal resto del sito).
2. Aggiungi un oggetto in cima a `assets/tools.js`:

```js
{
  name: "NomeTool",
  icon: "🧭",
  desc: "Una riga che spiega il problema che risolve.",
  href: "/nometool/",
  status: "live",   // "soon" per annunciarlo senza renderlo cliccabile
  tag: "gratis",    // opzionale
}
```

3. (Facoltativo) aggiungi la `<url>` in `sitemap.xml`.

Il layout non va toccato: la home genera le card dall'array.

4. Incolla lo snippet di Simple Analytics prima di `</body>`, come nelle altre
   pagine (vedi sotto).
5. Aggiungi il selettore di lingua e il dizionario inglese (vedi *Lingue*).

> Se aggiungi un tool che chiama un'API esterna, ricordati di autorizzarne il
> dominio in `connect-src` dentro `vercel.json`, altrimenti la CSP blocca le
> richieste in produzione.

## Lingue (IT / EN)

L'italiano è scritto **direttamente nell'HTML**: è la fonte di verità, e la
pagina funziona anche senza JavaScript. L'inglese arriva da un dizionario che
ogni pagina passa a `SplyntLang.apply({...})`.

Nel markup:

```html
<h1 data-i18n="hero.title">Testo italiano</h1>
<input data-i18n-attr="placeholder:setup.cityPlaceholder">
<span data-lang-switch></span>   <!-- dove compare il selettore IT/EN -->
```

Nel JS di un tool, per le stringhe generate a runtime:

```js
var t = function (key, it) { return window.SplyntLang ? SplyntLang.t(key, it) : it; };
t("plan.front", "🔆 Fronte (pancia e viso)")
tf("plan.sub", "Sessione di <b>{dur}</b> dalle {from}…", { dur: …, from: … })
```

Due regole da rispettare:

1. Il blocco `SplyntLang.apply({...})` va **alla fine del body, prima dello
   script del tool**: traduce il markup statico e poi lascia che sia il codice a
   scrivere i contenuti dinamici. Invertendo l'ordine, la traduzione
   sovrascrive i risultati appena calcolati.
2. Un elemento riscritto dal JS non deve avere `data-i18n` *e* basta: il suo
   testo dinamico va prodotto con `t()`.

La lingua si sceglie con `?lang=it|en`, poi resta salvata in `localStorage`;
al primo accesso vince la lingua del browser (italiano solo per browser
italiani, inglese per tutti gli altri).

> **Nota SEO:** i crawler vedono l'HTML italiano, quindi l'inglese non porta
> traffico organico. Se un giorno l'inglese diventasse importante per la
> ricerca, la strada è duplicare le pagine sotto `/en/` — più lavoro per ogni
> tool, ma indicizzabile.

## Analytics

Simple Analytics (cookieless), stesso snippet su tutte le pagine:

```html
<script async src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
```

Perché funzioni in produzione la CSP in `vercel.json` deve autorizzare i tre
host: `scripts.simpleanalyticscdn.com` in `script-src`,
`queue.simpleanalyticscdn.com` in `connect-src` **e** in `img-src` (il fallback
a pixel). In locale lo script non registra nulla: Simple Analytics ignora
`localhost`.

## Sviluppo in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

Serve un server (anche banale): aprire i file con `file://` rompe i percorsi
assoluti tipo `/assets/style.css`.

## Deploy su Vercel

- **Drag & drop**: trascina la cartella su vercel.com/new.
- **Da GitHub**: importa il repo; framework preset *Other*, build command vuoto,
  output directory vuota (la root).

Poi punta il dominio `splynt.xyz` al progetto dalle impostazioni Vercel.

## SunHonest

Calcola indice UV, tempo di esposizione sicuro e piano di rotazione fronte/retro.
Dati da [Open-Meteo](https://open-meteo.com/) (gratuiti, senza chiave API);
tutti i calcoli girano nel browser, niente viene inviato altrove.

Modello: `UVI 1 = 0,025 W/m²` eritemali → `1 min a UVI 1 = 0,015 SED`. Si integra
l'UV previsto minuto per minuto e ci si ferma al 75% della MED del fototipo
(Fitzpatrick I–VI, 2–10 SED). L'SPF vale il 60% del valore dichiarato, per tener
conto dell'applicazione reale. I blocchi del piano sono a **dose uguale**, non a
minuti uguali: si allungano quando il sole cala.

## RiseFree

Orari per andare a letto o per la sveglia, allineati ai cicli del sonno. Nessuna
API: solo aritmetica sugli orari, in due modalità (parti dalla sveglia o dall'ora
in cui vai a letto).

Modello: ciclo medio di **90 minuti**, proposte a 3–6 cicli (4h30 → 9h). La
latenza di addormentamento dipende dal cronotipo — 10 min mattiniero, 15 media,
35 nottambulo — ed è l'unica leva della personalizzazione: sposta la finestra di
circa 25 minuti **senza** disallineare i cicli, perché la latenza precede il primo
ciclo invece di starci dentro. Gli orari sono arrotondati a 5 minuti.
