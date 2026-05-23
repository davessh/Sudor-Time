import { Link } from 'react-router-dom'
import { LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react'

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
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="eyebrow mt-5">Acceso privado</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Tu inscripcion se consulta con enlace privado</h1>
          <p className="mt-4 leading-7 text-slate-600">
            Para proteger tus datos, SudorTime ya no permite buscar inscripciones por nombre, correo, telefono o numero de registro.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info icon={MailCheck} title="Al inscribirte" text="Guarda el enlace privado que aparece al continuar al pago." />
            <Info icon={ShieldCheck} title="Mas seguridad" text="Solo quien tenga ese enlace puede retomar o revisar esa preinscripcion." />
          </div>

          <Link to="/" className="btn-primary mt-6 w-full">
            Ver eventos disponibles
          </Link>
        </section>
      </main>
    </div>
  )
}

function Info({ icon, title, text }) {
  const Icon = icon
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-red-700" />
      <p className="mt-3 font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}
