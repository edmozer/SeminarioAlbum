import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="empty-state">
      <h3>Pagina nao encontrada</h3>
      <p>Use a navegacao lateral para voltar ao fluxo principal.</p>
      <Link to="/" className="primary-button">
        Voltar ao dashboard
      </Link>
    </section>
  )
}
