'use client';

import { Search, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { searchProducts } from '@/lib/products';
import type { Product } from '@/lib/products';
import { formatPrice, debounce } from '@/lib/utils';
import ProductPlaceholder from '@/components/ui/ProductPlaceholder';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((q: string) => {
      if (q.length >= 2) {
        setResults(searchProducts(q).slice(0, 8));
      } else {
        setResults([]);
      }
    }, 250),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="drawer-backdrop"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="search-overlay"
            role="dialog"
            aria-label="Search products"
            aria-modal="true"
          >
            <div className="search-overlay-inner container-sarang">
              {/* Search Input */}
              <div className="search-input-wrap">
                <Search size={20} className="search-input-icon" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={handleChange}
                  placeholder="Search for claw clips, scrunchies, bows..."
                  className="search-input"
                  aria-label="Search products"
                />
                <button onClick={onClose} className="search-close-btn" aria-label="Close search" type="button">
                  <X size={20} />
                </button>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="search-results"
                >
                  {results.map((product) => (
                    <Link
                      key={product.sku}
                      href={`/products/${product.slug}`}
                      className="search-result-item"
                      onClick={onClose}
                    >
                      <div className="search-result-image">
                        {product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} />
                        ) : (
                          <ProductPlaceholder category={product.category} sku={product.sku} />
                        )}
                      </div>
                      <div className="search-result-info">
                        <span className="search-result-name">{product.name}</span>
                        <span className="search-result-price">{formatPrice(product.price)}</span>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}

              {/* No Results */}
              {query.length >= 2 && results.length === 0 && (
                <div className="search-no-results">
                  <p>No products found for &ldquo;{query}&rdquo;</p>
                  <p className="search-no-results-hint">Try searching for &ldquo;claw clip&rdquo;, &ldquo;scrunchie&rdquo;, or &ldquo;bow&rdquo;</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
