/**
 * Email service for sending transactional emails
 */
import { MailService } from '@sendgrid/mail';

// Initialize SendGrid
const mailService = new MailService();

if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found. Email functionality will be disabled.');
}

// Types
interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Email not sent.');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from, // Use verified sender in SendGrid
      subject: params.subject,
      text: params.text,
      html: params.html
    });
    
    console.log(`Email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Send a crypto payment confirmation email
 */
export async function sendCryptoPaymentConfirmation(
  email: string,
  username: string,
  txId: string,
  cryptoType: string,
  amountCrypto: string,
  amountUsd: string,
  planName: string
): Promise<boolean> {
  // Format crypto type for display
  const formattedCryptoType = formatCryptoType(cryptoType);
  
  // Create email content
  const subject = `Payment Confirmed: Your GhostliAI ${planName} Subscription`;
  
  const text = `
Hello ${username},

Your cryptocurrency payment for GhostliAI ${planName} has been confirmed!

Transaction Details:
- Transaction ID: ${txId}
- Amount: ${amountCrypto} ${formattedCryptoType} (${amountUsd} USD)
- Status: Confirmed & Processed

Your GhostliAI ${planName} subscription is now active, and you have full access to all the premium features including:
• Advanced humanization settings (0-15% range)
• Up to 5,000 words per content generation
• Multiple export formats (PDF, Word, HTML, etc.)
• "Clone Me" personal writing style analysis
• Keyword control and phrase removal
• Website scanning for content extraction

You can view your subscription details and transaction history in your account dashboard.

Thank you for subscribing to GhostliAI ${planName}!

The GhostliAI Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .transaction { background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .feature-list { margin: 20px 0; }
    .feature-list li { margin-bottom: 8px; }
    .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hello ${username},</p>
      
      <p>Your cryptocurrency payment for <strong>GhostliAI ${planName}</strong> has been confirmed!</p>
      
      <div class="transaction">
        <h3>Transaction Details:</h3>
        <p><strong>Transaction ID:</strong> ${txId}</p>
        <p><strong>Amount:</strong> ${amountCrypto} ${formattedCryptoType} (${amountUsd} USD)</p>
        <p><strong>Status:</strong> <span style="color: #4CAF50;">✓ Confirmed & Processed</span></p>
      </div>
      
      <p>Your GhostliAI ${planName} subscription is now active, and you have full access to all the premium features including:</p>
      
      <ul class="feature-list">
        <li>Advanced humanization settings (0-15% range)</li>
        <li>Up to 5,000 words per content generation</li>
        <li>Multiple export formats (PDF, Word, HTML, etc.)</li>
        <li>"Clone Me" personal writing style analysis</li>
        <li>Keyword control and phrase removal</li>
        <li>Website scanning for content extraction</li>
      </ul>
      
      <p>You can view your subscription details and transaction history in your account dashboard.</p>
      
      <a href="/crypto-dashboard" class="button">View Dashboard</a>
    </div>
    <div class="footer">
      <p>Thank you for subscribing to GhostliAI ${planName}!</p>
      <p>The GhostliAI Team</p>
    </div>
  </div>
</body>
</html>
`;

  // Send the email
  return sendEmail({
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@ghostliai.com',
    subject,
    text,
    html
  });
}

/**
 * Send a crypto payment failure notification
 */
export async function sendCryptoPaymentFailure(
  email: string,
  username: string,
  txId: string,
  cryptoType: string,
  reason: string
): Promise<boolean> {
  // Format crypto type for display
  const formattedCryptoType = formatCryptoType(cryptoType);
  
  // Create email content
  const subject = 'Important: Issue with Your GhostliAI Payment';
  
  const text = `
Hello ${username},

We encountered an issue with your recent cryptocurrency payment.

Transaction Details:
- Transaction ID: ${txId}
- Cryptocurrency: ${formattedCryptoType}
- Status: Not Processed

Issue: ${reason}

To complete your subscription, please try again with the correct amount or contact our support team for assistance.

You can restart the payment process from your account dashboard.

Thank you for your understanding.

The GhostliAI Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .transaction { background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .issue { background-color: #fff8f8; border-left: 4px solid #ef4444; padding: 10px; margin: 15px 0; }
    .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Issue</h1>
    </div>
    <div class="content">
      <p>Hello ${username},</p>
      
      <p>We encountered an issue with your recent cryptocurrency payment.</p>
      
      <div class="transaction">
        <h3>Transaction Details:</h3>
        <p><strong>Transaction ID:</strong> ${txId}</p>
        <p><strong>Cryptocurrency:</strong> ${formattedCryptoType}</p>
        <p><strong>Status:</strong> <span style="color: #ef4444;">✗ Not Processed</span></p>
      </div>
      
      <div class="issue">
        <h3>Issue:</h3>
        <p>${reason}</p>
      </div>
      
      <p>To complete your subscription, please try again with the correct amount or contact our support team for assistance.</p>
      
      <p>You can restart the payment process from your account dashboard.</p>
      
      <a href="/subscription/plans" class="button">Try Again</a>
    </div>
    <div class="footer">
      <p>Thank you for your understanding.</p>
      <p>The GhostliAI Team</p>
    </div>
  </div>
</body>
</html>
`;

  // Send the email
  return sendEmail({
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@ghostliai.com',
    subject,
    text,
    html
  });
}

/**
 * Format crypto type for human-readable display
 */
function formatCryptoType(cryptoType: string): string {
  switch (cryptoType) {
    case 'bitcoin':
      return 'Bitcoin (BTC)';
    case 'solana':
      return 'Solana (SOL)';
    case 'usdt_erc20':
      return 'USDT (ERC-20)';
    case 'usdt_trc20':
      return 'USDT (TRC-20)';
    default:
      return cryptoType;
  }
}