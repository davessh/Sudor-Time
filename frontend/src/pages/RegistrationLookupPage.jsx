import { CreditCard, Search, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { searchPublicRegistrations } from '../api/registrations'

const statusLabels = {
  pending_payment: 'Pendiente de pago',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
}

const paymentLabels = {
  unpaid: 'Sin pago',
  paid: 'Pagada',
  failed: 'Pago rechazado',
  refunded: 'Reembolsada',
  manual: 'Pago manual',
  untracked: 'Sin seguimiento',
}

function formatMoney(value, currency = 'MXN') {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency,
  })
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function statusTone(status) {
  if (status === 'confirmed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'pending_payment') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'cancelled') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-slate-200 bg-slate-100 text-slate-700'
}

export default function RegistrationLookupPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSearch = useMemo(() => {
    const text = query.trim()
    const digits = text.replace(/\D/g, '')
    return text.length >= 3 || digits.length > 0
  }, [query])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSearched(false)

    if (!canSearch) {
      setError('Ingresa correo, telefono o numero.')
      return
    }

    try {
      setLoading(true)
      const data = await searchPublicRegistrations(query.trim())
      setResults(data)
      setSearched(true)
    } catch (err) {
      setError(err.message || 'No se pudo consultar la inscripcion')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="border-b border-slate-200 bg-white">
        <div className="page-container flex items-center justify-between py-4">
          <Link to="/" className="text-sm font-bold text-slate-500 transition hover:text-slate-950">
            SudorTime
          </Link>
          <Link to="/" className="text-sm font-bold text-slate-500 transition hover:text-slate-950">
            Inicio
          </Link>
        </div>
      </header>

      <main className="page-container grid gap-6 py-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:py-10">
        <section className="panel panel-pad h-fit">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <Search className="h-6 w-6" />
          </div>
          <p className="eyebrow mt-5">Consulta publica</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Busca tu inscripcion</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="field-label">Correo, telefono o numero</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="correo@ejemplo.com, 6861234567 o numero"
                className="input-control mt-2"
              />
            </label>

            {error && <p className="notice-error">{error}</p>}

            <button type="submit" disabled={!canSearch || loading} className="btn-primary w-full">
              {loading ? 'Buscando...' : 'Consultar'}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {!searched && !loading && (
            <div className="panel panel-pad">
              <div className="flex items-start gap-3 text-slate-600">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                <p className="text-sm leading-6">
                  Puedes revisar si tu preinscripcion sigue pendiente, continuar el pago o confirmar que ya apareces como inscrito.
                </p>
              </div>
            </div>
          )}

          {searched && results.length === 0 && (
            <div className="panel panel-pad">
              <p className="font-bold text-slate-900">No encontramos resultados.</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Revisa que el correo, telefono o numero coincida con el registro de inscripcion.
              </p>
            </div>
          )}

          {results.map((registration) => (
            <article key={registration.id} className="panel panel-pad">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    {registration.numero_competidor ? `Numero ${registration.numero_competidor}` : `Numero pendiente · Registro ${registration.id}`}
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">{registration.event_nombre}</h2>
                  <p className="mt-2 font-semibold text-slate-700">{registration.participante_nombre}</p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusTone(registration.status)}`}>
                  {statusLabels[registration.status] || registration.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Modalidad" value={registration.modalidad_nombre} />
                <Info label="Categoria" value={registration.categoria_nombre || 'Por confirmar'} />
                <Info label="Paquete" value={registration.producto_nombre || 'Sin paquete adicional'} />
                <Info label="Playera" value={registration.talla_playera || 'No incluida'} />
                <Info label="Pago" value={paymentLabels[registration.payment_status] || registration.payment_status} />
                <Info label="Total" value={formatMoney(registration.amount, registration.currency)} />
              </div>

              {registration.status === 'pending_payment' && (
                <p className="notice-warning mt-5">
                  Fecha limite de pago: {formatDateTime(registration.expires_at)}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link to={`/inscripcion/${registration.id}/pago`} className="btn-primary w-full sm:w-auto">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {registration.status === 'pending_payment' ? 'Continuar pago' : 'Ver pago'}
                </Link>
                <Link to={`/evento/${registration.event_id}`} className="btn-secondary w-full sm:w-auto">
                  Ver evento
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  )
}
