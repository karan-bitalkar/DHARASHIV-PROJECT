import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('protinut_user') || sessionStorage.getItem('protinut_user');
      const saved = savedUser ? JSON.parse(savedUser) : null;
      return saved?.role === 'ROLE_ADMIN' ? null : saved;
    } catch {
      return null;
    }
  });

  const [adminToken, setAdminToken] = useState(() => {
    try {
      return localStorage.getItem('adminToken') || null;
    } catch {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const savedAdmin = localStorage.getItem('protinut_admin_user');
      return savedAdmin ? JSON.parse(savedAdmin) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(adminToken && adminUser?.role === 'ROLE_ADMIN');

  // Normal Customer Login
  const login = (userData, rememberMe = true) => {
    const formattedUser = {
      name: userData.name || 'Protinut Member',
      email: userData.email || userData.identifier || 'member@protinut.in',
      phone: userData.phone || '+91 98765 43210',
      identifier: userData.identifier || userData.email || 'member@protinut.in',
      role: 'ROLE_CUSTOMER',
      token: userData.token || 'jwt_cust_' + Math.random().toString(36).substring(2),
      avatar: userData.avatar || (userData.name ? userData.name.charAt(0).toUpperCase() : 'P'),
      joinedAt: userData.joinedAt || 'Oct 2026'
    };
    const previousIdentity = String(user?.email || user?.identifier || '').trim().toLowerCase();
    const nextIdentity = String(formattedUser.email || formattedUser.identifier || '').trim().toLowerCase();
    try {
      if (previousIdentity && nextIdentity && previousIdentity !== nextIdentity) {
        localStorage.removeItem('protinut_delivery_address');
      }
      const userStorage = rememberMe ? localStorage : sessionStorage;
      userStorage.setItem('protinut_user', JSON.stringify(formattedUser));
      (rememberMe ? sessionStorage : localStorage).removeItem('protinut_user');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('protinut_admin_user');
    } catch (e) {
      console.error('Error saving user to browser storage', e);
      return null;
    }

    setUser(formattedUser);
    setAdminToken(null);
    setAdminUser(null);
    try {
      const savedCustomers = JSON.parse(localStorage.getItem('protinut_customers') || '[]');
      const customer = {
        name: formattedUser.name,
        email: formattedUser.email,
        phone: formattedUser.phone,
        joinedAt: formattedUser.joinedAt,
        source: 'registration'
      };
      localStorage.setItem('protinut_customers', JSON.stringify([
        ...savedCustomers.filter((item) => item.email !== customer.email),
        customer
      ]));
    } catch (e) {
      console.error('Error saving customer details to localStorage', e);
    }
    return formattedUser;
  };

  // Dedicated Admin Login (Spring Boot / Role-based Ready)
  const adminLogin = async (email, password) => {
    // Simulated backend call / dummy validation for testing
    // Spring Boot expects credentials -> returns JWT token + User with ROLE_ADMIN
    // Check dummy admin credentials
    if (email === 'protinut@gmail.com' && password === 'Protinut@123') {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.protinut_admin_token_' + Date.now();
      const adminUser = {
        name: 'Admin',
        email: 'protinut@gmail.com',
        phone: '+91 830 830 2301',
        identifier: 'protinut@gmail.com',
        role: 'ROLE_ADMIN',
        token,
        avatar: 'A',
        department: 'Management & Operations',
        joinedAt: 'Jan 2026'
      };

      try {
        localStorage.setItem('protinut_admin_user', JSON.stringify(adminUser));
        localStorage.setItem('adminToken', token);
      } catch (e) {
        console.error('Error storing admin session', e);
        return { success: false, error: 'Unable to save the admin session in this browser.' };
      }
      setAdminUser(adminUser);
      setAdminToken(token);
      return { success: true, user: adminUser, token };
    }

    return { success: false, error: 'Invalid Admin Credentials.' };
  };

  // Normal Logout
  const logout = () => {
    setUser(null);
    setAdminToken(null);
    setAdminUser(null);
    try {
      localStorage.removeItem('protinut_user');
      sessionStorage.removeItem('protinut_user');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('protinut_admin_user');
      localStorage.removeItem('protinut_cart');
      localStorage.removeItem('protinut_wishlist');
      localStorage.removeItem('protinut_delivery_address');
    } catch (e) {
      console.error('Error clearing user from localStorage', e);
    }
  };

  // Dedicated Admin Logout
  const adminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('protinut_admin_user');
    } catch (e) {
      console.error('Error clearing admin session', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        adminToken,
        adminUser,
        login,
        adminLogin,
        logout,
        adminLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
