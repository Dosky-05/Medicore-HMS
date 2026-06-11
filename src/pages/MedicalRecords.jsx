import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import { Plus, Search, Trash2, ClipboardList, Pill, RefreshCw, FileText } from 'lucide-react';

const EMPTY = {
  patient: '', patientId: '', doctor: '', date: '',
  diagnosis: '', medicines: [], instructions: '', notes: '', labResults: '',
  vitals: { bp: '', hr: '', temp: '', weight: '' },
  updateCondition: true,
};

const EMPTY_MED = { name: '', dose: '', frequency: '', duration: '' };

const VITALS = [
  { key: 'bp',     label: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80' },
  { key: 'hr',     label: 'Heart Rate',     unit: 'bpm',  placeholder: '72'     },
  { key: 'temp',   label: 'Temperature',    unit: '°C',   placeholder: '37.0'   },
  { key: 'weight', label: 'Weight',         unit: 'kg',   placeholder: '70'     },
];

// Appends unit when saving so stored value is always e.g. "120/80 mmHg"
const withUnit = (val, unit) => {
  if (!val?.trim()) return val;
  return val.includes(unit) ? val : `${val.trim()} ${unit}`;
};

export default function MedicalRecords() {
  const { medicalRecords, addRecord, deleteRecord, doctors } = useData();
  const { profile } = useAuth();

  const [search,        setSearch]        = useState('');
  const [modal,         setModal]         = useState(null);
  const [form,          setForm]          = useState(EMPTY);
  const [selected,      setSelected]      = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [sbPatients,    setSbPatients]    = useState([]);
  const [medInput,      setMedInput]      = useState(EMPTY_MED);
  const [sbMedRecords,  setSbMedRecords]  = useState([]);

  // If logged in as a doctor, resolve their canonical name from the doctors list
  const myDoctorName = useMemo(() => {
    if (profile?.role !== 'doctor') return null;
    return doctors.find(d => String(d.id) === String(profile.doctor_id))?.name || profile.name || null;
  }, [profile, doctors]);

  const canDelete = profile?.role === 'admin';

  // Fetch records from Supabase — scoped to doctor's own patients, or all for admin/nurse
  const fetchSbRecords = useCallback(async () => {
    let query = supabase
      .from('medical_records')
      .select('id,patient_name,doctor,date,diagnosis,prescription,notes,lab_results,vitals')
      .order('date', { ascending: false });
    if (myDoctorName) query = query.eq('doctor', myDoctorName);
    const { data } = await query;
    setSbMedRecords((data || []).map(r => ({
      id: r.id,
      patient: r.patient_name,
      doctor: r.doctor,
      date: r.date,
      diagnosis: r.diagnosis,
      prescription: r.prescription,
      notes: r.notes,
      labResults: r.lab_results,
      vitals: r.vitals,
      medicines: [],
      instructions: '',
    })));
  }, [myDoctorName]);

  useEffect(() => { fetchSbRecords(); }, [fetchSbRecords]);

  // Fetch all patients from Supabase (portal + staff-added)
  const fetchPatients = useCallback(async () => {
    const [{ data: portal }, { data: staff }] = await Promise.all([
      supabase.from('patient_profiles').select('id,name,email').eq('is_active', true).order('name'),
      supabase.from('staff_patients').select('id,name,email').eq('is_active', true).order('name'),
    ]);
    const portalEmails = new Set((portal || []).map(p => p.email?.toLowerCase()).filter(Boolean));
    const merged = [
      ...(portal || []).map(p => ({ ...p, source: 'portal' })),
      ...(staff  || []).filter(p => !portalEmails.has(p.email?.toLowerCase())).map(p => ({ ...p, source: 'staff' })),
    ].sort((a, b) => a.name.localeCompare(b.name));
    setSbPatients(merged);
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Merge Supabase records with local-only mock records (dedup by supabase_id)
  const displayRecords = useMemo(() => {
    const sbIds = new Set(sbMedRecords.map(r => String(r.id)));
    const localOnly = medicalRecords.filter(r => {
      if (myDoctorName && r.doctor !== myDoctorName) return false;
      return !r.supabase_id || !sbIds.has(String(r.supabase_id));
    });
    return [...sbMedRecords, ...localOnly];
  }, [myDoctorName, sbMedRecords, medicalRecords]);

  const filtered = displayRecords.filter(r =>
    r.patient.toLowerCase().includes(search.toLowerCase()) ||
    r.diagnosis?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10), doctor: myDoctorName || '' }); setMedInput(EMPTY_MED); setModal('add'); };
  const openView = (r) => { setSelected(r); setModal('view'); };
  const closeModal = () => { setModal(null); setSelected(null); setSaving(false); setMedInput(EMPTY_MED); };

  const addMedicine = () => {
    if (!medInput.name || !medInput.dose || !medInput.frequency || !medInput.duration) return;
    setForm(f => ({ ...f, medicines: [...f.medicines, { ...medInput }] }));
    setMedInput(EMPTY_MED);
  };
  const removeMedicine = (idx) => setForm(f => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.patient || !form.doctor || !form.date || !form.diagnosis) return;
    setSaving(true);

    const sbPt = sbPatients.find(p => p.name === form.patient);

    // Build a readable text summary for the medical_records.prescription column
    const prescriptionText = form.medicines.length > 0
      ? form.medicines.map(m => `${m.name} ${m.dose}`).join(', ')
      : null;

    const { data: sbRec } = await supabase
      .from('medical_records')
      .insert({
        patient_id:   sbPt?.source === 'portal' ? sbPt.id : null,
        patient_name: form.patient,
        doctor:       form.doctor,
        date:         form.date,
        diagnosis:    form.diagnosis || null,
        prescription: prescriptionText,
        notes:        form.notes     || null,
        lab_results:  form.labResults || null,
        vitals: {
          bp:     withUnit(form.vitals.bp,     'mmHg'),
          hr:     withUnit(form.vitals.hr,     'bpm'),
          temp:   withUnit(form.vitals.temp,   '°C'),
          weight: withUnit(form.vitals.weight, 'kg'),
        },
      })
      .select('id')
      .single();

    // Insert structured prescription into the prescriptions table so the
    // patient sees it under /portal/prescriptions (triggers a portal notification)
    if (form.medicines.length > 0) {
      await supabase.from('prescriptions').insert({
        patient_id:   sbPt?.source === 'portal' ? sbPt.id : null,
        patient_name: form.patient,
        doctor_name:  form.doctor,
        date:         form.date,
        medicines:    form.medicines,
        instructions: form.instructions || null,
        status:       'Active',
      });
    }

    // Optionally update the patient's condition field
    if (form.updateCondition && form.diagnosis && sbPt) {
      const table = sbPt.source === 'portal' ? 'patient_profiles' : 'staff_patients';
      await supabase.from(table).update({ condition: form.diagnosis }).eq('id', sbPt.id);
    }

    // Keep localStorage in sync for the staff list view
    addRecord({ ...form, prescription: prescriptionText, supabase_id: sbRec?.id || null });
    setSaving(false);
    closeModal();
    fetchSbRecords();
  };

  const setVital = (key, val) => setForm(f => ({ ...f, vitals: { ...f.vitals, [key]: val } }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Medical Records</h1>
          <p className="page-desc">
            {myDoctorName ? `${filtered.length} of your patient records` : `${displayRecords.length} records on file`}
          </p>
        </div>
        <button className="btn btn-primary" id="add-record-btn" onClick={openAdd}>
          <Plus size={15}/> Add Record
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon"/>
          <input placeholder="Search by patient or diagnosis…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ cursor:'pointer' }} onClick={() => openView(r)}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{r.patient}</div>
                <div style={{ fontSize:11, color:'var(--accent)', marginTop:2 }}>{r.date} · {r.doctor}</div>
              </div>
              {canDelete && (
                <button
                  className="btn btn-danger btn-icon btn-sm"
                  onClick={async e => {
                    e.stopPropagation();
                    if (!window.confirm('Delete record?')) return;
                    const isUuid = !String(r.id).startsWith('MR');
                    if (isUuid) {
                      await supabase.from('medical_records').delete().eq('id', r.id);
                      setSbMedRecords(prev => prev.filter(rec => rec.id !== r.id));
                    } else {
                      deleteRecord(r.id);
                    }
                  }}
                >
                  <Trash2 size={12}/>
                </button>
              )}
            </div>
            <div style={{ background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Diagnosis</div>
              <div style={{ fontSize:13, fontWeight:600 }}>{r.diagnosis}</div>
            </div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
              <Pill size={12}/> {r.prescription}
            </div>
            {r.vitals && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                {[['BP',r.vitals.bp],['HR',r.vitals.hr],['Temp',r.vitals.temp],['Weight',r.vitals.weight]].map(([k,v]) => (
                  <div key={k} style={{ background:'var(--bg-card)', borderRadius:6, padding:'6px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase' }}>{k}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--text-primary)', marginTop:2 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn:'1/-1' }}>
            <div className="empty-icon"><ClipboardList size={48} color="var(--text-muted)"/></div>
            <p>No medical records found</p>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {modal === 'add' && (
        <Modal
          title="Add Medical Record"
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.patient || !form.doctor || !form.date || !form.diagnosis}>
                {saving ? 'Saving…' : 'Save Record'}
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select className="form-control" value={form.patient} onChange={e => setForm(f => ({ ...f, patient: e.target.value }))}>
                <option value="">Select patient…</option>
                {sbPatients.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Doctor</label>
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

          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-control" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}/>
          </div>

          <div className="form-group">
            <label className="form-label">Diagnosis *</label>
            <input
              className="form-control"
              placeholder="e.g. Type 2 Diabetes, Hypertension…"
              value={form.diagnosis}
              onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
            />
            {/* Update condition toggle — only shown when a patient and diagnosis are filled */}
            {form.patient && form.diagnosis && (
              <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, cursor:'pointer', padding:'8px 12px', borderRadius:8, background: form.updateCondition ? 'rgba(0,214,143,0.08)' : 'var(--bg-card)', border:`1px solid ${form.updateCondition ? 'rgba(0,214,143,0.3)' : 'var(--border)'}`, transition:'all 0.2s' }}>
                <input
                  type="checkbox"
                  checked={form.updateCondition}
                  onChange={e => setForm(f => ({ ...f, updateCondition: e.target.checked }))}
                  style={{ accentColor:'#00d68f', width:15, height:15, cursor:'pointer' }}
                />
                <RefreshCw size={13} color={form.updateCondition ? '#00d68f' : 'var(--text-muted)'}/>
                <span style={{ fontSize:12, fontWeight:600, color: form.updateCondition ? '#00d68f' : 'var(--text-secondary)' }}>
                  Update <strong>{form.patient}</strong>'s condition to this diagnosis
                </span>
              </label>
            )}
          </div>

          {/* ── Medicines builder ─────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}><Pill size={14}/> Prescription (Medicines)</label>

            {form.medicines.length > 0 && (
              <div style={{ background:'var(--bg-card)', borderRadius:8, padding:12, marginBottom:10, display:'flex', flexDirection:'column', gap:0 }}>
                {form.medicines.map((m, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < form.medicines.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize:12 }}>
                      <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{m.name} — {m.dose}</div>
                      <div style={{ color:'var(--text-muted)', marginTop:2 }}>{m.frequency} · {m.duration}</div>
                    </div>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeMedicine(i)}><Trash2 size={12}/></button>
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
              <button
                className="btn btn-primary btn-sm"
                onClick={addMedicine}
                disabled={!medInput.name || !medInput.dose || !medInput.frequency || !medInput.duration}
              >
                <Plus size={12}/> Add Medicine
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}><FileText size={14}/> Prescription Instructions</label>
            <textarea className="form-control" rows={2} placeholder="Special instructions or warnings…"
              value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}/>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
          </div>

          <div className="form-group">
            <label className="form-label">Lab Results</label>
            <input className="form-control" value={form.labResults} onChange={e => setForm(f => ({ ...f, labResults: e.target.value }))}/>
          </div>

          <div>
            <label className="form-label">Vitals</label>
            <div className="form-row">
              {VITALS.map(({ key, label, unit, placeholder }) => (
                <div key={key} className="form-group">
                  <label className="form-label" style={{ fontSize:10 }}>{label}</label>
                  <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                    <input
                      className="form-control"
                      placeholder={placeholder}
                      value={form.vitals[key]}
                      onChange={e => setVital(key, e.target.value)}
                      style={{ paddingRight: 46 }}
                    />
                    <span style={{
                      position:'absolute', right:10,
                      fontSize:11, fontWeight:700,
                      color:'var(--text-muted)',
                      pointerEvents:'none', userSelect:'none',
                      letterSpacing:'0.02em',
                    }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* View Record Modal */}
      {modal === 'view' && selected && (
        <Modal title="Medical Record Details" onClose={closeModal} footer={<button className="btn btn-ghost" onClick={closeModal}>Close</button>}>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:120 }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600 }}>Patient</div>
              <div style={{ fontWeight:700, marginTop:2 }}>{selected.patient}</div>
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600 }}>Doctor</div>
              <div style={{ marginTop:2 }}>{selected.doctor}</div>
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600 }}>Date</div>
              <div style={{ color:'var(--accent)', marginTop:2 }}>{selected.date}</div>
            </div>
          </div>
          {[['Diagnosis',selected.diagnosis],['Notes',selected.notes],['Lab Results',selected.labResults]].map(([k,v]) => v && (
            <div key={k} style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>{k}</div>
              <div style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px 12px', fontSize:13 }}>{v}</div>
            </div>
          ))}

          {/* Medicines list (structured) or fallback to text summary */}
          {(selected.medicines?.length > 0 || selected.prescription) && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
                <Pill size={11}/> Prescription
              </div>
              {selected.medicines?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {selected.medicines.map((m, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:8, background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                      <div style={{ width:30, height:30, borderRadius:7, background:'rgba(0,214,143,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Pill size={14} color="#00d68f"/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{m.name} <span style={{ fontWeight:400, color:'var(--text-secondary)' }}>{m.dose}</span></div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{m.frequency} · {m.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px 12px', fontSize:13 }}>{selected.prescription}</div>
              )}
              {selected.instructions && (
                <div style={{ marginTop:8, padding:'8px 12px', borderRadius:8, fontSize:12, color:'var(--text-secondary)', background:'rgba(255,184,48,0.06)', border:'1px solid rgba(255,184,48,0.2)' }}>
                  {selected.instructions}
                </div>
              )}
            </div>
          )}
          {selected.vitals && (
            <div>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Vitals</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[['BP',selected.vitals.bp],['HR',selected.vitals.hr],['Temp',selected.vitals.temp],['Weight',selected.vitals.weight]].map(([k,v]) => (
                  <div key={k} style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase' }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--accent)', marginTop:4 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
