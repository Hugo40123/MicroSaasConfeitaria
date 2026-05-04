"use client";

import { formatCurrency, products, store, type Product } from "@/lib/sample-data";
import {
  CalendarDays,
  CheckCircle2,
  Minus,
  Plus,
  Send,
  ShoppingCart,
  Store
} from "lucide-react";
import { useMemo, useState } from "react";

type CartItem = {
  product: Product;
  quantity: number;
};

const categories = ["Todos", "Bolos inteiros", "Fatias", "Doces", "Extras"] as const;

export function PublicStorefront() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("Todos");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [fulfillment, setFulfillment] = useState<"Retirada" | "Entrega">("Retirada");
  const [submitted, setSubmitted] = useState(false);

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

  if (submitted) {
    return (
      <main className="storefront">
        <section className="store-hero">
          <div className="store-banner">
            <div className="store-banner-inner">
              <p className="eyebrow">Pedido enviado</p>
              <h1>Seu pedido entrou para confirmação da loja.</h1>
              <p>
                Código BM-1042 · A {store.name} vai revisar disponibilidade, prazo e
                sinal antes de iniciar a produção.
              </p>
            </div>
          </div>
          <div className="actions">
            <a className="btn btn-primary" href="/pedido/BM-1042">
              <CheckCircle2 aria-hidden="true" />
              Acompanhar pedido
            </a>
            <a className="btn btn-secondary" href={`https://wa.me/5511999992323`}>
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
            <p className="eyebrow">Cardápio online</p>
            <h1>{store.name}</h1>
            <p>{store.description}</p>
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
              <div
                aria-hidden="true"
                className="product-art"
                style={
                  {
                    "--art-bg": product.artBg,
                    "--art-shape": product.artShape
                  } as React.CSSProperties
                }
              />
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
          <form
            className="checkout-panel"
            onSubmit={(event) => {
              event.preventDefault();
              if (cartItems.length > 0) setSubmitted(true);
            }}
          >
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
              <input className="input" id="customer-name" required />
            </div>

            <div className="field">
              <label htmlFor="customer-whatsapp">WhatsApp</label>
              <input className="input" id="customer-whatsapp" inputMode="tel" required />
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
                <label htmlFor="address">Endereço</label>
                <input className="input" id="address" required />
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
                  required
                  style={{ paddingLeft: "2.25rem" }}
                  type="date"
                />
              </span>
            </div>

            <div className="field">
              <label htmlFor="notes">Observações</label>
              <textarea
                className="textarea"
                id="notes"
                placeholder="Tema, restrições, mensagem no bolo..."
              />
            </div>

            <div className="total-row">
              <span>Total estimado</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <button className="btn btn-rose" disabled={cartItems.length === 0} type="submit">
              <Send aria-hidden="true" />
              Enviar pedido
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
