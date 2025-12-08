const Contact = require('../models/Contact');
const { sendContactNotification, sendAutoReply } = require('../utils/emailService');

// Submit contact form
exports.submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Get user agent and IP for tracking
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Create contact entry
        const contact = await Contact.create({
            name,
            email,
            subject,
            message,
            userAgent,
            ipAddress
        });

        // Send email notifications (don't await to avoid blocking)
        Promise.all([
            sendContactNotification({ name, email, subject, message }),
            sendAutoReply({ name, email, subject, message })
        ]).catch(err => console.error('Email sending error:', err));

        res.status(201).json({
            message: 'Thank you for your message! We will get back to you soon.',
            contactId: contact._id
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({
            message: 'Failed to submit contact form. Please try again later.'
        });
    }
};

// Get all contacts (admin only)
exports.getContacts = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = status ? { status } : {};
        const skip = (page - 1) * limit;

        const contacts = await Contact.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Contact.countDocuments(query);

        res.json({
            contacts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ message: 'Failed to retrieve contacts' });
    }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['new', 'read', 'replied'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const contact = await Contact.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json({ message: 'Status updated successfully', contact });
    } catch (error) {
        console.error('Update contact status error:', error);
        res.status(500).json({ message: 'Failed to update contact status' });
    }
};
