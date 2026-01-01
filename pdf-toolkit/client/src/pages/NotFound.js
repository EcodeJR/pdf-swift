import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft, FiFileText } from 'react-icons/fi';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                {/* 404 Illustration */}
                <div className="relative mb-8">
                    <h1 className="text-[150px] sm:text-[200px] font-bold text-gray-100 select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-primary-100 rounded-full p-6">
                            <FiFileText className="w-16 h-16 text-primary-600" />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    Page Not Found
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Oops! The page you're looking for doesn't exist or has been moved.
                    Don't worry, let's get you back on track.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="btn-secondary px-6 py-3 flex items-center justify-center gap-2"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                    <Link
                        to="/"
                        className="btn-primary px-6 py-3 flex items-center justify-center gap-2"
                    >
                        <FiHome className="w-5 h-5" />
                        Back to Home
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-4">Popular tools you might be looking for:</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to="/pdf-to-word" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            PDF to Word
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/compress-pdf" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            Compress PDF
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/merge-pdf" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            Merge PDF
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/edit-pdf" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            Edit PDF
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
