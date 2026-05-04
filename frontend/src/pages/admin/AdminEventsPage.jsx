import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getEvents, createEvent } from '../../api/events'

export default function AdminEventsPage() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    fecha: '',
    lugar: '',
  })

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      setLoading(true)
      setError('')

      const data = await getEvents()
      setEventos(data)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los eventos')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      await createEvent(formData)

      setFormData({
        nombre: '',
        fecha: '',
        lugar: '',
      })

      loadEvents()
    } catch (err) {
      setError(err.message || 'No se pudo crear el evento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout
      title="Eventos"
      subtitle="Crea y administra eventos desde el panel."
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Crear evento</h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Lugar
              </label>
              <input
                type="text"
                name="lugar"
                value={formData.lugar}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Creando...' : 'Crear evento'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Eventos registrados</h2>

          {loading && (
            <p className="mt-6 text-slate-500">Cargando eventos...</p>
          )}

          {error && (
            <p className="mt-6 text-red-600">Error: {error}</p>
          )}

          {!loading && !error && eventos.length === 0 && (
            <p className="mt-6 text-slate-500">No hay eventos registrados.</p>
          )}

          {!loading && !error && eventos.length > 0 && (
            <div className="mt-6 space-y-4">
              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <h3 className="text-xl font-bold">{evento.nombre}</h3>
                  <p className="mt-2 text-slate-500">
                    {evento.fecha} · {evento.lugar}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to={`/evento/${evento.id}`}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                    >
                      Ver público
                    </Link>

                    <Link
                    to={`/admin/eventos/${evento.id}/resultados`}
                     className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                     >
                    Resultados
                    </Link>

                    <Link
                      to={`/admin/eventos/${evento.id}/inscritos`}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                    >
                      Inscritos
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}