# TalentFlow · sistema de design

Documento de apoio ao esboço em [`preview.html`](preview.html) e ao plugin Figma.
A fonte de verdade dos valores é [`tokens.css`](tokens.css); [`tokens.json`](tokens.json)
expõe os mesmos tokens em formato DTCG para handoff.

## Modo e direção

O produto é uma ferramenta operacional: o utilizador precisa de varrer, decidir e agir.
Por isso o modo é **Operate**: densidade, consistência e precisão acima de expressão.
O único momento editorial é a capa, que enuncia o diagnóstico; os ecrãs seguintes são
deliberadamente sóbrios.

Direção visual: a moldura grafite e a tela marfim da referência aprovada, com navegação
superior em cápsulas e separador ativo ligado à tela por abas curvas, como uma pasta. A lima
identifica seleção e ação; o semáforo continua reservado aos estados operacionais. O conteúdo
mantém a densidade de uma ferramenta de recrutamento: tabelas, timelines e ações junto dos
registos. Não existe navegação inferior.

## Tokens em três camadas

```
primitiva  →  semântica  →  componente
#C9F522       --color-accent   --button-bg-primary
```

- **Primitivas** — valores crus (`--primitive-blue-600`, `--primitive-slate-200`).
  Nunca usadas diretamente nos componentes.
- **Semânticas** — propósito (`--color-bg-surface`, `--color-fg-secondary`,
  `--color-danger`, `--space-4`). É a camada que os ecrãs usam.
- **Componente** — decisões locais (`--button-bg-primary`, `--table-row-height`,
  `--nav-item-bg-active`). Permitem afinar um componente sem tocar no resto.

## Colors / Cor

| Papel | Token | Valor |
|---|---|---|
| Ação e seleção | `--color-accent` | `#C9F522` |
| Ação (hover) | `--color-accent-hover` | `#B6DF18` |
| Fundo da aplicação | `--color-bg-canvas` | `#E6E5DC` |
| Superfície | `--color-bg-surface` | `#F8F8F2` |
| Shell | `--color-bg-inverse` | `#292B26` |
| Texto de ação sobre superfície clara | `--color-fg-accent` | `#526412` |
| Sucesso | `--color-success` | `#15803D` |
| Atenção | `--color-warning` | `#B45309` |
| Risco | `--color-danger` | `#B91C1C` |
| Informação | `--color-info` | `#1D4ED8` |
| Texto principal | `--color-fg-primary` | `#292B26` |
| Texto secundário | `--color-fg-secondary` | `#67695F` |
| Texto de apoio | `--color-fg-muted` | `#77796F` |

Regras: texto de apoio mantém contraste AA sobre marfim; sobre fundo escuro usar
`--color-fg-on-inverse-muted` (`#E1E2D9`). O semáforo só aparece em badges, pontos de sinal
e séries de tempo — nunca como cor de marca.

## Typography / Tipografia

Instrument Sans para leitura da interface e Bricolage Grotesque para títulos e KPIs.
Texto nunca abaixo de 12 px; tabelas a 13 px e cabeçalhos a 12 px, sem caixa alta.
Os valores e as colunas numéricas usam algarismos tabulares e alinhamento à direita.

| Token | px | Uso |
|---|---|---|
| `--text-3xl` | 40 | título da capa |
| `--text-2xl` | 28 | valor de KPI |
| `--text-xl` | 24 | título de ecrã |
| `--text-lg` | 18 | valor secundário, módulo |
| `--text-md` | 15 | título de cartão |
| `--text-base` | 15 | corpo da interface |
| `--text-sm` | 12 | metadados e botões |
| `--text-xs` | 12 | etiquetas e notas |
| `--text-2xs` | 12 | cabeçalhos e legendas |

Pesos: 400 corpo, 500 dados, 600 ênfase, 700 títulos e valores.
`letter-spacing` mínimo de `-0.03em`; valores e colunas numéricas usam
`font-variant-numeric: tabular-nums`.

Bricolage Grotesque dá personalidade aos títulos e KPIs; Instrument Sans preserva a
legibilidade em navegação, filtros e tabelas densas.

### Espaço, forma e movimento

- Escala de 4 px: `--space-1` (4) a `--space-10` (40). Cartões usam 14–16 px de padding;
  secções 16–24 px.
- Raios: 8 px (campos), 10 px (cartões compactos), 20 px (cartões), 18 px (abas),
  42 px (moldura exterior).
- Profundidade: uma só declaração por superfície. Dentro da aplicação, borda de 1 px;
  sombra apenas na moldura de apresentação.
- Movimento: 140 ms, `cubic-bezier(0.16, 1, 0.3, 1)`, só em cor e borda.
  `prefers-reduced-motion` desliga transições.

## Components / Componentes

| Componente | Especificação | Estados |
|---|---|---|
| Botão | 38 px, formato cápsula, 12 px semibold | default, hover, focus-visible, disabled |
| Badge | 22 px, pill, 10 px semibold | tons danger/warning/success/info/neutral |
| KPI | cartão 20, label 11, valor 28 tabular, nota 10 | leitura apenas |
| Tabela | header 38 px, linha 54 px, hover `--color-bg-subtle` | hover, foco de linha |
| Navegação superior | cápsulas sobre shell grafite; a aba ativa usa fundo da tela e abas curvas laterais | default, hover, ativo |
| Chip de filtro | 32 px, pill | default, hover, ativo |
| Pipeline | linha de etapas, marcadores de conversão, cartões de candidatura ligados ao percurso | fase derivada, etapa com alerta |
| Banda salarial | trilho 10 px + marcadores de oferta/expectativa | dentro / fora da banda |
| Timeline | marco 24 px, linha 2 px, estado de bloqueio a vermelho | concluído, atual, bloqueado |

Moldura com raio 42 px, tela marfim e superfícies claras com raio 20 px. O cartão escuro é
reservado ao painel de tokens; o texto e os badges nesse cartão usam variantes com contraste
alto. Novos componentes devem referenciar tokens semânticos ou de componente; valores hex
soltos só são aceitáveis dentro de `tokens.css`.

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
