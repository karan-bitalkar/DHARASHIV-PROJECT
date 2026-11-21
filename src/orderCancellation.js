const SUCCESSFUL_PAYMENT_STATUSES = new Set([
  'success',
  'successful',
  'succeeded',
  'payment successful',
  'paid',
  'completed',
  'captured'
]);

export const isCodPaymentMethod = (paymentMethod) => {
  const normalizedMethod = String(paymentMethod || '').toLocaleLowerCase('en-IN');
  return normalizedMethod.includes('cash on delivery') || /(^|[^a-z])cod([^a-z]|$)/.test(normalizedMethod);
};

const validAmount = (value) => (
  value !== null
  && value !== undefined
  && value !== ''
  && Number.isFinite(Number(value))
  && Number(value) >= 0
);

export const getCancellationPaymentInfo = (order) => {
  const paymentMethod = String(order?.paymentMethod || '').trim();
  if (isCodPaymentMethod(paymentMethod)) {
    return { type: 'cod', paymentMethod };
  }

  const paymentStatus = String(order?.paymentStatus || '').trim();
  const normalizedStatus = paymentStatus.toLocaleLowerCase('en-IN').replace(/[_-]+/g, ' ');
  if (!SUCCESSFUL_PAYMENT_STATUSES.has(normalizedStatus)) {
    return {
      type: 'not-successful',
      paymentMethod,
      paymentStatus: paymentStatus || 'Not recorded'
    };
  }

  const totalValues = [
    order?.pricing?.grandTotal,
    order?.grandTotal,
    order?.total
  ];
  const total = totalValues.find(validAmount);
  if (total === undefined) {
    return { type: 'amount-unavailable', paymentMethod, paymentStatus };
  }

  const refundedValues = [
    order?.refundedAmount,
    order?.refund?.refundedAmount,
    order?.pricing?.refundedAmount,
    order?.refundAmount,
    order?.refund?.amount,
    order?.pricing?.refundAmount
  ];
  const alreadyRefunded = refundedValues.find(validAmount);

  return {
    type: 'prepaid-success',
    paymentMethod,
    paymentStatus,
    eligibleRefundAmount: Math.max(0, Number(total) - Number(alreadyRefunded || 0))
  };
};
