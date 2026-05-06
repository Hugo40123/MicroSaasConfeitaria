import type { Prisma } from "@prisma/client";
import { orderStatusOptions } from "@/lib/order-persistence";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { orders } from "@/lib/sample-data";

export type FinancialEntry = {
  id: string;
  date: string;
  type: "Entrada" | "Saída";
  description: string;
  amount: number;
  orderCode: string | null;
};

export type FinancialOrderOption = {
  id: string;
  code: string;
  customer: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  statusLabel: string;
};

export type FinancialSummary = {
  entries: number;
  exits: number;
  balance: number;
  estimatedProductCost: number;
  estimatedProfit: number;
  transactions: FinancialEntry[];
  payableOrders: FinancialOrderOption[];
};

const mockExpenses: FinancialEntry[] = [
  {
    id: "expense-1",
    date: "Hoje",
    type: "Saída",
    description: "Morango e leite condensado",
    amount: 64,
    orderCode: null
  },
  {
    id: "expense-2",
    date: "Hoje",
    type: "Saída",
    description: "Embalagens",
    amount: 28,
    orderCode: null
  }
];

type SortableFinancialEntry = FinancialEntry & {
  sortAt: number;
};

type DbOrderWithCost = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: true;
      };
    };
  };
}>;

const statusLabelByValue = new Map<string, string>(
  orderStatusOptions.map((status) => [status.value, status.label])
);

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function toMoney(value: unknown) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

function getEffectiveProductCost(product: DbOrderWithCost["items"][number]["product"]) {
  if (product.costAutoCalculated !== null) return Number(product.costAutoCalculated);
  if (product.cost !== null) return Number(product.cost);

  return 0;
}

function getOrderEstimatedCost(order: DbOrderWithCost) {
  return order.items.reduce(
    (sum, item) => sum + getEffectiveProductCost(item.product) * item.quantity,
    0
  );
}

function makeSummary(
  transactions: FinancialEntry[],
  estimatedProductCost: number,
  payableOrders: FinancialOrderOption[]
): FinancialSummary {
  const entries = transactions
    .filter((transaction) => transaction.type === "Entrada")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const exits = transactions
    .filter((transaction) => transaction.type === "Saída")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const balance = entries - exits;

  return {
    entries,
    exits,
    balance,
    estimatedProductCost,
    estimatedProfit: balance - estimatedProductCost,
    transactions,
    payableOrders
  };
}

