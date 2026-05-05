import { requireAuthUser } from "@/lib/current-user";
import { updateCustomerAction } from "@/lib/customer-actions";
import { listCustomersForCurrentStore } from "@/lib/customer-repository";
import { Edit3, MessageCircle, Search } from "lucide-react";

export default async function CustomersPage() {
  const user = await requireAuthUser();
  const customersResult = await listCustomersForCurrentStore(user.storeId);
  const customers = customersResult.data;
  const isMock = customersResult.source === "mock";

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1>Historico simples por nome, telefone e WhatsApp.</h1>
          <p className="lead">
            Clientes do portal e pedidos internos ficam no mesmo cadastro da loja.
          </p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte dos clientes:{" "}
            {customersResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
          {isMock ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              Edicao de clientes desabilitada enquanto o PostgreSQL real nao estiver
              configurado.
            </p>
          ) : null}
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
                placeholder="Nome ou telefone"
                style={{ paddingLeft: "2.25rem" }}
              />
            </span>
          </label>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Endereco</th>
                <th>Pedidos</th>
                <th>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.name}</strong>
                    <p className="muted">{customer.notes || "Sem notas"}</p>
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.address || "Nao informado"}</td>
                  <td>{customer.orderCount}</td>
                  <td>
                    <a
                      className="icon-btn"
                      href={`https://wa.me/55${customer.whatsapp.replace(/\D/g, "")}`}
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="product-edit-list">
          {customers.map((customer) => (
            <details className="product-editor" key={`customer-${customer.id}`}>
              <summary>
                <span>
                  <strong>Editar {customer.name}</strong>
                  <small>
                    {customer.orderCount} pedidos - ultimo: {customer.lastOrderCode}
                  </small>
                </span>
                <Edit3 aria-hidden="true" />
              </summary>
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
                    <span>WhatsApp</span>
                    <input
                      className="input"
                      defaultValue={customer.whatsapp}
                      disabled={isMock}
                      name="whatsapp"
                    />
                  </label>
                  <label className="field">
                    <span>Endereco</span>
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
                    Salvar cliente
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
