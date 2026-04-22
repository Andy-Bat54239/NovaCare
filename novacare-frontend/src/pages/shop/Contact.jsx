import { useState, useEffect } from 'react';
import { getBranches } from '../../api/branches';
import { createMessage } from '../../api/contactMessages';
import { Send, Phone, Mail, Clock, MapPin, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', subject: '', branchId: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getBranches()
      .then(data => setBranches((data || []).filter(b => b.isActive)))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createMessage({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        branchId: form.branchId ? Number(form.branchId) : null,
      });
      setSubmitted(true);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="shop-section">
        <div className="success-page">
          <div className="success-icon"><CheckCircle size={40} /></div>
          <h1>Message Sent!</h1>
          <p>Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
          <button className="btn btn-primary mt-3" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', branchId: '', message: '' }); }}>
            Send Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-section" style={{ paddingTop: 32 }}>
      <div className="shop-section-header"><h2>Contact Us</h2><p>We&apos;d love to hear from you</p></div>

      <div className="contact-grid">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch (Optional)</label>
                  <select className="form-select" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                    <option value="">Select a branch...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-textarea" rows={5} required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={18} /> {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="contact-info-card"><Phone size={20} /><div><h4>Phone</h4><p>+250 788 123 456</p><p>+250 722 987 654</p></div></div>
          <div className="contact-info-card"><Mail size={20} /><div><h4>Email</h4><p>info@novacare.rw</p><p>support@novacare.rw</p></div></div>
          <div className="contact-info-card"><Clock size={20} /><div><h4>Operating Hours</h4><p>Mon–Fri: 7AM – 9PM</p><p>Sat: 8AM – 7PM</p><p>Sun: 9AM – 5PM</p></div></div>
          <div className="contact-info-card"><MapPin size={20} /><div><h4>Main Branch</h4><p>KN 4 Ave, Nyarugenge</p><p>Kigali, Rwanda</p></div></div>
        </div>
      </div>
    </div>
  );
}
