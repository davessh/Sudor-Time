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
          imagen: '/eventos/prueba1.JPG',
          descripcion:
            'Vive una experiencia deportiva organizada, dinámica y pensada para corredores de todos los niveles. Consulta aquí la información principal del evento, conoce lo que incluye tu inscripción y prepárate para participar.',
          distancia: 'Distancias por confirmar',
          salida: 'Horario por confirmar',
          kit: 'Número, hidratación y beneficios del evento.',
          premios: 'Premiación general y por categorías según convocatoria.',
          organizador: 'Sudortime Sports',
          convocatoria:
            'La convocatoria oficial del evento se publicará en esta sección. Aquí podrás consultar categorías, requisitos, horarios importantes, entrega de kits y detalles de participación.',
          recomendaciones:
            'Llega con anticipación, verifica tus datos antes de competir, mantente hidratado y sigue las indicaciones del staff durante toda la jornada.',
        })
      } catch (err) {
        setError(err.message || 'No se pudo cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id])

  const isEvento = location.pathname === `/evento/${id}`
  const isResultados = location.pathname === `/evento/${id}/resultados`
  const isInscripcion = location.pathname === `/evento/${id}/inscripcion`

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-48 rounded-full bg-slate-200" />
            <div className="h-12 w-2/3 rounded-2xl bg-slate-200" />
            <div className="h-5 w-1/3 rounded-full bg-slate-200" />
            <div className="mt-8 h-72 rounded-[2rem] bg-slate-200" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-bold">Error</h1>
          <p className="mt-4 text-slate-600">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-bold">Evento no encontrado</h1>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link to="/" className="transition hover:text-slate-900">
                Inicio
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-900">{evento.nombre}</span>
            </div>

            <div className="mt-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {evento.nombre}
              </h1>
              <p className="mt-1 text-sm text-slate-500 md:text-base">
                {evento.fecha} · {evento.lugar}
              </p>
            </div>
          </div>

          <div className="text-sm font-medium text-slate-500">
            Plataforma de eventos y resultados
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-4">
          <nav className="flex flex-wrap gap-2">
            <Link
              to={`/evento/${evento.id}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isEvento
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Resumen
            </Link>

            <Link
              to={`/evento/${evento.id}/inscripcion`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isInscripcion
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Inscripción
            </Link>

            <Link
              to={`/evento/${evento.id}/resultados`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isResultados
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Resultados
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-h-[340px]">
              <img
                src={evento.imagen}
                alt={evento.nombre}
                className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                  Evento deportivo
                </p>

                <h2 className="max-w-2xl text-3xl font-bold text-white md:text-5xl">
                  {evento.nombre}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                  {evento.descripcion}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-8 md:p-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                  Información general
                </p>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Fecha
                    </p>
                    <p className="mt-2 text-lg font-semibold">{evento.fecha}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Ubicación
                    </p>
                    <p className="mt-2 text-lg font-semibold">{evento.lugar}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Estado
                    </p>
                    <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      Inscripciones abiertas
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                <Link
                  to={`/evento/${evento.id}/inscripcion`}
                  className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-4 text-center text-base font-semibold text-white transition hover:bg-red-700"
                >
                  Inscribirse ahora
                </Link>

                <Link
                  to={`/evento/${evento.id}/resultados`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-4 text-center text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Ver resultados
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Distancia
            </p>
            <p className="mt-3 text-xl font-bold">{evento.distancia}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Hora de salida
            </p>
            <p className="mt-3 text-xl font-bold">{evento.salida}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Organizador
            </p>
            <p className="mt-3 text-xl font-bold">{evento.organizador}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Participación
            </p>
            <p className="mt-3 text-xl font-bold">Convocatoria activa</p>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-8">
            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                    Convocatoria
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">Información del evento</h3>
                </div>
              </div>

              <p className="mt-5 leading-7 text-slate-600">
                {evento.convocatoria}
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Ideal para publicar aquí
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Categorías, costos, horarios, ruta, reglas, entrega de kits y
                    recomendaciones para corredores.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    También puede servir
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Como espacio para patrocinadores, avisos oficiales o cambios
                    importantes antes del día del evento.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Experiencia del corredor
              </p>
              <h3 className="mt-2 text-2xl font-bold">Qué incluye y qué esperar</h3>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Kit del corredor
                  </p>
                  <p className="mt-3 leading-7 text-slate-600">{evento.kit}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Premiación
                  </p>
                  <p className="mt-3 leading-7 text-slate-600">{evento.premios}</p>
                </div>
              </div>
            </article>
          </div>

          <aside className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Recomendaciones
              </p>
              <h3 className="mt-2 text-2xl font-bold">Antes de competir</h3>

              <p className="mt-5 leading-7 text-slate-600">
                {evento.recomendaciones}
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Llega con tiempo suficiente.',
                  'Confirma tu categoría e inscripción.',
                  'Consulta avisos oficiales del evento.',
                  'Respeta horarios, ruta y staff de apoyo.',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}