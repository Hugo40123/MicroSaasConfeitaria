import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, orders } from "@/lib/sample-data";
import { CheckCircle2, Filter, Plus, Search, Send } from "lucide-react";

export default function OrdersPage() {
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Gestão de pedidos</p>
          <h1>Confirme pedidos do portal e acompanhe cada entrega.</h1>
          <p className="lead">
            O pedido enviado pelo cliente entra como aguardando confirmação para a
            loja revisar prazo, valor, sinal e disponibilidade.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="button">
            <Plus aria-hidden="true" />
            Pedido interno
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="search-row">
          <label className="field">
            <span>Busca rápida</span>
            <span style={{ position: "relative" }}>
              <Search
                aria-hidden="true"
                style={{
                  color: "var(--muted)",
                  height: "1rem",
                  left: "0.8rem",
                  position: "absolute",
                  top: "0.88rem",
                  width: "1rem"
                }}
              />
              <input
                className="input"
                placeholder="Cliente, telefone ou código"
                style={{ paddingLeft: "2.25rem" }}
              />
            </span>
          </label>
          <label className="field">
            <span>Status</span>
            <select className="select" defaultValue="">
              <option value="">Todos</option>
              <option>Aguardando confirmação</option>
              <option>Em produção</option>
              <option>Pronto</option>
            </select>
          </label>
          <button className="btn btn-secondary" type="button">
            <Filter aria-hidden="true" />
            Filtrar
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Entrega</th>
                <th>Status</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.code}</strong>
                    <p className="muted">{order.source}</p>
                  </td>
                  <td>
                    <strong>{order.customer}</strong>
                    <p className="muted">{order.whatsapp}</p>
                  </td>
                  <td>
                    <strong>
                      {order.deliveryDate} · {order.deliveryTime}
                    </strong>
                    <p className="muted">{order.items.join(", ")}</p>
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>
                    <strong>{formatCurrency(order.total)}</strong>
                    <p className="muted">Sinal {formatCurrency(order.paidSignal)}</p>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" title="Confirmar pedido" type="button">
                        <CheckCircle2 aria-hidden="true" />
                      </button>
                      <button className="icon-btn" title="Enviar pelo WhatsApp" type="button">
                        <Send aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
