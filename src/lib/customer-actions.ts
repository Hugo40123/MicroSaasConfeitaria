"use server";

import { requireAuthUser } from "@/lib/current-user";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Configure um PostgreSQL real para salvar clientes.");
  }
}

export async function updateCustomerAction(formData: FormData) {
  try {
    ensureDatabaseConfigured();

    const user = await requireAuthUser();
    const customerId = getString(formData, "customerId");
    const name = getString(formData, "name");
    const phone = getString(formData, "phone").replace(/\D/g, "");
    const whatsapp = getString(formData, "whatsapp").replace(/\D/g, "");
    const address = getString(formData, "address");
    const notes = getString(formData, "notes");

    if (!customerId) {
      throw new Error("Cliente inválido.");
    }

    if (name.length < 2) {
      throw new Error("Informe o nome do cliente.");
    }

    if (phone.length < 10) {
      throw new Error("Informe um telefone válido.");
    }

    const updatedCustomer = await getPrismaClient().customer.updateMany({
      where: {
        id: customerId,
        storeId: user.storeId
      },
      data: {
        name,
        phone,
        whatsapp: whatsapp || phone,
        address: address || null,
        notes: notes || null
      }
    });

    if (updatedCustomer.count === 0) {
      throw new Error("Cliente não encontrado para esta loja.");
    }

    revalidatePath("/app/clientes");
    revalidatePath("/app/pedidos");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar o cliente.";

    redirect(`/app/clientes?customerError=${encodeURIComponent(message)}`);
  }

  redirect("/app/clientes?customerSuccess=Cliente%20atualizado%20com%20sucesso.");
}
