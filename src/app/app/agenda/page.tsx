import { StatusBadge } from "@/components/status-badge";
import { listAgendaForCurrentStore } from "@/lib/agenda-repository";
import { requireAuthUser } from "@/lib/current-user";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export default async function AgendaPage() {
  const user = await requireAuthUser();
  const agendaResult = await listAgendaForCurrentStore(user.storeId);
  const agenda = agendaResult.data;
  const todayAgenda = agenda.filter((order) => order.deliveryDate === "Hoje");
  const timeline = todayAgenda.length > 0 ? todayAgenda : agenda.slice(0, 4);

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
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte da agenda:{" "}
            {agendaResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
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
            <span className="badge neutral">{timeline.length} entregas</span>
          </div>
          <div className="timeline">
            {timeline.map((order) => (
              <div
                className={`timeline-step ${
                  order.status === "pronto"
                    ? "done"
                    : order.status === "em_producao"
                      ? "current"
                      : ""
                }`}
                key={order.id}
              >
                <span className="dot" aria-hidden="true" />
                <div>
                  <p className="item-title">
                    {order.deliveryTime} - {order.code}
                  </p>
                  <p className="item-subtitle">
                    {order.customer} - {order.items}
                  </p>
                </div>
              </div>
            ))}
            {timeline.length === 0 ? (
              <p className="muted">Nenhuma produção pendente para os próximos dias.</p>
            ) : null}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Pedidos por data</h2>
          </div>
          <div className="list">
            {agenda.map((order) => (
              <article className="item-card" key={order.id}>
                <div className="item-main">
                  <div>
                    <p className="item-title">
                      {order.deliveryDate} - {order.deliveryTime} - {order.customer}
                    </p>
                    <p className="item-subtitle">{order.items}</p>
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
