This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Design do Figma

As telas do Figma ("elo. / Dashboard", "Candidato", "Pipeline", "Candidatura", "Proposta", "Cliente" e "Qualidade") estão implementadas em `src/app`, com navegação lateral funcional.

- `src/data/figma-pages.ts`: estrutura, posições, cores e textos extraídos do Figma (gerado por `scripts/generate-figma-data.mjs` a partir de `figma-pages.json`).
- `src/data/real-data.ts`: textos e dimensões calculados a partir dos JSONs em `data/` (gerado por `scripts/generate-real-data.mjs`). É aplicado por id do nó em `src/components/FigmaFrame.tsx`.
- `src/data/placeholders.ts`: dados genéricos usados apenas como fallback. Para alterar os dados exibidos, prefira atualizar os JSONs em `data/` e rodar `node scripts/generate-real-data.mjs`.

Os arquivos em `data/` são: `candidatos.json`, `candidaturas.json`, `clientes.json`, `contratacoes.json`, `entrevistas.json`, `feedback_clientes.json`, `historico_vagas.json`, `interacoes.json`, `propostas.json`, `recrutadores.json` e `vagas.json`. O gerador usa 2025-12-31 como data de referência para os recortes temporais.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
