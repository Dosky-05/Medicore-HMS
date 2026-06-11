import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../supabaseClient';
import {
  Building2, User, Settings as SettingsIcon, AlertTriangle, Trash2,
  CheckCircle, Save, Moon, Sun, Users, Plus, X, Eye, EyeOff,
  ShieldCheck, UserCog, RefreshCw, UserX, UserCheck, Wand2, Copy, KeyRound,
} from 'lucide-react';

const ROLES = ['admin', 'nurse', 'receptionist'];
const ALL_ROLES = ['admin', 'doctor', 'nurse', 'receptionist']; // for display only

const ROLE_META = {
  admin:        { color: '#6c63ff', label: 'Admin',        desc: 'Full access to all features and data' },
  doctor:       { color: '#00d4ff', label: 'Doctor',       desc: 'Own patients, appointments & records' },
  nurse:        { color: '#00d68f', label: 'Nurse',        desc: 'Patients, appointments, records (no delete)' },
  receptionist: { color: '#ffb830', label: 'Receptionist', desc: 'Patient admissions, room management & appointments' },
};

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'doctor',
  doctor_id: '', department: '', phone: '',
};

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || { color: '#8892a4', label: role };
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: `${meta.color}18`, color: meta.color,
    }}>
      {meta.label}
    </span>
  );
}

