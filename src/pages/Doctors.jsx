import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, Building, CalendarDays, Users, Star, UserRoundX, Mail, Phone, Lock, Eye, EyeOff, Wand2, Copy, CheckCircle } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

const TIME_OPTIONS = [
  '06:00 AM','07:00 AM','08:00 AM','08:30 AM','09:00 AM','09:30 AM',
  '10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM',
  '04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM','24 Hours',
];

const EMPTY = {
  name: '', specialization: '', department: '', phone: '', email: '',
  experience: '', status: 'Active', schedule: 'Mon-Fri', patients: 0, avatar: '', image: '',
};

const EMPTY_SCHED = {
  workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  startTime: '08:00 AM',
  endTime: '05:00 PM',
  maxPatientsPerDay: 8,
  weeksAhead: 4,
};

const AVATARCOLORS = [
  'linear-gradient(135deg,#00d4ff,#0099cc)',
  'linear-gradient(135deg,#6c63ff,#4a43cc)',
  'linear-gradient(135deg,#ff6b6b,#cc4444)',
  'linear-gradient(135deg,#00d68f,#00a86b)',
  'linear-gradient(135deg,#ffb830,#cc8800)',
  'linear-gradient(135deg,#f783ac,#cc5580)',
];

function generateAvailableDays(workDays, weeksAhead = 4) {
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const days = [];
  const today = new Date();
  for (let i = 0; i <= weeksAhead * 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (workDays.includes(dayNames[d.getDay()])) {
      days.push(d.toISOString().slice(0, 10));
    }
  }
  return days;
}

