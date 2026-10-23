export type TopicPriority = 'Alta' | 'Média' | 'Baixa'

export interface StudySubtopic {
  id: string
  title: string
}

export interface StudyTopic {
  id: string
  title: string
  subtopics: readonly StudySubtopic[]
  prerequisites?: readonly string[]
  priority?: TopicPriority
  objective?: string
  material?: { title: string; author: string; url: string }
  exercise?: string
  completionCriteria?: string
  origin?: 'recuperado' | 'proposta'
}

export interface StudySubject {
  id: string
  title: string
  topics: readonly StudyTopic[]
}

export interface StudyPhase {
  id: string
  title: string
  parallel?: boolean
  subjects: readonly StudySubject[]
}

type TopicSeed = Omit<StudyTopic, 'subtopics'> & { subtopics: readonly string[] }
type SubjectSeed = Omit<StudySubject, 'topics'> & { topics: readonly TopicSeed[] }

function makeSubject(seed: SubjectSeed): StudySubject {
  return {
    ...seed,
    topics: seed.topics.map((item) => ({
      ...item,
      subtopics: item.subtopics.map((title, index) => ({ id: `${item.id}.${index + 1}`, title })),
    })),
  }
}

function subject(id: string, title: string, topics: readonly TopicSeed[]): SubjectSeed {
  return { id, title, topics }
}

function topic(id: string, title: string, subtopics: readonly string[], extra: Partial<Omit<TopicSeed, 'id' | 'title' | 'subtopics'>> = {}): TopicSeed {
  return { id, title, subtopics, ...extra }
}

const seeds: readonly Omit<StudyPhase, 'subjects'>[] = [
  { id: 'web', title: 'Web e linguagens' },
  { id: 'fundamentos', title: 'Fundamentos e base histórica' },
  { id: 'dados', title: 'Persistência e bancos de dados' },
  { id: 'backend', title: 'Backend' },
  { id: 'qualidade', title: 'Testes e qualidade' },
  { id: 'engenharia-software', title: 'Arquitetura de software' },
  { id: 'seguranca', title: 'Segurança' },
  { id: 'infraestrutura', title: 'Deploy e infraestrutura' },
  { id: 'ia-projeto', title: 'IA e projeto' },
  { id: 'especializacoes', title: 'Especializações futuras' },
  { id: 'dsa-leetcode', title: 'DSA + LeetCode', parallel: true },
]

