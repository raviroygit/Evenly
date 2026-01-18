// Quick test script to verify email configuration
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: 'no-reply@nxtgenaidev.com',
    pass: 'a3A3CDqpuBhf'
  }
});

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    console.log('Host: smtp.zoho.in');
    console.log('Port: 465');
    console.log('User: no-reply@nxtgenaidev.com');
    console.log('');

    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: '"Evenly Test" <no-reply@nxtgenaidev.com>',
      to: 'ravi140398@gmail.com',
      subject: 'Test Email from Evenly Backend',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Evenly Backend to verify email configuration.</p>
        <p>If you received this, your email service is working correctly!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('');
    console.log('🎉 Email configuration is working correctly!');
    console.log('Check inbox at ravi140398@gmail.com');
  } catch (error) {
    console.error('💥 Email test failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('1. Wrong password - Check EMAIL_PASS in .env');
    console.error('2. Account locked - Check Zoho account status');
    console.error('3. Two-factor auth - May need app-specific password');
    console.error('4. IP blocked - Check Zoho security settings');
    console.error('');
    console.error('Full error details:');
    console.error(error);
  }
}

testEmail();
