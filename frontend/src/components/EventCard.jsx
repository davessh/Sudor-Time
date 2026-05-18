import { Calendar, MapPin, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiAssetUrl } from '../api/client'

const DEFAULT_IMAGE = '/eventos/1.png'

export default function EventCard({ evento }) {
  const imageSrc = getApiAssetUrl(evento.imagen_convocatoria || evento.imagen || DEFAULT_IMAGE)

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <Link to={`/evento/${evento.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            src={imageSrc}
            alt={evento.nombre}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/75 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-900 shadow-sm">
            <Trophy className="h-3.5 w-3.5 text-red-700" />
            Carrera
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <Link to={`/evento/${evento.id}`} className="flex-1">
          <h3 className="line-clamp-2 text-xl font-black tracking-tight text-slate-950 transition group-hover:text-red-700">
            {evento.nombre}
          </h3>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              <span>{evento.fecha || 'Fecha por definir'}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              <span>{evento.lugar || 'Lugar por definir'}</span>
            </div>
          </div>
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Link to={`/evento/${evento.id}/inscripcion`} className="btn-primary w-full">
            Inscribirse
          </Link>
          <Link to={`/evento/${evento.id}/resultados`} className="btn-secondary w-full sm:w-auto">
            Resultados
          </Link>
        </div>
      </div>
    </article>
  )
}
