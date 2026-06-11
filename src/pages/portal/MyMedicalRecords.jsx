import { useState } from 'react';
import { ClipboardList, CalendarDays, Stethoscope, Pill, FileText, FlaskConical, Activity, ChevronDown, ChevronUp } from 'lucide-react';

// ── Medical Record card ──────────────────────────────────────

function VitalChip({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', textAlign:'center', minWidth:72 }}>
      <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>{value}</div>
    </div>
  );
}

function RecordCard({ record }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = record.prescription || record.notes || record.labResults ||
    Object.values(record.vitals || {}).some(Boolean);

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', borderLeft:'4px solid #00d4ff' }}>
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:14 }}>
        <div style={{ width:42, height:42, borderRadius:10, background:'rgba(0,212,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <ClipboardList size={18} color="#00d4ff"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:6 }}>{record.diagnosis || 'Record'}</div>
          <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--text-secondary)', flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><Stethoscope size={11}/> {record.doctor}</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><CalendarDays size={11}/> {record.date}</span>
          </div>
        </div>
        {hasDetails && (
          <button onClick={() => setExpanded(v => !v)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4, borderRadius:6 }}>
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        )}
      </div>

      {expanded && (
        <div style={{ padding:'0 20px 16px', borderTop:'1px solid var(--border)', paddingTop:14 }}>
          {record.prescription && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>
                <Pill size={10}/> Prescription
              </div>
              <div style={{ background:'rgba(108,99,255,0.06)', border:'1px solid rgba(108,99,255,0.15)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>
                {record.prescription}
              </div>
            </div>
          )}
          {record.notes && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>
                <FileText size={10}/> Notes
              </div>
              <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>
                {record.notes}
              </div>
            </div>
          )}
          {record.labResults && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>
                <FlaskConical size={10}/> Lab Results
              </div>
              <div style={{ background:'rgba(0,214,143,0.06)', border:'1px solid rgba(0,214,143,0.15)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>
                {record.labResults}
              </div>
            </div>
          )}
          {Object.values(record.vitals || {}).some(Boolean) && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>
                <Activity size={10}/> Vitals
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <VitalChip label="Blood Pressure" value={record.vitals.bp}/>
                <VitalChip label="Heart Rate"     value={record.vitals.hr}/>
                <VitalChip label="Temperature"    value={record.vitals.temp}/>
                <VitalChip label="Weight"         value={record.vitals.weight}/>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Lab Order card ───────────────────────────────────────────

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

function LabOrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLOR[order.status] || '#a0aec0';

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', borderLeft:`4px solid ${color}` }}>
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:14 }}>
        <div style={{ width:42, height:42, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <FlaskConical size={18} color={color}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:6 }}>{order.test_name}</div>
          <div style={{ display:'flex', gap:10, fontSize:12, color:'var(--text-secondary)', flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><Stethoscope size={11}/> {order.ordered_by}</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><CalendarDays size={11}/> {order.ordered_date}</span>
            <span style={{ background:`${TYPE_COLOR[order.test_type] || '#a0aec0'}18`, color: TYPE_COLOR[order.test_type] || '#a0aec0', padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:600 }}>
              {order.test_type}
            </span>
            {order.priority !== 'Normal' && (
              <span style={{ background: order.priority === 'STAT' ? 'rgba(255,71,87,0.12)' : 'rgba(255,184,48,0.12)', color: order.priority === 'STAT' ? '#ff4757' : '#ffb830', padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:600 }}>
                {order.priority}
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
          <span style={{ background:`${color}18`, color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
            {order.status}
          </span>
          {order.results && (
            <button onClick={() => setExpanded(v => !v)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4, borderRadius:6 }}>
              {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
          )}
        </div>
      </div>

      {expanded && order.results && (
        <div style={{ padding:'0 20px 16px', borderTop:'1px solid var(--border)', paddingTop:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>
            <FlaskConical size={10}/> Results
          </div>
          <div style={{ background:'rgba(0,214,143,0.06)', border:'1px solid rgba(0,214,143,0.15)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
            {order.results}
          </div>
          {order.notes && (
            <div style={{ marginTop:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>
                <FileText size={10}/> Notes
              </div>
              <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>
                {order.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

export default function MyMedicalRecords({ records = [], labOrders = [] }) {
  const [tab, setTab] = useState('records');

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>Medical Records</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:14 }}>Your clinical history and lab results</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
        {[
          { key:'records', label:`Records (${records.length})`,      icon:<ClipboardList size={13}/> },
          { key:'lab',     label:`Lab Orders (${labOrders.length})`, icon:<FlaskConical  size={13}/> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
              background:'none', border:'none',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
              marginBottom:-1, transition:'color 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'records' && (
        records.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
            <ClipboardList size={44} style={{ opacity:0.2, marginBottom:12 }}/>
            <p style={{ fontSize:14 }}>No medical records on file yet.</p>
            <p style={{ fontSize:12, marginTop:6 }}>Records added by your doctor after visits will appear here.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {records.map(r => <RecordCard key={r.id} record={r}/>)}
          </div>
        )
      )}

      {tab === 'lab' && (
        labOrders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
            <FlaskConical size={44} style={{ opacity:0.2, marginBottom:12 }}/>
            <p style={{ fontSize:14 }}>No lab orders yet.</p>
            <p style={{ fontSize:12, marginTop:6 }}>Lab tests ordered by your doctor will appear here.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {labOrders.map(o => <LabOrderCard key={o.id} order={o}/>)}
          </div>
        )
      )}
    </div>
  );
}
