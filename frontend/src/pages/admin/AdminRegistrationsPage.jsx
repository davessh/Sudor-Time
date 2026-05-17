import { useEffect, useMemo, useState } from 'react'
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

  const [filtroTalla, setFiltroTalla] = useState('')
  const [filtroModalidad, setFiltroModalidad] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const tallas = useMemo(() => {
    return Array.from(new Set(registros.map((registro) => registro.talla_playera || 'Sin talla'))).sort()
  }, [registros])

  const modalidades = useMemo(() => {
    const mapa = new Map()
    registros.forEach((registro) => {
      if (registro.modality_id) mapa.set(registro.modality_id, registro.modalidad_nombre || `Modalidad ${registro.modality_id}`)
    })
    return Array.from(mapa.entries()).map(([value, label]) => ({ value, label }))
  }, [registros])

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return registros.filter((registro) => {
      const tallaActual = registro.talla_playera || 'Sin talla'
      const coincideTalla = !filtroTalla || tallaActual === filtroTalla
      const coincideModalidad = !filtroModalidad || String(registro.modality_id) === String(filtroModalidad)
      const nombreCompleto = `${registro.participante_nombre} ${registro.participante_apellido_paterno} ${registro.participante_apellido_materno || ''} ${registro.numero_competidor || ''} ${registro.correo || ''}`.toLowerCase()
      const coincideBusqueda = !texto || nombreCompleto.includes(texto)

      return coincideTalla && coincideModalidad && coincideBusqueda
    })
  }, [registros, filtroTalla, filtroModalidad, busqueda])

  function limpiarFiltros() {
    setFiltroTalla('')
    setFiltroModalidad('')
    setBusqueda('')
  }

  function handleNumeroChange(registrationId, value) {
    setRegistros((prev) => prev.map((registro) => registro.id === registrationId ? { ...registro, numeroEditable: value } : registro))
  }

  function handleTagChange(registrationId, value) {
    setRegistros((prev) => prev.map((registro) => registro.id === registrationId ? { ...registro, tagIdEditable: value } : registro))
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
              <button
                type="button"
                key={`${item.nombre}-${index}`}
                onClick={() => title === 'Por talla' ? setFiltroTalla(item.nombre) : undefined}
                className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                <span>{item.nombre}</span>
                <span className="font-bold">{item.total}</span>
              </button>
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

  if (!evento) {
    return (
      <AdminLayout title="Inscritos" subtitle="Evento no encontrado.">
        <p className="text-red-600">{error || 'No se encontró el evento solicitado.'}</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Inscritos por evento" subtitle={`${evento.nombre} · ${evento.fecha} · ${evento.lugar}`}>
      {error && <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-700">Error: {error}</p>}

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white">
          <p className="text-sm uppercase tracking-widest text-slate-300">Total inscritos</p>
          <p className="mt-2 text-4xl font-black">{stats?.total_inscritos ?? registros.length}</p>
          <p className="mt-2 text-sm text-slate-300">Mostrando {registrosFiltrados.length} con filtros</p>
        </div>
        <StatBox title="Por modalidad" items={stats?.por_modalidad} />
        <StatBox title="Por categoría" items={stats?.por_categoria} />
        <StatBox title="Por talla" items={stats?.por_talla} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Listado de inscritos</h2>
            <p className="mt-1 text-sm text-slate-500">Filtra por talla de playera, modalidad o busca por nombre, número o correo.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {registrosFiltrados.length} de {registros.length} inscritos
          </span>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar corredor..." className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 md:col-span-2" />
          <select value={filtroTalla} onChange={(e) => setFiltroTalla(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900">
            <option value="">Todas las tallas</option>
            {tallas.map((talla) => <option key={talla} value={talla}>{talla}</option>)}
          </select>
          <select value={filtroModalidad} onChange={(e) => setFiltroModalidad(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900">
            <option value="">Todas las modalidades</option>
            {modalidades.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button type="button" onClick={limpiarFiltros} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-100 md:col-span-4 xl:col-span-1">
            Limpiar filtros
          </button>
        </div>

        {registrosFiltrados.length === 0 ? (
          <p className="text-slate-500">No hay inscritos que coincidan con los filtros.</p>
        ) : (
          <div className="space-y-4">
            {registrosFiltrados.map((registro) => (
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
                    <input type="text" value={registro.numeroEditable} onChange={(e) => handleNumeroChange(registro.id, e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Tag</label>
                    <select value={registro.tagIdEditable} onChange={(e) => handleTagChange(registro.id, e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900">
                      <option value="">Sin tag</option>
                      {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.codigo}</option>)}
                    </select>
                  </div>

                  <Info label="Modalidad" value={registro.modalidad_nombre || 'Sin modalidad'} />
                  <Info label="Categoría" value={registro.categoria_nombre || 'Sin categoría'} />
                  <Info label="Talla" value={registro.talla_playera || 'Sin talla'} />
                </div>

                <div className="mt-5 flex justify-end">
                  <button type="button" onClick={() => guardarCambios(registro)} disabled={savingId === registro.id} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
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
