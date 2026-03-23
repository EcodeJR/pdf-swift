const router = require('express').Router();

router.get('/stats', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/files', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/files/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.delete('/files/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/conversion-history', (req, res) => res.status(501).json({ message: 'Not implemented' }));

module.exports = router;
