import { createContext, useContext, useState, useEffect } from 'react';
import { users } from '../data/users';
import { rolePermissions } from '../data/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dupharma_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!currentUser;

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dupharma_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dupharma_user');
    }
  }, [currentUser]);

  const login = (email, password) => {
    const user = users.find(u => u.email === email && u.password === password && u.isActive);
    if (user) {
      const { password: _, ...safeUser } = user;
      setCurrentUser(safeUser);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const hasPermission = (permName) => {
    if (!currentUser) return false;
    const perms = rolePermissions[currentUser.role] || [];
    return perms.includes(permName);
  };

  const updateProfile = (updates) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    return { success: true };
  };

  const getRoleName = () => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 1: return 'Admin';
      case 2: return 'Manager';
      case 3: return 'Pharmacist';
      default: return 'Unknown';
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout, updateProfile, hasPermission, getRoleName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
