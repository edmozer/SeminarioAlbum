import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppState'

export function GrantPage() {
  const {
    visibleStudents,
    visibleAchievements,
    dispatch,
    selectedClassId,
    state: { data },
  } = useAppState()

  const [studentSelection, setStudentSelection] = useState<{ key: string; ids: string[] }>({ key: '', ids: [] })
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const selectedClassName = selectedClassId
    ? data.classes.find((item) => item.id === selectedClassId)?.name ?? 'Classe selecionada'
    : 'Todas as classes'

  const studentMap = useMemo(() => new Map(visibleStudents.map((item) => [item.id, item])), [visibleStudents])

  const visibleStudentsKey = useMemo(() => visibleStudents.map((item) => item.id).join('|'), [visibleStudents])
  const selectedStudentIds = studentSelection.key === visibleStudentsKey ? studentSelection.ids : []

  function toggleStudent(studentId: string) {
    setStudentSelection((prev) => {
      const base = prev.key === visibleStudentsKey ? prev.ids : []
      const next = base.includes(studentId) ? base.filter((item) => item !== studentId) : [...base, studentId]
      return { key: visibleStudentsKey, ids: next }
    })
  }

  function submitGrant() {
    if (!selectedAchievementId) {
      dispatch({ type: 'toast', payload: 'Selecione um achievement para conceder.' })
      return
    }
    if (selectedStudentIds.length === 0) {
      dispatch({ type: 'toast', payload: 'Selecione ao menos um aluno.' })
      return
    }

    dispatch({
      type: 'grant-achievement',
      payload: {
        studentIds: selectedStudentIds,
        achievementId: selectedAchievementId,
        note: note.trim() || undefined,
      },
    })

    setStudentSelection({ key: visibleStudentsKey, ids: [] })
    setSelectedAchievementId(null)
    setNote('')
  }

  return (
    <section className="screen-section">
      <div className="screen-head">
        <div>
          <h3>Conceder achievements</h3>
          <p>Fluxo em lote para classe: {selectedClassName}.</p>
        </div>
        <div className="action-row">
          <button
            type="button"
            className="mini-button"
            onClick={() => setStudentSelection({ key: visibleStudentsKey, ids: visibleStudents.map((item) => item.id) })}
          >
            Selecionar todos
          </button>
          <button type="button" className="mini-button" onClick={() => setStudentSelection({ key: visibleStudentsKey, ids: [] })}>
            Limpar
          </button>
        </div>
      </div>

      <div className="screen-grid two">
        <article className="list-card">
          <h4>1) Alunos</h4>
          <div className="form-grid">
            {visibleStudents.map((student) => (
              <label key={student.id} className="check-row">
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                />
                <span className="line-title">
                  {student.firstName} {student.lastName}
                </span>
              </label>
            ))}
          </div>
        </article>

        <article className="list-card">
          <h4>2) Achievement</h4>
          <div className="achievement-list">
            {visibleAchievements.map((achievement) => (
              <button
                key={achievement.id}
                type="button"
                className={`achievement-option ${selectedAchievementId === achievement.id ? 'selected' : ''}`}
                onClick={() => setSelectedAchievementId(achievement.id)}
              >
                <div className="achievement-head">
                  {/* Circle icon style */}
                  <div className="achievement-circle unlocked" style={{ width: 48, height: 48 }}>
                    {achievement.icon}
                  </div>
                  <span className="status-pill pending">{achievement.category}</span>
                </div>
                <strong>{achievement.title}</strong>
                <p className="muted" style={{ fontSize: '0.82rem' }}>{achievement.description}</p>
              </button>
            ))}
          </div>

          <div className="field">
            <label htmlFor="grant-note" className="tiny-label">
              Observacao opcional
            </label>
            <input
              id="grant-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex.: revisao semanal concluida"
            />
          </div>

          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={submitGrant}>
              Confirmar concessao
            </button>
            <span className="tiny-label">
              {selectedStudentIds.length} aluno(s) selecionado(s)
              {selectedStudentIds.length > 0
                ? `: ${selectedStudentIds.map((id) => studentMap.get(id)?.firstName ?? '').filter(Boolean).join(', ')}`
                : ''}
            </span>
          </div>
        </article>
      </div>
    </section>
  )
}
