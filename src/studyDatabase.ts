import {
  initialTopics,
  isRecordType,
  type AppSettings,
  type BackupFile,
  type RecordType,
  type StudyRecord,
} from './studyData'

const databaseName = 'dashboard-estudos'
const databaseVersion = 1
const recordsStore = 'records'
const settingsStore = 'settings'

let databasePromise: Promise<IDBDatabase> | undefined

function openDatabase(): Promise<IDBDatabase> {
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
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
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
  if (records.some(({ type }) => !isRecordType(type))) throw new Error('Tipo de registro inválido.')
  const database = await openDatabase()
  const transaction = database.transaction(recordsStore, 'readwrite')
  const store = transaction.objectStore(recordsStore)
  records.forEach((record) => store.put(record))
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
  const [records, settings] = await Promise.all([listRecords(), loadSettings()])
  return { app: 'Dashboard-Estudos', version: 1, exportedAt: new Date().toISOString(), records, settings }
}

export async function importData(backup: BackupFile, mode: 'replace' | 'merge'): Promise<number> {
  const database = await openDatabase()
  const transaction = database.transaction([recordsStore, settingsStore], 'readwrite')
  const store = transaction.objectStore(recordsStore)
  const transactionComplete = completeTransaction(transaction)
  let importedCount = 0
  if (mode === 'replace') {
    store.clear()
    backup.records.forEach((record) => {
      store.add(record)
      importedCount += 1
    })
  } else {
    const request = store.getAll()
    request.onsuccess = () => {
      const existingIds = new Set((request.result as StudyRecord[]).map(({ id }) => id))
      for (const record of backup.records) {
        if (existingIds.has(record.id)) continue
        store.add(record)
        importedCount += 1
      }
    }
    request.onerror = () => transaction.abort()
  }
  if (mode === 'replace') {
    transaction.objectStore(settingsStore).put({ key: 'app', value: backup.settings })
  }
  await transactionComplete
  return importedCount
}
