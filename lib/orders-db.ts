import { supabase } from '@/lib/supabase';

export interface OrderInput {
  userId?: string;
  userEmail: string;
  totalAmount: number;
  paymentMethod?: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  };
  items: Array<{
    productId?: string;
    productTitle: string;
    quantity: number;
    price: number;
  }>;
}

export async function createOrderInDB(input: OrderInput) {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: input.userId || null,
        user_email: input.userEmail,
        total_amount: input.totalAmount,
        payment_method: input.paymentMethod || 'cod',
        payment_status: 'pending',
        shipping_status: 'processing',
        shipping_address: input.shippingAddress,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order in Supabase:', orderError);
      return { success: false, error: orderError?.message || 'Failed to create order' };
    }

    // Insert order items
    const orderItems = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId || null,
      product_title: item.productTitle,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      console.error('Failed to insert order items:', itemsError);
    }

    return { success: true, orderId: order.id };
  } catch (err: any) {
    console.error('Error creating order in Supabase:', err);
    return { success: false, error: err.message || 'Server error' };
  }
}

export async function getUserOrdersFromDB(userId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (err) {
    console.error('Error fetching user orders from Supabase:', err);
    return [];
  }
}
