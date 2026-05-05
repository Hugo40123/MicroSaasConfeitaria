import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { orders } from "@/lib/sample-data";

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  notes: string;
  orderCount: number;
  lastOrderCode: string;
};

const mockCustomers: CustomerSummary[] = [
  {
    id: "mock-ana",
    name: "Ana Paula",
    phone: "(11) 98888-1001",
    whatsapp: "(11) 98888-1001",
    address: "Retirada na loja",
    notes: "Gosta de bolos com pouco acucar.",
    orderCount: orders.filter((order) => order.customer === "Ana Paula").length,
    lastOrderCode: "BM-1042"
  },
  {
    id: "mock-camila",
    name: "Camila Rocha",
    phone: "(11) 97777-2202",
    whatsapp: "(11) 97777-2202",
    address: "Rua Primavera, 88",
    notes: "Prefere entrega pela manha.",
    orderCount: orders.filter((order) => order.customer === "Camila Rocha").length,
    lastOrderCode: "BM-1041"
  },
  {
    id: "mock-rafael",
    name: "Rafael Lima",
    phone: "(11) 96666-3303",
    whatsapp: "(11) 96666-3303",
    address: "Retirada na loja",
    notes: "Pedidos para eventos corporativos.",
    orderCount: orders.filter((order) => order.customer === "Rafael Lima").length,
    lastOrderCode: "BM-1040"
  }
];

export async function listCustomersForCurrentStore(storeId: string): Promise<{
  data: CustomerSummary[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: mockCustomers,
      source: "mock"
    };
  }

  const prisma = getPrismaClient();
  const customers = await prisma.customer.findMany({
    where: {
      storeId
    },
    include: {
      orders: {
        orderBy: {
          createdAt: "desc"
        },
        select: {
          code: true
        },
        take: 1
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
      lastOrderCode: customer.orders[0]?.code ?? "Sem pedidos"
    })),
    source: "database"
  };
}
