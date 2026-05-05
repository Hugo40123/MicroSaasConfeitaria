import { requirePermission } from "@/lib/current-user";
import {
  addRecipeItemAction,
  createIngredientAction,
  removeRecipeItemAction
} from "@/lib/ingredient-actions";
import {
  ingredientUnitOptions,
  listIngredientsForCurrentStore,
  type IngredientSummary
} from "@/lib/ingredient-repository";
import { ProductImageInput } from "@/components/product-image-input";
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
import {
  Edit3,
  Eye,
  EyeOff,
  Globe2,
  GlobeLock,
  ImageUp,
  Plus,
  Search,
  Trash2
} from "lucide-react";

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
    <form action={action} className="product-form" encType="multipart/form-data">
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
        <span>Preço de venda</span>
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
        <span>Custo manual</span>
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
          <span>Margem desejada (%)</span>
          <input
            className="input"
            defaultValue={product?.marginPercent ?? 0}
            disabled={disabled}
            inputMode="decimal"
            max="99.99"
            min="0"
            name="marginPercent"
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
        <span>Antecedência mínima em dias</span>
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
        <span>Descrição</span>
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

      <ProductImageInput disabled={disabled} />

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
          Visível no portal
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

function IngredientForm({ disabled }: { disabled: boolean }) {
  return (
    <form action={createIngredientAction} className="product-form">
      <div className="form-grid">
        <label className="field">
          <span>Nome do insumo</span>
          <input className="input" disabled={disabled} maxLength={120} name="name" required />
        </label>
        <label className="field">
          <span>Unidade</span>
          <select className="select" disabled={disabled} name="unit" required>
            {ingredientUnitOptions.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Custo por unidade</span>
          <input
            className="input"
            disabled={disabled}
            inputMode="decimal"
            min="0.0001"
            name="costPerUnit"
            required
            step="0.0001"
            type="number"
          />
        </label>
        <label className="field">
          <span>Estoque atual</span>
          <input
            className="input"
            defaultValue={0}
            disabled={disabled}
            inputMode="decimal"
            min="0"
            name="stockQuantity"
            step="0.001"
            type="number"
          />
        </label>
        <label className="field">
          <span>Alerta de estoque baixo</span>
          <input
            className="input"
            disabled={disabled}
            inputMode="decimal"
            min="0"
            name="lowStockAlert"
            step="0.001"
            type="number"
          />
        </label>
      </div>
      <div className="actions">
        <button className="btn btn-primary" disabled={disabled} type="submit">
          <Plus aria-hidden="true" />
          Criar insumo
        </button>
      </div>
    </form>
  );
}

function RecipeEditor({
  disabled,
  ingredients,
  product
}: {
  disabled: boolean;
  ingredients: IngredientSummary[];
  product: AdminProduct;
}) {
  return (
    <div className="recipe-editor">
      <div className="section-head">
        <div>
          <h3>Ficha técnica e precificação</h3>
          <p className="muted">
            O custo automático usa a soma de quantidade x custo do insumo. Sem ficha,
            o sistema mantém o custo manual.
          </p>
        </div>
      </div>

      <div className="pricing-grid">
        <div>
          <span className="muted">Custo manual</span>
          <strong>{product.cost === null ? "Não informado" : formatCurrency(product.cost)}</strong>
        </div>
        <div>
          <span className="muted">Custo pela ficha</span>
          <strong>
            {product.costAutoCalculated === null
              ? "Sem ficha"
              : formatCurrency(product.costAutoCalculated)}
          </strong>
        </div>
        <div>
          <span className="muted">Custo usado</span>
          <strong>
            {product.effectiveCost === null
              ? "Não informado"
              : formatCurrency(product.effectiveCost)}
          </strong>
        </div>
        <div>
          <span className="muted">Preço sugerido</span>
          <strong>
            {product.suggestedPrice === null
              ? "Informe custo e margem"
              : formatCurrency(product.suggestedPrice)}
          </strong>
        </div>
      </div>

      <div className="list">
        {product.recipeItems.map((item) => (
          <article className="item-card" key={item.id}>
            <div className="item-main">
              <div>
                <p className="item-title">{item.ingredientName}</p>
                <p className="item-subtitle">
                  {item.quantity} {item.unit} x {formatCurrency(item.costPerUnit)} ={" "}
                  {formatCurrency(item.totalCost)}
                </p>
              </div>
              <form action={removeRecipeItemAction}>
                <input name="recipeItemId" type="hidden" value={item.id} />
                <button
                  className="icon-btn"
                  disabled={disabled}
                  title="Remover insumo da ficha"
                  type="submit"
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </form>
            </div>
          </article>
        ))}
        {product.recipeItems.length === 0 ? (
          <p className="muted">Nenhum insumo vinculado a este produto.</p>
        ) : null}
      </div>

      <form action={addRecipeItemAction} className="product-form">
        <input name="productId" type="hidden" value={product.id} />
        <div className="form-grid">
          <label className="field">
            <span>Insumo</span>
            <select
              className="select"
              disabled={disabled || ingredients.length === 0}
              name="ingredientId"
              required
            >
              <option value="">Selecione</option>
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name} - {formatCurrency(ingredient.costPerUnit)} /{" "}
                  {ingredient.unit}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Quantidade na receita</span>
            <input
              className="input"
              disabled={disabled || ingredients.length === 0}
              inputMode="decimal"
              min="0.001"
              name="quantity"
              required
              step="0.001"
              type="number"
            />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" disabled={disabled || ingredients.length === 0} type="submit">
            <Plus aria-hidden="true" />
            Vincular insumo
          </button>
        </div>
      </form>
    </div>
  );
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams?: Promise<{
    productError?: string;
    productSuccess?: string;
  }>;
}) {
  const user = await requirePermission("manage_products");
  const params = await searchParams;
  const productsResult = await listProductsForCurrentStore(user.storeId);
  const ingredientsResult = await listIngredientsForCurrentStore(user.storeId);
  const products = productsResult.data;
  const ingredients = ingredientsResult.data;
  const isMock = productsResult.source === "mock";

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
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte dos produtos:{" "}
            {productsResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
          {isMock ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              CRUD desabilitado enquanto o PostgreSQL real não estiver configurado.
              Configure `DATABASE_URL`, rode as migrations e volte aqui para gravar produtos.
            </p>
          ) : null}
          {params?.productError ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              {params.productError}
            </p>
          ) : null}
          {params?.productSuccess ? (
            <p className="form-success" style={{ marginTop: "0.9rem" }}>
              {params.productSuccess}
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
              <small>Cadastre preço, categoria, prazo e visibilidade online.</small>
            </span>
            <Plus aria-hidden="true" />
          </summary>
          <ProductForm
            action={createProductAction}
            disabled={isMock}
            submitLabel="Criar produto"
          />
        </details>

        <details className="product-editor">
          <summary>
            <span>
              <strong>Novo insumo</strong>
              <small>Cadastre unidade, custo e estoque para usar nas fichas técnicas.</small>
            </span>
            <Plus aria-hidden="true" />
          </summary>
          <IngredientForm disabled={isMock} />
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
                  <td data-label="Produto">
                    {product.imageUrl ? (
                      <img
                        alt=""
                        className="product-thumb"
                        src={product.imageUrl}
                      />
                    ) : null}
                    <strong>{product.name}</strong>
                    <p className="muted">{product.description}</p>
                    <p className="muted">
                      Custo usado:{" "}
                      {product.effectiveCost === null
                        ? "não informado"
                        : formatCurrency(product.effectiveCost)}
                      {product.suggestedPrice === null
                        ? ""
                        : ` · sugerido ${formatCurrency(product.suggestedPrice)}`}
                    </p>
                  </td>
                  <td data-label="Categoria">{product.category}</td>
                  <td data-label="Preço">
                    <strong>{formatCurrency(product.price)}</strong>
                  </td>
                  <td data-label="Preparo">{product.preparationTime}</td>
                  <td data-label="Portal">
                    <span className={`badge ${product.online ? "ready" : "neutral"}`}>
                      {product.online ? "Visível" : "Oculto"}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${product.active ? "ready" : "cancelled"}`}>
                      {product.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td data-label="Ações">
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
              {product.imageUrl ? (
                <img
                  alt=""
                  className="product-preview"
                  src={product.imageUrl}
                />
              ) : (
                <div className="image-placeholder">
                  <ImageUp aria-hidden="true" />
                  <span>Sem imagem cadastrada</span>
                </div>
              )}
              <ProductForm
                action={updateProductAction}
                disabled={isMock}
                product={product}
                submitLabel="Salvar alterações"
              />
              <RecipeEditor disabled={isMock} ingredients={ingredients} product={product} />
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
