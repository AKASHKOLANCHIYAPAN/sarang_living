'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // In production, this would call an API endpoint
    setIsSubmitted(true);
    setEmail('');
  };

  return (
    <section className="newsletter section-spacing" aria-labelledby="newsletter-heading">
      <div className="container-sarang">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="newsletter-inner"
        >
          <Heart
            size={20}
            fill="var(--color-accent-blush)"
            stroke="var(--color-accent-blush)"
            className="newsletter-heart"
          />
          <h2 id="newsletter-heading" className="newsletter-title">
            Join the Sarang Family
          </h2>
          <p className="newsletter-text">
            Get first access to new arrivals, exclusive offers, and styling tips — 
            delivered with love, never with spam.
          </p>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="newsletter-success"
            >
              <Heart size={24} fill="var(--color-accent-blush)" stroke="var(--color-accent-blush)" />
              <p>Welcome to the family! Check your inbox for a warm hello.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="newsletter-form">
              <div className="newsletter-input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="newsletter-input"
                  aria-label="Email address"
                  required
                />
                <Button type="submit" variant="primary" className="newsletter-btn">
                  <Send size={16} />
                  <span className="newsletter-btn-text">Subscribe</span>
                </Button>
              </div>
              <p className="newsletter-privacy">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
