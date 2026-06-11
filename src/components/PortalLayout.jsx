import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications, timeAgo } from '../hooks/useNotifications';
import { Activity, LogOut, Home, CalendarPlus, CalendarDays, Pill as PillIcon, User, Bell, Sun, Moon, ClipboardList, MoreHorizontal, X as XIcon, BellDot, CheckCircle, XCircle, FlaskConical } from 'lucide-react';

// Desktop top nav — all pages visible
const NAV = [
  { path: '/portal',                    label: 'Home',    icon: Home         },
  { path: '/portal/book',               label: 'Book',    icon: CalendarPlus },
  { path: '/portal/appointments',       label: 'Visits',  icon: CalendarDays },
  { path: '/portal/records',            label: 'Records', icon: ClipboardList},
  { path: '/portal/prescriptions',      label: 'Rx',      icon: PillIcon     },
  { path: '/portal/profile',            label: 'Profile', icon: User         },
];

// Mobile bottom bar — 4 primary tabs
const BOTTOM_MAIN = [
  { path: '/portal',               label: 'Home',   icon: Home         },
  { path: '/portal/appointments',  label: 'Visits', icon: CalendarDays },
  { path: '/portal/prescriptions', label: 'Rx',     icon: PillIcon     },
  { path: '/portal/profile',       label: 'Profile',icon: User         },
];

// Secondary items shown in the "More" bottom sheet
const MORE_ITEMS = [
  { path: '/portal/records',        label: 'Medical Records',  icon: ClipboardList, color: '#00d4ff', desc: 'Clinical history & lab results' },
  { path: '/portal/book',           label: 'Book Appointment', icon: CalendarPlus,  color: '#00d68f', desc: 'Schedule a new visit'           },
  { path: '/portal/notifications',  label: 'Notifications',    icon: BellDot,       color: '#6c63ff', desc: 'All your alerts and updates'    },
];

const NOTIF_META = {
  appointment_confirmed:  { icon: <CheckCircle size={13}/>,  color: '#00d68f', bg: 'rgba(0,214,143,0.12)'   },
  appointment_cancelled:  { icon: <XCircle     size={13}/>,  color: '#ff4757', bg: 'rgba(255,71,87,0.12)'   },
  appointment_completed:  { icon: <CheckCircle size={13}/>,  color: '#a0aec0', bg: 'rgba(160,174,192,0.12)' },
  prescription_issued:    { icon: <PillIcon     size={13}/>, color: '#6c63ff', bg: 'rgba(108,99,255,0.12)'  },
  lab_results_ready:      { icon: <FlaskConical size={13}/>, color: '#00d68f', bg: 'rgba(0,214,143,0.12)'   },
};
function notifMeta(type) {
  return NOTIF_META[type] || { icon: <Bell size={13}/>, color: '#00d68f', bg: 'rgba(0,214,143,0.1)' };
}

export default function PortalLayout({ children, patient }) {
  const { logout, user } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();
  const { unreadCount } = useNotifications();

  const [open,     setOpen]     = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [theme,    setTheme]    = useState(localStorage.getItem('hms_theme') || 'dark');

  const isMoreActive = MORE_ITEMS.some(item => location.pathname === item.path);
  const dropdownRef  = useRef(null);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('hms_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLogout = async () => { await logout(); navigate('/', { replace: true }); navigate('/portal/login'); };

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);


  return (
    <div className="portal-layout">
      <nav className="portal-topnav">
        <div className="portal-brand">
          <div className="portal-brand-icon">
            <img src="/Logo.png" alt="MediCore" style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:6 }}/>
          </div>
          <div>
            <div className="portal-brand-name">MediCore</div>
            <div className="portal-brand-sub">Patient Portal</div>
          </div>
        </div>

        <div className="portal-nav-links">
          {NAV.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`portal-nav-btn ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="portal-nav-user">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--bg-card)', border: '1.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notification bell — navigates to dedicated page */}
          <button
            onClick={() => navigate('/portal/notifications')}
            style={{
              position: 'relative', width: 36, height: 36, borderRadius: '50%',
              background: location.pathname === '/portal/notifications' ? 'rgba(0, 214, 143, 0.12)' : 'var(--bg-card)',
              borderColor: location.pathname === '/portal/notifications' ? 'rgba(0, 214, 143, 0.3)' : 'var(--border)',
              border: '1.5px solid',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: location.pathname === '/portal/notifications' ? '#00d68f' : 'var(--text-secondary)',
              flexShrink: 0,
            }}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 1, right: 1,
                minWidth: 15, height: 15, borderRadius: 8,
                background: '#ff4757', color: 'white',
                fontSize: 8, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar — clickable on mobile, opens dropdown */}
          <div className="portal-avatar-wrap" ref={dropdownRef}>
            <div className="portal-user-pill" onClick={() => setOpen(o => !o)}>
              <div className="portal-user-avatar">
                {patient?.name?.substring(0, 2).toUpperCase() || 'P'}
              </div>
              <div>
                <div className="portal-user-name">{patient?.name || 'Patient'}</div>
                <div className="portal-user-role">Patient</div>
              </div>
            </div>

            {open && (
              <div className="portal-avatar-dropdown">
                <div className="portal-dropdown-header">
                  <div className="portal-dropdown-avatar">
                    {patient?.name?.substring(0, 2).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <div className="portal-dropdown-name">{patient?.name || 'Patient'}</div>
                    <div className="portal-dropdown-sub">Patient Account</div>
                  </div>
                </div>
                <div className="portal-dropdown-divider" />
                <button className="portal-dropdown-signout" onClick={handleLogout}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Sign out button — desktop only */}
          <button className="btn btn-ghost btn-sm portal-signout-desktop" onClick={handleLogout} style={{ alignItems: 'center', gap: 6 }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </nav>

      <main className="portal-page-body">
        {children}
      </main>

      {/* More bottom sheet */}
      {showMore && (
        <>
          <div
            onClick={() => setShowMore(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, backdropFilter:'blur(2px)' }}
          />
          <div style={{
            position:'fixed', bottom:64, left:0, right:0, zIndex:201,
            background:'var(--bg-secondary)', borderRadius:'20px 20px 0 0',
            border:'1px solid var(--border)', borderBottom:'none',
            padding:'8px 16px 16px',
          }}>
            {/* drag handle */}
            <div style={{ width:40, height:4, borderRadius:2, background:'var(--border)', margin:'8px auto 16px' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>More</span>
              <button onClick={() => setShowMore(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4 }}>
                <XIcon size={18}/>
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {MORE_ITEMS.map(({ path, label, icon: Icon, color, desc }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setShowMore(false); }}
                  style={{
                    display:'flex', alignItems:'center', gap:16,
                    padding:'14px 16px', borderRadius:14, width:'100%', textAlign:'left', cursor:'pointer',
                    background:`${color}0d`, border:`1px solid ${color}22`,
                  }}
                >
                  <div style={{ width:46, height:46, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={22} color={color}/>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="portal-bottomnav">
        {BOTTOM_MAIN.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => { setShowMore(false); navigate(path); }}
            className={`portal-bottom-btn ${location.pathname === path ? 'active' : ''}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowMore(v => !v)}
          className={`portal-bottom-btn ${isMoreActive || showMore ? 'active' : ''}`}
        >
          <MoreHorizontal size={22} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
