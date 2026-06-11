import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, HeartPulse, LogIn } from 'lucide-react';

const FEATURES = [
  'Book & manage appointments online',
  'View your prescriptions anytime',
  'Access your medical records securely',
];

const CIRCLES = [
  { w: 320, h: 320, top: -80,    left: -80,  opacity: 0.08 },
  { w: 200, h: 200, bottom: 40,  right: -60, opacity: 0.06 },
  { w: 120, h: 120, top: '45%',  left: '55%',opacity: 0.10 },
];

export default function PortalLogin() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, logout }       = useAuth();
  const navigate                = useNavigate();

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);

    if (result.success) {
      if (result.userType === 'staff') {
        // Staff member used the portal login — redirect to staff area
        navigate('/');
      } else if (result.userType === 'patient') {
        navigate('/portal');
      } else {
        // Auth succeeded but no portal profile found
        await logout();
        setError('No patient portal account found. Please contact the hospital administration.');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="portal-login-page">

      {/* ── Left panel ── */}
      <div className="portal-login-left">
        {CIRCLES.map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: c.w, height: c.h,
            borderRadius: '50%', border: '1px solid #00d68f',
            top: c.top, left: c.left, bottom: c.bottom, right: c.right,
            opacity: c.opacity,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, overflow: 'hidden' }}>
              <img src="/Logo.png" alt="MediCore" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>MediCore</div>
              <div style={{ fontSize: 11, color: '#00d68f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Patient Portal</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <HeartPulse size={20} color="#00d68f" />
            <span style={{ fontSize: 12, color: '#00d68f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Health, Your Control</span>
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 20 }}>
            Manage your<br />
            <span style={{ color: '#00d68f' }}>health journey</span><br />
            online
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 380 }}>
            Book appointments, view prescriptions, track your medical history — all from one secure portal.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(0,214,143,0.2)', border: '1px solid rgba(0,214,143,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d68f' }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="portal-login-right">
        <div className="portal-login-form">

          <div className="portal-login-mobile-brand">
            <div style={{ width: 52, height: 52, borderRadius: 13, flexShrink: 0, overflow: 'hidden' }}>
              <img src="/Logo.png" alt="MediCore" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>MediCore</div>
              <div style={{ fontSize: 10, color: '#00d68f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Patient Portal</div>
            </div>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Patient Sign In</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>
            Access your personal health portal
          </p>

          {error && <div className="login-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input
                id="portal-email"
                type="email"
                className="form-control"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError(''); }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
              <label className="form-label">Password</label>
              <input
                id="portal-password"
                className="form-control"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(''); }}
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 12, top: 34, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              id="portal-login-btn"
              type="submit"
              className="portal-login-btn"
              disabled={loading}
            >
              {loading
                ? <span style={{ animation: 'pulse 1s infinite' }}>Signing in…</span>
                : <><LogIn size={16} /> Sign In to Portal</>
              }
            </button>
          </form>

          <div className="login-portal-divider">
            <span>Are you a staff member?</span>
            <Link to="/login" className="portal-staff-link">
              Staff Login →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
