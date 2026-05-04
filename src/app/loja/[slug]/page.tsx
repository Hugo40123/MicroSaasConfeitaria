import { PublicStorefront } from "@/components/public-storefront";

export default async function StorePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;

  return <PublicStorefront />;
}
