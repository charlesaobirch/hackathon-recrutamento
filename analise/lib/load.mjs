import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = "C:/Users/Formando/Downloads/recrutamento/json";

export function loadAll(dir = DATA_DIR) {
  if (!fs.existsSync(dir)) {
    dir = "C:/Users/USER/.copilot/session-state/1d9f2860-b80b-4db9-a8d2-29e144e5d4b3/files/recrutamento/json";
  }
  const out = {};
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    out[f.replace(/\.json$/, "")] = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  }
  return out;
}

export function typeOf(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "number") return "number";
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return "date";
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return "datetime";
    return "string";
  }
  if (Array.isArray(v)) return "array";
  return typeof v;
}

export function profile(rows, name) {
  const cols = {};
  const keys = new Set();
  for (const r of rows) for (const k of Object.keys(r)) keys.add(k);
  for (const k of keys) {
    const vals = rows.map((r) => r[k]);
    const types = {};
    let nulls = 0;
    const distinct = new Map();
    for (const v of vals) {
      const t = typeOf(v);
      types[t] = (types[t] || 0) + 1;
      if (v === null || v === undefined || v === "") { nulls++; continue; }
      const key = Array.isArray(v) ? v.join("|") : v;
      distinct.set(key, (distinct.get(key) || 0) + 1);
    }
    const nonNull = vals.filter((v) => v !== null && v !== undefined && v !== "");
    const nums = nonNull.filter((v) => typeof v === "number").sort((a, b) => a - b);
    const col = {
      name: k,
      types,
      nulls,
      nullPct: +((nulls / rows.length) * 100).toFixed(2),
      distinct: distinct.size,
      uniques: vals.length > 0 && distinct.size === nonNull.length ? distinct.size : undefined,
    };
    if (nums.length) {
      col.min = nums[0];
      col.max = nums[nums.length - 1];
      col.mean = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(3);
      col.median = nums[Math.floor(nums.length / 2)];
      col.p25 = nums[Math.floor(nums.length * 0.25)];
      col.p75 = nums[Math.floor(nums.length * 0.75)];
    }
    if (distinct.size <= 25) {
      col.values = [...distinct.entries()].sort((a, b) => b[1] - a[1]);
    } else {
      col.top = [...distinct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    }
    cols[k] = col;
  }
  const idKey = Object.keys(cols).find((k) => k === "id");
  const idDup = idKey
    ? rows.length - new Set(rows.map((r) => r.id)).size
    : null;
  const exactDup = rows.length - new Set(rows.map((r) => JSON.stringify(r))).size;
  return { name, rows: rows.length, cols, idDup, exactDup };
}
