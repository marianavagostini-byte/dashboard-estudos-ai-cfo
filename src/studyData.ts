export const recordTypes = [
  'topic',
  'tutor',
  'challenge',
  'project',
  'projectTask',
  'review',
  'session',
  'error',
  'material',
  'roadmapStage',
] as const

export type RecordType = (typeof recordTypes)[number]

export interface StudyRecord {
  id: string
  type: RecordType
  title: string
  data: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  reviewIntervalDays: number
}

export type RoadmapStatus = 'Não iniciado' | 'Em andamento' | 'Treinando' | 'Concluído'
export type CatalogTopicStatus = 'Bloqueado' | 'Disponível' | 'Em andamento' | 'Concluído'

export const catalogTopicStatusValues: readonly CatalogTopicStatus[] = [
  'Bloqueado',
  'Disponível',
  'Em andamento',
  'Concluído',
]

export interface CatalogStatusHistoryEntry {
  status: CatalogTopicStatus
  at: string
}

function parseStatusHistory(serialized: string | undefined): CatalogStatusHistoryEntry[] {
  if (!serialized) return []
  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is CatalogStatusHistoryEntry =>
      !!entry
      && typeof entry === 'object'
      && typeof (entry as { status?: unknown }).status === 'string'
      && catalogTopicStatusValues.includes((entry as { status: CatalogTopicStatus }).status)
      && typeof (entry as { at?: unknown }).at === 'string'
      && !Number.isNaN(Date.parse((entry as { at: string }).at)),
    )
  } catch {
    return []
  }
}

export function getCatalogStatusHistory(record: StudyRecord | undefined): CatalogStatusHistoryEntry[] {
  return parseStatusHistory(record?.data.statusHistory)
}

export function getCompletionHistory(record: StudyRecord | undefined): string[] {
  if (!record?.data.completionHistory) return []
  try {
    const parsed: unknown = JSON.parse(record.data.completionHistory)
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : []
  } catch {
    return []
  }
}

export interface LearningResource {
  title: string
  author: string
  url: string
  learning: string
}

export interface RoadmapStage {
  id: string
  moduleId: string
  title: string
  objective: string
  activity: string
  prerequisites: string[]
  resources: LearningResource[]
}

export interface RoadmapModule {
  id: string
  title: string
  summary: string
  concepts: string
  guidedPractice: string
  independentPractice: string
  validation: string
  stages: RoadmapStage[]
}

export interface BackupFile {
  app: 'Dashboard-Estudos'
  version: 1
  exportedAt: string
  records: StudyRecord[]
  settings: AppSettings
}

export const recordLabels: Record<RecordType, string> = {
  topic: 'Tópico',
  tutor: 'Registro teórico',
  challenge: 'Exercício ou desafio',
  project: 'Projeto',
  projectTask: 'Tarefa de projeto',
  review: 'Revisão',
  session: 'Sessão de estudo',
  error: 'Erro de programação',
  material: 'Material',
  roadmapStage: 'Etapa do roadmap',
}

export const progressStates = [
  'Não iniciado',
  'Em estudo',
  'Em prática',
  'Em revisão',
  'Consolidado',
  'Dominado',
] as const

export const helpLevels = [
  'Independente',
  'Dica leve',
  'Orientação guiada',
  'Apoio completo',
] as const

export const roadmapStatuses: readonly RoadmapStatus[] = [
  'Não iniciado',
  'Em andamento',
  'Treinando',
  'Concluído',
]

export const reviewIntervals = [1, 3, 7, 14] as const

export function addLocalDays(date: string, days: number): string {
  const localDate = new Date(`${date}T12:00:00`)
  localDate.setDate(localDate.getDate() + days)
  return getLocalDate(localDate)
}

export function getLocalDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function getDateAfterDays(days: number, date = new Date()): string {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return getLocalDate(next)
}

export function getDefaultRecordData(type: RecordType, date = getLocalDate()): Record<string, string> {
  switch (type) {
    case 'topic':
      return { status: 'Não iniciado', priority: 'Média' }
    case 'challenge':
      return { helpLevel: 'Independente', status: 'Pendente', attempts: '0' }
    case 'project':
      return { status: 'Planejado' }
    case 'projectTask':
      return { status: 'Pendente' }
    case 'review':
      return { dueDate: date }
    case 'session':
      return { date, status: 'Concluída' }
    case 'material':
      return { status: 'Não iniciado', kind: 'Outro' }
    default:
      return {}
  }
}

