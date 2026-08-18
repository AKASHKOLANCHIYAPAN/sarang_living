'use client';

import { motion } from 'framer-motion';
import { Truck, RotateCcw, Shield, Heart } from 'lucide-react';

const trustItems = [
  {
    icon: Truck,
    title: 'Free Express Shipping',
    description: 'On all orders above $99',
  },
  {
    icon: RotateCcw,
    title: '7-Day Easy Returns',
    description: 'Hassle-free returns & exchanges',
  },
  {
    icon: Shield,
    title: 'Secure Checkout',
    description: '256-bit SSL encrypted payment',
  },
  {
    icon: Heart,
    title: 'Korean Aesthetics',
    description: 'Handpicked minimalist pieces',
  },
];

export default function TrustBar() {
  return (
    <section className="trust-bar section-spacing" aria-label="Why shop with us">
      <div className="container-sarang">
        <div className="trust-grid">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="trust-item"
              >
                <div className="trust-icon">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="trust-title">{item.title}</h3>
                <p className="trust-desc">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
