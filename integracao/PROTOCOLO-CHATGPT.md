# Protocolo de intercâmbio de progresso

O catálogo ativo do Dashboard-Estudos é `src/studyCatalog.ts`, organizado por fase, matéria, tópico e subtópico. O progresso operacional permanece no IndexedDB do navegador. `integracao/estado-estudos.json` é um snapshot histórico v1 e não é atualizado nem importado automaticamente.

## Contrato de sessão v1 e transferência

O contrato v1 legado está em [`schemas/session.schema.json`](./schemas/session.schema.json). O protocolo ativo por tópicos está em [`schemas/topic-session-v2.schema.json`](./schemas/topic-session-v2.schema.json), com exemplo fictício em [`entrada-chatgpt-v2.exemplo.json`](./entrada-chatgpt-v2.exemplo.json). O validador confere os IDs atuais de matéria/tópico em `src/studyCatalog.ts`.

### Contrato ativo v2

Cada arquivo de sessão v2 inclui `session_id` UUID, data ISO 8601 com fuso explícito, `source` e `topic_updates` com `subject_id`, `topic_id`, `expected_status`, `proposed_status` e justificativa. Um exercício é opcional e só pode registrar resultado se `attempted` for verdadeiro. IDs desconhecidos, associação matéria/tópico incompatível, datas impossíveis, status inválidos e IDs duplicados são recusados antes da gravação.

A importação é manual. O dashboard valida o arquivo e mostra a prévia com origem, data, tópicos, status atual esperado, status proposto e exercício. O progresso só é alterado depois da caixa de aprovação explícita. A gravação verifica novamente os status esperados dentro da transação, recusa conflitos e IDs de sessão repetidos, registra a sessão aceita como histórico e atualiza os tópicos aprovados na mesma transação. Não há sincronização automática ou em tempo real.

Os registros v1 do tipo `session` e as etapas legadas permanecem válidos em backups e não são convertidos para tópicos novos. Sessões v1 continuam no fluxo de importação legado; sessões antigas não dão status a matérias ou tópicos novos.

Para uma sessão real, o ChatGPT produz um objeto JSON com:

- `schema_version`: `1`; `session_id`: UUID único usado para impedir reimportação; `date`: ISO 8601 com fuso explícito; `source`; `duration_minutes` ou `null`.
- `modules`: IDs reais e assuntos em `topics_studied`, cada um distinguindo `explained` e `practiced`.
- `exercises`: enunciado, se foi tentado/resolvido, correção/solução e resultado observados. Exercício apenas proposto deve ter `attempted: false`, `resolved: false`, resultado e solução `null`.
- `artifacts`: somente arquivos que existem de verdade, com caminho relativo e descrição.
- `tests`: comando e resultado observado (`passed`, `failed` ou `not_run`); não declare execuções que não ocorreram.
- `roadmap_updates`: opcional. Cada entrada exige `stage_id` real, `expected_status` igual ao valor salvo (ou `null` somente quando nenhum registro existe), novo `status`, justificativa e `confirmed_by_user: true`. A conclusão nunca é inferida de conversa, exercício, teste ou commit.
- `next_steps`, `notes` e `git`: próximos passos/contexto confirmado e estado real de branch, hash e push.

Campos extras são rejeitados para evitar erros de versão. Não ponha segredos, dados sensíveis nem caminhos absolutos no registro.

## Acesso e evidências

- Não presuma acesso ao localhost, navegador, perfil, IndexedDB, arquivos externos ao workspace ou histórico completo de conversas.
- Peça ao usuário que exporte um backup v1 do Dashboard-Estudos ou compartilhe somente os campos necessários. Trate o backup como potencialmente pessoal.
- Um backup com `records: []` é evidência apenas do conteúdo consultado naquela origem e momento; não conclua que os dados estejam perdidos nem recomende substituir dados locais por ele.
- Use registros `roadmapStage` e seus `data.stageId`/`data.status` para confirmar etapas. Preserve IDs/datas existentes e relate `completedAt`/`updatedAt` somente quando constarem da fonte.
- `src/learningRoadmap.ts` é o catálogo histórico v1, mantido para validar sessões e dados antigos. O catálogo ativo por fases e matérias está em `src/studyCatalog.ts`; use seus IDs estáveis no contrato v2.
- Não há evidência confirmada nas conversas consultáveis de uma sessão ou progresso JavaScript em 20/10/2026. Não invente essa sessão. As contagens antigas de cursos são relatos do usuário, não registros importados do dashboard atual.

