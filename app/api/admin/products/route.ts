import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const supabase = await createClient();
    let query = supabase
      .from('products')
      .select('*, categories ( id, name, slug )')
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: products, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, products: products || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      sku,
      name,
      slug,
      price,
      compare_at_price,
      category_id,
      description,
      images,
      stock_quantity = 0,
      is_active = true,
    } = body;

    // 1. Validation
    if (!sku?.trim()) {
      return NextResponse.json({ success: false, error: 'Product SKU is required.' }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Product Name is required.' }, { status: 400 });
    }
    if (!category_id) {
      return NextResponse.json({ success: false, error: 'Please select a valid Category.' }, { status: 400 });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ success: false, error: 'Price must be a valid non-negative number.' }, { status: 400 });
    }
    if (compare_at_price !== undefined && compare_at_price !== null && compare_at_price !== '' && (isNaN(Number(compare_at_price)) || Number(compare_at_price) < 0)) {
      return NextResponse.json({ success: false, error: 'Compare-at price must be a valid non-negative number.' }, { status: 400 });
    }
    if (isNaN(Number(stock_quantity)) || Number(stock_quantity) < 0) {
      return NextResponse.json({ success: false, error: 'Stock quantity cannot be negative.' }, { status: 400 });
    }

    const cleanSku = sku.trim().toUpperCase();
    const cleanSlug = (slug?.trim() || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${cleanSku.toLowerCase()}`)
      .replace(/^-+|-+$/g, '');

    const supabase = await createClient();

    // 2. Check for duplicate SKU
    const { data: existingSku } = await supabase.from('products').select('id').eq('sku', cleanSku).maybeSingle();
    if (existingSku) {
      return NextResponse.json({ success: false, error: `SKU "${cleanSku}" already exists. Please choose a unique SKU.` }, { status: 400 });
    }

    // 3. Check for duplicate Slug
    const { data: existingSlug } = await supabase.from('products').select('id').eq('slug', cleanSlug).maybeSingle();
    if (existingSlug) {
      return NextResponse.json({ success: false, error: `Slug "${cleanSlug}" already exists. Please choose a unique slug.` }, { status: 400 });
    }

    // Format images array
    let imagesArr = ['/products/SL001.png'];
    if (Array.isArray(images) && images.length > 0) {
      imagesArr = images;
    } else if (typeof images === 'string' && images.trim()) {
      imagesArr = [images.trim()];
    }

    // 4. Insert into database
    const { data: newProd, error: insertErr } = await supabase
      .from('products')
      .insert({
        sku: cleanSku,
        name: name.trim(),
        slug: cleanSlug,
        price: Number(price),
        compare_at_price: compare_at_price ? Number(compare_at_price) : null,
        category_id,
        description: description?.trim() || '',
        images: imagesArr,
        stock_quantity: Math.floor(Number(stock_quantity)),
        is_active: Boolean(is_active),
      })
      .select('*, categories ( id, name, slug )')
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
    }

    // Revalidate customer storefront
    try {
      revalidatePath('/products');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, product: newProd });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, sku, name, slug, price, compare_at_price, category_id, description, images, stock_quantity, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required for updates.' }, { status: 400 });
    }

    const updates: any = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category_id !== undefined) updates.category_id = category_id;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) < 0) {
        return NextResponse.json({ success: false, error: 'Price must be non-negative.' }, { status: 400 });
      }
      updates.price = Number(price);
    }

    if (compare_at_price !== undefined) {
      updates.compare_at_price = compare_at_price ? Number(compare_at_price) : null;
    }

    if (stock_quantity !== undefined) {
      if (isNaN(Number(stock_quantity)) || Number(stock_quantity) < 0) {
        return NextResponse.json({ success: false, error: 'Stock cannot be negative.' }, { status: 400 });
      }
      updates.stock_quantity = Math.floor(Number(stock_quantity));
    }

    if (images !== undefined) {
      updates.images = Array.isArray(images) ? images : [images];
    }

    const supabase = await createClient();

    const { data: updatedProd, error: updateErr } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*, categories ( id, name, slug )')
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Revalidate customer storefront
    try {
      revalidatePath('/products');
      if (updatedProd?.slug) revalidatePath(`/products/${updatedProd.slug}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, product: updatedProd });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required.' }, { status: 400 });
    }

    const supabase = await createClient();

    // Deactivate / archive instead of hard delete to protect historical order FK references
    const { data: deactivatedProd, error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .select('id, sku, is_active')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/products');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Product archived successfully.', product: deactivatedProd });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
