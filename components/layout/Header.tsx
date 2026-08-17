'use client';

import Link from 'next/link';
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { getAssetPath } from '@/lib/utils';
import MobileMenu from './MobileMenu';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';

const navLinks = [
  { label: 'Shop All', href: '/products' },
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Bestsellers', href: '/products?sort=bestsellers' },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isCartOpen = useCartStore((s) => s.isCartOpen);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const totalItems = useCartStore((s) => s.totalItems);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when drawers are open
  useEffect(() => {
    if (isMobileMenuOpen || isCartOpen || isSearchOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
  }, [isMobileMenuOpen, isCartOpen, isSearchOpen]);

  return (
    <>
      <header
        className={`header ${isScrolled ? 'header-scrolled' : ''}`}
        role="banner"
      >
        <div className="header-inner container-sarang">
          {/* Left: Mobile menu toggle + Nav */}
          <div className="header-left">
            <button
              className="header-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
              type="button"
            >
              <Menu size={22} />
            </button>

            <nav className="header-nav" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="header-nav-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="header-logo" aria-label="Sarang Living — Home">
            <img src={getAssetPath('/logo.png')} alt="Sarang Living Logo" className="header-logo-img" />
          </Link>

          {/* Right: Icons */}
          <div className="header-right">
            <button
              className="header-icon-btn"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search products"
              type="button"
            >
              <Search size={20} />
            </button>

            <Link href="/account" className="header-icon-btn header-icon-desktop" aria-label="Account">
              <User size={20} />
            </Link>

            <button
              className="header-icon-btn header-cart-btn"
              onClick={toggleCart}
              aria-label={`Cart (${totalItems()} items)`}
              type="button"
            >
              <ShoppingBag size={20} />
              <AnimatePresence>
                {totalItems() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="header-cart-count"
                  >
                    {totalItems()}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Drawers & Overlays */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <CartDrawer />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
