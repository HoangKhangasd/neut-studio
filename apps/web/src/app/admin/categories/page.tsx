'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../../../lib/admin-api';

export default function AdminCategoriesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    setToken(localStorage.getItem('neut_admin_token'));
  }, []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setCategories(await fetchAdminCategories(token));
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setError('');
    try {
      await createAdminCategory(token, { name: name.trim(), description, sortOrder });
      setName('');
      setDescription('');
      load();
    } catch (e: any) {
      setError(e.message || 'Không thể tạo danh mục');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-xl font-black uppercase text-black">QUẢN LÝ DANH MỤC</h1>
          <p className="text-xs font-mono text-neutral-500">Tổng cộng: {categories.length} danh mục</p>
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

      <form
        onSubmit={handleCreate}
        className="border-2 border-black bg-white p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono items-end shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <div>
          <label className="block text-[10px] uppercase font-bold mb-1">Tên danh mục *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Outerwear"
            className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold mb-1">Mô tả</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Áo khoác, Jacket..."
            className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold mb-1">Thứ tự</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white font-bold uppercase hover:bg-neutral-800 inline-flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus size={14} /> Thêm Danh Mục
        </button>
      </form>

      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs font-mono">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Đang tải...
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-100 border-b border-black uppercase">
              <tr>
                <th className="p-3">Tên</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Thứ tự</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-black text-black">{cat.name}</td>
                  <td className="p-3 text-neutral-500">{cat.slug}</td>
                  <td className="p-3">{cat.sortOrder}</td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        token && updateAdminCategory(token, cat.id, { isActive: !cat.isActive }).then(load)
                      }
                      className={`px-2 py-0.5 border font-bold uppercase text-[10px] cursor-pointer ${
                        cat.isActive
                          ? 'bg-green-100 border-green-400 text-green-900'
                          : 'bg-neutral-100 border-neutral-300 text-neutral-500'
                      }`}
                    >
                      {cat.isActive ? 'Hiển thị' : 'Đang ẩn'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        if (!token || !confirm(`Xóa danh mục "${cat.name}"?`)) return;
                        deleteAdminCategory(token, cat.id).then(load);
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
        )}
      </div>
    </div>
  );
}
