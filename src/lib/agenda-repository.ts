import type { Prisma } from "@prisma/client";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { orders, productionAgenda, type OrderStatus } from "@/lib/sample-data";

export type AgendaOrder = {
  id: string;
  code: string;
  customer: string;
  items: string;
  deliveryDate: string;
  deliveryTime: string;
  fulfillment: string;
  status: OrderStatus;
  urgent: boolean;
};

const statusMap = {
  AWAITING_CONFIRMATION: "aguardando_confirmacao",
  CONFIRMED: "confirmado",
  PENDING: "pendente",
  IN_PRODUCTION: "em_producao",
  READY: "pronto",
  OUT_FOR_DELIVERY: "saiu_para_entrega",
  DELIVERED: "entregue",
  CANCELLED: "cancelado"
} as const satisfies Record<string, OrderStatus>;

const fulfillmentMap = {
  PICKUP: "Retirada",
  DELIVERY: "Entrega"
} as const;

type DbAgendaOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;

function formatDate(value: Date | null) {
  if (!value) return "Sem data";

  const today = new Date();
  const date = new Date(value);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (today.getTime() === date.getTime()) return "Hoje";

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (tomorrow.getTime() === date.getTime()) return "Amanha";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export async function listAgendaForCurrentStore(storeId: string): Promise<{
  data: AgendaOrder[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: orders.map((order) => ({
        id: order.id,
        code: order.code,
        customer: order.customer,
        items: order.items.join(", "),
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        fulfillment: order.fulfillment,
        status: order.status,
        urgent: Boolean(order.urgent)
      })),
      source: "mock"
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dbOrders: DbAgendaOrder[] = await getPrismaClient().order.findMany({
    where: {
      storeId,
      deliveryDate: {
        gte: today
      },
      status: {
        notIn: ["DELIVERED", "CANCELLED"]
      }
    },
    include: {
      items: true
    },
    orderBy: [
      {
        deliveryDate: "asc"
      },
      {
        deliveryTime: "asc"
      }
    ],
    take: 80
  });

  return {
    data: dbOrders.map((order) => ({
      id: order.id,
      code: order.code,
      customer: order.customerName,
      items: order.items.map((item) => item.productName).join(", "),
      deliveryDate: formatDate(order.deliveryDate),
      deliveryTime: order.deliveryTime ?? "A combinar",
      fulfillment: fulfillmentMap[order.fulfillmentType],
      status: statusMap[order.status],
      urgent: order.urgent
    })),
    source: "database"
  };
}

export function getMockProductionTimeline() {
  return productionAgenda;
}
