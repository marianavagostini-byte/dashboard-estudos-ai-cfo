import { useRef, useState, type FormEvent } from 'react'
import type { RoadmapStage, RoadmapStatus, StudyRecord } from './studyData'
import {
  getRecommendedRoadmapStage,
  getRoadmapStageRecord,
  getLocalDate,
  markRoadmapStageReviewed,
  parseBackupJson,
  roadmapStatuses,
  setRoadmapStageStatus,
} from './studyData'
import { exportData, importData, saveRecord } from './studyDatabase'
import { learningRoadmap } from './learningRoadmap'

export type WorkspaceSection = 'roadmap' | 'projects' | 'settings'

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
  moduleTitle,
  moduleConcepts,
  modulePractice,
  record,
  onStatus,
  onReview,
  isSaving,
}: {
  stage: RoadmapStage
  moduleTitle: string
  moduleConcepts: string
  modulePractice: string
  record?: StudyRecord
  onStatus: (stage: RoadmapStage, status: RoadmapStatus) => void
  onReview: (record: StudyRecord) => void
  isSaving: boolean
}) {
  const status = roadmapStatuses.find((item) => item === record?.data.status) ?? 'Não iniciado'
  const isDue = !!record?.data.nextReviewDate && record.data.nextReviewDate <= getLocalDate()
  const videos = stage.resources.slice(0, 2)
  const documentation = stage.resources.slice(2)

  return (
    <article className="dashboard-panel stage-detail" aria-labelledby="selected-stage-title">
      <div className="section-heading">
        <div><span className="eyebrow">{moduleTitle}</span><h3 id="selected-stage-title">{stage.title}</h3></div>
        <span className={`status-badge status-${statusClass(status)}`}>{status}</span>
      </div>
      <section className="stage-content-block">
        <span className="stage-content-label">Conceitos essenciais</span>
        <p>{moduleConcepts}</p>
        <p>{stage.objective}</p>
      </section>
      <section className="stage-content-block">
        <span className="stage-content-label">Prática no AI Personal CFO</span>
        <p>{stage.activity}</p>
        <p className="muted-note">{modulePractice}</p>
      </section>
      <section className="stage-content-block">
        <span className="stage-content-label">Conteúdos selecionados</span>
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
  const fileRef = useRef<HTMLInputElement>(null)

  async function downloadBackup() {
    setFileError('')
    try {
      const backup = await exportData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `dashboard-estudos-backup-${getLocalDate()}.json`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      notify('Backup JSON exportado.')
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível exportar o backup.')
    }
  }

  async function importBackup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setFileError('Selecione um arquivo JSON para importar.')
      return
    }
    setBusy(true)
    setFileError('')
    try {
      const backup = parseBackupJson(await file.text())
      const confirmation = mode === 'replace'
        ? 'Substituir apaga os registros locais atuais. Exporte uma cópia antes. Deseja continuar?'
        : 'Mesclar adiciona registros sem sobrescrever IDs já existentes. Deseja continuar?'
      if (!window.confirm(confirmation)) return
      const count = await importData(backup, mode)
      try {
        await refresh()
      } catch (error) {
        setFileError(error instanceof Error
          ? `A importação foi concluída, mas não foi possível atualizar a tela: ${error.message}`
          : 'A importação foi concluída, mas não foi possível atualizar a tela.')
        return
      }
      notify(mode === 'replace' ? `${count} registros restaurados.` : `${count} registros mesclados; IDs repetidos foram ignorados.`)
      if (fileRef.current) fileRef.current.value = ''
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível importar este arquivo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="dashboard-panel settings-panel">
      <div className="section-heading"><div><span className="eyebrow">Dados locais</span><h3>Backup e restauração</h3></div></div>
      <p>{records.length} registros locais serão incluídos no próximo backup. Seus registros legados permanecem armazenados e incluídos na exportação.</p>
      <button className="primary-button" type="button" onClick={() => void downloadBackup()}>Exportar backup JSON</button>
      <form className="import-form" onSubmit={(event) => void importBackup(event)}>
        <label className="form-field" htmlFor="backup-file">
          <span>Arquivo de backup JSON</span>
          <input ref={fileRef} id="backup-file" name="backupFile" type="file" accept="application/json,.json" required />
        </label>
        <label className="form-field" htmlFor="backup-mode">
          <span>Modo de importação</span>
          <select id="backup-mode" name="backupMode" value={mode} onChange={(event) => setMode(event.target.value as 'replace' | 'merge')}>
            <option value="merge">Mesclar sem sobrescrever IDs existentes</option>
            <option value="replace">Substituir todos os dados locais</option>
          </select>
        </label>
        <button className="secondary-button" type="submit" disabled={busy}>{busy ? 'Importando…' : 'Validar e importar'}</button>
      </form>
      {fileError && <p className="form-error" role="alert">{fileError}</p>}
      <p className="muted-note">JSON versionado v1. A importação valida estrutura e tipos antes de gravar. Substituir é uma operação destrutiva e sempre pede confirmação.</p>
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
  if (section === 'settings') {
    return <SettingsPanel records={records} notify={notify} refresh={refresh} />
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
      </div>
    )
  }

  return (
    <div className="roadmap-workspace">
      <section className="dashboard-panel module-browser" aria-label="Módulos do roadmap">
        <div className="section-heading"><div><span className="eyebrow">Trilha de aprendizagem</span><h3>21 módulos · 84 etapas</h3></div></div>
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
          moduleTitle={selected.module.title}
          moduleConcepts={selected.module.concepts}
          modulePractice={selected.module.independentPractice}
          record={getRoadmapStageRecord(records, selected.stage.id)}
          onStatus={(stage, status) => void updateStatus(stage, status)}
          onReview={(record) => void reviewStage(record)}
          isSaving={!!savingStageId}
        />
      )}
    </div>
  )
}
