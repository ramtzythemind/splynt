# Splynt

Carriere virtuali da pilota di linea per **Microsoft Flight Simulator 2020 e 2024**.

Firmi con una compagnia aerea, ti presenti al suo hub e voli i suoi orari
reali. Il client ACARS registra la tratta direttamente dal simulatore, ne
calcola il punteggio e la archivia nel tuo libretto di volo. Gli XP che guadagni
ti fanno salire di grado, e ogni grado sblocca una categoria di aeromobile
nuova — dal Dash 8 all'A380.

## Come funziona

1. **Scegli una compagnia.** Otto network reali, ognuno con hub, flotta e
   difficoltà propri. La difficoltà moltiplica gli XP di ogni volo.
2. **Prendi un turno dal tabellone.** Solo i voli in partenza da dove ti trovi
   ora, e solo gli aeromobili che il tuo grado ti consente di comandare.
3. **Vola in MSFS con il client ACARS acceso.** Traccia, fasi di volo,
   carburante e rateo di contatto vengono registrati automaticamente.
4. **Il PIREP si archivia da solo** quando spegni i motori a destinazione, con
   punteggio, voto e XP calcolati.

## Stack

| Livello | Scelta |
| --- | --- |
| Web | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Dati | Supabase (Postgres + Auth + RLS) |
| Client ACARS | Node.js + `node-simconnect` (SimConnect) |

## Da dove arrivano i voli

Splynt legge gli orari **solo da Postgres**, mai da un'API durante il rendering
di una pagina: i piani gratuiti hanno quote troppo piccole per reggerlo. I
provider vengono interrogati dal job di import, che normalizza il risultato
nella tabella `schedules`. Il tabellone resta veloce e continua a funzionare
quando un provider è giù o fuori quota.

| Provider | Gratuito | Cosa fornisce |
| --- | --- | --- |
| `dataset` (default) | ✅ sempre | Il timetable curato incluso nel repo. Nessuna credenziale, nessuna quota |
| `aerodatabox` | 🟡 600 unità/mese | Tabellone reale: numero volo, STD/STA, aeromobile. Passeggeri stimati dal tipo (load factor 85%) |
| `opensky` | ✅ con registrazione | Voli **realmente volati** via ADS-B. Nessun tipo aeromobile né passeggeri: dedotti dalla flotta della compagnia |

**Flightradar24 non è nell'elenco di proposito**: il sandbox è gratuito ma
restituisce solo dati statici di test, e la produzione è un contratto
enterprise. Non c'è un piano self-service utilizzabile per un progetto così.

### Importare

```bash
# analizza senza scrivere
npm run flights:import -- --provider aerodatabox --airline ITY --dry-run

# una compagnia dal suo hub
npm run flights:import -- --provider aerodatabox --airline ITY

# uno scalo specifico, una data specifica
npm run flights:import -- --provider opensky --airline RYR --airport EIDW --date 2026-08-18

# tutte le compagnie a database
npm run flights:import -- --all
```

Su Vercel il refresh è automatico: `vercel.ts` registra un cron notturno su
`/api/cron/sync-flights`, protetto da `CRON_SECRET`.

Quello che il provider non sa, l'importer lo **deriva** invece di inventarlo:
distanza dalle coordinate degli aeroporti, tempo blocchi dalla velocità di
crociera, aeromobile dalla flotta della compagnia con l'euristica per fascia di
distanza, passeggeri da posti × load factor. Un volo che resta irrisolvibile
viene **scartato con una motivazione**, non salvato con dati fittizi. Gli
aeroporti nuovi che il provider cita vengono creati; quelli curati non vengono
mai sovrascritti.

Il tabellone mostra sempre la sorgente dei voli e la data dell'ultimo import.

Verifica offline del livello provider (matcher aeromobili, inferenza da flotta,
coerenza del dataset) — non richiede credenziali:

```bash
npm run providers:check
```

## Il dataset incluso

Gli orari non sono generati: sono i tabelloni pubblicati delle compagnie.

- **219 aeroporti** con coordinate, elevazione e fuso orario IANA
- **24 tipi di aeromobile** con velocità di crociera, raggio e capacità reali
- **876 tratte** su 14 compagnie

**Di linea:** ITA Airways, Ryanair, Lufthansa, British Airways, Air France,
KLM, Emirates, American Airlines.

**Di ingresso (turboelica, volabili dal grado 1):** Aeroitalia (Fiumicino,
ATR 72 **e** 737-800), Widerøe (Bodø e i fiordi norvegesi, Dash 8 Q400),
Emerald Airlines (Dublino, ATR 72), Loganair (Glasgow e le isole scozzesi,
ATR 72), Binter Canarias (Canarie, ATR 72), Olympic Air (Atene e l'Egeo,
Dash 8 Q400).

Ogni tratta porta numero di volo, orario STD in UTC, aeromobile assegnato e
passeggeri tipici. I voli di ritorno seguono la convenzione del settore
(numero consecutivo, AZ 610 in andata / AZ 611 al ritorno) con un turnaround
realistico per categoria.

### Da dove si comincia

Un pilota nuovo ha 0 XP, quindi grado 1 (Cadet), che abilita **solo la classe
turboelica**. Le sei compagnie di ingresso esistono per questo: sono le uniche
volabili al primo grado. Le altre otto compaiono nell'onboarding contrassegnate
col grado che richiedono.

**Aeroitalia è il percorso più lineare**: opera ATR 72 e 737-800 dallo stesso
hub, quindi al grado 3 passi al jet senza cambiare compagnia né spostarti.

Cambiando compagnia vieni riassegnato al suo hub, a meno che la nuova non voli
già dallo scalo in cui ti trovi — altrimenti ti ritroveresti davanti a un
tabellone vuoto.

