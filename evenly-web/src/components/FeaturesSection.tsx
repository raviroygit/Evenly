'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  Shield, 
  Smartphone, 
  Zap, 
  TrendingUp, 
  Clock, 
  Globe,
  CheckCircle,
  DollarSign,
  Receipt,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Users,
    title: 'Group Management',
    description: 'Create groups for roommates, friends, or any shared expenses. Add members easily and manage permissions.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Receipt,
    title: 'Expense Tracking',
    description: 'Add expenses with photos, categories, and detailed descriptions. Track every penny spent.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: DollarSign,
    title: 'Smart Splitting',
    description: 'Split bills equally, by percentage, or custom amounts. Handle complex scenarios effortlessly.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: CreditCard,
    title: 'Instant Settlements',
    description: 'Settle up instantly with integrated payment methods. No more chasing people for money.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Your financial data is protected with enterprise-grade encryption and security measures.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: TrendingUp,
    title: 'Analytics & Insights',
    description: 'Get insights into your spending patterns and group expenses with detailed analytics.',
    color: 'from-indigo-500 to-blue-500',
  },
];

const benefits = [
  {
    icon: Clock,
    title: 'Save Time',
    description: 'No more manual calculations or awkward conversations about money.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Split bills in seconds with our intuitive interface.',
  },
  {
    icon: Globe,
    title: 'Global Support',
    description: 'Works with multiple currencies and payment methods worldwide.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              split smart
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Powerful features designed to make expense splitting effortless, 
            transparent, and stress-free for everyone involved.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative p-8 bg-card border border-border rounded-xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/20 transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-8 md:p-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Why choose Evenly?
            </h3>
            <p className="text-muted-foreground text-lg">
              Join thousands of users who have simplified their shared expenses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">
                  {benefit.title}
                </h4>
                <p className="text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/20 rounded-full text-primary font-medium mb-6">
            <CheckCircle className="w-5 h-5" />
            Trusted by 50,000+ users worldwide
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to simplify your shared expenses?
          </h3>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Get Started Free
          </motion.button>
          
          <Link href="/support">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 border border-border text-foreground rounded-lg font-semibold text-lg hover:bg-secondary/50 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Contact Support
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
