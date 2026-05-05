import { MetricCard } from "@/components/metric-card";
import { requirePermission } from "@/lib/current-user";
import { createFinancialTransactionAction } from "@/lib/financial-actions";
import { getFinancialSummary } from "@/lib/financial-repository";
import { formatCurrency } from "@/lib/sample-data";
import { ArrowDownCircle, ArrowUpCircle, Plus, WalletCards } from "lucide-react";

export default async function FinancePage() {
  const user = await requirePermission("view_finance");
  const financeResult = await getFinancialSummary(user.storeId);
  const { balance, entries, exits, transactions } = financeResult.data;
  const isMock = financeResult.source === "mock";

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
        </div>
        <div className="actions">
          <a className="btn btn-primary" href="#nova-movimentacao">
            <Plus aria-hidden="true" />
            Nova movimentação
          </a>
        </div>
      </header>

      <section className="metrics-grid">
        <MetricCard
          detail="Pedidos, sinais e receitas"
          icon={ArrowUpCircle}
          label="Entradas"
          value={formatCurrency(entries)}
        />
        <MetricCard
          detail="Despesas manuais"
          icon={ArrowDownCircle}
          label="Saidas"
          value={formatCurrency(exits)}
        />
        <MetricCard
          detail="Resultado do periodo"
          icon={WalletCards}
          label="Saldo"
          value={formatCurrency(balance)}
        />
      </section>

      <section className="panel" id="nova-movimentacao" style={{ marginTop: "1rem" }}>
        <div className="section-head">
          <h2>Nova movimentação</h2>
        </div>
        <form action={createFinancialTransactionAction} className="product-form">
          <div className="form-grid">
            <label className="field">
              <span>Tipo</span>
              <select className="select" disabled={isMock} name="type">
                <option value="INCOME">Entrada</option>
                <option value="EXPENSE">Saída</option>
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
              <input className="input" disabled={isMock} name="date" type="date" />
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
                <th>Descricao</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td>
                    <span className={`badge ${transaction.type === "Entrada" ? "ready" : "cancelled"}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td>{transaction.description}</td>
                  <td>{formatCurrency(transaction.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
