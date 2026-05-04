import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getEventById } from '../../api/events'
import {
  getEventRegistrations,
  updateRegistration,
} from '../../api/registrations'
import { getTags } from '../../api/tags'

export default function AdminRegistrationsPage() {
  const { id } = useParams()

  const [evento, setEvento] = useState(null)
  const [registros, setRegistros] = useState([])
  const [tags, setTags] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [eventoData, registrosData, tagsData] = await Promise.all([
        getEventById(id),
        getEventRegistrations(id),
        getTags(),
      ])

      const registrosAdaptados = registrosData.map((registro) => ({
        ...registro,
        numeroEditable: registro.numero || '',
        tagIdEditable: registro.tag_id || '',
      }))

      setEvento(eventoData)
      setRegistros(registrosAdaptados)
      setTags(tagsData)
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información')
    } finally {
      setLoading(false)
    }
  }

  function handleNumeroChange(registrationId, value) {
    setRegistros((prev) =>
      prev.map((registro) =>
        registro.registration_id === registrationId
          ? { ...registro, numeroEditable: value }
          : registro
      )
    )
  }

  function handleTagChange(registrationId, value) {
    setRegistros((prev) =>
      prev.map((registro) =>
        registro.registration_id === registrationId
          ? { ...registro, tagIdEditable: value }
          : registro
      )
    )
  }

  async function guardarCambios(registro) {
    try {
      setSavingId(registro.registration_id)
      setError('')

      await updateRegistration(registro.registration_id, {
        event_id: Number(id),
        athlete_id: registro.athlete_id,
        numero: registro.numeroEditable || null,
        categoria: registro.categoria,
        distancia: registro.distancia,
        tag_id: registro.tagIdEditable ? Number(registro.tagIdEditable) : null,
      })

      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la inscripción')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <AdminLayout
        title="Inscritos"
        subtitle="Cargando información del evento..."
      >
        <p className="text-slate-500">Cargando inscritos...</p>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout
        title="Inscritos"
        subtitle="Ocurrió un problema al cargar la información."
      >
        <p className="text-red-600">Error: {error}</p>
      </AdminLayout>
    )
  }

  if (!evento) {
    return (
      <AdminLayout title="Inscritos" subtitle="Evento no encontrado.">
        <p className="text-slate-500">No se encontró el evento solicitado.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Inscritos por evento"
      subtitle={`${evento.nombre} · ${evento.fecha} · ${evento.lugar}`}
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Listado de inscritos</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {registros.length} inscritos
          </span>
        </div>

        {registros.length === 0 ? (
          <p className="text-slate-500">No hay inscritos en este evento.</p>
        ) : (
          <div className="space-y-4">
            {registros.map((registro) => (
              <div
                key={registro.registration_id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="grid gap-5 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <p className="text-lg font-bold">
                      {registro.nombre} {registro.apellido}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Sexo: {registro.sexo || 'No definido'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Número
                    </label>
                    <input
                      type="text"
                      value={registro.numeroEditable}
                      onChange={(e) =>
                        handleNumeroChange(
                          registro.registration_id,
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Tag
                    </label>
                    <select
                      value={registro.tagIdEditable}
                      onChange={(e) =>
                        handleTagChange(
                          registro.registration_id,
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    >
                      <option value="">Sin tag</option>
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.codigo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Categoría
                    </p>
                    <p className="mt-2 rounded-2xl bg-slate-100 px-4 py-3 font-medium">
                      {registro.categoria || 'Sin categoría'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Distancia
                    </p>
                    <p className="mt-2 rounded-2xl bg-slate-100 px-4 py-3 font-medium">
                      {registro.distancia || 'Sin distancia'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => guardarCambios(registro)}
                    disabled={savingId === registro.registration_id}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {savingId === registro.registration_id
                      ? 'Guardando...'
                      : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  )
}