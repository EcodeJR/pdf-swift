import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AdBanner = ({ slot, format = 'auto', style = {} }) => {
  const { user } = useAuth();
  const adRef = React.useRef(null);
  const initialized = React.useRef(false);

  useEffect(() => {
    // Only show ads for non-premium users
    if ((!user || !user.isPremium) && adRef.current && !initialized.current) {
      try {
        // Check if the ad is already loaded or being loaded
        const isLoaded = adRef.current.getAttribute('data-adsbygoogle-status');
        if (isLoaded) {
          console.log('AdSense: Ad already initialized for this element');
          initialized.current = true;
          return;
        }

        // Add a small delay for DOM stability in React
        const timer = setTimeout(() => {
          if (window.adsbygoogle && adRef.current) {
            try {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
              initialized.current = true;
            } catch (e) {
              console.error('AdSense push error:', e);
            }
          }
        }, 100);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, [user]);

  // Reset initialization flag when slot changes
  useEffect(() => {
    initialized.current = false;
  }, [slot]);

  // Don't show ads for premium users
  if (user && user.isPremium) {
    return null;
  }

  // If AdSense is not configured, show placeholder
  if (!process.env.REACT_APP_ADSENSE_PUBLISHER_ID) {
    return (
      <div
        className="bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm"
        style={{ minHeight: '90px', ...style }}
      >
        Ad Space - Configure AdSense in .env
      </div>
    );
  }

  return (
    <div className="ad-container" style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.REACT_APP_ADSENSE_PUBLISHER_ID}
        data-ad-slot={slot || process.env.REACT_APP_ADSENSE_HEADER_SLOT}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;
