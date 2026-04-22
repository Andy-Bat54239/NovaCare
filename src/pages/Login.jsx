import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi, verifyOtp, resendOtp } from '../api/auth';
import { Pill, ArrowLeft, Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';

export default function Login() {
  // 'login' | 'register' | 'otp'
  const [tab, setTab] = useState('login');
  const [step, setStep] = useState('form'); // only used in register flow: 'form' | 'otp'
  const [pendingEmail, setPendingEmail] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(loginForm.email, loginForm.password);
    setLoading(false);
    if (result.success) {
      if (result.mustChangePassword) { navigate('/change-password'); return; }
      navigate(result.role === 4 ? '/customer' : '/dashboard');
    } else {
      setError(result.error);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regForm.password !== regForm.confirm) { setError('Passwords do not match.'); return; }
    if (regForm.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await registerApi({
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        email: regForm.email,
        password: regForm.password,
      });
      setPendingEmail(regForm.email);
      setOtpDigits(['', '', '', '', '', '']);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ─────────────────────────────────────────────────────
  const handleOtpChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return;
    const digits = [...otpDigits];
    digits[idx] = value.slice(-1); // keep only last char
    setOtpDigits(digits);
    if (value && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const code = otpDigits.join('');
    if (code.length < 6) { setError('Please enter the complete 6-digit code.'); return; }
    setLoading(true);
    try {
      await verifyOtp(pendingEmail, code);
      // Switch to login tab with success message
      setTab('login');
      setStep('form');
      setSuccess('Email verified! Please sign in with your new account.');
      setLoginForm({ email: pendingEmail, password: '' });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResending(true);
    try {
      await resendOtp(pendingEmail);
      setSuccess('A new code has been sent to your email.');
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const switchTab = (t) => {
    setTab(t);
    setStep('form');
    setError('');
    setSuccess('');
    setPendingEmail('');
    setOtpDigits(['', '', '', '', '', '']);
  };

  // ── OTP screen ─────────────────────────────────────────────────────────────
  if (tab === 'register' && step === 'otp') {
    return (
      <div className="login-page">
        <Link to="/shop" className="login-back-link">
          <ArrowLeft size={18} />
          Back to Shop
        </Link>
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand-icon"><Pill size={28} /></div>
            <h1>Nova<span>Care</span></h1>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-50, #f0fdfa)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Mail size={24} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
              We sent a 6-digit code to<br />
              <strong style={{ color: 'var(--text-primary)' }}>{pendingEmail}</strong>
            </p>
          </div>

          {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

          <form onSubmit={handleVerifyOtp}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handleOtpPaste}>
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700,
                    border: '2px solid var(--border-color)', borderRadius: 10,
                    background: d ? 'var(--primary-50, #f0fdfa)' : 'var(--bg-base, #f8fafc)',
                    borderColor: d ? 'var(--primary)' : 'var(--border-color)',
                    outline: 'none', transition: 'all 0.15s', color: 'var(--text-primary)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = d ? 'var(--primary)' : 'var(--border-color)'}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || otpDigits.join('').length < 6} style={{ width: '100%', marginBottom: 16 }}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Didn't receive the code?
            </p>
            <button onClick={handleResendOtp} disabled={resending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              <RefreshCw size={14} className={resending ? 'spin' : ''} />
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </div>

          <button onClick={() => switchTab('register')} style={{ marginTop: 20, width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            ← Back to registration
          </button>
        </div>
      </div>
    );
  }

  // ── Main login / register screen ───────────────────────────────────────────
  return (
    <div className="login-page">
      <Link to="/shop" className="login-back-link">
        <ArrowLeft size={18} />
        Back to Shop
      </Link>
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon"><Pill size={28} /></div>
          <h1>Nova<span>Care</span></h1>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => switchTab(t)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'none',
                fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.2s',
              }}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

        {tab === 'login' ? (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="Enter your email"
                value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} className="form-input"
                  placeholder="Enter your password" value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required
                  style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" placeholder="First name" required
                  value={regForm.firstName} onChange={e => setRegForm({ ...regForm, firstName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" placeholder="Last name" required
                  value={regForm.lastName} onChange={e => setRegForm({ ...regForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="your@email.com" required
                value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} className="form-input"
                  placeholder="Min. 6 characters" required value={regForm.password}
                  onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-input" placeholder="Repeat password" required
                value={regForm.confirm} onChange={e => setRegForm({ ...regForm, confirm: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
