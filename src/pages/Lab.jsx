import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, FlaskConical, Clock, CheckCircle, RefreshCw } from 'lucide-react';

const TEST_TYPES = ['Hematology', 'Biochemistry', 'Microbiology', 'Urinalysis', 'Radiology', 'Cardiology', 'Pathology', 'Immunology', 'Other'];
const PRIORITIES = ['Normal', 'Urgent', 'STAT'];
const STATUSES   = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

const EMPTY_FORM = {
  patient_name: '', ordered_by: '', department: '',
  test_name: '', test_type: 'Hematology',
  ordered_date: new Date().toISOString().split('T')[0],
  priority: 'Normal', status: 'Pending',
  results: '', notes: '',
};

const STATUS_COLOR = {
  'Pending':     '#ffb830',
  'In Progress': '#00d4ff',
  'Completed':   '#00d68f',
  'Cancelled':   '#ff4d6d',
};

const TYPE_COLOR = {
  'Hematology':   '#ff6b6b',
  'Biochemistry': '#74c0fc',
  'Microbiology': '#69db7c',
  'Urinalysis':   '#ffa94d',
  'Radiology':    '#cc5de8',
  'Cardiology':   '#f783ac',
  'Pathology':    '#a9e34b',
  'Immunology':   '#00d4ff',
  'Other':        '#a0aec0',
};

