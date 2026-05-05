import { StatusBadge } from "@/components/status-badge";
import { getOrderByCodeForCurrentStore } from "@/lib/order-persistence";
import { store } from "@/lib/sample-data";
import { PackageCheck, Send, Store } from "lucide-react";
import Link from "next/link";

const timelineSteps = [
  {
    status: "aguardando_confirmacao",
    title: "Pedido enviado",
    description: "A loja recebeu sua solicitacao."
  },
  {
    status: "confirmado",
    title: "Pedido confirmado",
    description: "A equipe confirmou agenda, valor e disponibilidade."
  },
  {
    status: "em_producao",
    title: "Em producao",
    description: "Seu pedido esta sendo preparado."
  },
  {
    status: "pronto",
    title: "Pronto",
    description: "Retirada ou entrega liberada."
  },
  {
    status: "entregue",
    title: "Entregue",
    description: "Pedido concluido."
  }
] as const;

const statusStepIndex = {
  aguardando_confirmacao: 0,
  pendente: 0,
  confirmado: 1,
  em_producao: 2,
  pronto: 3,
  saiu_para_entrega: 3,
  entregue: 4,
  cancelado: -1
} as const;

export default async function TrackingPage({
  params
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const orderResult = await getOrderByCodeForCurrentStore(codigo);
  const order = orderResult.data;
  const storeName = order.storeName ?? store.name;
  const storeSlug = order.storeSlug ?? store.slug;
  const storePhone = order.storePhone ?? store.phone;
  const storeAddress = order.storeAddress ?? store.address;
  const whatsappDigits = storePhone.replace(/\D/g, "");
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits.startsWith("55") ? whatsappDigits : `55${whatsappDigits}`}`
    : "#";
  const currentStep = statusStepIndex[order.status];

  return (
    <main className="storefront">
      <section className="store-hero">
        <div className="store-banner">
          <div className="store-banner-inner">
            <p className="eyebrow">Acompanhamento</p>
            <h1>Pedido {order.code}</h1>
            <p>
              {order.customer} - {order.items.join(", ")} - {order.deliveryDate} as{" "}
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
            <p className="muted" style={{ marginBottom: "1rem" }}>
              Fonte do pedido:{" "}
              {orderResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
            </p>
            <div className="timeline">
              {order.status === "cancelado" ? (
                <div className="timeline-step current">
                  <span className="dot" aria-hidden="true" />
                  <div>
                    <p className="item-title">Pedido cancelado</p>
                    <p className="item-subtitle">
                      Entre em contato com a loja para combinar um novo pedido.
                    </p>
                  </div>
                </div>
              ) : (
                timelineSteps.map((step, index) => (
                  <div
                    className={`timeline-step ${
                      index < currentStep
                        ? "done"
                        : index === currentStep
                          ? "current"
                          : ""
                    }`}
                    key={step.status}
                  >
                    <span className="dot" aria-hidden="true" />
                    <div>
                      <p className="item-title">{step.title}</p>
                      <p className="item-subtitle">{step.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="checkout-panel">
            <div className="section-head">
              <h2>{storeName}</h2>
              <Store aria-hidden="true" />
            </div>
            <p className="muted">{storeAddress}</p>
            <div className="meta-row">
              <span className="badge neutral">{order.fulfillment}</span>
              <span className="badge neutral">{storePhone}</span>
            </div>
            <Link className="btn btn-primary" href={`/loja/${storeSlug}`}>
              <PackageCheck aria-hidden="true" />
              Fazer novo pedido
            </Link>
            <a className="btn btn-secondary" href={whatsappHref}>
              <Send aria-hidden="true" />
              Chamar loja
            </a>
          </aside>
        </section>
      </section>
    </main>
  );
}
