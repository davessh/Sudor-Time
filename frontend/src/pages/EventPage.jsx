import { ArrowRight, CalendarDays, Clock, ExternalLink, MapPin, PackageCheck, ShieldCheck, Users } from 'lucide-react'
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

function getMinPrice(modalidades) {
  const prices = modalidades
    .map((modalidad) => Number(modalidad.precio))
    .filter((price) => Number.isFinite(price) && price > 0)
  return prices.length ? Math.min(...prices) : null
}

function normalizeKitItems(eventData) {
  const customItems = (eventData.kit_items || [])
    .filter((item) => item.visible !== false)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
    .map((item) => ({
      id: `custom-${item.id}`,
      title: item.titulo,
      description: item.descripcion || '',
      image: item.imagen || '',
    }))

  if (customItems.length) return customItems

  return [
    eventData.imagen_playera && {
      id: 'legacy-shirt',
      title: 'Playera',
      description: 'Artículo incluido en el kit del corredor.',
      image: eventData.imagen_playera,
    },
    eventData.imagen_medalla && {
      id: 'legacy-medal',
      title: 'Medalla',
      description: 'Recuerdo oficial del evento.',
      image: eventData.imagen_medalla,
    },
  ].filter(Boolean)
}

function normalizeEventSetup(data) {
  const eventData = data.event || data.evento || data
  const modalidades = data.modalities || data.modalidades || eventData.modalities || []

  return {
    ...eventData,
    modalidades,
    kitItems: normalizeKitItems(eventData),
    salida: eventData.hora_salida || eventData.salida || eventData.hora || 'Por definir',
    distancia: modalidades.length
      ? modalidades.map(getModalidadNombre).join(' y ')
      : 'Modalidades por definir',
    organizador: eventData.organizador || eventData.organiza || 'Por definir',
    imagenHero:
      eventData.imagen_portada ||
      eventData.imagen_convocatoria ||
      eventData.imagenConvocatoria ||
      eventData.convocatoria_url ||
      '',
    imagenConvocatoria:
      eventData.imagen_convocatoria ||
      eventData.imagenConvocatoria ||
      eventData.convocatoria_url ||
      '',
    inscripcionesAbiertas: eventData.inscripciones_abiertas !== false,
  }
}

function getStoredPendingRegistration(eventId) {
  try {
    const stored = JSON.parse(localStorage.getItem('sudortime_pending_registration') || 'null')
    if (!stored || String(stored.event_id) !== String(eventId)) return null
    return stored
  } catch {
    return null
  }
}

