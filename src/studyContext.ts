import {
  calculateRoadmapProgress,
  getRecommendedRoadmapStage,
  getRoadmapStageRecord,
  type StudyRecord,
} from './studyData'
import { learningRoadmap } from './learningRoadmap'

function readArray(record: StudyRecord, key: string): unknown[] | undefined {
  const serialized = record.data[key]
  if (!serialized) return undefined
  try {
    const value: unknown = JSON.parse(serialized)
    return Array.isArray(value) ? value : undefined
  } catch (error) {
    if (error instanceof SyntaxError) return undefined
    throw error
  }
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function formatStudyContext(records: readonly StudyRecord[], origin: string, generatedAt = new Date().toISOString()): string {
  const progress = calculateRoadmapProgress(learningRoadmap, records)
  const stageCount = learningRoadmap.flatMap(({ stages }) => stages)
    .filter(({ id }) => getRoadmapStageRecord(records, id)).length
  const nextStage = getRecommendedRoadmapStage(learningRoadmap, records)
  const sessions = records
    .filter(({ type, id, data }) => type === 'session' && id === `chat-session:${data.sessionId}`)
    .sort((left, right) => (right.data.date ?? right.updatedAt).localeCompare(left.data.date ?? left.updatedAt))

  const lines = [
    '# Contexto atual dos estudos',
    '',
    `Gerado em: ${generatedAt}`,
    `Origem do IndexedDB consultada: ${origin}`,
    '',
    '## Progresso confirmado no Dashboard-Estudos',
    '',
    `- Roadmap: ${progress.completed}/${progress.total} etapas concluídas (${progress.percent}%).`,
    `- Etapas com registro persistido: ${stageCount}/84.`,
    `- Próxima recomendação do dashboard: ${nextStage ? `${learningRoadmap.find(({ id }) => id === nextStage.moduleId)?.title} — ${nextStage.title}` : 'nenhuma etapa pendente'}.`,
    '- Uma recomendação não significa que a etapa esteja em andamento; status só é confirmado por registro salvo.',
    '',
    '## Sessão mais recente registrada',
    '',
  ]

  const latest = sessions[0]
  if (!latest) {
    lines.push(`Nenhuma sessão de integração foi registrada na origem consultada (${origin}). Isso não informa o estado de outras origens ou perfis.`)
    return `${lines.join('\n')}\n`
  }

  lines.push(
    `- ID: ${latest.data.sessionId}`,
    `- Data: ${latest.data.date}`,
    `- Origem: ${latest.data.source ?? 'não informada'}`,
  )
  if (latest.data.durationMinutes) lines.push(`- Duração: ${latest.data.durationMinutes} minutos`)
  lines.push('', '### Conteúdo estudado', '')
  const modules = readArray(latest, 'modules')
  if (!modules) {
    lines.push('Dados de módulos inválidos ou indisponíveis; preserve o backup e revise o registro.')
  } else {
    for (const item of modules) {
      if (typeof item !== 'object' || item === null) continue
      const moduleId = text((item as { id?: unknown }).id)
      const module = learningRoadmap.find(({ id }) => id === moduleId)
      const topics = (item as { topics_studied?: unknown }).topics_studied
      lines.push(`- ${module?.title ?? moduleId ?? 'Módulo inválido'}:`)
      if (Array.isArray(topics)) {
        for (const topic of topics) {
          if (typeof topic !== 'object' || topic === null) continue
          const detail = topic as { topic?: unknown; explained?: unknown; practiced?: unknown }
          lines.push(`  - ${text(detail.topic) ?? 'Tópico inválido'} (explicado: ${detail.explained === true ? 'sim' : 'não'}; praticado: ${detail.practiced === true ? 'sim' : 'não'})`)
        }
      }
    }
  }
  for (const [key, title] of [
    ['exercises', 'Exercícios'],
    ['artifacts', 'Artefatos'],
    ['tests', 'Testes observados'],
    ['roadmapUpdates', 'Atualizações explícitas do roadmap'],
    ['nextSteps', 'Próximos passos'],
    ['notes', 'Notas'],
  ]) {
    lines.push('', `### ${title}`, '')
    const values = readArray(latest, key)
    if (!values) {
      lines.push('Dados inválidos ou indisponíveis; revise o backup antes de confiar neste resumo.')
      continue
    }
    if (!values.length) {
      lines.push('Nenhum registrado.')
      continue
    }
    for (const value of values) lines.push(`- ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  }

  let git: { branch?: unknown; commit_hash?: unknown; push_status?: unknown; push_details?: unknown } | undefined
  try {
    git = JSON.parse(latest.data.git ?? 'null')
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
  }
  lines.push(
    '',
    '### Git',
    '',
    `- Branch: ${text(git?.branch) ?? 'não informada'}`,
    `- Commit: ${text(git?.commit_hash) ?? 'nenhum confirmado'}`,
    `- Push: ${text(git?.push_status) ?? 'não informado'}${text(git?.push_details) ? ` — ${text(git?.push_details)}` : ''}`,
    '',
    'Este resumo foi gerado a partir do IndexedDB desta origem. Compartilhe o arquivo com a próxima conversa; ele não é sincronizado automaticamente com o ChatGPT.',
  )
  return `${lines.join('\n')}\n`
}
