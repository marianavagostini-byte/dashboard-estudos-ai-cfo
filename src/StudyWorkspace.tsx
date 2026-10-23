import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { AppSettings, RoadmapModule, RoadmapStage, RoadmapStatus, StudyRecord } from './studyData'
import {
  getRoadmapStageContent,
  getRecommendedRoadmapStage,
  getRoadmapStageRecord,
  getLocalDate,
  markRoadmapStageReviewed,
  parseBackupJson,
  previewBackupImport,
  roadmapStatuses,
  setRoadmapStageStatus,
  type BackupFile,
  type BackupImportPreview,
} from './studyData'
import { parseStudySessionJson } from './studySession'
import { exportData, importData, importStudySession, importTopicStudySession, loadSettings, saveRecord } from './studyDatabase'
import { learningRoadmap, roadmapStages } from './learningRoadmap'
import { getStudyLesson } from './studyCurriculum'
import { downloadBackupFile, downloadTextFile } from './backupDownload'
import { formatStudyContext } from './studyContext'
import { StudyCatalogWorkspace } from './StudyCatalogWorkspace'
import { getCatalogTopicStatus, listOfficialTopicEntries } from './catalogProgress'
import { simulateProgressMigration } from './progressMigration'
import { parseTopicStudySessionJson, type TopicStudySession } from './studyTopicSession'
import { findStudyTopic } from './studyCatalog'

export type WorkspaceSection = 'roadmap' | 'projects' | 'materials' | 'settings'

function getModuleMaterials(module: (typeof learningRoadmap)[number]) {
  const resources = new Map<string, { resource: RoadmapStage['resources'][number]; stages: string[] }>()
  for (const stage of module.stages) {
    for (const resource of stage.resources) {
      const existing = resources.get(resource.url)
      if (existing) existing.stages.push(stage.title)
      else resources.set(resource.url, { resource, stages: [stage.title] })
    }
  }
  return [...resources.values()]
}

function getSessionHistoryDetails(record: StudyRecord): {
  moduleIds: string[]
  exerciseCount: number
  git: { commit_hash: string | null; push_status: string }
  nextSteps: string[]
} | undefined {
  try {
    const modules: unknown = JSON.parse(record.data.modules)
    const exercises: unknown = JSON.parse(record.data.exercises)
    const git: unknown = JSON.parse(record.data.git)
    const nextSteps: unknown = JSON.parse(record.data.nextSteps)
    if (
      !Array.isArray(modules) ||
      !modules.every((module) => typeof module === 'object' && module !== null && 'id' in module && typeof module.id === 'string') ||
      !Array.isArray(exercises) ||
      !git ||
      typeof git !== 'object' ||
      !Array.isArray(nextSteps) ||
      !nextSteps.every((step) => typeof step === 'string')
    ) return undefined
    const gitData = git as Record<string, unknown>
    return {
      moduleIds: modules.map(({ id }: { id: string }) => id),
      exerciseCount: exercises.length,
      git: {
        commit_hash: typeof gitData.commit_hash === 'string'
          ? gitData.commit_hash
          : null,
        push_status: typeof gitData.push_status === 'string'
          ? gitData.push_status
          : 'desconhecido',
      },
      nextSteps,
    }
  } catch (error) {
    if (error instanceof SyntaxError) return undefined
    throw error
  }
}

function getTopicSessionHistoryDetails(record: StudyRecord): Array<{ topicId: string; status: string }> | undefined {
  try {
    const value: unknown = JSON.parse(record.data.topicUpdates ?? '')
    if (!Array.isArray(value)) return undefined
    return value.map((item) => {
      if (!item || typeof item !== 'object' || !('topic_id' in item) || typeof item.topic_id !== 'string'
        || !('proposed_status' in item) || typeof item.proposed_status !== 'string') throw new Error('invalid')
      return { topicId: item.topic_id, status: item.proposed_status }
    })
  } catch {
    return undefined
  }
}

function StatusButtons({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: RoadmapStatus
  onChange: (status: RoadmapStatus) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div className="stage-status-options" role="group" aria-label={label}>
      {roadmapStatuses.map((status) => (
        <button
          className={`stage-status-option${value === status ? ' active' : ''}`}
          key={status}
          type="button"
          aria-pressed={value === status}
          disabled={disabled}
          onClick={() => onChange(status)}
        >
          <span aria-hidden="true">{status === 'Não iniciado' ? '○' : status === 'Em andamento' ? '◷' : status === 'Treinando' ? '⚒' : '✓'}</span>
          {status}
        </button>
      ))}
    </div>
  )
}

