import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { FiStar, FiZap, FiClock, FiHardDrive } from 'react-icons/fi';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await userAPI.getStats();
      setStats(data);
      refreshUser();
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-2">{user?.email}</p>
        </div>

        {/* Account Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Account Status</h2>
              {user?.isPremium ? (
                <div className="flex items-center mt-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full font-semibold flex items-center">
                    <FiStar className="mr-1" /> Premium Member
                  </span>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-semibold">
                    Free Account
                  </span>
                </div>
              )}
            </div>
            {!user?.isPremium && (
              <Link
                to="/pricing"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Upgrade to Premium
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Conversions This Hour */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Conversions This Hour</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.conversionsThisHour || 0}
                  {!user?.isPremium && (
                    <span className="text-base text-gray-500"> / 3</span>
                  )}
                </p>
                {user?.isPremium && (
                  <p className="text-sm text-green-600 font-medium mt-1">Unlimited</p>
                )}
              </div>
              <FiClock className="w-12 h-12 text-primary-600" />
            </div>
            {!user?.isPremium && stats && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${(stats.conversionsThisHour / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Conversions This Month */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Conversions This Month</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.conversionsThisMonth || 0}
                </p>
              </div>
              <FiZap className="w-12 h-12 text-primary-600" />
            </div>
          </div>

          {/* Files Stored */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Files Stored</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.filesStored || 0}
                </p>
              </div>
              <FiHardDrive className="w-12 h-12 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/"
              className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center font-medium"
            >
              Go to Tools
            </Link>
            <Link
              to="/my-files"
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium"
            >
              View My Files
            </Link>
            <Link
              to="/settings"
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium"
            >
              Settings
            </Link>
            {!user?.isPremium && (
              <Link
                to="/pricing"
                className="px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-700 text-center font-medium"
              >
                Upgrade Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
