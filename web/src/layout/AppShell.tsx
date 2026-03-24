import { NavLink, Outlet } from 'react-router-dom'
import { sessions } from '../domain/seed'
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
  { to: '/students',label: 'Alunos',     icon: '👥', roles: ['superadmin', 'director', 'professor'] },
  { to: '/grant',   label: 'Conceder',   icon: '🏅', roles: ['superadmin', 'director', 'professor'] },
  { to: '/invites', label: 'Convites',   icon: '✉️',  roles: ['superadmin', 'director', 'professor'] },
  { to: '/album',   label: 'Álbum',      icon: '🎖️', roles: ['superadmin', 'director', 'professor', 'student'] },
  { to: '/catalog', label: 'Catálogo',   icon: '🗂️', roles: ['superadmin', 'director'] },
  { to: '/audit',   label: 'Auditoria',  icon: '📋', roles: ['superadmin', 'director'] },
]

// Items shown in the mobile bottom nav (most important, max 5)
const BOTTOM_NAV_ROLES: Record<Role, MenuItem['to'][]> = {
  superadmin: ['/', '/students', '/grant', '/invites', '/audit'],
  director:   ['/', '/students', '/invites', '/album', '/catalog'],
  professor:  ['/', '/students', '/grant', '/invites', '/album'],
  student:    ['/', '/album'],
}

export function AppShell() {
  const {
    state: { session },
    dispatch,
    selectedClassId,
    state,
  } = useAppState()

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
    .map((path) => visibleMenu.find((m) => m.to === path))
    .filter(Boolean) as MenuItem[]

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

        <div className="side-stack">
          <div className="side-card">
            <p className="eyebrow">Sessão</p>
            <p className="line-title" style={{ marginTop: 6 }}>{session.displayName}</p>
            <p className="muted">Perfil: {ROLE_LABELS[session.role]}</p>
            {studentClassName ? <p className="muted" style={{ marginTop: 4 }}>Classe: {studentClassName}</p> : null}
          </div>

          {session.role !== 'student' && (
            <div className="role-switcher">
              {(Object.keys(sessions) as Role[]).map((role) => (
                <button
                  key={role}
                  className={`role-button ${session.role === role ? 'active' : ''}`}
                  onClick={() => dispatch({ type: 'switch-role', payload: role })}
                  type="button"
                >
                  <strong>{ROLE_LABELS[role]}</strong>
                  <span>{sessions[role].displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main">
        <Outlet />
      </main>

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
