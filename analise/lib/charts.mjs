// Minimal SVG chart library — no external deps.
const PALETTE = ["#2b6cb0", "#dd6b20", "#2f855a", "#805ad5", "#c53030", "#4a5568", "#b7791f", "#2c7a7b"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const fmtInt = (v) => {
  const n = Math.round(v);
  return Math.abs(n) >= 10000 ? (n / 1000).toFixed(0) + "k" : String(n);
};

function frame(w, h, title, subtitle) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${esc(title)}" style="max-width:${w}px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;background:#fff">
  <text x="16" y="24" font-size="15" font-weight="600" fill="#1a202c">${esc(title)}</text>
  ${subtitle ? `<text x="16" y="42" font-size="11.5" fill="#4a5568">${esc(subtitle)}</text>` : ""}`;
}

// Escala com passo «redondo» (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10 × 10^n),
// para que os eixos mostrem valores legíveis em vez de 474 / 1 421 / 885.
function niceStep(raw) {
  if (!isFinite(raw) || raw <= 0) return 1;
  const base = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / base;
  const cands = [1, 1.2, 1.5, 1.6, 1.8, 2, 2.5, 3, 4, 5, 6, 8, 10];
  return (cands.find((c) => n <= c) ?? 10) * base;
}
function niceMax(maxValue, ticks = 4, headroom = 1.02) {
  return niceStep((maxValue * headroom) / ticks) * ticks;
}

const AXIS = (x, y, h, w) => `
  <line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="#cbd5e0" stroke-width="1"/>
  <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="#cbd5e0" stroke-width="1"/>`;

export function barChart({ title, subtitle, data, w = 720, h = 340, unit = "", color = PALETTE[0], valueFmt = fmtInt }) {
  const pad = { t: 56, r: 20, b: 56, l: 64 };
  const max = niceMax(Math.max(...data.map((d) => d.value)), 4);
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  let body = "";
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i, y = pad.t + ih - (v / max) * ih;
    body += `<line x1="${pad.l}" y1="${y}" x2="${pad.l + iw}" y2="${y}" stroke="#edf2f7"/><text x="${pad.l - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="#718096">${valueFmt(v)}</text>`;
  }
  const bw = iw / data.length;
  data.forEach((d, i) => {
    const bh = (d.value / max) * ih;
    const x = pad.l + i * bw + bw * 0.18;
    const y = pad.t + ih - bh;
    body += `<g><title>${esc(d.label)}: ${d.value}${unit}</title>
      <rect x="${x}" y="${y}" width="${bw * 0.64}" height="${Math.max(bh, 0)}" rx="2" fill="${d.color || color}" opacity="0.92"/>
      <text x="${x + bw * 0.32}" y="${y - 5}" font-size="10.5" text-anchor="middle" fill="#2d3748" font-weight="600">${valueFmt(d.value)}</text>
      <text x="${x + bw * 0.32}" y="${h - pad.b + 16}" font-size="9.5" text-anchor="middle" fill="#4a5568" transform="rotate(${data.length > 8 ? -30 : 0} ${x + bw * 0.32} ${h - pad.b + 16})">${esc(d.label)}</text></g>`;
  });
  return frame(w, h, title, subtitle) + AXIS(pad.l, pad.t + ih, ih, iw) + body + `</svg>`;
}

export function groupedBarChart({ title, subtitle, labels, series, w = 780, h = 360, unit = "", valueFmt = fmtInt }) {
  const pad = { t: 78, r: 20, b: 66, l: 66 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)), 4, 1.05);
  let body = "";
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i, y = pad.t + ih - (v / max) * ih;
    body += `<line x1="${pad.l}" y1="${y}" x2="${pad.l + iw}" y2="${y}" stroke="#edf2f7"/><text x="${pad.l - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="#718096">${valueFmt(v)}</text>`;
  }
  const gw = iw / labels.length, bw = (gw * 0.72) / series.length;
  labels.forEach((lab, i) => {
    series.forEach((s, j) => {
      const v = s.values[i], bh = (v / max) * ih;
      const x = pad.l + i * gw + gw * 0.14 + j * bw;
      const y = pad.t + ih - bh;
      body += `<g><title>${esc(lab)} — ${esc(s.name)}: ${v}${unit}</title><rect x="${x}" y="${y}" width="${bw - 2}" height="${Math.max(bh, 0)}" rx="2" fill="${s.color || PALETTE[j]}"/>
        <text x="${x + (bw - 2) / 2}" y="${y - 4}" font-size="9" text-anchor="middle" fill="#2d3748">${valueFmt(v)}</text></g>`;
    });
    body += `<text x="${pad.l + i * gw + gw / 2}" y="${h - pad.b + 18}" font-size="10" text-anchor="middle" fill="#4a5568">${esc(lab)}</text>`;
  });
  series.forEach((s, j) => {
    const lx = pad.l + (j % 2) * 190, ly = 52 + Math.floor(j / 2) * 15;
    body += `<rect x="${lx}" y="${ly}" width="11" height="11" rx="2" fill="${s.color || PALETTE[j]}"/><text x="${lx + 17}" y="${ly + 10}" font-size="10.5" fill="#4a5568">${esc(s.name)}</text>`;
  });
  return frame(w, h, title, subtitle) + AXIS(pad.l, pad.t + ih, ih, iw) + body + `</svg>`;
}

