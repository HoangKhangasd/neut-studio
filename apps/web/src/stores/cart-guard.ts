import type { CartItem } from '../lib/types';

export function computeNextCartItems(
  items: CartItem[],
  item: Omit<CartItem, 'quantity'>,
  quantity = 1,
): CartItem[] | null {
  if (item.maxStock <= 0 || quantity <= 0) {
    return null;
  }

  const existingIndex = items.findIndex((i) => i.variantId === item.variantId);
  if (existingIndex > -1) {
    const updatedItems = [...items];
    const current = updatedItems[existingIndex];
    const maxStock = Math.min(current.maxStock, item.maxStock);
    if (maxStock <= 0) return null;
    updatedItems[existingIndex] = {
      ...current,
      maxStock,
      quantity: Math.min(maxStock, current.quantity + quantity),
    };
    return updatedItems;
  }

  return [...items, { ...item, quantity: Math.min(item.maxStock, quantity) }];
}
