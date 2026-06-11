import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  BedDouble, Search, X, Users, CheckCircle, AlertTriangle,
  Wrench, Plus, ChevronRight, User, Building2, Clock, Save,
  Bed, AlertCircle, UserPlus, LogOut,
} from 'lucide-react';

const STATUS_CONFIG = {
  'Available':   { color: 'var(--success)', bg: 'rgba(0,214,143,0.12)',  icon: CheckCircle  },
  'Occupied':    { color: 'var(--accent)',  bg: 'rgba(0,212,255,0.12)',  icon: User         },
  'Maintenance': { color: 'var(--warning)', bg: 'rgba(255,184,48,0.12)', icon: Wrench       },
  'Reserved':    { color: '#6c63ff',        bg: 'rgba(108,99,255,0.12)', icon: Clock        },
  'Critical':    { color: 'var(--danger)',  bg: 'rgba(255,77,109,0.12)', icon: AlertTriangle },
};

const TYPE_COLOR = {
  'General Ward': '#74c0fc',
  'Private':      '#a9e34b',
  'ICU':          '#ff4d6d',
  'Emergency':    '#ff6b6b',
  'Pediatric':    '#f783ac',
  'Isolation':    '#ffa94d',
};

const STATUSES  = ['All', 'Available', 'Occupied', 'Critical', 'Reserved', 'Maintenance'];
const ALL_TYPES = ['All', ...Object.keys(TYPE_COLOR)];

const normalize = (row) => ({
  id:        row.id,
  number:    row.number,
  type:      row.type,
  department:row.department,
  floor:     row.floor,
  beds:      row.beds,
  status:    row.status,
  patient:   row.patient    || '',
  patientId: row.patient_id || '',
  admitDate: row.admit_date || '',
  notes:     row.notes      || '',
});

