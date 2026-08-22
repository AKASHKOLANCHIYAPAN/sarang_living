import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ShippingAddressInput } from '@/lib/orders-db';

interface CreateOrderItemInput {
  sku: string;
  quantity: number;
}

interface CreateOrderRequestBody {
  items: CreateOrderItemInput[];
  addressId?: string;
  address?: ShippingAddressInput;
  saveAddress?: boolean;
  paymentMethod?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to place an order.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateOrderRequestBody;
    const { items, addressId, address, saveAddress, paymentMethod = 'cod' } = body;

    // 2. Validate Items Array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Your cart is empty. Please add items before checking out.' },
        { status: 400 }
      );
    }

    // Validate quantities
    for (const item of items) {
      if (!item.sku || typeof item.sku !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid product SKU in cart.' },
          { status: 400 }
        );
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity for SKU ${item.sku}. Quantity must be at least 1.` },
          { status: 400 }
        );
      }
      if (item.quantity > 50) {
        return NextResponse.json(
          { success: false, error: `Maximum quantity per item is 50 for SKU ${item.sku}.` },
          { status: 400 }
        );
      }
    }

    // 3. Query Database for Authoritative Product Prices & Stock
    const skus = items.map((i) => i.sku);
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, sku, name, price, stock_quantity, is_active')
      .in('sku', skus);

    if (prodErr || !dbProducts) {
      return NextResponse.json(
        { success: false, error: 'Failed to verify products in database.' },
        { status: 500 }
      );
    }

    // Check that every requested SKU was found and is active
    const dbProductMap = new Map<string, (typeof dbProducts)[0]>();
    dbProducts.forEach((p) => dbProductMap.set(p.sku, p));

    let calculatedTotal = 0;
    const validatedOrderItems: {
      product_id: string;
      product_title: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of items) {
      const prod = dbProductMap.get(item.sku);
      if (!prod) {
        return NextResponse.json(
          { success: false, error: `Product with SKU "${item.sku}" does not exist in our catalog.` },
          { status: 400 }
        );
      }

      if (!prod.is_active) {
        return NextResponse.json(
          { success: false, error: `Product "${prod.name}" (${prod.sku}) is currently unavailable.` },
          { status: 400 }
        );
      }

      if (item.quantity > prod.stock_quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${prod.name}". Only ${prod.stock_quantity} available.`,
          },
          { status: 400 }
        );
      }

      const authoritativePrice = Number(prod.price);
      calculatedTotal += authoritativePrice * item.quantity;

      validatedOrderItems.push({
        product_id: prod.id,
        product_title: prod.name,
        quantity: item.quantity,
        price: authoritativePrice,
      });
    }

    // 4. Resolve Shipping Address
    let resolvedAddress: ShippingAddressInput;

    if (addressId) {
      // Fetch saved address belonging to this user
      const { data: savedAddr, error: addrErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .eq('user_id', user.id)
        .single();

      if (addrErr || !savedAddr) {
        return NextResponse.json(
          { success: false, error: 'Selected address was not found or does not belong to your account.' },
          { status: 400 }
        );
      }

      resolvedAddress = {
        recipient_name: savedAddr.recipient_name,
        phone: savedAddr.phone,
        street: savedAddr.street,
        city: savedAddr.city,
        state: savedAddr.state,
        postal_code: savedAddr.postal_code,
      };
    } else if (address) {
      // Validate address fields
      if (
        !address.recipient_name?.trim() ||
        !address.phone?.trim() ||
        !address.street?.trim() ||
        !address.city?.trim() ||
        !address.state?.trim() ||
        !address.postal_code?.trim()
      ) {
        return NextResponse.json(
          { success: false, error: 'Please provide all required delivery address fields.' },
          { status: 400 }
        );
      }

      resolvedAddress = {
        recipient_name: address.recipient_name.trim(),
        phone: address.phone.trim(),
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        postal_code: address.postal_code.trim(),
      };

      // If requested, save to public.addresses
      if (saveAddress) {
        await supabase.from('addresses').insert({
          user_id: user.id,
          recipient_name: resolvedAddress.recipient_name,
          phone: resolvedAddress.phone,
          street: resolvedAddress.street,
          city: resolvedAddress.city,
          state: resolvedAddress.state,
          postal_code: resolvedAddress.postal_code,
          is_default: Boolean(address.is_default),
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid delivery address.' },
        { status: 400 }
      );
    }

    // 5. Generate Tracking Number Preview
    const trackingNumber = `SL-IN-${Math.floor(100000 + Math.random() * 900000)}`;

    // 6. Insert Order into public.orders
    const { data: newOrder, error: orderInsertErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        user_email: user.email || resolvedAddress.phone,
        total_amount: calculatedTotal,
        payment_status: 'pending',
        payment_method: paymentMethod,
        shipping_status: 'processing',
        shipping_address: resolvedAddress,
        tracking_number: trackingNumber,
      })
      .select('id, total_amount, tracking_number, created_at')
      .single();

    if (orderInsertErr || !newOrder) {
      console.error('Error inserting order:', orderInsertErr);
      return NextResponse.json(
        { success: false, error: 'Failed to create order. Please try again.' },
        { status: 500 }
      );
    }

    // 7. Insert Order Items into public.order_items
    const orderItemsToInsert = validatedOrderItems.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      product_title: item.product_title,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsInsertErr } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsInsertErr) {
      console.error('Error inserting order items:', itemsInsertErr);
      // Attempt cleanup of orphaned order
      await supabase.from('orders').delete().eq('id', newOrder.id);
      return NextResponse.json(
        { success: false, error: 'Failed to save order items.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      totalAmount: newOrder.total_amount,
      trackingNumber: newOrder.tracking_number,
      createdAt: newOrder.created_at,
    });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/orders:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('*, order_items (*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersErr) {
      return NextResponse.json(
        { success: false, error: ordersErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
