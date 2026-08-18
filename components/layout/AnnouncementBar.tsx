'use client';

import { Truck, RotateCcw, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const announcements = [
  { icon: Truck, text: '✨ Free Express Shipping on orders above $99 — Code: UNISEOUL ✨' },
  { icon: MapPin, text: 'Authentic Korean Hair Accessories & Lifestyle Essentials' },
  { icon: RotateCcw, text: 'Easy 7-Day Returns & Worldwide Dispatch' },
];

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate announcements
  useState(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  });

  if (!isVisible) return null;

  const current = announcements[currentIndex];
  const Icon = current.icon;

  return (
    <div className="announcement-bar" role="banner">
      <div className="announcement-bar-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="announcement-bar-item"
          >
            <Icon size={14} strokeWidth={1.5} />
            <span>{current.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="announcement-bar-close"
        aria-label="Close announcement bar"
        type="button"
      >
        <X size={14} />
      </button>
    </div>
  );
}
