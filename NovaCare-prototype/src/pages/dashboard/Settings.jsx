import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { branches } from '../../data/branches';
import { Save, User, Bell, Monitor, Building2, Eye, EyeOff } from 'lucide-react';

function PasswordInput({ value, onChange, show, onToggle }) {
  return (
    <div style={{ position: 'relative' }}>
      <input className="form-input" type={show ? 'text' : 'password'} value={value} onChange={onChange} style={{ paddingRight: 44 }} />
      <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle"><input type="checkbox" checked={checked} onChange={onChange} /><span className="toggle-slider" /></label>
  );
}

export default function Settings() {
  const { currentUser, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileMessage, setProfileMessage] = useState('');
  const [profile, setProfile] = useState({ firstName: currentUser?.firstName || '', lastName: currentUser?.lastName || '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [notifications, setNotifications] = useState({ email: true, lowStock: true, orderUpdates: true, salesReports: false });
  const [display, setDisplay] = useState({ itemsPerPage: '10' });

  const togglePassword = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

  return (
    <div>
      <div className="page-header"><h1>Settings</h1></div>

      <div className="settings-section">
        <h3><User size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Profile Settings</h3>
        <div className="form-row">
          <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={currentUser?.email || ''} readOnly style={{ opacity: 0.6 }} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Current Password</label><PasswordInput value={profile.currentPassword} onChange={e => setProfile({ ...profile, currentPassword: e.target.value })} show={showPasswords.current} onToggle={() => togglePassword('current')} /></div>
          <div className="form-group"><label className="form-label">New Password</label><PasswordInput value={profile.newPassword} onChange={e => setProfile({ ...profile, newPassword: e.target.value })} show={showPasswords.new} onToggle={() => togglePassword('new')} /></div>
          <div className="form-group"><label className="form-label">Confirm Password</label><PasswordInput value={profile.confirmPassword} onChange={e => setProfile({ ...profile, confirmPassword: e.target.value })} show={showPasswords.confirm} onToggle={() => togglePassword('confirm')} /></div>
        </div>
        {profileMessage && <div className="alert alert-success" style={{ marginBottom: 12 }}>{profileMessage}</div>}
        <button className="btn btn-primary" onClick={() => {
          if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
            setProfileMessage('');
            alert('New password and confirmation do not match.');
            return;
          }
          const result = updateProfile({ firstName: profile.firstName, lastName: profile.lastName });
          if (result.success) {
            setProfileMessage('Profile updated successfully!');
            setProfile(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            setTimeout(() => setProfileMessage(''), 3000);
          }
        }}><Save size={18} /> Save Profile</button>
      </div>

      <div className="settings-section">
        <h3><Bell size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Notification Preferences</h3>
        {[
          { key: 'email', label: 'Email Notifications', desc: 'Receive email notifications for important events' },
          { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Get notified when medicine stock is running low' },
          { key: 'orderUpdates', label: 'Order Updates', desc: 'Notifications for new and updated orders' },
          { key: 'salesReports', label: 'Daily Sales Reports', desc: 'Receive daily sales summary via email' },
        ].map(({ key, label, desc }) => (
          <div className="settings-toggle-row" key={key}>
            <div className="settings-toggle-info"><h4>{label}</h4><p>{desc}</p></div>
            <Toggle checked={notifications[key]} onChange={() => setNotifications({ ...notifications, [key]: !notifications[key] })} />
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h3><Monitor size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Display Settings</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Theme</label>
            <select className="form-select" value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Items Per Page</label>
            <select className="form-select" value={display.itemsPerPage} onChange={e => setDisplay({ ...display, itemsPerPage: e.target.value })}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {currentUser?.role === 1 && (
        <div className="settings-section">
          <h3><Building2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Branch Settings (Admin)</h3>
          <div className="form-group">
            <label className="form-label">Default Branch</label>
            <select className="form-select">{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          </div>
          <button className="btn btn-primary" onClick={() => alert('Settings saved!')}><Save size={18} /> Save</button>
        </div>
      )}
    </div>
  );
}
