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
type DatabasePaymentMethod = "CASH" | "PIX" | "CARD";
const paymentMethods = new Set<DatabasePaymentMethod>(["CASH", "PIX", "CARD"]);

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function parseOrderStatus(formData: FormData) {
  const status = getString(formData, "status") as DatabaseOrderStatus;

  if (!allowedStatuses.has(status)) {
    throw new Error("Status de pedido inválido.");
  }

  return status;
}

function parseRequiredString(formData: FormData, field: string, label: string) {
  const value = getString(formData, field);

  if (!value) {
    throw new Error(`${label} é obrigatório.`);
  }

  return value;
}

function parseQuantity(formData: FormData) {
  const quantity = Number(getString(formData, "quantity"));

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("A quantidade deve ficar entre 1 e 99.");
  }

  return quantity;
}

function parsePaymentMethod(formData: FormData) {
  const paymentMethod = getString(formData, "paymentMethod") as DatabasePaymentMethod;

  return paymentMethods.has(paymentMethod) ? paymentMethod : null;
}

function makeOrderCode() {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `BM-${suffix}`;
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
    throw new Error("Pedido inválido.");
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
    throw new Error("Pedido não encontrado para esta loja.");
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

export async function createInternalOrderAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requireAuthUser();
  const prisma = getPrismaClient();
  const productId = parseRequiredString(formData, "productId", "Produto");
  const customerName = parseRequiredString(formData, "customerName", "Cliente");
  const customerPhone = parseRequiredString(formData, "customerPhone", "Telefone")
    .replace(/\D/g, "");
  const fulfillmentType =
    getString(formData, "fulfillmentType") === "DELIVERY" ? "DELIVERY" : "PICKUP";
  const deliveryDate = parseRequiredString(formData, "deliveryDate", "Data");
  const deliveryTime = getString(formData, "deliveryTime") || null;
  const deliveryAddress = getString(formData, "deliveryAddress") || null;
  const internalNotes = getString(formData, "internalNotes") || null;
  const paymentMethod = parsePaymentMethod(formData);
  const quantity = parseQuantity(formData);

  if (customerPhone.length < 10) {
    throw new Error("Informe um telefone válido.");
  }

  const data = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: {
        id: productId,
        storeId: user.storeId,
        active: true
      }
    });

    if (!product) {
      throw new Error("Produto não encontrado para esta loja.");
    }

    const unitPrice = Number(product.basePrice);
    const totalAmount = unitPrice * quantity;
    const code = makeOrderCode();
    const customer = await tx.customer.upsert({
      where: {
        storeId_phone: {
          storeId: user.storeId,
          phone: customerPhone
        }
      },
      update: {
        name: customerName,
        whatsapp: customerPhone,
        address: deliveryAddress
      },
      create: {
        storeId: user.storeId,
        name: customerName,
        phone: customerPhone,
        whatsapp: customerPhone,
        address: deliveryAddress
      }
    });

    return tx.order.create({
      data: {
        storeId: user.storeId,
        customerId: customer.id,
        code,
        source: "INTERNAL",
        status: "CONFIRMED",
        fulfillmentType,
        deliveryDate: new Date(`${deliveryDate}T00:00:00`),
        deliveryTime,
        customerName,
        customerPhone,
        deliveryAddress,
        paymentMethod,
        internalNotes,
        totalAmount,
        publicTrackingCode: code,
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice,
            totalPrice: totalAmount
          }
        }
      },
      select: {
        publicTrackingCode: true
      }
    });
  });

  revalidatePath("/app");
  revalidatePath("/app/pedidos");
  revalidatePath("/app/agenda");
  revalidatePath(`/pedido/${data.publicTrackingCode}`);
}
