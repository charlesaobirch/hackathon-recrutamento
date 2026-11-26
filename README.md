# TalentFlow

Aplicação demonstrativa de recrutamento baseada no sistema visual documentado em [`design/preview.html`](design/preview.html) e na análise em [`analise/RELATORIO.md`](analise/RELATORIO.md).

## Iniciar

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Páginas

- `/` — torre de controlo e prioridades.
- `/pipeline` — percurso por etapas, volumes, conversões e espera.
- `/candidaturas` — pesquisa paginada em todas as 5 962 candidaturas.
- `/candidaturas/AP…` — candidatura e todos os seus registos relacionados.
- `/propostas` — todas as 1 065 propostas.
- `/propostas/PR…` — comparação editável entre oferta, banda e expectativa dos dados ligados.
- `/propostas/validar` — orienta para escolher uma proposta; a validação começa no registo selecionado.
- `/clientes` — retenção, desempenho, substituições e todos os clientes.
- `/qualidade` — anomalias prioritárias e estado local de demonstração.
- `/dados` — explorador dos 11 ficheiros JSON, com pesquisa e paginação por tabela.

Todas as páginas partilham a moldura grafite, o canvas marfim e a navegação superior com aba ativa ligada à página. A navegação principal tem cinco entradas; Candidaturas, Clientes e Dados completos ficam agrupados em “Mais”. Em ecrãs pequenos, a navegação desloca-se horizontalmente; não existe navbar inferior.

## Dados e limites

Os 11 ficheiros JSON originais estão em [`src/data/source/`](src/data/source/): candidatos, candidaturas, clientes, contratações, entrevistas, feedback de clientes, histórico de vagas, interações, propostas, recrutadores e vagas. A aplicação não precisa do ZIP nem da pasta Desktop para iniciar.

O explorador lê os ficheiros no servidor e devolve apenas a página pedida (10, 25, 50 ou 100 registos); a pesquisa percorre todos os campos da tabela escolhida. Os 79 963 registos dos 11 ficheiros estão disponíveis, sem alteração dos originais, incluindo as 267 linhas de contratações (com duplicados) e outros valores inconsistentes. As métricas agregadas do dashboard continuam a vir do relatório exploratório e não constituem reporting oficial. O verificador salarial e os estados da fila de qualidade são locais à interface.
