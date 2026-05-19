export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(15,23,42,0.98),rgba(127,29,29,0.78))]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />

      <div className="page-container relative flex min-h-[170px] flex-col items-center justify-center gap-3 py-5 text-center sm:min-h-[210px] sm:py-7 lg:min-h-[230px]">
        <img
          src="/sudortime.png"
          alt="SudorTime"
          className="h-36 w-auto object-contain drop-shadow-2xl sm:h-44 lg:h-52"
        />
        <div>
          <p className="eyebrow text-red-200">Calendario deportivo</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
            Encuentra tu proxima carrera
          </h1>
        </div>
      </div>
    </section>
  )
}
