import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'

export default function AdminDashboard() {
  const cards = [
    {
      title: 'Eventos',
      description: 'Crear, revisar y gestionar eventos.',
      to: '/admin/eventos',
      buttonText: 'Ir a eventos',
    },
    {
      title: 'Tags',
      description: 'Crear y consultar tags para pruebas y carreras.',
      to: '/admin/tags',
      buttonText: 'Ir a tags',
    },
    {
      title: 'Lecturas',
      description: 'Revisar lecturas recibidas y validar que se resuelvan correctamente.',
      to: '/admin/lecturas',
      buttonText: 'Ir a lecturas',
    },
  ]

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Desde aquí podrás gestionar la operación interna del sistema."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold">{card.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{card.description}</p>

            <div className="mt-8">
              <Link
                to={card.to}
                className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                {card.buttonText}
              </Link>
            </div>
          </div>
        ))}
      </section>
    </AdminLayout>
  )
}