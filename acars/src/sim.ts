import {
  open,
  Protocol,
  SimConnectDataType,
  SimConnectPeriod,
  SimConnectConstants,
  type SimConnectConnection,
} from "node-simconnect";

/** One frame of aircraft state, in the units Splynt records. */
export interface SimState {
  lat: number;
  lon: number;
  altitudeFt: number;
  gsKt: number;
  iasKt: number;
  vsFpm: number;
  heading: number;
  fuelKg: number;
  onGround: boolean;
  gForce: number;
  overspeed: boolean;
  stall: boolean;
  title: string;
}

const DEF_AIRCRAFT = 1;
const REQ_AIRCRAFT = 1;
const EVENT_PAUSE = 1;

/**
 * The SimVars are read in this exact order — `readFloat64` consumes the buffer
 * sequentially, so this list and the parser below must stay in lockstep.
 */
const VARS: [name: string, unit: string][] = [
  ["PLANE LATITUDE", "degrees"],
  ["PLANE LONGITUDE", "degrees"],
  ["PLANE ALTITUDE", "feet"],
  ["GROUND VELOCITY", "knots"],
  ["AIRSPEED INDICATED", "knots"],
  ["VERTICAL SPEED", "feet per minute"],
  ["PLANE HEADING DEGREES TRUE", "degrees"],
  ["FUEL TOTAL QUANTITY WEIGHT", "kilograms"],
  ["SIM ON GROUND", "bool"],
  ["G FORCE", "gforce"],
  ["OVERSPEED WARNING", "bool"],
  ["STALL WARNING", "bool"],
];

export interface SimLink {
  /** Latest frame, or null before the first one arrives. */
  state(): SimState | null;
  /** Number of times the sim was paused since connecting. */
  pauseCount(): number;
  close(): void;
}

export async function connectToSim(
  onFrame: (state: SimState) => void,
): Promise<{ link: SimLink; simName: string }> {
  const { recvOpen, handle } = await open("Splynt ACARS", Protocol.KittyHawk);

  let latest: SimState | null = null;
  let pauses = 0;
  let title = "";

  for (const entry of VARS) {
    handle.addToDataDefinition(
      DEF_AIRCRAFT,
      entry[0],
      entry[1],
      SimConnectDataType.FLOAT64,
    );
  }
  // Aircraft title comes last so it can be read after the numeric block.
  handle.addToDataDefinition(
    DEF_AIRCRAFT,
    "TITLE",
    null,
    SimConnectDataType.STRING256,
  );

  handle.requestDataOnSimObject(
    REQ_AIRCRAFT,
    DEF_AIRCRAFT,
    SimConnectConstants.OBJECT_ID_USER,
    SimConnectPeriod.SECOND,
  );

  handle.subscribeToSystemEvent(EVENT_PAUSE, "Pause");

  handle.on("simObjectData", (recv) => {
    if (recv.requestID !== REQ_AIRCRAFT) return;

    const n = () => recv.data.readFloat64();
    const state: SimState = {
      lat: n(),
      lon: n(),
      altitudeFt: n(),
      gsKt: n(),
      iasKt: n(),
      vsFpm: n(),
      heading: n(),
      fuelKg: n(),
      onGround: n() > 0.5,
      gForce: n(),
      overspeed: n() > 0.5,
      stall: n() > 0.5,
      title,
    };
    try {
      title = recv.data.readString256().trim();
      state.title = title;
    } catch {
      // some aircraft do not publish a title — keep the previous one
    }

    latest = state;
    onFrame(state);
  });

  handle.on("event", (recv) => {
    // dwData is 1 when the sim enters pause, 0 when it resumes.
    if (recv.clientEventId === EVENT_PAUSE && recv.data === 1) pauses++;
  });

  handle.on("exception", (recv) => {
    console.warn(`  ! SimConnect exception ${recv.exception}`);
  });

  return {
    simName: recvOpen.applicationName,
    link: {
      state: () => latest,
      pauseCount: () => pauses,
      close: () => closeQuietly(handle),
    },
  };
}

function closeQuietly(handle: SimConnectConnection) {
  try {
    handle.close();
  } catch {
    // already gone
  }
}
