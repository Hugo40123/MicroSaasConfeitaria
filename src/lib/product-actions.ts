"use server";

import { requireAuthUser } from "@/lib/current-user";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import type { ProductCategoryValue } from "@/lib/product-repository";
import { revalidatePath } from "next/cache";

const productCategories = new Set<ProductCategoryValue>([
  "WHOLE_CAKE",
  "CAKE_SLICE",
  "SWEET",
  "EXTRA",
  "CUSTOM"
]);

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function parseRequiredString(formData: FormData, field: string, label: string) {
  const value = getString(formData, field);

  if (!value) {
    throw new Error(`${label} e obrigatorio.`);
  }

  return value;
}

function parseMoney(formData: FormData, field: string, label: string) {
  const rawValue = getString(formData, field).replace(",", ".");
  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} precisa ser maior que zero.`);
  }

  return Math.round(value * 100) / 100;
}

function parseOptionalMoney(formData: FormData, field: string, label: string) {
  const rawValue = getString(formData, field);
  if (!rawValue) return null;

  const value = Number(rawValue.replace(",", "."));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} nao pode ser negativo.`);
  }

  return Math.round(value * 100) / 100;
}

function parseOptionalInt(formData: FormData, field: string, label: string) {
  const rawValue = getString(formData, field);
  if (!rawValue) return null;

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} precisa ser um numero inteiro positivo.`);
  }

  return value;
}

function parseProductCategory(formData: FormData) {
  const category = getString(formData, "category") as ProductCategoryValue;

  if (!productCategories.has(category)) {
    throw new Error("Categoria invalida.");
  }

  return category;
}

function parseProductForm(formData: FormData) {
  return {
    name: parseRequiredString(formData, "name", "Nome"),
    category: parseProductCategory(formData),
    description: getString(formData, "description") || null,
    basePrice: parseMoney(formData, "basePrice", "Preco"),
    cost: parseOptionalMoney(formData, "cost", "Custo"),
    preparationHours: parseOptionalInt(
      formData,
      "preparationHours",
      "Prazo de preparo"
    ),
    minOrderNoticeDays: parseOptionalInt(
      formData,
      "minOrderNoticeDays",
      "Antecedencia minima"
    ),
    imageUrl: getString(formData, "imageUrl") || null,
    active: formData.get("active") === "on",
    availableOnline: formData.get("availableOnline") === "on"
  };
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para gravar produtos.");
  }
}

function revalidateProductViews(storeSlug: string) {
  revalidatePath("/app/produtos");
  revalidatePath(`/loja/${storeSlug}`);
}

export async function createProductAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requireAuthUser();
  const prisma = getPrismaClient();
  const input = parseProductForm(formData);

  await prisma.product.create({
    data: {
      storeId: user.storeId,
      ...input
    }
  });

  revalidateProductViews(user.storeSlug);
}

export async function updateProductAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requireAuthUser();
  const prisma = getPrismaClient();
  const productId = parseRequiredString(formData, "productId", "Produto");
  const input = parseProductForm(formData);

  await prisma.product.updateMany({
    where: {
      id: productId,
      storeId: user.storeId
    },
    data: input
  });

  revalidateProductViews(user.storeSlug);
}

export async function toggleProductActiveAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requireAuthUser();
  const prisma = getPrismaClient();
  const productId = parseRequiredString(formData, "productId", "Produto");
  const active = getString(formData, "active") === "true";

  await prisma.product.updateMany({
    where: {
      id: productId,
      storeId: user.storeId
    },
    data: {
      active
    }
  });

  revalidateProductViews(user.storeSlug);
}

export async function toggleProductOnlineAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requireAuthUser();
  const prisma = getPrismaClient();
  const productId = parseRequiredString(formData, "productId", "Produto");
  const availableOnline = getString(formData, "availableOnline") === "true";

  await prisma.product.updateMany({
    where: {
      id: productId,
      storeId: user.storeId
    },
    data: {
      availableOnline
    }
  });

  revalidateProductViews(user.storeSlug);
}
