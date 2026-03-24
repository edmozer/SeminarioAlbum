import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AchievementShareModal } from '../components/AchievementShareModal'
import { useAppState } from '../state/AppState'

export function AlbumPage() {
  const [params] = useSearchParams()
  const {
    state: { data, session },
    visibleStudents,
    visibleAchievements,
    setToast,
  } = useAppState()

  const [shareAchievementId, setShareAchievementId] = useState<string | null>(null)

  const allowedStudentIds =
    session.role === 'student'
      ? [session.userId]
      : session.role === 'professor'
        ? visibleStudents.map((item) => item.id)
        : data.students.map((item) => item.id)

  const requestedStudentId = params.get('studentId')
  const fallbackStudentId = allowedStudentIds[0] ?? null
  const studentId =
    session.role === 'student'
      ? session.userId
      : requestedStudentId && allowedStudentIds.includes(requestedStudentId)
        ? requestedStudentId
        : fallbackStudentId

  if (!studentId) {
    return (
      <section className="empty-state">
        <h3>Nenhum aluno disponível para álbum</h3>
      </section>
    )
  }

  const student = data.students.find((item) => item.id === studentId)

  const earnedMeta = useMemo(() => {
    const map = new Map<string, { grantedAt?: string }>()
    data.studentAchievements
      .filter((item) => item.studentId === studentId && item.status === 'granted')
      .forEach((item) => map.set(item.achievementId, { grantedAt: item.grantedAt }))
    return map
  }, [data.studentAchievements, studentId])

  if (!student) {
    return (
      <section className="empty-state">
        <h3>Aluno não encontrado para álbum</h3>
      </section>
    )
  }

  const earnedCount = visibleAchievements.filter((a) => earnedMeta.has(a.id)).length
  const progress = visibleAchievements.length > 0 ? Math.round((earnedCount / visibleAchievements.length) * 100) : 0

  const shareAchievement = shareAchievementId
    ? visibleAchievements.find((item) => item.id === shareAchievementId) ?? null
    : null

  return (
    <section className="screen-section">
      {/* Header */}
      <div className="screen-head">
        <div>
          <p className="eyebrow">Álbum de Conquistas</p>
          <h3>
            {student.firstName} {student.lastName}
          </h3>
        </div>
      </div>

      {/* Progress card */}
      <article className="kpi-card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {earnedCount} de {visibleAchievements.length} conquistadas
          </span>
          <span className="status-pill active">{progress}%</span>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
      </article>

      {/* Album grid */}
      <div className="album-grid">
        {visibleAchievements.map((achievement) => {
          const earned = earnedMeta.has(achievement.id)
          const clickable = session.role === 'student'

          const cardInner = (
            <>
              {/* Circle icon — conquista-app style */}
              <div className={`achievement-circle ${earned ? 'unlocked' : 'locked'}`}
                style={earned ? { borderColor: 'var(--orange)', color: 'var(--orange)', background: 'var(--orange-muted)' } : {}}>
                {earned ? achievement.icon : '🔒'}
              </div>

              <div style={{ display: 'grid', gap: 2, width: '100%' }}>
                <p className="sticker-title">{achievement.title}</p>
                <p className="muted" style={{ fontSize: '0.76rem' }}>{achievement.collection}</p>
              </div>

              <span className={`status-pill ${earned ? 'active' : 'pending'}`}>
                {earned ? 'Conquistado ✓' : 'Bloqueado'}
              </span>
            </>
          )

          if (clickable) {
            return (
              <button
                key={achievement.id}
                type="button"
                className={`sticker sticker-clickable ${earned ? '' : 'locked'}`}
                onClick={() => {
                  if (!earned) { setToast('Conquiste primeiro para gerar o story.'); return }
                  setShareAchievementId(achievement.id)
                }}
                aria-label={earned ? `Compartilhar ${achievement.title}` : `${achievement.title} bloqueado`}
              >
                {cardInner}
              </button>
            )
          }

          return (
            <article key={achievement.id} className={`sticker ${earned ? '' : 'locked'}`}>
              {cardInner}
            </article>
          )
        })}
      </div>

      {shareAchievement && (
        <AchievementShareModal
          open={Boolean(shareAchievement)}
          student={student}
          achievement={shareAchievement}
          grantedAt={earnedMeta.get(shareAchievement.id)?.grantedAt}
          onClose={() => setShareAchievementId(null)}
          setToast={setToast}
        />
      )}
    </section>
  )
}
