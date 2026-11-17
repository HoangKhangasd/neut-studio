import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getVisiblePages, getItemRange } from './pagination.ts';

describe('getVisiblePages', () => {
  it('returns all pages when totalPages <= 7', () => {
    assert.deepEqual(getVisiblePages(1, 5), [1, 2, 3, 4, 5]);
    assert.deepEqual(getVisiblePages(1, 1), [1]);
    assert.deepEqual(getVisiblePages(4, 7), [1, 2, 3, 4, 5, 6, 7]);
  });

  it('inserts trailing ellipsis near start', () => {
    assert.deepEqual(getVisiblePages(1, 10), [1, 2, 'ellipsis', 10]);
    assert.deepEqual(getVisiblePages(2, 10), [1, 2, 3, 'ellipsis', 10]);
  });

  it('inserts both ellipses in the middle', () => {
    assert.deepEqual(getVisiblePages(5, 10), [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  });

  it('inserts leading ellipsis near end', () => {
    assert.deepEqual(getVisiblePages(9, 10), [1, 'ellipsis', 8, 9, 10]);
    assert.deepEqual(getVisiblePages(10, 10), [1, 'ellipsis', 9, 10]);
  });
});

describe('getItemRange', () => {
  it('computes 1-based start and end for full and partial pages', () => {
    assert.deepEqual(getItemRange(1, 10, 25, 10), { start: 1, end: 10 });
    assert.deepEqual(getItemRange(3, 10, 25, 5), { start: 21, end: 25 });
  });

  it('returns 0-0 when total or currentCount is 0', () => {
    assert.deepEqual(getItemRange(1, 10, 0, 0), { start: 0, end: 0 });
    assert.deepEqual(getItemRange(5, 10, 12, 0), { start: 0, end: 0 });
  });
});
