# Integração ChatGPT ↔ Dashboard

## Estado atual
- **Transferência é manual.** Não há processamento agendado nem conexão direta entre ChatGPT e o dashboard. A integração ocorre quando o usuário transfere um JSON e aciona o processamento.
- **Validação local.** `npm run session:validate -- <arquivo>` valida v1 ou v2 sem alterar dados.
- **Persistência.** O importador da aplicação (Configurações → Importar sessão) grava no IndexedDB local. O agente não acessa nem edita o IndexedDB.
- **Autorização.** Push só é autorizado por pedido afirmativo nesta conversa e vale apenas para a sessão atual. Veja `.github/copilot-instructions.md`.

## Schemas
- v1: `integracao/schemas/session.schema.json`
- v2 (tópicos): `integracao/schemas/topic-session.schema.json`

## Fluxo recomendado
1. O usuário prepara `integracao/entrada-chatgpt.json` (ignorado pelo Git).
2. Valide com `npm run session:validate`.
3. Revise conflitos; nunca grave com informação incompleta.
4. Após revisão, o usuário importa no dashboard.
5. Se houver artefatos reais e testes válidos, o commit/push segue as regras do Copilot Instructions (stage por caminho explícito, sem `git add .`).

## Segurança
- Não marque como concluído por menção. É exigida confirmação explícita ou regra verificável.
- `null` significa desconhecido, nunca zero.
- Não versionar backups pessoais, tokens, senhas ou chaves.
- Atualizações de roadmap exigem `expected_status` consistente e confirmação explícita.
