// ═══════════════════════════════════════════════════════════════
// SARANG LIVING — Orders & Address Types and Helpers (Phase 4)
// ═══════════════════════════════════════════════════════════════

export interface ShippingAddressInput {
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  is_default?: boolean;
}

export interface UserAddress extends ShippingAddressInput {
  id: string;
  user_id: string;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_title: string;
  quantity: number;
  price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id?: string;
  user_email: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  shipping_status: string;
  shipping_address: ShippingAddressInput;
  tracking_number?: string;
  created_at: string;
  order_items?: OrderItem[];
}
