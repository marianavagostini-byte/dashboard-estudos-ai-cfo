import {
  initialTopics,
  findBackupConflicts,
  getCatalogTopicRecord,
  markRoadmapStageReviewed,
  setCatalogTopicStatus,
  setRoadmapStageStatus,
  validateBackup,
  validateStudyRecords,
  type AppSettings,
  type BackupFile,
  type CatalogTopicStatus,
  type RecordType,
  type RoadmapStatus,
  type RoadmapStage,
  type StudyRecord,
} from './studyData'
import { learningRoadmap } from './learningRoadmap'
import { getCatalogTopicStatus } from './studyData'
import { findStudyTopic } from './studyCatalog'
import { validateTopicStudySession, type TopicStudySession } from './studyTopicSession'
import { validateStudySession } from './studySession'

const databaseName = 'dashboard-estudos'
const databaseVersion = 1
const recordsStore = 'records'
const settingsStore = 'settings'

let databasePromise: Promise<IDBDatabase> | undefined

export function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(recordsStore)) {
        const store = database.createObjectStore(recordsStore, { keyPath: 'id' })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      if (!database.objectStoreNames.contains(settingsStore)) {
        database.createObjectStore(settingsStore, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => {
        database.close()
        databasePromise = undefined
      }
      resolve(database)
    }
    request.onerror = () => {
      databasePromise = undefined
      reject(request.error ?? new Error('Não foi possível abrir o armazenamento local.'))
    }
    request.onblocked = () => {
      databasePromise = undefined
      reject(new Error('Feche outras abas do Dashboard-Estudos para atualizar o armazenamento.'))
    }
  })
  return databasePromise
}

/**
 * Reseta a conexão cacheada com o armazenamento. Útil para testes que
 * substituem `globalThis.indexedDB` por uma implementação fictícia entre si.
 */
export function dbResetDatabase(): void {
  databasePromise = undefined
}

function completeTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('A gravação local foi cancelada.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha ao gravar os dados locais.'))
  })
}

export async function listRecords(type?: RecordType): Promise<StudyRecord[]> {
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readonly')
  const store = transaction.objectStore(recordsStore)
  const request = type ? store.index('type').getAll(type) : store.getAll()
  const result = await new Promise<StudyRecord[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Não foi possível ler os registros.'))
  })
  await completeTransaction(transaction)
  return result
}

export async function saveRecord(record: StudyRecord): Promise<void> {
  await saveRecords([record])
}

export async function saveRecords(records: StudyRecord[]): Promise<void> {
  const validRecords = validateStudyRecords(records)
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readwrite')
  const store = transaction.objectStore(recordsStore)
  validRecords.forEach((record) => store.put(record))
  await completeTransaction(transaction)
}

/* C3: gravação ao vivo — lê o registro corrente do banco dentro da mesma
   transação de gravação, em vez de confiar em snapshot React desatualizado. */

export async function saveCatalogTopicStatus(
  topic: { id: string; title: string; phaseId: string; subjectId: string },
  status: CatalogTopicStatus,
  date?: string,
  timestamp?: string,
): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readwrite')
  const store = transaction.objectStore(recordsStore)
  const transactionComplete = completeTransaction(transaction)

  const getRequest = store.get(`roadmap-topic:${topic.id}`)
  const outcome = { error: undefined as Error | undefined }

  getRequest.onsuccess = () => {
    try {
      const existing = getRequest.result as StudyRecord | undefined
      const updated = setCatalogTopicStatus(topic, existing, status, date, timestamp)
      const putRequest = store.put(updated)

      putRequest.onerror = () => {
        outcome.error =
          putRequest.error ?? new Error('Falha ao gravar o progresso do tópico.')
      }
    } catch (error) {
      outcome.error =
        error instanceof Error
          ? error
          : new Error('Falha ao gravar o progresso do tópico.')
      transaction.abort()
    }
  }

  getRequest.onerror = () => {
    outcome.error =
      getRequest.error ?? new Error('Falha ao ler o registro do tópico.')
    transaction.abort()
  }

  try {
    await transactionComplete
  } catch (error) {
    throw outcome.error ?? error
  }
}

