import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Dumbbell,
  Mail,
  RefreshCw,
  Share2,
  ShieldCheck,
  Trophy,
} from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getApiAssetUrl } from '../api/client'
import { createMercadoPagoPreference, getRegistrationPaymentStatus } from '../api/payments'

const BIB_IMAGE_WIDTH = 1080
const BIB_IMAGE_HEIGHT = 1350

function formatMoney(value, currency = 'MXN') {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency,
  })
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha límite'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatRunnerNumber(value) {
  if (!value) return 'Por asignar'
  return String(value).padStart(3, '0')
}

function getFirstName(value) {
  return String(value || '').trim().split(/\s+/)[0] || 'corredor'
}

function sanitizeFilename(value) {
  return String(value || 'dorsal')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

const statusCopy = {
  confirmed: {
    title: 'Inscripción confirmada',
    message: 'Tu pago fue confirmado. Ya estás inscrito oficialmente.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  pending_payment: {
    title: 'Pago pendiente',
    message: 'Tu preinscripción está guardada. Completa el pago para confirmar tu lugar.',
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  cancelled: {
    title: 'Inscripción cancelada',
    message: 'Esta inscripción ya no está disponible para pago.',
    tone: 'border-red-200 bg-red-50 text-red-700',
  },
  expired: {
    title: 'Preinscripción expirada',
    message: 'El tiempo para completar el pago terminó. Inicia una nueva inscripción si deseas participar.',
    tone: 'border-slate-200 bg-slate-100 text-slate-700',
  },
}

function getStoredPendingRegistration(accessToken) {
  try {
    const stored = JSON.parse(localStorage.getItem('sudortime_pending_registration') || 'null')
    if (!stored || stored.access_token !== accessToken) return null
    return stored
  } catch {
    return null
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function drawContainImage(ctx, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
}

function drawCenteredText(ctx, text, x, y, maxWidth) {
  ctx.fillText(text, x, y, maxWidth)
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || '').split(/\s+/)
  const lines = []
  let line = ''

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = testLine
    }
  })

  if (line) lines.push(line)
  lines.slice(0, maxLines).forEach((item, index) => {
    const value = index === maxLines - 1 && lines.length > maxLines ? `${item}...` : item
    ctx.fillText(value, x, y + index * lineHeight, maxWidth)
  })
}

function drawDefaultBib(ctx, payment, x, y, width, height) {
  ctx.save()
  drawRoundRect(ctx, x, y, width, height, 54)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 6
  ctx.setLineDash([20, 18])
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(x + 70, y + 70, 20, 0, Math.PI * 2)
  ctx.arc(x + width - 70, y + 70, 20, 0, Math.PI * 2)
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#6A1A24'
  ctx.font = '900 40px Inter, Arial, sans-serif'
  drawCenteredText(ctx, 'SUDORTIME', x + width / 2, y + 105, width - 180)

  ctx.fillStyle = '#64748b'
  ctx.font = '800 28px Inter, Arial, sans-serif'
  drawWrappedText(ctx, payment.event_nombre, x + width / 2, y + 154, width - 160, 34, 2)

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x + 70, y + 225)
  ctx.lineTo(x + width - 70, y + 225)
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = '900 26px Inter, Arial, sans-serif'
  drawCenteredText(ctx, 'NÚMERO DE CORREDOR', x + width / 2, y + 290, width - 120)

  ctx.fillStyle = '#020617'
  ctx.font = '900 190px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  drawCenteredText(ctx, formatRunnerNumber(payment.numero_competidor), x + width / 2, y + 470, width - 120)

  if (payment.dorsal_personalizado_texto) {
    ctx.fillStyle = '#6A1A24'
    ctx.font = '900 34px Inter, Arial, sans-serif'
    drawCenteredText(ctx, payment.dorsal_personalizado_texto, x + width / 2, y + 518, width - 120)
  }

  ctx.fillStyle = '#0f172a'
  ctx.font = '900 42px Inter, Arial, sans-serif'
  drawCenteredText(ctx, payment.participante_nombre, x + width / 2, y + 560, width - 120)

  ctx.fillStyle = '#047857'
  ctx.font = '900 30px Inter, Arial, sans-serif'
  drawCenteredText(ctx, payment.modalidad_nombre, x + width / 2, y + 620, width - 120)
  ctx.restore()
}

