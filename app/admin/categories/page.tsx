'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  X,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parent_category: string | null;
  description: string | null;
  productCount?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    parent_category: 'Hair Accessories',
    custom_parent_category: '',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.success) setCategories(data.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Classifications list
  const knownClassifications = useMemo(() => {
    const list = ['Hair Accessories', 'Stationery', 'Gift Accessories'];
    categories.forEach((c) => {
      if (c.parent_category && !list.includes(c.parent_category)) {
        list.push(c.parent_category);
      }
    });
    return list;
  }, [categories]);

  // Group categories by classification
  const groupedCategories = useMemo(() => {
    const groups: Record<string, CategoryItem[]> = {};

    const filtered = categories.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.parent_category && c.parent_category.toLowerCase().includes(q))
      );
    });

    filtered.forEach((c) => {
      const groupKey = c.parent_category || 'General';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(c);
    });

    return groups;
  }, [categories, search]);

  const openCreate = (parentCat = 'Hair Accessories') => {
    setModalMode('create');
    setEditingId(null);
    setFormError(null);
    setForm({
      name: '',
      slug: '',
      parent_category: parentCat,
      custom_parent_category: '',
      description: '',
    });
  };

  const openEdit = (cat: CategoryItem) => {
    setModalMode('edit');
    setEditingId(cat.id);
    setFormError(null);
    const isCustom = !['Hair Accessories', 'Stationery', 'Gift Accessories'].includes(cat.parent_category || '');
    setForm({
      name: cat.name,
      slug: cat.slug,
      parent_category: isCustom ? '__custom__' : (cat.parent_category || 'Hair Accessories'),
      custom_parent_category: isCustom ? (cat.parent_category || '') : '',
      description: cat.description || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    const finalParent =
      form.parent_category === '__custom__'
        ? form.custom_parent_category.trim()
        : form.parent_category.trim();

    if (!finalParent) {
      setFormError('Please choose or enter a valid Classification.');
      setSaving(false);
      return;
    }

    try {
      const payload: any = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        parent_category: finalParent,
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

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/categories?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        await loadCategories();
      } else {
        setDeleteError(data.error || 'Failed to delete category.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Network error.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories &amp; Hierarchy</h1>
          <p className="admin-page-subtitle">
            Manage store classifications and categories ({categories.length} total categories). Changes update storefront navigation and filter tags.
          </p>
        </div>

        <div className="admin-quick-actions">
          <button onClick={() => openCreate()} className="admin-action-btn-primary" type="button">
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="admin-filter-bar">
        <div className="admin-search-input-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            type="search"
            placeholder="Search categories or classifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Hierarchical Group Listing */}
      {loading ? (
        <div className="admin-loading-box">
          <div className="login-spinner" />
          <p>Loading categories...</p>
        </div>
      ) : Object.keys(groupedCategories).length > 0 ? (
        <div className="admin-category-tree">
          {Object.entries(groupedCategories).map(([groupName, catList]) => (
            <div key={groupName} className="admin-classification-group">
              {/* Classification Header */}
              <div className="admin-classification-header">
                <div className="admin-classification-name">
                  <Layers size={18} style={{ color: '#7B8FA1' }} />
                  <span>{groupName}</span>
                  <span className="admin-classification-badge">{catList.length} Categories</span>
                </div>

                <button
                  type="button"
                  onClick={() => openCreate(groupName)}
                  className="admin-action-btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                >
                  <Plus size={13} />
                  <span>Add under {groupName}</span>
                </button>
              </div>

              {/* Category Table */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Slug URL</th>
                      <th>Live Products</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catList.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong className="text-sm font-semibold">{c.name}</strong>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-gray-500">/{c.slug}</span>
                        </td>
                        <td>
                          <span className="stock-number" style={{ width: 'auto', padding: '0 12px' }}>
                            {c.productCount || 0} items
                          </span>
                        </td>
                        <td className="text-xs text-gray-500 max-w-xs truncate">
                          {c.description || '—'}
                        </td>
                        <td>
                          <div className="admin-actions-cell">
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="admin-icon-btn"
                              title="Edit category"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget(c);
                                setDeleteError(null);
                              }}
                              className="admin-icon-btn text-red-500"
                              title="Delete category"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty-card">
          <FolderTree size={48} className="empty-icon" />
          <h3>No categories found</h3>
          <p>Try clearing your search query or create a new category.</p>
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

              <form onSubmit={handleSubmit} className="admin-product-form">
                <div className="admin-form-field">
                  <label className="admin-form-label">Classification Group *</label>
                  <select
                    value={form.parent_category}
                    onChange={(e) => setForm({ ...form, parent_category: e.target.value })}
                    className="admin-form-select"
                  >
                    {knownClassifications.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                    <option value="__custom__">+ Create New Classification Group...</option>
                  </select>
                </div>

                {form.parent_category === '__custom__' && (
                  <div className="admin-form-field">
                    <label className="admin-form-label">New Classification Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Home Decor"
                      value={form.custom_parent_category}
                      onChange={(e) => setForm({ ...form, custom_parent_category: e.target.value })}
                      className="admin-form-input"
                    />
                  </div>
                )}

                <div className="admin-form-field">
                  <label className="admin-form-label">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hair Barrettes"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-field">
                  <label className="admin-form-label">URL Slug (optional)</label>
                  <input
                    type="text"
                    placeholder="leave blank to auto-generate from name"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-field">
                  <label className="admin-form-label">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Category tagline, materials, or style notes..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="admin-form-textarea"
                  />
                </div>

                <div className="admin-modal-actions">
                  <button type="button" onClick={() => setModalMode(null)} className="admin-action-btn-secondary">
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="address-modal-backdrop"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="admin-delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertTriangle size={40} style={{ color: '#D97706', margin: '0 auto 12px' }} />
              <h3>Delete Category?</h3>
              <p>
                Are you sure you want to delete <span className="delete-product-name">{deleteTarget.name}</span>?
                Categories with active products assigned cannot be deleted.
              </p>

              {deleteError && (
                <div className="login-alert login-alert-error" style={{ marginBottom: '16px', textAlign: 'left' }}>
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="admin-delete-modal-actions">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="admin-action-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirmed}
                  disabled={deleting}
                  className="admin-action-btn-danger"
                >
                  {deleting ? 'Deleting...' : 'Delete Category'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
