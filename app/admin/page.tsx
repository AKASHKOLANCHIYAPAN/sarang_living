'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  FolderTree,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight,
  Truck,
  DollarSign,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setLowStock(data.lowStockProducts || []);
          setRecentOrders(data.recentOrders || []);
        }
      } catch (err) {
        console.error('Error loading admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-box">
        <div className="login-spinner" />
        <p>Loading store statistics...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Store Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome to Sarang Living store manager. Track catalog and order operations.
          </p>
        </div>

        <div className="admin-quick-actions">
          <Link href="/admin/products" className="admin-action-btn-primary">
            <Plus size={16} />
            <span>Manage Products</span>
          </Link>
          <Link href="/admin/categories" className="admin-action-btn-secondary">
            <FolderTree size={16} />
            <span>Categories</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="admin-kpi-grid">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="admin-kpi-card">
          <div className="admin-kpi-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Package size={22} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Total Products</span>
            <strong className="admin-kpi-value">{stats?.totalProducts || 0}</strong>
            <span className="admin-kpi-subtext">{stats?.activeProducts || 0} active in storefront</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="admin-kpi-card">
          <div className="admin-kpi-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <FolderTree size={22} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Live Categories</span>
            <strong className="admin-kpi-value">{stats?.categoriesCount || 0}</strong>
            <span className="admin-kpi-subtext">All synced to navigation</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="admin-kpi-card">
          <div className="admin-kpi-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Customer Orders</span>
            <strong className="admin-kpi-value">{stats?.totalOrders || 0}</strong>
            <span className="admin-kpi-subtext">{stats?.pendingOrders || 0} pending processing</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="admin-kpi-card">
          <div className="admin-kpi-icon-wrap" style={{ background: '#FDF2F8', color: '#DB2777' }}>
            <TrendingUp size={22} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Recorded Sales Total</span>
            <strong className="admin-kpi-value">{formatPrice(stats?.totalRevenue || 0)}</strong>
            <span className="admin-kpi-subtext">From verified orders</span>
          </div>
        </motion.div>
      </div>

      {/* Grid: Low Stock Alert & Recent Orders */}
      <div className="admin-split-grid">
        {/* Low Stock Alerts */}
        <div className="admin-panel-card">
          <div className="admin-panel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="admin-panel-card-title">Low Stock Alert (&lt; 10 units)</h2>
            </div>
            <Link href="/admin/products" className="admin-card-link">
              View All Products
              <ArrowRight size={14} />
            </Link>
          </div>

          {lowStock.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono font-bold text-xs">{p.sku}</td>
                      <td>{p.name}</td>
                      <td>{formatPrice(p.price)}</td>
                      <td>
                        <span className="stock-badge-low">{p.stock_quantity} left</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty-text">All products have healthy inventory levels (10+ units).</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="admin-panel-card">
          <div className="admin-panel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} className="text-blue-500" />
              <h2 className="admin-panel-card-title">Recent Customer Orders</h2>
            </div>
            <Link href="/admin/orders" className="admin-card-link">
              All Orders
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="font-mono font-bold text-xs">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="text-xs text-gray-600">{o.user_email}</td>
                      <td className="font-semibold text-xs">{formatPrice(Number(o.total_amount))}</td>
                      <td>
                        <span className={`order-status-pill status-${o.shipping_status?.toLowerCase()}`}>
                          {o.shipping_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty-text">No orders recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
