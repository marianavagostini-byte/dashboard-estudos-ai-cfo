# Operação local, backups e GitHub

Este guia descreve o fluxo verificado nesta cópia do repositório. Salvar um arquivo, criar um commit, fazer push e publicar um site são operações distintas.

## Iniciar e testar

Na raiz do repositório:

```sh
npm install
npm run dev
```

Abra a URL exata impressa pelo Vite. O IndexedDB é isolado por origem (protocolo, host e porta) e perfil do navegador; use o mesmo endereço/perfil para ver os mesmos dados.

Comandos de validação:

```sh
npm test
npm run lint
npm run build
npm run session:validate -- integracao/entrada-chatgpt.json
```

O último comando é aplicável quando o arquivo de entrada existe. Ele só valida o JSON; não o importa nem grava o IndexedDB.

## Backup e restauração

### Encontrar a origem que contém o progresso

O IndexedDB pertence à origem web e ao perfil específico do navegador, não ao diretório do projeto nem à conta GitHub. `http://localhost:5173`, `http://127.0.0.1:5173`, portas diferentes, HTTP/HTTPS e perfis distintos têm armazenamentos separados.

1. No navegador e perfil em que costumava estudar, abra o endereço exato que usava. A tela lateral do dashboard mostra a origem aberta e quantos registros foram lidos.
2. Abra **Configurações** e confira novamente a origem e o total. Não interprete etapas visíveis do catálogo como registros: o catálogo é código estático.
3. Se o total for zero, não importe nem substitua nada. Abra as ferramentas do navegador (**F12 → Application/Armazenamento → IndexedDB**) e confira, sem editar, se existe `dashboard-estudos` com `records` para aquela origem.
4. Repita a conferência nos outros perfis do navegador e nos endereços/portas usados historicamente. A conversa do ChatGPT, o Copilot Agent e esta cópia do repositório não conseguem enumerar os perfis nem ler seus IndexedDBs.
5. Quando achar a origem com registros, retorne ao dashboard aberto nessa mesma origem/perfil e exporte ali. Se só encontrar a store, mas não conseguir abrir a aplicação na origem correspondente, não copie dados manualmente: solicite ajuda antes de migrar.

### Testar exportação e restauração sem substituir o banco original

Faça esse teste somente após exportar uma origem preenchida. Os dois backups podem conter histórico pessoal: guarde-os fora do repositório e não os anexe a commits.

1. Em **Configurações** na origem preenchida, anote a origem e quantidade de registros mostrada; clique **Exportar backup JSON**.
2. Na pasta de downloads, mantenha o arquivo original privado. Confirme que o JSON abre e tem `app: "Dashboard-Estudos"`, `version: 1`, `exportedAt` válido, `records` como lista não vazia e `settings`. Compare `records.length` com o número visto no dashboard. Não edite o arquivo.
3. Inicie outra instância Vite em uma porta nova e aleatória, por exemplo `npm run dev -- --host 127.0.0.1 --port 41873 --strictPort`. Abra a URL impressa no mesmo navegador; host/porta diferentes criam outra origem e outro IndexedDB. Em **Configurações**, confirme que a origem nova mostra zero registros antes de importar. Se não mostrar zero, não substitua nada: escolha outra porta livre e confirme de novo.
4. Na origem isolada recém-criada, selecione o backup validado, escolha **Substituir todos os dados locais**, confira que a contagem local é zero e confirme. A substituição fica limitada ao IndexedDB dessa nova origem; nunca a execute na origem original.
5. Recarregue a página. Confirme que o total voltou a coincidir e que o roadmap mostra os mesmos estados. Exporte novamente pela origem isolada para um segundo arquivo privado.
6. Compare os arquivos sem mostrar seus dados pessoais no terminal:

   ```sh
   node scripts/compare-backups.mjs "C:\caminho\privado\backup-origem.json" "C:\caminho\privado\backup-restaurado.json"
   ```

   O comando recusa backups vazios/inválidos e compara todos os registros (IDs, conteúdo, datas, sessões, histórico e status), além das configurações. Só informa contagens e sucesso/erro. `exportedAt` pode diferir, pois é a hora de cada exportação. Um round-trip é confirmado apenas se o comando terminar com sucesso.

7. Feche a instância de teste quando terminar. Não é necessário limpar a origem original nem o IndexedDB de produção.

Se não localizar o progresso, a ação necessária é abrir o dashboard em cada perfil/endereço antigo e exportar da origem que mostra registros. Para análise posterior, compartilhe somente o arquivo v1 exportado pela interface, em canal privado apropriado; antes de enviar, revise se deseja compartilhar os dados pessoais que ele contém. Nunca envie credenciais ou dumps brutos do IndexedDB.

