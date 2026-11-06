import React, { useEffect } from 'react';
import AboutUs from '../AboutUs';
import WhyProtinut from '../WhyProtinut';
import Testimonials from '../Testimonials';
import { useGlobalSettings } from '../GlobalSettingsContext';

const AboutPage = () => {
  const { settings } = useGlobalSettings();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="about-page">
      <AboutUs settings={settings} />
      <WhyProtinut />
      <Testimonials />
    </div>
  );
};

export default AboutPage;
