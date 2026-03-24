import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toast } from './components/Toast'
import { AppShell } from './layout/AppShell'
import { AlbumPage } from './pages/AlbumPage'
import { AuditPage } from './pages/AuditPage'
import { CatalogPage } from './pages/CatalogPage'
import { ClassesPage } from './pages/ClassesPage'
import { DashboardPage } from './pages/DashboardPage'
import { GrantPage } from './pages/GrantPage'
import { InviteAcceptPage } from './pages/InviteAcceptPage'
import { InvitesPage } from './pages/InvitesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { StudentDetailPage } from './pages/StudentDetailPage'
import { StudentsPage } from './pages/StudentsPage'
import { useAppState } from './state/AppState'

function RoleGuard({
  children,
  allow,
}: {
  children: ReactElement
  allow: Array<'superadmin' | 'director' | 'professor' | 'student'>
}) {
  const {
    state: { session },
  } = useAppState()

  if (!allow.includes(session.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="classes" element={<RoleGuard allow={['superadmin', 'director', 'professor']}><ClassesPage /></RoleGuard>} />
          <Route path="students" element={<RoleGuard allow={['superadmin', 'director', 'professor']}><StudentsPage /></RoleGuard>} />
          <Route path="students/:studentId" element={<RoleGuard allow={['superadmin', 'director', 'professor']}><StudentDetailPage /></RoleGuard>} />
          <Route path="grant" element={<RoleGuard allow={['superadmin', 'director', 'professor']}><GrantPage /></RoleGuard>} />
          <Route path="invites" element={<RoleGuard allow={['superadmin', 'director', 'professor']}><InvitesPage /></RoleGuard>} />
          <Route path="album" element={<AlbumPage />} />
          <Route path="catalog" element={<RoleGuard allow={['superadmin', 'director']}><CatalogPage /></RoleGuard>} />
          <Route path="audit" element={<RoleGuard allow={['superadmin', 'director']}><AuditPage /></RoleGuard>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Toast />
    </>
  )
}

export default App
