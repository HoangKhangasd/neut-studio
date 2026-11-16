import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../lib/types';

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  isSearchOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      isSearchOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),

      addItem: (item, quantity = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.variantId === item.variantId);

        if (existingIndex > -1) {
          const updatedItems = [...items];
          const newQty = Math.min(
            updatedItems[existingIndex].maxStock,
            updatedItems[existingIndex].quantity + quantity,
          );
          updatedItems[existingIndex].quantity = newQty;
          set({ items: updatedItems, isCartOpen: true });
        } else {
          set({
            items: [...items, { ...item, quantity: Math.min(item.maxStock, quantity) }],
            isCartOpen: true,
          });
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.min(item.maxStock, quantity) }
              : item,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'neut-cart-storage',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
