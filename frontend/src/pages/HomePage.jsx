import { useEffect, useMemo, useState } from 'react'
import Hero from '../components/Hero'
import EventCard from '../components/EventCard'
import EventSkeleton from '../components/EventSkeleton'
import { getEvents, getEventSetup } from '../api/events'
import { getSiteSettings } from '../api/siteSettings'
import { getResultsByEvent } from '../api/results'
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'

const FALLBACK_MONTHS = [3, 4, 5, 6]
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getEventPrices(evento) {
  return [...(evento.products || []), ...(evento.modalities || [])]
    .map((item) => Number(item.precio))
    .filter((price) => Number.isFinite(price) && price >= 0)
}

function getEventMinPrice(evento) {
  const prices = getEventPrices(evento).filter((price) => price > 0)
  return prices.length ? Math.min(...prices) : null
}

function normalizeDistanceLabel(value) {
  const text = normalizeText(value)
  const number = Number.parseFloat(text.replace(',', '.'))

  if (text.includes('half') || text.includes('medio') || text.includes('21k') || number >= 20) return 'Half'
  if (text.includes('10') || number === 10) return '10K'
  if (text.includes('5') || number === 5) return '5K'

  return value || ''
}

function getEventDistances(evento) {
  const labels = (evento.modalities || [])
    .map((modality) => normalizeDistanceLabel(modality.distancia_km || modality.nombre))
    .filter(Boolean)

  return [...new Set(labels)]
}

