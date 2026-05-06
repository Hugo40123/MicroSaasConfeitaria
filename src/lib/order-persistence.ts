import type { Order } from "@/lib/sample-data";
import { orders } from "@/lib/sample-data";
import type { Prisma } from "@prisma/client";
import {
  createCustomerPortalOrder as createMockCustomerPortalOrder,
  CUSTOMER_DELIVERY_FEE,
  type CustomerOrderInput,
  type CustomerOrderResult,
  OrderValidationError
} from "@/lib/order-service";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

type DbOrder = Awaited<ReturnType<typeof getOrdersFromDatabase>>[number];
type DbOrderForUi = DbOrder & {
  store?: {
    name: string;
    publicSlug: string;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
  };
};

export type DatabaseOrderStatus =
  | "AWAITING_CONFIRMATION"
  | "CONFIRMED"
  | "PENDING"
  | "IN_PRODUCTION"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type OrderFilters = {
  query?: string;
  status?: DatabaseOrderStatus;
  date?: string;
};

export const orderStatusOptions = [
  { value: "AWAITING_CONFIRMATION", label: "Aguardando confirmação" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "IN_PRODUCTION", label: "Em produção" },
  { value: "READY", label: "Pronto" },
  { value: "OUT_FOR_DELIVERY", label: "Saiu para entrega" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelado" }
] as const satisfies ReadonlyArray<{
  value: DatabaseOrderStatus;
  label: string;
}>;

const databaseOrderStatuses = new Set<DatabaseOrderStatus>(
  orderStatusOptions.map((status) => status.value)
);

export function parseDatabaseOrderStatus(value: string | undefined) {
  if (!value) return null;

  return databaseOrderStatuses.has(value as DatabaseOrderStatus)
    ? (value as DatabaseOrderStatus)
    : null;
}

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

export const uiToDatabaseStatusMap = {
  aguardando_confirmacao: "AWAITING_CONFIRMATION",
  confirmado: "CONFIRMED",
  pendente: "PENDING",
  em_producao: "IN_PRODUCTION",
  pronto: "READY",
  saiu_para_entrega: "OUT_FOR_DELIVERY",
  entregue: "DELIVERED",
  cancelado: "CANCELLED"
} as const satisfies Record<Order["status"], DatabaseOrderStatus>;

const sourceMap = {
  INTERNAL: "Pedido interno",
  CUSTOMER_PORTAL: "Portal do cliente"
} as const;

const fulfillmentMap = {
  PICKUP: "Retirada",
  DELIVERY: "Entrega"
} as const;

const paymentMethodMap = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CARD: "Cartão"
} as const;

const paymentMethodToDatabaseMap = {
  Dinheiro: "CASH",
  PIX: "PIX",
  Cartão: "CARD"
} as const;

const toMoney = (value: unknown) => Number(value ?? 0);

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateInput() {
  return formatDateInput(new Date());
}

export function addDaysToDateInput(value: string, days: number) {
  const date = parseDateInput(value) ?? new Date();
  date.setDate(date.getDate() + days);

  return formatDateInput(date);
}

