/**
 * Aircraft types available in MSFS 2020/2024 (stock or common add-ons),
 * with the rank level required to command them.
 */
export type AircraftClass =
  | "turboprop"
  | "regional"
  | "narrowbody"
  | "widebody"
  | "heavy";

export interface AircraftType {
  icao: string;
  name: string;
  manufacturer: string;
  klass: AircraftClass;
  pax: number;
  cruiseKt: number;
  rangeNm: number;
  mtowKg: number;
  minRank: number;
}

export const AIRCRAFT: AircraftType[] = [
  // Turboprop — rank 1
  { icao: "DH8D", name: "Dash 8 Q400", manufacturer: "De Havilland Canada", klass: "turboprop", pax: 78, cruiseKt: 360, rangeNm: 1100, mtowKg: 29574, minRank: 1 },
  { icao: "AT76", name: "ATR 72-600", manufacturer: "ATR", klass: "turboprop", pax: 72, cruiseKt: 275, rangeNm: 825, mtowKg: 23000, minRank: 1 },

  // Regional jets — rank 2
  { icao: "E190", name: "Embraer E190", manufacturer: "Embraer", klass: "regional", pax: 106, cruiseKt: 447, rangeNm: 2450, mtowKg: 51800, minRank: 2 },
  { icao: "E195", name: "Embraer E195-E2", manufacturer: "Embraer", klass: "regional", pax: 132, cruiseKt: 447, rangeNm: 2600, mtowKg: 61500, minRank: 2 },
  { icao: "CRJ9", name: "CRJ-900", manufacturer: "Bombardier", klass: "regional", pax: 90, cruiseKt: 447, rangeNm: 1550, mtowKg: 38330, minRank: 2 },

  // Narrowbody — rank 3
  { icao: "A319", name: "Airbus A319", manufacturer: "Airbus", klass: "narrowbody", pax: 144, cruiseKt: 447, rangeNm: 3700, mtowKg: 75500, minRank: 3 },
  { icao: "A320", name: "Airbus A320", manufacturer: "Airbus", klass: "narrowbody", pax: 180, cruiseKt: 447, rangeNm: 3300, mtowKg: 78000, minRank: 3 },
  { icao: "A20N", name: "Airbus A320neo", manufacturer: "Airbus", klass: "narrowbody", pax: 188, cruiseKt: 450, rangeNm: 3500, mtowKg: 79000, minRank: 3 },
  { icao: "A321", name: "Airbus A321", manufacturer: "Airbus", klass: "narrowbody", pax: 220, cruiseKt: 447, rangeNm: 3200, mtowKg: 93500, minRank: 3 },
  { icao: "A21N", name: "Airbus A321neo", manufacturer: "Airbus", klass: "narrowbody", pax: 244, cruiseKt: 450, rangeNm: 4000, mtowKg: 97000, minRank: 4 },
  { icao: "B738", name: "Boeing 737-800", manufacturer: "Boeing", klass: "narrowbody", pax: 189, cruiseKt: 450, rangeNm: 2935, mtowKg: 79015, minRank: 3 },
  { icao: "B38M", name: "Boeing 737 MAX 8", manufacturer: "Boeing", klass: "narrowbody", pax: 197, cruiseKt: 453, rangeNm: 3550, mtowKg: 82190, minRank: 3 },
  { icao: "B39M", name: "Boeing 737 MAX 9", manufacturer: "Boeing", klass: "narrowbody", pax: 220, cruiseKt: 453, rangeNm: 3300, mtowKg: 88314, minRank: 4 },
  { icao: "B752", name: "Boeing 757-200", manufacturer: "Boeing", klass: "narrowbody", pax: 200, cruiseKt: 458, rangeNm: 3900, mtowKg: 115680, minRank: 4 },

  // Widebody — rank 5
  { icao: "A332", name: "Airbus A330-200", manufacturer: "Airbus", klass: "widebody", pax: 256, cruiseKt: 470, rangeNm: 7250, mtowKg: 242000, minRank: 5 },
  { icao: "A333", name: "Airbus A330-300", manufacturer: "Airbus", klass: "widebody", pax: 277, cruiseKt: 470, rangeNm: 6350, mtowKg: 242000, minRank: 5 },
  { icao: "A339", name: "Airbus A330-900neo", manufacturer: "Airbus", klass: "widebody", pax: 287, cruiseKt: 475, rangeNm: 7200, mtowKg: 251000, minRank: 5 },
  { icao: "B763", name: "Boeing 767-300ER", manufacturer: "Boeing", klass: "widebody", pax: 269, cruiseKt: 470, rangeNm: 5980, mtowKg: 186880, minRank: 5 },
  { icao: "B788", name: "Boeing 787-8", manufacturer: "Boeing", klass: "widebody", pax: 248, cruiseKt: 488, rangeNm: 7355, mtowKg: 227930, minRank: 5 },
  { icao: "B789", name: "Boeing 787-9", manufacturer: "Boeing", klass: "widebody", pax: 296, cruiseKt: 488, rangeNm: 7635, mtowKg: 254000, minRank: 5 },

  // Heavy — rank 7
  { icao: "B77W", name: "Boeing 777-300ER", manufacturer: "Boeing", klass: "heavy", pax: 408, cruiseKt: 490, rangeNm: 7370, mtowKg: 351530, minRank: 7 },
  { icao: "B772", name: "Boeing 777-200LR", manufacturer: "Boeing", klass: "heavy", pax: 317, cruiseKt: 490, rangeNm: 8555, mtowKg: 347450, minRank: 7 },
  { icao: "A359", name: "Airbus A350-900", manufacturer: "Airbus", klass: "heavy", pax: 325, cruiseKt: 488, rangeNm: 8100, mtowKg: 280000, minRank: 7 },
  { icao: "A388", name: "Airbus A380-800", manufacturer: "Airbus", klass: "heavy", pax: 517, cruiseKt: 490, rangeNm: 8000, mtowKg: 575000, minRank: 8 },
];

export const RANKS = [
  { level: 1, name: "Cadet", minXp: 0, maxClass: "turboprop" as AircraftClass, perk: "Accesso alla flotta turboelica e alle rotte regionali" },
  { level: 2, name: "Second Officer", minXp: 1_500, maxClass: "regional" as AircraftClass, perk: "Sblocca i jet regionali (E190, CRJ900)" },
  { level: 3, name: "First Officer", minXp: 5_000, maxClass: "narrowbody" as AircraftClass, perk: "Sblocca A320 e 737 di linea" },
  { level: 4, name: "Senior First Officer", minXp: 13_000, maxClass: "narrowbody" as AircraftClass, perk: "Sblocca A321neo, 737 MAX 9, 757" },
  { level: 5, name: "Captain", minXp: 28_000, maxClass: "widebody" as AircraftClass, perk: "Comando widebody: A330, 767, 787" },
  { level: 6, name: "Senior Captain", minXp: 50_000, maxClass: "widebody" as AircraftClass, perk: "Rotte long-haul di punta e bonus XP +5%" },
  { level: 7, name: "Training Captain", minXp: 82_000, maxClass: "heavy" as AircraftClass, perk: "Sblocca 777, A350 e le rotte ultra long-haul" },
  { level: 8, name: "Fleet Commander", minXp: 130_000, maxClass: "heavy" as AircraftClass, perk: "Comando A380 e accesso completo al network" },
];
