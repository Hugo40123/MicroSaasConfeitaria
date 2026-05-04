import { orders } from "@/lib/sample-data";
import {
  createCustomerPortalOrder,
  OrderValidationError,
  parseCustomerOrderInput
} from "@/lib/order-service";
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
  try {
    const body = await request.json();
    const input = parseCustomerOrderInput(body);
    const order = createCustomerPortalOrder(input);

    return NextResponse.json(
      {
        data: order,
        meta: {
          source: "mock",
          message:
            "Pedido validado no servidor. Persistencia com Prisma entra na proxima etapa."
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        {
          error: {
            message: "Nao foi possivel criar o pedido.",
            issues: error.issues
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          message: "Erro inesperado ao criar pedido."
        }
      },
      { status: 500 }
    );
  }
}
