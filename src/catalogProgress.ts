import type { StudyRecord } from './studyData'
import { getCatalogTopicRecord } from './studyData'
import {
  curriculumAreas,
  studyCatalog,
  type StudyTopic,
  type TopicStatus,
} from './studyCatalog'

export interface CatalogTopicEntry {
  phaseId: string
  phaseTitle: string
  phaseParallel: boolean
  subjectId: string
  subjectTitle: string
  topic: StudyTopic
}

export interface CatalogListOptions {
  /** Inclui a trilha paralela (DSA). Padrão: true, para manter o catálogo completo. */
  includeParallel?: boolean
  /** Restringe o resultado somente às fases marcadas como paralelas. */
  parallelOnly?: boolean
  /** Restringe o resultado a uma fase específica. */
  phaseId?: string
}

export interface CatalogProgress {
  total: number
  completed: number
  percent: number
}

export interface CatalogStatusBreakdown extends CatalogProgress {
  inProgress: number
  available: number
  blocked: number
}

export interface CatalogAreaProgress extends CatalogStatusBreakdown {
  id: string
  title: string
  description: string
  subjectIds: readonly string[]
}

export interface CatalogGroupProgress extends CatalogStatusBreakdown {
  id: string
  title: string
  phaseId: string
  parallel: boolean
}

/** Categoria de cada recorte do catálogo na interface. */
export type CatalogTrack = 'principal' | 'suplementar' | 'paralela'

export interface CatalogSubjectGroup {
  id: string
  title: string
  entries: CatalogTopicEntry[]
}

/**
 * Agrupamento exibido no navegador do roadmap. Cada grupo principal equivale a
 * uma das 20 matérias; os demais recortes ficam explicitamente identificados
 * como suplementares (fora do progresso principal) ou como trilha paralela.
 */
export interface CatalogTopicGroup {
  id: string
  title: string
  description: string
  track: CatalogTrack
  phaseIds: string[]
  subjects: CatalogSubjectGroup[]
  entries: CatalogTopicEntry[]
}

/** Entrada do catálogo com a matéria e a categoria a que pertence. */
export interface OfficialCatalogEntry extends CatalogTopicEntry {
  track: CatalogTrack
  areaId: string
  areaTitle: string
}

export function listCatalogTopics(options: CatalogListOptions = {}): CatalogTopicEntry[] {
  const phases = studyCatalog.filter((phase) => {
    if (options.phaseId && phase.id !== options.phaseId) return false
    if (options.parallelOnly) return phase.parallel === true
    if (options.includeParallel === false) return phase.parallel !== true
    return true
  })
  return phases.flatMap((phase) => phase.subjects.flatMap((subject) => subject.topics.map((topic) => ({
    phaseId: phase.id,
    phaseTitle: phase.title,
    phaseParallel: phase.parallel === true,
    subjectId: subject.id,
    subjectTitle: subject.title,
    topic,
  }))))
}

const curriculumSubjectIds: ReadonlySet<string> = new Set(
  curriculumAreas.flatMap(({ subjectIds }) => subjectIds),
)

/**
 * Tópicos das 20 matérias, na ordem definida em `curriculumAreas`.
 * Matérias de base (Python), prática complementar e especializações futuras
 * continuam no catálogo, mas ficam fora deste recorte.
 */
export function listCurriculumTopics(): CatalogTopicEntry[] {
  const bySubject = new Map<string, CatalogTopicEntry[]>()
  for (const entry of listCatalogTopics()) {
    if (!curriculumSubjectIds.has(entry.subjectId)) continue
    const current = bySubject.get(entry.subjectId)
    if (current) current.push(entry)
    else bySubject.set(entry.subjectId, [entry])
  }
  return curriculumAreas.flatMap(({ subjectIds }) => subjectIds.flatMap((subjectId) => bySubject.get(subjectId) ?? []))
}

/**
 * Ordena tópicos de um mesmo subject por pré-requisitos, mantendo a ordem do
 * catálogo sempre que ela já é válida. Ciclos (que não existem no catálogo
 * atual) são mantidos na ordem original para não perder tópicos.
 */
