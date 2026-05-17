import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getEventSetup } from '../api/events'
import { getApiAssetUrl } from '../api/client'

function getModalidadNombre(modalidad) {
  return modalidad.nombre || modalidad.name || `Modalidad ${modalidad.id}`
}

function formatMoney(value) {
  const amount = Number(value || 0)

  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })
}

function formatFecha(fecha) {
  if (!fecha) return 'Fecha por definir'

  const date = new Date(`${fecha}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return fecha
  }

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
    if (!evento?.modalidades?.length) return null

    const precios = evento.modalidades
      .map((modalidad) => Number(modalidad.precio || 0))
      .filter((precio) => precio > 0)

    if (!precios.length) return null

    return Math.min(...precios)
  }, [evento])

  if (loading) {
    return <div className="min-h-screen bg-slate-50 animate-pulse" />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] px-6 py-16 text-center text-slate-900">
        <h1 className="text-2xl font-black">No se pudo cargar el evento</h1>
        <p className="mt-3 text-slate-500">{error}</p>
        <Link to="/" className="mt-6 inline-block font-bold text-slate-900">
          Volver al inicio
        </Link>
      </div>
    )
  }

  if (!evento) return null

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 selection:bg-slate-900 selection:text-white font-sans relative">
      <div className="absolute top-0 left-1/2 -ml-[30rem] w-[60rem] h-[60rem] rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-0 w-[40rem] h-[40rem] rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />

      <header className="relative z-10 border-b border-white/40 bg-white/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <Link to="/" className="hover:text-slate-900 transition-colors">
              Inicio
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Evento</span>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <section className="mb-10 lg:mb-14">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
            {evento.nombre}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatFecha(evento.fecha)}
            </div>

            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {evento.lugar || 'Lugar por definir'}
            </div>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8 space-y-10">
            <section className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl lg:p-10">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-8">
                Información del Evento
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm transition-all hover:bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Hora de salida
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">
                    {evento.salida}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm transition-all hover:bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Modalidades
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">
                    {evento.distancia}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm transition-all hover:bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Organiza
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">
                    {evento.organizador}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm transition-all hover:bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Estatus
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          evento.inscripcionesAbiertas ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-3 w-3 ${
                          evento.inscripcionesAbiertas ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                    </span>
                    <p
                      className={`text-lg font-semibold ${
                        evento.inscripcionesAbiertas ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {evento.inscripcionesAbiertas
                        ? 'Inscripciones abiertas'
                        : 'Inscripciones cerradas'}
                    </p>
                  </div>
                </div>
              </div>

              {evento.descripcion && (
                <div className="mt-8 rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Descripción
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">
                    {evento.descripcion}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl lg:p-10">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-8">
                Modalidades disponibles
              </h2>

              {evento.modalidades.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {evento.modalidades.map((modalidad) => (
                    <div
                      key={modalidad.id}
                      className="rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm transition-all hover:bg-white"
                    >
                      <h3 className="text-lg font-black text-slate-900">
                        {getModalidadNombre(modalidad)}
                      </h3>

                      {modalidad.descripcion && (
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                          {modalidad.descripcion}
                        </p>
                      )}

                      <p className="mt-4 text-xl font-black text-slate-950">
                        {formatMoney(modalidad.precio)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-slate-500">
                  Este evento todavía no tiene modalidades registradas.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl lg:p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Convocatoria Oficial
                </h2>

                {evento.imagenConvocatoria && (
                  <a
                    href={getApiAssetUrl(evento.imagenConvocatoria)}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900"
                  >
                    Pantalla completa
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1 hover:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                )}
              </div>

              {evento.imagenConvocatoria ? (
                <div className="overflow-hidden rounded-2xl border-4 border-white shadow-sm bg-slate-100">
                  <img
                    src={getApiAssetUrl(evento.imagenConvocatoria)}
                    alt="Convocatoria del evento"
                    className="w-full h-auto object-contain transition-transform duration-700 hover:scale-[1.02]"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-slate-500">
                  Este evento todavía no tiene imagen de convocatoria registrada.
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-4 relative">
            <div className="sticky top-24 rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/5">
                  <svg className="h-6 w-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Inscríbete ahora para
                </p>
                <p className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                  {evento.nombre}
                </p>

                {precioDesde !== null && (
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    Desde {formatMoney(precioDesde)}
                  </p>
                )}
              </div>

              <Link
                to={`/evento/${evento.id}/inscripcion`}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 py-4 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/30 active:translate-y-0"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 text-sm uppercase tracking-widest">
                  Inscribirme
                </span>
              </Link>

              <Link
                to={`/evento/${evento.id}/resultados`}
                className="mt-4 block w-full rounded-2xl border-2 border-white/80 bg-white/50 py-4 text-center text-sm font-bold uppercase tracking-widest text-slate-700 transition-all hover:bg-white hover:shadow-sm"
              >
                Ver Resultados
              </Link>

              <div className="mt-10 pt-6 border-t border-slate-200/50">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Pago Seguro por Sudortime</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}