import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppState } from '../state/AppState'

function maskEmail(value: string) {
  const [user, domain] = value.split('@')
  if (!user || !domain) return value
  const head = user.slice(0, 1)
  const tail = user.length > 2 ? user.slice(-1) : ''
  return `${head}${'*'.repeat(Math.max(2, user.length - 2))}${tail}@${domain}`
}

export function InviteAcceptPage() {
  const { token } = useParams()
  const {
    state: { data, session },
    dispatch,
  } = useAppState()

  const invite = useMemo(() => data.invites.find((item) => item.token === token), [data.invites, token])

  if (!invite) {
    return (
      <section className="screen-section">
        <article className="invite-state">
          <h3>Convite invalido</h3>
          <p>Este token nao foi encontrado no sistema.</p>
          <Link to="/" className="mini-button">
            Voltar ao dashboard
          </Link>
        </article>
      </section>
    )
  }

  const className = data.classes.find((item) => item.id === invite.classId)?.name ?? 'Classe'

  return (
    <section className="screen-section">
      <article className="invite-state">
        <h3>Aceitar convite</h3>
        <p>
          Convite para <strong>{maskEmail(invite.email)}</strong> entrar na classe <strong>{className}</strong>.
        </p>
        <p>Status atual: {invite.status}</p>
        <div className="hero-actions">
          {invite.status === 'pending' ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => dispatch({ type: 'invite-accept-simulate', payload: { inviteId: invite.id } })}
            >
              Aceitar (simulado)
            </button>
          ) : null}
          {session?.role === 'student' ? (
            <Link to="/album" className="secondary-button">
              Ir para meu album
            </Link>
          ) : (
            <Link to="/students" className="secondary-button">
              Ver alunos
            </Link>
          )}
        </div>
      </article>
    </section>
  )
}
