import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('novacare_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('novacare_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (medicine, qty = 1, prescriptionFile = null) => {
    const addItem = (prescriptionDataUrl = null) => {
      setCartItems(prev => {
        const existing = prev.find(item => item.medicineId === medicine.id);
        if (existing) {
          return prev.map(item =>
            item.medicineId === medicine.id
              ? {
                  ...item,
                  quantity: item.quantity + qty,
                  // update prescription if a new one is provided
                  ...(prescriptionDataUrl ? { prescriptionDataUrl, prescriptionName: prescriptionFile?.name } : {}),
                }
              : item
          );
        }
        return [...prev, {
          medicineId: medicine.id,
          name: medicine.brandName,
          genericName: medicine.genericName,
          price: medicine.price,
          category: medicine.category,
          requiresPrescription: medicine.requiresPrescription,
          quantity: qty,
          prescriptionDataUrl: prescriptionDataUrl || null,
          prescriptionName: prescriptionFile?.name || null,
        }];
      });
    };

    if (prescriptionFile && prescriptionFile instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => addItem(e.target.result);
      reader.readAsDataURL(prescriptionFile);
    } else {
      addItem(null);
    }
  };

  const removeFromCart = (medicineId) => {
    setCartItems(prev => prev.filter(item => item.medicineId !== medicineId));
  };

  const updateQuantity = (medicineId, qty) => {
    if (qty <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.medicineId === medicineId ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const getTotal = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getItemCount = () =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getTotal, getItemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export default CartContext;
