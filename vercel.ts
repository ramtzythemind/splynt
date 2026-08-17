import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    // Nightly refresh of the timetable from the configured flight provider.
    // Free tiers are small, so once a day is the right cadence.
    { path: "/api/cron/sync-flights", schedule: "0 3 * * *" },
  ],
};
