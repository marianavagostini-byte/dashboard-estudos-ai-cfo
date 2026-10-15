import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { StudyWorkspace, type WorkspaceSection } from './StudyWorkspace'
import {
  calculateRoadmapProgress,
  estimateRoadmapDaysRemaining,
  getDueRoadmapStages,
  getLocalDate,
  getRecommendedRoadmapStage,
  getRoadmapStageRecord,
  type StudyRecord,
} from './studyData'
import { listRecords } from './studyDatabase'
import { learningRoadmap } from './learningRoadmap'
import './App.css'

const iconShapes = {
  overview: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  roadmap: (
    <>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M8.2 6H14a4 4 0 0 1 4 4v5.8" />
      <path d="m15.5 13.5 2.5 2.5 2.5-2.5" />
    </>
  ),
  projects: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .8v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.8l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.8-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .8-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.8v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .8l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .8 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.8 3Z" />
    </>
  ),
}

type IconName = keyof typeof iconShapes

function Icon({ name }: { name: IconName }) {
  return (
    <svg aria-hidden="true" className="icon" fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      {iconShapes[name]}
    </svg>
  )
}

const navItems: { id: WorkspaceSection | 'overview'; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Visão geral', icon: 'overview' },
  { id: 'roadmap', label: 'Roadmap principal', icon: 'roadmap' },
  { id: 'projects', label: 'Projetos AI CFO', icon: 'projects' },
  { id: 'settings', label: 'Configurações', icon: 'settings' },
]

type SectionId = (typeof navItems)[number]['id']

const sectionDescriptions: Record<SectionId, string> = {
  overview: 'Sua jornada de programação e aplicação no AI Personal CFO.',
  roadmap: 'Teoria, materiais, prática e progresso em um único lugar.',
  projects: 'Acompanhe marcos de implementação sem preencher formulários.',
  settings: 'Exporte ou restaure seus dados locais.',
}

function statusClass(status: string): string {
  if (status === 'Concluído') return 'complete'
  if (status === 'Em andamento') return 'in-progress'
  if (status === 'Treinando') return 'training'
  return 'not-started'
}

