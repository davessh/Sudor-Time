import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getApiAssetUrl } from '../../api/client'
import { getEventSetup, updateEvent, uploadEventConvocatoria, uploadEventHero, uploadEventMedalla, uploadEventPlayera, uploadEventPortada } from '../../api/events'
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
  imagen_hero: '',
  imagen_portada: '',
  imagen_convocatoria: '',
  imagen_playera: '',
  imagen_medalla: '',
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

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  return Number(value)
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

export default function AdminEventSetupPage() {
  const { id } = useParams()

  const [setup, setSetup] = useState(null)
  const [eventForm, setEventForm] = useState(initialEventForm)
  const [modalityForm, setModalityForm] = useState(initialModalityForm)
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm)
  const [productForm, setProductForm] = useState(initialProductForm)
  const [shirtForm, setShirtForm] = useState(initialShirtForm)
  const [heroImageFile, setHeroImageFile] = useState(null)
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [shirtImageFile, setShirtImageFile] = useState(null)
  const [medalImageFile, setMedalImageFile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
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
        imagen_hero: data.imagen_hero || '',
        imagen_portada: data.imagen_portada || '',
        imagen_convocatoria: data.imagen_convocatoria || '',
        imagen_playera: data.imagen_playera || '',
        imagen_medalla: data.imagen_medalla || '',
      })
    } catch (err) {
      setError(err.message || 'No se pudo cargar la configuración del evento')
    } finally {
      setLoading(false)
    }
  }

  const shirtSizesForAdmin = setup?.all_shirt_sizes || setup?.shirt_sizes || []

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
        imagen_hero: eventForm.imagen_hero.trim() || null,
        imagen_portada: eventForm.imagen_portada.trim() || null,
        imagen_convocatoria: eventForm.imagen_convocatoria.trim() || null,
        imagen_playera: eventForm.imagen_playera.trim() || null,
        imagen_medalla: eventForm.imagen_medalla.trim() || null,
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
      setError('Selecciona un fondo del inicio primero.')
      return
    }

    try {
      setSaving('hero-image')
      await uploadEventHero(id, heroImageFile)
      setHeroImageFile(null)
      await loadSetup()
      showSuccess('Fondo del inicio subido correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir el fondo del inicio')
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
      showSuccess('Imagen de medalla subida correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir la imagen de medalla')
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

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <SectionCard title="Datos generales" subtitle="Aquí llenas la información que se muestra en la página pública del evento.">
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
                <Field label="URL de fondo del inicio">
                  <input name="imagen_hero" value={eventForm.imagen_hero} onChange={handleEventChange} placeholder="/uploads/eventos/hero.png o https://..." className={inputClass()} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="URL de foto de portada">
                  <input name="imagen_portada" value={eventForm.imagen_portada} onChange={handleEventChange} placeholder="/uploads/eventos/portada.png o https://..." className={inputClass()} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="URL de imagen de convocatoria">
                  <input name="imagen_convocatoria" value={eventForm.imagen_convocatoria} onChange={handleEventChange} placeholder="/uploads/eventos/imagen.png o https://..." className={inputClass()} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="URL de imagen de playera">
                  <input name="imagen_playera" value={eventForm.imagen_playera} onChange={handleEventChange} placeholder="/uploads/eventos/playera.png o https://..." className={inputClass()} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="URL de imagen de medalla">
                  <input name="imagen_medalla" value={eventForm.imagen_medalla} onChange={handleEventChange} placeholder="/uploads/eventos/medalla.png o https://..." className={inputClass()} />
                </Field>
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

          <SectionCard title="Modalidades" subtitle="Ejemplo: 5K, 10K, Medio Maratón, Caminata, Infantil.">
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

          <SectionCard title="Categorías" subtitle="Sirven para clasificar automáticamente por edad, sexo y modalidad.">
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

        <div className="space-y-8">
          <SectionCard title="Fondo del inicio" subtitle="Esta imagen aparece difuminada detrás del texto principal de la página inicial.">
            {eventForm.imagen_hero ? (
              <img src={getApiAssetUrl(eventForm.imagen_hero)} alt="Fondo del inicio" className="mb-5 h-56 w-full rounded-2xl border border-slate-200 object-cover" />
            ) : (
              <div className="mb-5 flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Sin fondo del inicio.
              </div>
            )}
            <form onSubmit={uploadHeroImage} className="space-y-4">
              <input type="file" accept="image/*" onChange={(e) => setHeroImageFile(e.target.files?.[0] || null)} className={inputClass()} />
              {heroImageFile && <p className="text-xs font-semibold text-slate-500">{heroImageFile.name}</p>}
              <button disabled={saving === 'hero-image'} className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {saving === 'hero-image' ? 'Subiendo...' : 'Subir fondo del inicio'}
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

          <SectionCard title="Convocatoria" subtitle="Puedes subir la imagen desde el admin o pegar una URL manualmente.">
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

          <SectionCard title="Kit del evento" subtitle="Sube fotos de la playera o medalla para enriquecer la página pública.">
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

          <SectionCard title="Tallas de playera" subtitle="El registro público solo mostrará tallas activas con stock disponible.">
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
      </div>
    </AdminLayout>
  )
}
