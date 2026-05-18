import { ShieldCheck, Trophy } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(15,23,42,0.98),rgba(127,29,29,0.78))]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />

      <div className="page-container relative grid min-h-[280px] items-center gap-8 py-8 sm:min-h-[320px] sm:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-12">
        <div className="order-2 space-y-5 lg:order-1">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85">
              <ShieldCheck className="h-4 w-4" />
              Inscripciones
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85">
              <Trophy className="h-4 w-4" />
              Resultados
            </span>
          </div>

          <div>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Encuentra tu próxima carrera
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
              Eventos, registros y resultados en una experiencia clara para corredores y equipos organizadores.
            </p>
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <img
            src="/sudortime.png"
            alt="SudorTime"
            className="h-28 w-auto object-contain drop-shadow-2xl sm:h-36 lg:h-44"
          />
        </div>
      </div>
    </section>
  )
}