export default function Lab() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [selected,     setSelected]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('lab_orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchS = o.patient_name.toLowerCase().includes(q) ||
                   o.test_name.toLowerCase().includes(q) ||
                   o.ordered_by.toLowerCase().includes(q);
    const matchF = filterStatus === 'All' || o.status === filterStatus;
    return matchS && matchF;
  });

  const openAdd  = ()  => {
    setForm({ ...EMPTY_FORM, ordered_date: new Date().toISOString().split('T')[0] });
    setError('');
    setModal('add');
  };
  const openEdit = (o) => {
    setSelected(o);
    setForm({
      patient_name: o.patient_name,
      ordered_by:   o.ordered_by,
      department:   o.department  || '',
      test_name:    o.test_name,
      test_type:    o.test_type,
      ordered_date: o.ordered_date,
      priority:     o.priority,
      status:       o.status,
      results:      o.results || '',
      notes:        o.notes   || '',
    });
    setError('');
    setModal('edit');
  };
  const openDel    = (o) => { setSelected(o); setModal('delete'); };
  const closeModal = ()  => { setModal(null); setSelected(null); setError(''); };

  const handleSave = async () => {
    if (!form.patient_name.trim() || !form.test_name.trim() || !form.ordered_by.trim()) {
      setError('Patient name, test name and ordered by are required.');
      return;
    }
    setSaving(true);
    setError('');

    // Resolve portal patient UUID so they can see this in the portal
    let patient_id = null;
    const { data: pp } = await supabase
      .from('patient_profiles')
      .select('id')
      .ilike('name', form.patient_name.trim())
      .maybeSingle();
    if (pp) patient_id = pp.id;

    const payload = {
      patient_id,
      patient_name: form.patient_name.trim(),
      ordered_by:   form.ordered_by.trim(),
      department:   form.department.trim() || null,
      test_name:    form.test_name.trim(),
      test_type:    form.test_type,
      ordered_date: form.ordered_date,
      priority:     form.priority,
      status:       form.status,
      results:      form.results.trim() || null,
      notes:        form.notes.trim()   || null,
    };

    let err;
    if (modal === 'add') {
      ({ error: err } = await supabase.from('lab_orders').insert(payload));
    } else {
      ({ error: err } = await supabase.from('lab_orders').update(payload).eq('id', selected.id));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    closeModal();
    fetchOrders();
  };

  const handleDelete = async () => {
    setSaving(true);
    await supabase.from('lab_orders').delete().eq('id', selected.id);
    setSaving(false);
    closeModal();
    fetchOrders();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Laboratory</h1>
          <p className="page-desc">Lab test orders and results</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> New Order</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Orders',  value: orders.length,                                          color: '#00d4ff', icon: <FlaskConical size={22}/> },
          { label: 'Pending',       value: orders.filter(o => o.status === 'Pending').length,      color: '#ffb830', icon: <Clock size={22}/> },
          { label: 'In Progress',   value: orders.filter(o => o.status === 'In Progress').length,  color: '#00d4ff', icon: <RefreshCw size={22}/> },
          { label: 'Completed',     value: orders.filter(o => o.status === 'Completed').length,    color: '#00d68f', icon: <CheckCircle size={22}/> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--card-color': s.color }}>
            <div className="stat-icon" style={{ background: `${s.color}18` }}><span style={{ display: 'flex' }}>{s.icon}</span></div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon"/>
          <input placeholder="Search patient, test, or doctor…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        {['All', ...STATUSES].map(s => (
          <button key={s} className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test</th>
                <th>Type</th>
                <th>Ordered By</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8}><div className="empty-state"><p>Loading…</p></div></td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon"><FlaskConical size={48} color="var(--text-muted)"/></div>
                    <p>No lab orders found</p>
                  </div>
                </td></tr>
              )}
              {filtered.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.patient_name}</td>
                  <td>{o.test_name}</td>
                  <td>
                    <span style={{ background: `${TYPE_COLOR[o.test_type] || '#a0aec0'}18`, color: TYPE_COLOR[o.test_type] || '#a0aec0', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      {o.test_type}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.ordered_by}</td>
                  <td style={{ fontSize: 12 }}>{o.ordered_date}</td>
                  <td>
                    <span style={{
                      background: o.priority === 'STAT' ? 'rgba(255,71,87,0.12)' : o.priority === 'Urgent' ? 'rgba(255,184,48,0.12)' : 'rgba(0,212,255,0.1)',
                      color:      o.priority === 'STAT' ? '#ff4757'              : o.priority === 'Urgent' ? '#ffb830'              : '#00d4ff',
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    }}>
                      {o.priority}
                    </span>
                  </td>
                  <td>
                    <span style={{ background: `${STATUS_COLOR[o.status] || '#a0aec0'}18`, color: STATUS_COLOR[o.status] || '#a0aec0', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit / Enter Results" onClick={() => openEdit(o)}><Pencil size={13}/></button>
                      {isAdmin && <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => openDel(o)}><Trash2 size={13}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'New Lab Order' : 'Update Lab Order'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : modal === 'add' ? 'Create Order' : 'Save Changes'}
              </button>
            </>
          }
        >
          {error && (
            <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontSize: 13 }}>
              {error}
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Patient Name *</label>
              <input className="form-control" value={form.patient_name} onChange={e => setForm(f => ({...f, patient_name: e.target.value}))} placeholder="Full patient name"/>
            </div>
            <div className="form-group">
              <label className="form-label">Ordered By *</label>
              <input className="form-control" value={form.ordered_by} onChange={e => setForm(f => ({...f, ordered_by: e.target.value}))} placeholder="Doctor name"/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Test Name *</label>
              <input className="form-control" value={form.test_name} onChange={e => setForm(f => ({...f, test_name: e.target.value}))} placeholder="e.g. Full Blood Count"/>
            </div>
            <div className="form-group">
              <label className="form-label">Test Type</label>
              <select className="form-control" value={form.test_type} onChange={e => setForm(f => ({...f, test_type: e.target.value}))}>
                {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-control" value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} placeholder="e.g. Cardiology"/>
            </div>
            <div className="form-group">
              <label className="form-label">Ordered Date</label>
              <input className="form-control" type="date" value={form.ordered_date} onChange={e => setForm(f => ({...f, ordered_date: e.target.value}))}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Results {modal === 'add' ? '— fill when ready' : ''}</label>
            <textarea className="form-control" rows={3} value={form.results} onChange={e => setForm(f => ({...f, results: e.target.value}))} placeholder="Enter test results here…" style={{ resize: 'vertical' }}/>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Additional notes or instructions" style={{ resize: 'vertical' }}/>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {modal === 'delete' && (
        <Modal title="Delete Lab Order" onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Delete <strong style={{ color: 'var(--text-primary)' }}>{selected?.test_name}</strong> for{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{selected?.patient_name}</strong>? This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
