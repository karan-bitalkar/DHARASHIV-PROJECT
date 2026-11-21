const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const localDate = (year, month, day) => {
  const date = new Date(year, month, day);
  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== year
    || date.getMonth() !== month
    || date.getDate() !== day
  ) return null;
  return date;
};

export const parseOrderDate = (order) => {
  const candidates = [order?.createdAt, order?.orderDate, order?.date, order?.invoiceDate];
  for (const candidate of candidates) {
    if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) return candidate;
    if (typeof candidate !== 'string' || !candidate.trim()) continue;
    const value = candidate.trim();
    const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) {
      const date = localDate(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
      if (date) return date;
      continue;
    }

    const dayMonthYear = value.match(/^(\d{1,2})\s+([a-z]{3,})\s+(\d{4})$/i);
    if (dayMonthYear) {
      const month = monthNames.indexOf(dayMonthYear[2].slice(0, 3).toLowerCase());
      const date = month >= 0 ? localDate(Number(dayMonthYear[3]), month, Number(dayMonthYear[1])) : null;
      if (date) return date;
      continue;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

export const getDateWindow = (range, customStart, customEnd, now = new Date()) => {
  if (range === 'all') return { start: null, end: null, allTime: true };

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now);

  if (range === 'today') return { start, end };
  if (range === '7d' || range === '30d') {
    start.setDate(start.getDate() - (range === '7d' ? 6 : 29));
    return { start, end };
  }
  if (range === 'month') {
    start.setDate(1);
    return { start, end };
  }
  if (range === 'year') {
    start.setMonth(0, 1);
    return { start, end };
  }
  if (range !== 'custom') return { start, end, invalid: true };

  const startMatch = String(customStart || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const endMatch = String(customEnd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!startMatch || !endMatch) return { start: null, end: null, invalid: true };

  const customStartDate = localDate(Number(startMatch[1]), Number(startMatch[2]) - 1, Number(startMatch[3]));
  const customEndDate = localDate(Number(endMatch[1]), Number(endMatch[2]) - 1, Number(endMatch[3]));
  if (!customStartDate || !customEndDate || customStartDate > customEndDate) {
    return { start: customStartDate, end: customEndDate, invalid: true };
  }
  customEndDate.setHours(23, 59, 59, 999);
  return { start: customStartDate, end: customEndDate };
};

const normalizeState = (state) => {
  const raw = typeof state === 'string' ? state.trim().replace(/\s+/g, ' ').normalize('NFC') : '';
  if (!raw) return { key: 'unknown state', name: 'Unknown State' };
  const key = raw.toLocaleLowerCase('en-IN');
  const name = raw.toLocaleLowerCase('en-IN')
    .replace(/(^|[\s-])([a-z])/g, (_, separator, letter) => `${separator}${letter.toLocaleUpperCase('en-IN')}`)
    .replace(/(\s)(And|Of)(?=\s)/g, (_, separator, word) => `${separator}${word.toLocaleLowerCase('en-IN')}`);
  return { key, name };
};

const orderStatus = (order) => String(order?.status || '')
  .trim()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('en-IN');

const actualRefundAmount = (order, status) => {
  const values = [
    order?.refundedAmount,
    order?.refund?.refundedAmount,
    order?.pricing?.refundedAmount
  ];
  if (status.includes('partially refunded') || status === 'returned') {
    values.push(order?.refundAmount, order?.refund?.amount, order?.pricing?.refundAmount);
  }
  const actualAmount = values.find((value) => (
    value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
  ));
  return actualAmount === undefined ? null : Number(actualAmount);
};

const orderQuantity = (order) => (Array.isArray(order?.items) ? order.items : []).reduce((total, item) => {
  const quantity = Number(item?.quantity);
  const returnedQuantity = Number(item?.returnedQuantity || 0);
  if (!Number.isFinite(quantity) || quantity <= 0) return total;
  return total + Math.max(0, quantity - (Number.isFinite(returnedQuantity) ? returnedQuantity : 0));
}, 0);

export const buildStateWiseSales = (orders, window, getOrderAmount) => {
  const stateTotals = new Map();
  const diagnostics = { missingDate: 0, missingRefundAmount: 0 };
  let totalOrders = 0;
  let totalQuantity = 0;
  let totalRevenue = 0;

  orders.forEach((order) => {
    const status = orderStatus(order);
    if (status === 'cancelled' || status === 'canceled') return;
    if (status === 'refunded' || status === 'fully refunded') return;

    const date = parseOrderDate(order);
    if (!window.allTime) {
      if (!date) {
        diagnostics.missingDate += 1;
        return;
      }
      if (date < window.start || date > window.end) return;
    }

    const grossAmount = Number(getOrderAmount(order));
    if (!Number.isFinite(grossAmount) || grossAmount < 0) return;

    const refundAmount = actualRefundAmount(order, status);
    if ((status === 'returned' || status.includes('partially refunded')) && refundAmount === null) {
      diagnostics.missingRefundAmount += 1;
      return;
    }

    const netRevenue = Math.max(0, grossAmount - (refundAmount || 0));
    if (netRevenue === 0) return;

    const state = normalizeState(order?.address?.state);
    const current = stateTotals.get(state.key) || { ...state, orders: 0, quantity: 0, revenue: 0 };
    const quantity = orderQuantity(order);
    current.orders += 1;
    current.quantity += quantity;
    current.revenue += netRevenue;
    stateTotals.set(state.key, current);
    totalOrders += 1;
    totalQuantity += quantity;
    totalRevenue += netRevenue;
  });

  const states = [...stateTotals.values()]
    .map((state) => ({
      ...state,
      averageOrderValue: state.orders ? state.revenue / state.orders : 0,
      revenuePercentage: totalRevenue ? (state.revenue / totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));

  const statesWithSales = states.filter((state) => state.key !== 'unknown state' && state.revenue > 0).length;
  const topPerformingState = states.find((state) => state.key !== 'unknown state') || null;

  return {
    states,
    totalOrders,
    totalQuantity,
    totalRevenue,
    averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
    statesWithSales,
    topPerformingState,
    diagnostics
  };
};
