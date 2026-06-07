import { ChevronDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'INICIO', href: '/' },
  { label: 'CALENDARIO', href: '#eventos' },
  { label: 'RESULTADOS', href: '#eventos' },
  { label: 'GALERÍA', href: '#eventos' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#15070a] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(18,6,9,0.96),rgba(106,26,36,0.9)_48%,rgba(9,13,24,0.96))]" />
      <div className="absolute inset-0 bg-[url('/eventos/medio2.jpg')] bg-cover bg-center opacity-[0.18]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_18px)] opacity-30" />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

      <div className="relative border-b border-white/10 bg-black/35 shadow-2xl shadow-black/20 backdrop-blur-md">
        <div className="page-container flex min-h-16 flex-col gap-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <Link to="/" className="flex items-center justify-center lg:justify-start" aria-label="SudorTime inicio">
            <img src="/sudortime.png" alt="SudorTime" className="h-11 w-auto object-contain drop-shadow-xl" />
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-y-2 text-xs font-black tracking-wide text-white/90 sm:text-sm">
            {navItems.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3 transition hover:text-white lg:px-4"
              >
                {index > 0 && <span className="mr-3 text-white/25 lg:mr-4">|</span>}
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-center gap-3">
            <Link to="/admin/login" className="btn-nav-outline">
              Iniciar sesión
            </Link>
            <a href="#eventos" className="btn-nav-solid">
              Registrarse
            </a>
          </div>
        </div>
      </div>

      <div className="page-container relative flex min-h-[360px] flex-col items-center justify-center py-12 text-center sm:min-h-[410px] sm:py-14 lg:min-h-[430px]">
        <div className="max-w-4xl animate-[fadeUp_.55s_ease-out]">
          <p className="eyebrow text-red-100">SudorTime</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Encuentra tu próxima carrera
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-white/82 sm:text-lg">
            Inscripciones en línea para eventos deportivos en Mexicali y la región.
          </p>
        </div>

        <form
          className="mt-9 grid w-full max-w-5xl gap-3 rounded-2xl border border-white/20 bg-black/30 p-3 shadow-2xl shadow-black/30 backdrop-blur-md md:grid-cols-[1.4fr_0.8fr_0.8fr]"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="hero-field">
            <Search className="h-5 w-5 shrink-0 text-white/70" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por Evento o Ciudad..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/62"
              aria-label="Buscar por evento o ciudad"
            />
          </label>

          <label className="hero-field">
            <select className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold text-white outline-none" aria-label="Filtrar por distancia">
              <option>Distancia (ej. 5K, 10K)</option>
              <option>5K</option>
              <option>10K</option>
              <option>Half</option>
            </select>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
          </label>

          <label className="hero-field">
            <select className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold text-white outline-none" aria-label="Filtrar por mes">
              <option>Mes (ej. Noviembre)</option>
              <option>Marzo</option>
              <option>Abril</option>
              <option>Mayo</option>
              <option>Junio</option>
              <option>Noviembre</option>
            </select>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
          </label>
        </form>
      </div>
    </section>
  )
}
