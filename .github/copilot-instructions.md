# Instruções para GitHub Copilot Agent Mode

## Fonte de progresso e contexto

- Dashboard-Estudos é a fonte oficial do progresso. O estado operacional fica no IndexedDB local do navegador; o resumo de intercâmbio é gerado localmente pela interface (Configurações) e o backup completo segue o formato v1 exportado pela aplicação.
- Não acesse localhost, perfis do navegador ou IndexedDB tentando obter os dados do usuário. Solicite um backup exportado ou contexto compartilhado explicitamente.
- Leia o resumo de intercâmbio compartilhado pelo usuário, `integracao/COMO-USAR.md` e `integracao/PROTOCOLO-CHATGPT.md` antes de preparar sincronizações. Diferencie dados confirmados pelo dashboard, informações confirmadas pelo usuário e pendências. `null` significa desconhecido, nunca zero.
- Não use o antigo Estudos-Roadmap nem seus badges/contagens estáticas como fonte oficial do progresso atual. Não migre ou traduza progresso entre os sistemas.
- Preserve os registros em `integracao/HISTORICO-EXERCICIOS.md`. Adicione somente exercícios realmente realizados e fatos verificáveis; gerar código ou obter testes aprovados não conclui um tópico.
- Priorize fundamentos de programação e engenharia de software; siga o tópico confirmado, o nível e os pré-requisitos. Se faltarem dados ou houver conflito, pare e solicite contexto em vez de escolher um assunto por suposição.

## Protocolo para exercícios

1. Verifique `git status --short --branch` e a branch antes de começar. Se houver alterações anteriores não relacionadas, não as misture, descarte nem faça stage; informe e peça orientação.
2. Confirme o tópico no estado de integração/backup atual fornecido pelo usuário e confira exercícios recentes. Não repita sem motivo pedagógico.
3. Prefira um exercício por vez, com objetivo, requisitos e critérios de aceitação claros. Se escopo ou assunto não estiver confirmado, pergunte antes de implementar.
4. Siga a organização existente, produza código adequado ao nível e inclua testes/verificações pertinentes. Execute-os e informe comandos/resultados observados. Não invente evidências.
5. Se os testes falharem ou o escopo estiver misturado, não faça commit. Revise o diff e faça stage somente dos arquivos do exercício por caminhos explícitos. Nunca use `git add .` ou `git add -A`.
6. Crie exatamente um commit por exercício real validado, com mensagem descritiva. Não inclua configuração, estado do roadmap, histórico ou outros exercícios no commit.
7. Depois do commit, confira hash, arquivos e status. Informe assunto confirmado, exercício, arquivos, testes, hash e estado do push.

## Push e preservação

- Nunca faça push sem autorização afirmativa explícita nesta conversa. Ao concluir um exercício, pergunte e aguarde autorização; a autorização não é permanente.
- Antes de push autorizado, confira branch de destino, commits pendentes e alterações não relacionadas. Não force push, reescreva histórico ou descarte mudanças sem consultar.
- Não importe, migre ou substitua dados do IndexedDB automaticamente. O JSON-resumo não é backup restaurável. Antes de qualquer restauração, preserve o backup e informe que mesclagem ignora IDs existentes e substituição troca dados locais.
- Nunca versionar backups pessoais, tokens, senhas ou chaves de API.

## Processamento de sessões ChatGPT

- A transferência é manual: quando o usuário fornecer `integracao/entrada-chatgpt.json`, execute `npm run session:validate -- integracao/entrada-chatgpt.json` e confira o contrato descrito em `integracao/PROTOCOLO-CHATGPT.md` e `integracao/schemas/session.schema.json`. A entrada é ignorada pelo Git e não deve ser incluída em commits.
- Confirme `schema_version`, UUID, timestamp com fuso, IDs de módulo/etapa existentes, campos desconhecidos, caminhos de artefatos e o estado esperado em cada atualização. Se houver conflito ou informação incompleta, não grave o progresso; explique o conflito e preserve o arquivo de entrada.
- Separe conteúdo explicado, praticado, exercícios tentados/resolvidos, testes observados e atualizações de roadmap. Um exercício gerado, teste aprovado ou commit não conclui etapa. Atualizações do roadmap exigem confirmação explícita do usuário, justificativa e `expected_status` igual ao estado persistido.
- Crie artefatos apenas quando forem resultado real e útil da sessão. Execute verificações pertinentes e atualize `artifacts` e `tests` no JSON com resultados observados. Não invente duração, teste, commit ou resultado de push.
- O histórico de sessões e o progresso são persistidos no IndexedDB pelo importador da aplicação em Configurações. Após revisar o JSON final, o usuário importa a sessão no dashboard; não acesse nem edite o IndexedDB fora da aplicação.
- Se houver artefatos reais e testes aprovados, faça stage somente dos caminhos relacionados àquela sessão e crie um commit descritivo. Nunca inclua `integracao/entrada-chatgpt.json`, backups, estado pessoal, arquivos de configuração não relacionados ou arquivos de outros exercícios.
- Push só é autorizado quando o usuário acionar o processamento e pedir publicação nessa conversa. Essa autorização vale apenas para a sessão atual. Verifique branch, remote, commits pendentes, autenticação e ausência de alterações não relacionadas; não force push. Se o push falhar, registre o commit e o bloqueio sem alegar publicação.
- Não há processamento agendado nem ligação direta ChatGPT↔VS Code. O fluxo só ocorre quando o usuário transfere o JSON e aciona o Agent. Depois do commit/push, atualize os campos `git` no JSON de entrada e peça ao usuário que importe a sessão no Dashboard para salvar o histórico e o hash.
- Após importar uma sessão, o usuário pode baixar `CONTEXTO-ATUAL.md` na tela Configurações. Esse resumo contém dados do navegador atual e só chega ao ChatGPT se for compartilhado manualmente.
