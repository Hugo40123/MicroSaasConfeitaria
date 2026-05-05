import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { orders, products } from "@/lib/sample-data";

export type ReportSummary = {
  orderCount: number;
  revenue: number;
  pendingCount: number;
  onlineProductCount: number;
  topProducts: {
    name: string;
    quantity: number;
  }[];
  statusCounts: {
    label: string;
    value: number;
  }[];
};

const statusLabels = {
  AWAITING_CONFIRMATION: "Aguardando confirmação",
  CONFIRMED: "Confirmado",
  PENDING: "Pendente",
  IN_PRODUCTION: "Em produção",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado"
} as const;

export async function getReportsForCurrentStore(storeId: string): Promise<{
  data: ReportSummary;
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: {
        orderCount: orders.length,
        revenue: orders.reduce((sum, order) => sum + order.total, 0),
        pendingCount: orders.filter(
          (order) => order.status === "aguardando_confirmacao"
        ).length,
        onlineProductCount: products.filter((product) => product.online).length,
        topProducts: [
          { name: "Bolo Ninho com Morango", quantity: 12 },
          { name: "Fatia Chocolate Cremoso", quantity: 9 },
          { name: "Brigadeiro Gourmet", quantity: 6 }
        ],
        statusCounts: [
          { label: "Aguardando confirmação", value: 1 },
          { label: "Em produção", value: 1 },
          { label: "Confirmado", value: 1 },
          { label: "Pronto", value: 1 }
        ]
      },
      source: "mock"
    };
  }

  const prisma = getPrismaClient();
  const [ordersData, onlineProductCount, topItems] = await Promise.all([
    prisma.order.findMany({
      where: {
        storeId
      },
      select: {
        status: true,
        totalAmount: true
      }
    }),
    prisma.product.count({
      where: {
        storeId,
        active: true,
        availableOnline: true
      }
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: {
        order: {
          storeId
        }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: "desc"
        }
      },
      take: 5
    })
  ]);
  const statusCountMap = new Map<string, number>();

  for (const order of ordersData) {
    statusCountMap.set(order.status, (statusCountMap.get(order.status) ?? 0) + 1);
  }

  return {
    data: {
      orderCount: ordersData.length,
      revenue: ordersData.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      pendingCount: statusCountMap.get("AWAITING_CONFIRMATION") ?? 0,
      onlineProductCount,
      topProducts: topItems.map((item) => ({
        name: item.productName,
        quantity: item._sum.quantity ?? 0
      })),
      statusCounts: [...statusCountMap.entries()].map(([status, value]) => ({
        label: statusLabels[status as keyof typeof statusLabels],
        value
      }))
    },
    source: "database"
  };
}
