import { AeroDataBoxProvider } from "./aerodatabox";
import { DatasetProvider } from "./dataset";
import { OpenSkyProvider } from "./opensky";
import type { FlightProvider } from "./types";

export * from "./types";
export { AeroDataBoxProvider, DatasetProvider, OpenSkyProvider };

const REGISTRY: Record<string, () => FlightProvider> = {
  dataset: () => new DatasetProvider(),
  aerodatabox: () => new AeroDataBoxProvider(),
  opensky: () => new OpenSkyProvider(),
};

export function providerNames(): string[] {
  return Object.keys(REGISTRY);
}

/**
 * Resolves a provider by name, falling back to `FLIGHT_PROVIDER` from the
 * environment and finally to the bundled dataset.
 */
export function getProvider(name?: string): FlightProvider {
  const key = (name ?? process.env.FLIGHT_PROVIDER ?? "dataset").toLowerCase();
  const factory = REGISTRY[key];
  if (!factory) {
    throw new Error(
      `Provider "${key}" sconosciuto. Disponibili: ${providerNames().join(", ")}`,
    );
  }
  return factory();
}

/** Every provider that currently has its credentials in place. */
export function configuredProviders(): FlightProvider[] {
  return Object.values(REGISTRY)
    .map((f) => f())
    .filter((p) => p.isConfigured());
}
