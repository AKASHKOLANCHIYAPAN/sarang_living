'use client';

import { X, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getAssetPath } from '@/lib/utils';
import QuantitySelector from '@/components/ui/QuantitySelector';
import ProductPlaceholder from '@/components/ui/ProductPlaceholder';
import Button from '@/components/ui/Button';

const FREE_SHIPPING_THRESHOLD = 999;

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } =
    useCartStore();

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal();
  const hasFreeShipping = subtotal() >= FREE_SHIPPING_THRESHOLD;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="drawer-backdrop"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="cart-drawer"
            role="dialog"
            aria-label="Shopping cart"
            aria-modal="true"
          >
            {/* Header */}
            <div className="cart-drawer-header">
              <h2 className="cart-drawer-title">
                <ShoppingBag size={20} />
                Your Cart ({totalItems()})
              </h2>
              <button onClick={closeCart} className="cart-drawer-close" aria-label="Close cart" type="button">
                <X size={20} />
              </button>
            </div>

            {/* Free Shipping Progress */}
            {items.length > 0 && (
              <div className="cart-shipping-bar">
                {hasFreeShipping ? (
                  <p className="cart-shipping-text cart-shipping-success">
                    🎉 You&apos;ve unlocked free shipping!
                  </p>
                ) : (
                  <p className="cart-shipping-text">
                    Add <strong>{formatPrice(remaining)}</strong> more for free shipping
                  </p>
                )}
                <div className="cart-shipping-progress">
                  <motion.div
                    className="cart-shipping-progress-fill"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((subtotal() / FREE_SHIPPING_THRESHOLD) * 100, 100)}%`,
                    }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="cart-drawer-items">
              {items.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingBag size={48} strokeWidth={1} className="cart-empty-icon" />
                  <p className="cart-empty-title">Your cart is empty</p>
                  <p className="cart-empty-text">
                    Discover something you love from our collection
                  </p>
                  <Button variant="primary" onClick={closeCart}>
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.product.sku}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3 }}
                      className="cart-item"
                    >
                      <div className="cart-item-image">
                        {item.product.images.length > 0 ? (
                          <img
                            src={getAssetPath(item.product.images[0])}
                            alt={item.product.name}
                            className="cart-item-img"
                          />
                        ) : (
                          <ProductPlaceholder
                            category={item.product.category}
                            sku={item.product.sku}
                            className="cart-item-placeholder"
                          />
                        )}
                      </div>

                      <div className="cart-item-details">
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="cart-item-name"
                          onClick={closeCart}
                        >
                          {item.product.name}
                        </Link>
                        <span className="cart-item-price">
                          {formatPrice(item.product.price)}
                        </span>

                        <div className="cart-item-actions">
                          <QuantitySelector
                            quantity={item.quantity}
                            onChange={(q) => updateQuantity(item.product.sku, q)}
                            max={item.product.stockQuantity}
                            size="sm"
                          />
                          <button
                            onClick={() => removeItem(item.product.sku)}
                            className="cart-item-remove"
                            aria-label={`Remove ${item.product.name}`}
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <span className="cart-item-total">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-subtotal">
                  <span>Subtotal</span>
                  <span className="cart-subtotal-amount">{formatPrice(subtotal())}</span>
                </div>
                <p className="cart-tax-note">Shipping & taxes calculated at checkout</p>
                <Button variant="primary" fullWidth className="cart-checkout-btn">
                  Proceed to Checkout
                </Button>
                <button onClick={closeCart} className="cart-continue-btn" type="button">
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
