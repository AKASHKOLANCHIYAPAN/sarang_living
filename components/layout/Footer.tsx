'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Mail, MapPin, Phone, Truck } from 'lucide-react';
import { getCategories, Category } from '@/lib/products-db';
import { getAssetPath } from '@/lib/utils';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      {/* Delivery Info Strip */}
      <div className="footer-delivery-strip">
        <div className="container-sarang">
          <div className="footer-delivery-grid">
            <div className="footer-delivery-item">
              <Truck size={16} />
              <span>Chennai: 1-2 Working Days</span>
            </div>
            <div className="footer-delivery-item">
              <Truck size={16} />
              <span>Tamil Nadu & Pondicherry: 2-3 Working Days</span>
            </div>
            <div className="footer-delivery-item">
              <Truck size={16} />
              <span>Other States: 3-8 Working Days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-sarang">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <img src={getAssetPath('/logo.png')} alt="Sarang Living Logo" className="footer-logo-img" />
            </Link>
            <p className="footer-tagline">Love every little thing</p>
            <p className="footer-desc">
              Your one-stop shop for curated hair accessories, jewellery,
              stationery, and lifestyle products — designed to make everyday
              moments feel a little more special.
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
              <a
                href="https://wa.me/919363004220"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Chat on WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
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
              <li><Link href="/products">Hair Accessories</Link></li>
              <li><Link href="/products?category=jewellery">Jewellery</Link></li>
              <li><Link href="/products?category=stationary">Stationary</Link></li>
              <li><Link href="/products?category=lifestyle-products">Lifestyle Products</Link></li>
            </ul>
          </div>

          {/* Help Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">Help</h3>
            <ul className="footer-links">
              <li><Link href="/shipping">Shipping &amp; Delivery</Link></li>
              <li><Link href="/returns">Returns &amp; Exchanges</Link></li>
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
                <a href="tel:+916380504220">+91 63805 04220</a>
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
            <Heart size={12} fill="var(--color-accent-coral)" stroke="var(--color-accent-coral)" />{' '}
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
