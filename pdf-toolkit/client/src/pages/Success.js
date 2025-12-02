import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCheck } from 'react-icons/fi';
import { GridPattern } from '../components/GridPattern';

const Success = () => {
  const { refreshUser } = useAuth();

  useEffect(() => {
    // Refresh user data to get updated premium status
    setTimeout(() => {
      refreshUser();
    }, 2000);
  }, [refreshUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <GridPattern
        className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)]"
        width={60}
        height={60}
      />
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="w-12 h-12 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            Welcome to Premium! 🎉
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            Your subscription is now active. Thank you for upgrading!
          </p>

          {/* Benefits List */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-bold text-gray-900 mb-4">Your Premium Benefits:</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Unlimited conversions (no hourly limit)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                50MB file size limit (5x larger)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                No ads anywhere on the platform
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Unlimited cloud storage
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Batch processing (up to 20 files)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Priority processing speed
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Email support within 24 hours
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <Link
            to="/dashboard"
            className="inline-block w-full py-3 px-6 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition"
          >
            Go to Dashboard
          </Link>

          <p className="text-sm text-gray-500 mt-4">
            Start enjoying your premium experience right away!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Success;
