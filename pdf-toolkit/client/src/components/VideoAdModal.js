import React, { useState, useEffect, useRef } from 'react';
import { FiDownload } from 'react-icons/fi';

const IMA_TEST_AD_TAG_URL =
  'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&correlator=';

const getAdTagUrl = () => {
  const customTagUrl = process.env.REACT_APP_IMA_AD_TAG_URL;
  if (customTagUrl) {
    return customTagUrl;
  }

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  // Localhost is commonly not eligible for production AdSense video responses.
  // Use Google's official IMA test tag unless an explicit ad tag override is configured.
  if (isLocalhost) {
    return `${IMA_TEST_AD_TAG_URL}${Date.now()}`;
  }

  const publisherId = process.env.REACT_APP_ADSENSE_PUBLISHER_ID || 'ca-pub-5120020675639002';
  const adSlot = process.env.REACT_APP_ADSENSE_VIDEO_SLOT || '7793351143';
  const descriptionUrl = process.env.REACT_APP_ADS_DESCRIPTION_URL || window.location.href;

  return `https://googleads.g.doubleclick.net/pagead/ads?client=${publisherId}&slotname=${adSlot}&ad_type=video&description_url=${encodeURIComponent(descriptionUrl)}&videoad_start_delay=0&env=vp&output=vast&correlator=${Date.now()}`;
};

