import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AdBanner = ({ slot, format = 'auto', style = {} }) => {
  const { user } = useAuth();

  useEffect(() => {
    // Only show ads for non-premium users
    if (!user || !user.isPremium) {
      try {
        // Load ad
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, [user]);

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
