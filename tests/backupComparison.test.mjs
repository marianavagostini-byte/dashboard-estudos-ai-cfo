import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareBackupContents } from '../scripts/compare-backups.mjs'

const source = {
  app: 'Dashboard-Estudos',
  version: 1,
  exportedAt: '2026-10-20T18:00:00.000Z',
  settings: { reviewIntervalDays: 7 },
  records: [
    {
      id: 'roadmap-stage:javascript-compreender',
      type: 'roadmapStage',
      title: 'Compreender e observar',
      data: {
        moduleId: 'javascript',
        stageId: 'javascript-compreender',
        status: 'Concluído',
        completedAt: '2026-10-19',
        reviewCount: '2',
      },
      createdAt: '2026-10-10T10:00:00.000Z',
      updatedAt: '2026-10-19T10:00:00.000Z',
    },
    {
      id: 'chat-session:123e4567-e89b-42d3-a456-426614174000',
      type: 'session',
      title: 'Sessão de estudo',
      data: { sessionId: '123e4567-e89b-42d3-a456-426614174000', notes: 'fixture sem conteúdo pessoal' },
      createdAt: '2026-10-20T15:00:00.000Z',
      updatedAt: '2026-10-20T15:00:00.000Z',
    },
  ],
}

test('confirms an exact backup round-trip while ignoring export time and object key order', () => {
  const restored = {
    ...source,
    exportedAt: '2026-10-20T18:10:00.000Z',
    settings: { reviewIntervalDays: 7 },
    records: [...source.records].reverse().map((record) => ({
      ...record,
      data: Object.fromEntries(Object.entries(record.data).reverse()),
    })),
  }
  assert.deepEqual(compareBackupContents(source, restored), {
    records: 2,
    roadmapStages: 1,
    sessions: 1,
  })
})

test('rejects empty source or restored backups as inconclusive', () => {
  assert.throws(() => compareBackupContents({ ...source, records: [] }, source), /não contém registros/)
  assert.throws(() => compareBackupContents(source, { ...source, records: [] }), /não contém registros/)
})

test('detects lost records and changed IDs', () => {
  assert.throws(
    () => compareBackupContents(source, { ...source, records: [source.records[0]] }),
    /diferem entre os backups/,
  )
  assert.throws(
    () => compareBackupContents(source, {
      ...source,
      records: source.records.map((record) => ({ ...record, id: `${record.id}-changed` })),
    }),
    /diferem entre os backups/,
  )
})

test('detects changed record contents, dates, progress and settings', () => {
  const mutations = [
    (record) => ({ ...record, createdAt: '2026-10-01T10:00:00.000Z' }),
    (record) => ({ ...record, updatedAt: '2026-10-01T10:00:00.000Z' }),
    (record) => ({ ...record, data: { ...record.data, status: 'Em andamento' } }),
  ]
  for (const mutate of mutations) {
    const records = source.records.map((record, index) => index === 0 ? mutate(record) : record)
    assert.throws(() => compareBackupContents(source, { ...source, records }), /diferem entre os backups/)
  }
  assert.throws(
    () => compareBackupContents(source, { ...source, settings: { reviewIntervalDays: 14 } }),
    /diferem entre os backups/,
  )
})

test('rejects malformed or duplicate records before comparing', () => {
  assert.throws(
    () => compareBackupContents(source, { ...source, records: [{ ...source.records[0], updatedAt: 'invalid' }] }),
    /registro 1 inválido/,
  )
  assert.throws(
    () => compareBackupContents(source, { ...source, records: [source.records[0], source.records[0]] }),
    /IDs de registro duplicados/,
  )
})
