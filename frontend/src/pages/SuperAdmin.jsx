import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { superAdminAPI } from '../api/client';
import { Card, Button, Input, Alert, Spinner } from '../components/UI';

function SuperAdminLogin() {
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
      const data = await superAdminAPI.login(form.email, form.password);
      login(data.token, { email: data.email, role_id: data.role_id });
      navigate('/super-admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="portal-badge portal-badge--super">Super Admin</div>
        <h1 className="auth-title">System Control</h1>
        <p className="auth-sub">Restricted access — administrators only</p>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="superadmin@system.com"
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
      </div>
    </div>
  );
}

function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    try {
      const orgs = await superAdminAPI.listOrganizations();
      setOrgs(orgs);
    } catch (err) {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrg(e) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const res = await superAdminAPI.createOrganization(newOrgName.trim());
      fetchOrgs();
      setNewOrgName('');
      setSuccess(`Organization "${res.name}" created successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/super-admin');
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-header__left">
          <div className="portal-badge portal-badge--super">Super Admin</div>
          <span className="dash-header__email">{user?.email}</span>
        </div>
        <Button variant="ghost" onClick={handleLogout}>Logout</Button>
      </header>

      <main className="dash-main">
        <h2 className="section-title">Organizations</h2>

        <Card className="create-form-card">
          <h3 className="card-title">Create New Organization</h3>
          <form onSubmit={handleCreateOrg} className="inline-form">
            <Input
              label="Organization Name"
              value={newOrgName}
              onChange={e => setNewOrgName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
            <Button type="submit" loading={creating}>Create Organization</Button>
          </form>
          {error && <Alert>{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}
        </Card>

        <div className="org-grid">
          {loading ? (
            <Spinner />
          ) : orgs.length === 0 ? (
            <div className="empty-state">No organizations yet. Create one above.</div>
          ) : (
            orgs.map(org => (
              <Card key={org.id} className="org-card">
                <div className="org-card__header">
                  <div>
                    <div className="org-card__name">{org.name}</div>
                    <div className="org-card__slug">/{org.slug}</div>
                  </div>
                  <div className="org-card__id">#{org.id}</div>
                </div>
                <div className="org-card__stats">
                  <span className="stat"><strong>{org.user_count}</strong> users</span>
                  <span className="stat"><strong>{org.flag_count}</strong> flags</span>
                  <span className="stat">{new Date(org.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export { SuperAdminLogin, SuperAdminDashboard };
