import { Activity, ClipboardList, Images, LayoutDashboard, RadioTower, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function AdminSidebar() {
  const location = useLocation()

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/eventos', label: 'Eventos', icon: ClipboardList },
    { to: '/admin/ajustes', label: 'Ajustes', icon: Settings },
    { to: '/admin/galeria', label: 'Galería', icon: Images },
    { to: '/admin/tags', label: 'Tags', icon: Activity },
    { to: '/admin/lecturas', label: 'Lecturas', icon: RadioTower },
  ]

  return (
    <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="page-container flex items-center justify-between gap-4 py-4 lg:block lg:px-6 lg:py-6">
        <Link to="/admin" className="block min-w-0">
          <p className="text-xl font-black tracking-tight text-slate-950">SudorTime</p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin</p>
        </Link>

        <nav className="max-w-[62vw] overflow-x-auto lg:mt-8 lg:max-w-none lg:overflow-visible">
          <div className="flex gap-2 lg:block lg:space-y-2">
            {links.map((link) => {
              const activo = location.pathname === link.to
              const Icon = link.icon

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition lg:w-full lg:px-4 lg:py-3 ${
                    activo ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </aside>
  )
}
