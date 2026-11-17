'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Loader2, Search } from 'lucide-react';
import { fetchAdminUsers, updateAdminUserRole, deleteAdminUser } from '../../../lib/admin-api';
import { User } from '../../../lib/types';
import {
  AdminPagination,
  DEFAULT_ADMIN_PAGE_SIZE,
} from '../../../components/admin/AdminPagination';

export default function AdminUsersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_ADMIN_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('neut_admin_token'));
  }, []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminUsers(token, { page, limit, search: appliedSearch });
      setUsers(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(Math.max(1, res.totalPages || 1));
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token, page, limit, appliedSearch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-xl font-black uppercase text-black">QUẢN LÝ NGƯỜI DÙNG</h1>
          <p className="text-xs font-mono text-neutral-500">Tổng cộng: {total} tài khoản đang hoạt động</p>
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
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedSearch(searchTerm.trim());
          setPage(1);
        }}
        className="flex gap-2 max-w-md"
      >
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo email, tên, SĐT..."
          className="flex-1 border border-neutral-300 p-2 text-xs font-mono bg-white focus:border-black outline-hidden"
        />
        <button type="submit" className="px-3 py-2 bg-black text-white cursor-pointer">
          <Search size={14} />
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
                  <th className="p-3">Họ Tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">SĐT</th>
                  <th className="p-3">Vai Trò</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-bold text-black">{u.fullName}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 text-neutral-500">{u.phone || '—'}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => {
                          if (!token) return;
                          updateAdminUserRole(token, u.id, e.target.value as any)
                            .then(load)
                            .catch((err) => setError(err.message));
                        }}
                        className="border border-neutral-300 p-1 bg-white text-xs font-mono font-bold"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="STAFF">STAFF</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          if (!token || !confirm(`Vô hiệu hóa tài khoản ${u.email}?`)) return;
                          deleteAdminUser(token, u.id)
                            .then(load)
                            .catch((err) => setError(err.message));
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
          currentCount={users.length}
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
