import AdminSidebar from './AdminSidebar'
import { clearAdminToken } from '../../auth/adminAuth'

export default function AdminLayout({ title, subtitle, children, actions }) {
  function logout() {
    clearAdminToken()
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <AdminSidebar />

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Admin
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
              {actions}
              <button type="button" onClick={logout} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-100">
                Salir
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
