import type { LearningResource, RoadmapModule, RoadmapStage } from './studyData'

type Video = Omit<LearningResource, 'learning'>
type ModuleSeed = {
  id: string
  title: string
  summary: string
  concepts: string
  guidedPractice: string
  independentPractice: string
  validation: string
  documentation?: Video
  portugueseVideo: Video
  englishVideo: Video
}

const seeds: ModuleSeed[] = [
  {
    id: 'fundamentos',
    title: 'Fundamentos da programação',
    summary: 'Transforme problemas em algoritmos, dados, decisões e passos executáveis.',
    concepts: 'Algoritmos, variáveis, tipos, expressões, condições, repetição e decomposição.',
    guidedPractice: 'Escreva pseudocódigo para calcular um orçamento mensal e trate entradas inválidas.',
    independentPractice: 'Implemente um conversor de moedas com validação e casos de borda.',
    validation: 'Resolva um problema novo explicando entradas, saídas, decisões e complexidade básica.',
    documentation: { title: 'Aprender desenvolvimento web: primeiros passos', author: 'MDN', url: 'https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Getting_started' },
    portugueseVideo: { title: 'Introdução a Algoritmos - Curso de Algoritmos #01', author: 'Gustavo Guanabara · Curso em Vídeo', url: 'https://www.youtube.com/watch?v=8mei6uVttho' },
    englishVideo: { title: 'Introduction to Programming and Computer Science - Full Course', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=zOjov-2OZ0E' },
  },
  {
    id: 'javascript',
    title: 'JavaScript',
    summary: 'Domine a linguagem que será usada no frontend e no backend do projeto.',
    concepts: 'Valores, funções, arrays, objetos, módulos, erros, promessas e operações assíncronas.',
    guidedPractice: 'Construa funções pequenas para categorizar e somar despesas de um conjunto fictício.',
    independentPractice: 'Modele transações com objetos e implemente filtros sem copiar um tutorial.',
    validation: 'Explique escopo, mutabilidade e async/await e resolva um exercício com dados próprios.',
    documentation: { title: 'Guia JavaScript', author: 'MDN', url: 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide' },
    portugueseVideo: { title: 'O que o JavaScript é capaz de fazer? - Curso JavaScript #01', author: 'Gustavo Guanabara · Curso em Vídeo', url: 'https://www.youtube.com/watch?v=Ptbk2af68e8' },
    englishVideo: { title: 'Learn JavaScript - Full Course for Beginners', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg' },
  },
  {
    id: 'git-github',
    title: 'Git e GitHub',
    summary: 'Versione mudanças com segurança e colabore sem perder histórico.',
    concepts: 'Repositórios, commits, branches, merges, conflitos, pull requests e revisão.',
    guidedPractice: 'Crie um repositório local, faça commits pequenos e abra uma branch para uma alteração.',
    independentPractice: 'Simule uma correção com branch, merge e resolução deliberada de conflito.',
    validation: 'Recupere uma versão anterior e explique a diferença entre Git e GitHub.',
    documentation: { title: 'Livro Pro Git em português', author: 'Git', url: 'https://git-scm.com/book/pt-br/v2' },
    portugueseVideo: { title: 'O que é Git? O que é versionamento? - Curso de Git e GitHub', author: 'Gustavo Guanabara · Curso em Vídeo', url: 'https://www.youtube.com/watch?v=xEKo29OWILE' },
    englishVideo: { title: 'Git & GitHub Crash Course for Beginners [2026]', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=mAFoROnOfHs' },
  },
  {
    id: 'html-css',
    title: 'HTML e CSS',
    summary: 'Estruture interfaces semânticas e crie layouts acessíveis e responsivos.',
    concepts: 'Semântica HTML, formulários, cascata, box model, flexbox, grid e media queries.',
    guidedPractice: 'Reproduza uma tela de resumo financeiro usando HTML semântico e CSS responsivo.',
    independentPractice: 'Crie uma página de transações com estados vazio, carregando e erro.',
    validation: 'Inspecione acessibilidade, navegação por teclado e comportamento em viewport estreita.',
    documentation: { title: 'Estruturar conteúdo com HTML', author: 'MDN', url: 'https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Structuring_content' },
    portugueseVideo: { title: 'O que vamos aprender no módulo 01? - HTML5 + CSS3', author: 'Gustavo Guanabara · Curso em Vídeo', url: 'https://www.youtube.com/watch?v=jgQjeqGRdgA' },
    englishVideo: { title: 'Learn HTML & CSS – Full Course for Beginners', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=a_iQb1lnAEQ' },
  },
  {
    id: 'typescript',
    title: 'TypeScript',
    summary: 'Modele dados e contratos para reduzir erros em tempo de desenvolvimento.',
    concepts: 'Inferência, tipos, interfaces, unions, generics, narrowing e validação em runtime.',
    guidedPractice: 'Tipifique transações, categorias e funções de agregação com entradas desconhecidas.',
    independentPractice: 'Evolua os modelos financeiros sem recorrer a any e documente as invariantes.',
    validation: 'Implemente uma união discriminada e demonstre como o compilador protege os casos.',
    documentation: { title: 'TypeScript Handbook', author: 'TypeScript', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
    portugueseVideo: { title: 'Curso completo de Typescript em NodeJs', author: 'Rincko Dev', url: 'https://www.youtube.com/watch?v=4pIo-p6pX34' },
    englishVideo: { title: 'Learn TypeScript – Full Tutorial', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=30LWjhZzg50' },
  },
  {
    id: 'react',
    title: 'React',
    summary: 'Construa interfaces declarativas a partir de componentes e estado previsível.',
    concepts: 'Componentes, props, estado, eventos, efeitos, formulários e composição.',
    guidedPractice: 'Construa uma lista de despesas com filtros e formulário controlado.',
    independentPractice: 'Implemente um resumo financeiro reutilizável com estados de carregamento.',
    validation: 'Explique o fluxo de estado e corrija um efeito redundante sem copiar a solução.',
    documentation: { title: 'Aprenda React', author: 'React', url: 'https://react.dev/learn' },
    portugueseVideo: { title: 'Curso de React - Parte 1', author: 'Julio Code', url: 'https://www.youtube.com/watch?v=DxfHxJ5m0N8' },
    englishVideo: { title: 'Learn React JS - Full Beginner’s Tutorial & Practice Projects', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=x4rFhThSX04' },
  },
  {
    id: 'vite-ferramentas',
    title: 'Vite e ferramentas de desenvolvimento',
    summary: 'Entenda o ciclo de desenvolvimento, scripts, dependências e build.',
    concepts: 'Servidor de desenvolvimento, módulos, build, variáveis de ambiente e ferramentas npm.',
    guidedPractice: 'Configure scripts de desenvolvimento, build e lint para um pequeno frontend.',
    independentPractice: 'Analise e corrija um build quebrado sem alterar dependências desnecessárias.',
    validation: 'Gere a versão de produção e explique como servir os artefatos localmente.',
    documentation: { title: 'Guia do Vite', author: 'Vite', url: 'https://vite.dev/guide/' },
    portugueseVideo: { title: 'Aulão de ReactJS pra Iniciantes, com Vite e TypeScript', author: 'LuizTools', url: 'https://www.youtube.com/watch?v=oqXNj8umBXI' },
    englishVideo: { title: 'Vite in 100 Seconds', author: 'Fireship', url: 'https://www.youtube.com/watch?v=KCrXgy8qtjM' },
  },
  {
    id: 'arquitetura',
    title: 'Arquitetura de software',
    summary: 'Separe responsabilidades e modele limites que facilitem evolução e testes.',
    concepts: 'Coesão, acoplamento, camadas, módulos, dependências e decisões arquiteturais.',
    guidedPractice: 'Separe regras de cálculo financeiro da interface e descreva seus contratos.',
    independentPractice: 'Proponha módulos para importar, categorizar e resumir transações.',
    validation: 'Justifique uma decisão de arquitetura e identifique uma alternativa e seu custo.',
    documentation: { title: 'Software Architecture Guide', author: 'Martin Fowler', url: 'https://martinfowler.com/architecture/' },
    portugueseVideo: { title: 'Curso Arquitetura de software - Introdução', author: 'Filipe Morelli Developer', url: 'https://www.youtube.com/watch?v=VvZRKZVItEE' },
    englishVideo: { title: 'Design Software Systems Like a Senior Engineer – Complete Course', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=soTfFFIQQ8U' },
  },
  {
    id: 'persistencia',
    title: 'Persistência e bancos de dados',
    summary: 'Escolha estruturas persistentes e entenda transações e integridade.',
    concepts: 'Tabelas, documentos, chaves, índices, transações, consistência e backup.',
    guidedPractice: 'Desenhe o armazenamento de contas, categorias e transações com restrições.',
    independentPractice: 'Implemente uma gravação transacional e um fluxo seguro de backup fictício.',
    validation: 'Explique como uma falha no meio da gravação afeta consistência e recuperação.',
    documentation: { title: 'Tutorial do PostgreSQL', author: 'PostgreSQL', url: 'https://www.postgresql.org/docs/current/tutorial.html' },
    portugueseVideo: { title: 'Introdução ao PostgreSQL - Curso de Postgres', author: 'Bóson Treinamentos', url: 'https://www.youtube.com/watch?v=Z_SPrzlT4Fc' },
    englishVideo: { title: 'SQL Tutorial - Full Database Course for Beginners', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY' },
  },
  {
    id: 'testes',
    title: 'Testes',
    summary: 'Verifique comportamento e impeça regressões com testes reproduzíveis.',
    concepts: 'Testes unitários, integração, ponta a ponta, fixtures e comportamento esperado.',
    guidedPractice: 'Escreva testes para classificação de despesas e validação de entradas.',
    independentPractice: 'Teste um fluxo de criação e edição, incluindo falhas e dados ausentes.',
    validation: 'Demonstre que um teste falha antes da correção e passa depois dela.',
    documentation: { title: 'Guia do Vitest', author: 'Vitest', url: 'https://vitest.dev/guide/' },
    portugueseVideo: { title: 'Testes Unitários do Zero: o que são, por que usar e como começar', author: 'Manual do Front', url: 'https://www.youtube.com/watch?v=yV_61piC-nM' },
    englishVideo: { title: 'Software Testing Course – Playwright, E2E, and AI Agents', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=jydYq7oAtD8' },
  },
  {
    id: 'node',
    title: 'Node.js',
    summary: 'Execute JavaScript no servidor e compreenda módulos e APIs do runtime.',
    concepts: 'Event loop, módulos, npm, filesystem, processos e operações assíncronas.',
    guidedPractice: 'Leia um arquivo de transações e calcule totais com tratamento de erros.',
    independentPractice: 'Crie uma ferramenta de linha de comando para resumir dados CSV locais.',
    validation: 'Explique operações bloqueantes e não bloqueantes e teste um erro de leitura.',
    documentation: { title: 'Introdução ao Node.js', author: 'Node.js', url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs' },
    portugueseVideo: { title: 'Curso de Node.JS - O que é Node.JS #01', author: 'Victor Lima - Ciência da Computação', url: 'https://www.youtube.com/watch?v=LLqq6FemMNQ' },
    englishVideo: { title: 'Node.js and Express.js - Full Course', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=Oe421EPjeBE' },
  },
  {
    id: 'http-apis',
    title: 'HTTP e APIs',
    summary: 'Projete e consuma APIs com contratos claros e respostas previsíveis.',
    concepts: 'HTTP, métodos, códigos de resposta, headers, JSON, REST e Fetch.',
    guidedPractice: 'Consuma uma API pública de exemplo e trate carregamento e erros de rede.',
    independentPractice: 'Desenhe endpoints para transações e explique verbos e códigos de resposta.',
    validation: 'Inspecione uma requisição HTTP e identifique método, status, headers e corpo.',
    documentation: { title: 'Visão geral do HTTP', author: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview' },
    portugueseVideo: { title: 'O que é API (em 2 minutos)', author: 'Yudi Ganeko', url: 'https://www.youtube.com/watch?v=Q-lyQ7BdDXE' },
    englishVideo: { title: 'Full HTTP Networking Course – Fetch and REST APIs in JavaScript', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=2JYT5f2isg4' },
  },
  {
    id: 'sql',
    title: 'SQL',
    summary: 'Consulte, filtre e relacione dados com consultas legíveis e corretas.',
    concepts: 'SELECT, filtros, agregações, joins, agrupamento e subconsultas.',
    guidedPractice: 'Consulte transações por período, categoria e totais mensais.',
    independentPractice: 'Escreva consultas para responder perguntas financeiras sem duplicar linhas.',
    validation: 'Explique o resultado de um join e teste casos sem registros relacionados.',
    documentation: { title: 'Tutorial do PostgreSQL: SQL', author: 'PostgreSQL', url: 'https://www.postgresql.org/docs/current/tutorial-sql.html' },
    portugueseVideo: { title: 'Curso SQL Completo 2025 [Iniciantes] + Desafios + Muita Prática', author: 'Dev Aprender · Jhonatan de Souza', url: 'https://www.youtube.com/watch?v=G7bMwefn8RQ' },
    englishVideo: { title: 'SQL Tutorial - Full Database Course for Beginners', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY' },
  },
  {
    id: 'orm-validacao',
    title: 'ORM e validação de dados',
    summary: 'Converta modelos e valide entradas em limites de confiança.',
    concepts: 'Mapeamento objeto-relacional, migrations, schemas e validação de runtime.',
    guidedPractice: 'Modele uma transação e valide valor, data e categoria antes de persistir.',
    independentPractice: 'Crie uma migration aditiva e valide uma importação com erros por campo.',
    validation: 'Diferencie tipos estáticos de validação em runtime e reverta uma migration fictícia.',
    documentation: { title: 'O que é Prisma ORM?', author: 'Prisma', url: 'https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma' },
    portugueseVideo: { title: 'Aprenda em 13:37: Prisma', author: 'Luís Rudge', url: 'https://www.youtube.com/watch?v=uApCW1gcpdE' },
    englishVideo: { title: 'What is an ORM and what does it do?', author: 'Code With Bubb', url: 'https://www.youtube.com/watch?v=EwpT466EyP4' },
  },
  {
    id: 'backend',
    title: 'Backend',
    summary: 'Organize serviços, validação, autorização e persistência no servidor.',
    concepts: 'Controllers, serviços, injeção de dependências, DTOs e limites de confiança.',
    guidedPractice: 'Implemente um endpoint de leitura e criação de transações com validação.',
    independentPractice: 'Adicione paginação e erros consistentes a uma rota de demonstração.',
    validation: 'Teste a rota por sucesso, entrada inválida e falha de persistência.',
    documentation: { title: 'Documentação NestJS', author: 'NestJS', url: 'https://docs.nestjs.com/' },
    portugueseVideo: { title: 'Aula 01 - O que é NestJS [Tutorial NestJS 2024]', author: 'Breno Veras', url: 'https://www.youtube.com/watch?v=Os8rbrc_lXk' },
    englishVideo: { title: 'NestJs Course for Beginners - Create a REST API', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=GHTA143_b-s' },
  },
  {
    id: 'inteligencia-artificial',
    title: 'Inteligência artificial',
    summary: 'Integre modelos com contexto, limites, validação e avaliação.',
    concepts: 'Tokens, prompts, respostas estruturadas, ferramentas, custos e avaliação.',
    guidedPractice: 'Desenhe uma categorização assistida com resposta validada e fallback explícito.',
    independentPractice: 'Especifique entradas, saída estruturada, limite de custo e casos de avaliação.',
    validation: 'Teste respostas incompletas e explique por que saída de IA não é confiável por padrão.',
    documentation: { title: 'Visão geral da API', author: 'OpenAI', url: 'https://platform.openai.com/docs/overview' },
    portugueseVideo: { title: 'Responses API: Tudo o que você precisa saber', author: 'Felipe Raitano', url: 'https://www.youtube.com/watch?v=Er7kcRpgVso' },
    englishVideo: { title: 'OpenAI Responses API: Add Custom Tools (Function Calling in Python)', author: 'Leon van Zyl', url: 'https://www.youtube.com/watch?v=3eU9kA-qfmg' },
  },
  {
    id: 'integracoes',
    title: 'Integrações',
    summary: 'Conecte serviços com contratos, idempotência e tratamento de falhas.',
    concepts: 'Autenticação de API, webhooks, retries, idempotência, limites e observabilidade.',
    guidedPractice: 'Simule o recebimento duplicado de um webhook e torne o processamento idempotente.',
    independentPractice: 'Especifique uma integração financeira sem expor tokens no cliente.',
    validation: 'Verifique como a integração se comporta diante de timeout e repetição.',
    documentation: { title: 'Usar Fetch', author: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
    portugueseVideo: { title: 'O que é API? O que é REST? O que é RESTful?', author: 'Serliv · Daniel Tapias Morales', url: 'https://www.youtube.com/watch?v=umaXYEbd5vA' },
    englishVideo: { title: 'APIs Explained (in 4 Minutes)', author: 'Aced (formerly Exponent)', url: 'https://www.youtube.com/watch?v=bxuYDT-BWaI' },
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    summary: 'Reduza riscos protegendo entradas, sessões, segredos e dados.',
    concepts: 'OWASP, autorização, validação, armazenamento de segredos e princípio do menor privilégio.',
    guidedPractice: 'Revise uma rota e identifique validação insuficiente, exposição de dados e abuso de acesso.',
    independentPractice: 'Crie uma lista de controles para proteger dados financeiros sensíveis.',
    validation: 'Demonstre um controle defensivo e explique o risco que ele reduz.',
    documentation: { title: 'OWASP Cheat Sheet Series', author: 'OWASP', url: 'https://cheatsheetseries.owasp.org/' },
    portugueseVideo: { title: 'TOP 10 Ameaças de Segurança em Aplicações Web - Dicas de prevenção', author: 'Código Fonte TV', url: 'https://www.youtube.com/watch?v=OzBy8nYLY-I' },
    englishVideo: { title: 'OWASP API Security Top 10 Course – Secure Your Web Apps', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=YYe0FdfdgDU' },
  },
  {
    id: 'deploy-infraestrutura',
    title: 'Deploy e infraestrutura',
    summary: 'Prepare builds reproduzíveis, configuração e operação de serviços.',
    concepts: 'Ambientes, variáveis, containers, logs, health checks e estratégias de deploy.',
    guidedPractice: 'Containerize uma aplicação de demonstração e documente como executá-la.',
    independentPractice: 'Defina um fluxo de build e deploy com configuração fora do código.',
    validation: 'Reproduza o ambiente e diagnostique um serviço que não inicia.',
    documentation: { title: 'Começar com Docker', author: 'Docker', url: 'https://docs.docker.com/get-started/' },
    portugueseVideo: { title: 'Aprenda Docker do zero | Tutorial completo com deploy', author: 'Fernanda Kipper', url: 'https://www.youtube.com/watch?v=DdoncfOdru8' },
    englishVideo: { title: 'Learn Docker – Full DevOps Course for Deploying Containerized Apps', author: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=rjjES5IsPdg' },
  },
  {
    id: 'engenharia-com-ia',
    title: 'Engenharia de software com IA',
    summary: 'Use assistentes como apoio mantendo revisão, testes e responsabilidade técnica.',
    concepts: 'Especificação, contexto, revisão de diffs, testes e limites de geração automática.',
    guidedPractice: 'Peça uma alteração pequena a um assistente, revise o diff e execute testes relevantes.',
    independentPractice: 'Divida uma tarefa em especificação, implementação assistida e validação independente.',
    validation: 'Identifique um erro plausível em código gerado e explique como o detectou.',
    documentation: { title: 'Prompt engineering para Copilot Chat', author: 'GitHub Docs', url: 'https://docs.github.com/en/copilot/concepts/prompt-engineering-for-copilot-chat' },
    portugueseVideo: { title: 'IA para código: como desenvolvedores viram 10x mais produtivos', author: 'Alexandre Caramaschi', url: 'https://www.youtube.com/watch?v=UbBiQTz9Hfg' },
    englishVideo: { title: 'Spec-Driven Development: AI Assisted Coding Explained', author: 'IBM Technology', url: 'https://www.youtube.com/watch?v=mViFYTwWvcM' },
  },
  {
    id: 'ai-personal-cfo',
    title: 'Construção prática do AI Personal CFO',
    summary: 'Aplique os módulos progressivamente em um produto de finanças pessoais.',
    concepts: 'Escopo, usuários, domínio financeiro, arquitetura, privacidade e entregas incrementais.',
    guidedPractice: 'Defina um fluxo vertical pequeno: registrar uma transação e mostrar um resumo local.',
    independentPractice: 'Implemente uma entrega com validação, testes e documentação das decisões.',
    validation: 'Demonstre o fluxo, revise os riscos de dados e explique escolhas sem depender do tutorial.',
    portugueseVideo: { title: 'Criando app de finanças pessoais (parte 1)', author: 'Rafael Fischer - Dev & Design', url: 'https://www.youtube.com/watch?v=xgGm9a1GJWs' },
    englishVideo: { title: 'Build & Deploy Full Stack Next.js Expense Tracker app', author: 'TubeGuruji', url: 'https://www.youtube.com/watch?v=pQoHvx0SoiA' },
  },
]

const stepDefinitions = [
  { suffix: 'compreender', title: 'Compreender e observar', objective: (module: ModuleSeed) => module.concepts, activity: (module: ModuleSeed) => `Observe a demonstração no material recomendado e explique com suas palavras os conceitos: ${module.concepts}` },
  { suffix: 'guiada', title: 'Prática guiada', objective: (module: ModuleSeed) => `Acompanhe uma implementação orientada de ${module.title}.`, activity: (module: ModuleSeed) => module.guidedPractice },
  { suffix: 'independente', title: 'Prática independente e aplicação', objective: (module: ModuleSeed) => `Aplique ${module.title} sem seguir um passo a passo e, quando fizer sentido, conecte o resultado ao AI Personal CFO.`, activity: (module: ModuleSeed) => module.independentPractice },
  { suffix: 'autonomia', title: 'Teste de compreensão e autonomia', objective: (module: ModuleSeed) => `Comprove que consegue utilizar ${module.title} e explicar as decisões sem depender de instruções constantes.`, activity: (module: ModuleSeed) => module.validation },
] as const

function resource(video: Video, learning: string): LearningResource {
  return { ...video, learning }
}

const modules: RoadmapModule[] = seeds.map((seed, moduleIndex) => {
  const previousModule = seeds[moduleIndex - 1]
  const stages: RoadmapStage[] = stepDefinitions.map((definition, stepIndex) => {
    const id = `${seed.id}-${definition.suffix}`
    const previousStageId = stepIndex > 0
      ? `${seed.id}-${stepDefinitions[stepIndex - 1].suffix}`
      : previousModule
        ? `${previousModule.id}-${stepDefinitions[stepDefinitions.length - 1].suffix}`
        : undefined
    const objective = definition.objective(seed)
    const learning = `Use este recurso como apoio: ${objective}`
    const resources = [
      resource(seed.portugueseVideo, learning),
      resource(seed.englishVideo, learning),
      ...(seed.documentation ? [resource(seed.documentation, `Consulte a referência oficial para aprofundar: ${objective}`)] : []),
    ]
    return {
      id,
      moduleId: seed.id,
      title: definition.title,
      objective,
      activity: definition.activity(seed),
      prerequisites: previousStageId ? [previousStageId] : [],
      resources,
    }
  })
  return {
    id: seed.id,
    title: seed.title,
    summary: seed.summary,
    concepts: seed.concepts,
    guidedPractice: seed.guidedPractice,
    independentPractice: seed.independentPractice,
    validation: seed.validation,
    stages,
  }
})

export const learningRoadmap: readonly RoadmapModule[] = modules
export const roadmapStages: readonly RoadmapStage[] = modules.flatMap(({ stages }) => stages)
