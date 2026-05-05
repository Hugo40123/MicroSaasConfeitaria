"use client";

import { CakeSlice, LogIn, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthFormMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthFormMode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = isRegister
      ? {
          storeName: String(formData.get("storeName") ?? ""),
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? "")
        }
      : {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? "")
        };

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );
      const result = await response.json();

      if (!response.ok) {
        const issues = Array.isArray(result.error?.issues)
          ? result.error.issues.join(" ")
          : result.error?.message;
        setError(issues || "Não foi possível continuar.");
        return;
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("Não foi possível conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <span className="brand-mark">DM</span>
          <span className="brand-title">
            <strong>Doce Maria</strong>
            <span>Sistema para confeitarias</span>
          </span>
        </div>

        <div>
          <p className="eyebrow">{isRegister ? "Criar loja" : "Entrar"}</p>
          <h1>{isRegister ? "Comece sua loja online." : "Acesse o painel da loja."}</h1>
          <p className="lead">
            {isRegister
              ? "Cadastre a confeitaria e crie o usuário administrador."
              : "Entre para gerenciar pedidos, produtos, clientes e produção."}
          </p>
        </div>

        <form className="checkout-panel auth-card" onSubmit={submitForm}>
          {isRegister ? (
            <>
              <label className="field">
                <span>Nome da loja</span>
                <input className="input" name="storeName" required />
              </label>
              <label className="field">
                <span>Seu nome</span>
                <input className="input" name="name" required />
              </label>
            </>
          ) : null}

          <label className="field">
            <span>E-mail</span>
            <input className="input" name="email" required type="email" />
          </label>

          <label className="field">
            <span>Senha</span>
            <input className="input" minLength={isRegister ? 8 : 1} name="password" required type="password" />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="btn btn-primary" disabled={loading} type="submit">
            {isRegister ? <Store aria-hidden="true" /> : <LogIn aria-hidden="true" />}
            {loading ? "Aguarde..." : isRegister ? "Criar loja" : "Entrar"}
          </button>

          <Link className="btn btn-secondary" href={isRegister ? "/login" : "/cadastro"}>
            <CakeSlice aria-hidden="true" />
            {isRegister ? "Já tenho conta" : "Criar nova loja"}
          </Link>
        </form>
      </section>
    </main>
  );
}
