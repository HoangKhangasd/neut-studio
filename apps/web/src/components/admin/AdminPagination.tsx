'use client';

import React from 'react';
import { getVisiblePages, getItemRange } from './pagination';

export const DEFAULT_ADMIN_PAGE_SIZE = 10;
export const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50];

export interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  currentCount: number;
  pageSizeOptions?: number[];
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  total,
  limit,
  currentCount,
  pageSizeOptions = ADMIN_PAGE_SIZE_OPTIONS,
  disabled = false,
  onPageChange,
  onLimitChange,
}: AdminPaginationProps) {
  if (total <= 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const { start, end } = getItemRange(page, limit, total, currentCount);
  const tokens = getVisiblePages(page, safeTotalPages);

  return (
    <div className="p-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono bg-neutral-50">
      <div className="flex flex-wrap items-center gap-3 text-neutral-600">
        <span>
          Hiển thị <strong className="text-black">{start}–{end}</strong> /{' '}
          <strong className="text-black">{total}</strong>
        </span>

        <label className="inline-flex items-center gap-1.5">
          <span className="text-neutral-500">Hiển thị:</span>
          <select
            aria-label="Số mục mỗi trang"
            value={limit}
            disabled={disabled}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border border-neutral-300 bg-white px-2 py-1 text-xs font-mono font-bold text-black focus:border-black outline-hidden cursor-pointer disabled:opacity-40"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / trang
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Phân trang" className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="px-3 py-1 border border-neutral-300 bg-white text-black hover:border-black disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          Trước
        </button>

        {tokens.map((token, idx) =>
          token === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-neutral-400 select-none">
              ...
            </span>
          ) : (
            <button
              key={token}
              type="button"
              disabled={disabled}
              aria-current={token === page ? 'page' : undefined}
              onClick={() => onPageChange(token)}
              className={`min-w-8 px-2.5 py-1 border font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                token === page
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
              }`}
            >
              {token}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={disabled || page >= safeTotalPages}
          onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
          className="px-3 py-1 border border-neutral-300 bg-white text-black hover:border-black disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          Sau
        </button>
      </nav>
    </div>
  );
}
