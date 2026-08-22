import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const supabase = await createClient();

    // 1. Products stats
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, sku, name, price, stock_quantity, is_active, category_id');

    // 2. Categories count
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // 3. Orders stats
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status, shipping_status, created_at, user_email')
      .order('created_at', { ascending: false });

    const totalProducts = products?.length || 0;
    const activeProducts = products?.filter((p) => p.is_active).length || 0;
    const lowStockProducts = products?.filter((p) => p.stock_quantity < 10) || [];
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
    const pendingOrders = orders?.filter((o) => o.shipping_status === 'processing').length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        lowStockCount: lowStockProducts.length,
        categoriesCount: categoriesCount || 0,
        totalOrders,
        totalRevenue,
        pendingOrders,
      },
      lowStockProducts: lowStockProducts.slice(0, 5),
      recentOrders: (orders || []).slice(0, 5),
    });
  } catch (err: any) {
    console.error('Error in GET /api/admin/stats:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
