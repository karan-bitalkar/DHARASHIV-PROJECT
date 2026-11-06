const asPrice = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const isOneKilogram = (weight, option) => (
  /1\s*kg/i.test(`${weight || ''} ${option?.id || ''} ${option?.label || ''}`)
);

export const getDiscountPercent = (mrp, finalPrice) => {
  const safeMrp = asPrice(mrp);
  const safeFinalPrice = asPrice(finalPrice);
  if (!safeMrp) return 0;
  const percentage = ((safeMrp - safeFinalPrice) / safeMrp) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage * 100) / 100));
};

export const getProductPricing = (product, weight) => {
  const options = Array.isArray(product?.weightOptions) ? product.weightOptions : [];
  const requestedOneKilogram = isOneKilogram(weight, null);
  const option = options.find((item) => item.id === weight || item.label === weight)
    || options.find((item) => isOneKilogram('', item) === requestedOneKilogram)
    || options[0];
  const oneKilogram = isOneKilogram(weight, option);
  const finalKey = oneKilogram ? 'price1kg' : 'price550';
  const mrpKey = oneKilogram ? 'originalPrice1kg' : 'originalPrice550';
  const discountKey = oneKilogram ? 'discountPercent1kg' : 'discountPercent550';
  const finalPrice = asPrice(oneKilogram ? product?.[finalKey] : option?.price, asPrice(product?.[finalKey]));
  const mrp = asPrice(oneKilogram ? product?.[mrpKey] : option?.original, asPrice(product?.[mrpKey], finalPrice));
  const discountPercent = Number.isFinite(Number(product?.[discountKey]))
    ? Math.max(0, Math.min(100, Number(product[discountKey])))
    : getDiscountPercent(mrp, finalPrice);

  return { finalPrice, mrp, discountPercent, option };
};
