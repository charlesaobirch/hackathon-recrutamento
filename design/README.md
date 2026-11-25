# TalentFlow · esboço de aplicação

Protótipo funcional do produto descrito em [`../analise/RELATORIO.md`](../analise/RELATORIO.md).
O preview tem sete páginas navegáveis, pesquisa, filtros e interações locais de demonstração.

```
design/
├── preview.html              → pré-visualização no browser
├── preview.css               → estilos dos ecrãs (usa os tokens)
├── tokens.css                → fonte de verdade dos tokens (3 camadas)
├── tokens.json               → os mesmos tokens em formato DTCG
├── DESIGN.md                 → sistema: cor, tipografia, componentes, a11y
├── figma-plugin/
│   ├── manifest.json         → manifesto para importar no Figma
│   └── code.js               → gera os frames editáveis dentro do Figma
└── README.md
```

## Ver a pré-visualização

Abrir `design/preview.html` no browser. Não precisa de servidor nem de instalar nada,
mas mantém `preview.css` e `tokens.css` na mesma pasta: o HTML e o CSS dividem os tokens.
A navegação superior muda de página; a pesquisa e os filtros aplicam-se aos registos visíveis.
O layout adapta-se a desktop e ecrãs estreitos.

Os dados JSON usados na análise não estão incluídos no repositório. Os indicadores são
agregados exploratórios do relatório e não constituem reporting oficial. Pessoas, candidaturas,
eventos e estados individuais são fictícios. Alterações à fila de qualidade e ao plano de
clientes ficam no `localStorage` deste browser e não corrigem dados fonte nem enviam propostas.
Há uma divergência aritmética que fica assinalada no preview: 207 / 1 065 = 19,4%, enquanto
o relatório apresenta 20,4%; confirmar o denominador nos dados fonte antes de reutilizar a taxa.

## Gerar os frames no Figma

O plugin cria os ecrãs como frames editáveis (não imagens), com texto e auto-layout.

1. Abrir o Figma **Desktop** ou **Web** e criar/abrir um ficheiro.
2. Menu **Plugins → Development → Import plugin from manifest…**
3. Escolher `design/figma-plugin/manifest.json`.
4. Correr **Plugins → Development → TalentFlow — Recruitment Control Tower**.
5. O plugin cria uma página chamada `TalentFlow · Esboço` com 7 frames e faz zoom para os mostrar.

O preview HTML inclui também a nova fila de propostas; o plugin Figma continua, por enquanto,
com os 7 frames anteriores.

> A extensão Figma para VS Code é apenas um visualizador de ficheiros `.fig`: não executa plugins
> nem cria conteúdo no canvas. Para gerar os frames é preciso o Figma (desktop ou web).
> O antigo `design/app.pen` foi removido — o pen.dev estava bloqueado por limite de plano.

Cada execução acrescenta novos frames. Para repetir, apagar a página criada ou os frames antigos primeiro.

## Ecrãs

| Página | Pergunta a que responde |
|---|---|
| Visão geral | Quais são os agregados do funil e as próximas ações demonstrativas? |
| Pipeline | Como evoluem os volumes e conversões por etapa? |
| Candidatura | Qual é o percurso de demonstração, o tempo parado e o estado do SLA? |
| Propostas | Que exceções salariais e temporais precisam de revisão? |
| Validação Salarial | A oferta respeita a banda e a expectativa? |
| Qualidade | Que anomalias bloqueiam reporting oficial? |
| Clientes | Como se comparam retenção, desempenho e substituições? |

## Interações e origem dos valores

- **Visão geral** — agregados documentados; só a linha fictícia de Inês tem detalhe navegável,
  enquanto as restantes linhas são exemplos sem registo correspondente.
- **Pipeline** — conversões calculadas entre volumes publicados no relatório. As medianas de cada
  segmento são independentes e podem não somar à mediana global de 40 dias.
- **Candidatura** — cronologia ordenada e tempo desde a última ação do caso fictício.
- **Propostas** — filtros por exceção e estado; os registos agregados não são candidaturas.
- **Validação Salarial** — oferta, banda e expectativa editáveis; alertas e regras atualizam-se
  em tempo real. O envio só fica disponível dentro das regras ou com justificação e aprovação
  registadas na demonstração.
- **Qualidade** — lista deduplicada de 19 anomalias únicas (o relatório repete uma incoerência
  temporal); filtra por P0–P3 e workflow. P0 mantém os relatórios oficiais bloqueados até a fonte
  ser corrigida e validada.
- **Clientes** — comparação por retenção, desempenho e substituições; plano 30/60/90 com
  satisfação apenas como contexto.
- **Copiloto** — deliberadamente fora do MVP: só depois de P0/P1 corrigidos.

## Sistema visual

Os valores vivem em [`tokens.css`](tokens.css), em três camadas (primitiva → semântica →
componente); [`DESIGN.md`](DESIGN.md) documenta o racional e os estados de cada componente.
O plugin Figma replica os mesmos valores em código.

- Tipografia: **Bricolage Grotesque** em títulos e KPIs; **Instrument Sans** na interface.
  Texto nunca abaixo de 12 px; tabelas a 13 px, cabeçalhos a 12 px sem maiúsculas e
  números tabulares alinhados à direita.
- Shell grafite, tela marfim, superfícies claras, navegação superior em cápsulas e aba ativa com ligação curva à página.
- Ação/seleção lima `#C9F522` · sucesso `#15803D` · atenção `#B45309` · risco `#B91C1C` · informação `#1D4ED8`.
- Sem navegação inferior; texto sobre cartões escuros usa variantes de alto contraste.
- Componentes: KPI, badge, botão, chip, tabela, percurso por etapas, banda salarial, timeline.
- Acessibilidade: contraste AA, `:focus-visible`, seleção e scrollbar tematizados,
  `prefers-reduced-motion`; a cor nunca é o único sinal de SLA.

### Skills aplicadas

O esboço foi revisto com as skills importadas da branch `main`:

- **`design-system`** — arquitetura de tokens em três camadas e especificação de componentes.
- **`impeccable`** — revisão de craft: hierarquia, tipografia, contraste, estados, cópia e
  remoção de padrões genéricos (eyebrows, números de secção, métricas-herói, halo radial).

As skills estão em `.agents/skills/design-system/` e `.agents/skills/impeccable/`;
o resultado aplicado está em `preview.html`, `preview.css`, `tokens.css` e nesta documentação.

Os dados fonte não estão incluídos. Os nomes, IDs e estados de candidaturas são fictícios;
os agregados e anomalias vêm do relatório exploratório e devem ser validados antes de uso
operacional.
