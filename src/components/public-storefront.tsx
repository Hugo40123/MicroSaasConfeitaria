"use client";

import type { StoreProfile } from "@/lib/product-repository";
import { formatCurrency, type Product } from "@/lib/sample-data";
import { makeStoreWhatsAppHref } from "@/lib/whatsapp";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Store,
  UserRound
} from "lucide-react";
import { type CSSProperties, type FormEvent, useMemo, useState } from "react";

type CartItem = {
  product: Product;
  quantity: number;
};

type CreatedOrder = {
  code: string;
  trackingUrl: string;
};

const categories = ["Todos", "Bolos inteiros", "Fatias", "Doces", "Extras"] as const;

export function PublicStorefront({
  products,
  store,
  source
}: {
  products: Product[];
  store: StoreProfile;
  source: "database" | "mock";
}) {
  const [activeCategory, setActiveCategory] =
    useState<(typeof categories)[number]>("Todos");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [query, setQuery] = useState("");
  const [fulfillment, setFulfillment] = useState<"Retirada" | "Entrega">(
    "Retirada"
  );
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      if (!product.online || !product.active) return false;
      const matchesCategory =
        activeCategory === "Todos" || product.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, products, query]);

  const cartItems = Object.values(cart);
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const featuredProducts = visibleProducts.slice(0, 2);

  function addProduct(product: Product) {
    setCart((current) => ({
      ...current,
      [product.id]: {
        product,
        quantity: (current[product.id]?.quantity ?? 0) + 1
      }
    }));
  }

  function removeProduct(productId: string) {
    setCart((current) => {
      const item = current[productId];
      if (!item) return current;

      if (item.quantity === 1) {
        const next = { ...current };
        delete next[productId];
        return next;
      }

      return {
        ...current,
        [productId]: {
          ...item,
          quantity: item.quantity - 1
        }
      };
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cartItems.length === 0) {
      setFormError("Adicione pelo menos um produto ao carrinho.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      storeSlug: store.slug,
      customerName: String(formData.get("customerName") ?? ""),
      customerWhatsapp: String(formData.get("customerWhatsapp") ?? ""),
      fulfillment,
      deliveryAddress: String(formData.get("deliveryAddress") ?? ""),
      deliveryDate: String(formData.get("deliveryDate") ?? ""),
      customerNotes: String(formData.get("customerNotes") ?? ""),
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    setFormError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        const issues = Array.isArray(result.error?.issues)
          ? result.error.issues.join(" ")
          : result.error?.message;

        setFormError(issues || "Nao foi possivel enviar o pedido.");
        return;
      }

      setCreatedOrder({
        code: result.data.code,
        trackingUrl: result.data.trackingUrl
      });
      setCart({});
    } catch {
      setFormError("Nao foi possivel conectar com o servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdOrder) {
    const whatsappHref = makeStoreWhatsAppHref(
      store.phone,
      `Ola! Acabei de enviar o pedido ${createdOrder.code} pelo cardapio online.`
    );

    return (
      <main className="storefront storefront-confirmation">
        <section className="order-confirmation">
          <span className="confirmation-icon" aria-hidden="true">
            <CheckCircle2 />
          </span>
          <p className="eyebrow">Pedido enviado</p>
          <h1>Seu pedido entrou para confirmacao.</h1>
          <p>
            Codigo {createdOrder.code}. A {store.name} vai revisar
            disponibilidade, prazo e sinal antes de iniciar a producao.
          </p>
          <div className="actions">
            <a className="btn btn-primary" href={createdOrder.trackingUrl}>
              <CheckCircle2 aria-hidden="true" />
              Acompanhar pedido
            </a>
            <a className="btn btn-secondary" href={whatsappHref}>
              <Send aria-hidden="true" />
              Chamar no WhatsApp
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className="storefront"
      style={
        {
          "--store-primary": "#d79771",
          "--store-primary-strong": "#734939",
          "--store-accent": "#f7b239",
          "--store-bg": "#fff6e8",
          "--store-soft": "#fff0da"
        } as CSSProperties
      }
    >
      <header className="store-topbar">
        <a className="store-mini-brand" href="#cardapio">
          <span className="store-mini-mark">{store.name.slice(0, 1)}</span>
          <span>{store.name}</span>
        </a>
        <a className="cart-pill" href="#checkout">
          <ShoppingCart aria-hidden="true" />
          <span>{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
        </a>
      </header>

      <section className="store-hero">
        <div className="store-banner">
          <div className="store-banner-inner">
            <p className="eyebrow">Cardapio online</p>
            <h1>{store.name}</h1>
            <p>{store.description}</p>
            <div className="store-hero-meta">
              <span>
                <MapPin aria-hidden="true" />
                {store.address || "Retirada e entrega sob combinacao"}
              </span>
              <span>
                <Clock3 aria-hidden="true" />
                Encomendas com confirmacao da loja
              </span>
            </div>
          </div>
        </div>
      </section>

      {featuredProducts.length ? (
        <section className="store-section">
          <div className="store-section-head">
            <div>
              <p className="eyebrow">Destaques</p>
              <h2>Doces em destaque</h2>
            </div>
          </div>
          <div className="featured-grid">
            {featuredProducts.map((product) => (
              <article className="featured-card" key={`featured-${product.id}`}>
                {product.imageUrl ? (
                  <img className="featured-image" src={product.imageUrl} alt="" />
                ) : (
                  <div
                    aria-hidden="true"
                    className="product-art featured-art"
                    style={
                      {
                        "--art-bg": product.artBg,
                        "--art-shape": product.artShape
                      } as CSSProperties
                    }
                  />
                )}
                <div>
                  <span className="product-category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p className="muted">{formatCurrency(product.price)}</p>
                </div>
                <button
                  className="icon-btn featured-add"
                  onClick={() => addProduct(product)}
                  title="Adicionar ao carrinho"
                  type="button"
                >
                  <Plus aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="store-section" id="cardapio">
        <div className="store-section-head">
          <div>
            <p className="eyebrow">Cardapio</p>
            <h2>Escolha seus produtos</h2>
          </div>
          <span className="store-count">{visibleProducts.length} produtos</span>
        </div>

        <label className="store-search">
          <Search aria-hidden="true" />
          <input
            aria-label="Buscar produto"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquise pelo nome do doce"
            value={query}
          />
        </label>

        <div className="store-toolbar" aria-label="Categorias">
          {categories.map((category) => (
            <button
              className={`chip ${activeCategory === category ? "active" : ""}`}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {visibleProducts.map((product) => (
            <article className="product-card" key={product.id}>
              {product.imageUrl ? (
                <img className="product-image" src={product.imageUrl} alt="" />
              ) : (
                <div
                  aria-hidden="true"
                  className="product-art"
                  style={
                    {
                      "--art-bg": product.artBg,
                      "--art-shape": product.artShape
                    } as CSSProperties
                  }
                />
              )}
              <div className="product-body">
                <span className="product-category">{product.category}</span>
                <h2>{product.name}</h2>
                <p className="muted">{product.description}</p>
                <div className="meta-row">
                  <span className="badge neutral">{product.preparationTime}</span>
                </div>
                <div className="product-card-footer">
                  <span className="price">{formatCurrency(product.price)}</span>
                  <button
                    className="btn btn-primary"
                    onClick={() => addProduct(product)}
                    type="button"
                  >
                    <Plus aria-hidden="true" />
                    Adicionar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="store-layout">
        <aside className="cart-sticky" aria-label="Carrinho" id="checkout">
          <form className="checkout-panel" onSubmit={submitOrder}>
            <div className="checkout-head">
              <div>
                <p className="eyebrow">Finalizar</p>
                <h2>Seu pedido</h2>
              </div>
              <span className="metric-icon" aria-hidden="true">
                <ShoppingCart />
              </span>
            </div>

            {cartItems.length === 0 ? (
              <p className="muted">Escolha os produtos para montar o pedido.</p>
            ) : (
              <div className="list">
                {cartItems.map((item) => (
                  <div className="cart-line" key={item.product.id}>
                    <div>
                      <p className="item-title">{item.product.name}</p>
                      <p className="muted">
                        {formatCurrency(item.product.price)} cada
                      </p>
                    </div>
                    <div className="qty-control">
                      <button
                        className="icon-btn"
                        onClick={() => removeProduct(item.product.id)}
                        title="Diminuir quantidade"
                        type="button"
                      >
                        <Minus aria-hidden="true" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="icon-btn"
                        onClick={() => addProduct(item.product)}
                        title="Aumentar quantidade"
                        type="button"
                      >
                        <Plus aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="checkout-fields">
              <div className="field">
                <label htmlFor="customer-name">Nome</label>
                <input className="input" id="customer-name" name="customerName" required />
              </div>

              <div className="field">
                <label htmlFor="customer-whatsapp">WhatsApp</label>
                <input
                  className="input"
                  id="customer-whatsapp"
                  inputMode="tel"
                  name="customerWhatsapp"
                  required
                />
              </div>
            </div>

            <div className="checkout-choice-grid">
              <button
                className={`btn ${fulfillment === "Retirada" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFulfillment("Retirada")}
                type="button"
              >
                <Store aria-hidden="true" />
                Retirada
              </button>
              <button
                className={`btn ${fulfillment === "Entrega" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFulfillment("Entrega")}
                type="button"
              >
                <Send aria-hidden="true" />
                Entrega
              </button>
            </div>

            {fulfillment === "Entrega" ? (
              <div className="field">
                <label htmlFor="address">Endereco</label>
                <input
                  className="input"
                  id="address"
                  name="deliveryAddress"
                  required
                />
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="delivery-date">Data desejada</label>
              <span style={{ position: "relative" }}>
                <CalendarDays
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
                  id="delivery-date"
                  name="deliveryDate"
                  required
                  style={{ paddingLeft: "2.25rem" }}
                  type="date"
                />
              </span>
            </div>

            <div className="field">
              <label htmlFor="notes">Observacoes</label>
              <textarea
                className="textarea"
                id="notes"
                name="customerNotes"
                placeholder="Tema, restricoes, mensagem no bolo..."
              />
            </div>

            <div className="total-row">
              <span>Total estimado</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {formError ? <p className="form-error">{formError}</p> : null}

            <button
              className="btn btn-rose"
              disabled={cartItems.length === 0 || isSubmitting}
              type="submit"
            >
              <Send aria-hidden="true" />
              {isSubmitting ? "Enviando..." : "Enviar pedido"}
            </button>
          </form>
        </aside>
      </section>

      <footer className="store-footer">
        <div className="store-socials" aria-label="Contatos">
          <a href={makeStoreWhatsAppHref(store.phone, `Ola! Quero fazer um pedido na ${store.name}.`)}>
            <MessageCircle aria-hidden="true" />
            <span className="sr-only">WhatsApp</span>
          </a>
          <span>
            <Store aria-hidden="true" />
          </span>
          <span>
            <UserRound aria-hidden="true" />
          </span>
        </div>
        <p>Copyright © {store.name}</p>
      </footer>
    </main>
  );
}
