'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Boxes,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { fetchAdminOrders, fetchAdminProducts, updateAdminVariantStock } from '../../lib/api';
import { formatVND } from '../../lib/utils';
import { AdminProduct } from '../../lib/types';

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('neut_admin_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      // shortcut: dashboard loads up to 100 orders/products, move to a dedicated stats endpoint once catalog or orders exceed 100
      const [ordersRes, prodsRes] = await Promise.all([
        fetchAdminOrders(token, { page: 1, limit: 100 }),
        fetchAdminProducts(token, { page: 1, limit: 100 }),
      ]);

      const orderData = ordersRes.data || [];
      const prodData = prodsRes.data || [];
      setOrders(orderData);
      setProducts(prodData);
      setTotalOrders(ordersRes.total ?? orderData.length);
      setTotalProducts(prodsRes.total ?? prodData.length);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('neut_admin_token');
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddStock = async (productId: string, variantId: string, currentStock: number) => {
    if (!token) return;
    setStockUpdatingId(variantId);

    try {
      await updateAdminVariantStock(variantId, { stockQuantity: currentStock + 10 }, token);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                variants: p.variants.map((v) =>
                  v.id === variantId ? { ...v, stockQuantity: currentStock + 10 } : v,
                ),
              }
            : p,
        ),
      );
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật tồn kho');
    } finally {
      setStockUpdatingId(null);
    }
  };

  // Metrics
  const validOrders = orders.filter((o) => o.orderStatus !== 'CANCELLED');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'PENDING').length;

  // Low stock variants
  const lowStockItems: Array<{
    productId: string;
    productTitle: string;
    variantId: string;
    size: string;
    colorName: string;
    stockQuantity: number;
  }> = [];

  for (const prod of products) {
    for (const v of prod.variants) {
      if (v.stockQuantity < 5) {
        lowStockItems.push({
          productId: prod.id,
          productTitle: prod.title,
          variantId: v.id,
          size: v.size,
          colorName: v.colorName || 'Đen',
          stockQuantity: v.stockQuantity,
        });
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-xl font-black uppercase text-black tracking-tight">
            TỔNG QUAN HỆ THỐNG // DASHBOARD
          </h1>
          <p className="text-xs font-mono text-neutral-500">
            Thống kê tình hình vận hành bán hàng & kho hàng Neut-Studio
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-black bg-white hover:bg-neutral-100 text-xs font-mono font-bold uppercase cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Làm Mới Dữ Liệu</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu */}
        <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold">Doanh Thu (Thực Nhận)</span>
            <TrendingUp size={16} className="text-green-600" />
          </div>
          <div className="text-2xl font-black text-black tracking-tight">
            {formatVND(totalRevenue)}
          </div>
          <p className="text-[10px] font-mono text-neutral-400 mt-1">
            Loại trừ {orders.length - validOrders.length} đơn đã hủy
          </p>
        </div>

        {/* Tổng đơn hàng */}
        <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold">Tổng Đơn Hàng</span>
            <Package size={16} className="text-black" />
          </div>
          <div className="text-2xl font-black text-black tracking-tight">{totalOrders}</div>
          <p className="text-[10px] font-mono text-neutral-400 mt-1">Đơn phát sinh toàn thời gian</p>
        </div>

        {/* Đơn chờ xử lý */}
        <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold">Đơn Chờ Xử Lý</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {pendingOrdersCount}
          </div>
          <p className="text-[10px] font-mono text-neutral-400 mt-1">Cần xác nhận và chuẩn bị hàng</p>
        </div>

        {/* Sản phẩm trong kho */}
        <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold">Sản Phẩm Trong Kho</span>
            <Boxes size={16} className="text-black" />
          </div>
          <div className="text-2xl font-black text-black tracking-tight">{totalProducts}</div>
          <p className="text-[10px] font-mono text-neutral-400 mt-1">
            {lowStockItems.length} biến thể sắp hết
          </p>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/orders"
          className="group block p-6 bg-black text-white border-2 border-black hover:bg-neutral-900 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-neutral-400">
              Module Quản Trị
            </span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform text-white"
            />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-2">QUẢN LÝ ĐƠN HÀNG &rarr;</h3>
          <p className="text-xs text-neutral-300 font-mono">
            Xem danh sách {totalOrders} đơn hàng, đổi trạng thái CONFIRMED, SHIPPING, COMPLETED,
            hoặc hủy hoàn kho.
          </p>
        </Link>

        <Link
          href="/admin/products"
          className="group block p-6 bg-white text-black border-2 border-black hover:bg-neutral-50 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-neutral-500">
              Module Kho Hàng
            </span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform text-black"
            />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-2">QUẢN LÝ KHO SẢN PHẨM &rarr;</h3>
          <p className="text-xs text-neutral-600 font-mono">
            Quản lý {totalProducts} sản phẩm, cập nhật tồn kho từng size, thêm mới ảnh MinIO S3,
            chỉnh sửa hoặc xóa.
          </p>
        </Link>
      </div>

      {/* Low Stock Alerts */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black uppercase tracking-wider text-black">
              CẢNH BÁO TỒN KHO THẤP (&lt; 5 SẢN PHẨM)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300">
            {lowStockItems.length} CẢNH BÁO
          </span>
        </div>

        {lowStockItems.length === 0 ? (
          <p className="text-xs font-mono text-neutral-500 py-4 text-center">
            Tất cả các biến thể trong kho hiện đang có số lượng an toàn (&ge; 5 cái).
          </p>
        ) : (
          <div className="divide-y divide-neutral-200">
            {lowStockItems.slice(0, 8).map((item) => (
              <div
                key={item.variantId}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div>
                  <p className="font-bold text-black uppercase">{item.productTitle}</p>
                  <p className="text-[11px] text-neutral-500">
                    Size: <strong>{item.size}</strong> • Màu: {item.colorName} • Tồn hiện tại:{' '}
                    <span className="text-red-600 font-bold">{item.stockQuantity} cái</span>
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleQuickAddStock(item.productId, item.variantId, item.stockQuantity)
                  }
                  disabled={stockUpdatingId === item.variantId}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-black bg-neutral-50 hover:bg-black hover:text-white transition-colors uppercase font-bold text-[11px] cursor-pointer disabled:opacity-50"
                >
                  {stockUpdatingId === item.variantId ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <span>+10 Vào Kho</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
