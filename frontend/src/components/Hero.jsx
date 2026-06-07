import { ChevronDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiAssetUrl } from '../api/client'

const DEFAULT_HERO_IMAGE = '/eventos/medio2.jpg'

const navItems = [
  { label: 'INICIO', href: '/' },
  { label: 'CALENDARIO', href: '/#eventos' },
  { label: 'RESULTADOS', href: '/#eventos' },
  { label: 'GALERÍA', href: '/galeria' },
]

export default function Hero({
  title = 'Encuentra tu próxima carrera',
  subtitle = 'Inscripciones en línea para eventos deportivos en Mexicali y la región.',
  filters = { query: '', distances: [], months: [] },
  distanceOptions = [],
  monthOptions = [],
  siteSettings,
  showSearch = true,
  onQueryChange,
  onDistanceChange,
  onMonthChange,
}) {
  const selectedDistance = filters.distances?.length === 1 ? filters.distances[0] : ''
  const selectedMonth = filters.months?.length === 1 ? filters.months[0] : ''
  const settingsLoaded = siteSettings !== undefined
  const heroImageSrc = siteSettings?.hero_background_image
    ? getApiAssetUrl(siteSettings.hero_background_image)
    : settingsLoaded
      ? DEFAULT_HERO_IMAGE
      : ''
  const heroColorStart = siteSettings?.hero_color_start || '#15070A'
  const heroColorMid = siteSettings?.hero_color_mid || '#6A1A24'
  const heroColorEnd = siteSettings?.hero_color_end || '#090D18'
  const heroBackgroundFit = siteSettings?.hero_background_fit || 'cover'
  const heroPositionX = Number(siteSettings?.hero_background_position_x ?? 50)
  const heroPositionY = Number(siteSettings?.hero_background_position_y ?? 46)
  const heroOpacity = Number(siteSettings?.hero_background_opacity ?? 46) / 100
  const navbarBlur = Number(siteSettings?.navbar_blur ?? 12)
  const navbarOpacity = Number(siteSettings?.navbar_opacity ?? 35) / 100
  const heroMinHeight = showSearch ? 'lg:min-h-[300px]' : 'lg:min-h-[245px]'

  return (
    <section className="relative overflow-hidden bg-[#15070a] text-white">
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(120deg, ${heroColorStart}, ${heroColorMid} 48%, ${heroColorEnd})` }}
        aria-hidden="true"
      />
      {heroImageSrc && (
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `url("${heroImageSrc}")`,
            backgroundPosition: `${heroPositionX}% ${heroPositionY}%`,
            backgroundSize: heroBackgroundFit,
            opacity: heroOpacity,
          }}
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(21,7,10,0.58),rgba(106,26,36,0.30)_48%,rgba(9,13,24,0.62))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.16)_58%,rgba(0,0,0,0.42)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_18px)] opacity-20" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

      <div
        className="relative border-b border-white/10 shadow-2xl shadow-black/20"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${navbarOpacity})`,
          backdropFilter: `blur(${navbarBlur}px)`,
          WebkitBackdropFilter: `blur(${navbarBlur}px)`,
        }}
      >
        <div className="page-container flex min-h-16 flex-col gap-2 py-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <Link to="/" className="flex items-center justify-center lg:justify-start" aria-label="SudorTime inicio">
            <img src="/sudortime.png" alt="SudorTime" className="h-20 w-auto object-contain drop-shadow-2xl sm:h-24 lg:h-28" />
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
            <a href="/#eventos" className="btn-nav-solid">
              Registrarse
            </a>
          </div>
        </div>
      </div>

      <div className={`page-container relative flex min-h-[220px] flex-col items-center justify-center py-8 text-center sm:min-h-[245px] sm:py-9 ${heroMinHeight}`}>
        <div className="max-w-3xl animate-[fadeUp_.55s_ease-out]">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
            {title}
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-6 text-white/82 sm:text-base">
            {subtitle}
          </p>
        </div>

        {showSearch && (
          <form
            className="mt-6 grid w-full max-w-4xl gap-3 rounded-2xl border border-white/20 bg-black/30 p-3 shadow-2xl shadow-black/30 backdrop-blur-md md:grid-cols-[1.35fr_0.8fr_0.8fr]"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="hero-field">
              <Search className="h-5 w-5 shrink-0 text-white/70" aria-hidden="true" />
              <input
                type="search"
                value={filters.query || ''}
                placeholder="Buscar por evento o ciudad..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/62"
                aria-label="Buscar por evento o ciudad"
                onChange={(event) => onQueryChange?.(event.target.value)}
              />
            </label>

            <label className="hero-field">
              <select
                value={selectedDistance}
                className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold text-white outline-none"
                aria-label="Filtrar por distancia"
                onChange={(event) => onDistanceChange?.(event.target.value)}
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
                onChange={(event) => onMonthChange?.(event.target.value)}
              >
                <option value="">Mes</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>{month.longLabel}</option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
            </label>
          </form>
        )}
      </div>
    </section>
  )
}
