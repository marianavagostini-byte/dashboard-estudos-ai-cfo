import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseArguments, validatePath } from '../scripts/safe-commit.mjs'

test('safe commit requires an explicit message and file list', () => {
  assert.throws(() => parseArguments([]), /Informe --message e --files/)
  assert.throws(() => parseArguments(['--message', 'feat: teste']), /Informe --message e --files/)
  assert.throws(() => parseArguments(['--files', 'src/file.ts']), /Informe --message e --files/)
})

test('safe commit parses intentional paths and explicit push separately', () => {
  assert.deepEqual(
    parseArguments(['--message', 'feat: resumo', '--files', 'src/a.ts; tests/a.test.mjs']),
    {
      message: 'feat: resumo',
      files: ['src/a.ts', 'tests/a.test.mjs'],
      push: false,
      dryRun: false,
      help: false,
    },
  )
  assert.equal(parseArguments(['--message', 'fix: teste', '--files', 'src/a.ts', '--push']).push, true)
})

test('safe commit prevents combining dry-run with publication', () => {
  assert.throws(
    () => parseArguments(['--message', 'test', '--files', 'src/a.ts', '--dry-run', '--push']),
    /não pode ser combinado/,
  )
})

test('safe commit rejects absolute and parent-traversal paths', () => {
  assert.throws(() => validatePath('C:\\private\\file.json'), /Caminho fora|caminho relativo/)
  assert.throws(() => validatePath('..\\outside.txt'), /Caminho fora|caminho relativo/)
})

test('safe commit rejects ignored local configuration and personal data paths', () => {
  assert.throws(() => validatePath('.vscode/settings.json'), /sensível ou local/)
  assert.throws(() => validatePath('integracao/entrada-chatgpt.json'), /sensível ou local/)
  assert.throws(() => validatePath('secrets/api-token.txt'), /sensível ou local/)
  assert.throws(() => validatePath('config/private_api_key.json'), /sensível ou local/)
})

test('safe commit rejects Git pathspec patterns instead of expanding them', () => {
  assert.throws(() => validatePath('src/*.ts'), /curingas/)
  assert.throws(() => validatePath(':(glob)src/**'), /curingas|padrões Git/)
})
