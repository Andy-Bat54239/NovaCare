import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const [step, setStep] = useState('form') // 'form', 'register', 'otp', or 'signin'
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, register, verifyOtp, resendOtp } = useAuth()
  const navigate = useNavigate()

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (error) {
      setError(error.message || 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await register(firstName, lastName, email, password)
      setStep('otp')
    } catch (error) {
      setError(error.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await verifyOtp(email, otp)
      setStep('signin')
      setPassword('')
      setOtp('')
    } catch (error) {
      setError(error.message || 'OTP verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 30, color: '#1f2937' }}>NovaCare Pharmacy</h1>

        {step === 'form' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
              <button style={{ flex: 1, padding: 12, border: '2px solid #3b82f6', background: '#3b82f6', color: 'white', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
              <button style={{ flex: 1, padding: 12, border: '2px solid #e5e7eb', background: 'transparent', color: '#9ca3af', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }} onClick={() => { setStep('register'); setError(''); }}>Create Account</button>
            </div>
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
            <form onSubmit={handleSignIn}>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16, fontSize: 14 }} required />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 24, fontSize: 14 }} required />
              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        )}

        {step === 'register' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
              <button style={{ flex: 1, padding: 12, border: '2px solid #e5e7eb', background: 'transparent', color: '#9ca3af', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }} onClick={() => setStep('form')}>Sign In</button>
              <button style={{ flex: 1, padding: 12, border: '2px solid #3b82f6', background: '#3b82f6', color: 'white', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Create Account</button>
            </div>
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
            <form onSubmit={handleRegister}>
              <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, fontSize: 14 }} required />
              <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, fontSize: 14 }} required />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, fontSize: 14 }} required />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 24, fontSize: 14 }} required />
              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <p style={{ textAlign: 'center', marginBottom: 20, color: '#6b7280' }}>Enter the OTP sent to {email}</p>
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
            <input type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16, fontSize: 14, textAlign: 'center' }} required maxLength="6" />
            <button type="submit" disabled={isLoading} style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginBottom: 12, opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" onClick={async () => { setIsLoading(true); try { await resendOtp(email); setError(''); } catch (err) { setError(err.message || 'Failed to resend OTP'); } finally { setIsLoading(false); } }} style={{ width: '100%', padding: 12, background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Resend OTP
            </button>
          </form>
        )}

        {step === 'signin' && (
          <div>
            <p style={{ textAlign: 'center', marginBottom: 20, color: '#10b981' }}>✓ Account created! Now sign in.</p>
            <button onClick={() => { setStep('form'); setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setError(''); }} style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