const subjectsByPhase: Record<string, readonly SubjectSeed[]> = {
  fundamentos: [
    subject('fundamentos.python', 'Python', [
      topic('fundamentos.python.sintaxe', 'Sintaxe e dados', ['variáveis e atribuição', 'tipos numéricos, texto e booleanos', 'conversão e entrada/saída'], { priority: 'Alta', objective: 'Escrever pequenos programas e explicar como valores fluem entre entrada, processamento e saída.', exercise: 'Ler dois valores, validar números e apresentar soma, diferença e produto.', completionCriteria: 'Casos válidos e inválidos são tratados; explica tipos e conversões usados.' }),
      topic('fundamentos.python.controle', 'Controle de fluxo', ['comparações e expressões booleanas', 'if/elif/else', 'for e while', 'break e continue']),
      topic('fundamentos.python.estruturas', 'Estruturas e funções', ['listas, tuplas e dicionários', 'fatiamento e iteração', 'parâmetros e retorno', 'escopo e decomposição']),
      topic('fundamentos.python.erros', 'Erros e módulos', ['exceções e validação', 'arquivos e caminhos', 'imports e módulos', 'ambiente virtual e pip']),
    ]),
    subject('fundamentos.poo', 'Programação Orientada a Objetos', [
      topic('fundamentos.poo.modelagem', 'Classes e objetos', ['estado e comportamento', 'atributos e métodos', 'construtor e invariantes'], { prerequisites: ['fundamentos.python.estruturas'] }),
      topic('fundamentos.poo.encapsulamento', 'Encapsulamento e composição', ['interfaces públicas', 'responsabilidade do objeto', 'composição entre objetos']),
      topic('fundamentos.poo.heranca', 'Herança e polimorfismo', ['especialização', 'sobrescrita', 'substituição e contratos']),
      topic('fundamentos.poo.pratica', 'Projeto orientado a objetos', ['cohesão e acoplamento', 'representação textual', 'organização em módulos']),
    ]),
    subject('fundamentos.git-github', 'Git e GitHub', [
      topic('fundamentos.git-github.basico', 'Repositório e histórico', ['init, status e diff', 'stage e commit', 'ignore e restauração segura'], { priority: 'Alta', material: { title: 'Livro Pro Git em português', author: 'Git', url: 'https://git-scm.com/book/pt-br/v2' } }),
      topic('fundamentos.git-github.branches', 'Branches e integração', ['branch e switch', 'merge e conflitos', 'rebase como conceito']),
      topic('fundamentos.git-github.remoto', 'GitHub e colaboração', ['remotes, fetch, pull e push', 'issues e pull requests', 'revisão de código']),
    ]),
    subject('fundamentos.sql', 'SQL', [
      topic('fundamentos.sql.consultas', 'Consultas e filtros', ['SELECT e aliases', 'WHERE e operadores', 'ORDER BY e LIMIT'], { priority: 'Alta', material: { title: 'Tutorial SQL do PostgreSQL', author: 'PostgreSQL', url: 'https://www.postgresql.org/docs/current/tutorial-sql.html' } }),
      topic('fundamentos.sql.agregacoes', 'Agregações e agrupamento', ['COUNT, SUM, AVG, MIN e MAX', 'GROUP BY e HAVING', 'NULL e funções de tratamento'], { prerequisites: ['fundamentos.sql.consultas'] }),
      topic('fundamentos.sql.relacoes', 'Modelagem e relações', ['chaves primárias e estrangeiras', 'normalização básica', 'INNER JOIN e LEFT JOIN'], { prerequisites: ['fundamentos.sql.consultas'] }),
      topic('fundamentos.sql.alteracoes', 'Alterações e transações', ['INSERT, UPDATE e DELETE', 'constraints', 'COMMIT e ROLLBACK']),
    ]),
    subject('fundamentos.sqlite', 'SQLite', [
      topic('fundamentos.sqlite.arquivo', 'Banco local e ferramentas', ['arquivo de banco', 'sqlite3 CLI', 'tipos e afinidade']),
      topic('fundamentos.sqlite.schema', 'Schema e integridade', ['CREATE TABLE', 'constraints e chaves', 'migrações simples']),
      topic('fundamentos.sqlite.python', 'SQLite com Python', ['conexão e cursor', 'parâmetros em consultas', 'commit, rollback e fechamento'], { prerequisites: ['fundamentos.sqlite.schema', 'fundamentos.python.estruturas'] }),
    ]),
    subject('fundamentos.crud-python', 'CRUD com Python', [
      topic('fundamentos.crud-python.create-read', 'Criar e consultar', ['modelar entidade', 'INSERT parametrizado', 'SELECT por identificador'], { prerequisites: ['fundamentos.sqlite.python'] }),
      topic('fundamentos.crud-python.update-delete', 'Atualizar e remover', ['UPDATE com filtro', 'DELETE com confirmação', 'verificar quantidade afetada']),
      topic('fundamentos.crud-python.organizacao', 'Organização e erros', ['separar acesso ao banco', 'validar dados', 'tratar falhas sem perder consistência']),
    ]),
  ],
  web: [
    subject('web.fundamentos', 'HTTP e APIs', [
      topic('web.fundamentos.cliente-servidor', 'Cliente e servidor', ['requisição e resposta', 'DNS e endereço', 'cliente, servidor e navegador']),
      topic('web.fundamentos.http', 'HTTP', ['métodos e semântica', 'status codes', 'headers, corpo e cache'], { priority: 'Alta', material: { title: 'Visão geral do HTTP', author: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview' } }),
      topic('web.fundamentos.apis', 'APIs', ['contrato e recursos', 'consumo de APIs', 'erros e limites']),
      topic('web.fundamentos.rest', 'REST', ['recursos e URIs', 'métodos idempotentes', 'status e representação']),
      topic('web.fundamentos.json', 'JSON', ['objetos e arrays', 'serialização', 'validação de formato']),
    ]),
    subject('web.html', 'HTML', [
      topic('web.html.semantica', 'Estrutura semântica', ['documento e landmarks', 'títulos e hierarquia', 'links e listas'], { material: { title: 'Estruturar conteúdo com HTML', author: 'MDN', url: 'https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Structuring_content' } }),
      topic('web.html.forms', 'Formulários', ['label e controles', 'validação nativa', 'submissão acessível']),
      topic('web.html.acessibilidade', 'Acessibilidade estrutural', ['texto alternativo', 'ordem de leitura', 'semântica de botões']),
    ]),
    subject('web.css', 'CSS', [
      topic('web.css.fundamentos', 'Cascata e layout', ['seletores e especificidade', 'box model', 'unidades e variáveis'], { material: { title: 'CSS: primeiros passos', author: 'MDN', url: 'https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Styling_basics' } }),
      topic('web.css.layout', 'Layouts responsivos', ['flexbox', 'grid', 'media queries']),
      topic('web.css.acessibilidade', 'Estilo acessível', ['foco visível', 'contraste', 'movimento reduzido']),
    ]),
    subject('web.javascript', 'JavaScript', [
      topic('web.javascript.basico', 'Linguagem e valores', ['variáveis e escopo', 'tipos e coerção', 'funções e closures'], { priority: 'Alta', material: { title: 'Guia JavaScript', author: 'MDN', url: 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide' } }),
      topic('web.javascript.estruturas', 'Arrays e objetos', ['map, filter e reduce', 'imutabilidade e cópias', 'desestruturação'], { prerequisites: ['web.javascript.basico'] }),
      topic('web.javascript.browser', 'JavaScript no navegador', ['DOM e eventos', 'formulários', 'Fetch e erros assíncronos'], { prerequisites: ['web.javascript.basico'] }),
      topic('web.javascript.assincrono', 'Assincronismo', ['promises', 'async/await', 'tratamento de falhas'], { prerequisites: ['web.javascript.basico'] }),
    ]),
    subject('web.typescript', 'TypeScript', [
      topic('web.typescript.tipos', 'Tipos e inferência', ['tipos primitivos e arrays', 'interfaces e aliases', 'unions e narrowing'], { prerequisites: ['web.javascript.basico'], material: { title: 'TypeScript Handbook', author: 'TypeScript', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' } }),
      topic('web.typescript.funcoes', 'Funções e dados', ['parâmetros e retorno', 'tipos genéricos', 'tipos discriminados']),
      topic('web.typescript.runtime', 'Limites de tipos', ['tipos não validam JSON em runtime', 'unknown e validação', 'configuração do compilador']),
    ]),
    subject('web.react', 'React', [
      topic('web.react.componentes', 'Componentes e props', ['JSX', 'composição', 'props e listas'], { prerequisites: ['web.javascript.basico'], material: { title: 'Documentação do React', author: 'React', url: 'https://pt-br.react.dev/learn' } }),
      topic('web.react.estado', 'Estado e eventos', ['useState', 'eventos', 'estado derivado']),
      topic('web.react.efeitos', 'Efeitos e dados', ['useEffect quando necessário', 'carregamento e erro', 'limpeza e dependências']),
      topic('web.react.acessibilidade', 'Formulários e acessibilidade', ['inputs controlados', 'rótulos e mensagens', 'navegação por teclado']),
    ]),
    subject('web.vite', 'Vite e ferramentas de desenvolvimento', [
      topic('web.vite.dev-server', 'Servidor de desenvolvimento e HMR', ['npm run dev', 'recarregamento e HMR', 'host, porta e proxy'], {
        material: { title: 'Guia do Vite', author: 'Vite', url: 'https://vite.dev/guide/' },
        objective: 'Subir o projeto localmente e explicar como o navegador recebe cada atualização durante o desenvolvimento.',
        exercise: 'Iniciar o projeto, alterar um componente e confirmar no navegador que a atualização chegou sem reiniciar o servidor.',
        completionCriteria: 'Distingue servidor de desenvolvimento de build; identifica a porta e a origem usadas.',
      }),
      topic('web.vite.build', 'Build e conferência de tipos', ['tsc -b', 'vite build', 'dist e vite preview'], {
        prerequisites: ['web.vite.dev-server'],
        objective: 'Produzir uma build de produção e verificar o artefato antes de publicar.',
        exercise: 'Executar a build, inspecionar a pasta dist e servir o resultado com vite preview.',
        completionCriteria: 'Build e preview concluem sem erro; a origem do preview é conferida antes de testar dados.',
      }),
      topic('web.vite.config', 'Configuração e variáveis de ambiente', ['vite.config.ts', 'import.meta.env', 'modos e segredos'], {
        prerequisites: ['web.vite.dev-server'],
        objective: 'Separar configuração pública de segredos e entender o efeito dos modos de build.',
        exercise: 'Adicionar uma variável pública fictícia, usá-la na interface e confirmar que ela não contém segredo.',
        completionCriteria: 'Explica por que variáveis do cliente não são sigilosas e valida a configuração ao iniciar.',
      }),
      topic('web.vite.qualidade', 'Lint, testes e integração contínua', ['ferramentas de lint', 'node --test', 'workflows de CI'], {
        prerequisites: ['web.vite.build'],
        objective: 'Executar a mesma verificação localmente e no pipeline antes de integrar mudanças.',
        exercise: 'Rodar lint, testes e build em sequência e registrar a causa de qualquer falha.',
        completionCriteria: 'Os três comandos passam ou cada falha residual está documentada com próximo passo.',
      }),
    ]),
  ],
  dados: [
    subject('dados.fundamentos', 'Persistência e bancos de dados', [
      topic('dados.fundamentos.modelagem', 'Modelagem de dados', ['entidades e relações', 'chaves e integridade', 'normalização e desnormalização'], {
        priority: 'Alta',
        material: { title: 'Modelagem de dados relacionais', author: 'PostgreSQL', url: 'https://www.postgresql.org/docs/current/ddl.html' },
        objective: 'Traduzir um domínio simples em tabelas com chaves e restrições que impeçam estados inválidos.',
        exercise: 'Modelar contas, categorias e transações fictícias com chaves estrangeiras e restrições de valor.',
        completionCriteria: 'O schema impede duplicidades e referências órfãs; as decisões de normalização são justificadas.',
      }),
      topic('dados.fundamentos.escolha', 'Escolha de armazenamento', ['relacional vs documento', 'consistência e disponibilidade', 'custos operacionais']),
      topic('dados.fundamentos.transacoes', 'Transações e concorrência', ['ACID', 'isolamento e locks', 'idempotência'], { prerequisites: ['dados.fundamentos.modelagem'] }),
      topic('dados.fundamentos.backup', 'Backup e recuperação', ['snapshot e restore', 'retenção', 'teste de restauração'], {
        prerequisites: ['dados.fundamentos.transacoes'],
        objective: 'Planejar cópias verificáveis e ensaiar a restauração sem sobrescrever dados reais.',
        exercise: 'Documentar um procedimento de backup e uma restauração em ambiente isolado com dados fictícios.',
        completionCriteria: 'Existe cópia verificável e um teste de restauração registrado, não apenas a intenção de fazer backup.',
      }),
    ]),
  ],
  backend: [
    subject('backend.fastapi', 'FastAPI', [
      topic('backend.fastapi.rotas', 'Rotas e parâmetros', ['path e query parameters', 'request body', 'response model'], { material: { title: 'Tutorial FastAPI', author: 'FastAPI', url: 'https://fastapi.tiangolo.com/tutorial/' } }),
      topic('backend.fastapi.dependencias', 'Dependências e validação', ['Dependency Injection', 'Pydantic models', 'tratamento de erros'], { prerequisites: ['backend.fastapi.rotas'] }),
      topic('backend.fastapi.execucao', 'Aplicação e documentação', ['OpenAPI', 'servidor de desenvolvimento', 'configuração e lifespan']),
    ]),
    subject('backend.rest-api', 'REST API prática', [
      topic('backend.rest-api.contrato', 'Contrato da API', ['recursos e rotas', 'status codes', 'paginação e filtros']),
      topic('backend.rest-api.operacoes', 'Operações e erros', ['CRUD HTTP', 'respostas consistentes', 'idempotência']),
    ]),
    subject('backend.postgresql', 'PostgreSQL', [
      topic('backend.postgresql.schema', 'Schema relacional', ['tipos e constraints', 'chaves e índices', 'relacionamentos']),
      topic('backend.postgresql.consultas', 'Consultas e transações', ['joins e agregações', 'transações ACID', 'isolamento e locks básicos']),
      topic('backend.postgresql.operacao', 'Operação do banco', ['roles e privilégios', 'backup e restore', 'conexões e pool']),
    ]),
    subject('backend.orm', 'SQLAlchemy e ORM', [
      topic('backend.orm.mapeamento', 'Mapeamento', ['models e tabelas', 'relacionamentos', 'tipos e constraints']),
      topic('backend.orm.sessao', 'Sessão e transação', ['unit of work', 'commit e rollback', 'contexto de sessão']),
      topic('backend.orm.migrations', 'Migrations', ['Alembic', 'migrações incrementais', 'downgrade e revisão']),
    ]),
    subject('backend.integracao', 'FastAPI com PostgreSQL', [
      topic('backend.integracao.conexao', 'Configurar conexão', ['URL fora do código', 'pool e ciclo de vida', 'injeção de sessão'], { prerequisites: ['backend.fastapi.rotas', 'backend.postgresql.schema', 'backend.orm.sessao'] }),
      topic('backend.integracao.transacao', 'Persistência na API', ['transações por operação', 'erros de integridade', 'isolamento de testes']),
    ]),
    subject('backend.crud', 'CRUD no backend', [
      topic('backend.crud.entidades', 'Criar e listar', ['schemas de entrada/saída', 'consulta paginada', 'separar DTO e modelo'], { prerequisites: ['backend.integracao.conexao'] }),
      topic('backend.crud.alteracoes', 'Detalhar, atualizar e excluir', ['404 e validação', 'PUT vs PATCH', 'exclusão e integridade']),
    ]),
    subject('backend.autenticacao', 'Autenticação', [
      topic('backend.autenticacao.identidade', 'Identidade e credenciais', ['identificador e senha', 'hash de senha', 'login e logout']),
      topic('backend.autenticacao.tokens', 'JWT, cookies e sessões', ['claims e expiração', 'cookies seguros', 'sessões no servidor']),
    ]),
    subject('backend.autorizacao', 'Autorização', [
      topic('backend.autorizacao.controles', 'Permissões', ['papéis e escopos', 'propriedade do recurso', 'negação por padrão']),
      topic('backend.autorizacao.api', 'Autorização na API', ['verificar cada operação', 'privilégio mínimo', 'testar acesso negado']),
    ]),
    subject('backend.validacao', 'Validação de dados', [
      topic('backend.validacao.schema', 'Schemas de entrada', ['tipos e limites', 'campos extras', 'normalização']),
      topic('backend.validacao.dominio', 'Regras de domínio', ['invariantes', 'erros de validação', 'validação também no limite de persistência']),
      topic('backend.validacao.zod', 'Validação com Zod', ['schema e inferência de tipos', 'parse seguro de JSON', 'mensagens de erro'], {
        prerequisites: ['web.typescript.tipos'],
        material: { title: 'Documentação do Zod', author: 'Zod', url: 'https://zod.dev/' },
        objective: 'Validar dados externos em runtime sem confiar apenas nos tipos do TypeScript.',
        exercise: 'Modelar uma transação financeira fictícia com Zod e rejeitar valores ausentes, negativos ou desconhecidos.',
        completionCriteria: 'Entrada inválida é rejeitada com mensagem clara e o tipo inferido é usado no restante do fluxo.',
      }),
    ]),
    subject('backend.node', 'Node.js', [
      topic('backend.node.runtime', 'Runtime e event loop', ['processo e memória', 'event loop e fila de tarefas', 'módulos nativos'], {
        priority: 'Alta',
        material: { title: 'Documentação do Node.js', author: 'Node.js', url: 'https://nodejs.org/docs/latest-v22.x/api/' },
        objective: 'Explicar por que operações assíncronas não bloqueiam o processo e quando isso deixa de ser verdade.',
        exercise: 'Comparar uma leitura de arquivo síncrona e assíncrona em um script pequeno.',
        completionCriteria: 'Identifica bloqueio de event loop e justifica o uso de APIs assíncronas.',
      }),
      topic('backend.node.npm', 'npm e dependências', ['package.json e scripts', 'semver e lockfile', 'dependências de desenvolvimento']),
      topic('backend.node.modules', 'Módulos ESM', ['import/export', 'resolução de caminhos', 'top-level await'], { prerequisites: ['backend.node.runtime'] }),
      topic('backend.node.fs', 'Arquivos e streams', ['fs/promises', 'streams e backpressure', 'caminhos e permissões']),
      topic('backend.node.http', 'Servidor HTTP e APIs', ['http nativo', 'frameworks e middlewares', 'tratamento de erros']),
      topic('backend.node.config', 'Configuração e observabilidade', ['variáveis de ambiente', 'logs estruturados', 'encerramento gracioso']),
    ]),
  ],
  qualidade: [
    subject('qualidade.pytest', 'pytest', [
      topic('qualidade.pytest.basico', 'Estrutura de testes', ['assertions', 'fixtures', 'parametrize']),
      topic('qualidade.pytest.execucao', 'Execução e cobertura', ['seleção de testes', 'marcadores', 'limites da cobertura']),
    ]),
    subject('qualidade.testes', 'Testes', [
      topic('qualidade.testes.unitarios', 'Testes unitários', ['isolar regra', 'fixtures pequenos', 'testar bordas']),
      topic('qualidade.testes.integracao', 'Testes de integração', ['banco isolado', 'transações e cleanup', 'serviços externos simulados'], { prerequisites: ['qualidade.testes.unitarios'] }),
      topic('qualidade.testes.api', 'Testes de API', ['cliente de teste', 'status e payload', 'autenticação e autorização']),
    ]),
    subject('qualidade.full-stack', 'Projeto Full Stack', [
      topic('qualidade.full-stack.vertical', 'Fluxo vertical', ['interface, API e banco', 'estados de carregamento e erro', 'contrato ponta a ponta']),
      topic('qualidade.full-stack.entrega', 'Qualidade de entrega', ['testes automatizados', 'documentação de execução', 'revisão de riscos e dados']),
    ]),
  ],
  infraestrutura: [
    subject('infraestrutura.linux', 'Linux e terminal', [
      topic('infraestrutura.linux.shell', 'Shell e arquivos', ['navegação e caminhos', 'pipes e redirecionamento', 'permissões e processos']),
      topic('infraestrutura.linux.diagnostico', 'Diagnóstico', ['logs', 'sinais e processos', 'rede e portas']),
    ]),
    subject('infraestrutura.ssh', 'SSH', [
      topic('infraestrutura.ssh.chaves', 'Chaves e acesso', ['par de chaves', 'known_hosts', 'agente SSH']),
      topic('infraestrutura.ssh.operacao', 'Uso remoto seguro', ['configuração de host', 'permissões', 'túneis básicos']),
    ]),
    subject('infraestrutura.docker', 'Docker', [
      topic('infraestrutura.docker.imagens', 'Imagens e containers', ['Dockerfile', 'camadas e cache', 'volumes e redes']),
      topic('infraestrutura.docker.segurança', 'Imagem de produção', ['usuário não root', 'imagem enxuta', 'segredos não entram na imagem']),
    ]),
    subject('infraestrutura.compose', 'Docker Compose', [
      topic('infraestrutura.compose.servicos', 'Serviços e dependências', ['services e networks', 'health checks', 'ordem vs prontidão'], { prerequisites: ['infraestrutura.docker.imagens'] }),
      topic('infraestrutura.compose.dados', 'Dados locais', ['volumes nomeados', 'configuração', 'logs e encerramento']),
    ]),
    subject('infraestrutura.configuracao', 'Variáveis de ambiente', [
      topic('infraestrutura.configuracao.ambientes', 'Configuração por ambiente', ['defaults seguros', 'validação na inicialização', 'separar desenvolvimento e produção']),
      topic('infraestrutura.configuracao.secrets', 'Segredos', ['não versionar', 'escopo de acesso', 'rotação']),
    ]),
    subject('infraestrutura.deploy', 'Deploy, domínio e DNS', [
      topic('infraestrutura.deploy.aplicacao', 'Deploy de aplicação', ['build e configuração', 'logs e health checks', 'rollback']),
      topic('infraestrutura.deploy.dns', 'Domínio e DNS', ['registros A, AAAA e CNAME', 'TTL e propagação', 'apontamento de domínio']),
    ]),
    subject('infraestrutura.https', 'HTTPS e TLS', [
      topic('infraestrutura.https.certificados', 'Certificados e tráfego', ['certificado e cadeia', 'renovação', 'redirect HTTP para HTTPS']),
    ]),
    subject('infraestrutura.cicd', 'CI/CD e GitHub Actions', [
      topic('infraestrutura.cicd.pipeline', 'Pipeline', ['gatilhos e jobs', 'testes e build', 'artefatos']),
      topic('infraestrutura.cicd.secrets', 'Credenciais e promoção', ['secrets do pipeline', 'ambientes protegidos', 'aprovação e rollback']),
    ]),
    subject('infraestrutura.cloud', 'Cloud', [
      topic('infraestrutura.cloud.fundamentos', 'Serviços e redes', ['compute e storage', 'identidade e IAM', 'rede e custos']),
      topic('infraestrutura.cloud.operacao', 'Operação em cloud', ['logs e métricas', 'backup e recuperação', 'limites e orçamento']),
    ]),
  ],
  'engenharia-software': [
    subject('engenharia.clean-code', 'Clean Code', [topic('engenharia.clean-code.praticas', 'Legibilidade e manutenção', ['nomes e funções pequenas', 'duplicação', 'refatorar com testes'])]),
    subject('engenharia.soc', 'Separation of Concerns', [topic('engenharia.soc.limites', 'Separação de responsabilidades', ['políticas e mecanismos', 'dependências entre camadas', 'fronteiras testáveis'])]),
    subject('engenharia.solid', 'SOLID', [topic('engenharia.solid.principios', 'Princípios SOLID', ['responsabilidade única', 'aberto/fechado e substituição', 'segregação de interfaces e inversão'])]),
    subject('engenharia.di', 'Dependency Injection', [topic('engenharia.di.construcao', 'Composição de dependências', ['injeção por construtor', 'composition root', 'test doubles'])]),
    subject('engenharia.patterns', 'Design Patterns', [topic('engenharia.patterns.uso', 'Padrões de projeto', ['Strategy e Adapter', 'Factory e Observer', 'custo de abstração'])]),
    subject('engenharia.layered', 'Layered Architecture', [topic('engenharia.layered.camadas', 'Camadas', ['apresentação e aplicação', 'domínio e infraestrutura', 'direção das dependências'])]),
    subject('engenharia.modular-monolith', 'Modular Monolith', [topic('engenharia.modular-monolith.modulos', 'Módulos e fronteiras', ['API interna', 'propriedade dos dados', 'dependências permitidas'])]),
    subject('engenharia.clean-architecture', 'Clean Architecture', [topic('engenharia.clean-architecture.dependencias', 'Política e detalhes', ['regra de dependência', 'ports and adapters', 'limites sem abstração excessiva'])]),
    subject('engenharia.ddd', 'Domain-Driven Design', [topic('engenharia.ddd.dominio', 'Modelagem de domínio', ['linguagem ubíqua', 'entities e value objects', 'bounded contexts'])]),
    subject('engenharia.microservices', 'Microservices', [topic('engenharia.microservices.limites', 'Serviços distribuídos', ['limites por domínio', 'falhas de rede', 'consistência e operação'])]),
    subject('engenharia.event-driven', 'Event-driven architecture', [topic('engenharia.event-driven.eventos', 'Eventos e consumidores', ['eventos de domínio', 'entrega e idempotência', 'ordenação e observabilidade'])]),
  ],
  seguranca: [
    subject('seguranca.web', 'Segurança de aplicações web', [
      topic('seguranca.web.owasp', 'OWASP Top 10', ['identificar classes de risco', 'avaliar impacto e controles', 'priorizar mitigação']),
      topic('seguranca.web.sql-injection', 'SQL Injection', ['queries parametrizadas', 'validação não substitui parâmetros', 'privilégio mínimo']),
      topic('seguranca.web.xss', 'XSS', ['contexto de saída', 'escape e sanitização', 'CSP como defesa adicional']),
      topic('seguranca.web.csrf', 'CSRF', ['cookies e envio automático', 'tokens anti-CSRF', 'SameSite e origem']),
      topic('seguranca.web.cors', 'CORS', ['origens e preflight', 'credenciais', 'CORS não é autorização']),
    ]),
    subject('seguranca.identidade', 'Identidade e controle de acesso', [
      topic('seguranca.identidade.autenticacao', 'Autenticação', ['verificação de identidade', 'fatores e recuperação', 'proteção contra tentativa automatizada']),
      topic('seguranca.identidade.autorizacao', 'Autorização', ['papéis e escopos', 'controle por recurso', 'negação por padrão']),
      topic('seguranca.identidade.sessoes', 'Sessões', ['cookies HttpOnly e Secure', 'expiração e rotação', 'logout e revogação']),
    ]),
    subject('seguranca.credenciais', 'Senhas e secrets', [
      topic('seguranca.credenciais.senhas', 'Senhas', ['hash adaptativo', 'salt', 'limites e recuperação segura']),
      topic('seguranca.credenciais.secrets', 'Secrets', ['armazenamento e acesso', 'rotação', 'detecção de vazamento']),
    ]),
    subject('seguranca.transporte', 'HTTPS e TLS', [topic('seguranca.transporte.tls', 'Proteção em trânsito', ['certificados', 'protocolos e configuração', 'não enviar credenciais por HTTP'])]),
    subject('seguranca.defesa', 'Defesas HTTP', [
      topic('seguranca.defesa.rate-limit', 'Rate limiting', ['limites por identidade e recurso', 'resposta 429', 'proteção contra abuso']),
      topic('seguranca.defesa.headers', 'Secure headers', ['Content-Security-Policy', 'frame e content type', 'Referrer-Policy e cookies']),
    ]),
  ],
  'ia-projeto': [
    subject('ia.fundamentos', 'Inteligência artificial', [
      topic('ia.fundamentos.llm', 'Como funcionam os LLMs', ['tokens e janela de contexto', 'probabilidade e temperatura', 'alucinação e verificação'], {
        priority: 'Alta',
        material: { title: 'Geração de texto com LLMs', author: 'OpenAI', url: 'https://platform.openai.com/docs/guides/text-generation' },
        objective: 'Explicar o que um modelo de linguagem faz e por que a saída precisa de validação antes de afetar dados ou decisões.',
        exercise: 'Pedir ao modelo a classificação de despesas fictícias e comparar a resposta com uma lista fixa de categorias permitidas.',
        completionCriteria: 'Descreve limite de contexto, custo aproximado e o motivo de validar a saída em runtime.',
      }),
      topic('ia.fundamentos.prompt', 'Prompt, contexto e formato', ['instruções e exemplos', 'saída estruturada em JSON', 'recusas e limites'], {
        prerequisites: ['ia.fundamentos.llm'],
        objective: 'Construir um pedido com papel, entrada, formato de saída e critérios de recusa explícitos.',
        exercise: 'Criar um prompt que devolva somente um JSON com categoria e justificativa para uma transação fictícia.',
        completionCriteria: 'A saída é parseável, usa apenas categorias permitidas e trata entrada ambígua.',
      }),
      topic('ia.fundamentos.avaliacao', 'Avaliação e limites', ['casos de teste', 'métricas e revisão humana', 'custo e latência'], {
        prerequisites: ['ia.fundamentos.llm'],
        objective: 'Medir qualidade de respostas com casos representativos em vez de julgar por impressão.',
        exercise: 'Montar uma pequena lista de entradas fictícias com resposta esperada e registrar acertos e erros do modelo.',
        completionCriteria: 'Existe conjunto de avaliação, taxa de acerto registrada e limite conhecido do modelo.',
      }),
    ]),
    subject('integracoes.sistemas', 'Integrações', [
      topic('integracoes.sistemas.http', 'Integração entre serviços', ['contratos e autenticação', 'timeouts e limites', 'tratamento de erros'], {
        priority: 'Alta',
        objective: 'Consumir um serviço externo sem deixar a aplicação indefinidamente bloqueada ou sem diagnóstico.',
        exercise: 'Consumir uma API pública com timeout, validação do formato da resposta e mensagem de erro clara.',
        completionCriteria: 'Falhas de rede e respostas inválidas são tratadas sem derrubar o fluxo principal.',
      }),
      topic('integracoes.sistemas.webhooks', 'Webhooks e eventos', ['assinatura e origem', 'entrega pelo menos uma vez', 'idempotência e reprocessamento'], {
        prerequisites: ['integracoes.sistemas.http'],
        objective: 'Receber eventos externos aceitando reentrega sem duplicar efeitos.',
        exercise: 'Simular o mesmo webhook fictício duas vezes e garantir que apenas um efeito seja persistido.',
        completionCriteria: 'O evento é verificado, deduplicado e registrado para auditoria.',
      }),
      topic('integracoes.sistemas.falhas', 'Falhas e retry', ['backoff e jitter', 'dead letter', 'observabilidade'], {
        prerequisites: ['integracoes.sistemas.http'],
        objective: 'Projetar retentativas que não amplifiquem indisponibilidade nem percam eventos.',
        exercise: 'Documentar quando repetir, quando desistir e como inspecionar itens que falharam definitivamente.',
        completionCriteria: 'Existe limite de tentativas, atraso progressivo e registro consultável de falhas.',
      }),
    ]),
    subject('engenharia-ia.pratica', 'Engenharia de software com IA', [
      topic('engenharia-ia.pratica.contexto', 'Contexto e especificação', ['fornecer arquivos e restrições', 'pedidos pequenos e verificáveis', 'não expor segredos'], {
        material: { title: 'Engenharia de prompts', author: 'OpenAI', url: 'https://platform.openai.com/docs/guides/prompt-engineering' },
        objective: 'Obter ajuda de um assistente com contexto suficiente e sem entregar segredos ou dados pessoais.',
        exercise: 'Especificar uma tarefa pequena informando arquivos relevantes, restrições e critério de aceite.',
        completionCriteria: 'O pedido delimita escopo, entradas, restrições e como o resultado será verificado.',
      }),
      topic('engenharia-ia.pratica.revisao', 'Revisão de código gerado', ['ler antes de aplicar', 'testes e diff', 'licenças e dependências'], {
        prerequisites: ['engenharia-ia.pratica.contexto'],
        objective: 'Aceitar código gerado somente após leitura, teste e revisão de dependências.',
        exercise: 'Revisar uma alteração gerada, identificar efeitos colaterais e cobrir o comportamento com um teste.',
        completionCriteria: 'Diff compreendido, testes executados e nenhuma dependência nova sem justificativa.',
      }),
      topic('engenharia-ia.pratica.automacao', 'Automação com verificação', ['tarefas repetíveis', 'guardrails', 'revisão humana antes de publicar'], {
        prerequisites: ['engenharia-ia.pratica.revisao'],
        objective: 'Automatizar tarefas repetitivas mantendo pontos de verificação antes de mudanças irreversíveis.',
        exercise: 'Automatizar uma verificação local e exigir aprovação humana antes de qualquer publicação.',
        completionCriteria: 'A automação falha de forma segura e não executa deploy, exclusão ou envio sem confirmação.',
      }),
    ]),
    subject('projeto.ai-personal-cfo', 'Construção prática do AI Personal CFO', [
      topic('projeto.ai-personal-cfo.escopo', 'Escopo e dados fictícios', ['problema e usuários', 'modelo de ameaças básico', 'dados fictícios e limites'], {
        priority: 'Alta',
        objective: 'Definir um recorte seguro do produto antes de escrever código financeiro.',
        exercise: 'Escrever o escopo da primeira versão com dados fictícios, exclusões explícitas e riscos conhecidos.',
        completionCriteria: 'Escopo, dados fictícios, limites e riscos estão documentados; nenhuma conta real é conectada.',
      }),
      topic('projeto.ai-personal-cfo.modelagem', 'Modelagem financeira', ['contas, categorias e transações', 'receitas e despesas', 'saldo e integridade'], {
        prerequisites: ['dados.fundamentos.modelagem'],
        objective: 'Representar o domínio financeiro com restrições que impeçam estados inválidos.',
        exercise: 'Modelar contas, categorias e transações fictícias com tipos, sinais e chaves coerentes.',
        completionCriteria: 'O modelo explica receita, despesa, transferência e saldo sem ambiguidade.',
      }),
      topic('projeto.ai-personal-cfo.regras', 'Validação e regras de negócio', ['valores e datas', 'categorias permitidas', 'erros explicáveis'], {
        prerequisites: ['projeto.ai-personal-cfo.modelagem', 'backend.validacao.zod'],
        objective: 'Validar entradas financeiras na borda e no domínio, com mensagens que permitam correção.',
        exercise: 'Rejeitar uma transação fictícia com valor inválido, data futura impossível ou categoria desconhecida.',
        completionCriteria: 'Cada regra tem teste e mensagem de erro compreensível.',
      }),
      topic('projeto.ai-personal-cfo.persistencia', 'SQL e persistência', ['schema e migrações', 'transações', 'consultas de relatório'], {
        prerequisites: ['fundamentos.sql.relacoes', 'dados.fundamentos.transacoes'],
        objective: 'Persistir transações de forma atômica e responder consultas agregadas por período.',
        exercise: 'Criar o schema fictício e uma consulta de gastos por categoria e mês.',
        completionCriteria: 'Escritas usam transação e as consultas retornam resultados conferíveis à mão.',
      }),
      topic('projeto.ai-personal-cfo.api', 'API e backend', ['contratos e validação', 'autenticação e autorização', 'testes de API'], {
        prerequisites: ['backend.crud.entidades', 'backend.autenticacao.tokens', 'projeto.ai-personal-cfo.persistencia'],
        objective: 'Expor operações financeiras com autorização por recurso e contrato validado.',
        exercise: 'Implementar criação e listagem de transações fictícias com teste de acesso negado.',
        completionCriteria: 'Cada operação valida entrada, verifica identidade e testa o caminho não autorizado.',
      }),
      topic('projeto.ai-personal-cfo.testes', 'Testes automatizados', ['unidade e integração', 'casos de borda financeiros', 'dados isolados'], {
        prerequisites: ['qualidade.testes.integracao', 'projeto.ai-personal-cfo.regras'],
        objective: 'Cobrir regras financeiras e persistência com testes repetíveis e dados isolados.',
        exercise: 'Testar arredondamento, sinais, período de competência e duplicidade com dados fictícios.',
        completionCriteria: 'Os testes não dependem de dados reais e cobrem os casos de borda definidos.',
      }),
      topic('projeto.ai-personal-cfo.ia', 'IA para classificação e explicação', ['classificação com categorias fixas', 'explicação e confiança', 'revisão humana e fallback'], {
        prerequisites: ['ia.fundamentos.prompt', 'ia.fundamentos.avaliacao', 'projeto.ai-personal-cfo.testes'],
        objective: 'Usar IA como sugestão auditável, nunca como autoridade sobre valores ou decisões financeiras.',
        exercise: 'Classificar transações fictícias com saída JSON validada e registrar a sugestão sem aplicá-la automaticamente.',
        completionCriteria: 'Saída inválida cai em fallback, a sugestão é revisável e nenhuma ação financeira é automática.',
      }),
      topic('projeto.ai-personal-cfo.relatorios', 'Relatórios, orçamento e análise', ['agregações por período', 'orçamento vs realizado', 'exportação e privacidade'], {
        prerequisites: ['projeto.ai-personal-cfo.persistencia'],
        objective: 'Transformar transações em informação útil sem expor dados além do necessário.',
        exercise: 'Gerar um relatório fictício de orçamento mensal com totais, variação e categorias excedidas.',
        completionCriteria: 'Os números conferem com a base e a exportação remove ou mascara dados sensíveis.',
      }),
      topic('projeto.ai-personal-cfo.entrega', 'Deploy, monitoramento e documentação', ['configuração e segredos', 'logs e métricas sem dados sensíveis', 'runbook e rollback'], {
        prerequisites: ['infraestrutura.deploy.aplicacao', 'projeto.ai-personal-cfo.api'],
        objective: 'Publicar a versão fictícia com configuração segura e procedimento de recuperação.',
        exercise: 'Documentar deploy, rollback e verificação de saúde usando apenas dados fictícios.',
        completionCriteria: 'Segredos ficam fora do repositório, logs não expõem finanças e o rollback foi ensaiado.',
      }),
    ]),
  ],
  especializacoes: [
    subject('especializacao.backend', 'Backend', [topic('especializacao.backend.aprofundamento', 'Aprofundamento backend', ['arquitetura de serviços', 'desempenho e dados', 'observabilidade'])]),
    subject('especializacao.full-stack', 'Full Stack', [topic('especializacao.full-stack.entrega', 'Produto ponta a ponta', ['contratos front/backend', 'UX e acessibilidade', 'entrega e manutenção'])]),
    subject('especializacao.cloud-sre', 'Cloud, DevOps e SRE', [topic('especializacao.cloud-sre.operacao', 'Confiabilidade', ['SLI, SLO e error budget', 'infraestrutura como código', 'resposta a incidentes'])]),
    subject('especializacao.cybersecurity', 'Cybersecurity e AppSec', [topic('especializacao.cybersecurity.pratica', 'Segurança aplicada', ['threat modeling', 'revisão de código', 'resposta e remediação'])]),
    subject('especializacao.ai', 'IA, AI Engineering e automação', [topic('especializacao.ai.sistemas', 'Sistemas com IA', ['avaliação de qualidade', 'guardrails e validação', 'custo, latência e automação'])]),
  ],
  'dsa-leetcode': [
    subject('dsa.topicos', 'Estruturas de dados e algoritmos', [
      topic('dsa.big-o', 'Big O: como medir custo', ['complexidade temporal', 'complexidade espacial', 'melhor, médio e pior caso'], { origin: 'recuperado', objective: 'Estimar como tempo e memória crescem com o tamanho da entrada.', exercise: 'Comparar busca linear, busca binária e dupla iteração por n.', completionCriteria: 'Justifica O(1), O(log n), O(n) e O(n²) com exemplos.' }),
      topic('dsa.array', 'Array: operações e custo', ['acesso e atualização', 'inserção e remoção', 'array dinâmico e custo amortizado'], { origin: 'recuperado', prerequisites: ['dsa.big-o'] }),
      topic('dsa.string', 'String: operações e custo', ['imutabilidade', 'varredura e substrings', 'frequência de caracteres'], { origin: 'recuperado', prerequisites: ['dsa.array'] }),
      topic('dsa.hashmap', 'Hashmap / dicionário', ['hash e colisões', 'contagem e lookup', 'média vs pior caso'], { origin: 'recuperado', prerequisites: ['dsa.array'] }),
      topic('dsa.two-pointers', 'Two pointers', ['ponteiros opostos', 'ponteiros na mesma direção', 'invariantes'], { origin: 'recuperado', prerequisites: ['dsa.array', 'dsa.string'] }),
      topic('dsa.sliding-window', 'Sliding window', ['janela fixa', 'janela variável', 'manter estado incremental'], { origin: 'recuperado', prerequisites: ['dsa.two-pointers'] }),
      topic('dsa.stack-queue', 'Pilhas e filas', ['LIFO e FIFO', 'deque e monotonic stack', 'parênteses e próximos maiores'], { origin: 'proposta', prerequisites: ['dsa.array'] }),
      topic('dsa.binary-search', 'Busca binária', ['invariante de intervalo', 'limites inclusivos e exclusivos', 'busca da fronteira'], { origin: 'proposta', prerequisites: ['dsa.array', 'dsa.big-o'] }),
      topic('dsa.linked-list', 'Listas ligadas', ['nós e referências', 'ponteiro rápido/lento', 'reversão e ciclos'], { origin: 'proposta', prerequisites: ['dsa.two-pointers'] }),
      topic('dsa.recursion-backtracking', 'Recursão e backtracking', ['caso-base', 'escolher, explorar e desfazer', 'podas'], { origin: 'proposta', prerequisites: ['dsa.stack-queue'] }),
      topic('dsa.trees', 'Árvores e BST', ['percursos DFS e BFS', 'propriedade de BST', 'altura e balanceamento'], { origin: 'proposta', prerequisites: ['dsa.recursion-backtracking'] }),
      topic('dsa.heap', 'Heap e fila de prioridade', ['heap mínimo/máximo', 'push e pop', 'top K'], { origin: 'proposta', prerequisites: ['dsa.trees'] }),
      topic('dsa.graphs', 'Grafos: BFS e DFS', ['lista de adjacência', 'visitados e componentes', 'caminhos e ciclos'], { origin: 'proposta', prerequisites: ['dsa.stack-queue'] }),
      topic('dsa.greedy', 'Greedy e intervalos', ['ordenação por critério', 'decisão local e prova', 'sobreposição de intervalos'], { origin: 'proposta', prerequisites: ['dsa.array'] }),
      topic('dsa.dynamic-programming', 'Programação dinâmica', ['estados e recorrência', 'memoization e tabulação', 'complexidade por estados/transições'], { origin: 'proposta', prerequisites: ['dsa.recursion-backtracking'] }),
    ]),
  ],
}

export const studyCatalog: readonly StudyPhase[] = seeds.map((phase) => ({
  ...phase,
  subjects: (subjectsByPhase[phase.id] ?? []).map((item) => makeSubject(item)),
}))

export const studySubjects = studyCatalog.flatMap(({ subjects }) => subjects)
export const studyTopics = studySubjects.flatMap(({ topics }) => topics)
export const topicStatuses = ['Bloqueado', 'Disponível', 'Em andamento', 'Concluído'] as const
export type TopicStatus = (typeof topicStatuses)[number]

export interface CurriculumArea {
  id: string
  title: string
  description: string
  subjectIds: readonly string[]
}

/**
 * As 20 matérias do roadmap na ordem de estudo definida pelo usuário.
 * Matérias de base (Python, projeto full stack) e especializações futuras
 * continuam no catálogo, mas não entram neste mapa de 20 áreas.
 */
export const curriculumAreas: readonly CurriculumArea[] = [
  { id: 'area.javascript', title: 'JavaScript', description: 'Linguagem, arrays, navegador e assincronismo.', subjectIds: ['web.javascript'] },
  { id: 'area.git-github', title: 'Git e GitHub', description: 'Histórico, branches, colaboração e revisão.', subjectIds: ['fundamentos.git-github'] },
  { id: 'area.html-css', title: 'HTML e CSS', description: 'Estrutura semântica, formulários, layout e estilo acessível.', subjectIds: ['web.html', 'web.css'] },
  { id: 'area.typescript', title: 'TypeScript', description: 'Tipos, funções e limites da checagem estática.', subjectIds: ['web.typescript'] },
  { id: 'area.react', title: 'React', description: 'Componentes, estado, efeitos e acessibilidade.', subjectIds: ['web.react'] },
  { id: 'area.vite', title: 'Vite e ferramentas de desenvolvimento', description: 'Dev server, build, configuração e verificação contínua.', subjectIds: ['web.vite'] },
  { id: 'area.arquitetura', title: 'Arquitetura de software', description: 'Modelagem orientada a objetos, SOLID, padrões e limites arquiteturais.', subjectIds: ['fundamentos.poo', 'engenharia.clean-code', 'engenharia.soc', 'engenharia.solid', 'engenharia.di', 'engenharia.patterns', 'engenharia.layered', 'engenharia.modular-monolith', 'engenharia.clean-architecture', 'engenharia.ddd', 'engenharia.microservices', 'engenharia.event-driven'] },
  { id: 'area.persistencia', title: 'Persistência e bancos de dados', description: 'Modelagem, transações, backup e bancos locais.', subjectIds: ['dados.fundamentos', 'fundamentos.sqlite', 'fundamentos.crud-python'] },
  { id: 'area.testes', title: 'Testes', description: 'Testes unitários, integração, API e pytest.', subjectIds: ['qualidade.testes', 'qualidade.pytest'] },
  { id: 'area.node', title: 'Node.js', description: 'Runtime, módulos, arquivos, HTTP e configuração.', subjectIds: ['backend.node'] },
  { id: 'area.http-apis', title: 'HTTP e APIs', description: 'Cliente/servidor, HTTP, REST, JSON e consumo de APIs.', subjectIds: ['web.fundamentos'] },
  { id: 'area.sql', title: 'SQL', description: 'Consultas, agregações, relações e transações.', subjectIds: ['fundamentos.sql'] },
  { id: 'area.orm-validacao', title: 'ORM e validação de dados', description: 'Mapeamento objeto-relacional, migrações e validação em runtime.', subjectIds: ['backend.orm', 'backend.validacao'] },
  { id: 'area.backend', title: 'Backend', description: 'FastAPI, PostgreSQL, CRUD, autenticação e autorização.', subjectIds: ['backend.fastapi', 'backend.postgresql', 'backend.integracao', 'backend.crud', 'backend.autenticacao', 'backend.autorizacao'] },
  { id: 'area.ia', title: 'Inteligência artificial', description: 'LLMs, prompt, avaliação e limites.', subjectIds: ['ia.fundamentos'] },
  { id: 'area.integracoes', title: 'Integrações', description: 'HTTP entre serviços, webhooks, falhas e retentativas.', subjectIds: ['integracoes.sistemas'] },
  { id: 'area.seguranca', title: 'Segurança', description: 'OWASP, identidade, credenciais, TLS e defesas HTTP.', subjectIds: ['seguranca.web', 'seguranca.identidade', 'seguranca.credenciais', 'seguranca.transporte', 'seguranca.defesa'] },
  { id: 'area.deploy', title: 'Deploy e infraestrutura', description: 'Linux, Docker, configuração, DNS, CI/CD e cloud.', subjectIds: ['infraestrutura.linux', 'infraestrutura.ssh', 'infraestrutura.docker', 'infraestrutura.compose', 'infraestrutura.configuracao', 'infraestrutura.deploy', 'infraestrutura.https', 'infraestrutura.cicd', 'infraestrutura.cloud'] },
  { id: 'area.engenharia-ia', title: 'Engenharia de software com IA', description: 'Contexto, revisão de código gerado e automação com verificação.', subjectIds: ['engenharia-ia.pratica'] },
  { id: 'area.ai-cfo', title: 'Construção prática do AI Personal CFO', description: 'Projeto financeiro fictício, da modelagem ao deploy.', subjectIds: ['projeto.ai-personal-cfo'] },
]

export function findCurriculumAreaForSubject(subjectId: string): CurriculumArea | undefined {
  return curriculumAreas.find(({ subjectIds }) => subjectIds.includes(subjectId))
}

export function findStudyTopic(topicId: string): { phase: StudyPhase; subject: StudySubject; topic: StudyTopic } | undefined {
  for (const phase of studyCatalog) {
    for (const subjectItem of phase.subjects) {
      const found = subjectItem.topics.find(({ id }) => id === topicId)
      if (found) return { phase, subject: subjectItem, topic: found }
    }
  }
  return undefined
}

export function validateStudyCatalog(catalog: readonly StudyPhase[] = studyCatalog): void {
  const ids = new Set<string>()
  const topics = catalog.flatMap(({ subjects }) => subjects.flatMap(({ topics: items }) => items))
  const topicIds = new Set(topics.map(({ id }) => id))
  for (const phase of catalog) {
    if (!phase.id.trim() || !phase.title.trim() || ids.has(phase.id)) throw new Error(`Fase inválida ou duplicada: ${phase.id}`)
    ids.add(phase.id)
    for (const subjectItem of phase.subjects) {
      if (!subjectItem.id.trim() || !subjectItem.title.trim() || ids.has(subjectItem.id)) throw new Error(`Matéria inválida ou duplicada: ${subjectItem.id}`)
      ids.add(subjectItem.id)
      for (const topicItem of subjectItem.topics) {
        if (!topicItem.id.trim() || !topicItem.title.trim() || ids.has(topicItem.id)) throw new Error(`Tópico inválido ou duplicado: ${topicItem.id}`)
        ids.add(topicItem.id)
        if (topicItem.material && (!/^https:\/\//.test(topicItem.material.url) || !topicItem.material.title.trim())) throw new Error(`Material inválido no tópico ${topicItem.id}`)
        for (const child of topicItem.subtopics) {
          if (!child.id.startsWith(`${topicItem.id}.`) || !child.title.trim() || ids.has(child.id)) throw new Error(`Subtópico inválido ou duplicado: ${child.id}`)
          ids.add(child.id)
        }
      }
    }
  }
  for (const topicItem of topics) {
    for (const prerequisite of topicItem.prerequisites ?? []) {
      if (!topicIds.has(prerequisite)) throw new Error(`Pré-requisito inexistente em ${topicItem.id}: ${prerequisite}`)
    }
  }
  const subjectIds = new Set(catalog.flatMap(({ subjects }) => subjects.map(({ id }) => id)))
  const areaIds = new Set<string>()
  const assignedSubjects = new Set<string>()
  for (const area of curriculumAreas) {
    if (!area.id.trim() || !area.title.trim() || areaIds.has(area.id)) throw new Error(`Área de currículo inválida ou duplicada: ${area.id}`)
    areaIds.add(area.id)
    if (area.subjectIds.length === 0) throw new Error(`Área de currículo sem matérias: ${area.id}`)
    for (const subjectId of area.subjectIds) {
      if (!subjectIds.has(subjectId)) throw new Error(`Matéria inexistente na área ${area.id}: ${subjectId}`)
      if (assignedSubjects.has(subjectId)) throw new Error(`Matéria associada a mais de uma área: ${subjectId}`)
      assignedSubjects.add(subjectId)
    }
  }
}

export function validateCurriculumAreas(areas: readonly CurriculumArea[] = curriculumAreas): void {
  if (areas.length !== 20) throw new Error(`O roadmap deve conter 20 matérias; encontrado: ${areas.length}`)
  for (const area of areas) {
    if (!area.id.trim() || !area.title.trim() || !area.description.trim()) throw new Error(`Área de currículo incompleta: ${area.id}`)
  }
}
