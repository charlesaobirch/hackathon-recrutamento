import { readFileSync, writeFileSync } from "node:fs";

const light = readFileSync(
  "C:/Users/USER/AppData/Local/Temp/farol-brand/farol-wordmark-light.svg",
  "utf8",
);
const match = light.match(/<path d="([^"]+)"/);
if (!match) throw new Error("wordmark path missing");

const icon = `<g transform="scale(1.375)"><rect width="64" height="64" rx="18" fill="#2a2c26"/><path d="M27 24L8 16V32Z" fill="#c8f21a" fill-opacity="0.45"/><path d="M37 24L56 16V32Z" fill="#c8f21a" fill-opacity="0.45"/><path d="M32 11L38 19H26Z" fill="#c8f21a"/><rect x="27" y="19" width="10" height="9" rx="2" fill="#c8f21a"/><rect x="23" y="28" width="18" height="3" rx="1.5" fill="#c8f21a"/><path d="M26 31H38L42 52H22Z" fill="#c8f21a"/><rect x="21" y="37" width="22" height="4" fill="#2a2c26"/><rect x="16" y="52" width="32" height="4" rx="2" fill="#c8f21a"/></g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 292.42 88" width="292.42" height="88" role="img" aria-label="farol"><title>farol</title>${icon}<path d="${match[1]}" fill="#2a2c26" transform="translate(107.03 6.94)"/></svg>`;

writeFileSync("C:/GitHub/hackathon-recrutamento/public/farol-logo.svg", svg);
console.log("wrote", svg.length);
