import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = JSON.parse(
  readFileSync(resolve(root, "figma-pages.json"), "utf8"),
);

const routeFor = {
  Dashboard: "/",
  Candidato: "/candidato",
  Pipeline: "/pipeline",
  Candidatura: "/candidatura",
  Proposta: "/proposta",
  Cliente: "/cliente",
  Qualidade: "/qualidade",
};

const weightMap = {
  Regular: 400,
  Medium: 500,
  "Semi Bold": 600,
  Bold: 700,
};

const fontMap = {
  Inter: "inter",
  "Space Grotesk": "space",
};

function compact(node) {
  const base = {
    id: node.id,
    type: node.type,
    x: Math.round(node.x * 100) / 100,
    y: Math.round(node.y * 100) / 100,
    w: Math.round(node.w * 100) / 100,
    h: Math.round(node.h * 100) / 100,
  };

  if (node.type === "FRAME") {
    base.name = node.name;
    const fill = node.fills?.find((item) => item.color);
    if (fill) base.fill = fill.color;
    if (node.cornerRadius) base.radius = node.cornerRadius;
    if (node.clipsContent) base.clip = true;
    if (node.children?.length) base.children = node.children.map(compact);
    return base;
  }

  base.text = node.text;
  const fill = node.fills?.find((item) => item.color);
  if (fill) base.color = fill.color;
  if (node.fontFamily) base.font = fontMap[node.fontFamily] ?? "inter";
  if (node.fontWeight) base.weight = weightMap[node.fontWeight] ?? 400;
  if (node.fontSize) base.size = node.fontSize;
  if (node.align && node.align !== "LEFT")
    base.align = node.align.toLowerCase();
  return base;
}

const pages = {};
const navLinks = {};

for (const page of source.pages) {
  const slug = page.name.replace("elo. / ", "");
  const route = routeFor[slug];
  if (!route) throw new Error(`No route for ${page.name}`);
  pages[slug] = compact(page);

  const links = {};
  const navigation = page.children.find((child) => child.name === "Navegação");
  const walk = (node) => {
    if (node.type === "TEXT" && routeFor[node.text])
      links[node.id] = routeFor[node.text];
    node.children?.forEach(walk);
  };
  navigation?.children.forEach(walk);
  navLinks[slug] = links;
}

const output = `// Generated from figma-pages.json by scripts/generate-figma-data.mjs.
// Text values are placeholders from the Figma design and can be overridden at runtime.

export type FigmaNode = {
  id: string;
  type: "FRAME" | "TEXT";
  x: number;
  y: number;
  w: number;
  h: number;
  name?: string;
  fill?: string;
  radius?: number;
  clip?: boolean;
  children?: FigmaNode[];
  text?: string;
  color?: string;
  font?: "inter" | "space";
  weight?: number;
  size?: number;
  align?: "center" | "right";
};

export const figmaPages: Record<string, FigmaNode> = ${JSON.stringify(pages, null, 2)};

export const figmaNavLinks: Record<string, Record<string, string>> = ${JSON.stringify(navLinks, null, 2)};
`;

const destination = resolve(root, "src/data/figma-pages.ts");
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, output, "utf8");
execFileSync(
  process.execPath,
  [
    resolve(root, "node_modules/@biomejs/biome/bin/biome"),
    "format",
    "--write",
    destination,
  ],
  { cwd: root, stdio: "ignore" },
);
console.log(
  Object.entries(pages)
    .map(([slug, page]) => `${slug}: ${JSON.stringify(page).length} bytes`)
    .join("\n"),
);
