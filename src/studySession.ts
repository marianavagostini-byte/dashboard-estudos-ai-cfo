import { learningRoadmap } from './learningRoadmap'
import { roadmapStatuses, type RoadmapStatus } from './studyData'

export interface StudiedTopic {
  topic: string
  explained: boolean
  practiced: boolean
}

export interface SessionExercise {
  title: string
  prompt: string
  attempted: boolean
  resolved: boolean
  solution_or_correction: string | null
  result: string | null
}

export interface SessionArtifact {
  path: string
  description: string
}

export interface SessionTest {
  command: string
  result: 'passed' | 'failed' | 'not_run'
  details: string
}

export interface RoadmapUpdate {
  stage_id: string
  expected_status: RoadmapStatus | null
  status: Exclude<RoadmapStatus, 'Não iniciado'>
  justification: string
  confirmed_by_user: boolean
}

export interface SessionGitResult {
  branch: string | null
  commit_hash: string | null
  push_status: 'not_applicable' | 'pushed' | 'blocked'
  push_details: string | null
}

export interface StudySession {
  schema_version: 1
  session_id: string
  date: string
  source: string
  modules: { id: string; topics_studied: StudiedTopic[] }[]
  exercises: SessionExercise[]
  artifacts: SessionArtifact[]
  tests: SessionTest[]
  roadmap_updates: RoadmapUpdate[]
  next_steps: string[]
  notes: string[]
  duration_minutes: number | null
  git: SessionGitResult
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireKeys(value: Record<string, unknown>, keys: string[], label: string): void {
  const unknown = Object.keys(value).filter((key) => !keys.includes(key))
  if (unknown.length) throw new Error(`${label} contém campo(s) desconhecido(s): ${unknown.join(', ')}.`)
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} deve ser um texto não vazio.`)
  return value.trim()
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} deve ser true ou false.`)
  return value
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} deve ser uma lista.`)
  return value
}

const stageIndex = new Map(
  learningRoadmap.flatMap((module) => module.stages.map((stage) => [stage.id, module.id])),
)

export function validateStudySession(input: unknown): StudySession {
  if (!isObject(input)) throw new Error('A sessão deve ser um objeto JSON.')
  const rootKeys = [
    'schema_version', 'session_id', 'date', 'source', 'modules', 'exercises',
    'artifacts', 'tests', 'roadmap_updates', 'next_steps', 'notes', 'duration_minutes', 'git',
  ]
  requireKeys(input, rootKeys, 'A sessão')
  if (input.schema_version !== 1) throw new Error('Versão de sessão não suportada; esperado schema_version 1.')
  const sessionId = requireString(input.session_id, 'session_id')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    throw new Error('session_id deve ser um UUID válido.')
  }
  const date = requireString(input.date, 'date')
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(date)
  const year = dateMatch ? Number(dateMatch[1]) : NaN
  const month = dateMatch ? Number(dateMatch[2]) : NaN
  const day = dateMatch ? Number(dateMatch[3]) : NaN
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
  if (
    !dateMatch ||
    month < 1 || month > 12 ||
    day < 1 || day > (daysInMonth ?? 0) ||
    Number.isNaN(Date.parse(date))
  ) {
    throw new Error('date deve ser uma data ISO 8601 válida com fuso horário explícito.')
  }

  const modules = requireArray(input.modules, 'modules').map((value, index) => {
    const label = `modules[${index}]`
    if (!isObject(value)) throw new Error(`${label} deve ser um objeto.`)
    requireKeys(value, ['id', 'topics_studied'], label)
    const id = requireString(value.id, `${label}.id`)
    const module = learningRoadmap.find((item) => item.id === id)
    if (!module) throw new Error(`${label}.id “${id}” não existe no roadmap atual.`)
    const topics = requireArray(value.topics_studied, `${label}.topics_studied`).map((topicValue, topicIndex) => {
      const topicLabel = `${label}.topics_studied[${topicIndex}]`
      if (!isObject(topicValue)) throw new Error(`${topicLabel} deve ser um objeto.`)
      requireKeys(topicValue, ['topic', 'explained', 'practiced'], topicLabel)
      return {
        topic: requireString(topicValue.topic, `${topicLabel}.topic`),
        explained: requireBoolean(topicValue.explained, `${topicLabel}.explained`),
        practiced: requireBoolean(topicValue.practiced, `${topicLabel}.practiced`),
      }
    })
    return { id, topics_studied: topics }
  })
  if (!modules.length) throw new Error('Informe ao menos um módulo estudado.')
  if (new Set(modules.map(({ id }) => id)).size !== modules.length) throw new Error('modules contém IDs duplicados.')

  const exercises = requireArray(input.exercises, 'exercises').map((value, index) => {
    const label = `exercises[${index}]`
    if (!isObject(value)) throw new Error(`${label} deve ser um objeto.`)
    requireKeys(value, ['title', 'prompt', 'attempted', 'resolved', 'solution_or_correction', 'result'], label)
    const attempted = requireBoolean(value.attempted, `${label}.attempted`)
    const resolved = requireBoolean(value.resolved, `${label}.resolved`)
    if (resolved && !attempted) throw new Error(`${label}.resolved não pode ser true sem uma tentativa.`)
    const solution = value.solution_or_correction
    const result = value.result
    if (solution !== null && typeof solution !== 'string') throw new Error(`${label}.solution_or_correction deve ser texto ou null.`)
    if (result !== null && typeof result !== 'string') throw new Error(`${label}.result deve ser texto ou null.`)
    return {
      title: requireString(value.title, `${label}.title`),
      prompt: requireString(value.prompt, `${label}.prompt`),
      attempted,
      resolved,
      solution_or_correction: solution as string | null,
      result: result as string | null,
    }
  })

  const artifacts = requireArray(input.artifacts, 'artifacts').map((value, index) => {
    const label = `artifacts[${index}]`
    if (!isObject(value)) throw new Error(`${label} deve ser um objeto.`)
    requireKeys(value, ['path', 'description'], label)
    const path = requireString(value.path, `${label}.path`).replace(/\\/g, '/')
    if (path.startsWith('/') || /^[a-z]:/i.test(path) || path.split('/').includes('..')) {
      throw new Error(`${label}.path deve ser um caminho relativo dentro do repositório.`)
    }
    if (/backup|credential|secret|token|\.env/i.test(path)) {
      throw new Error(`${label}.path não pode referenciar backups, credenciais ou arquivos secretos.`)
    }
    return { path, description: requireString(value.description, `${label}.description`) }
  })

  const tests = requireArray(input.tests, 'tests').map((value, index) => {
    const label = `tests[${index}]`
    if (!isObject(value)) throw new Error(`${label} deve ser um objeto.`)
    requireKeys(value, ['command', 'result', 'details'], label)
    if (value.result !== 'passed' && value.result !== 'failed' && value.result !== 'not_run') {
      throw new Error(`${label}.result deve ser passed, failed ou not_run.`)
    }
    return {
      command: requireString(value.command, `${label}.command`),
      result: value.result as SessionTest['result'],
      details: requireString(value.details, `${label}.details`),
    }
  })

  const roadmapUpdates = requireArray(input.roadmap_updates, 'roadmap_updates').map((value, index) => {
    const label = `roadmap_updates[${index}]`
    if (!isObject(value)) throw new Error(`${label} deve ser um objeto.`)
    requireKeys(value, ['stage_id', 'expected_status', 'status', 'justification', 'confirmed_by_user'], label)
    const stageId = requireString(value.stage_id, `${label}.stage_id`)
    if (!stageIndex.has(stageId)) throw new Error(`${label}.stage_id “${stageId}” não existe no roadmap atual.`)
    if (
      value.expected_status !== null &&
      (typeof value.expected_status !== 'string' || !roadmapStatuses.includes(value.expected_status as RoadmapStatus))
    ) throw new Error(`${label}.expected_status deve ser um status conhecido ou null quando não há registro.`)
    if (
      typeof value.status !== 'string' ||
      !roadmapStatuses.includes(value.status as RoadmapStatus) ||
      value.status === 'Não iniciado'
    ) throw new Error(`${label}.status deve ser Em andamento, Treinando ou Concluído.`)
    if (value.confirmed_by_user !== true) throw new Error(`${label} exige confirmação explícita do usuário.`)
    return {
      stage_id: stageId,
      expected_status: value.expected_status as RoadmapStatus | null,
      status: value.status as Exclude<RoadmapStatus, 'Não iniciado'>,
      justification: requireString(value.justification, `${label}.justification`),
      confirmed_by_user: true,
    }
  })
  if (new Set(roadmapUpdates.map(({ stage_id }) => stage_id)).size !== roadmapUpdates.length) {
    throw new Error('roadmap_updates contém mais de uma atualização para a mesma etapa.')
  }

  const nextSteps = requireArray(input.next_steps, 'next_steps').map((value, index) =>
    requireString(value, `next_steps[${index}]`),
  )
  const notes = requireArray(input.notes, 'notes').map((value, index) =>
    requireString(value, `notes[${index}]`),
  )
  const source = requireString(input.source, 'source')
  const duration = input.duration_minutes
  if (duration !== null && (!Number.isInteger(duration) || (duration as number) < 0)) {
    throw new Error('duration_minutes deve ser um inteiro não negativo ou null.')
  }
  if (!isObject(input.git)) throw new Error('git deve ser um objeto.')
  requireKeys(input.git, ['branch', 'commit_hash', 'push_status', 'push_details'], 'git')
  for (const key of ['branch', 'commit_hash', 'push_details']) {
    const value = input.git[key]
    if (value !== null && (typeof value !== 'string' || !value.trim())) {
      throw new Error(`git.${key} deve ser texto não vazio ou null.`)
    }
  }
  const git = input.git
  if (git.push_status !== 'not_applicable' && git.push_status !== 'pushed' && git.push_status !== 'blocked') {
    throw new Error('git.push_status deve ser not_applicable, pushed ou blocked.')
  }
  if (git.push_status === 'pushed' && (!git.commit_hash || !git.branch)) {
    throw new Error('Um push concluído exige branch e commit_hash confirmados.')
  }

  return {
    schema_version: 1,
    session_id: sessionId,
    date,
    source,
    modules,
    exercises,
    artifacts,
    tests,
    roadmap_updates: roadmapUpdates,
    next_steps: nextSteps,
    notes,
    duration_minutes: duration as number | null,
    git: {
      branch: git.branch as string | null,
      commit_hash: git.commit_hash as string | null,
      push_status: git.push_status,
      push_details: git.push_details as string | null,
    },
  }
}

export function parseStudySessionJson(input: string): StudySession {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('O arquivo selecionado não contém um JSON válido.')
    throw error
  }
  return validateStudySession(parsed)
}
