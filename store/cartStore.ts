// ═══════════════════════════════════════════════════════════════
// SARANG LIVING — Cart Store (Zustand + localStorage)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/products';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      addItem: (product: Product, quantity: number = 1) => {
        const { items } = get();
        const existing = items.find((item) => item.product.sku === product.sku);

        if (existing) {
          set({
            items: items.map((item) =>
              item.product.sku === product.sku
                ? { ...item, quantity: Math.min(item.quantity + quantity, product.stockQuantity) }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
      },

      removeItem: (sku: string) => {
        set({ items: get().items.filter((item) => item.product.sku !== sku) });
      },

      updateQuantity: (sku: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(sku);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.sku === sku
              ? { ...item, quantity: Math.min(quantity, item.product.stockQuantity) }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    }),
    {
      name: 'sarang-cart',
      // Only persist items, not UI state
      partialize: (state) => ({ items: state.items }),
    }
  )
);
