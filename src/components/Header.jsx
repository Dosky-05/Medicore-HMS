import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const pageTitles = {
  '/':               { title: 'Dashboard',          subtitle: "Welcome back! Here's what's happening today." },
  '/patients':       { title: 'Patients',            subtitle: 'Manage patient records and admissions.' },
  '/doctors':        { title: 'Doctors',             subtitle: 'Medical staff directory and schedules.' },
  '/appointments':   { title: 'Appointments',        subtitle: 'Schedule and manage patient appointments.' },
  '/departments':    { title: 'Departments',         subtitle: 'Hospital department overview.' },
  '/rooms':          { title: 'Rooms & Wards',       subtitle: 'Bed management and room occupancy.' },
  '/billing':        { title: 'Billing & Invoices',  subtitle: 'Track payments and generate invoices.' },
  '/records':        { title: 'Medical Records',     subtitle: 'Patient diagnoses and prescriptions.' },
  '/pharmacy':       { title: 'Pharmacy',            subtitle: 'Medicine inventory and stock management.' },
  '/inventory':      { title: 'General Inventory',   subtitle: 'PPE, cleaning supplies, linens & consumables.' },
  '/notifications':  { title: 'Notifications',       subtitle: 'All your alerts and updates in one place.' },
  '/lab':            { title: 'Laboratory',          subtitle: 'Lab test orders and results.' },
  '/settings':       { title: 'Settings',            subtitle: 'Manage hospital profile and preferences.' },
};

export default function Header({ collapsed, setCollapsed, mobileOpen, setMobileOpen, path }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const meta = (() => {
    if (path === '/' || path === '/dashboard') {
      const cleaned = (profile?.name || '').replace(/^Dr\.?\s+/i, '');
      const first   = cleaned.split(' ')[0] || 'there';
      const prefix  = profile?.role === 'doctor' ? 'Dr. ' : '';
      return { title: `Welcome back, ${prefix}${first}!`, subtitle: "Here's what's happening today." };
    }
    return pageTitles[path] || { title: 'MediCore', subtitle: '' };
  })();

  const { unreadCount } = useNotifications();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); navigate('/login'); };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="toggle-btn"
          onClick={() => {
            if (window.innerWidth <= 768) setMobileOpen(o => !o);
            else setCollapsed(c => !c);
          }}
        >
          <Menu size={17} />
        </button>
        <div>
          <div className="page-title">{meta.title}</div>
          <div className="page-subtitle">{meta.subtitle}</div>
        </div>
      </div>

      <div className="header-right">
        {/* Notification Bell — navigates to dedicated page */}
        <button
          className="header-btn"
          title="Notifications"
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              minWidth: 16, height: 16, borderRadius: 8,
              background: '#ff4757', color: 'white',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', lineHeight: 1, pointerEvents: 'none',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <button
            className="user-avatar-btn"
            title="User menu"
            onClick={() => setShowUserMenu(v => !v)}
          >
            <div className="user-avatar-circle">
              {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
            </div>
          </button>

          {showUserMenu && (
            <div className="user-menu-dropdown">
              <div className="user-menu-header">
                <div className="user-avatar-large">
                  {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="user-menu-name">{profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}</div>
                  <div className="user-menu-role">{profile?.role || user?.user_metadata?.role || 'Admin'}</div>
                </div>
              </div>
              <div className="user-menu-divider" />
              <button className="user-menu-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                <User size={16} /><span>Profile & Settings</span>
              </button>
              <button className="user-menu-item logout" onClick={handleLogout}>
                <LogOut size={16} /><span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