export default function EventPage() {
  const { id } = useParams()
  const [evento, setEvento] = useState(null)
  const [pendingRegistration, setPendingRegistration] = useState(null)
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

  useEffect(() => {
    setPendingRegistration(getStoredPendingRegistration(id))
  }, [id])

  const minPrice = useMemo(() => getMinPrice(evento?.modalidades || []), [evento?.modalidades])
  const registrationLink = evento ? `/evento/${evento.id}/inscripcion` : '#'

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-container py-6">
          <div className="h-[520px] animate-pulse rounded-3xl bg-slate-200" />
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
    <div className="page-shell pb-20 sm:pb-0">
      <header className="absolute left-0 right-0 top-0 z-20">
        <div className="page-container flex items-center justify-between py-4">
          <Link to="/" className="rounded-xl bg-black/30 px-3 py-2 text-sm font-black text-white backdrop-blur transition hover:bg-black/45">
            SudorTime
          </Link>
          <span className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide backdrop-blur ${evento.inscripcionesAbiertas ? 'bg-emerald-400/90 text-emerald-950' : 'bg-white/85 text-slate-700'}`}>
            {evento.inscripcionesAbiertas ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}
          </span>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-[560px] items-end overflow-hidden bg-slate-950 pt-20 text-white sm:min-h-[620px]">
          {evento.imagenHero ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: `url("${getApiAssetUrl(evento.imagenHero)}")` }}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(106,26,36,.65),transparent_30%),linear-gradient(135deg,#15070A,#6A1A24_48%,#090D18)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090D18] via-[#090D18]/76 to-[#090D18]/20" />

          <div className="page-container relative z-10 pb-8 sm:pb-12">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-red-100">Convocatoria oficial</p>
              <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">
                {evento.nombre}
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/86 sm:text-lg">
                {evento.descripcion || `${evento.distancia} · ${evento.lugar || 'Lugar por definir'}`}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <HeroMeta icon={CalendarDays} label="Fecha" value={formatFecha(evento.fecha)} />
                <HeroMeta icon={MapPin} label="Lugar" value={evento.lugar || 'Por definir'} />
                <HeroMeta icon={Clock} label="Salida" value={evento.salida} />
                <HeroMeta icon={Users} label="Organiza" value={evento.organizador} />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to={registrationLink}
                  className={`btn-conversion sm:w-auto ${!evento.inscripcionesAbiertas ? 'pointer-events-none opacity-60' : ''}`}
                >
                  Inscribirme ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                {minPrice !== null && (
                  <p className="rounded-xl bg-white/12 px-4 py-3 text-sm font-black text-white backdrop-blur">
                    Desde {formatMoney(minPrice)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="page-container relative z-10 -mt-5 sm:-mt-8">
          {pendingRegistration?.access_token && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 shadow-sm">
              <p>Tienes una preinscripción pendiente en este dispositivo.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link to={`/inscripcion/${pendingRegistration.access_token}/pago`} className="btn-secondary bg-white">
                  Continuar pago
                </Link>
                <Link to={`/evento/${evento.id}/inscripcion?token=${pendingRegistration.access_token}`} className="btn-secondary bg-white">
                  Modificar
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Elige tu modalidad</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Inscripción rápida</h2>
              </div>
              <ShieldCheck className="h-8 w-8 shrink-0 text-[#6A1A24]" />
            </div>

            {evento.modalidades.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {evento.modalidades.map((modalidad) => (
                  <Link
                    key={modalidad.id}
                    to={`/evento/${evento.id}/inscripcion?modalidad=${modalidad.id}`}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-[#6A1A24]/30 hover:bg-[#6A1A24]/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-black text-slate-950">{getModalidadNombre(modalidad)}</h3>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-[#6A1A24]" />
                    </div>
                    {modalidad.descripcion && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{modalidad.descripcion}</p>}
                    <p className="mt-4 text-2xl font-black text-[#6A1A24]">{formatMoney(modalidad.precio)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center text-slate-500">
                Este evento todavía no tiene modalidades registradas.
              </p>
            )}
          </div>
        </section>

        {evento.kitItems.length > 0 && (
          <section className="page-container mt-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Kit del corredor</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Lo que recibes</h2>
                </div>
                <PackageCheck className="h-8 w-8 shrink-0 text-[#6A1A24]" />
              </div>
              <div className={`mt-4 grid gap-3 ${evento.kitItems.length === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {evento.kitItems.map((item) => (
                  <KitItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="page-container mt-6 grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <p className="eyebrow">Detalles</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Información del evento</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoLine label="Fecha" value={formatFecha(evento.fecha)} />
              <InfoLine label="Lugar" value={evento.lugar || 'Lugar por definir'} />
              <InfoLine label="Salida" value={evento.salida} />
              <InfoLine label="Distancias" value={evento.distancia} />
            </div>
            {evento.descripcion && (
              <p className="mt-5 leading-7 text-slate-600">{evento.descripcion}</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-4">
            <p className="eyebrow">Convocatoria</p>
            {evento.imagenConvocatoria ? (
              <>
                <img src={getApiAssetUrl(evento.imagenConvocatoria)} alt="Convocatoria del evento" className="mt-4 max-h-[360px] w-full rounded-2xl border border-slate-200 bg-slate-100 object-contain" />
                <a href={getApiAssetUrl(evento.imagenConvocatoria)} target="_blank" rel="noreferrer" className="btn-secondary mt-4 w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver convocatoria completa
                </a>
              </>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
                Este evento todavía no tiene imagen de convocatoria registrada.
              </p>
            )}
            <Link to={`/evento/${evento.id}/resultados`} className="btn-secondary mt-3 w-full">
              Ver resultados
            </Link>
          </div>
        </section>
      </main>

      {evento.inscripcionesAbiertas && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/20 bg-white/92 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.16)] backdrop-blur sm:hidden">
          <Link to={registrationLink} className="btn-conversion">
            Inscribirme
            {minPrice !== null && <span className="ml-2 opacity-80">· desde {formatMoney(minPrice)}</span>}
          </Link>
        </div>
      )}
    </div>
  )
}

function HeroMeta({ icon, label, value }) {
  const Icon = icon
  return (
    <div className="rounded-2xl border border-white/15 bg-white/12 p-3 backdrop-blur">
      <Icon className="h-4 w-4 text-red-100" />
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-white">{value}</p>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  )
}

function KitItem({ item }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {item.image ? (
        <img src={getApiAssetUrl(item.image)} alt={item.title} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#6A1A24]/10 to-slate-100 p-6 text-center text-sm font-black text-[#6A1A24]">
          {item.title}
        </div>
      )}
      <div className="p-4">
        <p className="font-black text-slate-950">{item.title}</p>
        {item.description && <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>}
      </div>
    </div>
  )
}
