'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MessageSquare, Clock, Shield } from 'lucide-react';
import Link from 'next/link';
import { SupportForm } from '@/components/SupportForm';

export default function SupportPage() {
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
            <MessageSquare className="w-4 h-4" />
            Support Center
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How can we help you?
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our support team is here to assist you with any questions or issues you might have. 
            We typically respond within 24 hours.
          </p>
        </motion.div>

        {/* Support Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Email Support</h3>
            <p className="text-muted-foreground mb-4">
              Send us a detailed message and we'll get back to you as soon as possible.
            </p>
            <div className="text-sm text-primary font-medium">support@evenly.app</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Response Time</h3>
            <p className="text-muted-foreground mb-4">
              We aim to respond to all support requests within 24 hours during business days.
            </p>
            <div className="text-sm text-primary font-medium">Mon-Fri, 9AM-6PM EST</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Secure & Private</h3>
            <p className="text-muted-foreground mb-4">
              Your information is encrypted and secure. We never share your data with third parties.
            </p>
            <div className="text-sm text-primary font-medium">Bank-level security</div>
          </motion.div>
        </div>

        {/* Support Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <SupportForm />
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: "How do I reset my password?",
                answer: "Evenly uses passwordless authentication. Simply request a magic link or OTP to your email address."
              },
              {
                question: "Can I change my email address?",
                answer: "Yes, you can update your email address in your profile settings. You'll need to verify the new email."
              },
              {
                question: "How do I delete my account?",
                answer: "You can delete your account from the profile settings. This action is irreversible and will remove all your data."
              },
              {
                question: "Is my financial data secure?",
                answer: "Yes, we use bank-level encryption and never store your payment information on our servers."
              },
              {
                question: "How do I invite friends to a group?",
                answer: "Go to your group settings and tap 'Invite Members'. Share the invite link or send invitations via email."
              },
              {
                question: "Can I use Evenly internationally?",
                answer: "Yes, Evenly supports multiple currencies and works worldwide. Exchange rates are updated in real-time."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                className="bg-card border border-border rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
