"use server";

import { requirePermission } from "@/lib/current-user";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function parseAmount(formData: FormData) {
  const value = Number(getString(formData, "amount").replace(",", "."));

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Informe um valor maior que zero.");
  }

  return Math.round(value * 100) / 100;
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para salvar movimentacoes.");
  }
}

export async function createFinancialTransactionAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requirePermission("view_finance");
  const type = getString(formData, "type") === "INCOME" ? "INCOME" : "EXPENSE";
  const description = getString(formData, "description");
  const date = getString(formData, "date");

  if (description.length < 3) {
    throw new Error("Informe uma descricao.");
  }

  await getPrismaClient().financialTransaction.create({
    data: {
      storeId: user.storeId,
      type,
      amount: parseAmount(formData),
      date: date ? new Date(`${date}T00:00:00`) : new Date(),
      description
    }
  });

  revalidatePath("/app/financeiro");
}
