const express = require('express');
const router = express.Router();
const { submitContact, getContacts, updateContactStatus } = require('../controllers/contactController');
const { protect, admin } = require('../middleware/auth');

// Public route - Submit contact form
router.post('/', submitContact);

// Admin routes - Manage contacts
router.get('/', protect, admin, getContacts);
router.patch('/:id', protect, admin, updateContactStatus);

module.exports = router;
