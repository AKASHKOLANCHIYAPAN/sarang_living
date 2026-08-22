'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Share2, ChevronRight, Check, Truck } from 'lucide-react';
import { getProductBySlug, getRelatedProducts, Product } from '@/lib/products-db';
import { formatPrice, getCategoryGradient, getAssetPath } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';

interface ProductDetailClientProps {
  slug: string;
}

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      try {
        const prod = await getProductBySlug(slug);
        if (!prod || !prod.isActive) {
          setIsNotFound(true);
          return;
        }
        setProduct(prod);

        const related = await getRelatedProducts(prod, 4);
        setRelatedProducts(related);
      } catch (err) {
        console.error('Error fetching product detail:', err);
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (isNotFound) {
    notFound();
  }

  if (isLoading || !product) {
    return (
      <div className="pdp-page">
        <div className="container-sarang">
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#6B7280' }}>
            <div className="login-spinner" style={{ margin: '0 auto 16px' }} />
            <p>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      openCart();
    }, 800);
  };

  const categorySlug = product.category
    .toLowerCase()
    .replace(/ & /g, '-')
    .replace(/ /g, '-');

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
            href={`/products?category=${categorySlug}`}
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
                  src={getAssetPath(product.images[0])}
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

            {/* Thumbnail strip (for multi-image support) */}
            {product.images.length > 1 && (
              <div className="pdp-thumbnails">
                {product.images.map((img, i) => (
                  <button key={i} className="pdp-thumb" type="button">
                    <img src={getAssetPath(img)} alt={`${product.name} - view ${i + 1}`} />
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
            <div className="pdp-meta-top">
              <span className="pdp-category">{product.category}</span>
              <span className="pdp-sku">SKU: {product.sku}</span>
            </div>

            {/* Title */}
            <h1 className="pdp-title">{product.name}</h1>

            {/* Price */}
            <div className="pdp-price-wrap">
              <span className="pdp-price">{formatPrice(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="pdp-compare-price">{formatPrice(product.compareAtPrice)}</span>
              )}
            </div>

            {/* Description */}
            <p className="pdp-description">{product.description}</p>

            <div className="gold-divider" style={{ margin: 'var(--space-6) 0' }} />

            {/* Quantity & Add to Cart */}
            <div className="pdp-actions">
              <div className="pdp-qty-wrap">
                <span className="pdp-qty-label">Quantity</span>
                <QuantitySelector
                  quantity={quantity}
                  onChange={setQuantity}
                  max={product.stockQuantity}
                />
              </div>

              <div className="pdp-buttons">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAddToCart}
                  className="pdp-add-btn"
                >
                  {isAdded ? (
                    <>
                      <Check size={18} />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      Add to Cart — {formatPrice(product.price * quantity)}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Shipping & Returns info */}
            <div className="pdp-perks">
              <div className="pdp-perk">
                <Truck size={18} className="pdp-perk-icon" />
                <div>
                  <strong>Pan-India Shipping</strong>
                  <span>Free shipping on orders above ₹499</span>
                </div>
              </div>
              <div className="pdp-perk">
                <Heart size={18} className="pdp-perk-icon" />
                <div>
                  <strong>Quality Guaranteed</strong>
                  <span>Handcrafted with premium materials</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pdp-related section-spacing">
            <div className="section-header">
              <h2 className="section-title">You May Also Love</h2>
              <div className="gold-divider" />
              <p className="section-subtitle">More from {product.category}</p>
            </div>

            <div className="product-grid">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.sku} product={p} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
