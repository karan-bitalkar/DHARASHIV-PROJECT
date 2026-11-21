import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { DEFAULT_PICKUP_LOCATION } from './trackingConfig';
import { isCodPaymentMethod } from './orderCancellation';

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
  const ordersRef = useRef(orders);

  const commitOrders = (nextOrders) => {
    try {
      localStorage.setItem('protinut_orders', JSON.stringify(nextOrders));
    } catch (error) {
      console.error('Error saving orders to localStorage', error);
      return false;
    }
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
    return true;
  };

  useEffect(() => {
    try {
      localStorage.setItem('protinut_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders to localStorage', e);
    }
  }, [orders]);

  useEffect(() => {
    const syncOrders = (event) => {
      if (event.key !== 'protinut_orders') return;
      try {
        const nextOrders = event.newValue ? JSON.parse(event.newValue) : [];
        if (Array.isArray(nextOrders)) {
          if (JSON.stringify(ordersRef.current) !== JSON.stringify(nextOrders)) {
            ordersRef.current = nextOrders;
            setOrders(nextOrders);
          }
        }
      } catch (error) {
        console.error('Unable to sync orders from another browser tab', error);
      }
    };
    window.addEventListener('storage', syncOrders);
    return () => window.removeEventListener('storage', syncOrders);
  }, []);

  const placeOrder = ({
    items,
    address,
    paymentMethod,
    paymentStatus,
    subtotal,
    discount,
    deliveryCharge,
    userEmail
  }) => {
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
      createdAt: now.toISOString(),
      invoiceDate: formattedDate,
      status: 'Order Placed',
      statusIndex: 0,
      canCancel: true,
      pickupLocation: { ...DEFAULT_PICKUP_LOCATION },
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
      paymentStatus: paymentStatus || (isCodPaymentMethod(paymentMethod) ? 'Unpaid' : 'Not recorded'),
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
        { step: 'Order Placed', date: formattedDate, updatedAt: now.toISOString(), desc: 'Your order has been received and confirmed.', completed: true },
        { step: 'Processing', date: '', desc: '', completed: false },
        { step: 'Shipped', date: '', desc: '', completed: false },
        { step: 'Out for Delivery', date: '', desc: '', completed: false },
        { step: 'Delivered', date: '', desc: '', completed: false }
      ]
    };

    if (!commitOrders([newOrder, ...ordersRef.current])) return null;
    return newOrder;
  };

  const cancelOrder = (orderId, reason = 'Customer requested cancellation') => {
    const currentOrder = ordersRef.current.find((order) => order.id === orderId);
    if (!currentOrder || currentOrder.status === 'Cancelled' || currentOrder.canCancel !== true) {
      toast.error(currentOrder ? 'This order can no longer be cancelled.' : 'Order could not be found.');
      return false;
    }

    const now = new Date();
    const nextOrders = ordersRef.current.map((order) => (
      order.id === orderId
        ? {
          ...order,
          status: 'Cancelled',
          canCancel: false,
          cancellationReason: reason,
          cancelledAt: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          cancelledAtTime: now.toISOString(),
          statusUpdatedAt: now.toISOString()
        }
        : order
    ));
    const saved = commitOrders(nextOrders);

    if (!saved) {
      toast.error('Could not save this cancellation. Please try again.');
      return false;
    }
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
    return true;
  };

  const updateOrderStatus = (orderId, status, trackingId = '') => {
    const trackingSteps = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const statusIndexes = { 'Order Placed': 0, Pending: 0, Processing: 1, Shipped: 2, 'Out for Delivery': 3, Delivered: 4, Cancelled: -1 };
    const now = new Date();
    const updatedAt = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedAtTime = now.toISOString();
    if (!ordersRef.current.some((order) => order.id === orderId)) return false;
    const nextOrders = ordersRef.current.map((order) => {
      if (order.id !== orderId) return order;
      const statusIndex = statusIndexes[status] ?? order.statusIndex ?? 0;
      return {
        ...order,
        status,
        trackingId: trackingId.trim() || order.trackingId || '',
        statusUpdatedAt: updatedAtTime,
        canCancel: status === 'Order Placed' || status === 'Pending',
        statusIndex,
        timeline: trackingSteps.map((step, index) => {
          const previousEntry = order.timeline?.find((entry) => entry.step === step);
          const wasCompleted = previousEntry?.completed;
          const completed = statusIndex >= index || (status === 'Cancelled' && wasCompleted);
          return {
            step,
            date: completed ? (step === status ? updatedAt : previousEntry?.date || order.date) : '',
            updatedAt: completed ? (step === status ? updatedAtTime : previousEntry?.updatedAt || '') : '',
            desc: step === status ? `Order status updated to ${status}.` : previousEntry?.desc || '',
            completed
          };
        })
      };
    });
    return commitOrders(nextOrders);
  };

  const getOrderById = (orderId) => orders.find((order) => order.id === orderId) || null;

  const resetOrders = () => {
    ordersRef.current = [];
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
        getOrderById,
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
