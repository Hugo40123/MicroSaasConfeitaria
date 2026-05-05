import type { OrderStatus } from "@/lib/sample-data";

const statusCopy: Record<OrderStatus, string> = {
  aguardando_confirmacao: "Aguardando confirmação",
  confirmado: "Confirmado",
  pendente: "Pendente",
  em_producao: "Em produção",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado"
};

const statusClass: Record<OrderStatus, string> = {
  aguardando_confirmacao: "pending",
  confirmado: "ready",
  pendente: "pending",
  em_producao: "production",
  pronto: "ready",
  saiu_para_entrega: "production",
  entregue: "ready",
  cancelado: "cancelled"
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${statusClass[status]}`}>{statusCopy[status]}</span>;
}
