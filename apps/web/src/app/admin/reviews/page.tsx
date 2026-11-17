'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Loader2, Star } from 'lucide-react';
import { fetchAdminReviews, deleteAdminReview } from '../../../lib/admin-api';
import { AdminReview } from '../../../lib/types';
import {
  AdminPagination,
  DEFAULT_ADMIN_PAGE_SIZE,
} from '../../../components/admin/AdminPagination';

export default function AdminReviewsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_ADMIN_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('neut_admin_token'));
  }, []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminReviews(token, { page, limit });
      setReviews(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(Math.max(1, res.totalPages || 1));
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token, page, limit]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-xl font-black uppercase text-black">KIỂM DUYỆT ĐÁNH GIÁ</h1>
          <p className="text-xs font-mono text-neutral-500">Tổng cộng: {total} đánh giá sản phẩm</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-black bg-white text-xs font-mono font-bold uppercase cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-500 text-red-700 text-xs font-mono font-bold">
          {error}
        </div>
      )}

      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs font-mono">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Đang tải...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center text-xs font-mono text-neutral-500">
            Chưa có đánh giá nào.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 flex justify-between gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-black uppercase">{rev.customerName}</strong>
                    <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold">
                      <Star size={12} className="fill-amber-500" /> {rev.rating}/5
                    </span>
                    <span className="text-neutral-500">• {rev.productTitle || rev.productId}</span>
                    {rev.purchasedSize && (
                      <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px]">
                        Size {rev.purchasedSize}
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-700 leading-relaxed">{rev.comment}</p>
                </div>
                <button
                  onClick={() => {
                    if (!token || !confirm('Xóa đánh giá này?')) return;
                    deleteAdminReview(token, rev.id).then(load);
                  }}
                  className="p-1.5 h-fit border border-red-400 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer shrink-0"
                  title="Xóa đánh giá"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          currentCount={reviews.length}
          disabled={loading}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
