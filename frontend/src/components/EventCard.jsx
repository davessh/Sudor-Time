import { Calendar, FolderOpen, MapPin, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const RUNNER_IMAGES = ['/eventos/medio2.jpg', '/eventos/prueba1.JPG']
const FALLBACK_PRICES = ['$230 MXN', '$100 MXN']
const FALLBACK_DISTANCES = ['5K', '10K']

function formatEventDate(value) {
  if (!value) return 'Fecha por definir'

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatPrice(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''

  return `$${amount.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN`
}

function getEventPrice(evento, index) {
  const candidates = [
    ...(evento.products || []),
    ...(evento.modalities || []),
  ]
    .map((item) => Number(item.precio))
    .filter((price) => Number.isFinite(price) && price > 0)

  if (candidates.length) return formatPrice(Math.min(...candidates))

  return FALLBACK_PRICES[index % FALLBACK_PRICES.length]
}

function getEventDistance(evento, index) {
  const modality = (evento.modalities || []).find((item) => item.distancia_km || item.nombre)
  const km = Number(modality?.distancia_km)

  if (Number.isFinite(km) && km > 0) return `${km.toLocaleString('es-MX', { maximumFractionDigits: 1 })}K`
  if (modality?.nombre) return modality.nombre

  return FALLBACK_DISTANCES[index % FALLBACK_DISTANCES.length]
}

export default function EventCard({ evento, index = 0 }) {
  const imageSrc = RUNNER_IMAGES[index % RUNNER_IMAGES.length]
  const price = getEventPrice(evento, index)
  const distance = getEventDistance(evento, index)
  const availability = evento.cupo_disponible || evento.cupos_disponibles || '150 lugares'

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.18)]">
      <Link to={`/evento/${evento.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            src={imageSrc}
            alt={`Corredores participando en ${evento.nombre}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2">
            <span className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-lg">
              {price}
            </span>
            <span className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-lg">
              {distance}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <Link to={`/evento/${evento.id}`} className="flex-1">
          <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-slate-950 transition group-hover:text-[#6A1A24] sm:text-2xl">
            {evento.nombre}
          </h3>

          <div className="mt-5 space-y-3 text-sm font-medium text-slate-600">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#6A1A24]" aria-hidden="true" />
              <span>{formatEventDate(evento.fecha)}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6A1A24]" aria-hidden="true" />
              <span>{evento.lugar || 'Mexicali'}</span>
            </div>
            <div className="flex items-start gap-2">
              <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-[#6A1A24]" aria-hidden="true" />
              <span>Cupo disponible: {availability}</span>
            </div>
          </div>
        </Link>

        <div className="mt-6 space-y-3">
          <Link to={`/evento/${evento.id}/inscripcion`} className="btn-conversion">
            ¡Inscribirse ahora!
          </Link>
          <Link to={`/evento/${evento.id}/resultados`} className="btn-results-link">
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            Ver resultados previos
          </Link>
        </div>
      </div>
    </article>
  )
}
