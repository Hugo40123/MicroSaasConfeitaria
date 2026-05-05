import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} precisa estar configurada.`);
  }

  return value;
}

function optionalEnv(name) {
  return process.env[name]?.trim() || null;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

function getPgAdapterConnectionString(value) {
  const url = new URL(value);
  url.searchParams.delete("pgbouncer");

  return url.toString();
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getPgAdapterConnectionString(requiredEnv("DATABASE_URL"))
  })
});

const usersToRotate = [
  {
    email: requiredEnv("ROTATE_ADMIN_EMAIL"),
    password: requiredEnv("ROTATE_ADMIN_PASSWORD")
  },
  {
    email: optionalEnv("ROTATE_ATTENDANT_EMAIL"),
    password: optionalEnv("ROTATE_ATTENDANT_PASSWORD")
  }
].filter((user) => user.email && user.password);

if (usersToRotate.length === 0) {
  throw new Error("Nenhum usuario informado para rotacao.");
}

for (const user of usersToRotate) {
  await prisma.user.update({
    where: {
      email: user.email
    },
    data: {
      passwordHash: await hashPassword(user.password)
    }
  });

  console.log(`Senha rotacionada para ${user.email}.`);
}

await prisma.$disconnect();
