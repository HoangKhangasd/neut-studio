'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../stores/cart-store';
import { formatVND } from '../../lib/utils';

export function MiniCartDrawer() {
  const { isCartOpen, closeCart, items, removeItem, updateQuantity, getSubtotal } = useCartStore();

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const freeshipThreshold = 1000000;
  const progressPercent = Math.min(100, Math.round((subtotal / freeshipThreshold) * 100));
  const remainingForFreeship = Math.max(0, freeshipThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Giỏ hàng ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
          </div>
          <button onClick={closeCart} className="p-1 hover:opacity-60">
            <X size={20} />
          </button>
        </div>

        {/* Freeship Progress */}
        <div className="p-3 bg-neutral-100 border-b border-neutral-200 text-xs">
          {remainingForFreeship > 0 ? (
            <p className="text-neutral-700">
              Mua thêm <strong className="text-black">{formatVND(remainingForFreeship)}</strong> để được <strong>FREESHIP</strong>
            </p>
          ) : (
            <p className="text-black font-bold">🎉 Bạn đã đủ điều kiện được FREESHIP toàn quốc!</p>
          )}
          <div className="w-full bg-neutral-300 h-1.5 mt-2 rounded-none overflow-hidden">
            <div
              className="bg-black h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-neutral-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ShoppingBag size={48} className="text-neutral-300 mb-4" />
              <p className="text-sm font-bold uppercase tracking-wider text-neutral-800">
                Giỏ hàng của bạn đang trống
              </p>
              <button
                onClick={closeCart}
                className="mt-6 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="pt-4 first:pt-0 flex gap-3">
                <div className="relative w-20 h-20 bg-neutral-100 flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.productTitle}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 line-clamp-1">
                      {item.productTitle}
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {item.colorName} / {item.size}
                    </p>
                    <p className="text-xs font-bold mt-1 text-black">
                      {formatVND(item.price)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-neutral-300">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-1 hover:bg-neutral-100"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="p-1 hover:bg-neutral-100"
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-neutral-200 bg-white space-y-3">
            <div className="flex justify-between items-baseline text-sm">
              <span className="uppercase text-neutral-500 font-medium">Tạm tính:</span>
              <span className="text-base font-extrabold text-black">{formatVND(subtotal)}</span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full block text-center py-3.5 bg-black text-white text-xs font-extrabold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
            >
              Tiến hành thanh toán
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
