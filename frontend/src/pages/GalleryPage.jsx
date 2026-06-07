import { useEffect, useState } from 'react'
import { CalendarDays, ExternalLink, Images } from 'lucide-react'
import Hero from '../components/Hero'
import { getApiAssetUrl } from '../api/client'
import { getGalleryAlbums } from '../api/gallery'
import { getSiteSettings } from '../api/siteSettings'

const fallbackImage = '/eventos/medio2.jpg'

export default function GalleryPage() {
  const [albums, setAlbums] = useState([])
  const [siteSettings, setSiteSettings] = useState(undefined)
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

  return (
    <main className="min-h-screen bg-[#FDFBF9] text-slate-950">
      <Hero
        title="Galería de carreras"
        subtitle="Revive cada evento con álbumes publicados en Facebook. Elige una carrera y abre la galería completa."
        siteSettings={siteSettings}
        showSearch={false}
      />

      <section className="page-container py-10 sm:py-14">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#6A1A24]">Fotos</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Álbumes disponibles</h2>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
            {albums.length} álbum{albums.length === 1 ? '' : 'es'}
          </span>
        </div>

        {loading && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && albums.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Images className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-4 text-xl font-black">Aún no hay álbumes publicados</h3>
            <p className="mt-2 text-sm text-slate-500">Cuando el admin agregue enlaces de Facebook aparecerán aquí.</p>
          </div>
        )}

        {!loading && !error && albums.length > 0 && (
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {albums.map((album) => (
              <article key={album.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                  <img
                    src={album.imagen_portada ? getApiAssetUrl(album.imagen_portada) : fallbackImage}
                    alt={album.titulo}
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                  />
                  {album.fecha && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-900 shadow-lg">
                      <CalendarDays className="h-4 w-4 text-[#6A1A24]" />
                      {formatDate(album.fecha)}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black leading-tight">{album.titulo}</h3>
                  {album.descripcion && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{album.descripcion}</p>
                  )}
                  <a
                    href={album.facebook_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6A1A24] px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-[#6A1A24]/20 transition hover:bg-[#53131b]"
                  >
                    Ver álbum en Facebook
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}
