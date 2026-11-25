# TalentFlow · sistema de design

Documento de apoio ao esboço em [`preview.html`](preview.html) e ao plugin Figma.
A fonte de verdade dos valores é [`tokens.css`](tokens.css); [`tokens.json`](tokens.json)
expõe os mesmos tokens em formato DTCG para handoff.

## Modo e direção

O produto é uma ferramenta operacional: o utilizador precisa de varrer, decidir e agir.
Por isso o modo é **Operate**: densidade, consistência e precisão acima de expressão.
O único momento editorial é a capa, que enuncia o diagnóstico; os ecrãs seguintes são
deliberadamente sóbrios.

Direção visual: "sala de controlo", não "dashboard genérico". Fundo escuro na apresentação,
superfícies claras na aplicação, azul como único acento de ação e semáforo reservado a risco.
Sem gradientes em texto, sem ícones emoji, sem cartões dentro de cartões.

## Tokens em três camadas

```
primitiva  →  semântica  →  componente
#2563EB       --color-accent   --button-bg-primary
```

- **Primitivas** — valores crus (`--primitive-blue-600`, `--primitive-slate-200`).
  Nunca usadas diretamente nos componentes.
- **Semânticas** — propósito (`--color-bg-surface`, `--color-fg-secondary`,
  `--color-danger`, `--space-4`). É a camada que os ecrãs usam.
- **Componente** — decisões locais (`--button-bg-primary`, `--table-row-height`,
  `--nav-item-bg-active`). Permitem afinar um componente sem tocar no resto.

### Cor

| Papel | Token | Valor |
|---|---|---|
| Ação | `--color-accent` | `#2563EB` |
| Ação (hover) | `--color-accent-hover` | `#1D4ED8` |
| Sucesso | `--color-success` | `#15803D` |
| Atenção | `--color-warning` | `#B45309` |
| Risco | `--color-danger` | `#B91C1C` |
| Informação | `--color-info` | `#1D4ED8` |
| Texto principal | `--color-fg-primary` | `#0F172A` |
| Texto secundário | `--color-fg-secondary` | `#475569` |
| Texto de apoio | `--color-fg-muted` | `#64748B` |
| Superfície | `--color-bg-surface` | `#FFFFFF` |
| Fundo | `--color-bg-canvas` | `#F5F7FA` |
| Sidebar | `--color-bg-inverse` | `#0B1220` |

Regras: texto de apoio nunca abaixo de `#64748B` sobre branco; sobre fundo escuro usar
`--color-fg-on-inverse-muted` (`#94A3B8`). O semáforo só aparece em badges, pontos de sinal
e séries de tempo — nunca como cor de marca.

### Tipografia

Inter, com escala fixa e números tabulares em dados.

| Token | px | Uso |
|---|---|---|
| `--text-3xl` | 40 | título da capa |
| `--text-2xl` | 28 | valor de KPI |
| `--text-xl` | 24 | título de ecrã |
| `--text-lg` | 18 | valor secundário, módulo |
| `--text-md` | 14 | título de cartão |
| `--text-base` | 13 | corpo e tabelas |
| `--text-sm` | 12 | metadados, botões |
| `--text-xs` | 11 | etiquetas, notas |
| `--text-2xs` | 10 | cabeçalhos de tabela, legendas |

Pesos: 400 corpo, 500 dados, 600 ênfase, 700 títulos e valores.
`letter-spacing` mínimo de `-0.03em`; valores e colunas numéricas usam
`font-variant-numeric: tabular-nums`.

Inter mantém-se deliberadamente: é a face do sistema existente, garante paridade com o
plugin Figma e privilegia familiaridade numa ferramenta de uso diário. A personalidade vem
da composição, da densidade e do tratamento de dados, não de uma face de display.

### Espaço, forma e movimento

- Escala de 4 px: `--space-1` (4) a `--space-10` (40). Cartões usam 14–16 px de padding;
  secções 16–24 px.
- Raios: 8 px (controlos), 10 px (cartões pequenos), 14 px (cartões), 18 px (moldura).
- Profundidade: uma só declaração por superfície. Dentro da aplicação, borda de 1 px;
  sombra apenas na moldura de apresentação.
- Movimento: 140 ms, `cubic-bezier(0.16, 1, 0.3, 1)`, só em cor e borda.
  `prefers-reduced-motion` desliga transições.

## Componentes

| Componente | Especificação | Estados |
|---|---|---|
| Botão | 38 px, raio 8, 12 px semibold | default, hover, focus-visible, disabled |
| Badge | 22 px, pill, 10 px semibold | tons danger/warning/success/info/neutral/violet |
| KPI | cartão 14, label 11, valor 28 tabular, nota 10 | leitura apenas |
| Tabela | header 38 px, linha 54 px, hover `#F8FAFC` | hover, foco de linha |
| Chip de filtro | 32 px, pill | default, hover, ativo |
| Kanban | coluna `#EEF2F7`, cartão 120 px, raio 10 | hover, alerta por SLA |
| Banda salarial | trilho 10 px + marcadores de oferta/expectativa | dentro / fora da banda |
| Timeline | marco 24 px, linha 2 px, estado de bloqueio a vermelho | concluído, atual, bloqueado |

Novos componentes devem referenciar tokens semânticos ou de componente; valores hex soltos
só são aceitáveis dentro de `tokens.css`.

## Acessibilidade

- Contraste mínimo 4,5:1 para texto normal e 3:1 para texto grande. Os pares de badge usam
  as variantes 700/800 sobre as variantes 100.
- `:focus-visible` com anel de 2 px e offset de 2 px em todos os controlos.
- Seleção de texto, caret e barras de scroll tematizados; nada fica com o aspeto por omissão
  do browser.
- Números em tabelas e KPIs são tabulares para comparação vertical.
- A cor nunca é o único sinal: SLA tem sempre texto ("+6 d", "No prazo") além da cor.

## Origem e limites

Números e regras vêm de [`../analise/RELATORIO.md`](../analise/RELATORIO.md). Nomes de
candidatos e IDs de candidatura são ilustrativos. O sistema foi desenhado com as skills
`design-system` (arquitetura de tokens) e `impeccable` (revisão de craft, hierarquia,
contraste e estados); o plugin Figma replica os mesmos tokens em código.
