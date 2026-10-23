# Publicação no GitHub Pages

O dashboard é publicado como site estático no GitHub Pages, sem backend e sem custo.

**Status:** publicado em 23/10/2026 e verificado por navegador real (Chrome headless) na URL de produção.

O histórico público deste repositório foi reconstruído em um único commit para remover um resumo pessoal antigo de estudos que existia em commits anteriores. O histórico original foi preservado apenas em um bundle local fora do repositório e não é publicado.

## URL

- Produção: <https://marianavagostini-byte.github.io/dashboard-estudos-ai-cfo/>
- Repositório: <https://github.com/marianavagostini-byte/dashboard-estudos-ai-cfo>

## Como o deploy funciona

1. O workflow [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) roda em cada push para `main` ou por acionamento manual (`workflow_dispatch`).
2. O job `validate` executa `npm ci`, `npm run lint`, `npm test` e `npm run build`.
3. O job `deploy` refaz o build com `GITHUB_ACTIONS=true`, envia `dist` como artefato do Pages e publica.
4. `vite.config.ts` usa `base: '/dashboard-estudos-ai-cfo/'` somente quando `GITHUB_ACTIONS=true`; o desenvolvimento local continua na raiz (`/`).

## Configuração única no GitHub

O repositório precisa ser **público** para usar GitHub Pages no plano gratuito. O workflow detecta a visibilidade e só executa o job `deploy` quando `github.event.repository.visibility == 'public'`; enquanto o repositório estiver privado, o CI continua verde e o deploy é ignorado.

Para liberar a publicação sem custo:

1. Abra **Settings → General → Danger Zone → Change repository visibility**.
2. Escolha **Public** e confirme o nome do repositório. Isso torna o código, os testes e a documentação públicos; não há dados de estudo, backups ou segredos versionados.
3. Faça um novo push ou execute o workflow **Deploy to GitHub Pages** em **Actions**.
4. O workflow usa `actions/configure-pages` com `enablement: true` e configura automaticamente **Settings → Pages → Source: GitHub Actions**.

Alternativa sem tornar o repositório público: contratar um plano GitHub que permita Pages em repositórios privados. Não é necessário criar branch `gh-pages`.

## Dados e origem do navegador

O progresso fica no IndexedDB e é isolado por origem. O endereço público é uma origem diferente de `http://localhost:5173`; portanto:

- o progresso criado no site publicado não aparece automaticamente no ambiente local, e vice-versa;
- para levar o progresso existente, abra o ambiente de origem, exporte o backup JSON em **Configurações** e importe-o no endereço público (a importação exige prévia e confirmação);
- não há sincronização automática entre dispositivos nem backup remoto. Use a exportação manual e guarde o arquivo fora do navegador.

## Validação após o deploy

1. Abra a URL pública em uma janela anônima.
2. Confira se o catálogo carrega com as 20 matérias na ordem oficial.
3. Marque um tópico como concluído, recarregue a página e confirme a persistência.
4. Confira a barra verde em **Visão Geral** e **Roadmap** em 0%, parcial e 100%.
5. Exporte um backup e valide a prévia de reimportação.
6. Em caso de falha de assets, confirme que o build de produção contém `/dashboard-estudos-ai-cfo/assets/...`.
