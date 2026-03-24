import { useMemo, useState } from 'react'
import type { Achievement, AchievementCategory } from '../domain/types'
import { saveAchievement } from '../lib/api'
import { useAppState } from '../state/AppState'

const CATEGORIES: AchievementCategory[] = ['Leitura', 'Frequencia', 'Participacao', 'Memorizacao', 'Modulo', 'Comportamento']
const COLORS: Achievement['color'][] = ['clay', 'gold', 'teal', 'olive', 'navy', 'rose']

type AchievementForm = {
  title: string
  description: string
  category: AchievementCategory
  collection: string
  color: Achievement['color']
  icon: string
  imageUrl: string
  imageDataUrl: string
  clearImage: boolean
  active: boolean
}

export function CatalogPage() {
  const {
    state: { session, data },
    dispatch,
    setToast,
  } = useAppState()

  const canManage = session?.role === 'director' || session?.role === 'superadmin'

  const [form, setForm] = useState<AchievementForm>({
    title: '',
    description: '',
    category: CATEGORIES[0],
    collection: 'Velho Testamento',
    color: COLORS[0],
    icon: '🏅',
    imageUrl: '',
    imageDataUrl: '',
    clearImage: false,
    active: true,
  })

  const [editingId, setEditingId] = useState<string | null>(null)

  const sorted = useMemo(
    () => data.achievements.slice().sort((a, b) => a.collection.localeCompare(b.collection, 'pt-BR') || a.title.localeCompare(b.title, 'pt-BR')),
    [data.achievements],
  )

  function startEdit(id: string) {
    const a = data.achievements.find((x) => x.id === id)
    if (!a) return
    setEditingId(id)
    setForm({
      title: a.title,
      description: a.description,
      category: (CATEGORIES.includes(a.category)
        ? a.category
        : CATEGORIES[0]),
      collection: a.collection,
      color: (COLORS.includes(a.color)
        ? a.color
        : COLORS[0]),
      icon: a.icon,
      imageUrl: a.imageUrl ?? '',
      imageDataUrl: '',
      clearImage: false,
      active: a.active,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm({
      title: '',
      description: '',
      category: CATEGORIES[0],
      collection: 'Velho Testamento',
      color: COLORS[0],
      icon: '🏅',
      imageUrl: '',
      imageDataUrl: '',
      clearImage: false,
      active: true,
    })
  }

  async function onPickFile(file: File | null) {
    if (!file) {
      setForm((p) => ({ ...p, imageDataUrl: '' }))
      return
    }

    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onerror = () => reject(new Error('read failed'))
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.readAsDataURL(file)
    })

    setForm((p) => ({ ...p, imageDataUrl: dataUrl, clearImage: false }))
  }

  async function save() {
    if (!canManage) return
    if (!session) return

    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        collection: form.collection,
        color: form.color,
        icon: form.icon,
        imageUrl: form.imageUrl.trim() || null,
        ...(form.imageDataUrl
          ? { imageDataUrl: form.imageDataUrl }
          : form.clearImage
            ? { imageDataUrl: null }
            : {}),
        active: form.active,
      }

      const savedAchievement = await saveAchievement(session, payload, editingId ?? undefined)

      dispatch({
        type: 'achievements-replace',
        payload: {
          achievements: editingId
            ? data.achievements.map((item) => (item.id === editingId ? savedAchievement : item))
            : [...data.achievements, savedAchievement],
        },
      })

      setToast(editingId ? 'Achievement atualizado.' : 'Achievement criado.')
      resetForm()
    } catch {
      setToast('Erro ao salvar achievement.')
    }
  }

  return (
    <section className="screen-section">
      <div className="screen-head">
        <div>
          <h3>Catalogo de achievements</h3>
          <p>Base global para diretor e superadmin.</p>
        </div>
      </div>

      {canManage ? (
        <article className="list-card" style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 12 }}>{editingId ? 'Editar achievement' : 'Novo achievement'}</h4>
          <div className="form-grid">
            <div className="field">
              <label>Titulo</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="field">
              <label>Descricao</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>

            <div className="field">
              <label>Categoria</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as AchievementCategory }))}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Colecao</label>
              <input value={form.collection} onChange={(e) => setForm((p) => ({ ...p, collection: e.target.value }))} />
            </div>

            <div className="field">
              <label>Cor</label>
              <select value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value as Achievement['color'] }))}>
                {COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Icone</label>
              <input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="EX, GN, 🏅" />
            </div>

            <div className="field">
              <label>Foto (URL)</label>
              <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value, clearImage: false }))} placeholder="https://..." />
              <p className="muted" style={{ marginTop: 6, fontSize: '0.8rem' }}>
                Ou envie uma imagem abaixo (salva no Postgres do Render).
              </p>
            </div>

            <div className="field">
              <label>Foto (Upload)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
              />
              {form.imageDataUrl ? (
                <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                  <img
                    src={form.imageDataUrl}
                    alt="Preview"
                    style={{ width: '100%', maxWidth: 420, borderRadius: 16, border: '1px solid var(--card-border)' }}
                  />
                  <button type="button" className="mini-button" onClick={() => setForm((p) => ({ ...p, imageDataUrl: '' }))}>
                    Remover imagem enviada
                  </button>
                </div>
              ) : null}

              {!form.imageDataUrl && editingId && form.imageUrl ? (
                <button
                  type="button"
                  className="mini-button"
                  style={{ marginTop: 10 }}
                  onClick={() => setForm((p) => ({ ...p, imageUrl: '', clearImage: true }))}
                >
                  Remover imagem salva
                </button>
              ) : null}
            </div>

            <label className="check-row" style={{ marginTop: 2 }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
              <span className="line-title" style={{ fontSize: '0.92rem' }}>Ativo</span>
            </label>

            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={save}>
                Salvar
              </button>
              {editingId ? (
                <button type="button" className="secondary-button" onClick={resetForm}>Cancelar</button>
              ) : null}
            </div>
          </div>
        </article>
      ) : null}

      <div className="catalog-grid">
        {sorted.map((achievement) => (
          <article key={achievement.id} className="catalog-card">
            <div className="achievement-head">
              <span className={`sticker-badge ${achievement.color}`}>{achievement.icon}</span>
              <span className="status-pill pending">{achievement.category}</span>
            </div>
            <h4>{achievement.title}</h4>
            <p>{achievement.description}</p>
            <p className="muted">Colecao: {achievement.collection}</p>
            {canManage ? (
              <div className="hero-actions" style={{ marginTop: 12 }}>
                <button type="button" className="secondary-button" onClick={() => startEdit(achievement.id)}>
                  Editar
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
