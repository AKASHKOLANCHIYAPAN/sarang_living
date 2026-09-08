'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Package,
  MapPin,
  LogOut,
  ShieldCheck,
  Clock,
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Truck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import type { Order, UserAddress, ShippingAddressInput } from '@/lib/orders-db';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, isLoading, checkAuth, logout, resetPassword } =
    useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  const [resetMessage, setResetMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Live Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Live Addresses state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState<ShippingAddressInput>({
    recipient_name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: false,
  });
  const [addressError, setAddressError] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated && !isLoading) {
      router.push('/login?redirect=/account');
    }
  }, [isInitialized, isAuthenticated, isLoading, router]);

  // Fetch orders when tab is clicked
  useEffect(() => {
    if (isAuthenticated && activeTab === 'orders') {
      async function fetchOrders() {
        setLoadingOrders(true);
        try {
          const res = await fetch('/api/orders');
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
          }
        } catch (err) {
          console.error('Failed to load orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      }
      fetchOrders();
    }
  }, [isAuthenticated, activeTab]);

  // Fetch addresses when tab is clicked
  useEffect(() => {
    if (isAuthenticated && (activeTab === 'addresses' || activeTab === 'profile')) {
      async function fetchAddresses() {
        setLoadingAddresses(true);
        try {
          const res = await fetch('/api/addresses');
          const data = await res.json();
          if (data.success && Array.isArray(data.addresses)) {
            setAddresses(data.addresses);
          }
        } catch (err) {
          console.error('Failed to load addresses:', err);
        } finally {
          setLoadingAddresses(false);
        }
      }
      fetchAddresses();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setResetMessage({ text: 'No email address associated with this account.', isError: true });
      return;
    }
    const res = await resetPassword(user.email);
    if (!res.success) {
      setResetMessage({ text: res.error || 'Failed to send password reset email.', isError: true });
    } else {
      setResetMessage({ text: res.message || 'Password reset link sent to your email.' });
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);
    setSavingAddress(true);

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAddressError(data.error || 'Failed to save address.');
      } else {
        setAddresses([data.address, ...addresses]);
        setShowAddAddressModal(false);
        setAddressForm({
          recipient_name: '',
          phone: '',
          street: '',
          city: '',
          state: '',
          postal_code: '',
          is_default: false,
        });
      }
    } catch (err: any) {
      setAddressError(err.message || 'Network error.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAddresses(addresses.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  if (!isInitialized || (isLoading && !user)) {
    return (
      <div className="account-loading-container">
        <div className="login-spinner" />
        <span style={{ marginLeft: '12px' }}>Loading account profile...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Recently';
    return new Date(isoStr).toLocaleDateString('en-IN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isAdmin = user.role?.toLowerCase() === 'admin';

  return (
    <div className="account-page-container container-sarang">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="account-header-card"
      >
        <div className="account-avatar-large">{getInitials(user.name)}</div>
        <div className="account-header-info">
          <span className={`account-badge ${isAdmin ? 'badge-admin' : ''}`}>
            {isAdmin ? '🛡️ ADMINISTRATOR' : 'VALUED MEMBER'}
          </span>
          <h1 className="account-user-name">{user.name}</h1>
          <p className="account-user-email">{user.email || user.phone}</p>
          <div className="account-meta">
            <span className="account-meta-item">
              <Clock size={14} /> Member since {formatDate(user.createdAt)}
            </span>
            <span className="account-meta-item text-green">
              <ShieldCheck size={14} /> Supabase Verified
            </span>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="account-logout-btn">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </motion.div>

      {/* Main Grid */}
      <div className="account-content-grid">
        {/* Navigation Sidebar */}
        <aside className="account-sidebar">
          <nav className="account-nav-list" aria-label="Account navigation">
            <button
              type="button"
              className={`account-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              <span>Profile &amp; Details</span>
              <ChevronRight size={16} className="nav-arrow" />
            </button>

            <button
              type="button"
              className={`account-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} />
              <span>My Orders</span>
              <ChevronRight size={16} className="nav-arrow" />
            </button>

            <button
              type="button"
              className={`account-nav-btn ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <MapPin size={18} />
              <span>Shipping Addresses</span>
              <ChevronRight size={16} className="nav-arrow" />
            </button>

            {isAdmin && (
              <Link
                href="/admin"
                className="account-nav-btn"
                style={{
                  background: 'rgba(196, 136, 138, 0.12)',
                  color: 'var(--color-accent-teal, #5A7E95)',
                  fontWeight: 600,
                  border: '1px solid rgba(196, 136, 138, 0.25)',
                  marginTop: '12px',
                }}
              >
                <ShieldCheck size={18} style={{ color: '#C4888A' }} />
                <span>Admin Dashboard</span>
                <ChevronRight size={16} className="nav-arrow" />
              </Link>
            )}
          </nav>
        </aside>

        {/* Tab Panels */}
        <main className="account-panel">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="account-card-panel">
              <h2 className="panel-title">Personal Profile</h2>
              <p className="panel-subtitle">Manage your account information and preferences.</p>

              <div className="profile-info-grid">
                <div className="info-box">
                  <span className="box-label">Full Name</span>
                  <span className="box-value">{user.name}</span>
                </div>
                <div className="info-box">
                  <span className="box-label">Verified Email / Contact</span>
                  <span className="box-value">{user.email || user.phone}</span>
                </div>
                <div className="info-box">
                  <span className="box-label">Account Role</span>
                  <span className="box-value capitalize">{user.role || 'Customer'}</span>
                </div>
                <div className="info-box">
                  <span className="box-label">Currency Preference</span>
                  <span className="box-value">INR (₹)</span>
                </div>
              </div>

              {isAdmin && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(196, 136, 138, 0.08) 0%, rgba(90, 126, 149, 0.08) 100%)',
                    borderRadius: 'var(--radius-md, 12px)',
                    border: '1px solid rgba(196, 136, 138, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <ShieldCheck size={20} style={{ color: '#C4888A' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Store Administrator Controls</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '14px', lineHeight: 1.4 }}>
                    You have administrator privileges to edit products, update stock quantities, upload images, manage categories, and handle orders.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <Link
                      href="/admin/products"
                      className="btn-sarang btn-sarang-primary"
                      style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}
                    >
                      ✏️ Edit &amp; Manage Products
                    </Link>
                    <Link
                      href="/admin/products/new"
                      className="btn-sarang btn-sarang-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}
                    >
                      ➕ Add New Product
                    </Link>
                    <Link
                      href="/admin/categories"
                      className="btn-sarang btn-sarang-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}
                    >
                      📁 Manage Categories
                    </Link>
                    <Link
                      href="/admin/orders"
                      className="btn-sarang btn-sarang-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}
                    >
                      📦 View Orders
                    </Link>
                  </div>
                </div>
              )}

              <div className="panel-divider" />

              <h3 className="panel-subheading">Password &amp; Account Settings</h3>
              <p className="panel-subtitle">
                Request a password reset link sent to your registered email.
              </p>

              {resetMessage && (
                <div
                  className={`login-alert ${
                    resetMessage.isError ? 'login-alert-error' : 'login-alert-success'
                  }`}
                  style={{ marginBottom: '16px' }}
                >
                  {resetMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{resetMessage.text}</span>
                </div>
              )}

              {user.email ? (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="account-btn-secondary"
                >
                  Request Password Reset Email
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Password management is available for email-registered accounts.
                </p>
              )}
            </motion.div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="account-card-panel">
              <h2 className="panel-title">Order History</h2>
              <p className="panel-subtitle">View and track all your recent Sarang Living purchases.</p>

              {loadingOrders ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#6B7280' }}>
                  <div className="login-spinner" style={{ margin: '0 auto 12px' }} />
                  <p>Fetching your orders from database...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <div>
                          <span className="order-id">ORDER #{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className="order-date">{formatDate(order.created_at)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className={`order-status-pill status-${order.shipping_status.toLowerCase()}`}>
                            {order.shipping_status}
                          </span>
                          <span className="order-status-pill status-cod">
                            {order.payment_method?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="order-items">
                        {order.order_items?.map((item) => (
                          <div key={item.id || item.product_title} className="order-item-row">
                            <div className="order-item-info">
                              <span className="order-item-title">{item.product_title}</span>
                              <span className="order-item-qty">Qty: {item.quantity}</span>
                            </div>
                            <span className="order-item-price">{formatPrice(Number(item.price))}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-footer">
                        <div className="order-delivery-snippet">
                          <Truck size={14} />
                          <span>Delivery to: {order.shipping_address?.city}, {order.shipping_address?.state}</span>
                        </div>
                        <div className="order-total-block">
                          <span>Total Amount</span>
                          <span className="order-total-price">{formatPrice(Number(order.total_amount))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <ShoppingBag size={48} className="empty-icon" />
                  <h3>No orders yet</h3>
                  <p>Discover something you love from our authentic Korean hair accessories.</p>
                  <Link href="/products" className="account-btn-primary">
                    Explore Products
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="account-card-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h2 className="panel-title">Saved Shipping Addresses</h2>
                  <p className="panel-subtitle">Manage delivery locations for faster checkout.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(true)}
                  className="account-btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                >
                  <Plus size={16} />
                  Add Address
                </button>
              </div>

              {loadingAddresses ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#6B7280' }}>
                  <div className="login-spinner" style={{ margin: '0 auto 12px' }} />
                  <p>Loading addresses...</p>
                </div>
              ) : addresses.length > 0 ? (
                <div className="addresses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '20px' }}>
                  {addresses.map((addr) => (
                    <div key={addr.id} className="address-card-box">
                      <div className="address-card-top">
                        <strong>{addr.recipient_name}</strong>
                        {addr.is_default && <span className="address-default-pill">Default</span>}
                      </div>
                      <p className="address-card-street">{addr.street}</p>
                      <p className="address-card-city">
                        {addr.city}, {addr.state} — {addr.postal_code}
                      </p>
                      <p className="address-card-phone">📞 {addr.phone}</p>
                      <div className="address-card-actions">
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="address-delete-btn"
                          aria-label="Delete address"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <MapPin size={48} className="empty-icon" />
                  <h3>No addresses saved</h3>
                  <p>Add a shipping address to speed up your future purchases.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddAddressModal(true)}
                    className="account-btn-primary"
                  >
                    Add New Address
                  </button>
                </div>
              )}

              {/* Add Address Modal / Form */}
              <AnimatePresence>
                {showAddAddressModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="address-modal-backdrop"
                    onClick={() => setShowAddAddressModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 20 }}
                      className="address-modal-card"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="panel-subheading" style={{ marginBottom: '16px' }}>Add Shipping Address</h3>

                      {addressError && (
                        <div className="login-alert login-alert-error" style={{ marginBottom: '16px' }}>
                          <AlertCircle size={16} />
                          <span>{addressError}</span>
                        </div>
                      )}

                      <form onSubmit={handleAddAddress} className="login-form">
                        <div className="login-field">
                          <label>Recipient Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Full name"
                            value={addressForm.recipient_name}
                            onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                            className="checkout-input"
                          />
                        </div>

                        <div className="login-field">
                          <label>Phone Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="10-digit phone number"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            className="checkout-input"
                          />
                        </div>

                        <div className="login-field">
                          <label>Street Address *</label>
                          <input
                            type="text"
                            required
                            placeholder="Door / Flat / Street"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                            className="checkout-input"
                          />
                        </div>

                        <div className="checkout-form-row-3">
                          <div className="login-field">
                            <label>City *</label>
                            <input
                              type="text"
                              required
                              placeholder="City"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              className="checkout-input"
                            />
                          </div>
                          <div className="login-field">
                            <label>State *</label>
                            <input
                              type="text"
                              required
                              placeholder="State"
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                              className="checkout-input"
                            />
                          </div>
                          <div className="login-field">
                            <label>PIN Code *</label>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              placeholder="600001"
                              value={addressForm.postal_code}
                              onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                              className="checkout-input"
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                          <button
                            type="button"
                            onClick={() => setShowAddAddressModal(false)}
                            className="account-btn-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingAddress}
                            className="account-btn-primary"
                          >
                            {savingAddress ? 'Saving...' : 'Save Address'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
