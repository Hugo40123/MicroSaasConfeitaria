import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const placeholderUrl = "postgresql://user:password@localhost:5432";
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl || databaseUrl.startsWith(placeholderUrl)) {
  console.error("DATABASE_URL não aponta para um PostgreSQL real.");
  process.exit(1);
}

function getPgAdapterConnectionString(value) {
  const url = new URL(value);
  url.searchParams.delete("pgbouncer");

  return url.toString();
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getPgAdapterConnectionString(databaseUrl)
  })
});

try {
  await prisma.$queryRaw`SELECT 1`;
  const [stores, users, products, orders] = await Promise.all([
    prisma.store.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count()
  ]);

  console.log("Banco conectado com sucesso.");
  console.log(`Stores: ${stores}`);
  console.log(`Users: ${users}`);
  console.log(`Products: ${products}`);
  console.log(`Orders: ${orders}`);
} finally {
  await prisma.$disconnect();
}