function parseDateInput(value: string | undefined) {
  if (!value || !dateInputPattern.test(value)) return null;

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateRange(value: string | undefined) {
  const start = parseDateInput(value);
  if (!start) return null;

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
}

const formatDeliveryDate = (value: Date | null) => {
  if (!value) return "Sem data";

  const today = new Date();
  const deliveryDate = new Date(value);
  today.setHours(0, 0, 0, 0);
  deliveryDate.setHours(0, 0, 0, 0);

  if (today.getTime() === deliveryDate.getTime()) return "Hoje";

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (tomorrow.getTime() === deliveryDate.getTime()) return "Amanhã";

  return new Intl.DateTimeFormat("pt-BR").format(deliveryDate);
};

const makeOrderCode = () => {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `BM-${suffix}`;
};

function mapDbOrderToUiOrder(order: DbOrderForUi): Order {
  return {
    id: order.id,
    code: order.code,
    customer: order.customerName,
    whatsapp: order.customerPhone,
    source: sourceMap[order.source],
    items: order.items.map((item) => item.productName),
    deliveryDate: formatDeliveryDate(order.deliveryDate),
    deliveryDateInput: order.deliveryDate ? formatDateInput(order.deliveryDate) : undefined,
    deliveryTime: order.deliveryTime ?? "A combinar",
    deliveryAddress: order.deliveryAddress,
    fulfillment: fulfillmentMap[order.fulfillmentType],
    paymentMethod: order.paymentMethod ? paymentMethodMap[order.paymentMethod] : undefined,
    deliveryFee: toMoney(order.deliveryFee),
    status: statusMap[order.status],
    total: toMoney(order.totalAmount),
    paidSignal: toMoney(order.signalAmount),
    urgent: order.urgent,
    internalNotes: order.internalNotes,
    storeName: order.store?.name,
    storeSlug: order.store?.publicSlug,
    storePhone: order.store?.phone ?? order.store?.whatsapp ?? undefined,
    storeAddress: order.store?.address ?? undefined
  };
}

function makePendingTrackingOrder(code: string): Order {
  return {
    ...orders[0],
    id: code,
    code,
    customer: "Cliente",
    items: ["Pedido enviado pelo portal"],
    status: "aguardando_confirmacao",
    paymentMethod: "PIX",
    deliveryFee: 0,
    total: 0,
    paidSignal: 0
  };
}

function filterMockOrders(filters: OrderFilters | undefined) {
  const query = filters?.query?.trim().toLowerCase();

  return orders.filter((order) => {
    if (filters?.status && uiToDatabaseStatusMap[order.status] !== filters.status) {
      return false;
    }

    if (query) {
      const searchable = [
        order.code,
        order.customer,
        order.whatsapp,
        ...order.items
      ].join(" ").toLowerCase();

      if (!searchable.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

async function getOrdersFromDatabase(storeId: string, filters?: OrderFilters) {
  const prisma = getPrismaClient();
  const where: Prisma.OrderWhereInput = {
    storeId
  };
  const query = filters?.query?.trim();
  const dateRange = getDateRange(filters?.date);

  if (filters?.status) {
    where.status = filters.status;
  }

  if (dateRange) {
    where.deliveryDate = {
      gte: dateRange.start,
      lt: dateRange.end
    };
  }

  if (query) {
    where.OR = [
      {
        code: {
          contains: query,
          mode: "insensitive"
        }
      },
      {
        customerName: {
          contains: query,
          mode: "insensitive"
        }
      },
      {
        customerPhone: {
          contains: query
        }
      },
      {
        items: {
          some: {
            productName: {
              contains: query,
              mode: "insensitive"
            }
          }
        }
      }
    ];
  }

  return prisma.order.findMany({
    where,
    include: {
      items: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 50
  });
}

export async function listOrdersForCurrentStore(storeId: string, filters?: OrderFilters): Promise<{
  data: Order[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: filterMockOrders(filters),
      source: "mock"
    };
  }

  const dbOrders = await getOrdersFromDatabase(storeId, filters);

  return {
    data: dbOrders.map(mapDbOrderToUiOrder),
    source: "database"
  };
}

export async function getOrderByCodeForCurrentStore(code: string): Promise<{
  data: Order;
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: orders.find((order) => order.code === code) ?? makePendingTrackingOrder(code),
      source: "mock"
    };
  }

  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: {
      publicTrackingCode: code
    },
    include: {
      items: true,
      store: true
    }
  });

  return {
    data: order ? mapDbOrderToUiOrder(order) : makePendingTrackingOrder(code),
    source: order ? "database" : "mock"
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
      throw new OrderValidationError(["Loja não encontrada."]);
    }

    if (!store.onlineOrdersEnabled) {
      throw new OrderValidationError(["A loja não está aceitando pedidos online."]);
    }

    if (input.fulfillment === "Entrega" && !store.deliveryEnabled) {
      throw new OrderValidationError(["A loja não aceita entrega no momento."]);
    }

    if (input.fulfillment === "Retirada" && !store.pickupEnabled) {
      throw new OrderValidationError(["A loja não aceita retirada no momento."]);
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
        "Um produto do carrinho não está disponível."
      ]);
    }

    const orderItems = input.items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new OrderValidationError([
          "Um produto do carrinho não está disponível."
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
    const itemsAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee =
      input.fulfillment === "Entrega" ? CUSTOMER_DELIVERY_FEE : 0;
    const totalAmount = itemsAmount + deliveryFee;
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
        deliveryTime: input.deliveryTime,
        customerName: input.customerName,
        customerPhone: phone,
        deliveryAddress: input.deliveryAddress,
        deliveryFee,
        paymentMethod: paymentMethodToDatabaseMap[input.paymentMethod],
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
      deliveryTime: input.deliveryTime,
      paymentMethod: input.paymentMethod,
      deliveryFee,
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
