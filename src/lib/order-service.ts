import { products } from "@/lib/sample-data";

export type CustomerOrderItemInput = {
  productId: string;
  quantity: number;
  customizationNotes?: string;
};

export type CustomerOrderInput = {
  storeSlug: string;
  customerName: string;
  customerWhatsapp: string;
  fulfillment: "Retirada" | "Entrega";
  deliveryAddress?: string;
  deliveryDate: string;
  customerNotes?: string;
  items: CustomerOrderItemInput[];
};

export type CustomerOrderResult = {
  code: string;
  trackingUrl: string;
  status: "aguardando_confirmacao";
  customerName: string;
  customerWhatsapp: string;
  fulfillment: "Retirada" | "Entrega";
  deliveryAddress?: string;
  deliveryDate: string;
  customerNotes?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customizationNotes?: string;
  }[];
  totalAmount: number;
};

export class OrderValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "OrderValidationError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const toQuantity = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : 0;
};

const dateOnly = (value: Date) => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const hasValidDeliveryDate = (value: string) => {
  const deliveryDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(deliveryDate.getTime())) return false;

  return dateOnly(deliveryDate) >= dateOnly(new Date());
};

const makeOrderCode = () => {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `BM-${suffix}`;
};

export function parseCustomerOrderInput(payload: unknown): CustomerOrderInput {
  if (!isRecord(payload)) {
    throw new OrderValidationError(["Envie os dados do pedido em JSON."]);
  }

  const storeSlug = toText(payload.storeSlug);
  const customerName = toText(payload.customerName);
  const customerWhatsapp = toText(payload.customerWhatsapp);
  const fulfillment =
    payload.fulfillment === "Retirada" || payload.fulfillment === "Entrega"
      ? payload.fulfillment
      : null;
  const deliveryAddress = toText(payload.deliveryAddress);
  const deliveryDate = toText(payload.deliveryDate);
  const customerNotes = toText(payload.customerNotes);
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const issues: string[] = [];

  if (storeSlug.length < 2) issues.push("Loja invalida.");
  if (customerName.length < 3) issues.push("Informe o nome do cliente.");
  if (customerWhatsapp.replace(/\D/g, "").length < 10) {
    issues.push("Informe um WhatsApp valido.");
  }
  if (!fulfillment) {
    issues.push("Escolha retirada ou entrega.");
  }
  if (fulfillment === "Entrega" && deliveryAddress.length < 5) {
    issues.push("Informe o endereco de entrega.");
  }
  if (!hasValidDeliveryDate(deliveryDate)) {
    issues.push("Escolha uma data de entrega valida.");
  }
  if (rawItems.length === 0) issues.push("Adicione pelo menos um produto.");

  const items = rawItems
    .filter(isRecord)
    .map((item) => ({
      productId: toText(item.productId),
      quantity: toQuantity(item.quantity),
      customizationNotes: toText(item.customizationNotes)
    }))
    .filter((item) => item.productId.length > 0);

  if (items.length !== rawItems.length) {
    issues.push("Revise os produtos do carrinho.");
  }

  for (const item of items) {
    if (item.quantity < 1 || item.quantity > 99) {
      issues.push("A quantidade de cada produto deve ficar entre 1 e 99.");
    }
  }

  if (issues.length > 0) {
    throw new OrderValidationError([...new Set(issues)]);
  }

  if (!fulfillment) {
    throw new OrderValidationError(["Escolha retirada ou entrega."]);
  }

  return {
    storeSlug,
    customerName,
    customerWhatsapp,
    fulfillment,
    deliveryAddress: fulfillment === "Entrega" ? deliveryAddress : undefined,
    deliveryDate,
    customerNotes: customerNotes || undefined,
    items
  };
}

export function createCustomerPortalOrder(
  input: CustomerOrderInput
): CustomerOrderResult {
  const items = input.items.map((item) => {
    const product = products.find((current) => current.id === item.productId);

    if (!product) {
      throw new OrderValidationError(["Produto nao encontrado."]);
    }

    const totalPrice = product.price * item.quantity;

    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice,
      customizationNotes: item.customizationNotes || undefined
    };
  });
  const code = makeOrderCode();
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    code,
    trackingUrl: `/pedido/${code}`,
    status: "aguardando_confirmacao",
    customerName: input.customerName,
    customerWhatsapp: input.customerWhatsapp,
    fulfillment: input.fulfillment,
    deliveryAddress: input.deliveryAddress,
    deliveryDate: input.deliveryDate,
    customerNotes: input.customerNotes,
    items,
    totalAmount
  };
}
