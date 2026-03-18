const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { sendSubscriptionConfirmation } = require('../utils/email');

const FLW_BASE_URL = process.env.FLW_BASE_URL || 'https://api.flutterwave.com/v3';
const PREMIUM_AMOUNT = Number(process.env.PREMIUM_AMOUNT || 5);
const PREMIUM_CURRENCY = (process.env.PREMIUM_CURRENCY || 'USD').toUpperCase();

const getFlutterwaveHeaders = () => ({
  Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
  'Content-Type': 'application/json'
});

const isSuccessfulPaymentStatus = (status = '') => {
  const normalized = String(status).toLowerCase();
  return normalized === 'successful' || normalized === 'succeeded' || normalized === 'completed';
};

const extractSubscriptionId = (payload = {}) => {
  return payload.subscription?.id || payload.subscription_id || payload.meta?.subscriptionId || payload.meta?.subscription_id || null;
};

const normalizeTransaction = (transaction = {}, payload = {}) => ({
  id: transaction.id || payload.id || payload.transaction_id || null,
  status: String(transaction.status || transaction.charge_status || payload.status || '').toLowerCase(),
  amount: Number(transaction.amount || transaction.charged_amount || payload.amount || 0),
  currency: String(transaction.currency || payload.currency || '').toUpperCase(),
  txRef: transaction.tx_ref || payload.tx_ref || null,
  customerId: transaction.customer?.id || payload.customer?.id || null,
  meta: transaction.meta || payload.meta || {},
  raw: transaction
});

const verifyWebhookSignature = (req) => {
  const secretHash = process.env.FLW_WEBHOOK_HASH;
  if (!secretHash) {
    return true;
  }

  const legacyHash = req.headers['verif-hash'];
  const signature = req.headers['flutterwave-signature'];

  if (signature && req.rawBody) {
    const digest = crypto
      .createHmac('sha256', secretHash)
      .update(req.rawBody)
      .digest('base64');

    return digest === signature;
  }

  return legacyHash === secretHash;
};

