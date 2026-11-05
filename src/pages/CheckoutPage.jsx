import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useOrders } from '../OrderContext';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import InvoiceModal from '../InvoiceModal';
import PaymentGatewayModal from '../PaymentGatewayModal';

const INDIAN_STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 
  'Uttar Pradesh', 'Rajasthan', 'Telangana', 'West Bengal', 'Kerala',
  'Madhya Pradesh', 'Punjab', 'Haryana', 'Bihar', 'Andhra Pradesh'
];

const CheckoutPage = () => {
  const {
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
    clearCart
  } = useCart();

  const { placeOrder } = useOrders();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Buy Now direct purchase support (does not modify persistent cart)
  const buyNowItem = location.state?.buyNowItem || (() => {
    try {
      const saved = sessionStorage.getItem('protinut_buy_now_item');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const activeItems = buyNowItem ? [buyNowItem] : cartItems;
  const activeCount = buyNowItem ? (buyNowItem.quantity || 1) : totalCartCount;
  const activeSubtotal = buyNowItem 
    ? (buyNowItem.finalPrice * (buyNowItem.quantity || 1))
    : subtotal;
  const activeOriginalPriceTotal = buyNowItem
    ? ((buyNowItem.originalPrice || Math.round(buyNowItem.finalPrice * 1.35)) * (buyNowItem.quantity || 1))
    : originalPriceTotal;
  const activeDiscount = Math.max(0, activeOriginalPriceTotal - activeSubtotal);
  const activeCgst = buyNowItem ? Number(((activeSubtotal * 2.5) / 100).toFixed(2)) : cgst;
  const activeSgst = buyNowItem ? Number(((activeSubtotal * 2.5) / 100).toFixed(2)) : sgst;
  const activeTotalGst = Number((activeCgst + activeSgst).toFixed(2));
  const activeDeliveryCharge = (activeSubtotal > 499 || activeItems.length === 0) ? 0 : 40;
  const activeGrandTotal = activeItems.length > 0 ? Number((activeSubtotal + activeDeliveryCharge + activeTotalGst).toFixed(2)) : 0;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ── Address State ──
  const [address, setAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('protinut_delivery_address');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.mobile && parsed.pincode && parsed.city && parsed.addressLine) {
          return parsed;
        }
      }
    } catch {}
    return {
      name: user?.name || '',
      mobile: (user?.phone || '').replace(/\D/g, ''),
      pincode: '',
      city: '',
      state: 'Maharashtra',
      addressLine: ''
    };
  });

  const isInitialAddressComplete = Boolean(
    address.name?.trim() &&
    address.mobile?.replace(/\D/g, '').length === 10 &&
    address.pincode?.trim().length === 6 &&
    address.city?.trim() &&
    address.state?.trim() &&
    address.addressLine?.trim()
  );

  const [isEditingAddress, setIsEditingAddress] = useState(!isInitialAddressComplete);
  const [addressErrors, setAddressErrors] = useState({});

  // ── Payment State (unselected by default for strict validation) ──
  // Options: 'upi', 'card', 'netbanking', 'cod' or ''
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Dummy Payment Gateway Modal State (Razorpay / Stripe Simulation)
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // UPI sub-options
  const [upiMode, setUpiMode] = useState('id'); // 'id' (Type UPI ID) or 'qr' (Scan QR Code)
  const [upiType, setUpiType] = useState('phonepe');
  const [upiId, setUpiId] = useState('');

  // Card details
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  // Net banking
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // COD Captcha
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('8392');
  const [codError, setCodError] = useState('');

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (addressErrors[field]) {
      setAddressErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateAddress = () => {
    const errors = {};
    if (!address.name?.trim()) {
      errors.name = 'Full Name is required';
    }
    const cleanMobile = (address.mobile || '').replace(/\D/g, '');
    if (!cleanMobile) {
      errors.mobile = 'Mobile Number is required';
    } else if (cleanMobile.length !== 10) {
      errors.mobile = 'Mobile Number must be exactly 10 digits';
    }
    if (!address.pincode?.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(address.pincode.trim())) {
      errors.pincode = 'Enter a valid 6-digit Pincode';
    }
    if (!address.city?.trim()) {
      errors.city = 'City is required';
    }
    if (!address.state?.trim()) {
      errors.state = 'State is required';
    }
    if (!address.addressLine?.trim()) {
      errors.addressLine = 'Address Line is required';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = (e) => {
    if (e) e.preventDefault();
    if (validateAddress()) {
      setIsEditingAddress(false);
      try {
        localStorage.setItem('protinut_delivery_address', JSON.stringify(address));
      } catch {}
      toast.success('Delivery address saved!');
    } else {
      toast.error('Please fix errors in delivery address');
    }
  };

  const handlePaymentSelect = (method) => {
    setPaymentMethod(method);
    setPaymentError('');
    if (method !== 'cod') {
      setCodError('');
    }
  };

  // ── Central Order Execution Function ──
  const executeOrderPlacement = (paymentMethodLabel, isCod = false) => {
    setIsPlacingOrder(true);

    setTimeout(() => {
      const order = placeOrder({
        items: activeItems,
        address,
        paymentMethod: paymentMethodLabel,
        subtotal: activeSubtotal,
        discount: activeDiscount,
        cgst: activeCgst,
        sgst: activeSgst,
        totalGst: activeTotalGst,
        deliveryCharge: activeDeliveryCharge,
        grandTotal: activeGrandTotal,
        userEmail: user?.email || user?.identifier || `${address.name.toLowerCase().replace(/\s+/g, '')}@protinut.in`
      });

      // Clear the cart
      if (!buyNowItem) {
        clearCart();
      } else {
        try { sessionStorage.removeItem('protinut_buy_now_item'); } catch (e) {}
      }

      // If user is guest, automatically log them in with delivery address info
      if (!user && login) {
        try {
          login({
            name: address.name,
            phone: address.mobile,
            email: `${address.name.toLowerCase().replace(/\s+/g, '')}@protinut.in`
          });
        } catch (e) {}
      }

      setIsPlacingOrder(false);
      setPlacedOrder(order);
      if (isCod) {
        toast.success('Order Placed Successfully (COD)!');
      } else {
        toast.success('🎉 Order Placed Successfully!');
      }
      navigate('/order-success', { state: { order } });
    }, isCod ? 1000 : 300);
  };

  // ── Dummy Gateway Simulation Handlers ──
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast.success('Payment Successful! 🎉');

    let paymentLabel = 'Online Payment';
    if (paymentMethod === 'upi') {
      paymentLabel = `UPI (${upiMode === 'qr' ? 'QR Code Scan' : (upiType === 'id' ? (upiId || 'Custom ID') : upiType.toUpperCase())})`;
    } else if (paymentMethod === 'card') {
      paymentLabel = `Credit/Debit Card (Ending ${cardData.number.slice(-4) || '4242'})`;
    } else if (paymentMethod === 'netbanking') {
      paymentLabel = `Net Banking (${selectedBank})`;
    }

    executeOrderPlacement(paymentLabel, false);
  };

  const handlePaymentFailure = () => {
    setShowPaymentModal(false);
    toast.error('Payment Failed. Please try again.');
  };

  // ── Place Order Validation & Payment Trigger ──
  const handlePlaceOrder = () => {
    // Reset previous errors
    setPaymentError('');
    setCodError('');

    // 1. Strict Address Validation
    const isAddressValid = validateAddress();
    if (!isAddressValid) {
      setIsEditingAddress(true);
      toast.error('Please complete all required fields in the delivery address!');
      const addressEl = document.getElementById('address-section');
      if (addressEl) {
        addressEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // 2. Strict Payment Method Validation
    if (!paymentMethod) {
      setPaymentError('Please select a payment method.');
      toast.error('Please select a payment method.', { id: 'payment-error-toast' });
      const paymentEl = document.getElementById('payment-section');
      if (paymentEl) {
        paymentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // 3. Cart / Items Validation
    if (activeItems.length === 0) {
      toast.error('No items to checkout! Please add products to cart.');
      navigate('/products');
      return;
    }

    // Save validated address to localStorage
    try {
      localStorage.setItem('protinut_delivery_address', JSON.stringify(address));
    } catch {}

    // ── CASE 1: Cash on Delivery (COD) ──
    if (paymentMethod === 'cod') {
      if (!captchaInput.trim()) {
        setCodError('Please enter the 4-digit code shown above');
        toast.error('Please enter the 4-digit verification code for COD.');
        const codEl = document.getElementById('cod-section');
        if (codEl) {
          codEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (captchaInput.trim() !== captchaCode) {
        setCodError('Incorrect code. Please enter the exact 4 digits shown.');
        toast.error('Invalid verification code for Cash on Delivery.');
        return;
      }

      // Directly place COD order with loading spinner
      executeOrderPlacement('Cash on Delivery (COD)', true);
      return;
    }

    // ── CASE 2: Online Payments (UPI, Card, Net Banking) ──
    // Future Razorpay / Stripe Code Structure:
    const initiatePayment = async () => {
      // 1. Call backend to create Razorpay Order ID
      // const { razorpayOrderId } = await api.post('/api/payment/create-order', {
      //   amount: activeGrandTotal * 100,
      //   currency: 'INR'
      // });
      //
      // 2. Initialize Razorpay Checkout with prefilled mobile number & customer details
      // const options = {
      //   key: "RAZORPAY_KEY",
      //   amount: activeGrandTotal * 100,
      //   order_id: razorpayOrderId,
      //   name: "PROTINUT Nutrition",
      //   description: "100% Roasted Peanut Butter Order",
      //   image: "/protinut-logo.png",
      //   prefill: {
      //     name: address.name,
      //     email: user?.email || `${address.name.toLowerCase().replace(/\s+/g, '')}@protinut.in`,
      //     contact: address.mobile
      //   },
      //   theme: { color: "#ef5323" },
      //   handler: function (response) {
      //     // verify signature and complete order
      //     handlePaymentSuccess();
      //   }
      // };
      // const rzp = new window.Razorpay(options);
      // rzp.open();
      //
      // FOR NOW: Open the realistic Dummy Payment Gateway Modal with Success/Failure simulation
      setShowPaymentModal(true);
    };

    initiatePayment();
  };

  // If order was just placed, show Flipkart Order Confirmation Screen
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] py-10 px-4 font-sans">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3 font-['Montserrat']">
            Thank you for your order!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Order ID: <strong className="text-gray-900 font-mono">#{placedOrder.id}</strong>
          </p>

          <div className="bg-gray-50 rounded-xl p-5 my-6 border border-gray-200 text-left space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Total Amount:</span>
              <strong className="text-primary text-base font-black">₹{placedOrder.pricing.grandTotal}</strong>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-semibold text-gray-800">{placedOrder.paymentMethod}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 block">Deliver to:</span>
              <span className="font-semibold text-gray-800 block">
                {placedOrder.address.name} ({placedOrder.address.mobile})
              </span>
              <span className="text-xs text-gray-500">
                {placedOrder.address.addressLine}, {placedOrder.address.city}, {placedOrder.address.state} - {placedOrder.address.pincode}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setIsInvoiceOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white font-bold text-sm px-6 py-3 rounded-lg shadow transition flex items-center justify-center gap-2"
            >
              <span>🧾 Download Tax Invoice</span>
            </button>

            <button
              onClick={() => navigate(`/orders/${placedOrder.id}`)}
              className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold text-sm px-6 py-3 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>Track Order Live</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <Link
              to="/orders"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm px-6 py-3 rounded-lg transition"
            >
              View All Orders
            </Link>
          </div>
        </div>

        {/* Unified Premium Flipkart Style Tax Invoice Modal on Confirmation */}
        {isInvoiceOpen && placedOrder && (
          <InvoiceModal
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
            order={placedOrder}
          />
        )}
      </div>
    );
  }

  // If cart is empty and not Buy Now, show empty state
  if (activeItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-4xl mb-3">🛒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-gray-500 mb-6">Please add items to your cart before proceeding to checkout.</p>
          <Link
            to="/products"
            className="inline-block bg-primary hover:bg-primary-hover text-white font-bold text-sm px-6 py-3 rounded-lg shadow"
          >
            Shop Now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] py-6 px-3 sm:px-6 lg:px-8 pb-28 md:pb-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Flipkart Checkout Header Strip */}
        <div className="flex items-center justify-between mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Link to="/cart" className="text-primary hover:underline font-bold">← Back to Cart</Link>
            <span>/</span>
            <span className="text-gray-700">Checkout</span>
          </div>
          <span className="text-green-700 font-bold flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            100% Safe & Secure Checkout
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: 1. Login, 2. Delivery Address, 3. Order Items Summary, 4. Payment Options */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Step 1: Login Check */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-green-600 text-white text-xs font-black flex items-center justify-center">
                    ✓
                  </span>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Step 1</span>
                    <span className="text-sm font-bold text-gray-900">
                      LOGIN ACCOUNT ({user?.name || 'Customer'} • {user?.email || user?.identifier})
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  Verified
                </span>
              </div>
            </div>

            {/* Step 2: Delivery Address Form */}
            <div id="address-section" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-[#2874f0] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-white text-[#2874f0] text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Delivery Address
                  </span>
                </div>
                {!isEditingAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAddress(true);
                    }}
                    className="text-xs font-bold bg-white text-[#2874f0] hover:bg-gray-100 px-3 py-1 rounded transition"
                  >
                    Change Address
                  </button>
                )}
              </div>

              <div className="p-5">
                {isEditingAddress ? (
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={address.name}
                          onChange={(e) => handleAddressChange('name', e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            addressErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="e.g. Karan Bitalikar"
                        />
                        {addressErrors.name && (
                          <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                            <span>⚠️</span> {addressErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Mobile */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          10-Digit Mobile Number *
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={address.mobile}
                          onChange={(e) => handleAddressChange('mobile', e.target.value.replace(/\D/g, ''))}
                          className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            addressErrors.mobile ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="e.g. 9876543210"
                        />
                        {addressErrors.mobile && (
                          <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                            <span>⚠️</span> {addressErrors.mobile}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Pincode */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={address.pincode}
                          onChange={(e) => handleAddressChange('pincode', e.target.value.replace(/\D/g, ''))}
                          className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            addressErrors.pincode ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="e.g. 411035"
                        />
                        {addressErrors.pincode && (
                          <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                            <span>⚠️</span> {addressErrors.pincode}
                          </p>
                        )}
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          City / District *
                        </label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            addressErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="e.g. Pune"
                        />
                        {addressErrors.city && (
                          <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                            <span>⚠️</span> {addressErrors.city}
                          </p>
                        )}
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          State *
                        </label>
                        <select
                          value={address.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white ${
                            addressErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                        {addressErrors.state && (
                          <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                            <span>⚠️</span> {addressErrors.state}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Address Line */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Address Line (House No, Building, Street, Area) *
                      </label>
                      <textarea
                        rows={2}
                        value={address.addressLine}
                        onChange={(e) => handleAddressChange('addressLine', e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                          addressErrors.addressLine ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="e.g. Flat 101, Blossom Residency, Akurdi Station Road"
                      />
                      {addressErrors.addressLine && (
                        <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                          <span>⚠️</span> {addressErrors.addressLine}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-[#fb641b] hover:bg-[#e85a14] text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded shadow"
                      >
                        Save & Deliver Here
                      </button>
                      {isInitialAddressComplete && (
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="text-xs font-bold text-gray-500 hover:text-gray-800 px-4 py-2"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-gray-900">{address.name}</span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-semibold uppercase">
                          HOME
                        </span>
                        <span className="text-sm font-bold text-gray-700">{address.mobile}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 max-w-xl">
                        {address.addressLine}, {address.city}, {address.state} - <strong className="text-gray-900">{address.pincode}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Order Items Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-green-600 text-white text-xs font-black flex items-center justify-center">
                    ✓
                  </span>
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Order Items Summary ({activeCount} {activeCount === 1 ? 'Jar' : 'Jars'})
                  </span>
                </div>
                {!buyNowItem && (
                  <Link to="/cart" className="text-xs font-bold text-primary hover:underline">
                    Modify Cart
                  </Link>
                )}
              </div>

              <div className="p-4 divide-y divide-gray-100">
                {activeItems.map((item) => (
                  <div key={`${item.id}-${item.selectedWeight}`} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-50 rounded-lg p-1 flex items-center justify-center border border-amber-100 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                        <span className="text-xs text-gray-500">Qty: {item.quantity} • Weight: {item.selectedWeight}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900 font-['Montserrat']">
                        ₹{item.finalPrice * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4: Payment Options (Radio Buttons) */}
            <div id="payment-section" className={`bg-white rounded-lg shadow-sm border transition-colors overflow-hidden ${paymentError ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'}`}>
              <div className="p-4 bg-[#2874f0] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-white text-[#2874f0] text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Payment Options
                  </span>
                </div>
                {paymentError && (
                  <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                    Selection Required
                  </span>
                )}
              </div>

              {paymentError && (
                <div className="m-4 mb-0 p-3.5 bg-red-50 border border-red-300 rounded-lg text-xs font-bold text-red-700 flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="divide-y divide-gray-200">
                
                {/* 1. UPI */}
                <div className={`p-4 transition-colors ${paymentMethod === 'upi' ? 'bg-orange-50/40' : 'hover:bg-gray-50'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_option"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => handlePaymentSelect('upi')}
                      className="mt-1 text-primary focus:ring-primary w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">UPI (PhonePe, Google Pay, Paytm, BHIM)</span>
                        <div className="flex items-center gap-2 text-xs text-green-700 font-bold">
                          ⚡ Instant & Safe
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Pay directly via your favorite UPI app or virtual payment address.</p>

                      {paymentMethod === 'upi' && (
                        <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                          {/* Sub-mode selector: Type UPI ID vs Scan QR Code */}
                          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <button
                              type="button"
                              onClick={() => setUpiMode('id')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                upiMode === 'id'
                                  ? 'bg-primary text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <span>✏️ Enter UPI ID / VPA</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setUpiMode('qr')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                upiMode === 'qr'
                                  ? 'bg-primary text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <span>📱 Scan QR Code</span>
                            </button>
                          </div>

                          {upiMode === 'id' ? (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { id: 'phonepe', label: 'PhonePe', handle: '@ybl' },
                                  { id: 'gpay', label: 'Google Pay', handle: '@okaxis' },
                                  { id: 'paytm', label: 'Paytm', handle: '@paytm' },
                                  { id: 'bhim', label: 'BHIM UPI', handle: '@upi' }
                                ].map((app) => (
                                  <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => {
                                      setUpiType(app.id);
                                      if (!upiId) setUpiId(`user${app.handle}`);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                      upiType === app.id
                                        ? 'bg-primary/10 text-primary border-primary font-black shadow-sm'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {app.label}
                                  </button>
                                ))}
                              </div>

                              <div className="max-w-sm">
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                  Virtual Payment Address (VPA) *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. user@okicici or 9876543210@ybl"
                                  value={upiId}
                                  onChange={(e) => setUpiId(e.target.value)}
                                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                                />
                                <span className="text-[11px] text-gray-400 mt-1 block">
                                  A payment request will be sent to your UPI app for authorization.
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Scan QR Code Box */
                            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center max-w-xs space-y-2 shadow-sm">
                              <span className="text-xs font-bold text-gray-800 block">
                                Scan with any UPI App
                              </span>
                              <div className="w-36 h-36 mx-auto bg-amber-50/50 p-2.5 rounded-xl border border-dashed border-primary/40 flex items-center justify-center relative">
                                <svg className="w-32 h-32 text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                                  {/* Corner Top-Left */}
                                  <rect x="5" y="5" width="28" height="28" rx="4" fill="#ef5323" />
                                  <rect x="11" y="11" width="16" height="16" fill="white" />
                                  <rect x="15" y="15" width="8" height="8" rx="2" fill="#ef5323" />
                                  {/* Corner Top-Right */}
                                  <rect x="67" y="5" width="28" height="28" rx="4" fill="#ef5323" />
                                  <rect x="73" y="11" width="16" height="16" fill="white" />
                                  <rect x="77" y="15" width="8" height="8" rx="2" fill="#ef5323" />
                                  {/* Corner Bottom-Left */}
                                  <rect x="5" y="67" width="28" height="28" rx="4" fill="#ef5323" />
                                  <rect x="11" y="73" width="16" height="16" fill="white" />
                                  <rect x="15" y="77" width="8" height="8" rx="2" fill="#ef5323" />
                                  {/* Dummy Data Bits */}
                                  <rect x="40" y="8" width="8" height="8" fill="#1f2937" />
                                  <rect x="52" y="12" width="6" height="6" fill="#1f2937" />
                                  <rect x="42" y="24" width="14" height="6" fill="#1f2937" />
                                  <rect x="8" y="42" width="10" height="6" fill="#1f2937" />
                                  <rect x="24" y="48" width="8" height="8" fill="#1f2937" />
                                  <rect x="38" y="40" width="24" height="24" rx="4" fill="#2b1810" />
                                  <circle cx="50" cy="52" r="5" fill="#ef5323" />
                                  <rect x="68" y="42" width="8" height="8" fill="#1f2937" />
                                  <rect x="82" y="46" width="10" height="6" fill="#1f2937" />
                                  <rect x="42" y="70" width="8" height="14" fill="#1f2937" />
                                  <rect x="56" y="76" width="12" height="8" fill="#1f2937" />
                                  <rect x="76" y="68" width="16" height="8" fill="#1f2937" />
                                  <rect x="82" y="82" width="12" height="10" fill="#1f2937" />
                                </svg>
                              </div>
                              <div className="text-xs font-black text-primary font-['Montserrat']">
                                Amount: ₹{activeGrandTotal}
                              </div>
                              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-semibold">
                                <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* 2. Credit / Debit Card */}
                <div className={`p-4 transition-colors ${paymentMethod === 'card' ? 'bg-orange-50/40' : 'hover:bg-gray-50'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_option"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => handlePaymentSelect('card')}
                      className="mt-1 text-primary focus:ring-primary w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">Credit / Debit / ATM Card</span>
                        <span className="text-xs text-gray-400">Visa, Mastercard, RuPay</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">All domestic and international cards accepted.</p>

                      {paymentMethod === 'card' && (
                        <div className="mt-4 pt-3 border-t border-gray-200 max-w-md space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                              Card Number *
                            </label>
                            <input
                              type="text"
                              maxLength={19}
                              placeholder="4242 •••• •••• 4242"
                              value={cardData.number}
                              onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                Valid Thru *
                              </label>
                              <input
                                type="text"
                                maxLength={5}
                                placeholder="MM/YY"
                                value={cardData.expiry}
                                onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                CVV / CVC *
                              </label>
                              <input
                                type="password"
                                maxLength={4}
                                placeholder="•••"
                                value={cardData.cvv}
                                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              placeholder="Name as printed on card"
                              value={cardData.name}
                              onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <p className="text-[11px] text-gray-400">
                            🔒 Dummy card fields for simulation. Will be replaced by Razorpay/Stripe secure element in production.
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* 3. Net Banking */}
                <div className={`p-4 transition-colors ${paymentMethod === 'netbanking' ? 'bg-orange-50/40' : 'hover:bg-gray-50'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_option"
                      value="netbanking"
                      checked={paymentMethod === 'netbanking'}
                      onChange={() => handlePaymentSelect('netbanking')}
                      className="mt-1 text-primary focus:ring-primary w-4 h-4"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-gray-900 block">Net Banking</span>
                      <p className="text-xs text-gray-500 mt-0.5">Select from top Indian banks.</p>

                      {paymentMethod === 'netbanking' && (
                        <div className="mt-4 pt-3 border-t border-gray-200 max-w-sm space-y-2">
                          <label className="block text-[11px] font-bold text-gray-600 uppercase">
                            Select Your Bank *
                          </label>
                          <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white font-semibold"
                          >
                            <option value="HDFC Bank">HDFC Bank</option>
                            <option value="State Bank of India">State Bank of India (SBI)</option>
                            <option value="ICICI Bank">ICICI Bank</option>
                            <option value="Axis Bank">Axis Bank</option>
                            <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                            <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                            <option value="Bank of Baroda">Bank of Baroda</option>
                            <option value="Canara Bank">Canara Bank</option>
                          </select>
                          <p className="text-[11px] text-gray-400">
                            You will be redirected to your bank's secure page to authorize payment.
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* 4. Cash on Delivery (COD) */}
                <div id="cod-section" className={`p-4 transition-colors ${paymentMethod === 'cod' ? 'bg-orange-50/40' : 'hover:bg-gray-50'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_option"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => handlePaymentSelect('cod')}
                      className="mt-1 text-primary focus:ring-primary w-4 h-4"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-gray-900 block">Cash on Delivery (COD)</span>
                      <p className="text-xs text-gray-500 mt-0.5">Pay with cash or scan delivery QR upon arrival.</p>

                      {paymentMethod === 'cod' && (
                        <div className="mt-4 pt-3 border-t border-gray-200 max-w-xs space-y-2">
                          <label className="block text-[11px] font-bold text-gray-700 uppercase">
                            Enter verification code *
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="bg-amber-100 text-amber-900 font-black tracking-widest text-sm px-3.5 py-1.5 rounded border border-amber-300 select-none shadow-inner">
                              {captchaCode}
                            </span>
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="Enter 4 digits"
                              value={captchaInput}
                              onChange={(e) => {
                                setCaptchaInput(e.target.value);
                                setCodError('');
                              }}
                              className={`w-32 px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                                codError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {codError && (
                            <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                              <span>⚠️</span> {codError}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400">
                            Cash or UPI QR payment accepted upon courier delivery.
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

              </div>

              {/* Big Place Order Button (Flipkart Style) */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full sm:w-auto bg-[#fb641b] hover:bg-[#e85a14] active:bg-[#d44e10] text-white font-extrabold uppercase text-sm tracking-wider px-10 py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {isPlacingOrder ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Creating Order...
                    </span>
                  ) : (
                    <span>Place Order (₹{activeGrandTotal}) →</span>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: PRICE DETAILS (Flipkart Breakdown with CGST & SGST) */}
          <div className="lg:col-span-4 sticky top-20">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Price Details
                </h2>
              </div>

              <div className="p-5 space-y-3 text-sm">
                
                {/* Price (Subtotal) */}
                <div className="flex items-center justify-between text-gray-800">
                  <span>Price (Subtotal)</span>
                  <span className="font-semibold">₹{activeSubtotal}</span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between text-gray-800">
                  <span>Discount</span>
                  <span className="font-bold text-green-600">− ₹{activeDiscount}</span>
                </div>

                {/* Delivery Charges */}
                <div className="flex items-center justify-between text-gray-800">
                  <span>Delivery Charges</span>
                  {activeDeliveryCharge === 0 ? (
                    <span className="font-bold text-green-600 uppercase">
                      <span className="line-through text-gray-400 font-normal mr-1">₹40</span> Free
                    </span>
                  ) : (
                    <span className="font-semibold text-gray-900">₹{activeDeliveryCharge}</span>
                  )}
                </div>

                {/* CGST (2.5%) */}
                <div className="flex items-center justify-between text-gray-800">
                  <span className="flex items-center gap-1.5">
                    <span>CGST (2.5%)</span>
                    <span className="bg-orange-100 text-primary text-[10px] font-black px-1.5 py-0.5 rounded">
                      2.5%
                    </span>
                  </span>
                  <span className="font-semibold text-gray-900">₹{activeCgst.toFixed(2)}</span>
                </div>

                {/* SGST (2.5%) */}
                <div className="flex items-center justify-between text-gray-800">
                  <span className="flex items-center gap-1.5">
                    <span>SGST (2.5%)</span>
                    <span className="bg-orange-100 text-primary text-[10px] font-black px-1.5 py-0.5 rounded">
                      2.5%
                    </span>
                  </span>
                  <span className="font-semibold text-gray-900">₹{activeSgst.toFixed(2)}</span>
                </div>

                {/* Total Amount */}
                <div className="flex items-center justify-between text-base sm:text-lg font-black text-gray-900 pt-3 border-t border-gray-200 border-dashed font-['Montserrat']">
                  <span>Total Amount</span>
                  <span className="text-primary text-xl">₹{activeGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Savings Banner */}
              {activeDiscount > 0 && (
                <div className="bg-green-50 px-5 py-3 border-t border-green-200 text-xs font-bold text-green-800 flex items-center gap-2">
                  <span>🎉</span>
                  <span>You are saving ₹{activeDiscount} on this order!</span>
                </div>
              )}

              {/* Bottom Guarantee */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Protinut Freshness & Taste Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Dispatched from Dharashiv, Maharashtra</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Mobile Sticky Place Order Bar (< 768px) */}
        {activeItems.length > 0 && (
          <div className="md:hidden fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] flex items-center justify-between z-40">
            <div>
              <span className="block text-[11px] text-gray-500 font-semibold uppercase">Total Amount</span>
              <span className="text-lg font-black text-primary font-['Montserrat']">₹{activeGrandTotal}</span>
            </div>
            <button
              type="button"
              disabled={isPlacingOrder}
              onClick={handlePlaceOrder}
              className="bg-[#fb641b] hover:bg-[#e85a14] active:bg-[#d44e10] text-white font-extrabold uppercase text-xs tracking-wider px-6 py-3 rounded-lg shadow-md flex items-center gap-1.5"
            >
              {isPlacingOrder ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span>Place Order →</span>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CheckoutPage;
