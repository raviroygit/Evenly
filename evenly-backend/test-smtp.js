#!/usr/bin/env node

/**
 * Test SMTP connection with Zoho credentials
 */

const nodemailer = require('nodemailer');

// SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: 'no-reply@nxtgenaidev.com',
    pass: 'a3A3CDqpuBhf'
  }
});

async function testSMTP() {
  try {
    console.log('🧪 Testing SMTP connection...');
    
    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: '"Evenly Test" <no-reply@nxtgenaidev.com>',
      to: 'ravi93448@gmail.com',
      subject: 'Test Email from Evenly Backend',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify SMTP configuration.</p>
        <p>If you receive this, the email system is working correctly!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ SMTP test failed:', error.message);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check email credentials.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Please check SMTP host and port.');
    }
  }
}

testSMTP();
