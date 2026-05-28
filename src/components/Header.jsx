import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Pill, CalendarDays, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'Welcome back! Here\'s what\'s happening today.' },
  '/patients': { title: 'Patients', subtitle: 'Manage patient records and admissions.' },
  '/doctors': { title: 'Doctors', subtitle: 'Medical staff directory and schedules.' },
  '/appointments': { title: 'Appointments', subtitle: 'Schedule and manage patient appointments.' },
  '/departments': { title: 'Departments', subtitle: 'Hospital department overview.' },
  '/billing': { title: 'Billing & Invoices', subtitle: 'Track payments and generate invoices.' },
  '/records': { title: 'Medical Records', subtitle: 'Patient diagnoses and prescriptions.' },
  '/pharmacy': { title: 'Pharmacy', subtitle: 'Medicine inventory and stock management.' },
  '/settings': { title: 'Settings', subtitle: 'Manage hospital profile and preferences.' },
};

export default function Header({ collapsed, setCollapsed, path }) {
  const { user } = useAuth();
  const meta = pageTitles[path] || { title: 'MediCore', subtitle: '' };
  
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'Low Stock Alert', desc: 'Amoxicillin 500mg is running critically low.', time: '10m ago', type: 'warning', icon: <Pill size={14}/> },
    { id: 2, title: 'New Appointment', desc: 'Sarah Davis booked a consultation for tomorrow.', time: '1h ago', type: 'info', icon: <CalendarDays size={14}/> },
    { id: 3, title: 'System Update', desc: 'MediCore HMS was updated to v1.0.2 successfully.', time: '2h ago', type: 'success', icon: <CheckCircle size={14}/> },
  ];

  return (
    <header className="header">
      <div className="header-left">
        <button className="toggle-btn" onClick={() => setCollapsed(c => !c)}>
          <Menu size={17} />
        </button>
        <div>
          <div className="page-title">{meta.title}</div>
          <div className="page-subtitle">{meta.subtitle}</div>
        </div>
      </div>
      <div className="header-right">
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="header-btn" title="Notifications" onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={16} />
            <span className="notif-dot" />
          </button>
          
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <div style={{ fontWeight: 600, fontSize: 13 }}>Notifications</div>
                <button style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
              </div>
              <div className="notif-list">
                {notifications.map(n => (
                  <div key={n.id} className="notif-item">
                    <div className={`notif-icon ${n.type}`}>{n.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-desc">{n.desc}</div>
                      <div className="notif-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notif-footer">View all notifications</div>
            </div>
          )}
        </div>
        
        <div className="user-pill">
          <div className="user-avatar">{user?.avatar}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
