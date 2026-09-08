'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { priceBuckets } from '@/lib/utils';
import { getProducts, Product } from '@/lib/products-db';

export default function ShopByPrice() {
  const [productsList, setProductsList] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const prods = await getProducts({ onlyActive: true });
        setProductsList(prods);
      } catch (err) {
        console.error('Error loading products for price buckets:', err);
      }
    }
    loadProducts();
  }, []);

  function getCountForBucket(min: number, max: number): number {
    return productsList.filter((p) => p.price >= min && p.price <= max && p.isActive).length;
  }

  return (
    <section className="shop-by-price section-spacing" aria-labelledby="shop-by-price-heading">
      <div className="container-sarang">
        {/* Section Header */}
        <div className="section-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="shop-by-price-heading" className="section-title">
              Shop by Budget
            </h2>
            <div className="gold-divider" />
            <p className="section-subtitle">
              Beautiful finds at every price point
            </p>
          </motion.div>
        </div>

        {/* Price Buckets — No Emojis */}
        <div className="price-bucket-grid">
          {priceBuckets.map((bucket, index) => {
            const count = getCountForBucket(bucket.min, bucket.max);
            return (
              <motion.div
                key={bucket.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={`/products?priceMin=${bucket.min}&priceMax=${bucket.max}`}
                  className="price-bucket"
                >
                  <span className="price-bucket-label">{bucket.label}</span>
                  <span className="price-bucket-count">{count} items</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
