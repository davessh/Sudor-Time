import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'

export default function RegistrationLookupPage() {
  return (
    <div className="page-shell">
      <header className="border-b border-slate-200 bg-white">
        <div className="page-container flex items-center justify-between py-4">
          <Link to="/" className="text-sm font-bold text-slate-500 transition hover:text-slate-950">
            SudorTime
          </Link>
          <Link to="/" className="text-sm font-bold text-slate-500 transition hover:text-slate-950">
            Inicio
          </Link>
        </div>
      </header>

      <main className="page-container flex min-h-[70vh] items-center justify-center py-10">
        <section className="panel panel-pad w-full max-w-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <SearchX className="h-6 w-6" />
          </div>
          <p className="eyebrow mt-5">Inscripciones</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Consulta no disponible</h1>
          <p className="mt-4 leading-7 text-slate-600">
            Para cuidar los datos de cada corredor, las inscripciones no se buscan publicamente. Si dejaste una preinscripcion pendiente, puedes continuar desde el mismo dispositivo donde la iniciaste.
          </p>

          <Link to="/" className="btn-primary mt-6 w-full">
            Ver eventos disponibles
          </Link>
        </section>
      </main>
    </div>
  )
}
