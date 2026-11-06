export const STOCK_STATUSES = [
  'In Stock',
  'Low Stock',
  'High Demand',
  'Out of Stock',
  'Currently Unavailable'
];

export const getProductStockStatus = (product) => {
  if (STOCK_STATUSES.includes(product?.stockStatus)) return product.stockStatus;
  if (product?.inStock === false || product?.isAvailable === false) return 'Currently Unavailable';
  if (product?.stock != null && Number(product.stock) <= 0) return 'Out of Stock';
  return 'In Stock';
};

export const isProductPurchasable = (product) => (
  !['Out of Stock', 'Currently Unavailable'].includes(getProductStockStatus(product))
);

export const getStockStatusClass = (status) => (
  status.toLowerCase().replace(/\s+/g, '-')
);

export const getStockStatusIcon = (status) => {
  if (status === 'High Demand') return '🔥';
  if (status === 'Low Stock') return '⚠';
  if (status === 'Out of Stock' || status === 'Currently Unavailable') return '○';
  return '●';
};