Un volo ATR tipico rende 650-950 XP, quindi il grado 2 arriva in 2-3 voli e il
grado 3 — che sblocca A320 e 737 di linea — in 6-8 voli, circa 7 ore di volo.
A quel punto si cambia compagnia dalla pagina Pilota.

`npm run career:check` verifica che questo percorso resti percorribile: se una
modifica ai gradi o alle flotte rendesse il tabellone interamente bloccato per
un principiante, il controllo fallisce.

I tempi blocchi sono calcolati da distanza ortodromica e velocità di crociera
del tipo, non inventati:

```
block = 30' + (distanza / velocità_crociera) × 60 × fattore
fattore = 1.05 sotto le 1500 NM, 1.08 oltre
```

Validazione offline del dataset (raggi, capacità, numeri di volo duplicati):

```bash
npm run db:check
```

## Setup

### 1. Progetto Supabase

Crea un progetto su [supabase.com](https://supabase.com), poi esegui **in
ordine** nell'SQL Editor:

1. `supabase/migrations/0001_schema.sql` — tabelle, funzioni, trigger, RLS
2. `supabase/migrations/0002_flight_sources.sql` — provenienza dati e log import

### 2. Variabili d'ambiente

Crea `.env.local` nella root:

Copia `.env.local.example` in `.env.local` e riempilo:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

FLIGHT_PROVIDER=dataset        # oppure aerodatabox | opensky
# AERODATABOX_API_KEY=         # RapidAPI
# OPENSKY_CLIENT_ID=           # OAuth2 client credentials
# OPENSKY_CLIENT_SECRET=
```

La service role key serve alle rotte `/api/acars/*` (che autenticano il client
desktop con il suo token invece che con una sessione Supabase) e al job di
import.

### 3. Carica il mondo

```bash
npm install
npm run db:seed
```

### 4. Avvia

```bash
npm run dev
```

Registrati, scegli la compagnia, e vai su **Pilota** per generare il token
ACARS.

### 5. Client ACARS

Sul PC che ospita MSFS:

```bash
cd acars
npm install
cp .env.example .env      # incolla il token
npm start
```

Il client elenca i voli prenotati, ne fa scegliere uno, aspetta il simulatore e
poi registra tutto.

## Come si guadagnano gli XP

Base di partenza da distanza, passeggeri e tempo blocchi, poi tre
moltiplicatori:

- **Categoria aeromobile** — il turboelica rende il 35% in più del narrowbody,
  così macinare tratte corte resta competitivo col lungo raggio
- **Difficoltà compagnia** — da ×1.00 a ×1.20
- **Condotta** — da ×0.50 a ×1.20 in base al punteggio del volo

Il punteggio (0–100) pesa **atterraggio 40%**, **airmanship 38%**,
**puntualità 22%**:

| Rateo di contatto | Giudizio | Punti |
| --- | --- | --- |
| 0 … −50 fpm | flottante | 88 |
| −51 … −180 | da manuale | 100 |
| −181 … −300 | buono | 86 |
| −301 … −450 | deciso | 66 |
| −451 … −600 | duro | 42 |
| oltre −600 | pesante | 8 |

Penalizzano overspeed, stall warning e pause in volo. Una traccia più corta
della rotta ortodromica (teletrasporto in slew) azzera quasi del tutto
l'airmanship. Atterrare fuori destinazione costa il 60% degli XP.

Bonus: **+8%** per atterraggio notturno, **+10%** oltre le 3000 NM.

## Gradi

| Lv | Grado | XP | Sblocca |
| --- | --- | --- | --- |
| 1 | Cadet | 0 | Turboelica |
| 2 | Second Officer | 1.500 | Jet regionali |
| 3 | First Officer | 5.000 | A320, 737 |
| 4 | Senior First Officer | 13.000 | A321neo, 737 MAX 9, 757 |
| 5 | Captain | 28.000 | A330, 767, 787 |
| 6 | Senior Captain | 50.000 | Long-haul di punta |
| 7 | Training Captain | 82.000 | 777, A350 |
| 8 | Fleet Commander | 130.000 | A380 |

## API ACARS

Tutte le rotte richiedono `Authorization: Bearer splynt_…`.

| Metodo | Rotta | Cosa fa |
| --- | --- | --- |
| `GET` | `/api/acars/handshake` | Identità pilota + voli prenotati |
| `POST` | `/api/acars/session` | Apre il PIREP su una prenotazione |
| `POST` | `/api/acars/telemetry` | Batch di posizioni (max 240) + milestone OOOI |
| `POST` | `/api/acars/finalize` | Chiude il volo, calcola punteggio e XP |

I token sono salvati solo come hash SHA-256: il valore in chiaro viene mostrato
una volta sola alla generazione.

## Struttura

```
src/
  app/
    (app)/          hub, tabellone, libretto, pilota, onboarding
    api/acars/      ingestione dal client desktop
    api/tokens/     emissione e revoca token
    api/cron/       refresh notturno degli orari
  components/       UI e viste client
  data/             dataset: aeroporti, aeromobili, network
  lib/
    career.ts       motore XP, gradi, punteggio volo
    flights.ts      orari → istanze datate del tabellone
    actions.ts      server action (prenota, annulla, deadhead)
    import-flights.ts  normalizzazione provider → schedules
    providers/      dataset, aerodatabox, opensky
supabase/
  migrations/       schema, trigger, RLS, provenienza dati
scripts/            seed, import e validazioni offline
acars/              client desktop SimConnect
```

## Note

Progetto non affiliato a Microsoft, Asobo o alle compagnie aeree rappresentate.
Marchi e livree appartengono ai rispettivi titolari; qui sono usati solo come
riferimento agli orari pubblici.
