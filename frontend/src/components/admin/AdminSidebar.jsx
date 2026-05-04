import { Link, useLocation } from 'react-router-dom'

export default function AdminSidebar() {
  const location = useLocation()

  const links = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/eventos', label: 'Eventos' },
    { to: '/admin/tags', label: 'Tags' },
    { to: '/admin/lecturas', label: 'Lecturas' },
  ]

  return (
    <aside className="w-full border-b border-slate-200 bg-white lg:w-72 lg:border-b-0 lg:border-r">
      <div className="p-6">
        <Link to="/admin" className="block">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            SudorTime Admin
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Panel de administración
          </p>
        </Link>
      </div>

      <nav className="px-4 pb-6">
        <div className="space-y-2">
          {links.map((link) => {
            const activo = location.pathname === link.to

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activo
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}