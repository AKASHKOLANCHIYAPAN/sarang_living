'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Share2, ChevronRight, Check, Truck } from 'lucide-react';
import { getProductBySlug, getRelatedProducts } from '@/lib/products';
import { formatPrice, getCategoryGradient } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import ProductPlaceholder from '@/components/ui/ProductPlaceholder';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const product = getProductBySlug(slug);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product, 4);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      openCart();
    }, 800);
  };

  return (
    <div className="pdp-page">
      <div className="container-sarang">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="breadcrumb-link">Home</Link>
          <ChevronRight size={14} />
          <Link href="/products" className="breadcrumb-link">Products</Link>
          <ChevronRight size={14} />
          <Link
            href={`/products?category=${product.category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
            className="breadcrumb-link"
          >
            {product.category}
          </Link>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Product Layout */}
        <div className="pdp-layout">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="pdp-gallery"
          >
            <div className="pdp-main-image">
              {product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="pdp-image"
                />
              ) : (
                <div
                  className="pdp-placeholder"
                  style={{ background: getCategoryGradient(product.category) }}
                >
                  <Heart
                    size={48}
                    strokeWidth={1}
                    className="placeholder-watermark"
                  />
                  <span className="pdp-placeholder-sku">{product.sku}</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip (for future multi-image support) */}
            {product.images.length > 1 && (
              <div className="pdp-thumbnails">
                {product.images.map((img, i) => (
                  <button key={i} className="pdp-thumb" type="button">
                    <img src={img} alt={`${product.name} - view ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="pdp-info"
          >
            {/* Category & SKU */}
            <div className="pdp-meta">
              <span className="pdp-category">{product.category}</span>
              <span className="pdp-sku">{product.sku}</span>
            </div>

            {/* Name */}
            <h1 className="pdp-name">{product.name}</h1>

            {/* Price */}
            <div className="pdp-price-block">
              <span className="pdp-price">{formatPrice(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="pdp-compare-price">{formatPrice(product.compareAtPrice)}</span>
                  <span className="pdp-discount">
                    {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% off
                  </span>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="pdp-divider" />

            {/* Description */}
            <p className="pdp-description">{product.description}</p>

            {/* Stock Status */}
            <div className="pdp-stock">
              {product.stockQuantity > 0 ? (
                <span className="pdp-stock-in">
                  <Check size={14} />
                  In Stock
                  {product.stockQuantity <= 5 && (
                    <span className="pdp-stock-low"> — Only {product.stockQuantity} left!</span>
                  )}
                </span>
              ) : (
                <span className="pdp-stock-out">Out of Stock</span>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="pdp-actions">
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                max={product.stockQuantity}
              />
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className="pdp-add-btn"
              >
                {isAdded ? (
                  <>
                    <Check size={18} />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    Add to Cart — {formatPrice(product.price * quantity)}
                  </>
                )}
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="pdp-secondary-actions">
              <button className="pdp-wishlist-btn" type="button">
                <Heart size={16} />
                Add to Wishlist
              </button>
              <button className="pdp-share-btn" type="button">
                <Share2 size={16} />
                Share
              </button>
            </div>

            {/* Trust Signals */}
            <div className="pdp-trust">
              <div className="pdp-trust-item">
                <Truck size={16} />
                <span>Free shipping above ₹999</span>
              </div>
              <div className="pdp-trust-item">
                <Check size={16} />
                <span>7-day easy returns</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pdp-related section-spacing" aria-labelledby="related-heading">
            <div className="section-header">
              <h2 id="related-heading" className="section-title">
                You May Also Like
              </h2>
              <div className="gold-divider" />
            </div>
            <div className="product-grid">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.sku} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