export default function Doctors() {
  const { doctors, addDoctor, updateDoctor, deleteDoctor, departments, schedules, addSchedule, updateSchedule } = useData();
  const { createStaffAccount, isAdmin } = useAuth();

  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [sched, setSched]         = useState(EMPTY_SCHED);
  const [selected, setSelected]   = useState(null);
  const [createLogin, setCreateLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass]   = useState(false);
  const [loginError, setLoginError] = useState('');
  const [copied, setCopied]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    const pick = (s) => s[Math.floor(Math.random() * s.length)];
    const rand = Array.from({ length: 10 }, () => pick(chars));
    rand[0] = pick('ABCDEFGHJKLMNPQRSTUVWXYZ');
    rand[1] = pick('abcdefghjkmnpqrstuvwxyz');
    rand[2] = pick('23456789');
    rand[3] = pick('!@#$%&*');
    for (let i = rand.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rand[i], rand[j]] = [rand[j], rand[i]];
    }
    setLoginForm(f => ({ ...f, password: rand.join('') }));
    setShowPass(true);
  };

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(EMPTY); setSched(EMPTY_SCHED);
    setCreateLogin(false); setLoginForm({ email: '', password: '' });
    setLoginError(''); setShowPass(false); setCopied(false);
    setModal('add');
  };

  const openEdit = (d) => {
    setSelected(d);
    setForm({ ...d });
    const existing = schedules.find(s => s.doctorId === d.id);
    setSched(existing
      ? { workDays: existing.workDays, startTime: existing.startTime, endTime: existing.endTime, maxPatientsPerDay: existing.maxPatientsPerDay, weeksAhead: 4 }
      : EMPTY_SCHED
    );
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setSelected(null); setSaving(false); setLoginError(''); setSaveError(''); };

  const toggleDay = (day) => {
    setSched(s => ({
      ...s,
      workDays: s.workDays.includes(day) ? s.workDays.filter(d => d !== day) : [...s.workDays, day],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.department) return;
    if (createLogin && (!loginForm.email.trim() || loginForm.password.length < 8)) {
      setLoginError('Login email and a password of at least 8 characters are required.');
      return;
    }

    setSaving(true);
    setLoginError('');
    setSaveError('');

    const initials = form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const scheduleLabel = sched.workDays.map(d => DAY_SHORT[d]).join('-');
    const availableDays = generateAvailableDays(sched.workDays, sched.weeksAhead);

    if (modal === 'add') {
      const newId = Date.now();
      const scheduleId = newId + 1;

      // Write to Supabase first so patient portal gets the data cross-device
      const { error: docErr } = await supabase.from('doctors').upsert({
        id: newId, name: form.name, specialization: form.specialization,
        department: form.department, phone: form.phone, email: form.email,
        experience: parseInt(form.experience) || 0, status: form.status,
        schedule_label: scheduleLabel, avatar: initials,
        image: form.image || null, patients_count: parseInt(form.patients) || 0,
      });
      if (docErr) {
        setSaving(false);
        setSaveError('Supabase error (doctors): ' + docErr.message);
        return;
      }

      const { error: schedErr } = await supabase.from('doctor_schedules').upsert({
        id: scheduleId, doctor_id: newId, doctor_name: form.name,
        work_days: sched.workDays, start_time: sched.startTime,
        end_time: sched.endTime, max_patients_per_day: parseInt(sched.maxPatientsPerDay) || 8,
      });
      if (schedErr) {
        setSaving(false);
        setSaveError('Supabase error (schedule): ' + schedErr.message);
        return;
      }

      // localStorage (admin dashboard view)
      addDoctor({ ...form, id: newId, avatar: initials, patients: parseInt(form.patients) || 0, schedule: scheduleLabel });
      addSchedule({ id: scheduleId, doctorId: newId, doctorName: form.name, workDays: sched.workDays, startTime: sched.startTime, endTime: sched.endTime, daysOff: [], availableDays, maxPatientsPerDay: parseInt(sched.maxPatientsPerDay) || 8 });

      if (createLogin) {
        const result = await createStaffAccount({ name: form.name, email: loginForm.email, password: loginForm.password, role: 'doctor', doctor_id: String(newId), department: form.department, phone: form.phone || '' });
        if (!result.success) { setSaving(false); setLoginError(result.error); return; }
      }
    } else {
      const docId = selected.id;

      const { error: docErr } = await supabase.from('doctors').upsert({
        id: docId, name: form.name, specialization: form.specialization,
        department: form.department, phone: form.phone, email: form.email,
        experience: parseInt(form.experience) || 0, status: form.status,
        schedule_label: scheduleLabel, avatar: initials,
        image: form.image || null, patients_count: parseInt(form.patients) || 0,
      });
      if (docErr) {
        setSaving(false);
        setSaveError('Supabase error (doctors): ' + docErr.message);
        return;
      }

      updateDoctor(docId, { ...form, avatar: initials, schedule: scheduleLabel, patients: parseInt(form.patients) || 0 });

      const existing = schedules.find(s => s.doctorId === docId);
      const scheduleId = existing?.id ?? (docId + 1);
      if (existing) {
        updateSchedule(existing.id, { doctorName: form.name, workDays: sched.workDays, startTime: sched.startTime, endTime: sched.endTime, availableDays, maxPatientsPerDay: parseInt(sched.maxPatientsPerDay) || 8 });
      } else {
        addSchedule({ id: scheduleId, doctorId: docId, doctorName: form.name, workDays: sched.workDays, startTime: sched.startTime, endTime: sched.endTime, daysOff: [], availableDays, maxPatientsPerDay: parseInt(sched.maxPatientsPerDay) || 8 });
      }

      const { error: schedErr } = await supabase.from('doctor_schedules').upsert({
        id: scheduleId, doctor_id: docId, doctor_name: form.name,
        work_days: sched.workDays, start_time: sched.startTime,
        end_time: sched.endTime, max_patients_per_day: parseInt(sched.maxPatientsPerDay) || 8,
      });
      if (schedErr) {
        setSaving(false);
        setSaveError('Supabase error (schedule): ' + schedErr.message);
        return;
      }
    }
    setSaving(false);
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this doctor?')) return;
    deleteDoctor(id);
    await supabase.from('doctors').delete().eq('id', id);
  };
  const getGrad = (name) => AVATARCOLORS[(name?.charCodeAt(0) || 0) % AVATARCOLORS.length];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Doctors & Staff</h1>
          <p className="page-desc">{doctors.length} medical staff members</p>
        </div>
        <button className="btn btn-primary" id="add-doctor-btn" onClick={openAdd}><Plus size={15} /> Add Doctor</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input placeholder="Search by name or specialization…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {filtered.map(d => (
          <div key={d.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 4, background: getGrad(d.name) }} />
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 48, height: 48, borderRadius: 12, background: getGrad(d.name), fontSize: 14, overflow: 'hidden' }}>
                    {d.image ? <img src={d.image} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : d.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>{d.specialization}</div>
                  </div>
                </div>
                <Badge status={d.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { icon: <Building size={12} />, label: 'Dept',       value: d.department },
                  { icon: <CalendarDays size={12} />, label: 'Schedule', value: d.schedule },
                  { icon: <Users size={12} />,    label: 'Patients',   value: d.patients },
                  { icon: <Star size={12} />,     label: 'Experience', value: `${d.experience} yrs` },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {stat.icon} {stat.label}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> {d.email}</div>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {d.phone}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(d)}><Pencil size={12} /> Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-icon"><UserRoundX size={48} color="var(--text-muted)" /></div>
            <p>No doctors found</p>
          </div>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Add New Doctor' : 'Edit Doctor Details'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim() || !form.department || saving}>
                {saving ? <span style={{ animation: 'pulse 1s infinite' }}>Saving…</span> : modal === 'add' ? 'Add Doctor' : 'Save Changes'}
              </button>
            </>
          }
        >
          {/* Basic info */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" placeholder="Dr. Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input className="form-control" placeholder="Cardiologist" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">— Select department —</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Experience (years)</label>
              <input className="form-control" type="number" min="0" placeholder="5" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" placeholder="+1-555-000-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="doctor@hospital.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['Active', 'On Leave', 'Inactive'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Patients Treated</label>
              <input className="form-control" type="number" min="0" placeholder="0" value={form.patients} onChange={e => setForm(f => ({ ...f, patients: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Image URL (optional)</label>
              <input className="form-control" placeholder="https://…" value={form.image || ''} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
            </div>
          </div>

          {/* Schedule section */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={14} color="var(--accent)" /> Availability for Patient Booking
            </div>

            <div className="form-group">
              <label className="form-label">Work Days</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {WEEKDAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                      background: sched.workDays.includes(day) ? 'rgba(0,214,143,0.15)' : 'var(--bg-card)',
                      border: `1.5px solid ${sched.workDays.includes(day) ? '#00d68f' : 'var(--border)'}`,
                      color: sched.workDays.includes(day) ? '#00d68f' : 'var(--text-secondary)',
                    }}
                  >
                    {DAY_SHORT[day]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <select className="form-control" value={sched.startTime} onChange={e => setSched(s => ({ ...s, startTime: e.target.value }))}>
                  {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <select className="form-control" value={sched.endTime} onChange={e => setSched(s => ({ ...s, endTime: e.target.value }))}>
                  {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Max Patients / Day</label>
                <input className="form-control" type="number" min="1" max="50" value={sched.maxPatientsPerDay} onChange={e => setSched(s => ({ ...s, maxPatientsPerDay: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Generate availability for</label>
                <select className="form-control" value={sched.weeksAhead} onChange={e => setSched(s => ({ ...s, weeksAhead: parseInt(e.target.value) }))}>
                  {[2, 4, 6, 8, 12].map(w => <option key={w} value={w}>{w} weeks ahead</option>)}
                </select>
              </div>
            </div>
          </div>

          {saveError && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.35)', borderRadius: 8, color: '#ff6b6b', fontSize: 13 }}>
              ⚠ {saveError}
            </div>
          )}

          {/* Login account section — add only, admins only */}
          {modal === 'add' && isAdmin && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: createLogin ? 14 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                  <Lock size={14} color="var(--accent)" /> Create Login Account
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setCreateLogin(l => !l); setLoginError(''); }}
                  style={{
                    padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    background: createLogin ? 'rgba(0,214,143,0.12)' : 'var(--bg-card)',
                    border: `1.5px solid ${createLogin ? '#00d68f' : 'var(--border)'}`,
                    color: createLogin ? '#00d68f' : 'var(--text-secondary)',
                  }}
                >
                  {createLogin ? 'Enabled' : 'Enable'}
                </button>
              </div>

              {createLogin && (
                <>
                  {loginError && (
                    <div className="login-error" style={{ margin: '0 0 14px' }}>⚠ {loginError}</div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Login Email</label>
                      <input
                        className="form-control"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={loginForm.email}
                        onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label className="form-label" style={{ margin: 0 }}>Password</label>
                        <button type="button" onClick={generatePassword}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                          <Wand2 size={11} /> Auto-generate
                        </button>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="form-control"
                          type={showPass ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          value={loginForm.password}
                          onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                          style={{ paddingRight: 68, fontFamily: showPass ? 'monospace' : 'inherit', letterSpacing: showPass ? '0.05em' : 'normal' }}
                        />
                        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                          {loginForm.password && (
                            <button type="button" onClick={() => { navigator.clipboard.writeText(loginForm.password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                              style={{ background: 'none', border: 'none', color: copied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                            </button>
                          )}
                          <button type="button" onClick={() => setShowPass(p => !p)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      {loginForm.password && showPass && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          Share this with the doctor — they can change it after logging in.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
