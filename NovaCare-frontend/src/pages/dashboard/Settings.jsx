import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branches } from '../../data/branches';
import { Save, User, Bell, Monitor, Building2 } from 'lucide-react';

export default function Settings() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({ firstName: currentUser?.firstName || '', lastName: currentUser?.lastName || '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({ email: true, lowStock: true, orderUpdates: true, salesReports: false });
  const [display, setDisplay] = useState({ theme: 'light', itemsPerPage: '10' });

  const Toggle = ({ checked, onChange }) => (
    <label className="toggle"><input type="checkbox" checked={checked} onChange={onChange} /><span className="toggle-slider" /></label>
  );

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
          <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={profile.currentPassword} onChange={e => setProfile({ ...profile, currentPassword: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={profile.newPassword} onChange={e => setProfile({ ...profile, newPassword: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" value={profile.confirmPassword} onChange={e => setProfile({ ...profile, confirmPassword: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary" onClick={() => { console.log('Save profile:', profile); alert('Profile updated!'); }}><Save size={18} /> Save Profile</button>
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
            <select className="form-select" value={display.theme} onChange={e => setDisplay({ ...display, theme: e.target.value })}>
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
