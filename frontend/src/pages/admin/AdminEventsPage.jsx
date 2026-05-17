import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getApiAssetUrl } from '../../api/client'
import { getEvents, createEvent, uploadEventConvocatoria } from '../../api/events'

const emptyForm = {
  nombre: '',
  slug: '',
  descripcion: '',
  fecha: '',
  lugar: '',
  hora_salida: '',
  organizador: '',
  inscripciones_abiertas: true,
  imagen_convocatoria: '',
}

export default function AdminEventsPage() {
  const navigate = useNavigate()

  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imageInputKey, setImageInputKey] = useState(0)

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
    const { name, type, checked, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    let eventoCreado = null

    try {
      setSubmitting(true)
      setError('')

      eventoCreado = await createEvent({
        nombre: formData.nombre.trim(),
        slug: formData.slug.trim() || null,
        descripcion: formData.descripcion.trim() || null,
        fecha: formData.fecha,
        lugar: formData.lugar.trim(),
        hora_salida: formData.hora_salida || null,
        organizador: formData.organizador.trim() || null,
        inscripciones_abiertas: formData.inscripciones_abiertas,
        imagen_convocatoria: formData.imagen_convocatoria.trim() || null,
      })

      if (imageFile) {
        try {
          await uploadEventConvocatoria(eventoCreado.id, imageFile)
        } catch (uploadError) {
          await loadEvents()
          setError(`El evento sí se creó, pero no se pudo subir la convocatoria: ${uploadError.message || 'error desconocido'}. Entra a Configurar para volver a subirla.`)
          return
        }
      }

      setFormData(emptyForm)
      setImageFile(null)
      setImageInputKey((prev) => prev + 1)
      await loadEvents()
      navigate(`/admin/eventos/${eventoCreado.id}/configuracion`)
    } catch (err) {
      setError(err.message || 'No se pudo crear el evento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout title="Eventos" subtitle="Crea eventos completos y administra su configuración operativa.">
      <div className="grid gap-8 xl:grid-cols-[1.05fr_1.25fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.35em] text-red-700">Crear evento</span>
            <h2 className="text-2xl font-bold">Datos del evento</h2>
            <p className="text-sm text-slate-500">
              Este formulario ya trae los campos que pide Swagger para crear un evento. También puedes subir la convocatoria directamente desde aquí.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <Field label="Nombre del evento *">
              <input name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej. Carrera Patitas en Fuga 5K" className={inputClass()} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fecha *">
                <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required className={inputClass()} />
              </Field>
              <Field label="Hora de salida">
                <input type="time" name="hora_salida" value={formData.hora_salida} onChange={handleChange} className={inputClass()} />
              </Field>
            </div>

            <Field label="Lugar *">
              <input name="lugar" value={formData.lugar} onChange={handleChange} required placeholder="Ej. Av. Álvaro Obregón, Mexicali" className={inputClass()} />
            </Field>

            <Field label="Organizador">
              <input name="organizador" value={formData.organizador} onChange={handleChange} placeholder="Ej. Facultad de Derecho UABC" className={inputClass()} />
            </Field>

            <Field label="Slug / URL corta">
              <input name="slug" value={formData.slug} onChange={handleChange} placeholder="carrera-patitas-2026" className={inputClass()} />
            </Field>

            <Field label="Descripción / texto de convocatoria">
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
                placeholder="Información general del evento, horarios, entrega de números, premios, ruta, etc."
                className={inputClass()}
              />
            </Field>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">Convocatoria del evento</h3>
              <p className="mt-1 text-sm text-slate-500">
                Puedes pegar una URL o subir una imagen. Si usas las dos opciones, la imagen subida será la que quede guardada.
              </p>

              <div className="mt-4 space-y-4">
                <Field label="URL de imagen opcional">
                  <input
                    name="imagen_convocatoria"
                    value={formData.imagen_convocatoria}
                    onChange={handleChange}
                    placeholder="https://... o /uploads/eventos/imagen.png"
                    className={inputClass()}
                  />
                </Field>

                <Field label="Subir imagen de convocatoria">
                  <input
                    key={imageInputKey}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className={inputClass()}
                  />
                </Field>

                {imageFile && (
                  <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                    Imagen seleccionada: {imageFile.name}
                  </p>
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" name="inscripciones_abiertas" checked={formData.inscripciones_abiertas} onChange={handleChange} />
              Inscripciones abiertas
            </label>

            {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

            <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {submitting ? 'Creando evento...' : 'Crear evento completo'}
            </button>

            <p className="text-xs text-slate-500">
              Después de crear el evento se abrirá la configuración para agregar modalidades, categorías, paquetes y tallas de playera.
            </p>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Eventos registrados</h2>
              <p className="mt-1 text-sm text-slate-500">Entra a configuración para completar los datos operativos del evento.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">{eventos.length}</span>
          </div>

          {loading && <p className="mt-6 text-slate-500">Cargando eventos...</p>}
          {!loading && !error && eventos.length === 0 && <p className="mt-6 text-slate-500">No hay eventos registrados.</p>}

          {!loading && eventos.length > 0 && (
            <div className="mt-6 space-y-4">
              {eventos.map((evento) => (
                <div key={evento.id} className="overflow-hidden rounded-2xl border border-slate-200">
                  {evento.imagen_convocatoria ? (
                    <img src={getApiAssetUrl(evento.imagen_convocatoria)} alt={evento.nombre} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 items-center justify-center bg-slate-50 text-sm font-semibold text-slate-400">
                      Sin convocatoria
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{evento.nombre}</h3>
                        <p className="mt-2 text-slate-500">{evento.fecha} · {evento.hora_salida || 'Hora por definir'} · {evento.lugar}</p>
                        <p className="mt-1 text-sm text-slate-500">{evento.organizador || 'Organizador por definir'}</p>
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${evento.inscripciones_abiertas ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {evento.inscripciones_abiertas ? 'Inscripciones abiertas' : 'Cerrado'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to={`/admin/eventos/${evento.id}/configuracion`} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                        Configurar
                      </Link>
                      <Link to={`/admin/eventos/${evento.id}/inscritos`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100">
                        Inscritos
                      </Link>
                      <Link to={`/admin/eventos/${evento.id}/resultados`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100">
                        Resultados
                      </Link>
                      <Link to={`/evento/${evento.id}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100">
                        Ver público
                      </Link>
                    </div>
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function inputClass() {
  return 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900'
}
