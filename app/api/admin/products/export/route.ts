import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories ( name )')
      .order('sku', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Convert products to CSV
    const headers = [
      'sku',
      'name',
      'slug',
      'price',
      'compare_at_price',
      'category',
      'description',
      'images',
      'stock_quantity',
      'is_active',
    ];

    const rows = (products || []).map((p) => {
      const escape = (str: any) => {
        if (str === null || str === undefined) return '';
        const s = String(str).replace(/"/g, '""');
        return `"${s}"`;
      };

      const imagesStr = Array.isArray(p.images) ? JSON.stringify(p.images) : p.images || '';

      return [
        p.sku,
        escape(p.name),
        p.slug,
        p.price,
        p.compare_at_price || '',
        escape(p.categories?.name || 'General'),
        escape(p.description || ''),
        escape(imagesStr),
        p.stock_quantity,
        p.is_active ? 'true' : 'false',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sarang-living-products-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