export async function saveRoadmapStageStatus(
  stage: RoadmapStage,
  status: RoadmapStatus,
  date?: string,
): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readwrite')
  const store = transaction.objectStore(recordsStore)
  const getRequest = store.get(`roadmap-stage:${stage.id}`)
  await new Promise<void>((resolve, reject) => {
    getRequest.onsuccess = () => {
      const existing = getRequest.result as StudyRecord | undefined
      const updated = setRoadmapStageStatus(stage, existing, status, date)
      const putRequest = store.put(updated)
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () =>
        reject(putRequest.error ?? new Error('Falha ao gravar o progresso da etapa.'))
    }
    getRequest.onerror = () =>
      reject(getRequest.error ?? new Error('Falha ao ler o registro da etapa.'))
  })
  await completeTransaction(transaction)
}

/* C3 aplicado ao reviewStage: gravação ao vivo — lê o registro corrente do banco
   dentro da mesma transação de gravação, aplica a revisão sobre o registro real
   e só então persiste. Assim revisões rápidas não perdem atualizações de outras
   abas nem gravam snapshots React desatualizados. */
export async function saveReviewedStage(stageId: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readwrite')
  const store = transaction.objectStore(recordsStore)
  const getRequest = store.get(`roadmap-stage:${stageId}`)
  await new Promise<void>((resolve, reject) => {
    getRequest.onsuccess = () => {
      const existing = getRequest.result as StudyRecord | undefined
      if (!existing || existing.type !== 'roadmapStage' || !existing.data.stageId) {
        reject(new Error(`Não foi encontrado o registro da etapa "${stageId}" no armazenamento local.`))
        return
      }
      const updated = markRoadmapStageReviewed(existing)
      const putRequest = store.put(updated)
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () =>
        reject(putRequest.error ?? new Error('Falha ao gravar a revisão da etapa.'))
    }
    getRequest.onerror = () =>
      reject(getRequest.error ?? new Error('Falha ao ler o registro da etapa.'))
  })
  await completeTransaction(transaction)
}

export async function removeRecord(id: string): Promise<void> {
  await removeRecords([id])
}

export async function removeRecords(ids: string[]): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readwrite')
  const store = transaction.objectStore(recordsStore)
  ids.forEach((id) => store.delete(id))
  await completeTransaction(transaction)
}

export async function loadSettings(): Promise<AppSettings> {
  const database = await openDatabase()
  const transaction = database.transaction(settingsStore, 'readonly')
  const request = transaction.objectStore(settingsStore).get('app')
  const result = await new Promise<{ key: string; value: AppSettings } | undefined>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Não foi possível ler as configurações.'))
  })
  await completeTransaction(transaction)
  return result?.value ?? { reviewIntervalDays: 3 }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(settingsStore, 'readwrite')
  transaction.objectStore(settingsStore).put({ key: 'app', value: settings })
  await completeTransaction(transaction)
}

