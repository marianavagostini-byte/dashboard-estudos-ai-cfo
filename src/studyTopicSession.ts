import { findStudyTopic, type TopicStatus, topicStatuses } from './studyCatalog'

export interface TopicSessionUpdate {
  subject_id: string
  topic_id: string
  expected_status: TopicStatus
  proposed_status: TopicStatus
  justification: string
  exercise: null | { description: string; attempted: boolean; result: string | null }
}

export interface TopicStudySession {
  schema_version: 2
  session_id: string
  date: string
  source: string
  topic_updates: TopicSessionUpdate[]
  notes: string[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmpty(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} deve ser um texto não vazio.`)
  return value.trim()
}

function validateDate(value: unknown): string {
  const date = nonEmpty(value, 'date')
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(date)
  if (!match) throw new Error('date deve ser uma data ISO 8601 válida com fuso horário explícito.')
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone, , zoneHourText, zoneMinuteText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (
    month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]
    || Number(hourText) > 23 || Number(minuteText) > 59 || Number(secondText) > 59
    || (zone !== 'Z' && (Number(zoneHourText) > 23 || Number(zoneMinuteText) > 59))
    || Number.isNaN(Date.parse(date))
  ) throw new Error('date deve ser uma data ISO 8601 válida com fuso horário explícito.')
  return date
}

export function validateTopicStudySession(input: unknown): TopicStudySession {
  if (!isObject(input)) throw new Error('A sessão deve ser um objeto JSON.')
  const allowed = ['schema_version', 'session_id', 'date', 'source', 'topic_updates', 'notes']
  const unknown = Object.keys(input).filter((key) => !allowed.includes(key))
  if (unknown.length) throw new Error(`A sessão contém campo(s) desconhecido(s): ${unknown.join(', ')}.`)
  if (input.schema_version !== 2) throw new Error('Versão de sessão não suportada; esperado schema_version 2.')
  const sessionId = nonEmpty(input.session_id, 'session_id')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    throw new Error('session_id deve ser um UUID válido.')
  }
  const date = validateDate(input.date)
  const source = nonEmpty(input.source, 'source')
  if (!Array.isArray(input.topic_updates)) throw new Error('topic_updates deve ser uma lista.')
  const topicUpdates = input.topic_updates.map((value, index): TopicSessionUpdate => {
    const label = `topic_updates[${index}]`
    if (!isObject(value)) throw new Error(`${label} deve ser um objeto.`)
    const keys = ['subject_id', 'topic_id', 'expected_status', 'proposed_status', 'justification', 'exercise']
    const extra = Object.keys(value).filter((key) => !keys.includes(key))
    if (extra.length) throw new Error(`${label} contém campo(s) desconhecido(s): ${extra.join(', ')}.`)
    const subjectId = nonEmpty(value.subject_id, `${label}.subject_id`)
    const topicId = nonEmpty(value.topic_id, `${label}.topic_id`)
    const resolved = findStudyTopic(topicId)
    if (!resolved) throw new Error(`${label}.topic_id “${topicId}” não existe no catálogo atual.`)
    if (resolved.subject.id !== subjectId) throw new Error(`${label}.subject_id não corresponde ao tópico informado.`)
    if (!topicStatuses.includes(value.expected_status as TopicStatus)) throw new Error(`${label}.expected_status não é um status válido.`)
    if (!topicStatuses.includes(value.proposed_status as TopicStatus)) throw new Error(`${label}.proposed_status não é um status válido.`)
    const justification = nonEmpty(value.justification, `${label}.justification`)
    let exercise: TopicSessionUpdate['exercise'] = null
    if (value.exercise !== null) {
      if (!isObject(value.exercise)) throw new Error(`${label}.exercise deve ser um objeto ou null.`)
      const exerciseKeys = ['description', 'attempted', 'result']
      const exerciseExtra = Object.keys(value.exercise).filter((key) => !exerciseKeys.includes(key))
      if (exerciseExtra.length) throw new Error(`${label}.exercise contém campo(s) desconhecido(s): ${exerciseExtra.join(', ')}.`)
      if (typeof value.exercise.attempted !== 'boolean') throw new Error(`${label}.exercise.attempted deve ser booleano.`)
      if (value.exercise.result !== null && typeof value.exercise.result !== 'string') throw new Error(`${label}.exercise.result deve ser texto ou null.`)
      if (value.exercise.result !== null && !value.exercise.attempted) throw new Error(`${label}.exercise.result exige tentativa confirmada.`)
      exercise = {
        description: nonEmpty(value.exercise.description, `${label}.exercise.description`),
        attempted: value.exercise.attempted,
        result: value.exercise.result as string | null,
      }
    }
    return { subject_id: subjectId, topic_id: topicId, expected_status: value.expected_status as TopicStatus,
      proposed_status: value.proposed_status as TopicStatus, justification, exercise }
  })
  if (new Set(topicUpdates.map(({ topic_id }) => topic_id)).size !== topicUpdates.length) {
    throw new Error('topic_updates contém IDs duplicados.')
  }
  if (!Array.isArray(input.notes) || !input.notes.every((note) => typeof note === 'string' && note.trim())) {
    throw new Error('notes deve conter apenas textos não vazios.')
  }
  return { schema_version: 2, session_id: sessionId, date, source,
    topic_updates: topicUpdates, notes: input.notes.map((note) => (note as string).trim()) }
}

export function parseTopicStudySessionJson(input: string): TopicStudySession {
  let parsed: unknown
  try { parsed = JSON.parse(input) }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error('O arquivo selecionado não contém um JSON válido.')
    throw error
  }
  return validateTopicStudySession(parsed)
}
