import { createClient } from "@/lib/supabase/server";
import { getPilotContext } from "@/lib/pilot";
import { AirlinePicker, type AirlineCard } from "@/components/AirlinePicker";

export const metadata = { title: "Scegli la compagnia" };

export default async function OnboardingPage() {
  const { pilot } = await getPilotContext();
  const supabase = await createClient();

  const [{ data: airlines }, { data: airports }, { data: fleet }, { data: schedules }] =
    await Promise.all([
      supabase.from("airlines").select("*").order("difficulty"),
      supabase.from("airports").select("icao, city"),
      supabase
        .from("airline_fleet")
        .select("airline_id, aircraft_icao, aircraft_types ( class, min_rank_level )"),
      supabase.from("schedules").select("airline_id"),
    ]);

  const cityByIcao = new Map((airports ?? []).map((a) => [a.icao, a.city]));

  const routeCounts = new Map<string, number>();
  for (const s of schedules ?? []) {
    routeCounts.set(s.airline_id, (routeCounts.get(s.airline_id) ?? 0) + 1);
  }

  const fleetByAirline = new Map<string, string[]>();
  // The lowest rank each airline's fleet allows — an airline whose smallest
  // aircraft needs rank 3 is unreachable for a pilot who has never flown.
  const minRankByAirline = new Map<string, number>();

  for (const f of fleet ?? []) {
    const list = fleetByAirline.get(f.airline_id) ?? [];
    list.push(f.aircraft_icao);
    fleetByAirline.set(f.airline_id, list);

    const type = f.aircraft_types as unknown as { min_rank_level: number } | null;
    const needed = type?.min_rank_level ?? 1;
    const current = minRankByAirline.get(f.airline_id);
    if (current === undefined || needed < current) {
      minRankByAirline.set(f.airline_id, needed);
    }
  }

  const cards: AirlineCard[] = (airlines ?? []).map((a) => {
    const minRank = minRankByAirline.get(a.id) ?? 1;
    return {
      ...a,
      hubCity: cityByIcao.get(a.hub_icao) ?? a.hub_icao,
      routeCount: routeCounts.get(a.id) ?? 0,
      fleetTypes: (fleetByAirline.get(a.id) ?? []).sort(),
      minRank,
      reachable: pilot.rank_level >= minRank,
    };
  });

  // Airlines the pilot can actually fly for come first.
  cards.sort(
    (a, b) => Number(b.reachable) - Number(a.reachable) || a.minRank - b.minRank,
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        {pilot.airline_id ? "Cambia compagnia" : "Per chi vuoi volare?"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-muted">
        La compagnia decide il tuo hub, la flotta che avrai sotto mano e il tipo
        di rotazioni che troverai sul tabellone. La difficoltà influisce sugli XP
        che guadagni per ogni volo.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-muted">
        Alcune compagnie volano solo aeromobili che il tuo grado non abilita
        ancora: le trovi in fondo, contrassegnate. Se stai iniziando, parti da
        una regionale con turboelica — bastano pochi voli per salire.
      </p>

      <div className="mt-8">
        <AirlinePicker airlines={cards} currentId={pilot.airline_id} />
      </div>
    </div>
  );
}
