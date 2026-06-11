import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, timeAgo } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import {
  Bell, CheckCheck, Trash2, CalendarDays, CheckCircle,
  XCircle, Smartphone, AlertTriangle, Ban,
} from 'lucide-react';

const NOTIF_META = {
  new_booking:                     { icon: CalendarDays,  color: '#6c63ff', label: 'Booking'   },
  appointment_confirmed:           { icon: CheckCircle,   color: '#00d68f', label: 'Confirmed' },
  appointment_cancelled:           { icon: XCircle,       color: '#ff4757', label: 'Cancelled' },
  appointment_cancelled_by_patient:{ icon: XCircle,       color: '#ff4757', label: 'Cancelled' },
  appointment_completed:           { icon: CheckCircle,   color: '#a0aec0', label: 'Completed' },
  inventory_low_stock:             { icon: AlertTriangle, color: '#ffb830', label: 'Inventory' },
  inventory_out_of_stock:          { icon: Ban,           color: '#ff4d6d', label: 'Inventory' },
};

function getMeta(type) {
  return NOTIF_META[type] || { icon: Bell, color: 'var(--accent)', label: 'Alert' };
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

export default function Notifications() {
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
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Bell size={22} color="var(--accent)"/>
            Notifications
            {unreadCount > 0 && (
              <span style={{ background:'#ff4757', color:'white', borderRadius:20, padding:'2px 10px', fontSize:13, fontWeight:800 }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="page-desc">All your alerts and updates in one place.</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={markAllAsRead} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <CheckCheck size={14}/> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ display:'flex', alignItems:'center', gap:6, color:'#ff4757' }}>
              <Trash2 size={14}/> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        {['All', 'Unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background:  filter === f ? 'var(--accent-glow)' : 'transparent',
              color:       filter === f ? 'var(--accent)'      : 'var(--text-secondary)',
              border:      filter === f ? '1px solid rgba(0,212,255,0.25)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {f}{f === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="card" style={{ padding:'60px 20px', textAlign:'center' }}>
          <Bell size={48} color="var(--text-muted)" style={{ margin:'0 auto 16px', display:'block' }}/>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>
            {filter === 'Unread' ? 'All caught up!' : 'No notifications yet'}
          </div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>
            {filter === 'Unread' ? "You have no unread notifications." : "Alerts and updates will appear here."}
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
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {items.map(n => {
                  const { icon: Icon, color, label } = getMeta(n.type);
                  const isUnread = !(n.read_by || []).includes(user?.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      style={{
                        display:'flex', alignItems:'flex-start', gap:14,
                        padding:'14px 16px', borderRadius:12, cursor:'pointer',
                        background: isUnread ? 'var(--bg-card)' : 'var(--bg-secondary)',
                        border:`1px solid ${isUnread ? color + '30' : 'var(--border)'}`,
                        borderLeft:`3px solid ${isUnread ? color : 'var(--border)'}`,
                        transition:'background 0.15s',
                      }}
                    >
                      <div style={{
                        width:42, height:42, borderRadius:10, flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background:`${color}18`, color,
                      }}>
                        {n.type === 'new_booking' ? <Smartphone size={18}/> : <Icon size={18}/>}
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
