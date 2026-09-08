'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const mainCategories = [
  {
    name: 'Hair Accessories',
    slug: 'hair-accessories',
    description: 'Claw clips, scrunchies, bows, headbands & more',
    href: '/products',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #FFE5EC 0%, #F8C8DC 100%)',
    accentColor: '#E85D75',
  },
  {
    name: 'Jewellery',
    slug: 'jewellery',
    description: 'Rings, necklaces, bracelets & earrings',
    href: '/products?category=jewellery',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #FFF3E0 0%, #FFD699 100%)',
    accentColor: '#E6A817',
  },
  {
    name: 'Stationary',
    slug: 'stationary',
    description: 'Pens, notebooks, pencil cases & more',
    href: '/products?category=stationary',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #E8F5E9 0%, #A5D6A7 100%)',
    accentColor: '#43A047',
  },
  {
    name: 'Lifestyle Products',
    slug: 'lifestyle-products',
    description: 'Home decor, bags, keychains & gifts',
    href: '/products?category=lifestyle-products',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #E3F2FD 0%, #90CAF9 100%)',
    accentColor: '#1E88E5',
  },
];

export default function ShopByCategory() {
  return (
    <section className="section-spacing" aria-labelledby="shop-by-category-heading">
      <div className="container-sarang">
        {/* Section Header */}
        <div className="section-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="shop-by-category-heading" className="section-title">
              Shop by Category
            </h2>
            <div className="gold-divider" />
            <p className="section-subtitle">
              Find exactly what you&apos;re looking for
            </p>
          </motion.div>
        </div>

        {/* Category Grid — 4 Main Categories */}
        <div className="category-grid category-grid-4">
          {mainCategories.map((category, index) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={category.href} className="category-tile category-tile-main">
                <div
                  className="category-tile-icon-wrap"
                  style={{ background: category.gradient }}
                >
                  <div className="category-tile-icon" style={{ color: category.accentColor }}>
                    {category.icon}
                  </div>
                </div>
                <div className="category-tile-info">
                  <h3 className="category-tile-name">{category.name}</h3>
                  <p className="category-tile-desc">{category.description}</p>
                  <span className="category-tile-cta" style={{ color: category.accentColor }}>
                    Explore
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="section-view-all"
        >
          <Link href="/products" className="view-all-link">
            View all products
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
