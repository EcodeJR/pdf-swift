import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';

const VideoAdModal = ({ isOpen, onClose, onAdComplete, downloadUrl, fileName, adDuration = 15 }) => {
  const [adCompleted, setAdCompleted] = useState(false);
  const [countdown, setCountdown] = useState(adDuration); // Use custom duration
  const [adError, setAdError] = useState(false);
  const adCompleteCalled = React.useRef(false);
  const downloadStarted = React.useRef(false);

  // Reset refs when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      adCompleteCalled.current = false;
      downloadStarted.current = false;
      setAdCompleted(false);
      setCountdown(adDuration); // Reset to custom duration
    }
  }, [isOpen, adDuration]);

  useEffect(() => {
    if (isOpen && !adCompleted) {
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Complete the ad when countdown finishes
            if (!adCompleteCalled.current) {
              adCompleteCalled.current = true;
              // Use setTimeout to ensure state updates happen after this render cycle
              setTimeout(() => {
                setAdCompleted(true);
                onAdComplete();
                // Auto-download after ad completes (only if not already started)
                setTimeout(() => {
                  if (!downloadStarted.current) {
                    handleDownload();
                  }
                }, 500);
              }, 0);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // For production, initialize Google IMA SDK here
      // This is a simplified version for development

      return () => clearInterval(timer);
    }
  }, [isOpen, adCompleted, onAdComplete]);

  const handleDownload = async () => {
    // Prevent multiple simultaneous downloads
    if (downloadStarted.current) {
      console.log('Download already in progress, skipping...');
      return;
    }

    if (downloadUrl) {
      downloadStarted.current = true;
      try {
        // The downloadUrl from conversionAPI.downloadFile is already a complete URL
        // e.g., "http://localhost:5000/api/convert/download/file.pdf"
        // So we should use it directly
        console.log('Downloading from:', downloadUrl);

        // Fetch as blob to bypass router completely
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

        // Close modal after download starts
        setTimeout(() => onClose(), 1000);
      } catch (error) {
        console.error('Download error:', error);
        downloadStarted.current = false; // Reset on error so user can retry
        // Fallback to direct window open if fetch fails
        window.open(downloadUrl, '_blank');
        setTimeout(() => onClose(), 1000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Your file is ready!
        </h2>

        {!adCompleted ? (
          <>
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4">
              {/* Video ad container */}
              <div className="text-white text-center">
                <div className="animate-pulse mb-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto"></div>
                </div>
                <p className="text-lg font-medium">Loading advertisement...</p>
                <p className="text-sm text-gray-300 mt-2">
                  Your download will be ready in {countdown} seconds
                </p>
              </div>
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
              <p className="text-gray-600">{fileName}</p>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center space-x-2"
            >
              <FiDownload className="w-5 h-5" />
              <span>Download Now</span>
            </button>
          </>
        )}

        {adError && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Ad failed to load. You can download your file now.
            </p>
            <button
              onClick={handleDownload}
              className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoAdModal;
