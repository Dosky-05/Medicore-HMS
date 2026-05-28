import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, CalendarDays, Building2,
  FileText, Pill, CreditCard, Settings, LogOut, Menu, Heart, Activity, Clock
} from 'lucide-react';

const navItems = [
  { label: 'Overview', section: true },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Management', section: true },
  { path: '/patients', label: 'Patients', icon: Users, badge: null },
  { path: '/doctors', label: 'Doctors', icon: UserCog },
  { path: '/appointments', label: 'Appointments', icon: CalendarDays },
  { path: '/schedule', label: 'Doctor Schedule', icon: Clock },
  { path: '/departments', label: 'Departments', icon: Building2 },
  { label: 'Finance & Records', section: true },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/records', label: 'Medical Records', icon: FileText },
  { path: '/prescriptions', label: 'Prescriptions', icon: Pill },
  { path: '/pharmacy', label: 'Pharmacy', icon: Heart },
  { label: 'System', section: true },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const avatarColors = ['#00d4ff', '#6c63ff', '#ff6b6b', '#00d68f', '#ffb830', '#f783ac'];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon"><Activity size={20} color="white" /></div>
        <div>
          <div className="logo-text">MediCore</div>
          <div className="logo-sub">HMS v1.0</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section-label">{item.label}</div>;
          }
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
            >
              <div className="nav-icon">
                <Icon size={18} />
              </div>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item" onClick={handleLogout} title={collapsed ? 'Logout' : ''}>
          <div className="nav-icon"><LogOut size={18} /></div>
          <span className="nav-label">Logout</span>
        </div>
      </div>
    </aside>
  );
}
