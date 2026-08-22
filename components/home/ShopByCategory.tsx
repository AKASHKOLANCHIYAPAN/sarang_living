'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCategories, getProducts, Category, Product } from '@/lib/products-db';
import { getCategoryGradient, getAssetPath } from '@/lib/utils';

export default function ShopByCategory() {
  const [featuredCategories, setFeaturedCategories] = useState<{ category: Category; featuredImg?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const [allCategories, allProducts] = await Promise.all([
          getCategories(),
          getProducts({ onlyActive: true }),
        ]);

        const topCategories = allCategories
          .filter((c) => c.parentCategory === 'Hair Accessories')
          .sort((a, b) => b.productCount - a.productCount)
          .slice(0, 6);

        const categoriesWithImages = topCategories.map((category) => {
          const catProduct = allProducts.find(
            (p) => p.category.toLowerCase() === category.name.toLowerCase() && p.images.length > 0
          );
          return {
            category,
            featuredImg: catProduct?.images[0],
          };
        });

        setFeaturedCategories(categoriesWithImages);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCategories();
  }, []);

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
          {featuredCategories.map(({ category, featuredImg }, index) => {
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
                        src={getAssetPath(featuredImg)}
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
