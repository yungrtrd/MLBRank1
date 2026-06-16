import { MetricDefinition } from "@/lib/types";

type MetricPillProps = {
  metric: MetricDefinition;
  active?: boolean;
};

export function MetricPill({ metric, active }: MetricPillProps) {
  return (
    <div className={active ? "metric-pill active" : "metric-pill"}>
      <strong>{metric.label}</strong>
      <span className="cell-muted">{metric.betterDirection === "lower" ? "Lower is better" : "Higher is better"}</span>
    </div>
  );
}
