import type { ActivityMonth } from "@/lib/operational-data";

const chart = {
  left: 52,
  right: 708,
  top: 18,
  bottom: 178,
};

const numberFormat = new Intl.NumberFormat("pt-PT", {
  maximumFractionDigits: 0,
});

export function ActivityChart({ months }: { months: ActivityMonth[] }) {
  const maximum = Math.max(
    ...months.flatMap((month) => [month.applications, month.proposals]),
    1,
  );
  const step = Math.max(1, Math.ceil(maximum / 3));
  const axisMaximum = step * 3;
  const plotHeight = chart.bottom - chart.top;
  const plotWidth = chart.right - chart.left;
  const groupWidth = months.length ? plotWidth / months.length : plotWidth;
  const barWidth = Math.min(24, groupWidth * 0.25);
  const barGap = Math.min(7, groupWidth * 0.07);
  const yFor = (value: number) =>
    chart.bottom - (value / axisMaximum) * plotHeight;
  const heightFor = (value: number) =>
    Math.max(value > 0 ? 2 : 0, (value / axisMaximum) * plotHeight);

  return (
    <figure className="activity-figure">
      <div className="activity-legend" aria-hidden="true">
        <span>
          <i className="activity-swatch applications" /> Candidaturas
        </span>
        <span>
          <i className="activity-swatch proposals" /> Propostas
        </span>
      </div>
      {months.length ? (
        <>
          <div className="activity-chart-scroll">
            <svg
              className="activity-svg"
              viewBox="0 0 720 224"
              role="img"
              aria-labelledby="activity-chart-title activity-chart-description"
            >
              <title id="activity-chart-title">
                Candidaturas e propostas emitidas nos últimos seis meses
              </title>
              <desc id="activity-chart-description">
                Gráfico de barras agrupadas por mês. O asterisco assinala o mês
                de corte parcial.
              </desc>
              {[0, 1, 2, 3].map((tick) => {
                const value = axisMaximum - tick * step;
                const y = chart.top + (tick / 3) * plotHeight;
                return (
                  <g key={value} className="activity-axis-mark">
                    <line x1={chart.left} x2={chart.right} y1={y} y2={y} />
                    <text x={chart.left - 10} y={y + 4} textAnchor="end">
                      {numberFormat.format(value)}
                    </text>
                  </g>
                );
              })}
              {months.map((month, index) => {
                const center = chart.left + groupWidth * (index + 0.5);
                const start = center - barWidth - barGap / 2;
                return (
                  <g key={`${month.label}-${index}`}>
                    <rect
                      className="activity-bar applications"
                      x={start}
                      y={yFor(month.applications)}
                      width={barWidth}
                      height={heightFor(month.applications)}
                      rx="5"
                    >
                      <title>{`${month.label}: ${numberFormat.format(month.applications)}${month.partial ? " · mês parcial" : ""} candidaturas`}</title>
                    </rect>
                    <rect
                      className="activity-bar proposals"
                      x={center + barGap / 2}
                      y={yFor(month.proposals)}
                      width={barWidth}
                      height={heightFor(month.proposals)}
                      rx="5"
                    >
                      <title>{`${month.label}: ${numberFormat.format(month.proposals)}${month.partial ? " · mês parcial" : ""} propostas`}</title>
                    </rect>
                    <text
                      className="activity-month-label"
                      x={center}
                      y="207"
                      textAnchor="middle"
                    >
                      {month.label}
                      {month.partial ? "*" : ""}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <table className="visually-hidden">
            <caption>
              Contagens mensais de candidaturas e propostas no conjunto
              exploratório.
            </caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">Candidaturas</th>
                <th scope="col">Propostas</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month, index) => (
                <tr key={`${month.label}-${index}`}>
                  <th scope="row">
                    {month.label}
                    {month.partial ? " · parcial" : ""}
                  </th>
                  <td>{month.applications}</td>
                  <td>{month.proposals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="activity-empty">
          Não há datas suficientes para compor a série mensal.
        </p>
      )}
      <figcaption className="activity-caption">
        * Mês de corte parcial. Padrões mensais são exploratórios e não indicam
        sazonalidade real.
      </figcaption>
    </figure>
  );
}
