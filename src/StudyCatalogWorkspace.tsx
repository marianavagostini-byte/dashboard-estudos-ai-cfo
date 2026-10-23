import { useMemo, useState } from 'react'
import type { StudyRecord } from './studyData'
import { getCatalogStatusHistory, getCatalogTopicRecord, getCompletionHistory, setCatalogTopicStatus } from './studyData'
import { studyCatalog, topicStatuses, type StudyTopic, type TopicStatus } from './studyCatalog'
import {
  calculateCatalogProgress,
  calculateCurriculumProgress,
  calculateParallelProgress,
  filterCatalogTopics,
  getCatalogTopicStatus,
  getCatalogTotals,
  getNextRecommendedTopic,
  listCatalogTopics,
  listOfficialTopicGroups,
  type CatalogTrack,
} from './catalogProgress'
import { saveRecord } from './studyDatabase'

function statusClass(status: string) {
  return status.toLocaleLowerCase('pt-BR').replaceAll(' ', '-')
}

function formatTimestamp(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('pt-BR')
}

function trackLabel(track: CatalogTrack) {
  if (track === 'suplementar') return 'Fora do progresso principal'
  if (track === 'paralela') return 'Trilha paralela'
  return undefined
}

function notStartedStatus(topic: StudyTopic, records: StudyRecord[]): TopicStatus {
  return (topic.prerequisites ?? []).every((id) => getCatalogTopicStatus(id, records) === 'Concluído')
    ? 'Disponível'
    : 'Bloqueado'
}

