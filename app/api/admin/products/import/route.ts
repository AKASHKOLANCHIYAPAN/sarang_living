import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin authorization required.' }, { status: 403 });
    }

    const body = await request.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, error: 'No product rows provided for import.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch all live categories to resolve category names to UUIDs
    const { data: allCategories, error: catErr } = await supabase
      .from('categories')
      .select('id, name, slug');

    if (catErr) {
      return NextResponse.json({ success: false, error: 'Failed to load categories for mapping.' }, { status: 500 });
    }

    const categoryMap = new Map<string, string>();
    allCategories?.forEach((c) => {
      categoryMap.set(c.name.toLowerCase().trim(), c.id);
      categoryMap.set(c.slug.toLowerCase().trim(), c.id);
      categoryMap.set(c.id.toLowerCase().trim(), c.id);
    });

    // 2. Fetch all existing SKUs and slugs to prevent collisions
    const { data: existingProducts } = await supabase.from('products').select('sku, slug');
    const existingSkus = new Set(existingProducts?.map((p) => p.sku.toUpperCase()) || []);
    const existingSlugs = new Set(existingProducts?.map((p) => p.slug.toLowerCase()) || []);

    const validInserts: any[] = [];
    const errors: { row: number; sku?: string; error: string }[] = [];
    const batchSeenSkus = new Set<string>();
    const batchSeenSlugs = new Set<string>();

    // 3. Validate each product row
    products.forEach((prod: any, idx: number) => {
      const rowNum = idx + 1;
      const sku = prod.sku ? String(prod.sku).trim().toUpperCase() : '';
      const name = prod.name ? String(prod.name).trim() : '';
      const rawPrice = prod.price;
      const rawComparePrice = prod.compare_at_price;
      const rawStock = prod.stock_quantity;
      const rawCategory = prod.category || prod.category_name || prod.category_id || '';

      // Validation
      if (!sku) {
        errors.push({ row: rowNum, error: 'SKU is required.' });
        return;
      }
      if (batchSeenSkus.has(sku)) {
        errors.push({ row: rowNum, sku, error: `Duplicate SKU "${sku}" found within uploaded CSV.` });
        return;
      }
      if (existingSkus.has(sku)) {
        errors.push({ row: rowNum, sku, error: `SKU "${sku}" already exists in the store catalog.` });
        return;
      }

      if (!name) {
        errors.push({ row: rowNum, sku, error: 'Product Name is required.' });
        return;
      }

      const price = Number(rawPrice);
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, sku, error: `Invalid price "${rawPrice}". Price must be >= 0.` });
        return;
      }

      let compare_at_price: number | null = null;
      if (rawComparePrice !== undefined && rawComparePrice !== null && String(rawComparePrice).trim() !== '') {
        const parsedCompare = Number(rawComparePrice);
        if (isNaN(parsedCompare) || parsedCompare < 0) {
          errors.push({ row: rowNum, sku, error: `Invalid compare_at_price "${rawComparePrice}".` });
          return;
        }
        compare_at_price = parsedCompare;
      }

      const stock_quantity = rawStock !== undefined && rawStock !== null && String(rawStock).trim() !== ''
        ? Math.floor(Number(rawStock))
        : 20;

      if (isNaN(stock_quantity) || stock_quantity < 0) {
        errors.push({ row: rowNum, sku, error: `Invalid stock quantity "${rawStock}". Must be >= 0.` });
        return;
      }

      // Resolve category
      const cleanCatKey = String(rawCategory).toLowerCase().trim();
      const resolvedCatId = categoryMap.get(cleanCatKey);
      if (!resolvedCatId) {
        errors.push({ row: rowNum, sku, error: `Category "${rawCategory}" not found in database. Please create it first in Categories.` });
        return;
      }

      // Slug generation
      let slug = prod.slug ? String(prod.slug).trim().toLowerCase() : '';
      if (!slug) {
        slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sku.toLowerCase()}`.replace(/^-+|-+$/g, '');
      }

      if (batchSeenSlugs.has(slug) || existingSlugs.has(slug)) {
        slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      // Images
      let imagesArr = ['/products/SL001.png'];
      if (Array.isArray(prod.images) && prod.images.length > 0) {
        imagesArr = prod.images;
      } else if (typeof prod.images === 'string' && prod.images.trim()) {
        try {
          const parsed = JSON.parse(prod.images);
          if (Array.isArray(parsed)) imagesArr = parsed;
          else imagesArr = [prod.images.trim()];
        } catch {
          imagesArr = prod.images.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      // is_active
      let is_active = true;
      if (prod.is_active !== undefined) {
        const strVal = String(prod.is_active).toLowerCase().trim();
        is_active = strVal === 'true' || strVal === '1' || strVal === 'yes';
      }

      batchSeenSkus.add(sku);
      batchSeenSlugs.add(slug);

      validInserts.push({
        sku,
        name,
        slug,
        price,
        compare_at_price,
        category_id: resolvedCatId,
        description: prod.description ? String(prod.description).trim() : '',
        images: imagesArr,
        stock_quantity,
        is_active,
      });
    });

    if (validInserts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid products could be imported. Please review the errors.',
        errors,
      }, { status: 400 });
    }

    // 4. Batch insert valid products
    const { data: inserted, error: insertErr } = await supabase
      .from('products')
      .insert(validInserts)
      .select('id, sku, name');

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message, errors }, { status: 500 });
    }

    // Revalidate customer storefront
    try {
      revalidatePath('/products');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      importedCount: inserted?.length || 0,
      importedSkus: inserted?.map((p) => p.sku) || [],
      errors,
    });
  } catch (err: any) {
    console.error('Error in POST /api/admin/products/import:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
