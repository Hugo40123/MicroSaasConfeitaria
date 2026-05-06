import { StatusBadge } from "@/components/status-badge";
import {
  getAgendaDateNavigation,
  listAgendaForCurrentStore
} from "@/lib/agenda-repository";
import { requireAuthUser } from "@/lib/current-user";
import {
  orderStatusOptions,
  parseDatabaseOrderStatus
} from "@/lib/order-persistence";
import { CalendarDays, ChevronLeft, ChevronRight, Filter } from "lucide-react";

function formatDateLabel(dateInput: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "long"
  }).format(new Date(`${dateInput}T00:00:00`));
}

export default async function AgendaPage({
  searchParams
}: {
  searchParams?: Promise<{
    date?: string;
    status?: string;
  }>;
}) {
  const user = await requireAuthUser();
  const params = await searchParams;
  const selectedStatus = parseDatabaseOrderStatus(params?.status);
  const navigation = getAgendaDateNavigation(params?.date);
  const agendaResult = await listAgendaForCurrentStore(user.storeId, {
    date: navigation.current,
    status: selectedStatus ?? undefined
  });
  const agenda = agendaResult.data;
  const timeline = agenda
    .filter((order) => order.status !== "cancelado" && order.status !== "entregue")
    .slice(0, 8);
  const statusSummary = {
    waiting: agenda.filter((order) => order.status === "aguardando_confirmacao").length,
    confirmed: agenda.filter((order) => order.status === "confirmado").length,
    production: agenda.filter((order) => order.status === "em_producao").length,
    ready: agenda.filter((order) => order.status === "pronto").length
  };
  const statusQuery = selectedStatus ? `&status=${selectedStatus}` : "";
  const selectedDateLabel = formatDateLabel(navigation.current);

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
          <a
            className="icon-btn"
            href={`/app/agenda?date=${navigation.previous}${statusQuery}`}
            title="Dia anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </a>
          <a
            className="btn btn-secondary"
            href={`/app/agenda?date=${navigation.today}${statusQuery}`}
          >
            <CalendarDays aria-hidden="true" />
            Hoje
          </a>
          <a
            className="icon-btn"
            href={`/app/agenda?date=${navigation.next}${statusQuery}`}
            title="Próximo dia"
          >
            <ChevronRight aria-hidden="true" />
          </a>
        </div>
      </header>

      <section className="panel">
        <form action="/app/agenda" className="search-row">
          <label className="field">
            <span>Data de produção</span>
            <input
              className="input"
              defaultValue={navigation.current}
              name="date"
              type="date"
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select className="select" defaultValue={selectedStatus ?? ""} name="status">
              <option value="">Ativos</option>
              {orderStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-secondary" type="submit">
            <Filter aria-hidden="true" />
            Filtrar
          </button>
        </form>

        <div className="pricing-grid">
          <div>
            <span className="muted">Data selecionada</span>
            <strong>{selectedDateLabel}</strong>
          </div>
          <div>
            <span className="muted">A confirmar</span>
            <strong>{statusSummary.waiting}</strong>
          </div>
          <div>
            <span className="muted">Confirmados</span>
            <strong>{statusSummary.confirmed}</strong>
          </div>
          <div>
            <span className="muted">Em produção</span>
            <strong>{statusSummary.production}</strong>
          </div>
          <div>
            <span className="muted">Prontos</span>
            <strong>{statusSummary.ready}</strong>
          </div>
        </div>
      </section>

      <section className="split">
        <div className="panel">
          <div className="section-head">
            <h2>Linha do tempo</h2>
            <span className="badge neutral">{timeline.length} pedidos</span>
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
              <p className="muted">Nenhuma produção pendente para esta data.</p>
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
            {agenda.length === 0 ? (
              <p className="muted">Nenhum pedido encontrado para os filtros selecionados.</p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
