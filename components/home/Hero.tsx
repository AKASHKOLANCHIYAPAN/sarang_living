'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="hero" aria-label="Welcome to Sarang Living">
      <div className="hero-bg">
        {/* Decorative elements */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      <div className="container-sarang hero-content">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hero-text"
        >
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hero-tagline"
          >
            <Heart size={14} fill="var(--color-accent-blush)" stroke="var(--color-accent-blush)" />
            사랑 · Love every little thing
          </motion.p>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="hero-heading"
          >
            Curated Hair
            <br />
            <span className="hero-heading-accent">Accessories</span>
            <br />
            You&apos;ll Adore
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="hero-description"
          >
            Discover our handpicked collection of Korean-minimalist hair accessories — 
            from delicate claw clips to statement headbands. Each piece is chosen to 
            make everyday moments feel a little more beautiful.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="hero-ctas"
          >
            <Link href="/products">
              <Button variant="primary" size="lg">
                Shop Collection
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/products?sort=newest">
              <Button variant="outline" size="lg">
                New Arrivals
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="hero-stats"
          >
            <div className="hero-stat">
              <span className="hero-stat-number">77+</span>
              <span className="hero-stat-label">Products</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-number">10</span>
              <span className="hero-stat-label">Categories</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-number">₹10</span>
              <span className="hero-stat-label">Starting</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
