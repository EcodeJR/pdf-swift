import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setLoading(true);
    try {
      await paymentAPI.cancelSubscription();
      toast.success('Subscription cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings</p>
        </div>

        {/* Account Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <div className="flex items-center">
                {user?.isPremium ? (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full font-semibold">
                    Premium Member
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-semibold">
                    Free Account
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription</h2>
          {user?.isPremium ? (
            <div>
              <p className="text-gray-600 mb-4">
                You are currently subscribed to the Premium plan ($5/month)
              </p>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                You'll retain premium access until the end of your billing period
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                You are currently on the Free plan
              </p>
              <a
                href="/pricing"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Upgrade to Premium
              </a>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>
          <p className="text-red-700 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => toast.error('Account deletion not implemented yet')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
