import { StatusBadge } from "@/components/status-badge";
import { orders, productionAgenda } from "@/lib/sample-data";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export default function AgendaPage() {
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Agenda de produção</p>
          <h1>Volume do dia separado por horário e entrega.</h1>
          <p className="lead">
            A equipe vê rapidamente o que preparar, o que já está pronto e quais
            encomendas ainda precisam de confirmação.
          </p>
        </div>
        <div className="actions">
          <button className="icon-btn" title="Dia anterior" type="button">
            <ChevronLeft aria-hidden="true" />
          </button>
          <button className="btn btn-secondary" type="button">
            <CalendarDays aria-hidden="true" />
            Hoje
          </button>
          <button className="icon-btn" title="Próximo dia" type="button">
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="split">
        <div className="panel">
          <div className="section-head">
            <h2>Linha do tempo</h2>
            <span className="badge neutral">3 entregas hoje</span>
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
                    {item.time} · {item.title}
                  </p>
                  <p className="item-subtitle">{item.customer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Pedidos por data</h2>
          </div>
          <div className="list">
            {orders
              .filter((order) => order.deliveryDate === "Hoje")
              .map((order) => (
                <article className="item-card" key={order.id}>
                  <div className="item-main">
                    <div>
                      <p className="item-title">
                        {order.deliveryTime} · {order.customer}
                      </p>
                      <p className="item-subtitle">{order.items.join(", ")}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="meta-row">
                    <span className="badge neutral">{order.fulfillment}</span>
                    {order.urgent ? <span className="badge cancelled">Urgente</span> : null}
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
