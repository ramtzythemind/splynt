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

> Se aggiungi un tool che chiama un'API esterna, ricordati di autorizzarne il
> dominio in `connect-src` dentro `vercel.json`, altrimenti la CSP blocca le
> richieste in produzione.

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
