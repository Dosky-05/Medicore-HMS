import { useNavigate } from 'react-router-dom';
import { Stethoscope, User, ArrowRight, Activity } from 'lucide-react';
import heroImage from '../assets/login_hero.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Background */}
      <div className="landing-bg" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="landing-bg-overlay" />
      </div>

      <div className="landing-content">
        {/* Logo */}
        <div className="landing-logo">
          <div className="logo-icon" style={{ width: 52, height: 52, borderRadius: 12 }}>
            <img src="/Logo.png" alt="MediCore" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>MediCore</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Hospital Management System
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="landing-headline">
          <div className="landing-badge">
            <Activity size={13} />
            <span>Welcome</span>
          </div>
          <h1 className="landing-title">How are you accessing<br />MediCore today?</h1>
          <p className="landing-subtitle">Select your portal to continue</p>
        </div>

        {/* Portal Cards */}
        <div className="landing-cards">
          <button className="landing-card" onClick={() => navigate('/portal/login')}>
            <div className="landing-card-icon landing-card-icon--patient">
              <User size={28} />
            </div>
            <div className="landing-card-body">
              <div className="landing-card-title">Patient Portal</div>
              <div className="landing-card-desc">View records, appointments & more</div>
            </div>
            <ArrowRight size={18} className="landing-card-arrow" />
          </button>

          <button className="landing-card" onClick={() => navigate('/login')}>
            <div className="landing-card-icon landing-card-icon--staff">
              <Stethoscope size={28} />
            </div>
            <div className="landing-card-body">
              <div className="landing-card-title">Staff Portal</div>
              <div className="landing-card-desc">Doctors, nurses, and administrators</div>
            </div>
            <ArrowRight size={18} className="landing-card-arrow" />
          </button>
        </div>

        <p className="landing-footer">
          &copy; {new Date().getFullYear()} MediCore &mdash; Advanced Hospital Management
        </p>
      </div>
    </div>
  );
}
