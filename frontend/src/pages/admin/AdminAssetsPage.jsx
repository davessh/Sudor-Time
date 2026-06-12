import { Copy, ExternalLink, FolderOpen, Pencil, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getApiAssetUrl } from '../../api/client'
import { deleteEventAsset, getEventAssets, renameEventAsset, uploadEventAsset } from '../../api/events'

function formatBytes(value) {
  const bytes = Number(value || 0)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Date(Number(value) * 1000).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState([])
  const [query, setQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState('')
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadAssets()
  }, [])

  async function loadAssets() {
    try {
      setError('')
      const data = await getEventAssets(300)
      setAssets(data.assets || [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los archivos')
    }
  }

  const filteredAssets = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return assets
    return assets.filter((asset) => (
      asset.filename.toLowerCase().includes(text)
      || asset.path.toLowerCase().includes(text)
    ))
  }, [assets, query])

  function showSuccess(message) {
    setError('')
    setSuccess(message)
  }

  function showError(err, fallback) {
    setSuccess('')
    setError(err.message || fallback)
  }

  async function handleUpload(file) {
    try {
      setUploading(true)
      const asset = await uploadEventAsset(file)
      await loadAssets()
      setPreview(asset)
      showSuccess('Archivo subido correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  async function copyPath(path) {
    try {
      await navigator.clipboard.writeText(path)
      showSuccess('Ruta copiada al portapapeles.')
    } catch {
      showSuccess(path)
    }
  }

  async function handleRename(asset) {
    const newName = editing?.filename?.trim()
    if (!newName) {
      setError('Escribe un nombre valido.')
      return
    }

    try {
      setSaving(`rename-${asset.filename}`)
      const updated = await renameEventAsset(asset.filename, newName)
      setAssets((current) => current.map((item) => (item.filename === asset.filename ? updated : item)))
      setEditing(null)
      showSuccess('Archivo renombrado. Las referencias del evento fueron actualizadas.')
    } catch (err) {
      showError(err, 'No se pudo renombrar el archivo')
    } finally {
      setSaving('')
    }
  }

  async function handleDelete(asset) {
    const confirmed = window.confirm(`Eliminar ${asset.filename}? Si esta imagen estaba asignada a un evento, se limpiara esa referencia.`)
    if (!confirmed) return

    try {
      setSaving(`delete-${asset.filename}`)
      await deleteEventAsset(asset.filename)
      setAssets((current) => current.filter((item) => item.filename !== asset.filename))
      if (preview?.filename === asset.filename) setPreview(null)
      showSuccess('Archivo eliminado.')
    } catch (err) {
      showError(err, 'No se pudo eliminar el archivo')
    } finally {
      setSaving('')
    }
  }

  return (
    <AdminLayout
      title="Archivos"
      subtitle="Mini explorador del persistent disk para imagenes usadas en eventos, kits, dorsales y convocatorias."
      actions={
        <label className="inline-flex cursor-pointer items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Subiendo...' : 'Subir archivo'}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) handleUpload(file)
              event.target.value = ''
            }}
            className="sr-only"
          />
        </label>
      }
    >
      {(error || success) && (
        <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-semibold ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {error || success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Persistent disk</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{assets.length} archivo(s)</h2>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 sm:max-w-xs"
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <FolderOpen className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 font-black text-slate-900">No hay archivos para mostrar</p>
                <p className="mt-1 text-sm text-slate-500">Sube una imagen para empezar la biblioteca.</p>
              </div>
            ) : filteredAssets.map((asset) => {
              const isEditing = editing?.original === asset.filename
              return (
                <article key={asset.path} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button type="button" onClick={() => setPreview(asset)} className="block w-full bg-slate-100">
                    <img src={getApiAssetUrl(asset.path)} alt={asset.filename} className="aspect-[4/3] w-full object-cover" />
                  </button>
                  <div className="space-y-3 p-4">
                    {isEditing ? (
                      <input
                        value={editing.filename}
                        onChange={(event) => setEditing((current) => ({ ...current, filename: event.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-slate-900"
                      />
                    ) : (
                      <p className="truncate font-black text-slate-950">{asset.filename}</p>
                    )}
                    <div className="text-xs font-semibold leading-5 text-slate-500">
                      <p>{formatBytes(asset.size)}</p>
                      <p>{formatDate(asset.updated_at)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {isEditing ? (
                        <>
                          <button type="button" onClick={() => handleRename(asset)} disabled={saving === `rename-${asset.filename}`} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                            Guardar
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => setEditing({ original: asset.filename, filename: asset.filename })} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50">
                            <Pencil className="mr-1 inline h-3.5 w-3.5" />
                            Renombrar
                          </button>
                          <button type="button" onClick={() => copyPath(asset.path)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50">
                            <Copy className="mr-1 inline h-3.5 w-3.5" />
                            Copiar ruta
                          </button>
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <button type="button" onClick={() => handleDelete(asset)} disabled={saving === `delete-${asset.filename}`} className="w-full rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60">
                        <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Vista previa</p>
            {preview ? (
              <div className="mt-4">
                <img src={getApiAssetUrl(preview.path)} alt={preview.filename} className="w-full rounded-2xl border border-slate-200 object-cover" />
                <h3 className="mt-4 break-words text-xl font-black text-slate-950">{preview.filename}</h3>
                <p className="mt-2 break-all text-sm font-semibold text-slate-500">{preview.path}</p>
                <div className="mt-4 grid gap-2">
                  <button type="button" onClick={() => copyPath(preview.path)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                    Copiar ruta
                  </button>
                  <a href={getApiAssetUrl(preview.path)} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-bold hover:bg-slate-50">
                    <ExternalLink className="mr-2 inline h-4 w-4" />
                    Abrir imagen
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <FolderOpen className="mx-auto h-9 w-9 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Selecciona una imagen para verla aqui.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </AdminLayout>
  )
}
