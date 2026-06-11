import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, UsersRound, Eye, AlertCircle, Smartphone, UserPlus } from 'lucide-react';

const EMPTY = {
  name: '', age: '', gender: 'Male', blood: 'O+',
  phone: '', email: '', address: '', doctor: '', department: '',
  condition: '', status: 'Outpatient', allergies: '',
};

export default function Patients() {
  const { doctors } = useData();
  const { profile, canDelete } = useAuth();

  const [portalPatients, setPortalPatients] = useState([]);
  const [staffPatients,  setStaffPatients]  = useState([]);
  const [sbDepartments,  setSbDepartments]  = useState([]);
  const [loading,        setLoading]        = useState(true);

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [selected,     setSelected]     = useState(null);
  const [formError,    setFormError]    = useState('');
  const [saving,       setSaving]       = useState(false);

  const role = profile?.role || 'admin';

  const myDoctorName = useMemo(() => {
    if (role !== 'doctor') return null;
    const rec = doctors.find(d => String(d.id) === String(profile?.doctor_id));
    return rec?.name || profile?.name || null;
  }, [role, profile, doctors]);

  const canAdd  = role === 'admin' || role === 'nurse' || role === 'receptionist';
  const canEdit = role === 'admin' || role === 'nurse' || role === 'doctor' || role === 'receptionist';

  // ── Fetch ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const [{ data: portal }, { data: staff }, { data: depts }] = await Promise.all([
      supabase.from('patient_profiles').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('staff_patients').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('departments').select('name').order('id', { ascending: true }),
    ]);
    setPortalPatients(portal || []);
    setStaffPatients(staff  || []);
    setSbDepartments(depts?.map(d => d.name) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Normalize to a common shape ──────────────────────────────
  const normalize = (p, source) => ({
    id:         p.id,
    name:       p.name,
    email:      p.email      || '',
    phone:      p.phone      || '',
    age:        p.age        ?? '',
    gender:     p.gender     || 'Male',
    blood:      p.blood_type || 'O+',
    department: p.department || '',
    status:     p.status     || 'Outpatient',
    condition:  p.condition  || '',
    allergies:  p.allergies  || [],
    address:    p.address    || '',
    doctor:     p.doctor     || '',
    admitDate:  p.admit_date || '',
    source,
  });

  const normalPortal = portalPatients.map(p => normalize(p, 'portal'));
  const normalStaff  = staffPatients.map(p => normalize(p, 'staff'));

  // Portal version wins when emails match
  const portalEmails = new Set(normalPortal.map(p => p.email?.toLowerCase()).filter(Boolean));
  const uniqueStaff  = normalStaff.filter(p => !portalEmails.has(p.email?.toLowerCase()));
  const allPatients  = [...normalPortal, ...uniqueStaff];

  // ── Filters ──────────────────────────────────────────────────
  const filtered = allPatients.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.id?.toString().toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    const matchDoctor = !myDoctorName || p.doctor === myDoctorName;
    return matchSearch && matchStatus && matchDoctor;
  });

  // ── Modal helpers ────────────────────────────────────────────
  const openAdd  = () => { setForm(EMPTY); setFormError(''); setModal('add'); };
  const openEdit = (p) => {
    setSelected(p);
    setForm({ ...p, allergies: Array.isArray(p.allergies) ? p.allergies.join(', ') : (p.allergies || '') });
    setFormError('');
    setModal('edit');
  };
  const openView   = (p) => { setSelected(p); setModal('view'); };
  const openDelete = (p) => { setSelected(p); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setForm(EMPTY); setFormError(''); };

  const validate = () => {
    if (!form.name.trim()) { setFormError('Full name is required.'); return false; }
    if (modal === 'add') {
      if (!form.age)        { setFormError('Age is required.');              return false; }
      if (!form.department) { setFormError('Department is required.');        return false; }
      if (!form.doctor)     { setFormError('Assigned doctor is required.');  return false; }
    }
    return true;
  };

  const buildPayload = (allergies) => ({
    name:       form.name.trim(),
    phone:      form.phone      || null,
    age:        form.age        ? Number(form.age) : null,
    gender:     form.gender,
    blood_type: form.blood,
    department: form.department || null,
    status:     form.status,
    condition:  form.condition  || null,
    allergies,
    address:    form.address    || null,
    doctor:     form.doctor     || null,
  });

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const allergies = form.allergies
      ? form.allergies.split(',').map(a => a.trim()).filter(Boolean)
      : [];

    let error;
    if (modal === 'add') {
      ({ error } = await supabase.from('staff_patients').insert({
        ...buildPayload(allergies),
        email:      form.email     || null,
        admit_date: new Date().toISOString().slice(0, 10),
      }));
    } else if (selected.source === 'portal') {
      ({ error } = await supabase.from('patient_profiles').update(buildPayload(allergies)).eq('id', selected.id));
    } else {
      ({ error } = await supabase.from('staff_patients').update({
        ...buildPayload(allergies),
        email: form.email || null,
      }).eq('id', selected.id));
    }

    setSaving(false);
    if (error) { setFormError(error.message); return; }
    await fetchAll();
    closeModal();
  };

  const handleDelete = async () => {
    const table = selected.source === 'portal' ? 'patient_profiles' : 'staff_patients';
    await supabase.from(table).update({ is_active: false }).eq('id', selected.id);
    await fetchAll();
    closeModal();
  };


  const SourceBadge = ({ source }) => source === 'portal' ? (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:'var(--accent-glow)', color:'var(--accent)', padding:'1px 6px', borderRadius:20, fontSize:10, fontWeight:700 }}>
      <Smartphone size={9}/> Portal
    </span>
  ) : (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:'var(--accent-glow)', color:'var(--accent)', padding:'1px 6px', borderRadius:20, fontSize:10, fontWeight:700 }}>
      <UserPlus size={9}/> Staff
    </span>
  );

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:200, color:'var(--text-muted)', fontSize:14 }}>
      Loading patients…
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Patient Management</h1>
          <p className="page-desc">{allPatients.length} total patients registered</p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Patient
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input placeholder="Search by name, email or ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['All', 'Admitted', 'Outpatient', 'Discharged', 'Critical'].map(s => (
          <button key={s} className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th><th>Age / Gender</th><th>Blood</th><th>Department</th>
                <th>Doctor</th><th>Condition</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon"><UsersRound size={48} color="var(--text-muted)" /></div><p>No patients found</p></div></td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.name}
                          <SourceBadge source={p.source} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.age || '—'} / {p.gender}</td>
                  <td><span style={{ color: 'var(--danger)', fontWeight: 700 }}>{p.blood}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p.department || '—'}</td>
                  <td style={{ fontSize: 12 }}>{p.doctor || '—'}</td>
                  <td style={{ fontSize: 12 }}>{p.condition || '—'}</td>
                  <td><Badge status={p.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View"   onClick={() => openView(p)}><Eye size={13} /></button>
                      {canEdit   && <button className="btn btn-ghost btn-icon btn-sm" title="Edit"   onClick={() => openEdit(p)}><Pencil size={13} /></button>}
                      {canDelete && <button className="btn btn-danger btn-icon btn-sm" title="Remove" onClick={() => openDelete(p)}><Trash2 size={13} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Register New Patient' : selected?.source === 'portal' ? 'Update Portal Patient' : 'Edit Patient'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Patient'}
              </button>
            </>
          }
        >
          {formError && (
            <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} /> {formError}
            </div>
          )}

          {selected?.source === 'portal' && (
            <div style={{ background:'rgba(0,214,143,0.06)', border:'1px solid rgba(0,214,143,0.2)', borderRadius:8, padding:'8px 12px', marginBottom:14, fontSize:12, color:'var(--text-secondary)', display:'flex', gap:8, alignItems:'center' }}>
              <Smartphone size={13} color="#00d68f"/>
              Portal patient — email is read-only. Update clinical details below.
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Age {modal === 'add' ? '*' : ''}</label>
              <input className="form-control" type="number" min="0" max="150" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-control" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Type</label>
              <select className="form-control" value={form.blood} onChange={e => setForm(f => ({ ...f, blood: e.target.value }))}>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                readOnly={selected?.source === 'portal'}
                style={selected?.source === 'portal' ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-control" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department {modal === 'add' ? '*' : ''}</label>
              <select className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">Select department…</option>
                {sbDepartments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Doctor {modal === 'add' ? '*' : ''}</label>
              <select className="form-control" value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))}>
                <option value="">Select doctor…</option>
                {doctors
                  .filter(d => !form.department || d.department === form.department)
                  .map(d => <option key={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Condition</label>
              <input className="form-control" placeholder="e.g. Hypertension" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['Admitted', 'Outpatient', 'Discharged', 'Critical'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Allergies</label>
            <input
              className="form-control"
              placeholder="e.g. Penicillin, Aspirin, Latex (comma-separated)"
              value={form.allergies}
              onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
            />
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <Modal title="Patient Details" onClose={closeModal} footer={<button className="btn btn-ghost" onClick={closeModal}>Close</button>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <div className="avatar" style={{ width: 56, height: 56, borderRadius: 14, fontSize: 18 }}>
              {selected.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {selected.name}
                <SourceBadge source={selected.source} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {selected.email || '—'} · {selected.department || 'No department'}
              </div>
            </div>
            <Badge status={selected.status} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['Age',        selected.age   || '—'],
              ['Gender',     selected.gender],
              ['Blood Type', selected.blood],
              ['Phone',      selected.phone || '—'],
              ['Email',      selected.email || '—'],
              ['Doctor',     selected.doctor || '—'],
              ['Condition',  selected.condition || '—'],
              ['Admit Date', selected.admitDate || '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          {selected.address && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Address</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{selected.address}</div>
            </div>
          )}
          {selected.allergies?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Allergies</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selected.allergies.map(a => (
                  <span key={a} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(255,77,109,0.1)', color: 'var(--danger)', border: '1px solid rgba(255,77,109,0.2)' }}>{a}</span>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Delete / Remove Modal */}
      {modal === 'delete' && selected && (
        <Modal
          title="Remove Patient"
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Remove</button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Remove <strong style={{ color: 'var(--text-primary)' }}>{selected.name}</strong> from the patients list?
            {selected.source === 'portal'
              ? ' Their portal account stays intact — they can still log in.'
              : ' This only removes them from the staff records.'}
          </p>
        </Modal>
      )}
    </div>
  );
}
