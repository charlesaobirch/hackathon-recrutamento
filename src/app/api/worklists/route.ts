import { queryWorklist } from "@/lib/operational-data";

const kinds = ["applications", "waiting", "proposals"] as const;
type WorklistKind = (typeof kinds)[number];

function isWorklistKind(value: string | null): value is WorklistKind {
  return kinds.some((kind) => kind === value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  if (!isWorklistKind(kind)) {
    return Response.json(
      { error: "Seleciona uma lista operacional válida." },
      { status: 400 },
    );
  }

  try {
    return Response.json(
      queryWorklist({
        kind,
        search: searchParams.get("search") ?? undefined,
        stage: searchParams.get("stage") ?? undefined,
        recruiter: searchParams.get("recruiter") ?? undefined,
        signal: searchParams.get("signal") ?? undefined,
        position: searchParams.get("position") ?? undefined,
        status: searchParams.get("status") ?? undefined,
        page: Number(searchParams.get("page") ?? 1),
        pageSize: Number(searchParams.get("pageSize") ?? 20),
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    return Response.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Não foi possível preparar a lista operacional.",
      },
      { status: 500 },
    );
  }
}
