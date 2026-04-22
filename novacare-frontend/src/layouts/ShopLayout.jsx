import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { uploadPrescriptionForItem, getOrder } from '../api/orders';
import { ShoppingCart, Menu, X, Pill } from 'lucide-react';

// Silently upload any prescriptions that were saved to localStorage by older
// sessions (before server-side upload was wired up). Runs once per shop visit.
async function recoverPendingPrescriptions() {
  const pendingKeys = Object.keys(localStorage).filter(k => k.startsWith('novacare_rx_'));
  if (pendingKeys.length === 0) return;

  for (const key of pendingKeys) {
    const orderId = Number(key.replace('novacare_rx_', ''));
    if (!orderId) continue;
    try {
      const rxList = JSON.parse(localStorage.getItem(key) || '[]');
      const order = await getOrder(orderId);
      if (!order?.items) continue;

      for (const rx of rxList) {
        if (!rx.prescriptionDataUrl) continue;
        const orderItem = order.items.find(
          i => i.medicineId === rx.medicineId && !i.prescriptionImagePath
        );
        if (!orderItem?.id) continue;
        const fetchRes = await fetch(rx.prescriptionDataUrl);
        const blob = await fetchRes.blob();
        const ext = rx.prescriptionName?.split('.').pop() || 'jpg';
        const file = new File([blob], rx.prescriptionName || `prescription.${ext}`, { type: blob.type });
        await uploadPrescriptionForItem(orderId, orderItem.id, file);
      }
      localStorage.removeItem(key);
    } catch (e) {
      // Non-fatal — leave the key for the next attempt
      console.error('Failed to recover prescription for', key, e);
    }
  }
}

export default function ShopLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    recoverPendingPrescriptions();
  }, []);
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const itemCount = getItemCount();

  return (
    <div className="shop-wrapper">
      <nav className="shop-navbar">
        <div className="shop-navbar-inner">
          <Link to="/shop" className="shop-navbar-brand">
            <div className="shop-navbar-brand-icon"><Pill size={20} /></div>
            Nova<span>Care</span>
          </Link>

          <div className={`shop-nav-links ${menuOpen ? 'open' : ''}`}>
            <NavLink to="/shop" end className={({ isActive }) => `shop-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Home</NavLink>
            <NavLink to="/shop/medicines" className={({ isActive }) => `shop-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Medicines</NavLink>
            <NavLink to="/shop/about" className={({ isActive }) => `shop-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>About</NavLink>
            <NavLink to="/shop/contact" className={({ isActive }) => `shop-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Contact</NavLink>
          </div>

          <div className="shop-nav-right">
            <button className="shop-cart-btn" onClick={() => navigate('/shop/cart')}>
              <ShoppingCart size={22} />
              {itemCount > 0 && <span className="shop-cart-count">{itemCount}</span>}
            </button>
            <Link to="/login" className="shop-login-btn">Login</Link>
            <button className="shop-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="shop-content">
        <Outlet />
      </main>

      <footer className="shop-footer">
        <div className="shop-footer-inner">
          <div>
            <h4>NovaCare Pharmacy</h4>
            <p>Your trusted pharmacy partner since 2020. We provide quality medicines and healthcare products across all our branches.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <p><Link to="/shop">Home</Link></p>
            <p><Link to="/shop/medicines">Medicines</Link></p>
            <p><Link to="/shop/about">About Us</Link></p>
            <p><Link to="/shop/contact">Contact</Link></p>
          </div>
          <div>
            <h4>Contact Info</h4>
            <p>+250 788 123 456</p>
            <p>info@novacare.rw</p>
            <p>KN 4 Ave, Nyarugenge</p>
            <p>Kigali, Rwanda</p>
          </div>
          <div>
            <h4>Hours</h4>
            <p>Mon - Fri: 7AM - 9PM</p>
            <p>Saturday: 8AM - 7PM</p>
            <p>Sunday: 9AM - 5PM</p>
            <p>Holidays: 10AM - 3PM</p>
          </div>
        </div>
        <div className="shop-footer-bottom">
          <p>&copy; 2026 NovaCare Pharmacy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
