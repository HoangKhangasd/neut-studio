import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Ruler } from 'lucide-react';

export const metadata = {
  title: 'Bảng Thông Số Chọn Size Chuẩn Streetwear | Neut-Studio',
  description: 'Bảng quy đổi thông số kích thước áo thun Oversize, Hoodie và quần Jean chuẩn phom dáng người Việt.',
};

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-neutral-500 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500 block mb-1">
            FIT & SIZING MATRIX // OVERSIZED SILHOUETTE
          </span>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            BẢNG THÔNG SỐ CHỌN SIZE TIÊU CHUẨN
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-mono mt-1">
            Tất cả sản phẩm Neut-Studio được may theo form dáng Oversize rộng rãi chuẩn phong cách Streetwear đương đại.
          </p>
        </div>

        {/* 1. Tops Sizing Table */}
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              <span>1. ÁO THUN & HOODIE (HEAVYWEIGHT TOPS)</span>
            </h2>
            <span className="text-xs font-mono text-neutral-500">Đơn vị: Centimet (cm)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="bg-black text-white uppercase text-[11px]">
                  <th className="p-3">Size</th>
                  <th className="p-3">Dài Áo</th>
                  <th className="p-3">Rộng Ngực</th>
                  <th className="p-3">Rộng Vai</th>
                  <th className="p-3">Dài Tay</th>
                  <th className="p-3">Gợi Ý Chiều Cao</th>
                  <th className="p-3">Gợi Ý Cân Nặng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-black">S</td>
                  <td className="p-3">70 cm</td>
                  <td className="p-3">54 cm</td>
                  <td className="p-3">52 cm</td>
                  <td className="p-3">22 cm</td>
                  <td className="p-3">1m55 - 1m65</td>
                  <td className="p-3">45 - 55 kg</td>
                </tr>
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-black">M</td>
                  <td className="p-3">73 cm</td>
                  <td className="p-3">57 cm</td>
                  <td className="p-3">55 cm</td>
                  <td className="p-3">23 cm</td>
                  <td className="p-3">1m65 - 1m75</td>
                  <td className="p-3">55 - 70 kg</td>
                </tr>
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-black">L</td>
                  <td className="p-3">76 cm</td>
                  <td className="p-3">60 cm</td>
                  <td className="p-3">58 cm</td>
                  <td className="p-3">24 cm</td>
                  <td className="p-3">1m75 - 1m82</td>
                  <td className="p-3">70 - 85 kg</td>
                </tr>
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-black">XL</td>
                  <td className="p-3">79 cm</td>
                  <td className="p-3">63 cm</td>
                  <td className="p-3">61 cm</td>
                  <td className="p-3">25 cm</td>
                  <td className="p-3">&gt; 1m80</td>
                  <td className="p-3">&gt; 85 kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Bottoms Sizing Table */}
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              <span>2. QUẦN JEAN & SHORT (WIDE-LEG BOTTOMS)</span>
            </h2>
            <span className="text-xs font-mono text-neutral-500">Đơn vị: Centimet (cm)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="bg-black text-white uppercase text-[11px]">
                  <th className="p-3">Size</th>
                  <th className="p-3">Vòng Eo (Lưng)</th>
                  <th className="p-3">Vòng Mông</th>
                  <th className="p-3">Rộng Đùi</th>
                  <th className="p-3">Dài Quần</th>
                  <th className="p-3">Rộng Ống</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-black">S (28 - 29)</td>
                  <td className="p-3">76 - 78 cm</td>
                  <td className="p-3">102 cm</td>
                  <td className="p-3">62 cm</td>
                  <td className="p-3">100 cm</td>
                  <td className="p-3">24 cm</td>
                </tr>
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-black">M (30 - 31)</td>
                  <td className="p-3">80 - 82 cm</td>
                  <td className="p-3">106 cm</td>
                  <td className="p-3">64 cm</td>
                  <td className="p-3">103 cm</td>
                  <td className="p-3">25 cm</td>
                </tr>
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-black">L (32 - 33)</td>
                  <td className="p-3">84 - 86 cm</td>
                  <td className="p-3">110 cm</td>
                  <td className="p-3">66 cm</td>
                  <td className="p-3">105 cm</td>
                  <td className="p-3">26 cm</td>
                </tr>
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-black">XL (34 - 35)</td>
                  <td className="p-3">88 - 92 cm</td>
                  <td className="p-3">114 cm</td>
                  <td className="p-3">68 cm</td>
                  <td className="p-3">107 cm</td>
                  <td className="p-3">27 cm</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tip Box */}
        <div className="p-5 bg-neutral-900 text-white border border-black font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>MẸO CHỌN PHOM DÁNG TỪ NEUT-STYLIST:</span>
          </div>
          <p className="text-neutral-300 leading-relaxed">
            • Nếu bạn thích phom <strong>Oversize thụng rũ Streetwear đúng điệu</strong>: Hãy chọn đúng theo bảng thông số trên.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            • Nếu bạn thích mặc <strong>vừa vặn Regular Fit gọn gàng</strong>: Có thể lùi xuống 1 size so với bảng kích thước.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            • Vẫn còn phân vân? Bạn có thể sử dụng công cụ <strong>AI Fit Finder</strong> tại trang chi tiết mỗi sản phẩm để hệ thống tính toán size chính xác dựa trên chiều cao và cân nặng.
          </p>
        </div>
      </div>
    </div>
  );
}
