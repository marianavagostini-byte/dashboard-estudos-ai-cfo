# Continuidade e auditoria — 22/10/2026

## Escopo e segurança

- Pasta auditada: a pasta local do projeto (caminho omitido por privacidade).
- Branch inicial: `main`, sincronizado com `origin/main`; existiam várias alterações locais de integração ChatGPT/Copilot. Foram preservadas; não houve commit nem push.
- Nenhum perfil pessoal do navegador, IndexedDB real, backup pessoal ou outra pasta de projeto foi acessado; o teste visual usou uma origem isolada e registros fictícios.
- Antes das alterações, foi copiado o estado dos arquivos envolvidos para `.audit-backup-2026-10-22/`. Esse diretório é local, ignorado pelo Git, e contém também a build de validação. Não é backup do IndexedDB.

## Recuperação do progresso

- IDs confirmados pelo código no catálogo auditado: 21 módulos, 84 etapas. Os IDs das etapas são gerados como `<module-id>-<suffix>`; os módulos e etapas ativos estão em `src/learningRoadmap.ts`.
- Não havia diretório `recovery/` nem backup nativo v1 disponível para inspeção.
- `integracao/estado-estudos.json` classifica as contagens históricas de Python, POO, Git/GitHub, SQL, Web Fundamentals e DSA/LeetCode como relatos, sem mapeamento confirmado para as etapas atuais. O registro indica um backup v1 reportado como vazio, mas o arquivo original não está disponível para conferência independente.
- `src/historicalProgress.ts` continha registros construídos a partir desses relatos e atribuía etapas, notas e datas específicas sem correspondência inequívoca com um backup. A inicialização chamava uma função que os gravava no IndexedDB, e Configurações oferecia reaplicá-los. Esse comportamento foi removido; os dados reconstruídos não foram importados. O arquivo original está preservado na cópia local.
- Classificação atual: nenhum progresso confirmado por backup nativo acessível; os relatos acima continuam reconstruídos/não mapeados; a sessão de JavaScript e o estado real do IndexedDB permanecem pendentes. `null` continua significando desconhecido, não zero.

## Persistência e histórico

- A exportação usa transação IndexedDB `readonly`; exporta `records` e `settings`, sem criar stores ou escrever registros. A abertura normal do banco mantém o schema v1 e só cria stores em `onupgradeneeded`.
- `completedAt` agora permanece quando uma etapa regride de status. Ao concluir novamente, datas anteriores são preservadas em `completionHistory`, campo opcional compatível com o formato JSON v1. Histórico com estrutura inválida é recusado.
- O fluxo de importação continua validando app, versão, configurações, registros e IDs antes de gravar; substituir por backup vazio é recusado. Testes usam IndexedDB fictício em memória.
- A cópia `.audit-backup-2026-10-22/` preserva o estado anterior aos reparos. Ela contém código e não deve ser tratada como evidência de progresso pessoal.

## Catálogo e navegação

O catálogo observado tem um módulo extra `fundamentos` antes dos 20 módulos da especificação desejada. A navegação foi organizada nos cinco itens solicitados — Visão geral, Roadmap, Programação, Materiais e Configurações — e a biblioteca de materiais deduplica links por módulo. Não há seção Tutor; a nova tela de Materiais apenas organiza links estáticos e encaminha estudo, exercícios e correções às conversas.

A mudança de catálogo continua pendente: a base IndexedDB do usuário e um backup nativo não estão acessíveis, e registros de etapas antigas precisam continuar exportáveis e editáveis. Antes de remover `fundamentos` da trilha ativa, deve-se testar com fixtures v1 que todos os IDs e datas antigos sobrevivem e que registros sem módulo ativo continuam recuperáveis. O catálogo e o backup não devem ser alterados para converter automaticamente os relatos antigos em etapas.

## Arquivos locais desta auditoria

- Modificados: `src/App.tsx`, `src/StudyWorkspace.tsx`, `src/studyDatabase.ts`, `src/studyData.ts`, `tests/studyData.test.mjs`, `.gitignore`, `README.md`.
- Removido: `src/historicalProgress.ts` (conteúdo preservado na cópia de segurança; era exclusivamente o seed reconstruído não confiável).
- Criados: `docs/cloudflare-plan.md`, este relatório e `.audit-backup-2026-10-22/`.
- Não removidos registros, backups pessoais nem arquivos desconhecidos. Não houve importação ou escrita no IndexedDB do usuário.

## Verificações

- Estado inicial tinha dependências presentes em `node_modules`; Node `v24.20.0`, npm `12.2.0`.
- `npm.cmd test`: inicialmente falhou por uma importação relativa não resolvida pelo harness de módulos `data:`; após remover a dependência do seed, 34/34 testes passaram.
- `npm.cmd run lint`: código de saída 0.
- `npm.cmd run build`: TypeScript passou (`tsc -b`), mas a etapa Vite falhou ao limpar `dist/assets` com `EPERM`.
- `npm.cmd run build -- --outDir .audit-backup-2026-10-22\build-validation`: código de saída 0; build de produção criada em diretório isolado sem limpar o `dist` existente.
- A validação visual foi feita na origem isolada `http://127.0.0.1:41873/`: a navegação mostrou os cinco itens pedidos, e a tela Materiais listou 62 recursos únicos por módulo. Um registro fictício foi salvo nessa origem de teste e permaneceu visível após recarregar a página; nenhum dado pessoal foi carregado.
- `git diff --check` não reportou erro de whitespace; Git emitiu avisos de conversão LF/CRLF.

## Continuidade

O plano Cloudflare, com esquema proposto, autenticação, isolamento por usuário, sincronização aditiva, conflitos, backups, rollback, limites gratuitos e fontes oficiais atuais, está em `docs/cloudflare-plan.md`. Nenhum serviço foi provisionado. A exigência de cartão não é estabelecida nas páginas oficiais consultadas e deverá ser verificada antes de qualquer cadastro. O plano requer revisão humana antes de implementar sync ou migrar dados.
