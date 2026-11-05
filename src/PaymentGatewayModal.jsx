import React, { useState, useEffect } from 'react';
import logoImg from './assets/protinut-logo.png';

const PaymentGatewayModal = ({
  isOpen,
  onClose,
  amount,
  paymentMethod,
  customerDetails = {},
  onPaymentSuccess,
  onPaymentFailure
}) => {
  const [isConnecting, setIsConnecting] = useState(true);

  // Simulate 2-second bank server connection on modal open
  useEffect(() => {
    if (isOpen) {
      setIsConnecting(true);
      const timer = setTimeout(() => {
        setIsConnecting(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const paymentLabel = paymentMethod === 'upi'
    ? 'UPI (Unified Payments Interface)'
    : paymentMethod === 'card'
    ? 'Credit / Debit Card'
    : paymentMethod === 'netbanking'
    ? 'Net Banking'
    : 'Online Payment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in font-sans">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gateway Header (Razorpay / Protinut Theme) */}
        <div className="bg-[#1e293b] p-5 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Protinut" className="h-8 object-contain bg-white/10 rounded-md p-1" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wide font-['Montserrat']">PROTINUT PAY</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  TEST MODE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Razorpay / Stripe Gateway Simulator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Title & Amount Card */}
          <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-4 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-950 block">
              Complete Your Payment
            </span>
            <div className="text-3xl font-black text-primary font-['Montserrat'] mt-1">
              ₹{Number(amount).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Method: <strong className="text-gray-800">{paymentLabel}</strong>
            </p>
          </div>

          {/* Prefilled Customer Info (Phone required by Gateway) */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer:</span>
              <strong className="text-gray-900">{customerDetails.name || 'Valued Customer'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mobile (OTP SMS):</span>
              <strong className="text-gray-900 font-mono">+91 {customerDetails.mobile || '9876543210'}</strong>
            </div>
            {customerDetails.email && (
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-800 truncate max-w-[200px]">{customerDetails.email}</span>
              </div>
            )}
          </div>

          {/* 2-Second Bank Simulation State */}
          {isConnecting ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-gray-800">
                Connecting to banking gateway...
              </div>
              <p className="text-xs text-gray-400">
                Securing 256-bit end-to-end encrypted connection. Please do not close or refresh.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
                <span className="text-base">🟢</span>
                <span>
                  <strong>Bank Server Connected.</strong> Please simulate the transaction result below:
                </span>
              </div>

              {/* Demo Action Buttons: Green Successful & Red Failed */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={onPaymentSuccess}
                  className="w-full bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-extrabold uppercase text-xs tracking-wider py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Payment Successful (Test)</span>
                </button>

                <button
                  type="button"
                  onClick={onPaymentFailure}
                  className="w-full bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white font-extrabold uppercase text-xs tracking-wider py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Payment Failed (Test)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1 font-semibold">
            🔒 256-Bit SSL Encrypted
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 underline font-medium"
          >
            Cancel & Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayModal;

