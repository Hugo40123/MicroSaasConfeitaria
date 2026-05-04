import { orders } from "@/lib/sample-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: orders,
    meta: {
      source: "mock",
      message: "Substituir por Prisma quando DATABASE_URL estiver configurada."
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  return NextResponse.json(
    {
      data: {
        code: "BM-1043",
        status: "aguardando_confirmacao",
        source: "customer_portal",
        ...body
      }
    },
    { status: 201 }
  );
}
