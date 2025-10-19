const router = require('express').Router();

router.post('/pdf-to-word', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/pdf-to-excel', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/pdf-to-jpg', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/word-to-pdf', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/excel-to-pdf', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/jpg-to-pdf', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/compress-pdf', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/merge-pdf', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/split-pdf', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/edit-pdf', (req, res) => res.status(501).json({ message: 'Not implemented' }));

module.exports = router;
