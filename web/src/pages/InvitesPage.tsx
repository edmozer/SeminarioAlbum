import { useEffect, useMemo, useState } from 'react'
import { formatDate } from '../lib/utils'
import { useAppState } from '../state/AppState'

type InviteFilter = 'all' | 'pending' | 'accepted' | 'cancelled' | 'expired'

const FILTER_LABELS: Record<InviteFilter, string> = {
  all: 'Todos',
  pending: 'Pendente',
  accepted: 'Aceito',
  cancelled: 'Cancelado',
  expired: 'Expirado',
}

const STATUS_PILL: Record<string, string> = {
  pending: 'pending',
  accepted: 'active',
  cancelled: 'removed',
  expired: 'removed',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  cancelled: 'Cancelado',
  expired: 'Expirado',
}

export function InvitesPage() {
  const {
    state: { data },
    visibleInvites,
    visibleClassIds,
    selectedClassId,
    dispatch,
  } = useAppState()
  const [email, setEmail] = useState('')
  const [classId, setClassId] = useState<string>(selectedClassId ?? visibleClassIds[0] ?? '')
  const [filter, setFilter] = useState<InviteFilter>('all')

  // Keep classId in sync when the global selectedClassId changes (e.g. role switch)
  useEffect(() => {
    setClassId(selectedClassId ?? visibleClassIds[0] ?? '')
  }, [selectedClassId, visibleClassIds])

  const classes = useMemo(() => data.classes.filter((item) => visibleClassIds.includes(item.id)), [data.classes, visibleClassIds])

  const filtered = useMemo(
    () => visibleInvites.filter((item) => (filter === 'all' ? true : item.status === filter)),
    [filter, visibleInvites],
  )

  const pendingCount = visibleInvites.filter((item) => item.status === 'pending').length

  function submitInvite(event: React.FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()

    if (!value.includes('@') || value.length < 6) {
      dispatch({ type: 'toast', payload: 'Informe um email valido.' })
      return
    }
    if (!classId) {
      dispatch({ type: 'toast', payload: 'Selecione uma classe para enviar convite.' })
      return
    }

    dispatch({ type: 'invite-create', payload: { email: value, classId } })
    setEmail('')
  }

  async function copyLink(token: string) {
    const link = `${window.location.origin}${window.location.pathname}#/invite/${token}`
    try {
      await navigator.clipboard.writeText(link)
      dispatch({ type: 'toast', payload: 'Link copiado.' })
    } catch {
      dispatch({ type: 'toast', payload: 'Falha ao copiar link. Copie manualmente.' })
    }
  }

  return (
    <section className="screen-section">
      <div className="screen-head">
        <div>
          <h3>Convites para classe</h3>
          <p>Professora adiciona alunos por convite e acompanha status de aceite.</p>
        </div>
        <span className="status-pill pending">{pendingCount} pendentes</span>
      </div>

      <div className="screen-grid two">
        <article className="invite-state">
          <h4>Novo convite</h4>
          <form className="form-grid" onSubmit={submitInvite}>
            <div className="field">
              <label htmlFor="invite-email">Email</label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="aluno@exemplo.com"
                autoComplete="off"
              />
            </div>

            <div className="field">
              <label htmlFor="invite-class">Classe</label>
              <select id="invite-class" value={classId} onChange={(event) => setClassId(event.target.value)}>
                <option value="">Selecione uma classe</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.schedule}
                  </option>
                ))}
              </select>
            </div>

            <div className="hero-actions">
              <button type="submit" className="primary-button">
                Criar convite
              </button>
            </div>
          </form>
        </article>

        <article className="list-card">
          <div className="screen-head" style={{ marginBottom: 0 }}>
            <h4>Historico de convites</h4>
            <div className="filter-row">
              {(['all', 'pending', 'accepted', 'cancelled'] as InviteFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`filter-chip ${filter === item ? 'active' : ''}`}
                  onClick={() => setFilter(item)}
                >
                  {FILTER_LABELS[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="invite-grid">
            {filtered.map((invite) => {
              const classLabel = data.classes.find((item) => item.id === invite.classId)?.name ?? 'Classe'
              const pillClass = STATUS_PILL[invite.status] ?? 'pending'
              const statusLabel = STATUS_LABELS[invite.status] ?? invite.status
              return (
                <article key={invite.id} className="invite-card">
                  <div className="invite-line">
                    <div>
                      <p className="line-title">{invite.email}</p>
                      <p className="muted">{classLabel}</p>
                    </div>
                    <span className={`status-pill ${pillClass}`}>{statusLabel}</span>
                  </div>

                  <p className="muted">Criado em {formatDate(invite.createdAt)}</p>
                  <div className="action-row">
                    {invite.status === 'pending' && (
                      <button type="button" className="mini-button" onClick={() => copyLink(invite.token)}>
                        Copiar link
                      </button>
                    )}
                    {invite.status === 'pending' ? (
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() => dispatch({ type: 'invite-accept-simulate', payload: { inviteId: invite.id } })}
                      >
                        Simular aceite
                      </button>
                    ) : null}
                    {invite.status === 'pending' ? (
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() => dispatch({ type: 'invite-cancel', payload: { inviteId: invite.id } })}
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}

            {filtered.length === 0 ? (
              <div className="empty-state">
                <h4>Sem convites neste filtro</h4>
                <p>Crie um convite novo para adicionar alunos na turma.</p>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  )
}
