import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateMyProfile, changeMyPassword } from '../../api/users';
import { Save, User, Bell, Monitor, Lock } from 'lucide-react';

const PREFS_KEY = 'novacare_prefs';

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

export default function Settings() {
  const { currentUser, setCurrentUser } = useAuth();
  const stored = loadPrefs();

  const [profile, setProfile] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
  });
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdMsg, setPwdMsg] = useState(null);
  const [pwdSaving, setPwdSaving] = useState(false);

  const [notifications, setNotifications] = useState(
    stored.notifications || { email: true, lowStock: true, orderUpdates: true, salesReports: false },
  );
  const [display, setDisplay] = useState(
    stored.display || { theme: 'light', itemsPerPage: '10' },
  );
  const [prefsMsg, setPrefsMsg] = useState(null);

  // Apply persisted theme on mount / whenever display.theme changes.
  useEffect(() => {
    applyTheme(display.theme);
  }, [display.theme]);

  const Toggle = ({ checked, onChange }) => (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  );

  const saveProfile = async () => {
    setProfileMsg(null);
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      setProfileMsg({ type: 'danger', text: 'First and last name are required.' });
      return;
    }
    setProfileSaving(true);
    try {
      const updated = await updateMyProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
      });
      // Keep AuthContext + localStorage in sync so the topbar/sidebar reflect the change.
      if (setCurrentUser && currentUser) {
        const next = { ...currentUser, firstName: updated.firstName, lastName: updated.lastName };
        setCurrentUser(next);
      }
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    setPwdMsg(null);
    if (!pwd.currentPassword || !pwd.newPassword) {
      setPwdMsg({ type: 'danger', text: 'Please fill in both password fields.' });
      return;
    }
    if (pwd.newPassword.length < 6) {
      setPwdMsg({ type: 'danger', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      setPwdMsg({ type: 'danger', text: 'New password and confirmation do not match.' });
      return;
    }
    setPwdSaving(true);
    try {
      await changeMyPassword(pwd.currentPassword, pwd.newPassword);
      setPwdMsg({ type: 'success', text: 'Password changed.' });
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwdSaving(false);
    }
  };

  const savePreferences = () => {
    savePrefs({ notifications, display });
    applyTheme(display.theme);
    setPrefsMsg({ type: 'success', text: 'Preferences saved to this device.' });
    setTimeout(() => setPrefsMsg(null), 2500);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      {/* -------- Profile -------- */}
      <div className="settings-section">
        <h3><User size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Profile</h3>
        {profileMsg && <div className={`alert alert-${profileMsg.type}`}>{profileMsg.text}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={currentUser?.email || ''} readOnly style={{ opacity: 0.6 }} />
          <small className="text-muted">Email is managed by an administrator.</small>
        </div>
        <button className="btn btn-primary" onClick={saveProfile} disabled={profileSaving}>
          <Save size={18} /> {profileSaving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>

      {/* -------- Change Password -------- */}
      <div className="settings-section">
        <h3><Lock size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Change Password</h3>
        {pwdMsg && <div className={`alert alert-${pwdMsg.type}`}>{pwdMsg.text}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={pwd.confirmPassword}
              onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={changePassword} disabled={pwdSaving}>
          <Save size={18} /> {pwdSaving ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      {/* -------- Notifications -------- */}
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
            <Toggle checked={!!notifications[key]} onChange={() => setNotifications({ ...notifications, [key]: !notifications[key] })} />
          </div>
        ))}
      </div>

      {/* -------- Display -------- */}
      <div className="settings-section">
        <h3><Monitor size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Display</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Theme</label>
            <select className="form-select" value={display.theme} onChange={(e) => setDisplay({ ...display, theme: e.target.value })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Items Per Page</label>
            <select className="form-select" value={display.itemsPerPage} onChange={(e) => setDisplay({ ...display, itemsPerPage: e.target.value })}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        {prefsMsg && <div className={`alert alert-${prefsMsg.type}`}>{prefsMsg.text}</div>}
        <button className="btn btn-primary" onClick={savePreferences}>
          <Save size={18} /> Save Preferences
        </button>
      </div>
    </div>
  );
}
