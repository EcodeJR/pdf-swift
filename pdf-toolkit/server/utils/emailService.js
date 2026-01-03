const nodemailer = require('nodemailer');


// Create transporter using Gmail
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || false, // false for 587, true for 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Timings to avoid indefinite hangs
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // Force IPv4 (fixes timeouts on some docker/cloud networks)
        family: 4,
        // Debugging options
        debug: false,
        logger: true,
        tls: {
            // Helpful if running from a local machine with strict antivirus or proxy
            rejectUnauthorized: false
        }
    });
};

// Send email notification when contact form is submitted
exports.sendContactNotification = async (contactData) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: `New Contact Form Submission: ${contactData.subject}`,
            html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Subject:</strong> ${contactData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Contact notification email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending contact notification:', error);
        throw error;
    }
};

// Send auto-reply to user
exports.sendAutoReply = async (contactData) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: contactData.email,
            subject: 'Thank you for contacting PDF Swift',
            html: `
        <h2>Thank you for reaching out!</h2>
        <p>Dear ${contactData.name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${contactData.message.replace(/\n/g, '<br>')}
        </p>
        <p>Best regards,<br>The PDF Swift Team</p>
        <hr>
        <p><small>This is an automated response. Please do not reply to this email.</small></p>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Auto-reply email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending auto-reply:', error);
        // Don't throw error for auto-reply failures
    }
};
