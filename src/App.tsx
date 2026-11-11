import { useCallback, useEffect, useState } from 'react'
import { StudyWorkspace, type WorkspaceSection } from './StudyWorkspace'
import { getLocalDate, type StudyRecord } from './studyData'
import { listRecords } from './studyDatabase'
import {
  calculateCatalogProgress,
  listCurriculumTopics,
  countRecordedCatalogTopics,
  listCatalogTopics,
  getNextRecommendedTopic,
} from './catalogProgress'
import { getCatalogTopicStatus } from './studyData'
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
  materials: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 5.5v15M8 7h8M8 11h8" />
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
  { id: 'roadmap', label: 'Roadmap', icon: 'roadmap' },
  { id: 'projects', label: 'Programação / exercícios', icon: 'projects' },
  { id: 'materials', label: 'Materiais', icon: 'materials' },
  { id: 'settings', label: 'Configurações', icon: 'settings' },
]

type SectionId = (typeof navItems)[number]['id']

const sectionDescriptions: Record<SectionId, string> = {
  overview: 'Progresso e matérias das suas trilhas de estudo.',
  roadmap: 'Explore fases, matérias, tópicos e subtópicos.',
  projects: 'Aplique seus estudos nos marcos práticos do AI Personal CFO.',
  materials: 'Consulte os links de estudo organizados por módulo e etapa.',
  settings: 'Exporte ou restaure seus dados locais.',
}

function areaState(area: { completed: number; inProgress: number; total: number }) {
  if (area.total > 0 && area.completed >= area.total) return 'done'
  if (area.inProgress > 0) return 'progress'
  if (area.completed > 0) return 'partial'
  return 'idle'
}

