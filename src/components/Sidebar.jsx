import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, CalendarDays, Building2,
  FileText, Pill, CreditCard, Settings, LogOut, Menu, Heart, Activity, Clock, BedDouble, FlaskConical, Package, Bell
} from 'lucide-react';

// roles: which roles can see this item (omit = all roles)
const navItems = [
  { label: 'Overview', section: true },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Management', section: true },
  { path: '/patients',     label: 'Patients',         icon: Users,         roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
  { path: '/doctors',      label: 'Doctors',          icon: UserCog,       roles: ['admin'] },
  { path: '/appointments', label: 'Appointments',     icon: CalendarDays,  roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
  { path: '/schedule',     label: 'Doctor Schedule',  icon: Clock,         roles: ['admin', 'doctor', 'nurse'] },
  { path: '/departments',  label: 'Departments',      icon: Building2,     roles: ['admin'] },
  { path: '/rooms',        label: 'Rooms & Wards',    icon: BedDouble,     roles: ['admin', 'nurse', 'receptionist'] },
  { label: 'Finance & Records', section: true },
  { path: '/billing',       label: 'Billing',          icon: CreditCard,   roles: ['admin', 'receptionist'] },
  { path: '/records',       label: 'Medical Records',  icon: FileText,      roles: ['admin', 'doctor', 'nurse'] },
  { path: '/prescriptions', label: 'Prescriptions',   icon: Pill,          roles: ['admin', 'doctor', 'nurse'] },
  { path: '/lab',           label: 'Laboratory',      icon: FlaskConical,  roles: ['admin', 'doctor', 'nurse'] },
  { path: '/pharmacy',      label: 'Pharmacy',        icon: Heart,         roles: ['admin'] },
  { path: '/inventory',     label: 'Inventory',       icon: Package,       roles: ['admin', 'nurse'] },
  { label: 'System', section: true },
  { path: '/notifications', label: 'Notifications', icon: Bell     },
  { path: '/settings',      label: 'Settings',      icon: Settings, roles: ['admin'] },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = profile?.role || 'admin';

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => { await logout(); navigate('/', { replace: true }); navigate('/login'); };

  const handleNav = (path) => {
    navigate(path);
    closeMobile();
  };

  const visibleItems = navItems.filter(item => {
    if (item.section) return true;
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  // Filter out orphan section headers (section with no items after it)
  const filteredItems = visibleItems.filter((item, i) => {
    if (!item.section) return true;
    const next = visibleItems[i + 1];
    return next && !next.section;
  });

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobile} />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><img src="/Logo.png" alt="MediCore" style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:8 }}/></div>
          <div>
            <div className="logo-text">MediCore</div>
            <div className="logo-sub">HMS v1.0</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredItems.map((item, i) => {
            if (item.section) {
              return <div key={i} className="nav-section-label">{item.label}</div>;
            }
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.path)}
                title={collapsed ? item.label : ''}
              >
                <div className="nav-icon"><Icon size={18} /></div>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} title={collapsed ? 'Logout' : ''}>
            <div className="nav-icon"><LogOut size={18} /></div>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
