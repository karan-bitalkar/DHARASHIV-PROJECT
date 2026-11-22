import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStore } from './AdminStoreContext';
import { getProductStockStatus, getStockStatusClass, getStockStatusIcon, isProductPurchasable } from './productAvailability';
import { getDiscountPercent } from './productPricing';
import './FeaturedShowcase.css';

const featuredProducts = [
  {
    id: 'dark-chocolate-crunch',
    name: 'PROTINUT Peanut Butter Dark Chocolate Crunch',
    tagline: 'Dark Chocolate • Crunchy Peanut Butter',
    category: 'DARK CHOCOLATE CRUNCH',
    inStock: true,
    isAvailable: true,
    stock: 1,
    stockStatus: 'In Stock',
    defaultWeight: '500gm',
    price550: 389,
    price1kg: 589,
    originalPrice550: 389,
    originalPrice1kg: 589,
    weightOptions: [
      { id: '500gm', label: '500 Gram', price: 389, original: 389 },
      { id: '1kg', label: '1000 Gram (1 KG)', price: 589, original: 589 }
    ],
    rating: 0,
    reviewsCount: 0,
    image: '/products/dark-chocolate-crunch-front.png',
    themeColor: '#9c1c4e',
    themeBg: '#fcf1f5',
    borderGlow: 'rgba(156, 28, 78, 0.25)',
    badge: '500G / 1KG JARS',
    sealText: 'PEANUT BUTTER',
    flavorNotes: 'Crunchy peanut butter made with roasted peanuts (79%) and chocolate ingredients.',
    tasteProfile: [
      { label: 'Serving Size', value: '32g' },
      { label: 'Protein per Serving', value: '8.32g' },
      { label: 'Added Sugars per Serving', value: '2.56g' }
    ],
    nutrients: [
      { label: 'Protein', value: '8.32g', desc: 'Per 32g serving' },
      { label: 'Dietary Fiber', value: '2.24g', desc: 'Per 32g serving' },
      { label: 'Trans Fat', value: '0g', desc: 'Per serving' },
      { label: 'Cholesterol', value: '0mg', desc: 'Per serving' }
    ],
    pairings: [
      { icon: '🥄', text: 'Use as a dip' },
      { icon: '🥤', text: 'Add to smoothies' },
      { icon: '🍞', text: 'Bread' },
      { icon: '🥨', text: 'Crackers' }
    ],
    highlights: [
      'Roasted peanuts (79%)',
      'No trans fat',
      'No hydrogenated oil',
      'No artificial ingredients'
    ],
    photoPills: ['⚡ Energy Booster', '🥜 High Protein', '8.32g Protein per serving']
  },
  {
    id: 'choco-crunch',
    name: 'Peanut Butter Choco Crunch',
    tagline: 'Rich Dark Cocoa Chunks • Wholesome Crunchy Peanut Butter',
    category: 'CHOCOLATE CRAFT',
    price550: 270,
    price1kg: 489,
    originalPrice550: 365,
    originalPrice1kg: 649,
    rating: 4.8,
    reviewsCount: 295,
    image: '/products/choco-crunch-original.jpg',
    themeColor: '#9c1c4e',
    themeBg: '#fcf1f5',
    borderGlow: 'rgba(156, 28, 78, 0.25)',
    badge: 'CHOCO SPECIAL',
    flavorNotes: 'Decadent dark cocoa seamlessly blended into slow-roasted peanut butter, infused with crispy roasted peanut pieces and real chocolate chunks. A guilt-free dessert replacement with massive plant protein.',
    tasteProfile: [
      { label: 'Crunch Level', value: 'Crispy Cocoa Crunch', score: '5/5' },
      { label: 'Cocoa Grade', value: 'Real Dark Cocoa', score: 'Rich & Velvety' },
      { label: 'Sweetness', value: 'Naturally Balanced', score: 'Zero Refined Sugar' }
    ],
    nutrients: [
      { label: 'Protein', value: '26g', desc: 'Per 100g' },
      { label: 'Real Cocoa', value: 'Pure', desc: 'Antioxidant Rich' },
      { label: 'Cholesterol', value: '0mg', desc: 'Zero' },
      { label: 'Preservatives', value: '0%', desc: '100% Clean' }
    ],
    pairings: [
      { icon: '🥞', text: 'Waffles & Crepes' },
      { icon: '🍓', text: 'Berry Smoothie Bowl' },
      { icon: '🥄', text: 'Direct Spoonfuls' },
      { icon: '🥐', text: 'Warm Croissants' }
    ],
    highlights: [
      'Real chocolate chunks infused with stone-ground peanut crunch',
      'Wholesome dessert crave fix packed with high natural protein',
      'Zero cholesterol and 100% pure vegetarian recipe',
      'Clean fuel for kids, fitness lovers, and dessert cravings'
    ]
  }
];