function Overview({
  records,
  onContinue,
}: {
  records: StudyRecord[]
  onContinue: (stageId: string) => void
}) {
  const progress = calculateRoadmapProgress(learningRoadmap, records)
  const allStages = learningRoadmap.flatMap((module) =>
    module.stages.map((stage) => ({ module, stage })),
  )
  const nextStage = getRecommendedRoadmapStage(learningRoadmap, records)
  const paceEstimate = estimateRoadmapDaysRemaining(learningRoadmap, records)
  const dueReviews = getDueRoadmapStages(records)
  const dueLegacyReviews = records.filter(({ type, data }) =>
    type === 'review' && !!data.dueDate && data.dueDate <= getLocalDate(),
  )
  const inProgress = allStages.filter(({ stage }) => {
    const status = getRoadmapStageRecord(records, stage.id)?.data.status
    return status === 'Em andamento' || status === 'Treinando'
  }).length
  const completed = allStages.filter(({ stage }) =>
    getRoadmapStageRecord(records, stage.id)?.data.status === 'Concluído',
  ).length
  const currentIndex = allStages.findIndex(({ stage }) => stage.id === nextStage?.id)
  const continuousCompleted = allStages.findIndex(({ stage }) =>
    getRoadmapStageRecord(records, stage.id)?.data.status !== 'Concluído',
  )
  const continuousProgress = continuousCompleted === -1
    ? 100
    : Math.max(0, continuousCompleted / Math.max(1, allStages.length - 1) * 100)
  return (
    <div className="overview-page">
      <section className="hero-card learning-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="chip">TRILHA · 21 MÓDULOS · 84 ETAPAS</span>
          <h3 id="hero-title">{nextStage ? `Você está em: ${nextStage.title}` : 'Jornada concluída'}</h3>
          <p className="hero-description">
            {nextStage
              ? `${learningRoadmap.find(({ id }) => id === nextStage.moduleId)?.title} · ${nextStage.objective}`
              : 'Você concluiu todos os tópicos da trilha. Revise ou avance nos projetos.'}
          </p>
          {nextStage && <button className="primary-button" type="button" onClick={() => onContinue(nextStage.id)}>Continuar de onde parou <span aria-hidden="true">→</span></button>}
        </div>
        <div className="progress-summary">
          <strong>{progress.percent}%</strong>
          <span>{completed} de {progress.total} tópicos concluídos</span>
          <div className="progress-track" role="progressbar" aria-label="Progresso total da trilha" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}>
            <span style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      </section>

      <section className="dashboard-panel journey-panel" aria-labelledby="journey-title">
        <div className="section-heading">
          <div><span className="eyebrow">Progresso global</span><h3 id="journey-title">Sua jornada completa</h3></div>
          <span className="status-badge status-complete">{completed}/84 concluídos</span>
        </div>
        <div className="journey-track-shell">
          <ol className="journey-track" aria-label="Linha de progresso com os 84 tópicos" style={{ '--journey-progress': `${continuousProgress}%` } as CSSProperties}>
            {allStages.map(({ module, stage }, index) => {
              const status = getRoadmapStageRecord(records, stage.id)?.data.status ?? 'Não iniciado'
              const isCurrent = index === currentIndex
              return (
                <li className={`journey-node status-${statusClass(status)}${isCurrent ? ' current' : ''}`} key={stage.id}>
                  <button
                    type="button"
                    aria-label={`${module.title}, ${stage.title}: ${status}${isCurrent ? ', etapa atual' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    title={`${module.title} · ${stage.title}`}
                    onClick={() => onContinue(stage.id)}
                  >
                    <span className="sr-only">{index + 1}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
        <div className="journey-legend"><span><i className="legend-dot complete" />Concluído</span><span><i className="legend-dot in-progress" />Em andamento</span><span><i className="legend-dot current" />Etapa atual</span></div>
      </section>

      <section className="overview-metrics" aria-label="Ritmo da trilha">
        <article className="metric-card"><strong>{progress.percent}%</strong><span>Progresso geral</span></article>
        <article className="metric-card"><strong>{completed}/{progress.total}</strong><span>Etapas concluídas</span></article>
        <article className="metric-card"><strong>{inProgress}</strong><span>Em andamento ou treino</span></article>
        <article className="metric-card pace-metric"><strong>{paceEstimate === undefined ? '—' : paceEstimate === 0 ? '100%' : `${paceEstimate} d`}</strong><span>{paceEstimate === undefined ? 'Estimativa após a 1ª conclusão' : paceEstimate === 0 ? 'Trilha concluída' : 'Previsão no ritmo atual'}</span></article>
      </section>
      {(dueReviews.length + dueLegacyReviews.length) > 0 && (
        <p className="pending-review-note">{dueReviews.length + dueLegacyReviews.length} revisão(ões) pendente(s) entre a trilha e registros legados.</p>
      )}

      <section className="dashboard-panel module-progress-panel">
        <div className="section-heading"><div><span className="eyebrow">Progresso por etapa</span><h3>Módulos da trilha</h3></div></div>
        <div className="module-progress-list">
          {progress.modules.map((module) => (
            <div className="module-progress-row" key={module.id}>
              <div><strong>{module.title}</strong><span>{module.completed}/{module.total}</span></div>
              <div className="progress-track" role="progressbar" aria-label={`Progresso de ${module.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={module.percent}>
                <span style={{ width: `${module.percent}%` }} />
              </div>
              <strong className="module-progress-percent">{module.percent}%</strong>
            </div>
          ))}
        </div>
      </section>
      <p className="pace-note">
        {paceEstimate === undefined
          ? 'A previsão de término aparecerá após concluir a primeira etapa e será baseada no ritmo observado.'
          : paceEstimate === 0
            ? 'Parabéns! Todas as etapas foram concluídas.'
            : `Previsão aproximada: ${paceEstimate} dia(s), calculada a partir das conclusões registradas e dos dias decorridos.`}
      </p>
    </div>
  )
}

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [selectedStageId, setSelectedStageId] = useState<string>()
  const [records, setRecords] = useState<StudyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try {
      setRecords(await listRecords())
      setStorageError('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar os registros.'
      setStorageError(message)
      throw error
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function initialize() {
      try {
        const nextRecords = await listRecords()
        if (mounted) {
          setRecords(nextRecords)
          setStorageError('')
        }
      } catch (error) {
        if (mounted) setStorageError(error instanceof Error ? error.message : 'Falha ao iniciar o armazenamento local.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void initialize()
    return () => { mounted = false }
  }, [])

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 4500)
  }

  function openStage(stageId: string, section: WorkspaceSection = 'roadmap') {
    setSelectedStageId(stageId)
    setActiveSection(section)
  }

  const activeItem = navItems.find(({ id }) => id === activeSection)!
  const overdueLegacyCount = records.filter(({ type, data }) =>
    type === 'review' && !!data.dueDate && data.dueDate <= getLocalDate(),
  ).length

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Barra lateral do dashboard">
        <div className="sidebar-header">
          <div className="brand-mark"><Icon name="roadmap" /></div>
          <div><span className="sidebar-kicker">AI Personal CFO</span><h1>Estudos</h1></div>
        </div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navItems.map(({ id, label, icon }) => (
            <button key={id} type="button" className={`nav-item${activeSection === id ? ' active' : ''}`} aria-current={activeSection === id ? 'page' : undefined} onClick={() => setActiveSection(id)}>
              <Icon name={icon} /><span>{label}</span>
              {id === 'overview' && overdueLegacyCount > 0 && <span className="nav-count">{overdueLegacyCount}</span>}
            </button>
          ))}
        </nav>
        <p className="sidebar-storage"><span className="storage-dot" />Armazenado neste navegador</p>
      </aside>

      <main className="main-panel">
        <header className="main-header">
          <div className="page-heading"><span className="eyebrow">Dashboard de aprendizagem</span><h2>{activeItem.label}</h2><p>{sectionDescriptions[activeSection]}</p></div>
        </header>
        {storageError && <div className="alert-error" role="alert"><strong>Problema no armazenamento local</strong><span>{storageError}</span></div>}
        {notice && <div className="toast" role="status">{notice}</div>}
        {loading
          ? <p className="loading-state">Carregando seus dados locais…</p>
          : storageError
            ? <p className="empty-state">Os dados não foram apresentados como salvos. Corrija o acesso ao armazenamento e recarregue a página.</p>
            : activeSection === 'overview'
              ? <Overview records={records} onContinue={(id) => openStage(id)} />
              : <StudyWorkspace
                section={activeSection}
                records={records}
                notify={showNotice}
                refresh={refresh}
                selectedStageId={selectedStageId}
                onOpenStage={openStage}
              />}
      </main>
    </div>
  )
}

export default App
