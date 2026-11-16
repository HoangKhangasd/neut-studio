import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, Navigation, CheckCircle } from 'lucide-react';
import { fetchStores } from '../../lib/api';

export const revalidate = 60;

export default async function StoresPage() {
  const stores = await fetchStores();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-mono font-bold tracking-[0.25em] uppercase text-neutral-500 block mb-2">
          FLAGSHIP & RETAIL OUTLETS // VIETNAM
        </span>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black mb-4">
          HỆ THỐNG CỬA HÀNG NEUT-STUDIO
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 font-mono">
          Trải nghiệm trực tiếp chất lượng vải Heavyweight Cotton, thử phom dáng Oversize chuẩn may đo và nhận tư vấn phối đồ từ đội ngũ Stylist tại cửa hàng.
        </p>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {stores.map((store) => (
          <div
            key={store.id}
            className="border-2 border-neutral-200 hover:border-black transition-all p-6 sm:p-8 bg-white flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono font-black uppercase tracking-wider">
                  {store.city}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Đang mở cửa (9:30 - 22:00)
                </span>
              </div>

              <h2 className="text-lg font-black uppercase tracking-tight text-black mb-3">
                {store.name}
              </h2>

              <div className="space-y-2 text-xs text-neutral-600 font-mono mb-6">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>{store.address}, {store.city}</span>
                </p>
                {store.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-black shrink-0" />
                    <a href={`tel:${store.phone}`} className="hover:underline font-bold text-black">
                      {store.phone}
                    </a>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black shrink-0" />
                  <span>9:30 - 22:00 (Mở cửa tất cả các ngày trong tuần)</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${store.name} ${store.address}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black hover:underline"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Chỉ đường trên Google Maps</span>
              </a>

              <Link
                href="/shop"
                className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black"
              >
                Xem sản phẩm &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
