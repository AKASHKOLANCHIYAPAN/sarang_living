'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Package,
  MapPin,
  LogOut,
  ShieldCheck,
  Clock,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, isLoading, checkAuth, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('profile');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated && !isLoading) {
      router.push('/login?redirect=/account');
    }
  }, [isInitialized, isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!isInitialized || (isLoading && !user)) {
    return (
      <div className="account-loading-container">
        <div className="account-spinner">Loading account profile...</div>
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
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="account-page-container container-sarang">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="account-header-card"
      >
        <div className="account-avatar-large">
          {getInitials(user.name)}
        </div>
        <div className="account-header-info">
          <span className="account-badge">VALUED MEMBER</span>
          <h1 className="account-user-name">{user.name}</h1>
          <p className="account-user-email">{user.email}</p>
          <div className="account-meta">
            <span className="account-meta-item">
              <Clock size={14} /> Member since {formatDate(user.createdAt)}
            </span>
            <span className="account-meta-item text-green">
              <ShieldCheck size={14} /> Account Verified
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="account-logout-btn"
        >
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
              <span>Profile & Security</span>
              <ChevronRight size={16} className="nav-arrow" />
            </button>

            <button
              type="button"
              className={`account-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} />
              <span>Orders ({user.orders?.length || 0})</span>
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
          </nav>
        </aside>

        {/* Tab Panels */}
        <main className="account-panel">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="account-card-panel"
            >
              <h2 className="panel-title">Personal Profile</h2>
              <p className="panel-subtitle">Manage your account information and preferences.</p>

              <div className="profile-info-grid">
                <div className="info-box">
                  <span className="box-label">Full Name</span>
                  <span className="box-value">{user.name}</span>
                </div>
                <div className="info-box">
                  <span className="box-label">Email Address</span>
                  <span className="box-value">{user.email}</span>
                </div>
                <div className="info-box">
                  <span className="box-label">Account Identifier</span>
                  <span className="box-value code font-mono">{user.id}</span>
                </div>
                <div className="info-box">
                  <span className="box-label">Currency Preference</span>
                  <span className="box-value">USD ($)</span>
                </div>
              </div>

              <div className="panel-divider" />

              <h3 className="panel-subheading">Security & Password</h3>
              <p className="panel-subtitle">Update your password or enable additional authentication security.</p>
              
              <button
                type="button"
                onClick={() => alert('Password reset instructions sent to your email.')}
                className="account-btn-secondary"
              >
                Change Account Password
              </button>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="account-card-panel"
            >
              <h2 className="panel-title">Order History</h2>
              <p className="panel-subtitle">View and track all your recent Sarang Living orders.</p>

              {user.orders && user.orders.length > 0 ? (
                <div className="orders-list">
                  {user.orders.map((order) => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <div>
                          <span className="order-id">{order.id}</span>
                          <span className="order-date">{formatDate(order.date)}</span>
                        </div>
                        <span className={`order-status-pill status-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="order-items">
                        {order.items.map((item) => (
                          <div key={item.id} className="order-item-row">
                            <div className="order-item-info">
                              <span className="order-item-title">{item.title}</span>
                              <span className="order-item-qty">Qty: {item.quantity}</span>
                            </div>
                            <span className="order-item-price">${item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-footer">
                        <span>Total Amount</span>
                        <span className="order-total-price">${order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <ShoppingBag size={48} className="empty-icon" />
                  <h3>No orders yet</h3>
                  <p>You haven't placed any orders with Sarang Living yet.</p>
                  <Link href="/products" className="account-btn-primary">
                    Start Shopping
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'addresses' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="account-card-panel"
            >
              <h2 className="panel-title">Saved Shipping Addresses</h2>
              <p className="panel-subtitle">Manage delivery locations for faster checkout.</p>

              <div className="empty-state">
                <MapPin size={48} className="empty-icon" />
                <h3>No addresses saved</h3>
                <p>Add a shipping address to speed up your future purchases.</p>
                <button
                  type="button"
                  onClick={() => alert('Add Address feature: Add your default address during checkout.')}
                  className="account-btn-primary"
                >
                  Add New Address
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
