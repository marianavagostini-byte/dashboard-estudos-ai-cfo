# Inventário inicial do currículo

Auditoria de `src/learningRoadmap.ts`, `src/studyData.ts` e da interface `src/StudyWorkspace.tsx` (2026-10-22). O catálogo contém 21 módulos e 84 etapas (quatro por módulo).

Cada etapa listada tem os mesmos campos de roadmap existentes: `id`, título, objetivo breve, atividade breve, pré-requisito por etapa e zero ou mais recursos externos. A linha de Fundamentos corresponde ao piloto implementado nesta entrega; as demais continuam sem aulas detalhadas.

| Módulo | IDs das quatro etapas | Já existe em cada etapa | Faltava antes do piloto (e continua faltando fora do piloto) |
|---|---|---|---|
| Fundamentos da programação | `fundamentos-compreender`, `fundamentos-guiada`, `fundamentos-independente`, `fundamentos-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Explicação, exemplos executáveis testados, passos guiados, exercícios com critérios, revisão e critérios de conclusão — agora cobertos por aulas associadas aos quatro IDs. |
| JavaScript | `javascript-compreender`, `javascript-guiada`, `javascript-independente`, `javascript-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos próprios, exercícios com critérios, revisão e conclusão. |
| Git e GitHub | `git-github-compreender`, `git-github-guiada`, `git-github-independente`, `git-github-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| HTML e CSS | `html-css-compreender`, `html-css-guiada`, `html-css-independente`, `html-css-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| TypeScript | `typescript-compreender`, `typescript-guiada`, `typescript-independente`, `typescript-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| React | `react-compreender`, `react-guiada`, `react-independente`, `react-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Vite e ferramentas de desenvolvimento | `vite-ferramentas-compreender`, `vite-ferramentas-guiada`, `vite-ferramentas-independente`, `vite-ferramentas-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Arquitetura de software | `arquitetura-compreender`, `arquitetura-guiada`, `arquitetura-independente`, `arquitetura-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Persistência e bancos de dados | `persistencia-compreender`, `persistencia-guiada`, `persistencia-independente`, `persistencia-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Testes | `testes-compreender`, `testes-guiada`, `testes-independente`, `testes-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Node.js | `node-compreender`, `node-guiada`, `node-independente`, `node-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| HTTP e APIs | `http-apis-compreender`, `http-apis-guiada`, `http-apis-independente`, `http-apis-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| SQL | `sql-compreender`, `sql-guiada`, `sql-independente`, `sql-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| ORM e validação de dados | `orm-validacao-compreender`, `orm-validacao-guiada`, `orm-validacao-independente`, `orm-validacao-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Backend | `backend-compreender`, `backend-guiada`, `backend-independente`, `backend-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Inteligência artificial | `inteligencia-artificial-compreender`, `inteligencia-artificial-guiada`, `inteligencia-artificial-independente`, `inteligencia-artificial-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Integrações | `integracoes-compreender`, `integracoes-guiada`, `integracoes-independente`, `integracoes-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Segurança | `seguranca-compreender`, `seguranca-guiada`, `seguranca-independente`, `seguranca-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Deploy e infraestrutura | `deploy-infraestrutura-compreender`, `deploy-infraestrutura-guiada`, `deploy-infraestrutura-independente`, `deploy-infraestrutura-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Engenharia de software com IA | `engenharia-com-ia-compreender`, `engenharia-com-ia-guiada`, `engenharia-com-ia-independente`, `engenharia-com-ia-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |
| Construção prática do AI Personal CFO | `ai-personal-cfo-compreender`, `ai-personal-cfo-guiada`, `ai-personal-cfo-independente`, `ai-personal-cfo-autonomia` | Objetivo, atividade, pré-requisito e recursos externos | Aula detalhada, exemplos, exercícios com critérios, revisão e conclusão. |

## Esquema e separação dos dados

O novo esquema TypeScript `StudyLesson` usa `schemaVersion: 1` e associa cada aula por `stageId` estável. O conteúdo fica em `src/studyCurriculum.ts` durante o piloto; a expansão deve mover cada módulo para seu próprio arquivo e manter um índice comum. O esquema cobre objetivos, pré-requisitos conceituais, explicação em seções, exemplos (código, saída e instrução de teste), prática guiada (passos e checkpoints), exercícios independentes (restrições e critérios), perguntas de revisão e critérios de conclusão.

O currículo é conteúdo estático do aplicativo: não é gravado no IndexedDB, não altera `StudyRecord` e não é incluído no backup v1. O progresso continua associado ao ID da etapa em seus registros existentes. Atualizar texto ou exemplos não exige migração e não apaga histórico. IDs de etapa existentes não devem ser renomeados.

## Produção e validação

Produzir um módulo por arquivo, revisar a progressão entre as quatro etapas e variar a tarefa cognitiva e os exemplos. Validar o esquema e a associação exata por IDs, executar os exemplos de programação em testes, verificar legibilidade e correção técnica, e executar testes de regressão de progresso e backup antes de cada módulo ser integrado. Os 20 módulos fora do piloto mantêm apenas os metadados resumidos e links externos atuais; esses links não são apresentados como aulas próprias.
