import { StatusBadge } from "@/components/status-badge";
import { requireAuthUser } from "@/lib/current-user";
import { createInternalOrderAction, updateOrderStatusAction } from "@/lib/order-actions";
import {
  listOrdersForCurrentStore,
  orderStatusOptions,
  uiToDatabaseStatusMap,
  type DatabaseOrderStatus
} from "@/lib/order-persistence";
import { listProductsForCurrentStore } from "@/lib/product-repository";
import { formatCurrency, type OrderStatus } from "@/lib/sample-data";
import { makeOrderWhatsAppHref } from "@/lib/whatsapp";
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
  confirmado: "Iniciar produção",
  pendente: "Confirmar pedido",
  em_producao: "Marcar como pronto",
  pronto: "Marcar como entregue",
  saiu_para_entrega: "Marcar como entregue"
};

export default async function OrdersPage() {
  const user = await requireAuthUser();
  const ordersResult = await listOrdersForCurrentStore(user.storeId);
  const productsResult = await listProductsForCurrentStore(user.storeId);
  const orders = ordersResult.data;
  const products = productsResult.data.filter((product) => product.active);
  const isMock = ordersResult.source === "mock" || productsResult.source === "mock";

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
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte dos pedidos:{" "}
            {ordersResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
          {isMock ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              Gestão de status desabilitada enquanto o PostgreSQL real não estiver
              configurado.
            </p>
          ) : null}
        </div>
        <div className="actions">
          <a className="btn btn-primary" href="#pedido-interno">
            <Plus aria-hidden="true" />
            Pedido interno
          </a>
        </div>
      </header>

      <section className="panel">
        <details className="product-editor" id="pedido-interno">
          <summary>
            <span>
              <strong>Novo pedido interno</strong>
              <small>Registre pedidos recebidos pelo balcão, telefone ou WhatsApp.</small>
            </span>
            <Plus aria-hidden="true" />
          </summary>
          <form action={createInternalOrderAction} className="product-form">
            <div className="form-grid">
              <label className="field">
                <span>Cliente</span>
                <input className="input" disabled={isMock} name="customerName" required />
              </label>
              <label className="field">
                <span>Telefone/WhatsApp</span>
                <input className="input" disabled={isMock} name="customerPhone" required />
              </label>
              <label className="field">
                <span>Produto</span>
                <select className="select" disabled={isMock || !products.length} name="productId" required>
                  <option value="">Selecione</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Quantidade</span>
                <input
                  className="input"
                  defaultValue={1}
                  disabled={isMock}
                  min="1"
                  name="quantity"
                  required
                  type="number"
                />
              </label>
              <label className="field">
                <span>Tipo</span>
                <select className="select" defaultValue="PICKUP" disabled={isMock} name="fulfillmentType">
                  <option value="PICKUP">Retirada</option>
                  <option value="DELIVERY">Entrega</option>
                </select>
              </label>
              <label className="field">
                <span>Pagamento</span>
                <select className="select" defaultValue="" disabled={isMock} name="paymentMethod">
                  <option value="">A combinar</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="CARD">Cartão</option>
                </select>
              </label>
              <label className="field">
                <span>Data</span>
                <input className="input" disabled={isMock} name="deliveryDate" required type="date" />
              </label>
              <label className="field">
                <span>Horário</span>
                <input className="input" disabled={isMock} name="deliveryTime" type="time" />
              </label>
              <label className="field">
                <span>Endereço</span>
                <input className="input" disabled={isMock} name="deliveryAddress" />
              </label>
            </div>
            <label className="field">
              <span>Observações internas</span>
              <textarea className="textarea" disabled={isMock} name="internalNotes" />
            </label>
            <div className="actions">
              <button className="btn btn-primary" disabled={isMock || !products.length} type="submit">
                <Plus aria-hidden="true" />
                Criar pedido interno
              </button>
            </div>
          </form>
        </details>

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
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Pedido">
                    <strong>{order.code}</strong>
                    <p className="muted">{order.source}</p>
                  </td>
                  <td data-label="Cliente">
                    <strong>{order.customer}</strong>
                    <p className="muted">{order.whatsapp}</p>
                  </td>
                  <td data-label="Entrega">
                    <strong>
                      {order.deliveryDate} - {order.deliveryTime}
                    </strong>
                    <p className="muted">{order.items.join(", ")}</p>
                    <p className="muted">
                      {order.fulfillment}
                      {order.deliveryFee ? ` + frete ${formatCurrency(order.deliveryFee)}` : ""}
                    </p>
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={order.status} />
                  </td>
                  <td data-label="Total">
                    <strong>{formatCurrency(order.total)}</strong>
                    <p className="muted">
                      {order.paymentMethod ?? "Pagamento a combinar"} · Sinal{" "}
                      {formatCurrency(order.paidSignal)}
                    </p>
                  </td>
                  <td data-label="Ações">
                    <div className="row-actions">
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
                        href={makeOrderWhatsAppHref(order)}
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
