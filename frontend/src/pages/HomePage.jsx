import { useEffect, useState } from 'react'
import Hero from '../components/Hero'
import EventCard from '../components/EventCard'
import EventSkeleton from '../components/EventSkeleton'
import { getEvents } from '../api/events'

const quickMonths = ['Mar', 'May', 'Abr', 'Jun']
const distances = ['5K', '10K', 'Half']

export default function HomePage() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true)
        setError('')
        const data = await getEvents()
        setEventos(data)
      } catch (error) {
        console.error('Error cargando los eventos:', error)
        setError('No pudimos cargar los eventos. Intenta de nuevo en unos minutos.')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  return (
    <div className="page-shell">
      <Hero />

      <main id="eventos" className="page-container py-8 sm:py-10 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(220px,0.27fr)_1fr] lg:items-start">
          <aside className="panel sticky top-4 p-5">
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-950">Quick Filters</h2>

            <div className="mt-5 border-b border-slate-200 pb-5">
              <label htmlFor="price-filter" className="text-sm font-black text-slate-950">
                Precio
              </label>
              <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>$0</span>
                <span>$500 MXN</span>
              </div>
              <input
                id="price-filter"
                type="range"
                min="0"
                max="500"
                defaultValue="500"
                className="mt-3 w-full accent-[#6A1A24]"
              />
            </div>

            <div className="border-b border-slate-200 py-5">
              <p className="text-sm font-black text-slate-950">Distancia</p>
              <div className="mt-3 space-y-3">
                {distances.map((distance) => (
                  <label key={distance} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[#6A1A24]" />
                    {distance}
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-5">
              <p className="text-sm font-black text-slate-950">Fecha Quick-Picker</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {quickMonths.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    className={index === 0 ? 'quick-month-active' : 'quick-month'}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section aria-label="Eventos disponibles">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Calendario</p>
                <h2 className="section-title mt-2">Próximos eventos</h2>
              </div>
              {!loading && !error && (
                <span className="chip w-fit">
                  {eventos.length} {eventos.length === 1 ? 'evento disponible' : 'eventos disponibles'}
                </span>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                [1, 2, 3].map((n) => <EventSkeleton key={n} />)
              ) : error ? (
                <div className="panel panel-pad md:col-span-2 xl:col-span-3">
                  <p className="font-semibold text-slate-700">{error}</p>
                </div>
              ) : eventos.length ? (
                eventos.map((evento, index) => <EventCard key={evento.id} evento={evento} index={index} />)
              ) : (
                <div className="panel panel-pad md:col-span-2 xl:col-span-3">
                  <p className="font-semibold text-slate-700">No hay eventos publicados por ahora.</p>
                </div>
              )}
            </div>

            {!loading && !error && (
              <p className="mt-8 text-center text-sm font-semibold text-slate-700">
                {eventos.length} {eventos.length === 1 ? 'evento disponible' : 'eventos disponibles'} - ¡Inscripción fácil y rápida en segundos!
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
