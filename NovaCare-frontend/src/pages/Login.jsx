import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pill, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

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
          <p>Staff Management Portal</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="login-remember">
            <label className="form-checkbox-label">
              <input type="checkbox" /> Remember me
            </label>
          </div>
          <button type="submit" className="btn btn-primary">Sign In</button>
        </form>

        <div className="login-demo-hint">
          <strong>Demo Credentials</strong>
          Admin: admin@novacare.com / admin123<br />
          Manager: rachel@novacare.com / manager123<br />
          Pharmacist: james@novacare.com / pharma123
        </div>
      </div>
    </div>
  );
}
