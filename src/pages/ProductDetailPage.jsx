import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductReviewSection from '../ProductReviewSection';
import { useAdminStore } from '../AdminStoreContext';
import { useGlobalSettings } from '../GlobalSettingsContext';
import { getDiscountPercent, getProductPricing } from '../productPricing';
import { getProductStockStatus, getStockStatusClass, getStockStatusIcon, isProductPurchasable } from '../productAvailability';
import './ProductDetailPage.css';

const getProductVariants = (product) => {
  if (Array.isArray(product?.weightOptions) && product.weightOptions.length > 0) {
    return product.weightOptions.map((option) => ({
      ...option,
      id: String(option.id || option.label),
      label: option.label || option.id
    }));
  }

  const variants = [];
  if (product?.price550 != null) variants.push({ id: '550gm', label: '550gm', price: product.price550, original: product.originalPrice550 });
  if (product?.price1kg != null) variants.push({ id: '1kg', label: '1kg', price: product.price1kg, original: product.originalPrice1kg });
  if (variants.length === 0 && product?.price != null) {
    variants.push({ id: String(product.weight || 'standard'), label: product.weight || 'Standard', price: product.price, original: product.originalPrice });
  }
  return variants;
};

const getProductImages = (product) => {
  const providedImages = Array.isArray(product?.images) ? product.images : [];
  return [...new Set([
    product?.image,
    product?.studioImage,
    ...providedImages
  ].filter((image) => typeof image === 'string' && image.trim()))];
};

