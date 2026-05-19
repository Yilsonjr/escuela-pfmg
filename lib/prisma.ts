import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

function makePrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }
  // Supabase (y muchos hosts en la nube) requieren SSL; la URI suele traer ?sslmode=require
  const needsSsl = /supabase\.co|sslmode=require/i.test(connectionString);
  const pool = new Pool({
    connectionString,
    max: 10,
    ssl: needsSsl ? { rejectUnauthorized: true } : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalThis.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

