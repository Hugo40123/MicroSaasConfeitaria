import { PublicStorefront } from "@/components/public-storefront";
import { listOnlineProductsForStore } from "@/lib/product-repository";

export default async function StorePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  const productsResult = await listOnlineProductsForStore();

  return (
    <PublicStorefront
      products={productsResult.data}
      source={productsResult.source}
    />
  );
}
