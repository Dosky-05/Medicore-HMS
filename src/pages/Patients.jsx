import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, UsersRound } from 'lucide-react';

const EMPTY = { name:'', age:'', gender:'Male', blood:'O+', phone:'', email:'', address:'', doctor:'', department:'', condition:'', status:'Outpatient' };

export default function Patients() {
  const { patients, addPatient, updatePatient, deletePatient, doctors } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'view'
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id?.toString().includes(search);
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (p) => { setSelected(p); setForm({ ...p }); setModal('edit'); };
  const openView = (p) => { setSelected(p); setModal('view'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = () => {
    if (modal === 'add') addPatient({ ...form, admitDate: new Date().toISOString().slice(0,10) });
    else updatePatient(selected.id, form);
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this patient record?')) deletePatient(id);
  };

  const avatarColor = (name) => {
    const colors = ['#00d4ff','#6c63ff','#ff6b6b','#00d68f','#ffb830','#f783ac'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Patient Management</h1>
          <p className="page-desc">{patients.length} total patients registered</p>
        </div>
        <button className="btn btn-primary" id="add-patient-btn" onClick={openAdd}>
          <Plus size={15} /> Add Patient
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['All','Admitted','Outpatient','Discharged','Critical'].map(s => (
          <button key={s} className={`btn ${filterStatus===s?'btn-primary':'btn-ghost'} btn-sm`} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th><th>Age/Gender</th><th>Blood</th><th>Department</th>
                <th>Doctor</th><th>Condition</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon"><UsersRound size={48} color="var(--text-muted)" /></div><p>No patients found</p></div></td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div className="avatar" style={{ background:`linear-gradient(135deg,${avatarColor(p.name)},#6c63ff)` }}>
                        {p.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight:600 }}>{p.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.age} / {p.gender}</td>
                  <td><span style={{ color:'var(--danger)', fontWeight:700 }}>{p.blood}</span></td>
                  <td style={{ color:'var(--text-secondary)', fontSize:12 }}>{p.department}</td>
                  <td style={{ fontSize:12 }}>{p.doctor}</td>
                  <td style={{ fontSize:12 }}>{p.condition}</td>
                  <td><Badge status={p.status} /></td>
                  <td>
                    <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => openView(p)}>👁</button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(p)}><Pencil size={13}/></button>
                      <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => handleDelete(p.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Register New Patient' : 'Edit Patient'}
          onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save Patient</button></>}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Age</label><input className="form-control" type="number" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Gender</label>
              <select className="form-control" value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                {['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Blood Type</label>
              <select className="form-control" value={form.blood} onChange={e=>setForm(f=>({...f,blood:e.target.value}))}>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Department</label><input className="form-control" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Assigned Doctor</label>
              <select className="form-control" value={form.doctor} onChange={e=>setForm(f=>({...f,doctor:e.target.value}))}>
                <option value="">Select doctor…</option>
                {doctors.map(d=><option key={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Condition</label><input className="form-control" value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                {['Admitted','Outpatient','Discharged','Critical'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <Modal title="Patient Details" onClose={closeModal} footer={<button className="btn btn-ghost" onClick={closeModal}>Close</button>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['ID', selected.id],['Name', selected.name],['Age', selected.age],['Gender', selected.gender],['Blood Type', selected.blood],['Phone', selected.phone],['Email', selected.email],['Department', selected.department],['Doctor', selected.doctor],['Condition', selected.condition],['Admit Date', selected.admitDate],['Status', selected.status]].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{k}</div>
                <div style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Address</div>
            <div style={{ fontSize:13, color:'var(--text-primary)' }}>{selected.address || '—'}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
