import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  // Store only the user's real orders in localStorage (filters out any old dummy data)
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('protinut_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any legacy dummy sample orders
          return parsed.filter(o => o.id !== 'ORD-202611040001' && o.invoiceNo !== 'INV-2026-0001');
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('protinut_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders to localStorage', e);
    }
  }, [orders]);

  useEffect(() => {
    const syncOrders = (event) => {
      if (event.key !== 'protinut_orders' || !event.newValue) return;
      try {
        const nextOrders = JSON.parse(event.newValue);
        if (Array.isArray(nextOrders)) {
          setOrders((currentOrders) => (
            JSON.stringify(currentOrders) === event.newValue ? currentOrders : nextOrders
          ));
        }
      } catch (error) {
        console.error('Unable to sync orders from another browser tab', error);
      }
    };
    window.addEventListener('storage', syncOrders);
    return () => window.removeEventListener('storage', syncOrders);
  }, []);

  const placeOrder = ({ items, address, paymentMethod, subtotal, discount, deliveryCharge, userEmail }) => {
    const uniqueDigits = Math.floor(100000 + Math.random() * 900000);
    const orderId = `ORD-${Date.now().toString().slice(-4)}${uniqueDigits}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const subtotalAmount = Number(subtotal) || 0;
    const cgstAmount = Number(((subtotalAmount * 2.5) / 100).toFixed(2));
    const sgstAmount = Number(((subtotalAmount * 2.5) / 100).toFixed(2));
    const deliveryAmount = Number(deliveryCharge) || 0;

    const newOrder = {
      id: orderId,
      invoiceNo: `INV-${uniqueDigits}`,
      date: formattedDate,
      invoiceDate: formattedDate,
      status: 'Order Placed',
      statusIndex: 0,
      canCancel: true,
      // Map strictly to the exact items the user bought:
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        weight: i.selectedWeight || i.weight || '',
        quantity: Number(i.quantity || 1),
        finalPrice: Number(i.finalPrice || i.price || 0),
        originalPrice: Number(i.originalPrice || Math.round((i.finalPrice || 0) * 1.35)),
        image: i.image || ''
      })),
      address: {
        name: address.name,
        mobile: address.mobile,
        pincode: address.pincode,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state
      },
      userEmail: userEmail || address?.email || '',
      paymentMethod,
      pricing: {
        subtotal: subtotalAmount,
        discount: Number(discount || 0),
        cgst: cgstAmount,
        sgst: sgstAmount,
        totalGst: Number((cgstAmount + sgstAmount).toFixed(2)),
        deliveryCharge: deliveryAmount,
        grandTotal: Number((subtotalAmount + cgstAmount + sgstAmount + deliveryAmount).toFixed(2))
      },
      timeline: [
        { step: 'Order Placed', date: formattedDate, desc: 'Your order has been received and confirmed.', completed: true },
        { step: 'Processing', date: '', desc: '', completed: false },
        { step: 'Shipped', date: '', desc: '', completed: false },
        { step: 'Out for Delivery', date: '', desc: '', completed: false },
        { step: 'Delivered', date: '', desc: '', completed: false }
      ]
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const cancelOrder = (orderId, reason = 'Customer requested cancellation') => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          toast.success(`Order #${orderId} has been cancelled`, {
            style: {
              background: '#2b1810',
              color: '#ffffff',
              borderRadius: '12px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '13px',
              fontWeight: 700
            }
          });
          return {
            ...order,
            status: 'Cancelled',
            canCancel: false,
            cancellationReason: reason,
            cancelledAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          };
        }
        return order;
      })
    );
  };

  const updateOrderStatus = (orderId, status, trackingId = '') => {
    const trackingSteps = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const statusIndexes = { 'Order Placed': 0, Pending: 0, Processing: 1, Shipped: 2, 'Out for Delivery': 3, Delivered: 4, Cancelled: -1 };
    const updatedAt = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    setOrders((prev) => prev.map((order) => {
      if (order.id !== orderId) return order;
      const statusIndex = statusIndexes[status] ?? order.statusIndex ?? 0;
      return {
        ...order,
        status,
        trackingId: trackingId.trim() || order.trackingId || '',
        statusUpdatedAt: updatedAt,
        canCancel: status === 'Order Placed' || status === 'Pending',
        statusIndex,
        timeline: trackingSteps.map((step, index) => {
          const wasCompleted = order.timeline?.find((entry) => entry.step === step)?.completed;
          const completed = statusIndex >= index || (status === 'Cancelled' && wasCompleted);
          return {
            step,
            date: completed ? (step === status ? updatedAt : order.timeline?.find((entry) => entry.step === step)?.date || order.date) : '',
            desc: step === status ? `Order status updated to ${status}.` : order.timeline?.find((entry) => entry.step === step)?.desc || '',
            completed
          };
        })
      };
    }));
  };

  const resetOrders = () => {
    setOrders([]);
    try {
      localStorage.removeItem('protinut_orders');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        placeOrder,
        cancelOrder,
        updateOrderStatus,
        resetOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export default OrderContext;
