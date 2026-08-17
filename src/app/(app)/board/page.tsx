import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPilotContext } from "@/lib/pilot";
import { canFly } from "@/lib/career";
import { buildBoard, dayOffset, isoDate, localTime, utcTime } from "@/lib/flights";
import { DepartureBoard, type BoardRow } from "@/components/DepartureBoard";
import { Badge } from "@/components/ui";
import type { AircraftClass, Airport, Schedule } from "@/lib/supabase/types";

export const metadata = { title: "Partenze" };

const HORIZON_DAYS = 7;

const SOURCE_LABEL: Record<string, string> = {
  dataset: "Dataset Splynt",
  aerodatabox: "AeroDataBox",
  opensky: "OpenSky Network",
};

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { pilot, airline, position } = await getPilotContext();
  if (!pilot.airline_id) redirect("/onboarding");

  const params = await searchParams;
  const supabase = await createClient();

  const now = new Date();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);

  const dates = Array.from({ length: HORIZON_DAYS }, (_, i) => {
    const d = new Date(today.getTime() + i * 86_400_000);
    return {
      value: isoDate(d),
      label:
        i === 0
          ? "Oggi"
          : i === 1
            ? "Domani"
            : new Intl.DateTimeFormat("it-IT", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: "UTC",
              }).format(d),
    };
  });

  const requested = params.date ?? null;
  const activeDate =
    requested && dates.some((d) => d.value === requested) ? requested : dates[0].value;

  const origin = position?.icao ?? airline?.hub_icao ?? null;
  if (!origin) redirect("/onboarding");

  const [
    { data: schedules },
    { data: airports },
    { data: aircraft },
    { data: booked },
    { data: lastImport },
  ] = await Promise.all([
      supabase
        .from("schedules")
        .select("*")
        .eq("airline_id", pilot.airline_id)
        .eq("is_active", true),
      supabase.from("airports").select("*"),
      supabase.from("aircraft_types").select("icao, name, class, min_rank_level"),
      supabase
        .from("bookings")
        .select("schedule_id, flight_date")
        .eq("pilot_id", pilot.id)
        .in("status", ["booked", "in_progress"]),
      supabase
        .from("import_runs")
        .select("provider, finished_at")
        .eq("airline_icao", airline?.icao ?? "")
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const airportMap = new Map<string, Airport>(
    (airports ?? []).map((a) => [a.icao, a as Airport]),
  );
  const acMap = new Map(
    (aircraft ?? []).map((a) => [
      a.icao,
      a as { icao: string; name: string; class: AircraftClass; min_rank_level: number },
    ]),
  );
  const bookedKeys = new Set(
    (booked ?? []).map((b) => `${b.schedule_id}|${b.flight_date}`),
  );

  const all = (schedules ?? []) as Schedule[];
  const fromHere = all.filter((s) => s.dep_icao === origin);

  const day = new Date(`${activeDate}T00:00:00Z`);
  const instances = buildBoard(fromHere, airportMap, day, 1);

  const rows: BoardRow[] = instances.map((f) => {
    const ac = acMap.get(f.aircraftIcao);
    const klass = ac?.class ?? "narrowbody";

    let lockedReason: string | null = null;
    if (!canFly(pilot.rank_level, klass)) {
      lockedReason = `Grado ${ac?.min_rank_level ?? "?"} richiesto`;
    } else if (f.departure.getTime() < now.getTime()) {
      lockedReason = "Partenza già passata";
    }

    return {
      scheduleId: f.scheduleId,
      flightDate: f.flightDate,
      flightNumber: f.flightNumber,
      depIcao: f.dep.icao,
      arrIcao: f.arr.icao,
      arrCity: f.arr.city,
      arrCountry: f.arr.country,
      stdUtc: utcTime(f.departure),
      staUtc: utcTime(f.arrival),
      stdLocal: localTime(f.departure, f.dep.timezone),
      staLocal: localTime(f.arrival, f.arr.timezone),
      arrivesNextDay: dayOffset(f.departure, f.arrival, f.arr.timezone) > 0,
      blockMinutes: f.blockMinutes,
      distanceNm: f.distanceNm,
      aircraftIcao: f.aircraftIcao,
      aircraftName: ac?.name ?? f.aircraftIcao,
      aircraftClass: klass,
      pax: f.pax,
      lockedReason,
      booked: bookedKeys.has(`${f.scheduleId}|${f.flightDate}`),
    };
  });

  // Other stations in the network the pilot could deadhead to.
  const counts = new Map<string, number>();
  for (const s of all) {
    if (s.dep_icao === origin) continue;
    counts.set(s.dep_icao, (counts.get(s.dep_icao) ?? 0) + 1);
  }
  const otherOrigins = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([icao, count]) => ({
      icao,
      city: airportMap.get(icao)?.city ?? icao,
      count,
    }));

  // Where these rows came from — the dataset, or a live provider import.
  const sources = new Set(
    fromHere.map((s) => (s as Schedule & { source?: string }).source ?? "dataset"),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Tabellone partenze
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-muted">
        Gli orari pubblicati di {airline?.name} in partenza da {origin}. Gli orari
        sono in UTC (Z) con l&apos;ora locale sotto. Prendi un turno e volalo in
        MSFS: il client ACARS farà il resto.
      </p>

      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-muted">
        <span className="uppercase tracking-[0.14em]">Sorgente</span>
        {[...sources].map((s) => (
          <Badge key={s} tone={s === "dataset" ? "neutral" : "sky"}>
            {SOURCE_LABEL[s] ?? s}
          </Badge>
        ))}
        {lastImport?.finished_at && (
          <span>
            · aggiornato il{" "}
            {new Intl.DateTimeFormat("it-IT", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(lastImport.finished_at))}
          </span>
        )}
      </p>

      <div className="mt-7">
        <DepartureBoard
          rows={rows}
          dates={dates}
          activeDate={activeDate}
          origin={origin}
          originCity={airportMap.get(origin)?.city ?? ""}
          otherOrigins={otherOrigins}
          accent={airline?.accent ?? "#ffb020"}
        />
      </div>
    </div>
  );
}
