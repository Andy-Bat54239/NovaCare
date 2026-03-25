import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { ShoppingCart, Menu, X, Pill, Sun, Moon } from 'lucide-react';

export default function ShopLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { getItemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
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
            <button className="shop-theme-btn" onClick={toggleTheme} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="shop-cart-btn" onClick={() => navigate('/shop/cart')}>
              <ShoppingCart size={22} />
              {itemCount > 0 && <span className="shop-cart-count">{itemCount}</span>}
            </button>
            <Link to="/login" className="shop-login-btn">Staff Login</Link>
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
            <p>Your trusted pharmacy partner in Rwanda since 2020. We provide quality medicines and healthcare products across all our branches in Kigali.</p>
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
            <p>+250 788 100 201</p>
            <p>info@novacare.rw</p>
            <p>KN 4 Ave, Nyarugenge</p>
            <p>Kigali, Rwanda</p>
          </div>
          <div>
            <h4>Hours</h4>
            <p>Mon - Fri: 8AM - 9PM</p>
            <p>Saturday: 9AM - 7PM</p>
            <p>Sunday: 10AM - 5PM</p>
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
