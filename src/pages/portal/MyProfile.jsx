import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { User, IdCard, Phone, Mail, MapPin, Droplets, AlertTriangle, CalendarDays, Stethoscope, Pencil, CheckCircle, X, Plus, Save } from 'lucide-react';

export default function MyProfile({ patient }) {
  const { user, refreshProfile } = useAuth();

  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');
  const [phone,     setPhone]     = useState(patient?.phone    || '');
  const [address,   setAddress]   = useState(patient?.address  || '');
  const [allergies, setAllergies] = useState(patient?.allergies || []);
  const [allergyInput, setAllergyInput] = useState('');

  if (!patient) return <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>No patient profile found.</div>;

  const startEdit = () => {
    setPhone(patient.phone || '');
    setAddress(patient.address || '');
    setAllergies(patient.allergies || []);
    setAllergyInput('');
    setSaveMsg('');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setSaveMsg(''); };

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (val && !allergies.includes(val)) setAllergies(prev => [...prev, val]);
    setAllergyInput('');
  };

  const removeAllergy = (a) => setAllergies(prev => prev.filter(x => x !== a));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('patient_profiles')
      .update({ phone: phone.trim(), address: address.trim(), allergies })
      .eq('id', user.id);
    setSaving(false);
    if (error) { setSaveMsg('Error: ' + error.message); return; }
    await refreshProfile();
    setSaveMsg('Saved!');
    setTimeout(() => { setEditing(false); setSaveMsg(''); }, 1000);
  };

  const info = [
    { icon: IdCard,      label: 'Full Name',  value: patient.name },
    { icon: CalendarDays,label: 'Age',        value: `${patient.age} years` },
    { icon: User,        label: 'Gender',     value: patient.gender },
    { icon: Droplets,    label: 'Blood Type', value: patient.blood_type },
    { icon: Mail,        label: 'Email',      value: patient.email },
    { icon: Stethoscope, label: 'Doctor',     value: patient.doctor },
    { icon: CalendarDays,label: 'Admitted',   value: patient.admit_date || '—' },
  ];

  const statusColor = { Admitted:'#00d68f', Critical:'#ff4d6d', Outpatient:'#ffb830', Discharged:'var(--text-muted)' };

  return (
    <div>
      <div className="portal-profile-header">
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>My Profile</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:14 }}>Your personal and medical information</p>
        </div>
        {!editing && (
          <button onClick={startEdit} className="portal-profile-edit-btn">
            <Pencil size={14}/>
            <span className="portal-profile-edit-label">Edit Profile</span>
          </button>
        )}
        {editing && (
          <div className="portal-profile-actions">
            <button onClick={cancelEdit} className="portal-profile-cancel-btn">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="portal-profile-save-btn" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : <><Save size={13}/> Save Changes</>}
            </button>
          </div>
        )}
      </div>

      {saveMsg && (
        <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:8, background: saveMsg.startsWith('Error') ? 'rgba(255,77,109,0.1)' : 'rgba(0,214,143,0.1)', border:`1px solid ${saveMsg.startsWith('Error') ? 'rgba(255,77,109,0.3)' : 'rgba(0,214,143,0.3)'}`, color: saveMsg.startsWith('Error') ? '#ff4d6d' : '#00d68f', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
          <CheckCircle size={14}/> {saveMsg}
        </div>
      )}

      {/* Avatar card */}
      <div className="card" style={{ marginBottom:20, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ width:72, height:72, borderRadius:18, flexShrink:0, background:'rgba(0,214,143,0.12)', border:'1px solid rgba(0,214,143,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#00d68f' }}>
          {patient.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>{patient.name}</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:3 }}>
            Patient ID: {patient.id} &nbsp;·&nbsp; {patient.department}
          </div>
          <div style={{ marginTop:8 }}>
            <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:`${statusColor[patient.status] || '#00d4ff'}18`, color: statusColor[patient.status] || '#00d4ff', border:`1px solid ${statusColor[patient.status] || '#00d4ff'}30` }}>{patient.status}</span>
            <span style={{ marginLeft:8, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:'rgba(255,77,109,0.1)', color:'#ff4d6d', border:'1px solid rgba(255,77,109,0.25)' }}>Blood: {patient.blood_type || '—'}</span>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
        {/* Personal Info */}
        <div className="card">
          <div className="card-header"><div className="card-title">Personal Information</div></div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {info.map((row, i) => {
              const Icon = row.icon;
              return (
                <div key={row.label} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'12px 0', borderBottom: i < info.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'rgba(0,214,143,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={14} color="#00d68f"/>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, letterSpacing:'0.05em', marginBottom:2 }}>{row.label}</div>
                    <div style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{row.value || '—'}</div>
                  </div>
                </div>
              );
            })}

            {/* Editable: Phone */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(0,214,143,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Phone size={14} color="#00d68f"/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, letterSpacing:'0.05em', marginBottom:4 }}>Phone</div>
                {editing
                  ? <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" style={{ width:'100%', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 10px', color:'var(--text-primary)', fontSize:13 }}/>
                  : <div style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{patient.phone || '—'}</div>
                }
              </div>
            </div>

            {/* Editable: Address */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'12px 0' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(0,214,143,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <MapPin size={14} color="#00d68f"/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, letterSpacing:'0.05em', marginBottom:4 }}>Address</div>
                {editing
                  ? <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City" style={{ width:'100%', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 10px', color:'var(--text-primary)', fontSize:13 }}/>
                  : <div style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{patient.address || '—'}</div>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Current Condition</div></div>
            <div style={{ padding:'14px 16px', borderRadius:10, background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.2)' }}>
              <div style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)', marginBottom:4 }}>{patient.condition || 'No condition recorded'}</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Under care of {patient.doctor}</div>
            </div>
          </div>

          {/* Allergies */}
          <div className="card" style={{ flex:1 }}>
            <div className="card-header">
              <div className="card-title" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <AlertTriangle size={14} color="#ffb830"/> Allergies
              </div>
              {!editing && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Click "Edit Profile" to update</div>}
            </div>

            {editing ? (
              <div>
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <input
                    value={allergyInput}
                    onChange={e => setAllergyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                    placeholder="Type allergy and press Enter…"
                    style={{ flex:1, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 10px', color:'var(--text-primary)', fontSize:13 }}
                  />
                  <button onClick={addAllergy} style={{ background:'rgba(0,214,143,0.12)', border:'1px solid rgba(0,214,143,0.3)', color:'#00d68f', borderRadius:6, padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}>
                    <Plus size={12}/> Add
                  </button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {allergies.length === 0 && <div style={{ fontSize:13, color:'var(--text-muted)', fontStyle:'italic' }}>No allergies added</div>}
                  {allergies.map(a => (
                    <span key={a} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:20, fontSize:12, fontWeight:600, background:'rgba(255,77,109,0.1)', color:'#ff4d6d', border:'1px solid rgba(255,77,109,0.2)' }}>
                      {a}
                      <button onClick={() => removeAllergy(a)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ff4d6d', padding:0, display:'flex', lineHeight:1 }}>
                        <X size={11}/>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              allergies.length > 0
                ? <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {allergies.map(a => (
                      <span key={a} style={{ padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:'rgba(255,77,109,0.1)', color:'#ff4d6d', border:'1px solid rgba(255,77,109,0.2)' }}>{a}</span>
                    ))}
                  </div>
                : <div style={{ fontSize:13, color:'var(--text-muted)', fontStyle:'italic' }}>No known allergies</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
