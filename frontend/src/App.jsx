import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import EventPage from './pages/EventPage'
import ResultsPage from './pages/ResultsPage'
import RegistrationPage from './pages/RegistrationPage'
import RunnerDetailPage from './pages/RunnerDetailPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEventsPage from './pages/admin/AdminEventsPage'
import AdminRegistrationsPage from './pages/admin/AdminRegistrationsPage'
import AdminTagsPage from './pages/admin/AdminTagsPage'
import AdminReadsPage from './pages/admin/AdminReadsPage'
import AdminEventResultsPage from './pages/admin/AdminEventResultsPage'
import AdminEventResultsPrintPage from './pages/admin/AdminEventResultsPrintPage'
import AdminEventSetupPage from './pages/admin/AdminEventSetupPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/evento/:id" element={<EventPage />} />
      <Route path="/evento/:id/resultados" element={<ResultsPage />} />
      <Route path="/evento/:id/inscripcion" element={<RegistrationPage />} />
      <Route path="/corredor/:id" element={<RunnerDetailPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/eventos" element={<AdminEventsPage />} />
      <Route path="/admin/eventos/:id/inscritos" element={<AdminRegistrationsPage />}/>
      <Route path="/admin/eventos/:id/configuracion" element={<AdminEventSetupPage />}/>
      <Route path="/admin/tags" element={<AdminTagsPage />} />
      <Route path="/admin/lecturas" element={<AdminReadsPage />} />
      <Route path="/admin/eventos/:id/resultados" element={<AdminEventResultsPage />}/>
      <Route path="/admin/eventos/:id/resultados/print" element={<AdminEventResultsPrintPage />}/>
    </Routes>
  )
}