export function normalizeTitle(title: string): string {
  const normalized = title.trim()
  if (!normalized) throw new Error('Informe um título antes de salvar.')
  return normalized
}

export function sortTopics<T extends StudyRecord>(topics: readonly T[]): T[] {
  return [...topics].sort((left, right) =>
    Number(left.data.position || 9999) - Number(right.data.position || 9999)
      || (left.data.module ?? '').localeCompare(right.data.module ?? '')
      || left.title.localeCompare(right.title),
  )
}

export function getNextTopicPosition(topics: readonly StudyRecord[]): number {
  const positions = topics
    .map(({ data }) => Number(data.position))
    .filter((position) => Number.isFinite(position) && position > 0)
  return Math.max(0, ...positions) + 1
}

export function reorderTopics(
  topics: readonly StudyRecord[],
  topicId: string,
  delta: -1 | 1,
): StudyRecord[] {
  const ordered = sortTopics(topics)
  const index = ordered.findIndex(({ id }) => id === topicId)
  const targetIndex = index + delta
  if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return [...topics]

  const current = ordered[index]
  const target = ordered[targetIndex]
  let nextPosition = Math.max(0, ...ordered.map(({ data }) => Number(data.position) || 0))
  const positions = new Map<string, string>()
  for (const { id, data } of ordered) {
    const position = Number(data.position)
    positions.set(id, data.position && Number.isFinite(position) && position > 0 ? data.position : String(++nextPosition))
  }
  const currentPosition = positions.get(current.id)!
  const targetPosition = positions.get(target.id)!
  positions.set(current.id, targetPosition)
  positions.set(target.id, currentPosition)
  return sortTopics(ordered.map((record): StudyRecord => ({
    ...record,
    data: { ...record.data, position: positions.get(record.id)! },
  })))
}

export function resolveTopicTitle(topics: readonly StudyRecord[], topicId?: string): string | undefined {
  if (!topicId) return undefined
  return topics.find(({ id, type }) => type === 'topic' && id === topicId)?.title ?? 'Tópico excluído'
}

export function getRoadmapStageRecord(records: readonly StudyRecord[], stageId: string): StudyRecord | undefined {
  return records.find(({ type, data }) => type === 'roadmapStage' && data.stageId === stageId)
}

export function getCatalogTopicRecord(records: readonly StudyRecord[], topicId: string): StudyRecord | undefined {
  return records.find(({ type, data }) => type === 'roadmapStage' && data.topicId === topicId)
}

