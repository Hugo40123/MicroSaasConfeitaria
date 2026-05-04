import { StatusBadge } from "@/components/status-badge";
import { orders, store } from "@/lib/sample-data";
import { CheckCircle2, Clock3, PackageCheck, Send, Store } from "lucide-react";
import Link from "next/link";

export default async function TrackingPage({
  params
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const order = orders.find((item) => item.code === codigo) ?? orders[0];

  return (
    <main className="storefront">
      <section className="store-hero">
        <div className="store-banner">
          <div className="store-banner-inner">
            <p className="eyebrow">Acompanhamento</p>
            <h1>Pedido {order.code}</h1>
            <p>
              {order.customer} · {order.items.join(", ")} · {order.deliveryDate} às{" "}
              {order.deliveryTime}
            </p>
          </div>
        </div>

        <section className="split">
          <div className="panel">
            <div className="section-head">
              <h2>Status atual</h2>
              <StatusBadge status={order.status} />
            </div>
            <div className="timeline">
              <div className="timeline-step done">
                <span className="dot" aria-hidden="true" />
                <div>
                  <p className="item-title">Pedido enviado</p>
                  <p className="item-subtitle">A loja recebeu sua solicitação.</p>
                </div>
              </div>
              <div className="timeline-step current">
                <span className="dot" aria-hidden="true" />
                <div>
                  <p className="item-title">Aguardando confirmação</p>
                  <p className="item-subtitle">
                    A equipe revisa agenda, valor e sinal antes da produção.
                  </p>
                </div>
              </div>
              <div className="timeline-step">
                <span className="dot" aria-hidden="true" />
                <div>
                  <p className="item-title">Em produção</p>
                  <p className="item-subtitle">Seu pedido está sendo preparado.</p>
                </div>
              </div>
              <div className="timeline-step">
                <span className="dot" aria-hidden="true" />
                <div>
                  <p className="item-title">Pronto</p>
                  <p className="item-subtitle">Retirada ou entrega liberada.</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="checkout-panel">
            <div className="section-head">
              <h2>{store.name}</h2>
              <Store aria-hidden="true" />
            </div>
            <p className="muted">{store.address}</p>
            <div className="meta-row">
              <span className="badge neutral">{order.fulfillment}</span>
              <span className="badge neutral">{store.phone}</span>
            </div>
            <Link className="btn btn-primary" href="/loja/doce-maria">
              <PackageCheck aria-hidden="true" />
              Fazer novo pedido
            </Link>
            <a className="btn btn-secondary" href="https://wa.me/5511999992323">
              <Send aria-hidden="true" />
              Chamar loja
            </a>
          </aside>
        </section>
      </section>
    </main>
  );
}
