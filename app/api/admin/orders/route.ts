import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const supabase = await createClient();

    let query = supabase
      .from('orders')
      .select('*, order_items (*)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('shipping_status', status);
    }

    const { data: orders, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders: orders || [] });
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
    const { id, shipping_status, tracking_number, payment_status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID required.' }, { status: 400 });
    }

    const updates: any = {};
    if (shipping_status !== undefined) updates.shipping_status = shipping_status;
    if (tracking_number !== undefined) updates.tracking_number = tracking_number.trim();
    if (payment_status !== undefined) updates.payment_status = payment_status;

    const supabase = await createClient();

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select('*, order_items (*)')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
