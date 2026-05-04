import { useEffect, useState } from 'react'
import Hero from '../components/Hero'
import EventCard from '../components/EventCard'
import { getEvents } from '../api/events'

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

        const eventosAdaptados = data.map((evento, index) => ({
          ...evento,
          imagen: getEventImage(index),
        }))

        setEventos(eventosAdaptados)
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los eventos')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  function getEventImage(index) {
    const imagenes = [
      '/eventos/1.png',
      '/eventos/logo-medio-maraton.png',
      '/eventos/2.png',
    ]

    return imagenes[index % imagenes.length]
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Hero />

      <main className="mx-auto max-w-7xl px-6 py-16">
        {loading && (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl bg-slate-100"
              >
                <div className="h-64 animate-pulse bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-10 w-full animate-pulse rounded-2xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="py-20 text-center">
            <p className="text-base text-slate-500">{error}</p>
          </div>
        )}

        {!loading && !error && eventos.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-base text-slate-500">
              No hay eventos disponibles por el momento.
            </p>
          </div>
        )}

        {!loading && !error && eventos.length > 0 && (
          <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {eventos.map((evento) => (
              <EventCard key={evento.id} evento={evento} />
            ))}
          </section>
        )}
      </main>
    </div>
  )
}