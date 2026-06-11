import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, Pill, AlertTriangle, Ban, CheckCircle, AlertCircle } from 'lucide-react';

const EMPTY = { name:'', category:'', stock:'', unit:'Tablets', reorderLevel:'', supplier:'', price:'' };

const CATEGORY_COLORS = {
  Cardiovascular:'#ff6b6b', Diabetes:'#74c0fc', Antibiotics:'#69db7c',
  Analgesic:'#ffa94d', Gastrointestinal:'#a9e34b', Respiratory:'#00d4ff',
  Anticoagulant:'#f783ac', 'Pain Management':'#cc5de8',
};

const getStatus = (stock, reorder) => {
  if (stock <= 0)      return 'Out of Stock';
  if (stock <= reorder) return 'Low Stock';
  return 'In Stock';
};

// Supabase row → internal shape
const normalize = (row) => ({
  id:           row.id,
  name:         row.name,
  category:     row.category     || '',
  stock:        row.stock,
  unit:         row.unit,
  reorderLevel: row.reorder_level,
  supplier:     row.supplier     || '',
  price:        row.price,
  status:       row.status,
  created_at:   row.created_at,
});

export default function Pharmacy() {
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [selected,     setSelected]     = useState(null);
  const [error,        setError]        = useState('');

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('pharmacy')
      .select('*')
      .order('name', { ascending: true });
    setItems((data || []).map(normalize));
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(p => {
    const q = search.toLowerCase();
    return (p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)) &&
      (filterStatus === 'All' || p.status === filterStatus);
  });

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal('add'); };
  const openEdit = (p) => { setSelected(p); setForm({ ...p, stock: String(p.stock), reorderLevel: String(p.reorderLevel), price: String(p.price) }); setError(''); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); setError(''); setSaving(false); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Medicine name is required.'); return; }
    setSaving(true); setError('');

    const stockNum   = parseInt(form.stock)        || 0;
    const reorderNum = parseInt(form.reorderLevel) || 0;
    const payload = {
      name:          form.name.trim(),
      category:      form.category   || null,
      stock:         stockNum,
      unit:          form.unit,
      reorder_level: reorderNum,
      supplier:      form.supplier   || null,
      price:         parseFloat(form.price) || 0,
      status:        getStatus(stockNum, reorderNum),
    };

    let err;
    if (modal === 'add') {
      ({ error: err } = await supabase.from('pharmacy').insert(payload));
    } else {
      ({ error: err } = await supabase.from('pharmacy').update(payload).eq('id', selected.id));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    await fetchItems();
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this medicine from inventory?')) return;
    await supabase.from('pharmacy').delete().eq('id', id);
    await fetchItems();
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:200, color:'var(--text-muted)', fontSize:14 }}>
      Loading pharmacy…
    </div>
  );

  const lowStock   = items.filter(p => p.status === 'Low Stock').length;
  const outOfStock = items.filter(p => p.status === 'Out of Stock').length;
  const inStock    = items.filter(p => p.status === 'In Stock').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Pharmacy & Inventory</h1>
          <p className="page-desc">Medicine stock management</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Medicine</button>
      </div>

      <div className="stats-grid" style={{ marginBottom:20 }}>
        {[
          { label:'Total Items',   value:items.length, color:'#00d4ff', icon:<Pill size={24}/> },
          { label:'Low Stock',     value:lowStock,     color:'#ffb830', icon:<AlertTriangle size={24}/> },
          { label:'Out of Stock',  value:outOfStock,   color:'#ff4d6d', icon:<Ban size={24}/> },
          { label:'In Stock',      value:inStock,      color:'#00d68f', icon:<CheckCircle size={24}/> },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ '--card-color': c.color }}>
            <div className="stat-icon" style={{ background:`${c.color}18` }}><span style={{ fontSize:22, display:'flex' }}>{c.icon}</span></div>
            <div><div className="stat-value">{c.value}</div><div className="stat-label">{c.label}</div></div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={14} className="search-icon"/>
          <input placeholder="Search medicine or category…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(s => (
          <button key={s} className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Unit</th><th>Reorder Level</th><th>Supplier</th><th>Price</th><th>Status</th><th style={{ textAlign:'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon"><Pill size={48} color="var(--text-muted)"/></div><p>No medicines found</p></div></td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight:600 }}>{p.name}</td>
                  <td>
                    {p.category && (
                      <span style={{ background:`${CATEGORY_COLORS[p.category]||'#00d4ff'}18`, color:CATEGORY_COLORS[p.category]||'#00d4ff', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                        {p.category}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="progress-bar" style={{ width:60 }}>
                        <div className="progress-fill" style={{
                          width:`${Math.min((p.stock / (p.reorderLevel * 3 || 100)) * 100, 100)}%`,
                          background: p.status === 'Out of Stock' ? 'var(--danger)' : p.status === 'Low Stock' ? 'var(--warning)' : 'var(--success)',
                        }}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:600 }}>{p.stock}</span>
                    </div>
                  </td>
                  <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.unit}</td>
                  <td style={{ fontSize:12 }}>{p.reorderLevel}</td>
                  <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.supplier || '—'}</td>
                  <td style={{ fontWeight:600, color:'var(--accent)' }}>${p.price}</td>
                  <td><Badge status={p.status}/></td>
                  <td>
                    <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)}><Pencil size={13}/></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Add Medicine' : 'Edit Medicine'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          {error && (
            <div style={{ background:'rgba(220,38,38,0.1)', color:'#f87171', padding:'10px 12px', borderRadius:6, marginBottom:16, display:'flex', gap:8, alignItems:'center', border:'1px solid rgba(220,38,38,0.3)' }}>
              <AlertCircle size={15}/> {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-control" placeholder="e.g. Amoxicillin" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-control" placeholder="e.g. Antibiotics" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}/>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input className="form-control" type="number" min="0" placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-control" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {['Tablets','Capsules','Vials','Units','Bottles','Sachets','Ampoules','Syrup'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Reorder Level</label>
              <input className="form-control" type="number" min="0" placeholder="10" value={form.reorderLevel} onChange={e => setForm(f => ({ ...f, reorderLevel: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Price per Unit ($)</label>
              <input className="form-control" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input className="form-control" placeholder="e.g. PharmaCo Ltd" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}/>
          </div>

          {/* Status preview */}
          {form.stock !== '' && (
            <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-muted)' }}>
              Status will be set to: <Badge status={getStatus(parseInt(form.stock)||0, parseInt(form.reorderLevel)||0)}/>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
