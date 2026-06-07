import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getApiAssetUrl } from '../../api/client'
import { getSiteSettings, updateSiteSettings, uploadHeroBackground } from '../../api/siteSettings'

const defaultSettings = {
  hero_background_image: '',
  hero_color_start: '#15070A',
  hero_color_mid: '#6A1A24',
  hero_color_end: '#090D18',
  hero_background_fit: 'cover',
  hero_background_position_x: 50,
  hero_background_position_y: 46,
  hero_background_opacity: 46,
}

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings)
  const [heroFile, setHeroFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      setError('')
      const data = await getSiteSettings()
      setSettings({
        ...defaultSettings,
        ...data,
      })
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los ajustes del sitio')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setSettings((current) => ({ ...current, [name]: value }))
  }

  function showSuccess(message) {
    setError('')
    setSuccess(message)
  }

  function showError(err, fallback) {
    setSuccess('')
    setError(err.message || fallback)
  }

  async function saveColors(e) {
    e.preventDefault()
    try {
      setSaving('colors')
      const data = await updateSiteSettings({
        hero_background_image: settings.hero_background_image || null,
        hero_color_start: settings.hero_color_start,
        hero_color_mid: settings.hero_color_mid,
        hero_color_end: settings.hero_color_end,
        hero_background_fit: settings.hero_background_fit,
        hero_background_position_x: Number(settings.hero_background_position_x),
        hero_background_position_y: Number(settings.hero_background_position_y),
        hero_background_opacity: Number(settings.hero_background_opacity),
      })
      setSettings({ ...defaultSettings, ...data })
      showSuccess('Ajustes del hero guardados.')
    } catch (err) {
      showError(err, 'No se pudieron guardar los ajustes')
    } finally {
      setSaving('')
    }
  }

  async function uploadBackground(e) {
    e.preventDefault()
    if (!heroFile) {
      setError('Selecciona una imagen primero.')
      return
    }

    try {
      setSaving('hero-background')
      const data = await uploadHeroBackground(heroFile)
      setSettings({ ...defaultSettings, ...data })
      setHeroFile(null)
      showSuccess('Fondo del inicio subido correctamente.')
    } catch (err) {
      showError(err, 'No se pudo subir el fondo del inicio')
    } finally {
      setSaving('')
    }
  }

  return (
    <AdminLayout
      title="Ajustes del sitio"
      subtitle="Personaliza elementos generales de la página inicial, separados de la configuración de cada evento."
    >
      {(error || success) && (
        <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-semibold ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {error || success}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Cargando ajustes...</p>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Hero de la página inicial</h2>
              <p className="mt-1 text-sm text-slate-500">
                Estos colores y la imagen de fondo se aplican al primer bloque que ve el corredor.
              </p>
            </div>

            <form onSubmit={saveColors} className="space-y-5">
              <Field label="Color inicial del degradado">
                <ColorInput name="hero_color_start" value={settings.hero_color_start} onChange={handleChange} />
              </Field>
              <Field label="Color principal / vino">
                <ColorInput name="hero_color_mid" value={settings.hero_color_mid} onChange={handleChange} />
              </Field>
              <Field label="Color final del degradado">
                <ColorInput name="hero_color_end" value={settings.hero_color_end} onChange={handleChange} />
              </Field>
              <Field label="URL de fondo opcional">
                <input
                  name="hero_background_image"
                  value={settings.hero_background_image || ''}
                  onChange={handleChange}
                  placeholder="/uploads/site/hero.png o https://..."
                  className={inputClass()}
                />
              </Field>
              <Field label="Modo de imagen">
                <select name="hero_background_fit" value={settings.hero_background_fit} onChange={handleChange} className={inputClass()}>
                  <option value="cover">Cubrir todo el hero</option>
                  <option value="contain">Ver foto completa</option>
                </select>
              </Field>
              <RangeField
                label="Mover horizontal"
                name="hero_background_position_x"
                value={settings.hero_background_position_x}
                minLabel="Izquierda"
                maxLabel="Derecha"
                onChange={handleChange}
              />
              <RangeField
                label="Mover vertical"
                name="hero_background_position_y"
                value={settings.hero_background_position_y}
                minLabel="Arriba"
                maxLabel="Abajo"
                onChange={handleChange}
              />
              <RangeField
                label="Visibilidad de la foto"
                name="hero_background_opacity"
                value={settings.hero_background_opacity}
                minLabel="Sutil"
                maxLabel="Fuerte"
                onChange={handleChange}
              />

              <button disabled={saving === 'colors'} className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {saving === 'colors' ? 'Guardando...' : 'Guardar ajustes'}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Fondo del inicio</h2>
              <p className="mt-1 text-sm text-slate-500">
                Se guarda en la carpeta de uploads del backend. En Render, esa carpeta usa tu persistent disk si `UPLOADS_DIR` apunta a él.
              </p>
            </div>

            {settings.hero_background_image ? (
              <div className="relative h-56 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                <div
                  className="absolute inset-0 bg-no-repeat"
                  style={{
                    backgroundImage: `url("${getApiAssetUrl(settings.hero_background_image)}")`,
                    backgroundPosition: `${settings.hero_background_position_x}% ${settings.hero_background_position_y}%`,
                    backgroundSize: settings.hero_background_fit,
                    opacity: Number(settings.hero_background_opacity) / 100,
                  }}
                />
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Sin fondo personalizado. Se usará la imagen por defecto.
              </div>
            )}

            <form onSubmit={uploadBackground} className="mt-5 space-y-4">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                className={inputClass()}
              />
              {heroFile && <p className="text-xs font-semibold text-slate-500">{heroFile.name}</p>}
              <button disabled={saving === 'hero-background'} className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {saving === 'hero-background' ? 'Subiendo...' : 'Subir fondo del inicio'}
              </button>
            </form>
          </section>
        </div>
      )}
    </AdminLayout>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function ColorInput({ name, value, onChange }) {
  return (
    <div className="grid grid-cols-[52px_1fr] gap-3">
      <input type="color" name={name} value={value} onChange={onChange} className="h-12 w-full rounded-xl border border-slate-300 bg-white p-1" />
      <input name={name} value={value} onChange={onChange} className={inputClass()} />
    </div>
  )
}

function RangeField({ label, name, value, minLabel, maxLabel, onChange }) {
  return (
    <Field label={`${label}: ${value}%`}>
      <input
        type="range"
        name={name}
        min="0"
        max="100"
        value={value}
        onChange={onChange}
        className="w-full accent-[#6A1A24]"
      />
      <div className="mt-1 flex justify-between text-xs font-semibold text-slate-500">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </Field>
  )
}

function inputClass() {
  return 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900'
}
