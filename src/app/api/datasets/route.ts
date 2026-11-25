import { isDatasetName } from "@/lib/dataset-config";
import { queryDataset } from "@/lib/dataset-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  if (!isDatasetName(table)) {
    return Response.json(
      { error: "Seleciona uma tabela JSON válida." },
      { status: 400 },
    );
  }

  try {
    const page = queryDataset({
      table,
      id: searchParams.get("id") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      field: searchParams.get("field") ?? undefined,
      value: searchParams.get("value") ?? undefined,
      inField: searchParams.get("inField") ?? undefined,
      values: searchParams.get("values")?.split(","),
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 25),
    });
    return Response.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Não foi possível ler este ficheiro de dados." },
      { status: 500 },
    );
  }
}
