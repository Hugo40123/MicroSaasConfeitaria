"use server";

import { makeSlug } from "@/lib/auth";
import { requirePermission } from "@/lib/current-user";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function parseStoreSettings(formData: FormData) {
  const name = getString(formData, "name");
  const publicSlug = makeSlug(getString(formData, "publicSlug"));
  const phone = getString(formData, "phone");
  const whatsapp = getString(formData, "whatsapp").replace(/\D/g, "");
  const address = getString(formData, "address");

  if (name.length < 2) {
    throw new Error("Informe o nome da loja.");
  }

  if (publicSlug.length < 2) {
    throw new Error("Informe um link publico valido.");
  }

  return {
    name,
    publicSlug,
    phone: phone || null,
    whatsapp: whatsapp || null,
    address: address || null,
    onlineOrdersEnabled: formData.get("onlineOrdersEnabled") === "on",
    pickupEnabled: formData.get("pickupEnabled") === "on",
    deliveryEnabled: formData.get("deliveryEnabled") === "on"
  };
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para salvar configuracoes.");
  }
}

export async function updateStoreSettingsAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requirePermission("manage_settings");
  const prisma = getPrismaClient();
  const input = parseStoreSettings(formData);
  const existingSlug = await prisma.store.findUnique({
    where: {
      publicSlug: input.publicSlug
    },
    select: {
      id: true
    }
  });

  if (existingSlug && existingSlug.id !== user.storeId) {
    throw new Error("Esse link publico ja esta em uso.");
  }

  await prisma.store.update({
    where: {
      id: user.storeId
    },
    data: input
  });

  revalidatePath("/app");
  revalidatePath("/app/configuracoes");
  revalidatePath(`/loja/${user.storeSlug}`);
  revalidatePath(`/loja/${input.publicSlug}`);
}
