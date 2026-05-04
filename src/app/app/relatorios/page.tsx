import { MetricCard } from "@/components/metric-card";
import { formatCurrency, orders, products } from "@/lib/sample-data";
import { BarChart3, CalendarDays, Package, PieChart } from "lucide-react";

export default function ReportsPage() {
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter(
    (order) => order.status === "aguardando_confirmacao"
  ).length;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Relatórios</p>
          <h1>Vendas, produtos e status com leitura rápida.</h1>
          <p className="lead">
            Indicadores simples para a dona da loja entender o mês sem precisar
            exportar planilhas.
          </p>
        </div>
      </header>

      <section className="metrics-grid">
        <MetricCard
          detail="Pedidos cadastrados"
          icon={CalendarDays}
          label="Pedidos"
          value={String(orders.length)}
        />
        <MetricCard
          detail="Valor total de pedidos"
          icon={BarChart3}
          label="Faturamento"
          value={formatCurrency(revenue)}
        />
        <MetricCard
          detail="Aguardando revisão"
          icon={PieChart}
          label="Pendentes"
          value={String(pending)}
        />
        <MetricCard
          detail="Disponíveis no portal"
          icon={Package}
          label="Produtos online"
          value={String(products.filter((product) => product.online).length)}
        />
      </section>

      <section className="split" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <div className="section-head">
            <h2>Produtos mais vendidos</h2>
          </div>
          <div className="list">
            {["Bolo Ninho com Morango", "Fatia Chocolate Cremoso", "Brigadeiro Gourmet"].map(
              (item, index) => (
                <article className="item-card" key={item}>
                  <div className="item-main">
                    <div>
                      <p className="item-title">{item}</p>
                      <p className="item-subtitle">{12 - index * 3} vendas no período</p>
                    </div>
                    <span className="badge neutral">#{index + 1}</span>
                  </div>
                </article>
              )
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Pedidos por status</h2>
          </div>
          <div className="list">
            {[
              ["Aguardando confirmação", 1],
              ["Em produção", 1],
              ["Confirmado", 1],
              ["Pronto", 1]
            ].map(([label, value]) => (
              <article className="item-card" key={label}>
                <div className="item-main">
                  <p className="item-title">{label}</p>
                  <span className="badge neutral">{value}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
