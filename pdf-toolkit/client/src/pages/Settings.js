import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { paymentAPI, userAPI } from '../services/api';
import { FiUser, FiLock, FiStar, FiToggleRight, FiToggleLeft, FiAlertCircle, FiSave, FiX } from 'react-icons/fi';
import { GridPattern } from '../components/GridPattern';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { user, refreshUser, logout } = useAuth();
  const { theme, toggleTheme, setExplicitTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editName, setEditName] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    darkMode: false
  });

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await userAPI.updatePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm');
      return;
    }

    setLoading(true);
    try {
      await userAPI.deleteAccount(deletePassword);
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
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
      await refreshUser();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };

    setPreferences(newPreferences);

    try {
      await userAPI.updatePreferences({ [key]: newPreferences[key] });
      toast.success('Preference updated');

      // If dark mode was toggled, update the theme context immediately
      if (key === 'darkMode') {
        setExplicitTheme(newPreferences.darkMode ? 'dark' : 'light');
      }
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      toast.error('Failed to update preference');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-300">
      <GridPattern
        className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)] opacity-20"
        width={60}
        height={60}
      />
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] relative z-10">
        <GridPattern
          className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)] opacity-20"
          width={60}
          height={60}
        />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-hero font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="text-body-sm text-[var(--text-secondary)] mt-1">Manage your account settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="flex space-x-4 border-b mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 font-semibold whitespace-nowrap transition-colors ${activeTab === 'profile' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <div className="flex items-center space-x-2">
              <FiUser className="w-4 h-4" />
              <span>Profile</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-4 px-2 font-semibold whitespace-nowrap transition-colors ${activeTab === 'security' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <div className="flex items-center space-x-2">
              <FiLock className="w-4 h-4" />
              <span>Security</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-4 px-2 font-semibold whitespace-nowrap transition-colors ${activeTab === 'preferences' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <div className="flex items-center space-x-2">
              <FiToggleRight className="w-4 h-4" />
              <span>Preferences</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`pb-4 px-2 font-semibold whitespace-nowrap transition-colors ${activeTab === 'subscription' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
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
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
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
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="btn-secondary"
                    >
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
                    <button className="btn-secondary opacity-50 cursor-not-allowed" disabled>
                      Coming Soon
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-body font-semibold text-gray-900">Sessions</h4>
                      <p className="text-caption text-gray-600 mt-1">View and manage your active login sessions</p>
                    </div>
                    <button className="btn-secondary opacity-50 cursor-not-allowed" disabled>
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
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold mb-4">Change Password</h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4 text-red-600">
              <FiAlertCircle className="w-8 h-8" />
              <h3 className="text-xl font-bold">Delete Account</h3>
            </div>

            <p className="text-gray-600 mb-6">
              This action is permanent and cannot be undone. All your files and data will be permanently deleted.
              Please enter your password to confirm.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || !deletePassword}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;