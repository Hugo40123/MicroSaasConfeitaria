"use server";

import { requireAuthUser } from "@/lib/current-user";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para salvar clientes.");
  }
}

export async function updateCustomerAction(formData: FormData) {
  ensureDatabaseConfigured();

  const user = await requireAuthUser();
  const customerId = getString(formData, "customerId");
  const name = getString(formData, "name");
  const whatsapp = getString(formData, "whatsapp");
  const address = getString(formData, "address");
  const notes = getString(formData, "notes");

  if (!customerId) {
    throw new Error("Cliente invalido.");
  }

  if (name.length < 2) {
    throw new Error("Informe o nome do cliente.");
  }

  await getPrismaClient().customer.updateMany({
    where: {
      id: customerId,
      storeId: user.storeId
    },
    data: {
      name,
      whatsapp: whatsapp || null,
      address: address || null,
      notes: notes || null
    }
  });

  revalidatePath("/app/clientes");
}
