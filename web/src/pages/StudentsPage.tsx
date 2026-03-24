import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'

export function StudentsPage() {
  const {
    visibleStudents,
    visibleAchievements,
    state: { data },
  } = useAppState()

  const visibleAchievementIds = new Set(visibleAchievements.map((item) => item.id))

  return (
    <section className="screen-section">
      <div className="screen-head">
        <div>
          <h3>Alunos da classe</h3>
          <p>Visao operacional para professora acompanhar a turma e abrir detalhes individuais.</p>
        </div>
        <div className="action-row">
          <Link to="/invites" className="secondary-button">
            Convidar aluno
          </Link>
          <Link to="/grant" className="primary-button">
            Conceder achievements
          </Link>
        </div>
      </div>

      <div className="cards-grid students">
        {visibleStudents.length === 0 ? (
          <div className="empty-state">
            <h4>Nenhum aluno nesta turma</h4>
            <p>Convide alunos ou selecione outra classe.</p>
          </div>
        ) : (
          visibleStudents.map((student) => {
            const className = data.classes.find((item) => item.id === student.classId)?.name ?? 'Sem classe'
            const earnedCount = data.studentAchievements.filter(
              (item) => item.studentId === student.id && item.status === 'granted' && visibleAchievementIds.has(item.achievementId),
            ).length
            const total = visibleAchievements.length
            const progress = total > 0 ? Math.round((earnedCount / total) * 100) : 0

            return (
              <article key={student.id} className="student-card">
                <div className="student-top">
                  {/* Avatar circle — laranja como conquista-app */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--orange), #f5a55a)',
                    display: 'grid', placeItems: 'center',
                    color: 'white', fontWeight: 800, fontSize: '1.1rem',
                    flexShrink: 0, boxShadow: 'var(--shadow-orange)',
                  }}>
                    {student.firstName.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="status-pill active">{progress}%</span>
                </div>
                <div>
                  <p className="person-name">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="muted">{className}</p>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <div className="hero-actions" style={{ marginTop: 4 }}>
                  <Link className="mini-button" to={`/students/${student.id}`}>
                    Detalhes
                  </Link>
                  <Link className="mini-button" to={`/album?studentId=${student.id}`}>
                    Álbum
                  </Link>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
