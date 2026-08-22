'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Truck,
  MapPin,
  Clock,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/orders-db';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Order Details / Edit Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingStatus, setShippingStatus] = useState('processing');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error('Error loading admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShippingStatus(order.shipping_status || 'processing');
    setTrackingNumber(order.tracking_number || '');
    setPaymentStatus(order.payment_status || 'pending');
    setUpdateMsg(null);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    setUpdateMsg(null);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          shipping_status: shippingStatus,
          tracking_number: trackingNumber,
          payment_status: paymentStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUpdateMsg({ text: data.error || 'Failed to update order.', isError: true });
      } else {
        setUpdateMsg({ text: 'Order status updated successfully!' });
        setSelectedOrder(data.order);
        setOrders(orders.map((o) => (o.id === data.order.id ? data.order : o)));
      }
    } catch (err: any) {
      setUpdateMsg({ text: err.message || 'Network error.', isError: true });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Customer Orders Management</h1>
          <p className="admin-page-subtitle">
            View all incoming customer orders, manage fulfillment stages, and update tracking numbers.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Statuses</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="admin-loading-box">
          <div className="login-spinner" />
          <p>Loading customer orders...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="admin-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Shipping Status</th>
                  <th>Payment</th>
                  <th>Tracking</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span className="font-mono font-bold text-xs">#{o.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="text-xs">
                        <strong>{o.shipping_address?.recipient_name || 'Customer'}</strong>
                        <div className="text-gray-500">{o.user_email}</div>
                      </div>
                    </td>
                    <td className="text-xs text-gray-500">{formatDate(o.created_at)}</td>
                    <td className="text-xs font-semibold">{o.order_items?.length || 0} items</td>
                    <td>
                      <strong className="text-xs">{formatPrice(Number(o.total_amount))}</strong>
                    </td>
                    <td>
                      <span className={`order-status-pill status-${o.shipping_status?.toLowerCase()}`}>
                        {o.shipping_status}
                      </span>
                    </td>
                    <td>
                      <span className="order-status-pill status-cod">
                        {o.payment_method?.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-gray-500">
                      {o.tracking_number || '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => openOrderDetails(o)}
                        className="admin-action-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Inspect / Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-empty-card">
          <ShoppingBag size={48} className="empty-icon" />
          <h3>No orders found</h3>
          <p>When customers complete checkout, their orders will appear here for fulfillment.</p>
        </div>
      )}

      {/* Order Detail / Update Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="address-modal-backdrop"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="admin-modal-card"
              style={{ maxWidth: '640px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div>
                  <span className="order-meta-label">Order Details</span>
                  <h2 className="admin-modal-title">
                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h2>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="filter-sidebar-close" type="button">
                  <X size={20} />
                </button>
              </div>

              {updateMsg && (
                <div
                  className={`login-alert ${updateMsg.isError ? 'login-alert-error' : 'login-alert-success'}`}
                  style={{ marginBottom: '16px' }}
                >
                  {updateMsg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{updateMsg.text}</span>
                </div>
              )}

              {/* Customer & Shipping Summary */}
              <div className="order-details-grid" style={{ marginBottom: '20px' }}>
                <div className="order-details-box">
                  <h3 className="order-box-title">
                    <MapPin size={15} />
                    Shipping Destination
                  </h3>
                  <p className="order-address-name"><strong>{selectedOrder.shipping_address?.recipient_name}</strong></p>
                  <p className="order-address-line">{selectedOrder.shipping_address?.street}</p>
                  <p className="order-address-line">
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} — {selectedOrder.shipping_address?.postal_code}
                  </p>
                  <p className="order-address-phone">📞 {selectedOrder.shipping_address?.phone}</p>
                </div>

                <div className="order-details-box">
                  <h3 className="order-box-title">
                    <Package size={15} />
                    Order Summary
                  </h3>
                  <div className="order-items-scroll" style={{ maxHeight: '100px' }}>
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id || item.product_title} className="order-item-mini-row">
                        <div>
                          <span className="order-item-mini-title">{item.product_title}</span>
                          <span className="order-item-mini-qty">Qty: {item.quantity} × {formatPrice(Number(item.price))}</span>
                        </div>
                        <span className="order-item-mini-total">{formatPrice(Number(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-box-total-row">
                    <span>Grand Total:</span>
                    <strong>{formatPrice(Number(selectedOrder.total_amount))}</strong>
                  </div>
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleUpdateOrder} className="login-form">
                <div className="checkout-form-row">
                  <div className="login-field">
                    <label>Shipping / Fulfillment Status</label>
                    <select
                      value={shippingStatus}
                      onChange={(e) => setShippingStatus(e.target.value)}
                      className="checkout-input"
                    >
                      <option value="processing">Processing / Packing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="login-field">
                    <label>Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="checkout-input"
                    >
                      <option value="pending">Pending (COD)</option>
                      <option value="paid">Paid / Collected</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div className="login-field">
                  <label>Courier Tracking Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SL-IN-892134 or DTDC123456"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="checkout-input"
                  />
                </div>

                <div className="admin-modal-actions">
                  <button type="button" onClick={() => setSelectedOrder(null)} className="account-btn-secondary">
                    Close
                  </button>
                  <button type="submit" disabled={updating} className="admin-action-btn-primary">
                    {updating ? 'Updating...' : 'Update Order Status'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
