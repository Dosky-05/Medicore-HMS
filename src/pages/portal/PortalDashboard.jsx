import { useNavigate } from 'react-router-dom';
import { CalendarPlus, CalendarDays, Pill, User, Heart, CheckCircle, Clock } from 'lucide-react';
import StatCard from '../../components/StatCard';

const actions = [
  { label: 'Book Appointment', desc: 'Schedule a new visit',        icon: CalendarPlus, path: '/portal/book',          color: '#00d68f' },
  { label: 'My Appointments',  desc: 'View all your appointments',   icon: CalendarDays, path: '/portal/appointments',  color: '#00d4ff' },
  { label: 'Prescriptions',    desc: 'Active medications & history', icon: Pill,         path: '/portal/prescriptions', color: '#6c63ff' },
  { label: 'My Profile',       desc: 'Personal & medical info',      icon: User,         path: '/portal/profile',       color: '#ffa94d' },
];

function patientStatusClass(status) {
  if (status === 'Admitted') return 'admitted';
  if (status === 'Critical')  return 'critical';
  return 'outpatient';
}

export default function PortalDashboard({ patient, appointments, prescriptions }) {
  const navigate = useNavigate();

  const upcoming  = appointments.filter(a => a.status === 'Scheduled').slice(0, 3);
  const activeRx  = prescriptions.filter(rx => rx.status === 'Active');
  const completed = appointments.filter(a => a.status === 'Completed').length;

  return (
    <div>
      <div className="portal-welcome">
        <h1 className="portal-welcome-title">
          Welcome back, {patient?.name?.split(' ')[0] || 'Patient'} 👋
        </h1>
        <p className="portal-welcome-sub">
          Here's your health overview —{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {patient && (
        <div className="portal-patient-banner">
          <div className="portal-patient-avatar">
            {patient.name?.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div className="portal-patient-name">{patient.name}</div>
            <div className="portal-patient-meta">
              ID: {patient.id} &nbsp;·&nbsp; {patient.age} yrs &nbsp;·&nbsp; {patient.gender} &nbsp;·&nbsp; {patient.department}
            </div>
          </div>
          <span className={`portal-patient-status ${patientStatusClass(patient.status)}`}>
            {patient.status}
          </span>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard icon={<CalendarDays size={22} />} label="Upcoming"         value={upcoming.length}  color="#00d68f" />
        <StatCard icon={<CheckCircle  size={22} />} label="Completed Visits" value={completed}         color="#00d4ff" />
        <StatCard icon={<Pill         size={22} />} label="Active Rx"        value={activeRx.length}  color="#6c63ff" />
        <StatCard icon={<Heart        size={22} />} label="Blood Type"       value={patient?.blood_type || '—'} color="#ff4d6d" />
      </div>

      <div className="portal-bottom-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Quick Actions</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {actions.map(a => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  className="portal-quick-action"
                  style={{ background: `${a.color}0d`, border: `1px solid ${a.color}20` }}
                >
                  <Icon size={22} color={a.color} style={{ marginBottom: 10 }} />
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', marginBottom: 3 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Upcoming Appointments</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/appointments')}>
              View all
            </button>
          </div>
          {upcoming.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map(a => (
                <div key={a.id} className="portal-upcoming-item">
                  <div className="portal-upcoming-icon">
                    <CalendarDays size={17} color="#00d68f" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="portal-upcoming-doctor">{a.doctor}</div>
                    <div className="portal-upcoming-time">
                      <Clock size={10} />
                      {a.date} · {a.time}
                    </div>
                  </div>
                  <span className="portal-upcoming-type">{a.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="portal-empty">
              <CalendarDays size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p>No upcoming appointments</p>
              <button
                className="btn btn-sm"
                onClick={() => navigate('/portal/book')}
                style={{ background:'rgba(0,214,143,0.12)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.3)', fontWeight:600 }}
              >
                <CalendarPlus size={13} /> Book Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
