'use client';

import React, { useEffect, useState } from 'react';
import { X, MapPin, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { checkStoreInventory } from '../../lib/api';
import { StoreLocation } from '../../lib/types';

interface StoreInventoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  variantId?: string;
  productTitle: string;
  colorName?: string;
  size?: string;
}

export function StoreInventoryDrawer({
  isOpen,
  onClose,
  variantId,
  productTitle,
  colorName,
  size,
}: StoreInventoryDrawerProps) {
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && variantId) {
      setLoading(true);
      checkStoreInventory(variantId)
        .then((data) => setStores(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, variantId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white text-black h-full flex flex-col shadow-2xl animate-slide-left">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-black">
              TỒN KHO TẠI HỆ THỐNG CỬA HÀNG
            </h3>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              {productTitle} {size ? `• Size ${size}` : ''} {colorName ? `• Màu ${colorName}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-neutral-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-xs font-mono uppercase tracking-widest">
                Đang tra cứu dữ liệu thời gian thực...
              </span>
            </div>
          ) : stores.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 text-xs font-mono">
              Vui lòng chọn Size & Màu sắc để kiểm tra số lượng tại từng chi nhánh.
            </div>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                className="p-4 border border-neutral-200 hover:border-black transition-colors bg-neutral-50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-black uppercase text-black">
                    {store.name}
                  </h4>
                  {store.inStock ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-none">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      CÒN HÀNG ({store.stock})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded-none">
                      <AlertCircle className="w-3 h-3 text-neutral-400" />
                      TẠM HẾT
                    </span>
                  )}
                </div>

                <div className="text-xs text-neutral-600 space-y-1">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                    <span>{store.address}, {store.city}</span>
                  </p>
                  {store.phone && (
                    <p className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <a href={`tel:${store.phone}`} className="hover:underline text-black font-semibold">
                        {store.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Advice */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 text-xs text-neutral-600 font-mono">
          <p>
            * Lưu ý: Tồn kho thực tế tại cửa hàng có thể thay đổi nhanh chóng do khách mua trực tiếp. Khách hàng vui lòng gọi hotline chi nhánh trước khi ghé để giữ sản phẩm.
          </p>
        </div>
      </div>

      <div className="flex-1" onClick={onClose} />
    </div>
  );
}
