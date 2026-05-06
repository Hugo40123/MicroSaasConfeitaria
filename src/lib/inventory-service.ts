import type { Prisma, PrismaClient } from "@prisma/client";

type InventoryClient = PrismaClient | Prisma.TransactionClient;

export const stockDeductionStatuses = new Set(["CONFIRMED", "IN_PRODUCTION"]);

type IngredientRequirement = {
  ingredientName: string;
  quantity: number;
};

export async function deductInventoryForOrder(
  client: InventoryClient,
  storeId: string,
  orderId: string
) {
  const order = await client.order.findFirst({
    where: {
      id: orderId,
      storeId
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              recipeItems: {
                include: {
                  ingredient: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!order || order.stockDeductedAt) return;

  const claimed = await client.order.updateMany({
    where: {
      id: orderId,
      storeId,
      stockDeductedAt: null
    },
    data: {
      stockDeductedAt: new Date()
    }
  });

  if (claimed.count === 0) return;

  const requirements = new Map<string, IngredientRequirement>();

  for (const orderItem of order.items) {
    for (const recipeItem of orderItem.product.recipeItems) {
      if (
        recipeItem.storeId !== storeId ||
        recipeItem.ingredient.storeId !== storeId
      ) {
        continue;
      }

      const current = requirements.get(recipeItem.ingredientId);
      const quantity = Number(recipeItem.quantity) * orderItem.quantity;

      requirements.set(recipeItem.ingredientId, {
        ingredientName: recipeItem.ingredient.name,
        quantity: (current?.quantity ?? 0) + quantity
      });
    }
  }

  if (requirements.size === 0) return;

  const ingredients = await client.ingredient.findMany({
    where: {
      storeId,
      id: {
        in: [...requirements.keys()]
      }
    },
    select: {
      id: true,
      name: true,
      stockQuantity: true
    }
  });
  const ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  for (const [ingredientId, requirement] of requirements) {
    const ingredient = ingredientsById.get(ingredientId);
    const stockQuantity = Number(ingredient?.stockQuantity ?? 0);

    if (!ingredient || stockQuantity < requirement.quantity) {
      throw new Error(
        `Estoque insuficiente para ${requirement.ingredientName}. Necessário: ${requirement.quantity}.`
      );
    }
  }

  for (const [ingredientId, requirement] of requirements) {
    await client.ingredient.updateMany({
      where: {
        id: ingredientId,
        storeId
      },
      data: {
        stockQuantity: {
          decrement: requirement.quantity
        }
      }
    });
  }
}
