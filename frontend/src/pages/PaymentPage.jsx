import { CheckCircle2, CreditCard, RefreshCw, ShieldCheck, Trophy } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { createMercadoPagoPreference, getRegistrationPaymentStatus } from '../api/payments'

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

export default function PaymentPage() {
  const { accessToken } = useParams()
  const [searchParams] = useSearchParams()
  const returnStatus = searchParams.get('status')
  const [payment, setPayment] = useState(null)
  const [storedPending, setStoredPending] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  async function loadStatus() {
    try {
      setLoading(true)
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
      setLoading(false)
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
              {payment.status === 'confirmed' ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-emerald-700">Inscripcion confirmada</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    Felicidades, ya estas inscrito a {payment.event_nombre}
                  </h2>
                  <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-center gap-3 text-slate-500">
                      <Trophy className="h-5 w-5 text-red-700" />
                      <span className="text-sm font-bold uppercase tracking-[0.14em]">Tu numero de corredor</span>
                    </div>
                    <p className="mt-2 text-6xl font-black tracking-tight text-slate-950">{formatRunnerNumber(payment.numero_competidor)}</p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-emerald-800">
                    {payment.confirmation_email_sent
                      ? 'Te enviamos un correo de confirmacion con este numero y el resumen de tu inscripcion.'
                      : 'Conserva esta pantalla como comprobante. Si no recibes correo, el equipo de SudorTime podra verificar tu registro con este numero.'}
                  </p>
                </div>
              ) : (
                <div className={`mt-6 rounded-xl border px-4 py-4 ${copy.tone}`}>
                  <p className="font-black">{copy.title}</p>
                  <p className="mt-1 text-sm leading-6">{copy.message}</p>
                </div>
              )}

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
                <p className="eyebrow">Resumen de inscripcion</p>
                <div className="mt-4 space-y-3 text-sm">
                  <SummaryLine label="Evento" value={payment.event_nombre} />
                  <SummaryLine label="Corredor" value={payment.participante_nombre} />
                  {payment.status === 'confirmed' && <SummaryLine label="Numero" value={formatRunnerNumber(payment.numero_competidor)} strong />}
                  <SummaryLine label="Modalidad" value={payment.modalidad_nombre} />
                  <SummaryLine label="Paquete" value={payment.producto_nombre || 'Sin paquete adicional'} />
                  <SummaryLine label="Categoria" value={payment.categoria_nombre || 'Por confirmar'} />
                  <SummaryLine label="Playera" value={payment.talla_playera || 'No incluida'} />
                </div>
              </div>

              {payment.status !== 'confirmed' && payment.status !== 'cancelled' && payment.status !== 'expired' && (
                <button type="button" onClick={handlePay} disabled={paying} className="btn-primary mt-6 w-full">
                  {paying ? 'Abriendo Mercado Pago...' : 'Pagar inscripción'}
                </button>
              )}

              {payment.status === 'pending_payment' && storedPending && (
                <Link to={`/evento/${payment.event_id}/inscripcion?token=${accessToken}`} className="btn-secondary mt-3 w-full">
                  Modificar preinscripcion
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

function SummaryLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  )
}
