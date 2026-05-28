export default function StatCard({ icon, label, value, change, changeType = 'up', color = 'var(--accent)' }) {
  return (
    <div className="stat-card" style={{ '--card-color': color }}>
      <div className="stat-icon" style={{ background: `${color}18` }}>
        <span style={{ color, fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && (
          <div className={`stat-change ${changeType}`}>
            {changeType === 'up' ? '↑' : '↓'} {change}
          </div>
        )}
      </div>
    </div>
  );
}
