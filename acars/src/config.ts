import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface Config {
  baseUrl: string;
  token: string;
  /** Seconds between telemetry uploads. */
  uploadIntervalSec: number;
  sim: "MSFS2020" | "MSFS2024";
}

export const CLIENT_VERSION = "1.0.0";

function loadEnvFile() {
  for (const file of [".env", ".env.local"]) {
    try {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (m?.[1] && !process.env[m[1]]) {
          process.env[m[1]] = (m[2] ?? "").trim().replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      // file absent — fine
    }
  }
}

export function loadConfig(): Config {
  loadEnvFile();

  const token = process.env.SPLYNT_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "SPLYNT_TOKEN mancante. Copia .env.example in .env e incolla il token generato in Splynt → Pilota.",
    );
  }
  if (!token.startsWith("splynt_")) {
    throw new Error("SPLYNT_TOKEN non valido: deve iniziare con 'splynt_'.");
  }

  const sim = (process.env.SPLYNT_SIM ?? "MSFS2024").toUpperCase();
  if (sim !== "MSFS2020" && sim !== "MSFS2024") {
    throw new Error("SPLYNT_SIM deve essere MSFS2020 o MSFS2024.");
  }

  return {
    baseUrl: (process.env.SPLYNT_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    token,
    uploadIntervalSec: Number(process.env.SPLYNT_UPLOAD_INTERVAL ?? 30),
    sim,
  };
}
