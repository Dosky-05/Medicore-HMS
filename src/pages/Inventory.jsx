import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, Ban, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const CATEGORIES = ['PPE', 'Cleaning Supplies', 'Linens', 'Consumables', 'Office Supplies', 'Equipment'];
const UNITS = ['Pieces', 'Boxes', 'Packs', 'Liters', 'Rolls', 'Pairs', 'Sets', 'Bottles', 'Bags', 'Cartons'];

const CATEGORY_COLORS = {
  'PPE':               '#00d4ff',
  'Cleaning Supplies': '#69db7c',
  'Linens':            '#a9e34b',
  'Consumables':       '#ffa94d',
  'Office Supplies':   '#74c0fc',
  'Equipment':         '#cc5de8',
};

const EMPTY = { name:'', category:'PPE', quantity:'', unit:'Pieces', reorder_level:'', supplier:'', cost_per_unit:'', last_restocked:'' };

const getStatus = (qty, reorder) => {
  if (qty <= 0)        return 'Out of Stock';
  if (qty <= reorder)  return 'Low Stock';
  return 'In Stock';
};

const normalize = (row) => ({
  id:             row.id,
  name:           row.name,
  category:       row.category       || '',
  quantity:       row.quantity,
  unit:           row.unit           || 'Pieces',
  reorder_level:  row.reorder_level,
  supplier:       row.supplier       || '',
  cost_per_unit:  row.cost_per_unit  || 0,
  last_restocked: row.last_restocked || '',
  status:         row.status,
  created_at:     row.created_at,
});

