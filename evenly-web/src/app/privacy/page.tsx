'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Users, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const privacySections = [
  {
    icon: Database,
    title: 'Information We Collect',
    content: [
      'Account information (name, email, phone number)',
      'Payment information (processed securely through third-party providers)',
      'Expense data and transaction history',
      'Device information and usage analytics',
      'Location data (only when necessary for features)',
    ],
  },
  {
    icon: Shield,
    title: 'How We Use Your Information',
    content: [
      'Process expense splits and settlements',
      'Provide customer support and improve our services',
      'Send important updates and notifications',
      'Analyze usage patterns to enhance user experience',
      'Comply with legal and regulatory requirements',
    ],
  },
  {
    icon: Lock,
    title: 'Data Security',
    content: [
      'Bank-level encryption for all sensitive data',
      'Regular security audits and penetration testing',
      'Secure data centers with 24/7 monitoring',
      'Multi-factor authentication for account access',
      'Regular security training for our team',
    ],
  },
  {
    icon: Users,
    title: 'Information Sharing',
    content: [
      'We never sell your personal information',
      'Data is only shared with trusted payment processors',
      'Group members can only see shared expense information',
      'Legal compliance may require limited data sharing',
      'Aggregated, anonymized data may be used for analytics',
    ],
  },
  {
    icon: Eye,
    title: 'Your Rights',
    content: [
      'Access and download your personal data',
      'Request correction of inaccurate information',
      'Delete your account and associated data',
      'Opt-out of marketing communications',
      'Request data portability',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Privacy & Security
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Privacy Policy
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your privacy is our priority. Learn how we protect your data and 
            give you control over your personal information.
          </p>
          
          <div className="mt-8 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </motion.div>

        {/* Privacy Sections */}
        <div className="max-w-4xl mx-auto space-y-12">
          {privacySections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {section.title}
                </h2>
              </div>
              
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <motion.li
                    key={itemIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 + itemIndex * 0.05 }}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Questions About Your Privacy?
            </h3>
            
            <p className="text-muted-foreground mb-6">
              We're here to help. Contact our privacy team if you have any questions 
              about how we handle your data.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:privacy@evenly.app"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                privacy@evenly.app
              </motion.a>
              
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:support@evenly.app"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-secondary/50 transition-colors"
              >
                <Users className="w-4 h-4" />
                support@evenly.app
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Legal Notice */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-3">Legal Notice</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This privacy policy is effective as of the date listed above and will remain in effect 
              except with respect to any changes in its provisions in the future, which will be in 
              effect immediately after being posted on this page. We reserve the right to update or 
              change our privacy policy at any time and you should check this privacy policy periodically.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
