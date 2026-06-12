import { KeyRound, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginAdmin } from '../../api/auth'
import { clearAdminToken, setAdminToken } from '../../auth/adminAuth'

const initialForm = {
  username: '',
  password: '',
  verification_code: '',
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.username.trim() || !form.password) {
      setError('Captura usuario y contrasena')
      return
    }

    try {
      setLoading(true)
      clearAdminToken()
      const session = await loginAdmin({
        username: form.username.trim(),
        password: form.password,
        verification_code: form.verification_code.trim() || null,
      })
      setAdminToken(session.token)
      navigate(location.state?.from || '/admin')
    } catch (err) {
      clearAdminToken()
      setError(err.message || 'No se pudo validar el acceso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.26em] text-emerald-300">SudorTime Operations</p>
          <h1 className="mt-3 max-w-xl text-5xl font-black leading-tight tracking-tight">
            Acceso reservado para operacion de eventos.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Esta puerta no se anuncia en la pagina publica. El acceso se valida en backend y genera una sesion temporal firmada.
          </p>
          <div className="mt-8 grid max-w-lg gap-3 text-sm font-semibold text-slate-300">
            <SecurityLine text="Usuario y contrasena configurables por entorno." />
            <SecurityLine text="Codigo de verificacion opcional para una segunda barrera." />
            <SecurityLine text="El token maestro ya no se expone como campo de login." />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl shadow-black/40 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-emerald-300">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Acceso interno</p>
              <h2 className="text-2xl font-black tracking-tight">Panel operativo</h2>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-500">
            Ingresa con la cuenta del equipo. Si se configuro codigo de verificacion, tambien sera requerido.
          </p>

          <label className="mt-6 block">
            <span className="field-label">Usuario</span>
            <div className="relative mt-2">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                className="input-control pl-12"
              />
            </div>
          </label>

          <label className="mt-4 block">
            <span className="field-label">Contrasena</span>
            <div className="relative mt-2">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="input-control pl-12"
              />
            </div>
          </label>

          <label className="mt-4 block">
            <span className="field-label">Codigo de verificacion</span>
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                name="verification_code"
                value={form.verification_code}
                onChange={handleChange}
                autoComplete="one-time-code"
                placeholder="Opcional si no esta configurado"
                className="input-control pl-12"
              />
            </div>
          </label>

          {error && <p className="notice-error mt-4">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? 'Validando...' : 'Entrar al panel'}
          </button>
        </form>
      </main>
    </div>
  )
}

function SecurityLine({ text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-emerald-300" />
      <span>{text}</span>
    </div>
  )
}
