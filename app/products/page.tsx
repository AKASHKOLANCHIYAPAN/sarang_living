'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, PackageOpen } from 'lucide-react';
import { products, categories } from '@/lib/products';
import type { Product } from '@/lib/products';
import ProductCard from '@/components/ui/ProductCard';
import { priceBuckets } from '@/lib/utils';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest' | 'bestsellers';

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSort = (searchParams.get('sort') || 'default') as SortOption;
  const initialPriceMin = searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined;
  const initialPriceMax = searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined;

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({
    min: initialPriceMin,
    max: initialPriceMax,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let result: Product[] = products.filter((p) => p.isActive);

    // Category filter
    if (selectedCategory) {
      const category = categories.find((c) => c.slug === selectedCategory);
      if (category) {
        result = result.filter((p) => p.category === category.name);
      }
    }

    // Price range filter
    if (priceRange.min !== undefined) {
      result = result.filter((p) => p.price >= priceRange.min!);
    }
    if (priceRange.max !== undefined) {
      result = result.filter((p) => p.price <= priceRange.max!);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => {
          const numA = parseInt(a.sku.replace('SL', ''));
          const numB = parseInt(b.sku.replace('SL', ''));
          return numB - numA;
        });
        break;
      case 'bestsellers':
        result.sort((a, b) => a.stockQuantity - b.stockQuantity);
        break;
      default:
        break;
    }

    return result;
  }, [selectedCategory, sortBy, priceRange]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSortBy('default');
    setPriceRange({});
  };

  const hasActiveFilters = selectedCategory || priceRange.min !== undefined || sortBy !== 'default';
  const activeCategoryName = categories.find((c) => c.slug === selectedCategory)?.name;

  return (
    <div className="catalog-page">
      <div className="container-sarang">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="catalog-header"
        >
          <h1 className="catalog-title">
            {activeCategoryName || 'All Products'}
          </h1>
          <p className="catalog-count">{filteredProducts.length} products</p>
        </motion.div>

        {/* Filter Bar */}
        <div className="catalog-filter-bar">
          {/* Mobile Filter Toggle */}
          <button
            className="filter-toggle-btn"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            type="button"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="catalog-sort-select"
            aria-label="Sort products"
          >
            <option value="default">Sort by</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="bestsellers">Bestsellers</option>
          </select>
        </div>

        <div className="catalog-layout">
          {/* Sidebar Filters */}
          <aside className={`catalog-sidebar ${isFilterOpen ? 'catalog-sidebar-open' : ''}`}>
            {/* Mobile close button */}
            <div className="filter-sidebar-header">
              <h3 className="filter-sidebar-title">Filters</h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="filter-sidebar-close"
                type="button"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Filter */}
            <div className="filter-section">
              <h4 className="filter-title">Category</h4>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${!selectedCategory ? 'filter-chip-active' : ''}`}
                  onClick={() => setSelectedCategory('')}
                  type="button"
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    className={`filter-chip ${selectedCategory === cat.slug ? 'filter-chip-active' : ''}`}
                    onClick={() => setSelectedCategory(cat.slug)}
                    type="button"
                  >
                    {cat.name}
                    <span className="filter-chip-count">{cat.productCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="filter-section">
              <h4 className="filter-title">Price Range</h4>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${!priceRange.min && !priceRange.max ? 'filter-chip-active' : ''}`}
                  onClick={() => setPriceRange({})}
                  type="button"
                >
                  All Prices
                </button>
                {priceBuckets.map((bucket) => (
                  <button
                    key={bucket.slug}
                    className={`filter-chip ${priceRange.min === bucket.min && priceRange.max === bucket.max ? 'filter-chip-active' : ''}`}
                    onClick={() => setPriceRange({ min: bucket.min, max: bucket.max })}
                    type="button"
                  >
                    {bucket.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="filter-clear-btn" type="button">
                Clear all filters
              </button>
            )}
          </aside>

          {/* Filter Overlay (mobile) */}
          {isFilterOpen && (
            <div
              className="filter-overlay-backdrop"
              onClick={() => setIsFilterOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Product Grid */}
          <div className="catalog-main">
            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="active-filters">
                {activeCategoryName && (
                  <span className="active-filter-tag">
                    {activeCategoryName}
                    <button onClick={() => setSelectedCategory('')} aria-label="Remove category filter" type="button">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {priceRange.min !== undefined && (
                  <span className="active-filter-tag">
                    {priceBuckets.find(b => b.min === priceRange.min)?.label || `₹${priceRange.min}–₹${priceRange.max}`}
                    <button onClick={() => setPriceRange({})} aria-label="Remove price filter" type="button">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.sku} product={product} index={index} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="catalog-empty"
              >
                <PackageOpen size={64} strokeWidth={1} className="catalog-empty-icon" />
                <h3 className="catalog-empty-title">No products found</h3>
                <p className="catalog-empty-text">
                  Try adjusting your filters or browse our full collection.
                </p>
                <button onClick={clearFilters} className="catalog-empty-btn" type="button">
                  Clear all filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="catalog-page">
          <div className="container-sarang">
            <div className="catalog-header">
              <h1 className="catalog-title">Loading Products...</h1>
            </div>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
