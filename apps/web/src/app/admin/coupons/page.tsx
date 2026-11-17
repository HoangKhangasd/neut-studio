'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import {
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from '../../../lib/admin-api';
import { AdminCoupon } from '../../../lib/types';
import { formatVND } from '../../../lib/utils';
import {
  AdminPagination,
  DEFAULT_ADMIN_PAGE_SIZE,
} from '../../../components/admin/AdminPagination';

export default function AdminCouponsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_ADMIN_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(100000);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(100);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    setToken(localStorage.getItem('neut_admin_token'));
  }, []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminCoupons(token, { page, limit });
      setCoupons(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(Math.max(1, res.totalPages || 1));
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token, page, limit]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !code.trim()) return;
    setError('');
    try {
      await createAdminCoupon(token, {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        maxDiscountAmount: discountType === 'PERCENT' ? Number(maxDiscountAmount) || null : null,
        minOrderAmount: Number(minOrderAmount) || 0,
        usageLimit: Number(usageLimit) || 100,
        endDate: new Date(`${endDate}T23:59:59Z`).toISOString(),
      });
      setCode('');
      setPage(1);
      load();
    } catch (e: any) {
      setError(e.message || 'Tạo mã thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-xl font-black uppercase text-black">QUẢN LÝ MÃ GIẢM GIÁ</h1>
          <p className="text-xs font-mono text-neutral-500">Tổng cộng: {total} mã ưu đãi</p>
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

      {/* Quick Create Form */}
      <form
        onSubmit={handleCreate}
        className="border-2 border-black bg-white p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono items-end shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <div>
          <label className="block text-[10px] uppercase font-bold mb-1">Mã Code *</label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="NEUT20"
            className="w-full border border-neutral-300 p-2 uppercase focus:border-black outline-hidden"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold mb-1">Loại</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'PERCENT' | 'FIXED')}
            className="w-full border border-neutral-300 p-2 bg-white focus:border-black outline-hidden"
          >
            <option value="PERCENT">% Phần trăm</option>
            <option value="FIXED">VNĐ Cố định</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold mb-1">Giá trị *</label>
          <input
            type="number"
            min={1}
            required
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold mb-1">Giảm tối đa</label>
          <input
            type="number"
            min={0}
            value={maxDiscountAmount}
            onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
            className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold mb-1">Lượt dùng</label>
          <input
            type="number"
            min={1}
            value={usageLimit}
            onChange={(e) => setUsageLimit(Number(e.target.value))}
            className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold mb-1">Hết hạn *</label>
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white font-bold uppercase hover:bg-neutral-800 inline-flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus size={14} /> Tạo Mã
        </button>
      </form>

      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs font-mono">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Đang tải...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-100 border-b border-black uppercase">
                <tr>
                  <th className="p-3">Mã</th>
                  <th className="p-3">Mức Giảm</th>
                  <th className="p-3">Đã Dùng</th>
                  <th className="p-3">Hết Hạn</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-black text-black">{c.code}</td>
                    <td className="p-3">
                      {c.discountType === 'PERCENT'
                        ? `${c.discountValue}%${c.maxDiscountAmount ? ` (tối đa ${formatVND(c.maxDiscountAmount)})` : ''}`
                        : formatVND(c.discountValue)}
                    </td>
                    <td className="p-3">
                      {c.usedCount} / {c.usageLimit}
                    </td>
                    <td className="p-3">{new Date(c.endDate).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          token && updateAdminCoupon(token, c.id, { isActive: !c.isActive }).then(load)
                        }
                        className={`px-2 py-0.5 border font-bold uppercase text-[10px] cursor-pointer ${
                          c.isActive
                            ? 'bg-green-100 border-green-400 text-green-900'
                            : 'bg-neutral-100 border-neutral-300 text-neutral-500'
                        }`}
                      >
                        {c.isActive ? 'Đang bật' : 'Đã tắt'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          if (!token || !confirm(`Xóa mã ${c.code}?`)) return;
                          deleteAdminCoupon(token, c.id).then(load);
                        }}
                        className="p-1.5 border border-red-400 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          currentCount={coupons.length}
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
