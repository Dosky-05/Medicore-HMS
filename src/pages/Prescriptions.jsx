import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, Pill, User, FileText, AlertCircle, CheckCircle, Eye, X } from 'lucide-react';

const EMPTY = { appointmentId:'', patientId:'', patient:'', doctor:'', date:'', medicines:[], instructions:'', status:'Active' };

export default function Prescriptions() {
  const { prescriptions, addPrescription, updatePrescription, deletePrescription, patients, doctors, appointments } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal, setModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);
  const [medicineInput, setMedicineInput] = useState({ name:'', dose:'', frequency:'', duration:'' });
  const [msg, setMsg] = useState('');

  const filtered = prescriptions.filter(p => {
    const matchS = p.patient.toLowerCase().includes(search.toLowerCase()) || p.doctor.toLowerCase().includes(search.toLowerCase());
    const matchF = filterStatus === 'All' || p.status === filterStatus;
    return matchS && matchF;
  });

  const openAdd = () => { setForm({...EMPTY, date: new Date().toISOString().split('T')[0]}); setModal('add'); setMsg(''); setMedicineInput({ name:'', dose:'', frequency:'', duration:'' }); };
  const openEdit = (rx) => { setSelected(rx); setForm({...rx}); setModal('edit'); setMsg(''); setMedicineInput({ name:'', dose:'', frequency:'', duration:'' }); };
  const closeModal = () => { setModal(null); setSelected(null); setForm(EMPTY); setMsg(''); setMedicineInput({ name:'', dose:'', frequency:'', duration:'' }); };
  const openView = (rx) => { setViewModal(rx); };
  const closeView = () => { setViewModal(null); };

  const validateForm = () => {
    if (!form.patient) { setMsg('error: Please select a patient'); return false; }
    if (!form.doctor) { setMsg('error: Please select a doctor'); return false; }
    if (form.medicines.length === 0) { setMsg('error: Please add at least one medicine'); return false; }
    return true;
  };

  const addMedicine = () => {
    if (!medicineInput.name || !medicineInput.dose || !medicineInput.frequency || !medicineInput.duration) {
      setMsg('error: Please fill all medicine fields');
      return;
    }
    setForm(f=>({...f, medicines:[...f.medicines, {...medicineInput}]}));
    setMedicineInput({ name:'', dose:'', frequency:'', duration:'' });
    setMsg('');
  };

  const removeMedicine = (idx) => {
    setForm(f=>({...f, medicines:f.medicines.filter((m,i)=>i!==idx)}));
  };

  const handleSave = () => {
    if (!validateForm()) return;
    if (modal === 'add') {
      addPrescription(form);
      setMsg('Prescription created successfully');
      setTimeout(() => { closeModal(); }, 1500);
    } else {
      updatePrescription(selected.id, form);
      setMsg('Prescription updated successfully');
      setTimeout(() => { closeModal(); }, 1500);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this prescription?')) deletePrescription(id);
  };

  const getPatientName = (rxOrAppt) => {
    if (rxOrAppt.patientId) return rxOrAppt.patient;
    if (rxOrAppt.patientId) {
      const patient = patients.find(p => p.id === rxOrAppt.patientId);
      return patient?.name || 'Unknown';
    }
    return 'Unknown';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Prescriptions</h1>
          <p className="page-desc">{prescriptions.filter(p=>p.status==='Active').length} active • {prescriptions.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> New Prescription</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon"/>
          <input placeholder="Search patient or doctor…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {['All','Active','Completed'].map(s=>(
          <button key={s} className={`btn ${filterStatus===s?'btn-primary':'btn-ghost'} btn-sm`} onClick={()=>setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Medicines</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon"><Pill size={48} color="var(--text-muted)"/></div><p>No prescriptions found</p></div></td></tr>}
              {filtered.map(rx=>(
                <tr key={rx.id}>
                  <td style={{ color:'var(--text-muted)', fontSize:11 }}>{rx.id}</td>
                  <td style={{ fontWeight:600, fontSize:13 }}>{rx.patient}</td>
                  <td style={{ color:'var(--text)', fontSize:13 }}>{rx.doctor}</td>
                  <td style={{ fontSize:13 }}>{rx.date}</td>
                  <td style={{ fontSize:13, maxWidth:'300px' }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                      {rx.medicines.slice(0,3).map((m,i)=>(
                        <div key={i} style={{ background:'rgba(59, 130, 246, 0.2)', color:'#60a5fa', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, border:'1px solid rgba(59,130,246,0.4)' }}>
                          <div>{m.name}</div>
                          <div style={{ fontSize:11, opacity:0.9 }}>{m.dose}</div>
                        </div>
                      ))}
                      {rx.medicines.length > 3 && (
                        <div style={{ background:'rgba(100,116,139,0.2)', color:'var(--text-muted)', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, border:'1px solid var(--border)' }}>
                          +{rx.medicines.length-3} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td><Badge status={rx.status}/></td>
                  <td>
                    <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View Details" onClick={()=>openView(rx)}><Eye size={13}/></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(rx)}><Pencil size={13}/></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={()=>handleDelete(rx.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'New Prescription':'Edit Prescription'} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save Prescription</button></>}>
          
          {msg && (
            msg.includes('error') ? (
              <div style={{ background:'rgba(220,38,38,0.1)', color:'#f87171', padding:'10px 12px', borderRadius:6, marginBottom:16, display:'flex', gap:8, border:'1px solid rgba(220,38,38,0.3)' }}>
                <AlertCircle size={16}/>
                {msg.replace('error: ', '')}
              </div>
            ) : (
              <div style={{ background:'rgba(34,197,94,0.1)', color:'#4ade80', padding:'10px 12px', borderRadius:6, marginBottom:16, display:'flex', gap:8, border:'1px solid rgba(34,197,94,0.3)' }}>
                <CheckCircle size={16}/>
                {msg}
              </div>
            )
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><User size={14}/> Patient *</label>
              <select className="form-control" value={form.patient} onChange={e=>{
                const p=patients.find(p=>p.name===e.target.value);
                setForm(f=>({...f,patient:e.target.value,patientId:p?.id||''}));
              }}>
                <option value="">Select patient…</option>
                {patients.map(p=><option key={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Doctor *</label>
              <select className="form-control" value={form.doctor} onChange={e=>{
                const d=doctors.find(d=>d.name===e.target.value);
                setForm(f=>({...f,doctor:e.target.value,doctorId:d?.id||''}));
              }}>
                <option value="">Select doctor…</option>
                {doctors.map(d=><option key={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-control" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option>Active</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}><Pill size={14}/> Medicines *</label>
            
            {form.medicines.length > 0 && (
              <div style={{ background:'var(--bg-card)', borderRadius:6, padding:12, marginBottom:12 }}>
                {form.medicines.map((m,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < form.medicines.length-1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize:12 }}>
                      <div style={{ fontWeight:600 }}>{m.name} - {m.dose}</div>
                      <div style={{ color:'var(--text-muted)' }}>{m.frequency} for {m.duration}</div>
                    </div>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={()=>removeMedicine(i)}><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background:'var(--bg-card)', borderRadius:6, padding:12 }}>
              <div className="form-row" style={{ gap:8, marginBottom:12 }}>
                <input className="form-control" placeholder="Medicine name" value={medicineInput.name} onChange={e=>setMedicineInput(m=>({...m,name:e.target.value}))} style={{ fontSize:12 }}/>
                <input className="form-control" placeholder="Dose (e.g. 500mg)" value={medicineInput.dose} onChange={e=>setMedicineInput(m=>({...m,dose:e.target.value}))} style={{ fontSize:12 }}/>
              </div>
              <div className="form-row" style={{ gap:8, marginBottom:12 }}>
                <input className="form-control" placeholder="Frequency" value={medicineInput.frequency} onChange={e=>setMedicineInput(m=>({...m,frequency:e.target.value}))} style={{ fontSize:12 }}/>
                <input className="form-control" placeholder="Duration" value={medicineInput.duration} onChange={e=>setMedicineInput(m=>({...m,duration:e.target.value}))} style={{ fontSize:12 }}/>
              </div>
              <button className="btn btn-primary btn-sm" onClick={addMedicine}><Plus size={12}/> Add Medicine</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><FileText size={14}/> Instructions</label>
            <textarea className="form-control" rows={3} placeholder="Special instructions or warnings…" value={form.instructions} onChange={e=>setForm(f=>({...f,instructions:e.target.value}))}/>
          </div>
        </Modal>
      )}

      {viewModal && (
        <Modal
          title="Prescription Details"
          onClose={closeView}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeView}>Close</button>
              <button className="btn btn-primary" onClick={()=>{ openEdit(viewModal); closeView(); }}>Edit</button>
            </>
          }
        >
          {/* Info Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20, padding:14, background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)' }}>
            <div>
              <div style={{ color:'var(--text-muted)', fontSize:11, marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Patient</div>
              <div style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{viewModal.patient}</div>
            </div>
            <div>
              <div style={{ color:'var(--text-muted)', fontSize:11, marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Doctor</div>
              <div style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{viewModal.doctor}</div>
            </div>
            <div>
              <div style={{ color:'var(--text-muted)', fontSize:11, marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Date</div>
              <div style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{viewModal.date}</div>
            </div>
            <div>
              <div style={{ color:'var(--text-muted)', fontSize:11, marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Status</div>
              <Badge status={viewModal.status}/>
            </div>
          </div>

          {/* Medicines */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <Pill size={15} color="#3b82f6"/>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>
                Medicines <span style={{ color:'var(--text-muted)', fontWeight:400 }}>({viewModal.medicines.length})</span>
              </span>
            </div>

            {viewModal.medicines.length > 0 ? (
              <div style={{ display:'grid', gap:8 }}>
                {viewModal.medicines.map((m, i) => (
                  <div key={i} style={{ border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', background:'var(--bg)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#60a5fa' }}>{m.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                          Dosage: <span style={{ fontWeight:600, color:'var(--text)' }}>{m.dose}</span>
                        </div>
                      </div>
                      <span style={{ background:'rgba(59,130,246,0.15)', color:'#60a5fa', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, border:'1px solid rgba(59,130,246,0.25)' }}>
                        #{i+1}
                      </span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, paddingTop:8, borderTop:'1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Frequency</div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.frequency}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Duration</div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.duration}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding:16, background:'var(--bg)', borderRadius:8, textAlign:'center', color:'var(--text-muted)', fontSize:13, border:'1px dashed var(--border)' }}>
                No medicines prescribed
              </div>
            )}
          </div>

          {/* Instructions */}
          {viewModal.instructions && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <FileText size={15} color="#f59e0b"/>
                <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Instructions</span>
              </div>
              <div style={{ padding:'12px 14px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)', color:'var(--text)', fontSize:13, lineHeight:'1.7', whiteSpace:'pre-wrap' }}>
                {viewModal.instructions}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}