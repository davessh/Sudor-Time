import { CalendarDays, Clock, ExternalLink, MapPin, ShieldCheck, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getEventSetup } from '../api/events'
import { getApiAssetUrl } from '../api/client'

function getModalidadNombre(modalidad) {
  return modalidad.nombre || modalidad.name || `Modalidad ${modalidad.id}`
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })
}

function formatFecha(fecha) {
  if (!fecha) return 'Fecha por definir'
  const date = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(date.getTime())) return fecha

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function normalizeEventSetup(data) {
  const eventData = data.event || data.evento || data
  const modalidades = data.modalities || data.modalidades || eventData.modalities || []

  return {
    ...eventData,
    modalidades,
    salida: eventData.hora_salida || eventData.salida || eventData.hora || 'Por definir',
    distancia: modalidades.length
      ? modalidades.map(getModalidadNombre).join(' y ')
      : 'Modalidades por definir',
    organizador: eventData.organizador || eventData.organiza || 'Por definir',
    imagenConvocatoria:
      eventData.imagen_convocatoria ||
      eventData.imagenConvocatoria ||
      eventData.convocatoria_url ||
      '',
    inscripcionesAbiertas: eventData.inscripciones_abiertas !== false,
  }
}

export default function EventPage() {
  const { id } = useParams()
  const [evento, setEvento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true)
        setError('')
        const data = await getEventSetup(id)
        setEvento(normalizeEventSetup(data))
      } catch (err) {
        setError(err.message || 'No se pudo cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id])

  const precioDesde = useMemo(() => {
    if (!evento.modalidades.length) return null
    const precios = evento.modalidades.map((modalidad) => Number(modalidad.precio || 0)).filter((precio) => precio > 0)
    return precios.length ? Math.min(...precios) : null
  }, [evento])

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-container py-10">
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <main className="page-container py-16 text-center">
          <h1 className="text-2xl font-black">No se pudo cargar el evento</h1>
          <p className="mt-3 text-slate-500">{error}</p>
          <Link to="/" className="btn-secondary mt-6">
            Volver al inicio
          </Link>
        </main>
      </div>
    )
  }

  if (!evento) return null

  return (
    <div className="page-shell">
      <header className="border-b border-slate-200 bg-white">
        <div className="page-container flex items-center justify-between py-4">
          <Link to="/" className="text-sm font-bold text-slate-500 transition hover:text-slate-950">
            SudorTime
          </Link>
          <span className="chip">{evento.inscripcionesAbiertas ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}</span>
        </div>
      </header>

      <main className="page-container py-6 sm:py-8 lg:py-10">
        <section className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="space-y-6">
            <div className="panel overflow-hidden">
              {evento.imagenConvocatoria ? (
                <img
                  src={getApiAssetUrl(evento.imagenConvocatoria)}
                  alt="Convocatoria del evento"
                  className="max-h-[680px] w-full bg-slate-100 object-contain"
                />
              ) : (
                <div className="flex min-h-72 items-center justify-center bg-slate-100 px-6 text-center text-slate-500">
                  Este evento todavía no tiene imagen de convocatoria registrada.
                </div>
              )}
            </div>

            <section className="panel panel-pad">
              <p className="eyebrow">Información del evento</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                {evento.nombre}
              </h1>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <EventMeta icon={CalendarDays} label="Fecha" value={formatFecha(evento.fecha)} />
                <EventMeta icon={MapPin} label="Lugar" value={evento.lugar || 'Lugar por definir'} />
                <EventMeta icon={Clock} label="Salida" value={evento.salida} />
                <EventMeta icon={Users} label="Organiza" value={evento.organizador} />
              </div>

              {evento.descripcion && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <p className="text-sm font-bold text-slate-700">Descripción</p>
                  <p className="mt-2 leading-7 text-slate-600">{evento.descripcion}</p>
                </div>
              )}
            </section>

            <section className="panel panel-pad">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Modalidades</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Opciones disponibles</h2>
                </div>
                {precioDesde !== null && <span className="chip w-fit">Desde {formatMoney(precioDesde)}</span>}
              </div>

              {evento.modalidades.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {evento.modalidades.map((modalidad) => (
                    <div key={modalidad.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-black text-slate-950">{getModalidadNombre(modalidad)}</h3>
                      {modalidad.descripcion && <p className="mt-2 text-sm leading-6 text-slate-600">{modalidad.descripcion}</p>}
                      <p className="mt-4 text-xl font-black text-red-700">{formatMoney(modalidad.precio)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-slate-500">
                  Este evento todavía no tiene modalidades registradas.
                </p>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="panel panel-pad">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Registro oficial</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{evento.nombre}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Completa tu inscripción y continúa al pago para confirmar tu lugar.
              </p>

              {precioDesde !== null && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Costo</p>
                  <p className="mt-1 text-2xl font-black">Desde {formatMoney(precioDesde)}</p>
                </div>
              )}

              <div className="mt-6 grid gap-3">
                <Link to={`/evento/${evento.id}/inscripcion`} className="btn-primary w-full">
                  Inscribirme
                </Link>
                <Link to={`/evento/${evento.id}/resultados`} className="btn-secondary w-full">
                  Ver resultados
                </Link>
                {evento.imagenConvocatoria && (
                  <a href={getApiAssetUrl(evento.imagenConvocatoria)} target="_blank" rel="noreferrer" className="btn-secondary w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver convocatoria
                  </a>
                )}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

function EventMeta({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-1 font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
