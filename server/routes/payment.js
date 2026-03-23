const router = require('express').Router();

router.post('/create-checkout-session', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/webhook', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/cancel-subscription', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/subscription-status', (req, res) => res.status(501).json({ message: 'Not implemented' }));

module.exports = router;
