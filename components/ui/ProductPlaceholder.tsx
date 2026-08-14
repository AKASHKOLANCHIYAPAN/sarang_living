'use client';

import { Heart } from 'lucide-react';
import { getCategoryGradient } from '@/lib/utils';

interface ProductPlaceholderProps {
  category: string;
  sku: string;
  className?: string;
}

/**
 * On-brand placeholder for product images.
 * Renders a soft ivory-to-blush gradient block with a heart watermark
 * and the SKU code for identification during development.
 */
export default function ProductPlaceholder({ category, sku, className = '' }: ProductPlaceholderProps) {
  return (
    <div
      className={`product-placeholder ${className}`}
      style={{ background: getCategoryGradient(category) }}
      aria-hidden="true"
    >
      <Heart
        size={32}
        strokeWidth={1}
        className="placeholder-watermark"
      />
      <span className="placeholder-sku">{sku}</span>
    </div>
  );
}
