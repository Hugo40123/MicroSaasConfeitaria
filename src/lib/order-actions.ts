"use server";

import { requireAuthUser } from "@/lib/current-user";
import {
  orderStatusOptions,
  type DatabaseOrderStatus
} from "@/lib/order-persistence";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const allowedStatuses = new Set<DatabaseOrderStatus>(
  orderStatusOptions.map((status) => status.value)
);

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function parseOrderStatus(formData: FormData) {
  const status = getString(formData, "status") as DatabaseOrderStatus;

  if (!allowedStatuses.has(status)) {
    throw new Error("Status de pedido invalido.");
  }

  return status;
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para alterar status de pedidos.");
  }
}

export async function updateOrderStatusAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requireAuthUser();
  const orderId = getString(formData, "orderId");
  const status = parseOrderStatus(formData);

  if (!orderId) {
    throw new Error("Pedido invalido.");
  }

  const prisma = getPrismaClient();
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      storeId: user.storeId
    },
    select: {
      publicTrackingCode: true
    }
  });

  if (!order) {
    throw new Error("Pedido nao encontrado para esta loja.");
  }

  await prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      status
    }
  });

  revalidatePath("/app");
  revalidatePath("/app/pedidos");
  revalidatePath("/app/agenda");
  revalidatePath(`/pedido/${order.publicTrackingCode}`);
}
