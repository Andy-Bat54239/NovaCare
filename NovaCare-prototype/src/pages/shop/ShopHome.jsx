import { Link } from 'react-router-dom';
import { medicines } from '../../data/medicines';
import MedicineImage from '../../components/MedicineImage';
import { Shield, Truck, MapPin, Clock, Heart, Stethoscope, Pill, Droplets, Syringe, Sparkles, Apple, Wind } from 'lucide-react';

const categories = [
  { name: 'Antibiotics', icon: Pill, color: '#ef4444' },
  { name: 'Pain Relief', icon: Droplets, color: '#3b82f6' },
  { name: 'Cardiovascular', icon: Heart, color: '#ec4899' },
  { name: 'Diabetes', icon: Syringe, color: '#8b5cf6' },
  { name: 'Vitamins', icon: Apple, color: '#22c55e' },
  { name: 'Respiratory', icon: Wind, color: '#06b6d4' },
  { name: 'Gastrointestinal', icon: Sparkles, color: '#f59e0b' },
  { name: 'Dermatology', icon: Stethoscope, color: '#d946ef' },
];

export default function ShopHome() {
  const featured = medicines.slice(0, 6);

  return (
    <div>
      <section className="shop-hero">
        <div className="shop-hero-inner">
          <h1>Your Trusted Pharmacy Partner</h1>
          <p>Quality medicines, expert care, and convenience across all our branches. Browse our catalog and order online with confidence.</p>
          <div className="shop-hero-btns">
            <Link to="/shop/medicines" className="btn btn-primary">Browse Medicines</Link>
            <Link to="/shop/contact" className="btn btn-secondary">Contact Us</Link>
          </div>
        </div>
      </section>

      <section className="shop-section">
        <div className="shop-section-header">
          <h2>Browse by Category</h2>
          <p>Find what you need quickly across our medicine categories</p>
        </div>
        <div className="category-grid">
          {categories.map(cat => {
            const Icon = cat.icon;
            const count = medicines.filter(m => m.category === cat.name).length;
            return (
              <Link to={`/shop/medicines?category=${cat.name}`} key={cat.name} className="category-card">
                <div className="category-card-icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                  <Icon size={28} />
                </div>
                <h3>{cat.name}</h3>
                <p>{count} products</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="shop-section" style={{ background: 'var(--gray-50)' }}>
        <div className="shop-section-header">
          <h2>Featured Medicines</h2>
          <p>Popular products across our pharmacy</p>
        </div>
        <div className="product-grid">
          {featured.map(m => (
            <Link to={`/shop/medicines/${m.id}`} key={m.id} className="product-card">
              <MedicineImage medicine={m} size="md" />
              <div className="product-card-body">
                <h3>{m.brandName}</h3>
                <div className="generic-name">{m.genericName}</div>
                <div className="strength-form">{m.strength} · {m.form}</div>
                <div className="product-card-footer">
                  <span className="product-price">RWF {m.price.toLocaleString()}</span>
                  <span className="badge badge-gray">{m.category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-4">
          <Link to="/shop/medicines" className="btn btn-primary btn-lg">View All Medicines</Link>
        </div>
      </section>

      <section className="shop-section">
        <div className="shop-section-header">
          <h2>Why Choose NovaCare?</h2>
          <p>Your health and well-being are our top priorities</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-card-icon"><Shield size={28} /></div>
            <h3>Licensed Pharmacists</h3>
            <p>All our pharmacists are licensed professionals ready to assist you with medication guidance.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><Truck size={28} /></div>
            <h3>Fast Service</h3>
            <p>Quick processing and efficient service to get you your medicines when you need them.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><MapPin size={28} /></div>
            <h3>Multiple Branches</h3>
            <p>Conveniently located branches across the city for easy access to your medications.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><Clock size={28} /></div>
            <h3>Extended Hours</h3>
            <p>Open early and closing late so you can pick up prescriptions on your schedule.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
