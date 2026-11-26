"use client";

import { type ChangeEvent, useState } from "react";
import { Badge, Notice, Panel } from "@/components/ui";
import { money } from "@/lib/recruitment";

export function SalaryChecker({
  minimum,
  maximum,
  expectation,
  initialOffer,
}: {
  minimum: number;
  maximum: number;
  expectation: number;
  initialOffer: number;
}) {
  const [min, setMin] = useState(minimum);
  const [max, setMax] = useState(maximum);
  const [wanted, setWanted] = useState(expectation);
  const [offer, setOffer] = useState(initialOffer);
  const [reason, setReason] = useState("");
  const [approved, setApproved] = useState(false);
  const [sent, setSent] = useState(false);
  const valid =
    [min, max, wanted, offer].every(
      (value) => Number.isFinite(value) && value > 0,
    ) && min <= max;
  const issues = !valid
    ? [
        "Confirma que todos os valores são positivos e que o mínimo não supera o máximo.",
      ]
    : [
        ...(offer < min
          ? [`A oferta fica ${money(min - offer)} abaixo do mínimo da vaga.`]
          : []),
        ...(offer > max
          ? [`A oferta excede o máximo da vaga em ${money(offer - max)}.`]
          : []),
        ...(wanted > max
          ? [
              `A expectativa do candidato excede o máximo em ${money(wanted - max)}.`,
            ]
          : []),
        ...(offer < wanted * 0.95
          ? ["A oferta está mais de 5% abaixo da expectativa do candidato."]
          : []),
      ];
  const exceptionReady = reason.trim().length >= 20 && approved;
  const canContinue = valid && (issues.length === 0 || exceptionReady);
  const update =
    (setter: (value: number) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(Number(event.target.value));
      setSent(false);
    };

  return (
    <div className="checker-grid">
      <Panel title="Oferta, banda e expectativa" className="checker-form">
        <div className="field-grid">
          <label>
            Expectativa do candidato
            <input
              type="number"
              min="1"
              step="500"
              value={wanted}
              onChange={update(setWanted)}
            />
          </label>
          <label>
            Mínimo da banda
            <input
              type="number"
              min="1"
              step="500"
              value={min}
              onChange={update(setMin)}
            />
          </label>
          <label>
            Máximo da banda
            <input
              type="number"
              min="1"
              step="500"
              value={max}
              onChange={update(setMax)}
            />
          </label>
          <label>
            Oferta a validar
            <input
              type="number"
              min="1"
              step="500"
              value={offer}
              onChange={update(setOffer)}
            />
          </label>
        </div>
        <div className="salary-scale">
          <div className="scale-labels">
            <span>Mín. {money(min)}</span>
            <span>Máx. {money(max)}</span>
          </div>
          <div className="scale-track">
            <span className="scale-band" />
            <span
              className="scale-marker expectation-marker"
              style={{
                left: `${Math.min(100, Math.max(0, ((wanted - min) / (max - min || 1)) * 100))}%`,
              }}
              title="Expectativa"
            />
            <span
              className="scale-marker offer-marker"
              style={{
                left: `${Math.min(100, Math.max(0, ((offer - min) / (max - min || 1)) * 100))}%`,
              }}
              title="Oferta"
            />
          </div>
          <div className="scale-legend">
            <span>
              <i className="legend-dot grey" /> Expectativa
            </span>
            <span>
              <i className="legend-dot lime" /> Oferta
            </span>
          </div>
        </div>
        {issues.length ? (
          <div className="issue-list">
            {issues.map((issue) => (
              <p key={issue}>
                <span>!</span>
                {issue}
              </p>
            ))}
          </div>
        ) : (
          <Notice title="Oferta dentro da banda" tone="info">
            A oferta está dentro da banda e alinhada com a expectativa.
          </Notice>
        )}
        {issues.length > 0 ? (
          <details className="exception-details">
            <summary>Registar uma exceção aprovada</summary>
            <label>
              Justificação (mínimo 20 caracteres)
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setSent(false);
                }}
                rows={3}
              />
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={approved}
                onChange={(event) => {
                  setApproved(event.target.checked);
                  setSent(false);
                }}
              />{" "}
              Aprovação registada pela pessoa responsável
            </label>
          </details>
        ) : null}
        <div className="checker-footer">
          <button
            className="button-primary"
            type="button"
            disabled={!canContinue}
            onClick={() => setSent(true)}
          >
            {issues.length ? "Registar exceção" : "Marcar como validada"}
          </button>
          <span>
            {sent
              ? "Estado guardado nesta demonstração; nenhuma proposta foi enviada."
              : !canContinue
                ? "Corrige os valores ou documenta uma exceção aprovada."
                : "Validação local de demonstração."}
          </span>
        </div>
      </Panel>
      <Panel title="Regras de validação">
        <div className="rule-list">
          {[
            ["Oferta dentro da banda", valid && offer >= min && offer <= max],
            ["Expectativa ≤ máximo", valid && wanted <= max],
            ["Oferta ≥ expectativa − 5%", valid && offer >= wanted * 0.95],
          ].map(([label, passed]) => (
            <div className="rule-row" key={String(label)}>
              <span>{label}</span>
              <Badge tone={passed ? "positive" : "danger"}>
                {passed ? "Cumpre" : "Rever"}
              </Badge>
            </div>
          ))}
        </div>
        <p className="source-note">
          A regra é demonstrativa e pode ser ajustada. Uma aprovação registada
          não envia a proposta a nenhum sistema.
        </p>
      </Panel>
    </div>
  );
}
