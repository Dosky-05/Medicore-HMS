import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, Building, CalendarDays, Users, Star, UserRoundX, Mail, Phone } from 'lucide-react';

const EMPTY = { name: '', specialization: '', department: '', phone: '', email: '', experience: '', status: 'Active', schedule: 'Mon-Fri', patients: 0, avatar: '', image: '' };

const AVATARCOLORS = ['linear-gradient(135deg,#00d4ff,#0099cc)', 'linear-gradient(135deg,#6c63ff,#4a43cc)', 'linear-gradient(135deg,#ff6b6b,#cc4444)', 'linear-gradient(135deg,#00d68f,#00a86b)', 'linear-gradient(135deg,#ffb830,#cc8800)', 'linear-gradient(135deg,#f783ac,#cc5580)'];

export default function Doctors() {
  const { doctors, addDoctor, updateDoctor, deleteDoctor } = useData();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (d) => { setSelected(d); setForm({ ...d }); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = () => {
    const initials = form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (modal === 'add') addDoctor({ ...form, avatar: initials, patients: parseInt(form.patients) || 0 });
    else updateDoctor(selected.id, { ...form, avatar: initials });
    closeModal();
  };

  const handleDelete = (id) => { if (window.confirm('Remove this doctor?')) deleteDoctor(id); };

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

      {/* Doctor Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {filtered.map(d => (
          <div key={d.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Card top accent */}
            <div style={{ height: 4, background: getGrad(d.name) }} />
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 48, height: 48, borderRadius: 12, background: getGrad(d.name), fontSize: 14, overflow: 'hidden' }}>
                    {d.image ? (
                      <img src={d.image} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      d.avatar
                    )}
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
                  { icon: <Building size={12} />, label: 'Dept', value: d.department },
                  { icon: <CalendarDays size={12} />, label: 'Schedule', value: d.schedule },
                  { icon: <Users size={12} />, label: 'Patients', value: d.patients },
                  { icon: <Star size={12} />, label: 'Experience', value: `${d.experience} yrs` },
                ].map((stat) => (
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
          <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="empty-icon"><UserRoundX size={48} color="var(--text-muted)" /></div><p>No doctors found</p></div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add New Doctor' : 'Edit Doctor Details'} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save Doctor</button></>}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Specialization</label><input className="form-control" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Image URL</label><input className="form-control" placeholder="https://example.com/image.jpg" value={form.image || ''} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Department</label><input className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Experience (years)</label><input className="form-control" type="number" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Schedule</label><input className="form-control" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['Active', 'On Leave', 'Inactive'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
