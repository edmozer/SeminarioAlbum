import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'

export function LoginPage() {
  const navigate = useNavigate()
  const { setToast, dispatch } = useAppState()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${apiBase}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      
      const user = data?.user
      if (!user?.id || !user?.role) {
        throw new Error('Invalid login response')
      }

      setToast(`Bem-vindo, ${user.displayName || email}`)

      // Update app state (AppState persists session)
      dispatch({
        type: 'login',
        payload: {
          role: user.role,
          userId: user.id,
          displayName: user.displayName || email,
        },
      })
      
      // Redirect to dashboard
      navigate('/')
    } catch (error) {
      console.error(error)
      setToast('Erro no login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--bg)'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--shadow-orange)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="brand-mark" style={{ margin: '0 auto 16px', fontSize: '1.5rem', width: '64px', height: '64px' }}>🏆</div>
          <h2 className="display" style={{ fontSize: '2rem', marginBottom: '8px' }}>Bem-vindo</h2>
          <p className="muted">Entre com seu email para continuar</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            className="primary-button" 
            style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="muted" style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8rem' }}>
          Acesso liberado para protótipo.
        </p>
      </div>
    </div>
  )
}
