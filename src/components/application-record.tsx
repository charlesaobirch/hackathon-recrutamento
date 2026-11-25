"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Notice, PageHeader, Panel } from "@/components/ui";
import {
  formatDate,
  formatMoney,
  humanizeValue,
  parseDateValue,
  stageLabel,
} from "@/lib/format";
import type { DatasetName, DatasetRow } from "@/lib/dataset-config";

type DatasetResponse = {
  rows: DatasetRow[];
  total: number;
  totalPages?: number;
  fields?: string[];
  asOf?: string | null;
  error?: string;
};

type RelatedData = {
  application: DatasetRow;
  candidate: DatasetRow | null;
  vacancy: DatasetRow | null;
  client: DatasetRow | null;
  recruiter: DatasetRow | null;
  interviews: DatasetResponse;
  interactions: DatasetResponse;
  offers: DatasetResponse;
  hires: DatasetResponse;
  feedback: DatasetResponse;
  asOf: string | null;
};

type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  detail: string;
  tone: "done" | "pending";
};

async function readDataset(
  table: DatasetName,
  options: Record<string, string>,
  signal: AbortSignal,
) {
  const params = new URLSearchParams({
    table,
    page: "1",
    pageSize: "100",
    ...options,
  });
  const response = await fetch(`/api/datasets?${params}`, { signal });
  const result = (await response.json()) as DatasetResponse;
  if (!response.ok) {
    throw new Error(
      result.error ?? `Não foi possível ler a tabela ${table}.`,
    );
  }
  return result;
}

async function readAllDataset(
  table: DatasetName,
  options: Record<string, string>,
  signal: AbortSignal,
) {
  const firstPage = await readDataset(table, options, signal);
  const totalPages = firstPage.totalPages ?? 1;
  const otherPages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
      readDataset(table, { ...options, page: String(index + 2) }, signal),
    ),
  );
  const result = {
    ...firstPage,
    rows: [firstPage, ...otherPages].flatMap((page) => page.rows),
  };
  if (result.rows.length !== result.total) {
    throw new Error(
      `A tabela ${table} devolveu ${result.rows.length} de ${result.total} registos relacionados.`,
    );
  }
  return result;
}

async function readAsOf(signal: AbortSignal) {
  const params = new URLSearchParams({
    kind: "applications",
    page: "1",
    pageSize: "1",
  });
  const response = await fetch(`/api/worklists?${params}`, { signal });
  const result = (await response.json()) as DatasetResponse;
  if (!response.ok) {
    throw new Error(
      result.error ?? "Não foi possível determinar a data de referência.",
    );
  }
  return result.asOf ?? null;
}

function display(value: unknown, field: string) {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return JSON.stringify(value);
  }
  return humanizeValue(field, value);
}

