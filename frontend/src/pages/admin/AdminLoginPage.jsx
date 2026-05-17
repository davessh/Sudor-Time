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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">SudorTime</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Acceso admin</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Ingresa la clave privada del equipo para administrar eventos, inscritos y lecturas.
        </p>

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-slate-700">Clave de administrador</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-4 font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Validando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
