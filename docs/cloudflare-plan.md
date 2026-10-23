# Plano futuro de sincronização Cloudflare

**Estado:** proposta para revisão humana. Nenhuma conta, recurso, banco, migração ou publicação foi criada.

**Pesquisado em:** 22/10/2026. Preços e limites podem mudar; confira as fontes oficiais antes de provisionar.

## Objetivo e limites

Manter o IndexedDB como fonte local durante uma primeira fase de espelhamento remoto. A sincronização só deve começar depois de uma revisão e aprovação do esquema, das regras por usuário e dos conflitos. O sistema não deve carregar dados financeiros de um usuário para outro nem permitir acesso anônimo ao Worker.

## Topologia proposta

1. Cloudflare Pages serve apenas os arquivos estáticos do React.
2. Cloudflare Access protege o hostname de produção `*.pages.dev`; deployments de preview recebem política própria. Se houver domínio personalizado, ele também precisa de uma aplicação/política Access. A documentação de Pages informa que habilitar Access para previews, por si só, não protege o hostname principal nem um domínio personalizado. A configuração de `pages.dev` exige converter o hostname wildcard `*` em hostname do projeto e recriar a política de previews.
3. O caminho `/api/*` deve chegar a um Worker/Pages Function protegido pelo mesmo perímetro Access, idealmente no mesmo hostname para evitar CORS e circulação de tokens entre origens.
4. O Worker valida a assinatura e os claims do `Cf-Access-Jwt-Assertion` com as chaves públicas do Access; não confia apenas na presença do cabeçalho. Confere emissor e `aud` para a aplicação esperada, expiração e identidade estável do provedor (`sub` quando disponível). Email é atributo mutável e não deve ser a chave primária do usuário.
5. O Worker deriva o `user_id` exclusivamente do token validado. Cada leitura, gravação, conflito e cursor inclui esse `user_id` na consulta. Nenhum endpoint aceita `user_id` arbitrário do cliente como autoridade. A camada de dados adiciona restrições compostas para impedir acesso cruzado.

Cloudflare documenta validação do JWT no origin e recomenda validar o JWT/assinatura; a validação só no edge não cobre um caminho que acabe contornando o Access.

## Esquema D1 proposto (para revisão)

```sql
CREATE TABLE study_records (
  user_id       TEXT NOT NULL,
  record_id     TEXT NOT NULL,
  record_type   TEXT NOT NULL,
  payload_json  TEXT NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT,
  PRIMARY KEY (user_id, record_id)
);

CREATE INDEX study_records_user_updated
  ON study_records (user_id, updated_at, record_id);

CREATE TABLE sync_state (
  user_id       TEXT PRIMARY KEY,
  cursor        TEXT,
  schema_version INTEGER NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE record_revisions (
  user_id       TEXT NOT NULL,
  record_id     TEXT NOT NULL,
  version       INTEGER NOT NULL,
  payload_json  TEXT NOT NULL,
  changed_at    TEXT NOT NULL,
  change_id     TEXT NOT NULL,
  PRIMARY KEY (user_id, record_id, version),
  UNIQUE (user_id, change_id)
);
```

O payload preserva o registro compatível com o formato local, inclusive IDs, `createdAt`, `updatedAt`, datas e campos novos opcionais. `record_revisions` é uma proposta para reter versões concorrentes; retenção e política de exclusão precisam de decisão humana. `settings` deve ganhar uma linha por usuário ou campos explícitos em uma tabela separada, nunca uma configuração global compartilhada.

## Primeiro fluxo: espelhamento aditivo

1. O cliente exporta um backup v1 local e calcula uma contagem/hash local; o usuário revisa origem, quantidade e arquivo.
2. O cliente envia lotes limitados com um `change_id` idempotente. O Worker valida versão, estrutura, tamanho, IDs e duplicatas antes de abrir uma transação.
3. ID ausente no remoto é inserido. ID existente com conteúdo idêntico é reconhecido como repetição. Mesmo ID com conteúdo diferente não é sobrescrito: retorna conflito com as versões e bloqueia aquele item.
4. A resposta lista IDs aceitos, repetidos e conflitantes e atualiza o cursor somente após a transação confirmada. Não há download remoto que substitua o armazenamento local nesta fase.
5. Exclusões tornam-se tombstones (`deleted_at`) propagados como alterações; não se apaga fisicamente um registro durante a sincronização normal.

