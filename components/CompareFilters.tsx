import Link from "next/link";

import { getMetricsForRole } from "@/lib/metrics";
import { getPlayers } from "@/lib/repository";
import { buildCompareHref, ComparePageState } from "@/lib/query-state";

type CompareFiltersProps = {
  state: ComparePageState;
};

function toggleMetric(metrics: string[], metricId: string) {
  return metrics.includes(metricId)
    ? metrics.filter((metric) => metric !== metricId)
    : [...metrics, metricId];
}

export function CompareFilters({ state }: CompareFiltersProps) {
  const allPlayers = getPlayers();
  const metrics = getMetricsForRole(state.role);

  return (
    <div className="stack compare-filters">
      <section className="filter-card">
        <h3>Compare Setup</h3>
        <div className="stack">
          <div className="field">
            <label>Role</label>
            <div className="button-row">
              {(["hitter", "pitcher"] as const).map((role) => (
                <Link
                  className={state.role === role ? "button" : "ghost-button"}
                  href={buildCompareHref({
                    ...state,
                    role,
                    metrics: getMetricsForRole(role).map((metric) => metric.id)
                  })}
                  key={role}
                >
                  {role}
                </Link>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Mode</label>
            <div className="button-row">
              {(["season", "career"] as const).map((mode) => (
                <Link
                  className={state.mode === mode ? "button" : "ghost-button"}
                  href={buildCompareHref({ ...state, mode })}
                  key={mode}
                >
                  {mode === "season" ? "Year by year" : "Career"}
                </Link>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Players</label>
            <div className="cluster">
              {allPlayers
                .filter((player) => player.primaryRole === state.role || player.primaryRole === "two-way")
                .map((player) => {
                  const active = state.playerIds.includes(player.id);
                  const nextPlayers = active
                    ? state.playerIds.filter((id) => id !== player.id)
                    : [...state.playerIds, player.id].slice(0, 6);
                  return (
                    <Link
                      className={active ? "pill active" : "pill"}
                      href={buildCompareHref({ ...state, playerIds: nextPlayers })}
                      key={player.id}
                    >
                      {player.fullName}
                    </Link>
                  );
                })}
            </div>
          </div>
          <div className="field">
            <label>Metric categories</label>
            <div className="cluster">
              {metrics.map((metric) => (
                <Link
                  className={state.metrics.includes(metric.id) ? "pill active" : "pill"}
                  href={buildCompareHref({
                    ...state,
                    metrics: toggleMetric(state.metrics, metric.id).length
                      ? toggleMetric(state.metrics, metric.id)
                      : [metric.id]
                  })}
                  key={metric.id}
                >
                  {metric.label}
                </Link>
              ))}
            </div>
          </div>
          <form action="/compare" className="stack">
            <input name="players" type="hidden" value={state.playerIds.join(",")} />
            <input name="mode" type="hidden" value={state.mode} />
            <input name="role" type="hidden" value={state.role} />
            <input name="metrics" type="hidden" value={state.metrics.join(",")} />
            <input name="sortBy" type="hidden" value={state.sortBy ?? ""} />
            <input name="sortDirection" type="hidden" value={state.sortDirection} />
            <div className="field">
              <label htmlFor="startYear">Start year</label>
              <input defaultValue={state.startYear ?? ""} id="startYear" name="startYear" type="number" />
            </div>
            <div className="field">
              <label htmlFor="endYear">End year</label>
              <input defaultValue={state.endYear ?? ""} id="endYear" name="endYear" type="number" />
            </div>
            <div className="field">
              <label htmlFor="inningMin">Starting inning for split</label>
              <input defaultValue={state.inningMin ?? ""} id="inningMin" max="9" min="1" name="inningMin" type="number" />
            </div>
            <div className="field">
              <label htmlFor="inningMax">Ending inning for split</label>
              <input defaultValue={state.inningMax ?? ""} id="inningMax" max="9" min="1" name="inningMax" type="number" />
            </div>
            <div className="field">
              <label htmlFor="maxRunMargin">Maximum run margin</label>
              <input
                defaultValue={state.maxRunMargin ?? ""}
                id="maxRunMargin"
                max="10"
                min="1"
                name="maxRunMargin"
                type="number"
              />
            </div>
            <button className="button" type="submit">
              Apply filters
            </button>
          </form>
        </div>
      </section>
      <section className="info-card">
        <h3>Share and export</h3>
        <p>Every filter on this page is encoded into the URL. That makes it easy to share the exact same comparison.</p>
        <div className="stack">
          <code className="mono">{buildCompareHref(state)}</code>
          <a
            className="button"
            href={`/api/compare?format=csv&players=${state.playerIds.join(",")}&mode=${state.mode}&role=${state.role}&metrics=${state.metrics.join(",")}${state.startYear ? `&startYear=${state.startYear}` : ""}${state.endYear ? `&endYear=${state.endYear}` : ""}${state.inningMin ? `&inningMin=${state.inningMin}` : ""}${state.inningMax ? `&inningMax=${state.inningMax}` : ""}${state.maxRunMargin ? `&maxRunMargin=${state.maxRunMargin}` : ""}`}
          >
            Download CSV
          </a>
        </div>
      </section>
    </div>
  );
}
