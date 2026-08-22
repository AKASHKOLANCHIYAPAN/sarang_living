'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Download,
  UploadCloud,
} from 'lucide-react';
import { formatPrice, getAssetPath } from '@/lib/utils';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Add/Edit Modal
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    slug: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    stock_quantity: '20',
    description: '',
    images: '/products/SL001.png',
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        fetch(`/api/admin/products?search=${encodeURIComponent(search)}&categoryId=${selectedCat}&status=${selectedStatus}`),
        fetch('/api/admin/categories'),
      ]);

      const prodsData = await prodsRes.json();
      const catsData = await catsRes.json();

      if (prodsData.success) setProducts(prodsData.products);
      if (catsData.success) {
        setCategories(catsData.categories);
        if (!formData.category_id && catsData.categories.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: catsData.categories[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCat, selectedStatus]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormError(null);
    setFormData({
      sku: `SL0${products.length + 1}`,
      name: '',
      slug: '',
      price: '',
      compare_at_price: '',
      category_id: categories[0]?.id || '',
      stock_quantity: '20',
      description: '',
      images: '/products/SL001.png',
      is_active: true,
    });
  };

  const openEditModal = (prod: any) => {
    setModalMode('edit');
    setEditingId(prod.id);
    setFormError(null);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      slug: prod.slug,
      price: String(prod.price),
      compare_at_price: prod.compare_at_price ? String(prod.compare_at_price) : '',
      category_id: prod.category_id,
      stock_quantity: String(prod.stock_quantity),
      description: prod.description || '',
      images: Array.isArray(prod.images) ? prod.images.join(', ') : prod.images || '/products/SL001.png',
      is_active: prod.is_active,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const payload: any = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        price: Number(formData.price),
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
        category_id: formData.category_id,
        stock_quantity: Number(formData.stock_quantity),
        description: formData.description.trim(),
        images: formData.images.split(',').map((img) => img.trim()).filter(Boolean),
        is_active: formData.is_active,
      };

      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        payload.id = editingId;
        res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to save product.');
      } else {
        setModalMode(null);
        await loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActiveStatus = async (prod: any) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prod.id, is_active: !prod.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map((p) => (p.id === prod.id ? { ...p, is_active: !prod.is_active } : p)));
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
    }
  };

  const updateQuickStock = async (prod: any, delta: number) => {
    const newQty = Math.max(0, prod.stock_quantity + delta);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prod.id, stock_quantity: newQty }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map((p) => (p.id === prod.id ? { ...p, stock_quantity: newQty } : p)));
      }
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate and archive this product?')) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map((p) => (p.id === id ? { ...p, is_active: false } : p)));
      }
    } catch (err) {
      console.error('Error archiving product:', err);
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products &amp; Inventory</h1>
          <p className="admin-page-subtitle">
            Manage your store catalog, pricing, inventory stock, and visibility.
          </p>
        </div>

        <div className="admin-quick-actions">
          <a
            href="/api/admin/products/export"
            download
            className="admin-action-btn-secondary"
            title="Download full catalog as CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </a>

          <Link href="/admin/products/import" className="admin-action-btn-secondary">
            <UploadCloud size={15} />
            <span>Bulk Import CSV</span>
          </Link>

          <button onClick={openCreateModal} className="admin-action-btn-primary" type="button">
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-input-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            type="search"
            placeholder="Search by SKU or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="admin-select"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Visibility</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive / Archived</option>
        </select>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="admin-loading-box">
          <div className="login-spinner" />
          <p>Loading catalog products...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="admin-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Inventory</th>
                  <th>Storefront Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={!p.is_active ? 'row-inactive' : ''}>
                    {/* Image & Title */}
                    <td>
                      <div className="admin-prod-cell">
                        <img
                          src={getAssetPath(Array.isArray(p.images) && p.images[0] ? p.images[0] : '/products/SL001.png')}
                          alt={p.name}
                          className="admin-prod-thumb"
                        />
                        <div>
                          <strong className="admin-prod-name">{p.name}</strong>
                          <span className="admin-prod-slug">{p.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td>
                      <span className="font-mono font-bold text-xs">{p.sku}</span>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="admin-cat-pill">{p.categories?.name || 'General'}</span>
                    </td>

                    {/* Price */}
                    <td>
                      <strong className="text-xs">{formatPrice(p.price)}</strong>
                      {p.compare_at_price && p.compare_at_price > p.price && (
                        <span className="admin-compare-price">{formatPrice(p.compare_at_price)}</span>
                      )}
                    </td>

                    {/* Stock with quick buttons */}
                    <td>
                      <div className="admin-stock-control">
                        <button
                          type="button"
                          onClick={() => updateQuickStock(p, -1)}
                          className="stock-step-btn"
                          title="Decrease stock"
                        >
                          -
                        </button>
                        <span className={`stock-number ${p.stock_quantity < 10 ? 'stock-low' : ''}`}>
                          {p.stock_quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuickStock(p, 1)}
                          className="stock-step-btn"
                          title="Increase stock"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Active toggle */}
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleActiveStatus(p)}
                        className={`admin-status-toggle ${p.is_active ? 'active' : 'inactive'}`}
                      >
                        {p.is_active ? (
                          <>
                            <Eye size={12} />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="admin-actions-cell">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="admin-icon-btn"
                          title="Edit product"
                        >
                          <Edit2 size={15} />
                        </button>
                        {p.is_active && (
                          <button
                            type="button"
                            onClick={() => handleArchiveProduct(p.id)}
                            className="admin-icon-btn text-red-500"
                            title="Deactivate / Archive product"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-empty-card">
          <Package size={48} className="empty-icon" />
          <h3>No products match your filters</h3>
          <p>Try adjusting your search query or add a new product to your catalog.</p>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {modalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="address-modal-backdrop"
            onClick={() => setModalMode(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="admin-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">
                  {modalMode === 'create' ? 'Add New Product' : 'Edit Product'}
                </h2>
                <button onClick={() => setModalMode(null)} className="filter-sidebar-close" type="button">
                  <X size={20} />
                </button>
              </div>

              {formError && (
                <div className="login-alert login-alert-error" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="admin-product-form">
                <div className="checkout-form-row">
                  <div className="login-field">
                    <label>SKU Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SL080"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="checkout-input"
                      disabled={modalMode === 'edit'}
                    />
                  </div>

                  <div className="login-field">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Velvet Pearl Hair Bow"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="checkout-input"
                    />
                  </div>
                </div>

                <div className="checkout-form-row">
                  <div className="login-field">
                    <label>Category *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="checkout-input"
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="login-field">
                    <label>Custom URL Slug (optional)</label>
                    <input
                      type="text"
                      placeholder="leave blank to auto-generate"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="checkout-input"
                    />
                  </div>
                </div>

                <div className="checkout-form-row-3">
                  <div className="login-field">
                    <label>Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="120"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="checkout-input"
                    />
                  </div>

                  <div className="login-field">
                    <label>Compare Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="180"
                      value={formData.compare_at_price}
                      onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                      className="checkout-input"
                    />
                  </div>

                  <div className="login-field">
                    <label>Stock Units *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="25"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="checkout-input"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label>Image Paths (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="/products/SL080.png"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    className="checkout-input"
                  />
                </div>

                <div className="login-field">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Product details, aesthetic styling tips, and materials..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="checkout-input"
                    style={{ height: 'auto', padding: '10px 14px' }}
                  />
                </div>

                <label className="checkbox-label" style={{ marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active &amp; Visible in Customer Storefront</span>
                </label>

                <div className="admin-modal-actions">
                  <button type="button" onClick={() => setModalMode(null)} className="account-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="admin-action-btn-primary">
                    {saving ? 'Saving...' : modalMode === 'create' ? 'Create Product' : 'Save Changes'}
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
