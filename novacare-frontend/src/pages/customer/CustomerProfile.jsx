import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateMyProfile, changeMyPassword } from '../../api/users';
import { getMyCustomerProfile, updateMyCustomerProfile } from '../../api/customers';
import { User, Phone, MapPin, Lock, Save, CheckCircle } from 'lucide-react';

export default function CustomerProfile() {
  const { currentUser, setCurrentUser } = useAuth();

  // Personal info (User record)
  const [info, setInfo] = useState({ firstName: '', lastName: '' });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');

  // Contact details (Customer record)
  const [contact, setContact] = useState({ phone: '', address: '' });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  // Password
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setInfo({ firstName: currentUser.firstName || '', lastName: currentUser.lastName || '' });
    }
    getMyCustomerProfile()
      .then(data => {
        if (data) setContact({ phone: data.phone || '', address: data.address || '' });
      })
      .catch(() => {});
  }, [currentUser]);

  const handleInfoSave = async (e) => {
    e.preventDefault();
    setInfoSaving(true); setInfoSuccess(''); setInfoError('');
    try {
      const updated = await updateMyProfile(info);
      setCurrentUser(prev => ({ ...prev, firstName: updated.firstName, lastName: updated.lastName }));
      setInfoSuccess('Name updated successfully.');
    } catch {
      setInfoError('Failed to update name. Please try again.');
    } finally {
      setInfoSaving(false);
    }
  };

  const handleContactSave = async (e) => {
    e.preventDefault();
    setContactSaving(true); setContactSuccess(''); setContactError('');
    try {
      await updateMyCustomerProfile({ phone: contact.phone, address: contact.address });
      setContactSuccess('Contact details saved and added to your customer profile.');
    } catch {
      setContactError('Failed to save contact details. Please try again.');
    } finally {
      setContactSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (pwd.next !== pwd.confirm) { setPwdError('New passwords do not match.'); return; }
    if (pwd.next.length < 6) { setPwdError('Password must be at least 6 characters.'); return; }
    setPwdSaving(true);
    try {
      await changeMyPassword(pwd.current, pwd.next);
      setPwdSuccess('Password changed successfully.');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwdSaving(false);
    }
  };

  const initials = currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase() : '?';

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>My Profile</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and contact information</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Left — avatar card */}
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, margin: '0 auto 16px' }}>
            {initials}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>
            {currentUser?.firstName} {currentUser?.lastName}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>{currentUser?.email}</div>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 999, background: '#f0fdf4', color: '#15803d', fontWeight: 700, fontSize: '0.78rem' }}>
            Customer
          </span>
        </div>

        {/* Right — forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Personal info */}
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color="#3b82f6" />
              </div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Personal Information</h3>
            </div>

            {infoSuccess && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', color: '#15803d', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.875rem' }}><CheckCircle size={15} />{infoSuccess}</div>}
            {infoError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.875rem' }}>{infoError}</div>}

            <form onSubmit={handleInfoSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={info.firstName} onChange={e => setInfo({ ...info, firstName: e.target.value })} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={info.lastName} onChange={e => setInfo({ ...info, lastName: e.target.value })} required />
                </div>
              </div>
              <div className="form-group" style={{ margin: '0 0 16px' }}>
                <label className="form-label">Email</label>
                <input className="form-input" value={currentUser?.email || ''} readOnly
                  style={{ background: 'var(--bg-base, #f8fafc)', cursor: 'default', color: 'var(--text-muted)' }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={infoSaving} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Save size={16} /> {infoSaving ? 'Saving...' : 'Save Name'}
              </button>
            </form>
          </div>

          {/* Contact details */}
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={18} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Contact Details</h3>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Adding your phone and location helps staff process your orders faster. This information is saved to your customer profile.
            </p>

            {contactSuccess && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', color: '#15803d', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.875rem' }}><CheckCircle size={15} />{contactSuccess}</div>}
            {contactError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.875rem' }}>{contactError}</div>}

            <form onSubmit={handleContactSave}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={13} /> Phone Number</label>
                <input className="form-input" placeholder="+250 7XX XXX XXX" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> Location / Address</label>
                <textarea className="form-textarea" rows={3} placeholder="e.g. KG 12 Ave, Kigali, Rwanda" value={contact.address} onChange={e => setContact({ ...contact, address: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={contactSaving} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Save size={16} /> {contactSaving ? 'Saving...' : 'Save Contact Details'}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={18} color="#d97706" />
              </div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Change Password</h3>
            </div>

            {pwdSuccess && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', color: '#15803d', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.875rem' }}><CheckCircle size={15} />{pwdSuccess}</div>}
            {pwdError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.875rem' }}>{pwdError}</div>}

            <form onSubmit={handlePasswordSave}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={pwdSaving} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Lock size={16} /> {pwdSaving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
