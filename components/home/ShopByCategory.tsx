'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { categories, getProductsByCategorySlug } from '@/lib/products';
import { getCategoryGradient } from '@/lib/utils';

// Show the top categories with highest product counts
const featuredCategories = categories
  .filter((c) => c.parentCategory === 'Hair Accessories')
  .sort((a, b) => b.productCount - a.productCount)
  .slice(0, 6);

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

        {/* Category Grid */}
        <div className="category-grid">
          {featuredCategories.map((category, index) => {
            const catProducts = getProductsByCategorySlug(category.slug);
            const featuredImg = catProducts.find((p) => p.images.length > 0)?.images[0];

            return (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Link
                  href={`/products?category=${category.slug}`}
                  className="category-tile"
                >
                  <div className="category-tile-image-wrap">
                    {featuredImg ? (
                      <img
                        src={featuredImg}
                        alt={category.name}
                        className="category-tile-img"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="category-tile-image"
                        style={{ background: getCategoryGradient(category.name) }}
                      />
                    )}
                    <span className="category-tile-count">{category.productCount} items</span>
                  </div>
                  <div className="category-tile-info">
                    <h3 className="category-tile-name">{category.name}</h3>
                    <ArrowRight size={16} className="category-tile-arrow" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
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
            View all categories
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
