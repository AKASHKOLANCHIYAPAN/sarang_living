'use client';

import { motion } from 'framer-motion';
import { Truck, RotateCcw, Shield, Heart } from 'lucide-react';

const trustItems = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On all orders above ₹999',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '7-day hassle-free returns',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: 'UPI, cards & more via Razorpay',
  },
  {
    icon: Heart,
    title: 'Curated with Love',
    description: 'Handpicked Korean-minimalist pieces',
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