function getEventMonth(evento) {
  if (!evento.fecha) return null

  const date = new Date(`${evento.fecha}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null

  return date.getMonth() + 1
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export default function HomePage() {
  const [eventos, setEventos] = useState([])
  const [siteSettings, setSiteSettings] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    query: '',
    maxPrice: 500,
    distances: [],
    months: [],
  })

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true)
        setError('')
        const [data, settings] = await Promise.all([
          getEvents(),
          getSiteSettings().catch((settingsError) => {
            console.warn('No pudimos cargar los ajustes del sitio:', settingsError)
            return null
          }),
        ])
        setSiteSettings(settings)
        const enriched = await Promise.all(
          data.map(async (event) => {
            let setup = event
            let hasResults = false

            try {
              setup = await getEventSetup(event.id)
            } catch (setupError) {
              console.warn(`No pudimos cargar filtros para el evento ${event.id}:`, setupError)
            }

            try {
              const results = await getResultsByEvent(event.id)
              hasResults = Array.isArray(results) && results.length > 0
            } catch (resultsError) {
              console.warn(`No pudimos revisar resultados para el evento ${event.id}:`, resultsError)
            }

            return { ...setup, hasResults }
          }),
        )
        setEventos(enriched)
      } catch (error) {
        console.error('Error cargando los eventos:', error)
        setError('No pudimos cargar los eventos. Intenta de nuevo en unos minutos.')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const monthOptions = useMemo(() => {
    const months = [...new Set(eventos.map(getEventMonth).filter(Boolean))]
    const values = months.length ? months.sort((a, b) => a - b) : FALLBACK_MONTHS

    return values.map((month) => ({
      value: String(month),
      label: MONTH_LABELS[month - 1],
      longLabel: new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(2026, month - 1, 1)),
    }))
  }, [eventos])

  const distanceOptions = useMemo(() => {
    const distances = eventos.flatMap(getEventDistances)
    return [...new Set(distances)].filter(Boolean)
  }, [eventos])

  const filteredEventos = useMemo(() => {
    const query = normalizeText(filters.query)

    return eventos.filter((evento) => {
      const searchable = normalizeText([
        evento.nombre,
        evento.lugar,
        evento.organizador,
        evento.descripcion,
      ].filter(Boolean).join(' '))
      const matchesQuery = !query || searchable.includes(query)

      const minPrice = getEventMinPrice(evento)
      const matchesPrice = minPrice === null || minPrice <= Number(filters.maxPrice)

      const eventDistances = getEventDistances(evento)
      const matchesDistance = filters.distances.length === 0 || eventDistances.some((distance) => filters.distances.includes(distance))

      const eventMonth = getEventMonth(evento)
      const matchesMonth = filters.months.length === 0 || filters.months.includes(String(eventMonth))

      return matchesQuery && matchesPrice && matchesDistance && matchesMonth
    })
  }, [eventos, filters])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const hasActiveFilters = Boolean(
    filters.query || filters.distances.length || filters.months.length || Number(filters.maxPrice) < 500,
  )
  const activeFilterCount = [
    filters.query ? 1 : 0,
    filters.distances.length,
    filters.months.length,
    Number(filters.maxPrice) < 500 ? 1 : 0,
  ].reduce((total, value) => total + value, 0)

  const resetFilters = () => setFilters({ query: '', maxPrice: 500, distances: [], months: [] })

  return (
    <div className="page-shell">
      <Hero
        subtitle="Inscripciones en línea para eventos deportivos."
        filters={filters}
        distanceOptions={distanceOptions}
        monthOptions={monthOptions}
        siteSettings={siteSettings}
        onQueryChange={(value) => updateFilter('query', value)}
        onDistanceChange={(value) => updateFilter('distances', value ? [value] : [])}
        onMonthChange={(value) => updateFilter('months', value ? [value] : [])}
      />

      <main id="eventos" className="page-container max-w-[1440px] py-3 sm:py-7 lg:py-11">
        <div className="grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[245px_minmax(0,1fr)]">
          <aside className="panel overflow-hidden lg:sticky lg:top-4">
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left lg:hidden"
              aria-expanded={mobileFiltersOpen}
              aria-controls="quick-search-panel"
              onClick={() => setMobileFiltersOpen((open) => !open)}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#6A1A24]" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-black uppercase tracking-tight text-slate-950">Búsqueda rápida</span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                    {activeFilterCount ? `${activeFilterCount} activo${activeFilterCount === 1 ? '' : 's'}` : 'Toca para filtrar'}
                  </span>
                </span>
              </span>
              <ChevronDown
                className={`h-5 w-5 text-slate-500 transition ${mobileFiltersOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                className="mx-4 mb-4 inline-flex min-h-9 items-center justify-center rounded-xl border border-[#6A1A24]/20 bg-[#6A1A24]/5 px-3 text-xs font-black uppercase tracking-wide text-[#6A1A24] lg:hidden"
                onClick={resetFilters}
              >
                Limpiar filtros
              </button>
            )}

            <div className="hidden items-center justify-between gap-3 px-5 pt-5 lg:flex">
              <h2 className="text-sm font-black uppercase tracking-tight text-slate-950">Búsqueda rápida</h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="text-xs font-black uppercase tracking-wide text-[#6A1A24] transition hover:text-[#4C1018]"
                  onClick={() => setFilters({ query: '', maxPrice: 500, distances: [], months: [] })}
                >
                  Limpiar
                </button>
              )}
            </div>

            <div id="quick-search-panel" className={`${mobileFiltersOpen ? 'block' : 'hidden'} border-t border-slate-100 px-4 pb-4 lg:block lg:border-t-0 lg:px-5 lg:pb-5`}>
              <div className="border-b border-slate-200 py-4 lg:hidden">
                <label htmlFor="mobile-event-search" className="text-sm font-black text-slate-950">
                  Evento o ciudad
                </label>
                <div className="mt-2 flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-[#6A1A24]/45 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#6A1A24]/10">
                  <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <input
                    id="mobile-event-search"
                    type="search"
                    value={filters.query || ''}
                    placeholder="Buscar evento..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    onChange={(event) => updateFilter('query', event.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 border-b border-slate-200 pb-5 lg:mt-5">
                <label htmlFor="price-filter" className="text-sm font-black text-slate-950">
                  Precio
                </label>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>$0</span>
                  <span>${filters.maxPrice} MXN</span>
                </div>
                <input
                  id="price-filter"
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={filters.maxPrice}
                  className="mt-3 w-full accent-[#6A1A24]"
                  onChange={(event) => updateFilter('maxPrice', event.target.value)}
                />
              </div>

              <div className="border-b border-slate-200 py-5">
                <p className="text-sm font-black text-slate-950">Distancia</p>
                {distanceOptions.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {distanceOptions.map((distance) => (
                      <label key={distance} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={filters.distances.includes(distance)}
                          className="h-4 w-4 rounded border-slate-300 accent-[#6A1A24]"
                          onChange={() => updateFilter('distances', toggleValue(filters.distances, distance))}
                        />
                        {distance}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-500">Sin distancias configuradas.</p>
                )}
              </div>

              <div className="pt-5">
                <p className="text-sm font-black text-slate-950">Fecha</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                  {monthOptions.map((month) => (
                    <button
                      key={month.value}
                      type="button"
                      className={filters.months.includes(month.value) ? 'quick-month-active' : 'quick-month'}
                      onClick={() => updateFilter('months', toggleValue(filters.months, month.value))}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section aria-label="Eventos disponibles">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Calendario</p>
                <h2 className="section-title mt-2">Próximos eventos</h2>
              </div>
              {!loading && !error && (
                <span className="chip w-fit">
                  {filteredEventos.length} {filteredEventos.length === 1 ? 'evento disponible' : 'eventos disponibles'}
                </span>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {loading ? (
                [1, 2, 3, 4].map((n) => <EventSkeleton key={n} />)
              ) : error ? (
                <div className="panel panel-pad md:col-span-2">
                  <p className="font-semibold text-slate-700">{error}</p>
                </div>
              ) : filteredEventos.length ? (
                filteredEventos.map((evento, index) => <EventCard key={evento.id} evento={evento} index={index} />)
              ) : (
                <div className="panel panel-pad md:col-span-2">
                  <p className="font-semibold text-slate-700">No encontramos eventos con esos filtros.</p>
                  <button
                    type="button"
                    className="mt-4 text-sm font-black text-[#6A1A24] transition hover:text-[#4C1018]"
                    onClick={() => setFilters({ query: '', maxPrice: 500, distances: [], months: [] })}
                  >
                    Ver todos los eventos
                  </button>
                </div>
              )}
            </div>

            {!loading && !error && (
              <p className="mt-8 text-center text-sm font-semibold text-slate-700">
                {filteredEventos.length} {filteredEventos.length === 1 ? 'evento disponible' : 'eventos disponibles'}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
