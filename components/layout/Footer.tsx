'use client';

import Link from 'next/link';
import { Heart, Mail, MapPin, Phone } from 'lucide-react';
import { categories } from '@/lib/products';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      {/* Gold Divider */}
      <div className="footer-divider">
        <div className="gold-divider" style={{ width: '120px' }} />
      </div>

      <div className="container-sarang">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <img src="/logo.png" alt="Sarang Living Logo" className="footer-logo-img" />
            </Link>
            <p className="footer-tagline">Love every little thing</p>
            <p className="footer-desc">
              A curated collection of hair accessories, aesthetic gifts, and Korean stationery — 
              designed to make everyday moments feel a little more special.
            </p>
            <div className="footer-social">
              <a
                href="https://instagram.com/sarangliving"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Follow us on Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="mailto:hello@sarangliving.com"
                className="footer-social-link"
                aria-label="Email us"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">Shop</h3>
            <ul className="footer-links">
              <li><Link href="/products">All Products</Link></li>
              <li><Link href="/products?sort=newest">New Arrivals</Link></li>
              <li><Link href="/products?sort=bestsellers">Bestsellers</Link></li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/products?category=${cat.slug}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">Help</h3>
            <ul className="footer-links">
              <li><Link href="/shipping">Shipping & Delivery</Link></li>
              <li><Link href="/returns">Returns & Exchanges</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/track-order">Track Your Order</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">Get in Touch</h3>
            <ul className="footer-contact">
              <li>
                <Mail size={14} />
                <a href="mailto:hello@sarangliving.com">hello@sarangliving.com</a>
              </li>
              <li>
                <Phone size={14} />
                <a href="tel:+919876543210">+91 98765 43210</a>
              </li>
              <li>
                <MapPin size={14} />
                <span>Pan-India Delivery</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Sarang Living. Made with{' '}
            <Heart size={12} fill="var(--color-accent-blush)" stroke="var(--color-accent-blush)" />{' '}
            in India.
          </p>
          <div className="footer-legal">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
