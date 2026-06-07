import { createElement, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Camera, Images, MapPin, Route } from 'lucide-react'
import Hero from '../components/Hero'
import { getApiAssetUrl } from '../api/client'
import { getGalleryAlbums } from '../api/gallery'
import { getSiteSettings } from '../api/siteSettings'

const fallbackImage = '/eventos/medio2.jpg'
const brandColor = '#6A1A24'

export default function GalleryPage() {
  const [albums, setAlbums] = useState([])
  const [siteSettings, setSiteSettings] = useState(undefined)
  const [activeYear, setActiveYear] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAlbums() {
      try {
        setLoading(true)
        setError('')
        const [data, settings] = await Promise.all([
          getGalleryAlbums(),
          getSiteSettings().catch((settingsError) => {
            console.warn('No pudimos cargar los ajustes del sitio:', settingsError)
            return null
          }),
        ])
        setSiteSettings(settings)
        setAlbums(data)
      } catch (err) {
        setError(err.message || 'No se pudo cargar la galería')
      } finally {
        setLoading(false)
      }
    }

    loadAlbums()
  }, [])

  const yearOptions = useMemo(() => {
    const years = albums
      .map((album) => getAlbumYear(album.fecha))
      .filter(Boolean)

    return ['todos', ...new Set([2026, 2025, ...years].sort((a, b) => b - a))]
  }, [albums])

  const filteredAlbums = useMemo(() => {
    if (activeYear === 'todos') return albums
    return albums.filter((album) => String(getAlbumYear(album.fecha)) === String(activeYear))
  }, [albums, activeYear])

  return (
    <main className="min-h-screen bg-[#F7F6F4] text-slate-950">
      <Hero
        title="Galería de carreras"
        subtitle="Revive cada evento con álbumes publicados en Facebook. Elige una carrera y abre la galería completa."
        siteSettings={siteSettings}
        showSearch={false}
      />

      <section className="relative overflow-hidden bg-[#F7F6F4] py-10 sm:py-14 lg:py-16">
        <BackgroundTexture />

        <div className="page-container relative">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#6A1A24]">Fotos</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Álbumes disponibles
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-500">
              Acceso rápido a las galerías de Sudor Cachanilla en Facebook.
            </p>
          </header>

          <nav className="mt-7 flex flex-wrap justify-center gap-2" aria-label="Filtrar álbumes por año">
            {yearOptions.map((year) => {
              const active = String(activeYear) === String(year)
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => setActiveYear(year)}
                  className={`rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wide transition ${
                    active
                      ? 'bg-[#6A1A24] text-white shadow-lg shadow-[#6A1A24]/20'
                      : 'border border-slate-200 bg-white/80 text-slate-600 shadow-sm hover:border-[#6A1A24]/30 hover:text-[#6A1A24]'
                  }`}
                >
                  {year === 'todos' ? 'Todos' : year}
                </button>
              )
            })}
          </nav>

          {loading && (
            <div className="mt-10 flex flex-wrap justify-center gap-7">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-[430px] w-full max-w-[390px] animate-pulse rounded-[1.75rem] bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]" />
              ))}
            </div>
          )}

          {error && (
            <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-center text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && filteredAlbums.length === 0 && (
            <div className="mx-auto mt-10 max-w-xl rounded-[1.75rem] border border-dashed border-slate-300 bg-white/85 p-10 text-center shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <Images className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-4 text-xl font-black">No hay álbumes en este filtro</h3>
              <p className="mt-2 text-sm text-slate-500">Prueba con otro año o vuelve a “Todos”.</p>
            </div>
          )}

          {!loading && !error && filteredAlbums.length > 0 && (
            <div className="mt-10 flex flex-wrap justify-center gap-7 lg:gap-8">
              {filteredAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function AlbumCard({ album }) {
  const imageSrc = album.imagen_portada ? getApiAssetUrl(album.imagen_portada) : fallbackImage

  return (
    <article className="group flex w-full max-w-[390px] flex-col overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_22px_70px_rgba(15,23,42,0.10)] ring-1 ring-slate-950/[0.03] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
      <div className="relative aspect-[16/11] overflow-hidden bg-slate-200">
        <img
          src={imageSrc}
          alt={album.titulo}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          {album.fecha && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/88 px-3 py-2 text-xs font-black text-slate-900 shadow-lg backdrop-blur-md">
              <CalendarDays className="h-4 w-4 text-[#6A1A24]" />
              {formatShortDate(album.fecha)}
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full bg-white/88 px-3 py-2 text-xs font-black text-slate-900 shadow-lg backdrop-blur-md">
            <Camera className="h-4 w-4 text-[#6A1A24]" />
            {formatPhotoCount(album.cantidad_fotos)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-xl font-black leading-tight tracking-tight text-slate-950">
          {album.titulo}
        </h3>

        {album.descripcion && (
          <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
            {album.descripcion}
          </p>
        )}

        <dl className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
          <MetaRow icon={MapPin} label="Ubicación" value={album.ubicacion || 'Mexicali, B.C.'} />
          <MetaRow icon={CalendarDays} label="Fecha" value={album.fecha ? formatFullDate(album.fecha) : 'Fecha por definir'} />
          <MetaRow icon={Route} label="Distancia" value={album.distancia || 'Distancia por definir'} />
        </dl>

        <a
          href={album.facebook_url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6A1A24] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#6A1A24]/20 transition hover:bg-[#53131b] hover:shadow-xl hover:shadow-[#6A1A24]/25"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black leading-none text-[#1877F2]">
            f
          </span>
          Ver fotos en Facebook
        </a>
      </div>
    </article>
  )
}

function MetaRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      {createElement(icon, { className: 'h-4 w-4 shrink-0 text-[#6A1A24]', 'aria-hidden': true })}
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 truncate">{value}</dd>
    </div>
  )
}

function BackgroundTexture() {
  return (
    <>
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rotate-[-18deg] rounded-full opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(ellipse at center, ${brandColor} 0 38%, transparent 39%)`,
          backgroundSize: '42px 22px',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-12 h-80 w-80 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-radial-gradient(circle at center, transparent 0 18px, ${brandColor} 19px 21px, transparent 22px 34px)`,
        }}
        aria-hidden="true"
      />
    </>
  )
}

function getAlbumYear(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date.getFullYear()
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(date)
}

function formatFullDate(value) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}

function formatPhotoCount(value) {
  const count = Number(value)
  if (!Number.isFinite(count) || count <= 0) return 'Fotos'
  return `+${count.toLocaleString('es-MX')} Fotos`
}
