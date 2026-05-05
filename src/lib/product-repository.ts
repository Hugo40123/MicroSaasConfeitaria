import type { Product, ProductCategory } from "@/lib/sample-data";
import { products as sampleProducts, store as sampleStore } from "@/lib/sample-data";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

export type StoreProfile = typeof sampleStore;
export type ProductCategoryValue =
  | "WHOLE_CAKE"
  | "CAKE_SLICE"
  | "SWEET"
  | "EXTRA"
  | "CUSTOM";

export type AdminProduct = Product & {
  dbCategory: ProductCategoryValue;
  basePrice: number;
  cost: number | null;
  preparationHours: number | null;
  minOrderNoticeDays: number | null;
  imageUrl: string;
};

export const productCategoryOptions = [
  { value: "WHOLE_CAKE", label: "Bolos inteiros" },
  { value: "CAKE_SLICE", label: "Fatias" },
  { value: "SWEET", label: "Doces" },
  { value: "EXTRA", label: "Extras" },
  { value: "CUSTOM", label: "Personalizados" }
] as const satisfies ReadonlyArray<{
  value: ProductCategoryValue;
  label: ProductCategory | "Personalizados";
}>;

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

function mapDbProductToAdminProduct(product: DbProduct): AdminProduct {
  return {
    ...mapDbProductToUiProduct(product),
    dbCategory: product.category,
    basePrice: Number(product.basePrice),
    cost: product.cost === null ? null : Number(product.cost),
    preparationHours: product.preparationHours,
    minOrderNoticeDays: product.minOrderNoticeDays,
    imageUrl: product.imageUrl ?? ""
  };
}

function mapSampleProductToAdminProduct(product: Product): AdminProduct {
  const category = productCategoryOptions.find(
    (option) => option.label === product.category
  );

  return {
    ...product,
    dbCategory: category?.value ?? "EXTRA",
    basePrice: product.price,
    cost: null,
    preparationHours:
      product.preparationTime === "Pronta entrega"
        ? 0
        : Number(product.preparationTime.replace(/\D/g, "")) * 24 || null,
    minOrderNoticeDays: null,
    imageUrl: ""
  };
}

function mapDbStoreToStoreProfile(store: {
  name: string;
  publicSlug: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
}): StoreProfile {
  return {
    name: store.name,
    slug: store.publicSlug,
    phone: store.phone ?? store.whatsapp ?? "",
    address: store.address ?? "",
    description: sampleStore.description
  };
}

async function getProductsFromDatabase(storeId: string) {
  const prisma = getPrismaClient();

  return prisma.product.findMany({
    where: {
      storeId
    },
    orderBy: {
      name: "asc"
    }
  });
}

async function getOnlineProductsFromDatabase(storeSlug: string) {
  const prisma = getPrismaClient();
  const store = await prisma.store.findUnique({
    where: {
      publicSlug: storeSlug
    },
    include: {
      products: {
        where: {
          active: true,
          availableOnline: true
        },
        orderBy: {
          name: "asc"
        }
      }
    }
  });

  if (!store) return null;

  return {
    store: mapDbStoreToStoreProfile(store),
    products: store.products
  };
}

export async function listProductsForCurrentStore(storeId: string): Promise<{
  data: AdminProduct[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: sampleProducts.map(mapSampleProductToAdminProduct),
      source: "mock"
    };
  }

  const dbProducts = await getProductsFromDatabase(storeId);

  return {
    data: dbProducts.map(mapDbProductToAdminProduct),
    source: "database"
  };
}

export async function listOnlineProductsForStore(storeSlug: string): Promise<{
  data: Product[];
  store: StoreProfile;
  source: "database" | "mock";
  found: boolean;
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: sampleProducts.filter((product) => product.active && product.online),
      store: {
        ...sampleStore,
        slug: storeSlug || sampleStore.slug
      },
      source: "mock",
      found: true
    };
  }

  const result = await getOnlineProductsFromDatabase(storeSlug);

  if (!result) {
    return {
      data: [],
      store: {
        ...sampleStore,
        name: "Loja nao encontrada",
        slug: storeSlug
      },
      source: "database",
      found: false
    };
  }

  return {
    data: result.products.map(mapDbProductToUiProduct),
    store: result.store,
    source: "database",
    found: true
  };
}
