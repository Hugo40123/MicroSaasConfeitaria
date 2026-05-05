import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const placeholderUrl = "postgresql://user:password@localhost:5432";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim();
}

export function isDatabaseConfigured() {
  const databaseUrl = getDatabaseUrl();

  return Boolean(databaseUrl && !databaseUrl.startsWith(placeholderUrl));
}

export function getPgAdapterConnectionString(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete("pgbouncer");

  return url.toString();
}

export function getPrismaClient() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl || !isDatabaseConfigured()) {
    throw new Error("DATABASE_URL nao esta configurada para um banco real.");
  }

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({
      connectionString: getPgAdapterConnectionString(databaseUrl)
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}
