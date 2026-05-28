import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Trash2, Pill, AlertTriangle, Ban, CheckCircle } from 'lucide-react';

const EMPTY = { name:'', category:'', stock:'', unit:'Tablets', reorderLevel:'', supplier:'', price:'', status:'In Stock' };

export default function Pharmacy() {
  const { pharmacy, addPharmacyItem, updatePharmacyItem, deletePharmacyItem } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);

  const filtered = pharmacy.filter(p => {
    const matchS = p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
    const matchF = filterStatus === 'All' || p.status === filterStatus;
    return matchS && matchF;
  });

  const lowStock = pharmacy.filter(p => p.status === 'Low Stock').length;
  const outOfStock = pharmacy.filter(p => p.status === 'Out of Stock').length;

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (p) => { setSelected(p); setForm({...p}); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const getStatus = (stock, reorder) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= reorder) return 'Low Stock';
    return 'In Stock';
  };

  const handleSave = () => {
    const stockNum = parseInt(form.stock) || 0;
    const reorderNum = parseInt(form.reorderLevel) || 0;
    const status = getStatus(stockNum, reorderNum);
    if (modal === 'add') addPharmacyItem({ ...form, stock: stockNum, reorderLevel: reorderNum, price: parseFloat(form.price)||0, status });
    else updatePharmacyItem(selected.id, { ...form, stock: stockNum, reorderLevel: reorderNum, price: parseFloat(form.price)||0, status });
    closeModal();
  };

  const categoryColors = { Cardiovascular:'#ff6b6b', Diabetes:'#74c0fc', Antibiotics:'#69db7c', Analgesic:'#ffa94d', Gastrointestinal:'#a9e34b', Respiratory:'#00d4ff', Anticoagulant:'#f783ac', 'Pain Management':'#cc5de8' };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-heading">Pharmacy & Inventory</h1><p className="page-desc">Medicine stock management</p></div>
        <button className="btn btn-primary" id="add-medicine-btn" onClick={openAdd}><Plus size={15}/> Add Medicine</button>
      </div>

      <div className="stats-grid" style={{ marginBottom:20 }}>
        {[
          { label:'Total Items', value:pharmacy.length, color:'#00d4ff', icon:<Pill size={24}/> },
          { label:'Low Stock', value:lowStock, color:'#ffb830', icon:<AlertTriangle size={24}/> },
          { label:'Out of Stock', value:outOfStock, color:'#ff4d6d', icon:<Ban size={24}/> },
          { label:'In Stock', value:pharmacy.filter(p=>p.status==='In Stock').length, color:'#00d68f', icon:<CheckCircle size={24}/> },
        ].map(c=>(
          <div key={c.label} className="stat-card" style={{'--card-color':c.color}}>
            <div className="stat-icon" style={{ background:`${c.color}18` }}><span style={{ fontSize:22, display:'flex' }}>{c.icon}</span></div>
            <div><div className="stat-value">{c.value}</div><div className="stat-label">{c.label}</div></div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-box"><Search size={14} className="search-icon"/><input placeholder="Search medicine or category…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        {['All','In Stock','Low Stock','Out of Stock'].map(s=>(
          <button key={s} className={`btn ${filterStatus===s?'btn-primary':'btn-ghost'} btn-sm`} onClick={()=>setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Unit</th><th>Reorder Level</th><th>Supplier</th><th>Price</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon"><Pill size={48} color="var(--text-muted)"/></div><p>No medicines found</p></div></td></tr>}
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td style={{ fontWeight:600 }}>{p.name}</td>
                  <td>
                    <span style={{ background:`${categoryColors[p.category]||'#00d4ff'}18`, color:categoryColors[p.category]||'#00d4ff', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>{p.category}</span>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="progress-bar" style={{ width:60 }}>
                        <div className="progress-fill" style={{ width:`${Math.min((p.stock/(p.reorderLevel*3||100))*100,100)}%`, background: p.status==='Out of Stock'?'var(--danger)':p.status==='Low Stock'?'var(--warning)':'var(--success)' }}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:600 }}>{p.stock}</span>
                    </div>
                  </td>
                  <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.unit}</td>
                  <td style={{ fontSize:12 }}>{p.reorderLevel}</td>
                  <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.supplier}</td>
                  <td style={{ fontWeight:600, color:'var(--accent)' }}>${p.price}</td>
                  <td><Badge status={p.status}/></td>
                  <td>
                    <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(p)}><Pencil size={13}/></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={()=>{ if(window.confirm('Remove item?')) deletePharmacyItem(p.id); }}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'Add Medicine':'Edit Medicine'} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name</label><input className="form-control" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Category</label><input className="form-control" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Stock Quantity</label><input className="form-control" type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Unit</label>
              <select className="form-control" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                {['Tablets','Capsules','Vials','Units','Bottles','Sachets'].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Reorder Level</label><input className="form-control" type="number" value={form.reorderLevel} onChange={e=>setForm(f=>({...f,reorderLevel:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Price per Unit ($)</label><input className="form-control" type="number" step="0.01" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
          </div>
          <div className="form-group"><label className="form-label">Supplier</label><input className="form-control" value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))}/></div>
        </Modal>
      )}
    </div>
  );
}