function orderEntriesByPrerequisites(entries: readonly CatalogTopicEntry[]): CatalogTopicEntry[] {
  const ids = new Set(entries.map(({ topic }) => topic.id))
  const placed = new Set<string>()
  const pending = [...entries]
  const ordered: CatalogTopicEntry[] = []
  while (pending.length) {
    const index = pending.findIndex(({ topic }) =>
      (topic.prerequisites ?? []).every((id) => !ids.has(id) || placed.has(id)))
    if (index === -1) return [...ordered, ...pending]
    const [entry] = pending.splice(index, 1)
    ordered.push(entry)
    placed.add(entry.topic.id)
  }
  return ordered
}

function buildSubjectGroups(
  subjectIds: readonly string[],
  entries: readonly CatalogTopicEntry[],
): CatalogSubjectGroup[] {
  return subjectIds.flatMap((subjectId) => {
    const subjectEntries = orderEntriesByPrerequisites(entries.filter((entry) => entry.subjectId === subjectId))
    if (!subjectEntries.length) return []
    return [{
      id: subjectId,
      title: subjectEntries[0].subjectTitle,
      entries: subjectEntries,
    }]
  })
}

function createGroup(
  id: string,
  title: string,
  description: string,
  track: CatalogTrack,
  subjectIds: readonly string[],
  entries: readonly CatalogTopicEntry[],
): CatalogTopicGroup {
  const subjects = buildSubjectGroups(subjectIds, entries)
  return {
    id,
    title,
    description,
    track,
    phaseIds: [...new Set(entries.map(({ phaseId }) => phaseId))],
    subjects,
    entries: subjects.flatMap(({ entries: subjectEntries }) => subjectEntries),
  }
}

/**
 * Grupos do navegador na ordem oficial: as 20 matérias primeiro, depois os
 * tópicos suplementares (fora do progresso principal) e por fim a trilha
 * paralela DSA + LeetCode.
 */
export function listOfficialTopicGroups(options: {
  includeSupplementary?: boolean
  includeParallel?: boolean
} = {}): CatalogTopicGroup[] {
  const allEntries = listCatalogTopics()
  const grouped: CatalogTopicGroup[] = curriculumAreas.map((area) =>
    createGroup(
      area.id,
      area.title,
      area.description,
      'principal',
      area.subjectIds,
      allEntries.filter(({ subjectId }) => area.subjectIds.includes(subjectId)),
    ))

  if (options.includeSupplementary !== false) {
    const supplementarySubjects = new Set<string>()
    for (const phase of studyCatalog) {
      if (phase.parallel) continue
      for (const subject of phase.subjects) {
        if (!curriculumSubjectIds.has(subject.id)) supplementarySubjects.add(subject.id)
      }
    }
    for (const phase of studyCatalog) {
      if (phase.parallel) continue
      const subjectIds = phase.subjects
        .map(({ id }) => id)
        .filter((id) => supplementarySubjects.has(id))
      if (!subjectIds.length) continue
      grouped.push(createGroup(
        `suplementar.${phase.id}`,
        `Tópicos suplementares · ${phase.title}`,
        'Fora do progresso principal: base histórica, prática complementar e especializações futuras. Continuam visíveis e registráveis.',
        'suplementar',
        subjectIds,
        allEntries.filter(({ subjectId }) => subjectIds.includes(subjectId)),
      ))
    }
  }

  if (options.includeParallel !== false) {
    for (const phase of studyCatalog) {
      if (!phase.parallel) continue
      const subjectIds = phase.subjects.map(({ id }) => id)
      grouped.push(createGroup(
        phase.id,
        phase.title,
        'Trilha paralela: não bloqueia nem é bloqueada pela sequência principal e não entra no percentual geral.',
        'paralela',
        subjectIds,
        allEntries.filter(({ subjectId }) => subjectIds.includes(subjectId)),
      ))
    }
  }

  return grouped.filter(({ entries }) => entries.length > 0)
}

