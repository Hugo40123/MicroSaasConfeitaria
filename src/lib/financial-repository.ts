import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { orders } from "@/lib/sample-data";

export type FinancialEntry = {
  id: string;
  date: string;
  type: "Entrada" | "Saída";
  description: string;
  amount: number;
};

export type FinancialSummary = {
  entries: number;
  exits: number;
  balance: number;
  transactions: FinancialEntry[];
};

const mockExpenses: FinancialEntry[] = [
  {
    id: "expense-1",
    date: "Hoje",
    type: "Saída",
    description: "Morango e leite condensado",
    amount: 64
  },
  {
    id: "expense-2",
    date: "Hoje",
    type: "Saída",
    description: "Embalagens",
    amount: 28
  }
];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function makeSummary(transactions: FinancialEntry[]): FinancialSummary {
  const entries = transactions
    .filter((transaction) => transaction.type === "Entrada")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const exits = transactions
    .filter((transaction) => transaction.type === "Saída")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    entries,
    exits,
    balance: entries - exits,
    transactions
  };
}

export async function getFinancialSummary(storeId: string): Promise<{
  data: FinancialSummary;
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    const orderEntries = orders.map((order) => ({
      id: `signal-${order.id}`,
      date: order.deliveryDate,
      type: "Entrada" as const,
      description: `Sinal pedido ${order.code}`,
      amount: order.paidSignal
    }));

    return {
      data: makeSummary([...orderEntries, ...mockExpenses]),
      source: "mock"
    };
  }

  const prisma = getPrismaClient();
  const [manualTransactions, signalOrders] = await Promise.all([
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
        signalAmount: {
          gt: 0
        }
      },
      orderBy: {
        orderedAt: "desc"
      },
      take: 80
    })
  ]);
  const transactions: FinancialEntry[] = [
    ...signalOrders.map((order) => ({
      id: `signal-${order.id}`,
      date: formatDate(order.orderedAt),
      type: "Entrada" as const,
      description: `Sinal pedido ${order.code}`,
      amount: Number(order.signalAmount ?? 0)
    })),
    ...manualTransactions.map((transaction) => ({
      id: transaction.id,
      date: formatDate(transaction.date),
      type: transaction.type === "INCOME" ? "Entrada" as const : "Saída" as const,
      description: transaction.description,
      amount: Number(transaction.amount)
    }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  return {
    data: makeSummary(transactions),
    source: "database"
  };
}
