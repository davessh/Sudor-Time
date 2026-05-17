import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getEventSetup } from '../api/events'
import { createParticipant } from '../api/participants'
import { createRegistration } from '../api/registrations'

function calcularEdad(fechaNacimiento, fechaEvento) {
  if (!fechaNacimiento || !fechaEvento) return null

  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`)
  const evento = new Date(`${fechaEvento}T00:00:00`)

  if (Number.isNaN(nacimiento.getTime()) || Number.isNaN(evento.getTime())) {
    return null
  }

  let edad = evento.getFullYear() - nacimiento.getFullYear()
  const mes = evento.getMonth() - nacimiento.getMonth()

  if (mes < 0 || (mes === 0 && evento.getDate() < nacimiento.getDate())) {
    edad -= 1
  }

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

  if (sexoCategoria && sexoParticipante && sexoCategoria !== sexoParticipante) {
    return false
  }

  if (categoria.edad_min !== null && categoria.edad_min !== undefined) {
    if (edad === null || edad < Number(categoria.edad_min)) return false
  }

  if (categoria.edad_max !== null && categoria.edad_max !== undefined) {
    if (edad === null || edad > Number(categoria.edad_max)) return false
  }

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

export default function RegistrationPage() {
  const { id } = useParams()

  const [setup, setSetup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
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
  })

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

  const edad = useMemo(() => {
    return calcularEdad(formData.fechaNacimiento, setup?.fecha)
  }, [formData.fechaNacimiento, setup?.fecha])

  const modalidadSeleccionada = useMemo(() => {
    if (!setup || !formData.modality_id) return null
    return setup.modalities.find((m) => String(m.id) === String(formData.modality_id)) || null
  }, [setup, formData.modality_id])

  const categoriasDeModalidad = useMemo(() => {
    if (!setup || !formData.modality_id) return []

    return setup.categories.filter(
      (categoria) => String(categoria.modality_id) === String(formData.modality_id)
    )
  }, [setup, formData.modality_id])

  const productosDeModalidad = useMemo(() => {
    if (!setup || !formData.modality_id) return []

    return (setup.products || []).filter((producto) => {
      return !producto.modality_id || String(producto.modality_id) === String(formData.modality_id)
    })
  }, [setup, formData.modality_id])

  const productoSeleccionado = useMemo(() => {
    if (!formData.product_id) return null
    return productosDeModalidad.find((producto) => String(producto.id) === String(formData.product_id)) || null
  }, [productosDeModalidad, formData.product_id])

  const totalEstimado = useMemo(() => {
    return Number(modalidadSeleccionada?.precio || 0) + Number(productoSeleccionado?.precio || 0)
  }, [modalidadSeleccionada, productoSeleccionado])

  const categoriaCalculada = useMemo(() => {
    if (!categoriasDeModalidad.length) return null
    if (!formData.fechaNacimiento || !formData.sexo) return null

    return (
      categoriasDeModalidad.find((categoria) =>
        categoriaCoincide(categoria, formData.sexo, edad)
      ) || null
    )
  }, [categoriasDeModalidad, formData.fechaNacimiento, formData.sexo, edad])

  const tallasDisponibles = useMemo(() => {
    return (setup?.shirt_sizes || []).filter((talla) => {
      const stockDisponible = talla.stock === null || talla.stock === undefined || Number(talla.stock) > 0
      return talla.activa !== false && stockDisponible
    })
  }, [setup?.shirt_sizes])

  const eventoRequierePlayera = Boolean(setup?.has_shirt_sizes)

  const formularioValido = useMemo(() => {
    const requiereTalla = eventoRequierePlayera
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
      (!requiereTalla || formData.talla) &&
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
      setError('Completa los campos obligatorios. Si no aparece categoría o talla disponible, revisa configuración, edad, sexo o modalidad.')
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

      await createRegistration({
        event_id: Number(id),
        participant_id: participante.id,
        modality_id: Number(formData.modality_id),
        product_id: formData.product_id ? Number(formData.product_id) : null,
        category_id: categoriaCalculada?.id || null,
        talla_playera: formData.talla || null,
      })

      setSuccess('Preinscripción recibida. Tu lugar queda pendiente hasta completar el pago correspondiente.')
      setFormData({
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
      })
    } catch (err) {
      setError(err.message || 'No se pudo completar la inscripción')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-slate-500">Cargando evento...</p>
        </div>
      </div>
    )
  }

  if (error && !setup) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-bold">Error</h1>
          <p className="mt-4 text-slate-600">{error}</p>
          <Link to="/" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white">
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link to={`/evento/${setup.id}`} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
            ← Volver al evento
          </Link>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Inscripción oficial</h1>
          <p className="mt-1 text-slate-500">{setup.nombre} · {setup.fecha} · {setup.lugar}</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <section>
            <h2 className="text-xl font-bold">1. Modalidad</h2>
            <p className="mt-1 text-sm text-slate-500">Las modalidades vienen de la base de datos del evento.</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {setup.modalities.map((modalidad) => {
                const activa = String(formData.modality_id) === String(modalidad.id)
                return (
                  <label
                    key={modalidad.id}
                    className={`cursor-pointer rounded-2xl border p-5 transition ${
                      activa ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modality_id"
                      value={modalidad.id}
                      checked={activa}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold">{modalidad.nombre}</p>
                        <p className="mt-1 text-sm text-slate-500">{modalidad.descripcion || 'Sin descripción'}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white">
                        ${Number(modalidad.precio || 0).toFixed(2)}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </section>

          {productosDeModalidad.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">Paquete</h2>
              <select name="product_id" value={formData.product_id} onChange={handleChange} className="mt-5 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900">
                <option value="">Sin paquete adicional</option>
                {productosDeModalidad.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} · {formatMoney(producto.precio)}
                  </option>
                ))}
              </select>
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold">2. Datos del corredor</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Nombre" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
              <input name="apellidos" value={formData.apellidos} onChange={handleChange} required placeholder="Apellidos" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
              <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
              <select name="sexo" value={formData.sexo} onChange={handleChange} required className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900">
                <option value="">Sexo</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
              <input name="telefono" value={formData.telefono} onChange={handleChange} required placeholder="Teléfono" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
              <input type="email" name="correo" value={formData.correo} onChange={handleChange} required placeholder="Correo" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
              <input name="ciudad" value={formData.ciudad} onChange={handleChange} required placeholder="Ciudad" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
              <input name="equipo" value={formData.equipo} onChange={handleChange} placeholder="Equipo / club, opcional" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
            </div>
          </section>

          {eventoRequierePlayera && (
            <section>
              <h2 className="text-xl font-bold">3. Playera</h2>
              {tallasDisponibles.length > 0 ? (
                <select name="talla" value={formData.talla} onChange={handleChange} required className="mt-5 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900">
                  <option value="">Selecciona talla</option>
                  {tallasDisponibles.map((talla) => (
                    <option key={talla.id} value={talla.talla}>
                      {talla.talla}{talla.stock !== null && talla.stock !== undefined ? ` · ${talla.stock} disponibles` : ' · stock ilimitado'}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                  Por ahora no hay tallas de playera disponibles para este evento.
                </p>
              )}
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold">Contacto de emergencia</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input name="contactoEmergencia" value={formData.contactoEmergencia} onChange={handleChange} required placeholder="Nombre del contacto" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
              <input name="telefonoEmergencia" value={formData.telefonoEmergencia} onChange={handleChange} required placeholder="Teléfono de emergencia" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" />
            </div>
          </section>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          {success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p>}

          <button
            type="submit"
            disabled={!formularioValido || sending}
            className="w-full rounded-2xl bg-slate-900 px-5 py-4 font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Registrando...' : 'Crear preinscripción'}
          </button>
        </form>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Resumen</p>
            <h2 className="mt-2 text-2xl font-black">{setup.nombre}</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <p><span className="font-bold text-slate-900">Modalidad:</span> {modalidadSeleccionada?.nombre || 'Pendiente'}</p>
              <p><span className="font-bold text-slate-900">Paquete:</span> {productoSeleccionado?.nombre || 'Sin paquete adicional'}</p>
              <p><span className="font-bold text-slate-900">Total:</span> {modalidadSeleccionada ? formatMoney(totalEstimado) : 'Pendiente'}</p>
              <p><span className="font-bold text-slate-900">Edad al evento:</span> {edad !== null ? `${edad} años` : 'Pendiente'}</p>
              <p><span className="font-bold text-slate-900">Talla:</span> {formData.talla || 'Pendiente'}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Categoría calculada</p>
            {!formData.modality_id ? (
              <p className="mt-3 text-slate-500">Selecciona una modalidad.</p>
            ) : categoriasDeModalidad.length === 0 ? (
              <p className="mt-3 text-slate-500">Este evento todavía no tiene categorías configuradas para esta modalidad.</p>
            ) : categoriaCalculada ? (
              <div className="mt-4 rounded-2xl bg-slate-900 p-5 text-white">
                <p className="text-2xl font-black">{categoriaCalculada.nombre}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {categoriaCalculada.edad_min ?? '0'} a {categoriaCalculada.edad_max ?? '∞'} años · {categoriaCalculada.sexo || 'Mixta'}
                </p>
              </div>
            ) : (
              <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                Captura fecha de nacimiento y sexo para calcular la categoría, o revisa que exista un rango configurado.
              </p>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
