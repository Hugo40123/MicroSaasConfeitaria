import { requireAuthUser } from "@/lib/current-user";
import {
  createProductAction,
  toggleProductActiveAction,
  toggleProductOnlineAction,
  updateProductAction
} from "@/lib/product-actions";
import {
  listProductsForCurrentStore,
  productCategoryOptions,
  type AdminProduct
} from "@/lib/product-repository";
import { formatCurrency } from "@/lib/sample-data";
import { Edit3, Eye, EyeOff, Globe2, GlobeLock, Plus, Search } from "lucide-react";

function ProductForm({
  action,
  disabled,
  product,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  disabled: boolean;
  product?: AdminProduct;
  submitLabel: string;
}) {
  return (
    <form action={action} className="product-form">
      {product ? <input name="productId" type="hidden" value={product.id} /> : null}

      <div className="form-grid">
        <label className="field">
          <span>Nome</span>
          <input
            className="input"
            defaultValue={product?.name}
            disabled={disabled}
            maxLength={120}
            name="name"
            required
          />
        </label>

        <label className="field">
          <span>Categoria</span>
          <select
            className="select"
            defaultValue={product?.dbCategory ?? "WHOLE_CAKE"}
            disabled={disabled}
            name="category"
            required
          >
            {productCategoryOptions.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Preco de venda</span>
          <input
            className="input"
            defaultValue={product?.basePrice}
            disabled={disabled}
            inputMode="decimal"
            min="0.01"
            name="basePrice"
            required
            step="0.01"
            type="number"
          />
        </label>

        <label className="field">
          <span>Custo</span>
          <input
            className="input"
            defaultValue={product?.cost ?? ""}
            disabled={disabled}
            inputMode="decimal"
            min="0"
            name="cost"
            step="0.01"
            type="number"
          />
        </label>

        <label className="field">
          <span>Preparo em horas</span>
          <input
            className="input"
            defaultValue={product?.preparationHours ?? ""}
            disabled={disabled}
            min="0"
            name="preparationHours"
            step="1"
            type="number"
          />
        </label>

        <label className="field">
          <span>Antecedencia minima em dias</span>
          <input
            className="input"
            defaultValue={product?.minOrderNoticeDays ?? ""}
            disabled={disabled}
            min="0"
            name="minOrderNoticeDays"
            step="1"
            type="number"
          />
        </label>
      </div>

      <label className="field">
        <span>Descricao</span>
        <textarea
          className="textarea"
          defaultValue={product?.description}
          disabled={disabled}
          maxLength={500}
          name="description"
        />
      </label>

      <label className="field">
        <span>URL da imagem</span>
        <input
          className="input"
          defaultValue={product?.imageUrl}
          disabled={disabled}
          name="imageUrl"
          type="url"
        />
      </label>

      <div className="toggle-row">
        <label className="check-field">
          <input
            defaultChecked={product?.active ?? true}
            disabled={disabled}
            name="active"
            type="checkbox"
          />
          Ativo
        </label>
        <label className="check-field">
          <input
            defaultChecked={product?.online ?? true}
            disabled={disabled}
            name="availableOnline"
            type="checkbox"
          />
          Visivel no portal
        </label>
      </div>

      <div className="actions">
        <button className="btn btn-primary" disabled={disabled} type="submit">
          <Plus aria-hidden="true" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default async function ProductsPage() {
  const user = await requireAuthUser();
  const productsResult = await listProductsForCurrentStore(user.storeId);
  const products = productsResult.data;
  const isMock = productsResult.source === "mock";

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Produtos</p>
          <h1>Cardapio organizado para vender no balcao e online.</h1>
          <p className="lead">
            Controle preco, prazo de preparo, disponibilidade no portal do cliente e
            itens extras para encomendas personalizadas.
          </p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte dos produtos:{" "}
            {productsResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
          {isMock ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              CRUD desabilitado enquanto o PostgreSQL real nao estiver configurado.
              Configure `DATABASE_URL`, rode as migrations e volte aqui para gravar produtos.
            </p>
          ) : null}
        </div>
        <div className="actions">
          <a className="btn btn-secondary" href={`/loja/${user.storeSlug}`}>
            <Globe2 aria-hidden="true" />
            Ver portal
          </a>
        </div>
      </header>

      <section className="panel">
        <details className="product-editor" open={!products.length && !isMock}>
          <summary>
            <span>
              <strong>Novo produto</strong>
              <small>Cadastre preco, categoria, prazo e visibilidade online.</small>
            </span>
            <Plus aria-hidden="true" />
          </summary>
          <ProductForm
            action={createProductAction}
            disabled={isMock}
            submitLabel="Criar produto"
          />
        </details>

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
                <th>Preco</th>
                <th>Preparo</th>
                <th>Portal</th>
                <th>Status</th>
                <th>Acoes</th>
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
                      {product.online ? "Visivel" : "Oculto"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${product.active ? "ready" : "cancelled"}`}>
                      {product.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <form action={toggleProductOnlineAction}>
                        <input name="productId" type="hidden" value={product.id} />
                        <input
                          name="availableOnline"
                          type="hidden"
                          value={String(!product.online)}
                        />
                        <button
                          className="icon-btn"
                          disabled={isMock}
                          title={product.online ? "Ocultar do portal" : "Mostrar no portal"}
                          type="submit"
                        >
                          {product.online ? (
                            <GlobeLock aria-hidden="true" />
                          ) : (
                            <Globe2 aria-hidden="true" />
                          )}
                        </button>
                      </form>
                      <form action={toggleProductActiveAction}>
                        <input name="productId" type="hidden" value={product.id} />
                        <input
                          name="active"
                          type="hidden"
                          value={String(!product.active)}
                        />
                        <button
                          className="icon-btn"
                          disabled={isMock}
                          title={product.active ? "Desativar produto" : "Ativar produto"}
                          type="submit"
                        >
                          {product.active ? (
                            <EyeOff aria-hidden="true" />
                          ) : (
                            <Eye aria-hidden="true" />
                          )}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="product-edit-list">
          {products.map((product) => (
            <details className="product-editor" key={`edit-${product.id}`}>
              <summary>
                <span>
                  <strong>Editar {product.name}</strong>
                  <small>{formatCurrency(product.price)} - {product.category}</small>
                </span>
                <Edit3 aria-hidden="true" />
              </summary>
              <ProductForm
                action={updateProductAction}
                disabled={isMock}
                product={product}
                submitLabel="Salvar alteracoes"
              />
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
