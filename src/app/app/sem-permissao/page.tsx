import { requireAuthUser } from "@/lib/current-user";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function ForbiddenPage() {
  await requireAuthUser();

  return (
    <section className="panel empty-state">
      <span className="metric-icon" aria-hidden="true">
        <ShieldAlert />
      </span>
      <div>
        <p className="eyebrow">Sem permissão</p>
        <h1>Seu usuário não acessa esta área.</h1>
        <p className="lead">
          Peça para um administrador da loja liberar a função ou executar essa
          alteração por uma conta admin.
        </p>
      </div>
      <Link className="btn btn-primary" href="/app/pedidos">
        Voltar para pedidos
      </Link>
    </section>
  );
}
