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
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatPrice, getAssetPath } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentProds, setRecentProds] = useState<any[]>([]);
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
          setRecentProds(data.recentlyAddedProducts || []);
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
      <div className="admin-page">
        <div className="admin-loading-box">
          <div className="login-spinner" />
          <p>Loading store metrics &amp; inventory summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Store Operations Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome to the Sarang Living store manager. Real-time overview of catalog, inventory, and order fulfillment.
          </p>
        </div>

        <div className="admin-quick-actions">
          <Link href="/admin/products/new" className="admin-action-btn-primary">
            <Plus size={16} />
            <span>Add New Product</span>
          </Link>
          <Link href="/admin/categories" className="admin-action-btn-secondary">
            <FolderTree size={16} />
            <span>Manage Categories</span>
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
            <span className="admin-kpi-label">Catalog Products</span>
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
            <span className="admin-kpi-subtext">Synced across navigation</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="admin-kpi-card">
          <div className="admin-kpi-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Customer Orders</span>
            <strong className="admin-kpi-value">{stats?.totalOrders || 0}</strong>
            <span className="admin-kpi-subtext">{stats?.pendingOrders || 0} pending fulfillment</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="admin-kpi-card">
          <div className="admin-kpi-icon-wrap" style={{ background: '#FDF2F8', color: '#DB2777' }}>
            <TrendingUp size={22} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Verified Sales Total</span>
            <strong className="admin-kpi-value">{formatPrice(stats?.totalRevenue || 0)}</strong>
            <span className="admin-kpi-subtext">From processed orders</span>
          </div>
        </motion.div>
      </div>

      {/* Stock Health Overview Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(44,47,54,0.06)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>In-Stock Items</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              {(stats?.totalProducts || 0) - (stats?.outOfStockCount || 0) - (stats?.lowStockCount || 0)} products
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid rgba(44,47,54,0.06)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Low Stock (&lt; 10 units)</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#D97706' }}>
              {stats?.lowStockCount || 0} products
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid rgba(44,47,54,0.06)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={18} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Out of Stock (0 units)</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626' }}>
              {stats?.outOfStockCount || 0} products
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Alert & Recent Orders */}
      <div className="admin-split-grid">
        {/* Inventory Stock Alerts */}
        <div className="admin-panel-card">
          <div className="admin-panel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="admin-panel-card-title">Inventory Attention List</h2>
            </div>
            <Link href="/admin/products" className="admin-card-link">
              All Products
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono font-bold text-xs">{p.sku}</td>
                      <td className="font-semibold text-xs">{p.name}</td>
                      <td className="text-xs">{formatPrice(p.price)}</td>
                      <td>
                        {p.stock_quantity === 0 ? (
                          <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#DC2626', background: '#FEE2E2', borderRadius: '9999px' }}>
                            Out of Stock
                          </span>
                        ) : (
                          <span className="stock-badge-low">{p.stock_quantity} left</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="admin-action-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty-text">All products have healthy inventory levels (&ge; 10 units).</p>
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
                      <td className="text-xs text-gray-600 truncate max-w-[140px]">{o.user_email}</td>
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
            <p className="admin-empty-text">No customer orders recorded yet.</p>
          )}
        </div>
      </div>

      {/* Recently Added Products Strip */}
      {recentProds.length > 0 && (
        <div className="admin-panel-card">
          <div className="admin-panel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: '#7B8FA1' }} />
              <h2 className="admin-panel-card-title">Recently Added to Catalog</h2>
            </div>
            <Link href="/admin/products/new" className="admin-card-link">
              + Add Another
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentProds.map((p) => {
                  const firstImg = Array.isArray(p.images) && p.images[0] ? p.images[0] : (typeof p.images === 'string' && p.images ? p.images : '/products/SL001.png');
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-prod-cell">
                          <img
                            src={getAssetPath(firstImg)}
                            alt={p.name}
                            className="admin-prod-thumb"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/products/SL001.png';
                            }}
                          />
                          <div>
                            <strong className="admin-prod-name">{p.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono font-bold text-xs">{p.sku}</span>
                      </td>
                      <td>
                        <span className="admin-cat-pill">{p.categories?.name || 'General'}</span>
                      </td>
                      <td>
                        <strong className="text-xs">{formatPrice(p.price)}</strong>
                      </td>
                      <td>
                        <span className="stock-number">{p.stock_quantity}</span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="admin-action-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
