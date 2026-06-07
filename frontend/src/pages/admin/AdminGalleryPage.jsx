import { useEffect, useState } from 'react'
import { ExternalLink, ImagePlus, Trash2 } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getApiAssetUrl } from '../../api/client'
import {
  createGalleryAlbum,
  deleteGalleryAlbum,
  getAdminGalleryAlbums,
  updateGalleryAlbum,
  uploadGalleryCover,
} from '../../api/gallery'

const emptyForm = {
  titulo: '',
  descripcion: '',
  facebook_url: '',
  fecha: '',
  visible: true,
  orden: 0,
}

export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [coverFile, setCoverFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadAlbums()
  }, [])

  async function loadAlbums() {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminGalleryAlbums()
      setAlbums(data)
    } catch (err) {
        setError(err.message || 'No se pudieron cargar los álbumes')
    } finally {
      setLoading(false)
    }
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function normalizePayload(values) {
    return {
      titulo: values.titulo.trim(),
      descripcion: values.descripcion.trim() || null,
      facebook_url: values.facebook_url.trim(),
      fecha: values.fecha || null,
      visible: Boolean(values.visible),
      orden: Number(values.orden || 0),
    }
  }

  function showSuccess(message) {
    setError('')
    setSuccess(message)
  }

  function showError(err, fallback) {
    setSuccess('')
    setError(err.message || fallback)
  }

  async function handleCreate(event) {
    event.preventDefault()

    if (!form.titulo.trim() || !form.facebook_url.trim()) {
      setError('Agrega título y enlace de Facebook.')
      return
    }

    try {
      setSaving('create')
      let created = await createGalleryAlbum(normalizePayload(form))
      if (coverFile) {
        created = await uploadGalleryCover(created.id, coverFile)
      }
      setAlbums((current) => [created, ...current])
      setForm(emptyForm)
      setCoverFile(null)
      showSuccess('Álbum creado correctamente.')
    } catch (err) {
      showError(err, 'No se pudo crear el álbum')
    } finally {
      setSaving('')
    }
  }

  async function handleAlbumUpdate(albumId, values) {
    try {
      setSaving(`save-${albumId}`)
      const updated = await updateGalleryAlbum(albumId, normalizePayload(values))
      setAlbums((current) => current.map((album) => (album.id === albumId ? updated : album)))
      showSuccess('Álbum actualizado.')
    } catch (err) {
      showError(err, 'No se pudo actualizar el álbum')
    } finally {
      setSaving('')
    }
  }

  async function handleCoverUpload(albumId, file) {
    if (!file) return

    try {
      setSaving(`cover-${albumId}`)
      const updated = await uploadGalleryCover(albumId, file)
      setAlbums((current) => current.map((album) => (album.id === albumId ? updated : album)))
      showSuccess('Portada actualizada.')
    } catch (err) {
      showError(err, 'No se pudo subir la portada')
    } finally {
      setSaving('')
    }
  }

  async function handleDelete(albumId) {
    if (!window.confirm('¿Eliminar este álbum de la galería?')) return

    try {
      setSaving(`delete-${albumId}`)
      await deleteGalleryAlbum(albumId)
      setAlbums((current) => current.filter((album) => album.id !== albumId))
      showSuccess('Álbum eliminado.')
    } catch (err) {
      showError(err, 'No se pudo eliminar el álbum')
    } finally {
      setSaving('')
    }
  }

  return (
    <AdminLayout
      title="Galería"
      subtitle="Configura tarjetas con enlace a álbumes de Facebook para la página pública de galería."
    >
      {(error || success) && (
        <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-semibold ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {error || success}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-slate-950">Nuevo álbum</h2>
          <p className="mt-1 text-sm text-slate-500">Pega el enlace del álbum de Facebook y sube una portada clara.</p>
        </div>

        <form onSubmit={handleCreate} className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            <Field label="Título">
              <input name="titulo" value={form.titulo} onChange={handleFormChange} className={inputClass()} placeholder="Carrera Sudor Cachanilla 2026" />
            </Field>
            <Field label="Enlace de Facebook">
              <input name="facebook_url" value={form.facebook_url} onChange={handleFormChange} className={inputClass()} placeholder="https://www.facebook.com/..." />
            </Field>
            <Field label="Descripción">
              <textarea name="descripcion" value={form.descripcion} onChange={handleFormChange} className={`${inputClass()} min-h-28 resize-y`} placeholder="Resumen corto del album o evento." />
            </Field>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha">
                <input type="date" name="fecha" value={form.fecha} onChange={handleFormChange} className={inputClass()} />
              </Field>
              <Field label="Orden">
                <input type="number" name="orden" value={form.orden} onChange={handleFormChange} className={inputClass()} />
              </Field>
            </div>
            <Field label="Portada">
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} className={inputClass()} />
            </Field>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              <input type="checkbox" name="visible" checked={form.visible} onChange={handleFormChange} className="h-4 w-4 accent-[#6A1A24]" />
              Publicar en la galería
            </label>
            <button disabled={saving === 'create'} className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-60">
              {saving === 'create' ? 'Guardando...' : 'Crear álbum'}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">Álbumes configurados</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{albums.length} total</span>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando galería...</p>
        ) : albums.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Todavía no hay álbumes configurados.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {albums.map((album) => (
              <AlbumEditor
                key={[
                  album.id,
                  album.titulo,
                  album.descripcion,
                  album.facebook_url,
                  album.fecha,
                  album.visible,
                  album.orden,
                  album.imagen_portada,
                ].join('-')}
                album={album}
                saving={saving}
                onSave={(values) => handleAlbumUpdate(album.id, values)}
                onCoverUpload={(file) => handleCoverUpload(album.id, file)}
                onDelete={() => handleDelete(album.id)}
              />
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  )
}

function AlbumEditor({ album, saving, onSave, onCoverUpload, onDelete }) {
  const [values, setValues] = useState({
    titulo: album.titulo || '',
    descripcion: album.descripcion || '',
    facebook_url: album.facebook_url || '',
    fecha: album.fecha || '',
    visible: Boolean(album.visible),
    orden: album.orden || 0,
  })

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 md:grid-cols-[240px_1fr]">
        <div className="relative min-h-64 bg-slate-100 md:min-h-full">
          {album.imagen_portada ? (
            <img src={getApiAssetUrl(album.imagen_portada)} alt={album.titulo} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 p-6 text-center text-sm font-semibold text-slate-400">
              <ImagePlus className="h-8 w-8" />
              Sin portada
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título">
              <input name="titulo" value={values.titulo} onChange={handleChange} className={inputClass()} />
            </Field>
            <Field label="Fecha">
              <input type="date" name="fecha" value={values.fecha} onChange={handleChange} className={inputClass()} />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field label="Enlace de Facebook">
              <input name="facebook_url" value={values.facebook_url} onChange={handleChange} className={inputClass()} />
            </Field>
            <Field label="Orden">
              <input type="number" name="orden" value={values.orden} onChange={handleChange} className={inputClass()} />
            </Field>
          </div>
          <Field label="Descripción">
            <textarea name="descripcion" value={values.descripcion} onChange={handleChange} className={`${inputClass()} min-h-24 resize-y`} />
          </Field>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => onCoverUpload(event.target.files?.[0] || null)}
              className={inputClass()}
            />
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              <input type="checkbox" name="visible" checked={values.visible} onChange={handleChange} className="h-4 w-4 accent-[#6A1A24]" />
              Visible
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={saving === `save-${album.id}`}
              onClick={() => onSave(values)}
              className="flex-1 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {saving === `save-${album.id}` ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <a
              href={album.facebook_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir
            </a>
            <button
              type="button"
              disabled={saving === `delete-${album.id}`}
              onClick={onDelete}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function inputClass() {
  return 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950'
}
