import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export function MetricCard({ label, value, detail, icon: Icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <p className="metric-label">{label}</p>
        <span className="metric-icon" aria-hidden="true">
          <Icon />
        </span>
      </div>
      <p className="metric-value">{value}</p>
      <p className="metric-label">{detail}</p>
    </article>
  );
}
