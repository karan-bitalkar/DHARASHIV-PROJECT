import { useEffect, useState } from 'react';
import './MobileSplash.css';

const MOBILE_QUERY = '(max-width: 767px)';

function MobileSplash() {
  const [isVisible, setIsVisible] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    if (!window.matchMedia(MOBILE_QUERY).matches) {
      setIsVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setIsVisible(false), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="mobile-splash" role="status" aria-label="Loading PROTINUT">
      <div className="mobile-splash__glow mobile-splash__glow--top" aria-hidden="true" />
      <div className="mobile-splash__glow mobile-splash__glow--bottom" aria-hidden="true" />

      <svg className="mobile-splash__swirl" viewBox="0 0 240 240" aria-hidden="true">
        <defs>
          <radialGradient id="splash-butter" cx="38%" cy="35%" r="70%">
            <stop offset="0" stopColor="#FFD98B" />
            <stop offset=".45" stopColor="#F9A83F" />
            <stop offset="1" stopColor="#B84B0B" />
          </radialGradient>
          <linearGradient id="splash-butter-ribbon" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#FFE1A0" stopOpacity=".9" />
            <stop offset="1" stopColor="#D76B13" stopOpacity=".2" />
          </linearGradient>
        </defs>
        <path
          className="mobile-splash__swirl-shadow"
          d="M245 5C178-9 111 19 108 70c-2 34 42 46 64 25 13-13 9-33-6-38-13-5-26 5-24 17 2 9 12 12 18 7-5 24-43 26-51 3-10-28 29-51 64-48 24 2 44 14 72 9V5Z"
        />
        <path
          d="M245 1C178-10 118 18 114 63c-3 31 35 44 57 25 14-13 10-32-5-37-12-4-24 4-23 15 1 7 9 10 15 7-5 18-34 20-42 2-10-24 24-44 56-42 27 2 46 13 73 9V1Z"
          fill="url(#splash-butter)"
        />
        <path
          d="M231 14c-41-5-80 8-94 30-10 16 1 29 15 24 10-4 12-15 4-19-7-3-13 2-11 8-12-2-12-15-2-24 19-17 53-19 88-13"
          fill="none"
          stroke="url(#splash-butter-ribbon)"
          strokeLinecap="round"
          strokeWidth="5"
        />
      </svg>

      <div className="mobile-splash__floating-peanut mobile-splash__floating-peanut--one" aria-hidden="true">
        <svg viewBox="0 0 56 36">
          <path d="M7 18C2 14 5 6 13 5c7-1 10 5 15 10 5-5 9-10 16-8 9 2 10 11 4 17-6 7-15 7-22 0-7 7-14 3-19-1Z" />
          <path className="mobile-splash__peanut-seam" d="M28 15c-4 4-5 9-2 12m-5-15c-3 3-3 8-1 10m12-8c4 3 5 7 3 10" />
        </svg>
      </div>
      <div className="mobile-splash__floating-peanut mobile-splash__floating-peanut--two" aria-hidden="true">
        <svg viewBox="0 0 56 36">
          <path d="M7 18C2 14 5 6 13 5c7-1 10 5 15 10 5-5 9-10 16-8 9 2 10 11 4 17-6 7-15 7-22 0-7 7-14 3-19-1Z" />
          <path className="mobile-splash__peanut-seam" d="M28 15c-4 4-5 9-2 12m-5-15c-3 3-3 8-1 10m12-8c4 3 5 7 3 10" />
        </svg>
      </div>

      <div className="mobile-splash__content">
        <img className="mobile-splash__logo" src="/protinut-logo.png" alt="PROTINUT" />
        <span className="mobile-splash__foods">FOODS</span>
        <p className="mobile-splash__tagline">Natural <span>•</span> Nutritious <span>•</span> Protein Rich</p>
        <div className="mobile-splash__loader" aria-hidden="true">
          <div className="mobile-splash__loader-ring">
            <svg viewBox="0 0 48 56">
              <path className="mobile-splash__jar-lid" d="M11 5h26v8H11z" />
              <path className="mobile-splash__jar-body" d="M13 14h22l3 5v27c0 3-2 5-5 5H15c-3 0-5-2-5-5V19l3-5Z" />
              <path className="mobile-splash__jar-label" d="M11 27h26v13H11z" />
              <path className="mobile-splash__jar-wordmark" d="M15 31h18m-15 4h12" />
              <path className="mobile-splash__jar-base" d="M14 46h20" />
            </svg>
          </div>
          <div className="mobile-splash__dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <svg className="mobile-splash__bottom-waves" viewBox="0 0 390 260" preserveAspectRatio="none" aria-hidden="true">
        <path className="mobile-splash__wave mobile-splash__wave--back" d="M0 115C72 73 120 129 184 112c73-20 101-83 206-42v190H0Z" />
        <path className="mobile-splash__wave mobile-splash__wave--middle" d="M0 168c76-46 127-50 201-20 74 31 116-25 189-46v158H0Z" />
        <path className="mobile-splash__wave mobile-splash__wave--front" d="M0 202c83-25 119-44 201-15 76 27 117 2 189-18v91H0Z" />
      </svg>

      <svg className="mobile-splash__shell" viewBox="0 0 210 160" aria-hidden="true">
        <defs>
          <linearGradient id="splash-shell" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#FFE0A0" />
            <stop offset=".55" stopColor="#D99543" />
            <stop offset="1" stopColor="#9F521D" />
          </linearGradient>
          <linearGradient id="splash-kernel" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#FFD78B" />
            <stop offset="1" stopColor="#C77A2D" />
          </linearGradient>
        </defs>
        <g className="mobile-splash__shell-art">
          <path d="M14 106C8 77 19 49 43 43c22-5 34 11 47 29 13-18 25-35 47-31 25 5 34 34 25 61-9 27-35 40-68 20-32 19-70 13-80-16Z" fill="url(#splash-shell)" />
          <path d="M21 100c8-20 14-29 25-34m-18 45c10-20 18-28 29-34m43-5c-10 16-10 29-2 43m14-43c-8 17-7 31 2 46m10-43c-7 16-4 29 6 41m22-51c8 19 8 34 1 49" fill="none" stroke="#FFF0C9" strokeOpacity=".52" strokeWidth="3" strokeLinecap="round" />
          <path d="M102 95c12-25 29-40 46-37 18 3 24 22 13 39-12 18-35 24-59-2Z" fill="url(#splash-kernel)" />
          <path d="M111 93c13-17 25-26 39-27m-30 37c12-12 21-18 33-20" fill="none" stroke="#FFE6B2" strokeOpacity=".62" strokeWidth="2" strokeLinecap="round" />
          <path d="M46 129c6-11 15-17 24-15 10 2 12 12 5 20-8 9-20 10-29-5Z" fill="url(#splash-kernel)" />
          <path d="M49 130c7-7 14-11 21-11" fill="none" stroke="#FFE6B2" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

export default MobileSplash;
