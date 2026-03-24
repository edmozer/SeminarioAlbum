import { useAppState } from '../state/AppState'

export function CatalogPage() {
  const { visibleAchievements } = useAppState()

  return (
    <section className="screen-section">
      <div className="screen-head">
        <div>
          <h3>Catalogo de achievements</h3>
          <p>Base global para diretor e superadmin.</p>
        </div>
      </div>

      <div className="catalog-grid">
        {visibleAchievements.map((achievement) => (
          <article key={achievement.id} className="catalog-card">
            <div className="achievement-head">
              <span className={`sticker-badge ${achievement.color}`}>{achievement.icon}</span>
              <span className="status-pill pending">{achievement.category}</span>
            </div>
            <h4>{achievement.title}</h4>
            <p>{achievement.description}</p>
            <p className="muted">Colecao: {achievement.collection}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

