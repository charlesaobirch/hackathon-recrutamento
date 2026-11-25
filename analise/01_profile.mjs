import { loadAll, profile } from "./lib/load.mjs";

const db = loadAll();
const out = {};
for (const [name, rows] of Object.entries(db)) out[name] = profile(rows, name);

for (const [name, p] of Object.entries(out)) {
  console.log(`\n===== ${name.toUpperCase()} (${p.rows} rows) idDup=${p.idDup} exactDup=${p.exactDup}`);
  for (const c of Object.values(p.cols)) {
    const t = Object.entries(c.types).map(([k, v]) => `${k}:${v}`).join("/");
    let s = `  ${c.name.padEnd(26)} null=${String(c.nulls).padStart(5)} (${c.nullPct}%) dist=${String(c.distinct).padStart(5)} types=${t}`;
    if (c.min !== undefined) s += ` min=${c.min} p25=${c.p25} med=${c.median} p75=${c.p75} max=${c.max} mean=${c.mean}`;
    console.log(s);
    if (c.values) console.log(`      ${c.values.map(([v, n]) => `${v}(${n})`).join(", ")}`);
    else if (c.top) console.log(`      top: ${c.top.map(([v, n]) => `${String(v).slice(0, 30)}(${n})`).join(", ")}`);
  }
}
