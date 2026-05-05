"use server";

import { requirePermission } from "@/lib/current-user";
import {
  ingredientUnitOptions,
  parseIngredientUnit
} from "@/lib/ingredient-repository";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { recalculateProductPricing } from "@/lib/pricing";
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

function parsePositiveDecimal(formData: FormData, field: string, label: string) {
  const value = Number(getString(formData, field).replace(",", "."));

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} precisa ser maior que zero.`);
  }

  return value;
}

function parseOptionalStock(formData: FormData, field: string, label: string) {
  const rawValue = getString(formData, field);
  if (!rawValue) return null;

  const value = Number(rawValue.replace(",", "."));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} não pode ser negativo.`);
  }

  return value;
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para salvar insumos.");
  }
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível salvar a ficha técnica.";
}

function redirectWithProductError(error: unknown): never {
  redirect(`/app/produtos?productError=${encodeURIComponent(getActionErrorMessage(error))}`);
}

function revalidateProducts() {
  revalidatePath("/app/produtos");
}

export async function createIngredientAction(formData: FormData) {
  try {
    ensureDatabaseConfigured();

    const user = await requirePermission("manage_products");
    const name = parseRequiredString(formData, "name", "Nome");
    const unit = parseIngredientUnit(getString(formData, "unit"));
    const costPerUnit = parsePositiveDecimal(formData, "costPerUnit", "Custo por unidade");
    const stockQuantity = parseOptionalStock(formData, "stockQuantity", "Estoque") ?? 0;
    const lowStockAlert = parseOptionalStock(formData, "lowStockAlert", "Alerta de estoque");

    if (!ingredientUnitOptions.some((option) => option.value === unit)) {
      throw new Error("Unidade de medida inválida.");
    }

    await getPrismaClient().ingredient.create({
      data: {
        storeId: user.storeId,
        name,
        unit,
        costPerUnit,
        stockQuantity,
        lowStockAlert
      }
    });

    revalidateProducts();
  } catch (error) {
    redirectWithProductError(error);
  }

  redirect("/app/produtos?productSuccess=Insumo%20criado%20com%20sucesso.");
}

export async function addRecipeItemAction(formData: FormData) {
  try {
    ensureDatabaseConfigured();

    const user = await requirePermission("manage_products");
    const productId = parseRequiredString(formData, "productId", "Produto");
    const ingredientId = parseRequiredString(formData, "ingredientId", "Insumo");
    const quantity = parsePositiveDecimal(formData, "quantity", "Quantidade");
    const prisma = getPrismaClient();

    await prisma.$transaction(async (tx) => {
      const [product, ingredient] = await Promise.all([
        tx.product.findFirst({
          where: {
            id: productId,
            storeId: user.storeId
          },
          select: {
            id: true
          }
        }),
        tx.ingredient.findFirst({
          where: {
            id: ingredientId,
            storeId: user.storeId
          },
          select: {
            id: true
          }
        })
      ]);

      if (!product) {
        throw new Error("Produto não encontrado para esta loja.");
      }

      if (!ingredient) {
        throw new Error("Insumo não encontrado para esta loja.");
      }

      await tx.productRecipeItem.upsert({
        where: {
          productId_ingredientId: {
            productId,
            ingredientId
          }
        },
        update: {
          quantity,
          storeId: user.storeId
        },
        create: {
          storeId: user.storeId,
          productId,
          ingredientId,
          quantity
        }
      });

      await recalculateProductPricing(tx, user.storeId, productId);
    });

    revalidateProducts();
  } catch (error) {
    redirectWithProductError(error);
  }

  redirect("/app/produtos?productSuccess=Ficha%20tecnica%20atualizada.");
}

export async function removeRecipeItemAction(formData: FormData) {
  try {
    ensureDatabaseConfigured();

    const user = await requirePermission("manage_products");
    const recipeItemId = parseRequiredString(formData, "recipeItemId", "Item da ficha");
    const prisma = getPrismaClient();

    await prisma.$transaction(async (tx) => {
      const recipeItem = await tx.productRecipeItem.findFirst({
        where: {
          id: recipeItemId,
          storeId: user.storeId
        },
        select: {
          id: true,
          productId: true
        }
      });

      if (!recipeItem) {
        throw new Error("Item da ficha técnica não encontrado.");
      }

      await tx.productRecipeItem.delete({
        where: {
          id: recipeItem.id
        }
      });

      await recalculateProductPricing(tx, user.storeId, recipeItem.productId);
    });

    revalidateProducts();
  } catch (error) {
    redirectWithProductError(error);
  }

  redirect("/app/produtos?productSuccess=Item%20removido%20da%20ficha%20tecnica.");
}
