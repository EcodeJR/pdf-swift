const router = require('express').Router();

router.post('/register', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/login', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/me', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/forgot-password', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/reset-password', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/verify-email', (req, res) => res.status(501).json({ message: 'Not implemented' }));

module.exports = router;
