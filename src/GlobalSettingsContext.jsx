import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'protinut_global_settings';
const RETIRED_PRODUCT_BANNER_SOURCES = new Set([
  '/hero-slides/slide-28.png',
  '/hero-slides/slide-30.png',
  '/hero-slides-mobile/slide-28.png',
  '/hero-slides-mobile/slide-30.png'
]);

const removeRetiredProductBanners = (banners) => (
  Array.isArray(banners)
    ? banners.filter((banner) => !RETIRED_PRODUCT_BANNER_SOURCES.has(banner?.src))
    : []
);

export const defaultGlobalSettings = {
  companyName: 'PROTINUT FOODS',
  companyAddress: 'Laxmi Niwas, Vidya Nagar, Dharashiv (Gramin), Dharashiv Taluka, Dharashiv, Maharashtra - 413501',
  gstin: '27PRRPS9570L1Z6',
  fssai: '21526050000128',
  supportEmail: 'protinut.in@gmail.com',
  supportPhone: '+91 830 830 2301',
  websiteUrl: 'www.protinut.in',
  homeHeroHeading: 'Pure Peanut Butter. Real Plant Protein.',
  homeHeroSubtitle: 'Small-batch roasted in Dharashiv, Maharashtra. Made with real peanuts and nothing unnecessary.',
  showHeroBanner: true,
  heroBanners: [
    { id: 'hero-slide-16', src: '/hero-slides/slide-16.png', alt: 'Make Your Breakfast Healthy & Tasty - Fresh Bowl', active: true }
  ],
  // offerBannerText: 'Free pan-India delivery on every order',
  showOfferBanner: true,
  aboutHeroHeading: 'Born from a real need. Built for real people.',
  aboutHeroSubtitle: 'In 2021, frustrated by chemical-laden, palm-oil-packed peanut butters flooding store shelves, we set out with a simple mission in Dharashiv, Maharashtra: deliver India’s purest, high-protein peanut butter, untouched by junk.',
  aboutFounderHeading: 'Meet The Founder',
  aboutFounderSubtitle: 'The personal journey that transformed a home kitchen in Dharashiv into India’s most honest peanut butter brand.',
  founderStory: 'Meet the man behind the jars. Frustrated by chemical-laden peanut butters, our founder started grinding hand-picked peanuts in his own kitchen in Dharashiv, Maharashtra. Today, that same small-batch promise powers every jar of PROTINUT.\n\nAs someone who worked out daily, I was appalled to discover that even the so-called “healthy” brands were mixing hydrogenated palm oil, emulsifiers, and cheap corn sugars into their peanut butter just to extend shelf life. I refused to put that into my body, and I refused to let Indian families eat it either.\n\nWe set up our own stone grinding unit right here in Maharashtra. No shortcuts, no chemical stabilizers, no corporate compromises. If it’s not good enough for my family, it never leaves our doors.',
  contactHeading: 'We’d Love To Hear From You',
  contactSubtitle: 'Have questions about our ingredients, wholesale distribution, bulk gym orders, or delivery status? Reach out to our team in Maharashtra!',
  shippingPolicy: 'Orders are carefully packed and dispatched across India. Delivery timelines may vary by location. Contact our support team with your order number for an update.',
  returnPolicy: 'Goods once delivered cannot be returned except in case of a damaged or wrong product. Contact support within 7 days of delivery for return or refund assistance.',
  storageInstructions: 'Store in a cool, dry, and dark place away from direct sunlight. Do not refrigerate if you prefer it spreadable, or refrigerate after opening to preserve freshness. Natural oil separation may occur; stir well before use.'
};

const GlobalSettingsContext = createContext(null);

const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultGlobalSettings;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Stored global settings must be an object');
    }
    const settings = { ...defaultGlobalSettings, ...parsed };
    settings.heroBanners = removeRetiredProductBanners(settings.heroBanners);
    if (JSON.stringify(settings.heroBanners) !== JSON.stringify(parsed.heroBanners)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Unable to remove retired product banners from saved settings', error);
      }
    }
    return settings;
  } catch (error) {
    console.error('Unable to load website settings', error);
    return defaultGlobalSettings;
  }
};

export const GlobalSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      setSettings(loadSettings());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateSettings = useCallback((updates) => {
    const nextSettings = { ...settings, ...updates };
    if (Array.isArray(nextSettings.heroBanners)) {
      nextSettings.heroBanners = removeRetiredProductBanners(nextSettings.heroBanners);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
      setSettings(nextSettings);
      return nextSettings;
    } catch (error) {
      console.error('Unable to save website settings', error);
      throw error;
    }
  }, [settings]);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);
  return <GlobalSettingsContext.Provider value={value}>{children}</GlobalSettingsContext.Provider>;
};

export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (!context) throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  return context;
};
