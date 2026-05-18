import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../../api/dashboard'
import { clearAdminToken, setAdminToken } from '../../auth/adminAuth'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanedToken = token.trim()
    if (!cleanedToken) {
      setError('Ingresa la clave de administrador')
      return
    }

    try {
      setLoading(true)
      setAdminToken(cleanedToken)
      await getDashboardStats()
      navigate('/admin')
    } catch (err) {
      clearAdminToken()
      setError(err.message || 'No se pudo validar la clave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <main className="page-container flex min-h-screen items-center justify-center py-8">
        <form onSubmit={handleSubmit} className="panel panel-pad w-full max-w-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <p className="eyebrow mt-6">SudorTime</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Acceso admin</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Usa la clave privada del equipo para administrar eventos, inscritos y lecturas.
          </p>

          <label className="mt-6 block">
            <span className="field-label">Clave de administrador</span>
            <div className="relative mt-2">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="current-password"
                className="input-control pl-12"
              />
            </div>
          </label>

          {error && <p className="notice-error mt-4">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? 'Validando...' : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  )
}
