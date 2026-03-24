import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppState'

// One distinct gradient per class index (loops if more classes are added)
const CLASS_COLORS = [
  { bg: 'linear-gradient(135deg, #f27d26, #f5a55a)', label: '#f27d26' }, // orange
  { bg: 'linear-gradient(135deg, #2c7a69, #4a9d8b)', label: '#2c7a69' }, // teal
  { bg: 'linear-gradient(135deg, #2e4c66, #507395)', label: '#2e4c66' }, // navy
  { bg: 'linear-gradient(135deg, #b85d67, #cf7a82)', label: '#b85d67' }, // rose
  { bg: 'linear-gradient(135deg, #cd9f37, #e3bb59)', label: '#cd9f37' }, // gold
  { bg: 'linear-gradient(135deg, #71893c, #92a956)', label: '#71893c' }, // olive
]

export function ClassesPage() {
  const {
    state: { data },
    visibleClassIds,
    activeStudentAchievements,
    visibleAchievements,
    selectedClassId,
    dispatch,
  } = useAppState()

  const classes = useMemo(
    () => data.classes.filter((item) => visibleClassIds.includes(item.id)),
    [data.classes, visibleClassIds],
  )

  const totalAchievements = visibleAchievements.length

  return (
    <section className="screen-section">
      <div className="screen-head">
        <div>
          <p className="eyebrow">Turmas</p>
          <h3>Classes</h3>
          <p className="muted">Selecione uma classe para filtrar alunos e convites.</p>
        </div>
        <Link to="/students" className="secondary-button">
          Ver alunos
        </Link>
      </div>

      <div className="cards-grid classes">
        {classes.map((item, idx) => {
          const color = CLASS_COLORS[idx % CLASS_COLORS.length]
          const students = data.students.filter((s) => s.classId === item.id && s.active)
          const studentCount = students.length

          const pendingInvites = data.invites.filter(
            (inv) => inv.classId === item.id && inv.status === 'pending',
          ).length

          // Progress: students who have at least one active achievement / (students * totalAchievements)
          const studentIds = students.map((s) => s.id)
          const grantedCount = activeStudentAchievements.filter((sa) =>
            studentIds.includes(sa.studentId),
          ).length
          const maxPossible = studentCount * totalAchievements
          const pct = maxPossible > 0 ? Math.round((grantedCount / maxPossible) * 100) : 0

          const isSelected = selectedClassId === item.id

          return (
            <article
              key={item.id}
              className={`class-card${isSelected ? ' class-card--selected' : ''}`}
            >
              {/* Header row: avatar + select button */}
              <div className="class-card-top">
                <div
                  className="class-avatar"
                  style={{ background: color.bg }}
                >
                  {item.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="class-card-badges">
                  {pendingInvites > 0 && (
                    <span className="class-badge-pending">
                      {pendingInvites} pendente{pendingInvites !== 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`mini-button${isSelected ? ' active' : ''}`}
                    onClick={() =>
                      dispatch({
                        type: 'select-class',
                        payload: isSelected ? null : item.id,
                      })
                    }
                  >
                    {isSelected ? '✓ Selecionada' : 'Selecionar'}
                  </button>
                </div>
              </div>

              {/* Name + meta */}
              <div className="class-card-body">
                <h4 className="class-card-name">{item.name}</h4>
                <p className="muted class-card-meta">
                  <span>{item.teacherName}</span>
                  <span className="class-card-dot">·</span>
                  <span>{item.schedule}</span>
                </p>
              </div>

              {/* Progress bar */}
              <div className="progress-wrap">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--muted)',
                  }}
                >
                  <span>Progresso do álbum</span>
                  <span style={{ color: color.label }}>{pct}%</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${pct}%`, background: color.bg }} />
                </div>
              </div>

              {/* Footer chips */}
              <div className="chip-row">
                <span className="pill">{studentCount} aluno{studentCount !== 1 ? 's' : ''}</span>
                <span className="pill">{grantedCount} conquista{grantedCount !== 1 ? 's' : ''}</span>
              </div>
            </article>
          )
        })}

        {classes.length === 0 && (
          <div className="empty-state">
            <h4>Nenhuma classe encontrada</h4>
            <p>Não há classes disponíveis para o seu perfil.</p>
          </div>
        )}
      </div>
    </section>
  )
}
