import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

function makePrisma() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  // Supabase (y muchos hosts en la nube) requieren SSL.
  // Newer pg versions treat sslmode=require as verify-full, which rejects
  // Supabase's self-signed certificates. We strip sslmode from the URL and
  // handle SSL entirely through the pg Pool `ssl` option instead.
  const needsSsl = /supabase\.co|sslmode=require/i.test(connectionString);
  if (needsSsl) {
    connectionString = connectionString.replace(/[?&]sslmode=[^&]*/gi, (m) =>
      m.startsWith("?") ? "?" : "",
    );
    // Clean up leftover ?& or trailing ?
    connectionString = connectionString.replace(/\?&/, "?").replace(/\?$/, "");
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    ssl: needsSsl ? { rejectUnauthorized: process.env.NODE_ENV === "production" } : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalThis.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

