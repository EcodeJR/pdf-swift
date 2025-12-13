const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid (fallback option)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Create Nodemailer transporter for Gmail
let gmailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Gmail SMTP configured for email service');
} else if (process.env.SENDGRID_API_KEY) {
  console.log('SendGrid configured for email service');
} else {
  console.log('No email service configured. Emails will be logged to console only.');
}

// Helper function to send email using either Gmail or SendGrid
const sendEmail = async (to, subject, html) => {
  try {
    // Prefer Gmail if configured
    if (gmailTransporter) {
      const mailOptions = {
        from: `"PDF Toolkit" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      };

      await gmailTransporter.sendMail(mailOptions);
      console.log(`Email sent via Gmail to: ${to}`);
      return true;
    }
    // Fallback to SendGrid
    else if (process.env.SENDGRID_API_KEY) {
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        html
      };

      await sgMail.send(msg);
      console.log(`Email sent via SendGrid to: ${to}`);
      return true;
    }
    // No email service configured
    else {
      console.log(`No email service configured. Email would be sent to: ${to}`);
      console.log(`Subject: ${subject}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b82f6;">Welcome to PDF Toolkit!</h1>
      <p>Hi there,</p>
      <p>Thank you for creating an account with PDF Toolkit. You now have access to:</p>
      <ul>
        <li>All 10 PDF conversion tools</li>
        <li>Cloud storage for your converted files (30 days)</li>
        <li>3 free conversions per hour</li>
      </ul>
      <p>Want unlimited conversions and no ads? <a href="${process.env.CLIENT_URL}/pricing" style="color: #3b82f6;">Upgrade to Premium</a> for just $5/month!</p>
      <p>Happy converting!<br>The PDF Toolkit Team</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Welcome to PDF Toolkit!', html);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const sendSecurityAlert = async (email, ip, device) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">New Login Detected</h2>
      <p>We detected a new login to your PDF Toolkit account:</p>
      <ul>
        <li><strong>IP Address:</strong> ${ip}</li>
        <li><strong>Device:</strong> ${device}</li>
        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>If this was you, you can safely ignore this email.</p>
      <p>If you don't recognize this activity, please <a href="${process.env.CLIENT_URL}/forgot-password" style="color: #3b82f6;">reset your password</a> immediately.</p>
      <p>Best regards,<br>PDF Toolkit Security Team</p>
    </div>
  `;

  try {
    await sendEmail(email, 'New Login Detected - PDF Toolkit', html);
  } catch (error) {
    console.error('Error sending security alert:', error);
  }
};

const sendPasswordReset = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Password Reset Request</h2>
      <p>You requested to reset your password for your PDF Toolkit account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>PDF Toolkit Team</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Password Reset Request - PDF Toolkit', html);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

const sendPasswordChanged = async (email) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Password Changed Successfully</h2>
      <p>Your password has been changed successfully.</p>
      <p>If you didn't make this change, please contact us immediately.</p>
      <p>Best regards,<br>PDF Toolkit Team</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Password Changed Successfully - PDF Toolkit', html);
  } catch (error) {
    console.error('Error sending password changed email:', error);
  }
};

const sendSubscriptionConfirmation = async (email) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b82f6;">Welcome to Premium! 🎉</h1>
      <p>Thank you for upgrading to PDF Toolkit Premium!</p>
      <p>You now have access to:</p>
      <ul>
        <li>✅ Unlimited conversions (no hourly limit)</li>
        <li>✅ 50MB file size limit (5x larger)</li>
        <li>✅ Zero ads - clean interface</li>
        <li>✅ Unlimited cloud storage</li>
        <li>✅ Batch processing (up to 20 files)</li>
        <li>✅ Priority processing speed</li>
        <li>✅ Email support within 24 hours</li>
      </ul>
      <p>Start enjoying your premium experience at <a href="${process.env.CLIENT_URL}/dashboard" style="color: #3b82f6;">your dashboard</a>!</p>
      <p>Thank you for your support!<br>The PDF Toolkit Team</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Welcome to Premium! - PDF Toolkit', html);
  } catch (error) {
    console.error('Error sending subscription confirmation:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendSecurityAlert,
  sendPasswordReset,
  sendPasswordChanged,
  sendSubscriptionConfirmation
};
