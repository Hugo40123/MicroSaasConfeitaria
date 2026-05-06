import type { Prisma } from "@prisma/client";
import { orderStatusOptions } from "@/lib/order-persistence";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { orders } from "@/lib/sample-data";

export type CustomerFilters = {
  query?: string;
};

export type CustomerOrderHistory = {
  id: string;
  code: string;
  date: string;
  status: string;
  total: number;
  items: string;
};

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  notes: string;
  orderCount: number;
  lastOrderCode: string;
  orders: CustomerOrderHistory[];
};

const statusLabelByValue = new Map<string, string>(
  orderStatusOptions.map((status) => [status.value, status.label])
);

const statusLabelByUiStatus = {
  aguardando_confirmacao: "Aguardando confirmação",
  confirmado: "Confirmado",
  pendente: "Pendente",
  em_producao: "Em produção",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado"
} as const;

const mockCustomers: CustomerSummary[] = [
  {
    id: "mock-ana",
    name: "Ana Paula",
    phone: "(11) 98888-1001",
    whatsapp: "(11) 98888-1001",
    address: "Retirada na loja",
    notes: "Gosta de bolos com pouco acucar.",
    orderCount: orders.filter((order) => order.customer === "Ana Paula").length,
    lastOrderCode: "BM-1042",
    orders: orders
      .filter((order) => order.customer === "Ana Paula")
      .map((order) => ({
        id: order.id,
        code: order.code,
        date: order.deliveryDate,
        status: statusLabelByUiStatus[order.status],
        total: order.total,
        items: order.items.join(", ")
      }))
  },
  {
    id: "mock-camila",
    name: "Camila Rocha",
    phone: "(11) 97777-2202",
    whatsapp: "(11) 97777-2202",
    address: "Rua Primavera, 88",
    notes: "Prefere entrega pela manha.",
    orderCount: orders.filter((order) => order.customer === "Camila Rocha").length,
    lastOrderCode: "BM-1041",
    orders: orders
      .filter((order) => order.customer === "Camila Rocha")
      .map((order) => ({
        id: order.id,
        code: order.code,
        date: order.deliveryDate,
        status: statusLabelByUiStatus[order.status],
        total: order.total,
        items: order.items.join(", ")
      }))
  },
  {
    id: "mock-rafael",
    name: "Rafael Lima",
    phone: "(11) 96666-3303",
    whatsapp: "(11) 96666-3303",
    address: "Retirada na loja",
    notes: "Pedidos para eventos corporativos.",
    orderCount: orders.filter((order) => order.customer === "Rafael Lima").length,
    lastOrderCode: "BM-1040",
    orders: orders
      .filter((order) => order.customer === "Rafael Lima")
      .map((order) => ({
        id: order.id,
        code: order.code,
        date: order.deliveryDate,
        status: statusLabelByUiStatus[order.status],
        total: order.total,
        items: order.items.join(", ")
      }))
  }
];

function formatDate(value: Date | null) {
  if (!value) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function filterMockCustomers(filters?: CustomerFilters) {
  const query = filters?.query?.trim().toLowerCase();
  if (!query) return mockCustomers;

  return mockCustomers.filter((customer) => {
    const searchable = [
      customer.name,
      customer.phone,
      customer.whatsapp,
      customer.address,
      customer.notes
    ].join(" ").toLowerCase();

    return searchable.includes(query);
  });
}

function getCustomerWhere(storeId: string, filters?: CustomerFilters): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = {
    storeId
  };
  const query = filters?.query?.trim();

  if (query) {
    where.OR = [
      {
        name: {
          contains: query,
          mode: "insensitive"
        }
      },
      {
        phone: {
          contains: query
        }
      },
      {
        whatsapp: {
          contains: query
        }
      }
    ];
  }

  return where;
}

export async function listCustomersForCurrentStore(storeId: string, filters?: CustomerFilters): Promise<{
  data: CustomerSummary[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: filterMockCustomers(filters),
      source: "mock"
    };
  }

  const prisma = getPrismaClient();
  const customers = await prisma.customer.findMany({
    where: getCustomerWhere(storeId, filters),
    include: {
      orders: {
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          code: true,
          deliveryDate: true,
          status: true,
          totalAmount: true,
          items: {
            select: {
              productName: true
            }
          }
        },
        take: 5
      },
      _count: {
        select: {
          orders: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return {
    data: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      whatsapp: customer.whatsapp ?? customer.phone,
      address: customer.address ?? "",
      notes: customer.notes ?? "",
      orderCount: customer._count.orders,
      lastOrderCode: customer.orders[0]?.code ?? "Sem pedidos",
      orders: customer.orders.map((order) => ({
        id: order.id,
        code: order.code,
        date: formatDate(order.deliveryDate),
        status: statusLabelByValue.get(order.status) ?? order.status,
        total: Number(order.totalAmount),
        items: order.items.map((item) => item.productName).join(", ")
      }))
    })),
    source: "database"
  };
}
