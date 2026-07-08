import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// On Vercel (serverless environment), the filesystem is read-only except for /tmp.
// We copy the template SQLite database to /tmp/dev.db at runtime so writes work.
if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
  const destDbPath = "/tmp/dev.db";
  const srcDbPath = path.join(process.cwd(), "dev.db");

  if (!fs.existsSync(destDbPath)) {
    try {
      if (fs.existsSync(srcDbPath)) {
        fs.copyFileSync(srcDbPath, destDbPath);
        fs.chmodSync(destDbPath, 0o666); // Grant read/write permissions
        console.log("Template dev.db copied to /tmp/dev.db successfully");
      } else {
        console.error("Template dev.db not found at:", srcDbPath);
      }
    } catch (err) {
      console.error("Failed to copy dev.db to /tmp:", err);
    }
  }

  // Force database URL to target the writable SQLite database in /tmp
  process.env.DATABASE_URL = "file:/tmp/dev.db";
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
