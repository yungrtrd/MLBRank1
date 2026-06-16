import { CompareFilters } from "@/components/CompareFilters";
import { ComparisonTable } from "@/components/ComparisonTable";
import { MetricDefinitions } from "@/components/MetricDefinitions";
import { TrendChart } from "@/components/TrendChart";
import { buildComparison } from "@/lib/compare";
import { parseCompareState, toCompareRequest } from "@/lib/query-state";

type ComparePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const state = parseCompareState(await searchParams);
  const response = buildComparison(toCompareRequest(state));
  const leadMetric = response.metrics[0]?.id ?? "war";
  const isReadyToCompare = state.playerIds.length >= 2;
  const hasRows = response.players.some((player) =>
    player.rows.some((row) => Object.values(row.stats).some((value) => value !== null))
  );

  return (
    <div className="stack">
      <div className="compare-headline">
        <p className="eyebrow">Interactive compare workspace</p>
        <h1>Flip between career snapshots and year-by-year evidence.</h1>
        <p>
          The compare engine filters out irrelevant metrics by role, keeps selections in the URL, and returns
          chart-ready series from the same payload used by the table.
        </p>
      </div>
      {response.scope === "situation" ? (
        <section className="info-card">
          <h3>Situational split active</h3>
          <p>
            This view is filtering the comparison to <strong>{response.situationLabel}</strong>. Use the setup section
            below to compare late-game, close-score, or other inning-based scenarios within the selected season
            window.
          </p>
        </section>
      ) : null}
      <div className="stack">
        {isReadyToCompare ? (
          hasRows ? (
            <>
              <ComparisonTable response={response} state={state} />
              <TrendChart response={response} metricId={leadMetric} />
              <MetricDefinitions metrics={response.metrics} />
            </>
          ) : (
            <section className="empty-card">
              No split rows matched the current season and situation filters. Try widening the year range or clearing
              one of the situational constraints.
            </section>
          )
        ) : (
          <section className="empty-card">
            Add at least one more player in the setup section to unlock the full comparison table, trend view, and
            export payload.
          </section>
        )}
      </div>
      <section className="panel compare-setup-panel">
        <div className="compare-headline">
          <p className="eyebrow">Compare setup</p>
          <h1>Tune players, season window, and split conditions.</h1>
          <p>The setup now sits below the analysis so the table stays front and center while you review results.</p>
        </div>
        <CompareFilters state={state} />
      </section>
    </div>
  );
}
