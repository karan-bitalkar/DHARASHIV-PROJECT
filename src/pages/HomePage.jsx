import React from 'react';
import HeroCarousel from '../HeroCarousel';
import NutritionStrip from '../NutritionStrip';
import FeaturedShowcase from '../FeaturedShowcase';
import OurRange from '../OurRange';
import WhyProtinut from '../WhyProtinut';
import RecipeHighlights from '../RecipeHighlights';
import Testimonials from '../Testimonials';
import { useGlobalSettings } from '../GlobalSettingsContext';
import './HomePage.css';

const HomePage = ({
  onAddToCart,
  onBuyNow,
  onQuickView,
  wishlistItems = [],
  onToggleWishlist
}) => {
  const { settings } = useGlobalSettings();

  return (
    <div className="home-page">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Nutrition Highlights Strip */}
      <NutritionStrip />

      {/* Featured Products Showcase (Deep dive into the 2 signature jars) */}
      <FeaturedShowcase
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
        onQuickView={onQuickView}
        wishlistItems={wishlistItems}
        onToggleWishlist={onToggleWishlist}
      />

      {/* Complete Product Catalog Grid with Filters & Dual Sizes */}
      <OurRange
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
        onQuickView={onQuickView}
        wishlistItems={wishlistItems}
        onToggleWishlist={onToggleWishlist}
      />

      {/* Why Choose Protinut */}
      <WhyProtinut />

      <section className="home-storage-instructions" aria-labelledby="home-storage-heading">
        <div className="home-storage-container">
          <span className="home-storage-eyebrow">KEEP IT FRESH</span>
          <h2 id="home-storage-heading">Storage Instructions</h2>
          <div className="home-storage-grid">
            <article className="home-storage-card">
              <h3>PROTINUT Peanut Butter</h3>
              <p>{settings.storageInstructions}</p>
            </article>
            <article className="home-storage-card">
              <h3>Dark Chocolate Crunch</h3>
              <p>Store the jar upside down to avoid oil separation.</p>
              <p>Oil separation is a natural process. Just stir it well before use.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Healthy Recipes */}
      <RecipeHighlights />

      {/* Community Testimonials */}
      <Testimonials />
    </div>
  );
};

export default HomePage;