export async function seedInitialRoadmap(): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readwrite')
  const store = transaction.objectStore(recordsStore)
  const request = store.index('type').getAll('topic')
  request.onsuccess = () => {
    const topics = request.result as StudyRecord[]
    if (topics.length === 0) {
      const now = new Date().toISOString()
      initialTopics.forEach((topic) => {
        store.add({ ...topic, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
      })
      return
    }

    for (const initialTopic of initialTopics) {
      const duplicates = topics.filter((topic) => {
        if (topic.title !== initialTopic.title) return false
        const actualFields = Object.entries(topic.data).sort(([left], [right]) => left.localeCompare(right))
        const initialFields = Object.entries(initialTopic.data).sort(([left], [right]) => left.localeCompare(right))
        return JSON.stringify(actualFields) === JSON.stringify(initialFields)
      })
      duplicates.slice(1).forEach(({ id }) => store.delete(id))
    }
  }
  await completeTransaction(transaction)
}

export async function exportData(): Promise<BackupFile> {
  const database = await openDatabase()
  const transaction = database.transaction([recordsStore, settingsStore], 'readonly')
  const completion = completeTransaction(transaction)
  const recordsRequest = transaction.objectStore(recordsStore).getAll()
  const settingsRequest = transaction.objectStore(settingsStore).get('app')
  const requests = Promise.all([
    new Promise<StudyRecord[]>((resolve, reject) => {
      recordsRequest.onsuccess = () => resolve(recordsRequest.result)
      recordsRequest.onerror = () => reject(recordsRequest.error ?? new Error('Não foi possível exportar os registros.'))
    }),
    new Promise<{ key: string; value: AppSettings } | undefined>((resolve, reject) => {
      settingsRequest.onsuccess = () => resolve(settingsRequest.result)
      settingsRequest.onerror = () => reject(settingsRequest.error ?? new Error('Não foi possível exportar as configurações.'))
    }),
  ])
  const [[records, storedSettings]] = await Promise.all([requests, completion])
  validateStudyRecords(records) // não exporte silenciosamente registros inválidos ou corrompidos (C4)
  return {
    app: 'Dashboard-Estudos',
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    settings: storedSettings?.value ?? { reviewIntervalDays: 3 },
  }
}

export interface BackupImportResult {
  imported: number
  ignored: number
}

export async function importData(backup: BackupFile, mode: 'replace' | 'merge'): Promise<BackupImportResult> {
  const validatedBackup = validateBackup(backup)
  if (mode === 'replace' && validatedBackup.records.length === 0) {
    throw new Error('Este backup não contém registros. A substituição foi cancelada para proteger o progresso local.')
  }

  const database = await openDatabase()
  const transaction = database.transaction([recordsStore, settingsStore], 'readwrite')
  const store = transaction.objectStore(recordsStore)
  const transactionComplete = completeTransaction(transaction)

  const processImport = new Promise<BackupImportResult>((resolve) => {
    let imported = 0
    if (mode === 'replace') {
      store.clear()
      validatedBackup.records.forEach((record) => {
        store.add(record)
        imported += 1
      })
    } else {
      // modo merge: ler registros existentes e aplicar regras de conflito
      const request = store.getAll()
      request.onsuccess = () => {
        const existingRecords = request.result as StudyRecord[]
        const existingById = new Map(existingRecords.map((record) => [record.id, record]))
        const conflicts = findBackupConflicts(validatedBackup.records, existingRecords)
        for (const record of validatedBackup.records) {
          if (conflicts.has(record.id)) {
            // C5: não ignore silenciosamente um entrante mais recente. Substitua somente
            // quando estiver estritamente mais atual; empates mantêm o registro local.
            const existing = existingById.get(record.id)
            const maisRecente = existing
              ? (record.updatedAt ?? '') > (existing.updatedAt ?? '')
              : false
            if (!maisRecente) {
              // pula este registro, mantém o local
              continue
            }
            store.put(record) // sobrescreve o registro local mais antigo
          } else {
            store.add(record) // novo registro, nenhum conflito
          }
          imported += 1
        }
      }
      request.onerror = () => transaction.abort()
    }

    // quando a transação finalizar, resolver com os resultados
    transaction.oncomplete = () => {
      resolve({ imported, ignored: validatedBackup.records.length - imported })
    }
    transaction.onabort = () => {
      resolve({ imported: 0, ignored: validatedBackup.records.length })
    }
    transaction.onerror = () => {
      resolve({ imported: 0, ignored: validatedBackup.records.length })
    }
  })

  if (mode === 'replace') {
    transaction.objectStore(settingsStore).put({ key: 'app', value: validatedBackup.settings })
  }

  await transactionComplete
  const result = await processImport
  return result
}

export interface StudySessionImportResult {
  sessionId: string
  updatedStages: number
}

export async function importStudySession(input: unknown): Promise<StudySessionImportResult> {
  const session = validateStudySession(input)
  const stageById = new Map<string, RoadmapStage>(
    learningRoadmap.flatMap((module) => module.stages.map((stage) => [stage.id, stage])),
  )
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readwrite')
  const transactionComplete = completeTransaction(transaction)
  const store = transaction.objectStore(recordsStore)
  const request = store.getAll()
  let validationError: Error | undefined
  let updatedStages = 0

  request.onsuccess = () => {
    const existingRecords = request.result as StudyRecord[]
    if (existingRecords.some(({ type, data }) => type === 'session' && data.sessionId === session.session_id)) {
      validationError = new Error(`A sessão ${session.session_id} já foi importada.`)
      transaction.abort()
      return
    }

    const existingStageRecords = new Map(
      existingRecords
        .filter(({ type }) => type === 'roadmapStage')
        .map((record) => [record.data.stageId, record]),
    )
    for (const update of session.roadmap_updates) {
      const current = existingStageRecords.get(update.stage_id)
      const actualStatus = current?.data.status ?? null
      if (actualStatus !== update.expected_status) {
        validationError = new Error(
          `Conflito na etapa ${update.stage_id}: esperado ${update.expected_status ?? 'sem registro'}, encontrado ${actualStatus ?? 'sem registro'}. Nenhuma alteração foi aplicada.`,
        )
        transaction.abort()
        return
      }
    }

    const sessionRecord: StudyRecord = {
      id: `chat-session:${session.session_id}`,
      type: 'session',
      title: `Sessão de estudo — ${session.date.slice(0, 10)}`,
      data: {
        sessionId: session.session_id,
        date: session.date,
        source: session.source,
        modules: JSON.stringify(session.modules),
        exercises: JSON.stringify(session.exercises),
        artifacts: JSON.stringify(session.artifacts),
        tests: JSON.stringify(session.tests),
        roadmapUpdates: JSON.stringify(session.roadmap_updates),
        nextSteps: JSON.stringify(session.next_steps),
        notes: JSON.stringify(session.notes),
        durationMinutes: session.duration_minutes === null ? '' : String(session.duration_minutes),
        git: JSON.stringify(session.git),
      },
      createdAt: session.date,
      updatedAt: session.date,
    }
    store.add(sessionRecord)

    for (const update of session.roadmap_updates) {
      const stage = stageById.get(update.stage_id)!
      const current = existingStageRecords.get(update.stage_id)
      store.put(setRoadmapStageStatus(stage, current, update.status, session.date.slice(0, 10), session.date))
      if (current?.data.status !== update.status) updatedStages += 1
    }
  }
  request.onerror = () => transaction.abort()

  try {
    await transactionComplete
  } catch (error) {
    if (validationError) throw validationError
    throw error
  }
  return { sessionId: session.session_id, updatedStages }
}

export async function importTopicStudySession(input: unknown, approvedByUser: boolean): Promise<StudySessionImportResult> {
  const session: TopicStudySession = validateTopicStudySession(input)
  if (approvedByUser !== true) throw new Error('A importação exige aprovação explícita do usuário na prévia.')
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readwrite')
  const transactionComplete = completeTransaction(transaction)
  const store = transaction.objectStore(recordsStore)
  const request = store.getAll()
  let validationError: Error | undefined
  let updatedStages = 0
  const approvedAt = new Date().toISOString()

  request.onsuccess = () => {
    const existingRecords = request.result as StudyRecord[]
    if (existingRecords.some(({ type, data }) => type === 'session' && data.sessionId === session.session_id)) {
      validationError = new Error(`A sessão ${session.session_id} já foi importada.`)
      transaction.abort()
      return
    }
    for (const update of session.topic_updates) {
      const actualStatus = getCatalogTopicStatus(update.topic_id, existingRecords)
      if (actualStatus !== update.expected_status) {
        validationError = new Error(
          `Conflito no tópico ${update.topic_id}: esperado ${update.expected_status}, encontrado ${actualStatus}. Nenhuma alteração foi aplicada.`,
        )
        transaction.abort()
        return
      }
    }

    const proposedById = new Map(session.topic_updates.map(({ topic_id: topicId, proposed_status: status }) => [topicId, status]))
    const projectedStatus = (topicId: string) => proposedById.get(topicId) ?? getCatalogTopicStatus(topicId, existingRecords)
    for (const update of session.topic_updates) {
      if (update.proposed_status !== 'Concluído') continue
      const resolved = findStudyTopic(update.topic_id)!
      const missing = (resolved.topic.prerequisites ?? []).filter((id) => projectedStatus(id) !== 'Concluído')
      if (missing.length > 0) {
        validationError = new Error(
          `O tópico ${update.topic_id} não pode ser concluído: pré-requisito(s) pendente(s): ${missing.join(', ')}. Nenhuma alteração foi aplicada.`,
        )
        transaction.abort()
        return
      }
    }

    const sessionRecord: StudyRecord = {
      id: `chat-session:${session.session_id}`,
      type: 'session',
      title: `Estudo com ChatGPT — ${session.date.slice(0, 10)}`,
      data: {
        sessionId: session.session_id,
        schemaVersion: '2',
        date: session.date,
        source: session.source,
        approvedAt,
        approvedByUser: 'true',
        topicUpdates: JSON.stringify(session.topic_updates),
        notes: JSON.stringify(session.notes),
      },
      createdAt: approvedAt,
      updatedAt: approvedAt,
    }
    store.add(sessionRecord)
    for (const update of session.topic_updates) {
      const resolved = findStudyTopic(update.topic_id)!
      const current = getCatalogTopicRecord(existingRecords, update.topic_id)
      store.put(setCatalogTopicStatus({
        id: resolved.topic.id,
        title: resolved.topic.title,
        phaseId: resolved.phase.id,
        subjectId: resolved.subject.id,
      }, current, update.proposed_status, session.date.slice(0, 10), approvedAt))
      if (update.proposed_status !== update.expected_status) updatedStages += 1
    }
  }
  request.onerror = () => transaction.abort()
  try { await transactionComplete }
  catch (error) {
    if (validationError) throw validationError
    throw error
  }
  return { sessionId: session.session_id, updatedStages }
}
