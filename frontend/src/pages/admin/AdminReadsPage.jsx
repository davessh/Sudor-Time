import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getReads, getReadDetail } from '../../api/reads'

export default function AdminReadsPage() {
  const [lecturas, setLecturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReads()
  }, [])

  async function loadReads() {
    try {
      setLoading(true)
      setError('')

      const reads = await getReads()

      const details = await Promise.all(
        reads.map(async (read) => {
          try {
            const detail = await getReadDetail(read.id)
            return detail
          } catch {
            return {
              read_id: read.id,
              tag_code: read.tag_code,
              timestamp: read.timestamp,
              event_id: read.event_id,
              athlete_id: null,
              athlete_nombre: null,
              athlete_apellido: null,
              numero: null,
              categoria: null,
              distancia: null,
            }
          }
        })
      )

      const sorted = [...details].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )

      setLecturas(sorted)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las lecturas')
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

  function getEstado(lectura) {
    return lectura.athlete_id ? 'Resuelta' : 'Sin resolver'
  }

  return (
    <AdminLayout
      title="Lecturas"
      subtitle="Consulta las lecturas recibidas y valida si fueron resueltas correctamente."
      actions={
        <button
          type="button"
          onClick={loadReads}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Recargar
        </button>
      }
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Lecturas registradas</h2>

          {!loading && !error && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
              {lecturas.length} lecturas
            </span>
          )}
        </div>

        {loading && (
          <p className="mt-6 text-slate-500">Cargando lecturas...</p>
        )}

        {error && (
          <p className="mt-6 text-red-600">Error: {error}</p>
        )}

        {!loading && !error && lecturas.length === 0 && (
          <p className="mt-6 text-slate-500">No hay lecturas registradas.</p>
        )}

        {!loading && !error && lecturas.length > 0 && (
          <div className="mt-6 space-y-4">
            {lecturas.map((lectura) => (
              <div
                key={lectura.read_id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">
                        {lectura.tag_code}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          lectura.athlete_id
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {getEstado(lectura)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Lectura #{lectura.read_id}
                    </p>
                  </div>

                  <div className="text-sm text-slate-500">
                    {formatDateTime(lectura.timestamp)}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Evento
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {lectura.event_id}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Corredor
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {lectura.athlete_nombre
                        ? `${lectura.athlete_nombre} ${lectura.athlete_apellido || ''}`
                        : 'No resuelto'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Número
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {lectura.numero || 'Sin número'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Categoría
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {lectura.categoria || 'Sin categoría'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Distancia
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {lectura.distancia || 'Sin distancia'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  )
}