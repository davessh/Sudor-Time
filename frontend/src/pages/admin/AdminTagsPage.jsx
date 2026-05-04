import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getTags, createTag } from '../../api/tags'

export default function AdminTagsPage() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '',
  })

  useEffect(() => {
    loadTags()
  }, [])

  async function loadTags() {
    try {
      setLoading(true)
      setError('')

      const data = await getTags()
      setTags(data)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los tags')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { value } = e.target

    setFormData({
      codigo: value.toUpperCase(),
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.codigo.trim()) return

    try {
      setSubmitting(true)
      setError('')

      await createTag({
        codigo: formData.codigo.trim(),
      })

      setFormData({ codigo: '' })
      await loadTags()
    } catch (err) {
      setError(err.message || 'No se pudo crear el tag')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout
      title="Tags"
      subtitle="Crea y consulta tags para pruebas y operación."
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Crear tag</h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Código del tag
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="Ej. TAG001"
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Creando...' : 'Crear tag'}
            </button>
          </form>

          <div className="mt-8 rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">
              Recomendación
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Usa una nomenclatura consistente, por ejemplo: TAG001, TAG002,
              TAG003, etc.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Tags registrados</h2>
            {!loading && !error && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {tags.length} tags
              </span>
            )}
          </div>

          {loading && (
            <p className="mt-6 text-slate-500">Cargando tags...</p>
          )}

          {error && (
            <p className="mt-6 text-red-600">Error: {error}</p>
          )}

          {!loading && !error && tags.length === 0 && (
            <p className="mt-6 text-slate-500">No hay tags registrados.</p>
          )}

          {!loading && !error && tags.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2 bg-slate-100 px-6 py-4 text-sm font-semibold text-slate-600">
                <div>ID</div>
                <div>Código</div>
              </div>

              <div className="divide-y divide-slate-200">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="grid grid-cols-2 px-6 py-4"
                  >
                    <div className="font-medium text-slate-700">{tag.id}</div>
                    <div className="font-semibold text-slate-900">{tag.codigo}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}