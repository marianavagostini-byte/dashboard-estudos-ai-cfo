import { spawnSync } from 'node:child_process'
import { lstat, realpath } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const coAuthorTrailer = 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>'

function run(command, args, { capture = false } = {}) {
  const windowsNpm = command === 'npm' && process.platform === 'win32'
  const executable = windowsNpm ? (process.env.ComSpec || 'cmd.exe') : command
  const executableArgs = windowsNpm
    ? ['/d', '/s', '/c', `npm.cmd ${args.join(' ')}`]
    : args
  const result = spawnSync(executable, executableArgs, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const details = capture ? `${result.stderr}${result.stdout}`.trim() : ''
    throw new Error(details || `${command} ${args.join(' ')} terminou com código ${result.status}.`)
  }
  return capture ? result.stdout.trim() : ''
}

export function parseArguments(args) {
  const options = { message: '', files: [], push: false, dryRun: false, help: false }
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--help' || argument === '-h') {
      options.help = true
    } else if (argument === '--push') {
      options.push = true
    } else if (argument === '--dry-run') {
      options.dryRun = true
    } else if (argument === '--message' || argument === '-m') {
      options.message = args[++index] ?? ''
    } else if (argument === '--files') {
      options.files = (args[++index] ?? '').split(';').map((file) => file.trim()).filter(Boolean)
    } else {
      throw new Error(`Opção desconhecida: ${argument}`)
    }
  }
  if (!options.help && (!options.message.trim() || options.files.length === 0)) {
    throw new Error('Informe --message e --files com caminhos explícitos separados por ponto e vírgula.')
  }
  if (options.dryRun && options.push) throw new Error('--dry-run não pode ser combinado com --push.')
  return options
}