## Atualização do intercâmbio

1. Preserve as chaves e os tipos de `integracao/estado-estudos.json`. `versao_esquema` é a versão do resumo, distinta da versão 1 do backup.
2. Preserve `integracao/estado-estudos.json` como snapshot anterior. Não o reescreva como se fosse estado v2 nem converta suas contagens históricas em progresso do novo catálogo.
3. Preencha progresso por módulo/etapa somente a partir de um backup atual ou confirmação explícita. `null` significa desconhecido, não zero ou “não iniciado”.
4. Registre fatos fornecidos pelo usuário em `informacoes_confirmadas_pelo_usuario`, com origem. Guarde relatos antigos em `relatos_anteriores_nao_mapeados`, incluindo a ressalva de confiança; não os converta em contagens de etapas.
5. Só identifique tópico atual/próximo quando dados atuais e a regra de recomendação do dashboard sustentarem a escolha. Havendo conflito, pare e pergunte.
6. Não trate o JSON como arquivo restaurável, não grave-o no IndexedDB e não importe, migre ou substitua dados sem uma solicitação explícita e revisão do usuário.
7. Preserve `integracao/HISTORICO-EXERCICIOS.md`; acrescente apenas exercícios realmente realizados e fatos verificáveis. Um exercício produzido ou testado não conclui uma etapa.
8. Nunca inclua tokens, senhas, chaves, credenciais ou um backup pessoal completo em arquivos versionados.

## Diagnóstico e recuperação de backups

- Inicie localmente com `npm run dev` e use a URL exata do Vite. `localhost`, `127.0.0.1`, portas e perfis diferentes possuem armazenamento independente.
- Antes de exportar, confira no painel de Configurações a origem e a quantidade de registros; depois confira `records.length` no JSON baixado. As etapas do catálogo não são registros persistidos automaticamente.
- Para procurar dados de outra origem, peça ao usuário para verificar cada origem usada no DevTools do navegador em **Application/Armazenamento → IndexedDB → `dashboard-estudos` → `records`**, sem limpar nem editar a store. Preserve cada backup encontrado e revise-o antes de importar.
- Importe apenas backups v1 validados. Prefira mesclagem para preservar IDs locais; substituição exige confirmação e um backup com registros vazio é recusado. Erros de validação ou transação não devem ser apresentados como sucesso.
- Os testes automatizados usam IndexedDB fictício em memória. Execute `npm test`, `npm run lint` e `npm run build`; nenhum teste deve abrir o armazenamento pessoal do navegador.

## Passos de uma sessão

1. Ao final do estudo, peça ao ChatGPT o JSON v1 com fatos da sessão; salve-o localmente como `integracao/entrada-chatgpt.json`. Esse arquivo é ignorado pelo Git e não é enviado automaticamente ao Agent.
2. Valide sem escrever usando `npm run session:validate -- integracao/entrada-chatgpt.json`. No VS Code, acione o Copilot Agent explicitamente para processar a sessão. O Agent cria somente artefatos pertinentes, roda verificações e registra no próprio JSON apenas os resultados realmente observados.
3. Se houver alterações úteis e testes aprovados, o Agent pode criar um commit específico. Push só ocorre se o usuário pedir publicação nessa conversa; não existe agendamento nem autorização permanente. Sem artefato técnico real, não há commit vazio.
4. Revise o JSON final e importe-o em **Configurações → Registrar sessão do ChatGPT** no navegador/origem que deve guardar o progresso. A aplicação grava o histórico e as atualizações confirmadas na mesma transação; IDs de sessão repetidos e conflitos de estado são recusados.
5. Baixe **Resumo de continuidade** em Configurações e compartilhe-o explicitamente na próxima conversa. Ele é específico à origem atual e pode conter dados pessoais.

O importador mantém as sessões no store `records` como tipo `session`, incluídas nos backups v1. Atualizações de etapa usam os mesmos IDs estáveis e a persistência normal do dashboard. A ausência de registro continua distinta de status salvo. A importação não grava automaticamente em arquivos do repositório nem envia dados ao ChatGPT.

Ao responder, separe fatos confirmados pelo dashboard, informações confirmadas pelo usuário e pendências. Informe a fonte consultada e não afirme acesso direto ao armazenamento do navegador.
