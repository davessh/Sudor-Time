import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getApiAssetUrl } from '../../api/client'
import {
  createEventKitItem,
  deleteEventKitItem,
  getEventAssets,
  getEventSetup,
  updateEvent,
  updateEventKitItem,
  uploadEventAsset,
  uploadEventConvocatoria,
  uploadEventDorsal,
  uploadEventDorsalPersonalizacion,
  uploadEventHero,
  uploadEventKitItemImage,
  uploadEventMedalla,
  uploadEventPlayera,
  uploadEventPortada,
} from '../../api/events'
import { createModality, deleteModality } from '../../api/modalities'
import { createCategory, deleteCategory } from '../../api/categories'
import { createProduct, deleteProduct } from '../../api/products'
import { createShirtSize, deleteShirtSize } from '../../api/shirtSizes'

const initialEventForm = {
  nombre: '',
  slug: '',
  descripcion: '',
  fecha: '',
  lugar: '',
  hora_salida: '',
  organizador: '',
  inscripciones_abiertas: true,
  cuenta_regresiva_at: '',
  color_primario: '#6A1A24',
  color_secundario: '#15070A',
  color_acento: '#F4D35E',
  imagen_hero: '',
  imagen_portada: '',
  imagen_convocatoria: '',
  imagen_playera: '',
  imagen_medalla: '',
  imagen_dorsal: '',
  dorsal_personalizacion_enabled: false,
  dorsal_personalizacion_max_chars: '20',
  dorsal_personalizacion_free_limit: '0',
  dorsal_personalizacion_price: '0',
  dorsal_personalizacion_image: '',
  dorsal_personalizacion_text_color: '#111827',
  dorsal_personalizacion_text_top: '50',
  dorsal_personalizacion_text_size: '36',
}

const initialModalityForm = {
  nombre: '',
  descripcion: '',
  precio: '0',
  distancia_km: '',
  incluye_playera: false,
}

const initialCategoryForm = {
  modality_ids: [],
  nombre: '',
  sexo_mode: 'ambos',
  edad_min: '',
  edad_max: '',
}

const initialProductForm = {
  modality_id: '',
  nombre: '',
  precio: '0',
  incluye_playera: false,
}

const initialShirtForm = {
  talla: '',
  stock: '',
  activa: true,
}

const initialKitItemForm = {
  titulo: '',
  descripcion: '',
  imagen: '',
  orden: '0',
  visible: true,
}

const setupSections = [
  { id: 'basicos', label: 'Basicos', description: 'Nombre, fecha, lugar y estado.' },
  { id: 'modalidades', label: 'Modalidades', description: 'Distancias y precios base.' },
  { id: 'categorias', label: 'Categorias', description: 'Edad, sexo y clasificacion.' },
  { id: 'identidad', label: 'Identidad visual', description: 'Hero, portada y colores.' },
  { id: 'convocatoria', label: 'Convocatoria', description: 'Imagen oficial del evento.' },
  { id: 'kit', label: 'Kit del corredor', description: 'Beneficios visibles al corredor.' },
  { id: 'dorsal', label: 'Dorsal', description: 'Base y personalizacion.' },
  { id: 'inventario', label: 'Inventario', description: 'Tallas y paquetes.' },
]

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  return Number(value)
}

function SectionCard({ id, title, subtitle, children }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-start-2">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function inputClass() {
  return 'w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900'
}

