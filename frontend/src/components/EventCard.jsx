import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EventCard({ evento }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:border-red-100 hover:shadow-2xl hover:shadow-red-500/10">
      
      {/* Imagen con Aspect Ratio controlado */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={evento.imagen}
          alt={evento.nombre}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        
        {/* Badge de categoría opcional */}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 backdrop-blur">
          Carrera
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Link to={`/evento/${evento.id}`} className="flex-1">
          <h3 className="mb-3 text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">
            {evento.nombre}
          </h3>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-slate-600">
              <Calendar className="mr-2 h-4 w-4 text-red-500" />
              {evento.fecha}
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <MapPin className="mr-2 h-4 w-4 text-red-500" />
              {evento.lugar}
            </div>
          </div>
        </Link>

        <div className="flex gap-3">
          <Link
            to={`/evento/${evento.id}/inscripcion`}
            className="flex-1 rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-95"
          >
            Inscribirse
          </Link>
          <Link
            to={`/evento/${evento.id}/resultados`}
            className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            Resultados
          </Link>
        </div>
      </div>
    </article>
  );
}