'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { getAssetPath } from '@/lib/utils';

export default function Hero() {
  return (
    <section className="hero" aria-label="Welcome to Sarang Living">
      <div className="hero-bg">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
      </div>

      <div className="container-sarang hero-content">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hero-text"
        >
          {/* Logo Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="hero-logo-wrap"
          >
            <img src={getAssetPath('/logo.png')} alt="Sarang Living Logo" className="hero-logo-img" />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hero-tagline"
          >
            <Heart size={14} fill="#E85D75" stroke="#E85D75" />
            사랑 · Love every little thing
          </motion.p>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="hero-heading"
          >
            Your One-Stop Shop for
            <br />
            <span className="hero-heading-accent">Accessories & Lifestyle</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="hero-description"
          >
            Discover curated hair accessories, stunning jewellery, aesthetic stationery,
            and lifestyle products — all handpicked to make your everyday moments special.
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
              <span className="hero-stat-number">4</span>
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
