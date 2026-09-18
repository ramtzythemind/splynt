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
├── fasthonest/
│   └── index.html        tool: timer del digiuno intermittente
├── claimfree/
│   ├── index.html        tool: compensazione UE 261 per voli in ritardo
│   └── data.js           aeroporti e compagnie (generato, vedi sotto)
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

4. Incolla lo snippet di analytics prima di `</body>`, copiandolo da un tool
   già esistente (vedi *Analytics*).
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

Vercel Web Analytics (cookieless), stesso snippet in fondo a tutte le pagine:

```html
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
```

Lo script è servito dallo stesso dominio, quindi la CSP `script-src 'self'` lo
copre già e non serve autorizzare nessun host esterno. In locale non registra
nulla: l'endpoint `/_vercel/` esiste solo in produzione.

> Nota: in `vercel.json` la CSP autorizza ancora i tre host di Simple Analytics
> (`scripts.` e `queue.simpleanalyticscdn.com`), rimasti da quando il sito li
> usava. Non fanno danno, ma nessuna pagina li chiama più: si possono togliere.

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
API: solo aritmetica sugli orari, in tre modalità (parti dalla sveglia, dall'ora
in cui vai a letto, oppure costruisci il piano ideale ricorrente).

Modello: ciclo medio di **90 minuti**, proposte a 3–6 cicli (4h30 → 9h). La
latenza di addormentamento dipende dal cronotipo — 10 min mattiniero, 15 media,
35 nottambulo — ed è l'unica leva della personalizzazione: sposta la finestra di
circa 25 minuti **senza** disallineare i cicli, perché la latenza precede il primo
ciclo invece di starci dentro. Gli orari sono arrotondati a 5 minuti.

**Piano ideale** (terza modalità): `luci spente = sveglia − risvegli notturni −
fabbisogno − latenza`, tutto in aritmetica modulo 24h perché è un piano
ricorrente, non l'orario di stasera. Campi e fonti:

- **Fabbisogno**: fasce d'età della National Sleep Foundation (14–17: 8–10h,
  18–64: 7–9h, 65+: 7–8h). Se l'utente indica quando si addormenta e si sveglia
  nei giorni senza sveglia, il fabbisogno è quella durata, limitata alla fascia
  d'età (il weekend include il recupero). Metodo del Munich ChronoType
  Questionnaire (MCTQ).
- **Cronotipo e jet lag sociale**: dalla metà del sonno libero (MSF). Il jet lag
  sociale è la distanza tra MSF e la metà del sonno del piano; sopra l'ora è
  segnalato. Se il piano anticipa l'addormentamento spontaneo di più di 45 min
  consiglia gradualità e luce del mattino; oltre 3 ore lo dice chiaramente.
- **Latenza** dichiarata (5–45 min) e **risvegli notturni** (10/20/40 min di
  WASO); alcol quasi tutte le sere aggiunge 15 min. Latenza ≥30 min e risvegli
  lunghi insieme → segnale di insonnia cronica, rimando al medico e alla CBT-I.
- **Caffeina**: ultima tazza ≥9h prima (emivita ~5h; Gardiner et al. 2023).
  **Alcol** ≥4h, **pasto abbondante** ≥3h, **allenamento intenso** ≥90 min
  (Stutz et al. 2019), **wind-down** in penombra 60 min prima. Al mattino luce
  naturale entro un'ora, weekend con sveglia entro +1h, pisolino ≤20 min entro
  8h dalla sveglia.
- I cicli restano come alternativa: mostra gli orari ai due multipli di 90 min
  più vicini al fabbisogno.

Le preferenze (modalità, orari e campi del piano) restano in `localStorage`.

## FastHonest

Timer per il digiuno intermittente, in due modalità: «sto digiunando» (parte
dall'ultimo boccone e conta) e «voglio mangiare alle…» (torna indietro e dice
entro quando chiudere la cena). Nessuna API: è aritmetica sugli orari.

Modello: sei protocolli (12:12, 14:10, 16:8, 18:6, 20:4, OMAD 23:1), dove il
primo numero sono le ore di digiuno e il secondo la finestra; digiuno + finestra
fanno sempre 24 ore. L'orario scritto viene agganciato al giorno giusto —
l'ultimo pasto è sempre l'occorrenza più recente non futura, il primo pasto la
prima futura — così alle 8 del mattino «21:00» significa ieri sera.

