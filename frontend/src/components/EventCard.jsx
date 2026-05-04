import { Link } from 'react-router-dom'

export default function EventCard({ evento }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      {/* Click en imagen/título = hub del evento */}
      <Link to={`/evento/${evento.id}`} className="block">
        <div className="relative h-48 w-full overflow-hidden bg-slate-200">
          <img
            src={evento.imagen}
            alt={evento.nombre}
            className="h-full w-full object-cover"
            loading="lazy"
          />

          {/* overlay profesional */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-xl font-semibold text-white">
              {evento.nombre}
            </h3>
            <p className="mt-1 text-sm text-slate-200">
              {evento.fecha} · {evento.lugar}
            </p>
          </div>
        </div>
      </Link>

      <div className="p-6">
        <div className="flex gap-3">
          <Link
            to={`/evento/${evento.id}/inscripcion`}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-medium hover:bg-slate-50"
          >
            Inscribirse
          </Link>

          <Link
            to={`/evento/${evento.id}/resultados`}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white hover:opacity-90"
          >
            Resultados
          </Link>
        </div>
      </div>
    </article>
  )
}