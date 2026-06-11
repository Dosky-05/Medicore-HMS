import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import * as Icons from 'lucide-react';
import { CheckCircle, ChevronRight, CalendarDays, Clock, User, Building2, Activity, AlertCircle } from 'lucide-react';

const STEPS = ['Department', 'Doctor', 'Date', 'Time', 'Confirm'];

const DAY_LABELS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function MiniCalendar({ workDays = [], selected, onChange, weeksAhead = 8 }) {
  const [viewYear,  setViewYear]  = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const maxDate = new Date(todayMidnight); maxDate.setDate(maxDate.getDate() + weeksAhead * 7);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth     = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // disable prev if the entire prev month is in the past
  const lastOfPrev  = new Date(viewYear, viewMonth, 0);
  const firstOfNext = new Date(viewYear, viewMonth + 1, 1);
  const canPrev = lastOfPrev  >= todayMidnight;
  const canNext = firstOfNext <= maxDate;

  const cells = Array(firstDayOfMonth).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', maxWidth: 360 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={prevMonth} disabled={!canPrev} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: canPrev ? 'pointer' : 'default', color: canPrev ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} disabled={!canNext} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: canNext ? 'pointer' : 'default', color: canNext ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;

          const date = new Date(viewYear, viewMonth, day);
          date.setHours(0, 0, 0, 0);
          const pad = n => String(n).padStart(2, '0');
          const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
          const isWorkDay  = workDays.includes(DAY_NAMES[date.getDay()]);
          const isPast     = date < todayMidnight;
          const isBeyond   = date > maxDate;
          const isToday    = date.getTime() === todayMidnight.getTime();
          const isSelected = selected === dateStr;
          const available  = !isPast && !isBeyond && isWorkDay;

          return (
            <button
              key={dateStr}
              disabled={!available}
              onClick={() => onChange(dateStr)}
              style={{
                aspectRatio: '1', borderRadius: 8, border: 'none',
                background: isSelected
                  ? '#00d68f'
                  : isToday && available
                    ? 'rgba(0,214,143,0.12)'
                    : 'transparent',
                color: isSelected
                  ? 'white'
                  : !available
                    ? 'var(--text-muted)'
                    : isToday
                      ? '#00d68f'
                      : 'var(--text-primary)',
                fontWeight: isSelected || isToday ? 700 : 400,
                fontSize: 13,
                cursor: available ? 'pointer' : 'default',
                opacity: !available ? 0.3 : 1,
                outline: isToday && !isSelected ? '1px solid rgba(0,214,143,0.4)' : 'none',
                transition: 'background 0.15s',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function genTimeSlots(start, end) {
  if (start === '24 Hours') return ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM'];
  const slots = [];
  const parse = t => {
    const [time, period] = t.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  const fmt = mins => {
    let h = Math.floor(mins / 60), m = mins % 60;
    const p = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12; if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
  };
  let cur = parse(start), endM = parse(end);
  while (cur + 30 <= endM) { slots.push(fmt(cur)); cur += 30; }
  return slots;
}

export default function BookAppointment({ patient, portalAppointments = [], onBooked }) {
  const navigate = useNavigate();

  const [step, setStep]   = useState(0);
  const [dept, setDept]   = useState('');
  const [doc, setDoc]     = useState(null);
  const [date, setDate]   = useState('');
  const [time, setTime]   = useState('');
  const [type, setType]   = useState('Consultation');
  const [notes, setNotes] = useState('');
  const [done, setDone]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [sbDepartments, setSbDepartments] = useState([]);
  const [sbDoctors, setSbDoctors]         = useState([]);
  const [sbSchedules, setSbSchedules]     = useState([]);

  useEffect(() => {
    supabase.from('departments').select('*').order('id', { ascending: true })
      .then(({ data }) => setSbDepartments(data || []));
    supabase.from('doctors').select('*').eq('status', 'Active')
      .then(({ data }) => setSbDoctors(data || []));
    supabase.from('doctor_schedules').select('*')
      .then(({ data }) => setSbSchedules(data || []));
  }, []);

  const _t = new Date();
  const today = `${_t.getFullYear()}-${String(_t.getMonth()+1).padStart(2,'0')}-${String(_t.getDate()).padStart(2,'0')}`;

  const deptDoctors = sbDoctors.filter(d =>
    d.department === dept &&
    sbSchedules.some(s => s.doctor_id === d.id)
  );

  const docSchedule = doc ? sbSchedules.find(s => s.doctor_id === doc.id) : null;

  const timeSlots = docSchedule ? genTimeSlots(docSchedule.start_time, docSchedule.end_time) : [];

  const takenTimes = portalAppointments
    .filter(a => a.doctor_id === String(doc?.id) && a.date === date && a.status === 'Scheduled')
    .map(a => a.time);

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError('');
    const { error } = await supabase.from('portal_appointments').insert({
      patient_id:   patient.id,
      patient_name: patient.name,
      doctor:       doc.name,
      doctor_id:    String(doc.id),
      department:   dept,
      date,
      time,
      type,
      notes: notes || null,
      status: 'Scheduled',
    });
    setSubmitting(false);
    if (error) { setSubmitError(error.message); return; }
    onBooked?.();
    setDone(true);
  };

  if (done) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
        background: 'rgba(0,214,143,0.15)', border: '2px solid #00d68f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle size={36} color="#00d68f" />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>Appointment Booked!</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 6 }}>
        <strong>{doc?.name}</strong> — {date} at {time}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>You'll receive a confirmation shortly.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={() => {
          setStep(0); setDept(''); setDoc(null); setDate(''); setTime(''); setDone(false); setSubmitError('');
        }}>
          Book Another
        </button>
        <button style={{ background:'rgba(0,214,143,0.12)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.3)', padding:'9px 20px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13 }}
          onClick={() => navigate('/portal/appointments')}>
          View Appointments
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Book Appointment</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Schedule a visit with one of our doctors in a few easy steps.</p>
      </div>

      {/* Stepper */}
      <div className="portal-stepper" style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
                background: i < step ? '#00d68f' : i === step ? 'rgba(0,214,143,0.2)' : 'var(--bg-card)',
                border: `2px solid ${i <= step ? '#00d68f' : 'var(--border)'}`,
                color: i < step ? 'white' : i === step ? '#00d68f' : 'var(--text-muted)',
                transition: 'all 0.3s',
              }}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: i === step ? '#00d68f' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: '0 12px', background: i < step ? '#00d68f' : 'var(--border)', transition: 'background 0.3s' }} />
            )}
          </div>
        ))}
      </div>

      <div className="card">
        {/* Step 0: Department */}
        {step === 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} color="#00d68f" /> Choose Department
            </div>
            <div className="dept-select-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {sbDepartments.map(d => {
                const DeptIcon = Icons[d.icon] || Activity;
                const selected = dept === d.name;
                return (
                  <button key={d.id} className="dept-select-btn" onClick={() => { setDept(d.name); setDoc(null); setDate(''); setTime(''); }}
                    style={{
                      padding: '18px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                      background: selected ? `${d.color}15` : 'var(--bg-card)',
                      border: `2px solid ${selected ? d.color : 'var(--border)'}`,
                      transform: selected ? 'translateY(-2px)' : 'none',
                      boxShadow: selected ? `0 4px 16px ${d.color}25` : 'none',
                    }}>
                    <div className="dept-icon-wrap" style={{
                      width: 44, height: 44, borderRadius: 11, marginBottom: 12,
                      background: `${d.color}22`, border: `1px solid ${d.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <DeptIcon size={22} color={d.color} />
                    </div>
                    <div className="dept-name" style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{d.name}</div>
                    <div className="dept-head" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{d.head}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button disabled={!dept} onClick={() => setStep(1)} style={{ background:'rgba(0,214,143,0.12)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.3)', padding:'9px 20px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Doctor */}
        {step === 1 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="#00d68f" /> Choose Doctor
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Available doctors in {dept}</div>
            {deptDoctors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No available doctors in this department.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {deptDoctors.map(d => (
                  <button key={d.id} onClick={() => { setDoc(d); setDate(''); setTime(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                      borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                      background: doc?.id === d.id ? 'rgba(0,214,143,0.1)' : 'var(--bg-card)',
                      border: `2px solid ${doc?.id === d.id ? '#00d68f' : 'var(--border)'}`,
                    }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'rgba(0,214,143,0.12)',
                      border: '1px solid rgba(0,214,143,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, color: '#00d68f', flexShrink: 0,
                    }}>{d.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{d.specialization} · {d.experience} yrs exp</div>
                    </div>
                    {doc?.id === d.id && <CheckCircle size={18} color="#00d68f" />}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button disabled={!doc} onClick={() => setStep(2)} style={{ background:'rgba(0,214,143,0.12)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.3)', padding:'9px 20px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date */}
        {step === 2 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={18} color="#00d68f" /> Choose Date
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
              Available days for <strong>{doc?.name}</strong> — green days are bookable
            </div>
            {!docSchedule?.work_days?.length ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No available dates right now.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <MiniCalendar
                  workDays={docSchedule.work_days}
                  selected={date}
                  onChange={d => { setDate(d); setTime(''); }}
                />
                {date && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(0,214,143,0.1)', border: '1px solid rgba(0,214,143,0.25)', alignSelf: 'flex-start' }}>
                    <CalendarDays size={14} color="#00d68f" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#00d68f' }}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button disabled={!date} onClick={() => setStep(3)} style={{ background:'rgba(0,214,143,0.12)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.3)', padding:'9px 20px', borderRadius:8, fontWeight:600, cursor: date ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:6, fontSize:13, opacity: date ? 1 : 0.5 }}>
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Time */}
        {step === 3 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#00d68f" /> Choose Time Slot
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — select an available slot
            </div>

            {[
              { label: 'Morning',   slots: timeSlots.filter(t => t.endsWith('AM')) },
              { label: 'Afternoon', slots: timeSlots.filter(t => t.endsWith('PM')) },
            ].map(({ label, slots }) => slots.length === 0 ? null : (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  {label}
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                  {slots.map(t => {
                    const taken = takenTimes.includes(t);
                    return (
                      <button key={t} disabled={taken} onClick={() => setTime(t)}
                        style={{
                          padding: '12px 10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                          cursor: taken ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                          background: time === t ? 'rgba(0,214,143,0.15)' : 'var(--bg-card)',
                          border: `2px solid ${time === t ? '#00d68f' : 'var(--border)'}`,
                          color: taken ? 'var(--text-muted)' : time === t ? '#00d68f' : 'var(--text-primary)',
                          opacity: taken ? 0.35 : 1, textAlign: 'center',
                        }}>
                        {t}{taken && <span style={{ fontSize: 10, marginLeft: 4 }}>✗</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <label className="form-label">Appointment Type</label>
              <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                {['Consultation', 'Follow-up', 'Check-up', 'Procedure'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" rows={2} placeholder="Describe your symptoms or reason for visit..."
                value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button disabled={!time} onClick={() => setStep(4)} style={{ background:'rgba(0,214,143,0.12)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.3)', padding:'9px 20px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Confirm Appointment</div>
            <div style={{ background: 'rgba(0,214,143,0.06)', border: '1px solid rgba(0,214,143,0.2)', borderRadius: 12, padding: '20px' }}>
              {[
                { label: 'Patient',     value: patient?.name || 'You' },
                { label: 'Doctor',      value: doc?.name },
                { label: 'Department',  value: dept },
                { label: 'Date',        value: date },
                { label: 'Time',        value: time },
                { label: 'Type',        value: type },
                { label: 'Notes',       value: notes || '—' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,214,143,0.1)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
            {submitError && (
              <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--danger)', fontSize: 13 }}>
                <AlertCircle size={14} /> {submitError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setStep(3)} disabled={submitting}>Back</button>
              <button onClick={handleConfirm} style={{ background:'rgba(0,214,143,0.12)', color:'#00d68f', border:'1px solid rgba(0,214,143,0.3)', padding:'9px 20px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13 }} disabled={submitting}>
                {submitting
                  ? <span style={{ animation: 'pulse 1s infinite' }}>Booking…</span>
                  : <><CheckCircle size={15} /> Confirm Booking</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
