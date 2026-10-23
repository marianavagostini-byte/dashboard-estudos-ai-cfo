import type { RoadmapStage } from './studyData'

export interface LessonExample {
  title: string
  explanation: string
  language: string
  code: string
  expectedOutput?: string
  tests?: string
}

export interface StudyLesson {
  schemaVersion: 1
  stageId: string
  title: string
  objectives: string[]
  prerequisites: string[]
  explanation: { heading: string; body: string }[]
  examples: LessonExample[]
  guidedPractice: { prompt: string; steps: string[]; checkpoints: string[] }
  independentExercises: { prompt: string; constraints: string[]; acceptanceCriteria: string[] }[]
  reviewQuestions: string[]
  completionCriteria: string[]
}

export const fundamentalsLessons: readonly StudyLesson[] = [
  {
    schemaVersion: 1,
    stageId: 'fundamentos-compreender',
    title: 'Do problema ao algoritmo: entradas, passos e resultados',
    objectives: [
      'Descrever um problema por entradas, transformação e saída.',
      'Distinguir um algoritmo de uma linguagem de programação.',
      'Acompanhar uma sequência de atribuições sem confundir variável com seu valor atual.',
    ],
    prerequisites: ['Nenhum conhecimento de programação; saber somar números inteiros e decimais.'],
    explanation: [
      { heading: 'Algoritmo é uma sequência precisa', body: 'Um algoritmo especifica passos finitos que transformam dados de entrada em um resultado. A mesma receita pode ser escrita em português, pseudocódigo ou JavaScript; a linguagem define a sintaxe executável, enquanto o algoritmo define a solução.' },
      { heading: 'Modelo entrada, transformação e saída', body: 'Para calcular o saldo do mês, recebemos renda e despesas, somamos as despesas e subtraímos esse total da renda. Declarar as entradas e a unidade (reais) evita misturar valores incompatíveis.' },
      { heading: 'Variáveis guardam valores que podem mudar', body: 'Em `let totalDespesas = 0`, o nome identifica o valor atual. Atribuir `totalDespesas = totalDespesas + 30` lê o valor anterior, soma 30 e guarda o novo valor.' },
    ],
    examples: [{
      title: 'Somar despesas e obter o saldo',
      explanation: 'Exemplo executável em Node.js. `const` mantém a referência da lista e `reduce` calcula a soma; `saldo` é renda menos despesas.',
      language: 'javascript',
      code: "import assert from 'node:assert/strict'\n\nconst renda = 3200\nconst despesas = [1200, 450, 180]\nconst totalDespesas = despesas.reduce((total, valor) => total + valor, 0)\nconst saldo = renda - totalDespesas\n\nassert.equal(totalDespesas, 1830)\nassert.equal(saldo, 1370)\nconsole.log({ totalDespesas, saldo })",
      expectedOutput: '{ totalDespesas: 1830, saldo: 1370 }',
      tests: 'node exemplo.mjs — as duas asserções devem passar.',
    }],
    guidedPractice: {
      prompt: 'Trace à mão a rotina acima antes de executá-la.',
      steps: ['Registre a entrada renda = 3200.', 'Some 1200 + 450 + 180 para encontrar o total de despesas.', 'Subtraia o total da renda e anote o saldo.', 'Execute o exemplo e compare os valores.'],
      checkpoints: ['Total de despesas: 1830.', 'Saldo: 1370.', 'A saída representa reais porque todas as entradas foram informadas nessa unidade.'],
    },
    independentExercises: [{
      prompt: 'Escreva um algoritmo que receba distância em quilômetros e consumo médio em km/L e calcule litros estimados. Depois implemente-o em JavaScript.',
      constraints: ['Não misture quilômetros com metros.', 'Explique o que acontece se o consumo for zero antes de dividir.'],
      acceptanceCriteria: ['Identifica as duas entradas e a unidade da saída.', 'Para 150 km e 12 km/L, obtém 12,5 L.', 'Explica por que divisão por zero precisa ser tratada.'],
    }],
    reviewQuestions: ['Quais são as entradas, a transformação e a saída do exemplo?', 'O que muda quando uma variável recebe uma nova atribuição?', 'Por que unidades fazem parte da especificação?'],
    completionCriteria: ['Resolve corretamente o exercício de distância e consumo.', 'Explica cada etapa sem depender de decorar a sintaxe.', 'Executa ao menos um teste com resultado esperado.'],
  },
  {
    schemaVersion: 1,
    stageId: 'fundamentos-guiada',
    title: 'Prática guiada: decompor e validar um orçamento mensal',
    objectives: ['Decompor uma tarefa em validação, agregação e cálculo.', 'Usar parâmetros e retorno em uma função.', 'Testar entradas válidas, inválidas e limites.'],
    prerequisites: ['Compreender variáveis, expressões, parâmetros e retorno de função.'],
    explanation: [
      { heading: 'Decompor antes de codificar', body: 'O cálculo do saldo só faz sentido se renda e despesas forem números finitos e não negativos. Separe essa regra da soma e da subtração para que cada decisão possa ser verificada.' },
      { heading: 'Validação é uma regra explícita', body: 'JavaScript aceita `NaN` e `Infinity` como números (`typeof` retorna `number`). `Number.isFinite` rejeita ambos. O exemplo também rejeita valores negativos, conforme a regra deste exercício.' },
      { heading: 'Função torna o contrato testável', body: 'A função recebe valores, devolve um resultado e não lê estado externo. Assim os mesmos parâmetros produzem o mesmo saldo e os testes não dependem da interface.' },
    ],
    examples: [{
      title: 'Função de saldo com contrato explícito',
      explanation: 'Para simplificar o exercício, as despesas já chegam como números em reais. A função não arredonda centavos nem converte texto.',
      language: 'javascript',
      code: "import assert from 'node:assert/strict'\n\nfunction calculateBalance(income, expenses) {\n  if (!Number.isFinite(income) || income < 0) throw new RangeError('Renda inválida')\n  if (!Array.isArray(expenses) || expenses.some((value) => !Number.isFinite(value) || value < 0)) {\n    throw new RangeError('Despesas inválidas')\n  }\n  return income - expenses.reduce((total, value) => total + value, 0)\n}\n\nassert.equal(calculateBalance(3200, [1200, 450, 180]), 1370)\nassert.equal(calculateBalance(0, []), 0)\nassert.throws(() => calculateBalance(-1, []), RangeError)\nassert.throws(() => calculateBalance(100, [20, NaN]), RangeError)",
      expectedOutput: 'Sem saída no terminal quando os testes passam; uma falha lança AssertionError.',
      tests: 'node exemplo.mjs — quatro verificações: saldo, lista vazia, renda negativa e despesa não finita.',
    }],
    guidedPractice: {
      prompt: 'Implemente o cálculo de saldo de orçamento com as regras de validação acima.',
      steps: ['Defina a assinatura e o retorno esperado da função.', 'Rejeite renda não finita ou negativa.', 'Confirme que despesas formam uma lista e cada item é finito e não negativo.', 'Some as despesas somente após validar toda a lista.', 'Subtraia a soma da renda.'],
      checkpoints: ['Renda 3200 e despesas [1200, 450, 180] retornam 1370.', 'Lista vazia é válida e resulta em saldo igual à renda.', 'NaN, Infinity e números negativos são rejeitados sem retornar saldo.'],
    },
    independentExercises: [{
      prompt: 'Estenda a função para devolver também a soma das despesas, em um objeto `{ totalExpenses, balance }`.',
      constraints: ['Mantenha as mesmas regras de validação.', 'Não altere nem ordene a lista recebida.'],
      acceptanceCriteria: ['O caso principal retorna `{ totalExpenses: 1830, balance: 1370 }`.', 'Entradas inválidas continuam gerando erro.', 'Um teste prova que a lista original permanece na mesma ordem.'],
    }],
    reviewQuestions: ['Por que validar todos os itens antes de calcular?', 'Por que `typeof NaN === "number"` não basta?', 'Qual vantagem a função pura traz para os testes?'],
    completionCriteria: ['Implementa os checkpoints com testes executáveis.', 'Justifica o contrato para valores inválidos.', 'Consegue explicar a decomposição em validação, soma e saldo.'],
  },
  {
    schemaVersion: 1,
    stageId: 'fundamentos-independente',
    title: 'Prática independente: conversor com taxa explícita e arredondamento',
    objectives: ['Transformar uma descrição em um contrato de função.', 'Converter valores e rejeitar entradas inválidas.', 'Explicar a precisão e os limites do arredondamento monetário.'],
    prerequisites: ['Saber declarar funções, validar números e escrever asserções com `node:assert/strict`.'],
    explanation: [
      { heading: 'Uma taxa precisa de direção', body: 'Neste exercício, a taxa significa quantas unidades de destino correspondem a 1 unidade de origem. Logo, valor convertido = valor de origem × taxa. Uma taxa com direção invertida produziria outra operação.' },
      { heading: 'Taxa de exemplo não é cotação', body: 'O valor 5,25 abaixo é fictício e serve somente para testar o algoritmo. O programa não consulta mercado, não representa cotação atual e não deve ser usado numa transação real.' },
      { heading: 'Arredondamento é parte da regra', body: 'O exemplo arredonda o resultado para duas casas decimais para exibição. Números binários de ponto flutuante podem representar algumas frações decimais de forma aproximada; aplicações financeiras robustas devem definir uma estratégia decimal adequada ao domínio.' },
    ],
    examples: [{
      title: 'Conversão de demonstração',
      explanation: 'A validação impede valor negativo, taxa zero/negativa e valores não finitos. A taxa é fornecida pelo chamador e não é buscada externamente.',
      language: 'javascript',
      code: "import assert from 'node:assert/strict'\n\nfunction convertCurrency(amount, rate) {\n  if (!Number.isFinite(amount) || amount < 0) throw new RangeError('Valor inválido')\n  if (!Number.isFinite(rate) || rate <= 0) throw new RangeError('Taxa inválida')\n  return Math.round((amount * rate + Number.EPSILON) * 100) / 100\n}\n\nconst demonstrationRate = 5.25 // taxa fictícia, apenas didática\nassert.equal(convertCurrency(10, demonstrationRate), 52.5)\nassert.equal(convertCurrency(0, demonstrationRate), 0)\nassert.throws(() => convertCurrency(-1, demonstrationRate), RangeError)\nassert.throws(() => convertCurrency(10, 0), RangeError)\nassert.throws(() => convertCurrency(Infinity, demonstrationRate), RangeError)",
      expectedOutput: 'Conversão de 10 resulta em 52.5; os testes não produzem saída se passarem.',
      tests: 'node exemplo.mjs — verifica valor normal, zero, valor negativo, taxa zero e Infinity.',
    }],
    guidedPractice: {
      prompt: 'Construa o conversor e registre sua própria tabela de casos antes de executar os testes.',
      steps: ['Escreva o significado e a direção da taxa em uma frase.', 'Escolha o resultado esperado para 10 × 5,25.', 'Implemente a validação das duas entradas.', 'Implemente multiplicação e arredondamento para duas casas.', 'Execute casos de valor zero, taxa inválida e Infinity.'],
      checkpoints: ['10 unidades de origem com taxa fictícia 5,25 resultam em 52,50.', 'Valor zero é aceito.', 'Entradas negativas, não finitas e taxa não positiva são recusadas.'],
    },
    independentExercises: [{
      prompt: 'Adicione um modo de conversão inversa que receba a taxa no mesmo sentido documentado e calcule o valor de origem necessário para atingir uma quantia de destino.',
      constraints: ['Defina claramente a fórmula (alvo ÷ taxa).', 'Mantenha a taxa fictícia e nunca rotule o resultado como cotação real.'],
      acceptanceCriteria: ['Alvo 52,50 e taxa 5,25 retorna 10,00.', 'Alvo zero retorna zero.', 'Taxa inválida é rejeitada.', 'Explica que arredondamento de exibição pode perder precisão para uso financeiro real.'],
    }],
    reviewQuestions: ['O que a taxa 5,25 quer dizer neste exemplo?', 'Por que a taxa precisa ter direção documentada?', 'Arredondar para duas casas torna a representação binária exata?'],
    completionCriteria: ['Passa nos testes de entradas válidas e inválidas.', 'Explica fórmula, unidades e arredondamento.', 'Identifica explicitamente a taxa como fictícia.'],
  },
  {
    schemaVersion: 1,
    stageId: 'fundamentos-autonomia',
    title: 'Autonomia: resumir despesas por categoria e justificar a solução',
    objectives: ['Planejar a solução de um problema novo sem receita pronta.', 'Usar repetição e condição para agrupar dados.', 'Validar estrutura antes de calcular e testar casos de borda.'],
    prerequisites: ['Conhecer variáveis, arrays, objetos, funções, condicionais e laços.'],
    explanation: [
      { heading: 'Modelar os dados antes do laço', body: 'Cada despesa será um objeto com `category` e `amount`. O contrato do exercício exige categoria não vazia e valor finito não negativo. Dados incompletos não devem entrar silenciosamente no total.' },
      { heading: 'Acumular por chave', body: 'Para cada item, atualize o acumulador da categoria: soma anterior mais valor atual. Uma condição inicializa a categoria na primeira ocorrência; depois a mesma regra agrega itens repetidos.' },
      { heading: 'Verifique a estrutura, não só o exemplo feliz', body: 'Teste lista vazia, categorias repetidas e dados inválidos. O custo é linear no número de despesas: cada item é validado e processado uma vez, portanto O(n) tempo.' },
    ],
    examples: [{
      title: 'Agregador por categoria',
      explanation: 'Implementação executável que não modifica os objetos de entrada. O resultado é um objeto com uma soma por categoria.',
      language: 'javascript',
      code: "import assert from 'node:assert/strict'\n\nfunction totalByCategory(expenses) {\n  if (!Array.isArray(expenses)) throw new TypeError('Informe uma lista')\n  const totals = {}\n  for (const expense of expenses) {\n    if (typeof expense.category !== 'string' || !expense.category.trim()) throw new TypeError('Categoria inválida')\n    if (!Number.isFinite(expense.amount) || expense.amount < 0) throw new RangeError('Valor inválido')\n    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount\n  }\n  return totals\n}\n\nassert.deepEqual(totalByCategory([\n  { category: 'Alimentação', amount: 32 },\n  { category: 'Transporte', amount: 18 },\n  { category: 'Alimentação', amount: 8 },\n]), { Alimentação: 40, Transporte: 18 })\nassert.deepEqual(totalByCategory([]), {})\nassert.throws(() => totalByCategory([{ category: ' ', amount: 1 }]), TypeError)\nassert.throws(() => totalByCategory([{ category: 'Lazer', amount: -1 }]), RangeError)",
      expectedOutput: '{ Alimentação: 40, Transporte: 18 } para a lista de exemplo.',
      tests: 'node exemplo.mjs — verifica agregação, lista vazia, categoria em branco e valor negativo.',
    }],
    guidedPractice: {
      prompt: 'Use o exemplo apenas como ponto de partida para desenhar a tabela de estado do acumulador.',
      steps: ['Antes de executar, escreva o objeto acumulador após cada despesa.', 'Explique o papel de `?? 0` na primeira ocorrência da categoria.', 'Execute os casos de teste e inspecione o caso de categoria em branco.', 'Estime quantas passagens pela lista são feitas.'],
      checkpoints: ['Após a primeira despesa, Alimentação totaliza 32.', 'Após a terceira, Alimentação totaliza 40.', 'A lista é percorrida uma vez, logo o tempo cresce linearmente com seu tamanho.'],
    },
    independentExercises: [{
      prompt: 'A partir de uma lista própria, retorne também o nome da categoria com maior total e o valor correspondente.',
      constraints: ['Defina como tratar lista vazia e empate.', 'Rejeite registro inválido sem devolver resumo parcial.'],
      acceptanceCriteria: ['Testa duas categorias com totais diferentes.', 'Testa empate e aplica uma regra documentada e determinística.', 'Testa lista vazia e pelo menos um registro inválido.', 'Não altera a entrada e explica a complexidade temporal.'],
    }],
    reviewQuestions: ['Qual informação precisa permanecer no acumulador?', 'O que acontece na primeira ocorrência de uma categoria?', 'Por que uma validação tardia poderia expor um resumo parcial?'],
    completionCriteria: ['Implementa o resumo independente e seus casos de borda.', 'Explica a regra de empate escolhida.', 'Justifica a complexidade O(n) e demonstra que os dados de entrada não foram alterados.'],
  },
]

