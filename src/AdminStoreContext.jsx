import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useOrders } from './OrderContext';
import { useAuth } from './AuthContext';

const AdminStoreContext = createContext(null);

const readStoredValue = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Unable to read ${key} from localStorage`, error);
    return fallback;
  }
};

const customerIdentifiers = (customer) => [
  String(customer.email || '').trim().toLowerCase() ? `email:${String(customer.email).trim().toLowerCase()}` : '',
  String(customer.phone || '').replace(/\D/g, '') ? `phone:${String(customer.phone).replace(/\D/g, '')}` : ''
].filter(Boolean);

export const AdminStoreProvider = ({ children, initialProducts }) => {
  const { orders, updateOrderStatus } = useOrders();
  const { user } = useAuth();
  const [products, setProducts] = useState(() => {
    const savedDeletedIds = readStoredValue('protinut_deleted_products', []);
    const deletedIds = new Set(Array.isArray(savedDeletedIds) ? savedDeletedIds : []);
    const savedProducts = readStoredValue('protinut_products', null);
    const availableProducts = initialProducts.filter((product) => !deletedIds.has(product.id));
    if (!Array.isArray(savedProducts)) return availableProducts;

    const savedById = new Map(savedProducts.map((product) => [product.id, product]));
    const merged = availableProducts.map((product) => ({
      ...product,
      ...(savedById.get(product.id) || {})
    }));
    const knownIds = new Set(availableProducts.map((product) => product.id));
    return [...merged, ...savedProducts.filter((product) => !knownIds.has(product.id) && !deletedIds.has(product.id))];
  });
  const [customers, setCustomers] = useState(() => readStoredValue('protinut_customers', []));

  useEffect(() => {
    try {
      localStorage.setItem('protinut_products', JSON.stringify(products));
    } catch (error) {
      console.error('Unable to save products to localStorage', error);
    }
  }, [products]);

  useEffect(() => {
    const storedCustomers = readStoredValue('protinut_customers', []);
    const orderCustomers = orders.map((order) => ({
      name: order.address?.name || 'Customer',
      email: order.userEmail || '',
      phone: order.address?.mobile || '',
      joinedAt: order.date || '',
      source: 'order'
    }));
    const savedDeletedCustomerIdentifiers = readStoredValue('protinut_deleted_customers', []);
    const deletedCustomerIdentifiers = new Set(
      Array.isArray(savedDeletedCustomerIdentifiers) ? savedDeletedCustomerIdentifiers : []
    );
    const customerMap = new Map();
    [...storedCustomers, ...orderCustomers].forEach((customer) => {
      if (customerIdentifiers(customer).some((identifier) => deletedCustomerIdentifiers.has(identifier))) return;
      const key = (customer.email || customer.phone || customer.name).toLowerCase();
      if (key) customerMap.set(key, { ...customerMap.get(key), ...customer });
    });
    if (user && user.role !== 'ROLE_ADMIN') {
      if (customerIdentifiers(user).some((identifier) => deletedCustomerIdentifiers.has(identifier))) {
        const mergedCustomers = [...customerMap.values()];
        setCustomers(mergedCustomers);
        try {
          localStorage.setItem('protinut_customers', JSON.stringify(mergedCustomers));
        } catch (error) {
          console.error('Unable to save customers to localStorage', error);
        }
        return;
      }
      const customerKey = (user.email || user.phone || user.name).toLowerCase();
      if (customerKey) {
        customerMap.set(customerKey, {
          ...customerMap.get(customerKey),
          name: user.name,
          email: user.email,
          phone: user.phone,
          joinedAt: user.joinedAt,
          source: 'registration'
        });
      }
    }
    const mergedCustomers = [...customerMap.values()];
    setCustomers(mergedCustomers);
    try {
      localStorage.setItem('protinut_customers', JSON.stringify(mergedCustomers));
    } catch (error) {
      console.error('Unable to save customers to localStorage', error);
    }
  }, [orders, user]);

  const addCustomer = ({ name, email, phone }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, '');
    if (customers.some((customer) => (
      customer.email?.trim().toLowerCase() === normalizedEmail
      || customer.phone?.replace(/\D/g, '') === normalizedPhone
    ))) {
      return 'duplicate';
    }

    const customer = {
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      joinedAt: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      source: 'admin'
    };
    const nextCustomers = [...customers, customer];
    try {
      const deletedIdentifiers = readStoredValue('protinut_deleted_customers', []);
      const deletedSet = new Set(Array.isArray(deletedIdentifiers) ? deletedIdentifiers : []);
      customerIdentifiers(customer).forEach((identifier) => deletedSet.delete(identifier));
      localStorage.setItem('protinut_deleted_customers', JSON.stringify([...deletedSet]));
      localStorage.setItem('protinut_customers', JSON.stringify(nextCustomers));
      setCustomers(nextCustomers);
    } catch (error) {
      console.error('Unable to save the new customer', error);
      return 'storage-error';
    }
    return 'success';
  };

  const deleteCustomer = (customer) => {
    const identifiers = customerIdentifiers(customer);
    if (identifiers.length === 0) return false;
    const deletedIdentifiers = readStoredValue('protinut_deleted_customers', []);
    const deletedSet = new Set(Array.isArray(deletedIdentifiers) ? deletedIdentifiers : []);
    identifiers.forEach((identifier) => deletedSet.add(identifier));
    const nextCustomers = customers.filter((current) => (
      !customerIdentifiers(current).some((identifier) => identifiers.includes(identifier))
    ));
    try {
      localStorage.setItem('protinut_deleted_customers', JSON.stringify([...deletedSet]));
      localStorage.setItem('protinut_customers', JSON.stringify(nextCustomers));
    } catch (error) {
      console.error('Unable to delete customer from localStorage', error);
      return false;
    }
    setCustomers(nextCustomers);
    return true;
  };

  const addProduct = (product) => {
    const id = product.id || `product-${Date.now()}`;
    setProducts((current) => [...current, { ...product, id }]);
    const savedDeletedIds = readStoredValue('protinut_deleted_products', []);
    const deletedIds = Array.isArray(savedDeletedIds) ? savedDeletedIds : [];
    try {
      localStorage.setItem('protinut_deleted_products', JSON.stringify(deletedIds.filter((deletedId) => deletedId !== id)));
    } catch (error) {
      console.error('Unable to update deleted product records', error);
    }
    return id;
  };

  const updateProduct = (productId, updates) => {
    setProducts((current) => current.map((product) => (
      product.id === productId
        ? (() => {
          const nextProduct = {
            ...product,
            ...updates,
            price550: Number(updates.price550 ?? product.price550),
            price1kg: Number(updates.price1kg ?? product.price1kg),
            originalPrice550: Number(updates.originalPrice550 ?? product.originalPrice550 ?? product.price550),
            originalPrice1kg: Number(updates.originalPrice1kg ?? product.originalPrice1kg ?? product.price1kg)
          };
          nextProduct.weightOptions = (product.weightOptions || []).map((option, index) => {
            const isOneKilogram = /1\s*kg/i.test(`${option.id || ''} ${option.label || ''}`);
            return {
              ...option,
              price: Number(isOneKilogram
                ? nextProduct.price1kg
                : index === 0
                  ? nextProduct.price550
                  : option.price),
              original: Number(isOneKilogram
                ? nextProduct.originalPrice1kg
                : index === 0
                  ? nextProduct.originalPrice550
                  : option.original)
            };
          });
          return nextProduct;
        })()
        : product
    )));
  };

  const deleteProduct = (productId) => {
    setProducts((current) => current.filter((product) => product.id !== productId));
    const savedDeletedIds = readStoredValue('protinut_deleted_products', []);
    const deletedIds = Array.isArray(savedDeletedIds) ? savedDeletedIds : [];
    if (!deletedIds.includes(productId)) {
      try {
        localStorage.setItem('protinut_deleted_products', JSON.stringify([...deletedIds, productId]));
      } catch (error) {
        console.error('Unable to save deleted product record', error);
      }
    }
  };

  const value = useMemo(() => ({
    products,
    orders,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    deleteCustomer,
    customers
  }), [products, orders, updateOrderStatus, addCustomer, deleteCustomer, customers]);

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
};

export const useAdminStore = () => {
  const context = useContext(AdminStoreContext);
  if (!context) throw new Error('useAdminStore must be used within an AdminStoreProvider');
  return context;
};
