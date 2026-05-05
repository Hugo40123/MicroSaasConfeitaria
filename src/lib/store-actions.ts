"use server";

import { makeSlug } from "@/lib/auth";
import { requirePermission } from "@/lib/current-user";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function parseColor(formData: FormData, field: string, fallback: string) {
  const value = getString(formData, field);

  if (!value) return fallback;
  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error("Informe cores em formato hexadecimal válido.");
  }

  return value.toLowerCase();
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
    throw new Error("Informe um link público válido.");
  }

  return {
    name,
    publicSlug,
    phone: phone || null,
    whatsapp: whatsapp || null,
    address: address || null,
    themePrimary: parseColor(formData, "themePrimary", "#d79771"),
    themePrimaryStrong: parseColor(formData, "themePrimaryStrong", "#734939"),
    themeAccent: parseColor(formData, "themeAccent", "#f7b239"),
    themeBackground: parseColor(formData, "themeBackground", "#fff6e8"),
    themeSoft: parseColor(formData, "themeSoft", "#fff0da"),
    onlineOrdersEnabled: formData.get("onlineOrdersEnabled") === "on",
    pickupEnabled: formData.get("pickupEnabled") === "on",
    deliveryEnabled: formData.get("deliveryEnabled") === "on"
  };
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para salvar configurações.");
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
    throw new Error("Esse link público já está em uso.");
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
