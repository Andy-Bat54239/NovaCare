import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { medicines as allMedicines } from '../../data/medicines';
import MedicineImage from '../../components/MedicineImage';
import { ShoppingCart, Trash2, Minus, Plus } from 'lucide-react';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getTotal } = useCart();
  const total = getTotal();

  if (cartItems.length === 0) {
    return (
      <div className="shop-section">
        <div className="empty-state">
          <ShoppingCart size={64} />
          <h3>Your cart is empty</h3>
          <p>Browse our medicine catalog and add items to your cart</p>
          <Link to="/shop/medicines" className="btn btn-primary mt-3">Browse Medicines</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-section" style={{ paddingTop: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Shopping Cart ({cartItems.length} items)</h2>

      <div className="cart-layout">
        <div>
          {cartItems.map(item => (
            <div key={item.medicineId} className="cart-item">
              <MedicineImage medicine={allMedicines.find(m => m.id === item.medicineId) || { brandName: item.name, category: item.category || 'default', form: 'Tablet', strength: '' }} size="sm" className="cart-item-image" />
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p>{item.genericName} · RWF {item.price.toLocaleString()} each</p>
              </div>
              <div className="quantity-selector">
                <button onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}>+</button>
              </div>
              <div className="cart-item-price">RWF {(item.price * item.quantity).toLocaleString()}</div>
              <button className="btn-ghost" onClick={() => removeFromCart(item.medicineId)}><Trash2 size={18} color="var(--danger)" /></button>
            </div>
          ))}
          <Link to="/shop/medicines" style={{ display: 'inline-block', marginTop: 16, fontSize: '0.9rem' }}>Continue Shopping</Link>
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="cart-summary-row"><span>Subtotal</span><span>RWF {total.toLocaleString()}</span></div>
          <div className="cart-summary-row"><span>Shipping</span><span>Free</span></div>
          <div className="cart-summary-row total"><span>Total</span><span>RWF {total.toLocaleString()}</span></div>
          <Link to="/shop/order" className="btn btn-primary">Proceed to Order</Link>
        </div>
      </div>
    </div>
  );
}
