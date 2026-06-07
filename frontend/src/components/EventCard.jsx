import { Calendar, FolderOpen, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiAssetUrl } from '../api/client'

const RUNNER_IMAGES = ['/eventos/medio2.jpg', '/eventos/prueba1.JPG']
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

function getEventDistance(evento, index) {
  const modality = (evento.modalities || []).find((item) => item.distancia_km || item.nombre)
  const km = Number(modality?.distancia_km)

  if (Number.isFinite(km) && km > 0) return `${km.toLocaleString('es-MX', { maximumFractionDigits: 1 })}K`
  if (modality?.nombre) return modality.nombre

  return FALLBACK_DISTANCES[index % FALLBACK_DISTANCES.length]
}

export default function EventCard({ evento, index = 0 }) {
  const imageSrc = evento.imagen_portada
    ? getApiAssetUrl(evento.imagen_portada)
    : RUNNER_IMAGES[index % RUNNER_IMAGES.length]
  const distance = getEventDistance(evento, index)
  const hasResults = Boolean(evento.hasResults)

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.18)]">
      <Link to={`/evento/${evento.id}`} className="block">
        <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
          <img
            src={imageSrc}
            alt={`Corredores participando en ${evento.nombre}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2">
            <span className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-lg">
              {distance}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-7">
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
          </div>
        </Link>

        <div className="mt-6 space-y-3">
          <Link to={`/evento/${evento.id}/inscripcion`} className="btn-conversion">
            ¡Inscribirse ahora!
          </Link>
          {hasResults ? (
            <Link to={`/evento/${evento.id}/resultados`} className="btn-results-link">
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Resultados
            </Link>
          ) : (
            <span className="btn-results-link btn-results-disabled" aria-disabled="true">
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Resultados
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
