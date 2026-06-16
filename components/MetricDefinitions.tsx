import { MetricDefinition } from "@/lib/types";

type MetricDefinitionsProps = {
  metrics: MetricDefinition[];
};

export function MetricDefinitions({ metrics }: MetricDefinitionsProps) {
  return (
    <section className="metric-grid definition-grid">
      {metrics.map((metric) => (
        <article className="metric-card" key={metric.id}>
          <h3>{metric.label}</h3>
          <p>{metric.description}</p>
          <span className="muted">Source: {metric.sourceLabel}</span>
        </article>
      ))}
    </section>
  );
}
