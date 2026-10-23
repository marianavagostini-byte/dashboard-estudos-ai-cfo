# Intercâmbio de progresso com ChatGPT e Copilot

## Fluxo ativo do catálogo e sessões v2

O Roadmap exibido pela aplicação usa `src/studyCatalog.ts`: fases, matérias, tópicos e subtópicos. DSA + LeetCode é uma trilha paralela. Os status permanecem em registros separados no IndexedDB v1; esta versão não executa migração de dados pessoais. A simulação em Configurações é somente leitura e o manifesto está em `mapeamento-migracao-v1-v2.json`.

Para trocar um estudo do ChatGPT com o dashboard, peça um JSON v2 seguindo `schemas/topic-session-v2.schema.json` e os IDs estáveis do catálogo. Valide localmente com `npm run session:validate -- integracao/entrada-chatgpt-v2.json`. Na aplicação, escolha o arquivo em Configurações, revise a prévia e marque a aprovação explícita para registrar. A importação é manual, idempotente por UUID e recusará IDs desconhecidos, conflitos de status esperado e datas inválidas. A sessão aprovada fica no histórico e no backup v1. Não há sincronização automática.

Os passos v1 abaixo são compatibilidade legada; continuam úteis para backups e sessões anteriores e não convertem etapas amplas em tópicos.

## Fonte oficial e limites

- O roadmap oficial deste projeto é o catálogo atual do Dashboard-Estudos em `src/learningRoadmap.ts`: 21 módulos e 84 etapas. O título completo do último módulo é **Construção prática do AI Personal CFO**.
- O progresso operacional é salvo no IndexedDB local do navegador (`dashboard-estudos`, stores `records` e `settings`). As etapas usam `roadmapStage` e `data.stageId`; seus status possíveis estão definidos em `src/studyData.ts`.
- O backup completo exportado pela aplicação é versionado v1 (`app: Dashboard-Estudos`), com `exportedAt`, configurações e registros/datas disponíveis.
- `integracao/estado-estudos.json` é um resumo de intercâmbio, não um backup v1 e não grava nem substitui o IndexedDB.
- ChatGPT e Copilot não acessam diretamente localhost, o perfil do navegador ou o IndexedDB. O intercâmbio é manual: exporte o backup e compartilhe o arquivo ou apenas os campos necessários.

## Fluxo seguro

1. Inicie o dashboard na raiz do projeto com `npm run dev` e abra exatamente a URL informada pelo Vite. Use o mesmo navegador/perfil e endereço (origem) em que estudou. `localhost` e `127.0.0.1` têm IndexedDBs separados, assim como portas diferentes.
2. Em **Configurações**, confira a origem e a quantidade de registros persistidos antes de exportar. Verifique também se o arquivo apareceu nos downloads. Um backup válido pode conter `records: []`; isso só confirma que nenhum registro foi exportado daquela origem naquele momento, não que outro endereço/perfil esteja vazio.
3. Preserve o backup original em local privado. Ele pode conter dados pessoais; não o adicione ao Git nem compartilhe além do necessário.
4. Use `exportedAt` como data/hora da exportação, não como data de conclusão de um tópico ou de uma sessão. O arquivo v1 mantém os registros e datas persistidos; compare `records.length` e os itens exportados com o número exibido no painel.
5. O catálogo das etapas é estático; apenas alterações de status salvas criam/atualizam registros `roadmapStage`. A interface mostra etapas sem registro como “Não iniciado” por padrão e identifica quantas etapas têm registro. Isso não recupera histórico ausente.
6. Para atualizar o resumo, use o catálogo e os IDs de `src/learningRoadmap.ts`. Confirme `data.stageId`, `data.status`, `data.completedAt` e `updatedAt` nos registros do backup. Se não houver backup que comprove o estado, mantenha `null`/pendente.
7. Não importe `estado-estudos.json` pela restauração do dashboard. Revise o backup v1 antes de importar. Mesclar adiciona IDs ainda não existentes e informa quantos foram ignorados; substituir troca registros e configurações. A aplicação recusa substituir por um backup sem registros.
8. Se o endereço habitual abrir sem progresso, não o substitua nem limpe os dados. Verifique no DevTools do navegador (**Application/Armazenamento → IndexedDB → `dashboard-estudos` → `records`**) cada origem/porta/perfil que você usou e exporte separadamente os dados encontrados. Não mova dados entre origens sem revisar o backup e escolher conscientemente a importação.
9. Mantenha o índice `integracao/HISTORICO-EXERCICIOS.md` separado do progresso de tópicos. Registre apenas exercícios realmente realizados e fatos verificáveis.

