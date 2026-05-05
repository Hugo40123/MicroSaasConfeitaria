import type { Product, ProductCategory } from "@/lib/sample-data";
import { products as sampleProducts, store as sampleStore } from "@/lib/sample-data";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

const categoryMap = {
  WHOLE_CAKE: "Bolos inteiros",
  CAKE_SLICE: "Fatias",
  SWEET: "Doces",
  EXTRA: "Extras",
  CUSTOM: "Personalizados"
} as const satisfies Record<string, ProductCategory | "Personalizados">;

const fallbackArt = {
  "Bolos inteiros": {
    artBg: "#fde8f0",
    artShape: "#d9487d"
  },
  Fatias: {
    artBg: "#f3e7dd",
    artShape: "#6f3e2e"
  },
  Doces: {
    artBg: "#dcf8f3",
    artShape: "#118f84"
  },
  Extras: {
    artBg: "#e6f0ff",
    artShape: "#2f6fc3"
  },
  Personalizados: {
    artBg: "#fff4d6",
    artShape: "#b7791f"
  }
};

type DbProduct = Awaited<ReturnType<typeof getProductsFromDatabase>>[number];

const toPreparationText = (hours: number | null) => {
  if (!hours || hours <= 0) return "Pronta entrega";
  if (hours < 24) return `${hours} horas`;

  const days = Math.ceil(hours / 24);
  return days === 1 ? "1 dia" : `${days} dias`;
};

function mapDbProductToUiProduct(product: DbProduct): Product {
  const category = categoryMap[product.category] ?? "Extras";
  const art = fallbackArt[category];

  return {
    id: product.id,
    name: product.name,
    category: category === "Personalizados" ? "Extras" : category,
    description: product.description ?? "",
    price: Number(product.basePrice),
    preparationTime: toPreparationText(product.preparationHours),
    online: product.availableOnline,
    active: product.active,
    artBg: art.artBg,
    artShape: art.artShape
  };
}

async function getProductsFromDatabase() {
  const prisma = getPrismaClient();
  const store = await prisma.store.findUnique({
    where: {
      publicSlug: sampleStore.slug
    },
    select: {
      id: true
    }
  });

  if (!store) return [];

  return prisma.product.findMany({
    where: {
      storeId: store.id
    },
    orderBy: {
      name: "asc"
    }
  });
}

export async function listProductsForCurrentStore(): Promise<{
  data: Product[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: sampleProducts,
      source: "mock"
    };
  }

  const dbProducts = await getProductsFromDatabase();

  return {
    data: dbProducts.map(mapDbProductToUiProduct),
    source: "database"
  };
}

export async function listOnlineProductsForStore(): Promise<{
  data: Product[];
  source: "database" | "mock";
}> {
  const products = await listProductsForCurrentStore();

  return {
    data: products.data.filter((product) => product.active && product.online),
    source: products.source
  };
}
