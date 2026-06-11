import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, Pill, User, FileText, AlertCircle, Eye } from 'lucide-react';

const EMPTY = { patientId: null, patient: '', doctor: '', date: '', medicines: [], instructions: '', status: 'Active' };
const EMPTY_MED = { name: '', dose: '', frequency: '', duration: '' };

// Normalize Supabase row → internal shape
const normalize = (rx) => ({
  id:           rx.id,
  patientId:    rx.patient_id,
  patient:      rx.patient_name,
  doctor:       rx.doctor_name,
  date:         rx.date,
  medicines:    rx.medicines || [],
  instructions: rx.instructions || '',
  status:       rx.status,
  created_at:   rx.created_at,
});

export default function Prescriptions() {
  const { doctors } = useData();
  const { profile } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [sbPatients,    setSbPatients]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal,        setModal]        = useState(null);
  const [viewModal,    setViewModal]    = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [selected,     setSelected]     = useState(null);
  const [medInput,     setMedInput]     = useState(EMPTY_MED);
  const [error,        setError]        = useState('');

  const myDoctorName = useMemo(() => {
    if (profile?.role !== 'doctor') return null;
    return doctors.find(d => String(d.id) === String(profile.doctor_id))?.name || profile.name || null;
  }, [profile, doctors]);

  // ── Data fetching ────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const [{ data: rxData }, { data: portal }, { data: staff }] = await Promise.all([
      supabase.from('prescriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('patient_profiles').select('id,name,email').eq('is_active', true).order('name'),
      supabase.from('staff_patients').select('id,name,email').eq('is_active', true).order('name'),
    ]);
    setPrescriptions((rxData || []).map(normalize));
    const portalEmails = new Set((portal || []).map(p => p.email?.toLowerCase()).filter(Boolean));
    setSbPatients([
      ...(portal || []).map(p => ({ ...p, source: 'portal' })),
      ...(staff  || []).filter(p => !portalEmails.has(p.email?.toLowerCase())).map(p => ({ ...p, source: 'staff' })),
    ].sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived ──────────────────────────────────────────────────
  const filtered = prescriptions.filter(rx => {
    const q = search.toLowerCase();
    return (rx.patient.toLowerCase().includes(q) || rx.doctor.toLowerCase().includes(q)) &&
      (filterStatus === 'All' || rx.status === filterStatus) &&
      (!myDoctorName || rx.doctor === myDoctorName);
  });

  // ── Modal helpers ────────────────────────────────────────────
  const resetMed = () => setMedInput(EMPTY_MED);
  const openAdd  = () => { setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10), doctor: myDoctorName || '' }); resetMed(); setError(''); setModal('add'); };
  const openEdit = (rx) => { setSelected(rx); setForm({ ...rx }); resetMed(); setError(''); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); setForm(EMPTY); resetMed(); setError(''); setSaving(false); };
  const openView = (rx) => setViewModal(rx);
  const closeView = () => setViewModal(null);

  const addMed = () => {
    if (!medInput.name || !medInput.dose || !medInput.frequency || !medInput.duration) {
      setError('Fill all medicine fields before adding.'); return;
    }
    setForm(f => ({ ...f, medicines: [...f.medicines, { ...medInput }] }));
    resetMed(); setError('');
  };
  const removeMed = (i) => setForm(f => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.patient) { setError('Please select a patient.'); return; }
    const doctorName = myDoctorName || form.doctor;
    if (!doctorName) { setError('Please select a doctor.'); return; }
    if (form.medicines.length === 0) { setError('Add at least one medicine.'); return; }
    setSaving(true); setError('');

    const sbPt = sbPatients.find(p => p.name === form.patient);
    const payload = {
      patient_name: form.patient,
      patient_id:   sbPt?.source === 'portal' ? sbPt.id : null,
      doctor_name:  doctorName,
      date:         form.date,
      medicines:    form.medicines,
      instructions: form.instructions || null,
      status:       form.status,
    };

    let err;
    if (modal === 'add') {
      ({ error: err } = await supabase.from('prescriptions').insert(payload));
    } else {
      ({ error: err } = await supabase.from('prescriptions').update(payload).eq('id', selected.id));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    await fetchAll();
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prescription?')) return;
    await supabase.from('prescriptions').delete().eq('id', id);
    await fetchAll();
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:200, color:'var(--text-muted)', fontSize:14 }}>
      Loading prescriptions…
    </div>
  );

  const activeCount = prescriptions.filter(p => p.status === 'Active').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Prescriptions</h1>
          <p className="page-desc">{activeCount} active · {prescriptions.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> New Prescription</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon"/>
          <input placeholder="Search patient or doctor…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        {['All', 'Active', 'Completed'].map(s => (
          <button key={s} className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Medicines</th><th>Status</th><th style={{ textAlign:'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon"><Pill size={48} color="var(--text-muted)"/></div><p>No prescriptions found</p></div></td></tr>
              )}
              {filtered.map(rx => (
                <tr key={rx.id}>
                  <td style={{ fontWeight:600, fontSize:13 }}>{rx.patient}</td>
                  <td style={{ fontSize:13 }}>{rx.doctor}</td>
                  <td style={{ fontSize:13 }}>{rx.date}</td>
                  <td style={{ fontSize:13, maxWidth:280 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                      {rx.medicines.slice(0, 3).map((m, i) => (
                        <div key={i} style={{ background:'rgba(59,130,246,0.15)', color:'#60a5fa', padding:'5px 9px', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid rgba(59,130,246,0.3)' }}>
                          <div>{m.name}</div>
                          <div style={{ fontSize:10, opacity:0.85 }}>{m.dose}</div>
                        </div>
                      ))}
                      {rx.medicines.length > 3 && (
                        <div style={{ background:'rgba(100,116,139,0.15)', color:'var(--text-muted)', padding:'5px 9px', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid var(--border)' }}>
                          +{rx.medicines.length - 3} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td><Badge status={rx.status}/></td>
                  <td>
                    <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => openView(rx)}><Eye size={13}/></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(rx)}><Pencil size={13}/></button>
                      <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => handleDelete(rx.id)}><Trash2 size={13}/></button>
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
          title={modal === 'add' ? 'New Prescription' : 'Edit Prescription'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Prescription'}
              </button>
            </>
          }
        >
          {error && (
            <div style={{ background:'rgba(220,38,38,0.1)', color:'#f87171', padding:'10px 12px', borderRadius:6, marginBottom:16, display:'flex', gap:8, alignItems:'center', border:'1px solid rgba(220,38,38,0.3)' }}>
              <AlertCircle size={15}/> {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><User size={13}/> Patient *</label>
              <select className="form-control" value={form.patient} onChange={e => {
                const pt = sbPatients.find(p => p.name === e.target.value);
                setForm(f => ({ ...f, patient: e.target.value, patientId: pt?.id || null }));
              }}>
                <option value="">Select patient…</option>
                {sbPatients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Doctor *</label>
              {myDoctorName ? (
                <input className="form-control" value={myDoctorName} readOnly
                  style={{ opacity:0.75, cursor:'not-allowed', background:'var(--bg-card)' }}/>
              ) : (
                <select className="form-control" value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))}>
                  <option value="">Select doctor…</option>
                  {doctors.map(d => <option key={d.id}>{d.name}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-control" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option>Active</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          {/* Medicines builder */}
          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}><Pill size={14}/> Medicines *</label>

            {form.medicines.length > 0 && (
              <div style={{ background:'var(--bg-card)', borderRadius:8, padding:12, marginBottom:10 }}>
                {form.medicines.map((m, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < form.medicines.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize:12 }}>
                      <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{m.name} — {m.dose}</div>
                      <div style={{ color:'var(--text-muted)', marginTop:2 }}>{m.frequency} · {m.duration}</div>
                    </div>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeMed(i)}><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background:'var(--bg-card)', borderRadius:8, padding:12, border:'1px dashed var(--border)' }}>
              <div className="form-row" style={{ gap:8, marginBottom:8 }}>
                <input className="form-control" placeholder="Medicine name" value={medInput.name}
                  onChange={e => setMedInput(m => ({ ...m, name: e.target.value }))} style={{ fontSize:12 }}/>
                <input className="form-control" placeholder="Dose (e.g. 500mg)" value={medInput.dose}
                  onChange={e => setMedInput(m => ({ ...m, dose: e.target.value }))} style={{ fontSize:12 }}/>
              </div>
              <div className="form-row" style={{ gap:8, marginBottom:10 }}>
                <input className="form-control" placeholder="Frequency (e.g. Twice daily)" value={medInput.frequency}
                  onChange={e => setMedInput(m => ({ ...m, frequency: e.target.value }))} style={{ fontSize:12 }}/>
                <input className="form-control" placeholder="Duration (e.g. 7 days)" value={medInput.duration}
                  onChange={e => setMedInput(m => ({ ...m, duration: e.target.value }))} style={{ fontSize:12 }}/>
              </div>
              <button className="btn btn-primary btn-sm" onClick={addMed}
                disabled={!medInput.name || !medInput.dose || !medInput.frequency || !medInput.duration}>
                <Plus size={12}/> Add Medicine
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}><FileText size={14}/> Instructions</label>
            <textarea className="form-control" rows={2} placeholder="Special instructions or warnings…"
              value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}/>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewModal && (
        <Modal
          title="Prescription Details"
          onClose={closeView}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeView}>Close</button>
              <button className="btn btn-primary" onClick={() => { openEdit(viewModal); closeView(); }}>Edit</button>
            </>
          }
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20, padding:14, background:'var(--bg-card)', borderRadius:8, border:'1px solid var(--border)' }}>
            {[['Patient', viewModal.patient], ['Doctor', viewModal.doctor], ['Date', viewModal.date]].map(([k, v]) => (
              <div key={k}>
                <div style={{ color:'var(--text-muted)', fontSize:10, marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{k}</div>
                <div style={{ fontWeight:600, fontSize:14 }}>{v}</div>
              </div>
            ))}
            <div>
              <div style={{ color:'var(--text-muted)', fontSize:10, marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Status</div>
              <Badge status={viewModal.status}/>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <Pill size={15} color="#3b82f6"/>
              <span style={{ fontSize:14, fontWeight:700 }}>Medicines <span style={{ color:'var(--text-muted)', fontWeight:400 }}>({viewModal.medicines.length})</span></span>
            </div>
            {viewModal.medicines.length > 0 ? (
              <div style={{ display:'grid', gap:8 }}>
                {viewModal.medicines.map((m, i) => (
                  <div key={i} style={{ border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', background:'var(--bg-card)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#60a5fa' }}>{m.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Dosage: <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{m.dose}</span></div>
                      </div>
                      <span style={{ background:'rgba(59,130,246,0.15)', color:'#60a5fa', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, border:'1px solid rgba(59,130,246,0.25)' }}>#{i+1}</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, paddingTop:8, borderTop:'1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:3, fontWeight:700, textTransform:'uppercase' }}>Frequency</div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{m.frequency}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:3, fontWeight:700, textTransform:'uppercase' }}>Duration</div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{m.duration}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding:16, background:'var(--bg-card)', borderRadius:8, textAlign:'center', color:'var(--text-muted)', fontSize:13, border:'1px dashed var(--border)' }}>
                No medicines prescribed
              </div>
            )}
          </div>

          {viewModal.instructions && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <FileText size={15} color="#f59e0b"/>
                <span style={{ fontSize:14, fontWeight:700 }}>Instructions</span>
              </div>
              <div style={{ padding:'12px 14px', background:'var(--bg-card)', borderRadius:8, border:'1px solid rgba(255,184,48,0.2)', color:'var(--text-secondary)', fontSize:13, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                {viewModal.instructions}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