/** Todos os tópicos na ordem oficial, com a matéria e a categoria de origem. */
export function listOfficialTopicEntries(options: {
  includeSupplementary?: boolean
  includeParallel?: boolean
} = {}): OfficialCatalogEntry[] {
  return listOfficialTopicGroups(options).flatMap((group) =>
    group.entries.map((entry) => ({
      ...entry,
      track: group.track,
      areaId: group.id,
      areaTitle: group.title,
    })))
}

export interface CatalogTotals {
  /** Tópicos das 20 matérias — base do progresso geral. */
  principal: number
  /** Base histórica, prática complementar e especializações — fora do percentual. */
  suplementar: number
  /** Trilha paralela DSA + LeetCode — independente do progresso geral. */
  paralela: number
  /** Soma de todos os tópicos cadastrados. */
  catalogo: number
}

export function getCatalogTotals(): CatalogTotals {
  const groups = listOfficialTopicGroups()
  const count = (track: CatalogTrack) =>
    groups.filter((group) => group.track === track).reduce((sum, group) => sum + group.entries.length, 0)
  const principal = count('principal')
  const suplementar = count('suplementar')
  const paralela = count('paralela')
  return { principal, suplementar, paralela, catalogo: principal + suplementar + paralela }
}

export function getCatalogTopicStatus(
  topicId: string,
  records: readonly StudyRecord[],
  lookup: (id: string) => StudyTopic | undefined = (id) => listCatalogTopics().find(({ topic }) => topic.id === id)?.topic,
): TopicStatus {
  const saved = getCatalogTopicRecord(records, topicId)?.data.status
  if (saved === 'Bloqueado' || saved === 'Disponível' || saved === 'Em andamento' || saved === 'Concluído') return saved
  const topic = lookup(topicId)
  if (!topic) return 'Bloqueado'
  return (topic.prerequisites ?? []).every((requiredId) =>
    getCatalogTopicStatus(requiredId, records, lookup) === 'Concluído',
  ) ? 'Disponível' : 'Bloqueado'
}

export function filterCatalogTopics(
  entries: readonly CatalogTopicEntry[],
  records: readonly StudyRecord[],
  options: { query?: string; status?: TopicStatus | 'Todos'; subjectId?: string; phaseId?: string },
): CatalogTopicEntry[] {
  const query = options.query?.trim().toLocaleLowerCase('pt-BR') ?? ''
  return entries.filter(({ phaseId, phaseTitle, subjectId, subjectTitle, topic }) => {
    if (options.phaseId && phaseId !== options.phaseId) return false
    if (options.subjectId && subjectId !== options.subjectId) return false
    if (options.status && options.status !== 'Todos' && getCatalogTopicStatus(topic.id, records) !== options.status) return false
    if (!query) return true
    return [phaseTitle, subjectTitle, topic.title, ...(topic.subtopics.map(({ title }) => title))]
      .some((value) => value.toLocaleLowerCase('pt-BR').includes(query))
  })
}

export function getCatalogStatusBreakdown(
  entries: readonly CatalogTopicEntry[],
  records: readonly StudyRecord[],
): CatalogStatusBreakdown {
  const counts = { completed: 0, inProgress: 0, available: 0, blocked: 0 }
  for (const { topic } of entries) {
    const status = getCatalogTopicStatus(topic.id, records)
    if (status === 'Concluído') counts.completed += 1
    else if (status === 'Em andamento') counts.inProgress += 1
    else if (status === 'Disponível') counts.available += 1
    else counts.blocked += 1
  }
  return {
    total: entries.length,
    ...counts,
    percent: entries.length ? Math.round(counts.completed / entries.length * 100) : 0,
  }
}

/**
 * Progresso do catálogo. Por padrão inclui todas as fases (inclusive DSA) para
 * manter o total estável em consumidores antigos. A visão principal do dashboard
 * deve usar `{ curriculumOnly: true }` para contar apenas as 20 matérias, ou
 * `{ includeParallel: false }` para todo o catálogo menos DSA.
 */
