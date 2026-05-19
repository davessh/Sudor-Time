import { ArrowRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(15,23,42,0.98),rgba(127,29,29,0.72))]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />

      <div className="page-container relative grid min-h-[360px] items-center gap-6 py-8 text-center sm:min-h-[390px] sm:py-10 lg:min-h-[360px] lg:grid-cols-[0.85fr_1.15fr] lg:text-left">
        <div className="order-2 animate-[fadeUp_.55s_ease-out] lg:order-1">
          <p className="eyebrow text-red-200">SudorTime</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Encuentra tu proxima carrera
          </h1>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link to="#eventos" className="btn-primary bg-white text-slate-950 hover:bg-red-700 hover:text-white">
              Ver eventos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/consultar-inscripcion" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white hover:text-slate-950">
              <Search className="mr-2 h-4 w-4" />
              Consultar inscripcion
            </Link>
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <div className="relative animate-[fadeUp_.45s_ease-out]">
            <div className="absolute inset-x-6 bottom-3 h-6 rounded-full bg-black/30 blur-xl" />
            <img
              src="/sudortime.png"
              alt="SudorTime"
              className="relative h-48 w-auto object-contain drop-shadow-2xl sm:h-64 lg:h-80 xl:h-96"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
