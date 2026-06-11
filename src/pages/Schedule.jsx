import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import { Edit, Save, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function normalize(row) {
  return {
    id:                row.id,
    doctorId:          row.doctor_id,
    doctorName:        row.doctor_name,
    workDays:          row.work_days    || [],
    daysOff:           row.days_off     || [],
    startTime:         row.start_time   || '08:00 AM',
    endTime:           row.end_time     || '05:00 PM',
    maxPatientsPerDay: row.max_patients_per_day || 8,
  };
}

export default function Schedule() {
  const { profile } = useAuth();

  const [schedules,      setSchedules]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modal,          setModal]          = useState(null);
  const [form,           setForm]           = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [msg,            setMsg]            = useState('');

  const isDoctor = profile?.role === 'doctor';

  // doctor_id in staff_profiles is stored as text — parse it directly
  const myDoctorId = useMemo(() => {
    if (!isDoctor || !profile?.doctor_id) return null;
    return Number(profile.doctor_id);
  }, [isDoctor, profile]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('doctor_schedules')
      .select('*')
      .order('id');
    setSchedules((data || []).map(normalize));
    setLoading(false);
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // Auto-select own schedule when logged in as a doctor
  useEffect(() => {
    if (myDoctorId !== null) setSelectedDoctor(myDoctorId);
  }, [myDoctorId]);

  const currentSchedule = useMemo(
    () => schedules.find(s => String(s.doctorId) === String(selectedDoctor)) || null,
    [schedules, selectedDoctor]
  );

  const openEdit = () => {
    if (!currentSchedule) return;
    setForm({ ...currentSchedule, workDays: [...currentSchedule.workDays], daysOff: [...currentSchedule.daysOff] });
    setMsg('');
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setForm(null); setMsg(''); setSaving(false); };

  const handleSave = async () => {
    if (!form.startTime || !form.endTime) {
      setMsg('error:Please fill in start and end time');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('doctor_schedules')
      .update({
        work_days:            form.workDays,
        days_off:             form.daysOff,
        start_time:           form.startTime,
        end_time:             form.endTime,
        max_patients_per_day: form.maxPatientsPerDay,
      })
      .eq('id', form.id);
    setSaving(false);
    if (error) { setMsg('error:' + error.message); return; }
    await fetchSchedules();
    setMsg('Schedule updated successfully');
    setTimeout(() => closeModal(), 1400);
  };

  const toggleDay = (field, day) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(day)
        ? f[field].filter(d => d !== day)
        : [...f[field], day],
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Doctor Schedules</h1>
          <p className="page-desc">Manage doctor availability and work hours</p>
        </div>
      </div>

      {/* Doctor selector — hidden for doctors (they see only their own) */}
      {!isDoctor && (
        <div className="toolbar">
          <select
            className="form-control"
            style={{ maxWidth: 250 }}
            value={selectedDoctor || ''}
            onChange={e => setSelectedDoctor(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select a doctor…</option>
            {schedules.map(s => (
              <option key={s.doctorId} value={s.doctorId}>{s.doctorName}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading schedules…</p>
        </div>
      ) : selectedDoctor && currentSchedule ? (
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Basic Info</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Doctor</div>
                  <div style={{ fontWeight: 600 }}>{currentSchedule.doctorName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Max Patients / Day</div>
                  <div style={{ fontWeight: 600 }}>{currentSchedule.maxPatientsPerDay}</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Work Hours</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Start Time</div>
                  <div style={{ fontWeight: 600 }}>{currentSchedule.startTime}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>End Time</div>
                  <div style={{ fontWeight: 600 }}>{currentSchedule.endTime}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Work Days</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
              {DAYS.map(day => {
                const active = currentSchedule.workDays.includes(day);
                return (
                  <div key={day} style={{
                    padding: '8px 12px', borderRadius: 6, textAlign: 'center',
                    fontSize: 12, fontWeight: 600,
                    background: active ? 'rgba(0,214,143,0.1)' : 'var(--bg-card)',
                    border: `1px solid ${active ? 'rgba(0,214,143,0.35)' : 'var(--border)'}`,
                    color: active ? '#00d68f' : 'var(--text-secondary)',
                  }}>{day}</div>
                );
              })}
            </div>
          </div>

          {currentSchedule.daysOff.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>Days Off</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                {currentSchedule.daysOff.map(day => (
                  <div key={day} style={{
                    padding: '8px 12px', borderRadius: 6, textAlign: 'center',
                    fontSize: 12, fontWeight: 600,
                    background: 'rgba(255,77,109,0.1)',
                    border: '1px solid rgba(255,77,109,0.3)',
                    color: '#ff4d6d',
                  }}>{day}</div>
                ))}
              </div>
            </div>
          )}

          {(profile?.role === 'admin' || profile?.role === 'doctor') && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={openEdit}><Edit size={14}/> Edit Schedule</button>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }}/>
          <p>{isDoctor ? 'Your schedule is not set up yet.' : 'Select a doctor to view their schedule'}</p>
        </div>
      )}

      {modal === 'edit' && form && (
        <Modal
          title="Edit Schedule"
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={14}/> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          }
        >
          {msg && (
            msg.startsWith('error:') ? (
              <div style={{ background: 'rgba(255,77,109,0.08)', color: '#ff4d6d', padding: '10px 12px', borderRadius: 6, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={15}/> {msg.replace('error:', '')}
              </div>
            ) : (
              <div style={{ background: 'rgba(0,214,143,0.08)', color: '#00d68f', padding: '10px 12px', borderRadius: 6, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <CheckCircle size={15}/> {msg}
              </div>
            )
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-control" type="time" value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-control" type="time" value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Max Patients per Day</label>
            <input className="form-control" type="number" min={1} max={50} value={form.maxPatientsPerDay}
              onChange={e => setForm(f => ({ ...f, maxPatientsPerDay: parseInt(e.target.value) || 0 }))}/>
          </div>

          <div className="form-group">
            <label className="form-label">Work Days</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {DAYS.map(day => (
                <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 8, borderRadius: 6, background: 'var(--bg-card)', border: `1px solid ${form.workDays.includes(day) ? 'rgba(0,214,143,0.35)' : 'var(--border)'}` }}>
                  <input type="checkbox" checked={form.workDays.includes(day)}
                    onChange={() => toggleDay('workDays', day)} style={{ accentColor: '#00d68f' }}/>
                  <span style={{ fontSize: 12 }}>{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Days Off</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {DAYS.map(day => (
                <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 8, borderRadius: 6, background: 'var(--bg-card)', border: `1px solid ${form.daysOff.includes(day) ? 'rgba(255,77,109,0.3)' : 'var(--border)'}` }}>
                  <input type="checkbox" checked={form.daysOff.includes(day)}
                    onChange={() => toggleDay('daysOff', day)} style={{ accentColor: '#ff4d6d' }}/>
                  <span style={{ fontSize: 12 }}>{day}</span>
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