const VideoAdModal = ({ isOpen, onClose, onAdComplete, downloadUrl, fileName, adDuration = 15 }) => {
  const [adCompleted, setAdCompleted] = useState(false);
  const [countdown, setCountdown] = useState(adDuration);
  const [adError, setAdError] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adSessionStarted, setAdSessionStarted] = useState(false);

  const adCompleteCalled = useRef(false);
  const downloadStarted = useRef(false);
  const adContainerRef = useRef(null);
  const videoElementRef = useRef(null);
  const adsManagerRef = useRef(null);
  const adsLoaderRef = useRef(null);
  const adDisplayContainerRef = useRef(null);
  const imaInitialized = useRef(false);
  const timerRef = useRef(null);

  // Reset state and refs when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      if (adsManagerRef.current) {
        adsManagerRef.current.destroy();
        adsManagerRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      adCompleteCalled.current = false;
      downloadStarted.current = false;
      imaInitialized.current = false;
      setAdCompleted(false);
      setAdPlaying(false);
      setAdError(false);
      setAdSessionStarted(false);
      setCountdown(adDuration);
    }
  }, [isOpen, adDuration]);

  const handleDownload = React.useCallback(async () => {
    if (downloadStarted.current) return;

    if (downloadUrl) {
      downloadStarted.current = true;
      try {
        console.log('Downloading from:', downloadUrl);
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'downloaded-file.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setTimeout(() => onClose(), 1000);
      } catch (error) {
        console.error('Download error:', error);
        setAdError(true);
        downloadStarted.current = false;
        window.open(downloadUrl, '_blank');
        setTimeout(() => onClose(), 1000);
      }
    }
  }, [downloadUrl, fileName, onClose]);

  const completeAd = React.useCallback(() => {
    if (!adCompleteCalled.current) {
      adCompleteCalled.current = true;
      setAdCompleted(true);
      setAdPlaying(false);
      onAdComplete();

      // Auto-download after a short delay
      setTimeout(() => {
        if (!downloadStarted.current) {
          handleDownload();
        }
      }, 500);
    }
  }, [onAdComplete, handleDownload]);

  const handleImaAdError = React.useCallback((adErrorEvent) => {
    const error = adErrorEvent?.getError ? adErrorEvent.getError() : adErrorEvent;
    const errorData = error?.data || {};
    console.warn('Ad error:', {
      code: errorData.errorCode,
      message: errorData.errorMessage || error?.message,
      innerError: errorData.innerError,
    });
    if (adsManagerRef.current) {
      adsManagerRef.current.destroy();
      adsManagerRef.current = null;
    }
    setAdError(true);
    setAdPlaying(false);
  }, []);

  const handleAdsManagerLoaded = React.useCallback((adsManagerLoadedEvent) => {
    const adsRenderingSettings = new window.google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

    adsManagerRef.current = adsManagerLoadedEvent.getAdsManager(
      videoElementRef.current,
      adsRenderingSettings
    );

    adsManagerRef.current.addEventListener(
      window.google.ima.AdErrorEvent.Type.AD_ERROR,
      handleImaAdError
    );
    adsManagerRef.current.addEventListener(
      window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
      () => setAdPlaying(true)
    );
    adsManagerRef.current.addEventListener(
      window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      completeAd
    );
    adsManagerRef.current.addEventListener(
      window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
      completeAd
    );
    adsManagerRef.current.addEventListener(
      window.google.ima.AdEvent.Type.SKIPPED,
      completeAd
    );
    adsManagerRef.current.addEventListener(
      window.google.ima.AdEvent.Type.STARTED,
      () => setAdPlaying(true)
    );

    try {
      adsManagerRef.current.init(
        adContainerRef.current.offsetWidth,
        adContainerRef.current.offsetHeight,
        window.google.ima.ViewMode.NORMAL
      );
      adsManagerRef.current.start();
    } catch (error) {
      console.error('AdsManager start failed:', error);
      setAdError(true);
      setAdPlaying(false);
    }
  }, [completeAd, handleImaAdError]);

  const startAdPlayback = React.useCallback(() => {
    if (imaInitialized.current || adCompleted) {
      return;
    }

    setAdSessionStarted(true);

    if (!window.google || !window.google.ima || !adContainerRef.current || !videoElementRef.current) {
      console.warn('IMA SDK not loaded or ad container not ready, using fallback timer');
      setAdError(true);
      return;
    }

    try {
      imaInitialized.current = true;

      // AdDisplayContainer.initialize should be called from user interaction.
      adDisplayContainerRef.current = new window.google.ima.AdDisplayContainer(
        adContainerRef.current,
        videoElementRef.current
      );
      adDisplayContainerRef.current.initialize();

      adsLoaderRef.current = new window.google.ima.AdsLoader(adDisplayContainerRef.current);
      adsLoaderRef.current.addEventListener(
        window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        handleAdsManagerLoaded,
        false
      );
      adsLoaderRef.current.addEventListener(
        window.google.ima.AdErrorEvent.Type.AD_ERROR,
        handleImaAdError,
        false
      );

      const adsRequest = new window.google.ima.AdsRequest();
      adsRequest.adTagUrl = getAdTagUrl();
      adsRequest.linearAdSlotWidth = adContainerRef.current.offsetWidth;
      adsRequest.linearAdSlotHeight = adContainerRef.current.offsetHeight;
      adsRequest.nonLinearAdSlotWidth = adContainerRef.current.offsetWidth;
      adsRequest.nonLinearAdSlotHeight = adContainerRef.current.offsetHeight;

      adsLoaderRef.current.requestAds(adsRequest);
    } catch (error) {
      console.error('IMA initialization failed:', error);
      setAdError(true);
      setAdPlaying(false);
    }
  }, [adCompleted, handleAdsManagerLoaded, handleImaAdError]);

  // Fallback Countdown Timer (Runs if ad is not playing or IMA fails)
  useEffect(() => {
    if (isOpen && !adCompleted && !adPlaying && (adSessionStarted || adError)) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            completeAd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isOpen, adCompleted, adPlaying, adSessionStarted, adError, completeAd]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Your file is ready!
        </h2>

        {!adCompleted ? (
          <>
            <div
              className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4 relative overflow-hidden"
              style={{ minHeight: '300px' }}
            >
              {/* Video Element for IMA */}
              <video
                ref={videoElementRef}
                className="hidden" // Hidden because IMA UI/ADS will be in adContainer
                playsInline
                muted
              />

              {/* IMA Ad Container */}
              <div
                ref={adContainerRef}
                className={`absolute inset-0 z-10 ${adSessionStarted ? 'pointer-events-auto' : 'pointer-events-none'}`}
              />

              {/* Fallback & Loading UI (shown if ad hasn't started yet) */}
              {!adPlaying && (
                <div className="relative z-20 text-white text-center pointer-events-auto">
                  {!adSessionStarted ? (
                    <>
                      <p className="text-lg font-medium mb-4">Start ad to unlock your download</p>
                      <button
                        type="button"
                        onClick={startAdPlayback}
                        className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                      >
                        Play Ad
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="animate-pulse mb-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto"></div>
                      </div>
                      <p className="text-lg font-medium">
                        {adError ? 'Preparing your download...' : 'Loading advertisement...'}
                      </p>
                      <p className="text-sm text-gray-300 mt-2">
                        Your download will be ready in {countdown} seconds
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800">
                <strong>Free users:</strong> Please watch this short ad to support our free service.
                <br />
                <span className="text-xs">Upgrade to Premium to remove all ads!</span>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Download!</h3>
              <p className="text-gray-600 truncate px-4">{fileName}</p>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <FiDownload className="w-5 h-5" />
              <span>Download Now</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoAdModal;

