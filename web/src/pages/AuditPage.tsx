import { useMemo, useState } from 'react'
import { formatDate } from '../lib/utils'
import { useAppState } from '../state/AppState'

const ACTION_LABELS: Record<string, string> = {
  grant_achievement: 'Conquista concedida',
  remove_achievement: 'Conquista removida',
  invite_created: 'Convite criado',
  invite_cancelled: 'Convite cancelado',
  invite_accepted: 'Convite aceito',
  switch_role: 'Troca de perfil',
}

const PAGE_SIZE = 10

export function AuditPage() {
  const {
    state: { data },
  } = useAppState()

  const [actionFilter, setActionFilter] = useState<string>('all')
  const [page, setPage] = useState(0)

  const actionTypes = useMemo(() => {
    const set = new Set(data.auditLogs.map((item) => item.action))
    return ['all', ...Array.from(set)]
  }, [data.auditLogs])

  const filtered = useMemo(
    () => (actionFilter === 'all' ? data.auditLogs : data.auditLogs.filter((item) => item.action === actionFilter)),
    [actionFilter, data.auditLogs],
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleFilterChange(value: string) {
    setActionFilter(value)
    setPage(0)
  }

  return (
    <section className="screen-section">
      <div className="screen-head">
        <div>
          <h3>Auditoria</h3>
          <p>Rastro de acoes criticas do sistema.</p>
        </div>
        <span className="tiny-label">{filtered.length} registro(s)</span>
      </div>

      <div className="filter-row" style={{ marginBottom: '1rem' }}>
        {actionTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={`filter-chip ${actionFilter === type ? 'active' : ''}`}
            onClick={() => handleFilterChange(type)}
          >
            {type === 'all' ? 'Todos' : (ACTION_LABELS[type] ?? type)}
          </button>
        ))}
      </div>

      <article className="list-card">
        <div className="list-reset">
          {paginated.length === 0 ? (
            <div className="empty-state">
              <h4>Sem registros para este filtro</h4>
            </div>
          ) : (
            paginated.map((item) => (
              <div key={item.id} className="audit-line">
                <div>
                  <p className="line-title">{ACTION_LABELS[item.action] ?? item.action}</p>
                  <p className="muted">
                    {item.actor} ({item.actorRole}) &rarr; {item.target}
                  </p>
                  <p className="muted">{item.details}</p>
                </div>
                <span className="tiny-label">{formatDate(item.createdAt)}</span>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="action-row" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            <button
              type="button"
              className="mini-button"
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page === 0}
            >
              Anterior
            </button>
            <span className="tiny-label">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="mini-button"
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={page === totalPages - 1}
            >
              Proxima
            </button>
          </div>
        )}
      </article>
    </section>
  )
}
