"use server";

import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/current-user";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function parseRequiredString(formData: FormData, field: string, label: string) {
  const value = getString(formData, field);

  if (!value) {
    throw new Error(`${label} é obrigatório.`);
  }

  return value;
}

function parseAmount(formData: FormData) {
  const value = Number(getString(formData, "amount").replace(",", "."));

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Informe um valor maior que zero.");
  }

  return Math.round(value * 100) / 100;
}

function parseDate(formData: FormData) {
  const date = getString(formData, "date");
  if (!date) return new Date();

  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Informe uma data válida.");
  }

  return parsedDate;
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para salvar movimentações.");
  }
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível salvar a movimentação.";
}

function redirectWithFinanceError(error: unknown): never {
  redirect(`/app/financeiro?financeError=${encodeURIComponent(getActionErrorMessage(error))}`);
}

function revalidateFinance() {
  revalidatePath("/app/financeiro");
  revalidatePath("/app/pedidos");
  revalidatePath("/app");
}

async function registerOrderIncome(
  tx: Prisma.TransactionClient,
  storeId: string,
  orderId: string,
  amount: number,
  date: Date,
  description: string
) {
  const order = await tx.order.findFirst({
    where: {
      id: orderId,
      storeId
    },
    select: {
      id: true,
      code: true,
      status: true,
      signalAmount: true,
      totalAmount: true
    }
  });

  if (!order) {
    throw new Error("Pedido não encontrado para esta loja.");
  }

  if (order.status === "CANCELLED") {
    throw new Error("Não é possível registrar pagamento em pedido cancelado.");
  }

  const currentPaidAmount = Number(order.signalAmount ?? 0);
  const nextPaidAmount = Math.round((currentPaidAmount + amount) * 100) / 100;
  const totalAmount = Number(order.totalAmount);
  const remainingAmount = Math.max(totalAmount - currentPaidAmount, 0);

  if (totalAmount > 0 && amount > remainingAmount) {
    throw new Error(
      `O valor informado passa do saldo restante do pedido ${order.code}.`
    );
  }

  await tx.financialTransaction.create({
    data: {
      storeId,
      type: "INCOME",
      amount,
      date,
      description: description || `Pagamento pedido ${order.code}`,
      orderId: order.id
    }
  });

  await tx.order.update({
    where: {
      id: order.id
    },
    data: {
      signalAmount: nextPaidAmount,
      signalPaid: totalAmount > 0 && nextPaidAmount >= totalAmount
    }
  });
}

export async function createFinancialTransactionAction(formData: FormData) {
  try {
    ensureDatabaseConfigured();

    const user = await requirePermission("view_finance");
    const type = getString(formData, "type") === "INCOME" ? "INCOME" : "EXPENSE";
    const description = parseRequiredString(formData, "description", "Descrição");
    const amount = parseAmount(formData);
    const date = parseDate(formData);

    await getPrismaClient().financialTransaction.create({
      data: {
        storeId: user.storeId,
        type,
        amount,
        date,
        description
      }
    });

    revalidateFinance();
  } catch (error) {
    redirectWithFinanceError(error);
  }

  redirect("/app/financeiro?financeSuccess=Movimenta%C3%A7%C3%A3o%20registrada%20com%20sucesso.");
}

export async function recordOrderPaymentAction(formData: FormData) {
  try {
    ensureDatabaseConfigured();

    const user = await requirePermission("view_finance");
    const orderId = parseRequiredString(formData, "orderId", "Pedido");
    const amount = parseAmount(formData);
    const date = parseDate(formData);
    const description = getString(formData, "description");

    await getPrismaClient().$transaction(async (tx) => {
      await registerOrderIncome(
        tx,
        user.storeId,
        orderId,
        amount,
        date,
        description
      );
    });

    revalidateFinance();
  } catch (error) {
    redirectWithFinanceError(error);
  }

  redirect("/app/financeiro?financeSuccess=Pagamento%20registrado%20com%20sucesso.");
}