function drawBibImage(ctx, payment, templateImage) {
  const gradient = ctx.createLinearGradient(0, 0, BIB_IMAGE_WIDTH, BIB_IMAGE_HEIGHT)
  gradient.addColorStop(0, '#0f8f73')
  gradient.addColorStop(0.5, '#097ca5')
  gradient.addColorStop(1, '#172033')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, BIB_IMAGE_WIDTH, BIB_IMAGE_HEIGHT)

  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ;[
    [120, 110, 10],
    [900, 160, 12],
    [210, 1120, 8],
    [780, 1060, 11],
    [960, 940, 7],
  ].forEach(([x, y, radius]) => {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 42px Inter, Arial, sans-serif'
  drawCenteredText(ctx, 'INSCRIPCIÓN CONFIRMADA', BIB_IMAGE_WIDTH / 2, 135, 900)

  ctx.font = '900 72px Inter, Arial, sans-serif'
  drawCenteredText(ctx, `¡Todo listo, ${getFirstName(payment.participante_nombre)}!`, BIB_IMAGE_WIDTH / 2, 230, 920)

  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = '700 34px Inter, Arial, sans-serif'
  drawWrappedText(ctx, `Ya tienes tu lugar asegurado en ${payment.event_nombre}.`, BIB_IMAGE_WIDTH / 2, 292, 840, 44, 2)

  const bibX = 90
  const bibY = 410
  const bibWidth = 900
  const bibHeight = 620

  if (templateImage) {
    ctx.save()
    drawRoundRect(ctx, bibX, bibY, bibWidth, bibHeight, 54)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.clip()
    drawContainImage(ctx, templateImage, bibX + 24, bibY + 24, bibWidth - 48, bibHeight - 48)
    ctx.restore()

    ctx.textAlign = 'center'
    ctx.fillStyle = '#020617'
    ctx.shadowColor = 'rgba(255,255,255,0.9)'
    ctx.shadowBlur = 18
    ctx.font = '900 180px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    drawCenteredText(ctx, formatRunnerNumber(payment.numero_competidor), BIB_IMAGE_WIDTH / 2, bibY + 360, 760)
    ctx.shadowBlur = 0

    if (payment.dorsal_personalizado_texto) {
      ctx.fillStyle = '#6A1A24'
      ctx.font = '900 32px Inter, Arial, sans-serif'
      drawCenteredText(ctx, payment.dorsal_personalizado_texto, BIB_IMAGE_WIDTH / 2, bibY + 418, 760)
    }

    ctx.fillStyle = '#0f172a'
    ctx.font = '900 38px Inter, Arial, sans-serif'
    drawCenteredText(ctx, payment.participante_nombre, BIB_IMAGE_WIDTH / 2, bibY + 505, 760)
    ctx.font = '900 28px Inter, Arial, sans-serif'
    drawCenteredText(ctx, payment.modalidad_nombre, BIB_IMAGE_WIDTH / 2, bibY + 555, 760)
  } else {
    drawDefaultBib(ctx, payment, bibX, bibY, bibWidth, bibHeight)
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px Inter, Arial, sans-serif'
  drawCenteredText(ctx, 'Nos vemos en la línea de salida.', BIB_IMAGE_WIDTH / 2, 1155, 900)
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  ctx.font = '700 28px Inter, Arial, sans-serif'
  drawCenteredText(ctx, 'SudorTime', BIB_IMAGE_WIDTH / 2, 1210, 900)
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('No se pudo generar la imagen del dorsal'))
    }, 'image/png')
  })
}

