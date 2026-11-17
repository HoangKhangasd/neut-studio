import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeNextCartItems } from './cart-guard.ts';

const baseItem = {
  variantId: 'v-1',
  productId: 'p-1',
  productTitle: 'Boxy Tee',
  productSlug: 'boxy-tee',
  imageUrl: 'https://img/1.jpg',
  colorName: 'Black',
  size: 'L',
  price: 350000,
  maxStock: 5,
};

describe('computeNextCartItems', () => {
  it('returns null when maxStock <= 0 or quantity <= 0', () => {
    assert.equal(computeNextCartItems([], { ...baseItem, maxStock: 0 }, 1), null);
    assert.equal(computeNextCartItems([], { ...baseItem, maxStock: -2 }, 1), null);
    assert.equal(computeNextCartItems([], baseItem, 0), null);
    assert.equal(computeNextCartItems([], baseItem, -1), null);
  });

  it('adds new item clamped to maxStock and merges existing item quantities', () => {
    const added = computeNextCartItems([], baseItem, 10);
    assert.equal(added?.length, 1);
    assert.equal(added?.[0].quantity, 5);

    const existing = [{ ...baseItem, quantity: 3 }];
    const merged = computeNextCartItems(existing, baseItem, 4);
    assert.equal(merged?.[0].quantity, 5);
  });
});
