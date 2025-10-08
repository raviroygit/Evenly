#!/usr/bin/env node

/**
 * Email Setup Script for Evenly Backend
 * 
 * This script helps you set up email functionality for sending invitation emails.
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. GMAIL SETUP (Recommended):
 *    - Go to your Google Account settings
 *    - Enable 2-Factor Authentication
 *    - Generate an App Password:
 *      * Go to Security > 2-Step Verification > App passwords
 *      * Generate a new app password for "Mail"
 *      * Use this app password (not your regular password)
 * 
 * 2. ENVIRONMENT VARIABLES:
 *    Create a .env file in the evenly-backend directory with:
 *    
 *    EMAIL_HOST=smtp.gmail.com
 *    EMAIL_PORT=587
 *    EMAIL_USER=your-gmail@gmail.com
 *    EMAIL_PASS=your-16-character-app-password
 * 
 * 3. ALTERNATIVE EMAIL PROVIDERS:
 * 
 *    OUTLOOK/HOTMAIL:
 *    EMAIL_HOST=smtp-mail.outlook.com
 *    EMAIL_PORT=587
 *    EMAIL_USER=your-email@outlook.com
 *    EMAIL_PASS=your-password
 * 
 *    YAHOO:
 *    EMAIL_HOST=smtp.mail.yahoo.com
 *    EMAIL_PORT=587
 *    EMAIL_USER=your-email@yahoo.com
 *    EMAIL_PASS=your-app-password
 * 
 * 4. TEST EMAIL:
 *    After setting up, restart the backend server and try sending an invitation.
 *    Check the console logs for email sending status.
 */

console.log('📧 Email Setup Instructions for Evenly Backend');
console.log('');
console.log('1. Create a .env file in the evenly-backend directory');
console.log('2. Add your email credentials to the .env file');
console.log('3. Restart the backend server');
console.log('');
console.log('Example .env file:');
console.log('EMAIL_HOST=smtp.gmail.com');
console.log('EMAIL_PORT=587');
console.log('EMAIL_USER=your-gmail@gmail.com');
console.log('EMAIL_PASS=your-app-password');
console.log('');
console.log('For Gmail, you need to use an App Password, not your regular password!');
console.log('See the comments in this file for detailed setup instructions.');
