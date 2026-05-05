export type OrderStatus =
  | "aguardando_confirmacao"
  | "confirmado"
  | "pendente"
  | "em_producao"
  | "pronto"
  | "saiu_para_entrega"
  | "entregue"
  | "cancelado";

export type ProductCategory =
  | "Bolos inteiros"
  | "Fatias"
  | "Doces"
  | "Extras";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  preparationTime: string;
  online: boolean;
  active: boolean;
  imageUrl?: string;
  artBg: string;
  artShape: string;
};

export type Order = {
  id: string;
  code: string;
  customer: string;
  whatsapp: string;
  source: "Portal do cliente" | "Pedido interno";
  items: string[];
  deliveryDate: string;
  deliveryTime: string;
  fulfillment: "Retirada" | "Entrega";
  paymentMethod?: "Dinheiro" | "PIX" | "Cartão";
  deliveryFee?: number;
  status: OrderStatus;
  total: number;
  paidSignal: number;
  urgent?: boolean;
  storeName?: string;
  storeSlug?: string;
  storePhone?: string;
  storeAddress?: string;
};

export const store = {
  name: "Doce Maria",
  slug: "doce-maria",
  phone: "(11) 99999-2323",
  address: "Rua das Flores, 120 - Centro",
  description:
    "Bolos caseiros, fatias prontas e encomendas personalizadas com confirmacao rapida pelo WhatsApp."
};

export const products: Product[] = [
  {
    id: "p1",
    name: "Bolo Ninho com Morango",
    category: "Bolos inteiros",
    description: "Massa branca, recheio de leite ninho e morangos frescos.",
    price: 128,
    preparationTime: "2 dias",
    online: true,
    active: true,
    artBg: "#fde8f0",
    artShape: "#d9487d"
  },
  {
    id: "p2",
    name: "Fatia Chocolate Cremoso",
    category: "Fatias",
    description: "Fatia alta com ganache cremosa e massa de cacau.",
    price: 16,
    preparationTime: "Pronta entrega",
    online: true,
    active: true,
    artBg: "#f3e7dd",
    artShape: "#6f3e2e"
  },
  {
    id: "p3",
    name: "Brigadeiro Gourmet",
    category: "Doces",
    description: "Caixinha com 12 unidades de brigadeiro tradicional.",
    price: 38,
    preparationTime: "1 dia",
    online: true,
    active: true,
    artBg: "#dcf8f3",
    artShape: "#118f84"
  },
  {
    id: "p4",
    name: "Topper Personalizado",
    category: "Extras",
    description: "Topper simples para tema, nome ou idade.",
    price: 24,
    preparationTime: "1 dia",
    online: true,
    active: true,
    artBg: "#e6f0ff",
    artShape: "#2f6fc3"
  },
  {
    id: "p5",
    name: "Bolo Red Velvet",
    category: "Bolos inteiros",
    description: "Massa vermelha, cream cheese suave e decoracao minimalista.",
    price: 145,
    preparationTime: "3 dias",
    online: true,
    active: true,
    artBg: "#fee4e2",
    artShape: "#c2413b"
  },
  {
    id: "p6",
    name: "Beijinho",
    category: "Doces",
    description: "Caixinha com 15 unidades de beijinho com coco fresco.",
    price: 42,
    preparationTime: "1 dia",
    online: false,
    active: true,
    artBg: "#fff4d6",
    artShape: "#b7791f"
  }
];

export const orders: Order[] = [
  {
    id: "o1",
    code: "BM-1042",
    customer: "Ana Paula",
    whatsapp: "(11) 98888-1001",
    source: "Portal do cliente",
    items: ["Bolo Ninho com Morango", "Topper Personalizado"],
    deliveryDate: "Hoje",
    deliveryTime: "16:00",
    fulfillment: "Retirada",
    paymentMethod: "PIX",
    deliveryFee: 0,
    status: "aguardando_confirmacao",
    total: 152,
    paidSignal: 0,
    urgent: true
  },
  {
    id: "o2",
    code: "BM-1041",
    customer: "Camila Rocha",
    whatsapp: "(11) 97777-2202",
    source: "Pedido interno",
    items: ["Fatia Chocolate Cremoso", "Brigadeiro Gourmet"],
    deliveryDate: "Hoje",
    deliveryTime: "11:30",
    fulfillment: "Entrega",
    paymentMethod: "Dinheiro",
    deliveryFee: 5,
    status: "em_producao",
    total: 86,
    paidSignal: 40
  },
  {
    id: "o3",
    code: "BM-1040",
    customer: "Rafael Lima",
    whatsapp: "(11) 96666-3303",
    source: "Portal do cliente",
    items: ["Bolo Red Velvet"],
    deliveryDate: "Amanha",
    deliveryTime: "10:00",
    fulfillment: "Retirada",
    paymentMethod: "Cartão",
    deliveryFee: 0,
    status: "confirmado",
    total: 145,
    paidSignal: 72.5
  },
  {
    id: "o4",
    code: "BM-1039",
    customer: "Juliana Martins",
    whatsapp: "(11) 95555-4404",
    source: "Portal do cliente",
    items: ["Brigadeiro Gourmet"],
    deliveryDate: "Hoje",
    deliveryTime: "09:00",
    fulfillment: "Entrega",
    paymentMethod: "PIX",
    deliveryFee: 5,
    status: "pronto",
    total: 38,
    paidSignal: 38
  }
];

export const productionAgenda = [
  {
    time: "09:00",
    title: "Separar doces para entrega",
    customer: "Juliana Martins",
    status: "pronto" as OrderStatus
  },
  {
    time: "11:30",
    title: "Finalizar fatias e caixa de brigadeiros",
    customer: "Camila Rocha",
    status: "em_producao" as OrderStatus
  },
  {
    time: "16:00",
    title: "Confirmar bolo com topper personalizado",
    customer: "Ana Paula",
    status: "aguardando_confirmacao" as OrderStatus
  }
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
