# TalentFlow · esboço de aplicação

Esboço visual do produto descrito em [`../analise/RELATORIO.md`](../analise/RELATORIO.md).
Não é uma aplicação funcional: é um artefacto de discussão com 7 ecrãs e um sistema visual.

```
design/
├── preview.html              → pré-visualização no browser (abrir diretamente)
├── figma-plugin/
│   ├── manifest.json         → manifesto para importar no Figma
│   └── code.js               → gera os 7 frames dentro do Figma
└── README.md
```

## Ver a pré-visualização

Abrir `design/preview.html` no browser. É um ficheiro autónomo (sem servidor, sem dependências):
cada ecrã aparece a 1440 × 1024, com scroll horizontal quando a janela é mais estreita.

## Gerar os frames no Figma

O plugin cria os ecrãs como frames editáveis (não imagens), com texto e auto-layout.

1. Abrir o Figma **Desktop** ou **Web** e criar/abrir um ficheiro.
2. Menu **Plugins → Development → Import plugin from manifest…**
3. Escolher `design/figma-plugin/manifest.json`.
4. Correr **Plugins → Development → TalentFlow — Recruitment Control Tower**.
5. O plugin cria uma página chamada `TalentFlow · Esboço` com 7 frames e faz zoom para os mostrar.

> A extensão Figma para VS Code é apenas um visualizador de ficheiros `.fig`: não executa plugins
> nem cria conteúdo no canvas. Para gerar os frames é preciso o Figma (desktop ou web).
> O antigo `design/app.pen` foi removido — o pen.dev estava bloqueado por limite de plano.

Cada execução acrescenta novos frames. Para repetir, apagar a página criada ou os frames antigos primeiro.

## Ecrãs

| # | Frame | Pergunta a que responde |
|---|-------|--------------------------|
| 00 | Capa e sistema | Que produto é, que módulos tem e com que linguagem visual? |
| 01 | Torre de Controlo | Onde está o processo parado e qual é a próxima ação? |
| 02 | Pipeline | Em que fase real está cada candidatura? |
| 03 | Candidatura | Porque está parada e o que desbloqueia? |
| 04 | Validação Salarial | A oferta respeita a banda e a expectativa? |
| 05 | Qualidade de Dados | Que anomalias impedem decisões de gestão? |
| 06 | Clientes | Que clientes estão em risco de perder talento? |

## Funcionalidades vs. relatório

- **Torre de Controlo** — fila ordenada por SLA, dias desde a última entrevista e próxima ação.
  Usa o ciclo médio de 40 dias, dos quais 27 são espera até à proposta (68%).
- **Pipeline** — kanban com fase derivada das entrevistas (a `etapa_atual` coincide apenas em 16,7%).
- **Candidatura** — percurso completo, alerta de SLA e banda salarial no contexto da decisão.
- **Validação Salarial** — oferta vs. banda vs. expectativa, com justificação obrigatória em exceção.
  Base: 207 propostas fora da banda (20,4%) e 32 substituições ≈ €146 mil.
- **Qualidade de Dados** — anomalias P0–P3 (V999 com 330 registos, 3 831 datas em dois formatos,
  533 scores acima de 100, 191 propostas respondidas após a contratação).
- **Clientes** — retenção a 90 dias, satisfação declarada, substituições e health score
  (CL09 com 62,5%, CL06 com 6/30 substituições, CL05 com 75%).
- **Copiloto** — deliberadamente fora do MVP: só depois de P0/P1 corrigidos.

## Sistema visual

- Tipografia **Inter**, tamanhos 10 / 11,5 / 13 / 14 / 18 / 24 / 28 / 40.
- Sidebar `#0B1220`, fundo `#F5F7FA`, superfícies brancas, bordas `#E2E8F0`.
- Primário `#2563EB` · sucesso `#16A34A` · atenção `#D97706` · risco `#DC2626` · info `#7C3AED`.
- Componentes: KPI, badge, botão, chip, tabela, cartão de tabela, kanban, banda salarial, timeline.

Os nomes de candidatos e os IDs de candidatura são exemplos ilustrativos; todos os agregados
(contagens, percentagens, custos) vêm do relatório.
