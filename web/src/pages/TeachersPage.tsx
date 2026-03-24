import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppState'

export function TeachersPage() {
  const {
    state: { data },
    dispatch,
  } = useAppState()

  const teachers = useMemo(
    () => data.teachers.slice().sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR')),
    [data.teachers],
  )

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')

  function startEdit(id: string) {
    const t = data.teachers.find((item) => item.id === id)
    if (!t) return
    setEditingId(id)
    setDraftName(t.displayName)
    setDraftEmail(t.email)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftName('')
    setDraftEmail('')
  }

  function saveEdit() {
    if (!editingId) return
    dispatch({
      type: 'teacher-update',
      payload: {
        teacherId: editingId,
        displayName: draftName,
        email: draftEmail,
      },
    })
    cancelEdit()
  }

  function submitNew(e: React.FormEvent) {
    e.preventDefault()
    dispatch({ type: 'teacher-create', payload: { displayName: newName, email: newEmail } })
    setNewName('')
    setNewEmail('')
  }

  return (
    <section className="screen-section">
      <div className="screen-head">
        <div>
          <p className="eyebrow">Gestao</p>
          <h3>Professores</h3>
          <p className="muted">Crie, edite e ative/desative professores. Use Classes para designar um professor para cada turma.</p>
        </div>
        <span className="status-pill active">{teachers.length}</span>
      </div>

      <article className="list-card" style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 12 }}>Novo professor</h4>
        <form className="form-grid" onSubmit={submitNew}>
          <div className="field">
            <label htmlFor="teacher-name">Nome</label>
            <input
              id="teacher-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Prof Maria Souza"
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="teacher-email">Email</label>
            <input
              id="teacher-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="maria@seminario.com"
              autoComplete="off"
            />
          </div>
          <div className="hero-actions">
            <button type="submit" className="primary-button">Adicionar</button>
          </div>
        </form>
      </article>

      <div className="cards-grid">
        {teachers.map((t) => {
          const assigned = data.classes.filter((c) => c.teacherId === t.id).length
          const isEditing = editingId === t.id

          return (
            <article key={t.id} className="detail-card" style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p className="eyebrow">Professor</p>
                  <p className="line-title" style={{ marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.displayName}
                  </p>
                  <p className="muted" style={{ marginTop: 4 }}>{t.email}</p>
                </div>
                <span className={`status-pill ${t.active ? 'active' : 'removed'}`}>
                  {t.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="chip-row">
                <span className="pill">{assigned} classe{assigned !== 1 ? 's' : ''}</span>
              </div>

              {isEditing ? (
                <div className="form-grid">
                  <div className="field">
                    <label>Nome</label>
                    <input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} />
                  </div>
                  <div className="hero-actions">
                    <button type="button" className="primary-button" onClick={saveEdit}>Salvar</button>
                    <button type="button" className="secondary-button" onClick={cancelEdit}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="hero-actions">
                  <button type="button" className="secondary-button" onClick={() => startEdit(t.id)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => dispatch({ type: 'teacher-toggle', payload: { teacherId: t.id, active: !t.active } })}
                    style={{ justifyContent: 'center' }}
                  >
                    {t.active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              )}
            </article>
          )
        })}

        {teachers.length === 0 ? (
          <div className="empty-state">
            <h4>Nenhum professor cadastrado</h4>
            <p className="muted">Adicione o primeiro professor acima.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
