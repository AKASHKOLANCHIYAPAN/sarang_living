'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  Tag,
  DollarSign,
  ImageIcon,
  FileText,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parent_category: string | null;
}

export default function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [productName, setProductName] = useState('');

  // Form state
  const [form, setForm] = useState({
    sku: '',
    name: '',
    slug: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    stock_quantity: '',
    description: '',
    is_active: true,
  });
  const [images, setImages] = useState<string[]>([]);
  const [selectedClassification, setSelectedClassification] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      // Load categories
      const catsRes = await fetch('/api/admin/categories');
      const catsData = await catsRes.json();
      let cats: CategoryOption[] = [];
      if (catsData.success) {
        cats = catsData.categories;
        setCategories(cats);

        const classSet = new Set<string>();
        cats.forEach((c) => {
          if (c.parent_category) classSet.add(c.parent_category);
        });
        setClassifications(Array.from(classSet).sort());
      }

      // Load product
      const prodsRes = await fetch(`/api/admin/products?search=&categoryId=&status=all`);
      const prodsData = await prodsRes.json();
      if (prodsData.success) {
        const product = prodsData.products.find((p: any) => p.id === id);
        if (!product) {
          setError('Product not found.');
          setLoading(false);
          return;
        }

        setProductName(product.name);
        setForm({
          sku: product.sku || '',
          name: product.name || '',
          slug: product.slug || '',
          price: String(product.price || 0),
          compare_at_price: product.compare_at_price ? String(product.compare_at_price) : '',
          category_id: product.category_id || '',
          stock_quantity: String(product.stock_quantity || 0),
          description: product.description || '',
          is_active: product.is_active ?? true,
        });

        // Set images
        if (Array.isArray(product.images)) {
          setImages(product.images);
        } else if (typeof product.images === 'string' && product.images) {
          setImages([product.images]);
        }

        // Set classification based on product's category
        const prodCat = cats.find((c) => c.id === product.category_id);
        if (prodCat?.parent_category) {
          setSelectedClassification(prodCat.parent_category);
        }
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Failed to load product.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) => c.parent_category === selectedClassification
  );

  const handleClassificationChange = (value: string) => {
    setSelectedClassification(value);
    const firstCat = categories.find((c) => c.parent_category === value);
    if (firstCat) {
      setForm((prev) => ({ ...prev, category_id: firstCat.id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        id,
        name: form.name.trim(),
        slug: form.slug.trim(),
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        category_id: form.category_id,
        stock_quantity: Number(form.stock_quantity),
        description: form.description.trim(),
        images: images.length > 0 ? images : ['/products/SL001.png'],
        is_active: form.is_active,
      };

      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to update product.');
        setSaving(false);
        return;
      }

      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Network error.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/products');
      } else {
        setError(data.error || 'Failed to archive product.');
        setShowDeleteModal(false);
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading-box">
          <div className="login-spinner" />
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-form-page">
      <Link href="/admin/products" className="admin-back-link">
        <ArrowLeft size={16} />
        Back to Products
      </Link>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Edit Product</h1>
          <p className="admin-page-subtitle">
            Updating: <strong>{productName}</strong> — SKU: {form.sku}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="admin-action-btn-danger"
        >
          <Trash2 size={15} />
          <span>Archive Product</span>
        </button>
      </div>

      {error && (
        <div className="admin-login-error">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Product Images */}
        <div className="admin-form-card" style={{ marginBottom: '20px' }}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">
              <ImageIcon size={18} />
              Product Images
            </h3>
            <ImageUploader images={images} onChange={setImages} maxImages={8} />
          </div>
        </div>

        {/* Product Details */}
        <div className="admin-form-card" style={{ marginBottom: '20px' }}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">
              <Package size={18} />
              Product Details
            </h3>

            <div className="admin-form-row">
              <div className="admin-form-field">
                <label className="admin-form-label">SKU Code</label>
                <input
                  type="text"
                  value={form.sku}
                  disabled
                  className="admin-form-input"
                />
                <span className="admin-form-hint">SKU cannot be changed after creation</span>
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">
                  Product Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="admin-form-input"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-field">
                <label className="admin-form-label">Classification</label>
                <select
                  value={selectedClassification}
                  onChange={(e) => handleClassificationChange(e.target.value)}
                  className="admin-form-select"
                >
                  {classifications.map((cl) => (
                    <option key={cl} value={cl}>{cl}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">
                  Category <span className="required">*</span>
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="admin-form-select"
                  required
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-field">
              <label className="admin-form-label">URL Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="admin-form-input"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="admin-form-card" style={{ marginBottom: '20px' }}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">
              <DollarSign size={18} />
              Pricing & Inventory
            </h3>

            <div className="admin-form-row-3">
              <div className="admin-form-field">
                <label className="admin-form-label">
                  Selling Price (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">Compare-at Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.compare_at_price}
                  onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">
                  Stock Units <span className="required">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                  className="admin-form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="admin-form-card" style={{ marginBottom: '20px' }}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">
              <FileText size={18} />
              Description
            </h3>

            <div className="admin-form-field">
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="admin-form-textarea"
              />
            </div>

            <div className="admin-checkbox-row">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span>Active & Visible in Customer Storefront</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="admin-form-actions">
          <Link href="/admin/products" className="admin-action-btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="admin-action-btn-primary">
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="address-modal-backdrop"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="admin-delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertTriangle size={40} style={{ color: '#D97706' }} />
              <h3>Archive this product?</h3>
              <p>
                <span className="delete-product-name">{productName}</span> will be deactivated
                and hidden from the storefront. This action can be reversed by reactivating
                the product later.
              </p>
              <div className="admin-delete-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="admin-action-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="admin-action-btn-danger"
                >
                  {deleting ? 'Archiving...' : 'Yes, Archive Product'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
