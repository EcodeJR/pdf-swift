import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { FiStar, FiZap, FiClock, FiHardDrive, FiFileText, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { GridPattern } from '../components/GridPattern';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Refresh stats when user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Dashboard visible - refreshing stats...');
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also refresh stats every 30 seconds while on the page
    const interval = setInterval(() => {
      if (!document.hidden) {
        console.log('Auto-refreshing dashboard stats...');
        fetchStats();
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchStats]);

  const fetchStats = React.useCallback(async () => {
    try {
      const data = await userAPI.getStats();
      setStats(data);
      refreshUser();
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      {/* Grid Pattern Background */}
      <GridPattern
        className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)] opacity-20"
        width={60}
        height={60}
      />
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary)] text-[var(--background)] py-16">
        <GridPattern
          className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)] opacity-20"
          width={60}
          height={60}
        />
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-hero font-bold mb-2">
            Welcome back, {user?.name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-body text-[var(--background)]/90">
            Here's your activity overview
          </p>
        </div>
      </div>

      {/* Stats Cards (overlapping header) */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Conversions */}
          <div className="card bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-[var(--text-secondary)] mb-1">Total Conversions</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{stats?.conversionsThisMonth || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </div>

          {/* Storage Used */}
          <div className="card bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-[var(--text-secondary)] mb-1">Files Stored</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{stats?.filesStored || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center">
                <FiHardDrive className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="card bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-[var(--text-secondary)] mb-1">This Month</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{stats?.conversionsThisMonth || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green/10 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Account Type */}
          <div className="card bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-[var(--text-secondary)] mb-1">Account Type</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{user?.isPremium ? 'Premium' : 'Free'}</p>
              </div>
              <div className="w-12 h-12 bg-yellow/10 rounded-lg flex items-center justify-center">
                <FiStar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8 relative z-10">
        {/* Conversion Limit Section */}
        <div className="section mb-8">
          <h2 className="text-heading font-bold mb-6 text-[var(--text-primary)]">Your Limits</h2>
          <div className="card bg-[var(--surface)] border border-[var(--border)]">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <FiClock className="w-6 h-6 text-[var(--primary)]" />
                  <div>
                    <h3 className="text-body font-semibold text-[var(--text-primary)]">Conversions This Hour</h3>
                    <p className="text-caption text-[var(--text-secondary)] mt-1">
                      {user?.isPremium ? 'Unlimited conversions' : `${stats?.conversionsThisHour || 0} / 5 used`}
                    </p>
                  </div>
                </div>
                {!user?.isPremium && (
                  <div className="mt-4">
                    <div className="w-full bg-[var(--border)] rounded-full h-2">
                      <div
                        className="bg-[var(--primary)] h-2 rounded-full transition-all"
                        style={{ width: `${((stats?.conversionsThisHour || 0) / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-caption text-gray-500 mt-2">
                      {Math.max(0, 5 - (stats?.conversionsThisHour || 0))} conversions remaining
                    </p>
                  </div>
                )}
              </div>
              {!user?.isPremium && (
                <Link to="/pricing" className="ml-6 btn-primary">
                  Upgrade Now
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section mb-8">
          <h2 className="text-heading font-bold mb-6 text-[var(--text-primary)]">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/"
              className="card group cursor-pointer hover:shadow-lg transition-shadow bg-[var(--surface)] border border-[var(--border)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                  <FiZap className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <FiArrowRight className="w-5 h-5 text-[var(--text-secondary)]/50 group-hover:text-[var(--primary)] transition-colors" />
              </div>
              <h3 className="text-body font-semibold text-[var(--text-primary)]">Convert Files</h3>
              <p className="text-caption text-[var(--text-secondary)] mt-2">Start a new conversion</p>
            </Link>

            <Link
              to="/my-files"
              className="card group cursor-pointer hover:shadow-lg transition-shadow bg-[var(--surface)] border border-[var(--border)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center">
                  <FiFileText className="w-6 h-6 text-blue-600" />
                </div>
                <FiArrowRight className="w-5 h-5 text-[var(--text-secondary)]/50 group-hover:text-[var(--primary)] transition-colors" />
              </div>
              <h3 className="text-body font-semibold text-[var(--text-primary)]">My Files</h3>
              <p className="text-caption text-[var(--text-secondary)] mt-2">View your conversions</p>
            </Link>

            <Link
              to="/settings"
              className="card group cursor-pointer hover:shadow-lg transition-shadow bg-[var(--surface)] border border-[var(--border)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green/10 rounded-lg flex items-center justify-center">
                  <FiHardDrive className="w-6 h-6 text-green-600" />
                </div>
                <FiArrowRight className="w-5 h-5 text-[var(--text-secondary)]/50 group-hover:text-[var(--primary)] transition-colors" />
              </div>
              <h3 className="text-body font-semibold text-[var(--text-primary)]">Settings</h3>
              <p className="text-caption text-[var(--text-secondary)] mt-2">Manage your account</p>
            </Link>
          </div>
        </div>

        {/* Premium CTA - if not premium */}
        {!user?.isPremium && (
          <div className="section">
            <div className="card bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary)] text-[var(--background)]">
              <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex-1">
                  <h3 className="text-heading font-bold mb-2 text-[var(--background)]">Unlock Premium</h3>
                  <p className="text-body text-white/90 mb-4">
                    Get unlimited conversions, batch processing, and no ads.
                  </p>
                  <ul className="space-y-2">
                    <li className="text-sm flex items-center">
                      <FiStar className="w-4 h-4 mr-2" /> Unlimited conversions per hour
                    </li>
                    <li className="text-sm flex items-center">
                      <FiStar className="w-4 h-4 mr-2" /> Batch file processing
                    </li>
                    <li className="text-sm flex items-center">
                      <FiStar className="w-4 h-4 mr-2" /> Priority support
                    </li>
                  </ul>
                </div>
                <Link
                  to="/pricing"
                  className="ml-6 px-8 py-3 bg-[var(--background)] text-[var(--primary)] font-semibold rounded-lg hover:brightness-110 transition-colors flex items-center group whitespace-nowrap"
                >
                  Upgrade
                  <FiArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