function AssetUpload({ title, imageUrl, emptyText, file, onFileChange, onSubmit, saving, buttonText }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="font-bold text-slate-900">{title}</h3>
      {imageUrl ? (
        <img src={getApiAssetUrl(imageUrl)} alt={title} className="mt-3 h-44 w-full rounded-2xl border border-slate-200 object-cover" />
      ) : (
        <div className="mt-3 flex h-44 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input type="file" accept="image/*" onChange={(e) => onFileChange(e.target.files?.[0] || null)} className={inputClass()} />
        {file && <p className="text-xs font-semibold text-slate-500">{file.name}</p>}
        <button disabled={saving} className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
          {saving ? 'Subiendo...' : buttonText}
        </button>
      </form>
    </div>
  )
}

function ImageLibraryField({ label, value, placeholder, onChange, onUpload, onOpenLibrary, saving }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Field label={label}>
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass()} />
      </Field>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onOpenLibrary}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-900 hover:bg-slate-100"
        >
          Elegir de biblioteca
        </button>
        <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90">
          {saving ? 'Subiendo...' : 'Subir nueva'}
          <input
            type="file"
            accept="image/*"
            disabled={saving}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
              e.target.value = ''
            }}
            className="sr-only"
          />
        </label>
      </div>
      {value ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={getApiAssetUrl(value)} alt={label} className="h-36 w-full object-cover" />
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <p className="truncate text-xs font-semibold text-slate-500">{value}</p>
            <button type="button" onClick={() => onChange('')} className="text-xs font-black text-red-700">Quitar</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AssetLibraryPanel({ assets, onUpload, onOpenLibrary, uploading }) {
  const previewAssets = assets.slice(0, 4)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">Imagenes subidas</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{assets.length} archivo(s) en el persistent disk.</p>
        </div>
        <label className="shrink-0 cursor-pointer rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
          {uploading ? 'Subiendo...' : 'Subir'}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
              e.target.value = ''
            }}
            className="sr-only"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={onOpenLibrary}
        className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800 transition hover:border-slate-900 hover:bg-white"
      >
        Abrir biblioteca visual
      </button>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {assets.length === 0 ? (
          <p className="col-span-4 rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs font-semibold text-slate-500">
            Todavia no hay imagenes.
          </p>
        ) : previewAssets.map((asset) => (
          <button key={asset.path} type="button" onClick={onOpenLibrary} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <img src={getApiAssetUrl(asset.path)} alt={asset.filename} className="h-14 w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

function AssetLibraryModal({ open, assets, title, uploading, onUpload, onSelect, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:mx-auto sm:max-w-5xl sm:rounded-[1.75rem]">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Biblioteca de imagenes</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title || 'Selecciona una imagen'}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">Haz clic en una imagen para usarla en este campo.</p>
          </div>
          <div className="flex gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90">
              {uploading ? 'Subiendo...' : 'Subir nueva'}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onUpload(file)
                  e.target.value = ''
                }}
                className="sr-only"
              />
            </label>
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Cerrar
            </button>
          </div>
        </div>

        <div className="max-h-[68vh] overflow-y-auto p-5">
          {assets.length === 0 ? (
            <div className="flex min-h-60 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div>
                <p className="font-black text-slate-900">Todavia no hay imagenes subidas</p>
                <p className="mt-2 text-sm text-slate-500">Sube una desde este modal y quedara disponible para otros campos.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {assets.map((asset) => (
                <button
                  key={asset.path}
                  type="button"
                  onClick={() => {
                    if (onSelect) {
                      onSelect(asset.path)
                    } else {
                      window.open(getApiAssetUrl(asset.path), '_blank', 'noopener,noreferrer')
                    }
                  }}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-lg"
                >
                  <img src={getApiAssetUrl(asset.path)} alt={asset.filename} className="aspect-[4/3] w-full bg-slate-100 object-cover transition group-hover:scale-[1.03]" />
                  <div className="p-3">
                    <p className="truncate text-sm font-black text-slate-900">{asset.filename}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{asset.path}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DorsalPersonalizationPreview({ eventForm }) {
  const imageUrl = eventForm.dorsal_personalizacion_image || eventForm.imagen_dorsal
  const sampleText = 'TU FRASE'

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-900">Preview mobile</p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative aspect-[16/10] w-full">
          {imageUrl ? (
            <img src={getApiAssetUrl(imageUrl)} alt="Preview de dorsal personalizado" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-amber-50 text-center text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Plantilla default
            </div>
          )}
          <div
            className="absolute left-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2 text-center font-black uppercase leading-none tracking-wide"
            style={{
              top: `${Number(eventForm.dorsal_personalizacion_text_top || 50)}%`,
              color: eventForm.dorsal_personalizacion_text_color || '#111827',
              fontSize: `clamp(1.4rem, ${Number(eventForm.dorsal_personalizacion_text_size || 36) / 12}vw, ${Number(eventForm.dorsal_personalizacion_text_size || 36)}px)`,
            }}
          >
            {sampleText}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
        Este preview solo muestra posicion y estilo del texto; el corredor vera su propia frase en el formulario.
      </p>
    </div>
  )
}

function AdminSetupGuide({ setup }) {
  const metrics = [
    { label: 'Modalidades', value: setup.modalities?.length || 0 },
    { label: 'Categorias', value: setup.categories?.length || 0 },
    { label: 'Kit', value: setup.kit_items?.length || 0 },
    { label: 'Tallas', value: (setup.all_shirt_sizes || setup.shirt_sizes || []).length },
  ]

  return (
    <aside>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Flujo de configuracion</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {metrics.map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-xl font-black text-slate-950">{item.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
        <nav className="mt-5 space-y-1">
          {setupSections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="group flex gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-slate-50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                {index + 1}
              </span>
              <span>
                <span className="block font-black text-slate-900 group-hover:text-slate-950">{section.label}</span>
                <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">{section.description}</span>
              </span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default function AdminEventSetupPage() {
  const { id } = useParams()

  const [setup, setSetup] = useState(null)
  const [assets, setAssets] = useState([])
  const [eventForm, setEventForm] = useState(initialEventForm)
  const [modalityForm, setModalityForm] = useState(initialModalityForm)
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm)
  const [productForm, setProductForm] = useState(initialProductForm)
  const [shirtForm, setShirtForm] = useState(initialShirtForm)
  const [kitItemForm, setKitItemForm] = useState(initialKitItemForm)
  const [kitItemFiles, setKitItemFiles] = useState({})
  const [heroImageFile, setHeroImageFile] = useState(null)
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [shirtImageFile, setShirtImageFile] = useState(null)
  const [medalImageFile, setMedalImageFile] = useState(null)
  const [bibImageFile, setBibImageFile] = useState(null)
  const [bibPersonalizationImageFile, setBibPersonalizationImageFile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [assetLibraryUploading, setAssetLibraryUploading] = useState(false)
  const [assetPicker, setAssetPicker] = useState({ open: false, title: '', onSelect: null })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSetup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadSetup() {
    try {
      setLoading(true)
      setError('')
      const data = await getEventSetup(id)
      setSetup(data)
      setEventForm({
        nombre: data.nombre || '',
        slug: data.slug || '',
        descripcion: data.descripcion || '',
        fecha: data.fecha || '',
        lugar: data.lugar || '',
        hora_salida: data.hora_salida || '',
        organizador: data.organizador || '',
        inscripciones_abiertas: Boolean(data.inscripciones_abiertas),
        cuenta_regresiva_at: data.cuenta_regresiva_at ? String(data.cuenta_regresiva_at).slice(0, 16) : '',
        color_primario: data.color_primario || '#6A1A24',
        color_secundario: data.color_secundario || '#15070A',
        color_acento: data.color_acento || '#F4D35E',
        imagen_hero: data.imagen_hero || '',
        imagen_portada: data.imagen_portada || '',
        imagen_convocatoria: data.imagen_convocatoria || '',
        imagen_playera: data.imagen_playera || '',
        imagen_medalla: data.imagen_medalla || '',
        imagen_dorsal: data.imagen_dorsal || '',
        dorsal_personalizacion_enabled: Boolean(data.dorsal_personalizacion_enabled),
        dorsal_personalizacion_max_chars: String(data.dorsal_personalizacion_max_chars ?? 20),
        dorsal_personalizacion_free_limit: String(data.dorsal_personalizacion_free_limit ?? 0),
        dorsal_personalizacion_price: String(data.dorsal_personalizacion_price ?? 0),
        dorsal_personalizacion_image: data.dorsal_personalizacion_image || '',
        dorsal_personalizacion_text_color: data.dorsal_personalizacion_text_color || '#111827',
        dorsal_personalizacion_text_top: String(data.dorsal_personalizacion_text_top ?? 50),
        dorsal_personalizacion_text_size: String(data.dorsal_personalizacion_text_size ?? 36),
      })
      await loadAssets()
    } catch (err) {
      setError(err.message || 'No se pudo cargar la configuración del evento')
    } finally {
      setLoading(false)
    }
  }

  const shirtSizesForAdmin = setup?.all_shirt_sizes || setup?.shirt_sizes || []

  async function loadAssets() {
    try {
      const data = await getEventAssets()
      setAssets(data.assets || [])
    } catch (err) {
      console.warn('No se pudo cargar biblioteca de imagenes', err)
    }
  }

  const selectedModalities = useMemo(() => {
    if (!setup) return []
    return setup.modalities.filter((item) => categoryForm.modality_ids.includes(String(item.id)))
  }, [setup, categoryForm.modality_ids])

  function showError(err, fallback) {
    setSuccess('')
    setError(err.message || fallback)
  }

  function showSuccess(message) {
    setError('')
    setSuccess(message)
  }

  function handleEventChange(e) {
    const { name, type, checked, value } = e.target
    setEventForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleFormChange(setter) {
    return (e) => {
      const { name, type, checked, value } = e.target
      setter((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
  }

  function setEventImageField(name, value) {
    setEventForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function openAssetPicker(title, onSelect) {
    setAssetPicker({ open: true, title, onSelect })
  }

  function closeAssetPicker() {
    setAssetPicker({ open: false, title: '', onSelect: null })
  }

  function selectAssetFromPicker(path) {
    assetPicker.onSelect?.(path)
    closeAssetPicker()
  }

  async function uploadAssetFromPicker(file) {
    try {
      setAssetLibraryUploading(true)
      const asset = await uploadEventAsset(file)
      await loadAssets()
      if (assetPicker.onSelect) {
        assetPicker.onSelect(asset.path)
        closeAssetPicker()
        showSuccess('Imagen subida y seleccionada.')
      } else {
        showSuccess('Imagen agregada a la biblioteca.')
      }
    } catch (err) {
      showError(err, 'No se pudo subir la imagen')
    } finally {
      setAssetLibraryUploading(false)
    }
  }

  async function uploadAssetForField(fieldName, file) {
    try {
      setSaving(`asset-${fieldName}`)
      const asset = await uploadEventAsset(file)
      setEventImageField(fieldName, asset.path)
      await loadAssets()
      showSuccess('Imagen subida y seleccionada.')
    } catch (err) {
      showError(err, 'No se pudo subir la imagen')
    } finally {
      setSaving('')
    }
  }

  async function uploadAssetForKitItemForm(file) {
    try {
      setSaving('asset-kit-form')
      const asset = await uploadEventAsset(file)
      setKitItemForm((prev) => ({ ...prev, imagen: asset.path }))
      await loadAssets()
      showSuccess('Imagen subida y seleccionada para el kit.')
    } catch (err) {
      showError(err, 'No se pudo subir la imagen')
    } finally {
      setSaving('')
    }
  }

  async function uploadAssetForKitItem(itemId, file) {
    try {
      setSaving(`asset-kit-${itemId}`)
      const asset = await uploadEventAsset(file)
      setSetup((current) => ({
        ...current,
        kit_items: (current.kit_items || []).map((item) => (
          item.id === itemId ? { ...item, imagen: asset.path } : item
        )),
      }))
      await loadAssets()
      showSuccess('Imagen subida y seleccionada para el elemento del kit.')
    } catch (err) {
      showError(err, 'No se pudo subir la imagen')
    } finally {
      setSaving('')
    }
  }

  async function uploadAssetToLibrary(file) {
    try {
      setAssetLibraryUploading(true)
      await uploadEventAsset(file)
      await loadAssets()
      showSuccess('Imagen agregada a la biblioteca.')
    } catch (err) {
      showError(err, 'No se pudo subir la imagen')
    } finally {
      setAssetLibraryUploading(false)
    }
  }

  function toggleCategoryModality(modalityId) {
    const value = String(modalityId)
    setCategoryForm((prev) => {
      const selected = prev.modality_ids.includes(value)
      return {
        ...prev,
        modality_ids: selected
          ? prev.modality_ids.filter((item) => item !== value)
          : [...prev.modality_ids, value],
      }
    })
  }

  function selectAllCategoryModalities() {
    setCategoryForm((prev) => ({
      ...prev,
      modality_ids: setup.modalities.map((item) => String(item.id)),
    }))
  }

  async function saveEvent(e) {
    e.preventDefault()
    try {
      setSaving('event')
      await updateEvent(id, {
        nombre: eventForm.nombre.trim(),
        slug: eventForm.slug.trim() || null,
        descripcion: eventForm.descripcion.trim() || null,
        fecha: eventForm.fecha,
        lugar: eventForm.lugar.trim(),
        hora_salida: eventForm.hora_salida.trim() || null,
        organizador: eventForm.organizador.trim() || null,
        inscripciones_abiertas: eventForm.inscripciones_abiertas,
        cuenta_regresiva_at: eventForm.cuenta_regresiva_at || null,
        color_primario: eventForm.color_primario.trim() || null,
        color_secundario: eventForm.color_secundario.trim() || null,
        color_acento: eventForm.color_acento.trim() || null,
        imagen_hero: eventForm.imagen_hero.trim() || null,
        imagen_portada: eventForm.imagen_portada.trim() || null,
        imagen_convocatoria: eventForm.imagen_convocatoria.trim() || null,
        imagen_playera: eventForm.imagen_playera.trim() || null,
        imagen_medalla: eventForm.imagen_medalla.trim() || null,
        imagen_dorsal: eventForm.imagen_dorsal.trim() || null,
        dorsal_personalizacion_enabled: eventForm.dorsal_personalizacion_enabled,
        dorsal_personalizacion_max_chars: Number(eventForm.dorsal_personalizacion_max_chars || 20),
        dorsal_personalizacion_free_limit: Number(eventForm.dorsal_personalizacion_free_limit || 0),
        dorsal_personalizacion_price: Number(eventForm.dorsal_personalizacion_price || 0),
        dorsal_personalizacion_image: eventForm.dorsal_personalizacion_image.trim() || null,
        dorsal_personalizacion_text_color: eventForm.dorsal_personalizacion_text_color.trim() || '#111827',
        dorsal_personalizacion_text_top: Number(eventForm.dorsal_personalizacion_text_top || 50),
        dorsal_personalizacion_text_size: Number(eventForm.dorsal_personalizacion_text_size || 36),
      })
      await loadSetup()
      showSuccess('Datos generales actualizados.')
    } catch (err) {
      showError(err, 'No se pudo actualizar el evento')
    } finally {
      setSaving('')
    }
  }

  async function uploadImage(e) {
    e.preventDefault()
    if (!imageFile) {
      setError('Selecciona una imagen primero.')
      return
    }

    try {
      setSaving('image')
      await uploadEventConvocatoria(id, imageFile)
      setImageFile(null)
      await loadSetup()
      await loadAssets()
      showSuccess('Convocatoria subida correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir la convocatoria')
    } finally {
      setSaving('')
    }
  }

  async function uploadCoverImage(e) {
    e.preventDefault()
    if (!coverImageFile) {
      setError('Selecciona una foto de portada primero.')
      return
    }

    try {
      setSaving('cover-image')
      await uploadEventPortada(id, coverImageFile)
      setCoverImageFile(null)
      await loadSetup()
      await loadAssets()
      showSuccess('Foto de portada subida correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir la foto de portada')
    } finally {
      setSaving('')
    }
  }

  async function uploadHeroImage(e) {
    e.preventDefault()
    if (!heroImageFile) {
      setError('Selecciona una imagen hero primero.')
      return
    }

    try {
      setSaving('hero-image')
      await uploadEventHero(id, heroImageFile)
      setHeroImageFile(null)
      await loadSetup()
      await loadAssets()
      showSuccess('Hero del evento subido correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir el hero del evento')
    } finally {
      setSaving('')
    }
  }

  async function uploadShirtImage(e) {
    e.preventDefault()
    if (!shirtImageFile) {
      setError('Selecciona una imagen de playera primero.')
      return
    }

    try {
      setSaving('shirt-image')
      await uploadEventPlayera(id, shirtImageFile)
      setShirtImageFile(null)
      await loadSetup()
      await loadAssets()
      showSuccess('Imagen de playera subida correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir la imagen de playera')
    } finally {
      setSaving('')
    }
  }

  async function uploadMedalImage(e) {
    e.preventDefault()
    if (!medalImageFile) {
      setError('Selecciona una imagen de medalla primero.')
      return
    }

    try {
      setSaving('medal-image')
      await uploadEventMedalla(id, medalImageFile)
      setMedalImageFile(null)
      await loadSetup()
      await loadAssets()
      showSuccess('Imagen de medalla subida correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir la imagen de medalla')
    } finally {
      setSaving('')
    }
  }

  async function uploadBibImage(e) {
    e.preventDefault()
    if (!bibImageFile) {
      setError('Selecciona una imagen base de dorsal primero.')
      return
    }

    try {
      setSaving('bib-image')
      await uploadEventDorsal(id, bibImageFile)
      setBibImageFile(null)
      await loadSetup()
      await loadAssets()
      showSuccess('Base de dorsal subida correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir la base de dorsal')
    } finally {
      setSaving('')
    }
  }

  async function uploadBibPersonalizationImage(e) {
    e.preventDefault()
    if (!bibPersonalizationImageFile) {
      setError('Selecciona una plantilla de personalizacion primero.')
      return
    }

    try {
      setSaving('bib-personalization-image')
      await uploadEventDorsalPersonalizacion(id, bibPersonalizationImageFile)
      setBibPersonalizationImageFile(null)
      await loadSetup()
      await loadAssets()
      showSuccess('Plantilla de personalizacion subida correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir la plantilla de personalizacion')
    } finally {
      setSaving('')
    }
  }

  async function addModality(e) {
    e.preventDefault()
    try {
      setSaving('modality')
      await createModality({
        event_id: Number(id),
        nombre: modalityForm.nombre.trim(),
        descripcion: modalityForm.descripcion.trim() || null,
        precio: String(Number(modalityForm.precio || 0)),
        distancia_km: modalityForm.distancia_km ? String(Number(modalityForm.distancia_km)) : null,
        incluye_playera: modalityForm.incluye_playera,
      })
      setModalityForm(initialModalityForm)
      await loadSetup()
      showSuccess('Modalidad creada.')
    } catch (err) {
      showError(err, 'No se pudo crear la modalidad')
    } finally {
      setSaving('')
    }
  }

  async function addCategory(e) {
    e.preventDefault()
    try {
      setSaving('category')
      const sexos = categoryForm.sexo_mode === 'ambos'
        ? ['masculino', 'femenino']
        : [categoryForm.sexo_mode === 'mixta' ? null : categoryForm.sexo_mode]

      const requests = categoryForm.modality_ids.flatMap((modalityId) => (
        sexos.map((sexo) => createCategory({
          event_id: Number(id),
          modality_id: Number(modalityId),
          nombre: categoryForm.nombre.trim(),
          sexo,
          edad_min: toNumberOrNull(categoryForm.edad_min),
          edad_max: toNumberOrNull(categoryForm.edad_max),
        }))
      ))

      await Promise.all(requests)
      setCategoryForm(initialCategoryForm)
      await loadSetup()
      showSuccess(requests.length === 1 ? 'Categoria creada.' : `${requests.length} categorias creadas.`)
    } catch (err) {
      showError(err, 'No se pudo crear la categoría')
    } finally {
      setSaving('')
    }
  }

  async function addProduct(e) {
    e.preventDefault()
    try {
      setSaving('product')
      await createProduct({
        event_id: Number(id),
        modality_id: productForm.modality_id ? Number(productForm.modality_id) : null,
        nombre: productForm.nombre.trim(),
        precio: String(Number(productForm.precio || 0)),
        incluye_playera: productForm.incluye_playera,
      })
      setProductForm(initialProductForm)
      await loadSetup()
      showSuccess('Paquete o producto creado.')
    } catch (err) {
      showError(err, 'No se pudo crear el paquete')
    } finally {
      setSaving('')
    }
  }

  async function addShirtSize(e) {
    e.preventDefault()
    try {
      setSaving('shirt')
      await createShirtSize({
        event_id: Number(id),
        talla: shirtForm.talla.trim().toUpperCase(),
        stock: toNumberOrNull(shirtForm.stock),
        activa: shirtForm.activa,
      })
      setShirtForm(initialShirtForm)
      await loadSetup()
      showSuccess('Talla creada.')
    } catch (err) {
      showError(err, 'No se pudo crear la talla')
    } finally {
      setSaving('')
    }
  }

  async function removeItem(type, itemId) {
    const actions = {
      modality: deleteModality,
      category: deleteCategory,
      product: deleteProduct,
      shirt: deleteShirtSize,
    }

    try {
      setSaving(`${type}-${itemId}`)
      await actions[type](itemId)
      await loadSetup()
      showSuccess('Elemento eliminado.')
    } catch (err) {
      showError(err, 'No se pudo eliminar el elemento')
    } finally {
      setSaving('')
    }
  }

  function normalizeKitItemPayload(values) {
    return {
      titulo: values.titulo.trim(),
      descripcion: values.descripcion?.trim() || null,
      imagen: values.imagen?.trim() || null,
      orden: Number(values.orden || 0),
      visible: Boolean(values.visible),
    }
  }

  async function addKitItem(e) {
    e.preventDefault()
    try {
      setSaving('kit-item')
      await createEventKitItem(id, normalizeKitItemPayload(kitItemForm))
      setKitItemForm(initialKitItemForm)
      await loadSetup()
      showSuccess('Elemento del kit creado.')
    } catch (err) {
      showError(err, 'No se pudo crear el elemento del kit')
    } finally {
      setSaving('')
    }
  }

  function handleKitItemChange(itemId, field, value) {
    setSetup((current) => ({
      ...current,
      kit_items: (current.kit_items || []).map((item) => (
        item.id === itemId ? { ...item, [field]: value } : item
      )),
    }))
  }

  async function saveKitItem(item) {
    try {
      setSaving(`kit-save-${item.id}`)
      await updateEventKitItem(id, item.id, normalizeKitItemPayload(item))
      await loadSetup()
      showSuccess('Elemento del kit actualizado.')
    } catch (err) {
      showError(err, 'No se pudo actualizar el elemento del kit')
    } finally {
      setSaving('')
    }
  }

  async function uploadKitItemImage(itemId) {
    const file = kitItemFiles[itemId]
    if (!file) {
      setError('Selecciona una imagen primero.')
      return
    }

    try {
      setSaving(`kit-upload-${itemId}`)
      await uploadEventKitItemImage(id, itemId, file)
      setKitItemFiles((current) => ({ ...current, [itemId]: null }))
      await loadSetup()
      await loadAssets()
      showSuccess('Imagen del kit subida correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir la imagen del kit')
    } finally {
      setSaving('')
    }
  }

  async function removeKitItem(itemId) {
    try {
      setSaving(`kit-delete-${itemId}`)
      await deleteEventKitItem(id, itemId)
      await loadSetup()
      showSuccess('Elemento del kit eliminado.')
    } catch (err) {
      showError(err, 'No se pudo eliminar el elemento del kit')
    } finally {
      setSaving('')
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Configurar evento" subtitle="Cargando datos del evento...">
        <p className="text-slate-500">Cargando configuración...</p>
      </AdminLayout>
    )
  }

  if (!setup) {
    return (
      <AdminLayout title="Configurar evento" subtitle="No se encontró el evento.">
        <p className="text-red-600">{error || 'Evento no encontrado'}</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Configurar evento"
      subtitle={`${setup.nombre} · ${setup.fecha} · ${setup.lugar}`}
      actions={
        <>
          <Link to={`/evento/${id}`} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-100">
            Ver público
          </Link>
          <Link to={`/admin/eventos/${id}/inscritos`} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
            Ver inscritos
          </Link>
        </>
      }
    >
      {(error || success) && (
        <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-semibold ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {error || success}
        </div>
      )}

      <AssetLibraryModal
        open={assetPicker.open}
        assets={assets}
        title={assetPicker.title}
        uploading={assetLibraryUploading}
        onUpload={uploadAssetFromPicker}
        onSelect={selectAssetFromPicker}
        onClose={closeAssetPicker}
      />

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <AdminSetupGuide setup={setup} />
          <AssetLibraryPanel
            assets={assets}
            onUpload={uploadAssetToLibrary}
            onOpenLibrary={() => openAssetPicker('Imagenes subidas', null)}
            uploading={assetLibraryUploading}
          />
        </div>

        <div className="space-y-6">
          <SectionCard id="basicos" title="Datos generales" subtitle="Primero deja claro que evento estas vendiendo y si las inscripciones estan abiertas.">
            <form onSubmit={saveEvent} className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre del evento">
                <input name="nombre" value={eventForm.nombre} onChange={handleEventChange} required className={inputClass()} />
              </Field>
              <Field label="Slug / URL corta">
                <input name="slug" value={eventForm.slug} onChange={handleEventChange} placeholder="medio-maraton-2026" className={inputClass()} />
              </Field>
              <Field label="Fecha">
                <input type="date" name="fecha" value={eventForm.fecha} onChange={handleEventChange} required className={inputClass()} />
              </Field>
              <Field label="Hora de salida">
                <input type="time" name="hora_salida" value={eventForm.hora_salida} onChange={handleEventChange} className={inputClass()} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Cuenta regresiva">
                  <input type="datetime-local" name="cuenta_regresiva_at" value={eventForm.cuenta_regresiva_at} onChange={handleEventChange} className={inputClass()} />
                </Field>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  Fecha y hora objetivo del contador público. Normalmente úsalo para la hora de salida del evento.
                </p>
              </div>
              <Field label="Lugar">
                <input name="lugar" value={eventForm.lugar} onChange={handleEventChange} required className={inputClass()} />
              </Field>
              <Field label="Organizador">
                <input name="organizador" value={eventForm.organizador} onChange={handleEventChange} className={inputClass()} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Descripción / convocatoria en texto">
                  <textarea name="descripcion" value={eventForm.descripcion} onChange={handleEventChange} rows="4" className={inputClass()} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">Colores del evento</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    Personalizan botones, acentos, chips y recuadros en la página del evento y el formulario de inscripción.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <Field label="Primario">
                      <div className="flex gap-2">
                        <input type="color" name="color_primario" value={eventForm.color_primario || '#6A1A24'} onChange={handleEventChange} className="h-12 w-14 rounded-xl border border-slate-300 bg-white p-1" />
                        <input name="color_primario" value={eventForm.color_primario || ''} onChange={handleEventChange} className={inputClass()} />
                      </div>
                    </Field>
                    <Field label="Secundario">
                      <div className="flex gap-2">
                        <input type="color" name="color_secundario" value={eventForm.color_secundario || '#15070A'} onChange={handleEventChange} className="h-12 w-14 rounded-xl border border-slate-300 bg-white p-1" />
                        <input name="color_secundario" value={eventForm.color_secundario || ''} onChange={handleEventChange} className={inputClass()} />
                      </div>
                    </Field>
                    <Field label="Acento">
                      <div className="flex gap-2">
                        <input type="color" name="color_acento" value={eventForm.color_acento || '#F4D35E'} onChange={handleEventChange} className="h-12 w-14 rounded-xl border border-slate-300 bg-white p-1" />
                        <input name="color_acento" value={eventForm.color_acento || ''} onChange={handleEventChange} className={inputClass()} />
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <ImageLibraryField
                  label="Imagen hero del evento"
                  value={eventForm.imagen_hero}
                  placeholder="/uploads/eventos/hero-evento.png o https://..."
                  onChange={(value) => setEventImageField('imagen_hero', value)}
                  onUpload={(file) => uploadAssetForField('imagen_hero', file)}
                  onOpenLibrary={() => openAssetPicker('Imagen hero del evento', (path) => setEventImageField('imagen_hero', path))}
                  saving={saving === 'asset-imagen_hero'}
                />
              </div>
              <div className="md:col-span-2">
                <ImageLibraryField
                  label="Foto de portada"
                  value={eventForm.imagen_portada}
                  placeholder="/uploads/eventos/portada.png o https://..."
                  onChange={(value) => setEventImageField('imagen_portada', value)}
                  onUpload={(file) => uploadAssetForField('imagen_portada', file)}
                  onOpenLibrary={() => openAssetPicker('Foto de portada', (path) => setEventImageField('imagen_portada', path))}
                  saving={saving === 'asset-imagen_portada'}
                />
              </div>
              <div className="md:col-span-2">
                <ImageLibraryField
                  label="Imagen de convocatoria"
                  value={eventForm.imagen_convocatoria}
                  placeholder="/uploads/eventos/imagen.png o https://..."
                  onChange={(value) => setEventImageField('imagen_convocatoria', value)}
                  onUpload={(file) => uploadAssetForField('imagen_convocatoria', file)}
                  onOpenLibrary={() => openAssetPicker('Imagen de convocatoria', (path) => setEventImageField('imagen_convocatoria', path))}
                  saving={saving === 'asset-imagen_convocatoria'}
                />
              </div>
              <div className="md:col-span-2">
                <ImageLibraryField
                  label="Imagen de playera"
                  value={eventForm.imagen_playera}
                  placeholder="/uploads/eventos/playera.png o https://..."
                  onChange={(value) => setEventImageField('imagen_playera', value)}
                  onUpload={(file) => uploadAssetForField('imagen_playera', file)}
                  onOpenLibrary={() => openAssetPicker('Imagen de playera', (path) => setEventImageField('imagen_playera', path))}
                  saving={saving === 'asset-imagen_playera'}
                />
              </div>
              <div className="md:col-span-2">
                <ImageLibraryField
                  label="Imagen de medalla"
                  value={eventForm.imagen_medalla}
                  placeholder="/uploads/eventos/medalla.png o https://..."
                  onChange={(value) => setEventImageField('imagen_medalla', value)}
                  onUpload={(file) => uploadAssetForField('imagen_medalla', file)}
                  onOpenLibrary={() => openAssetPicker('Imagen de medalla', (path) => setEventImageField('imagen_medalla', path))}
                  saving={saving === 'asset-imagen_medalla'}
                />
              </div>
              <div className="md:col-span-2">
                <ImageLibraryField
                  label="Base de dorsal"
                  value={eventForm.imagen_dorsal}
                  placeholder="/uploads/eventos/dorsal.png o https://..."
                  onChange={(value) => setEventImageField('imagen_dorsal', value)}
                  onUpload={(file) => uploadAssetForField('imagen_dorsal', file)}
                  onOpenLibrary={() => openAssetPicker('Base de dorsal', (path) => setEventImageField('imagen_dorsal', path))}
                  saving={saving === 'asset-imagen_dorsal'}
                />
              </div>
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 md:col-span-2">
                <input type="checkbox" name="inscripciones_abiertas" checked={eventForm.inscripciones_abiertas} onChange={handleEventChange} />
                Inscripciones abiertas
              </label>
              <div className="md:col-span-2">
                <button disabled={saving === 'event'} className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60">
                  {saving === 'event' ? 'Guardando...' : 'Guardar datos generales'}
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard id="modalidades" title="Modalidades" subtitle="Ejemplo: 5K, 10K, Medio Maratón, Caminata, Infantil.">
            <form onSubmit={addModality} className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre">
                <input name="nombre" value={modalityForm.nombre} onChange={handleFormChange(setModalityForm)} required className={inputClass()} />
              </Field>
              <Field label="Precio">
                <input type="number" min="0" step="0.01" name="precio" value={modalityForm.precio} onChange={handleFormChange(setModalityForm)} required className={inputClass()} />
              </Field>
              <Field label="Distancia km">
                <input type="number" min="0" step="0.01" name="distancia_km" value={modalityForm.distancia_km} onChange={handleFormChange(setModalityForm)} className={inputClass()} />
              </Field>
              <Field label="Descripción">
                <input name="descripcion" value={modalityForm.descripcion} onChange={handleFormChange(setModalityForm)} className={inputClass()} />
              </Field>
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 md:col-span-2">
                <input type="checkbox" name="incluye_playera" checked={modalityForm.incluye_playera} onChange={handleFormChange(setModalityForm)} />
                Esta modalidad incluye playera y debe pedir talla
              </label>
              <div className="md:col-span-2">
                <button disabled={saving === 'modality'} className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                  {saving === 'modality' ? 'Creando...' : 'Crear modalidad'}
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {setup.modalities.length === 0 ? <p className="text-sm text-slate-500">Todavía no hay modalidades.</p> : setup.modalities.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold">{item.nombre}</p>
                    <p className="text-sm text-slate-500">{money(item.precio)} · {item.distancia_km ? `${item.distancia_km} km` : 'Sin distancia'} · {item.descripcion || 'Sin descripción'} · {item.incluye_playera ? 'Incluye playera' : 'Sin playera'}</p>
                  </div>
                  <button type="button" onClick={() => removeItem('modality', item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="categorias" title="Categorías" subtitle="Sirven para clasificar automáticamente por edad, sexo y modalidad.">
            <form onSubmit={addCategory} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700">Modalidades</span>
                  <button type="button" onClick={selectAllCategoryModalities} className="text-sm font-bold text-red-700 hover:text-red-800">
                    Seleccionar todas
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {setup.modalities.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={categoryForm.modality_ids.includes(String(item.id))}
                        onChange={() => toggleCategoryModality(item.id)}
                      />
                      {item.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Nombre de categoría">
                <input name="nombre" value={categoryForm.nombre} onChange={handleFormChange(setCategoryForm)} required placeholder="18-29, Libre, Máster..." className={inputClass()} />
              </Field>
              <Field label="Sexo">
                <select name="sexo_mode" value={categoryForm.sexo_mode} onChange={handleFormChange(setCategoryForm)} className={inputClass()}>
                  <option value="ambos">Masculino y Femenino</option>
                  <option value="mixta">Mixta</option>
                  <option value="masculino">Solo Masculino</option>
                  <option value="femenino">Solo Femenino</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Edad mínima">
                  <input type="number" min="0" name="edad_min" value={categoryForm.edad_min} onChange={handleFormChange(setCategoryForm)} className={inputClass()} />
                </Field>
                <Field label="Edad máxima">
                  <input type="number" min="0" name="edad_max" value={categoryForm.edad_max} onChange={handleFormChange(setCategoryForm)} className={inputClass()} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <button disabled={saving === 'category' || selectedModalities.length === 0} className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                  {saving === 'category' ? 'Creando...' : `Crear categoria en ${selectedModalities.length || 0} modalidad(es)`}
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {setup.categories.length === 0 ? <p className="text-sm text-slate-500">Todavía no hay categorías.</p> : setup.categories.map((item) => {
                const modality = setup.modalities.find((m) => m.id === item.modality_id)
                return (
                  <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold">{item.nombre}</p>
                      <p className="text-sm text-slate-500">{modality?.nombre || 'Sin modalidad'} · {item.sexo || 'Mixta'} · {item.edad_min ?? '0'} a {item.edad_max ?? '∞'} años</p>
                    </div>
                    <button type="button" onClick={() => removeItem('category', item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                      Eliminar
                    </button>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>

          <SectionCard id="identidad" title="Hero del evento" subtitle="Imagen superior de la página pública del evento. Si no subes una, se usará el hero principal del sitio.">
            {eventForm.imagen_hero ? (
              <img src={getApiAssetUrl(eventForm.imagen_hero)} alt="Hero del evento" className="mb-5 h-56 w-full rounded-2xl border border-slate-200 object-cover" />
            ) : (
              <div className="mb-5 flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Sin hero personalizado. Se usará el hero principal del sitio.
              </div>
            )}
            <form onSubmit={uploadHeroImage} className="space-y-4">
              <input type="file" accept="image/*" onChange={(e) => setHeroImageFile(e.target.files?.[0] || null)} className={inputClass()} />
              {heroImageFile && <p className="text-xs font-semibold text-slate-500">{heroImageFile.name}</p>}
              <button disabled={saving === 'hero-image'} className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {saving === 'hero-image' ? 'Subiendo...' : 'Subir hero del evento'}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Foto de portada" subtitle="Esta foto aparece en la ventana principal y en las tarjetas de eventos.">
            {eventForm.imagen_portada ? (
              <img src={getApiAssetUrl(eventForm.imagen_portada)} alt="Foto de portada del evento" className="mb-5 h-56 w-full rounded-2xl border border-slate-200 object-cover" />
            ) : (
              <div className="mb-5 flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Sin foto de portada.
              </div>
            )}
            <form onSubmit={uploadCoverImage} className="space-y-4">
              <input type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)} className={inputClass()} />
              {coverImageFile && <p className="text-xs font-semibold text-slate-500">{coverImageFile.name}</p>}
              <button disabled={saving === 'cover-image'} className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {saving === 'cover-image' ? 'Subiendo...' : 'Subir foto de portada'}
              </button>
            </form>
          </SectionCard>

          <SectionCard id="convocatoria" title="Convocatoria" subtitle="Puedes subir la imagen desde el admin, elegir una imagen subida o pegar una URL manualmente.">
            {eventForm.imagen_convocatoria ? (
              <img src={getApiAssetUrl(eventForm.imagen_convocatoria)} alt="Convocatoria del evento" className="mb-5 w-full rounded-2xl border border-slate-200 object-cover" />
            ) : (
              <div className="mb-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Sin imagen de convocatoria.
              </div>
            )}
            <form onSubmit={uploadImage} className="space-y-4">
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className={inputClass()} />
              <button disabled={saving === 'image'} className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {saving === 'image' ? 'Subiendo...' : 'Subir convocatoria'}
              </button>
            </form>
          </SectionCard>

          <SectionCard id="kit" title="Lo que recibe el corredor" subtitle="Crea los cuadros que aparecerán en la página pública: playera, medalla, morral, número, chip u otros beneficios.">
            <form onSubmit={addKitItem} className="grid gap-4">
              <Field label="Título">
                <input name="titulo" value={kitItemForm.titulo} onChange={handleFormChange(setKitItemForm)} required placeholder="Playera, Medalla, Morral..." className={inputClass()} />
              </Field>
              <Field label="Descripción corta">
                <input name="descripcion" value={kitItemForm.descripcion} onChange={handleFormChange(setKitItemForm)} placeholder="Incluida en paquete VIP, diseño conmemorativo..." className={inputClass()} />
              </Field>
              <ImageLibraryField
                label="Imagen opcional"
                value={kitItemForm.imagen}
                placeholder="/uploads/eventos/playera.png o https://..."
                onChange={(value) => setKitItemForm((prev) => ({ ...prev, imagen: value }))}
                onUpload={uploadAssetForKitItemForm}
                onOpenLibrary={() => openAssetPicker('Imagen del kit', (path) => setKitItemForm((prev) => ({ ...prev, imagen: path })))}
                saving={saving === 'asset-kit-form'}
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field label="Orden de aparición">
                  <input type="number" name="orden" value={kitItemForm.orden} onChange={handleFormChange(setKitItemForm)} className={inputClass()} />
                </Field>
                <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="visible" checked={kitItemForm.visible} onChange={handleFormChange(setKitItemForm)} />
                  Visible
                </label>
              </div>
              <button disabled={saving === 'kit-item'} className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {saving === 'kit-item' ? 'Creando...' : 'Crear cuadro del kit'}
              </button>
              <p className="text-xs font-semibold leading-5 text-slate-500">
                Orden de aparición: los números más bajos se muestran primero. Ejemplo: Playera 1, Medalla 2, Morral 3.
              </p>
            </form>

            <div className="mt-6 space-y-4">
              {(setup.kit_items || []).length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
                  Todavía no hay cuadros personalizados. Si no agregas ninguno, la página usará las imágenes legacy de playera/medalla si existen.
                </p>
              ) : setup.kit_items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  {item.imagen ? (
                    <img src={getApiAssetUrl(item.imagen)} alt={item.titulo} className="mb-4 h-36 w-full rounded-2xl border border-slate-200 object-cover" />
                  ) : (
                    <div className="mb-4 flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500">
                      Sin imagen
                    </div>
                  )}
                  <div className="grid gap-3">
                    <input value={item.titulo || ''} onChange={(e) => handleKitItemChange(item.id, 'titulo', e.target.value)} className={inputClass()} />
                    <input value={item.descripcion || ''} onChange={(e) => handleKitItemChange(item.id, 'descripcion', e.target.value)} placeholder="Descripción corta" className={inputClass()} />
                    <ImageLibraryField
                      label="Imagen del cuadro"
                      value={item.imagen || ''}
                      placeholder="/uploads/eventos/playera.png o https://..."
                      onChange={(value) => handleKitItemChange(item.id, 'imagen', value)}
                      onUpload={(file) => uploadAssetForKitItem(item.id, file)}
                      onOpenLibrary={() => openAssetPicker('Imagen del cuadro', (path) => handleKitItemChange(item.id, 'imagen', path))}
                      saving={saving === `asset-kit-${item.id}`}
                    />
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Orden de aparición</span>
                        <input type="number" value={item.orden ?? 0} onChange={(e) => handleKitItemChange(item.id, 'orden', e.target.value)} className={`${inputClass()} mt-2`} />
                      </label>
                      <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={Boolean(item.visible)} onChange={(e) => handleKitItemChange(item.id, 'visible', e.target.checked)} />
                        Visible
                      </label>
                    </div>
                    <div className="grid gap-3">
                      <input type="file" accept="image/*" onChange={(e) => setKitItemFiles((current) => ({ ...current, [item.id]: e.target.files?.[0] || null }))} className={inputClass()} />
                      {kitItemFiles[item.id] && <p className="text-xs font-semibold text-slate-500">{kitItemFiles[item.id].name}</p>}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <button type="button" onClick={() => saveKitItem(item)} disabled={saving === `kit-save-${item.id}`} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                        {saving === `kit-save-${item.id}` ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button type="button" onClick={() => uploadKitItemImage(item.id)} disabled={saving === `kit-upload-${item.id}`} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">
                        {saving === `kit-upload-${item.id}` ? 'Subiendo...' : 'Subir imagen'}
                      </button>
                      <button type="button" onClick={() => removeKitItem(item.id)} disabled={saving === `kit-delete-${item.id}`} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Kit del evento" subtitle="Legacy: estas imágenes se usan como fallback si no hay cuadros personalizados.">
            <div className="grid gap-5 sm:grid-cols-2">
              <AssetUpload
                title="Playera"
                imageUrl={eventForm.imagen_playera}
                emptyText="Sin imagen de playera."
                file={shirtImageFile}
                onFileChange={setShirtImageFile}
                onSubmit={uploadShirtImage}
                saving={saving === 'shirt-image'}
                buttonText="Subir playera"
              />
              <AssetUpload
                title="Medalla"
                imageUrl={eventForm.imagen_medalla}
                emptyText="Sin imagen de medalla."
                file={medalImageFile}
                onFileChange={setMedalImageFile}
                onSubmit={uploadMedalImage}
                saving={saving === 'medal-image'}
                buttonText="Subir medalla"
              />
            </div>
          </SectionCard>

          <SectionCard id="dorsal" title="Base de dorsal" subtitle="Opcional. Sube el diseño del número de esta carrera; si no hay uno, SudorTime generará un dorsal default.">
            <AssetUpload
              title="Dorsal"
              imageUrl={eventForm.imagen_dorsal}
              emptyText="Sin base de dorsal. Se usará el diseño default."
              file={bibImageFile}
              onFileChange={setBibImageFile}
              onSubmit={uploadBibImage}
              saving={saving === 'bib-image'}
              buttonText="Subir base de dorsal"
            />
          </SectionCard>

          <SectionCard title="Personalizacion de dorsal" subtitle="Promo opcional: primeros registros gratis y costo extra configurable despues.">
            <form onSubmit={saveEvent} className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 md:col-span-2">
                <input type="checkbox" name="dorsal_personalizacion_enabled" checked={eventForm.dorsal_personalizacion_enabled} onChange={handleEventChange} />
                Activar personalizacion en el formulario publico
              </label>
              <Field label="Primeras inscripciones gratis">
                <input type="number" min="0" name="dorsal_personalizacion_free_limit" value={eventForm.dorsal_personalizacion_free_limit} onChange={handleEventChange} className={inputClass()} />
              </Field>
              <Field label="Costo despues de la promo">
                <input type="number" min="0" step="0.01" name="dorsal_personalizacion_price" value={eventForm.dorsal_personalizacion_price} onChange={handleEventChange} className={inputClass()} />
              </Field>
              <Field label="Maximo de caracteres">
                <input type="number" min="1" max="100" name="dorsal_personalizacion_max_chars" value={eventForm.dorsal_personalizacion_max_chars} onChange={handleEventChange} className={inputClass()} />
              </Field>
              <Field label="Color del texto">
                <div className="flex gap-2">
                  <input type="color" name="dorsal_personalizacion_text_color" value={eventForm.dorsal_personalizacion_text_color || '#111827'} onChange={handleEventChange} className="h-12 w-14 rounded-xl border border-slate-300 bg-white p-1" />
                  <input name="dorsal_personalizacion_text_color" value={eventForm.dorsal_personalizacion_text_color || ''} onChange={handleEventChange} className={inputClass()} />
                </div>
              </Field>
              <Field label="Posicion vertical del texto (%)">
                <input type="number" min="0" max="100" name="dorsal_personalizacion_text_top" value={eventForm.dorsal_personalizacion_text_top} onChange={handleEventChange} className={inputClass()} />
              </Field>
              <Field label="Tamano del texto">
                <input type="number" min="12" max="120" name="dorsal_personalizacion_text_size" value={eventForm.dorsal_personalizacion_text_size} onChange={handleEventChange} className={inputClass()} />
              </Field>
              <div className="md:col-span-2">
                <ImageLibraryField
                  label="Plantilla de personalizacion"
                  value={eventForm.dorsal_personalizacion_image}
                  placeholder="/uploads/eventos/dorsal-personalizacion.png o https://..."
                  onChange={(value) => setEventImageField('dorsal_personalizacion_image', value)}
                  onUpload={(file) => uploadAssetForField('dorsal_personalizacion_image', file)}
                  onOpenLibrary={() => openAssetPicker('Plantilla de personalizacion', (path) => setEventImageField('dorsal_personalizacion_image', path))}
                  saving={saving === 'asset-dorsal_personalizacion_image'}
                />
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  Si la dejas vacia se usara la base de dorsal. La posicion vertical ayuda a colocar el texto dentro del recuadro blanco del diseno.
                </p>
              </div>
              <div className="md:col-span-2">
                <DorsalPersonalizationPreview eventForm={eventForm} />
              </div>
              <div className="md:col-span-2">
                <button disabled={saving === 'event'} className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60">
                  {saving === 'event' ? 'Guardando...' : 'Guardar promo de dorsal'}
                </button>
              </div>
            </form>
            <div className="mt-5">
              <AssetUpload
                title="Plantilla de personalizacion"
                imageUrl={eventForm.dorsal_personalizacion_image}
                emptyText="Sin plantilla especifica. Se usara la base de dorsal."
                file={bibPersonalizationImageFile}
                onFileChange={setBibPersonalizationImageFile}
                onSubmit={uploadBibPersonalizationImage}
                saving={saving === 'bib-personalization-image'}
                buttonText="Subir plantilla"
              />
            </div>
          </SectionCard>

          <SectionCard id="inventario" title="Tallas de playera" subtitle="El registro público solo mostrará tallas activas con stock disponible.">
            <form onSubmit={addShirtSize} className="grid gap-4 sm:grid-cols-2">
              <Field label="Talla">
                <input name="talla" value={shirtForm.talla} onChange={handleFormChange(setShirtForm)} required placeholder="S, M, L, XL" className={inputClass()} />
              </Field>
              <Field label="Stock">
                <input type="number" min="0" name="stock" value={shirtForm.stock} onChange={handleFormChange(setShirtForm)} placeholder="Vacío = ilimitado" className={inputClass()} />
              </Field>
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 sm:col-span-2">
                <input type="checkbox" name="activa" checked={shirtForm.activa} onChange={handleFormChange(setShirtForm)} />
                Talla activa
              </label>
              <button disabled={saving === 'shirt'} className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60 sm:col-span-2">
                {saving === 'shirt' ? 'Creando...' : 'Crear talla'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {shirtSizesForAdmin.length === 0 ? <p className="text-sm text-slate-500">Todavía no hay tallas configuradas.</p> : shirtSizesForAdmin.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-bold">{item.talla}</p>
                    <p className="text-sm text-slate-500">{item.stock === null || item.stock === undefined ? 'Stock ilimitado' : `${item.stock} disponibles`} · {item.activa ? 'Activa' : 'Inactiva'}</p>
                  </div>
                  <button type="button" onClick={() => removeItem('shirt', item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Paquetes / productos" subtitle="Útil para paquete básico, premier, playera extra u otros conceptos de inscripción.">
            <form onSubmit={addProduct} className="space-y-4">
              <Field label="Modalidad opcional">
                <select name="modality_id" value={productForm.modality_id} onChange={handleFormChange(setProductForm)} className={inputClass()}>
                  <option value="">Disponible para todo el evento</option>
                  {setup.modalities.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
              </Field>
              <Field label="Nombre">
                <input name="nombre" value={productForm.nombre} onChange={handleFormChange(setProductForm)} required placeholder="Paquete básico, Paquete premier..." className={inputClass()} />
              </Field>
              <Field label="Precio">
                <input type="number" min="0" step="0.01" name="precio" value={productForm.precio} onChange={handleFormChange(setProductForm)} required className={inputClass()} />
              </Field>
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" name="incluye_playera" checked={productForm.incluye_playera} onChange={handleFormChange(setProductForm)} />
                Este paquete incluye playera y debe pedir talla
              </label>
              <button disabled={saving === 'product'} className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {saving === 'product' ? 'Creando...' : 'Crear paquete'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {setup.products.length === 0 ? <p className="text-sm text-slate-500">Todavía no hay paquetes.</p> : setup.products.map((item) => {
                const modality = setup.modalities.find((m) => m.id === item.modality_id)
                return (
                  <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">{item.nombre}</p>
                      <p className="text-sm text-slate-500">{money(item.precio)} · {modality?.nombre || 'Todo el evento'} · {item.incluye_playera ? 'Incluye playera' : 'Sin playera'}</p>
                    </div>
                    <button type="button" onClick={() => removeItem('product', item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                      Eliminar
                    </button>
                  </div>
                )
              })}
            </div>
          </SectionCard>
      </div>
    </AdminLayout>
  )
}
