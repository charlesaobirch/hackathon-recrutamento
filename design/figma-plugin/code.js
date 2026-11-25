/* ============================================================================
 * TalentFlow — Recruitment Control Tower
 * Gerador de esboço Figma a partir do RELATORIO.md
 *
 * Como usar:
 *   1. Abrir um ficheiro novo no Figma (Desktop ou Web).
 *   2. Menu > Plugins > Development > Import plugin from manifest...
 *   3. Escolher design/figma-plugin/manifest.json
 *   4. Correr "TalentFlow — Recruitment Control Tower".
 * ========================================================================== */

(async () => {
  /* ----------------------------- palette -------------------------------- */
  const C = {
    bg: "#F5F7FA",
    surface: "#FFFFFF",
    ink: "#0F172A",
    muted: "#64748B",
    faint: "#94A3B8",
    border: "#E2E8F0",
    soft: "#F1F5F9",
    sidebar: "#0B1220",
    sidebarActive: "#1E293B",
    primary: "#2563EB",
    primarySoft: "#DBEAFE",
    success: "#16A34A",
    successSoft: "#DCFCE7",
    warning: "#D97706",
    warningSoft: "#FEF3C7",
    danger: "#DC2626",
    dangerSoft: "#FEE2E2",
    violet: "#7C3AED",
    violetSoft: "#EDE9FE",
    white: "#FFFFFF",
  };

  /* ------------------------------ fonts --------------------------------- */
  let FAMILY = "Inter";
  const loaded = new Set();

  async function initFonts() {
    const families = ["Inter", "Roboto", "Arial"];
    const styles = ["Regular", "Medium", "Semi Bold", "Bold", "Extra Bold"];
    for (const fam of families) {
      for (const style of styles) {
        try {
          await figma.loadFontAsync({ family: fam, style });
          loaded.add(fam + "|" + style);
        } catch (e) {
          /* style unavailable */
        }
      }
      if (loaded.has(fam + "|Regular")) {
        FAMILY = fam;
        return;
      }
    }
  }

  function font(style) {
    if (loaded.has(FAMILY + "|" + style)) return { family: FAMILY, style };
    if (loaded.has(FAMILY + "|Regular")) return { family: FAMILY, style: "Regular" };
    return { family: "Inter", style: "Regular" };
  }

  /* ---------------------------- primitives ------------------------------ */
  function solid(hex, opacity) {
    const raw = String(hex).replace("#", "");
    const h = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
    return {
      type: "SOLID",
      color: {
        r: parseInt(h.slice(0, 2), 16) / 255,
        g: parseInt(h.slice(2, 4), 16) / 255,
        b: parseInt(h.slice(4, 6), 16) / 255,
      },
      opacity: opacity == null ? 1 : opacity,
    };
  }

  function txt(parent, value, o) {
    o = o || {};
    const t = figma.createText();
    parent.appendChild(t);
    t.fontName = font(o.weight || "Regular");
    t.characters = value;
    t.fontSize = o.size || 14;
    t.fills = [solid(o.color || C.ink)];
    if (o.lineHeight) t.lineHeight = { unit: "PIXELS", value: o.lineHeight };
    if (o.letterSpacing) t.letterSpacing = { unit: "PIXELS", value: o.letterSpacing };
    if (o.align) t.textAlignHorizontal = o.align;
    if (o.width) {
      t.textAutoResize = "HEIGHT";
      t.resize(o.width, Math.max(t.height, 12));
    } else {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
    }
    return t;
  }

  function box(parent, o) {
    o = o || {};
    const f = figma.createFrame();
    parent.appendChild(f);
    f.name = o.name || "Frame";
    f.fills = o.fill ? [solid(o.fill, o.fillOpacity)] : [];
    if (o.stroke) {
      f.strokes = [solid(o.stroke)];
      f.strokeWeight = o.strokeWeight || 1;
    }
    if (o.radius != null) f.cornerRadius = o.radius;
    if (o.clip) f.clipsContent = true;

    const w = o.w == null ? 100 : o.w;
    const h = o.h == null ? 100 : o.h;

    if (o.layout) {
      f.layoutMode = o.layout;
      f.itemSpacing = o.gap == null ? 0 : o.gap;
      const p = o.pad || [0, 0, 0, 0];
      f.paddingTop = p[0];
      f.paddingRight = p[1];
      f.paddingBottom = p[2];
      f.paddingLeft = p[3];
      if (o.justify) f.primaryAxisAlignItems = o.justify;
      if (o.align) f.counterAxisAlignItems = o.align;

      const hugW = !!o.hugW;
      const hugH = o.hugH == null ? true : !!o.hugH;
      if (o.layout === "HORIZONTAL") {
        f.primaryAxisSizingMode = hugW ? "AUTO" : "FIXED";
        f.counterAxisSizingMode = hugH ? "AUTO" : "FIXED";
      } else {
        f.primaryAxisSizingMode = hugH ? "AUTO" : "FIXED";
        f.counterAxisSizingMode = hugW ? "AUTO" : "FIXED";
      }
      f.resize(w, h);
    } else {
      f.resize(w, h);
    }
    return f;
  }

  const TONES = {
    danger: [C.dangerSoft, "#B91C1C"],
    warning: [C.warningSoft, "#B45309"],
    success: [C.successSoft, "#15803D"],
    info: [C.primarySoft, "#1D4ED8"],
    neutral: [C.soft, "#475569"],
    violet: [C.violetSoft, "#6D28D9"],
  };

  function pill(parent, label, tone) {
    const pair = TONES[tone] || TONES.neutral;
    const p = box(parent, {
      name: "Badge " + label,
      h: 22,
      layout: "HORIZONTAL",
      pad: [0, 8, 0, 8],
      radius: 999,
      fill: pair[0],
      hugW: true,
      hugH: false,
      justify: "CENTER",
      align: "CENTER",
    });
    txt(p, label, { size: 10.5, weight: "Semi Bold", color: pair[1] });
    return p;
  }

  function btn(parent, label, variant, w) {
    const styles = {
      primary: [C.primary, C.white, null],
      ghost: [C.surface, C.ink, C.border],
      danger: [C.danger, C.white, null],
      soft: [C.primarySoft, C.primary, null],
    };
    const s = styles[variant || "primary"] || styles.primary;
    const b = box(parent, {
      name: "Button " + label,
      w: w || 120,
      h: 38,
      layout: "HORIZONTAL",
      gap: 6,
      pad: [0, 14, 0, 14],
      radius: 9,
      fill: s[0],
      stroke: s[2],
      hugW: !w,
      hugH: false,
      justify: "CENTER",
      align: "CENTER",
    });
    txt(b, label, { size: 12, weight: "Semi Bold", color: s[1] });
    return b;
  }

  function chip(parent, label, active) {
    const ch = box(parent, {
      name: "Chip " + label,
      h: 32,
      layout: "HORIZONTAL",
      pad: [0, 12, 0, 12],
      radius: 999,
      fill: active ? C.ink : C.surface,
      stroke: active ? null : C.border,
      hugW: true,
      hugH: false,
      justify: "CENTER",
      align: "CENTER",
    });
    txt(ch, label, { size: 11, weight: "Semi Bold", color: active ? C.white : C.muted });
    return ch;
  }

  function field(parent, label, value, o) {
    o = o || {};
    const w = o.w || 316;
    const f = box(parent, { name: "Field " + label, w, layout: "VERTICAL", gap: 6, hugW: false });
    txt(f, label, { size: 10.5, weight: "Semi Bold", color: C.muted });
    const input = box(f, {
      w,
      h: 40,
      layout: "HORIZONTAL",
      gap: 8,
      align: "CENTER",
      pad: [0, 12, 0, 12],
      fill: o.alert ? C.dangerSoft : C.surface,
      stroke: o.alert ? C.danger : C.border,
      radius: 9,
      hugW: false,
      hugH: false,
    });
    txt(input, value, {
      size: 13,
      weight: o.bold ? "Semi Bold" : "Regular",
      color: o.alert ? "#991B1B" : C.ink,
      width: w - 26,
    });
    if (o.help) txt(f, o.help, { size: 10, color: o.alert ? C.danger : C.faint });
    return f;
  }

  /* ------------------------------ table --------------------------------- */
  function table(parent, cols, rows, o) {
    o = o || {};
    const tw = cols.reduce((a, c) => a + c.w, 0);
    const rh = o.rowHeight || 54;
    const t = box(parent, {
      name: "Table",
      w: tw,
      layout: "VERTICAL",
      gap: 0,
      fill: o.fill === null ? null : C.surface,
      stroke: o.stroke === null ? null : o.stroke || C.border,
      radius: o.radius == null ? 0 : o.radius,
      clip: true,
      hugW: false,
    });

    const head = box(t, {
      name: "Header",
      w: tw,
      h: 38,
      layout: "HORIZONTAL",
      fill: "#F8FAFC",
      hugW: false,
      hugH: false,
    });
    cols.forEach((c) => {
      const cell = box(head, {
        w: c.w,
        h: 38,
        layout: "VERTICAL",
        justify: "CENTER",
        pad: [0, 14, 0, 14],
        hugW: false,
        hugH: false,
      });
      txt(cell, c.label, {
        size: 9.5,
        weight: "Semi Bold",
        color: C.faint,
        letterSpacing: 0.5,
        width: c.w - 28,
      });
    });

    rows.forEach((r, ri) => {
      if (ri > 0) box(t, { name: "Separator", w: tw, h: 1, fill: C.border, hugW: false, hugH: false });
      const row = box(t, {
        name: "Row " + (ri + 1),
        w: tw,
        h: rh,
        layout: "HORIZONTAL",
        hugW: false,
        hugH: false,
      });
      r.forEach((val, ci) => {
        const c = cols[ci];
        const cell = box(row, {
          w: c.w,
          h: rh,
          layout: "VERTICAL",
          justify: "CENTER",
          gap: 2,
          pad: [0, 14, 0, 14],
          hugW: false,
          hugH: false,
        });
        if (val == null) return;
        if (typeof val === "string") {
          txt(cell, val, { size: 11.5, color: C.ink, width: c.w - 28 });
          return;
        }
        if (val.text) {
          txt(cell, val.text, {
            size: 11.5,
            weight: val.bold ? "Semi Bold" : "Regular",
            color: val.color || C.ink,
            width: c.w - 28,
          });
        }
        if (val.sub) txt(cell, val.sub, { size: 9.5, color: C.faint, width: c.w - 28 });
        if (val.badge) pill(cell, val.badge[0], val.badge[1]);
      });
    });
    return t;
  }

  function tableCard(parent, title, count, cols, rows, o) {
    o = o || {};
    const w = o.w || 1128;
    const h = o.h || 700;
    const card = box(parent, {
      name: "Card " + title,
      w,
      h,
      layout: "VERTICAL",
      gap: 12,
      pad: [16, 0, 0, 0],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      clip: true,
      hugW: false,
      hugH: false,
    });
    const head = box(card, {
      w,
      h: 34,
      layout: "HORIZONTAL",
      justify: "SPACE_BETWEEN",
      align: "CENTER",
      pad: [0, 16, 0, 16],
      hugW: false,
      hugH: false,
    });
    txt(head, title, { size: 14, weight: "Bold" });
    if (count) pill(head, count[0], count[1]);
    table(card, cols, rows, {
      w,
      radius: 0,
      stroke: null,
      fill: null,
      rowHeight: o.rowHeight,
    });
    return card;
  }

  /* ------------------------------ shell --------------------------------- */
  let cursorX = 0;

  function screen(name) {
    const s = figma.createFrame();
    s.name = name;
    s.resize(1440, 1024);
    s.x = cursorX;
    s.y = 0;
    cursorX += 1520;
    s.fills = [solid(C.bg)];
    s.clipsContent = true;
    s.layoutMode = "HORIZONTAL";
    s.primaryAxisSizingMode = "FIXED";
    s.counterAxisSizingMode = "FIXED";
    s.itemSpacing = 0;
    return s;
  }

  const NAV = [
    ["Visão geral", "grid"],
    ["Pipeline", "kanban"],
    ["Candidaturas", "users"],
    ["Propostas", "file"],
    ["Clientes", "building"],
    ["Qualidade", "shield"],
  ];

  function sidebar(parent, active) {
    const sb = box(parent, {
      name: "Sidebar",
      w: 248,
      h: 1024,
      layout: "VERTICAL",
      gap: 4,
      pad: [24, 18, 24, 18],
      fill: C.sidebar,
      hugW: false,
      hugH: false,
    });

    const brand = box(sb, {
      name: "Brand",
      w: 212,
      h: 40,
      layout: "HORIZONTAL",
      gap: 10,
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    const logo = box(brand, {
      w: 34,
      h: 34,
      fill: C.primary,
      radius: 10,
      layout: "VERTICAL",
      justify: "CENTER",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    txt(logo, "T", { size: 18, weight: "Bold", color: C.white });
    txt(brand, "TalentFlow", { size: 18, weight: "Bold", color: C.white, letterSpacing: -0.3 });

    const section = box(sb, {
      w: 212,
      h: 30,
      layout: "HORIZONTAL",
      align: "CENTER",
      pad: [10, 12, 0, 12],
      hugW: false,
      hugH: false,
    });
    txt(section, "OPERAÇÃO", { size: 9.5, weight: "Semi Bold", color: "#475569", letterSpacing: 1.4 });

    NAV.forEach((item) => {
      const isActive = item[0] === active;
      const nav = box(sb, {
        name: "Nav " + item[0],
        w: 212,
        h: 40,
        layout: "HORIZONTAL",
        gap: 10,
        align: "CENTER",
        pad: [0, 12, 0, 12],
        radius: 9,
        fill: isActive ? C.sidebarActive : null,
        hugW: false,
        hugH: false,
      });
      const ico = box(nav, {
        w: 18,
        h: 18,
        layout: "VERTICAL",
        justify: "CENTER",
        align: "CENTER",
        hugW: false,
        hugH: false,
      });
      box(ico, {
        w: 12,
        h: 12,
        radius: 3,
        fill: isActive ? C.white : "#64748B",
      });
      txt(nav, item[0], {
        size: 13,
        weight: isActive ? "Semi Bold" : "Medium",
        color: isActive ? C.white : "#94A3B8",
      });
    });

    const spacer = box(sb, { name: "Spacer", w: 212, h: 10, fill: null });
    spacer.layoutGrow = 1;

    const foot = box(sb, {
      name: "User",
      w: 212,
      h: 60,
      layout: "HORIZONTAL",
      gap: 10,
      align: "CENTER",
      pad: [10, 10, 10, 10],
      radius: 10,
      fill: "#111C2E",
      hugW: false,
      hugH: false,
    });
    const av = box(foot, {
      w: 32,
      h: 32,
      radius: 16,
      fill: C.primarySoft,
      layout: "VERTICAL",
      justify: "CENTER",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    txt(av, "AC", { size: 11, weight: "Bold", color: C.primary });
    const u = box(foot, { layout: "VERTICAL", gap: 1, hugW: true });
    txt(u, "Ana Costa", { size: 11.5, weight: "Semi Bold", color: C.white });
    txt(u, "Recrutamento", { size: 9.5, color: "#64748B" });
  }

  function content(parent) {
    return box(parent, {
      name: "Content",
      w: 1192,
      h: 1024,
      layout: "VERTICAL",
      gap: 18,
      pad: [26, 32, 26, 32],
      hugW: false,
      hugH: false,
    });
  }

  function topbar(parent, title, subtitle, actions) {
    const bar = box(parent, {
      name: "Topbar",
      w: 1128,
      h: 56,
      layout: "HORIZONTAL",
      justify: "SPACE_BETWEEN",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    const left = box(bar, { layout: "VERTICAL", gap: 3, hugW: true });
    txt(left, title, { size: 24, weight: "Bold", letterSpacing: -0.5 });
    txt(left, subtitle, { size: 12.5, color: C.muted });

    const right = box(bar, { layout: "HORIZONTAL", gap: 10, align: "CENTER", hugW: true });
    if (actions) {
      actions(right);
      return bar;
    }

    const search = box(right, {
      w: 260,
      h: 38,
      layout: "HORIZONTAL",
      gap: 8,
      align: "CENTER",
      pad: [0, 12, 0, 12],
      radius: 9,
      fill: C.surface,
      stroke: C.border,
      hugW: false,
      hugH: false,
    });
    box(search, { w: 13, h: 13, radius: 7, stroke: C.faint, fill: null });
    txt(search, "Pesquisar candidato, vaga, cliente…", { size: 12, color: C.faint });

    const bell = box(right, {
      w: 38,
      h: 38,
      radius: 9,
      fill: C.surface,
      stroke: C.border,
      layout: "VERTICAL",
      justify: "CENTER",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    box(bell, { w: 13, h: 13, radius: 6, stroke: C.muted, fill: null });

    const avatar = box(right, {
      w: 38,
      h: 38,
      radius: 19,
      fill: C.primarySoft,
      layout: "VERTICAL",
      justify: "CENTER",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    txt(avatar, "AC", { size: 11, weight: "Bold", color: C.primary });
    return bar;
  }

  function kpiRow(parent, items) {
    const row = box(parent, {
      name: "KPIs",
      w: 1128,
      h: 104,
      layout: "HORIZONTAL",
      gap: 14,
      hugW: false,
      hugH: false,
    });
    items.forEach((it) => {
      const card = box(row, {
        name: "KPI " + it.label,
        w: 271.5,
        h: 104,
        layout: "VERTICAL",
        gap: 6,
        pad: [14, 16, 14, 16],
        fill: C.surface,
        stroke: C.border,
        radius: 14,
        hugW: false,
        hugH: false,
      });
      txt(card, it.label, { size: 11.5, weight: "Medium", color: C.muted });
      const v = box(card, { layout: "HORIZONTAL", gap: 8, align: "CENTER", hugW: true });
      txt(v, it.value, { size: 28, weight: "Bold", letterSpacing: -0.8 });
      if (it.badge) pill(v, it.badge[0], it.badge[1]);
      txt(card, it.foot, { size: 10.5, color: C.faint });
    });
  }

  /* ------------------------------ cover --------------------------------- */
  function cover() {
    const s = figma.createFrame();
    s.name = "00 · Capa e sistema";
    s.resize(1440, 1024);
    s.x = cursorX;
    s.y = 0;
    cursorX += 1520;
    s.fills = [solid(C.sidebar)];
    s.clipsContent = true;

    const wrap = box(s, {
      name: "Cover",
      w: 1440,
      h: 1024,
      layout: "VERTICAL",
      gap: 36,
      pad: [64, 80, 64, 80],
      hugW: false,
      hugH: false,
    });

    const top = box(wrap, {
      name: "Top",
      w: 1280,
      h: 520,
      layout: "HORIZONTAL",
      gap: 60,
      hugW: false,
      hugH: false,
    });

    const left = box(top, {
      name: "Intro",
      w: 680,
      h: 520,
      layout: "VERTICAL",
      gap: 16,
      hugW: false,
      hugH: false,
    });
    txt(left, "HACKATHON · RECRUTAMENTO", {
      size: 11,
      weight: "Semi Bold",
      color: "#60A5FA",
      letterSpacing: 2.4,
    });
    txt(left, "TalentFlow", { size: 68, weight: "Bold", color: C.white, letterSpacing: -2.5 });
    txt(left, "Torre de controlo para recrutamento", {
      size: 28,
      weight: "Semi Bold",
      color: "#E2E8F0",
      letterSpacing: -0.4,
    });
    txt(
      left,
      "Esboço de produto construído a partir do RELATORIO.md: a espera entre a última entrevista e a proposta consome 27 dos 40 dias do ciclo, 20,4% das propostas ficam fora da banda e 8 dos 11 ficheiros não são fiáveis para decisões de gestão.",
      { size: 15, color: "#94A3B8", width: 620, lineHeight: 24 }
    );

    const stats = box(left, { name: "Stats", layout: "HORIZONTAL", gap: 36, hugW: true });
    [
      ["40 d", "ciclo médio"],
      ["27 d", "espera até proposta"],
      ["20,4%", "fora da banda"],
      ["262", "contratações"],
    ].forEach((pair) => {
      const st = box(stats, { name: pair[1], layout: "VERTICAL", gap: 2, hugW: true });
      txt(st, pair[0], { size: 28, weight: "Bold", color: C.white, letterSpacing: -0.8 });
      txt(st, pair[1], { size: 10.5, color: "#64748B" });
    });

    const right = box(top, {
      name: "System",
      w: 540,
      h: 520,
      layout: "VERTICAL",
      gap: 16,
      pad: [26, 26, 26, 26],
      fill: "#111C2E",
      stroke: "#1E293B",
      radius: 18,
      hugW: false,
      hugH: false,
    });
    txt(right, "Sistema visual", { size: 13, weight: "Bold", color: C.white });
    txt(right, "Cores, tipografia e componentes reutilizáveis.", { size: 11.5, color: "#94A3B8" });

    const palette = box(right, { name: "Palette", layout: "HORIZONTAL", gap: 8, hugW: true });
    [C.primary, C.success, C.warning, C.danger, C.violet, C.sidebar].forEach((col) => {
      box(palette, { w: 46, h: 46, radius: 10, fill: col, stroke: "#1E293B" });
    });

    txt(right, "Aa  Inter · 12 / 14 / 18 / 28", { size: 18, weight: "Semi Bold", color: C.white });
    txt(right, "Regular · Medium · Semi Bold · Bold", { size: 11, color: "#64748B" });

    const comps = box(right, { name: "Components", layout: "HORIZONTAL", gap: 8, hugW: true });
    btn(comps, "Ação primária", "primary");
    btn(comps, "Secundária", "ghost");

    const badges = box(right, { name: "Badges", layout: "HORIZONTAL", gap: 8, hugW: true });
    pill(badges, "SLA +6 d", "danger");
    pill(badges, "No prazo", "success");
    pill(badges, "Atenção", "warning");
    pill(badges, "Info", "info");

    const mods = box(wrap, {
      name: "Modules",
      w: 1260,
      h: 300,
      layout: "VERTICAL",
      gap: 12,
      hugW: false,
      hugH: false,
    });
    txt(mods, "Módulos do MVP", { size: 13, weight: "Bold", color: C.white });
    const grid = box(mods, {
      name: "Grid",
      w: 1260,
      h: 240,
      layout: "HORIZONTAL",
      gap: 12,
      hugW: false,
      hugH: false,
    });
    [
      ["Torre de Controlo", "Candidaturas paradas, SLA e próxima ação", "01"],
      ["Validação Salarial", "Oferta vs. banda vs. expectativa", "02"],
      ["Qualidade de Dados", "Anomalias P0–P3 e regras de validação", "03"],
      ["Pipeline", "Fases derivadas das entrevistas", "04"],
      ["Clientes", "Retenção, substituições e risco", "05"],
      ["Copiloto (fase 2)", "Perguntas em linguagem natural", "06"],
    ].forEach((m) => {
      const card = box(grid, {
        name: m[0],
        w: 200,
        h: 240,
        layout: "VERTICAL",
        gap: 10,
        pad: [18, 16, 18, 16],
        fill: "#111C2E",
        stroke: "#1E293B",
        radius: 14,
        hugW: false,
        hugH: false,
      });
      txt(card, m[2], { size: 11, weight: "Bold", color: "#60A5FA", letterSpacing: 1 });
      txt(card, m[0], { size: 15, weight: "Semi Bold", color: C.white, width: 168 });
      txt(card, m[1], { size: 11.5, color: "#94A3B8", width: 168, lineHeight: 17 });
    });
  }

  /* --------------------------- control tower ---------------------------- */
  const TOWER_COLS = [
    { label: "CANDIDATO", w: 150 },
    { label: "VAGA", w: 80 },
    { label: "CLIENTE", w: 70 },
    { label: "RECRUTADOR", w: 80 },
    { label: "ÚLTIMA ENTREVISTA", w: 100 },
    { label: "DIAS", w: 70 },
    { label: "SLA", w: 80 },
    { label: "PRÓXIMA AÇÃO", w: 150 },
  ];

  const TOWER_ROWS = [
    [
      { text: "Inês Carvalho", bold: true, sub: "AP004821" },
      { text: "V0184" },
      { text: "CL09" },
      { text: "R07" },
      { text: "12/11/2026" },
      { text: "13 d" },
      { badge: ["+6 d", "danger"] },
      { text: "Enviar proposta", bold: true, color: C.primary },
    ],
    [
      { text: "Tiago Mendes", bold: true, sub: "AP003190" },
      { text: "V0231" },
      { text: "CL06" },
      { text: "R02" },
      { text: "15/11/2026" },
      { text: "10 d" },
      { badge: ["+3 d", "danger"] },
      { text: "Validar salário", bold: true, color: C.primary },
    ],
    [
      { text: "Ana Ribeiro", bold: true, sub: "AP005012" },
      { text: "V0098" },
      { text: "CL05" },
      { text: "R04" },
      { text: "16/11/2026" },
      { text: "9 d" },
      { badge: ["+2 d", "warning"] },
      { text: "Contactar cliente", bold: true, color: C.primary },
    ],
    [
      { text: "Bruno Silva", bold: true, sub: "AP001744" },
      { text: "V0310" },
      { text: "CL01" },
      { text: "R01" },
      { text: "18/11/2026" },
      { text: "7 d" },
      { badge: ["+1 d", "warning"] },
      { text: "Aguardar feedback", bold: true, color: C.primary },
    ],
    [
      { text: "Marta Lopes", bold: true, sub: "AP004400" },
      { text: "V0122" },
      { text: "CL03" },
      { text: "R06" },
      { text: "19/11/2026" },
      { text: "6 d" },
      { badge: ["No prazo", "success"] },
      { text: "Agendar final", bold: true, color: C.primary },
    ],
    [
      { text: "Rui Costa", bold: true, sub: "AP002981" },
      { text: "V0076" },
      { text: "CL02" },
      { text: "R05" },
      { text: "20/11/2026" },
      { text: "5 d" },
      { badge: ["No prazo", "success"] },
      { text: "Preparar proposta", bold: true, color: C.primary },
    ],
    [
      { text: "Sofia Alves", bold: true, sub: "AP005233" },
      { text: "V0145" },
      { text: "CL08" },
      { text: "R03" },
      { text: "21/11/2026" },
      { text: "4 d" },
      { badge: ["No prazo", "success"] },
      { text: "Triagem", bold: true, color: C.primary },
    ],
  ];

  function signalRow(parent, title, sub, tone) {
    const row = box(parent, {
      name: "Signal",
      w: 300,
      layout: "HORIZONTAL",
      gap: 10,
      align: "CENTER",
      hugW: false,
    });
    const dot = box(row, { w: 8, h: 8, radius: 4, fill: TONES[tone][1] });
    const body = box(row, { layout: "VERTICAL", gap: 2, w: 282, hugW: false });
    txt(body, title, { size: 11.5, weight: "Semi Bold", color: C.ink, width: 282 });
    txt(body, sub, { size: 10, color: C.muted, width: 282 });
  }

  function segBar(parent, width, segments) {
    const total = segments.reduce((a, s) => a + s[1], 0);
    const gap = 3;
    const usable = width - gap * (segments.length - 1);
    const bar = box(parent, { w: width, h: 10, layout: "HORIZONTAL", gap, hugW: false, hugH: false });
    segments.forEach((s) => {
      const w = Math.max(8, Math.round((s[1] / total) * usable));
      box(bar, { w, h: 10, fill: s[2], radius: 5 });
    });
    return bar;
  }

  function controlTower() {
    const s = screen("01 · Torre de Controlo");
    sidebar(s, "Visão geral");
    const c = content(s);

    topbar(c, "Torre de Controlo", "Onde o processo está parado e qual é a próxima ação");

    kpiRow(c, [
      {
        label: "Candidaturas paradas",
        value: "34",
        badge: ["+6", "danger"],
        foot: "SLA ultrapassado em 12",
      },
      {
        label: "Espera até proposta",
        value: "27 d",
        badge: ["68%", "warning"],
        foot: "do ciclo total de 40 dias",
      },
      {
        label: "Propostas fora da banda",
        value: "207",
        badge: ["20,4%", "danger"],
        foot: "abaixo do mínimo ou acima do máximo",
      },
      {
        label: "Contratações no mês",
        value: "28",
        badge: ["+12%", "success"],
        foot: "vs. outubro de 2025",
      },
    ]);

    const main = box(c, {
      name: "Main",
      w: 1128,
      h: 520,
      layout: "HORIZONTAL",
      gap: 16,
      hugW: false,
      hugH: false,
    });

    const left = box(main, {
      name: "Priority",
      w: 780,
      h: 520,
      layout: "VERTICAL",
      gap: 12,
      pad: [16, 0, 0, 0],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      clip: true,
      hugW: false,
      hugH: false,
    });
    const lhead = box(left, {
      w: 780,
      h: 34,
      layout: "HORIZONTAL",
      justify: "SPACE_BETWEEN",
      align: "CENTER",
      pad: [0, 16, 0, 16],
      hugW: false,
      hugH: false,
    });
    txt(lhead, "Fila de prioridade", { size: 14, weight: "Bold" });
    const lright = box(lhead, { layout: "HORIZONTAL", gap: 8, align: "CENTER", hugW: true });
    pill(lright, "34 paradas", "danger");
    txt(lright, "Ordenado por SLA", { size: 10, color: C.faint });
    table(left, TOWER_COLS, TOWER_ROWS, { w: 780, radius: 0, stroke: null, fill: null });

    const right = box(main, {
      name: "Signals",
      w: 332,
      h: 520,
      layout: "VERTICAL",
      gap: 12,
      hugW: false,
      hugH: false,
    });

    const sc = box(right, {
      name: "Signals card",
      w: 332,
      h: 210,
      layout: "VERTICAL",
      gap: 10,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(sc, "Sinais do dia", { size: 14, weight: "Bold" });
    signalRow(sc, "3 propostas acima do máximo da banda", "Requer justificação antes do envio", "danger");
    signalRow(sc, "CL09 com retenção de 62,5% aos 90 dias", "Pior cliente do portefólio", "danger");
    signalRow(sc, "V999: 330 candidaturas sem vaga", "Bloquear relatórios oficiais", "warning");

    const cc = box(right, {
      name: "Cycle card",
      w: 332,
      h: 170,
      layout: "VERTICAL",
      gap: 8,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(cc, "Ciclo médio", { size: 14, weight: "Bold" });
    const cv = box(cc, { layout: "HORIZONTAL", gap: 6, align: "MAX", hugW: true });
    txt(cv, "40", { size: 36, weight: "Bold", letterSpacing: -1.2 });
    txt(cv, "dias", { size: 13, color: C.muted });
    txt(cc, "27 dias são espera entre a última entrevista e a proposta (68%).", {
      size: 10.5,
      color: C.muted,
      width: 300,
      lineHeight: 15,
    });
    segBar(cc, 300, [
      ["", 3, "#DBEAFE"],
      ["", 6, "#BFDBFE"],
      ["", 27, "#FCA5A5"],
      ["", 3, "#BBF7D0"],
    ]);

    const ac = box(right, {
      name: "Quick action",
      w: 332,
      h: 116,
      layout: "VERTICAL",
      gap: 10,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(ac, "Ação rápida", { size: 12, weight: "Bold" });
    const ar = box(ac, { layout: "HORIZONTAL", gap: 8, hugW: true });
    btn(ar, "Abrir candidatura", "primary", 150);
    btn(ar, "Ver qualidade", "ghost", 140);

    const bottom = box(c, {
      name: "Bottom",
      w: 1128,
      h: 200,
      layout: "HORIZONTAL",
      gap: 16,
      hugW: false,
      hugH: false,
    });

    const cycle = box(bottom, {
      name: "Process cycle",
      w: 556,
      h: 200,
      layout: "VERTICAL",
      gap: 12,
      pad: [16, 18, 16, 18],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(cycle, "Ciclo do processo", { size: 14, weight: "Bold" });
    txt(cycle, "Candidatura → contratação · mediana 40 dias", { size: 10.5, color: C.faint });
    segBar(cycle, 520, [
      ["", 3, "#DBEAFE"],
      ["", 6, "#BFDBFE"],
      ["", 27, "#FCA5A5"],
      ["", 3, "#BBF7D0"],
    ]);
    const cg = box(cycle, { layout: "HORIZONTAL", gap: 0, w: 520, hugW: false });
    [
      ["3 d", "1ª entrevista"],
      ["6 d", "entrevistas"],
      ["27 d", "espera até proposta"],
      ["3 d", "proposta → contratação"],
    ].forEach((it) => {
      const col = box(cg, { w: 130, layout: "VERTICAL", gap: 2, hugW: false });
      txt(col, it[0], { size: 16, weight: "Bold" });
      txt(col, it[1], { size: 9.5, color: C.faint, width: 118 });
    });

    const funnel = box(bottom, {
      name: "Funnel",
      w: 556,
      h: 200,
      layout: "VERTICAL",
      gap: 10,
      pad: [16, 18, 16, 18],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(funnel, "Funil de conversão", { size: 14, weight: "Bold" });
    [
      ["Candidaturas", "5 962", "100%", "neutral"],
      ["Propostas", "1 065", "17,9%", "warning"],
      ["Contratações", "262", "24,6%", "success"],
    ].forEach((f) => {
      const r = box(funnel, {
        w: 520,
        h: 38,
        layout: "HORIZONTAL",
        justify: "SPACE_BETWEEN",
        align: "CENTER",
        hugW: false,
        hugH: false,
      });
      txt(r, f[0], { size: 11.5, color: C.muted });
      const rr = box(r, { layout: "HORIZONTAL", gap: 10, align: "CENTER", hugW: true });
      txt(rr, f[1], { size: 16, weight: "Bold" });
      pill(rr, f[2], f[3]);
    });
  }

  /* ----------------------------- pipeline ------------------------------- */
  function kanbanCard(parent, d) {
    const card = box(parent, {
      name: "Card " + d.name,
      w: 192,
      h: 120,
      layout: "VERTICAL",
      gap: 5,
      pad: [12, 12, 12, 12],
      fill: C.surface,
      stroke: C.border,
      radius: 10,
      hugW: false,
      hugH: false,
    });
    txt(card, d.name, { size: 12.5, weight: "Bold", width: 168 });
    txt(card, d.role, { size: 10.5, color: C.muted, width: 168 });
    const foot = box(card, {
      w: 168,
      layout: "HORIZONTAL",
      justify: "SPACE_BETWEEN",
      align: "CENTER",
      hugW: false,
    });
    txt(foot, d.client, { size: 10, color: C.faint });
    pill(foot, d.days, d.tone);
  }

  function kanbanColumn(parent, title, count, cards) {
    const col = box(parent, {
      name: "Column " + title,
      w: 216,
      h: 780,
      layout: "VERTICAL",
      gap: 10,
      pad: [12, 12, 12, 12],
      fill: "#EEF2F7",
      radius: 14,
      hugW: false,
      hugH: false,
    });
    const head = box(col, {
      w: 192,
      h: 28,
      layout: "HORIZONTAL",
      justify: "SPACE_BETWEEN",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    const hl = box(head, { layout: "HORIZONTAL", gap: 6, align: "CENTER", hugW: true });
    txt(hl, title, { size: 12, weight: "Bold" });
    pill(hl, String(count), "neutral");
    cards.forEach((cd) => kanbanCard(col, cd));
    const more = box(col, {
      w: 192,
      h: 28,
      layout: "HORIZONTAL",
      justify: "CENTER",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    txt(more, "+ " + (count - cards.length) + " candidaturas", { size: 10.5, color: C.faint });
  }

  function pipeline() {
    const s = screen("02 · Pipeline");
    sidebar(s, "Pipeline");
    const c = content(s);

    topbar(c, "Pipeline", "Fase real derivada das entrevistas, não da etapa_atual");

    const filters = box(c, {
      name: "Filters",
      w: 1128,
      h: 40,
      layout: "HORIZONTAL",
      gap: 8,
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    ["Todas", "CL09", "R07", "SLA ultrapassado", "+ Filtros"].forEach((f, i) => chip(filters, f, i === 0));
    const fsp = box(filters, { w: 10, h: 10, fill: null });
    fsp.layoutGrow = 1;
    txt(filters, "5 962 candidaturas · 10 clientes · 10 recrutadores", { size: 10.5, color: C.faint });

    const kanban = box(c, {
      name: "Kanban",
      w: 1128,
      h: 780,
      layout: "HORIZONTAL",
      gap: 12,
      hugW: false,
      hugH: false,
    });

    kanbanColumn(kanban, "Triagem", 18, [
      { name: "Sofia Alves", role: "Data Analyst · V0145", client: "CL08", days: "4 d", tone: "success" },
      { name: "Miguel Pinto", role: "Backend · V0220", client: "CL02", days: "3 d", tone: "success" },
      { name: "Rita Nunes", role: "QA · V0190", client: "CL04", days: "2 d", tone: "success" },
      { name: "André Faria", role: "DevOps · V0261", client: "CL01", days: "2 d", tone: "success" },
    ]);
    kanbanColumn(kanban, "Entrevista técnica", 12, [
      { name: "Rui Costa", role: "Data Engineer · V0076", client: "CL02", days: "5 d", tone: "success" },
      { name: "Pedro Matos", role: "Frontend · V0301", client: "CL07", days: "4 d", tone: "success" },
      { name: "Carla Dias", role: "Product · V0088", client: "CL01", days: "3 d", tone: "success" },
      { name: "Hugo Nunes", role: "SRE · V0119", client: "CL06", days: "3 d", tone: "success" },
    ]);
    kanbanColumn(kanban, "Entrevista cliente", 9, [
      { name: "Inês Carvalho", role: "Senior Data Eng. · V0184", client: "CL09", days: "+6 d", tone: "danger" },
      { name: "Ana Ribeiro", role: "Product Manager · V0098", client: "CL05", days: "+2 d", tone: "warning" },
      { name: "João Freitas", role: "Analyst · V0250", client: "CL10", days: "7 d", tone: "success" },
      { name: "Beatriz Lima", role: "Designer · V0210", client: "CL09", days: "4 d", tone: "success" },
    ]);
    kanbanColumn(kanban, "Entrevista final", 7, [
      { name: "Marta Lopes", role: "Engineering Mgr · V0122", client: "CL03", days: "6 d", tone: "success" },
      { name: "Nuno Reis", role: "Data Scientist · V0160", client: "CL06", days: "5 d", tone: "success" },
      { name: "Lara Pinto", role: "Recruiter · V0299", client: "CL03", days: "4 d", tone: "success" },
      { name: "Diogo Melo", role: "Architect · V0042", client: "CL07", days: "3 d", tone: "success" },
    ]);
    kanbanColumn(kanban, "Proposta", 5, [
      { name: "Tiago Mendes", role: "Data Engineer · V0231", client: "CL06", days: "+3 d", tone: "danger" },
      { name: "Hugo Sousa", role: "Backend · V0175", client: "CL01", days: "8 d", tone: "warning" },
      { name: "Sara Gomes", role: "Product · V0133", client: "CL04", days: "6 d", tone: "success" },
      { name: "Vasco Rocha", role: "QA Lead · V0247", client: "CL08", days: "5 d", tone: "success" },
    ]);
  }

  /* -------------------------- candidate detail -------------------------- */
  function timelineItem(parent, num, title, meta, note, tone, last) {
    const item = box(parent, {
      name: "Step " + num,
      w: 680,
      h: 110,
      layout: "HORIZONTAL",
      gap: 14,
      hugW: false,
      hugH: false,
    });
    const rail = box(item, {
      w: 24,
      h: 110,
      layout: "VERTICAL",
      align: "CENTER",
      gap: 0,
      hugW: false,
      hugH: false,
    });
    const dot = box(rail, {
      w: 24,
      h: 24,
      radius: 12,
      fill: tone === "danger" ? C.danger : tone === "muted" ? C.soft : C.primary,
      layout: "VERTICAL",
      justify: "CENTER",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    txt(dot, num, {
      size: 9.5,
      weight: "Bold",
      color: tone === "muted" ? C.muted : C.white,
    });
    if (!last) box(rail, { w: 2, h: 86, fill: C.border });

    const body = box(item, { layout: "VERTICAL", gap: 4, w: 620, hugW: false });
    txt(body, title, {
      size: 13,
      weight: "Semi Bold",
      color: tone === "danger" ? "#B91C1C" : C.ink,
      width: 620,
    });
    txt(body, meta, { size: 11, color: C.muted, width: 620 });
    if (note) txt(body, note, { size: 10.5, color: C.faint, width: 620 });
  }

  function detail() {
    const s = screen("03 · Candidatura");
    sidebar(s, "Candidaturas");
    const c = content(s);

    topbar(c, "Inês Carvalho", "AP004821 · Senior Data Engineer · V0184 · CL09", (right) => {
      btn(right, "Contactar recrutador", "ghost");
      btn(right, "Abrir validação salarial", "primary");
    });

    const banner = box(c, {
      name: "SLA banner",
      w: 1128,
      h: 64,
      layout: "HORIZONTAL",
      gap: 12,
      align: "CENTER",
      pad: [0, 18, 0, 18],
      fill: C.dangerSoft,
      stroke: "#FCA5A5",
      radius: 12,
      hugW: false,
      hugH: false,
    });
    box(banner, { w: 10, h: 10, radius: 5, fill: C.danger });
    const b = box(banner, { layout: "VERTICAL", gap: 2, hugW: true });
    txt(b, "13 dias sem ação desde a última entrevista", {
      size: 13,
      weight: "Semi Bold",
      color: "#991B1B",
    });
    txt(b, "SLA de 48 h ultrapassado há 6 dias · última interação em 12/11/2026", {
      size: 11,
      color: "#B91C1C",
    });

    const main = box(c, {
      name: "Detail",
      w: 1128,
      h: 816,
      layout: "HORIZONTAL",
      gap: 16,
      hugW: false,
      hugH: false,
    });

    const tlCard = box(main, {
      name: "Timeline",
      w: 720,
      h: 816,
      layout: "VERTICAL",
      gap: 6,
      pad: [20, 20, 20, 20],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(tlCard, "Percurso da candidatura", { size: 14, weight: "Bold" });
    txt(tlCard, "Fase real derivada das entrevistas registadas", { size: 10.5, color: C.faint });

    const tl = box(tlCard, {
      name: "Steps",
      w: 680,
      h: 550,
      layout: "VERTICAL",
      gap: 0,
      hugW: false,
      hugH: false,
    });
    timelineItem(tl, "1", "Candidatura recebida", "02/10/2026 · canal LinkedIn", "Score do currículo 78/100", "done", false);
    timelineItem(tl, "2", "Triagem concluída", "05/10/2026 · recrutador R07", "Aprovado para entrevista técnica", "done", false);
    timelineItem(tl, "3", "Entrevista técnica", "09/10/2026 · 4,2/5 · R07", "Score técnico 88/100", "done", false);
    timelineItem(tl, "4", "Entrevista cliente", "12/11/2026 · 4,5/5 · CL09", "Feedback positivo, sem reservas", "done", false);
    timelineItem(
      tl,
      "5",
      "Proposta por enviar",
      "13 dias sem decisão · SLA 48 h ultrapassado",
      "Bloqueio: oferta €76 500 acima do máximo da banda (€74 000)",
      "danger",
      true
    );

    const note = box(tlCard, {
      name: "Note",
      w: 680,
      h: 130,
      layout: "VERTICAL",
      gap: 6,
      pad: [14, 16, 14, 16],
      fill: C.soft,
      radius: 10,
      hugW: false,
      hugH: false,
    });
    txt(note, "Nota do recrutador", { size: 11, weight: "Semi Bold", color: C.muted });
    txt(
      note,
      "Cliente pediu exceção salarial para não perder a candidata. Sem resposta desde 12/11. Próximo passo: validar banda e enviar proposta ou registar justificação formal.",
      { size: 11.5, color: C.ink, width: 648, lineHeight: 18 }
    );

    const side = box(main, {
      name: "Side",
      w: 392,
      h: 816,
      layout: "VERTICAL",
      gap: 12,
      hugW: false,
      hugH: false,
    });

    const action = box(side, {
      name: "Next action",
      w: 392,
      h: 240,
      layout: "VERTICAL",
      gap: 10,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(action, "Próxima ação", { size: 14, weight: "Bold" });
    txt(action, "Enviar proposta ou justificar a exceção salarial antes de avançar.", {
      size: 11,
      color: C.muted,
      width: 360,
      lineHeight: 16,
    });
    btn(action, "Abrir validação salarial", "primary", 360);
    btn(action, "Contactar recrutador", "ghost", 360);
    btn(action, "Marcar intervenção", "ghost", 360);

    const band = box(side, {
      name: "Band",
      w: 392,
      h: 240,
      layout: "VERTICAL",
      gap: 10,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(band, "Banda salarial", { size: 14, weight: "Bold" });
    const br = box(band, {
      w: 360,
      layout: "HORIZONTAL",
      justify: "SPACE_BETWEEN",
      align: "CENTER",
      hugW: false,
    });
    txt(br, "€62 000 – €74 000", { size: 13, weight: "Semi Bold" });
    pill(br, "Expectativa €78 500", "warning");
    const viz = box(band, { name: "Band viz", w: 360, h: 54, fill: null });
    const track = box(viz, { w: 360, h: 10, fill: C.soft, radius: 5 });
    track.x = 0;
    track.y = 22;
    const range = box(viz, { w: 216, h: 10, fill: C.primarySoft, radius: 5 });
    range.x = 36;
    range.y = 22;
    const offer = box(viz, { w: 12, h: 12, fill: C.danger, radius: 6 });
    offer.x = 291;
    offer.y = 21;
    const exp = box(viz, { w: 12, h: 12, fill: C.warning, radius: 6 });
    exp.x = 327;
    exp.y = 21;
    const lg = box(band, { layout: "HORIZONTAL", gap: 14, hugW: true });
    [
      ["Banda", C.primarySoft],
      ["Oferta", C.danger],
      ["Expectativa", C.warning],
    ].forEach((l) => {
      const item = box(lg, { layout: "HORIZONTAL", gap: 5, align: "CENTER", hugW: true });
      box(item, { w: 8, h: 8, radius: 4, fill: l[1] });
      txt(item, l[0], { size: 9.5, color: C.faint });
    });

    const signals = box(side, {
      name: "Signals",
      w: 392,
      h: 312,
      layout: "VERTICAL",
      gap: 12,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(signals, "Sinais", { size: 14, weight: "Bold" });
    [
      ["Score técnico", "88/100", "success"],
      ["Entrevista cliente", "4,5/5", "success"],
      ["Dias sem interação", "9 dias", "warning"],
      ["Propostas anteriores do cliente", "4 abaixo do mínimo", "danger"],
    ].forEach((sig) => {
      const r = box(signals, {
        w: 360,
        h: 40,
        layout: "HORIZONTAL",
        justify: "SPACE_BETWEEN",
        align: "CENTER",
        hugW: false,
        hugH: false,
      });
      txt(r, sig[0], { size: 11, color: C.muted, width: 230 });
      pill(r, sig[1], sig[2]);
    });
  }

  /* ---------------------------- salary ---------------------------------- */
  function alertRow(parent, title, sub, tone) {
    const row = box(parent, {
      name: "Alert",
      w: 360,
      layout: "HORIZONTAL",
      gap: 10,
      align: "CENTER",
      hugW: false,
    });
    const dot = box(row, { w: 8, h: 8, radius: 4, fill: TONES[tone][1] });
    const body = box(row, { layout: "VERTICAL", gap: 2, w: 342, hugW: false });
    txt(body, title, { size: 11.5, weight: "Semi Bold", color: TONES[tone][1], width: 342 });
    txt(body, sub, { size: 10, color: C.muted, width: 342, lineHeight: 14 });
  }

  function salary() {
    const s = screen("04 · Validação Salarial");
    sidebar(s, "Propostas");
    const c = content(s);

    topbar(c, "Validação Salarial", "Comparar oferta, banda da vaga e expectativa antes de enviar");

    const main = box(c, {
      name: "Salary main",
      w: 1128,
      h: 660,
      layout: "HORIZONTAL",
      gap: 16,
      hugW: false,
      hugH: false,
    });

    const form = box(main, {
      name: "Proposal form",
      w: 680,
      h: 660,
      layout: "VERTICAL",
      gap: 14,
      pad: [20, 16, 20, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    const fh = box(form, {
      w: 648,
      h: 24,
      layout: "HORIZONTAL",
      justify: "SPACE_BETWEEN",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    txt(fh, "Dados da proposta", { size: 14, weight: "Bold" });
    pill(fh, "Fora da banda", "danger");

    const row1 = box(form, { layout: "HORIZONTAL", gap: 16, hugW: true });
    field(row1, "Candidato", "Inês Carvalho", { w: 316, bold: true });
    field(row1, "Vaga", "V0184 · Senior Data Engineer", { w: 316 });

    const row2 = box(form, { layout: "HORIZONTAL", gap: 16, hugW: true });
    field(row2, "Cliente", "CL09 · Saúde", { w: 316 });
    field(row2, "Recrutador", "R07 · Produto", { w: 316 });

    const row3 = box(form, { layout: "HORIZONTAL", gap: 16, hugW: true });
    field(row3, "Expectativa do candidato", "€78 500", { w: 316, bold: true });
    field(row3, "Banda da vaga", "€62 000 – €74 000", { w: 316 });

    field(form, "Oferta", "€76 500", {
      w: 648,
      alert: true,
      bold: true,
      help: "Acima do máximo da banda em €2 500 e abaixo da expectativa em €2 000.",
    });

    const jf = box(form, { name: "Justification", w: 648, layout: "VERTICAL", gap: 6, hugW: false });
    txt(jf, "Justificação da exceção", { size: 10.5, weight: "Semi Bold", color: C.muted });
    const ta = box(jf, {
      w: 648,
      h: 84,
      layout: "VERTICAL",
      pad: [10, 12, 10, 12],
      fill: C.surface,
      stroke: C.border,
      radius: 9,
      hugW: false,
      hugH: false,
    });
    txt(
      ta,
      "Cliente aceita pagar acima do máximo para funções críticas. Necessária aprovação do gestor de recrutamento.",
      { size: 11.5, color: C.muted, width: 620, lineHeight: 17 }
    );

    const actions = box(form, { layout: "HORIZONTAL", gap: 10, hugW: true });
    btn(actions, "Ajustar para €72 000", "primary", 180);
    btn(actions, "Justificar exceção", "ghost", 160);
    btn(actions, "Enviar proposta", "ghost", 170);

    const right = box(main, {
      name: "Salary side",
      w: 432,
      h: 660,
      layout: "VERTICAL",
      gap: 12,
      hugW: false,
      hugH: false,
    });

    const bandCard = box(right, {
      name: "Band card",
      w: 432,
      h: 260,
      layout: "VERTICAL",
      gap: 10,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(bandCard, "Posição na banda", { size: 14, weight: "Bold" });
    const minmax = box(bandCard, {
      w: 400,
      layout: "HORIZONTAL",
      justify: "SPACE_BETWEEN",
      align: "CENTER",
      hugW: false,
    });
    txt(minmax, "Mín. €62 000", { size: 10.5, color: C.faint });
    txt(minmax, "Máx. €74 000", { size: 10.5, color: C.faint });
    const viz2 = box(bandCard, { name: "Band viz", w: 400, h: 70, fill: null });
    const t2 = box(viz2, { w: 400, h: 12, fill: C.soft, radius: 6 });
    t2.x = 0;
    t2.y = 28;
    const r2 = box(viz2, { w: 240, h: 12, fill: C.primarySoft, radius: 6 });
    r2.x = 40;
    r2.y = 28;
    const o2 = box(viz2, { w: 14, h: 14, fill: C.danger, radius: 7 });
    o2.x = 323;
    o2.y = 27;
    const e2 = box(viz2, { w: 14, h: 14, fill: C.warning, radius: 7 });
    e2.x = 363;
    e2.y = 27;
    const lg2 = box(bandCard, { layout: "HORIZONTAL", gap: 16, hugW: true });
    [
      ["Banda €62k–€74k", C.primarySoft],
      ["Oferta €76,5k", C.danger],
      ["Expectativa €78,5k", C.warning],
    ].forEach((l) => {
      const item = box(lg2, { layout: "HORIZONTAL", gap: 5, align: "CENTER", hugW: true });
      box(item, { w: 8, h: 8, radius: 4, fill: l[1] });
      txt(item, l[0], { size: 9.5, color: C.faint });
    });

    const alerts = box(right, {
      name: "Alerts",
      w: 432,
      h: 220,
      layout: "VERTICAL",
      gap: 12,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(alerts, "Alertas", { size: 14, weight: "Bold" });
    alertRow(alerts, "Oferta acima do máximo", "+€2 500 face ao topo da banda (€74 000).", "danger");
    alertRow(alerts, "Expectativa acima do máximo", "Candidata pede €78 500; +€4 500 face ao topo.", "warning");
    alertRow(alerts, "Sem negociação registada", "Salário final = salário oferecido em 100% das contratações.", "info");

    const dec = box(right, {
      name: "Decision",
      w: 432,
      h: 156,
      layout: "VERTICAL",
      gap: 10,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(dec, "Decisão", { size: 14, weight: "Bold" });
    btn(dec, "Corrigir oferta para €72 000", "primary", 400);
    btn(dec, "Registar exceção com aprovação", "ghost", 400);

    const rules = box(c, {
      name: "Rules",
      w: 1128,
      h: 200,
      layout: "VERTICAL",
      gap: 8,
      pad: [16, 18, 16, 18],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    txt(rules, "Regras aplicadas", { size: 14, weight: "Bold" });
    [
      ["Oferta dentro da banda", "€62 000 ≤ oferta ≤ €74 000", "Falhou", "danger"],
      ["Expectativa dentro do máximo", "expectativa ≤ €74 000", "Falhou", "danger"],
      ["Oferta ≥ expectativa − 5%", "€76 500 ≥ €74 575", "Passou", "success"],
      ["Justificação obrigatória em exceção", "campo preenchido", "Passou", "success"],
    ].forEach((r) => {
      const row = box(rules, {
        w: 1092,
        h: 30,
        layout: "HORIZONTAL",
        justify: "SPACE_BETWEEN",
        align: "CENTER",
        hugW: false,
        hugH: false,
      });
      const l = box(row, { layout: "HORIZONTAL", gap: 8, align: "CENTER", hugW: true });
      txt(l, r[0], { size: 11.5, weight: "Semi Bold" });
      txt(l, r[1], { size: 10.5, color: C.faint });
      pill(row, r[2], r[3]);
    });
  }

  /* ----------------------------- quality -------------------------------- */
  function quality() {
    const s = screen("05 · Qualidade de Dados");
    sidebar(s, "Qualidade");
    const c = content(s);

    topbar(c, "Qualidade de Dados", "Anomalias priorizadas antes de qualquer dashboard");

    kpiRow(c, [
      { label: "P0 · Críticas", value: "4", badge: ["Bloqueia", "danger"], foot: "invalidam análises" },
      { label: "P1 · Altas", value: "6", badge: ["Distorce", "warning"], foot: "distorcem decisões" },
      { label: "P2 · Médias", value: "5", badge: ["Tratar", "info"], foot: "tratamento obrigatório" },
      { label: "P3 · Baixas", value: "2", badge: ["Limpeza", "neutral"], foot: "cosmético" },
    ]);

    const filters = box(c, {
      name: "Quality filters",
      w: 1128,
      h: 40,
      layout: "HORIZONTAL",
      gap: 8,
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    ["Todas (17)", "P0 (4)", "P1 (6)", "P2 (5)", "P3 (2)"].forEach((f, i) => chip(filters, f, i === 0));
    const fsp = box(filters, { w: 10, h: 10, fill: null });
    fsp.layoutGrow = 1;
    txt(filters, "Última validação: 25/11/2026 · 09:42", { size: 10.5, color: C.faint });

    const cols = [
      { label: "SEVERIDADE", w: 100 },
      { label: "ANOMALIA", w: 300 },
      { label: "ONDE", w: 170 },
      { label: "QUANTIFICAÇÃO", w: 300 },
      { label: "AÇÃO", w: 258 },
    ];
    const rows = [
      [
        { badge: ["P0", "danger"] },
        { text: "Contratação sem passar pela entrevista final", bold: true },
        { text: "candidaturas × entrevistas" },
        { text: "2 782 na fase final, 0 contratações" },
        { text: "Rever regra de negócio", color: C.primary, bold: true },
      ],
      [
        { badge: ["P0", "danger"] },
        { text: "Estado do candidato desligado da realidade", bold: true },
        { text: "candidatos" },
        { text: "864 'contratado' vs. 254 reais" },
        { text: "Recalcular a partir de contratações", color: C.primary, bold: true },
      ],
      [
        { badge: ["P0", "danger"] },
        { text: "Candidaturas para vaga inexistente", bold: true },
        { text: "candidaturas" },
        { text: "330 registos em V999" },
        { text: "Remapear ou bloquear por FK", color: C.primary, bold: true },
      ],
      [
        { badge: ["P0", "danger"] },
        { text: "Etapa atual aleatória", bold: true },
        { text: "candidaturas" },
        { text: "16,7% de coincidência com a fase real" },
        { text: "Derivar de entrevistas", color: C.primary, bold: true },
      ],
      [
        { badge: ["P1", "warning"] },
        { text: "Datas em dois formatos", bold: true },
        { text: "entrevistas" },
        { text: "3 831 registos (20%) em dd/mm/aaaa" },
        { text: "Normalizar para ISO 8601", color: C.primary, bold: true },
      ],
      [
        { badge: ["P1", "warning"] },
        { text: "Score técnico fora do domínio", bold: true },
        { text: "entrevistas" },
        { text: "533 registos > 100, máximo 125" },
        { text: "Invalidar ou aplicar clip", color: C.primary, bold: true },
      ],
      [
        { badge: ["P1", "warning"] },
        { text: "Proposta respondida após a contratação", bold: true },
        { text: "propostas × contratações" },
        { text: "191 de 262 casos" },
        { text: "Validar sequência temporal", color: C.primary, bold: true },
      ],
      [
        { badge: ["P2", "info"] },
        { text: "Duplicados exatos", bold: true },
        { text: "contratações" },
        { text: "5 linhas (1,9%)" },
        { text: "Deduplicar por id", color: C.primary, bold: true },
      ],
    ];

    const qc = tableCard(c, "Registo de anomalias", ["17 abertas", "danger"], cols, rows, {
      w: 1128,
      h: 700,
      rowHeight: 58,
    });

    const note = box(qc, {
      name: "Quality note",
      w: 1128,
      h: 90,
      layout: "HORIZONTAL",
      gap: 12,
      align: "CENTER",
      pad: [0, 18, 0, 18],
      fill: C.dangerSoft,
      hugW: false,
      hugH: false,
    });
    box(note, { w: 10, h: 10, radius: 5, fill: C.danger });
    const nb = box(note, { layout: "VERTICAL", gap: 2, w: 1060, hugW: false });
    txt(nb, "P0 bloqueia relatórios oficiais até correção", {
      size: 12,
      weight: "Semi Bold",
      color: "#991B1B",
      width: 1060,
    });
    txt(nb, "P1 distorce decisões de gestão; P2 exige tratamento; P3 é limpeza cosmética.", {
      size: 10.5,
      color: "#B91C1C",
      width: 1060,
    });
  }

  /* ----------------------------- clients -------------------------------- */
  function riskCard(parent, d) {
    const card = box(parent, {
      name: "Risk " + d.id,
      w: 365.33,
      h: 150,
      layout: "VERTICAL",
      gap: 10,
      pad: [16, 16, 16, 16],
      fill: C.surface,
      stroke: C.border,
      radius: 14,
      hugW: false,
      hugH: false,
    });
    const top = box(card, {
      w: 333.33,
      layout: "HORIZONTAL",
      justify: "SPACE_BETWEEN",
      align: "CENTER",
      hugW: false,
      hugH: false,
    });
    const left = box(top, { layout: "VERTICAL", gap: 2, hugW: true });
    txt(left, d.id, { size: 16, weight: "Bold" });
    txt(left, d.sector, { size: 10.5, color: C.faint });
    pill(top, d.risk, d.tone);
    const metrics = box(card, { layout: "HORIZONTAL", gap: 24, hugW: true });
    [
      ["Retenção", d.ret],
      ["Satisfação", d.sat],
      ["Substituições", d.subs],
    ].forEach((m) => {
      const item = box(metrics, { layout: "VERTICAL", gap: 2, hugW: true });
      txt(item, m[1], { size: 20, weight: "Bold", letterSpacing: -0.5 });
      txt(item, m[0], { size: 9.5, color: C.faint });
    });
  }

  function clients() {
    const s = screen("06 · Clientes");
    sidebar(s, "Clientes");
    const c = content(s);

    topbar(c, "Clientes", "Radar de retenção, substituições e satisfação");

    const riskRow = box(c, {
      name: "Risk cards",
      w: 1128,
      h: 150,
      layout: "HORIZONTAL",
      gap: 16,
      hugW: false,
      hugH: false,
    });
    riskCard(riskRow, {
      id: "CL09",
      sector: "Saúde · exclusivo · recente",
      risk: "Risco alto",
      tone: "danger",
      ret: "62,5%",
      sat: "3,19",
      subs: "4/21",
    });
    riskCard(riskRow, {
      id: "CL06",
      sector: "Energia · contingência · longo",
      risk: "Risco alto",
      tone: "danger",
      ret: "77,3%",
      sat: "3,70",
      subs: "6/30",
    });
    riskCard(riskRow, {
      id: "CL05",
      sector: "Tecnologia · exclusivo · recente",
      risk: "Risco médio",
      tone: "warning",
      ret: "75%",
      sat: "3,59",
      subs: "4/27",
    });

    const cols = [
      { label: "CLIENTE", w: 80 },
      { label: "SETOR", w: 90 },
      { label: "VAGAS", w: 60 },
      { label: "CONTRATAÇÕES", w: 100 },
      { label: "RETENÇÃO 90D", w: 95 },
      { label: "SATISFAÇÃO", w: 95 },
      { label: "SUBSTITUIÇÕES", w: 105 },
      { label: "MODELO", w: 100 },
      { label: "CUSTO", w: 95 },
      { label: "SAÚDE", w: 120 },
      { label: "AÇÃO", w: 188 },
    ];

    const rows = [
      ["CL01", "Saúde", "48", "27", "90%", "3,48", "4/27", "Partilhado", "€4 391", { badge: ["82 · Saudável", "success"] }, { text: "Rever plano", bold: true, color: C.primary }],
      ["CL02", "Energia", "51", "30", "90%", "3,37", "3/30", "Partilhado", "€4 561", { badge: ["80 · Saudável", "success"] }, { text: "Monitorizar", bold: true, color: C.primary }],
      ["CL03", "Retalho", "44", "24", "86,7%", "3,83", "2/24", "Partilhado", "€5 148", { badge: ["84 · Saudável", "success"] }, { text: "Manter", bold: true, color: C.primary }],
      ["CL04", "Retalho", "44", "22", "90,5%", "3,36", "1/22", "Exclusivo", "€4 515", { badge: ["79 · Saudável", "success"] }, { text: "Manter", bold: true, color: C.primary }],
      ["CL05", "Tecnologia", "54", "27", "75%", "3,59", "4/27", "Exclusivo", "€3 981", { badge: ["66 · Atenção", "warning"] }, { text: "Plano 30/60/90", bold: true, color: C.primary }],
      ["CL06", "Energia", "50", "30", "77,3%", "3,70", "6/30", "Contingência", "€4 789", { badge: ["61 · Risco", "danger"] }, { text: "Rever contrato", bold: true, color: C.primary }],
      ["CL07", "Banca", "49", "25", "89,5%", "3,28", "2/25", "Partilhado", "€4 562", { badge: ["78 · Saudável", "success"] }, { text: "Manter", bold: true, color: C.primary }],
      ["CL08", "Banca", "44", "28", "86,4%", "3,32", "2/28", "Partilhado", "€4 396", { badge: ["77 · Saudável", "success"] }, { text: "Manter", bold: true, color: C.primary }],
      ["CL09", "Saúde", "46", "21", "62,5%", "3,19", "4/21", "Exclusivo", "€4 835", { badge: ["52 · Risco", "danger"] }, { text: "Plano de retenção", bold: true, color: C.primary }],
      ["CL10", "Energia", "50", "28", "87%", "3,61", "4/28", "Contingência", "€4 474", { badge: ["74 · Saudável", "success"] }, { text: "Monitorizar", bold: true, color: C.primary }],
    ];

    const tc = tableCard(c, "Radar de clientes", ["10 clientes", "neutral"], cols, rows, {
      w: 1128,
      h: 710,
      rowHeight: 50,
    });

    const note = box(tc, {
      name: "Clients note",
      w: 1128,
      h: 90,
      layout: "HORIZONTAL",
      gap: 12,
      align: "CENTER",
      pad: [0, 18, 0, 18],
      fill: C.soft,
      hugW: false,
      hugH: false,
    });
    box(note, { w: 10, h: 10, radius: 5, fill: C.primary });
    const nb = box(note, { layout: "VERTICAL", gap: 2, w: 1060, hugW: false });
    txt(nb, "Satisfação declarada não é KPI suficiente", {
      size: 12,
      weight: "Semi Bold",
      color: C.ink,
      width: 1060,
    });
    txt(nb, "Usar retenção a 90/180 dias, substituições e desempenho. 32 substituições ≈ €146 mil de custo direto.", {
      size: 10.5,
      color: C.muted,
      width: 1060,
    });
  }

  /* ------------------------------- run ---------------------------------- */
  await initFonts();

  const title = figma.createText();
  title.fontName = font("Bold");
  title.characters = "TalentFlow · Esboço de aplicação";
  title.fontSize = 44;
  title.fills = [solid(C.ink)];
  title.x = 0;
  title.y = -130;

  const sub = figma.createText();
  sub.fontName = font("Regular");
  sub.characters =
    "Baseado no RELATORIO.md · 11 tabelas · 79 963 registos · 262 contratações · 25/11/2026";
  sub.fontSize = 18;
  sub.fills = [solid(C.muted)];
  sub.x = 0;
  sub.y = -76;

  cover();
  controlTower();
  pipeline();
  detail();
  salary();
  quality();
  clients();

  figma.currentPage.name = "TalentFlow · Esboço";
  try {
    await figma.currentPage.loadAsync();
  } catch (e) {
    /* current page is already loaded on older API versions */
  }
  figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
  figma.closePlugin("Esboço TalentFlow criado: 7 frames.");

})();
