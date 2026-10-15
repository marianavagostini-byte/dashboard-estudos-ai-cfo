# Dashboard de Estudos - AI Personal CFO

![Build](https://img.shields.io/github/actions/workflow/status/marianavagostini-byte/dashboard-estudos-ai-cfo/build.yml?branch=main&label=build)
![Testes](https://img.shields.io/github/actions/workflow/status/marianavagostini-byte/dashboard-estudos-ai-cfo/tests.yml?branch=main&label=testes)
![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)

Aplicação local para organizar uma trilha prática de programação e acompanhar sua aplicação na construção de um **AI Personal CFO** (assistente financeiro pessoal).

## Sobre o projeto

O dashboard organiza o aprendizado em **21 módulos e 84 etapas**. Cada etapa combina conceitos essenciais, materiais em português e inglês, uma atividade prática relacionada ao produto financeiro e um seletor simples de progresso. A trilha pode ser acompanhada sem preencher diários ou formulários de anotação para avançar.

O projeto é uma ferramenta de estudo pessoal, não um sistema financeiro: não processa transações, não executa código enviado pelo usuário e não se conecta a serviços de inteligência artificial.

## Demonstração visual

### Visão geral

![Visão geral do dashboard de estudos](docs/assets/overview.png)

### Roadmap interativo

![Roadmap interativo com módulos, etapa selecionada e materiais bilingues](docs/assets/roadmap.png)

### Detalhes da etapa

![Detalhes da etapa com conceitos, prática, recursos e progresso](docs/assets/stage-details.png)

### Marcos do projeto AI CFO

![Marcos de implementação do projeto AI Personal CFO](docs/assets/project-milestones.png)

### Configurações e backups

![Configurações locais de exportação e restauração de backup](docs/assets/settings.png)

## Funcionalidades

- **Roadmap interativo com 84 etapas:** quatro etapas em cada módulo, com status **Não iniciado**, **Em andamento**, **Treinando** e **Concluído**.
- **Conteúdo integrado:** conceitos, objetivo da etapa e exercícios aplicados ao AI Personal CFO em uma única interface.
- **Recursos bilingues:** cada etapa inclui um vídeo ou aula em português (PT-BR) e um em inglês (EN), com links abertos em nova aba; algumas etapas também incluem documentação.
- **Progresso visual:** linha clicável de 84 etapas, realce das etapas concluídas e indicação pulsante da próxima etapa recomendada.
- **Visão geral do ritmo:** progresso geral, etapas concluídas, etapas em andamento/treino e estimativa aproximada de término baseada nas datas de conclusão registradas.
- **Marcos do projeto:** acompanha marcos práticos do AI Personal CFO e compartilha seu progresso com o roadmap.
- **Revisões espaçadas:** etapas concluídas podem ser revistas em intervalos de 1, 3, 7 e 14 dias.
- **Backup JSON:** exportação dos dados e importação por mesclagem ou substituição. A mesclagem é o modo padrão; a substituição exige confirmação.
- **Interface responsiva e tema escuro:** navegação e conteúdo adaptados a telas menores.

## Arquitetura

O frontend é uma aplicação React de página única. O catálogo da trilha é separado dos registros de progresso: o catálogo é definido no código e os estados escolhidos pelo usuário são persistidos localmente no navegador.

```text
.
├── .github/
│   └── workflows/
│       ├── build.yml
│       └── tests.yml
├── .gitignore
├── LICENSE
├── docs/
│   └── assets/
│       ├── overview.png
│       ├── roadmap.png
│       ├── stage-details.png
│       ├── project-milestones.png
│       └── settings.png
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── learningRoadmap.ts
│   ├── main.tsx
│   ├── StudyWorkspace.tsx
│   ├── studyData.ts
│   └── studyDatabase.ts
├── tests/
│   └── studyData.test.mjs
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── tsconfig*.json
├── vite.config.ts
└── .oxlintrc.json
```

### Componentes e fluxo de dados

- **`src/main.tsx`** inicializa a aplicação React.
- **`src/App.tsx`** compõe a navegação e a visão geral, carrega os registros, mantém o estado da interface e deriva os indicadores de progresso.
- **`src/StudyWorkspace.tsx`** apresenta o roadmap, os detalhes e recursos da etapa, os marcos do projeto e as opções de backup.
- **`src/learningRoadmap.ts`** contém os módulos, etapas, objetivos, atividades práticas e links curados. O catálogo possui 21 módulos com quatro etapas cada.
- **`src/studyData.ts`** centraliza tipos e regras de domínio, incluindo estados, recomendação da próxima etapa, revisões, cálculo de progresso e validação de backups.
- **`src/studyDatabase.ts`** encapsula as operações de leitura, gravação, importação e exportação no IndexedDB.
- **`src/App.css`** define os componentes e layouts da aplicação. **`src/index.css`** fornece variáveis de tema, estilos globais e foco acessível.
- **`tests/studyData.test.mjs`** testa as regras de domínio e os formatos de dados com o executor de testes integrado ao Node.js.

O estado transitório da interface é gerenciado com os hooks do React. **Não há `localStorage`**: os dados persistentes ficam no IndexedDB, no banco `dashboard-estudos`, versão de esquema 1, nas stores `records` e `settings`. O aplicativo não usa backend nem sincronização em nuvem.

Os registros são vinculados à origem e ao perfil do navegador. Limpar os dados do site ou mudar de perfil/navegador pode tornar os registros locais inacessíveis; exporte backups periodicamente. A importação por substituição sobrescreve os dados locais e deve ser usada somente após salvar um backup atualizado.

## Requisitos

- Node.js **20.19 ou superior** ou **22.12 ou superior**.
- npm (incluído com Node.js).
- Navegador moderno com suporte a IndexedDB.

## Instalação e execução local

Na raiz do projeto:

```bash
npm install
npm run dev
```

Abra o endereço local informado pelo Vite (normalmente `http://localhost:5173/`).

### Testes, lint e build

```bash
npm test
npm run lint
npm run build
```

Para servir localmente a build de produção:

```bash
npm run preview
```

Os workflows do GitHub Actions executam os testes e verificam build e lint em pushes e pull requests.

## Privacidade e limitações

- O conteúdo e o progresso permanecem no IndexedDB do navegador; o aplicativo não envia esses dados a um servidor.
- Não há conta, autenticação, backend, sincronização em nuvem ou integração com IA.
- Os links de vídeo e documentação são externos; a disponibilidade depende de cada provedor.
- A estimativa de término é aproximada e depende das datas de conclusão registradas.
- O progresso é uma autoavaliação; o dashboard não valida conhecimento nem executa os desafios.

## Licença

Este projeto está disponível sob a licença [MIT](./LICENSE).
