import { MetricCard } from "@/components/metric-card";
import { requirePermission } from "@/lib/current-user";
import { formatCurrency, orders } from "@/lib/sample-data";
import { ArrowDownCircle, ArrowUpCircle, Plus, WalletCards } from "lucide-react";

const expenses = [
  { date: "Hoje", description: "Morango e leite condensado", value: 64 },
  { date: "Hoje", description: "Embalagens", value: 28 },
  { date: "Ontem", description: "Entrega por aplicativo", value: 18 }
];

export default async function FinancePage() {
  await requirePermission("view_finance");

  const entries = orders.reduce((sum, order) => sum + order.paidSignal, 0);
  const exits = expenses.reduce((sum, expense) => sum + expense.value, 0);
  const balance = entries - exits;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Financeiro</p>
          <h1>Caixa básico para entradas, sinais e despesas.</h1>
          <p className="lead">
            O foco é dar clareza diária sem transformar a operação em contabilidade
            completa.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="button">
            <Plus aria-hidden="true" />
            Nova despesa
          </button>
        </div>
      </header>

      <section className="metrics-grid">
        <MetricCard
          detail="Pedidos e sinais recebidos"
          icon={ArrowUpCircle}
          label="Entradas"
          value={formatCurrency(entries)}
        />
        <MetricCard
          detail="Despesas manuais"
          icon={ArrowDownCircle}
          label="Saídas"
          value={formatCurrency(exits)}
        />
        <MetricCard
          detail="Resultado do período"
          icon={WalletCards}
          label="Saldo"
          value={formatCurrency(balance)}
        />
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <div className="section-head">
          <h2>Movimentações recentes</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.deliveryDate}</td>
                  <td>
                    <span className="badge ready">Entrada</span>
                  </td>
                  <td>Sinal pedido {order.code}</td>
                  <td>{formatCurrency(order.paidSignal)}</td>
                </tr>
              ))}
              {expenses.map((expense) => (
                <tr key={expense.description}>
                  <td>{expense.date}</td>
                  <td>
                    <span className="badge cancelled">Saída</span>
                  </td>
                  <td>{expense.description}</td>
                  <td>{formatCurrency(expense.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
