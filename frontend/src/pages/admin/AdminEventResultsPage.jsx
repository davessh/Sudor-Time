import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getEventById } from '../../api/events'
import { getResultsByEvent } from '../../api/results'

export default function AdminEventResultsPage() {
  const { id } = useParams()

  const [evento, setEvento] = useState(null)
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [eventoData, resultadosData] = await Promise.all([
        getEventById(id),
        getResultsByEvent(id),
      ])

      setEvento(eventoData)
      setResultados(resultadosData)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los resultados')
    } finally {
      setLoading(false)
    }
  }

  function formatDateTime(value) {
    if (!value) return 'Sin fecha'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const resultadosFiltrados = useMemo(() => {
    return resultados.filter((resultado) => {
      const nombreCompleto =
        `${resultado.nombre || ''} ${resultado.apellido || ''}`.toLowerCase()

      const numero = String(resultado.numero || '').toLowerCase()
      const texto = busqueda.toLowerCase().trim()

      if (!texto) return true

      return nombreCompleto.includes(texto) || numero.includes(texto)
    })
  }, [resultados, busqueda])

  if (loading) {
    return (
      <AdminLayout
        title="Resultados"
        subtitle="Cargando información del evento..."
      >
        <p className="text-slate-500">Cargando resultados...</p>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout
        title="Resultados"
        subtitle="Ocurrió un problema al cargar la información."
      >
        <p className="text-red-600">Error: {error}</p>
      </AdminLayout>
    )
  }

  if (!evento) {
    return (
      <AdminLayout title="Resultados" subtitle="Evento no encontrado.">
        <p className="text-slate-500">No se encontró el evento solicitado.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Resultados del evento"
      subtitle={`${evento.nombre} · ${evento.fecha} · ${evento.lugar}`}
      actions={
  <div className="flex flex-wrap gap-3">
    <Link
      to={`/admin/eventos/${evento.id}/inscritos`}
      className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-100"
    >
      Ver inscritos
    </Link>

    <Link
      to={`/admin/eventos/${evento.id}/resultados/print`}
      target="_blank"
      rel="noreferrer"
      className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-100"
    >
      Imprimir PDF
    </Link>

    <button
      type="button"
      onClick={loadData}
      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
    >
      Recargar
    </button>
  </div>
}
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Clasificación general</h2>
            <p className="mt-2 text-slate-500">
              Resultados generados a partir de la primera lectura por tag.
            </p>
          </div>

          <div className="w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Buscar por nombre o número"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {resultados.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <p className="text-lg font-semibold">Aún no hay resultados</p>
            <p className="mt-2 text-sm text-slate-500">
              Cuando lleguen lecturas válidas y resueltas, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-7 bg-slate-100 px-6 py-4 text-sm font-semibold text-slate-600 md:grid">
              <div>Posición</div>
              <div>Nombre</div>
              <div>Número</div>
              <div>Categoría</div>
              <div>Distancia</div>
              <div>Tag</div>
              <div>Timestamp</div>
            </div>

            <div className="divide-y divide-slate-200">
              {resultadosFiltrados.map((resultado, index) => (
                <div
                  key={`${resultado.athlete_id || resultado.tag_code}-${index}`}
                  className="grid gap-3 px-6 py-5 md:grid-cols-7 md:items-center"
                >
                  <div className="font-bold text-slate-900">
                    #{resultado.posicion}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {resultado.nombre || 'Sin nombre'} {resultado.apellido || ''}
                    </p>
                    <p className="text-sm text-slate-500 md:hidden">
                      {resultado.categoria || 'Sin categoría'} ·{' '}
                      {resultado.distancia || 'Sin distancia'}
                    </p>
                  </div>

                  <div className="text-slate-700">
                    {resultado.numero || 'Sin número'}
                  </div>

                  <div className="hidden text-slate-700 md:block">
                    {resultado.categoria || 'Sin categoría'}
                  </div>

                  <div className="hidden text-slate-700 md:block">
                    {resultado.distancia || 'Sin distancia'}
                  </div>

                  <div className="font-mono text-sm text-slate-700">
                    {resultado.tag_code}
                  </div>

                  <div className="text-sm text-slate-500">
                    {formatDateTime(resultado.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  )
}