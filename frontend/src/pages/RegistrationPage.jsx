import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getEventById } from '../api/events'
import { createAthlete } from '../api/athletes'
import { createRegistration } from '../api/registrations'

export default function RegistrationPage() {
  const { id } = useParams()
  const location = useLocation()

  const [evento, setEvento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
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

        const data = await getEventById(id)

        setEvento({
          ...data,
          organizador: 'Sudortime Sports',
          costo: '$300 MXN',
          cierre: 'Un día antes del evento',
          categorias:
            data.categorias && data.categorias.length > 0
              ? data.categorias
              : [
                  {
                    id: 1,
                    nombre: '5K Libre',
                    descripcion: 'Categoría abierta para corredores mayores de edad.',
                    distancia: '5 km',
                    costo: '$300 MXN',
                  },
                  {
                    id: 2,
                    nombre: '10K Libre',
                    descripcion: 'Para corredores que buscan un reto competitivo mayor.',
                    distancia: '10 km',
                    costo: '$350 MXN',
                  },
                ],
        })
      } catch (err) {
        setError(err.message || 'No se pudo cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id])

  const isEvento = location.pathname === `/evento/${id}`
  const isResultados = location.pathname === `/evento/${id}/resultados`
  const isInscripcion = location.pathname === `/evento/${id}/inscripcion`

  const formularioValido = useMemo(() => {
    return (
      categoriaSeleccionada &&
      formData.nombre.trim() &&
      formData.apellidos.trim() &&
      formData.fechaNacimiento &&
      formData.sexo &&
      formData.telefono.trim() &&
      formData.correo.trim() &&
      formData.ciudad.trim() &&
      formData.talla &&
      formData.contactoEmergencia.trim() &&
      formData.telefonoEmergencia.trim()
    )
  }, [categoriaSeleccionada, formData])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!categoriaSeleccionada) {
      setError('Selecciona una categoría para continuar.')
      return
    }

    if (!formularioValido) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    try {
      setSending(true)

      const athlete = await createAthlete({
        nombre: formData.nombre.trim(),
        apellido: formData.apellidos.trim(),
        sexo: formData.sexo,
      })

      await createRegistration({
        event_id: Number(id),
        athlete_id: athlete.id,
        categoria: categoriaSeleccionada.nombre,
      })

      setSuccess('Inscripción realizada correctamente.')
      setFormData({
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
      setCategoriaSeleccionada(null)
    } catch (err) {
      setError(err.message || 'No se pudo completar la inscripción')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-48 rounded-full bg-slate-200" />
            <div className="h-12 w-2/3 rounded-2xl bg-slate-200" />
            <div className="h-5 w-1/3 rounded-full bg-slate-200" />
            <div className="mt-8 h-72 rounded-[2rem] bg-slate-200" />
          </div>
        </div>
      </div>
    )
  }

  if (error && !evento) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-bold">Error</h1>
          <p className="mt-4 text-slate-600">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link to="/" className="transition hover:text-slate-900">
                Inicio
              </Link>
              <span>/</span>
              <Link
                to={`/evento/${evento.id}`}
                className="transition hover:text-slate-900"
              >
                {evento.nombre}
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-900">Inscripción</span>
            </div>

            <div className="mt-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Inscripción al evento
              </h1>
              <p className="mt-1 text-sm text-slate-500 md:text-base">
                {evento.nombre} · {evento.fecha} · {evento.lugar}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-4">
          <nav className="flex flex-wrap gap-2">
            <Link
              to={`/evento/${evento.id}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isEvento
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Resumen
            </Link>

            <Link
              to={`/evento/${evento.id}/inscripcion`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isInscripcion
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Inscripción
            </Link>

            <Link
              to={`/evento/${evento.id}/resultados`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isResultados
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Resultados
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Paso 1
              </p>
              <h2 className="mt-2 text-2xl font-bold">Selecciona tu categoría</h2>
              <p className="mt-2 text-sm text-slate-500">
                Elige la opción que corresponda a tu participación.
              </p>

              <div className="mt-6 grid gap-4">
                {evento.categorias.map((categoria, index) => {
                  const activa =
                    categoriaSeleccionada?.id === categoria.id ||
                    (!categoria.id &&
                      categoriaSeleccionada?.nombre === categoria.nombre)

                  return (
                    <button
                      key={categoria.id ?? index}
                      type="button"
                      onClick={() => setCategoriaSeleccionada(categoria)}
                      className={`rounded-3xl border p-6 text-left transition ${
                        activa
                          ? 'border-red-600 bg-red-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {categoria.nombre}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {categoria.descripcion || 'Categoría disponible para este evento.'}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 text-sm">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                            {categoria.distancia || 'Por definir'}
                          </span>
                          <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
                            {categoria.costo || evento.costo}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Paso 2
              </p>
              <h2 className="mt-2 text-2xl font-bold">Datos del corredor</h2>
              <p className="mt-2 text-sm text-slate-500">
                Completa la información necesaria para registrar tu participación.
              </p>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Tus apellidos"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sexo
                  </label>
                  <select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Tu teléfono"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Ciudad de procedencia
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Ciudad"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Talla de playera
                  </label>
                  <select
                    name="talla"
                    value={formData.talla}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                  >
                    <option value="">Selecciona una talla</option>
                    <option value="CH">CH</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="XG">XG</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Club o equipo
                  </label>
                  <input
                    type="text"
                    name="equipo"
                    value={formData.equipo}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Contacto de emergencia
                  </label>
                  <input
                    type="text"
                    name="contactoEmergencia"
                    value={formData.contactoEmergencia}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Nombre del contacto"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Teléfono de emergencia
                  </label>
                  <input
                    type="tel"
                    name="telefonoEmergencia"
                    value={formData.telefonoEmergencia}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Teléfono del contacto"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {success}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={!formularioValido || sending}
                  className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? 'Procesando inscripción...' : 'Completar inscripción'}
                </button>

                <Link
                  to={`/evento/${evento.id}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Volver al evento
                </Link>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Resumen del evento
              </p>
              <h2 className="mt-2 text-2xl font-bold">{evento.nombre}</h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Fecha
                  </p>
                  <p className="mt-2 font-semibold">{evento.fecha}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Lugar
                  </p>
                  <p className="mt-2 font-semibold">{evento.lugar}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Organizador
                  </p>
                  <p className="mt-2 font-semibold">{evento.organizador}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Costo base
                  </p>
                  <p className="mt-2 font-semibold">{evento.costo}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Cierre de inscripciones
                  </p>
                  <p className="mt-2 font-semibold">{evento.cierre}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">
                Categoría seleccionada
              </p>

              {categoriaSeleccionada ? (
                <div className="mt-4 space-y-3">
                  <h3 className="text-2xl font-bold">{categoriaSeleccionada.nombre}</h3>
                  <p className="text-sm leading-6 text-slate-300">
                    {categoriaSeleccionada.descripcion || 'Categoría seleccionada para tu registro.'}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                      {categoriaSeleccionada.distancia || 'Por definir'}
                    </span>
                    <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-semibold">
                      {categoriaSeleccionada.costo || evento.costo}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Selecciona una categoría para ver aquí el resumen de tu inscripción.
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}