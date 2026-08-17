'use client';

import Link from 'next/link';
import { X, ChevronRight, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { categories } from '@/lib/products';
import { getAssetPath } from '@/lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuLinks = [
  { label: 'Shop All', href: '/products' },
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Bestsellers', href: '/products?sort=bestsellers' },
];

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="drawer-backdrop"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="mobile-menu"
            role="dialog"
            aria-label="Mobile navigation"
            aria-modal="true"
          >
            {/* Header */}
            <div className="mobile-menu-header">
              <Link href="/" onClick={onClose} className="mobile-menu-logo">
                <img src={getAssetPath('/logo.png')} alt="Sarang Living Logo" className="mobile-menu-logo-img" />
              </Link>
              <button onClick={onClose} className="mobile-menu-close" aria-label="Close menu" type="button">
                <X size={20} />
              </button>
            </div>

            {/* Main Links */}
            <div className="mobile-menu-section">
              {menuLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="mobile-menu-link mobile-menu-link-main"
                    onClick={onClose}
                  >
                    {link.label}
                    <ChevronRight size={16} />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Category Links */}
            <div className="mobile-menu-section">
              <span className="mobile-menu-section-title">Categories</span>
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.03 }}
                >
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="mobile-menu-link"
                    onClick={onClose}
                  >
                    {cat.name}
                    <span className="mobile-menu-count">{cat.productCount}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="mobile-menu-footer">
              <p className="mobile-menu-tagline">
                <Heart size={12} fill="var(--color-accent-blush)" stroke="var(--color-accent-blush)" />
                Love every little thing
              </p>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
