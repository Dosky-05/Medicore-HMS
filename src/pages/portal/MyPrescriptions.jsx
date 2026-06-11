import { Pill, Clock, CheckCircle, AlertCircle, CalendarDays } from 'lucide-react';

export default function MyPrescriptions({ prescriptions }) {
  const active    = prescriptions.filter(rx => rx.status === 'Active');
  const completed = prescriptions.filter(rx => rx.status === 'Completed');

  const RxCard = ({ rx }) => (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
      padding: '20px', transition: 'all 0.2s',
      borderTop: `3px solid ${rx.status === 'Active' ? '#00d68f' : 'var(--text-muted)'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{rx.doctor}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            <CalendarDays size={11} style={{ display:'inline', marginRight:4 }} />{rx.date}
          </div>
        </div>
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: rx.status === 'Active' ? 'rgba(0,214,143,0.12)' : 'rgba(255,255,255,0.06)',
          color: rx.status === 'Active' ? '#00d68f' : 'var(--text-muted)',
          border: `1px solid ${rx.status === 'Active' ? 'rgba(0,214,143,0.3)' : 'var(--border)'}`,
        }}>{rx.status}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {rx.medicines.map((med, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'rgba(0,214,143,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Pill size={15} color="#00d68f" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                {med.name} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{med.dose}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {med.frequency} · {med.duration}
              </div>
            </div>
          </div>
        ))}
      </div>

      {rx.instructions && (
        <div style={{
          padding: '10px 14px', borderRadius: 9, fontSize: 12, color: 'var(--text-secondary)',
          background: 'rgba(255,184,48,0.06)', border: '1px solid rgba(255,184,48,0.2)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <AlertCircle size={13} color="#ffb830" style={{ marginTop: 1, flexShrink: 0 }} />
          <span>{rx.instructions}</span>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Prescriptions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{active.length} active · {completed.length} completed</p>
      </div>

      {prescriptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Pill size={44} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p>No prescriptions on record.</p>
        </div>
      ) : (
        <div>
          {active.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <CheckCircle size={16} color="#00d68f" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#00d68f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Prescriptions</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {active.map(rx => <RxCard key={rx.id} rx={rx} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Clock size={16} color="var(--text-muted)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {completed.map(rx => <RxCard key={rx.id} rx={rx} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
