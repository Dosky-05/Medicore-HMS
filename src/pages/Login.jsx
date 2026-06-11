import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, X, Mail } from 'lucide-react';
import heroImage from '../assets/login_hero.png';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Auto-clear error after 4 seconds
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
    if (result.success) navigate(result.userType === 'patient' ? '/portal' : '/dashboard');
    else setError(result.error);
  };

  return (
    <div className="login-page">
      {showForgot && (
        <div className="modal-overlay" onClick={() => setShowForgot(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} color="var(--accent)" />
                <span className="modal-title">Forgot Password?</span>
              </div>
              <button className="modal-close" onClick={() => setShowForgot(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Password resets for staff accounts are managed by your hospital administrator.
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 12 }}>
                Please contact <strong style={{ color: 'var(--text-primary)' }}>IT Support</strong> or your system admin to have your password reset.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowForgot(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
      {/* Left Panel */}
      <div className="login-split-left" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="login-split-overlay" />
        <div className="login-split-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="logo-icon" style={{ width: 52, height: 52, borderRadius: 12 }}>
              <img src="/Logo.png" alt="MediCore" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>MediCore</div>
          </div>
          <p className="login-split-quote">"Empowering Healthcare, One Record at a Time"</p>
          <h1 className="login-split-title">Advanced Hospital Management</h1>
          <p className="login-split-desc">Streamlining patient care, empowering medical staff, and optimizing hospital operations from one unified platform.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-split-right">
        <div className="login-card">

          {/* Logo */}
          <div className="login-logo">
            <div className="logo-icon" style={{ width: 50, height: 50, borderRadius: 11 }}>
              <img src="/Logo.png" alt="MediCore" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>MediCore</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Hospital Management System</div>
            </div>
          </div>

          <h1 className="login-title">Sign In</h1>
          <p className="login-sub">Welcome back! Please enter your details.</p>

          {error && <div className="login-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError(''); }}
                required
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Password</label>
              <input
                id="password"
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

            {/* Forgot Password */}
            <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 20 }}>
              <span className="login-forgot" onClick={() => setShowForgot(true)}>Forgot password?</span>
            </div>

            <button
              id="login-btn"
              className="btn btn-primary"
              type="submit"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14 }}
              disabled={loading}
            >
              {loading
                ? <span style={{ animation: 'pulse 1s infinite' }}>Signing in…</span>
                : <><LogIn size={16} /> Sign In</>
              }
            </button>
          </form>

          <div style={{
            marginTop: 20, padding: '10px 14px', borderRadius: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>First time logging in?</strong>
            {' '}Use the temporary password provided by your administrator, then go to{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Settings → System</strong> to change it.
          </div>

        </div>
      </div>
    </div>
  );
}
