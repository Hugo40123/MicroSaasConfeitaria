import { requireAuthUser } from "@/lib/current-user";
import { updateCustomerAction } from "@/lib/customer-actions";
import { listCustomersForCurrentStore } from "@/lib/customer-repository";
import { formatCurrency } from "@/lib/sample-data";
import { Edit3, MessageCircle, Save, Search, XCircle } from "lucide-react";

export default async function CustomersPage({
  searchParams
}: {
  searchParams?: Promise<{
    customerError?: string;
    customerSuccess?: string;
    query?: string;
  }>;
}) {
  const user = await requireAuthUser();
  const params = await searchParams;
  const selectedQuery = params?.query?.trim() ?? "";
  const customersResult = await listCustomersForCurrentStore(user.storeId, {
    query: selectedQuery || undefined
  });
  const customers = customersResult.data;
  const isMock = customersResult.source === "mock";

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1>Histórico simples por nome, telefone e WhatsApp.</h1>
          <p className="lead">
            Clientes do portal e pedidos internos ficam no mesmo cadastro da loja.
          </p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte dos clientes:{" "}
            {customersResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
          {isMock ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              Edição de clientes desabilitada enquanto o PostgreSQL real não estiver
              configurado.
            </p>
          ) : null}
          {params?.customerError ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              {params.customerError}
            </p>
          ) : null}
          {params?.customerSuccess ? (
            <p className="form-success" style={{ marginTop: "0.9rem" }}>
              {params.customerSuccess}
            </p>
          ) : null}
        </div>
      </header>

      <section className="panel">
        <form action="/app/clientes" className="search-row">
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
                placeholder="Nome ou telefone"
                style={{ paddingLeft: "2.25rem" }}
              />
            </span>
          </label>
          <button className="btn btn-secondary" type="submit">
            <Search aria-hidden="true" />
            Buscar
          </button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Pedidos</th>
                <th>WhatsApp</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td data-label="Cliente">
                    <strong>{customer.name}</strong>
                    <p className="muted">{customer.notes || "Sem notas"}</p>
                  </td>
                  <td data-label="Telefone">{customer.phone}</td>
                  <td data-label="Endereço">{customer.address || "Não informado"}</td>
                  <td data-label="Pedidos">
                    <strong>{customer.orderCount}</strong>
                    <p className="muted">Último: {customer.lastOrderCode}</p>
                  </td>
                  <td data-label="WhatsApp">
                    <a
                      className="icon-btn"
                      href={`https://wa.me/55${customer.whatsapp.replace(/\D/g, "")}`}
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle aria-hidden="true" />
                    </a>
                  </td>
                  <td data-label="Ações">
                    <a
                      className="icon-btn"
                      href={`#editar-cliente-${customer.id}`}
                      title="Editar cliente"
                    >
                    <Edit3 aria-hidden="true" />
                    </a>
                    <div className="modal-layer" id={`editar-cliente-${customer.id}`}>
                      <a
                        aria-label="Fechar edição"
                        className="modal-backdrop"
                        href="#"
                      />
                      <section
                        aria-labelledby={`editar-cliente-${customer.id}-titulo`}
                        className="modal-card"
                        role="dialog"
                      >
                        <div className="modal-head">
                          <div>
                            <p className="eyebrow">Editar cliente</p>
                            <h2 id={`editar-cliente-${customer.id}-titulo`}>
                              {customer.name}
                            </h2>
                            <p className="muted">
                              {customer.orderCount} pedidos - último: {customer.lastOrderCode}
                            </p>
                          </div>
                          <a className="icon-btn" href="#" title="Fechar">
                            <XCircle aria-hidden="true" />
                          </a>
                        </div>
                        <form action={updateCustomerAction} className="product-form">
                          <input name="customerId" type="hidden" value={customer.id} />
                          <div className="form-grid">
                            <label className="field">
                              <span>Nome</span>
                              <input
                                className="input"
                                defaultValue={customer.name}
                                disabled={isMock}
                                name="name"
                                required
                              />
                            </label>
                            <label className="field">
                              <span>Telefone</span>
                              <input
                                className="input"
                                defaultValue={customer.phone}
                                disabled={isMock}
                                name="phone"
                                required
                              />
                            </label>
                            <label className="field">
                              <span>WhatsApp</span>
                              <input
                                className="input"
                                defaultValue={customer.whatsapp}
                                disabled={isMock}
                                name="whatsapp"
                              />
                            </label>
                            <label className="field">
                              <span>Endereço</span>
                              <input
                                className="input"
                                defaultValue={customer.address}
                                disabled={isMock}
                                name="address"
                              />
                            </label>
                          </div>
                          <label className="field">
                            <span>Notas</span>
                            <textarea
                              className="textarea"
                              defaultValue={customer.notes}
                              disabled={isMock}
                              name="notes"
                            />
                          </label>
                          <div className="actions">
                            <button className="btn btn-primary" disabled={isMock} type="submit">
                              <Save aria-hidden="true" />
                              Salvar cliente
                            </button>
                          </div>
                        </form>
                        <div className="list">
                          <div className="section-head">
                            <h3>Histórico de pedidos</h3>
                            <span className="badge neutral">{customer.orderCount} pedidos</span>
                          </div>
                          {customer.orders.map((order) => (
                            <article className="item-card" key={order.id}>
                              <div className="item-main">
                                <div>
                                  <p className="item-title">
                                    {order.code} - {order.date}
                                  </p>
                                  <p className="item-subtitle">{order.items || "Sem itens"}</p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <span className="badge neutral">{order.status}</span>
                                  <p className="muted" style={{ marginTop: "0.35rem" }}>
                                    {formatCurrency(order.total)}
                                  </p>
                                </div>
                              </div>
                            </article>
                          ))}
                          {customer.orders.length === 0 ? (
                            <p className="muted">Nenhum pedido encontrado para este cliente.</p>
                          ) : null}
                        </div>
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
