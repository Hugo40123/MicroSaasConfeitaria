import type { Prisma, PrismaClient } from "@prisma/client";

type PricingClient = PrismaClient | Prisma.TransactionClient;

export type RecipeCostItem = {
  quantity: number;
  costPerUnit: number;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function calculateRecipeCost(items: RecipeCostItem[]) {
  return roundMoney(
    items.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0)
  );
}

export function calculateSuggestedPrice(cost: number | null, marginPercent: number) {
  if (cost === null || cost <= 0 || marginPercent <= 0) return null;
  if (marginPercent >= 100) return null;

  return roundMoney(cost / (1 - marginPercent / 100));
}

export async function recalculateProductPricing(
  client: PricingClient,
  storeId: string,
  productId: string
) {
  const product = await client.product.findFirst({
    where: {
      id: productId,
      storeId
    },
    select: {
      cost: true,
      marginPercent: true,
      recipeItems: {
        select: {
          quantity: true,
          ingredient: {
            select: {
              costPerUnit: true
            }
          }
        }
      }
    }
  });

  if (!product) return;

  const recipeItems = product.recipeItems.map((item) => ({
    quantity: Number(item.quantity),
    costPerUnit: Number(item.ingredient.costPerUnit)
  }));
  const autoCost = recipeItems.length > 0 ? calculateRecipeCost(recipeItems) : null;
  const manualCost = product.cost === null ? null : Number(product.cost);
  const effectiveCost = autoCost ?? manualCost;
  const marginPercent = Number(product.marginPercent);

  await client.product.updateMany({
    where: {
      id: productId,
      storeId
    },
    data: {
      costAutoCalculated: autoCost,
      suggestedPrice: calculateSuggestedPrice(effectiveCost, marginPercent)
    }
  });
}
