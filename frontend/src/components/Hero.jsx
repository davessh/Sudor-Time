import { ChevronDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'INICIO', href: '/' },
  { label: 'CALENDARIO', href: '#eventos' },
  { label: 'RESULTADOS', href: '#eventos' },
  { label: 'GALERÍA', href: '#eventos' },
]

export default function Hero({
  filters,
  distanceOptions = [],
  monthOptions = [],
  onQueryChange,
  onDistanceChange,
  onMonthChange,
}) {
  const selectedDistance = filters.distances.length === 1 ? filters.distances[0] : ''
  const selectedMonth = filters.months.length === 1 ? filters.months[0] : ''

  return (
    <section className="relative overflow-hidden bg-[#15070a] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(18,6,9,0.96),rgba(106,26,36,0.9)_48%,rgba(9,13,24,0.96))]" />
      <div className="absolute inset-0 bg-[url('/eventos/medio2.jpg')] bg-cover bg-center opacity-[0.16]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_18px)] opacity-25" />
      <div className="absolute inset-0 bg-black/38" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

      <div className="relative border-b border-white/10 bg-black/35 shadow-2xl shadow-black/20 backdrop-blur-md">
        <div className="page-container flex min-h-16 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <Link to="/" className="flex items-center justify-center lg:justify-start" aria-label="SudorTime inicio">
            <img src="/sudortime.png" alt="SudorTime" className="h-16 w-auto object-contain drop-shadow-2xl sm:h-[4.5rem] lg:h-20" />
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-y-2 text-xs font-black tracking-wide text-white/90 sm:text-sm">
            {navItems.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className="px-2.5 transition hover:text-white lg:px-4"
              >
                {index > 0 && <span className="mr-2.5 text-white/25 lg:mr-4">|</span>}
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Link to="/admin/login" className="btn-nav-outline">
              Iniciar sesión
            </Link>
            <a href="#eventos" className="btn-nav-solid">
              Registrarse
            </a>
          </div>
        </div>
      </div>

      <div className="page-container relative flex min-h-[300px] flex-col items-center justify-center py-10 text-center sm:min-h-[340px] sm:py-12 lg:min-h-[360px]">
        <div className="max-w-3xl animate-[fadeUp_.55s_ease-out]">
          <p className="eyebrow text-red-100">SudorTime</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Encuentra tu próxima carrera
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-6 text-white/82 sm:text-base lg:text-lg">
            Inscripciones en línea para eventos deportivos en Mexicali y la región.
          </p>
        </div>

        <form
          className="mt-7 grid w-full max-w-4xl gap-3 rounded-2xl border border-white/20 bg-black/30 p-3 shadow-2xl shadow-black/30 backdrop-blur-md md:grid-cols-[1.35fr_0.8fr_0.8fr]"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="hero-field">
            <Search className="h-5 w-5 shrink-0 text-white/70" aria-hidden="true" />
            <input
              type="search"
              value={filters.query}
              placeholder="Buscar por evento o ciudad..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/62"
              aria-label="Buscar por evento o ciudad"
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </label>

          <label className="hero-field">
            <select
              value={selectedDistance}
              className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold text-white outline-none"
              aria-label="Filtrar por distancia"
              onChange={(event) => onDistanceChange(event.target.value)}
            >
              <option value="">Distancia</option>
              {distanceOptions.map((distance) => (
                <option key={distance} value={distance}>{distance}</option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
          </label>

          <label className="hero-field">
            <select
              value={selectedMonth}
              className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold text-white outline-none"
              aria-label="Filtrar por mes"
              onChange={(event) => onMonthChange(event.target.value)}
            >
              <option value="">Mes</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>{month.longLabel}</option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
          </label>
        </form>
      </div>
    </section>
  )
}