export function validatePath(pathname) {
  const normalized = pathname.replace(/\\/g, '/')
  if (/[*?[\]]/.test(normalized) || normalized.startsWith(':')) {
    throw new Error(`Caminhos com curingas ou padrões Git não são permitidos: ${pathname}`)
  }
  const fullPath = path.resolve(repositoryRoot, pathname)
  const relativePath = path.relative(repositoryRoot, fullPath)
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Caminho fora do repositório ou diretório não permitido: ${pathname}`)
  }
  if (normalized.startsWith('/') || /^[a-z]:/i.test(normalized) || normalized.split('/').includes('..')) {
    throw new Error(`Use um caminho relativo dentro do repositório: ${pathname}`)
  }
  const lowerPath = normalized.toLowerCase()
  if (
    /(^|\/)\.env($|\.)/.test(lowerPath) ||
    /\.(pem|key|p12|pfx|sqlite|sqlite3|db|dump|bak|backup|zip)$/i.test(lowerPath) ||
    /(credential|secret|token|password|api[_-]?key|private[_-]?key)/i.test(path.basename(lowerPath)) ||
    /(^|\/)\.ssh(\/|$)/.test(lowerPath) ||
    lowerPath === 'integracao/entrada-chatgpt.json' ||
    lowerPath === 'integracao/estado-estudos.json' ||
    lowerPath === '.vscode/settings.json'
  ) {
    throw new Error(`Arquivo potencialmente sensível ou local não pode ser incluído: ${pathname}`)
  }
  return { pathname: normalized, fullPath }
}

function showHelp() {
  process.stdout.write([
    'Uso:',
    '  node scripts/safe-commit.mjs --message "tipo: resumo" --files "src/arquivo.ts;tests/arquivo.test.mjs"',
    '  node scripts/safe-commit.mjs --message "tipo: resumo" --files "src/arquivo.ts" --push',
    '  node scripts/safe-commit.mjs --message "tipo: resumo" --files "src/arquivo.ts" --dry-run',
    '',
    '--push publica o commit recém-criado no upstream configurado; sem essa opção, nada é enviado.',
    '--dry-run executa testes e verificações, mas não faz stage, commit ou push.',
  ].join('\n') + '\n')
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    showHelp()
    return
  }

  const root = run('git', ['rev-parse', '--show-toplevel'], { capture: true })
  if (path.resolve(root).toLowerCase() !== repositoryRoot.toLowerCase()) {
    throw new Error('Execute o comando a partir deste repositório.')
  }
  const branch = run('git', ['branch', '--show-current'], { capture: true })
  if (!branch) throw new Error('HEAD está destacado; faça checkout de uma branch antes do commit.')
  const stagedChanges = spawnSync('git', ['diff', '--cached', '--quiet'], {
    cwd: repositoryRoot,
    stdio: 'ignore',
  })
  if (stagedChanges.status === 1) {
    throw new Error('Há alterações já staged. Revise ou conclua-as separadamente antes de usar este fluxo.')
  }
  if (stagedChanges.status !== 0) throw new Error('Não foi possível conferir o índice do Git.')

  const selected = options.files.map(validatePath)
  if (new Set(selected.map(({ pathname }) => pathname)).size !== selected.length) {
    throw new Error('A lista --files contém caminhos duplicados.')
  }

  for (const file of selected) {
    let info
    try {
      info = await lstat(file.fullPath)
    } catch {
      throw new Error(`Arquivo não encontrado: ${file.pathname}`)
    }
    if (!info.isFile() || info.isSymbolicLink()) {
      throw new Error(`Selecione somente arquivos regulares, não links simbólicos: ${file.pathname}`)
    }
    const canonicalPath = await realpath(file.fullPath)
    const relativeCanonicalPath = path.relative(repositoryRoot, canonicalPath)
    if (!relativeCanonicalPath || relativeCanonicalPath.startsWith('..') || path.isAbsolute(relativeCanonicalPath)) {
      throw new Error(`O arquivo não está dentro do repositório: ${file.pathname}`)
    }
    const ignored = spawnSync('git', ['check-ignore', '--quiet', '--', file.pathname], {
      cwd: repositoryRoot,
      stdio: 'ignore',
    })
    if (ignored.status === 0) throw new Error(`O Git ignora o arquivo selecionado: ${file.pathname}`)
    if (ignored.status !== 1) throw new Error(`Não foi possível conferir o arquivo: ${file.pathname}`)
    const tracked = spawnSync('git', ['ls-files', '--error-unmatch', '--', file.pathname], {
      cwd: repositoryRoot,
      stdio: 'ignore',
    }).status === 0
    const changeCheck = tracked
      ? spawnSync('git', ['diff', '--quiet', 'HEAD', '--', file.pathname], {
        cwd: repositoryRoot,
        stdio: 'ignore',
      })
      : spawnSync('git', ['ls-files', '--others', '--exclude-standard', '--', file.pathname], {
        cwd: repositoryRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).stdout.trim().length > 0
    const changed = tracked ? changeCheck.status === 1 : changeCheck
    if (tracked && changeCheck.status > 1) throw new Error(`Falha ao verificar alterações: ${file.pathname}`)
    if (!changed) throw new Error(`O arquivo não tem alterações para incluir: ${file.pathname}`)
  }

  const upstream = options.push
    ? run('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], { capture: true })
    : ''
  if (options.push) {
    const aheadBeforeCommit = Number(run('git', ['rev-list', '--count', `${upstream}..HEAD`], { capture: true }))
    if (aheadBeforeCommit !== 0) {
      throw new Error(`A branch já contém ${aheadBeforeCommit} commit(s) não publicados; não serão enviados por esta automação.`)
    }
  }

  for (const script of ['test', 'lint', 'build']) {
    run('npm', script === 'test' ? ['test'] : ['run', script])
  }

  if (options.dryRun) {
    process.stdout.write(`Dry-run concluído na branch ${branch}. Nenhum stage, commit ou push foi realizado.\n`)
    return
  }

  run('git', ['add', '--', ...selected.map(({ pathname }) => pathname)])
  const stagedFiles = run('git', ['diff', '--cached', '--name-only', '-z'], { capture: true })
    .split('\0')
    .filter(Boolean)
    .map((file) => file.replace(/\\/g, '/'))
    .sort()
  const expectedFiles = selected.map(({ pathname }) => pathname).sort()
  if (JSON.stringify(stagedFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error(`Arquivos staged inesperados. Esperado: ${expectedFiles.join(', ')}. Encontrado: ${stagedFiles.join(', ')}.`)
  }
  run('git', ['diff', '--cached', '--check'])
  run('git', ['diff', '--cached', '--stat'])
  run('git', ['commit', '-m', options.message, '-m', coAuthorTrailer])

  const commitHash = run('git', ['rev-parse', 'HEAD'], { capture: true })
  const committedFiles = run('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', '-z', 'HEAD'], { capture: true })
    .split('\0')
    .filter(Boolean)
    .map((file) => file.replace(/\\/g, '/'))
    .sort()
  if (JSON.stringify(committedFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error('O commit contém caminhos diferentes dos explicitamente selecionados; interrompendo antes de qualquer push.')
  }
  process.stdout.write(`Commit local criado: ${commitHash}\n`)

  if (options.push) {
    const match = upstream.match(/^refs\/remotes\/([^/]+)\/(.+)$/)
      ?? (upstream.includes('/') ? { 1: upstream.slice(0, upstream.indexOf('/')), 2: upstream.slice(upstream.indexOf('/') + 1) } : null)
    if (!match) throw new Error(`Upstream não reconhecido: ${upstream}. O commit permanece local.`)
    const remote = match[1]
    const remoteBranch = match[2]
    run('git', ['push', '--porcelain', remote, `HEAD:refs/heads/${remoteBranch}`])
    const remoteHash = run('git', ['ls-remote', '--heads', remote, `refs/heads/${remoteBranch}`], { capture: true })
      .split(/\s+/)[0]
    if (remoteHash !== commitHash) {
      throw new Error(`Push não confirmado: HEAD remoto ${remoteHash || 'ausente'} difere de ${commitHash}.`)
    }
    process.stdout.write(`Push confirmado em ${remote}/${remoteBranch}: ${remoteHash}\n`)
  }

  run('git', ['status', '--short', '--branch'])
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`Erro: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
