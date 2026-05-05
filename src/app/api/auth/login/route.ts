import {
  AuthValidationError,
  sessionCookieName,
  sessionMaxAgeSeconds,
  validateLoginPayload
} from "@/lib/auth";
import { loginStoreUser } from "@/lib/auth-service";
import { NextRequest, NextResponse } from "next/server";

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeSeconds,
    path: "/"
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const input = validateLoginPayload(payload);
    const result = await loginStoreUser(input);

    if (!result) {
      return NextResponse.json(
        {
          error: {
            message: "E-mail ou senha invalidos."
          }
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      data: {
        user: result.user
      },
      meta: {
        source: result.source,
        message:
          result.source === "database"
            ? "Login validado no banco."
            : "Login simulado enquanto DATABASE_URL nao aponta para um banco real."
      }
    });

    setSessionCookie(response, result.token);

    return response;
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return NextResponse.json(
        {
          error: {
            message: "Nao foi possivel entrar.",
            issues: error.issues
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          message: "Erro inesperado ao entrar."
        }
      },
      { status: 500 }
    );
  }
}