export function lineChart({ title, subtitle, labels, series, w = 780, h = 340, unit = "", valueFmt = fmtInt, yMax }) {
  const pad = { t: 76, r: 24, b: 62, l: 64 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const flat = series.flatMap((s) => s.values);
  const max = yMax ?? niceMax(Math.max(...flat), 4, 1.03);
  const min = 0;
  let body = "";
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) / 4) * i, y = pad.t + ih - ((v - min) / (max - min)) * ih;
    body += `<line x1="${pad.l}" y1="${y}" x2="${pad.l + iw}" y2="${y}" stroke="#edf2f7"/><text x="${pad.l - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="#718096">${valueFmt(v)}</text>`;
  }
  const stepX = labels.length > 1 ? iw / (labels.length - 1) : iw;
  series.forEach((s, j) => {
    const col = s.color || PALETTE[j];
    const pts = s.values.map((v, i) => `${pad.l + stepX * i},${pad.t + ih - ((v - min) / (max - min)) * ih}`).join(" ");
    body += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/>`;
    s.values.forEach((v, i) => {
      const x = pad.l + stepX * i, y = pad.t + ih - ((v - min) / (max - min)) * ih;
      body += `<g><title>${esc(labels[i])} — ${esc(s.name)}: ${v}${unit}</title><circle cx="${x}" cy="${y}" r="3" fill="#fff" stroke="${col}" stroke-width="2"/></g>`;
    });
  });
  const every = Math.ceil(labels.length / 14);
  labels.forEach((lab, i) => {
    if (i % every) return;
    body += `<text x="${pad.l + stepX * i}" y="${h - pad.b + 16}" font-size="9" text-anchor="middle" fill="#4a5568" transform="rotate(-45 ${pad.l + stepX * i} ${h - pad.b + 16})">${esc(lab)}</text>`;
  });
  series.forEach((s, j) => {
    body += `<rect x="${pad.l + j * 170}" y="52" width="11" height="11" rx="2" fill="${s.color || PALETTE[j]}"/><text x="${pad.l + j * 170 + 17}" y="62" font-size="10.5" fill="#4a5568">${esc(s.name)}</text>`;
  });
  return frame(w, h, title, subtitle) + AXIS(pad.l, pad.t + ih, ih, iw) + body + `</svg>`;
}

export function histogram({ title, subtitle, values, bins, w = 720, h = 320, xLabel = "", color = PALETTE[0], marker, valueFmt = fmtInt }) {
  const pad = { t: 62, r: 20, b: 56, l: 58 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const counts = new Array(bins - 1).fill(0);
  const lo = Math.min(...values), hi = Math.max(...values);
  const step = (hi - lo) / (bins - 1);
  for (const v of values) {
    let i = Math.floor((v - lo) / step);
    if (i >= bins - 1) i = bins - 2;
    if (i < 0) i = 0;
    counts[i]++;
  }
  const max = niceMax(Math.max(...counts), 4, 1.05);
  const bw = iw / (bins - 1);
  let body = "";
  counts.forEach((c, i) => {
    const bh = (c / max) * ih, x = pad.l + i * bw, y = pad.t + ih - bh;
    body += `<g><title>${(lo + i * step).toFixed(1)}–${(lo + (i + 1) * step).toFixed(1)}: ${c}</title><rect x="${x}" y="${y}" width="${bw - 1}" height="${bh}" fill="${color}" opacity=".9" rx="1"/></g>`;
  });
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ih - (ih / 4) * i;
    body += `<line x1="${pad.l}" y1="${y}" x2="${pad.l + iw}" y2="${y}" stroke="#edf2f7"/><text x="${pad.l - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="#718096">${valueFmt((max / 4) * i)}</text>`;
  }
  for (let i = 0; i <= 5; i++) {
    const v = lo + step * ((bins - 1) / 5) * i, x = pad.l + (iw / 5) * i;
    body += `<text x="${x}" y="${h - pad.b + 16}" font-size="10" text-anchor="middle" fill="#4a5568">${v.toFixed(0)}</text>`;
  }
  if (marker !== undefined) {
    const x = pad.l + ((marker - lo) / (hi - lo)) * iw;
    body += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t + ih}" stroke="#c53030" stroke-dasharray="4 3" stroke-width="1.5"/><text x="${x + 4}" y="${pad.t + 10}" font-size="9.5" fill="#c53030">limite ${marker}</text>`;
  }
  body += `<text x="${pad.l + iw / 2}" y="${h - 6}" font-size="10.5" text-anchor="middle" fill="#4a5568">${esc(xLabel)}</text>`;
  return frame(w, h, title, subtitle) + body + `</svg>`;
}