export function StudyCatalogWorkspace({
  records,
  notify,
  refresh,
  selectedTopicId,
  onOpenTopic,
}: {
  records: StudyRecord[]
  notify: (message: string) => void
  refresh: () => Promise<void>
  selectedTopicId?: string
  onOpenTopic: (topicId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'Todos'>('Todos')
  const [phaseFilter, setPhaseFilter] = useState('Todas')
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['area.javascript'])
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([])
  const [savingTopicId, setSavingTopicId] = useState<string>()

  const allTopics = useMemo(() => listCatalogTopics(), [])
  const groups = useMemo(() => listOfficialTopicGroups(), [])
  const totals = useMemo(() => getCatalogTotals(), [])
  const visibleTopics = useMemo(() => filterCatalogTopics(allTopics, records, {
    query,
    status: statusFilter,
    phaseId: phaseFilter === 'Todas' ? undefined : phaseFilter,
  }), [allTopics, records, query, statusFilter, phaseFilter])
  const visibleIds = useMemo(() => new Set(visibleTopics.map(({ topic }) => topic.id)), [visibleTopics])
  const progress = calculateCatalogProgress(records, { curriculumOnly: true })
  const parallelProgress = calculateParallelProgress(records)
  const areas = useMemo(() => calculateCurriculumProgress(records), [records])
  const nextTopic = useMemo(() => getNextRecommendedTopic(records, { curriculumOnly: true }), [records])
  const selected = selectedTopicId
    ? allTopics.find(({ topic }) => topic.id === selectedTopicId)
    : undefined
  const selectedStatus = selected ? getCatalogTopicStatus(selected.topic.id, records) : undefined
  const selectedRecord = selected ? getCatalogTopicRecord(records, selected.topic.id) : undefined
  const missingPrerequisites = selected
    ? (selected.topic.prerequisites ?? []).filter((id) => getCatalogTopicStatus(id, records) !== 'Concluído')
    : []
  const searchActive = !!query.trim() || statusFilter !== 'Todos' || phaseFilter !== 'Todas'
  const allGroupIds = groups.map(({ id }) => id)
  const allSubjectIds = groups.flatMap(({ subjects }) => subjects.map(({ id }) => id))

  function toggleItem(current: string[], id: string, open: boolean, setter: (ids: string[]) => void) {
    setter(open ? [...new Set([...current, id])] : current.filter((item) => item !== id))
  }

  async function updateStatus(topicId: string, status: TopicStatus) {
    const entry = allTopics.find(({ topic }) => topic.id === topicId)
    if (!entry) return
    setSavingTopicId(topicId)
    try {
      await saveRecord(setCatalogTopicStatus({
        id: entry.topic.id,
        title: entry.topic.title,
        phaseId: entry.phaseId,
        subjectId: entry.subjectId,
      }, getCatalogTopicRecord(records, topicId), status))
      await refresh()
      notify(`Progresso salvo: ${entry.topic.title} — ${status}.`)
    } catch (error) {
      notify(error instanceof Error ? `Não foi possível salvar o progresso: ${error.message}` : 'Não foi possível salvar o progresso.')
    } finally {
      setSavingTopicId(undefined)
    }
  }

  return (
    <div className="catalog-workspace">
      <section className="dashboard-panel catalog-progress" aria-label="Progresso do catálogo">
        <div className="section-heading">
          <div><span className="eyebrow">Trilha principal · 20 matérias</span><h3>{progress.percent}% concluído</h3></div>
          <strong>{progress.completed} de {progress.total} tópicos</strong>
        </div>
        <div className="progress-track main-progress-track" role="progressbar" aria-label="Progresso da trilha principal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}>
          <span style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="catalog-progress-meta">
          <span>{parallelProgress.completed}/{parallelProgress.total} em DSA + LeetCode (trilha paralela)</span>
          {nextTopic && <button className="topic-link" type="button" onClick={() => onOpenTopic(nextTopic.topic.id)}>Recomendado: {nextTopic.topic.title} →</button>}
        </div>
        <dl className="catalog-totals" aria-label="Composição do catálogo">
          <div><dt>Trilha principal</dt><dd>{totals.principal} tópicos · entram no progresso geral</dd></div>
          <div><dt>Suplementares</dt><dd>{totals.suplementar} tópicos · visíveis, fora do percentual</dd></div>
          <div><dt>Trilha paralela</dt><dd>{totals.paralela} tópicos · DSA + LeetCode, independente</dd></div>
          <div><dt>Catálogo completo</dt><dd>{totals.catalogo} tópicos cadastrados</dd></div>
        </dl>
      </section>

      <div className="catalog-tools">
        <label className="catalog-search">
          <span>Buscar matéria, tópico ou subtópico</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: FastAPI, joins, BFS" />
        </label>
        <label className="catalog-filter">
          <span>Filtrar por fase do catálogo</span>
          <select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)}>
            <option value="Todas">Todas as fases</option>
            {studyCatalog.map((phase) => <option key={phase.id} value={phase.id}>{phase.title}</option>)}
          </select>
        </label>
        <label className="catalog-filter">
          <span>Filtrar por status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TopicStatus | 'Todos')}>
            <option value="Todos">Todos os status</option>
            {topicStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </div>

      <div className="catalog-view-actions">
        <button className="text-button" type="button" onClick={() => { setExpandedGroups(allGroupIds); setExpandedSubjects(allSubjectIds) }}>Expandir tudo</button>
        <button className="text-button" type="button" onClick={() => { setExpandedGroups([]); setExpandedSubjects([]) }}>Recolher tudo</button>
        {(searchActive || expandedGroups.length > 0) && <button className="text-button" type="button" onClick={() => { setQuery(''); setStatusFilter('Todos'); setPhaseFilter('Todas'); setExpandedGroups([]); setExpandedSubjects([]) }}>Limpar filtros</button>}
        <span>{visibleTopics.length} tópico(s) visível(is)</span>
      </div>

      <div className="catalog-layout">
        <nav className="dashboard-panel catalog-browser" aria-label="Matérias do roadmap">
          <p className="muted-note catalog-order-note">Ordem oficial das 20 matérias. Tópicos suplementares e a trilha paralela DSA + LeetCode aparecem ao final, fora do progresso geral. Pré-requisitos continuam valendo mesmo entre trilhas: dois tópicos de Arquitetura de software dependem de fundamentos de Python (suplementar) e só são liberados quando ele estiver concluído.</p>
          {groups.map((group) => {
            const visibleGroupTopics = group.entries.filter(({ topic }) => visibleIds.has(topic.id))
            if (!visibleGroupTopics.length) return null
            const groupOpen = expandedGroups.includes(group.id) || visibleGroupTopics.some(({ topic }) => topic.id === selectedTopicId) || searchActive
            const visibleCompleted = visibleGroupTopics.filter(({ topic }) => getCatalogTopicStatus(topic.id, records) === 'Concluído').length
            const label = trackLabel(group.track)
            return (
              <details className={`catalog-phase catalog-group catalog-track-${group.track}`} key={group.id} open={groupOpen} onToggle={(event) => toggleItem(expandedGroups, group.id, event.currentTarget.open, setExpandedGroups)}>
                <summary>
                  <span>
                    {group.track === 'principal' && <span className="catalog-group-index" aria-hidden="true">{areas.findIndex(({ id }) => id === group.id) + 1}. </span>}
                    {group.title}
                    {label && <small className={`track-badge track-${group.track}`}>{label}</small>}
                  </span>
                  <small>{visibleCompleted}/{visibleGroupTopics.length}</small>
                </summary>
                <div className="catalog-phase-body">
                  {group.track !== 'principal' && <p className="muted-note">{group.description}</p>}
                  {group.subjects.map((subject) => {
                    const topics = subject.entries.filter(({ topic }) => visibleIds.has(topic.id))
                    if (!topics.length) return null
                    const subjectOpen = expandedSubjects.includes(subject.id) || topics.some(({ topic }) => topic.id === selectedTopicId) || searchActive
                    const completed = topics.filter(({ topic }) => getCatalogTopicStatus(topic.id, records) === 'Concluído').length
                    return (
                      <details className="catalog-subject" key={subject.id} open={subjectOpen} onToggle={(event) => toggleItem(expandedSubjects, subject.id, event.currentTarget.open, setExpandedSubjects)}>
                        <summary><span>{subject.title}</span><small>{completed}/{topics.length}</small></summary>
                        <ul className="catalog-topic-list">
                          {topics.map(({ topic }) => {
                            const status = getCatalogTopicStatus(topic.id, records)
                            const hasPrerequisites = !!topic.prerequisites?.length
                            return (
                              <li key={topic.id}>
                                <button className={`catalog-topic${topic.id === selectedTopicId ? ' selected' : ''}`} type="button" onClick={() => onOpenTopic(topic.id)} aria-current={topic.id === selectedTopicId ? 'page' : undefined}>
                                  <span className={`catalog-status-dot status-${statusClass(status)}`} aria-hidden="true" />
                                  <span>{topic.title}</span>
                                  {topic.priority && <small className={`priority priority-${statusClass(topic.priority)}`}>{topic.priority}</small>}
                                  <small>{status}</small>
                                  {hasPrerequisites && <span className="prerequisite-marker" title="Possui pré-requisitos" aria-label="Possui pré-requisitos">↳</span>}
                                </button>
                                {topic.subtopics.length > 0 && <ul className="catalog-subtopic-list">{topic.subtopics.map((item) => <li key={item.id}>{item.title}</li>)}</ul>}
                              </li>
                            )
                          })}
                        </ul>
                      </details>
                    )
                  })}
                </div>
              </details>
            )
          })}
          {visibleTopics.length === 0 && <p className="muted-note">Nenhum tópico corresponde à busca e aos filtros atuais. Limpe os filtros para ver o roadmap completo.</p>}
        </nav>

        {selected ? (
          <article className="dashboard-panel catalog-topic-detail" aria-labelledby="catalog-selected-topic">
            <span className="eyebrow">{selected.phaseTitle} · {selected.subjectTitle}{selected.phaseParallel ? ' · trilha paralela' : ''}</span>
            <h3 id="catalog-selected-topic">{selected.topic.title}</h3>
            {selected.topic.origin && <p className="muted-note">{selected.topic.origin === 'recuperado' ? 'Nome recuperado das fontes históricas locais.' : 'Tema proposto para a trilha de entrevistas.'}</p>}
            <div className="topic-status-actions" role="group" aria-label="Marcar progresso do tópico">
              <button className={`status-action${selectedStatus === 'Bloqueado' || selectedStatus === 'Disponível' ? ' active' : ''}`} type="button" disabled={savingTopicId === selected.topic.id} onClick={() => void updateStatus(selected.topic.id, notStartedStatus(selected.topic, records))}>Não iniciado</button>
              <button className={`status-action${selectedStatus === 'Em andamento' ? ' active' : ''}`} type="button" disabled={savingTopicId === selected.topic.id} onClick={() => void updateStatus(selected.topic.id, 'Em andamento')}>Em andamento</button>
              <button className={`status-action${selectedStatus === 'Concluído' ? ' active' : ''}`} type="button" disabled={savingTopicId === selected.topic.id || (missingPrerequisites.length > 0 && selectedStatus !== 'Concluído')} onClick={() => void updateStatus(selected.topic.id, 'Concluído')}>Concluído</button>
            </div>
            <p className="muted-note" role="status">
              Status atual: <strong>{selectedStatus}</strong>.
              {selectedStatus === 'Bloqueado' && ' Conclua os pré-requisitos para liberar este tópico.'}
              {missingPrerequisites.length > 0 && selectedStatus !== 'Concluído' && ` Faltam ${missingPrerequisites.length} pré-requisito(s) para concluir.`}
              {savingTopicId === selected.topic.id && ' Salvando…'}
            </p>
            {selectedRecord?.data.completedAt && <p><strong>{selectedStatus === 'Concluído' ? 'Concluído em' : 'Última conclusão registrada'}:</strong> {selectedRecord.data.completedAt}</p>}
            {!!getCompletionHistory(selectedRecord).length && <p className="muted-note">Conclusões anteriores: {getCompletionHistory(selectedRecord).join(', ')}</p>}
            {selected.topic.priority && <p><strong>Prioridade:</strong> {selected.topic.priority}</p>}
            {!!selected.topic.prerequisites?.length && (
              <section className="topic-detail-section"><h4>Pré-requisitos</h4>
                <ul>{selected.topic.prerequisites.map((id) => {
                  const required = allTopics.find(({ topic }) => topic.id === id)
                  const status = getCatalogTopicStatus(id, records)
                  return <li key={id}><button className="topic-link" type="button" onClick={() => onOpenTopic(id)}>{required?.topic.title ?? id}</button> · {status}</li>
                })}</ul>
              </section>
            )}
            {selected.topic.objective && <section className="topic-detail-section"><h4>Objetivo</h4><p>{selected.topic.objective}</p></section>}
            {selected.topic.material && <section className="topic-detail-section"><h4>Material externo</h4><a href={selected.topic.material.url} target="_blank" rel="noopener noreferrer">{selected.topic.material.title} — {selected.topic.material.author}</a></section>}
            {selected.topic.exercise && <section className="topic-detail-section"><h4>Exercício</h4><p>{selected.topic.exercise}</p></section>}
            {selected.topic.completionCriteria && <section className="topic-detail-section"><h4>Critério de conclusão</h4><p>{selected.topic.completionCriteria}</p></section>}
            {!selected.topic.objective && !selected.topic.material && !selected.topic.exercise && !selected.topic.completionCriteria && <p className="muted-note">Este tópico ainda não possui objetivo, exercício e critério de conclusão detalhados. Ele permanece no roadmap como referência de sequência.</p>}
            {selected.topic.subtopics.length > 0 && <section className="topic-detail-section"><h4>Subtópicos</h4><ul>{selected.topic.subtopics.map(({ id, title }) => <li key={id}>{title}</li>)}</ul></section>}
            {!!getCatalogStatusHistory(selectedRecord).length && (
              <section className="topic-detail-section"><h4>Histórico de status</h4>
                <ol className="status-history">{getCatalogStatusHistory(selectedRecord).map((entry, index) => <li key={`${entry.at}-${index}`}><strong>{entry.status}</strong> · {formatTimestamp(entry.at)}</li>)}</ol>
              </section>
            )}
            {!selectedRecord && <p className="muted-note">Nenhum registro local para este tópico. O status exibido é calculado pelos pré-requisitos e não foi gravado.</p>}
          </article>
        ) : (
          <aside className="dashboard-panel catalog-topic-detail catalog-empty-detail">
            <span className="eyebrow">Detalhes do tópico</span>
            <h3>Selecione um tópico</h3>
            <p>O painel mostra objetivo, pré-requisitos, materiais, exercício, critério de conclusão, data e histórico do progresso.</p>
            {nextTopic && <button className="primary-button" type="button" onClick={() => onOpenTopic(nextTopic.topic.id)}>Abrir recomendação: {nextTopic.topic.title}</button>}
          </aside>
        )}
      </div>

      <section className="dashboard-panel area-progress-panel" aria-labelledby="area-progress-title">
        <div className="section-heading"><div><span className="eyebrow">Roadmap · ordem oficial</span><h3 id="area-progress-title">Progresso das 20 matérias</h3></div><strong>{areas.filter(({ percent }) => percent === 100).length}/{areas.length} concluídas</strong></div>
        <p className="muted-note">O progresso por matéria usa apenas os {areas.reduce((sum, area) => sum + area.total, 0)} tópicos das 20 matérias. {totals.suplementar} tópicos suplementares e {totals.paralela} de DSA + LeetCode ficam fora deste total; com eles, o catálogo completo soma {totals.catalogo}. Registros legados também não são somados aqui.</p>
        <div className="area-progress-grid">
          {areas.map((area, index) => (
            <div className="area-progress-card" key={area.id}>
              <span>{index + 1}. {area.title}</span>
              <small>{area.completed}/{area.total} · {area.inProgress} em andamento</small>
              <span className="area-progress-track"><span style={{ width: `${area.percent}%` }} /></span>
              <small>{area.percent}%</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
