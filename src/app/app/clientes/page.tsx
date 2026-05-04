import { orders } from "@/lib/sample-data";
import { MessageCircle, Plus, Search } from "lucide-react";

const customers = [
  {
    name: "Ana Paula",
    phone: "(11) 98888-1001",
    address: "Retirada na loja",
    notes: "Gosta de bolos com pouco açúcar."
  },
  {
    name: "Camila Rocha",
    phone: "(11) 97777-2202",
    address: "Rua Primavera, 88",
    notes: "Prefere entrega pela manhã."
  },
  {
    name: "Rafael Lima",
    phone: "(11) 96666-3303",
    address: "Retirada na loja",
    notes: "Pedidos para eventos corporativos."
  }
];

export default function CustomersPage() {
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1>Histórico simples por nome, telefone e WhatsApp.</h1>
          <p className="lead">
            Clientes do portal e pedidos internos ficam no mesmo cadastro da loja.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="button">
            <Plus aria-hidden="true" />
            Novo cliente
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
                <th>Endereço</th>
                <th>Pedidos</th>
                <th>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.phone}>
                  <td>
                    <strong>{customer.name}</strong>
                    <p className="muted">{customer.notes}</p>
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.address}</td>
                  <td>
                    {
                      orders.filter((order) => order.customer === customer.name)
                        .length
                    }
                  </td>
                  <td>
                    <button className="icon-btn" title="Abrir WhatsApp" type="button">
                      <MessageCircle aria-hidden="true" />
                    </button>
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