export function getStudyLesson(stageId: string): StudyLesson | undefined {
  return fundamentalsLessons.find((lesson) => lesson.stageId === stageId)
}

export function validateStudyLessons(lessons: readonly StudyLesson[], stages: readonly RoadmapStage[]): void {
  const stageIds = new Set(stages.map(({ id }) => id))
  const lessonIds = new Set<string>()
  for (const lesson of lessons) {
    if (lesson.schemaVersion !== 1 || !stageIds.has(lesson.stageId)) {
      throw new Error(`Aula com versão ou etapa desconhecida: ${lesson.stageId}`)
    }
    if (lessonIds.has(lesson.stageId)) throw new Error(`Aula duplicada para etapa: ${lesson.stageId}`)
    lessonIds.add(lesson.stageId)
    const required: unknown[] = [lesson.title, ...lesson.objectives, ...lesson.prerequisites,
      ...lesson.explanation.flatMap(({ heading, body }) => [heading, body]),
      ...lesson.examples.flatMap(({ title, explanation, language, code }) => [title, explanation, language, code]),
      lesson.guidedPractice.prompt, ...lesson.guidedPractice.steps, ...lesson.guidedPractice.checkpoints,
      ...lesson.independentExercises.flatMap(({ prompt, constraints, acceptanceCriteria }) => [prompt, ...constraints, ...acceptanceCriteria]),
      ...lesson.reviewQuestions, ...lesson.completionCriteria]
    if (required.some((value) => typeof value !== 'string' || !value.trim())) {
      throw new Error(`Aula incompleta para etapa: ${lesson.stageId}`)
    }
    if (!lesson.objectives.length || !lesson.explanation.length || !lesson.examples.length
      || !lesson.guidedPractice.steps.length || !lesson.guidedPractice.checkpoints.length
      || !lesson.independentExercises.length || !lesson.reviewQuestions.length || !lesson.completionCriteria.length) {
      throw new Error(`Aula sem seção obrigatória: ${lesson.stageId}`)
    }
  }
}
