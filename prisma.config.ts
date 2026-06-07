import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local first (Next.js convention), then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  datasource: {
    // For migrations/push, Prisma needs a direct connection (not PgBouncer).
    // DIRECT_URL bypasses the pooler; falls back to DATABASE_URL if not set.
    url: env("DIRECT_URL") || env("DATABASE_URL"),
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
