import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { Role } from '../domain/types'
import { useAppState } from '../state/AppState'

const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'Super Admin',
  director: 'Diretor',
  professor: 'Professor',
  student: 'Aluno',
}

interface MenuItem {
  to: string
  label: string
  icon: string
  roles: Role[]
}

const MENU: MenuItem[] = [
  { to: '/',        label: 'Dashboard',  icon: '🏠', roles: ['superadmin', 'director', 'professor', 'student'] },
  { to: '/classes', label: 'Classes',    icon: '📚', roles: ['superadmin', 'director', 'professor'] },
  { to: '/teachers',label: 'Professores',icon: '🧑‍🏫', roles: ['superadmin', 'director'] },
  { to: '/students',label: 'Alunos',     icon: '👥', roles: ['superadmin', 'director', 'professor'] },
  { to: '/grant',   label: 'Conceder',   icon: '🏅', roles: ['superadmin', 'director', 'professor'] },
  { to: '/invites', label: 'Convites',   icon: '✉️',  roles: ['superadmin', 'director', 'professor'] },
  { to: '/album',   label: 'Álbum',      icon: '🎖️', roles: ['superadmin', 'director', 'professor', 'student'] },
  { to: '/catalog', label: 'Catálogo',   icon: '🗂️', roles: ['superadmin', 'director'] },
  { to: '/audit',   label: 'Auditoria',  icon: '📋', roles: ['superadmin', 'director'] },
]

// Items shown in the mobile bottom nav (most important, max 5)
const BOTTOM_NAV_ROLES: Record<Role, string[]> = {
  superadmin: ['/', '/classes', '/students', '/grant', '/audit'],
  director:   ['/', '/classes', '/students', '/invites', '/catalog'],
  professor:  ['/', '/classes', '/students', '/grant', '/invites'],
  student:    ['/', '/album'],
}

export function AppShell() {
  const navigate = useNavigate()
  const {
    state: { session },
    dispatch,
    selectedClassId,
    state,
  } = useAppState()

  // Redirect to login if no session (handled by AuthGuard usually, but safe check)
  if (!session) return <Navigate to="/login" replace />

  const studentClassName =
    session.role === 'student'
      ? (() => {
          const student = state.data.students.find((item) => item.id === session.userId)
          const classId = student?.classId
          return classId ? state.data.classes.find((item) => item.id === classId)?.name : undefined
        })()
      : selectedClassId
        ? state.data.classes.find((item) => item.id === selectedClassId)?.name
        : undefined

  const visibleMenu = MENU.filter((item) => item.roles.includes(session.role))
  const bottomNavPaths = BOTTOM_NAV_ROLES[session.role]
  const bottomNavItems = bottomNavPaths
    .map((path) => MENU.find((m) => m.to === path)) // Use MENU directly to find item
    .filter(Boolean) as MenuItem[]

  const handleLogout = () => {
    dispatch({ type: 'logout' })
    navigate('/login', { replace: true })
  }

  const sessionCard = (
    <div className="side-card">
      <p className="eyebrow">Sessão</p>
      <p className="line-title" style={{ marginTop: 6 }}>{session.displayName}</p>
      <p className="muted">Perfil: {ROLE_LABELS[session.role]}</p>
      {studentClassName ? <p className="muted" style={{ marginTop: 4 }}>Classe: {studentClassName}</p> : null}
      <button
        onClick={handleLogout}
        className="mini-button"
        style={{ marginTop: '12px', width: '100%', justifyContent: 'center', borderColor: 'rgba(74,55,40,0.2)' }}
      >
        Sair
      </button>
    </div>
  )

  return (
    <div className="app-shell">
      {/* ── Sidebar (hidden on mobile via bottom-nav) ── */}
      <aside className="sidebar panel">
        <div className="brand">
          <div className="brand-mark">🏆</div>
          <div>
            <p className="eyebrow">Seminário</p>
            <h1>Conquistas</h1>
          </div>
        </div>

        <nav className="nav-list">
          {visibleMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon clay">{item.icon}</span>
              <span>
                <strong>{item.label}</strong>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="side-stack session-slot session-slot--sidebar">
          {sessionCard}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main">
        <Outlet />
      </main>

      {/* Session card placed below main on stacked layouts */}
      <aside className="session-panel panel session-slot session-slot--below">
        <div className="side-stack">{sessionCard}</div>
      </aside>

      {/* ── Bottom nav (mobile only, hidden on ≥760px via CSS) ── */}
      <nav className="bottom-nav" aria-label="Navegação principal">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `bottom-nav-btn ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
