import { sessionCookieName } from "@/lib/auth";
import { getCurrentAuthUser } from "@/lib/auth-service";
import { type AppPermission, userCan } from "@/lib/permissions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getCurrentUserFromRequest = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  return getCurrentAuthUser(token);
});

export async function requireAuthUser() {
  const user = await getCurrentUserFromRequest();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePermission(permission: AppPermission) {
  const user = await requireAuthUser();

  if (!userCan(user, permission)) {
    redirect("/app/sem-permissao");
  }

  return user;
}