function StageDetail({
  stage,
  module,
  record,
  onStatus,
  onReview,
  isSaving,
}: {
  stage: RoadmapStage
  module: RoadmapModule
  record?: StudyRecord
  onStatus: (stage: RoadmapStage, status: RoadmapStatus) => void
  onReview: (record: StudyRecord) => void
  isSaving: boolean
}) {
  const content = getRoadmapStageContent(module, stage)
  const lesson = getStudyLesson(stage.id)
  const status = roadmapStatuses.find((item) => item === record?.data.status) ?? 'Não iniciado'
  const isDue = !!record?.data.nextReviewDate && record.data.nextReviewDate <= getLocalDate()
  const videos = stage.resources.slice(0, 2)
  const documentation = stage.resources.slice(2)

  return (
    <article className="dashboard-panel stage-detail" aria-labelledby="selected-stage-title">
      <div className="section-heading">
        <div><span className="eyebrow">{module.title}</span><h3 id="selected-stage-title">{stage.title}</h3></div>
        <span className={`status-badge status-${statusClass(status)}`}>{status}</span>
      </div>
      <p className="muted-note">{content.summary}</p>
      <section className="stage-content-block">
        <span className="stage-content-label">Conceitos essenciais</span>
        <p>{content.concepts}</p>
      </section>
      {content.objective && (
        <section className="stage-content-block">
          <span className="stage-content-label">Objetivo desta etapa</span>
          <p>{content.objective}</p>
        </section>
      )}
      <section className="stage-content-block">
        <span className="stage-content-label">Atividade desta etapa</span>
        <p>{content.activity}</p>
      </section>
      {lesson && (
        <section className="study-lesson" aria-labelledby="lesson-title">
          <div className="section-heading">
            <div><span className="eyebrow">Aula do projeto · versão {lesson.schemaVersion}</span><h4 id="lesson-title">{lesson.title}</h4></div>
          </div>
          <section className="stage-content-block">
            <span className="stage-content-label">Objetivos de aprendizagem</span>
            <ul>{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="stage-content-block">
            <span className="stage-content-label">Pré-requisitos</span>
            <ul>{lesson.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          {lesson.explanation.map(({ heading, body }) => (
            <section className="stage-content-block" key={heading}>
              <span className="stage-content-label">{heading}</span><p>{body}</p>
            </section>
          ))}
          {lesson.examples.map((example) => (
            <section className="stage-content-block lesson-example" key={example.title}>
              <span className="stage-content-label">Exemplo · {example.language}</span>
              <h5>{example.title}</h5><p>{example.explanation}</p>
              <pre><code>{example.code}</code></pre>
              {example.expectedOutput && <p><strong>Resultado esperado:</strong> {example.expectedOutput}</p>}
              {example.tests && <p><strong>Como testar:</strong> {example.tests}</p>}
            </section>
          ))}
          <section className="stage-content-block">
            <span className="stage-content-label">Prática guiada</span><p>{lesson.guidedPractice.prompt}</p>
            <ol>{lesson.guidedPractice.steps.map((item) => <li key={item}>{item}</li>)}</ol>
            <strong>Pontos de verificação</strong>
            <ul>{lesson.guidedPractice.checkpoints.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          {lesson.independentExercises.map((exercise, index) => (
            <section className="stage-content-block" key={exercise.prompt}>
              <span className="stage-content-label">Exercício independente {index + 1}</span><p>{exercise.prompt}</p>
              <strong>Restrições</strong><ul>{exercise.constraints.map((item) => <li key={item}>{item}</li>)}</ul>
              <strong>Critérios de avaliação</strong><ul>{exercise.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ))}
          <section className="stage-content-block">
            <span className="stage-content-label">Revisão</span>
            <ul>{lesson.reviewQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="stage-content-block">
            <span className="stage-content-label">Critérios de conclusão</span>
            <ul>{lesson.completionCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        </section>
      )}
      <section className="stage-content-block">
        <span className="stage-content-label">Recursos externos de apoio</span>
        <div className="resource-list">
          {videos.map((resource, index) => (
            <article className={`resource-card resource-${index === 0 ? 'pt' : 'en'}`} key={resource.url}>
              <span className="resource-language">{index === 0 ? '🇧🇷 Português' : '🇺🇸 English'}</span>
              <strong>{resource.title}</strong>
              <span>{resource.author}</span>
              <a className="small-button resource-open-button" href={resource.url} target="_blank" rel="noopener noreferrer">Abrir Recurso</a>
            </article>
          ))}
          {documentation.map((resource) => (
            <article className="resource-card resource-documentation" key={resource.url}>
              <span className="resource-language">Documentação</span>
              <strong>{resource.title}</strong>
              <span>{resource.author}</span>
              <a className="small-button resource-open-button" href={resource.url} target="_blank" rel="noopener noreferrer">Abrir Recurso</a>
            </article>
          ))}
        </div>
      </section>
      <section className="stage-content-block stage-progress-block">
        <span className="stage-content-label">Seu progresso</span>
        <StatusButtons value={status} label={`Progresso de ${stage.title}`} disabled={isSaving} onChange={(next) => onStatus(stage, next)} />
        {record?.data.nextReviewDate && (
          <div className="review-inline">
            <span>Próxima revisão: {new Date(`${record.data.nextReviewDate}T12:00:00`).toLocaleDateString('pt-BR')}</span>
            {isDue && <button className="small-button" type="button" onClick={() => onReview(record)}>Registrar revisão</button>}
          </div>
        )}
      </section>
    </article>
  )
}

function statusClass(status: RoadmapStatus): string {
  if (status === 'Concluído') return 'complete'
  if (status === 'Em andamento') return 'in-progress'
  if (status === 'Treinando') return 'training'
  return 'not-started'
}

function SettingsPanel({
  records,
  notify,
  refresh,
}: {
  records: StudyRecord[]
  notify: (message: string) => void
  refresh: () => Promise<void>
}) {
  const [fileError, setFileError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'replace' | 'merge'>('merge')
  const [topicSessionPreview, setTopicSessionPreview] = useState<TopicStudySession>()
  const [topicSessionApproved, setTopicSessionApproved] = useState(false)
  const [migrationPreview, setMigrationPreview] = useState<ReturnType<typeof simulateProgressMigration>>()
  const [backupPreview, setBackupPreview] = useState<BackupImportPreview>()
  const [pendingBackup, setPendingBackup] = useState<BackupFile>()
  const [confirmationText, setConfirmationText] = useState('')
  const [safetyBackupReady, setSafetyBackupReady] = useState(false)
  const [settings, setSettings] = useState<AppSettings>()
  const backupFileRef = useRef<HTMLInputElement>(null)
  const sessionFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    loadSettings()
      .then((value) => { if (active) setSettings(value) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  function resetBackupPreview() {
    setBackupPreview(undefined)
    setPendingBackup(undefined)
    setConfirmationText('')
    setSafetyBackupReady(false)
  }

  async function downloadBackup() {
    setFileError('')
    try {
      const backup = await exportData()
      downloadBackupFile(backup)
      notify(backup.records.length === 0
        ? 'Download iniciado, mas este backup não contém registros nesta origem. Confira se está no navegador e endereço onde estudou.'
        : 'Download do backup iniciado. Confira os downloads do navegador.')
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível iniciar o download do backup.')
    }
  }

  async function prepareBackupImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = backupFileRef.current?.files?.[0]
    if (!file) {
      setFileError('Selecione um arquivo JSON para importar.')
      return
    }
    setBusy(true)
    setFileError('')
    resetBackupPreview()
    try {
      const backup = parseBackupJson(await file.text())
      setPendingBackup(backup)
      setBackupPreview(previewBackupImport(backup, records, mode, settings))
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível validar este arquivo.')
    } finally {
      setBusy(false)
    }
  }

  async function downloadSafetyBackup() {
    setFileError('')
    try {
      const backup = await exportData()
      if (backup.records.length === 0) {
        throw new Error('Não há registros para incluir no backup de segurança desta origem.')
      }
      downloadBackupFile(backup)
      setSafetyBackupReady(true)
      notify('Backup de segurança baixado. Confira o arquivo nos downloads antes de continuar.')
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível baixar o backup de segurança.')
    }
  }

  async function confirmBackupImport() {
    if (!pendingBackup || !backupPreview || backupPreview.blocked) return
    if (mode === 'replace') {
      if (records.length > 0 && !safetyBackupReady) {
        setFileError('Baixe o backup de segurança desta origem antes de substituir os registros.')
        return
      }
      if (confirmationText.trim().toLocaleUpperCase('pt-BR') !== 'SUBSTITUIR') {
        setFileError('Digite SUBSTITUIR para confirmar a substituição dos dados locais.')
        return
      }
    }
    setBusy(true)
    setFileError('')
    try {
      const result = await importData(pendingBackup, mode)
      try {
        await refresh()
      } catch (error) {
        setFileError(error instanceof Error
          ? `A importação foi concluída, mas não foi possível atualizar a tela: ${error.message}`
          : 'A importação foi concluída, mas não foi possível atualizar a tela.')
        return
      }
      notify(mode === 'replace'
        ? `${result.imported} registros restaurados; ${records.length} registro(s) anterior(es) substituído(s).`
        : `${result.imported} registros importados; ${result.ignored} ignorados por conflito de ID, etapa ou tópico.`)
      resetBackupPreview()
      if (backupFileRef.current) backupFileRef.current.value = ''
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível importar este arquivo.')
    } finally {
      setBusy(false)
    }
  }

  async function importChatSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = sessionFileRef.current?.files?.[0]
    if (!file) {
      setFileError('Selecione o JSON de sessão recebido do ChatGPT.')
      return
    }
    setBusy(true)
    setFileError('')
    try {
      const fileText = await file.text()
      const parsed: unknown = JSON.parse(fileText)
      if (parsed && typeof parsed === 'object' && 'schema_version' in parsed && parsed.schema_version === 2) {
        setTopicSessionPreview(parseTopicStudySessionJson(fileText))
        setTopicSessionApproved(false)
        return
      }
      const session = parseStudySessionJson(fileText)
      const updateCount = session.roadmap_updates.length
      const confirmation = updateCount
        ? `Registrar esta sessão e atualizar ${updateCount} etapa(s) com confirmação explícita e estado esperado?`
        : 'Registrar esta sessão no histórico sem alterar o progresso do roadmap?'
      if (!window.confirm(confirmation)) return
      const result = await importStudySession(session)
      try {
        await refresh()
      } catch (error) {
        setFileError(error instanceof Error
          ? `A sessão foi gravada, mas não foi possível atualizar a tela: ${error.message}`
          : 'A sessão foi gravada, mas não foi possível atualizar a tela.')
        return
      }
      notify(`Sessão ${result.sessionId} registrada; ${result.updatedStages} etapa(s) atualizada(s).`)
      if (sessionFileRef.current) sessionFileRef.current.value = ''
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível processar a sessão.')
    } finally {
      setBusy(false)
    }
  }

  async function approveTopicSession() {
    if (!topicSessionPreview || !topicSessionApproved) return
    setBusy(true)
    setFileError('')
    try {
      const result = await importTopicStudySession(topicSessionPreview, true)
      await refresh()
      notify(`Sessão ${result.sessionId} registrada; ${result.updatedStages} status(es) atualizado(s) após aprovação.`)
      setTopicSessionPreview(undefined)
      setTopicSessionApproved(false)
      if (sessionFileRef.current) sessionFileRef.current.value = ''
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível registrar esta sessão.')
    } finally {
      setBusy(false)
    }
  }

  function previewLegacyMigration() {
    setMigrationPreview(simulateProgressMigration(records))
  }

  function downloadStudyContext() {
    setFileError('')
    try {
      const context = formatStudyContext(records, window.location.origin)
      downloadTextFile(context, 'CONTEXTO-ATUAL.md', 'text/markdown;charset=utf-8')
      notify('Resumo de continuidade gerado. Ele contém dados pessoais; compartilhe apenas se desejar.')
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível gerar o resumo de continuidade.')
    }
  }

  const sessionRecords = records
    .filter(({ type, id, data }) => type === 'session' && id === `chat-session:${data.sessionId}`)
    .sort((left, right) => (right.data.date ?? right.updatedAt).localeCompare(left.data.date ?? left.updatedAt))

  return (
    <section className="dashboard-panel settings-panel">
      <div className="section-heading"><div><span className="eyebrow">Dados locais</span><h3>Backup e restauração</h3></div></div>
      <p>{records.length} registros locais nesta origem ({window.location.origin}) serão incluídos no próximo backup. O progresso é isolado por endereço e perfil do navegador.</p>
      {records.length === 0 && <p className="form-error" role="status">Nenhum registro foi carregado nesta origem. Isso não confirma que outra origem ou perfil esteja vazio. Não restaure um backup sem registros sobre dados locais existentes.</p>}
      <section className="migration-audit" aria-labelledby="migration-audit-title">
        <div className="section-heading"><div><span className="eyebrow">Somente leitura</span><h3 id="migration-audit-title">Reconciliação do progresso antigo</h3></div></div>
        <p>Simula candidatos para os registros carregados e preserva IDs sem correspondência. A migração real está desativada.</p>
        <button className="secondary-button" type="button" onClick={previewLegacyMigration}>Simular mapeamento</button>
        {migrationPreview && <div className="migration-preview" role="status">
          <strong>{migrationPreview.items.length} registro(s) inspecionado(s) · nenhuma gravação realizada</strong>
          {migrationPreview.items.length > 0 && <ul>{migrationPreview.items.map((item) => <li key={item.recordId}>
            <code>{item.oldId}</code> → {item.candidateTarget ?? 'sem destino automático'} · {item.decision} · status preservado: {item.status ?? 'ausente'}{item.completedAt ? ` · data original: ${item.completedAt}` : ''}
          </li>)}</ul>}
        </div>}
      </section>
      <button className="primary-button" type="button" onClick={() => void downloadBackup()}>Exportar backup JSON</button>
      <form className="import-form" onSubmit={(event) => void prepareBackupImport(event)}>
        <label className="form-field" htmlFor="backup-file">
          <span>Arquivo de backup JSON</span>
          <input ref={backupFileRef} id="backup-file" name="backupFile" type="file" accept="application/json,.json" required onChange={resetBackupPreview} />
        </label>
        <label className="form-field" htmlFor="backup-mode">
          <span>Modo de importação</span>
          <select id="backup-mode" name="backupMode" value={mode} onChange={(event) => { setMode(event.target.value as 'replace' | 'merge'); resetBackupPreview() }}>
            <option value="merge">Mesclar sem sobrescrever IDs existentes</option>
            <option value="replace">Substituir todos os dados locais</option>
          </select>
        </label>
        <button className="secondary-button" type="submit" disabled={busy}>{busy ? 'Validando…' : 'Validar e ver prévia'}</button>
      </form>
      {backupPreview && pendingBackup && (
        <section className="backup-preview" aria-labelledby="backup-preview-title">
          <div className="section-heading"><div><span className="eyebrow">Prévia · backup v{pendingBackup.version}</span><h3 id="backup-preview-title">Nada foi gravado ainda</h3></div></div>
          <ul className="backup-preview-counts">
            <li><strong>{backupPreview.incoming}</strong> registro(s) no arquivo</li>
            <li><strong>{backupPreview.imported}</strong> será(ão) importado(s)</li>
            <li><strong>{backupPreview.ignored}</strong> ignorado(s) por conflito</li>
            <li><strong>{backupPreview.removed}</strong> registro(s) local(is) removido(s)</li>
            <li><strong>{backupPreview.existing}</strong> registro(s) nesta origem</li>
          </ul>
          {Object.keys(backupPreview.incomingByType).length > 0 && (
            <p className="muted-note">Tipos no arquivo: {Object.entries(backupPreview.incomingByType).map(([type, count]) => `${type}: ${count}`).join(' · ')}.</p>
          )}
          {backupPreview.settingsChanged && <p className="muted-note">As configurações de revisão do arquivo também serão aplicadas.</p>}
          {backupPreview.warnings.length > 0 && <ul className="backup-warnings">{backupPreview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
          {backupPreview.blocked
            ? <p className="form-error" role="alert">Importação bloqueada: o arquivo não contém registros e substituir apagaria o progresso local.</p>
            : <>
              {mode === 'replace' && records.length > 0 && (
                <div className="safety-backup">
                  <p>Antes de substituir, baixe uma cópia dos {records.length} registro(s) atuais.</p>
                  <button className="secondary-button" type="button" disabled={busy} onClick={() => void downloadSafetyBackup()}>
                    {safetyBackupReady ? 'Baixar backup de segurança novamente' : 'Baixar backup de segurança'}
                  </button>
                  {safetyBackupReady && <p className="muted-note" role="status">Backup de segurança baixado nesta sessão. Confira o arquivo antes de prosseguir.</p>}
                </div>
              )}
              {mode === 'replace' && (
                <label className="form-field" htmlFor="backup-confirmation">
                  <span>Digite SUBSTITUIR para confirmar a operação destrutiva</span>
                  <input id="backup-confirmation" name="backupConfirmation" type="text" autoComplete="off" value={confirmationText} onChange={(event) => setConfirmationText(event.target.value)} />
                </label>
              )}
              <div className="session-preview-actions">
                <button className="primary-button" type="button" disabled={busy || (mode === 'replace' && (records.length > 0 && !safetyBackupReady || confirmationText.trim().toLocaleUpperCase('pt-BR') !== 'SUBSTITUIR'))} onClick={() => void confirmBackupImport()}>
                  {busy ? 'Importando…' : mode === 'replace' ? 'Substituir dados locais' : 'Confirmar mesclagem'}
                </button>
                <button className="text-button" type="button" disabled={busy} onClick={resetBackupPreview}>Cancelar prévia</button>
              </div>
            </>}
        </section>
      )}
      <div className="section-heading"><div><span className="eyebrow">Integração manual</span><h3>Registrar sessão do ChatGPT</h3></div></div>
      <p>Fluxo manual por arquivo JSON: o ChatGPT não grava diretamente neste navegador. Sessões v2 mostram os status propostos para sua revisão e aprovação antes de atualizar tópicos.</p>
      <form className="import-form" onSubmit={(event) => void importChatSession(event)}>
        <label className="form-field" htmlFor="chat-session-file">
          <span>Arquivo JSON de sessão</span>
          <input ref={sessionFileRef} id="chat-session-file" name="chatSessionFile" type="file" accept="application/json,.json" required />
        </label>
        <button className="secondary-button" type="submit" disabled={busy}>{busy ? 'Validando…' : 'Validar e registrar sessão'}</button>
      </form>
      {topicSessionPreview && (
        <section className="session-import-preview" aria-labelledby="topic-session-preview-title">
          <div className="section-heading"><div><span className="eyebrow">Prévia · sessão v2</span><h3 id="topic-session-preview-title">Revisar alterações propostas</h3></div></div>
          <p>Origem: {topicSessionPreview.source} · Data de estudo: {topicSessionPreview.date} · ID: {topicSessionPreview.session_id}</p>
          {topicSessionPreview.topic_updates.length === 0
            ? <p>Esta sessão será registrada sem alterar progresso.</p>
            : <ul>{topicSessionPreview.topic_updates.map((update) => {
              const target = findStudyTopic(update.topic_id)
              const missing = (target?.topic.prerequisites ?? []).filter((id) => getCatalogTopicStatus(id, records) !== 'Concluído')
              return <li key={update.topic_id}><strong>{target?.subject.title} / {target?.topic.title}</strong>: {update.expected_status} → {update.proposed_status}. {update.justification}
                {update.exercise && <span> Exercício: {update.exercise.description} · Tentado: {update.exercise.attempted ? 'sim' : 'não'} · Resultado: {update.exercise.result ?? 'não informado'}.</span>}
                {update.proposed_status === 'Concluído' && missing.length > 0 && <span className="form-error"> Pré-requisito(s) pendente(s): {missing.join(', ')}. A importação será recusada.</span>}
              </li>
            })}</ul>}
          <label className="approval-check"><input type="checkbox" checked={topicSessionApproved} onChange={(event) => setTopicSessionApproved(event.target.checked)} /> Li a prévia e aprovo registrar esta sessão e aplicar os status listados.</label>
          <div className="session-preview-actions">
            <button className="primary-button" type="button" disabled={!topicSessionApproved || busy} onClick={() => void approveTopicSession()}>{busy ? 'Registrando…' : 'Aprovar e registrar sessão'}</button>
            <button className="text-button" type="button" disabled={busy} onClick={() => { setTopicSessionPreview(undefined); setTopicSessionApproved(false) }}>Cancelar prévia</button>
          </div>
        </section>
      )}
      <div className="section-heading"><div><span className="eyebrow">Histórico persistido</span><h3>Sessões registradas ({sessionRecords.length})</h3></div></div>
      {sessionRecords.length === 0
        ? <p className="muted-note">Nenhuma sessão importada nesta origem do navegador.</p>
        : <ol className="session-history">
          {sessionRecords.map((session) => (
            <li key={session.id}>
              <strong>{session.title}</strong>
              {session.data.schemaVersion === '2' && (() => {
                const updates = getTopicSessionHistoryDetails(session)
                return updates
                  ? <div className="session-topic-history">
                    <span>Aprovada pelo usuário em: {session.data.approvedAt ?? 'data não registrada'}</span>
                    <ul>{updates.map(({ topicId, status }) => <li key={topicId}>{findStudyTopic(topicId)?.topic.title ?? topicId}: {status}</li>)}</ul>
                  </div>
                  : <span role="alert">Detalhes v2 inválidos; o registro foi preservado.</span>
              })()}
              <span>{session.data.source} · {session.data.date}</span>
              {session.data.schemaVersion !== '2' && (() => {
                const details = getSessionHistoryDetails(session)
                return details
                  ? <>
                    <span>Módulos: {details.moduleIds.join(', ')}</span>
                    <span>Exercícios registrados: {details.exerciseCount}</span>
                    <span>Commit: {details.git.commit_hash ?? 'não informado'} · Push: {details.git.push_status}</span>
                    {details.nextSteps.length > 0 && <span>Próximos passos: {details.nextSteps.join('; ')}</span>}
                  </>
                  : <span role="alert">Detalhes do registro inválidos; preserve e revise um backup antes de qualquer alteração.</span>
              })()}
            </li>
          ))}
        </ol>}
      <button className="secondary-button" type="button" onClick={downloadStudyContext}>Baixar resumo de continuidade</button>
      <p className="muted-note">O resumo inclui progresso e notas desta origem do navegador. Revise-o antes de compartilhá-lo; não é enviado automaticamente ao ChatGPT.</p>
      {fileError && <p className="form-error" role="alert">{fileError}</p>}
      <p className="muted-note">JSON versionado v1. A importação valida estrutura e tipos antes de gravar. Mesclar preserva IDs existentes; substituir é destrutivo, exige confirmação e backups sem registros são recusados.</p>
    </section>
  )
}

export function StudyWorkspace({
  section,
  records,
  notify,
  refresh,
  selectedStageId,
  onOpenStage,
}: {
  section: WorkspaceSection
  records: StudyRecord[]
  notify: (message: string) => void
  refresh: () => Promise<void>
  selectedStageId?: string
  onOpenStage: (stageId: string, section?: WorkspaceSection) => void
}) {
  const [savingStageId, setSavingStageId] = useState<string>()
  const [roadmapViewOverride, setRoadmapViewOverride] = useState<{ selection?: string; view: 'catalog' | 'legacy' }>()
  const automaticRoadmapView: 'catalog' | 'legacy' = selectedStageId
    ? roadmapStages.some(({ id }) => id === selectedStageId) ? 'legacy' : 'catalog'
    : 'catalog'
  const roadmapView = roadmapViewOverride && roadmapViewOverride.selection === selectedStageId
    ? roadmapViewOverride.view
    : automaticRoadmapView
  const selectRoadmapView = (view: 'catalog' | 'legacy') => setRoadmapViewOverride({ selection: selectedStageId, view })

  const roadmapViewSwitch = section === 'roadmap' && (
    <div className="roadmap-view-switch" role="tablist" aria-label="Modo de visualização do roadmap">
      <button className={`view-switch-button${roadmapView === 'catalog' ? ' active' : ''}`} type="button" role="tab" aria-selected={roadmapView === 'catalog'} onClick={() => selectRoadmapView('catalog')}>Catálogo · 20 matérias</button>
      <button className={`view-switch-button${roadmapView === 'legacy' ? ' active' : ''}`} type="button" role="tab" aria-selected={roadmapView === 'legacy'} onClick={() => selectRoadmapView('legacy')}>Roteiro legado · teoria e revisão</button>
    </div>
  )

  if (section === 'settings') {
    return <SettingsPanel records={records} notify={notify} refresh={refresh} />
  }

  if (section === 'materials') {
    const catalogMaterials = listOfficialTopicEntries().filter(({ topic }) => topic.material)
    return (
      <div className="workspace-stack">
        <section className="dashboard-panel">
          <div className="section-heading"><div><span className="eyebrow">Biblioteca da trilha</span><h3>Materiais de estudo</h3></div></div>
          <p className="muted-note">Links externos organizados por módulo e etapa. Aulas, exercícios e correções acontecem nas conversas de estudo.</p>
          {learningRoadmap.map((module) => (
            <section className="materials-module" key={module.id} aria-labelledby={`materials-${module.id}`}>
              <div className="section-heading"><div><span className="eyebrow">Módulo</span><h3 id={`materials-${module.id}`}>{module.title}</h3></div></div>
              <div className="resource-list">
                {getModuleMaterials(module).map(({ resource, stages }, index) => (
                  <article className={`resource-card resource-${index === 0 ? 'pt' : index === 1 ? 'en' : 'documentation'}`} key={resource.url}>
                    <span className="resource-language">{index === 0 ? '🇧🇷 Português' : index === 1 ? '🇺🇸 English' : 'Documentação'}</span>
                    <strong>{resource.title}</strong>
                    <span>{resource.author}</span>
                    <span>Etapas: {stages.join(', ')}</span>
                    <a className="small-button resource-open-button" href={resource.url} target="_blank" rel="noopener noreferrer">Abrir recurso</a>
                  </article>
                ))}
              </div>
            </section>
          ))}
          <section className="materials-module" aria-labelledby="materials-catalog-title">
            <div className="section-heading"><div><span className="eyebrow">Catálogo hierárquico · ordem oficial</span><h3 id="materials-catalog-title">Materiais por tópico</h3></div><strong>{catalogMaterials.length} link(s)</strong></div>
            <p className="muted-note">Cada link abaixo está associado ao tópico e à matéria correspondente no roadmap, na ordem oficial das 20 matérias. Tópicos suplementares e DSA aparecem ao final.</p>
            {catalogMaterials.length > 0
              ? <div className="resource-list">
                {catalogMaterials.map(({ areaTitle, subjectTitle, track, topic }) => (
                  <article className="resource-card resource-documentation" key={topic.id}>
                    <span className="resource-language">{track === 'principal' ? `${areaTitle} · ${subjectTitle}` : `${areaTitle} · ${subjectTitle}${track === 'paralela' ? ' · trilha paralela' : ' · fora do progresso principal'}`}</span>
                    <strong>{topic.title}</strong>
                    <span>{topic.material!.title} — {topic.material!.author}</span>
                    <a className="small-button resource-open-button" href={topic.material!.url} target="_blank" rel="noopener noreferrer">Abrir material</a>
                    <button className="text-button" type="button" onClick={() => onOpenStage(topic.id, 'roadmap')}>Ver tópico no roadmap</button>
                  </article>
                ))}
              </div>
              : <p className="muted-note">Nenhum link de catálogo cadastrado.</p>}
          </section>
        </section>
      </div>
    )
  }

  if (section === 'roadmap' && roadmapView === 'catalog') {
    return (
      <div className="workspace-stack">
        {roadmapViewSwitch}
        <StudyCatalogWorkspace records={records} notify={notify} refresh={refresh} selectedTopicId={selectedStageId} onOpenTopic={(topicId) => onOpenStage(topicId, 'roadmap')} />
      </div>
    )
  }

  const suggested = getRecommendedRoadmapStage(learningRoadmap, records)
  const selected = learningRoadmap
    .map((module) => ({ module, stage: module.stages.find(({ id }) => id === selectedStageId) }))
    .find(({ stage }) => stage)
    ?? learningRoadmap.map((module) => ({ module, stage: module.stages.find(({ id }) => id === suggested?.id) })).find(({ stage }) => stage)
    ?? { module: learningRoadmap[0], stage: learningRoadmap[0].stages[0] }

  async function updateStatus(stage: RoadmapStage, status: RoadmapStatus) {
    setSavingStageId(stage.id)
    try {
      await saveRecord(setRoadmapStageStatus(stage, getRoadmapStageRecord(records, stage.id), status))
    } catch (error) {
      notify(error instanceof Error ? `Não foi possível salvar o progresso: ${error.message}` : 'Não foi possível salvar o progresso.')
      setSavingStageId(undefined)
      return
    }
    try {
      await refresh()
    } catch (error) {
      notify(error instanceof Error ? `O progresso foi salvo, mas a tela não foi atualizada: ${error.message}` : 'O progresso foi salvo, mas a tela não foi atualizada.')
      setSavingStageId(undefined)
      return
    }
    notify(`Progresso salvo: ${stage.title} — ${status}.`)
    setSavingStageId(undefined)
  }

  async function reviewStage(record: StudyRecord) {
    try {
      await saveRecord(markRoadmapStageReviewed(record))
    } catch (error) {
      notify(error instanceof Error ? `Não foi possível registrar a revisão: ${error.message}` : 'Não foi possível registrar a revisão.')
      return
    }
    try {
      await refresh()
    } catch (error) {
      notify(error instanceof Error ? `A revisão foi registrada, mas a tela não foi atualizada: ${error.message}` : 'A revisão foi registrada, mas a tela não foi atualizada.')
      return
    }
    notify(`Revisão registrada: ${record.title}.`)
  }

  if (section === 'projects') {
    const projectModule = learningRoadmap.find(({ id }) => id === 'ai-personal-cfo')!
    const exerciseTopics = listOfficialTopicEntries().filter(({ topic }) => topic.exercise)
    return (
      <div className="workspace-stack">
        <section className="dashboard-panel project-intro">
          <span className="eyebrow">AI Personal CFO</span>
          <h3>Marcos práticos do projeto</h3>
          <p>{projectModule.summary}</p>
          <p>Use cada marco para aplicar a trilha ao produto financeiro; o progresso aqui é compartilhado com o roadmap.</p>
        </section>
        <div className="project-milestones">
          {projectModule.stages.map((stage, index) => {
            const record = getRoadmapStageRecord(records, stage.id)
            const status = roadmapStatuses.find((item) => item === record?.data.status) ?? 'Não iniciado'
            return (
              <article className="dashboard-panel project-milestone" key={stage.id}>
                <div className="section-heading"><div><span className="eyebrow">Marco {index + 1}</span><h3>{stage.title}</h3></div><span className={`status-badge status-${statusClass(status)}`}>{status}</span></div>
                <p>{stage.activity}</p>
                <StatusButtons value={status} label={`Progresso de ${stage.title}`} disabled={!!savingStageId} onChange={(next) => void updateStatus(stage, next)} />
                <button className="text-button" type="button" onClick={() => onOpenStage(stage.id, 'roadmap')}>Ver teoria e materiais</button>
              </article>
            )
          })}
        </div>
        <section className="dashboard-panel" aria-labelledby="catalog-exercises-title">
          <div className="section-heading"><div><span className="eyebrow">Programação / exercícios</span><h3 id="catalog-exercises-title">Exercícios do catálogo</h3></div><strong>{exerciseTopics.length} tópico(s)</strong></div>
          <p className="muted-note">Exercícios definidos nos tópicos, na ordem oficial das matérias. Tópicos suplementares e DSA aparecem ao final. Registrar a conclusão do tópico continua sendo uma decisão sua.</p>
          {exerciseTopics.length > 0
            ? <div className="resource-list">
              {exerciseTopics.map(({ areaTitle, subjectTitle, track, topic }) => (
                <article className="resource-card resource-documentation" key={topic.id}>
                  <span className="resource-language">{track === 'principal' ? `${areaTitle} · ${subjectTitle}` : `${areaTitle} · ${subjectTitle}${track === 'paralela' ? ' · trilha paralela' : ' · fora do progresso principal'}`}</span>
                  <strong>{topic.title}</strong>
                  <span>{topic.exercise}</span>
                  <button className="text-button" type="button" onClick={() => onOpenStage(topic.id, 'roadmap')}>Abrir tópico e registrar progresso</button>
                </article>
              ))}
            </div>
            : <p className="muted-note">Nenhum exercício detalhado no catálogo atual.</p>}
        </section>
      </div>
    )
  }

  return (
    <div className="workspace-stack">
      {roadmapViewSwitch}
      <div className="roadmap-workspace">
        <section className="dashboard-panel module-browser" aria-label="Módulos do roadmap">
          <div className="section-heading"><div><span className="eyebrow">Trilha de aprendizagem</span><h3>{learningRoadmap.length} módulos · {roadmapStages.length} etapas</h3></div></div>
          {learningRoadmap.map((module) => {
            const isSelected = module.id === selected.module.id
            return (
              <details className="module-browser-item" key={module.id} open={isSelected}>
                <summary>
                  <span>{module.title}</span>
                  <small>{module.stages.filter((stage) => getRoadmapStageRecord(records, stage.id)?.data.status === 'Concluído').length}/{module.stages.length}</small>
                </summary>
                <div className="module-stage-options">
                  {module.stages.map((stage, index) => {
                    const status = roadmapStatuses.find((item) => item === getRoadmapStageRecord(records, stage.id)?.data.status) ?? 'Não iniciado'
                    return (
                      <button className={`module-stage-option${stage.id === selected.stage?.id ? ' active' : ''}`} type="button" key={stage.id} onClick={() => onOpenStage(stage.id, 'roadmap')}>
                        <span className={`stage-status-dot status-${statusClass(status)}`}>{status === 'Concluído' ? '✓' : index + 1}</span>
                        <span>{stage.title}</span>
                        <small>{status}</small>
                      </button>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </section>
        {selected.stage && (
          <StageDetail
            stage={selected.stage}
            module={selected.module}
            record={getRoadmapStageRecord(records, selected.stage.id)}
            onStatus={(stage, status) => void updateStatus(stage, status)}
            onReview={(record) => void reviewStage(record)}
            isSaving={!!savingStageId}
          />
        )}
      </div>
    </div>
  )
}
