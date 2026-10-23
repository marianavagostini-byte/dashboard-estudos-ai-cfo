import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
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
const backupDownloadSource = await readFile(new URL('../src/backupDownload.ts', import.meta.url), 'utf8')
const { outputText: backupDownloadOutput } = ts.transpileModule(backupDownloadSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})
const backupDownloadUrl = `data:text/javascript;base64,${Buffer.from(backupDownloadOutput).toString('base64')}`
const databaseSource = await readFile(new URL('../src/studyDatabase.ts', import.meta.url), 'utf8')
const roadmapSource = await readFile(new URL('../src/learningRoadmap.ts', import.meta.url), 'utf8')
const { outputText: roadmapOutput } = ts.transpileModule(roadmapSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})
const roadmapUrl = `data:text/javascript;base64,${Buffer.from(roadmapOutput).toString('base64')}`
const curriculumSource = await readFile(new URL('../src/studyCurriculum.ts', import.meta.url), 'utf8')
const { outputText: curriculumOutput } = ts.transpileModule(curriculumSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const curriculumUrl = `data:text/javascript;base64,${Buffer.from(curriculumOutput).toString('base64')}`
const { fundamentalsLessons, getStudyLesson, validateStudyLessons } = await import(curriculumUrl)
const studySessionSource = await readFile(new URL('../src/studySession.ts', import.meta.url), 'utf8')
const { outputText: studySessionOutput } = ts.transpileModule(
  studySessionSource
    .replace("from './learningRoadmap'", `from '${roadmapUrl}'`)
    .replace("from './studyData'", `from '${moduleUrl}'`),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
)
const studySessionUrl = `data:text/javascript;base64,${Buffer.from(studySessionOutput).toString('base64')}`
const { parseStudySessionJson, validateStudySession } = await import(studySessionUrl)
const studyCatalogSource = await readFile(new URL('../src/studyCatalog.ts', import.meta.url), 'utf8')
const { outputText: studyCatalogOutput } = ts.transpileModule(studyCatalogSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const studyCatalogUrl = `data:text/javascript;base64,${Buffer.from(studyCatalogOutput).toString('base64')}`
const catalogProgressSource = await readFile(new URL('../src/catalogProgress.ts', import.meta.url), 'utf8')
const { outputText: catalogProgressOutput } = ts.transpileModule(
  catalogProgressSource
    .replaceAll("from './studyData'", `from '${moduleUrl}'`)
    .replaceAll("from './studyCatalog'", `from '${studyCatalogUrl}'`),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
)
const catalogProgressUrl = `data:text/javascript;base64,${Buffer.from(catalogProgressOutput).toString('base64')}`
const migrationSource = await readFile(new URL('../src/progressMigration.ts', import.meta.url), 'utf8')
const { outputText: migrationOutput } = ts.transpileModule(migrationSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const migrationUrl = `data:text/javascript;base64,${Buffer.from(migrationOutput).toString('base64')}`
const topicSessionSource = await readFile(new URL('../src/studyTopicSession.ts', import.meta.url), 'utf8')
const { outputText: topicSessionOutput } = ts.transpileModule(
  topicSessionSource.replace("from './studyCatalog'", `from '${studyCatalogUrl}'`),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
)
const topicSessionUrl = `data:text/javascript;base64,${Buffer.from(topicSessionOutput).toString('base64')}`
const {
  studyCatalog,
  studySubjects,
  studyTopics,
  curriculumAreas,
  validateStudyCatalog,
  validateCurriculumAreas,
  findCurriculumAreaForSubject,
  findStudyTopic,
} = await import(studyCatalogUrl)
const {
  listCatalogTopics,
  listCurriculumTopics,
  listOfficialTopicGroups,
  listOfficialTopicEntries,
  getCatalogTotals,
  filterCatalogTopics,
  getCatalogTopicStatus,
  calculateCatalogProgress,
  calculateParallelProgress,
  calculateCurriculumProgress,
  calculateCurriculumAreaProgress,
  getPhaseProgress,
  getSubjectProgress,
  getNextRecommendedTopic,
  countRecordedCatalogTopics,
} = await import(catalogProgressUrl)
const { legacyProgressMappings, simulateProgressMigration } = await import(migrationUrl)
const { validateTopicStudySession, parseTopicStudySessionJson } = await import(topicSessionUrl)
const { outputText: databaseOutput } = ts.transpileModule(
  databaseSource
    .replace("from './studyData'", `from '${moduleUrl}'`)
    .replace("from './learningRoadmap'", `from '${roadmapUrl}'`)
    .replace("from './studySession'", `from '${studySessionUrl}'`)
    .replace("from './catalogProgress'", `from '${catalogProgressUrl}'`)
    .replace("from './studyCatalog'", `from '${studyCatalogUrl}'`)
    .replace("from './studyTopicSession'", `from '${topicSessionUrl}'`),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
)
const databaseUrl = `data:text/javascript;base64,${Buffer.from(databaseOutput).toString('base64')}`
const studyContextSource = await readFile(new URL('../src/studyContext.ts', import.meta.url), 'utf8')
const { outputText: studyContextOutput } = ts.transpileModule(
  studyContextSource
    .replace("from './studyData'", `from '${moduleUrl}'`)
    .replace("from './learningRoadmap'", `from '${roadmapUrl}'`),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
)
const studyContextUrl = `data:text/javascript;base64,${Buffer.from(studyContextOutput).toString('base64')}`
const { formatStudyContext } = await import(studyContextUrl)
const databaseWithSessionUrl = `${databaseUrl}#session-test`
const {
  getDateAfterDays,
  getDefaultRecordData,
  getDueRoadmapStages,
  getRoadmapStageContent,
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
  previewBackupImport,
  findBackupConflicts,
  progressStates,
  calculateRoadmapProgress,
  reorderTopics,
  roadmapStatuses,
  resolveTopicTitle,
  setCatalogTopicStatus,
  getCatalogStatusHistory,
  setRoadmapStageStatus,
  sortTopics,
  validateBackup,
  validateStudyRecords,
} = await import(moduleUrl)
const { downloadBackupFile } = await import(backupDownloadUrl)
const databaseApi = await import(databaseUrl)
const {
  exportData,
  importData,
  listRecords,
  loadSettings,
  removeRecords,
  saveRecord,
  saveRecords,
} = databaseApi
const sessionDatabaseApi = await import(databaseWithSessionUrl)
const { importStudySession } = sessionDatabaseApi
const topicSessionDatabaseApi = await import(`${databaseUrl}#topic-session-test`)
const { importTopicStudySession } = topicSessionDatabaseApi
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

function studySession(overrides = {}) {
  return {
    schema_version: 1,
    session_id: '123e4567-e89b-42d3-a456-426614174000',
    date: '2026-10-20T15:30:00-03:00',
    source: 'ChatGPT',
    modules: [{
      id: 'javascript',
      topics_studied: [{ topic: 'Funções', explained: true, practiced: true }],
    }],
    exercises: [{
      title: 'Soma',
      prompt: 'Somar dois números.',
      attempted: true,
      resolved: true,
      solution_or_correction: 'Retorno a + b.',
      result: 'Tentativa concluída com sucesso.',
    }],
    artifacts: [],
    tests: [{ command: 'node --test', result: 'passed', details: '1 teste passou.' }],
    roadmap_updates: [{
      stage_id: 'javascript-compreender',
      expected_status: null,
      status: 'Em andamento',
      justification: 'O usuário confirmou o estudo desta etapa.',
      confirmed_by_user: true,
    }],
    next_steps: ['Praticar parâmetros e retorno.'],
    notes: [],
    duration_minutes: null,
    git: {
      branch: null,
      commit_hash: null,
      push_status: 'not_applicable',
      push_details: null,
    },
    ...overrides,
  }
}

function createFakeIndexedDb(initialRecords, initialSettings) {
  let failNextWrite = false
  const stores = new Map([
    ['records', new Map(initialRecords.map((item) => [item.id, structuredClone(item)]))],
    ['settings', new Map(initialSettings
      ? [['app', { key: 'app', value: structuredClone(initialSettings) }]]
      : [])],
  ])
  const keyPaths = new Map([['records', 'id'], ['settings', 'key']])
  const database = {
    objectStoreNames: {
      contains: (name) => stores.has(name),
    },
    transaction(storeNames, mode = 'readonly') {
      const names = Array.isArray(storeNames) ? storeNames : [storeNames]
      const snapshots = new Map([...stores].map(([name, values]) => [
        name,
        new Map([...values].map(([key, value]) => [key, structuredClone(value)])),
      ]))
      const shouldFail = mode === 'readwrite' && failNextWrite
      if (shouldFail) failNextWrite = false
      const transaction = {
        error: null,
        oncomplete: null,
        onabort: null,
        onerror: null,
        abort() {
          transaction.error = new Error('Fictitious transaction failure')
          queueMicrotask(() => transaction.onabort?.({ target: transaction }))
        },
        objectStore(name) {
          assert.ok(names.includes(name), `Store ${name} must belong to this transaction`)
          const records = stores.get(name)
          const requestFor = (result) => {
            const request = { result, error: null, onsuccess: null, onerror: null }
            queueMicrotask(() => request.onsuccess?.({ target: request }))
            return request
          }
          const store = {
            getAll: (query) => requestFor([...records.values()]
              .filter((item) => query === undefined || item.type === query)
              .map((item) => structuredClone(item))),
            get: (key) => requestFor(structuredClone(records.get(key))),
            put(item) {
              records.set(item[keyPaths.get(name)], structuredClone(item))
              return requestFor(item)
            },
            add(item) {
              const key = item[keyPaths.get(name)]
              if (records.has(key)) throw new Error(`Duplicate key: ${key}`)
              records.set(key, structuredClone(item))
              return requestFor(item)
            },
            delete: (key) => {
              records.delete(key)
              return requestFor(undefined)
            },
            clear: () => {
              records.clear()
              return requestFor(undefined)
            },
            index(indexName) {
              assert.equal(indexName, 'type')
              return {
                getAll: (query) => requestFor([...records.values()]
                  .filter((item) => item.type === query)
                  .map((item) => structuredClone(item))),
              }
            },
          }
          return store
        },
      }
      setTimeout(() => {
        if (shouldFail) {
          for (const [name, values] of snapshots) {
            stores.get(name).clear()
            for (const [key, value] of values) stores.get(name).set(key, value)
          }
          transaction.error = new Error('Fictitious transaction failure')
          transaction.onabort?.({ target: transaction })
          return
        }
        transaction.oncomplete?.({ target: transaction })
      }, 0)
      return transaction
    },
  }

  return {
    database,
    indexedDB: {
      open(name) {
        assert.equal(name, 'dashboard-estudos')
        const request = { result: database, error: null, onsuccess: null, onerror: null, onupgradeneeded: null }
        queueMicrotask(() => request.onsuccess?.({ target: request }))
        return request
      },
    },
    records: stores.get('records'),
    settings: stores.get('settings'),
    failNextWrite() {
      failNextWrite = true
    },
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

test('validates the four fundamentals lessons, their roadmap mapping and runnable examples', () => {
  const module = learningRoadmap.find(({ id }) => id === 'fundamentos')
  assert.ok(module)
  assert.equal(fundamentalsLessons.length, 4)
  assert.deepEqual(fundamentalsLessons.map(({ stageId }) => stageId), module.stages.map(({ id }) => id))
  assert.doesNotThrow(() => validateStudyLessons(fundamentalsLessons, roadmapStages))
  assert.ok(fundamentalsLessons.every((lesson) => getStudyLesson(lesson.stageId) === lesson))

  const require = createRequire(import.meta.url)
  for (const lesson of fundamentalsLessons) {
    assert.ok(lesson.objectives.length && lesson.explanation.length && lesson.guidedPractice.steps.length)
    assert.ok(lesson.independentExercises.length && lesson.reviewQuestions.length && lesson.completionCriteria.length)
    for (const example of lesson.examples) {
      const executable = example.code.replace(
        "import assert from 'node:assert/strict'",
        "const assert = require('node:assert/strict')",
      )
      assert.doesNotThrow(() => runInNewContext(executable, { require, console }))
    }
  }
  assert.throws(() => validateStudyLessons([...fundamentalsLessons, fundamentalsLessons[0]], roadmapStages), /Aula duplicada/)
  assert.throws(() => validateStudyLessons([{ ...fundamentalsLessons[0], stageId: 'etapa-inexistente' }], roadmapStages), /etapa desconhecida/)
})

test('keeps curriculum outside existing stage progress and version 1 backups', () => {
  const stage = learningRoadmap.find(({ id }) => id === 'fundamentos').stages[0]
  const progress = setRoadmapStageStatus(stage, undefined, 'Em andamento', '2026-02-01', timestamp)
  const restored = parseBackupJson(JSON.stringify(backup({ records: [progress] })))
  assert.deepEqual(restored.records, [progress])
  assert.equal(restored.version, 1)
  assert.equal(restored.records[0].data.stageId, fundamentalsLessons[0].stageId)
  assert.deepEqual(Object.keys(restored.records[0].data).sort(), ['moduleId', 'stageId', 'status'])
})

test('maps each roadmap stage to its own content without repeating concepts or unrelated practices', () => {
  for (const module of learningRoadmap) {
    for (const stage of module.stages) {
      const content = getRoadmapStageContent(module, stage)
      assert.equal(content.summary, module.summary)
      assert.equal(content.concepts, module.concepts)
      assert.equal(content.objective, stage.objective === module.concepts ? undefined : stage.objective)
      assert.equal(content.activity, stage.activity)
      assert.ok(content.activity.trim())
    }

    const [comprehension, guided, independent, validation] = module.stages
    assert.equal(getRoadmapStageContent(module, comprehension).objective, undefined)
    assert.equal(getRoadmapStageContent(module, guided).activity, module.guidedPractice)
    assert.equal(getRoadmapStageContent(module, independent).activity, module.independentPractice)
    assert.equal(getRoadmapStageContent(module, validation).activity, module.validation)
  }
})

test('accepts a valid versioned backup', () => {
  const validated = validateBackup(backup())
  assert.equal(validated.app, 'Dashboard-Estudos')
  assert.equal(validated.records[0].id, 'topic-1')
})

test('keeps the study exchange state valid and separates confirmed data from pending reports', async (t) => {
  const stateUrl = new URL('../integracao/estado-estudos.json', import.meta.url)
  if (!existsSync(stateUrl)) {
    t.skip('integracao/estado-estudos.json é um resumo local não versionado; validação executada apenas quando presente.')
    return
  }
  const state = JSON.parse(await readFile(stateUrl, 'utf8'))
  const moduleSummaries = state.catalogo_confirmado.modulos
  const moduleProgress = state.progresso_confirmado_pelo_dashboard.progresso_por_modulo

  assert.equal(state.versao_esquema, 2)
  assert.equal(state.fonte_oficial.sistema, 'Dashboard-Estudos')
  assert.equal(state.progresso_confirmado_pelo_dashboard.estado, 'pendente_de_backup_do_indexeddb')
  assert.equal(state.progresso_confirmado_pelo_dashboard.topico_atual, null)
  assert.deepEqual(state.progresso_confirmado_pelo_dashboard.etapas_concluidas, null)
  assert.match(state.informacoes_confirmadas_pelo_usuario.data_inicio_estudos.valor, /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(state.relatos_anteriores_nao_mapeados.contagens.dsa_e_leetcode.mapeamento_dashboard, null)
  assert.equal(moduleSummaries.length, learningRoadmap.length)
  assert.deepEqual(
    moduleSummaries.map(({ id, nome, etapas }) => ({
      id,
      title: nome,
      stages: etapas.map(({ id: stageId, nome: stageTitle }) => ({ id: stageId, title: stageTitle })),
    })),
    learningRoadmap.map(({ id, title, stages }) => ({
      id,
      title,
      stages: stages.map(({ id: stageId, title: stageTitle }) => ({ id: stageId, title: stageTitle })),
    })),
  )
  assert.deepEqual(
    moduleProgress.map(({ id, etapas_concluidas, total_etapas, estado: progressStatus }) => ({
      id,
      completed: etapas_concluidas,
      total: total_etapas,
      status: progressStatus,
    })),
    learningRoadmap.map(({ id, stages }) => ({
      id,
      completed: null,
      total: stages.length,
      status: 'pendente_de_confirmacao',
    })),
  )
})

test('exports a timestamped version 1 backup and imports its fictitious records unchanged', async () => {
  const exportedAt = '2026-10-20T16:40:56.091Z'
  const records = [
    record,
    {
      id: 'session-fake-1',
      type: 'session',
      title: 'Sessão fictícia',
      data: { studiedAt: '2026-10-19', notes: 'Registro de teste isolado' },
      createdAt: '2026-10-19T10:00:00.000Z',
      updatedAt: '2026-10-19T11:00:00.000Z',
    },
  ]
  const exportedBackup = backup({ exportedAt, records })
  let downloadedBlob
  let clickedAnchor
  let removed = false
  let scheduledRevocation
  let revokedUrl
  const environment = {
    document: {
      createElement: () => ({
        click() { clickedAnchor = this },
        remove() { removed = true },
      }),
      body: {
        appendChild(anchor) { clickedAnchor = anchor },
      },
    },
    url: {
      createObjectURL(blob) {
        downloadedBlob = blob
        return 'blob:test-backup'
      },
      revokeObjectURL(url) { revokedUrl = url },
    },
    schedule(callback, delay) {
      scheduledRevocation = callback
      assert.equal(delay, 1000)
    },
  }

  const filename = downloadBackupFile(exportedBackup, environment)
  const importedBackup = parseBackupJson(await downloadedBlob.text())

  assert.equal(filename, 'dashboard-estudos-backup-2026-10-20T16-40-56-091Z.json')
  assert.equal(clickedAnchor.download, filename)
  assert.equal(clickedAnchor.href, 'blob:test-backup')
  assert.equal(downloadedBlob.type, 'application/json')
  assert.equal(removed, true)
  assert.equal(importedBackup.version, 1)
  assert.equal(importedBackup.exportedAt, exportedAt)
  assert.deepEqual(importedBackup.records, records)
  assert.deepEqual(importedBackup.settings, exportedBackup.settings)
  assert.equal(revokedUrl, undefined)

  scheduledRevocation()
  assert.equal(revokedUrl, 'blob:test-backup')
})

test('releases the temporary backup URL when the download cannot be started', () => {
  const revokedUrls = []
  const environment = {
    document: {
      createElement: () => ({
        click() { throw new Error('Download blocked') },
        remove() {},
      }),
      body: { appendChild() {} },
    },
    url: {
      createObjectURL: () => 'blob:failed-backup',
      revokeObjectURL: (url) => revokedUrls.push(url),
    },
    schedule() {
      assert.fail('A failed download must not schedule delayed URL cleanup')
    },
  }

  assert.throws(() => downloadBackupFile(backup(), environment), /Download blocked/)
  assert.deepEqual(revokedUrls, ['blob:failed-backup'])
})

test('exports and imports version 1 backups using an isolated fictitious IndexedDB', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const existingRecord = {
    ...record,
    id: 'fake-existing-record',
    title: 'Registro fictício existente',
  }
  const fixture = createFakeIndexedDb([], undefined)
  globalThis.indexedDB = fixture.indexedDB

  try {
    const emptyExport = await exportData()
    assert.deepEqual(emptyExport.records, [])
    assert.deepEqual(emptyExport.settings, { reviewIntervalDays: 3 })
    assert.deepEqual(await loadSettings(), { reviewIntervalDays: 3 })

    await assert.rejects(
      importData({ ...emptyExport, records: [] }, 'replace'),
      /não contém registros/,
    )
    assert.equal(fixture.records.size, 0)

    const firstStage = roadmapStages[0]
    const firstStageRecord = setRoadmapStageStatus(firstStage, undefined, 'Em andamento', '2026-10-19', timestamp)
    await saveRecord(firstStageRecord)
    assert.deepEqual(await listRecords(), [firstStageRecord])

    const updatedStageRecord = setRoadmapStageStatus(firstStage, firstStageRecord, 'Concluído', '2026-10-19', '2026-01-02T12:00:00.000Z')
    await saveRecord(updatedStageRecord)
    assert.equal(fixture.records.size, 1)
    assert.equal((await listRecords())[0].id, `roadmap-stage:${firstStage.id}`)
    assert.equal((await listRecords())[0].data.completedAt, '2026-10-19')

    const batchRecords = [
      existingRecord,
      { ...record, id: 'fake-batch-record', title: 'Registro fictício em lote' },
    ]
    await saveRecords(batchRecords)
    assert.equal(fixture.records.size, 3)
    const reloadedDatabase = await import(`${databaseUrl}#reload`)
    assert.equal((await reloadedDatabase.listRecords()).length, 3)

    const exported = await exportData()
    assert.equal(exported.app, 'Dashboard-Estudos')
    assert.equal(exported.version, 1)
    assert.ok(!Number.isNaN(Date.parse(exported.exportedAt)))
    assert.equal(exported.records.length, 3)
    assert.equal(exported.records.find(({ id }) => id === firstStageRecord.id).data.completedAt, '2026-10-19')

    const generatedBackup = parseBackupJson(JSON.stringify(exported))
    await assert.rejects(
      importData({ ...generatedBackup, records: [] }, 'replace'),
      /não contém registros/,
    )
    assert.equal(fixture.records.size, 3)
    assert.equal(fixture.records.get(firstStageRecord.id).data.completedAt, '2026-10-19')

    const conflictingRecord = { ...existingRecord, title: 'Versão importada conflitante' }
    const addedRecord = {
      ...record,
      id: 'fake-new-record',
      title: 'Registro fictício novo',
    }
    const mergeBackup = {
      ...generatedBackup,
      records: [conflictingRecord, addedRecord],
      settings: { reviewIntervalDays: 7 },
    }

    assert.deepEqual(await importData(mergeBackup, 'merge'), { imported: 1, ignored: 1 })
    assert.equal(fixture.records.get(existingRecord.id).title, existingRecord.title)
    assert.equal(fixture.records.get(addedRecord.id).title, addedRecord.title)
    assert.deepEqual(await loadSettings(), { reviewIntervalDays: 3 })

    const duplicateStageBackup = {
      ...generatedBackup,
      records: [{ ...firstStageRecord, id: 'fake-duplicate-stage' }],
    }
    assert.deepEqual(await importData(duplicateStageBackup, 'merge'), { imported: 0, ignored: 1 })
    assert.equal(fixture.records.size, 4)

    const replacementRecord = {
      ...record,
      id: 'fake-replacement-record',
      title: 'Registro fictício de substituição',
    }
    const replacementBackup = {
      ...generatedBackup,
      records: [replacementRecord],
      settings: { reviewIntervalDays: 14 },
    }

    assert.deepEqual(await importData(replacementBackup, 'replace'), { imported: 1, ignored: 0 })
    assert.deepEqual([...fixture.records.values()], [replacementRecord])
    assert.equal(fixture.settings.get('app').value.reviewIntervalDays, 14)

    await removeRecords([replacementRecord.id])
    assert.deepEqual(await listRecords(), [])

    fixture.failNextWrite()
    const failedReplacement = {
      ...generatedBackup,
      records: [{ ...replacementRecord, id: 'fake-should-rollback' }],
      settings: { reviewIntervalDays: 30 },
    }
    await assert.rejects(importData(failedReplacement, 'replace'), /Fictitious transaction failure/)
    assert.deepEqual([...fixture.records.values()], [])
    assert.equal(fixture.settings.get('app').value.reviewIntervalDays, 14)

    await assert.rejects(
      importData({ ...generatedBackup, records: [{ ...record, type: 'invalid' }] }, 'merge'),
      /campos obrigatórios inválidos/,
    )
    assert.deepEqual([...fixture.records.values()], [])
  } finally {
    if (originalIndexedDb === undefined) delete globalThis.indexedDB
    else globalThis.indexedDB = originalIndexedDb
  }
})

test('validates fictitious records before writing and rejects duplicate or malformed batch entries', async () => {
  assert.throws(() => validateStudyRecords([{ ...record, id: '  ' }]), /campos obrigatórios inválidos/)
  assert.throws(() => validateStudyRecords([record, { ...record, title: 'ID duplicado' }]), /ID duplicado/)
  const stageRecord = setRoadmapStageStatus(roadmapStages[0], undefined, 'Em andamento', '2026-10-19', timestamp)
  assert.throws(() => validateStudyRecords([
    stageRecord,
    { ...stageRecord, id: 'another-id' },
  ]), /mais de um registro para a etapa/)

  const originalIndexedDb = globalThis.indexedDB
  const fixture = createFakeIndexedDb([], undefined)
  globalThis.indexedDB = fixture.indexedDB

  try {
    await assert.rejects(saveRecords([record, { ...record, id: '', title: 'Inválido' }]), /campos obrigatórios inválidos/)
    assert.equal(fixture.records.size, 0)
  } finally {
    if (originalIndexedDb === undefined) delete globalThis.indexedDB
    else globalThis.indexedDB = originalIndexedDb
  }
})

test('validates the session contract against roadmap IDs, timezone and explicit progress confirmation', async () => {
  const example = JSON.parse(await readFile(
    new URL('../integracao/entrada-chatgpt.exemplo.json', import.meta.url),
    'utf8',
  ))
  assert.deepEqual(parseStudySessionJson(JSON.stringify(example)), example)
  assert.throws(() => validateStudySession(studySession({ date: '2026-10-20T15:30:00' })), /fuso horário explícito/)
  for (const date of [
    '2026-02-30T12:00:00Z',
    '2026-02-29T12:00:00Z',
    '2026-13-01T12:00:00Z',
    '2026-00-10T12:00:00Z',
    '2026-04-31T12:00:00Z',
    '2026-01-00T12:00:00Z',
  ]) {
    assert.throws(() => validateStudySession(studySession({ date })), /data ISO 8601 válida/)
  }
  for (const date of [
    '2024-02-29T12:00:00Z',
    '2000-02-29T12:00:00-03:00',
    '2026-02-28T12:00:00+01:00',
  ]) {
    assert.equal(validateStudySession(studySession({ date })).date, date)
  }
  assert.throws(() => validateStudySession(studySession({
    modules: [{ id: 'not-a-roadmap-module', topics_studied: [] }],
  })), /não existe no roadmap/)
  assert.throws(() => validateStudySession(studySession({
    roadmap_updates: [{ ...studySession().roadmap_updates[0], stage_id: 'missing-stage' }],
  })), /não existe no roadmap/)
  assert.throws(() => validateStudySession(studySession({
    roadmap_updates: [{ ...studySession().roadmap_updates[0], confirmed_by_user: false }],
  })), /confirmação explícita/)
  assert.throws(() => validateStudySession(studySession({
    exercises: [{ ...studySession().exercises[0], attempted: false }],
  })), /sem uma tentativa/)
  assert.throws(() => validateStudySession(studySession({ unexpected: 'field' })), /campo\(s\) desconhecido/)
  assert.throws(() => validateStudySession(studySession({
    artifacts: [{ path: '..\\secrets.txt', description: 'Não permitido' }],
  })), /caminho relativo/)
})

test('imports a session once, updates only confirmed roadmap states and rejects conflicts atomically', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const fixture = createFakeIndexedDb([], undefined)
  globalThis.indexedDB = fixture.indexedDB

  try {
    const session = studySession()
    await assert.rejects(
      importStudySession(studySession({ date: '2026-02-30T12:00:00Z' })),
      /data ISO 8601 válida/,
    )
    assert.equal(fixture.records.size, 0)

    fixture.failNextWrite()
    await assert.rejects(importStudySession(session), /Fictitious transaction failure/)
    assert.equal(fixture.records.size, 0)

    const result = await importStudySession(session)
    assert.deepEqual(result, { sessionId: session.session_id, updatedStages: 1 })
    assert.equal(fixture.records.size, 2)
    const storedSession = fixture.records.get(`chat-session:${session.session_id}`)
    assert.equal(storedSession.type, 'session')
    assert.equal(storedSession.data.date, session.date)
    assert.deepEqual(JSON.parse(storedSession.data.exercises), session.exercises)
    assert.deepEqual(JSON.parse(storedSession.data.git), session.git)

    const stageRecord = fixture.records.get('roadmap-stage:javascript-compreender')
    assert.equal(stageRecord.data.status, 'Em andamento')
    assert.equal(stageRecord.data.stageId, 'javascript-compreender')
    assert.equal(stageRecord.data.completedAt, undefined)

    await assert.rejects(importStudySession(session), /já foi importada/)

    const conflictingSession = studySession({
      session_id: '123e4567-e89b-42d3-a456-426614174001',
      roadmap_updates: [{
        ...session.roadmap_updates[0],
        expected_status: null,
        status: 'Treinando',
      }],
    })
    await assert.rejects(importStudySession(conflictingSession), /Conflito na etapa/)
    assert.equal(fixture.records.has(`chat-session:${conflictingSession.session_id}`), false)
    assert.equal(fixture.records.get(stageRecord.id).data.status, 'Em andamento')

    const exportDataForSession = await sessionDatabaseApi.exportData()
    assert.equal(exportDataForSession.records.length, 2)
    const context = formatStudyContext(exportDataForSession.records, 'http://localhost:5173', timestamp)
    assert.match(context, /Funções/)
    assert.match(context, /javascript-compreender/)
    assert.match(context, /Commit: nenhum confirmado/)
  } finally {
    if (originalIndexedDb === undefined) delete globalThis.indexedDB
    else globalThis.indexedDB = originalIndexedDb
  }
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
  assert.equal(getRecommendedRoadmapStage([roadmapModule], []), first)
  assert.equal(calculateRoadmapProgress([roadmapModule], []).completed, 0)
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

test('preserves completion dates across regressions and repeated completion', () => {
  const completion = setRoadmapStageStatus(stage('stage-history'), undefined, 'Concluído', '2026-02-01', timestamp)
  const regressed = setRoadmapStageStatus(stage('stage-history'), completion, 'Em andamento', '2026-02-04', timestamp)
  assert.equal(regressed.data.completedAt, '2026-02-01')
  assert.equal(regressed.data.completionHistory, undefined)
  assert.equal(regressed.data.nextReviewDate, undefined)

  const completedAgain = setRoadmapStageStatus(stage('stage-history'), regressed, 'Concluído', '2026-02-08', timestamp)
  assert.equal(completedAgain.data.completedAt, '2026-02-08')
  assert.deepEqual(JSON.parse(completedAgain.data.completionHistory), ['2026-02-01'])
  assert.deepEqual(validateStudyRecords([completedAgain]), [completedAgain])
  assert.deepEqual(parseBackupJson(JSON.stringify(backup({ records: [completedAgain] }))).records, [completedAgain])
  assert.throws(() => validateStudyRecords([{
    ...completedAgain,
    data: { ...completedAgain.data, completionHistory: '{invalid' },
  }]), /histórico de conclusão.*inválido/)
  assert.throws(() => validateStudyRecords([{
    ...completedAgain,
    data: { ...completedAgain.data, completionHistory: '["2026-02-30"]' },
  }]), /histórico de conclusão.*inválido/)
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

test('validates the hierarchical catalog, stable DSA proposal and search/status navigation', () => {
  validateStudyCatalog()
  assert.equal(studyCatalog.length, 11)
  assert.equal(studySubjects.length > 0, true)
  assert.equal(studyTopics.length > 84, true)
  const dsa = studyCatalog.find(({ id }) => id === 'dsa-leetcode')
  assert.equal(dsa.parallel, true)
  const dsaTopics = dsa.subjects.flatMap(({ topics }) => topics)
  assert.equal(dsaTopics.length, 15)
  assert.equal(dsaTopics.filter(({ origin }) => origin === 'recuperado').length, 6)
  assert.equal(dsaTopics.filter(({ origin }) => origin === 'proposta').length, 9)
  assert.ok(dsaTopics.every(({ id }) => !id.includes('status')))
  assert.equal(findStudyTopic('fundamentos.python.sintaxe').subject.id, 'fundamentos.python')
  assert.ok(filterCatalogTopics(listCatalogTopics(), [], { query: 'monotonic stack' })
    .some(({ topic }) => topic.id === 'dsa.stack-queue'))
  assert.equal(getCatalogTopicStatus('fundamentos.python.sintaxe', []), 'Disponível')
  assert.equal(getCatalogTopicStatus('fundamentos.poo.modelagem', []), 'Bloqueado')
  assert.equal(filterCatalogTopics(listCatalogTopics(), [], { status: 'Disponível' })
    .some(({ topic }) => topic.id === 'fundamentos.python.sintaxe'), true)
  assert.deepEqual(calculateCatalogProgress([]), { total: studyTopics.length, completed: 0, percent: 0 })
})

test('represents the 20 required subjects in order and keeps DSA as a separate parallel track', () => {
  validateStudyCatalog()
  validateCurriculumAreas()
  const expectedTitles = [
    'JavaScript',
    'Git e GitHub',
    'HTML e CSS',
    'TypeScript',
    'React',
    'Vite e ferramentas de desenvolvimento',
    'Arquitetura de software',
    'Persistência e bancos de dados',
    'Testes',
    'Node.js',
    'HTTP e APIs',
    'SQL',
    'ORM e validação de dados',
    'Backend',
    'Inteligência artificial',
    'Integrações',
    'Segurança',
    'Deploy e infraestrutura',
    'Engenharia de software com IA',
    'Construção prática do AI Personal CFO',
  ]
  assert.deepEqual(curriculumAreas.map(({ title }) => title), expectedTitles)
  assert.equal(curriculumAreas.length, 20)
  assert.ok(curriculumAreas.every(({ subjectIds }) => subjectIds.length > 0))
  assert.equal(findCurriculumAreaForSubject('web.javascript').title, 'JavaScript')
  assert.equal(findCurriculumAreaForSubject('projeto.ai-personal-cfo').title, 'Construção prática do AI Personal CFO')
  assert.equal(findCurriculumAreaForSubject('dsa.topicos'), undefined)
  const mainTopics = listCatalogTopics({ includeParallel: false })
  const parallelTopics = listCatalogTopics({ parallelOnly: true })
  assert.equal(mainTopics.length + parallelTopics.length, studyTopics.length)
  assert.ok(parallelTopics.every(({ topic }) => dsaTopicsIds().includes(topic.id)))
  assert.deepEqual(calculateCatalogProgress([], { includeParallel: false }), {
    total: mainTopics.length,
    completed: 0,
    percent: 0,
  })
  assert.deepEqual(calculateParallelProgress([]), { total: 15, completed: 0, percent: 0 })
  assert.equal(calculateCurriculumProgress([]).length, 20)
  assert.ok(calculateCurriculumProgress([]).every(({ completed, percent }) => completed === 0 && percent === 0))
  assert.equal(calculateCurriculumAreaProgress([], 'area.javascript').title, 'JavaScript')
  assert.equal(calculateCurriculumAreaProgress([], 'area.inexistente'), undefined)
  assert.equal(getPhaseProgress([]).length, 11)
  assert.equal(getSubjectProgress([]).length, studySubjects.length)
  const curriculumTopics = listCurriculumTopics()
  assert.equal(curriculumTopics.length, calculateCurriculumProgress([]).reduce((sum, area) => sum + area.total, 0))
  assert.ok(curriculumTopics.every(({ subjectId }) => curriculumAreas.some(({ subjectIds }) => subjectIds.includes(subjectId))))
  assert.equal(curriculumTopics[0].topic.id, 'web.javascript.basico')
  assert.equal(curriculumTopics.some(({ subjectId }) => subjectId === 'fundamentos.python'), false)
  assert.deepEqual(calculateCatalogProgress([], { curriculumOnly: true }), {
    total: curriculumTopics.length,
    completed: 0,
    percent: 0,
  })
  assert.equal(getNextRecommendedTopic([]).topic.id, 'web.fundamentos.cliente-servidor')
  assert.equal(getNextRecommendedTopic([]).phaseParallel, false)
  assert.equal(getNextRecommendedTopic([], { curriculumOnly: true }).topic.id, 'web.javascript.basico')
})

function dsaTopicsIds() {
  return studyCatalog.find(({ id }) => id === 'dsa-leetcode').subjects.flatMap(({ topics }) => topics.map(({ id }) => id))
}

test('groups the browser in the official 20-subject order and separates supplementary and parallel tracks', () => {
  const groups = listOfficialTopicGroups()
  const principal = groups.filter(({ track }) => track === 'principal')
  assert.equal(principal.length, 20)
  assert.deepEqual(principal.map(({ title }) => title), curriculumAreas.map(({ title }) => title))
  assert.ok(groups.findIndex(({ track }) => track === 'suplementar') > groups.findLastIndex(({ track }) => track === 'principal'))
  assert.equal(groups.at(-1).track, 'paralela')
  assert.deepEqual(getCatalogTotals(), { principal: 137, suplementar: 13, paralela: 15, catalogo: 165 })
  assert.equal(listOfficialTopicEntries().length, 165)
  assert.equal(new Set(listOfficialTopicEntries().map(({ topic }) => topic.id)).size, 165)
  assert.ok(listOfficialTopicEntries().slice(0, 137).every(({ track }) => track === 'principal'))
  assert.ok(groups.filter(({ track }) => track === 'suplementar').every(({ description }) => /fora do progresso principal/i.test(description)))

  for (const group of groups) {
    const position = new Map(group.entries.map(({ topic }, index) => [topic.id, index]))
    for (const { topic } of group.entries) {
      for (const prerequisite of topic.prerequisites ?? []) {
        if (!position.has(prerequisite)) continue
        assert.ok(
          position.get(prerequisite) < position.get(topic.id),
          `${prerequisite} deve aparecer antes de ${topic.id} em ${group.title}`,
        )
      }
    }
  }
  assert.deepEqual(
    listOfficialTopicGroups({ includeSupplementary: false, includeParallel: false }).map(({ title }) => title),
    curriculumAreas.map(({ title }) => title),
  )
})

test('main progress bar uses only the 137 principal topics and updates by completed count', () => {
  const curriculumTopics = listCurriculumTopics()
  assert.equal(curriculumTopics.length, 137)
  assert.deepEqual(calculateCatalogProgress([], { curriculumOnly: true }), { total: 137, completed: 0, percent: 0 })
  const first = curriculumTopics[0]
  const target = { id: first.topic.id, title: first.topic.title, phaseId: first.phaseId, subjectId: first.subjectId }
  const started = setCatalogTopicStatus(target, undefined, 'Em andamento', undefined, '2026-10-24T00:00:00.000Z')
  assert.equal(calculateCatalogProgress([started], { curriculumOnly: true }).percent, 0)
  const completed = setCatalogTopicStatus(target, started, 'Concluído', '2026-10-24', '2026-10-24T01:00:00.000Z')
  assert.equal(calculateCatalogProgress([completed], { curriculumOnly: true }).completed, 1)
  assert.equal(calculateCatalogProgress([completed], { curriculumOnly: true }).percent, Math.round(1 / 137 * 100))
  // partial: simulate 25%
  let records = []
  for (let i = 0; i < 34; i++) {
    const t = curriculumTopics[i]
    records.push(setCatalogTopicStatus({ id: t.topic.id, title: t.topic.title, phaseId: t.phaseId, subjectId: t.subjectId }, undefined, 'Concluído', `2026-10-${String(10 + (i % 20)).padStart(2,'0')}`, `2026-10-${String(10 + (i % 20)).padStart(2,'0')}T00:00:00.000Z`))
  }
  assert.equal(calculateCatalogProgress(records, { curriculumOnly: true }).total, 137)
  assert.ok(calculateCatalogProgress(records, { curriculumOnly: true }).percent > 0)
  // 100%
  records = curriculumTopics.map((t, i) => setCatalogTopicStatus({ id: t.topic.id, title: t.topic.title, phaseId: t.phaseId, subjectId: t.subjectId }, undefined, 'Concluído', `2026-09-${String((i % 28) + 1).padStart(2,'0')}`, `2026-09-${String((i % 28) + 1).padStart(2,'0')}T00:00:00.000Z`))
  assert.deepEqual(calculateCatalogProgress(records, { curriculumOnly: true }), { total: 137, completed: 137, percent: 100 })
  const parallelTopics = listCatalogTopics({ parallelOnly: true })
  const parallel = parallelTopics[0]
  const dsaTarget = { id: parallel.topic.id, title: parallel.topic.title, phaseId: parallel.phaseId, subjectId: parallel.subjectId }
  const dsaCompleted = setCatalogTopicStatus(dsaTarget, undefined, 'Concluído', '2026-10-24', '2026-10-24T02:00:00.000Z')
  const mainOnly = calculateCatalogProgress([dsaCompleted], { curriculumOnly: true })
  assert.equal(mainOnly.total, 137)
  assert.equal(mainOnly.completed, 0)
  assert.equal(mainOnly.percent, 0)
  // supplementary doesn't affect
  const supp = listCatalogTopics().find(({ subjectId }) => subjectId === 'fundamentos.python')
  if (supp) {
    const sTarget = { id: supp.topic.id, title: supp.topic.title, phaseId: supp.phaseId, subjectId: supp.subjectId }
    const sDone = setCatalogTopicStatus(sTarget, undefined, 'Concluído', '2026-10-24', '2026-10-24T03:00:00.000Z')
    assert.equal(calculateCatalogProgress([sDone], { curriculumOnly: true }).percent, 0)
  }
})

test('records topic status transitions, completion dates and history without inventing past progress', () => {
  const topic = findStudyTopic('web.javascript.basico')
  const target = { id: topic.topic.id, title: topic.topic.title, phaseId: topic.phase.id, subjectId: topic.subject.id }
  const started = setCatalogTopicStatus(target, undefined, 'Em andamento', undefined, timestamp)
  assert.equal(started.data.status, 'Em andamento')
  assert.deepEqual(getCatalogStatusHistory(started), [{ status: 'Em andamento', at: timestamp }])
  assert.equal(started.data.completedAt, undefined)

  const completed = setCatalogTopicStatus(target, started, 'Concluído', '2026-01-02', '2026-01-02T12:00:00.000Z')
  assert.equal(completed.data.completedAt, '2026-01-02')
  assert.deepEqual(getCatalogStatusHistory(completed).map(({ status }) => status), ['Em andamento', 'Concluído'])
  assert.equal(calculateCatalogProgress([completed], { includeParallel: false }).completed, 1)

  const reopened = setCatalogTopicStatus(target, completed, 'Em andamento', undefined, '2026-01-03T12:00:00.000Z')
  const recompleted = setCatalogTopicStatus(target, reopened, 'Concluído', '2026-01-04', '2026-01-04T12:00:00.000Z')
  assert.equal(recompleted.data.completedAt, '2026-01-04')
  assert.deepEqual(JSON.parse(recompleted.data.completionHistory), ['2026-01-02'])
  assert.deepEqual(getCatalogStatusHistory(recompleted).map(({ status }) => status), ['Em andamento', 'Concluído', 'Em andamento', 'Concluído'])
  assert.equal(countRecordedCatalogTopics(listCatalogTopics(), [completed]), 1)
  assert.equal(getNextRecommendedTopic([started]).topic.id, 'web.javascript.basico')
  assert.equal(getNextRecommendedTopic([completed]).topic.id, 'web.fundamentos.cliente-servidor')
  assert.throws(() => setCatalogTopicStatus(target, undefined, 'Concluído', '2026-02-30', timestamp), /data de conclusão/)
})

test('previews backup replacement and merge before writing, flagging empty, partial and conflicting files', () => {
  const savedTopic = {
    id: 'roadmap-topic:web.javascript.basico',
    type: 'roadmapStage',
    title: 'Linguagem e valores',
    data: { phaseId: 'web', subjectId: 'web.javascript', topicId: 'web.javascript.basico', status: 'Em andamento' },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const otherStage = setRoadmapStageStatus(roadmapStages[0], undefined, 'Treinando', '2026-02-01', timestamp)

  const emptyReplace = previewBackupImport(backup({ records: [] }), [savedTopic, otherStage], 'replace')
  assert.equal(emptyReplace.blocked, true)
  assert.equal(emptyReplace.removed, 2)
  assert.ok(emptyReplace.warnings.some((warning) => /substituição é bloqueada/i.test(warning)))
  assert.ok(emptyReplace.warnings.some((warning) => /removerá 2 registro/i.test(warning)))

  const partialReplace = previewBackupImport(backup({ records: [savedTopic] }), [savedTopic, otherStage], 'replace')
  assert.equal(partialReplace.blocked, false)
  assert.equal(partialReplace.imported, 1)
  assert.equal(partialReplace.removed, 2)
  assert.ok(partialReplace.warnings.some((warning) => /menos que os 2 existentes/i.test(warning)))

  const merged = previewBackupImport(backup({ records: [savedTopic] }), [savedTopic], 'merge')
  assert.equal(merged.imported, 0)
  assert.equal(merged.ignored, 1)
  assert.equal(merged.removed, 0)
  assert.ok(merged.warnings.some((warning) => /serão ignorados/i.test(warning)))

  const topicConflict = { ...savedTopic, id: 'roadmap-topic:different-id' }
  const conflicts = findBackupConflicts([topicConflict], [savedTopic])
  assert.deepEqual([...conflicts], ['roadmap-topic:different-id'])

  const emptyMerge = previewBackupImport(backup({ records: [] }), [savedTopic], 'merge')
  assert.equal(emptyMerge.blocked, false)
  assert.equal(emptyMerge.imported, 0)
  assert.ok(emptyMerge.warnings.some((warning) => /não altera nada/i.test(warning)))
})

test('simulates legacy reconciliation without altering any old, unknown or personal progress record', async () => {
  const oldCompleted = {
    id: 'roadmap-stage:fundamentos-compreender', type: 'roadmapStage', title: 'Registro legado',
    data: { moduleId: 'fundamentos', stageId: 'fundamentos-compreender', status: 'Concluído', completedAt: '2026-01-02' },
    createdAt: timestamp, updatedAt: timestamp,
  }
  const unknown = { ...record, id: 'custom:unknown', data: { ...record.data, privateNote: 'preservar' } }
  const records = [oldCompleted, unknown]
  const before = structuredClone(records)
  const simulation = simulateProgressMigration(records)
  assert.equal(simulation.migrationEnabled, false)
  assert.equal(simulation.writesPerformed, 0)
  assert.deepEqual(records, before)
  assert.deepEqual(simulation.preservedRecordIds, records.map(({ id }) => id))
  assert.equal(simulation.items[0].candidateTarget, null)
  assert.equal(simulation.items[0].status, 'Concluído')
  assert.equal(simulation.items[0].completedAt, '2026-01-02')
  assert.equal(simulation.items[1].decision, 'preservar_sem_correspondencia')
  const manifest = JSON.parse(await readFile(new URL('../integracao/mapeamento-migracao-v1-v2.json', import.meta.url), 'utf8'))
  assert.equal(manifest.migration_enabled, false)
  assert.deepEqual(manifest.entries.map(({ old_id }) => old_id), legacyProgressMappings.map(({ old_id }) => old_id))
})

test('validates v2 exchange schema, date, stable IDs, subject relationship and duplicate entries', async () => {
  const example = JSON.parse(await readFile(new URL('../integracao/entrada-chatgpt-v2.exemplo.json', import.meta.url), 'utf8'))
  assert.deepEqual(parseTopicStudySessionJson(JSON.stringify(example)), example)
  assert.throws(() => validateTopicStudySession({ ...example, date: '2026-02-30T12:00:00Z' }), /data ISO 8601 válida/)
  assert.throws(() => validateTopicStudySession({ ...example, date: '2026-02-29T12:00:00Z' }), /data ISO 8601 válida/)
  assert.equal(validateTopicStudySession({ ...example, date: '2024-02-29T12:00:00Z' }).date, '2024-02-29T12:00:00Z')
  assert.throws(() => validateTopicStudySession({ ...example, topic_updates: [{ ...example.topic_updates[0], topic_id: 'missing.topic' }] }), /não existe no catálogo/)
  assert.throws(() => validateTopicStudySession({ ...example, topic_updates: [{ ...example.topic_updates[0], subject_id: 'web.javascript' }] }), /não corresponde/)
  assert.throws(() => validateTopicStudySession({ ...example, topic_updates: [...example.topic_updates, example.topic_updates[0]] }), /IDs duplicados/)
})

test('v2 session import requires approval, is idempotent and writes history with topic progress atomically', async () => {
  const example = JSON.parse(await readFile(new URL('../integracao/entrada-chatgpt-v2.exemplo.json', import.meta.url), 'utf8'))
  example.topic_updates[0].proposed_status = 'Concluído'
  const originalIndexedDb = globalThis.indexedDB
  const fixture = createFakeIndexedDb([], undefined)
  globalThis.indexedDB = fixture.indexedDB
  try {
    await assert.rejects(importTopicStudySession(example, false), /aprovação explícita/)
    assert.equal(fixture.records.size, 0)
    const result = await importTopicStudySession(example, true)
    assert.deepEqual(result, { sessionId: example.session_id, updatedStages: 1 })
    assert.equal(fixture.records.size, 2)
    const session = fixture.records.get(`chat-session:${example.session_id}`)
    assert.equal(session.data.schemaVersion, '2')
    assert.equal(session.data.approvedByUser, 'true')
    assert.deepEqual(JSON.parse(session.data.topicUpdates), example.topic_updates)
    const topicRecord = fixture.records.get('roadmap-topic:fundamentos.python.sintaxe')
    assert.equal(topicRecord.data.topicId, 'fundamentos.python.sintaxe')
    assert.equal(topicRecord.data.status, example.topic_updates[0].proposed_status)
    assert.equal(topicRecord.data.completedAt, example.date.slice(0, 10))
    await assert.rejects(importTopicStudySession(example, true), /já foi importada/)
    assert.equal(fixture.records.size, 2)
    const missingPrerequisite = {
      ...example,
      session_id: '323e4567-e89b-42d3-a456-426614174000',
      topic_updates: [{
        ...example.topic_updates[0],
        subject_id: 'fundamentos.poo',
        topic_id: 'fundamentos.poo.modelagem',
        expected_status: 'Bloqueado',
        proposed_status: 'Concluído',
      }],
    }
    await assert.rejects(importTopicStudySession(missingPrerequisite, true), /pré-requisito\(s\) pendente\(s\)/)
    assert.equal(fixture.records.size, 2)
  } finally {
    if (originalIndexedDb === undefined) delete globalThis.indexedDB
    else globalThis.indexedDB = originalIndexedDb
  }
})

test('v1 backup round-trip preserves legacy, new topic records, unknown records and settings', () => {
  const savedTopic = {
    id: 'roadmap-topic:fundamentos.python.sintaxe', type: 'roadmapStage', title: 'Sintaxe e dados',
    data: { phaseId: 'fundamentos', subjectId: 'fundamentos.python', topicId: 'fundamentos.python.sintaxe', status: 'Em andamento' },
    createdAt: timestamp, updatedAt: timestamp,
  }
  const unknown = { ...record, id: 'legacy:custom', data: { ...record.data, custom: 'keep' } }
  const oldStage = setRoadmapStageStatus(roadmapStages[0], undefined, 'Treinando', '2026-02-01', timestamp)
  const source = backup({ records: [oldStage, savedTopic, unknown], settings: { reviewIntervalDays: 14 } })
  const validated = parseBackupJson(JSON.stringify(source))
  assert.deepEqual(validated.records, [oldStage, savedTopic, unknown])
  assert.deepEqual(validated.settings, { reviewIntervalDays: 14 })
  assert.equal(validated.version, 1)
})
