import { sessionCookieName } from "@/lib/auth";
import { getCurrentAuthUser } from "@/lib/auth-service";
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
