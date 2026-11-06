import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminStore } from './AdminStoreContext';
import { getProductPricing } from './productPricing';
import { isProductPurchasable } from './productAvailability';

const CartContext = createContext(null);

const MAX_CART_LIMIT = 5;

export const CartProvider = ({ children }) => {
  const { products } = useAdminStore();
  // Initial state is strictly empty [] - no hardcoded dummy items!
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('protinut_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('protinut_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    setCartItems((currentItems) => {
      let changed = false;
      const updatedItems = currentItems.map((item) => {
        const product = products.find((currentProduct) => currentProduct.id === item.id);
        if (!product) return item;

        const pricing = getProductPricing(product, item.selectedWeight);
        if (item.finalPrice === pricing.finalPrice && item.originalPrice === pricing.mrp) return item;
        changed = true;
        return { ...item, finalPrice: pricing.finalPrice, originalPrice: pricing.mrp };
      });
      return changed ? updatedItems : currentItems;
    });
  }, [products]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Flipkart style calculations
  const originalPriceTotal = cartItems.reduce((acc, item) => {
    const original = item.originalPrice || Math.round(item.finalPrice * 1.35);
    return acc + (original * item.quantity);
  }, 0);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0);
  const discount = Math.max(0, originalPriceTotal - subtotal);

  // 5% Total GST split into CGST (2.5%) & SGST (2.5%)
  const cgst = cartItems.length > 0 ? Number(((subtotal * 2.5) / 100).toFixed(2)) : 0;
  const sgst = cartItems.length > 0 ? Number(((subtotal * 2.5) / 100).toFixed(2)) : 0;
  const totalGst = Number((cgst + sgst).toFixed(2));

  // Delivery charge: Free if Subtotal > 499, otherwise 40 (0 if empty)
  const deliveryCharge = (subtotal > 499 || cartItems.length === 0) ? 0 : 40;

  // Grand Total = Subtotal + CGST (2.5%) + SGST (2.5%) + Delivery
  const grandTotal = cartItems.length > 0 ? Number((subtotal + deliveryCharge + cgst + sgst).toFixed(2)) : 0;

  const addToCart = (product, quantity = 1, selectedWeight = null) => {
    const weight = selectedWeight || product.selectedWeight || '550gm';
    const managedProduct = products.find((currentProduct) => currentProduct.id === product.id) || product;
    if (!isProductPurchasable(managedProduct)) {
      toast.error(`${managedProduct.name} is currently unavailable.`);
      return false;
    }
    const pricing = getProductPricing(managedProduct, weight);
    const price = pricing.finalPrice ?? product.finalPrice ?? 0;
    const original = pricing.mrp ?? product.originalPrice ?? price;

    const currentTotal = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    if (currentTotal + quantity > MAX_CART_LIMIT) {
      toast.error(`⚠️ Cart Limit Reached! Maximum limit is ${MAX_CART_LIMIT} jars.`, {
        duration: 2500,
        style: {
          background: '#dc2626',
          color: '#ffffff',
          borderRadius: '10px',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
        }
      });
      return false;
    }

    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id && item.selectedWeight === weight);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: copy[idx].quantity + quantity
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: managedProduct.name,
          selectedWeight: weight,
          originalPrice: original,
          finalPrice: price,
          quantity,
          image: managedProduct.image || '/products/classy-crunch.png',
        }
      ];
    });

    const itemLabel = product.name ? `${product.name} (${weight})` : 'Item';
    toast.success(`${itemLabel} added to cart!`, {
      duration: 2500,
      icon: '✅',
      style: {
        background: '#16a34a',
        color: '#ffffff',
        borderRadius: '10px',
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '13px',
        fontWeight: 700,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
      }
    });

    return true;
  };

  const updateQuantity = (productId, selectedWeight, newQty) => {
    const item = cartItems.find((i) => i.id === productId && i.selectedWeight === selectedWeight);
    if (!item) return;

    const diff = newQty - item.quantity;
    const currentTotal = cartItems.reduce((acc, i) => acc + i.quantity, 0);

    if (diff > 0 && currentTotal + diff > MAX_CART_LIMIT) {
      toast.error(`⚠️ Maximum limit of ${MAX_CART_LIMIT} jars reached!`, {
        duration: 2500,
        style: {
          background: '#dc2626',
          color: '#ffffff',
          borderRadius: '10px',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
        }
      });
      return;
    }

    if (newQty <= 0) {
      removeItem(productId, selectedWeight);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.id === productId && i.selectedWeight === selectedWeight
          ? { ...i, quantity: newQty }
          : i
      )
    );
  };

  const removeItem = (productId, selectedWeight) => {
    const itemToRemove = cartItems.find(
      (i) => i.id === productId && (!selectedWeight || i.selectedWeight === selectedWeight)
    );
    const itemName = itemToRemove ? `${itemToRemove.name} removed from cart.` : 'Item removed from cart.';

    setCartItems((prev) =>
      prev.filter((i) => !(i.id === productId && (selectedWeight ? i.selectedWeight === selectedWeight : true)))
    );

    toast.error(itemName, {
      duration: 2500,
      icon: '🗑️',
      style: {
        background: '#dc2626',
        color: '#ffffff',
        borderRadius: '10px',
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '13px',
        fontWeight: 700,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
      }
    });
  };

  const clearCart = () => {
    if (cartItems.length > 0) {
      setCartItems([]);
      toast.error('All items removed from cart.', {
        duration: 2500,
        icon: '🗑️',
        style: {
          background: '#dc2626',
          color: '#ffffff',
          borderRadius: '10px',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
        }
      });
    }
  };

  // Reset cart for testing / clean login
  const resetCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('protinut_cart');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalCartCount,
        originalPriceTotal,
        subtotal,
        discount,
        cgst,
        sgst,
        totalGst,
        deliveryCharge,
        grandTotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        resetCart,
        MAX_CART_LIMIT
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
