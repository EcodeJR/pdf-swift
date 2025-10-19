const express = require('express');
const stripe = require('../config/stripe');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendSubscriptionConfirmation } = require('../utils/email');

const router = express.Router();

// @route   POST /api/payment/create-checkout-session
// @desc    Create Stripe checkout session for premium subscription
// @access  Private
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { priceId = 'price_premium_monthly' } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PDF Toolkit Premium',
              description: 'Unlimited conversions, no ads, cloud storage, and more!'
            },
            unit_amount: 500, // $5.00
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing`,
      client_reference_id: req.user._id.toString(),
      customer_email: req.user.email,
      metadata: {
        userId: req.user._id.toString()
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
});

// @route   POST /api/payment/webhook
// @desc    Handle Stripe webhook events
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.client_reference_id;
        
        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.isPremium = true;
            user.stripeCustomerId = session.customer;
            user.subscriptionId = session.subscription;
            user.subscriptionStatus = 'active';
            await user.save();
            
            // Send confirmation email
            await sendSubscriptionConfirmation(user.email);
            console.log(`User ${user.email} upgraded to premium`);
          }
        }
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = subscription.status;
          if (subscription.status === 'active') {
            user.isPremium = true;
          } else {
            user.isPremium = false;
          }
          await user.save();
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const deletedCustomerId = deletedSubscription.customer;
        
        const deletedUser = await User.findOne({ stripeCustomerId: deletedCustomerId });
        if (deletedUser) {
          deletedUser.isPremium = false;
          deletedUser.subscriptionId = null;
          deletedUser.subscriptionStatus = 'cancelled';
          await deletedUser.save();
          console.log(`User ${deletedUser.email} subscription cancelled`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// @route   POST /api/payment/cancel-subscription
// @desc    Cancel user's subscription
// @access  Private
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    if (!req.user.subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    await stripe.subscriptions.cancel(req.user.subscriptionId);

    // Update user status
    req.user.isPremium = false;
    req.user.subscriptionId = null;
    req.user.subscriptionStatus = 'cancelled';
    await req.user.save();

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Error cancelling subscription' });
  }
});

// @route   GET /api/payment/subscription-status
// @desc    Get user's subscription status
// @access  Private
router.get('/subscription-status', auth, async (req, res) => {
  try {
    res.json({
      isPremium: req.user.isPremium,
      subscriptionStatus: req.user.subscriptionStatus,
      subscriptionId: req.user.subscriptionId
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Error getting subscription status' });
  }
});

module.exports = router;
