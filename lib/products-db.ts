// ═══════════════════════════════════════════════════════════════
// SARANG LIVING — Supabase Product Data Access Layer (Phase 3)
// ═══════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase';

export interface Product {
  id?: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  parentCategory: string;
  description: string;
  images: string[];
  stockQuantity: number;
  isActive: boolean;
}

export interface Category {
  id?: string;
  name: string;
  slug: string;
  parentCategory: string;
  productCount: number;
  description: string;
}

export interface ProductFilterOptions {
  categorySlug?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: 'default' | 'price-asc' | 'price-desc' | 'newest' | 'bestsellers' | string;
  limit?: number;
  onlyActive?: boolean;
}

function mapRowToProduct(row: any): Product {
  let imagesArray: string[] = [];
  if (Array.isArray(row.images)) {
    imagesArray = row.images;
  } else if (typeof row.images === 'string') {
    try {
      imagesArray = JSON.parse(row.images);
    } catch {
      imagesArray = [row.images];
    }
  }

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    category: row.categories?.name || 'Uncategorized',
    parentCategory: row.categories?.parent_category || 'Hair Accessories',
    description: row.description || '',
    images: imagesArray,
    stockQuantity: Number(row.stock_quantity ?? 0),
    isActive: Boolean(row.is_active ?? true),
  };
}

/**
 * Fetch all products with optional filtering, sorting, and pagination
 */
export async function getProducts(options?: ProductFilterOptions): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*, categories ( id, name, slug, parent_category, description )');

    if (options?.onlyActive !== false) {
      query = query.eq('is_active', true);
    }

    // Price range filters
    if (options?.priceMin !== undefined) {
      query = query.gte('price', options.priceMin);
    }
    if (options?.priceMax !== undefined) {
      query = query.lte('price', options.priceMax);
    }

    // Sorting
    switch (options?.sort) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false }).order('sku', { ascending: false });
        break;
      case 'bestsellers':
        query = query.order('stock_quantity', { ascending: true });
        break;
      default:
        query = query.order('sku', { ascending: true });
        break;
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error in getProducts query:', error.message);
      return [];
    }

    if (!data) return [];

    let products = data.map(mapRowToProduct);

    // If categorySlug filter was provided, filter by joined category slug
    if (options?.categorySlug) {
      products = products.filter(
        (p) =>
          data.find((d: any) => d.sku === p.sku)?.categories?.slug === options.categorySlug
      );
    }

    return products;
  } catch (err) {
    console.error('Exception in getProducts:', err);
    return [];
  }
}

/**
 * Fetch single product by unique slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories ( id, name, slug, parent_category, description )')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    return mapRowToProduct(data);
  } catch (err) {
    console.error(`Exception in getProductBySlug (${slug}):`, err);
    return null;
  }
}

/**
 * Fetch single product by unique SKU
 */
export async function getProductBySku(sku: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories ( id, name, slug, parent_category, description )')
      .eq('sku', sku)
      .single();

    if (error || !data) {
      return null;
    }

    return mapRowToProduct(data);
  } catch (err) {
    console.error(`Exception in getProductBySku (${sku}):`, err);
    return null;
  }
}

/**
 * Fetch all categories with computed product counts
 */
export async function getCategories(): Promise<Category[]> {
  try {
    // 1. Fetch categories
    const { data: cats, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (catError || !cats) {
      console.error('Error fetching categories:', catError?.message);
      return [];
    }

    // 2. Fetch active products to compute accurate live productCount per category
    const { data: prods, error: prodError } = await supabase
      .from('products')
      .select('category_id')
      .eq('is_active', true);

    const countMap: Record<string, number> = {};
    if (prods && !prodError) {
      prods.forEach((p: any) => {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      });
    }

    return cats.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentCategory: c.parent_category || 'Hair Accessories',
      productCount: countMap[c.id] || 0,
      description: c.description || '',
    }));
  } catch (err) {
    console.error('Exception in getCategories:', err);
    return [];
  }
}

/**
 * Fetch single category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;

    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', data.id)
      .eq('is_active', true);

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      parentCategory: data.parent_category || 'Hair Accessories',
      productCount: count || 0,
      description: data.description || '',
    };
  } catch (err) {
    console.error(`Exception in getCategoryBySlug (${slug}):`, err);
    return null;
  }
}

/**
 * Live search across product names, descriptions, and SKUs
 */
export async function searchProducts(queryStr: string, limit: number = 8): Promise<Product[]> {
  const clean = queryStr.trim();
  if (!clean || clean.length < 2) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories ( id, name, slug, parent_category, description )')
      .eq('is_active', true)
      .or(`name.ilike.%${clean}%,description.ilike.%${clean}%,sku.ilike.%${clean}%`)
      .limit(limit);

    if (error || !data) {
      console.error('Error in searchProducts query:', error?.message);
      return [];
    }

    return data.map(mapRowToProduct);
  } catch (err) {
    console.error(`Exception in searchProducts (${queryStr}):`, err);
    return [];
  }
}

/**
 * Fetch New Arrivals (sorted by newest/SKU desc)
 */
export async function getNewArrivals(limit: number = 8): Promise<Product[]> {
  return await getProducts({
    sort: 'newest',
    limit,
    onlyActive: true,
  });
}

/**
 * Fetch Bestsellers (sorted by stock quantity asc / highest demand)
 */
export async function getBestsellers(limit: number = 8): Promise<Product[]> {
  return await getProducts({
    sort: 'bestsellers',
    limit,
    onlyActive: true,
  });
}

/**
 * Fetch related products in the same category
 */
export async function getRelatedProducts(product: Product, limit: number = 4): Promise<Product[]> {
  try {
    const allInCat = await getProducts({
      onlyActive: true,
    });

    return allInCat
      .filter((p) => p.category === product.category && p.sku !== product.sku)
      .slice(0, limit);
  } catch (err) {
    console.error('Exception in getRelatedProducts:', err);
    return [];
  }
}
