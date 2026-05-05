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
    preparationHours: 48,
    availableOnline: true
  },
  {
    id: "p2",
    name: "Fatia Chocolate Cremoso",
    category: "CAKE_SLICE",
    description: "Fatia alta com ganache cremosa e massa de cacau.",
    basePrice: 16,
    preparationHours: 0,
    availableOnline: true
  },
  {
    id: "p3",
    name: "Brigadeiro Gourmet",
    category: "SWEET",
    description: "Caixinha com 12 unidades de brigadeiro tradicional.",
    basePrice: 38,
    preparationHours: 24,
    availableOnline: true
  },
  {
    id: "p4",
    name: "Topper Personalizado",
    category: "EXTRA",
    description: "Topper simples para tema, nome ou idade.",
    basePrice: 24,
    preparationHours: 24,
    availableOnline: true
  },
  {
    id: "p5",
    name: "Bolo Red Velvet",
    category: "WHOLE_CAKE",
    description: "Massa vermelha, cream cheese suave e decoracao minimalista.",
    basePrice: 145,
    preparationHours: 72,
    availableOnline: true
  },
  {
    id: "p6",
    name: "Beijinho",
    category: "SWEET",
    description: "Caixinha com 15 unidades de beijinho com coco fresco.",
    basePrice: 42,
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
      preparationHours: product.preparationHours,
      active: true,
      availableOnline: product.availableOnline
    }
  });
}

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
