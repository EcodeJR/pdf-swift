import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiCheck } from 'react-icons/fi';

const CookieConsent = () => {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check if user has already responded to cookie consent
        const cookieConsent = localStorage.getItem('cookieConsent');
        if (!cookieConsent) {
            // Show banner after a brief delay for better UX
            setTimeout(() => setShowBanner(true), 1000);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        localStorage.setItem('cookieConsentDate', new Date().toISOString());
        setShowBanner(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookieConsent', 'declined');
        localStorage.setItem('cookieConsentDate', new Date().toISOString());
        setShowBanner(false);
        // Optionally clear any non-essential cookies here
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]" />

            {/* Cookie Consent Banner */}
            <div className="fixed bottom-0 left-0 right-0 z-[101] p-4 sm:p-6 cookie-slide-up">
                <div className="max-w-5xl mx-auto">
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                        {/* Grid Pattern Background */}
                        <div className="absolute inset-0 opacity-5">
                            <svg width="100%" height="100%">
                                <defs>
                                    <pattern id="cookie-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path
                                            d="M 40 0 L 0 0 0 40"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                            className="text-primary"
                                        />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#cookie-grid)" />
                            </svg>
                        </div>

                        <div className="relative p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                {/* Cookie Icon */}
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-8 h-8 text-primary"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        🍪 We Value Your Privacy
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                        We use cookies to enhance your experience, keep you logged in, and analyze site performance.
                                        Your uploaded files are <strong>automatically deleted after 1 hour</strong> and we never access or share them.
                                    </p>
                                    <Link
                                        to="/cookie-policy"
                                        className="text-primary hover:underline text-sm font-semibold inline-flex items-center gap-1"
                                    >
                                        Learn more about our cookies
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={handleDecline}
                                        className="btn-secondary px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <FiX className="w-4 h-4" />
                                        Decline
                                    </button>
                                    <button
                                        onClick={handleAccept}
                                        className="btn-primary px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap shadow-lg"
                                    >
                                        <FiCheck className="w-4 h-4" />
                                        Accept All Cookies
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Border */}
                        <div className="h-1 bg-gradient-to-r from-primary-400 via-primary to-primary-600" />
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideUpCookie {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .cookie-slide-up {
                    animation: slideUpCookie 0.4s ease-out;
                }
            `}</style>
        </>
    );
};

export default CookieConsent;
