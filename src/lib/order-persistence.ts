import type { Order } from "@/lib/sample-data";
import { orders, store as sampleStore } from "@/lib/sample-data";
import {
  createCustomerPortalOrder as createMockCustomerPortalOrder,
  type CustomerOrderInput,
  type CustomerOrderResult,
  OrderValidationError
} from "@/lib/order-service";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

type DbOrder = Awaited<ReturnType<typeof getOrdersFromDatabase>>[number];

const statusMap = {
  AWAITING_CONFIRMATION: "aguardando_confirmacao",
  CONFIRMED: "confirmado",
  PENDING: "pendente",
  IN_PRODUCTION: "em_producao",
  READY: "pronto",
  OUT_FOR_DELIVERY: "saiu_para_entrega",
  DELIVERED: "entregue",
  CANCELLED: "cancelado"
} as const;

const sourceMap = {
  INTERNAL: "Pedido interno",
  CUSTOMER_PORTAL: "Portal do cliente"
} as const;

const fulfillmentMap = {
  PICKUP: "Retirada",
  DELIVERY: "Entrega"
} as const;

const toMoney = (value: unknown) => Number(value ?? 0);

const formatDeliveryDate = (value: Date | null) => {
  if (!value) return "Sem data";

  const today = new Date();
  const deliveryDate = new Date(value);
  today.setHours(0, 0, 0, 0);
  deliveryDate.setHours(0, 0, 0, 0);

  if (today.getTime() === deliveryDate.getTime()) return "Hoje";

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (tomorrow.getTime() === deliveryDate.getTime()) return "Amanha";

  return new Intl.DateTimeFormat("pt-BR").format(deliveryDate);
};

const makeOrderCode = () => {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `BM-${suffix}`;
};

function mapDbOrderToUiOrder(order: DbOrder): Order {
  return {
    id: order.id,
    code: order.code,
    customer: order.customerName,
    whatsapp: order.customerPhone,
    source: sourceMap[order.source],
    items: order.items.map((item) => item.productName),
    deliveryDate: formatDeliveryDate(order.deliveryDate),
    deliveryTime: order.deliveryTime ?? "A combinar",
    fulfillment: fulfillmentMap[order.fulfillmentType],
    status: statusMap[order.status],
    total: toMoney(order.totalAmount),
    paidSignal: toMoney(order.signalAmount),
    urgent: order.urgent
  };
}

async function getOrdersFromDatabase() {
  const prisma = getPrismaClient();
  const store = await prisma.store.findUnique({
    where: {
      publicSlug: sampleStore.slug
    },
    select: {
      id: true
    }
  });

  if (!store) return [];

  return prisma.order.findMany({
    where: {
      storeId: store.id
    },
    include: {
      items: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 50
  });
}

export async function listOrdersForCurrentStore(): Promise<{
  data: Order[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: orders,
      source: "mock"
    };
  }

  const dbOrders = await getOrdersFromDatabase();

  return {
    data: dbOrders.map(mapDbOrderToUiOrder),
    source: "database"
  };
}

export async function createCustomerPortalOrder(
  input: CustomerOrderInput
): Promise<{
  data: CustomerOrderResult;
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: createMockCustomerPortalOrder(input),
      source: "mock"
    };
  }

  const prisma = getPrismaClient();

  const data = await prisma.$transaction(async (tx) => {
    const store = await tx.store.findUnique({
      where: {
        publicSlug: input.storeSlug
      }
    });

    if (!store) {
      throw new OrderValidationError(["Loja nao encontrada."]);
    }

    if (!store.onlineOrdersEnabled) {
      throw new OrderValidationError(["A loja nao esta aceitando pedidos online."]);
    }

    if (input.fulfillment === "Entrega" && !store.deliveryEnabled) {
      throw new OrderValidationError(["A loja nao aceita entrega no momento."]);
    }

    if (input.fulfillment === "Retirada" && !store.pickupEnabled) {
      throw new OrderValidationError(["A loja nao aceita retirada no momento."]);
    }

    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const dbProducts = await tx.product.findMany({
      where: {
        storeId: store.id,
        id: {
          in: productIds
        },
        active: true,
        availableOnline: true
      }
    });
    const productsById = new Map(dbProducts.map((product) => [product.id, product]));

    if (productsById.size !== productIds.length) {
      throw new OrderValidationError([
        "Um produto do carrinho nao esta disponivel."
      ]);
    }

    const orderItems = input.items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new OrderValidationError([
          "Um produto do carrinho nao esta disponivel."
        ]);
      }

      const unitPrice = Number(product.basePrice);
      const totalPrice = unitPrice * item.quantity;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        customizationNotes: item.customizationNotes || undefined
      };
    });
    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const phone = input.customerWhatsapp.replace(/\D/g, "");
    const code = makeOrderCode();
    const customer = await tx.customer.upsert({
      where: {
        storeId_phone: {
          storeId: store.id,
          phone
        }
      },
      update: {
        name: input.customerName,
        whatsapp: input.customerWhatsapp,
        address: input.deliveryAddress
      },
      create: {
        storeId: store.id,
        name: input.customerName,
        phone,
        whatsapp: input.customerWhatsapp,
        address: input.deliveryAddress
      }
    });

    await tx.order.create({
      data: {
        storeId: store.id,
        customerId: customer.id,
        code,
        source: "CUSTOMER_PORTAL",
        status: "AWAITING_CONFIRMATION",
        fulfillmentType: input.fulfillment === "Entrega" ? "DELIVERY" : "PICKUP",
        deliveryDate: new Date(`${input.deliveryDate}T00:00:00`),
        customerName: input.customerName,
        customerPhone: phone,
        deliveryAddress: input.deliveryAddress,
        customerNotes: input.customerNotes,
        totalAmount,
        publicTrackingCode: code,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            customizationNotes: item.customizationNotes
          }))
        }
      }
    });

    return {
      code,
      trackingUrl: `/pedido/${code}`,
      status: "aguardando_confirmacao" as const,
      customerName: input.customerName,
      customerWhatsapp: input.customerWhatsapp,
      fulfillment: input.fulfillment,
      deliveryAddress: input.deliveryAddress,
      deliveryDate: input.deliveryDate,
      customerNotes: input.customerNotes,
      items: orderItems,
      totalAmount
    };
  });

  return {
    data,
    source: "database"
  };
}
