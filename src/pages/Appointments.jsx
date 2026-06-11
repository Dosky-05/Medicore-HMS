import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, CalendarDays, Clock, User, Stethoscope, FileText, AlertCircle, CheckCircle, Smartphone, Pill } from 'lucide-react';

const EMPTY = { patient:'', patientId:'', doctor:'', doctorId:'', department:'', date:'', time:'', type:'Consultation', status:'Scheduled', notes:'', cancellationReason:'' };
const TIME_SLOTS = ['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];

export default function Appointments() {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, patients, doctors } = useData();
  const { profile, canDelete } = useAuth();

  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDept, setFilterDept]   = useState('All');
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [selected, setSelected]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formError, setFormError]     = useState('');
  const [successMsg, setSuccessMsg]   = useState('');

  // Prescription modal state
  const [rxModal,    setRxModal]    = useState(false);
  const [rxAppt,     setRxAppt]     = useState(null);
  const [rxExisting, setRxExisting] = useState(null);
  const [rxForm,     setRxForm]     = useState({ medicines: [{ name: '', dose: '', frequency: '', duration: '' }], instructions: '', status: 'Active' });
  const [rxSaving,   setRxSaving]   = useState(false);
  const [rxError,    setRxError]    = useState('');

  // Portal appointments from Supabase
  const [portalAppts, setPortalAppts] = useState([]);

  const fetchPortal = useCallback(async () => {
    const { data } = await supabase
      .from('portal_appointments')
      .select('*')
      .order('date', { ascending: true });
    setPortalAppts(data || []);
  }, []);

  useEffect(() => { fetchPortal(); }, [fetchPortal]);

  const role = profile?.role || 'admin';

  const myDoctorName = useMemo(() => {
    if (role !== 'doctor') return null;
    const rec = doctors.find(d => String(d.id) === String(profile?.doctor_id));
    return rec?.name || profile?.name || null;
  }, [role, profile, doctors]);

  const canAdd = role !== 'doctor';

  const departments = [...new Set(doctors.map(d => d.department))];

  const getAvailableSlots = (date, selectedDoctor) => {
    if (!date || !selectedDoctor) return TIME_SLOTS;
    const booked = appointments
      .filter(a => a.date === date && a.doctor === selectedDoctor && a.status !== 'Cancelled')
      .map(a => a.time);
    return TIME_SLOTS.filter(t => !booked.includes(t));
  };

  // Normalize portal appointments to the same shape as local ones
  const normalizedPortal = portalAppts.map(a => ({
    id: a.id,
    patient: a.patient_name,
    patientId: a.patient_id,
    doctor: a.doctor,
    doctorId: a.doctor_id,
    department: a.department,
    date: a.date,
    time: a.time,
    type: a.type || 'Consultation',
    status: a.status,
    notes: a.notes || '',
    cancellationReason: '',
    source: 'portal',
  }));

  const matchesFilters = (a) => {
    const matchS = a.patient.toLowerCase().includes(search.toLowerCase()) || a.doctor.toLowerCase().includes(search.toLowerCase());
    const matchF = filterStatus === 'All' || a.status === filterStatus;
    const matchD = filterDept === 'All' || a.department === filterDept;
    const matchDoctor = !myDoctorName || a.doctor === myDoctorName;
    return matchS && matchF && matchD && matchDoctor;
  };

  const filteredLocal  = appointments.filter(matchesFilters);
  const filteredPortal = normalizedPortal.filter(matchesFilters);

  // Merge and sort by date ascending, portal bookings first within same date
  const allFiltered = [...filteredPortal, ...filteredLocal].sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });

  const totalScheduled = [...appointments, ...normalizedPortal].filter(a => a.status === 'Scheduled').length;

  const openAdd  = () => { setForm(EMPTY); setModal('add'); setFormError(''); setSuccessMsg(''); };
  const openEdit = (a) => { setSelected(a); setForm({ ...a }); setModal('edit'); setFormError(''); setSuccessMsg(''); };
  const closeModal = () => { setModal(null); setSelected(null); setForm(EMPTY); setFormError(''); };

  const validateForm = () => {
    if (!form.patient) { setFormError('Please select a patient'); return false; }
    if (!form.doctor)  { setFormError('Please select a doctor');  return false; }
    if (!form.date)    { setFormError('Please select an appointment date'); return false; }
    if (!form.time)    { setFormError('Please select an appointment time'); return false; }
    const today = new Date().toISOString().split('T')[0];
    if (form.date < today) { setFormError('Cannot book appointments in the past'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (selected?.source === 'portal') {
      // Update portal appointment in Supabase
      const { error } = await supabase
        .from('portal_appointments')
        .update({ status: form.status, notes: form.notes || null, type: form.type })
        .eq('id', selected.id);
      if (error) { setFormError(error.message); return; }
      await fetchPortal();
      setSuccessMsg('Appointment updated!');
      setTimeout(() => closeModal(), 1200);
    } else if (modal === 'add') {
      addAppointment(form);
      setSuccessMsg('Appointment booked successfully!');
      setTimeout(() => closeModal(), 1500);
    } else {
      updateAppointment(selected.id, form);
      setSuccessMsg('Appointment updated successfully!');
      setTimeout(() => closeModal(), 1500);
    }
  };

  const quickConfirm = async (appt) => {
    await supabase.from('portal_appointments').update({ status: 'Confirmed' }).eq('id', appt.id);
    await fetchPortal();
  };

  const getPatientAllergies = () => {
    if (!form.patient) return [];
    const patient = patients.find(p => p.name === form.patient);
    return patient?.allergies || [];
  };

  const handleDelete = async () => {
    if (deleteTarget.source === 'portal') {
      await supabase.from('portal_appointments').delete().eq('id', deleteTarget.id);
      setPortalAppts(prev => prev.filter(a => a.id !== deleteTarget.id));
    } else {
      deleteAppointment(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const openPrescribe = async (appt) => {
    setRxAppt(appt);
    setRxError('');
    setRxSaving(false);
    let existing = null;
    if (appt.source === 'portal') {
      const { data } = await supabase.from('prescriptions').select('*').eq('appointment_id', appt.id).maybeSingle();
      existing = data;
    }
    setRxExisting(existing);
    const blank = { medicines: [{ name: '', dose: '', frequency: '', duration: '' }], instructions: '', status: 'Active' };
    setRxForm(existing
      ? { medicines: existing.medicines?.length ? existing.medicines : blank.medicines, instructions: existing.instructions || '', status: existing.status || 'Active' }
      : blank
    );
    setRxModal(true);
  };

  const handleRxSave = async () => {
    const validMeds = rxForm.medicines.filter(m => m.name.trim());
    if (!validMeds.length) { setRxError('Add at least one medicine name'); return; }
    setRxSaving(true);
    setRxError('');
    const payload = {
      appointment_id: rxAppt.source === 'portal' ? rxAppt.id : null,
      patient_id: rxAppt.source === 'portal' ? rxAppt.patientId : null,
      patient_name: rxAppt.patient,
      doctor_name: rxAppt.doctor,
      department: rxAppt.department || '',
      date: rxAppt.date,
      medicines: validMeds,
      instructions: rxForm.instructions || null,
      status: rxForm.status,
    };
    const { error } = rxExisting
      ? await supabase.from('prescriptions').update(payload).eq('id', rxExisting.id)
      : await supabase.from('prescriptions').insert(payload);
    setRxSaving(false);
    if (error) { setRxError(error.message); return; }
    setRxModal(false);
  };

  const updateMed = (i, field, val) => setRxForm(f => ({ ...f, medicines: f.medicines.map((m, idx) => idx === i ? { ...m, [field]: val } : m) }));
  const addMed    = () => setRxForm(f => ({ ...f, medicines: [...f.medicines, { name: '', dose: '', frequency: '', duration: '' }] }));
  const removeMed = (i) => setRxForm(f => ({ ...f, medicines: f.medicines.length > 1 ? f.medicines.filter((_, idx) => idx !== i) : f.medicines }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Appointments</h1>
          <p className="page-desc">{totalScheduled} upcoming • {appointments.length + normalizedPortal.length} total</p>
        </div>
        {canAdd && <button className="btn btn-primary" id="add-appt-btn" onClick={openAdd}><Plus size={15}/> Book Appointment</button>}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon"/>
          <input placeholder="Search patient or doctor…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {['All','Scheduled','Confirmed','Completed','Cancelled'].map(s=>(
          <button key={s} className={`btn ${filterStatus===s?'btn-primary':'btn-ghost'} btn-sm`} onClick={()=>setFilterStatus(s)}>{s}</button>
        ))}
        <select className="form-control" style={{ width:'auto', maxWidth:'150px' }} value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
          <option value="All">All Departments</option>
          {departments.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th><th>Patient</th><th>Doctor</th><th>Department</th>
                <th>Date</th><th>Time</th><th>Type</th><th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allFiltered.length === 0 && (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-icon"><CalendarDays size={48} color="var(--text-muted)"/></div>
                    <p>No appointments found</p>
                  </div>
                </td></tr>
              )}
              {allFiltered.map(a => (
                <tr key={a.id}>
                  <td>
                    {a.source === 'portal' ? (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(0,214,143,0.12)', color:'#00d68f', padding:'3px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                        <Smartphone size={10}/> Portal
                      </span>
                    ) : (
                      <span style={{ background:'rgba(108,99,255,0.12)', color:'#6c63ff', padding:'3px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                        Staff
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight:600 }}>{a.patient}</td>
                  <td style={{ color:'var(--text-secondary)', fontSize:12 }}>{a.doctor}</td>
                  <td style={{ fontSize:12 }}>{a.department}</td>
                  <td style={{ color:'var(--accent)', fontSize:12 }}>{a.date}</td>
                  <td style={{ fontSize:12 }}>{a.time}</td>
                  <td>
                    <span style={{ background:'rgba(108,99,255,0.15)', color:'#6c63ff', padding:'3px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>{a.type}</span>
                  </td>
                  <td><Badge status={a.status}/></td>
                  <td>
                    <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                      {a.source === 'portal' && a.status === 'Scheduled' && (
                        <button
                          className="btn btn-sm"
                          style={{ background:'rgba(0,214,143,0.12)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.3)', fontSize:11, padding:'3px 10px', borderRadius:6, cursor:'pointer', fontWeight:600 }}
                          onClick={() => quickConfirm(a)}
                          title="Confirm this booking"
                        >
                          Confirm
                        </button>
                      )}
                      {a.status === 'Completed' && (role === 'doctor' || role === 'admin') && (
                        <button
                          className="btn btn-sm"
                          style={{ background:'rgba(108,99,255,0.12)', color:'#6c63ff', border:'1px solid rgba(108,99,255,0.3)', fontSize:11, padding:'3px 10px', borderRadius:6, cursor:'pointer', fontWeight:600, display:'inline-flex', alignItems:'center', gap:4 }}
                          onClick={() => openPrescribe(a)}
                          title="Write prescription"
                        >
                          <Pill size={11}/> Rx
                        </button>
                      )}
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(a)}><Pencil size={13}/></button>
                      {canDelete && <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteTarget(a)}><Trash2 size={13}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && (
        <Modal
          title={deleteTarget.source === 'portal' ? 'Cancel Portal Booking' : 'Cancel Appointment'}
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Keep It</button>
              <button className="btn btn-danger" onClick={handleDelete}>Yes, Cancel</button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Cancel the appointment for <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.patient}</strong> with{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.doctor}</strong> on {deleteTarget.date} at {deleteTarget.time}?
          </p>
        </Modal>
      )}

      {rxModal && (
        <Modal
          title={rxExisting ? 'Update Prescription' : 'Write Prescription'}
          onClose={() => setRxModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setRxModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRxSave} disabled={rxSaving}>
                {rxSaving ? 'Saving…' : rxExisting ? 'Update Rx' : 'Issue Prescription'}
              </button>
            </>
          }
        >
          {rxError && <div className="login-error"><AlertCircle size={15}/> {rxError}</div>}

          <div style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px 14px', marginBottom:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px' }}>
            {[
              { label:'Patient',    value: rxAppt?.patient },
              { label:'Doctor',     value: rxAppt?.doctor },
              { label:'Date',       value: rxAppt?.date },
              { label:'Department', value: rxAppt?.department },
            ].map(r => (
              <div key={r.label}>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:1 }}>{r.label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{r.value}</div>
              </div>
            ))}
          </div>

          <div className="form-group" style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label className="form-label" style={{ margin:0 }}><Pill size={14}/> Medicines *</label>
              <button type="button" onClick={addMed} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:12, cursor:'pointer', fontWeight:600, padding:0 }}>+ Add Medicine</button>
            </div>
            <div className="rx-med-header rx-med-row">
              {['Name','Dose','Frequency','Duration',''].map(h => (
                <div key={h} style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</div>
              ))}
            </div>
            {rxForm.medicines.map((med, i) => (
              <div key={i} className="rx-med-row" style={{ marginBottom:6 }}>
                <input className="form-control" placeholder="e.g. Amoxicillin" value={med.name}      onChange={e=>updateMed(i,'name',e.target.value)}      style={{ fontSize:12 }}/>
                <input className="form-control" placeholder="500mg"            value={med.dose}      onChange={e=>updateMed(i,'dose',e.target.value)}      style={{ fontSize:12 }}/>
                <input className="form-control" placeholder="3× daily"         value={med.frequency} onChange={e=>updateMed(i,'frequency',e.target.value)} style={{ fontSize:12 }}/>
                <input className="form-control" placeholder="7 days"           value={med.duration}  onChange={e=>updateMed(i,'duration',e.target.value)}  style={{ fontSize:12 }}/>
                <button type="button" onClick={()=>removeMed(i)} disabled={rxForm.medicines.length===1} style={{ background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.25)', color:'#ff4757', borderRadius:6, width:28, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor: rxForm.medicines.length===1 ? 'not-allowed' : 'pointer', fontSize:16, opacity: rxForm.medicines.length===1 ? 0.4 : 1 }}>×</button>
              </div>
            ))}
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex:2 }}>
              <label className="form-label"><FileText size={14}/> Instructions</label>
              <textarea className="form-control" rows={2} placeholder="Take with food, avoid alcohol, complete full course…" value={rxForm.instructions} onChange={e=>setRxForm(f=>({...f,instructions:e.target.value}))} style={{ resize:'vertical', fontSize:13 }}/>
            </div>
            <div className="form-group" style={{ flex:1 }}>
              <label className="form-label">Status</label>
              <select className="form-control" value={rxForm.status} onChange={e=>setRxForm(f=>({...f,status:e.target.value}))}>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {(modal==='add' || modal==='edit') && (
        <Modal
          title={modal==='add' ? 'Book New Appointment' : selected?.source === 'portal' ? 'Portal Booking' : 'Edit Appointment'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {selected?.source === 'portal' ? 'Update Booking' : 'Save Appointment'}
              </button>
            </>
          }
        >
          {formError  && <div className="login-error"  ><AlertCircle size={15}/> {formError}</div>}
          {successMsg && <div className="login-success"><CheckCircle size={15}/> {successMsg}</div>}

          {selected?.source === 'portal' && (
            <div style={{ background:'rgba(0,214,143,0.06)', border:'1px solid rgba(0,214,143,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'var(--text-secondary)', display:'flex', gap:8, alignItems:'center' }}>
              <Smartphone size={14} color="#00d68f"/>
              This appointment was booked by the patient via the portal. You can update its status or add notes.
            </div>
          )}

          {getPatientAllergies().length > 0 && (
            <div style={{ background:'#fef3c7', border:'1px solid #fcd34d', color:'#92400e', padding:'12px 14px', borderRadius:6, marginBottom:16, display:'flex', gap:8 }}>
              <AlertCircle size={18} style={{ flexShrink:0 }}/>
              <div>
                <strong>⚠️ Patient Allergies:</strong>
                <div style={{ marginTop:6, fontSize:13 }}>{getPatientAllergies().join(', ')}</div>
              </div>
            </div>
          )}

          {/* For portal appointments: show read-only info, only allow status/notes edit */}
          {selected?.source === 'portal' ? (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16, background:'var(--bg-card)', borderRadius:8, padding:'12px 14px' }}>
                {[
                  { label:'Patient',    value: form.patient },
                  { label:'Doctor',     value: form.doctor },
                  { label:'Department', value: form.department },
                  { label:'Date',       value: form.date },
                  { label:'Time',       value: form.time },
                  { label:'Type',       value: form.type },
                ].map(r => (
                  <div key={r.label}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{r.label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{r.value}</div>
                  </div>
                ))}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {['Scheduled','Confirmed','Completed','Cancelled'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><FileText size={14}/> Staff Notes</label>
                <textarea className="form-control" rows={3} placeholder="Add notes or instructions…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ resize:'vertical' }}/>
              </div>
            </>
          ) : (
            <>
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
                  <label className="form-label"><Stethoscope size={14}/> Doctor *</label>
                  <select className="form-control" value={form.doctor} onChange={e=>{
                    const d=doctors.find(d=>d.name===e.target.value);
                    setForm(f=>({...f,doctor:e.target.value,doctorId:d?.id||'',department:d?.department||f.department}));
                  }}>
                    <option value="">Select doctor…</option>
                    {doctors.filter(d=>d.status==='Active').map(d=><option key={d.id}>{d.name} ({d.department})</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><CalendarDays size={14}/> Date *</label>
                  <input className="form-control" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label"><Clock size={14}/> Time Slot *</label>
                  <select className="form-control" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}>
                    <option value="">Select time…</option>
                    {getAvailableSlots(form.date, form.doctor).map(t=><option key={t}>{t}</option>)}
                  </select>
                  {form.date && form.doctor && getAvailableSlots(form.date, form.doctor).length===0 && (
                    <small style={{ color:'var(--danger)', marginTop:4, display:'block' }}>No available slots for this date & doctor</small>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Appointment Type</label>
                  <select className="form-control" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {['Consultation','Follow-up','Emergency','Check-up','Procedure','Vaccination','Lab Test'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {['Scheduled','Confirmed','Completed','Cancelled'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {form.status === 'Cancelled' && (
                <div className="form-group">
                  <label className="form-label">Cancellation Reason</label>
                  <textarea className="form-control" rows={2} placeholder="Why is this appointment being cancelled?" value={form.cancellationReason} onChange={e=>setForm(f=>({...f,cancellationReason:e.target.value}))}/>
                </div>
              )}

              <div className="form-group">
                <label className="form-label"><FileText size={14}/> Notes</label>
                <textarea className="form-control" rows={3} placeholder="Any special notes or instructions…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
