"use server";

import { hashPassword, normalizeEmail, verifyPassword } from "@/lib/auth";
import { requireAuthUser, requirePermission } from "@/lib/current-user";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para gerenciar usuarios.");
  }
}

export async function createAttendantAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requirePermission("manage_settings");
  const name = getString(formData, "name");
  const email = normalizeEmail(formData.get("email"));
  const password = getString(formData, "password");

  if (name.length < 2) {
    throw new Error("Informe o nome do atendente.");
  }

  if (!email.includes("@") || email.length < 6) {
    throw new Error("Informe um e-mail válido.");
  }

  if (password.length < 8) {
    throw new Error("A senha temporaria precisa ter pelo menos 8 caracteres.");
  }

  await getPrismaClient().user.create({
    data: {
      storeId: user.storeId,
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "ATTENDANT"
    }
  });

  revalidatePath("/app/configuracoes");
}

export async function changeOwnPasswordAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requireAuthUser();
  const currentPassword = getString(formData, "currentPassword");
  const newPassword = getString(formData, "newPassword");

  if (newPassword.length < 8) {
    throw new Error("A nova senha precisa ter pelo menos 8 caracteres.");
  }

  const prisma = getPrismaClient();
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: {
      id: user.id
    },
    select: {
      passwordHash: true
    }
  });

  const validPassword = await verifyPassword(currentPassword, dbUser.passwordHash);
  if (!validPassword) {
    throw new Error("Senha atual inválida.");
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      passwordHash: await hashPassword(newPassword)
    }
  });
}
