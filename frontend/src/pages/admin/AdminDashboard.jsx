import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getDashboardStats } from '../../api/dashboard'

function StatCard({ title, value, description }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{title}</p>
      <p className="mt-3 text-4xl font-black text-slate-900">{value}</p>
      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true)
        setError('')
        const data = await getDashboardStats()
        setStats(data)
      } catch (err) {
        setError(err.message || 'No se pudieron cargar las estadísticas')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Resumen general de eventos, inscripciones y operación interna."
      actions={
        <Link to="/admin/eventos" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90">
          Crear o configurar evento
        </Link>
      }
    >
      {loading && <p className="text-slate-500">Cargando estadísticas...</p>}
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-700">{error}</p>}

      {!loading && !error && stats && (
        <div className="space-y-8">
          <section className="grid gap-5 md:grid-cols-3">
            <StatCard title="Eventos" value={stats.total_eventos} description="Eventos registrados en el sistema." />
            <StatCard title="Inscritos" value={stats.total_inscritos} description="Inscripciones totales acumuladas." />
            <StatCard title="Abiertos" value={stats.eventos_abiertos} description="Eventos con inscripciones abiertas." />
          </section>

          <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Inscritos por evento</h2>
              <div className="mt-5 space-y-3">
                {stats.inscritos_por_evento?.length ? stats.inscritos_por_evento.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-semibold">{item.nombre}</span>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white">{item.total}</span>
                  </div>
                )) : <p className="text-sm text-slate-500">Todavía no hay eventos con inscritos.</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Próximos eventos</h2>
              <div className="mt-5 space-y-3">
                {stats.proximos_eventos?.length ? stats.proximos_eventos.map((event) => (
                  <Link key={event.id} to={`/admin/eventos/${event.id}/configuracion`} className="block rounded-2xl border border-slate-200 p-4 hover:border-slate-400">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-900">{event.nombre}</p>
                        <p className="mt-1 text-sm text-slate-500">{event.fecha} · {event.lugar}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${event.inscripciones_abiertas ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {event.inscripciones_abiertas ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                  </Link>
                )) : <p className="text-sm text-slate-500">Todavía no hay eventos registrados.</p>}
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            <AdminShortcut title="Eventos" description="Crear eventos y completar convocatoria, modalidades, categorías, paquetes y tallas." to="/admin/eventos" />
            <AdminShortcut title="Tags" description="Crear y consultar tags RFID para pruebas y carreras." to="/admin/tags" />
            <AdminShortcut title="Lecturas" description="Revisar lecturas recibidas y validar su resolución." to="/admin/lecturas" />
          </section>
        </div>
      )}
    </AdminLayout>
  )
}

function AdminShortcut({ title, description, to }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
      <Link to={to} className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90">
        Entrar
      </Link>
    </div>
  )
}
