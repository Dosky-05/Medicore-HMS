import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Settings as SettingsIcon, AlertTriangle, Trash2, CheckCircle, Save, Moon, Sun } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState({ name:'MediCore General Hospital', address:'123 Healthcare Ave, Medical City', phone:'+1-555-MED-CORE', email:'admin@medicore.com', beds:'200', founded:'1985', type:'General Hospital' });
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('hms_theme') || 'dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('hms_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSave = () => {
    localStorage.setItem('hms_hospital', JSON.stringify(hospital));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-heading">Settings</h1><p className="page-desc">Hospital profile and preferences</p></div>
        <button className="btn btn-primary" onClick={handleSave}>{saved ? <><CheckCircle size={15}/> Saved!</> : <><Save size={15}/> Save Changes</>}</button>
      </div>

      <div className="grid-2" style={{ alignItems:'start' }}>
        {/* Hospital Info */}
        <div className="card">
          <div className="card-header"><div className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}><Building2 size={18}/> Hospital Information</div></div>
          <div className="form-group"><label className="form-label">Hospital Name</label><input className="form-control" value={hospital.name} onChange={e=>setHospital(h=>({...h,name:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Type</label>
            <select className="form-control" value={hospital.type} onChange={e=>setHospital(h=>({...h,type:e.target.value}))}>
              {['General Hospital','Specialty Hospital','Teaching Hospital','Clinic','Medical Center'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={hospital.address} onChange={e=>setHospital(h=>({...h,address:e.target.value}))}/></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={hospital.phone} onChange={e=>setHospital(h=>({...h,phone:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={hospital.email} onChange={e=>setHospital(h=>({...h,email:e.target.value}))}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Total Beds</label><input className="form-control" type="number" value={hospital.beds} onChange={e=>setHospital(h=>({...h,beds:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Founded Year</label><input className="form-control" type="number" value={hospital.founded} onChange={e=>setHospital(h=>({...h,founded:e.target.value}))}/></div>
          </div>
        </div>

        {/* Profile + System Info */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div className="card-header"><div className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}><User size={18}/> Current User</div></div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#00d4ff,#6c63ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'white' }}>{user?.avatar}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{user?.name}</div>
                <div style={{ fontSize:12, color:'var(--accent)', marginTop:2 }}>{user?.role}</div>
              </div>
            </div>
            <div style={{ background:'var(--bg-card)', borderRadius:10, padding:12 }}>
              {[['Username', user?.username || '—'], ['Role', user?.role], ['Access Level', user?.role === 'Admin' ? 'Full Access' : 'Limited']].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}><SettingsIcon size={18}/> System Info</div></div>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {[
                ['Version','MediCore HMS v1.0'],
                ['Storage','localStorage (browser)'],
                ['Theme', <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>{theme === 'dark' ? <Moon size={14}/> : <Sun size={14}/>} {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</button>],
                ['Framework','React 19 + Vite 8'],
                ['Status',<><CheckCircle size={14} style={{verticalAlign:'middle',marginRight:4}}/>All systems operational</>]
              ].map(([k,v], i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontWeight:500, color: k==='Status'?'var(--success)':'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background:'rgba(255,77,109,0.06)', border:'1px solid rgba(255,77,109,0.2)' }}>
            <div className="card-title" style={{ color:'var(--danger)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><AlertTriangle size={18}/> Danger Zone</div>
            <p style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:12 }}>This will clear all data and reset to defaults. This cannot be undone.</p>
            <button className="btn btn-danger btn-sm" onClick={()=>{ if(window.confirm('Reset ALL data? This cannot be undone!')) { ['hms_patients','hms_doctors','hms_appointments','hms_invoices','hms_records','hms_pharmacy','hms_departments'].forEach(k=>localStorage.removeItem(k)); window.location.reload(); } }}>
              <Trash2 size={14}/> Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
