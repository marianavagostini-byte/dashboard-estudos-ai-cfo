import assert from 'node:assert/strict'
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const timestamp = '2026-01-01T12:00:00.000Z'

const tmpDir = await mkdtemp(join(tmpdir(), 'study-database-test-'))

const writeModule = async (source, fileName, replacements = {}) => {
  let transformed = source
  for (const [from, to] of Object.entries(replacements)) {
    transformed = transformed.replaceAll(from, to)
  }
  const { outputText } = ts.transpileModule(transformed, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  })
  await writeFile(join(tmpDir, fileName), outputText, 'utf8')
  return pathToFileURL(join(tmpDir, fileName)).href
}

const moduleSource = await readFile(new URL('../src/studyData.ts', import.meta.url), 'utf8')
const moduleUrl = await writeModule(moduleSource, 'studyData.mjs')
const studyCatalogSource = await readFile(new URL('../src/studyCatalog.ts', import.meta.url), 'utf8')
const studyCatalogUrl = await writeModule(studyCatalogSource, 'studyCatalog.mjs')
const catalogProgressSource = await readFile(new URL('../src/catalogProgress.ts', import.meta.url), 'utf8')
const catalogProgressUrl = await writeModule(catalogProgressSource, 'catalogProgress.mjs', {
  "from './studyData'": `from './studyData.mjs'`,
  "from './studyCatalog'": `from './studyCatalog.mjs'`,
})
const roadmapSource = await readFile(new URL('../src/learningRoadmap.ts', import.meta.url), 'utf8')
const roadmapUrl = await writeModule(roadmapSource, 'learningRoadmap.mjs')
const studySessionSource = await readFile(new URL('../src/studySession.ts', import.meta.url), 'utf8')
const studySessionUrl = await writeModule(studySessionSource, 'studySession.mjs', {
  "from './learningRoadmap'": `from './learningRoadmap.mjs'`,
  "from './studyData'": `from './studyData.mjs'`,
})
const topicSessionSource = await readFile(new URL('../src/studyTopicSession.ts', import.meta.url), 'utf8')
const topicSessionUrl = await writeModule(topicSessionSource, 'studyTopicSession.mjs', {
  "from './studyCatalog'": `from './studyCatalog.mjs'`,
})
const databaseSource = await readFile(new URL('../src/studyDatabase.ts', import.meta.url), 'utf8')
const databaseUrl = await writeModule(databaseSource, 'studyDatabase.mjs', {
  "from './studyData'": `from './studyData.mjs'`,
  "from './learningRoadmap'": `from './learningRoadmap.mjs'`,
  "from './catalogProgress'": `from './catalogProgress.mjs'`,
  "from './studyCatalog'": `from './studyCatalog.mjs'`,
  "from './studyTopicSession'": `from './studyTopicSession.mjs'`,
  "from './studySession'": `from './studySession.mjs'`,
})

const {
  getCatalogTopicRecord,
  setCatalogTopicStatus,
  setRoadmapStageStatus,
  markRoadmapStageReviewed,
  getCatalogStatusHistory,
  getCompletionHistory,
  getLocalDate,
  validateStudyRecords,
  validateBackup,
  findBackupConflicts,
  parseBackupJson,
  previewBackupImport,
  roadmapStatuses,
  catalogTopicStatusValues,
} = await import(moduleUrl)
const {
  listCatalogTopics,
  getCatalogTopicStatus,
  findStudyTopic,
} = await import(catalogProgressUrl)
const { learningRoadmap, roadmapStages } = await import(roadmapUrl)
const databaseApi = await import(databaseUrl)
const {
  listRecords,
  saveRecord,
  saveRecords,
  saveCatalogTopicStatus: dbSaveCatalogTopicStatus,
  dbResetDatabase,
  saveRoadmapStageStatus: dbSaveRoadmapStageStatus,
  saveReviewedStage,
  importData,
  exportData,
  loadSettings,
  openDatabase,
} = databaseApi










































