import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';
import { FiCheck, FiX } from 'react-icons/fi';
import { GridPattern } from '../components/GridPattern';

const Pricing = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      toast.info('Please login or create an account to upgrade');
      navigate('/register');
      return;
    }

    if (user?.isPremium) {
      toast.info('You already have an active premium subscription');
      return;
    }

    setLoading(true);
    try {
      const { url } = await paymentAPI.createCheckout();
      window.location.href = url; // Redirect to Stripe checkout
    } catch (error) {
      toast.error('Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const features = {
    free: [
      { text: '3 conversions per hour', included: true },
      { text: 'All conversion tools', included: true },
      { text: '10MB file size limit', included: true },
      { text: 'Watch ads for conversions', included: true },
      { text: '1-hour temporary storage', included: true },
      { text: 'Unlimited conversions', included: false },
      { text: 'No ads', included: false },
      { text: '50MB file size limit', included: false },
      { text: 'Cloud storage', included: false },
    ],
    premium: [
      { text: 'Unlimited conversions', included: true },
      { text: 'All conversion tools', included: true },
      { text: '50MB file size limit', included: true },
      { text: 'No ads, ad-free experience', included: true },
      { text: 'Cloud storage (30 days)', included: true },
      { text: 'Batch processing (up to 20 files)', included: true },
      { text: 'Priority processing speed', included: true },
      { text: 'Email support (24hr response)', included: true },
    ],
  };

  const faqs = [
    {
      q: 'Can I cancel anytime?',
      a: 'Yes, you can cancel your subscription at any time from your dashboard. You\'ll retain access until the end of your billing period.',
    },
    {
      q: 'Is my payment secure?',
      a: 'Absolutely! All payments are processed securely through Stripe. We never store your credit card information.',
    },
    {
      q: 'What happens after I cancel?',
      a: 'You\'ll retain premium access until the end of your current billing period, then your account will revert to the free plan.',
    },
    {
      q: 'Do you offer refunds?',
      a: 'Yes, we offer a 7-day money-back guarantee. Contact us within 7 days of your purchase for a full refund.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[var(--background)] py-12 z-10">
      <GridPattern
        className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)] opacity-20"
        width={60}
        height={60}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-[var(--text-secondary)]">
            Choose the plan that's right for you
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Free Plan */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Free</h2>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-[var(--text-primary)]">$0</span>
              <span className="text-[var(--text-secondary)]">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-start">
                  {feature.included ? (
                    <FiCheck className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  ) : (
                    <FiX className="w-5 h-5 text-gray-300 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={feature.included ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]/40'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 px-4 bg-[var(--border)] text-[var(--text-secondary)] rounded-lg font-medium cursor-not-allowed"
              disabled
            >
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary)] rounded-lg shadow-xl p-8 text-[var(--background)] relative">
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-1 rounded-bl-lg rounded-tr-lg font-bold text-sm">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold mb-4">Premium</h2>
            <div className="mb-6">
              <span className="text-5xl font-extrabold">$5</span>
              <span className="text-primary-100">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <FiCheck className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading || (user && user.isPremium)}
              className="w-full py-3 px-4 bg-[var(--background)] text-[var(--primary)] rounded-lg font-bold hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {loading ? 'Processing...' : user?.isPremium ? 'Current Plan' : 'Upgrade Now'}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[var(--text-primary)] mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{faq.q}</h3>
                <p className="text-[var(--text-secondary)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Money-back Guarantee */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium">
            🛡️ 7-Day Money-Back Guarantee
          </div>
        </div>
      </div>
    </div >
  );
};

export default Pricing;
