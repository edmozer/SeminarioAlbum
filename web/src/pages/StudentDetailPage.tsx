import { Link, useParams } from 'react-router-dom'
import { fetchStudentAchievements, removeStudentAchievement } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAppState } from '../state/AppState'

export function StudentDetailPage() {
  const { studentId } = useParams()
  const {
    state: { data, session },
    visibleStudents,
    visibleAchievements,
    dispatch,
    setToast,
  } = useAppState()

  const student = data.students.find((item) => item.id === studentId)

  if (!session) return null
  const activeSession = session

  if (activeSession.role === 'professor' && studentId && !visibleStudents.some((item) => item.id === studentId)) {
    return (
      <section className="empty-state">
        <h3>Sem acesso a este aluno</h3>
        <p>Este aluno nao esta na sua classe selecionada.</p>
        <Link to="/students" className="mini-button">
          Voltar para alunos
        </Link>
      </section>
    )
  }

  if (!student) {
    return (
      <section className="empty-state">
        <h3>Aluno nao encontrado</h3>
        <p>Verifique se o aluno ainda esta ativo na classe.</p>
      </section>
    )
  }

  const grants = data.studentAchievements
    .filter((item) => item.studentId === student.id)
    .sort((a, b) => +new Date(b.grantedAt) - +new Date(a.grantedAt))

  const visibleAchievementIds = new Set(visibleAchievements.map((item) => item.id))
  const activeGrants = grants.filter((item) => item.status === 'granted' && visibleAchievementIds.has(item.achievementId)).length
  const progress = visibleAchievements.length > 0 ? Math.round((activeGrants / visibleAchievements.length) * 100) : 0

  async function removeGrant(grantId: string) {
    try {
      await removeStudentAchievement(activeSession, grantId)
      const mapped = await fetchStudentAchievements(activeSession)

      dispatch({ type: 'student-achievements-replace', payload: { studentAchievements: mapped } })

      setToast('Conquista removida.')
    } catch {
      setToast('Falha ao remover no servidor.')
    }
  }

  return (
    <section className="screen-section">
      <div className="detail-card">
        <div className="detail-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--orange), #f5a55a)',
              display: 'grid', placeItems: 'center',
              color: 'white', fontWeight: 800, fontSize: '1.4rem',
              flexShrink: 0, boxShadow: 'var(--shadow-orange)',
            }}>
              {student.firstName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="eyebrow">Aluno</p>
              <h3 className="detail-title">
                {student.firstName} {student.lastName}
              </h3>
            </div>
          </div>
          <Link to={`/album?studentId=${student.id}`} className="secondary-button">
            Ver álbum
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <p className="muted">Progresso global</p>
          <span className="status-pill active">{progress}%</span>
        </div>
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <article className="list-card">
        <h4>Historico de conquistas</h4>
        {grants.length === 0 ? <p className="muted">Sem historico para este aluno.</p> : null}
        <div className="list-reset">
          {grants.map((grant) => {
            const achievement = data.achievements.find((item) => item.id === grant.achievementId)
            const canRemove =
              activeSession.role === 'professor' || activeSession.role === 'director' || activeSession.role === 'superadmin'
            return (
              <div key={grant.id} className="line-item">
                <div>
                  <p className="line-title">{achievement?.title ?? 'Achievement removido'}</p>
                  <p className="muted">
                    Concedido por {grant.grantedBy} em {formatDate(grant.grantedAt)}
                  </p>
                </div>
                <div className="action-row">
                  <span className={`status-pill ${grant.status === 'granted' ? 'active' : 'removed'}`}>
                    {grant.status === 'granted' ? 'Concedida' : 'Removida'}
                  </span>
                  {canRemove && grant.status === 'granted' ? (
                    <button
                      type="button"
                      className="mini-button"
                      onClick={() => void removeGrant(grant.id)}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </article>
    </section>
  )
}