export function hbarChart({ title, subtitle, data, w = 760, h = null, unit = "", color = PALETTE[0], valueFmt = fmtInt }) {
  const rowH = 28;
  h = h || 74 + data.length * rowH;
  const pad = { t: 62, r: 96, b: 22, l: 176 };
  const iw = w - pad.l - pad.r;
  const max = Math.max(...data.map((d) => d.value));
  let body = "";
  data.forEach((d, i) => {
    const y = pad.t + i * rowH, bh = rowH * 0.62;
    const bw = (d.value / max) * iw;
    body += `<g><title>${esc(d.label)}: ${d.value}${unit}</title>
      <text x="${pad.l - 10}" y="${y + bh / 2 + 4}" font-size="10.5" text-anchor="end" fill="#2d3748">${esc(d.label)}</text>
      <rect x="${pad.l}" y="${y}" width="${iw}" height="${bh}" fill="#f7fafc" rx="2"/>
      <rect x="${pad.l}" y="${y}" width="${bw}" height="${bh}" rx="2" fill="${d.color || color}"/>
      <text x="${pad.l + bw + 7}" y="${y + bh / 2 + 4}" font-size="10.5" fill="#2d3748" font-weight="600">${valueFmt(d.value)}</text></g>`;
  });
  return frame(w, h, title, subtitle) + body + `</svg>`;
}

export function stackedTimelineChart({ title, subtitle, segments, categories, w = 780, h = 300 }) {
  const pad = { t: 76, r: 46, b: 30, l: 82 };
  const totals = categories.map((_, i) => segments.reduce((a, s) => a + s.values[i], 0));
  const max = Math.max(...totals) * 1.05;
  const iw = w - pad.l - pad.r;
  const rowH = Math.min(26, (h - pad.t - pad.b) / categories.length);
  let body = "";
  categories.forEach((cat, i) => {
    let x = pad.l;
    const y = pad.t + i * rowH;
    body += `<text x="${pad.l - 10}" y="${y + rowH / 2 + 4}" font-size="10.5" text-anchor="end" fill="#2d3748">${esc(cat)}</text>`;
    segments.forEach((s, j) => {
      const bw = (s.values[i] / max) * iw;
      body += `<g><title>${esc(cat)} — ${esc(s.name)}: ${s.values[i]}d</title><rect x="${x}" y="${y + 2}" width="${Math.max(bw, 0)}" height="${rowH - 6}" fill="${s.color || PALETTE[j]}"/></g>`;
      x += bw;
    });
    body += `<text x="${x + 6}" y="${y + rowH / 2 + 4}" font-size="10" fill="#4a5568" font-weight="600">${totals[i].toFixed(0)}d</text>`;
  });
  segments.forEach((s, j) => {
    body += `<rect x="${pad.l + j * 175}" y="52" width="11" height="11" rx="2" fill="${s.color || PALETTE[j]}"/><text x="${pad.l + j * 175 + 16}" y="62" font-size="10.5" fill="#4a5568">${esc(s.name)}</text>`;
  });
  return frame(w, h, title, subtitle) + body + `</svg>`;
}

