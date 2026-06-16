import { CompareResponse } from "@/lib/types";

const palette = ["#9ae6b4", "#f4d06f", "#7dd3fc", "#fda4af", "#c4b5fd", "#fb7185"];

type TrendChartProps = {
  response: CompareResponse;
  metricId: string;
};

export function TrendChart({ response, metricId }: TrendChartProps) {
  const allPoints = response.players.flatMap((player) => player.series[metricId] ?? []);
  const values = allPoints.map((point) => point.value).filter((value): value is number => value !== null);

  if (!values.length) {
    return (
      <section className="chart-card">
        <h2>Trend View</h2>
        <div className="empty-card">No season trend is available for this metric.</div>
      </section>
    );
  }

  const seasons = [...new Set(allPoints.map((point) => point.season))].sort((left, right) => left - right);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const xFor = (season: number) => {
    if (seasons.length === 1) {
      return 40;
    }
    const index = seasons.indexOf(season);
    return 40 + (index / (seasons.length - 1)) * 620;
  };
  const yFor = (value: number) => {
    if (minValue === maxValue) {
      return 110;
    }
    const ratio = (value - minValue) / (maxValue - minValue);
    return 210 - ratio * 160;
  };

  return (
    <section className="chart-card">
      <h2>Trend View</h2>
      <div className="legend">
        {response.players.map((player, index) => (
          <div className="legend-item" key={player.player.id}>
            <span className="legend-swatch" style={{ background: palette[index % palette.length] }} />
            {player.player.fullName}
          </div>
        ))}
      </div>
      <svg className="mini-chart" viewBox="0 0 680 240" role="img" aria-label={`${metricId} trend chart`}>
        <line x1="40" y1="210" x2="660" y2="210" stroke="rgba(255,255,255,0.2)" />
        <line x1="40" y1="40" x2="40" y2="210" stroke="rgba(255,255,255,0.2)" />
        {seasons.map((season) => (
          <g key={season}>
            <line x1={xFor(season)} y1="210" x2={xFor(season)} y2="216" stroke="rgba(255,255,255,0.2)" />
            <text x={xFor(season)} y="232" fill="#9eb4d6" fontSize="11" textAnchor="middle">
              {season}
            </text>
          </g>
        ))}
        {response.players.map((player, index) => {
          const points = (player.series[metricId] ?? []).filter(
            (point): point is { season: number; value: number } => point.value !== null
          );
          const path = points
            .map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"} ${xFor(point.season)} ${yFor(point.value)}`)
            .join(" ");

          return (
            <g key={player.player.id}>
              <path d={path} fill="none" stroke={palette[index % palette.length]} strokeWidth="3" strokeLinecap="round" />
              {points.map((point) => (
                <circle
                  key={`${player.player.id}-${point.season}`}
                  cx={xFor(point.season)}
                  cy={yFor(point.value)}
                  r="4.5"
                  fill={palette[index % palette.length]}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </section>
  );
}