const ProductDetailPage = ({
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  wishlistItems = []
}) => {
  const { id } = useParams();
  const { products } = useAdminStore();
  const { settings } = useGlobalSettings();
  const product = products.find((item) => String(item.id) === id);
  const variants = useMemo(() => getProductVariants(product), [product]);
  const images = useMemo(() => getProductImages(product), [product]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!product) return;
    const defaultVariant = variants.find((variant) => variant.id === String(product.defaultWeight))
      || variants[0];
    setSelectedVariantId(defaultVariant?.id || '');
    setActiveImage(images[0] || '');
    setQuantity(1);
    setIsZoomed(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [product, variants, images]);

  useEffect(() => {
    if (!product) return undefined;
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionMeta?.getAttribute('content');
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const previousCanonical = canonicalLink?.getAttribute('href');
    const pageTitle = `${product.name} | PROTINUT`;
    document.title = pageTitle;

    let metaDescription = descriptionMeta;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    if (product.description) metaDescription.setAttribute('content', product.description);

    let canonical = canonicalLink;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;

    return () => {
      document.title = previousTitle;
      if (previousDescription == null) metaDescription.remove();
      else metaDescription.setAttribute('content', previousDescription);
      if (previousCanonical == null) canonical.remove();
      else canonical.href = previousCanonical;
    };
  }, [product]);

  if (!product) {
    return (
      <div className="product-detail-page-wrapper">
        <div className="detail-not-found">
          <span aria-hidden="true">🥜</span>
          <h1>Product not found</h1>
          <p>This product may have been removed or the link may be incorrect.</p>
          <Link to="/products" className="detail-back-to-shop">Browse products</Link>
        </div>
      </div>
    );
  }

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || variants[0];
  const pricing = getProductPricing(product, selectedVariant?.id);
  const currentPrice = selectedVariant?.price ?? pricing.finalPrice;
  const originalPrice = selectedVariant?.original ?? pricing.mrp;
  const discount = getDiscountPercent(originalPrice, currentPrice);
  const stockStatus = getProductStockStatus(product);
  const canPurchase = isProductPurchasable(product);
  const isWishlisted = wishlistItems.some((item) => item.id === product.id);
  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 6);
  const nutrition = product.nutritionalInformation || product.nutrition || product.nutrients;
  const productBenefits = product.benefits;
  const features = product.features;
  const ingredients = product.ingredients;
  const storageInstructions = product.storageInstructions || settings.storageInstructions;

  const handleAddToCart = (item = product, variant = selectedVariant, qty = quantity) => {
    if (!isProductPurchasable(item) || !onAddToCart || !variant) return;
    const itemPricing = getProductPricing(item, variant.id);
    onAddToCart({
      ...item,
      selectedWeight: variant.label,
      finalPrice: variant.price ?? itemPricing.finalPrice,
      originalPrice: variant.original ?? itemPricing.mrp,
      quantity: qty,
      image: item.image
    });
  };

  const handleBuyNow = () => {
    if (!canPurchase || !selectedVariant || !onBuyNow) return;
    onBuyNow({
      ...product,
      selectedWeight: selectedVariant.label,
      originalPrice,
      finalPrice: currentPrice,
      quantity,
      image: product.image
    });
  };

  const renderInformation = (value) => {
    if (Array.isArray(value)) {
      return (
        <ul className="detail-information-list">
          {value.map((item, index) => (
            <li key={item?.id || item?.label || index}>
              {typeof item === 'object'
                ? [item.label, item.value ?? item.val, item.desc].filter(Boolean).join(' · ')
                : item}
            </li>
          ))}
        </ul>
      );
    }
    if (value && typeof value === 'object') {
      return (
        <dl className="detail-information-grid">
          {Object.entries(value).map(([label, item]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</dd>
            </div>
          ))}
        </dl>
      );
    }
    return <p className="detail-section-copy">{value}</p>;
  };

  return (
    <div className="product-detail-page-wrapper">
      <div className="detail-breadcrumb-strip">
        <div className="detail-container">
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <Link to="/">Home</Link> / <Link to="/products">Products</Link> / <span>{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="detail-container">
        <section className="main-hero-grid" aria-labelledby="product-name">
          <div className="detail-gallery-column">
            <div className={`detail-main-image-stage ${isZoomed ? 'is-zoomed' : ''}`}>
              {product.tag && <span className="detail-top-badge">{product.tag}</span>}
              {activeImage ? (
                <button
                  type="button"
                  className="detail-image-zoom"
                  onClick={() => setIsZoomed((zoomed) => !zoomed)}
                  aria-label={isZoomed ? 'Zoom out product image' : 'Zoom in product image'}
                  aria-pressed={isZoomed}
                >
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="detail-hero-img"
                    onError={() => setActiveImage('')}
                  />
                </button>
              ) : (
                <div className="detail-image-unavailable">Product image unavailable</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="detail-thumbnails-row" aria-label="Product images">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={`thumbnail-btn ${activeImage === image ? 'active' : ''}`}
                    onClick={() => {
                      setActiveImage(image);
                      setIsZoomed(false);
                    }}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={activeImage === image}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-info-column">
            {product.category && (
              <div className="detail-header-tags">
                <span className="detail-cat-pill">{product.category}</span>
              </div>
            )}
            <h1 id="product-name" className="detail-product-name">{product.name}</h1>
            {product.tagline && <p className="detail-tagline">{product.tagline}</p>}

            {(Number(product.rating) > 0 || Number(product.reviewsCount) > 0) && (
              <div className="detail-rating-jump-row">
                {Number(product.rating) > 0 && (
                  <>
                    <span className="stars-cluster" aria-label={`${product.rating} out of 5 stars`}>★★★★★</span>
                    <strong className="rating-score-text">{product.rating} / 5</strong>
                  </>
                )}
                {Number(product.reviewsCount) > 0 && (
                  <a href="#reviews-section" className="jump-to-reviews-link">
                    {product.reviewsCount} reviews
                  </a>
                )}
              </div>
            )}

            <div className="detail-pricing-box">
              <div className="price-row">
                <span className="current-price-big">₹{currentPrice ?? '—'}</span>
                {originalPrice > currentPrice && <span className="original-price-strike">₹{originalPrice}</span>}
                {discount > 0 && <span className="discount-pill-green">{Math.round(discount)}% off</span>}
              </div>
              <span className={`product-stock-status status-${getStockStatusClass(stockStatus)}`}>
                {getStockStatusIcon(stockStatus)} {stockStatus}
              </span>
              <span className="tax-inclusive-note">Inclusive of applicable taxes. Delivery calculated at checkout; free on orders over ₹499.</span>
            </div>

            {variants.length > 0 && (
              <fieldset className="detail-weight-selector">
                <legend className="selector-title">Choose an option</legend>
                <div className="weight-buttons-group">
                  {variants.map((variant) => {
                    const variantPrice = variant.price ?? getProductPricing(product, variant.id).finalPrice;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        className={`weight-btn ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                        onClick={() => setSelectedVariantId(variant.id)}
                        aria-pressed={selectedVariant?.id === variant.id}
                      >
                        <strong>{variant.label}</strong>
                        {variantPrice != null && <small>₹{variantPrice}</small>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div className="detail-actions-panel">
              <div className="detail-qty-control" aria-label="Quantity">
                <button type="button" className="qty-btn" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">−</button>
                <span className="qty-val">{quantity}</span>
                <button type="button" className="qty-btn" onClick={() => setQuantity((value) => Math.min(5, value + 1))} disabled={quantity >= 5} aria-label="Increase quantity">+</button>
              </div>
              <button type="button" className="btn-detail-add-cart" onClick={() => handleAddToCart()} disabled={!canPurchase || !selectedVariant}>
                {canPurchase ? 'Add to cart' : stockStatus}
              </button>
              <button type="button" className="btn-detail-buy-now" onClick={handleBuyNow} disabled={!canPurchase || !selectedVariant}>
                Buy now
              </button>
              <button
                type="button"
                className={`btn-detail-wishlist ${isWishlisted ? 'active' : ''}`}
                onClick={() => onToggleWishlist?.({
                  id: product.id,
                  name: product.name,
                  weight: selectedVariant?.label,
                  price: currentPrice,
                  originalPrice,
                  image: product.image,
                  rating: product.rating,
                  reviewsCount: product.reviewsCount,
                  tag: product.tag
                })}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {isWishlisted ? '♥' : '♡'}
              </button>
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="detail-related-section" aria-labelledby="related-products-heading">
            <div className="detail-section-heading">
              <span>DISCOVER MORE</span>
              <h2 id="related-products-heading">You May Also Like</h2>
            </div>
            <div className="detail-related-grid">
              {relatedProducts.map((item) => {
                const itemVariant = getProductVariants(item)[0];
                const itemPricing = getProductPricing(item, itemVariant?.id);
                const itemPrice = itemVariant?.price ?? itemPricing.finalPrice;
                return (
                  <article className="detail-related-card" key={item.id}>
                    <Link to={`/product/${encodeURIComponent(item.id)}`} className="detail-related-image">
                      {item.image && <img src={item.image} alt={item.name} loading="lazy" />}
                    </Link>
                    <div className="detail-related-info">
                      <Link to={`/product/${encodeURIComponent(item.id)}`} className="detail-related-name">{item.name}</Link>
                      {Number(item.rating) > 0 && <span className="detail-related-rating">★ {item.rating}</span>}
                      {itemPrice != null && <strong>₹{itemPrice}</strong>}
                      <div className="detail-related-actions">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item, itemVariant, 1)}
                          disabled={!isProductPurchasable(item) || !itemVariant}
                        >
                          Add to cart
                        </button>
                        <Link to={`/product/${encodeURIComponent(item.id)}`}>Quick View</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div className="detail-information-sections">
          {product.description && <section className="detail-information-panel"><h2>Product Description</h2>{renderInformation(product.description)}</section>}
          {ingredients && <section className="detail-information-panel"><h2>Ingredients</h2>{renderInformation(ingredients)}</section>}
          {nutrition && <section className="detail-information-panel"><h2>Nutritional Information</h2>{renderInformation(nutrition)}</section>}
          {productBenefits && <section className="detail-information-panel"><h2>Benefits</h2>{renderInformation(productBenefits)}</section>}
          {features && <section className="detail-information-panel"><h2>Product Highlights</h2>{renderInformation(features)}</section>}
          {storageInstructions && <section className="detail-information-panel"><h2>Storage Instructions</h2>{renderInformation(storageInstructions)}</section>}
        </div>
      </div>

      <ProductReviewSection key={product.id} productId={product.id} productName={product.name} />
    </div>
  );
};

export default ProductDetailPage;
