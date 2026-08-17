import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Plane,
  Radio,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { AIRLINES } from "@/data/airlines";
import { RANKS } from "@/data/aircraft";
import { DATASET_STATS } from "@/data/stats";
import { Badge, Button, Card } from "@/components/ui";

const FEATURES = [
  {
    icon: Plane,
    title: "Orari veri, non generati",
    body: `${DATASET_STATS.legs} tratte importate dai tabelloni reali di ${DATASET_STATS.airlines} compagnie: numero di volo, orario Zulu, aeromobile assegnato e passeggeri a bordo. Se AZ610 parte da Fiumicino alle 10:30 per JFK, in Splynt parte alle 10:30 per JFK.`,
  },
  {
    icon: Radio,
    title: "ACARS collegato al simulatore",
    body: "Il client desktop si aggancia a MSFS via SimConnect e registra la traccia, le fasi di volo, il carburante e il rateo di contatto. Nessun modulo da compilare a mano: atterri, spegni i motori, il PIREP è già archiviato.",
  },
  {
    icon: TrendingUp,
    title: "Progressione che pesa",
    body: "XP da distanza, passeggeri e condotta. Otto gradi da Cadet a Fleet Commander, ognuno sblocca una categoria di aeromobile. Il 777 non lo tocchi finché non ti sei guadagnato le maniche.",
  },
  {
    icon: Gauge,
    title: "Ogni atterraggio ha un voto",
    body: "Rateo di contatto, puntualità sullo STD, overspeed, stall e pause in volo entrano tutti nel punteggio finale. Un contatto a -140 fpm in orario vale molto più di un arrivo anticipato a -520.",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Splynt
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Accedi
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Crea il tuo pilota</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-flightdeck">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 sm:pt-28 sm:pb-24">
            <Badge tone="amber">
              <span className="animate-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-amber-board" />
              Per MSFS 2020 e 2024
            </Badge>

            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
              Il simulatore ti dà l&apos;aereo.
              <br />
              <span className="text-amber-board">Splynt ti dà la carriera.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-soft sm:text-lg">
              Firmi con una compagnia aerea, ti presenti al suo hub e voli i suoi
              turni reali. Ogni tratta che completi ti fa salire di grado e ti
              apre flotte più grandi. Ogni atterraggio finisce nel tuo libretto,
              con il voto che si merita.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button size="lg">
                  Inizia la carriera
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/airlines">
                <Button variant="outline" size="lg">
                  Guarda le compagnie
                </Button>
              </Link>
            </div>

            <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {[
                [String(DATASET_STATS.legs), "tratte schedulate"],
                [String(DATASET_STATS.airports), "aeroporti"],
                [String(DATASET_STATS.airlines), "compagnie aeree"],
                [String(DATASET_STATS.ranks), "gradi di carriera"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="flap text-3xl font-semibold">{n}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-muted">
                    {l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Departure board teaser */}
        <section className="border-y border-ink-800 bg-ink-900/50">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-slate-muted">
              Partenze · esempio dal network ITA Airways
            </h2>
            <div className="scanline relative mt-5 overflow-x-auto rounded-[var(--radius-card)] border border-ink-700 bg-ink-950">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.14em] text-slate-muted">
                    <th className="px-4 py-2.5 font-medium">Volo</th>
                    <th className="px-4 py-2.5 font-medium">Destinazione</th>
                    <th className="px-4 py-2.5 font-medium">STD</th>
                    <th className="px-4 py-2.5 font-medium">Aeromobile</th>
                    <th className="px-4 py-2.5 font-medium">Pax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/70">
                  {[
                    ["AZ1601", "Catania", "06:40", "A320", "174"],
                    ["AZ212", "London Heathrow", "06:35", "A320", "174"],
                    ["AZ348", "Paris CDG", "06:45", "A320", "168"],
                    ["AZ610", "New York JFK", "10:30", "A330-900neo", "281"],
                    ["AZ770", "Tokyo Haneda", "14:20", "A350-900", "301"],
                  ].map(([fn, dest, std, ac, pax]) => (
                    <tr key={fn} className="text-sm">
                      <td className="flap px-4 py-3 font-semibold">{fn}</td>
                      <td className="px-4 py-3 text-slate-soft">{dest}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-white">
                        {std}
                        <span className="ml-1 text-[10px] text-slate-muted">Z</span>
                      </td>
                      <td className="px-4 py-3 text-slate-muted">{ac}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-muted">
                        {pax}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Una compagnia aerea che ti tiene i conti
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-6">
                <Icon className="h-5 w-5 text-amber-board" strokeWidth={1.6} />
                <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-muted">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Ranks */}
        <section className="border-t border-ink-800 bg-ink-900/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Dal turboelica all&apos;A380
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-muted">
              Si parte dal Dash 8 sulle rotte regionali. Ogni grado apre una
              categoria di aeromobile e le rotte che la usano.
            </p>

            <ol className="mt-10 space-y-px overflow-hidden rounded-[var(--radius-card)] border border-ink-700">
              {RANKS.map((r) => (
                <li
                  key={r.level}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-ink-850 px-5 py-4"
                >
                  <span className="flap w-6 text-sm font-semibold">{r.level}</span>
                  <span className="w-44 text-sm font-medium text-white">{r.name}</span>
                  <span className="w-24 font-mono text-xs tabular-nums text-slate-muted">
                    {r.minXp.toLocaleString("it-IT")} XP
                  </span>
                  <span className="flex-1 text-xs text-slate-muted">{r.perk}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Airlines */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {DATASET_STATS.airlines} compagnie, {DATASET_STATS.airlines} carriere
            diverse
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-muted">
            Se parti da zero cerca le regionali: {DATASET_STATS.entryAirlines}{" "}
            compagnie volano turboelica e sono le uniche accessibili al primo
            grado.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AIRLINES.map((a) => (
              <Card key={a.icao} className="overflow-hidden">
                <div className="h-1" style={{ background: a.accent }} />
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="flap text-sm font-semibold">{a.iata}</span>
                    <Badge tone="neutral">{a.hub}</Badge>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-white">{a.name}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-muted">
                    {a.tagline}
                  </p>
                  <div className="mt-4 flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className="h-1 w-4 rounded-full"
                        style={{
                          background:
                            i < a.difficulty ? a.accent : "var(--color-ink-700)",
                        }}
                      />
                    ))}
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-muted">
                      difficoltà
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-ink-800 bg-flightdeck">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-jade" strokeWidth={1.6} />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Il tuo libretto di volo comincia adesso
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-soft">
              Registrati, scegli la compagnia, scarica il client ACARS e prendi il
              primo turno della giornata. Il resto lo scrive il simulatore.
            </p>
            <Link href="/signup" className="mt-8 inline-block">
              <Button size="lg">
                Crea il tuo pilota
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-800 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-xs text-slate-muted">
          <span>Splynt · carriere virtuali per Microsoft Flight Simulator</span>
          <span>
            Non affiliato a Microsoft, Asobo o alle compagnie aeree rappresentate.
          </span>
        </div>
      </footer>
    </>
  );
}

function Logo() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-md bg-amber-board">
      <Plane className="h-4 w-4 -rotate-45 text-ink-950" strokeWidth={2.2} />
    </span>
  );
}
