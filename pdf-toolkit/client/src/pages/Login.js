import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiCheck } from 'react-icons/fi';
import { GridPattern } from '../components/GridPattern';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Unlimited cloud storage',
    'Priority processing speed',
    'No ads experience',
    'Batch file processing'
  ];

  return (
    <div className="relative min-h-screen bg-secondary-50">
      {/* Grid Pattern Background */}
      <GridPattern
        className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)]"
        width={60}
        height={60}
      />
      <div className="min-h-screen flex relative z-10">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <Link to="/" className="inline-block">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  PDF <span className="text-primary">Swift</span>
                </h1>
              </Link>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Welcome back!
              </h2>
              <p className="mt-2 text-body-sm text-gray-600">
                Sign in to access your dashboard
              </p>
            </div>

            {/* Form */}
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-11"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-11"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-semibold text-primary hover:text-primary-600 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full group"
              >
                <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                {!loading && <FiArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />}
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-primary hover:text-primary-600 transition-colors">
                  Create free account
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Side - Benefits (Hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 to-primary text-white p-12 items-center justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          <GridPattern
            className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)]"
            width={60}
            height={60}
          />

          <div className="relative z-10 max-w-md">
            <h3 className="text-3xl font-bold mb-6">
              Why choose PDF Swift?
            </h3>
            <p className="text-lg text-white/90 mb-8">
              Join thousands of users who trust us with their PDF needs
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mt-0.5">
                    <FiCheck className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg text-white/95">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-sm text-white/80 mb-2">Premium Plan</p>
              <p className="text-3xl font-bold mb-1">$5<span className="text-lg font-normal">/month</span></p>
              <p className="text-sm text-white/80">Unlimited everything</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
