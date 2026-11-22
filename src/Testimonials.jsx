import React from 'react';
import './Testimonials.css';

const reviews = [
  {
    name: 'Ananya Deshmukh',
    role: 'Sports Nutritionist',
    city: 'Pune',
    rating: 5,
    title: 'Guilt-free dessert craving solved!',
    review: 'Choco Crunch is absolute magic. To get real cocoa and roasted peanuts with 26g of natural plant protein without artificial chemicals is unbelievable. All my clients love it.',
    product: 'Choco Crunch 550g',
    verified: true
  }
];

const Testimonials = () => {
  return (
    <section className="testimonials-section" id="testimonials" aria-label="Customer Reviews">
      <div className="testimonials-container">
        
        {/* Header */}
        <div className="testimonials-header">
          <span className="testimonials-badge">COMMUNITY LOVE</span>
          <h2 className="testimonials-title">
            Loved by 15,000+ Fitness Enthusiasts
          </h2>
          <div className="overall-rating-pill">
            <div className="stars-cluster">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="star">★</span>
              ))}
            </div>
            <strong>4.9 / 5 Rating</strong>
            <span>• Based on 1,420+ Verified Reviews</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="reviews-grid">
          {reviews.map((rev, idx) => (
            <div key={idx} className="review-card">
              
              <div className="review-card-top">
                <div className="review-stars">
                  {[...Array(rev.rating)].map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                </div>
                {rev.verified && (
                  <span className="verified-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Verified Buyer
                  </span>
                )}
              </div>

              <h4 className="review-quote-title">"{rev.title}"</h4>
              <p className="review-quote-body">{rev.review}</p>

              <div className="reviewer-footer">
                <div className="reviewer-avatar">
                  {rev.name.charAt(0)}
                </div>
                <div className="reviewer-meta">
                  <strong className="reviewer-name">{rev.name}</strong>
                  <span className="reviewer-role">{rev.role} • {rev.city}</span>
                </div>
                <span className="reviewed-product-tag">{rev.product}</span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
