import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, CalendarPlus, X } from 'lucide-react';

const STATUS_CFG = {
  Scheduled:  { color: '#00d68f', bg: 'rgba(0,214,143,0.12)',  icon: CalendarDays },
  Confirmed:  { color: '#00d4ff', bg: 'rgba(0,212,255,0.12)',  icon: CheckCircle  },
  Completed:  { color: '#6c63ff', bg: 'rgba(108,99,255,0.12)', icon: CheckCircle  },
  Cancelled:  { color: '#ff4d6d', bg: 'rgba(255,77,109,0.12)', icon: XCircle      },
};

export default function MyAppointments({ appointments, onCancelled }) {
  const navigate      = useNavigate();
  const [filter,      setFilter]      = useState('All');
  const [cancelId,    setCancelId]    = useState(null);
  const [cancelling,  setCancelling]  = useState(false);
  const [cancelError, setCancelError] = useState('');

  const filters  = ['All', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'];
  const filtered = appointments.filter(a => filter === 'All' || a.status === filter);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError('');
    const { error } = await supabase.rpc('patient_cancel_appointment', { appt_id: cancelId });
    setCancelling(false);
    if (error) {
      setCancelError('Could not cancel. Please try again or contact reception.');
      return;
    }
    setCancelId(null);
    onCancelled?.();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>My Appointments</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:14 }}>{appointments.length} total appointments</p>
        </div>
        <button onClick={() => navigate('/portal/book')}
          style={{ background:'rgba(0,214,143,0.12)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.3)', padding:'9px 18px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
          <CalendarPlus size={14}/> Book New
        </button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 18px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
            background: filter===f ? 'rgba(0,214,143,0.12)' : 'transparent',
            border: `1px solid ${filter===f ? 'rgba(0,214,143,0.3)' : 'transparent'}`,
            color: filter===f ? '#00d68f' : 'var(--text-secondary)',
          }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
          <CalendarDays size={44} style={{ opacity:0.2, marginBottom:12 }}/>
          <p style={{ fontSize:14, marginBottom:14 }}>No appointments found</p>
          <button onClick={() => navigate('/portal/book')}
            style={{ background:'linear-gradient(135deg,#00d68f,#00a86b)', color:'white', border:'none', padding:'9px 18px', borderRadius:8, fontWeight:600, cursor:'pointer' }}>
            Book an Appointment
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(a => {
            const cfg  = STATUS_CFG[a.status] || STATUS_CFG.Scheduled;
            const Icon = cfg.icon;
            const canCancel = a.status === 'Scheduled' || a.status === 'Confirmed';
            const isConfirming = cancelId === a.id;

            return (
              <div key={a.id} style={{
                background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14,
                overflow:'hidden', borderLeft:`4px solid ${cfg.color}`,
              }}>
                <div style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:cfg.bg, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={20} color={cfg.color}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)', marginBottom:4 }}>{a.doctor}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', gap:14, flexWrap:'wrap' }}>
                      <span><CalendarDays size={11} style={{ display:'inline', marginRight:4 }}/>{a.date}</span>
                      <span><Clock size={11} style={{ display:'inline', marginRight:4 }}/>{a.time}</span>
                      <span>{a.department}</span>
                    </div>
                    {a.notes && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, fontStyle:'italic' }}>{a.notes}</div>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                    <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}30`, whiteSpace:'nowrap' }}>{a.status}</span>
                    <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>{a.type}</span>
                    {canCancel && (
                      <button onClick={() => setCancelId(isConfirming ? null : a.id)}
                        style={{ background:'rgba(255,77,109,0.1)', border:'1px solid rgba(255,77,109,0.25)', color:'#ff4d6d', borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                        <X size={10}/> Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline confirmation */}
                {isConfirming && (
                  <div style={{ padding:'12px 20px', background:'rgba(255,77,109,0.06)', borderTop:'1px solid rgba(255,77,109,0.2)' }}>
                    {cancelError && (
                      <div style={{ marginBottom:10, fontSize:12, color:'#ff4d6d', display:'flex', alignItems:'center', gap:6 }}>
                        <AlertCircle size={12}/> {cancelError}
                      </div>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <AlertCircle size={14} color="#ff4d6d" style={{ flexShrink:0 }}/>
                      <span style={{ fontSize:13, color:'var(--text-secondary)', flex:1 }}>Are you sure you want to cancel this appointment?</span>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => { setCancelId(null); setCancelError(''); }}
                          style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', borderRadius:6, padding:'5px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          Keep it
                        </button>
                        <button onClick={handleCancel} disabled={cancelling}
                          style={{ background:'#ff4d6d', border:'none', color:'white', borderRadius:6, padding:'5px 14px', fontSize:12, fontWeight:600, cursor:'pointer', opacity: cancelling ? 0.7 : 1 }}>
                          {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