const FeaturedShowcase = ({
  onAddToCart,
  onBuyNow,
  wishlistItems = [],
  onToggleWishlist
}) => {
  const { products } = useAdminStore();
  const liveFeaturedProducts = featuredProducts.map((featuredProduct) => {
    const managedProduct = products.find((product) => product.id === featuredProduct.id);
    return managedProduct ? { ...featuredProduct, ...managedProduct } : featuredProduct;
  });
  // Dark Chocolate Crunch offers 500gm and 1kg; other products keep their own options.
  const [selectedWeights, setSelectedWeights] = useState({
    'dark-chocolate-crunch': '500gm',
    'choco-crunch': '550gm'
  });

  // Quantities per product
  const [quantities, setQuantities] = useState({
    'dark-chocolate-crunch': 1,
    'choco-crunch': 1
  });

  const handleWeightChange = (productId, weight) => {
    setSelectedWeights((prev) => ({ ...prev, [productId]: weight }));
  };

  const handleQtyChange = (productId, delta) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(5, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCartClick = (prod) => {
    if (!isProductPurchasable(prod)) return;
    const weight = selectedWeights[prod.id] || '550gm';
    const price = weight === '1kg' ? prod.price1kg : prod.price550;
    const qty = quantities[prod.id] || 1;

    if (onAddToCart) {
      onAddToCart({
        id: prod.id,
        name: prod.name,
        selectedWeight: weight,
        finalPrice: price,
        quantity: qty,
        image: prod.image
      });
    }
  };

  const handleBuyNowClick = (prod) => {
    if (!isProductPurchasable(prod)) return;
    const weight = selectedWeights[prod.id] || '550gm';
    const price = weight === '1kg' ? prod.price1kg : prod.price550;
    const original = weight === '1kg' ? prod.originalPrice1kg : prod.originalPrice550;
    const qty = quantities[prod.id] || 1;

    if (onBuyNow) {
      onBuyNow({
        id: prod.id,
        name: prod.name,
        selectedWeight: weight,
        originalPrice: original,
        finalPrice: price,
        quantity: qty,
        image: prod.image
      });
    }
  };

  return (
    <section className="featured-showcase-section" id="featured-products">
      {/* Ambient background glows */}
      <div className="showcase-bg-orb orb-amber" />
      <div className="showcase-bg-orb orb-rose" />

      <div className="featured-showcase-container">
        
        {/* Section Heading */}
        <div className="showcase-header">
          <div className="showcase-header-pill">
            <span className="pulse-dot" /> 100% PURE & ARTISANAL JARS
          </div>
          <h2 className="showcase-title">
            Our <span className="title-gradient">Signature Jars</span>
          </h2>
          <p className="showcase-subtitle">
            Explore PROTINUT peanut butters with product details, packaging facts, and serving ideas.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════
            PRODUCT 1: DARK CHOCOLATE CRUNCH
            Layout: Text / Information LEFT ➔ Product Photo RIGHT
            ══════════════════════════════════════════════════════════ */}
        {(() => {
          const prod = liveFeaturedProducts[0];
          const currentWeight = selectedWeights[prod.id] || prod.defaultWeight || prod.weightOptions?.[0]?.id || '550gm';
          const currentOption = prod.weightOptions?.find((option) => option.id === currentWeight) || prod.weightOptions?.[0];
          const currentPrice = currentOption?.price ?? (currentWeight === '1kg' ? prod.price1kg : prod.price550);
          const originalPrice = currentOption?.original ?? (currentWeight === '1kg' ? prod.originalPrice1kg : prod.originalPrice550);
          const discount = getDiscountPercent(originalPrice, currentPrice);
          const qty = quantities[prod.id] || 1;
          const isWishlisted = wishlistItems.some((w) => w.id === prod.id);
          const stockStatus = getProductStockStatus(prod);
          const canPurchase = isProductPurchasable(prod);

          return (
            <div className="showcase-card-row layout-text-left" key={prod.id}>
              
              {/* LEFT SIDE: PRODUCT INFORMATION */}
              <div className="showcase-info-pane">
                
                {/* Category & Rating Bar */}
                <div className="pane-header-tags">
                  <span className="pane-category-badge" style={{ color: prod.themeColor, borderColor: prod.themeColor }}>
                    {prod.category}
                  </span>
                  <span className="pane-highlight-tag" style={{ background: prod.themeBg, color: prod.themeColor }}>
                    {prod.badge}
                  </span>
                  {(Number(prod.rating) > 0 || Number(prod.reviewsCount) > 0) && (
                    <div className="pane-rating">
                      {Number(prod.rating) > 0 && (
                        <>
                          <span className="stars">★★★★★</span>
                          <span className="rating-score">{prod.rating}</span>
                        </>
                      )}
                      {Number(prod.reviewsCount) > 0 && <span className="reviews-count">({prod.reviewsCount} reviews)</span>}
                    </div>
                  )}
                </div>

                {/* Title & Tagline */}
                <h3 className="pane-product-title">
                  <Link to={`/product/${encodeURIComponent(prod.id)}`}>{prod.name}</Link>
                </h3>
                <p className="pane-product-tagline" style={{ color: prod.themeColor }}>
                  {prod.tagline}
                </p>
                <p className="pane-product-description">{prod.flavorNotes}</p>

                {/* Taste & Crunch Meter */}
                <div className="taste-meter-row">
                  {prod.tasteProfile.map((tp, idx) => (
                    <div className="taste-meter-chip" key={idx}>
                      <span className="taste-chip-lbl">{tp.label}</span>
                      <strong className="taste-chip-val" style={{ color: prod.themeColor }}>{tp.value}</strong>
                    </div>
                  ))}
                </div>

                {/* Nutrients Grid */}
                <div className="pane-nutrients-grid">
                  {prod.nutrients.map((n, idx) => (
                    <div className="nutrient-card" key={idx}>
                      <span className="nutrient-val" style={{ color: prod.themeColor }}>{n.value}</span>
                      <span className="nutrient-lbl">{n.label}</span>
                      <span className="nutrient-desc">{n.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Best Ways to Enjoy */}
                <div className="pairings-row">
                  <span className="pairings-label">Pairs Great With:</span>
                  <div className="pairings-list">
                    {prod.pairings.map((p, idx) => (
                      <span className="pairing-tag" key={idx}>
                        <i>{p.icon}</i> {p.text}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Feature Checkpoints */}
                <ul className="pane-features-list">
                  {prod.highlights.map((feat, idx) => (
                    <li key={idx}>
                      <span className="feat-check" style={{ color: prod.themeColor }}>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Size Selector & Pricing Box */}
                <div className="pane-purchase-box">
                  <div className="weight-and-price-row">
                    
                    <div className="weight-selector-group">
                      <span className="selector-label">Choose Jar Size:</span>
                      <div className="weight-pill-options">
                        {prod.weightOptions?.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={`weight-option-btn ${currentWeight === option.id ? 'active' : ''}`}
                            style={currentWeight === option.id ? { background: prod.themeColor, borderColor: prod.themeColor } : {}}
                            onClick={() => handleWeightChange(prod.id, option.id)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="price-display-group">
                      <div className="price-current-row">
                        <span className="currency-symbol">₹</span>
                        <span className="price-number">{currentPrice}</span>
                        {originalPrice > currentPrice && <span className="price-original">₹{originalPrice}</span>}
                      </div>
                      <span className="save-badge">{discount > 0 ? `SAVE ${discount}% OFF` : 'MRP'}</span>
                    </div>

                  </div>


                  <span className={`product-stock-status status-${getStockStatusClass(stockStatus)}`}>
                    {getStockStatusIcon(stockStatus)} {stockStatus}
                  </span>

                  {/* Quantity and Actions Bar */}
                  <div className="pane-action-bar">
                    <div className="qty-control">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQtyChange(prod.id, -1)}
                        disabled={qty <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-value">{qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQtyChange(prod.id, 1)}
                        disabled={qty >= 5}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="pane-btn-cart"
                      style={{ background: prod.themeColor }}
                      onClick={() => handleAddToCartClick(prod)}
                      disabled={!canPurchase}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      Add To Cart
                    </button>

                    <button
                      type="button"
                      className="pane-btn-buy-now"
                      onClick={() => handleBuyNowClick(prod)}
                      disabled={!canPurchase}
                    >
                      ⚡ Buy Now
                    </button>

                    <Link to={`/product/${encodeURIComponent(prod.id)}`} className="pane-btn-quickview">
                      Quick View
                    </Link>

                    <button
                      type="button"
                      className={`pane-btn-wishlist ${isWishlisted ? 'active' : ''}`}
                      onClick={() => {
                        if (onToggleWishlist) {
                          onToggleWishlist({
                            id: prod.id,
                            name: prod.name,
                            weight: currentWeight,
                            price: currentPrice,
                            image: prod.image,
                            tag: prod.badge
                          });
                        }
                      }}
                      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      aria-label="Wishlist toggle"
                    >
                      {isWishlisted ? '❤️' : '🤍'}
                    </button>
                  </div>

                </div>

              </div>

              {/* RIGHT SIDE: PRODUCT PHOTO (Clean, Large, Natural & Striking) */}
              <div className="showcase-photo-pane">
                <div
                  className="photo-stage-wrapper"
                  style={{
                    '--border-glow': prod.borderGlow,
                    '--theme-color': prod.themeColor
                  }}
                >
                  <div className="photo-ambient-light" />
                  
                  {/* Top Glass Badges */}
                  <div className="photo-badge-top-row">
                    <span className="photo-badge-seal">
                      <span className="seal-dot" /> {prod.sealText || '100% NATURAL'}
                    </span>
                    <span className="photo-badge-weight">
                      Net Qty: {currentOption?.label || currentWeight}
                    </span>
                  </div>

                  {/* Clean, Full-frame Hero Image */}
                  <div className="photo-image-frame">
                    <Link to={`/product/${encodeURIComponent(prod.id)}`} className="product-hero-link">
                      <img src={prod.image} alt={prod.name} className="product-hero-photo" loading="lazy" />
                    </Link>
                  </div>

                  {/* Bottom Feature Bar */}
                  <div className="photo-footer-pills">
                    {(prod.photoPills || ['🥜 100% Slow Roasted', '🚫 Zero Palm Oil', '⚡ 26g Protein']).map((pill) => (
                      <span className="photo-pill" key={pill}>{pill}</span>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════
            PRODUCT 2: CHOCO CRUNCH
            Layout: Product Photo LEFT ➔ Product Information RIGHT (Opposite!)
            ══════════════════════════════════════════════════════════ */}
        {(() => {
          const prod = liveFeaturedProducts[1];
          const currentWeight = selectedWeights[prod.id] || prod.defaultWeight || prod.weightOptions?.[0]?.id || '550gm';
          const currentOption = prod.weightOptions?.find((option) => option.id === currentWeight) || prod.weightOptions?.[0];
          const currentPrice = currentOption?.price ?? (currentWeight === '1kg' ? prod.price1kg : prod.price550);
          const originalPrice = currentOption?.original ?? (currentWeight === '1kg' ? prod.originalPrice1kg : prod.originalPrice550);
          const discount = getDiscountPercent(originalPrice, currentPrice);
          const qty = quantities[prod.id] || 1;
          const isWishlisted = wishlistItems.some((w) => w.id === prod.id);
          const stockStatus = getProductStockStatus(prod);
          const canPurchase = isProductPurchasable(prod);

          return (
            <div className="showcase-card-row layout-photo-left" key={prod.id}>
              
              {/* LEFT SIDE: PRODUCT PHOTO (Opposite!) */}
              <div className="showcase-photo-pane">
                <div
                  className="photo-stage-wrapper"
                  style={{
                    '--border-glow': prod.borderGlow,
                    '--theme-color': prod.themeColor
                  }}
                >
                  <div className="photo-ambient-light" />
                  
                  {/* Top Glass Badges */}
                  <div className="photo-badge-top-row">
                    <span className="photo-badge-seal">
                      <span className="seal-dot" /> 100% NATURAL
                    </span>
                    <span className="photo-badge-weight">
                      Net Qty: {currentWeight}
                    </span>
                  </div>

                  {/* Clean, Full-frame Hero Image */}
                  <div className="photo-image-frame">
                    <Link to={`/product/${encodeURIComponent(prod.id)}`} className="product-hero-link">
                      <img src={prod.image} alt={prod.name} className="product-hero-photo" loading="lazy" />
                    </Link>
                  </div>

                  {/* Bottom Feature Bar */}
                  <div className="photo-footer-pills">
                    <span className="photo-pill">🍫 Real Dark Cocoa</span>
                    <span className="photo-pill">⚡ 26g Protein</span>
                    <span className="photo-pill">🌿 No Trans Fat</span>
                  </div>

                </div>
              </div>

              {/* RIGHT SIDE: PRODUCT INFORMATION */}
              <div className="showcase-info-pane">
                
                {/* Category & Rating Bar */}
                <div className="pane-header-tags">
                  <span className="pane-category-badge" style={{ color: prod.themeColor, borderColor: prod.themeColor }}>
                    {prod.category}
                  </span>
                  <span className="pane-highlight-tag" style={{ background: prod.themeBg, color: prod.themeColor }}>
                    {prod.badge}
                  </span>
                  <div className="pane-rating">
                    <span className="stars">★★★★★</span>
                    <span className="rating-score">{prod.rating}</span>
                    <span className="reviews-count">({prod.reviewsCount} reviews)</span>
                  </div>
                </div>

                {/* Title & Tagline */}
                <h3 className="pane-product-title">
                  <Link to={`/product/${encodeURIComponent(prod.id)}`}>{prod.name}</Link>
                </h3>
                <p className="pane-product-tagline" style={{ color: prod.themeColor }}>
                  {prod.tagline}
                </p>
                <p className="pane-product-description">{prod.flavorNotes}</p>

                {/* Taste & Crunch Meter */}
                <div className="taste-meter-row">
                  {prod.tasteProfile.map((tp, idx) => (
                    <div className="taste-meter-chip" key={idx}>
                      <span className="taste-chip-lbl">{tp.label}</span>
                      <strong className="taste-chip-val" style={{ color: prod.themeColor }}>{tp.value}</strong>
                    </div>
                  ))}
                </div>

                {/* Nutrients Grid */}
                <div className="pane-nutrients-grid">
                  {prod.nutrients.map((n, idx) => (
                    <div className="nutrient-card" key={idx}>
                      <span className="nutrient-val" style={{ color: prod.themeColor }}>{n.value}</span>
                      <span className="nutrient-lbl">{n.label}</span>
                      <span className="nutrient-desc">{n.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Best Ways to Enjoy */}
                <div className="pairings-row">
                  <span className="pairings-label">Pairs Great With:</span>
                  <div className="pairings-list">
                    {prod.pairings.map((p, idx) => (
                      <span className="pairing-tag" key={idx}>
                        <i>{p.icon}</i> {p.text}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Feature Checkpoints */}
                <ul className="pane-features-list">
                  {prod.highlights.map((feat, idx) => (
                    <li key={idx}>
                      <span className="feat-check" style={{ color: prod.themeColor }}>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Size Selector & Pricing Box */}
                <div className="pane-purchase-box">
                  <div className="weight-and-price-row">
                    
                    <div className="weight-selector-group">
                      <span className="selector-label">Choose Jar Size:</span>
                      <div className="weight-pill-options">
                        {prod.weightOptions?.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={`weight-option-btn ${currentWeight === option.id ? 'active' : ''}`}
                            style={currentWeight === option.id ? { background: prod.themeColor, borderColor: prod.themeColor } : {}}
                            onClick={() => handleWeightChange(prod.id, option.id)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="price-display-group">
                      <div className="price-current-row">
                        <span className="currency-symbol">₹</span>
                        <span className="price-number">{currentPrice}</span>
                        {originalPrice > currentPrice && <span className="price-original">₹{originalPrice}</span>}
                      </div>
                      <span className="save-badge">{discount > 0 ? `SAVE ${discount}% OFF` : 'MRP'}</span>
                    </div>

                  </div>


                  <span className={`product-stock-status status-${getStockStatusClass(stockStatus)}`}>
                    {getStockStatusIcon(stockStatus)} {stockStatus}
                  </span>

                  {/* Quantity and Actions Bar */}
                  <div className="pane-action-bar">
                    <div className="qty-control">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQtyChange(prod.id, -1)}
                        disabled={qty <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-value">{qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQtyChange(prod.id, 1)}
                        disabled={qty >= 5}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="pane-btn-cart"
                      style={{ background: prod.themeColor }}
                      onClick={() => handleAddToCartClick(prod)}
                      disabled={!canPurchase}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      Add To Cart
                    </button>

                    <button
                      type="button"
                      className="pane-btn-buy-now"
                      onClick={() => handleBuyNowClick(prod)}
                      disabled={!canPurchase}
                    >
                      ⚡ Buy Now
                    </button>

                    <Link to={`/product/${encodeURIComponent(prod.id)}`} className="pane-btn-quickview">
                      Quick View
                    </Link>

                    <button
                      type="button"
                      className={`pane-btn-wishlist ${isWishlisted ? 'active' : ''}`}
                      onClick={() => {
                        if (onToggleWishlist) {
                          onToggleWishlist({
                            id: prod.id,
                            name: prod.name,
                            weight: currentWeight,
                            price: currentPrice,
                            image: prod.image,
                            tag: prod.badge
                          });
                        }
                      }}
                      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      aria-label="Wishlist toggle"
                    >
                      {isWishlisted ? '❤️' : '🤍'}
                    </button>
                  </div>

                </div>

              </div>

            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════
            TRUST & PROMISE STRIP
            ══════════════════════════════════════════════════════════ */}
        <div className="showcase-trust-strip">
          <div className="trust-strip-item">
            <span className="trust-icon">🛡️</span>
            <div>
              <strong>100% Purity Guarantee</strong>
              <p>Pure slow-roasted peanuts, no cheap palm oil or trans fat</p>
            </div>
          </div>
          <div className="trust-strip-item">
            <span className="trust-icon">🚚</span>
            <div>
              <strong>Fast & Safe Express Delivery</strong>
              <p>Shipped directly from our fresh churn facility in tamper-proof jars</p>
            </div>
          </div>
          <div className="trust-strip-item">
            <span className="trust-icon">⭐</span>
            <div>
              <strong>50,000+ Happy Customers</strong>
              <p>India’s most loved crunchy and chocolate peanut butters</p>
            </div>
          </div>
        </div>

        {/* Bottom Banner to Explore All Catalogue */}
        <div className="showcase-bottom-cta">
          <div className="bottom-cta-card">
            <div className="bottom-cta-text">
              <h4>Want to explore our complete catalogue?</h4>
              <p>Discover 1kg jumbo tubs, organic natural spreads, and high-protein varieties in our full shop.</p>
            </div>
            <Link to="/products" className="bottom-cta-link-btn">
              Explore All Products →
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FeaturedShowcase;
