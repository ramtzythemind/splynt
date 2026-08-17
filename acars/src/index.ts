/**
 * Splynt ACARS — collega MSFS 2020/2024 alla tua carriera.
 *
 * Avvio:  npm start
 * Il client mostra i voli prenotati, ne fa scegliere uno, si aggancia al
 * simulatore via SimConnect e archivia il PIREP allo spegnimento dei motori.
 */
import { createInterface } from "node:readline/promises";
import { loadConfig, CLIENT_VERSION } from "./config.js";
import { SplyntApi, type BookingSummary, type TelemetryPoint } from "./api.js";
import { connectToSim, type SimState } from "./sim.js";
import { FlightRecorder, PHASE_LABEL } from "./flight.js";

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  amber: "\x1b[38;5;214m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
};

function banner() {
  console.log(
    `${C.amber}${C.bold}
  ███████╗██████╗ ██╗  ██╗   ██╗███╗   ██╗████████╗
  ██╔════╝██╔══██╗██║  ╚██╗ ██╔╝████╗  ██║╚══██╔══╝
  ███████╗██████╔╝██║   ╚████╔╝ ██╔██╗ ██║   ██║
  ╚════██║██╔═══╝ ██║    ╚██╔╝  ██║╚██╗██║   ██║
  ███████║██║     ███████╗██║   ██║ ╚████║   ██║
  ╚══════╝╚═╝     ╚══════╝╚═╝   ╚═╝  ╚═══╝   ╚═╝${C.reset}
  ${C.dim}ACARS v${CLIENT_VERSION} · MSFS 2020/2024${C.reset}
`,
  );
}

function describe(b: BookingSummary): string {
  const s = b.schedules;
  if (!s) return b.id;
  const std = s.std_utc.slice(0, 5);
  return `${s.flight_number.padEnd(8)} ${s.dep_icao} → ${s.arr_icao}  ${std}Z  ${String(s.distance_nm).padStart(5)} NM  ${b.aircraft_icao.padEnd(5)} ${b.pax} pax  ${C.dim}${b.flight_date}${C.reset}`;
}

