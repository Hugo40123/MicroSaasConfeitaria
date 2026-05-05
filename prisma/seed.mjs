import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL precisa estar configurada para rodar o seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })
});

const store = await prisma.store.upsert({
  where: {
    publicSlug: "doce-maria"
  },
  update: {
    name: "Doce Maria",
    phone: "(11) 99999-2323",
    whatsapp: "5511999992323",
    address: "Rua das Flores, 120 - Centro",
    onlineOrdersEnabled: true,
    pickupEnabled: true,
    deliveryEnabled: true
  },
  create: {
    name: "Doce Maria",
    publicSlug: "doce-maria",
    phone: "(11) 99999-2323",
    whatsapp: "5511999992323",
    address: "Rua das Flores, 120 - Centro",
    onlineOrdersEnabled: true,
    pickupEnabled: true,
    deliveryEnabled: true
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

console.log("Seed concluido para a loja Doce Maria.");
