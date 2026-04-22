import { createContext, useContext, useState, useEffect } from 'react';
import { rolePermissions } from '../data/permissions'; // used only as fallback
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('novacare_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!currentUser;

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('novacare_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('novacare_user');
      localStorage.removeItem('dupharma_user'); // clean up old key
    }
  }, [currentUser]);

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      // data: { token, id, firstName, lastName, email, role, branchId, mustChangePassword }
      const user = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        branchId: data.branchId,
        token: data.token,
        isActive: true,
        mustChangePassword: data.mustChangePassword ?? false,
        // Resolved permissions returned by the server (custom overrides or role defaults)
        permissions: data.permissions ?? rolePermissions[data.role] ?? [],
      };
      setCurrentUser(user);
      return { success: true, mustChangePassword: user.mustChangePassword, role: user.role };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Invalid email or password';
      return { success: false, error: message };
    }
  };

  // Called after a successful forced password change to clear the flag locally.
  const clearMustChangePassword = () => {
    setCurrentUser(prev => prev ? { ...prev, mustChangePassword: false } : prev);
  };

  const logout = () => {
    authApi.logout(); // notify server (fire & forget)
    setCurrentUser(null);
  };

  const hasPermission = (permName) => {
    if (!currentUser) return false;
    // Use server-resolved permissions stored at login; fall back to role defaults
    const perms = currentUser.permissions ?? rolePermissions[currentUser.role] ?? [];
    return perms.includes(permName);
  };

  const getRoleName = () => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 1: return 'Admin';
      case 2: return 'Manager';
      case 3: return 'Pharmacist';
      case 4: return 'Customer';
      default: return 'Unknown';
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isAuthenticated, login, logout, hasPermission, getRoleName, clearMustChangePassword }}>
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
