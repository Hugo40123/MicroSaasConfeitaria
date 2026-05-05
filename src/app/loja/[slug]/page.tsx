import { PublicStorefront } from "@/components/public-storefront";
import { listOnlineProductsForStore } from "@/lib/product-repository";
import { notFound } from "next/navigation";

export default async function StorePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const productsResult = await listOnlineProductsForStore(slug);

  if (!productsResult.found) {
    notFound();
  }

  return (
    <PublicStorefront
      products={productsResult.data}
      store={productsResult.store}
      source={productsResult.source}
    />
  );
}
