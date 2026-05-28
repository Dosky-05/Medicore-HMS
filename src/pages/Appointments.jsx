import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, CalendarDays, Clock, User, Stethoscope, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const EMPTY = { patient:'', patientId:'', doctor:'', doctorId:'', department:'', date:'', time:'', type:'Consultation', status:'Scheduled', notes:'', cancellationReason:'' };
const TIME_SLOTS = ['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];

export default function Appointments() {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, patients, doctors } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Get unique departments
  const departments = [...new Set(doctors.map(d => d.department))];

  // Get available time slots (exclude booked times)
  const getAvailableSlots = (date, selectedDoctor) => {
    if (!date || !selectedDoctor) return TIME_SLOTS;
    const booked = appointments
      .filter(a => a.date === date && a.doctor === selectedDoctor && a.status !== 'Cancelled')
      .map(a => a.time);
    return TIME_SLOTS.filter(t => !booked.includes(t));
  };

  // Get doctors by department
  const getDoctorsByDept = (dept) => {
    if (!dept || dept === 'All') return doctors;
    return doctors.filter(d => d.department === dept);
  };

  const filtered = appointments.filter(a => {
    const matchS = a.patient.toLowerCase().includes(search.toLowerCase()) || a.doctor.toLowerCase().includes(search.toLowerCase());
    const matchF = filterStatus === 'All' || a.status === filterStatus;
    const matchD = filterDept === 'All' || a.department === filterDept;
    return matchS && matchF && matchD;
  });

  const openAdd = () => { setForm(EMPTY); setModal('add'); setFormError(''); setSuccessMsg(''); };
  const openEdit = (a) => { setSelected(a); setForm({...a}); setModal('edit'); setFormError(''); setSuccessMsg(''); };
  const closeModal = () => { setModal(null); setSelected(null); setForm(EMPTY); setFormError(''); };

  const validateForm = () => {
    if (!form.patient) { setFormError('Please select a patient'); return false; }
    if (!form.doctor) { setFormError('Please select a doctor'); return false; }
    if (!form.date) { setFormError('Please select an appointment date'); return false; }
    if (!form.time) { setFormError('Please select an appointment time'); return false; }
    const today = new Date().toISOString().split('T')[0];
    if (form.date < today) { setFormError('Cannot book appointments in the past'); return false; }
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    if (modal === 'add') {
      addAppointment(form);
      setSuccessMsg('Appointment booked successfully!');
      setTimeout(() => { closeModal(); }, 1500);
    } else {
      updateAppointment(selected.id, form);
      setSuccessMsg('Appointment updated successfully!');
      setTimeout(() => { closeModal(); }, 1500);
    }
  };

  const getPatientAllergies = () => {
    if (!form.patient) return [];
    const patient = patients.find(p => p.name === form.patient);
    return patient?.allergies || [];
  };

  const handleDelete = (id) => { 
    if (window.confirm('Cancel this appointment?')) deleteAppointment(id); 
  };

  const statusColor = { Scheduled:'var(--warning)', Completed:'var(--success)', Cancelled:'var(--danger)' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Appointments</h1>
          <p className="page-desc">{appointments.filter(a=>a.status==='Scheduled').length} upcoming • {appointments.length} total</p>
        </div>
        <button className="btn btn-primary" id="add-appt-btn" onClick={openAdd}><Plus size={15}/> Book Appointment</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon"/>
          <input placeholder="Search patient or doctor…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {['All','Scheduled','Completed','Cancelled'].map(s=>(
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
              <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon"><CalendarDays size={48} color="var(--text-muted)"/></div><p>No appointments found</p></div></td></tr>}
              {filtered.map(a=>(
                <tr key={a.id}>
                  <td style={{ color:'var(--text-muted)', fontSize:11 }}>{a.id}</td>
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
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(a)}><Pencil size={13}/></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={()=>handleDelete(a.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'Book New Appointment':'Edit Appointment'} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save Appointment</button></>}>
          
          {formError && <div style={{ background:'#fff5f5', color:'#c53030', padding:'10px 12px', borderRadius:6, marginBottom:16, display:'flex', gap:8, alignItems:'center' }}><AlertCircle size={16}/>{formError}</div>}
          {successMsg && <div style={{ background:'#f0fdf4', color:'#15803d', padding:'10px 12px', borderRadius:6, marginBottom:16, display:'flex', gap:8, alignItems:'center' }}><CheckCircle size={16}/>{successMsg}</div>}
          
          {getPatientAllergies().length > 0 && (
            <div style={{ background:'#fef3c7', border:'1px solid #fcd34d', color:'#92400e', padding:'12px 14px', borderRadius:6, marginBottom:16, display:'flex', gap:8 }}>
              <AlertCircle size={18} style={{ flexShrink:0 }}/>
              <div>
                <strong>⚠️ Patient Allergies:</strong>
                <div style={{ marginTop:6, fontSize:13 }}>{getPatientAllergies().join(', ')}</div>
              </div>
            </div>
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
              <label className="form-label"><Stethoscope size={14}/> Doctor *</label>
              <select className="form-control" value={form.doctor} onChange={e=>{
                const d=doctors.find(d=>d.name===e.target.value);
                setForm(f=>({...f,doctor:e.target.value,doctorId:d?.id||'',department:d?.department||f.department}));
              }}>
                <option value="">Select doctor…</option>
                {doctors.filter(d => d.status === 'Active').map(d=><option key={d.id}>{d.name} ({d.department})</option>)}
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
              {form.date && form.doctor && getAvailableSlots(form.date, form.doctor).length === 0 && <small style={{ color:'var(--danger)', marginTop:4, display:'block' }}>No available slots for this date & doctor</small>}
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
                {['Scheduled','Completed','Cancelled'].map(s=><option key={s}>{s}</option>)}
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
        </Modal>
      )}
    </div>
  );
}
