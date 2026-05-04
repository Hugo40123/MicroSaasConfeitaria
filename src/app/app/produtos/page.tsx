import { formatCurrency, products } from "@/lib/sample-data";
import { Eye, EyeOff, Plus, Search } from "lucide-react";

export default function ProductsPage() {
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Produtos</p>
          <h1>Cardápio organizado para vender no balcão e online.</h1>
          <p className="lead">
            Controle preço, prazo de preparo, disponibilidade no portal do cliente e
            itens extras para encomendas personalizadas.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="button">
            <Plus aria-hidden="true" />
            Novo produto
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="search-row">
          <label className="field">
            <span>Buscar produto</span>
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
                placeholder="Nome ou categoria"
                style={{ paddingLeft: "2.25rem" }}
              />
            </span>
          </label>
          <label className="field">
            <span>Categoria</span>
            <select className="select" defaultValue="">
              <option value="">Todas</option>
              <option>Bolos inteiros</option>
              <option>Fatias</option>
              <option>Doces</option>
              <option>Extras</option>
            </select>
          </label>
          <label className="field">
            <span>Disponibilidade</span>
            <select className="select" defaultValue="">
              <option value="">Todos</option>
              <option>Online</option>
              <option>Somente interno</option>
            </select>
          </label>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Preparo</th>
                <th>Portal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <p className="muted">{product.description}</p>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <strong>{formatCurrency(product.price)}</strong>
                  </td>
                  <td>{product.preparationTime}</td>
                  <td>
                    <span className={`badge ${product.online ? "ready" : "neutral"}`}>
                      {product.online ? "Visível" : "Oculto"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      title={product.active ? "Desativar produto" : "Ativar produto"}
                      type="button"
                    >
                      {product.active ? (
                        <Eye aria-hidden="true" />
                      ) : (
                        <EyeOff aria-hidden="true" />
                      )}
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