export function setCatalogTopicStatus(
  topic: { id: string; title: string; phaseId: string; subjectId: string },
  existing: StudyRecord | undefined,
  status: CatalogTopicStatus,
  date = getLocalDate(),
  timestamp = new Date().toISOString(),
): StudyRecord {
  if (!catalogTopicStatusValues.includes(status)) {
    throw new Error('O status do tópico não é válido.')
  }
  if (status === 'Concluído' && !isValidDateOnly(date)) {
    throw new Error('A data de conclusão do tópico é inválida.')
  }
  const previousStatus = existing?.data.status as CatalogTopicStatus | undefined
  const data: Record<string, string> = {
    ...existing?.data,
    phaseId: topic.phaseId,
    subjectId: topic.subjectId,
    topicId: topic.id,
    status,
  }
  if (previousStatus !== status) {
    const history = parseStatusHistory(existing?.data.statusHistory)
    data.statusHistory = JSON.stringify([...history, { status, at: timestamp }])
  }
  if (status === 'Concluído' && !existing?.data.completedAt) data.completedAt = date
  if (status === 'Concluído' && existing?.data.completedAt && previousStatus !== 'Concluído') {
    const previousCompletions = getCompletionHistory(existing)
    data.completionHistory = JSON.stringify([...new Set([...previousCompletions, existing.data.completedAt])])
    data.completedAt = date
  }
  if (status !== 'Concluído') delete data.nextReviewDate
  return {
    id: existing?.id ?? `roadmap-topic:${topic.id}`,
    type: 'roadmapStage',
    title: topic.title,
    data,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

export function getRoadmapStageContent(module: RoadmapModule, stage: RoadmapStage): {
  summary: string
  concepts: string
  objective?: string
  activity: string
} {
  return {
    summary: module.summary,
    concepts: module.concepts,
    objective: stage.objective === module.concepts ? undefined : stage.objective,
    activity: stage.activity,
  }
}

export function setRoadmapStageStatus(
  stage: RoadmapStage,
  existing: StudyRecord | undefined,
  status: RoadmapStatus,
  date = getLocalDate(),
  timestamp = new Date().toISOString(),
): StudyRecord {
  const data: Record<string, string> = { ...existing?.data, moduleId: stage.moduleId, stageId: stage.id, status }
  if (status === 'Concluído' && existing?.data.status !== 'Concluído') {
    if (existing?.data.completedAt) {
      if (!isValidDateOnly(existing.data.completedAt)) {
        throw new Error('A data de conclusão desta etapa está inválida; revise o registro antes de alterá-lo.')
      }
      let previousCompletions: unknown
      try {
        previousCompletions = existing.data.completionHistory
          ? JSON.parse(existing.data.completionHistory)
          : []
      } catch {
        throw new Error('O histórico de conclusão desta etapa está inválido; revise o registro antes de alterá-lo.')
      }
      if (!Array.isArray(previousCompletions) || !previousCompletions.every((item) => typeof item === 'string')) {
        throw new Error('O histórico de conclusão desta etapa está inválido; revise o registro antes de alterá-lo.')
      }
      data.completionHistory = JSON.stringify([...new Set([...previousCompletions, existing.data.completedAt])])
    }
    data.completedAt = date
    data.reviewCount = '0'
    data.nextReviewDate = addLocalDays(date, reviewIntervals[0])
  } else if (status !== 'Concluído') {
    delete data.nextReviewDate
  }
  return {
    id: existing?.id ?? `roadmap-stage:${stage.id}`,
    type: 'roadmapStage',
    title: stage.title,
    data,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

export function markRoadmapStageReviewed(record: StudyRecord, date = getLocalDate(), timestamp = new Date().toISOString()): StudyRecord {
  if (record.type !== 'roadmapStage' || record.data.status !== 'Concluído' || !record.data.nextReviewDate) {
    throw new Error('Esta etapa não tem uma revisão pendente.')
  }
  if (record.data.nextReviewDate > date) throw new Error('A revisão desta etapa ainda não venceu.')

  const reviewCount = Number(record.data.reviewCount ?? '0')
  if (!Number.isInteger(reviewCount) || reviewCount < 0 || reviewCount >= reviewIntervals.length) {
    throw new Error('O ciclo de revisões desta etapa já foi concluído ou está inválido.')
  }
  const nextReviewCount = reviewCount + 1
  const nextReviewDate = nextReviewCount < reviewIntervals.length
    ? addLocalDays(date, reviewIntervals[nextReviewCount])
    : undefined
  const data: Record<string, string> = { ...record.data, reviewCount: String(nextReviewCount), lastReviewedAt: date }
  if (nextReviewDate) data.nextReviewDate = nextReviewDate
  else delete data.nextReviewDate
  return { ...record, data, updatedAt: timestamp }
}

export function getPendingRoadmapPrerequisites(
  stage: RoadmapStage,
  allStages: readonly RoadmapStage[],
  records: readonly StudyRecord[],
): RoadmapStage[] {
  const requiredStages = new Map(allStages.map((item) => [item.id, item]))
  return stage.prerequisites
    .map((id) => requiredStages.get(id))
    .filter((required): required is RoadmapStage => !!required)
    .filter((required) => getRoadmapStageRecord(records, required.id)?.data.status !== 'Concluído')
}

export function calculateRoadmapProgress(
  modules: readonly RoadmapModule[],
  records: readonly StudyRecord[],
): {
  total: number
  completed: number
  percent: number
  modules: { id: string; title: string; total: number; completed: number; percent: number }[]
} {
  const moduleProgress = modules.map((module) => {
    const total = module.stages.length
    const completed = module.stages.filter(
      (stage) => getRoadmapStageRecord(records, stage.id)?.data.status === 'Concluído',
    ).length
    return {
      id: module.id,
      title: module.title,
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
    }
  })
  const total = moduleProgress.reduce((sum, module) => sum + module.total, 0)
  const completed = moduleProgress.reduce((sum, module) => sum + module.completed, 0)
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0, modules: moduleProgress }
}

export function estimateRoadmapDaysRemaining(
  modules: readonly RoadmapModule[],
  records: readonly StudyRecord[],
  date = getLocalDate(),
): number | undefined {
  const progress = calculateRoadmapProgress(modules, records)
  const remaining = progress.total - progress.completed
  if (remaining === 0) return 0

  const completionDates = modules.flatMap(({ stages }) => stages).flatMap((stage) => {
    const record = getRoadmapStageRecord(records, stage.id)
    const completedAt = record?.data.completedAt
    if (
      record?.data.status !== 'Concluído'
      || !completedAt
      || completedAt > date
      || Number.isNaN(Date.parse(`${completedAt}T00:00:00Z`))
    ) return []
    return [completedAt]
  })
  if (!completionDates.length) return undefined

  const firstCompletion = completionDates.reduce((earliest, completedAt) =>
    completedAt < earliest ? completedAt : earliest,
  )
  const firstDay = Date.parse(`${firstCompletion}T00:00:00Z`)
  const currentDay = Date.parse(`${date}T00:00:00Z`)
  const elapsedDays = Math.max(1, Math.floor((currentDay - firstDay) / 86_400_000))
  const completionsPerDay = completionDates.length / elapsedDays
  return Math.ceil(remaining / completionsPerDay)
}

export function getRecommendedRoadmapStage(
  modules: readonly RoadmapModule[],
  records: readonly StudyRecord[],
): RoadmapStage | undefined {
  const stages = modules.flatMap(({ stages: moduleStages }) => moduleStages)
  return stages.find((stage) => {
    const status = getRoadmapStageRecord(records, stage.id)?.data.status
    return status === 'Em andamento' || status === 'Treinando'
  }) ?? stages.find((stage) => getRoadmapStageRecord(records, stage.id)?.data.status !== 'Concluído')
}

export function findRoadmapStage(
  modules: readonly RoadmapModule[],
  stageId?: string,
): { module: RoadmapModule; stage: RoadmapStage } | undefined {
  if (!stageId) return undefined
  for (const module of modules) {
    const stage = module.stages.find((item) => item.id === stageId)
    if (stage) return { module, stage }
  }
  return undefined
}

export function getDueRoadmapStages(records: readonly StudyRecord[], date = getLocalDate()): StudyRecord[] {
  return records.filter(({ type, data }) =>
    type === 'roadmapStage' && data.status === 'Concluído' && !!data.nextReviewDate && data.nextReviewDate <= date,
  )
}

export const initialTopics: Omit<StudyRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
  ['JavaScript', 'Fundamentos', '—'],
  ['TypeScript', 'JavaScript'],
  ['Node.js e npm', 'JavaScript'],
  ['HTTP, APIs e JSON', 'JavaScript'],
  ['Zod', 'TypeScript', 'Node.js e npm'],
  ['PostgreSQL e Drizzle ORM', 'SQL, TypeScript'],
  ['NestJS', 'Node.js e npm, TypeScript, HTTP, APIs e JSON'],
  ['React e Next.js', 'JavaScript, TypeScript, HTML e CSS'],
  ['APIs de inteligência artificial', 'HTTP, APIs e JSON'],
  ['Integrações com WhatsApp', 'HTTP, APIs e JSON'],
  ['Testes, segurança e produção', 'TypeScript, HTTP, APIs e JSON'],
  ['Aplicação prática no AI Personal CFO', 'Roadmap anterior conforme módulos'],
].map(([title, prerequisites], index) => ({
  type: 'topic',
  title,
  data: {
    module: index < 5 ? 'Fundamentos e ferramentas' : index < 8 ? 'Backend e frontend' : index < 11 ? 'Integrações e qualidade' : 'Projeto de referência',
    status: 'Não iniciado',
    priority: 'Média',
    prerequisites,
    effort: '',
    notes: 'Tópico inicial do roadmap planejado; personalizável.',
    position: String(index + 1),
  },
}))

export function isRecordType(value: unknown): value is RecordType {
  return typeof value === 'string' && recordTypes.includes(value as RecordType)
}

export function validateStudyRecords(input: unknown): StudyRecord[] {
  if (!Array.isArray(input)) throw new Error('A lista de registros não é válida.')

  const seenIds = new Set<string>()
  const seenStageIds = new Set<string>()
  const seenTopicIds = new Set<string>()
  return input.map((value, index): StudyRecord => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`O registro ${index + 1} não é válido.`)
    }
    const item = value as Partial<StudyRecord>
    if (
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      !isRecordType(item.type) ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      !item.data ||
      typeof item.data !== 'object' ||
      Array.isArray(item.data) ||
      typeof item.createdAt !== 'string' ||
      Number.isNaN(Date.parse(item.createdAt)) ||
      typeof item.updatedAt !== 'string' ||
      Number.isNaN(Date.parse(item.updatedAt))
    ) {
      throw new Error(`O registro ${index + 1} tem campos obrigatórios inválidos.`)
    }
    if (seenIds.has(item.id)) {
      throw new Error(`O backup contém o ID duplicado “${item.id}”.`)
    }
    seenIds.add(item.id)
    if (Object.values(item.data).some((field) => typeof field !== 'string')) {
      throw new Error(`Os campos do registro “${item.title}” devem ser texto.`)
    }
    if (item.type === 'roadmapStage') {
      const { moduleId, stageId, topicId, phaseId, subjectId, status } = item.data
      if (topicId !== undefined) {
        if (!topicId || !phaseId || !subjectId || !['Bloqueado', 'Disponível', 'Em andamento', 'Concluído'].includes(status)) {
          throw new Error(`O registro ${index + 1} do tópico do catálogo tem dados inválidos.`)
        }
        if (seenTopicIds.has(topicId)) throw new Error(`O backup contém mais de um registro para o tópico “${topicId}”.`)
        seenTopicIds.add(topicId)
      } else if (!moduleId || !stageId || !roadmapStatuses.includes(status as RoadmapStatus)) {
        throw new Error(`O registro ${index + 1} da etapa do roadmap tem dados inválidos.`)
      }
      if (item.data.completionHistory !== undefined) {
        let completionHistory: unknown
        try {
          completionHistory = JSON.parse(item.data.completionHistory)
        } catch {
          throw new Error(`O histórico de conclusão do registro ${index + 1} é inválido.`)
        }
        if (!Array.isArray(completionHistory) || !completionHistory.every((date) =>
          typeof date === 'string' && isValidDateOnly(date),
        )) {
          throw new Error(`O histórico de conclusão do registro ${index + 1} é inválido.`)
        }
      }
      if (item.data.statusHistory !== undefined) {
        let statusHistory: unknown
        try {
          statusHistory = JSON.parse(item.data.statusHistory)
        } catch {
          throw new Error(`O histórico de status do registro ${index + 1} é inválido.`)
        }
        if (!Array.isArray(statusHistory) || !statusHistory.every((entry) =>
          !!entry
          && typeof entry === 'object'
          && catalogTopicStatusValues.includes((entry as CatalogStatusHistoryEntry).status)
          && typeof (entry as CatalogStatusHistoryEntry).at === 'string'
          && !Number.isNaN(Date.parse((entry as CatalogStatusHistoryEntry).at)),
        )) {
          throw new Error(`O histórico de status do registro ${index + 1} é inválido.`)
        }
      }
      if (stageId && seenStageIds.has(stageId)) {
        throw new Error(`O backup contém mais de um registro para a etapa “${stageId}”.`)
      }
      if (stageId) seenStageIds.add(stageId)
    }
    return item as StudyRecord
  })
}

