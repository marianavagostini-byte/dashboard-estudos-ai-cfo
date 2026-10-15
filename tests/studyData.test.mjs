import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/studyData.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
const roadmapSource = await readFile(new URL('../src/learningRoadmap.ts', import.meta.url), 'utf8')
const { outputText: roadmapOutput } = ts.transpileModule(roadmapSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})
const roadmapUrl = `data:text/javascript;base64,${Buffer.from(roadmapOutput).toString('base64')}`
const {
  getDateAfterDays,
  getDefaultRecordData,
  getDueRoadmapStages,
  getLocalDate,
  getNextTopicPosition,
  getPendingRoadmapPrerequisites,
  getRecommendedRoadmapStage,
  getRoadmapStageRecord,
  estimateRoadmapDaysRemaining,
  helpLevels,
  markRoadmapStageReviewed,
  normalizeTitle,
  parseBackupJson,
  progressStates,
  calculateRoadmapProgress,
  reorderTopics,
  roadmapStatuses,
  resolveTopicTitle,
  setRoadmapStageStatus,
  sortTopics,
  validateBackup,
} = await import(moduleUrl)
const { learningRoadmap, roadmapStages } = await import(roadmapUrl)

const timestamp = '2026-01-01T12:00:00.000Z'
const record = {
  id: 'topic-1',
  type: 'topic',
  title: 'JavaScript',
  data: { status: 'Em estudo' },
  createdAt: timestamp,
  updatedAt: timestamp,
}

function backup(overrides = {}) {
  return {
    app: 'Dashboard-Estudos',
    version: 1,
    exportedAt: timestamp,
    records: [record],
    settings: { reviewIntervalDays: 3 },
    ...overrides,
  }
}

test('defines the six progress states and four help levels', () => {
  assert.equal(progressStates.length, 6)
  assert.equal(helpLevels.length, 4)
})

test('provides 21 ordered modules with four learning stages and bilingual resources', () => {
  assert.equal(learningRoadmap.length, 21)
  assert.equal(roadmapStages.length, 84)
  assert.ok(learningRoadmap.every(({ stages }) => stages.length === 4))
  assert.ok(roadmapStages.every(({ resources }) =>
    resources.length >= 2
    && resources[0].url.startsWith('https://')
    && resources[0].url.includes('youtube.com/watch?v=')
    && resources[0].author.trim()
    && resources[0].title.trim()
    && resources[1].url.startsWith('https://')
    && resources[1].url.includes('youtube.com/watch?v=')
    && resources[1].author.trim()
    && resources[1].title.trim(),
  ))
  assert.equal(roadmapStages[0].prerequisites.length, 0)
  assert.ok(roadmapStages.slice(1).every(({ prerequisites }) => prerequisites.length === 1))
})

test('accepts a valid versioned backup', () => {
  const validated = validateBackup(backup())
  assert.equal(validated.app, 'Dashboard-Estudos')
  assert.equal(validated.records[0].id, 'topic-1')
})

test('rejects backups for another app, unsupported versions and invalid settings', () => {
  assert.throws(() => validateBackup(backup({ app: 'another-app' })), /não é um backup/)
  assert.throws(() => validateBackup(backup({ version: 2 })), /Versão de backup não suportada/)
  assert.throws(() => validateBackup(backup({ settings: { reviewIntervalDays: 0 } })), /entre 1 e 365/)
})

test('rejects malformed records and duplicate IDs', () => {
  assert.throws(() => validateBackup(backup({ records: [{ ...record, type: 'unknown' }] })), /campos obrigatórios inválidos/)
  assert.throws(() => validateBackup(backup({ records: [record, { ...record, title: 'Duplicado' }] })), /ID duplicado/)
})

