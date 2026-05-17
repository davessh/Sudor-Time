import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { createMercadoPagoPreference, getRegistrationPaymentStatus } from '../api/payments'

function formatMoney(value, currency = 'MXN') {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency,
  })
}

const statusCopy = {
  confirmed: {
    title: 'Inscripción confirmada',
    message: 'Tu pago fue confirmado. Ya estás inscrito oficialmente.',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  pending_payment: {
    title: 'Pago pendiente',
    message: 'Tu preinscripción está guardada. Completa el pago para confirmar tu lugar.',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  cancelled: {
    title: 'Inscripción cancelada',
    message: 'Esta inscripción ya no está disponible para pago.',
    tone: 'bg-red-50 text-red-700 border-red-200',
  },
  expired: {
    title: 'Preinscripción expirada',
    message: 'El tiempo para completar el pago terminó. Inicia una nueva inscripción si deseas participar.',
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
  },
}

export default function PaymentPage() {
  const { registrationId } = useParams()
  const [searchParams] = useSearchParams()
  const returnStatus = searchParams.get('status')

  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId])

  async function loadStatus() {
    try {
      setLoading(true)
      setError('')
      const data = await getRegistrationPaymentStatus(registrationId)
      setPayment(data)
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
      const preference = await createMercadoPagoPreference(registrationId)
      window.location.href = preference.checkout_url
    } catch (err) {
      setError(err.message || 'No se pudo iniciar el pago')
      setPaying(false)
    }
  }

  const copy = useMemo(() => {
    return statusCopy[payment?.status] || statusCopy.pending_payment
  }, [payment?.status])

  const returnMessage = useMemo(() => {
    if (returnStatus === 'success') {
      return 'Mercado Pago recibió tu operación. La confirmación final puede tardar unos segundos.'
    }
    if (returnStatus === 'pending') {
      return 'Tu pago quedó pendiente. Si elegiste efectivo, se confirmará cuando Mercado Pago nos avise.'
    }
    if (returnStatus === 'failure') {
      return 'El pago no se completó. Puedes intentarlo de nuevo con otra opción.'
    }
    return ''
  }, [returnStatus])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
        <div className="mx-auto max-w-2xl">
          <p className="text-slate-500">Cargando pago...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <main className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
          Inicio
        </Link>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
            SudorTime
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Pago de inscripción
          </h1>

          {returnMessage && (
            <p className="mt-5 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              {returnMessage}
            </p>
          )}

          {payment && (
            <>
              <div className={`mt-6 rounded-2xl border px-4 py-4 ${copy.tone}`}>
                <p className="font-bold">{copy.title}</p>
                <p className="mt-1 text-sm">{copy.message}</p>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-500">
                    Total a pagar
                  </span>
                  <span className="text-2xl font-black">
                    {formatMoney(payment.amount, payment.currency)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Mercado Pago te mostrará las opciones disponibles, como tarjeta, transferencia o efectivo en tiendas participantes cuando estén habilitadas.
                </p>
              </div>

              {payment.status !== 'confirmed' && payment.status !== 'cancelled' && payment.status !== 'expired' && (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying}
                  className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-4 font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paying ? 'Abriendo Mercado Pago...' : 'Pagar inscripción'}
                </button>
              )}

              <button
                type="button"
                onClick={loadStatus}
                className="mt-3 w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold text-slate-700 hover:bg-slate-100"
              >
                Actualizar estado
              </button>
            </>
          )}

          {error && (
            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