## Conflitos e registros concorrentes

- Atualização exige `expected_version`; a versão atual precisa coincidir para aceitar uma escrita.
- Em divergência, preservar as duas versões em `record_revisions`, retornar conflito e não aplicar “última gravação vence” silenciosamente.
- Alterações de status concorrentes não são combinadas automaticamente. O usuário compara as versões e escolhe a versão canônica; ambas permanecem recuperáveis até essa decisão.
- Tombstones também têm versão. Uma edição local antiga não ressuscita um registro excluído sem resolução explícita.
- Uma sincronização completa posterior só poderá substituir/baixar dados após política de conflito, retenção e exclusões aprovada e testada.

## Migração, validação e rollback

1. Confirmar o catálogo e a política de versões; obter um backup nativo atual do IndexedDB e validá-lo sem importação.
2. Produzir cópia verificável e documentar origem, data, contagem e hashes. Não converter relatos de cursos em registros `roadmapStage`.
3. Testar localmente com D1 local e fixtures fictícias: esquema, usuários isolados, JWT válido/inválido, duplicatas, lotes repetidos, concorrência, tombstones, erros de transação e reimportação.
4. Em modo de simulação, calcular quais IDs seriam criados, repetidos ou conflitantes; nenhuma escrita remota.
5. Após aprovação humana, enviar apenas adições em lotes transacionais; comparar contagens e hashes por usuário; exportar uma cópia remota antes de habilitar qualquer leitura/sync bidirecional.
6. Rollback da aplicação: desligar a funcionalidade de sync e continuar usando IndexedDB. Não apagar a base D1 nem reverter o IndexedDB local. Restauração D1 por Time Travel substitui a base no lugar e, por isso, exige exportação adicional e aprovação explícita.

Time Travel do D1 é automático: a documentação atual informa recuperação por até 7 dias no plano Workers Free e 30 dias no Workers Paid. Não substitui um backup independente nem protege contra erros descobertos após essa janela. A restauração sobrescreve a base ativa.

## Custos e requisitos conhecidos

- Pages oferece hospedagem estática; Pages Functions são cobradas como Workers.
- Workers Free: 100 mil requisições/dia e 10 ms de CPU por invocação, conforme a página de limites consultada.
- D1 Workers Free: 5 milhões de linhas lidas/dia, 100 mil escritas/dia e 5 GB de armazenamento total na conta; cada banco tem limite de 500 MB no plano Free. Ao atingir limites diários, consultas passam a falhar até o reset. Workers Paid remove os limites Free; o plano pago de Workers começa em US$ 5/mês.
- Cloudflare Access Zero Trust Free lista até 50 usuários; a tabela de preços oficial lista Zero Trust Pay-as-you-go a US$ 7 por usuário/mês (faturamento anual), sujeito a mudanças e condições comerciais.
- **Cartão de crédito:** as páginas oficiais consultadas não especificam se a criação de uma conta ou ativação de cada serviço exige cartão. Não assumir que será dispensado; conferir os termos e a tela de cobrança antes de prosseguir. Nenhum cartão deve ser inserido sem autorização expressa.

## Fontes oficiais consultadas

- [Pages: Known issues e proteção de `*.pages.dev`](https://developers.cloudflare.com/pages/platform/known-issues/)
- [Pages: controle de acesso para deployments de preview](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [Access: validar JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Access: token da aplicação e validação no origin](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/)
- [Workers: limites de plataforma](https://developers.cloudflare.com/workers/platform/limits/)
- [D1: limites](https://developers.cloudflare.com/d1/platform/limits/)
- [D1: preços](https://developers.cloudflare.com/d1/platform/pricing/)
- [D1: Time Travel e backups](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Zero Trust: planos oficiais e limite de usuários](https://www.cloudflare.com/plans/)

## Revisões necessárias antes de implementação

- Aprovar a proposta de esquema e identidade estável de usuário.
- Definir provedor de identidade, elegibilidade/limites de Access e custos.
- Definir retenção de revisões/tombstones e resolução de conflito pelo usuário.
- Aprovar a estratégia de backup fora do Time Travel e validar o fluxo de recuperação.
- Aprovar explicitamente qualquer conta, recurso, importação, sincronização, alteração de cobrança ou deploy.