Le **fasi metaboliche** mostrate sulla cronologia sono ore dall'ultimo boccone
(0, 4, 12, 16, 24) e sono dichiarate per quello che sono: medie di popolazione
con una varianza enorme. In particolare il tool **non** mostra un contatore
dell'autofagia, che è quello che fanno quasi tutte le app a pagamento: nell'uomo
non è un interruttore che scatta a un'ora precisa e non è misurabile fuori da
una biopsia, quindi metterci un numero sarebbe inventarlo. La sezione «come
funziona il calcolo» dice anche che a parità di calorie gli studi controllati
non trovano un vantaggio metabolico, e elenca le controindicazioni (gravidanza,
età evolutiva, disturbi alimentari, diabete in terapia insulinica, sottopeso).

Il timer si aggiorna ogni 20 secondi e al rientro sulla scheda
(`visibilitychange`): mostrare i secondi con un intervallo da 1 s sarebbe solo
un modo elegante di scaldare la batteria. Preferenze in `localStorage`.

## ClaimFree

Dice se un volo in ritardo, cancellato o con imbarco negato dà diritto alla
compensazione del **Regolamento (CE) 261/2004**, quanto vale, e genera la
lettera di reclamo da mandare alla compagnia. Il punto del tool è il confronto:
le agenzie di settore trattengono fino al 35% (50% se si va in causa), cioè fino
a ~210 € su una pratica da 600 €, per fare esattamente questo.

**Campo di applicazione.** Partenza da UE/SEE/Svizzera con qualunque vettore;
oppure arrivo lì con vettore europeo. Per il Regno Unito vale UK261, con importi
in sterline (220/350/520 £). Ogni aeroporto del dataset porta una lettera di
giurisdizione (`E` = UE/SEE/CH, `U` = Regno Unito, vuoto = resto del mondo): le
regioni ultraperiferiche (Canarie, Azzorre, Madeira, Réunion, Guadalupa…) sono
`E` perché i Trattati si applicano, mentre Groenlandia, Fær Øer, Aruba, Curaçao,
Nuova Caledonia e le altre PTOM no.

**Importi** (art. 7): 250 € fino a 1500 km, 400 € per le tratte intra-UE sopra
i 1500 km e per le altre fino a 3500 km, 600 € oltre i 3500 km fuori dall'Unione.
La distanza è ortodromica (emisenoverso) tra partenza e destinazione **finale**,
sulle coordinate reali. «Intra-UE» dopo la Brexit non include più il Regno Unito.

**Condizioni.** Ritardo: soglia di 3 ore *all'arrivo* (sentenza *Sturgeon*, 2009),
non alla partenza. Cancellazione: niente compensazione con preavviso ≥14 giorni;
tra 7 e 13 giorni e sotto i 7 giorni valgono le finestre di riprotezione
dell'art. 5.1.c, e l'art. 7.2 dimezza l'importo se la riprotezione fa arrivare
entro 2/3/4 ore dall'orario originale a seconda della fascia. Imbarco negato:
compensazione piena, salvo rinuncia volontaria in cambio di un accordo.

**Circostanze eccezionali** (art. 5.3): maltempo, scioperi esterni e ragioni di
sicurezza esonerano, ma solo se la compagnia le prova — l'onere è suo. Guasto
tecnico ordinario no (*Wallentin-Hermann* 2008, *van der Lans* 2015), motivi
operativi no, sciopero del proprio personale no (*Airhelp c. SAS*, 2021). Con
«nessuna spiegazione» il verdetto resta positivo, proprio perché la prova tocca
al vettore. Se la data del volo supera i ~2 anni, compare l'avviso sui termini
di prescrizione (2 anni in Italia, 3 in Germania, 5 in Francia e Spagna, 6 nel
Regno Unito).

La lettera si copia negli appunti o si apre in `mailto:`, ed è generata in
italiano o in inglese a seconda della lingua della pagina. Niente download di
file: un link `blob:` rischierebbe di sbattere contro la CSP.

### Rigenerare `claimfree/data.js`

Il dataset (3262 aeroporti con rotte di linea, 528 compagnie) è derivato da
[OpenFlights](https://openflights.org/data) (licenza ODbL), filtrando
`airports.dat` sugli scali che compaiono in `routes.dat`. Ogni riga è
`IATA|nome|città|paese|giurisdizione|lat|lon|rotte`; il conteggio delle rotte
serve solo a ordinare i risultati della ricerca, altrimenti cercando «roma»
vince Roma (Australia) invece di Fiumicino. Le compagnie hanno una tabella di
correzioni a mano in testa al file di build, perché OpenFlights è fermo a circa
il 2014 e non conosce ITA Airways né Aeroitalia.

Il file è generato, non scritto a mano: lo script è `claimfree/build-data.py`,
e la sua docstring elenca i quattro `.dat` da scaricare prima di eseguirlo.
