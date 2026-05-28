import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, USERS } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, Activity } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(form.username, form.password);
    setLoading(false);
    if (result.success) navigate('/');
    else setError(result.error);
  };

  const quickLogin = (username, password) => {
    setForm({ username, password });
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon" style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#00d4ff,#0099cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}><Activity size={24} color="white" /></div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>MediCore</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Hospital Management System</div>
          </div>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-sub">Sign in to access the hospital dashboard</p>

        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              id="username"
              className="form-control"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
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
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ paddingRight: 40 }}
              required
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              style={{ position: 'absolute', right: 12, top: 34, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button id="login-btn" className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }} disabled={loading}>
            {loading ? <span style={{ animation: 'pulse 1s infinite' }}>Signing in…</span> : <><LogIn size={16} /> Sign In</>}
          </button>
        </form>

        <div className="demo-creds">
          <h4>🔑 Demo Credentials</h4>
          {USERS.map(u => (
            <p key={u.username} style={{ cursor: 'pointer', borderRadius: 4, padding: '2px 4px' }}
              onClick={() => quickLogin(u.username, u.password)}>
              <code>{u.username}</code> / <code>{u.password}</code>
              <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--text-muted)' }}>({u.role})</span>
            </p>
          ))}
          <p style={{ fontSize: 10, marginTop: 6, color: 'var(--text-muted)' }}>Click any row to auto-fill</p>
        </div>
      </div>
    </div>
  );
}
