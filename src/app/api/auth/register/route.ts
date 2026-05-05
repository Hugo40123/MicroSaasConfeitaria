import {
  AuthValidationError,
  sessionCookieName,
  sessionMaxAgeSeconds,
  validateRegisterPayload
} from "@/lib/auth";
import { registerStoreOwner } from "@/lib/auth-service";
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
    const input = validateRegisterPayload(payload);
    const result = await registerStoreOwner(input);
    const response = NextResponse.json(
      {
        data: {
          user: result.user
        },
        meta: {
          source: result.source,
          message:
            result.source === "database"
              ? "Loja e usuario admin criados no banco."
              : "Cadastro simulado enquanto DATABASE_URL nao aponta para um banco real."
        }
      },
      { status: 201 }
    );

    setSessionCookie(response, result.token);

    return response;
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return NextResponse.json(
        {
          error: {
            message: "Nao foi possivel cadastrar a loja.",
            issues: error.issues
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          message: "Erro inesperado ao cadastrar loja."
        }
      },
      { status: 500 }
    );
  }
}
