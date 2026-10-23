import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const recordTypes = new Set([
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
])

export function validateBackupFile(input, label) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`${label}: o arquivo deve conter um objeto JSON.`)
  }
  if (input.app !== 'Dashboard-Estudos' || input.version !== 1) {
    throw new Error(`${label}: backup incompatível; esperado Dashboard-Estudos versão 1.`)
  }
  if (typeof input.exportedAt !== 'string' || Number.isNaN(Date.parse(input.exportedAt))) {
    throw new Error(`${label}: exportedAt ausente ou inválido.`)
  }
  if (!Array.isArray(input.records)) throw new Error(`${label}: records não é uma lista.`)
  if (input.records.length === 0) {
    throw new Error(`${label}: o backup não contém registros; não pode comprovar um round-trip de dados.`)
  }
  if (
    !input.settings ||
    typeof input.settings !== 'object' ||
    Array.isArray(input.settings) ||
    !Number.isInteger(input.settings.reviewIntervalDays) ||
    input.settings.reviewIntervalDays < 1 ||
    input.settings.reviewIntervalDays > 365
  ) {
    throw new Error(`${label}: settings.reviewIntervalDays inválido.`)
  }

  const ids = new Set()
  const stageIds = new Set()
  for (const [index, record] of input.records.entries()) {
    if (
      !record ||
      typeof record !== 'object' ||
      Array.isArray(record) ||
      typeof record.id !== 'string' ||
      !record.id.trim() ||
      !recordTypes.has(record.type) ||
      typeof record.title !== 'string' ||
      !record.title.trim() ||
      !record.data ||
      typeof record.data !== 'object' ||
      Array.isArray(record.data) ||
      !Object.values(record.data).every((value) => typeof value === 'string') ||
      typeof record.createdAt !== 'string' ||
      Number.isNaN(Date.parse(record.createdAt)) ||
      typeof record.updatedAt !== 'string' ||
      Number.isNaN(Date.parse(record.updatedAt))
    ) {
      throw new Error(`${label}: registro ${index + 1} inválido.`)
    }
    if (ids.has(record.id)) throw new Error(`${label}: existem IDs de registro duplicados.`)
    ids.add(record.id)
    if (record.type === 'roadmapStage') {
      if (!record.data.stageId) throw new Error(`${label}: etapa do roadmap sem stageId.`)
      if (stageIds.has(record.data.stageId)) {
        throw new Error(`${label}: existem registros duplicados para uma etapa do roadmap.`)
      }
      stageIds.add(record.data.stageId)
    }
  }
  return input
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
  )
}

function stableBackup(backup) {
  return canonicalize({
    app: backup.app,
    version: backup.version,
    settings: backup.settings,
    records: [...backup.records].sort((left, right) => left.id.localeCompare(right.id)),
  })
}

export function compareBackupContents(sourceInput, restoredInput) {
  const source = validateBackupFile(sourceInput, 'Backup de origem')
  const restored = validateBackupFile(restoredInput, 'Backup reexportado')
  if (JSON.stringify(stableBackup(source)) !== JSON.stringify(stableBackup(restored))) {
    throw new Error('Os registros, IDs, datas, histórico, progresso ou configurações diferem entre os backups.')
  }
  return {
    records: source.records.length,
    roadmapStages: source.records.filter(({ type }) => type === 'roadmapStage').length,
    sessions: source.records.filter(({ type }) => type === 'session').length,
  }
}

async function main(args) {
  if (args.length !== 2 || args.includes('--help') || args.includes('-h')) {
    process.stdout.write([
      'Uso: node scripts/compare-backups.mjs <backup-origem.json> <backup-reexportado.json>',
      'Compara backups v1 sem imprimir dados pessoais. Ambos devem conter ao menos um registro.',
      '',
    ].join('\n'))
    if (args.length !== 2) process.exitCode = args.some((arg) => arg === '--help' || arg === '-h') ? 0 : 2
    return
  }

  const [sourcePath, restoredPath] = args.map((file) => path.resolve(file))
  if (sourcePath === restoredPath) throw new Error('Selecione dois arquivos de backup diferentes.')
  const source = JSON.parse(await readFile(sourcePath, 'utf8'))
  const restored = JSON.parse(await readFile(restoredPath, 'utf8'))
  const result = compareBackupContents(source, restored)
  process.stdout.write(
    `Round-trip confirmado: ${result.records} registros; ${result.roadmapStages} etapas do roadmap; ${result.sessions} sessões. IDs, conteúdo, datas, histórico, progresso e configurações coincidem. Nenhum dado pessoal foi exibido.\n`,
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`Comparação não confirmada: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
