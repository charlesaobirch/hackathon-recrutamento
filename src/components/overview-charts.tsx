import { contratacoesByPeriod } from "@/data/overview-periods";

const APPLICATIONS = 5962;
const HIRES = 262;
const HIRED_CELLS = 4;
const TREND_MAX = 100;

export function HiringConversionChart() {
  return (
    <figure className="chart-block">
      <div className="chart-headline">
        <strong>4 em cada 100</strong>
        <span>candidaturas terminam em contratação única</span>
      </div>
      <div
        className="waffle-chart"
        role="img"
        aria-label={`De ${APPLICATIONS.toLocaleString("pt-PT")} candidaturas, ${HIRES} terminaram em contratação: 4 em cada 100, ou 4,4%.`}
      >
        {Array.from({ length: 100 }, (_, index) => (
          <span
            key={`cell-${index + 1}`}
            className={index < HIRED_CELLS ? "is-filled" : undefined}
            aria-hidden="true"
          />
        ))}
      </div>
      <figcaption className="chart-legend">
        <span>
          <i className="legend-swatch is-filled" aria-hidden="true" />
          Contratações: <b>262</b> (4,4%)
        </span>
        <span>
          <i className="legend-swatch" aria-hidden="true" />
          Restante: <b>5 700</b> (95,6%)
        </span>
      </figcaption>
    </figure>
  );
}

export function HiringTrendChart() {
  const description = contratacoesByPeriod
    .map((point) => `${point.label}: ${point.value}`)
    .join(", ");

  return (
    <figure className="chart-block chart-block--trend">
      <figcaption className="chart-subhead">
        Evolução das contratações únicas
      </figcaption>
      <div
        className="trend-chart"
        role="img"
        aria-label={`Contratações únicas por janela móvel até 3 jan. 2026. ${description}.`}
      >
        <div className="trend-axis-y" aria-hidden="true">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
        <div className="trend-plot">
          <div className="trend-grid" aria-hidden="true" />
          <div className="trend-columns">
            {contratacoesByPeriod.map((point) => (
              <div className="trend-column" key={point.label}>
                <div className="trend-bar-area">
                  <div
                    className="trend-bar"
                    style={{ height: `${(point.value / TREND_MAX) * 100}%` }}
                  />
                  <span
                    className="trend-value"
                    style={{
                      bottom: `calc(${(point.value / TREND_MAX) * 100}% + 4px)`,
                    }}
                  >
                    {point.value}
                  </span>
                </div>
                <span className="trend-label">{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="chart-note">
        Janelas móveis até 3 jan. 2026, deduplicadas por candidato. A tendência
        cresce com o período observado, não com o ritmo de contratação.
      </p>
    </figure>
  );
}

export function WaitTimeChart() {
  return (
    <figure className="chart-block">
      <div className="chart-headline">
        <strong>27 dias</strong>
        <span>de espera entre a entrevista e a proposta</span>
      </div>
      <div
        className="wait-bar"
        role="img"
        aria-label="Do ciclo mediano de 40 dias, 27 dias são de espera até à proposta, ou 68%. As outras etapas somam 13 dias."
      >
        <div className="wait-bar-segment is-wait" style={{ width: "67.5%" }}>
          <span aria-hidden="true">27 dias · 68%</span>
        </div>
        <div className="wait-bar-segment is-rest" style={{ width: "32.5%" }}>
          <span aria-hidden="true">13 dias</span>
        </div>
      </div>
      <figcaption className="chart-legend">
        <span>
          <i className="legend-swatch is-wait" aria-hidden="true" />
          Espera até à proposta
        </span>
        <span>
          <i className="legend-swatch is-rest" aria-hidden="true" />
          Outras etapas
        </span>
      </figcaption>
      <p className="chart-note">
        A espera ocupa mais de dois terços do ciclo e é o dobro do tempo somado
        das outras etapas.
      </p>
    </figure>
  );
}
