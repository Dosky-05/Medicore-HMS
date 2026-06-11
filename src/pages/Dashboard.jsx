import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import StatCard from '../components/StatCard';
import { SkeletonStatCard, SkeletonTableRows } from '../components/Skeleton';
import Badge from '../components/Badge';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, UserPlus, Calendar, DollarSign, Activity, ArrowRight,
  AlertTriangle, Pill,
} from 'lucide-react';

const TOOLTIP_STYLE = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 12,
};

const COLORS = ['#00d4ff', '#6c63ff', '#ff6b6b', '#00d68f'];

export default function Dashboard() {
  const { doctors, appointments, invoices } = useData();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading,     setLoading]     = useState(true);
  const [portalAppts, setPortalAppts] = useState([]);
  const [portalPats,  setPortalPats]  = useState([]);
  const [staffPats,   setStaffPats]   = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // Resolve logged-in doctor's display name
  const myDoctorName = useMemo(() => {
    if (profile?.role !== 'doctor') return null;
    const rec = doctors.find(d => String(d.id) === String(profile?.doctor_id));
    return rec?.name || profile?.name || null;
  }, [profile, doctors]);

  const isDoctor = !!myDoctorName;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    Promise.all([
      supabase.from('portal_appointments').select('*'),
      supabase.from('patient_profiles').select('id,name,email,department,status,admit_date,created_at,doctor').eq('is_active', true),
      supabase.from('staff_patients').select('id,name,email,department,status,admit_date,created_at,doctor').eq('is_active', true),
      supabase.from('prescriptions').select('id,status,doctor_name'),
    ]).then(([{ data: appts }, { data: portal }, { data: staff }, { data: rxs }]) => {
      setPortalAppts(appts  || []);
      setPortalPats(portal  || []);
      setStaffPats(staff    || []);
      setPrescriptions(rxs  || []);
    });
    return () => clearTimeout(t);
  }, []);

  // ── Merged patient list ────────────────────────────────────
  const allPatients = useMemo(() => {
    const portalEmails = new Set(portalPats.map(p => p.email?.toLowerCase()).filter(Boolean));
    return [
      ...portalPats,
      ...staffPats.filter(p => !portalEmails.has(p.email?.toLowerCase())),
    ];
  }, [portalPats, staffPats]);

  // ── Merged appointment list ────────────────────────────────
  const allAppointments = useMemo(() => [
    ...appointments,
    ...portalAppts.map(a => ({
      id:         a.id,
      patient:    a.patient_name,
      patientId:  a.patient_id,
      doctor:     a.doctor,
      department: a.department,
      date:       a.date,
      time:       a.time,
      type:       a.type || 'Consultation',
      status:     a.status,
    })),
  ], [appointments, portalAppts]);

  const todayStr = new Date().toISOString().slice(0, 10);

  // ── Doctor-scoped derived values ───────────────────────────
  const myPatients = useMemo(() =>
    isDoctor ? allPatients.filter(p => p.doctor === myDoctorName) : allPatients,
  [allPatients, myDoctorName, isDoctor]);

  const myTodayAppts = useMemo(() =>
    allAppointments.filter(a =>
      a.date === todayStr &&
      (!isDoctor || a.doctor === myDoctorName)
    ).length,
  [allAppointments, todayStr, isDoctor, myDoctorName]);

  const myCriticalPatients = useMemo(() =>
    myPatients.filter(p => p.status === 'Critical').length,
  [myPatients]);

  const myActivePrescriptions = useMemo(() =>
    prescriptions.filter(rx =>
      rx.status === 'Active' && (!isDoctor || rx.doctor_name === myDoctorName)
    ).length,
  [prescriptions, isDoctor, myDoctorName]);

  // ── Admin/nurse stats ──────────────────────────────────────
  const totalRevenue = invoices.reduce((s, i) => s + (Number(i.paid) || 0), 0);
  const activeDocts  = doctors.filter(d => d.status === 'Active').length;

  // ── Tables ─────────────────────────────────────────────────
  const recentPatients = useMemo(() =>
    [...myPatients]
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 5),
  [myPatients]);

  const upcomingAppts = useMemo(() =>
    allAppointments
      .filter(a =>
        (a.status === 'Scheduled' || a.status === 'Confirmed') &&
        a.date >= todayStr &&
        (!isDoctor || a.doctor === myDoctorName)
      )
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      .slice(0, 5),
  [allAppointments, todayStr, isDoctor, myDoctorName]);

  // ── Charts ─────────────────────────────────────────────────
  const chartMonths = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d     = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      if (isDoctor) {
        const appts  = allAppointments.filter(a => a.doctor === myDoctorName && (a.date || '').startsWith(key)).length;
        const newPts = allPatients.filter(p => p.doctor === myDoctorName && (p.created_at || '').startsWith(key)).length;
        return { month: label, appointments: appts, patients: newPts };
      }
      const newPts  = allPatients.filter(p => (p.created_at || '').startsWith(key)).length;
      const revenue = invoices.filter(inv => (inv.date || '').startsWith(key))
                              .reduce((s, inv) => s + (Number(inv.paid) || 0), 0);
      return { month: label, patients: newPts, revenue: Math.round(revenue / 100) };
    });
  }, [allPatients, allAppointments, invoices, isDoctor, myDoctorName]);

  const apptTypes = useMemo(() => {
    const src = isDoctor ? allAppointments.filter(a => a.doctor === myDoctorName) : allAppointments;
    const counts = {};
    src.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    const result = Object.entries(counts).map(([name, value]) => ({ name, value }));
    return result.length ? result : [{ name: 'Consultation', value: 1 }];
  }, [allAppointments, isDoctor, myDoctorName]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Activity size={22} color="var(--accent)"/> Overview
          </h1>
          <p className="page-desc">{today} — here's what's happening at MediCore today.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i}/>)
        ) : isDoctor ? (
          <>
            <StatCard icon={<Users size={24}/>}         label="My Patients"           value={myPatients.length}     color="#00d4ff" />
            <StatCard icon={<Calendar size={24}/>}      label="Today's Appointments"  value={myTodayAppts}          color="#00d68f" />
            <StatCard icon={<AlertTriangle size={24}/>} label="Critical Patients"     value={myCriticalPatients}    color="#ff4d6d" />
            <StatCard icon={<Pill size={24}/>}          label="Active Prescriptions"  value={myActivePrescriptions} color="#6c63ff" />
          </>
        ) : (
          <>
            <StatCard icon={<Users size={24}/>}     label="Total Patients"       value={allPatients.length}                    change="12% this month"    changeType="up" color="#00d4ff" />
            <StatCard icon={<UserPlus size={24}/>}  label="Active Doctors"       value={activeDocts}                           change="2 new this week"   changeType="up" color="#6c63ff" />
            <StatCard icon={<Calendar size={24}/>}  label="Today's Appointments" value={myTodayAppts}                          change="8% from yesterday" changeType="up" color="#00d68f" />
            <StatCard icon={<DollarSign size={24}/>}label="Total Revenue"        value={`$${(totalRevenue/1000).toFixed(1)}k`} change="18% this month"    changeType="up" color="#ffb830" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">{isDoctor ? 'My Activity Trends' : 'Patient & Revenue Trends'}</div>
              <div className="card-subtitle">Last 6 months</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartMonths}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="month" tick={{ fill:'#8892a4', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#8892a4', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TOOLTIP_STYLE}/>
              <Area type="monotone" dataKey="patients"     stroke="#00d4ff" strokeWidth={2} fill="url(#colorPatients)"  name="Patients"/>
              {isDoctor
                ? <Area type="monotone" dataKey="appointments" stroke="#6c63ff" strokeWidth={2} fill="url(#colorSecondary)" name="Appointments"/>
                : <Area type="monotone" dataKey="revenue"      stroke="#6c63ff" strokeWidth={2} fill="url(#colorSecondary)" name="Revenue ($)"/>
              }
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Appointment Types</div>
              <div className="card-subtitle">{isDoctor ? 'My appointments' : 'Distribution breakdown'}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={apptTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {apptTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE}/>
              <Legend iconType="circle" formatter={v => <span style={{ color:'#8892a4', fontSize:12 }}>{v}</span>}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid-2">
        {/* Recent Patients */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">{isDoctor ? 'My Recent Patients' : 'Recent Patients'}</div>
            <button onClick={() => navigate('/patients')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
              View all <ArrowRight size={12}/>
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Patient</th><th>Department</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTableRows rows={5} cols={3}/> : recentPatients.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign:'center', color:'var(--text-muted)', fontSize:13, padding:'20px 0' }}>No patients yet</td></tr>
                ) : recentPatients.map(p => (
                  <tr key={p.id} onClick={() => navigate('/patients')} style={{ cursor:'pointer' }}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="avatar" style={{ background:'linear-gradient(135deg,#00d4ff,#6c63ff)', fontSize:11 }}>
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                          <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{p.admit_date || p.created_at?.slice(0,10) || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color:'var(--text-secondary)', fontSize:12 }}>{p.department}</td>
                    <td><Badge status={p.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">{isDoctor ? 'My Upcoming Appointments' : 'Upcoming Appointments'}</div>
            <button onClick={() => navigate('/appointments')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
              View all <ArrowRight size={12}/>
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  {!isDoctor && <th>Doctor</th>}
                  <th>Type</th>
                  <th>Date / Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTableRows rows={5} cols={isDoctor ? 3 : 4}/> : upcomingAppts.length === 0 ? (
                  <tr><td colSpan={isDoctor ? 3 : 4} style={{ textAlign:'center', color:'var(--text-muted)', fontSize:13, padding:'20px 0' }}>No upcoming appointments</td></tr>
                ) : upcomingAppts.map(a => (
                  <tr key={a.id} onClick={() => navigate('/appointments')} style={{ cursor:'pointer' }}>
                    <td style={{ fontWeight:600, fontSize:13 }}>{a.patient}</td>
                    {!isDoctor && <td style={{ color:'var(--text-secondary)', fontSize:12 }}>{a.doctor}</td>}
                    <td style={{ color:'var(--text-secondary)', fontSize:12 }}>{a.type}</td>
                    <td>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--accent)' }}>{a.date}</div>
                      <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{a.time}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