async function main() {
  banner();

  const config = loadConfig();
  const api = new SplyntApi(config);

  console.log(`${C.dim}  Server:${C.reset} ${config.baseUrl}`);
  process.stdout.write(`${C.dim}  Autenticazione…${C.reset}`);

  const hs = await api.handshake();
  console.log(
    `\r  ${C.green}✓${C.reset} ${C.bold}${hs.pilot.callsign}${C.reset} · ${hs.pilot.rank} · ${hs.pilot.xp.toLocaleString("it-IT")} XP` +
      (hs.pilot.currentIcao ? ` · a ${hs.pilot.currentIcao}` : "") +
      "        ",
  );

  const flyable = hs.bookings.filter((b) => b.schedules);
  if (flyable.length === 0) {
    console.log(
      `\n  ${C.amber}Nessun volo in dispatch.${C.reset} Prendine uno dal tabellone su ${config.baseUrl}/board e riavvia.`,
    );
    process.exit(0);
  }

  console.log(`\n  ${C.bold}Voli prenotati${C.reset}`);
  flyable.forEach((b, i) => console.log(`   ${C.cyan}${i + 1}${C.reset}  ${describe(b)}`));

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let choice: BookingSummary | undefined;
  while (!choice) {
    const answer = await rl.question(`\n  Quale volo? [1-${flyable.length}] `);
    choice = flyable[Number(answer) - 1];
    if (!choice) console.log(`  ${C.red}Selezione non valida.${C.reset}`);
  }
  rl.close();

  const session = await api.startSession(choice.id);
  const sched = session.schedule;
  console.log(
    `\n  ${C.green}✓${C.reset} Sessione ${session.resumed ? "ripresa" : "aperta"} · ${C.bold}${sched.flight_number}${C.reset} ${sched.dep_icao} → ${sched.arr_icao}`,
  );
  if (session.airports.dep && session.airports.arr) {
    console.log(
      `    ${C.dim}${session.airports.dep.name}, ${session.airports.dep.city} → ${session.airports.arr.name}, ${session.airports.arr.city}${C.reset}`,
    );
  }

  process.stdout.write(`\n  ${C.dim}In attesa del simulatore…${C.reset}`);
  const { link, simName } = await connectToSim(onFrame);
  console.log(`\r  ${C.green}✓${C.reset} Connesso a ${simName}                    \n`);

  const recorder = new FlightRecorder((phase) => {
    console.log(`  ${C.cyan}▸${C.reset} ${PHASE_LABEL[phase]}`);
  });

  const buffer: TelemetryPoint[] = [];
  let lastSent = Date.now();
  let sending = false;
  let finalising = false;

  function onFrame(s: SimState) {
    recorder.update(s);

    buffer.push({
      ts: new Date().toISOString(),
      lat: s.lat,
      lon: s.lon,
      altitudeFt: Math.round(s.altitudeFt),
      gsKt: Math.round(s.gsKt),
      iasKt: Math.round(s.iasKt),
      vsFpm: Math.round(s.vsFpm),
      heading: Math.round(s.heading) % 360,
      fuelKg: Math.round(s.fuelKg),
      onGround: s.onGround,
      phase: recorder.phase,
    });

    render(s, recorder.phase);

    if (recorder.finished && !finalising) {
      finalising = true;
      void finalize();
      return;
    }

    if (
      !sending &&
      buffer.length > 0 &&
      Date.now() - lastSent > config.uploadIntervalSec * 1000
    ) {
      void flush();
    }
  }

  async function flush() {
    if (sending || buffer.length === 0) return;
    sending = true;
    const batch = buffer.splice(0, 240);
    try {
      await api.sendTelemetry(session.pirepId, batch, recorder.milestones);
      lastSent = Date.now();
    } catch (err) {
      // Keep the points so nothing is lost while the network is down.
      buffer.unshift(...batch);
      console.log(
        `\n  ${C.red}!${C.reset} Invio telemetria fallito: ${(err as Error).message}`,
      );
    } finally {
      sending = false;
    }
  }

  async function finalize() {
    console.log(`\n\n  ${C.dim}Ai blocchi. Archiviazione PIREP…${C.reset}`);
    await flush();

    const t = recorder.totals;
    const arrivalIcao = session.airports.arr?.icao;

    try {
      const result = await api.finalize({
        pirepId: session.pirepId,
        landingRateFpm: t.landingRateFpm ?? 0,
        fuelUsedKg: recorder.fuelUsedKg(),
        maxAltitudeFt: Math.round(t.maxAltitudeFt),
        maxG: Number(t.maxG.toFixed(2)),
        overspeedEvents: t.overspeedEvents,
        stallEvents: t.stallEvents,
        pauseEvents: link.pauseCount(),
        arrivalIcao,
        actualOut: recorder.milestones.out ?? null,
        actualOff: recorder.milestones.off ?? null,
        actualOn: recorder.milestones.on ?? null,
        actualIn: recorder.milestones.in ?? null,
      });

      console.log(`
  ${C.green}${C.bold}PIREP archiviato${C.reset}

    Punteggio      ${C.bold}${result.score}/100${C.reset}  (${result.grade})
    Atterraggio    ${t.landingRateFpm} fpm — ${result.landingQuality}
    Esperienza     ${C.amber}+${result.xpAwarded.toLocaleString("it-IT")} XP${C.reset}
`);
      for (const line of result.breakdown) {
        const amount =
          line.amount === 0
            ? "     "
            : `${line.amount > 0 ? "+" : ""}${line.amount}`.padStart(7);
        console.log(
          `    ${amount}  ${line.label}${line.detail ? ` ${C.dim}(${line.detail})${C.reset}` : ""}`,
        );
      }
      console.log(`\n  ${config.baseUrl}/logbook/${result.pirepId}\n`);
    } catch (err) {
      console.log(
        `\n  ${C.red}Archiviazione fallita:${C.reset} ${(err as Error).message}`,
      );
      console.log(
        `  ${C.dim}I dati di volo restano sul server: puoi ritentare riavviando il client.${C.reset}\n`,
      );
    } finally {
      link.close();
      process.exit(0);
    }
  }

  let lastRender = 0;
  function render(s: SimState, phase: string) {
    const now = Date.now();
    if (now - lastRender < 1000) return;
    lastRender = now;

    const line = [
      PHASE_LABEL[phase as keyof typeof PHASE_LABEL].padEnd(14),
      `${String(Math.round(s.altitudeFt)).padStart(6)} ft`,
      `${String(Math.round(s.iasKt)).padStart(4)} kt IAS`,
      `${String(Math.round(s.gsKt)).padStart(4)} kt GS`,
      `${s.vsFpm >= 0 ? "+" : ""}${Math.round(s.vsFpm)} fpm`.padStart(11),
      `${String(Math.round(s.fuelKg)).padStart(6)} kg`,
      buffer.length ? `${C.dim}${buffer.length} in coda${C.reset}` : "",
    ].join("  ");

    process.stdout.write(`\r  ${line}   `);
  }

  process.on("SIGINT", async () => {
    console.log(`\n\n  ${C.dim}Interruzione — invio dei dati residui…${C.reset}`);
    await flush();
    link.close();
    console.log(
      `  ${C.dim}Il volo resta aperto: riavvia il client per riprenderlo.${C.reset}\n`,
    );
    process.exit(0);
  });
}

main().catch((err: Error) => {
  console.error(`\n  ${C.red}${err.message}${C.reset}\n`);
  process.exit(1);
});
