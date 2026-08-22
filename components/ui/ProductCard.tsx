'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/products-db';
import { formatPrice, getAssetPath } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import ProductPlaceholder from './ProductPlaceholder';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQuantity === 0) return;
    addItem(product, 1);
    openCart();
  };

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const hasSecondaryImage = product.images.length > 1;
  const primaryImage = product.images[0] ? getAssetPath(product.images[0]) : '';
  const secondaryImage = hasSecondaryImage ? getAssetPath(product.images[1]) : primaryImage;

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className={`product-card ${product.stockQuantity === 0 ? 'product-card-out-of-stock' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="product-card-link" aria-label={`View ${product.name}`}>
        {/* Image Wrap */}
        <div className="product-card-image-wrap">
          {product.images.length > 0 ? (
            <>
              <img
                src={isHovered && hasSecondaryImage ? secondaryImage : primaryImage}
                alt={product.name}
                className={`product-card-image ${isHovered ? 'product-card-image-zoomed' : ''}`}
                loading="lazy"
              />
            </>
          ) : (
            <ProductPlaceholder category={product.category} sku={product.sku} />
          )}

          {/* Badges: Sale Discount or Stock status */}
          <div className="product-card-badges-container">
            {discountPercent && discountPercent > 0 ? (
              <span className="product-card-sale-badge">
                {discountPercent}% OFF
              </span>
            ) : null}

            {product.stockQuantity === 0 ? (
              <span className="product-card-stock-badge-out">
                Out of Stock
              </span>
            ) : product.stockQuantity < 5 ? (
              <span className="product-card-stock-badge-low">
                Only {product.stockQuantity} Left
              </span>
            ) : null}
          </div>

          {/* Star Rating Badge */}
          <div className="product-card-rating-badge">
            <span className="star-icon">★</span>
            <span>4.9</span>
          </div>

          {/* Quick Add Button */}
          {product.stockQuantity > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              className="product-card-add-btn"
              aria-label={`Add ${product.name} to cart`}
              type="button"
            >
              <ShoppingBag size={14} />
              <span>+ Add</span>
            </motion.button>
          )}
        </div>

        {/* Product Info */}
        <div className="product-card-info">
          <span className="product-card-category">{product.category}</span>
          <h3 className="product-card-name">{product.name}</h3>
          <div className="product-card-price">
            <span className="product-card-current-price">{formatPrice(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="product-card-compare-price">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
