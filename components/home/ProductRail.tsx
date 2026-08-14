'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/lib/products';
import ProductCard from '@/components/ui/ProductCard';

interface ProductRailProps {
  title: string;
  subtitle: string;
  products: Product[];
  viewAllHref: string;
  id: string;
}

export default function ProductRail({ title, subtitle, products, viewAllHref, id }: ProductRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="section-spacing" aria-labelledby={`${id}-heading`}>
      <div className="container-sarang">
        {/* Section Header */}
        <div className="rail-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <h2 id={`${id}-heading`} className="section-title">
              {title}
            </h2>
            <div className="gold-divider" />
            <p className="section-subtitle">{subtitle}</p>
          </motion.div>

          {/* Scroll Controls (desktop) */}
          <div className="rail-controls">
            <button
              onClick={() => scroll('left')}
              className="rail-control-btn"
              aria-label="Scroll left"
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="rail-control-btn"
              aria-label="Scroll right"
              type="button"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Product Rail */}
        <div ref={scrollRef} className="product-rail no-scrollbar">
          {products.map((product, index) => (
            <div key={product.sku} className="product-rail-item">
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="section-view-all"
        >
          <Link href={viewAllHref} className="view-all-link">
            View all
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
