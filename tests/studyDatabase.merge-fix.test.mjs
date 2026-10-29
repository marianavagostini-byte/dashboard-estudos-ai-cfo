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

const timestamp2 = '2026-01-10T10:00:00.000Z'

const baseRecord = {
  id: 'topic-1',
  type: 'topic',
  title: 'JavaScript',
  data: { status: 'Em estudo' },
  createdAt: timestamp,
  updatedAt: timestamp,
}

function createFakeIndexedDb(initialRecords = []) {
  let failNextWrite = false
  let closed = false
  const stores = new Map([
    ['records', new Map(initialRecords.map((item) => [item.id, structuredClone(item)]))],
    ['settings', new Map()],
  ])
  const keyPaths = new Map([['records', 'id'], ['settings', 'key']])
  let upgradeHandler = null

  const database = {
    objectStoreNames: { contains: (name) => stores.has(name) },
    close() { closed = true },
    onversionchange: null,
    transaction(storeNames, mode = 'readonly') {
      if (closed) throw new Error('A conexão com o armazenamento local foi fechada.')
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
        } else {
          transaction.oncomplete?.({ target: transaction })
        }
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


test('importData: importado mais antigo é ignorado, local preservado', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const existente = setCatalogTopicStatus(
    { id: 'web.javascript.basico', title: 'Linguagem e valores', phaseId: 'web', subjectId: 'web.javascript' },
    undefined, 'Concluído', '2026-01-10', '2026-01-10T10:00:00.000Z'
  )
  existente.updatedAt = '2026-01-10T10:00:00.000Z'

  const importadoMaisAntigo = { ...existente, data: { ...existente.data, status: 'Bloqueado' }, updatedAt: '2026-01-09T10:00:00.000Z' }

  const backup = {
    app: 'Dashboard-Estudos', version: 1, exportedAt: timestamp,
    records: [{ ...existente, data: { ...existente.data, status: 'Bloqueado' }, updatedAt: '2026-01-09T10:00:00.000Z' }],
    settings: { reviewIntervalDays: 3 },
  }

  const fixture = createFakeIndexedDb([existente])
  globalThis.indexedDB = fixture.indexedDB
  try {
    dbResetDatabase()
    const resultado = await importData(backup, 'merge')
    assert.equal(resultado.imported, 0, 'deve importar 0 registros')
    assert.equal(resultado.ignored, 1, 'deve ignorar 1 registro')
    const registro = fixture.records.get(`roadmap-topic:web.javascript.basico`)
    assert.ok(registro, 'deve existir registro local')
    assert.equal(registro.data.status, 'Concluído', 'local deve ser preservado')
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('importData: importado mais recente substitui o local', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const existente = setCatalogTopicStatus(
    { id: 'web.javascript.basico', title: 'Linguagem e valores', phaseId: 'web', subjectId: 'web.javascript' },
    undefined, 'Concluído', '2026-01-10', '2026-01-10T10:00:00.000Z'
  )
  existente.updatedAt = '2026-01-10T10:00:00.000Z'

  const importadoMaisRecente = { ...existente, data: { ...existente.data, status: 'Em andamento' }, updatedAt: '2026-01-11T10:00:00.000Z' }

  const backup = {
    app: 'Dashboard-Estudos', version: 1, exportedAt: timestamp,
    records: [{ ...existente, data: { ...existente.data, status: 'Em andamento' }, updatedAt: '2026-01-11T10:00:00.000Z' }],
    settings: { reviewIntervalDays: 3 },
  }

  const fixture = createFakeIndexedDb([existente])
  globalThis.indexedDB = fixture.indexedDB
  try {
    dbResetDatabase()
    const resultado = await importData(backup, 'merge')
    assert.equal(resultado.imported, 1, 'deve importar 1 registro')
    assert.equal(resultado.ignored, 0, 'deve ignorar 0 registros')
    const registro = fixture.records.get(`roadmap-topic:web.javascript.basico`)
    assert.ok(registro, 'deve existir registro')
    assert.equal(registro.data.status, 'Em andamento', 'local deve ser substituído pelo mais recente')
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('importData: empate de updatedAt mantém local preservado', async () => {
  const originalIndexedDb = globalThis.indexedDB
  const existente = setCatalogTopicStatus(
    { id: 'web.javascript.basico', title: 'Linguagem e valores', phaseId: 'web', subjectId: 'web.javascript' },
    undefined, 'Concluído', '2026-01-10', '2026-01-10T10:00:00.000Z'
  )
  existente.updatedAt = '2026-01-10T10:00:00.000Z'

  const empate = { ...existente, data: { ...existente.data, status: 'Disponível' }, updatedAt: '2026-01-10T10:00:00.000Z' }

  const backup = {
    app: 'Dashboard-Estudos', version: 1, exportedAt: timestamp,
    records: [{ ...existente, data: { ...existente.data, status: 'Disponível' }, updatedAt: '2026-01-10T10:00:00.000Z' }],
    settings: { reviewIntervalDays: 3 },
  }

  const fixture = createFakeIndexedDb([existente])
  globalThis.indexedDB = fixture.indexedDB
  try {
    dbResetDatabase()
    const resultado = await importData(backup, 'merge')
    assert.equal(resultado.imported, 0, 'deve importar 0 registros')
    assert.equal(resultado.ignored, 1, 'deve ignorar 1 registro')
    const registro = fixture.records.get(`roadmap-topic:web.javascript.basico`)
    assert.ok(registro, 'deve existir registro local')
    assert.equal(registro.data.status, 'Concluído', 'empate deve manter o local')
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

test('importData: registro novo é adicionado ao banco', async () => {
  const originalIndexedDb = globalThis.indexedDB

  const existente = setCatalogTopicStatus(
    { id: 'web.javascript.basico', title: 'Linguagem e valores', phaseId: 'web', subjectId: 'web.javascript' },
    undefined, 'Concluído', '2026-01-10', '2026-01-10T10:00:00.000Z'
  )
  existente.updatedAt = '2026-01-10T10:00:00.000Z'

  const novoRegistro = { id: 'topico-novo', title: 'Novo tópico', data: { ...baseRecord.data }, type: 'topic' }

  const backup = {
    app: 'Dashboard-Estudos', version: 1, exportedAt: timestamp,
    records: [{ ...novoRegistro, data: { ...novoRegistro.data, status: 'Em estudo' }, createdAt: timestamp, updatedAt: timestamp }],
    settings: { reviewIntervalDays: 3 },
  }

  const fixture = createFakeIndexedDb([existente])
  globalThis.indexedDB = fixture.indexedDB
  try {
    dbResetDatabase()
    const resultado = await importData(backup, 'merge')
    assert.equal(resultado.imported, 1, 'deve importar 1 registro')
    assert.equal(resultado.ignored, 0, 'deve ignorar 0 registros')
    assert.equal(fixture.records.size, 2, 'deve ter 2 registros no total')
    const novo = fixture.records.get('topico-novo')
    assert.ok(novo, 'deve existir o novo registro')
    assert.equal(novo.id, 'topico-novo', 'ID do novo registro deve ser "topico-novo"')
  } finally {
    globalThis.indexedDB = originalIndexedDb
  }
})

process.on('exit', () => {
  rm(tmpDir, { recursive: true, force: true }).catch(() => {})
})
