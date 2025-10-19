const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = async (email, name) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Welcome to PDF Toolkit!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to PDF Toolkit!</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for joining PDF Toolkit! You now have access to our powerful PDF conversion tools.</p>
        <p><strong>What you can do:</strong></p>
        <ul>
          <li>Convert PDFs to Word, Excel, and images</li>
          <li>Merge and split PDFs</li>
          <li>Compress PDFs to reduce file size</li>
          <li>Edit PDFs with text and annotations</li>
        </ul>
        <p>Start converting your files at <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></p>
        <p>Best regards,<br>The PDF Toolkit Team</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Welcome email sent to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const sendSecurityAlert = async (email, ip, device) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Security Alert: New Device Login',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Security Alert</h2>
        <p>We noticed a login to your PDF Toolkit account from a new device or location.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>IP Address: ${ip}</li>
          <li>Device: ${device}</li>
          <li>Time: ${new Date().toLocaleString()}</li>
        </ul>
        <p>If this was you, no action is needed. If you don't recognize this activity, please change your password immediately.</p>
        <p>Best regards,<br>The PDF Toolkit Team</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Security alert sent to:', email);
  } catch (error) {
    console.error('Error sending security alert:', error);
  }
};

const sendPasswordReset = async (email, resetLink) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Reset Your Password - PDF Toolkit',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>You requested a password reset for your PDF Toolkit account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <p>Best regards,<br>The PDF Toolkit Team</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

const sendPasswordChanged = async (email) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Password Changed Successfully - PDF Toolkit',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Password Changed Successfully</h2>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The PDF Toolkit Team</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Password changed confirmation sent to:', email);
  } catch (error) {
    console.error('Error sending password changed email:', error);
  }
};

const sendSubscriptionConfirmation = async (email) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Welcome to Premium! - PDF Toolkit',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Welcome to Premium!</h2>
        <p>Congratulations! You're now a Premium member of PDF Toolkit.</p>
        <p><strong>Your Premium benefits:</strong></p>
        <ul>
          <li>Unlimited conversions</li>
          <li>Larger file sizes (up to 50MB)</li>
          <li>No ads</li>
          <li>Cloud storage</li>
          <li>Priority processing</li>
        </ul>
        <p>Start enjoying your Premium features at <a href="${process.env.CLIENT_URL}/dashboard">${process.env.CLIENT_URL}/dashboard</a></p>
        <p>Best regards,<br>The PDF Toolkit Team</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Subscription confirmation sent to:', email);
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
