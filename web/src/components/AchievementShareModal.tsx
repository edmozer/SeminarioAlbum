import { useEffect, useMemo, useRef, useState } from 'react'
import type { Achievement, Student } from '../domain/types'

const STORY_WIDTH = 1080
const STORY_HEIGHT = 1920

const COLOR_MAP: Record<Achievement['color'], string> = {
  clay: '#c8643f',
  gold: '#cd9f37',
  teal: '#2c7a69',
  olive: '#71893c',
  navy: '#2e4c66',
  rose: '#b85d67',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function mixHex(a: string, b: string, amount: number) {
  const t = clamp(amount, 0, 1)
  const ax = Number.parseInt(a.slice(1), 16)
  const bx = Number.parseInt(b.slice(1), 16)
  const ar = (ax >> 16) & 255
  const ag = (ax >> 8) & 255
  const ab = ax & 255
  const br = (bx >> 16) & 255
  const bg = (bx >> 8) & 255
  const bb = bx & 255
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function formatStoryDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Nao foi possivel gerar a imagem.'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

function safeFileSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

function drawStory(
  canvas: HTMLCanvasElement,
  payload: {
    student: Student
    achievement: Achievement
    grantedAt?: string
    photo?: HTMLImageElement | null
  },
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = STORY_WIDTH
  canvas.height = STORY_HEIGHT

  const accent = COLOR_MAP[payload.achievement.color]
  const cream = '#fff7ea'
  const ink = '#223228'
  const muted = '#6b746d'

  const bgGrad = ctx.createLinearGradient(0, 0, STORY_WIDTH, STORY_HEIGHT)
  bgGrad.addColorStop(0, mixHex('#efe5d4', accent, 0.12))
  bgGrad.addColorStop(0.52, mixHex('#f7efdf', accent, 0.18))
  bgGrad.addColorStop(1, mixHex('#e5d4b2', accent, 0.2))
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)

  const spotlight = ctx.createRadialGradient(STORY_WIDTH * 0.2, STORY_HEIGHT * 0.18, 10, STORY_WIDTH * 0.2, STORY_HEIGHT * 0.18, 780)
  spotlight.addColorStop(0, 'rgba(255, 255, 255, 0.65)')
  spotlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = spotlight
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)

  ctx.save()
  ctx.globalAlpha = 0.24
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.arc(STORY_WIDTH + 110, 220, 340, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const frameX = 84
  const frameY = 110
  const frameW = STORY_WIDTH - frameX * 2
  const frameH = STORY_HEIGHT - frameY * 2

  ctx.save()
  ctx.globalAlpha = 0.92
  ctx.fillStyle = cream
  roundedRectPath(ctx, frameX, frameY, frameW, frameH, 64)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(34, 50, 40, 0.08)'
  roundedRectPath(ctx, frameX, frameY, frameW, frameH, 64)
  ctx.stroke()
  ctx.restore()

  const headerX = frameX + 64
  const headerY = frameY + 78

  ctx.fillStyle = muted
  ctx.font = '700 30px "Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText('ALBUM DE CONQUISTAS', headerX, headerY)

  ctx.fillStyle = ink
  ctx.font = '700 74px "Fraunces", Georgia, serif'
  ctx.fillText(payload.achievement.title.slice(0, 28), headerX, headerY + 86)

  ctx.fillStyle = muted
  ctx.font = '600 34px "Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, sans-serif'
  const subtitle = `${payload.student.firstName} ${payload.student.lastName}  •  ${payload.achievement.collection}`
  ctx.fillText(subtitle, headerX, headerY + 140)

  const photoX = frameX + 64
  const photoY = frameY + 340
  const photoW = frameW - 128
  const photoH = 980

  ctx.save()
  roundedRectPath(ctx, photoX, photoY, photoW, photoH, 54)
  ctx.clip()
  const photoBg = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH)
  photoBg.addColorStop(0, mixHex('#ffffff', accent, 0.08))
  photoBg.addColorStop(1, mixHex('#ffffff', accent, 0.16))
  ctx.fillStyle = photoBg
  ctx.fillRect(photoX, photoY, photoW, photoH)

  if (payload.photo) {
    const image = payload.photo
    const scale = Math.max(photoW / image.naturalWidth, photoH / image.naturalHeight)
    const drawW = image.naturalWidth * scale
    const drawH = image.naturalHeight * scale
    const drawX = photoX + (photoW - drawW) / 2
    const drawY = photoY + (photoH - drawH) / 2
    ctx.drawImage(image, drawX, drawY, drawW, drawH)

    const fade = ctx.createLinearGradient(0, photoY, 0, photoY + photoH)
    fade.addColorStop(0, 'rgba(0, 0, 0, 0)')
    fade.addColorStop(1, 'rgba(0, 0, 0, 0.10)')
    ctx.fillStyle = fade
    ctx.fillRect(photoX, photoY, photoW, photoH)
  }

  ctx.restore()

  ctx.save()
  ctx.setLineDash([18, 14])
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(34, 50, 40, 0.16)'
  roundedRectPath(ctx, photoX, photoY, photoW, photoH, 54)
  ctx.stroke()
  ctx.restore()

  if (!payload.photo) {
    ctx.fillStyle = 'rgba(34, 50, 40, 0.52)'
    ctx.font = '700 44px "Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('FOTO AQUI (em breve)', photoX + photoW / 2, photoY + photoH / 2)
    ctx.textAlign = 'left'
  }

  const badgeR = 92
  const badgeCX = frameX + 132
  const badgeCY = frameY + frameH - 220
  const badgeGrad = ctx.createLinearGradient(badgeCX - badgeR, badgeCY - badgeR, badgeCX + badgeR, badgeCY + badgeR)
  badgeGrad.addColorStop(0, accent)
  badgeGrad.addColorStop(1, mixHex(accent, '#ffffff', 0.28))
  ctx.fillStyle = badgeGrad
  ctx.beginPath()
  ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 84px "Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(payload.achievement.icon, badgeCX, badgeCY + 28)
  ctx.textAlign = 'left'

  const footerX = frameX + 260
  const footerY = frameY + frameH - 270
  ctx.fillStyle = ink
  ctx.font = '700 44px "Fraunces", Georgia, serif'
  ctx.fillText(payload.achievement.category, footerX, footerY)

  ctx.fillStyle = muted
  ctx.font = '600 34px "Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, sans-serif'
  const dateText = formatStoryDate(payload.grantedAt)
  ctx.fillText(dateText ? `Conquistado em ${dateText}` : 'Conquista desbloqueada', footerX, footerY + 54)

  ctx.save()
  ctx.globalAlpha = 0.24
  ctx.fillStyle = ink
  ctx.font = '700 26px "Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('ALBUM', frameX + frameW - 64, frameY + frameH - 64)
  ctx.restore()
  ctx.textAlign = 'left'
}

