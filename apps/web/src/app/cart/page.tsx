'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag, Truck, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../stores/cart-store';
import { formatVND } from '../../lib/utils';

const FREESHIP_THRESHOLD = 1000000;
const STANDARD_SHIPPING_FEE = 30000;

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          ĐANG TẢI GIỎ HÀNG...
        </span>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const isFreeship = subtotal >= FREESHIP_THRESHOLD;
  const missingForFreeship = Math.max(0, FREESHIP_THRESHOLD - subtotal);
  const freeshipProgress = Math.min(100, Math.round((subtotal / FREESHIP_THRESHOLD) * 100));
  const shippingFee = items.length === 0 ? 0 : isFreeship ? 0 : STANDARD_SHIPPING_FEE;
  const estimatedTotal = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center mb-6">
          <ShoppingBag className="w-8 h-8 text-neutral-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-2">
          GIỎ HÀNG CỦA BẠN ĐANG TRỐNG
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-mono max-w-md mb-8">
          Chưa có sản phẩm nào được chọn. Hãy khám phá bộ sưu tập Heavyweight Cotton và phụ kiện Streetwear mới nhất.
        </p>
        <Link
          href="/shop"
          className="px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
        >
          <span>KHÁM PHÁ CATALOG NGAY</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-neutral-500 hover:text-black mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tiếp tục mua hàng</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            GIỎ HÀNG CỦA BẠN ({items.length} SẢN PHẨM)
          </h1>
        </div>

        {/* Freeship Progress Bar */}
        <div className="mb-8 p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase mb-2">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-black" />
              {isFreeship ? (
                <span className="text-emerald-700">ĐÃ ĐẠT ĐIỀU KIỆN FREESHIP TOÀN QUỐC</span>
              ) : (
                <span>
                  MUA THÊM <span className="text-red-600 font-black">{formatVND(missingForFreeship)}</span> ĐỂ ĐƯỢC MIỄN PHÍ VẬN CHUYỂN
                </span>
              )}
            </span>
            <span className="text-neutral-500">{freeshipProgress}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isFreeship ? 'bg-emerald-600' : 'bg-black'}`}
              style={{ width: `${freeshipProgress}%` }}
            />
          </div>
        </div>

        {/* 2-column Grid: Items vs Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border-2 border-black divide-y divide-neutral-200">
              {items.map((item) => (
                <div key={item.variantId} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="relative w-20 h-24 shrink-0 bg-neutral-100 border border-neutral-200 overflow-hidden">
                      <Image
                        src={item.imageUrl}
                        alt={item.productTitle}
                        fill
                        className="object-cover object-center"
                        sizes="80px"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="text-sm font-black uppercase text-black hover:underline line-clamp-1"
                      >
                        {item.productTitle}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs font-mono text-neutral-600">
                        <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300">
                          {item.colorName}
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300">
                          Size {item.size}
                        </span>
                      </div>
                      <p className="text-xs font-black font-mono text-black mt-2">
                        {formatVND(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-black">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-1.5 hover:bg-neutral-100 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center font-mono text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="p-1.5 hover:bg-neutral-100 transition-colors"
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total item price */}
                    <span className="font-mono font-black text-sm text-black min-w-[90px] text-right">
                      {formatVND(item.price * item.quantity)}
                    </span>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white border-2 border-black p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sticky top-24">
              <h2 className="text-sm font-black uppercase tracking-wider text-black pb-3 border-b border-black">
                TỔNG KẾT ĐƠN HÀNG
              </h2>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>Tạm tính hàng:</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold">MIỄN PHÍ</span>
                    ) : (
                      formatVND(shippingFee)
                    )}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-3 flex justify-between text-sm font-black text-black">
                  <span>TỔNG CỘNG:</span>
                  <span>{formatVND(estimatedTotal)}</span>
                </div>
                <p className="text-[11px] text-neutral-500 font-mono pt-1">
                  * Mã giảm giá (Coupon) sẽ được áp dụng tại bước thanh toán.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>TIẾN HÀNH THANH TOÁN (COD)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/shop"
                  className="w-full py-2.5 border border-neutral-300 text-neutral-800 text-xs font-bold uppercase tracking-wider hover:border-black flex items-center justify-center transition-colors block text-center"
                >
                  TIẾP TỤC CHỌN THÊM SẢN PHẨM
                </Link>
              </div>

              {/* Guarantees */}
              <div className="border-t border-neutral-200 pt-4 space-y-2 text-[11px] font-mono text-neutral-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>Đổi trả tận nơi trong 15 ngày</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>Đồng kiểm trước khi thanh toán COD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
