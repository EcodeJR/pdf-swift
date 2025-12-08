import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { paymentAPI, userAPI } from '../services/api';
import { FiUser, FiLock, FiStar, FiToggleRight, FiToggleLeft, FiAlertCircle, FiSave } from 'react-icons/fi';
import { GridPattern } from '../components/GridPattern';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editName, setEditName] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    darkMode: false
  });

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSavingName(true);
    try {
      await userAPI.updateProfile(editName);
      await refreshUser();
      toast.success('Name updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

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

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Preference updated');
  };

  return (
    <div className="min-h-screen bg-light">
      <GridPattern
        className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)]"
        width={60}
        height={60}
      />
      {/* Header */}
      <div className="bg-white border-b relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-hero font-bold">Settings</h1>
          <p className="text-body-sm text-gray-600 mt-1">Manage your account settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="flex space-x-4 border-b mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 font-semibold whitespace-nowrap transition-colors ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <div className="flex items-center space-x-2">
              <FiUser className="w-4 h-4" />
              <span>Profile</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-4 px-2 font-semibold whitespace-nowrap transition-colors ${activeTab === 'security' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <div className="flex items-center space-x-2">
              <FiLock className="w-4 h-4" />
              <span>Security</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-4 px-2 font-semibold whitespace-nowrap transition-colors ${activeTab === 'preferences' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <div className="flex items-center space-x-2">
              <FiToggleRight className="w-4 h-4" />
              <span>Preferences</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`pb-4 px-2 font-semibold whitespace-nowrap transition-colors ${activeTab === 'subscription' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <div className="flex items-center space-x-2">
              <FiStar className="w-4 h-4" />
              <span>Subscription</span>
            </div>
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-heading-sm font-bold mb-6">Profile Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-body-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your full name"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName || editName === (user?.name || '')}
                      className="btn-primary px-4 py-3 flex items-center gap-2"
                    >
                      <FiSave className="w-4 h-4" />
                      {isSavingName ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <p className="text-caption text-gray-500 mt-2">
                    {!user?.name ? 'No name set yet. Add one to personalize your account.' : 'Click save after making changes'}
                  </p>
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-caption text-gray-500 mt-2">Your email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-gray-700 mb-2">
                    Account Type
                  </label>
                  <div className="flex items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <FiStar className="w-6 h-6 text-primary mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user?.isPremium ? 'Premium Account' : 'Free Account'}
                      </p>
                      <p className="text-caption text-gray-600">
                        {user?.isPremium ? 'Unlimited conversions & priority support' : 'Limited to 5 conversions per hour'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-gray-700 mb-2">
                    Member Since
                  </label>
                  <input
                    type="text"
                    value={new Date(user?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-heading-sm font-bold mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div className="pb-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-body font-semibold text-gray-900">Password</h4>
                      <p className="text-caption text-gray-600 mt-1">Change your password regularly to keep your account secure</p>
                    </div>
                    <button className="btn-secondary">
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="pb-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-body font-semibold text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-caption text-gray-600 mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <button className="btn-secondary">
                      Enable
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-body font-semibold text-gray-900">Sessions</h4>
                      <p className="text-caption text-gray-600 mt-1">View and manage your active login sessions</p>
                    </div>
                    <button className="btn-secondary">
                      View Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-heading-sm font-bold mb-6">Notification Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-6 border-b">
                  <div>
                    <h4 className="text-body font-semibold text-gray-900">Email Notifications</h4>
                    <p className="text-caption text-gray-600 mt-1">Receive updates about your conversions and account</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('emailNotifications')}
                    className="focus:outline-none"
                  >
                    {preferences.emailNotifications ? (
                      <FiToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <FiToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pb-6 border-b">
                  <div>
                    <h4 className="text-body font-semibold text-gray-900">Marketing Emails</h4>
                    <p className="text-caption text-gray-600 mt-1">Receive news about new features and special offers</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('marketingEmails')}
                    className="focus:outline-none"
                  >
                    {preferences.marketingEmails ? (
                      <FiToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <FiToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-body font-semibold text-gray-900">Dark Mode</h4>
                    <p className="text-caption text-gray-600 mt-1">Use dark mode for better visibility at night</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('darkMode')}
                    className="focus:outline-none"
                  >
                    {preferences.darkMode ? (
                      <FiToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <FiToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {user?.isPremium ? (
              <>
                <div className="card bg-gradient-to-br from-primary-50 to-primary/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-heading-sm font-bold mb-2">Premium Subscription</h3>
                      <p className="text-body-sm text-gray-600 mb-4">You are currently subscribed to the Premium plan</p>
                      <ul className="space-y-2">
                        <li className="text-caption text-gray-600 flex items-center">
                          <FiStar className="w-4 h-4 text-primary mr-2" /> Unlimited conversions
                        </li>
                        <li className="text-caption text-gray-600 flex items-center">
                          <FiStar className="w-4 h-4 text-primary mr-2" /> Batch file processing
                        </li>
                        <li className="text-caption text-gray-600 flex items-center">
                          <FiStar className="w-4 h-4 text-primary mr-2" /> Priority support
                        </li>
                      </ul>
                    </div>
                    <button
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="btn-secondary"
                    >
                      {loading ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                </div>
                <div className="card bg-gray-50">
                  <p className="text-caption text-gray-600">
                    <FiAlertCircle className="inline w-4 h-4 mr-2" />
                    Your premium access will continue until the end of your billing period. You can re-subscribe anytime.
                  </p>
                </div>
              </>
            ) : (
              <div className="card bg-gradient-to-br from-primary-600 to-primary text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-heading-sm font-bold mb-2">Upgrade to Premium</h3>
                    <p className="text-body-sm text-white/90 mb-4">Unlock unlimited conversions and more features</p>
                    <ul className="space-y-2">
                      <li className="text-caption text-white/90 flex items-center">
                        <FiStar className="w-4 h-4 mr-2" /> Unlimited conversions per hour
                      </li>
                      <li className="text-caption text-white/90 flex items-center">
                        <FiStar className="w-4 h-4 mr-2" /> Batch file processing (up to 10 files)
                      </li>
                      <li className="text-caption text-white/90 flex items-center">
                        <FiStar className="w-4 h-4 mr-2" /> Priority customer support
                      </li>
                    </ul>
                  </div>
                  <a
                    href="/pricing"
                    className="ml-6 px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
                  >
                    View Plans
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Danger Zone - Always visible */}
        <div className="mt-12 pt-12 border-t">
          <div className="card border-2 border-red-200 bg-red-50">
            <div className="flex items-start space-x-4">
              <FiAlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-heading-sm font-bold text-red-900 mb-2">Danger Zone</h3>
                <p className="text-body-sm text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => toast.error('Account deletion not implemented yet')}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;