import type { Prisma } from "@prisma/client";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import {
  type DatabaseOrderStatus,
  addDaysToDateInput,
  formatDateInput,
  getTodayDateInput
} from "@/lib/order-persistence";
import { orders, productionAgenda, type OrderStatus } from "@/lib/sample-data";

export type AgendaOrder = {
  id: string;
  code: string;
  customer: string;
  items: string;
  deliveryDate: string;
  deliveryDateInput: string | null;
  deliveryTime: string;
  fulfillment: string;
  status: OrderStatus;
  urgent: boolean;
};

export type AgendaFilters = {
  date?: string;
  status?: DatabaseOrderStatus;
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

const activeProductionStatuses: DatabaseOrderStatus[] = [
  "AWAITING_CONFIRMATION",
  "CONFIRMED",
  "PENDING",
  "IN_PRODUCTION",
  "READY",
  "OUT_FOR_DELIVERY"
];

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

  if (tomorrow.getTime() === date.getTime()) return "Amanhã";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function getDateRange(value: string | undefined) {
  const dateInput = value || getTodayDateInput();
  const start = new Date(`${dateInput}T00:00:00`);

  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return {
    dateInput,
    start,
    end
  };
}

function filterMockAgenda(filters: AgendaFilters | undefined) {
  return orders
    .filter((order) => {
      if (filters?.status && order.status !== statusMap[filters.status]) {
        return false;
      }

      return true;
    })
    .map((order) => ({
      id: order.id,
      code: order.code,
      customer: order.customer,
      items: order.items.join(", "),
      deliveryDate: order.deliveryDate,
      deliveryDateInput: null,
      deliveryTime: order.deliveryTime,
      fulfillment: order.fulfillment,
      status: order.status,
      urgent: Boolean(order.urgent)
    }));
}

export async function listAgendaForCurrentStore(storeId: string, filters?: AgendaFilters): Promise<{
  data: AgendaOrder[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: filterMockAgenda(filters),
      source: "mock"
    };
  }

  const dateRange = getDateRange(filters?.date);
  const where: Prisma.OrderWhereInput = {
    storeId,
    status: filters?.status
      ? filters.status
      : {
          in: activeProductionStatuses
        }
  };

  if (dateRange) {
    where.deliveryDate = filters?.date
      ? {
          gte: dateRange.start,
          lt: dateRange.end
        }
      : {
          gte: dateRange.start
        };
  }

  const dbOrders: DbAgendaOrder[] = await getPrismaClient().order.findMany({
    where,
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
      deliveryDateInput: order.deliveryDate ? formatDateInput(order.deliveryDate) : null,
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

export function getAgendaDateNavigation(dateInput: string | undefined) {
  const parsedDate = dateInput ? new Date(`${dateInput}T00:00:00`) : null;
  const current =
    dateInput && parsedDate && !Number.isNaN(parsedDate.getTime())
      ? dateInput
      : getTodayDateInput();

  return {
    current,
    previous: addDaysToDateInput(current, -1),
    next: addDaysToDateInput(current, 1),
    today: getTodayDateInput()
  };
}
