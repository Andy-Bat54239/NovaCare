import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pill, KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

export default function ChangePassword() {
  const { currentUser, clearMustChangePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/users/me/force-password', { newPassword: form.newPassword });
      clearMustChangePassword();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 420 }}>
        <div className="login-brand">
          <div className="login-brand-icon"><Pill size={28} /></div>
          <h1>Nova<span>Care</span></h1>
          <p>Set Your Password</p>
        </div>

        <div style={{
          background: 'var(--warning-bg, #fffbeb)',
          border: '1px solid var(--warning-border, #fcd34d)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 14,
          color: 'var(--warning-text, #92400e)',
        }}>
          <strong>Welcome, {currentUser?.firstName}!</strong> Your account was created with a temporary
          password. Please set a new password to continue.
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">New Password</label>
            <input
              type={showNew ? 'text' : 'password'}
              className="form-input"
              placeholder="At least 6 characters"
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              required
              autoFocus
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              style={{ position: 'absolute', right: 12, top: 36, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Confirm New Password</label>
            <input
              type={showConfirm ? 'text' : 'password'}
              className="form-input"
              placeholder="Re-enter your new password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              required
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              style={{ position: 'absolute', right: 12, top: 36, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={18} />
            {saving ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, textDecoration: 'underline' }}
          >
            Sign out and log in with a different account
          </button>
        </div>
      </div>
    </div>
  );
}
