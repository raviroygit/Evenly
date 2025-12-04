'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, AlertCircle, CheckCircle, Bug, CreditCard, Lightbulb, HelpCircle, Shield } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { ENV } from '@/lib/env';

interface SupportFormData {
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: 'technical' | 'billing' | 'feature' | 'other';
}

interface SupportFormErrors extends Partial<SupportFormData> {
  captcha?: string;
}

interface SupportFormProps {
  onClose?: () => void;
}

export function SupportForm({ onClose }: SupportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<SupportFormErrors>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupportFormData>({
    userName: '',
    userEmail: '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'other',
  });

  const handleInputChange = (field: keyof SupportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: SupportFormErrors = {};

    if (!formData.userName.trim()) {
      newErrors.userName = 'Name is required';
    }
    if (!formData.userEmail.trim()) {
      newErrors.userEmail = 'Email is required';
    } else if (!formData.userEmail.includes('@')) {
      newErrors.userEmail = 'Please enter a valid email address';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    // Only validate CAPTCHA if it's enabled and configured
    if (ENV.RECAPTCHA_ENABLED && ENV.RECAPTCHA_SITE_KEY && !captchaToken) {
      setErrors(prev => ({ ...prev, captcha: 'Please complete the CAPTCHA verification' }));
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${ENV.EVENLY_BACKEND_URL}/api/support/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          captchaToken,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSubmitted(true);
        // Reset form
        setFormData({
          userName: '',
          userEmail: '',
          subject: '',
          message: '',
          priority: 'medium',
          category: 'other',
        });
        setCaptchaToken(null);
      } else {
        throw new Error(result.message || 'Failed to send support request');
      }
    } catch (error: any) {
      console.error('Error sending support request:', error);
      setErrors({ message: 'Failed to send your support request. Please try again or contact us directly.' });
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#27ae60' },
    { value: 'medium', label: 'Medium', color: '#f39c12' },
    { value: 'high', label: 'High', color: '#e74c3c' },
  ];

  const categoryOptions = [
    { value: 'technical', label: 'Technical Issue', icon: Bug },
    { value: 'billing', label: 'Billing', icon: CreditCard },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb },
    { value: 'other', label: 'Other', icon: HelpCircle },
  ];

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        
        <h3 className="text-2xl font-bold text-foreground mb-4">
          Support Request Sent!
        </h3>
        
        <p className="text-muted-foreground mb-6">
          Thank you for contacting us. We've received your support request and will get back to you soon.
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsSubmitted(false);
            if (onClose) onClose();
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Send Another Request
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Contact Support</h2>
          <p className="text-muted-foreground">We're here to help! Send us your questions or issues.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name and Email Row */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.userName ? 'border-red-500' : 'border-border'
              }`}
              placeholder="Enter your name"
            />
            {errors.userName && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.userName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.userEmail}
              onChange={(e) => handleInputChange('userEmail', e.target.value)}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.userEmail ? 'border-red-500' : 'border-border'
              }`}
              placeholder="Enter your email"
            />
            {errors.userEmail && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.userEmail}
              </p>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Subject *
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.subject ? 'border-red-500' : 'border-border'
            }`}
            placeholder="Brief description of your issue"
          />
          {errors.subject && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.subject}
            </p>
          )}
        </div>

        {/* Category and Priority */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            rows={6}
            className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
              errors.message ? 'border-red-500' : 'border-border'
            }`}
            placeholder="Please describe your issue or question in detail..."
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.message}
            </p>
          )}
        </div>

        {/* CAPTCHA - Only show if properly configured */}
        {ENV.RECAPTCHA_ENABLED && ENV.RECAPTCHA_SITE_KEY && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Security Verification *
            </label>
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey={ENV.RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
                onErrored={() => setCaptchaToken(null)}
                theme="dark"
              />
            </div>
            {errors.captcha && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1 justify-center">
                <AlertCircle className="w-4 h-4" />
                {errors.captcha}
              </p>
            )}
          </div>
        )}

        {/* Development Note */}
        {!ENV.RECAPTCHA_ENABLED && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <Shield className="w-4 h-4 inline mr-2" />
              Form submissions are currently not protected by CAPTCHA. 
              To enable CAPTCHA protection, configure your reCAPTCHA site key in the environment variables.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Support Request
              </>
            )}
          </motion.button>

          {onClose && (
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </motion.button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
