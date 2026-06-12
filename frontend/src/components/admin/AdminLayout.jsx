import { LogOut } from 'lucide-react'
import AdminSidebar from './AdminSidebar'
import { ADMIN_ENTRY_PATH, clearAdminToken } from '../../auth/adminAuth'

export default function AdminLayout({ title, subtitle, children, actions }) {
  function logout() {
    clearAdminToken()
    window.location.href = ADMIN_ENTRY_PATH
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white">
          <div className="page-container flex flex-col gap-5 py-5 sm:py-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Admin</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
              {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">{subtitle}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
              {actions}
              <button type="button" onClick={logout} className="btn-secondary">
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </header>

        <main className="page-container py-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