Para verificar localmente, execute `npm test`, `npm run lint` e `npm run build`. Os testes de persistência usam IndexedDB simulado em memória; não acessam o perfil real do navegador.

## Estrutura do JSON de intercâmbio

- `versao_esquema`: versão deste resumo, independente da versão v1 do backup.
- `catalogo_confirmado`: módulos, nomes e IDs das etapas derivados do código `src/learningRoadmap.ts`.
- `progresso_confirmado_pelo_dashboard`: estado conferido em backup atual. `null` e `pendente_de_confirmacao` significam desconhecido, não zero.
- `informacoes_confirmadas_pelo_usuario`: declarações confirmadas com a origem registrada.
- `relatos_anteriores_nao_mapeados`: dados históricos de outra estrutura mantidos como contexto, sem convertê-los em progresso da estrutura atual.
- `historico_exercicios`: referência ao índice separado; não conclui etapas.
- `pendencias_de_confirmacao`: informações que requerem backup ou confirmação.

As contagens de Python, POO, Git/GitHub, SQL, Web Fundamentals, DSA/LeetCode, Frontend e Backend foram informadas em contexto do roadmap antigo. Mesmo quando há um nome semelhante (por exemplo, SQL), as escalas antigas não equivalem às quatro etapas por módulo deste dashboard. Elas permanecem como relato sem correspondência comprovada. Não há no histórico consultável confirmação de uma sessão ou etapa de JavaScript em 20/10/2026.

## Segurança

Não acesse nem altere o perfil real do navegador ou o IndexedDB pessoal. Testes de interface devem usar uma origem isolada e dados fictícios. Não migre nem sobrescreva dados automaticamente e não versione backups pessoais, tokens, senhas ou chaves.

## Sessões do ChatGPT

O contrato v1 está em [`schemas/session.schema.json`](./schemas/session.schema.json). O exemplo [`entrada-chatgpt.exemplo.json`](./entrada-chatgpt.exemplo.json) é fictício e não deve ser importado como sessão real.

1. Peça ao ChatGPT um registro JSON v1 ao final da sessão e salve-o como `integracao/entrada-chatgpt.json`; esse arquivo é ignorado pelo Git para não publicar notas pessoais.
2. Execute `npm run session:validate -- integracao/entrada-chatgpt.json`. O comando valida o contrato e os IDs do roadmap sem gravar dados; não prova que a sessão já foi importada.
3. Acione o Copilot Agent com: **“Processe `integracao/entrada-chatgpt.json` seguindo `.github/copilot-instructions.md`. Primeiro verifique branch e `git status`; preserve alterações preexistentes. Valide a sessão, identifique seu `session_id`, crie apenas artefatos reais, execute e registre os testes observados, atualize o JSON com fatos verificáveis e revise o diff. Não altere progresso sem confirmação explícita e estado esperado. Se houver mudança real, segura e isolável, faça um commit somente dos arquivos dessa sessão; não faça push sem me pedir autorização nesta conversa.”**
4. O Agent deve parar sem criar commit quando houver alterações anteriores não relacionadas, testes falhos ou escopo ambíguo. Não use `git add .`/`-A`, não crie commit vazio e nunca inclua o arquivo de entrada, backups ou dados pessoais.
5. Revise o JSON atualizado, o diff e o commit (se houver). O estado `git` só pode conter branch, hash e resultado observados. Push exige autorização afirmativa nesta conversa; antes dele, confira destino, commits pendentes e ausência de alterações não relacionadas, e confirme o resultado real.
6. Para persistir a sessão no dashboard, importe manualmente o JSON revisado em **Configurações → Registrar sessão do ChatGPT**, no navegador e origem desejados. O dashboard verifica o `session_id`: duplicatas são recusadas. Atualizações de roadmap conflitantes são recusadas atomicamente e não sobrescrevem o estado. Só afirme que foi importada após observar a confirmação na interface.
7. Em Configurações, use **Baixar resumo de continuidade** e revise o arquivo antes de compartilhá-lo com a próxima conversa. O resumo reflete somente os dados da origem atual.

O histórico de sessões fica no IndexedDB e é incluído nos backups v1. O histórico de exercícios em `HISTORICO-EXERCICIOS.md` permanece separado; uma sessão ou commit não conclui etapas automaticamente.