const verifyTransactionWithFlutterwave = async (transactionId, payload = {}) => {
  const attempts = [
    async () => {
      const response = await axios.get(
        `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
        { headers: getFlutterwaveHeaders(), timeout: 15000 }
      );
      return response.data?.data;
    },
    async () => {
      const response = await axios.get(
        `${FLW_BASE_URL}/charges/${transactionId}`,
        { headers: getFlutterwaveHeaders(), timeout: 15000 }
      );
      return response.data?.data || response.data;
    }
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result) {
        return normalizeTransaction(result, payload);
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to verify Flutterwave transaction');
};

const activatePremium = async (user, transaction, subscriptionId = null) => {
  const wasPremium = user.isPremium;

  user.isPremium = true;
  user.subscriptionStatus = 'active';
  user.paymentProvider = 'flutterwave';
  if (transaction.customerId) {
    user.flutterwaveCustomerId = String(transaction.customerId);
  }
  if (transaction.txRef) {
    user.lastPaymentTxRef = transaction.txRef;
  }
  if (subscriptionId) {
    user.subscriptionId = String(subscriptionId);
  }

  await user.save();

  if (!wasPremium) {
    await sendSubscriptionConfirmation(user.email);
  }
};

// @route   POST /api/payment/create-checkout-session
// @desc    Create Flutterwave checkout session
// @access  Private
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    if (!process.env.FLW_SECRET_KEY) {
      return res.status(500).json({ message: 'Flutterwave is not configured on the server' });
    }

    const user = await User.findById(req.user._id);

    if (user.isPremium) {
      return res.status(400).json({ message: 'You already have an active premium subscription' });
    }

    const txRef = `pdfswift_${user._id}_${Date.now()}`;

    const payload = {
      tx_ref: txRef,
      amount: PREMIUM_AMOUNT,
      currency: PREMIUM_CURRENCY,
      redirect_url: `${process.env.CLIENT_URL}/success`,
      customer: {
        email: user.email,
        name: user.name || user.email
      },
      customizations: {
        title: 'PDF Toolkit Premium',
        description: 'Unlimited conversions, 50MB files, no ads, cloud storage'
      },
      meta: {
        userId: user._id.toString(),
        plan: 'premium-monthly'
      }
    };

    if (process.env.FLW_PAYMENT_PLAN_ID) {
      payload.payment_plan = process.env.FLW_PAYMENT_PLAN_ID;
      payload.meta.paymentPlanId = process.env.FLW_PAYMENT_PLAN_ID;
    }

    const response = await axios.post(`${FLW_BASE_URL}/payments`, payload, {
      headers: getFlutterwaveHeaders(),
      timeout: 15000
    });

    if (response.data?.status !== 'success' || !response.data?.data?.link) {
      return res.status(500).json({ message: 'Failed to initialize Flutterwave checkout' });
    }

    user.paymentProvider = 'flutterwave';
    user.lastPaymentTxRef = txRef;
    await user.save();

    res.json({
      url: response.data.data.link,
      txRef
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ message: 'Error creating checkout session', error: error.message });
  }
});

// @route   POST /api/payment/webhook
// @desc    Handle Flutterwave webhook events
// @access  Public (Flutterwave only)
router.post('/webhook', async (req, res) => {
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({ message: 'Invalid webhook signature' });
  }

  try {
    const eventType = req.body?.event || req.body?.type;
    const payload = req.body?.data || {};

    switch (eventType) {
      case 'charge.completed':
      case 'charge.successful': {
        if (!isSuccessfulPaymentStatus(payload.status)) {
          return res.status(200).json({ received: true });
        }

        const transactionId = payload.id || payload.transaction_id;
        if (!transactionId) {
          return res.status(200).json({ received: true });
        }

        const txRef = payload.tx_ref;
        let user = null;

        if (payload.meta?.userId) {
          user = await User.findById(payload.meta.userId);
        }

        if (!user && txRef) {
          user = await User.findOne({ lastPaymentTxRef: txRef });
        }

        if (!user) {
          return res.status(200).json({ received: true });
        }

        const verifiedTransaction = await verifyTransactionWithFlutterwave(transactionId, payload);

        const isValidTransaction =
          isSuccessfulPaymentStatus(verifiedTransaction.status) &&
          verifiedTransaction.amount >= PREMIUM_AMOUNT &&
          verifiedTransaction.currency === PREMIUM_CURRENCY &&
          (!user.lastPaymentTxRef || !verifiedTransaction.txRef || user.lastPaymentTxRef === verifiedTransaction.txRef);

        if (!isValidTransaction) {
          return res.status(200).json({ received: true });
        }

        await activatePremium(user, verifiedTransaction, extractSubscriptionId(payload));
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.disabled': {
        const subscriptionId = extractSubscriptionId(payload) || payload.id;
        if (subscriptionId) {
          const user = await User.findOne({ subscriptionId: String(subscriptionId) });
          if (user) {
            user.isPremium = false;
            user.subscriptionStatus = 'cancelled';
            user.subscriptionId = null;
            await user.save();
          }
        }
        break;
      }

      default:
        console.log(`Unhandled Flutterwave event type: ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// @route   POST /api/payment/verify-transaction
// @desc    Verify Flutterwave transaction and activate premium
// @access  Private
router.post('/verify-transaction', protect, async (req, res) => {
  try {
    const { transactionId, txRef } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: 'transactionId is required' });
    }

    const user = await User.findById(req.user._id);
    const verifiedTransaction = await verifyTransactionWithFlutterwave(transactionId);

    const txRefMatches = !txRef || verifiedTransaction.txRef === txRef;
    const expectedRefMatches = !user.lastPaymentTxRef || !verifiedTransaction.txRef || user.lastPaymentTxRef === verifiedTransaction.txRef;
    const validAmount = verifiedTransaction.amount >= PREMIUM_AMOUNT;
    const validCurrency = verifiedTransaction.currency === PREMIUM_CURRENCY;

    if (!isSuccessfulPaymentStatus(verifiedTransaction.status) || !txRefMatches || !expectedRefMatches || !validAmount || !validCurrency) {
      return res.status(400).json({ message: 'Transaction verification failed' });
    }

    if (verifiedTransaction.meta?.userId && verifiedTransaction.meta.userId !== user._id.toString()) {
      return res.status(403).json({ message: 'Transaction does not belong to this user' });
    }

    await activatePremium(user, verifiedTransaction, extractSubscriptionId(verifiedTransaction.raw));

    return res.json({
      message: 'Payment verified and premium activated',
      isPremium: true,
      subscriptionStatus: 'active'
    });
  } catch (error) {
    console.error('Verify transaction error:', error);
    return res.status(500).json({ message: 'Error verifying transaction', error: error.message });
  }
});

// @route   POST /api/payment/cancel-subscription
// @desc    Cancel subscription
// @access  Private
router.post('/cancel-subscription', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.isPremium || !user.subscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    const cancelAttempts = [
      () => axios.put(
        `${FLW_BASE_URL}/subscriptions/${user.subscriptionId}/cancel`,
        {},
        { headers: getFlutterwaveHeaders(), timeout: 15000 }
      ),
      () => axios.post(
        `${FLW_BASE_URL}/subscriptions/${user.subscriptionId}/cancel`,
        {},
        { headers: getFlutterwaveHeaders(), timeout: 15000 }
      )
    ];

    let cancelled = false;
    let lastError = null;

    for (const attempt of cancelAttempts) {
      try {
        const response = await attempt();
        if (response.data?.status === 'success') {
          cancelled = true;
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!cancelled) {
      throw lastError || new Error('Unable to cancel Flutterwave subscription');
    }

    user.subscriptionStatus = 'cancelled';
    await user.save();

    res.json({ message: 'Subscription cancelled. You will retain access until the end of your billing period.' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Error cancelling subscription', error: error.message });
  }
});

// @route   GET /api/payment/subscription-status
// @desc    Get subscription status
// @access  Private
router.get('/subscription-status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscriptionId) {
      return res.json({ 
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        message: 'No active subscription'
      });
    }

    try {
      const response = await axios.get(
        `${FLW_BASE_URL}/subscriptions/${user.subscriptionId}`,
        { headers: getFlutterwaveHeaders(), timeout: 15000 }
      );

      const subscription = response.data?.data || {};

      return res.json({
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        currentPeriodEnd: subscription.next_due_date || subscription.next_charge_date || null,
        cancelAtPeriodEnd: user.subscriptionStatus === 'cancelled'
      });
    } catch (error) {
      return res.json({
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: user.subscriptionStatus === 'cancelled'
      });
    }
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Error fetching subscription status' });
  }
});

module.exports = router;
