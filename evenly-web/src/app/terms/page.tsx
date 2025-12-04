'use client';

import { motion } from 'framer-motion';
import { FileText, Scale, AlertCircle, CheckCircle, Mail, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

const termsSections = [
  {
    icon: FileText,
    title: 'Acceptance of Terms',
    content: [
      'By accessing and using EvenlySplit, you accept and agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, you may not use our service.',
      'We reserve the right to modify these terms at any time, and such modifications will be effective immediately upon posting.',
      'Your continued use of the service after modifications constitutes acceptance of the updated terms.',
    ],
  },
  {
    icon: Users,
    title: 'User Accounts and Responsibilities',
    content: [
      'You must be at least 18 years old to use EvenlySplit.',
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You agree to provide accurate, current, and complete information during registration.',
      'You are responsible for all activities that occur under your account.',
      'You must notify us immediately of any unauthorized use of your account.',
    ],
  },
  {
    icon: Scale,
    title: 'Service Usage and Restrictions',
    content: [
      'You may use EvenlySplit solely for lawful purposes and in accordance with these Terms.',
      'You agree not to use the service to violate any laws or regulations.',
      'You may not attempt to gain unauthorized access to any part of the service.',
      'You may not interfere with or disrupt the service or servers connected to the service.',
      'You may not use automated systems to access the service without our prior written consent.',
      'You may not share your account with others or create multiple accounts to circumvent service limits.',
    ],
  },
  {
    icon: CheckCircle,
    title: 'Expense Splitting and Payments',
    content: [
      'EvenlySplit facilitates expense tracking and splitting among users.',
      'We are not a payment processor and do not handle actual money transfers.',
      'All payment processing is handled by third-party payment providers.',
      'You are solely responsible for settling expenses with other users.',
      'We are not liable for any disputes arising from expense splits or payments.',
      'You agree to use the service in good faith and settle expenses promptly.',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Intellectual Property',
    content: [
      'All content, features, and functionality of EvenlySplit are owned by us and protected by copyright, trademark, and other laws.',
      'You may not copy, modify, distribute, or create derivative works of our service.',
      'You retain ownership of any content you create or upload to the service.',
      'By using the service, you grant us a license to use, store, and process your content as necessary to provide the service.',
    ],
  },
  {
    icon: Scale,
    title: 'Limitation of Liability',
    content: [
      'EvenlySplit is provided "as is" without warranties of any kind, either express or implied.',
      'We do not guarantee that the service will be uninterrupted, secure, or error-free.',
      'We are not liable for any indirect, incidental, special, or consequential damages.',
      'Our total liability shall not exceed the amount you paid us in the past 12 months.',
      'Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability.',
    ],
  },
  {
    icon: FileText,
    title: 'Termination',
    content: [
      'We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms.',
      'You may terminate your account at any time by contacting us or using the account deletion feature.',
      'Upon termination, your right to use the service will cease immediately.',
      'We may delete your account data in accordance with our Privacy Policy.',
      'Provisions that by their nature should survive termination will remain in effect.',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Dispute Resolution',
    content: [
      'Any disputes arising from these Terms or your use of the service will be resolved through binding arbitration.',
      'You agree to waive your right to a jury trial and to participate in class action lawsuits.',
      'These Terms are governed by the laws of the jurisdiction where our company is located.',
      'If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.',
    ],
  },
];

export default function TermsOfServicePage() {
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
            <Scale className="w-4 h-4" />
            Legal Terms
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Terms of Service
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Please read these terms carefully before using EvenlySplit. 
            By using our service, you agree to be bound by these terms.
          </p>
          
          <div className="mt-8 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </motion.div>

        {/* Terms Sections */}
        <div className="max-w-4xl mx-auto space-y-12">
          {termsSections.map((section, index) => (
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
          transition={{ duration: 0.8, delay: 0.8 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Questions About These Terms?
            </h3>
            
            <p className="text-muted-foreground mb-6">
              If you have any questions about these Terms of Service, please contact us.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:legal@evenlysplit.nxtgenaidev.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                legal@evenlysplit.nxtgenaidev.com
              </motion.a>
              
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:support@evenlysplit.nxtgenaidev.com"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-secondary/50 transition-colors"
              >
                <Users className="w-4 h-4" />
                support@evenlysplit.nxtgenaidev.com
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Legal Notice */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-3">Legal Notice</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms of Service are effective as of the date listed above and will remain in effect 
              except with respect to any changes in their provisions in the future, which will be in 
              effect immediately after being posted on this page. We reserve the right to update or 
              change these Terms of Service at any time and you should check this page periodically. 
              Your continued use of the service after any changes constitutes acceptance of the updated terms.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