Para restaurar dados de produção, selecione o backup revisado em Configurações e prefira **Mesclar** quando quiser preservar IDs locais. Mesclar ignora IDs existentes (e etapas com o mesmo `stageId`); não é um merge por data nem substitui os registros existentes. **Substituir** apaga os registros locais após confirmação. Um backup vazio é recusado no modo substituir. Em caso de divergência, pare e preserve ambos os arquivos até entender a origem.

## Transferência com ChatGPT

A integração é **manual por arquivo**, não sincronização automática por API:

1. Exporte o resumo de continuidade no dashboard e compartilhe apenas as informações necessárias com o ChatGPT.
2. Ao terminar uma sessão, receba um JSON v1 conforme `integracao/schemas/session.schema.json` e salve como `integracao/entrada-chatgpt.json` (arquivo ignorado pelo Git).
3. Valide com `npm run session:validate -- integracao/entrada-chatgpt.json`.
4. Revise o JSON e importe em **Configurações → Registrar sessão do ChatGPT**. O dashboard registra o `session_id` no IndexedDB; duplicatas e conflitos são recusados. Só considere sincronizado depois de ver a confirmação na interface.
5. A data da última sessão está no histórico de Configurações. O resumo baixado reflete apenas a origem atual do navegador.

O resumo de continuidade não é backup restaurável. Sessões e atualizações explícitas são incluídas nos backups v1; o progresso do dashboard continua sendo a fonte oficial.

## Git, commit e publicação

### Diferenças entre operações

- **Salvar arquivo:** grava o conteúdo na cópia de trabalho. Não cria commit nem envia nada.
- **Criar commit:** grava no histórico Git local, depois de stage. Não envia ao GitHub.
- **Push:** envia commits locais à branch remota configurada. Requer autenticação e permissão.
- **GitHub Pages:** publica um site estático por uma configuração própria do repositório/workflow. Push não significa publicação do site.

O repositório usa GitHub Actions para testes/build. A consulta de configurações de Pages não encontrou um site configurado. Não há tarefa de commit a cada salvamento, hook ativo ou sincronização automática. A autenticação GitHub deve estar configurada no Git local; não salve tokens no projeto.

### Commit controlado pelo terminal integrado do VS Code

O `.gitignore` exclui configurações em `.vscode/` para não versionar preferências locais. Por isso, o fluxo compartilhado é um comando no terminal integrado, sem instalar extensão ou tarefa local. Informe mensagem e caminhos relativos intencionais separados por `;`, por exemplo:

```text
src/exemplo.ts;tests/exemplo.test.mjs
```

O script `scripts/safe-commit.mjs` roda testes, lint e build antes do stage; exige caminhos explícitos, recusa índice já staged, arquivos ignorados/sensíveis e branches sem upstream para push. Confere o diff staged, cria um único commit com os caminhos selecionados e, somente com `--push`, envia sem force e verifica o hash remoto. Se a publicação falhar depois do commit, o commit permanece local. Alterações locais não selecionadas são preservadas.

Também é possível executar na raiz:

```sh
node scripts/safe-commit.mjs --message "feat: resumo claro" --files "src/exemplo.ts;tests/exemplo.test.mjs" --dry-run
node scripts/safe-commit.mjs --message "feat: resumo claro" --files "src/exemplo.ts;tests/exemplo.test.mjs"
```

O modo `--dry-run` executa validações sem stage, commit ou push. Para publicar intencionalmente, acrescente `--push` ao comando normal. Não há publicação a cada salvamento.

Confira o estado antes e depois com:

```sh
git status --short --branch
git branch -vv
git log -1 --oneline --decorate
git rev-list --left-right --count '@{upstream}...HEAD'
```

`git status` mostra alterações locais; `git branch -vv` mostra upstream; em `rev-list`, o primeiro número são commits remotos ainda não locais e o segundo são commits locais ainda não publicados. Para confirmar o hash remoto:

```sh
git ls-remote --heads origin main
```

Uma falha de autenticação requer configurar Git Credential Manager ou `gh auth login`; não cole tokens em arquivos ou comandos registrados. Em conflito, não force push: atualize e resolva a branch conscientemente. Se uma execução GitHub Actions falhar, abra a execução correspondente no GitHub e corrija os testes antes de novo push.

### Desativar e verificar

O script só roda quando chamado; não há tarefa em background, extensão ou commit a cada salvamento para desativar. O comando `--dry-run` demonstra a validação sem alterar o índice ou o histórico.
