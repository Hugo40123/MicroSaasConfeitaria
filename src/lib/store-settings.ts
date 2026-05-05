import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { store as sampleStore } from "@/lib/sample-data";

export type StoreSettings = {
  name: string;
  publicSlug: string;
  phone: string;
  whatsapp: string;
  address: string;
  onlineOrdersEnabled: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
};

export async function getStoreSettings(storeId: string): Promise<{
  data: StoreSettings;
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: {
        name: sampleStore.name,
        publicSlug: sampleStore.slug,
        phone: sampleStore.phone,
        whatsapp: sampleStore.phone,
        address: sampleStore.address,
        onlineOrdersEnabled: true,
        pickupEnabled: true,
        deliveryEnabled: true
      },
      source: "mock"
    };
  }

  const prisma = getPrismaClient();
  const store = await prisma.store.findUniqueOrThrow({
    where: {
      id: storeId
    },
    select: {
      name: true,
      publicSlug: true,
      phone: true,
      whatsapp: true,
      address: true,
      onlineOrdersEnabled: true,
      pickupEnabled: true,
      deliveryEnabled: true
    }
  });

  return {
    data: {
      name: store.name,
      publicSlug: store.publicSlug,
      phone: store.phone ?? "",
      whatsapp: store.whatsapp ?? "",
      address: store.address ?? "",
      onlineOrdersEnabled: store.onlineOrdersEnabled,
      pickupEnabled: store.pickupEnabled,
      deliveryEnabled: store.deliveryEnabled
    },
    source: "database"
  };
}
