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

type StorefrontStep = "menu" | "product" | "cart" | "checkout";
type PaymentMethod = "Dinheiro" | "PIX" | "Cartão";

const categories = ["Todos", "Bolos inteiros", "Fatias", "Doces", "Extras"] as const;
const deliveryFeeAmount = 5;

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
  const [step, setStep] = useState<StorefrontStep>("menu");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fulfillment, setFulfillment] = useState<"Retirada" | "Entrega">("Retirada");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
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
  const deliveryFee = fulfillment === "Entrega" ? deliveryFeeAmount : 0;
  const orderTotal = total + deliveryFee;

  function addProduct(product: Product) {
    setCart((current) => ({
      ...current,
      [product.id]: {
        product,
        quantity: (current[product.id]?.quantity ?? 0) + 1
      }
    }));
  }

  function addProductAndShowCart(product: Product) {
    addProduct(product);
    setStep("cart");
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setStep("product");
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
      deliveryTime: String(formData.get("deliveryTime") ?? ""),
      paymentMethod,
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

        setFormError(issues || "Não foi possível enviar o pedido.");
        return;
      }

      setCreatedOrder({
        code: result.data.code,
        trackingUrl: result.data.trackingUrl
      });
      setCart({});
      setStep("menu");
    } catch {
      setFormError("Não foi possível conectar com o servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderProductMedia(product: Product, className: string) {
    if (product.imageUrl) {
      return <img className={className} src={product.imageUrl} alt="" />;
    }

    return (
      <div
        aria-hidden="true"
        className={`product-art ${className}`}
        style={
          {
            "--art-bg": product.artBg,
            "--art-shape": product.artShape
          } as CSSProperties
        }
      />
    );
  }

  if (createdOrder) {
    const whatsappHref = makeStoreWhatsAppHref(
      store.phone,
      `Ola! Acabei de enviar o pedido ${createdOrder.code} pelo cardapio online.`
    );

    return (
      <main className="storefront storefront-confirmation">
        <header className="store-topbar">
          <span className="store-mini-brand">
            <span className="store-mini-mark">{store.name.slice(0, 1)}</span>
            <span>{store.name}</span>
          </span>
          <span className="cart-pill">
            <ShoppingCart aria-hidden="true" />
          </span>
        </header>
        <section className="order-confirmation">
          <span className="confirmation-icon" aria-hidden="true">
            <CheckCircle2 />
          </span>
          <h1>Seu pedido foi recebido!</h1>
          <p>
            Seu pedido foi enviado para nosso atendimento. Faremos contato direto
            com você.
          </p>
          <p>
            ID do pedido: <strong>{createdOrder.code}</strong>
          </p>
          <div className="actions">
            <a className="btn btn-rose" href={createdOrder.trackingUrl}>
              Continuar acompanhando
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
        <button className="store-mini-brand" onClick={() => setStep("menu")} type="button">
          <span className="store-mini-mark">{store.name.slice(0, 1)}</span>
          <span>{store.name}</span>
        </button>
        <button className="cart-pill" onClick={() => setStep("cart")} type="button">
          <ShoppingCart aria-hidden="true" />
          <span>{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
        </button>
      </header>

      {step === "menu" ? (
        <>
          <section className="store-hero">
            <div className="store-banner">
              <div className="store-banner-inner">
                <p className="eyebrow">Cardapio online</p>
                <h1>{store.name}</h1>
                <p>{store.description}</p>
                <div className="store-hero-meta">
                  <span>
                    <MapPin aria-hidden="true" />
                    {store.address || "Retirada e entrega sob combinação"}
                  </span>
                  <span>
                    <Clock3 aria-hidden="true" />
                    {source === "database" ? "Cardápio atualizado" : "Dados de exemplo"}
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
                  <p className="muted">
                    Produtos selecionados para pedir com poucos toques.
                  </p>
                </div>
              </div>
              <div className="featured-grid">
                {featuredProducts.map((product) => (
                  <article className="featured-card" key={`featured-${product.id}`}>
                    <button
                      className="product-card-link"
                      onClick={() => openProduct(product)}
                      type="button"
                    >
                      {renderProductMedia(product, "featured-image")}
                      <span className="product-body">
                        <span className="product-category">{product.category}</span>
                        <strong>{product.name}</strong>
                        <span className="price">{formatCurrency(product.price)}</span>
                      </span>
                    </button>
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
                <p className="muted">
                  Onde você encontra todos os produtos, ordenados ou filtrados.
                </p>
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
                  <button
                    className="product-card-link"
                    onClick={() => openProduct(product)}
                    type="button"
                  >
                    {renderProductMedia(product, "product-image")}
                    <span className="product-body">
                      <span className="product-category">{product.category}</span>
                      <strong>{product.name}</strong>
                      <span className="muted">{product.description}</span>
                    </span>
                  </button>
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
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {step === "product" && selectedProduct ? (
        <section className="store-step">
          <button className="store-back" onClick={() => setStep("menu")} type="button">
            Voltar ao cardápio
          </button>
          <article className="product-detail">
            {renderProductMedia(selectedProduct, "product-detail-image")}
            <div className="product-detail-body">
              <span className="product-category">{selectedProduct.category}</span>
              <h1>{selectedProduct.name}</h1>
              <p>{selectedProduct.description}</p>
              <span className="product-detail-meta">{selectedProduct.preparationTime}</span>
              <div className="product-detail-price">
                <strong>{formatCurrency(selectedProduct.price)}</strong>
              </div>
              <button
                className="btn btn-rose"
                onClick={() => addProductAndShowCart(selectedProduct)}
                type="button"
              >
                <Plus aria-hidden="true" />
                Adicionar ao carrinho
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {step === "cart" ? (
        <section className="store-step">
          <div className="cart-page-head">
            <h1>Seu carrinho</h1>
            <span>{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-state">
              <p className="muted">Seu carrinho ainda esta vazio.</p>
              <button className="btn btn-primary" onClick={() => setStep("menu")} type="button">
                Ver cardápio
              </button>
            </div>
          ) : (
            <>
              <div className="cart-list">
                {cartItems.map((item) => (
                  <div className="cart-product-line" key={item.product.id}>
                    {renderProductMedia(item.product, "cart-product-image")}
                    <div>
                      <span className="product-category">{item.product.category}</span>
                      <strong>{item.product.name}</strong>
                      <span>{formatCurrency(item.product.price * item.quantity)}</span>
                    </div>
                    <div className="qty-control">
                      <button
                        className="icon-btn"
                        onClick={() => removeProduct(item.product.id)}
                        type="button"
                      >
                        <Minus aria-hidden="true" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="icon-btn"
                        onClick={() => addProduct(item.product)}
                        type="button"
                      >
                        <Plus aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary-panel">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <button className="btn btn-rose" onClick={() => setStep("checkout")} type="button">
                  Continuar
                  <Send aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {step === "checkout" ? (
        <section className="store-layout">
          <aside className="cart-sticky" aria-label="Carrinho" id="checkout">
            <form className="checkout-panel" onSubmit={submitOrder}>
              <button className="store-back" onClick={() => setStep("cart")} type="button">
                Voltar ao carrinho
              </button>
              <div className="checkout-head">
                <div>
                  <p className="eyebrow">Finalizar</p>
                  <h2>Confira e finalize seu pedido</h2>
                </div>
              </div>

              <div className="list">
                {cartItems.map((item) => (
                  <div className="cart-line" key={item.product.id}>
                    <div>
                      <p className="item-title">{item.product.name}</p>
                      <p className="muted">
                        {item.quantity} x {formatCurrency(item.product.price)}
                      </p>
                    </div>
                    <strong>{formatCurrency(item.product.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>

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

              <input name="paymentMethod" type="hidden" value={paymentMethod} />

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
                  <label htmlFor="address">Endereço</label>
                  <input
                    className="input"
                    id="address"
                    name="deliveryAddress"
                    required
                  />
                </div>
              ) : null}

              <div className="checkout-fields">
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
                  <label htmlFor="delivery-time">Horário desejado</label>
                  <span style={{ position: "relative" }}>
                    <Clock3
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
                      id="delivery-time"
                      name="deliveryTime"
                      style={{ paddingLeft: "2.25rem" }}
                      type="time"
                    />
                  </span>
                </div>
              </div>

              <div className="field">
                <span>Forma de pagamento</span>
                <div className="checkout-choice-grid">
                  {(["PIX", "Dinheiro", "Cartão"] as const).map((method) => (
                    <button
                      className={`btn ${paymentMethod === method ? "btn-primary" : "btn-secondary"}`}
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      type="button"
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="notes">Observações</label>
                <textarea
                  className="textarea"
                  id="notes"
                  name="customerNotes"
                  placeholder="Tema, restrições, mensagem no bolo..."
                />
              </div>

              <div className="order-total-list">
                <div>
                  <span>Itens</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
                <div>
                  <span>Frete</span>
                  <strong>
                    {fulfillment === "Entrega" ? formatCurrency(deliveryFee) : "R$ 0,00"}
                  </strong>
                </div>
                <div>
                  <span>Pagamento</span>
                  <strong>{paymentMethod}</strong>
                </div>
                <div className="total-row">
                  <span>Total estimado</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>

              {formError ? <p className="form-error">{formError}</p> : null}

              <button
                className="btn btn-rose"
                disabled={cartItems.length === 0 || isSubmitting}
                type="submit"
              >
                <Send aria-hidden="true" />
                {isSubmitting ? "Enviando..." : "Confirmar pedido"}
              </button>
            </form>
          </aside>
        </section>
      ) : null}

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
        <p>Copyright (c) {store.name}</p>
      </footer>
    </main>
  );
}
