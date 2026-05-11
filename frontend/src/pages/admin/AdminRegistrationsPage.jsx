import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getEventById, getEventStats } from '../../api/events'
import { getEventRegistrations, updateRegistration } from '../../api/registrations'
import { getTags } from '../../api/tags'

export default function AdminRegistrationsPage() {
  const { id } = useParams()

  const [evento, setEvento] = useState(null)
  const [stats, setStats] = useState(null)
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

      const [eventoData, registrosData, tagsData, statsData] = await Promise.all([
        getEventById(id),
        getEventRegistrations(id),
        getTags(),
        getEventStats(id),
      ])

      const registrosAdaptados = registrosData.map((registro) => ({
        ...registro,
        numeroEditable: registro.numero_competidor || '',
        tagIdEditable: registro.tag_id || '',
      }))

      setEvento(eventoData)
      setRegistros(registrosAdaptados)
      setTags(tagsData)
      setStats(statsData)
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información')
    } finally {
      setLoading(false)
    }
  }

  function handleNumeroChange(registrationId, value) {
    setRegistros((prev) =>
      prev.map((registro) =>
        registro.id === registrationId ? { ...registro, numeroEditable: value } : registro
      )
    )
  }

  function handleTagChange(registrationId, value) {
    setRegistros((prev) =>
      prev.map((registro) =>
        registro.id === registrationId ? { ...registro, tagIdEditable: value } : registro
      )
    )
  }

  async function guardarCambios(registro) {
    try {
      setSavingId(registro.id)
      setError('')

      await updateRegistration(registro.id, {
        event_id: Number(id),
        participant_id: registro.participant_id,
        modality_id: registro.modality_id,
        product_id: registro.product_id,
        category_id: registro.category_id,
        numero_competidor: registro.numeroEditable || null,
        tag_id: registro.tagIdEditable ? Number(registro.tagIdEditable) : null,
        talla_playera: registro.talla_playera || null,
      })

      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la inscripción')
    } finally {
      setSavingId(null)
    }
  }

  function StatBox({ title, items }) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-900">{title}</h3>
        {items?.length ? (
          <div className="mt-3 space-y-2">
            {items.map((item, index) => (
              <div key={`${item.nombre}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span>{item.nombre}</span>
                <span className="font-bold">{item.total}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Sin datos.</p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <AdminLayout title="Inscritos" subtitle="Cargando información del evento...">
        <p className="text-slate-500">Cargando inscritos...</p>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Inscritos" subtitle="Ocurrió un problema al cargar la información.">
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
    <AdminLayout title="Inscritos por evento" subtitle={`${evento.nombre} · ${evento.fecha} · ${evento.lugar}`}>
      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white">
          <p className="text-sm uppercase tracking-widest text-slate-300">Total inscritos</p>
          <p className="mt-2 text-4xl font-black">{stats?.total_inscritos ?? registros.length}</p>
        </div>
        <StatBox title="Por modalidad" items={stats?.por_modalidad} />
        <StatBox title="Por categoría" items={stats?.por_categoria} />
        <StatBox title="Por talla" items={stats?.por_talla} />
      </section>

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
              <div key={registro.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="grid gap-5 lg:grid-cols-7">
                  <div className="lg:col-span-2">
                    <p className="text-lg font-bold">
                      {registro.participante_nombre} {registro.participante_apellido_paterno} {registro.participante_apellido_materno || ''}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {registro.sexo || 'Sexo no definido'} · {registro.edad_evento ?? 'Edad no definida'} años
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {registro.telefono || 'Sin teléfono'} · {registro.correo || 'Sin correo'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Número</label>
                    <input
                      type="text"
                      value={registro.numeroEditable}
                      onChange={(e) => handleNumeroChange(registro.id, e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Tag</label>
                    <select
                      value={registro.tagIdEditable}
                      onChange={(e) => handleTagChange(registro.id, e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    >
                      <option value="">Sin tag</option>
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>{tag.codigo}</option>
                      ))}
                    </select>
                  </div>

                  <Info label="Modalidad" value={registro.modalidad_nombre || 'Sin modalidad'} />
                  <Info label="Categoría" value={registro.categoria_nombre || 'Sin categoría'} />
                  <Info label="Talla" value={registro.talla_playera || 'Sin talla'} />
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => guardarCambios(registro)}
                    disabled={savingId === registro.id}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {savingId === registro.id ? 'Guardando...' : 'Guardar cambios'}
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

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-2 rounded-2xl bg-slate-100 px-4 py-3 font-medium">{value}</p>
    </div>
  )
}