function createFakeIndexedDb(initialRecords = [], initialSettings) {
  let failNextWrite = false
  let closed = false
  const stores = new Map([
    ['records', new Map(initialRecords.map((item) => [item.id, structuredClone(item)]))],
    ['settings', new Map(initialSettings ? [['app', { key: 'app', value: structuredClone(initialSettings) }]] : [])],
  ])
  const keyPaths = new Map([['records', 'id'], ['settings', 'key']])
  let upgradeHandler = null

  const database = {
    objectStoreNames: { contains: (name) => stores.has(name) },
    close() { closed = true },
    onversionchange: null,
    transaction(storeNames, mode = 'readonly') {
      if (closed) throw new Error('A conexÃ£o com o armazenamento local foi fechada.')
      const names = Array.isArray(storeNames) ? storeNames : [storeNames]
      const snapshots = new Map([...stores].map(([name, values]) => [
        name, new Map([...values].map(([key, value]) => [key, structuredClone(value)])),
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
              if (shouldFail) throw new Error('Fictitious write failure')
              records.set(item[keyPaths.get(name)], structuredClone(item))
              return requestFor(item)
            },
            add(item) {
              if (shouldFail) throw new Error('Fictitious write failure')
              const key = item[keyPaths.get(name)]
              if (records.has(key)) throw new Error(`Duplicate key: ${key}`)
              records.set(key, structuredClone(item))
              return requestFor(item)
            },
            delete: (key) => {
              if (shouldFail) throw new Error('Fictitious write failure')
              records.delete(key)
              return requestFor(undefined)
            },
            clear: () => {
              if (shouldFail) throw new Error('Fictitious write failure')
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

  const indexedDB = {
    open(name, version) {
      assert.equal(name, 'dashboard-estudos')
      const request = {
        result: database, error: null,
        onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null,
      }
      if (upgradeHandler) {
        try { upgradeHandler({ result: database }) } catch (error) { request.error = error }
      }
      queueMicrotask(() => request.onsuccess?.({ target: request }))
      return request
    },
  }

  return {
    database,
    indexedDB,
    records: stores.get('records'),
    settings: stores.get('settings'),
    failNextWrite() { failNextWrite = true },
    setUpgradeHandler(handler) { upgradeHandler = handler },
    setClosed(value) { closed = value },
    isClosed() { return closed },
  }
}

const baseRecord = {
  id: 'topic-1',
  type: 'topic',
  title: 'JavaScript',
  data: { status: 'Em estudo' },
  createdAt: timestamp,
  updatedAt: timestamp,
}


test('getCatalogTopicStatus deriva Bloqueado/DisponÃ­vel e interrompe ciclos de prÃ©-requisito', () => {
  const topicoA = findStudyTopic('web.javascript.basico')
  const topicoB = findStudyTopic('web.fundamentos.cliente-servidor')
  assert.ok(topicoA && topicoB)

  assert.equal(getCatalogTopicStatus(topicoA.topic.id, []), 'DisponÃ­vel')

  const semPreReq = { ...topicoB.topic, prerequisites: ['inexistente.topico'] }
  assert.equal(getCatalogTopicStatus(semPreReq.id, [], (id) => id === semPreReq.id ? semPreReq : undefined), 'Bloqueado')

  const cicloA = { id: 'ciclo.a', prerequisites: ['ciclo.b'] }
  const cicloB = { id: 'ciclo.b', prerequisites: ['ciclo.a'] }
  const lookupCiclo = (id) => id === cicloA.id ? cicloA : id === cicloB.id ? cicloB : undefined
  assert.equal(getCatalogTopicStatus(cicloA.id, [], lookupCiclo), 'Bloqueado')
  assert.equal(getCatalogTopicStatus(cicloB.id, [], lookupCiclo), 'Bloqueado')
})

test('setCatalogTopicStatus grava createdAt/updatedAt, histÃ³rico e datas de conclusÃ£o coerentes', () => {
  const topico = findStudyTopic('web.javascript.basico')
  const target = {
    id: topico.topic.id, title: topico.topic.title,
    phaseId: topico.phase.id, subjectId: topico.subject.id,
  }

  const started = setCatalogTopicStatus(target, undefined, 'Em andamento', undefined, timestamp)
  assert.equal(started.data.status, 'Em andamento')
  assert.equal(started.createdAt, timestamp)
  assert.equal(started.updatedAt, timestamp)
  assert.deepEqual(getCatalogStatusHistory(started), [{ status: 'Em andamento', at: timestamp }])
  assert.equal(started.data.completedAt, undefined)

  const completed = setCatalogTopicStatus(target, started, 'ConcluÃ­do', '2026-01-02', '2026-01-02T12:00:00.000Z')
  assert.equal(completed.data.completedAt, '2026-01-02')
  assert.deepEqual(getCatalogStatusHistory(completed).map(({ status }) => status), ['Em andamento', 'ConcluÃ­do'])

  const reopened = setCatalogTopicStatus(target, completed, 'Em andamento', undefined, '2026-01-03T12:00:00.000Z')
  const recompleted = setCatalogTopicStatus(target, reopened, 'ConcluÃ­do', '2026-01-04', '2026-01-04T12:00:00.000Z')
  assert.equal(recompleted.data.completedAt, '2026-01-04')
  assert.deepEqual(JSON.parse(recompleted.data.completionHistory), ['2026-01-02'])

  assert.throws(() => setCatalogTopicStatus(target, undefined, 'ConcluÃ­do', '2026-02-30', timestamp), /data de conclusÃ£o/)
})

test('setRoadmapStageStatus grava revisÃ£o, datas e histÃ³rico de conclusÃ£o', () => {
  const stage = roadmapStages[0]
  const target = { id: stage.id, moduleId: stage.moduleId, title: stage.title, prerequisites: stage.prerequisites, resources: stage.resources }

  const inProgress = setRoadmapStageStatus(target, undefined, 'Em andamento', '2026-02-01', timestamp)
  assert.equal(inProgress.data.status, 'Em andamento')
  assert.equal(inProgress.createdAt, timestamp)

  const completed = setRoadmapStageStatus(target, inProgress, 'ConcluÃ­do', '2026-02-01', '2026-02-01T12:00:00.000Z')
  assert.equal(completed.data.status, 'ConcluÃ­do')
  assert.equal(completed.data.completedAt, '2026-02-01')
  assert.equal(completed.data.reviewCount, '0')
  assert.ok(completed.data.nextReviewDate)

  const regressed = setRoadmapStageStatus(target, completed, 'Em andamento', '2026-02-05', '2026-02-05T12:00:00.000Z')
  assert.equal(regressed.data.status, 'Em andamento')
  assert.equal(regressed.data.nextReviewDate, undefined)

  const reviewed = markRoadmapStageReviewed(completed, '2026-02-08', '2026-02-08T12:00:00.000Z')
  assert.equal(reviewed.data.reviewCount, '1')
  assert.ok(reviewed.data.nextReviewDate)
  assert.equal(reviewed.data.lastReviewedAt, '2026-02-08')
})

test('validateStudyRecords aceita registros legais e preserva registros desconhecidos/legados', () => {
  const valido = {
    id: 'roadmap-topic:topico.teste',
    type: 'roadmapStage',
    title: 'TÃ³pico teste',
    data: { phaseId: 'web', subjectId: 'web.javascript', topicId: 'topico.teste', status: 'DisponÃ­vel' },
    createdAt: timestamp, updatedAt: timestamp,
  }
  const resultado = validateStudyRecords([valido])
  assert.equal(resultado.length, 1)

  const desconhecido = { ...baseRecord, id: 'custom:qualquer-coisa', data: { ...baseRecord.data, notaPrivada: 'preservar' } }
  const comDesconhecido = validateStudyRecords([valido, desconhecido])
  assert.equal(comDesconhecido.length, 2)
  assert.equal(comDesconhecido[1].id, 'custom:qualquer-coisa')

  assert.throws(() => validateStudyRecords([{ ...valido, id: '' }]), /campos obrigatÃ³rios invÃ¡lidos/)
  assert.throws(() => validateStudyRecords([valido, { ...valido, title: 'Duplicado' }]), /ID duplicado/)
})


test('salva e lista registros com persistence fictÃ­cia, incluindo registros desconhecidos', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const desconhecido = { ...baseRecord, id: 'custom:legado', data: { ...baseRecord.data, legado: 'sim' } }
  const fixture = createFakeIndexedDb([desconhecido])
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    assert.deepEqual(await listRecords(), [desconhecido])

    const topico = findStudyTopic('web.javascript.basico')
    const target = {
      id: topico.topic.id, title: topico.topic.title,
      phaseId: topico.phase.id, subjectId: topico.subject.id,
    }
    await dbSaveCatalogTopicStatus(target, 'ConcluÃ­do', '2026-01-05')
    assert.equal(fixture.records.size, 2)
    const gravado = fixture.records.get(`roadmap-topic:${topico.topic.id}`)
    assert.ok(gravado)
    assert.equal(gravado.data.status, 'ConcluÃ­do')
    assert.equal(gravado.data.completedAt, '2026-01-05')

    assert.equal(fixture.records.get('custom:legado').data.legado, 'sim')

    const exportado = await exportData()
    assert.equal(exportado.records.length, 2)
    assert.ok(exportado.records.some(({ id }) => id === 'custom:legado'))
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('gravaÃ§Ãµes rÃ¡pidas e concorrentes preservam histÃ³rico e nÃ£o perdem atualizaÃ§Ãµes', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const fixture = createFakeIndexedDb([])
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    const topico = findStudyTopic('web.javascript.basico')
    const target = {
      id: topico.topic.id, title: topico.topic.title,
      phaseId: topico.phase.id, subjectId: topico.subject.id,
    }

    await dbSaveCatalogTopicStatus(target, 'ConcluÃ­do', '2026-01-05')
    await dbSaveCatalogTopicStatus(target, 'Em andamento', undefined)
    const gravado = fixture.records.get(`roadmap-topic:${topico.topic.id}`)
    assert.equal(gravado.data.status, 'Em andamento')
    assert.deepEqual(getCatalogStatusHistory(gravado).map(({ status }) => status), ['ConcluÃ­do', 'Em andamento'])
    assert.equal(fixture.records.size, 1)

    const topicos = listCatalogTopics().slice(0, 5)
    await Promise.all(topicos.map(({ topic }) =>
      dbSaveCatalogTopicStatus({
        id: topic.id, title: topic.title, phaseId: topico.phase.id, subjectId: topico.subject.id,
      }, 'Em andamento')))
    assert.equal(fixture.records.size, 6)
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('falha de gravaÃ§Ã£o faz rollback da transaÃ§Ã£o e nÃ£o altera o banco', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const existente = setCatalogTopicStatus(
    { id: 'web.javascript.basico', title: 'Linguagem e valores', phaseId: 'web', subjectId: 'web.javascript' },
    undefined, 'Em andamento', '2026-01-01', timestamp)
  existente.updatedAt = '2026-01-01T12:00:00.000Z'
  const fixture = createFakeIndexedDb([existente])
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    fixture.failNextWrite()
    await assert.rejects(
      dbSaveCatalogTopicStatus(
        { id: 'web.javascript.basico', title: 'Linguagem e valores', phaseId: 'web', subjectId: 'web.javascript' },
        'ConcluÃ­do', '2026-01-02'),
      /Fictitious write failure/,
    )
    const aposFalha = fixture.records.get(`roadmap-topic:web.javascript.basico`)
    assert.equal(aposFalha.data.status, 'Em andamento')
    assert.equal(fixture.records.size, 1)
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('fechamento da conexÃ£o (versionchange) Ã© recuperado reabrindo o armazenamento', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const fixture = createFakeIndexedDb([])
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    const database = await openDatabase()
    assert.ok(database)

    database.onversionchange?.({ target: database })
    assert.equal(fixture.isClosed(), true)

    const novamente = await openDatabase()
    assert.ok(novamente)
    assert.equal(fixture.isClosed(), false)

    const topico = findStudyTopic('web.javascript.basico')
    const target = {
      id: topico.topic.id, title: topico.topic.title,
      phaseId: topico.phase.id, subjectId: topico.subject.id,
    }
    await dbSaveCatalogTopicStatus(target, 'ConcluÃ­do', '2026-01-06')
    assert.equal(fixture.records.get(`roadmap-topic:${topico.topic.id}`).data.status, 'ConcluÃ­do')
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('inicializaÃ§Ã£o do schema cria as stores esperadas', async () => {
  const originalIndexedDb = globalThis.indexedDB
  let upgradeRan = false
  const fixture = createFakeIndexedDb([])
  fixture.setUpgradeHandler((database) => {
    upgradeRan = true
  })
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    const database = await openDatabase()
    assert.ok(database.objectStoreNames.contains('records'))
    assert.ok(database.objectStoreNames.contains('settings'))
    assert.equal(upgradeRan, true)
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})


test('importData merge: registro local mais recente Ã© mantido; importado mais recente substitui; empate mantÃ©m o local', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const existente = setCatalogTopicStatus(
    { id: 'web.javascript.basico', title: 'Linguagem e valores', phaseId: 'web', subjectId: 'web.javascript' },
    undefined, 'ConcluÃ­do', '2026-01-10', '2026-01-10T10:00:00.000Z')
  existente.updatedAt = '2026-01-10T10:00:00.000Z'

  const importadoMaisAntigo = { ...existente, data: { ...existente.data, status: 'Bloqueado' }, updatedAt: '2026-01-09T10:00:00.000Z' }
  const importadoMaisRecente = { ...existente, data: { ...existente.data, status: 'Em andamento' }, updatedAt: '2026-01-11T10:00:00.000Z' }
  const empate = { ...existente, data: { ...existente.data, status: 'DisponÃ­vel' }, updatedAt: '2026-01-10T10:00:00.000Z' }
  const semData = { ...existente, data: { ...existente.data, status: 'Bloqueado' }, updatedAt: '' }

  const novo = { ...baseRecord, id: 'topico-novo', title: 'Novo tÃ³pico', data: { ...baseRecord.data } }

  const backup = {
    app: 'Dashboard-Estudos', version: 1, exportedAt: timestamp,
    records: [importadoMaisAntigo, importadoMaisRecente, empate, semData, novo],
    settings: { reviewIntervalDays: 3 },
  }

  const fixture = createFakeIndexedDb([existente])
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    const resultado = await importData(backup, 'merge')
    assert.equal(resultado.imported, 3)
    assert.equal(resultado.ignored, 2)

    const registro = fixture.records.get(`roadmap-topic:web.javascript.basico`)
    assert.equal(registro.data.status, 'ConcluÃ­do')
    assert.equal(fixture.records.get('topico-novo').id, 'topico-novo')

    const segundoBackup = {
      app: 'Dashboard-Estudos', version: 1, exportedAt: timestamp,
      records: [{ ...existente, data: { ...existente.data, status: 'Bloqueado' }, updatedAt: '2026-01-12T10:00:00.000Z' }],
      settings: { reviewIntervalDays: 3 },
    }
    await importData(segundoBackup, 'merge')
    assert.equal(fixture.records.get(`roadmap-topic:web.javascript.basico`).data.status, 'Bloqueado')
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('previewBackupImport reflete a operaÃ§Ã£o real de importData (conflitos e substituiÃ§Ãµes)', async () => {
  const existente = setCatalogTopicStatus(
    { id: 'web.javascript.basico', title: 'Linguagem e valores', phaseId: 'web', subjectId: 'web.javascript' },
    undefined, 'Em andamento', '2026-01-10', timestamp)
  const conflito = { ...existente, data: { ...existente.data, status: 'ConcluÃ­do' } }
  const novo = { ...baseRecord, id: 'topico-novo', title: 'Novo', data: { ...baseRecord.data } }

  const backup = {
    app: 'Dashboard-Estudos', version: 1, exportedAt: timestamp,
    records: [conflito, novo], settings: { reviewIntervalDays: 3 },
  }

  const previa = previewBackupImport(backup, [existente], 'merge')
  assert.equal(previa.incoming, 2)
  assert.equal(previa.existing, 1)
  assert.equal(previa.imported, 1)
  assert.equal(previa.ignored, 1)
  assert.equal(previa.removed, 0)
  assert.ok(previa.warnings.some((w) => /serÃ£o ignorados/i.test(w)))

  const previaReplace = previewBackupImport(backup, [existente], 'replace')
  assert.equal(previaReplace.imported, 2)
  assert.equal(previaReplace.removed, 1)
  assert.ok(previaReplace.warnings.some((w) => /removerÃ¡ 1 registro/i.test(w)))

  const vazio = previewBackupImport({ ...backup, records: [] }, [existente], 'replace')
  assert.equal(vazio.blocked, true)
  assert.equal(vazio.removed, 1)

  const originalIndexedDb = globalThis.indexedDB
  const fixture = createFakeIndexedDb([existente])
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    const resultado = await importData(backup, 'merge')
    assert.equal(resultado.imported, 1)
    assert.equal(resultado.ignored, 1)
    assert.equal(fixture.records.get(`roadmap-topic:web.javascript.basico`).data.status, 'Em andamento')
    assert.equal(fixture.records.get('topico-novo').id, 'topico-novo')
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})


test('importData importar o mesmo arquivo duas vezes nÃ£o duplica registros nem repete operaÃ§Ãµes', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const existente = setCatalogTopicStatus(
    { id: 'web.javascript.basico', title: 'Linguagem e valores', phaseId: 'web', subjectId: 'web.javascript' },
    undefined, 'ConcluÃ­do', '2026-01-10', timestamp)
  const backup = {
    app: 'Dashboard-Estudos', version: 1, exportedAt: timestamp,
    records: [{ ...existente, data: { ...existente.data, status: 'Em andamento' }, updatedAt: '2026-01-11T10:00:00.000Z' }],
    settings: { reviewIntervalDays: 3 },
  }
  const fixture = createFakeIndexedDb([existente])
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    const primeiro = await importData(backup, 'merge')
    assert.equal(primeiro.imported, 1)
    assert.equal(fixture.records.get(`roadmap-topic:web.javascript.basico`).data.status, 'Em andamento')

    const segundo = await importData(backup, 'merge')
    assert.equal(segundo.imported, 0)
    assert.equal(fixture.records.size, 1)
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('exportData valida registros antes de exportar e inclui configuraÃ§Ãµes', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const fixture = createFakeIndexedDb([], { reviewIntervalDays: 7 })
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    const vazio = await exportData()
    assert.deepEqual(vazio.records, [])
    assert.deepEqual(vazio.settings, { reviewIntervalDays: 7 })
    assert.ok(!Number.isNaN(Date.parse(vazio.exportedAt)))

    await saveRecord({ ...baseRecord, id: 'export-1' })
    const comRegistros = await exportData()
    assert.equal(comRegistros.records.length, 1)
    assert.equal(comRegistros.records[0].id, 'export-1')
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('backup duplicado, vazio e corrompido sÃ£o rejeitados antes de gravar', () => {
  assert.throws(() => validateBackup({ app: 'outro-app', version: 1, records: [], settings: { reviewIntervalDays: 3 } }), /nÃ£o Ã© um backup/)
  assert.throws(() => validateBackup({ app: 'Dashboard-Estudos', version: 2, records: [], settings: { reviewIntervalDays: 3 } }), /VersÃ£o de backup nÃ£o suportada/)
  assert.throws(() => parseBackupJson('{invalid json'), /nÃ£o contÃ©m um JSON vÃ¡lido/)
  assert.throws(() => validateBackup({ app: 'Dashboard-Estudos', version: 1, records: [], settings: { reviewIntervalDays: 0 } }), /entre 1 e 365/)
  assert.throws(() => validateBackup({ app: 'Dashboard-Estudos', version: 1, records: [baseRecord, { ...baseRecord, title: 'dup' }], settings: { reviewIntervalDays: 3 } }), /ID duplicado/)
})

test('salvar tÃ³pico e etapa atualiza updatedAt e nÃ£o reseta createdAt', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const fixture = createFakeIndexedDb([])
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    const topico = findStudyTopic('web.javascript.basico')
    const target = {
      id: topico.topic.id, title: topico.topic.title,
      phaseId: topico.phase.id, subjectId: topico.subject.id,
    }
    await dbSaveCatalogTopicStatus(target, 'Em andamento', undefined, timestamp)
    const primeiro = fixture.records.get(`roadmap-topic:${topico.topic.id}`)
    assert.equal(primeiro.createdAt, timestamp)
    const primeiroUpdatedAt = primeiro.updatedAt

    await new Promise((resolve) => setTimeout(resolve, 10))
    await dbSaveCatalogTopicStatus(target, 'ConcluÃ­do', '2026-01-02')
    const segundo = fixture.records.get(`roadmap-topic:${topico.topic.id}`)
    assert.equal(segundo.createdAt, timestamp)
    assert.ok(segundo.updatedAt > primeiroUpdatedAt)
    assert.equal(segundo.data.completedAt, '2026-01-02')
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('persistÃªncia de progresso apÃ³s recarregar (nova conexÃ£o lÃª os mesmos registros)', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const topico = findStudyTopic('web.javascript.basico')
  const target = {
    id: topico.topic.id, title: topico.topic.title,
    phaseId: topico.phase.id, subjectId: topico.subject.id,
  }
  const fixture = createFakeIndexedDb([])
  globalThis.indexedDB = fixture.indexedDB
  try {
  dbResetDatabase()
    await dbSaveCatalogTopicStatus(target, 'ConcluÃ­do', '2026-01-07')
    const idTopico = `roadmap-topic:${topico.topic.id}`

    const persistidos = new Map(fixture.records)
    const novaFixture = createFakeIndexedDb([...persistidos.values()])
    const originalOpen = globalThis.indexedDB.open
    globalThis.indexedDB = novaFixture.indexedDB
    try {
      const recarregados = await listRecords()
      assert.equal(recarregados.length, 1)
      assert.equal(recarregados[0].id, idTopico)
      assert.equal(recarregados[0].data.status, 'ConcluÃ­do')
      assert.equal(recarregados[0].data.completedAt, '2026-01-07')
    } finally {
      globalThis.indexedDB = originalOpen ? { open: originalOpen } : novaFixture.indexedDB
    }
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})





process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})


process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})


process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})