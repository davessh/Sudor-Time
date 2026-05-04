import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getEventById } from '../api/events'
import { getResultsByEvent } from '../api/results'

export default function ResultsPage() {
  const { id } = useParams()
  const location = useLocation()

  const [busqueda, setBusqueda] = useState('')
  const [filtroRama, setFiltroRama] = useState('Todos')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [orden, setOrden] = useState('posicion')

  const [evento, setEvento] = useState(null)
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [eventoData, resultadosData] = await Promise.all([
          getEventById(id),
          getResultsByEvent(id),
        ])

        setEvento(eventoData)

        const resultadosAdaptados = resultadosData.map((corredor, index) => ({
          id:
            corredor.athlete_id ??
            `${corredor.tag_code ?? 'tag'}-${corredor.posicion ?? index + 1}`,
          athlete_id: corredor.athlete_id,
          posicion: corredor.posicion ?? index + 1,
          numero: corredor.tag_code || corredor.numero || `A-${index + 1}`,
          nombre:
            `${corredor.nombre ?? ''} ${corredor.apellido ?? ''}`.trim() ||
            'Sin nombre',
          categoria: corredor.categoria || 'Sin categoría',
          rama: corredor.rama || 'Por definir',
          tiempo: formatTimestamp(corredor.timestamp),
          estado: corredor.estado || 'Finalizado',
        }))

        setResultados(resultadosAdaptados)
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los resultados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  function formatTimestamp(timestamp) {
    if (!timestamp) return '--:--:--'

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
      return timestamp
    }

    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  function parseTimeToSeconds(tiempo) {
    if (!tiempo || tiempo === '--:--:--') return Number.MAX_SAFE_INTEGER

    const parts = tiempo.split(':').map(Number)

    if (parts.some(Number.isNaN)) return Number.MAX_SAFE_INTEGER

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }

    return Number.MAX_SAFE_INTEGER
  }

  const categoriasDisponibles = useMemo(() => {
    const categorias = new Set(
      resultados
        .map((corredor) => corredor.categoria)
        .filter((categoria) => categoria && categoria !== 'Sin categoría')
    )

    return ['Todas', ...Array.from(categorias).sort()]
  }, [resultados])

  const resultadosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    const filtrados = resultados.filter((corredor) => {
      const coincideBusqueda =
        !texto ||
        corredor.nombre.toLowerCase().includes(texto) ||
        String(corredor.numero).toLowerCase().includes(texto) ||
        String(corredor.posicion).includes(texto)

      const coincideRama =
        filtroRama === 'Todos' ? true : corredor.rama === filtroRama

      const coincideCategoria =
        filtroCategoria === 'Todas'
          ? true
          : corredor.categoria === filtroCategoria

      return coincideBusqueda && coincideRama && coincideCategoria
    })

    const ordenados = [...filtrados]

    if (orden === 'nombre') {
      ordenados.sort((a, b) => a.nombre.localeCompare(b.nombre))
    } else if (orden === 'tiempo') {
      ordenados.sort(
        (a, b) => parseTimeToSeconds(a.tiempo) - parseTimeToSeconds(b.tiempo)
      )
    } else {
      ordenados.sort((a, b) => Number(a.posicion) - Number(b.posicion))
    }

    return ordenados
  }, [resultados, busqueda, filtroRama, filtroCategoria, orden])

  const isEvento = location.pathname === `/evento/${id}`
  const isResultados = location.pathname === `/evento/${id}/resultados`
  const isInscripcion = location.pathname === `/evento/${id}/inscripcion`

  function limpiarFiltros() {
    setBusqueda('')
    setFiltroRama('Todos')
    setFiltroCategoria('Todas')
    setOrden('posicion')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-48 rounded-full bg-slate-200" />
            <div className="h-12 w-2/3 rounded-2xl bg-slate-200" />
            <div className="h-5 w-1/3 rounded-full bg-slate-200" />
            <div className="mt-8 h-64 rounded-[2rem] bg-slate-200" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16">
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
        <div className="mx-auto max-w-6xl px-6 py-16">
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
              <Link
                to={`/evento/${evento.id}`}
                className="transition hover:text-slate-900"
              >
                {evento.nombre}
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-900">Resultados</span>
            </div>

            <div className="mt-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Resultados oficiales
              </h1>
              <p className="mt-1 text-sm text-slate-500 md:text-base">
                {evento.nombre} · {evento.fecha} · {evento.lugar}
              </p>
            </div>
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
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Búsqueda y filtros
              </p>
              <h2 className="mt-2 text-2xl font-bold">Consulta de resultados</h2>
            </div>

            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar por nombre, número o posición
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ejemplo: Juan Pérez, A-15 o 1"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-11 outline-none transition focus:border-slate-900"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  🔎
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Rama
              </label>
              <select
                value={filtroRama}
                onChange={(e) => setFiltroRama(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
              >
                <option value="Todos">Todos</option>
                <option value="Varonil">Varonil</option>
                <option value="Femenil">Femenil</option>
                <option value="Por definir">Por definir</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Categoría
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
              >
                {categoriasDisponibles.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ordenar por
              </label>
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
              >
                <option value="posicion">Posición</option>
                <option value="tiempo">Tiempo</option>
                <option value="nombre">Nombre</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold">Tabla general de resultados</h2>
            <p className="mt-1 text-sm text-slate-500">
              Busca corredores y consulta sus tiempos registrados.
            </p>
          </div>

          {resultadosFiltrados.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10">
                <p className="text-lg font-semibold">No se encontraron resultados</p>
                <p className="mt-2 text-sm text-slate-500">
                  Ajusta tu búsqueda o cambia los filtros.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-7 bg-slate-100 px-6 py-4 text-sm font-semibold text-slate-600">
                  <div>Posición</div>
                  <div>Número</div>
                  <div>Nombre</div>
                  <div>Categoría</div>
                  <div>Rama</div>
                  <div>Tiempo</div>
                  <div>Estado</div>
                </div>

                <div className="divide-y divide-slate-200">
                  {resultadosFiltrados.map((corredor) => {
                    const fila = (
                      <div className="grid grid-cols-7 items-center gap-4 px-6 py-5 transition hover:bg-slate-50">
                        <div className="font-semibold text-slate-900">
                          #{corredor.posicion}
                        </div>

                        <div className="font-medium text-slate-700">
                          {corredor.numero}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {corredor.nombre}
                          </p>
                        </div>

                        <div className="text-slate-600">
                          {corredor.categoria}
                        </div>

                        <div className="text-slate-600">
                          {corredor.rama}
                        </div>

                        <div className="font-mono font-semibold text-slate-900">
                          {corredor.tiempo}
                        </div>

                        <div>
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {corredor.estado}
                          </span>
                        </div>
                      </div>
                    )

                    if (corredor.athlete_id) {
                      return (
                        <Link
                          key={corredor.id}
                          to={`/corredor/${corredor.athlete_id}`}
                          className="block"
                        >
                          {fila}
                        </Link>
                      )
                    }

                    return <div key={corredor.id}>{fila}</div>
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}