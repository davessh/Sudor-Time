import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import EventPage from './pages/EventPage'
import GalleryPage from './pages/GalleryPage'
import ResultsPage from './pages/ResultsPage'
import RegistrationPage from './pages/RegistrationPage'
import RegistrationLookupPage from './pages/RegistrationLookupPage'
import PaymentPage from './pages/PaymentPage'
import RunnerDetailPage from './pages/RunnerDetailPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEventsPage from './pages/admin/AdminEventsPage'
import AdminRegistrationsPage from './pages/admin/AdminRegistrationsPage'
import AdminTagsPage from './pages/admin/AdminTagsPage'
import AdminReadsPage from './pages/admin/AdminReadsPage'
import AdminEventResultsPage from './pages/admin/AdminEventResultsPage'
import AdminEventResultsPrintPage from './pages/admin/AdminEventResultsPrintPage'
import AdminEventSetupPage from './pages/admin/AdminEventSetupPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminSiteSettingsPage from './pages/admin/AdminSiteSettingsPage'
import AdminGalleryPage from './pages/admin/AdminGalleryPage'
import RequireAdmin from './components/admin/RequireAdmin'
import { ADMIN_ENTRY_PATH } from './auth/adminAuth'

function adminPage(element) {
  return <RequireAdmin>{element}</RequireAdmin>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/galeria" element={<GalleryPage />} />
      <Route path="/evento/:id" element={<EventPage />} />
      <Route path="/evento/:id/resultados" element={<ResultsPage />} />
      <Route path="/evento/:id/inscripcion" element={<RegistrationPage />} />
      <Route path="/consultar-inscripcion" element={<RegistrationLookupPage />} />
      <Route path="/inscripcion/:accessToken/pago" element={<PaymentPage />} />
      <Route path="/corredor/:id" element={<RunnerDetailPage />} />
      <Route path={ADMIN_ENTRY_PATH} element={<AdminLoginPage />} />
      <Route path="/admin" element={adminPage(<AdminDashboard />)} />
      <Route path="/admin/eventos" element={adminPage(<AdminEventsPage />)} />
      <Route path="/admin/eventos/:id/inscritos" element={adminPage(<AdminRegistrationsPage />)}/>
      <Route path="/admin/eventos/:id/configuracion" element={adminPage(<AdminEventSetupPage />)}/>
      <Route path="/admin/tags" element={adminPage(<AdminTagsPage />)} />
      <Route path="/admin/lecturas" element={adminPage(<AdminReadsPage />)} />
      <Route path="/admin/ajustes" element={adminPage(<AdminSiteSettingsPage />)} />
      <Route path="/admin/galeria" element={adminPage(<AdminGalleryPage />)} />
      <Route path="/admin/eventos/:id/resultados" element={adminPage(<AdminEventResultsPage />)}/>
      <Route path="/admin/eventos/:id/resultados/print" element={adminPage(<AdminEventResultsPrintPage />)}/>
    </Routes>
  )
}
