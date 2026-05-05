"use client";

import type { StoreProfile } from "@/lib/product-repository";
import { formatCurrency, type Product } from "@/lib/sample-data";
import {
  CalendarDays,
  CheckCircle2,
  Minus,
  Plus,
  Send,
  ShoppingCart,
  Store
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
  const [fulfillment, setFulfillment] = useState<"Retirada" | "Entrega">(
    "Retirada"
  );
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product.online || !product.active) return false;
      return activeCategory === "Todos" || product.category === activeCategory;
    });
  }, [activeCategory]);

  const cartItems = Object.values(cart);
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

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
    const whatsappDigits = store.phone.replace(/\D/g, "");
    const whatsappHref = whatsappDigits
      ? `https://wa.me/${whatsappDigits.startsWith("55") ? whatsappDigits : `55${whatsappDigits}`}`
      : "#";

    return (
      <main className="storefront">
        <section className="store-hero">
          <div className="store-banner">
            <div className="store-banner-inner">
              <p className="eyebrow">Pedido enviado</p>
              <h1>Seu pedido entrou para confirmacao da loja.</h1>
              <p>
                Codigo {createdOrder.code} - A {store.name} vai revisar
                disponibilidade, prazo e sinal antes de iniciar a producao.
              </p>
            </div>
          </div>
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
    <main className="storefront">
      <section className="store-hero">
        <div className="store-banner">
          <div className="store-banner-inner">
            <p className="eyebrow">Cardapio online</p>
            <h1>{store.name}</h1>
            <p>{store.description}</p>
            <p className="muted" style={{ color: "rgba(255, 255, 255, 0.8)", marginTop: "0.75rem" }}>
              Cardapio: {source === "database" ? "PostgreSQL" : "dados de exemplo"}
            </p>
          </div>
        </div>

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
      </section>

      <section className="store-layout">
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
                <div className="product-title-row">
                  <div>
                    <h2>{product.name}</h2>
                    <p className="muted">{product.description}</p>
                  </div>
                  <span className="price">{formatCurrency(product.price)}</span>
                </div>
                <div className="meta-row">
                  <span className="badge neutral">{product.category}</span>
                  <span className="badge neutral">{product.preparationTime}</span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => addProduct(product)}
                  type="button"
                >
                  <Plus aria-hidden="true" />
                  Adicionar
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-sticky" aria-label="Carrinho">
          <form className="checkout-panel" onSubmit={submitOrder}>
            <div className="section-head">
              <h2>Carrinho</h2>
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

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
    </main>
  );
}
