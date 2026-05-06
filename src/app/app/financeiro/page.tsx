import { MetricCard } from "@/components/metric-card";
import { requirePermission } from "@/lib/current-user";
import {
  createFinancialTransactionAction,
  recordOrderPaymentAction
} from "@/lib/financial-actions";
import { getFinancialSummary } from "@/lib/financial-repository";
import { getTodayDateInput } from "@/lib/order-persistence";
import { formatCurrency } from "@/lib/sample-data";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  CreditCard,
  Plus,
  WalletCards
} from "lucide-react";

export default async function FinancePage({
  searchParams
}: {
  searchParams?: Promise<{
    financeError?: string;
    financeSuccess?: string;
  }>;
}) {
  const user = await requirePermission("view_finance");
  const params = await searchParams;
  const financeResult = await getFinancialSummary(user.storeId);
  const {
    entries,
    exits,
    estimatedProductCost,
    estimatedProfit,
    payableOrders,
    transactions
  } = financeResult.data;
  const isMock = financeResult.source === "mock";
  const today = getTodayDateInput();

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
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte do financeiro:{" "}
            {financeResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
          {isMock ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              Lançamentos desabilitados enquanto o PostgreSQL real não estiver
              configurado.
            </p>
          ) : null}
          {params?.financeError ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              {params.financeError}
            </p>
          ) : null}
          {params?.financeSuccess ? (
            <p className="form-success" style={{ marginTop: "0.9rem" }}>
              {params.financeSuccess}
            </p>
          ) : null}
        </div>
        <div className="actions">
          <a className="btn btn-primary" href="#registrar-pagamento">
            <CreditCard aria-hidden="true" />
            Registrar sinal
          </a>
          <a className="btn btn-secondary" href="#nova-movimentacao">
            <Plus aria-hidden="true" />
            Nova movimentação
          </a>
        </div>
      </header>

      <section className="metrics-grid">
        <MetricCard
          detail="Entradas recebidas"
          icon={ArrowUpCircle}
          label="Faturamento"
          value={formatCurrency(entries)}
        />
        <MetricCard
          detail="Despesas registradas"
          icon={ArrowDownCircle}
          label="Despesas"
          value={formatCurrency(exits)}
        />
        <MetricCard
          detail="Produtos dos pedidos pagos"
          icon={Calculator}
          label="Custo estimado"
          value={formatCurrency(estimatedProductCost)}
        />
        <MetricCard
          detail="Faturamento - despesas - custos"
          icon={WalletCards}
          label="Lucro estimado"
          value={formatCurrency(estimatedProfit)}
        />
      </section>

      <section className="panel" id="registrar-pagamento" style={{ marginTop: "1rem" }}>
        <div className="section-head">
          <div>
            <h2>Pagamento ou sinal de pedido</h2>
            <p className="muted">
              Vincula a entrada ao pedido e atualiza o valor pago exibido em pedidos.
            </p>
          </div>
        </div>
        <form action={recordOrderPaymentAction} className="product-form">
          <div className="form-grid">
            <label className="field">
              <span>Pedido</span>
              <select
                className="select"
                disabled={isMock || payableOrders.length === 0}
                name="orderId"
                required
              >
                <option value="">Selecione</option>
                {payableOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.code} - {order.customer} - falta{" "}
                    {formatCurrency(order.remainingAmount)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Valor recebido</span>
              <input
                className="input"
                disabled={isMock || payableOrders.length === 0}
                min="0.01"
                name="amount"
                required
                step="0.01"
                type="number"
              />
            </label>
            <label className="field">
              <span>Data</span>
              <input
                className="input"
                defaultValue={today}
                disabled={isMock || payableOrders.length === 0}
                name="date"
                type="date"
              />
            </label>
          </div>
          <label className="field">
            <span>Descrição opcional</span>
            <input
              className="input"
              disabled={isMock || payableOrders.length === 0}
              name="description"
              placeholder="Ex.: Sinal via PIX"
            />
          </label>
          <div className="actions">
            <button
              className="btn btn-primary"
              disabled={isMock || payableOrders.length === 0}
              type="submit"
            >
              <CreditCard aria-hidden="true" />
              Registrar pagamento
            </button>
          </div>
          {payableOrders.length === 0 ? (
            <p className="muted">Nenhum pedido disponível para pagamento.</p>
          ) : null}
        </form>
      </section>

      <section className="panel" id="nova-movimentacao" style={{ marginTop: "1rem" }}>
        <div className="section-head">
          <h2>Movimentação avulsa</h2>
        </div>
        <form action={createFinancialTransactionAction} className="product-form">
          <div className="form-grid">
            <label className="field">
              <span>Tipo</span>
              <select className="select" disabled={isMock} name="type">
                <option value="INCOME">Entrada avulsa</option>
                <option value="EXPENSE">Despesa</option>
              </select>
            </label>
            <label className="field">
              <span>Valor</span>
              <input
                className="input"
                disabled={isMock}
                min="0.01"
                name="amount"
                required
                step="0.01"
                type="number"
              />
            </label>
            <label className="field">
              <span>Data</span>
              <input className="input" defaultValue={today} disabled={isMock} name="date" type="date" />
            </label>
          </div>
          <label className="field">
            <span>Descrição</span>
            <input className="input" disabled={isMock} name="description" required />
          </label>
          <div className="actions">
            <button className="btn btn-primary" disabled={isMock} type="submit">
              <Plus aria-hidden="true" />
              Registrar
            </button>
          </div>
        </form>
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
                <th>Pedido</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td data-label="Data">{transaction.date}</td>
                  <td data-label="Tipo">
                    <span className={`badge ${transaction.type === "Entrada" ? "ready" : "cancelled"}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td data-label="Pedido">{transaction.orderCode ?? "Avulso"}</td>
                  <td data-label="Descrição">{transaction.description}</td>
                  <td data-label="Valor">{formatCurrency(transaction.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 ? (
            <p className="muted">Nenhuma movimentação registrada ainda.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
