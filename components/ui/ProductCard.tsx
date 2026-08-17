'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/products';
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    openCart();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="product-card"
    >
      <Link href={`/products/${product.slug}`} className="product-card-link" aria-label={`View ${product.name}`}>
        {/* Image / Placeholder */}
        <div className="product-card-image-wrap">
          {product.images.length > 0 ? (
            <img
              src={getAssetPath(product.images[0])}
              alt={product.name}
              className="product-card-image"
              loading="lazy"
            />
          ) : (
            <ProductPlaceholder category={product.category} sku={product.sku} />
          )}

          {/* Quick Add Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="product-card-add-btn"
            aria-label={`Add ${product.name} to cart`}
            type="button"
          >
            <ShoppingBag size={16} />
            <span>Add</span>
          </motion.button>

          {/* Sale Badge */}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="product-card-sale-badge">
              Sale
            </span>
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
