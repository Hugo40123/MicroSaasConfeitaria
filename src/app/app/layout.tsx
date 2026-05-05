import { AppShell } from "@/components/app-shell";
import { sessionCookieName } from "@/lib/auth";
import { getCurrentAuthUser } from "@/lib/auth-service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  const user = await getCurrentAuthUser(token);

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
