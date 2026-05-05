import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

export type IngredientUnit = "g" | "kg" | "ml" | "l" | "un" | "cx";

export type IngredientSummary = {
  id: string;
  name: string;
  unit: IngredientUnit;
  costPerUnit: number;
  stockQuantity: number;
  lowStockAlert: number | null;
  lowStock: boolean;
};

export const ingredientUnitOptions = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "un", label: "un" },
  { value: "cx", label: "cx" }
] as const satisfies ReadonlyArray<{
  value: IngredientUnit;
  label: string;
}>;

function isIngredientUnit(value: string): value is IngredientUnit {
  return ingredientUnitOptions.some((option) => option.value === value);
}

export function parseIngredientUnit(value: string) {
  if (!isIngredientUnit(value)) {
    throw new Error("Unidade de medida inválida.");
  }

  return value;
}

export async function listIngredientsForCurrentStore(storeId: string): Promise<{
  data: IngredientSummary[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: [],
      source: "mock"
    };
  }

  const ingredients = await getPrismaClient().ingredient.findMany({
    where: {
      storeId
    },
    orderBy: {
      name: "asc"
    }
  });

  return {
    data: ingredients.map((ingredient) => {
      const stockQuantity = Number(ingredient.stockQuantity);
      const lowStockAlert =
        ingredient.lowStockAlert === null ? null : Number(ingredient.lowStockAlert);

      return {
        id: ingredient.id,
        name: ingredient.name,
        unit: parseIngredientUnit(ingredient.unit),
        costPerUnit: Number(ingredient.costPerUnit),
        stockQuantity,
        lowStockAlert,
        lowStock: lowStockAlert !== null && stockQuantity <= lowStockAlert
      };
    }),
    source: "database"
  };
}
