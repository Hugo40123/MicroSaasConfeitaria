import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { listOrdersForCurrentStore } from "@/lib/order-persistence";
import { formatCurrency, productionAgenda } from "@/lib/sample-data";
import {
  CalendarClock,
  ClipboardPlus,
  Clock3,
  PackageCheck,
  Plus,
  Store,
  WalletCards
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const ordersResult = await listOrdersForCurrentStore();
  const orders = ordersResult.data;
  const todayOrders = orders.filter((order) => order.deliveryDate === "Hoje");
  const pendingConfirmation = orders.filter(
    (order) => order.status === "aguardando_confirmacao"
  );
  const production = orders.filter((order) => order.status === "em_producao");
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.paidSignal, 0);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Resumo do dia</p>
          <h1>Pedidos, producao e caixa em uma tela so.</h1>
          <p className="lead">
            A loja ve o que precisa confirmar, produzir e entregar sem depender de
            caderno ou conversa perdida no WhatsApp.
          </p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte dos pedidos:{" "}
            {ordersResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
        </div>
        <div className="actions">
          <Link href="/app/pedidos" className="btn btn-primary">
            <ClipboardPlus aria-hidden="true" />
            Novo pedido
          </Link>
          <Link href="/loja/doce-maria" className="btn btn-secondary">
            <Store aria-hidden="true" />
            Ver portal
          </Link>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Indicadores">
        <MetricCard
          label="Pedidos hoje"
          value={String(todayOrders.length)}
          detail="Inclui retirada e entrega"
          icon={CalendarClock}
        />
        <MetricCard
          label="A confirmar"
          value={String(pendingConfirmation.length)}
          detail="Vieram pelo portal"
          icon={Clock3}
        />
        <MetricCard
          label="Em producao"
          value={String(production.length)}
          detail="Acompanhe a agenda"
          icon={PackageCheck}
        />
        <MetricCard
          label="Recebido hoje"
          value={formatCurrency(todayRevenue)}
          detail="Sinais e pedidos pagos"
          icon={WalletCards}
        />
      </section>

      <section className="split" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <div className="section-head">
            <h2>Pedidos que pedem atencao</h2>
            <Link href="/app/pedidos" className="icon-btn" title="Abrir pedidos">
              <Plus aria-hidden="true" />
            </Link>
          </div>
          <div className="list">
            {orders.slice(0, 3).map((order) => (
              <article className="item-card" key={order.id}>
                <div className="item-main">
                  <div>
                    <p className="item-title">
                      {order.code} - {order.customer}
                    </p>
                    <p className="item-subtitle">
                      {order.items.join(", ")} - {order.deliveryDate} as{" "}
                      {order.deliveryTime}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="meta-row">
                  <span className="badge neutral">{order.source}</span>
                  <span className="badge neutral">{order.fulfillment}</span>
                  {order.urgent ? <span className="badge cancelled">Urgente</span> : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Agenda de producao</h2>
            <Link href="/app/agenda" className="btn btn-secondary">
              Abrir agenda
            </Link>
          </div>
          <div className="timeline">
            {productionAgenda.map((item) => (
              <div
                className={`timeline-step ${
                  item.status === "pronto"
                    ? "done"
                    : item.status === "em_producao"
                      ? "current"
                      : ""
                }`}
                key={`${item.time}-${item.customer}`}
              >
                <span className="dot" aria-hidden="true" />
                <div>
                  <p className="item-title">
                    {item.time} - {item.title}
                  </p>
                  <p className="item-subtitle">{item.customer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
