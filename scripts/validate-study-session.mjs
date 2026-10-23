import { readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

function transpileToDataUrl(source, replacements = []) {
  let rewritten = source
  for (const [specifier, url] of replacements) {
    rewritten = rewritten.replaceAll(`from '${specifier}'`, `from '${url}'`)
  }
  const { outputText, diagnostics } = ts.transpileModule(rewritten, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  })
  const errors = diagnostics.filter(({ category }) => category === ts.DiagnosticCategory.Error)
  if (errors.length) throw new Error(errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'))
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}

async function main() {
  const inputPath = resolve(root, process.argv[2] ?? 'integracao/entrada-chatgpt.json')
  if (!inputPath.startsWith(`${root}${sep}`)) throw new Error('O arquivo de sessão deve estar dentro do repositório.')
  const [dataSource, roadmapSource, sessionSource, catalogSource, topicSessionSource, sessionJson] = await Promise.all([
    readFile(resolve(root, 'src/studyData.ts'), 'utf8'),
    readFile(resolve(root, 'src/learningRoadmap.ts'), 'utf8'),
    readFile(resolve(root, 'src/studySession.ts'), 'utf8'),
    readFile(resolve(root, 'src/studyCatalog.ts'), 'utf8'),
    readFile(resolve(root, 'src/studyTopicSession.ts'), 'utf8'),
    readFile(inputPath, 'utf8'),
  ])
  const envelope = JSON.parse(sessionJson)
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) throw new Error('A sessão deve ser um objeto JSON.')
  if (envelope.schema_version === 2) {
    const catalogUrl = transpileToDataUrl(catalogSource)
    const topicSessionUrl = transpileToDataUrl(topicSessionSource, [['./studyCatalog', catalogUrl]])
    const { parseTopicStudySessionJson } = await import(topicSessionUrl)
    const session = parseTopicStudySessionJson(sessionJson)
    console.log(`Sessão v2 válida: ${session.session_id}`)
    console.log(`Data: ${session.date}; tópicos: ${session.topic_updates.length}; origem: ${session.source}`)
  } else {
    const dataUrl = transpileToDataUrl(dataSource)
    const roadmapUrl = transpileToDataUrl(roadmapSource, [['./studyData', dataUrl]])
    const sessionUrl = transpileToDataUrl(sessionSource, [
      ['./studyData', dataUrl],
      ['./learningRoadmap', roadmapUrl],
    ])
    const { parseStudySessionJson } = await import(sessionUrl)
    const session = parseStudySessionJson(sessionJson)
    console.log(`Sessão v1 válida: ${session.session_id}`)
    console.log(`Data: ${session.date}; módulos: ${session.modules.length}; exercícios: ${session.exercises.length}; atualizações do roadmap: ${session.roadmap_updates.length}`)
  }
  console.log('Validação somente leitura; nenhum arquivo ou dado do dashboard foi alterado.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