export default function Rooms() {
  const { isAdmin, isReceptionist } = useAuth();
  const canModifyRooms = isAdmin; // add / delete rooms (facility management)

  const [rooms,        setRooms]        = useState([]);
  const [sbPatients,   setSbPatients]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType,   setFilterType]   = useState('All');

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showAdd,      setShowAdd]      = useState(false);
  const [admitMode,    setAdmitMode]    = useState(false);
  const [editData,     setEditData]     = useState({});
  const [newRoom,      setNewRoom]      = useState({
    number: '', type: 'General Ward', department: '', floor: 1, beds: 1, status: 'Available', notes: '',
  });

  // ── Fetch ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const [{ data: roomData }, { data: portal }, { data: staff }] = await Promise.all([
      supabase.from('rooms').select('*').order('number', { ascending: true }),
      supabase.from('patient_profiles').select('id,name,email,status,admit_date').eq('is_active', true).order('name'),
      supabase.from('staff_patients').select('id,name,email,status,admit_date').eq('is_active', true).order('name'),
    ]);
    setRooms((roomData || []).map(normalize));
    const portalEmails = new Set((portal || []).map(p => p.email?.toLowerCase()).filter(Boolean));
    setSbPatients([
      ...(portal || []).map(p => ({ ...p, source: 'portal' })),
      ...(staff  || []).filter(p => !portalEmails.has(p.email?.toLowerCase())).map(p => ({ ...p, source: 'staff' })),
    ].sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived stats ────────────────────────────────────────────
  const occupied     = rooms.filter(r => r.status === 'Occupied' || r.status === 'Critical').length;
  const available    = rooms.filter(r => r.status === 'Available').length;
  const maintenance  = rooms.filter(r => r.status === 'Maintenance').length;
  const critical     = rooms.filter(r => r.status === 'Critical').length;
  const occupancyPct = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;

  const filtered = rooms.filter(r => {
    const q = search.toLowerCase();
    return (
      r.number.toLowerCase().includes(q) ||
      r.patient.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    ) &&
    (filterStatus === 'All' || r.status === filterStatus) &&
    (filterType   === 'All' || r.type   === filterType);
  });

  // All active, non-discharged patients can be admitted
  const assignablePatients = sbPatients.filter(p => p.status !== 'Discharged');

  // ── Sync patient status in their table ───────────────────────
  const syncPatientStatus = async (patientId, source, newStatus, admitDate) => {
    const table = source === 'portal' ? 'patient_profiles' : 'staff_patients';
    const update = { status: newStatus };
    if (admitDate) update.admit_date = admitDate;
    await supabase.from(table).update(update).eq('id', patientId);
  };

  // ── Edit modal ───────────────────────────────────────────────
  const openEdit = (room, e) => {
    e.stopPropagation();
    const pt = sbPatients.find(p => p.id === room.patientId);
    setSelectedRoom(room);
    setEditData({
      status:        room.status,
      patientId:     room.patientId,
      patient:       room.patient,
      patientSource: pt?.source || '',
      admitDate:     room.admitDate,
      notes:         room.notes,
    });
    setAdmitMode(false);
    setError('');
    setShowEdit(true);
  };

  const openAdmit = (room, e) => {
    e.stopPropagation();
    setSelectedRoom(room);
    setEditData({
      status:        'Occupied',
      patientId:     '',
      patient:       '',
      patientSource: '',
      admitDate:     new Date().toISOString().slice(0, 10),
      notes:         '',
    });
    setAdmitMode(true);
    setError('');
    setShowEdit(true);
  };

  const saveEdit = async () => {
    setSaving(true); setError('');
    const data = { ...editData };
    const prevPatientId = selectedRoom.patientId;
    if (!data.patientId) { data.patient = ''; data.admitDate = ''; }

    const { error: err } = await supabase.from('rooms').update({
      status:     data.status,
      patient:    data.patient    || null,
      patient_id: data.patientId  || null,
      admit_date: data.admitDate  || null,
      notes:      data.notes      || null,
    }).eq('id', selectedRoom.id);

    if (err) { setError(err.message); setSaving(false); return; }

    const today = new Date().toISOString().slice(0, 10);
    if (data.patientId !== prevPatientId) {
      // Admit the newly assigned patient
      if (data.patientId && data.patientSource) {
        const ptStatus = data.status === 'Critical' ? 'Critical' : 'Admitted';
        await syncPatientStatus(data.patientId, data.patientSource, ptStatus, today);
      }
      // Room vacated — revert previous patient to Outpatient
      if (prevPatientId) {
        const oldPt = sbPatients.find(p => p.id === prevPatientId);
        if (oldPt) await syncPatientStatus(prevPatientId, oldPt.source, 'Outpatient', null);
      }
    }

    setSaving(false);
    await fetchAll();
    setShowEdit(false);
  };

  // ── Quick discharge ──────────────────────────────────────────
  const handleDischarge = async (room, e) => {
    e.stopPropagation();
    if (!window.confirm(`Discharge ${room.patient} from Room ${room.number}?\nThey will be moved to Outpatient status.`)) return;
    setSaving(true);
    await supabase.from('rooms').update({
      status: 'Available', patient: null, patient_id: null, admit_date: null,
    }).eq('id', room.id);
    if (room.patientId) {
      const pt = sbPatients.find(p => p.id === room.patientId);
      if (pt) await syncPatientStatus(room.patientId, pt.source, 'Outpatient', null);
    }
    setSaving(false);
    await fetchAll();
  };

  // ── Add room ─────────────────────────────────────────────────
  const handleAddRoom = async () => {
    if (!newRoom.number.trim() || !newRoom.department.trim()) return;
    setSaving(true); setError('');
    const { error: err } = await supabase.from('rooms').insert({
      number:     newRoom.number.trim(),
      type:       newRoom.type,
      department: newRoom.department.trim(),
      floor:      newRoom.floor,
      beds:       newRoom.beds,
      status:     newRoom.status,
      notes:      newRoom.notes || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    await fetchAll();
    setShowAdd(false);
    setNewRoom({ number: '', type: 'General Ward', department: '', floor: 1, beds: 1, status: 'Available', notes: '' });
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Remove this room?')) return;
    await supabase.from('rooms').delete().eq('id', id);
    await fetchAll();
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:200, color:'var(--text-muted)', fontSize:14 }}>
      Loading rooms…
    </div>
  );

  const stats = [
    { label:'Total Rooms', value:rooms.length, color:'var(--accent)',  icon:BedDouble     },
    { label:'Occupied',    value:occupied,      color:'var(--info)',    icon:Users         },
    { label:'Available',   value:available,     color:'var(--success)', icon:CheckCircle   },
    { label:'Critical',    value:critical,      color:'var(--danger)',  icon:AlertTriangle },
    { label:'Maintenance', value:maintenance,   color:'var(--warning)', icon:Wrench        },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Rooms &amp; Wards</h1>
          <p className="page-desc">{rooms.length} rooms · {occupancyPct}% occupancy</p>
        </div>
        {canModifyRooms && (
          <button className="btn btn-primary" onClick={() => { setError(''); setShowAdd(true); }}>
            <Plus size={15}/> Add Room
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card" style={{ '--card-color': s.color }}>
              <div className="stat-icon" style={{ background:`${s.color}18` }}><Icon size={22} color={s.color}/></div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          );
        })}
      </div>

      {/* Occupancy bar */}
      <div className="card" style={{ marginBottom:20, padding:'14px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, alignItems:'center' }}>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>Overall Occupancy</span>
          <span style={{ fontSize:13, fontWeight:700, color: occupancyPct>80?'var(--danger)':occupancyPct>60?'var(--warning)':'var(--success)' }}>
            {occupancyPct}%
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${occupancyPct}%`, background: occupancyPct>80?'var(--danger)':occupancyPct>60?'var(--warning)':'var(--success)', transition:'width 0.5s ease' }}/>
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>{occupied} of {rooms.length} rooms occupied</div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:20, padding:'14px 20px' }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
            <input className="form-control" placeholder="Search room, patient, department…" style={{ paddingLeft:36 }}
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {STATUSES.map(s => {
              const active = filterStatus === s;
              const cfg    = STATUS_CONFIG[s];
              return (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding:'5px 13px', borderRadius:20, fontSize:12, fontWeight:600,
                  border:'1px solid', cursor:'pointer', transition:'all 0.2s',
                  background: active ? (cfg?.color || 'var(--accent)') : 'var(--bg-card)',
                  borderColor: active ? (cfg?.color || 'var(--accent)') : 'var(--border)',
                  color: active ? '#000' : 'var(--text-secondary)',
                }}>{s}</button>
              );
            })}
          </div>
          <select className="form-control" style={{ width:'auto', minWidth:140 }}
            value={filterType} onChange={e => setFilterType(e.target.value)}>
            {ALL_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>
        </div>
      </div>

      {/* Room cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(268px,1fr))', gap:16 }}>
        {filtered.map(room => {
          const cfg        = STATUS_CONFIG[room.status] || STATUS_CONFIG['Available'];
          const typColor   = TYPE_COLOR[room.type] || 'var(--accent)';
          const StatusIcon = cfg.icon;
          const isOccupied = room.status === 'Occupied' || room.status === 'Critical';
          return (
            <div key={room.id} className="card" style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ height:4, background:typColor, flexShrink:0 }}/>
              <div style={{ padding:18, flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:22, color:'var(--text-primary)', lineHeight:1 }}>Room {room.number}</div>
                    <div style={{ fontSize:11, color:typColor, fontWeight:600, marginTop:3 }}>{room.type}</div>
                  </div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}30`, whiteSpace:'nowrap' }}>
                    <StatusIcon size={11}/> {room.status}
                  </span>
                </div>

                <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-secondary)' }}>
                    <Building2 size={12}/> {room.department}
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)' }}>
                    Floor {room.floor}
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)' }}>
                    <Bed size={12}/> {room.beds} {room.beds === 1 ? 'Bed' : 'Beds'}
                  </span>
                </div>

                {room.patient ? (
                  <div style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px 12px', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:`${cfg.color}20`, display:'flex', alignItems:'center', justifyContent:'center', color:cfg.color, flexShrink:0 }}>
                      <User size={16}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{room.patient}</div>
                      {room.admitDate && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>Since {room.admitDate}</div>}
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)"/>
                  </div>
                ) : (
                  <div style={{ borderRadius:8, padding:'10px 12px', border:'1px dashed rgba(0,214,143,0.25)', textAlign:'center', fontSize:12, color:'var(--text-muted)', background:'rgba(0,214,143,0.04)' }}>
                    No patient assigned
                  </div>
                )}

                {room.notes && (
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontStyle:'italic', lineHeight:1.5 }}>{room.notes}</div>
                )}

                <div style={{ display:'flex', gap:6, marginTop:'auto' }}>
                  {room.status === 'Available' ? (
                    <button className="btn btn-primary btn-sm" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }} onClick={e => openAdmit(room, e)}>
                      <UserPlus size={13}/> Admit Patient
                    </button>
                  ) : isOccupied ? (
                    <>
                      <button className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center' }} onClick={e => openEdit(room, e)}>
                        Edit Room
                      </button>
                      <button
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', background:'rgba(255,184,48,0.12)', color:'var(--warning)', border:'1px solid rgba(255,184,48,0.3)' }}
                        title="Discharge patient"
                        onClick={e => handleDischarge(room, e)}
                      >
                        <LogOut size={12}/> Discharge
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center' }} onClick={e => openEdit(room, e)}>
                      Edit Room
                    </button>
                  )}
                  {canModifyRooms && (
                    <button className="btn btn-danger btn-icon btn-sm" title="Delete room" onClick={() => handleDeleteRoom(room.id)}>
                      <X size={13}/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text-muted)' }}>
          <BedDouble size={52} style={{ opacity:0.2, marginBottom:14 }}/>
          <p style={{ fontSize:15, fontWeight:600 }}>No rooms match your filters</p>
          <p style={{ fontSize:13, marginTop:6 }}>Try adjusting the search or status filter</p>
        </div>
      )}

      {/* ── Edit / Admit Modal ─────────────────────────────────────── */}
      {showEdit && selectedRoom && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--bg-secondary)', borderRadius:16, width:'100%', maxWidth:480, border:'1px solid var(--border)', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>
                  {admitMode ? `Admit Patient — Room ${selectedRoom.number}` : `Edit Room ${selectedRoom.number}`}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{selectedRoom.type} · {selectedRoom.department} · Floor {selectedRoom.floor}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEdit(false)}><X size={16}/></button>
            </div>

            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              {error && (
                <div style={{ background:'rgba(220,38,38,0.1)', color:'#f87171', padding:'10px 12px', borderRadius:6, display:'flex', gap:8, alignItems:'center', border:'1px solid rgba(220,38,38,0.3)' }}>
                  <AlertCircle size={15}/> {error}
                </div>
              )}

              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Room Status</label>
                <select className="form-control" value={editData.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}>
                  {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">{admitMode ? 'Select Patient to Admit *' : 'Assigned Patient'}</label>
                <select className="form-control" value={editData.patientId} onChange={e => {
                  const pt = sbPatients.find(p => p.id === e.target.value);
                  setEditData(prev => ({
                    ...prev,
                    patientId:     e.target.value,
                    patient:       pt ? pt.name : '',
                    patientSource: pt ? pt.source : '',
                    admitDate:     e.target.value ? new Date().toISOString().slice(0, 10) : '',
                  }));
                }}>
                  <option value="">— None —</option>
                  {assignablePatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                  ))}
                </select>
              </div>

              {editData.patientId && (
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Admit Date</label>
                  <input className="form-control" type="date" value={editData.admitDate}
                    onChange={e => setEditData(p => ({ ...p, admitDate: e.target.value }))}/>
                </div>
              )}

              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={3} placeholder="Any additional notes…" style={{ resize:'vertical' }}
                  value={editData.notes} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))}/>
              </div>
            </div>

            <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowEdit(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving || (admitMode && !editData.patientId)}>
                <Save size={14}/> {saving ? 'Saving…' : admitMode ? 'Admit Patient' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Room Modal ──────────────────────────────────────────── */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--bg-secondary)', borderRadius:16, width:'100%', maxWidth:480, border:'1px solid var(--border)', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700, fontSize:16 }}>Add New Room</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}><X size={16}/></button>
            </div>

            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              {error && (
                <div style={{ background:'rgba(220,38,38,0.1)', color:'#f87171', padding:'10px 12px', borderRadius:6, display:'flex', gap:8, alignItems:'center', border:'1px solid rgba(220,38,38,0.3)' }}>
                  <AlertCircle size={15}/> {error}
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Room Number *</label>
                  <input className="form-control" placeholder="e.g. 601" value={newRoom.number}
                    onChange={e => setNewRoom(p => ({ ...p, number: e.target.value }))}/>
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Floor</label>
                  <input className="form-control" type="number" min={1} value={newRoom.floor}
                    onChange={e => setNewRoom(p => ({ ...p, floor: +e.target.value }))}/>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Room Type</label>
                <select className="form-control" value={newRoom.type} onChange={e => setNewRoom(p => ({ ...p, type: e.target.value }))}>
                  {Object.keys(TYPE_COLOR).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Department *</label>
                <input className="form-control" placeholder="e.g. Cardiology" value={newRoom.department}
                  onChange={e => setNewRoom(p => ({ ...p, department: e.target.value }))}/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Beds</label>
                  <input className="form-control" type="number" min={1} value={newRoom.beds}
                    onChange={e => setNewRoom(p => ({ ...p, beds: +e.target.value }))}/>
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Status</label>
                  <select className="form-control" value={newRoom.status} onChange={e => setNewRoom(p => ({ ...p, status: e.target.value }))}>
                    {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} placeholder="Optional notes…" style={{ resize:'vertical' }}
                  value={newRoom.notes} onChange={e => setNewRoom(p => ({ ...p, notes: e.target.value }))}/>
              </div>
            </div>

            <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" disabled={!newRoom.number.trim() || !newRoom.department.trim() || saving} onClick={handleAddRoom}>
                <Plus size={14}/> {saving ? 'Adding…' : 'Add Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
