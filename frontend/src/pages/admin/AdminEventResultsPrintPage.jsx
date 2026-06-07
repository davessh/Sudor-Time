import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getEventById } from '../../api/events'
import { getResultsByEvent } from '../../api/results'

export default function AdminEventResultsPrintPage() {
  const { id } = useParams()

  const [evento, setEvento] = useState(null)
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const fechaImpresion = useMemo(() => {
    return new Date().toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }, [])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-8 py-10 text-slate-900">
        <p className="text-lg font-semibold">Cargando resultados...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white px-8 py-10 text-slate-900">
        <p className="text-lg font-semibold text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-white px-8 py-10 text-slate-900">
        <p className="text-lg font-semibold">Evento no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-8 py-10 text-slate-900">
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }

            body {
              background: white !important;
            }

            @page {
              size: A4 portrait;
              margin: 14mm;
            }
          }
        `}
      </style>

      <div className="no-print mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Imprimir / Guardar PDF
        </button>

        <button
          type="button"
          onClick={() => window.close()}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold"
        >
          Cerrar
        </button>
      </div>

      <header className="border-b border-slate-300 pb-4">
        <h1 className="text-3xl font-bold">Resultados oficiales</h1>
        <p className="mt-2 text-lg font-semibold">{evento.nombre}</p>
        <p className="mt-1 text-sm text-slate-600">
          Fecha del evento: {evento.fecha}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Lugar: {evento.lugar}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Fecha de impresión: {fechaImpresion}
        </p>
      </header>

      <section className="mt-6">
        {resultados.length === 0 ? (
          <p className="text-sm text-slate-600">
            No hay resultados disponibles para este evento.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="px-2 py-3 text-left">Pos.</th>
                <th className="px-2 py-3 text-left">Nombre</th>
                <th className="px-2 py-3 text-left">Número</th>
                <th className="px-2 py-3 text-left">Categoría</th>
                <th className="px-2 py-3 text-left">Distancia</th>
                <th className="px-2 py-3 text-left">Tag</th>
                <th className="px-2 py-3 text-left">Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {resultados.map((resultado, index) => (
                <tr
                  key={`${resultado.athlete_id || resultado.tag_code}-${index}`}
                  className="border-b border-slate-200"
                >
                  <td className="px-2 py-3 font-semibold">
                    #{resultado.lugar_general || resultado.posicion}
                  </td>
                  <td className="px-2 py-3">
                    {resultado.nombre || 'Sin nombre'} {resultado.apellido_paterno || resultado.apellido || ''} {resultado.apellido_materno || ''}
                  </td>
                  <td className="px-2 py-3">
                    {resultado.numero_competidor || resultado.numero || 'Sin número'}
                  </td>
                  <td className="px-2 py-3">
                    {resultado.categoria_nombre || resultado.categoria || 'Sin categoría'}
                  </td>
                  <td className="px-2 py-3">
                    {resultado.modalidad_nombre || resultado.distancia || 'Sin distancia'}
                  </td>
                  <td className="px-2 py-3 font-mono">
                    {resultado.tag_code}
                  </td>
                  <td className="px-2 py-3">
                    {formatDateTime(resultado.meta_corredor || resultado.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="mt-8 border-t border-slate-300 pt-4 text-xs text-slate-500">
        Documento generado desde SudorTime Admin.
      </footer>
    </div>
  )
}
