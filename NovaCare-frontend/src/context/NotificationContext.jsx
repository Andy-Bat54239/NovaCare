import { createContext, useContext, useState, useMemo } from 'react';
import { batches } from '../data/batches';
import { orders } from '../data/orders';
import { contactMessages } from '../data/contactMessages';
import { medicines } from '../data/medicines';

const NotificationContext = createContext(null);

// Generate notifications from actual app data so the bell icon reflects real state
function generateNotifications() {
  const now = new Date('2026-03-23');
  const notifications = [];
  let id = 1;

  // Low stock alerts
  const lowStock = batches.filter(b => b.remainingQuantity < 10 && b.remainingQuantity > 0);
  lowStock.forEach(batch => {
    const med = medicines.find(m => m.id === batch.medicineId);
    notifications.push({
      id: id++,
      type: 'warning',
      title: 'Low Stock Alert',
      message: `${med?.brandName || 'Unknown'} (Batch: ${batch.batchNumber}) has only ${batch.remainingQuantity} units left.`,
      time: 'Today',
      read: false,
    });
  });

  // Expiring soon (within 90 days)
  const ninetyDays = new Date(now);
  ninetyDays.setDate(ninetyDays.getDate() + 90);
  const expiring = batches.filter(b => {
    const exp = new Date(b.expiryDate);
    return exp > now && exp <= ninetyDays && b.remainingQuantity > 0;
  });
  expiring.slice(0, 3).forEach(batch => {
    const med = medicines.find(m => m.id === batch.medicineId);
    const daysLeft = Math.ceil((new Date(batch.expiryDate) - now) / 86400000);
    notifications.push({
      id: id++,
      type: 'danger',
      title: 'Expiring Soon',
      message: `${med?.brandName || 'Unknown'} batch ${batch.batchNumber} expires in ${daysLeft} days.`,
      time: 'Today',
      read: false,
    });
  });

  // Pending orders
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  if (pendingOrders.length > 0) {
    notifications.push({
      id: id++,
      type: 'info',
      title: 'Pending Orders',
      message: `${pendingOrders.length} order(s) are awaiting approval.`,
      time: 'Today',
      read: false,
    });
  }

  // Unread contact messages
  const unreadMessages = contactMessages.filter(m => !m.isRead);
  if (unreadMessages.length > 0) {
    notifications.push({
      id: id++,
      type: 'info',
      title: 'Unread Messages',
      message: `You have ${unreadMessages.length} unread contact message(s).`,
      time: 'Today',
      read: false,
    });
  }

  return notifications;
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => generateNotifications());

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export default NotificationContext;