export default function Inventory() {
  const { profile } = useAuth();
  const role      = profile?.role || 'admin';
  const canWrite  = role === 'admin' || role === 'nurse';
  const canDelete = role === 'admin';

  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [selected,     setSelected]     = useState(null);
  const [restockQty,   setRestockQty]   = useState('');
  const [error,        setError]        = useState('');

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('category', { ascending: true })
      .order('name',     { ascending: true });
    setItems((data || []).map(normalize));
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q)) &&
      (filterCat    === 'All' || p.category === filterCat) &&
      (filterStatus === 'All' || p.status   === filterStatus)
    );
  });

  const openAdd     = () => { setForm(EMPTY); setError(''); setModal('add'); };
  const openEdit    = (p) => { setSelected(p); setForm({ ...p, quantity: String(p.quantity), reorder_level: String(p.reorder_level), cost_per_unit: String(p.cost_per_unit) }); setError(''); setModal('edit'); };
  const openRestock = (p, e) => { e.stopPropagation(); setSelected(p); setRestockQty(''); setError(''); setModal('restock'); };
  const closeModal  = () => { setModal(null); setSelected(null); setError(''); setSaving(false); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Item name is required.'); return; }
    setSaving(true); setError('');

    const qty     = parseInt(form.quantity)      || 0;
    const reorder = parseInt(form.reorder_level) || 0;

    const payload = {
      name:           form.name.trim(),
      category:       form.category        || null,
      quantity:       qty,
      unit:           form.unit,
      reorder_level:  reorder,
      supplier:       form.supplier        || null,
      cost_per_unit:  parseFloat(form.cost_per_unit) || 0,
      last_restocked: form.last_restocked  || null,
      status:         getStatus(qty, reorder),
    };

    let err;
    if (modal === 'add') {
      ({ error: err } = await supabase.from('inventory').insert(payload));
    } else {
      ({ error: err } = await supabase.from('inventory').update(payload).eq('id', selected.id));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    await fetchItems();
    closeModal();
  };

  const handleRestock = async () => {
    const add = parseInt(restockQty);
    if (!add || add <= 0) { setError('Enter a valid quantity to add.'); return; }
    setSaving(true); setError('');

    const newQty = selected.quantity + add;
    const { error: err } = await supabase.from('inventory').update({
      quantity:       newQty,
      status:         getStatus(newQty, selected.reorder_level),
      last_restocked: new Date().toISOString().slice(0, 10),
    }).eq('id', selected.id);

    setSaving(false);
    if (err) { setError(err.message); return; }
    await fetchItems();
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from inventory?')) return;
    await supabase.from('inventory').delete().eq('id', id);
    await fetchItems();
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:200, color:'var(--text-muted)', fontSize:14 }}>
      Loading inventory…
    </div>
  );

  const lowStock   = items.filter(p => p.status === 'Low Stock').length;
  const outOfStock = items.filter(p => p.status === 'Out of Stock').length;
  const inStock    = items.filter(p => p.status === 'In Stock').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">General Inventory</h1>
          <p className="page-desc">PPE, cleaning supplies, linens &amp; consumables</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Item</button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom:20 }}>
        {[
          { label:'Total Items',   value:items.length, color:'#00d4ff', icon:<Package size={24}/> },
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
          <input placeholder="Search item, category or supplier…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="form-control" style={{ maxWidth:160, fontSize:13 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        {['All','In Stock','Low Stock','Out of Stock'].map(s => (
          <button key={s} className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th><th>Category</th><th>Quantity</th><th>Unit</th>
                <th>Reorder Level</th><th>Supplier</th><th>Last Restocked</th>
                <th>Status</th><th style={{ textAlign:'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon"><Package size={48} color="var(--text-muted)"/></div><p>No items found</p></div></td></tr>
              )}
              {filtered.map(p => {
                const catColor = CATEGORY_COLORS[p.category] || '#00d4ff';
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight:600 }}>{p.name}</td>
                    <td>
                      {p.category && (
                        <span style={{ background:`${catColor}18`, color:catColor, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                          {p.category}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="progress-bar" style={{ width:60 }}>
                          <div className="progress-fill" style={{
                            width: `${Math.min((p.quantity / (p.reorder_level * 3 || 100)) * 100, 100)}%`,
                            background: p.status === 'Out of Stock' ? 'var(--danger)' : p.status === 'Low Stock' ? 'var(--warning)' : 'var(--success)',
                          }}/>
                        </div>
                        <span style={{ fontSize:13, fontWeight:600 }}>{p.quantity}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.unit}</td>
                    <td style={{ fontSize:12 }}>{p.reorder_level}</td>
                    <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.supplier || '—'}</td>
                    <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.last_restocked || '—'}</td>
                    <td><Badge status={p.status}/></td>
                    <td>
                      <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Restock" onClick={e => openRestock(p, e)} style={{ color:'#00d68f' }}>
                          <RefreshCw size={13}/>
                        </button>
                        {canWrite && (
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)}><Pencil size={13}/></button>
                        )}
                        {canDelete && (
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p.id)}><Trash2 size={13}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Add Inventory Item' : 'Edit Item'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
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
              <label className="form-label">Item Name *</label>
              <input className="form-control" placeholder="e.g. Surgical Face Masks" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-control" type="number" min="0" placeholder="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-control" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Reorder Level</label>
              <input className="form-control" type="number" min="0" placeholder="10" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Cost per Unit ($)</label>
              <input className="form-control" type="number" min="0" step="0.01" placeholder="0.00" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input className="form-control" placeholder="e.g. MedSupply Co." value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Last Restocked</label>
              <input className="form-control" type="date" value={form.last_restocked} onChange={e => setForm(f => ({ ...f, last_restocked: e.target.value }))}/>
            </div>
          </div>
          {form.quantity !== '' && (
            <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-muted)' }}>
              Status will be: <Badge status={getStatus(parseInt(form.quantity)||0, parseInt(form.reorder_level)||0)}/>
            </div>
          )}
        </Modal>
      )}

      {/* Restock Modal */}
      {modal === 'restock' && selected && (
        <Modal
          title={`Restock — ${selected.name}`}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRestock} disabled={saving}>{saving ? 'Saving…' : 'Add Stock'}</button>
            </>
          }
        >
          {error && (
            <div style={{ background:'rgba(220,38,38,0.1)', color:'#f87171', padding:'10px 12px', borderRadius:6, marginBottom:16, display:'flex', gap:8, alignItems:'center', border:'1px solid rgba(220,38,38,0.3)' }}>
              <AlertCircle size={15}/> {error}
            </div>
          )}
          <div style={{ marginBottom:16, padding:'12px 14px', background:'var(--bg-tertiary)', borderRadius:10, fontSize:13, color:'var(--text-secondary)', display:'flex', gap:24 }}>
            <span>Current stock: <strong style={{ color:'var(--text-primary)' }}>{selected.quantity} {selected.unit}</strong></span>
            <span>Reorder level: <strong style={{ color:'var(--text-primary)' }}>{selected.reorder_level}</strong></span>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity to Add ({selected.unit})</label>
            <input
              className="form-control"
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={restockQty}
              onChange={e => setRestockQty(e.target.value)}
              autoFocus
            />
          </div>
          {restockQty && parseInt(restockQty) > 0 && (
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
              New total: <strong style={{ color:'var(--accent)' }}>{selected.quantity + parseInt(restockQty)} {selected.unit}</strong>
              · Status will be: <Badge status={getStatus(selected.quantity + parseInt(restockQty), selected.reorder_level)}/>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