function Overview({
  records,
  onContinue,
}: {
  records: StudyRecord[]
  onContinue: (topicId: string) => void
}) {
  // Build areas structure from curriculum topics grouped by subject
  interface CurriculumArea {
    id: string
    subjectIds: string[]
    percent: number
    completed: number
    total: number
    inProgress: number
    description: string
  }
  const curriculumTopics = listCurriculumTopics()
  const subjectAreasMap = new Map<string, CurriculumArea>()
  curriculumTopics.forEach((topic) => {
    const subjectId = topic.subjectId
    if (!subjectId) return
    const existing = subjectAreasMap.get(subjectId)
    const status = getCatalogTopicStatus(topic.topic.id, records)
    if (existing) {
      existing.total += 1
      if (status === 'Concluído') existing.completed += 1
      if (status === 'Em andamento') existing.inProgress += 1
    } else {
      subjectAreasMap.set(subjectId, {
        id: subjectId,
        subjectIds: [subjectId],
        percent: 0,
        completed: status === 'Concluído' ? 1 : 0,
        total: 1,
        inProgress: status === 'Em andamento' ? 1 : 0,
        description: topic.subjectTitle || 'Matéria',
      })
    }
  })
  const areas: CurriculumArea[] = Array.from(subjectAreasMap.values())
  areas.forEach((area) => {
    area.percent = area.total > 0 ? Math.round((area.completed / area.total) * 100) : 0
  })
  // nextTopic: find first topic with 'Em andamento' or 'Treinando' status
  const nextTopic = getNextRecommendedTopic(records, { curriculumOnly: true })
  const mainEntries = listCurriculumTopics()
  const nextTopicInProgress = !!nextTopic && getCatalogTopicStatus(nextTopic.topic.id, records) === 'Em andamento'
  const trackedCount = countRecordedCatalogTopics(curriculumTopics, records)
  const legacyStageCount = records.filter(({ type, data }) => type === 'roadmapStage' && !data.topicId).length
  const sessionCount = records.filter(({ type }) => type === 'session').length
  const dsaEntries = listCatalogTopics({ parallelOnly: true })
  const proposedDsaCount = dsaEntries.filter((entry) => entry.topic?.origin === 'proposta').length
  const inProgressCount = areas.reduce((sum, area) => sum + area.inProgress, 0)
  const mainProgress = calculateCatalogProgress(records, { curriculumOnly: true })
  const notStartedCount = Math.max(mainProgress.total - mainProgress.completed - inProgressCount, 0)
  const completedAreas = areas.filter(({ completed, total }) => total > 0 && completed >= total).length
  const currentAreaId = nextTopic
    ? areas.find(({ subjectIds }) => subjectIds.includes(nextTopic.subjectId))?.id
    : undefined
  return (
    <div className="overview-page">
      <section className="dashboard-panel hero-progress" aria-labelledby="catalog-overview-title">
        <div className="hero-progress-copy">
          <span className="eyebrow">Trilha principal · 20 matérias</span>
          <p className="hero-percent" id="catalog-overview-title">{mainProgress.percent}<span>%</span></p>
          <p className="hero-caption">{mainProgress.completed} de {mainProgress.total} tópicos concluídos</p>
        </div>
        <div className="hero-progress-body">
          <div className="progress-track main-progress-track" role="progressbar" aria-label="Progresso da trilha principal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={mainProgress.percent}><span style={{ width: `${mainProgress.percent}%` }} /></div>
          <ul className="hero-stats" aria-label="Resumo do progresso">
            <li className="hero-stat hero-stat--done"><strong>{mainProgress.completed}</strong><span>Concluídos</span></li>
            <li className="hero-stat hero-stat--progress"><strong>{inProgressCount}</strong><span>Em andamento</span></li>
            <li className="hero-stat hero-stat--idle"><strong>{notStartedCount}</strong><span>Não iniciados</span></li>
          </ul>
          {nextTopic
            ? (
              <div className="next-topic-card">
                <div className="next-topic-copy">
                  <span className="eyebrow">Próximo tópico</span>
                  <strong>{nextTopic.topic.title}</strong>
                  <small>{nextTopic.subjectTitle} · {nextTopic.phaseTitle}</small>
                </div>
                <button className="primary-button" type="button" onClick={() => onContinue(nextTopic.topic.id)}>
                  {nextTopicInProgress ? 'Continuar' : 'Abrir'} →
                </button>
              </div>
            )
            : <p className="empty-state">Todos os tópicos da trilha principal estão concluídos neste catálogo. Você ainda pode revisar DSA ou os materiais.</p>}
        </div>
      </section>

      <section className="dashboard-panel roadmap-timeline-panel" aria-labelledby="phase-progress-title">
        <div className="section-heading">
          <div><span className="eyebrow">Roadmap · ordem oficial</span><h3 id="phase-progress-title">JavaScript → AI Personal CFO</h3></div>
          <strong>{completedAreas}/{areas.length} matérias concluídas</strong>
        </div>
        <div className="timeline-scroll">
          <ol className="roadmap-timeline" aria-label="Linha do tempo das 20 matérias na ordem oficial">
            {areas.map((area, index) => {
              const firstEntry = mainEntries.find(({ subjectId }) => area.subjectIds.includes(subjectId))
              const state = areaState(area)
              return (
                <li className={`timeline-item state-${state}${area.id === currentAreaId ? ' is-current' : ''}`} key={area.id}>
                  <button
                    type="button"
                    disabled={!firstEntry}
                    onClick={() => firstEntry && onContinue(firstEntry.topic.id)}
                    title={`${area.description}: ${area.percent}% concluído (${area.completed}/${area.total}) · ${area.inProgress} em andamento. ${area.description}`}
                    aria-label={`${index + 1}. ${area.description}: ${area.percent}% concluído, ${area.completed} de ${area.total} tópicos`}
                  >
                    <span className="timeline-marker" aria-hidden="true">{state === 'done' ? '✓' : index + 1}</span>
                    <span className="timeline-title">{area.description}</span>
                    <span className="timeline-meta">{area.completed}/{area.total} · {area.percent}%</span>
                    <span className="timeline-track" aria-hidden="true"><span style={{ width: `${area.percent}%` }} /></span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
        <ul className="status-legend" aria-label="Legenda da linha do tempo">
          <li><span className="legend-swatch state-done" aria-hidden="true" />Concluído</li>
          <li><span className="legend-swatch state-progress" aria-hidden="true" />Em andamento</li>
          <li><span className="legend-swatch state-partial" aria-hidden="true" />Parcial</li>
          <li><span className="legend-swatch state-idle" aria-hidden="true" />Não iniciado</li>
        </ul>
      </section>

      {records.length === 0 && (
        <div className="empty-explanation" role="status">
          <strong>Nenhum registro foi encontrado nesta origem do navegador.</strong>
          <span>O catálogo mostra {mainProgress.total} tópicos porque inclui todas as matérias planejadas, não apenas as já estudadas. Isso não confirma perda de dados: registros de outro navegador, perfil ou endereço não são acessíveis aqui. Use Configurações para exportar esta origem ou restaurar um backup validado.</span>
        </div>
      )}
      {records.length > 0 && trackedCount === 0 && (
        <div className="empty-explanation" role="status">
          <strong>Há {records.length} registro(s) nesta origem, mas nenhum corresponde às 20 matérias.</strong>
          <span>{legacyStageCount > 0 ? `${legacyStageCount} registro(s) antigo(s) de etapa foram preservados e não entram no progresso. ` : ''}Tópicos de base e complementares continuam salvos, mas fora deste total. Nada foi apagado ou migrado automaticamente.</span>
        </div>
      )}

      <details className="dashboard-panel data-details">
        <summary>
          <span><span className="eyebrow">Transparência dos dados</span><strong>Diagnóstico desta origem</strong></span>
          <span>{records.length} registro(s)</span>
        </summary>
        <ul className="diagnostics-list">
          <li><strong>Registros salvos nesta origem:</strong> {records.length}</li>
          <li><strong>Tópicos do catálogo com registro:</strong> {trackedCount}</li>
          <li><strong>Etapas legadas preservadas (sem tópico atual):</strong> {legacyStageCount}</li>
          <li><strong>Sessões importadas:</strong> {sessionCount}</li>
          <li><strong>DSA propostos, aguardando confirmação:</strong> {proposedDsaCount} de {dsaEntries.length}</li>
        </ul>
        <details className="reference-history">
          <summary>Referência histórica informada — não migrada</summary>
          <p>Python 1/1 · Programação Orientada a Objetos 18/18 · Git e GitHub 9/9 · SQL 34/34 · Web Fundamentals 8/8 · DSA + LeetCode 6/15. JavaScript está em andamento.</p>
          <p>Esses valores foram informados como referência, mas não foram convertidos automaticamente em registros nem entram no percentual. A migração legada continua somente leitura até existir mapeamento explícito, prévia, backup e aprovação.</p>
        </details>
      </details>
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
          try {
            await navigator.storage?.persist?.()
          } catch {
            /* melhor esforço: solicitar persistência do armazenamento local (R1) */
          }
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
          <div><span className="sidebar-kicker">ORGANIZADOR</span><h1>Estudos</h1></div>
        </div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navItems.map(({ id, label, icon }) => (
            <button key={id} type="button" className={`nav-item${activeSection === id ? ' active' : ''}`} aria-current={activeSection === id ? 'page' : undefined} onClick={() => setActiveSection(id)}>
              <Icon name={icon} /><span>{label}</span>
              {id === 'overview' && overdueLegacyCount > 0 && <span className="nav-count">{overdueLegacyCount}</span>}
            </button>
          ))}
        </nav>
        <p className="sidebar-storage" title={`Origem de armazenamento: ${window.location.origin}`}>
          <span className="storage-dot" />
          {loading ? 'Carregando armazenamento local…' : storageError ? 'Armazenamento indisponível' : `${records.length} registros · ${window.location.origin}`}
        </p>
      </aside>

      <main className="main-panel">
        <header className="main-header">
          <div className="page-heading"><span className="eyebrow">Dashboard de aprendizagem</span><h2>{activeItem.label}</h2><p>{sectionDescriptions[activeSection]}</p></div>
        </header>
        {storageError && <div className="alert-error" role="alert"><strong>Problema no armazenamento local</strong><span>{storageError}</span></div>}
        {notice && <div className="toast" role="status">{notice}</div>}
        {loading
          ? <p className="loading-state">Carregando seus dados locais…</p>
          : activeSection === 'overview'
            ? <Overview records={records} onContinue={(id) => openStage(id)} />
            : <StudyWorkspace
                section={activeSection}
                records={records}
                notify={showNotice}
                refresh={refresh}
                selectedStageId={selectedStageId}
                onOpenStage={openStage}
              />
}
      </main>
    </div>
  )
}

export default App
