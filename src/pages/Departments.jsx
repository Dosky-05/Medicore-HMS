import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import * as Icons from 'lucide-react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';

const ICON_OPTIONS = [
  'Heart','Brain','Bone','Baby','Zap','RadioTower','Eye','Stethoscope',
  'Pill','Thermometer','Activity','Microscope','Syringe','Cross','Wind',
  'Smile','Ear','Hand','Scan','Ambulance','Venus','FlaskConical',
  'HeartPulse','Dna','Footprints','Glasses','Bandage',
];

const COLOR_OPTIONS = [
  '#00d4ff','#6c63ff','#ff6b6b','#00d68f','#ffb830','#ff4d6d',
  '#a78bfa','#34d399','#f87171','#60a5fa',
];

const EMPTY = { name:'', head:'', capacity:'', current:'', color:'#00d4ff', icon:'Activity' };

export default function Departments() {
  const { doctors } = useData();
  const { isAdmin } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null); // null | 'add' | 'edit' | 'delete'
  const [form,        setForm]        = useState(EMPTY);
  const [selected,    setSelected]    = useState(null);
  const [formError,   setFormError]   = useState('');
  const [saving,      setSaving]      = useState(false);

  const fetchDepts = useCallback(async () => {
    const [{ data: depts }, { data: portal }, { data: staff }] = await Promise.all([
      supabase.from('departments').select('*').order('id', { ascending: true }),
      supabase.from('patient_profiles').select('id,name,email,department').eq('is_active', true),
      supabase.from('staff_patients').select('id,name,email,department').eq('is_active', true),
    ]);
    setDepartments(depts || []);
    // Merge portal + staff patients, portal wins on matching email
    const portalEmails = new Set((portal || []).map(p => p.email?.toLowerCase()).filter(Boolean));
    setAllPatients([
      ...(portal || []),
      ...(staff || []).filter(p => !portalEmails.has(p.email?.toLowerCase())),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  const openAdd  = () => { setForm(EMPTY); setFormError(''); setModal('add'); };
  const openEdit = (d) => {
    setSelected(d);
    setForm({ name: d.name, head: d.head || '', capacity: String(d.capacity), current: String(d.current), color: d.color, icon: d.icon });
    setFormError('');
    setModal('edit');
  };
  const openDel = (d) => { setSelected(d); setModal('delete'); };
  const close   = () => { setModal(null); setSelected(null); setForm(EMPTY); setFormError(''); };

  const validate = () => {
    if (!form.name.trim()) { setFormError('Department name is required'); return false; }
    if (!form.capacity || isNaN(Number(form.capacity))) { setFormError('Enter a valid bed capacity'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name:     form.name.trim(),
      head:     form.head.trim(),
      capacity: Number(form.capacity),
      current:  Number(form.current) || 0,
      color:    form.color,
      icon:     form.icon,
    };

    let error;
    if (modal === 'add') {
      ({ error } = await supabase.from('departments').insert(payload));
    } else {
      ({ error } = await supabase.from('departments').update(payload).eq('id', selected.id));
    }
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    await fetchDepts();
    close();
  };

  const handleDelete = async () => {
    await supabase.from('departments').delete().eq('id', selected.id);
    await fetchDepts();
    close();
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:200, color:'var(--text-muted)', fontSize:14 }}>
      Loading departments…
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Departments</h1>
          <p className="page-desc">{departments.length} hospital departments</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Department</button>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {departments.map(dept => {
          const deptDoctors  = doctors.filter(d => d.department === dept.name);
          const deptPatients = allPatients.filter(p => p.department === dept.name);
          const occupancy    = dept.capacity ? Math.round((dept.current / dept.capacity) * 100) : 0;
          const DeptIcon     = Icons[dept.icon] || Icons.Activity;

          return (
            <div key={dept.id} className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ height:5, background: dept.color }} />
              <div style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:`${dept.color}18`, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${dept.color}30` }}>
                      <DeptIcon size={24} color={dept.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:16 }}>{dept.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>
                        {dept.head ? `Head: ${dept.head}` : 'Head: Not assigned'}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(dept)} title="Edit"><Pencil size={13}/></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => openDel(dept)} title="Delete"><Trash2 size={13}/></button>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600 }}>Occupancy</span>
                    <span style={{ fontSize:13, fontWeight:700, color: occupancy>80?'var(--danger)':occupancy>60?'var(--warning)':'var(--success)' }}>{occupancy}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${Math.min(occupancy,100)}%`, background: occupancy>80?'var(--danger)':occupancy>60?'var(--warning)':'var(--success)' }}/>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{dept.current} / {dept.capacity} beds occupied</div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {[
                    { label:'Capacity', value:dept.capacity, icon:<Icons.Bed size={16}/> },
                    { label:'Doctors',  value:deptDoctors.length,  icon:<Icons.UserPlus size={16}/> },
                    { label:'Patients', value:deptPatients.length, icon:<Icons.Users size={16}/> },
                  ].map(s => (
                    <div key={s.label} style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:16, marginBottom:4 }}>{s.icon}</div>
                      <div style={{ fontSize:18, fontWeight:800, color: dept.color }}>{s.value}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {deptDoctors.length > 0 && (
                  <div style={{ marginTop:14 }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Staff</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {deptDoctors.map(d => (
                        <span key={d.id} style={{ background:`${dept.color}12`, color:dept.color, border:`1px solid ${dept.color}25`, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500 }}>
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Add Department' : 'Edit Department'}
          onClose={close}
          footer={
            <>
              <button className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add Department' : 'Save Changes'}
              </button>
            </>
          }
        >
          {formError && <div className="login-error"><AlertCircle size={15}/> {formError}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input className="form-control" placeholder="e.g. Cardiology" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Department Head <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(optional)</span></label>
              <input className="form-control" placeholder="e.g. Dr. John Smith" value={form.head} onChange={e => setForm(f => ({ ...f, head: e.target.value }))}/>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bed Capacity *</label>
              <input className="form-control" type="number" min="1" placeholder="40" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Currently Occupied</label>
              <input className="form-control" type="number" min="0" placeholder="0" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))}/>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Icon</label>
              <select className="form-control" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Colour</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
                {COLOR_OPTIONS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width:26, height:26, borderRadius:'50%', background:c, border: form.color===c ? '3px solid white' : '2px solid transparent', cursor:'pointer', outline: form.color===c ? `2px solid ${c}` : 'none' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div style={{ marginTop:8, padding:'10px 14px', borderRadius:10, background:'var(--bg-card)', border:`1px solid ${form.color}40`, display:'flex', alignItems:'center', gap:12 }}>
            {(() => { const Icon = Icons[form.icon] || Icons.Activity; return <Icon size={20} color={form.color}/>; })()}
            <div>
              <div style={{ fontWeight:700, fontSize:14, color: form.color }}>{form.name || 'Department Name'}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{form.head || 'Head'}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {modal === 'delete' && (
        <Modal
          title="Delete Department"
          onClose={close}
          footer={
            <>
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }
        >
          <p style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.6 }}>
            Delete <strong style={{ color:'var(--text-primary)' }}>{selected?.name}</strong>? This only removes it from the departments list — existing patients and doctors linked to it are not affected.
          </p>
        </Modal>
      )}
    </div>
  );
}
