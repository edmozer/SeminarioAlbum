import { useMemo, useState } from 'react'
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
    state: { data, session },
    visibleClassIds,
    activeStudentAchievements,
    visibleAchievements,
    selectedClassId,
    dispatch,
  } = useAppState()

  const canManageTeachers = session?.role === 'director' || session?.role === 'superadmin'
  const canEditClass = session?.role === 'director' || session?.role === 'superadmin' || session?.role === 'professor'

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftSchedule, setDraftSchedule] = useState('')
  const [draftActive, setDraftActive] = useState(true)

  function startEdit(classId: string) {
    const c = data.classes.find((item) => item.id === classId)
    if (!c) return
    setEditingId(classId)
    setDraftName(c.name)
    setDraftSchedule(c.schedule)
    setDraftActive(c.active)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftName('')
    setDraftSchedule('')
    setDraftActive(true)
  }

  function saveEdit() {
    if (!editingId) return
    dispatch({
      type: 'class-update',
      payload: { classId: editingId, name: draftName, schedule: draftSchedule, active: draftActive },
    })
    cancelEdit()
  }

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
          const isEditing = editingId === item.id

          const canEditThisClass =
            canEditClass &&
            (session?.role === 'director' || session?.role === 'superadmin' || (session?.role === 'professor' && item.teacherId === session.userId))

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
                {isEditing ? (
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor={`class-name-${item.id}`}>Nome</label>
                      <input
                        id={`class-name-${item.id}`}
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`class-schedule-${item.id}`}>Horario</label>
                      <input
                        id={`class-schedule-${item.id}`}
                        value={draftSchedule}
                        onChange={(e) => setDraftSchedule(e.target.value)}
                        placeholder="Ex: Dom 06:00"
                      />
                    </div>
                    <label className="check-row" style={{ marginTop: 2 }}>
                      <input
                        type="checkbox"
                        checked={draftActive}
                        onChange={(e) => setDraftActive(e.target.checked)}
                      />
                      <span className="line-title" style={{ fontSize: '0.92rem' }}>Classe ativa</span>
                    </label>
                    <div className="hero-actions">
                      <button type="button" className="primary-button" onClick={saveEdit}>Salvar</button>
                      <button type="button" className="secondary-button" onClick={cancelEdit}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="class-card-name">{item.name}</h4>
                    <p className="muted class-card-meta">
                      <span>{item.teacherName}</span>
                      <span className="class-card-dot">·</span>
                      <span>{item.schedule}</span>
                      {!item.active ? (
                        <>
                          <span className="class-card-dot">·</span>
                          <span style={{ color: 'rgba(74,55,40,0.7)', fontWeight: 700 }}>Inativa</span>
                        </>
                      ) : null}
                    </p>
                  </>
                )}

                {canManageTeachers ? (
                  <div className="field" style={{ marginTop: 12 }}>
                      <label htmlFor={`class-teacher-${item.id}`} className="tiny-label">Professor da classe</label>
                      <select
                        id={`class-teacher-${item.id}`}
                        value={item.teacherId}
                        onChange={(e) =>
                          dispatch({
                            type: 'class-assign-teacher',
                            payload: { classId: item.id, teacherId: e.target.value },
                          })
                        }
                      >
                        {data.teachers
                          .slice()
                          .sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'))
                          .map((t) => (
                            <option key={t.id} value={t.id} disabled={!t.active && t.id !== item.teacherId}>
                              {t.displayName}{t.active ? '' : ' (inativo)'}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : null}

                {!isEditing && canEditThisClass ? (
                  <div className="hero-actions" style={{ marginTop: 12 }}>
                    <button type="button" className="secondary-button" onClick={() => startEdit(item.id)}>
                      Editar classe
                    </button>
                  </div>
                ) : null}
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
