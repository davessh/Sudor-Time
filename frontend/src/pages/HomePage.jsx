import { useEffect, useState } from 'react'
import Hero from '../components/Hero'
import EventCard from '../components/EventCard'
import EventSkeleton from '../components/EventSkeleton'
import { getEvents } from '../api/events'

export default function HomePage() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true)
        const data = await getEvents()
        setEventos(data)
      } catch (error) {
        console.error('Error cargando los eventos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  return (
    <div className="page-shell">
      <Hero />

      <main className="page-container py-8 sm:py-10 lg:py-12">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Calendario</p>
            <h2 className="section-title mt-2">Próximos eventos</h2>
          </div>
          {!loading && (
            <span className="chip w-fit">
              {eventos.length} {eventos.length === 1 ? 'evento disponible' : 'eventos disponibles'}
            </span>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [1, 2, 3].map((n) => <EventSkeleton key={n} />)
          ) : eventos.length ? (
            eventos.map((evento) => <EventCard key={evento.id} evento={evento} />)
          ) : (
            <div className="panel panel-pad sm:col-span-2 lg:col-span-3">
              <p className="font-semibold text-slate-700">No hay eventos publicados por ahora.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
