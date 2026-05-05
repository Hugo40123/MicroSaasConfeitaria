import {
  createCustomerPortalOrder,
  listOrdersForCurrentStore
} from "@/lib/order-persistence";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import {
  OrderValidationError,
  parseCustomerOrderInput
} from "@/lib/order-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUserFromRequest();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          message: "Login necessário para listar pedidos."
        }
      },
      { status: 401 }
    );
  }

  const ordersResult = await listOrdersForCurrentStore(user.storeId);

  return NextResponse.json({
    data: ordersResult.data,
    meta: {
      source: ordersResult.source,
      message:
        ordersResult.source === "database"
          ? "Pedidos carregados do PostgreSQL."
          : "Usando dados mockados até DATABASE_URL apontar para um banco real."
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = parseCustomerOrderInput(body);
    const orderResult = await createCustomerPortalOrder(input);

    return NextResponse.json(
      {
        data: orderResult.data,
        meta: {
          source: orderResult.source,
          message:
            orderResult.source === "database"
              ? "Pedido gravado no PostgreSQL."
              : "Pedido validado no servidor. Persistência será usada quando DATABASE_URL apontar para um banco real."
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        {
          error: {
            message: "Não foi possível criar o pedido.",
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
