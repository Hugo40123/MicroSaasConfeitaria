import { StatusBadge } from "@/components/status-badge";
import { requireAuthUser } from "@/lib/current-user";
import { listOrdersForCurrentStore } from "@/lib/order-persistence";
import { formatCurrency } from "@/lib/sample-data";
import { CheckCircle2, Filter, Plus, Search, Send } from "lucide-react";

export default async function OrdersPage() {
  const user = await requireAuthUser();
  const ordersResult = await listOrdersForCurrentStore(user.storeId);
  const orders = ordersResult.data;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Gestao de pedidos</p>
          <h1>Confirme pedidos do portal e acompanhe cada entrega.</h1>
          <p className="lead">
            O pedido enviado pelo cliente entra como aguardando confirmacao para a
            loja revisar prazo, valor, sinal e disponibilidade.
          </p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte dos pedidos:{" "}
            {ordersResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
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
            <span>Busca rapida</span>
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
                placeholder="Cliente, telefone ou codigo"
                style={{ paddingLeft: "2.25rem" }}
              />
            </span>
          </label>
          <label className="field">
            <span>Status</span>
            <select className="select" defaultValue="">
              <option value="">Todos</option>
              <option>Aguardando confirmacao</option>
              <option>Em producao</option>
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
                <th>Acoes</th>
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
                      {order.deliveryDate} - {order.deliveryTime}
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