test('uses the local calendar date across timezone and year boundaries', () => {
  const previousTimezone = process.env.TZ
  process.env.TZ = 'America/Los_Angeles'
  try {
    assert.equal(getLocalDate(new Date('2026-01-01T01:30:00.000Z')), '2025-12-31')
    assert.equal(getDateAfterDays(1, new Date('2026-12-31T18:00:00.000Z')), '2027-01-01')
    assert.equal(getDateAfterDays(1, new Date('2026-03-08T19:00:00.000Z')), '2026-03-09')
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ
    else process.env.TZ = previousTimezone
  }
})

test('rejects titles containing only whitespace and trims valid titles', () => {
  assert.throws(() => normalizeTitle(' \t\n '), /Informe um título/)
  assert.equal(normalizeTitle('  Meu tópico  '), 'Meu tópico')
})

test('sorts topics, appends new topics within their module and reorders positions', () => {
  const topic = (id, title, module, position) => ({
    ...record,
    id,
    title,
    data: { module, position },
  })
  const topics = [
    topic('b', 'Segundo', 'Módulo A', '2'),
    topic('c', 'Terceiro', 'Módulo A', '3'),
    topic('a', 'Primeiro', 'Módulo A', '1'),
    topic('d', 'Outro módulo', 'Módulo B', '4'),
  ]

  assert.deepEqual(sortTopics(topics).map(({ id }) => id), ['a', 'b', 'c', 'd'])
  assert.equal(getNextTopicPosition(topics), 5)

  const reordered = reorderTopics(topics.slice(0, 3), 'b', -1)
  assert.deepEqual(reordered.map(({ id }) => id), ['b', 'a', 'c'])
  assert.deepEqual(reordered.map(({ data }) => data.position), ['1', '2', '3'])
  assert.deepEqual(reorderTopics(sortTopics(topics.slice(0, 3)), 'a', -1).map(({ id }) => id), ['a', 'b', 'c'])
})

test('provides form defaults after each successful entry', () => {
  assert.deepEqual(getDefaultRecordData('topic'), { status: 'Não iniciado', priority: 'Média' })
  assert.deepEqual(getDefaultRecordData('challenge'), { helpLevel: 'Independente', status: 'Pendente', attempts: '0' })
  assert.deepEqual(getDefaultRecordData('review', '2026-02-03'), { dueDate: '2026-02-03' })
  assert.deepEqual(getDefaultRecordData('session', '2026-02-03'), { date: '2026-02-03', status: 'Concluída' })
  assert.deepEqual(getDefaultRecordData('tutor'), {})
})

test('resolves deleted topic references without exposing the stored identifier', () => {
  assert.equal(resolveTopicTitle([record], 'missing-topic-id'), 'Tópico excluído')
  assert.equal(resolveTopicTitle([{ ...record, id: 'topic-1' }], 'topic-1'), 'JavaScript')
  assert.equal(resolveTopicTitle([], undefined), undefined)
})

test('reports invalid JSON and rejects incompatible backup files', () => {
  assert.throws(() => parseBackupJson('{invalid json'), /não contém um JSON válido/)
  assert.throws(() => parseBackupJson(JSON.stringify(backup({ app: 'another-app' }))), /não é um backup/)
  assert.throws(() => parseBackupJson(JSON.stringify(backup({ version: 2 }))), /Versão de backup não suportada/)
})

const stage = (id, prerequisites = []) => ({
  id,
  moduleId: 'module-1',
  title: `Etapa ${id}`,
  objective: 'Demonstrar o aprendizado.',
  activity: 'Resolver uma tarefa.',
  prerequisites,
  resources: [],
})

const roadmapModule = {
  id: 'module-1',
  title: 'Módulo de teste',
  summary: 'Resumo',
  concepts: 'Conceitos',
  guidedPractice: 'Prática guiada',
  independentPractice: 'Prática independente',
  validation: 'Validação',
  stages: [stage('stage-1'), stage('stage-2', ['stage-1'])],
}

