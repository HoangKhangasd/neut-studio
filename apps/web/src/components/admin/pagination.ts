export type PageToken = number | 'ellipsis';

export function getVisiblePages(page: number, totalPages: number): PageToken[] {
  const safeTotal = Math.max(1, totalPages);
  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, i) => i + 1);
  }

  const safePage = Math.max(1, Math.min(safeTotal, page));
  const included = new Set<number>([1, safeTotal]);
  for (let p = safePage - 1; p <= safePage + 1; p++) {
    if (p >= 1 && p <= safeTotal) included.add(p);
  }

  const sorted = Array.from(included).sort((a, b) => a - b);
  const result: PageToken[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('ellipsis');
    }
    result.push(sorted[i]);
  }
  return result;
}

export function getItemRange(
  page: number,
  limit: number,
  total: number,
  currentCount: number,
): { start: number; end: number } {
  if (total <= 0 || currentCount <= 0) {
    return { start: 0, end: 0 };
  }
  const start = (Math.max(1, page) - 1) * Math.max(1, limit) + 1;
  const end = Math.min(total, start + currentCount - 1);
  return { start, end };
}
