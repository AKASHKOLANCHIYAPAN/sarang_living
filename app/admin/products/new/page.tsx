'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Tag,
  DollarSign,
  ImageIcon,
  FileText,
  Sparkles,
} from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parent_category: string | null;
}

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedSku, setSuggestedSku] = useState('');

  // Form state
  const [form, setForm] = useState({
    sku: '',
    name: '',
    slug: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    stock_quantity: '20',
    description: '',
    is_active: true,
  });
  const [images, setImages] = useState<string[]>([]);
  const [selectedClassification, setSelectedClassification] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.success) {
        const cats = data.categories as CategoryOption[];
        setCategories(cats);

        // Extract unique classifications (parent_category values)
        const classSet = new Set<string>();
        cats.forEach((c) => {
          if (c.parent_category) classSet.add(c.parent_category);
        });
        const classList = Array.from(classSet).sort();
        setClassifications(classList);

        if (classList.length > 0) {
          setSelectedClassification(classList[0]);
          // Set first category of first classification
          const firstCatInClass = cats.find((c) => c.parent_category === classList[0]);
          if (firstCatInClass) {
            setForm((prev) => ({ ...prev, category_id: firstCatInClass.id }));
          }
        }
      }

      // Auto-suggest SKU
      const prodsRes = await fetch('/api/admin/products?status=all');
      const prodsData = await prodsRes.json();
      if (prodsData.success && prodsData.products) {
        const skus = prodsData.products
          .map((p: any) => p.sku)
          .filter((s: string) => /^SL\d+$/i.test(s))
          .map((s: string) => parseInt(s.replace(/^SL/i, ''), 10))
          .filter((n: number) => !isNaN(n));
        const maxNum = skus.length > 0 ? Math.max(...skus) : 0;
        const next = `SL${String(maxNum + 1).padStart(3, '0')}`;
        setSuggestedSku(next);
        setForm((prev) => ({ ...prev, sku: next }));
      }
    } catch (err) {
      console.error('Error loading data:', err);
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
    } else {
      setForm((prev) => ({ ...prev, category_id: '' }));
    }
  };

  const autoSlug = (name: string, sku: string) => {
    return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sku.toLowerCase()}`
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        sku: form.sku.trim().toUpperCase(),
        name: form.name.trim(),
        slug: form.slug.trim() || autoSlug(form.name, form.sku),
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        category_id: form.category_id,
        stock_quantity: Number(form.stock_quantity),
        description: form.description.trim(),
        images: images.length > 0 ? images : ['/products/SL001.png'],
        is_active: form.is_active,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create product.');
        setSaving(false);
        return;
      }

      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Network error.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading-box">
          <div className="login-spinner" />
          <p>Preparing product form...</p>
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
          <h1 className="admin-page-title">Add New Product</h1>
          <p className="admin-page-subtitle">
            Create a new product and add it to your storefront catalog.
          </p>
        </div>
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
                <label className="admin-form-label">
                  SKU Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SL080"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="admin-form-input"
                />
                {suggestedSku && form.sku !== suggestedSku && (
                  <button
                    type="button"
                    className="admin-sku-suggestion"
                    onClick={() => setForm({ ...form, sku: suggestedSku })}
                  >
                    <Sparkles size={10} /> Use suggested: {suggestedSku}
                  </button>
                )}
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">
                  Product Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velvet Pearl Hair Bow"
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
                    <option key={cl} value={cl}>
                      {cl}
                    </option>
                  ))}
                </select>
                <span className="admin-form-hint">
                  Top-level product group
                </span>
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
                  {filteredCategories.length === 0 && (
                    <option value="">No categories in this classification</option>
                  )}
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-field">
              <label className="admin-form-label">URL Slug (optional)</label>
              <input
                type="text"
                placeholder={form.name ? autoSlug(form.name, form.sku) : 'auto-generated from name'}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="admin-form-input"
              />
              <span className="admin-form-hint">
                Leave blank to auto-generate from product name
              </span>
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
                  placeholder="120"
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
                  placeholder="180"
                  value={form.compare_at_price}
                  onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                  className="admin-form-input"
                />
                <span className="admin-form-hint">
                  Shows as strikethrough price on storefront
                </span>
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">
                  Stock Units <span className="required">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="25"
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
                placeholder="Product details, styling tips, and materials..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="admin-form-textarea"
              />
            </div>

            <div className="admin-checkbox-row">
              <input
                type="checkbox"
                id="is-active-toggle"
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
          <button
            type="submit"
            disabled={saving}
            className="admin-action-btn-primary"
          >
            {saving ? 'Creating Product...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
