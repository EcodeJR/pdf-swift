const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { sendSubscriptionConfirmation } = require('../utils/email');

// @route   POST /api/payment/create-checkout-session
// @desc    Create Stripe checkout session
// @access  Private
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.isPremium) {
      return res.status(400).json({ message: 'You already have an active premium subscription' });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PDF Toolkit Premium',
              description: 'Unlimited conversions, 50MB files, no ads, cloud storage',
            },
            unit_amount: 500, // $5.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing`,
      client_reference_id: user._id.toString(),
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ message: 'Error creating checkout session', error: error.message });
  }
});

// @route   POST /api/payment/webhook
// @desc    Handle Stripe webhook events
// @access  Public (Stripe only)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription;

        const user = await User.findById(userId);
        if (user) {
          user.isPremium = true;
          user.subscriptionId = subscriptionId;
          user.subscriptionStatus = 'active';
          await user.save();

          // Send confirmation email
          await sendSubscriptionConfirmation(user.email);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await User.findOne({ subscriptionId: subscription.id });
        
        if (user) {
          user.subscriptionStatus = subscription.status;
          if (subscription.status !== 'active') {
            user.isPremium = false;
          }
          await user.save();
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await User.findOne({ subscriptionId: subscription.id });
        
        if (user) {
          user.isPremium = false;
          user.subscriptionStatus = 'cancelled';
          user.subscriptionId = null;
          await user.save();
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
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

    // Cancel subscription at period end
    await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true
    });

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
        isPremium: false, 
        subscriptionStatus: 'none',
        message: 'No active subscription'
      });
    }

    const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);

    res.json({
      isPremium: user.isPremium,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Error fetching subscription status' });
  }
});

module.exports = router;