test('tracks roadmap status, prerequisites, progress and recommendation from saved records', () => {
  const [first, second] = roadmapModule.stages
  assert.deepEqual(roadmapStatuses, ['Não iniciado', 'Em andamento', 'Treinando', 'Concluído'])
  assert.deepEqual(getPendingRoadmapPrerequisites(second, roadmapModule.stages, []), [first])

  const inProgress = setRoadmapStageStatus(first, undefined, 'Em andamento', '2026-02-01', timestamp)
  assert.equal(getRoadmapStageRecord([inProgress], first.id)?.data.status, 'Em andamento')
  assert.equal(getRecommendedRoadmapStage([roadmapModule], [inProgress]), first)
  assert.deepEqual(getPendingRoadmapPrerequisites(second, roadmapModule.stages, [inProgress]), [first])

  const completed = setRoadmapStageStatus(first, inProgress, 'Concluído', '2026-02-01', timestamp)
  assert.deepEqual(getPendingRoadmapPrerequisites(second, roadmapModule.stages, [completed]), [])
  assert.deepEqual(calculateRoadmapProgress([roadmapModule], [completed]), {
    total: 2,
    completed: 1,
    percent: 50,
    modules: [{ id: 'module-1', title: 'Módulo de teste', total: 2, completed: 1, percent: 50 }],
  })
})

test('schedules explicit roadmap reviews at 1, 3, 7 and 14 local calendar days', () => {
  const completed = setRoadmapStageStatus(stage('stage-review'), undefined, 'Concluído', '2026-03-07', timestamp)
  assert.equal(completed.data.nextReviewDate, '2026-03-08')
  assert.deepEqual(getDueRoadmapStages([completed], '2026-03-07'), [])
  assert.deepEqual(getDueRoadmapStages([completed], '2026-03-08'), [completed])

  const afterOneDay = markRoadmapStageReviewed(completed, '2026-03-08', timestamp)
  assert.equal(afterOneDay.data.nextReviewDate, '2026-03-11')
  const afterThreeDays = markRoadmapStageReviewed(afterOneDay, '2026-03-11', timestamp)
  assert.equal(afterThreeDays.data.nextReviewDate, '2026-03-18')
  const afterSevenDays = markRoadmapStageReviewed(afterThreeDays, '2026-03-18', timestamp)
  assert.equal(afterSevenDays.data.nextReviewDate, '2026-04-01')
  const afterFourteenDays = markRoadmapStageReviewed(afterSevenDays, '2026-04-01', timestamp)
  assert.equal(afterFourteenDays.data.nextReviewDate, undefined)
  assert.throws(() => markRoadmapStageReviewed(completed, '2026-03-07', timestamp), /ainda não venceu/)
})

test('estimates remaining roadmap time from explicit completion dates', () => {
  assert.equal(estimateRoadmapDaysRemaining([roadmapModule], [], '2026-02-01'), undefined)
  const firstCompleted = setRoadmapStageStatus(roadmapModule.stages[0], undefined, 'Concluído', '2026-02-01', timestamp)
  assert.equal(estimateRoadmapDaysRemaining([roadmapModule], [firstCompleted], '2026-02-01'), 1)
  assert.equal(estimateRoadmapDaysRemaining([roadmapModule], [firstCompleted], '2026-02-03'), 2)
  const secondCompleted = setRoadmapStageStatus(roadmapModule.stages[1], undefined, 'Concluído', '2026-02-03', timestamp)
  assert.equal(estimateRoadmapDaysRemaining([roadmapModule], [firstCompleted, secondCompleted], '2026-02-03'), 0)
})

test('round-trips roadmap progress records in the existing version 1 backup format', () => {
  const savedStage = setRoadmapStageStatus(stage('stage-backup'), undefined, 'Treinando', '2026-02-01', timestamp)
  const validated = parseBackupJson(JSON.stringify(backup({ records: [savedStage] })))
  assert.deepEqual(validated.records, [savedStage])
  assert.equal(validated.version, 1)
})
