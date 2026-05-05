import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL precisa estar configurada para rodar o seed.");
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} precisa estar configurada para rodar o seed.`);
  }

  return value;
}

const seedStore = {
  name: process.env.SEED_STORE_NAME?.trim() || "Doce Maria",
  slug: process.env.SEED_STORE_SLUG?.trim() || "doce-maria",
  phone: process.env.SEED_STORE_PHONE?.trim() || "(11) 99999-2323",
  whatsapp: process.env.SEED_STORE_WHATSAPP?.trim() || "5511999992323",
  address: process.env.SEED_STORE_ADDRESS?.trim() || "Rua das Flores, 120 - Centro"
};

const seedAdmin = {
  name: process.env.SEED_ADMIN_NAME?.trim() || `Admin ${seedStore.name}`,
  email: process.env.SEED_ADMIN_EMAIL?.trim() || "admin@docemaria.local",
  password: requiredEnv("SEED_ADMIN_PASSWORD")
};

const seedAttendant = {
  name: process.env.SEED_ATTENDANT_NAME?.trim() || `Atendente ${seedStore.name}`,
  email: process.env.SEED_ATTENDANT_EMAIL?.trim() || "atendente@docemaria.local",
  password: requiredEnv("SEED_ATTENDANT_PASSWORD")
};

function getPgAdapterConnectionString(value) {
  const url = new URL(value);
  url.searchParams.delete("pgbouncer");

  return url.toString();
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getPgAdapterConnectionString(process.env.DATABASE_URL)
  })
});

const store = await prisma.store.upsert({
  where: {
    publicSlug: seedStore.slug
  },
  update: {
    name: seedStore.name,
    phone: seedStore.phone,
    whatsapp: seedStore.whatsapp,
    address: seedStore.address,
    onlineOrdersEnabled: true,
    pickupEnabled: true,
    deliveryEnabled: true
  },
  create: {
    name: seedStore.name,
    publicSlug: seedStore.slug,
    phone: seedStore.phone,
    whatsapp: seedStore.whatsapp,
    address: seedStore.address,
    onlineOrdersEnabled: true,
    pickupEnabled: true,
    deliveryEnabled: true
  }
});

const adminPasswordHash = await hashPassword(seedAdmin.password);
const attendantPasswordHash = await hashPassword(seedAttendant.password);

await prisma.user.upsert({
  where: {
    email: seedAdmin.email
  },
  update: {
    storeId: store.id,
    name: seedAdmin.name,
    passwordHash: adminPasswordHash,
    role: "ADMIN"
  },
  create: {
    storeId: store.id,
    name: seedAdmin.name,
    email: seedAdmin.email,
    passwordHash: adminPasswordHash,
    role: "ADMIN"
  }
});

await prisma.user.upsert({
  where: {
    email: seedAttendant.email
  },
  update: {
    storeId: store.id,
    name: seedAttendant.name,
    passwordHash: attendantPasswordHash,
    role: "ATTENDANT"
  },
  create: {
    storeId: store.id,
    name: seedAttendant.name,
    email: seedAttendant.email,
    passwordHash: attendantPasswordHash,
    role: "ATTENDANT"
  }
});

const products = [
  {
    id: "p1",
    name: "Bolo Ninho com Morango",
    category: "WHOLE_CAKE",
    description: "Massa branca, recheio de leite ninho e morangos frescos.",
    basePrice: 128,
    cost: 54,
    marginPercent: 58,
    preparationHours: 48,
    availableOnline: true
  },
  {
    id: "p2",
    name: "Fatia Chocolate Cremoso",
    category: "CAKE_SLICE",
    description: "Fatia alta com ganache cremosa e massa de cacau.",
    basePrice: 16,
    cost: 6.5,
    marginPercent: 55,
    preparationHours: 0,
    availableOnline: true
  },
  {
    id: "p3",
    name: "Brigadeiro Gourmet",
    category: "SWEET",
    description: "Caixinha com 12 unidades de brigadeiro tradicional.",
    basePrice: 38,
    cost: 14,
    marginPercent: 60,
    preparationHours: 24,
    availableOnline: true
  },
  {
    id: "p4",
    name: "Topper Personalizado",
    category: "EXTRA",
    description: "Topper simples para tema, nome ou idade.",
    basePrice: 24,
    cost: 7,
    marginPercent: 55,
    preparationHours: 24,
    availableOnline: true
  },
  {
    id: "p5",
    name: "Bolo Red Velvet",
    category: "WHOLE_CAKE",
    description: "Massa vermelha, cream cheese suave e decoracao minimalista.",
    basePrice: 145,
    cost: 62,
    marginPercent: 58,
    preparationHours: 72,
    availableOnline: true
  },
  {
    id: "p6",
    name: "Beijinho",
    category: "SWEET",
    description: "Caixinha com 15 unidades de beijinho com coco fresco.",
    basePrice: 42,
    cost: 16,
    marginPercent: 60,
    preparationHours: 24,
    availableOnline: false
  }
];

for (const product of products) {
  await prisma.product.upsert({
    where: {
      id: product.id
    },
    update: {
      storeId: store.id,
      name: product.name,
      category: product.category,
      description: product.description,
      basePrice: product.basePrice,
      cost: product.cost,
      marginPercent: product.marginPercent,
      preparationHours: product.preparationHours,
      active: true,
      availableOnline: product.availableOnline
    },
    create: {
      id: product.id,
      storeId: store.id,
      name: product.name,
      category: product.category,
      description: product.description,
      basePrice: product.basePrice,
      cost: product.cost,
      marginPercent: product.marginPercent,
      preparationHours: product.preparationHours,
      active: true,
      availableOnline: product.availableOnline
    }
  });
}

const ingredients = [
  {
    id: "ing-chocolate",
    name: "Chocolate meio amargo",
    unit: "g",
    costPerUnit: 0.08,
    stockQuantity: 3000,
    lowStockAlert: 500
  },
  {
    id: "ing-creme-leite",
    name: "Creme de leite",
    unit: "g",
    costPerUnit: 0.025,
    stockQuantity: 2000,
    lowStockAlert: 400
  }
];

for (const ingredient of ingredients) {
  await prisma.ingredient.upsert({
    where: {
      id: ingredient.id
    },
    update: {
      storeId: store.id,
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      stockQuantity: ingredient.stockQuantity,
      lowStockAlert: ingredient.lowStockAlert
    },
    create: {
      id: ingredient.id,
      storeId: store.id,
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      stockQuantity: ingredient.stockQuantity,
      lowStockAlert: ingredient.lowStockAlert
    }
  });
}

const recipeItems = [
  {
    id: "recipe-p2-chocolate",
    productId: "p2",
    ingredientId: "ing-chocolate",
    quantity: 90
  },
  {
    id: "recipe-p2-creme-leite",
    productId: "p2",
    ingredientId: "ing-creme-leite",
    quantity: 40
  }
];

for (const item of recipeItems) {
  await prisma.productRecipeItem.upsert({
    where: {
      id: item.id
    },
    update: {
      storeId: store.id,
      productId: item.productId,
      ingredientId: item.ingredientId,
      quantity: item.quantity
    },
    create: {
      id: item.id,
      storeId: store.id,
      productId: item.productId,
      ingredientId: item.ingredientId,
      quantity: item.quantity
    }
  });
}

const p2RecipeCost = (90 * 0.08) + (40 * 0.025);
await prisma.product.update({
  where: {
    id: "p2"
  },
  data: {
    costAutoCalculated: Math.round(p2RecipeCost * 100) / 100,
    suggestedPrice: Math.round((p2RecipeCost / (1 - 55 / 100)) * 100) / 100
  }
});

await prisma.storeSchedule.createMany({
  data: [1, 2, 3, 4, 5, 6].map((weekday) => ({
    storeId: store.id,
    weekday,
    opensAt: "09:00",
    closesAt: weekday === 6 ? "14:00" : "18:00",
    acceptsOrders: true
  })),
  skipDuplicates: true
});

await prisma.$disconnect();

console.log(`Seed concluido para a loja ${seedStore.name}.`);