export default function Settings() {
  const { user, profile, createStaffAccount, createPatientAccount, deactivateStaff, reactivateStaff, deactivatePatient, reactivatePatient, resetStaffPassword, isAdmin } = useAuth();
  const { departments, doctors } = useData();

  const [tab, setTab]       = useState('hospital');
  const [hospital, setHospital] = useState({
    name: 'MediCore General Hospital', address: '123 Healthcare Ave, Medical City',
    phone: '+1-555-MED-CORE', email: 'admin@medicore.com',
    beds: '200', founded: '1985', type: 'General Hospital',
  });
  const [saved, setSaved]   = useState(false);
  const [theme, setTheme]   = useState(localStorage.getItem('hms_theme') || 'dark');

  // ── Staff tab state ──────────────────────────────────────
  const [staffList, setStaffList]       = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [showPass, setShowPass]         = useState(false);
  const [formError, setFormError]       = useState('');
  const [formSuccess, setFormSuccess]   = useState('');
  const [creating, setCreating]         = useState(false);
  const [copied, setCopied]             = useState(false);
  const [resetTarget, setResetTarget]   = useState(null);   // staff or patient being reset
  const [resetPwd, setResetPwd]         = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError]     = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // ── Patient tab state ────────────────────────────────────
  const EMPTY_PATIENT_FORM = { name: '', email: '', password: '', phone: '', age: '', gender: '', blood_type: '', department: '' };
  const [patientList, setPatientList]           = useState([]);
  const [patientLoading, setPatientLoading]     = useState(false);
  const [showPatientForm, setShowPatientForm]   = useState(false);
  const [patientForm, setPatientForm]           = useState(EMPTY_PATIENT_FORM);
  const [showPatientPass, setShowPatientPass]   = useState(false);
  const [patientFormError, setPatientFormError] = useState('');
  const [patientFormSuccess, setPatientFormSuccess] = useState('');
  const [creatingPatient, setCreatingPatient]   = useState(false);
  const [patientCopied, setPatientCopied]       = useState(false);

  // ── Change password state ────────────────────────────────
  const [pwForm, setPwForm]       = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw]       = useState({ current: false, next: false, confirm: false });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!pwForm.current)              { setPwError('Enter your current password.');              return; }
    if (pwForm.next.length < 8)       { setPwError('New password must be at least 8 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match.');              return; }
    if (pwForm.current === pwForm.next) { setPwError('New password must be different from current.'); return; }

    setPwLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pwForm.current,
    });
    if (signInError) {
      setPwLoading(false);
      setPwError('Current password is incorrect.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess('Password updated successfully.');
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSuccess(''), 4000);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    if (resetPwd.length < 8) { setResetError('Password must be at least 8 characters.'); return; }
    setResetLoading(true);
    const result = await resetStaffPassword(resetTarget.id, resetPwd);
    setResetLoading(false);
    if (!result.success) {
      setResetError(result.error);
    } else {
      setResetSuccess(`Password reset for ${resetTarget.name}.`);
      setResetTarget(null);
      setResetPwd('');
      setTimeout(() => setResetSuccess(''), 4000);
    }
  };

  const loadPatients = async () => {
    setPatientLoading(true);
    const { data } = await supabase
      .from('patient_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setPatientList(data || []);
    setPatientLoading(false);
  };

  const generatePatientPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ', lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789', special = '!@#$%&*';
    const all = upper + lower + digits + special;
    const pick = (s) => s[Math.floor(Math.random() * s.length)];
    const rand = Array.from({ length: 8 }, () => pick(all));
    rand[0] = pick(upper); rand[1] = pick(lower); rand[2] = pick(digits); rand[3] = pick(special);
    for (let i = rand.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rand[i], rand[j]] = [rand[j], rand[i]];
    }
    setPatientForm(f => ({ ...f, password: rand.join('') }));
    setShowPatientPass(true);
  };

  const copyPatientPassword = () => {
    if (!patientForm.password) return;
    navigator.clipboard.writeText(patientForm.password);
    setPatientCopied(true);
    setTimeout(() => setPatientCopied(false), 2000);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setPatientFormError('');
    if (!patientForm.name.trim())        { setPatientFormError('Name is required.');                        return; }
    if (!patientForm.email.trim())       { setPatientFormError('Email is required.');                       return; }
    if (patientForm.password.length < 8) { setPatientFormError('Password must be at least 8 characters.'); return; }
    setCreatingPatient(true);
    const result = await createPatientAccount({
      name:       patientForm.name,
      email:      patientForm.email,
      password:   patientForm.password,
      phone:      patientForm.phone      || null,
      age:        patientForm.age        ? parseInt(patientForm.age) : null,
      gender:     patientForm.gender     || null,
      blood_type: patientForm.blood_type || null,
      department: patientForm.department || null,
      status:     'Outpatient',
    });
    setCreatingPatient(false);
    if (!result.success) {
      setPatientFormError(result.error);
    } else {
      setPatientFormSuccess(`Portal account created for ${patientForm.name}.`);
      setPatientForm(EMPTY_PATIENT_FORM);
      setShowPatientForm(false);
      loadPatients();
      setTimeout(() => setPatientFormSuccess(''), 4000);
    }
  };

  const handleTogglePatientActive = async (p) => {
    const fn = p.is_active ? deactivatePatient : reactivatePatient;
    await fn(p.id);
    loadPatients();
  };

  const generatePassword = () => {
    const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower   = 'abcdefghjkmnpqrstuvwxyz';
    const digits  = '23456789';
    const special = '!@#$%&*';
    const all     = upper + lower + digits + special;
    // Guarantee at least one of each category
    const pick = (str) => str[Math.floor(Math.random() * str.length)];
    const rand = Array.from({ length: 8 }, () => pick(all));
    rand[0] = pick(upper);
    rand[1] = pick(lower);
    rand[2] = pick(digits);
    rand[3] = pick(special);
    // Shuffle
    for (let i = rand.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rand[i], rand[j]] = [rand[j], rand[i]];
    }
    const pwd = rand.join('');
    setForm(f => ({ ...f, password: pwd }));
    setShowPass(true);
  };

  const copyPassword = () => {
    if (!form.password) return;
    navigator.clipboard.writeText(form.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTheme = () => {
    const t = theme === 'dark' ? 'light' : 'dark';
    setTheme(t);
    localStorage.setItem('hms_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  const handleSave = () => {
    localStorage.setItem('hms_hospital', JSON.stringify(hospital));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const loadStaff = async () => {
    setStaffLoading(true);
    const { data } = await supabase
      .from('staff_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setStaffList(data || []);
    setStaffLoading(false);
  };

  useEffect(() => {
    if (tab === 'staff'    && isAdmin) loadStaff();
    if (tab === 'patients' && isAdmin) loadPatients();
  }, [tab, isAdmin]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim())     { setFormError('Name is required.');     return; }
    if (!form.email.trim())    { setFormError('Email is required.');    return; }
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    if (form.role === 'doctor' && !form.doctor_id) { setFormError('Please select which doctor record to link.'); return; }

    setCreating(true);
    const result = await createStaffAccount(form);
    setCreating(false);

    if (!result.success) {
      setFormError(result.error);
    } else {
      setFormSuccess(`Account created for ${form.name}.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadStaff();
      setTimeout(() => setFormSuccess(''), 4000);
    }
  };

  const handleToggleActive = async (staff) => {
    const fn = staff.is_active ? deactivateStaff : reactivateStaff;
    await fn(staff.id);
    loadStaff();
  };

  const TABS = [
    { key: 'hospital',  label: 'Hospital',         icon: Building2 },
    ...(isAdmin ? [{ key: 'staff',    label: 'Staff Accounts',   icon: Users   }] : []),
    ...(isAdmin ? [{ key: 'patients', label: 'Patient Accounts', icon: UserCog }] : []),
    { key: 'system',    label: 'System',            icon: SettingsIcon },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-heading">Settings</h1><p className="page-desc">Hospital profile and preferences</p></div>
        {tab === 'hospital' && (
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
          </button>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="modal-overlay" onClick={() => { setResetTarget(null); setResetPwd(''); setResetError(''); }}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <KeyRound size={16} color="var(--accent)" />
                <span className="modal-title">Reset Password</span>
              </div>
              <button className="modal-close" onClick={() => { setResetTarget(null); setResetPwd(''); setResetError(''); }}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Set a new temporary password for <strong style={{ color: 'var(--text-primary)' }}>{resetTarget.name}</strong>.
                Share it with them so they can log in and change it.
              </p>
              {resetError && <div className="login-error" style={{ marginBottom: 12 }}>⚠ {resetError}</div>}
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Min. 8 characters"
                      value={resetPwd}
                      onChange={e => setResetPwd(e.target.value)}
                      style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: 0, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setResetTarget(null); setResetPwd(''); setResetError(''); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                    {resetLoading ? 'Resetting…' : <><KeyRound size={14} /> Reset Password</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 18px', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.2s', marginBottom: -1,
            }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Hospital Tab ── */}
      {tab === 'hospital' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} /> Hospital Information
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Hospital Name</label>
            <input className="form-control" value={hospital.name} onChange={e => setHospital(h => ({ ...h, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-control" value={hospital.type} onChange={e => setHospital(h => ({ ...h, type: e.target.value }))}>
              {['General Hospital', 'Specialty Hospital', 'Teaching Hospital', 'Clinic', 'Medical Center'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-control" value={hospital.address} onChange={e => setHospital(h => ({ ...h, address: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={hospital.phone} onChange={e => setHospital(h => ({ ...h, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={hospital.email} onChange={e => setHospital(h => ({ ...h, email: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Beds</label>
              <input className="form-control" type="number" value={hospital.beds} onChange={e => setHospital(h => ({ ...h, beds: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Founded Year</label>
              <input className="form-control" type="number" value={hospital.founded} onChange={e => setHospital(h => ({ ...h, founded: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {/* ── Staff Accounts Tab ── */}
      {tab === 'staff' && isAdmin && (
        <div>
          {formSuccess  && <div className="login-success" style={{ marginBottom: 16 }}><CheckCircle size={14} /> {formSuccess}</div>}
          {resetSuccess && <div className="login-success" style={{ marginBottom: 16 }}><CheckCircle size={14} /> {resetSuccess}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {staffList.length} staff account{staffList.length !== 1 ? 's' : ''} registered
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={loadStaff}>
                <RefreshCw size={13} /> Refresh
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setFormError(''); }}>
                <Plus size={13} /> Add Staff Member
              </button>
            </div>
          </div>

          {/* Add Staff Form */}
          {showForm && (
            <div className="card" style={{ marginBottom: 20, borderColor: 'var(--border-hover)' }}>
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} /> New Staff Account
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setFormError(''); setForm(EMPTY_FORM); }}>
                  <X size={13} />
                </button>
              </div>

              {formError && (
                <div className="login-error" style={{ margin: '0 0 16px' }}>⚠ {formError}</div>
              )}

              <form onSubmit={handleCreateStaff}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" placeholder="Dr. Jane Smith" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-control" type="email" placeholder="jane@hospital.com" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ margin: 0 }}>Temporary Password</label>
                      <button type="button" onClick={generatePassword}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                        <Wand2 size={12} /> Auto-generate
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type={showPass ? 'text' : 'password'}
                        placeholder="Type or auto-generate…"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        style={{ paddingRight: 70, fontFamily: showPass ? 'monospace' : 'inherit', letterSpacing: showPass ? '0.05em' : 'normal' }}
                      />
                      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                        {form.password && (
                          <button type="button" onClick={copyPassword} title="Copy password"
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
                    {form.password && showPass && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                        Share this password with the staff member — they can change it after logging in.
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-control" value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value, doctor_id: '' }))}>
                      {ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_META[r].label} — {ROLE_META[r].desc}</option>
                      ))}
                    </select>
                  </div>
                </div>


                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-control" value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                      <option value="">— Optional —</option>
                      {departments.map(d => <option key={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone (optional)</label>
                    <input className="form-control" placeholder="+1-555-000-0000" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(''); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating
                      ? <span style={{ animation: 'pulse 1s infinite' }}>Creating…</span>
                      : <><Plus size={14} /> Create Account</>
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff List */}
          <div className="card">
            <div className="table-wrap">
              {staffLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading staff accounts…
                </div>
              ) : staffList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Users size={40} /></div>
                  <p>No staff accounts found. Create the first one above.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map(s => (
                      <tr key={s.id} style={{ opacity: s.is_active ? 1 : 0.5 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{
                              background: `${ROLE_META[s.role]?.color || '#888'}22`,
                              color: ROLE_META[s.role]?.color || '#888',
                              fontSize: 11,
                            }}>
                              {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><RoleBadge role={s.role} /></td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.department || '—'}</td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: s.is_active ? 'rgba(0,214,143,0.12)' : 'rgba(255,77,109,0.12)',
                            color: s.is_active ? 'var(--success)' : 'var(--danger)',
                          }}>
                            {s.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              title="Reset password"
                              onClick={() => { setResetTarget(s); setResetPwd(''); setResetError(''); }}
                              style={{ color: 'var(--accent)' }}
                            >
                              <KeyRound size={14} />
                            </button>
                            {s.id !== user?.id && (
                              <button
                                className="btn btn-ghost btn-sm btn-icon"
                                title={s.is_active ? 'Deactivate account' : 'Reactivate account'}
                                onClick={() => handleToggleActive(s)}
                                style={{ color: s.is_active ? 'var(--danger)' : 'var(--success)' }}
                              >
                                {s.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Role legend */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} /> Role Permissions
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {ALL_ROLES.map(r => (
                <div key={r} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: `${ROLE_META[r].color}0d`, border: `1px solid ${ROLE_META[r].color}22`,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: ROLE_META[r].color, marginBottom: 4 }}>
                    {ROLE_META[r].label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {ROLE_META[r].desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Patient Accounts Tab ── */}
      {tab === 'patients' && isAdmin && (
        <div>
          {patientFormSuccess && <div className="login-success" style={{ marginBottom: 16 }}><CheckCircle size={14} /> {patientFormSuccess}</div>}
          {resetSuccess       && <div className="login-success" style={{ marginBottom: 16 }}><CheckCircle size={14} /> {resetSuccess}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {patientList.length} patient portal account{patientList.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={loadPatients}>
                <RefreshCw size={13} /> Refresh
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowPatientForm(true); setPatientFormError(''); }}>
                <Plus size={13} /> Add Patient Account
              </button>
            </div>
          </div>

          {/* Add Patient Form */}
          {showPatientForm && (
            <div className="card" style={{ marginBottom: 20, borderColor: 'var(--border-hover)' }}>
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} /> New Patient Portal Account
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowPatientForm(false); setPatientFormError(''); setPatientForm(EMPTY_PATIENT_FORM); }}>
                  <X size={13} />
                </button>
              </div>

              {patientFormError && <div className="login-error" style={{ margin: '0 0 16px' }}>⚠ {patientFormError}</div>}

              <form onSubmit={handleCreatePatient}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" placeholder="John Smith" value={patientForm.name}
                      onChange={e => setPatientForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-control" type="email" placeholder="patient@email.com" value={patientForm.email}
                      onChange={e => setPatientForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ margin: 0 }}>Temporary Password</label>
                      <button type="button" onClick={generatePatientPassword}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                        <Wand2 size={12} /> Auto-generate
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type={showPatientPass ? 'text' : 'password'}
                        placeholder="Type or auto-generate…"
                        value={patientForm.password}
                        onChange={e => setPatientForm(f => ({ ...f, password: e.target.value }))}
                        style={{ paddingRight: 70, fontFamily: showPatientPass ? 'monospace' : 'inherit', letterSpacing: showPatientPass ? '0.05em' : 'normal' }}
                      />
                      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                        {patientForm.password && (
                          <button type="button" onClick={copyPatientPassword} title="Copy password"
                            style={{ background: 'none', border: 'none', color: patientCopied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                            {patientCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                          </button>
                        )}
                        <button type="button" onClick={() => setShowPatientPass(p => !p)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                          {showPatientPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone (optional)</label>
                    <input className="form-control" placeholder="+1-555-000-0000" value={patientForm.phone}
                      onChange={e => setPatientForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Age (optional)</label>
                    <input className="form-control" type="number" min="0" max="150" placeholder="35" value={patientForm.age}
                      onChange={e => setPatientForm(f => ({ ...f, age: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender (optional)</label>
                    <select className="form-control" value={patientForm.gender}
                      onChange={e => setPatientForm(f => ({ ...f, gender: e.target.value }))}>
                      <option value="">— Select —</option>
                      {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Blood Type (optional)</label>
                    <select className="form-control" value={patientForm.blood_type}
                      onChange={e => setPatientForm(f => ({ ...f, blood_type: e.target.value }))}>
                      <option value="">— Select —</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department (optional)</label>
                    <select className="form-control" value={patientForm.department}
                      onChange={e => setPatientForm(f => ({ ...f, department: e.target.value }))}>
                      <option value="">— Optional —</option>
                      {departments.map(d => <option key={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowPatientForm(false); setPatientForm(EMPTY_PATIENT_FORM); setPatientFormError(''); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creatingPatient}>
                    {creatingPatient
                      ? <span style={{ animation: 'pulse 1s infinite' }}>Creating…</span>
                      : <><Plus size={14} /> Create Account</>
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Patient List */}
          <div className="card">
            <div className="table-wrap">
              {patientLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading patient accounts…
                </div>
              ) : patientList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><UserCog size={40} /></div>
                  <p>No patient portal accounts yet. Create the first one above.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Blood Type</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientList.map(p => (
                      <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.5 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ background: 'rgba(0,214,143,0.15)', color: '#00d68f', fontSize: 11 }}>
                              {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.department || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.blood_type || '—'}</td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: p.is_active ? 'rgba(0,214,143,0.12)' : 'rgba(255,77,109,0.12)',
                            color: p.is_active ? 'var(--success)' : 'var(--danger)',
                          }}>
                            {p.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              title="Reset password"
                              onClick={() => { setResetTarget(p); setResetPwd(''); setResetError(''); }}
                              style={{ color: 'var(--accent)' }}
                            >
                              <KeyRound size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              title={p.is_active ? 'Deactivate account' : 'Reactivate account'}
                              onClick={() => handleTogglePatientActive(p)}
                              style={{ color: p.is_active ? 'var(--danger)' : 'var(--success)' }}
                            >
                              {p.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── System Tab ── */}
      {tab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} /> Current User
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${ROLE_META[profile?.role]?.color || '#00d4ff'}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: ROLE_META[profile?.role]?.color || '#00d4ff',
              }}>
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{profile?.name || user?.email?.split('@')[0] || 'User'}</div>
                <RoleBadge role={profile?.role || 'admin'} />
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 12 }}>
              {[
                ['Email', user?.email || '—'],
                ['Role', ROLE_META[profile?.role]?.label || '—'],
                ['Department', profile?.department || '—'],
                ['Account Status', profile?.is_active !== false ? 'Active' : 'Deactivated'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Change Password ── */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={18} /> Change Password
              </div>
            </div>

            {pwError   && <div className="login-error"   style={{ margin: '0 0 16px' }}>⚠ {pwError}</div>}
            {pwSuccess && <div className="login-success" style={{ marginBottom: 16 }}><CheckCircle size={14} /> {pwSuccess}</div>}

            <form onSubmit={handleChangePassword}>
              {[
                { field: 'current', label: 'Current Password' },
                { field: 'next',    label: 'New Password' },
                { field: 'confirm', label: 'Confirm New Password' },
              ].map(({ field, label }) => (
                <div className="form-group" key={field}>
                  <label className="form-label">{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type={showPw[field] ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={pwForm[field]}
                      onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      {showPw[field] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                  {pwLoading ? 'Updating…' : <><Save size={14} /> Update Password</>}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SettingsIcon size={18} /> System Info
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ['Version', 'MediCore HMS v1.0'],
                ['Auth', 'Supabase'],
                ['Theme', (
                  <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
                    {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                    {theme === 'dark' ? ' Dark Mode' : ' Light Mode'}
                  </button>
                )],
                ['Framework', 'React 19 + Vite 8'],
                ['Status', <><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />All systems operational</>],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontWeight: 500, color: k === 'Status' ? 'var(--success)' : 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="card" style={{ background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.2)' }}>
              <div className="card-title" style={{ color: 'var(--danger)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> Danger Zone
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Clear all local data and reset to defaults. This cannot be undone.
              </p>
              <button className="btn btn-danger btn-sm" onClick={() => {
                if (window.confirm('Reset ALL local data? This cannot be undone!')) {
                  ['hms_patients', 'hms_doctors', 'hms_appointments', 'hms_invoices',
                    'hms_records', 'hms_pharmacy', 'hms_departments'].forEach(k => localStorage.removeItem(k));
                  window.location.reload();
                }
              }}>
                <Trash2 size={14} /> Reset All Data
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
