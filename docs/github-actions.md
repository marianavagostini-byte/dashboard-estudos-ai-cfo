# GitHub Actions e publicação

## CI
Workflow em `.github/workflows/ci.yml`:
- `npm ci`, `npm run lint`, `npm test`, `npm run build` em push/PR para `main`.

## Publicação
- Deploy automático no GitHub Pages em cada push para `main`, pelo workflow `.github/workflows/deploy-pages.yml`.
- O job `validate` executa `npm ci`, `npm run lint`, `npm test` e `npm run build`; o job `deploy` refaz o build com `GITHUB_ACTIONS=true` e publica `dist`.
- Guia e URL em [`publicacao-github-pages.md`](./publicacao-github-pages.md).
- Push remoto só com autorização afirmativa, verificando branch/remote e alterações não relacionadas.
- Não versionar backups pessoais, dados do IndexedDB ou segredos.
- Não criar commits vazios para contagem de contribuições.
- Separar histórico de estudos (IndexedDB) de alterações no código-fonte.