function RecordFields({
  title,
  record,
}: {
  title: string;
  record: DatasetRow | null;
}) {
  if (!record) return null;
  return (
    <Panel title={title}>
      <dl className="detail-list">
        {Object.entries(record).map(([key, value]) => (
          <div key={key}>
            <dt>{key.replaceAll("_", " ")}</dt>
            <dd>{display(value, key)}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function RelatedRecords({
  title,
  data,
}: {
  title: string;
  data: DatasetResponse;
}) {
  const fields = data.fields ?? Object.keys(data.rows[0] ?? {});
  return (
    <Panel
      title={title}
      meta={
        <Badge tone="info">
          {data.total.toLocaleString("pt-PT")} registos completos
        </Badge>
      }
    >
      {data.total ? (
        <div className="table-scroll">
          <table className="data-table dataset-table">
            <thead>
              <tr>
                {fields.map((field) => (
                  <th key={field}>{field.replaceAll("_", " ")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <tr key={`${String(row.id ?? title)}-${index}`}>
                  {fields.map((field) => (
                    <td key={field}>{display(row[field], field)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="panel-copy">Sem registos ligados a esta candidatura.</p>
      )}
    </Panel>
  );
}

function makeTimeline(data: RelatedData): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const applicationDate = data.application.data_candidatura;
  if (typeof applicationDate === "string") {
    events.push({
      id: `application-${String(data.application.id)}`,
      date: applicationDate,
      title: "Candidatura recebida",
      detail: `Registo ${String(data.application.id)} criado.`,
      tone: "done",
    });
  }
  for (const interview of data.interviews.rows) {
    const date = typeof interview.data === "string" ? interview.data : "";
    events.push({
      id: `interview-${String(interview.id)}`,
      date,
      title: `Entrevista · ${stageLabel(String(interview.fase ?? ""))}`,
      detail: [
        `Resultado: ${humanizeValue("resultado", interview.resultado)}`,
        interview.score_tecnico !== null &&
        interview.score_tecnico !== undefined
          ? `Score técnico original: ${String(interview.score_tecnico)}`
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
      tone: interview.resultado === "pendente" ? "pending" : "done",
    });
  }
  for (const interaction of data.interactions.rows) {
    const date = typeof interaction.data === "string" ? interaction.data : "";
    events.push({
      id: `interaction-${String(interaction.id)}`,
      date,
      title: humanizeValue("tipo", interaction.tipo),
      detail: `Resultado: ${humanizeValue("resultado", interaction.resultado)}`,
      tone: interaction.resultado === "agendado" ? "pending" : "done",
    });
  }
  for (const offer of data.offers.rows) {
    const proposalId = String(offer.id);
    if (typeof offer.data_proposta === "string") {
      events.push({
        id: `offer-${proposalId}`,
        date: offer.data_proposta,
        title: "Proposta emitida",
        detail: `${formatMoney(offer.salario_oferecido)} · ${humanizeValue("estado_proposta", offer.estado_proposta)}`,
        tone: "done",
      });
    }
    if (typeof offer.data_resposta === "string") {
      events.push({
        id: `response-${proposalId}`,
        date: offer.data_resposta,
        title: "Resposta à proposta",
        detail: humanizeValue("estado_proposta", offer.estado_proposta),
        tone: "done",
      });
    }
  }
  for (const hire of data.hires.rows) {
    const date =
      typeof hire.data_contratacao === "string" ? hire.data_contratacao : "";
    events.push({
      id: `hire-${String(hire.id)}`,
      date,
      title: "Contratação registada",
      detail: `Salário final: ${formatMoney(hire.salario_final)}`,
      tone: "done",
    });
  }
  for (const feedback of data.feedback.rows) {
    const date =
      typeof feedback.data_feedback === "string" ? feedback.data_feedback : "";
    events.push({
      id: `feedback-${String(feedback.id)}`,
      date,
      title: "Feedback do cliente",
      detail: `Satisfação: ${humanizeValue("satisfacao", feedback.satisfacao)}/5 · ${feedback.necessita_substituicao === true ? "substituição necessária" : "sem substituição assinalada"}`,
      tone: "done",
    });
  }
  return events.sort((first, second) => {
    const firstDate = parseDateValue(first.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const secondDate = parseDateValue(second.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return firstDate - secondDate || first.id.localeCompare(second.id);
  });
}

function elapsedDays(reference: string | null, eventDate: string | null) {
  const referenceDate = parseDateValue(reference);
  const date = parseDateValue(eventDate);
  if (!referenceDate || !date) return null;
  return Math.max(
    0,
    Math.round((referenceDate.getTime() - date.getTime()) / 86_400_000),
  );
}

function priorityTone(days: number | null) {
  if (days === null) return "neutral";
  if (days >= 30) return "danger";
  if (days >= 14) return "warning";
  return "positive";
}

export function ApplicationRecord({ id }: { id: string }) {
  const [data, setData] = useState<RelatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intervened, setIntervened] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [applicationResponse, asOf] = await Promise.all([
          readDataset("candidaturas", { id }, controller.signal),
          readAsOf(controller.signal),
        ]);
        if (!applicationResponse.rows[0]) {
          throw new Error(
            "A candidatura não foi encontrada nos ficheiros de origem.",
          );
        }
        const application = applicationResponse.rows[0];
        const applicationId = String(application.id);
        const [
          candidateResponse,
          vacancyResponse,
          interviews,
          interactions,
          offers,
          hires,
        ] = await Promise.all([
          readDataset(
            "candidatos",
            { id: String(application.id_candidato) },
            controller.signal,
          ),
          readDataset(
            "vagas",
            { id: String(application.id_vaga) },
            controller.signal,
          ),
          readAllDataset(
            "entrevistas",
            { field: "id_candidatura", value: applicationId },
            controller.signal,
          ),
          readAllDataset(
            "interacoes",
            { field: "id_candidatura", value: applicationId },
            controller.signal,
          ),
          readAllDataset(
            "propostas",
            { field: "id_candidatura", value: applicationId },
            controller.signal,
          ),
          readAllDataset(
            "contratacoes",
            { field: "id_candidatura", value: applicationId },
            controller.signal,
          ),
        ]);
        const vacancy = vacancyResponse.rows[0] ?? null;
        const [clientResponse, recruiterResponse, feedback] = await Promise.all([
          vacancy
            ? readDataset(
                "clientes",
                { id: String(vacancy.id_cliente) },
                controller.signal,
              )
            : Promise.resolve({ rows: [], total: 0 }),
          vacancy
            ? readDataset(
                "recrutadores",
                { id: String(vacancy.id_recrutador) },
                controller.signal,
              )
            : Promise.resolve({ rows: [], total: 0 }),
          hires.rows.length
            ? readAllDataset(
                "feedback_clientes",
                {
                  inField: "id_contratacao",
                  values: hires.rows.map((hire) => String(hire.id)).join(","),
                },
                controller.signal,
              )
            : Promise.resolve({ rows: [], total: 0 }),
        ]);
        if (controller.signal.aborted) return;
        setData({
          application,
          candidate: candidateResponse.rows[0] ?? null,
          vacancy,
          client: clientResponse.rows[0] ?? null,
          recruiter: recruiterResponse.rows[0] ?? null,
          interviews,
          interactions,
          offers,
          hires,
          feedback,
          asOf,
        });
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar todos os dados da candidatura.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [id]);

  const timeline = useMemo(() => (data ? makeTimeline(data) : []), [data]);

  if (loading) {
    return (
      <div className="page-content">
        <PageHeader title="A carregar candidatura…" subtitle={id} />
        <output className="loading-panel">
          A consultar todos os eventos e registos relacionados.
        </output>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="page-content">
        <PageHeader
          title="Não foi possível abrir a candidatura"
          subtitle={id}
        />
        <Notice title="Erro na consulta" tone="danger">
          {error || "Os dados não foram devolvidos."}
        </Notice>
        <Link className="text-link" href="/candidaturas">
          Voltar à lista completa
        </Link>
      </div>
    );
  }

  const applicationId = String(data.application.id);
  const candidateTitle = String(
    data.candidate?.nome_ficticio ??
      data.application.id_candidato ??
      "Candidatura",
  );
  const phases = [
    "triagem",
    "entrevista_tecnica",
    "entrevista_cliente",
    "entrevista_final",
  ];
  const reachedPhases = new Set(
    data.interviews.rows.map((interview) => String(interview.fase)),
  );
  const latestInterview = [...data.interviews.rows].sort((first, second) => {
    const firstDate = parseDateValue(first.data)?.getTime() ?? 0;
    const secondDate = parseDateValue(second.data)?.getTime() ?? 0;
    return secondDate - firstDate;
  })[0];
  const highestPhase = [...phases].reverse().find((phase) =>
    reachedPhases.has(phase),
  );
  const currentStage = data.hires.total
    ? "contratado"
    : data.offers.total
      ? "proposta"
      : highestPhase ?? "sem_entrevista";
  const stageEventDate =
    currentStage === "contratado"
      ? data.hires.rows
          .map((hire) => hire.data_contratacao)
          .filter((value): value is string => typeof value === "string")
          .sort((first, second) => {
            const firstDate = parseDateValue(first)?.getTime() ?? 0;
            const secondDate = parseDateValue(second)?.getTime() ?? 0;
            return secondDate - firstDate;
          })[0] ?? null
      : currentStage === "proposta"
        ? data.offers.rows
            .map((offer) => offer.data_proposta)
            .filter((value): value is string => typeof value === "string")
            .sort((first, second) => {
              const firstDate = parseDateValue(first)?.getTime() ?? 0;
              const secondDate = parseDateValue(second)?.getTime() ?? 0;
              return secondDate - firstDate;
            })[0] ?? null
        : data.interviews.rows
            .filter((interview) => interview.fase === currentStage)
            .map((interview) => interview.data)
            .filter((value): value is string => typeof value === "string")
            .sort((first, second) => {
              const firstDate = parseDateValue(first)?.getTime() ?? 0;
              const secondDate = parseDateValue(second)?.getTime() ?? 0;
              return secondDate - firstDate;
            })[0] ?? null;
  const daysInStage = elapsedDays(data.asOf, stageEventDate);
  const lastEvent = [...timeline]
    .filter((event) => parseDateValue(event.date))
    .sort(
      (first, second) =>
        (parseDateValue(second.date)?.getTime() ?? 0) -
        (parseDateValue(first.date)?.getTime() ?? 0),
    )[0];
  const daysSinceAction = elapsedDays(data.asOf, lastEvent?.date ?? null);
  const expectedSalary = Number(data.candidate?.expectativa_salarial);
  const salaryMin = Number(data.vacancy?.salario_min);
  const salaryMax = Number(data.vacancy?.salario_max);
  const salaryValuesValid = [expectedSalary, salaryMin, salaryMax].every(
    (value) => Number.isFinite(value) && value > 0,
  );
  const salaryPosition = !salaryValuesValid
    ? "Banda indisponível"
    : expectedSalary < salaryMin
      ? "Expectativa abaixo da banda"
      : expectedSalary > salaryMax
        ? "Expectativa acima da banda"
        : "Expectativa dentro da banda";
  const score = Number(latestInterview?.score_tecnico);
  const hasScore =
    latestInterview?.score_tecnico !== null &&
    latestInterview?.score_tecnico !== undefined &&
    Number.isFinite(score);
  const proposal = data.offers.rows[0];
  const recruiterName = String(data.recruiter?.nome ?? "recrutador");
  const mailSubject = encodeURIComponent(
    `Acompanhamento ${applicationId} · ${candidateTitle}`,
  );
  const mailBody = encodeURIComponent(
    `Olá,\n\nPrecisamos de acompanhar a candidatura ${applicationId} de ${candidateTitle} para ${String(data.vacancy?.titulo ?? data.application.id_vaga)}.\n\nRecrutador: ${recruiterName} (${String(data.recruiter?.id ?? data.vacancy?.id_recrutador ?? "sem ID")}).\nÚltima ação: ${formatDate(lastEvent?.date)}.\n`,
  );

  return (
    <div className="page-content">
      <div className="back-row">
        <Link href="/candidaturas">← Todas as candidaturas</Link>
        <span>{applicationId}</span>
      </div>
      <PageHeader
        title={candidateTitle}
        subtitle={`${applicationId} · ${String(data.vacancy?.titulo ?? data.application.id_vaga)}`}
      />

      <section className="detail-summary" aria-label="Resumo da candidatura">
        <div>
          <span>Etapa derivada</span>
          <Badge tone={currentStage === "contratado" ? "positive" : "info"}>
            {stageLabel(currentStage)}
          </Badge>
        </div>
        <div>
          <span>Tempo nesta etapa</span>
          <strong>{daysInStage === null ? "—" : `${daysInStage} dias`}</strong>
          <small>referência: {formatDate(data.asOf)}</small>
        </div>
        <div>
          <span>Score técnico original</span>
          <strong>{hasScore ? score.toLocaleString("pt-PT") : "—"}</strong>
          <small>
            {hasScore && score > 100
              ? "Fora da escala validada"
              : "Informativo; não usado no funil"}
          </small>
        </div>
        <div>
          <span>Expectativa face à banda</span>
          <strong>{salaryValuesValid ? formatMoney(expectedSalary) : "—"}</strong>
          <small>
            {salaryValuesValid
              ? `${formatMoney(salaryMin)} – ${formatMoney(salaryMax)} · ${salaryPosition}`
              : salaryPosition}
          </small>
        </div>
      </section>

      <div className="detail-action-row">
        <a
          className="button-secondary"
          href={`mailto:?subject=${mailSubject}&body=${mailBody}`}
        >
          Preparar contacto ao recrutador
        </a>
        <button
          className="button-secondary"
          type="button"
          onClick={() => setIntervened(true)}
          disabled={intervened}
        >
          {intervened ? "Intervenção registada (demo)" : "Registar intervenção"}
        </button>
        {proposal ? (
          <Link
            className="button-primary"
            href={`/propostas/${encodeURIComponent(String(proposal.id))}`}
          >
            Validar proposta
          </Link>
        ) : null}
        <span aria-live="polite">
          {daysSinceAction === null
            ? "Última ação sem data válida."
            : `Última ação há ${daysSinceAction} ${daysSinceAction === 1 ? "dia" : "dias"}.`}
        </span>
      </div>

      <div className="detail-main-grid">
        <Panel
          title="Linha do tempo"
          meta={
            <Badge tone={priorityTone(daysSinceAction)}>
              {daysSinceAction === null
                ? "Sem data de ação"
                : daysSinceAction >= 30
                  ? "Prioridade alta · 30+ dias"
                  : daysSinceAction >= 14
                    ? "Atenção · 14–29 dias"
                    : "Atividade recente"}
            </Badge>
          }
        >
          {timeline.length ? (
            <ol className="timeline detail-timeline">
              {timeline.map((event) => (
                <li
                  className={`timeline-item ${event.tone}`}
                  key={event.id}
                >
                  <span className="timeline-dot" />
                  <div>
                    <b>{event.title}</b>
                    <span>{formatDate(event.date)}</span>
                    <p>{event.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-state">Sem eventos ligados à candidatura.</div>
          )}
        </Panel>
        <div className="detail-aside">
          <Panel title="Perfil do candidato">
            <dl className="detail-list">
              <div>
                <dt>Identificador</dt>
                <dd>{String(data.candidate?.id ?? data.application.id_candidato)}</dd>
              </div>
              <div>
                <dt>Experiência</dt>
                <dd>
                  {data.candidate?.anos_experiencia
                    ? `${String(data.candidate.anos_experiencia)} anos`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Senioridade</dt>
                <dd>{humanizeValue("senioridade", data.candidate?.senioridade)}</dd>
              </div>
              <div>
                <dt>Localização</dt>
                <dd>{String(data.candidate?.localizacao ?? "—")}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Vaga, cliente e recrutador">
            <dl className="detail-list">
              <div>
                <dt>Vaga</dt>
                <dd>{String(data.vacancy?.titulo ?? data.application.id_vaga)}</dd>
              </div>
              <div>
                <dt>Banda salarial</dt>
                <dd>
                  {salaryMin > 0 && salaryMax > 0
                    ? `${formatMoney(salaryMin)} – ${formatMoney(salaryMax)}`
                    : "Indisponível"}
                </dd>
              </div>
              <div>
                <dt>Cliente</dt>
                <dd>
                  {String(data.client?.nome ?? data.vacancy?.id_cliente ?? "—")}
                </dd>
              </div>
              <div>
                <dt>Recrutador</dt>
                <dd>{recruiterName}</dd>
              </div>
            </dl>
            <p className="source-note">
              O ficheiro não inclui endereço de email do recrutador; o contacto
              abre um rascunho sem destinatário.
            </p>
          </Panel>
          {lastEvent ? (
            <Panel title="Estado da atividade">
              <strong className="rail-value">
                {daysSinceAction === null ? "—" : `${daysSinceAction} dias`}
              </strong>
              <p className="panel-copy">
                Último evento: {lastEvent.title.toLocaleLowerCase("pt-PT")} ·{" "}
                {formatDate(lastEvent.date)}.
              </p>
              <small className="muted">
                Referência de prioridade local, não um SLA oficial.
              </small>
            </Panel>
          ) : null}
        </div>
      </div>

      <details className="raw-data-disclosure">
        <summary>Campos e eventos de origem completos</summary>
        <div className="raw-record-grid">
          <RecordFields title="Candidatura" record={data.application} />
          <RecordFields title="Candidato" record={data.candidate} />
          <RecordFields title="Vaga" record={data.vacancy} />
          <RecordFields title="Cliente" record={data.client} />
          <RecordFields title="Recrutador" record={data.recruiter} />
          <RelatedRecords title="Entrevistas" data={data.interviews} />
          <RelatedRecords title="Interações" data={data.interactions} />
          <RelatedRecords title="Propostas" data={data.offers} />
          <RelatedRecords title="Contratações" data={data.hires} />
          <RelatedRecords title="Feedback do cliente" data={data.feedback} />
        </div>
      </details>
    </div>
  );
}
