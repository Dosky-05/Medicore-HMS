import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Plus, Search, Banknote, Hourglass, AlertCircle, Receipt } from 'lucide-react';

const EMPTY = { patient:'', patientId:'', date:'', dueDate:'', services:[], amount:'', paid:'0', status:'Pending', insurance:'' };

export default function Billing() {
  const { invoices, addInvoice, updateInvoice, patients } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);
  const [serviceInput, setServiceInput] = useState('');

  const filtered = invoices.filter(i => {
    const matchS = i.patient.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search);
    const matchF = filterStatus === 'All' || i.status === filterStatus;
    return matchS && matchF;
  });

  const totalRevenue = invoices.reduce((s,i)=>s+i.paid,0);
  const pending = invoices.filter(i=>i.status==='Pending').reduce((s,i)=>s+(i.amount-i.paid),0);
  const overdue = invoices.filter(i=>i.status==='Overdue').length;

  const openAdd = () => { setForm({...EMPTY, date:new Date().toISOString().slice(0,10)}); setServiceInput(''); setModal('add'); };
  const openView = (inv) => { setSelected(inv); setModal('view'); };
  const markPaid = (inv) => updateInvoice(inv.id, { paid: inv.amount, status:'Paid' });
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = () => {
    addInvoice({
      ...form,
      amount: parseFloat(form.amount)||0,
      paid: parseFloat(form.paid)||0,
      services: serviceInput.split(',').map(s=>s.trim()).filter(Boolean),
    });
    closeModal();
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-heading">Billing & Invoices</h1><p className="page-desc">Track payments and manage invoices</p></div>
        <button className="btn btn-primary" id="add-invoice-btn" onClick={openAdd}><Plus size={15}/> New Invoice</button>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom:20 }}>
        {[
          { label:'Total Revenue', value:`$${totalRevenue.toLocaleString()}`, color:'#00d68f', icon:<Banknote size={24}/> },
          { label:'Pending Amount', value:`$${pending.toLocaleString()}`, color:'#ffb830', icon:<Hourglass size={24}/> },
          { label:'Overdue Invoices', value:overdue, color:'#ff4d6d', icon:<AlertCircle size={24}/> },
          { label:'Total Invoices', value:invoices.length, color:'#00d4ff', icon:<Receipt size={24}/> },
        ].map(c=>(
          <div key={c.label} className="stat-card" style={{'--card-color':c.color}}>
            <div className="stat-icon" style={{ background:`${c.color}18` }}><span style={{ fontSize:22, display:'flex' }}>{c.icon}</span></div>
            <div><div className="stat-value">{c.value}</div><div className="stat-label">{c.label}</div></div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-box"><Search size={14} className="search-icon"/><input placeholder="Search by patient or invoice ID…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        {['All','Paid','Pending','Partial','Overdue'].map(s=>(
          <button key={s} className={`btn ${filterStatus===s?'btn-primary':'btn-ghost'} btn-sm`} onClick={()=>setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Invoice</th><th>Patient</th><th>Date</th><th>Due Date</th><th>Amount</th><th>Paid</th><th>Insurance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon"><Receipt size={48} color="var(--text-muted)"/></div><p>No invoices found</p></div></td></tr>}
              {filtered.map(inv=>(
                <tr key={inv.id}>
                  <td style={{ color:'var(--accent)', fontWeight:600, fontSize:12 }}>{inv.id}</td>
                  <td style={{ fontWeight:600 }}>{inv.patient}</td>
                  <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{inv.date}</td>
                  <td style={{ fontSize:12, color: inv.status==='Overdue'?'var(--danger)':'var(--text-secondary)' }}>{inv.dueDate}</td>
                  <td style={{ fontWeight:700 }}>${inv.amount.toLocaleString()}</td>
                  <td style={{ color:'var(--success)' }}>${inv.paid.toLocaleString()}</td>
                  <td style={{ fontSize:12 }}>{inv.insurance}</td>
                  <td><Badge status={inv.status}/></td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openView(inv)}>👁 View</button>
                      {inv.status!=='Paid' && <button className="btn btn-primary btn-sm" onClick={()=>markPaid(inv)}>✓ Paid</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Modal */}
      {modal==='add' && (
        <Modal title="Create New Invoice" onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Create Invoice</button></>}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Patient</label>
              <select className="form-control" value={form.patient} onChange={e=>{ const p=patients.find(x=>x.name===e.target.value); setForm(f=>({...f,patient:e.target.value,patientId:p?.id||''})); }}>
                <option value="">Select patient…</option>{patients.map(p=><option key={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Insurance</label><input className="form-control" value={form.insurance} onChange={e=>setForm(f=>({...f,insurance:e.target.value}))}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Invoice Date</label><input className="form-control" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Due Date</label><input className="form-control" type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/></div>
          </div>
          <div className="form-group"><label className="form-label">Services (comma-separated)</label><input className="form-control" placeholder="e.g. Consultation, ECG, Medication" value={serviceInput} onChange={e=>setServiceInput(e.target.value)}/></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Total Amount ($)</label><input className="form-control" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Amount Paid ($)</label><input className="form-control" type="number" value={form.paid} onChange={e=>setForm(f=>({...f,paid:e.target.value}))}/></div>
          </div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              {['Pending','Paid','Partial','Overdue'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {modal==='view' && selected && (
        <Modal title={`Invoice ${selected.id}`} onClose={closeModal} footer={<button className="btn btn-ghost" onClick={closeModal}>Close</button>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[['Patient',selected.patient],['Insurance',selected.insurance],['Date',selected.date],['Due Date',selected.dueDate],['Total',`$${selected.amount.toLocaleString()}`],['Paid',`$${selected.paid.toLocaleString()}`]].map(([k,v])=>(
              <div key={k}><div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{k}</div><div style={{ fontWeight:600 }}>{v}</div></div>
            ))}
          </div>
          <div><div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Services</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {selected.services?.map(s=><span key={s} style={{ background:'var(--accent-glow)', color:'var(--accent)', padding:'4px 10px', borderRadius:20, fontSize:12 }}>{s}</span>)}
            </div>
          </div>
          <div style={{ marginTop:16, padding:'12px 16px', background:'var(--bg-card)', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'var(--text-secondary)' }}>Balance Due</span>
            <span style={{ fontSize:20, fontWeight:800, color: selected.status==='Paid'?'var(--success)':'var(--danger)' }}>${(selected.amount-selected.paid).toLocaleString()}</span>
          </div>
        </Modal>
      )}
    </div>
  );
}