async function createBibImageBlob(payment) {
  const canvas = document.createElement('canvas')
  canvas.width = BIB_IMAGE_WIDTH
  canvas.height = BIB_IMAGE_HEIGHT
  const ctx = canvas.getContext('2d')
  const templateUrl = payment.event_imagen_dorsal ? getApiAssetUrl(payment.event_imagen_dorsal) : ''
  let templateImage = null

  if (templateUrl) {
    try {
      templateImage = await loadImage(templateUrl)
    } catch {
      templateImage = null
    }
  }

  drawBibImage(ctx, payment, templateImage)

  try {
    return await canvasToBlob(canvas)
  } catch (err) {
    if (!templateImage) throw err
    const fallbackCanvas = document.createElement('canvas')
    fallbackCanvas.width = BIB_IMAGE_WIDTH
    fallbackCanvas.height = BIB_IMAGE_HEIGHT
    drawBibImage(fallbackCanvas.getContext('2d'), payment, null)
    return canvasToBlob(fallbackCanvas)
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function PaymentPage() {
  const { accessToken } = useParams()
  const [searchParams] = useSearchParams()
  const returnStatus = searchParams.get('status')
  const [payment, setPayment] = useState(null)
  const [storedPending, setStoredPending] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [imageAction, setImageAction] = useState('')
  const [error, setError] = useState('')
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  useEffect(() => {
    if (!returnStatus || !payment || ['confirmed', 'cancelled', 'expired'].includes(payment.status)) {
      return undefined
    }

    let attempts = 0
    const interval = window.setInterval(() => {
      attempts += 1
      loadStatus({ silent: true })
      if (attempts >= 18) {
        window.clearInterval(interval)
      }
    }, 5000)

    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnStatus, payment?.status])

  async function loadStatus({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true)
      setError('')
      const data = await getRegistrationPaymentStatus(accessToken)
      setPayment(data)
      const stored = getStoredPendingRegistration(accessToken)
      setStoredPending(stored)
      if (stored && ['confirmed', 'cancelled', 'expired'].includes(data.status)) {
        localStorage.removeItem('sudortime_pending_registration')
        setStoredPending(null)
      }
    } catch (err) {
      setError(err.message || 'No se pudo consultar el estado de pago')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function handlePay() {
    try {
      setPaying(true)
      setError('')
      const preference = await createMercadoPagoPreference(accessToken)
      window.location.href = preference.checkout_url
    } catch (err) {
      setError(err.message || 'No se pudo iniciar el pago')
      setPaying(false)
    }
  }

  function getBibFilename() {
    return `dorsal-${formatRunnerNumber(payment.numero_competidor)}-${sanitizeFilename(payment.event_nombre)}.png`
  }

  async function handleDownloadImage() {
    if (!payment) return

    try {
      setImageAction('download')
      setShareMessage('')
      const blob = await createBibImageBlob(payment)
      downloadBlob(blob, getBibFilename())
      setShareMessage('Imagen descargada.')
    } catch (err) {
      setError(err.message || 'No se pudo descargar la imagen del dorsal')
    } finally {
      setImageAction('')
    }
  }

  async function handleShareImage() {
    if (!payment) return

    const runnerNumber = formatRunnerNumber(payment.numero_competidor)
    const title = `Dorsal ${runnerNumber} | SudorTime`
    const text = `¡Ya tengo mi dorsal ${runnerNumber} para ${payment.event_nombre}! Nos vemos en la línea de salida.`

    try {
      setImageAction('share')
      setShareMessage('')
      const blob = await createBibImageBlob(payment)
      const file = new File([blob], getBibFilename(), { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] })
        setShareMessage('Imagen lista para compartir.')
        return
      }

      if (navigator.share) {
        await navigator.share({ title, text })
        setShareMessage('Se compartió el texto. También descargamos la imagen para que puedas publicarla.')
      } else {
        setShareMessage('Tu navegador no permite compartir directo. Descargamos la imagen.')
      }
      downloadBlob(blob, getBibFilename())
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'No se pudo compartir la imagen del dorsal')
      }
    } finally {
      setImageAction('')
    }
  }

  const copy = useMemo(() => statusCopy[payment?.status] || statusCopy.pending_payment, [payment?.status])

  const returnMessage = useMemo(() => {
    if (returnStatus === 'success') return 'Mercado Pago recibió tu operación. La confirmación final puede tardar unos segundos.'
    if (returnStatus === 'pending') return 'Tu pago quedó pendiente. Se confirmará cuando Mercado Pago nos avise.'
    if (returnStatus === 'failure') return 'El pago no se completó. Puedes intentarlo de nuevo con otra opción.'
    return ''
  }, [returnStatus])

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-container py-16">
          <p className="text-slate-500">Cargando pago...</p>
        </div>
      </div>
    )
  }

  if (payment?.status === 'confirmed') {
    return (
      <div className="page-shell overflow-hidden bg-[#f2fbf7]">
        <main className="page-container py-4 sm:py-8">
          <section className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f8f73] via-[#097ca5] to-[#172033] px-4 py-5 text-white shadow-[0_22px_60px_rgba(15,32,51,0.22)] sm:px-8 sm:py-8">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 12% 18%, #ffffff 0 3px, transparent 4px), radial-gradient(circle at 82% 22%, #d7ff80 0 3px, transparent 4px), radial-gradient(circle at 28% 78%, #ffffff 0 2px, transparent 3px), radial-gradient(circle at 70% 72%, #ffec99 0 3px, transparent 4px), repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,.16) 18px 20px, transparent 20px 38px)',
              }}
            />

            <div className="relative">
              <Link to="/" className="inline-flex text-sm font-black text-white/80 transition hover:text-white">
                SudorTime
              </Link>

              <div className="mt-5 text-center">
                <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-white text-emerald-700 shadow-lg shadow-black/20">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-emerald-100">Inscripción confirmada</p>
                <h1 className="mx-auto mt-2 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                  ¡Todo listo, {getFirstName(payment.participante_nombre)}! Cruza la meta.
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-white/88 sm:text-base">
                  Ya tienes tu lugar asegurado en {payment.event_nombre}.
                </p>
              </div>

              <DigitalBib payment={payment} />

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleShareImage}
                  disabled={Boolean(imageAction)}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-black/15 transition hover:-translate-y-0.5 disabled:opacity-70"
                >
                  <Share2 className="mr-2 h-5 w-5 text-[#6A1A24]" />
                  {imageAction === 'share' ? 'Preparando...' : 'Compartir foto'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={Boolean(imageAction)}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18 disabled:opacity-70"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {imageAction === 'download' ? 'Generando...' : 'Descargar imagen'}
                </button>
                <Link
                  to={`/evento/${payment.event_id}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
                >
                  Ver evento
                </Link>
              </div>
              {shareMessage && <p className="mt-3 text-center text-sm font-semibold text-white/80">{shareMessage}</p>}
            </div>
          </section>

          <section className="mx-auto mt-4 grid w-full max-w-4xl gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="eyebrow">Datos de tu registro</p>
              <div className="mt-4 grid gap-3">
                <BoardingPassLine label="Evento" value={payment.event_nombre} />
                <BoardingPassLine label="Categoría" value={payment.categoria_nombre || 'Por confirmar'} />
                <BoardingPassLine label="Modalidad" value={payment.modalidad_nombre} />
                <BoardingPassLine label="Playera" value={payment.talla_playera || 'No incluida'} />
                <BoardingPassLine label="Paquete" value={payment.producto_nombre || 'Sin paquete adicional'} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="eyebrow">Próximos pasos</p>
              <div className="mt-4 space-y-4">
                <NextStep
                  icon={Mail}
                  title="Revisa tu correo"
                  text="Te enviamos el comprobante oficial y el resumen de tu registro."
                />
                <NextStep
                  icon={CalendarDays}
                  title="Entrega de kits"
                  text="Mantente atento a las fechas y el lugar para recoger tu playera y chip físico."
                />
                <NextStep
                  icon={Dumbbell}
                  title="¡A entrenar!"
                  text="Nos vemos en la línea de salida."
                />
              </div>
            </div>
          </section>

          {error && <p className="notice-error mx-auto mt-5 max-w-4xl">{error}</p>}
        </main>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <main className="page-container flex min-h-screen items-center justify-center py-8">
        <section className="panel panel-pad w-full max-w-2xl">
          <Link to="/" className="text-sm font-bold text-slate-500 transition hover:text-slate-950">
            SudorTime
          </Link>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="eyebrow">Pago de inscripción</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Confirma tu lugar</h1>
            </div>
          </div>

          {returnMessage && <p className="notice-warning mt-6">{returnMessage}</p>}

          {payment && (
            <>
              <div className={`mt-6 rounded-xl border px-4 py-4 ${copy.tone}`}>
                <p className="font-black">{copy.title}</p>
                <p className="mt-1 text-sm leading-6">{copy.message}</p>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-semibold text-slate-500">Total a pagar</span>
                  <span className="text-3xl font-black text-slate-950">{formatMoney(payment.amount, payment.currency)}</span>
                </div>
                <div className="mt-4 flex gap-3 text-sm leading-6 text-slate-600">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                  <p>Mercado Pago mostrará las opciones disponibles, como tarjeta, transferencia o efectivo en tiendas participantes.</p>
                </div>
                {payment.status === 'pending_payment' && (
                  <p className="mt-4 text-sm font-bold text-slate-700">
                    Fecha límite: {formatDateTime(payment.expires_at)}
                  </p>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="eyebrow">Resumen de inscripción</p>
                <div className="mt-4 space-y-3 text-sm">
                  <SummaryLine label="Evento" value={payment.event_nombre} />
                  <SummaryLine label="Corredor" value={payment.participante_nombre} />
                  <SummaryLine label="Modalidad" value={payment.modalidad_nombre} />
                  <SummaryLine label="Paquete" value={payment.producto_nombre || 'Sin paquete adicional'} />
                  <SummaryLine label="Categoría" value={payment.categoria_nombre || 'Por confirmar'} />
                  <SummaryLine label="Playera" value={payment.talla_playera || 'No incluida'} />
                  <SummaryLine
                    label="Dorsal personalizado"
                    value={payment.dorsal_personalizado_texto
                      ? `${payment.dorsal_personalizado_texto}${payment.dorsal_personalizado_costo > 0 ? ` · ${formatMoney(payment.dorsal_personalizado_costo)}` : ' · incluido'}`
                      : 'Sin personalizar'}
                  />
                </div>
              </div>

              {payment.status !== 'cancelled' && payment.status !== 'expired' && (
                <button type="button" onClick={handlePay} disabled={paying} className="btn-primary mt-6 w-full">
                  {paying ? 'Abriendo Mercado Pago...' : 'Pagar inscripción'}
                </button>
              )}

              {payment.status === 'pending_payment' && storedPending && (
                <Link to={`/evento/${payment.event_id}/inscripcion?token=${accessToken}`} className="btn-secondary mt-3 w-full">
                  Modificar preinscripción
                </Link>
              )}

              <button type="button" onClick={loadStatus} className="btn-secondary mt-3 w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar estado
              </button>
            </>
          )}

          {error && <p className="notice-error mt-5">{error}</p>}
        </section>
      </main>
    </div>
  )
}

function DigitalBib({ payment }) {
  const bibImageSrc = payment.event_imagen_dorsal ? getApiAssetUrl(payment.event_imagen_dorsal) : ''

  return (
    <div className="relative mx-auto mt-6 max-w-xl rounded-[1.75rem] bg-white p-4 text-slate-950 shadow-[0_24px_60px_rgba(15,23,42,0.28)] sm:p-6">
      <span className="absolute left-6 top-6 z-10 h-4 w-4 rounded-full bg-slate-950 shadow-inner sm:left-8 sm:top-8" />
      <span className="absolute right-6 top-6 z-10 h-4 w-4 rounded-full bg-slate-950 shadow-inner sm:right-8 sm:top-8" />

      <div className="relative min-h-[360px] overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 px-4 py-5 text-center sm:px-8 sm:py-6">
        {bibImageSrc ? (
          <img src={bibImageSrc} alt="Base de dorsal del evento" className="absolute inset-0 h-full w-full object-contain p-4" />
        ) : null}

        <div className={`relative ${bibImageSrc ? 'flex min-h-[310px] flex-col justify-end rounded-2xl bg-white/72 p-4 backdrop-blur-[1px]' : ''}`}>
          {!bibImageSrc && (
            <>
              <div className="flex items-center justify-center gap-2 text-[#6A1A24]">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-black uppercase tracking-[0.24em]">SudorTime</span>
              </div>
              <p className="mx-auto mt-2 max-w-xs text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                {payment.event_nombre}
              </p>
            </>
          )}

          <div className="my-5 border-y border-slate-100/80 py-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Número de corredor</p>
            <p className="mt-1 font-mono text-7xl font-black leading-none tracking-tight text-slate-950 sm:text-8xl">
              {formatRunnerNumber(payment.numero_competidor)}
            </p>
            {payment.dorsal_personalizado_texto && (
              <p className="mt-3 text-xl font-black uppercase tracking-wide text-[#6A1A24]">
                {payment.dorsal_personalizado_texto}
              </p>
            )}
          </div>

          <p className="text-lg font-black leading-tight text-slate-950">{payment.participante_nombre}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
              {payment.modalidad_nombre}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
              {payment.categoria_nombre || 'Categoría por confirmar'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BoardingPassLine({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black leading-5 text-slate-950">{value}</p>
    </div>
  )
}

function NextStep({ icon, title, text }) {
  const StepIcon = icon

  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6A1A24]/8 text-[#6A1A24]">
        <StepIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  )
}

function SummaryLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  )
}
