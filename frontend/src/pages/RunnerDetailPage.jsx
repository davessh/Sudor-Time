import { Link, useParams } from 'react-router-dom'

export default function RunnerDetailPage() {
  const { id } = useParams()

  const corredores = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      numero: 101,
      eventoId: 1,
      eventoNombre: 'Carrera 5K Primavera',
      tiempo: '00:18:35',
      posicionGeneral: 1,
      posicionCategoria: 1,
      categoria: 'Libre',
      rama: 'Varonil',
      ritmo: '3:43/km',
      club: 'Atléticos MX',
      parciales: [
        { punto: 'Salida', tiempo: '00:00:00' },
        { punto: 'Km 2', tiempo: '00:07:18' },
        { punto: 'Km 4', tiempo: '00:14:58' },
        { punto: 'Meta', tiempo: '00:18:35' },
      ],
    },
    {
      id: 2,
      nombre: 'Carlos López',
      numero: 102,
      eventoId: 1,
      eventoNombre: 'Carrera 5K Primavera',
      tiempo: '00:19:10',
      posicionGeneral: 2,
      posicionCategoria: 2,
      categoria: 'Libre',
      rama: 'Varonil',
      ritmo: '3:50/km',
      club: 'Runners BC',
      parciales: [
        { punto: 'Salida', tiempo: '00:00:00' },
        { punto: 'Km 2', tiempo: '00:07:35' },
        { punto: 'Km 4', tiempo: '00:15:21' },
        { punto: 'Meta', tiempo: '00:19:10' },
      ],
    },
    {
      id: 3,
      nombre: 'Ana Torres',
      numero: 201,
      eventoId: 1,
      eventoNombre: 'Carrera 5K Primavera',
      tiempo: '00:21:15',
      posicionGeneral: 3,
      posicionCategoria: 1,
      categoria: 'Libre',
      rama: 'Femenil',
      ritmo: '4:15/km',
      club: 'Team Delta',
      parciales: [
        { punto: 'Salida', tiempo: '00:00:00' },
        { punto: 'Km 2', tiempo: '00:08:10' },
        { punto: 'Km 4', tiempo: '00:16:45' },
        { punto: 'Meta', tiempo: '00:21:15' },
      ],
    },
  ]

  const corredor = corredores.find((c) => c.id === Number(id))

  if (!corredor) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl font-bold">Corredor no encontrado</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <Link
            to={`/evento/${corredor.eventoId}/resultados`}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Volver a resultados
          </Link>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Ficha del corredor
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                {corredor.nombre}
              </h1>
              <p className="mt-2 text-slate-500">
                {corredor.eventoNombre}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.print()}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Descargar certificado
              </button>

              <button className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-100">
                Compartir resultado
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Tiempo oficial
                  </p>
                  <p className="mt-2 font-mono text-5xl font-bold tracking-tight">
                    {corredor.tiempo}
                  </p>
                  <p className="mt-3 text-base text-slate-500">
                    Ritmo promedio: <span className="font-semibold text-slate-900">{corredor.ritmo}</span>
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-100 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Posición general
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      #{corredor.posicionGeneral}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Posición categoría
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      #{corredor.posicionCategoria}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Parciales registrados</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  {corredor.parciales.length} puntos
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {corredor.parciales.map((parcial, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-slate-200 px-5 py-4 last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold">{parcial.punto}</p>
                      <p className="text-sm text-slate-500">Registro {index + 1}</p>
                    </div>

                    <p className="font-mono text-lg font-semibold">
                      {parcial.tiempo}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold">Datos del corredor</h3>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Número
                  </p>
                  <p className="mt-1 text-base font-medium">{corredor.numero}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Categoría
                  </p>
                  <p className="mt-1 text-base font-medium">{corredor.categoria}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Rama
                  </p>
                  <p className="mt-1 text-base font-medium">{corredor.rama}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Club
                  </p>
                  <p className="mt-1 text-base font-medium">{corredor.club}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold">Acciones</h3>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white hover:opacity-90"
                >
                  Descargar certificado PDF
                </button>

                <button className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-sm font-semibold hover:bg-slate-100">
                  Compartir resultado
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}