export function validateBackup(input: unknown): BackupFile {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('O arquivo não contém um objeto JSON de backup.')
  }
  const backup = input as Partial<BackupFile>
  if (backup.app !== 'Dashboard-Estudos') {
    throw new Error('Este arquivo não é um backup do Dashboard-Estudos.')
  }
  if (backup.version !== 1) {
    throw new Error(`Versão de backup não suportada: ${String(backup.version)}.`)
  }
  if (!Array.isArray(backup.records) || !backup.settings || typeof backup.settings !== 'object') {
    throw new Error('O backup não contém registros e configurações em um formato válido.')
  }
  if (
    !Number.isInteger(backup.settings.reviewIntervalDays) ||
    backup.settings.reviewIntervalDays < 1 ||
    backup.settings.reviewIntervalDays > 365
  ) {
    throw new Error('O intervalo de revisão do backup deve ser um número entre 1 e 365 dias.')
  }

  const records = validateStudyRecords(backup.records)

  return {
    app: 'Dashboard-Estudos',
    version: 1,
    exportedAt: typeof backup.exportedAt === 'string' ? backup.exportedAt : new Date().toISOString(),
    records,
    settings: { reviewIntervalDays: backup.settings.reviewIntervalDays },
  }
}

export function findBackupConflicts(
  records: readonly StudyRecord[],
  existing: readonly StudyRecord[],
): Set<string> {
  const existingIds = new Set(existing.map(({ id }) => id))
  const existingStageIds = new Set(existing
    .filter(({ type }) => type === 'roadmapStage')
    .map(({ data }) => data.stageId)
    .filter((stageId): stageId is string => !!stageId))
  const existingTopicIds = new Set(existing
    .filter(({ type }) => type === 'roadmapStage')
    .map(({ data }) => data.topicId)
    .filter((topicId): topicId is string => !!topicId))
  return new Set(records
    .filter((record) =>
      existingIds.has(record.id)
      || (record.type === 'roadmapStage' && !!record.data.stageId && existingStageIds.has(record.data.stageId))
      || (record.type === 'roadmapStage' && !!record.data.topicId && existingTopicIds.has(record.data.topicId)))
    .map(({ id }) => id))
}

