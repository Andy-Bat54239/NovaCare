import { branches } from '../../data/branches';
import { medicines } from '../../data/medicines';
import { Heart, Target, Eye, MapPin, Phone } from 'lucide-react';

export default function About() {
  return (
    <div>
      <section className="about-hero">
        <h1>About NovaCare Pharmacy</h1>
        <p>Dedicated to providing quality healthcare and pharmaceutical services to our community since 2020.</p>
      </section>

      <div className="about-stats">
        <div className="about-stat-card"><h3>6+</h3><p>Years of Service</p></div>
        <div className="about-stat-card"><h3>{branches.filter(b => b.isActive).length}</h3><p>Active Branches</p></div>
        <div className="about-stat-card"><h3>{medicines.length}+</h3><p>Medicines</p></div>
        <div className="about-stat-card"><h3>10K+</h3><p>Happy Customers</p></div>
      </div>

      <section className="shop-section">
        <div className="shop-section-header"><h2>Our Mission & Values</h2></div>
        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div className="feature-card">
            <div className="feature-card-icon"><Target size={28} /></div>
            <h3>Our Mission</h3>
            <p>To make quality healthcare accessible and affordable for everyone in our community through reliable pharmaceutical services and expert guidance.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><Eye size={28} /></div>
            <h3>Our Vision</h3>
            <p>To become the most trusted pharmacy network in the region, known for our commitment to patient care, innovation, and community health.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><Heart size={28} /></div>
            <h3>Our Values</h3>
            <p>Integrity, compassion, and excellence guide everything we do. We put our patients first and strive for the highest standards of pharmaceutical care.</p>
          </div>
        </div>
      </section>

      <section className="shop-section" style={{ background: 'var(--gray-50)' }}>
        <div className="shop-section-header"><h2>Our Branches</h2><p>Visit us at any of our convenient locations</p></div>
        <div className="features-grid">
          {branches.map(b => (
            <div key={b.id} className="feature-card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3>{b.name}</h3>
                <span className={`badge ${b.isActive ? 'badge-success' : 'badge-danger'}`}>{b.isActive ? 'Open' : 'Closed'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.9rem' }}>{b.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                <Phone size={16} />
                <span style={{ fontSize: '0.9rem' }}>{b.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
