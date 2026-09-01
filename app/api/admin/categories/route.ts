import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Compute live product counts
    const { data: prods } = await supabase.from('products').select('category_id').eq('is_active', true);
    const countMap: Record<string, number> = {};
    prods?.forEach((p) => {
      countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
    });

    const categoriesWithCounts = (categories || []).map((c) => ({
      ...c,
      productCount: countMap[c.id] || 0,
    }));

    return NextResponse.json({ success: true, categories: categoriesWithCounts });
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
    const { name, slug, parent_category = 'Hair Accessories', description = '' } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Category Name is required.' }, { status: 400 });
    }

    const cleanSlug = (slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');

    const supabase = await createClient();

    const { data: existing } = await supabase.from('categories').select('id').eq('slug', cleanSlug).maybeSingle();
    if (existing) {
      return NextResponse.json({ success: false, error: `Category slug "${cleanSlug}" already exists.` }, { status: 400 });
    }

    const { data: newCat, error: insertErr } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        parent_category: parent_category.trim(),
        description: description.trim(),
      })
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
    }

    try {
      revalidatePath('/products');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, category: newCat });
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
    const { id, name, parent_category, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required.' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (parent_category !== undefined) updates.parent_category = parent_category.trim();
    if (description !== undefined) updates.description = description.trim();

    const supabase = await createClient();

    const { data: updatedCat, error: updateErr } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    try {
      revalidatePath('/products');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, category: updatedCat });
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
      return NextResponse.json({ success: false, error: 'Category ID is required.' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if any products reference this category
    const { count, error: countErr } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countErr) {
      return NextResponse.json({ success: false, error: countErr.message }, { status: 500 });
    }

    if (count && count > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete category because ${count} product(s) are currently assigned to it. Reassign or delete those products first.`,
      }, { status: 400 });
    }

    const { error: deleteErr } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return NextResponse.json({ success: false, error: deleteErr.message }, { status: 500 });
    }

    try {
      revalidatePath('/products');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

