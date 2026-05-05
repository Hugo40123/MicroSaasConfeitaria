import { AppShell } from "@/components/app-shell";
import { requireAuthUser } from "@/lib/current-user";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthUser();

  return <AppShell user={user}>{children}</AppShell>;
}
