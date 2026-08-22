'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  PackageOpen,
  ArrowUpDown,
  Check,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { getProducts, getCategories, Product, Category } from '@/lib/products-db';
import ProductCard from '@/components/ui/ProductCard';
import { formatPrice } from '@/lib/utils';

type SortOption = 'default' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlCategory = searchParams.get('category') || '';
  const urlSort = (searchParams.get('sort') || 'default') as SortOption;
  const urlMinPrice = searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined;
  const urlMaxPrice = searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined;
  const urlInStock = searchParams.get('inStock') === 'true';

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [sortBy, setSortBy] = useState<SortOption>(urlSort);
  const [priceMin, setPriceMin] = useState<number | undefined>(urlMinPrice);
  const [priceMax, setPriceMax] = useState<number | undefined>(urlMaxPrice);
  const [inStockOnly, setInStockOnly] = useState(urlInStock);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      setIsLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts({ onlyActive: true }),
        ]);
        setCategoriesList(cats);
        setProductsList(prods);
      } catch (err) {
        console.error('Error loading live catalog data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Sync state with URL params
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSortBy((searchParams.get('sort') || 'default') as SortOption);
    setPriceMin(searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined);
    setPriceMax(searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined);
    setInStockOnly(searchParams.get('inStock') === 'true');
  }, [searchParams]);

  const activeCategoryObj = categoriesList.find((c) => c.slug === selectedCategory);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result: Product[] = [...productsList].filter((p) => p.isActive);

    // 1. Category Filter
    if (selectedCategory) {
      const cat = categoriesList.find((c) => c.slug === selectedCategory);
      if (cat) {
        result = result.filter(
          (p) => p.category.toLowerCase() === cat.name.toLowerCase()
        );
      }
    }

    // 2. Price Range Filter
    if (priceMin !== undefined) {
      result = result.filter((p) => p.price >= priceMin);
    }
    if (priceMax !== undefined) {
      result = result.filter((p) => p.price <= priceMax);
    }

    // 3. Availability Filter
    if (inStockOnly) {
      result = result.filter((p) => p.stockQuantity > 0);
    }

    // 4. Sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => {
          const numA = parseInt(a.sku.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.sku.replace(/\D/g, '')) || 0;
          return numB - numA;
        });
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // Featured (SKU order)
        result.sort((a, b) => {
          const numA = parseInt(a.sku.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.sku.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
        break;
    }

    return result;
  }, [productsList, categoriesList, selectedCategory, priceMin, priceMax, inStockOnly, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setPriceMin(undefined);
    setPriceMax(undefined);
    setInStockOnly(false);
    setSortBy('default');
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (priceMin !== undefined || priceMax !== undefined ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const collectionTitle = activeCategoryObj ? activeCategoryObj.name : 'All Accessories';
  const collectionDesc = activeCategoryObj
    ? activeCategoryObj.description || `Explore our handcrafted ${activeCategoryObj.name.toLowerCase()} collection.`
    : 'Discover our complete collection of cute hair bows, aesthetic claw clips, scrunchies, and lifestyle accessories.';

  return (
    <div className="catalog-page">
      {/* ── Collection Header ── */}
      <section className="collection-hero-section">
        <div className="collection-hero-container">
          <nav className="collection-breadcrumbs" aria-label="Breadcrumbs">
            <span>Home</span>
            <ChevronRight size={12} />
            <span>Collections</span>
            {activeCategoryObj && (
              <>
                <ChevronRight size={12} />
                <span className="current">{activeCategoryObj.name}</span>
              </>
            )}
          </nav>

          <div className="collection-hero-content">
            <h1 className="collection-hero-title">{collectionTitle}</h1>
            <p className="collection-hero-subtitle">{collectionDesc}</p>
            <span className="collection-count-badge">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Available
            </span>
          </div>
        </div>
      </section>

      {/* ── Horizontal Quick Category Navigation Bar ── */}
      <nav className="collection-category-bar-wrapper" aria-label="Quick Category Filter">
        <div className="collection-category-bar">
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={`collection-cat-pill ${selectedCategory === '' ? 'active' : ''}`}
          >
            All Products
            <span className="pill-count">{productsList.length}</span>
          </button>

          {categoriesList.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleCategorySelect(cat.slug)}
              className={`collection-cat-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
            >
              {cat.name}
              {cat.productCount > 0 && <span className="pill-count">{cat.productCount}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Sticky Mobile Control Bar (< 1024px) ── */}
      <div className="collection-mobile-toolbar">
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          className="mobile-toolbar-btn"
        >
          <Filter size={16} />
          <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
        </button>

        <div className="mobile-toolbar-sort">
          <ArrowUpDown size={15} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="mobile-sort-select"
            aria-label="Sort products"
          >
            <option value="default">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* ── Active Filter Tag Chips ── */}
      {activeFiltersCount > 0 && (
        <div className="collection-active-chips-container">
          <span className="active-chips-label">Applied Filters:</span>

          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className="filter-chip"
            >
              <span>Category: {activeCategoryObj?.name || selectedCategory}</span>
              <X size={13} />
            </button>
          )}

          {(priceMin !== undefined || priceMax !== undefined) && (
            <button
              type="button"
              onClick={() => {
                setPriceMin(undefined);
                setPriceMax(undefined);
              }}
              className="filter-chip"
            >
              <span>
                Price: {priceMin ? `₹${priceMin}` : '₹0'} - {priceMax ? `₹${priceMax}` : 'Above'}
              </span>
              <X size={13} />
            </button>
          )}

          {inStockOnly && (
            <button
              type="button"
              onClick={() => setInStockOnly(false)}
              className="filter-chip"
            >
              <span>In Stock Only</span>
              <X size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={clearAllFilters}
            className="filter-chip-clear-all"
          >
            Clear All
          </button>
        </div>
      )}

      {/* ── Main Layout: Sidebar (Desktop) + Product Grid ── */}
      <div className="collection-main-layout">
        {/* Desktop Sidebar Filter (≥ 1024px) */}
        <aside className="collection-sidebar" aria-label="Product filters">
          <div className="collection-sidebar-inner">
            <div className="collection-sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} />
                <h2 className="sidebar-title">Filters</h2>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="sidebar-reset-btn"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter Section */}
            <div className="filter-group">
              <h3 className="filter-group-title">Categories</h3>
              <div className="filter-options-list">
                <label className="filter-radio-row">
                  <input
                    type="radio"
                    name="category-desktop"
                    checked={selectedCategory === ''}
                    onChange={() => setSelectedCategory('')}
                  />
                  <span>All Categories</span>
                  <span className="count-label">({productsList.length})</span>
                </label>

                {categoriesList.map((cat) => (
                  <label key={cat.slug} className="filter-radio-row">
                    <input
                      type="radio"
                      name="category-desktop"
                      checked={selectedCategory === cat.slug}
                      onChange={() => setSelectedCategory(cat.slug)}
                    />
                    <span>{cat.name}</span>
                    <span className="count-label">({cat.productCount})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter Section */}
            <div className="filter-group">
              <h3 className="filter-group-title">Price (₹)</h3>
              <div className="price-inputs-row">
                <div className="price-input-box">
                  <span className="price-prefix">₹</span>
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    value={priceMin ?? ''}
                    onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                    className="price-num-input"
                  />
                </div>
                <span className="price-sep">–</span>
                <div className="price-input-box">
                  <span className="price-prefix">₹</span>
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    value={priceMax ?? ''}
                    onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                    className="price-num-input"
                  />
                </div>
              </div>

              {/* Price preset chips */}
              <div className="price-preset-chips">
                <button
                  type="button"
                  onClick={() => {
                    setPriceMin(undefined);
                    setPriceMax(100);
                  }}
                  className={`preset-chip ${priceMax === 100 && priceMin === undefined ? 'active' : ''}`}
                >
                  Under ₹100
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPriceMin(100);
                    setPriceMax(250);
                  }}
                  className={`preset-chip ${priceMin === 100 && priceMax === 250 ? 'active' : ''}`}
                >
                  ₹100–₹250
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPriceMin(250);
                    setPriceMax(500);
                  }}
                  className={`preset-chip ${priceMin === 250 && priceMax === 500 ? 'active' : ''}`}
                >
                  ₹250–₹500
                </button>
              </div>
            </div>

            {/* Availability Filter Section */}
            <div className="filter-group">
              <h3 className="filter-group-title">Availability</h3>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* ── Product Grid Container ── */}
        <main className="collection-grid-container">
          {/* Desktop Toolbar */}
          <div className="collection-desktop-toolbar">
            <div className="toolbar-info">
              <span className="toolbar-count">
                Showing <strong>{filteredProducts.length}</strong> items
              </span>
            </div>

            <div className="toolbar-sort-wrap">
              <label htmlFor="desktop-sort">Sort by:</label>
              <select
                id="desktop-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="desktop-sort-select"
              >
                <option value="default">Featured</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="collection-loading-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-skeleton-card" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="collection-product-grid">
              {filteredProducts.map((product, idx) => (
                <ProductCard key={product.sku} product={product} index={idx} />
              ))}
            </div>
          ) : (
            <div className="collection-empty-box">
              <PackageOpen size={48} className="empty-icon" />
              <h3>No products match your selected filters</h3>
              <p>Try clearing your price range or selecting another category.</p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="admin-action-btn-primary"
                style={{ marginTop: '16px' }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Filter Drawer Bottom Sheet ── */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="address-modal-backdrop"
            onClick={() => setIsFilterDrawerOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="collection-mobile-drawer"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-drawer-header">
                <h2>Filter Products</h2>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="filter-sidebar-close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-drawer-body">
                {/* Categories */}
                <div className="filter-group">
                  <h3 className="filter-group-title">Category</h3>
                  <div className="filter-options-list">
                    <label className="filter-radio-row">
                      <input
                        type="radio"
                        name="category-mobile"
                        checked={selectedCategory === ''}
                        onChange={() => setSelectedCategory('')}
                      />
                      <span>All Products</span>
                      <span className="count-label">({productsList.length})</span>
                    </label>

                    {categoriesList.map((cat) => (
                      <label key={cat.slug} className="filter-radio-row">
                        <input
                          type="radio"
                          name="category-mobile"
                          checked={selectedCategory === cat.slug}
                          onChange={() => setSelectedCategory(cat.slug)}
                        />
                        <span>{cat.name}</span>
                        <span className="count-label">({cat.productCount})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="filter-group">
                  <h3 className="filter-group-title">Price Range</h3>
                  <div className="price-inputs-row">
                    <div className="price-input-box">
                      <span className="price-prefix">₹</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceMin ?? ''}
                        onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                        className="price-num-input"
                      />
                    </div>
                    <span className="price-sep">–</span>
                    <div className="price-input-box">
                      <span className="price-prefix">₹</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceMax ?? ''}
                        onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                        className="price-num-input"
                      />
                    </div>
                  </div>
                </div>

                {/* In Stock */}
                <div className="filter-group">
                  <h3 className="filter-group-title">Availability</h3>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    <span>In Stock Only</span>
                  </label>
                </div>
              </div>

              <div className="mobile-drawer-footer">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="account-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="admin-action-btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  Show {filteredProducts.length} Results
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="catalog-loading" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="login-spinner" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
