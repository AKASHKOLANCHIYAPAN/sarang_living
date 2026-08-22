'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { formatPrice, getAssetPath } from '@/lib/utils';
import type { Order } from '@/lib/orders-db';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      async function loadOrder() {
        try {
          const res = await fetch('/api/orders');
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            const found = data.orders.find((o: Order) => o.id === orderId);
            if (found) setOrder(found);
          }
        } catch (err) {
          console.error('Error fetching order details:', err);
        } finally {
          setLoading(false);
        }
      }
      loadOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="account-loading-container">
        <div className="login-spinner" />
        <span style={{ marginLeft: '12px' }}>Loading order confirmation...</span>
      </div>
    );
  }

  return (
    <div className="order-success-page container-sarang">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="order-success-card"
      >
        {/* Top Icon Badge */}
        <div className="order-success-icon-wrap">
          <CheckCircle2 size={56} className="order-success-check" />
        </div>

        <span className="order-success-badge">ORDER CONFIRMED</span>
        <h1 className="order-success-title">Thank you for your order!</h1>
        <p className="order-success-subtitle">
          Your order has been successfully placed in our system and is now being prepared with love.
        </p>

        {/* Order Meta Bar */}
        <div className="order-meta-bar">
          <div className="order-meta-item">
            <span className="order-meta-label">Order Number</span>
            <span className="order-meta-value code">{orderId ? orderId.slice(0, 8).toUpperCase() : 'PENDING'}</span>
          </div>
          <div className="order-meta-item">
            <span className="order-meta-label">Payment Status</span>
            <span className="order-meta-value capitalize">{order?.payment_status || 'Pending (COD)'}</span>
          </div>
          <div className="order-meta-item">
            <span className="order-meta-label">Tracking Number</span>
            <span className="order-meta-value code">{order?.tracking_number || 'SL-IN-PROCESSED'}</span>
          </div>
        </div>

        {/* Order Details Grid */}
        {order && (
          <div className="order-details-grid">
            {/* Delivery Address */}
            <div className="order-details-box">
              <h3 className="order-box-title">
                <MapPin size={16} />
                Shipping Details
              </h3>
              <p className="order-address-name"><strong>{order.shipping_address?.recipient_name}</strong></p>
              <p className="order-address-line">{order.shipping_address?.street}</p>
              <p className="order-address-line">
                {order.shipping_address?.city}, {order.shipping_address?.state} — {order.shipping_address?.postal_code}
              </p>
              <p className="order-address-phone">📞 {order.shipping_address?.phone}</p>
            </div>

            {/* Purchased Items */}
            <div className="order-details-box">
              <h3 className="order-box-title">
                <Package size={16} />
                Order Items ({order.order_items?.length || 0})
              </h3>
              <div className="order-items-scroll">
                {order.order_items?.map((item) => (
                  <div key={item.id || item.product_title} className="order-item-mini-row">
                    <div>
                      <span className="order-item-mini-title">{item.product_title}</span>
                      <span className="order-item-mini-qty">Qty: {item.quantity} × {formatPrice(Number(item.price))}</span>
                    </div>
                    <span className="order-item-mini-total">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="order-box-total-row">
                <span>Total Amount:</span>
                <strong>{formatPrice(Number(order.total_amount))}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="order-success-actions">
          <Link href="/account" className="account-btn-primary">
            View in Order History
            <ArrowRight size={16} />
          </Link>
          <Link href="/products" className="account-btn-secondary">
            <ShoppingBag size={16} />
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="account-loading-container">
          <div className="login-spinner" />
          <span style={{ marginLeft: '12px' }}>Loading...</span>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
