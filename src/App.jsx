import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PortalLayout from './components/PortalLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Schedule from './pages/Schedule';
import Departments from './pages/Departments';
import Billing from './pages/Billing';
import MedicalRecords from './pages/MedicalRecords';
import Pharmacy from './pages/Pharmacy';
import Inventory from './pages/Inventory';
import Notifications from './pages/Notifications';
import Prescriptions from './pages/Prescriptions';
import Settings from './pages/Settings';
import Rooms from './pages/Rooms';
import Lab from './pages/Lab';
import PortalLogin from './pages/portal/PortalLogin';
import PortalDashboard from './pages/portal/PortalDashboard';
import BookAppointment from './pages/portal/BookAppointment';
import MyAppointments from './pages/portal/MyAppointments';
import MyPrescriptions from './pages/portal/MyPrescriptions';
import MyMedicalRecords from './pages/portal/MyMedicalRecords';
import MyProfile from './pages/portal/MyProfile';
import PortalNotifications from './pages/portal/PortalNotifications';
import { usePortalPatient } from './hooks/usePortalPatient';
import LandingPage from './pages/LandingPage';

function ProtectedLayout() {
  const { user, userType, loading } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (userType === 'patient') return <Navigate to="/portal" replace />;

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} path={location.pathname} />
        <main className="page-body">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/records" element={<MedicalRecords />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/pharmacy"   element={<Pharmacy />} />
            <Route path="/inventory"      element={<Inventory />} />
            <Route path="/notifications"  element={<Notifications />} />
            <Route path="/lab"            element={<Lab />} />
            <Route path="/rooms"   element={<Rooms />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function PortalWrapper() {
  const { user, userType, loading } = useAuth();
  const { patient, appointments, prescriptions, medicalRecords, labOrders, refresh } = usePortalPatient();
  
  if (loading) return null;
  if (!user || userType !== 'patient') return <Navigate to="/portal/login" replace />;
  return (
    <PortalLayout patient={patient}>
      <Routes>
        <Route path="/"              element={<PortalDashboard patient={patient} appointments={appointments} prescriptions={prescriptions} />} />
        <Route path="/book"          element={<BookAppointment patient={patient} portalAppointments={appointments} onBooked={refresh} />} />
        <Route path="/appointments"  element={<MyAppointments  appointments={appointments} onCancelled={refresh} />} />
        <Route path="/prescriptions" element={<MyPrescriptions prescriptions={prescriptions} />} />
        <Route path="/records"       element={<MyMedicalRecords records={medicalRecords} labOrders={labOrders} />} />
        <Route path="/profile"       element={<MyProfile           patient={patient} />} />
        <Route path="/notifications" element={<PortalNotifications />} />
        <Route path="*"              element={<Navigate to="/portal" replace />} />
      </Routes>
    </PortalLayout>
  );
}

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('hms_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/"           element={<LandingPage />} />
            <Route path="/login"      element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal/*"    element={<PortalWrapper />} />
            <Route path="/*"           element={<ProtectedLayout />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function PublicRoute({ children }) {
  const { user, userType } = useAuth();
  if (!user) return children;
  return <Navigate to={userType === 'patient' ? '/portal' : '/dashboard'} replace />;
}
