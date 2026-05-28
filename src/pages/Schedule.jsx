import { useState } from 'react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import { Edit, Save, X, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Schedule() {
  const { doctors, schedules, updateSchedule } = useData();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');

  const handleEditSchedule = (schedule) => {
    setForm({...schedule});
    setModal('edit');
    setMsg('');
  };

  const handleSave = () => {
    if (!form.startTime || !form.endTime) {
      setMsg('error: Please fill in all required fields');
      return;
    }
    updateSchedule(form.id, form);
    setMsg('Schedule updated successfully');
    setTimeout(() => { setModal(null); setForm(null); setMsg(''); }, 1500);
  };

  const closeModal = () => { setModal(null); setForm(null); setMsg(''); };

  const currentSchedule = selectedDoctor ? schedules.find(s => s.doctorId === selectedDoctor) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Doctor Schedules</h1>
          <p className="page-desc">Manage doctor availability and work hours</p>
        </div>
      </div>

      <div className="toolbar">
        <select className="form-control" style={{ maxWidth:'250px' }} value={selectedDoctor||''} onChange={e=>setSelectedDoctor(e.target.value?parseInt(e.target.value):null)}>
          <option value="">Select a doctor…</option>
          {doctors.map(d=><option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
        </select>
      </div>

      {selectedDoctor && currentSchedule ? (
        <div className="card">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:8 }}>Basic Info</div>
              <div style={{ display:'grid', gap:12 }}>
                <div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Doctor</div>
                  <div style={{ fontWeight:600 }}>{currentSchedule.doctorName}</div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Max Patients/Day</div>
                  <div style={{ fontWeight:600 }}>{currentSchedule.maxPatientsPerDay}</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:8 }}>Work Hours</div>
              <div style={{ display:'grid', gap:12 }}>
                <div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Start Time</div>
                  <div style={{ fontWeight:600 }}>{currentSchedule.startTime}</div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>End Time</div>
                  <div style={{ fontWeight:600 }}>{currentSchedule.endTime}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:12 }}>Work Days</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:8 }}>
              {DAYS.map(day=>(
                <div key={day} style={{ 
                  padding:'8px 12px', 
                  borderRadius:6, 
                  background: currentSchedule.workDays.includes(day)?'rgba(76, 175, 80, 0.1)':'var(--bg-card)',
                  border: currentSchedule.workDays.includes(day)?'1px solid #4caf50':'1px solid var(--border)',
                  color: currentSchedule.workDays.includes(day)?'#2e7d32':'var(--text-secondary)',
                  fontSize:12,
                  fontWeight:600,
                  textAlign:'center'
                }}>
                  {day}
                </div>
              ))}
            </div>
          </div>

          {currentSchedule.daysOff.length > 0 && (
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:16, marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--danger)', marginBottom:8 }}>Days Off</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:8 }}>
                {currentSchedule.daysOff.map(day=>(
                  <div key={day} style={{ 
                    padding:'8px 12px', 
                    borderRadius:6, 
                    background:'rgba(220, 38, 38, 0.1)',
                    border:'1px solid #dc2626',
                    color:'#991b1b',
                    fontSize:12,
                    fontWeight:600,
                    textAlign:'center'
                  }}>
                    {day}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:8, marginTop:20 }}>
            <button className="btn btn-primary" onClick={()=>handleEditSchedule(currentSchedule)}><Edit size={14}/> Edit Schedule</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign:'center', padding:40 }}>
          <Calendar size={48} style={{ color:'var(--text-muted)', marginBottom:12 }}/>
          <p>Select a doctor to view their schedule</p>
        </div>
      )}

      {modal === 'edit' && form && (
        <Modal title="Edit Schedule" onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave}><Save size={14}/> Save Changes</button></>}>
          
          {msg && (
            msg.includes('error') ? (
              <div style={{ background:'#fff5f5', color:'#c53030', padding:'10px 12px', borderRadius:6, marginBottom:16, display:'flex', gap:8 }}>
                <AlertCircle size={16}/>
                {msg.replace('error: ', '')}
              </div>
            ) : (
              <div style={{ background:'#f0fdf4', color:'#15803d', padding:'10px 12px', borderRadius:6, marginBottom:16, display:'flex', gap:8 }}>
                <CheckCircle size={16}/>
                {msg}
              </div>
            )
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-control" type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-control" type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Max Patients per Day</label>
            <input className="form-control" type="number" value={form.maxPatientsPerDay} onChange={e=>setForm(f=>({...f,maxPatientsPerDay:parseInt(e.target.value)||0}))}/>
          </div>

          <div className="form-group">
            <label className="form-label">Work Days</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
              {DAYS.map(day=>(
                <label key={day} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px', borderRadius:6, background:'var(--bg-card)' }}>
                  <input type="checkbox" checked={form.workDays.includes(day)} onChange={e=>{
                    if (e.target.checked) {
                      setForm(f=>({...f,workDays:[...f.workDays,day]}));
                    } else {
                      setForm(f=>({...f,workDays:f.workDays.filter(d=>d!==day)}));
                    }
                  }}/>
                  <span style={{ fontSize:12 }}>{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Days Off</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
              {DAYS.map(day=>(
                <label key={day} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px', borderRadius:6, background:'var(--bg-card)' }}>
                  <input type="checkbox" checked={form.daysOff.includes(day)} onChange={e=>{
                    if (e.target.checked) {
                      setForm(f=>({...f,daysOff:[...f.daysOff,day]}));
                    } else {
                      setForm(f=>({...f,daysOff:f.daysOff.filter(d=>d!==day)}));
                    }
                  }}/>
                  <span style={{ fontSize:12 }}>{day}</span>
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
