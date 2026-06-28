import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, flagsAPI } from '../api/client';
import { Card, Button, Input, Select, Alert, Badge, Spinner } from '../components/UI';

function AdminLogin({ onSwitchToSignup }) {
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
      if (data.user.role_id !== 2) {
        setError('This portal is for organization admins only');
        return;
      }
      login(data.token, data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="portal-badge portal-badge--admin">Organization Admin Portal</div>
        <h1 className="auth-title">Organization Admin Sign In</h1>
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
          No account? <button className="link-btn" onClick={onSwitchToSignup}>Sign up</button>
        </p>
      </div>
    </div>
  );
}

function AdminSignup({ onSwitchToLogin }) {
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
      const data = await authAPI.signup(form.email, form.password, form.organization_id, 'org_admin');
      login(data.token, data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="portal-badge portal-badge--admin">Organization Admin Portal</div>
        <h1 className="auth-title">Create Organization Admin Account</h1>
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
            onChange={e => setForm(f => ({ ...f, organization_id: parseInt(e.target.value) }))}
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
          Already have an account? <button className="link-btn" onClick={onSwitchToLogin}>Sign in</button>
        </p>
      </div>
    </div>
  );
}

function AdminAuth() {
  const [view, setView] = useState('login');
  return view === 'login'
    ? <AdminLogin onSwitchToSignup={() => setView('signup')} />
    : <AdminSignup onSwitchToLogin={() => setView('login')} />;
}

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ feature_key: '', description: '', enabled: false });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    try {
      const flags = await flagsAPI.list();
      setFlags(flags);
    } catch (err) {
      setError('Failed to load flags');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      const res = await flagsAPI.create(form.feature_key, form.description, form.enabled);
      setFlags(prev => [res, ...prev]);
      setForm({ feature_key: '', description: '', enabled: false });
      setSuccess('Flag created');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create flag');
    } finally {
      setCreating(false);
    }
  }

  async function toggleFlag(flag) {
    try {
      await flagsAPI.update(flag.id, { enabled: !flag.enabled });
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
    } catch (err) {
      setError('Failed to update flag');
    }
  }

  async function deleteFlag(id) {
    if (!window.confirm('Delete this flag?')) return;
    try {
      await flagsAPI.delete(id);
      setFlags(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError('Failed to delete flag');
    }
  }

  function handleLogout() {
    logout();
    navigate('/admin');
  }

  async function saveEdit(flag, newDesc) {
    try {
      await flagsAPI.update(flag.id, { description: newDesc });
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, description: newDesc } : f));
      setEditingId(null);
    } catch (err) {
      setError('Failed to save');
    }
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-header__left">
          <div className="portal-badge portal-badge--admin">Admin</div>
          <div>
            <span className="dash-header__email">{user?.email}</span>
            <span className="dash-header__org"> · {user?.organization_name}</span>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout}>Logout</Button>
      </header>

      <main className="dash-main">
        <h2 className="section-title">Feature Flags</h2>

        <Card className="create-form-card">
          <h3 className="card-title">New Feature Flag</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <Input
                label="Feature Key"
                value={form.feature_key}
                onChange={e => setForm(f => ({ ...f, feature_key: e.target.value }))}
                placeholder="e.g. dark_mode"
                required
              />
              <Input
                label="Description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What does this flag do?"
              />
            </div>
            <div className="toggle-row">
              <label className="toggle-label">
                <span>Enable immediately</span>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                  className="toggle-checkbox"
                />
                <span className="toggle-switch" />
              </label>
              <Button type="submit" loading={creating}>Add Flag</Button>
            </div>
            {formError && <Alert>{formError}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
          </form>
        </Card>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <Spinner />
        ) : flags.length === 0 ? (
          <div className="empty-state">No feature flags yet. Create your first one above.</div>
        ) : (
          <div className="flags-table-wrap">
            <table className="flags-table">
              <thead>
                <tr>
                  <th>Feature Key</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Toggle</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {flags.map(flag => (
                  <tr key={flag.id}>
                    <td><code className="flag-key">{flag.feature_key}</code></td>
                    <td>
                      {editingId === flag.id ? (
                        <EditableDesc
                          initial={flag.description || ''}
                          onSave={desc => saveEdit(flag, desc)}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <span
                          className="desc-text"
                          onClick={() => setEditingId(flag.id)}
                          title="Click to edit"
                        >
                          {flag.description || <span className="muted">Click to add description</span>}
                        </span>
                      )}
                    </td>
                    <td><Badge enabled={flag.enabled} /></td>
                    <td>
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={!!flag.enabled}
                          onChange={() => toggleFlag(flag)}
                          className="toggle-checkbox"
                        />
                        <span className="toggle-switch" />
                      </label>
                    </td>
                    <td className="muted">{new Date(flag.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button variant="danger-ghost" onClick={() => deleteFlag(flag.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function EditableDesc({ initial, onSave, onCancel }) {
  const [val, setVal] = useState(initial);
  return (
    <div className="edit-desc">
      <input
        className="field-input"
        value={val}
        onChange={e => setVal(e.target.value)}
        autoFocus
      />
      <Button variant="small" onClick={() => onSave(val)}>Save</Button>
      <Button variant="ghost" onClick={onCancel} style={{ fontSize: 12 }}>Cancel</Button>
    </div>
  );
}

export { AdminAuth, AdminDashboard };
