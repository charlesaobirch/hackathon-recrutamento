import { readFileSync } from "node:fs";
import path from "node:path";
import type { DatasetName, DatasetRow } from "@/lib/dataset-config";

type CachedDataset = {
  rows: DatasetRow[];
  fields: string[];
  byId: Map<string, DatasetRow>;
  searchText: string[];
};

export type DatasetPage = {
  table: DatasetName;
  fields: string[];
  rows: DatasetRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const cache = new Map<DatasetName, CachedDataset>();

function loadDataset(name: DatasetName) {
  const cached = cache.get(name);
  if (cached) return cached;

  const file = path.join(
    process.cwd(),
    "src",
    "data",
    "source",
    `${name}.json`,
  );
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (row) => row && typeof row === "object" && !Array.isArray(row),
    )
  ) {
    throw new Error(
      `O ficheiro ${name}.json não contém uma lista de registos.`,
    );
  }

  const rows = parsed as DatasetRow[];
  const dataset: CachedDataset = {
    rows,
    fields: Object.keys(rows[0] ?? {}),
    byId: new Map(
      rows.filter((row) => row.id != null).map((row) => [String(row.id), row]),
    ),
    searchText: rows.map((row) =>
      JSON.stringify(row).toLocaleLowerCase("pt-PT"),
    ),
  };
  cache.set(name, dataset);
  return dataset;
}

export function getRecord(name: DatasetName, id: string) {
  return loadDataset(name).byId.get(id) ?? null;
}

export function queryDataset(options: {
  table: DatasetName;
  id?: string;
  search?: string;
  field?: string;
  value?: string;
  inField?: string;
  values?: string[];
  page?: number;
  pageSize?: number;
}): DatasetPage {
  const dataset = loadDataset(options.table);
  const pageSize = Math.min(
    100,
    Math.max(1, Math.trunc(options.pageSize ?? 25)),
  );

  if (options.id) {
    const row = dataset.byId.get(options.id);
    const rows = row ? [row] : [];
    return {
      table: options.table,
      fields: dataset.fields,
      rows,
      total: rows.length,
      page: 1,
      pageSize,
      totalPages: rows.length ? 1 : 0,
    };
  }

  const search = options.search
    ?.trim()
    .slice(0, 120)
    .toLocaleLowerCase("pt-PT");
  const values = new Set(options.values?.slice(0, 100));
  const filterByField = Boolean(options.field && options.value != null);
  const filterByValues = Boolean(options.inField && values.size);
  const validField =
    options.field && dataset.fields.includes(options.field)
      ? options.field
      : undefined;
  const validInField =
    options.inField && dataset.fields.includes(options.inField)
      ? options.inField
      : undefined;

  const matches: DatasetRow[] = [];
  for (let index = 0; index < dataset.rows.length; index += 1) {
    const row = dataset.rows[index];
    if (search && !dataset.searchText[index].includes(search)) continue;
    if (
      filterByField &&
      validField &&
      String(row[validField] ?? "") !== options.value
    )
      continue;
    if (
      filterByValues &&
      validInField &&
      !values.has(String(row[validInField] ?? ""))
    )
      continue;
    matches.push(row);
  }

  const total = matches.length;
  const totalPages = Math.ceil(total / pageSize);
  const page = Math.min(
    Math.max(1, Math.trunc(options.page ?? 1)),
    Math.max(1, totalPages),
  );
  const start = (page - 1) * pageSize;
  return {
    table: options.table,
    fields: dataset.fields,
    rows: matches.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}