export function calculateCatalogProgress(
  records: readonly StudyRecord[],
  options: CatalogListOptions & { curriculumOnly?: boolean } = {},
): CatalogProgress {
  const entries = options.curriculumOnly ? listCurriculumTopics() : listCatalogTopics(options)
  const completed = entries.filter(({ topic }) => getCatalogTopicStatus(topic.id, records) === 'Concluído').length
  return { total: entries.length, completed, percent: entries.length ? Math.round(completed / entries.length * 100) : 0 }
}

export function calculateParallelProgress(records: readonly StudyRecord[]): CatalogProgress {
  return calculateCatalogProgress(records, { parallelOnly: true })
}

export function calculateCurriculumAreaProgress(
  records: readonly StudyRecord[],
  areaId: string,
): CatalogAreaProgress | undefined {
  const area = curriculumAreas.find(({ id }) => id === areaId)
  if (!area) return undefined
  const entries = listCatalogTopics().filter(({ subjectId }) => area.subjectIds.includes(subjectId))
  return {
    id: area.id,
    title: area.title,
    description: area.description,
    subjectIds: area.subjectIds,
    ...getCatalogStatusBreakdown(entries, records),
  }
}

export function calculateCurriculumProgress(records: readonly StudyRecord[]): CatalogAreaProgress[] {
  return curriculumAreas.flatMap((area) => {
    const progress = calculateCurriculumAreaProgress(records, area.id)
    return progress ? [progress] : []
  })
}

export function getPhaseProgress(records: readonly StudyRecord[], options: CatalogListOptions = {}): CatalogGroupProgress[] {
  return studyCatalog
    .filter((phase) => !options.phaseId || phase.id === options.phaseId)
    .map((phase) => ({
      id: phase.id,
      title: phase.title,
      phaseId: phase.id,
      parallel: phase.parallel === true,
      ...getCatalogStatusBreakdown(listCatalogTopics({ phaseId: phase.id }), records),
    }))
}

export function getSubjectProgress(
  records: readonly StudyRecord[],
  phaseId?: string,
): Array<CatalogGroupProgress & { subjectId: string }> {
  return studyCatalog
    .filter((phase) => !phaseId || phase.id === phaseId)
    .flatMap((phase) => {
      const phaseEntries = listCatalogTopics({ phaseId: phase.id })
      return phase.subjects.map((subject) => ({
        id: subject.id,
        subjectId: subject.id,
        title: subject.title,
        phaseId: phase.id,
        parallel: phase.parallel === true,
        ...getCatalogStatusBreakdown(
          phaseEntries.filter(({ subjectId: entrySubjectId }) => entrySubjectId === subject.id),
          records,
        ),
      }))
    })
}

/**
 * Próximo tópico sugerido: primeiro um tópico já em andamento, depois o primeiro
 * disponível. Com `curriculumOnly`, percorre as 20 matérias na ordem do roadmap;
 * sem ele, usa a ordem do catálogo e exclui DSA por padrão.
 */
export function getNextRecommendedTopic(
  records: readonly StudyRecord[],
  options: { phaseId?: string; includeParallel?: boolean; curriculumOnly?: boolean } = {},
): CatalogTopicEntry | undefined {
  const entries = options.curriculumOnly
    ? listCurriculumTopics()
    : listCatalogTopics({
      phaseId: options.phaseId,
      includeParallel: options.includeParallel === true,
    })
  return entries.find(({ topic }) => getCatalogTopicStatus(topic.id, records) === 'Em andamento')
    ?? entries.find(({ topic }) => getCatalogTopicStatus(topic.id, records) === 'Disponível')
}

/** Quantidade de tópicos do catálogo que possuem algum registro de progresso salvo. */
export function countRecordedCatalogTopics(entries: readonly CatalogTopicEntry[], records: readonly StudyRecord[]): number {
  return entries.filter(({ topic }) => !!getCatalogTopicRecord(records, topic.id)).length
}
