'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Heart, Lock, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import {
  fetchAddresses,
  createAddress,
  setDefaultAddress,
  deleteAddress,
  fetchWishlist,
  removeFromWishlist,
  changePassword,
} from '../../lib/account-api';
import { UserAddress, WishlistItem } from '../../lib/types';
import { formatVND } from '../../lib/utils';

export function AccountAddressesTab({ token }: { token: string }) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    recipientName: '',
    phoneNumber: '',
    province: 'TP. Hồ Chí Minh',
    district: '',
    ward: '',
    streetAddress: '',
    isDefault: true,
  });

  const load = () => {
    setLoading(true);
    fetchAddresses(token)
      .then(setAddresses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAddress(token, form);
      setForm({
        recipientName: '',
        phoneNumber: '',
        province: 'TP. Hồ Chí Minh',
        district: '',
        ward: '',
        streetAddress: '',
        isDefault: false,
      });
      load();
    } catch (e: any) {
      setError(e.message || 'Không thể lưu địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-3">
        {loading ? (
          <div className="p-8 border-2 border-black bg-white text-center text-xs font-mono">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang tải sổ địa chỉ...
          </div>
        ) : addresses.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-neutral-300 bg-white text-center text-xs font-mono text-neutral-500">
            Chưa có địa chỉ giao hàng nào được lưu.
          </div>
        ) : (
          addresses.map((addr) => (
            <div key={addr.id} className="p-4 border-2 border-black bg-white flex justify-between gap-4">
              <div className="text-xs font-mono space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <strong className="uppercase text-black">{addr.recipientName}</strong>
                  <span className="text-neutral-500">• {addr.phoneNumber}</span>
                  {addr.isDefault && (
                    <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-bold uppercase">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-neutral-600">
                  {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                </p>
              </div>
              <div className="flex items-start gap-1.5 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => setDefaultAddress(token, addr.id).then(load)}
                    className="px-2 py-1 border border-black text-[10px] font-mono font-bold uppercase hover:bg-black hover:text-white cursor-pointer"
                  >
                    Đặt mặc định
                  </button>
                )}
                <button
                  onClick={() => deleteAddress(token, addr.id).then(load)}
                  className="p-1.5 border border-red-400 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                  title="Xóa địa chỉ"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 border-2 border-black bg-white p-5 space-y-3 text-xs font-mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-fit"
      >
        <h3 className="font-black uppercase text-sm border-b border-black pb-2 flex items-center gap-2">
          <Plus size={14} /> Thêm địa chỉ mới
        </h3>
        {error && <div className="p-2 bg-red-50 border border-red-500 text-red-700">{error}</div>}
        <input
          required
          placeholder="Họ tên người nhận *"
          value={form.recipientName}
          onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
          className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
        />
        <input
          required
          placeholder="Số điện thoại *"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            required
            placeholder="Tỉnh/TP *"
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
            className="border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
          <input
            required
            placeholder="Quận/Huyện *"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            className="border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
          <input
            required
            placeholder="Phường/Xã *"
            value={form.ward}
            onChange={(e) => setForm({ ...form, ward: e.target.value })}
            className="border border-neutral-300 p-2 focus:border-black outline-hidden"
          />
        </div>
        <input
          required
          placeholder="Số nhà, tên đường *"
          value={form.streetAddress}
          onChange={(e) => setForm({ ...form, streetAddress: e.target.value })}
          className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          <span>Đặt làm địa chỉ giao hàng mặc định</span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-black text-white font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu địa chỉ'}
        </button>
      </form>
    </div>
  );
}

export function AccountWishlistTab({ token }: { token: string }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchWishlist(token)
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="p-10 border-2 border-black bg-white text-center text-xs font-mono">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang tải sản phẩm yêu thích...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-12 border-2 border-dashed border-neutral-300 bg-white text-center text-xs font-mono text-neutral-500">
        <Heart className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
        Bạn chưa lưu sản phẩm yêu thích nào.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.id} className="border-2 border-black bg-white p-4 flex gap-3 items-center">
          <div className="relative w-16 h-16 bg-neutral-100 border border-neutral-200 shrink-0">
            <Image
              src={item.coverImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400'}
              alt={item.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${item.slug}`}
              className="text-xs font-black uppercase text-black hover:underline block truncate"
            >
              {item.title}
            </Link>
            <p className="text-xs font-mono font-bold text-black mt-0.5">{formatVND(item.minPrice)}</p>
            <span className="text-[10px] font-mono text-neutral-500">
              {item.inStock ? 'Còn hàng' : 'Hết hàng'}
            </span>
          </div>
          <button
            onClick={() => removeFromWishlist(token, item.productId).then(load)}
            className="p-1.5 border border-neutral-300 hover:border-red-500 hover:text-red-600 cursor-pointer"
            title="Gỡ khỏi yêu thích"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ChangePasswordCard({ token }: { token: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setErr('');
    try {
      const res = await changePassword(token, { currentPassword, newPassword });
      setMsg(res.message || 'Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: any) {
      setErr(e.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 pt-6 border-t-2 border-black space-y-3 text-xs font-mono"
    >
      <h3 className="font-black uppercase text-sm flex items-center gap-2">
        <Lock size={14} /> Đổi mật khẩu
      </h3>
      {err && <div className="p-2.5 bg-red-50 border border-red-500 text-red-700 font-bold">{err}</div>}
      {msg && (
        <div className="p-2.5 bg-green-50 border border-green-600 text-green-800 font-bold flex items-center gap-1.5">
          <Check size={14} /> {msg}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="password"
          required
          placeholder="Mật khẩu hiện tại"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="border border-neutral-300 p-2 focus:border-black outline-hidden"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border border-neutral-300 p-2 focus:border-black outline-hidden"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 bg-black text-white font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
      >
        {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
      </button>
    </form>
  );
}
