import { CalendarDays, CheckCircle2, ClipboardList, UserRound } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getEventSetup } from '../api/events'
import { createParticipant } from '../api/participants'
import { createRegistration } from '../api/registrations'

function calcularEdad(fechaNacimiento, fechaEvento) {
  if (!fechaNacimiento || !fechaEvento) return null
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`)
  const evento = new Date(`${fechaEvento}T00:00:00`)
  if (Number.isNaN(nacimiento.getTime()) || Number.isNaN(evento.getTime())) return null

  let edad = evento.getFullYear() - nacimiento.getFullYear()
  const mes = evento.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && evento.getDate() < nacimiento.getDate())) edad -= 1
  return edad
}

function normalizarSexo(valor) {
  if (!valor) return ''
  const texto = valor.toLowerCase().trim()
  if (['m', 'masculino', 'hombre', 'h'].includes(texto)) return 'masculino'
  if (['f', 'femenino', 'mujer'].includes(texto)) return 'femenino'
  return texto
}

function categoriaCoincide(categoria, sexo, edad) {
  const sexoCategoria = normalizarSexo(categoria.sexo)
  const sexoParticipante = normalizarSexo(sexo)
  if (sexoCategoria && sexoParticipante && sexoCategoria !== sexoParticipante) return false
  if (categoria.edad_min !== null && categoria.edad_min !== undefined && (edad === null || edad < Number(categoria.edad_min))) return false
  if (categoria.edad_max !== null && categoria.edad_max !== undefined && (edad === null || edad > Number(categoria.edad_max))) return false
  return true
}

function separarApellidos(apellidos) {
  const partes = apellidos.trim().split(/\s+/).filter(Boolean)
  return {
    apellido_paterno: partes[0] || 'Sin apellido',
    apellido_materno: partes.slice(1).join(' ') || null,
  }
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })
}

const emptyForm = {
  modality_id: '',
  product_id: '',
  nombre: '',
  apellidos: '',
  fechaNacimiento: '',
  sexo: '',
  telefono: '',
  correo: '',
  ciudad: '',
  talla: '',
  equipo: '',
  contactoEmergencia: '',
  telefonoEmergencia: '',
}

export default function RegistrationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [setup, setSetup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true)
        setError('')
        const data = await getEventSetup(id)
        setSetup(data)
      } catch (err) {
        setError(err.message || 'No se pudo cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id])

  const edad = useMemo(() => calcularEdad(formData.fechaNacimiento, setup.fecha), [formData.fechaNacimiento, setup.fecha])

  const modalidadSeleccionada = useMemo(() => {
    if (!setup || !formData.modality_id) return null
    return setup.modalities.find((m) => String(m.id) === String(formData.modality_id)) || null
  }, [setup, formData.modality_id])

  const categoriasDeModalidad = useMemo(() => {
    if (!setup || !formData.modality_id) return []
    return setup.categories.filter((categoria) => String(categoria.modality_id) === String(formData.modality_id))
  }, [setup, formData.modality_id])

  const productosDeModalidad = useMemo(() => {
    if (!setup || !formData.modality_id) return []
    return (setup.products || []).filter((producto) => !producto.modality_id || String(producto.modality_id) === String(formData.modality_id))
  }, [setup, formData.modality_id])

  const productoSeleccionado = useMemo(() => {
    if (!formData.product_id) return null
    return productosDeModalidad.find((producto) => String(producto.id) === String(formData.product_id)) || null
  }, [productosDeModalidad, formData.product_id])

  const totalEstimado = useMemo(() => {
    return Number(modalidadSeleccionada.precio || 0) + Number(productoSeleccionado.precio || 0)
  }, [modalidadSeleccionada, productoSeleccionado])

  const categoriaCalculada = useMemo(() => {
    if (!categoriasDeModalidad.length || !formData.fechaNacimiento || !formData.sexo) return null
    return categoriasDeModalidad.find((categoria) => categoriaCoincide(categoria, formData.sexo, edad)) || null
  }, [categoriasDeModalidad, formData.fechaNacimiento, formData.sexo, edad])

  const tallasDisponibles = useMemo(() => {
    return (setup?.shirt_sizes || []).filter((talla) => {
      const stockDisponible = talla.stock === null || talla.stock === undefined || Number(talla.stock) > 0
      return talla.activa !== false && stockDisponible
    })
  }, [setup.shirt_sizes])

  const eventoRequierePlayera = Boolean(setup.has_shirt_sizes)

  const formularioValido = useMemo(() => {
    const requiereCategoria = categoriasDeModalidad.length > 0
    return (
      formData.modality_id &&
      formData.nombre.trim() &&
      formData.apellidos.trim() &&
      formData.fechaNacimiento &&
      formData.sexo &&
      formData.telefono.trim() &&
      formData.correo.trim() &&
      formData.ciudad.trim() &&
      (!eventoRequierePlayera || formData.talla) &&
      formData.contactoEmergencia.trim() &&
      formData.telefonoEmergencia.trim() &&
      (!requiereCategoria || categoriaCalculada)
    )
  }, [eventoRequierePlayera, categoriasDeModalidad, categoriaCalculada, formData])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'modality_id' ? { product_id: '' } : {}),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formularioValido) {
      setError('Completa los campos obligatorios. Si no aparece categoría o talla disponible, revisa edad, sexo o modalidad.')
      return
    }

    try {
      setSending(true)
      const apellidos = separarApellidos(formData.apellidos)
      const participante = await createParticipant({
        nombre: formData.nombre.trim(),
        apellido_paterno: apellidos.apellido_paterno,
        apellido_materno: apellidos.apellido_materno,
        fecha_nacimiento: formData.fechaNacimiento,
        sexo: formData.sexo,
        telefono: formData.telefono.trim(),
        correo: formData.correo.trim(),
        ciudad: formData.ciudad.trim(),
        equipo: formData.equipo.trim() || null,
        contacto_emergencia: formData.contactoEmergencia.trim(),
        telefono_emergencia: formData.telefonoEmergencia.trim(),
      })

      const registro = await createRegistration({
        event_id: Number(id),
        participant_id: participante.id,
        modality_id: Number(formData.modality_id),
        product_id: formData.product_id ? Number(formData.product_id) : null,
        category_id: categoriaCalculada?.id || null,
        talla_playera: formData.talla || null,
      })

      setSuccess('Preinscripción recibida. Tu lugar queda pendiente hasta completar el pago correspondiente.')
      navigate(`/inscripcion/${registro.id}/pago`)
      setFormData(emptyForm)
    } catch (err) {
      setError(err.message || 'No se pudo completar la inscripción')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-container py-16">
          <p className="text-slate-500">Cargando evento...</p>
        </div>
      </div>
    )
  }

  if (error && !setup) {
    return (
      <div className="page-shell">
        <div className="page-container py-16">
          <h1 className="text-3xl font-black">Error</h1>
          <p className="mt-4 text-slate-600">{error}</p>
          <Link to="/" className="btn-primary mt-6">
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <header className="border-b border-slate-200 bg-white">
        <div className="page-container py-5 sm:py-6">
          <Link to={`/evento/${setup.id}`} className="text-sm font-bold text-slate-500 transition hover:text-slate-950">
            Volver al evento
          </Link>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Registro</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Inscripción oficial</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                {setup.nombre} · {setup.fecha} · {setup.lugar}
              </p>
            </div>
            <span className="chip w-fit">Pago pendiente al terminar</span>
          </div>
        </div>
      </header>

      <main className="page-container grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
        <form onSubmit={handleSubmit} className="panel panel-pad space-y-8">
          <FormSection icon={ClipboardList} title="1. Modalidad">
            <div className="grid gap-3 sm:grid-cols-2">
              {setup.modalities.map((modalidad) => {
                const activa = String(formData.modality_id) === String(modalidad.id)
                return (
                  <label
                    key={modalidad.id}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      activa ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    <input type="radio" name="modality_id" value={modalidad.id} checked={activa} onChange={handleChange} className="sr-only" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black">{modalidad.nombre}</p>
                        {modalidad.descripcion && (
                          <p className={`mt-1 text-sm leading-6 ${activa ? 'text-slate-200' : 'text-slate-500'}`}>{modalidad.descripcion}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-black ${activa ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-900'}`}>
                        {formatMoney(modalidad.precio)}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </FormSection>

          {productosDeModalidad.length > 0 && (
            <FormSection title="Paquete">
              <Field label="Paquete adicional">
                <select name="product_id" value={formData.product_id} onChange={handleChange} className="input-control">
                  <option value="">Sin paquete adicional</option>
                  {productosDeModalidad.map((producto) => (
                    <option key={producto.id} value={producto.id}>{producto.nombre} · {formatMoney(producto.precio)}</option>
                  ))}
                </select>
              </Field>
            </FormSection>
          )}

          <FormSection icon={UserRound} title="2. Datos del corredor">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre">
                <input name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Nombre" className="input-control" />
              </Field>
              <Field label="Apellidos">
                <input name="apellidos" value={formData.apellidos} onChange={handleChange} required placeholder="Apellidos" className="input-control" />
              </Field>
              <Field label="Fecha de nacimiento">
                <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required className="input-control" />
              </Field>
              <Field label="Sexo">
                <select name="sexo" value={formData.sexo} onChange={handleChange} required className="input-control">
                  <option value="">Selecciona sexo</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </Field>
              <Field label="Teléfono">
                <input name="telefono" value={formData.telefono} onChange={handleChange} required placeholder="Teléfono" className="input-control" />
              </Field>
              <Field label="Correo">
                <input type="email" name="correo" value={formData.correo} onChange={handleChange} required placeholder="correo@ejemplo.com" className="input-control" />
              </Field>
              <Field label="Ciudad">
                <input name="ciudad" value={formData.ciudad} onChange={handleChange} required placeholder="Ciudad" className="input-control" />
              </Field>
              <Field label="Equipo / club">
                <input name="equipo" value={formData.equipo} onChange={handleChange} placeholder="Opcional" className="input-control" />
              </Field>
            </div>
          </FormSection>

          {eventoRequierePlayera && (
            <FormSection title="3. Playera">
              {tallasDisponibles.length > 0 ? (
                <Field label="Talla">
                  <select name="talla" value={formData.talla} onChange={handleChange} required className="input-control">
                    <option value="">Selecciona talla</option>
                    {tallasDisponibles.map((talla) => (
                      <option key={talla.id} value={talla.talla}>
                        {talla.talla}{talla.stock !== null && talla.stock !== undefined ? ` · ${talla.stock} disponibles` : ' · stock ilimitado'}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <p className="notice-warning">Por ahora no hay tallas de playera disponibles para este evento.</p>
              )}
            </FormSection>
          )}

          <FormSection icon={CalendarDays} title="Contacto de emergencia">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del contacto">
                <input name="contactoEmergencia" value={formData.contactoEmergencia} onChange={handleChange} required placeholder="Nombre completo" className="input-control" />
              </Field>
              <Field label="Teléfono de emergencia">
                <input name="telefonoEmergencia" value={formData.telefonoEmergencia} onChange={handleChange} required placeholder="Teléfono" className="input-control" />
              </Field>
            </div>
          </FormSection>

          {error && <p className="notice-error">{error}</p>}
          {success && <p className="notice-success">{success}</p>}

          <button type="submit" disabled={!formularioValido || sending} className="btn-primary w-full">
            {sending ? 'Registrando...' : 'Crear preinscripción'}
          </button>
        </form>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="panel panel-pad">
            <p className="eyebrow">Resumen</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{setup.nombre}</h2>
            <div className="mt-5 space-y-3 text-sm">
              <SummaryLine label="Modalidad" value={modalidadSeleccionada?.nombre || 'Pendiente'} />
              <SummaryLine label="Paquete" value={productoSeleccionado?.nombre || 'Sin paquete adicional'} />
              <SummaryLine label="Total" value={modalidadSeleccionada ? formatMoney(totalEstimado) : 'Pendiente'} strong />
              <SummaryLine label="Edad al evento" value={edad !== null ? `${edad} años` : 'Pendiente'} />
              <SummaryLine label="Talla" value={formData.talla || 'Pendiente'} />
            </div>
          </div>

          <div className="panel panel-pad">
            <p className="eyebrow">Categoría calculada</p>
            {!formData.modality_id ? (
              <p className="mt-3 text-sm text-slate-500">Selecciona una modalidad.</p>
            ) : categoriasDeModalidad.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Este evento todavía no tiene categorías configuradas para esta modalidad.</p>
            ) : categoriaCalculada ? (
              <div className="mt-4 rounded-xl bg-slate-950 p-5 text-white">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                  <div>
                    <p className="text-2xl font-black">{categoriaCalculada.nombre}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {categoriaCalculada.edad_min ?? '0'} a {categoriaCalculada.edad_max ?? 'sin límite'} años · {categoriaCalculada.sexo || 'Mixta'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="notice-warning mt-3">
                Captura fecha de nacimiento y sexo para calcular la categoría.
              </p>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}

function FormSection({ icon: Icon, title, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <h2 className="text-xl font-black tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function SummaryLine({ label, value, strong }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right ${strong ? 'text-lg font-black text-slate-950' : 'font-semibold text-slate-800'}`}>{value}</span>
    </div>
  )
}
