import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, flagsAPI } from '../api/client';
import { Card, Button, Input, Select, Alert, Spinner } from '../components/UI';

function UserLogin({ onSwitchToSignup }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.login(form.email, form.password);
      if (data.user.role_id !== 3) {
        setError('This portal is for end users only');
        return;
      }
      login(data.token, data.user);
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="portal-badge portal-badge--user">User Portal</div>
        <h1 className="auth-title">Sign In</h1>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@yourcompany.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            required
          />
          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 8 }}>
            Sign In
          </Button>
        </form>
        <p className="auth-switch">
          No account?{' '}
          <button className="link-btn" onClick={onSwitchToSignup}>Sign up</button>
        </p>
      </div>
    </div>
  );
}

function UserSignup({ onSwitchToLogin }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', organization_id: '' });
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authAPI.getOrganizations().then(r => setOrgs(r));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.signup(form.email, form.password, form.organization_id, 'end_user');
      login(data.token, data.user);
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="portal-badge portal-badge--user">User Portal</div>
        <h1 className="auth-title">Create Account</h1>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@yourcompany.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Min. 6 characters"
            required
          />
          <Select
            label="Organization"
            value={form.organization_id}
            onChange={e => setForm(f => ({ ...f, organization_id: e.target.value }))}
            required
          >
            <option value="">Select your organization</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 8 }}>
            Create Account
          </Button>
        </form>
        <p className="auth-switch">
          Already have an account?{' '}
          <button className="link-btn" onClick={onSwitchToLogin}>Sign in</button>
        </p>
      </div>
    </div>
  );
}

function UserAuth() {
  const [view, setView] = useState('login');
  return view === 'login'
    ? <UserLogin onSwitchToSignup={() => setView('signup')} />
    : <UserSignup onSwitchToLogin={() => setView('login')} />;
}

function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [featureKey, setFeatureKey] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  async function handleCheck(e) {
    e.preventDefault();
    if (!featureKey.trim()) return;
    setChecking(true);
    setError('');
    setResult(null);
    try {
      const res = await flagsAPI.check(featureKey.trim().toLowerCase());
      const result = {
        enabled: res.enabled === 1,
        exists: true,
        message: res.enabled === 1 ? 'This feature is enabled' : 'This feature is disabled'
      };
      setResult(result);
      setHistory(prev => [
        { key: featureKey.trim(), ...result, time: new Date() },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      if (err.response?.status === 404) {
        const result = {
          enabled: false,
          exists: false,
          message: 'Feature flag not found'
        };
        setResult(result);
        setHistory(prev => [
          { key: featureKey.trim(), ...result, time: new Date() },
          ...prev.slice(0, 4),
        ]);
      } else {
        setError(err.response?.data?.error || 'Check failed');
      }
    } finally {
      setChecking(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/user');
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-header__left">
          <div className="portal-badge portal-badge--user">User</div>
          <div>
            <span className="dash-header__email">{user?.email}</span>
            <span className="dash-header__org"> · {user?.organization_name}</span>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout}>Logout</Button>
      </header>

      <main className="dash-main dash-main--centered">
        <h2 className="section-title">Feature Flag Checker</h2>
        <p className="section-sub">
          Enter a feature key to check if it's enabled for <strong>{user?.organization_name}</strong>
        </p>

        <Card className="checker-card">
          <form onSubmit={handleCheck}>
            <div className="checker-row">
              <Input
                label="Feature Key"
                value={featureKey}
                onChange={e => setFeatureKey(e.target.value)}
                placeholder="e.g. dark_mode"
                required
              />
              <Button type="submit" loading={checking} style={{ alignSelf: 'flex-end' }}>
                Check
              </Button>
            </div>
            {error && <Alert>{error}</Alert>}
          </form>

          {result && (
            <div className={`check-result check-result--${result.enabled ? 'on' : 'off'}`}>
              <div className="check-result__body">
                <div className="check-result__message">{result.message}</div>
              </div>
            </div>
          )}
        </Card>

        {history.length > 0 && (
          <Card className="history-card">
            <h3 className="card-title">Recent Checks</h3>
            <ul className="history-list">
              {history.map((h, i) => (
                <li key={i} className="history-item">
                  <code className="flag-key">{h.key}</code>
                  <span className={`history-status ${h.enabled ? 'history-status--on' : 'history-status--off'}`}>
                    {!h.exists ? 'Not found' : h.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <span className="history-time muted">
                    {h.time.toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
}

export { UserAuth, UserDashboard };
