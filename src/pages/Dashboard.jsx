import { useData } from '../context/DataContext';
import { CHART_DATA } from '../data/mockData';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, UserPlus, Calendar, DollarSign } from 'lucide-react';

const COLORS = ['#00d4ff', '#6c63ff', '#ff6b6b', '#00d68f'];

export default function Dashboard() {
  const { patients, doctors, appointments, invoices } = useData();

  const totalRevenue = invoices.reduce((s, i) => s + i.paid, 0);
  const todayAppts = appointments.filter(a => a.date === new Date().toISOString().slice(0, 10)).length;
  const admittedPatients = patients.filter(p => p.status === 'Admitted').length;
  const activeDocts = doctors.filter(d => d.status === 'Active').length;
  const recentPatients = [...patients].slice(-5).reverse();
  const upcomingAppts = appointments.filter(a => a.status === 'Scheduled').slice(0, 5);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<Users size={24} />} label="Total Patients" value={patients.length} change="12% this month" changeType="up" color="#00d4ff" />
        <StatCard icon={<UserPlus size={24} />} label="Active Doctors" value={activeDocts} change="2 new this week" changeType="up" color="#6c63ff" />
        <StatCard icon={<Calendar size={24} />} label="Today's Appointments" value={todayAppts || appointments.filter(a=>a.status==='Scheduled').length} change="8% from yesterday" changeType="up" color="#00d68f" />
        <StatCard icon={<DollarSign size={24} />} label="Total Revenue" value={`$${(totalRevenue/1000).toFixed(1)}k`} change="18% this month" changeType="up" color="#ffb830" />
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Patient & Revenue Trends</div>
              <div className="card-subtitle">Last 6 months</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA.monthlyPatients}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1326', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f4ff' }} />
              <Area type="monotone" dataKey="patients" stroke="#00d4ff" strokeWidth={2} fill="url(#colorPatients)" name="Patients" />
              <Area type="monotone" dataKey="revenue" stroke="#6c63ff" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Appointment Types</div>
              <div className="card-subtitle">Distribution breakdown</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={CHART_DATA.appointmentTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {CHART_DATA.appointmentTypes.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1326', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f4ff' }} />
              <Legend iconType="circle" formatter={(v) => <span style={{ color: '#8892a4', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid-2">
        {/* Recent Patients */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Patients</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: 'linear-gradient(135deg,#00d4ff,#6c63ff)', fontSize: 11 }}>
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p.department}</td>
                    <td><Badge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Upcoming Appointments</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppts.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.patient}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{a.doctor}</td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--accent)' }}>{a.date}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.time}</div>
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
