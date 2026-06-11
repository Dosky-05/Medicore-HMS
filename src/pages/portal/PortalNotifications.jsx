import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, timeAgo } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import {
  Bell, CheckCheck, Trash2, CheckCircle, XCircle, Pill as PillIcon, FlaskConical,
} from 'lucide-react';

const NOTIF_META = {
  appointment_confirmed: { icon: CheckCircle,  color: '#00d68f', label: 'Appointment' },
  appointment_cancelled: { icon: XCircle,      color: '#ff4757', label: 'Appointment' },
  appointment_completed: { icon: CheckCircle,  color: '#a0aec0', label: 'Visit'       },
  prescription_issued:   { icon: PillIcon,     color: '#6c63ff', label: 'Prescription'},
  lab_results_ready:     { icon: FlaskConical, color: '#00d4ff', label: 'Lab Results' },
};

function getMeta(type) {
  return NOTIF_META[type] || { icon: Bell, color: '#00d68f', label: 'Update' };
}

function groupByDate(list) {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  list.forEach(n => {
    const d = new Date(n.created_at).toDateString();
    if (d === today)          groups.Today.push(n);
    else if (d === yesterday) groups.Yesterday.push(n);
    else                      groups.Earlier.push(n);
  });
  return groups;
}

export default function PortalNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearOne, clearAll } = useNotifications();
  const [filter, setFilter] = useState('All');

  const displayed = useMemo(() =>
    filter === 'Unread'
      ? notifications.filter(n => !(n.read_by || []).includes(user?.id))
      : notifications,
  [notifications, filter, user]);

  const groups = useMemo(() => groupByDate(displayed), [displayed]);

  const handleClick = async (n) => {
    await markAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px 100px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0, display:'flex', alignItems:'center', gap:10 }}>
            <Bell size={20} color="#00d68f"/>
            Notifications
            {unreadCount > 0 && (
              <span style={{ background:'#ff4757', color:'white', borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:800 }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--text-muted)' }}>Your alerts and updates</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--accent)', fontSize:12, fontWeight:600, cursor:'pointer' }}
            >
              <CheckCheck size={13}/> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:'var(--bg-card)', border:'1px solid var(--border)', color:'#ff4757', fontSize:12, fontWeight:600, cursor:'pointer' }}
            >
              <Trash2 size={13}/> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['All', 'Unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
              background: filter === f ? 'rgba(0, 214, 143, 0.12)' : 'transparent',
              color:       filter === f ? '#00d68f'                 : 'var(--text-secondary)',
              border:      filter === f ? '1px solid rgba(0, 214, 143, 0.3)' : '1px solid transparent',
            }}
          >
            {f}{f === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)' }}>
          <Bell size={44} color="var(--text-muted)" style={{ margin:'0 auto 14px', display:'block' }}/>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>
            {filter === 'Unread' ? 'All caught up!' : 'No notifications yet'}
          </div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>
            {filter === 'Unread' ? "No unread notifications." : "Updates about your appointments and prescriptions will appear here."}
          </div>
        </div>
      ) : (
        Object.entries(groups).map(([group, items]) => {
          if (!items.length) return null;
          return (
            <div key={group} style={{ marginBottom:28 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                {group}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {items.map(n => {
                  const { icon: Icon, color, label } = getMeta(n.type);
                  const isUnread = !(n.read_by || []).includes(user?.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      style={{
                        display:'flex', alignItems:'flex-start', gap:14,
                        padding:'14px 16px', borderRadius:14, cursor:'pointer',
                        background: isUnread ? 'var(--bg-card)' : 'var(--bg-secondary)',
                        border:`1px solid ${isUnread ? color + '35' : 'var(--border)'}`,
                        borderLeft:`3px solid ${isUnread ? color : 'var(--border)'}`,
                      }}
                    >
                      <div style={{
                        width:42, height:42, borderRadius:10, flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background:`${color}18`, color,
                      }}>
                        <Icon size={18}/>
                      </div>

                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                          <span style={{ fontSize:13, fontWeight: isUnread ? 700 : 600, color:'var(--text-primary)' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize:10, fontWeight:600, color, background:`${color}18`, borderRadius:10, padding:'1px 7px' }}>
                            {label}
                          </span>
                          {isUnread && (
                            <span style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }}/>
                          )}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:4 }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{timeAgo(n.created_at)}</div>
                      </div>

                      <button
                        onClick={e => { e.stopPropagation(); clearOne(n.id); }}
                        title="Dismiss"
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18, lineHeight:1, padding:'2px 4px', borderRadius:4, opacity:0.5, flexShrink:0 }}
                        onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.color='#ff4757'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity='0.5'; e.currentTarget.style.color='var(--text-muted)'; }}
                      >×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
