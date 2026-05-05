import { logoutSession } from "@/lib/auth-service";
import { sessionCookieName } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;

  await logoutSession(token);

  const response = NextResponse.json({
    data: {
      ok: true
    }
  });

  response.cookies.delete(sessionCookieName);

  return response;
}
