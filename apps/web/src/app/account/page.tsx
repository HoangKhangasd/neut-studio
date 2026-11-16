'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronRight,
  Copy,
  Check,
  ShoppingBag,
  Loader2,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth-store';
import { fetchMyOrders } from '../../lib/api';
import { CustomerOrder } from '../../lib/types';
import { formatVND } from '../../lib/utils';

export default function AccountPage() {
  const router = useRouter();
  const { user, token, logout, openAuthModal } = useAuthStore();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  useEffect(() => {
    if (!token) return;

    setLoadingOrders(true);
    fetchMyOrders(token)
      .then((data) => {
        setOrders(data);
      })
      .catch((err) => {
        setErrorOrders(err.message || 'Không thể tải lịch sử đơn hàng');
      })
      .finally(() => {
        setLoadingOrders(false);
      });
  }, [token]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // If unauthenticated, show prompt to log in
  if (!token || !user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <div className="border-2 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <UserIcon className="w-12 h-12 mx-auto text-black mb-4 stroke-1" />
          <span className="text-[11px] font-mono font-black uppercase tracking-widest text-neutral-500 block mb-1">
            ACCOUNT ACCESS // TRUY CẬP TÀI KHOẢN
          </span>
          <h1 className="text-xl font-black uppercase text-black mb-3">
            BẠN CHƯA ĐĂNG NHẬP
          </h1>
          <p className="text-xs font-mono text-neutral-600 mb-6 leading-relaxed">
            Vui lòng đăng nhập hoặc tạo tài khoản thành viên để theo dõi đơn hàng, địa chỉ giao hàng và nhận ưu đãi độc quyền từ Neut-Studio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => openAuthModal('login')}
              className="flex-1 py-3 bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
            >
              ĐĂNG NHẬP NGAY
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="flex-1 py-3 bg-white text-black border-2 border-black hover:bg-neutral-100 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
            >
              TẠO TÀI KHOẢN
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold uppercase">
            <Clock size={12} /> Tiếp Nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-mono font-bold uppercase">
            <Package size={12} /> Chuẩn Bị
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-mono font-bold uppercase">
            <Truck size={12} /> Đang Giao
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-900 border border-green-300 text-[10px] font-mono font-bold uppercase">
            <CheckCircle2 size={12} /> Thành Công
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 border border-neutral-300 text-[10px] font-mono font-bold uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Top Profile Header */}
      <div className="bg-black text-white p-6 sm:p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white text-black flex items-center justify-center font-black text-2xl font-mono border-2 border-white">
              {user.fullName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  {user.fullName}
                </h1>
                <span className="bg-neutral-800 text-[10px] font-mono text-neutral-300 px-2 py-0.5 border border-neutral-700 uppercase tracking-widest">
                  NEUT CITIZEN // {user.role}
                </span>
              </div>
              <p className="text-xs font-mono text-neutral-400">
                {user.email} {user.phone && `• ${user.phone}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-8">
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-400 block tracking-wider">
                Tổng đơn hàng
              </span>
              <span className="text-xl font-mono font-black">{orders.length}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-400 block tracking-wider">
                Tổng chi tiêu
              </span>
              <span className="text-xl font-mono font-black text-white">
                {formatVND(totalSpent)}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer shrink-0 ml-auto md:ml-0"
              title="Đăng xuất tài khoản"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-black text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Lịch Sử Đơn Hàng ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-black text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Thông Tin Cá Nhân
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div>
          {loadingOrders ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-black mb-3" />
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                Đang tải dữ liệu đơn hàng...
              </p>
            </div>
          ) : errorOrders ? (
            <div className="p-6 bg-red-50 border-2 border-red-500 text-red-700 text-xs font-mono">
              {errorOrders}
            </div>
          ) : orders.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-300 p-12 text-center bg-white">
              <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h2 className="text-base font-black uppercase text-black mb-2">
                BẠN CHƯA CÓ ĐƠN HÀNG NÀO
              </h2>
              <p className="text-xs font-mono text-neutral-500 mb-6">
                Các sản phẩm bạn đặt hàng sẽ được lưu trữ và cập nhật trạng thái vận chuyển tại đây.
              </p>
              <Link
                href="/shop"
                className="inline-block px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                KHÁM PHÁ SẢN PHẨM MỚI
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-black text-black">
                          {order.orderCode}
                        </span>
                        <button
                          onClick={() => copyCode(order.orderCode)}
                          className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                          title="Sao chép mã đơn"
                        >
                          {copiedCode === order.orderCode ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-neutral-500">
                        Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')} lúc{' '}
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.orderStatus)}
                      <Link
                        href={`/order-success?code=${order.orderCode}`}
                        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-black hover:underline uppercase tracking-wider"
                      >
                        <span>Theo dõi</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-neutral-100 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-black uppercase tracking-tight">{item.productTitle}</p>
                          <p className="text-[11px] font-mono text-neutral-500">
                            {item.variantColor} / Size {item.variantSize} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-black">
                          {formatVND(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <div className="text-neutral-600">
                      <span>Giao đến: </span>
                      <strong className="text-black">
                        {order.shippingAddress.street}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.province}
                      </strong>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-neutral-500 uppercase">Tổng thanh toán:</span>
                      <span className="text-base font-black text-black">
                        {formatVND(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white border-2 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-lg font-black uppercase tracking-tight text-black mb-6 pb-2 border-b-2 border-black">
            THÔNG TIN THÀNH VIÊN
          </h2>

          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200">
              <UserIcon className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Họ và tên</span>
                <span className="font-bold text-black text-sm">{user.fullName}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200">
              <Mail className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Địa chỉ Email</span>
                <span className="font-bold text-black text-sm">{user.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200">
              <Phone className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Số điện thoại</span>
                <span className="font-bold text-black text-sm">{user.phone || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200">
              <ShieldCheck className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Vai trò hệ thống</span>
                <span className="font-bold text-black text-sm">{user.role}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-200 flex justify-between items-center">
            <button
              onClick={() => logout()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              ĐĂNG XUẤT TÀI KHOẢN
            </button>
            <Link
              href="/shop"
              className="text-xs font-mono font-bold text-black hover:underline uppercase"
            >
              Quay lại mua sắm →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
