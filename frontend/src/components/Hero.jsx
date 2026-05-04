export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-red-900 bg-[length:200%_200%] animate-[gradientMove_10s_ease-in-out_infinite]">

      {/* Glow */}
      <div className="absolute -top-20 left-1/3 h-[280px] w-[280px] rounded-full bg-red-500/20 blur-3xl" />

      {/* Contenedor principal */}
      <div className="relative mx-auto max-w-7xl px-6 h-[180px] md:h-[220px] flex items-center justify-between gap-10">

        {/* IZQUIERDA → LOGO GRANDE */}
        <div className="flex-1 flex items-center">
          <img
            src="/sudortime.png"
            alt="SudorTime"
            className="h-full max-h-[140px] md:max-h-[222px] w-auto object-contain animate-[fadeUp_0.8s_ease-out]"
          />
        </div>

        {/* DERECHA → TEXTO */}
        <div className="flex-1 text-right text-white">

          <h1 className="text-xl md:text-3xl font-bold animate-[fadeUp_1s_ease-out]">
            Encuentra tu próxima carrera
          </h1>

          <p className="mt-2 text-sm md:text-base text-slate-300 animate-[fadeUp_1.2s_ease-out]">
            Resultados, inscripciones y eventos en un solo lugar
          </p>

        </div>

      </div>
    </section>
  )
}