import { PrismaClient } from "@prisma/client";

// For PostgreSQL, we can isolate this project's database tables inside a separate database schema (namespace)
// named 'lacuna_booking'. This ensures we do not collide with or drop any existing tables (like chatbot tables in the public schema)
// in the user's shared database.
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  if (!url.includes("schema=")) {
    const separator = url.includes("?") ? "&" : "?";
    process.env.DATABASE_URL = `${url}${separator}schema=lacuna_booking`;
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
