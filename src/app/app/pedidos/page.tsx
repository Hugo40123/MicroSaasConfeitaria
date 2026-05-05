import { StatusBadge } from "@/components/status-badge";
import { requireAuthUser } from "@/lib/current-user";
import { updateOrderStatusAction } from "@/lib/order-actions";
import {
  listOrdersForCurrentStore,
  orderStatusOptions,
  uiToDatabaseStatusMap,
  type DatabaseOrderStatus
} from "@/lib/order-persistence";
import { formatCurrency, type OrderStatus } from "@/lib/sample-data";
import { CheckCircle2, Filter, Plus, Save, Search, Send, XCircle } from "lucide-react";

const nextStatusByCurrentStatus: Partial<Record<OrderStatus, DatabaseOrderStatus>> = {
  aguardando_confirmacao: "CONFIRMED",
  confirmado: "IN_PRODUCTION",
  pendente: "CONFIRMED",
  em_producao: "READY",
  pronto: "DELIVERED",
  saiu_para_entrega: "DELIVERED"
};

const nextStatusCopy: Partial<Record<OrderStatus, string>> = {
  aguardando_confirmacao: "Confirmar pedido",
  confirmado: "Iniciar producao",
  pendente: "Confirmar pedido",
  em_producao: "Marcar como pronto",
  pronto: "Marcar como entregue",
  saiu_para_entrega: "Marcar como entregue"
};

export default async function OrdersPage() {
  const user = await requireAuthUser();
  const ordersResult = await listOrdersForCurrentStore(user.storeId);
  const orders = ordersResult.data;
  const isMock = ordersResult.source === "mock";

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
          {isMock ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              Gestao de status desabilitada enquanto o PostgreSQL real nao estiver
              configurado.
            </p>
          ) : null}
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
                      {nextStatusByCurrentStatus[order.status] ? (
                        <form action={updateOrderStatusAction}>
                          <input name="orderId" type="hidden" value={order.id} />
                          <input
                            name="status"
                            type="hidden"
                            value={nextStatusByCurrentStatus[order.status]}
                          />
                          <button
                            className="icon-btn"
                            disabled={isMock}
                            title={nextStatusCopy[order.status]}
                            type="submit"
                          >
                            <CheckCircle2 aria-hidden="true" />
                          </button>
                        </form>
                      ) : null}

                      {order.status !== "cancelado" && order.status !== "entregue" ? (
                        <form action={updateOrderStatusAction}>
                          <input name="orderId" type="hidden" value={order.id} />
                          <input name="status" type="hidden" value="CANCELLED" />
                          <button
                            className="icon-btn"
                            disabled={isMock}
                            title="Cancelar pedido"
                            type="submit"
                          >
                            <XCircle aria-hidden="true" />
                          </button>
                        </form>
                      ) : null}

                      <a
                        className="icon-btn"
                        href={`https://wa.me/55${order.whatsapp.replace(/\D/g, "")}`}
                        title="Enviar pelo WhatsApp"
                      >
                        <Send aria-hidden="true" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="product-edit-list">
          {orders.map((order) => (
            <details className="product-editor" key={`status-${order.id}`}>
              <summary>
                <span>
                  <strong>Atualizar {order.code}</strong>
                  <small>
                    {order.customer} - status atual:{" "}
                    {orderStatusOptions.find(
                      (status) => status.value === uiToDatabaseStatusMap[order.status]
                    )?.label ?? order.status}
                  </small>
                </span>
                <Save aria-hidden="true" />
              </summary>
              <form action={updateOrderStatusAction} className="product-form">
                <input name="orderId" type="hidden" value={order.id} />
                <label className="field">
                  <span>Novo status</span>
                  <select
                    className="select"
                    defaultValue={uiToDatabaseStatusMap[order.status]}
                    disabled={isMock}
                    name="status"
                    required
                  >
                    {orderStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="actions">
                  <button className="btn btn-primary" disabled={isMock} type="submit">
                    <Save aria-hidden="true" />
                    Salvar status
                  </button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