export async function getFinancialSummary(storeId: string): Promise<{
  data: FinancialSummary;
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    const orderEntries: FinancialEntry[] = orders.map((order) => ({
      id: `signal-${order.id}`,
      date: order.deliveryDate,
      type: "Entrada" as const,
      description: `Sinal pedido ${order.code}`,
      amount: order.paidSignal,
      orderCode: order.code
    }));
    const payableOrders = orders
      .filter((order) => order.status !== "cancelado")
      .map((order) => ({
        id: order.id,
        code: order.code,
        customer: order.customer,
        totalAmount: order.total,
        paidAmount: order.paidSignal,
        remainingAmount: Math.max(order.total - order.paidSignal, 0),
        statusLabel: order.status
      }))
      .filter((order) => order.remainingAmount > 0);

    return {
      data: makeSummary([...orderEntries, ...mockExpenses], 0, payableOrders),
      source: "mock"
    };
  }

  const prisma = getPrismaClient();
  const [manualTransactions, orderOptions] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: {
        storeId
      },
      orderBy: {
        date: "desc"
      },
      take: 80
    }),
    prisma.order.findMany({
      where: {
        storeId,
        status: {
          not: "CANCELLED"
        }
      },
      select: {
        id: true,
        code: true,
        customerName: true,
        status: true,
        totalAmount: true,
        signalAmount: true
      },
      orderBy: {
        deliveryDate: "desc"
      },
      take: 100
    })
  ]);
  const linkedOrderIds = [
    ...new Set(
      manualTransactions
        .map((transaction) => transaction.orderId)
        .filter((orderId): orderId is string => Boolean(orderId))
    )
  ];
  const linkedOrders = linkedOrderIds.length
    ? await prisma.order.findMany({
        where: {
          storeId,
          id: {
            in: linkedOrderIds
          }
        },
        select: {
          id: true,
          code: true
        }
      })
    : [];
  const orderCodeById = new Map(
    linkedOrders.map((order) => [order.id, order.code])
  );
  const linkedIncomeByOrderId = new Map<string, number>();

  for (const transaction of manualTransactions) {
    if (transaction.type !== "INCOME" || !transaction.orderId) continue;

    linkedIncomeByOrderId.set(
      transaction.orderId,
      (linkedIncomeByOrderId.get(transaction.orderId) ?? 0) + Number(transaction.amount)
    );
  }

  const signalOrders = await prisma.order.findMany({
    where: {
      storeId,
      signalAmount: {
        gt: 0
      }
    },
    orderBy: {
      orderedAt: "desc"
    },
    take: 80
  });
  const legacySignalEntries = signalOrders.reduce<SortableFinancialEntry[]>(
    (entries, order) => {
      const linkedIncomeAmount = linkedIncomeByOrderId.get(order.id) ?? 0;
      const legacyAmount = Math.max(Number(order.signalAmount ?? 0) - linkedIncomeAmount, 0);

      if (legacyAmount <= 0) return entries;

      entries.push({
        id: `signal-${order.id}`,
        date: formatDate(order.orderedAt),
        type: "Entrada" as const,
        description: `Sinal anterior pedido ${order.code}`,
        amount: legacyAmount,
        orderCode: order.code,
        sortAt: order.orderedAt.getTime()
      });

      return entries;
    },
    []
  );
  const transactionEntries: SortableFinancialEntry[] = manualTransactions.map((transaction) => ({
    id: transaction.id,
    date: formatDate(transaction.date),
    type: transaction.type === "INCOME" ? "Entrada" as const : "Saída" as const,
    description: transaction.description,
    amount: Number(transaction.amount),
    orderCode: transaction.orderId ? orderCodeById.get(transaction.orderId) ?? null : null,
    sortAt: transaction.date.getTime()
  }));
  const transactions: FinancialEntry[] = [...legacySignalEntries, ...transactionEntries]
    .sort((a, b) => b.sortAt - a.sortAt)
    .map(({ sortAt: _sortAt, ...transaction }) => transaction);
  const paidAmountByOrderId = new Map<string, number>();

  for (const [orderId, amount] of linkedIncomeByOrderId) {
    paidAmountByOrderId.set(orderId, amount);
  }

  for (const order of signalOrders) {
    paidAmountByOrderId.set(
      order.id,
      Math.max(Number(order.signalAmount ?? 0), paidAmountByOrderId.get(order.id) ?? 0)
    );
  }

  const paidOrderIds = [...paidAmountByOrderId.keys()];
  const ordersWithCosts: DbOrderWithCost[] = paidOrderIds.length
    ? await prisma.order.findMany({
        where: {
          storeId,
          id: {
            in: paidOrderIds
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })
    : [];
  const estimatedProductCost = ordersWithCosts.reduce((sum, order) => {
    const paidAmount = paidAmountByOrderId.get(order.id) ?? 0;
    const totalAmount = Number(order.totalAmount);
    const paymentRatio = totalAmount > 0 ? Math.min(paidAmount / totalAmount, 1) : 1;

    return sum + getOrderEstimatedCost(order) * paymentRatio;
  }, 0);
  const payableOrders = orderOptions.map((order) => {
    const linkedPaidAmount = linkedIncomeByOrderId.get(order.id) ?? 0;
    const paidAmount = Math.max(Number(order.signalAmount ?? 0), linkedPaidAmount);
    const totalAmount = Number(order.totalAmount);

    return {
      id: order.id,
      code: order.code,
      customer: order.customerName,
      totalAmount,
      paidAmount,
      remainingAmount: Math.max(totalAmount - paidAmount, 0),
      statusLabel: statusLabelByValue.get(order.status) ?? order.status
    };
  }).filter((order) => order.remainingAmount > 0);

  return {
    data: makeSummary(
      transactions,
      toMoney(estimatedProductCost),
      payableOrders
    ),
    source: "database"
  };
}
