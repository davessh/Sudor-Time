import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getEventById } from '../api/events'

export default function EventPage() {
  const { id } = useParams()
  const location = useLocation()

  const [evento, setEvento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true)
        setError('')
        const data = await getEventById(id)

        setEvento({
          ...data,
          imagenConvocatoria: 'assets/convo.jpg',
          distancia: data.distancia || '5K y 2K',
          salida: data.salida || '7:00 AM',
          organizador: 'Sudortime Sports',
          convocatoria: data.convocatoria || 'La convocatoria oficial se detalla en la imagen inferior.'
        })
      } catch (err) {
        setError(err.message || 'No se pudo cargar el evento')
      } finally {
        setLoading(false)
      }
    }
    loadEvent()
  }, [id])

  if (loading) return <div className="min-h-screen bg-slate-50 animate-pulse" />

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 selection:bg-slate-900 selection:text-white font-sans relative">
      
      {/* Elementos decorativos de fondo para realzar el "Glassmorphism" */}
      <div className="absolute top-0 left-1/2 -ml-[30rem] w-[60rem] h-[60rem] rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-0 w-[40rem] h-[40rem] rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />

      {/* Header / Nav (Minimalista) */}
      <header className="relative z-10 border-b border-white/40 bg-white/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <Link to="/" className="hover:text-slate-900 transition-colors">Inicio</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Evento</span>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:py-16">
        
        {/* Sección Título y Datos Rápidos */}
        <section className="mb-10 lg:mb-14">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
            {evento.nombre}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500">
            {/* Icono Calendario SVG */}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {evento.fecha}
            </div>
            {/* Icono Ubicación SVG */}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {evento.lugar}
            </div>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          
          {/* Columna Izquierda: Información General (Glass Effect) */}
          <div className="lg:col-span-8 space-y-10">
            <section className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl lg:p-10">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-8">
                Información del Evento
              </h2>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm transition-all hover:bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hora de salida</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">{evento.salida}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm transition-all hover:bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Distancias</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">{evento.distancia}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm transition-all hover:bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Organiza</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">{evento.organizador}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/50 p-6 shadow-sm transition-all hover:bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estatus</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <p className="text-lg font-semibold text-emerald-600">Inscripciones Abiertas</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Apartado Convocatoria (Imagen) */}
            <section className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl lg:p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Convocatoria Oficial</h2>
                <a 
                  href={evento.imagenConvocatoria} 
                  target="_blank" 
                  rel="noreferrer"
                  className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900"
                >
                  Pantalla completa
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1 hover:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border-4 border-white shadow-sm bg-slate-100">
                <img 
                  src={evento.imagenConvocatoria} 
                  alt="Convocatoria del evento" 
                  className="w-full h-auto object-contain transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>
            </section>
          </div>

          {/* Columna Derecha: Sidebar de Acción (Pro/Gloss) */}
          <aside className="lg:col-span-4 relative">
            {/* El sidebar "peajoso" (sticky) */}
            <div className="sticky top-24 rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
              
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/5">
                  <svg className="h-6 w-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Inscríbete ahora para</p>
                <p className="text-xl font-black text-slate-900 tracking-tight leading-tight">{evento.nombre}</p>
              </div>
              
              {/* Botón Principal "Pro" */}
              <Link
                to={`/evento/${evento.id}/inscripcion`}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 py-4 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/30 active:translate-y-0"
              >
                {/* Brillo sutil al pasar el mouse */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 text-sm uppercase tracking-widest">Inscribirme</span>
              </Link>
              
              {/* Botón Secundario */}
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