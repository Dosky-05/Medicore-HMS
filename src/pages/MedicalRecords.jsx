import { useState } from 'react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import { Plus, Search, Trash2, ClipboardList, Pill } from 'lucide-react';

const EMPTY = { patient:'', patientId:'', doctor:'', date:'', diagnosis:'', prescription:'', notes:'', labResults:'', vitals:{ bp:'', hr:'', temp:'', weight:'' } };

export default function MedicalRecords() {
  const { medicalRecords, addRecord, deleteRecord, patients, doctors } = useData();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);

  const filtered = medicalRecords.filter(r =>
    r.patient.toLowerCase().includes(search.toLowerCase()) ||
    r.diagnosis?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({...EMPTY, date: new Date().toISOString().slice(0,10)}); setModal('add'); };
  const openView = (r) => { setSelected(r); setModal('view'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = () => {
    const p = patients.find(x => x.name === form.patient);
    addRecord({ ...form, patientId: p?.id || '' });
    closeModal();
  };

  const setVital = (key, val) => setForm(f => ({ ...f, vitals: { ...f.vitals, [key]: val } }));

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-heading">Medical Records</h1><p className="page-desc">{medicalRecords.length} records on file</p></div>
        <button className="btn btn-primary" id="add-record-btn" onClick={openAdd}><Plus size={15}/> Add Record</button>
      </div>

      <div className="toolbar">
        <div className="search-box"><Search size={14} className="search-icon"/><input placeholder="Search by patient or diagnosis…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ cursor:'pointer' }} onClick={()=>openView(r)}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{r.patient}</div>
                <div style={{ fontSize:11, color:'var(--accent)', marginTop:2 }}>{r.date} · {r.doctor}</div>
              </div>
              <button className="btn btn-danger btn-icon btn-sm" onClick={e=>{ e.stopPropagation(); if(window.confirm('Delete record?')) deleteRecord(r.id); }}><Trash2 size={12}/></button>
            </div>
            <div style={{ background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Diagnosis</div>
              <div style={{ fontSize:13, fontWeight:600 }}>{r.diagnosis}</div>
            </div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:8, display:'flex', alignItems:'center', gap:4 }}><Pill size={12}/> {r.prescription}</div>
            {r.vitals && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                {[['BP',r.vitals.bp],['HR',r.vitals.hr],['Temp',r.vitals.temp],['Weight',r.vitals.weight]].map(([k,v])=>(
                  <div key={k} style={{ background:'var(--bg-card)', borderRadius:6, padding:'6px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase' }}>{k}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--text-primary)', marginTop:2 }}>{v||'—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length===0 && <div className="empty-state" style={{ gridColumn:'1/-1' }}><div className="empty-icon"><ClipboardList size={48} color="var(--text-muted)"/></div><p>No medical records found</p></div>}
      </div>

      {modal==='add' && (
        <Modal title="Add Medical Record" onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save Record</button></>}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Patient</label>
              <select className="form-control" value={form.patient} onChange={e=>setForm(f=>({...f,patient:e.target.value}))}>
                <option value="">Select…</option>{patients.map(p=><option key={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Doctor</label>
              <select className="form-control" value={form.doctor} onChange={e=>setForm(f=>({...f,doctor:e.target.value}))}>
                <option value="">Select…</option>{doctors.map(d=><option key={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Date</label><input className="form-control" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Diagnosis</label><input className="form-control" value={form.diagnosis} onChange={e=>setForm(f=>({...f,diagnosis:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Prescription</label><textarea className="form-control" rows={2} value={form.prescription} onChange={e=>setForm(f=>({...f,prescription:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Lab Results</label><input className="form-control" value={form.labResults} onChange={e=>setForm(f=>({...f,labResults:e.target.value}))}/></div>
          <div><label className="form-label">Vitals</label>
            <div className="form-row">
              {[['bp','Blood Pressure'],['hr','Heart Rate'],['temp','Temperature'],['weight','Weight']].map(([k,l])=>(
                <div key={k} className="form-group"><label className="form-label" style={{ fontSize:10 }}>{l}</label><input className="form-control" value={form.vitals[k]} onChange={e=>setVital(k,e.target.value)}/></div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {modal==='view' && selected && (
        <Modal title="Medical Record Details" onClose={closeModal} footer={<button className="btn btn-ghost" onClick={closeModal}>Close</button>}>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:120 }}><div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600 }}>Patient</div><div style={{ fontWeight:700, marginTop:2 }}>{selected.patient}</div></div>
            <div style={{ flex:1, minWidth:120 }}><div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600 }}>Doctor</div><div style={{ marginTop:2 }}>{selected.doctor}</div></div>
            <div style={{ flex:1, minWidth:120 }}><div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600 }}>Date</div><div style={{ color:'var(--accent)', marginTop:2 }}>{selected.date}</div></div>
          </div>
          {[['Diagnosis',selected.diagnosis],['Prescription',selected.prescription],['Notes',selected.notes],['Lab Results',selected.labResults]].map(([k,v])=>v&&(
            <div key={k} style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>{k}</div>
              <div style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px 12px', fontSize:13 }}>{v}</div>
            </div>
          ))}
          {selected.vitals && (
            <div>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Vitals</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[['BP',selected.vitals.bp],['HR',selected.vitals.hr],['Temp',selected.vitals.temp],['Weight',selected.vitals.weight]].map(([k,v])=>(
                  <div key={k} style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase' }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--accent)', marginTop:4 }}>{v||'—'}</div>
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
