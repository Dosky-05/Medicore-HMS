import { useData } from '../context/DataContext';
import * as Icons from 'lucide-react';

export default function Departments() {
  const { departments, patients, doctors } = useData();

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-heading">Departments</h1><p className="page-desc">{departments.length} hospital departments</p></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {departments.map(dept => {
          const deptDoctors = doctors.filter(d => d.department === dept.name);
          const deptPatients = patients.filter(p => p.department === dept.name);
          const occupancy = Math.round((dept.current / dept.capacity) * 100);

          return (
            <div key={dept.id} className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ height:5, background: dept.color, borderRadius:'0' }} />
              <div style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:`${dept.color}18`, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${dept.color}30` }}>
                    {(() => { const Icon = Icons[dept.icon] || Icons.Circle; return <Icon size={24} color={dept.color} /> })()}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{dept.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>Head: {dept.head}</div>
                  </div>
                </div>

                {/* Occupancy Bar */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600 }}>Occupancy</span>
                    <span style={{ fontSize:13, fontWeight:700, color: occupancy>80?'var(--danger)':occupancy>60?'var(--warning)':'var(--success)' }}>{occupancy}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${occupancy}%`, background: occupancy>80?'var(--danger)':occupancy>60?'var(--warning)':'var(--success)' }}/>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{dept.current} / {dept.capacity} beds occupied</div>
                </div>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {[
                    { label:'Capacity', value:dept.capacity, icon:<Icons.Bed size={16}/> },
                    { label:'Doctors', value:deptDoctors.length, icon:<Icons.UserPlus size={16}/> },
                    { label:'Patients', value:deptPatients.length, icon:<Icons.Users size={16}/> },
                  ].map(s=>(
                    <div key={s.label} style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:16, marginBottom:4 }}>{s.icon}</div>
                      <div style={{ fontSize:18, fontWeight:800, color: dept.color }}>{s.value}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Doctors in dept */}
                {deptDoctors.length > 0 && (
                  <div style={{ marginTop:14 }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Staff</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {deptDoctors.map(d=>(
                        <span key={d.id} style={{ background:`${dept.color}12`, color:dept.color, border:`1px solid ${dept.color}25`, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500 }}>
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
