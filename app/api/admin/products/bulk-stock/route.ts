import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = body; // array of { sku: string, stock_quantity: number }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No stock updates provided.' }, { status: 400 });
    }

    const supabase = await createClient();
    let updatedCount = 0;
    const errors: any[] = [];

    for (const item of updates) {
      const sku = item.sku?.trim().toUpperCase();
      const stock = Number(item.stock_quantity);

      if (!sku || isNaN(stock) || stock < 0) {
        errors.push({ sku, error: `Invalid SKU or negative stock quantity.` });
        continue;
      }

      const { data, error } = await supabase
        .from('products')
        .update({ stock_quantity: Math.floor(stock) })
        .eq('sku', sku)
        .select('sku, stock_quantity');

      if (error || !data || data.length === 0) {
        errors.push({ sku, error: `Product SKU "${sku}" not found.` });
      } else {
        updatedCount++;
      }
    }

    try {
      revalidatePath('/products');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      updatedCount,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
