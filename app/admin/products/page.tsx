'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Download,
  UploadCloud,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { formatPrice, getAssetPath } from '@/lib/utils';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parent_category: string | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('all');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        fetch('/api/admin/products?search=&categoryId=&status=all'),
        fetch('/api/admin/categories'),
      ]);

      const prodsData = await prodsRes.json();
      const catsData = await catsRes.json();

      if (prodsData.success) setProducts(prodsData.products || []);
      if (catsData.success) setCategories(catsData.categories || []);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique classifications from categories
  const classifications = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.parent_category) set.add(c.parent_category);
    });
    return Array.from(set).sort();
  }, [categories]);

  // Categories filtered by selected classification
  const filteredCategoryOptions = useMemo(() => {
    if (selectedClassification === 'all') return categories;
    return categories.filter((c) => c.parent_category === selectedClassification);
  }, [categories, selectedClassification]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesSku = p.sku?.toLowerCase().includes(q);
        const matchesSlug = p.slug?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesSlug) return false;
      }

      // Classification
      if (selectedClassification !== 'all') {
        const cat = categories.find((c) => c.id === p.category_id);
        if (cat?.parent_category !== selectedClassification) return false;
      }

      // Category
      if (selectedCat !== 'all' && p.category_id !== selectedCat) {
        return false;
      }

      // Visibility Status
      if (selectedStatus === 'active' && !p.is_active) return false;
      if (selectedStatus === 'inactive' && p.is_active) return false;

      // Stock Status
      if (selectedStock === 'in_stock' && p.stock_quantity <= 0) return false;
      if (selectedStock === 'low_stock' && (p.stock_quantity <= 0 || p.stock_quantity >= 10)) return false;
      if (selectedStock === 'out_of_stock' && p.stock_quantity > 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock_asc') return a.stock_quantity - b.stock_quantity;
      if (sortBy === 'stock_desc') return b.stock_quantity - a.stock_quantity;
      return 0;
    });
  }, [products, search, selectedClassification, selectedCat, selectedStatus, selectedStock, sortBy, categories]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedClassification, selectedCat, selectedStatus, selectedStock, sortBy]);

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

  const handleArchiveConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map((p) => (p.id === deleteTarget.id ? { ...p, is_active: false } : p)));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('Error archiving product:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products &amp; Inventory</h1>
          <p className="admin-page-subtitle">
            Manage your store catalog ({products.length} total products), stock, and visibility.
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

          <Link href="/admin/products/new" className="admin-action-btn-primary">
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-input-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            type="search"
            placeholder="Search by SKU, product name, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>

        {/* Classification Filter */}
        <select
          value={selectedClassification}
          onChange={(e) => {
            setSelectedClassification(e.target.value);
            setSelectedCat('all');
          }}
          className="admin-select"
        >
          <option value="all">All Classifications ({classifications.length})</option>
          {classifications.map((cl) => (
            <option key={cl} value={cl}>
              {cl}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Categories ({filteredCategoryOptions.length})</option>
          {filteredCategoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Visibility Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Visibility</option>
          <option value="active">Active Only</option>
          <option value="inactive">Hidden / Archived</option>
        </select>

        {/* Stock Filter */}
        <select
          value={selectedStock}
          onChange={(e) => setSelectedStock(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Stock Levels</option>
          <option value="in_stock">In Stock (&gt;0)</option>
          <option value="low_stock">Low Stock (&lt;10)</option>
          <option value="out_of_stock">Out of Stock (0)</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="admin-select"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="name_asc">Sort: Name (A to Z)</option>
          <option value="name_desc">Sort: Name (Z to A)</option>
          <option value="price_asc">Sort: Price (Low to High)</option>
          <option value="price_desc">Sort: Price (High to Low)</option>
          <option value="stock_asc">Sort: Stock (Low to High)</option>
          <option value="stock_desc">Sort: Stock (High to Low)</option>
        </select>
      </div>

      {/* Table Results Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#6B7280' }}>
        <span>
          Showing <strong>{filteredProducts.length}</strong> matching products
        </span>
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="admin-loading-box">
          <div className="login-spinner" />
          <p>Loading catalog products...</p>
        </div>
      ) : paginatedProducts.length > 0 ? (
        <div className="admin-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Classification / Category</th>
                  <th>Price</th>
                  <th>Stock Inventory</th>
                  <th>Storefront Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => {
                  const firstImg = Array.isArray(p.images) && p.images[0] ? p.images[0] : (typeof p.images === 'string' && p.images ? p.images : '/products/SL001.png');
                  return (
                    <tr key={p.id} className={!p.is_active ? 'row-inactive' : ''}>
                      {/* Image & Title */}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                          {p.categories?.parent_category && (
                            <span style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {p.categories.parent_category}
                            </span>
                          )}
                          <span className="admin-cat-pill">{p.categories?.name || 'General'}</span>
                        </div>
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
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="admin-icon-btn"
                            title="Edit product"
                          >
                            <Edit2 size={15} />
                          </Link>
                          {p.is_active && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(p)}
                              className="admin-icon-btn text-red-500"
                              title="Archive / Hide product"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', borderTop: '1px solid rgba(44,47,54,0.06)' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="admin-action-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <span style={{ fontSize: '13px', fontWeight: 600, padding: '0 8px' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="admin-action-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="admin-empty-card">
          <Package size={48} className="empty-icon" />
          <h3>No products match your filters</h3>
          <p>Try clearing your search query or filters to see all catalog items.</p>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
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
              <h3>Archive Product?</h3>
              <p>
                Are you sure you want to deactivate <span className="delete-product-name">{deleteTarget.name}</span> ({deleteTarget.sku})?
                It will be hidden from customer browsing but remain in the database for order history.
              </p>
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
                  onClick={handleArchiveConfirmed}
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
