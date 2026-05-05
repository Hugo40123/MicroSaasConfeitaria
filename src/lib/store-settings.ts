import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { store as sampleStore } from "@/lib/sample-data";

export type StoreSettings = {
  name: string;
  publicSlug: string;
  phone: string;
  whatsapp: string;
  address: string;
  themePrimary: string;
  themePrimaryStrong: string;
  themeAccent: string;
  themeBackground: string;
  themeSoft: string;
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
        themePrimary: "#d79771",
        themePrimaryStrong: "#734939",
        themeAccent: "#f7b239",
        themeBackground: "#fff6e8",
        themeSoft: "#fff0da",
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
      themePrimary: true,
      themePrimaryStrong: true,
      themeAccent: true,
      themeBackground: true,
      themeSoft: true,
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
      themePrimary: store.themePrimary,
      themePrimaryStrong: store.themePrimaryStrong,
      themeAccent: store.themeAccent,
      themeBackground: store.themeBackground,
      themeSoft: store.themeSoft,
      onlineOrdersEnabled: store.onlineOrdersEnabled,
      pickupEnabled: store.pickupEnabled,
      deliveryEnabled: store.deliveryEnabled
    },
    source: "database"
  };
}
