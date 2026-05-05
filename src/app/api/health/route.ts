import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { getStorageHealth } from "@/lib/upload-storage";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function checkDatabase() {
  if (!isDatabaseConfigured()) {
    return {
      configured: false,
      connected: false
    };
  }

  try {
    await getPrismaClient().$queryRaw`SELECT 1`;

    return {
      configured: true,
      connected: true
    };
  } catch {
    return {
      configured: true,
      connected: false
    };
  }
}

export async function GET() {
  const database = await checkDatabase();
  const storage = await getStorageHealth();
  const ready = database.connected && storage.configured;

  return NextResponse.json(
    {
      status: ready ? "ready" : "degraded",
      timestamp: new Date().toISOString(),
      app: {
        name: "confeitaria-saas",
        environment: process.env.NODE_ENV ?? "development"
      },
      database,
      storage
    },
    {
      status: ready ? 200 : 503
    }
  );
}
