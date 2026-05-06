import { requireAuthUser } from "@/lib/current-user";
import {
  createInternalOrderAction,
  updateOrderDetailsAction,
  updateOrderStatusAction
} from "@/lib/order-actions";
import {
  listOrdersForCurrentStore,
  orderStatusOptions,
  parseDatabaseOrderStatus,
  uiToDatabaseStatusMap,
} from "@/lib/order-persistence";
import { listProductsForCurrentStore } from "@/lib/product-repository";
import { formatCurrency, type Order } from "@/lib/sample-data";
import { makeOrderWhatsAppHref } from "@/lib/whatsapp";
import { Edit3, Filter, Plus, Save, Search, Send, XCircle } from "lucide-react";

function getFulfillmentValue(order: Order) {
  return order.fulfillment === "Entrega" ? "DELIVERY" : "PICKUP";
}

function getPaymentMethodValue(order: Order) {
  if (order.paymentMethod === "Dinheiro") return "CASH";
  if (order.paymentMethod === "PIX") return "PIX";
  if (order.paymentMethod === "Cartão") return "CARD";

  return "";
}

function getDeliveryTimeValue(order: Order) {
  return /^\d{2}:\d{2}$/.test(order.deliveryTime) ? order.deliveryTime : "";
}

export default async function OrdersPage({
  searchParams
}: {
  searchParams?: Promise<{
    date?: string;
    query?: string;
    orderError?: string;
    orderSuccess?: string;
    status?: string;
  }>;
}) {
  const user = await requireAuthUser();
  const params = await searchParams;
  const selectedStatus = parseDatabaseOrderStatus(params?.status);
  const selectedQuery = params?.query?.trim() ?? "";
  const selectedDate = params?.date?.trim() ?? "";
  const ordersResult = await listOrdersForCurrentStore(user.storeId, {
    query: selectedQuery || undefined,
    status: selectedStatus ?? undefined,
    date: selectedDate || undefined
  });
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
          {params?.orderError ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              {params.orderError}
            </p>
          ) : null}
          {params?.orderSuccess ? (
            <p className="form-success" style={{ marginTop: "0.9rem" }}>
              {params.orderSuccess}
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

        <form action="/app/pedidos" className="search-row search-row-wide">
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
                defaultValue={selectedQuery}
                name="query"
                placeholder="Cliente, telefone ou código"
                style={{ paddingLeft: "2.25rem" }}
              />
            </span>
          </label>
          <label className="field">
            <span>Data de entrega</span>
            <input
              className="input"
              defaultValue={selectedDate}
              name="date"
              type="date"
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select className="select" defaultValue={selectedStatus ?? ""} name="status">
              <option value="">Todos</option>
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
                    <form action={updateOrderStatusAction} className="inline-status-form">
                      <input name="orderId" type="hidden" value={order.id} />
                      <select
                        className="select compact-select"
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
                      <button
                        className="icon-btn"
                        disabled={isMock}
                        title="Salvar status"
                        type="submit"
                      >
                        <Save aria-hidden="true" />
                      </button>
                    </form>
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
                      <a
                        className="icon-btn"
                        href={`#editar-${order.id}`}
                        title="Editar pedido"
                      >
                        <Edit3 aria-hidden="true" />
                      </a>

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
                    <div className="modal-layer" id={`editar-${order.id}`}>
                      <a
                        aria-label="Fechar edição"
                        className="modal-backdrop"
                        href="#"
                      />
                      <section
                        aria-labelledby={`editar-${order.id}-titulo`}
                        className="modal-card"
                        role="dialog"
                      >
                        <div className="modal-head">
                          <div>
                            <p className="eyebrow">Editar pedido</p>
                            <h2 id={`editar-${order.id}-titulo`}>{order.code}</h2>
                          </div>
                          <a className="icon-btn" href="#" title="Fechar">
                            <XCircle aria-hidden="true" />
                          </a>
                        </div>
                        <form action={updateOrderDetailsAction} className="product-form">
                          <input name="orderId" type="hidden" value={order.id} />
                          <div className="form-grid">
                            <label className="field">
                              <span>Cliente</span>
                              <input
                                className="input"
                                defaultValue={order.customer}
                                disabled={isMock}
                                name="customerName"
                                required
                              />
                            </label>
                            <label className="field">
                              <span>Telefone/WhatsApp</span>
                              <input
                                className="input"
                                defaultValue={order.whatsapp}
                                disabled={isMock}
                                name="customerPhone"
                                required
                              />
                            </label>
                            <label className="field">
                              <span>Tipo</span>
                              <select
                                className="select"
                                defaultValue={getFulfillmentValue(order)}
                                disabled={isMock}
                                name="fulfillmentType"
                              >
                                <option value="PICKUP">Retirada</option>
                                <option value="DELIVERY">Entrega</option>
                              </select>
                            </label>
                            <label className="field">
                              <span>Pagamento</span>
                              <select
                                className="select"
                                defaultValue={getPaymentMethodValue(order)}
                                disabled={isMock}
                                name="paymentMethod"
                              >
                                <option value="">A combinar</option>
                                <option value="CASH">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="CARD">Cartão</option>
                              </select>
                            </label>
                            <label className="field">
                              <span>Data</span>
                              <input
                                className="input"
                                defaultValue={order.deliveryDateInput ?? ""}
                                disabled={isMock}
                                name="deliveryDate"
                                required
                                type="date"
                              />
                            </label>
                            <label className="field">
                              <span>Horário</span>
                              <input
                                className="input"
                                defaultValue={getDeliveryTimeValue(order)}
                                disabled={isMock}
                                name="deliveryTime"
                                type="time"
                              />
                            </label>
                          </div>
                          <label className="field">
                            <span>Endereço</span>
                            <input
                              className="input"
                              defaultValue={order.deliveryAddress ?? ""}
                              disabled={isMock}
                              name="deliveryAddress"
                            />
                          </label>
                          <label className="field">
                            <span>Observações internas</span>
                            <textarea
                              className="textarea"
                              defaultValue={order.internalNotes ?? ""}
                              disabled={isMock}
                              name="internalNotes"
                            />
                          </label>
                          <label className="check-field">
                            <input
                              defaultChecked={Boolean(order.urgent)}
                              disabled={isMock}
                              name="urgent"
                              type="checkbox"
                            />
                            Marcar como urgente
                          </label>
                          <div className="actions">
                            <button className="btn btn-primary" disabled={isMock} type="submit">
                              <Save aria-hidden="true" />
                              Salvar pedido
                            </button>
                          </div>
                        </form>
                      </section>
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
