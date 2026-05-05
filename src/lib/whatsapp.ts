import { formatCurrency, type Order } from "@/lib/sample-data";

function toWhatsAppPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function getOrderMessage(order: Order) {
  const trackingUrl = `${getBaseUrl()}/pedido/${order.code}`;
  const items = order.items.join(", ");

  if (order.status === "aguardando_confirmacao") {
    return `Olá, ${order.customer}! Recebemos o pedido ${order.code}: ${items}. Total estimado: ${formatCurrency(order.total)}. Vamos confirmar disponibilidade e prazo por aqui. Acompanhe em ${trackingUrl}`;
  }

  if (order.status === "pronto") {
    return `Olá, ${order.customer}! Seu pedido ${order.code} está pronto. Itens: ${items}. Total: ${formatCurrency(order.total)}. Acompanhe em ${trackingUrl}`;
  }

  if (order.status === "entregue") {
    return `Olá, ${order.customer}! Registramos o pedido ${order.code} como entregue. Recibo: ${items}. Total: ${formatCurrency(order.total)}. Obrigado pela preferência!`;
  }

  if (order.status === "cancelado") {
    return `Olá, ${order.customer}. O pedido ${order.code} foi cancelado. Se quiser, podemos combinar uma nova data ou outro produto por aqui.`;
  }

  return `Olá, ${order.customer}! Atualização do pedido ${order.code}: ${items}. Status atual no acompanhamento: ${trackingUrl}. Total: ${formatCurrency(order.total)}.`;
}

export function makeOrderWhatsAppHref(order: Order) {
  const phone = toWhatsAppPhone(order.whatsapp);
  const message = encodeURIComponent(getOrderMessage(order));

  return phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
}

export function makeStoreWhatsAppHref(phone: string, message: string) {
  const whatsappPhone = toWhatsAppPhone(phone);
  const text = encodeURIComponent(message);

  return whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${text}` : `https://wa.me/?text=${text}`;
}
