import { MetricCard } from "@/components/metric-card";
import { requirePermission } from "@/lib/current-user";
import { getReportsForCurrentStore } from "@/lib/report-repository";
import { formatCurrency } from "@/lib/sample-data";
import { BarChart3, CalendarDays, Package, PieChart } from "lucide-react";

export default async function ReportsPage() {
  const user = await requirePermission("view_reports");
  const reportsResult = await getReportsForCurrentStore(user.storeId);
  const reports = reportsResult.data;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Relatorios</p>
          <h1>Vendas, produtos e status com leitura rapida.</h1>
          <p className="lead">
            Indicadores simples para a dona da loja entender o mes sem precisar
            exportar planilhas.
          </p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte dos relatorios:{" "}
            {reportsResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
        </div>
      </header>

      <section className="metrics-grid">
        <MetricCard
          detail="Pedidos cadastrados"
          icon={CalendarDays}
          label="Pedidos"
          value={String(reports.orderCount)}
        />
        <MetricCard
          detail="Valor total de pedidos"
          icon={BarChart3}
          label="Faturamento"
          value={formatCurrency(reports.revenue)}
        />
        <MetricCard
          detail="Aguardando revisao"
          icon={PieChart}
          label="Pendentes"
          value={String(reports.pendingCount)}
        />
        <MetricCard
          detail="Disponiveis no portal"
          icon={Package}
          label="Produtos online"
          value={String(reports.onlineProductCount)}
        />
      </section>

      <section className="split" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <div className="section-head">
            <h2>Produtos mais vendidos</h2>
          </div>
          <div className="list">
            {reports.topProducts.map((item, index) => (
              <article className="item-card" key={item.name}>
                <div className="item-main">
                  <div>
                    <p className="item-title">{item.name}</p>
                    <p className="item-subtitle">{item.quantity} unidades no periodo</p>
                  </div>
                  <span className="badge neutral">#{index + 1}</span>
                </div>
              </article>
            ))}
            {reports.topProducts.length === 0 ? (
              <p className="muted">Ainda nao ha itens vendidos.</p>
            ) : null}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Pedidos por status</h2>
          </div>
          <div className="list">
            {reports.statusCounts.map((item) => (
              <article className="item-card" key={item.label}>
                <div className="item-main">
                  <p className="item-title">{item.label}</p>
                  <span className="badge neutral">{item.value}</span>
                </div>
              </article>
            ))}
            {reports.statusCounts.length === 0 ? (
              <p className="muted">Ainda nao ha pedidos cadastrados.</p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
