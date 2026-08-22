'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Sparkles,
  Package,
  Layers,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ParsedRow {
  rowNumber: number;
  sku: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  category: string;
  description: string;
  images: string[];
  stock_quantity: number;
  is_active: boolean;
  isValid: boolean;
  error?: string;
  isDuplicate?: boolean;
}

export default function BulkImportPage() {
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [existingSkus, setExistingSkus] = useState<Set<string>>(new Set());
  const [loadingConfig, setLoadingConfig] = useState(true);

  // File & Parsing state
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parsing, setParsing] = useState(false);

  // Import execution state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    importedSkus: string[];
    errors: any[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/products'),
        ]);
        const catsData = await catsRes.json();
        const prodsData = await prodsRes.json();

        if (catsData.success) setCategories(catsData.categories);
        if (prodsData.success) {
          const skus = new Set<string>((prodsData.products || []).map((p: any) => p.sku.toUpperCase()));
          setExistingSkus(skus);
        }
      } catch (err) {
        console.error('Error loading config for import:', err);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadData();
  }, []);

  // CSV Template download
  const handleDownloadTemplate = () => {
    const sampleCat = categories[0]?.name || 'Bows';
    const sampleCat2 = categories[1]?.name || 'Claw Clips';

    const csvContent = [
      'sku,name,slug,price,compare_at_price,category,description,images,stock_quantity,is_active',
      `SL080,Velvet Pearl Bow,velvet-pearl-bow,199,249,${sampleCat},"Handmade luxury velvet bow with pearl accent","/products/SL001.png",30,true`,
      `SL081,Sparkle Claw Clip,sparkle-claw-clip,149,199,${sampleCat2},"Premium acrylic everyday claw clip","/products/SL008.png",25,true`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sarang-living-bulk-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV text
  const parseCSV = (csvContent: string) => {
    setParsing(true);
    setImportResult(null);

    try {
      const lines = csvContent
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        alert('The CSV file appears to be empty or only contains headers.');
        setParsing(false);
        return;
      }

      // Regex for CSV splitting accounting for quotes
      const splitCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = splitCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      const headerMap: Record<string, number> = {};
      headers.forEach((h, idx) => {
        headerMap[h] = idx;
      });

      const validCategoriesMap = new Map<string, string>();
      categories.forEach((c) => {
        validCategoriesMap.set(c.name.toLowerCase().trim(), c.id);
        validCategoriesMap.set(c.slug.toLowerCase().trim(), c.id);
        validCategoriesMap.set(c.id.toLowerCase().trim(), c.id);
      });

      const rows: ParsedRow[] = [];
      const seenInThisFile = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const values = splitCSVLine(lines[i]);
        if (values.length === 1 && !values[0]) continue;

        const getVal = (colName: string) => {
          const idx = headerMap[colName];
          return idx !== undefined && values[idx] !== undefined ? values[idx] : '';
        };

        const sku = getVal('sku').trim().toUpperCase();
        const name = getVal('name').trim();
        const rawSlug = getVal('slug').trim();
        const rawPrice = getVal('price');
        const rawCompare = getVal('compare_at_price') || getVal('compareprice');
        const category = getVal('category') || getVal('category_name') || getVal('category_id');
        const description = getVal('description');
        const rawImages = getVal('images') || getVal('image');
        const rawStock = getVal('stock_quantity') || getVal('stock');
        const rawActive = getVal('is_active') || getVal('active');

        let isValid = true;
        let error = '';
        let isDuplicate = false;

        // Validation Rules
        if (!sku) {
          isValid = false;
          error = 'SKU is required';
        } else if (seenInThisFile.has(sku)) {
          isValid = false;
          isDuplicate = true;
          error = `Duplicate SKU "${sku}" within CSV file`;
        } else if (existingSkus.has(sku)) {
          isValid = false;
          isDuplicate = true;
          error = `SKU "${sku}" already exists in store catalog`;
        }

        if (isValid && !name) {
          isValid = false;
          error = 'Product Name is required';
        }

        const price = Number(rawPrice);
        if (isValid && (isNaN(price) || price < 0)) {
          isValid = false;
          error = `Invalid price "${rawPrice}" (must be >= 0)`;
        }

        const cleanCat = category.toLowerCase().trim();
        if (isValid && !validCategoriesMap.has(cleanCat)) {
          isValid = false;
          error = `Category "${category}" not found in database`;
        }

        const stock = rawStock ? Math.floor(Number(rawStock)) : 20;
        if (isValid && (isNaN(stock) || stock < 0)) {
          isValid = false;
          error = `Invalid stock quantity "${rawStock}"`;
        }

        let images = ['/products/SL001.png'];
        if (rawImages) {
          try {
            const parsed = JSON.parse(rawImages);
            if (Array.isArray(parsed)) images = parsed;
            else images = [rawImages];
          } catch {
            images = rawImages.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }

        let isActive = true;
        if (rawActive) {
          const low = rawActive.toLowerCase().trim();
          isActive = low === 'true' || low === '1' || low === 'yes';
        }

        const slug = rawSlug || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sku.toLowerCase()}`.replace(/^-+|-+$/g, '');

        if (sku) seenInThisFile.add(sku);

        rows.push({
          rowNumber: i + 1,
          sku,
          name,
          slug,
          price: isNaN(price) ? 0 : price,
          compare_at_price: rawCompare ? Number(rawCompare) : undefined,
          category,
          description,
          images,
          stock_quantity: isNaN(stock) ? 0 : stock,
          is_active: isActive,
          isValid,
          error,
          isDuplicate,
        });
      }

      setParsedRows(rows);
    } catch (err: any) {
      alert(`Error parsing CSV: ${err.message}`);
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    setFile(uploaded);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCSV(text);
    };
    reader.readAsText(uploaded);
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('There are no valid products to import.');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: validRows }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to import products.');
      } else {
        setImportResult(data);
        setParsedRows([]);
        setFile(null);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const errorCount = parsedRows.filter((r) => !r.isValid && !r.isDuplicate).length;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <Link href="/admin/products" className="admin-card-link" style={{ marginBottom: '8px', display: 'inline-flex' }}>
            <ArrowLeft size={14} />
            Back to Products Catalog
          </Link>
          <h1 className="admin-page-title">Bulk Product Import</h1>
          <p className="admin-page-subtitle">
            Upload CSV spreadsheets to add dozens of new products simultaneously with live validation and preview.
          </p>
        </div>

        <div className="admin-quick-actions">
          <button onClick={handleDownloadTemplate} className="admin-action-btn-secondary" type="button">
            <Download size={16} />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Success Confirmation Card */}
      {importResult && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="admin-panel-card" style={{ marginBottom: '24px', borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <CheckCircle2 size={24} className="text-green-500" />
            <h2 className="admin-panel-card-title">Bulk Import Complete!</h2>
          </div>
          <p className="text-sm text-gray-700" style={{ marginBottom: '16px' }}>
            Successfully added <strong>{importResult.importedCount} new products</strong> directly into the live catalog.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            {importResult.importedSkus.map((sku) => (
              <span key={sku} className="font-mono text-xs font-bold" style={{ padding: '2px 8px', background: '#ECFDF5', color: '#059669', borderRadius: '6px' }}>
                {sku}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/admin/products" className="admin-action-btn-primary">
              <Package size={16} />
              <span>View Updated Catalog</span>
            </Link>
            <button onClick={() => setImportResult(null)} className="admin-action-btn-secondary">
              Upload Another CSV
            </button>
          </div>
        </motion.div>
      )}

      {/* Upload Dropzone */}
      {parsedRows.length === 0 && !importResult && (
        <div className="admin-panel-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div className="import-dropzone">
            <UploadCloud size={48} className="import-dropzone-icon" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
              Choose a CSV file or drag &amp; drop it here
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
              Compatible with Excel exports, Google Sheets CSV, and Sarang Living standard catalog format.
            </p>

            <label className="admin-action-btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
              <FileSpreadsheet size={16} />
              <span>Select CSV File</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Guidelines Box */}
          <div className="import-guidelines-box">
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Supported CSV Headers:
            </h4>
            <code className="import-code-snippet">
              sku,name,slug,price,compare_at_price,category,description,images,stock_quantity,is_active
            </code>
            <ul className="import-guidelines-list">
              <li>• <strong>Category</strong>: Use real category names (e.g. <em>{categories.map((c) => c.name).slice(0, 5).join(', ')}</em>).</li>
              <li>• <strong>SKU</strong>: Must be unique and not match any existing product.</li>
              <li>• <strong>Images</strong>: Accepts local path e.g. <code>/products/SL001.png</code> or array of paths.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Preview Table & Validation Diagnostics */}
      {parsedRows.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Summary KPIs */}
          <div className="admin-kpi-grid" style={{ marginBottom: '20px' }}>
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <span className="admin-kpi-label">Total Rows Parsed</span>
                <strong className="admin-kpi-value">{parsedRows.length}</strong>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <span className="admin-kpi-label" style={{ color: '#059669' }}>Valid Products</span>
                <strong className="admin-kpi-value" style={{ color: '#059669' }}>{validCount}</strong>
              </div>
            </div>

            {duplicateCount > 0 && (
              <div className="admin-kpi-card">
                <div className="admin-kpi-info">
                  <span className="admin-kpi-label" style={{ color: '#D97706' }}>Duplicate SKUs</span>
                  <strong className="admin-kpi-value" style={{ color: '#D97706' }}>{duplicateCount}</strong>
                </div>
              </div>
            )}

            {errorCount > 0 && (
              <div className="admin-kpi-card">
                <div className="admin-kpi-info">
                  <span className="admin-kpi-label" style={{ color: '#DC2626' }}>Errors</span>
                  <strong className="admin-kpi-value" style={{ color: '#DC2626' }}>{errorCount}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="text-sm font-semibold text-gray-700">Previewing Import File:</span>
              <span className="font-mono text-xs text-gray-500">{file?.name || 'pasted.csv'}</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setFile(null);
                }}
                className="account-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Clear &amp; Re-upload
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing || validCount === 0}
                className="admin-action-btn-primary"
              >
                <CheckCircle2 size={16} />
                <span>{importing ? 'Importing...' : `Import ${validCount} Valid Products`}</span>
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div className="admin-table-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Status</th>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Diagnostics / Error</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r) => (
                    <tr key={r.rowNumber} className={!r.isValid ? 'row-inactive' : ''}>
                      <td className="text-xs text-gray-400 font-mono">#{r.rowNumber}</td>

                      <td>
                        {r.isValid ? (
                          <span className="admin-status-toggle active" style={{ padding: '2px 8px' }}>
                            <CheckCircle2 size={12} />
                            <span>Valid</span>
                          </span>
                        ) : r.isDuplicate ? (
                          <span className="stock-badge-low" style={{ padding: '2px 8px' }}>
                            <AlertTriangle size={12} />
                            <span>Duplicate</span>
                          </span>
                        ) : (
                          <span className="admin-status-toggle inactive" style={{ padding: '2px 8px' }}>
                            <XCircle size={12} />
                            <span>Error</span>
                          </span>
                        )}
                      </td>

                      <td className="font-mono font-bold text-xs">{r.sku || '—'}</td>
                      <td>{r.name || '—'}</td>
                      <td>
                        <span className="admin-cat-pill">{r.category || '—'}</span>
                      </td>
                      <td className="text-xs font-semibold">{formatPrice(r.price)}</td>
                      <td className="text-xs">{r.stock_quantity} units</td>

                      <td>
                        {r.error ? (
                          <span className="text-xs text-red-600 font-medium">⚠️ {r.error}</span>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">Ready for database</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
