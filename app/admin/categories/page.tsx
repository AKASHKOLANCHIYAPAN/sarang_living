'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderTree, Plus, Edit2, AlertCircle, X, Sparkles } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    parent_category: 'Hair Accessories',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormError(null);
    setForm({
      name: '',
      slug: '',
      parent_category: 'Hair Accessories',
      description: '',
    });
  };

  const openEdit = (cat: any) => {
    setModalMode('edit');
    setEditingId(cat.id);
    setFormError(null);
    setForm({
      name: cat.name,
      slug: cat.slug,
      parent_category: cat.parent_category || 'Hair Accessories',
      description: cat.description || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const payload: any = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        parent_category: form.parent_category.trim(),
        description: form.description.trim(),
      };

      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        payload.id = editingId;
        res = await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to save category.');
      } else {
        setModalMode(null);
        await loadCategories();
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories Management</h1>
          <p className="admin-page-subtitle">
            Create and organize catalog categories. New categories dynamically update storefront navigation.
          </p>
        </div>

        <button onClick={openCreate} className="admin-action-btn-primary" type="button">
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Table */}
      {loading ? (
        <div className="admin-loading-box">
          <div className="login-spinner" />
          <p>Loading categories...</p>
        </div>
      ) : categories.length > 0 ? (
        <div className="admin-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>URL Slug</th>
                  <th>Parent Category</th>
                  <th>Live Products Count</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong className="text-sm font-semibold">{c.name}</strong>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-gray-500">/{c.slug}</span>
                    </td>
                    <td>
                      <span className="admin-cat-pill">{c.parent_category || 'General'}</span>
                    </td>
                    <td>
                      <span className="stock-number" style={{ width: 'auto', padding: '0 12px' }}>
                        {c.productCount} items
                      </span>
                    </td>
                    <td className="text-xs text-gray-500 max-w-xs truncate">
                      {c.description || '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="admin-icon-btn"
                        title="Edit category"
                      >
                        <Edit2 size={15} />
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
          <FolderTree size={48} className="empty-icon" />
          <h3>No categories found</h3>
        </div>
      )}

      {/* Add / Edit Category Modal */}
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
                  {modalMode === 'create' ? 'Add New Category' : 'Edit Category'}
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

              <form onSubmit={handleSubmit} className="login-form">
                <div className="login-field">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hair Barrettes"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="checkout-input"
                  />
                </div>

                <div className="login-field">
                  <label>URL Slug (optional)</label>
                  <input
                    type="text"
                    placeholder="leave blank to auto-generate"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="checkout-input"
                  />
                </div>

                <div className="login-field">
                  <label>Parent Category</label>
                  <input
                    type="text"
                    placeholder="Hair Accessories"
                    value={form.parent_category}
                    onChange={(e) => setForm({ ...form, parent_category: e.target.value })}
                    className="checkout-input"
                  />
                </div>

                <div className="login-field">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Category tagline and description..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="checkout-input"
                    style={{ height: 'auto', padding: '10px 14px' }}
                  />
                </div>

                <div className="admin-modal-actions">
                  <button type="button" onClick={() => setModalMode(null)} className="account-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="admin-action-btn-primary">
                    {saving ? 'Saving...' : modalMode === 'create' ? 'Create Category' : 'Save Changes'}
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