export function scatterChart({ title, subtitle, points, w = 700, h = 340, xLabel, yLabel, xDomain, yDomain, tickX = (v) => Math.round(v), tickY = (v) => Math.round(v), xTicks = 5, yTicks = 4, labelPoints = false }) {
  const pad = { t: 64, r: 30, b: 62, l: 66 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const [x0, x1] = xDomain, [y0, y1] = yDomain;
  let body = "";
  for (let i = 0; i <= yTicks; i++) {
    const y = pad.t + ih - (ih / yTicks) * i;
    body += `<line x1="${pad.l}" y1="${y}" x2="${pad.l + iw}" y2="${y}" stroke="#edf2f7"/><text x="${pad.l - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="#718096">${tickY(y0 + ((y1 - y0) / yTicks) * i)}</text>`;
  }
  for (let i = 0; i <= xTicks; i++) {
    const x = pad.l + (iw / xTicks) * i;
    body += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t + ih}" stroke="#f7fafc"/><text x="${x}" y="${h - pad.b + 16}" font-size="10" text-anchor="middle" fill="#4a5568">${tickX(x0 + ((x1 - x0) / xTicks) * i)}</text>`;
  }
  for (const p of points) {
    const x = pad.l + ((p.x - x0) / (x1 - x0)) * iw;
    const y = pad.t + ih - ((p.y - y0) / (y1 - y0)) * ih;
    body += `<circle cx="${x}" cy="${y}" r="${p.r || 3.2}" fill="${p.color || PALETTE[0]}" opacity="${p.opacity ?? 0.55}"><title>${esc(p.title || "")}</title></circle>`;
    if (labelPoints && p.label) body += `<text x="${x + (p.r || 4) + 4 + (p.labelDx || 0)}" y="${y + 3.5 + (p.labelDy || 0)}" font-size="10" font-weight="600" fill="#2d3748">${esc(p.label)}</text>`;
  }
  body += `<text x="${pad.l + iw / 2}" y="${h - 8}" font-size="10.5" text-anchor="middle" fill="#4a5568">${esc(xLabel)}</text>`;
  body += `<text transform="translate(14,${pad.t + ih / 2}) rotate(-90)" font-size="10.5" text-anchor="middle" fill="#4a5568">${esc(yLabel)}</text>`;
  return frame(w, h, title, subtitle) + body + `</svg>`;
}

export function heatmap({ title, subtitle, rows, cols, values, w = 780, h = 420, fmt = (v) => v.toFixed(2), domain = null }) {
  const pad = { t: 76, r: 20, b: 66, l: 132 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const cw = iw / cols.length, rh = ih / rows.length;
  const [dmin, dmax] = domain || [0, Math.max(...values.flat())];
  const lerp = (a, b, t) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return `rgb(${r},${g},${bl})`;
  };
  const colorFor = (v) => v >= 0
    ? lerp("#ffffff", "#2f855a", Math.min(1, v / (dmax || 1)))
    : lerp("#ffffff", "#c53030", Math.min(1, Math.abs(v) / Math.abs(dmin || -1)));
  let body = "";
  rows.forEach((r, i) => {
    body += `<text x="${pad.l - 8}" y="${pad.t + i * rh + rh / 2 + 4}" font-size="10" text-anchor="end" fill="#2d3748">${esc(r)}</text>`;
    cols.forEach((c, j) => {
      const v = values[i][j];
      const dark = Math.abs(v) > 0.55;
      body += `<g><title>${esc(r)} × ${esc(c)}: ${fmt(v)}</title><rect x="${pad.l + j * cw}" y="${pad.t + i * rh}" width="${cw - 1.5}" height="${rh - 1.5}" fill="${colorFor(v)}" rx="2"/>
        <text x="${pad.l + j * cw + cw / 2}" y="${pad.t + i * rh + rh / 2 + 4}" font-size="9" text-anchor="middle" fill="${dark ? "#fff" : "#2d3748"}">${fmt(v)}</text></g>`;
    });
  });
  cols.forEach((c, j) => body += `<text x="${pad.l + j * cw + cw / 2}" y="${h - pad.b + 16}" font-size="9.5" text-anchor="middle" fill="#4a5568" transform="rotate(-30 ${pad.l + j * cw + cw / 2} ${h - pad.b + 16})">${esc(c)}</text>`);
  return frame(w, h, title, subtitle) + body + `</svg>`;
}
