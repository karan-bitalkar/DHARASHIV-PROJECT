const normalizeIdentity = (value) => String(value || '').trim().toLowerCase();

export const getCustomerIdentity = (user) => (
  normalizeIdentity(user?.email) || normalizeIdentity(user?.identifier)
);

export const isOrderOwnedByUser = (order, user) => {
  const identity = getCustomerIdentity(user);
  const orderIdentity = normalizeIdentity(order?.userEmail) || normalizeIdentity(order?.address?.email);
  return Boolean(identity && orderIdentity && identity === orderIdentity);
};

export const getCustomerOrders = (orders, user) => (
  Array.isArray(orders) ? orders.filter((order) => isOrderOwnedByUser(order, user)) : []
);
