import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const portals = [
    {
      id: 'super',
      label: 'Super Admin Portal',
      path: '/super-admin',
    },
    {
      id: 'admin',
      label: 'Organization Admin Portal',
      path: '/admin',
    },
    {
      id: 'user',
      label: 'End User Portal',
      path: '/user',
    },
  ];

  return (
    <div className="landing">
      <div className="landing__hero">
        <h1 className="landing__title">Feature Flag Management</h1>
        <p className="landing__sub">
          Multi-tenant feature flag system — select your portal to continue
        </p>
      </div>

      <div className="portal-grid">
        {portals.map(p => (
          <button
            key={p.id}
            className="portal-card"
            onClick={() => navigate(p.path)}
          >
            <div className="portal-card__icon">{p.icon}</div>
            <div className={`portal-badge ${p.badge}`}>{p.label}</div>
            <p className="portal-card__desc">{p.desc}</p>
            <span className="portal-card__hint">{p.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
