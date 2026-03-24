import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'

const ACTION_LABELS: Record<string, string> = {
  grant_achievement: 'Conquista concedida',
  remove_achievement: 'Conquista removida',
  invite_created: 'Convite criado',
  invite_cancelled: 'Convite cancelado',
  invite_accepted: 'Convite aceito',
}

function actionLabel(slug: string): string {
  return ACTION_LABELS[slug] ?? slug
}

export function DashboardPage() {
  const {
    state: { session, data },
    visibleStudents,
    visibleInvites,
    activeStudentAchievements,
    visibleAchievements,
  } = useAppState()

  if (!session) return null

  const scopeStudentIds =
    session.role === 'student'
      ? [session.userId]
      : session.role === 'professor'
        ? visibleStudents.map((item) => item.id)
        : data.students.map((item) => item.id)

  const pendingInvites = visibleInvites.filter((item) => item.status === 'pending').length
  const visibleAchievementIds = new Set(visibleAchievements.map((item) => item.id))

  const achievementsThisMonth = activeStudentAchievements.filter((item) => {
    const date = new Date(item.grantedAt)
    const now = new Date()
    return (
      scopeStudentIds.includes(item.studentId) &&
      visibleAchievementIds.has(item.achievementId) &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  }).length

  const earnedCount = activeStudentAchievements.filter(
    (item) => scopeStudentIds.includes(item.studentId) && visibleAchievementIds.has(item.achievementId),
  ).length
  const albumProgress = visibleAchievements.length > 0 ? Math.round((earnedCount / visibleAchievements.length) * 100) : 0

  const recentStudentGrants = activeStudentAchievements
    .filter((item) => scopeStudentIds.includes(item.studentId) && visibleAchievementIds.has(item.achievementId))
    .slice()
    .sort((a, b) => +new Date(b.grantedAt) - +new Date(a.grantedAt))
    .slice(0, 6)

  const visibleAuditLogs =
    session.role === 'professor'
      ? data.auditLogs.filter(
          (item) =>
            item.actorRole === 'professor' &&
            (item.actorUserId === session.userId || (!item.actorUserId && item.actor === session.displayName)),
        )
      : data.auditLogs

  return (
    <section className="screen-section">
      {/* ── Hero ── */}
      <div className="hero panel">
        <div className="hero-copy">
          <p className="eyebrow">Dashboard</p>
          <h2>Olá, {session.displayName.split(' ')[0]}!</h2>
          {session.role === 'student' ? (
            <p>Seu painel de conquistas. Toque em uma conquista no Álbum para gerar um story pronto para compartilhar.</p>
          ) : (
            <p>Painel operacional com dados de turma, convites e progresso dos achievements.</p>
          )}
          {session.role === 'student' ? (
            <div className="hero-actions">
              <Link to="/album" className="primary-button">Abrir meu álbum</Link>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/students" className="primary-button">Ver alunos</Link>
              <Link to="/invites" className="secondary-button">Gerenciar convites</Link>
            </div>
          )}
        </div>

        {/* KPI aside */}
        <div className="hero-aside">
          <div className="kpi-grid">
            {session.role === 'student' ? (
              <article className="kpi-card">
                <h4>Progresso do álbum</h4>
                <strong>{albumProgress}%</strong>
                <div className="progress-bar" style={{ marginTop: 10 }}>
                  <span style={{ width: `${albumProgress}%` }} />
                </div>
              </article>
            ) : (
              <article className="kpi-card">
                <h4>Alunos visíveis</h4>
                <strong>{visibleStudents.length}</strong>
              </article>
            )}

            {session.role === 'student' ? (
              <article className="kpi-card">
                <h4>Conquistas ganhas</h4>
                <strong>{earnedCount}</strong>
              </article>
            ) : (
              <article className="kpi-card">
                <h4>Convites pendentes</h4>
                <strong>{pendingInvites}</strong>
              </article>
            )}

            <article className="kpi-card">
              <h4>Conquistas no mês</h4>
              <strong>{achievementsThisMonth}</strong>
            </article>

            <article className="kpi-card">
              <h4>{session.role === 'student' ? 'Disponíveis' : 'Classes ativas'}</h4>
              <strong>
                {session.role === 'student'
                  ? visibleAchievements.length
                  : data.classes.filter((item) => item.active).length}
              </strong>
            </article>
          </div>
        </div>
      </div>

      {/* ── Recent activity feed ── */}
      <div className="screen-grid two">
        {session.role === 'student' ? (
          <article className="list-card">
            <h4 style={{ marginBottom: 14 }}>Minhas conquistas recentes</h4>
            {recentStudentGrants.length === 0 ? (
              <p className="muted">Nenhuma conquista ainda.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {recentStudentGrants.map((item) => {
                  const achievement = data.achievements.find((entry) => entry.id === item.achievementId)
                  return (
                    <div key={item.id} className="feed-card">
                      <div className="feed-achievement-row">
                        <div className="feed-achievement-thumb">{achievement?.icon ?? '🏅'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                            Álbum de Conquistas
                          </p>
                          <p className="line-title">{achievement?.title ?? item.achievementId}</p>
                          <p className="muted">{achievement?.collection ?? ''}</p>
                        </div>
                        <span className="tiny-label">{new Date(item.grantedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </article>
        ) : (
          <article className="list-card">
            <h4 style={{ marginBottom: 14 }}>Atividades recentes</h4>
            {visibleAuditLogs.length === 0 ? (
              <p className="muted">Sem atividades recentes neste perfil.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {visibleAuditLogs.slice(0, 6).map((item) => (
                  <div key={item.id} className="feed-card">
                    <div className="feed-badge">
                      {actionLabel(item.action)}
                    </div>
                    <div className="feed-achievement-row">
                      <div className="feed-achievement-thumb" style={{ fontSize: '1.2rem' }}>
                        {item.action === 'grant_achievement' ? '🏅'
                          : item.action === 'remove_achievement' ? '❌'
                          : item.action.startsWith('invite') ? '✉️'
                          : '📋'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="line-title" style={{ fontSize: '0.88rem' }}>{item.details}</p>
                        <p className="muted">{item.actor}</p>
                      </div>
                      <span className="tiny-label">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        )}
      </div>
    </section>
  )
}