export interface BackupImportPreview {
  mode: 'replace' | 'merge'
  incoming: number
  existing: number
  imported: number
  ignored: number
  removed: number
  settingsChanged: boolean
  incomingByType: Partial<Record<RecordType, number>>
  warnings: string[]
  blocked: boolean
}

export function previewBackupImport(
  backup: BackupFile,
  existing: readonly StudyRecord[],
  mode: 'replace' | 'merge',
  currentSettings?: AppSettings,
): BackupImportPreview {
  const conflicts = mode === 'merge' ? findBackupConflicts(backup.records, existing) : new Set<string>()
  const imported = mode === 'replace' ? backup.records.length : backup.records.length - conflicts.size
  const removed = mode === 'replace' ? existing.length : 0
  const incomingByType: Partial<Record<RecordType, number>> = {}
  for (const record of backup.records) {
    incomingByType[record.type] = (incomingByType[record.type] ?? 0) + 1
  }
  const settingsChanged = mode === 'replace'
    && !!currentSettings
    && currentSettings.reviewIntervalDays !== backup.settings.reviewIntervalDays
  const blocked = mode === 'replace' && backup.records.length === 0
  const warnings: string[] = []
  if (blocked) {
    warnings.push('O backup não contém registros. A substituição é bloqueada para proteger o progresso local.')
  }
  if (mode === 'replace' && existing.length > 0) {
    warnings.push(`A substituição removerá ${existing.length} registro(s) desta origem antes de gravar o backup.`)
  }
  if (mode === 'replace' && existing.length > 0 && backup.records.length < existing.length) {
    warnings.push(`O backup tem ${backup.records.length} registro(s), menos que os ${existing.length} existentes. Confirme que ele é completo.`)
  }
  if (mode === 'merge' && conflicts.size > 0) {
    warnings.push(`${conflicts.size} registro(s) do backup serão ignorados porque o ID, a etapa ou o tópico já existe nesta origem.`)
  }
  if (mode === 'merge' && backup.records.length === 0) {
    warnings.push('O backup não contém registros; a mesclagem não altera nada.')
  }
  if (settingsChanged) {
    warnings.push(`O intervalo de revisão será alterado de ${currentSettings?.reviewIntervalDays} para ${backup.settings.reviewIntervalDays} dia(s).`)
  }
  return {
    mode,
    incoming: backup.records.length,
    existing: existing.length,
    imported,
    ignored: mode === 'merge' ? conflicts.size : 0,
    removed,
    settingsChanged,
    incomingByType,
    warnings,
    blocked,
  }
}


export function parseBackupJson(input: string): BackupFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('O arquivo selecionado não contém um JSON válido.')
    throw error
  }
  return validateBackup(parsed)
}
