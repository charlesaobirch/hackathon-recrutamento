export function parseDate(v) {
  if (!v) return null;
  if (typeof v !== "string") return null;
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return null;
}

export const iso = (d) => (d ? d.toISOString().slice(0, 10) : null);
export const days = (a, b) => Math.round((b - a) / 86400000);
export const month = (d) => d.toISOString().slice(0, 7);

export function normalize(db) {
  const out = structuredClone(db);
  for (const t of ["candidatos", "candidaturas", "vagas", "entrevistas", "interacoes", "propostas", "contratacoes", "feedback_clientes", "historico_vagas"]) {
    for (const r of out[t]) {
      for (const k of Object.keys(r)) if (/^data_|^data$/.test(k)) r[k] = parseDate(r[k]);
    }
  }
  out.contratacoes = [...new Map(out.contratacoes.map((r) => [r.id, r])).values()];
  return out;
}

export function mean(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
export function sd(a) { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); }
export function quantile(a, q) {
  const s = [...a].sort((x, y) => x - y);
  const p = (s.length - 1) * q; const lo = Math.floor(p), hi = Math.ceil(p);
  return s[lo] + (s[hi] - s[lo]) * (p - lo);
}
export function corr(x, y) {
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) { num += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
  return num / Math.sqrt(dx * dy);
}
export function spearman(x, y) {
  const rank = (a) => { const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = []; idx.forEach(([, i], j) => (r[i] = j)); return r; };
  return corr(rank(x), rank(y));
}
// two-sided p-value for correlation (t approximation)
export function corrP(r, n) {
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  return 2 * (1 - tCdf(Math.abs(t), n - 2));
}
export function tCdf(t, df) {
  const x = df / (df + t * t);
  return 1 - 0.5 * betainc(df / 2, 0.5, x);
}
function betainc(a, b, x) {
  // regularized incomplete beta via continued fraction (Numerical Recipes)
  if (x <= 0) return 0; if (x >= 1) return 1;
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  let f = 1, c = 1, d = 0;
  for (let i = 0; i <= 200; i++) {
    const m = Math.floor(i / 2);
    let numer;
    if (i === 0) numer = 1;
    else if (i % 2 === 0) numer = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    else numer = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + numer * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
    c = 1 + numer / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    f *= c * d;
    if (Math.abs(1 - c * d) < 1e-10) break;
  }
  const res = front * (f - 1);
  return x < (a + 1) / (a + b + 2) ? res : 1 - betainc(b, a, 1 - x);
}
function lgamma(z) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += g[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
export function chi2Test(table) {
  const rows = table.length, cols = table[0].length;
  const rt = table.map((r) => r.reduce((a, b) => a + b, 0));
  const ct = Array.from({ length: cols }, (_, j) => table.reduce((a, r) => a + r[j], 0));
  const n = rt.reduce((a, b) => a + b, 0);
  let chi = 0;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const e = (rt[i] * ct[j]) / n; if (e > 0) chi += (table[i][j] - e) ** 2 / e;
  }
  const df = (rows - 1) * (cols - 1);
  // p via chi-square survival = 1 - gammainc(df/2, chi/2)
  const p = 1 - gammaincLow(df / 2, chi / 2);
  return { chi: +chi.toFixed(2), df, p, cramersV: +Math.sqrt(chi / (n * Math.min(rows - 1, cols - 1))).toFixed(3), n };
}
function gammaincLow(a, x) {
  if (x < 0 || a <= 0) return 0;
  if (x < a + 1) {
    let sum = 1 / a, term = 1 / a;
    for (let n = 1; n < 200; n++) { term *= x / (a + n); sum += term; if (Math.abs(term) < 1e-14) break; }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  // continued fraction for upper, return 1 - upper
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 200; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