async function loadImage(url: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Falha ao carregar imagem do achievement.'))
    img.src = url
  })
}

async function drawStoryAsync(
  canvas: HTMLCanvasElement,
  payload: {
    student: Student
    achievement: Achievement
    grantedAt?: string
  },
) {
  let photo: HTMLImageElement | null = null

  if (payload.achievement.imageUrl) {
    try {
      photo = await loadImage(payload.achievement.imageUrl)
    } catch {
      photo = null
    }
  }

  drawStory(canvas, { ...payload, photo })
}

export function AchievementShareModal({
  open,
  student,
  achievement,
  grantedAt,
  onClose,
  setToast,
}: {
  open: boolean
  student: Student
  achievement: Achievement
  grantedAt?: string
  onClose: () => void
  setToast: (message: string | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [busy, setBusy] = useState(false)

  const fileName = useMemo(() => {
    const who = safeFileSlug(`${student.firstName}-${student.lastName}`)
    const what = safeFileSlug(achievement.title)
    return `conquista-${what}-${who}.png`
  }, [achievement.title, student.firstName, student.lastName])

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    ;(async () => {
      await drawStoryAsync(canvas, { student, achievement, grantedAt })
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [open, student, achievement, grantedAt])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const download = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setBusy(true)
    try {
      const blob = await canvasToPngBlob(canvas)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      setToast('Imagem pronta para salvar/compartilhar.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Falha ao gerar imagem.')
    } finally {
      setBusy(false)
    }
  }

  const shareSheet = async (targetLabel: 'Instagram' | 'WhatsApp' | 'Compartilhar') => {
    const canvas = canvasRef.current
    if (!canvas) return
    setBusy(true)
    try {
      const blob = await canvasToPngBlob(canvas)
      const file = new File([blob], fileName, { type: 'image/png' })
      const title = `Conquista: ${achievement.title}`
      const text = `Minha conquista: ${achievement.title}`

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title, text })
        if (targetLabel === 'Instagram') {
          setToast('No compartilhamento, escolha Instagram e publique nos Stories.')
        } else if (targetLabel === 'WhatsApp') {
          setToast('No compartilhamento, escolha WhatsApp e publique no Status.')
        } else {
          setToast('Compartilhamento aberto.')
        }
        return
      }

      if (navigator.clipboard && 'write' in navigator.clipboard && 'ClipboardItem' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ClipboardItemCtor = (window as any).ClipboardItem as typeof ClipboardItem
        await navigator.clipboard.write([new ClipboardItemCtor({ 'image/png': blob })])
        setToast('Imagem copiada. Cole no Instagram/WhatsApp.')
        return
      }

      await download()
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Falha ao compartilhar.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const dateStr = formatStoryDate(grantedAt)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Compartilhar conquista">
      <div className="modal-scrim" onClick={onClose} />
      <section className="modal-panel">
        {/* Header */}
        <header className="modal-head">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Story
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            Fechar
          </button>
        </header>

        {/* Inner white card */}
        <div className="modal-inner-card">
          {/* Achievement info */}
          <div>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700, color: 'var(--muted)' }}>
              Álbum de Conquistas
            </p>
            <h3 className="detail-title" style={{ marginTop: 4, fontSize: '1.6rem' }}>{achievement.title}</h3>
            <p className="muted">{student.firstName} {student.lastName} · {achievement.collection}</p>
            {dateStr && <p className="muted">Conquistado em {dateStr}</p>}
          </div>

          {/* Canvas preview */}
          <div className="story-preview" aria-label="Preview do story">
            <div className="story-frame">
              <canvas ref={canvasRef} className="story-canvas" width={STORY_WIDTH} height={STORY_HEIGHT} />
            </div>
          </div>

          {/* Footer badge row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--orange)',
              display: 'grid', placeItems: 'center',
              color: 'white', fontWeight: 700, fontSize: '1rem',
              flexShrink: 0,
            }}>
              {achievement.icon}
            </div>
            <div>
              <p className="line-title" style={{ fontSize: '0.9rem' }}>{achievement.category}</p>
              {dateStr && <p className="muted">Conquistado em {dateStr}</p>}
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div className="modal-actions">
          <button type="button" className="btn-instagram" onClick={() => shareSheet('Instagram')} disabled={busy}>
            📸 Instagram Story
          </button>
          <button type="button" className="btn-whatsapp" onClick={() => shareSheet('WhatsApp')} disabled={busy}>
            💬 WhatsApp Status
          </button>
        </div>
        <div className="modal-actions" style={{ marginTop: 8 }}>
          <button type="button" className="btn-download" onClick={() => shareSheet('Compartilhar')} disabled={busy}>
            Compartilhar
          </button>
          <button type="button" className="btn-download" onClick={download} disabled={busy}>
            Baixar PNG
          </button>
        </div>

        <p className="modal-footnote">
          Dica: use Compartilhar para enviar direto para Stories/Status. A foto real do achievement será adicionada em breve.
        </p>
      </section>
    </div>
  )
}
